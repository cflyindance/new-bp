# Batch export filters implementation plan

**Goal:** 门店、角色与员工组合筛选；允许切换有权限门店，切换清空选择，保持 10 人/PDF 限制。
**Architecture:** 向批量控制器传递现有 PayrollPageContext.getScope。纯函数按白名单门店 ID 和精确别名生成当前周期的独立数据快照；不改变全局门店。筛选只作用于弹框，提交再次校验权限与员工集合。
**Tech Stack:** TypeScript、HTML/CSS、现有 Node 验证脚本。
**Spec:** 用户 2026-10-08 确认的门店/角色/员工组合筛选；默认当前门店，切店清空、角色/搜索保留勾选。

## Global constraints
- 不自动提交或推送；保留已有未提交改动。
- 只使用项目提供的门店范围，拒绝手工注入非授权门店 ID。
- 不伪造无数据门店员工，不把其他周期的数据混入当前周期。

## Tasks
- [ ] 添加纯函数测试：白名单拒绝、门店精确匹配、不同门店周期隔离、角色与员工组合匹配。
- [ ] 新建 payroll-batch-export-filters.ts，导出 getBatchStoreId、scopeBatchSnapshot、filterBatchEmployees。
- [ ] 控制器增加 storeId/role，打开默认当前店；切店清空选择和搜索、重建角色；提交重新取权限。
- [ ] 模板增加门店/角色/员工一行控件，窄屏堆叠；数据为空禁导出。
- [ ] 复用桥接打印；临时按目标员工门店计算后恢复，不持久化主页面上下文。
- [ ] 运行筛选、原批量回归、TypeScript 和组件浏览器验证。
- [ ] 同步现有产品/研发/个人规范受影响正文、版本与缺口。
