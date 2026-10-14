import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCenterCatalog } from '../src/permissions/center-catalog';
import { renderPermissionEditor } from '../src/permissions/center-editor';
const catalog=buildCenterCatalog();
const options={catalog,page:'module:group-store-list',group:'',preview:false,readonly:false,staff:false,value:()=> 'read' as const,own:()=> 'read' as const,search:''};
function summaries(html:string):string[]{return [...html.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/g)].map(m=>m[1]);}
for(const staff of [false,true]){
  const rows=summaries(renderPermissionEditor({...options,staff}));
  assert.equal(rows.length,47); // 29 modules + 17 navigation nodes (including clock tabs) + display-only directory.
  for(const row of rows){
    if(row.includes('门店管理')&&!row.includes('data-page='))continue;
    assert.match(row,/class="pc-menu-controls"/,'Visibility control must be in its menu header row');
    assert.match(row,/data-value="hidden"/);assert.match(row,/data-value="read"/);
    assert.ok(row.indexOf('pc-tree-group-label')<row.indexOf('pc-menu-controls'));
    if(staff)assert.match(row,/data-value="inherit"/);
  }
}
for(const row of summaries(renderPermissionEditor({...options,staff:true,readonly:true}))){
  if(!row.includes('data-page='))continue;
  assert.match(row,/class="pc-menu-controls"/);assert.match(row,/data-menu-access="read"/);assert.doesNotMatch(row,/data-grant=/);
}
for(const row of summaries(renderPermissionEditor({...options,preview:true})))assert.doesNotMatch(row,/pc-menu-controls|data-grant=/);
const css=readFileSync('src/permissions/center.css','utf8');
assert.match(css,/\.pc-tree-menu-row\s*\{[^}]*grid-template-columns:\s*14px minmax\(0,\s*1fr\) max-content/s);
assert.match(css,/\.pc-menu-controls \.pc-segment\s*\{[^}]*flex-wrap:\s*nowrap/s);
console.log('PASS: all 46 permission menu headers align label and visibility controls in one row; staff inheritance, read-only and preview variants');
