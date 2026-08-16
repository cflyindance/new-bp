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

assert.match(source, /function configuredLimitPreviewRows\(draft\)/, "应按 eachLimitCell 口径汇总已配置行");
assert.match(
  source,
  /function configuredLimitPreviewRows\(draft\)[\s\S]*?eachLimitCell\(draft/,
  "行汇总应复用 eachLimitCell，避免跨门店串用商品范围",
);
const rowsFn = source.match(/function configuredLimitPreviewRows\(draft\)[\s\S]*?(?=\n\s*function [a-zA-Z]+)/)?.[0] ?? "";
assert.ok(rowsFn, "应能定位 configuredLimitPreviewRows");
assert.match(rowsFn, /!cell\.configured|cell\.configured|configured\s*===\s*true/, "仅 configured===true 的单元格进入预览");
assert.match(source, /0（禁止）/, "数量 0 应展示为禁止文案");
assert.match(source, /查看已配置规则/, "步骤 4 应提供查看已配置规则入口文案");
assert.match(source, /data-configured-limit-preview-open/, "应提供打开预览入口标记");
assert.match(source, /data-configured-limit-preview-overlay/, "应提供独立预览遮罩");
assert.match(source, /data-configured-limit-preview-store/, "应提供门店筛选");
assert.match(source, /data-configured-limit-preview-party/, "应提供人数场景筛选");
assert.match(source, /data-configured-limit-preview-round/, "应提供轮次筛选标记");
assert.match(source, /data-configured-limit-preview-line/, "应提供产线筛选");
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
  /function goToEditorStep[\s\S]*?currentStep === 4[\s\S]*?closeConfiguredLimitPreview\(\)/,
  "离开限购数量步骤应关闭预览",
);
assert.match(source, /Escape[\s\S]{0,200}closeConfiguredLimitPreview|closeConfiguredLimitPreview[\s\S]{0,200}Escape/, "Esc 应可关闭预览");

assert.match(css, /\.olf-configured-limit-preview-filters|\.olf-selected-preview-filters/, "应提供预览筛选布局样式");
assert.match(css, /\.olf-configured-limit-preview-overlay|\.olf-selected-preview-overlay/, "应复用或扩展弹层遮罩样式");

console.log("Menu order limit configured rules preview verification passed");
