import assert from 'node:assert/strict';
import {buildCenterCatalog,pageKey} from '../src/permissions/center-catalog';
import {roleAccess,resolveAccess,type Access,type CenterState} from '../src/permissions/center-domain';
import {renderPermissionEditor} from '../src/permissions/center-editor';
import {BREAKS_PERMISSION_SETTINGS} from '../src/permissions/center-page-sections';
const c=buildCenterCatalog(),path='/team/breaks-overtime',root=pageKey(path);
const node=c.tree.find(n=>n.id==='team')!.children.find(n=>n.key===root)!;
assert.deepEqual(node.children.map(n=>n.title),['自定义休息','加班规则','设置']);
assert.equal(c.resources.get(root)!.type,'navigation');
const keys=['custom-breaks','overtime-rules','settings'].map(id=>pageKey(`${path}/${id}`));
const grants:Record<string,Access>={'module:team':'read',[root]:'read'};
for(const key of keys)grants[key]='read';
const role={id:'r',name:'r',description:'',system:false,grants};
const value=(key:string)=>roleAccess(role,key,c.resources);
for(const [i,id] of ['manage-break','manage-overtime'].entries()) {
  for(const key of [`content:${path}:object-${id}`,`action:${path}:${id}`])assert.equal(c.resources.get(key)!.parent,keys[i]);
  grants[`content:${path}:object-${id}`]='read';grants[`action:${path}:${id}`]='edit';
}
for(const s of BREAKS_PERMISSION_SETTINGS){assert.equal(c.resources.get(s.key)!.parent,keys[2]);grants[s.key]='edit';}
for(const key of keys)for(const preview of [false,true])for(const readonly of [false,true]) {
  const html=renderPermissionEditor({catalog:c,page:key,group:'obsolete',preview,readonly,staff:false,value,own:k=>grants[k]??'hidden',search:''});
  assert.doesNotMatch(html,/<nav class="pc-categories"/);
  assert.match(html,/data-scroll="settings"/);
  if(key===keys[2])for(const s of BREAKS_PERMISSION_SETTINGS)assert(html.includes(s.title));
}
grants[keys[0]]='hidden';assert.equal(value(`action:${path}:manage-break`),'hidden');assert.equal(value(`action:${path}:manage-overtime`),'edit');
grants[root]='hidden';assert.equal(value(BREAKS_PERMISSION_SETTINGS[0].key),'hidden');
grants[root]='read';assert.equal(value(BREAKS_PERMISSION_SETTINGS[0].key),'edit');
delete grants[keys[1]];assert.equal(value(`action:${path}:manage-overtime`),'hidden');grants[keys[1]]='read';
const stores=[{id:'a',title:'A',brand:'b',region:'r'},{id:'b',title:'B',brand:'b',region:'r'}];
const state:CenterState={schema:1,navigationVersion:1,version:0,logs:[],roles:[role],employees:[{id:'e',name:'e',email:'e@example.com',status:'enabled',bindings:[{id:'b',roleId:'r',scope:{mode:'stores',ids:['a','b']}}],overrides:{a:{[keys[2]]:'hidden'}}}]};
assert.equal(resolveAccess(state,'e','a',BREAKS_PERMISSION_SETTINGS[0].key,stores,c.resources),'hidden');assert.equal(resolveAccess(state,'e','b',BREAKS_PERMISSION_SETTINGS[0].key,stores,c.resources),'edit');
console.log('PASS breaks pages: child menus, direct authorization, parent/sibling gates, default denial, retained keys, store isolation');
