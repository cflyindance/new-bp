import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = { window: {}, Date, Math };
context.window.localStorage = { setItem() { throw Error('Facts must be read-only'); } };
vm.runInNewContext(fs.readFileSync(new URL('../src/team/tips/legacy/tipout-scenario-data.js.txt', import.meta.url), 'utf8'), context);
const api = context.window.TipOutScenarioData;
const plain = value => JSON.parse(JSON.stringify(value));
const employee = { id: 'e1', name: '同名员工', role: 'Server' };
const input = { storeId: 's1', employee, dateKey: '2026-09-23' };
const dates = api.monthDates(input.dateKey);
assert.equal(dates[0], '2026-08-23');
assert.equal(dates.at(-1), input.dateKey);
assert.equal(api.monthDates('2026-03-31')[0], '2026-02-28');
assert.equal(api.monthDates('2024-03-31')[0], '2024-02-29');
assert.equal(api.monthDates('2026-01-15')[0], '2025-12-15');
for (let id = 0; id < 40; id++) {
  const facts = dates.map(dateKey => api.fact({ ...input, employee: { ...employee, id: 'e' + id }, dateKey }));
  assert.equal(new Set(facts.map(f => f.scenarioId)).size, 8);
  for (const f of facts) {
    const index = Number(f.scenarioId.slice(1)) - 1;
    assert.equal(f.attendance.punchSessions.length > 0, index < 4);
    assert.equal(f.orders.length > 0, index % 4 < 2);
    assert.equal(f.originalTips > 0, index % 2 === 0);
    assert.equal(Math.round(f.originalTips * 100), Math.round(f.orderTips * 100) + Math.round(f.reportedTips * 100));
    assert.equal(Math.round(f.salesAmount * 100), f.orders.reduce((sum, order) => sum + Math.round(order.salesAmount * 100), 0));
    assert.equal(Math.round(f.orderTips * 100), f.orders.reduce((sum, order) => sum + Math.round(order.tipAmount * 100), 0));
    if (!f.orders.length) assert.equal(f.salesAmount, 0);
    if (index >= 4) assert.equal(f.attendance.effectiveHours, 0);
  }
}
assert.deepEqual(plain(api.fact(input)), plain(api.fact(input)));
const original = api.fact(input);
original.attendance.punchSessions.push({ bad: true });
assert.notDeepEqual(plain(original), plain(api.fact(input)));
assert.notEqual(api.fact(input).key, api.fact({ ...input, storeId: 's2' }).key);
assert.notEqual(api.fact(input).key, api.fact({ ...input, employee: { ...employee, id: 'e2' } }).key);
assert.deepEqual(plain(api.day({ storeId: 's1', employees: [employee], dateKey: input.dateKey })[0]), plain(api.day({ storeId: 's1', employees: [{ ...employee, id: 'extra' }, employee], dateKey: input.dateKey })[1]));
for (const dateKey of ['2026-02-30', '2026-13-01', '2026-2-01', 'bad']) assert.throws(() => api.fact({ ...input, dateKey }));
assert.throws(() => api.fact({ ...input, storeId: '' }));
assert.throws(() => api.fact({ ...input, employee: { name: 'No ID' } }));
assert.throws(() => api.day({ storeId: 's1', employees: [employee, employee], dateKey: input.dateKey }));
const extended = Array.from({ length: 120 }, (_, n) => api.fact({ ...input, employee: { ...employee, id: 'extended-' + n } })).filter(f => f.attendance.punchSessions.length);
assert.ok(extended.some(f => f.attendance.originalHours === 8 && f.attendance.effectiveHours === 10));
assert.ok(extended.some(f => f.attendance.clockStatus === '打卡异常'));
assert.ok(extended.some(f => f.attendance.punchSessions.length === 2 && f.attendance.clockStatus === '已打卡'));
console.log('PASS: 40 employees × month, B01–B08, identity isolation, stable facts, amount reconciliation, attendance variants, calendar boundaries, read-only generation');

const roster = [employee, { ...employee, id:'e2' }].map(e=>({...e,store:'s1'}));
context.document = { getElementById: () => ({value:'s1'}) };
context.window.localStorage.getItem = () => JSON.stringify(roster);
context.window.TipOutRosterDirectory = { canonicalRosterStoreName:value=>value };
context.window.TipOutBusinessStatus = { isDemoClosedDate:date=>date==='2026-09-17' };
for (const file of ['tipout-scenario-source','attendanceMock','tipout-date-pool-view']) {
  vm.runInNewContext(fs.readFileSync(new URL('../src/team/tips/legacy/'+file+'.js.txt',import.meta.url),'utf8'), context);
}
const source = context.window.TipOutScenarioSource;
assert.throws(()=>source.employee(employee.name,input.dateKey),/同名员工/);
assert.equal(source.employee(employee.name,input.dateKey,{employeeId:'roster:e1',storeId:'s1'}).employeeId,'e1');
assert.equal(source.day('2026-09-17').every(f=>f.closed && f.salesAmount===0 && f.originalTips===0 && f.attendance.hours===0),true);
const poolA = context.window.TipOutDatePoolView.buildDayData(input.dateKey,[{type:'tips',pct:10}],'a');
const poolB = context.window.TipOutDatePoolView.buildDayData(input.dateKey,[{type:'tips',pct:20}],'b');
assert.equal(poolA.tips,poolB.tips);
assert.equal(poolA.sales,source.totals(source.day(input.dateKey)).sales);
assert.equal(poolA.employeeSales.length,roster.length);
assert.deepEqual(plain(context.window.TipOutAttendance.getDayStatus(employee.name,input.dateKey,{employeeId:'e1',storeId:'s1'})),plain(api.fact(input).attendance));
console.log('PASS: page adapters share facts, ambiguous names rejected, closed day zeroed, pool inputs independent of rule salt');
