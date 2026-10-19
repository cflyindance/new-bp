import assert from 'node:assert/strict';
import {buildCenterCatalog} from '../src/permissions/center-catalog';
import {renderPermissionEditor} from '../src/permissions/center-editor';
const catalog=buildCenterCatalog();let count=0;
for(const page of catalog.resources.values())if(page.type==='page')for(const mode of ['role','staff','readonly','preview']){
  const html=renderPermissionEditor({catalog,page:page.key,group:'',preview:mode==='preview',readonly:mode==='readonly',staff:mode==='staff',value:k=>catalog.resources.get(k)?.type==='action'?'edit':'read',own:k=>catalog.resources.get(k)?.type==='action'?'edit':'read',search:''});
  assert.doesNotMatch(html,/pc-help|role="tooltip"|aria-describedby=/,`${page.key}/${mode}`);count++;
}
console.log(`PASS no permission scope tooltips: ${count} page/mode renders`);
