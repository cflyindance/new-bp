import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deleteUnassignedRole,roleBoundEmployees} from '../src/permissions/center-role-delete';
import {persistCenterChange} from '../src/permissions/center-persistence';
import type {CenterState} from '../src/permissions/center-domain';
const state:CenterState={schema:1,employeeAuthorization:'roles-only',version:0,roles:[
  {id:'preset',name:'预设',description:'',system:true,grants:{}},
  {id:'normal',name:'普通',description:'',system:false,grants:{}},
],employees:[],logs:[]};
const before=JSON.stringify(state);
for(const id of ['preset','normal'])assert(!deleteUnassignedRole(state,id).roles.some(role=>role.id===id));
assert.equal(JSON.stringify(state),before);
let raw=JSON.stringify(state);
const storage={getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}};
const saved=persistCenterChange(storage,'test',deleteUnassignedRole(state,'preset'),0,'preset','删除角色','test',new Map());
assert.equal(saved.version,1);
assert.equal(saved.logs[0].after,'null');
assert(!saved.roles.some(role=>role.id==='preset'));
state.employees.push({id:'e',name:'员工',email:'a@example.com',status:'disabled',bindings:[{id:'b',roleId:'preset',scope:{mode:'stores',ids:['s']}}],overrides:{}});
assert.throws(()=>deleteUnassignedRole(state,'preset'),/先解除/);
state.employees[0].bindings.push({id:'b2',roleId:'preset',scope:{mode:'stores',ids:['s2']}});
assert.equal(roleBoundEmployees(state,'preset').length,1,'Multiple store bindings list each employee once');
assert.equal(roleBoundEmployees(state,'normal').length,0);
assert.throws(()=>deleteUnassignedRole(state,'missing'),/角色不存在/);
raw=JSON.stringify(state);
const forced=structuredClone(state);forced.roles=forced.roles.filter(role=>role.id!=='preset');forced.employees[0].bindings=[];
const boundBefore=raw;
assert.throws(()=>persistCenterChange(storage,'test',forced,0,'preset','删除角色','test',new Map()),/先解除/);
assert.equal(raw,boundBefore,'Rejected deletion must not write');
const ui=readFileSync('src/permissions/center-ui.ts','utf8');
assert(!ui.includes('<span class="pc-tag">系统</span>'));
assert(!ui.includes('r.system||memberCount'));
assert(ui.includes('deleteUnassignedRole(state,id)'));
assert(ui.includes("modal('暂不能删除角色'"));
assert(ui.includes('esc(e.name)')&&ui.includes('esc(e.email)'));
assert(!ui.includes('disabled title="请先解除员工的角色分配，再删除角色"'));
console.log('PASS preset role deletion: preset and normal allowed, bound role blocked, missing rejected, immutable input and no system badge');
