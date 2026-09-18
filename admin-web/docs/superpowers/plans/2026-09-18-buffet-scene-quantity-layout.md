# 场景数量配置布局实施计划

**Goal:** 按用户确认的场景配置预览优化正式弹框。

**Architecture:** 复用 renderV4PeriodScenario 及所有数量输入事件；样式只作用 quantitySceneDialog。批量栏以局部状态控制展开；下一场景使用同周期 quantityScenarioIndexes 顺序，并在保存后建立新的取消快照。

**Tech Stack:** JavaScript、CSS、原生 dialog。

**Spec:** 用户确认的 scene-quantity-workbench-v1 本地预览。

- [x] 顶部关闭、门店/周期/场景信息、计数、保存并返回和保存并配置下一场景。
- [x] 额度区分块、最少/最多字段紧凑横向排列，保留未配置/0 语义。
- [x] 商品筛选紧凑排列，批量数量按需展开，保留既有选择范围和批量处理。
- [x] 保存校验失败不得跳转；末场景禁用下一场景；下一场景取消恢复其自身快照。
- [x] 运行既有脚本并通过浏览器验证，不自动提交推送。
