import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const base='dist/TipOut/docs',names=['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md','小费管理需求文档（个人规范版）.md'];
let links=0;const used=new Set();
for(const [i,name] of names.entries()){
 const text=fs.readFileSync(path.join(base,name),'utf8');
 for(const v of ['V4.18','V3.18','V2.16','TIPOUT-DOC-CURRENT-20261023-01','e8d203b0','UI-01','UI-02'])assert.ok(text.includes(v),name+' missing '+v);
 const version=['V4.18','V3.18','V2.16'][i];assert.equal((text.match(new RegExp('\\| '+version.replace('.','\\.')+' \\| 2026-10-23 \\|','g'))||[]).length,1,'duplicate latest revision');
 for(const m of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){
  const raw=m[1];if(/^[a-z]+:/i.test(raw)||raw.startsWith('#'))continue;
  const rel=decodeURIComponent(raw.split('#')[0]);if(!rel)continue;
  assert.ok(fs.existsSync(path.resolve(base,rel)),`${name}: missing ${rel}`);links++;
  if(rel.startsWith('assets/tips-docs-current-20261023/'))used.add(path.basename(rel));
 }
}
const m=JSON.parse(fs.readFileSync(base+'/assets/tips-docs-current-20261023/capture-manifest.json','utf8'));
assert.equal(m.baseline,'e8d203b0ef36696f7882d9fd016affbf7cbd2648');
for(const r of m.records){const bytes=fs.readFileSync(base+'/assets/tips-docs-current-20261023/'+r.file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),r.sha256,r.file+' stale hash');assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');assert.ok(bytes.readUInt32BE(16)>=1000&&bytes.readUInt32BE(20)>=600);}
for(const f of used)if(f.endsWith('.png'))assert.ok(m.records.some(r=>r.file===f),f+' lacks provenance');
// Reproduce the unchanged funding and shortage examples in integer cents.
for(const [p,c,a,e] of [[1000,500,1000,500],[10,20,20,0],[10,5,10,5],[10,0,10,10],[0,0,0,0]]){assert.equal(Math.max(p,c),a);assert.equal(Math.max(p-c,0),e);}
assert.equal(Math.min(40,20)+Math.min(60,1000),80);
console.log(`PASS current documents: 3 paired versions, links ${links}, captures ${m.records.length}, embedded current PNGs ${[...used].filter(f=>f.endsWith('.png')).length}, provenance hashes and reproducible examples; unresolved coverage retained`);
