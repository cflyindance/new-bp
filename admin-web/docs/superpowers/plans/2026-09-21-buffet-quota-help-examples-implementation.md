# 自助餐配置额度规则示例说明 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为自助餐配置额度页面中容易误解的规则标题和额度字段增加与“每轮菜品总数”一致的问号说明，并根据主体、周期、对象和计量方式展示准确示例。

**Architecture:** 在 `order-limit-flow.js` 内增加一个纯函数式帮助文案层：由规则上下文生成 `{ label, description, example }`，再由统一渲染函数输出可访问的 `<details>` 问号。规则标题负责解释统计对象，额度字段组标题负责解释人数乘算和周期，两类内容不重复。现有额度数据结构、输入事件、保存和校验路径保持不变。

**Tech Stack:** 原生 JavaScript、HTML `<details>/<summary>`、现有 `order-limit-flow.css`、Node.js 静态校验脚本、本地浏览器验收。

**Spec:** `docs/superpowers/specs/2026-09-21-buffet-quota-help-examples-design.md`

## Global Constraints

- 只增加辅助说明，不修改额度计算、保存结构、发布快照和校验结果。
- 对象统计范围只放在规则标题问号；人数乘算和周期只放在额度字段组或列标题问号。
- 按人数必须说明乘订单有效人数但不追踪具体食客；整桌必须说明不乘人数。
- 整单跨轮累计；每轮独立且额度不结转；分轮次只作用于当前人数×轮次场景。
- 菜品集按份统计合计份数，按种统计不同 SPU；相同菜品保护始终使用“份”。
- 同一门店内菜品集跨产线合并统计，不同门店分别保存、分别计算。
- 空例外不是普通未配置：保留空例外表示不使用默认保护，删除例外才恢复默认保护。
- 不给搜索、筛选、表格信息列、操作按钮、分页和每个行输入框添加问号。
- 不修改 `vendor/emenu-new`；若执行过程中实际修改该目录，必须按项目规则执行 `npm run build:emenu-new-embed -- --skip-install` 并校验嵌入产物。

---

### Task 1: 建立帮助文案覆盖和边界校验

**Files:**
- Create: `scripts/verify-buffet-quota-help-examples.mjs`
- Read: `docs/superpowers/specs/2026-09-21-buffet-quota-help-examples-design.md`
- Read: `dist/Configuration center/assets/order-limit-flow.js`

**Interfaces:**
- Consumes: 正式代码导出的 `window.MenuOrderLimitFlow.__test` 测试接口。
- Produces: 静态校验脚本，要求测试接口提供 `buffetRuleHelpContent(context)` 和 `renderBuffetHelpExample(help)`。

- [ ] **Step 1: 编写失败的校验脚本**

脚本读取并在 VM 中加载 `order-limit-flow.js`，沿用现有 verifier 的浏览器全局 stub，然后断言：

```js
const cases = [
  [{ kind: "target", targetType: "dish", storeCount: 2 }, "商品限购数量", "不同门店分别"],
  [{ kind: "target", targetType: "category" }, "分类限购数量", "同一门店、同一产线"],
  [{ kind: "shared", targetType: "dish_set", measureUnit: "piece" }, "菜品集共享额度·按份", "合计份数"],
  [{ kind: "shared", targetType: "dish_set", measureUnit: "kind" }, "菜品集共享额度·按种（SPU）", "仍只计算 1 种"],
  [{ kind: "protection", targetType: "dish_set" }, "相同菜品保护 / 菜品集内部保护", "删除例外记录后才恢复"],
  [{ kind: "quota", subject: "party_size", period: "per_round", scope: "person" }, "每人每轮最多", "有效人数"],
  [{ kind: "quota", subject: "order", period: "per_round", scope: "table" }, "整桌每轮最多", "不乘人数"],
  [{ kind: "quota", subject: "party_size", period: "order_lifetime", scope: "person" }, "每人每单最多", "整个订单"],
  [{ kind: "quota", subject: "party_size", period: "multi_round", scope: "person" }, "每人本轮最多", "当前轮次区间"]
];

for (const [context, label, fragment] of cases) {
  const help = test.buffetRuleHelpContent(context);
  assert.equal(help.label, label);
  assert.match(help.description + help.example, new RegExp(fragment));
}
```

同时断言渲染结果包含 `details.olf-bound-example`、包含 `aria-label="查看…说明示例"`，且描述和示例分别带 `说明：`、`示例：`。

- [ ] **Step 2: 运行脚本并确认失败**

Run: `node scripts/verify-buffet-quota-help-examples.mjs`

Expected: FAIL，提示 `buffetRuleHelpContent` 或 `renderBuffetHelpExample` 尚未定义。

- [ ] **Step 3: 提交测试基线**

```bash
git add scripts/verify-buffet-quota-help-examples.mjs
git commit -m "test: define buffet quota help examples"
```

---

### Task 2: 实现集中式帮助文案生成器

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`，靠近 `buffetDishSetQuotaLabels`、`renderV4LimitInput` 和 `renderV4PeriodScenario`。
- Test: `scripts/verify-buffet-quota-help-examples.mjs`

**Interfaces:**
- Consumes: 上下文对象：

```js
{
  kind: "total" | "target" | "shared" | "protection" | "quota" | "combo",
  subject: "party_size" | "order",
  period: "order_lifetime" | "per_round" | "multi_round",
  targetType: "dish" | "category" | "dish_set",
  measureUnit: "piece" | "kind",
  scope: "person" | "table",
  templateKey: string,
  storeCount: number
}
```

- Produces: `buffetRuleHelpContent(context) -> { label, description, example } | null`。
- Produces: `renderBuffetHelpExample(help) -> string`。

- [ ] **Step 1: 增加帮助内容纯函数**

实现明确分支，不从 DOM 反推上下文。核心结构：

```js
function buffetRuleHelpContent(context) {
  context = context || {};
  if (context.kind === "target" && context.targetType === "dish") return {
    label: "商品限购数量",
    description: "每个商品分别计算额度，不与其他商品合并；不同门店分别保存、分别计算。",
    example: "牛肉每轮最多 2 份、羊肉每轮最多 3 份，则两种商品分别受限，合计最多可以点 5 份。"
  };
  if (context.kind === "shared" && context.measureUnit === "kind") return {
    label: "菜品集共享额度·按种（SPU）",
    description: "统计菜品集内已选择的不同菜品种类数；同一门店内跨产线合并统计，不同门店额度不共享。",
    example: "最多 2 种时，牛肉点 3 份、羊肉点 2 份仍只计算 2 种；再添加虾滑即超过限制。"
  };
  return null;
}
```

在上述两个示范分支之外，同一函数必须以字面量返回对象补齐：`total` 使用设计文档 4.1；`target/dish`、`target/category`、`target/dish_set` 使用 4.2～4.4；`shared/piece` 使用 4.5；`protection` 使用 4.7～4.9；六种 `quota` 标签使用第 5 节表格；组合模板按 `templateKey` 使用第 6 节表格。所有返回对象都必须同时包含非空的 `label`、`description`、`example`，未知上下文才返回 `null`。

- [ ] **Step 2: 增加统一 HTML 渲染函数**

```js
function renderBuffetHelpExample(help) {
  if (!help) return "";
  return '<details class="olf-bound-example"><summary aria-label="查看' + esc(help.label) +
    '说明示例">？</summary><div class="olf-bound-example-content"><p><strong>说明：</strong>' +
    esc(help.description) + '</p><p><strong>示例：</strong>' + esc(help.example) + '</p></div></details>';
}
```

所有业务文本必须通过 `esc()` 输出，不允许拼接未经转义的数据。

- [ ] **Step 3: 暴露只读测试接口**

在现有 `MenuOrderLimitFlow.__test` 对象中增加：

```js
buffetRuleHelpContent: buffetRuleHelpContent,
renderBuffetHelpExample: renderBuffetHelpExample
```

不得改变已有测试接口名称或返回值。

- [ ] **Step 4: 运行专项脚本**

Run: `node scripts/verify-buffet-quota-help-examples.mjs`

Expected: PASS，输出覆盖的帮助上下文数量，且所有说明片段匹配。

- [ ] **Step 5: 提交文案生成器**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-quota-help-examples.mjs
git commit -m "feat: add buffet quota help content"
```

---

### Task 3: 将问号接入规则标题和动态额度字段

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4283-4680`
- Modify: `dist/Configuration center/assets/order-limit-flow.css:296-304`
- Test: `scripts/verify-buffet-quota-help-examples.mjs`
- Test: `scripts/verify-buffet-quota-labeled-columns.mjs`

**Interfaces:**
- Consumes: Task 2 的 `buffetRuleHelpContent(context)`、`renderBuffetHelpExample(help)`。
- Produces: 规则标题帮助标记和字段组帮助标记；不改变任何 input 的 `data-*` 属性。

- [ ] **Step 1: 替换“每轮菜品总数”的内联文案**

删除 `totalExample` 的临时字符串和手写 `<details>`，改为：

```js
var totalHelp = buffetRuleHelpContent({
  kind: "total",
  subject: draft.subject,
  period: combo.period,
  targetType: draft.targetType,
  templateKey: draft.templateKey || ""
});

'<h5>每轮菜品总数' + renderBuffetHelpExample(totalHelp) + '</h5>'
```

确保组合模板仍使用整桌总量字段，但帮助内容能说明组合内多个限制共同生效。

- [ ] **Step 2: 接入对象规则标题**

在 `targetBlock` 生成标题后增加唯一的对象说明问号：

```js
var targetHelp = buffetRuleHelpContent({
  kind: "target",
  targetType: draft.targetType,
  measureUnit: draft.measureUnit,
  period: combo.period,
  storeCount: participatingStoreIds(draft).length
});
```

商品、分类和菜品集分别显示各自统计边界。菜品集共享额度卡片标题使用 `kind: "shared"`，避免只在外层“菜品集额度与商品”解释而遗漏按份/按种差异。

- [ ] **Step 3: 接入菜品集内部保护标题**

在“相同菜品保护 / 菜品集内部保护”标题后渲染 `kind: "protection"` 的帮助内容。帮助中必须同时说明：

- 默认保护按整桌固定份数计算；
- 例外覆盖默认值；
- `0` 禁止下单；
- 保留空例外不使用默认保护；
- 删除例外恢复默认保护。

不在“添加例外商品”按钮旁再增加问号。

- [ ] **Step 4: 给额度字段组标题接入周期说明**

扩展 `renderV4LimitInput` 和 `renderV4BoundInputs` 的可选参数，但保持已有调用兼容：

```js
function renderV4LimitInput(cell, attrs, label, unit, help) { /* label 后渲染 help */ }
function renderV4BoundInputs(draft, values, combo, mapName, title, help) { /* strong 后渲染 help */ }
```

仅给字段组或表格额度列标题增加问号；每行 input、批量设置 input 不重复添加。帮助上下文由 `subject + period + scope` 生成，例如：

```js
buffetRuleHelpContent({ kind: "quota", subject: draft.subject, period: combo.period, scope: "person" })
buffetRuleHelpContent({ kind: "quota", subject: draft.subject, period: combo.period, scope: "table" })
```

- [ ] **Step 5: 调整浮层排版和弹窗边界**

保留现有视觉样式，并补充：

```css
.olf-bound-example-content p { margin: 0; }
.olf-bound-example-content p + p { margin-top: 6px; }
.olf-bound-example-content strong { color: var(--olf-primary); }
.olf-v4-limit-field > span:first-child,
.olf-v4-bound-row > strong { display: inline-flex; align-items: center; gap: 6px; }
```

不得使用固定页面坐标。保持浮层 `z-index` 高于额度卡片；浏览器验收时确认右侧字段的浮层不会超出配置额度弹窗。若右侧溢出，只为右侧字段增加 `right: 0; left: auto;` 的修饰类，不全局改变左侧展开方向。

- [ ] **Step 6: 运行专项与相邻回归校验**

Run:

```bash
node scripts/verify-buffet-quota-help-examples.mjs
node scripts/verify-buffet-quota-labeled-columns.mjs
node scripts/verify-buffet-period-quantity-editor.mjs
node --check "dist/Configuration center/assets/order-limit-flow.js"
```

Expected: 新专项脚本 PASS；标注列脚本 PASS；周期额度脚本不得出现由问号 DOM 导致的新失败；JavaScript 语法检查 PASS。若周期额度脚本存在基线失败，记录失败断言并对比修改前结果，不能把既有失败误报为本次回归。

- [ ] **Step 7: 提交 UI 接入**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-quota-help-examples.mjs
git commit -m "feat: explain buffet quota rules with examples"
```

---

### Task 4: 浏览器验收与权威文档同步

**Files:**
- Modify only if behavior differs: `docs/superpowers/specs/2026-09-21-buffet-quota-help-examples-design.md`
- Modify only if authoritative wording needs cross-reference: `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`
- Test: `scripts/verify-buffet-quota-help-examples.mjs`

**Interfaces:**
- Consumes: Task 3 完成的正式页面。
- Produces: 经过浏览器验证的问号覆盖矩阵和最终文档一致性。

- [ ] **Step 1: 启动或复用本地预览**

Run: `npm run dev -- --host 127.0.0.1 --port 5177`

Open: `http://127.0.0.1:5177/Configuration%20center/buffet-rule-editor.html?draftId=19`

强制刷新页面，确保使用最新静态资源。

- [ ] **Step 2: 验收普通规则**

逐项切换并点击问号：

1. 按人数＋每轮＋商品：看到商品统计范围、每人乘人数、整桌不乘人数三类说明，内容不重复；
2. 按桌＋每轮＋分类：看到同门店/同产线分类共享说明，不出现乘人数文案；
3. 按人数＋整单＋商品：看到整个订单跨轮累计说明；
4. 按人数＋分轮次：看到当前人数×轮次场景说明和额度不结转语义。

Expected: 每个标题只有一个问号；每行输入框和批量设置区无重复问号。

- [ ] **Step 3: 验收菜品集规则**

逐项切换：

1. 按份：说明包含商品合计份数、同门店跨产线合并、不同门店分别计算；
2. 按种：说明包含多份仍算一种，单位为“种（SPU）”；
3. 内部保护：说明单位始终为“份”，并正确解释默认、例外、空例外、删除例外和 `0`；
4. 两家门店：说明不得表达跨门店共享额度。

- [ ] **Step 4: 验收组合模板和可访问性**

至少检查“整单＋每轮限购”“每轮总量＋菜品集按份”“每轮总量＋每人每轮菜品集按种”。使用鼠标、`Tab`、`Enter/Space` 和 `Esc` 操作问号。

Expected:

- 示例只描述当前模板；
- 问号具备准确 `aria-label`；
- 浮层不被弹窗裁切，不遮挡到无法继续操作；
- 页面关闭再打开后不保存浮层打开状态。

- [ ] **Step 5: 运行最终验证**

Run:

```bash
node scripts/verify-buffet-quota-help-examples.mjs
node scripts/verify-buffet-quota-labeled-columns.mjs
node scripts/verify-buffet-product-wording.mjs
npm.cmd run build
git diff --check
```

Expected: 专项脚本和构建 PASS；`git diff --check` 无空白错误。构建若产生与本功能无关的哈希文件，只保留实际需要的正式产物，不覆盖用户已有改动。

- [ ] **Step 6: 最终提交**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-quota-help-examples.mjs docs/superpowers/specs/2026-09-21-buffet-quota-help-examples-design.md docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md
git commit -m "test: verify buffet quota help examples"
```

仅暂存实际发生变化的文档；不得暂存无关工作区文件。

## Self-Review

- Spec coverage: 第 3～10 节分别由 Task 2 文案层、Task 3 接入与样式、Task 4 浏览器和回归验收覆盖。
- Placeholder scan: 计划不包含未完成标记或未定义接口；Task 2 明确列出每个分支及其文案来源，设计文档是每条最终文案的唯一来源。
- Type consistency: 所有任务统一使用 `buffetRuleHelpContent(context)` 和 `renderBuffetHelpExample(help)`；上下文字段及枚举值在 Task 2 接口中一次定义。
- Isolation: 不改变额度模型、输入 `data-*` 属性、保存和校验函数；帮助文案生成器为纯函数，可由 Node verifier 独立验证。
