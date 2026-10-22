# 小费明细保存当前分配 Implementation Plan

**Goal:** 将人工结果保存与系统重新分配分离，保留发放锁定、并发校验和汇总同步。

**Architecture:** 沿用明细快照收集、validate/commit 和薪资桥接。人工保存直接收集当前完整日明细；系统重分配临时建立全规则默认明细、生成快照后恢复原草稿，提交成功才替换页面，失败不丢草稿。快照记录 allocationSource。

**Tech Stack:** 原生 TipOut 模板、JavaScript、Node VM 测试。

**Spec:** 用户 2026-10-22 确认的两操作方案，变更 TIPOUT-SAVE-20261022-01。

## Global Constraints

- 基线 main f5940cbd；独立 codex/tips-save-current-20261022；不自动提交、合并、推送。
- 保存范围为当前门店日期全部规则，规则筛选只控制可见性。
- 未调整置灰但可点击提示；锁定、执行中和不可分配日期仍真正禁用。
- 用户原文三条提示保留；确认才写入，取消不修改；失败保留草稿。

## Tasks

- [x] scripts/verify-tipout-save-current.mjs：提示、取消、人工/系统分支、锁定、失败及临时重建恢复。
- [x] details.html新增右侧按钮；details.js.txt分离操作并保存快照来源。
- [x] 当前主应用使用src原生页面，dist/TipOut/detail.html为不同旧入口，不扩大迁移或修改payroll。
- [x] 产品V3.8、研发V2.8、个人V1.2同步；两种真实页面截图已加入，三个原生对话框截图缺口已登记。
- [x] 专项、确认、自动分配、存储、权重、工时与类型检查通过；浏览器实际保存后公式100、pool172/allocated97，系统重算恢复公式200、pool182/allocated100；取消及模拟存储失败保留人工公式100和原快照版本3。真实鼠标点击灰色按钮触发准确提示且不写入。

## 验证边界

旧payout-ui文案断言和detail-rounding测试依赖仍失败，未修改其无关逻辑。未做生产发布、提交或合并；未拍到浏览器原生弹框，未宣称全套历史测试通过。功能服务65110来自本worktree，main服务未改动。
