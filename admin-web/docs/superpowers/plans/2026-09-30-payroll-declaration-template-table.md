# Declaration Template Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将模板列表改为已确认的五列，两行正文预览，保留详情入口。

**Architecture:** 只替换现有 renderSettings 列表 HTML 和局部 CSS。名称按钮沿用 data-declaration-family，不新增数据或 API。

**Tech Stack:** TypeScript、DOM、CSS、Node assert、现有 Vite 本地服务。

**Spec:** `docs/superpowers/specs/2026-09-30-payroll-declaration-template-table-design.md`

## Global Constraints

- 列顺序固定：模板名称、模板范围、门店、状态、声明内容。
- 声明内容最多两行，详情正文完整；变量保留占位符并转义。
- 不修改模板范围、权限、持久化和员工语言规则。
- 保留此前未提交的适用门店字段修复。不自动提交或推送。

## Task 1: 表格及验收

**Files:** Modify `src/team/payroll/payroll-declaration-settings.ts`, `src/team/payroll/payroll-page.css`, `scripts/verify-payroll-declaration-store-selection.mjs`.

**Interfaces:** `renderSettings(surface, state)` 继续消费 families/versions/stores；输出 table[aria-label="声明模板列表"]。模板名称按钮继续提供 data-declaration-family 给现有 onClick。

- [ ] RED：在现有渲染测试断言五个表头顺序、每行五个 td、企业/指定门店列、状态与 source、正文 HTML 转义及 colspan=5 空态。

```js
assert.deepEqual([...html.matchAll(/<th scope="col">([^<]+)<\/th>/g)].map(m => m[1]), ['模板名称','模板范围','门店','状态','声明内容']);
assert.match(html, /<td>全部门店<\/td>/);
```

- [ ] 执行 `node scripts/verify-payroll-declaration-store-selection.mjs` 确认旧卡片不能通过。
- [ ] GREEN：将每条 family 转为 tr，名称按钮、范围、门店、状态标签、正文 div 分别位于独立 td；正文取同一 applicableVersion.source，空内容为“—”。新增无数据跨五列行。

```html
<table class="payroll-declaration-table" aria-label="声明模板列表">
  <thead><tr><th scope="col">模板名称</th><th scope="col">模板范围</th><th scope="col">门店</th><th scope="col">状态</th><th scope="col">声明内容</th></tr></thead>
  <tbody></tbody>
</table>
```

- [ ] CSS：容器 min-width:0、overflow-x:auto；表格 width:100%、min-width:850px、table-layout:fixed。列宽依次 18%、12%、20%、10%、40%。正文 display:-webkit-box、-webkit-line-clamp:2、-webkit-box-orient:vertical、overflow:hidden、overflow-wrap:anywhere；名称按钮与状态标签沿用现有色系，保留 focus-visible。
- [ ] 运行表格/设置/语言回归与 `tsc --noEmit`。无需依赖或构建边界修改，不运行全量构建。
- [ ] 浏览器打开 57402 的员工声明设置，验证五列、企业/指定门店、名称点击及 Enter、详情完整文本、两行截断和窄屏容器滚动。保存截图，更新执行结果。

## Execution

用户已要求直接修改，沿用此前选择的当前会话执行。executing-plans 技能在此环境不可用，按本计划逐项执行。自查：设计的五列、空态、转义、截断、窄屏、详情入口均纳入唯一任务，不增加业务规则。

### 执行结果

- [x] RED：旧卡片渲染的表头数组为空，五列断言失败。
- [x] GREEN：五列表格、独立单元格、状态和正文、HTML 转义、门店字段及空态测试通过。
- [x] 设置 UI、语言选项回归和 TypeScript 类型检查通过。
- [x] 57402 浏览器展示五列；模板名称 Enter 打开完整详情，关闭后恢复列表；截图 declaration-template-table.png。
- [x] 两行截断 CSS 合约已验证；未单独执行窄屏浏览器测试。未新增测试模板或修改任何模板数据。
- [x] 用户已要求提交页面实现及相关门店展示修复，不自动推送。未触及构建边界，不重新执行全量构建。
