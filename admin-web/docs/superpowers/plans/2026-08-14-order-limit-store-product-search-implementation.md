# 数量与频次规则门店商品跨产线搜索实施计划

> 依据：`docs/superpowers/specs/2026-08-14-order-limit-store-product-search-design.md`
>
> 目标：在商品配置选择门店后，支持搜索该门店全部产线商品；按菜品限购选择具体商品，按分类限购自动选择所属分类，并保持现有层级选择、门店隔离、数量矩阵和发布流程不回归。

## 实施约束

- 全部工作继续在 `codex/order-limit-store-product-search` 独立 worktree 完成。
- 先增加失败验证，再实现功能。
- 搜索词只保存到编辑器临时状态，不进入任何规则持久化对象。
- 菜单树枚举和节点级联继续由 `brand-menu-structure-picker.js` 负责。
- 商品结构变更继续走订单限购现有同步管线，不复制数量矩阵清理逻辑。
- 不修改后端接口、不新增分页协议、不把搜索扩展到门店之外。

## 预计文件

修改：

- `dist/Configuration center/assets/brand-menu-structure-picker.js`
- `dist/Configuration center/assets/order-limit-flow.js`
- `dist/Configuration center/assets/order-limit-flow.css`

新增：

- `scripts/verify-order-limit-store-product-search.mjs`

回归：

- `scripts/verify-order-limit-store-specific-config.mjs`
- `scripts/verify-order-limit-store-scope-flow.mjs`
- 其他现有 `scripts/verify-order-limit*.mjs`

## 任务 1：建立搜索与选择契约的失败验证

在 `scripts/verify-order-limit-store-product-search.mjs` 中先固化以下预期：

1. 读取 `brand-menu-structure-picker.js`，在 Node `vm` 隔离上下文中执行脚本并取得 `BrandMenuStructurePicker`。
2. 断言选择器导出：
   - `listAllDishes()`。
   - `setNodeSelected(byLine, lineId, nodeKey, checked)`。
   - `isNodeSelected(byLine, lineId, nodeKey)`。
3. 断言全量商品枚举覆盖 Kiosk、eMenu、SDI，并为每条结果提供产线、组、分类、菜品名称以及稳定的 `dishKey`、`categoryKey`。
4. 断言枚举顺序稳定；同名商品在不同产线拥有不同的 `lineId` 上下文。
5. 断言菜品键选择只影响指定产线和指定菜品。
6. 断言分类键选择会级联选择分类后代，取消会移除整个分类。
7. 断言无效产线或无效节点不产生悬空选择，并返回规范化结构。
8. 静态断言订单限购商品配置包含：
   - `data-product-search` 搜索框。
   - `data-product-search-results` 结果容器。
   - `data-product-search-target` 选择控件。
   - `productSearchQuery` 临时状态。
   - “已按分类加入”和无结果文案。
9. 静态断言搜索词未写入默认草稿、兼容规则构建或发布快照。
10. 先运行脚本，确认因为缺少新接口和 UI 而失败，不是因为路径或运行环境错误。

验证命令：

```powershell
node scripts/verify-order-limit-store-product-search.mjs
```

预期：RED。

## 任务 2：扩展菜单选择器的通用查询与节点选择接口

在 `brand-menu-structure-picker.js` 中实现：

### `listAllDishes()`

1. 按 `LINE_OPTIONS` 顺序遍历每条产线。
2. 按菜单树原有组、分类、商品顺序扁平化。
3. 每条返回：

```js
{
  lineId,
  lineLabel,
  groupId,
  groupName,
  categoryId,
  categoryName,
  dishId,
  dishName,
  dishKey,
  categoryKey,
}
```

4. 返回新对象，外部修改不得污染内部菜单树。

### `setNodeSelected(byLine, lineId, nodeKey, checked)`

1. 先执行 `normalizeByLine`，不原地修改调用方对象。
2. 验证产线有效，并验证节点键确实存在于该产线树。
3. 使用现有 `keysToSelection` 和 `cascade` 执行选择或取消。
4. 使用 `selectionToKeys` 写回目标产线，其他产线保持不变。
5. 无效产线或节点返回规范化但未加入悬空键的结构。

### `isNodeSelected(byLine, lineId, nodeKey)`

1. 通过规范化后的产线选择和 `keysToSelection` 判断节点状态。
2. 分类全选和通过所有菜品形成的分类全选均返回 `true`。
3. 无效产线或节点返回 `false`。

将三个函数加入 `global.BrandMenuStructurePicker` 导出。

完成后运行新脚本，确认选择器接口相关断言变绿，UI 相关断言仍为红色。

## 任务 3：建立商品搜索临时状态与生命周期

在 `order-limit-flow.js` 的 `editorState` 增加：

```js
productSearchQuery: "",
productSearchComposing: false,
```

新增小型状态函数，避免清理逻辑散落：

- `clearProductSearch()`：清空查询和输入法组合状态。
- `normalizeProductSearchQuery(value)`：去除首尾空白并转小写，只用于匹配；原输入值仍用于输入框展示。

在以下时机调用 `clearProductSearch()`：

1. 切换 `data-config-store-select` 门店之前。
2. 从第 2 步离开到其他步骤。
3. 修改 `targetType` 并确认重置时。
4. 初始化编辑器时保持空搜索，不从草稿恢复。

不得把搜索字段复制到 `draft`、`editorDraft`、`authoringDraft` 或兼容规则对象。

## 任务 4：渲染搜索框和跨产线结果面板

在 `renderStepTwo(draft)` 中：

1. 仅 `hasActiveStore` 时渲染搜索框。
2. 搜索框放在门店下拉之后、商品结构之前。
3. 搜索词为空时调用现有 `MenuPicker.renderHtml(...)`。
4. 搜索词非空时调用新的 `renderProductSearchResults(draft, config)`。

新增纯渲染函数：

### `matchingProductSearchResults(query)`

- 调用 `MenuPicker.listAllDishes()`。
- 以规范化后的商品名称做包含匹配。
- 不按当前活动产线过滤。
- 不改变选择器返回顺序。

### `renderProductSearchResults(draft, config)`

- 每行展示商品名称。
- 次级路径展示“产线 / 组 / 分类”。
- `draft.targetType === "dish"` 时以 `dishKey` 判断和修改状态。
- `draft.targetType === "category"` 时以 `categoryKey` 判断和修改状态。
- 分类已选时展示“已按分类加入”，并让同一产线、同一分类下全部命中行同步勾选。
- 无结果时展示确认过的空状态文案。
- 结果勾选框提供 `aria-label`，路径和分类状态使用文本表达。

结果控件携带最小数据：

```html
<input
  type="checkbox"
  data-product-search-target
  data-line-id="kiosk"
  data-dish-key="d:..."
  data-category-key="c:..."
/>
```

## 任务 5：实现无焦点跳动的搜索输入更新

避免每次输入都执行完整 `renderEditor()`，否则现有标题自动聚焦会抢走搜索焦点。

新增：

- `renderProductSearchSurface(draft)`：只更新 `[data-product-search-surface]` 内容。
- `bindProductSearchPicker(surface, draft)`：当查询清空、层级选择器重新插入时调用 `MenuPicker.bind`。

在 `handleEditorInput(event)` 中：

1. 捕获 `[data-product-search]` 的 `input`。
2. 输入法组合期间只记录输入值，不提交过滤。
3. 非组合输入更新 `editorState.productSearchQuery` 并局部刷新结果面板。
4. 保持输入框焦点、光标位置和现有页面滚动位置。

在编辑器根节点监听：

- `compositionstart`：设置 `productSearchComposing = true`。
- `compositionend`：关闭组合状态，记录最终值并刷新结果。

清空搜索后重新插入原选择器并完成绑定，不能出现看得见但无法点击的未绑定结构。

## 任务 6：复用商品结构变更管线处理搜索结果选择

从现有 `brand-menu-structure-change` 监听器中提取：

```js
function applyActiveStoreStructure(draft, byLine) { ... }
```

统一完成：

1. 验证 `activeStoreId`。
2. 规范化并写入当前门店 `structureByLine`。
3. `syncStoreTargetsFromStructure(draft, config, true)`。
4. `normalizeStoreDraft(draft)`。
5. 清除第 2 步错误、标记草稿变化并自动保存。

原层级选择器事件和搜索结果选择都调用该函数。

搜索结果变化处理：

1. 从控件读取 `lineId`。
2. 按 `targetType` 选择 `dishKey` 或 `categoryKey`。
3. 调用 `MenuPicker.setNodeSelected` 得到新结构。
4. 调用 `applyActiveStoreStructure`。
5. 保留当前搜索词并重新渲染搜索结果，使同分类行状态同步。
6. 更新 `#structureSummary`，不把焦点跳回页面标题。

节点失效或产线无效时不写草稿，直接刷新结果面板。

## 任务 7：增加搜索视觉样式和响应式处理

在 `order-limit-flow.css` 中增加：

- `.olf-product-search`：搜索框容器，宽度与商品选择区域协调。
- `.olf-product-search-input`：复用现有输入框边框、字号和焦点色。
- `.olf-product-search-results`：单层结果列表，不嵌套额外卡片。
- `.olf-product-search-row`：商品、路径、状态和勾选框布局。
- `.olf-product-search-path`：弱化的完整路径文字。
- `.olf-product-search-category-state`：分类加入提示。
- 搜索空状态。

桌面端一行展示商品、路径、状态；窄屏允许路径换行，勾选框和商品名称保持清晰。结果列表应有合理最大高度和自身滚动，不能扩大整页到不可操作。

## 任务 8：完成专项与既有自动化回归

扩充新脚本，覆盖：

1. 选择器所有新接口运行行为。
2. 搜索 UI、临时状态和事件路径。
3. 菜品模式使用 `dishKey`。
4. 分类模式使用 `categoryKey` 和“已按分类加入”。
5. 门店切换、离开步骤和限购对象重置清空搜索。
6. 输入法组合处理与局部刷新。
7. 搜索词不进入持久化对象。
8. 原层级选择和搜索选择共享 `applyActiveStoreStructure`。
9. 评审建议场景：先通过层级选择器选中分类，再搜索该分类商品，所有命中行都显示共享分类状态。

依次执行：

```powershell
node --check "dist/Configuration center/assets/brand-menu-structure-picker.js"
node --check "dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-order-limit-store-product-search.mjs
Get-ChildItem scripts -Filter "verify-order-limit*.mjs" | ForEach-Object { node $_.FullName }
git diff --check
```

## 任务 9：生产构建与产物清理

1. 在 worktree 复用主工作区现有 `node_modules` 目录联接。
2. 执行：

```powershell
npm.cmd run build
```

3. 记录构建是否只有既有包体提示。
4. 恢复构建时间戳和 `dist/index.html`，删除本次生成的哈希产物，只保留功能与测试文件。
5. 再次执行 `git diff --check` 和专项脚本。

## 任务 10：浏览器完整验收

在新的本地端口启动该 worktree，并执行：

1. 新建按菜品限购规则并选择 A 门店。
2. 确认未选门店时无搜索框，选中 A 后出现搜索框。
3. 搜索跨产线同名或相似商品，确认结果覆盖多条产线且路径正确。
4. 选择两个不同产线结果，清空搜索后确认原层级结构和摘要同步。
5. 切换 B 门店，确认搜索词清空、结果消失且 A 配置不串入 B。
6. 切回 A，确认已选商品仍在。
7. 使用按分类限购规则，先通过层级结构选中分类，再搜索分类内商品，确认所有结果显示“已按分类加入”。
8. 取消其中任一结果，确认整个分类取消；重新选择后分类恢复。
9. 进入第 4 步，确认新增目标为未配置，完成数量后返回搜索删除目标，确认对应数量被清理。
10. 完成生效范围、确认和发布；重新编辑正式规则，确认门店商品配置保留且搜索词为空。
11. 验证无结果和中文输入法组合场景。
12. 检查 Vite 错误遮罩、运行时错误、键盘焦点和窄屏布局。

## 任务 11：提交和合并

1. 确认 worktree 只包含本功能规格、计划、代码和测试。
2. 提交功能实现到 `codex/order-limit-store-product-search`。
3. 在 `main` 使用 `git merge --autostash --no-ff` 合并，保护并恢复主工作区现有未提交修改。
4. 在 `main` 重新执行语法检查和门店商品搜索专项脚本。
5. 不删除用户现有预览草稿；将预览端口切换到已合并或功能 worktree 后再交付。

## 完成定义

- 已选择配置门店时可以搜索该门店全部产线商品。
- 菜品模式选择具体商品，分类模式自动选择所属分类。
- 搜索和原层级选择器始终读取和修改同一份门店商品结构。
- 门店切换、数量矩阵、生效范围、发布裁剪和作者草稿恢复均不回归。
- 专项脚本、全部订单限购回归、生产构建和浏览器验收全部通过。
- 功能在独立 worktree 提交并安全合并到 `main`。
