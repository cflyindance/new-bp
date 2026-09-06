import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function loadBrowserAsset(path, seed = {}) {
  const context = vm.createContext({ window: seed, console });
  vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
  return context.window;
}

const catalogWindow = loadBrowserAsset("dist/Configuration center/assets/order-limit-store-catalog.js");
const stores = Array.from(catalogWindow.OrderLimitStoreCatalog || []);
assert.ok(stores.length > 0);
assert.equal(new Set(stores.map((store) => store.id)).size, stores.length);
assert.deepEqual(stores.map((store) => store.order), [...stores].sort((a, b) => a.order - b.order).map((store) => store.order));

const listWindow = loadBrowserAsset("dist/Configuration center/assets/buffet-rule-list-view.js");
const view = listWindow.BuffetRuleListView;
assert.ok(view);
assert.equal(view.normalizeStatus("inactive"), "disabled");
assert.deepEqual(Array.from(view.normalizePeriods({ enabledPeriods: [], period: "per_round" })), ["per_round"]);
assert.deepEqual(JSON.parse(JSON.stringify(view.normalizeEffectiveTime({ businessHourSlots: [{ id: "all", mode: "full" }, { id: "lunch", mode: "full" }] }))), { key: "lunch|full", label: "午市全时段" });

const scenarios = [{ key: "order|order_lifetime|dish", version: 4, group: "order_lifetime", legacyCapabilityIds: ["KPOS-O01"], coverageStatus: "complete" }];
const profile = { defaultScenarios: scenarios, legacyCapabilities: { "KPOS-O01": { id: "KPOS-O01", label: "每个订单指定菜品" } }, verifiedLegacyDefaultKey() { return ""; } };
const fixtures = [
  { id: "range-1-3", status: "active", authoringConfig: { name: "一至三人", subject: "party_size", period: "per_round", targetType: "dish", partySizeRanges: [{ min: 1, max: 3 }], deployStoreIds: ["ny-midtown"] } },
  { id: "range-3-5", status: "active", authoringConfig: { name: "三至五人", subject: "party_size", period: "per_round", targetType: "dish", partySizeRanges: [{ min: 3, max: 5 }] } },
  { id: "all-party", status: "disabled", authoringConfig: { name: "所有人数", subject: "party_size", period: "multi_round", targetType: "category", partySizeRanges: [{ min: 1, max: null }] } },
  { id: "order-subject", status: "inactive", authoringConfig: { name: "整单", subject: "order", period: "order_lifetime", targetType: "dish_set" } }
];
const original = JSON.stringify(fixtures);
const rows = fixtures.map((record) => view.createViewModel(record, profile, stores));
assert.deepEqual(Array.from(view.filterRows(rows, { partySize: "3" }), (row) => row.id), ["range-1-3", "range-3-5", "all-party", "order-subject"]);
assert.deepEqual(Array.from(view.filterRows(rows, { status: "active", partySize: "abc" }), (row) => row.id), ["range-1-3", "range-3-5"]);
assert.equal(JSON.stringify(fixtures), original);

const current = view.createViewModel({ id: "current", status: "draft", origin: "system_default", defaultScenarioKey: scenarios[0].key, defaultCatalogVersion: 4, authoringDraft: { name: "默认", subject: "order", period: "order_lifetime", targetType: "dish" } }, profile, stores);
const unknown = view.createViewModel({ id: "unknown", status: "active", origin: "system_default", defaultScenarioKey: scenarios[0].key, defaultCatalogVersion: 99, authoringConfig: { subject: "order", period: "order_lifetime", targetType: "dish" } }, profile, stores);
assert.equal(current.legacyCapabilities[0].id, "KPOS-O01");
assert.equal(current.group, "order_lifetime");
assert.equal(unknown.legacyCapabilities.length, 0);

assert.deepEqual(Array.from(view.defaultVisibleColumns()), ["name", "strategy", "partyScenario", "productScope", "effectiveStores", "status", "actions"]);
assert.deepEqual(JSON.parse(JSON.stringify(view.normalizeColumnPreference({ version: 1, visible: ["name", "unknown", "description"] }))), { version: 1, visible: ["name", "description", "status", "actions"] });
assert.deepEqual(Array.from(view.normalizeColumnPreference({ version: 2, visible: ["description"] }).visible), Array.from(view.defaultVisibleColumns()));

const productRule = { id: "products", status: "draft", authoringDraft: { name: "商品", subject: "party_size", period: "per_round", targetType: "dish", participatingStoreIds: ["ny-midtown"], targetsByStore: { "ny-midtown": [{ productLineId: "kiosk", dishId: "a" }, { productLineId: "kiosk", dishId: "a" }, { productLineId: "emenu", dishId: "a" }] } } };
const productColumns = view.projectColumns(view.createViewModel(productRule, profile, stores));
assert.equal(productColumns.productScope.main, "指定菜品 2 个");
assert.equal(view.quantitySummary([{ configured: true, value: 0 }, { configured: true, value: 4 }], 3, "最多 "), "3 个场景 · 最多 0–4（已配置 2/3）");
assert.equal(view.quantitySummary([], 3, "最多 "), "未配置");

const filterOptions = view.buildFilterOptions(rows.concat([view.createViewModel({ id: "missing", status: "active", authoringConfig: { subject: "order", period: "per_round", targetType: "dish", deployStoreIds: ["missing-store"] } }, profile, stores)]), stores);
assert.equal(filterOptions.stores.at(-1).name, "未知门店（missing-store）");

const listHtml = fs.readFileSync("dist/Configuration center/buffet-rule.html", "utf8");
for (const requiredText of ["规则搜索", "全部门店", "全部状态", "全部主体", "全部周期", "全部对象", "高级筛选", "实际就餐人数", "生效时间", "字段设置", "暂无匹配规则"]) {
  assert.ok(listHtml.includes(requiredText), `buffet list must include ${requiredText}`);
}
assert.ok(listHtml.indexOf("order-limit-store-catalog.js") < listHtml.indexOf("buffet-rule-list-view.js"));
const inlineScripts = [...listHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
assert.ok(inlineScripts.length > 0);
for (const source of inlineScripts) new vm.Script(source, { filename: "buffet-rule.inline.js" });

for (const flowPage of ["buffet-rule-editor.html", "buffet-rule-publish-confirm.html", "order-limit-rule-editor.html", "order-limit-publish-confirm.html", "order-limit-store-select.html"]) {
  const html = fs.readFileSync(`dist/Configuration center/${flowPage}`, "utf8");
  assert.ok(html.indexOf("order-limit-store-catalog.js") >= 0, `${flowPage} must load the shared store catalog`);
  assert.ok(html.indexOf("order-limit-store-catalog.js") < html.indexOf("order-limit-flow.js"), `${flowPage} must load the catalog before the flow`);
}

console.log("buffet rule list view verification passed");
