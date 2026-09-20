import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');
const css = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.css', 'utf8');

assert.match(flow, /data-buffet-workbench-store/);
assert.match(flow, /全部参与门店（/);
assert.match(flow, /<th>产线<\/th>/);
assert.match(flow, /<th>分类<\/th>/);
assert.match(flow, /<th>门店<\/th>/);
assert.match(flow, /row\.lineLabel \|\| "—"/);
assert.match(flow, /buffetSceneNameWithoutLineSuffix\(row\.categoryName, lineName\) \|\| "—"/);
assert.match(flow, /row\.storeName \|\| row\.storeId \|\| "—"/);
assert.match(flow, /var itemName = buffetDisplayName\(target, lineName\)/);
assert.match(flow, /draft\.targetType === "category" \? 7 : 8/);
assert.doesNotMatch(flow, /<th>产线 · 分类 · 编码<\/th>/);
assert.doesNotMatch(flow, /<span>' \+ esc\(row\.code\)/);
assert.match(flow, /function buffetSceneFilterName\(value\)/);
assert.match(flow, /stableBuffetKey\(\["line-name", lineName\]\)/);
assert.match(flow, /stableBuffetKey\(\["category-name", categoryName\]\)/);
assert.doesNotMatch(flow, /\(state\.storeId \? "" : row\.storeName \+ " · "\) \+ row\.lineLabel/);
assert.doesNotMatch(flow, /\(state\.storeId \? "" : row\.storeName \+ " · "\) \+ row\.categoryName/);
assert.match(flow, /if \(state\.lineId\) optionRows = optionRows\.filter/);
assert.match(flow, /lineState\.categoryId = ""/);
assert.match(flow, /function buffetSceneNameWithoutLineSuffix\(value, lineName\)/);
assert.match(flow, /var pageSelect = '<input type="checkbox" aria-label="全选当前页商品" data-buffet-workbench-page-select/);
assert.match(flow, /<th class="olf-batch-select-cell">' \+ pageSelect \+ '<\/th>/);
assert.match(flow, /olf-cross-store-workbench-tools[\s\S]*?<div class="olf-v4-workbench-batch"><strong>已选/);
assert.match(flow, /pageSelect\.indeterminate = visibleRowChecks\.some/);
assert.doesNotMatch(flow, /table\.classList\.contains\("olf-cross-store-table"\)\) return/);
assert.match(flow, /限购对象 .* 条，来自 .* 家门店；筛选结果/);
assert.match(flow, /data-limit-store-id/);
assert.match(flow, /buffetScenePageData\(draft, pageCombo\)\.pageRows/);
assert.match(flow, /storeFilterState\.lineId = ""; storeFilterState\.categoryId = ""/);
assert.match(css, /\.olf-cross-store-table/);
assert.match(css, /\.olf-cross-store-name/);

console.log('verify-buffet-cross-store-scene-ui: PASS');
