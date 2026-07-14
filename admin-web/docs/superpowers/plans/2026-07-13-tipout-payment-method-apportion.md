# TipOut · 销售额取值「支付方式」分摊 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 TipOut 销售额取值条件与 Tip Claim 取值条件中落地可选多选条件 `paymentMethods`，按「含小费实付占比」分摊营业额类型金额 R：`S_order = R × (P_sel / P_all)`；未配置时 `S_order = R`（向后兼容）。

**Architecture:**  
1) 纯函数模块 `paymentMethodApportion.js` 锁定分摊口径与枚举；  
2) `rule-add.html` 在销售额抽屉 **与** Tip Claim 抽屉同步增删改查 / 落库 / 摘要；  
3) `detail.html` + `TipOut计算公式.md` 同步；  
4) `npx tsx` 校验脚本锁住混合支付示例与边界。本期**不**改小费 / 加收 / 手动上报抽屉，**不**做卡品牌细分与分配页拆账 KPI。

**Tech Stack:** TipOut 原生 JS（`dist/TipOut/`）、HTML 条件抽屉、Node `assert` + `npx tsx`

**Spec:** `docs/项目文档/TipOut-销售额取值-支付方式条件设计方案.md`（v1.0）

## Global Constraints

- 条件 key：`paymentMethods`（`string[]`）
- 枚举 value：`cash` | `credit_card` | `gift_card` | `other`
- 公式：`S_order = roundMoney(R × P_sel / P_all)`；先乘除再 round 到分
- `P_sel` / `P_all`：所选 / 全部 tender 的**含小费**实付合计
- 未配置 / `null` / `[]`：`S_order = R`
- `P_all ≤ 0` 或 `P_sel = 0`：`S_order = 0`
- 无 tender 明细且已配置方法：`S_order = 0`（避免误用整单）
- 作用范围：销售额条件 + Tip Claim 条件；其它抽屉不加
- 与 `orderTipStatus`：先整单过滤，再对本单 R 分摊
- 不改订单中心列表金额公式

---

## File Structure

| 文件 | 职责 |
|------|------|
| `dist/TipOut/paymentMethodApportion.js` | 枚举、标签、`apportionRevenueByPaymentMethods`、`sumTendersByMethods` |
| `dist/TipOut/rule-add.html` | 两处抽屉菜单 / 卡片 / collect / set / 摘要 / hasValid |
| `dist/TipOut/detail.html` | 条件摘要展示 `paymentMethods` |
| `dist/TipOut/docs/TipOut计算公式.md` | 补充支付方式分摊说明 |
| `scripts/verify-payment-method-apportion.ts` | 断言公式与边界 |
| `package.json` | `verify:payment-method-apportion` |
| （可选）设计方案修订记录 v1.1 | 标记已落地 |

---

### Task 1: 纯函数模块 + 校验脚本

**Files:**
- Create: `dist/TipOut/paymentMethodApportion.js`
- Create: `scripts/verify-payment-method-apportion.ts`
- Modify: `package.json`

**Interfaces:**
- Produces（`module.exports` + `window.TipOutPaymentMethodApportion`）:
  - `PAYMENT_METHOD_OPTIONS`: `[{ value, labelZh, labelEn }]`
  - `isPaymentMethodValue(v): boolean`
  - `normalizeSelectedMethods(arr): string[]` — 去重、只保留合法枚举、保序
  - `roundMoney(x): number` — 与 tipAllocation 一致：`Math.round(n * 100) / 100`
  - `sumTendersByMethods(tenders, methods): number` — `methods` 为空则加总全部合法 tender；非法 method 的 tender 仍计入 `P_all` 时归入？**约定**：未知 method 计入 `P_all`，但不计入任何 `P_sel`（除非选了 `other` 且实现期把未知映射到 other——本期未知只进 `P_all`）
  - `apportionRevenueByPaymentMethods({ revenueAmount, tenders, selectedMethods }): number`

`tenders` 形状：`[{ method: 'cash'|'credit_card'|'gift_card'|'other'|string, amount: number }]`，`amount` 含 tip。

- [ ] **Step 1: 写入纯函数模块**

创建 `dist/TipOut/paymentMethodApportion.js`：

```javascript
/**
 * TipOut · 销售额/Tip Claim · 按支付方式分摊营业额类型金额
 *
 * S_order = R × (P_sel / P_all)；P 为含小费实付。
 * 未配置 selectedMethods：返回 R。
 * 计算引擎：对通过其它条件的订单调用本函数得到 S_order 再求和。
 */
(function (root) {
  var PAYMENT_METHOD_OPTIONS = [
    { value: "cash", labelZh: "现金", labelEn: "Cash" },
    { value: "credit_card", labelZh: "信用卡", labelEn: "Credit Card" },
    { value: "gift_card", labelZh: "礼品卡", labelEn: "Gift Card" },
    { value: "other", labelZh: "其他", labelEn: "Other" },
  ];
  var KNOWN = { cash: 1, credit_card: 1, gift_card: 1, other: 1 };

  function num(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function roundMoney(x) {
    var n = Number(x);
    if (isNaN(n)) return 0;
    return Math.round(n * 100) / 100;
  }

  function isPaymentMethodValue(v) {
    return !!KNOWN[v];
  }

  function normalizeSelectedMethods(arr) {
    if (!Array.isArray(arr)) return [];
    var seen = {};
    var out = [];
    arr.forEach(function (v) {
      if (!KNOWN[v] || seen[v]) return;
      seen[v] = 1;
      out.push(v);
    });
    return out;
  }

  function sumTendersByMethods(tenders, methods) {
    var list = tenders || [];
    var filter = methods == null ? null : normalizeSelectedMethods(methods);
    var sum = 0;
    list.forEach(function (t) {
      t = t || {};
      if (filter && filter.length && filter.indexOf(t.method) < 0) return;
      sum += num(t.amount);
    });
    return sum;
  }

  /**
   * @param {{ revenueAmount: number, tenders?: Array<{method:string,amount:number}>, selectedMethods?: string[]|null }} input
   */
  function apportionRevenueByPaymentMethods(input) {
    input = input || {};
    var R = num(input.revenueAmount);
    var selected = normalizeSelectedMethods(input.selectedMethods);
    if (!selected.length) return roundMoney(R);

    var tenders = input.tenders || [];
    // 已配置方法但无任何 tender 行 → 0（避免误用整单）
    if (!tenders.length) return 0;

    var P_all = sumTendersByMethods(tenders, null);
    if (P_all <= 0) return 0;

    var P_sel = sumTendersByMethods(tenders, selected);
    if (P_sel <= 0) return 0;

    return roundMoney((R * P_sel) / P_all);
  }

  function formatPaymentMethodsLabelZh(methods) {
    var sel = normalizeSelectedMethods(methods);
    if (!sel.length) return "";
    var map = {};
    PAYMENT_METHOD_OPTIONS.forEach(function (o) { map[o.value] = o.labelZh; });
    return sel.map(function (v) { return map[v] || v; }).join("、");
  }

  var api = {
    PAYMENT_METHOD_OPTIONS: PAYMENT_METHOD_OPTIONS,
    isPaymentMethodValue: isPaymentMethodValue,
    normalizeSelectedMethods: normalizeSelectedMethods,
    roundMoney: roundMoney,
    sumTendersByMethods: sumTendersByMethods,
    apportionRevenueByPaymentMethods: apportionRevenueByPaymentMethods,
    formatPaymentMethodsLabelZh: formatPaymentMethodsLabelZh,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TipOutPaymentMethodApportion = api;
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 2: 写入校验脚本**

创建 `scripts/verify-payment-method-apportion.ts`（`createRequire` 加载上述模块）：

```typescript
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  apportionRevenueByPaymentMethods,
  normalizeSelectedMethods,
  formatPaymentMethodsLabelZh,
} = require(path.join(root, "dist/TipOut/paymentMethodApportion.js"));

const tenders = [
  { method: "credit_card", amount: 80 },
  { method: "cash", amount: 20 },
];

// 未配置 → 整单 R
assert.equal(apportionRevenueByPaymentMethods({ revenueAmount: 100, tenders, selectedMethods: [] }), 100);
assert.equal(apportionRevenueByPaymentMethods({ revenueAmount: 100, tenders }), 100);

// 设计示例：仅信用卡 → 80
assert.equal(
  apportionRevenueByPaymentMethods({ revenueAmount: 100, tenders, selectedMethods: ["credit_card"] }),
  80,
);

// 多选卡+现金 → 100
assert.equal(
  apportionRevenueByPaymentMethods({
    revenueAmount: 100,
    tenders,
    selectedMethods: ["credit_card", "cash"],
  }),
  100,
);

// P_sel = 0
assert.equal(
  apportionRevenueByPaymentMethods({ revenueAmount: 100, tenders, selectedMethods: ["gift_card"] }),
  0,
);

// 已配置但无 tender
assert.equal(
  apportionRevenueByPaymentMethods({ revenueAmount: 100, tenders: [], selectedMethods: ["cash"] }),
  0,
);

// P_all ≤ 0
assert.equal(
  apportionRevenueByPaymentMethods({
    revenueAmount: 100,
    tenders: [{ method: "cash", amount: 0 }],
    selectedMethods: ["cash"],
  }),
  0,
);

// 含 tip 实付进占比：R=90，卡 80+tip15=95，现金 20 → 仅卡
assert.equal(
  apportionRevenueByPaymentMethods({
    revenueAmount: 90,
    tenders: [
      { method: "credit_card", amount: 95 },
      { method: "cash", amount: 20 },
    ],
    selectedMethods: ["credit_card"],
  }),
  Number(((90 * 95) / 115).toFixed(2)), // roundMoney 等价
);

assert.deepEqual(normalizeSelectedMethods(["cash", "cash", "nope"]), ["cash"]);
assert.equal(formatPaymentMethodsLabelZh(["credit_card", "cash"]), "信用卡、现金");

console.log("verify-payment-method-apportion: OK");
```

注意：`(90 * 95) / 115` 的 `roundMoney` 结果用模块自身再算一次并对 assert，避免手算误差：

```typescript
const expected = apportionRevenueByPaymentMethods({
  revenueAmount: 90,
  tenders: [
    { method: "credit_card", amount: 95 },
    { method: "cash", amount: 20 },
  ],
  selectedMethods: ["credit_card"],
});
assert.equal(expected, 74.35); // Math.round(74.3478... * 100) / 100
```

先在 Step 2 用 `node -e` 或直接跑脚本确认 74.35；若不同以 `roundMoney` 实际值为准写入 assert。

- [ ] **Step 3: 注册 npm script**

```json
"verify:payment-method-apportion": "npx tsx scripts/verify-payment-method-apportion.ts"
```

- [ ] **Step 4: 运行校验**

Run: `npm run verify:payment-method-apportion`  
Expected: `verify-payment-method-apportion: OK`，exit `0`

- [ ] **Step 5: Commit**（仅当用户要求提交时）

---

### Task 2: 销售额 + Tip Claim 条件 UI 与落库

**Files:**
- Modify: `dist/TipOut/rule-add.html`
- 引入：`<script src="paymentMethodApportion.js"></script>`（紧挨 `orderTipStatus.js`）

**改动点（销售额 `sales*` 与 Tip Claim `tcc*` / `addTipClaimSalesCondition` 两套都要改）：**

| 位置 | 改动 |
|------|------|
| `#salesConditionMenu` | 增加「支付方式」`data-type="paymentMethods"` |
| `#tipClaimConditionMenu` | 同上 |
| `addSalesCondition` / `addTipClaimSalesCondition` | `names.paymentMethods = '支付方式'`；body 为 4 个 checkbox（value 用枚举）；说明文案见下 |
| `collectSalesConditions` / `collectTipClaimSalesConditions` | 收集勾选 → `cond.paymentMethods = normalizeSelectedMethods(...)`；空则不写 key |
| `setSalesConditionValue` / `setTipClaimSalesConditionValue` | 按数组勾选 checkbox |
| `sortPoolConditionLoadKeys` `preferred` | 在 `orderTipStatus` 后插入 `'paymentMethods'` |
| `formatSalesCondForDisplay` | 有数组时：`支付方式: ` + `formatPaymentMethodsLabelZh(...)` |
| Tip Claim 行条件摘要 | 若复用 `formatSalesCondForDisplay` 则自动带上；否则同步补一行 |
| `hasValidConditions`（sales） | `paymentMethods` 非空合法数组视为有效 |
| Tip Claim 有效性 | 若有独立校验，同样认 `paymentMethods` |

**说明文案（卡片底部）：**

```text
混合支付按所选方式实付占比分摊营业额类型金额；实付含小费。例：R=100，卡80+现金20，仅选信用卡则计80。
```

**卡片 body 示意（销售额；Tip Claim 用不同 name 前缀避免冲突，如 `tccPaymentMethods`）：**

```html
<div class="drawer-form-row" style="flex-direction:column;align-items:flex-start;gap:8px">
  <label><input type="checkbox" class="sales-payment-method-cb" value="cash"> 现金</label>
  <label><input type="checkbox" class="sales-payment-method-cb" value="credit_card"> 信用卡</label>
  <label><input type="checkbox" class="sales-payment-method-cb" value="gift_card"> 礼品卡</label>
  <label><input type="checkbox" class="sales-payment-method-cb" value="other"> 其他（券兑换、积分兑换）</label>
  <div style="font-size:12px;color:var(--text-tertiary)">…说明…</div>
</div>
```

`loadSalesConditionsForRule` / `loadTipClaimSalesConditionsForClaim`：key 即为 `paymentMethods`，走现有 `add*(type)` + `set*(type, cond.paymentMethods)` 即可。未知 type 需在 add 分支有完整实现（参考 `orderTipStatus` 的 `else { return; }`）。

- [ ] **Step 1: 引入脚本 + 两处菜单项**

- [ ] **Step 2: add / remove / collect / set（销售额 + Tip Claim）**

- [ ] **Step 3: 摘要、preferred、hasValid**

- [ ] **Step 4: 手工冒烟**

1. 销售额抽屉：可加「支付方式」，多选信用卡，摘要显示「支付方式: 信用卡」  
2. 保存 / 重开回显正确；删除卡片后字段消失  
3. Tip Claim 抽屉同样可配置且互不串值  
4. 小费 / 加收 / 手动上报抽屉**无**「支付方式」  
5. 与「订单小费状态」可同时存在  

- [ ] **Step 5: Commit**（仅当用户要求）

---

### Task 3: detail 摘要 + 公式文档

**Files:**
- Modify: `dist/TipOut/detail.html`（条件 format 函数，在 `revenueType` / `orderTipStatus` 旁增加 `paymentMethods`）
- Modify: `dist/TipOut/docs/TipOut计算公式.md`

- [ ] **Step 1: detail 展示**

与 rule-add 一致：`支付方式: 信用卡、现金`。

- [ ] **Step 2: 更新计算公式文档**

在「符合条件的总销售额」/ 订单小费状态一节后追加：

```markdown
### 支付方式（可选，金额分摊）

若配置了 `paymentMethods`（多选）：

```
S_order = R × (P_sel / P_all)
```

- `R`：本单营业额类型金额
- `P_sel` / `P_all`：所选 / 全部支付方式的含小费实付
- 未配置：`S_order = R`
- `P_all ≤ 0` 或 `P_sel = 0` 或无 tender 明细：`S_order = 0`

与 `orderTipStatus` 组合：先整单过滤，再对通过订单做支付分摊。

实现：`paymentMethodApportion.js` → `apportionRevenueByPaymentMethods`。
```

- [ ] **Step 3: 再跑校验**

Run: `npm run verify:payment-method-apportion`

- [ ] **Step 4: Commit**（仅当用户要求）

---

### Task 4: 回归与验收对照

对照设计方案 §六：

| # | 验收项 | 验证方式 |
|---|--------|----------|
| 1 | 销售额 + Tip Claim 可配；其它抽屉无 | Task 2 冒烟 |
| 2 | 未配置 → `S_order = R` | verify 脚本 |
| 3 | 混合支付仅卡 → 80 | verify 脚本 |
| 4 | `P_all≤0` / `P_sel=0` → 0 | verify 脚本 |
| 5 | 多选累加 P_sel | verify 脚本 |
| 6 | 可与 orderTipStatus、revenueType 同存 | Task 2 冒烟 |
| 7 | 摘要与回显 | Task 2 / detail |

- [ ] **Step 1: 跑校验**

```bash
npm run verify:payment-method-apportion
npm run verify:order-tip-status
```

- [ ] **Step 2: 勾选上表全部通过**

- [ ] **Step 3:（可选）设计方案 §八 增加 v1.1 落地记录**

---

## 非目标（禁止扩大范围）

- 小费 / 加收 / 手动上报抽屉加支付方式  
- Visa/Amex 等卡品牌拆分  
- 券 / 积分从 `other` 再拆  
- 分配明细按支付方式 KPI  
- 完整服务端订单汇总引擎接线（仅纯函数契约；有引擎时调用 `apportionRevenueByPaymentMethods`）  
- 修改 `orderTipStatus` 既有行为  

---

## 执行顺序

```text
Task 1（纯函数 + verify）→ Task 2（双抽屉 UI）→ Task 3（detail + 文档）→ Task 4（验收）
```

完成后询问用户是否开始按 Task 执行落地。
