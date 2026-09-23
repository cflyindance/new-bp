# Payroll Period Employee Display Implementation Plan

**Goal:** 原生薪资页支持动态周期明细、日期／工作周切换，以及七种隔离演示场景。
**Architecture:** 纯 TypeScript 生成示例期次和已分类的示例员工工时；注入现有原生运行时，复用实际页面、详情、导出组件。实际缓存和 API 保存路径在演示期间隔离，退出恢复快照。
**Spec:** `docs/superpowers/specs/2026-09-22-payroll-period-employee-display-design.md`

## 开发进展（2026-09-22）

- 已接入七种内存隔离演示场景、返回实际数据、Period 日期与频率标签、动态工作周分组、日期列表切换及部分工作周核对弹框。
- 已覆盖主表、员工详情与详细导出的固定两周分组限制；演示保存、花名册同步及员工刷新已隔离。
- 已通过示例分期连续性、跨年、第 2 期兼容、年中切换、第 5 工作周与现有薪资领域／状态／批量导出验证。
- 尚未完成实际路由浏览器验收：本地 5174 请求超时。完整构建尚未返回结果，不能视为交付完成。
- 本阶段不是完整规则发布引擎交付。真实门店规则版本的创建、发布、历史保护及服务端核算接入，仍按主实施计划推进；不可用样例生成器替代生产核算。

## Task 1: 周期与示例数据
- [ ] 新建 `src/team/payroll/payroll-schedule-demo.ts`，导出 `createPayrollScheduleDemo(scenario, store): PayrollData`。期号按结束年份生成；所有场景数据包含显式日期、周期类型和示例标记。
- [ ] 验证单周／双周／半月／月度／10 天／年中切换／短过渡，日期连续，2026/01/04–01/17 为第 2 期，2027/07/01 为切换场景第 15 期。

## Task 2: 原生页面与隔离切换
- [ ] 修改 `payroll-legacy-runtime.ts` 暴露生成器；新增 `legacy/payroll-schedule-controls.js.txt` 注入隔离切换与日期视图控制。
- [ ] 修改 `legacy/payroll.js.txt` 的两周固定桶为动态桶；按完整工作周日期分组，所有详情／导出使用相同分组逻辑。保存与远程加载、花名册同步在演示期间不覆盖实际数据。
- [ ] 修改 `payroll-template.html` 和 `payroll-polish.css`，增加场景入口和考勤视角切换。Period 显示日期和周期名称。
- [ ] 检查进入演示、场景切换、退出恢复、日期视角的金额一致性。

## Task 3: 验证与交付
- [ ] 新建 `scripts/verify-payroll-schedule-demo.ts`，验证连续性、跨年、工作周和样例隔离；运行现有薪资验证、TypeScript 检查和构建。
- [ ] 在本地实际薪资路由验证七场景、切换视角、员工详情、退出演示；记录未完成范围。不自动提交、合并或推送。
