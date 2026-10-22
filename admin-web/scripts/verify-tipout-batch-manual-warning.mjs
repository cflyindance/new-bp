import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const p=fs.readFileSync('src/team/tips/programs/distribution.js.txt','utf8');
const start=p.indexOf('    function inspectAllocationOverwrite('),end=p.indexOf('    async function executeTipAllocationScope(',start);
assert.ok(start>=0&&end>start);
const rows=[{dateKey:'2026-10-19',businessStatusResult:{allocatable:true}},{dateKey:'2026-10-20',businessStatusResult:{allocatable:true}},{dateKey:'2026-10-21',businessStatusResult:{allocatable:false}}];
const snapshots={'2026-10-19':{allocationSource:'manual',snapshotHash:'h1'},'2026-10-20':{allocationSource:'manual',snapshotHash:'h2'},'2026-10-21':{allocationSource:'manual',snapshotHash:'h3'}};
const c={buildDateRange:(a,b)=>rows.filter(r=>r.dateKey>=a&&r.dateKey<=b).map(r=>r.dateKey),
  readAllocationScopeRows:()=>rows,invalidateDayPipelineCache(){},
  TipOutDateState:{inspect:()=>({locked:false})},TipOutAllocationResults:{read:(s,d)=>snapshots[d]}};
vm.createContext(c);vm.runInContext(p.slice(start,end),c);
let scope={store:'S',startDate:'2026-10-19',endDate:'2026-10-21'};
let result=c.inspectAllocationOverwrite(scope);assert.deepEqual(Array.from(result.manualDates),['2026-10-19','2026-10-20']);
scope={store:'S',startDate:'2026-10-19',endDate:'2026-10-19'};assert.equal(c.inspectAllocationOverwrite(scope).manualDates.length,1);
c.TipOutDateState.inspect=(s,d)=>({locked:d==='2026-10-19'});assert.equal(c.inspectAllocationOverwrite(scope).manualDates.length,0);
c.TipOutDateState.inspect=()=>({locked:false});snapshots['2026-10-19'].allocationSource='system';assert.equal(c.inspectAllocationOverwrite(scope).manualDates.length,0);
snapshots['2026-10-19'].allocationSource='manual';let before=c.inspectAllocationOverwrite(scope).fingerprint;
snapshots['2026-10-19'].snapshotHash='new';assert.notEqual(c.inspectAllocationOverwrite(scope).fingerprint,before);
assert.match(p,/await executeTipAllocationScope\(scope\)/);
assert.match(p,/prepareTipoutQuickSnapshot\(scope.store, dateKey, true\)/);
assert.match(p,/await TipOutAllocationResults.commit\(snapshot/);
console.log('batch warning: single/range/manual/system/closed/locked/fingerprint and actual system-commit contracts passed');

const execution=p.slice(end,p.indexOf('    function resetAllocationOverwrite(',end));
const committed=[];
c.window={prepareTipoutQuickSnapshot:(s,d,system)=>{assert.equal(system,true);return {store:s,dateKey:d,allocationSource:'system'};}};
c.getAllocatedDatesForStore=()=>new Set(['2026-10-19','2026-10-20']);
c.TipOutAllocationResults.commit=async(s,o)=>committed.push([s,o]);
vm.runInContext(execution,c);
await c.executeTipAllocationScope({store:'S',startDate:'2026-10-19',endDate:'2026-10-21'});
assert.equal(committed.length,2);assert.equal(committed[0][0].allocationSource,'system');
assert.equal(committed[0][1].expectedSnapshotFingerprint,JSON.stringify(snapshots['2026-10-19']));
committed.length=0;c.window.prepareTipoutQuickSnapshot=(s,d)=>{if(d==='2026-10-20')throw Error('validation');return {dateKey:d};};
await assert.rejects(c.executeTipAllocationScope({store:'S',startDate:'2026-10-19',endDate:'2026-10-20'}),/validation/);
assert.equal(committed.length,0);
console.log('range execution prevalidates all dates, commits real system snapshots with optimistic protection');

const submit=p.slice(p.indexOf('    async function submitTipAllocationScope('),p.indexOf('    function doAllocateTips(',p.indexOf('    async function submitTipAllocationScope(')));
const nodes={};
for(const id of ['allocationStore','allocationDateStart','allocationDateEnd','tipAllocationModalTitle','tipAllocationModalDescription','allocationOverwriteWarning','allocationOverwriteDates','allocationOverwriteDayCount','allocationOverwriteDateList','confirmAllocateBtn','confirmTipOverwriteBtn'])nodes[id]={value:'',style:{},focus(){}};
nodes.allocationStore.value='S';nodes.allocationDateStart.value='2026-10-19';nodes.allocationDateEnd.value='2026-10-21';
let fingerprint='before',writes=0,error='';
const s={document:{getElementById:id=>nodes[id],querySelectorAll:()=>[]},Object,allocationSubmitting:false,allocationOverwriteDraft:null,
  validateAllocationScope:()=>null,showAllocationScopeError:e=>{error=e?.message||'';},
  inspectAllocationOverwrite:()=>({manualDates:['2026-10-19','2026-10-21'],fingerprint}),
  setAllocationSubmitting(v){s.allocationSubmitting=v;},
  executeTipAllocationScope:async()=>{writes++;return {};},syncPageFiltersToAllocationScope(){},renderDailySummaryList(){},
  closeTipAllocationModal(){},showNotification(){},
  resetAllocationOverwrite(){s.allocationOverwriteDraft=null;}};
vm.createContext(s);vm.runInContext(submit,s);
await s.submitTipAllocationScope();assert.equal(writes,0);assert.equal(nodes.allocationOverwriteDayCount.textContent,'2 天');
assert.equal(nodes.allocationOverwriteDateList.textContent,'2026/10/19、2026/10/21');
assert.equal(nodes.tipAllocationModalTitle.textContent,'重新分配小费？');
const template=fs.readFileSync('src/team/tips/templates/distribution.html','utf8');
assert.doesNotMatch(template,/allocationOverwriteScope/);
assert.match(template,/<strong>覆盖手动调整结果<\/strong>/);
assert.match(template,/id="confirmTipOverwriteBtn"[^>]*>重新分配<\/button>/);
fingerprint='changed';await s.submitTipAllocationScope(true);assert.equal(writes,0);assert.match(error,/已变化/);
await s.submitTipAllocationScope();await s.submitTipAllocationScope(true);assert.equal(writes,1);
assert.equal(s.allocationSubmitting,false);
console.log('submit requires explicit manual overwrite confirmation; stale consent rejects before any write');
