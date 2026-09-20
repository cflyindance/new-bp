import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');

assert.match(flow, /function buffetDisplayName\(target, lineName, fallbackName\)/);
assert.match(flow, /MenuPicker\.listAllDishes\(\)\.find/);
assert.match(flow, /function buffetActiveStoreName\(draft, config\)/);
assert.match(flow, /\{ key: "object", label: draft\.targetType === "category" \? "分类" : "商品" \}/);
assert.match(flow, /\{ key: "line", label: "产线" \}/);
assert.match(flow, /\{ key: "category", label: "分类" \}/);
assert.match(flow, /\{ key: "store", label: "门店" \}/);
assert.match(flow, /renderBuffetDishTableRows[\s\S]*?buffetDisplayName\(target, lineName, meta\.productName\)/);
assert.match(flow, /renderBuffetDishSetTableRows[\s\S]*?buffetDisplayName\(dish, lineName, meta\.productName\)/);
assert.match(flow, /renderCrossStoreSceneRow[\s\S]*?buffetDisplayName\(target, lineName\)/);
assert.doesNotMatch(flow, /<span>' \+ esc\(meta\.code\) \+ '<\/span>/);
assert.doesNotMatch(flow, /headings\[2\]\.textContent = .*产线 · 分类 · 编码/);
assert.doesNotMatch(flow, /cells\[2\]\.textContent = cells\[3\]\.textContent/);
assert.match(flow, /draft\.targetType === "category"[\s\S]*?\{ key: "store", label: "门店" \}/);

console.log('verify-buffet-product-table-fields: PASS');
