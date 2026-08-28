import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flow = fs.readFileSync(path.join(root, "dist/Configuration center/assets/order-limit-flow.js"), "utf8");
const profile = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"), "utf8");

assert.match(profile, /order:\s*\["order_lifetime"\]/);
assert.match(profile, /party_size:\s*\["order_lifetime",\s*"per_round",\s*"multi_round"\]/);
assert.match(profile, /allowedTargetTypes:\s*\["category",\s*"dish"\]/);

assert.match(flow, /function isAllowedCombination\(draft\)/);
assert.match(flow, /function showsPartyDimension\(draft\)/);
assert.match(flow, /if \(draft\.subject === "order"\) \{[\s\S]*?draft\.period = "order_lifetime"/);
assert.match(flow, /draft\.subject === "party_size"[\s\S]*?validateContinuousRanges\(draft\.partyRanges/);

const stepOne = flow.match(/function renderStepOne\(draft\)[\s\S]*?(?=\n  function renderChecks)/)?.[0] ?? "";
assert.match(stepOne, /按桌\/订单限购/);
assert.match(stepOne, /按人数限购/);
assert.match(stepOne, /整单累计/);
assert.match(stepOne, /"每单"/);
assert.match(stepOne, /"每轮"/);
assert.match(stepOne, /"分轮次"/);

const sceneStep = flow.match(/function renderStepThree\(draft\)[\s\S]*?(?=\n  function cellFor)/)?.[0] ?? "";
assert.match(sceneStep, /当前规则按整个订单累计，无需配置人数和轮次/);
assert.match(sceneStep, /data-add-range="party"/);
assert.match(sceneStep, /data-add-range="round"/);

for (const label of ["整单上限", "每人每单上限", "每人每轮上限", "每人上限"]) {
  assert.ok(flow.includes(label), `缺少数量列文案：${label}`);
}

assert.match(flow, /showsPartyDimension\(draft\)/);
assert.match(flow, /field === "subject" && isBuffetProfile\(\)/);

console.log("verify-buffet-rule-scenarios: OK");
