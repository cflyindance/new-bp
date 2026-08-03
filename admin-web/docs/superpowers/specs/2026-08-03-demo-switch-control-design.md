# 顶栏 Demo 切换收纳 — 设计文档

> 日期：2026-08-03  
> 模块：全局 Shell 顶栏（商家后台 + M 平台）  
> 状态：已确认，待实现  
> 方案：方案 1 — 顶栏内联滑出面板

## 1. 目标

将现有常显的「视角切换」「版本切换」收纳到顶栏右侧的「Demo切换」入口后：默认只显示 Demo 按钮；点击后向左滑出控制面板，便于演示时按需切换，且不占用顶栏日常空间。

## 2. 已确认决策

| 项 | 决策 |
|----|------|
| 默认态 | 只显示「Demo切换」；视角/版本不可见 |
| 展开交互 | 点击 Demo 后，其左侧内联滑出面板 |
| 面板布局 | 左：上「视角切换」、下「版本切换」；右：「Demo切换」 |
| 收起 | 再点 Demo，或点面板/Demo 以外区域 |
| 选中后 | 切换视角/版本后 **不** 自动收起 Demo 面板 |
| 范围 | 商家后台 + M 平台 |
| M 平台面板内容 | 仅「视角切换」（无版本切换，与现状一致） |
| 打开态持久化 | 不持久化；刷新 / remount 后默认收起 |
| 业务规则 | 不改视角/版本的 MVP 显隐、权限与切换逻辑 |

## 3. 交互与布局

### 3.1 收起

```
… [主题]  [Demo切换]
```

### 3.2 展开（商家后台）

```
┌──────────────┐  ┌──────────┐
│ 视角切换 …   │  │ Demo切换 │
│ 版本切换 …   │  └──────────┘
└──────────────┘
```

### 3.3 展开（M 平台）

```
┌──────────────┐  ┌──────────┐
│ 视角切换 …   │  │ Demo切换 │
└──────────────┘  └──────────┘
```

### 3.4 动画

- 面板默认：`max-width: 0`（或等效宽度折叠）+ `overflow: hidden` + 低透明度
- 展开：过渡到内容固有宽度，自右向左露出；时长约 200–250ms
- 与现有侧栏 `translate-x` 滑层风格一致，不引入新动画库

### 3.5 下拉兼容

视角/版本自身下拉菜单行为不变。点外部关闭时须与现有「点外关下拉」兼容：避免事件互相抢夺导致无法关闭；允许先关下拉再关 Demo 面板，或一次关闭两者，实现时选一种并保持稳定。

## 4. 组件结构与接入

### 4.1 新增

`src/shell/demo-switch-control.ts`

| 导出 | 职责 |
|------|------|
| `renderDemoSwitchControl(options?)` | 返回 Demo 按钮 + 滑出面板 HTML |
| `bindDemoSwitchControl(root)` | 展开/收起、`aria-expanded`、点击外部关闭 |

`options`：

- `showVersionSwitch?: boolean`（默认 `true`）
  - 商家后台：`true` → 面板内上视角、下版本
  - M 平台：`false` → 仅视角

面板内复用现有：

- `renderViewSwitchControl()` / 既有 bind
- `renderVersionSwitchControl()` / 既有 bind（仅当 `showVersionSwitch`）

### 4.2 替换点

| 位置 | 现状 | 改为 |
|------|------|------|
| `src/main.ts` 顶栏 `data-shell-perspective-controls` | 直接渲染视角 + 版本 | `renderDemoSwitchControl({ showVersionSwitch: true })` |
| `src/shell/m-platform-shell.ts` 顶栏右侧 | 直接渲染视角 | `renderDemoSwitchControl({ showVersionSwitch: false })` |

在各自 shell 的事件绑定路径中调用 `bindDemoSwitchControl`（与视角/版本 bind 同生命周期）。

### 4.3 文案（i18n）

至少新增：

- `shell.demoSwitch` → 中文「Demo切换」
- `shell.demoSwitchAria` / `shell.demoSwitchHint`（无障碍与 title，文案实现时补全英/中）

不改动既有 `shell.viewSwitch` / `shell.versionSwitch` 文案。

## 5. 状态与边界

| 场景 | 行为 |
|------|------|
| 刷新页面 | Demo 面板收起 |
| 视角切换导致进/出 M 平台（整页 remount） | 面板回到收起 |
| 窄屏 | 展开后允许顶栏换行，不遮挡主内容关键操作 |
| MVP / 权限导致某控件隐藏 | 仍由原控件内部规则处理；Demo 面板只负责收纳可见控件 |
| 选完视角或版本选项 | Demo 面板保持展开 |

## 6. 非目标（YAGNI）

- 不新增第三种「Demo 模式」业务状态
- 不做 Popover / 右侧整页抽屉替代方案
- 不持久化展开态到 localStorage
- 不重构视角/版本控件内部实现（仅嵌入面板）

## 7. 验收

- [ ] 商家后台顶栏默认只见「Demo切换」
- [ ] M 平台顶栏默认只见「Demo切换」
- [ ] 点击后向左滑出；商家为上视角、下版本；M 平台仅视角
- [ ] 再点 Demo 可收起；点外部可收起
- [ ] 展开后切换视角/版本，行为与改前一致
- [ ] 选完选项后 Demo 面板仍展开
- [ ] 进/出 M 平台 remount 后面板为收起态
