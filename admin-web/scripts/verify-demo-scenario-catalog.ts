import type { EnterpriseMerchantSnapshot } from "../src/config/enterprise-merchant-types";
import { buildDemoScenarioCatalog } from "../src/demo-scenario/demo-scenario-catalog";
import { resolveStoreCatalog } from "../src/demo-scenario/demo-scenario-products";

const snapshot = {
  merchants: [{ merchantId: "merchant-zhangji", groupId: "group-zhangji-holdings", name: "张记火锅", timezone: "Asia/Shanghai" }],
  stores: [
    { storeId: "M00000001", merchantId: "merchant-zhangji", name: "上海陆家嘴店", status: "open" },
    { storeId: "M00000002", merchantId: "merchant-zhangji", name: "广州天河店", status: "open" },
  ],
} as unknown as EnterpriseMerchantSnapshot;
const catalog = buildDemoScenarioCatalog(snapshot);
const sh = catalog.storeProfiles.M00000001;
const gz = catalog.storeProfiles.M00000002;
if (!sh || !gz) throw new Error("Zhangji demo stores are missing");
if (sh.brandId !== "merchant-zhangji" || gz.brandId !== "merchant-zhangji") throw new Error("store brand mismatch");

for (const profile of Object.values(catalog.storeProfiles)) {
  const source = snapshot.stores.find((store) => store.storeId === profile.storeId);
  if (!source) throw new Error(`unknown organization store ${profile.storeId}`);
  if (source.merchantId !== profile.brandId) throw new Error(`wrong brand for ${profile.storeId}`);
}

const template = catalog.brandTemplates[sh.brandId];
const shProducts = resolveStoreCatalog(template, sh);
const gzProducts = resolveStoreCatalog(template, gz);
if (shProducts.length !== template.productIds.length || gzProducts.length !== template.productIds.length) {
  throw new Error("inherited products are incomplete");
}
const overridden = Object.keys(gz.productOverrides).find((id) => gz.productOverrides[id]?.priceMinor !== undefined);
if (!overridden) throw new Error("Guangzhou requires a price override");
const shPrice = shProducts.find((item) => item.productId === overridden)?.priceMinor;
const gzPrice = gzProducts.find((item) => item.productId === overridden)?.priceMinor;
if (shPrice === gzPrice) throw new Error("store price override leaked or was ignored");
const disabled = Object.keys(gz.productOverrides).find((id) => gz.productOverrides[id]?.enabled === false);
if (!disabled || gzProducts.find((item) => item.productId === disabled)?.enabled !== false) {
  throw new Error("disabled product must remain in catalog with enabled=false");
}

console.log(`demo scenario catalog: ok (${Object.keys(catalog.storeProfiles).length} stores)`);
