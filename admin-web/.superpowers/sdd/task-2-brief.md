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
