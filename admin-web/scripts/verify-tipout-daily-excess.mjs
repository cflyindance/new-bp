import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const file=n=>fs.readFileSync(new URL('../src/team/tips/'+n,import.meta.url),'utf8');
const program=file('programs/details.js.txt');
const fn=program.slice(program.indexOf('    function renderDetailFundingSummary('),program.indexOf('    function renderSavedDetailFunding('));
const render=vm.runInNewContext('('+fn.trim()+')',{money:n=>'$'+Number(n).toFixed(2)});
for(const [t,c] of [[10,10],[0,0]]){
 assert.equal(render({version:2,target:t,contributed:c,actual:Math.max(t,c),ownerContribution:Math.max(t-c,0),excess:Math.max(c-t,0)},true),'','C=P must not show the extra funding panel');
}
for(const c of [5,0])assert.match(render({version:2,target:10,contributed:c,actual:10,ownerContribution:10-c,excess:0},true),/老板补足/,'C<P shows a shortfall explanation');
assert.match(render({version:2,target:10,contributed:20,actual:20,ownerContribution:0,excess:10},true),/贡献超出计划/);
const store='Golden Dragon Chinese Kitchen - Dallas, TX 75231',storage=new Map();
const ctx={localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},TipOutRosterDirectory:{canonicalRosterStoreName:v=>v,listEmployees:()=>['Server','Bartender','Busser','Runner','Host','Kitchen','Cashier'].map((role,i)=>({id:'old-'+i,name:role,role}))}};
ctx.window=ctx;vm.createContext(ctx);
for(const f of ['legacy/ruleData.js.txt','legacy/tipout-employee-weights.js.txt','legacy/tipout-demo-rules.js.txt','legacy/tipout-scenario-data.js.txt','legacy/tipout-funding.js.txt','legacy/tipout-business-status.js.txt'])vm.runInContext(file(f),ctx);
ctx.TipOutDemoRules.ensure();
let rules=JSON.parse(storage.get('tipout_rules')),daily=rules.find(r=>r.demoScenarioKey==='daily-excess-golden-v1');
assert.ok(daily,'default current store has a daily excess fixture');assert.equal(daily.store,store);assert.ok(rules.findIndex(r=>r.id===daily.id)<=1);
const shortage=rules.find(r=>r.demoScenarioKey==='daily-shortfall-golden-v1');assert.ok(shortage,'daily shortfall fixture exists');
const roster=JSON.parse(storage.get('tipout-employees-roster-v1')).filter(e=>e.store===store);
assert.equal(roster.length,4);let days=0,closed=0;
for(let d=1;d<=31;d++){
 const date='2026-10-'+String(d).padStart(2,'0');
 let facts=ctx.TipOutScenarioData.day({storeId:store,employees:roster,dateKey:date});
 if(ctx.TipOutBusinessStatus.isDemoClosedDate(date)){closed++;facts=facts.map(f=>({...f,orders:[],originalTips:0,orderTips:0,reportedTips:0}));}
 else days++;
 const target=ctx.TipOutFunding.sourceBase(daily.poolRules[0],facts,date)*.1;
 const funding=ctx.TipOutFunding.previewIndependent(daily,facts,date,target);
 assert.equal(funding.target,ctx.TipOutBusinessStatus.isDemoClosedDate(date)?0:10);
 assert.equal(funding.contributed,ctx.TipOutBusinessStatus.isDemoClosedDate(date)?0:20);
 const shortTarget=ctx.TipOutFunding.sourceBase(shortage.poolRules[0],facts,date)*.1;
 const shortFunding=ctx.TipOutFunding.previewIndependent(shortage,facts,date,shortTarget);
 const isClosed=ctx.TipOutBusinessStatus.isDemoClosedDate(date);
 assert.equal(shortFunding.target,isClosed?0:10);assert.equal(shortFunding.contributed,isClosed?0:5);assert.equal(shortFunding.actual,isClosed?0:10);assert.equal(shortFunding.ownerContribution,isClosed?0:5);
 if(!ctx.TipOutBusinessStatus.isDemoClosedDate(date)){
   const combined=ctx.TipOutScenarioData.day({storeId:store,employees:roster.concat(ctx.TipOutRosterDirectory.listEmployees()),dateKey:date});
   const scoped=rules.filter(r=>r.store===store),views=ctx.TipOutFunding.projectIndependent(scoped,combined,date);
   const pools=scoped.map(r=>{const amount=views[String(r.id)]?.actual??r.poolRules.reduce((s,p)=>s+Math.round(ctx.TipOutFunding.sourceBase(p,combined,date)*p.pct)/100,0);return {ruleId:String(r.id),poolAmount:amount,employees:[]};});
   const snapshot=ctx.TipOutFunding.reconcileExisting({store,dateKey:date,scenarioFacts:combined,pools},scoped);
   const excessPool=snapshot.pools.find(p=>String(p.ruleId)===String(daily.id)),shortPool=snapshot.pools.find(p=>String(p.ruleId)===String(shortage.id));
   assert.equal(excessPool.funding.contributed,20);assert.equal(excessPool.poolAmount,20);
   assert.equal(shortPool.funding.contributed,5);assert.equal(shortPool.funding.ownerContribution,5);assert.equal(shortPool.poolAmount,10);
 }
}
const before=JSON.stringify(roster);storage.set('tipout_allocation_results_v1','history-not-rewritten');
ctx.TipOutDemoRules.ensure();assert.equal(JSON.parse(storage.get('tipout_rules')).filter(r=>r.demoScenarioKey===daily.demoScenarioKey).length,1);
assert.equal(storage.get('tipout_allocation_results_v1'),'history-not-rewritten');
assert.equal(JSON.stringify(JSON.parse(storage.get('tipout-employees-roster-v1')).filter(e=>e.store===store)),before);
ctx.TipOutScenarioSource={day:()=>[{employeeId:'half',name:'half',role:'Server',originalTips:20,orderTips:20,reportedTips:0,orders:[{salesAmount:460.5,tipAmount:20}]}],totals:()=>({sales:460.5,tips:20,manual:0,surcharge:0})};
vm.runInContext(file('legacy/tipout-date-pool-view.js.txt'),ctx);
assert.equal(ctx.TipOutDatePoolView.buildDayData('2026-10-23',[{type:'sales',pct:3}],'half').pool,13.82,'formula display uses the same cent rounding as funding validation');
console.log('PASS daily excess: conditional panel, '+days+' operating days 10/20, '+closed+' closed days zero, idempotent seeds and history preservation');
