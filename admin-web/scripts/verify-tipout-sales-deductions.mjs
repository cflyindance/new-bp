import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
for(const name of ['legacy/tipout-funding.js.txt','programs/rule-editor.js.txt','programs/contributor-shares-editor.js.txt','programs/details.js.txt','legacy/ruleData.js.txt'])new vm.Script(fs.readFileSync('src/team/tips/'+name,'utf8'));
const window={};vm.runInNewContext(fs.readFileSync('src/team/tips/legacy/tipout-funding.js.txt','utf8'),{window});const api=window.TipOutFunding,clone=x=>JSON.parse(JSON.stringify(x));
const fact=(id,sales,role='Server')=>({employeeId:id,name:id,role,originalTips:1000,orderTips:1000,reportedTips:0,orders:[{id:'order-'+id,salesAmount:sales,tipAmount:1000}]});
const facts=[fact('A',1000),fact('B',2000),fact('C',2000),fact('D',5000,'Cashier')];
const source={id:'sales_1',type:'sales',name:'营业额5%',pct:5,conditions:{revenueType:'Net Sales (税前营业额)'},deduction:{version:1,role:'Server',store:'S',employees:[]}};
const rule={id:1,store:'S',contributionMode:'employees',allocationMode:'legacy_pool',allocationScope:'day',poolRules:[source],deductConfig:{},deductRoles:['Server']};
const calc=(r=rule,f=facts)=>api.previewIndependent(r,f,'2026-11-04',r.poolRules.reduce((n,p)=>n+api.sourceBase(p,f,'2026-11-04')*p.pct/100,0));
assert.equal(api.supportsExisting([rule]),true);
const p=calc();assert.equal(p.target,500);assert.equal(p.contributed,500);assert.deepEqual(Array.from(p.contributionRules[0].employees,e=>e.due),[100,200,200]);assert.deepEqual(Array.from(p.contributionRules[0].employees,e=>e.salesAmount),[1000,2000,2000]);
const weighted=clone(rule);weighted.poolRules[0].deduction.employees=[{employeeId:'B',weight:2}];assert.deepEqual(Array.from(calc(weighted).contributionRules[0].employees,e=>e.due),[100,200,200]);
const two=clone(rule);two.poolRules[0].deduction.employees=[{employeeId:'B',weight:2}];assert.deepEqual(Array.from(calc(two,[fact('A',100),fact('B',200),fact('D',9700,'Cashier')]).contributionRules[0].employees,e=>e.due),[166.67,333.33]);
const capped=clone(facts);capped[0].originalTips=20;capped[0].orderTips=20;capped[0].orders[0].tipAmount=20;assert.deepEqual(Array.from(calc(rule,capped).contributionRules[0].employees,e=>e.amount),[20,200,200]);assert.equal(calc(rule,capped).ownerContribution,80);
const mixed=clone(rule);mixed.poolRules.push({id:'tips_1',type:'tips',pct:1,conditions:{}},{id:'custom',type:'custom',amount:200,pct:100});assert.equal(api.supportsExisting([mixed]),true);assert.equal(calc(mixed).target,740);assert.equal(calc(mixed).contributed,500);assert.equal(calc(mixed).ownerContribution,240);
const none=clone(rule);none.poolRules[0].deduction.role='';assert.equal(calc(none).contributed,0);assert.equal(calc(none).ownerContribution,500);
for(const type of ['tips','manual','custom']){const invalid=clone(rule);invalid.poolRules[0].type=type;invalid.poolRules[0].amount=100;assert.throws(()=>calc(invalid),/营业额来源/);}
const multiRole=clone(rule);multiRole.poolRules[0].deduction.role=['Server','Cashier'];assert.throws(()=>calc(multiRole),/单个角色/);
const zeros=clone(rule);zeros.poolRules[0].deduction.employees=['A','B','C'].map(employeeId=>({employeeId,weight:0}));assert.deepEqual(Array.from(calc(zeros).contributionRules[0].employees,e=>e.due),[100,200,200]);
const noSales=facts.map(e=>e.role==='Server'?fact(e.employeeId,0):e);assert.throws(()=>calc(rule,noSales),/合计为0/);
const over=api.previewIndependent(rule,facts,'2026-11-04',1000,null,[1000]);assert.deepEqual(Array.from(over.contributionRules[0].employees,e=>e.due),[200,400,400]);
assert.equal(api.projectIndependent([rule],facts,'2026-11-04',{'1':1000},{'1':[1000]})['1'].contributionRules[0].plannedContribution,1000);
const snapshot={dateKey:'2026-11-04',scenarioFacts:facts,pools:[{ruleId:1,poolAmount:500,employees:[{employeeId:'D',amount:500}]}]};const saved=api.reconcileExisting(snapshot,[rule]);api.validateSnapshot(saved);
const tampered=clone(saved);tampered.pools[0].funding.contributionRules[0].employees[0].salesAmount=777;assert.throws(()=>api.validateSnapshot(tampered),/营业额/);
const customOverride={dateKey:'2026-11-04',scenarioFacts:facts,editorState:{formulas:[{id:'1',values:[20000,5]}]},pools:[{ruleId:1,poolAmount:1000,employees:[{employeeId:'D',amount:1000}]}]};assert.equal(api.reconcileExisting(customOverride,[rule]).pools[0].funding.contributed,1000);
console.log('PASS sales deductions: fixed source budget, 100/200/200 example, personal sales proportions; obsolete manual weights ignored, optional single role, mixed source funding, capacity cap, invalid inputs, formula overrides and snapshot integrity');

assert.equal(p.contributionRules[0].shareMode,'sales_proportional');assert.ok(p.contributionRules[0].employees.every(e=>!('weight' in e)&&!('allocationWeight' in e)));
const ui=fs.readFileSync('src/team/tips/programs/contributor-shares-editor.js.txt','utf8');assert.ok(!ui.includes('pool-sales-weights-'));assert.ok(!fs.readFileSync('src/team/tips/templates/rule-editor.html','utf8').includes('poolSalesWeightsDrawer'));
