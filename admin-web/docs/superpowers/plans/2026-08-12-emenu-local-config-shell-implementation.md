# eMenu 本地配置后台独立壳层实施计划

**设计依据**：`docs/superpowers/specs/2026-08-12-emenu-local-config-shell-design.md`

## 1. 建立结构验证护栏

- 新增 `scripts/verify-emenu-local-config-shell.mjs`。
- 校验五个路由、名称与顺序、默认路由、Shell 模式、Demo 视角入口、主挂载分支、中英文文案和关键无障碍标识。
- 在实现前运行并保留因目标结构缺失而失败的 RED 证据。

## 2. 扩展 Shell 模式

- 修改 `src/shell/app-shell-mode.ts`，增加 `emenu-local` 模式。
- 增加 `enterEmenuLocalShell`、`exitEmenuLocalShell`、`isEmenuLocalShellMode`。
- 进入任一非商家 Shell 时覆盖旧模式，退出时统一回到 merchant；保留 M 平台进入提示语义。

## 3. 新增 eMenu 本地 Shell

- 新增 `src/shell/emenu-local-shell.ts`。
- 以单一导航数组声明五个路由、中文/英文 i18n key、说明和图标类型。
- 提供路由判断、默认路由、合法路由归一化、当前项解析、Shell 渲染与绑定。
- 渲染响应式独立壳层、桌面侧栏、窄屏横向/折行导航、一体化白色画布和五个占位页。
- 占位页只展示标题、说明和“功能建设中”，不创建虚假表单或按钮。
- Shell 内挂载无版本切换的 Demo 浮球并绑定主题切换、视角切换。

## 4. 接入 Demo 视角切换

- 修改 `src/shell/view-switch-control.ts`，增加 `emenu-local` 模式、菜单项、当前标签与提示。
- 从商家后台或 M 平台进入时清理旧 Shell 状态，并跳转到 eMenu 默认页。
- 从 eMenu 切回商家后台时退出 eMenu Shell并进入商家首页；切到 M 平台时进入现有 M 平台默认页。
- 保留 MVP、未来版本和代登录现有门控。

## 5. 接入主挂载与国际化

- 修改 `src/main.ts`，在 M 平台分支之前识别 eMenu 路由/Shell 模式。
- 未知 eMenu 子路由重定向到设备设置；代登录直达 eMenu 路由时回到品牌多门店商家首页。
- 修改 `src/i18n.ts`，补齐入口、Shell、五个页面、说明、“功能建设中”和 aria 文案的中英文内容。
- 优先使用 Tailwind 工具类；仅当现有构建无法稳定表达时才修改 `src/styles/app.css`。

## 6. 验证

- 运行 `node scripts/verify-emenu-local-config-shell.mjs` 取得 GREEN。
- 运行 `npx tsc --noEmit`，不触发会改写 `src/generated/build-stamp.ts` 的生产构建。
- 对修改文件运行 `git diff --check`。
- 使用现有 Vite 服务进行浏览器 E2E：
  - 登录后从 Demo 浮球进入 eMenu；
  - 顺序点击五个导航并检查 URL、选中态、标题和说明；
  - 刷新当前页并检查保持；
  - 检查未知路由归一化；
  - 检查切回商家后台、进入 M 平台；
  - 检查未来版本/MVP 门控和至少一个窄屏视口；
  - 检查浏览器控制台无新增错误。
