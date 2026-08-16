import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const source = await readFile(jsPath, "utf8");

const stepFour = source.match(/function renderStepFour\(draft\)[\s\S]*?(?=\n\s*function renderStepFive)/)?.[0] ?? "";
assert.ok(stepFour.length > 200, "应能定位 renderStepFour");

const returnJoin = stepFour.match(/return '<div class="olf-content-head"[\s\S]*/)?.[0] ?? stepFour;

assert.doesNotMatch(
  returnJoin,
  /storeOptions[\s\S]{0,80}sceneToggle/,
  "场景展示分段不得拼在门店下拉同一段落优先于产线",
);
assert.doesNotMatch(
  returnJoin,
  /sceneToggle \+ sceneTabsHtml/,
  "sceneTabsHtml 不得与 sceneToggle 无间隙地拼成旧门店区结构",
);

const lineSectionPos = returnJoin.indexOf("lineTabs");
const sceneTogglePos = returnJoin.indexOf("sceneToggle");
const sceneTabsPos = returnJoin.indexOf("sceneTabsHtml");
assert.ok(lineSectionPos >= 0, "return 拼装应包含 lineTabs");
assert.ok(sceneTogglePos >= 0, "return 拼装应包含 sceneToggle");
assert.ok(sceneTabsPos >= 0, "return 拼装应包含 sceneTabsHtml（分开选择/非多轮）");
assert.ok(lineSectionPos < sceneTogglePos, "产线 Tab 应先于场景展示分段");
assert.ok(sceneTogglePos < sceneTabsPos, "场景展示分段应先于人数/轮次场景区");

assert.match(
  returnJoin,
  /sceneTabsHtml \+ matrixSection|sceneTabsHtml\s*\+\s*matrixSection/,
  "人数/轮次场景应位于矩阵之前",
);

assert.match(stepFour, /isSceneTileMode|tileMode/, "应保留组合平铺分支");
assert.match(stepFour, /data-scene-block|renderSceneComboBlocks/, "平铺仍渲染组合块");

console.log("Menu order limit line-first scenes verification passed");
