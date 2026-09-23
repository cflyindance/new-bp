# TipOut 整日发放实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有汇总/明细补齐整日发放说明与只读记录，保留已确认自动分配和锁定逻辑。
**Architecture:** 复用 TipOutDateState 的日期级快照及发放记录，新增共享只读记录展示模块；两个入口调用同一模块，不创建第二套支付数据。
**Tech Stack:** TypeScript 原生壳层、legacy JS、HTML 模板、Node VM 回归。
**Spec:** 本会话最终确认：整日发放；不支持员工选择或部分发放；纯打卡规则自动确认保留；现金线下核对；已发放锁定；查看确认人/时间/快照记录。

## Global Constraints

- 不实现转账、现金抵扣、新金额字段、部分发放；不调整分配算法。
- 只从锁定快照和已有发放记录读取审计内容；异常时不能伪造记录。
- 保留已有跨标签页幂等和未确认更新拦截。
- 不修改其他工作区的未提交业务代码，完成后合入本地 main，不自动推送。

## Task 1：记录展示与两个入口

Files: `src/team/tips/legacy/tipout-payout-record-ui.js.txt`、`tips-legacy-runtime.ts`、`programs/distribution.js.txt`、`programs/details.js.txt`。
接口：`window.TipOutPayoutRecordUi.read(store,date)` 返回只读展示字段，`open(store,date)` 打开记录弹框；无合法发放快照时抛错。

- [ ] 新建 `scripts/verify-tipout-day-payout.mjs`，断言未发放拒绝、跨池人员去重、使用快照金额、确认人/时间、异常快照拒绝，运行确认失败。
- [ ] 实现共享模块，注册到日期汇总和明细运行时，增加“查看发放记录”入口。
- [ ] 修正表格子按钮键盘事件，避免查看记录时误入明细；弹框支持关闭、Esc、Tab 焦点约束和回焦。
- [ ] 运行 `node scripts/verify-tipout-day-payout.mjs`。

## Task 2：确认语义与回归

Files: `templates/distribution.html`、`templates/details.html`、`scripts/verify-tipout-day-payout.mjs`。

- [ ] 两个确认框统一“整日”范围及“已分配金额（参考）”；提示金额非剩余应发，核对线下现金，仅登记不转账，确认后锁定。
- [ ] 执行 payout-lock、payout-ui、clock-rule-auto-allocation、detail-confirm-allocation 回归；不改变已有状态枚举。
- [ ] TypeScript 检查与浏览器可用条件下的入口、取消、记录交互验证。
- [ ] 将最终范围追加到最新权威 PRD，保留未提交的 V2.6 评审；提交本次范围文件并合入 main。

执行说明：用户已要求开发，本会话直接执行；所述 superpowers 执行子技能当前未提供，按此计划逐项本地实现与检查。

## 执行结果

- 已完成新增记录模块、两个入口、整日范围和线下核对说明；不改原始计算和状态模型。
- 新契约测试先因模块不存在失败，实现后通过；payout-ui、payout-lock、clock-rule-auto-allocation、detail-confirm-allocation 均通过。
- TypeScript `--noEmit` 通过；Vite 构建到 `.tmp/tipout-build` 成功（仅既有 chunk 大小/混合导入警告）。
- 备用 Playwright Chrome 在两份真实模板验证记录弹框、转义文本、关闭及键盘焦点通过。未宣称生产支付联调通过。
- 原权威 PRD 完整保留 V2.6 评审，追加 V2.7 最终方案及验证边界。
