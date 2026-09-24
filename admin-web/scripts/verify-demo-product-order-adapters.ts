import type { EnterpriseMerchantSnapshot } from "../src/config/enterprise-merchant-types";
import { generateDemoScenario } from "../src/demo-scenario/demo-scenario-generator";
import { listDemoStoreProducts, readDemoStoreMenu } from "../src/demo-scenario/adapters/product-demo-adapter";
import { listDemoOrders, readDemoOrder } from "../src/demo-scenario/adapters/order-demo-adapter";

const snapshot = { merchants: [{ merchantId: "brand-a", groupId: "g", name: "测试品牌", timezone: "Asia/Shanghai" }], stores: [{ storeId: "a1", merchantId: "brand-a", name: "一店", status: "open" }, { storeId: "a2", merchantId: "brand-a", name: "二店", status: "open" }] } as unknown as EnterpriseMerchantSnapshot;
const scenario = generateDemoScenario({ snapshot, scenarioId: "adapters", scenarioVersion: 1, anchorDate: "2026-09-24" });
const a1 = { groupId: "g", brandIds: ["brand-a"], storeIds: ["a1"] };
const a2 = { groupId: "g", brandIds: ["brand-a"], storeIds: ["a2"] };
if (!listDemoStoreProducts(scenario, a1).length || readDemoStoreMenu(scenario, a2).some((item) => !item.enabled)) throw new Error("product adapter failed");
const orders = listDemoOrders(scenario, a1);
if (!orders.length || orders.some((order) => order.storeId !== "a1")) throw new Error("order scope failed");
const order = orders[0];
if (!order.payments.length || order.payments.reduce((sum, item) => sum + item.amountMinor, 0) !== order.payableMinor) throw new Error("payment projection failed");
if (readDemoOrder(scenario, order.orderId, a2) !== null) throw new Error("out-of-scope order leaked");
console.log("demo product/order adapters: ok");
