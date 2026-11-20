import assert from 'node:assert/strict';
import { emptyState, inspect, prepareBatch } from '../src/config/activity-notifications';
import { createActivityDemo } from '../src/config/merchant-activity-demo';
import { shiftDate } from '../src/config/merchant-activity-domain';

const day = '2026-11-19', data = createActivityDemo(day), state = emptyState();
const template = data.stores[0]!;
data.stores = Array.from({ length: 10 }, (_, i) => ({
  ...template, id: 'store-' + i, merchantId: 'brand', name: '门店 ' + i,
}));
data.orders = data.stores.map(store => ({
  id: 'order', storeId: store.id, submittedAt: shiftDate(day, -14) + 'T12:00:00+08:00', deviceId: null, status: 'paid',
}));
const people = ['A', 'B', 'C'].map(id => ({ id, name: id, email: id + '@example.test', enabled: true }));
state.brands.brand = { sales: 'A', manager: 'C' };
for (const store of data.stores.slice(6)) state.stores[store.id] = { sales: 'B' };
const rows = inspect(data, day, state);
assert.equal(rows.length, 10);
assert.ok(rows.every(row => row.current.level === 2));
const plan = () => prepareBatch(state, rows, day, people, () => true);
const initial = plan();
assert.deepEqual(Object.fromEntries(initial.groups.map(group => [group.person.id, group.items.length])), { A: 6, B: 4, C: 10 });
for (const row of rows) state.cases[row.store.id] = row.current;
state.deliveries = initial.groups.flatMap(group => group.items.map(item => ({ ...item, result: group.person.id === 'B' ? 'failure' : 'success' })));
assert.deepEqual(plan().groups.map(group => group.person.id), ['B']);
const restricted = prepareBatch(state, rows, day, people, person => person.id !== 'B');
assert.equal(restricted.groups.length, 0);
assert.equal(restricted.blocked.length, 4);
data.orders.push({ ...data.orders[0]!, id: 'recovery', submittedAt: day + 'T12:00:00+08:00' });
const recovered = inspect(data, day, state).filter(row => row.current.level === 0);
assert.equal(recovered.length, 1);
assert.deepEqual(prepareBatch(state, recovered, day, people, () => true).groups.map(group => group.person.id), ['A', 'C']);
console.log('PASS: 6/4/10 routing, partial retry, recipient scope, recovery');
