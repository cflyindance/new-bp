import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');

assert.match(flow, /function stableBuffetKey\(parts\)/);
assert.match(flow, /function buffetSceneIdentity\(draft, combo\)/);
assert.match(flow, /function buffetSceneRowIdentity\(draft, combo, storeId, target\)/);
assert.match(flow, /storeId,[\s\S]*buffetSceneIdentity\(draft, combo\),[\s\S]*draft\.targetType/);
assert.match(flow, /function buffetSceneRows\(draft, combo\)/);
assert.match(flow, /addedStoreIds\(draft\)\.forEach\(function \(storeId\)/);
assert.match(flow, /rowKey: buffetSceneRowIdentity\(draft, combo, storeId, target\)/);
assert.match(flow, /function filteredBuffetSceneRows\(draft, combo, state\)/);
assert.match(flow, /state\.storeId && row\.storeId !== state\.storeId/);
assert.match(flow, /stableBuffetKey\(\["line-name", lineName\]\)/);
assert.match(flow, /stableBuffetKey\(\["category-name", categoryName\]\)/);
assert.match(flow, /function buffetScenePageData\(draft, combo\)/);

console.log('verify-buffet-cross-store-scene-rows: PASS');
