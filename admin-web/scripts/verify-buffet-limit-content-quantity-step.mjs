import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");

const stepOne = flow.slice(flow.indexOf("function renderStepOne(draft)"), flow.indexOf("function renderChecks", flow.indexOf("function renderStepOne(draft)")));
assert.doesNotMatch(stepOne, /buffetContentBlock|renderBuffetLimitContent\(draft\)/, "Step 1 must not render editable limit content");

assert.match(flow, /function renderBuffetQuantityStep\(draft\)/, "modern buffet needs a dedicated Step 2 renderer");
const quantityStart = flow.indexOf("function renderBuffetQuantityStep(draft)");
const quantityEnd = flow.indexOf("function renderEditorContent", quantityStart);
const quantityStep = flow.slice(quantityStart, quantityEnd);
const ordered = ["renderBuffetScenarioWorkspace(draft)", "renderBuffetQuantityWorkbench(draft)"];
let previous = -1;
for (const marker of ordered) {
  const index = quantityStep.indexOf(marker);
  assert.ok(index > previous, `${marker} must appear in the confirmed Step 2 order`);
  previous = index;
}
assert.doesNotMatch(quantityStep, /renderBuffetRuleContext\(draft\)/, "Step 2 must not render the redundant current-limit summary");
assert.doesNotMatch(quantityStep, /renderBuffetActiveScenario\(draft\)/, "Step 2 must not render the redundant active-scenario summary");
assert.doesNotMatch(quantityStep, /renderBuffetLimitContent\(draft\)/, "Step 2 must not render a separate limit-content section");

const validationStart = flow.indexOf("function validateStep(stepNumber, draft)");
const validationEnd = flow.indexOf("function validateAll", validationStart);
const validation = flow.slice(validationStart, validationEnd);
assert.match(validation, /stepNumber === 1[\s\S]*validateBuffetRuleTypeStep/, "Step 1 must own rule-type validation");
assert.match(validation, /stepNumber === 2[\s\S]*validateSixStep\(2, draft\)[\s\S]*validateSixStep\(3, draft\)/, "Step 2 must own limit-content, ranges, products and quantities");

assert.doesNotMatch(flow, /data-period-block/, "manual limit-content checkboxes must be removed");
assert.doesNotMatch(flow, /启用限制内容|关闭限制内容/, "manual limit-content toggle interaction must be removed");
assert.match(flow, /if \(editorState\.currentStep === 2\) return renderStepThree\(draft\)/, "menu order-limit Step 2 routing must stay unchanged");

console.log("verify-buffet-limit-content-quantity-step: PASS");
