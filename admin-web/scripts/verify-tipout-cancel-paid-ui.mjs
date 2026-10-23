import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const text=fs.readFileSync('src/team/tips/programs/distribution.js.txt','utf8');
const block=text.slice(text.indexOf('    var cancelAllocationDraft='),text.indexOf('    function getFilteredEmployees()'));
let records={A:'paid',B:'allocated'},calls=[],sync=0,failSync=false;
const nodes=Object.fromEntries(['storeSelect','dateStart','dateEnd','cancelAllocationScope','cancelAllocationError','cancelAllocationModal','cancelAllocationBtn','submitCancelAllocationBtn'].map(id=>[id,{value:'',textContent:'',disabled:false,attrs:{},classList:{add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v;},focus(){this.focused=true;}}]));
nodes.storeSelect.value='S';nodes.dateStart.value='A';nodes.dateEnd.value='C';
const content={setAttribute(){},removeAttribute(){}};
const api={cancelFingerprint:(s,d)=>JSON.stringify(records[d]||null),resetConfirmed:async(s,d,o)=>{assert.equal(o.confirmed,true);assert.equal(o.expectedFingerprint,JSON.stringify(records[d]||null));calls.push(d);delete records[d];return true;}};
const window={TipOutPayrollBridge:{async syncAfterAllocation(){sync++;if(failSync)throw Error('payroll');}}};
const c={window,document:{getElementById:id=>nodes[id],querySelector:()=>content},
validateSummaryDateRange:()=>true,readAllocationScopeRows:()=>['A','B','C'].map(dateKey=>({dateKey,businessStatusResult:{allocatable:dateKey!=='C'}})),
buildDateRange:()=>['A','B','C'],TipOutAllocationResults:api,TipOutPayrollBridge:window.TipOutPayrollBridge,
invalidateDayPipelineCache(){},renderDailySummaryList(){},showNotification(){}};
vm.createContext(c);vm.runInContext(block,c);
await c.doCancelAllocate();assert.ok(nodes.cancelAllocationScope.textContent.includes('S'));
c.closeCancelAllocationModal();assert.deepEqual(calls,[]);assert.equal(records.A,'paid');
await c.doCancelAllocate();records.A='changed';await c.submitCancelAllocation();assert.deepEqual(calls,[]);assert.match(nodes.cancelAllocationError.textContent,/变化/);c.closeCancelAllocationModal();
await c.doCancelAllocate();await c.submitCancelAllocation();assert.deepEqual(calls,['A','B']);assert.equal(sync,1);assert.equal(nodes.cancelAllocationModal.attrs['aria-hidden'],'true');
records={A:'paid',B:'allocated'};calls=[];failSync=true;await c.doCancelAllocate();await c.submitCancelAllocation();
assert.deepEqual(calls,['A','B']);assert.match(nodes.cancelAllocationError.textContent,/薪资同步失败/);
assert.equal(nodes.submitCancelAllocationBtn.disabled,true);
const html=fs.readFileSync('src/team/tips/templates/distribution.html','utf8');
assert.match(html,/id="cancelAllocationBtn" class="btn btn-lg btn-danger"/);
assert.match(html,/id="cancelAllocationModal"/);
assert.match(html,/不会撤回实际付款/);
assert.match(fs.readFileSync('src/team/tips/legacy/tipout-scenario-list.js.txt','utf8'),/classList.add\('btn-lg','btn-danger'\)/);
console.log('PASS cancel UI: page consent, preserve, stale all-range guard, paid+unpaid reset, closed skipped, Payroll failure, red borders');
