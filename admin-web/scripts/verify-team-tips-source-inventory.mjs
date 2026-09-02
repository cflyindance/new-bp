import assert from "node:assert/strict";
import fs from "node:fs";

const expected = {
  "index.html": ["common.js", "tipout-summary-ui.js", "ruleData.js", "personalSalesDeduct.js", "tipAllocation.js", "attendanceMock.js", "tipout-payroll-bridge.js", "#inline", "export.js"],
  "detail.html": ["common.js", "ruleData.js", "personalSalesDeduct.js", "tipAllocation.js", "attendanceMock.js", "#inline"],
  "rules.html": ["common.js", "ruleData.js", "#inline"],
  "rule-add.html": ["common.js", "ruleData.js", "orderTipStatus.js", "paymentMethodApportion.js", "personalSalesDeduct.js", "tipAllocation.js", "#inline"],
};

for (const [name, inventory] of Object.entries(expected)) {
  const html = fs.readFileSync(`dist/TipOut/${name}`, "utf8");
  const actual = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const src = match[1].match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (src) actual.push(src.split("/").pop());
    else if (match[2].trim()) actual.push("#inline");
  }
  assert.deepEqual(actual, inventory, `${name} script inventory changed`);
}
console.log("Team tips source inventory verification passed.");
