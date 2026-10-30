import assert from "node:assert/strict";
import {
  hasOverlappingSubscription,
  isSubscriptionActive,
  resolveEffectiveRouteSources,
  subscriptionLifecycle,
  subscriptionStatusLabel,
  type MerchantSubscription,
  type SubscriptionServiceSnapshot,
} from "../src/config/subscription-service-domain";
import { buildSubscriptionImpactPreview, subscriptionOperationPolicy, subscriptionPackageState } from "../src/config/subscription-operations-domain";

const now = new Date("2026-08-26T12:00:00.000Z");
const subscriptions: MerchantSubscription[] = [
  { id: "sub-group", subjectType: "group", subjectId: "g1", packageId: "p1", startAt: "2026-01-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", createdBy: "test" },
  { id: "sub-brand", subjectType: "brand", subjectId: "b1", packageId: "p2", startAt: "2026-01-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", createdBy: "test" },
  { id: "sub-store-future", subjectType: "store", subjectId: "s1", packageId: "p1", startAt: "2027-01-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z", createdBy: "test" },
];

const snapshot: SubscriptionServiceSnapshot = {
  schemaVersion: 1,
  routeBlueprintVersion: 1,
  packages: [
    { id: "p1", code: "P1", name: "基础包", priceMinor: 9900, currency: "CNY", billingInterval: "month", status: "published", activeReleaseId: "r1", createdAt: "", updatedAt: "" },
    { id: "p2", code: "P2", name: "增长包", priceMinor: 19900, currency: "CNY", billingInterval: "month", status: "published", activeReleaseId: "r2", createdAt: "", updatedAt: "" },
  ],
  drafts: [],
  releases: [
    { id: "r1", packageId: "p1", version: 1, routeBlueprintVersion: 1, name: "基础包", priceMinor: 9900, currency: "CNY", billingInterval: "month", routeNodeIds: ["menu-a", "menu-shared"], publishedAt: "", publishedBy: "test" },
    { id: "r2", packageId: "p2", version: 1, routeBlueprintVersion: 1, name: "增长包", priceMinor: 19900, currency: "CNY", billingInterval: "month", routeNodeIds: ["menu-b", "menu-shared"], publishedAt: "", publishedBy: "test" },
  ],
  subscriptions,
  audit: [],
};

const sources = resolveEffectiveRouteSources(snapshot, { groupId: "g1", brandId: "b1", storeId: "s1" }, now);
assert.deepEqual([...new Set(sources.map((item) => item.routeNodeId))].sort(), ["menu-b", "menu-shared"]);
assert.equal(sources.some(item=>item.subscriptionId==="sub-group"),false,"历史集团订阅不提供能力");
assert.equal(resolveEffectiveRouteSources(snapshot,{groupId:"g1"},now).length,0);
assert.equal(sources.find((item) => item.subscriptionId === "sub-brand")?.inherited, true);
assert.equal(sources.some((item) => item.subscriptionId === "sub-store-future"), false);

assert.equal(isSubscriptionActive(subscriptions[0]!, now), true);
assert.equal(isSubscriptionActive({ ...subscriptions[0]!, endAt: now.toISOString() }, now), false, "到期边界必须为左闭右开");
assert.equal(subscriptionStatusLabel(subscriptions[0]!, "disabled", now), "生效中", "服务包状态不得覆盖订阅生命周期");
assert.equal(subscriptionLifecycle({ ...subscriptions[0]!, cancelledAt: now.toISOString() }, now), "已作废");
assert.equal(isSubscriptionActive({ ...subscriptions[0]!, cancelledAt: now.toISOString() }, now), false, "已作废记录不得提供能力");
assert.equal(subscriptionPackageState({ ...snapshot.packages[0]!, saleStatus: "off" }), "off");

assert.equal(hasOverlappingSubscription(subscriptions, { subjectType: "group", subjectId: "g1", packageId: "p1", startAt: "2026-08-01T00:00:00.000Z", endAt: "2026-09-01T00:00:00.000Z" }), true);
assert.equal(hasOverlappingSubscription(subscriptions, { subjectType: "group", subjectId: "g1", packageId: "p2", startAt: "2026-08-01T00:00:00.000Z", endAt: "2026-09-01T00:00:00.000Z" }), false);

const activeStore={...subscriptions[2]!,startAt:"2026-01-01T00:00:00.000Z"};
const combined=resolveEffectiveRouteSources({...snapshot,subscriptions:[...subscriptions,activeStore]},{groupId:"g1",brandId:"b1",storeId:"s1"},now);
assert.deepEqual([...new Set(combined.map(s=>s.routeNodeId))].sort(),["menu-a","menu-b","menu-shared"]);
assert.equal(combined.find(s=>s.subscriptionId==="sub-store-future")?.inherited,false);
assert.equal(combined.some(s=>s.subscriptionId==="sub-group"),false);

const scheduledOff: MerchantSubscription = { id: "sub-scheduled-off", subjectType: "store", subjectId: "s1", packageId: "p1", startAt: "2027-01-01T00:00:00.000Z", createdAt: "", createdBy: "test" };
const offSnapshot: SubscriptionServiceSnapshot = { ...snapshot, packages: snapshot.packages.map((pkg) => pkg.id === "p1" ? { ...pkg, saleStatus: "off" } : pkg), subscriptions: [scheduledOff] };
const offPolicy = subscriptionOperationPolicy(offSnapshot, scheduledOff, now);
assert.equal(offPolicy.lifecycle, "待生效");
assert.equal(offPolicy.limitedEdit, true);
assert.deepEqual(offPolicy.allowed.includes("activate"), false);
assert.deepEqual(offPolicy.allowed.includes("cancel"), true);

const activeStoreSubscription: MerchantSubscription = { ...scheduledOff, id: "sub-active-impact", startAt: "2026-01-01T00:00:00.000Z", endAt: "2026-08-26T12:02:00.000Z" };
const impactSnapshot: SubscriptionServiceSnapshot = { ...snapshot, subscriptions: [activeStoreSubscription] };
const disablePreview = buildSubscriptionImpactPreview(impactSnapshot, activeStoreSubscription.id, "disable", now);
assert.equal(disablePreview.providedRouteCount, 2);
assert.equal(disablePreview.lostRouteCount, 2);
assert.equal(disablePreview.expiresAt, activeStoreSubscription.endAt, "最近时间边界早于五分钟时应提前失效");
console.log("subscription-service verification passed: brand-to-store inheritance, store additions and ignored historical groups");
