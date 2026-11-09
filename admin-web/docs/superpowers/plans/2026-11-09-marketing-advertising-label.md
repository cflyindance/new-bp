# 营销广告名称调整 Implementation Plan

**Goal:** 将展示内容父菜单名称改为营销广告，保留子菜单及业务。
**Architecture:** 仅修改 navigation.ts 两套标题及子页面模块归属文案。
**Baseline:** main@ec4c1c67；独立分支 codex/marketing-advertising-label-20261109。

- [x] 核验 main，创建独立工作区。
- [x] 更新中文、英文菜单及配套文档，保留路由、权限、数据。
- [x] 运行导航与权限回归，验证实际父菜单和子导航标题。
