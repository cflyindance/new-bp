import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');

assert.match(flow, /findBuffetSceneRow\(bulkDraft, bulkCombo, rowKey\)/);
assert.match(flow, /v4PeriodValues\(storeConfigFor\(bulkDraft, row\.storeId, true\), bulkPeriod\)/);
assert.match(flow, /data-buffet-row-key/);
assert.match(flow, /target\.getAttribute\("data-limit-store-id"\) \|\| draft\.activeStoreId/);
assert.match(flow, /snapshotsByStoreId/);
assert.match(flow, /Object\.keys\(scene\.snapshotsByStoreId \|\| \{\}\)/);
assert.match(flow, /editableSceneTargets\(draft, row\.storeId\)/);
assert.match(flow, /pickerContainer\.dirtyStoreIds\.map/);
assert.match(flow, /editableSceneTargets\(draft, change\.storeId\)/);

console.log('verify-buffet-cross-store-scene-mutations: PASS');
