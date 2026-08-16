import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(
  source,
  /batchSelectedTargetIds:\s*\[\]/,
  "编辑器应以空批量选择集合初始化",
);
assert.doesNotMatch(source, /batchMode/, "批量设置应常驻，不再保留可切换的批量模式状态");
assert.doesNotMatch(source, /data-toggle-batch|>批量设置<|>取消批量设置</, "产线配置不应再渲染批量设置切换按钮");
assert.doesNotMatch(source, /data-batch-cancel/, "批量常驻后不应保留取消批量设置入口");
assert.match(source, /function resetBatchSelection\(\)/, "应提供仅清空已选目标的助手");
assert.match(source, /function selectedBatchTargets\(draft\)/, "应按当前上下文解析有效已选目标");

assert.match(source, /data-batch-target-id=/, "批量模式应在目标行渲染复选框");
assert.match(source, /data-batch-select-all/, "批量模式应提供表头全选复选框");
assert.match(source, /data-batch-selected-count/, "批量操作条应显示已选数量");
assert.match(source, /data-batch-select-all-action/, "批量操作条应提供全选当前产线操作");
assert.match(source, /data-batch-clear/, "批量操作条应提供清空选择操作");

const applyBranch = source.match(/if \(button\.hasAttribute\("data-apply-batch"\)\)[\s\S]*?(?=\n\s*if \(button\.hasAttribute\("data-fix-step"\))/)?.[0];
assert.ok(applyBranch, "应能定位批量应用分支");
assert.match(applyBranch, /selectedBatchTargets\(draft\)/, "批量应用应取得当前上下文的有效已选目标");
assert.doesNotMatch(
  applyBranch,
  /targetsForLine\(draft,\s*draft\.activeLineId\)\.forEach/,
  "批量应用不应继续覆盖当前产线的全部目标",
);
assert.match(applyBranch, /resetBatchSelection\(\)/, "批量应用成功后应清空已选目标");

assert.match(
  source,
  /data-party-tab[\s\S]{0,240}resetBatchSelection\(\)/,
  "切换人数场景应清空批量选择",
);
assert.match(
  source,
  /data-round-tab[\s\S]{0,240}resetBatchSelection\(\)/,
  "切换轮次场景应清空批量选择",
);
assert.match(
  source,
  /data-line-tab[\s\S]{0,240}resetBatchSelection\(\)/,
  "切换产线应清空批量选择",
);
assert.match(
  source,
  /function goToEditorStep[\s\S]*?currentStep === 4[\s\S]*?resetBatchSelection\(\)/,
  "离开限购数量步骤应清空批量选择",
);

assert.match(source, /data-limit-target=/, "既有单行数量输入应保留");
assert.match(source, /data-apply-batch="value"/, "批量应用数量操作应保留");
assert.doesNotMatch(source, /data-apply-batch=["']zero["']|>设为禁止<|mode\s*!==\s*["']zero["']/, "批量设为禁止快捷入口和专用模式应移除");
assert.match(css, /\.olf-batch-select-cell/, "应提供紧凑的批量选择列样式");
assert.match(css, /\.olf-batch-toolbar/, "应提供可换行的批量操作条样式");

console.log("Menu order limit batch target selection verification passed");
