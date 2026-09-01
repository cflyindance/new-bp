import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
  path.join(root, "dist/Configuration center/assets/order-limit-flow.js"),
  "utf8"
);

assert.match(source, /storeBindings/);
assert.match(source, /effectiveStoreIds/);
assert.match(source, /function sceneTemplateKey\(/);
assert.match(source, /function resolveLimitValue\(/);
assert.match(source, /function migrateToStoreBindings\(/);
assert.match(source, /function materializeStoreConfigsFromDecoupled\(/);
assert.match(source, /decoupledVersion\s*=\s*4|decoupledVersion >= 4/);

const stepsBlock = source.match(/var steps = \[([\s\S]*?)\];/);
assert.ok(stepsBlock, "steps array missing");
const titles = [...stepsBlock[1].matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]);
assert.deepEqual(titles, [
  "规则类型",
  "场景配置",
  "限购数量",
  "超限授权",
  "应用范围",
  "生效范围",
  "确认发布"
]);

assert.match(source, /function renderStepQuantityTemplate\(/);
const qtyFn = source.slice(source.indexOf("function renderStepQuantityTemplate("));
const qtyBody = qtyFn.slice(0, qtyFn.indexOf("\n  function ", 10));
assert.doesNotMatch(qtyBody, /data-limit-store-select/);
assert.doesNotMatch(qtyBody, /data-product-row/);

assert.match(source, /function renderStepStoreBindings\(/);
assert.match(source, /产线/);
assert.match(source, /productOverrides/);

console.log("verify-order-limit-template-store-bindings: OK");
