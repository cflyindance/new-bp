import assert from "node:assert/strict";
import {
  hasOverlappingSubscription,
  isSubscriptionActive,
  resolveEffectiveRouteSources,
  subscriptionStatusLabel,
  type MerchantSubscription,
  type SubscriptionServiceSnapshot,
} from "../src/config/subscription-service-domain";

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
assert.deepEqual([...new Set(sources.map((item) => item.routeNodeId))].sort(), ["menu-a", "menu-b", "menu-shared"]);
assert.equal(sources.find((item) => item.subscriptionId === "sub-group")?.inherited, true);
assert.equal(sources.find((item) => item.subscriptionId === "sub-brand")?.inherited, true);
assert.equal(sources.some((item) => item.subscriptionId === "sub-store-future"), false);

assert.equal(isSubscriptionActive(subscriptions[0]!, now), true);
assert.equal(isSubscriptionActive({ ...subscriptions[0]!, endAt: now.toISOString() }, now), false, "到期边界必须为左闭右开");
assert.equal(subscriptionStatusLabel(subscriptions[0]!, "disabled", now), "服务包已停用");

assert.equal(hasOverlappingSubscription(subscriptions, { subjectType: "group", subjectId: "g1", packageId: "p1", startAt: "2026-08-01T00:00:00.000Z", endAt: "2026-09-01T00:00:00.000Z" }), true);
assert.equal(hasOverlappingSubscription(subscriptions, { subjectType: "group", subjectId: "g1", packageId: "p2", startAt: "2026-08-01T00:00:00.000Z", endAt: "2026-09-01T00:00:00.000Z" }), false);

console.log("subscription-service verification passed");
