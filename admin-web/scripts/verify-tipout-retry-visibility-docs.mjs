import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const base='dist/TipOut/docs',folder=base+'/assets/tips-retry-visibility-20261026';
const m=JSON.parse(fs.readFileSync(folder+'/capture-manifest.json','utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(m.changeId,'TIPOUT-RETRY-VISIBILITY-20261026-01');assert.equal(m.records.length,3);
for(const [file,hash]of Object.entries(m.normalizedSourceHashes))assert.equal(sha(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')),hash,file);
for(const r of m.records)assert.equal(sha(fs.readFileSync(folder+'/'+r.file)),r.sha256);
for(const [i,file]of ['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md','小费管理需求文档（个人规范版）.md'].entries()){
 const s=fs.readFileSync(base+'/'+file,'utf8');for(const token of [m.changeId,'V4.22','V3.22','V2.20','全部日期执行完且有失败','不进入Tab','重试仍有失败'])assert.ok(s.includes(token),file+' '+token);
 assert.equal(s.split('| '+['V4.22','V3.22','V2.20'][i]+' | 2026-10-26').length,2);
 for(const r of m.records)assert.ok(s.includes('](assets/tips-retry-visibility-20261026/'+r.file+')'),file+' '+r.file);
}
console.log('PASS retry visibility docs: paired versions, three embedded states, current source and screenshot hashes');
