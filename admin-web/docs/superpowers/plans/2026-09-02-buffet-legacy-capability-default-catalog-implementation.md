# 自助餐旧 KPOS 能力默认规则目录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将自助餐系统默认目录扩展为 12 条规则，并在列表中明确展示 KPOS-R01～R13 与新规则的完整/部分覆盖关系，同时保证编辑、冲突、迁移和运行行为一致。

**Architecture:** 以 `buffet-rule-profile.js` 作为默认模板与旧能力注册表的唯一来源，列表仅消费只读目录元数据，运行时仍消费标准业务字段。迁移在 repository 锁内完成，对有草稿或快照引用的记录延迟处理；冲突口径由业务字段推导，不依赖系统默认身份。

**Tech Stack:** 原生 JavaScript IIFE、HTML/CSS、localStorage repository、Node.js `assert` 验证脚本、Vite 生产构建。

**Spec:** `docs/superpowers/specs/2026-09-02-buffet-legacy-capability-default-catalog-design.md`

## Global Constraints

- 系统默认目录固定为 4 条整单规则和 8 条每轮规则，共 12 条。
- KPOS-R01～R11 标记完整覆盖；KPOS-R12、KPOS-R13 只能标记部分覆盖。
- 本期不改变现有限购主体、额度周期、限购对象，不给按桌每轮规则新增人数区间。
- 4 条整单默认规则在本次每轮调研列中显示“本调研不适用”。
- 能力文案只存于统一注册表；模板仅保存 `legacyCapabilityIds`。
- `defaultVariant` 只用于目录身份和展示，不进入运行快照或冲突键。
- 菜品集按份与按种允许共同发布；同口径成员重叠继续阻断。
- 有独立草稿或 `sourceRuleId` 引用时延迟迁移，不修改 source rule、草稿或身份。
- 不修改 `vendor/emenu-new`；因此不触发 eMenu 嵌入包构建要求。

## File Structure

- Modify: `dist/Configuration center/assets/buffet-rule-profile.js` — 能力注册表、12 条模板、模板身份、迁移与对账。
- Modify: `dist/Configuration center/assets/order-limit-flow.js` — 默认映射列表、分组差距说明、模板核心维度编辑转换。
- Modify: `dist/Configuration center/assets/order-limit-flow.css` — 映射列、覆盖标签、窄屏布局。
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js` — 从业务字段推导约束口径并调整冲突矩阵。
- Modify: `scripts/verify-buffet-default-catalog.mjs` — 12 条目录及逐模板映射。
- Modify: `scripts/verify-buffet-default-list-ui.mjs` — 列表映射、覆盖标签、普通规则隔离。
- Modify: `scripts/verify-buffet-default-reconciliation.mjs` — 旧目录迁移、草稿延迟、快照不变量和幂等。
- Modify: `scripts/verify-buffet-system-default-editor.mjs` — 模板身份保留、detach、恢复。
- Modify: `scripts/verify-buffet-v4-conflicts.mjs` — 按份/按种叠加与同口径阻断。
- Create: `scripts/verify-buffet-legacy-capability-catalog.mjs` — KPOS-R01～R13 覆盖矩阵和元数据注册表验证。

---

### Task 1: 建立旧能力注册表与 12 条默认模板

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:13-25`
- Modify: `scripts/verify-buffet-default-catalog.mjs`
- Create: `scripts/verify-buffet-legacy-capability-catalog.mjs`

**Interfaces:**
- Produces: `moduleProfile.defaultScenarios: DefaultScenarioTemplate[]`
- Produces: `moduleProfile.legacyCapabilities: Record<string, { id, label, coverageStatus, level, gap? }>`
- Produces: 每个模板的 `defaultVariant`、`measureUnit`、`legacyCapabilityIds`、`coverageStatus`

- [ ] **Step 1: 写目录失败测试**

在 `verify-buffet-default-catalog.mjs` 断言：

```js
assert.equal(profile.defaultScenarios.length, 12);
assert.deepEqual(
  profile.defaultScenarios.filter((item) => item.group === "per_round").map((item) => item.key),
  [
    "order|per_round|total", "party_size|per_round|total",
    "order|per_round|dish", "party_size|per_round|dish",
    "order|per_round|dish_set|piece", "party_size|per_round|dish_set|piece",
    "order|per_round|dish_set|kind", "party_size|per_round|dish_set|kind"
  ]
);
```

新脚本逐项断言 R01～R11 至少被一个模板引用，R12/R13 是 `level: "group"`、`coverageStatus: "partial"`，4 条整单模板 ID 数组为空。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-default-catalog.mjs && node scripts/verify-buffet-legacy-capability-catalog.mjs`

Expected: FAIL，当前只有 8 条模板或新脚本缺少注册表导出。

- [ ] **Step 3: 实现唯一能力注册表和模板目录**

在 profile 顶部定义：

```js
var LEGACY_CAPABILITIES = {
  "KPOS-R01": { id: "KPOS-R01", label: "每轮菜品总数最少/最多", coverageStatus: "complete", level: "rule" },
  "KPOS-R02": { id: "KPOS-R02", label: "每人每轮菜品总数最少/最多", coverageStatus: "complete", level: "rule" },
  "KPOS-R03": { id: "KPOS-R03", label: "人均总量之外设置整桌每轮兜底", coverageStatus: "complete", level: "rule" },
  "KPOS-R04": { id: "KPOS-R04", label: "每轮指定菜品最多份数", coverageStatus: "complete", level: "rule" },
  "KPOS-R05": { id: "KPOS-R05", label: "每人每轮指定菜品最多份数", coverageStatus: "complete", level: "rule" },
  "KPOS-R06": { id: "KPOS-R06", label: "每轮指定菜品集最多总份数", coverageStatus: "complete", level: "rule" },
  "KPOS-R07": { id: "KPOS-R07", label: "每人每轮指定菜品集最多总份数", coverageStatus: "complete", level: "rule" },
  "KPOS-R08": { id: "KPOS-R08", label: "每轮指定菜品集最多菜品种数", coverageStatus: "complete", level: "rule" },
  "KPOS-R09": { id: "KPOS-R09", label: "每人每轮指定菜品集最多菜品种数", coverageStatus: "complete", level: "rule" },
  "KPOS-R10": { id: "KPOS-R10", label: "菜品集按份时限制相同菜品每轮最大份数", coverageStatus: "complete", level: "rule" },
  "KPOS-R11": { id: "KPOS-R11", label: "菜品集按种时限制每种菜品最大份数", coverageStatus: "complete", level: "rule" },
  "KPOS-R12": { id: "KPOS-R12", label: "同一人数区间混合配置每轮、每人每轮规则", coverageStatus: "partial", level: "group", gap: "按桌每轮固定额度不能按人数区间变化" },
  "KPOS-R13": { id: "KPOS-R13", label: "不同人数区间使用不同总量和指定对象额度", coverageStatus: "partial", level: "group", gap: "按人数规则使用人均额度乘有效人数，不能表达区间内固定整桌额度" }
};
```

将 `DEFAULT_SCENARIOS` 替换为规格 §3 和 §4.1 的 12 条模板。总量模板使用 `targetType: "dish"`、`targetEnabled: false`；菜品集键显式包含 `piece/kind`。

- [ ] **Step 4: 导出只读副本并运行测试**

在 profile 导出对象中增加：

```js
legacyCapabilities: clone(LEGACY_CAPABILITIES),
defaultScenarios: clone(DEFAULT_SCENARIOS)
```

Run: `node scripts/verify-buffet-default-catalog.mjs && node scripts/verify-buffet-legacy-capability-catalog.mjs`

Expected: PASS。

- [ ] **Step 5: 提交目录实现**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-default-catalog.mjs scripts/verify-buffet-legacy-capability-catalog.mjs
git commit -m "feat: expand buffet default capability catalog"
```

### Task 2: 用模板注册表校验系统默认身份

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:102-125,330-360,650-715`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:42-80`
- Modify: `scripts/verify-buffet-system-default-editor.mjs`

**Interfaces:**
- Produces: `templateForIdentity(rule): DefaultScenarioTemplate | null`
- Produces: `matchesTemplateCore(draft, template): boolean`
- Consumes: Task 1 的 `DEFAULT_SCENARIOS`

- [ ] **Step 1: 写身份失败测试**

增加以下断言：按份模板改为 `kind` 后 editor draft 清除系统身份；总量模板打开 `targetEnabled` 后清除身份；恢复模板核心字段后从不可变 source template 恢复身份；只改数量、商品、门店时保留身份。

```js
draft.measureUnit = "kind";
api.reconcileDefaultIdentity(draft, source);
assert.equal(draft.defaultScenarioKey, undefined);
draft.measureUnit = "piece";
api.reconcileDefaultIdentity(draft, source);
assert.equal(draft.defaultScenarioKey, "order|per_round|dish_set|piece");
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-system-default-editor.mjs`

Expected: FAIL，旧逻辑只校验三段 key 和全局版本。

- [ ] **Step 3: 实现模板精确匹配**

删除 `parts.length === 3` 和全局版本等价判断，改为：

```js
function templateForIdentity(rule) {
  var identity = systemIdentity(rule);
  return DEFAULT_SCENARIOS.find(function (template) {
    return identity.origin === "system_default" && identity.key === template.key && identity.version === template.version;
  }) || null;
}
```

实现 `matchesTemplateCore`，比较 `subject`、规范化 `enabledPeriods`、`targetType`、菜品集 `measureUnit` 及模板周期的三个 blocks。创建规则时使用 `scenario.version`，不再写全局 `DEFAULT_CATALOG_VERSION`。

- [ ] **Step 4: 更新编辑器 detach/恢复并验证**

`order-limit-flow.js` 的系统身份同步通过 `moduleProfile.defaultScenarios` 查不可变模板；核心字段偏离时清除所有作者副本身份，恢复时从 source rule 原模板键恢复。

Run: `node scripts/verify-buffet-system-default-editor.mjs && node scripts/verify-buffet-default-scenario-lifecycle.mjs`

Expected: PASS。

- [ ] **Step 5: 提交身份实现**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-system-default-editor.mjs
git commit -m "feat: validate buffet default template identity"
```

### Task 3: 支持总量规则无商品配置与模板化编辑器

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:510-565,650-715`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:2260-2360,3800-4220`
- Modify: `scripts/verify-buffet-default-scenario-rules.mjs`
- Modify: `scripts/verify-buffet-v4-validation.mjs`
- Modify: `scripts/verify-buffet-v4-runtime.mjs`

**Interfaces:**
- Consumes: Task 1 的 `defaultVariant` 和 blocks
- Produces: 总量模板可在 `targetEnabled=false` 且无商品时完成六步保存、发布和运行

- [ ] **Step 1: 写总量规则失败测试**

构造 `order|per_round|total`，不提供 `storeConfigs[*].dishTargets`，仅设置 `periodValues.per_round.totalLimits`，断言 validation 成功；运行时断言当前轮全部有效菜品计数受到最大值约束，最小值仅提交轮次时校验。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-default-scenario-rules.mjs && node scripts/verify-buffet-v4-validation.mjs && node scripts/verify-buffet-v4-runtime.mjs`

Expected: FAIL，当前 target block 被强制开启或要求选品。

- [ ] **Step 3: 保留模板 blocks 并放开无商品校验**

移除编辑器中“启用周期即强制 `targetEnabled=true`”的归一化；仅当 `blocks.targetEnabled` 为 true 时验证商品范围和目标数量矩阵。总量模板仍要求至少一个生效门店及对应总量上下限。

- [ ] **Step 4: 按模板初始化编辑器并验证**

创建总量、指定菜品、菜品集按份、菜品集按种草稿时直接复制模板 blocks 与 `measureUnit`。指定菜品模板不得默认附带总量区块。

Run: `node scripts/verify-buffet-default-scenario-rules.mjs && node scripts/verify-buffet-v4-validation.mjs && node scripts/verify-buffet-v4-runtime.mjs`

Expected: PASS。

- [ ] **Step 5: 提交编辑行为**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-default-scenario-rules.mjs scripts/verify-buffet-v4-validation.mjs scripts/verify-buffet-v4-runtime.mjs
git commit -m "feat: support buffet round total default rules"
```

### Task 4: 展示旧 KPOS 能力映射与覆盖差距

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js` 列表渲染函数
- Modify: `dist/Configuration center/assets/order-limit-flow.css` 默认列表样式
- Modify: `scripts/verify-buffet-default-list-ui.mjs`

**Interfaces:**
- Consumes: `moduleProfile.defaultScenarios`、`moduleProfile.legacyCapabilities`
- Produces: 列 `对应新默认规则｜旧 KPOS 调研能力｜计算方式｜生效门店｜覆盖结果｜状态｜操作`

- [ ] **Step 1: 写列表失败测试**

断言 HTML 源码包含 `旧 KPOS 调研能力`、`覆盖结果`、`本调研不适用`、`完整覆盖`、`部分覆盖`；断言普通规则分支输出 `—`，分组说明包含 R12/R13 gap。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-default-list-ui.mjs`

Expected: FAIL，当前列表没有能力映射列。

- [ ] **Step 3: 实现安全的只读映射渲染**

增加：

```js
function defaultCapabilityView(rule) {
  var template = defaultTemplate(rule);
  if (!template) return { capabilities: ["—"], status: "—", tone: "plain" };
  if (template.group === "order_lifetime") return { capabilities: ["本调研不适用"], status: "本调研不适用", tone: "muted" };
  return {
    capabilities: template.legacyCapabilityIds.map(function (id) { return moduleProfile.legacyCapabilities[id]; }),
    status: "完整覆盖",
    tone: "complete"
  };
}
```

未知 ID 显示 ID 本身；开发验证脚本对未知 ID 失败。列表不把元数据写回规则。

- [ ] **Step 4: 实现分组说明与窄屏样式**

每轮分组标题下展示 R12/R13 两条橙色“部分覆盖”和 gap；窄屏把映射内容移到规则名下，不能 `display:none`。

Run: `node scripts/verify-buffet-default-list-ui.mjs && node scripts/verify-buffet-rule-menu-regression.mjs`

Expected: PASS。

- [ ] **Step 5: 提交列表实现**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-default-list-ui.mjs
git commit -m "feat: show buffet legacy capability coverage"
```

### Task 5: 让冲突规则按业务口径叠加

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js:180-300`
- Modify: `scripts/verify-buffet-v4-conflicts.mjs`

**Interfaces:**
- Produces: `constraintTypes(rule, period): string[]`
- Consumes: 运行字段 `periodPolicies[*].blocks`、`targetType`、`measureUnit`

- [ ] **Step 1: 写冲突矩阵失败测试**

断言同门店、同主体、同周期、相同菜品集成员的 piece 与 kind 两条规则 `findConflict(...) === null`；两条 piece 规则仍返回 `DISH_SET_MEMBER_OVERLAP`；总量与指定菜品可叠加；两个相同总量规则返回重复冲突。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-v4-conflicts.mjs`

Expected: FAIL，当前菜品集只按成员重叠阻断。

- [ ] **Step 3: 推导规范约束类型**

实现：

```js
function constraintTypes(rule, period) {
  var blocks = rule.periodPolicies && rule.periodPolicies[period] && rule.periodPolicies[period].blocks || {};
  var result = [];
  if (blocks.totalEnabled) result.push("total");
  if (blocks.targetEnabled) result.push(rule.targetType === "dish_set" ? "dish_set_" + (rule.measureUnit === "kind" ? "kind" : "piece") : "dish");
  if (blocks.sameDishEnabled) result.push("same_dish");
  return result;
}
```

只有共同约束类型才进入相应重复/成员重叠判断；不得读取 `origin`、`defaultScenarioKey` 或 `defaultVariant`。

- [ ] **Step 4: 运行冲突和运行时回归**

Run: `node scripts/verify-buffet-v4-conflicts.mjs && node scripts/verify-buffet-v4-runtime.mjs && node scripts/verify-buffet-rule-conflicts.mjs`

Expected: PASS。

- [ ] **Step 5: 提交冲突实现**

```bash
git add "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-v4-conflicts.mjs
git commit -m "feat: separate buffet constraint conflict scopes"
```

### Task 6: 安全迁移旧默认目录并延迟有草稿记录

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:120-450`
- Modify: `scripts/verify-buffet-default-reconciliation.mjs`
- Modify: `scripts/verify-buffet-default-scenario-lifecycle.mjs`

**Interfaces:**
- Produces: `hasDraftReference(envelope, ruleId): boolean`
- Produces: 锁内、幂等的 `reconcileDefaultScenarios(envelope)`
- Consumes: Task 1 的模板注册表和 Task 2 的精确身份

- [ ] **Step 1: 建立迁移夹具和失败断言**

覆盖：空白旧总量+菜品组合、已配置组合、按份、按种、未知单位、active、published、当前/历史 snapshot、独立草稿、重复候选。每组保存迁移前业务 JSON，断言规则数、稳定键、草稿、快照和 `currentSnapshotId`。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-default-reconciliation.mjs && node scripts/verify-buffet-default-scenario-lifecycle.mjs`

Expected: FAIL，旧对账只识别 8 条和三段键，且未扫描 envelope drafts。

- [ ] **Step 3: 实现草稿/引用扫描和延迟迁移**

```js
function hasDraftReference(envelope, ruleId) {
  return (envelope.drafts || []).some(function (draft) {
    return String(draft.sourceRuleId || "") === String(ruleId) || String(draft.ruleId || "") === String(ruleId);
  });
}
```

有草稿或反向引用时原样保留 source rule 和 draft，不补语义冲突的新模板。无草稿时才根据业务数据选择原位升级或 strip identity 后补齐。

- [ ] **Step 4: 保留 4 条整单身份并验证原子幂等**

4 条整单只升级各自模板版本/目录身份。对 envelope 连续执行两次，第二次必须不增加 revision 或规则数；模拟同 revision 重复提交，沿用 repository revision conflict，不能留下半迁移数据。

Run: `node scripts/verify-buffet-default-reconciliation.mjs && node scripts/verify-buffet-default-scenario-lifecycle.mjs`

Expected: PASS。

- [ ] **Step 5: 提交迁移实现**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-default-reconciliation.mjs scripts/verify-buffet-default-scenario-lifecycle.mjs
git commit -m "feat: migrate buffet default catalog safely"
```

### Task 7: 完整回归、浏览器确认与文档收口

**Files:**
- Verify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Verify: `dist/Configuration center/assets/buffet-rule-domain.js`
- Verify: `dist/Configuration center/assets/order-limit-flow.js`
- Verify: `dist/Configuration center/assets/order-limit-flow.css`
- Verify: `scripts/verify-buffet-*.mjs`
- Verify: `docs/superpowers/specs/2026-09-02-buffet-legacy-capability-default-catalog-design.md`

**Interfaces:**
- Consumes: Tasks 1–6 全部产物
- Produces: 可构建、可在浏览器核对的最终分支

- [ ] **Step 1: 运行全部自助餐专项测试**

Run:

```powershell
Get-ChildItem scripts -Filter 'verify-buffet-*.mjs' | Sort-Object Name | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw "Failed: $($_.Name)" } }
```

Expected: 每个脚本输出 `OK` 或 `PASS`，进程退出 0。

- [ ] **Step 2: 运行菜单下单限制隔离回归**

Run: `node scripts/verify-buffet-rule-menu-regression.mjs && node scripts/verify-order-limit-rule-columns.mjs && node scripts/verify-order-limit-quantity-table-simplification.mjs && node scripts/verify-order-limit-store-scope-flow.mjs`

Expected: PASS；菜单下单限制存储键、默认规则和页面行为不读取旧能力元数据。

- [ ] **Step 3: 运行生产构建**

Run: `npm.cmd run build`

Expected: exit 0；无 esbuild 重复声明或语法错误。

- [ ] **Step 4: 启动 worktree 本地服务并浏览器核对**

Run: `npm run dev -- --host 127.0.0.1 --port 65165`

在浏览器打开：

```text
http://127.0.0.1:65165/Configuration%20center/buffet-rule.html?embedded=1
```

核对：整单 4 条、每轮 8 条；R01～R11 完整覆盖；R12/R13 部分覆盖；整单显示本调研不适用；普通规则显示 `—`；进入总量规则可以不选商品完成六步；按份/按种可分别配置。

- [ ] **Step 5: 检查差异并提交最终修复**

Run: `git diff --check && git status --short`

如浏览器验证产生代码修复，仅提交本计划涉及的文件：

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/buffet-rule-domain.js" "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-*.mjs
git commit -m "test: verify buffet legacy capability catalog"
```

- [ ] **Step 6: 最终验收记录**

在交付消息中列出：最终 commit、专项脚本数量及结果、构建结果、浏览器 URL、R12/R13 的部分覆盖限制，以及未修改 `vendor/emenu-new` 的事实。
