# 小费汇总日期校验实施计划

基线：origin/main@44ca87232e5d60479f1e58001d396c227199a776。分支：codex/tips-summary-date-validation-20261023。
规格：用户2026-10-23确认的“按缺口分类、按页面分批实现”，第一批日期汇总。变更编号TIPOUT-DATE-VALIDATION-20261023-01。
本任务不授权Git提交、合并、推送；不实现尚未确认的资金、权限、邮件投递规则。

## 目标与设计

保留真实无数据与无效输入的区别。合法日期仍即时查询，含首尾；同日合法。
空日期、无效日期、开始晚于结束：保留用户输入、就近报错并定位字段；不读取事实、不将列表或金额重置为0，提示当前仍显示上次有效查询结果。
错误期间阻止基于旧结果的明细跳转、页签切换、行内分配、发放入口、批量入口、取消分配及导出；不持久化错误日期。
修正后清除错误、重算一次并保存有效查询上下文。现有业务计算、锁定和批量确认流程不变。

## 文件与步骤

### 1. 测试校验及操作边界
- [x] 新增 scripts/verify-tipout-summary-date-validation.mjs：使用真实date-sort日历校验、提取真实处理函数，在VM中验证空起止、倒置、非法日历日、同日、保留渲染/历史、禁止事实读取和错误恢复。
- [x] 运行 node scripts/verify-tipout-summary-date-validation.mjs；基线应因缺少validateSummaryDateRange而失败。
- [x] 操作测试对错误范围逐个调用实际导航、写入及导出入口；任何落入未桩化下游的调用均失败，防止只测文案。

### 2. 实现日期校验及可访问反馈
- [x] src/team/tips/programs/distribution.js.txt：新增validateSummaryDateRange(focusError)返回boolean，复用TipOutSummaryDateSort.isValidDateRange，更新summaryDateRangeError和aria-invalid；renderSummaryViews有效时记忆lastValidSummaryDateRange，无效立即返回。
- [x] 新增handleSummaryDateRangeChange()，合法才失效缓存、渲染及记录历史；相关入口最前检查，错误不进入旧结果动作。
- [x] src/team/tips/templates/distribution.html：起止输入增加独立标签、aria-describedby和change处理；日期下就近role=alert，不使用浏览器系统对话框。
- [x] src/team/tips/legacy/export.js.txt：仅存在汇总校验函数时对菜单/导出/邮件入口调用校验，避免影响员工每日页。
- [x] 现有页签性能VM测试补充合法校验桩；验证旧切换调用次序不变。
- [x] 运行新专项、日期排序、页签/入口性能、批量覆盖及类型检查；区分既有失败。

### 3. 实际浏览器与文档
- [x] 将上一轮三份未提交文档、覆盖清单和125图作为本任务继续维护基线承接；保留原件。
- [x] 独立65115预览、独立演示浏览器，验证开始空/结束空/倒置/修复/同日/员工页签；记录保留金额、列表和无错误写账的证据。
- [x] 截图就近放置；产品V4.3、研发V3.3、个人V2.1，同一变更编号；D02覆盖清单区分完成与未完成，其他页面缺口不宣称已解决。
- [x] 校验旧字段行/历史图片保留、图片路径、文件哈希及git diff --check。
- [x] 未获授权不提交/合并/推送。

## 后续批次

员工每日/明细的草稿切日切店及员工替换、规则兼容和导出文件单独核对；本批不视为其完成。纯缺图不新造逻辑，未确认业务不自行决策。

## 实施结果

2026-10-23完成第一批：日期专项、页签／入口性能、批量覆盖及tsc通过，浏览器10图、账本与原查询结果保留验证通过，文档401条本地链接检查无断链。旧日期排序脚本CSS断言在原基线亦失败，未计作通过。未进行完整生产回归、CI部署或Git提交。本任务后续页面批次仍待执行，不把第一批交付宣称为全部缺口完成。

