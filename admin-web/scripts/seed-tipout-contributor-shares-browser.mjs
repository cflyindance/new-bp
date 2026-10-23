// Explicit fixture setup for the isolated acceptance session only. Does not run in the application.
import {execFileSync} from 'node:child_process';
const code=`(()=>{if(location.origin!=='http://127.0.0.1:65122')throw Error('isolated preview only');
const store='Golden Dragon Chinese Kitchen - Dallas, TX 75231',key='tipout-employees-roster-v1',roster=JSON.parse(localStorage.getItem(key)||'[]');
for(const [id,name,role] of [['tipout-share-test-a','【验收】A','承担服务员'],['tipout-share-test-b','【验收】B','承担酒保'],['tipout-share-test-receiver','【验收】接收员工','Chef']]){const old=roster.find(e=>e.id===id);if(old&&(old.name!==name||old.role!==role))throw Error('fixture identity occupied');if(!old)roster.push({id,name,role,store,active:true});}
localStorage.setItem(key,JSON.stringify(roster));
const rules=JSON.parse(localStorage.getItem('tipout_rules')||'[]');let rule=rules.find(r=>r.demoScenarioKey==='employee-share-test-v1');
if(!rule){rule={id:Math.max(0,...rules.map(r=>Number(r.id)||0))+1,ruleName:'【验收】员工承担40/60',demoScenarioKey:'employee-share-test-v1',store,poolKind:'tip',allocationMode:'legacy_pool',distribution:'average',clockin:'clock',poolRules:[{id:'sales_1',type:'sales',pct:10,conditions:{role:['承担服务员','承担酒保'],revenueType:'Net Sales (税前营业额)'}}],deductConfig:{salesPct:{scopeType:'role',roles:['承担服务员','承担酒保'],rate:.1,conditions:{role:['承担服务员','承担酒保'],revenueType:'Net Sales (税前营业额)'}}},receivers:[{roles:['Chef'],pct:100}]};rules.unshift(rule);localStorage.setItem('tipout_rules',JSON.stringify(rules));}
return {ruleId:rule.id,store,fixture:'explicit isolated roster and initial rule; no employee shares seeded'};})()`;
console.log(execFileSync('cmd.exe',['/d','/s','/c','agent-browser.cmd --session tips-shares-20261023 eval -b '+Buffer.from(code).toString('base64')],{encoding:'utf8'}));
