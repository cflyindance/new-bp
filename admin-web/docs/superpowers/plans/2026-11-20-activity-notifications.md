# Activity Notifications Implementation Plan

**Goal:** 在系统使用分析中提供门店异常跟进和模拟邮件汇总。
**Architecture:** 复用门店订单和员工授权。通知规则与页面独立，演示状态在浏览器保存。
**Tech Stack:** TypeScript、Vite、HTML dialog。
**Spec:** [异常门店通知](../specs/2026-11-20-activity-notifications.md)

- [x] 接入最后完整自然日的订单、负责人匹配、通知周期及权限过滤。
- [x] 接入 M 平台页面、配置、跟进表单、邮件预览和发送记录。
- [x] 核对分组、重复和恢复，运行类型检查并预览。
