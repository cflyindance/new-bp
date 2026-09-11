import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sourcePath = new URL("../dist/emenu-pro/embedded-product-binding.js", import.meta.url);
const source = fs.readFileSync(sourcePath, "utf8");
const hooks = {};
let randomSeed = 0;

function makeNode() {
  return {
    className: "",
    textContent: "",
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild() {},
    remove() {},
    setAttribute() {},
    addEventListener() {},
    querySelector: () => null,
  };
}

const document = {
  documentElement: { classList: { contains: () => true } },
  readyState: "loading",
  body: { appendChild() {}, classList: { add() {}, remove() {} } },
  addEventListener() {},
  getElementById: () => null,
  querySelector: () => null,
  createElement: makeNode,
};

const context = {
  window: {
    __EMENU_PRODUCT_BINDING_TEST_HOOKS__: hooks,
    location: { href: "http://localhost/emenu-pro/" },
    setTimeout() {},
  },
  document,
  crypto: {
    getRandomValues(bytes) {
      randomSeed += 1;
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = index + randomSeed;
      return bytes;
    },
  },
  Uint8Array,
  URL,
  console,
};

vm.runInNewContext(source, context, { filename: "embedded-product-binding.js" });

assert.equal(typeof hooks.findExactBindingInstances, "function");
assert.equal(typeof hooks.createBlockInstance, "function");
assert.equal(typeof hooks.computeVerticalProductPositions, "function");
assert.equal(typeof hooks.toggleOrderedSelection, "function");

const page = {
  children: [
    { id: "dish-a-name", component: "DishName", props: { itemId: "101" } },
    { id: "dish-b-name", component: "DishName", props: { itemId: 202 } },
  ],
};
assert.deepEqual(
  Array.from(hooks.findExactBindingInstances(page, "DishName", "202"), (block) => block.id),
  ["dish-b-name"],
);
assert.equal(hooks.findExactBindingInstances(page, "DishName", "303").length, 0);
assert.equal(hooks.getBindingRows(page, "202").find((row) => row.type === "DishName").instance.id, "dish-b-name");

assert.deepEqual(Array.from(hooks.toggleOrderedSelection(["1", "2"], "1", false)), ["2"]);
assert.deepEqual(Array.from(hooks.toggleOrderedSelection(["2"], "1", true)), ["2", "1"]);

const positions = hooks.computeVerticalProductPositions("DishName", 3, {
  viewportWidth: 1280,
  viewportHeight: 800,
});
assert.equal(positions.length, 3);
assert.ok(positions[1].top > positions[0].top);
assert.equal(positions[0].left, positions[2].left);

const memberA = hooks.createBlockInstance(hooks.BLOCK_LIBRARY.MemberPrice, positions[0], "101");
const memberB = hooks.createBlockInstance(hooks.BLOCK_LIBRARY.MemberPrice, positions[1], "202");
const collectIds = (node) => [node.id, ...(node.children || []).flatMap(collectIds)];
const ids = [...collectIds(memberA), ...collectIds(memberB)];
assert.equal(new Set(ids).size, ids.length);
assert.equal(memberA.props.itemId, "101");
assert.equal(memberA.children[0].props.itemId, undefined);

assert.match(source, /组件绑定批量商品/);
assert.equal((source.match(/商品绑定批量组件/g) || []).length, 2);
assert.doesNotMatch(source, /批量添加商品组件/);
assert.match(source, /data-component-products-type/);
assert.match(source, /data-component-products-item/);
assert.match(source, /data-component-products-add/);
assert.match(source, /insertBefore\(btn,\s*existingBatchButton\)/);
assert.doesNotMatch(source, /var replaced\s*=/);
assert.doesNotMatch(source, /替换.*冲突组件/);

const runtime = {
  paletteSlice: {
    viewportWidth: 1280,
    viewportHeight: 800,
    currentPageData: {
      id: "page-1",
      groupId: 1,
      categoryId: 2,
      children: [{ id: "first", component: "DishName", props: { itemId: "101" } }],
    },
  },
  menuSlice: {
    menus: [{ menuGroups: [{ id: 1, name: "组", menuCategories: [{ id: 2, name: "分类", saleItems: [{ id: 101, name: "A" }, { id: 202, name: "B" }] }] }] }],
  },
};
const actions = [];
hooks.state.store = { getState: () => runtime, dispatch: (action) => actions.push(action) };
hooks.state.componentToProducts.pageId = "page-1";
hooks.state.componentToProducts.categoryKey = "1-2";
hooks.state.componentToProducts.selectedType = "DishName";
hooks.state.componentToProducts.selectedProductIds = ["101", "202"];
hooks.addComponentForProducts();
const pageWrites = actions.filter((action) => action.type === "paletteSlice/setCurrentPageData");
assert.equal(pageWrites.length, 1);
assert.equal(pageWrites[0].payload.children.length, 2);
assert.equal(pageWrites[0].payload.children[1].props.itemId, "202");

actions.length = 0;
runtime.paletteSlice.currentPageData = pageWrites[0].payload;
hooks.state.componentToProducts.selectedProductIds = ["101", "202"];
hooks.addComponentForProducts();
assert.equal(actions.filter((action) => action.type === "paletteSlice/setCurrentPageData").length, 0);

hooks.state.componentToProducts.selectedType = "SalePrice";
hooks.state.componentToProducts.selectedProductIds = ["202"];
runtime.paletteSlice.currentPageData = { ...runtime.paletteSlice.currentPageData, id: "page-2" };
assert.equal(hooks.syncComponentProductsContext(), true);
assert.equal(hooks.state.componentToProducts.selectedType, null);
assert.deepEqual(Array.from(hooks.state.componentToProducts.selectedProductIds), []);

console.log("eMenu component bulk product binding verification passed");
