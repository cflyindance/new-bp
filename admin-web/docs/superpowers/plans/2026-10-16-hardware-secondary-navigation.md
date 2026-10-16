# Hardware Secondary Navigation Implementation Plan

**Goal:** 将已确认的 14 个设备叶子移入“硬件”公共覆盖子层。
**Architecture:** navModuleChildrenAsSheetSubnav 引用 DEVICE_MANAGEMENT_HARDWARE_SUBNAV；移除内容区重复 nav，保留硬件业务分支。
**Tech Stack:** TypeScript、现有递归侧栏、Node 断言。
**Spec:** ../specs/2026-10-16-hardware-secondary-navigation-design.md

## Global Constraints

main@7437f574；不新增权限、路由、保存桶或业务，不提交合并推送；外层设置保持。

## Task 1

- [ ] scripts/verify-hardware-secondary-navigation.ts 断言 14 项名称及路径同一数据源、硬件父项含子项、设置无硬件子项、原高亮与默认路径不变；源码中无重复硬件 nav。
- [ ] npx tsx scripts/verify-hardware-secondary-navigation.ts 首先必须因无硬件子项失败。
- [ ] src/config/navigation.ts 映射 dm-hardware 为 DEVICE_MANAGEMENT_HARDWARE_SUBNAV 的子项；不变更原 NAV_MODULES 逻辑 ID。
- [ ] src/main.ts 删除 renderDeviceManagementHardwareSidebar 函数与唯一渲染调用，保留硬件业务容器及控件绑定。
- [ ] 运行针对性测试、公共递归导航、菜单下单规则回归、tsc --noEmit。
- [ ] 三份导航文档递增产品 V2.3／研发 V2.2／个人 V2.2，HARDWARE-NAV-20261016-01；逐项记录设备叶子和旧地址，缺图就近标记。当前主线预览不切换；未执行浏览器验证则明确报告。
