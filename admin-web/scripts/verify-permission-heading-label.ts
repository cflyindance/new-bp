import assert from 'node:assert/strict';
import {buildCenterCatalog} from '../src/permissions/center-catalog';
import {pagePolicy} from '../src/permissions/center-page-policy';
import {renderPermissionEditor} from '../src/permissions/center-editor';
const catalog=buildCenterCatalog();let count=0;
for(const page of catalog.resources.values())if(page.type==='page'&&!page.settingPageGate&&pagePolicy(catalog,page.key).row){
  count++;
  for(const mode of ['role','staff','readonly','preview']){
    const html=renderPermissionEditor({catalog,page:page.key,group:'',preview:mode==='preview',readonly:mode==='readonly',staff:mode==='staff',value:k=>catalog.resources.get(k)?.type==='action'?'edit':'read',own:k=>catalog.resources.get(k)?.type==='action'?'edit':'read',search:''});
    const header=html.split('<header class="pc-detail-heading">')[1].split('</header>')[0];
    assert(!header.includes('class="pc-action-name">编辑'),`${page.key}: duplicate visible action label`);
    assert.doesNotMatch(header,/pc-help|role="tooltip"|aria-describedby=/);
    assert(!header.includes('data-demo'),'Preview header must not look like a business edit button');
    if(mode==='role'||mode==='staff')assert.equal((header.match(/data-authorization=/g)??[]).length,mode==='staff'?4:3);
  }
}
assert(count>0);console.log(`PASS heading labels: ${count} page-wide objects in role/staff/readonly/preview, controls retained without scope tooltips`);
