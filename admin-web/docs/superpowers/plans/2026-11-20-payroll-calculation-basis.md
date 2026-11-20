# Payroll 计算依据实施计划

基线：main@1de4aa0fd；方案：用户已确认仅保留复杂加班的轻量计算依据，默认收起。
范围：展示层及三份既有文档，不改计薪引擎、工资快照、导出、薪资确认。

- [x] 修改 verify-payroll-ca-inline.ts：普通Regular/OT/OT2及空日无入口；weekly/continuous/seventh-day有入口；只呈现相关切片，不含Regular、当日合计；实际时薪与金额正确；转义及快照不变。
- [x] 运行测试确认旧渲染不满足新断言。
- [x] 修改 renderCaliforniaDayBreakdown(rows)：筛选weekly/continuous/seventh-day或有最高倍率归属证据的加班切片；为空返回空串。summary为“计算依据 · 日期”，保持原生details；行内显示规则、实际归属工时×实际时薪=切片收入及原核算依据，移除普通累计区间和当日合计。
- [x] 保持现有小字行内样式，使用两列布局及窄屏换行，不新增浮层。
- [x] 同步产品／研发／个人规范文档V1.43，明确入口判定、只读内容与缺图状态。
- [x] 运行四组回归及tsc，功能端口5319验证普通日无入口、复杂日默认关闭、展开/收起及金额不变；截图缺口就近标记。
- [ ] 未获授权不提交、合并或推送。

## 实际验证

2026-11-20，codex/payroll-calculation-basis，1de4aa0fd起点，未提交。外部浏览器实际项目双周示例：6月20日无入口；6月25日至7月2日8个复杂日期均默认关闭；6月25日点击展开显示每周4h×$30=$120、连勤4h×$60=$240及依据，再次点击关闭。总收入仍$5880。
verify-payroll-ca-inline、verify-payroll-hourly-summary、verify-payroll-continuous-merge、verify-payroll-ca-bridge及tsc --noEmit通过；git diff --check通过。
未闭合：当前页面截图、键盘及窄屏视觉检查、真实生产工资验证；不将DOM状态检查当作截图验收。
