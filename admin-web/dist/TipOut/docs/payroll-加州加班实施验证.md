# Payroll 加州加班实施与验证记录

变更编号 PAYROLL-20261111-CA-OVERTIME；三份配对文档V1.37：[产品](./payroll-需求分析.md)、[研发](./payroll-报表功能设计.md)、[个人规范版](./薪资管理需求文档（个人规范版）.md)。本文件仅为实现证据，不是第四份业务权威。

## 检出与环境

- 独立克隆：D:/Projects/new-bp-payroll-ca/admin-web；分支codex/payroll-ca-overtime，起点main@bf585d92000b06fe41ea72e9263824524d6fdf64。
- 已获授权使用D盘独立克隆代替未完成注册的应用worktree；原F盘脏工作区未编辑、原服务未停止。C盘未完成worktree未作为交付目录。
- 功能服务5317；http://127.0.0.1:5317/#/team/payroll-report ，不是main预览。此处记录实施核验环境；提交、合并状态以Git记录为准，不代表已推送。
- 浏览器独立会话payroll-ca-native；本地Mock API和localStorage的受控数据，不是生产工资。未执行真实配置下发或工资发放。

## 已执行检查

| 检查 | 结果与范围 |
| --- | --- |
| TypeScript整项目 | 代码检查通过；不代表浏览器、后端或法律适用全覆盖。 |
| verify-payroll-ca-overtime.ts | 每日/每周/第7天、跨期周上下文、完整日期、重复日期、资格/费率阻断、非重复计薪、纯函数不修改输入。 |
| verify-payroll-overtime-migration.ts | 必须重新核实、新ID、保留原对象、门槛/倍率校验。 |
| verify-payroll-ca-bridge.ts | 显式启用、按打卡核算、周8h投影、冻结后不重算、额外收入/休息/缺考勤阻断、异常无薪休息字符串。经esbuild打包后Node运行。 |
| verify-payroll-ca-persistence.mjs | 修复日历selection内旧data覆盖刚加载的工资快照；确认后的加州工资不被员工主数据刷新改写。 |
| 原有回归 | native runtime语法与挂载、员工身份即时保存、Regular/OT不重复、打印范围/分页/样式契约通过。不是实际PDF逐页验收。 |
| 源码运行链 | 本次修改src/team/payroll原生入口及休息与加班配置，未改eMenu。native runtime测试改为验证实际导入的raw脚本及脚本语法，不再要求与独立dist历史副本逐字相同。 |

## 原生页面逐操作证据

每张图片均为2026-11-11、5317功能分支；受控异常/工资算例明确区分。截图未覆盖的操作不能据代码通过判为浏览器验收通过。

| 页面/操作 | 触发后结果 | 对应截图/状态 |
| --- | --- | --- |
| 薪资管理/编辑 | 更多→编辑，新增加州核算、核实基数、资格确认字段 | assets/payroll-ca/editor.png；可见字段实拍。 |
| 编辑/Confirm | 输入US-CA、20并核实，保存配置并关闭；原数据有服务费时显示阻断 | assets/payroll-ca/blocked.png；不是核算成功。 |
| 薪资管理/完整算例 | 刷新读取保留配置，三卡显示Regular80、OT4、OT2 2、周16、第7天10，总112h/$2600 | assets/payroll-ca/summary.png；日加班30/40费率及周分规则小计已核对。 |
| 点击第7天 | 抽屉展示前8h/$240及超8h2h/$80，总10h/$320 | assets/payroll-ca/seventh-day.png。 |
| 第7天/倍率筛选 | 选择2倍后只剩2h/$80 | assets/payroll-ca/seventh-filtered.png。 |
| 点击每周加班 | 两个工作周各8h/$240，共16h/$480 | assets/payroll-ca/weekly.png。 |
| 每周/日期筛选 | 2026-11-13仅8h/$240 | assets/payroll-ca/date-filtered.png。 |
| 日期与倍率交集/无记录 | 上述日期选2倍，显示无记录、0h/$0 | assets/payroll-ca/no-results.png。 |
| 旧规则编辑→连勤累计 | 保留天数/两档，显示人工核实勾选 | assets/payroll-ca/migration.png。 |
| 迁移/未核实保存 | 拒绝保存，保持弹框，未创建候选 | assets/payroll-ca/migration-required.png。 |
| 迁移/小数天保存 | 5.5被拒绝并提示1–365整数 | 浏览器已检查文本；待补独立错误截图。 |
| 迁移/核实后保存 | 页面候选显示连勤满5天、50/54小时、3/4倍 | assets/payroll-ca/migration-draft.png；仅草稿，不是发布。 |
| 迁移/外层保存下发 | 未执行 | 不能把纯函数归档测试及候选列表当作发布验收。测试后放弃本任务草稿并恢复隔离会话原设置。 |
| 新建/取消/关闭/确认失败 | 未全量实测 | 待补独立操作及结果截图。 |
| 抽屉/关闭按钮/空白/Esc | Esc与宿主快捷键冲突已加捕获处理；复验open=false，焦点返回weekly按钮，金额不变 | assets/payroll-ca/closed.png已重新拍摄；空白关闭及关闭按钮独立截图待补。 |
| 工资确认/冻结/刷新 | 纯函数及快照加载测试通过 | 待补完整原生确认成功/声明失败/取消/刷新截图；真实后端防改未验收。 |
| 明细/PDF/CSV/ADP | 已复用互斥切片计算与1.5/2倍旧槽 | 未生成文件逐页核验，未新增所有分规则列，不称导出验收完成。 |

## 未闭合项

1. CA-01：企业连勤3倍/4倍与法定工资的叠加/抵扣政策未定，本期不自动计入工资；旧类型仅人工核实后形成新配置版本，历史工资不自动重算。
2. CA-02：明细/打印/PDF/CSV仍沿用旧倍率汇总字段，尚未补齐每周、第7天的分规则列及所有文件/分页证据。
3. 不支持多费率regular rate求解、奖金分摊、服务费、餐休补偿、未分配带薪休息、替代工作周、豁免或其他特殊行业规则；需上游核实后另行扩展。不代表完整加州合规引擎。
4. 此任务完成前端保护及隔离Mock测试；生产数据迁移、服务端锁定、真实下发、工资支付未执行。配置读取不自动批量迁移旧规则。

## 可复现命令

在功能检出根目录运行Node23、npm安装的本地工具：tsc --noEmit；Node --experimental-strip-types运行核算和迁移测试；esbuild将bridge测试打包为CJS后运行；Node运行persistence、native-runtime、identity-save、print-style-parity、regular-hours检查。

Git diff --check仅验证补丁空白，不等同于业务验收。待确认/未完成项不能因编译成功关闭。
