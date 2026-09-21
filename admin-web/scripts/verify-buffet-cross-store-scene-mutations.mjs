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
assert.match(flow, /applyScenePickerChanges\(draft, changes, scene, field\)/);
assert.match(flow, /stores\.map\(function \(item\)/, '场景商品选择器列出全部门店');
assert.match(flow, /未参与/, '未参与门店提供明确标记');
assert.match(flow, /!change\.pickerState\.wasParticipating && change\.selection\.length < minimum/, '只要求新门店满足首次加入的最小对象数');
assert.match(flow, /nextDraft\.participatingStoreIds\.push\(change\.storeId\)/, '新门店随场景商品一起自动加入规则');
assert.doesNotMatch(flow, /participatingStoreIds[^\n]*splice[^\n]*change\.storeId/, '清空场景不自动移出参与门店');

console.log('verify-buffet-cross-store-scene-mutations: PASS');
