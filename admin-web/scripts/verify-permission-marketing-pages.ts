import assert from 'node:assert/strict';
import {buildCenterCatalog} from '../src/permissions/center-catalog';
import {marketingPermissionPages} from '../src/permissions/center-marketing-pages';
import {pagePolicy,applyPageAuthorization} from '../src/permissions/center-page-policy';
import {roleAccess,type Role} from '../src/permissions/center-domain';
import {renderPermissionEditor} from '../src/permissions/center-editor';
const c=buildCenterCatalog();
for(const [path] of marketingPermissionPages){
  const page=`page:${path}`,policy=pagePolicy(c,page),row=policy.row!;
  assert.equal(policy.kind,'single');assert(row?.editKeys.length);
  const role:Role={id:'test',name:'test',description:'',system:false,grants:{}};
  let resource=c.resources.get(page);
  while(resource){role.grants[resource.key]='read';resource=resource.parent?c.resources.get(resource.parent):undefined;}
  assert.equal(roleAccess(role,page,c.resources),'read','legacy viewing retained');
  for(const key of row.editKeys)assert.equal(roleAccess(role,key,c.resources),'hidden','no implicit edit');
  for(const state of ['hidden','read','edit'] as const){
    applyPageAuthorization(c,page,role.grants,row,state);
    assert.equal(roleAccess(role,page,c.resources),state==='hidden'?'hidden':'read');
    for(const key of row.editKeys)assert.equal(roleAccess(role,key,c.resources),state==='edit'?'edit':'hidden');
    const html=renderPermissionEditor({catalog:c,page,group:'',preview:false,readonly:false,staff:false,value:k=>roleAccess(role,k,c.resources),own:k=>role.grants[k]??c.resources.get(k)?.defaultAccess??'inherit',search:''});
    const header=html.split('<header class="pc-detail-heading">')[1].split('</header>')[0];
    assert.equal((header.match(/data-authorization=/g)??[]).length,3);
    assert.equal((html.match(/data-authorization=/g)??[]).length,3,'no duplicate body permission');
  }
  const parent=c.resources.get(page)!.parent!;role.grants[parent]='hidden';
  assert.equal(roleAccess(role,page,c.resources),'hidden');
  for(const key of row.editKeys)assert.equal(roleAccess(role,key,c.resources),'hidden');
}
console.log('PASS marketing/material pages: header tri-state, legacy readonly, all edits, hidden ancestor');
