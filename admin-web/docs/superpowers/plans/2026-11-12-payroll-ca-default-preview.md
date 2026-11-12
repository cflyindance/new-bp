# Payroll 默认加班预览 Implementation Plan

> For agentic workers: follow the approved bounded bug-fix design inline; no automatic Git commit.

**Goal:** 默认双周演示可直接查看四类加班，未配置真实员工有明确状态且不改变计薪。
**Architecture:** 演示生成器只给首位demo员工配置完整工作周输入，调用现有加州适配器；状态消息使用纯函数，渲染仍复用原三卡和抽屉。
**Tech Stack:** TypeScript、原生Payroll shadow-root、Node断言、esbuild、Vite。
**Spec:** ../specs/2026-11-12-payroll-ca-default-preview-design.md

## Global Constraints

- 基线main@63249e9f；功能分支codex/payroll-ca-default-preview，5317主线不改。
- 无真实工资自动启用、无存储写回、无历史重算；其他场景员工和无考勤定义保留。

## Task 1: 演示与状态最小修复

Files: src/team/payroll/payroll-schedule-demo.ts、src/team/payroll/payroll-ca-bridge.ts；scripts/verify-payroll-ca-default-preview.ts。

- [x] 写RED测试：createPayrollScheduleDemo('biweekly','test-store')默认2027-07-01所在期首员工应有californiaOvertimeInput；resolve应ready，OT/OT2/weekly/seventh-day均>0，112h/$2600。
- [x] 增加完整周覆盖、其他演示员工无配置、实际员工解析为null、各场景不报错和原测试验证；消息函数覆盖未启用、已确认历史、blocked和ready。
- [x] 最小GREEN：首位demo员工使用固定两周工作模式，按期外完整周补上下文并调用applyCaliforniaPayroll；禁止作用到非demo对象。状态函数不写数据，render设置文字与hidden。
- [x] 运行新增测试、既有demo/CA/持久化/native-runtime/identity回归、tsc；Vite独立输出生产编译检查，不覆盖dist。
- [x] 原生浏览器独立端口检查默认四类行、两个倍率抽屉、筛选/Esc、其他员工状态和实际数据隔离。

## Task 2: 文档与证据

- [x] 三份既有权威入口V1.38，同编号PAYROLL-20261112-CA-PREVIEW，修改受影响字段；只在配套验证记录描述测试场景，正文不堆叠历史变更。
- [x] 新状态及实际演示截图在对应区域就近引用；既有未闭合项继续由原实施验证记录承接。
- [x] git diff --check及范围核对，交付分支/端口/基线/未提交状态，不自动提交。
