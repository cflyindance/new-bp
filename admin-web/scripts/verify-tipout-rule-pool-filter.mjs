import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const rules=[{id:1,store:'A',ruleName:'tip A'},{id:2,store:'A',poolKind:'surcharge',ruleName:'fee A'},{id:3,store:'B',poolKind:'tip',ruleName:'tip B'}];
const nodes=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',focus(){this.focused=true;},textContent:'',innerHTML:'',rows:[],appendChild(row){this.rows.push(row);}});return nodes.get(id);};
const context={window:{},document:{getElementById:node,addEventListener(){},createElement(){return {setAttribute(){},innerHTML:''};}},ruleData:{getRules:()=>rules,getRulePoolKindLabel:r=>r.poolKind==='surcharge'?'加收服务费池':'小费池',getRulePoolKindTagClass:()=>'',buildRuleDescription(){throw Error('Rule summaries must not be generated');}},showNotification(){}};
vm.createContext(context);vm.runInContext(fs.readFileSync('src/team/tips/programs/rules.js.txt','utf8'),context);
function check(store,kind,total,tip,fee){node('storeFilter').value=store;node('poolKindFilter').value=kind;node('rulesTableBody').rows=[];context.renderRulesTable();assert.equal(node('ruleCount').textContent,String(total));assert.equal(node('tipPoolCount').textContent,String(tip));assert.equal(node('surchargePoolCount').textContent,String(fee));assert.equal(node('rulesTableBody').rows.length,total);for(const row of node('rulesTableBody').rows){assert.equal((row.innerHTML.match(/<td>/g)||[]).length,4);assert.ok(!row.innerHTML.includes('tipout-rule-description'));assert.ok(!row.innerHTML.includes('<small>'));}}
check('','',3,2,1);check('','tip',2,2,0);check('','surcharge',1,0,1);check('A','tip',1,1,0);check('B','surcharge',0,0,0);assert.match(node('rulesTableBody').innerHTML,/colspan="4"/);check('','',3,2,1);
const original=JSON.stringify(rules);
node('ruleNameSearch').value='  TIP  ';check('','',2,2,0);
check('A','tip',1,1,0);check('A','surcharge',0,0,0);
assert.match(node('rulesTableBody').innerHTML,/暂无符合条件的规则/);
node('ruleNameSearch').value='fEe';check('A','surcharge',1,0,1);
context.clearRuleNameSearch();assert.equal(node('ruleNameSearch').value,'');assert.equal(node('ruleCount').textContent,'1');assert.equal(node('storeFilter').value,'A');assert.equal(node('poolKindFilter').value,'surcharge');assert.equal(node('clearRuleNameSearch').hidden,true);assert.equal(node('ruleNameSearch').focused,true);
node('ruleNameSearch').value='   ';check('','',3,2,1);node('ruleNameSearch').value='<script>';check('','',0,0,0);assert.equal(JSON.stringify(rules),original);
console.log('PASS combined store/pool filters, legacy default tip, filtered metrics, four columns and no summaries');
