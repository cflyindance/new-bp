import assert from 'node:assert/strict';
import {buildCenterCatalog} from '../src/permissions/center-catalog';
import {authorizationRows,authorizationSelection} from '../src/permissions/center-authorization';
import {applyPageAuthorization,assertPageFeatureChoice} from '../src/permissions/center-page-policy';
import {renderPermissionEditor} from '../src/permissions/center-editor';
import {roleAccess,resolveAccess,type Role,type CenterState} from '../src/permissions/center-domain';
const c=buildCenterCatalog(),page='page:/operations/queue-call/buffet-rules',row=authorizationRows(c,page)[0];
assert.equal(row.editKeys.length,3);
const role:Role={id:'r',name:'r',description:'',system:false,grants:{}};
for(const r of c.resources.values())if(['page','navigation','module'].includes(r.type))role.grants[r.key]='read';
const value=(key:string)=>roleAccess(role,key,c.resources),own=(key:string)=>role.grants[key]??'hidden';
for(const state of ['hidden','read','edit'] as const){
  applyPageAuthorization(c,page,role.grants,row,state);
  assert.equal(value(page),state==='hidden'?'hidden':'read');
  for(const key of row.editKeys)assert.equal(value(key),state==='edit'?'edit':'hidden');
  assert.doesNotThrow(()=>assertPageFeatureChoice(page,row,'edit',value),'Page header can reopen its own hidden gate');
  for(const mode of ['role','staff','readonly','preview']){
    const html=renderPermissionEditor({catalog:c,page,group:'',preview:mode==='preview',readonly:mode==='readonly',staff:mode==='staff',value,own,search:''});
    if(mode==='preview'&&state==='hidden')continue;
    const header=html.split('<header class="pc-detail-heading">')[1].split('</header>')[0];
    if(mode==='role'||mode==='staff')assert.equal((header.match(/data-authorization=/g)??[]).length,mode==='staff'?4:3);
    const body=html.split('</header>')[1];assert.doesNotMatch(body,/复制自助餐规则|启用 \/ 禁用自助餐规则|<h3>功能授权<\/h3>/);
  }
}
const stores=[{id:'a',title:'A',brand:'b',region:'r'},{id:'b',title:'B',brand:'b',region:'r'}];
const state:CenterState={schema:1,version:0,logs:[],roles:[role],employees:[{id:'e',name:'e',email:'e@x.com',status:'enabled',bindings:[{id:'b',roleId:'r',scope:{mode:'stores',ids:['a','b']}}],overrides:{a:{}}}]};
applyPageAuthorization(c,page,state.employees[0].overrides.a,row,'read');
for(const key of row.editKeys){assert.equal(resolveAccess(state,'e','a',key,stores,c.resources),'hidden');assert.equal(resolveAccess(state,'e','b',key,stores,c.resources),'edit');}
applyPageAuthorization(c,page,state.employees[0].overrides.a,row,'inherit');assert.equal(Object.keys(state.employees[0].overrides.a).length,0);
const gate=c.resources.get(page)!.settingPageGate!;role.grants[gate]='read';
assert(!renderPermissionEditor({catalog:c,page,group:'',preview:false,readonly:false,staff:false,value,own,search:''}).includes('部分配置，需复核'));
applyPageAuthorization(c,page,role.grants,row,'edit');
role.grants[row.editKeys[1]]='hidden';assert.equal(authorizationSelection(row,own),'mixed');
const parent=c.resources.get(page)!.parent!;role.grants[parent]='hidden';for(const key of row.editKeys)assert.equal(value(key),'hidden');
assert.throws(()=>assertPageFeatureChoice(page,row,'edit',value));
console.log('PASS buffet unified page: all operations, three-state header, no independent body grants, mixed legacy and ancestor denial');
