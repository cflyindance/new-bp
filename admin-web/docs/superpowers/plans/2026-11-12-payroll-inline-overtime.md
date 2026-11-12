# Payroll 行内计薪明细 Implementation Plan

**Goal:** 汇总只读、每日表单入口核账，移除重复抽屉。
**Architecture:** bridge读取既有互斥切片渲染原生details，同日最后打卡行下的通栏子行负责布局；不改核算或存储。
**Tech Stack:** TypeScript、原生shadow-root、esbuild/Node、Vite。
**Spec:** ../specs/2026-11-12-payroll-inline-overtime-design.md

## Global Constraints
基线main@11add6e0，独立codex/payroll-inline-overtime及5319；真实员工不自动启用；未授权Git操作。

## Task 1: 单入口渲染与回归
- [x] RED：新增verify-payroll-ca-inline.ts，断言summary没有button/data-ca-overtime；第7天行内包含8h×20×1.5与2h×20×2及$240/$80，Regular/0日无details，文本转义、输出只读。
- [x] GREEN：payroll-ca-bridge.ts增加renderCaliforniaDayBreakdown，删dialog/listeners，summary改文本；amount值保持textContent，按同日切片在最后打卡行后创建通栏明细行。每次render先清除上一次明细，防止重复及blocked残留。
- [x] legacy/payroll.js.txt的CA列判断支持输入或快照；payroll-polish.css移除抽屉样式，新增details公式与依据的小字号、换行、可见焦点。
- [x] 运行新测试、CA bridge/default/persistence/native/identity/print/regular与tsc、生产编译；不改导出契约。

## Task 2: 实际页面与三文档
- [x] 启动独立5319，外部浏览器检查默认卡、行内两档/周/OT、键盘展开收起、无dialog、工资不变、未启用和blocked无旧明细。
- [x] 三份既有文档V1.39统一编号，替换抽屉定义及就近截图；原CA-01/02继续保留于验证记录。
- [x] 文档链接、git diff --check及变更范围检查；交付实际分支、目录、main基线和未提交状态。
