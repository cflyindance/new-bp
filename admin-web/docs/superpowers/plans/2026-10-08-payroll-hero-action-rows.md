# 员工操作按钮两行布局实施记录

**Goal:** 按 2026-10-08 用户确认，第一行编辑／切换员工，第二行更新员工数据／员工明细，两行右对齐。

**Architecture:** HTML 保留四个 data-action，按钮统一复用 payroll-hero-btn；通过两个行容器实现固定分组。原生与独立页面同时修改，顶部原员工明细入口移除。

**Tech Stack:** HTML、CSS、Node.js。

**Spec:** 本会话用户确认的两行方案；相关变更记录见 dist/TipOut/docs/payroll-需求分析.md 与 payroll-报表功能设计.md。

- [x] 定位两个模板、按钮事件及响应式样式，目标文件无既有改动。
- [x] 修改两份模板与样式；中文标签改为员工明细，英文保留 Employees Detail。
- [ ] 运行 node scripts/verify-payroll-hero-action-rows.mjs 及 git diff --check。
- [ ] 浏览器视觉核验；未完成时不得宣称已验证视觉效果。
- 不更改薪资计算、数据保存、导出或详情内容；不自动提交或推送。
