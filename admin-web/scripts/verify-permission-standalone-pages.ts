import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCenterCatalog,pageKey} from '../src/permissions/center-catalog';
import {hasModuleSettingsCategorySidebar} from '../src/config/settings-category-navigation';
import {roleAccess,resolveAccess,type Access,type CenterState} from '../src/permissions/center-domain';
import {applyPageResourceGrant} from '../src/permissions/center-page-policy';
import {resourceOwn} from '../src/permissions/center-employee-pages';
import {renderPermissionEditor} from '../src/permissions/center-editor';
const c=buildCenterCatalog(),expected=['/orders/discounts','/orders/surcharges','/stores/profile','/stores/hours'].sort();
const matches=[...c.resources.values()].filter(r=>r.type==='page'&&r.path&&!hasModuleSettingsCategorySidebar(r.path));
assert.deepEqual(matches.map(r=>r.path).sort(),expected);
let singleGroups=0;
for(const p of c.resources.values())if(p.type==='page'){
  const groups=c.sections?.get(p.key)??c.groups.get(p.key)??[];if(groups.length===1)singleGroups++;
  if(!groups.length)continue;
  for(const mode of ['role','staff','readonly','preview']){
    const html=renderPermissionEditor({catalog:c,page:p.key,group:'obsolete',preview:mode==='preview',readonly:mode==='readonly',staff:mode==='staff',value:()=> 'read',own:()=> 'read',search:''});
    if(p.path&&!hasModuleSettingsCategorySidebar(p.path)){
      assert.doesNotMatch(html,/<nav class="pc-categories"|本分类权限上限|data-category-grant=/);
      for(const key of groups.flatMap(g=>g.keys))assert(html.includes(c.resources.get(key)!.title),`Lost page item: ${key}`);
    }else assert.match(html,/<nav class="pc-categories"/,`Actual settings category lost: ${p.key}`);
  }
}
assert.equal(singleGroups,14);
for(const path of expected){
  assert.equal(hasModuleSettingsCategorySidebar(path+'/?q=1#field'),false);
  const page=pageKey(path),p=c.resources.get(page)!,gate=c.resources.get(p.settingPageGate!)!,alias=gate.relatedGrantKeys![0];
  assert(gate.aggregateRelatedGrants&&alias);const item=c.resources.get(c.groups.get(page)![0].keys[0])!;
  const grants:Record<string,Access>={};for(const r of c.resources.values())if(['module','navigation','page'].includes(r.type))grants[r.key]='read';
  grants[item.key]='edit';for(const key of item.relatedGrantKeys??[])grants[key]='edit';
  grants[gate.key]='edit';grants[alias]='hidden';const role={id:'r',name:'r',description:'',system:false,grants},value=(k:string)=>roleAccess(role,k,c.resources);
  assert.equal(value(page),'hidden','Historical category denial must not be dropped');
  assert.equal(resourceOwn(gate,k=>grants[k]??c.resources.get(k)?.defaultAccess??'hidden'),'hidden');
  applyPageResourceGrant(c,page,grants,gate,'read');assert.equal(grants[alias],'read');assert.equal(value(item.key),'read');assert.equal(grants[item.key],'edit');
  applyPageResourceGrant(c,page,grants,gate,'edit');assert.equal(value(item.key),'edit');
  const stores=[{id:'a',title:'A',brand:'b',region:'r'},{id:'b',title:'B',brand:'b',region:'r'}],personal:Record<string,Access>={};
  const state:CenterState={schema:1,version:0,logs:[],roles:[role],employees:[{id:'e',name:'e',email:'e@x.com',status:'enabled',bindings:[{id:'b',roleId:'r',scope:{mode:'stores',ids:['a','b']}}],overrides:{a:personal}}]};
  applyPageResourceGrant(c,page,personal,gate,'hidden');assert.equal(resolveAccess(state,'e','a',item.key,stores,c.resources),'hidden');assert.equal(resolveAccess(state,'e','b',item.key,stores,c.resources),'edit');
  applyPageResourceGrant(c,page,personal,gate,'inherit');assert.equal(resolveAccess(state,'e','a',item.key,stores,c.resources),'edit');
  grants[alias]='read';assert.equal(resolveAccess(state,'e','a',item.key,stores,c.resources),'read');
}
assert.match(readFileSync('src/main.ts','utf8'),/if \(!hasModuleSettingsCategorySidebar\(path\)\) return ""/);
console.log('PASS standalone audit: 215 pages, 14 single-group candidates, four flat pages; shared real navigation, retained settings categories and historical gates');
