# 场景独立商品范围 Implementation Plan

**Goal:** 场景额度弹窗支持独立增删商品，保存、发布、复制及运行计算保持范围一致。

**Architecture:** policy 提供稳定键与索引兼容的范围解析；编辑器、发布校验、数量计算按周期和场景投影有效配置，公共商品范围只作为无记录场景的回退。

**Tech Stack:** 原生 JavaScript、HTML dialog、CSS、Node VM 回归脚本。

**Spec:** `docs/superpowers/specs/2026-09-18-buffet-scene-product-scope-design.md`

## 全局约束

- 场景外商品不受本场景对象限制，全轮总量继续统计全部菜品。
- 菜品集至少两个商品，普通商品/分类至少一个对象。
- 没有显式记录时沿用公共范围，显式空记录不回退。
- 稳定键优先，索引键次之；返回独立副本，禁止共享数组引用。
- 仅修改自助餐脚本；不修改 unrelated TipOut、eMenu 产物。

## Task 1：范围解析与运行入口

Files: `buffet-rule-policy.js`、`buffet-rule-domain.js`、`scripts/verify-buffet-scenario-targets.mjs`。

- [x] 先验证 `scenarioTargetKey` 缺失导致失败。
- [x] 新增 `scenarioTargetKey(draft, period, partyIndex, roundIndex)` 和 `resolveScenarioTargets(draft, config, period, partyIndex, roundIndex)`。
- [x] 稳定键范围隔离、空范围、索引键回退、独立副本测试通过。
- [x] `v4RuntimeViolations` 按命中场景范围筛选商品，保持全轮总量统计。
- [x] 验证第一轮限制 A、第二轮仅限制 B 时 A 不触发第二轮集合额度，但仍触发全轮总量。

## Task 2：弹窗事务与商品维护

Files: `order-limit-flow.js`、`order-limit-flow.css`。

- [ ] 新增场景有效配置投影，将所有渲染、选择、批量输入读写调用接入当前 combo。
- [ ] 原生商品选择 dialog 从当前门店目录获取候选；分类模式显示分类，商品与集合显示商品；已选身份不可重复添加。
- [ ] 增加逐项删除及批量删除原生确认；删除只清理对应场景目标额度和商品记录，不影响集合共享额度与其他场景。
- [ ] 保存提交范围和额度，取消还原 snapshot；保存下一场景后使用新的 snapshot。
- [ ] 新商品额度为空，保存前人数/轮次对象数、整数和上下限校验；新增数量不完整在继续与发布时阻止。

## Task 3：持久化、迁移、复制与检查

Files: `buffet-rule-policy.js`、`buffet-rule-profile.js`、`buffet-rule-domain.js`、`order-limit-flow.js`。

- [ ] normalize、作者配置、发布快照和运行编译保留 scenarioTargets；验证刷新与发布再计算结果相同。
- [ ] 区间删除删除场景记录，稳定 ID 保留的场景范围和数量一起保留；新场景公共范围回退且数量为空。
- [ ] 跨门店复制范围和数量按真实身份匹配，预览缺失商品；复制后范围不足禁止发布。
- [ ] 完整性、数量完成度、摘要、冲突与可满足性按每个场景投影检查，不使用公共对象并集代替。

## Task 4：验证

- [ ] 两门店、仅人数、仅轮次、组合矩阵的增删、批量、取消、保存下一场景、刷新浏览器验证。
- [ ] 执行 `verify-buffet-scenario-targets.mjs`、`verify-buffet-v4-runtime.mjs`、`verify-buffet-member-inline-limits.mjs`、`verify-buffet-multi-field-bulk.mjs`、生命周期及跨店复制相关脚本。
- [ ] 检查限定文件 diff；未完成 Task 2～4 前不汇报功能可用，不提交或推送半成品。

## 当前实施证据

- 已接入场景商品范围投影、添加、逐项删除、批量删除、原生删除确认、保存与取消快照、场景卡片统计和逐场景最低对象数校验。
- 发布与重新启用校验读取场景商品范围；冲突检查按人数和轮次的交集检查；发布快照与作者配置保持独立副本。
- 复制预览接入场景范围，按真实身份匹配候选及目标商品，缺失对象跳过；新增实际执行复制测试通过。
- 浏览器测试草稿 29 未发布：人数场景 1–2 人保留 3 商品、3 人以上保留 2 商品；保存下一场景、刷新恢复、批量数量、删除后取消恢复、商品不足阻止保存均已验证。
- 20 项相关回归通过。v4-profile、quantity-bulk-selection、period-scenario-editor、period-quantity-editor 四项失败已在 HEAD 原始资产上复现，不属于本次新增回归。
- 尚需补足仅轮次、人数与轮次组合、分类和两家门店的浏览器验收，以及索引场景商品记录的区间迁移边界检查。完成前不提交或推送本功能。
- 未修改 eMenu vendor 源码；无须触发 eMenu 嵌入包构建。保留工作区其他模块已有改动。
