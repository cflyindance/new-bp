import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';

const data = new Map();
const localStorage = {
  getItem(key) { return data.has(key) ? data.get(key) : null; },
  setItem(key, value) { data.set(key, String(value)); },
  removeItem(key) { data.delete(key); }
};
let queue = Promise.resolve();
const locks = { request(_name, _options, callback) { const run = queue.then(callback); queue = run.catch(() => {}); return run; } };
const window = { localStorage, navigator: { locks }, crypto: webcrypto, TextEncoder, dispatchEvent() {} };
const context = { window, localStorage, navigator: window.navigator, crypto: webcrypto, TextEncoder, isFinite, Date, Math, Uint8Array };
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/team/tips/legacy/tipout-date-state-store.js.txt', 'utf8'), context);
vm.runInContext(fs.readFileSync('src/team/tips/legacy/tipout-allocation-results-store.js.txt', 'utf8'), context);

const state = window.TipOutDateState;
const results = window.TipOutAllocationResults;
const snapshot = {
  version: 1, store: 'Golden Dragon', dateKey: '2026-09-14', confirmedAt: '2026-09-14T00:00:00.000Z',
  pools: [{ poolId: 'p1', poolName: 'Pool 1', ruleId: 'r1', ruleName: 'Rule 1', poolAmount: 10,
    employees: [{ employeeId: 'e1', name: 'A', role: 'Server', hours: 8, percentage: 100, amount: 10 }] }],
  summary: { originalTips: 10, poolAmount: 10, allocatedAmount: 10, unallocatedAmount: 0, poolCount: 1 }
};

const committed = await results.commit(snapshot);
assert.equal(committed.snapshotVersion, 1);
assert.match(committed.snapshotHash, /^[0-9a-f]{64}$/);
assert.equal(state.inspect(snapshot.store, snapshot.dateKey).payoutStatus, 'pending');
state.markUnconfirmedUpdate(snapshot.store, snapshot.dateKey, 'draft-v2');
assert.equal(state.hasUnconfirmedUpdate(snapshot.store, snapshot.dateKey), true);
const request = {
  storeId: snapshot.store, businessDate: snapshot.dateKey,
  expectedSnapshotId: committed.snapshotId, expectedSnapshotVersion: committed.snapshotVersion,
  expectedSnapshotHash: committed.snapshotHash, requestId: 'req-1',
  paidById: 'demo-manager', paidByDisplayName: '王店长'
};
await assert.rejects(state.confirmPayout(request), /重新确认分配/);
state.clearUnconfirmedUpdate(snapshot.store, snapshot.dateKey);
assert.equal(state.hasUnconfirmedUpdate(snapshot.store, snapshot.dateKey), false);
const paid = await state.confirmPayout(request);
const retry = await state.confirmPayout(request);
assert.equal(retry.recordId, paid.recordId);
assert.equal(retry.paidAt, paid.paidAt);
assert.equal(state.inspect(snapshot.store, snapshot.dateKey).payoutStatus, 'paid');
await assert.rejects(results.commit(snapshot), /小费已发放/);
await assert.rejects(results.cancel(snapshot.store, snapshot.dateKey), /小费已发放/);
const before = data.get(state.PAYOUT_KEY);
await assert.rejects(state.confirmPayout({ ...request, requestId: 'req-2' }), /已确认发放/);
assert.equal(data.get(state.PAYOUT_KEY), before);

const payoutDoc = JSON.parse(data.get(state.PAYOUT_KEY));
const payoutKey = snapshot.store + '\u0000' + snapshot.dateKey;
payoutDoc[payoutKey].snapshotHash = 'broken';
data.set(state.PAYOUT_KEY, JSON.stringify(payoutDoc));
const corrupt = state.inspect(snapshot.store, snapshot.dateKey);
assert.equal(corrupt.payoutStatus, 'error');
assert.equal(corrupt.locked, true);
assert.equal(corrupt.snapshot, null);

assert.equal(state.canonical({ b: 2, a: 1 }), state.canonical({ a: 1, b: 2 }));
console.log('Tip payout lock verification passed.');
