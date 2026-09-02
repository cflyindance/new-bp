# 自助餐整单旧 KPOS 能力覆盖 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 12 条自助餐系统默认规则不增不减的前提下，为 4 条整单默认规则补齐 KPOS-O01～O14、OV01～OV05 的可核对映射、覆盖状态、迁移兼容与专项验收。

**Architecture:** `buffet-rule-profile.js` 继续作为能力注册表、分组注册表和默认模板元数据的唯一来源；`buffet-rule.html` 只读投影能力和证据状态，不把展示元数据写入业务规则或运行快照。4 条整单模板稳定键及业务语义保持不变，只升级模板版本和目录元数据；现有冲突、草稿、启用、发布和运行引擎继续按业务字段执行。

**Tech Stack:** 原生 JavaScript IIFE、静态 HTML/CSS、localStorage repository envelope v1、Node.js `assert`/`vm` 验证脚本、Vite 生产构建。

**Spec:** `docs/superpowers/specs/2026-09-02-buffet-legacy-capability-default-catalog-design.md`

## Global Constraints

- 系统默认目录保持 4 条整单规则和 8 条每轮规则，共 12 条。
- 不新增限购主体、额度周期、限购对象或存储键。
- O08 是 `defined_extension`，不得显示为旧 KPOS 已验证能力。
- O13 是 `product_redefined`；空值可保存草稿但阻止启用/发布，0 表示禁止下单，正整数表示最大份数。
- OV01～OV05 使用 `legacyEvidenceStatus="pending_runtime"`，只展示说明，不参与完整性、冲突、启用或发布校验。
- 同功能商品重叠允许保存草稿并显示冲突，启用/发布必须阻断。
- 4 条整单规则只升级目录元数据；业务字段、草稿、发布状态、当前及历史快照必须深等值。
- 菜单下单限制不得读取或写入整单能力元数据。
- 不修改 `vendor/emenu-new`，因此不触发 eMenu 嵌入包构建要求。

## File Structure

- Modify: `dist/Configuration center/assets/buffet-rule-profile.js` — 注册 O/OV 能力、整单分组、逐模板映射和元数据原位升级。
- Modify: `dist/Configuration center/buffet-rule.html` — 根据能力与证据状态渲染整单规则行和整单分组说明。
- Modify: `dist/Configuration center/assets/order-limit-flow.css` — 复用并补齐覆盖状态、证据状态与窄屏展示样式。
- Modify: `scripts/verify-buffet-legacy-capability-catalog.mjs` — 验证 O01～O14、OV01～OV05 注册、分配和状态边界。
- Modify: `scripts/verify-buffet-default-list-ui.mjs` — 验证整单行、分组状态、未知能力降级和普通规则隔离。
- Modify: `scripts/verify-buffet-default-reconciliation.mjs` — 验证 4 条整单规则的元数据原位升级和深等值不变量。
- Create: `scripts/verify-buffet-order-capability-acceptance.mjs` — 验证 O05/O06/O08/O09/O12/O13/O14 的既有业务契约。

---

### Task 1: 注册整单能力、证据状态和分组映射

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:15-42,940-942`
- Modify: `scripts/verify-buffet-legacy-capability-catalog.mjs`

**Interfaces:**
- Produces: `moduleProfile.legacyCapabilities: Record<string, LegacyCapability>`
- Produces: `moduleProfile.legacyCapabilityGroups: LegacyCapabilityGroup[]`
- Produces: 4 条整单模板的 `legacyCapabilityIds` 与逐模板 `coverageStatus`
- Consumes: 现有 `clone`、`DEFAULT_SCENARIOS` 和 `moduleProfile` 导出机制

- [ ] **Step 1: 写整单目录失败测试**

在 `verify-buffet-legacy-capability-catalog.mjs` 增加明确断言：

```js
const orderIds = Array.from({ length: 14 }, (_, index) => `KPOS-O${String(index + 1).padStart(2, "0")}`);
const evidenceIds = Array.from({ length: 5 }, (_, index) => `KPOS-OV${String(index + 1).padStart(2, "0")}`);
for (const id of [...orderIds, ...evidenceIds]) assert.ok(profile.legacyCapabilities[id], `missing ${id}`);

const orderTemplates = profile.defaultScenarios.filter((item) => item.group === "order_lifetime");
assert.deepEqual(Array.from(orderTemplates, (item) => item.legacyCapabilityIds), [
  ["KPOS-O01", "KPOS-O05", "KPOS-O06"],
  ["KPOS-O02", "KPOS-O05", "KPOS-O07", "KPOS-O08"],
  ["KPOS-O03", "KPOS-O05", "KPOS-O06"],
  ["KPOS-O04", "KPOS-O05", "KPOS-O07", "KPOS-O08"]
]);
assert.equal(profile.legacyCapabilities["KPOS-O08"].coverageStatus, "defined_extension");
assert.equal(profile.legacyCapabilities["KPOS-O08"].legacyEvidenceStatus, "not_legacy");
assert.equal(profile.legacyCapabilities["KPOS-O13"].coverageStatus, "product_redefined");
assert.equal(evidenceIds.every((id) => profile.legacyCapabilities[id].legacyEvidenceStatus === "pending_runtime"), true);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-legacy-capability-catalog.mjs`

Expected: FAIL，当前注册表只有 KPOS-R01～R13，整单模板仍为 `legacyCapabilityIds: []`。

- [ ] **Step 3: 实现统一能力与分组注册表**

把注册项规范为以下完整形状，并逐项加入 O01～O14、OV01～OV05：

```js
function capability(id, label, group, level, coverageStatus, legacyEvidenceStatus, gap) {
  return { id, label, group, level, coverageStatus, legacyEvidenceStatus, gap: gap || "" };
}

var LEGACY_CAPABILITY_GROUPS = [
  {
    group: "order_lifetime",
    capabilityIds: ["KPOS-O09", "KPOS-O10", "KPOS-O11", "KPOS-O12", "KPOS-O13", "KPOS-O14"],
    evidenceIds: ["KPOS-OV01", "KPOS-OV02", "KPOS-OV03", "KPOS-OV04", "KPOS-OV05"]
  },
  { group: "per_round", capabilityIds: ["KPOS-R12", "KPOS-R13"], evidenceIds: [] }
];
```

4 条整单模板分别写入规格 §4.1 的 O ID，并把模板版本各自递增 1；不要改变 key、subject、targetType、measureUnit、enabledPeriods 或 blocks。

- [ ] **Step 4: 导出防变异副本并验证**

在 profile 导出对象中加入：

```js
legacyCapabilities: clone(LEGACY_CAPABILITIES),
legacyCapabilityGroups: clone(LEGACY_CAPABILITY_GROUPS)
```

测试还需修改导出副本后重新加载 profile，断言内部注册表没有被污染。

Run: `node scripts/verify-buffet-legacy-capability-catalog.mjs && node scripts/verify-buffet-default-catalog.mjs`

Expected: PASS，且默认规则总数仍为 12。

- [ ] **Step 5: 提交注册表实现**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-legacy-capability-catalog.mjs scripts/verify-buffet-default-catalog.mjs
git commit -m "feat: catalog kpos order capabilities"
```

### Task 2: 在列表展示整单规则级、分组级和待验证能力

**Files:**
- Modify: `dist/Configuration center/buffet-rule.html:26-30`
- Modify: `dist/Configuration center/assets/order-limit-flow.css` 覆盖标签与窄屏规则
- Modify: `scripts/verify-buffet-default-list-ui.mjs`

**Interfaces:**
- Consumes: Task 1 的 `legacyCapabilities`、`legacyCapabilityGroups`、模板 `legacyCapabilityIds`
- Produces: `capabilityView(record)` 的安全 HTML、状态标签与 tone
- Produces: `groupCapabilityView("order_lifetime")` 的 O09～O14 和 OV01～OV05 说明

- [ ] **Step 1: 写列表状态失败测试**

增加断言：整单行不再包含“本调研不适用”；源码包含 `defined_extension`、`product_redefined`、`pending_runtime` 三种展示映射；整单分组输出 O09～O14、OV01～OV05；OV 文案固定为“旧 KPOS 运行行为待验证；新系统已明确定义”；普通规则仍为 `—`。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-default-list-ui.mjs`

Expected: FAIL，当前 `capabilityView` 对 `order_lifetime` 直接返回“本调研不适用”。

- [ ] **Step 3: 实现状态驱动的安全渲染**

用注册表状态而非模板分组硬编码：

```js
var STATUS_VIEW = {
  complete: { label: "完整覆盖", tone: "complete" },
  partial: { label: "部分覆盖", tone: "partial" },
  product_redefined: { label: "产品重定义后覆盖", tone: "redefined" },
  defined_extension: { label: "新系统扩展定义", tone: "extension" }
};

function capabilityFor(id) {
  return profile.legacyCapabilities && profile.legacyCapabilities[id] || {
    id: id, label: id, coverageStatus: "partial", legacyEvidenceStatus: "pending_runtime"
  };
}
```

所有 label 和 ID 继续经过现有 `esc()`；未知 ID 显示 ID，不执行 HTML。规则行若包含多种状态，逐能力展示各自状态，不能把整行统一涂成“完整覆盖”。

- [ ] **Step 4: 渲染整单分组与证据说明**

从 `legacyCapabilityGroups` 查 `order_lifetime`：先显示 capabilityIds，再显示 evidenceIds。证据项固定使用非阻断说明色；不得读取或修改 rule、draft、snapshot。为 `redefined/extension/evidence` 增加可区分但不过度强调的标签样式；窄屏允许换行且不隐藏内容。

Run: `node scripts/verify-buffet-default-list-ui.mjs && node scripts/verify-buffet-rule-menu-regression.mjs`

Expected: PASS。

- [ ] **Step 5: 提交列表实现**

```bash
git add "dist/Configuration center/buffet-rule.html" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-default-list-ui.mjs
git commit -m "feat: show kpos order capability coverage"
```

### Task 3: 保证整单目录升级与既有业务契约不回归

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js` 对账与模板版本逻辑
- Modify: `scripts/verify-buffet-default-reconciliation.mjs`
- Create: `scripts/verify-buffet-order-capability-acceptance.mjs`

**Interfaces:**
- Consumes: Task 1 的 4 条整单模板新版本
- Produces: `reconcileDefaultScenarios(envelope)` 对整单规则仅执行元数据原位升级
- Verifies: O05/O06/O08/O09/O12/O13/O14 使用现有 policy/domain/profile 契约

- [ ] **Step 1: 写整单原位升级失败夹具**

构造 4 条整单系统规则，每条包含非空商品、门店、数量、active/published 状态、独立 draft、current snapshot 和 history snapshot。执行前保存：

```js
const beforeBusiness = JSON.parse(JSON.stringify({
  drafts: envelope.drafts,
  snapshots: envelope.snapshots,
  currentSnapshotId: envelope.currentSnapshotId,
  rules: envelope.rules.map(stripCatalogMetadata)
}));
```

对账后断言 rule id、`origin="system_default"`、稳定键不变，只有模板版本和目录元数据变化；`stripCatalogMetadata` 后必须与 `beforeBusiness` 深等值；执行第二次不得增加 revision 或产生重复规则。

- [ ] **Step 2: 运行迁移测试确认失败**

Run: `node scripts/verify-buffet-default-reconciliation.mjs`

Expected: FAIL，当前整单模板仍停留在旧版本或对带引用记录延迟升级。

- [ ] **Step 3: 实现整单元数据原位升级分支**

在拆分旧每轮模板的延迟/转普通逻辑之前，先按稳定键识别 4 条整单规则：

```js
if (template.group === "order_lifetime" && sameStableBusinessIdentity(rule, template)) {
  rule.origin = "system_default";
  rule.defaultScenarioKey = template.key;
  rule.defaultCatalogVersion = template.version;
  return rule;
}
```

该分支不得重建 record，不得规范化业务字段，不得修改 draft 或 snapshot；旧每轮模板仍沿用现有草稿延迟策略。

- [ ] **Step 4: 写并运行整单能力专项验收**

`verify-buffet-order-capability-acceptance.mjs` 用 `vm` 加载现有 `window.BuffetRulePolicy`、`window.BuffetRuleDomain` 和 `window.ORDER_LIMIT_MODULE_PROFILE`，建立以下可执行断言：

```js
const normalizedCategoryDraft = policy.normalizeRule(categoryExpandedDraft);
assert.deepEqual(Array.from(normalizedCategoryDraft.storeConfigs.storeA.dishTargets, (item) => item.dishId), ["dish-a", "dish-b"]); // O05

assert.equal(domain.evaluateBatch(twoDishRuleInput).violations.every((item) => item.targetId === "dish-a"), true); // O06
assert.equal(domain.evaluateBatch(crossLineDishSetInput).allowed, false);                                      // O08

assert.ok(domain.findConflict(overlapDraft, [activeRule], []));
assert.equal(profile.lifecycle.validateActivation(overlapDraft, [activeRule]).valid, false);                   // O09

assert.equal(domain.evaluateBatch(orderLifetimeAcrossRoundsInput).allowed, false);                              // O12
assert.equal(profile.lifecycle.validateActivation(blankLimitDraft, []).valid, false);                           // O13 blank
assert.equal(domain.evaluateBatch(zeroLimitInput).allowed, false);                                               // O13 zero
assert.equal(domain.evaluateBatch(orderAndRoundRuleInput).allowed, false);                                       // O14
```

`categoryExpandedDraft` 必须模拟选品完成后的真实持久化形状，只含具体 `dishId`，不保留分类节点；其余输入沿用 `verify-buffet-v4-runtime.mjs` 的真实 `evaluateBatch({ operationId, context, rules, current, additions })` 形状。不得新增只为测试服务的生产接口。

Run: `node scripts/verify-buffet-default-reconciliation.mjs && node scripts/verify-buffet-order-capability-acceptance.mjs && node scripts/verify-buffet-v4-conflicts.mjs && node scripts/verify-buffet-v4-runtime.mjs`

Expected: PASS。

- [ ] **Step 5: 提交迁移与验收实现**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-default-reconciliation.mjs scripts/verify-buffet-order-capability-acceptance.mjs
git commit -m "test: preserve kpos order capability contracts"
```

### Task 4: 全量回归、构建和浏览器核对

**Files:**
- Verify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Verify: `dist/Configuration center/buffet-rule.html`
- Verify: `dist/Configuration center/assets/order-limit-flow.css`
- Verify: `scripts/verify-buffet-*.mjs`
- Verify: `docs/superpowers/specs/2026-09-02-buffet-legacy-capability-default-catalog-design.md`

**Interfaces:**
- Consumes: Tasks 1–3 全部产物
- Produces: 可构建、可视化核对、保持菜单下单限制隔离的最终分支

- [ ] **Step 1: 运行全部自助餐专项脚本**

```powershell
Get-ChildItem scripts -Filter 'verify-buffet-*.mjs' | Sort-Object Name | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Failed: $($_.Name)" }
}
```

Expected: 全部退出 0，并输出 `OK` 或 `PASS`。

- [ ] **Step 2: 运行菜单下单限制隔离回归**

Run: `node scripts/verify-buffet-rule-menu-regression.mjs && node scripts/verify-order-limit-rule-columns.mjs && node scripts/verify-order-limit-quantity-table-simplification.mjs && node scripts/verify-order-limit-store-scope-flow.mjs`

Expected: PASS，菜单下单限制路由、存储和默认规则不包含 KPOS-O/OV 元数据。

- [ ] **Step 3: 运行生产构建**

Run: `npm.cmd run build`

Expected: exit 0，无 esbuild 重复声明、语法或 TypeScript 错误。

- [ ] **Step 4: 启动 worktree 服务并浏览器自测**

Run: `npm run dev -- --host 127.0.0.1 --port 65165`

打开：

```text
http://127.0.0.1:65165/Configuration%20center/buffet-rule.html?embedded=1
```

核对：整单 4 条、每轮 8 条；整单规则行显示 O01～O08；O08 显示“新系统扩展定义”；整单分组显示 O09～O14 和 OV01～OV05；O13 显示“产品重定义后覆盖”；OV 显示待验证且不阻止进入编辑、保存草稿、启用或发布；普通规则显示 `—`。

- [ ] **Step 5: 浏览器走查整单编辑和冲突路径**

分别编辑 4 条整单系统规则，确认六步均可操作和选品；创建同功能商品重叠草稿，确认可保存且显示冲突，启用/发布被阻止；将额度依次设为空、0、正整数，确认 O13 交互契约；返回列表确认系统默认身份仍在。

- [ ] **Step 6: 检查差异并提交最终修复**

Run: `git diff --check && git status --short`

若浏览器验证产生修复，只提交本计划涉及的文件：

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/buffet-rule.html" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-*.mjs
git commit -m "fix: complete buffet order capability coverage"
```

- [ ] **Step 7: 最终验收记录**

交付消息列出最终 commits、自助餐专项脚本数量与结果、生产构建结果、浏览器 URL、O08/O13/OV 状态边界、菜单下单限制零回归，以及未修改 `vendor/emenu-new`。
