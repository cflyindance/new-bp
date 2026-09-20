import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');
const css = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.css', 'utf8');

assert.match(flow, /data-buffet-workbench-store/);
assert.match(flow, /全部参与门店（/);
assert.match(flow, /<th>所属门店<\/th>/);
assert.match(flow, /row\.storeName/);
assert.match(flow, /限购对象 .* 条，来自 .* 家门店；筛选结果/);
assert.match(flow, /data-limit-store-id/);
assert.match(flow, /buffetScenePageData\(draft, pageCombo\)\.pageRows/);
assert.match(flow, /storeFilterState\.lineId = ""; storeFilterState\.categoryId = ""/);
assert.match(css, /\.olf-cross-store-table/);
assert.match(css, /\.olf-cross-store-name/);

console.log('verify-buffet-cross-store-scene-ui: PASS');
