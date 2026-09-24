import type { EnterpriseMerchantSnapshot } from "../src/config/enterprise-merchant-types";
import { generateDemoScenario } from "../src/demo-scenario/demo-scenario-generator";
import { validateDemoScenario } from "../src/demo-scenario/demo-scenario-validation";

const snapshot = { merchants: [{ merchantId: "brand-a", groupId: "group-a", name: "测试品牌", timezone: "Asia/Shanghai" }], stores: [{ storeId: "store-a", merchantId: "brand-a", name: "测试门店", status: "open" }] } as unknown as EnterpriseMerchantSnapshot;
const scenario = generateDemoScenario({ snapshot, scenarioId: "integrity", scenarioVersion: 1, anchorDate: "2026-09-24" });
if (validateDemoScenario(scenario).length) throw new Error("valid scenario was rejected");

const firstOrder = Object.values(scenario.orders)[0];
const broken = structuredClone(scenario);
broken.orders[firstOrder.orderId].storeId = "unknown-store";
const unknownStore = validateDemoScenario(broken);
if (!unknownStore.some((issue) => issue.code === "UNKNOWN_STORE" && issue.entityId === firstOrder.orderId)) throw new Error("unknown store was not detected");

const imbalanced = structuredClone(scenario);
imbalanced.payments[Object.keys(imbalanced.payments)[0]].amountMinor += 1;
if (!validateDemoScenario(imbalanced).some((issue) => issue.code === "ORDER_PAYMENT_IMBALANCE")) throw new Error("payment imbalance was not detected");

console.log("demo scenario integrity: ok");
