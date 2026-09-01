# KioskLite 从 CRACO/Webpack 迁移到 Vite 的设计

日期：2026-07-10

状态：已批准

实施分支：`feat/4.9.5-vite`

## 1. 背景与目标

KioskLite 当前使用 Create React App、CRACO 和 Webpack 构建，云上 TeamCity 构建耗时较长。本次迁移把项目脚手架替换为 Vite，并尽量保持现有业务依赖、运行时行为、静态资源路径和部署产物契约不变。

完成标准如下：

1. 项目使用 Vite 启动和构建，不再依赖 CRACO、`react-scripts` 与 Webpack 构建链。
2. Node.js 基线设置为 `>=22.12.0 <23`。
3. TeamCity 和本地均使用 npm，使用公共 npm registry。
4. React、React DOM 及现有业务依赖尽量保持当前实际解析版本不变。
5. 加入 Vite legacy 构建，覆盖项目要求的旧浏览器目标。
6. 本地开发服务器可以启动，并完成页面、控制台和网络请求检查。
7. 开发、测试、生产三个环境均能成功构建，并验证产物契约。
8. 最终生产产物安全替换到指定 Tomcat 目录。
9. 访问 `http://localhost:22080/kpos/kiosklite`，通过浏览器、HTTP、控制台和网络请求验证部署结果。
10. 最终报告包含变更清单、构建结果、耗时、部署校验和未验证边界。

## 2. 已确认约束

- 包管理器：npm。
- npm registry：`https://registry.npmjs.org/`。
- Node.js：`>=22.12.0 <23`；本机验证使用已安装的 Node.js 22 版本。
- TeamCity 只能使用 npm，因此以 `package-lock.json` 和 `npm ci` 作为可复现安装入口。
- 保持 React 17.0.2、React DOM 17.0.2，并尽量锁定当前 `yarn.lock` 实际解析的业务依赖版本。
- 保留现有 `build:dev`、`build:qa`、`build` 等调用习惯，同时补齐清晰的测试/生产别名时保持向后兼容。
- Vite legacy 构建会增加构建耗时和产物体积，该成本已被接受。
- 不批量重命名现有包含 JSX 的 `.js` 文件。
- 不修改业务价格计算逻辑、POS 原生桥协议或外部脚本接口。
- 用户现有未跟踪的 `build/` 和 `docs/KioskLite智能推荐策略说明.pdf` 不属于本次改造，必须保留。

## 3. 总体方案

采用“兼容优先、最终完全替换”的方案：

1. 先记录当前 CRACO 构建基线，并保留可比较的耗时与结果。
2. 引入 Vite 8、React 插件和 legacy 插件，建立可启动、可构建的最小配置。
3. 逐项迁移 CRACO 中的别名、环境变量、代理、样式、资源路径、source map 和输出目录规则。
4. 用 Vite 的 Oxc 转换接口兼容 `src/**/*.js` 中的 JSX，避免 215 个左右文件的机械重命名。
5. 仅把运行时 `require('big.js')` 改为等价 ESM 导入，消除浏览器运行时 CommonJS 依赖。
6. 把必须经 Vite 转换的 HTML 内联脚本迁入源码模块，并显式保留 POS/WebView 全局函数契约。
7. 用项目内 postbuild 脚本恢复 CRA 时代的 manifest、gzip、版本文件和目录契约。
8. 把测试从 Jest 运行入口迁移到 Vitest，补充产物和安全部署脚本的契约测试。
9. 三环境构建全部通过后，删除旧构建链文件和 Yarn 锁文件。
10. 通过“暂存目录 + 哈希校验 + 原子切换 + 失败回滚”替换 Tomcat 资源，最后进行浏览器验收。

## 4. 依赖与锁文件策略

### 4.1 新增构建依赖

计划加入并精确锁定：

- `vite@8.1.4`
- `@vitejs/plugin-react@6.0.3`
- `@vitejs/plugin-legacy@8.2.0`
- `terser@5.49.0`
- `vitest@4.1.10`
- `jsdom@28.1.0`

`jsdom` 不采用更新的 29.x，因为其 Node.js 最低版本高于已确认的 22.12.0 基线。

项目源码直接引用了 `core-js`，因此把当前锁文件中的 `core-js@3.46.0` 作为直接依赖明确声明，避免依赖传递关系变化后缺包。

### 4.2 现有依赖

- React 与 React DOM 保持 17.0.2。
- 现有直接依赖优先从 `yarn.lock` 读取实际解析版本，并写成精确版本，避免从 Yarn 切换到 npm 后因 `^` 范围产生无关升级。
- 只删除确定属于 CRACO/CRA/Webpack 构建链、且 Vite 验证通过后不再使用的直接依赖。
- 不借本次迁移升级 UI 库、Redux、路由、国际化或业务 SDK。

### 4.3 npm 安装策略

新增 `.npmrc`：

```ini
registry=https://registry.npmjs.org/
legacy-peer-deps=true
engine-strict=true
```

`legacy-peer-deps=true` 是兼容现有依赖图所需，而不是隐藏未知问题。已确认的旧 peer 声明包括 `react-mobile-picker`、`react-switch` 和 `redux-thunk`；本次不通过升级业务包扩大迁移范围。

最终生成并提交 `package-lock.json`，TeamCity 使用：

```bash
npm ci
```

## 5. Vite 配置设计

### 5.1 React 与 `.js` 中的 JSX

Vite 配置中添加一个 `enforce: 'pre'` 的本地插件，对 `src/**/*.js` 调用 Vite 官方 `transformWithOxc`，并以 JSX 语言模式转换。该插件必须放在 React 插件之前。

同时在依赖预构建扫描配置中把 `.js` 识别为 JSX，保证冷启动扫描和正式转换保持一致。这样不重新引入 Babel，也不批量改动源码扩展名。

### 5.2 基础配置

- `base: './'`，保持 Tomcat 子路径和离线相对资源引用。
- `resolve.alias['@']` 指向 `src`，保留大量既有别名导入。
- 开发服务器端口保持 3000，保留 CORS 和当前代理规则。
- 保留现有 PostCSS、Sass 和 CSS Modules 行为。
- CSS Modules 类名继续使用 `[local]___[hash:base64:5]`。
- 输出目录为 `dist`，静态目录必须保持：
  - `dist/static/js`
  - `dist/static/css`
  - `dist/static/media`
- 生产构建生成隐藏 source map，并排除 map 中的源码正文；开发和测试构建生成完整 source map。

### 5.3 legacy 目标

通过官方 `@vitejs/plugin-legacy` 生成现代和旧版双轨产物，目标覆盖：

- Android 4.4
- iOS 9 / Safari 9
- Chrome 60

legacy 插件负责应用本身的语法降级和必要 polyfill。它不能转换 Tomcat 上独立提供的第三方脚本，因此旧设备端到端兼容仍受外部脚本限制，详见“已知边界”。

## 6. 环境变量与构建命令

现有代码只依赖 `process.env.REACT_APP_ENV` 和 `process.env.NODE_ENV`。Vite 配置只精确注入这两个键，不注入整个 `process.env`，避免把本机或 TeamCity 环境变量泄露进前端包。

环境映射如下：

| 命令 | Vite mode | `REACT_APP_ENV` | `NODE_ENV` |
| --- | --- | --- | --- |
| `npm start` | development | development | development |
| `npm run build:dev` | development | development | production |
| `npm run build:test` / `npm run build:qa` | integration | integration | production |
| `npm run build:prod` / `npm run build` | production | production | production |

三个构建都写入干净的 `dist`。验证阶段会在每次构建后保存命令结果、耗时和产物契约证据；最后只部署生产构建。

## 7. HTML、启动入口与 POS 原生桥

### 7.1 HTML 入口

- 把 CRA 的 `public/index.html` 迁为仓库根目录的 Vite `index.html`。
- React 模块入口改为 Vite 的模块脚本。
- `public/bridge.js` 继续作为经典脚本加载，并保持在 React 入口之前。
- GTM 片段保留现有 ES5 兼容行为。
- `globalThis` 回退改为纯 ES5 的 `window.globalThis = window` 形式，确保在 polyfill 之前也能执行。

### 7.2 原生桥全局契约

把当前 HTML 中包含现代语法、且应由 Vite 处理的 POS/WebView 桥逻辑迁移到源码模块。以下函数继续显式挂载到 `window`，名称和调用方式不变：

- `getDeviceInfo`
- `getIngenicoDeviceSNAndDeviceInfo`
- `bridgeCall`
- `loadPaymentInfo`
- `loadCreditCardInfoByIngenico`
- `saveLicenseName`
- `checkIngenicoReadyForTransaction`
- `abortIngenicoTransaction`
- `changePayConnectType`
- `cancelDeviceConnect`
- `saveSecretKeyAndroid`
- `getSecretKeyAndroid`
- `afterGetSecretKeyFromAndroid`
- `isAndroidShell`

同时保留以下外部协议：

- `window.WebViewJavascriptBridge.handleMessageFromNative`
- `afterGetSecretKeyFromAndroid` 字符串回调名
- `CR_on...` 系列回调
- `androidWebkit`
- `jsBridgeManager`

页面主包加载失败时仍需工作的 loading/retry 回退逻辑留在 HTML，但改成纯 ES5，并明确暴露 `retryConnection`、`hideInitialLoading`、`loadingState`、`refreshTimer`。

### 7.3 外部脚本

删除 HTML 中重复的动态 vendor loader，只保留原有静态加载顺序。以下脚本由 Tomcat 提供，不属于本仓库、也不会被 Vite legacy 转换：

- `/kpos/js/jquery-2.0.3.min.js`
- `/kpos/img/gallery/js/calculator.js`
- promotion 脚本
- market SDK 脚本

应用继续使用它们的既有全局接口，不在本次迁移中重写第三方实现。

## 8. CommonJS 兼容处理

源码中已确认有 26 个运行时 `require('big.js')`。逐个改为：

```js
import Big from 'big.js';
```

只改变模块加载方式，不改变 Big.js 调用、精度、舍入或业务公式。除此之外不进行无关 ESM 重构。

## 9. 构建产物契约

Vite 原生 manifest 保留为 postbuild 的输入；项目自有 `scripts/postbuild.mjs` 负责生成对外兼容产物，避免依赖第三方插件拼接多个行为。

最终 `dist` 必须包含：

```text
dist/
├── index.html
├── asset-manifest.json
├── version.json
├── public/
│   └── version.json
└── static/
    ├── js/
    ├── css/
    └── media/
```

### 9.1 `asset-manifest.json`

保持 CRA 契约：

```json
{
  "files": {},
  "entrypoints": []
}
```

- `files` 值使用 `./` 开头的相对路径。
- `entrypoints` 保持 CSS 在前、JS 在后，并保持既有不带 `./` 的格式。
- manifest 不纳入 `.gz`、根版本文件或直接复制的 public 文件。

### 9.2 gzip

postbuild 对构建编译资产按旧配置生成同路径 `.gz`：

- 保留原文件。
- gzip 级别和候选资产范围与旧构建保持一致。
- 仅当压缩比小于等于旧配置阈值时保留 gzip 文件。
- 不把所有 public 文件无差别压缩。

### 9.3 版本文件

三个环境构建都生成：

- `dist/version.json`
- `dist/public/version.json`

内容来源保持现有版本逻辑，并通过契约测试保证两个文件有效。

### 9.4 打包脚本

`build-and-zip.js` 和 `build-test.js` 改为 npm 命令，但保留原有环境顺序、ZIP 命名和 ZIP 根目录结构。任何子构建或压缩失败都必须向上传递非零退出码，不能吞掉错误后返回成功。

## 10. 测试设计

### 10.1 现有测试迁移

现有三个 React 测试迁移到 Vitest：

- Jest mock API 等价替换为 Vitest API。
- 测试中的 CommonJS `fs`、`path` 改为 ESM 导入。
- 保持断言意图不变，不借迁移改变组件行为。

### 10.2 新增契约测试

为以下高风险边界增加自动测试：

1. postbuild 可以从 Vite manifest 生成 CRA 形状 manifest。
2. 所有 manifest 路径满足相对路径约束。
3. gzip 只覆盖允许的构建资产，原文件仍存在。
4. 两个版本文件均存在且可解析。
5. 三个静态目录存在。
6. 部署脚本拒绝错误目标、reparse point、缺失源产物和不完整产物。
7. 部署文件集与哈希校验失败时不切换线上目录。

## 11. 安全部署设计

唯一允许的目标目录为：

```text
C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite
```

部署步骤：

1. 验证源目录严格等于当前仓库的 `dist`，并验证完整产物契约。
2. 解析目标及父目录的绝对路径，确认与上面的固定路径完全一致。
3. 拒绝符号链接、junction 或其他 reparse point。
4. 把生产 `dist` 复制到目标同级的唯一暂存目录。
5. 比较源与暂存目录的相对文件集合和每个文件的 SHA-256。
6. 把当前目标重命名为唯一备份目录。
7. 把暂存目录重命名为正式目标。
8. 若切换或后续基础验证失败，立即恢复备份。
9. 浏览器验收成功后才删除备份。

部署脚本只对上述固定目录和由脚本创建的同级暂存/备份目录执行递归操作，不扫描 `C:\Wisdomount`，也不按目录名模糊匹配。

## 12. 验证与成功证据

### 12.1 基线

在删除旧构建链之前，尽量使用同一机器、同一提交记录一次 CRACO 生产构建耗时。若旧构建无法在 Node.js 22 下完成，保留完整错误并明确说明无法形成公平耗时对比。

### 12.2 安装和自动测试

- 使用公共 registry 生成锁文件。
- 在干净依赖目录验证 `npm ci`。
- 执行 Vitest，记录退出码和摘要。

### 12.3 本地开发服务器

- 使用 Node.js 22 启动 Vite 开发服务器。
- 打开页面并检查首屏。
- 检查浏览器控制台和网络请求。
- 区分本次迁移新增错误与既有外部服务/脚本错误。

### 12.4 三环境构建

依次执行并记录耗时：

1. `npm run build:dev`
2. `npm run build:test`（同时验证兼容入口 `build:qa`）
3. `npm run build:prod`（同时保留兼容入口 `build`）

每次构建后运行产物契约校验。最终重新构建生产环境，确保部署源不是前一个环境残留。

### 12.5 Tomcat 验收

- 部署前保存目标版本、文件数和基础 HTTP 状态。
- 部署时提供源与目标文件集、SHA-256 一致性结果。
- 访问 `http://localhost:22080/kpos/kiosklite`，确认重定向及最终页面 HTTP 200。
- 检查页面截图、浏览器控制台、关键静态资源请求和网络错误。
- 成功后删除备份；失败则回滚并继续修复。

## 13. 已知边界

Vite legacy 只能转换本仓库参与构建的应用代码。Tomcat 提供的 `calculator.js`、promotion 脚本和 market SDK 含有不受本仓库控制的现代语法或现有 404 状态，因此：

- 本次可以证明应用自身生成了目标浏览器对应的 legacy bundle。
- 本次可以证明现代本地浏览器和当前 Tomcat 环境能够正常加载部署结果。
- 在没有这些 vendor 脚本的 ES5 版本、源码或真实旧设备验证的情况下，不能声称 Android 4.4 / iOS 9 的完整端到端运行已被证明。
- 最终报告必须把这项限制与迁移引入的问题分开说明。

## 14. 删除授权与保护范围

用户已批准在验证通过并满足安全条件后删除：

- 仓库中的 `craco.config.js`
- 仓库中的 `public/index.html`
- 仓库中的 `yarn.lock`
- 仓库中的 `.yarnrc.yml`
- 仓库中的 `.yarn/install-state.gz`
- 为干净 npm 安装而重建的 `node_modules`
- 为三环境验证而重建的 `dist`
- 指定 Tomcat 目标目录中的旧资源
- 浏览器验收成功后的部署备份目录

明确禁止触碰：

- 用户未跟踪的 `build/`
- 用户未跟踪的 `docs/KioskLite智能推荐策略说明.pdf`
- `C:\Wisdomount` 下任何不等于固定部署目标、或不是本次脚本创建的暂存/备份目录

## 15. 实施顺序

1. 保存基线、锁定当前依赖实际版本。
2. 建立 npm 配置、lockfile、Vite 配置和根 HTML。
3. 迁移环境变量、样式、代理、输出目录和 legacy 配置。
4. 迁移原生桥/viewport 脚本和 Big.js 导入。
5. 建立 postbuild 与产物契约测试。
6. 迁移现有测试到 Vitest。
7. 更新 build、zip、upload 脚本和项目文档。
8. 完成 npm 干净安装、测试、本地开发服务器验证。
9. 完成开发、测试、生产三环境构建和产物验证。
10. 删除已批准的旧构建链文件，重复干净验证。
11. 安全部署最终生产产物并访问 Tomcat URL 验收。
12. 汇总所有改动、耗时、退出码、部署哈希、截图/网络证据和遗留边界。
