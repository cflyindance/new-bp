import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

let current = { payoutStatus: 'pending' };
const window = { TipOutDateState: { inspect: () => current } };
vm.runInNewContext(fs.readFileSync('src/team/tips/legacy/tipout-payout-record-ui.js.txt', 'utf8'), { window });
const ui = window.TipOutPayoutRecordUi;
assert.throws(() => ui.read('store', 'date'), /发放记录/);
current = { payoutStatus: 'paid', snapshot: { snapshotId: 'v1', summary: { allocatedAmount: 900 }, pools: [
  { employees: [{ employeeId: 'a', name: 'Same' }, { employeeId: 'b', name: 'Same' }] },
  { employees: [{ employeeId: 'a', name: 'Same' }] }
] }, payout: { paidAt: '2026-09-23T01:02:03Z', paidByDisplayNameAtConfirmation: '店长', recordId: 'record-1' } };
const record = ui.read('store', 'date');
assert.equal(record.amount, 900);
assert.equal(record.employeeCount, 2);
assert.equal(record.actor, '店长');
assert.equal(record.paidAt, '2026-09-23T01:02:03Z');
assert.equal(record.recordId, 'record-1');
assert.equal(record.snapshotId, 'v1');
assert.equal(current.snapshot.summary.allocatedAmount, 900);
current = { payoutStatus: 'error', snapshot: null, payout: { recordId: 'record-1' } };
assert.throws(() => ui.read('store', 'date'), /发放记录/);
for (const name of ['distribution', 'details']) {
  const template = fs.readFileSync(`src/team/tips/templates/${name}.html`, 'utf8');
  assert.match(template, /已分配金额（参考）/);
  assert.match(template, /不执行转账/);
  assert.match(template, /现金及其他已支付金额/);
  assert.match(template, /不是剩余应发金额/);
  assert.doesNotMatch(template, /部分发放/);
  const program = fs.readFileSync(`src/team/tips/programs/${name}.js.txt`, 'utf8');
  assert.match(program, /查看发放记录/);
  assert.match(program, /TipOutPayoutRecordUi.open/);
}
console.log('Whole-day payout contract passed.');
