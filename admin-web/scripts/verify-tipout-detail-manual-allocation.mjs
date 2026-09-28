import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const window = {};
vm.runInNewContext(fs.readFileSync('src/team/tips/legacy/tipout-detail-manual-allocation.js.txt', 'utf8'), { window });
const api = window.TipOutDetailManualAllocation;

assert.equal(api.parseHours('8'), 8);
assert.equal(api.parseHours('8.25'), 8.25);
assert.equal(api.parsePct('33.33'), 3333);
for (const value of ['', '-1', '1.234', 'abc', 'Infinity']) {
  assert.throws(() => api.parseHours(value), /工时/);
}
for (const value of ['', '-1', '100.01', '1.234', 'abc']) {
  assert.throws(() => api.parsePct(value), /比例/);
}
const ratios = Array.from(api.ratiosFromHours([1, 1, 1]));
assert.equal(ratios.reduce((sum, ratio) => sum + ratio, 0), 10000);
assert.ok(Math.max(...ratios) - Math.min(...ratios) <= 1);
assert.deepEqual(Array.from(api.ratiosFromHours([0, 0])), [0, 0]);
const tiny = api.amountsFromPcts(3, [2400, 2400, 2400, 2400]);
assert.equal(Array.from(tiny.cents).reduce((sum, cents) => sum + cents, 0), 3);
assert.equal(tiny.undistributedCents, 0);
const partial = api.amountsFromPcts(100, [2500, 2500]);
assert.deepEqual(Array.from(partial.cents), [25, 25]);
assert.equal(partial.undistributedCents, 50);
assert.throws(() => api.amountsFromPcts(100, [6000, 5000]), /比例/);
console.log('Manual detail allocation arithmetic passed.');
