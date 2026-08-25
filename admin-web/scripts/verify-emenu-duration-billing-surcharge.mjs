import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");
const hook = read("vendor/emenu-new/src/hooks/useDurationBilling.js");
const orders = read("vendor/emenu-new/src/services/orders.js");
const sent = read("vendor/emenu-new/src/components/ShoppingCart/SentOrders.jsx");
const pending = read("vendor/emenu-new/src/components/ShoppingCart/PendingOrders.jsx");
const service = read("vendor/emenu-new/src/services/durationBillingOrders.js");
const checkout = read("vendor/emenu-new/src/components/ShoppingCart/CallerServerCheckout.jsx");
const zh = read("vendor/emenu-new/src/locales/zh.json");
const zhHant = read("vendor/emenu-new/src/locales/zh-Hant.json");
const en = read("vendor/emenu-new/src/locales/en.json");

assert.doesNotMatch(service, /duration-billing\/item\/start/);
assert.doesNotMatch(service, /duration-billing\/item\/finish/);
assert.match(service, /generateOrder/);
assert.match(service, /saveOrder/);
assert.match(service, /fetchOrder/);
assert.match(service, /count: 1/);
assert.match(service, /price: 0/);
assert.match(service, /productSnapshot/);
assert.match(orders, /displayName: item\.name/);
assert.match(orders, /orderItemId: item\.id/);
assert.match(service, /finalAmount/);
assert.match(service, /orderItem\.totalAmount = nextAmount/);
assert.match(service, /order\.status = OrderStatus\.PARTIALLY_SUBMITTED/);
assert.match(service, /emenuKioskextendedInfo/);
assert.match(hook, /createDurationBillingOrderItem/);
assert.match(hook, /updateDurationBillingOrderItemPrice/);
assert.match(hook, /orderItemId: durationBilling\.orderItemId/);
assert.match(hook, /resolveDurationBillingProductId\(durationBilling\)/);
assert.match(hook, /if \(!finishResult\) return null/);
assert.match(hook, /allMenuItem\.find/);
assert.match(hook, /productSnapshot/);
assert.match(hook, /String\(tableProductId\) !== String\(productId\)/);
assert.match(hook, /isKtvDurationBillingTable\(tableSnapshot\)/);
assert.match(hook, /startInFlightRef\.current/);
assert.match(hook, /finishInFlightRef\.current/);
assert.match(orders, /readDurationBillingSession\(storedTableInfo\)/);
assert.doesNotMatch(orders, /durationBillingSurcharge/);
assert.match(orders, /durationBilling: eMenuExtraData\?\.durationBilling/);
assert.match(sent, /const isDurationBillingOrderItem =/);
assert.match(sent, /String\(e\?\.orderItemId \?\? e\?\.key \?\? ''\) ===[\s\S]*String\(durationBilling\?\.orderItemId \?\? ''\)/);
assert.match(sent, /setInterval\([\s\S]*setDurationBillingNow\(Date\.now\(\)\)[\s\S]*1000/);
assert.match(sent, /formatDurationBillingElapsed\(/);
assert.match(sent, /calcDurationBillingFee\(/);
assert.match(sent, /DurationBilling\.cartElapsed/);
assert.match(sent, /DurationBilling\.cartEstimated/);
assert.match(sent, /Number\.isFinite\(durationBillingEstimatedFee\)/);
assert.equal(
  (sent.match(/\{durationBillingMeta\}\s*<SeasoningTags/g) || []).length,
  2,
  "普通商品和套餐商品都应把用时放在 Option 位置"
);
assert.match(sent, /const durationBillingPrice = isDurationBillingOrderItem/);
assert.match(sent, /\{durationBillingPrice \? \(/);
assert.doesNotMatch(sent, /\{' · '\}/);
assert.match(zh, /"cartEstimated": "预估"/);
assert.match(zhHant, /"cartEstimated": "預估"/);
assert.match(en, /"cartEstimated": "Estimated"/);
assert.doesNotMatch(pending, /durationBillingFee/);
assert.match(checkout, /const isTiming = status === 'timing'/);
assert.match(checkout, /gridTemplateColumns: 'repeat\(2, minmax\(0, 1fr\)\)'/);
assert.match(checkout, /isCallServerCheckout && isTiming \? classes\.actionRow/);
assert.match(checkout, /permission="durationBillingEnd"/);
assert.match(checkout, /await endTiming\(staff\?\.userId, endTimingAt\)/);
assert.match(checkout, /<EndTimingDialog/);
assert.doesNotMatch(checkout, /formatDurationBillingElapsed/);
assert.doesNotMatch(checkout, /calcDurationBillingFee/);
assert.doesNotMatch(checkout, /DurationBilling\.estimatedFee/);
assert.doesNotMatch(checkout, /DurationBilling\.endBeforeCheckout/);
assert.match(checkout, /import \{ useFetchOrder \} from '@\/hooks\/useFetchOrder'/);
assert.match(
  checkout,
  /const \{ runFetchOrder \} = useFetchOrder\(\)[\s\S]*?const ended = await endTiming[\s\S]*?await runFetchOrder\(\)[\s\S]*?DurationBilling\.endSuccess/,
  "购物车结束计时成功后必须刷新订单，以最终计时价格替换 $0.00",
);
assert.match(
  hook,
  /persistSession\(endedSession, finishResult\?\.order\)/,
  "结束计时必须立即把 KPOS 保存响应中的最终价格写入当前订单",
);
assert.match(sent, /<CallerServerCheckout orderSubtotal=\{displaySubtotal\}/);

console.log("verify-emenu-duration-billing-product-order: OK");
