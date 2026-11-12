# 连勤累计加班 Implementation Plan

**Goal:** 先验证达标当天起新增分钟分档，再按确认的重叠政策集成工资与UI。
**Architecture:** 独立pure calculator输出候选切片；现有加州核算不改名、不重算历史。规则使用ContinuousRuleCandidate。
**Spec:** ../specs/2026-11-12-payroll-continuous-overtime-design.md

- [x] RED：新增scripts/verify-payroll-continuous-overtime.ts，验证48h+15h=10h3倍/3h4倍；达到天数前不追溯；跨周期继承；0日重置；缺日期阻断；输入不变。
- [x] GREEN：src/team/payroll/payroll-continuous-overtime.ts，复用配置校验，按累计门槛切分钟，只输出第N天起候选。
- [x] 运行新测试、原加州回归、tsc。
- [x] 用户确认最高倍率后，完成互斥切片合并、显式选择配置、冻结快照读取、汇总/悬停/每日明细；旧固定倍率明细/打印/导出保护；同步三份V1.41。
- [ ] 新状态截图及员工编辑保存/取消完整交互验收未完成；原生DOM已验证默认汇总、hover浮层数值与视口边界，截图命令超时，缺口记录在实施验证。不得宣称已全部视觉验收。
