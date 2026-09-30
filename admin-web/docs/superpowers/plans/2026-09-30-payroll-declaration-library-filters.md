# Declaration Library Filters Implementation Plan

> **For agentic workers:** Use executing-plans task-by-task. Current-session execution selected by user; unavailable execution skill is handled with inline checkpoints.

**Goal:** 三项组合筛选及列表选择员工入口。
**Architecture:** settings 独立过滤状态，renderer 纯过滤，复用 assignment.open，不改持久化。
**Tech Stack:** TypeScript、Shadow DOM、CSS、Node VM renderer tests。
**Spec:** docs/superpowers/specs/2026-09-30-payroll-declaration-library-filters-design.md

## Global Constraints

授权门店集合内过滤；门店包含企业模板；最新版本决定状态标签，activeVersionId 决定是否可分配；保存刷新保留过滤，重新打开或全局范围切换重置；保留上轮未提交样式。

## Task 1: 筛选与六列表格

Files: src/team/payroll/payroll-declaration-settings.ts; scripts/verify-payroll-declaration-store-selection.mjs。
Interfaces: state.filters = {storeId:string, scope:string, status:string}；renderer 兼容未配置 filters 的既有测试。
- [ ] 更新测试为六列，并增加过滤组合、空状态和草稿+发布版并存断言。
```js
state.filters = {storeId:'B',scope:'store',status:'published'};
sandbox.renderSettings(surface,state);
assert.doesNotMatch(surface.innerHTML, /data-declaration-family="enterprise"/);
```
- [ ] 运行 node scripts/verify-payroll-declaration-store-selection.mjs，确认旧五列失败。
- [ ] 增加纯过滤和三项 select、重置按钮；状态通过 applicableVersion 获取；操作按钮携带 familyId。
```ts
(!filters.storeId || !family.scope.storeId || family.scope.storeId === filters.storeId)
```
- [ ] 同一脚本通过，验证 colspan=6 和匹配空态。

## Task 2: 事件与样式

Files: src/team/payroll/payroll-declaration-settings.ts; src/team/payroll/payroll-page.css。
Interfaces: data-declaration-filter = storeId|scope|status; data-declaration-assign-family = familyId。
- [ ] change 仅更新 filters，paint 后恢复当前 select 焦点；reset 清空全部条件。
- [ ] 行操作从 families 取 family，再校验 active published，直接 assignment.open；不修改 selectedFamilyId/editorOpen。
- [ ] open 和 scope subscription 重置 filters，refresh 不重置。
- [ ] CSS 筛选 flex-wrap，控件统一样式，操作列与六列宽度对齐；不更改批量保存行为。

## Task 3: 验证

- [ ] 执行 store-selection、settings-ui、assignment-layout 和 tsc --noEmit。
- [ ] 浏览器验证筛选空态、重置、直接选择员工、关闭回列表；只检查交互，不新增模板或更改员工偏好。
- [ ] 记录验证结果与截图。无构建边界变更，跳过全量 build。用户未要求提交，不提交实现。

自审：规格过滤/范围/状态/空态覆盖 Task 1，入口/保持与重置/布局覆盖 Task 2，浏览器及自动化覆盖 Task 3。

## 执行结果

- 已完成三项 AND 筛选、重置、六列列表、可分配状态判断及行内选择员工入口；复用批量面板，不改存储接口。
- RED：store-selection 测试因缺少“操作”列失败；GREEN：新增六列、组合过滤、空态、发布版与草稿共存断言全部通过。
- settings-ui、assignment-layout 与 TypeScript 检查通过。
- 57402 浏览器验证：门店+指定门店得到匹配空态，企业通用+已发布恢复结果；列表直接打开员工选择；关闭后门店/范围/状态仍保留；重置恢复全部。
- 截图：declaration-library-filters.png。未新增模板、未更改员工分配。窄屏样式已支持换行与横向滚动，未单独执行窄屏浏览器验证。
- 未触及构建边界，本轮不执行全量 build；实现未提交。保留前一轮弹框样式修复。
