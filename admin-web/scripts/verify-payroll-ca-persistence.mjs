import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/team/payroll/legacy/payroll.js.txt',import.meta.url),'utf8');
function extract(name,next){const a=source.indexOf(`  function ${name}(`);return source.slice(a,source.indexOf(`  function ${next}(`,a));}
const oldData={employees:{p:[]}};
const saved={employees:{p:[{id:'a',californiaOvertimeInput:{jurisdiction:'US-CA'},californiaOvertimeSnapshot:{status:'ready'}}]}};
const state={data:oldData};
const context={state,window:{PayrollPeriodCalendar:{migrateSnapshot(data,selection){return {snapshot:structuredClone(data),selection:structuredClone(selection)}}}},Date,PAYROLL_PERIOD_STATUS_SEED:{},migratePayrollData(){},ensureDataShape(){},console};
vm.runInNewContext(extract('applySnapshot','ensureDataShape')+';applySnapshot(input)',{...context,input:{data:saved}});
assert.deepEqual(state.data,saved,'Loaded payroll data must win over the state clone inside calendar selection');
const frozen={id:'a',adpFile:'1',name:'A',confirmed:true,californiaOvertimeSnapshot:{status:'ready'},segments:[],rate:20};
const input={p:[structuredClone(frozen)]};
vm.runInNewContext(extract('syncEmployeesFromUnifiedRoster','calcPeriodStatus')+';syncEmployeesFromUnifiedRoster(input)',{input,getUnifiedRoster:()=>[{adpFile:'1',name:'A',rate:99}],cloneData:structuredClone});
assert.deepEqual(input.p[0],frozen,'Roster refresh must preserve confirmed California wages');
console.log('PASS loaded snapshot persistence and confirmed California roster protection.');
