import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "dist/Configuration center/assets/order-limit-flow.js"), "utf8");
const css = fs.readFileSync(path.join(root, "dist/Configuration center/assets/order-limit-flow.css"), "utf8");
const renderStepOne = source.slice(source.indexOf("function renderStepOne"), source.indexOf("function renderChecks"));
const shared = source.slice(source.indexOf("function renderBuffetSharedQuotaPanel"), source.indexOf("function buffetTargetLimitLabel"));
const targets = source.slice(source.indexOf("function v4TargetRows"), source.indexOf("function buffetRuleHelpContent"));

assert.doesNotMatch(renderStepOne, /data-buffet-measure-unit/);
assert.match(shared, /菜品集共享额度/);
assert.match(targets, /按份限制/);
assert.match(targets, /按种限制（SPU）/);
assert.match(targets, /data-v4-measure-toggle/);
assert.match(targets, /data-v4-measure-field/);
assert.match(source, /至少启用一种计量方式/);
assert.match(source, /关闭后将清除当前场景该计量额度/);
assert.match(css, /\.olf-dish-set-measures/);
assert.match(css, /@media\(max-width:900px\)/);
console.log("buffet dual measure editor verification passed");
