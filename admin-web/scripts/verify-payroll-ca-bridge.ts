import assert from 'node:assert/strict';
import {applyCaliforniaPayroll,resolveCaliforniaPayroll,renderCaliforniaSummary,buildCaliforniaPayrollInput} from '../src/team/payroll/payroll-ca-bridge';
const segments=Array.from({length:7},(_,i)=>({date:`11/${9+i}/2026`,slots:[{in:i<6?'09:00':'',out:i<6?'17:00':''}],reg:i<6?8:0,ot:0,ot2:0,rate:20,paidMealBreak:'',unpaidMealBreak:''}));
const employee:any={id:'a',store:'store-a',name:'Employee',rate:20,segments,adjustments:{}};
const period={startDate:'2026-11-09',endDate:'2026-11-15'};
assert.equal(resolveCaliforniaPayroll(employee,period),null);
assert.throws(()=>buildCaliforniaPayrollInput(employee,period,[],20,false));
employee.californiaOvertimeInput=buildCaliforniaPayrollInput(employee,period,[],20,true);
const before=JSON.stringify(employee);const result=resolveCaliforniaPayroll(employee,period);assert.equal(JSON.stringify(employee),before);
assert.equal(result?.status,'ready');if(result?.status!=='ready')throw Error('expected ready');
assert.equal(result.totalAmount,1040);assert.match(renderCaliforniaSummary(result,false),/每周加班/);
applyCaliforniaPayroll(employee,period);assert.equal(employee.segments[5].ot,8);assert.equal(employee.segments[5].reg,0);assert.equal(employee.segments[5].otRate,30);
const snapshot=structuredClone(result);employee.confirmed=true;employee.californiaOvertimeSnapshot=snapshot;employee.californiaOvertimeInput.days[0].regularRate=500;
assert.deepEqual(resolveCaliforniaPayroll(employee,period),snapshot);const confirmed=JSON.stringify(employee.segments);applyCaliforniaPayroll(employee,period);assert.equal(JSON.stringify(employee.segments),confirmed);
employee.confirmed=false;employee.californiaOvertimeInput=buildCaliforniaPayrollInput(employee,period,[],20,true);
for(const invalid of ['abc','0:99','-1','0.5']){
  employee.segments[0].unpaidMealBreak=invalid;
  assert.equal(resolveCaliforniaPayroll(employee,period)?.status,'blocked');
}
employee.segments[0].unpaidMealBreak='';
employee.segments[0].paidMealBreak='0:15';assert.equal(resolveCaliforniaPayroll(employee,period)?.status,'blocked');employee.segments[0].paidMealBreak='';
employee.adjustments.incentive=20;assert.equal(resolveCaliforniaPayroll(employee,period)?.status,'blocked');employee.adjustments.incentive=0;
assert.equal(resolveCaliforniaPayroll(employee,{...period,endDate:'2026-11-16'})?.status,'blocked');
employee.segments.pop();assert.equal(resolveCaliforniaPayroll(employee,period)?.status,'blocked');
console.log('PASS CA runtime opt-in, source validation, projection, frozen wages, blocked special compensation and missing days.');
