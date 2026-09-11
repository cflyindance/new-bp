# 小费汇总日期范围单行展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让小费汇总首行的开始日期、分隔符和结束日期始终横向展示，空间不足时整体换行而不是内部拆行。

**Architecture:** 保留现有共享日期字段和事件逻辑，只调整小费汇总页面的局部 CSS。使用页面专属类覆盖旧的 `filter-bar--index` 选择器，并通过现有静态校验脚本锁定桌面与移动端响应式约束。

**Tech Stack:** HTML、CSS、Node.js 静态校验脚本、Vite 构建

**Spec:** `docs/superpowers/specs/2026-09-12-tip-summary-filter-scope-design.md`

## Global Constraints

- 桌面端断点为视口宽度不小于 `769px`。
- 桌面端门店字段最小宽度为 `240px`，日期范围最小宽度为 `340px`。
- 移动端最低支持 `320px` 视口，两个日期输入框等宽收缩且页面不得横向溢出。
- 不改变日期字段 ID、筛选状态、事件处理或数据逻辑。
- 构建生成的 `dist/`、`src/generated/build-stamp.ts` 和 seasoning handler 不纳入功能提交。

---

### Task 1: 锁定日期范围单行响应式布局

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs:256-260`
- Modify: `src/team/tips/templates/distribution.html:1-20`
- Modify: `src/team/tips/tips-page.css:2429-2455,2558-2572`

**Interfaces:**
- Consumes: `#dateRangeFilterField`、`.tipout-store-date-filter-field`、`.date-range-group`、`#dateStart`、`#dateEnd`。
- Produces: 页面专属的日期同行布局规则；不新增 JavaScript 接口。

- [ ] **Step 1: 扩展静态校验并验证失败**

在 `scripts/verify-team-tips-native-views.mjs` 的 `summaryStoreDateRule` 校验后加入对以下 CSS 契约的检查：

```js
const summaryDateGroupRule = pageCss.match(/\.tipout-page-summary \.tipout-store-date-filter-field \.date-range-group\s*\{([^}]*)\}/)?.[1] ?? "";
if (!summaryDateGroupRule.includes("flex-wrap: nowrap")) failures.push("distribution: shared date range controls must stay on one line");
const summaryDateInputRule = pageCss.match(/\.tipout-page-summary \.tipout-store-date-filter-field \.form-control\s*\{([^}]*)\}/)?.[1] ?? "";
if (!summaryDateInputRule.includes("min-width: 0") || !summaryDateInputRule.includes("flex: 1 1 0")) failures.push("distribution: shared date inputs must shrink evenly without overflow");
if (!pageCss.includes("min-width: 240px")) failures.push("distribution: desktop store filter minimum width contract missing");
```

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL，提示日期控件同行、输入框等宽收缩或门店最小宽度契约缺失。

- [ ] **Step 2: 实现页面专属布局规则**

在 `src/team/tips/tips-page.css` 中将门店字段设置为可收缩但不小于 `240px`，并为共享日期区块加入：

```css
.tipout-page-summary .tipout-store-filter-field {
  flex: 1 1 520px;
  min-width: 240px;
}

.tipout-page-summary .tipout-store-date-filter-field .date-range-group {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
}

.tipout-page-summary .tipout-store-date-filter-field .form-control {
  flex: 1 1 0;
  width: auto;
  min-width: 0;
}

.tipout-page-summary .tipout-store-date-filter-field .date-range-sep {
  flex: 0 0 auto;
}
```

在移动端规则中让 `.tipout-store-date-filter-field` 保持 `width: 100%`，日期输入继续使用上述等宽收缩规则。删除或收窄 `distribution.html` 顶部只对旧 `.filter-bar--index` 日期字段生效的冗余样式，避免两个来源产生冲突。

- [ ] **Step 3: 运行专项校验和格式检查**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: `Team tips native view verification passed.`

Run: `git diff --check -- scripts/verify-team-tips-native-views.mjs src/team/tips/templates/distribution.html src/team/tips/tips-page.css`

Expected: 无空白错误。

- [ ] **Step 4: 构建并浏览器验证**

Run: `npm.cmd run build`

Expected: TypeScript 与 Vite 构建成功；允许既有 chunk-size 警告。

在 `http://127.0.0.1:65016/#/team/tips/distribution` 和 `?view=employee` 分别验证：桌面端开始日期、`~`、结束日期同行；门店过长显示省略号；移动端 320px 宽度下日期同行且没有横向滚动。

- [ ] **Step 5: 提交功能文件**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/templates/distribution.html src/team/tips/tips-page.css
git commit -m "fix: keep tip summary date range on one line"
```

