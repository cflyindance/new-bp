import assert from 'node:assert/strict';
import {buildMEditorCatalog,mEditorGrantKey,mEditorValue,applyMEditorGrant,renderMRolePermissionEditor} from '../src/permissions/m-platform-editor';
import {M_MODULES,M_RESOURCES} from '../src/permissions/m-platform-catalog';
import {buildMNavigationModules,buildMNavigationTree} from '../src/permissions/m-platform-navigation';
import {mResolve,mRoleState,type MRole} from '../src/permissions/m-platform-domain';
const original=JSON.stringify(M_MODULES), catalog=buildMEditorCatalog(), tree=catalog.tree;
function find(nodes:any[],title:string):any {for(const n of nodes){if(n.title===title)return n;const found=find(n.children,title);if(found)return found;}}
const routing=find(tree,'菜单与页面管理');
assert(routing.children.some((n:any)=>n.title==='菜单配置'), 'M role editor omits 菜单配置 middle level');
assert(find(tree,'页面注册中心')?.children.some((n:any)=>n.title==='项目管理'));
assert(find(tree,'角色与权限')?.children.some((n:any)=>n.title==='平台管理角色'));
assert(find(tree,'展示区域管理'));assert(find(tree,'业态与菜单模板'));

const flat=(nodes:any[]):any[]=>nodes.flatMap(n=>[n,...flat(n.children)]);
const nodes=flat(tree);
assert.equal(new Set(nodes.map(n=>n.key)).size,nodes.length,'every display node has unique selectable identity');
assert.deepEqual(nodes.filter(n=>!n.children.length).map(n=>n.id).sort(),flat(buildMNavigationTree()).filter(n=>!n.children.length).map(n=>n.path).sort(),'all sidebar leaves represented');
assert.equal(JSON.stringify(M_MODULES),original,'no mutation of permission catalog');
assert([...M_RESOURCES.keys()].every(k=>catalog.resources.has(k)),'all original resources retained');
for(const [key,target] of catalog.grantKeys)assert(target===undefined||M_RESOURCES.has(target),'display mapping never creates new grants');
const roles=find(tree,'角色与权限');assert.equal(mEditorGrantKey(catalog,roles.key),undefined);
assert.deepEqual(roles.children.map((n:any)=>n.title),['平台管理角色','商户访问角色']);
const menu=find(tree,'菜单配置'), registry=find(tree,'页面注册中心');
assert.deepEqual(menu.children.map((n:any)=>n.title),['菜单管理','操作记录']);
assert.deepEqual(registry.children.map((n:any)=>n.title),['项目管理','页面管理','操作记录']);
const role:MRole={id:'r',name:'r',description:'',grants:{'m:module:routing':'read','m:page:routing':'read','m:module:presets':'read','m:page:presets':'read','m:module:permissions':'read','m:page:roles':'read'}};
const value=(key:string)=>mResolve(mRoleState(role),'preview',key);
for(const page of [...menu.children,...registry.children])assert.equal(mEditorValue(catalog,page.key,value),'read');
applyMEditorGrant(role,mEditorGrantKey(catalog,menu.children[0].key)!,'edit',value);
for(const page of [...menu.children,...registry.children])assert.equal(mEditorValue(catalog,page.key,value),'edit');
assert.equal(mEditorValue(catalog,roles.key,value),'read','organizational folder follows visible children');
assert(!Object.keys(role.grants).some(k=>k.startsWith('m:view:')||k.startsWith('m:directory:')),'no presentation key persisted');
for(const title of ['展示区域管理','业态与菜单模板'])assert.equal(mEditorGrantKey(catalog,find(tree,title).key),'m:page:presets');
assert.deepEqual(buildMNavigationModules([]),[]);
console.log('PASS: full M navigation hierarchy, sidebar leaf parity, unique display identities, preserved authorization keys, shared grants and filtered groups');

const html=renderMRolePermissionEditor({catalog,selected:roles.key,preview:false,readonly:false,search:'',own:key=>role.grants[key]??'hidden',value});
assert(html.indexOf('<th scope="row">平台管理角色</th>')<html.indexOf('<th scope="row">商户访问角色</th>'),'detail rows follow navigation order');
