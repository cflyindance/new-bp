import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");

const stepOneStart = flow.indexOf("function renderStepOne(draft)");
const stepOneEnd = flow.indexOf("function renderChecks", stepOneStart);
assert.ok(stepOneStart >= 0 && stepOneEnd > stepOneStart, "renderStepOne must exist");
const stepOne = flow.slice(stepOneStart, stepOneEnd);

const markupStart = stepOne.lastIndexOf("return '<div class=\"olf-content-head");
assert.ok(markupStart >= 0, "renderStepOne markup return must exist");
const markup = stepOne.slice(markupStart);

const orderedMarkers = [
  "<h3>基础信息</h3>",
  "buffetTemplateBlock",
  "<h3>限购主体</h3>",
  "buffetPeriodBlock",
  "<h3>限购对象</h3>",
  "measureBlock",
  "childBlock",
  "规则预览："
];

let previousIndex = -1;
for (const marker of orderedMarkers) {
  const markerIndex = markup.indexOf(marker, previousIndex + 1);
  assert.ok(markerIndex > previousIndex, `${marker} must appear in the confirmed buffet rule-type order`);
  previousIndex = markerIndex;
}

assert.match(flow, /function renderBuffetTemplateSelection\(draft\)/);
assert.match(flow, /function renderBuffetLimitContent\(draft\)/);
assert.match(flow, /template\.id === "custom"[\s\S]*?enabled: true/, "custom template must remain available for an incomplete draft");

const applyStart = flow.indexOf("function applyBuffetTemplate(draft, templateId)");
const applyEnd = flow.indexOf("function markBuffetTemplateModified", applyStart);
assert.ok(applyStart >= 0 && applyEnd > applyStart, "applyBuffetTemplate must exist");
const applyTemplate = flow.slice(applyStart, applyEnd);
assert.doesNotMatch(applyTemplate, /draft\.subject\s*=/, "templates must not overwrite subject");
assert.doesNotMatch(applyTemplate, /draft\.targetType\s*=/, "templates must not overwrite target type");
assert.doesNotMatch(applyTemplate, /draft\.measureUnit\s*=/, "templates must not overwrite measure unit");
assert.doesNotMatch(applyTemplate, /draft\.storeConfigs\s*=/, "templates must not overwrite store products or quantities");

console.log("verify-buffet-rule-type-field-order: PASS");
