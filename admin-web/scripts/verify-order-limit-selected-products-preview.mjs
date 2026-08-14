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
assert.equal(typeof picker.listSelectedTargets, "function", "应导出已选实际目标枚举");

const empty = picker.emptyByLine();
assert.deepEqual(
  JSON.parse(JSON.stringify(picker.listSelectedTargets(empty, "dish"))),
  [],
  "空结构不应产生菜品预览行",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(picker.listSelectedTargets(empty, "category"))),
  [],
  "空结构不应产生分类预览行",
);

const allProducts = picker.listAllDishes();
const kioskHotProducts = allProducts.filter(
  (item) => item.lineId === "kiosk" && item.categoryName === "热饮",
);
assert.equal(kioskHotProducts.length, 2, "测试数据应包含 Kiosk 热饮分类的两个菜品");

let dishSelection = empty;
for (const product of kioskHotProducts) {
  dishSelection = picker.setNodeSelected(dishSelection, product.lineId, product.dishKey, true);
}
const dishTargets = picker.listSelectedTargets(dishSelection, "dish");
assert.equal(dishTargets.length, 2, "菜品模式应逐个输出已选菜品");
for (const target of dishTargets) {
  for (const field of [
    "lineId", "lineLabel", "groupId", "groupName", "categoryId", "categoryName",
    "targetKey", "targetType", "dishId", "dishName", "dishCount",
  ]) {
    assert.notEqual(target[field], undefined, `菜品目标应包含 ${field}`);
  }
  assert.equal(target.targetType, "dish", "菜品目标类型应正确");
  assert.equal(target.dishCount, 1, "菜品目标包含数量应为 1");
}

const partialCategorySelection = picker.setNodeSelected(empty, kioskHotProducts[0].lineId, kioskHotProducts[0].dishKey, true);
assert.equal(
  picker.listSelectedTargets(partialCategorySelection, "category").length,
  0,
  "分类模式不应把部分选中的分类输出为实际目标",
);

const categorySelection = picker.setNodeSelected(
  empty,
  kioskHotProducts[0].lineId,
  kioskHotProducts[0].categoryKey,
  true,
);
const categoryTargets = picker.listSelectedTargets(categorySelection, "category");
assert.equal(categoryTargets.length, 1, "完整已选分类应只产生一行");
assert.equal(categoryTargets[0].targetType, "category", "分类目标类型应正确");
assert.equal(categoryTargets[0].targetKey, kioskHotProducts[0].categoryKey, "分类目标键应稳定");
assert.equal(categoryTargets[0].dishCount, 2, "分类目标应包含分类菜品数量");
assert.equal(categoryTargets[0].dishId, "", "分类目标不应伪造菜品 ID");
assert.equal(categoryTargets[0].dishName, "", "分类目标不应伪造菜品名称");

const emenuHotProduct = allProducts.find(
  (item) => item.lineId === "emenu" && item.categoryName === "热饮",
);
const crossLineSelection = picker.setNodeSelected(
  categorySelection,
  emenuHotProduct.lineId,
  emenuHotProduct.categoryKey,
  true,
);
assert.deepEqual(
  JSON.parse(JSON.stringify(picker.listSelectedTargets(crossLineSelection, "category").map((item) => item.lineId))),
  ["kiosk", "emenu"],
  "分类目标应按既有产线顺序输出并保持跨产线独立",
);

for (const marker of [
  "createSelectedPreviewState",
  "selectedPreviewRows",
  "selectedPreviewLineOptions",
  "filteredSelectedPreviewRows",
  "pagedSelectedPreviewRows",
  "normalizeSelectedPreviewState",
  "applyStoreStructure",
  "applySelectedPreviewDeletion",
  "data-selected-preview-open",
  "data-selected-preview-overlay",
  "data-selected-preview-store",
  "data-selected-preview-line",
  "data-selected-preview-page-size",
  "data-selected-preview-select-all",
  "data-selected-preview-row",
  "data-selected-preview-delete",
  "不受当前筛选条件限制",
]) {
  assert.match(flowSource, new RegExp(marker), `已选商品预览流程应包含 ${marker}`);
}

assert.match(flowSource, /pageSize:\s*10/, "预览默认每页应为 10 条");
for (const size of [10, 20, 50]) {
  assert.match(flowSource, new RegExp(`(?:value=["']${size}["']|${size}\\s*条)`), `应支持每页 ${size} 条`);
}

const defaultDraft = flowSource.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "";
assert.doesNotMatch(defaultDraft, /selectedPreview/, "预览状态不得进入规则默认草稿");
const compatibilityBuilder = flowSource.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function ruleSummary)/)?.[0] ?? "";
assert.doesNotMatch(compatibilityBuilder, /selectedPreview/, "预览状态不得进入兼容输出或发布快照");

const deleteRequest = flowSource.match(/function selectedPreviewDeleteRequest\([\s\S]*?(?=\n\s*function )/)?.[0] ?? "";
assert.match(deleteRequest, /selectedPreviewRows\(draft\)/, "全部删除应从权威全量预览行生成");
assert.doesNotMatch(deleteRequest, /filteredSelectedPreviewRows/, "全部删除不得受当前筛选结果限制");

for (const selector of [
  ".olf-selected-preview-entry",
  ".olf-selected-preview-overlay",
  ".olf-selected-preview-dialog",
  ".olf-selected-preview-toolbar",
  ".olf-selected-preview-filters",
  ".olf-selected-preview-table-wrap",
  ".olf-selected-preview-pagination",
  ".olf-selected-preview-empty",
]) {
  assert.match(cssSource, new RegExp(selector.replace(".", "\\.")), `应提供 ${selector} 样式`);
}

console.log("Menu order limit selected product preview verification passed");
