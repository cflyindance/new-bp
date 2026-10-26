import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const base='dist/TipOut/docs',files=['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md','小费管理需求文档（个人规范版）.md'];
for(const [i,name]of files.entries()){
 const text=fs.readFileSync(path.join(base,name),'utf8');
 for(const token of ['V4.19','V3.19','V2.17','TIPOUT-QUICK-DATES-20261026-01','今天','昨天','本周','上周','本月','上月'])assert.ok(text.includes(token),name+' '+token);
 assert.equal((text.match(new RegExp('\\| '+['V4.19','V3.19','V2.17'][i].replace('.','\\.')+' \\| 2026-10-26','g'))||[]).length,1);
 for(const key of ['today','yesterday','this-week','last-week','this-month','last-month'])assert.ok(text.includes('assets/tips-quick-dates-20261026/'+key+'.png'));
}
const manifest=JSON.parse(fs.readFileSync(base+'/assets/tips-quick-dates-20261026/capture-manifest.json','utf8'));
assert.equal(manifest.branch,'codex/tips-quick-date-filters-20261026');
assert.equal(manifest.records.length,13);
for(const r of manifest.records){const bytes=fs.readFileSync(base+'/assets/tips-quick-dates-20261026/'+r.file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),r.sha256);}
if(!manifest.supersededBy)for(const [file,hash]of Object.entries(manifest.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file+' changed after screenshots');
else assert.equal(manifest.supersededBy,'TIPOUT-AUTO-ALLOCATION-20261026-01');
console.log('PASS quick-date historical docs: original versions, operations and 13 image hashes; current behavior covered by auto-allocation manifest');
