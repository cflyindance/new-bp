# 小费明细与员工每日缺口补全计划

变更编号：TIPOUT-DETAIL-GAPS-20261023-01。用户已授权按既有规则继续补全，不新增资金/角色/权限算法。
基线main44ca8723；继续当前未提交的日期校验任务worktree，不覆盖前批成果，不提交/合并/推送。

## 实现边界
- 明细切店/切日/返回/同窗口路由导航：实际草稿才提示；页面内“放弃未保存修改？”、“继续编辑／放弃修改”。先恢复旧上下文再询问；取消/关闭/Esc/遮罩留草稿；放弃才清除自己的标记并执行一次原目标。保存中禁止；浏览器刷新/关闭只能保留浏览器beforeunload能力，不伪造原生截图。
- 首次人工调整后的确认保存manual来源；首次无调整保留system；已有结果重确认仍是系统重建。
- 员工每日：不再静默把倒置日期归一化为同日，保留输入和旧结果，字段错误，修复后刷新；范围不可超出继承快照周期；导出不能带错误上下文。
- 员工选择：核对现有小时/权重/标签重置路径并补真实图；重名ID改造不在本批擅自扩大。
- 规则迁移、真实邮件服务、全资金新契约、下载/权限/并发的剩余问题仍登记，不假称完成。

## 文件与步骤
- [ ] scripts/verify-tipout-detail-scope-guard.mjs：以实际函数验证无草稿不弹、保存阻止、取消不丢、确认回调一次、上下文恢复；首次人工确认manual与未调整system。
- [ ] scripts/verify-tipout-employee-detail-date-validation.mjs：日期空/倒置/越界/有效恢复，保留旧统计、阻止错误导出。
- [ ] 运行RED；预期旧allowDetailLeave调用window.confirm，新员工每日校验函数缺失，首次人工来源断言不成立。
- [ ] src/team/tips/programs/details.js.txt：复用页面分配对话框添加leave类型；allowDetailLeave(onLeave)返回同步boolean并延迟回调；renderDetailPage冻结目标并还原原选择；returnToSummary支持继续；首次人工来源正确。
- [ ] src/team/tips/tips-legacy-runtime.ts：导航已取消时恢复原URL/历史；通过回调恢复原目标历史项并派发hashchange，不新增重复历史。
- [ ] src/team/tips/programs/employee-reconciliation.js.txt、template、CSS、runtime依赖：校验后读取/渲染；错误可访问反馈；导出入口守卫，原normalize兼容函数不扩大使用。
- [ ] GREEN与相关保存/覆盖/日期专项/类型检查；实际65115隔离浏览器验收成功/取消/恢复/首次人工保存/员工切换，不操作原会话。
- [ ] 就近截图；产品V4.4、研发V3.4、个人V2.2同步同编号；覆盖清单仅按实测状态更新。
- [ ] diff、链接、哈希核对；保留已有未验证项。

Build skipped：未改依赖、构建配置或入口导入，仅既有运行时与模板处理。CI Build unknown。
风险/回滚：涉及草稿标记和路由，测试必须断言取消不清标记、确认仅一次。回滚仅本批局部代码，不回退用户数据/前批文档。

