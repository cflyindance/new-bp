# 小费默认规则与手动工时演示数据 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Golden Dragon 补齐“不打卡 + 按工时占比”默认规则，并让 2026-01-01 的合格未打卡员工在分配明细与员工对账中共享默认 6 小时补录数据。

**Architecture:** `ruleData.js` 负责幂等补齐固定规则 `5`；`TipOutManualHours` 增加只在记录缺失时写入的默认种子接口；分配明细依据规则接收方员工集合与考勤状态触发种子初始化。员工对账与导出继续只读取现有手动工时仓储，不增加页面级默认值。

**Tech Stack:** 原生 JavaScript、localStorage、Node.js 静态契约测试、Vite 原生页面运行时

**Spec:** `docs/superpowers/specs/2026-09-09-tipout-default-manual-hours-demo-data-design.md`

## Global Constraints

- 固定规则 ID 为数字 `5`；手动工时仓储中的 `ruleId` / `poolId` 为字符串 `"5"`。
- 只追加缺失的规则或工时记录，不覆盖已有规则与已有工时（包括显式 `0 h`）。
- 默认工时只适用于 Golden Dragon、2026-01-01、规则 `5` 的 Busser / Runner / Host 未打卡员工。
- 分配明细、员工对账和导出必须读取同一 `TipOutManualHours` 记录。
- 不创建考勤、班次或上下班时间，不批量重算历史金额。

---

### Task 1: 幂等补齐 Golden Dragon 默认规则

**Files:**
- Modify: `dist/TipOut/ruleData.js`
- Test: `scripts/verify-team-tips-default-manual-hours-demo.mjs`

**Interfaces:**
- Consumes: localStorage `tipout_rules`
- Produces: `ruleData.getRules()` 返回包含固定规则 ID `5` 的规则数组；已有 ID `5` 时原样保留

- [ ] **Step 1: 写失败测试**

创建测试并在 VM localStorage 桩中验证：空存储得到规则 `5`；已有自定义规则时追加规则 `5`；已有数字 `5` 或字符串 `"5"` 时不重复；其他规则内容与顺序不变。断言规则字段：

```js
assert.deepEqual(demoRule, {
  id: 5,
  ruleName: 'Tip Pool — 多角色分配（不打卡按工时）',
  store: 'Golden Dragon Chinese Kitchen - Dallas, TX 75231',
  poolRules: [{ type: 'tips', pct: 10 }],
  deductRoles: ['Server', 'Bartender', 'Cashier'],
  receivers: [
    { roles: ['Busser'], pct: 50 },
    { roles: ['Runner'], pct: 30 },
    { roles: ['Host'], pct: 20 }
  ],
  distribution: 'hours',
  clockin: 'noclock'
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-team-tips-default-manual-hours-demo.mjs`

Expected: FAIL，提示规则 `5` 不存在或未幂等补齐。

- [ ] **Step 3: 实现最小规则迁移**

在 `ruleData.js` 中定义默认规则 `5`，并让 `getRules()` 对已解析数组执行：

```js
function ensureDefaultDemoRules(rules) {
  var list = Array.isArray(rules) ? rules : [];
  if (list.some(function(rule) { return String(rule && rule.id) === '5'; })) return list;
  var next = list.slice();
  next.push(JSON.parse(JSON.stringify(defaultRules.find(function(rule) { return rule.id === 5; }))));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
```

空存储初始化与已有存储读取均经过该函数。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node scripts/verify-team-tips-default-manual-hours-demo.mjs`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add dist/TipOut/ruleData.js scripts/verify-team-tips-default-manual-hours-demo.mjs
git commit -m "feat: seed Golden Dragon manual hours rule"
```

### Task 2: 增加不覆盖已有值的工时种子接口

**Files:**
- Modify: `src/team/tips/legacy/tipout-manual-hours-store.js.txt`
- Test: `scripts/verify-team-tips-manual-hours-store.mjs`

**Interfaces:**
- Consumes: 标准手动工时 entry
- Produces: `TipOutManualHours.seed(entry): boolean`；记录缺失时追加并返回 `true`，主键已存在时不写入并返回 `false`

- [ ] **Step 1: 扩展失败测试**

增加断言：

```js
assert.equal(store.seed({ ruleId: 5, poolId: 5, dateKey: '2026-01-01', employeeName: 'Carlos Lopez', hours: 6 }), true);
assert.equal(store.get('5', '2026-01-01', 'Carlos Lopez').hours, 6);
store.set({ ruleId: '5', poolId: '5', dateKey: '2026-01-01', employeeName: 'Carlos Lopez', hours: 0 });
assert.equal(store.seed({ ruleId: 5, poolId: 5, dateKey: '2026-01-01', employeeName: 'Carlos Lopez', hours: 6 }), false);
assert.equal(store.get('5', '2026-01-01', 'Carlos Lopez').hours, 0);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-team-tips-manual-hours-store.mjs`

Expected: FAIL，`store.seed` 不存在。

- [ ] **Step 3: 实现 `seed`**

在仓储闭包中复用 `normalize`、`identity` 和 `read`：

```js
function seed(entry) {
  var normalized = normalize(entry);
  if (!normalized) return false;
  var rows = read().map(normalize).filter(Boolean);
  if (rows.some(function(row) { return identity(row) === identity(normalized); })) return false;
  rows.push(normalized);
  global.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  return true;
}
```

将 `seed` 暴露到 `global.TipOutManualHours`。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node scripts/verify-team-tips-manual-hours-store.mjs`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/team/tips/legacy/tipout-manual-hours-store.js.txt scripts/verify-team-tips-manual-hours-store.mjs
git commit -m "feat: add idempotent manual hour seeding"
```

### Task 3: 从分配明细生成默认 6 小时补录记录

**Files:**
- Modify: `src/team/tips/programs/details.js.txt`
- Test: `scripts/verify-team-tips-default-manual-hours-demo.mjs`

**Interfaces:**
- Consumes: 规则 `5`、日期 `2026-01-01`、`buildRoleConfigFromRule(rule)`、`TipOutAttendance.getDayStatus(name, dateKey)`、`TipOutManualHours.seed(entry)`
- Produces: `seedDefaultManualHoursForDetail(rule, ruleId, dateKey)`；只为 Busser / Runner / Host 中未打卡员工补录标准 entry

- [ ] **Step 1: 扩展失败测试**

通过 VM 或源码契约验证种子函数满足以下矩阵：

```js
// 规则5 + 目标日期 + 未打卡接收方 => seed 6h
// 已打卡接收方 => 不 seed
// 扣除方 Server => 不 seed
// 非目标日期、非规则5、非 Golden Dragon => 不 seed
// seed 返回 false 时仍读取既有值，绝不调用 set 覆盖
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/verify-team-tips-default-manual-hours-demo.mjs`

Expected: FAIL，详情页没有默认工时种子逻辑。

- [ ] **Step 3: 实现种子初始化**

新增精确条件常量与函数。在生成规则 `5` 的详情员工表格前调用一次：

```js
function seedDefaultManualHoursForDetail(rule, ruleId, dateKey) {
  if (!rule || String(ruleId) !== '5' || dateKey !== '2026-01-01' ||
      rule.store !== 'Golden Dragon Chinese Kitchen - Dallas, TX 75231' ||
      rule.clockin !== 'noclock' || rule.distribution !== 'hours' ||
      !window.TipOutManualHours || !TipOutManualHours.seed) return;
  buildRoleConfigFromRule(rule).forEach(function(group) {
    group.employees.forEach(function(employeeName) {
      var attendance = window.TipOutAttendance && TipOutAttendance.getDayStatus
        ? TipOutAttendance.getDayStatus(employeeName, dateKey)
        : { clockStatus: '未打卡' };
      if (attendance.clockStatus !== '未打卡') return;
      TipOutManualHours.seed({
        poolId: '5', poolName: rule.ruleName, ruleId: '5', ruleName: rule.ruleName,
        dateKey: dateKey, employeeName: employeeName, hours: 6
      });
    });
  });
}
```

调用发生在 `getDetailEmployeeHours` 读取前，并保持现有输入修改走 `TipOutManualHours.set`。

- [ ] **Step 4: 运行详情与仓储测试**

Run: `node scripts/verify-team-tips-default-manual-hours-demo.mjs`

Run: `node scripts/verify-team-tips-manual-hours-store.mjs`

Expected: 两项 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/team/tips/programs/details.js.txt scripts/verify-team-tips-default-manual-hours-demo.mjs
git commit -m "feat: seed detail manual hours demo data"
```

### Task 4: 验证员工对账与全部出口共享补录记录

**Files:**
- Test: `scripts/verify-team-tips-default-manual-hours-demo.mjs`
- Verify: `src/team/tips/programs/distribution.js.txt`
- Verify: `src/team/tips/programs/employee-reconciliation.js.txt`

**Interfaces:**
- Consumes: `TipOutManualHours.listForEmployee(dateKey, employeeName)` 返回规则 `5` 的标准 entry
- Produces: 对账行 `manualHourEntries`、工时 `6 h`、“录入”标签以及同步的导出数据

- [ ] **Step 1: 添加跨页面契约断言**

断言 distribution 仍通过 `listForEmployee` 填充 `row.manualHourEntries`；员工详情通过 `summarizeDayAttendance` 把 entry 转换为 `6 h` 与 `录入`；导出路径从同一对账行读取，不存在规则 `5` 或 2026-01-01 的页面级硬编码 fallback。

- [ ] **Step 2: 运行完整小费相关测试**

Run: `node scripts/verify-team-tips-default-manual-hours-demo.mjs`

Run: `node scripts/verify-team-tips-employee-punch-sessions.mjs`

Run: `node scripts/verify-team-tips-employee-manual-hours-view.mjs`

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: 全部 PASS。

- [ ] **Step 3: 运行构建**

Run: `npm.cmd run build`

Expected: 构建成功退出；本次不修改 `vendor/emenu-new`，因此无需执行 eMenu 嵌入包发布命令。

- [ ] **Step 4: 浏览器验收**

在原生页面验证：

1. Golden Dragon 规则列表出现规则 `5`。
2. 打开 2026-01-01 日期明细，未打卡的 Busser / Runner / Host 显示默认 `6 h`。
3. 修改其中一名员工为 `0 h`，刷新后仍为 `0 h`。
4. 返回员工对账，该员工 2026-01-01 显示“未打卡”、对应工时和“录入”标签；上下班时间仍为 `—`。

- [ ] **Step 5: 提交测试收尾**

```bash
git add scripts/verify-team-tips-default-manual-hours-demo.mjs
git commit -m "test: verify manual hours demo data flow"
```

## Self-Review

- Spec coverage: 规则追加、固定 ID、资格范围、仓储幂等、详情补录、对账读取、导出一致、历史金额边界均有对应任务。
- Placeholder scan: 无 TBD、TODO 或省略实现步骤。
- Type consistency: 规则 ID 在规则数据为 `5`，跨仓储边界统一转为 `"5"`；日期与员工键沿用现有字段。
