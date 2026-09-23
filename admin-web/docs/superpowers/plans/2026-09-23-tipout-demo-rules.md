# Demo Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 按用户最新指令，默认直接生成演示规则，取代模板预填方案。
**Architecture:** 独立初始化器由规则列表调用；按已有规则门店和员工名册匹配角色，逐场景一次性追加。单独完成标记保留删除语义。
**Tech Stack:** legacy JavaScript、Vite、Node VM tests。
**Spec:** 用户本轮“修改代码，并默认直接生成演示规则”覆盖原模板设计的仅预填限制。

## Global Constraints

仅打卡；不修改已有规则、历史快照；不创建员工角色；缺少所需角色跳过，后续满足可补齐；标记写入失败可依靠规则 demoScenarioKey 去重。

### Task 1: 初始化器和测试

Files: `legacy/tipout-demo-rules.js.txt`、`scripts/verify-tipout-demo-rules.mjs`（均位于现有 tips 模块及 scripts 下）。
Interface: `TipOutDemoRules.ensure()`，返回新增规则数，依赖 ruleData 和 TipOutRosterDirectory。

- [ ] 建立 VM 测试，断言 `ensure() === 5`，重复执行为 0，删除一条后仍为 0，已有规则字节内容不变。
- [ ] 运行 `node scripts/verify-tipout-demo-rules.mjs`，验证缺文件失败。
- [ ] 实现五个场景：前厅按工时、吧台平均、辅助岗位 50/30/20、最大工时 5h、销售额 3%。不伪装尚未核实的权重算法。
- [ ] 运行上述测试及 `node node_modules/typescript/bin/tsc --noEmit`。

### Task 2: 列表接入

Files: `tips-legacy-runtime.ts`、`programs/rules.js.txt`。
Interface: rules 初始化前调用 ensure；失败显示提示且继续展示已有规则。

- [ ] raw import 加入 rules dependencies；初始化前调用 `TipOutDemoRules.ensure()`。
- [ ] 运行已有规则/分配回归脚本，检查 git diff。
- [ ] 仅提交本次文件到本地 main，不推送远程。

当前环境未提供 executing-plans 技能，按本计划在当前任务内执行。
