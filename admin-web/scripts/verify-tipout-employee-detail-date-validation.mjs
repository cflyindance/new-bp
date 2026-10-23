import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function extract(source,name) {
 const start=source.match(new RegExp('^( *)(?:async )?function '+name+'\\([^\\n]*?\\) \\{','m'));
 assert.ok(start,name+' exists');
 const rest=source.slice(start.index+start[0].length),end=rest.match(new RegExp('^'+start[1]+'\\}','m'));
 assert.ok(end);return start[0]+rest.slice(0,end.index)+end[0];
}

const source=fs.readFileSync('src/team/tips/programs/employee-reconciliation.js.txt','utf8');
const els={employeeDetailStartDate:{value:'2026-10-19'},employeeDetailEndDate:{value:'2026-10-23'},employeeDetailDateRangeError:{hidden:true,textContent:''}};
for(const e of Object.values(els)){e.attrs={};e.setAttribute=(k,v)=>e.attrs[k]=v;e.removeAttribute=k=>delete e.attrs[k];e.focus=()=>e.focused=true;}
const c={window:{},document:{getElementById:id=>els[id]},employeeDetailViewState:{snapshot:{dateStart:'2026-10-19',dateEnd:'2026-10-23'},range:{start:'2026-10-19',end:'2026-10-23'}}};
vm.createContext(c);vm.runInContext(fs.readFileSync('src/team/tips/legacy/tipout-summary-date-sort.js.txt','utf8'),c);c.TipOutSummaryDateSort=c.window.TipOutSummaryDateSort;
vm.runInContext(extract(source,'validateEmployeeDetailDateRange'),c);
assert.equal(c.validateEmployeeDetailDateRange(c.employeeDetailViewState.snapshot,true),true);
for(const [a,b,msg]of [['','2026-10-23','请选择开始日期'],['2026-10-19','','请选择结束日期'],['2026-10-24','2026-10-23','开始日期不能晚于结束日期'],['2026-10-18','2026-10-23','日期范围不能超出'],['2026-10-19','2026-10-24','日期范围不能超出']]){
 els.employeeDetailStartDate.value=a;els.employeeDetailEndDate.value=b;
 assert.equal(c.validateEmployeeDetailDateRange(c.employeeDetailViewState.snapshot,true),false);
 assert.ok(els.employeeDetailDateRangeError.textContent.includes(msg));
 assert.ok(els.employeeDetailDateRangeError.textContent.includes('仍显示'));
}
els.employeeDetailStartDate.value='2026-10-20';els.employeeDetailEndDate.value='2026-10-20';
assert.equal(c.validateEmployeeDetailDateRange(c.employeeDetailViewState.snapshot,true),true);
assert.equal(els.employeeDetailDateRangeError.hidden,true);
els.employeeDetailStartDate.value='';
vm.runInContext(extract(source,'renderEmployeeDetailRange'),c);
assert.equal(c.renderEmployeeDetailRange(c.employeeDetailViewState.snapshot,'start'),false,'invalid range stops before reading rows');
for(const name of ['toggleEmployeeDetailExportMenu','collectEmployeeDetailExportData','sendEmployeeDetailEmail']){
 vm.runInContext(extract(source,name),c);assert.equal(c[name](),null,'invalid export aborts before side effects');
}
console.log('PASS employee daily date validation: empty/reversed/bounds/same-day/recovery and blocked export');
