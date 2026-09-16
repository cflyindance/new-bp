# TipOut 员工工时简化汇总与规则明细弹框 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 简化员工汇总与员工每日小费的双工时展示，并提供可审计的规则级分配工时弹框。

**Architecture:** 在 `TipOutSummaryUi` 中增加原始打卡、POS 有效考勤、封顶和手工工时的纯函数投影，以及唯一值/多口径摘要。员工汇总和员工每日小费共享同一摘要与明细数据结构，页面只负责渲染按钮和弹框；导出继续消费规则级明细。

**Tech Stack:** 原生 JavaScript、HTML/CSS、Node.js `assert`/`vm` 验证、Vite/TypeScript。

**Spec:** `docs/superpowers/specs/2026-09-16-tip-employee-hours-summary-modal-design.md`

## Global Constraints

- 打卡工时保留最初原始值，不随 POS 后续修正变化，且不显示 `X/Y 天有记录`。
- 打卡规则实际采用工时先取 POS 当前有效考勤，再应用最大工时封顶；未打卡规则按 `poolId + ruleId + dateKey + employeeId` 读取手工工时。
- 分配工时摘要不跨规则求和：无有效值显示 `—`；一个规范化值显示该值；多个不同值显示 `多口径（N）`。
- `N` 是不同有效数值数量，不是规则数量；合法 `0 h` 参与，缺失和非工时规则不参与。
- 每日值先四舍五入到两位小数，跨日累计后再次四舍五入到两位小数。
- 员工汇总、员工详情顶部和员工每日行均支持从有效摘要打开弹框；`—` 不可点击。
- 日期范围弹框每个 `poolId + ruleId` 一条跨日汇总；每日弹框每规则一条当天记录。
- 页面列表隐藏规则明细，CSV/PDF/邮件继续导出规则级工时、来源和实际采用值。
- 待分配、确认快照、未确认更新、已发放锁定与旧快照回退继续遵守现有状态规则。

---

### Task 1: 建立工时来源和摘要纯函数

**Files:**
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt`
- Modify: `dist/TipOut/tipout-summary-ui.js`
- Modify: `scripts/verify-tipout-employee-hours-contract.mjs`

**Interfaces:**
- Consumes: `{ originalPunchHours, posEffectiveHours, maxHours, manualHours, usesHours, clockMode }`。
- Produces: `resolveRuleAllocationHours(input)`, `summarizeAllocationHourValues(entries)`, `aggregateAllocationHourEntries(rows)`；规则条目增加 `source: 'original-punch'|'pos-corrected'|'max-hours'|'manual'|'mixed'|'not-applicable'`。

- [ ] **Step 1: 写失败的计算契约测试**

```js
assert.deepEqual(ui.resolveRuleAllocationHours({ usesHours: true, clockMode: 'clock', originalPunchHours: 8, posEffectiveHours: 10 }), { hours: 10, hoursValid: true, source: 'pos-corrected' });
assert.deepEqual(ui.resolveRuleAllocationHours({ usesHours: true, clockMode: 'clock', originalPunchHours: 8, posEffectiveHours: 10, maxHours: 5 }), { hours: 5, hoursValid: true, source: 'max-hours' });
assert.deepEqual(ui.resolveRuleAllocationHours({ usesHours: true, clockMode: 'noclock', manualHours: 4 }), { hours: 4, hoursValid: true, source: 'manual' });
assert.equal(ui.summarizeAllocationHourValues([{ hours: 4, hoursValid: true }, { hours: 6, hoursValid: true }]).display, '多口径（2）');
assert.equal(ui.summarizeAllocationHourValues([{ hours: 8, hoursValid: true }, { hours: 8, hoursValid: true }]).display, '8 h');
```

- [ ] **Step 2: 运行并确认失败**

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Expected: FAIL，提示新函数不存在。

- [ ] **Step 3: 实现最小纯函数和跨日来源聚合**

实现明确的有效值检查，不能用 `Number(value) || 0` 混淆缺失与零。跨日同规则来源一致时保留来源；出现两个以上来源时输出 `mixed`。名称取筛选范围最新业务日期的草稿或快照名称。

- [ ] **Step 4: 运行契约与旧快照测试**

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Run: `node scripts/verify-team-tips-manual-hours-snapshot.mjs`

Expected: PASS。

- [ ] **Step 5: 提交纯函数**

```bash
git add src/team/tips/legacy/tipout-summary-ui.js.txt dist/TipOut/tipout-summary-ui.js scripts/verify-tipout-employee-hours-contract.mjs
git commit -m "feat: define TipOut allocation hours summaries"
```

### Task 2: 接通原始打卡、POS 修正、封顶与快照字段

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/legacy/attendanceMock.js.txt`
- Modify: `src/team/tips/legacy/tipout-allocation-results-store.js.txt`
- Test: `scripts/verify-tipout-employee-hours-contract.mjs`
- Test: `scripts/verify-tipout-confirm-allocation-store.mjs`
- Test: `scripts/verify-tipout-payout-lock.mjs`

**Interfaces:**
- Consumes: Task 1 的 `resolveRuleAllocationHours()`。
- Produces: 每日员工记录中的 `originalPunchHours`, `posEffectiveHours`, `allocationHourEntries[]`；确认快照保留规则最终值与来源。

- [ ] **Step 1: 添加状态矩阵失败测试**

测试待分配读取当前 POS 值、确认后读取快照、未确认更新读取草稿、已发放读取锁定快照；断言原始打卡 8h 在 POS 修正 10h 后仍为 8h，规则值为 10h；封顶 5h 后规则值为 5h。

- [ ] **Step 2: 运行状态测试确认失败**

Run: `node scripts/verify-tipout-confirm-allocation-store.mjs`

Run: `node scripts/verify-tipout-payout-lock.mjs`

Expected: 至少一项 FAIL 于缺少新字段。

- [ ] **Step 3: 实现结构化字段和快照兼容**

考勤层分别输出原始打卡与 POS 有效值；规则投影层应用封顶或手工工时。确认快照写入输入值、最终值、来源和当时池/规则名称；旧快照只能从自身数据重建，无法重建时置缺失。

- [ ] **Step 4: 运行状态与锁定回归**

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Run: `node scripts/verify-tipout-confirm-allocation-store.mjs`

Run: `npm run verify:tipout-payout-lock`

Expected: PASS。

- [ ] **Step 5: 提交数据管线**

```bash
git add src/team/tips/programs/distribution.js.txt src/team/tips/legacy/attendanceMock.js.txt src/team/tips/legacy/tipout-allocation-results-store.js.txt scripts
git commit -m "feat: derive effective TipOut allocation hours"
```

### Task 3: 实现共享弹框与简化页面展示

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-employee-shifts-hours-columns.mjs`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `{ display, kind: 'empty'|'single'|'multiple', distinctCount, entries[] }`。
- Produces: `openAllocationHoursDetail(context, entries, trigger)`, `closeAllocationHoursDetail()`，以及可访问的共享 `role="dialog"`。

- [ ] **Step 1: 写失败的 DOM 契约测试**

断言员工汇总与员工每日页面不包含 `天有记录` 或列表内逐规则 stack；存在 `allocationHoursDetailModal`、标题、表头“小费池/规则/工时来源/分配工时”、遮罩和取消按钮；唯一值与多口径渲染为 button，空值为普通 `—`。

- [ ] **Step 2: 运行结构测试确认失败**

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Expected: FAIL 于旧逐规则列表仍存在或弹框缺失。

- [ ] **Step 3: 实现汇总、逐日入口和共享弹框**

员工汇总使用跨日摘要；详情顶部使用筛选范围摘要；逐日行使用当天摘要。弹框接收已排序的结构化 entries，来源映射为“原始打卡/POS 修正/最大工时/手工录入/混合来源/不适用”。实现点击、Esc、遮罩、取消、焦点进入和返回触发器。

- [ ] **Step 4: 运行页面与交互回归**

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Run: `node scripts/verify-team-tips-native-views.mjs`

Run: `npm run verify:tipout-employee-reconciliation`

Expected: PASS。

- [ ] **Step 5: 提交页面交互**

```bash
git add src/team/tips/templates src/team/tips/programs src/team/tips/tips-page.css scripts
git commit -m "feat: add allocation hours detail modal"
```

### Task 4: 同步导出、权威 PRD 与最终验证

**Files:**
- Modify: `src/team/tips/legacy/export.js.txt`
- Modify: `dist/TipOut/export.js`
- Modify: `dist/TipOut/docs/PRD_产品需求文档.md`
- Test: `scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

**Interfaces:**
- Consumes: 页面同源的规则级 `entries[]`。
- Produces: CSV/PDF/邮件的规则级来源与工时明细；权威 PRD V2.5 增量记录。

- [ ] **Step 1: 写失败的导出断言**

断言打卡工时导出不含“天有记录”，分配工时仍逐规则输出池名、规则名、中文来源和实际采用值；日期范围导出每规则一条跨日汇总，每日导出为当天记录。

- [ ] **Step 2: 运行导出测试确认失败**

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Expected: FAIL 于旧 coverage 文案或缺少来源。

- [ ] **Step 3: 统一三类导出并增量更新 V2.5 PRD**

CSV 使用单元格换行，PDF/邮件使用多行；都消费同一 entries 映射。PRD 以当前 V2.4 为基线新增 V2.5，更新员工汇总、员工明细、字段定义、弹框、状态、导出和验收，不删除历史版本。

- [ ] **Step 4: 运行完整定向验证和构建**

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Run: `npm run verify:tipout-employee-reconciliation`

Run: `node scripts/verify-team-tips-native-views.mjs`

Run: `node scripts/verify-team-tips-native-runtime.mjs`

Run: `npm run verify:tipout-payout-lock`

Run: `npm run build`

Expected: 全部 PASS；构建成功退出。

- [ ] **Step 5: 浏览器验收并提交**

验收原始 8h/POS 10h、原始 8h/封顶 5h、手工 4h/6h、多规则同值、零值、缺失、快照和发放锁定；确认弹框键盘与焦点行为。然后：

```bash
git add src/team/tips dist/TipOut scripts
git commit -m "docs: publish TipOut hours summary modal V2.5"
```

## Final Verification

- [ ] 对照规格逐项确认计算顺序、两种页面范围、摘要、弹框、来源、快照、导出和异常边界均有任务覆盖。
- [ ] 确认计划没有占位描述、未定义接口或跨任务命名不一致。
- [ ] 功能提交完成后按项目约定合入 `main`；只有用户明确要求时才推送远程 GitHub。
