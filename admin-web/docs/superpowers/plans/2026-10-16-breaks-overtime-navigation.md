# 休息与加班二级页面实施计划

**Goal:** 实施用户已确认的自定义休息、加班规则、设置三个二级页面。
**Architecture:** 使用 navigation.ts 公共递归滑层，页面按路由渲染，共享现有草稿和保存桶。
**Tech Stack:** TypeScript / Vite。
**Spec:** 本次用户确认的导航分析；导航三份权威文档 BREAKS-NAV-20261016-01。

- [x] 核验 main@3adc2347，独立 worktree / codex/breaks-overtime-navigation-20261016；保护原工作区。
- [x] 更新共享导航、主路由和内容渲染；旧休息规则/工作周地址兼容到设置，旧 scheduling 加班地址进入加班规则。
- [x] 设置输入及时写入内存草稿，缺失控件保留原值，周日使用数值 0；保持权限资源键及保存/下发规则。
- [x] 同步侧栏产品、研发与个人规范文档并就近配图。
- [x] 类型检查、权限分组回归、浏览器整行导航/页面/弹窗/草稿验证。
- [x] 交付功能预览与检查结果，不自动提交、合并或推送。

验证结果：tsc --noEmit、verify-permission-breaks-categories.ts、verify-recursive-navigation-interaction.mjs 通过；Playwright 验证两个新增弹窗、中心及留白点击、三页隔离、旧地址、周日与带薪时长跨页保留、0 时长联动与放弃草稿。截图已就近嵌入三份文档。功能预览 127.0.0.1:5197，未提交。
