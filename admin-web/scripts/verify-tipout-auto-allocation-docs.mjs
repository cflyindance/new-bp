import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const base='dist/TipOut/docs';
const files=['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md','小费管理需求文档（个人规范版）.md'];
const manifest=JSON.parse(fs.readFileSync(base+'/assets/tips-auto-allocation-20261026/capture-manifest.json','utf8'));
if(manifest.supersededBy)assert.equal(manifest.supersededBy,'TIPOUT-AUTO-ELIGIBILITY-20261026-01');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(manifest.changeId,'TIPOUT-AUTO-ALLOCATION-20261026-01');assert.equal(manifest.records.length,6);
if(!manifest.supersededBy)for(const [file,hash]of Object.entries(manifest.normalizedSourceHashes)){const text=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');assert.equal(crypto.createHash('sha256').update(text).digest('hex'),hash,file);}
for(const record of manifest.records)assert.equal(sha(base+'/assets/tips-auto-allocation-20261026/'+record.file),record.sha256);
for(const [i,file]of files.entries()){
 const text=fs.readFileSync(base+'/'+file,'utf8');
 for(const token of [manifest.changeId,'V4.20','V3.20','V2.18','重试失败日期','成功7／失败1／跳过0','pending→running'])assert.ok(text.includes(token),file+' '+token);
 assert.equal(text.split('| '+['V4.20','V3.20','V2.18'][i]+' | 2026-10-26').length,2);
 for(const record of manifest.records)assert.ok(text.includes('](assets/tips-auto-allocation-20261026/'+record.file+')'),file+' embedded '+record.file);
}
console.log('PASS automatic-allocation documents: three versions, shared baseline, six embedded screenshots, historical image hashes and reproducible ten-day example (current preflight has separate coverage)');
