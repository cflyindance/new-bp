import assert from "node:assert/strict";
import {
  PRODUCT_LINES, classifyActivity, dateNumber, shiftDate, validatePeriod, resolveOrders,
  summarizeActivity, currentBindings, devicesForScope, type ActivityPeriod,
} from "../src/config/merchant-activity-domain";
import { createActivityDemo } from "../src/config/merchant-activity-demo";
import { M_RESOURCES, mPageKey, mPageForPath } from "../src/permissions/m-platform-catalog";
import { mResolve, type MState } from "../src/permissions/m-platform-domain";

const asOf = "2026-10-27";
for (const [days, status] of [[0, "active"], [6, "active"], [7, "recent"], [13, "recent"], [14, "suspected"], [29, "suspected"], [30, "long"], [90, "long"], [null, "never"]] as const) {
  assert.equal(classifyActivity(days), status, "threshold " + days);
}
assert.equal(classifyActivity(null, false), "unconfigured");
assert.equal(classifyActivity(null, true, true), "error");
assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
assert.equal(shiftDate("2024-03-01", -1), "2024-02-29");
assert.throws(() => dateNumber("2026-02-30"));
assert.match(validatePeriod({ start: asOf, end: "2026-10-26" }, asOf)!, /开始日期/);
assert.match(validatePeriod({ start: asOf, end: "2026-10-28" }, asOf)!, /截至/);
assert.match(validatePeriod({ start: "2026-01-01", end: asOf }, asOf)!, /90/);
assert.equal(validatePeriod({ start: shiftDate(asOf, -89), end: asOf }, asOf), null);

const data = createActivityDemo(asOf);
assert.deepEqual(data, createActivityDemo(asOf), "demo deterministic");
const orders = resolveOrders(data);
assert.equal(orders.length, data.orders.filter(o => o.status !== "draft").length - 1, "duplicate delivery removed");
assert.ok(!orders.some(o => o.status === "draft"));
for (const days of [1, 7, 30, 90]) {
  const period: ActivityPeriod = { start: shiftDate(asOf, 1 - days), end: asOf };
  for (const store of data.stores.filter(s => s.quality === "complete")) {
    const total = summarizeActivity(data, orders, { storeId: store.id }, period);
    let lines = 0;
    for (const line of PRODUCT_LINES) {
      const scope = { storeId: store.id, line };
      const m = summarizeActivity(data, orders, scope, period);
      lines += m.count!;
      const devices = devicesForScope(data, orders, scope, period);
      const deviceTotal = devices.reduce((sum, d) => sum + summarizeActivity(data, orders, { ...scope, deviceId: d.id }, period).count!, 0);
      assert.equal(deviceTotal, m.count, store.id + "/" + line + " device reconciliation");
      assert.ok(m.paid! + m.cancelled! <= m.count!);
      assert.ok(m.activeDays! <= days);
      assert.equal(m.dailyAverage, m.count! / days);
    }
    assert.equal(lines + total.unknown!, total.count, store.id + " store reconciliation");
  }
}
const week = { start: shiftDate(asOf, -6), end: asOf };
const kiosk = summarizeActivity(data, orders, { storeId: "demo-uneven", line: "Kiosk" }, week);
assert.equal(kiosk.boundDevices, 5);
assert.equal(kiosk.usedDevices, 3);
assert.equal(kiosk.unusedDevices, 2);
assert.ok(devicesForScope(data, orders, { storeId: "demo-uneven", line: "Kiosk" }, week).some(d =>
  summarizeActivity(data, orders, { storeId: "demo-uneven", line: "Kiosk", deviceId: d.id }, week).count === 0));
assert.ok(summarizeActivity(data, orders, { storeId: "demo-unknown" }, week).unknown! > 0);
assert.equal(summarizeActivity(data, orders, { storeId: "demo-stopped" }, week).status, "suspected");
assert.equal(summarizeActivity(data, orders, { storeId: "demo-recent" }, week).status, "recent");
assert.equal(summarizeActivity(data, orders, { storeId: "demo-long" }, week).status, "long");
assert.equal(summarizeActivity(data, orders, { storeId: "demo-new" }, week).status, "never");
assert.equal(summarizeActivity(data, orders, { storeId: "demo-error" }, week).count, null);
assert.equal(summarizeActivity(data, orders, { storeId: "demo-error" }, week).usedDevices, null);
assert.equal(summarizeActivity(data, orders, { storeId: "demo-error" }, week).unusedDevices, null);
const switched = orders.filter(o => o.deviceId === "demo-all-switched");
assert.ok(switched.some(o => o.binding?.line === "eMenu"));
assert.ok(switched.some(o => o.binding?.line === "POS GO"));
const switchBoundary = structuredClone(data);
switchBoundary.orders = [
  { id: "BEFORE", storeId: "demo-all", deviceId: "demo-all-switched", submittedAt: "2026-10-21T23:59:59+08:00", status: "submitted" },
  { id: "AT", storeId: "demo-all", deviceId: "demo-all-switched", submittedAt: "2026-10-22T00:00:00+08:00", status: "submitted" },
  { id: "AFTER", storeId: "demo-all", deviceId: "demo-all-switched", submittedAt: "2026-10-22T00:00:01+08:00", status: "submitted" },
];
assert.deepEqual(resolveOrders(switchBoundary).map(o => o.binding?.line), ["eMenu", "POS GO", "POS GO"], "half-open binding boundary");
assert.ok(!currentBindings(data, { storeId: "demo-all", line: "eMenu" }).some(b => b.deviceId === "demo-all-switched"));
const month = { start: shiftDate(asOf, -29), end: asOf };
assert.ok(devicesForScope(data, orders, { storeId: "demo-all", line: "eMenu" }, month).some(d => d.id === "demo-all-switched"));
// Ambiguous binding must never silently assign a product line.
const ambiguous = structuredClone(data);
ambiguous.bindings.push({ ...ambiguous.bindings[0]!, licenseId: "DUPLICATE-LICENSE" });
assert.ok(resolveOrders(ambiguous).filter(o => o.deviceId === data.bindings[0]!.deviceId).every(o => !o.binding));
// Future records do not alter the current status.
const future = structuredClone(data);
future.orders.push({ ...orders[0]!, id: "FUTURE", submittedAt: shiftDate(asOf, 1) + "T10:00:00+08:00" });
assert.equal(resolveOrders(future).length, orders.length);
assert.equal(mPageForPath("/m-platform/merchants/activity/store/demo-all/line/POS")?.id, "merchant-activity");
assert.equal(M_RESOURCES.get(mPageKey("merchant-activity"))?.editable, false);
const access: MState = { schema: 1, revision: 0, roles: [{ id: "reader", name: "reader", description: "",
  grants: { "m:module:merchants": "read", [mPageKey("merchant-activity")]: "read" } }],
  employees: [{ id: "reader", roleIds: ["reader"] }], logs: [] };
assert.equal(mResolve(access, "reader", mPageKey("merchant-activity")), "read");
delete access.roles[0]!.grants[mPageKey("merchant-activity")];
assert.equal(mResolve(access, "reader", mPageKey("merchant-activity")), "hidden", "no automatic grant to old roles");
console.log("PASS merchant activity: thresholds, dates, deterministic fixtures, 4-period reconciliation, zero devices, historical bindings, unknown/error, deduplication and permissions");
