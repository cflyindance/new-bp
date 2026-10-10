import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const warning = '本操作仅记录发放状态，不执行转账。确认后分配结果将永久锁定，不能重新分配、取消、更新或修改。';
for (const name of ['distribution','details']) {
  const html = readFileSync(`src/team/tips/templates/${name}.html`, 'utf8');
  assert.ok(html.includes('确认小费已发放？'));
  assert.ok(!html.includes('确认整日小费已发放？'));
  assert.ok(!html.includes('以上为整日分配结果参考金额，不是剩余应发金额。'));
  assert.ok(html.includes(`<strong>${warning}</strong>`));
  assert.ok(!html.includes('请在线下核对现金及其他已支付金额，确认当天员工小费均已结清。'));
}
const docs = 'dist/TipOut/docs/';
for (const name of ['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md']) {
  const text = readFileSync(docs + name, 'utf8');
  assert.ok(text.includes('TIPOUT-PAYOUT-COPY-20260930-02'));
  assert.ok(text.includes('V3.3') && text.includes('V2.3'));
  assert.ok(text.includes(warning));
  const other = name.startsWith('PRD') ? '小费分配业务规格说明书（研发交付版）.md' : 'PRD_产品需求文档.md';
  assert.ok(text.includes(`](${other})`) && existsSync(docs + other));
}
console.log('Payout copy, emphasis and paired document links passed');
