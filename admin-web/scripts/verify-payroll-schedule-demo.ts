import assert from 'node:assert/strict';
import { addScheduleDays, createPayrollScheduleDemo, generateDemoPeriods, type PayrollDemoScenario } from '../src/team/payroll/payroll-schedule-demo';
for (const scenario of ['weekly','biweekly','semimonthly','monthly','custom','switch','transition'] as PayrollDemoScenario[]) {
  const periods = generateDemoPeriods(scenario, 2027);
  for (let i = 1; i < periods.length; i++) assert.equal(periods[i].startDate, addScheduleDays(periods[i-1].endDate!, 1));
  assert.ok(periods.every(p => p.endDate!.startsWith('2027')));
  const data = createPayrollScheduleDemo(scenario, 'test-store');
  assert.ok(data.demo);
  assert.ok(Object.values(data.employees).every(list => list.length === 3 && list[2].segments.length === 0 && list[2].adjustments.tips === 15));
  console.log(scenario, periods.length);
}
assert.equal(generateDemoPeriods('biweekly', 2026).find(p=>p.startDate==='2026-01-04')?.periodNumber,2);
assert.equal(generateDemoPeriods('switch', 2027).find(p=>p.startDate==='2027-07-01')?.periodNumber,15);
assert.equal(generateDemoPeriods('transition', 2027).find(p=>p.startDate==='2027-09-01')?.endDate,'2027-09-04');
assert.equal(generateDemoPeriods('monthly',2028)[1].endDate,'2028-02-29');
const one=createPayrollScheduleDemo('monthly','one'),two=createPayrollScheduleDemo('monthly','two');
one.employees[one.periods[0].id][0].name='changed';
assert.notEqual(two.employees[two.periods[0].id][0].name,'changed');
console.log('Payroll scenario generation passed');
