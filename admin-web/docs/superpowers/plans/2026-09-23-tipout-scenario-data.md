# TipOut 当前员工场景数据 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 当前门店全部员工获得可追溯、稳定的近一个月测试事实，覆盖已确认场景且不改写历史快照。

**Architecture:** 新增只读事实提供器，按门店、员工 ID、日历日期生成事实；现有分配引擎消费事实，不伪造结果。考勤、订单、小费池与汇总共享来源。场景清单是只读视图，流程状态和失败注入只在隔离浏览器上下文中执行。

**Tech Stack:** TypeScript runtime、现有 legacy JavaScript、Node assert/vm、Playwright、Vite。

**Spec:** `docs/superpowers/specs/2026-09-23-tipout-scenario-data-design.md`（用户已确认）

## Global Constraints

- 使用当前员工目录中的员工 ID、所属门店、角色，不创建虚构员工、不修改员工档案。
- 按当前门店读取全部员工，而非仅取当前页面筛选出的员工。
- 默认清单展示本地今天向前一个月（含今天）。
- 未打卡是员工事实，不创建不打卡规则。
- 不提供静默清空、覆盖快照或重置按钮。
- 不包含未来退款、真实 Payroll 支付或部分发放。
- 工作目录为 `C:/Users/27273/AppData/Local/Temp/buffet-help-main-merge-20260921/admin-web`，不是原始旧工作树；只提交本任务文件，保留现有其他修改。不推送远程。

## 文件边界

- 新建 `src/team/tips/legacy/tipout-scenario-data.js.txt`：纯事实生成和期间清单，无 DOM、无存储写入。
- 新建 `src/team/tips/legacy/tipout-scenario-list.js.txt`：只读弹框、CSV、快照/规则覆盖提示。
- 修改 `src/team/tips/tips-legacy-runtime.ts`：按依赖顺序注入提供器与清单模块。
- 修改 `src/team/tips/legacy/attendanceMock.js.txt`、`tipout-attendance-label.js.txt`：传递身份并消费统一考勤。
- 修改 `src/team/tips/legacy/tipout-date-pool-view.js.txt`：使用同一门店日来源计算不同规则。
- 修改 `src/team/tips/programs/distribution.js.txt`、`details.js.txt`、`employee-reconciliation.js.txt`：统一事实入口，保持快照优先级和状态机。
- 新增 `scripts/verify-tipout-scenario-data.mjs`、`scripts/verify-tipout-scenario-browser.cjs`：纯数据与浏览器回归。
- 更新最新 `dist/TipOut/docs/PRD_产品需求文档.md`，增量记录已实现口径；不重建文档，不覆盖版本历史。

### Task 1: 稳定、隔离的员工日事实

**Interfaces:** `TipOutScenarioData.fact({storeId, employee, dateKey})` 返回 `{scenarioId, employeeId, storeId, dateKey, attendance, orders, salesAmount, orderTips, reportedTips, originalTips, surcharge}`；employee 为 `{id,name,role}`。`monthDates(todayKey)` 返回日期字符串数组，减月时钳制到上月最后一天。`day({storeId, employees, dateKey})` 返回事实数组。

- [x] 新建 VM 单测加载提供器，使用内存环境且任何 storage 写操作抛错。固定员工 id，不以数组下标作为种子。

```js
const facts = api.monthDates('2026-09-23').map(dateKey => api.fact({storeId:'s1',employee:{id:'e1',name:'同名',role:'Server'},dateKey}));
assert.equal(new Set(facts.map(f => f.scenarioId)).size, 8);
const input = {storeId:'s1',employee:{id:'e1',name:'同名',role:'Server'},dateKey:'2026-09-23'};
assert.deepEqual(api.fact(input), api.fact(input));
assert.notEqual(api.fact(input).storeId, api.fact({...input,storeId:'s2'}).storeId);
for (const f of facts) {
  assert.equal(f.originalTips, Math.round((f.orderTips + f.reportedTips)*100)/100);
  if (!f.orders.length) assert.equal(f.salesAmount, 0);
}
assert.equal(api.monthDates('2026-03-31')[0], '2026-02-28');
```

- [x] 运行 `node scripts/verify-tipout-scenario-data.mjs`，确认新增接口缺失导致失败。
- [x] 实现纯生成器。日期验证必须 round-trip，拒绝无效 ID/日期；seed 由版本、门店和员工 ID 计算，日期按 UTC 日序号增加，避免 DST 影响轮换。

```js
const combination = ((calendarDay + employeeSeed) % 8 + 8) % 8;
const hasPunch = combination < 4;
const hasOrders = combination % 4 < 2;
const hasTips = combination % 2 === 0;
const scenarioId = 'B0' + (combination + 1);
// 所有金额先以整数美分生成，最后转为显示金额。
```

- [x] 完整考勤生成有效片段；扩展变体使用独立稳定种子，覆盖单段、多段、缺下班卡和原始8/POS修正10。无订单有小费仅 reportedTips 非零；有订单时订单金额合计等于 salesAmount，订单小费合计等于 orderTips。
- [x] 增加跨年、同名不同 ID、门店隔离、名单增删不重排、8种布尔组合、金额合计和工时修正断言并运行通过；提交提供器和单测。

### Task 2: 各页面统一消费，历史快照不变

**Interfaces:** `TipOutAttendance.getDayStatus(name,dateKey,identity)` 新增可选 `{storeId,employeeId}`；新场景调用必须提供身份，旧签名保留兼容。`TipOutDatePoolView.buildDayData(dateKey,poolRules,ruleSalt,source)` 新增 `source`（Task 1 的事实数组），`projectDate(options)` 增加同一 source。规则盐只用于标识规则，不再改变员工事实。

- [ ] 在单测加入两条规则读取相同源的断言，以及原始8/有效10、上限5取5的断言。使用现有 `TipOutSummaryUi.resolveRuleAllocationHours` 验证，不复制计算逻辑。

```js
assert.equal(att.originalHours, 8);
assert.equal(att.effectiveHours, 10);
assert.equal(resolve({usesHours:true,clockMode:'clock',originalPunchHours:8,posEffectiveHours:10,maxHours:5}).hours, 5);
assert.equal(ruleA.sales, ruleB.sales);
assert.equal(ruleA.tips, ruleB.tips);
```

- [ ] 运行新增测试确认旧逻辑不满足统一来源。
- [ ] runtime 在消费者执行前注入提供器。使用 roster canonical store 与 employee ID 解析身份；相同姓名多匹配时返回明确错误，不能任选第一项。详情旧 select 若只有姓名需给 option 加员工 ID，标签读取同一身份。
- [ ] 考勤保留 originalHours/effectiveHours 分离；更新全部 `getDayStatus` 调用方。详情 `genSyntheticOrderTipContext` 用事实 orders 的菜单行、支付小费类型汇总派生，不能再独立 random。
- [ ] 日期池来源使用事实求和，个人销售提供当前员工 `{name,role,salesAmount}`；员工汇总 `ensureDayPipeline` 和 `genDailyTip` 以 originalTips/salesAmount 为输入，去掉当前员工独立随机 fallback；姓名旧算法适配遇重复名明确拒绝，不合并金额。
- [ ] 详情直接进入时也从 provider 获得原始小费，不依赖先访问汇总写的 sessionStorage。员工每日读取同一期间事实；已保存金额、考勤标签与工时快照仍优先历史值。
- [ ] 已未营业日期只读映射为全零；保持业务营业状态为权威输入。全部无打卡但存在订单不自动改为未营业。扩展全员场景用隔离日期/规则测试，不修改原营业设置。
- [ ] 运行 `node scripts/verify-tipout-scenario-data.mjs`、`node scripts/verify-tipout-attendance-label.mjs`、`node scripts/verify-tipout-employee-hours-contract.mjs`、`node scripts/verify-tipout-detail-confirm-allocation.mjs`，全部通过后提交接入代码。

### Task 3: 只读场景清单

**Interfaces:** `TipOutScenarioList.open({storeId,employees,todayKey,snapshotForDate,participates})` 使用 Task 1 API；两个回调只读现有快照、规则，返回快照存在布尔值及员工参与布尔值。由日期汇总入口传入，关闭时移除 DOM；runtime 销毁时清理弹框和监听器。

- [ ] 浏览器测试从日期汇总点击“测试场景清单”，断言全部当前门店员工均存在，即使员工/角色筛选已限制列表。

```js
await page.getByRole('button', {name:'测试场景清单',exact:true}).click();
await page.getByRole('dialog', {name:'测试场景清单',exact:true}).waitFor();
assert.equal(await page.locator('[data-scenario-employee-id]').evaluateAll(nodes => new Set(nodes.map(n => n.dataset.scenarioEmployeeId)).size), roster.length);
```

- [ ] 先运行浏览器测试，确认入口不存在时失败。
- [ ] 实现入口和 dialog：展示门店、演示数据说明、日期倒序清单、员工/日期/场景编号/考勤/订单数/原始小费/原始与有效工时/预期说明。有历史快照标注“已有快照，以历史结果为准”；规则不适用标注“未参与规则”。不提供更新或清空按钮。
- [ ] CSV 使用与弹框同一数组，正确转义引号、逗号、换行和 Excel 公式前缀，下载后 revokeObjectURL。员工姓名和规则名称使用 textContent，不插入未转义 HTML。

```js
function csvCell(value) {
  let s = String(value == null ? '' : value);
  if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
```

- [ ] 验证关闭、Escape、焦点回到入口、重复打开不重复监听、导出行数和 displayed 数据一致，提交清单与浏览器测试。

### Task 4: 隔离流程覆盖和权威文档

**Files:** 扩展 `scripts/verify-tipout-scenario-browser.cjs`，复用 `scripts/verify-tipout-quick-allocation-browser.cjs` 的隔离 runtime mount 方法；不操作用户浏览器 localStorage。

- [ ] 新建独立 `browser.newContext()`，复制当前目录结构的固定测试 roster/rules；记录初始化前后的快照和发放存储原文。用例覆盖自动分配、快速分配、脏编辑、取消离开、重新确认成功、storage失败、已发放锁定、重复提交。

```js
const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
await openScenarioList();
const after = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
assert.deepEqual(after, before);
```

- [ ] 明确提供 B01–B08、上限4/5/8→4/5/5、全员无打卡有订单、未营业、零池、0.01池、多人尾差、不同角色权重/多池 fixture；使用真正分配操作断言无打卡 received=0，原始有小费的 after 不被强行置0。尾差遵守当前算法契约，不擅改引擎。
- [ ] 流程失败用例只在隔离上下文拦截 storage/考勤读取；失败后快照原文相同，且不出现成功提示。核对汇总→详情→员工每日同一员工日的金额和工时。
- [ ] 覆盖报告列明基础事实覆盖、隔离规则覆盖、当前门店不适用规则、未验证项；不将隔离规则称为当前门店配置。
- [ ] 运行完整回归和构建：

```powershell
node scripts/verify-tipout-scenario-data.mjs
$env:TIPOUT_BROWSER_PACKAGES='C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node'
node scripts/verify-tipout-scenario-browser.cjs
node scripts/verify-tipout-quick-allocation-browser.cjs
node scripts/verify-tipout-payout-lock.mjs
node scripts/verify-tipout-confirm-allocation-store.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build --outDir .tmp/tipout-scenarios-build
```

- [ ] 读取权威 PRD 最新版本后增量追加“测试数据与验证边界”及版本记录；说明真实 POS 未接入、历史快照优先、八种事实场景及未打卡不从池分得。记录测试命令实际结果，不声称未运行测试通过。
- [ ] 检查 `git diff --check` 与 scoped diff，只提交本任务文件到本地 main；交付入口、覆盖报告、验证结果及尚未覆盖项。不自动推送 GitHub。

## 计划自检

基础场景、稳定日期、全部员工/身份隔离对应 Task 1；统一事实、POS修正、上限、快照保护对应 Task 2；清单与CSV对应 Task 3；多池/金额/整日/失败/流程状态和验证报告对应 Task 4。接口均在所属任务列出；新增提供器不负责分配状态，状态继续由真实操作与既有存储负责。
