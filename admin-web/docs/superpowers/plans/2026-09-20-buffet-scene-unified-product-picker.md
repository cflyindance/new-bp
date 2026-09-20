# 自助餐当前场景统一商品范围选择器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 复用统一菜单选择器管理当前场景商品/分类范围，支持新增和取消已有对象，并只清理当前场景对应额度。

**Architecture:** `BrandMenuStructurePicker` 继续负责菜单树、父子联动、搜索与最终选中对象转换；`order-limit-flow.js` 保存打开弹窗时的初始范围和编辑中的 `byLine`，确认时计算保留、新增、删除三类差异。最终对象集合覆盖 `scenarioTargets` 当前场景字段，删除对象只清理当前场景 `targetLimits`、`tableTargetCaps` 或菜品集例外额度。

**Tech Stack:** 原生 JavaScript、HTML dialog、BrandMenuStructurePicker、Node.js VM 验证脚本、Codex in-app browser。

**Spec:** `docs/superpowers/specs/2026-09-20-buffet-scene-unified-product-picker-design.md`

## Global Constraints

- 商品和菜品集使用“产线、组、类、菜”，分类使用“产线、组、类”。
- 已有对象默认勾选但允许取消；门店只读。
- 最终范围只覆盖当前门店、人数区间和轮次区间。
- 保留对象额度不变；新增对象额度为空；删除对象清除当前场景额度。
- 菜品/分类至少保留 1 项，菜品集至少保留 2 项。
- 取消或关闭不修改数据。
- 不修改 `vendor/emenu-new`。

---

### Task 1: 用最终选择集合描述场景范围变更

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `scripts/verify-buffet-scene-unified-picker.mjs`
- Remove: `scripts/verify-brand-menu-structure-picker-locks.mjs`
- Revert feature-only changes: `dist/Configuration center/assets/brand-menu-structure-picker.js`

**Interfaces:**
- Consumes: `MenuPicker.renderHtml()`、`MenuPicker.bind()`、`MenuPicker.listSelectedTargets()`。
- Produces: `scenePickerInitialState(draft, current): { byLine, initialKeys, leafLevel, query }`；`scenePickerSelection(draft, byLine): Target[]`；`scenePickerDiff(initialKeys, targets): { addedKeys, removedKeys }`。

- [ ] **Step 1: 修改测试，表达允许取消已有对象**

```js
const state = api.scenePickerInitialState(dishDraft, [existing]);
assert.deepEqual(state.initialKeys, ['d:g-hotpot:c-hotpot-base:d-pot-single']);
const empty = picker.setNodeSelected(state.byLine, 'kiosk', state.initialKeys[0], false);
const selection = api.scenePickerSelection(dishDraft, empty);
assert.equal(selection.length, 0);
assert.deepEqual(api.scenePickerDiff(state.initialKeys, selection).removedKeys, state.initialKeys);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-buffet-scene-unified-picker.mjs`

Expected: FAIL，因为当前实现仍返回 `lockedKeys` 并只计算新增对象。

- [ ] **Step 3: 实现初始集合、最终集合和差异函数**

`scenePickerInitialState` 将已有对象写入 `byLine` 和 `initialKeys`；`scenePickerSelection` 将最终 `byLine` 转成完整场景对象数组；`scenePickerDiff` 使用 `targetKey` 比较初始和最终集合。

- [ ] **Step 4: 移除锁定选择器扩展并运行测试**

Run:

```bash
node --check "dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-buffet-scene-unified-picker.mjs
```

Expected: PASS，已有对象可以取消选择。

---

### Task 2: 覆盖当前场景并清理删除对象额度

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Modify: `scripts/verify-buffet-scene-unified-picker.mjs`

**Interfaces:**
- Consumes: Task 1 的最终选择和差异函数。
- Produces: `removeSceneTargetValues(values, removedTargetKeys)`，只删除当前场景目标额度。

- [ ] **Step 1: 添加删除额度的失败测试**

```js
const values = { targetLimits: { oldKey: { configured: true, value: 2 } }, tableTargetCaps: { oldKey: { configured: true, value: 3 } } };
api.removeSceneTargetValues(values, ['oldKey']);
assert.equal(values.targetLimits.oldKey, undefined);
assert.equal(values.tableTargetCaps.oldKey, undefined);
```

- [ ] **Step 2: 实现确认校验和最终覆盖**

按钮文案为“确认并返回配置”。确认时菜品/分类少于 1 项或菜品集少于 2 项则提示并停留；通过后把最终集合赋给当前场景 `dishTargets`、`categoryTargets` 或 `dishSetMembers`。

- [ ] **Step 3: 清理删除对象当前场景额度**

菜品和分类删除对应 `targetLimits[key]` 与 `tableTargetCaps[key]`；菜品集只删除当前场景 `exceptionDishLimits[scenario]` 中同身份记录，其他场景不变。

- [ ] **Step 4: 保持搜索和取消语义**

搜索结果中的已有对象保持勾选但不禁用，搜索与菜单树共享 `byLine`；取消或关闭只移除临时 dialog。

- [ ] **Step 5: 运行自动化回归**

```bash
node scripts/verify-buffet-scene-unified-picker.mjs
node scripts/verify-buffet-scenario-targets.mjs
node scripts/verify-buffet-scenario-copy.mjs
node scripts/verify-buffet-cross-store-copy-preview.mjs
node scripts/verify-buffet-scene-cards.mjs
node scripts/verify-buffet-v4-runtime.mjs
node scripts/verify-buffet-v4-conflicts.mjs
```

Expected: 全部 PASS。

---

### Task 3: 浏览器验收场景内删除

**Files:**
- Modify only if defects are found: `dist/Configuration center/assets/order-limit-flow.js`
- Modify only if defects are found: `dist/Configuration center/assets/order-limit-flow.css`

- [ ] **Step 1: 验收菜品场景删除与隔离**

在两个轮次场景中取消首个场景已有商品并确认；验证该商品及额度只从首个场景消失，第二场景和规则主范围不变。

- [ ] **Step 2: 验收分类与菜品集校验**

分类场景取消已有分类后仍需保留至少 1 项；菜品集减少到 1 项时确认被阻止。

- [ ] **Step 3: 验收取消、搜索和刷新**

搜索后取消勾选再点击“取消”，数据不变；有效变更保存草稿并刷新后保持；控制台无新增错误。

- [ ] **Step 4: 最终检查**

Run: `git diff --check`

Expected: 无空白错误；测试草稿保持未发布。
