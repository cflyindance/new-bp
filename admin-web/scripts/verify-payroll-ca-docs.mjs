import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=path.resolve('dist/TipOut/docs');
const names=['payroll-需求分析.md','payroll-报表功能设计.md','薪资管理需求文档（个人规范版）.md'];
let imageRefs=0;
for(const name of names){
  const current=fs.readFileSync(path.join(base,name),'utf8').split('## V1.36')[0];
  assert.match(current,/V1\.37/);assert.match(current,/PAYROLL-20261111-CA-OVERTIME/);
  for(const other of names)assert.ok(current.includes(other));
  for(const match of current.matchAll(/!?\[[^\]]*\]\((\.\/[^)]+)\)/g)){
    assert.ok(fs.existsSync(path.resolve(base,match[1])),`${name}: missing ${match[1]}`);
    if(match[0].startsWith('!'))imageRefs++;
  }
}
assert.ok(imageRefs>=10);
console.log(`PASS V1.37 three-document links and ${imageRefs} embedded current-section image references. Screenshot existence is not full operation acceptance.`);
