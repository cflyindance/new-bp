import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");

assert.match(flow, /function createBuffetQuantityWorkbenchState\(\)/);
assert.match(flow, /function normalizeBuffetQuantityWorkbenchState\(draft\)/);
assert.match(flow, /function clearBuffetQuantitySelection\(\)/);
assert.match(flow, /function buffetWorkbenchTargetIdentity\(draft, target\)/);
assert.match(flow, /function filteredBuffetWorkbenchTargets\(draft, config, state, combo, values\)/);
assert.match(flow, /selectionMode: "page"/);
assert.match(flow, /selectedIds: \[\]/);
assert.match(flow, /categoryId: ""/);
assert.match(flow, /status: ""/);
assert.match(flow, /resetState\.categoryId = ""/);
assert.match(flow, /resetState\.status = ""/);
assert.match(flow, /editorState\.buffetQuantityWorkbench = createBuffetQuantityWorkbenchState\(\)/);
assert.match(flow, /window\.BuffetQuantityWorkbenchTestApi/);

console.log("verify-buffet-quantity-workbench-state: PASS");
