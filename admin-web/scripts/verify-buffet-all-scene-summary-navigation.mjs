import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');
const policy = fs.readFileSync('dist/Configuration center/assets/buffet-rule-policy.js', 'utf8');

assert.match(policy, /function migrateRangeIdentities\(input\)/);
assert.match(policy, /rangeIdentityVersion = 1/);
assert.match(flow, /function resolveBuffetSummaryScene\(draft,row\)/);
assert.match(flow, /findIndex\(function\(r\)\{return r\.rangeId===row\.partyRangeId;\}\)/);
assert.match(flow, /findIndex\(function\(r\)\{return r\.rangeId===row\.roundRangeId;\}\)/);
assert.match(flow, /该场景已不存在，请刷新汇总结果/);
assert.match(flow, /summaryDraft\.activeStoreId = resolved\.storeId/);
assert.match(flow, /createQuantitySceneSession\(summaryDraft, resolved\.combo\)/);

console.log('verify-buffet-all-scene-summary-navigation: PASS');
