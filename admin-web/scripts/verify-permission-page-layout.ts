import assert from 'node:assert/strict';
import {buildCenterCatalog,pageKey} from '../src/permissions/center-catalog';
import {roleAccess,type Access} from '../src/permissions/center-domain';
import {renderPermissionEditor} from '../src/permissions/center-editor';
import {authorizationRows} from '../src/permissions/center-authorization';
const c=buildCenterCatalog(),page=pageKey('/team/shift-scheduling/schedule'),row=authorizationRows(c,page)[0];
const grants:Record<string,Access>={};for(const r of c.resources.values())if(['module','navigation','page'].includes(r.type))grants[r.key]='read';
const role={id:'r',name:'r',description:'',system:false,grants};
const value=(k:string)=>roleAccess(role,k,c.resources);
let html=renderPermissionEditor({catalog:c,page,group:'',preview:false,readonly:false,staff:false,value,own:k=>grants[k]??'hidden',search:''});
assert(!html.includes(`data-grant="${page}"`),'Single page must not have a duplicate page-visibility switch');
assert.equal((html.match(/data-authorization=/g)??[]).length,3);
assert.equal(value(page),'hidden','Empty core content must hide the page');
const {applyPageAuthorization}=await import('../src/permissions/center-page-policy');
applyPageAuthorization(c,page,grants,row,'edit');assert.equal(value(page),'read');for(const k of row.editKeys)assert.equal(value(k),'edit');
applyPageAuthorization(c,page,grants,row,'hidden');assert.equal(value(page),'hidden');
grants[page]='hidden';grants[row.contentKey]='read';
html=renderPermissionEditor({catalog:c,page,group:'',preview:false,readonly:false,staff:false,value,own:k=>grants[k]??'hidden',search:''});assert.doesNotMatch(html,/部分配置|需复核/);
applyPageAuthorization(c,page,grants,row,'read');assert.equal(value(page),'read');
grants[c.resources.get(page)!.parent!]='hidden';
html=renderPermissionEditor({catalog:c,page,group:'',preview:false,readonly:false,staff:false,value,own:k=>grants[k]??'hidden',search:''});assert.match(html,/上级.*不可见/);assert.match(html,/配置已保留/);
console.log('PASS page policy: one single-page control, core-derived visibility, explicit synchronization, legacy review and ancestor explanation');
const payroll=pageKey('/team/payroll-report'),payrollRows=authorizationRows(c,payroll),report=payrollRows.find(r=>r.title==='薪资管理')!,employee=payrollRows.find(r=>r.title==='编辑员工')!,exports=payrollRows.find(r=>r.title==='导出操作')!;
for(const r of c.resources.values())if(['module','navigation','page'].includes(r.type))grants[r.key]='read';
applyPageAuthorization(c,payroll,grants,exports,'read');assert.equal(value(payroll),'hidden','Auxiliary exports do not open payroll');
applyPageAuthorization(c,payroll,grants,report,'read');applyPageAuthorization(c,payroll,grants,employee,'read');assert.equal(value(employee.editKeys[0]),'edit');assert.equal(value(report.editKeys[0]),'hidden');
html=renderPermissionEditor({catalog:c,page:payroll,group:'',preview:false,readonly:false,staff:false,value,own:k=>grants[k]??'hidden',search:''});assert(!html.includes(`data-grant="${payroll}"`));
const {resolveAccess}=await import('../src/permissions/center-domain');
const stores=[{id:'a',title:'A',brand:'b',region:'r'},{id:'b',title:'B',brand:'b',region:'r'}];
const {applyPageResourceGrant}=await import('../src/permissions/center-page-policy');
const personal:Record<string,Access>={};applyPageAuthorization(c,payroll,personal,report,'hidden');
const state={schema:1 as const,navigationVersion:1 as const,version:0,logs:[],roles:[role],employees:[{id:'e',name:'e',email:'e@example.com',status:'enabled' as const,bindings:[{id:'b',roleId:'r',scope:{mode:'stores' as const,ids:['a','b']}}],overrides:{a:personal}}]};
assert.equal(resolveAccess(state,'e','a',payroll,stores,c.resources),'hidden');assert.equal(resolveAccess(state,'e','b',payroll,stores,c.resources),'read');
applyPageAuthorization(c,payroll,personal,report,'inherit');assert.equal(resolveAccess(state,'e','a',payroll,stores,c.resources),'read');
const settings=pageKey('/stores/profile'),setting=c.resources.get('setting:/stores/settings:417')!;
applyPageResourceGrant(c,settings,grants,setting,'edit');assert.equal(value(settings),'read');applyPageResourceGrant(c,settings,grants,setting,'hidden');assert.equal(value(settings),'hidden');
const {pagePolicy}=await import('../src/permissions/center-page-policy');
const counts:Record<string,number>={};
for(const resource of c.resources.values())if(resource.type==='page'){
  const p=pagePolicy(c,resource.key);counts[p.kind]=(counts[p.kind]??0)+1;
  const markup=renderPermissionEditor({catalog:c,page:resource.key,group:'',preview:false,readonly:false,staff:false,value:()=> 'read',own:()=> 'read',search:''});
  if(p.kind!=='entry')assert(!markup.includes(`data-grant="${resource.key}"`),`Duplicate page gate: ${resource.key}`);
  if(p.kind==='single'&&p.row)assert.equal((markup.match(/data-authorization=/g)??[]).length,3,`Duplicate single row: ${resource.key}`);
}
console.log('PASS all catalog page layouts:',counts);
for(const path of ['/team/tips/distribution','/team/payroll-report']){
  const key=pageKey(path),p=pagePolicy(c,key);assert(p.row,'Page-wide core must be promoted even with utilities');
  for(const mode of ['role','staff','readonly','preview']){
    const markup=renderPermissionEditor({catalog:c,page:key,group:'',preview:mode==='preview',readonly:mode==='readonly',staff:mode==='staff',value:k=>c.resources.get(k)?.type==='action'?'edit':'read',own:()=> 'read',search:''});
    const header=markup.split('<header class="pc-detail-heading">')[1].split('</header>')[0],body=markup.split('</header>')[1];
    assert(!body.includes(`data-authorization="${p.row.contentKey}"`),'Page grant must not appear under feature authorization');
    if(mode==='role'||mode==='staff')assert.equal((header.match(new RegExp(`data-authorization="${p.row.contentKey}"`,'g'))??[]).length,mode==='staff'?4:3);
    assert(body.includes('导出操作'),'Independent utilities remain in feature authorization');
  }
}
console.log('PASS page header core authorization, separate utilities, role/staff/readonly/preview');
