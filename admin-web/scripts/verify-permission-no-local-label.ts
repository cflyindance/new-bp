import assert from 'node:assert/strict';
import {buildCenterCatalog} from '../src/permissions/center-catalog';
import {renderPermissionEditor} from '../src/permissions/center-editor';
import {roleAccess,type Role} from '../src/permissions/center-domain';
const c=buildCenterCatalog(),role:Role={id:'r',name:'r',description:'',system:false,grants:{}};
for(const r of c.resources.values())role.grants[r.key]=r.type==='action'||r.type==='setting'?'edit':'read';
const before=JSON.stringify(role.grants);let count=0;
for(const p of c.resources.values())if(p.type==='page')for(const mode of ['role','staff','readonly','preview']){
  const html=renderPermissionEditor({catalog:c,page:p.key,group:'',preview:mode==='preview',readonly:mode==='readonly',staff:mode==='staff',value:k=>roleAccess(role,k,c.resources),own:k=>role.grants[k]??'hidden',parentInherited:()=>false,search:''});
  assert.doesNotMatch(html,/单独配置/,p.key);count++;
}
assert.equal(JSON.stringify(role.grants),before);
console.log(`PASS no local configuration label: ${count} page/mode renders; grant data unchanged`);
