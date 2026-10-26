import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('src/team/tips/programs/summary-auto-allocation.js.txt','utf8');
function extract(name){const match=source.match(new RegExp('^    function '+name+'\\([^\\n]*\\)\\s*\\{','m'));assert.ok(match,name);const tail=source.slice(match.index+match[0].length),end=tail.indexOf('\n    }');return match[0]+tail.slice(0,end)+'\n    }';}
let rows=[],rules=[{clockin:'clock'}],states={},notices=[],created=[],modalReads=0;
const scope={store:'s',startDate:'2026-10-19',endDate:'2026-10-23'};
const context={summaryAutoDisposed:false,summaryAutoQueue:null,summaryAutoScope:null,validateSummaryDateRange:()=>true,
 document:{getElementById(id){if(id==='summaryAutoModal'){modalReads++;return {classList:{contains:()=>true,add(){}},setAttribute(){},querySelector:()=>({focus(){}})};}return {value:id==='storeSelect'?'s':id==='dateStart'?scope.startDate:scope.endDate};}},
 readAllocationScopeRows:()=>rows,getRulesForCurrentStore:()=>rules,
 summaryAutoExisting:(_s,d)=>{if(states[d]==='error')throw Error('数据损坏');return states[d]?{status:'skipped'}:null;},
 window:{TipOutAutoAllocation:{create(dates){created.push([...dates]);return {run(){}};}}},showNotification:m=>notices.push(m),
 executeSummaryAutoDate(){},renderSummaryAutoProgress(){}};
vm.createContext(context);vm.runInContext(extract('inspectSummaryAutoScope')+'\n'+extract('startSummaryAutoAllocation'),context);
const row=(date,open=true)=>({dateKey:date,businessStatusResult:{allocatable:open}});
rows=[row('19'),row('20',false)];states={'19':'manual'};context.startSummaryAutoAllocation();assert.equal(created.length,0);assert.equal(modalReads,0);assert.equal(notices.length,0);
rows=[row('19',false)];states={};context.startSummaryAutoAllocation();assert.equal(created.length,0);assert.equal(notices.length,0);
rows=[row('19'),row('20',false),row('21')];states={'19':'paid'};context.startSummaryAutoAllocation();assert.deepEqual(created,[['21']]);assert.equal(modalReads,1);
rules=[];let result=context.inspectSummaryAutoScope(scope);assert.equal(result.dates.length,0);assert.equal(result.blocked.length,1);
rules=[{clockin:'noclock'}];result=context.inspectSummaryAutoScope(scope);assert.equal(result.dates.length,0);assert.match(result.blocked[0].message,/手动工时/);
rules=[{clockin:'clock'}];states={'21':'error','19':'manual'};result=context.inspectSummaryAutoScope(scope);assert.equal(result.dates.length,0);assert.match(result.blocked[0].message,/数据损坏/);
context.startSummaryAutoAllocation();assert.equal(created.length,1);assert.equal(modalReads,1);assert.ok(notices.length>0,'blocked data is explained without a task dialog');
console.log('PASS eligibility: silent allocated/closed ranges; only eligible dates queued; manual/paid preserved; blocked prerequisites never open modal');
