# 隐藏自助餐本次操作授权入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 隐藏自助餐“本次操作”的配置入口，并原样保留已存授权数据和执行逻辑。

**Architecture:** 在共享编辑器中以 `isBuffetProfile()` 隔离展示。默认范围控件独立渲染；遇到 `operation` 当前值时显示只读提示和未选择的替换下拉框，不写回默认值。现有授权校验函数保持不变。

**Tech Stack:** 原生 JavaScript、HTML、Node.js assert/vm、本地 Vite preview。

**Spec:** `docs/superpowers/specs/2026-09-18-buffet-hide-operation-authorization-design.md`

## Global Constraints

- 仅隐藏入口；不迁移已有数据，不扩大已有授权范围。
- 菜单下单限制不受影响；不修改 eMenu 源码。
- 当前 main 工作区其他暂存和未提交修改必须保留。
- 不推送远端。

---

### Task 1: 授权配置兼容展示

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`（`renderStepSix` 周边）
- Create/Test: `scripts/verify-buffet-hidden-operation-entry.mjs`
- Regression: `scripts/verify-buffet-rule-authorization.mjs`

**Interfaces:**
- Consumes: `draft.authorization`、`isBuffetProfile()`、现有整单规范化函数。
- Produces: `renderAuthorizationDefault(draft, supportsRoundAuthorization)` 返回 HTML，不修改输入；`renderStepSix(draft)` 保留既有整单规范化，按模块控制可见入口。

- [x] **Step 1: 添加失败回归测试。** 从实际 flow 文件截取 `renderScopeRow` 至 `namesFor` 之间的授权渲染函数，在 Node vm 中执行。检查实际 HTML 和渲染前后的授权数据：

```js
const before = JSON.stringify(draft.authorization);
const html = context.renderStepSix(draft);
assert.doesNotMatch(html, /data-auth-scope="operation"/);
assert.doesNotMatch(html, /data-auth-role="operation"/);
assert.doesNotMatch(html, /<option[^>]*value="operation"/);
assert.equal(JSON.stringify(draft.authorization), before);
```

测试覆盖 round/order 默认值、operation 默认值、仅 operation、关闭授权、空范围、纯整单以及菜单模块。提取现有授权事件处理片段，验证显式选择新默认值才更新数据、角色和隐藏 allowedScopes 保留。

- [x] **Step 2: 确认测试失败。** 运行 `node scripts/verify-buffet-hidden-operation-entry.mjs`，预期因现有 operation 可操作入口仍存在而失败。

- [x] **Step 3: 最小渲染修改。** 增加默认范围渲染函数并替换当前内联选项构造：

```js
var retainedOperation = isBuffetProfile() && auth.defaultScope === "operation";
var options = scopes.filter(function (item) {
  return auth.allowedScopes.indexOf(item.id) >= 0 &&
    (!isBuffetProfile() || (item.id !== "operation" && (item.id !== "round" || supportsRoundAuthorization)));
});
```

保留值显示 `沿用原默认授权范围：本次操作`。无可选项仅显示说明，有可选项但原默认值被隐藏时使用 disabled、selected 的空占位选项“请选择以更改默认授权范围”。operation 行只在非自助餐模块渲染。不修改默认创建、存储、事件处理或执行引擎。

- [x] **Step 4: 回归通过。** 运行新增测试、授权测试、菜单回归、生命周期和五步迁移脚本，执行 `node --check "dist/Configuration center/assets/order-limit-flow.js"`。
- [x] **Step 5: 浏览器验证。** 使用 main 本地预览，通过复制系统默认规则生成测试草稿，检查纯整单的授权步骤；每轮规则采用只读查看。确认保存和刷新后的只读默认值、显式切换行为，不修改用户已有正式规则。
- [x] **Step 6: 范围检查与提交。** 检查 `git diff --check`，仅提交本计划、新回归脚本和 flow 文件，不带入已暂存的其他权威文档或任何工资/eMenu 修改。

## 自检

规格九项验收均由渲染/事件/既有执行测试及浏览器验证覆盖。默认数据不改、权限不扩张、纯整单排除 round 和菜单模块隔离均为断言。当前会话直接执行；执行类附属技能未在可用目录列出，沿用上述可复现步骤，不创建额外实施任务。

## 执行结果（2026-09-18）

- 新增回归先失败再通过；共 8 个针对性脚本通过：hidden-operation-entry、rule-authorization、rule-menu-regression、v4-lifecycle、five-step-migration、v4-validation、rule-lifecycle、system-default-editor。
- `node --check` 和本次文件 `git diff --check` 通过。
- agent-browser 无法启动后，使用应用内浏览器验证 `http://127.0.0.1:5173/` 下 main 的实际静态页面。
- 纯整单测试草稿 `draftId=24`：旧默认 operation 保存并刷新后保留；取消订单范围后仅显示只读旧值、不显示空下拉框；明确选择 order 后保存并刷新恢复为 order。
- 每轮系统规则 `ruleId=13&view=1`：只读页面显示当前轮和当前订单，无本次操作勾选行，默认选项也仅有两项。
- 保留一份名为“验证-隐藏本次操作入口（测试草稿）”的本地草稿，未发布，不影响正式规则。未更改授权执行引擎、eMenu、薪资文件或他人暂存文档。
