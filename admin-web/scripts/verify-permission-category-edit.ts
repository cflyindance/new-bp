import assert from 'node:assert/strict';
import { buildCenterCatalog, actionKey, pageKey } from '../src/permissions/center-catalog';
import { roleAccess, resolveAccess, type CenterState, type Store, type Access } from '../src/permissions/center-domain';
import { renderPermissionEditor } from '../src/permissions/center-editor';
import { persistCenterChange } from '../src/permissions/center-persistence';
const catalog=buildCenterCatalog(),path='/operations/queue-call/classification-settings';
const key=actionKey(path,'manage-category'),page=pageKey(path),menu=actionKey(path,'edit-menu');
assert.equal(catalog.resources.get(key)?.title,'编辑分类','Classification CRUD must be one edit-category permission');
assert.equal(catalog.resources.get(key)?.help,'编辑权限包含新增、删除、修改');
for(const id of ['create','edit','delete'])assert.ok(!catalog.resources.has(actionKey(path,id)));
const grants:Record<string,Access>={};let parent:string|undefined=page;
while(parent){grants[parent]='read';parent=catalog.resources.get(parent)?.parent;}
for(const dependency of catalog.resources.get(key)!.requires??[])grants[dependency]='read';
for(const id of ['create','edit','delete'])grants[actionKey(path,id)]='edit';
const state:CenterState={schema:1,navigationVersion:1,version:0,logs:[],roles:[{id:'r',name:'分类测试',description:'',system:false,grants}],employees:[{id:'e',name:'员工',email:'test@example.com',status:'enabled',bindings:[{id:'b',roleId:'r',scope:{mode:'stores',ids:['a']}}],overrides:{a:{[actionKey(path,'delete')]:'edit'}}}]};
const stores:Store[]=[{id:'a',title:'A',brand:'brand',region:'east'},{id:'b',title:'B',brand:'brand',region:'east'}];
const value=(k:string)=>roleAccess(state.roles[0],k,catalog.resources);
assert.equal(value(key),'hidden','Even full legacy CRUD does not implicitly grant a newly combined action');
assert.equal(resolveAccess(state,'e','a',key,stores,catalog.resources),'hidden');
state.roles[0].grants[key]='edit';
assert.equal(value(key),'edit');assert.equal(value(menu),'hidden');
assert.equal(resolveAccess(state,'e','a',key,stores,catalog.resources),'edit');assert.equal(resolveAccess(state,'e','b',key,stores,catalog.resources),'hidden');
state.employees[0].overrides.a[key]='hidden';assert.equal(resolveAccess(state,'e','a',key,stores,catalog.resources),'hidden');delete state.employees[0].overrides.a[key];
state.roles[0].grants[page]='hidden';assert.equal(value(key),'hidden');assert.equal(state.roles[0].grants[key],'edit');state.roles[0].grants[page]='read';
const options={catalog,page,group:'',preview:false,readonly:false,staff:false,value,own:(k:string)=>grants[k]??'hidden',search:''} as const;
for(const variant of [{},{preview:true},{staff:true,readonly:true}]){
  const html=renderPermissionEditor({...options,...variant});
  assert.match(html,/编辑分类/);assert.match(html,/编辑权限包含新增、删除、修改/);assert.match(html,/aria-describedby=/);assert.match(html,/role="tooltip"/);
  assert.doesNotMatch(html,/新增分类|删除分类/);
}
let saved=JSON.stringify(state);
const storage={getItem:()=>saved,setItem:(_k:string,v:string)=>{saved=v;}};
persistCenterChange(storage,'test',state,0,'r','更新角色权限','测试',catalog.resources);
const restored:CenterState=JSON.parse(saved);
assert.equal(restored.roles[0].grants[actionKey(path,'delete')],'edit');
assert.equal(restored.employees[0].overrides.a[actionKey(path,'delete')],'edit');
assert.equal(roleAccess(restored.roles[0],actionKey(path,'delete'),catalog.resources),'hidden');
assert.equal(roleAccess(restored.roles[0],key,catalog.resources),'edit');
console.log('PASS: combined category editing, explanation in all views, no legacy privilege expansion, retained retired keys, independent menu action, per-store overrides and persistence');
