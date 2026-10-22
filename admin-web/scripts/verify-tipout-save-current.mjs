import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('src/team/tips/programs/details.js.txt','utf8');
function extract(name) {
  const start=source.indexOf('    async function '+name+'(');
  assert.ok(start>=0, name+' exists');
  const end=source.indexOf('\n    }',start);
  return source.slice(start,end+6);
}
const save=extract('saveCurrentDetailAllocation');
const confirm=extract('confirmDetailAllocation');
function context(overrides={}) {
  const nodes={detailDate:{value:'2026-10-19'},storeSelect:{value:'S'},detailRulesContainer:{},confirmDetailAllocationBtn:{}};
  const calls=[], dialogs=[];
  const ctx={document:{getElementById:id=>nodes[id]},detailAllocationSubmitting:false,detailDirty:false,detailManualDirty:false,
    detailSavedSnapshot:null,detailAllRules:[{id:1}],detailBaseHash:'old',
    ruleData:{getRulesForStore:()=>[{id:1}]},
    getDetailBusinessStatus:()=>({allocatable:true}),TipOutDateState:{assertDateWritable(){},hasUnconfirmedUpdate:()=>false},
    TipOutAllocationResults:{isAllocated:()=>true},syncDetailAllocationAction(){},
    buildSystemDetailAllocationSnapshot:()=>({system:true}),
    executeDetailAllocation:async options=>calls.push(options),
    showNotification:(...args)=>calls.push(args),
    window:{alert:msg=>dialogs.push(msg),confirm:msg=>{dialogs.push(msg);return true;}},
    ...overrides};
  ctx.window.TipOutAllocationResults=ctx.TipOutAllocationResults;
  vm.createContext(ctx);vm.runInContext(save+'\n'+confirm,ctx);
  return {ctx,calls,dialogs,nodes};
}
let run=context();await run.ctx.saveCurrentDetailAllocation();
assert.deepEqual(run.dialogs,['当前系统分配数据未进行手动调整']);assert.equal(run.calls.length,0);
run=context({detailDirty:true,detailManualDirty:true});await run.ctx.saveCurrentDetailAllocation();
assert.equal(run.calls[0].manual,true);assert.equal(run.calls[0].snapshot,undefined);
assert.equal(run.dialogs[0],'已手动调整过小费分配数据，将按照手动调整后的分配数据进行统计');
run=context({detailDirty:true,detailManualDirty:true});run.ctx.window.confirm=()=>false;
await run.ctx.saveCurrentDetailAllocation();await run.ctx.confirmDetailAllocation();assert.equal(run.calls.length,0);
run=context({detailDirty:true,detailManualDirty:true});await run.ctx.confirmDetailAllocation();
assert.equal(run.calls[0].snapshot.system,true);assert.equal(run.calls[0].manual,false);
assert.equal(run.dialogs[0],'已手动调整过小费分配数据，将按照系统小费规则进行重新分配，分配后会覆盖手动调整的数据');
run=context({detailSavedSnapshot:{allocationSource:'manual'}});await run.ctx.confirmDetailAllocation();assert.match(run.dialogs[0],/覆盖手动调整/);
run=context({detailDirty:true,detailManualDirty:true,executeDetailAllocation:async()=>{throw Error('storage failed');}});
await run.ctx.saveCurrentDetailAllocation();assert.equal(run.ctx.detailManualDirty,true);assert.equal(run.ctx.detailDirty,true);
assert.equal(run.ctx.detailAllocationSubmitting,false);assert.equal(run.nodes.detailRulesContainer.inert,false);
run=context({detailDirty:true,detailManualDirty:true});run.ctx.TipOutDateState.assertDateWritable=()=>{throw Error('locked');};
await run.ctx.saveCurrentDetailAllocation();assert.equal(run.calls[0][0],'locked');
assert.equal(run.calls.length,1);
console.log('save-current prompts, cancellation, system/manual split, lock and failure preservation passed');

const helperStart=source.indexOf('    function buildSystemDetailAllocationSnapshot(');
const helperEnd=source.indexOf('\n    async function saveCurrentDetailAllocation',helperStart);
const helper=source.slice(helperStart,helperEnd);
const draft={remove(){}},filterNode={};
const container={childNodes:[draft],replaceChildren(...nodes){this.childNodes=nodes;}};
const filter={childNodes:[filterNode],replaceChildren(...nodes){this.childNodes=nodes;}};
const metric={textContent:'draft'};
const backup={snapshot:{manual:true},rules:[1],selected:[1],results:{1:1},errors:{},rule:{id:1}};
let restored;
const rebuild={
  document:{getElementById:id=>id==='detailRulesContainer'?container:id==='detailRuleFilter'?filter:metric},
  detailSavedSnapshot:backup.snapshot,detailAllRules:backup.rules,detailSelectedRuleIds:backup.selected,
  detailTimeWindowResults:backup.results,detailTimeWindowErrors:backup.errors,currentRule:backup.rule,
  detailForceRebuild:false,window:{TipOutManualHours:true},
  TipOutManualHours:{listForScope:()=>[8],clearForScope(){},replaceScope(s,d,v){restored=v;}},
  renderDetailPage(){container.childNodes=[];metric.textContent='system';throw Error('rebuild failed');},
};
vm.createContext(rebuild);vm.runInContext(helper,rebuild);
assert.throws(()=>rebuild.buildSystemDetailAllocationSnapshot('S','2026-10-19'),/rebuild failed/);
assert.equal(container.childNodes[0],draft);assert.equal(filter.childNodes[0],filterNode);
assert.equal(metric.textContent,'draft');assert.equal(rebuild.detailSavedSnapshot,backup.snapshot);
assert.equal(rebuild.detailAllRules,backup.rules);assert.equal(rebuild.detailForceRebuild,false);
assert.deepEqual(restored,[8]);
console.log('system rebuild restores draft nodes, filter, source state and manual hours on failure');
