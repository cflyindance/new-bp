# 自助餐最终保存 Implementation Plan

> 执行方式：当前会话逐项实施，不自动提交、合并或推送。

**Goal:** 全新自助餐规则只在最后保存为禁用正式规则。

**Architecture:** 用仅存在于编辑会话的 transientCreate 标记隔离新建；复用完整 validateAll 和兼容配置构建器，通过 repository.mutateEnvelope 原子插入禁用规则。现有规则编辑、复制和历史草稿继续原流程，不迁移数据。

**Tech Stack:** 原生JavaScript、Node VM回归、外部Chrome验收。

**Spec:** 自助餐新建规则最终保存方案.md

## 约束

- 基线main@493bbbb8，包含远端b9cee223及本地已合并小费修复；不改小费代码。
- 无持久草稿、无中途自动保存、无发布或下发副作用。
- 最终保存放页头右侧；底部只保留向导步骤操作，最后不重复保存。

## Task 1：新建生命周期与原子保存

- [x] 新增 scripts/verify-buffet-final-save.mjs，VM提取真实初始化、保存、标脏、持久化函数；断言新建仓库写入次数为0，markEditorDirty不写sessionStorage或启动定时保存。
- [x] 首次运行测试，确认在旧实现失败。
- [x] initializeDraftRule仅对无ruleId、无draftId、非copy的自助餐创建内存记录，id=null、status=disabled、transientCreate=true；不更改URL为draftId。
- [x] saveEditorDraft对该模式不写入；markEditorDirty仅设置dirty。旧模块和存量记录分支原样保留。
- [x] persistNewBuffetRule在mutateEnvelope锁内分配ID并buildCompatibilityRule(record, disabled)，仅push到rules，不改drafts、snapshots或currentSnapshotId；失败throw，不能修改原会话或标记saved。
- [x] UI保存前validateAll；保存中禁用按钮，成功保存引用ID防重复，成功才清dirty及返回；失败保留输入并允许重试。

## Task 2：按钮、退出与文档

- [x] 对新建标记显示“确认保存／复核并保存”，隐藏草稿入口；最终页头单一“保存”，隐藏底部最终按钮。
- [x] 最终复核将发布检查文案替换为保存检查，并说明保存后禁用、列表启用。
- [x] 页面返回只允许继续编辑或放弃返回，放弃只清内存；beforeunload检查dirty及商品弹框修改，成功保存和确认放弃时解除保护。
- [x] 完整运行verify-buffet脚本、语法与diff校验；新增测试覆盖失败后重试、重复保存、并发ID、遗留流程不变、非最终步骤拒绝保存。
- [x] 在功能工作区启动独立端口，用外部浏览器从新建走完5步，截图首步无草稿、末步保存和列表禁用；记录无法实际覆盖的异常。
- [x] 三份文档同步有效定义和存量边界，保留列表方案开放事项；不以新建改造宣称历史迁移完成。

验证记录：84项verify-buffet回归通过；新建到保存禁用、无草稿ID、未保存退出继续／放弃、列表筛选返回保持已由外部Chrome验收。配额失败／重复提交／锁内ID分配由VM测试覆盖；原生beforeunload未手动触发验证。CLI会话曾出现about:blank与陈旧元素，已切换外部Chrome完成，不将这些中间图纳入文档。main预览未改，功能预览5297；当前分支未提交，不执行Git提交、合并或推送。

