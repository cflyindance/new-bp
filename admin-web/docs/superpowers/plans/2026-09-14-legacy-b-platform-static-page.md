# 老 B 平台静态商户页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在悬浮球“视角切换”中新增“老B平台”，并提供保留悬浮球的独立全屏静态商户页。

**Architecture:** 扩展现有 `AppShellMode`，由专用 hash 路由 `/legacy-b/merchants` 驱动 `legacy-b` 独立壳层。视角切换组件统一负责进入与退出 shell；新 shell 模块只承担固定数据、静态页面渲染和悬浮球绑定，`main.ts` 负责认证后、onboarding 后的分支挂载与路径规范化。

**Tech Stack:** TypeScript、Vite、项目现有 Tailwind CSS、原生 DOM 事件绑定、Node.js 静态契约验证脚本。

**Spec:** `docs/superpowers/specs/2026-09-14-legacy-b-platform-static-page-design.md`

## Global Constraints

- 页面为纯静态展示，不接后端接口，不实现商户卡片点击。
- 老 B 页面隐藏商家后台顶栏和侧栏，但必须保留现有悬浮球。
- shell mode 固定为 `legacy-b`，规范路径固定为 `/legacy-b/merchants`。
- 老 B 页面必须位于现有登录和 onboarding 守卫之后。
- 入口遵循 `isViewSwitchRestricted()`，但不受 MVP / 复杂版本开关控制。
- 不修改 `vendor/emenu-new`，因此不触发 eMenu 嵌入包发布流程。
- 保留工作区中所有无关的已有改动，提交时只包含本任务文件。

---

### Task 1: 建立老 B shell mode 与路由契约

**Files:**
- Modify: `src/shell/app-shell-mode.ts`
- Create: `src/shell/legacy-b-shell.ts`
- Create: `scripts/verify-legacy-b-platform.mjs`

**Interfaces:**
- Produces: `LEGACY_B_DEFAULT_PATH: "/legacy-b/merchants"`
- Produces: `isLegacyBContentPath(path: string): boolean`
- Produces: `normalizeLegacyBPath(path: string): string`
- Produces: `isLegacyBShellMode(): boolean`
- Produces: `enterLegacyBShell(): void`
- Produces: `exitLegacyBShell(): void`

- [ ] **Step 1: 写入失败的静态契约验证**

在 `scripts/verify-legacy-b-platform.mjs` 中读取源文件并断言：`AppShellMode` 包含 `legacy-b`、读取逻辑接受该值、专用 shell 导出默认路径和路径规范化函数。失败时抛出带断言名称的错误，成功时输出 `Legacy B platform verification passed.`。

- [ ] **Step 2: 运行验证并确认失败**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: FAIL，指出 `legacy-b` mode 或 `legacy-b-shell.ts` 尚不存在。

- [ ] **Step 3: 实现最小 shell mode 与路由函数**

在 `app-shell-mode.ts` 中把类型扩展为：

```ts
export type AppShellMode = "merchant" | "m-platform" | "legacy-b" | "emenu-local" | "kiosk-local" | "pit";
```

并补充：

```ts
export function isLegacyBShellMode(): boolean {
  return readAppShellMode() === "legacy-b";
}

export function enterLegacyBShell(): void {
  writeAppShellMode("legacy-b");
}

export function exitLegacyBShell(): void {
  writeAppShellMode("merchant");
}
```

在新 shell 文件中定义：

```ts
export const LEGACY_B_DEFAULT_PATH = "/legacy-b/merchants";

export function isLegacyBContentPath(path: string): boolean {
  return path === "/legacy-b" || path.startsWith("/legacy-b/");
}

export function normalizeLegacyBPath(_path: string): string {
  return LEGACY_B_DEFAULT_PATH;
}
```

- [ ] **Step 4: 运行验证并确认通过**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: PASS，输出 `Legacy B platform verification passed.`。

- [ ] **Step 5: 提交本任务**

```bash
git add admin-web/src/shell/app-shell-mode.ts admin-web/src/shell/legacy-b-shell.ts admin-web/scripts/verify-legacy-b-platform.mjs
git commit -m "feat: add legacy B shell mode"
```

### Task 2: 将老 B 平台接入视角切换

**Files:**
- Modify: `src/shell/view-switch-control.ts`
- Modify: `src/i18n.ts`
- Modify: `scripts/verify-legacy-b-platform.mjs`

**Interfaces:**
- Consumes: `enterLegacyBShell()`、`exitLegacyBShell()`、`isLegacyBShellMode()`、`LEGACY_B_DEFAULT_PATH`
- Produces: `ViewSwitchMode = SidebarNavLayoutPreset | "m-platform" | "legacy-b"`
- Produces: `shell.legacyBPlatform` 与 `shell.legacyBPlatformHint` 中英文文案

- [ ] **Step 1: 扩充验证脚本并确认失败**

加入对以下静态契约的断言：菜单项包含 `data-view-switch-option="legacy-b"`；平铺悬浮球选项始终渲染老 B 卡片；事件白名单接受 `legacy-b`；进入老 B 时使用 `LEGACY_B_DEFAULT_PATH`；中英文 i18n 键存在。

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: FAIL，指出视角切换尚无老 B 入口。

- [ ] **Step 2: 实现菜单、平铺卡片和当前态**

扩展模式类型，并在 `getCurrentViewSwitchMode()`、`labelForMode()`、`hintForMode()` 中优先识别 `legacy-b`。新增 `renderLegacyBMenuItem()` 与 `renderFlatLegacyBCard()`，文案分别使用：

```ts
"shell.legacyBPlatform": "老B平台"
"shell.legacyBPlatformHint": "查看旧版 B 平台商户列表"
```

英文值使用 `Legacy B Platform` 与 `View the legacy B Platform merchant list`。普通菜单中放在 M 平台之后；平铺悬浮球网格中也放在 M 平台之后，且不套产品版本条件。

- [ ] **Step 3: 实现跨 shell 切换**

`applyViewSwitchMode("legacy-b")` 调用 `enterLegacyBShell()`、更新 hash 为 `#${LEGACY_B_DEFAULT_PATH}` 并重新挂载。切换门店、连锁或 M 平台前，若当前为老 B mode，则调用 `exitLegacyBShell()`；进入任意独立 shell 时由对应 `enter*Shell()` 覆盖旧 mode。

- [ ] **Step 4: 运行验证并构建**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: PASS。

Run: `npx tsc --noEmit`

Expected: exit code 0。

- [ ] **Step 5: 提交本任务**

```bash
git add admin-web/src/shell/view-switch-control.ts admin-web/src/i18n.ts admin-web/scripts/verify-legacy-b-platform.mjs
git commit -m "feat: add legacy B view switch entry"
```

### Task 3: 实现静态商户页并挂载独立壳层

**Files:**
- Modify: `src/shell/legacy-b-shell.ts`
- Modify: `src/main.ts`
- Modify: `scripts/verify-legacy-b-platform.mjs`

**Interfaces:**
- Consumes: `mountDemoSwitchFab({ showVersionSwitch: false })`、`bindViewSwitchControl(onMount)`
- Produces: `mountLegacyBShell(): string`
- Produces: `bindLegacyBShell(onMount: () => void): void`

- [ ] **Step 1: 扩充页面契约验证并确认失败**

验证脚本断言新 shell 源码包含四个确定商户名、四组 Locations、权限文本、`mountDemoSwitchFab` 与 `bindViewSwitchControl`；断言 `main.ts` 在认证/onboarding 之后导入并挂载老 B shell，且 eMenu/Kiosk/M 平台的兜底条件排除老 B 内容路径。

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: FAIL，指出静态页面或 main 挂载尚未完成。

- [ ] **Step 2: 实现静态数据和语义化页面**

在 `legacy-b-shell.ts` 定义只读商户数组：

```ts
const LEGACY_B_MERCHANTS = [
  { name: "大飞鸽-AD", locations: 1, permissions: ["Cloud Report Full Access", "Cloud Report Open API Full Access", "Cloud Report BO - Overview"] },
  { name: "敦煌", locations: 1, permissions: ["Cloud Report Full Access", "Cloud Report Open API Full Access", "Cloud Report - Payment Internal Access"] },
  { name: "小飞鸽-连锁集团-13041自…", locations: 3, permissions: ["Cloud Report Full Access", "Cloud Report Open API Full Access", "Cloud Report - Payment Internal Access"] },
  { name: "小飞鸽-联想PC", locations: 1, permissions: ["Cloud Report Full Access", "Cloud Report Open API Full Access", "Cloud Report - Payment Internal Access"] },
] as const;
```

`mountLegacyBShell()` 返回 `min-h-dvh` 深紫背景页面：品牌头部、用户信息、居中标题、两列/单列响应式列表。卡片使用四种受控渐变、约 20px 圆角、半透明品牌水印 SVG；卡片本身使用 `<article>`，不添加按钮或链接角色。

- [ ] **Step 3: 绑定悬浮球并接入 main 挂载**

`bindLegacyBShell(onMount)` 只调用：

```ts
mountDemoSwitchFab({ showVersionSwitch: false });
bindViewSwitchControl(onMount);
```

在 `main.ts` 的认证和 onboarding 守卫之后、eMenu 分支之前加入老 B 分支：受限时退出并回到 `APP_NAV_HOME_PATH`；前缀路径先规范化；合法路径写入 mode、渲染并绑定后 return。现有 eMenu/Kiosk/M 平台 shell-mode 兜底条件增加 `!isLegacyBContentPath(authPath)`。

- [ ] **Step 4: 运行静态验证与类型检查**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: PASS。

Run: `npx tsc --noEmit`

Expected: exit code 0。

- [ ] **Step 5: 提交本任务**

```bash
git add admin-web/src/shell/legacy-b-shell.ts admin-web/src/main.ts admin-web/scripts/verify-legacy-b-platform.mjs
git commit -m "feat: build legacy B merchant page"
```

### Task 4: 构建与浏览器验收

**Files:**
- Modify only if verification exposes defects: `src/shell/legacy-b-shell.ts`、`src/shell/view-switch-control.ts`、`src/main.ts`、`src/i18n.ts`
- Verify: `dist/index.html` and Vite-generated root assets

**Interfaces:**
- Consumes: 完整老 B 独立壳层与视角切换能力
- Produces: 构建通过且经实际浏览器验证的静态页面

- [ ] **Step 1: 运行完整根项目构建**

Run: `npm.cmd run build`

Expected: TypeScript 与 Vite 成功退出。若构建更新现有 `dist` 产物，只记录与本任务相关的根应用构建结果，不覆盖或清理用户已有的 dist 改动。

- [ ] **Step 2: 启动开发服务器**

Run: `npm run dev -- --host 127.0.0.1 --port 64906`

Expected: `http://127.0.0.1:64906` 可访问。

- [ ] **Step 3: 浏览器验证桌面布局**

登录后从悬浮球选择“老B平台”，确认 URL 为 `#/legacy-b/merchants`，商家后台顶栏/侧栏不存在，悬浮球存在；在约 1920×1080 视口核对深紫背景、品牌头、用户信息、标题、两列渐变卡片和固定文本。

- [ ] **Step 4: 浏览器验证切换、刷新与窄屏**

刷新专用路径确认页面恢复；从悬浮球切到门店版、品牌多门店及 M 平台确认均能退出；在约 390px 宽视口确认卡片为单列且无横向滚动；受限账号状态仅用现有可复现场景验证入口不出现。

- [ ] **Step 5: 修复发现的问题并重复验证**

每次修复后重新运行：

```bash
node scripts/verify-legacy-b-platform.mjs
npx tsc --noEmit
npm.cmd run build
```

Expected: 全部退出码为 0，浏览器验收项全部通过。

- [ ] **Step 6: 提交验收修复（仅在有修复时）**

```bash
git add admin-web/src/shell/legacy-b-shell.ts admin-web/src/shell/view-switch-control.ts admin-web/src/main.ts admin-web/src/i18n.ts admin-web/scripts/verify-legacy-b-platform.mjs
git commit -m "fix: polish legacy B platform page"
```
