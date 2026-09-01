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
  "data-product-add-search",
  "data-product-search-results",
  "data-product-search-target",
  "productAddDialog",
  "已按分类加入",
  "当前门店全部产线中未找到相关商品",
  "applyStoreStructure",
]) {
  assert.match(flowSource, new RegExp(marker), `商品配置流程应包含 ${marker}`);
}

const defaultDraft = flowSource.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "";
assert.doesNotMatch(defaultDraft, /productAddDialog|productSearchQuery/, "搜索词与弹层状态不得进入规则默认草稿");
const compatibilityBuilder = flowSource.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function toast)/)?.[0] ?? "";
assert.doesNotMatch(compatibilityBuilder, /productAddDialog|productSearchQuery/, "搜索词与弹层状态不得进入兼容规则或发布快照");

assert.match(flowSource, /function switchProductAddStore\([\s\S]*?query:\s*""|query\s*=\s*""/, "切换弹层门店应清空搜索词");
assert.match(flowSource, /data-product-add-store-select[\s\S]{0,900}clearProductPickerNav|switchProductAddStore[\s\S]{0,500}clearProductPickerNav/, "切换弹层门店应清空产线导航记忆");
assert.match(
  flowSource,
  /olf-store-search-row[\s\S]{0,800}data-product-add-store-select/,
  "参与门店应位于弹层搜索行内",
);
assert.match(
  flowSource,
  /data-product-add-search[\s\S]{0,1200}data-product-add-store-select|data-product-add-store-select[\s\S]{0,1200}data-product-add-search/,
  "搜索商品应与参与门店同处添加商品弹层",
);
assert.match(
  flowSource,
  /data-product-add-search[\s\S]{0,500}data-product-search-surface|renderProductAddDialog[\s\S]{0,1200}data-product-search-surface/,
  "已选门店时应在弹层渲染搜索表面",
);
assert.match(cssSource, /\.olf-store-search-row/, "应提供门店与搜索同一行布局样式");
assert.match(flowSource, /productPickerActiveLineId/, "应记住商品选择器当前产线");
assert.match(flowSource, /MenuPicker\.renderHtml\([\s\S]{0,120}nav\.lineId/, "重绘菜单树应恢复记住的产线");
assert.match(flowSource, /brand-menu-structure-nav/, "产线切换应同步导航记忆");
assert.match(flowSource, /data-product-search-target[\s\S]{0,1200}rememberProductPickerNav/, "搜索勾选商品应记住对应产线");
assert.match(pickerSource, /brand-menu-structure-nav/, "选择器导航变更应派发 nav 事件");
assert.match(pickerSource, /activeLine:\s*activeLine/, "选择变更事件应携带当前产线");
assert.match(flowSource, /compositionstart/, "搜索应处理输入法组合开始");
assert.match(flowSource, /compositionend/, "搜索应处理输入法组合结束");
assert.match(flowSource, /targetType === ["']category["'][\s\S]{0,300}categoryKey/, "分类限购应使用所属分类键");
assert.match(flowSource, /targetType === ["']dish["'][\s\S]{0,300}dishKey/, "菜品限购应使用具体菜品键");
assert.match(flowSource, /function renderProductSearchResults\(draft,\s*config,\s*queryOverride\)/, "搜索结果渲染应接受 queryOverride");
assert.match(pickerSource, /\/api\/v1\/emenu-local\/menu-catalog/, "选择器应请求主机菜单目录");
assert.match(pickerSource, /loadAllLineCatalogs/, "绑定选择器时应拉取各产线菜单");
assert.match(flowSource, /brand-menu-catalog-ready/, "菜单加载完成后应刷新搜索表面");
assert.match(cssSource, /\.bmsp-notice/, "应提供菜单来源提示样式");
assert.equal(typeof picker.applyCatalogResult, "function", "应导出 catalog 注入接口");
assert.equal(typeof picker.mergeKeysOutsideTree, "function", "应导出树外勾选合并");

const liveTree = [
  {
    id: "g-host",
    name: "主机组",
    categories: [
      {
        id: "c-host",
        name: "主机类",
        dishes: [{ id: "d-host", name: "主机菜" }],
      },
    ],
  },
];
picker.applyCatalogResult("kiosk", { tree: liveTree, source: "live" });
const liveProducts = picker.listAllDishes();
assert.ok(
  liveProducts.some((item) => item.lineId === "kiosk" && item.dishName === "主机菜"),
  "live catalog 应替换 Kiosk 静态树",
);
assert.equal(
  liveProducts.filter((item) => item.lineId === "kiosk" && item.dishName.includes("（Kiosk）")).length,
  0,
  "live catalog 后不应再枚举 Kiosk 静态菜",
);
assert.ok(
  liveProducts.some((item) => item.lineId === "emenu" && item.dishName.includes("（eMenu）")),
  "未注入的产线仍用静态树",
);

const hostDishKey = "d:g-host:c-host:d-host";
const outsideKey = "d:old-group:old-cat:old-dish";
const withOutside = picker.setNodeSelected(
  { kiosk: [outsideKey], emenu: [], sdi: [] },
  "kiosk",
  hostDishKey,
  true,
);
assert.ok(withOutside.kiosk.includes(outsideKey), "当前树没有的旧勾选应保留");
assert.ok(withOutside.kiosk.includes(hostDishKey), "主机菜单勾选应写入");

picker.clearCatalogResults();
assert.ok(
  picker.listAllDishes().some((item) => item.lineId === "kiosk" && item.dishName.includes("（Kiosk）")),
  "清除 catalog 后应恢复静态树",
);

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
