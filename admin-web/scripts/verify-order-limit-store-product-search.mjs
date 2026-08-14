import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const pickerPath = new URL("../dist/Configuration%20center/assets/brand-menu-structure-picker.js", import.meta.url);
const flowPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [pickerSource, flowSource, cssSource] = await Promise.all([
  readFile(pickerPath, "utf8"),
  readFile(flowPath, "utf8"),
  readFile(cssPath, "utf8"),
]);

const context = vm.createContext({ window: {} });
vm.runInContext(pickerSource, context, { filename: "brand-menu-structure-picker.js" });
const picker = context.window.BrandMenuStructurePicker;

assert.ok(picker, "应导出品牌菜单结构选择器");
for (const method of ["listAllDishes", "setNodeSelected", "isNodeSelected"]) {
  assert.equal(typeof picker[method], "function", `选择器应导出 ${method}`);
}

const allProducts = picker.listAllDishes();
assert.ok(allProducts.length > 0, "应能枚举全部产线商品");
assert.deepEqual(
  [...new Set(allProducts.map((item) => item.lineId))],
  ["kiosk", "emenu", "sdi"],
  "商品枚举应按既有顺序覆盖全部产线",
);
for (const product of allProducts) {
  for (const field of [
    "lineId", "lineLabel", "groupId", "groupName", "categoryId", "categoryName",
    "dishId", "dishName", "dishKey", "categoryKey",
  ]) {
    assert.ok(product[field], `商品结果应包含 ${field}`);
  }
}

const teaProducts = allProducts.filter((item) => item.dishName.includes("热茶"));
assert.ok(teaProducts.length >= 3, "同一基础商品应能跨产线命中");
assert.equal(
  new Set(teaProducts.map((item) => `${item.lineId}|${item.dishKey}`)).size,
  teaProducts.length,
  "同名商品应通过产线上下文保持独立",
);

const emptySelection = picker.emptyByLine();
const dishResult = allProducts.find((item) => item.lineId === "emenu");
const dishSelected = picker.setNodeSelected(emptySelection, dishResult.lineId, dishResult.dishKey, true);
assert.equal(picker.isNodeSelected(dishSelected, dishResult.lineId, dishResult.dishKey), true, "菜品选择应生效");
assert.equal(picker.isNodeSelected(emptySelection, dishResult.lineId, dishResult.dishKey), false, "选择不得原地修改输入");
assert.equal(dishSelected.kiosk.length, 0, "菜品选择不得影响其他产线");

const categoryResult = allProducts.find((item) => item.lineId === "kiosk" && item.categoryName === "肉类");
const categoryProducts = allProducts.filter(
  (item) => item.lineId === categoryResult.lineId && item.categoryKey === categoryResult.categoryKey,
);
const categorySelected = picker.setNodeSelected(emptySelection, categoryResult.lineId, categoryResult.categoryKey, true);
assert.equal(picker.isNodeSelected(categorySelected, categoryResult.lineId, categoryResult.categoryKey), true, "分类选择应生效");
for (const product of categoryProducts) {
  assert.equal(picker.isNodeSelected(categorySelected, product.lineId, product.dishKey), true, "分类选择应级联全部菜品");
}
const categoryRemoved = picker.setNodeSelected(categorySelected, categoryResult.lineId, categoryResult.categoryKey, false);
assert.equal(picker.isNodeSelected(categoryRemoved, categoryResult.lineId, categoryResult.categoryKey), false, "分类取消应生效");
for (const product of categoryProducts) {
  assert.equal(picker.isNodeSelected(categoryRemoved, product.lineId, product.dishKey), false, "分类取消应移除全部菜品");
}

const invalidSelection = picker.setNodeSelected(emptySelection, "missing-line", "d:missing", true);
assert.deepEqual(
  JSON.parse(JSON.stringify(invalidSelection)),
  JSON.parse(JSON.stringify(emptySelection)),
  "无效产线或节点不得写入悬空选择",
);
assert.equal(picker.isNodeSelected(emptySelection, "missing-line", "d:missing"), false, "无效节点不得视为已选");

for (const marker of [
  "data-product-search",
  "data-product-search-results",
  "data-product-search-target",
  "productSearchQuery",
  "已按分类加入",
  "当前门店全部产线中未找到相关商品",
  "applyActiveStoreStructure",
]) {
  assert.match(flowSource, new RegExp(marker), `商品配置流程应包含 ${marker}`);
}

const defaultDraft = flowSource.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "";
assert.doesNotMatch(defaultDraft, /productSearchQuery/, "搜索词不得进入规则默认草稿");
const compatibilityBuilder = flowSource.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function ruleSummary)/)?.[0] ?? "";
assert.doesNotMatch(compatibilityBuilder, /productSearchQuery/, "搜索词不得进入兼容规则或发布快照");

assert.match(flowSource, /data-config-store-select[\s\S]{0,800}clearProductSearch/, "切换配置门店应清空搜索词");
assert.match(flowSource, /compositionstart/, "搜索应处理输入法组合开始");
assert.match(flowSource, /compositionend/, "搜索应处理输入法组合结束");
assert.match(flowSource, /targetType === ["']category["'][\s\S]{0,300}categoryKey/, "分类限购应使用所属分类键");
assert.match(flowSource, /targetType === ["']dish["'][\s\S]{0,300}dishKey/, "菜品限购应使用具体菜品键");

for (const selector of [
  ".olf-product-search",
  ".olf-product-search-results",
  ".olf-product-search-row",
  ".olf-product-search-path",
  ".olf-product-search-category-state",
]) {
  assert.match(cssSource, new RegExp(selector.replace(".", "\\.")), `应提供 ${selector} 样式`);
}

console.log("Menu order limit store product search verification passed");
