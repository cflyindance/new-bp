import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const start = flow.indexOf("  function expandDishSetDefaultLimit(");
const end = flow.indexOf("  function renderBuffetDishSetTableRows(", start);
assert.ok(start >= 0 && end > start);
let dirty = 0;
const dishes = [{ productLineId: "kiosk", dishId: "a", name: "牛肉" }, { productLineId: "emenu", dishId: "b", name: "五花肉" }];
const context = {
  eligibleExceptionDishes: () => dishes,
  v4ExceptionRows: (values, scenario) => values.exceptionDishLimits[scenario] || [],
  v4ExceptionDish: row => row.dishes[0],
  v4MenuIdentity: dish => `${dish.productLineId}|${dish.dishId}`,
  cloneValue: value => JSON.parse(JSON.stringify(value)),
  markEditorDirty: () => { dirty++; }
};
vm.createContext(context);
vm.runInContext(flow.slice(start, end), context);
const values = {
  defaultDishLimits: { scene: { configured: true, value: 2 } },
  exceptionDishLimits: { scene: [{ dishes: [dishes[1]], limit: { configured: true, value: 4 } }] },
  totalBounds: { scene: { maxConfigured: true, max: 8 } }
};
context.expandDishSetDefaultLimit({ activeStoreId: "store" }, values, "scene");
assert.equal(values.defaultDishLimits.scene, undefined);
assert.equal(values.exceptionDishLimits.scene.find(row => row.dishes[0].dishId === "a").limit.value, 2);
assert.equal(values.exceptionDishLimits.scene.find(row => row.dishes[0].dishId === "b").limit.value, 4);
assert.equal(values.totalBounds.scene.max, 8);
assert.equal(dirty, 1);
context.expandDishSetDefaultLimit({}, values, "scene");
assert.equal(dirty, 1, "重复渲染不重复迁移");
dishes.push({ productLineId: "kiosk", dishId: "c", name: "羊肉" });
context.expandDishSetDefaultLimit({}, values, "scene");
assert.equal(values.exceptionDishLimits.scene.length, 2, "新商品不继承默认上限");
const zero = { defaultDishLimits: { scene: { configured: true, value: 0 } }, exceptionDishLimits: {} };
context.expandDishSetDefaultLimit({}, zero, "scene");
assert.ok(zero.exceptionDishLimits.scene.every(row => row.limit.configured && row.limit.value === 0));
assert.match(flow, /data-v4-member-limit/);
assert.match(flow, /allowed\.sameDish && draft\.targetType !== "dish_set"/);
console.log("verify-buffet-member-inline-limits: PASS");
