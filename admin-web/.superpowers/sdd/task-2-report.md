# Task 2 Report: 金额口径纯函数 + 校验补齐

## Status

**完成** — 金额模块已创建、校验脚本已补齐、验证通过并已提交。

## Commits

| Hash | Message |
|------|---------|
| `7e8443d` | `feat(orders): add order list amount formulas` |

Branch: `feat/order-list-columns`（基于 Task 1 的 `6e34141`）

## Deliverables

### 新建 `src/config/order-list-amounts.ts`

- `OrderAmountInput` — 含 `subtotal`, `discount`, `tax`, `serviceCharge`, `cardTip`, `cashTip`, `settled`
- `calcTotalDue(input)` — 应收 = 小计 − 折扣 + 税 + 服务费（不含小费）
- `calcTotalCollected(input)` — 未结账返回 `0`；已结账 = 应收 + 卡小费 + 现金小费
- `formatUsd(amount)` — 始终 `$X.XX`；非有限数归 `0` → `$0.00`

模块独立，不依赖 `order-list-columns`。

### 更新 `scripts/verify-order-list-columns.ts`

- 保留 Task 1 全部列断言
- 追加 8 条金额断言（116.1 / 136.1 / 未结账 0 / 边界 50 / formatUsd）
- 最终日志改为 `verify-order-list-columns: OK`

## Test Summary

```
npm run verify:order-list-columns
→ verify-order-list-columns: OK
→ exit code 0
```

## Self-Review

| 检查项 | 结果 |
|--------|------|
| 公式与设计方案 v1.1 §3 一致 | ✓ |
| Task 1 接口未破坏 | ✓ |
| 纯函数、无副作用 | ✓ |
| 无导航/列表 UI | ✓ |
| Linter | 无错误 |

## Concerns

无。浮点运算在示例值下断言通过；若后续 UI 展示需与后端对齐，可复用同一模块。

## Files Changed

- `admin-web/src/config/order-list-amounts.ts` (new)
- `admin-web/scripts/verify-order-list-columns.ts` (modified)

## Review Fix (Minor)

**Issue:** `verify-order-list-columns.ts` 全文双空行间距，影响可读性。

**Fix:** 恢复标准 TypeScript 空行（逻辑与断言值未变）；`formatUsd` 未改动。

| Hash | Message |
|------|---------|
| `c593d42` | `style(orders): normalize verify-order-list-columns spacing` |

**Test:** `npm run verify:order-list-columns` → `verify-order-list-columns: OK`, exit 0
