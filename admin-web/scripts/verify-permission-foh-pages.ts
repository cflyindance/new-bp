import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCenterCatalog} from '../src/permissions/center-catalog';
import {renderPermissionEditor} from '../src/permissions/center-editor';
import {applyPageResourceGrant} from '../src/permissions/center-page-policy';
import {roleAccess,resolveAccess,type Role,type CenterState} from '../src/permissions/center-domain';
import {assertSettingChoice} from '../src/permissions/center-setting-levels';
const c=buildCenterCatalog(),root=c.tree.find(n=>n.id==='queue-call')!;
const categorySource=readFileSync('src/config/foh-category-settings-ui.ts','utf8');
for(const control of ['data-foh-special-menu-add','data-foh-special-menu-edit','data-foh-special-menu-delete','data-foh-special-menu-dialog-save','data-foh-special-menu-line','data-guest-category-mode-line'])assert(categorySource.includes(control));
const rulesSource=readFileSync('src/config/foh-menu-order-limits-ui.ts','utf8');
assert(rulesSource.includes('MENU_ORDER_LIMIT_DISH_MUTEX_SEQ = 597'));assert(rulesSource.includes('MENU_ORDER_LIMIT_DISH_COMBO_SEQ = 598'));
for(const [id,titles] of [
  ['qc-brand-menu',['品牌管理','设置']],
  ['qc-category-settings',['基础配置','菜单配置','特殊品类','渠道与展示']],
  ['qc-classification-settings',['分类与菜单','分类设置']],
  ['qc-menu-order-limits',['自助餐规则','每轮菜品互斥/组合','其他设置']],
] as const){
  const n=root.children.find(n=>n.id===id)!;assert(n);assert.deepEqual(n.children.map(n=>n.title),titles);
  for(const child of n.children){
    const p=c.resources.get(child.key!)!;assert.equal(p.type,'page');assert(p.settingPageGate,`${p.path}: tri-state page gate`);
    const html=renderPermissionEditor({catalog:c,page:p.key,group:'',preview:false,readonly:false,staff:false,value:()=> 'edit',own:()=> 'edit',search:''});
    const header=html.split('<header class="pc-detail-heading">')[1].split('</header>')[0];
    assert(header.includes('可见不可编辑'));assert(header.includes('可编辑'));
    const role:Role={id:'r',name:'r',description:'',system:false,grants:{}};
    for(const r of c.resources.values())if(['page','module','navigation'].includes(r.type))role.grants[r.key]='read';
    const gate=c.resources.get(p.settingPageGate!)!;
    const value=(key:string)=>roleAccess(role,key,c.resources);
    const locals=[...c.resources.values()].filter(r=>r.parent===p.key&&!r.compatibilityOnly);
    const siblingKeys=n.children.filter(s=>s.key!==p.key).map(s=>s.key!);
    const siblingBefore=siblingKeys.map(k=>role.grants[k]);
    applyPageResourceGrant(c,p.key,role.grants,gate,'edit');
    assert.equal(value(p.key),'read');
    assert.deepEqual(siblingKeys.map(k=>role.grants[k]),siblingBefore);
    for(const local of locals)assert.equal(value(local.key),local.type==='action'?'edit':local.type==='content'?'read':'edit',`${p.path}: edit default ${local.key}`);
    applyPageResourceGrant(c,p.key,role.grants,gate,'read');
    for(const local of locals){assert.notEqual(value(local.key),'edit');assert.throws(()=>assertSettingChoice(c,local,'edit',value));}
    applyPageResourceGrant(c,p.key,role.grants,gate,'hidden');assert.equal(value(p.key),'hidden');
    for(const local of locals){assert.equal(value(local.key),'hidden');assert.throws(()=>assertSettingChoice(c,local,'read',value));}
    applyPageResourceGrant(c,p.key,role.grants,gate,'edit');
    const stores=[{id:'a',title:'A',brand:'b',region:'r'},{id:'b',title:'B',brand:'b',region:'r'}];
    const state:CenterState={schema:1,version:0,logs:[],roles:[role],employees:[{id:'e',name:'e',email:'e@x.com',status:'enabled',bindings:[{id:'b',roleId:'r',scope:{mode:'stores',ids:['a','b']}}],overrides:{a:{}}}]};
    applyPageResourceGrant(c,p.key,state.employees[0].overrides.a,gate,'hidden');
    assert.equal(resolveAccess(state,'e','a',p.key,stores,c.resources),'hidden');
    assert.equal(resolveAccess(state,'e','b',p.key,stores,c.resources),'read');
    role.grants[n.key!]='hidden';assert.equal(value(p.key),'hidden');
  }
}
assert(!root.children.some(n=>n.id==='foh-buffet-rules'));
const legacyCategory='setting-category:page:/operations/queue-call/brand-menu:brand-menu-presentation';
const role:Role={id:'legacy',name:'legacy',description:'',system:false,grants:{}};
for(const r of c.resources.values())if(['page','module','navigation'].includes(r.type))role.grants[r.key]='read';
role.grants[legacyCategory]='hidden';
const brands=c.resources.get('page:/operations/queue-call/brand-menu/brands')!,settings=c.resources.get('page:/operations/queue-call/brand-menu/settings')!;
assert.equal(roleAccess(role,brands.key,c.resources),'hidden');assert.equal(roleAccess(role,settings.key,c.resources),'hidden');
applyPageResourceGrant(c,brands.key,role.grants,c.resources.get(brands.settingPageGate!)!,'edit');
assert.equal(roleAccess(role,brands.key,c.resources),'read');assert.equal(roleAccess(role,settings.key,c.resources),'hidden','opening one page cannot erase sibling legacy denial');
console.log('PASS FOH page hierarchy and page-level three-state controls');
