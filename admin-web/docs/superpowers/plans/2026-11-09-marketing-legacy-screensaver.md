# 展示内容原屏保入口 Implementation Plan

**Goal:** 保持内容方案、投放管理现状，在展示内容下增加屏保，直接复用原功能。
**Architecture:** 导航新增同级叶子，原 /marketing/screensaver 恢复加载原 iframe；旧静态资源、存储、全屏流程和权限键保持原有实现。
**Baseline:** main@4f572e92；codex/marketing-legacy-screensaver-20261109。未授权自动提交、合并或推送。

- [x] 核验远端及本地 main，从本地最新 main 创建独立 worktree。
- [x] navigation.ts 两套菜单新增屏保；main.ts 恢复原 iframe，ui.ts 排除旧路由；center-catalog.ts 保留实际页面权限及只读默认。
- [x] 验证三叶子导航、原路由、全屏编辑返回和原文件字节一致性；回归内容、投放及权限。
- [x] 同步展示内容及导航文档，记录截图与未覆盖状态。
- [x] 在独立端口预览验收，交付实际目录、基线、验证结果与未提交状态。
