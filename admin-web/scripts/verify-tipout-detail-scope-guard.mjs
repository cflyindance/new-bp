import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function extract(source,name) {
 const start=source.match(new RegExp('^( *)(?:async )?function '+name+'\\([^\\n]*?\\) \\{','m'));
 assert.ok(start,name+' exists');
 const rest=source.slice(start.index+start[0].length),end=rest.match(new RegExp('^'+start[1]+'\\}','m'));
 assert.ok(end);return start[0]+rest.slice(0,end.index)+end[0];
}

const source=fs.readFileSync('src/team/tips/programs/details.js.txt','utf8');
const decisions=[];let discarded=0,continued=0,notifications=0;
const ctx={detailDirty:true,detailAllocationSubmitting:false,window:{confirm(){throw Error('browser confirm must not be used');}},
 showNotification(){notifications++;},discardDetailDraft(){discarded++;ctx.detailDirty=false;},
 showDetailAllocationDialog(kind,message){assert.equal(kind,'leave');return new Promise(resolve=>decisions.push(resolve));}};
vm.createContext(ctx);vm.runInContext(extract(source,'allowDetailLeave'),ctx);
assert.equal(ctx.allowDetailLeave(()=>continued++),false);assert.equal(discarded,0);
decisions.shift()(false);await Promise.resolve();assert.equal(discarded,0);assert.equal(ctx.detailDirty,true);
assert.equal(ctx.allowDetailLeave(()=>continued++),false);decisions.shift()(true);await Promise.resolve();
assert.equal(discarded,1);assert.equal(continued,1);assert.equal(ctx.detailDirty,false);
assert.equal(ctx.allowDetailLeave(()=>continued++),true);assert.equal(continued,1,'clean caller handles immediate navigation');
ctx.detailAllocationSubmitting=true;assert.equal(ctx.allowDetailLeave(()=>continued++),false);assert.equal(notifications,1);
const inputs={storeSelect:{value:'New'},detailDate:{value:'2026-10-21'}};
let resume;
const scope={document:{getElementById:id=>inputs[id]},detailRenderedScope:{store:'Old',dateKey:'2026-10-20'},
 allowDetailLeave(fn){resume=fn;return false;}};
vm.createContext(scope);vm.runInContext(extract(source,'renderDetailPage'),scope);scope.renderDetailPage();
assert.equal(inputs.storeSelect.value,'Old');assert.equal(inputs.detailDate.value,'2026-10-20');
scope.renderDetailPage=()=>{};resume();assert.equal(inputs.storeSelect.value,'New');assert.equal(inputs.detailDate.value,'2026-10-21');

const runFirst=async (dirty,allocated=false)=>{
 const options=[];const c={detailAllocationSubmitting:false,detailManualDirty:dirty,detailAllRules:[],
 detailSavedSnapshot:null,window:{TipOutAllocationResults:{isAllocated:()=>allocated}},
 TipOutAllocationResults:{isAllocated:()=>allocated},document:{getElementById:id=>id==='detailDate'?{value:'2026-10-20'}:id==='storeSelect'?{value:'Store'}:{}},
 showDetailAllocationDialog:async()=>true,buildSystemDetailAllocationSnapshot:()=>({}),
 ruleData:{getRulesForStore:()=>[]},
 getDetailBusinessStatus:()=>({allocatable:true}),TipOutDateState:{assertDateWritable(){}},syncDetailAllocationAction(){},
 executeDetailAllocation:async opt=>options.push(opt),showNotification(m){throw Error(m);}};
 vm.createContext(c);vm.runInContext(extract(source,'confirmDetailAllocation'),c);await c.confirmDetailAllocation();return options[0];
};
assert.equal((await runFirst(true)).manual,true,'first manually adjusted confirmation must be manual');
assert.equal((await runFirst(false)).manual,false,'unadjusted first confirmation remains system');
assert.equal((await runFirst(true,true)).manual,false,'existing result reallocation remains system even with manual draft');
assert.doesNotMatch(source,/window\.confirm\(/);
const own={detailDirty:true,detailOwnUpdate:true,detailEditToken:'own',detailBaseHash:'base',
 getDetailPayoutScope:()=>({store:'Store',dateKey:'2026-10-20'}),
 TipOutDateState:{readUnconfirmedUpdate:()=>({fingerprint:'own'})}};
vm.createContext(own);vm.runInContext(extract(source,'isOwnDetailDraftNotification'),own);
assert.equal(own.isOwnDetailDraftNotification({locked:false,snapshot:{snapshotHash:'base'}}),true);
assert.equal(own.isOwnDetailDraftNotification({locked:false,snapshot:{snapshotHash:'other'}}),false);
assert.equal(own.isOwnDetailDraftNotification({locked:true,snapshot:{snapshotHash:'base'}}),false);
own.TipOutDateState.readUnconfirmedUpdate=()=>({fingerprint:'other'});
assert.equal(own.isOwnDetailDraftNotification({locked:false,snapshot:{snapshotHash:'base'}}),false);
console.log('PASS detail leave: clean/saving/cancel/confirm and scope restoration; first manual/system source');
