# KioskLite Vite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 KioskLite 从 CRACO/Webpack 完整迁移到 Vite 8，在 Node.js 22.12+ 和公共 npm 下保留现有运行时、三环境、legacy、产物与 Tomcat 部署契约，并提供可复核的成功证据。

**Architecture:** Vite 配置负责 React、JSX、样式、代理、legacy 和基础输出；`scripts/postbuild.mjs` 只负责恢复 CRA 兼容产物；安全部署逻辑独立在 `scripts/deploy.mjs`，`upload.js` 仅做固定入口。HTML 中的现代 POS 桥代码进入 Vite 模块，失败刷新兜底继续以 ES5 留在 HTML。

**Tech Stack:** React 17.0.2、Vite 8.1.4、`@vitejs/plugin-react` 6.0.3、`@vitejs/plugin-legacy` 8.2.0、Oxc、Vitest 4.1.10、jsdom 28.1.0、npm、Node.js 22。

## Global Constraints

- Node.js 必须满足 `>=22.12.0 <23`；本机执行使用已安装的 22.18.0。
- npm registry 必须是 `https://registry.npmjs.org/`，TeamCity 安装入口必须是 `npm ci`。
- React 与 React DOM 必须保持 17.0.2；既有业务直接依赖锁定为迁移前 `yarn.lock` 的实际解析版本。
- legacy 目标必须包含 Android 4.4、iOS 9、Safari 9、Chrome 60。
- 保持 `base: './'`、`@ -> src`、端口 3000、现有代理、CSS Modules 命名和三环境语义。
- 输出必须包含 `dist/static/js`、`dist/static/css`、`dist/static/media`、CRA 形状 `asset-manifest.json`、有收益的 `.gz`、两个 `version.json`。
- 只把 26 处 `require('big.js')` 改为 ESM；不改金额计算逻辑。
- Tomcat 部署目标只能是 `C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite`。
- 保留未跟踪的 `build/` 和 `docs/KioskLite智能推荐策略说明.pdf`，不得修改或删除。
- 外部 calculator、promotion、market 脚本不受 Vite legacy 转换；最终报告不得把旧设备端到端兼容表述为已证明。
- 所有删除只限已批准清单，且必须在替代实现验证通过后进行。

---

## File Structure

### 新建文件

- `.nvmrc`：声明本地验证使用的 Node.js 22.18.0。
- `.npmrc`：固定公共 npm、engine 检查和现有 peer 兼容安装策略。
- `package-lock.json`：npm 唯一锁文件。
- `vite.config.mjs`：Vite、React、JSX-in-JS、legacy、样式、代理、环境、输出和 Vitest 配置。
- `index.html`：Vite 根 HTML；保留 vendor、bridge、loading 和 DOM 契约。
- `src/bootstrap/nativeBridgeGlobals.js`：POS/WebView 桥函数及 `window` 合同。
- `src/bootstrap/nativeBridgeGlobals.test.js`：桥函数名、转发参数和回调合同测试。
- `src/bootstrap/viewport.js`：原 HTML viewport 自适应逻辑。
- `scripts/postbuild.mjs`：manifest、gzip、版本副本和产物断言。
- `scripts/postbuild.test.js`：postbuild 契约测试。
- `scripts/deploy.mjs`：固定路径安全部署、哈希比对、切换与回滚。
- `scripts/deploy.test.js`：只在临时目录验证安全部署和失败回滚。
- `docs/superpowers/evidence/2026-07-10-vite-migration-verification.md`：命令、耗时、产物、部署和浏览器证据摘要。

### 修改文件

- `package.json`：npm、Node、Vite、Vitest、三环境和打包脚本。
- `src/index.js`：在 React 启动前载入 bridge globals 和 viewport。
- 26 个 Big.js 文件：CommonJS 导入改为 ESM。
- 3 个现有测试文件：Jest API 改为 Vitest API/ESM。
- `build-and-zip.js`：内部命令改 npm，错误必须非零退出。
- `build-test.js`：内部命令改 npm，错误必须非零退出。
- `upload.js`：调用固定安全部署入口，不再扫描 `C:\Wisdomount`。
- `AGENTS.md`、`CLAUDE.md`、`readme.md`：同步 npm、Node、Vite 和验证命令。

### 验证后删除

- `craco.config.js`
- `public/index.html`
- `yarn.lock`
- `.yarnrc.yml`
- `.yarn/install-state.gz`

---

### Task 1: 保存 CRACO 与部署基线

**Files:**
- Create: `docs/superpowers/evidence/2026-07-10-vite-migration-verification.md`
- Read: `package.json`
- Read: `yarn.lock`
- Read: `dist/asset-manifest.json`
- Read: `C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite`

**Interfaces:**
- Consumes: 当前未修改的 CRACO 项目与 Tomcat 目标。
- Produces: 后续 Vite 构建和部署对比所需的基线数字，不修改业务源码。

- [ ] **Step 1: 记录工作区与运行时基线**

Run:

```powershell
git status --short --branch
node --version
npm --version
git rev-parse HEAD
```

Expected: 分支为 `feat/4.9.5-vite`；只存在受保护的两个未跟踪项；记录当前 Node/npm 和 HEAD。

- [ ] **Step 2: 在 Node.js 22 下执行一次旧生产构建并计时**

Run:

```powershell
nvm use 22.18.0
Measure-Command { yarn build 2>&1 | Tee-Object -Variable cracoBuildOutput }
$cracoBuildOutput
$LASTEXITCODE
```

Expected: 成功则保存耗时与产物统计；失败则保存完整错误与非零退出码，不修改依赖版本来挽救旧构建。

- [ ] **Step 3: 记录旧产物契约**

Run:

```powershell
$manifest = Get-Content dist\asset-manifest.json -Raw -Encoding UTF8 | ConvertFrom-Json
[pscustomobject]@{
  Files = @($manifest.files.PSObject.Properties).Count
  Entrypoints = @($manifest.entrypoints).Count
  Gzip = @(Get-ChildItem dist -Recurse -File -Filter *.gz).Count
  TotalFiles = @(Get-ChildItem dist -Recurse -File).Count
  Bytes = (Get-ChildItem dist -Recurse -File | Measure-Object Length -Sum).Sum
}
```

Expected: 得到可和 Vite 三环境构建对比的文件数、gzip 数和体积。

- [ ] **Step 4: 记录 Tomcat 目标与 HTTP 基线**

Run:

```powershell
$target = 'C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite'
Get-Item -LiteralPath $target | Select-Object FullName,Attributes,LinkType,Target
Get-Content -LiteralPath (Join-Path $target 'version.json') -Raw -Encoding UTF8
curl.exe -s -o NUL -w "%{http_code}" 'http://localhost:22080/kpos/kiosklite'
curl.exe -s -o NUL -w "%{http_code}" 'http://localhost:22080/kpos/kiosklite/'
```

Expected: 目标是普通目录而非 reparse point；记录版本；无斜杠 URL 302，带斜杠 URL 200。

- [ ] **Step 5: 写入基线证据并提交**

文档使用固定小节：`工作区`、`CRACO 构建`、`旧产物`、`部署前目标`、`HTTP 基线`。失败结果必须原样写成“失败”，不能写成通过。

Run:

```powershell
git add docs/superpowers/evidence/2026-07-10-vite-migration-verification.md
git commit -m "docs: record Vite migration baseline"
```

Expected: 提交只包含证据文档。

---

### Task 2: 建立 npm 依赖基线与 Vite 命令

**Files:**
- Create: `.nvmrc`
- Create: `.npmrc`
- Create: `package-lock.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1 保存的旧构建基线和 `yarn.lock` 解析版本。
- Produces: `npm ci` 可复现依赖图，以及后续任务可调用的 `vite`、`vitest`、`postbuild` 命令。

- [ ] **Step 1: 写 Node/npm 约束文件**

`.nvmrc` 完整内容：

```text
22.18.0
```

`.npmrc` 完整内容：

```ini
registry=https://registry.npmjs.org/
legacy-peer-deps=true
engine-strict=true
```

- [ ] **Step 2: 精确锁定现有直接依赖**

把 `package.json` 中保留的业务直接依赖改为以下实际解析版本：

```text
@ant-design/cssinjs 1.24.0
@dnd-kit/core 6.3.1
@dnd-kit/modifiers 9.0.0
@dnd-kit/utilities 3.2.2
@material-ui/core 4.12.4
@material-ui/icons 4.11.3
@material-ui/lab 4.0.0-alpha.61
@mdi/js 6.9.96
ahooks 3.9.5
antd 5.27.5
archiver 7.0.1
array-flat-polyfill 1.0.1
axios 0.18.1
big.js 6.2.2
classnames 2.5.1
core-js 3.46.0
crypto-js 4.2.0
dayjs 1.11.18
emoji-regex 10.6.0
i18next 25.6.0
js-cookie 3.0.5
lodash 4.17.21
lottie-react 2.4.1
nanoid 5.1.7
postcss 8.5.6
postcss-flexbugs-fixes 5.0.2
postcss-normalize 10.0.1
postcss-preset-env 8.5.1
qs 6.14.0
re-resizable 6.11.2
react 17.0.2
react-canvas-draw 1.2.1
react-dom 17.0.2
react-error-boundary 4.1.2
react-i18next 16.1.4
react-mobile-picker 0.1.13
react-redux 8.1.3
react-router-dom 4.3.1
react-simple-keyboard 3.2.76
react-switch 3.0.4
react-switch-button 2.3.8
react-virtualized-auto-sizer 1.0.26
react-window 1.8.11
react18-input-otp 1.1.4
redux 5.0.1
redux-logger 3.0.6
redux-thunk 2.4.2
reselect 5.1.1
sass 1.77.6
save 2.9.0
simple-keyboard-layouts 1.15.172
strip-ansi 6.0.0
uuid 9.0.1
```

保留 `prettier@3.6.2`、`generic-names@4.0.0` 和 `react-refresh@0.14.2`。删除仅属于旧构建链的 `@babel/plugin-proposal-private-property-in-object`、`@craco/craco`、`baseline-browser-mapping`、`compression-webpack-plugin`、`copy-webpack-plugin`、`cross-env`、`react-scripts`。

- [ ] **Step 3: 加入精确 Vite/Vitest 依赖与 npm 元数据**

新增 devDependencies：

```json
{
  "@vitejs/plugin-legacy": "8.2.0",
  "@vitejs/plugin-react": "6.0.3",
  "jsdom": "28.1.0",
  "terser": "5.49.0",
  "vite": "8.1.4",
  "vitest": "4.1.10"
}
```

新增：

```json
{
  "engines": {
    "node": ">=22.12.0 <23"
  },
  "packageManager": "npm@10.9.3"
}
```

如果 Node.js 22.18.0 实际自带的 npm patch 版本不是 10.9.3，使用 `npm --version` 的实际完整版本替换 `packageManager`，不升级全局 npm。

- [ ] **Step 4: 把 scripts 改为 Vite/npm**

使用以下脚本合同：

```json
{
  "start": "vite --mode development",
  "build": "npm run build:prod",
  "build:prod": "vite build --mode production && node scripts/postbuild.mjs --mode production",
  "build:dev": "vite build --mode development && node scripts/postbuild.mjs --mode development",
  "build:test": "vite build --mode integration && node scripts/postbuild.mjs --mode integration",
  "build:qa": "npm run build:test",
  "build:zip": "node build-and-zip.js",
  "build:test:zip": "node build-test.js",
  "build:upload": "npm run build:dev && node upload.js",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: 生成 npm 锁文件并验证公共 registry**

Run:

```powershell
nvm use 22.18.0
npm config get registry
npm install --package-lock-only
npm ci
```

Expected: registry 为公共地址；lockfileVersion 为 npm 当前版本生成值；安装成功；`package-lock.json` 不包含 Menusifu CodeArtifact URL。

- [ ] **Step 6: 审核依赖漂移并提交**

Run:

```powershell
npm ls react react-dom --depth=0
rg -n "codeartifact|menusifu.*npm" package-lock.json .npmrc
git diff --check
git add .nvmrc .npmrc package.json package-lock.json
git commit -m "build: switch dependency management to npm"
```

Expected: React/DOM 都是 17.0.2；私有 registry 搜索无结果；提交不包含旧锁文件删除。

---

### Task 3: 建立 Vite、Oxc JSX 和 legacy 配置

**Files:**
- Create: `vite.config.mjs`
- Test: `vite.config.mjs` 由真实开发启动与构建验证

**Interfaces:**
- Consumes: Task 2 安装的 Vite、React plugin、legacy plugin、PostCSS 和 generic-names。
- Produces: `npm start`、三环境构建与 Vitest 共用的配置函数。

- [ ] **Step 1: 先运行无配置构建，确认真实入口失败**

Run:

```powershell
npx vite build --mode development
```

Expected: 因根 HTML/Vite 配置尚未建立或 `.js` JSX 无法解析而失败；保存错误用于证明后续配置解决真实问题。

- [ ] **Step 2: 创建 JSX-in-JS 预转换插件**

在 `vite.config.mjs` 定义并使用以下接口：

```js
function jsxInJsPlugin() {
  let sourceRoot;
  let development;

  return {
    name: 'kiosklite:jsx-in-js',
    enforce: 'pre',
    config() {
      return {
        optimizeDeps: {
          rolldownOptions: {
            moduleTypes: {
              '.js': 'jsx',
            },
          },
        },
      };
    },
    configResolved(config) {
      sourceRoot = `${normalizePath(path.resolve(config.root, 'src'))}/`;
      development = !config.isProduction;
    },
    async transform(code, id) {
      const cleanId = normalizePath(id.split('?')[0]);
      if (!cleanId.startsWith(sourceRoot) || !cleanId.endsWith('.js')) {
        return null;
      }
      const result = await transformWithOxc(code, cleanId, {
        lang: 'jsx',
        jsx: {
          runtime: 'automatic',
          importSource: 'react',
          development,
        },
      });
      for (const warning of result.warnings) this.warn(warning);
      return { code: result.code, map: result.map, moduleType: 'js' };
    },
  };
}
```

插件顺序必须是 `jsxInJsPlugin()`、`react()`、`legacy()`。

- [ ] **Step 3: 写完整 Vite 配置函数**

配置必须实现：

```js
export default defineConfig(({ command, mode }) => {
  const reactAppEnv = {
    development: 'development',
    integration: 'integration',
    production: 'production',
  }[mode];
  if (!reactAppEnv) throw new Error(`Unsupported Vite mode: ${mode}`);

  const isProduction = mode === 'production';
  const nodeEnv = command === 'serve' ? 'development' : 'production';
  return {
    base: './',
    resolve: { alias: { '@': path.resolve('src') } },
    define: {
      'process.env.REACT_APP_ENV': JSON.stringify(reactAppEnv),
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
    plugins: [
      jsxInJsPlugin(),
      react(),
      legacy({
        targets: ['Android >= 4.4', 'iOS >= 9', 'Safari >= 9', 'Chrome >= 60'],
        renderLegacyChunks: true,
        modernPolyfills: true,
      }),
    ],
    css: {
      modules: { generateScopedName },
      postcss: {
        plugins: [
          postcssFlexbugsFixes,
          postcssPresetEnv({ autoprefixer: { flexbox: 'no-2009' }, stage: 3 }),
          postcssNormalize(),
        ],
      },
    },
    server: {
      port: 3000,
      cors: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
      proxy: {
        '/img': 'http://localhost:22080/kpos/',
        '/kpos/api': {
          target: 'http://localhost:22080',
          secure: false,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      manifest: true,
      sourcemap: isProduction ? 'hidden' : true,
      rolldownOptions: {
        output: {
          sourcemapExcludeSources: isProduction,
          entryFileNames: 'static/js/[name].[hash].js',
          chunkFileNames: 'static/js/[name].[hash].chunk.js',
          assetFileNames: assetFileName,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      clearMocks: true,
    },
  };
});
```

`generateScopedName` 使用现有 `generic-names` 规则 `[local]___[hash:base64:5]`；`assetFileName` 对 CSS 返回 `static/css/[name].[hash][extname]`，其余返回 `static/media/[name].[hash][extname]`。

- [ ] **Step 4: 配置静态自检并提交**

Run:

```powershell
node -e "import('./vite.config.mjs').then(() => console.log('vite config ok'))"
git diff --check
git add vite.config.mjs
git commit -m "build: add Vite and legacy configuration"
```

Expected: 输出 `vite config ok`；无语法或 whitespace 错误。

---

### Task 4: 迁移 HTML、POS 桥全局和 viewport

**Files:**
- Create: `index.html`
- Create: `src/bootstrap/nativeBridgeGlobals.js`
- Create: `src/bootstrap/nativeBridgeGlobals.test.js`
- Create: `src/bootstrap/viewport.js`
- Modify: `src/index.js`
- Keep temporarily: `public/index.html`

**Interfaces:**
- Consumes: `public/bridge.js`，外部 `PointCalculator`、`execute_promotion`、`marketAPI`/`MarketSDK` 全局。
- Produces: 原名称 `window` 桥函数、ES5 loading fallback、Vite `/src/index.js` 模块入口。

- [ ] **Step 1: 写桥全局失败测试**

`src/bootstrap/nativeBridgeGlobals.test.js` 至少覆盖：

```js
import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('native bridge globals', () => {
  beforeEach(async () => {
    vi.resetModules();
    window.WebViewJavascriptBridge = { callHandler: vi.fn() };
    window.AppJSBridge = { call: vi.fn().mockResolvedValue({ serial: '1' }) };
    window.CallJava = {
      saveLicenseName: vi.fn(),
      changePayConnectType: vi.fn(),
      cancelDeviceConnect: vi.fn(),
      saveSecretKey: vi.fn(),
      getSecretKey: vi.fn(),
    };
    await import('./nativeBridgeGlobals.js');
  });

  test('exposes every native callback on window', () => {
    for (const name of [
      'getDeviceInfo',
      'getIngenicoDeviceSNAndDeviceInfo',
      'bridgeCall',
      'loadPaymentInfo',
      'loadCreditCardInfoByIngenico',
      'saveLicenseName',
      'checkIngenicoReadyForTransaction',
      'abortIngenicoTransaction',
      'changePayConnectType',
      'cancelDeviceConnect',
      'saveSecretKeyAndroid',
      'getSecretKeyAndroid',
      'afterGetSecretKeyFromAndroid',
      'isAndroidShell',
    ]) expect(window[name]).toBeTypeOf('function');
  });

  test('normalizes AppJSBridge payment data to body', async () => {
    await expect(window.loadPaymentInfo()).resolves.toEqual({ body: { serial: '1' } });
    expect(window.AppJSBridge.call).toHaveBeenCalledWith('getPaymentDeviceInfo');
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```powershell
npm test -- src/bootstrap/nativeBridgeGlobals.test.js
```

Expected: FAIL，原因是 `nativeBridgeGlobals.js` 不存在。

- [ ] **Step 3: 把原 HTML 桥函数原样迁入模块**

`src/bootstrap/nativeBridgeGlobals.js` 必须：

1. 逐个保留 `public/index.html` 当前函数体和参数。
2. 用具名 `const`/`function` 定义后执行：

```js
Object.assign(window, {
  getDeviceInfo,
  getIngenicoDeviceSNAndDeviceInfo,
  bridgeCall,
  loadPaymentInfo,
  loadCreditCardInfoByIngenico,
  saveLicenseName,
  checkIngenicoReadyForTransaction,
  abortIngenicoTransaction,
  changePayConnectType,
  cancelDeviceConnect,
  saveSecretKeyAndroid,
  getSecretKeyAndroid,
  afterGetSecretKeyFromAndroid,
  isAndroidShell,
});
```

3. 保留 `window.parent.postMessage({ type: 'loaded' }, '*')` 的现有 try/catch 行为。
4. 不重命名 native handler、callbackFuncName 或 JSON 字段。

- [ ] **Step 4: 把 viewport 逻辑迁为模块**

`src/bootstrap/viewport.js` 导出并立即调用：

```js
export function configureViewport() {
  const userAgent = window.navigator.userAgent;
  const head = document.getElementsByTagName('head')[0];
  const dpr = window.devicePixelRatio || 1;
  const addViewportMeta = (scale) => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = `width=device-width,initial-scale=${scale},minimum-scale=${scale},maximum-scale=${scale},user-scalable=no`;
    head.appendChild(meta);
  };
  if (dpr <= 1 && window.screen.width < 1080) {
    document.documentElement.style.fontSize = '38.5%';
  } else if (/Android|Adr/i.test(userAgent)) {
    addViewportMeta(1 / dpr);
  } else if (/iPad|iPhone|iPod/i.test(userAgent)) {
    addViewportMeta(0.8 / dpr);
  } else {
    document.documentElement.style.fontSize = '38.5%';
  }
}

configureViewport();
```

- [ ] **Step 5: 创建 Vite 根 HTML**

从 `public/index.html` 复制结构与样式，做且只做以下脚本调整：

- globalThis shim 改为 `<script>window.globalThis = window;</script>`。
- 保留四个静态 vendor classic script 及原顺序。
- 删除重复的动态 calculator/promotion/market loader。
- 删除已迁移的桥函数和 viewport 现代内联块。
- `bridge.js` 改为 `<script src="./bridge.js"></script>`。
- loading/retry 块改为纯 ES5，显式挂载：

```js
window.retryConnection = retryConnection;
window.hideInitialLoading = hideInitialLoading;
window.loadingState = false;
window.refreshTimer = null;
showRefresh();
```

- 在 `bridge.js` 之后加入 `<script type="module" src="/src/index.js"></script>`。

- [ ] **Step 6: 在 React 入口最前加载 bootstrap**

`src/index.js` 的 React 导入之前加入：

```js
import './bootstrap/nativeBridgeGlobals';
import './bootstrap/viewport';
```

保留现有 `window.androidWebkit`、`window.jsBridgeManager` 和 `window.CR_onGetCreditCardInfoByIngenicoProgress`。

- [ ] **Step 7: 运行桥测试与 HTML 静态检查**

Run:

```powershell
npm test -- src/bootstrap/nativeBridgeGlobals.test.js
rg -n 'const |let |=>|async |`' index.html
rg -n "calculator.js|promotion.js|market.js" index.html
```

Expected: 测试 PASS；classic inline 逻辑不含现代语法；每个 vendor 只出现一次。

- [ ] **Step 8: 提交 HTML/bridge 迁移**

Run:

```powershell
git add index.html src/index.js src/bootstrap
git commit -m "build: migrate HTML and native bridge bootstrap"
```

Expected: 暂不删除 `public/index.html`。

---

### Task 5: 把 Big.js 浏览器运行时导入改为 ESM

**Files:**
- Modify: `src/api/apiUtil.js`
- Modify: `src/api/submitOrderObj.js`
- Modify: `src/component/RewardCenter/ItemDeleteDrawer.js`
- Modify: `src/component/cardMinAmount/index.js`
- Modify: `src/container/cardPayment/index.js`
- Modify: `src/container/comboPanel/comboFooter/comboItemsDetailModal/index.js`
- Modify: `src/container/comboPanel/comboFooter/index.js`
- Modify: `src/container/comboPanel/comboSelectionModal/index.js`
- Modify: `src/container/configApp/allChargeSetting/index.js`
- Modify: `src/container/orderPage/bannerPro/components/combo/footer.js`
- Modify: `src/container/orderPage/bannerPro/components/detail.js`
- Modify: `src/container/orderPage/chooseDeleteOrder/index.js`
- Modify: `src/container/orderPage/footBtn/index.js`
- Modify: `src/container/orderPage/index.js`
- Modify: `src/container/orderPage/orderDetailModal/index.js`
- Modify: `src/container/orderPage/sizeOptionSelect/index.js`
- Modify: `src/container/paymentType/index.js`
- Modify: `src/container/tippingPanel/index.js`
- Modify: `src/utils/CRMIntegration/marketSDK.js`
- Modify: `src/utils/busTools.js`
- Modify: `src/utils/calcTipAmount.js`
- Modify: `src/utils/orderPricing/discountChargeExceedMoney.js`
- Modify: `src/utils/orderPricing/togoCharge.js`
- Modify: `src/utils/orderPricing/wholeOrderCharge.js`
- Modify: `src/utils/priceCalculator/index.js`
- Modify: `src/utils/processZeroAmountOrder.js`

**Interfaces:**
- Consumes: `big.js@6.2.2` 的默认 ESM export。
- Produces: 和现有 `const Big = require('big.js')` 相同的 `Big` 标识符，不改变调用方。

- [ ] **Step 1: 保存失败的静态合同**

Run:

```powershell
$matches = rg -n -F "require('big.js')" src
$matches
if (($matches | Measure-Object).Count -ne 26) { exit 1 }
```

Expected: 精确找到 26 处，证明待迁移合同存在。

- [ ] **Step 2: 执行 26 个精确替换**

每个列出文件都只执行以下替换，并把 import 放在文件现有 import 区域；没有 import 的文件放在第一行：

```diff
-const Big = require('big.js');
+import Big from 'big.js';
```

`src/utils/orderPricing/discountChargeExceedMoney.js` 当前无分号，替换后遵循项目格式写成带分号的 import。

- [ ] **Step 3: 验证没有残留且文件数不变**

Run:

```powershell
if (rg -n -F "require('big.js')" src) { exit 1 }
$esmFiles = rg -l -F "import Big from 'big.js';" src
($esmFiles | Measure-Object).Count
git diff --name-status | Select-String -Pattern '^R'
```

Expected: 无 CommonJS Big.js；ESM Big.js 文件总数为原 11 加迁移 26；无文件重命名。

- [ ] **Step 4: 提交模块兼容修改**

Run:

```powershell
git add src
git commit -m "refactor: use ESM imports for Big.js"
```

Expected: 提交仅包含 26 个导入方式修改。

---

### Task 6: 用测试驱动实现 CRA 兼容 postbuild

**Files:**
- Create: `scripts/postbuild.test.js`
- Create: `scripts/postbuild.mjs`

**Interfaces:**
- Consumes: `dist/.vite/manifest.json`、`dist/index.html`、`dist/version.json` 和 Vite 输出文件。
- Produces: `runPostbuild({ distDir, mode }) -> Promise<summary>`，其中 summary 包含 `files`、`entrypoints`、`gzipFiles`。

- [ ] **Step 1: 写失败的 fixture 测试**

`scripts/postbuild.test.js` 使用 `fs.mkdtemp` 创建：

```text
dist/.vite/manifest.json
dist/index.html
dist/version.json
dist/static/js/main.abc.js
dist/static/js/chunk.def.chunk.js
dist/static/css/main.abc.css
dist/static/media/logo.abc.png
```

manifest fixture 必须包含一个 `isEntry: true` 的 `src/index.js`、其 CSS/assets 和一个 dynamic import。断言：

```js
const summary = await runPostbuild({ distDir, mode: 'production' });
const manifest = JSON.parse(await readFile(join(distDir, 'asset-manifest.json'), 'utf8'));
expect(manifest.entrypoints).toEqual([
  'static/css/main.abc.css',
  'static/js/main.abc.js',
]);
expect(manifest.files['main.css']).toBe('./static/css/main.abc.css');
expect(manifest.files['main.js']).toBe('./static/js/main.abc.js');
expect(manifest.files['static/js/chunk.def.chunk.js']).toBe('./static/js/chunk.def.chunk.js');
expect(JSON.parse(await readFile(join(distDir, 'public/version.json'), 'utf8'))).toEqual({ name: 'KIOSK', version: 'test' });
expect(summary.gzipFiles.every((file) => file.endsWith('.gz'))).toBe(true);
```

另写缺失 `static/css`、绝对路径 manifest 值、无 entry 的三个失败测试。

- [ ] **Step 2: 运行测试并确认失败**

Run:

```powershell
npm test -- scripts/postbuild.test.js
```

Expected: FAIL，原因是 `postbuild.mjs` 不存在。

- [ ] **Step 3: 实现输入和路径断言**

`scripts/postbuild.mjs` 导出：

```js
export async function runPostbuild({ distDir, mode })
export async function readViteManifest(distDir)
export function createCraManifest(viteManifest)
export async function gzipBuildAssets({ distDir, relativeFiles })
export async function assertArtifactContract(distDir)
```

所有 manifest 路径先转换为 `/`，拒绝绝对路径和 `..`。必需目录/文件缺失时抛出带具体相对路径的 Error。

- [ ] **Step 4: 实现 CRA manifest**

规则固定为：

- entry 的第一条 CSS 映射为 `main.css`。
- entry 的 JS 映射为 `main.js`。
- 其他 JS/CSS/media/map 使用自身相对路径作为 key。
- 所有 `files` value 为 `./${relativePath}`。
- `entrypoints` 是 entry CSS 后接 entry JS，不带 `./`。
- `.gz`、`.vite/manifest.json`、`asset-manifest.json` 和 `public/version.json` 不进入 files。

- [ ] **Step 5: 实现 gzip 与版本副本**

使用 `node:zlib` 的 `gzip`，候选仅来自 Vite manifest 可达资产、对应 source map、`index.html`、最终 `asset-manifest.json` 和 `version.json`。仅当 `compressed.length / source.length <= 0.8` 时写入 `${file}.gz`，保留源文件。

所有环境都执行：

```js
await mkdir(join(distDir, 'public'), { recursive: true });
await copyFile(join(distDir, 'version.json'), join(distDir, 'public/version.json'));
```

- [ ] **Step 6: 实现 CLI 和最终合同断言**

CLI 只接受 `development`、`integration`、`production`：

```js
const modeIndex = process.argv.indexOf('--mode');
const mode = process.argv[modeIndex + 1];
await runPostbuild({ distDir: resolve('dist'), mode });
```

合同断言必须检查三个 static 子目录、两个 version 文件、index、manifest 和所有 manifest value 指向现存文件。

- [ ] **Step 7: 测试通过并提交**

Run:

```powershell
npm test -- scripts/postbuild.test.js
git add scripts/postbuild.mjs scripts/postbuild.test.js
git commit -m "build: add CRA-compatible postbuild artifacts"
```

Expected: 所有 postbuild 测试 PASS。

---

### Task 7: 迁移现有 Jest 测试到 Vitest

**Files:**
- Modify: `src/component/PhoneNumberField/PhoneNumberField.test.js`
- Modify: `src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js`
- Modify: `src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.migration.test.js`

**Interfaces:**
- Consumes: `vite.config.mjs` 中 jsdom、globals、alias 配置。
- Produces: `npm test` 下保持原断言意图的三个测试文件。

- [ ] **Step 1: 运行现有测试并记录 Jest API 失败**

Run:

```powershell
npm test -- src/component/PhoneNumberField/PhoneNumberField.test.js src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.migration.test.js
```

Expected: 至少因 `jest` 未定义或 CommonJS `__dirname` 不可用而 FAIL。

- [ ] **Step 2: 替换 mock API**

两个 DOM 测试文件增加：

```js
import { vi } from 'vitest';
```

把 `jest.fn()` 全部改为 `vi.fn()`，把 `jest.mock(...)` 改为 `vi.mock(...)`；测试标题、DOM 行为和断言不改。

- [ ] **Step 3: 把 migration test 改为 ESM 路径**

文件开头改为：

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

其余目标文件和断言保持不变。

- [ ] **Step 4: 运行全部测试并提交**

Run:

```powershell
npm test
git add src/component/PhoneNumberField/PhoneNumberField.test.js src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.migration.test.js
git commit -m "test: migrate component tests to Vitest"
```

Expected: 三个旧测试、bridge 测试和 postbuild 测试全部 PASS。

---

### Task 8: 修复 npm 打包编排和失败退出码

**Files:**
- Modify: `build-and-zip.js`
- Modify: `build-test.js`

**Interfaces:**
- Consumes: `npm run build:test`、`npm run build:dev`、`npm run build:prod` 和 `dist`。
- Produces: 原命名 QA/DEV/PR ZIP；任一构建或 archive 错误都令进程非零退出。

- [ ] **Step 1: 写失败传播的静态检查**

Run:

```powershell
rg -n "yarn build|catch \(error\).*console.error|process.exitCode" build-and-zip.js build-test.js
```

Expected: 找到 Yarn 命令，且 main catch 中没有 `process.exitCode = 1`。

- [ ] **Step 2: 替换内部命令**

`build-and-zip.js` 顺序固定为：

```js
await runBuild('npm run build:test', 'dist', 'QA');
await runBuild('npm run build:dev', 'dist', 'DEV');
await runBuild('npm run build:prod', 'dist', 'PR');
```

`build-test.js` 顺序固定为：

```js
await runBuild('npm run build:test', 'QA');
await runBuild('npm run build:dev', 'DEV');
```

- [ ] **Step 3: 确保主函数失败返回非零**

两个脚本的最外层 catch 都必须包含：

```js
console.error('脚本执行出错:', error);
process.exitCode = 1;
```

保留 `archive.directory(sourceDir, false)`，确保 ZIP 根不增加外层 `dist`。

- [ ] **Step 4: 验证脚本语法和提交**

Run:

```powershell
node --check build-and-zip.js
node --check build-test.js
if (rg -n "yarn" build-and-zip.js build-test.js) { exit 1 }
git add build-and-zip.js build-test.js
git commit -m "build: run packaging scripts with npm"
```

Expected: 两个脚本语法通过，无 Yarn 残留。

---

### Task 9: 用测试驱动实现固定路径安全部署

**Files:**
- Create: `scripts/deploy.mjs`
- Create: `scripts/deploy.test.js`
- Modify: `upload.js`

**Interfaces:**
- Consumes: 已通过 postbuild 合同的生产 `dist`。
- Produces: `deployArtifacts({ sourceDir, targetDir, allowedSource, allowedTarget, hooks }) -> Promise<{ backupDir, files, bytes }>`；CLI 只使用固定真实源和目标。

- [ ] **Step 1: 写临时目录失败测试**

`scripts/deploy.test.js` 必须覆盖：

```js
await expect(deployArtifacts({
  sourceDir,
  targetDir: join(tempRoot, 'wrong'),
  allowedTarget,
})).rejects.toThrow('does not match allowed target');
```

并覆盖：源产物不完整时正式目标不变、目标是 symlink/junction 时拒绝、复制后 SHA-256 不一致时回滚、成功切换后目标文件集与源一致。

测试只能使用 `os.tmpdir()` 下创建的路径，不能引用真实 `C:\Wisdomount`。

- [ ] **Step 2: 运行测试并确认失败**

Run:

```powershell
npm test -- scripts/deploy.test.js
```

Expected: FAIL，原因是 `deploy.mjs` 不存在。

- [ ] **Step 3: 实现路径和 reparse point 防线**

`scripts/deploy.mjs` 定义：

```js
export const DEPLOY_TARGET = 'C:\\Wisdomount\\Menusifu\\application\\1.8.0.30.11\\tomcat\\webapps\\kpos\\kiosklite';
export async function assertSafeDirectory(pathname, expectedPath)
export async function listFilesWithHashes(rootDir)
export async function deployArtifacts({ sourceDir, targetDir, allowedSource, allowedTarget, hooks = {} })
export async function rollbackDeployment({ targetDir, backupDir, allowedTarget })
export async function removeVerifiedBackup(backupDir, targetDir)
```

要求：

- `path.resolve(targetDir).toLowerCase()` 必须精确等于 allowedTarget。
- 使用 `lstat` 拒绝 `isSymbolicLink()`；Windows 下读取 attributes 的部署前 PowerShell证据必须确认没有 ReparsePoint。
- `path.resolve(sourceDir).toLowerCase()` 必须精确等于 allowedSource，且 `assertArtifactContract` 通过；临时目录测试显式传入自己的 allowedSource，生产 CLI 固定为仓库绝对 `dist`。
- staging/backup 名称必须是目标同级、以 `kiosklite.staging-`/`kiosklite.backup-` 开头的唯一目录。

- [ ] **Step 4: 实现复制、哈希、切换和回滚**

固定事务顺序：

```js
await cp(sourceDir, stagingDir, { recursive: true, errorOnExist: true, force: false });
assert.deepEqual(await listFilesWithHashes(stagingDir), await listFilesWithHashes(sourceDir));
await rename(targetDir, backupDir);
try {
  await rename(stagingDir, targetDir);
  assert.deepEqual(await listFilesWithHashes(targetDir), await listFilesWithHashes(sourceDir));
} catch (error) {
  if (await pathExists(targetDir)) await rm(targetDir, { recursive: true, force: true });
  await rename(backupDir, targetDir);
  throw error;
}
```

只有浏览器验收成功后才调用 `removeVerifiedBackup`。删除前再次确认 backup 与 target 同父目录、前缀匹配且不是 reparse point。

- [ ] **Step 5: 把 upload.js 变成固定 CLI 入口**

`upload.js` 不再遍历 `C:\Wisdomount`，完整职责为动态导入并运行：

```js
import('./scripts/deploy.mjs')
  .then(({ deployFromCli }) => deployFromCli())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
```

CLI 输出 backupDir，禁止自动删除备份。CLI 还支持两个受同一绝对路径/reparse point 校验保护的显式动作：

```text
node upload.js --rollback <backupDir>
node upload.js --cleanup-backup <backupDir>
```

- [ ] **Step 6: 测试、静态安全检查并提交**

Run:

```powershell
npm test -- scripts/deploy.test.js
if (rg -n "findKioskPath|readdirSync\('C:\\\\Wisdomount'" upload.js scripts/deploy.mjs) { exit 1 }
git add upload.js scripts/deploy.mjs scripts/deploy.test.js
git commit -m "build: add transactional Kiosk deployment"
```

Expected: 临时目录测试全部 PASS；无模糊扫描。

---

### Task 10: 首轮 Vite dev/build 验证并清除旧构建链

**Files:**
- Delete: `craco.config.js`
- Delete: `public/index.html`
- Delete: `yarn.lock`
- Delete: `.yarnrc.yml`
- Delete: `.yarn/install-state.gz`
- Preserve: `public/bridge.js`
- Preserve: `public/version.json`

**Interfaces:**
- Consumes: Tasks 2-9 的实现。
- Produces: 仅剩 npm/Vite 的构建入口。

- [ ] **Step 1: 启动真实 Vite 入口做冷扫描**

Run:

```powershell
npm start -- --force --host 127.0.0.1
```

Expected: 端口 3000 启动；`/src/index.js` 200；无 `.js` JSX parse error；页面挂载到 `#root`。

- [ ] **Step 2: 运行一次开发构建**

Run:

```powershell
npm run build:dev
```

Expected: 退出码 0；postbuild 合同通过；modern 和 legacy JS 都在 `dist/static/js`。

- [ ] **Step 3: 运行全部自动测试**

Run:

```powershell
npm test
```

Expected: 所有旧测试和新增契约测试 PASS。

- [ ] **Step 4: 删除已批准且已有替代的旧文件**

删除前逐个验证绝对路径位于仓库：

```powershell
$repo = (Resolve-Path .).Path
$files = @('craco.config.js', 'public/index.html', 'yarn.lock', '.yarnrc.yml', '.yarn/install-state.gz')
$files | ForEach-Object {
  $full = [System.IO.Path]::GetFullPath((Join-Path $repo $_))
  if (-not $full.StartsWith($repo, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Out of repo: $full" }
  if (Test-Path -LiteralPath $full) { Remove-Item -LiteralPath $full -Force }
}
```

Expected: 只删除批准清单；`build/` 和 PDF 仍存在。

- [ ] **Step 5: 做一次真正干净的 npm 安装**

先确认 `node_modules` 绝对路径等于仓库下目录，再删除并运行：

```powershell
$repo = (Resolve-Path .).Path
$nodeModules = [System.IO.Path]::GetFullPath((Join-Path $repo 'node_modules'))
$expectedNodeModules = [System.IO.Path]::GetFullPath("$repo\node_modules")
if (-not $nodeModules.Equals($expectedNodeModules, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Unexpected node_modules path: $nodeModules"
}
if (Test-Path -LiteralPath $nodeModules) {
  Remove-Item -LiteralPath $nodeModules -Recurse -Force
}
npm ci
npm test
npm run build:dev
```

Expected: 干净安装、测试和构建全部 0。

- [ ] **Step 6: 提交旧链删除**

Run:

```powershell
git status --short
git add -u -- craco.config.js public/index.html yarn.lock .yarnrc.yml .yarn/install-state.gz
git commit -m "build: remove CRACO and Yarn configuration"
```

Expected: 提交只包含批准删除；两个用户未跟踪项仍在。

---

### Task 11: 同步仓库文档

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `readme.md`

**Interfaces:**
- Consumes: 最终 npm/Vite 命令和安全部署行为。
- Produces: 后续开发者和代理不会继续使用 Yarn/CRACO 的中文说明。

- [ ] **Step 1: 更新 AGENTS.md 和 CLAUDE.md**

两份文件必须写明：

- 构建工具 Vite 8。
- 包管理器 npm，禁止 Yarn。
- Node.js `>=22.12.0 <23`。
- `npm ci`、`npm start`、`npm test`、`npm run build:dev`、`npm run build:test`/`build:qa`、`npm run build:prod`/`build`、zip、upload 命令。
- legacy 构建存在，但外部 vendor 的旧 WebView 兼容仍需实机验证。

- [ ] **Step 2: 重写 readme.md 构建与部署段**

明确 `build:upload` 固定部署到唯一目录、使用 staging/backup、失败回滚、浏览器成功后才清理 backup。删除旧的 `build:replace` 说明，因为 package.json 没有该命令。

- [ ] **Step 3: 搜索过期命令并提交**

Run:

```powershell
rg -n "Craco|CRACO|Yarn|yarn (install|start|build)|build:replace|NODE_VERSION=18" AGENTS.md CLAUDE.md readme.md package.json build-and-zip.js build-test.js
git diff --check
git add AGENTS.md CLAUDE.md readme.md
git commit -m "docs: document npm and Vite workflows"
```

Expected: 过期命令无结果；仅允许在迁移历史说明中出现 CRACO/Yarn。

---

### Task 12: 完成三环境、ZIP 与最终生产构建验证

**Files:**
- Modify: `docs/superpowers/evidence/2026-07-10-vite-migration-verification.md`
- Generate: `dist/`（不提交）
- Generate: QA/DEV/PR ZIP（不提交，且不得覆盖用户现有 `build/`）

**Interfaces:**
- Consumes: 纯 npm/Vite 工作区。
- Produces: 三环境退出码、耗时、产物合同、ZIP 合同与最终生产 `dist`。

- [ ] **Step 1: 运行开发构建并记录**

Run:

```powershell
$devTime = Measure-Command { npm run build:dev }
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

Expected: 退出码 0；`REACT_APP_ENV=development`；完整 source map；产物合同通过。

- [ ] **Step 2: 运行测试构建并记录**

Run:

```powershell
$testTime = Measure-Command { npm run build:test }
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build:qa
```

Expected: 两个入口都成功；`REACT_APP_ENV=integration`；完整 source map；产物合同通过。

- [ ] **Step 3: 运行生产构建并记录**

Run:

```powershell
$prodTime = Measure-Command { npm run build:prod }
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build
```

Expected: 两个入口都成功；`REACT_APP_ENV=production`；hidden source map 且 map 无源码正文；产物合同通过。

- [ ] **Step 4: 统计每个环境并检查 legacy**

每次构建后记录：总文件数、字节数、gzip 数、JS/CSS/media 数、manifest entrypoints。生产构建还需：

```powershell
rg -n "nomodule|systemjs|legacy" dist\index.html
Get-ChildItem dist\static\js -File | Select-Object Name,Length
```

Expected: HTML 同时包含 modern 与 legacy 加载路径；legacy 文件存在。

- [ ] **Step 5: 验证 ZIP 编排**

Run:

```powershell
npm run build:test:zip
npm run build:zip
```

Expected: QA/DEV 及 QA/DEV/PR ZIP 都成功；打开 ZIP 后根目录直接是 index/static/manifest/version，而不是外层 dist；模拟无效 build 命令时脚本返回非零。

- [ ] **Step 6: 最后重新生成一次生产 dist**

Run:

```powershell
npm run build:prod
npm test
```

Expected: 两个命令退出 0；后续部署源确定是生产包。

- [ ] **Step 7: 更新证据文档并提交**

写入三个环境的命令、退出码、秒数、体积、gzip 数、legacy 文件、ZIP 结构和 CRACO 对比。

Run:

```powershell
git add docs/superpowers/evidence/2026-07-10-vite-migration-verification.md
git commit -m "docs: record Vite build verification"
```

Expected: 证据和真实命令结果一致。

---

### Task 13: 本地 Vite 浏览器 QA

**Files:**
- Modify: `docs/superpowers/evidence/2026-07-10-vite-migration-verification.md`

**Interfaces:**
- Consumes: `npm start` 的 Vite 开发服务器。
- Produces: 首屏、console、network、bridge/vendor 和静态资源证据。

- [ ] **Step 1: 启动可持续的本地服务器**

Run:

```powershell
npm start -- --host 127.0.0.1
```

Expected: `http://127.0.0.1:3000` 可访问，终端无 JSX/config 错误。

- [ ] **Step 2: 浏览器检查页面与全局合同**

打开页面，确认：

- `#root` 有 React 内容。
- loading 在应用渲染后隐藏。
- `window.androidWebkit`、`window.jsBridgeManager`、`window.CR_onGetCreditCardInfoByIngenicoProgress` 存在。
- Task 4 列出的 14 个 native globals 都是 function。
- bridge.js、calculator.js、promotion.js、market.js 请求次数与状态被记录。

- [ ] **Step 3: 检查 console 和 network**

记录所有 error/warning 与失败请求。promotion 既有 404 或外部服务错误必须标成外部基线；任何 Vite chunk、CSS、图片、bridge.js 404 或 JSX runtime 错误都必须先修复，不能进入部署。

- [ ] **Step 4: 保存截图并更新证据**

截图需包含页面已渲染状态；证据文档写明 URL、时间、console error 数、失败请求明细和是否属于本次迁移。

---

### Task 14: 安全部署生产包并验证 Tomcat URL

**Files:**
- Modify: `docs/superpowers/evidence/2026-07-10-vite-migration-verification.md`
- Replace safely: `C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite`

**Interfaces:**
- Consumes: Task 12 最后生成且测试通过的生产 `dist`。
- Produces: 哈希一致的 Tomcat 目标、可回滚 backup、最终 HTTP/浏览器成功证据。

- [ ] **Step 1: 最后验证源和目标绝对路径**

Run:

```powershell
$source = (Resolve-Path .\dist).Path
$target = (Resolve-Path 'C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite').Path
Get-Item -LiteralPath $source,$target | Select-Object FullName,Attributes,LinkType,Target
```

Expected: source 精确为仓库 dist；target 精确为批准路径；两者均不是 reparse point。

- [ ] **Step 2: 执行事务部署并保留 backup**

Run:

```powershell
node upload.js
```

Expected: 输出 staging、backup、文件数、总字节和 SHA-256 比较成功；backup 仍存在；目标的文件集合和哈希与 dist 相同。

- [ ] **Step 3: 先做 HTTP 资源检查**

Run:

```powershell
curl.exe -s -o NUL -w "%{http_code}" 'http://localhost:22080/kpos/kiosklite'
curl.exe -s -o NUL -w "%{http_code}" 'http://localhost:22080/kpos/kiosklite/'
curl.exe -s -o NUL -w "%{http_code}" 'http://localhost:22080/kpos/kiosklite/version.json'
```

Expected: 302、200、200；version 为本次生产包版本。

- [ ] **Step 4: 浏览器检查 Tomcat 部署结果**

访问 `http://localhost:22080/kpos/kiosklite`，确认最终 URL、页面截图、React 挂载、loading、console 和 network。所有 `./static/...`、bridge.js 和 version.json 必须 200；外部 vendor 结果单独记录。

- [ ] **Step 5: 失败时回滚，成功时清理 backup**

若 Task 3 或 4 发现本次构建错误，运行 `node upload.js --rollback <Task-2-输出的-backupDir>` 恢复 backup，然后修复并从 Task 12 Step 6 重跑。

若全部成功，先再次验证 backup 是目标同级、前缀为 `kiosklite.backup-`、不是 reparse point，再运行 `node upload.js --cleanup-backup <Task-2-输出的-backupDir>` 清理；不得删除其他目录。

- [ ] **Step 6: 最终独立验证**

Run:

```powershell
npm ci
npm test
npm run build:dev
npm run build:test
npm run build:prod
git status --short --branch
git diff --check HEAD~1..HEAD
```

Expected: 安装、测试、三环境构建全部退出 0；工作区只保留用户原有两个未跟踪项；无未提交迁移改动。

- [ ] **Step 7: 完成证据文档和最终提交**

证据文档写入部署前后版本、目标路径、source/target 文件数与 SHA-256 结论、HTTP 状态、截图路径、console/network 结果、backup 清理结果，以及外部 vendor/旧设备边界。

Run:

```powershell
git add docs/superpowers/evidence/2026-07-10-vite-migration-verification.md
git commit -m "docs: record Vite deployment verification"
```

Expected: 最终提交只更新证据，所有实施提交可逐项审查。
