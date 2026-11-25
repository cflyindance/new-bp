import assert from 'node:assert/strict';
import {auditMetadata} from '../src/permissions/center-audit-metadata';
import {presentAudit} from '../src/permissions/center-audit-presentation';
import {renderAuditDiff} from '../src/permissions/center-audit-diff';
import type {CenterState,Audit,Resource} from '../src/permissions/center-domain';
const state:CenterState={schema:1,version:1,roles:[{id:'r',name:'店长',description:'',system:false,grants:{}}],employees:[],logs:[]};
const context={state,stores:[{id:'s1',title:'上海店',brand:'b',region:'华东'},{id:'s2',title:'杭州店',brand:'b',region:'华东'}],brands:[{id:'b',name:'测试品牌'}],resources:new Map<string,Resource>([['page:x',{key:'page:x',title:'订单中心',type:'page'}],['action:x',{key:'action:x',title:'退款',type:'action',parent:'page:x'}]])};
const binding={id:'binding',roleId:'r',scope:{mode:'stores',ids:['s1']}};
const before={id:'e',name:'王小明',email:'a@example.com',status:'enabled',bindings:[binding],overrides:{}};
const log=(a:unknown,b:unknown):Audit=>({id:'l',at:'2026-10-20',actor:'管理员',objectId:'e',action:'更新员工授权',before:JSON.stringify(a),after:JSON.stringify(b)});
const after={...before,bindings:[{...binding,scope:{mode:'stores',ids:['s1','s2']}}]};
let html=renderAuditDiff(log(before,after),context);
assert.match(html,/王小明/);assert.match(html,/店长 → 授权范围/);assert.match(html,/杭州店.*新增/);assert.match(html,/上海店/);assert.doesNotMatch(html,/登录邮箱|账号状态|binding|roleId|M000/);
html=renderAuditDiff(log(after,before),context);assert.match(html,/杭州店.*移除/);
html=renderAuditDiff(log(before,{...before,bindings:[]}),context);assert.match(html,/角色分配/);assert.match(html,/移除/);
html=renderAuditDiff(log(before,before),context);assert.match(html,/未发现字段变化/);
html=renderAuditDiff(log({...before,bindings:[binding,{...binding,id:'second'}]},{...before,bindings:[{...binding,id:'second'},binding]}),context);assert.match(html,/未发现字段变化/);
html=renderAuditDiff(log({name:'read',grants:{'action:x':'hidden'}},{name:'read',grants:{'action:x':'edit'}}),context);assert.match(html,/角色：<strong>read/);assert.match(html,/订单中心 → 退款/);assert.match(html,/可编辑/);
html=renderAuditDiff(log(null,before),context);assert.match(html,/登录邮箱/);assert.match(html,/新增/);
html=renderAuditDiff(log(before,null),context);assert.match(html,/移除/);
html=renderAuditDiff(log(before,{...before,name:'<img src=x onerror=alert(1)>'}),context);assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);
html=renderAuditDiff(log(before,{...before,bindings:[{...binding,roleId:'deleted',scope:{mode:'stores',ids:['unknown']}}]}),context);assert.match(html,/名称不可用（deleted）/);assert.match(html,/名称不可用（unknown）/);
html=renderAuditDiff({...log(before,after),before:'not-json'},context);assert.match(html,/无法解析/);assert.match(html,/查看原始记录/);
console.log('PASS: audit diff scope add/remove, unchanged filtering, binding reorder, role grants, create/delete, escaping, missing names and malformed history');


const initial:CenterState={
  ...state,
  roles:[{...state.roles[0]!,defaultStoreIds:['s1','s2']}],
  employees:[
    { ...before, status:'enabled', bindings:[{...binding,scope:{mode:'stores',ids:[]}}], extraStoreIds:['s2'] },
    { ...before, id:'e2',name:'李小明',status:'enabled',bindings:[{...binding,scope:{mode:'stores',ids:[]}}] },
  ],
};
const updated=structuredClone(initial);
updated.roles[0]!.defaultStoreIds=[];
const metadata=auditMetadata(initial,updated,'r',context.stores,context.brands);
assert.equal(metadata.storeChanges?.length,2);
assert.deepEqual(metadata.storeChanges?.[0]?.stores.map(row=>row.after),[[],['账号额外授权']]);
const change={...log(initial.roles[0],updated.roles[0]),...metadata,objectId:'r',action:'更新角色授权门店'};
const later={...context,state:updated,stores:context.stores.map(store=>({...store,title:'已改名'}))};
html=renderAuditDiff(change,later,'e');
assert.match(html,/杭州店/);
assert.match(html,/授权来源变化，门店仍可访问/);
assert.match(html,/移除可访问门店/);
assert.doesNotMatch(html,/已改名|李小明/);
assert.match(presentAudit(change,updated).summary,/影响 2 位员工/);
const invitation={...log(before,before),action:'重发演示邀请',account:{before:{method:'email' as const,expiresAt:'2026-10-22T00:00:00Z'},after:{method:'email' as const,expiresAt:'2026-10-24T00:00:00Z'}}};
assert.match(renderAuditDiff(invitation,context),/邀请有效期/);
assert.match(presentAudit(invitation,state).summary,/有效期/);
console.log('PASS: role impact, unchanged access through another grant, historical names, employee scope, invitation-only changes');
