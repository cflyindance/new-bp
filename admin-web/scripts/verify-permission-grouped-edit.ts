import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCenterCatalog, actionKey, pageKey } from '../src/permissions/center-catalog';
import { roleAccess, resolveAccess, type CenterState, type Access, type Store } from '../src/permissions/center-domain';
import { renderPermissionEditor } from '../src/permissions/center-editor';
import { persistCenterChange } from '../src/permissions/center-persistence';
import { authorizationRows,applyAuthorization } from '../src/permissions/center-authorization';
const catalog=buildCenterCatalog();
assert.equal(catalog.resources.get(actionKey('/team/breaks-overtime','manage-break'))?.title,'编辑休息','Other menus must use the approved combined editing pattern');
const {actionGroups,applyActionGroups}=await import('../src/permissions/center-action-groups');
const {sourcePageActions,additionalPageActions}=await import('../src/permissions/center-actions');
assert.equal(Object.values(actionGroups).flat().length,28);
for(const [path,groups] of Object.entries(actionGroups))for(const group of groups){
  const key=actionKey(path,group.id), resource=catalog.resources.get(key)!;
  assert.equal(resource.title,group.title);assert.equal(resource.parent,pageKey(path));
  assert.equal(resource.help,`编辑权限包含${group.members.map(m=>m.operation).join('、')}`);
  const grants:Record<string,Access>={};let parent:string|undefined=pageKey(path);
  while(parent){grants[parent]='read';parent=catalog.resources.get(parent)?.parent;}
  for(const dependency of resource.requires??[])grants[dependency]='read';
  for(const member of group.members){assert.ok(!catalog.resources.has(actionKey(path,member.id)));grants[actionKey(path,member.id)]='edit';}
  const state:CenterState={schema:1,navigationVersion:1,version:0,logs:[],roles:[{id:'r',name:'组合测试',description:'',system:false,grants}],employees:[{id:'e',name:'测试',email:'test@example.com',status:'enabled',bindings:[{id:'b',roleId:'r',scope:{mode:'stores',ids:['a']}}],overrides:{}}]};
  const stores:Store[]=[{id:'a',title:'A',brand:'brand',region:'east'},{id:'b',title:'B',brand:'brand',region:'west'}];
  const value=(k:string)=>roleAccess(state.roles[0],k,catalog.resources);
  assert.equal(value(key),'hidden','Old full CRUD must not automatically grant the combined point');grants[key]='edit';
  assert.equal(value(key),'edit');assert.equal(resolveAccess(state,'e','b',key,stores,catalog.resources),'hidden');
  state.employees[0].overrides.a={[key]:'hidden'};assert.equal(resolveAccess(state,'e','a',key,stores,catalog.resources),'hidden');delete state.employees[0].overrides.a[key];
  const options={catalog,page:pageKey(path),group:'',preview:false,readonly:false,staff:false,value,own:(k:string)=>grants[k]??'hidden',search:''} as const;
  const unified=authorizationRows(catalog,pageKey(path)).find(r=>r.editKeys.includes(key))!;assert.ok(unified);applyAuthorization(grants,unified,'edit');
  for(const variant of [{},{preview:true},{staff:true,readonly:true}]){const html=renderPermissionEditor({...options,...variant});assert.ok(html.includes(unified.title));assert.ok(html.includes(resource.help!));assert.match(html,/role="tooltip"/);}
  grants[pageKey(path)]='hidden';assert.equal(value(key),'hidden');assert.equal(grants[key],'edit');grants[pageKey(path)]='read';
  let saved=JSON.stringify(state);persistCenterChange({getItem:()=>saved,setItem:(_k,v)=>{saved=v;}},'test',state,0,'r','更新角色权限','测试',catalog.resources);
  assert.equal(JSON.parse(saved).roles[0].grants[actionKey(path,group.members[0].id)],'edit');
}
assert.equal(catalog.resources.get(actionKey('/team/roles-employees','manage-role'))?.help,'编辑权限包含新增、修改');
assert.equal(catalog.resources.get(actionKey('/device-management/hardware/emenu','manage-device'))?.help,'编辑权限包含删除、修改');
for(const [path,id] of [['/team/training-performance','publish-course'],['/team/tips/rules','copy'],['/operations/queue-call/buffet-rules','toggle'],['/team/payroll-report','export-detail-pdf'],['/team/payroll-report','save-payroll'],['/permissions/roles','edit'],['/team/roles-employees','save-employee']])assert.ok(catalog.resources.has(actionKey(path,id)),`Independent action lost: ${path}/${id}`);
for(const [path,actions] of Object.entries(additionalPageActions))for(const a of actions)for(const point of [{source:a.source,control:a.control},...(a.relatedControls??[]).map(control=>({source:a.source,control})),...a.relatedSources??[]])assert.ok(readFileSync(point.source,'utf8').includes(point.control),`Missing source: ${path}/${point.control}`);
assert.throws(()=>applyActionGroups({...sourcePageActions,'/team/breaks-overtime':[]}),/缺少/);
assert.ok(!actionGroups['/asset-center/materials'],'Different material operations must not be mechanically grouped');
const rawCount=Object.values(sourcePageActions).reduce((n,a)=>n+a.length,0);
const groupedCount=Object.values(additionalPageActions).reduce((n,a)=>n+a.length,0);
assert.equal(rawCount-groupedCount,47);
console.log(`PASS: 28 explicit object edit groups, ${rawCount-groupedCount} fewer controls, precise help, retained non-CRUD, full source evidence, no legacy privilege expansion and all store/preview/persistence cases`);
