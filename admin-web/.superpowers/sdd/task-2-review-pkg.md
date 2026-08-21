# Review Package Task 2
BASE: 6e3414190c55949b86da8cf3632cecaf3467a260
HEAD: 7e8443dd38158edda6effe692a0133d2ab52b60a

## Commits
```
7e8443d feat(orders): add order list amount formulas

```
## Diff stat
```
 admin-web/scripts/verify-order-list-columns.ts | 206 +++++++++++++++----------
 admin-web/src/config/order-list-amounts.ts     |  36 +++++
 2 files changed, 160 insertions(+), 82 deletions(-)

```
## Full diff
```diff
diff --git a/admin-web/scripts/verify-order-list-columns.ts b/admin-web/scripts/verify-order-list-columns.ts
index 647b79a..8175023 100644
--- a/admin-web/scripts/verify-order-list-columns.ts
+++ b/admin-web/scripts/verify-order-list-columns.ts
@@ -1,82 +1,124 @@
-/**
- * 璁㈠崟鍒楄〃琛ㄥご瀛楁 / 閲戦鍙ｅ緞鏍￠獙锛堣璁℃柟妗?v1.1锛?- * 杩愯锛歯px tsx scripts/verify-order-list-columns.ts
- * 鎴栵細npm run verify:order-list-columns
- */
-import assert from "node:assert/strict";
-import {
-  ORDER_LIST_COLUMNS,
-  getDefaultVisibleColumns,
-  getOptionalColumns,
-} from "../src/config/order-list-columns";
-
-const expectedKeys = [
-  "orderNumber",
-  "status",
-  "orderType",
-  "tableOrPickupNo",
-  "subtotal",
-  "totalDue",
-  "totalCollected",
-  "cardTip",
-  "cashTip",
-  "serviceCharge",
-  "tax",
-  "serverName",
-  "openedAt",
-  "closerName",
-  "closedAt",
-  "paymentMethodSummary",
-  "discount",
-  "guestCount",
-  "storeName",
-] as const;
-
-assert.equal(ORDER_LIST_COLUMNS.length, 19, "瀛楁鍏ㄩ泦搴斾负 19 鍒?);
-assert.deepEqual(
-  ORDER_LIST_COLUMNS.map((c) => c.key),
-  [...expectedKeys],
-  "鍒?key 椤哄簭椤讳笌璁捐鏂规 搂4.1 涓€鑷?,
-);
-assert.deepEqual(
-  ORDER_LIST_COLUMNS.map((c) => c.order),
-  expectedKeys.map((_, i) => i + 1),
-  "order 椤讳负 1..19",
-);
-
-const defaults = getDefaultVisibleColumns();
-const optionals = getOptionalColumns();
-assert.equal(defaults.length, 13, "榛樿鏄剧ず搴斾负 13 鍒?);
-assert.equal(optionals.length, 6, "鍙€夊簲涓?6 鍒?);
-assert.deepEqual(
-  defaults.map((c) => c.key),
-  [
-    "orderNumber",
-    "status",
-    "orderType",
-    "tableOrPickupNo",
-    "subtotal",
-    "totalDue",
-    "totalCollected",
-    "cardTip",
-    "cashTip",
-    "serviceCharge",
-    "tax",
-    "serverName",
-    "openedAt",
-  ],
-);
-assert.deepEqual(
-  optionals.map((c) => c.key),
-  ["closerName", "closedAt", "paymentMethodSummary", "discount", "guestCount", "storeName"],
-);
-
-assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "serverName"));
-assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "closerName"));
-assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "openedAt"));
-assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "closedAt"));
-assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "serviceCharge"));
-assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "cardTip"));
-assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "cashTip"));
-
-console.log("verify-order-list-columns: columns OK");
+/**

+ * 璁㈠崟鍒楄〃琛ㄥご瀛楁 / 閲戦鍙ｅ緞鏍￠獙锛堣璁℃柟妗?v1.1锛?
+ * 杩愯锛歯px tsx scripts/verify-order-list-columns.ts

+ * 鎴栵細npm run verify:order-list-columns

+ */

+import assert from "node:assert/strict";

+import {

+  ORDER_LIST_COLUMNS,

+  getDefaultVisibleColumns,

+  getOptionalColumns,

+} from "../src/config/order-list-columns";

+import {

+  calcTotalDue,

+  calcTotalCollected,

+  formatUsd,

+} from "../src/config/order-list-amounts";

+

+const expectedKeys = [

+  "orderNumber",

+  "status",

+  "orderType",

+  "tableOrPickupNo",

+  "subtotal",

+  "totalDue",

+  "totalCollected",

+  "cardTip",

+  "cashTip",

+  "serviceCharge",

+  "tax",

+  "serverName",

+  "openedAt",

+  "closerName",

+  "closedAt",

+  "paymentMethodSummary",

+  "discount",

+  "guestCount",

+  "storeName",

+] as const;

+

+assert.equal(ORDER_LIST_COLUMNS.length, 19, "瀛楁鍏ㄩ泦搴斾负 19 鍒?);

+assert.deepEqual(

+  ORDER_LIST_COLUMNS.map((c) => c.key),

+  [...expectedKeys],

+  "鍒?key 椤哄簭椤讳笌璁捐鏂规 搂4.1 涓€鑷?,

+);

+assert.deepEqual(

+  ORDER_LIST_COLUMNS.map((c) => c.order),

+  expectedKeys.map((_, i) => i + 1),

+  "order 椤讳负 1..19",

+);

+

+const defaults = getDefaultVisibleColumns();

+const optionals = getOptionalColumns();

+assert.equal(defaults.length, 13, "榛樿鏄剧ず搴斾负 13 鍒?);

+assert.equal(optionals.length, 6, "鍙€夊簲涓?6 鍒?);

+assert.deepEqual(

+  defaults.map((c) => c.key),

+  [

+    "orderNumber",

+    "status",

+    "orderType",

+    "tableOrPickupNo",

+    "subtotal",

+    "totalDue",

+    "totalCollected",

+    "cardTip",

+    "cashTip",

+    "serviceCharge",

+    "tax",

+    "serverName",

+    "openedAt",

+  ],

+);

+assert.deepEqual(

+  optionals.map((c) => c.key),

+  ["closerName", "closedAt", "paymentMethodSummary", "discount", "guestCount", "storeName"],

+);

+

+assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "serverName"));

+assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "closerName"));

+assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "openedAt"));

+assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "closedAt"));

+assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "serviceCharge"));

+assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "cardTip"));

+assert.ok(ORDER_LIST_COLUMNS.some((c) => c.key === "cashTip"));

+

+const sample = {

+  subtotal: 100,

+  discount: 10,

+  tax: 8.1,

+  serviceCharge: 18,

+  cardTip: 15,

+  cashTip: 5,

+  settled: true as const,

+};

+

+assert.equal(calcTotalDue(sample), 116.1, "搴旀敹 = 灏忚-鎶樻墸+绋?鏈嶅姟璐?);

+assert.equal(calcTotalCollected(sample), 136.1, "宸茬粨璐﹀疄鏀跺惈鍙屽皬璐?);

+assert.equal(

+  calcTotalCollected({ ...sample, settled: false }),

+  0,

+  "鏈粨璐﹀疄鏀跺浐瀹?0",

+);

+assert.equal(

+  calcTotalDue({ subtotal: 50, discount: 0, tax: 0, serviceCharge: 0 }),

+  50,

+);

+assert.equal(

+  calcTotalCollected({

+    subtotal: 50,

+    discount: 0,

+    tax: 0,

+    serviceCharge: 0,

+    cardTip: 0,

+    cashTip: 0,

+    settled: true,

+  }),

+  50,

+);

+assert.equal(formatUsd(0), "$0.00");

+assert.equal(formatUsd(116.1), "$116.10");

+assert.equal(formatUsd(Number.NaN), "$0.00");

+

+console.log("verify-order-list-columns: OK");

diff --git a/admin-web/src/config/order-list-amounts.ts b/admin-web/src/config/order-list-amounts.ts
new file mode 100644
index 0000000..12067c5
--- /dev/null
+++ b/admin-web/src/config/order-list-amounts.ts
@@ -0,0 +1,36 @@
+/**
+ * 璁㈠崟鍒楄〃閲戦鍙ｅ緞锛堣璁℃柟妗?v1.1 搂3锛?+ * Total Due 涓嶅惈灏忚垂锛涙湭缁撹处瀹炴敹鍥哄畾 0锛涘凡缁撹处瀹炴敹 = 搴旀敹 + 鍗″皬璐?+ 鐜伴噾灏忚垂銆?+ */
+
+export type OrderAmountInput = {
+  subtotal: number;
+  discount: number;
+  tax: number;
+  serviceCharge: number;
+  cardTip: number;
+  cashTip: number;
+  /** true = 宸茬粨璐?宸叉敹娆撅紱false = 鏈粨璐?*/
+  settled: boolean;
+};
+
+export function calcTotalDue(
+  input: Pick<OrderAmountInput, "subtotal" | "discount" | "tax" | "serviceCharge">,
+): number {
+  return input.subtotal - input.discount + input.tax + input.serviceCharge;
+}
+
+export function calcTotalCollected(
+  input: Pick<
+    OrderAmountInput,
+    "subtotal" | "discount" | "tax" | "serviceCharge" | "cardTip" | "cashTip" | "settled"
+  >,
+): number {
+  if (!input.settled) return 0;
+  return calcTotalDue(input) + input.cardTip + input.cashTip;
+}
+
+export function formatUsd(amount: number): string {
+  const n = Number.isFinite(amount) ? amount : 0;
+  return `$${n.toFixed(2)}`;
+}

```
