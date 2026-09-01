# 自助餐系统默认规则全面可编辑 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 8 条自助餐系统默认规则能够完整编辑六个步骤，并在核心维度变化时通过隔离草稿安全转为普通规则。

**Architecture:** 继续复用 `order-limit-flow.js` 的共享编辑器和现有 `source rule + edit draft` 生命周期。新增基于不可变 source rule 的系统身份决策函数，所有保存入口统一调用；发布仍由现有事务替换 source rule，再由作者列表对账补齐缺失默认场景。

**Tech Stack:** 原生 JavaScript、CSS、localStorage repository、Node.js 验证脚本、Vite。

**Spec:** `docs/superpowers/specs/2026-09-01-buffet-system-default-rules-editable-design.md`

## Global Constraints

- 仅 `moduleId === "buffet-rule"` 时启用新逻辑，菜单下单限制的路由、profile、`restaurantRules`、默认规则、保存行为及运行快照必须零变化。
- 不改变 8 条默认模板、历史迁移、冲突算法、授权规则和运行时计算。
- 自动保存、手动保存、保存并返回及发布必须使用同一身份决策。
- 编辑、保存和发布失败时不得提前修改 source rule 或运行快照。
- 不修改 `vendor/emenu-new`；若执行过程中意外涉及该目录，必须按项目 `AGENTS.md` 执行嵌入包构建和产物校验。

---

## File Map

- `dist/Configuration center/assets/order-limit-flow.js`：系统默认身份解析、编辑交互、草稿保存、发布事务。
- `dist/Configuration center/assets/order-limit-flow.css`：删除只用于不可编辑默认规则的锁定视觉。
- `scripts/verify-buffet-system-default-editor.mjs`：系统身份决策、全部步骤可编辑和保存入口的静态/动态验证。
- `scripts/verify-buffet-rule-lifecycle.mjs`：source/draft/publish/reconcile 生命周期回归。
- `scripts/verify-menu-order-limit-isolation.mjs`：新增菜单模块存储及语义隔离验证。

### Task 1: 以不可变 source rule 计算系统默认身份

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:45-155`
- Modify: `scripts/verify-buffet-system-default-editor.mjs`

**Interfaces:**
- Consumes: `draft.sourceRuleId`、repository 中的正式 rules、`moduleProfile.defaultScenarios`。
- Produces: `resolveSystemDefaultSource(draft, rules)`、`normalizeBuffetPeriods(periods)`、`applySystemDefaultIdentityDecision(draft, rules)`，返回 `"preserve" | "detach" | "ordinary"`。

- [ ] **Step 1: 写失败测试，覆盖 preserve、detach、可逆恢复和身份副本清理**

在 `scripts/verify-buffet-system-default-editor.mjs` 构造一个 system-default source 和带 `sourceRuleId` 的 edit draft，断言：

```js
assert.equal(api.applySystemDefaultIdentityDecision(unchangedDraft, rules), "preserve");
assert.equal(unchangedDraft.defaultScenarioKey, source.defaultScenarioKey);

changedDraft.subject = "party_size";
assert.equal(api.applySystemDefaultIdentityDecision(changedDraft, rules), "detach");
for (const layer of [changedDraft, changedDraft.editorDraft, changedDraft.authoringDraft, changedDraft.authoringConfig]) {
  assert.equal(layer?.defaultScenarioKey, undefined);
}
assert.equal(changedDraft.sourceRuleId, source.id);

changedDraft.subject = source.subject;
changedDraft.targetType = source.targetType;
changedDraft.enabledPeriods = [...source.enabledPeriods];
assert.equal(api.applySystemDefaultIdentityDecision(changedDraft, rules), "preserve");
assert.equal(changedDraft.defaultScenarioKey, source.defaultScenarioKey);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-buffet-system-default-editor.mjs`

Expected: FAIL，提示 `applySystemDefaultIdentityDecision` 尚不存在或断言不满足。

- [ ] **Step 3: 实现统一身份决策**

在 `order-limit-flow.js` 中实现以下规则：

```js
function normalizeBuffetPeriods(periods) {
  return BUFFET_PERIOD_ORDER.filter(function (period) {
    return Array.isArray(periods) && periods.indexOf(period) >= 0;
  });
}

function resolveSystemDefaultSource(draft, rules) {
  if (!isBuffetProfile() || !draft || draft.sourceRuleId == null) return null;
  var source = rules.find(function (rule) { return String(rule.id) === String(draft.sourceRuleId); });
  return source && systemDefaultTemplate(source) ? source : null;
}

function applySystemDefaultIdentityDecision(draft, rules) {
  var source = resolveSystemDefaultSource(draft, rules);
  if (!source) return "ordinary";
  var template = systemDefaultTemplate(source);
  var same = draft.subject === template.subject &&
    draft.targetType === template.targetType &&
    JSON.stringify(normalizeBuffetPeriods(draft.enabledPeriods)) === JSON.stringify(normalizeBuffetPeriods(template.enabledPeriods));
  if (!same) {
    clearSystemDefaultIdentityLayers(draft);
    return "detach";
  }
  restoreSystemDefaultIdentityLayers(draft, source);
  return "preserve";
}
```

`clearSystemDefaultIdentityLayers` 清理顶层、`editorDraft`、`authoringDraft`、`authoringConfig`、`publishedConfig` 的 `origin/defaultScenarioKey/defaultCatalogVersion`，但保留 `sourceRuleId`；restore 只恢复作者态层，不改历史快照。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node scripts/verify-buffet-system-default-editor.mjs`

Expected: PASS，包含 detach 后改回原维度再次 preserve。

- [ ] **Step 5: 提交**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-system-default-editor.mjs
git commit -m "feat: make buffet default identity reversible"
```

### Task 2: 解锁系统默认规则六步编辑交互

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:2170-2410,4480-5120`
- Modify: `dist/Configuration center/assets/order-limit-flow.css:186-187`
- Modify: `scripts/verify-buffet-system-default-editor.mjs`

**Interfaces:**
- Consumes: Task 1 的 `applySystemDefaultIdentityDecision`。
- Produces: 默认规则与普通规则一致的主体、周期、对象、周期块、选品及数量编辑能力。

- [ ] **Step 1: 将旧锁定断言改为可编辑断言**

删除脚本中匹配事件 `return` 和 `.is-locked` 的断言，新增：

```js
assert.doesNotMatch(flowSource, /系统默认场景，规则类型不可修改/);
assert.doesNotMatch(flowSource, /isSystemDefaultDraft\(draft\) && \["subject", "period", "targetType"\]/);
assert.doesNotMatch(cssSource, /\.olf-choice\.is-locked/);
assert.match(flowSource, /规则类型已调整，保存后将转为普通规则/);
```

- [ ] **Step 2: 运行测试并确认旧锁定行为导致失败**

Run: `node scripts/verify-buffet-system-default-editor.mjs`

Expected: FAIL，仍能匹配锁定文案、样式或事件拦截。

- [ ] **Step 3: 移除锁定并增加身份变化提示**

删除系统默认专属的 disabled、`is-locked` class 和主体/周期/对象/周期块事件短路；保留现有不兼容配置二次确认。渲染时根据当前草稿与 source template 的比较显示：

```js
var defaultIdentityStatus = previewSystemDefaultIdentityDecision(draft, currentRules());
var identityHint = defaultIdentityStatus === "detach"
  ? "规则类型已调整，保存后将转为普通规则"
  : defaultIdentityStatus === "preserve" ? "系统默认规则" : "";
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `node scripts/verify-buffet-system-default-editor.mjs`

Expected: PASS，六步控件无系统默认专属禁用和事件拦截。

- [ ] **Step 5: 提交**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-system-default-editor.mjs
git commit -m "feat: unlock buffet system default editor"
```

### Task 3: 接入所有保存入口并保持草稿隔离

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:2025-2065,5780-5875`
- Modify: `scripts/verify-buffet-system-default-editor.mjs`
- Modify: `scripts/verify-buffet-rule-lifecycle.mjs`

**Interfaces:**
- Consumes: `applySystemDefaultIdentityDecision(draft, rules)`。
- Produces: `prepareDraftForSave(draft, rules)`，供自动保存、手动保存、保存并返回和发布前统一调用。

- [ ] **Step 1: 写失败测试验证四个入口与失败隔离**

新增静态断言：

```js
assert.match(flowSource, /function prepareDraftForSave\(draft, rules\)/);
assert.match(flowSource, /function saveEditorDraft[\s\S]*prepareDraftForSave/);
assert.match(flowSource, /function publishDraft[\s\S]*prepareDraftForSave/);
```

生命周期测试额外断言：autosave detach 后 source rule 不变；discard 删除 draft；改回核心维度再次 autosave 恢复身份。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-buffet-system-default-editor.mjs && node scripts/verify-buffet-rule-lifecycle.mjs`

Expected: FAIL，统一保存处理尚未接入。

- [ ] **Step 3: 实现保存前克隆处理**

```js
function prepareDraftForSave(draft, rules) {
  var next = cloneValue(draft);
  applySystemDefaultIdentityDecision(next, rules);
  return next;
}
```

让 `saveEditorDraft(false/true)`、保存并返回和发布前验证都使用 prepared clone；仅持久化成功后替换 `editorState.rule.editorDraft`，捕获异常时保留内存草稿、source rule 和 runtime snapshot 原值。放弃编辑只删除 edit draft。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node scripts/verify-buffet-system-default-editor.mjs && node scripts/verify-buffet-rule-lifecycle.mjs`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-system-default-editor.mjs scripts/verify-buffet-rule-lifecycle.mjs
git commit -m "feat: isolate buffet default edit drafts"
```

### Task 4: 发布普通化规则并补回原默认场景

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:5940-6020`
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:120-180`
- Modify: `scripts/verify-buffet-rule-lifecycle.mjs`
- Modify: `scripts/verify-buffet-system-default-reconciliation.mjs`

**Interfaces:**
- Consumes: prepared draft、现有 `repository.loadForAuthoringList` 对账入口。
- Produces: 原子发布语义；成功后普通正式规则无系统身份，下一次作者列表加载只补一条禁用空白默认规则。

- [ ] **Step 1: 写发布成功、失败和幂等失败测试**

测试固定断言：

```js
assert.equal(published.origin, undefined);
assert.equal(published.publishedConfig?.defaultScenarioKey, undefined);
assert.equal(afterPublishBeforeList.filter(hasOriginalDefaultKey).length, 0);
assert.equal(afterFirstAuthoringLoad.filter(hasOriginalDefaultKey).length, 1);
assert.equal(afterSecondAuthoringLoad.filter(hasOriginalDefaultKey).length, 1);
assert.equal(restoredDefault.status, "disabled");
```

再模拟 publish 抛错，断言 source rule、rules storage 和 runtime snapshot 与操作前深相等。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-buffet-rule-lifecycle.mjs && node scripts/verify-buffet-system-default-reconciliation.mjs`

Expected: FAIL，当前发布/补齐时序不满足全部断言。

- [ ] **Step 3: 调整发布事务与对账占位判断**

发布时先在内存生成完整 next rules 和 next snapshot，验证成功后一次写入；普通化正式规则及新 `publishedConfig` 清除身份。对账占位只认正式 system-default rule：

```js
function occupiesDefaultScenario(rule, key) {
  return rule && rule.origin === "system_default" && rule.defaultScenarioKey === key;
}
```

不得把普通规则、普通草稿、历史 snapshot 或 `sourceRuleId` 视为占位项；对账仍只在 `loadForAuthoringList` 调用。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node scripts/verify-buffet-rule-lifecycle.mjs && node scripts/verify-buffet-system-default-reconciliation.mjs`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-rule-lifecycle.mjs scripts/verify-buffet-system-default-reconciliation.mjs
git commit -m "feat: reconcile detached buffet defaults after publish"
```

### Task 5: 菜单模块隔离与全量回归

**Files:**
- Create: `scripts/verify-menu-order-limit-isolation.mjs`
- Modify: `scripts/verify-buffet-system-default-editor.mjs`

**Interfaces:**
- Consumes: 完成后的共享编辑器、两个 module profile 和各自 storage key。
- Produces: 可重复执行的隔离回归脚本及浏览器验收记录。

- [ ] **Step 1: 写菜单隔离测试**

测试加载菜单 profile，保存普通菜单规则前后采集：

```js
const before = structuredClone({
  restaurantRules: storage.restaurantRules,
  buffetRules: storage.buffetRules,
  route: menuProfile.routes,
  defaults: menuProfile.defaultScenarios
});
// 执行菜单规则保存与重新加载
assert.deepEqual(storage.buffetRules, before.buffetRules);
assert.deepEqual(menuProfile.routes, before.route);
assert.deepEqual(menuProfile.defaultScenarios, before.defaults);
```

并断言 buffet 身份处理对 `moduleId: "menu-order-limit"` 返回 `ordinary` 且不写任何字段。

- [ ] **Step 2: 运行隔离测试并确认其可识别越界写入**

Run: `node scripts/verify-menu-order-limit-isolation.mjs`

Expected: 首次因测试夹具或导出尚未接入而 FAIL；接入共享脚本测试 API 后能够明确检测 storage 变化。

- [ ] **Step 3: 仅补测试导出和隔离保护**

通过现有 `window.__ORDER_LIMIT_TEST_API__` 暴露必要纯函数；所有身份处理函数首行保留：

```js
if (!isBuffetProfile()) return "ordinary";
```

不得改变菜单 profile、存储键或路由。

- [ ] **Step 4: 运行所有相关验证与构建**

Run:

```bash
node scripts/verify-buffet-system-default-editor.mjs
node scripts/verify-buffet-rule-lifecycle.mjs
node scripts/verify-buffet-system-default-reconciliation.mjs
node scripts/verify-menu-order-limit-isolation.mjs
npm.cmd run build
```

Expected: 全部脚本 PASS，Vite build 成功退出。

- [ ] **Step 5: 启动 worktree 服务并完成浏览器验收**

Run: `npm run dev -- --host 127.0.0.1 --port 65164`

在浏览器逐项验证：8 条默认规则均能编辑六步；修改非核心字段仍保留默认身份；修改核心字段保存返回时同时出现原默认和普通草稿；发布后普通规则进入“其他规则”，原分组补回一条禁用未配置规则；刷新不重复补齐；菜单下单限制编辑保存无变化。

- [ ] **Step 6: 提交**

```bash
git add scripts/verify-menu-order-limit-isolation.mjs scripts/verify-buffet-system-default-editor.mjs
git commit -m "test: cover editable buffet defaults end to end"
```
