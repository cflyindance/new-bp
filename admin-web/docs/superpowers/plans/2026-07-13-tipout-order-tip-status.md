# TipOut · 销售额取值「订单小费状态」Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 TipOut「销售额」池规则的销售额取值条件中落地可选条件 `orderTipStatus`（含小费 / 不含小费），使店主可按「已付小费营业总额 × 计提占比（如 2.5%）」计提扣点；未配置时行为与线上一致。

**Architecture:**  
1) 纯函数模块锁定判定口径（卡或现金小费 > 0 = 含小费；Service Charge 不计）；  
2) 仅改 `rule-add.html` 销售额条件抽屉的增删改查与落库；  
3) 规则摘要展示与公式文档同步；  
4) 用 `npx tsx` 校验脚本锁住判定与过滤语义。本期**不**改小费 / 加收 / Tip Claim 抽屉，**不**做分配页拆账 KPI，**不**新增营业额类型枚举。

**Tech Stack:** TipOut 原生 JS（`dist/TipOut/`）、HTML 条件抽屉、Node `assert` + `npx tsx` 校验脚本

**Spec:** `docs/项目文档/TipOut-销售额取值-含小费订单条件设计方案.md`（v1.0）

## Global Constraints

- 条件 key：`orderTipStatus`；枚举：`has_tip` | `no_tip`
- 含小费：`(cardTip > 0) || (cashTip > 0)`；**不含** Service Charge
- 金额仍跟既有 `revenueType`（Net Sales / Gross Sales）；本条件只过滤订单集合
- **仅**销售额取值条件抽屉；其它条件抽屉不加菜单项
- 未配置 / 空值：不过滤（向后兼容）
- 同规则该条件最多 1 个；可删除
- 2.5% 仍用规则「按销售额占比」计提比例，不新增字段
- 不改订单中心列表金额公式

---

## File Structure

| 文件 | 职责 |
|------|------|
| `dist/TipOut/orderTipStatus.js` | 纯函数：`hasPaidTip` / `matchOrderTipStatus` / `filterOrdersByTipStatus` |
| `dist/TipOut/rule-add.html` | 销售额条件菜单、卡片、collect/set/load、摘要、`hasValidConditions` |
| `dist/TipOut/docs/TipOut计算公式.md` | 补充「符合条件销售额」含可选小费状态过滤 |
| `scripts/verify-order-tip-status.ts` | 断言判定与过滤边界 |
| `package.json` | 增加 `verify:order-tip-status` script |
| （可选）`dist/TipOut/detail.html` | 若规则详情复用条件摘要且未走 `formatSalesCondForDisplay`，补展示 |

---

### Task 1: 纯函数模块 + 校验脚本

**Files:**
- Create: `dist/TipOut/orderTipStatus.js`
- Create: `scripts/verify-order-tip-status.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: 无
- Produces（挂到 `window.TipOutOrderTipStatus` 或 `module.exports`，便于页面与 Node 校验共用）:
  - `hasPaidTip(order): boolean` — `Number(cardTip\|\|0) > 0 || Number(cashTip\|\|0) > 0`
  - `matchOrderTipStatus(order, status): boolean` — `status` 空/`undefined` → `true`；`has_tip` / `no_tip` 按上式；非法 status → `true`（保守不过滤，避免脏数据整池归零；校验脚本需断言）
  - `filterOrdersByTipStatus(orders, status): Order[]` — 过滤包装

订单输入最小形状：`{ cardTip?: number, cashTip?: number, serviceCharge?: number }`（`serviceCharge` 仅用于断言「有服务费仍可 no_tip」）。

- [ ] **Step 1: 写入纯函数模块**

创建 `dist/TipOut/orderTipStatus.js`：

```javascript
(function (root) {
  function num(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function hasPaidTip(order) {
    order = order || {};
    return num(order.cardTip) > 0 || num(order.cashTip) > 0;
  }

  /**
   * @param {object} order
   * @param {string|null|undefined} status - 'has_tip' | 'no_tip' | 空
   * @returns {boolean} 订单是否通过小费状态条件
   */
  function matchOrderTipStatus(order, status) {
    if (status == null || status === "") return true;
    if (status === "has_tip") return hasPaidTip(order);
    if (status === "no_tip") return !hasPaidTip(order);
    return true;
  }

  function filterOrdersByTipStatus(orders, status) {
    orders = orders || [];
    return orders.filter(function (o) {
      return matchOrderTipStatus(o, status);
    });
  }

  var api = { hasPaidTip: hasPaidTip, matchOrderTipStatus: matchOrderTipStatus, filterOrdersByTipStatus: filterOrdersByTipStatus };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TipOutOrderTipStatus = api;
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 2: 写入校验脚本**

创建 `scripts/verify-order-tip-status.ts`（用 `createRequire` 加载上述 CJS 模块，或把断言逻辑内联复制后对照 — **优先** `createRequire` 加载 `dist/TipOut/orderTipStatus.js`）：

```typescript
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { hasPaidTip, matchOrderTipStatus, filterOrdersByTipStatus } = require(
  path.join(root, "dist/TipOut/orderTipStatus.js"),
);

assert.equal(hasPaidTip({ cardTip: 1, cashTip: 0 }), true);
assert.equal(hasPaidTip({ cardTip: 0, cashTip: 2 }), true);
assert.equal(hasPaidTip({ cardTip: 0, cashTip: 0, serviceCharge: 10 }), false);
assert.equal(hasPaidTip({}), false);

assert.equal(matchOrderTipStatus({ cardTip: 1 }, undefined), true);
assert.equal(matchOrderTipStatus({ cardTip: 0, cashTip: 0 }, "has_tip"), false);
assert.equal(matchOrderTipStatus({ cardTip: 1 }, "has_tip"), true);
assert.equal(matchOrderTipStatus({ cardTip: 0, cashTip: 0 }, "no_tip"), true);
assert.equal(matchOrderTipStatus({ cashTip: 3 }, "no_tip"), false);
assert.equal(matchOrderTipStatus({ cardTip: 1 }, "weird"), true);

const orders = [
  { id: "a", cardTip: 5, cashTip: 0, amount: 100 },
  { id: "b", cardTip: 0, cashTip: 0, amount: 200 },
  { id: "c", cardTip: 0, cashTip: 1, amount: 50 },
];
assert.deepEqual(
  filterOrdersByTipStatus(orders, "has_tip").map((o: { id: string }) => o.id),
  ["a", "c"],
);
assert.deepEqual(
  filterOrdersByTipStatus(orders, "no_tip").map((o: { id: string }) => o.id),
  ["b"],
);
assert.equal(filterOrdersByTipStatus(orders, "").length, 3);

// 模拟：已付小费营业总额 × 2.5%
const tipped = filterOrdersByTipStatus(orders, "has_tip");
const base = tipped.reduce((s: number, o: { amount: number }) => s + o.amount, 0);
assert.equal(base, 150);
assert.equal(Number((base * 0.025).toFixed(2)), 3.75);

console.log("verify-order-tip-status: OK");
```

- [ ] **Step 3: 注册 npm script**

在 `package.json` 的 `scripts` 中增加：

```json
"verify:order-tip-status": "npx tsx scripts/verify-order-tip-status.ts"
```

- [ ] **Step 4: 运行校验**

Run: `npm run verify:order-tip-status`

Expected: 打印 `verify-order-tip-status: OK`，exit code `0`

- [ ] **Step 5: Commit**（若用户要求提交再执行）

```bash
git add dist/TipOut/orderTipStatus.js scripts/verify-order-tip-status.ts package.json
git commit -m "$(cat <<'EOF'
feat(tipout): add order tip status match helpers

Lock has_tip/no_tip order filtering for tipped-sales tip-out base.
EOF
)"
```

---

### Task 2: 销售额条件抽屉 UI + 落库

**Files:**
- Modify: `dist/TipOut/rule-add.html`
- 在 `<head>` 或脚本区引入：`<script src="orderTipStatus.js"></script>`（路径与同目录其它脚本一致）

**改动点清单（均只动销售额路径，勿复制到 tipClaim / tips / surcharge / manual）：**

| 位置 | 改动 |
|------|------|
| `#salesConditionMenu` | 增加菜单项：`data-type="orderTipStatus"`，文案「订单小费状态」，`onclick="addSalesCondition('orderTipStatus')"` |
| `addSalesCondition` 的 `names` | 增加 `orderTipStatus: '订单小费状态'` |
| `addSalesCondition` body | `type === 'orderTipStatus'` 时渲染单选：`has_tip` / `no_tip`（中文：含小费 / 不含小费）；可加一行小字说明「卡或现金小费>0 为含小费；不含加收服务费」 |
| `removeSalesCondition` | 允许删除（非 `revenueType` 锁定类即可） |
| `collectSalesConditions` | 读取选中 radio → `cond.orderTipStatus = 'has_tip' \| 'no_tip'`；未选则不写或写 `''` |
| `setSalesConditionValue` | `orderTipStatus` 时勾选对应 radio |
| `sortPoolConditionLoadKeys` 的 `preferred` | 在 `revenueType` 后插入 `'orderTipStatus'` |
| `formatSalesCondForDisplay` | `cond.orderTipStatus === 'has_tip'` → `订单小费状态: 含小费`；`no_tip` → `不含小费` |
| `hasValidConditions`（sales） | `cond.orderTipStatus` 为 `has_tip` 或 `no_tip` 时视为有效条件之一（可与仅配小费状态的规则兼容） |
| `updateSalesConditionMenu` | 已有「已添加则隐藏」逻辑即可（`existingSalesConditions[type]`） |

`loadSalesConditionsForRule`：因 key 名即 `orderTipStatus`，走现有 `addSalesCondition(type)` + `setSalesConditionValue(type, cond[type])` 即可，**无需**像 `weekdays` 那样特殊映射；确认不会把未知 key 误加——`orderTipStatus` 必须在 `addSalesCondition` 有完整分支，否则空卡片。

UI 示意（卡片 body）：

```html
<div class="drawer-form-row" style="flex-direction:column;align-items:flex-start;gap:8px">
  <label><input type="radio" name="salesOrderTipStatus" value="has_tip"> 含小费</label>
  <label><input type="radio" name="salesOrderTipStatus" value="no_tip"> 不含小费</label>
  <div style="font-size:12px;color:var(--text-tertiary)">卡小费或现金小费 &gt; $0 视为含小费；加收服务费不计。</div>
</div>
```

- [ ] **Step 1: 引入脚本 + 菜单项**

- [ ] **Step 2: 实现 add / remove / collect / set**

- [ ] **Step 3: 摘要、hasValidConditions、preferred 排序**

- [ ] **Step 4: 手工冒烟**

1. 打开 TipOut → 规则新增/编辑 → 添加「销售额」池规则 → 打开销售额取值条件  
2. 「+ 新增条件」可见「订单小费状态」；添加后菜单该项隐藏  
3. 选「含小费」→ 提交 → 规则卡片条件摘要含「订单小费状态: 含小费」  
4. 保存规则后重新打开，条件回显正确  
5. 删除该条件卡片 → 摘要不再含小费状态；保存后 `salesConditions` 无 `orderTipStatus`  
6. 打开小费 / 加收 / Tip Claim 条件抽屉，确认**无**「订单小费状态」菜单项  

- [ ] **Step 5: Commit**（若用户要求）

```bash
git add dist/TipOut/rule-add.html
git commit -m "$(cat <<'EOF'
feat(tipout): add order tip status sales condition UI

Allow sales pool rules to filter tipped vs untipped orders in value conditions.
EOF
)"
```

---

### Task 3: 公式文档 + 计算契约说明

**Files:**
- Modify: `dist/TipOut/docs/TipOut计算公式.md`
- Modify（可选一行交叉引用）: `docs/项目文档/TipOut-销售额取值-含小费订单条件设计方案.md` 状态可保持「已确认」；若加「实现中」备注则改修订记录

**说明：** 当前 `tipAllocation.js` 主要处理订单小费钱包分配，**不**完整实现「按销售额占比」从订单流水汇总 `S`。本期在文档与纯函数层锁定契约；若后续有服务端 / 本地汇总引擎，必须在汇总 `S` 前调用 `matchOrderTipStatus`。

- [ ] **Step 1: 更新计算公式文档**

在「符合条件的总销售额」一节追加：

```markdown
### 订单小费状态（可选）

若销售额取值条件配置了 `orderTipStatus`：

- `has_tip`：仅统计卡小费或现金小费 > 0 的订单（已付小费营业总额）
- `no_tip`：仅统计卡且现金小费均为 0 的订单（未付小费营业总额）
- 未配置：不按小费过滤（与历史行为一致）

判定**不**将加收服务费（Service Charge）视为小费。

```
小费池销售额金额 = 符合条件的总销售额 × 计提占比
```

其中「符合条件」= 既有条件（角色/区域/时间/菜单/营业额类型…）∧ 可选 `orderTipStatus`。
```

- [ ] **Step 2: 在 `orderTipStatus.js` 文件头注释标明**

```text
计算引擎汇总销售额 S 时：对每笔候选订单调用 matchOrderTipStatus(order, salesConditions.orderTipStatus)
```

- [ ] **Step 3: 再跑校验**

Run: `npm run verify:order-tip-status`

Expected: OK

- [ ] **Step 4: Commit**（若用户要求）

```bash
git add dist/TipOut/docs/TipOut计算公式.md dist/TipOut/orderTipStatus.js
git commit -m "$(cat <<'EOF'
docs(tipout): document tipped-sales filter in tip-out formula

Clarify optional orderTipStatus when computing sales-based pool base.
EOF
)"
```

---

### Task 4: 回归与验收对照

**Files:** 无新文件（验收清单）

对照设计方案 §6：

| # | 验收项 | 验证方式 |
|---|--------|----------|
| 1 | 可增删「订单小费状态」；含小费 / 不含小费 | Task 2 冒烟 |
| 2 | `has_tip` 仅 tipped 单；Service Charge 不算 | `npm run verify:order-tip-status` + 冒烟 |
| 3 | `no_tip` 仅无小费单 | 校验脚本 |
| 4 | 未配置不过滤 | 校验脚本 + 存量规则打开保存无新字段 |
| 5 | `has_tip` + 2.5% → 基数 × 2.5% | 校验脚本模拟 `150 × 2.5% = 3.75` |
| 6 | 仅销售额抽屉有该项 | Task 2 冒烟第 6 步 |

- [ ] **Step 1: 跑全量相关校验**

Run:

```bash
npm run verify:order-tip-status
```

（若仓库已有 `verify:order-list-columns`，一并跑，确认无回归。）

- [ ] **Step 2: 勾选上表全部通过**

- [ ] **Step 3: 更新设计方案修订记录（可选）**

在设计方案 §八 增加：`v1.1 | 2026-07-13 | 落地实现计划；纯函数 + 销售额条件 UI`

---

## 非目标（实现时禁止扩大范围）

- Tip Claim / 小费 / 加收 / 手动上报条件抽屉加同款条件  
- 分配明细 KPI「已付 / 未付小费营业总额」  
- 营业额类型下拉新增「已付小费营业额」  
- 存量规则自动写入 `has_tip`  
- 订单中心列表字段或金额公式变更  
- 完整服务端销售额汇总引擎（仅契约 + 纯函数；有引擎时再接线）

---

## 执行顺序建议

```text
Task 1（纯函数 + verify）→ Task 2（UI 落库）→ Task 3（文档）→ Task 4（验收）
```

完成后回复用户：实现计划路径，并询问是否开始按 Task 执行。
