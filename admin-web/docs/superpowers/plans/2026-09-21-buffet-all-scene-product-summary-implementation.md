# 自助餐全部场景商品限购汇总 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在配置额度页增加只读“查看全部配置”弹窗，以商品 × 场景平铺全部门店的限购结果，并支持筛选、差异检查及准确返回原场景编辑。

**Architecture:** 复用现有稳定区间身份、`sceneScopeConfig` 和场景商品投影，新增一组纯函数生成规范化汇总行，再由独立筛选/分页函数驱动只读弹窗。弹窗不维护第二份业务数据，所有行都携带稳定场景定位信息；“进入配置”通过稳定 ID 反查当前索引并调用现有场景工作台。

**Tech Stack:** 原生 JavaScript、HTML `<dialog>`、现有 `order-limit-flow.css` 设计系统、Node.js `assert`/`vm` 验证脚本。

**Spec:** `docs/superpowers/specs/2026-09-21-buffet-all-scene-product-summary-design.md`

## Global Constraints

- 汇总只读，不直接编辑、批量修改或保存第二份额度数据。
- 商品、产线、分类、门店必须独立列展示；商品编码不进入商品列。
- 场景定位必须使用 `partyRanges[].rangeId`、`roundRanges[].rangeId` 和 `periodKey`，不得把数组索引作为持久身份。
- 空值显示“未配置”，显式 `0` 显示“禁止下单”。
- 分类规则按分类行展示；菜品集商品按商品行展示并标记共享额度。
- 本期固定分页，每页默认 20 条。
- 仅修改 `dist/Configuration center` 自助餐规则实现及对应验证脚本；不得触碰 `vendor/emenu-new`，因此不触发 eMenu 嵌入包构建要求。

## File Structure

- Modify: `dist/Configuration center/assets/buffet-rule-policy.js` — 稳定区间身份迁移前置能力（仅在目标分支缺失时补齐）。
- Modify: `dist/Configuration center/assets/order-limit-flow.js` — 汇总行投影、筛选、差异、分页、弹窗和跳转交互。
- Modify: `dist/Configuration center/assets/order-limit-flow.css` — 大尺寸汇总弹窗、筛选栏、固定列和响应式样式。
- Create: `scripts/verify-buffet-all-scene-summary-model.mjs` — 行模型、限购结果、差异算法和分页纯函数验证。
- Create: `scripts/verify-buffet-all-scene-summary-ui.mjs` — 入口、弹窗、字段和空状态验证。
- Create: `scripts/verify-buffet-all-scene-summary-navigation.mjs` — 稳定 ID 跳转和失效场景验证。
- Modify: `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md` — 实现验收后同步权威文档。

---

### Task 1: 锁定稳定场景身份前置能力

**Files:**
- Modify if missing: `dist/Configuration center/assets/buffet-rule-policy.js:118-176,432`
- Create: `scripts/verify-buffet-all-scene-summary-navigation.mjs`

**Interfaces:**
- Consumes: `draft.partyRanges`, `draft.roundRanges`, `storeConfigs[*].periodValues`。
- Produces: `BuffetRulePolicy.migrateRangeIdentities(draft) -> { draft, migrated, repairIssues }`；归一化草稿的所有区间均有唯一 `rangeId`。

- [ ] **Step 1: 写稳定身份失败测试**

在新脚本中加载 `buffet-rule-policy.js`，覆盖旧索引键、重复 ID、插入/重排三类输入：

```js
const migrated = policy.migrateRangeIdentities(legacyDraft);
assert.equal(migrated.draft.rangeIdentityVersion, 1);
assert.ok(migrated.draft.partyRanges.every((range) => range.rangeId));
assert.ok(migrated.draft.roundRanges.every((range) => range.rangeId));
assert.deepEqual(
  Object.keys(migrated.draft.storeConfigs.storeA.periodValues.per_round.targetLimits),
  [`${migrated.draft.partyRanges[0].rangeId}|${migrated.draft.roundRanges[0].rangeId}|kiosk|dish-a`],
);
assert.deepEqual(
  policy.migrateRangeIdentities(migrated.draft).draft,
  migrated.draft,
  "迁移必须幂等",
);
```

- [ ] **Step 2: 运行测试并确认失败原因**

Run: `node scripts/verify-buffet-all-scene-summary-navigation.mjs`

Expected: 若目标分支缺少 API，则以 `migrateRangeIdentities is not a function` 失败；若 API 已存在，则稳定身份部分直接通过，不重复实现。

- [ ] **Step 3: 仅在缺失时补齐迁移器**

实现或复用以下导出，并保证复制区间调用方生成新 ID：

```js
function migrateRangeIdentities(input) {
  var draft = clone(input);
  if (Number(draft.rangeIdentityVersion) >= 1) {
    return { draft: draft, migrated: false, repairIssues: draft.migrationIssues || [] };
  }
  // 给人数/轮次区间补唯一 rangeId，并把 0|0|... 旧键迁移为 rangeId|rangeId|...
  // 冲突保留 repairIssues，禁止静默覆盖。
  draft.rangeIdentityVersion = 1;
  return { draft: draft, migrated: true, repairIssues: issues };
}
```

- [ ] **Step 4: 运行稳定身份及现有 policy 回归**

Run:

```powershell
node scripts/verify-buffet-all-scene-summary-navigation.mjs
node scripts/verify-buffet-v4-profile.mjs
node scripts/verify-buffet-v4-runtime.mjs
```

Expected: 新测试的迁移断言通过；旧 v4 验证没有新增失败。

- [ ] **Step 5: 提交稳定身份前置改动**

```powershell
git add -- "dist/Configuration center/assets/buffet-rule-policy.js" scripts/verify-buffet-all-scene-summary-navigation.mjs
git commit -m "test: lock buffet summary scene identity"
```

---

### Task 2: 建立全部场景汇总行模型

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4118-4255,6180-6245`
- Create: `scripts/verify-buffet-all-scene-summary-model.mjs`

**Interfaces:**
- Consumes: `addedStoreIds(draft)`, `quantityScenarioIndexes(draft, period)`, `sceneScopeConfig(draft, config, combo)`, `v4PeriodValues(config, period)`。
- Produces:
  - `buffetAllSceneCombos(draft) -> Array<{ period, partyIndex, roundIndex, partyRangeId, roundRangeId }>`
  - `buffetAllSceneSummaryRows(draft) -> SummaryRow[]`
  - `normalizeBuffetSummaryResult(draft, combo, values, target) -> SummaryResult`

- [ ] **Step 1: 写四类对象的失败测试**

构造一个包含整单、每轮、分轮次、两家门店、两个人数区间和两个轮次区间的 v4 草稿，分别断言菜品、分类、菜品集按份、菜品集按种：

```js
const rows = api.buffetAllSceneSummaryRows(draft);
assert.ok(rows.every((row) => row.periodKey && row.storeId && row.partyRangeId && row.roundRangeId));
assert.equal(rows.find((row) => row.targetType === "dish").displayName, "单锅");
assert.equal(rows.find((row) => row.targetType === "category").scopeLabel, "分类共享");
assert.equal(rows.find((row) => row.targetType === "dish_set").scopeLabel, "菜品集共享");
assert.equal(rows.find((row) => row.result.configured === false).resultText, "未配置");
assert.equal(rows.find((row) => row.result.prohibited).resultText, "禁止下单");
```

另断言菜品集空例外不继承默认保护：

```js
assert.equal(emptyExceptionRow.result.effectiveMemberProtection.status, "no_protection");
assert.match(emptyExceptionRow.resultText, /该商品未设置保护/);
```

- [ ] **Step 2: 运行模型测试确认失败**

Run: `node scripts/verify-buffet-all-scene-summary-model.mjs`

Expected: FAIL，提示 `buffetAllSceneSummaryRows` 尚未导出。

- [ ] **Step 3: 实现场景枚举和规范化结果**

在现有场景函数附近增加纯函数：

```js
function buffetAllSceneCombos(draft) {
  return (draft.enabledPeriods || []).flatMap(function (period) {
    return quantityScenarioIndexes(draft, period).map(function (indexes) {
      var party = draft.partyRanges[indexes.partyIndex];
      var round = draft.roundRanges[indexes.roundIndex];
      return {
        period: period,
        partyIndex: indexes.partyIndex,
        roundIndex: indexes.roundIndex,
        partyRangeId: draft.subject === "party_size" ? party.rangeId : "not_applicable",
        roundRangeId: period === "multi_round" ? round.rangeId : "not_applicable"
      };
    });
  });
}
```

`buffetAllSceneSummaryRows` 必须按每个 combo、每个参与门店调用 `sceneScopeConfig`，并保留 `targetType`、`targetId`、`memberDishId`、`measureUnit`，不得把分类展开成菜品独立额度。

- [ ] **Step 4: 暴露测试 API 并运行模型回归**

```js
if (window.__BUFFET_ALL_SCENE_SUMMARY_TEST__) {
  window.BuffetAllSceneSummaryTestApi = {
    buffetAllSceneCombos,
    buffetAllSceneSummaryRows,
    normalizeBuffetSummaryResult
  };
}
```

Run:

```powershell
node scripts/verify-buffet-all-scene-summary-model.mjs
node scripts/verify-buffet-cross-store-scene-rows.mjs
node scripts/verify-buffet-combo-template-runtime.mjs
```

Expected: 全部 PASS。

- [ ] **Step 5: 提交汇总行模型**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-all-scene-summary-model.mjs
git commit -m "feat: project buffet all-scene summary rows"
```

---

### Task 3: 实现筛选、差异和分页纯函数

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:6246-6310`
- Modify: `scripts/verify-buffet-all-scene-summary-model.mjs`

**Interfaces:**
- Consumes: Task 2 的 `SummaryRow[]`。
- Produces:
  - `defaultBuffetSummaryState() -> SummaryState`
  - `buffetSummaryFilterOptions(rows, state) -> FilterOptions`
  - `filterBuffetSummaryRows(rows, state) -> SummaryRow[]`
  - `buffetSummaryDifferenceKey(row) -> string`
  - `buffetSummaryResultSignature(row) -> string`
  - `buffetSummaryPageData(rows, state) -> { filtered, pageRows, totalPages, productCount, storeCount }`

- [ ] **Step 1: 增加联动、差异及分页失败测试**

```js
const state = api.defaultBuffetSummaryState();
state.storeId = "store-a";
state.lineId = "kiosk";
const options = api.buffetSummaryFilterOptions(rows, state);
assert.deepEqual(options.categories.map((item) => item.name), ["锅底", "肉类"]);
assert.ok(options.categories.every((item) => item.storeId === "store-a" && item.lineId === "kiosk"));

state.period = "order_lifetime";
const normalized = api.normalizeBuffetSummaryState(state, rows);
assert.equal(normalized.roundRangeId, "");

const differences = api.filterBuffetSummaryRows(rows, { ...state, differenceOnly: true });
assert.ok(differences.every((row) => row.hasDifference));
assert.equal(api.buffetSummaryResultSignature(sameEffectiveMemberRowA), api.buffetSummaryResultSignature(sameEffectiveMemberRowB));

const page = api.buffetSummaryPageData(rows, { ...state, page: 99, pageSize: 20 });
assert.equal(page.page, page.totalPages);
assert.ok(page.pageRows.length <= 20);
```

- [ ] **Step 2: 运行测试确认筛选函数缺失**

Run: `node scripts/verify-buffet-all-scene-summary-model.mjs`

Expected: FAIL，提示筛选或差异函数未定义。

- [ ] **Step 3: 实现状态归一化与联动选项**

`SummaryState` 固定为：

```js
{
  query: "", storeId: "", period: "", partyRangeId: "", roundRangeId: "",
  lineId: "", categoryIdentity: "", targetType: "", subject: "",
  configStatus: "", differenceOnly: false, moreOpen: false,
  page: 1, pageSize: 20
}
```

分类 identity 使用 `stableBuffetKey([storeId, lineId, categoryId])`；门店或产线改变时，通过 `normalizeBuffetSummaryState` 清空不再存在的下游条件。

- [ ] **Step 4: 实现可见结果签名和差异标记**

```js
function buffetSummaryResultSignature(row) {
  return JSON.stringify({
    configured: row.result.configured,
    prohibited: row.result.prohibited,
    targetLimit: row.result.targetLimit,
    tableTargetCap: row.result.tableTargetCap,
    totalMin: row.result.totalMin,
    totalMax: row.result.totalMax,
    effectiveMemberProtection: row.result.effectiveMemberProtection
  });
}
```

同一个 `buffetSummaryDifferenceKey` 分组只有一个适用场景时 `hasDifference=false`。目标已从某场景移除时不创建虚假空行。

- [ ] **Step 5: 运行模型与工作台状态回归**

Run:

```powershell
node scripts/verify-buffet-all-scene-summary-model.mjs
node scripts/verify-buffet-quantity-workbench-state.mjs
node scripts/verify-buffet-cross-store-scene-rows.mjs
```

Expected: 全部 PASS。

- [ ] **Step 6: 提交筛选与差异算法**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-all-scene-summary-model.mjs
git commit -m "feat: filter buffet all-scene summary"
```

---

### Task 4: 增加入口和只读汇总弹窗

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4728-4785,6200-6550,6398-6700`
- Modify: `dist/Configuration center/assets/order-limit-flow.css:992-1050`
- Create: `scripts/verify-buffet-all-scene-summary-ui.mjs`

**Interfaces:**
- Consumes: Task 2–3 的行、筛选和分页接口。
- Produces:
  - `renderBuffetAllSceneSummary(draft, state) -> string`
  - `openBuffetAllSceneSummary(returnFocus) -> void`
  - DOM hooks: `data-buffet-summary-open`, `data-buffet-summary-dialog`, `data-buffet-summary-filter`, `data-buffet-summary-enter`, `data-buffet-summary-page`。

- [ ] **Step 1: 写入口和字段失败测试**

```js
assert.match(flow, /data-buffet-summary-open/);
assert.match(flow, /data-buffet-summary-dialog/);
for (const label of ["商品", "产线", "分类", "门店", "周期", "计算方式", "人数区间", "轮次区间", "限购结果", "操作"]) {
  assert.ok(flow.includes(label), `缺少汇总字段：${label}`);
}
assert.match(flow, /仅看额度存在差异的商品/);
assert.match(flow, /进入配置/);
```

- [ ] **Step 2: 运行 UI 测试确认失败**

Run: `node scripts/verify-buffet-all-scene-summary-ui.mjs`

Expected: FAIL，提示缺少 `data-buffet-summary-open`。

- [ ] **Step 3: 在商品区块标题添加入口**

把当前标题操作区改为同级按钮：

```html
<button type="button" class="olf-button" data-buffet-summary-open>查看全部配置</button>
<button type="button" class="olf-button olf-button--primary" data-scene-product-add>＋ 添加商品</button>
```

入口仅在已经进入配置额度且草稿为自助餐 v4 规则时显示。

- [ ] **Step 4: 渲染大尺寸只读弹窗**

`renderBuffetAllSceneSummary` 必须输出：标题统计、首行常驻筛选、“更多筛选”、已选筛选标签、差异开关、固定字段表格、空状态、分页和关闭按钮。限购结果使用 Task 2 生成的 `resultText`，不得在渲染层重新计算业务数值。

- [ ] **Step 5: 绑定筛选、分页和无副作用关闭**

所有筛选变化先归一化状态，再把 `page` 设为 1 并重绘弹窗。关闭时只移除弹窗并把焦点还给 `data-buffet-summary-open`，不得调用 `markEditorDirty()`。

- [ ] **Step 6: 添加布局样式**

新增 `.olf-buffet-summary-dialog`、`.olf-buffet-summary-filters`、`.olf-buffet-summary-table-wrap`、`.olf-buffet-summary-result`；弹窗宽高使用 `min(1480px, 94vw)` 和 `92vh`，表头 sticky，商品列与操作列 sticky。小于 900px 时筛选改为两列并保留横向滚动，不隐藏业务列。

- [ ] **Step 7: 运行 UI 与现有布局回归**

Run:

```powershell
node scripts/verify-buffet-all-scene-summary-ui.mjs
node scripts/verify-buffet-quantity-workbench-layout.mjs
node scripts/verify-buffet-cross-store-scene-ui.mjs
```

Expected: 全部 PASS。

- [ ] **Step 8: 提交汇总弹窗**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-all-scene-summary-ui.mjs
git commit -m "feat: add buffet all-scene summary dialog"
```

---

### Task 5: 实现“进入配置”稳定跳转

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4650-4785,6398-6700`
- Modify: `scripts/verify-buffet-all-scene-summary-navigation.mjs`

**Interfaces:**
- Consumes: 汇总行的 `periodKey`, `partyRangeId`, `roundRangeId`, `storeId`, `rowKey`。
- Produces:
  - `resolveBuffetSummaryScene(draft, row) -> { valid, combo, storeId, reason }`
  - `enterBuffetSummaryScene(draft, rowKey) -> boolean`

- [ ] **Step 1: 写重排、删除和跨门店跳转失败测试**

```js
const row = api.buffetAllSceneSummaryRows(draft).find((item) => item.displayName === "单锅");
draft.partyRanges.reverse();
draft.roundRanges.reverse();
assert.deepEqual(api.resolveBuffetSummaryScene(draft, row).combo, {
  period: row.periodKey,
  partyIndex: draft.partyRanges.findIndex((range) => range.rangeId === row.partyRangeId),
  roundIndex: draft.roundRanges.findIndex((range) => range.rangeId === row.roundRangeId),
});

draft.partyRanges = draft.partyRanges.filter((range) => range.rangeId !== row.partyRangeId);
assert.equal(api.resolveBuffetSummaryScene(draft, row).valid, false);
```

- [ ] **Step 2: 运行导航测试确认失败**

Run: `node scripts/verify-buffet-all-scene-summary-navigation.mjs`

Expected: FAIL，提示 `resolveBuffetSummaryScene` 未定义。

- [ ] **Step 3: 实现稳定 ID 反查与跳转**

反查不到周期、门店或区间时返回 `{ valid:false, reason:"该场景已不存在，请刷新汇总结果" }`。成功时：

```js
draft.activeStoreId = resolved.storeId;
draft.activePartyIndex = resolved.combo.partyIndex;
draft.activeRoundIndex = resolved.combo.roundIndex;
closeBuffetAllSceneSummary();
openQuantitySceneDialog(draft, resolved.combo);
queueMicrotask(function () { focusAndHighlightSceneTarget(row.rowKey); });
```

不得按相同数组索引回退到其他区间。

- [ ] **Step 4: 运行导航、场景选择和删除回归**

Run:

```powershell
node scripts/verify-buffet-all-scene-summary-navigation.mjs
node scripts/verify-buffet-scene-picker.mjs
node scripts/verify-buffet-cross-store-scene-mutations.mjs
```

Expected: 全部 PASS；删除当前场景商品只减少对应场景汇总行。

- [ ] **Step 5: 提交导航交互**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-all-scene-summary-navigation.mjs
git commit -m "feat: navigate from buffet summary to scene"
```

---

### Task 6: 完整回归、浏览器验收和权威文档同步

**Files:**
- Modify: `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`
- Verify: `dist/Configuration center/buffet-rule-editor.html`

**Interfaces:**
- Consumes: Tasks 1–5 的完整功能。
- Produces: 自动化通过记录、浏览器验收结果和权威文档新增验收编号。

- [ ] **Step 1: 运行全部自助餐专项脚本**

Run:

```powershell
$failed=@(); Get-ChildItem scripts/verify-buffet-*.mjs | ForEach-Object { node $_.FullName; if($LASTEXITCODE -ne 0){$failed += $_.Name} }; if($failed.Count){throw "Failed: $($failed -join ', ')"}
```

Expected: 所有脚本 PASS。若历史脚本因已确认的新版文案或函数签名失败，只更新断言以匹配当前规范，不得删除业务断言。

- [ ] **Step 2: 启动本地主分支预览**

Run: `npm run dev -- --host 127.0.0.1`

Expected: 开发服务器成功启动并可访问 `#/operations/queue-call/buffet-rules`。

- [ ] **Step 3: 浏览器验收复杂组合**

逐项验证：

1. 人数 × 轮次至少 2 × 2 个场景，汇总行完整。
2. 整单 + 每轮、整单 + 分轮次同时展示，整单轮次为“—”。
3. 两家门店的同名商品/分类不合并。
4. 菜品、分类、菜品集按份、按种以及商品例外文案正确。
5. 门店 → 产线 → 分类联动，分类只显示分类名称。
6. 仅看差异、未配置、0、分页和空状态正确。
7. 每类行“进入配置”准确定位并高亮目标。
8. 查看、筛选、关闭不触发草稿脏状态。

- [ ] **Step 4: 同步权威文档**

在“自助餐规则场景配置融合设计”中增加“全部场景商品配置汇总”章节，复制最终入口、字段、稳定身份、差异算法和验收标准；标注本设计文档为详细实现依据。

- [ ] **Step 5: 检查差异并提交验收与文档**

Run:

```powershell
git diff --check
git status --short
```

只暂存本功能文件，然后提交：

```powershell
git add -- "docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md"
git commit -m "docs: document buffet all-scene summary"
```

Expected: 不包含工作区中其他既有修改。

## Self-Review

- Spec coverage: Tasks 2–5 覆盖入口、行模型、筛选、差异、分页、空状态和跳转；Task 6 覆盖自动化、浏览器及权威文档。
- Placeholder scan: 无 TBD/TODO/“同上”类占位；每个实现步骤均给出接口、断言或明确行为。
- Type consistency: 全文统一使用 `periodKey`, `partyRangeId`, `roundRangeId`, `SummaryRow`, `SummaryState`, `effectiveMemberProtection`。
- Scope: 仅涉及现有前端配置与验证，不引入导出、跨规则对比或第二份业务数据。
