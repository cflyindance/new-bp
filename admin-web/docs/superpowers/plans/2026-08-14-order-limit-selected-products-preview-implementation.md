# 数量与频次规则已选商品预览实施计划

> 依据规格：`docs/superpowers/specs/2026-08-14-order-limit-selected-products-preview-design.md`

## 目标

在数量与频次规则第 2 步“商品配置”中增加“查看已选商品（N）”弹窗。弹窗从现有按门店保存的 `structureByLine` 实时派生实际限购对象，支持门店/产线联动筛选、10/20/50 分页、当前页勾选、单个/批量/全部删除二次确认，并保证删除原子更新商品结构、目标列表、数量矩阵和生效门店状态。

## 约束

- 所有代码、测试、文档和提交只在 worktree `codex/order-limit-selected-products-preview` 中完成。
- 不新增草稿或发布持久化字段。
- 不维护第二份已选对象清单。
- 删除必须调用品牌菜单选择器级联接口，不直接拼接或删除键数组。
- 跨门店批量删除必须先在克隆草稿中完成全部预计算，再一次性提交。
- 先写失败验证，再实现功能。

## 涉及文件

- 修改：`dist/Configuration center/assets/brand-menu-structure-picker.js`
- 修改：`dist/Configuration center/assets/order-limit-flow.js`
- 修改：`dist/Configuration center/assets/order-limit-flow.css`
- 新增：`scripts/verify-order-limit-selected-products-preview.mjs`
- 已有规格：`docs/superpowers/specs/2026-08-14-order-limit-selected-products-preview-design.md`

## 任务 1：建立失败验证

### 1.1 新增专项脚本

创建 `scripts/verify-order-limit-selected-products-preview.mjs`，使用 `node:vm` 加载 `brand-menu-structure-picker.js`，并读取订单限购流程和样式源文件。

验证选择器计划新增的 `listSelectedTargets(byLine, leafLevel)`：

- 空结构返回空数组。
- `leafLevel === "dish"` 时每个已选菜品产生一行。
- `leafLevel === "category"` 时每个完整已选分类只产生一行。
- 分类结果包含 `dishCount`，不展开成重复菜品行。
- 结果包含稳定的 `lineId`、`lineLabel`、路径、`targetKey` 和 `targetType`。
- 结果顺序与产线和菜单树顺序一致。
- 跨产线同名菜品保持独立。

静态验证订单限购流程包含：

- `data-selected-preview-open`
- `data-selected-preview-store`
- `data-selected-preview-line`
- `data-selected-preview-page-size`
- `data-selected-preview-row`
- `data-selected-preview-delete`
- `selectedPreview`
- 原子删除辅助函数
- 全部删除不使用当前筛选结果作为删除集合
- 预览临时状态不进入 `defaultDraft`、兼容输出和发布快照

静态验证样式包含预览弹窗、筛选区、表格、分页、空状态和确认层级。

### 1.2 运行并确认 RED

```powershell
node scripts/verify-order-limit-selected-products-preview.mjs
```

预期：因 `listSelectedTargets` 或预览标记尚不存在而失败。

## 任务 2：扩展品牌菜单选择器的已选目标枚举

### 2.1 实现 `listSelectedTargets`

在 `brand-menu-structure-picker.js` 的 `listSelectedDishes`、`listAllDishes` 附近增加：

```js
function listSelectedTargets(byLine, leafLevel) { /* ... */ }
```

实现规则：

1. 使用 `normalizeByLine` 和现有菜单树顺序。
2. 每条产线调用 `keysToSelection` 得到归一化选择态。
3. 菜品模式扫描菜品键，仅输出被选菜品。
4. 分类模式扫描分类键，仅输出完整选中分类。
5. 分类结果携带 `dishCount`，菜品结果为 `1`。
6. 返回新数组和新对象，不暴露内部树引用。

导出 `listSelectedTargets`，继续保留现有 `listSelectedDishes` 兼容行为。

### 2.2 GREEN

运行专项脚本，预期选择器相关断言通过，流程静态断言仍失败。

## 任务 3：增加预览临时状态和派生函数

### 3.1 初始化和重置状态

在 `mountEditor()` 的 `editorState` 中增加：

```js
selectedPreview: {
  open: false,
  storeId: "",
  lineId: "",
  page: 1,
  pageSize: 10,
  selectedRowIds: [],
  pendingDelete: null,
}
```

增加 `createSelectedPreviewState()`、`resetSelectedPreview()` 和 `closeSelectedPreview()`，避免在多个事件中手工清字段。

### 3.2 派生所有预览行

增加：

```js
function selectedPreviewRows(draft) { /* ... */ }
```

处理流程：

- 只遍历 `addedStoreIds(draft)` 中仍可用的门店。
- 对每家门店调用 `MenuPicker.listSelectedTargets(config.structureByLine, draft.targetType)`。
- 合并门店 ID、门店名和目标描述。
- 使用 `storeId|lineId|targetKey` 生成稳定 `rowId`。
- 保持门店、产线和菜单树稳定顺序。

增加 `selectedPreviewFilterOptions`、`filteredSelectedPreviewRows`、`pagedSelectedPreviewRows` 和 `normalizeSelectedPreviewState`：

- 门店选项只包含有预览行的门店。
- 产线选项根据门店筛选联动生成。
- 失效门店或产线筛选自动清空。
- 页码限制在有效范围。
- 勾选只保留当前页仍存在的行。

### 3.3 计数口径

入口和标题使用 `selectedPreviewRows(draft).length`，不得使用展开菜品数或当前筛选结果数。分页区使用筛选结果数。

## 任务 4：渲染入口、主预览弹窗、筛选和分页

### 4.1 商品配置入口

修改 `renderStepTwo(draft)` 的“选择商品”标题区：

- 增加 `data-selected-preview-open` 按钮。
- 标签为 `查看已选商品（N）`。
- `N === 0` 时禁用。
- 保留现有商品摘要、配置门店、搜索和层级选择器结构。

### 4.2 稳定弹窗容器

在 `mountEditor()` 根模板中增加独立的主预览 overlay 容器，避免 `renderEditor()` 替换第 2 步内容时销毁对话框状态。保留现有 `confirmOverlay` 作为二次确认层，并确保确认层在主预览之上。

新增：

```js
function renderSelectedPreviewDialog(draft) { /* ... */ }
function openSelectedPreview() { /* ... */ }
function closeSelectedPreview() { /* ... */ }
```

主弹窗包含：

- 标题总数。
- 批量删除和全部删除。
- 门店、产线下拉。
- 菜品或分类列头。
- 当前页表格行。
- 当前页全选。
- 空状态。
- 上一页、下一页、页码状态。
- 10/20/50 每页条数。

每次渲染前调用 `normalizeSelectedPreviewState`。

### 4.3 事件

在 `handleEditorClick` 和 `handleEditorInput` 中处理：

- 打开、关闭预览。
- 门店和产线筛选。
- 10/20/50 页大小。
- 上一页、下一页。
- 当前页全选和单行勾选。
- 单个、批量和全部删除请求。

筛选、翻页和页大小变化按规格清空选择。关闭时完整重置预览状态。

### 4.4 焦点和 Escape

- 打开主预览后聚焦标题。
- 主预览监听 `Escape`，确认弹窗打开时只关闭确认层。
- 关闭主预览后，入口可用则返回入口，否则返回第 2 步“选择商品”标题。
- 表格和确认按钮使用原生可聚焦控件与明确 `aria-label`。

## 任务 5：实现二次确认和原子删除

### 5.1 扩展确认弹窗焦点管理

让 `openDialog` 接受可选配置或增加独立字段，记录：

- 取消后的返回焦点元素。
- 删除成功后的回退策略。
- 危险确认按钮样式。

保持所有既有重置、删除区间、退出和发布确认调用兼容。

### 5.2 构建删除请求

增加：

```js
function selectedPreviewDeleteRequest(kind, rowIds) { /* ... */ }
```

- 单个：一个稳定行 ID。
- 批量：当前勾选行 ID，去重。
- 全部：直接取 `selectedPreviewRows(draft)` 全量行 ID，禁止调用筛选结果函数。

确认文案包含单项名称、批量数量或全部总数，并明确全部删除不受筛选影响。

### 5.3 原子应用

增加接受明确门店的共享函数：

```js
function applyStoreStructure(draft, storeId, byLine) { /* ... */ }
```

将现有 `applyActiveStoreStructure` 改为对该函数的活动门店包装，保持搜索和层级选择行为不变。

增加：

```js
function applySelectedPreviewDeletion(draft, rowIds) { /* ... */ }
```

实现步骤：

1. 克隆完整草稿为 `shadowDraft`。
2. 从权威预览行中解析仍有效的复合 ID，记录失效跳过数。
3. 按门店分组，并在影子门店配置上依次调用 `MenuPicker.setNodeSelected(..., false)`。
4. 每家门店调用 `applyStoreStructure(shadowDraft, storeId, nextByLine)`，同步目标、剪枝数量和生效门店状态。
5. 所有门店完成后统一归一化并校验。
6. 任一真实错误时不修改原草稿，保留筛选、分页和勾选，提示错误。
7. 全部成功后一次性替换原草稿的门店配置和相关部署选择字段，标记 dirty 并重新渲染。

删除后数量矩阵只保留仍有效目标。重新加入目标时沿用现有逻辑生成“未配置”单元格。

### 5.4 删除后焦点

- 取消确认：返回原触发按钮。
- 单个成功：优先相邻行删除按钮；空结果时返回门店筛选。
- 批量或全部成功：返回主预览标题。
- 全部删除后关闭主预览：返回第 2 步“选择商品”标题。

## 任务 6：样式和响应式布局

在 `order-limit-flow.css` 增加：

- `.olf-selected-preview-entry`
- `.olf-selected-preview-overlay`
- `.olf-selected-preview-dialog`
- `.olf-selected-preview-toolbar`
- `.olf-selected-preview-filters`
- `.olf-selected-preview-table-wrap`
- `.olf-selected-preview-pagination`
- `.olf-selected-preview-empty`

要求：

- 主弹窗宽度适配桌面表格。
- 确认 overlay 的层级高于主预览。
- 窄屏筛选纵向排列，表格局部横向滚动。
- 危险操作使用现有 danger 颜色体系。
- 不改变现有层级选择器、搜索结果和底部操作栏布局。

## 任务 7：自动化回归

### 7.1 专项脚本

完成 `scripts/verify-order-limit-selected-products-preview.mjs` 的全部断言，覆盖：

- 分类/菜品枚举和计数。
- 门店/产线联动筛选标记。
- 分页和当前页选择标记。
- 单个、批量、全部删除确认。
- 全部删除独立于筛选结果。
- 原子影子草稿更新。
- 预览状态不持久化。
- 样式和可访问性标记。

```powershell
node scripts/verify-order-limit-selected-products-preview.mjs
```

### 7.2 语法和既有脚本

```powershell
node --check "dist/Configuration center/assets/brand-menu-structure-picker.js"
node --check "dist/Configuration center/assets/order-limit-flow.js"
Get-ChildItem scripts/verify-order-limit-*.mjs | ForEach-Object { node $_.FullName }
git diff --check
```

### 7.3 构建

复用主工作区 `node_modules` 的 junction，不提交依赖目录，然后执行：

```powershell
npm.cmd run build
```

构建后恢复或移除仅由构建生成的哈希资产和时间戳，确保提交只包含预期文件。

## 任务 8：浏览器验收

从 worktree 启动独立端口预览，不能复用旧功能服务端口。

验收场景：

1. 按菜品规则配置至少两个门店、三个产线和超过 10 个对象；若静态菜单不足 10 个，使用 10/20/50 控件和脚本状态验证分页边界，并在浏览器覆盖可用真实行。
2. 核对入口和标题总数不受筛选影响。
3. 核对门店选择后产线选项联动收窄。
4. 核对门店 + 产线组合筛选、空状态和重置页码。
5. 核对当前页全选，翻页、筛选或页大小变化后清空选择。
6. 分别取消和确认单个、批量、全部删除。
7. 核对全部删除不受当前筛选限制。
8. 按分类规则核对一分类一行、包含菜品数和删除整个分类。
9. 核对删除后摘要、门店状态和数量矩阵剪枝。
10. 核对取消与成功删除后的焦点回退。
11. 核对关闭再打开重置筛选、分页和勾选。
12. 检查 Vite 错误遮罩、警告对话框和明显布局溢出。

## 任务 9：提交和合并

预期功能提交：

```text
feat: preview selected order limit products
```

提交前确认：

- worktree 仅包含预期源文件、专项脚本和计划文档。
- 所有专项与既有回归通过。
- 生产构建通过。
- 浏览器验收通过。

提交后使用 `git merge --autostash --no-ff` 合并 `codex/order-limit-selected-products-preview` 到 `main`，不得覆盖或重置主工作区已有未提交修改。合并后在 `main` 再运行 JavaScript 语法检查和新增专项脚本。
