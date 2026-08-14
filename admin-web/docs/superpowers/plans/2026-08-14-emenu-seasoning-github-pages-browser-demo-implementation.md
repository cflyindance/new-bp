# eMenu 调味设置 GitHub Pages 浏览器演示模式实施计划

日期：2026-08-14

## 实施原则

- 保持 `seasoningApi` 对页面暴露的接口不变。
- 浏览器模式复用现有 Node handler 的业务规则，通过构建时生成浏览器安全副本，避免手工维护第二套 27 方法实现。
- 先取得能够复现 Pages 模式错误的 RED，再完成最小 GREEN 修改。
- 不修改调味页面视觉与现有业务流程。

## Task 1：运行模式契约

文件：

- 新增 `src/emenu-local/seasoning/seasoning-api-mode.ts`
- 新增 `scripts/verify-emenu-local-seasoning-browser-mode.mjs`

步骤：

1. 写失败验证，覆盖 `auto | http | browser`、`.github.io` 自动识别和非法值。
2. 实现纯模式解析函数。
3. 验证本地默认 HTTP、Pages 默认 browser、显式值优先。

## Task 2：浏览器安全 handler 与存储运行时

文件：

- 新增 `scripts/generate-emenu-local-seasoning-browser-handler.mjs`
- 新增 `src/emenu-local/seasoning/seasoning-browser-runtime.ts`
- 生成 `src/emenu-local/seasoning/generated/seasoning-browser-handler.ts`
- 修改 `package.json`

步骤：

1. 写失败验证，证明当前静态模式没有 browser handler。
2. 生成器从现有 Node handler 产生浏览器副本，只替换 Node 内建依赖。
3. 浏览器 runtime 提供 UUID、同步稳定 hash、Buffer 子集、虚拟 fs/path 和 v1 localStorage envelope。
4. 写操作由 Web Lock 串行化；缺少锁能力时安全失败。
5. 覆盖首次 seed、刷新持久化、损坏数据、未知 schema、不可用存储和写入失败。

## Task 3：API transport 接入

文件：

- 新增 `src/emenu-local/seasoning/seasoning-browser-transport.ts`
- 修改 `src/emenu-local/seasoning/seasoning-api.ts`

步骤：

1. 用 fake request/response 将现有 API 调用送入生成的 browser handler。
2. 非 GET 请求统一在 Web Lock 中执行。
3. 所有错误规范化为 `SeasoningApiError(status, code, payload)`。
4. HTTP transport 保持当前 fetch 行为，页面与 store 不增加环境分支。
5. 对全部 `seasoningApi` 方法运行契约验证，重点覆盖草稿 TTL/session/menuVersion、预览 version、分页、价格和版本冲突。

## Task 4：Pages 构建接线

文件：

- 修改 `package.json`
- 修改 `../.github/workflows/build-pages.yml`

步骤：

1. 构建前生成 browser handler。
2. Pages 工作流显式设置 `VITE_EMENU_SEASONING_MODE=browser`。
3. 验证构建产物包含 browser 模式且调味调用不会落到 `/api` fetch。

## Task 5：回归、Build 与 E2E

步骤：

1. 运行新增浏览器模式验证并取得 GREEN。
2. 运行 `npm run verify:emenu-local-seasoning`。
3. 运行 HTTP facade/Vite middleware 集成验证。
4. 运行 TypeScript 检查和 `npm run build`。
5. 用静态 browser 模式打开调味设置，完成加载、编辑或新增、保存、刷新持久化，并确认 Network 无调味 `/api` 请求。
6. 检查工作区，只提交本任务文件，不包含已有无关目录。

