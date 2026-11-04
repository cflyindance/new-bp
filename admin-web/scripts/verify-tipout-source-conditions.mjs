import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const ts=createRequire(path.join(process.cwd(),'package.json'))('typescript');
const root=process.argv[2]||process.cwd();
const program=fs.readFileSync(path.join(root,'src/team/tips/programs/rule-editor.js.txt'),'utf8');
const common=fs.readFileSync(path.join(root,'src/team/tips/legacy/common.js.txt'),'utf8');
new vm.Script(program);new vm.Script(common);
function declarations(source,names){const ast=ts.createSourceFile('source.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);return ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)).map(n=>n.getText(ast)).join('\n');}
let collected={},opened=[],messages=[];
const titles={},nodes={},removed=[];
const context={
 document:{getElementById:id=>nodes[id]||{classList:{remove(){}},style:{}},querySelector:selector=>titles[selector]||(titles[selector]={}),body:{style:{}}},
 ensureDeductTabsInited(){},parseDeductCardBasis:id=>id.startsWith('tip_income')?'tip_income':id.startsWith('personal')?'personal_sales_pct':'sales_pct',
 openDrawer:id=>opened.push(id),showNotification:msg=>messages.push(msg),normalizeConditionsRoleEmployeeExclusive(){},
 loadTipsConditionsObject(value){context.loadedTips=structuredClone(value);},loadSalesConditionsObject(value){context.loadedSales=structuredClone(value);},
 loadTipsConditionsForRule(){},loadSalesConditionsForRule(){},syncSalesDrawerDeductExtra(){},
 collectTipsConditions:()=>structuredClone(collected),updateDeductCardConditionDisplay(){},updatePoolRuleConditionDisplay(){},
 deductValueConditions:{tip_income_1:{role:['R'],tipTypes:['Cash Tips (现金小费)']},tip_income_2:{role:['B'],tipTypes:['全部']}},
 poolRuleConditions:{tips_1:{tipType:'全部'}},deductEmployeeShares:{},DEDUCT_BASIS_LABELS:{tip_income:'按照小费收入占比',sales_pct:'按照销售额占比'},
 tipsDrawerRetainedConditions:{},tipsDrawerSavedTipTypes:[],editingDeductTipsCardId:null,editingDeductValueBasis:null,currentEditingDeductBasis:null,currentEditingRuleId:null,
 getDefaultDeductValueConditions:()=>({role:[]}),editingPersonalSalesPctConditions:false,
 isFinite,JSON,Array,Object,Number,
 getPoolRuleTypeById:()=> 'sales',tipTerm:s=>s,
};
vm.createContext(context);
vm.runInContext(declarations(program,['hasContributorScope','getDefaultDeductValueConditions','openDeductConditionsDrawer','saveTipsCondition','entryFromDeductValueConditions','conditionsFromDeductEntry','isPoolSalesRevenueTypeContext','openDrawerForRule']),context);
vm.runInContext(declarations(common,['closeDrawer']),context);
const originalPool=JSON.stringify(context.poolRuleConditions),other=JSON.stringify(context.deductValueConditions.tip_income_2);
assert.equal(context.getDefaultDeductValueConditions('tip_income').role,undefined);
assert.equal(context.getDefaultDeductValueConditions('sales_pct').role,undefined);
assert.equal(context.hasContributorScope({}),false);
assert.equal(context.hasContributorScope({role:['R'],employee:['E']}),false);
assert.equal(context.hasContributorScope({employee:['E']}),true);
context.openDeductConditionsDrawer('tip_income_1');
assert.equal(opened.at(-1),'tipsDrawer');assert.equal(context.currentEditingRuleId,null);assert.equal(context.editingDeductTipsCardId,'tip_income_1');assert.equal(context.loadedSales,undefined);
collected={role:[],tipType:'全部'};context.saveTipsCondition();assert.match(messages.at(-1),/角色/);assert.equal(context.editingDeductTipsCardId,'tip_income_1');
collected={role:['R'],tipType:'Credit Card Tips (信用卡小费)',area:'Bar Area',orderType:'Dine In',containsProduct:{category:['Drink']}};
context.saveTipsCondition();
assert.equal(context.editingDeductTipsCardId,null);assert.deepEqual(Array.from(context.deductValueConditions.tip_income_1.tipTypes),['Credit Card Tips (信用卡小费)']);
assert.equal(context.deductValueConditions.tip_income_1.area,'Bar Area');
assert.equal(JSON.stringify(context.poolRuleConditions),originalPool);assert.equal(JSON.stringify(context.deductValueConditions.tip_income_2),other);
const entry=context.entryFromDeductValueConditions('tip_income_1');assert.equal(entry.salesConditions.containsProduct.category[0],'Drink');assert.equal(entry.salesConditions.tipTypes,undefined);
const stored={scopeType:'role',roles:['R'],tipTypes:['Credit Card Tips (信用卡小费)'],conditions:{role:['R'],area:'Bar Area'}};
assert.equal(context.conditionsFromDeductEntry(stored,'tip_income').area,'Bar Area');assert.equal(stored.conditions.tipTypes,undefined);
context.openDeductConditionsDrawer('tip_income_1');context.tipsDrawerSavedTipTypes=['Cash Tips (现金小费)','Credit Card Tips (信用卡小费)'];
collected={role:['R'],tipType:'__saved_tip_types__'};context.saveTipsCondition();assert.equal(context.deductValueConditions.tip_income_1.tipTypes.length,2);assert.equal(context.deductValueConditions.tip_income_1.tipType,undefined);
// Empty optional type means no type filter; role is still mandatory.
context.openDeductConditionsDrawer('tip_income_1');collected={role:['R']};context.saveTipsCondition();assert.deepEqual(Array.from(context.deductValueConditions.tip_income_1.tipTypes),[]);
context.openDeductConditionsDrawer('tip_income_1');context.tipsDrawerSavedTipTypes=['全部','Cash Tips (现金小费)'];collected={role:['R'],tipType:'__saved_tip_types__'};context.saveTipsCondition();assert.deepEqual(Array.from(context.deductValueConditions.tip_income_1.tipTypes),['全部','Cash Tips (现金小费)']);
const beforeCancel=JSON.stringify(context.deductValueConditions);context.openDeductConditionsDrawer('tip_income_1');context.closeDrawer('tipsDrawer');
assert.equal(context.editingDeductTipsCardId,null);assert.equal(context.currentEditingDeductBasis,null);assert.equal(JSON.stringify(context.deductValueConditions),beforeCancel);
context.openDeductConditionsDrawer('tip_income_1');context.openDrawerForRule('tipsDrawer','tips_1');assert.equal(context.editingDeductTipsCardId,null);
collected={tipType:'Gift Card Tips'};context.saveTipsCondition();assert.equal(context.poolRuleConditions.tips_1.tipType,'Gift Card Tips');assert.equal(JSON.stringify(context.deductValueConditions),beforeCancel);
context.openDeductConditionsDrawer('tip_income_1');collected={employee:['E'],employeeRoles:['R']};context.deductEmployeeShares.tip_income_1={mode:'average'};context.saveTipsCondition();
assert.equal(context.deductEmployeeShares.tip_income_1,undefined);
const employeeEntry=context.entryFromDeductValueConditions('tip_income_1');assert.equal(employeeEntry.scopeType,'employee');
const employeeBack=context.conditionsFromDeductEntry(employeeEntry,'tip_income');assert.deepEqual(Array.from(employeeBack.employee),['E']);assert.equal(employeeBack.role,undefined);
context.editingDeductValueBasis='sales_pct_1';assert.equal(context.isPoolSalesRevenueTypeContext(),true);
context.editingDeductValueBasis='personal_sales_pct_1';assert.equal(context.isPoolSalesRevenueTypeContext(),false);
console.log('PASS shared source conditions: typed drawers, required role-or-employee choice, source/target isolation, cancel, combinations and persisted condition round-trip');
