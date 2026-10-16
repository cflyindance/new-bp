# 移除外层菜单下单限制入口 Implementation Plan

**Goal:** 用户已确认仅隐藏外层入口，保留规则限制及三个子菜单。

**Architecture:** 在已过滤的显示树转换中去掉 qc-menu-order-limits 行；保留原逻辑注册、权限、旧地址和业务。

**Tech Stack:** TypeScript，Node 断言。

**Spec:** 用户已确认的 NAV-20261016-01；前厅仅显示规则限制，包含每轮菜品互斥/组合、其他设置、自助餐规则；不删除原数量业务。

## 约束

基线 main@c6e1831c；分支 codex/hide-menu-order-limits-entry；不改主线预览、存储、权限、URL，不提交合并推送。

## 步骤

- [ ] 修改 scripts/verify-rule-restrictions-navigation.ts：四种能力组合均断言外层旧行不存在；旧数量根地址仍注册但不高亮隐藏项。
- [ ] 先运行 npx tsx scripts/verify-rule-restrictions-navigation.ts，确认旧行为失败。
- [ ] src/config/navigation.ts 中 qc-menu-order-limits 分支仅在没有 buffet 且有子项时返回 [group]，否则返回 []。
- [ ] 运行针对性导航、公共递归导航、自助餐导航／全屏和 tsc --noEmit。
- [ ] 同步三份导航文档有效正文、矩阵和版本；旧外层图标为历史并就近说明新图缺口，不宣称浏览器已验收。
