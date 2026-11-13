# 自助餐列表字段 Implementation Plan

**Goal:** 规则策略按模板、主体、周期、对象展示；商品范围改为渠道；移除三项可选列。
**Architecture:** 沿用列表投影与目录解析，不修改规则存储或编辑器。保持productScope列ID以兼容勾选偏好，白名单自动剔除period、partyRanges、roundRanges。
**Tech Stack:** 原生JS、VM断言、Chrome/Playwright。
**Spec:** 用户2026-11-13确认；产品融合设计及对应研发、个人规范版受影响章节同步。

## 约束

- 基线origin/main@919bf82b，功能分支codex/buffet-list-fields-20261113。
- 策略：常用模板名称＋限购主体＋限购周期＋限购对象；缺失模板不猜测。
- 渠道：全部配置门店、全部有效场景目标所属产线去重；不是门店当前筛选结果，不展示商品名称或数量。
- 9项可展示列，默认7列，固定名称／状态／操作；额外仅超限授权、规则描述。
- 周期筛选及编辑器人数／轮次／周期配置不变；保留现有规则与列偏好。
- 不提交、合并或推送；不修改应用入口、依赖与嵌入包，生产构建不执行。

## 实施步骤

- [x] 在verify-buffet-list-fields.mjs定义9列、旧偏好迁移、策略四段、跨门店／场景渠道并集的RED断言。
- [x] buffet-rule-list-view.js按buffetTemplateId读取profile.periodTemplates，projectColumns使用新策略及渠道摘要；保留系统默认模板解析职责。
- [x] buffet-list-query.js新增channelSummary，复用有效场景范围解析，按产线ID去重并使用目录名称；空值为—，未知产线明确标识。
- [x] 更新受影响旧列回归，不削弱取消／确认／恢复默认／失败保留原值测试；运行所有buffet VM脚本。
- [x] Chrome验证9项选择、三项隐藏、旧偏好过滤和实际策略／渠道；截图就近更新三份文档。
- [x] 类型检查、diff检查、图文与链接核验，独立记录缺口；交付未提交功能预览。
