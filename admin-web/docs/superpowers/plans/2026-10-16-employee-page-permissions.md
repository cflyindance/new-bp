# 员工岗位页面授权 Implementation Plan

**Goal:** 已确认：移除角色与员工下虚拟操作权限，将员工/岗位对象放到实际页面。
**Architecture:** 保留原资源键/授权值；旧操作页键成为不展示的兼容门控，绑定角色与员工父导航；显式修改父导航时同步两门控，原拒绝不自动变允许。对象及动作改归真实页面，内容按父链而非path取数。
**Tech Stack:** TypeScript、现有权限编辑器与本地存储。
**Spec:** 用户2026-10-16确认方案；三份权限文档PERM-20261016-01。
**Baseline:** origin/main@b0fe15e0；分支codex/employee-page-permissions-20261016。

- [x] 新增verify-permission-employee-pages.ts，RED为多出操作权限菜单；GREEN覆盖独立对象、原拒绝、继承、门店/保存。
- [x] center-employee-pages.ts重归属；center-domain.ts兼容门控；center-ui.ts同步父导航旧键，继承同时删除；center-editor.ts按父链筛选内容及过滤内部门控。
- [x] 组合/统一授权回归改用实际所属页，原键、动作及组合数量保留。
- [x] 已运行11权限脚本：8通过；center/grouped-edit因旧floor-plan控件缺失、menu-row旧47/67断言失败，已在干净main复现。tsc与独立Vite构建通过（562模块）。
- [x] 三文档同步V3.6/V2.6/V2.6及PERM-20261016-01；浏览器未验收/缺图已登记，无策略绕过或假截图。独立定向评审通过。
- [x] 未提交、合并、推送；主线58183检出原样保留。
