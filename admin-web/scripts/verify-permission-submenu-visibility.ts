import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCenterCatalog} from '../src/permissions/center-catalog';
import {roleAccess,type Role} from '../src/permissions/center-domain';
import {renderPermissionEditor} from '../src/permissions/center-editor';
import {applySubmenuVisibility} from '../src/permissions/center-submenu-visibility';
const c=buildCenterCatalog(),parent='navigation:team:team-roles',employee='page:/team/roles-employees/employees',position='page:/team/roles-employees/roles';
const role:Role={id:'r',name:'测试',description:'',system:false,grants:{}};
function allowParents(key:string):void{let p=c.resources.get(key)?.parent;while(p){const r=c.resources.get(p)!;role.grants[p]='read';if(r.legacyGateKey)role.grants[r.legacyGateKey]='read';p=r.parent;}}
allowParents(employee);const value=(key:string)=>roleAccess(role,key,c.resources);
const options={catalog:c,page:parent,group:'',preview:false,readonly:false,staff:false,value,own:(key:string)=>role.grants[key]??'hidden' as const,search:''};
const html=renderPermissionEditor(options);assert(html.includes(`data-submenu-visibility="${employee}"`));assert(html.includes('配置权限'));
assert(!renderPermissionEditor({...options,readonly:true}).includes('data-submenu-visibility='));
assert(!renderPermissionEditor({...options,preview:true}).includes('data-submenu-visibility='));
assert(applySubmenuVisibility(c,role,parent,employee,'read'));assert.equal(value(employee),'read');assert.equal(value(position),'hidden');
const actions=[...c.resources.values()].filter(r=>r.type==='action'&&r.parent===employee);
for(const r of actions)assert.notEqual(value(r.key),'edit','Visible must not grant actions');
assert(renderPermissionEditor(options).includes('aria-pressed="true"'));
assert.equal(applySubmenuVisibility(c,role,parent,employee,'read'),false,'Repeated choice is not a dirty edit');
const editable=actions[0];role.grants[editable.key]='edit';const beforeHide={...role.grants};
applySubmenuVisibility(c,role,parent,employee,'hidden');assert.equal(value(employee),'hidden');assert.equal(role.grants[editable.key],'edit');
applySubmenuVisibility(c,role,parent,employee,'read');assert.equal(value(editable.key),'edit');assert.deepEqual(role.grants,beforeHide);
const blocked=structuredClone(role);blocked.grants[parent]='hidden';const blockedBefore=JSON.stringify(blocked);
assert.throws(()=>applySubmenuVisibility(c,blocked,parent,employee,'read'),/上级/);assert.equal(JSON.stringify(blocked),blockedBefore);
assert.throws(()=>applySubmenuVisibility(c,role,parent,'page:/home/today','read'),/子导航/);
assert.throws(()=>applySubmenuVisibility(c,role,parent,employee,'edit' as any),/状态/);
// Empty setting pages initialize readonly, not default editable inheritance.
const settingPage=[...c.resources.values()].find(r=>r.type==='page'&&r.settingPageGate&&r.path==='/team/breaks-overtime/settings')!;
const settingRole:Role={...role,grants:{}};const saved=role.grants;role.grants=settingRole.grants;allowParents(settingPage.key);role.grants=saved;
applySubmenuVisibility(c,settingRole,settingPage.parent!,settingPage.key,'read');
assert.equal(roleAccess(settingRole,settingPage.key,c.resources),'read');
assert.equal(roleAccess(settingRole,settingPage.settingPageGate!,c.resources),'read');
for(const r of c.resources.values())if(r.parent===settingPage.key&&r.type==='action')assert.notEqual(roleAccess(settingRole,r.key,c.resources),'edit');
// Audit all direct real menu children: successes are actually visible and introduce no edit grants; failures are atomic.
let shown=0,limited=0;
for(const page of c.resources.values())if(page.type==='page'&&page.parent&&!page.compatibilityOnly){
 const r:Role={id:'audit',name:'审计',description:'',system:false,grants:{}};const original=role.grants;role.grants=r.grants;allowParents(page.key);role.grants=original;
 const before=JSON.stringify(r);
 try{applySubmenuVisibility(c,r,page.parent,page.key,'read');assert.notEqual(roleAccess(r,page.key,c.resources),'hidden',page.key);assert(!Object.values(r.grants).includes('edit'));shown++;}
 catch(e){assert.equal(JSON.stringify(r),before,page.key);assert.match((e as Error).message,/限制|上级|子导航/);limited++;}
}
const ui=readFileSync('src/permissions/center-ui.ts','utf8');assert(ui.includes('applySubmenuVisibility(catalog,role()!,page'));assert(ui.includes('b.dataset.submenuVisibility'));
console.log('PASS submenu visibility: row controls, readonly isolation, restore/read defaults, no edit grants, sibling/ancestor safety and atomicity',{shown,limited});
