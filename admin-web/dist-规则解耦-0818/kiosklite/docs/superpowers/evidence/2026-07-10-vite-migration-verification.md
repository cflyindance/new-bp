# Vite 迁移前验证基线

采集日期：2026-07-10。以下数据来自基线提交 `e04cd32b93c7262d0af1c21a0fc98df25c9ad9af`，用于后续 Vite 三环境构建与部署验证对比。

## 工作区

| 项目     | 基线值                                         |
| -------- | ---------------------------------------------- |
| 分支     | `feat/4.9.5-vite`                              |
| HEAD     | `e04cd32b93c7262d0af1c21a0fc98df25c9ad9af`     |
| Node.js  | `v22.18.0`                                     |
| npm      | `11.9.0`                                       |
| 未跟踪项 | `build/`、`docs/KioskLite智能推荐策略说明.pdf` |

基线工作区除上述两个受保护的未跟踪项外无其他修改。

## CRACO 构建

| 项目             | 结果              |
| ---------------- | ----------------- |
| Node.js 切换命令 | `nvm use 22.18.0` |
| 构建命令         | `yarn build`      |
| 结果             | 成功（伴随警告）  |
| 退出码           | `0`               |
| 耗时             | `41.7303446` 秒   |

构建输出包含 `baseline-browser-mapping` 与 `caniuse-lite` 数据过期提示，以及 3 条 `mini-css-extract-plugin` CSS 顺序警告；未更新依赖，最终输出 `The dist folder is ready to be deployed.`。

## 旧产物

数据源：本次 CRACO 生产构建生成的 `dist/asset-manifest.json` 与 `dist/`。

| 指标                      |     基线值 |
| ------------------------- | ---------: |
| Manifest `files` 属性数   |        161 |
| Manifest `entrypoints` 数 |          2 |
| `.gz` 文件数              |        147 |
| 总文件数                  |        318 |
| 总字节数                  | 19,964,367 |

## 部署前目标

| 项目                   | 基线值                                                                         |
| ---------------------- | ------------------------------------------------------------------------------ |
| 目标目录               | `C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite` |
| Attributes             | `Directory`                                                                    |
| LinkType               | 空                                                                             |
| Target                 | 空                                                                             |
| Reparse point          | 否                                                                             |
| `version.json` name    | `KIOSK`                                                                        |
| `version.json` version | `4.9.4.2`                                                                      |

## HTTP 基线

| URL                                      | HTTP 状态码 |
| ---------------------------------------- | ----------: |
| `http://localhost:22080/kpos/kiosklite`  |         302 |
| `http://localhost:22080/kpos/kiosklite/` |         200 |

## Vite 三环境构建、ZIP 与最终生产验证

采集日期：2026-07-13。以下数据来自 Vite 迁移后提交 `0fd930524b1218348cca3910074856038d577a64`，分支 `feat/4.9.5-vite`。本次只验证本地 npm/Vite 构建与 ZIP 编排；未触碰 Tomcat 目标目录。

| 项目       | 值                                                           |
| ---------- | ------------------------------------------------------------ |
| Node.js    | `v22.18.0`                                                   |
| npm        | `11.9.0`                                                     |
| 受保护项   | 未跟踪 `build/`、`docs/KioskLite智能推荐策略说明.pdf` 未修改 |
| ZIP 前状态 | 根目录无 `K-V*.zip`                                          |

`vite.config.mjs` 中 `mode -> process.env.REACT_APP_ENV` 映射为：`development -> development`、`integration -> integration`、`production -> production`；`build:qa` 是 `build:test` 别名。

### 命令结果

| 顺序 | 命令                     | 退出码 | 耗时（秒） | 说明                               |
| ---: | ------------------------ | -----: | ---------: | ---------------------------------- |
|    1 | `npm run build:dev`      |      0 |     39.382 | development 构建成功               |
|    2 | `npm run build:test`     |      0 |     39.572 | integration 构建成功               |
|    3 | `npm run build:qa`       |      0 |     39.020 | alias 到 `build:test`，成功        |
|    4 | `npm run build:prod`     |      0 |     39.635 | production 构建成功                |
|    5 | `npm run build`          |      0 |     38.461 | alias 到 `build:prod`，成功        |
|    6 | `npm run build:test:zip` |      0 |     86.678 | 生成 QA、DEV 两个 ZIP              |
|    7 | `npm run build:zip`      |      0 |    130.615 | 生成 QA、DEV、PR 三个 ZIP          |
|    8 | `npm run build:prod`     |      0 |     39.154 | 最终重建生产 `dist/`               |
|    9 | `npm test`               |      0 |      2.600 | Vitest `6` 个文件、`32` 个测试通过 |

额外用 `%TEMP%` 临时脚本副本模拟无效 build 命令 `npm run __task12_invalid_build__`，脚本返回非零（实际退出码 `1`），验证失败路径会失败退出。首次临时脚本因 `%TEMP%` 路径解析不到仓库 `archiver` 依赖失败，补充设置 `NODE_PATH=node_modules` 后完成目标模拟；未修改仓库脚本。

### 构建产物统计

| 构建              | `REACT_APP_ENV` | 总文件数 |   总字节数 | `.gz` |  JS | CSS | media/json/font | `.map` | `sourcesContent` | Manifest `files` | Manifest `entrypoints`               | legacy                                             |
| ----------------- | --------------- | -------: | ---------: | ----: | --: | --: | --------------: | -----: | ---------------: | ---------------: | ------------------------------------ | -------------------------------------------------- |
| `build:dev`       | `development`   |    1,480 | 56,587,032 |   715 | 333 |  66 |              35 |    330 |          330/330 |              755 | `static/js/index-legacy.CrhfkVo6.js` | `index.html` 命中 `nomodule/systemjs/legacy` 12 次 |
| `build:test`      | `integration`   |    1,480 | 56,586,864 |   715 | 333 |  66 |              35 |    330 |          330/330 |              755 | `static/js/index-legacy.pjPZy_br.js` | `index.html` 命中 12 次                            |
| `build:qa`        | `integration`   |    1,480 | 56,586,860 |   715 | 333 |  66 |              35 |    330 |          330/330 |              755 | `static/js/index-legacy.pjPZy_br.js` | `index.html` 命中 12 次                            |
| 最终 `build:prod` | `production`    |    1,462 | 28,973,810 |   697 | 333 |  66 |              35 |    330 |            0/330 |              755 | `static/js/index-legacy.DXOpDu_m.js` | `index.html` 命中 12 次                            |

最终生产 `index.html` 同时包含 modern 与 legacy 加载路径：

- `type="module"` 的 modern/legacy 检测脚本；
- `nomodule` polyfill：`./static/js/polyfills-legacy.CXuwRLhy.js`；
- `nomodule` legacy entry：`./static/js/index-legacy.DXOpDu_m.js`。

Task 12 sourcemap 合同修复后重新运行 `npm run build:prod`，最终生产构建中 330 个 sourcemap 均不含 `sourcesContent`，333 个 JS 文件均不含浏览器可识别的 `sourceMappingURL` 字样。补充验证命令：

- `npm test -- scripts/postbuild.test.js`：退出码 0，`11` 个 postbuild 测试通过，覆盖 production-only scrub 与 integration 保留 source map 正文。
- `npm run build:prod`：退出码 0，Vite 输出 `✓ built in 38.33s`，最终 `dist/` 为 production 包。
- `rg -l "sourcesContent" dist -g "*.map"`：无匹配。
- `rg -n "sourceMappingURL" dist -g "*.js"`：无匹配。
- `npm test`：退出码 0，Vitest `6` 个测试文件、`34` 个测试通过。

### ZIP 编排

ZIP 前根目录没有 `K-V*.zip`。`build:test:zip` 使用 `public/version.json` 原始版本 `4.9.4.4`；`build:zip` 会临时把 `public/version.json` 改为当前分支短名 `4.9.5-vite`。本次在 `build:zip` 后执行 `git restore -- public/version.json`，恢复后 `git diff -- public/version.json` 为空。

| ZIP                                |     字节数 | entries | 解压后总字节数 | 外层 `dist/` | 顶层结构                                                                                             |
| ---------------------------------- | ---------: | ------: | -------------: | ------------ | ---------------------------------------------------------------------------------------------------- |
| `K-V4.9.4.4_2026.07.13_QA.zip`     | 23,948,583 |   1,486 |     56,586,866 | 否           | `asset-manifest.json`、`bridge.js`、`images/`、`index.html`、`public/`、`static/`、`version.json` 等 |
| `K-V4.9.4.4_2026.07.13_DEV.zip`    | 23,948,999 |   1,486 |     56,587,031 | 否           | 同上                                                                                                 |
| `K-V4.9.5-vite_2026.07.13_QA.zip`  | 23,948,572 |   1,486 |     56,586,857 | 否           | 同上                                                                                                 |
| `K-V4.9.5-vite_2026.07.13_DEV.zip` | 23,949,003 |   1,486 |     56,587,030 | 否           | 同上                                                                                                 |
| `K-V4.9.5-vite_2026.07.13_PR.zip`  | 14,556,344 |   1,468 |     29,897,263 | 否           | 同上                                                                                                 |

### CRACO 基线对比

| 指标                      | CRACO 生产基线 | Vite 最终生产 |
| ------------------------- | -------------: | ------------: |
| Manifest `files` 属性数   |            161 |           755 |
| Manifest `entrypoints` 数 |              2 |             1 |
| `.gz` 文件数              |            147 |           697 |
| 总文件数                  |            318 |         1,462 |
| 总字节数                  |     19,964,367 |    28,973,810 |

Vite 最终生产包包含 modern 与 legacy 双路径、gzip 产物及 sourcemap，因此文件数和总字节数高于 CRACO 基线；最终 `dist/` 已由最后一次 `npm run build:prod` 生成。

## Vite 本地开发运行验证

采集日期：2026-07-13。范围：本地 Vite dev server 与生产 `dist/` 重建验证；尚未替换 Tomcat 目标目录。

### Dev server

| 项目 | 值 |
| --- | --- |
| 命令 | `npm.cmd run start -- --force --host 127.0.0.1` |
| URL | `http://127.0.0.1:3000/#/` |
| 结果 | 页面渲染 License 入口，不再进入错误边界 |
| 页面文本 | `Enter License`、`Next`、`Select existing license`、`Devin Best Choice`、`Start ordering`、`[DEV]K-V4.9.4.4-`、`Refresh` |
| 截图 | `docs/superpowers/evidence/task13-vite-dev.png` |

### Runtime 修复

Vite dev 首次打开后触发 React error boundary，控制台报 `ReferenceError: u is not defined`，来源为 `src/utils/CountRemToPx.js` 依赖隐式全局变量 `u`。已按 TDD 修复为读取 `window.navigator.userAgent`。

| 验证项 | 结果 |
| --- | --- |
| RED | `npm test -- src/utils/CountRemToPx.test.js` 先失败，错误为 `ReferenceError: u is not defined` |
| GREEN | `npm test -- src/utils/CountRemToPx.test.js` 通过，1 个测试文件、1 个用例 |
| 完整测试 | `npm test` 通过，7 个测试文件、35 个用例 |
| 格式化 | `npm.cmd exec prettier -- --write src/utils/CountRemToPx.js src/utils/CountRemToPx.test.js` 执行成功；仓库 `.prettierrc` 仍输出历史配置警告 `Ignored unknown option { seTabs: false }` |
| 生产构建 | `npm run build:prod` 退出码 0，Vite 输出 `built in 37.68s` |
| 空白检查 | `git diff --check -- src/utils/CountRemToPx.js src/utils/CountRemToPx.test.js` 退出码 0 |

最新生产 `dist/` 统计：总文件 1,463；总字节 28,974,120；`.gz` 698；JS 333；CSS 66；`.map` 330；manifest `files` 755；manifest `entrypoints` 1。生产 sourcemap 合同仍满足：`sourcesContent` 匹配数 0；JS 中浏览器可识别的 `sourceMappingURL` 匹配数 0。`dist/static/js/*CountRemToPx*` 已包含 `window.navigator.userAgent`，不再包含旧隐式 `u.match` 依赖。

### Browser QA 结果

浏览器地址：`http://127.0.0.1:3000/#/`。

| 检查项 | 结果 |
| --- | --- |
| `document.title` | `Kiosk` |
| `#root` 子节点 | `1` |
| `window.androidWebkit` | `object` |
| `window.jsBridgeManager` | `object` |
| `window.CR_onGetCreditCardInfoByIngenicoProgress` | `function` |
| Native bridge 全局函数 | `getDeviceInfo`、`getIngenicoDeviceSNAndDeviceInfo`、`bridgeCall`、`loadPaymentInfo`、`loadCreditCardInfoByIngenico`、`saveLicenseName`、`checkIngenicoReadyForTransaction`、`abortIngenicoTransaction`、`changePayConnectType`、`cancelDeviceConnect`、`saveSecretKeyAndroid`、`getSecretKeyAndroid`、`afterGetSecretKeyFromAndroid`、`isAndroidShell` 均为 `function` |

关键网络请求：

| URL | 状态 |
| --- | ---: |
| `http://127.0.0.1:3000/#/` | 200 |
| `http://127.0.0.1:3000/@vite/client` | 200 |
| `http://127.0.0.1:3000/src/index.js` | 200 |
| `http://127.0.0.1:3000/bridge.js` | 200 |
| `http://localhost:22080/kpos/img/gallery/js/calculator.js?update=TstFr1t` | 200 |
| `http://localhost:22080/kpos/img/gallery/js/market.js?update=TstNew2` | 200 |
| `http://127.0.0.1:3000/js/jquery-2.0.3.min.js` | 404 |
| `http://localhost:22080/kpos/img/gallery/js/promotion.js?update=TstFrt1` | 404 |

`../js/jquery-2.0.3.min.js` 是旧 `public/index.html` 原有引用，仓库中没有该文件；实际 Tomcat 宿主路径 `C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\js\jquery-2.0.3.min.js` 存在。Vite dev 根路径下该相对引用会解析到 `/js/jquery-2.0.3.min.js`，因此本地 dev 出现 404；该 404 未阻塞页面渲染，但最终 Tomcat 验证仍需确认部署路径下行为。

控制台剩余项：

- Vite 连接日志正常：`[vite] connecting...`、`[vite] connected.`。
- React Router 4 / React 17 旧生命周期 warning：`componentWillMount`、`componentWillReceiveProps`。
- 表单字段缺少 `id` 或 `name` 的浏览器 issue。
- CloudPromotion 接口 404、一个 `ERR_CONNECTION_REFUSED` 和一个空的 promise rejection；这些属于本地 POS/API 环境连通性项，本阶段不作为脚手架迁移阻塞。
- 未再出现 `u is not defined` 或 React error boundary。

本阶段未证明 Android 4.4、iOS 9、Safari 9、Chrome 60 真机端到端兼容性；旧外部 vendor 脚本也未被 Vite legacy 转换。

## Tomcat 真实部署验证

采集日期：2026-07-13。范围：使用最新 production `dist/` 替换 `C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite` 下全部资源，并在真实 Tomcat URL 验证。

### 部署前状态

| 项目 | 值 |
| --- | --- |
| 目标目录 | `C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite` |
| 目录属性 | `Directory` |
| LinkType | 空 |
| 文件数 | 342 |
| 总字节数 | 36,212,863 |
| `version.json` | `KIOSK` / `4.9.4.2` |
| `http://localhost:22080/kpos/kiosklite` | 302 到 `http://localhost:22080/kpos/kiosklite/` |
| `http://localhost:22080/kpos/kiosklite/` | 200 |

### 部署命令与结果

| 项目 | 值 |
| --- | --- |
| 命令 | `node upload.js` |
| 退出码 | 0 |
| 部署脚本返回文件数 | 1,463 |
| 部署脚本返回字节数 | 28,974,120 |
| 临时 backup | `C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite.backup-1783913435320-272051c0-bba4-46ae-a823-772edfd6bd97` |
| backup 清理命令 | `node upload.js --cleanup-backup <backupDir>` |
| backup 清理结果 | 退出码 0，`backupExists=false` |

部署脚本已执行安全检查：目标和 source 都必须匹配允许的绝对路径，且目标目录不能是 symlink/reparse point；复制到 staging 后先比对文件哈希，再重命名目标为 backup，并将 staging 提升为目标。验证成功后已清理本次 backup。

### 部署后文件与 HTTP 验证

| 项目 | 值 |
| --- | --- |
| 目标文件数 | 1,463 |
| 目标总字节数 | 28,974,120 |
| `version.json` | `KIOSK` / `4.9.4.4` |
| Manifest `files` | 755 |
| Manifest `entrypoints` | 1 |
| `http://localhost:22080/kpos/kiosklite` | 302 到 `http://localhost:22080/kpos/kiosklite/` |
| `http://localhost:22080/kpos/kiosklite/` | 200 |
| `http://localhost:22080/kpos/js/jquery-2.0.3.min.js` | 200，83,612 bytes |

### Tomcat Browser QA

浏览器地址：`http://localhost:22080/kpos/kiosklite/#/`。截图：`docs/superpowers/evidence/task14-tomcat-kiosklite.png`。

| 检查项 | 结果 |
| --- | --- |
| 页面标题 | `Kiosk` |
| 页面文本 | `Enter License`、`Next`、`Select existing license`、`Devin Best Choice`、`Start ordering`、`K-V-`、`Refresh` |
| `#root` 子节点 | `1` |
| `window.androidWebkit` | `object` |
| `window.jsBridgeManager` | `object` |
| `window.CR_onGetCreditCardInfoByIngenicoProgress` | `function` |
| Native bridge 全局函数 | `getDeviceInfo`、`getIngenicoDeviceSNAndDeviceInfo`、`bridgeCall`、`loadPaymentInfo`、`loadCreditCardInfoByIngenico`、`saveLicenseName`、`checkIngenicoReadyForTransaction`、`abortIngenicoTransaction`、`changePayConnectType`、`cancelDeviceConnect`、`saveSecretKeyAndroid`、`getSecretKeyAndroid`、`afterGetSecretKeyFromAndroid`、`isAndroidShell` 均为 `function` |

关键网络请求：

| URL | 状态 |
| --- | ---: |
| `http://localhost:22080/kpos/kiosklite/` | 200 |
| `http://localhost:22080/kpos/kiosklite/static/js/polyfills.6qqXs5P0.js` | 200 |
| `http://localhost:22080/kpos/kiosklite/static/js/index.FpTjZrit.js` | 200 |
| `http://localhost:22080/kpos/kiosklite/static/js/CountRemToPx.HisCP--Y.chunk.js` | 200 |
| `http://localhost:22080/kpos/kiosklite/bridge.js` | 200 |
| `http://localhost:22080/kpos/js/jquery-2.0.3.min.js` | 200 |
| `http://localhost:22080/kpos/img/gallery/js/calculator.js?update=TstFr1t` | 200 |
| `http://localhost:22080/kpos/img/gallery/js/market.js?update=TstNew2` | 200 |
| `http://localhost:22080/kpos/img/gallery/js/promotion.js?update=TstFrt1` | 404 |

控制台剩余项：

- 表单字段缺少 `id` 或 `name` 的浏览器 issue。
- 3 次资源 404，其中包含宿主 promotion 脚本 404。
- CloudPromotion 接口 404、一个 `ERR_CONNECTION_REFUSED` 和一个空的 promise rejection；这些属于本地 POS/API 环境连通性项。
- 未出现 `u is not defined`，未出现 React error boundary。

本阶段已证明最新 production `dist/` 可以替换真实 Tomcat kiosklite 目录，并通过 `http://localhost:22080/kpos/kiosklite` 进入页面。仍未证明旧 WebView/真机端到端兼容性；宿主 `promotion.js` 与接口连通性问题不由本次 Vite 脚手架迁移修复。

### Warnings

所有 Vite 构建均成功，但重复出现以下 warning：

- `index.html` 中 `<script src="../js/jquery-2.0.3.min.js">` 与 `<script src="./bridge.js">` 不是 `type="module"`，Vite 提示无法打包；
- `lottie-web/build/player/lottie.js` 使用 direct `eval`；
- 部分 chunk 超过 500 kB；
- `src/api/index.js` 同时被动态和静态导入，动态导入不会拆出独立 chunk；
- Rolldown/Vite 输出 `PLUGIN_TIMINGS`，主要耗时集中在 `kiosklite:jsx-in-js`、`vite:legacy-post-process`、`vite:build-import-analysis`。
