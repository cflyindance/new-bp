import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(source, /sceneDisplayMode:\s*["']tile["']/, "编辑器默认场景展示应为组合平铺");
assert.match(source, /batchSelectedByScene:\s*\{\}/, "平铺批量勾选应按场景键隔离初始化");
assert.doesNotMatch(
  source.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "",
  /sceneDisplayMode|batchSelectedByScene/,
  "场景展示状态不得进入规则默认草稿",
);
assert.doesNotMatch(
  source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function ruleSummary)/)?.[0] ?? "",
  /sceneDisplayMode|batchSelectedByScene/,
  "场景展示状态不得进入兼容规则或发布快照",
);

assert.match(source, /function sceneKey\(partyIndex,\s*roundIndex\)/, "应提供场景键助手");
assert.match(source, /function sceneCombos\(draft\)/, "应按 party×round 生成组合列表");
assert.match(source, /function isSceneTileMode\(draft\)/, "应提供平铺模式判断");
assert.match(source, /function resetSceneDisplayMode\(\)/, "应提供离开步骤时重置展示模式");
assert.match(source, /function sceneComboCompletion\(/, "应提供块级完成度助手");

assert.match(source, /data-scene-display-mode/, "多轮应渲染场景展示分段控件");
assert.match(source, /组合平铺/, "分段文案应含组合平铺");
assert.match(source, /分开选择/, "分段文案应含分开选择");
assert.match(source, /data-scene-block=/, "平铺应渲染组合块标记");
assert.match(source, /data-scene-party=/, "块/控件应显式携带人数索引");
assert.match(source, /data-scene-round=/, "块/控件应显式携带轮次索引");
assert.match(source, /data-scene-batch-target-id|data-batch-target-id=[\s\S]*data-scene-party/, "平铺批量勾选应绑定场景");
assert.match(source, /data-scene-apply-batch|data-apply-batch=[\s\S]*data-scene-party/, "平铺批量应用应绑定场景");
assert.match(source, /data-limit-target=[\s\S]*data-scene-party|data-scene-limit-target/, "平铺数量输入应绑定场景");

const leaveStep = source.match(/function goToEditorStep[\s\S]*?(?=\n\s*function handleEditorClick)/)?.[0] ?? "";
assert.match(leaveStep, /currentStep === 4[\s\S]*?resetSceneDisplayMode\(\)/, "离开步骤 4 应重置为平铺");
assert.match(leaveStep, /currentStep === 4[\s\S]*?resetBatchSelection\(\)/, "离开步骤 4 应清空批量勾选");

assert.match(
  source,
  /data-scene-display-mode[\s\S]{0,400}resetBatchSelection|resetBatchSelection[\s\S]{0,400}sceneDisplayMode/,
  "切换展示模式应清空勾选",
);

assert.match(css, /\.olf-scene-display-toggle|\.olf-segmented/, "应提供场景展示分段样式");
assert.match(css, /\.olf-scene-combo-block/, "应提供组合块样式");

console.log("Menu order limit scene combo tile verification passed");
