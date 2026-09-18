# 自助餐区间集合入口实施计划

**Goal:** 人数与轮次区间通过集合入口打开设置弹框。

**Architecture:** 弹框编辑区间副本，保存时使用现有连续区间校验与 requestRangeMatrixChange；取消丢弃副本。保持 rangeId 和既有额度迁移逻辑。

**Tech Stack:** 原生 JavaScript、CSS、HTML dialog。

**Spec:** 用户确认的本地区间集合可视化方案。

## 执行

- [x] 替换 renderBuffetQuantityRanges 的表格为集合入口。
- [x] 增加区间弹框、独立副本及新增/删除/保存/取消事件。
- [x] 保存调用 validateContinuousRanges，成功后调用 requestRangeMatrixChange，不改数量计算逻辑。
- [x] 检查语法、运行既有验证脚本，浏览器验证入口、取消及保存。
- [x] 不自动提交或推送，保留其他未提交修改。

## 验证结果

人数弹框新增后取消保持原区间；起始值 0 无法保存；保存新增区间调用既有修改确认后，集合计数和场景卡片同步更新。区间边界变化后数量额度是否保留仍由既有矩阵更新逻辑决定，不修改其语义。

通过脚本：verify-buffet-range-collections、verify-buffet-scene-cards、verify-buffet-v4-runtime、verify-buffet-member-inline-limits。
