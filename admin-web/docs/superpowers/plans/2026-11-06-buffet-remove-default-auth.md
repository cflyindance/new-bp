# 自助餐授权设置精简 Implementation Plan

> **For agentic workers:** Execute inline task-by-task; no automatic commit, merge or push.

**Goal:** 移除自助餐规则默认授权范围及原因设置，保留范围权限。

**Architecture:** 通过 isBuffetProfile 隔离共享编辑器；自助餐 profile 发布校验不依赖隐藏默认值；列表列注册同步移除。历史数据不迁移。

**Tech Stack:** 原生 JavaScript、Node VM 回归、外部 Chrome。

**Spec:** ../specs/2026-11-06-buffet-remove-default-auth-design.md

## Global Constraints

- 基线 main@a8ae0dd71b6129ee7450d1a7252c28209b9e576c，独立工作区开发。
- 非自助餐页面保持默认范围和原因设置。
- 历史 defaultScope、reasonRequired 不批量清空，不改变密码和范围权限判断。

## Task 1: 编辑器、发布及列表一致性

Files: dist/Configuration center/assets/order-limit-flow.js、buffet-rule-profile.js、buffet-rule-list-view.js；scripts/verify-buffet-hidden-operation-entry.mjs。

- [x] 修改 VM 渲染测试：自助餐三种默认值、空值、授权关闭和只读状态均无 data-auth-default／data-auth-reason；普通模块仍存在。
- [x] 先运行 `node scripts/verify-buffet-hidden-operation-entry.mjs` 记录失败。
- [x] renderStepSix 中仅非自助餐拼接默认范围及原因区域；复核摘要只保留授权范围。
- [x] validateSixStep 的默认范围校验加非自助餐条件；profile 的自助餐发布基础校验删除该要求；保留至少一种范围和角色必填。
- [x] 移除自助餐列表两项列注册及单元格，旧列选择由现有列清洗逻辑过滤。
- [x] 自助餐默认范围和原因事件直接忽略；非自助餐事件保持。
- [x] 增补发布校验：missing／round／order／operation 等旧默认值不阻断，空范围及缺角色仍阻断。
- [x] 运行全部 verify-buffet 脚本、JS语法及 git diff --check。

## Task 2: 文档和真实页面验收

- [x] 三份既有权威文档同步字段表、版本、配对版本及变更编号 BUFFET-20261106-01。
- [x] 独立端口仅服务当前工作区 dist，外部 Chrome 新建隔离草稿完成到授权步骤。
- [x] 核验开关开／关、范围及权限、无两个删除字段；保存截图就近配图。
- [x] 记录未验证外部终端与未提交状态，交付可点击且显示端口的功能预览。

验证：83 项 verify-buffet 回归通过，含增强的历史字段兼容、缺范围和缺权限校验。外部 Chrome 端口5296授权开／关页面通过并保存截图；非自助餐由 VM 渲染与事件回归覆盖，未独立浏览器验收。外部终端与真实密码授权未验证。未提交、合并、推送。
