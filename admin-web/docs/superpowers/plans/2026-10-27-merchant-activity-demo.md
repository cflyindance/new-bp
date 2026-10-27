# 商户使用活跃分析 Implementation Plan

> 执行方式：本聊天内顺序开发、验证。Git 提交、合并、推送须另获授权。

**Goal:** 在 M 平台提供基于统一 Demo 订单的门店、产线和设备使用分析。
**Architecture:** 纯统计领域函数 + 确定性演示数据 + 原生 TypeScript 页面；M 平台 Shell 与角色权限目录接入。
**Tech Stack:** TypeScript、Vite、项目现有样式变量、agent-browser。
**Spec:** 本聊天已确认方案；同目录三份业务文档使用共同编号 ACTIVITY-20261027-01。

## Global Constraints

- 基线 main@64ddec8f484b2aed463dd63fcf7f111d6df4fb4b，本地/远端获取成功且一致。
- 分支 codex/merchant-activity-demo-20261027；实际工作目录为当前 worktree 的 admin-web。
- 原工作区不变；不修改 vendor/emenu-new，不接入真实数据。
- 7/14/30 天固定阈值；不新增阈值配置、写业务数据、通知或真实停用操作。
- 既有角色不自动授予新页面权限；沿用 M 平台角色并集和导航滑层。
- 页面订单按查询期统计，活跃状态按截至日期及全历史最近点单判断。
- 演示对象统一 Asia/Shanghai 时区；当前绑定取截至日末，历史归属按下单时有效区间。
- 文档各元素和操作就近配真实页面截图；无法采集的状态登记缺口。

## Task 1: 统计与预设数据

**Files:** src/config/merchant-activity-domain.ts、merchant-activity-demo.ts；scripts/verify-merchant-activity.ts。
**Interfaces:** createActivityDemo(asOf)、resolveOrders(data)、summarizeActivity(data,orders,scope,period)、devicesForScope(data,orders,scope,period)。
- [x] 定义门店、设备、License 有效区间、订单和统计类型。
- [x] 生成 9 家门店，覆盖六产线、5 台 Kiosk 中 3 台使用、18/40 天未使用、首次使用前、未识别与异常。
- [x] 业务订单去重、日期和阈值函数、历史绑定匹配；保留零订单设备。
- [x] 执行阈值边界及 1/7/30/90 天三级汇总校验。

## Task 2: 页面与权限

**Files:** merchant-activity-ui.ts、merchant-activity.css；m-platform-shell.ts、m-platform-catalog.ts、m-platform-runtime.ts、enterprise-merchant-store.ts。
- [x] 在品牌管理中心登记只读页面及详情路径，保留未授权拒绝。
- [x] 原生页面实现统计日期、商户/状态/名称筛选和三级钻取、设备点单明细。
- [x] 验证可见只读角色可查询/钻取，隐藏角色不能直达。
- [x] 运行 TypeScript 和 diff 检查，浏览器验证真实入口、日期、空结果、钻取、历史归属、异常。

## Task 3: 文档与验收

**Files:** docs/项目文档/商户使用活跃分析/ 下三份业务文档、逐操作覆盖清单、assets/；本计划。
- [x] 逐操作记录入口、操作后界面、结果与截图，确认/取消不适用项单独注明。
- [x] 完成三份 V1.0 文档，互链、版本及共同编号一致。
- [x] 核对截图引用、元素与规则一致性，记录真实接入与生产验证边界。
- [x] 提供功能预览、起始提交、实际目录、测试结果和 Git 状态。
