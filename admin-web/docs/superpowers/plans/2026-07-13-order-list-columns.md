# 订单中心 · 订单列表表头字段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已确认的订单列表表头字段与金额口径落地为可复用的 TypeScript 配置模块，并用校验脚本锁住 19 列 / 默认 13 列 / 金额公式。

**Architecture:** 在 `src/config/` 新增两个纯数据/纯函数模块——`order-list-columns.ts`（字段元数据）与 `order-list-amounts.ts`（应收/实收计算与金额格式化）。用 `scripts/verify-order-list-columns.ts`（`npx tsx`）做断言校验，对齐仓库现有 verify 脚本习惯。本期**不**改导航、不建列表页、不做列设置 UI（见设计方案 §7）。

**Tech Stack:** TypeScript、Vite 工程内 `src/config`、`npx tsx` 校验脚本、Node `assert`

**Spec:** `docs/项目文档/订单中心-订单列表表头字段设计方案.md`（v1.1）

## Global Constraints

- 字段全集 **19** 列；默认显示 **13**；可选 **6**
- `Total Due = subtotal − discount + tax + serviceCharge`（不含小费）
- 已结账：`Total Collected = Total Due + cardTip + cashTip`
- 未结账：`Total Collected = 0`
- Service Charge 与 Card Tip / Cash Tip 分列；Server 与 Closer 分列；Opened At 与 Closed At 分列
- 金额展示：USD、2 位小数；空/无记为 `$0.00`
- 不实现滑层入口、筛选、详情、列设置交互

---

## File Structure

| 文件 | 职责 |
|------|------|
| `src/config/order-list-columns.ts` | 19 列表头元数据、`getDefaultVisibleColumns()`、`getOptionalColumns()` |
| `src/config/order-list-amounts.ts` | `calcTotalDue` / `calcTotalCollected` / `formatUsd` |
| `scripts/verify-order-list-columns.ts` | 断言列数、key、默认集、金额公式与边界 |
| `package.json` | 增加 `verify:order-list-columns` script |

---

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

### Task 2: 金额口径纯函数 + 校验补齐

**Files:**
- Create: `src/config/order-list-amounts.ts`
- Modify: `scripts/verify-order-list-columns.ts`（追加金额断言）

**Interfaces:**
- Consumes: 无（不依赖 columns 模块）
- Produces:
  - `OrderAmountInput`：`{ subtotal, discount, tax, serviceCharge, cardTip, cashTip, settled }`
  - `calcTotalDue(input): number`
  - `calcTotalCollected(input): number`
  - `formatUsd(amount: number): string` → 始终 `"$X.XX"`（含 `$0.00`）

- [ ] **Step 1: 写入金额模块**

创建 `src/config/order-list-amounts.ts`：

```typescript
/**
 * 订单列表金额口径（设计方案 v1.1 §3）
 * Total Due 不含小费；未结账实收固定 0；已结账实收 = 应收 + 卡小费 + 现金小费。
 */

export type OrderAmountInput = {
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  cardTip: number;
  cashTip: number;
  /** true = 已结账/已收款；false = 未结账 */
  settled: boolean;
};

export function calcTotalDue(
  input: Pick<OrderAmountInput, "subtotal" | "discount" | "tax" | "serviceCharge">,
): number {
  return input.subtotal - input.discount + input.tax + input.serviceCharge;
}

export function calcTotalCollected(
  input: Pick<
    OrderAmountInput,
    "subtotal" | "discount" | "tax" | "serviceCharge" | "cardTip" | "cashTip" | "settled"
  >,
): number {
  if (!input.settled) return 0;
  return calcTotalDue(input) + input.cardTip + input.cashTip;
}

export function formatUsd(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `$${n.toFixed(2)}`;
}
```

- [ ] **Step 2: 在校验脚本末尾追加金额断言**

在 `scripts/verify-order-list-columns.ts` 增加 import，并在 `console.log("... columns OK")` **之前**加入：

```typescript
import {
  calcTotalDue,
  calcTotalCollected,
  formatUsd,
} from "../src/config/order-list-amounts";

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
```

并将最后一行日志改为：

```typescript
console.log("verify-order-list-columns: OK");
```

- [ ] **Step 3: 运行校验**

Run: `npm run verify:order-list-columns`

Expected: 打印 `verify-order-list-columns: OK`，exit code `0`

- [ ] **Step 4: Commit**

```bash
git add src/config/order-list-amounts.ts scripts/verify-order-list-columns.ts
git commit -m "$(cat <<'EOF'
feat(orders): add order list amount formulas

Lock Total Due / Total Collected rules including unpaid collected = 0.
EOF
)"
```

---

## Spec Coverage Checklist

| 规格要求 | 任务 |
|----------|------|
| 19 列中英名 + key + 列序 | Task 1 |
| 默认 13 / 可选 6 | Task 1 |
| Server≠Closer、Opened≠Closed、Service Charge≠Tip | Task 1 断言 |
| Total Due 公式（不含小费） | Task 2 |
| 已结账实收 = 应收 + 双小费 | Task 2 |
| 未结账实收 = 0 | Task 2 |
| `$0.00` 金额格式 | Task 2 `formatUsd` |
| 首期仅默认 13 列（API 层） | Task 1 `getDefaultVisibleColumns` |
| 滑层入口 / 列表页 / 筛选 / 详情 | **明确不做**（§7） |

---

## Out of Scope（执行时勿擅自扩大）

- `navigation.ts` 增加「订单列表」子项
- `/orders/all` 取消重定向并渲染页面
- 列设置 UI、筛选、分页、详情抽屉
- `status` / `orderType` 产品枚举字典
