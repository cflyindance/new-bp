# Permission Center Local Implementation Plan

> Execute inline in this task. No commit or production rollout is authorized.

**Goal:** 将已确认的权限中心交互及按店权限模型接入当前商家后台，保留本地实现与生产安全边界。

**Architecture:** 独立资源目录、纯权限计算器、本地版本化存储、共享编辑/预览组件与中心页面；商家入口使用新中心，企业后台暂保留旧实现。旧数据只读导入，未知动作默认拒绝。生产执行切换不在此次范围内。

**Tech Stack:** TypeScript、现有 DOM/Vite、localStorage、Node/tsx 回归。

**Spec:** ../specs/2026-09-23-permission-management-center-authoritative.md V2.0；用户 2026-10-13 确认先落地已确认本地范围。

## Global Constraints

- 不修改 eMenu vendor；不发布、不提交、不删除旧数据。
- 委派/品牌级权限待定，不按未知规则自动扩权。
- 原型/本地 UI 不等于服务端安全鉴权，真实邮件不发送。
- 维护权威、研发、个人规范三份入口；缺图据实标记。

## Task 1: Domain and persistence

- [ ] 创建 `src/permissions/center-domain.ts`，公开 `resolveAccess(state, employeeId, storeId, resource, stores)`，逐范围合并角色后应用个人例外与父级门控。
- [ ] 创建 `scripts/verify-permission-center.ts`：`assert.equal(resolveAccess(...A...), 'edit')`，相同员工 B 店 `hidden`；禁止覆盖、恢复继承、隐藏父级保留下级、动态门店、跨店全量鉴权。
- [ ] 创建 `center-store.ts`，旧数据只读映射，V4 独立 key、版本冲突和保存失败抛错，角色删除保护、邮箱去重和模拟邀请审计。
- [ ] 运行 `npx --no-install tsx scripts/verify-permission-center.ts`。

## Task 2: Catalog and editor

- [ ] 创建 `center-catalog.ts`：真实导航、设置分类及已审计动作；共享层级供编辑与预览。
- [ ] 创建 `center-editor.ts`：页面、动作、设置控件；保留导航滚动、展开状态；过滤隐藏预览项，预览按钮不执行业务。
- [ ] 用类型检查与目录断言验证资源唯一、分类完整、无批量伪 CRUD。

## Task 3: Center routes and workflows

- [ ] 创建 `center-ui.ts`、`center.css`：四入口、角色弹框/全屏权限、员工全屏三页签、门店单选、分配角色、例外、邀请与审计。
- [ ] 在 `rbac-ui.ts` 商家分支接入，兼容旧账号 URL，企业分支保持不变；只修改 `navigation.ts` 权限模块与 `main.ts` 必要入口。
- [ ] 验证 dirty guard、模态框键盘关闭与焦点、保存失败保留输入、同员工多店隔离。

## Task 4: Verification and docs

- [ ] 执行定向回归、`npx tsc --noEmit`，浏览器验证商家路由及弹框。
- [ ] 同步产品 V2.0 的实现状态（业务定义不扩展）、建立研发/个人版 V1.0，共同编号 `PERM-20261013-01`，注明缺图、待定与未接入 API。
- [ ] 核对文档链接和变更范围，报告实际测试结果及未闭合项。

## Execution record — 2026-10-13

- Domain, resource catalog, local persistence, shared editor and merchant routes implemented. Persistence validation isolated into `center-persistence.ts` for testing.
- Regression script, TypeScript check and isolated Vite build passed. No production dist overwrite, commit or deployment.
- Three documents synchronized under `PERM-20261013-01`; main product baseline remains V2.0, companion developer/personal documents are V1.0.
- Browser connection repeatedly timed out; C drive has no available capacity. UI visual/focus/narrow-width checks and screenshots remain unchecked, not passed.
- Existing business runtime remains on its legacy permission model. New configuration is local-only; no automatic production or session cutover. Outstanding items are tracked as PERM-OPEN-01 through PERM-OPEN-05 in all three documents.
