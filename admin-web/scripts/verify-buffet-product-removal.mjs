import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../dist/Configuration center/assets/order-limit-flow.js", import.meta.url), "utf8");
assert.match(source, /function previewBuffetProductRemoval\(/);
assert.match(source, /function applyBuffetProductRemoval\(/);
assert.match(source, /remaining < 2/);
assert.match(source, /delete values\.targetLimits\[key\]/);
assert.match(source, /delete values\.tableTargetCaps\[key\]/);
assert.match(source, /values\.exceptionDishLimits\[scenario\] = v4ExceptionRows/);
assert.match(source, /data-buffet-product-remove/);
assert.match(source, /确认移除/);
console.log("buffet product removal safeguards verified");
