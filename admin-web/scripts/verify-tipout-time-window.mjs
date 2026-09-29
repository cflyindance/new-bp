import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('../src/team/tips/legacy/tipout-employee-weights.js.txt',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('../src/team/tips/legacy/tipout-time-window.js.txt', import.meta.url), 'utf8'), context);
const engine = context.window.TipOutTimeWindow;
const employee = (id, role, sessions, orders = []) => ({ employeeId: id, name: id, role,
  attendance: { punchSessions: sessions.map(([start, end]) => ({ status: 'complete', clockInAt: start, clockOutAt: end })) }, orders });
const at = time => `2026-09-28T${time}:00-05:00`;
const facts = [
  employee('A', 'Server', [[at('18:00'), at('19:00')]]),
  employee('B', 'Server', [[at('18:00'), at('21:00')]]),
  employee('C', 'Server', [[at('18:00'), at('22:00')]])
];
const event = (id, time, amount) => ({ id, occurredAt: at(time), timeZone: 'America/Chicago', source: 'order', amount });
const result = engine.allocate([event('one', '18:30', 30), event('two', '19:30', 40), event('three', '21:30', 20)], facts);
assert.deepEqual(JSON.parse(JSON.stringify(result.employeeAmounts)), [{ employeeId: 'A', amount: 10 }, { employeeId: 'B', amount: 30 }, { employeeId: 'C', amount: 50 }]);
assert.equal(engine.allocate([event('boundary', '19:00', 30)], facts).lines[0].participants.some(p => p.employeeId === 'A'), false);
assert.equal(engine.allocate([event('none', '23:00', 1)], facts).unallocated, 1);
assert.equal(engine.allocate([event('cents', '18:30', 0.01)], facts).lines[0].participants.reduce((sum, p) => sum + p.amount, 0), 0.01);
assert.throws(() => engine.allocate([{ id: 'missing', amount: 1 }], facts), /时间/);
assert.throws(() => engine.allocate([event('invalid', '18:30', 1)], [employee('x', 'Server', [[at('18:00'), at('17:00')]])]), /结束时间/);
const incomplete = employee('unknown', 'Server', [[at('18:00'), at('19:00')]]);
incomplete.attendance.punchSessions.push({ status: 'missing-clock-out', clockInAt: at('20:00') });
assert.equal(engine.allocate([event('before-unknown', '18:30', 1)], [incomplete]).employeeAmounts[0].amount, 1);
assert.throws(() => engine.allocate([event('during-unknown', '20:30', 1)], [incomplete]), /不完整/);
const midnight = [employee('late', 'Server', [['2026-09-28T23:00:00-05:00', '2026-09-29T01:00:00-05:00']])];
assert.equal(engine.allocate([{ id: 'overnight', occurredAt: '2026-09-29T00:30:00-05:00', amount: 2, timeZone: 'America/Chicago' }], midnight).employeeAmounts[0].amount, 2);
const overnightFact = { ...midnight[0], dateKey: '2026-09-28', orders: [{ id: 'overnight-order', businessDate: '2026-09-28',
  completedPaymentAt: '2026-09-29T00:30:00-05:00', timeZone: 'America/Chicago', tipAmount: 2 }] };
assert.equal(engine.allocateRule({ distribution: 'average', receivers: [{ roles: ['Server'], pct: 100 }],
  poolRules: [{ type: 'tips', pct: 100 }] }, [overnightFact], '2026-09-28').employeeAmounts[0].amount, 2);
const orderFacts = [
  employee('x', 'Server', [[at('18:00'), at('20:00')]], [{ completedPaymentAt: at('18:10') }, { completedPaymentAt: at('18:20') }]),
  employee('y', 'Server', [[at('18:00'), at('20:00')]], [{ completedPaymentAt: at('18:30') }])
];
assert.deepEqual(JSON.parse(JSON.stringify(engine.allocate([event('weighted', '19:00', 30)], orderFacts, { distribution: 'orders' }).employeeAmounts)),
  [{ employeeId: 'x', amount: 20 }, { employeeId: 'y', amount: 10 }]);
const segmentedOrders = [
  employee('x', 'Server', [[at('18:00'), at('20:00')]], [{ completedPaymentAt: at('18:10') }, { completedPaymentAt: at('19:10') }]),
  employee('y', 'Server', [[at('19:00'), at('20:00')]], [{ completedPaymentAt: at('19:20') }])
];
assert.deepEqual(JSON.parse(JSON.stringify(engine.allocate([event('slice', '19:30', 20)], segmentedOrders, { distribution: 'orders' }).employeeAmounts)),
  [{ employeeId: 'x', amount: 10 }, { employeeId: 'y', amount: 10 }], 'orders before the 19:00 shift boundary do not weight this tip');
assert.equal(engine.allocate([event('hours', '19:30', 20)], segmentedOrders, { distribution: 'hours' }).lines[0].windowStartAt,
  '2026-09-29T00:00:00.000Z');
const rule = { distribution: 'average', receivers: [{ roles: ['Server'], pct: 100 }],
  poolRules: [{ id: 'formula', type: 'tips', pct: 50, conditions: {} }] };
const sourceFacts = [employee('x', 'Server', [[at('18:00'), at('20:00')]], [{ id: 'order', completedPaymentAt: at('19:00'), timeZone: 'America/Chicago', tipAmount: 10 }])];
const calculated = engine.allocateRule(rule, sourceFacts, '2026-09-28');
const hoursRule={...rule,distribution:'hours',clockin:'time_window',workHoursConfig:{mode:'actual',maxHoursPerDay:null}};
const lateFacts=[employee('late','Server',[[at('18:00'),at('22:00')]], [{id:'late-tip',completedPaymentAt:at('21:00'),timeZone:'America/Chicago',tipAmount:10}])];
assert.equal(engine.allocateRule(hoursRule,lateFacts,'2026-09-28').employeeAmounts[0].amount,5);
const unchanged=JSON.stringify(lateFacts);
assert.throws(()=>engine.allocateRule({...hoursRule,workHoursConfig:{mode:'capped',maxHoursPerDay:2}},lateFacts,'2026-09-28'),/编辑规则并确认取消上限/);
assert.equal(JSON.stringify(lateFacts),unchanged);
assert.equal(calculated.poolAmount, 5);
assert.equal(calculated.employeeAmounts[0].amount, 5);
assert.throws(() => engine.allocateRule(rule, [employee('x', 'Server', [[at('18:00'), at('20:00')]], [{ id: 'order', tipAmount: 10 }])], '2026-09-28'), /时间/);
assert.throws(() => engine.allocateRule(rule, [employee('x', 'Server', [[at('18:00'), at('20:00')]], [
  { id: 'same', completedPaymentAt: at('19:00'), timeZone: 'America/Chicago', tipAmount: 1 },
  { id: 'same', completedPaymentAt: at('19:01'), timeZone: 'America/Chicago', tipAmount: 1 }
])], '2026-09-28'), /重复/);
vm.runInContext(fs.readFileSync(new URL('../src/team/tips/legacy/tipout-funding.js.txt', import.meta.url), 'utf8'), context);
const funding = context.window.TipOutFunding;
const donorFacts = facts.map((f, index) => ({ ...f, orderTips: 0, reportedTips: index === 0 ? 30 : 0,
  originalTips: index === 0 ? 30 : 0,
  reportedTipEvents: index === 0 ? [{ id: 'reported', employeeId: 'A', amount: 30, occurredAt: at('18:30'), timeZone: 'America/Chicago' }] : [] }));
const legacyRule = { id: 'window-rule', ruleName: '按发生时段', poolKind: 'tip', allocationMode: 'legacy_pool',
  distribution: 'average', clockin: 'time_window', poolRules: [{ id: 'manual', type: 'manual', pct: 100, conditions: {} }],
  deductRoles: ['Server'], receivers: [{ roles: ['Server'], pct: 100 }] };
const distributed = engine.allocateRule(legacyRule, donorFacts, '2026-09-28');
const snapshot = { store: 'test', dateKey: '2026-09-28', scenarioFacts: donorFacts,
  pools: [{ ruleId: 'window-rule', poolAmount: distributed.poolAmount, timeWindow: distributed,
    employees: distributed.employeeAmounts.map(e => ({ ...e, percentage: 0, hours: 0 })) }] };
const reconciled = funding.reconcileExisting(snapshot, [legacyRule]);
assert.equal(reconciled.summary.poolAmount, 30);
assert.equal(reconciled.summary.allocatedAmount, 30);
assert.throws(() => funding.reconcileExisting({ ...snapshot, pools: [{ ...snapshot.pools[0], timeWindow: undefined }] }, [legacyRule]), /缺少逐笔/);
console.log('tipout time-window verification passed');
