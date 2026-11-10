import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const rules=[{id:1,store:'A',ruleName:'tip A'},{id:2,store:'A',poolKind:'surcharge',ruleName:'fee A'},{id:3,store:'B',poolKind:'tip',ruleName:'tip B'}];
const nodes=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',rows:[],appendChild(row){this.rows.push(row);}});return nodes.get(id);};
const context={window:{},document:{getElementById:node,addEventListener(){},createElement(){return {setAttribute(){},innerHTML:''};}},ruleData:{getRules:()=>rules,getRulePoolKindLabel:r=>r.poolKind==='surcharge'?'加收服务费池':'小费池',getRulePoolKindTagClass:()=>'',buildRuleDescription(){throw Error('Rule summaries must not be generated');}},showNotification(){}};
vm.createContext(context);vm.runInContext(fs.readFileSync('src/team/tips/programs/rules.js.txt','utf8'),context);
function check(store,kind,total,tip,fee){node('storeFilter').value=store;node('poolKindFilter').value=kind;node('rulesTableBody').rows=[];context.renderRulesTable();assert.equal(node('ruleCount').textContent,String(total));assert.equal(node('tipPoolCount').textContent,String(tip));assert.equal(node('surchargePoolCount').textContent,String(fee));assert.equal(node('rulesTableBody').rows.length,total);for(const row of node('rulesTableBody').rows){assert.equal((row.innerHTML.match(/<td>/g)||[]).length,4);assert.ok(!row.innerHTML.includes('tipout-rule-description'));assert.ok(!row.innerHTML.includes('<small>'));}}
check('','',3,2,1);check('','tip',2,2,0);check('','surcharge',1,0,1);check('A','tip',1,1,0);check('B','surcharge',0,0,0);assert.match(node('rulesTableBody').innerHTML,/colspan="4"/);check('','',3,2,1);
console.log('PASS combined store/pool filters, legacy default tip, filtered metrics, four columns and no summaries');
