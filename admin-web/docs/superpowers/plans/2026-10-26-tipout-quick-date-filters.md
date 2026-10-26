# 小费汇总快捷日期 Implementation Plan

> 执行方式：本会话按检查点实施；用户已确认六按钮及日期口径。提交、合并、推送须另获授权。

**Goal:** 在小费汇总日期范围左侧提供今天、昨天、本周、上周、本月、上月。

**Architecture:** 扩展现有TipOutSummaryDateSort日历工具生成范围；通过原handleSummaryDateRangeChange校验、刷新和保存查询上下文。原分配、确认和统计计算不改。

**Tech Stack:** Vite／TypeScript宿主、Shadow DOM原生HTML、CSS、JavaScript运行时、Node VM测试。

**Spec:** 用户2026-10-26确认；产品／研发／个人规范三文档共同编号TIPOUT-QUICK-DATES-20261026-01。

## Global Constraints

- 基线main@470da97f；独立codex/tips-quick-date-filters-20261026，不改65133主线服务。
- 周一为周首；本周／本月截至今天，上周／上月完整自然周期；起止日均包含。
- 使用与现有默认查询一致的浏览器本地日历，不引入UTC转换、毫秒减天或新营业日截点。
- 首次默认最近一个月不变，不自动选快捷项；手动改任一日期（包括错误日期）清高亮。
- 两汇总共用日期；保留门店、角色、员工、状态及排序。只查询，不生成分配或发放记录。
- 保留原空值／倒置错误保护。快捷合法范围可修复错误，成功只刷新一次。
- 用户确认的UI样式为平铺、窄屏换行；不做额外视觉重构或引入依赖。

## Task 1：日期计算、联动与界面

Files：src/team/tips/legacy/tipout-summary-date-sort.js.txt；programs/distribution.js.txt；templates/distribution.html；tips-page.css；scripts/verify-tipout-quick-date-filters.mjs。

- [x] 先编写失败测试：quickDateRange('last-month', new Date(2024,2,1))必须得到2024-02-01至2024-02-29；覆盖周一／周日／跨年。
- [x] 实现quickDateRange(key, now?)，未知key／无效Date返回null，localDateKey不使用toISOString。
- [x] 新增六个type=button、aria-pressed=false按钮；使用data-date-preset稳定标识及原运行时事件绑定。
- [x] applySummaryDatePreset填写两个输入并调用原日期处理；syncSummaryDatePresetUi只对当前用户选择且日期仍匹配的项高亮。
- [x] 手动修改清选择；renderSummaryViews校验前同步按钮，返回历史只恢复固定日期，不猜相同范围的快捷标签。
- [x] 范围单测＋原日期校验回归；VM断言刷新一次、过滤状态及业务账不变。

## Task 2：真实预览、文档与交付

- [x] 65134功能预览，保留65133主线；演示会话实际点击六按钮，验证输入、列表、统计、页签和手动日期。
- [x] 验证900px窗口换行、键盘按钮、错误恢复、无分配／发放写入；390px宿主固定侧栏限制单独记录，不扩展全局响应改造。截图保存到文档assets/tips-quick-dates-20261026，记录源码版本与哈希。
- [x] 产品V4.19、研发V3.19、个人V2.17同编号互链；逐字段定义六个快捷日期，截图就近内嵌，操作清单逐项记录。
- [x] 执行tsc --noEmit、专项测试、文档链接检查、git diff --check；报告功能分支地址及未提交状态，不代替生产／全量验收。
