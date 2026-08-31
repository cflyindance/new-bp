import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("dist/Configuration center/assets/buffet-rule-domain.js", "utf8");
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const domain = sandbox.window.BuffetRuleDomain;

const base = {
  status: "active",
  subject: "order",
  period: "order_lifetime",
  targetType: "dish_set",
  deployStoreIds: ["store-a"],
  conditions: { activityCycle: "daily" },
  storeConfigs: { "store-a": { dishSetMembers: [], dishSetLimits: { "0|0": { configured: true, value: 5 } } } }
};
const left = structuredClone(base);
left.storeConfigs["store-a"].dishSetMembers = [{ productLineId: "kiosk", dishId: "a" }, { productLineId: "emenu", dishId: "b" }];
const right = structuredClone(base);
right.id = 2;
right.storeConfigs["store-a"].dishSetMembers = [{ productLineId: "kiosk", dishId: "a" }, { productLineId: "emenu", dishId: "c" }];
if (!domain.findConflict(left, [right])) throw new Error("overlapping dish sets must conflict");

const result = domain.evaluateBatch({
  operationId: "op-1",
  context: { orderMode: "buffet", buffetSessionId: "session-1", storeId: "store-a", orderId: "order-1", partySize: 2 },
  rules: [{ ...left, id: 1, version: 1 }],
  usedByRule: { 1: 2 },
  items: [
    { productLineId: "kiosk", dishId: "a", quantity: 2 },
    { productLineId: "emenu", dishId: "b", quantity: 2 },
    { productLineId: "kiosk", dishId: "outside", quantity: 99 }
  ]
});
if (result.allowed || result.violations[0].increment !== 4) throw new Error("dish set quantities must aggregate across lines");

console.log("verify-buffet-dish-set-domain: OK");
