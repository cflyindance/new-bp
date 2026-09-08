import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../dist/Configuration center/assets/order-limit-flow.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../dist/Configuration center/assets/order-limit-flow.css", import.meta.url), "utf8");

assert.match(source, /function renderBuffetProductTable\(/);
assert.match(source, /data-buffet-workbench-page-select/);
assert.match(source, /data-buffet-workbench-select-filtered/);
assert.match(source, /data-buffet-workbench-bulk-apply/);
assert.match(source, /data-buffet-product-bulk-remove/);
assert.match(css, /\.olf-v4-product-table-wrap/);
assert.match(css, /\.olf-v4-product-table-footer/);
console.log("buffet product table shell verified");
