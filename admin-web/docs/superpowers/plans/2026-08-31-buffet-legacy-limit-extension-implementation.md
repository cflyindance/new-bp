# 自助餐旧有限购能力扩展实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有自助餐规则六步流程中支持一条规则组合“整个订单、每轮、分轮次”限制，并覆盖菜品、分类、菜品集、总量上下限、整桌兜底和单品保护，同时保持菜单下单限制与旧自助餐规则行为不变。

**Architecture:** 新增 `buffet-rule-policy.js` 作为自助餐规则 v4 的纯函数策略层，统一负责结构规范化、矩阵键、人数换算和周期选择；`buffet-rule-domain.js` 继续负责冲突、可满足性、运行时原子校验和快照编译；共享 `order-limit-flow.js` 仅在 buffet profile 下渲染多周期场景与周期分区数量编辑器。仓库 envelope 和自助餐独立存储键保持 v1，旧规则只读加载并在用户首次使用新增能力保存时升级为 v4。

**Tech Stack:** 静态 HTML/CSS/JavaScript、浏览器 localStorage、Node.js `assert`/`vm` 验证脚本、Vite 6、TypeScript 5.6。

**Spec:** `docs/superpowers/specs/2026-08-31-buffet-legacy-limit-extension-design.md`

## Global Constraints

- 保持六步流程：`规则类型 → 场景配置 → 限购数量 → 超限授权 → 生效范围 → 确认发布`。
- 规则类型只选择限购主体和限购对象；周期改为场景配置中的多选。
- 按人数不跟踪具体食客，额度始终按订单当前有效人数 `N` 换算。
- 本期不新增整单菜品总数最少/最多；整个订单区块只配置指定对象最大额度。
- 每轮和分轮次支持总量、指定对象、单品保护三个独立开关，并按逻辑 AND 同时生效。
- `EffectiveMin = max(PerPersonMin × N, TableMin)`；`EffectiveMax = min(PerPersonMax × N, TableMax)`，仅已配置项参与。
- 菜品集每店恰好一个逻辑集合，至少 2 个有效成员，支持跨产线合并统计“份”或“种”。
- 单品保护只作用于本规则商品范围，例外商品覆盖默认上限。
- 商品身份必须包含 `productLineId + dishId`；分类身份必须包含 `productLineId + categoryId`。
- 空值表示未配置；`0` 表示禁止下单；所有数量是 `0..999999` 的整数。
- 商品范围和数量值按门店独立保存；周期与数量区块开关为规则级配置。
- 所有命中约束共同生效；批量加购必须整批原子校验，失败不得部分写入。
- 服务员授权只绕过数量上限，不绕过最低数量和其他业务限制；整单限制不支持“当前轮”授权。
- 不修改菜单下单限制的路由、存储键、规则类型、默认数据和运行逻辑。
- 不修改 `vendor/emenu-new`，因此本计划不触发 `npm run build:emenu-new-embed -- --skip-install`。

## 文件职责

- Create: `dist/Configuration center/assets/buffet-rule-policy.js` — v4 schema、矩阵键、身份键、周期匹配、有效上下限等纯函数。
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js` — 冲突、静态可满足性、运行时统计桶、授权与快照编译。
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js` — 模板、默认规则、v4 能力声明和仓库兼容。
- Modify: `dist/Configuration center/assets/order-limit-flow.js` — buffet-only 的规则类型、场景配置、周期分区数量编辑、验证与摘要。
- Modify: `dist/Configuration center/assets/order-limit-flow.css` — 模板卡、周期区块、矩阵卡和例外商品编辑样式。
- Modify: `dist/Configuration center/buffet-rule.html` — 列表摘要和策略脚本加载。
- Modify: `dist/Configuration center/buffet-rule-editor.html` — 在 domain/profile/flow 前加载策略脚本。
- Modify: `dist/Configuration center/buffet-rule-publish-confirm.html` — 在 domain/profile/flow 前加载策略脚本。
- Modify: `package.json` — 增加稳定的自助餐规则聚合验证命令。
- Create/Modify: `scripts/verify-buffet-*.mjs` — 按任务建立可独立运行的回归护栏。

---

### Task 1: 建立 v4 策略层与脚本装配

**Files:**
- Create: `dist/Configuration center/assets/buffet-rule-policy.js`
- Modify: `dist/Configuration center/buffet-rule.html`
- Modify: `dist/Configuration center/buffet-rule-editor.html`
- Modify: `dist/Configuration center/buffet-rule-publish-confirm.html`
- Create: `scripts/verify-buffet-v4-policy.mjs`

**Interfaces:**
- Produces: `window.BuffetRulePolicy`。
- Produces: `scenarioKey(partyIndex, roundIndex): string`。
- Produces: `targetCellKey(partyIndex, roundIndex, productLineId, targetId): string`。
- Produces: `normalizeRule(input): BuffetRuleExtended`、`normalizeStoreConfig(input): StoreConfig`。
- Produces: `effectiveBounds(values, subject, partySize): { min: number|null, max: number|null, valid: boolean }`。

- [ ] **Step 1: 写策略层失败测试**

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("dist/Configuration center/assets/buffet-rule-policy.js", "utf8");
const window = {};
vm.runInNewContext(source, { window, Number, String, Array, Object, Math, JSON });
const policy = window.BuffetRulePolicy;

assert.equal(policy.scenarioKey(1, 2), "1|2");
assert.equal(policy.targetCellKey(1, 2, "kiosk", "dish-a"), "1|2|kiosk|dish-a");
assert.deepEqual(
  { ...policy.effectiveBounds({ perPersonMin: 2, tableMin: 7, perPersonMax: 4, tableMax: 10 }, "party_size", 3) },
  { min: 7, max: 10, valid: true }
);
assert.equal(policy.menuIdentity({ productLineId: "kiosk", dishId: "1" }), "kiosk|1");
assert.equal(policy.menuIdentity({ productLineId: "emenu", dishId: "1" }), "emenu|1");
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `node scripts/verify-buffet-v4-policy.mjs`  
Expected: FAIL，原因是 `buffet-rule-policy.js` 尚不存在。

- [ ] **Step 3: 实现纯函数策略 API**

```js
(function () {
  "use strict";

  function configuredNumber(value) {
    return Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 999999
      ? Number(value)
      : null;
  }

  function scenarioKey(partyIndex, roundIndex) {
    return Number(partyIndex) + "|" + Number(roundIndex);
  }

  function targetCellKey(partyIndex, roundIndex, productLineId, targetId) {
    return scenarioKey(partyIndex, roundIndex) + "|" + String(productLineId) + "|" + String(targetId);
  }

  function menuIdentity(item) {
    return String(item.productLineId) + "|" + String(item.dishId);
  }

  function normalizeLimitCell(cell) {
    var value = cell && cell.configured ? configuredNumber(cell.value) : null;
    return value == null ? { configured: false, value: null } : { configured: true, value: value };
  }

  function normalizeBoundCell(cell) {
    var min = cell && cell.minConfigured ? configuredNumber(cell.min) : null;
    var max = cell && cell.maxConfigured ? configuredNumber(cell.max) : null;
    return {
      minConfigured: min != null,
      min: min,
      maxConfigured: max != null,
      max: max
    };
  }

  function normalizeStoreConfig(input) {
    var source = JSON.parse(JSON.stringify(input || {}));
    var unique = {};
    source.dishTargets = (source.dishTargets || []).filter(function (item) {
      var key = menuIdentity(item);
      if (!item.productLineId || !item.dishId || unique[key]) return false;
      unique[key] = true;
      return true;
    });
    source.categoryTargets = source.categoryTargets || [];
    source.dishSetMembers = source.dishSetMembers || [];
    source.periodValues = source.periodValues || {};
    ["order_lifetime", "per_round", "multi_round"].forEach(function (period) {
      source.periodValues[period] = source.periodValues[period] || {
        totalBounds: {}, tableTotalBounds: {}, targetLimits: {}, tableTargetCaps: {},
        defaultDishLimits: {}, exceptionDishLimits: {}
      };
    });
    return source;
  }

  function normalizeRule(input) {
    var source = JSON.parse(JSON.stringify(input || {}));
    source.schemaVersion = 4;
    source.enabledPeriods = (source.enabledPeriods || [source.period].filter(Boolean)).filter(function (period, index, values) {
      return ["order_lifetime", "per_round", "multi_round"].indexOf(period) >= 0 && values.indexOf(period) === index;
    });
    source.measureUnit = source.measureUnit === "kind" ? "kind" : "piece";
    source.periodPolicies = source.periodPolicies || {};
    source.storeConfigs = source.storeConfigs || {};
    ["order_lifetime", "per_round", "multi_round"].forEach(function (period) {
      source.periodPolicies[period] = source.periodPolicies[period] || {
        enabled: source.enabledPeriods.indexOf(period) >= 0,
        blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false }
      };
    });
    Object.keys(source.storeConfigs).forEach(function (storeId) {
      source.storeConfigs[storeId] = normalizeStoreConfig(source.storeConfigs[storeId]);
    });
    return source;
  }

  function effectiveBounds(values, subject, partySize) {
    var factor = subject === "party_size" ? partySize : 1;
    var mins = [values.perPersonMin == null ? null : values.perPersonMin * factor, values.tableMin]
      .filter(function (value) { return value != null; });
    var maxes = [values.perPersonMax == null ? null : values.perPersonMax * factor, values.tableMax]
      .filter(function (value) { return value != null; });
    var min = mins.length ? Math.max.apply(Math, mins) : null;
    var max = maxes.length ? Math.min.apply(Math, maxes) : null;
    return { min: min, max: max, valid: min == null || max == null || min <= max };
  }

  window.BuffetRulePolicy = {
    schemaVersion: 4,
    periods: ["order_lifetime", "per_round", "multi_round"],
    scenarioKey: scenarioKey,
    targetCellKey: targetCellKey,
    menuIdentity: menuIdentity,
    effectiveBounds: effectiveBounds,
    normalizeRule: normalizeRule,
    normalizeStoreConfig: normalizeStoreConfig
  };
})();
```

继续在 `normalizeStoreConfig` 中对 `categoryTargets`、`dishSetMembers`、所有数量 Map 和例外行执行同样的复制、身份去重和单元格规范化。不同 `productLineId` 的相同 ID 必须保留；不得修改传入对象。

- [ ] **Step 4: 在三个自助餐页面中按顺序装配脚本**

```html
<script src="assets/buffet-rule-policy.js"></script>
<script src="assets/buffet-rule-domain.js"></script>
<script src="assets/buffet-rule-profile.js"></script>
```

列表、编辑器、发布确认页都使用此顺序；菜单下单限制页面不加载该文件。

- [ ] **Step 5: 运行策略和菜单隔离测试**

Run: `node scripts/verify-buffet-v4-policy.mjs && node scripts/verify-buffet-rule-menu-regression.mjs`  
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add "dist/Configuration center/assets/buffet-rule-policy.js" "dist/Configuration center/buffet-rule.html" "dist/Configuration center/buffet-rule-editor.html" "dist/Configuration center/buffet-rule-publish-confirm.html" scripts/verify-buffet-v4-policy.mjs
git commit -m "feat: add buffet rule v4 policy layer"
```

### Task 2: 升级 profile、模板与旧规则兼容

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Create: `scripts/verify-buffet-v4-profile.mjs`
- Modify: `scripts/verify-buffet-default-scenario-rules.mjs`
- Modify: `scripts/verify-buffet-rule-repository.mjs`

**Interfaces:**
- Consumes: `BuffetRulePolicy.normalizeRule`。
- Produces: `moduleProfile.periodTemplates` 五个模板。
- Produces: 新建规则默认 v4；旧 v1/v2 规则保持旧口径，首次保存新增能力时升级 v4。

- [ ] **Step 1: 写 profile 与迁移失败测试**

```js
assert.deepEqual(profile.periodTemplates.map(item => item.id), [
  "order-basic", "round-party-table-cap", "order-round-protection", "multi-round-desc", "custom"
]);
assert.equal(profile.createDefaultScenarioRule({ subject: "order", targetType: "dish" }, 1).editorDraft.schemaVersion, 4);
assert.deepEqual(profile.allowedTargetTypes, ["category", "dish", "dish_set"]);
assert.deepEqual(profile.allowedPeriods, ["order_lifetime", "per_round", "multi_round"]);
```

再构造 v2 菜品集规则，断言仅加载时仍保留 `period`、`dishSetLimits` 和原运行结果；调用 `upgradeDraftToV4` 后才生成 `enabledPeriods` 与 `periodValues`。

- [ ] **Step 2: 运行并确认 RED**

Run: `node scripts/verify-buffet-v4-profile.mjs`  
Expected: FAIL，缺少模板与 v4 默认结构。

- [ ] **Step 3: 定义模板数据，不产生新规则类型**

```js
var PERIOD_TEMPLATES = [
  { id: "order-basic", name: "基础整单限购", periods: ["order_lifetime"], blocks: { order_lifetime: ["target"] } },
  { id: "round-party-table-cap", name: "每人每轮＋整桌兜底", periods: ["per_round"], blocks: { per_round: ["total", "target"] } },
  { id: "order-round-protection", name: "整单＋每轮保护", periods: ["order_lifetime", "per_round"], blocks: { order_lifetime: ["target"], per_round: ["target", "same_dish"] } },
  { id: "multi-round-desc", name: "分轮次递减", periods: ["multi_round"], blocks: { multi_round: ["target"] } },
  { id: "custom", name: "自定义配置", periods: [], blocks: {} }
];
```

默认规则仍按“主体 × 对象”的覆盖口径补齐且默认禁用，不再以单周期生成重复规则。历史带 `defaultScenarioKey` 的记录必须被识别为已覆盖，禁止再次播种同主体/对象默认规则。

- [ ] **Step 4: 实现显式升级边界**

```js
function usesV4Capability(draft) {
  return Array.isArray(draft.enabledPeriods) || draft.measureUnit === "kind" ||
    Object.values(draft.periodPolicies || {}).some(function (policy) {
      return policy && (policy.blocks.totalEnabled || policy.blocks.sameDishEnabled);
    });
}

function upgradeDraftToV4(draft) {
  var upgraded = window.BuffetRulePolicy.normalizeRule(draft);
  upgraded.schemaVersion = 4;
  return upgraded;
}
```

加载旧规则只创建编辑态兼容投影；保存旧字段未变化时不写回升级。用户选择多周期、按种、整桌兜底、总量或单品保护后，保存为 v4。

- [ ] **Step 5: 运行 repository、默认场景和菜品集回归**

Run: `node scripts/verify-buffet-v4-profile.mjs && node scripts/verify-buffet-default-scenario-rules.mjs && node scripts/verify-buffet-rule-repository.mjs && node scripts/verify-buffet-dish-set-profile.mjs`  
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-v4-profile.mjs scripts/verify-buffet-default-scenario-rules.mjs scripts/verify-buffet-rule-repository.mjs
git commit -m "feat: add buffet period templates and v4 migration"
```

### Task 3: 重构规则类型与场景配置

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-period-scenario-editor.mjs`

**Interfaces:**
- Consumes: `moduleProfile.periodTemplates`。
- Produces: `applyBuffetTemplate(draft, templateId)`。
- Produces: `enabledPeriods: PeriodKey[]` 与规则级 `periodPolicies`。
- Preserves: 菜单下单限制仍显示原有主体、周期、对象三维选择。

- [ ] **Step 1: 写场景编辑器失败测试**

验证 buffet 规则类型页只出现“限购主体”和“限购对象”，不出现周期单选；场景配置页出现五个模板、三个周期复选框、人数区间与按需展示的轮次区间。

```js
assert.match(flow, /data-buffet-template/);
assert.match(flow, /data-period-toggle="order_lifetime"/);
assert.match(flow, /data-period-toggle="per_round"/);
assert.match(flow, /data-period-toggle="multi_round"/);
assert.match(flow, /function applyBuffetTemplate\(draft, templateId\)/);
```

- [ ] **Step 2: 运行并确认 RED**

Run: `node scripts/verify-buffet-period-scenario-editor.mjs`。

- [ ] **Step 3: 改造 buffet-only 规则类型页**

`renderStepOne` 在 buffet profile 下只渲染：

```text
限购主体：按桌/订单、按人数
限购对象：按菜品、按分类、按菜品集
```

菜单 profile 继续走原 `subject + period + targetType` 分支。切换主体或对象仍使用现有二次确认，确认后清空不兼容的门店商品与数量配置。

- [ ] **Step 4: 实现场景配置与模板预填**

```js
function setPeriodEnabled(draft, period, enabled) {
  var index = draft.enabledPeriods.indexOf(period);
  if (enabled && index < 0) draft.enabledPeriods.push(period);
  if (!enabled && index >= 0) draft.enabledPeriods.splice(index, 1);
  draft.enabledPeriods.sort(function (a, b) { return ["order_lifetime", "per_round", "multi_round"].indexOf(a) - ["order_lifetime", "per_round", "multi_round"].indexOf(b); });
  draft.periodPolicies[period].enabled = enabled;
}
```

选择模板后直接展示真实周期与区块开关；再次修改周期或区块不改变模板名称为业务语义，界面显示“已基于模板修改”。取消周期只让运行时忽略该周期，保留其草稿值。

- [ ] **Step 5: 绑定人数/轮次区间和破坏性变更**

按桌/订单隐藏人数区间并使用索引 `0`；仅启用分轮次时显示轮次区间。区间继续使用现有连续、互斥、无空档逻辑；改变区间前提示会重建对应矩阵键。

- [ ] **Step 6: 运行场景、菜单和菜品集回归**

Run: `node scripts/verify-buffet-period-scenario-editor.mjs && node scripts/verify-buffet-rule-scenarios.mjs && node scripts/verify-buffet-rule-menu-regression.mjs && node scripts/verify-buffet-dish-set-schema.mjs`  
Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-period-scenario-editor.mjs
git commit -m "feat: configure buffet multi-period scenarios"
```

### Task 4: 实现按门店保存的周期分区数量编辑器

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-period-quantity-editor.mjs`
- Modify: `scripts/verify-buffet-rule-product-configuration.mjs`

**Interfaces:**
- Consumes: `storeConfigs[storeId].periodValues[period]`。
- Produces: `readLimitCell(input): LimitCell`、`readBoundCell(minInput, maxInput): BoundCell`。
- Produces: 每店 `totalBounds`、`tableTotalBounds`、`targetLimits`、`tableTargetCaps`、`defaultDishLimits`、`exceptionDishLimits`。

- [ ] **Step 1: 写数量编辑器失败测试**

断言数量页按固定顺序渲染已启用周期；整个订单不渲染总量与单品保护；每轮/分轮次只渲染已开启区块；顶部保留配置门店下拉和商品范围摘要。

```js
assert.match(flow, /整个订单/);
assert.match(flow, /每轮菜品总数/);
assert.match(flow, /指定对象额度/);
assert.match(flow, /相同菜品保护/);
assert.match(flow, /data-period-section/);
assert.match(flow, /data-table-target-cap/);
```

- [ ] **Step 2: 运行并确认 RED**

Run: `node scripts/verify-buffet-period-quantity-editor.mjs`。

- [ ] **Step 3: 扩展每店结构并实现键生成**

```js
function quantityScenarioIndexes(draft, period) {
  var partyIndexes = draft.subject === "party_size" ? draft.partyRanges.map(function (_, i) { return i; }) : [0];
  var roundIndexes = period === "multi_round" ? draft.roundRanges.map(function (_, i) { return i; }) : [0];
  return partyIndexes.flatMap(function (partyIndex) {
    return roundIndexes.map(function (roundIndex) { return { partyIndex: partyIndex, roundIndex: roundIndex }; });
  });
}
```

菜品/分类目标使用 `TargetCellKey`；菜品集共享额度与总量使用 `ScenarioKey`。商品配置切换门店时继续自动保存，移除门店时删除该店全部 `periodValues`。

各 Map 的键固定如下，后续任务不得另造键格式：

```text
totalBounds / tableTotalBounds / defaultDishLimits / exceptionDishLimits
  -> ScenarioKey
dish_set 的 targetLimits / tableTargetCaps
  -> ScenarioKey
dish / category 的 targetLimits / tableTargetCaps
  -> TargetCellKey
```

- [ ] **Step 4: 实现三个周期分区**

- 整个订单：只显示指定对象最大额度；按人数显示整桌整单兜底上限。
- 每轮：按开关显示总量上下限、指定对象上限、单品保护。
- 分轮次：按人数区间和轮次区间卡片显示与每轮相同的三个区块。

每个输入使用以下规范：

```js
function limitCellFromInput(value) {
  return value === ""
    ? { configured: false, value: null }
    : { configured: true, value: Math.min(999999, Math.max(0, Number(value))) };
}
```

- [ ] **Step 5: 实现菜品集“份/种”与批量复制**

菜品集在数量页提供计量方式单选；切换计量方式需二次确认并清空该规则所有门店菜品集主额度和单品保护值。保留现有批量应用、复制上一人数区间、复制上一轮次区间、复制到其他参与门店；复制到门店后按 `productLineId + dishId/categoryId` 重新校验，不存在的目标记录为待完善而非静默合并。

- [ ] **Step 6: 运行数量、选品和门店隔离回归**

Run: `node scripts/verify-buffet-period-quantity-editor.mjs && node scripts/verify-buffet-rule-product-configuration.mjs && node scripts/verify-order-limit-store-specific-config.mjs && node scripts/verify-order-limit-product-quantity-merge.mjs`  
Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-period-quantity-editor.mjs scripts/verify-buffet-rule-product-configuration.mjs
git commit -m "feat: edit buffet limits by period and store"
```

### Task 5: 实现单品保护、例外商品与发布前完整校验

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-same-dish-exceptions.mjs`
- Create: `scripts/verify-buffet-v4-validation.mjs`

**Interfaces:**
- Produces: `eligibleExceptionDishes(draft, storeId): DishIdentity[]`。
- Produces: `validateV4Draft(draft): { step: number, message: string, code: string } | null`。
- Produces: `quantityCompletion(draft, storeIds)`，只统计已启用周期和区块。

- [ ] **Step 1: 写单品保护和校验失败测试**

覆盖以下断言：例外商品只能来自当前规则范围；同一菜品不能进入两条例外行；默认上限可为空；例外值覆盖默认值；菜品集每店少于 2 个成员、区间不连续、`min > max`、启用区块无任何有效值均阻止发布但允许保存草稿。

```js
assert.deepEqual(api.eligibleExceptionDishes(categoryDraft, "store-a").map(api.menuIdentity), ["kiosk|dish-a", "emenu|dish-b"]);
assert.equal(api.validateV4Draft(duplicateExceptionDraft).code, "EXCEPTION_DISH_DUPLICATED");
assert.equal(api.validateV4Draft(tooSmallDishSetDraft).code, "DISH_SET_MIN_MEMBERS");
```

- [ ] **Step 2: 运行并确认 RED**

Run: `node scripts/verify-buffet-same-dish-exceptions.mjs && node scripts/verify-buffet-v4-validation.mjs`。

- [ ] **Step 3: 实现默认上限和例外行交互**

每个场景卡包含一个默认单品上限和零到多条例外行；例外行使用当前门店商品范围过滤器，已被其他例外行选择的菜品置灰。删除例外行需要二次确认；清空输入恢复“未配置”，输入 `0` 显示“禁止下单”。

- [ ] **Step 4: 实现发布完整性与可满足性前置校验**

```js
function validateBoundPair(bound) {
  if (!bound.minConfigured && !bound.maxConfigured) return "BOUND_EMPTY";
  if (bound.minConfigured && bound.maxConfigured && bound.min > bound.max) return "BOUND_REVERSED";
  return null;
}
```

对每个生效门店、人数区间、轮次区间验证：已启用区块存在有效配置；整桌上下限与人均换算后仍有解；所有身份包含产线；菜品集成员数不少于 2；周期至少一个。`validateStep`、`validateAll`、`validateDeployStores` 和启用动作统一调用同一验证函数。

- [ ] **Step 5: 限制授权范围**

规则仅启用整个订单时，隐藏并移除 `round` 授权；同时启用每轮/分轮次时才允许选择“当前轮”。切换周期造成默认授权范围失效时，按 `operation → round → order` 选择首个仍可用范围。

- [ ] **Step 6: 运行校验、授权和既有数量回归**

Run: `node scripts/verify-buffet-same-dish-exceptions.mjs && node scripts/verify-buffet-v4-validation.mjs && node scripts/verify-buffet-rule-authorization.mjs && node scripts/verify-order-limit-quantity-table-simplification.mjs`  
Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-same-dish-exceptions.mjs scripts/verify-buffet-v4-validation.mjs
git commit -m "feat: validate buffet dish protections and exceptions"
```

### Task 6: 扩展冲突检测与静态可满足性

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js`
- Create: `scripts/verify-buffet-v4-conflicts.mjs`
- Modify: `scripts/verify-buffet-rule-conflicts.mjs`
- Modify: `scripts/verify-buffet-dish-set-domain.mjs`

**Interfaces:**
- Consumes: `BuffetRulePolicy.menuIdentity`、`enabledPeriods`、`periodPolicies`。
- Produces: `findConflict(candidate, records, excludeIds)` 的 v4 冲突结果。
- Produces: `validateStaticFeasibility(rule): { valid: boolean, violations: [] }`。

- [ ] **Step 1: 写冲突矩阵失败测试**

覆盖：同门店/条件/主体/周期/对象身份重复阻止；不同主体或不同周期允许；菜品、分类和菜品集交叉命中允许叠加；两个菜品集成员有任意交集时阻止；跨产线相同 `dishId` 不视为同一身份。

```js
assert.equal(domain.findConflict(setA, [active(setB)], []).code, "DISH_SET_MEMBER_OVERLAP");
assert.equal(domain.findConflict(kioskDish, [active(emenuSameDishId)], []), null);
assert.equal(domain.findConflict(orderDish, [active(partyDish)], []), null);
```

- [ ] **Step 2: 运行并确认 RED**

Run: `node scripts/verify-buffet-v4-conflicts.mjs`。

- [ ] **Step 3: 将单值 mouth 改为周期 mouth 集合**

```js
function mouths(rule) {
  return (rule.enabledPeriods || [rule.period]).map(function (period) {
    return rule.subject + "|" + period + "|" + rule.targetType;
  });
}
```

冲突必须先判断门店、生效日期/时段/会员、主体和周期交集，再判断对象身份。菜品集使用成员身份交集，不使用规则 ID 或完整集合相等判重。

- [ ] **Step 4: 实现静态可满足性检查**

对按人数规则枚举配置支持范围内的整数人数，对分轮次枚举每个轮次区间代表值；计算有效最小/最大、对象上限、默认单品上限和例外上限。若某组合 `EffectiveMin > EffectiveMax`，或最小总量不可能由商品范围和各单品上限满足，返回 `RULE_UNSATISFIABLE` 并带 `storeId/partyRangeIndex/roundRangeIndex`。

- [ ] **Step 5: 运行新旧冲突测试**

Run: `node scripts/verify-buffet-v4-conflicts.mjs && node scripts/verify-buffet-rule-conflicts.mjs && node scripts/verify-buffet-dish-set-domain.mjs`  
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-v4-conflicts.mjs scripts/verify-buffet-rule-conflicts.mjs scripts/verify-buffet-dish-set-domain.mjs
git commit -m "feat: detect buffet v4 conflicts and infeasible rules"
```

### Task 7: 编译运行快照并执行原子数量校验

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js`
- Create: `scripts/verify-buffet-v4-runtime.mjs`
- Modify: `scripts/verify-buffet-rule-runtime.mjs`
- Modify: `scripts/verify-buffet-rule-authorization.mjs`

**Interfaces:**
- Produces: `compileRuntimeRules(records, version): RuntimeBuffetRule[]`。
- Produces: `evaluateBatch(input): EvaluationResult`。
- Consumes: `input.context.storeId/partySize/roundNo`、`input.items`、历史有效统计和 `input.phase`。
- Produces violations: `TOTAL_MIN_NOT_MET`、`TOTAL_LIMIT_EXCEEDED`、`TARGET_LIMIT_EXCEEDED`、`SAME_DISH_LIMIT_EXCEEDED`。

运行时输入固定为：

```ts
type RuntimeItem = {
  productLineId: string;
  dishId: string;
  categoryId: string;
  quantity: number;
};

type EvaluationInput = {
  operationId: string;
  processedOperationIds: string[];
  phase: "add" | "change" | "submit_round" | "close_round" | "next_round" | "checkout_with_open_round";
  context: { orderMode: "buffet"; buffetSessionId: string; storeId: string; orderId: string; partySize: number; roundNo: number };
  rules: RuntimeBuffetRule[];
  items: RuntimeItem[];
  counters: { order: RuntimeItem[]; round: RuntimeItem[] };
  authorizationCredential?: AuthorizationCredential;
};
```

- [ ] **Step 1: 写运行时失败测试**

测试同一条规则同时命中整单与每轮；固定整桌值与人均值取更严格结果；分类聚合；菜品集跨产线按份与按种；默认单品上限和例外覆盖；分轮次切换；退菜释放；重复 operationId 幂等；批量中任一项失败时整体拒绝。

```js
const result = domain.evaluateBatch({
  operationId: "op-1",
  phase: "submit_round",
  context: { orderMode: "buffet", buffetSessionId: "s1", storeId: "store-a", orderId: "o1", partySize: 3, roundNo: 2 },
  rules: [compiledRule],
  items: proposedItems,
  counters: { order: orderCounters, round: roundCounters }
});
assert.equal(result.allowed, false);
assert.deepEqual(result.violations.map(item => item.code), ["TOTAL_MIN_NOT_MET", "SAME_DISH_LIMIT_EXCEEDED"]);
assert.equal(result.acceptedItems, undefined);
```

- [ ] **Step 2: 运行并确认 RED**

Run: `node scripts/verify-buffet-v4-runtime.mjs`。

- [ ] **Step 3: 编译完整但精简的运行快照**

快照保留 `schemaVersion`、主体、对象、启用周期、区间、周期开关、仅生效门店的商品身份与数量值、条件和授权；不包含编辑器活动 tab、筛选、折叠状态。历史 v1/v2 规则继续编译为原单周期运行结构。

- [ ] **Step 4: 建立独立统计桶并计算候选订单状态**

```text
order bucket     = 当前订单全部有效数量
round bucket     = 当前订单当前轮有效数量
dish bucket      = productLineId|dishId
category bucket  = productLineId|categoryId
dish-set pieces  = 成员有效份数之和
dish-set kinds   = 数量 > 0 的不同 productLineId|dishId 数量
```

加购、改量、提交均基于“历史有效数量 + 本次整批变更”的候选状态校验。成功退菜、取消和作废通过负向变更释放统计；结果不得低于 0。

- [ ] **Step 5: 实现阶段校验与授权**

最大额度在 `add/change/submit_round` 校验；最小额度只在非空轮次的 `submit_round/close_round/next_round/checkout_with_open_round` 校验。授权凭证按规则版本、门店、订单、周期和对象匹配；只过滤对应上限 violation，最低数量 violation 始终保留。授权后数量仍进入统计桶。

- [ ] **Step 6: 运行运行时、授权和生命周期回归**

Run: `node scripts/verify-buffet-v4-runtime.mjs && node scripts/verify-buffet-rule-runtime.mjs && node scripts/verify-buffet-rule-authorization.mjs && node scripts/verify-buffet-rule-lifecycle.mjs`  
Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-v4-runtime.mjs scripts/verify-buffet-rule-runtime.mjs scripts/verify-buffet-rule-authorization.mjs
git commit -m "feat: evaluate combined buffet quantity policies"
```

### Task 8: 完成摘要、发布、复制和列表生命周期

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/buffet-rule.html`
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Create: `scripts/verify-buffet-v4-lifecycle.mjs`

**Interfaces:**
- Produces: `periodSummary(draft, storeIds): string`。
- Produces: `quantityPolicySummary(draft, storeId): SummarySection[]`。
- Preserves: repository envelope `buffet-rule:repository:v1` 和原子 snapshot 发布。

- [ ] **Step 1: 写生命周期失败测试**

覆盖 create → autosave → reload → copy → publish → disable → enable → delete；断言 v4 字段无丢失，复制后重新校验目标门店身份，发布只裁剪生效门店，取消生效门店不删除草稿配置，旧规则未编辑时字节级业务字段不被升级。

- [ ] **Step 2: 运行并确认 RED**

Run: `node scripts/verify-buffet-v4-lifecycle.mjs`。

- [ ] **Step 3: 改造确认步骤与发布确认页摘要**

按 `整个订单 / 每轮 / 分轮次` 折叠展示，逐段列出主体、对象、门店、人数/轮次区间、计量方式、总量、对象额度、整桌值、默认单品上限和例外商品。摘要必须展示实际配置，不能只显示模板名称或“已配置 N 格”。

- [ ] **Step 4: 改造列表计算方式文案**

列表显示例如：

```text
按人数 · 菜品集 · 整个订单＋每轮
按桌/订单 · 分类 · 分轮次
```

菜品集必须正确显示，不得回退为“按分类”。启用动作先调用完整性、冲突和静态可满足性检查，失败时显示具体原因。

- [ ] **Step 5: 验证保存、复制与原子发布**

`buildPublishedDraft` 只保留 `deployStoreIds` 对应的 v4 `storeConfigs`；authoring draft 保留未生效门店草稿。复制规则复制周期策略和门店草稿，但清除发布版本、授权记录和运行快照引用。

- [ ] **Step 6: 运行生命周期与 repository 回归**

Run: `node scripts/verify-buffet-v4-lifecycle.mjs && node scripts/verify-buffet-rule-repository.mjs && node scripts/verify-buffet-default-scenario-rules.mjs && node scripts/verify-buffet-rule-fullscreen.mjs`  
Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/buffet-rule.html" "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-v4-lifecycle.mjs
git commit -m "feat: publish and summarize buffet v4 rules"
```

### Task 9: 聚合回归、构建与浏览器验收

**Files:**
- Modify: `package.json`
- Create: `scripts/verify-buffet-legacy-extension.mjs`
- Modify scoped files only if verification reveals a defect.

**Interfaces:**
- Produces: `npm run verify:buffet-rules` 统一验证入口。
- Validates: Tasks 1–8 作为一个可发布功能。

- [ ] **Step 1: 新增聚合验证脚本**

```js
import { spawnSync } from "node:child_process";

const scripts = [
  "verify-buffet-v4-policy.mjs",
  "verify-buffet-v4-profile.mjs",
  "verify-buffet-period-scenario-editor.mjs",
  "verify-buffet-period-quantity-editor.mjs",
  "verify-buffet-same-dish-exceptions.mjs",
  "verify-buffet-v4-validation.mjs",
  "verify-buffet-v4-conflicts.mjs",
  "verify-buffet-v4-runtime.mjs",
  "verify-buffet-v4-lifecycle.mjs"
];

for (const script of scripts) {
  const result = spawnSync(process.execPath, [`scripts/${script}`], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
```

在 `package.json` 增加：

```json
"verify:buffet-rules": "node scripts/verify-buffet-legacy-extension.mjs"
```

- [ ] **Step 2: 运行全部自助餐验证**

Run: `npm.cmd run verify:buffet-rules`  
Expected: 所有聚合测试 PASS。

- [ ] **Step 3: 运行所有既有 buffet 脚本与菜单回归**

Run: `Get-ChildItem scripts/verify-buffet-*.mjs | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }; node scripts/verify-buffet-rule-menu-regression.mjs`  
Expected: PASS。

- [ ] **Step 4: 执行语法、格式与完整构建**

Run:

```powershell
node --check "dist/Configuration center/assets/buffet-rule-policy.js"
node --check "dist/Configuration center/assets/buffet-rule-domain.js"
node --check "dist/Configuration center/assets/buffet-rule-profile.js"
node --check "dist/Configuration center/assets/order-limit-flow.js"
git diff --check
npm.cmd run build
```

Expected: 全部成功；构建不修改 `vendor/emenu-new`，也不需要 eMenu 嵌入包构建。

- [ ] **Step 5: 启动 worktree 服务并进行浏览器验收**

Run: `npm run dev -- --host 127.0.0.1 --port 65161`。

使用本地浏览器至少验证：

1. 新建按桌/订单＋菜品规则，只启用整个订单并发布。
2. 新建按人数＋分类规则，同时启用每轮总量、对象额度和整桌兜底。
3. 新建按人数＋菜品集规则，跨两条产线选品，按“种”配置每轮额度。
4. 在分轮次中配置递减额度，并复制到下一人数区间和另一门店。
5. 配置默认单品上限与一个例外商品，确认自然语言摘要和发布摘要一致。
6. 输入 `0` 显示禁止，清空显示未配置。
7. 制造无解上下限、重复例外和重叠菜品集，确认保存草稿允许但发布/启用受阻。
8. 仅整单周期不出现“当前轮”授权；组合每轮周期后恢复。
9. 打开一条历史 v1/v2 规则，确认查看和运行语义不变。
10. 打开菜单下单限制，确认规则类型、数量页、存储和列表无回归。
11. 编辑器与发布确认页全屏，返回列表后自动退出全屏。

- [ ] **Step 6: 提交聚合验证与最终缺陷修复**

```bash
git add package.json scripts/verify-buffet-legacy-extension.mjs "dist/Configuration center/assets/buffet-rule-policy.js" "dist/Configuration center/assets/buffet-rule-domain.js" "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" "dist/Configuration center/buffet-rule.html" "dist/Configuration center/buffet-rule-editor.html" "dist/Configuration center/buffet-rule-publish-confirm.html" scripts/verify-buffet-*.mjs
git commit -m "test: verify buffet legacy limit extension"
```

## 完成判定

- `npm.cmd run verify:buffet-rules`、全部既有 `verify-buffet-*.mjs`、菜单回归和 `npm.cmd run build` 全部通过。
- 浏览器完成上述 11 个代表流程，控制台无错误。
- 菜单下单限制无行为和数据回归。
- 旧自助餐规则未使用新增能力时不被强制写回升级。
- worktree 无未提交的本功能变更，每个任务都有独立提交。
