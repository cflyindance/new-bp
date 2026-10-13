import assert from 'node:assert/strict';
import { resolveAccess, roleAccess, deniedStores, validateInvite, validateRole, type CenterState, type Store, type Resource } from '../src/permissions/center-domain';
const resources = new Map<string, Resource>([
  ['page', { key:'page', title:'页面', type:'page' }],
  ['create', { key:'create', title:'新增', type:'action', parent:'page' }],
  ['edit', { key:'edit', title:'编辑', type:'action', parent:'page' }],
  ['setting', { key:'setting', title:'设置', type:'setting', parent:'page' }],
]);
const stores: Store[] = [{ id:'a',title:'A',brand:'brand',region:'east' },{ id:'b',title:'B',brand:'brand',region:'west' }];
const state: CenterState = { schema:1,version:0,logs:[],roles:[{ id:'r',name:'新增员',description:'',system:false,grants:{page:'read',create:'edit',edit:'hidden',setting:'read'} }],employees:[{ id:'e',name:'员工',email:'a@example.com',status:'enabled',bindings:[{id:'g',roleId:'r',scope:{mode:'stores',ids:['a']}}],overrides:{} }] };
const get = (store: string,key: string) => resolveAccess(state,'e',store,key,stores,resources);
assert.equal(get('a','create'),'edit'); assert.equal(get('a','edit'),'hidden'); assert.equal(get('b','create'),'hidden');
assert.deepEqual(deniedStores(state,'e',['a','b'],'create',stores,resources),['b']);
state.employees[0].overrides.a = {create:'hidden'};
assert.equal(get('a','create'),'hidden'); delete state.employees[0].overrides.a.create; assert.equal(get('a','create'),'edit');
state.roles[0].grants.page='hidden'; assert.equal(get('a','create'),'hidden'); assert.equal(state.roles[0].grants.create,'edit');
state.roles[0].grants.page='read'; state.employees[0].bindings[0].scope={mode:'brands',ids:['brand']};
assert.equal(get('b','create'),'edit'); stores.push({id:'c',title:'C',brand:'brand',region:'east'}); assert.equal(get('c','create'),'edit');
assert.equal(get('a','unknown'),'hidden'); assert.equal(roleAccess(state.roles[0],'unknown',resources),'hidden');
assert.throws(()=>validateInvite(state,'新员工',' A@EXAMPLE.COM '), /已存在/);
assert.throws(()=>validateInvite(state,'','new@example.com')); assert.throws(()=>validateInvite(state,'员工','invalid'));
assert.throws(()=>validateRole(state,{...state.roles[0],id:'r2'}),/已存在/);
console.log('PASS: scoped roles, independent actions, parent gate, overrides, dynamic scope, batch denial, validation');

const {buildCenterCatalog,pageKey} = await import('../src/permissions/center-catalog');
const {MODULE_SETTINGS_BY_PATH} = await import('../src/config/module-settings-catalog');
const {renderPermissionEditor} = await import('../src/permissions/center-editor');
const catalog=buildCenterCatalog();
for(const hub of Object.values(MODULE_SETTINGS_BY_PATH)) {
  assert.ok(catalog.resources.has(pageKey(hub.settingsPath)),`Missing hub: ${hub.settingsPath}`);
  const keys=catalog.groups.get(pageKey(hub.settingsPath))!.flatMap(g=>g.keys);
  assert.equal(new Set(keys).size,hub.items.length,`Missing/duplicate setting: ${hub.settingsPath}`);
}
assert.equal([...catalog.resources.values()].filter(r=>r.type==='action').length,11);
const foh=pageKey('/operations/queue-call/settings');
const opts={catalog,page:foh,group:'',preview:false,readonly:false,staff:false,value:()=> 'read' as const,own:()=> 'read' as const,search:''};
assert.match(renderPermissionEditor(opts),/设置分类/);
assert.match(renderPermissionEditor({...opts,preview:true}),/只读/);
assert.doesNotMatch(renderPermissionEditor({...opts,preview:true,value:()=> 'hidden' as const}),/data-page=/);
console.log(`PASS: ${catalog.tree.length} modules, ${catalog.groups.size} settings pages, all settings and 11 audited actions, preview filtering`);

const {persistCenterChange}=await import('../src/permissions/center-persistence');
let saved=JSON.stringify(state);
const storage={getItem:()=>saved,setItem:(_key:string,value:string)=>{saved=value;}};
const next=structuredClone(state);next.roles[0].name='改名';
const persisted=persistCenterChange(storage,'test',next,0,'r','编辑角色','测试',resources);
assert.equal(persisted.version,1);assert.equal(persisted.logs.length,1);assert.match(persisted.logs[0].before,/新增员/);
assert.throws(()=>persistCenterChange(storage,'test',next,0,'r','编辑','测试',resources),/其他窗口/);
const remove=structuredClone(persisted);remove.roles=[];
assert.throws(()=>persistCenterChange(storage,'test',remove,1,'r','删除','测试',resources));
const before=saved;const quotaStorage={getItem:()=>saved,setItem:()=>{throw Error('QuotaExceededError');}};
assert.throws(()=>persistCenterChange(quotaStorage,'test',persisted,1,'r','编辑','测试',resources),/Quota/);assert.equal(saved,before);
// Another applicable role can supply the parent gate; final union gates descendants.
state.roles.push({id:'r2',name:'额外动作',description:'',system:false,grants:{create:'edit'}});
state.roles[0].grants.create='hidden';state.employees[0].bindings.push({id:'g2',roleId:'r2',scope:{mode:'stores',ids:['a']}});
assert.equal(get('a','create'),'edit');state.employees[0].overrides.a.page='hidden';assert.equal(get('a','create'),'hidden');
console.log('PASS: union before ancestor gate, persistence, audit, optimistic conflict, deletion protection and quota failure');
