import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
  path.join(root, "dist/Configuration center/assets/order-limit-flow.js"),
  "utf8",
);

assert.match(source, /var MENU_ORDER_LIMIT_PROFILE = \{/);
assert.match(source, /window\.ORDER_LIMIT_MODULE_PROFILE \|\| MENU_ORDER_LIMIT_PROFILE/);
assert.match(source, /var steps = moduleProfile\.steps;/);
assert.match(source, /moduleProfile\.routes\.list/);
assert.match(source, /moduleProfile\.routes\.editor/);
assert.match(source, /moduleProfile\.routes\.publishConfirm/);
assert.match(source, /moduleProfile\.storage\.rulesKey/);
assert.match(source, /moduleProfile\.storage\.recoveryPrefix/);

const profileEnd = source.indexOf("var moduleProfile =");
assert.ok(profileEnd > 0, "无法定位默认 Profile 结尾");
const implementation = source.slice(profileEnd);
assert.doesNotMatch(implementation, /go\("order-limit(?:-rule-editor|-publish-confirm)?\.html/);
assert.doesNotMatch(implementation, /history\.replaceState\([^\n]+"order-limit-rule-editor\.html/);

console.log("verify-buffet-rule-profile-engine: OK");
