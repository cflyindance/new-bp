### Task 1: 表头字段元数据模块

**Files:**
- Create: `src/config/order-list-columns.ts`
- Test: `scripts/verify-order-list-columns.ts`（本任务先写列相关断言；金额断言在 Task 2 补齐）
- Modify: `package.json`（scripts）

**Interfaces:**
- Consumes: 无
- Produces:
  - `OrderListColumnKey`（19 个字面量联合）
  - `OrderListColumnDef`：`{ key, order, titleZh, titleEn, defaultVisible }`
  - `ORDER_LIST_COLUMNS: readonly OrderListColumnDef[]`（按 `order` 升序，长度 19）
  - `getDefaultVisibleColumns(): OrderListColumnDef[]`（13 项）
  - `getOptionalColumns(): OrderListColumnDef[]`（6 项）

- [ ] **Step 1: 写入列元数据模块**

创建 `src/config/order-list-columns.ts`：

```typescript
/**
 * 订单中心 · 订单列表表头字段（设计方案 v1.1）
 * 首期无列设置时仅渲染 defaultVisible === true 的列。
 */

export type OrderListColumnKey =
  | "orderNumber"
  | "status"
  | "orderType"
  | "tableOrPickupNo"
  | "subtotal"
  | "totalDue"
  | "totalCollected"
  | "cardTip"
  | "cashTip"
  | "serviceCharge"
  | "tax"
  | "serverName"
  | "openedAt"
  | "closerName"
  | "closedAt"
  | "paymentMethodSummary"
  | "discount"
  | "guestCount"
  | "storeName";

export type OrderListColumnDef = {
  key: OrderListColumnKey;
  /** 建议列序，从 1 开始 */
  order: number;
  titleZh: string;
  titleEn: string;
  defaultVisible: boolean;
};

export const ORDER_LIST_COLUMNS: readonly OrderListColumnDef[] = [
  { key: "orderNumber", order: 1, titleZh: "订单号", titleEn: "Order #", defaultVisible: true },
  { key: "status", order: 2, titleZh: "订单状态", titleEn: "Status", defaultVisible: true },
  { key: "orderType", order: 3, titleZh: "订单类型", titleEn: "Order Type", defaultVisible: true },
  { key: "tableOrPickupNo", order: 4, titleZh: "桌号/取餐号", titleEn: "Table / Pickup #", defaultVisible: true },
  { key: "subtotal", order: 5, titleZh: "菜品小计", titleEn: "Subtotal", defaultVisible: true },
  { key: "totalDue", order: 6, titleZh: "应收总额", titleEn: "Total Due", defaultVisible: true },
  { key: "totalCollected", order: 7, titleZh: "实收总额", titleEn: "Total Collected", defaultVisible: true },
  { key: "cardTip", order: 8, titleZh: "信用卡小费", titleEn: "Card Tip", defaultVisible: true },
  { key: "cashTip", order: 9, titleZh: "现金小费", titleEn: "Cash Tip", defaultVisible: true },
  { key: "serviceCharge", order: 10, titleZh: "加收服务费", titleEn: "Service Charge", defaultVisible: true },
  { key: "tax", order: 11, titleZh: "税", titleEn: "Tax", defaultVisible: true },
  { key: "serverName", order: 12, titleZh: "开单服务员", titleEn: "Server", defaultVisible: true },
  { key: "openedAt", order: 13, titleZh: "开单时间", titleEn: "Opened At", defaultVisible: true },
  { key: "closerName", order: 14, titleZh: "结账员", titleEn: "Closer", defaultVisible: false },
  { key: "closedAt", order: 15, titleZh: "结账时间", titleEn: "Closed At", defaultVisible: false },
  { key: "paymentMethodSummary", order: 16, titleZh: "支付方式", titleEn: "Payment", defaultVisible: false },
  { key: "discount", order: 17, titleZh: "折扣金额", titleEn: "Discount", defaultVisible: false },
  { key: "guestCount", order: 18, titleZh: "人数", titleEn: "Guests", defaultVisible: false },
  { key: "storeName", order: 19, titleZh: "门店", titleEn: "Store", defaultVisible: false },
] as const;

export function getDefaultVisibleColumns(): OrderListColumnDef[] {
  return ORDER_LIST_COLUMNS.filter((c) => c.defaultVisible);
}

export function getOptionalColumns(): OrderListColumnDef[] {
  return ORDER_LIST_COLUMNS.filter((c) => !c.defaultVisible);
}
```

- [ ] **Step 2: 写入列校验脚本（列部分）**

创建 `scripts/verify-order-list-columns.ts`：

```typescript
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
```

- [ ] **Step 3: 注册 npm script**

在 `package.json` 的 `scripts` 中增加（保持 JSON 合法逗号）：

```json
"verify:order-list-columns": "npx tsx scripts/verify-order-list-columns.ts"
```

- [ ] **Step 4: 运行校验（应通过列断言）**

Run: `npm run verify:order-list-columns`

Expected: 打印 `verify-order-list-columns: columns OK`，exit code `0`

- [ ] **Step 5: Commit**

```bash
git add src/config/order-list-columns.ts scripts/verify-order-list-columns.ts package.json
git commit -m "$(cat <<'EOF'
feat(orders): add order list column field catalog

Codify the 19 US restaurant order-list headers with default/optional visibility for later list UI.
EOF
)"
```

---
