import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../dist/Configuration center/assets/order-limit-flow.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../dist/Configuration center/assets/order-limit-flow.css", import.meta.url), "utf8");

assert.match(source, /function renderBuffetProductTable\(/);
assert.match(source, /data-buffet-workbench-page-select/);
assert.match(source, /data-buffet-workbench-select-filtered/);
assert.match(source, /data-buffet-workbench-bulk-apply/);
assert.match(source, /data-buffet-product-bulk-remove/);
assert.match(source, /data-buffet-workbench-category/);
assert.match(source, /data-buffet-workbench-status/);
assert.match(source, /全部状态/);
assert.match(source, /已配置/);
assert.match(source, /未配置/);
assert.match(source, /禁止下单/);
assert.match(source, /draft\.targetType !== "category"/);
assert.match(css, /\.olf-v4-product-table-wrap/);
assert.match(css, /\.olf-v4-product-table-footer/);
assert.match(css, /\.olf-v4-workbench-filters/);
console.log("buffet product table shell verified");
