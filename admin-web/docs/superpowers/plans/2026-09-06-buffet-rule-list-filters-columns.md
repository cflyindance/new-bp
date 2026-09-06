# 自助餐规则列表筛选与表头 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为自助餐规则列表补齐业务筛选、高级筛选、七列默认表头和可持久化字段设置，同时保持现有分组与规则操作不变。

**Architecture:** 新增一个无 DOM 依赖的 UMD 列表投影模块，集中完成规则归一化、筛选、分组、字段投影和字段偏好校验；列表 HTML 只维护交互状态并消费投影结果。门店目录抽成独立共享资产，由列表和现有编辑器共同读取，验证脚本直接加载纯函数模块覆盖历史数据兼容边界。

**Tech Stack:** 原生 HTML/CSS/JavaScript、浏览器 `localStorage`、Node.js `vm`/`assert` 验证脚本、现有 `BuffetRuleProfile` 与规则仓库。

**Spec:** `docs/superpowers/specs/2026-09-06-buffet-rule-list-filters-columns-design.md`

## Global Constraints

- 不改变规则编辑、保存、校验、启禁用和发布逻辑。
- 继续保留“整单限制”“每轮常用组合模板”“每轮原子规则”三个主分组，仅有无法归类的数据时显示“其他规则”。
- 所有列表归一化、筛选和字段投影均为只读，不得回写规则配置对象。
- 门店筛选使用生效门店；商品范围和数量完成度对草稿可按规格回退参与门店。
- 自助餐字段偏好固定使用 `{ version: 1, visible: string[] }`，存储键为 `buffet-rule:rule-list-columns:v1`。
- 固定字段为规则名称、状态、操作，不能隐藏。
- 不修改或提交当前 worktree 中无关的薪资文件和 `dist/assets` 构建产物。

---

## File Structure

- Create: `dist/Configuration center/assets/order-limit-store-catalog.js` — 唯一门店目录，向浏览器导出 `window.OrderLimitStoreCatalog`。
- Create: `dist/Configuration center/assets/buffet-rule-list-view.js` — 纯列表视图模型、筛选、分组、列定义和字段投影。
- Create: `scripts/verify-buffet-rule-list-view.mjs` — 使用 Node `vm` 加载浏览器资产并执行规格中的验收数据矩阵。
- Modify: `dist/Configuration center/assets/order-limit-flow.js` — 删除私有门店常量，改为读取共享门店目录。
- Modify: `dist/Configuration center/buffet-rule-editor.html` — 在编辑器流程前加载共享门店目录。
- Modify: `dist/Configuration center/buffet-rule-publish-confirm.html` — 在发布确认流程前加载共享门店目录。
- Modify: `dist/Configuration center/order-limit-rule-editor.html` — 菜单下单限制编辑器继续通过共享目录使用原门店数据。
- Modify: `dist/Configuration center/order-limit-publish-confirm.html` — 菜单下单限制发布确认页加载共享目录。
- Modify: `dist/Configuration center/order-limit-store-select.html` — 历史门店选择页加载共享目录，避免迁移后缺少数据。
- Modify: `dist/Configuration center/buffet-rule.html` — 接入共享目录与列表视图模块，实现筛选、字段设置和动态表格。
- Modify: `package.json` — 增加 `verify:buffet-rule-list` 命令。

### Task 1: 共享门店目录

**Files:**

- Create: `dist/Configuration center/assets/order-limit-store-catalog.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/buffet-rule-editor.html`
- Modify: `dist/Configuration center/buffet-rule-publish-confirm.html`
- Modify: `dist/Configuration center/order-limit-rule-editor.html`
- Modify: `dist/Configuration center/order-limit-publish-confirm.html`
- Modify: `dist/Configuration center/order-limit-store-select.html`
- Test: `scripts/verify-buffet-rule-list-view.mjs`

**Interfaces:**

- Produces: `window.OrderLimitStoreCatalog: Array<{id:string,name:string,mid:string,zone:string,address:string,order:number}>`。
- Consumes: 编辑器原有门店数据及 `order-limit-flow.js` 中所有使用门店目录的函数。

- [ ] **Step 1: 写共享目录失败验证**

在 `scripts/verify-buffet-rule-list-view.mjs` 中创建浏览器脚本加载器，并断言目录存在、ID 唯一、`order` 唯一且升序后稳定：

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function loadBrowserAsset(path, seed = {}) {
  const context = vm.createContext({ window: seed, console });
  vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
  return context.window;
}

const catalogWindow = loadBrowserAsset("dist/Configuration center/assets/order-limit-store-catalog.js");
const stores = Array.from(catalogWindow.OrderLimitStoreCatalog || []);
assert.ok(stores.length > 0);
assert.equal(new Set(stores.map((store) => store.id)).size, stores.length);
assert.deepEqual(stores.map((store) => store.order), [...stores].sort((a, b) => a.order - b.order).map((store) => store.order));
```

- [ ] **Step 2: 运行验证并确认失败**

Run: `node scripts/verify-buffet-rule-list-view.mjs`

Expected: FAIL，提示 `order-limit-store-catalog.js` 不存在或 `OrderLimitStoreCatalog` 为空。

- [ ] **Step 3: 创建共享目录并迁移编辑器引用**

从 `order-limit-flow.js` 原有目录逐项迁移，保持 ID、名称、MID、区域与地址不变，仅补稳定 `order`。资产采用冻结副本，避免调用方修改全局源数据：

```js
(function () {
  "use strict";
  var stores = [
    { id: "ny-midtown", name: "纽约中城店", mid: "100001", zone: "America/New_York", address: "349 5th Ave, New York, NY 10016, USA", order: 1 },
    { id: "flushing", name: "法拉盛店", mid: "100002", zone: "America/New_York", address: "39-16 Prince St, Flushing, NY 11354, USA", order: 2 },
    { id: "brooklyn", name: "布鲁克林店", mid: "100003", zone: "America/New_York", address: "445 Albee Square W, Brooklyn, NY 11201, USA", order: 3 },
    { id: "boston", name: "波士顿店", mid: "100004", zone: "America/New_York", address: "1 Washington Mall, Boston, MA 02108, USA", order: 4 }
  ];
  window.OrderLimitStoreCatalog = stores.map(function (store) {
    return Object.freeze(Object.assign({}, store));
  });
})();
```

在所有五个加载 `order-limit-flow.js` 的页面中，将 `<script src="assets/order-limit-store-catalog.js"></script>` 放在流程脚本之前；`order-limit-flow.js` 使用 `(window.OrderLimitStoreCatalog || []).map(...)` 取得工作副本，并移除原私有目录与 `storeAddresses` 常量。

- [ ] **Step 4: 运行目录验证和项目构建**

Run: `node scripts/verify-buffet-rule-list-view.mjs`

Expected: PASS 共享目录断言。

Run: `npm.cmd run build`

Expected: 成功退出，页面资产复制流程无缺失脚本错误。

- [ ] **Step 5: 提交共享目录**

```bash
git add "dist/Configuration center/assets/order-limit-store-catalog.js" "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/buffet-rule-editor.html" "dist/Configuration center/buffet-rule-publish-confirm.html" "dist/Configuration center/order-limit-rule-editor.html" "dist/Configuration center/order-limit-publish-confirm.html" "dist/Configuration center/order-limit-store-select.html" scripts/verify-buffet-rule-list-view.mjs
git commit -m "refactor: share order limit store catalog"
```

### Task 2: 只读列表视图模型与筛选

**Files:**

- Create: `dist/Configuration center/assets/buffet-rule-list-view.js`
- Modify: `scripts/verify-buffet-rule-list-view.mjs`

**Interfaces:**

- Consumes: `createViewModel(record, profile, stores)` 的原始规则、`profile.defaultScenarios`、`profile.legacyCapabilities` 与共享门店目录。
- Produces: `window.BuffetRuleListView`，至少公开 `createViewModel`、`filterRows`、`groupRows`、`buildFilterOptions`、`normalizeFilters`。
- Produces: `createViewModel` 返回 `{ id,name,status,subject,periods,targetType,measurement,partyRanges,effectiveTimeKey,effectiveTimeLabel,deployStoreIds,participatingStoreIds,legacyCapabilities,coverage,group,config }`。

- [ ] **Step 1: 写状态、周期、人数、时间和 KPOS 映射失败测试**

为验证脚本构造最小 profile 与规则夹具，包含 `active/disabled/inactive/draft/unknown`、单/多周期、非法人数区间、`all+lunch`、旧时间字段、当前与旧默认模板版本。核心断言：

```js
assert.equal(view.normalizeStatus("inactive"), "disabled");
assert.deepEqual(view.normalizePeriods({ enabledPeriods: [], period: "per_round" }), ["per_round"]);
assert.deepEqual(view.normalizeEffectiveTime({ businessHourSlots: [{ id: "all", mode: "full" }, { id: "lunch", mode: "full" }] }), {
  key: "lunch|full",
  label: "午市全时段"
});
assert.deepEqual(view.filterRows(rows, { partySize: "3" }).map((row) => row.id), ["range-1-3", "range-3-5", "all-party", "order-subject"]);
assert.deepEqual(view.filterRows(rows, { status: "active", partySize: "abc" }).map((row) => row.id), activeIds);
assert.equal(currentVersionRow.legacyCapabilities[0].id, "KPOS-O01");
assert.equal(unknownVersionRow.legacyCapabilities.length, 0);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-buffet-rule-list-view.mjs`

Expected: FAIL，提示 `buffet-rule-list-view.js` 不存在或导出函数未定义。

- [ ] **Step 3: 实现纯归一化与筛选函数**

实现不可变读取，并冻结列举常量：

```js
function configFor(record) {
  return record.authoringConfig || record.authoringDraft || record.editorDraft || {};
}

function normalizePeriods(config) {
  var allowed = ["order_lifetime", "per_round", "multi_round"];
  var source = Array.isArray(config.enabledPeriods) && config.enabledPeriods.length
    ? config.enabledPeriods
    : [config.period];
  return source.filter(function (value, index, values) {
    return allowed.indexOf(value) >= 0 && values.indexOf(value) === index;
  });
}

function filterRows(rows, filters) {
  return rows.filter(function (row) {
    return matchesKeyword(row, filters.keyword) &&
      matchesStore(row, filters.storeId) &&
      matchesStatus(row, filters.status) &&
      matchesSubject(row, filters.subject) &&
      matchesPeriod(row, filters.period) &&
      matchesTarget(row, filters.targetType) &&
      matchesPartySize(row, filters.partySize) &&
      matchesEffectiveTime(row, filters.effectiveTimeKey);
  });
}
```

`normalizeEffectiveTime` 与编辑器口径一致：新结构优先；`all` 与具体时段冲突时删除 `all`；自定义时段缺失起止值时回退 `full`；全部字段缺失为 `dinner|full`。`resolveTemplate` 仅在默认目录版本一致时直接映射，否则调用 `profile.verifiedLegacyDefaultKey(record)`。

- [ ] **Step 4: 补充动态选项、组合筛选和分组断言**

断言门店与时间选项来自未筛选全集；未知门店追加末尾；所有筛选为“且”；空分组不返回；默认草稿仍使用模板分组；自定义组合、整单、每轮、多轮和未知周期分别进入规格定义分组。

- [ ] **Step 5: 运行验证**

Run: `node scripts/verify-buffet-rule-list-view.mjs`

Expected: PASS，且源夹具 `JSON.stringify` 前后完全一致，证明投影未修改输入。

- [ ] **Step 6: 提交视图模型**

```bash
git add "dist/Configuration center/assets/buffet-rule-list-view.js" scripts/verify-buffet-rule-list-view.mjs
git commit -m "feat: add buffet rule list projections"
```

### Task 3: 商品、门店与数量列投影

**Files:**

- Modify: `dist/Configuration center/assets/buffet-rule-list-view.js`
- Modify: `scripts/verify-buffet-rule-list-view.mjs`

**Interfaces:**

- Consumes: Task 2 的 `createViewModel` 结果和规则配置。
- Produces: `projectColumns(row)`，返回字段 ID 到 `{ main:string, sub?:string, title?:string }` 的映射。
- Produces: `quantitySummary(config, kind)` 和 `quantityCompletion(config)`。

- [ ] **Step 1: 写商品范围和数量摘要失败测试**

加入单门店、多门店、未知门店、跨产线同 ID、组合模板、原子规则、`0`、部分配置、空配置和 `order_lifetime` 残留夹具：

```js
assert.equal(columns.singleStore.productScope.main, "指定菜品 2 个");
assert.equal(columns.equalStores.productScope.main, "2 家 · 每店 2 个");
assert.equal(columns.rangeStores.productScope.main, "2 家 · 每店 1–3 个");
assert.equal(columns.partial.targetLimit.main, "3 个场景 · 上限 0–4（已配置 2/3）");
assert.equal(columns.empty.targetLimit.main, "未配置");
assert.equal(columns.orderLifetimeResidue.roundTotal.main, "—");
assert.equal(columns.combo.quantityCompletion.main, "5 / 8");
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-buffet-rule-list-view.mjs`

Expected: FAIL，提示投影结果缺失或摘要不匹配。

- [ ] **Step 3: 实现商品范围与门店摘要**

按 `deployStoreIds`、草稿回退 `participatingStoreIds` 取得统计门店；菜品与菜品集成员使用 `productLineId + "::" + dishId`，分类使用 `productLineId + "::" + categoryId` 去重。多门店只比较每店数量，不跨店合并。

- [ ] **Step 4: 实现数量投影与完成度**

按“门店 × 周期 × 人数区间 × 轮次区间 × 对象”展开必填单元格；每个 cell 使用显式结构：

```js
{ key: "store|period|party|round|target", required: true, configured: true, value: 0 }
```

摘要的场景数取 `required` 数；范围只取 `configured` 值；部分配置追加 `（已配置 C/N）`。组合总量仅 min/max 同时存在算完成，普通总量任一侧存在算完成；对象和相同菜品完成度严格使用规格 6.3 的规则。

- [ ] **Step 5: 运行完整纯函数验证**

Run: `node scripts/verify-buffet-rule-list-view.mjs`

Expected: PASS 状态、筛选、分组、商品、数量、完成度和不可变性全部断言。

- [ ] **Step 6: 提交列投影**

```bash
git add "dist/Configuration center/assets/buffet-rule-list-view.js" scripts/verify-buffet-rule-list-view.mjs
git commit -m "feat: project buffet rule list columns"
```

### Task 4: 字段设置与列表 UI

**Files:**

- Modify: `dist/Configuration center/buffet-rule.html`
- Modify: `scripts/verify-buffet-rule-list-view.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: `window.BuffetRuleListView`、`window.OrderLimitStoreCatalog`、`profile.storage.listColumnsKey`。
- Produces: 页面状态 `{ filters, advancedOpen, visibleColumns }` 与 `render()`；保留现有 `toggle`、`remove`、查看、编辑、复制、新增行为。

- [ ] **Step 1: 写列定义和偏好校验失败测试**

验证固定列、默认七列、七个可选字段组、损坏/旧版本/未知字段偏好：

```js
assert.deepEqual(view.defaultVisibleColumns(), ["name", "strategy", "partyScenario", "productScope", "effectiveStores", "status", "actions"]);
assert.deepEqual(view.normalizeColumnPreference({ version: 1, visible: ["name", "unknown", "description"] }), {
  version: 1,
  visible: ["name", "description", "status", "actions"]
});
assert.deepEqual(view.normalizeColumnPreference({ version: 2, visible: ["description"] }).visible, view.defaultVisibleColumns());
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-buffet-rule-list-view.mjs`

Expected: FAIL，提示列定义或偏好函数未定义。

- [ ] **Step 3: 实现列目录和字段偏好纯函数**

每列定义包含 `id`、`label`、`group`、`fixed`、`defaultVisible`、`width`；固定列无条件补回。JSON 读取异常或 `version !== 1` 时恢复默认，不把筛选状态写入本地存储。

- [ ] **Step 4: 重构列表 DOM 并接入资产**

在 `buffet-rule.html` 依次加载：

```html
<script src="assets/order-limit-store-catalog.js"></script>
<script src="assets/buffet-rule-policy.js"></script>
<script src="assets/buffet-rule-domain.js"></script>
<script src="assets/buffet-rule-profile.js"></script>
<script src="assets/buffet-rule-list-view.js"></script>
```

新增筛选表单、两行布局、高级筛选展开区、结果计数、字段设置浮层和水平滚动表格。表头与单元格均按 `visibleColumns` 生成；名称/状态/操作列使用 sticky；现有按钮仍使用原 `data-*` 事件委托。

- [ ] **Step 5: 实现交互状态与异常状态**

筛选变化立即重新投影全集；非法人数仅设置错误文案且不应用人数条件；重置恢复默认筛选并收起高级区；字段切换只保存列偏好；无原始规则展示“暂无自助餐规则”，筛选无结果展示“暂无匹配规则”和“重置筛选”。

- [ ] **Step 6: 添加验证命令并运行**

在 `package.json` scripts 增加：

```json
"verify:buffet-rule-list": "node scripts/verify-buffet-rule-list-view.mjs"
```

Run: `npm.cmd run verify:buffet-rule-list`

Expected: PASS。

Run: `npm.cmd run build`

Expected: 成功退出，无 HTML/JavaScript 构建错误。

- [ ] **Step 7: 提交列表 UI**

```bash
git add "dist/Configuration center/buffet-rule.html" "dist/Configuration center/assets/buffet-rule-list-view.js" scripts/verify-buffet-rule-list-view.mjs package.json
git commit -m "feat: add buffet rule list filters and columns"
```

### Task 5: 浏览器业务回归与交付

**Files:**

- Modify only if verification finds a defect: `dist/Configuration center/buffet-rule.html`
- Modify only if verification finds a projection defect: `dist/Configuration center/assets/buffet-rule-list-view.js`
- Test: `scripts/verify-buffet-rule-list-view.mjs`

**Interfaces:**

- Consumes: 完整自助餐列表页面与既有规则仓库数据。
- Produces: 可在主前端 iframe 和直达地址一致使用的列表交互。

- [ ] **Step 1: 启动 worktree 开发服务**

Run: `npm run dev -- --host 127.0.0.1 --port 65168`

Expected: Vite 返回本地预览地址且进程保持运行。

- [ ] **Step 2: 浏览器验证直达页面**

打开 `http://127.0.0.1:65168/Configuration%20center/buffet-rule.html?embedded=1&verify=list-filters`，依次验证：六个常用筛选、高级人数和时间筛选、组合“且”、重置、结果数、分组隐藏与无结果提示。

- [ ] **Step 3: 浏览器验证字段设置**

切换每个字段组的代表字段，确认表头和内容同步；刷新后列偏好保留；点击“恢复默认”回到七列；固定列始终不可取消；窄窗口横向滚动时名称、状态和操作仍可访问。

- [ ] **Step 4: 浏览器回归规则操作**

逐一点击查看、编辑、复制、启用/禁用、删除确认和新增，确认目标路由、确认弹窗和列表刷新与改造前一致；取消删除不得改变数据。

- [ ] **Step 5: 验证主前端嵌入路由**

打开同一开发服务的 `/#/operations/queue-call/buffet-rules`，确认 iframe 加载本次 `buffet-rule.html`，筛选与字段设置行为和直达页面一致，退出编辑器后仍返回正确列表。

- [ ] **Step 6: 最终自动验证与差异审计**

Run: `npm.cmd run verify:buffet-rule-list`

Expected: PASS。

Run: `npm.cmd run build`

Expected: PASS。

Run: `git diff --check`

Expected: 无空白错误。

Run: `git status --short`

Expected: 仅出现本计划范围文件；若仍显示既有薪资文件或无关 `dist/assets`，不得加入提交。

- [ ] **Step 7: 提交浏览器验收修正（仅在产生修正时）**

```bash
git add "dist/Configuration center/buffet-rule.html" "dist/Configuration center/assets/buffet-rule-list-view.js" scripts/verify-buffet-rule-list-view.mjs
git commit -m "fix: align buffet rule list interactions"
```
