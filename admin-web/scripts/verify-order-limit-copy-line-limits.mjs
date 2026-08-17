import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(source, /function createLineLimitCopyState\(\)/, "应提供复制弹层临时状态工厂");
assert.match(source, /lineLimitCopy:\s*createLineLimitCopyState\(\)/, "编辑器初始化应挂载 lineLimitCopy");
assert.doesNotMatch(
  source.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "",
  /lineLimitCopy/,
  "复制状态不得进入规则默认草稿",
);
assert.doesNotMatch(
  source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function ruleSummary)/)?.[0] ?? "",
  /lineLimitCopy/,
  "复制状态不得进入兼容规则或发布快照",
);

assert.match(source, /function lineHasConfiguredLimits\(/, "应判断源产线是否有已配置格");
assert.match(source, /function copyLineLimitCandidateLines\(/, "应列出可勾选目标产线");
assert.match(source, /function estimateLineLimitCopy\(/, "应提供对齐/跳过摘要计数");
assert.match(source, /function applyLineLimitCopy\(/, "应提供按 key 覆盖写入助手");

const applyFn = source.match(/function applyLineLimitCopy\([\s\S]*?(?=\n\s*function [a-zA-Z])/)?.[0] ?? "";
assert.match(applyFn, /activeStoreConfig\(draft\)/, "写入应针对当前门店 config");
assert.match(applyFn, /configured:\s*false,\s*value:\s*null/, "源未配置应对齐写成未配置");
assert.match(applyFn, /target\.key|sourceTarget\.key|\.key\b/, "应按菜单 key 对齐");
assert.match(applyFn, /limitKey\(/, "应写入 limitKey");

assert.match(source, /复制到其他产线/, "步骤 4 应有入口文案");
assert.match(source, /data-line-limit-copy-open/, "应有打开入口标记");
assert.match(source, /data-line-limit-copy-overlay/, "应有弹层遮罩标记");
assert.match(source, /data-line-limit-copy-target/, "应有目标产线勾选标记");
assert.match(source, /data-line-limit-copy-apply/, "应有覆盖复制按钮");
assert.match(source, /data-line-limit-copy-close/, "应有关闭入口");

assert.match(source, /function openLineLimitCopy\(/, "应提供打开函数");
assert.match(source, /function closeLineLimitCopy\(/, "应提供关闭函数");
assert.match(
  source,
  /function goToEditorStep[\s\S]*?currentStep === 4[\s\S]*?closeLineLimitCopy\(\)/,
  "离开步骤 4 应关闭复制弹层",
);
const escapeHandler = source.match(/event\.key !== "Escape"[\s\S]*?\n\s*\}\);/)?.[0] ?? "";
assert.ok(escapeHandler, "应存在 Esc 键处理逻辑");
assert.match(escapeHandler, /closeLineLimitCopy\(\)/, "Esc 应可关闭");

assert.match(css, /\.olf-line-limit-copy|\.olf-selected-preview-dialog/, "应提供或复用弹层样式");

console.log("Menu order limit copy line limits verification passed");
