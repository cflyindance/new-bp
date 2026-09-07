# 自助餐规则场景配置融合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将自助餐规则的独立“场景配置”融合到“规则类型”和“限购数量”，完成六步到五步迁移，同时保持历史规则、系统默认规则和菜单下单限制兼容。

**Architecture:** 继续复用 `order-limit-flow.js` 的共享编辑引擎，以 `moduleProfile.moduleId === "buffet-rule"` 隔离五步流程。把规则结构、步骤迁移和结构变更影响计算收敛到 `buffet-rule-policy.js`，把模板适用性收敛到 `buffet-rule-profile.js`；渲染层只消费策略结果，不自行推断数据清理范围。

**Tech Stack:** 原生 JavaScript、HTML/CSS、localStorage 仓储、Node.js `assert`/`vm` 验证脚本、TypeScript/Vite 项目构建。

**Spec:** `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`

## Global Constraints

- 仅修改自助餐规则；菜单下单限制继续保持原六步和原存储空间。
- 普通规则限制周期单选；跨周期只能来自两个受控组合模板。
- 迁移和编辑不得修改已发布配置及运行快照。
- 结构变化必须先预览影响；取消后草稿深比较不变。
- 商品范围和数量继续按门店独立保存。
- 不修改 `vendor/emenu-new`；如实施中确需修改，必须执行根目录 `npm run build:emenu-new-embed -- --skip-install` 并校验嵌入产物。

---

### Task 1: 建立五步流程和旧步骤迁移策略

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-policy.js`
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Create: `scripts/verify-buffet-five-step-migration.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `BuffetRulePolicy.migrateEditorProgress(input): { currentStep, highestStep, migrated, fallbackApplied }`
- Produces: `moduleProfile.steps` 为五步；共享菜单 profile 不变。

- [ ] **Step 1: 写迁移失败测试**

创建 `scripts/verify-buffet-five-step-migration.mjs`，载入 policy/profile/flow，断言旧步骤 `1..6` 映射为 `[1,2,2,3,4,5]`，`highestStep` 同样折叠，重复迁移结果相同；同时断言菜单默认步骤仍为六步。

```js
const expected = [1, 2, 2, 3, 4, 5];
expected.forEach((next, index) => {
  const result = policy.migrateEditorProgress({ stepVersion: 1, currentStep: index + 1, highestStep: index + 1 });
  assert.equal(result.currentStep, next);
  assert.equal(result.highestStep, next);
});
assert.equal(buffetProfile.steps.length, 5);
assert.equal(menuSteps.length, 6);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-five-step-migration.mjs`
Expected: FAIL，提示 `migrateEditorProgress` 不存在或自助餐仍为六步。

- [ ] **Step 3: 实现五步定义和幂等迁移**

在 policy 中加入固定映射并保留迁移版本：

```js
var LEGACY_STEP_MAP = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 5 };
function migrateEditorProgress(input) {
  var current = LEGACY_STEP_MAP[input.currentStep] || 1;
  var highest = LEGACY_STEP_MAP[input.highestStep] || current;
  return { currentStep: current, highestStep: Math.max(current, highest), migrated: input.stepVersion !== 2, fallbackApplied: false, stepVersion: 2 };
}
```

将 buffet profile 步骤改为规则类型、限购数量、超限授权、生效范围、确认发布；在草稿载入入口仅对 buffet 调用迁移。第五步继续进入既有发布确认页，返回恢复第五步。

- [ ] **Step 4: 运行迁移和原有流程测试**

Run: `node scripts/verify-buffet-five-step-migration.mjs && node scripts/verify-buffet-period-scenario-editor.mjs`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add "dist/Configuration center/assets/buffet-rule-policy.js" "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-five-step-migration.mjs package.json
git commit -m "feat: migrate buffet editor to five steps"
```

### Task 2: 完善模板适用性和规则结构能力矩阵

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify: `dist/Configuration center/assets/buffet-rule-policy.js`
- Create: `scripts/verify-buffet-template-applicability.mjs`

**Interfaces:**
- Produces: `BuffetRulePolicy.templateAvailability(draft, template): { enabled, reason }`
- Produces: `BuffetRulePolicy.allowedLimitBlocks(draft, period): { total, target, sameDish, tableFallback }`

- [ ] **Step 1: 写模板与能力矩阵失败测试**

覆盖：`round-party-table-cap` 仅按人数启用；`order-round-protection` 仅菜品集启用；分类/菜品不允许单品保护；菜品集每轮允许保护；不适用模板返回中文原因。

```js
assert.equal(policy.templateAvailability({ subject: "order", targetType: "dish" }, roundParty).enabled, false);
assert.equal(policy.templateAvailability({ subject: "party_size", targetType: "dish" }, roundParty).enabled, true);
assert.equal(policy.templateAvailability({ subject: "order", targetType: "dish" }, orderRound).enabled, false);
assert.equal(policy.allowedLimitBlocks({ targetType: "dish_set", measureUnit: "piece" }, "per_round").sameDish, true);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-template-applicability.mjs`
Expected: FAIL，策略接口不存在。

- [ ] **Step 3: 扩展模板元数据并实现策略**

在 profile 模板中增加 `subjects`、`targetTypes`；在 policy 中依据对象、计量方式和周期返回允许区块。`tableFallback` 只在按人数且启用对应主区块时为真，不作为必填区块。

- [ ] **Step 4: 实现模板失效规则**

结构变更后重新校验模板：单周期不适用时返回 `custom`；多周期不适用时返回 `requiresRepair: true`，不得自动保留非法组合。

- [ ] **Step 5: 运行测试并提交**

Run: `node scripts/verify-buffet-template-applicability.mjs && npm.cmd run verify:buffet-period-selection`
Expected: PASS。

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/buffet-rule-policy.js" scripts/verify-buffet-template-applicability.mjs
git commit -m "feat: define buffet template applicability"
```

### Task 3: 将周期、模板和限制内容融合到规则类型

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Modify: `scripts/verify-buffet-period-scenario-editor.mjs`
- Create: `scripts/verify-buffet-rule-type-fusion.mjs`

**Interfaces:**
- Consumes: `templateAvailability`、`allowedLimitBlocks`、`normalizePeriodSelection`
- Produces: `renderBuffetRuleType(draft)` 和规则结构变更事件。

- [ ] **Step 1: 写规则类型页面失败测试**

断言第一步同时渲染基础信息、主体、对象、菜品集计量方式、儿童人数口径、模板、单选周期、限制内容和自然语言摘要；不再在第二步前渲染独立场景配置。

```js
const html = api.renderStepOne(draft);
assert.match(html, /常用模板/);
assert.match(html, /限制周期/);
assert.match(html, /限制内容/);
assert.match(html, /规则预览/);
assert.doesNotMatch(api.stepTitles.join("|"), /场景配置/);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-rule-type-fusion.mjs`
Expected: FAIL，第一步缺少融合区块。

- [ ] **Step 3: 合并渲染并接入条件显隐**

把现有 `renderBuffetScenarioConfiguration` 中模板、周期和周期区块迁入 buffet 的 `renderStepOne`。将“周期内限购维度”改为“限制内容”；菜品集显示按份/按种，按人数显示儿童人数口径。禁用模板保留可见并展示 `reason`。

- [ ] **Step 4: 接入结构校验和摘要**

第一步离开前校验名称、主体、对象、周期、模板适用性和区块合法性。摘要使用主体＋周期＋对象＋区块生成，组合周期明确“任一超限即拦截”。

- [ ] **Step 5: 运行页面测试并提交**

Run: `node scripts/verify-buffet-rule-type-fusion.mjs && node scripts/verify-buffet-period-scenario-editor.mjs`
Expected: PASS。

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-rule-type-fusion.mjs scripts/verify-buffet-period-scenario-editor.mjs
git commit -m "feat: fuse buffet scenario settings into rule type"
```

### Task 4: 统一稳定区间身份和历史索引键迁移

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-policy.js`
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Create: `scripts/verify-buffet-range-id-migration.mjs`

**Interfaces:**
- Produces: `BuffetRulePolicy.migrateRangeIdentities(draft): { draft, migrated, repairIssues }`
- Produces: 场景键统一为 `partyRangeId + roundRangeId`。

- [ ] **Step 1: 写历史重键失败测试**

构造两个门店、两个周期、总量/对象/整桌/保护额度均使用旧索引键的草稿；断言迁移后所有区间有唯一 ID、全部额度值不变、当前场景引用更新、重复调用不再变化。另测重复 ID、越界索引和冲突键进入修复态。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-range-id-migration.mjs`
Expected: FAIL，迁移接口不存在。

- [ ] **Step 3: 实现确定性 ID 和全量重键**

历史 ID 使用草稿身份、区间类型和原索引生成稳定字符串；已有合法 ID 原样保留。遍历所有门店和周期的 `totalBounds`、`tableTotalBounds`、`targetLimits`、`tableTargetCaps`、`defaultDishLimits`、`exceptionDishLimits` 重键。

- [ ] **Step 4: 实现修复态**

无法解析、越界、重复或目标键冲突时把问题写入 `draft.migrationIssues`，保留原始数据副本并阻止发布，不静默覆盖。

- [ ] **Step 5: 运行测试并提交**

Run: `node scripts/verify-buffet-range-id-migration.mjs && node scripts/verify-buffet-v4-validation.mjs`
Expected: PASS。

```bash
git add "dist/Configuration center/assets/buffet-rule-policy.js" "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-range-id-migration.mjs
git commit -m "feat: migrate buffet ranges to stable identities"
```

### Task 5: 将人数区间、轮次区间和数量场景融合到限购数量

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-quantity-scene-fusion.mjs`

**Interfaces:**
- Consumes: 稳定 range ID 和允许区块策略。
- Produces: `renderBuffetQuantityStep(draft)`；场景选择使用 range ID 而非索引。

- [ ] **Step 1: 写数量页面失败测试**

断言按人数＋分轮次页面依次包含上下文摘要、参与门店、人数区间、轮次区间、场景切换和数量区块；按桌规则不含人数区间，普通每轮不含轮次区间。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-quantity-scene-fusion.mjs`
Expected: FAIL，第二步尚未包含区间编辑。

- [ ] **Step 3: 合并区间和数量渲染**

把原第二步区间编辑器移入新的限购数量顶部；保留门店下拉、产线筛选、添加商品和已选商品预览。人数/轮次用 pills 切换当前稳定场景，组合周期按“整个订单→每轮/分轮次”纵向展示。

- [ ] **Step 4: 完成额度字段显隐**

按第一步区块展示总量、对象、保护额度；整桌兜底自动显示但可空，不计入完成度。最少 `0` 表示最低为零，最多/其他上限 `0` 表示禁止。

- [ ] **Step 5: 运行测试并提交**

Run: `node scripts/verify-buffet-quantity-scene-fusion.mjs && node scripts/verify-buffet-v4-validation.mjs`
Expected: PASS。

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-quantity-scene-fusion.mjs
git commit -m "feat: fuse buffet ranges into quantity step"
```

### Task 6: 实现结构变更影响预览和精确数据清理

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-policy.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Create: `scripts/verify-buffet-structure-change-impact.mjs`

**Interfaces:**
- Produces: `BuffetRulePolicy.planStructureChange(before, patch): { nextDraft, effects, requiresConfirmation }`
- Produces: `effects` 包含门店、周期、场景、商品数和额度区块。

- [ ] **Step 1: 写影响矩阵失败测试**

逐行覆盖主体双向变化、对象、周期、计量方式、限制内容、模板和参与门店。每个用例先深拷贝原草稿，断言仅调用 plan 不改变原草稿；应用确认结果后只删除规格表中的数据。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-structure-change-impact.mjs`
Expected: FAIL，影响规划接口不存在。

- [ ] **Step 3: 实现纯函数影响规划**

`planStructureChange` 先 clone，再按差异组合清理计划；模板切换拆为周期和区块差异。按桌转按人数及反向均清空全部额度但保留商品；对象变化保留总量；周期只删除被移除周期；关闭区块只删除对应额度。

- [ ] **Step 4: 接入一次确认弹窗**

事件层先调用 plan；有影响时展示统一预览，确认后替换草稿，取消只重绘。模板不适用的多周期结构先要求选择合法模板或单周期。

- [ ] **Step 5: 运行测试并提交**

Run: `node scripts/verify-buffet-structure-change-impact.mjs`
Expected: PASS。

```bash
git add "dist/Configuration center/assets/buffet-rule-policy.js" "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-structure-change-impact.mjs
git commit -m "feat: preview buffet structure change impact"
```

### Task 7: 完成历史修复、门店集合和发布校验

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-policy.js`
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `scripts/verify-buffet-v4-validation.mjs`
- Create: `scripts/verify-buffet-history-repair.mjs`
- Create: `scripts/verify-buffet-store-scope-consistency.mjs`

**Interfaces:**
- Produces: `classifyHistoricalPeriodStructure(draft)` 和 `splitRepairDraft(draft)`。
- Produces: 发布时 `deployStoreIds` 为 `participatingStoreIds` 的非空子集。

- [ ] **Step 1: 写历史修复和门店一致性失败测试**

覆盖两个合法组合、空/未知/三周期/每轮＋分轮次、模板对象不适用；断言拆分后每条草稿只保留自身周期额度。门店用例断言移除参与门店时同步删除其配置、部署集合和排除集合，取消不变。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-history-repair.mjs && node scripts/verify-buffet-store-scope-consistency.mjs`
Expected: FAIL。

- [ ] **Step 3: 实现隔离修复草稿**

已发布非法规则进入编辑时 clone 作者配置并保留原始问题；保留单周期只删除其他周期草稿额度；拆分按可识别周期生成独立草稿，共享通用条件和门店商品，不写运行快照。

- [ ] **Step 4: 收紧发布校验**

发布前重复校验周期结构、模板适用、能力矩阵、迁移问题、稳定 range ID、数量边界和门店子集。直接打开发布确认页也必须执行相同校验。

- [ ] **Step 5: 运行测试并提交**

Run: `node scripts/verify-buffet-history-repair.mjs && node scripts/verify-buffet-store-scope-consistency.mjs && npm.cmd run verify:buffet-period-selection`
Expected: PASS。

```bash
git add "dist/Configuration center/assets/buffet-rule-policy.js" "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-v4-validation.mjs scripts/verify-buffet-history-repair.mjs scripts/verify-buffet-store-scope-consistency.mjs
git commit -m "feat: validate buffet history and store scope"
```

### Task 8: 回归、构建与浏览器验收

**Files:**
- Modify: `package.json`
- Create: `scripts/verify-buffet-scene-step-fusion.mjs`
- Modify only if defects are found: files changed in Tasks 1–7

**Interfaces:**
- Produces: `npm run verify:buffet-scene-step-fusion` 作为完整专项回归入口。

- [ ] **Step 1: 建立总回归脚本**

总脚本按顺序运行 Task 1–7 的验证，并额外静态断言 buffet 五步、菜单六步、存储键隔离、发布页往返和系统默认身份转换。

- [ ] **Step 2: 运行全部专项验证**

Run: `npm.cmd run verify:buffet-scene-step-fusion`
Expected: 所有脚本 PASS。

- [ ] **Step 3: 执行完整构建**

Run: `npm.cmd run build`
Expected: TypeScript 与 Vite 构建成功。构建产生的无关哈希文件不纳入功能提交。

- [ ] **Step 4: 浏览器验收**

启动独立端口并验证：新增规则五步；第一步融合结构；第二步融合区间和额度；按桌/非分轮次条件显隐；组合模板；结构变更取消/确认；旧六步草稿六个落点；系统默认编辑；非法历史修复；发布确认往返；菜单下单限制仍为六步。

- [ ] **Step 5: 最终提交**

```bash
git add package.json scripts/verify-buffet-scene-step-fusion.mjs
git commit -m "test: cover buffet scene step fusion"
git status --short
```

Expected: 工作区干净。

## Self-Review

- Spec coverage: Tasks 1–8 覆盖五步生命周期、模板与能力矩阵、规则类型融合、数量融合、稳定区间迁移、结构变更、历史修复、门店集合、发布和菜单隔离。
- Placeholder scan: 计划不含 TBD/TODO/“稍后补充”等占位内容。
- Interface consistency: 所有策略接口均挂载在 `window.BuffetRulePolicy`；渲染层消费同一策略，不重复定义合法性。

