import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
assert.match(flow, /function previewBuffetStoreCopy\(draft, sourceStoreId, destinationStoreIds, options\)/);
assert.match(flow, /function applyBuffetStoreCopyPreview\(draft, preview\)/);
assert.match(flow, /overwriteConfigured/);
assert.match(flow, /summary: \{ fill: 0, overwrite: 0, preserved: 0, missing: 0 \}/);
assert.match(flow, /operation\.status !== "fill" && operation\.status !== "overwrite"/);
assert.match(flow, /data-buffet-store-copy-target[^>]*multiple/);
assert.match(flow, /data-buffet-store-copy-overwrite/);
assert.match(flow, /默认只填充空值/);

console.log("verify-buffet-cross-store-copy-preview: PASS");
