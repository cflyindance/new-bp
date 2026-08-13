import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(
  source,
  /batchMode:\s*false,\s*batchSelectedTargetIds:\s*\[\]/,
  "编辑器应以关闭批量模式和空选择集合初始化",
);
assert.match(source, /function clearBatchSelection\(\)/, "应提供统一的批量选择清理函数");
assert.match(source, /function selectedBatchTargets\(draft\)/, "应按当前上下文解析有效已选目标");

assert.match(source, /data-batch-target-id=/, "批量模式应在目标行渲染复选框");
assert.match(source, /data-batch-select-all/, "批量模式应提供表头全选复选框");
assert.match(source, /data-batch-selected-count/, "批量操作条应显示已选数量");
assert.match(source, /data-batch-select-all-action/, "批量操作条应提供全选当前产线操作");
assert.match(source, /data-batch-clear/, "批量操作条应提供清空选择操作");
assert.match(source, /data-batch-cancel/, "批量模式应提供明确的取消操作");

const applyBranch = source.match(
  /if \(button\.hasAttribute\("data-apply-batch"\)\)[\s\S]*?(?=\n\s*if \(button\.hasAttribute\("data-set-unlimited"\))/,
)?.[0];
assert.ok(applyBranch, "应能定位批量应用分支");
assert.match(applyBranch, /selectedBatchTargets\(draft\)/, "批量应用应取得当前上下文的有效已选目标");
assert.doesNotMatch(
  applyBranch,
  /targetsForLine\(draft,\s*draft\.activeLineId\)\.forEach/,
  "批量应用不应继续覆盖当前产线的全部目标",
);
assert.match(applyBranch, /clearBatchSelection\(\)/, "批量应用成功后应退出并清空选择");

assert.match(
  source,
  /data-party-tab[\s\S]{0,240}clearBatchSelection\(\)/,
  "切换人数场景应清空批量选择",
);
assert.match(
  source,
  /data-round-tab[\s\S]{0,240}clearBatchSelection\(\)/,
  "切换轮次场景应清空批量选择",
);
assert.match(
  source,
  /data-line-tab[\s\S]{0,240}clearBatchSelection\(\)/,
  "切换产线应清空批量选择",
);
assert.match(
  source,
  /function goToEditorStep[\s\S]*?currentStep === 4[\s\S]*?clearBatchSelection\(\)/,
  "离开限购数量步骤应清空批量选择",
);
assert.match(
  source,
  /data-batch-cancel[\s\S]{0,180}clearBatchSelection\(\)/,
  "取消批量设置应清空选择",
);

assert.match(source, /data-limit-target=/, "既有单行数量输入应保留");
assert.match(source, /data-set-unlimited=/, "既有单行不限制操作应保留");
assert.match(css, /\.olf-batch-select-cell/, "应提供紧凑的批量选择列样式");
assert.match(css, /\.olf-batch-toolbar/, "应提供可换行的批量操作条样式");

console.log("Menu order limit batch target selection verification passed");
