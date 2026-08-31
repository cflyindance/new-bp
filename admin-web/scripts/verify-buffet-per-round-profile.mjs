import assert from "node:assert/strict";
import fs from "node:fs";

const profile = fs.readFileSync("dist/Configuration center/assets/buffet-rule-profile.js", "utf8");
const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");

assert.match(profile, /constraintKind:\s*"round_total"/);
assert.match(profile, /constraintKind:\s*"same_dish_max"/);
assert.match(profile, /order:\s*\["order_lifetime",\s*"per_round"\]/);
assert.match(profile, /allowedConstraintKinds:\s*\["target_max",\s*"round_total",\s*"same_dish_max"\]/);
assert.match(flow, /function constraintKindOf\(draft\)/);
assert.match(flow, /totalBounds:\s*\{\}/);
assert.match(flow, /sameDishLimits:\s*\{\}/);
assert.match(flow, /supportedPartySizeMax:\s*99/);

console.log("verify-buffet-per-round-profile: OK");
