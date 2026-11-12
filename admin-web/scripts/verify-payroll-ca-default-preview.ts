import assert from 'node:assert/strict';
import {createPayrollScheduleDemo} from '../src/team/payroll/payroll-schedule-demo';
import {resolveCaliforniaPayroll,californiaPayrollStatusMessage} from '../src/team/payroll/payroll-ca-bridge';
const data=createPayrollScheduleDemo('biweekly','test-store');
const period=data.periods.find(p=>p.startDate!<='2027-07-01'&&p.endDate!>='2027-07-01')!;
const employee=data.employees[period.id][0];
assert.ok(employee.californiaOvertimeInput,'Default demo must explicitly configure California overtime');
const result=resolveCaliforniaPayroll(employee,period);
assert.equal(result?.status,'ready','Default preview must be computable');
if(result?.status!=='ready')throw Error('Expected ready');
for(const kind of ['daily','daily-double','weekly','seventh-day'])assert.ok(result.slices.some(s=>s.kind===kind&&s.minutes>0),kind);
assert.equal(result.totalHours,112);
assert.equal(result.totalAmount,2600);
assert.equal(data.employees[period.id][1].californiaOvertimeInput,undefined,'Other employees must not be silently enabled');
assert.equal(resolveCaliforniaPayroll({...employee,confirmed:false,californiaOvertimeInput:undefined},period),null);
assert.match(californiaPayrollStatusMessage({},null),/未启用.*更多 → 编辑/);
assert.match(californiaPayrollStatusMessage({confirmed:true},null),/已确认的历史薪资结果/);
assert.ok(!californiaPayrollStatusMessage({confirmed:true},null).includes('编辑'));
assert.equal(californiaPayrollStatusMessage(employee,result),'');
assert.equal(californiaPayrollStatusMessage(employee,{status:'blocked',reason:'missing coverage',slices:[],totalHours:null,totalAmount:null}),'missing coverage');
assert.equal(new Set(employee.californiaOvertimeInput!.days.map(d=>d.date)).size,14);
assert.equal(employee.californiaOvertimeInput!.days.reduce((n,d)=>n+d.workedMinutes,0),112*60);
assert.equal(employee.segments.reduce((n,d)=>n+Number(d.reg)+Number(d.ot)+Number(d.ot2),0),112);
for(const scenario of ['weekly','semimonthly','monthly','custom','switch','transition'] as const){
  const demo=createPayrollScheduleDemo(scenario,'test-store');
  for(const p of demo.periods){
    const e=demo.employees[p.id][0];
    assert.equal(resolveCaliforniaPayroll(e,p)?.status,'ready',p.id);
    assert.ok(e.californiaOvertimeInput!.days[0].date<=p.startDate!);
    assert.ok(e.californiaOvertimeInput!.days.at(-1)!.date>=p.endDate!);
  }
}
console.log('PASS default California preview, four rule entries, totals and non-enabled isolation.');
