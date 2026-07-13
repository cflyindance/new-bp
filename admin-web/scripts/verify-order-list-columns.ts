/**
 * 订单列表表头字段 / 金额口径校验（设计方案 v1.1）
 * 运行：npx tsx scripts/verify-order-list-columns.ts
 * 或：npm run verify:order-list-columns
 */
import assert from "node:assert/strict";
import {
  ORDER_LIST_COLUMNS,
  getDefaultVisibleColumns,
  getOptionalColumns,
} from "../src/config/order-list-columns";

const expectedKeys = [
  "orderNumber",
  "status",
  "orderType",
  "tableOrPickupNo",
  "subtotal",
  "totalDue",
  "totalCollected",
  "cardTip",
  "cashTip",
  "serviceCharge",
  "tax",
  "serverName",
  "openedAt",
  "closerName",
  "closedAt",
  "paymentMethodSummary",
  "discount",
  "guestCount",
  "storeName",
] as const;

assert.equal(ORDER_LIST_COLUMNS.length, 19, "字段全集应为 19 列");
assert.deepEqual(
  ORDER_LIST_COLUMNS.map((c) => c.key),
  [...expectedKeys],
  "列 key 顺序须与设计方案 §4.1 一致",
);
assert.deepEqual(
  ORDER_LIST_COLUMNS.map((c) => c.order),
  expectedKeys.map((_, i) => i + 1),
  "order 须为 1..19",
);

const defaults = getDefaultVisibleColumns();
const optionals = getOptionalColumns();
assert.equal(defaults.length, 13, "默认显示应为 13 列");
assert.equal(optionals.length, 6, "可选应为 6 列");
assert.deepEqual(
  defaults.map((c) => c.key),
  [
    "orderNumber",
    "status",
    "orderType",
    "tableOrPickupNo",
    "subtotal",
    "totalDue",
    "totalCollected",
    "cardTip",
    "cashTip",
    "serviceCharge",
    "tax",
    "serverName",
    "openedAt",
  ],
);
assert.deepEqual(
  optionals.map((c) => c.key),
  ["closerName", "closedAt", "paymentMethodSummary", "discount", "guestCount", "storeName"],
);

assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "serverName"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "closerName"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "openedAt"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "closedAt"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "serviceCharge"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "cardTip"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "cashTip"));

console.log("verify-order-list-columns: columns OK");
