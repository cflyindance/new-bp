# Payroll California Overtime Implementation Plan

**Goal:** 在原生Payroll三卡与明细中支持加州标准非豁免员工加班分类，保留历史工资，安全准备企业连勤配置迁移。
**Architecture:** 独立纯函数分类完整工作周；输入为核实后的工作日分钟与regular rate。运行时桥接消费明确的加州核算上下文，不从门店名称猜测辖区、不从基础薪资猜regular rate；已确认工资不重算。三卡及抽屉读取同一结果，主页面不另铺重复加班表。
**Tech Stack:** TypeScript、原有Payroll shadow-root/legacy runtime、Node assertion scripts。
**Spec:** 独立讨论稿V0.6及用户后续确认：先支持加州；旧类型迁移为连勤累计；草稿重验、已生效留版本、确认工资不改。

## Constraints
- main基线bf585d92000b06fe41ea72e9263824524d6fdf64；D盘独立克隆codex/payroll-ca-overtime；不改原检出。
- 加州每日8/12h，1.5/2倍；同工作周第7天前8h1.5倍、之后2倍；日加班不再产生周加班。需完整工作周，特殊工时/豁免不套用。
- 企业连勤3/4倍不是法定默认值，未经完整企业支付/抵扣策略确认不自动写入工资。
- 不迁移已确认工资，不自动执行提交、合并、推送。

## Tasks
- [ ] scripts/verify-payroll-ca-overtime.ts：断言5×8h无加班、6×8h周加班8h、4×12h仅每日16h、第7天两档、周期截取、缺历史/费率/特殊工时拦截，先运行失败。
- [ ] src/team/payroll/payroll-ca-overtime.ts：实现calculateCaliforniaOvertime(input)，返回ready切段或blocked/null金额；输入不可变。
- [ ] 规则迁移：新增continuous类型、旧nth-day只读版本保留；编辑迁移需要重验阈值和天数，确认后创建新版本；不读取即写回。
- [ ] 原生运行时：接统一结果至三卡、日期行、只读明细；旧数据无核算上下文不伪算，confirmed读取冻结快照。
- [ ] 三份Payroll文档同编号更新有效定义，独立登记未接入和缺图，不把原型图片冒充生产验收。
- [ ] 运行纯函数/迁移/现有Payroll回归及TypeScript；功能分支独立端口真实页面验证，更新逐操作图片清单。

## Evidence

2026-11-11实施状态：纯核算、连勤配置/显式迁移、原生三卡/日期行/抽屉、V1.37三文档已落地，TypeScript与核算/迁移/持久化/桥接/原有专项回归通过；实际页面112h/$2600、两档抽屉与筛选、迁移草稿已验证。完整工资确认、真实下发、分规则PDF/CSV及逐操作全截图仍未完成，详见dist/TipOut/docs/payroll-加州加班实施验证.md；不将这些待验收项标为完成。企业连勤支付/抵扣策略未定，不自动计薪。所有修改未提交。
加州官方：https://www.dir.ca.gov/dlse/FAQ_Overtime.htm；不重复计薪：https://www.dir.ca.gov/dlse/AB60update.htm。仅覆盖一般标准员工，不声明全加州所有行业或例外合规。
