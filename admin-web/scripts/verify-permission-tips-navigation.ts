import assert from 'node:assert/strict';
import {buildCenterCatalog,pageKey} from '../src/permissions/center-catalog';
import {authorizationRows,applyAuthorization,authorizationSelection} from '../src/permissions/center-authorization';
import {renderPermissionEditor} from '../src/permissions/center-editor';
import {roleAccess,type Access} from '../src/permissions/center-domain';
const c=buildCenterCatalog(),base='/team/tips',distribution=pageKey(`${base}/distribution`),details=pageKey(`${base}/details`),rules=pageKey(`${base}/rules`);
const tips=c.tree.find(n=>n.id==='team')!.children.find(n=>n.id==='team-tips')!;
assert.deepEqual(tips.children.map(n=>n.title),['小费分配','分配规则']);
assert.equal(c.resources.get(details)!.type,'content');assert.equal(c.resources.get(details)!.parent,distribution);
const grants:Record<string,Access>={};let parent:string|undefined=distribution;while(parent){grants[parent]='read';parent=c.resources.get(parent)?.parent;}
grants[details]='read';grants[rules]='read';
const role={id:'r',name:'r',description:'',system:false,grants},value=(k:string)=>roleAccess(role,k,c.resources);
for(const id of ['refresh-tip-data','confirm-allocation','confirm-payout']){
  const key=`action:${base}/details:${id}`,r=c.resources.get(key)!;
  assert.equal(r.parent,distribution);assert.deepEqual(r.requires,[details]);grants[key]='edit';assert.equal(value(key),'edit');
  grants[details]='hidden';assert.equal(value(key),'hidden');grants[details]='read';
}
const row=authorizationRows(c,rules)[0];assert(row.editKeys.includes(`action:${base}/rules:copy`));
const distributionRows=authorizationRows(c,distribution);assert.equal(distributionRows.length,2);
const allocation=distributionRows.find(r=>r.title==='小费分配')!,exports=distributionRows.find(r=>r.title==='导出操作')!;
assert.equal(allocation.editKeys.length,5);assert.equal(exports.editKeys.length,3);
assert(exports.editKeys.includes(`action:${base}/distribution:email-result`));
applyAuthorization(grants,allocation,'read');for(const key of allocation.editKeys)assert.equal(value(key),'hidden');
applyAuthorization(grants,exports,'read');for(const key of exports.editKeys)assert.equal(value(key),'edit');
assert.equal(authorizationSelection(exports,k=>grants[k]??'hidden'),'read');
applyAuthorization(grants,allocation,'hidden');for(const key of exports.editKeys)assert.equal(value(key),'hidden');
applyAuthorization(grants,allocation,'edit');for(const key of allocation.editKeys)assert.equal(value(key),'edit');
applyAuthorization(grants,exports,'hidden');for(const key of exports.editKeys)assert.equal(value(key),'hidden');
applyAuthorization(grants,exports,'read');grants[exports.editKeys[0]]='hidden';
assert.equal(authorizationSelection(exports,k=>grants[k]??'hidden'),'mixed');
for(const preview of [false,true])for(const readonly of [false,true]){
  const html=renderPermissionEditor({catalog:c,page:distribution,group:'',preview,readonly,staff:false,value,own:k=>grants[k]??'hidden',search:''});
  for(const key of [...allocation.editKeys,...exports.editKeys])assert(!html.includes(`data-grant="${key}"`));
  if(preview)assert(!html.includes(`data-demo >导出或发送结果`));
}
applyAuthorization(grants,exports,'read');
const controls=renderPermissionEditor({catalog:c,page:distribution,group:'',preview:false,readonly:false,staff:false,value,own:k=>grants[k]??'hidden',search:''});
assert.equal((controls.match(/data-authorization="content:\/team\/tips\/distribution:export-results"/g)??[]).length,2);
assert.throws(()=>applyAuthorization(grants,exports,'edit'),/仅支持/);
const exceptions:Record<string,Access>={};applyAuthorization(exceptions,exports,'read');applyAuthorization(exceptions,exports,'inherit');assert.deepEqual(exceptions,{});
applyAuthorization(grants,row,'edit');for(const key of row.editKeys)assert.equal(value(key),'edit');
grants[`action:${base}/rules:copy`]='hidden';assert.equal(authorizationSelection(row,k=>grants[k]??'hidden'),'mixed');
const html=renderPermissionEditor({catalog:c,page:rules,group:'',preview:false,readonly:false,staff:false,value,own:k=>grants[k]??'hidden',search:''});
assert(!html.includes(`data-grant="action:${base}/rules:copy"`));assert(!html.includes(`data-page="${details}"`));
assert.doesNotMatch(html,/部分配置|需复核/);
applyAuthorization(grants,row,'read');for(const key of row.editKeys)assert.equal(value(key),'hidden');
applyAuthorization(grants,row,'inherit');for(const key of [row.contentKey,...row.editKeys])assert.equal(grants[key],undefined);
console.log('PASS tips: real two-item navigation, nested details permission and gated result actions, unified rule copy/edit, mixed review, no implicit upgrades');
