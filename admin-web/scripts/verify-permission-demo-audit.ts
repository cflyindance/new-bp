import assert from 'node:assert/strict';
import {seedDemoAudit} from '../src/permissions/center-demo-audit';
import {auditEmployeeName} from '../src/permissions/center-audit-employee';
import type {CenterState} from '../src/permissions/center-domain';
const state:CenterState={schema:1,version:8,employeeAuthorization:'roles-only',roles:[{id:'r',name:'店长',description:'',system:false,grants:{}}],employees:[{id:'e001',name:'王小明',email:'x@example.com',status:'enabled',bindings:[],overrides:{}},{id:'custom',name:'自建员工',email:'c@example.com',status:'disabled',bindings:[],overrides:{}}],logs:[{id:'real',actor:'管理员',at:'2026-10-20',objectId:'e001',action:'更新员工授权',before:'{}',after:'{}'}]};
const raw=JSON.stringify(state),stores=[{id:'s1',title:'上海店',brand:'b',region:'r'},{id:'s2',title:'杭州店',brand:'b',region:'r'}];
const next=seedDemoAudit(state,stores);
assert.equal(JSON.stringify(state),raw);assert.deepEqual(next.roles,state.roles);assert.deepEqual(next.employees,state.employees);assert.equal(next.version,9);assert.equal(next.demoAuditSeedVersion,1);assert.deepEqual(next.logs[0],state.logs[0]);
const demo=next.logs.filter(l=>l.source==='demo');assert.equal(demo.length,6);assert(demo.every(l=>l.objectId==='e001'&&l.action.includes('演示')&&l.actor==='演示管理员'));assert(demo.every(l=>auditEmployeeName(l,next)==='王小明'));
assert(demo.some(l=>l.action==='新增授权门店（演示）'));assert(demo.some(l=>l.action==='移除授权门店（演示）'));assert(demo.some(l=>l.action==='停用账号（演示）'));assert(demo.some(l=>l.action==='启用账号（演示）'));
assert.equal(seedDemoAudit(next,stores),next);const unmarked={...next,demoAuditSeedVersion:undefined};assert.equal(seedDemoAudit(unmarked,stores).logs.length,next.logs.length);
assert.equal(seedDemoAudit({...state,employees:[]},stores).logs.length,1);assert.equal(seedDemoAudit(state,[]).logs.filter(l=>l.source==='demo').length,2);
const withBindings=structuredClone(state);withBindings.employees[0].bindings=[{id:'binding',roleId:'r',scope:{mode:'stores',ids:['s1']}}];assert.equal(seedDemoAudit(withBindings,stores).logs.filter(l=>l.source==='demo').length,5);
for(const l of demo){assert.doesNotThrow(()=>JSON.parse(l.before));assert.doesNotThrow(()=>JSON.parse(l.after));}
console.log('PASS: demo audit seeding, idempotence, deterministic IDs, real logs and permissions preserved, preset filtering and scope/account examples');
