import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../dist/Configuration center/assets/order-limit-flow.js", import.meta.url), "utf8");
assert.match(source, /function renderBuffetDishTableRows\(/);
assert.match(source, /function renderBuffetCategoryTableRows\(/);
assert.match(source, /function renderBuffetDishSetTableRows\(/);
assert.match(source, /data-buffet-category-members/);
assert.match(source, /data-v4-exception-add-member/);
assert.match(source, /菜品集共享额度/);
console.log("buffet product table object presenters verified");
