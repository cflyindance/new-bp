# 菜单下单限制：模板 + 按店绑定 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将编辑权威对齐已确认规格：场景维 `quantityTemplate` + 按店 `storeBindings`（含商品稀疏例外）+ `effectiveStoreIds` 开关；步骤为「类型 → 场景 → 限购数量 → 授权 → 应用范围 → 生效范围 → 确认」。

**Architecture:** 废弃以 `scopeEntries` / entry 内 `unifiedCells` 为编辑权威的路径。新 SSOT 为 `quantityTemplate.cells["party|round"]`、`storeBindings[store]`、`effectiveStoreIds`。取值 `productOverride ?? template`；发布仅对 `deployStoreIds` 物化旧 `storeConfigs`。读时从旧 `storeConfigs` 与半成品 `scopeEntries` 迁移到 `decoupledVersion = 4`。

**Tech Stack:** 原生 JS（IIFE `order-limit-flow.js`）、`AppDialogs`、Node assert 专项脚本；改完双写主工作区 `admin-web/`。

**Spec:** `docs/superpowers/specs/2026-08-18-order-limit-rule-product-decoupling-design.md`（现行；废止文内旧 §5/§6）

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\order-limit-rule-product-decoupling`，分支 `wt/order-limit-rule-product-decoupling`

**废止计划（勿再按它们实现）：**

- `plans/2026-08-18-order-limit-rule-product-decoupling-p0-implementation.md`
- `plans/2026-08-18-order-limit-scope-entries-p01-implementation.md`
- `plans/2026-08-18-order-limit-quantity-after-scope-p02-implementation.md`

**本版不做：** 多店范围条目、按店整表数量覆盖、命名门店组、未绑定店可勾选生效。

**Git：** Commit 步骤仅为检查点；**禁止自动 commit/push**，除非用户明确要求。

**双写：** 每完成可验证任务后，将相同改动同步到主工作区 `F:\米聚\GitHub仓库\new-bp\admin-web\` 对应路径。

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `admin-web/dist/Configuration center/assets/order-limit-flow.js` | 模型、迁移、解析、步骤 UI、校验、发布 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.css` | 按店树、添加商品弹层、例外面板样式 |
| `admin-web/scripts/verify-order-limit-template-store-bindings.mjs` | 新规格专项断言（新建） |
| `admin-web/scripts/verify-order-limit-*.mjs` | 按需改期望（去掉与新步序/旧 scopeEntries 冲突的断言） |

---

## 目标步骤映射（实现注释写死）

| Step | 标题 | 渲染 | 校验要点 |
|------|------|------|----------|
| 1 | 规则类型 | `renderStepOne` | subject/period/targetType |
| 2 | 场景配置 | `renderStepThree`（现场景步） | 人数/轮次区间 |
| 3 | 限购数量 | **新** `renderStepQuantityTemplate` | 每格 `configured && number`；**无** `data-limit-store-select`、无商品列 |
| 4 | 超限授权 | `renderStepSix` | 授权字段 |
| 5 | 应用范围 | **新** `renderStepStoreBindings` | ≥1 店；每店 ≥1 叶子；添加商品四级树 |
| 6 | 生效范围 | `renderStepFive` 改造 | 时间会员 + `effectiveStoreIds ⊆ keys(storeBindings)` ≥1 |
| 7 | 确认发布 | `renderStepSeven` | `deployStoreIds ⊆ effectiveStoreIds` |

---

### Task 1: 专项 verify（先 RED）

**Files:**

- Create: `admin-web/scripts/verify-order-limit-template-store-bindings.mjs`
- Modify: （本 Task 不改 flow.js）

- [ ] **Step 1: 写 verify 脚本**

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
  path.join(root, "dist/Configuration center/assets/order-limit-flow.js"),
  "utf8"
);

assert.match(source, /storeBindings/);
assert.match(source, /effectiveStoreIds/);
assert.match(source, /function sceneTemplateKey\(/);
assert.match(source, /function resolveLimitValue\(/);
assert.match(source, /function migrateToStoreBindings\(/);
assert.match(source, /function materializeStoreConfigsFromDecoupled\(/);
assert.match(source, /decoupledVersion\s*=\s*4|decoupledVersion >= 4/);

// 步骤标题顺序（允许空白差异）
const stepsBlock = source.match(/var steps = \[([\s\S]*?)\];/);
assert.ok(stepsBlock, "steps array missing");
const titles = [...stepsBlock[1].matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]);
assert.deepEqual(titles, [
  "规则类型",
  "场景配置",
  "限购数量",
  "超限授权",
  "应用范围",
  "生效范围",
  "确认发布"
]);

// 限购模板步不得再出现门店下拉
assert.match(source, /function renderStepQuantityTemplate\(/);
const qtyFn = source.slice(source.indexOf("function renderStepQuantityTemplate("));
const qtyBody = qtyFn.slice(0, qtyFn.indexOf("\n  function ", 10));
assert.doesNotMatch(qtyBody, /data-limit-store-select/);
assert.doesNotMatch(qtyBody, /data-product-row/);

assert.match(source, /function renderStepStoreBindings\(/);
assert.match(source, /产线/); // 添加商品内产线列文案或注释
assert.match(source, /productOverrides/);

console.log("verify-order-limit-template-store-bindings: OK");
```

- [ ] **Step 2: 跑脚本确认 RED**

Run:

```bash
node "admin-web/scripts/verify-order-limit-template-store-bindings.mjs"
```

Expected: FAIL（缺 `storeBindings` / 步骤标题不匹配等）

- [ ] **Step 3: 双写脚本到主工作区** `admin-web/scripts/`

- [ ] **Step 4: Commit（仅用户要求时）**

---

### Task 2: 数据模型骨架 + 场景模板键

**Files:**

- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`

- [ ] **Step 1: 替换 `steps` 数组**

```js
var steps = [
  { title: "规则类型", note: "确定计算口径" },
  { title: "场景配置", note: "人数与轮次区间" },
  { title: "限购数量", note: "规则级场景矩阵模板" },
  { title: "超限授权", note: "授权范围与权限" },
  { title: "应用范围", note: "按门店绑定产线与商品" },
  { title: "生效范围", note: "时间、会员与启用门店" },
  { title: "确认发布", note: "复核并下发" }
];
```

- [ ] **Step 2: 增加空结构与 normalize**

在 `ensureDecoupledFields` / `defaultDraft` 中保证：

```js
function createEmptyLimitCell() {
  return { configured: false, value: null };
}

function createEmptyStoreBinding() {
  return { lineIds: [], targetsByLine: {}, productOverrides: {} };
}

function sceneTemplateKey(partyIndex, roundIndex) {
  return String(partyIndex) + "|" + String(roundIndex);
}

function overrideKey(lineId, targetId, partyIndex, roundIndex) {
  return [lineId, targetId, partyIndex, roundIndex].join("|");
}

// ensureDecoupledFields 内：
if (!draft.storeBindings || typeof draft.storeBindings !== "object") draft.storeBindings = {};
if (!Array.isArray(draft.effectiveStoreIds)) draft.effectiveStoreIds = [];
if (!draft.quantityTemplate || typeof draft.quantityTemplate !== "object") {
  draft.quantityTemplate = { cells: {} };
}
if (!draft.quantityTemplate.cells) draft.quantityTemplate.cells = {};
// 保留 scopeEntries 字段只读迁移用；新编辑路径不再写入
```

- [ ] **Step 3: 跑 Task 1 verify** —— 仍可能 RED（缺 migrate 函数名等），但 `steps` 标题应变绿一部分

- [ ] **Step 4: 双写 flow.js + Commit（仅用户要求时）**

---

### Task 3: 纯函数 — resolve / cascade / materialize / migrate

**Files:**

- Modify: `order-limit-flow.js`（纯函数区，靠近现有 `resolveLimitValue`）

- [ ] **Step 1: 重写 `resolveLimitValue`（规格公式）**

```js
function resolveLimitValue(draft, storeId, lineId, partyIndex, roundIndex, targetId) {
  ensureDecoupledFields(draft);
  if ((draft.effectiveStoreIds || []).indexOf(storeId) < 0) return null;
  var binding = draft.storeBindings[storeId];
  if (!binding) return null;
  var targets = (binding.targetsByLine && binding.targetsByLine[lineId]) || [];
  if (targets.indexOf(targetId) < 0) return null;
  var oKey = overrideKey(lineId, targetId, partyIndex, roundIndex);
  var o = binding.productOverrides && binding.productOverrides[oKey];
  if (o && o.configured) return cloneValue(o);
  var tKey = sceneTemplateKey(partyIndex, roundIndex);
  var t = draft.quantityTemplate.cells[tKey];
  if (t && t.configured) return cloneValue(t);
  return null;
}
```

- [ ] **Step 2: 级联删除**

```js
function cascadeRemoveTarget(draft, storeId, lineId, targetId) {
  var binding = draft.storeBindings[storeId];
  if (!binding) return;
  var list = (binding.targetsByLine[lineId] || []).filter(function (id) { return id !== targetId; });
  if (list.length) binding.targetsByLine[lineId] = list;
  else delete binding.targetsByLine[lineId];
  binding.lineIds = Object.keys(binding.targetsByLine).filter(function (lid) {
    return (binding.targetsByLine[lid] || []).length > 0;
  });
  var prefix = lineId + "|" + targetId + "|";
  Object.keys(binding.productOverrides || {}).forEach(function (key) {
    if (key.indexOf(prefix) === 0) delete binding.productOverrides[key];
  });
}

function removeStoreBinding(draft, storeId) {
  delete draft.storeBindings[storeId];
  draft.effectiveStoreIds = (draft.effectiveStoreIds || []).filter(function (id) { return id !== storeId; });
  draft.deployStoreIds = (draft.deployStoreIds || []).filter(function (id) { return id !== storeId; });
  syncParticipatingFromBindings(draft);
}

function syncParticipatingFromBindings(draft) {
  draft.participatingStoreIds = Object.keys(draft.storeBindings || {});
}
```

- [ ] **Step 3: `materializeStoreConfigsFromDecoupled`**

对每个 `storeId ∈ deployStoreIds`：

1. 从 `storeBindings[storeId].targetsByLine` + MenuPicker 目录派生 `structureByLine` / `targetIds`。
2. 对每个 `(party, round, line, target)` 写 `limits[limitKey(...)] = resolveLimitValue(...) || createEmptyLimitCell()`。
3. 不在 `deployStoreIds` 的店不要写入 published `storeConfigs`。

- [ ] **Step 4: `migrateToStoreBindings(draft)` → `decoupledVersion = 4`**

顺序（规格钉死）：

1. 若 `decoupledVersion >= 4` 且已有 `storeBindings` 键，return false。
2. 若存在旧 `storeConfigs`：先建全部 bindings（structure/targetIds → targetsByLine）。
3. 全店已配置 limits 按 `party|round` 取全局众数 → `quantityTemplate`（键用 `sceneTemplateKey`；单元格保持 `LimitCell`）。众数并列取较小 `value`。
4. 再逐店：与模板 `cellValue` 不同的 `line|target|party|round` → `productOverrides`。
5. 若存在半成品 `scopeEntries`：把每条 entry 的 storeIds × targets 并入 bindings（同店合并去重）；entry 内数量差异写入 overrides；然后可清空 `scopeEntries` 或保留只读标记。
6. `effectiveStoreIds` = 旧 participating/deploy 与 binding 键的交集；若空则 = 全部 binding 键。
7. `deployStoreIds` 初值 = `effectiveStoreIds`；`migratedFromStoreConfigs = true`；`decoupledVersion = 4`。

- [ ] **Step 5: 接入现有 v1–v3 迁移 / normalize / sync 链路（必做）**

现网顺序大致为：

`migrateStoreConfigsToDecoupled` → `migrateScopeAndOverridesToEntries` → `migrateEntryQuantityModel`，以及 `decoupledVersion >= 1` 时的 `syncStoreConfigsFromDecoupled`，`buildPublishedDraft` 用 `allScopeStoreIds` / `resolvableScopeStoreIds`。

**改成：**

**实现钉死（写进 `migrateToStoreBindings` 注释）：** **直接**由 `migrateToStoreBindings` 消化 `storeConfigs` / `scopeEntries` / v1–v3 中间态抬到 v4；编辑加载路径**不再**串跑 `migrateScopeAndOverridesToEntries` + `migrateEntryQuantityModel`。旧函数可保留但勿再调用。

步号审计时除 `currentStep ===` 外，一并搜 `highestStep`、`validateAll`、completion/limits 辅助，清掉「步 5=scopeEntries、步 6=限购」隐含假设。

1. `normalizeLoadedEditorDraft`：若 `decoupledVersion < 4` 或仍有待迁移的 `storeConfigs`/`scopeEntries`，调用 `migrateToStoreBindings(draft)`；之后跳过任何写回 scopeEntries 的逻辑。
2. **编辑态禁止**再调用 `syncStoreConfigsFromDecoupled` 覆盖 SSOT。检索所有 `syncStoreConfigsFromDecoupled(`：仅发布/materialize 路径可写 `storeConfigs`。
3. `buildPublishedDraft`：下发过滤源改为 `deployStoreIds ⊆ effectiveStoreIds ⊆ keys(storeBindings)`；**停止**用 `resolvableScopeStoreIds(scopeEntries)` 作为权威。
4. 半成品仅有 `scopeEntries`、无可用 `storeConfigs.limits` 时：`quantityTemplate` 从各 entry 的 `unifiedCells` / `storeCells` / 旧 `overrideCells` 按 `party|round` 剥掉 line/target 后取全局众数；若仍空则模板未配置，`migrationSummary.templateEmpty = true`。

- [ ] **Step 6: 跑 verify** —— `migrateToStoreBindings` / `resolveLimitValue` 等符号应变绿

- [ ] **Step 7: 双写 + Commit（仅用户要求时）**

---

### Task 4: 重排 `renderEditorContent` + `validateStep` + **步号硬编码审计**

**Files:**

- Modify: `order-limit-flow.js`

- [ ] **Step 1: 映射表**

```js
function renderEditorContent() {
  var draft = editorState.rule.editorDraft;
  if (editorState.currentStep === 1) return renderStepOne(draft);
  if (editorState.currentStep === 2) return renderStepThree(draft);
  if (editorState.currentStep === 3) return renderStepQuantityTemplate(draft);
  if (editorState.currentStep === 4) return renderStepSix(draft);
  if (editorState.currentStep === 5) return renderStepStoreBindings(draft);
  if (editorState.currentStep === 6) return renderStepEffective(draft); // 由 renderStepFive 改造/改名
  return renderStepSeven(draft);
}
```

- [ ] **Step 2: 全局审计并改写步号硬编码（必做，否则 UI 映射对了行为仍乱）**

在 `order-limit-flow.js` 内搜索并全部对齐新步号：

| 符号 / 模式 | 新口径 |
|-------------|--------|
| `isQuantityStep()` / 「限购步」判断 | `currentStep === 3` |
| `goToEditorStep` 离开步关闭添加商品弹层 | 离开 **步 5**（应用范围）时关闭 |
| `data-product-add-open` 及 brand/local 分支 | 仅服务步 5；写入 `storeBindings`，删除 brand/local 双轨写入 scopeEntries |
| 确认页 / 摘要 `data-goto-step="N"` | 模板→3，应用范围→5，生效→6，授权→4 |
| scene spy / 限购完成度辅助 | 挂在步 3，读写 `quantityTemplate` 而非 entry cells |
| 任何 `currentStep === 6` 当限购、`=== 5` 当 scopeEntries | 按上表改掉 |

实现时用 ripgrep：`currentStep ===`、`data-goto-step`、`isQuantityStep`、`scopeEntries`、`product-add`，逐处改完再继续。

- [ ] **Step 3: 重写 `validateStep` 按目标映射表**

```js
// step 3
eachSceneTemplateCell(draft, function (key, cell) {
  if (!cell || !cell.configured || typeof cell.value !== "number" || !isFinite(cell.value)) {
    missing += 1;
  }
});
// step 5
if (!Object.keys(draft.storeBindings).length) return "请至少添加一家门店并配置商品";
// 每店至少一个叶子
// step 6
if (!draft.effectiveStoreIds.length) return "请至少启用一家生效门店";
if (draft.effectiveStoreIds.some(function (id) { return !draft.storeBindings[id]; })) {
  return "生效门店必须是已配置商品的门店";
}
// step 7
if (draft.deployStoreIds.some(function (id) {
  return draft.effectiveStoreIds.indexOf(id) < 0;
})) return "下发门店必须属于已启用的生效门店";
```

- [ ] **Step 4: 维度变更清空**

改 `partyRanges` / `roundRanges` / `period` / `subject`：确认后清空 `quantityTemplate.cells` 与所有 `productOverrides`，**保留** `storeBindings` 选品。  
改 `targetType`：再清空各店 `targetsByLine` / `productOverrides`（可留门店键）。使用 `AppDialogs.confirm`。

- [ ] **Step 5: 双写 + Commit（仅用户要求时）**

---

### Task 5: 步 3 UI — 场景矩阵模板

**Files:**

- Modify: `order-limit-flow.js`、`order-limit-flow.css`

- [ ] **Step 1: 实现 `renderStepQuantityTemplate`**

- 表头：人数区间 × 轮次（`sceneCombos` / partyRanges × roundRanges）。
- 输入写入 `draft.quantityTemplate.cells[sceneTemplateKey(p,r)] = { configured: true, value: n }`。
- 提供「批量填数」按钮：将同一数字写入当前所有场景格。
- **禁止**渲染门店下拉、商品行、产线切换。

- [ ] **Step 2: 事件绑定** `input[data-template-cell]`、`button[data-template-fill-all]`

- [ ] **Step 3: verify** —— `renderStepQuantityTemplate` 体无 `data-limit-store-select`

- [ ] **Step 4: 双写 + Commit（仅用户要求时）**

---

### Task 6: 步 5 UI — 按店树 + 添加商品四级树

**Files:**

- Modify: `order-limit-flow.js`、`order-limit-flow.css`
- Reuse: 现有添加商品弹层 / `MenuPicker`（见 `2026-08-17-order-limit-add-product-dialog-design.md`）

- [ ] **Step 1: `renderStepStoreBindings`**

布局：

- 左：门店列表（来自已添加 binding 键）+「添加门店」。
- 右：当前店已选商品列表（路径文案）+「添加商品」；只读摘要 `eMenu N · Kiosk M`。
- **无**独立产线勾选条。

- [ ] **Step 2: 添加门店**

从 `stores` 中多选尚未 binding 的店；创建 `createEmptyStoreBinding()`；新店加入 `effectiveStoreIds`（默认启用）。

- [ ] **Step 3: 添加商品弹层**

列顺序：**产线 | 组 | 类 | 菜**（分类规则叶子停在「类」）。  
确认后：

```js
function applyPickerSelectionToBinding(draft, storeId, selectedLeaves) {
  // selectedLeaves: [{ lineId, targetId, ... }]
  var binding = draft.storeBindings[storeId] || createEmptyStoreBinding();
  selectedLeaves.forEach(function (leaf) {
    if (!binding.targetsByLine[leaf.lineId]) binding.targetsByLine[leaf.lineId] = [];
    if (binding.targetsByLine[leaf.lineId].indexOf(leaf.targetId) < 0) {
      binding.targetsByLine[leaf.lineId].push(leaf.targetId);
    }
  });
  binding.lineIds = Object.keys(binding.targetsByLine).filter(function (lid) {
    return (binding.targetsByLine[lid] || []).length > 0;
  });
  draft.storeBindings[storeId] = binding;
  syncParticipatingFromBindings(draft);
}
```

- [ ] **Step 4: 删除商品 / 删除门店**

调用 `cascadeRemoveTarget` / `removeStoreBinding`；破坏性操作用 `AppDialogs.confirm`。

- [ ] **Step 5: 手测 + verify 符号 + 双写**

---

### Task 7: 商品例外编辑

**Files:**

- Modify: `order-limit-flow.js`、`order-limit-flow.css`

- [ ] **Step 1: 已选列表行操作**

- 「沿用模板」：无 override 键（或全部未 configured）。
- 「例外 · 编辑」：打开与模板同形矩阵；只把与模板 `cellValue` 不同的格写入 `productOverrides`；相同则删除该 override 键。
- 「清除例外」：删光该 `line|target|*` 前缀键。

- [ ] **Step 2: 校验** 例外格若 configured 必须是有限数字

- [ ] **Step 3: 双写 + Commit（仅用户要求时）**

---

### Task 8: 步 6 生效范围 — 时间会员 + 门店开关

**Files:**

- Modify: `order-limit-flow.js`

- [ ] **Step 1: 改造生效步**

保留现有日期/周期/时段/会员 UI。  
门店区：

```js
var configured = Object.keys(draft.storeBindings || {});
// checkbox 仅对这些 id；checked = effectiveStoreIds.includes
// 进入步骤时：把「新出现在 configured 且不在 effectiveStoreIds」的店默认勾上
```

禁止展示未 binding 的店。

- [ ] **Step 2: 取消勾选不删 binding**；仅从 `effectiveStoreIds` / 必要时从 `deployStoreIds` 移除

- [ ] **Step 3: 双写 + Commit（仅用户要求时）**

---

### Task 9: 确认发布物化 + 列表摘要

**Files:**

- Modify: `order-limit-flow.js`（`buildPublishedDraft` / 确认页摘要）

- [ ] **Step 1: 发布前调用 `materializeStoreConfigsFromDecoupled(draft, draft.deployStoreIds)`**

确认页下发勾选列表 = `effectiveStoreIds`（进入步 7 时若 `deployStoreIds` 空则默认 = `effectiveStoreIds`；允许缩小，校验 `deploy ⊆ effective`）。摘要「前往编辑」步号：模板 3 / 授权 4 / 应用范围 5 / 生效 6。

- [ ] **Step 2: 确认页摘要三块**

1. 规则模板（类型/场景/矩阵摘要）→ `data-goto-step="3"`
2. 应用范围（按店商品数）→ `data-goto-step="5"`
3. 生效与下发（effective / deploy）→ `data-goto-step="6"`

- [ ] **Step 3: 列表若读 published.storeConfigs 可不变；编辑入口走 migrate**

- [ ] **Step 4: 双写 + Commit（仅用户要求时）**

---

### Task 10: 清理旧路径断言 + 全量 verify

**Files:**

- Modify: 冲突的 `admin-web/scripts/verify-order-limit-*.mjs`
- Keep: 新 `verify-order-limit-template-store-bindings.mjs` 必须 GREEN

- [ ] **Step 1: 全局搜索断言**

将下列过时期望改为新口径或删除：

- 步序「应用范围在限购之前」且限购依赖 scopeEntries
- `data-limit-store-select` 必现于限购步
- 必填 `scopeEntries` / `brandTargetsByLine` 为编辑权威
- 步标题仍含「默认限购数量」「例外覆盖」独立步

- [ ] **Step 2: 跑新 verify + 受影响旧 verify**

```bash
node admin-web/scripts/verify-order-limit-template-store-bindings.mjs
# 以及本任务改过的其它 verify-*.mjs
```

Expected: 全部 PASS

- [ ] **Step 3: 手测验收故事**

1. 类型+场景 → 模板全 1 → 授权合法 → 店 A 添加 eMenu 5 菜（烤鱼例外 2）→ 生效勾选店 A → 发布物化正确  
2. **改模板**后，无例外的 4 个菜限购跟随变化；烤鱼仍为 2  
3. **改人数/轮次**：确认后模板与全部 overrides 清空，选品保留  
4. **旧规则**（storeConfigs 或半成品 scopeEntries）打开可编辑，再发布消费者可读 storeConfigs  
5. 未勾选生效的已绑定店：配置仍在，发布物化中不出现  

- [ ] **Step 4: 双写全部改动文件到主工作区**

- [ ] **Step 5: Commit（仅用户要求时）**

---

## Spec 覆盖自检

| 规格要求 | Task |
|----------|------|
| 步骤顺序 | 2, 4 |
| 场景维模板、无商品 | 2, 5 |
| LimitCell 形状 | 2, 3, 5 |
| storeBindings 按店树 | 6 |
| 添加商品产线→组→类→菜 | 6 |
| 商品例外稀疏 | 7 |
| 生效店开关语义 | 8 |
| 维度变更整表清空 | 4 |
| 迁移众数→例外 | 3 |
| 发布物化 / deploy ⊆ effective | 3, 9 |
| 自定义对话框 | 4, 6, 7 |
| 不做多店条目/按店整表覆盖 | 全计划未引入 |

---

## 执行说明

实现前请用户再浏览本计划。开始实现时在 worktree 内改权威源，并双写主工作区。禁止自动 commit/push。
