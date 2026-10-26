import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const base='dist/TipOut/docs',folder=base+'/assets/tips-auto-eligibility-20261026';
const manifest=JSON.parse(fs.readFileSync(folder+'/capture-manifest.json','utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(manifest.changeId,'TIPOUT-AUTO-ELIGIBILITY-20261026-01');assert.equal(manifest.records.length,5);
for(const [file,hash]of Object.entries(manifest.normalizedSourceHashes))assert.equal(sha(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')),hash,file);
for(const record of manifest.records)assert.equal(sha(fs.readFileSync(folder+'/'+record.file)),record.sha256);
const files=['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md','小费管理需求文档（个人规范版）.md'];
for(const [i,file]of files.entries()){
 const text=fs.readFileSync(base+'/'+file,'utf8');
 for(const token of ['V4.21','V3.21','V2.19',manifest.changeId,'0任务且无弹框','进度','成功7／失败1／跳过0'])assert.ok(text.includes(token),file+' '+token);
 assert.equal(text.split('| '+['V4.21','V3.21','V2.19'][i]+' | 2026-10-26').length,2);
 for(const record of manifest.records)assert.ok(text.includes('](assets/tips-auto-eligibility-20261026/'+record.file+')'),file+' '+record.file);
}
console.log('PASS eligibility docs: three linked versions, current source provenance, five embedded screenshots and eligible-only examples');
