import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function createStorage(initial = {}) {
  const memory = { ...initial };
  return {
    memory,
    api: {
      getItem: key => memory[key] ?? null,
      setItem: (key, value) => { memory[key] = String(value); }
    }
  };
}

function loadRuleData(initial = {}) {
  const storage = createStorage(initial);
  const context = { localStorage: storage.api };
  context.window = context;
  vm.runInNewContext(fs.readFileSync('src/team/tips/legacy/ruleData.js.txt', 'utf8'), context);
  return { rules: context.ruleData.getRules(), storage };
}

const fresh = loadRuleData();
const demoRule = fresh.rules.find(rule => String(rule.id) === '5');
assert.ok(demoRule, 'Golden Dragon manual-hours demo rule should be seeded');
assert.equal(demoRule.ruleName, 'Tip Pool — 多角色分配（不打卡按工时）');
assert.equal(demoRule.store, 'Golden Dragon Chinese Kitchen - Dallas, TX 75231');
assert.equal(demoRule.distribution, 'hours');
assert.equal(demoRule.clockin, 'noclock');
assert.deepEqual(Array.from(demoRule.poolRules, item => ({ ...item })), [{ type: 'tips', pct: 10 }]);
assert.deepEqual(Array.from(demoRule.deductRoles), ['Server', 'Bartender', 'Cashier']);
assert.deepEqual(Array.from(demoRule.receivers, item => ({ roles: Array.from(item.roles), pct: item.pct })), [
  { roles: ['Busser'], pct: 50 },
  { roles: ['Runner'], pct: 30 },
  { roles: ['Host'], pct: 20 }
]);

const customRules = [{ id: 88, ruleName: '保留规则', store: '测试门店' }];
const migrated = loadRuleData({ tipout_rules: JSON.stringify(customRules) });
assert.equal(migrated.rules.length, 2);
assert.equal(migrated.rules[0].ruleName, '保留规则');
assert.equal(String(migrated.rules[1].id), '5');

for (const id of [5, '5']) {
  const existing = { id, ruleName: '用户已有规则 5', store: '自定义门店' };
  const result = loadRuleData({ tipout_rules: JSON.stringify([existing]) });
  assert.equal(result.rules.length, 1, `rule id ${JSON.stringify(id)} must not duplicate`);
  assert.equal(result.rules[0].ruleName, '用户已有规则 5');
}

const detail = fs.readFileSync('src/team/tips/programs/details.js.txt', 'utf8');
for (const token of [
  'function seedDefaultManualHoursForDetail',
  "String(ruleId) !== '5'",
  "dateKey !== '2026-01-01'",
  "rule.store !== 'Golden Dragon Chinese Kitchen - Dallas, TX 75231'",
  "attendance.clockStatus !== '未打卡'",
  'buildRoleConfigFromRule(rule)',
  'TipOutManualHours.seed({',
  "hours: 6"
]) assert.ok(detail.includes(token), `details demo seed contract missing: ${token}`);

const distribution = fs.readFileSync('src/team/tips/programs/distribution.js.txt', 'utf8');
assert.ok(distribution.includes("TipOutManualHours.listForEmployee(dateKey, { employeeId: String(emp.employeeId || '').replace(/^roster:/, ''), name: emp.name })"), 'employee reconciliation must read manual hours by stable employee id');
assert.ok(!distribution.includes("dateKey === '2026-01-01'"), 'distribution must not hard-code the demo date');

console.log('Default manual-hours demo data verification passed.');
