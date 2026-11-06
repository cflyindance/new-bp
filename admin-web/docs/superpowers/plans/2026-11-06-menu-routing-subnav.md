# 菜单路由配置二级导航 Implementation Plan

**Goal:** 用公共二级导航代替页面内 Tab，业务行为不变。

**Architecture:** 轻量路由描述共享给页面渲染和侧栏，保留 routing 权限资源；editor 接收地址解析得到的视角，不存储 Tab 状态。

**Tech Stack:** TypeScript、现有 M 平台滑层、Vite、Playwright。

**Spec:** [已确认设计](../specs/2026-11-06-menu-routing-subnav-design.md)。用户已授权在本会话直接修改，不自动提交或合并。

## Global Constraints

基线 main@ec151927；独立 codex/menu-routing-subnav-20261106 工作区；不修改 JSON/发布接口、订阅和授权资源；不改 main 预览端口。

## Tasks

- [x] 添加 menu-routing-navigation.ts，定义两个子地址和旧地址默认行为。
- [x] nav-blueprint-ui.ts 按地址渲染，editor 移除 Tab，目录/编排标题独立。
- [x] m-platform-runtime.ts 将已授权 routing 菜单映射为两个共享权限的子项，复用公共滑层，唯一选中。
- [x] 运行 verify-menu-routing-navigation.ts、页面注册领域回归和 TypeScript 检查。
- [x] 功能端口实际验证父层、返回、两子页面、旧地址、刷新历史、草稿及未保存提示；捕获本轮截图。
- [x] 同步产品 v1.3／研发 V1.2／个人 V1.2，变更 NAV-ROUTING-20261106-02；只更新受影响正文和操作覆盖清单。
- [x] 自查差异，仅交付本任务修改；未经授权不提交、合并、推送。
