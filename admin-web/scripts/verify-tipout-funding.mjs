import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('../src/team/tips/legacy/tipout-funding.js.txt',import.meta.url),'utf8'),context);
const engine=context.window.TipOutFunding;
const clone=x=>JSON.parse(JSON.stringify(x));
function person(id,role,tips,hours=8){return {employeeId:id,name:id,role,originalTips:tips,orderTips:tips,reportedTips:0,attendance:{effectiveHours:hours,punchSessions:hours?[{}]:[]},orders:[{id:id+'-1',salesAmount:10000,tipAmount:tips,lines:[{category:'酒水',amount:10000}]}]};}
const facts=[person('a','Server',1200),person('b','Server',800,0),person('c','Busser',0),person('d','Runner',0)];
const rule={id:'one',ruleName:'测试资金归集',distribution:'hours',clockin:'clock',receivers:[{roles:['Busser'],pct:60},{roles:['Runner'],pct:40}],funding:{version:1,priority:1,method:'balance',tipSources:['order'],formulas:[{source:'sales',role:'Server',rate:5}],groups:[{kind:'role',values:['Server'],pct:100}]}};
const run=(r=rule,f=facts,o)=>clone(engine.calculate([r],f,'2026-09-28',o));
let result=run();
assert.equal(result.pools[0].funding.target,1000);
assert.deepEqual(result.employeeAmounts.map(e=>[e.deducted,e.received]),[[600,0],[400,0],[0,600],[0,400]]);
assert.equal(result.errors.length,0);
assert.equal(run(rule,facts.map(f=>({...f,orders:f.orders.map(o=>({...o,salesAmount:o.salesAmount/2}))}))).pools[0].funding.target,500);
const snapshot={...result,scenarioFacts:facts,store:'test',dateKey:'2026-09-28'};engine.validateSnapshot(snapshot);
for(const mutate of [s=>s.employeeAmounts.pop(),s=>s.summary.poolAmount++,s=>s.employeeContributions[0].amount++,s=>s.pools[0].funding.gap=1]){const bad=clone(snapshot);mutate(bad);assert.throws(()=>engine.validateSnapshot(bad));}
const low=facts.map(f=>({...f,originalTips:f.originalTips*.4,orderTips:f.orderTips*.4}));
const shortage=run(rule,low);assert.equal(shortage.pools[0].funding.gap,200);assert.equal(shortage.errors.length,1);
assert.throws(()=>engine.validateSnapshot({...shortage,scenarioFacts:low}));
const fixed=clone(rule);fixed.funding.method='fixed';fixed.funding.groups=[{kind:'employee',values:['a'],pct:90},{kind:'employee',values:['b'],pct:10}];
assert.equal(run(fixed,low).pools[0].funding.gap,420,'do not move group shortage');
fixed.funding.groups[1].values=['a'];assert.throws(()=>run(fixed),/重叠/);
const dedup=clone(rule);dedup.funding.groups.push({kind:'employee',values:['a'],pct:100});assert.equal(run(dedup).employeeAmounts[0].deducted,600);
const other=clone(rule);other.id='two';other.funding.priority=2;other.funding.formulas[0].rate=7;
const multi=clone(engine.calculate([other,rule],facts,'2026-09-28'));assert.deepEqual(multi.pools.map(p=>p.ruleId),['one','two']);assert.equal(multi.pools[1].funding.gap,400);
const circular=clone(other);circular.funding.groups=[{kind:'role',values:['Busser']}];assert.equal(clone(engine.calculate([rule,circular],facts,'2026-09-28')).pools[1].funding.actual,0);
const reciprocal=clone(rule);reciprocal.receivers=[{roles:['Server'],pct:100}];assert.equal(run(reciprocal).employeeAmounts[0].received,1000);assert.equal(run(reciprocal).employeeAmounts[1].deducted,400);
assert.equal(run(rule,facts.map(f=>({...f,attendance:{effectiveHours:0,punchSessions:[]}}))).summary.unallocatedAmount,1000);
const capped=clone(rule);capped.workHoursConfig={mode:'capped',maxHoursPerDay:5};
const manual=run(capped,facts,{'one':{'c':{hours:8.03,percentage:50}}});assert.equal(manual.pools[0].employees[0].hours,8.03);assert.equal(manual.summary.unallocatedAmount,300);
assert.throws(()=>run(rule,facts,{'one':{'c':{percentage:101}}}),/比例/);
const orders=clone(reciprocal);orders.distribution='orders';orders.clockin='unrestricted';assert.equal(run(orders).employeeAmounts[1].received,500);
orders.clockin='clock';assert.equal(run(orders).employeeAmounts[1].received,0);
const overlap=clone(rule);overlap.funding.formulas.push(clone(overlap.funding.formulas[0]));assert.equal(run(overlap).pools[0].funding.formulas[1].overlaps,2);
const filter=clone(rule);filter.funding.formulas[0].orderType='dine-in';assert.throws(()=>run(filter),/缺少订单类型/);
assert.equal(engine.split(1,[1,1,1]).reduce((a,b)=>a+b,0),1);
const before=JSON.stringify(facts);run();assert.equal(JSON.stringify(facts),before);
const oldRule={id:1,ruleName:'现有规则',poolKind:'tip',allocationMode:'legacy_pool',poolRules:[{type:'sales',pct:5}],deductRoles:['Server'],receivers:[{roles:['Busser'],pct:100}]};
const oldSnapshot={store:'test',dateKey:'2026-09-28',scenarioFacts:facts,pools:[{ruleId:'1',poolAmount:1000,poolKind:'tip',employees:[{employeeId:'c',name:'c',role:'Busser',hours:8,percentage:100,amount:1000}]}]};
assert.equal(engine.supportsExisting([oldRule]),true);
const reconciled=engine.reconcileExisting(clone(oldSnapshot),[oldRule]);
assert.deepEqual(reconciled.employeeAmounts.map(e=>[e.deducted,e.received]),[[600,0],[400,0],[0,1000],[0,0]]);
assert.equal(reconciled.summary.originalTips,2000);assert.equal(reconciled.summary.unallocatedAmount,0);
const namedContributor=clone(oldRule);namedContributor.deductRoles=[];namedContributor.deductConfig={tipIncome:{scopeType:'employee',employee:['a'],rate:1}};
const namedResult=engine.reconcileExisting(clone(oldSnapshot),[namedContributor]);
assert.deepEqual(namedResult.employeeAmounts.map(e=>e.deducted),[1000,0,0,0],'specified employee alone funds the pool');
const alsoReceives=clone(oldSnapshot);alsoReceives.pools[0].employees=[{employeeId:'a',name:'a',role:'Server',hours:8,percentage:100,amount:1000}];
const bothSides=engine.reconcileExisting(alsoReceives,[namedContributor]);
assert.deepEqual(clone(bothSides.employeeAmounts[0]),{employeeId:'a',deducted:1000,received:1000},'the same employee has separate contribution and receipt');
const editedFormula=clone(oldSnapshot);editedFormula.editorState={formulas:[{id:'1',values:['10000','10']}]};
assert.equal(engine.reconcileExisting(clone(editedFormula),[oldRule]).pools[0].funding.formulas[0].amount,1000);
editedFormula.editorState.formulas[0].values=['5000','10'];
assert.throws(()=>engine.reconcileExisting(clone(editedFormula),[oldRule]),/公式.*池金额/);
assert.throws(()=>engine.reconcileExisting({...clone(oldSnapshot),scenarioFacts:low},[oldRule]),/入池缺口/);
const roleSubset=clone(oldRule);roleSubset.deductRoles=[];roleSubset.deductConfig={salesPct:[{scopeType:'role',roles:['Server'],rate:.03},{scopeType:'role',roles:['Server'],rate:.02}]};
assert.throws(()=>engine.reconcileExisting(clone(oldSnapshot),[roleSubset]),/同一员工/);
assert.equal(engine.supportsExisting([{...oldRule,allocationMode:'order_tip_then_residual'}]),true);
const filteredFacts=[{...person('menu-server','Server',100),orders:[
  {id:'food',salesAmount:100,tipAmount:10,area:'main',orderType:'dine_in',paymentMethod:'card',localTime:'11:30',lines:[{productLine:'POS',category:'主菜',amount:100}]},
  {id:'drink',salesAmount:200,tipAmount:20,area:'bar',orderType:'takeout',paymentMethod:'cash',localTime:'19:30',lines:[{productLine:'POS',category:'酒水',amount:200}]}
]}];
assert.equal(engine.sourceBase({type:'sales',conditions:{menu:{productLine:['POS'],category:['主菜']}}},filteredFacts,'2026-09-28'),100);
assert.equal(engine.sourceBase({type:'tips',conditions:{containsProduct:{category:['酒水']}}},filteredFacts,'2026-09-28'),20);
assert.equal(engine.sourceBase({type:'sales',conditions:{paymentMethods:['credit_card']}},filteredFacts,'2026-09-28'),100);
assert.equal(engine.sourceBase({type:'sales',conditions:{weekdays:['1']}},filteredFacts,'2026-09-28'),300);
assert.equal(engine.sourceBase({type:'sales',conditions:{weekdays:['7']}},filteredFacts,'2026-09-27'),300);
assert.throws(()=>engine.sourceBase({type:'sales',conditions:{menu:{menuGroup:['POS|||Dinner']}}},filteredFacts,'2026-09-28'),/菜单层级/);
assert.throws(()=>engine.sourceBase({type:'sales',conditions:{revenueType:'Gross Sales (总销售额)'}},filteredFacts,'2026-09-28'),/销售口径/);
context.window.TipOutScenarioSource={day:()=>filteredFacts,totals:()=>({sales:300,tips:30,manual:0,surcharge:0})};
vm.runInContext(fs.readFileSync(new URL('../src/team/tips/legacy/tipout-date-pool-view.js.txt',import.meta.url),'utf8'),context);
const day=context.window.TipOutDatePoolView.buildDayData('2026-09-28',[
  {id:'first',type:'sales',pct:10,conditions:{}},
  {id:'zero',type:'sales',pct:0,conditions:{menu:{category:['主菜']}}}
]);
assert.equal(day.pool,30);
assert.equal(day.poolBaseByRule.first,300);
assert.equal(day.poolBaseByRule.zero,100,'zero rate still shows its filtered actual base');
console.log('Funding engine: dynamic target, conservation, shortages, groups, cross-pool balance, independent attendance, manual overrides, orders, filters and snapshots passed.');
