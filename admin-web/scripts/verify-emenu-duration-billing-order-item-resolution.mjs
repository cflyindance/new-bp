import assert from "node:assert/strict";

const resolver = await import(
  "../vendor/emenu-new/src/services/durationBillingOrderItems.js"
);

const nested = { id: 101, saleItemId: 13359, price: 0 };
const topLevel = { id: 202, saleItemId: 13359, price: 0 };

assert.equal(
  resolver.resolveDurationBillingProductId({
    productSnapshot: { productId: 13359 },
  }),
  13359,
  "新会话应读取 productSnapshot.productId",
);
assert.equal(
  resolver.resolveDurationBillingProductId({
    productSnapshot: { id: 13359 },
    ruleSnapshot: { productBinding: { productId: 99999 } },
  }),
  13359,
  "旧会话应兼容 productSnapshot.id",
);
assert.equal(
  resolver.resolveDurationBillingProductId({
    ruleSnapshot: { productBinding: { productId: 13359 } },
  }),
  13359,
  "商品快照缺失时应回退冻结规则绑定",
);

assert.deepEqual(
  resolver.flattenDurationBillingOrderItems({
    subOrders: [{ orderItems: [nested] }],
    orderItems: [topLevel],
  }),
  [nested, topLevel],
  "结束计时必须同时读取子订单与顶层订单商品",
);

assert.equal(
  resolver.resolveDurationBillingOrderItem({
    order: { orderItems: [topLevel] },
    orderItemId: 202,
    productId: 13359,
  }),
  topLevel,
  "真实 orderItemId 应优先命中顶层商品",
);

assert.equal(
  resolver.resolveDurationBillingOrderItem({
    order: { orderItems: [topLevel] },
    orderItemId: "old-id",
    productId: "13359",
  }),
  topLevel,
  "刷新导致 ID 变化时应按唯一 saleItemId 恢复关联",
);

assert.equal(
  resolver.resolveDurationBillingOrderItem({
    order: {
      orderItems: [topLevel, { id: 203, saleItemId: 13359, price: 0 }],
    },
    orderItemId: "old-id",
    productId: 13359,
  }),
  null,
  "存在多个相同商品时不得猜测需要改价的商品行",
);

assert.equal(
  resolver.resolveDurationBillingOrderItem({
    order: { orderItems: [{ ...topLevel, voided: true }] },
    orderItemId: 202,
    productId: 13359,
  }),
  null,
  "已作废商品不得用于结束计时",
);

console.log("verify-emenu-duration-billing-order-item-resolution: OK");
