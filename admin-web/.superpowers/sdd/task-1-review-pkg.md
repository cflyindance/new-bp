# Review Package Task 1
BASE: d5ce2f007949f99a2097b1b21e965ade5653fe36
HEAD: 6e3414190c55949b86da8cf3632cecaf3467a260

## Commits
```
6e34141 feat(orders): add order list column field catalog

```
## Diff stat
```
 admin-web/package.json                         |  3 +-
 admin-web/scripts/verify-order-list-columns.ts | 82 ++++++++++++++++++++++++++
 admin-web/src/config/order-list-columns.ts     | 64 ++++++++++++++++++++
 3 files changed, 148 insertions(+), 1 deletion(-)

```
## Full diff
```diff
diff --git a/admin-web/package.json b/admin-web/package.json
index 42bb70c..cffd9d4 100644
--- a/admin-web/package.json
+++ b/admin-web/package.json
@@ -11,18 +11,19 @@
     "preview": "vite preview",
     "generate:settings-groups": "node scripts/generate-settings-group-mapping.mjs",
     "generate:foh-line-scope": "node scripts/generate-foh-line-scope-matrix.mjs && node scripts/generate-foh-line-storage-registry.mjs",
     "verify:foh-line-scope": "node scripts/verify-foh-line-scope.mjs",
     "build:settings-catalog": "node scripts/verify-foh-line-scope.mjs && node scripts/build-module-settings-catalog.mjs",
     "verify:platform-preset-tree": "node scripts/verify-platform-preset-tree.mjs",
   "verify:foh-platform-preset-l3": "npx tsx scripts/verify-foh-platform-preset-l3.ts",
     "generate:platform-preset-tree": "npx tsx scripts/generate-platform-preset-tree-export.ts",
     "sync:emenu-pro": "node scripts/sync-emenu-pro-from-dist.mjs",
     "generate:emenu-pro-icons": "node scripts/generate-emenu-pro-block-icons.mjs",
-    "generate:default-material-images": "npx tsx scripts/generate-default-material-images-js.mjs"
+    "generate:default-material-images": "npx tsx scripts/generate-default-material-images-js.mjs",
+    "verify:order-list-columns": "npx tsx scripts/verify-order-list-columns.ts"
   },
   "devDependencies": {
     "@tailwindcss/vite": "^4.0.0",
     "typescript": "~5.6.0",
     "vite": "^6.0.0"
   }
 }
diff --git a/admin-web/scripts/verify-order-list-columns.ts b/admin-web/scripts/verify-order-list-columns.ts
new file mode 100644
index 0000000..647b79a
--- /dev/null
+++ b/admin-web/scripts/verify-order-list-columns.ts
@@ -0,0 +1,82 @@
+/**
+ * 璁㈠崟鍒楄〃琛ㄥご瀛楁 / 閲戦鍙ｅ緞鏍￠獙锛堣璁℃柟妗?v1.1锛?+ * 杩愯锛歯px tsx scripts/verify-order-list-columns.ts
+ * 鎴栵細npm run verify:order-list-columns
+ */
+import assert from "node:assert/strict";
+import {
+  ORDER_LIST_COLUMNS,
+  getDefaultVisibleColumns,
+  getOptionalColumns,
+} from "../src/config/order-list-columns";
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
+console.log("verify-order-list-columns: columns OK");
diff --git a/admin-web/src/config/order-list-columns.ts b/admin-web/src/config/order-list-columns.ts
new file mode 100644
index 0000000..b8132e5
--- /dev/null
+++ b/admin-web/src/config/order-list-columns.ts
@@ -0,0 +1,64 @@
+/**
+ * 璁㈠崟涓績 路 璁㈠崟鍒楄〃琛ㄥご瀛楁锛堣璁℃柟妗?v1.1锛?+ * 棣栨湡鏃犲垪璁剧疆鏃朵粎娓叉煋 defaultVisible === true 鐨勫垪銆?+ */
+
+export type OrderListColumnKey =
+  | "orderNumber"
+  | "status"
+  | "orderType"
+  | "tableOrPickupNo"
+  | "subtotal"
+  | "totalDue"
+  | "totalCollected"
+  | "cardTip"
+  | "cashTip"
+  | "serviceCharge"
+  | "tax"
+  | "serverName"
+  | "openedAt"
+  | "closerName"
+  | "closedAt"
+  | "paymentMethodSummary"
+  | "discount"
+  | "guestCount"
+  | "storeName";
+
+export type OrderListColumnDef = {
+  key: OrderListColumnKey;
+  /** 寤鸿鍒楀簭锛屼粠 1 寮€濮?*/
+  order: number;
+  titleZh: string;
+  titleEn: string;
+  defaultVisible: boolean;
+};
+
+export const ORDER_LIST_COLUMNS: readonly OrderListColumnDef[] = [
+  { key: "orderNumber", order: 1, titleZh: "璁㈠崟鍙?, titleEn: "Order #", defaultVisible: true },
+  { key: "status", order: 2, titleZh: "璁㈠崟鐘舵€?, titleEn: "Status", defaultVisible: true },
+  { key: "orderType", order: 3, titleZh: "璁㈠崟绫诲瀷", titleEn: "Order Type", defaultVisible: true },
+  { key: "tableOrPickupNo", order: 4, titleZh: "妗屽彿/鍙栭鍙?, titleEn: "Table / Pickup #", defaultVisible: true },
+  { key: "subtotal", order: 5, titleZh: "鑿滃搧灏忚", titleEn: "Subtotal", defaultVisible: true },
+  { key: "totalDue", order: 6, titleZh: "搴旀敹鎬婚", titleEn: "Total Due", defaultVisible: true },
+  { key: "totalCollected", order: 7, titleZh: "瀹炴敹鎬婚", titleEn: "Total Collected", defaultVisible: true },
+  { key: "cardTip", order: 8, titleZh: "淇＄敤鍗″皬璐?, titleEn: "Card Tip", defaultVisible: true },
+  { key: "cashTip", order: 9, titleZh: "鐜伴噾灏忚垂", titleEn: "Cash Tip", defaultVisible: true },
+  { key: "serviceCharge", order: 10, titleZh: "鍔犳敹鏈嶅姟璐?, titleEn: "Service Charge", defaultVisible: true },
+  { key: "tax", order: 11, titleZh: "绋?, titleEn: "Tax", defaultVisible: true },
+  { key: "serverName", order: 12, titleZh: "寮€鍗曟湇鍔″憳", titleEn: "Server", defaultVisible: true },
+  { key: "openedAt", order: 13, titleZh: "寮€鍗曟椂闂?, titleEn: "Opened At", defaultVisible: true },
+  { key: "closerName", order: 14, titleZh: "缁撹处鍛?, titleEn: "Closer", defaultVisible: false },
+  { key: "closedAt", order: 15, titleZh: "缁撹处鏃堕棿", titleEn: "Closed At", defaultVisible: false },
+  { key: "paymentMethodSummary", order: 16, titleZh: "鏀粯鏂瑰紡", titleEn: "Payment", defaultVisible: false },
+  { key: "discount", order: 17, titleZh: "鎶樻墸閲戦", titleEn: "Discount", defaultVisible: false },
+  { key: "guestCount", order: 18, titleZh: "浜烘暟", titleEn: "Guests", defaultVisible: false },
+  { key: "storeName", order: 19, titleZh: "闂ㄥ簵", titleEn: "Store", defaultVisible: false },
+] as const;
+
+export function getDefaultVisibleColumns(): OrderListColumnDef[] {
+  return ORDER_LIST_COLUMNS.filter((c) => c.defaultVisible);
+}
+
+export function getOptionalColumns(): OrderListColumnDef[] {
+  return ORDER_LIST_COLUMNS.filter((c) => !c.defaultVisible);
+}

```
