# 自助餐当前场景统一商品选择器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前场景的商品/分类追加弹窗替换为与主入口一致的菜单结构选择器，并确保新增对象只写入当前门店、当前人数与轮次场景。

**Architecture:** 继续复用 `BrandMenuStructurePicker` 负责菜单树渲染、父子联动、搜索结果和目标转换；`order-limit-flow.js` 只维护场景弹窗的临时选择状态、已有对象锁定集合及提交增量。场景提交复用现有 `editableSceneTargets()`，不改变规则运行时模型与发布结构。

**Tech Stack:** 原生 JavaScript、HTML dialog、现有 BrandMenuStructurePicker、Node.js VM 验证脚本、Codex in-app browser。

**Spec:** `docs/superpowers/specs/2026-09-20-buffet-scene-unified-product-picker-design.md`

## Global Constraints

- 按菜品和菜品集限购展示“产线、组、类、菜”；按分类限购展示“产线、组、类”。
- 门店固定为当前额度场景所属门店，不允许在场景选择弹窗切换。
- 已有对象保持选中并锁定，不计入本次新增数量，不能单独使提交按钮可用。
- 提交只追加当前门店、当前人数区间和当前轮次区间的对象，不覆盖任何已有额度。
- 取消或关闭不修改草稿；新增对象额度保持未配置。
- 不修改 `vendor/emenu-new`，无需执行 eMenu 嵌入包发布命令。

---

### Task 1: 为统一菜单选择器增加锁定对象能力

**Files:**
- Modify: `dist/Configuration center/assets/brand-menu-structure-picker.js:470-750`
- Create: `scripts/verify-brand-menu-structure-picker-locks.mjs`

**Interfaces:**
- Consumes: `renderHtml(byLine, activeLineId, activeGroupId, activeCategoryId, opts)`、`bind(pickerEl, opts)`。
- Produces: 选择器选项 `lockedKeys: string[]`；渲染根节点属性 `data-locked-keys`；锁定复选框带 `disabled` 与 `data-brand-menu-locked="1"`。

- [ ] **Step 1: 写失败测试，覆盖锁定叶子节点与重新渲染后的保留**

```js
const html = picker.renderHtml(selected, 'kiosk', 'hotpot', 'base', {
  leafLevel: 'dish',
  lockedKeys: ['d:hotpot:base:pot-single'],
});
assert.match(html, /data-brand-menu-locked="1"/);
assert.match(html, /data-locked-keys=/);
assert.match(html, /disabled/);

const categoryHtml = picker.renderHtml(selectedCategories, 'kiosk', 'hotpot', '', {
  leafLevel: 'category',
  lockedKeys: ['c:hotpot:base'],
});
assert.match(categoryHtml, /data-brand-menu-locked="1"/);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-brand-menu-structure-picker-locks.mjs`

Expected: FAIL，因为当前 HTML 不包含 `data-brand-menu-locked` 和 `disabled`。

- [ ] **Step 3: 实现锁定选项的归一化、序列化和渲染**

```js
function normalizePickerOptions(opts) {
  opts = opts || {};
  return {
    leafLevel: opts.leafLevel === 'category' ? 'category' : 'dish',
    lockedKeys: Array.isArray(opts.lockedKeys) ? opts.lockedKeys.map(String) : [],
  };
}

function isLocked(opts, key) {
  return opts.lockedKeys.indexOf(String(key)) >= 0;
}
```

`renderItem` 接收 `locked` 参数；锁定时给复选框添加 `checked disabled data-brand-menu-locked="1"`。`renderHtml` 将 `lockedKeys` JSON 写入根节点，`readPickerOptions` 读回该属性，保证 `bind()` 内导航和级联重新渲染后锁定状态不丢失。父级联动不得取消锁定叶子节点。

- [ ] **Step 4: 运行选择器测试**

Run: `node scripts/verify-brand-menu-structure-picker-locks.mjs`

Expected: PASS。

- [ ] **Step 5: 提交选择器能力**

```bash
git add "dist/Configuration center/assets/brand-menu-structure-picker.js" scripts/verify-brand-menu-structure-picker-locks.mjs
git commit -m "feat: support locked menu picker targets"
```

---

### Task 2: 场景添加入口复用统一选择器并只提交增量

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:5980-6030`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-scene-unified-picker.mjs`

**Interfaces:**
- Consumes: Task 1 的 `MenuPicker.renderHtml(..., { leafLevel, lockedKeys })`、`MenuPicker.bind()`、`MenuPicker.listSelectedTargets()`。
- Produces: `scenePickerInitialState(draft, sceneConfig): { byLine, lockedKeys, leafLevel }`；场景弹窗属性 `sceneInitialKeys: string[]`；提交结果只包含新增对象。

- [ ] **Step 1: 写失败测试，验证统一结构、锁定项和场景增量**

```js
const state = context.scenePickerInitialState(draft, scopedConfig);
assert.equal(state.leafLevel, 'dish');
assert.deepEqual(state.lockedKeys, ['d:hotpot:base:pot-single']);
assert.ok(state.byLine.kiosk.includes('d:hotpot:base:pot-single'));

const additions = context.scenePickerAdditions(draft, state.lockedKeys, submittedByLine);
assert.deepEqual(additions.map(item => item.dishId), ['pot-yinyang']);
assert.equal(scopedConfig.dishTargets[0].dishId, 'pot-single');
```

另加分类断言：`leafLevel === 'category'`，返回 `categoryTargets`，不返回菜品目标。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-buffet-scene-unified-picker.mjs`

Expected: FAIL，因为场景入口仍使用扁平候选列表，辅助函数尚不存在。

- [ ] **Step 3: 用统一选择器替换扁平列表弹窗**

弹窗包含标题、只读门店、搜索框、`MenuPicker.renderHtml()` 生成的结构选择区、取消和“添加并返回配置”。初始化 `byLine` 时把当前场景对象转成选择器 key，并作为 `lockedKeys` 传入。按菜品和菜品集使用 `leafLevel: 'dish'`，按分类使用 `leafLevel: 'category'`。

```js
const pickerState = scenePickerInitialState(draft, currentScope);
picker.innerHTML = renderScenePickerDialog(draft, scene, pickerState);
const pickerElement = picker.querySelector('[data-brand-menu-structure-picker]');
MenuPicker.bind(pickerElement, {
  leafLevel: pickerState.leafLevel,
  lockedKeys: pickerState.lockedKeys,
});
```

- [ ] **Step 4: 实现搜索与提交增量**

搜索复用现有商品搜索结果与 `MenuPicker.setNodeSelected()`，只更新临时 `byLine`。提交时使用 `listSelectedTargets(byLine, leafLevel)`，过滤 `lockedKeys`，将新增对象追加到 `editableSceneTargets(draft)[field]`；未新增对象时保持弹窗并提示“请选择要添加的商品/分类”。不写入 `periodValues`，因此新增额度自然保持未配置。

- [ ] **Step 5: 调整弹窗样式**

复用 `.olf-product-add-dialog`、`.olf-product-add-head` 和 BrandMenuStructurePicker 的网格样式；只补充场景弹窗层级、只读门店和底部操作区所需样式，不复制新的四级网格 CSS。

- [ ] **Step 6: 运行场景及既有回归测试**

Run:

```bash
node --check "dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-buffet-scene-unified-picker.mjs
node scripts/verify-buffet-scenario-targets.mjs
node scripts/verify-buffet-scenario-copy.mjs
node scripts/verify-buffet-scene-cards.mjs
```

Expected: 全部 PASS。

- [ ] **Step 7: 提交场景入口实现**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-scene-unified-picker.mjs
git commit -m "feat: unify buffet scene product picker"
```

---

### Task 3: 浏览器验收三种对象与场景隔离

**Files:**
- Modify only if defects are found: `dist/Configuration center/assets/order-limit-flow.js`
- Modify only if defects are found: `dist/Configuration center/assets/brand-menu-structure-picker.js`
- Modify only if defects are found: `dist/Configuration center/assets/order-limit-flow.css`

**Interfaces:**
- Consumes: Task 2 完成的场景统一选择器。
- Produces: 浏览器验收结果；测试草稿保持未发布。

- [ ] **Step 1: 验收按菜品限购**

在未发布测试草稿中进入两个轮次场景。打开首个场景“添加商品”，确认展示产线、组、类、菜四列，当前商品选中且不可取消；新增另一商品后只出现在首个场景，额度为未配置。

- [ ] **Step 2: 验收按分类限购**

创建按分类测试草稿，确认弹窗只展示产线、组、类三列；已有分类锁定；新增分类后返回额度页并显示正确包含商品数量。

- [ ] **Step 3: 验收菜品集与保存刷新**

创建按菜品集测试草稿，确认四列选择器可追加成员且至少两个成员校验仍生效。保存草稿并刷新，新增成员和已有额度保持不变。

- [ ] **Step 4: 验收取消、搜索和控制台**

分别验证搜索定位、无新增对象禁止提交、取消不保存；检查浏览器控制台无新增 error 或 warning。

- [ ] **Step 5: 运行最终回归**

Run:

```bash
node scripts/verify-brand-menu-structure-picker-locks.mjs
node scripts/verify-buffet-scene-unified-picker.mjs
node scripts/verify-buffet-scenario-targets.mjs
node scripts/verify-buffet-scenario-copy.mjs
node scripts/verify-buffet-cross-store-copy-preview.mjs
node scripts/verify-buffet-v4-runtime.mjs
node scripts/verify-buffet-v4-conflicts.mjs
```

Expected: 全部 PASS。

- [ ] **Step 6: 提交验收中发现的修复（仅在产生代码修改时）**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/brand-menu-structure-picker.js" "dist/Configuration center/assets/order-limit-flow.css"
git commit -m "fix: complete buffet scene picker acceptance"
```
