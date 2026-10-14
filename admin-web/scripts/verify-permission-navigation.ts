import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCenterCatalog, pageKey, actionKey } from '../src/permissions/center-catalog';
import { roleAccess, resolveAccess, type CenterState, type Role, type Store, type Resource } from '../src/permissions/center-domain';
import { renderPermissionEditor } from '../src/permissions/center-editor';
import { persistCenterChange } from '../src/permissions/center-persistence';

const catalog=buildCenterCatalog();
const moduleKey='module:product-center-main';
const products='navigation:product-center-main:pcm-brand-products';
const seasoning='navigation:product-center-main:bp-seasoning-mgmt';
const tags='navigation:product-center-main:bp-tags-mgmt';
const seasoningPage=pageKey('/brand-products/seasoning-mgmt/seasoning');
const tagPage=pageKey('/brand-products/tags/description');
const create=actionKey('/brand-products/seasoning-mgmt/seasoning','create-option');
assert.ok(catalog.resources.has(products),'商品管理 must have independent permission');
assert.equal(catalog.resources.get(seasoning)?.parent,products);
assert.equal(catalog.resources.get(tags)?.parent,products);
assert.equal(catalog.resources.get(products)?.parent,moduleKey);
assert.equal(catalog.resources.get(seasoningPage)?.parent,seasoning);
assert.equal(catalog.resources.get(tagPage)?.parent,tags);
const {migrateNavigationPermissions}=await import('../src/permissions/center-navigation-migration');
const {navigationKey}=await import('../src/permissions/center-catalog');
assert.equal(navigationKey('product-center-main','bp-seasoning-mgmt'),seasoning);

const role:Role={id:'r',name:'导航测试',description:'',system:false,grants:{[moduleKey]:'read',[products]:'read',[seasoning]:'hidden',[tags]:'read',[seasoningPage]:'read',[tagPage]:'read',[create]:'edit'}};
const own=(key:string)=>role.grants[key]??'hidden';
const value=(key:string)=>roleAccess(role,key,catalog.resources);
assert.equal(value(seasoningPage),'hidden');
assert.equal(value(create),'hidden');
assert.equal(value(tagPage),'read');
const childrenBefore=JSON.stringify({seasoningPage:own(seasoningPage),create:own(create),tags:own(tags),tagPage:own(tagPage)});
role.grants[seasoning]='read';assert.equal(value(create),'edit');
role.grants[products]='hidden';assert.equal(value(tagPage),'hidden');
role.grants[products]='read';assert.equal(value(tagPage),'read');assert.equal(value(create),'edit');
assert.equal(JSON.stringify({seasoningPage:own(seasoningPage),create:own(create),tags:own(tags),tagPage:own(tagPage)}),childrenBefore);

const keys=new Set<string>();
function checkTree(nodes:typeof catalog.tree,parent?:string):void {
  for(const node of nodes){
    if(node.id==='store-management-directory'){assert.equal(node.key,undefined);checkTree(node.children,parent);continue;}
    assert.ok(node.key,`Missing permission: ${node.title}`);
    assert.ok(!keys.has(node.key!),`Duplicate tree key: ${node.key}`);keys.add(node.key!);
    assert.equal(catalog.resources.get(node.key!)?.parent,parent,`Wrong direct parent: ${node.title}`);
    checkTree(node.children,node.key);
  }
}
checkTree(catalog.tree);
const options={catalog,page:products,group:'',preview:false,readonly:false,staff:false,value,own,search:''};
let html=renderPermissionEditor(options);
assert.match(html,/子导航查看权限/);assert.match(html,new RegExp(`data-grant="${seasoning}"`));
assert.match(html,/<small>商品中心<\/small><h2>商品管理<\/h2>/);
const searched=renderPermissionEditor({...options,search:'调味管理'});
assert.match(searched,/data-page="page:\/brand-products\/seasoning-mgmt\/distribution-log"/);
role.grants[seasoning]='hidden';
html=renderPermissionEditor({...options,page:tagPage,preview:true});
assert.doesNotMatch(html,/data-menu-node="bp-seasoning-mgmt"/);
assert.match(html,/data-menu-node="bp-tags-mgmt"/);
assert.match(html,/data-page="page:\/brand-products\/tags\/description"/);
role.grants['navigation:product-center-main:bp-recipes-mgmt']='read';
assert.doesNotMatch(renderPermissionEditor({...options,preview:true}),/配方管理/,'Empty navigation must be absent in both preview tree and child list');
assert.equal(roleAccess({...role,grants:{[moduleKey]:'read'}},products,catalog.resources),'hidden','New roles must not inherit compatibility grants');
assert.match(renderPermissionEditor({...options,page:seasoningPage}),/disabled title="上级导航不可查看"/);
assert.match(renderPermissionEditor({...options,readonly:true,staff:true}),/data-menu-access="hidden"/);

const stores:Store[]=[{id:'a',title:'A',brand:'b',region:'east'},{id:'b',title:'B',brand:'b',region:'west'}];
const legacyResources=new Map<string,Resource>();
for(const [key,r] of catalog.resources){
  if(r.type==='navigation')continue;
  let parent=r.parent;
  while(parent&&catalog.resources.get(parent)?.type==='navigation')parent=catalog.resources.get(parent)!.parent;
  legacyResources.set(key,{...r,parent});
}
const old:CenterState={schema:1,version:7,logs:[],roles:[
  {id:'r',name:'旧角色',description:'',system:false,grants:{[moduleKey]:'read',[seasoningPage]:'read',[tagPage]:'read',[create]:'edit'}},
  {id:'empty',name:'旧空白角色',description:'',system:false,grants:{}},
],employees:[
  {id:'e',name:'员工',email:'e@example.com',status:'enabled',bindings:[{id:'b1',roleId:'r',scope:{mode:'stores',ids:['a']}}],overrides:{a:{[seasoningPage]:'hidden'},b:{[moduleKey]:'read',[seasoningPage]:'read',[create]:'edit'}}},
  {id:'empty',name:'未授权',email:'',status:'unopened',bindings:[],overrides:{}},
]};
const original=structuredClone(old);
const migrated=migrateNavigationPermissions(old,catalog.resources,stores);
assert.deepEqual(old,original,'Reading migration must not mutate saved data');
assert.equal(migrated.navigationVersion,1);assert.equal(migrated.version,7);
assert.deepEqual(migrateNavigationPermissions(migrated,catalog.resources,stores),migrated);
for(const r of old.roles)for(const resource of legacyResources.values())assert.equal(roleAccess(migrated.roles.find(x=>x.id===r.id)!,resource.key,catalog.resources),roleAccess(r,resource.key,legacyResources),`Role migration changed ${resource.key}`);
for(const e of old.employees)for(const store of stores)for(const resource of legacyResources.values())assert.equal(resolveAccess(migrated,e.id,store.id,resource.key,stores,catalog.resources),resolveAccess(old,e.id,store.id,resource.key,stores,legacyResources),`Employee migration changed ${e.id}/${store.id}/${resource.key}`);
assert.equal(resolveAccess(migrated,'e','b',create,stores,catalog.resources),'edit');
migrated.employees[0].overrides.b[seasoning]='hidden';
assert.equal(resolveAccess(migrated,'e','b',create,stores,catalog.resources),'hidden');
assert.equal(resolveAccess(migrated,'e','a',tagPage,stores,catalog.resources),'read');
delete migrated.employees[0].overrides.b[seasoning];assert.equal(resolveAccess(migrated,'e','b',create,stores,catalog.resources),'hidden');
migrated.employees[0].overrides.b[seasoning]='read';assert.equal(resolveAccess(migrated,'e','b',create,stores,catalog.resources),'edit');
// A second role can supply the ancestor: union first, then gate descendants.
const split=structuredClone(migrated);split.roles.push({...role,id:'r2',name:'第二角色',grants:{[tags]:'read',[tagPage]:'read'}});
split.roles[0].grants[tags]='hidden';split.roles[0].grants[tagPage]='hidden';
split.employees[0].bindings.push({id:'b2',roleId:'r2',scope:{mode:'stores',ids:['a']}});
assert.equal(resolveAccess(split,'e','a',tagPage,stores,catalog.resources),'read');
split.employees[0].overrides.a[products]='hidden';assert.equal(resolveAccess(split,'e','a',tagPage,stores,catalog.resources),'hidden');
// Already-upgraded states must not silently grant a newly added navigation node.
const future=new Map(catalog.resources);future.set('future',{key:'future',title:'未来导航',type:'navigation',parent:moduleKey});
assert.equal(migrateNavigationPermissions(migrated,future,stores).roles[0].grants.future,undefined);
let raw=JSON.stringify(old);
const storage={getItem:()=>raw,setItem:(_key:string,v:string)=>{raw=v;}};
const saved=persistCenterChange(storage,'test',migrated,7,'r','更新角色权限','测试',catalog.resources);
assert.equal(saved.navigationVersion,1);assert.equal(saved.version,8);
const reloaded=JSON.parse(raw) as CenterState;assert.equal(roleAccess(reloaded.roles[0],tagPage,catalog.resources),'read');
const invalid=structuredClone(saved);invalid.roles[0].grants[products]='edit';
assert.throws(()=>persistCenterChange(storage,'test',invalid,8,'r','保存','测试',catalog.resources),/权限状态无效/);
assert.match(readFileSync('src/permissions/center.css','utf8'),/\.pc-dialog\.pc-preview\s*\{\s*width:\s*min\(1250px,\s*96vw\)/,'Preview dialog must fit the complete navigation and detail columns');
console.log(`PASS: ${[...catalog.resources.values()].filter(r=>r.type==='navigation').length} independent navigation resources; direct parents, sibling isolation, ancestor restore, preview, role union, store overrides, no-expansion migration and persistence`);
