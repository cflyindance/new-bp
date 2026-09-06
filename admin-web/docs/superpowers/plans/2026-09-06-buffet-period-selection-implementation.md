# 自助餐限制周期单选与受控组合模板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将自助餐普通规则的限制周期改为单选，并仅允许通过受控模板配置“整单＋每轮”或“整单＋分轮次”。

**Architecture:** 在 `buffet-rule-policy.js` 集中定义周期模式与合法组合，编辑器只调用策略函数渲染和切换，发布校验与运行编译复用同一合法性判断。继续保留 `enabledPeriods` 数组作为兼容存储，普通模式数组长度为 1，组合模式由稳定 `periodTemplateId` 标识；历史非法组合保持运行快照但阻断重新发布。

**Tech Stack:** 原生 JavaScript、现有 `order-limit-flow.js` 六步编辑器、Node.js `vm`/`assert` 验证脚本。

**Spec:** `docs/superpowers/specs/2026-08-31-buffet-legacy-limit-extension-design.md`

## Global Constraints

- 仅调整自助餐规则；菜单下单限制行为保持不变。
- 普通规则必须且只能选择一个周期。
- `per_round` 与 `multi_round` 在所有可发布规则中互斥。
- 跨周期仅允许 `order_lifetime + per_round` 和 `order_lifetime + multi_round`。
- 历史运行快照不得因进入编辑器而被静默改写。
- 使用 worktree 开发并只提交本功能文件。

---

### Task 1: 周期模式策略与发布校验

**Files:**

- Modify: `dist/Configuration center/assets/buffet-rule-policy.js`
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js`
- Create: `scripts/verify-buffet-period-selection-policy.mjs`
- Modify: `package.json`

**Interfaces:**

- Produces: `normalizePeriodSelection(draft)` 返回 `{ mode, templateId, periods, valid, code }`。
- Produces: `selectSinglePeriod(draft, period)` 和 `applyControlledPeriodTemplate(draft, templateId)`。
- Consumes: `periodTemplateId: "order_round_guard" | "order_multi_round_guard" | ""` 与兼容字段 `enabledPeriods`。

- [ ] **Step 1: 写失败测试**

断言单周期合法、两个受控组合合法、`per_round + multi_round` 和三周期非法、乱序组合规范化、历史非法组合不写回：

```js
assert.deepEqual(api.normalizePeriodSelection({ enabledPeriods: ["per_round"] }).periods, ["per_round"]);
assert.equal(api.normalizePeriodSelection({ periodTemplateId: "order_round_guard", enabledPeriods: ["per_round", "order_lifetime"] }).valid, true);
assert.equal(api.normalizePeriodSelection({ enabledPeriods: ["per_round", "multi_round"] }).code, "PERIOD_COMBINATION_UNSUPPORTED");
assert.equal(api.normalizePeriodSelection({ enabledPeriods: ["order_lifetime", "per_round", "multi_round"] }).valid, false);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-period-selection-policy.mjs`

Expected: FAIL，提示周期选择 API 不存在。

- [ ] **Step 3: 实现策略 API 与模板注册表**

新增固定组合定义：

```js
var CONTROLLED_PERIOD_TEMPLATES = {
  order_round_guard: ["order_lifetime", "per_round"],
  order_multi_round_guard: ["order_lifetime", "multi_round"]
};
```

普通模式只接受一个合法周期；组合模式必须同时匹配模板 ID 和固定周期集合。`selectSinglePeriod` 只切换周期启用状态，不删除其他周期的草稿数量；`applyControlledPeriodTemplate` 创建缺失分区并保留已有同周期值。

- [ ] **Step 4: 接入发布与运行编译校验**

发布/启用前非法组合返回 `PERIOD_COMBINATION_UNSUPPORTED`。运行时继续编译已发布历史快照，作者态保存与发布不得绕过校验。

- [ ] **Step 5: 运行验证并提交**

Run: `node scripts/verify-buffet-period-selection-policy.mjs`

Expected: PASS。

```bash
git add "dist/Configuration center/assets/buffet-rule-policy.js" "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-period-selection-policy.mjs package.json
git commit -m "feat: constrain buffet period combinations"
```

### Task 2: 场景配置单选与受控模板交互

**Files:**

- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Modify: `scripts/verify-buffet-period-scenario-editor.mjs`

**Interfaces:**

- Consumes: Task 1 的 `selectSinglePeriod`、`applyControlledPeriodTemplate`、`normalizePeriodSelection`。
- Produces: 普通周期单选控件、组合模板周期只读摘要、非法历史组合修复提示。

- [ ] **Step 1: 更新编辑器静态与行为测试**

测试普通模式渲染 `type="radio"` 和 `data-period-select`，不再渲染可自由组合的 `data-period-toggle`；组合模板渲染两个固定周期标签；非法历史组合显示 `data-period-repair` 且下一步被阻断。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-period-scenario-editor.mjs`

Expected: FAIL，现有页面仍输出周期多选。

- [ ] **Step 3: 修改场景配置渲染与事件**

普通规则使用三个单选卡片；选择周期时调用 `selectSinglePeriod`。常用模板分为单周期模板和两个跨周期保护模板；组合模板选中后周期卡片变为只读摘要，数量步骤继续按固定顺序展示对应分区。

- [ ] **Step 4: 实现模式切换确认**

从组合模板切换普通规则时弹出确认选择，用户必须点击要保留的周期；取消则保持组合配置。被停用周期的草稿值保留但不进入发布载荷。

- [ ] **Step 5: 实现历史非法组合修复态**

显示“当前历史周期组合不再支持”，提供“拆分为两条规则”和“保留单一周期”入口；在用户完成选择前禁止进入发布步骤，不自动修改原规则或运行快照。

- [ ] **Step 6: 运行验证并提交**

Run: `node scripts/verify-buffet-period-scenario-editor.mjs`

Expected: PASS。

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-period-scenario-editor.mjs
git commit -m "feat: add controlled buffet period selection"
```

### Task 3: 完整回归、构建与浏览器验收

**Files:**

- Modify if assertions require alignment: `scripts/verify-buffet-period-quantity-editor.mjs`
- Modify if assertions require alignment: `scripts/verify-buffet-v4-validation.mjs`

**Interfaces:**

- Consumes: 完整策略与编辑器交互。
- Produces: 普通单周期、两个合法组合和历史非法组合的验收结果。

- [ ] **Step 1: 更新旧多选测试夹具**

将原三周期 UI 成功夹具拆为单周期和两个受控组合；保留三周期夹具但预期改为发布失败 `PERIOD_COMBINATION_UNSUPPORTED`。

- [ ] **Step 2: 运行自助餐聚合验证**

Run: `npm.cmd run verify:buffet-rule-list`

Run: `node scripts/verify-buffet-period-selection-policy.mjs`

Run: `node scripts/verify-buffet-period-scenario-editor.mjs`

Run: `node scripts/verify-buffet-period-quantity-editor.mjs`

Run: `node scripts/verify-buffet-v4-validation.mjs`

Expected: 全部 PASS。

- [ ] **Step 3: 运行完整构建**

Run: `npm.cmd run build`

Expected: 成功退出；本任务不修改 `vendor/emenu-new`，无需执行 eMenu 嵌入包专项构建。

- [ ] **Step 4: 浏览器验证**

打开自助餐新增规则第 2 步，验证普通周期单选、两个组合模板、分轮次区间显隐、组合切回普通的明确选择和非法历史组合拦截；再打开菜单下单限制确认原交互未变化。

- [ ] **Step 5: 提交验收修正**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" "dist/Configuration center/assets/buffet-rule-policy.js" "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-period-selection-policy.mjs scripts/verify-buffet-period-scenario-editor.mjs scripts/verify-buffet-period-quantity-editor.mjs scripts/verify-buffet-v4-validation.mjs package.json
git commit -m "test: verify buffet period selection"
```
