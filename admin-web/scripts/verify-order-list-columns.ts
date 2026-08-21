/**
 * 订单列表表头字段 / 金额口径校验（设计方案 v1.5）
 * 运行：npx tsx scripts/verify-order-list-columns.ts
 * 或：npm run verify:order-list-columns
 */
import assert from "node:assert/strict";
import {
  ORDER_LIST_CHANNELS,
  ORDER_LIST_COLUMNS,
  getDefaultVisibleColumns,
  getOptionalColumns,
} from "../src/config/order-list-columns";
import {
  calcTotalDue,
  calcTotalCollected,
  formatUsd,
} from "../src/config/order-list-amounts";

const expectedKeys = [
  "orderNumber",
  "status",
  "orderType",
  "orderChannel",
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

assert.equal(ORDER_LIST_COLUMNS.length, 20, "字段全集应为 20 列");
assert.deepEqual(
  ORDER_LIST_COLUMNS.map((c) => c.key),
  [...expectedKeys],
  "列 key 顺序须与设计方案 §4.1 一致",
);
assert.deepEqual(
  ORDER_LIST_COLUMNS.map((c) => c.order),
  expectedKeys.map((_, i) => i + 1),
  "order 须为 1..20",
);

const defaults = getDefaultVisibleColumns();
const optionals = getOptionalColumns();
assert.equal(defaults.length, 14, "默认显示应为 14 列");
assert.equal(optionals.length, 6, "可选应为 6 列");
assert.deepEqual(
  defaults.map((c) => c.key),
  [
    "orderNumber",
    "status",
    "orderType",
    "orderChannel",
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

assert.deepEqual(
  [...ORDER_LIST_CHANNELS],
  ["KIOSK", "EMENU", "OO", "SDI", "POS", "PAYPAD", "POS GO", "三方外卖"],
);

assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "orderChannel"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "serverName"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "closerName"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "openedAt"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "closedAt"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "serviceCharge"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "cardTip"));
assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "cashTip"));

const sample = {
  subtotal: 100,
  discount: 10,
  tax: 8.1,
  serviceCharge: 18,
  cardTip: 15,
  cashTip: 5,
  settled: true as const,
};

assert.equal(calcTotalDue(sample), 116.1, "应收 = 小计-折扣+税+服务费");
assert.equal(calcTotalCollected(sample), 136.1, "已结账实收含双小费");
assert.equal(
  calcTotalCollected({ ...sample, settled: false }),
  0,
  "未结账实收固定 0",
);
assert.equal(
  calcTotalDue({ subtotal: 50, discount: 0, tax: 0, serviceCharge: 0 }),
  50,
);
assert.equal(
  calcTotalCollected({
    subtotal: 50,
    discount: 0,
    tax: 0,
    serviceCharge: 0,
    cardTip: 0,
    cashTip: 0,
    settled: true,
  }),
  50,
);
assert.equal(formatUsd(0), "$0.00");
assert.equal(formatUsd(116.1), "$116.10");
assert.equal(formatUsd(Number.NaN), "$0.00");

console.log("verify-order-list-columns: OK");
