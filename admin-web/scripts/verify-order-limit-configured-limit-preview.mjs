import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(source, /function createConfiguredLimitPreviewState\(\)/, "应提供已配置规则预览临时状态工厂");
assert.match(source, /configuredLimitPreview:\s*createConfiguredLimitPreviewState\(\)/, "编辑器初始化应挂载已配置规则预览状态");
assert.doesNotMatch(
  source.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "",
  /configuredLimitPreview/,
  "预览状态不得进入规则默认草稿",
);
assert.doesNotMatch(
  source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function ruleSummary)/)?.[0] ?? "",
  /configuredLimitPreview/,
  "预览状态不得进入兼容规则或发布快照",
);

assert.match(source, /function configuredLimitPreviewRows\(draft\)/, "应按 eachLimitCell 口径汇总全部限购单元格");
assert.match(
  source,
  /function configuredLimitPreviewRows\(draft\)[\s\S]*?eachLimitCell\(draft/,
  "行汇总应复用 eachLimitCell，避免跨门店串用商品范围",
);
const rowsFn = source.match(/function configuredLimitPreviewRows\(draft\)[\s\S]*?(?=\n\s*function [a-zA-Z]+)/)?.[0] ?? "";
assert.ok(rowsFn, "应能定位 configuredLimitPreviewRows");
assert.doesNotMatch(rowsFn, /if\s*\(\s*!cell\s*\|\|\s*!cell\.configured\s*\)\s*return/, "未配置单元格也应进入预览，便于核对");
assert.match(rowsFn, /configured:\s*configured/, "预览行应标记是否已配置");
assert.match(source, /function formatConfiguredLimitPreviewCount\(/, "应提供已配置/总数角标文案");
assert.match(source, /已配置 " \+ configured \+ " \/ 共 " \+ total|已配置 \$\{configured\} \/ 共 \$\{total\}/, "角标应为已配置 x / 共 y");
assert.match(source, /未配置/, "未配置数量应展示为未配置");
assert.match(source, /0（禁止）/, "数量 0 应展示为禁止文案");
assert.match(source, /查看已配置规则/, "步骤 4 应提供查看已配置规则入口文案");
assert.match(source, /formatConfiguredLimitPreviewCount\(previewRows\)|formatConfiguredLimitPreviewCount\(data\.rows\)/, "入口与弹层标题应使用核对角标");
assert.match(source, /is-unconfigured/, "未配置行应有可辨识样式标记");
assert.match(css, /\.olf-configured-limit-preview-value\.is-empty|tr\.is-unconfigured/, "应提供未配置行次要文字样式");
assert.match(
  source.match(/function configuredLimitPreviewRows\(draft\)[\s\S]*?(?=\n\s*function [a-zA-Z]+)/)?.[0] ?? "",
  /periodLabel\(draft\.period\)/,
  "非多轮时轮次列应展示统计周期文案（每轮/与轮次无关）",
);
assert.match(source, /function periodLabel\(value\)[\s\S]*?每轮[\s\S]*?与轮次无关/, "periodLabel 应覆盖每轮与与轮次无关");
assert.match(source, /data-configured-limit-preview-open/, "应提供打开预览入口标记");
assert.match(source, /data-configured-limit-preview-overlay/, "应提供独立预览遮罩");
assert.match(source, /data-configured-limit-preview-store/, "应提供门店筛选");
assert.match(source, /data-configured-limit-preview-party/, "应提供人数场景筛选");
assert.match(source, /data-configured-limit-preview-round/, "应提供轮次筛选标记");
assert.match(source, /data-configured-limit-preview-line/, "应提供产线筛选");
assert.match(source, /data-configured-limit-preview-status/, "应提供配置状态筛选");
assert.match(source, /configStatus/, "预览状态应保存配置状态筛选值");
assert.match(
  source,
  /function filteredConfiguredLimitPreviewRows[\s\S]*?configStatus === "configured"[\s\S]*?configStatus === "unconfigured"/,
  "筛选逻辑应按已配置/未配置过滤",
);
assert.match(source, /data-configured-limit-preview-search/, "应提供菜单搜索");
assert.match(source, /data-configured-limit-preview-page/, "应提供分页");
assert.match(source, /data-configured-limit-preview-page-size/, "应提供每页条数");
assert.match(source, /data-configured-limit-preview-close/, "应提供关闭入口");
const dialog = source.match(/function renderConfiguredLimitPreviewDialog[\s\S]*?(?=\n\s*function [a-zA-Z]+)/)?.[0];
assert.ok(dialog, "应能定位已配置规则预览弹层渲染函数");
assert.doesNotMatch(dialog, /data-configured-limit-preview-delete|contenteditable|type="number"/, "预览弹层必须只读，不得提供删除或数量编辑");

assert.match(source, /function openConfiguredLimitPreview\(\)/, "应提供打开预览函数");
assert.match(source, /function closeConfiguredLimitPreview\(\)/, "应提供关闭预览函数");
assert.match(
  source,
  /function goToEditorStep[\s\S]*?currentStep === 3[\s\S]*?closeConfiguredLimitPreview\(\)/,
  "离开限购数量步骤应关闭预览",
);
const escapeHandler = source.match(/event\.key !== "Escape"[\s\S]*?\n\s*\}\);/)?.[0] ?? "";
assert.ok(escapeHandler, "应存在 Esc 键处理逻辑");
assert.match(escapeHandler, /closeConfiguredLimitPreview\(\)/, "Esc 应可关闭预览");

assert.match(css, /\.olf-configured-limit-preview-filters|\.olf-selected-preview-filters/, "应提供预览筛选布局样式");
assert.match(css, /\.olf-configured-limit-preview-overlay|\.olf-selected-preview-overlay/, "应复用或扩展弹层遮罩样式");

console.log("Menu order limit configured rules preview verification passed");
