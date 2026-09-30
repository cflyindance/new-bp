# 独立菜单设计后台 Implementation Plan

> For agentic workers: 按 writing-plans 顺序在当前会话逐项执行；executing-plans 技能未安装，使用同等逐项验证流程。未经授权不提交Git。

**Goal:** 新标签打开免登录独立菜单设计后台，并保留共享全局悬浮球。
**Architecture:** apps/menu-design 独立Vite入口与构建；共享宿主悬浮球源码，同源iframe隔离迁入的编辑工作区。宿主只增加产品入口及静态产物挂载。
**Tech Stack:** TypeScript、Vite、Tailwind、原生JS/SVG/Canvas、Node内置测试。
**Spec:** ../specs/2026-09-29-static-emenu-design-export-authoritative.md 第0节；../specs/菜单设计业务规格说明书（研发交付版）.md。

## Global Constraints

- 不修改vendor/emenu-new，不改变宿主认证或代管限制。
- 第一阶段仅静态电子菜单设计与图片/PDF导出。
- 代码基线为docs/prototypes/static-menu-studio；原型保留，独立项目不运行时依赖它。
- 独立开发5174、预览4174；AI59319，仅127.0.0.1及明确localhost来源；宿主开发5173、预览4173。
- 独立build输出apps/menu-design/build；只发布dist/menu-design，不删除宿主dist其他目录。

## Task 1: 独立工程及工作区

Files: apps/menu-design/{package.json,vite.config.ts,index.html,src/main.ts,public/workspace/*,server/*}; scripts/build-menu-design.mjs。
Interfaces: 独立页/menu-design/，编辑器workspace/index.html，草稿key menu-design-draft-v1；build无需59317。
- [x] 写独立契约测试：assert入口不引用src/main.ts；assert工作区KEY独立；assert发布不引用/exports。
- [x] 运行`node --test apps/menu-design/tests/entry.test.mjs`，首次缺文件失败。
- [x] 迁入JS/CSS及测试，入口iframe隔离；非本机导出publish使用Blob，本机使用独立/menu-design/exports临时接口兼容内置浏览器；AI端口59319；固定回环来源；JSZip由本地依赖打包复制。
- [x] 独立脚本：`npm run build:menu-design`，内部Vite build独立配置后复制build到dist/menu-design；无全dist清理。
- [x] 跑迁入模型/布局/流程/AI契约测试，检查独立build/index.html引用实际哈希资源。

## Task 2: 共享导航

Files: src/shell/{menu-design-entry.ts,peripheral-products-control.ts,demo-switch-control.ts}; src/i18n.ts; apps/menu-design/src/main.ts；vite.config.ts。
Interfaces: getMenuDesignUrl(base)、isMenuDesignPage()；DemoSwitchControlOptions.onProductNavigate供独立入口使用。
- [x] 导航断言：部署子路径解析正确、productId='menu-design'、_blank及noopener、产品数由3变4。
- [x] 新增中文菜单设计及英文Menu Design，平铺/下拉入口共用打开方法；免登录入口不导入宿主main。
- [x] 独立壳挂载mountDemoSwitchFab，接入共享view绑定；其他产品导航到宿主，当前产品只收起面板。
- [x] 宿主静态挂载/menu-design，独立构建发布；新页阻止弹窗提示可点击链接。
- [x] 独立TypeScript检查和宿主静态契约测试；构建后浏览器验证。

## Task 3: 集成验收与文档

Files: 两份配对权威文档，apps/menu-design/README.md；output/playwright/static-menu-studio。
- [x] 未登录直达及刷新无需登录；菜单设计只有一个共享悬浮球，当前项高亮；切换其他产品仍走既有入口。
- [x] 浏览器测试悬浮球开关/键盘，项目创建/三步/保存恢复、导出回归；不自动发送用户图片。
- [ ] 商家已登录页真实点击验收：当前无商家登录态，未模拟账号。导航契约测试已覆盖新标签与原URL不变；浏览器确认回到商家后仍要求登录。
- [x] 记录独立产物检查与测试数量，更新两份文档实现状态及README，保留尚未实现的生产能力边界。
