# 屏保展示位置 Implementation Plan

**Goal:** 原选择渠道页在渠道范围下增加展示位置，屏保／首页多选，至少一项，支持全选；新建均不勾选。
**Architecture:** 保留原 HTML 流程，增加独立位置卡片与主题隔离的选择存储。时间页保存位置字段，并保留原排期校验、确认及发布流程。终端对接与现有重叠规则不在本次修改范围。
**Baseline:** main@ee9bd75c，codex/marketing-display-positions-20261109。未授权提交合并。

- [x] 核验 main、创建独立工作区，确认默认均不选。
- [x] 增加位置卡片、独立全选／半选和下一步联动。
- [x] 保存 distributePositions 和 lastDistributePrefs.positions；主题隔离、返回回显、保存清理、空值拦截。
- [x] 测试默认、必选、多选、全选、返回回显、保存与旧记录；预览截图。
- [x] 同步产品、研发、个人规范文档与验证缺口。
