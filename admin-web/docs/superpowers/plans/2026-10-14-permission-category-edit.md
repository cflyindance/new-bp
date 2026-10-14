# 分类编辑合并 Implementation Plan

> **For agentic workers:** Execute inline in the current approved implementation workflow; steps use checkbox syntax.

**Goal:** 分类管理只显示“编辑分类 ?”，同时代表新增、删除、修改，其他动作不合并。

**Architecture:** 使用新动作 manage-category 替代三个展示资源；旧键保留在存储但不再参与计算。新键缺失按 hidden，不将旧局部允许升级。说明作为资源 help 元数据在共享编辑/员工/预览中展示，hover/focus/click 可读，不修改草稿。

**Tech Stack:** TypeScript、Vite、Node assert、agent-browser。

**Spec:** 已确认编辑分类及提示“编辑权限包含新增、删除、修改”；同步既有三份文档 PERM-20261014-04。

## Global Constraints

- 本轮限前厅分类管理 `/operations/queue-call/classification-settings`；编辑菜单配置、导出、打印和其他页面保持独立。
- 保留旧 create/edit/delete grants 和 overrides，不自动授权新合并点。
- 父级关闭阻断下级、门店例外隔离；仅本地配置/预览，无生产鉴权接入。
- 不自动提交或推送。

## Files and steps

- [x] 新增 scripts/verify-permission-category-edit.ts；首轮 RED 缺少组合点，随后 GREEN，旧三项全允许也不推导新点。
- [x] center-actions.ts 合并分类资源，help 和 relatedControls 标明三个真实源码点；Resource 和 catalog 传递 help。
- [x] 编辑/员工/预览共享同行问号及 aria-describedby，hover/focus-within 显示说明，不生成新权限行。
- [x] 五个权限脚本与 tsc 通过；Vite 独立构建 .cache/permission-category-edit-build-20261014 成功，550 模块，仅既有警告。
- [x] 产品 V3.0、研发/个人 V2.0 同步 PERM-20261014-04，146 动作及旧配置复核处理清楚，历史数字保留。
- [x] scoped Vite 重启后 HTTP 200；独立无成员角色 hover/click/Tab focus 显示说明且权限不变，父关闭 disabled=true/原允许保留、保存刷新正确；两张实页图已查看。

## Self-review

分类合并与独立导出不冲突；旧分拆配置不能安全推导全部编辑，沿用新资源默认拒绝，保留原始数据。说明的字符均转义，问号不注册业务权限。
