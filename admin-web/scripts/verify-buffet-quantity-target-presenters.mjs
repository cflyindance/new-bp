import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
assert.match(flow, /function renderBuffetSharedQuotaPanel\(draft, config, combo, values\)/);
assert.match(flow, /function renderBuffetDishRows\(draft, config, combo, values\)/);
assert.match(flow, /function renderBuffetCategoryRows\(draft, config, combo, values\)/);
assert.match(flow, /function renderBuffetDishSetMemberRows\(draft, config, values, scenario\)/);
assert.match(flow, /菜品集共享额度/);
assert.match(flow, /跨产线合并统计，只需设置一次/);
assert.match(flow, /使用默认值/);
assert.match(flow, /已设置例外/);
assert.match(flow, /包含 ' \+ \(target\.count \|\| 0\) \+ ' 个菜品/);

console.log("verify-buffet-quantity-target-presenters: PASS");
