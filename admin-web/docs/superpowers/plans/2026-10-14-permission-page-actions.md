# 页面按钮独立权限 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将实际页面按钮登记为独立动作权限，重点覆盖薪资管理，不改变正式业务执行。

**Architecture:** 沿用 ActionRegistration → catalog action → role/store calculation → shared editor/preview。缺失 grants 默认 hidden；不迁移为允许，不修改页面业务代码。

**Tech Stack:** TypeScript、Vite、Node assert、agent-browser。

**Spec:** ../specs/2026-09-23-permission-management-center-authoritative.md §2.2；PERM-20261014-03。

## Global Constraints

- 父级关闭阻断下级、子级独立配置且不影响同级。
- 本轮仅本地配置与效果预览，不接管生产登录/API，不提交或推送。
- 保留 PERM-20261014-02 未提交布局改动及所有既有动作键。
- 不为占位页面生成通用 CRUD；按钮来源必须可检查。

### Task 1: 动作目录及验证

**Files:** 修改 src/permissions/center-actions.ts；新增 scripts/verify-permission-page-actions.ts。

**Interfaces:** 消费 buildCenterCatalog()、roleAccess(role,key,resources)、resolveAccess(state,employeeId,storeId,key,stores,resources)、renderPermissionEditor(options)；新增 ActionRegistration 仍保持 id/title/source/control。

- [x] 写断言 `catalog.resources.has(actionKey('/team/payroll-report','edit-employee'))` 及编辑允许、导出禁止算例。
- [x] 运行 `TSX_DISABLE_CACHE=1 node C:/Users/27273/AppData/Local/npm-cache/_npx/fd45a72a545557e9/node_modules/tsx/dist/cli.mjs scripts/verify-permission-page-actions.ts`，RED 为缺少薪资独立编辑动作。
- [x] 登记薪资 21、员工编辑 2、小费 8 个动作，原 117 项变为 148 项；原 ID 保留，员工来源为原生模板。
- [x] 新测试与 verify-permission-center/navigation/menu-row.ts 均 GREEN；新增 Esc 冒泡导致草稿丢失问题的 RED/GREEN，center-ui.ts 仅阻止 dialog Escape 冒泡、保留默认关闭。

### Task 2: 文档和实页验证

**Files:** 同步现有产品 V2.9、研发 V1.9、个人 V1.9；截图 assets/permission-navigation/page-actions-edit.png、page-actions-preview.png。

- [x] 三份共用 PERM-20261014-03，有效动作总数 148、逐项含义/控制点、边界和算例已同步；历史记录保留。
- [x] `tsc --noEmit` 成功；Vite 构建成功，550 模块，仅既有混合导入/大包警告，不覆盖 dist。
- [x] 核对并重启 58183 服务，HTTP 200；独立无成员测试角色完成相反编辑/PDF 组合、页面阻断/恢复、保存刷新及 Esc 保留薪资页面和未保存草稿；未操作真实业务。
- [x] 两张截图已实际查看；三份文档保持唯一入口和未闭合项；不执行 Git 提交/推送。

## Self-review

范围对应既有 §2.2；直接沿用动作资源，没有通用页面编辑开关或计算变更。新增动作不补入旧迁移逻辑，默认禁止。文档不建立第二套入口。
