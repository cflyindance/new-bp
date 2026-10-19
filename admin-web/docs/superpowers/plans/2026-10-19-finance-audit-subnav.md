# 财务收银审计子导航 Implementation Plan

**Goal:** 将已确认的两个页签迁入公共覆盖子导航。
**Architecture:** navigation.ts 共用两项叶子定义；main.ts 使用公共子导航的叶子高亮；查询页移除页签。
**Tech Stack:** TypeScript / Vite。
**Spec:** 用户已确认的财务中心 → 收银记录与审计 → 付款记录、钱箱登入／退出记录；原路由和业务操作保持。

- [x] 在 navigation.ts 为父项添加 children/sidebarChildren，并在 main.ts 提供子项路径匹配。
- [x] 移除 finance-register-audit-pages.ts 的 tabs 生成与 tablist，保留查询、新增和字段。
- [x] 更新侧栏三份文档及现有财务方案、联调用例，使用 FINANCE-NAV-20261019-01。
- [x] 执行 TypeScript、递归导航和财务既有校验；在独立端口验证整行点击、返回、两页切换、高亮和旧链接；保存两页截图。

本次未授权 Git 提交、合并或推送。

验证结果：TypeScript、Vite 构建、递归导航、财务演示适配与浏览器目标交互通过；权限综合脚本在 main@180e3322 基线复现同一餐位控件缺失失败。
