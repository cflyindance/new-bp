import assert from 'node:assert/strict';
import {buildCenterCatalog} from '../src/permissions/center-catalog';
import {roleAccess,type Role,type Access} from '../src/permissions/center-domain';
import {pageMode,applySubmenuMode} from '../src/permissions/center-page-mode';
import {renderPermissionEditor} from '../src/permissions/center-editor';
import {pagePolicy} from '../src/permissions/center-page-policy';
const c=buildCenterCatalog(),role:Role={id:'r',name:'角色',description:'',system:false,grants:{}};
function parents(key:string,r=role):void{let p=c.resources.get(key)?.parent;while(p){const n=c.resources.get(p)!;r.grants[p]='read';if(n.legacyGateKey)r.grants[n.legacyGateKey]='read';p=n.parent;}}
const value=(k:string)=>roleAccess(role,k,c.resources),parent='navigation:team:team-roles',key='page:/team/roles-employees/employees';
parents(key);
const options={catalog:c,page:parent,group:'',preview:false,readonly:false,staff:false,value,own:(k:string)=>role.grants[k]??'hidden' as const,search:''};
let html=renderPermissionEditor(options);
assert(html.includes(`data-submenu-mode="${key}"`));assert(html.includes('可见不可编辑'));assert(html.includes('可编辑'));assert(!html.includes('配置权限'));
for(const mode of ['read','edit','hidden'] as Access[]){applySubmenuMode(c,role,parent,key,mode);assert.equal(pageMode(c,key,value),mode);}
applySubmenuMode(c,role,parent,key,'read');
assert.equal(applySubmenuMode(c,role,parent,key,'read'),false);
const pageHtml=renderPermissionEditor({...options,page:key});assert(pageHtml.includes('aria-pressed="true"'));
assert(!renderPermissionEditor({...options,readonly:true}).includes('data-submenu-mode='));
assert(!renderPermissionEditor({...options,preview:true}).includes('data-submenu-mode='));
assert.throws(()=>applySubmenuMode(c,role,parent,key,'bad' as any));
const blocked=structuredClone(role);blocked.grants[parent]='hidden';const snapshot=JSON.stringify(blocked);
assert.throws(()=>applySubmenuMode(c,blocked,parent,key,'edit'),/上级/);assert.equal(JSON.stringify(blocked),snapshot);
let count=0;
for(const page of [...c.resources.values()].filter(r=>r.type==='page'&&!r.compatibilityOnly&&r.parent)){
 const r:Role={id:'audit',name:'审计',description:'',system:false,grants:{}};parents(page.key,r);
 const resolve=(k:string)=>roleAccess(r,k,c.resources);
 for(const mode of ['read','edit','read','hidden'] as Access[]){
  applySubmenuMode(c,r,page.parent!,page.key,mode);
  assert.equal(pageMode(c,page.key,resolve),mode,page.key);
  const markup=renderPermissionEditor({...options,page:page.key,value:resolve,own:k=>r.grants[k]??'hidden'});
  const heading=markup.split('<header class="pc-detail-heading">')[1].split('</header>')[0];
  const policy=pagePolicy(c,page.key),row=page.key==='page:/operations/queue-call/buffet-rules'||!page.settingPageGate?policy.row:undefined;
  const source=row?`data-authorization="${row.contentKey}"`:`data-grant="${page.settingPageGate??policy.setting?.key}"`;
  assert(heading.includes(`${source} data-value="${mode}" aria-pressed="true"`),page.key+' header '+mode);
 }
 count++;
}
// Removing only supplemental metadata reconstructs the pre-change catalog for legacy authorization comparison.
const legacy=structuredClone(c.resources);
for(const [k,r]of legacy){if(k.startsWith('page-mode:')){legacy.delete(k);continue;}if(r.settingPageGate?.startsWith('page-mode:'))delete r.settingPageGate;r.ceilingKeys=r.ceilingKeys?.filter(key=>!key.startsWith('page-mode:'));}
for(const actionChoice of ['hidden','edit'] as const){
 const old:Role={id:'old',name:'旧角色',description:'',system:false,grants:Object.fromEntries([...legacy.values()].map(r=>[r.key,r.type==='action'?actionChoice:r.type==='setting'?'edit':'read']))};
 const snapshot=JSON.stringify(old);
 for(const k of legacy.keys())assert.equal(roleAccess(old,k,c.resources),roleAccess(old,k,legacy),k);
 assert.equal(JSON.stringify(old),snapshot);
}
const entry=[...c.resources.values()].find(r=>r.type==='page'&&r.settingPageGate?.startsWith('page-mode:'))!;
const e:Role={id:'entry',name:'入口',description:'',system:false,grants:{}};parents(entry.key,e);
applySubmenuMode(c,e,entry.parent!,entry.key,'read');
for(const r of c.resources.values())if(r.type==='action'&&r.ceilingKeys?.includes(entry.settingPageGate!)){
 e.grants[r.key]='edit';assert.equal(roleAccess(e,r.key,c.resources),'hidden');
}
let directories=0;
for(const directory of c.resources.values())if(['module','navigation'].includes(directory.type)&&!directory.compatibilityOnly){
 const r:Role={id:'directory',name:'目录测试',description:'',system:false,grants:{}};parents(directory.key,r);r.grants[directory.key]='read';if(directory.legacyGateKey)r.grants[directory.legacyGateKey]='read';
 const opts={...options,page:directory.key,value:(k:string)=>roleAccess(r,k,c.resources),own:(k:string)=>r.grants[k]??'hidden' as const};
 const heading=(html:string)=>html.split('<header class="pc-detail-heading">')[1].split('</header>')[0];
 const editable=heading(renderPermissionEditor(opts));
 for(const choice of ['hidden','read'])assert(editable.includes(`data-grant="${directory.key}" data-value="${choice}"`),directory.key);
 assert(!editable.includes('data-value="edit"'));
 for(const mode of ['readonly','preview'])assert(!heading(renderPermissionEditor({...opts,readonly:mode==='readonly',preview:mode==='preview'})).includes('data-grant='));
 directories++;
}
console.log('PASS submenu three-state:',count,'pages and',directories,'parent headers; shared controls, readonly, no config button, ancestor and no-op protection');
