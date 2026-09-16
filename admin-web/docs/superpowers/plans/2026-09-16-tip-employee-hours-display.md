# TipOut 员工工时双口径展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在员工分配汇总和员工每日小费中统一展示原始“打卡工时”与实际参与分配的“分配工时”，移除班次及上下班时间展示，并保证草稿、确认快照、已发放锁定和所有导出口径一致。

**Architecture:** 在 `TipOutSummaryUi` 建立页面与导出共用的结构化工时投影：打卡工时保持单值，分配工时按 `(poolId, ruleId)` 保存和聚合。待分配读取当前考勤与草稿，已分配/已发放读取确认快照；UI 不从展示字符串反推数值。现有大文件结构保持不变，只补充职责明确的纯函数与映射，避免改动分配公式和锁定流程。

**Tech Stack:** 原生 JavaScript、HTML/CSS 模板、Node.js `assert`/`vm` 验证脚本、Vite/TypeScript 构建。

**Spec:** `docs/superpowers/specs/2026-09-15-tip-employee-hours-display-design.md`

## Global Constraints

- 字段名称固定为“打卡工时”“分配工时”，有效数值最多两位小数并带 `h`；合法零值显示 `0 h`，缺失或非法值显示 `—`。
- 分配工时的唯一聚合键是 `poolId + ruleId`；同池多规则、跨池规则不得合计或任选一条。
- 分配工时仅在规范化到两位小数后与打卡工时不同的行高亮，不增加徽标、差值或错误语义。
- 平均分配、按订单等非工时规则显示 `—`，不参与 X/Y、汇总或高亮。
- 待分配读取当前考勤和当前草稿；已分配读取确认快照；已发放读取锁定快照；旧快照只能从同一快照自洽重建，禁止混用实时考勤。
- 存在未确认更新时，员工汇总、员工每日小费及导出展示当前草稿工时，金额和发放保护继续沿用现有状态规则。
- 页面与 CSV、PDF、邮件导出删除班次、上下班时间和旧单一工时字段，并共享同一工时数据映射。
- 不改变考勤判定、分配公式、确认分配、确认发放和写保护逻辑。
- 权威 PRD 只能以当前 V2.3 为基线增量升级至 V2.4，不得从历史版本重新生成。

---

## File Map

- `src/team/tips/legacy/tipout-summary-ui.js.txt`：新增纯数据契约、分配工时行规范化、按规则聚合、缺失计数、排序与快照兼容函数。
- `src/team/tips/programs/distribution.js.txt`：生成每日双工时数据，渲染员工汇总两列，并把结构化字段传入员工明细快照。
- `src/team/tips/templates/distribution.html`：员工汇总表头由“班次/工时”改为“打卡工时/分配工时”。
- `src/team/tips/programs/employee-reconciliation.js.txt`：员工每日小费页面、顶部汇总与明细/邮件导出的双工时映射。
- `src/team/tips/templates/employee-reconciliation.html`：移除班次、上下班时间，新增双工时表头和汇总节点。
- `src/team/tips/legacy/export.js.txt`：员工分配汇总 CSV/PDF/邮件输出双工时。
- `src/team/tips/legacy/tipout-allocation-results-store.js.txt`：确认快照校验并保留每日原始打卡工时、按规则分配工时。
- `src/team/tips/legacy/attendanceMock.js.txt`、`src/team/tips/legacy/tipout-manual-hours-store.js.txt`：只提供原始考勤和手工分配工时输入，不再把两种口径混成一个 `hourLines` 字段。
- `src/team/tips/styles/prototype-fidelity.css`：多行分配工时、差异高亮、缺失与无障碍辅助样式。
- `scripts/verify-tipout-employee-hours-contract.mjs`：新增纯函数、状态数据源、旧快照兼容和多池规则验证。
- `scripts/verify-team-tips-employee-shifts-hours-columns.mjs`：改写页面/导出字段结构验证。
- `scripts/verify-tipout-employee-reconciliation.mjs`：更新汇总、排序、快照和详情页回归断言。
- `dist/TipOut/docs/PRD_产品需求文档.md`：V2.3 基础上追加 V2.4 需求。
- `dist/TipOut/*`：由 `npm run build` 生成的最终可预览产物。

### Task 1: 建立双工时纯数据契约与聚合函数

**Files:**
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt:112-205,357-410`
- Create: `scripts/verify-tipout-employee-hours-contract.mjs`

**Interfaces:**
- Consumes: 每日员工记录中的 `punchHours`, `punchHoursValid`, `allocationHourEntries[]`，每条分配记录包含 `poolId`, `poolName`, `ruleId`, `ruleName`, `usesHours`, `hours`, `hoursValid`, `dateKey`。
- Produces: `TipOutSummaryUi.normalizeEmployeeHoursRow(row)`, `aggregateAllocationHourEntries(dailyRows)`, `formatHoursCoverage(total, validDays, eligibleDays)`, `shouldHighlightAllocationHours(punch, entry)`；员工 aggregate 输出 `punchHours`, `punchValidDays`, `recordDays`, `allocationHourSummaries[]`。

- [ ] **Step 1: 写失败的纯函数契约测试**

在新脚本中通过 `vm` 加载 `src/team/tips/legacy/tipout-summary-ui.js.txt`，覆盖以下断言：

```js
const row = ui.normalizeEmployeeHoursRow({
  dateKey: '2026-09-15', punchHours: 5, punchHoursValid: true,
  allocationHourEntries: [
    { poolId: 'P1', poolName: '前厅池', ruleId: 'R1', ruleName: '服务员', usesHours: true, hours: 6, hoursValid: true },
    { poolId: 'P1', poolName: '前厅池', ruleId: 'R2', ruleName: '平均', usesHours: false, hours: null, hoursValid: false }
  ]
});
assert.equal(row.punchHours, 5);
assert.equal(row.allocationHourEntries[0].key, 'P1::R1');
assert.equal(ui.shouldHighlightAllocationHours(5, row.allocationHourEntries[0]), true);
assert.equal(ui.shouldHighlightAllocationHours(null, { usesHours: true, hours: 0, hoursValid: true }), true);
assert.equal(ui.shouldHighlightAllocationHours(5, { usesHours: true, hoursValid: false }), false);
assert.equal(ui.shouldHighlightAllocationHours(null, { usesHours: false, hoursValid: false }), false);
```

再用跨日期数据断言：同一稳定 ID 政名仍合并并采用最新名称；同名不同 ID 分行；非工时规则为 `—` 且不产生 X/Y；部分缺失得到 `12 h（2/3 天有记录）`；全部缺失为 `—`；合法 0 保持有效。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Expected: FAIL，提示 `normalizeEmployeeHoursRow is not a function`。

- [ ] **Step 3: 实现规范化、聚合和比较纯函数**

实现明确的数值有效性判断（不能用 `Number(value) || 0` 吞掉缺失），以 `poolId + '::' + ruleId` 为键；名称取最新 `dateKey`，重名时追加稳定短 ID；排序按池名、规则名、池 ID、规则 ID。聚合对象保持数值与展示分离，例如：

```js
{
  key: 'P1::R1', poolId: 'P1', ruleId: 'R1',
  label: '前厅池 · 服务员', usesHours: true,
  totalHours: 12, validDays: 2, eligibleDays: 3,
  display: '前厅池 · 服务员 12 h（2/3 天有记录）'
}
```

将 `aggregateEmployeeDailyDatasets` 的旧 `shifts/hours` 汇总替换为 `punchHours/punchValidDays/recordDays/allocationHourSummaries`，排序键 `hours` 改读 `punchHours`；缺失值始终排末尾，同值按姓名升序。

- [ ] **Step 4: 运行纯函数和现有员工汇总测试**

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Run: `node scripts/verify-tipout-employee-reconciliation.mjs`

Expected: 新测试 PASS；旧测试因字段契约变化只在尚未更新的旧断言处 FAIL，不出现运行时异常。

- [ ] **Step 5: 提交数据契约**

```bash
git add src/team/tips/legacy/tipout-summary-ui.js.txt scripts/verify-tipout-employee-hours-contract.mjs
git commit -m "feat: add TipOut employee hours contracts"
```

### Task 2: 接通草稿、确认快照和已发放锁定的数据源

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt:300-365,624-685,735-805`
- Modify: `src/team/tips/legacy/tipout-allocation-results-store.js.txt:28-65`
- Modify: `src/team/tips/legacy/attendanceMock.js.txt:20-98`
- Modify: `src/team/tips/legacy/tipout-manual-hours-store.js.txt:1-30`
- Test: `scripts/verify-tipout-employee-hours-contract.mjs`
- Test: `scripts/verify-team-tips-manual-hours-snapshot.mjs`
- Test: `scripts/verify-tipout-payout-lock.mjs`

**Interfaces:**
- Consumes: Task 1 的 `normalizeEmployeeHoursRow` 与 `(poolId, ruleId)` 条目契约。
- Produces: 每个 `employeeResults[]` 都包含独立 `punchHours/punchHoursValid/allocationHourEntries`；新确认快照持久化这些字段，旧快照安全降级。

- [ ] **Step 1: 扩充失败测试覆盖状态矩阵**

在契约测试中构造待分配草稿、已确认快照、未确认更新、已发放锁定和旧快照，断言：

```js
assert.deepEqual(pending.allocationHourEntries.map(x => x.hours), [6, 4]);
assert.equal(allocated.punchHours, 5);              // 来自确认快照
assert.equal(unconfirmed.allocationHourEntries[0].hours, 7); // 当前草稿
assert.equal(paid.allocationHourEntries[0].hours, 6);        // 锁定快照
assert.equal(legacy.punchHoursValid, false);        // 无法从同快照自洽重建
```

并断言手工工时键包含 `poolId + ruleId + dateKey + employeeId`，同池两规则互不覆盖。

- [ ] **Step 2: 运行测试确认状态数据源尚未满足**

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Run: `node scripts/verify-team-tips-manual-hours-snapshot.mjs`

Expected: FAIL 于快照缺少双工时字段或手工条目身份不完整。

- [ ] **Step 3: 最小实现双工时快照管线**

从考勤汇总只产出 `punchHours/punchHoursValid`；从每个池规则的实际执行数据产出 `allocationHourEntries`，包括封顶后的有效工时和手工工时。确认时把双工时写入同一结果快照；读取时按既有 `TipOutDateState.inspect()` 决定草稿或快照来源，已发放不读取当前考勤。旧快照仅从其自身的 `hours`、池员工工时等字段重建；无法判定时置为缺失。

- [ ] **Step 4: 运行状态、手工工时和发放锁定测试**

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Run: `node scripts/verify-team-tips-manual-hours-snapshot.mjs`

Run: `node scripts/verify-tipout-confirm-allocation-store.mjs`

Run: `npm run verify:tipout-payout-lock`

Expected: 全部 PASS；确认/发放哈希校验仍通过。

- [ ] **Step 5: 提交状态管线**

```bash
git add src/team/tips/programs/distribution.js.txt src/team/tips/legacy/tipout-allocation-results-store.js.txt src/team/tips/legacy/attendanceMock.js.txt src/team/tips/legacy/tipout-manual-hours-store.js.txt scripts/verify-tipout-employee-hours-contract.mjs
git commit -m "feat: persist TipOut punch and allocation hours"
```

### Task 3: 改造员工分配汇总页面和汇总导出

**Files:**
- Modify: `src/team/tips/templates/distribution.html:250-265`
- Modify: `src/team/tips/programs/distribution.js.txt:1000-1105`
- Modify: `src/team/tips/legacy/export.js.txt:55-180` 以及同文件员工 PDF/邮件映射
- Modify: `src/team/tips/styles/prototype-fidelity.css`
- Modify: `scripts/verify-team-tips-employee-shifts-hours-columns.mjs`
- Modify: `scripts/verify-tipout-employee-reconciliation.mjs`

**Interfaces:**
- Consumes: `aggregate.punchHours`, coverage 元数据与 `allocationHourSummaries[]`。
- Produces: 员工汇总 DOM 和导出行的 `punchHoursDisplay`, `allocationHoursDisplayLines[]`。

- [ ] **Step 1: 把结构验证改为新列契约并先运行失败**

断言汇总模板含连续表头“打卡工时”“分配工时”，不含“班次”；断言 `employeeSortHours` 文案为“打卡工时”，分配工时无排序按钮；断言 CSV/PDF/邮件列不含 `Shifts/Hours`，而含 `Punch Hours/Allocation Hours`。另断言渲染包含逐行标签与差异类 `tipout-allocation-hours--changed`。

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Expected: FAIL 于旧表头仍存在。

- [ ] **Step 2: 修改汇总表头、渲染和排序**

删除班次单元格；打卡工时使用 coverage 文案；分配工时逐行显示“池名 · 规则名 + 值”，仅差异行加高亮类。保留原金额、角色、员工、分配状态和点击进入详情行为。将排序入口仍映射现有 `hours` URL/历史状态兼容值，但内部比较 `punchHours`，确保升级后已有 history state 不失效。

- [ ] **Step 3: 修改员工汇总三类导出**

`collectEmployeeReconciliationExportData()` 直接消费与页面相同的展示映射。CSV 单元格用换行保存多规则；PDF/邮件用多行 HTML。打卡工时保留 `X/Y 天有记录`；分配工时每规则保留各自 X/Y；移除班次和旧单一工时。

- [ ] **Step 4: 运行页面、导出和聚合回归**

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Run: `node scripts/verify-tipout-employee-reconciliation.mjs`

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Expected: 全部 PASS，打卡工时排序缺失值始终末尾。

- [ ] **Step 5: 提交员工汇总**

```bash
git add src/team/tips/templates/distribution.html src/team/tips/programs/distribution.js.txt src/team/tips/legacy/export.js.txt src/team/tips/styles/prototype-fidelity.css scripts/verify-team-tips-employee-shifts-hours-columns.mjs scripts/verify-tipout-employee-reconciliation.mjs
git commit -m "feat: show punch and allocation hours in employee summary"
```

### Task 4: 改造员工每日小费页面和明细导出

**Files:**
- Modify: `src/team/tips/templates/employee-reconciliation.html:43-56`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt:17-220,328-430`
- Modify: `src/team/tips/styles/prototype-fidelity.css`
- Modify: `scripts/verify-team-tips-employee-shifts-hours-columns.mjs`
- Modify: `scripts/verify-tipout-employee-reconciliation.mjs`

**Interfaces:**
- Consumes: 员工详情快照中每日 `punchHours/punchHoursValid/allocationHourEntries[]`。
- Produces: 详情顶部双工时汇总、逐日双工时列以及一致的 CSV/PDF/邮件行。

- [ ] **Step 1: 写失败的详情结构与导出断言**

断言详情表头按顺序为日期、考勤、打卡工时、分配工时、金额、状态；不存在班次、上班时间、下班时间。断言顶部不再有 `employeeDetailShifts`，而有 `employeeDetailPunchHours` 和 `employeeDetailAllocationHours`。断言逐日导出删除 `shifts/clockIns/clockOuts/hours`，输出 `punchHours/allocationHours`，并保留工时来源、考勤备注、手动工时明细。

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Expected: FAIL 于旧详情字段。

- [ ] **Step 2: 修改详情顶部汇总和逐日表格**

删除班次及上下班时间 DOM/渲染。顶部打卡工时使用员工范围 coverage；顶部“分配工时”按 `(poolId, ruleId)` 分行。逐日只显示当天值，不显示 `1/1 天有记录`；差异规则行单独高亮。待分配金额继续为 `—`，日期排序和两类筛选保持原行为。

- [ ] **Step 3: 修改详情三类导出并共享映射**

令 `collectEmployeeDetailExportData()` 先构造页面同源行对象：

```js
{
  date, attendance, workHourSource, attendanceNote,
  punchHours: '5 h',
  allocationHours: '前厅池 · 服务员: 6 h\n酒吧池 · 酒保: 4 h',
  manualHourDetails, before, deducted, received, after, allocation
}
```

CSV、PDF、邮件只格式化该对象，不重新计算工时。

- [ ] **Step 4: 运行详情、导出、日期排序与筛选回归**

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Run: `node scripts/verify-tipout-employee-reconciliation.mjs`

Run: `node scripts/verify-team-tips-summary-date-sort.mjs`

Expected: 全部 PASS；员工详情每次进入仍默认日期倒序。

- [ ] **Step 5: 提交员工每日明细**

```bash
git add src/team/tips/templates/employee-reconciliation.html src/team/tips/programs/employee-reconciliation.js.txt src/team/tips/styles/prototype-fidelity.css scripts/verify-team-tips-employee-shifts-hours-columns.mjs scripts/verify-tipout-employee-reconciliation.mjs
git commit -m "feat: show dual hours in employee daily tips"
```

### Task 5: 更新 V2.4 权威 PRD 并完成产物级验证

**Files:**
- Modify: `dist/TipOut/docs/PRD_产品需求文档.md`
- Generated: `dist/TipOut/index.html`
- Generated: `dist/TipOut/employee-reconciliation-detail.html`
- Generated: `dist/TipOut/tipout-summary-ui.js`
- Generated: `dist/TipOut/prototype-fidelity.css`

**Interfaces:**
- Consumes: Tasks 1-4 已通过验证的最终行为。
- Produces: V2.4 权威产品口径和可预览构建产物。

- [ ] **Step 1: 以 V2.3 原文增量追加 V2.4**

在版本记录首行增加：

```markdown
| V2.4 | 2026-09-16 | 员工汇总与员工每日小费新增打卡工时、分配工时双口径；移除班次与上下班时间展示；补充多池规则、快照、导出及差异高亮规则 |
```

同步更新 P2/P4、统一数据来源、字段定义、状态矩阵、导出、异常边界和验收标准；保留 V2.3 及全部历史内容，不重建文档。

- [ ] **Step 2: 运行完整 TipOut 定向验证**

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Run: `npm run verify:tipout-employee-reconciliation`

Run: `node scripts/verify-team-tips-manual-hours-snapshot.mjs`

Run: `node scripts/verify-tipout-confirm-allocation-store.mjs`

Run: `npm run verify:tipout-payout-lock`

Expected: 全部 PASS。

- [ ] **Step 3: 构建最终产物**

Run: `npm run build`

Expected: TypeScript、Vite 和资源复制全部成功退出；`dist/TipOut` 产物包含新表头与双工时逻辑。

- [ ] **Step 4: 对构建产物复跑关键验证**

Run: `npm run verify:tipout-employee-reconciliation`

Run: `node scripts/verify-tipout-employee-hours-contract.mjs`

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Expected: 全部 PASS，证明源模板与 `dist/TipOut` 无漂移。

- [ ] **Step 5: 浏览器验收关键场景**

启动本地预览后依次验证：打卡 5h/分配 6h 仅高亮 6h；无打卡/手工 4h 显示 `—` 与 4h；同池多规则和跨池规则逐行；合法 0 与缺失区分；待分配金额仍为 `—`；确认后考勤变化不改快照；未确认更新展示草稿；已发放仍锁定；两页面筛选、排序和三类导出字段一致。

- [ ] **Step 6: 提交文档和最终产物**

```bash
git add dist/TipOut/docs/PRD_产品需求文档.md dist/TipOut src/team/tips scripts
git commit -m "docs: publish TipOut employee hours V2.4"
```

## Final Verification

- [ ] `git status --short` 只显示预期文件，或工作区干净。
- [ ] 对照设计文档逐条确认：双列、按规则分行、X/Y、缺失、高亮、状态数据源、旧快照、导出、排序、发放锁定均有实现任务和测试。
- [ ] 扫描本计划，确认不存在占位描述、未定义接口或省略实现步骤。
- [ ] 合并前确认目标分支为 `main`；按用户约定，功能完成后默认合入 `main`，远程推送仍仅在用户明确要求时执行。
