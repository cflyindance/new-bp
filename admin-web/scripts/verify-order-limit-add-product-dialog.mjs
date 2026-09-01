import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(source, /function createProductAddDialogState\(/, "应提供添加商品弹层状态工厂");
assert.match(source, /productAddDialog:\s*createProductAddDialogState\(\)/, "编辑器初始化应挂载 productAddDialog");
assert.doesNotMatch(
  source.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "",
  /productAddDialog/,
  "添加商品弹层状态不得进入默认草稿",
);
assert.doesNotMatch(
  source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function toast)/)?.[0] ?? "",
  /productAddDialog/,
  "添加商品弹层状态不得进入兼容规则或发布快照",
);

assert.match(source, /function openProductAddDialog\(/, "应提供打开函数");
assert.match(source, /function closeProductAddDialog\(/, "应提供关闭函数");
assert.match(source, /function submitProductAddDialog\(/, "应提供提交函数");
assert.match(source, /function renderProductAddDialog\(/, "应渲染添加商品弹层");

const openFn = source.match(/function openProductAddDialog\([\s\S]*?(?=\n\s*function [a-zA-Z])/)?.[0] ?? "";
assert.match(
  openFn,
  /isAvailableStoreId\(draft\.activeStoreId\)[\s\S]*?stores\[0\]/,
  "打开弹层无有效活动门店时应默认选中门店列表首店",
);
assert.match(openFn, /if \(storeId\) draft\.activeStoreId = storeId/, "打开弹层默认门店应同步 activeStoreId");

assert.match(source, /data-product-add-open/, "主区应有添加商品入口");
assert.match(source, /data-product-add-overlay/, "应有弹层遮罩标记");
assert.match(source, /data-product-add-submit/, "应有提交按钮标记");
assert.match(source, /data-product-add-cancel|data-product-add-close/, "应有取消/关闭标记");
assert.match(source, /data-product-add-store-select/, "弹层内应有门店下拉标记");
assert.doesNotMatch(source, /data-product-add-store-id/, "门店卡片不应重复提供添加商品入口");

const mergedStep = source.match(/function renderStepFour\(draft\)[\s\S]*?(?=\n\s*function renderStepFive)/)?.[0] ?? "";
assert.match(mergedStep, /data-product-add-open/, "限购数量主区应渲染添加商品入口");
assert.doesNotMatch(mergedStep, /data-config-store-select|data-limit-store-select/, "合并主区不得再渲染单一门店下拉");
assert.doesNotMatch(mergedStep, /data-brand-menu-structure-picker|data-product-search-surface/, "选品矩阵与搜索应继续只存在于弹层");

const commitFn = source.match(/function commitProductAddDialog\([\s\S]*?(?=\n\s*function [a-zA-Z])/)?.[0] ?? "";
assert.match(commitFn, /applyStoreStructure\(/, "提交应调用按门店权威写入");

assert.match(
  source,
  /productAddDialog\.open[\s\S]{0,400}structureByLine/,
  "弹层打开时结构变更应写入草稿",
);

assert.match(css, /\.olf-product-add-dialog|\.olf-product-add-overlay/, "应提供添加商品弹层样式");

console.log("Menu order limit add product dialog verification passed");
