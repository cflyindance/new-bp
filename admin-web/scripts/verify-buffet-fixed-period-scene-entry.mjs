import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");

function functionBody(name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} must exist`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = brace; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  assert.fail(`${name} must have a balanced body`);
}

assert.match(source, /function allQuantityScenarios\(draft\)/);
assert.match(source, /BUFFET_PERIOD_ORDER/);

const renderPeriodSection = functionBody("renderV4PeriodSection");
assert.match(renderPeriodSection, /data-quantity-scene-open/);
assert.doesNotMatch(renderPeriodSection, /olf-inline-workbench/);

const renderDialog = functionBody("renderQuantitySceneDialog");
assert.match(renderDialog, /allQuantityScenarios\(draft\)/);
assert.match(renderDialog, /data-quantity-scene-next/);
assert.match(renderDialog, /position === scenarios\.length - 1 \? ['"] hidden['"] : ['"]/);

const renderTargetPanel = functionBody("renderBuffetTargetQuantityPanel");
assert.doesNotMatch(
  renderTargetPanel,
  /if \(editorState\.quantitySceneDialog\) return renderCrossStoreSceneToolbar/,
  "统一额度弹窗不能在菜品集共享额度渲染前直接返回",
);
assert.match(renderTargetPanel, /editorState\.quantitySceneDialog[\s\S]*draft\.targetType === "dish_set" \? renderBuffetSharedQuotaPanel/);

const clickHandler = functionBody("handleEditorClick");
assert.match(clickHandler, /createQuantitySceneSession\(nextDraft, nextCombo\)/);

const closeDialog = functionBody("closeQuantitySceneDialog");
assert.match(closeDialog, /validateQuantitySceneForAllStores/);
assert.match(closeDialog, /restoreQuantitySceneSnapshots/);

assert.match(source, /function createQuantitySceneSession\(draft, combo\)/);
assert.match(source, /function quantitySceneIsDirty\(draft, session\)/);
assert.match(source, /function restoreQuantitySceneSnapshots\(draft, (?:session|scene)\)/);
assert.match(source, /function validateQuantitySceneForAllStores\(draft, session\)/);

assert.match(source, /v4ScenarioKey/);
assert.match(source, /comboScenarioKeyFor/);
assert.match(source, /v4TargetCellKey/);
assert.match(source, /buffetSceneIdentity/);
assert.doesNotMatch(source, /periodValues[^\n]*buffetSceneIdentity/);

console.log("verify-buffet-fixed-period-scene-entry: PASS");
