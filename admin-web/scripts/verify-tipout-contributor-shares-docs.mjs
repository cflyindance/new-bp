import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const dir='dist/TipOut/docs',names=['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md','小费管理需求文档（个人规范版）.md'];
let count=0;
for(const name of names){
const text=fs.readFileSync(path.join(dir,name),'utf8');
assert.ok(text.includes('TIPOUT-CONTRIBUTOR-SHARES-20261023-01'));
assert.ok(text.includes('V4.11')&&text.includes('V3.11')&&text.includes('V2.9'));
assert.match(text,/少扣金额不等于老板补足金额|不能把少扣直接等同于补足/);
for(const m of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){
let link=m[1];if(/^[a-z]+:/i.test(link)||link.startsWith('#'))continue;
link=link.split('#')[0];if(!link)continue;
assert.ok(fs.existsSync(path.resolve(dir,decodeURIComponent(link))),name+' missing '+link);count++;
}}
console.log('PASS contributor docs: three paired versions, shared change ID, local links/assets '+count);
