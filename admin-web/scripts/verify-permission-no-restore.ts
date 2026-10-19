import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCenterCatalog} from '../src/permissions/center-catalog';
import {renderPermissionEditor} from '../src/permissions/center-editor';
const catalog=buildCenterCatalog();let count=0;
for(const page of catalog.resources.values())if(page.type==='page')for(const mode of ['role','staff','readonly','preview']){
  const html=renderPermissionEditor({catalog,page:page.key,group:'',preview:mode==='preview',readonly:mode==='readonly',staff:mode==='staff',value:k=>catalog.resources.get(k)?.type==='action'?'edit':'read',own:()=> 'read',search:''});
  assert.doesNotMatch(html,/data-setting-parent|恢复继承|继承父级/);count++;
}
assert.doesNotMatch(readFileSync('src/permissions/center-ui.ts','utf8'),/dataset\.settingParent|applySettingParentChoice/);
console.log(`PASS no restore-inheritance action: ${count} renders, removed click handler, existing inheritance separately covered`);
