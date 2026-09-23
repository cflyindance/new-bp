# 单日快捷分配 Implementation Plan

**Goal:** 实现权威 PRD V2.8 单日分配入口。
**Architecture:** 在隔离的详情运行时同步生成完整快照，不触发自动保存或页面导航。汇总负责资格校验、带锁首次提交、通知与刷新；不使用只写状态的批量入口。
**Tech Stack:** TypeScript、原生 DOM、既有 legacy runtime、本地快照存储。
**Spec:** dist/TipOut/docs/PRD_产品需求文档.md 第 17 章。

## Tasks

- [ ] 给 allocation results 的 `commit(snapshot, options)` 增加 `onlyIfUnallocated` 锁内检查，既有调用不变；验证重复提交拒绝。
- [ ] 给 details 增加 `prepareQuickAllocationSnapshot()`，校验纯打卡资格和规则引用，复用 `collectDetailAllocationSnapshot`。
- [ ] runtime 提供隔离详情渲染及清理入口，禁止后台自动确认、导航、范围变更和 BroadcastChannel。
- [ ] distribution 增加按门店日期防重的按钮；手工规则跳转；纯打卡保存后通知、刷新、Payroll 同步。
- [ ] 运行快照、自动分配、锁定回归及 TypeScript 检查；浏览器验证按钮和跨汇总同步。
- [ ] 更新权威 PRD 的实现状态，仅提交本次文件到 main。
