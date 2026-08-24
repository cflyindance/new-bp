# eMenu 顾客端可缩放与自适应视口实施计划

> 设计依据：`docs/superpowers/specs/2026-08-24-emenu-responsive-resizable-viewport-design.md`

## 实施原则

- 先建立可单测的布局计算与会话状态，再接入 React 组件。
- 先保持 100% 全宽全高完成无回归迁移，再逐步开启顾客调整入口。
- 新旧菜单渲染路径（`OrderListWrapper` 与 `OldOrderPage`）必须共享同一视口状态与网格规则。
- 屏幕层的顶部栏、购物车、结账和模态框不进入可缩放容器。
- 每一阶段只提交本阶段文件，避免把当前脏工作区中的其他改动带入提交。

## 任务 1：建立纯布局领域模块和专项验证

**新增文件**

- `vendor/emenu-new/src/utils/emenuViewportLayout.js`
- `scripts/verify-emenu-responsive-viewport.mjs`

**修改文件**

- `package.json`

**实施内容**

1. 在纯函数模块中定义默认配置、密度令牌和安全范围：缩放 75%～140%，宽度比例 60%～100%，高度比例 55%～100%。
2. 实现配置规范化、方向判断、宽高裁剪、5% 吸附和卡片列数计算。
3. 将列阈值迟滞明确为 16 CSS px：当前列数仍在阈值上下 16 px 内时保持原列数，越过后才增减列。
4. 实现横屏 2～6 列、竖屏 2～4 列，以及分类栏折叠判定。
5. 将密度令牌固定为设计文档中的卡片宽度、网格间距和内容内边距。
6. 专项脚本覆盖非法配置、上下限、三种密度、横竖屏、临界宽度迟滞、5% 吸附和可访问性下限。
7. 在根 `package.json` 增加 `verify:emenu-responsive-viewport`。

**验证**

```powershell
npm.cmd run verify:emenu-responsive-viewport
```

**提交建议**

```text
test: define emenu responsive viewport rules
```

## 任务 2：增加门店默认配置并沿用现有下发通路

**修改文件**

- `vendor/emenu-new/src/constants/systemConfig.js`
- `vendor/emenu-new/src/components/AdminSettings/SettingMenuDisplay.jsx`
- `vendor/emenu-new/src/locales/zh.json`
- `vendor/emenu-new/src/locales/en.json`
- 其他当前正式支持语言对应的 locale JSON
- `scripts/verify-emenu-responsive-viewport.mjs`

**实施内容**

1. 为 `ALL_CONFIG_ITEM` 增加唯一配置 ID 和 `emenuDisplayDefaults` 键，默认值为全宽、全高、100%、标准密度，三个顾客调整能力开启。
2. 保持该配置为全局配置，不加入 `DEVICE_DEFAULT_CONFIG`，避免产生单设备覆盖。
3. 在“菜单显示”设置中增加“顾客显示调整”配置组：默认比例、默认宽度、默认高度、密度、顾客调整主开关、手势开关和拖拽开关。
4. 主开关关闭时禁用两个子开关及默认比例之外的顾客交互说明，但不删除已保存值。
5. 保存继续调用 `changeGlobalConfig`（若现有 hook 名称不同则使用其全局配置写入方法）和 `effects.setConfig()`；不得新增请求端点。
6. Reset/Discard 必须恢复打开页面时的服务端值，Save 成功后沿用当前关闭和跳转行为。
7. 专项验证检查配置 ID 唯一、默认结构完整、未进入设备默认列表，并静态确认设置页使用既有保存通路。

**验证**

```powershell
npm.cmd run verify:emenu-responsive-viewport
npm.cmd run build:emenu-new-embed
```

**提交建议**

```text
feat: configure emenu guest display resizing
```

## 任务 3：实现会话偏好存储和生命周期

**新增文件**

- `vendor/emenu-new/src/utils/emenuViewportPreference.js`
- `vendor/emenu-new/src/hooks/useEmenuViewportPreference.js`

**修改文件**

- `scripts/verify-emenu-responsive-viewport.mjs`

**实施内容**

1. 使用独立键 `emenu_viewport_preference` 保存当前会话覆盖值，结构包含 `sessionKey`、宽高比例、缩放、密度和更新时间。
2. 会话标识优先使用 `emenu_table.currentOrder.id`；尚未产生订单时使用 `currentArea.id + currentTable.id` 组成的 table key。
3. order ID 从空值变为有效值时迁移同桌 table key 的覆盖值；桌台变化、订单变化到另一订单、退出或会话失效时清除不匹配的覆盖值。
4. 不允许只按设备保存一份无会话归属的偏好。
5. 合并顺序固定为：领域默认值 → 门店全局配置 → 当前会话覆盖值 → 当前设备安全裁剪。
6. 增加存储解析失败、旧结构、桌台切换、订单建立、订单结束和新开台的专项测试。

**验证**

```powershell
npm.cmd run verify:emenu-responsive-viewport
```

**提交建议**

```text
feat: scope emenu display preferences to order sessions
```

## 任务 4：建立视口上下文和统一控制器

**新增文件**

- `vendor/emenu-new/src/contexts/EmenuViewportContext.jsx`
- `vendor/emenu-new/src/hooks/useEmenuViewport.js`

**修改文件**

- `vendor/emenu-new/src/pages/Order/Order.jsx`

**实施内容**

1. 在 `Order` 的屏幕层内、`TopBar` 和菜单内容共同祖先处挂载 `EmenuViewportProvider`。
2. Provider 从 `useSystemConfig` 读取门店默认配置，从会话 hook 读取覆盖值。
3. 使用单个 `ResizeObserver` 测量屏幕层可用内容区；不可用时降级到 `resize` 和 `orientationchange`。
4. 暴露只读状态以及 `setPreset`、`setScale`、`resizeTo`、`resetToStoreDefault`、`beginInteraction`、`endInteraction`。
5. 通过 `requestAnimationFrame` 合并高频更新；组件卸载时取消帧、观察器和事件监听。
6. `source` 对应 store-default、preset、gesture、drag、window-resize、rotation 和 fallback。
7. 默认配置保持 100% 全宽全高时，Provider 接入前后页面几何应一致。

**验证**

```powershell
npm.cmd run verify:emenu-responsive-viewport
npm.cmd run build:emenu-new-embed
```

**提交建议**

```text
feat: add emenu viewport layout controller
```

## 任务 5：实现菜单视口容器和拖拽手柄

**新增文件**

- `vendor/emenu-new/src/components/ResizableMenuViewport/index.jsx`
- `vendor/emenu-new/src/components/ResizableMenuViewport/index.module.less`

**修改文件**

- `vendor/emenu-new/src/pages/Order/Order.jsx`
- `vendor/emenu-new/src/pages/Order/Order.module.less`（若页面样式迁出 `makeStyles`；否则保留同文件样式）

**实施内容**

1. 只包裹 `OrderListWrapper`、`OldOrderPage` 或 `EmptyOrder`，不包裹 `TopBar`、购物车和页面级弹窗。
2. 容器按控制器宽高在可用内容区居中，背景沿用现有 `#1A2241` 主题。
3. 主开关与拖拽开关同时开启时显示右、下和右下手柄；空菜单时隐藏手柄。
4. 手柄使用 Pointer Events 和 pointer capture；只有从 24 px 命中区开始的指针才进入拖拽。
5. 拖拽中阻止该指针产生菜单滚动或点击，其他区域仍按原行为工作。
6. 释放或取消时吸附到 5%，提交最后一个合法状态，并触发一次完整布局测量。
7. 页面级模态打开时通过上下文结束活动交互；若无法集中获得模态状态，先在共享弹窗打开入口调用 `endInteraction`，不得用全局 DOM 扫描判断。

**验证**

```powershell
npm.cmd run verify:emenu-responsive-viewport
npm.cmd run build:emenu-new-embed
```

手工验证 1024×768 横屏与 768×1024 竖屏下的三个手柄、边界阻尼、释放吸附和菜单滚动不误触。

**提交建议**

```text
feat: add resizable emenu menu viewport
```

## 任务 6：实现显示大小入口和缩放手势

**新增文件**

- `vendor/emenu-new/src/components/DisplaySizeControl/index.jsx`
- `vendor/emenu-new/src/components/DisplaySizeControl/index.module.less`
- `vendor/emenu-new/src/hooks/useEmenuViewportGesture.js`

**修改文件**

- `vendor/emenu-new/src/components/TopBar/index.jsx`
- eMenu locale JSON

**实施内容**

1. 在 TopBar 右侧操作区增加当前比例入口，不改变搜索、语言、购物车和服务按钮的行为。
2. 弹层提供 85%、100%、120% 三档、75%～140% 原生范围输入和“恢复门店默认”。
3. 范围输入步长 5%，补充 `aria-valuetext`；验证方向键、PageUp/PageDown、Home/End。
4. 主开关关闭时不渲染入口。手势子开关关闭时仍保留按钮和滑杆。
5. 在菜单视口上监听双指 Pointer Events 与 `Ctrl + wheel`；普通单指、普通滚轮保持菜单滚动。
6. 双指开始时设置交互锁，结束 150 ms 后释放；交互锁期间菜品点击处理应短路。
7. 达到缩放边界时保持状态不变，并显示轻量视觉反馈；`navigator.vibrate` 存在且允许时才使用短触觉反馈。

**验证**

```powershell
npm.cmd run verify:emenu-responsive-viewport
npm.cmd run build:emenu-new-embed
```

手工验证触屏双指、触控板/鼠标 `Ctrl + wheel`、普通滚动、键盘调节和三个权限开关组合。

**提交建议**

```text
feat: add emenu display size controls
```

## 任务 7：迁移懒加载菜单到容器测量与响应式网格

**修改文件**

- `vendor/emenu-new/src/pages/Order/components/OrderListWrapper.jsx`
- `vendor/emenu-new/src/components/LeftMenu/index.jsx`
- `vendor/emenu-new/src/components/RightContent/index.jsx`
- `vendor/emenu-new/src/utils/virtualListData.js`
- `vendor/emenu-new/src/components/DishItemCard/index.jsx`
- `scripts/verify-emenu-responsive-viewport.mjs`

**实施内容**

1. `OrderListWrapper` 从上下文取得内容高度，移除菜单内部 `calc(100vh - ...)`。
2. `LeftMenu` 使用容器高度；在控制器给出折叠模式时切换为顶部分类入口。
3. `RightContent` 移除 `calc(100vw - 241px)` 和 `window.innerHeight`，以测得的内容宽高配置 `VariableSizeList`。
4. `virtualListData` 接受显式列数，禁止读取 `window.innerWidth`；大卡占两列，普通卡占一列，并据此稳定分行。
5. 用计算后的 CSS Grid 或等价显式列宽替代 Material UI 的固定 `md/sm/xs` 菜品断点。
6. 在跨列前记录当前可见分类 ID 和标题偏移；`resetAfterIndex(0, true)` 后恢复分类与偏移。
7. 密度和缩放通过菜单视口 CSS 自定义属性传入卡片，保留 14 px 文字和 44 px 触控下限。
8. 专项脚本静态禁止这些目标文件继续出现布局用途的 `100vw`、`100vh`、`window.innerWidth` 和 `window.innerHeight`。

**验证**

```powershell
npm.cmd run verify:emenu-responsive-viewport
npm.cmd run build:emenu-new-embed
```

按横屏 1024×768、1280×800、1366×768、1920×1080 验证 2～6 列、临界宽度迟滞、分类滚动恢复和无菜单请求。

**提交建议**

```text
refactor: make emenu virtual menu container responsive
```

## 任务 8：迁移旧菜单渲染路径

**修改文件**

- `vendor/emenu-new/src/components/OldOrderPage/index.jsx`
- `vendor/emenu-new/src/components/OldOrderPage/LeftMenu.jsx`
- `vendor/emenu-new/src/components/OldOrderPage/RightContent.jsx`
- `vendor/emenu-new/src/components/OrderBaseContent/index.jsx`（仅处理继承的容器尺寸依赖）
- `scripts/verify-emenu-responsive-viewport.mjs`

**实施内容**

1. 旧路径消费与懒加载路径完全相同的上下文状态、密度令牌和分类栏折叠条件。
2. 移除旧 `LeftMenu` 的 `calc(100vh - ...)`，使用容器高度。
3. 将旧 `RightContent` 的固定 Material UI `md/sm/xs` 列宽替换为共享列数规则。
4. 分类切换和搜索仍保持旧路径现有语义；只在尺寸重排时保留当前分类，不改变业务筛选。
5. `OrderBaseContent` 的弹窗尺寸继续相对屏幕层；菜单内列表尺寸改用可用容器值。
6. 专项脚本同时检查新旧路径，防止只修复其中一种菜单模式。

**验证**

```powershell
npm.cmd run verify:emenu-responsive-viewport
npm.cmd run build:emenu-new-embed
```

分别把懒加载配置打开和关闭，执行相同横竖屏与缩放矩阵。

**提交建议**

```text
refactor: make legacy emenu menu container responsive
```

## 任务 9：完成模态隔离、降级与诊断

**修改文件**

- `vendor/emenu-new/src/contexts/EmenuViewportContext.jsx`
- `vendor/emenu-new/src/components/ResizableMenuViewport/index.jsx`
- `vendor/emenu-new/src/components/ShoppingCart/index.jsx`
- `vendor/emenu-new/src/components/DishDialog` 下实际控制页面级弹窗的入口文件
- `vendor/emenu-new/src/components/common/ErrorBoundary/index.jsx`（仅在现有诊断通路适合时接入）
- `scripts/verify-emenu-responsive-viewport.mjs`

**实施内容**

1. 购物车、菜品弹窗和结账确认打开时结束当前拖拽/缩放，并在模态关闭前锁定新交互。
2. `ResizeObserver` 不可用时验证降级监听；不可用不是致命错误。
3. 非法尺寸裁剪并按会话去重记录诊断，禁止高频日志刷屏。
4. 低性能降级开关只推迟列数重算到交互结束，不改变最终状态。
5. 确认页面级 Portal/Modal 不位于带 transform 或 overflow 裁切的菜单节点内。

**验证**

```powershell
npm.cmd run verify:emenu-responsive-viewport
npm.cmd run build:emenu-new-embed
```

手工验证拖拽中打开菜品弹窗、购物车、结账确认，以及模拟无 `ResizeObserver` 环境。

**提交建议**

```text
fix: isolate emenu overlays from viewport resizing
```

## 任务 10：完成矩阵验收和嵌入构建

**修改文件**

- `scripts/verify-emenu-responsive-viewport.mjs`
- `docs/superpowers/specs/2026-08-24-emenu-responsive-resizable-viewport-design.md`（仅记录实施中确认的非行为性细节，如最终配置 ID）

**实施内容**

1. 完成横屏 1024×768、1280×800、1366×768、1920×1080。
2. 完成竖屏 768×1024、800×1280、1080×1920。
3. 每个视口验证 75%、100%、120%、140%，以及最小/最大宽高。
4. 验证紧凑、标准、舒适三种密度和三个权限开关组合。
5. 使用浏览器性能工具确认拖拽事件已合帧、尺寸变化没有菜单请求、稳定状态没有观察器循环。
6. 检查文字、价格、图片、加购按钮、分类入口、购物车和模态层无重叠或裁切。
7. 构建根项目嵌入资源，确认 `dist/emenu-new` 正常更新；提交时只包含本功能明确要求的构建产物，避免混入现有脏产物。

**最终验证**

```powershell
npm.cmd run verify:emenu-responsive-viewport
npm.cmd run build:emenu-new-embed
npm.cmd run build
```

**提交建议**

```text
test: verify emenu responsive viewport matrix
```

## 完成定义

- 门店能保存并下发默认显示配置。
- 顾客三种调整方式均受配置开关控制，并修改同一视口状态。
- 新旧菜单路径在横竖屏中按容器宽度稳定重排。
- 新开台不会继承上一桌顾客设置。
- 菜品滚动位置、购物车、结账和弹窗流程不因调整尺寸而回归。
- 专项验证、eMenu 嵌入构建和根项目构建全部通过。
