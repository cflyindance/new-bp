# eMenu Pro 组件绑定批量商品 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 eMenu Pro 底栏新增“组件绑定批量商品”，支持单选组件、多选商品，并为每个商品创建独立且精确绑定的组件实例。

**Architecture:** 扩展现有 eMenu Pro 嵌入态批量绑定脚本，不修改原生 React 数据合同。两个批量入口共用商品解析、组件模板、实例创建与 Redux 写入；绑定状态统一按 `component + itemId` 精确匹配，从而安全支持同类型多实例。

**Tech Stack:** 浏览器原生 JavaScript、DOM、Redux action dispatch、CSS、Node.js focused verifier、Vite 项目构建

**Spec:** `docs/superpowers/specs/2026-09-09-emenu-component-bind-multiple-products-design.md`

## Global Constraints

- 新入口必须位于“批量添加商品组件”左侧。
- 左侧组件单选，右侧当前分类商品多选。
- 每个商品创建一个独立实例，根节点 `props.itemId` 使用字符串商品 ID。
- 精确匹配已存在时跳过，禁止移动、覆盖或删除其他商品的同类型实例。
- 新实例按商品勾选顺序纵向排列，取消后重选的商品排到末尾。
- 新弹窗只添加，不提供批量删除。
- 不修改 `vendor/emenu-new`；若实施中不得不修改，必须执行根目录规定的 eMenu 嵌入包构建与产物校验。
- 不改 host globals、EventBus、右侧默认绑定脚本或组件分组脚本。

---

## 文件结构

- Modify: `dist/emenu-pro/embedded-product-binding.js`  
  负责精确绑定查询、多实例安全的旧入口、新入口弹窗、选择状态、实例生成、Redux 写入与测试钩子。
- Modify: `dist/emenu-pro/embedded-shell.css`  
  负责新入口按钮复用、组件单选列表、商品多选列表、已绑定状态与双栏响应式布局。
- Create: `scripts/verify-emenu-component-bulk-product-binding.mjs`  
  在受控 VM/DOM 环境中验证精确匹配、递归 ID、选择顺序、纵向布局、入口顺序及关键文案。

### Task 1: 建立 focused verifier 与最小测试接口

**Files:**
- Create: `scripts/verify-emenu-component-bulk-product-binding.mjs`
- Modify: `dist/emenu-pro/embedded-product-binding.js:1-850`

**Interfaces:**
- Consumes: 现有 IIFE 内的 `getPageChildren`、`getBindingRows`、`createBlockInstance`、布局函数。
- Produces: 仅当预先存在 `window.__EMENU_PRODUCT_BINDING_TEST_HOOKS__` 时填充的测试接口；正常运行时不新增全局对象。

- [ ] **Step 1: 编写失败的 verifier**

创建 VM 环境，预置：

```js
const hooks = {}
const context = {
  window: {
    __EMENU_PRODUCT_BINDING_TEST_HOOKS__: hooks,
    location: { href: 'http://localhost/emenu-pro/' },
    setTimeout() {},
  },
  document: {
    documentElement: { classList: { contains: () => true } },
    readyState: 'loading',
    addEventListener() {},
    getElementById: () => null,
    querySelector: () => null,
  },
  crypto: {
    getRandomValues(bytes) {
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = index
      return bytes
    },
  },
  URL,
  console,
}
```

用 `vm.runInNewContext` 执行嵌入脚本，并断言 hooks 至少暴露：

```js
assert.equal(typeof hooks.findExactBindingInstances, 'function')
assert.equal(typeof hooks.createBlockInstance, 'function')
assert.equal(typeof hooks.computeVerticalProductPositions, 'function')
assert.equal(typeof hooks.toggleOrderedSelection, 'function')
```

- [ ] **Step 2: 运行 verifier，确认先失败**

Run: `node scripts/verify-emenu-component-bulk-product-binding.mjs`  
Expected: FAIL，提示 `findExactBindingInstances` 尚未暴露。

- [ ] **Step 3: 在 IIFE 尾部增加条件测试接口**

```js
if (window.__EMENU_PRODUCT_BINDING_TEST_HOOKS__) {
  Object.assign(window.__EMENU_PRODUCT_BINDING_TEST_HOOKS__, {
    findExactBindingInstances: findExactBindingInstances,
    createBlockInstance: createBlockInstance,
    computeVerticalProductPositions: computeVerticalProductPositions,
    toggleOrderedSelection: toggleOrderedSelection,
    BLOCK_LIBRARY: BLOCK_LIBRARY,
  });
}
```

- [ ] **Step 4: 执行语法检查并确认 verifier 进入下一处行为失败**

Run: `node --check dist/emenu-pro/embedded-product-binding.js`  
Expected: PASS。

Run: `node scripts/verify-emenu-component-bulk-product-binding.mjs`  
Expected: FAIL 于尚未实现的精确匹配或布局断言，而不是脚本加载错误。

- [ ] **Step 5: 提交检查点**

```bash
git add dist/emenu-pro/embedded-product-binding.js scripts/verify-emenu-component-bulk-product-binding.mjs
git commit -m "test: cover eMenu component bulk product binding"
```

仅在用户明确授权提交时执行。

### Task 2: 修正精确匹配与实例创建基础能力

**Files:**
- Modify: `dist/emenu-pro/embedded-product-binding.js:305-810`
- Modify: `scripts/verify-emenu-component-bulk-product-binding.mjs`

**Interfaces:**
- Produces: `findExactBindingInstances(pageData, componentType, itemId): Block[]`
- Produces: `createBlockInstance(def, position, itemId): Block`，递归生成唯一 ID。
- Produces: `computeVerticalProductPositions(componentType, count, palette): Position[]`
- Produces: `toggleOrderedSelection(ids, id, checked): string[]`

- [ ] **Step 1: 添加精确匹配和旧入口隔离测试**

```js
const page = {
  children: [
    { id: 'dish-a-name', component: 'DishName', props: { itemId: '101' } },
    { id: 'dish-b-name', component: 'DishName', props: { itemId: 202 } },
  ],
}
assert.deepEqual(
  hooks.findExactBindingInstances(page, 'DishName', '202').map((block) => block.id),
  ['dish-b-name'],
)
assert.equal(hooks.findExactBindingInstances(page, 'DishName', '303').length, 0)
```

同时以源码断言旧入口不再包含 `replaced`、`替换.*冲突组件` 或按单个 `row.instance.id` 删除其他商品实例的逻辑。

- [ ] **Step 2: 实现全量精确匹配，并改造现有状态查询**

```js
function findExactBindingInstances(pageData, componentType, itemId) {
  var itemKey = itemId == null ? null : String(itemId);
  if (!itemKey) return [];
  return getPageChildren(pageData).filter(function (block) {
    return (
      block &&
      block.component === componentType &&
      block.props &&
      String(block.props.itemId) === itemKey
    );
  });
}
```

`getBindingRows` 对每个类型读取全部精确匹配；现有添加在精确匹配存在时跳过，否则直接新增；现有移除只收集精确匹配实例 ID。删除“同类型跨商品静默替换”分支。

- [ ] **Step 3: 添加递归 ID、选择顺序与纵向布局测试**

```js
assert.deepEqual(hooks.toggleOrderedSelection(['1', '2'], '1', false), ['2'])
assert.deepEqual(hooks.toggleOrderedSelection(['2'], '1', true), ['2', '1'])

const positions = hooks.computeVerticalProductPositions('DishName', 3, {
  viewportWidth: 1280,
  viewportHeight: 800,
})
assert.equal(positions.length, 3)
assert.ok(positions[1].top > positions[0].top)
assert.equal(positions[0].left, positions[2].left)

const memberA = hooks.createBlockInstance(
  hooks.BLOCK_LIBRARY.MemberPrice,
  positions[0],
  '101',
)
const memberB = hooks.createBlockInstance(
  hooks.BLOCK_LIBRARY.MemberPrice,
  positions[1],
  '202',
)
const ids = [
  memberA.id,
  ...memberA.children.map((child) => child.id),
  memberB.id,
  ...memberB.children.map((child) => child.id),
]
assert.equal(new Set(ids).size, ids.length)
```

- [ ] **Step 4: 实现有序选择、递归克隆与纵向坐标**

```js
function toggleOrderedSelection(ids, id, checked) {
  var key = String(id);
  var next = ids.filter(function (value) { return String(value) !== key; });
  if (checked) next.push(key);
  return next;
}

function computeVerticalProductPositions(componentType, count, palette) {
  var def = BLOCK_LIBRARY[componentType];
  var width = parseNumber(def && def.style.width, 100);
  var height = parseNumber(def && def.style.height, 40);
  var baseX = Math.round(parseNumber(palette.viewportWidth, 1280) * 0.5 - width / 2);
  var baseY = Math.round(parseNumber(palette.viewportHeight, 800) * 0.42);
  return Array.from({ length: count }, function (_, index) {
    return { top: baseY + index * (height + STACK_GAP), left: baseX, zIndex: 2 };
  });
}
```

将 `createBlockInstance` 改为递归克隆：每层都生成新 ID，只有根节点合并绝对定位与 `itemId`。

- [ ] **Step 5: 运行 focused verifier**

Run: `node scripts/verify-emenu-component-bulk-product-binding.mjs`  
Expected: PASS，并打印 `eMenu component bulk product binding verification passed`。

- [ ] **Step 6: 提交检查点**

```bash
git add dist/emenu-pro/embedded-product-binding.js scripts/verify-emenu-component-bulk-product-binding.mjs
git commit -m "fix: support exact eMenu product component bindings"
```

仅在用户明确授权提交时执行。

### Task 3: 实现“组件绑定批量商品”入口与弹窗

**Files:**
- Modify: `dist/emenu-pro/embedded-product-binding.js:1-850`
- Modify: `dist/emenu-pro/embedded-shell.css`
- Modify: `scripts/verify-emenu-component-bulk-product-binding.mjs`

**Interfaces:**
- Consumes: Task 2 的精确匹配、实例创建、有序选择和纵向布局函数。
- Produces: `ensureComponentProductsButton()`、`ensureComponentProductsModal()`、`openComponentProductsModal()`、`renderComponentProductsModal()`、`addComponentForProducts()`。

- [ ] **Step 1: 添加入口、文案和 DOM 结构的失败断言**

```js
assert.match(source, /组件绑定批量商品/)
assert.match(source, /data-component-products-type/)
assert.match(source, /data-component-products-item/)
assert.match(source, /data-component-products-add/)
assert.match(
  source,
  /insertBefore\(btn,\s*(?:existingBatchButton|batchButton)\)/,
)
```

入口顺序最终通过浏览器 DOM 验证，不只依赖源码顺序。

- [ ] **Step 2: 新增独立状态、入口和可用态同步**

```js
state.componentToProducts = {
  open: false,
  selectedType: null,
  selectedProductIds: [],
  pageId: null,
  categoryKey: null,
};
```

`ensureComponentProductsButton` 创建“组件绑定批量商品”，并使用 `footer.insertBefore(btn, existingBatchButton)`。其禁用态与 `updateBatchButtonState` 使用同一判断。

- [ ] **Step 3: 构建双栏弹窗及事件代理**

左侧渲染五个 radio，右侧渲染当前分类商品 checkbox。商品行根据 `findExactBindingInstances` 显示“已在画布”；选择变化调用 `toggleOrderedSelection`，确认按钮显示实际选择数量。

- [ ] **Step 4: 实现提交前重校验与批量写入**

`addComponentForProducts` 必须按以下顺序：

1. 重新读取 palette、当前页、`pageId`、`categoryKey` 和编辑态。
2. 页面或分类变化、不可编辑、数据缺失时停止；发布态关闭弹窗。
3. 将 `selectedProductIds` 与当前分类商品求交。
4. 按 `component + itemId` 过滤精确匹配，分别统计待创建与跳过数量。
5. 为待创建商品计算纵向坐标并逐个创建实例。
6. 只 dispatch 一次 `setCurrentPageData`，随后 `syncPageDataToGroup`、`setCurrentBlock`。
7. 保持弹窗打开，清空商品选择，刷新状态并显示成功 Toast。

- [ ] **Step 5: 添加页面切换与重复提交断言**

verifier 中模拟：

- 同一分类切换不同 `pageId` 时选择清空。
- 精确匹配位于第二个同类型实例时仍跳过。
- 全部选中商品都已绑定时 children 不变且不触发写入。
- 创建 N 项只产生一次页面写入 action。

- [ ] **Step 6: 添加样式**

复用 `.emenu-batch-binding-trigger` 和现有 modal 基础样式；新增：

```css
.emenu-component-products-type-list,
.emenu-component-products-item-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.emenu-component-products-row {
  display: grid;
  grid-template-columns: 18px 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.emenu-component-products-row.is-bound {
  color: rgba(0, 0, 0, 0.45);
}
```

在窄窗口下保持弹窗可滚动，不能遮挡底部操作区。

- [ ] **Step 7: 运行 focused verifier 和语法检查**

Run: `node --check dist/emenu-pro/embedded-product-binding.js`  
Expected: PASS。

Run: `node scripts/verify-emenu-component-bulk-product-binding.mjs`  
Expected: PASS。

- [ ] **Step 8: 提交检查点**

```bash
git add dist/emenu-pro/embedded-product-binding.js dist/emenu-pro/embedded-shell.css scripts/verify-emenu-component-bulk-product-binding.mjs
git commit -m "feat: bind one eMenu component to multiple products"
```

仅在用户明确授权提交时执行。

### Task 4: 构建与浏览器验收

**Files:**
- Verify: `dist/emenu-pro/index.html`
- Verify: `dist/emenu-pro/embedded-product-binding.js`
- Verify: `dist/emenu-pro/embedded-shell.css`

**Interfaces:**
- Consumes: Tasks 1–3 的最终嵌入脚本与样式。
- Produces: 可重复的自动验证结果和浏览器手工验收记录。

- [ ] **Step 1: 记录构建前相关文件状态**

Run: `git status --short -- dist/emenu-pro scripts/verify-emenu-component-bulk-product-binding.mjs`  
Expected: 只包含本功能计划内文件；若出现其他已有改动，记录并保留。

- [ ] **Step 2: 执行项目构建**

Run: `npm run build`  
Expected: exit code 0。

- [ ] **Step 3: 验证构建后嵌入扩展仍被引用**

Run:

```powershell
Select-String -Path 'dist/emenu-pro/index.html' -Pattern 'embedded-shell\.css','embedded-product-binding\.js'
```

Expected: 两个资源均至少命中一次。

- [ ] **Step 4: 重跑 focused verifier**

Run: `node scripts/verify-emenu-component-bulk-product-binding.mjs`  
Expected: PASS，证明构建流程没有还原或覆盖实现。

- [ ] **Step 5: 强制刷新并重新加载 eMenu Pro iframe**

访问“前厅管理中心 → eMenu Pro”，强制刷新父页面，并确认 iframe 加载的是构建后的 `dist/emenu-pro` 资源。

- [ ] **Step 6: 执行浏览器验收**

依次验证：

1. 新入口位于旧入口左侧，未选页及发布态禁用。
2. 组件 radio 单选、商品 checkbox 多选、确认按钮计数正确。
3. 选择 `DishName` 和三个商品后生成三个独立实例，纵向排列且绑定正确。
4. 取消商品后重选，该商品实例排在最后。
5. 再次提交同一组合只提示跳过，不新增重复实例。
6. 用旧入口添加或移除某商品组件，不影响其他商品的同类型实例。
7. 创建 `MemberPrice` 多实例后，各实例及子节点可独立选中和保存。
8. 切换页面、切换分类、发布态变化和空分类均符合规格。

- [ ] **Step 7: 检查最终 diff 与工作区**

Run:

```powershell
git diff --check
git diff -- dist/emenu-pro/embedded-product-binding.js dist/emenu-pro/embedded-shell.css scripts/verify-emenu-component-bulk-product-binding.mjs
git status --short
```

Expected: 无空白错误；只报告本功能文件与进入任务前已经存在的用户改动。

- [ ] **Step 8: 最终提交检查点**

若前面未提交且用户明确授权：

```bash
git add dist/emenu-pro/embedded-product-binding.js dist/emenu-pro/embedded-shell.css scripts/verify-emenu-component-bulk-product-binding.mjs
git commit -m "feat: bind eMenu components to multiple products"
```

未经用户明确授权不得执行。
