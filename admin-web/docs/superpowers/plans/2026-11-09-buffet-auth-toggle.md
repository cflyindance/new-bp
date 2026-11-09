# 自助餐授权开关化 Implementation Plan

> **For agentic workers:** 当前任务内按步骤执行、逐项验证；不自动提交、合并或推送。

**Goal:** 第三步仅配置允许服务员密码授权开关，不展示范围和角色入口。

**Architecture:** 在共享order-limit-flow.js按isBuffetProfile限定展示及事件处理；不更改授权默认值、保存／启用校验、凭证判断或其他限购模块。当前编辑复核只概括开关状态，列表与历史发布兼容页保留只读配置摘要。

**Tech Stack:** 原生HTML/JavaScript、Node VM回归、项目现有Playwright/Chrome设施。

**Spec:** [产品权威第5章](../specs/2026-09-07-buffet-scene-step-fusion-design.md)。用户已确认仅移除配置入口、保留原授权逻辑。

## Global Constraints

- 基线main@13d51d69，已包含远端main@2d7893b4；本地主线另有未推送合入成果，不回退或搬运。
- 新规则沿用既有默认值；历史allowedScopes、scopePermissions、defaultScope、reasonRequired不因隐藏而被重置。
- 既有纯整单排除当前轮的规范化保持；不补齐非法权限数据，不放松原校验。
- 不改变菜单下单限制共享流程，不移除第三步，不自动开启开关。
- Build skipped：不触及依赖、资源加载、应用入口或嵌入包构建边界；CI unknown。

## Task 1: 限定自助餐配置入口

**Files:** 修改dist/Configuration center/assets/order-limit-flow.js、buffet-rule-profile.js；修改scripts/verify-buffet-hidden-operation-entry.mjs；创建scripts/verify-buffet-auth-toggle-browser.cjs。

**Interfaces:** 消费authorization既有对象；输出renderStepSix HTML及authorizationSummary(draft)字符串。字段事件保留data-auth-enabled，忽略自助餐的data-auth-scope/data-auth-role。

- [x] 修改现有VM测试：断言无data-auth-scope、data-auth-role、可选授权范围与权限，原授权JSON及脏标记不变。
- [x] 运行node scripts/verify-buffet-hidden-operation-entry.mjs取得RED。
- [x] renderStepSix在自助餐开启时不拼接范围区，关闭时保留硬性拒绝提示；非自助餐原样展示。scope/role事件分支首行增加if (isBuffetProfile()) return。
- [x] 增加authorizationSummary：自助餐返回“允许服务员密码授权”或“不允许授权”，其他模块保持原范围摘要；两条编辑复核路径复用。
- [x] profile.steps第三步note改为“授权开关设置”，默认配置及lifecycle不改。
- [x] 运行目标VM、凭证、v4生命周期及全部verify-buffet-*.mjs，执行TypeScript --noEmit。

## Task 2: 浏览器与文档

**Files:** 唯一产品权威、研发、个人规范三份文档对应授权章节；配套on/off截图；验证记录。

- [x] Chrome隔离会话用profile.createDefaultScenarioRule产生既有基线，检查默认范围与角色未变；通过repository建立测试草稿定位第三步。
- [x] 检查开关开／关、无隐藏区域、下一步、刷新、只读视角；修改开关后确认除enabled外授权JSON不变，补充非自助餐VM回归。
- [x] 三份文档更新同一变更编号BUFFET-AUTH-20261109-01，版本分别V1.11/V1.10/V1.10；说明继承、隐藏、失败及历史数据边界，放置实际页面截图。
- [x] git diff --check、互链和图片引用检查。保留必要证据，临时output不纳入提交。
