import assert from 'node:assert/strict';
import { providerCanTarget, providerRoleAccess, validateProviderState, type ProviderAccessState } from '../src/permissions/provider-access-domain';
import type { Resource } from '../src/permissions/center-domain';
const resources=new Map<string,Resource>([
 ['module:orders',{key:'module:orders',title:'订单',type:'module'}],
 ['page:/orders/all',{key:'page:/orders/all',title:'订单列表',type:'page',parent:'module:orders',path:'/orders/all'}],
 ['module:finance',{key:'module:finance',title:'财务',type:'module'}],
 ['page:/finance',{key:'page:/finance',title:'财务',type:'page',parent:'module:finance',path:'/finance'}],
 ['action:/orders/all:edit',{key:'action:/orders/all:edit',title:'编辑',type:'action',parent:'page:/orders/all'}],
]);
const state:ProviderAccessState={schema:1,revision:0,systemEmployeeIds:['ent001'],logs:[],roles:[
 {id:'orders',name:'订单只读',description:'',system:false,grants:{'module:orders':'read','page:/orders/all':'read'}},
 {id:'finance',name:'财务只读',description:'',system:false,grants:{'module:finance':'read','page:/finance':'read'}},
],employees:[{employeeId:'a',bindings:[{id:'1',roleId:'orders',scope:{mode:'stores',ids:['s1']}},{id:'2',roleId:'finance',scope:{mode:'stores',ids:['s2']}}]},
 {employeeId:'b',bindings:[{id:'3',roleId:'finance',scope:{mode:'stores',ids:['s1']}}]},
 {employeeId:'c',bindings:[{id:'4',roleId:'orders',scope:{mode:'brands',ids:['brand']}}]}]};
validateProviderState(state);
const access=(id:string,storeId:string,key:string)=>providerRoleAccess(state,id,{brandId:'brand',storeId},key,resources);
assert.equal(access('a','s1','page:/orders/all'),'read');
assert.equal(access('a','s1','page:/finance'),'hidden');
assert.equal(access('a','s2','page:/finance'),'read');
assert.equal(access('a','s2','page:/orders/all'),'hidden');
assert.equal(access('b','s1','page:/finance'),'read');
assert.equal(access('b','s1','page:/orders/all'),'hidden');
assert.equal(access('a','s1','action:/orders/all:edit'),'hidden');
assert.equal(providerCanTarget(state,'a',{brandId:'brand'}),false);
assert.equal(providerCanTarget(state,'a',{brandId:'brand',storeId:'s3'}),false);
assert.equal(providerCanTarget(state,'c',{brandId:'brand',storeId:'new-store'}),true);
assert.equal(providerCanTarget(state,'unknown',{brandId:'brand',storeId:'s1'}),false);
assert.equal(access('ent001','s1','unknown'),'hidden');
assert.equal(access('ent001','s1','page:/finance'),'read');
const revoked=structuredClone(state);revoked.employees[0].bindings=[];
assert.equal(providerCanTarget(revoked,'a',{brandId:'brand',storeId:'s1'}),false);
const broken=structuredClone(state);broken.employees[0].bindings[0].roleId='missing';
assert.throws(()=>validateProviderState(broken));
console.log('Provider access: 16 domain assertions passed');
