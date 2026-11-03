import assert from 'node:assert/strict';
import { createProviderDemoState, providerStateFromStorage } from '../src/permissions/provider-access-demo';
import { validateProviderState, providerCanTarget, providerRoleAccess } from '../src/permissions/provider-access-domain';
import type { Resource } from '../src/permissions/center-domain';
const resources=new Map<string,Resource>([
 ['module:orders',{key:'module:orders',title:'订单',type:'module'}],
 ['page:/orders/all',{key:'page:/orders/all',title:'订单列表',type:'page',parent:'module:orders'}],
 ['action:test',{key:'action:test',title:'操作',type:'action',parent:'page:/orders/all'}],
 ['setting:test',{key:'setting:test',title:'设置',type:'setting',parent:'page:/orders/all'}],
]);
const seed=createProviderDemoState(resources);validateProviderState(seed);
assert.equal(seed.roles.length,3);assert.equal(seed.logs.length,3);assert.equal(seed.employees.length,0);
assert.deepEqual(seed.systemEmployeeIds,['ent001']);
assert.equal(providerCanTarget(seed,'ent002',{brandId:'b'}),false);
assert.equal(providerRoleAccess(seed,'ent002',{brandId:'b'},'page:/orders/all',resources),'hidden');
assert.equal(seed.roles[0].grants['page:/orders/all'],'read');
assert.equal(seed.roles[0].grants['action:test'],undefined);assert.equal(seed.roles[0].grants['setting:test'],undefined);
seed.roles[0].name='changed';assert.notEqual(createProviderDemoState(resources).roles[0].name,'changed');
assert(seed.logs.every(l=>l.actor.includes('非真实')&&l.action.startsWith('演示')));
console.log('PASS: 3 demo roles/logs; no employee grants, no action/settings grants, isolated seed copies');

const existing={schema:1 as const,revision:8,systemEmployeeIds:['ent001'],roles:[],employees:[],logs:[]};
const raw=JSON.stringify(existing);
assert.deepEqual(providerStateFromStorage(raw,()=>{throw Error('Existing data must not build demo catalog');}),existing);
assert.equal(providerStateFromStorage(null,()=>resources).roles.length,3);
assert.throws(()=>providerStateFromStorage('broken',()=>resources));
existing.roles=[];assert.equal(providerStateFromStorage(JSON.stringify(existing),()=>resources).roles.length,0);
console.log('PASS: missing storage seeds only; saved empty state preserved; corrupt JSON fails without overwrite');

const populated={...existing,roles:createProviderDemoState(resources).roles,employees:[{employeeId:'existing',bindings:[]}],logs:[{id:'existing-log'}]};
assert.deepEqual(providerStateFromStorage(JSON.stringify(populated),()=>resources),populated);
