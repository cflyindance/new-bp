import assert from 'node:assert/strict';
import {buildCenterCatalog,pageKey} from '../src/permissions/center-catalog';
import {roleAccess,resolveAccess,type Access,type CenterState} from '../src/permissions/center-domain';
import {authorizationRows} from '../src/permissions/center-authorization';
import {applyPageAuthorization,assertPageFeatureChoice} from '../src/permissions/center-page-policy';
import {renderPermissionEditor} from '../src/permissions/center-editor';
const catalog=buildCenterCatalog();
for(const path of ['/team/payroll-report','/team/tips/distribution']){
  const page=pageKey(path),rows=authorizationRows(catalog,page),core=rows.find(r=>r.mode!=='visibility')!,features=rows.filter(r=>r.mode==='visibility');
  const grants:Record<string,Access>={};for(const r of catalog.resources.values())if(['module','navigation','page'].includes(r.type))grants[r.key]='read';
  const role={id:'r',name:'r',description:'',system:false,grants};const value=(k:string)=>roleAccess(role,k,catalog.resources);
  applyPageAuthorization(catalog,page,grants,core,'edit');for(const row of features)applyPageAuthorization(catalog,page,grants,row,'read');
  applyPageAuthorization(catalog,page,grants,core,'hidden');const saved=JSON.stringify(grants);
  for(const staff of [false,true]){
    const html=renderPermissionEditor({catalog,page,group:'',preview:false,readonly:false,staff,value,own:k=>grants[k]??'hidden',search:''});
    for(const row of features){
      assert(html.includes(`data-authorization="${row.contentKey}" data-value="hidden" aria-pressed="true" disabled`));
      assert(html.includes(`data-authorization="${row.contentKey}" data-value="read" aria-pressed="false" disabled`));
      assert.throws(()=>assertPageFeatureChoice(page,row,'read',value),/页面不可见/);
      for(const key of row.editKeys)assert.equal(value(key),'hidden');
    }
    const header=html.split('<header class="pc-detail-heading">')[1].split('</header>')[0];
    assert(!header.includes(`data-value="read" aria-pressed="false" disabled`),'Core page control must remain operable');
  }
  assert.equal(JSON.stringify(grants),saved,'Rendering and rejected choices must not overwrite saved feature grants');
  for(const access of ['read','edit'] as const){
    applyPageAuthorization(catalog,page,grants,core,access);
    const html=renderPermissionEditor({catalog,page,group:'',preview:false,readonly:false,staff:false,value,own:k=>grants[k]??'hidden',search:''});
    for(const row of features){assert.doesNotThrow(()=>assertPageFeatureChoice(page,row,'read',value));assert(html.includes(`data-authorization="${row.contentKey}" data-value="read" aria-pressed="true" >`));for(const key of row.editKeys)assert.equal(value(key),'edit');}
    assertPageFeatureChoice(page,features[0],'hidden',value);applyPageAuthorization(catalog,page,grants,features[0],'hidden');assert.equal(value(features[0].contentKey),'hidden');applyPageAuthorization(catalog,page,grants,features[0],'read');
  }
  const stores=[{id:'a',title:'A',brand:'b',region:'r'},{id:'b',title:'B',brand:'b',region:'r'}];
  const personal:Record<string,Access>={};applyPageAuthorization(catalog,page,personal,core,'hidden');
  const state:CenterState={schema:1,version:0,logs:[],roles:[role],employees:[{id:'e',name:'e',email:'e@x.com',status:'enabled',bindings:[{id:'b',roleId:'r',scope:{mode:'stores',ids:['a','b']}}],overrides:{a:personal}}]};
  const effective=(k:string)=>resolveAccess(state,'e','a',k,stores,catalog.resources);
  for(const row of features){assert.throws(()=>assertPageFeatureChoice(page,row,'read',effective),/页面不可见/);assert.equal(resolveAccess(state,'e','b',row.editKeys[0],stores,catalog.resources),'edit');}
}
console.log('PASS hidden page features: hidden selected/disabled, raw grants retained, restored read/edit independent features, primary reopen and store isolation');
