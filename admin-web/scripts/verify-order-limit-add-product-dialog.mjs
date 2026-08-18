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

const stepTwo = source.match(/function renderStepTwo\(draft\)[\s\S]*?(?=\n\s*function renderSelectedPreviewDialog|function renderProductAddDialog)/)?.[0] ?? "";
assert.match(stepTwo, /data-product-add-open/, "步骤 2 主区应渲染添加商品入口");
assert.match(stepTwo, />参与商品</, "步骤 2 主区标题应为参与商品");
assert.match(
  stepTwo,
  /selectedProductHeading[\s\S]*?参与商品[\s\S]*?olf-line-limit-head-actions[\s\S]*?data-product-add-open[\s\S]*?data-selected-preview-open/,
  "添加商品与查看已选商品应排在参与商品标题下方",
);
assert.match(css, /\.olf-section-head--stack/, "应提供标题与操作区纵向堆叠样式");
assert.doesNotMatch(stepTwo, /structureSummary|olf-structure-summary/, "步骤 2 主区不得再展示选品摘要");
assert.doesNotMatch(stepTwo, /请通过添加商品为各门店配置限购对象/, "步骤 2 主区不得再展示添加商品引导文案");
assert.doesNotMatch(stepTwo, /data-config-store-select/, "步骤 2 主区不得再渲染参与门店下拉");
assert.doesNotMatch(stepTwo, /data-brand-menu-structure-picker|data-product-search-surface/, "步骤 2 主区不得再内联矩阵/搜索表面");
assert.doesNotMatch(stepTwo, /data-product-search[^\-]/, "步骤 2 主区不得再渲染搜索输入");

const submitFn = source.match(/function submitProductAddDialog\([\s\S]*?(?=\n\s*function [a-zA-Z])/)?.[0] ?? "";
assert.match(submitFn, /applyStoreStructure\(/, "提交应调用按门店权威写入");

assert.match(
  source,
  /productAddDialog\.open[\s\S]{0,400}structureByLine/,
  "弹层打开时结构变更应写入草稿",
);

assert.match(css, /\.olf-product-add-dialog|\.olf-product-add-overlay/, "应提供添加商品弹层样式");

console.log("Menu order limit add product dialog verification passed");
