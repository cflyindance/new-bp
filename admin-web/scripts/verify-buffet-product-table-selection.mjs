import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../dist/Configuration center/assets/order-limit-flow.js", import.meta.url), "utf8");
assert.match(source, /function buffetSelectedTargets\(/);
assert.match(source, /function currentBuffetWorkbenchTargets\(/);
assert.match(source, /data-buffet-workbench-page-size[\s\S]{0,300}clearBuffetQuantitySelection/);
assert.match(source, /data-buffet-quantity-store[\s\S]{0,350}clearBuffetQuantitySelection/);
assert.match(source, /data-party-tab[\s\S]{0,150}clearBuffetQuantitySelection/);
assert.match(source, /data-round-tab[\s\S]{0,150}clearBuffetQuantitySelection/);
console.log("buffet product table selection boundaries verified");
