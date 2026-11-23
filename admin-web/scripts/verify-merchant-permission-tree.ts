import './lib/permission-tree-test-env';
import assert from 'node:assert/strict';
import {buildCenterCatalog,type Catalog} from '../src/permissions/center-catalog';
import {roleAccess,resolveAccess,type Role,type Resource,type CenterState} from '../src/permissions/center-domain';
import {applyTreeChoice,applyTreeBatch,buildRoleTree,flattenRoleTree,type RoleTreeNode} from '../src/permissions/center-role-tree-model';
import {pageMode} from '../src/permissions/center-page-mode';
import {validateCenterState} from '../src/permissions/center-persistence';
const resources=new Map<string,Resource>([
 ['module:a',{key:'module:a',title:'模块',type:'module'}],
 ['page:a',{key:'page:a',title:'已有页面',type:'page',parent:'module:a',settingPageGate:'page-mode:page:a'}],
 ['page-mode:page:a',{key:'page-mode:page:a',title:'页面上限',type:'setting',parent:'module:a',defaultAccess:'edit',compatibilityOnly:true}],
 ['setting:a',{key:'setting:a',title:'已有设置',type:'setting',parent:'page:a',inheritFrom:'page-mode:page:a',ceilingKeys:['page-mode:page:a']}],
 ['action:a',{key:'action:a',title:'编辑',type:'action',parent:'page:a',ceilingKeys:['page-mode:page:a']}],
 ['page:denied',{key:'page:denied',title:'原隐藏',type:'page',parent:'module:a'}],
]);
const c:Catalog={resources,tree:[],groups:new Map()},r:Role={id:'r',name:'测试角色',description:'',system:false,grants:{'page:denied':'hidden','setting:a':'edit'}};
const n=(key:string,kind:RoleTreeNode['kind'],children:RoleTreeNode[]=[]):RoleTreeNode=>({id:key,key,title:key,kind,children});
assert(applyTreeChoice(c,r,n('module:a','directory'),'read'));
assert.equal(r.grants['page:denied'],'hidden');assert.equal(r.grants['setting:a'],'edit');assert.equal(r.grants['action:a'],'hidden');
assert.equal(pageMode(c,'page:a',k=>roleAccess(r,k,resources)),'read');
const before=JSON.stringify(r);assert.equal(applyTreeChoice(c,r,n('module:a','directory'),'read'),false);assert.equal(JSON.stringify(r),before);
resources.set('page:new',{key:'page:new',title:'新页面',type:'page',parent:'module:a',settingPageGate:'page-mode:page:new'});
resources.set('page-mode:page:new',{key:'page-mode:page:new',title:'新上限',type:'setting',parent:'module:a',defaultAccess:'edit',compatibilityOnly:true});
resources.set('setting:new',{key:'setting:new',title:'新设置',type:'setting',parent:'page:new',inheritFrom:'page-mode:page:new',ceilingKeys:['page-mode:page:new']});
resources.set('action:new',{key:'action:new',title:'新操作',type:'action',parent:'page:new',ceilingKeys:['page-mode:page:new']});
assert.equal(roleAccess(r,'page:new',resources),'read');assert.equal(roleAccess(r,'setting:new',resources),'read');assert.equal(roleAccess(r,'action:new',resources),'hidden');assert.equal(pageMode(c,'page:new',k=>roleAccess(r,k,resources)),'read');
assert.equal(JSON.stringify(r),before,'resolving a new catalog must not write data');
applyTreeChoice(c,r,n('page:new','page'),'edit');assert.equal(roleAccess(r,'setting:new',resources),'read');assert.equal(roleAccess(r,'action:new',resources),'hidden');
applyTreeChoice(c,r,n('setting:new','setting'),'edit');assert.equal(roleAccess(r,'setting:new',resources),'edit');
applyTreeChoice(c,r,n('module:a','directory'),'hidden');assert.equal(roleAccess(r,'page:new',resources),'hidden');applyTreeChoice(c,r,n('module:a','directory'),'read');assert.equal(roleAccess(r,'setting:new',resources),'edit');
const original:Role={...r,grants:{'module:a':'read'}};delete original.readonlyChildren;assert.equal(roleAccess(original,'page:new',resources),'hidden','legacy roles never auto-opt-in');
const state:CenterState={schema:1,version:0,employeeAuthorization:'roles-only',roles:[r],employees:[{id:'e',name:'员工',email:'a@b.cn',status:'enabled',bindings:[{id:'b',roleId:'r',scope:{mode:'stores',ids:['s']}}],overrides:{}}],logs:[]};
assert.equal(resolveAccess(state,'e','s','setting:new',[{id:'s',title:'门店',brand:'b',region:'r'}],resources),'edit');assert.equal(resolveAccess(state,'e','other','setting:new',[{id:'other',title:'其他',brand:'b',region:'r'}],resources),'hidden');
validateCenterState(state,resources);assert.throws(()=>validateCenterState({...state,roles:[{...r,readonlyChildren:{'module:a':'invalid' as unknown as string[]}}]},resources));
const candidate=structuredClone(r),snapshot=JSON.stringify(candidate);assert.throws(()=>applyTreeBatch(c,candidate,[n('module:a','directory'),n('action:new','action')],'read'));assert.equal(JSON.stringify(candidate),snapshot);
const real=buildCenterCatalog(),nodes=flattenRoleTree(buildRoleTree(real));assert(nodes.some(n=>n.title==='切换员工'&&n.kind==='action'));assert(nodes.some(n=>n.title==='编辑员工'&&n.kind==='action'));assert(nodes.some(n=>n.kind==='setting'));assert(nodes.some(n=>n.kind==='content'));
const salary='page:/team/payroll-report',payrole:Role={id:'pay',name:'薪资测试',description:'',system:false,grants:{}};
for(const x of real.resources.values())payrole.grants[x.key]=x.type==='action'?'edit':x.type==='setting'?'edit':'read';
const salaryNode=nodes.find(n=>n.key===salary&&n.kind==='page')!;
applyTreeChoice(real,payrole,salaryNode,'read');
assert.equal(roleAccess(payrole,'action:/team/payroll-report:export-detail-pdf',real.resources),'edit','export works on readonly salary');
assert.equal(roleAccess(payrole,'action:/team/payroll-report:switch-employee',real.resources),'edit');
assert.equal(roleAccess(payrole,'action:/team/payroll-report:edit-employee',real.resources),'hidden','write requires editable page');
applyTreeChoice(real,payrole,salaryNode,'edit');assert.equal(roleAccess(payrole,'action:/team/payroll-report:edit-employee',real.resources),'edit');
console.log('merchant permission tree: future child defaults, no implicit legacy grants, store scope, atomic batch, payroll readonly/write restrictions passed');
const settingPage=nodes.find(n=>n.kind==='page'&&real.resources.get(n.key!)?.settingPageGate&&n.children.some(x=>x.kind==='setting'))!;
assert(settingPage,'settings page exists');
const settingsRole:Role={id:'settings',name:'设置测试',description:'',system:false,grants:{}};
let parent=real.resources.get(settingPage.key!)?.parent;while(parent){settingsRole.grants[parent]='read';const r=real.resources.get(parent)!;if(r.legacyGateKey)settingsRole.grants[r.legacyGateKey]='read';parent=r.parent;}
const allSettingNodes=flattenRoleTree([settingPage]).filter(n=>n.kind==='setting'&&n.key&&!real.resources.get(n.key!)?.compatibilityOnly);
assert(allSettingNodes.length);const field=allSettingNodes[0];
settingsRole.grants[field.key!]='hidden';applyTreeChoice(real,settingsRole,settingPage,'edit');
assert.equal(settingsRole.grants[field.key!],'hidden','page edit retains explicit hidden field');
for(const item of allSettingNodes.slice(1))assert.notEqual(settingsRole.grants[item.key!],'edit','page edit never promotes default children');
applyTreeChoice(real,settingsRole,field,'read');assert.equal(roleAccess(settingsRole,field.key!,real.resources),'read');
applyTreeChoice(real,settingsRole,field,'edit');assert.equal(roleAccess(settingsRole,field.key!,real.resources),'edit');
applyTreeChoice(real,settingsRole,settingPage,'read');assert.equal(settingsRole.grants[field.key!],'edit');assert.equal(roleAccess(settingsRole,field.key!,real.resources),'read');
applyTreeChoice(real,settingsRole,settingPage,'edit');assert.equal(roleAccess(settingsRole,field.key!,real.resources),'edit','restoring ceiling restores explicit field edit');
applyTreeChoice(real,settingsRole,settingPage,'hidden');applyTreeChoice(real,settingsRole,field,'hidden');assert.equal(settingsRole.grants[settingPage.key!],'hidden','hiding a child never reopens hidden page');
console.log('Settings page ceiling, explicit field preservation, default readonly and hidden-page write isolation passed');


// First-level category selection and right-side subtree selection share one, non-authorizing selection state.
const selectionTree=buildRoleTree(real),selection=new Set<string>(),first=selectionTree[0],second=selectionTree[1];
const {roleSelectionTargets,roleSelectionState,toggleRoleSelection}=await import('../src/permissions/center-role-tree-model');
const permissionSnapshot=JSON.stringify(payrole);
toggleRoleSelection(selectionTree,[first],selection,true);
assert(roleSelectionState([first],selection).checked);
assert(roleSelectionTargets([first]).every(n=>selection.has(n.id)));
assert(!flattenRoleTree([first]).filter(n=>n.kind==='action').some(n=>selection.has(n.id)));
const leaf=roleSelectionTargets([first]).find(n=>!roleSelectionTargets(n.children).length)!;
toggleRoleSelection(selectionTree,[leaf],selection,false);
assert(roleSelectionState([first],selection).indeterminate);
assert(!roleSelectionState([first],selection).checked);
assert(!selection.has(first.id),'a partial parent is not treated as an explicitly selected batch target');
toggleRoleSelection(selectionTree,[second],selection,true);
assert(roleSelectionState([second],selection).checked);
assert(roleSelectionState([first],selection).indeterminate,'selecting another category preserves the first category');
toggleRoleSelection(selectionTree,[first],selection,false);
assert.equal(roleSelectionState([first],selection).selectedCount,0);
assert(roleSelectionState([second],selection).checked);
assert.equal(JSON.stringify(payrole),permissionSnapshot,'selection must never mutate grants or default policies');
console.log('First-level checkbox, subtree linkage, partial state, cross-category retention and selection-only behavior passed');
