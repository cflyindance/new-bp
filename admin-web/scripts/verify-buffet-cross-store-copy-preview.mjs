import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
assert.match(flow, /function previewBuffetStoreCopy\(draft, sourceStoreId, destinationStoreIds, options\)/);
assert.match(flow, /function applyBuffetStoreCopyPreview\(draft, preview\)/);
assert.match(flow, /overwriteConfigured/);
assert.match(flow, /summary: \{ fill: 0, overwrite: 0, preserved: 0, missing: 0 \}/);
assert.match(flow, /operation\.status !== "fill" && operation\.status !== "overwrite"/);
// Internal compatibility helpers may remain; no UI or event can invoke this retired feature.
assert.doesNotMatch(flow, /data-buffet-store-copy/);
assert.doesNotMatch(flow, /function renderV4StoreCopy/);
assert.doesNotMatch(flow, /copyPanelOpen|copyTargetStoreIds/);

console.log("verify-buffet-cross-store-copy-preview: PASS");
