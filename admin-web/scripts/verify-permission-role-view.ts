import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rolePageRoute} from '../src/permissions/center-role-route';
import {renderPermissionEditor,type EditorOptions} from '../src/permissions/center-editor';
import {buildCenterCatalog,type Catalog} from '../src/permissions/center-catalog';
import {roleAccess,type Role,type Resource} from '../src/permissions/center-domain';
import {effectiveMenuView} from '../src/permissions/center-effective-menu';
import {isMerchantPermissionsPath} from '../src/permissions/rbac-scope';
import {authorizationRows} from '../src/permissions/center-authorization';

assert.deepEqual(rolePageRoute('/permissions/roles/view/a%20b'),{id:'a b',readonly:true});
assert.deepEqual(rolePageRoute('/permissions/roles/edit/a%20b'),{id:'a b',readonly:false});
for(const path of ['/permissions/roles/new','/permissions/roles','/permissions/roles/view/','/permissions/roles/view/%ZZ','/m-platform/permissions/roles/view/r'])assert.equal(rolePageRoute(path),undefined);
assert(isMerchantPermissionsPath('/permissions/roles/view/r'));
const resources=new Map<string,Resource>([
 ['m',{key:'m',title:'模块',type:'module'}],['p',{key:'p',title:'可访问页面',type:'page',parent:'m'}],['deny',{key:'deny',title:'未授权页面',type:'page',parent:'m'}],
 ['content',{key:'content',title:'授权内容',type:'content',parent:'p'}],['hidden-content',{key:'hidden-content',title:'未授权内容',type:'content',parent:'p'}],
 ['action',{key:'action',title:'授权操作',type:'action',parent:'p'}],['hidden-action',{key:'hidden-action',title:'未授权操作',type:'action',parent:'p'}],
 ['setting',{key:'setting',title:'继承设置项',type:'setting',parent:'p',inheritFrom:'gate'}],['gate',{key:'gate',title:'设置上限',type:'setting',parent:'p'}],
 ['hidden-setting',{key:'hidden-setting',title:'未授权设置项',type:'setting',parent:'p'}],
]);
const c:Catalog={resources,tree:[{id:'m',key:'m',title:'模块',children:[{id:'p',key:'p',title:'可访问页面',children:[]},{id:'deny',key:'deny',title:'未授权页面',children:[]}]}],groups:new Map([['p',[{id:'allowed',title:'已授权分类',section:'',keys:['setting']},{id:'denied',title:'未授权分类',section:'',keys:['hidden-setting']}]]])};
const role:Role={id:'r',name:'角色',description:'',system:false,grants:{m:'read',p:'read',content:'read',action:'edit',gate:'read'}};
const before=JSON.stringify(role),value=(key:string)=>roleAccess(role,key,resources);
const o:EditorOptions={catalog:c,page:'deny',group:'denied',preview:false,readonly:true,staff:false,effectiveOnly:true,grantedOnly:true,emptyMessage:'该角色暂无可访问菜单',value,own:key=>role.grants[key]??'inherit',search:''};
const html=renderPermissionEditor(o);
assert(html.includes('<h2>可访问页面</h2>'));assert(html.includes('继承设置项'));assert(html.includes('已授权分类'));
for(const name of ['未授权页面','未授权内容','未授权操作','未授权设置项','未授权分类'])assert(!html.includes(name),name);
assert.doesNotMatch(html,/data-grant=|data-authorization=|data-category-grant=|data-demo/);
assert.doesNotMatch(renderPermissionEditor({...o,page:'m'}),/data-submenu-mode=/,'Readonly role directories cannot offer the merged visibility switch');
assert(html.includes('仅查看'));assert(html.includes('可操作'));assert(!html.includes('内容示意'));
assert(!renderPermissionEditor({...o,search:'未授权页面'}).includes('data-page='));
assert(renderPermissionEditor({...o,effectiveOnly:false,grantedOnly:false,readonly:false,page:'p'}).includes('未授权分类'));
assert(renderPermissionEditor({...o,effectiveOnly:false,grantedOnly:false,readonly:false,page:'deny'}).includes('未授权页面'));
assert.equal(JSON.stringify(role),before);
const empty=renderPermissionEditor({...o,value:()=> 'hidden'});assert(empty.includes('该角色暂无可访问菜单'));assert(!empty.includes('员工'));
role.grants.m='hidden';assert.deepEqual(effectiveMenuView(c,value,'p').tree,[]);role.grants.m='read';
// Audit real business pages, including consolidated visibility rows and setting categories.
const real=buildCenterCatalog();const all:Role={id:'all',name:'全量',description:'',system:false,grants:Object.fromEntries([...real.resources.values()].map(r=>[r.key,r.type==='action'||r.type==='setting'?'edit':'read']))};
const realValue=(key:string)=>roleAccess(all,key,real.resources);
const payroll='page:/team/payroll-report';
for(const key of ['export-results','switch-employee','edit-employee']){
  for(const r of real.resources.values())if(r.parent===payroll&&r.key.includes(key))all.grants[r.key]='hidden';
}
const realBefore=JSON.stringify(all);
for(const page of [...real.resources.values()].filter(r=>r.type==='page'&&realValue(r.key)!=='hidden')){
 const result=renderPermissionEditor({...o,catalog:real,page:page.key,value:realValue,own:key=>all.grants[key]??'inherit'});
 assert.doesNotMatch(result,/data-grant=|data-authorization=|data-category-grant=|data-demo|data-submenu-mode=/,page.key);
}
assert.equal(JSON.stringify(all),realBefore);
const tipPage='page:/team/tips/distribution';
const exportRow=authorizationRows(real,tipPage).find(r=>r.mode==='visibility')!;
all.grants[exportRow.contentKey]='read';all.grants[exportRow.editKeys[0]]='hidden';
const tipsOptions={...o,catalog:real,page:tipPage,value:realValue,own:(key:string)=>all.grants[key]??'inherit' as const};
assert(!renderPermissionEditor(tipsOptions).includes(`<th scope="row">${exportRow.title}</th>`),'Partial export grants must not appear as an allowed consolidated operation');
assert(renderPermissionEditor({...tipsOptions,grantedOnly:false,effectiveOnly:false,readonly:false}).includes(`<th scope="row">${exportRow.title}</th>`),'Editing must retain the partial/denied export control');
all.grants[exportRow.editKeys[0]]='edit';
assert(renderPermissionEditor(tipsOptions).includes(`<th scope="row">${exportRow.title}</th>`));
const ui=readFileSync('src/permissions/center-ui.ts','utf8');
assert(ui.includes("link(esc(r.name),`/permissions/roles/view/${encodeURIComponent(r.id)}`)"));
assert(ui.includes('grantedOnly:roleView'));assert(ui.includes('if(roleView &&'));
assert(ui.includes("roleView?'查看权限'"));
assert(ui.includes("roleView?'':btn('查看菜单效果','preview')"),'Readonly role page must not render menu preview; editing retains it');
console.log('PASS role readonly detail: routes, effective inherited menus, hidden functions/categories, readonly controls, edit isolation, search, empty state and immutable grants');
