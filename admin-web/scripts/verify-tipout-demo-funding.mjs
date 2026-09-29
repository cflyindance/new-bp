import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const store = 'Golden Dragon Chinese Kitchen - Dallas, TX 75231';
const roles = ['Server','Server','Bartender','Bartender','Busser','Runner','Host','Cashier','Kitchen','Floor','Manager'];
const employees = roles.map((role,i)=>({id:'roster-seed-'+(i+1),name:'Employee '+i,role}));
const storage = new Map();
const context = {localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},
  TipOutRosterDirectory:{canonicalRosterStoreName:value=>value,listEmployees:()=>employees}};
context.window=context;
vm.createContext(context);
for (const name of ['ruleData','tipout-demo-rules','tipout-scenario-data','tipout-funding']) {
  vm.runInContext(fs.readFileSync('src/team/tips/legacy/'+name+'.js.txt','utf8'),context);
}
context.TipOutDemoRules.ensure();
const rules=JSON.parse(storage.get('tipout_rules'));
assert.equal(rules.length,11);
assert.deepEqual(rules[0].poolRules[0].conditions.role,['Server','Bartender','Cashier']);
const data=context.TipOutScenarioData, funding=context.TipOutFunding;
let positiveDonor=false, positiveReciprocal=false;
for(let roster=0;roster<8;roster++) {
  for(let day=0;day<62;day++) {
    const dateKey=new Date(Date.UTC(2026,7,30+day)).toISOString().slice(0,10);
    const facts=data.day({storeId:store,employees:employees.map(e=>({...e,id:e.id+'-'+roster})),dateKey});
    const pools=rules.map(rule=>{
      const poolAmount=Math.round(rule.poolRules.reduce((sum,p)=>sum+Math.round(funding.sourceBase(p,facts,dateKey)*p.pct),0))/100;
      const receiver=facts.find(f=>rule.receivers.some(r=>r.roles.includes(f.role))&&f.attendance.punchSessions.length);
      return {ruleId:String(rule.id),ruleName:rule.ruleName,poolAmount,employees:receiver?[{employeeId:receiver.employeeId,amount:poolAmount}]:[]};
    });
    const snapshot=funding.reconcileExisting({store,dateKey,scenarioFacts:facts,pools},rules);
    funding.validateSnapshot(snapshot);
    assert.ok(snapshot.employeeAmounts.every(e=>e.deducted<=facts.find(f=>f.employeeId===e.employeeId).originalTips));
    assert.equal(Math.round(snapshot.summary.poolAmount*100),Math.round((snapshot.summary.allocatedAmount+snapshot.summary.unallocatedAmount)*100));
    positiveDonor ||= snapshot.employeeAmounts.some(e=>e.deducted>0);
    positiveReciprocal ||= snapshot.employeeAmounts.some(e=>e.deducted>0&&e.received>0);
  }
}
assert.ok(positiveDonor&&positiveReciprocal);

// Upgrade exact legacy seeds once; preserve edited rules, deleted demos and snapshots.
const legacy=structuredClone(rules);
const oldRates={'front-hours':100,'bar-average':100,'support-hours':15,'capped-hours':100};
legacy.forEach(rule=>{
  if(rule.id===5) delete rule.poolRules[0].conditions;
  if(!rule.demoScenarioKey) return;
  const key=JSON.parse(rule.demoScenarioKey)[1];
  if(oldRates[key]) rule.poolRules[0].pct=oldRates[key];
  if(rule.poolRules[0].type==='sales') delete rule.poolRules[0].conditions;
  if(rule.poolRules[0].type==='personal_sales') {
    delete rule.poolRules[0].conditions.orderTipStatus;
    delete rule.deductConfig.personalSalesPct.salesConditions.orderTipStatus;
  }
});
storage.set('tipout_rules',JSON.stringify(legacy));
storage.set('tipout_allocation_results_v1','historical snapshot must remain untouched');
context.TipOutDemoRules.ensure();
assert.deepEqual(JSON.parse(storage.get('tipout_rules')),rules);
assert.equal(storage.get('tipout_allocation_results_v1'),'historical snapshot must remain untouched');
const edited=structuredClone(legacy);
edited.find(r=>r.demoScenarioKey?.includes('front-hours')).poolRules[0].pct=73;
storage.set('tipout_rules',JSON.stringify(edited));
context.TipOutDemoRules.ensure();
assert.equal(JSON.parse(storage.get('tipout_rules')).find(r=>r.demoScenarioKey?.includes('front-hours')).poolRules[0].pct,73);
const impossible=structuredClone(rules);
impossible[0].poolRules=[{type:'sales',pct:100}];
const facts=data.day({storeId:store,employees,dateKey:'2026-09-29'});
assert.throws(()=>funding.reconcileExisting({dateKey:'2026-09-29',scenarioFacts:facts,pools:[{ruleId:'5',poolAmount:100000,employees:[]}]},impossible),/入池缺口/);
console.log('PASS: 496 daily default funding cases, contribution conservation, safe migration and shortage rejection');
