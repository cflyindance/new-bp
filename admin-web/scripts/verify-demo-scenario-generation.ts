import type { EnterpriseMerchantSnapshot } from "../src/config/enterprise-merchant-types";
import { generateDemoScenario } from "../src/demo-scenario/demo-scenario-generator";

const snapshot = {
  merchants: [
    { merchantId: "merchant-zhangji", groupId: "group-demo", name: "张记火锅", timezone: "Asia/Shanghai" },
    { merchantId: "merchant-skewers", groupId: "group-demo", name: "张记串串", timezone: "Asia/Shanghai" },
  ],
  stores: [
    { storeId: "M00000001", merchantId: "merchant-zhangji", name: "上海陆家嘴店", status: "open" },
    { storeId: "M00000002", merchantId: "merchant-zhangji", name: "广州天河店", status: "open" },
    { storeId: "M00000008", merchantId: "merchant-skewers", name: "成都春熙店", status: "open" },
    { storeId: "M00000009", merchantId: "merchant-skewers", name: "重庆解放碑店", status: "open" },
  ],
} as unknown as EnterpriseMerchantSnapshot;

const input = { snapshot, scenarioId: "restaurant-chain", scenarioVersion: 1, anchorDate: "2026-09-24" as const };
const first = generateDemoScenario(input);
const second = generateDemoScenario(input);
const firstJson = JSON.stringify(first);
if (firstJson !== JSON.stringify(second)) throw new Error("scenario generation is not deterministic");

const dates = new Set(Object.values(first.orders).map((order) => order.businessDate));
if (dates.size !== 30 || !dates.has("2026-08-26") || !dates.has("2026-09-24")) {
  throw new Error(`unexpected order date window: ${JSON.stringify([...dates])}`);
}
for (const brandId of first.scopeIndex.brandIds) {
  const storeIds = Object.values(first.storeProfiles).filter((store) => store.brandId === brandId).map((store) => store.storeId);
  if (storeIds.length < 2) throw new Error(`brand ${brandId} does not have multiple stores`);
  const orderCounts = storeIds.map((storeId) => Object.values(first.orders).filter((order) => order.storeId === storeId).length);
  if (new Set(orderCounts).size < 2) throw new Error(`brand ${brandId} stores need distinct volume`);
}

let digest = 2166136261;
for (const char of firstJson) digest = Math.imul(digest ^ char.charCodeAt(0), 16777619) >>> 0;
console.log(`demo scenario generation: ok (${digest.toString(16)})`);
