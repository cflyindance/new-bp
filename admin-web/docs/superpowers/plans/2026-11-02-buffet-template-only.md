# 自助餐模板锁定 Implementation Plan

> 在当前会话逐项执行，不自动提交；用户已指定直接修改。

**Goal:** 新增规则隐藏自定义入口并锁定模板预设，不影响历史编辑和后续额度。
**Architecture:** 在新建草稿创建点保存 `buffetTemplateSelectionMode: "preset_only"`，仅该模式启用界面与事件防护；沿用既有模板影响确认。
**Tech Stack:** 原生 JavaScript、Node VM 验证脚本、静态 HTML 浏览器验收。
**Spec:** ../specs/2026-11-02-buffet-template-only-design.md

## Global Constraints

不在 main 开发，不自动提交、合并、推送；不迁移历史数据；不修改 eMenu。

### Task 1：新增限制与回归

文件：`dist/Configuration center/assets/order-limit-flow.js`；测试 `scripts/verify-buffet-template-only.mjs`；更新已有规则类型字段顺序和周期测试中受影响的旧断言。

- [x] 增加 VM 测试：无模板或 custom 返回错误；九模板预设只读；历史无标记仍兼容；非法 custom 应用不改草稿。
- [x] 执行 `node scripts/verify-buffet-template-only.mjs`，先验证失败（旧行为返回周期缺失而非模板缺失）。
- [x] 在 initializeDraftRule 创建空白新规则时写模式标记，不在 normalizeLoadedEditorDraft 加默认标记。提供 `buffetPresetTemplate(draft)` 和 `buffetTemplateFieldLocked(draft, field)` 统一判定；在 renderChoice 调用与 changeChoice 同时使用。
- [x] 新增模式仅允许 visible 且非 custom 预设，周期控件只读；校验模板存在、预设主体和周期匹配；数量区块由既有额度推导，可随实际数值启用，不把空额度默认区块当成不可变化数据。
- [x] 执行全部 82 项 verify-buffet 脚本通过，JS 语法及 `git diff --check` 通过。既有字段顺序／周期测试无需修改，历史兼容断言仍通过。

### Task 2：预览与文档

- [x] 独立静态功能预览 5192，新建测试草稿；IAB 逐模板验证主体／周期只读、对象可选；隔离浏览器验证草稿重载及双计量额度可编辑。
- [x] 验证有数据切换模板时确认、取消；五张真实截图与逐操作清单已入个人版。历史／失败／添加弹框及后续步骤缺图已登记，未宣称全覆盖。
- [x] 更新既有权威设计第 3.2、3.3、3.5 与 QA；在既有基线没有配对文档时，仅为本变更补齐研发与独立个人版，明确不是历史全量补齐。三份互链，同一变更编号，缺图明确登记。
- [x] 交付实际分支、main@6b86f00e 基线、5192 地址、测试结果与未闭合项；未进行 Git 提交。
