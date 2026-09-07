import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
assert.match(flow, /function buffetWorkbenchPageData\(draft, config\)/);
assert.match(flow, /function selectBuffetWorkbenchPage\(draft, config\)/);
assert.match(flow, /function selectAllFilteredBuffetTargets\(draft, config\)/);
assert.match(flow, /data-buffet-workbench-query/);
assert.match(flow, /data-buffet-workbench-line/);
assert.match(flow, /data-buffet-workbench-page-select/);
assert.match(flow, /选择全部筛选结果，共/);
assert.match(flow, /data-buffet-workbench-page-size/);
assert.match(flow, /data-buffet-workbench-bulk-apply/);

console.log("verify-buffet-quantity-bulk-selection: PASS");
