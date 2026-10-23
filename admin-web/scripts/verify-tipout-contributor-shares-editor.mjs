import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const window={};const nodes={'deduct-card-sales_pct_1':{},'deduct-share-summary-sales_pct_1':{},'deduct-share-button-sales_pct_1':{},'deduct-share-entry-sales_pct_1':{}};
let store='S',members=[{id:'A',name:'A',role:'R1'},{id:'B',name:'B',role:'R2'}],messages=[];
const ctx={window,document:{addEventListener(){},getElementById:id=>nodes[id],querySelector:s=>({value:s.includes('allocationMode')?'legacy_pool':'clock'})},
getRuleEditorStoreName:()=>store,showNotification:m=>messages.push(m),parseDeductCardBasis:()=> 'sales_pct',
readDeductRatePct:()=>10,
listDeductCardIds:()=>['sales_pct_1'],getEditParams:()=>({}),ruleData:{getRules:()=>[]},
deductValueConditions:{sales_pct_1:{role:['R1','R2']}},deductEmployeeShares:{},
escapeHtmlAttr:String,escapeHtmlText:String};
window.TipOutRosterDirectory={listEmployees:()=>members};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/team/tips/legacy/tipout-funding.js.txt','utf8'),ctx);
vm.runInContext(fs.readFileSync('src/team/tips/programs/contributor-shares-editor.js.txt','utf8'),ctx);
ctx.updateContributorSharesSummary('sales_pct_1');assert.equal(nodes['deduct-share-button-sales_pct_1'].disabled,false);
assert.equal(nodes['deduct-share-entry-sales_pct_1'].hidden,false,'roles selected: whole entry visible');
assert.match(nodes['deduct-share-summary-sales_pct_1'].textContent,/未设置/);
ctx.deductEmployeeShares.sales_pct_1={version:1,store:'S',roles:['R1','R2'],employees:[{employeeId:'A',pct:40},{employeeId:'B',pct:60}]};
assert.equal(ctx.validateContributorSharesBeforeSave(),true);ctx.updateContributorSharesSummary('sales_pct_1');assert.match(nodes['deduct-share-summary-sales_pct_1'].textContent,/40%.*60%/);
const main=fs.readFileSync('src/team/tips/programs/rule-editor.js.txt','utf8');
vm.runInContext(main.slice(main.indexOf('    function entryFromDeductValueConditions('),main.indexOf('    function conditionsFromDeductEntry(')),ctx);
const entry=ctx.entryFromDeductValueConditions('sales_pct_1');assert.equal(entry.id,'sales_pct_1');assert.equal(entry.employeeShares.employees[0].pct,40);
store='Other';assert.equal(ctx.validateContributorSharesBeforeSave(),false);assert.match(messages.at(-1),/门店/);store='S';
members.push({id:'C',name:'C',role:'R1'});assert.equal(ctx.validateContributorSharesBeforeSave(),false);assert.match(messages.at(-1),/变化/);members.pop();
ctx.deductValueConditions.sales_pct_1.role=['R1'];assert.equal(ctx.validateContributorSharesBeforeSave(),false);
ctx.deductValueConditions.sales_pct_1.role=[];ctx.updateContributorSharesSummary('sales_pct_1');assert.equal(nodes['deduct-share-button-sales_pct_1'].disabled,true);
assert.equal(nodes['deduct-share-entry-sales_pct_1'].hidden,true,'roles cleared: whole entry hidden');
store='';ctx.updateContributorSharesSummary('sales_pct_1');assert.equal(nodes['deduct-share-button-sales_pct_1'].disabled,false,'missing store must allow click to show notice');
ctx.openContributorSharesDrawer('sales_pct_1');assert.equal(messages.at(-1),'请先选择门店');store='S';
delete ctx.deductEmployeeShares.sales_pct_1;const old=ctx.entryFromDeductValueConditions('sales_pct_1');assert.equal(old.employeeShares,undefined);assert.equal(old.id,undefined);
console.log('PASS editor shares: disabled/no-role, summary, serialization, store/role/roster stale guards and legacy untouched');
