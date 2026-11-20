# Payroll hourly summary implementation plan

Goal: 工时、时薪、总收入逐行对应；连勤分档固定展开。

Spec: 用户确认的三卡布局，基线 main@3a5fa52b9。
Architecture: 展示层读取最终切片，按规则、档位和实际时薪构建共享行；不修改计算与快照。
Tech stack: TypeScript、原生 Shadow DOM、现有 payroll CSS。

- [x] 汇总渲染增加 hours/rate/amount 视角，保留 boolean 调用兼容；连勤小计及合计时薪为 —，子档不重复累计。多时薪分行，无切片时不猜测费率。
- [x] 将三卡接入共享行，移除连勤问号入口；保留每日明细原交互。中间卡标题同步中英文；分档名称不显示倍率。
- [x] 更新兼容模式时薪展示，不把工资合计作为时薪。兼容模式多费率仍在原行内分隔显示，不改变原行结构。
- [x] 更新分档与费率脚本断言，运行原计算回归及类型检查。
- [x] 同步三份既有文档；启动独立功能端口5318，验证实际页面。未经授权不提交、合并或推送。
- [ ] 页面截图：工具截图请求连接超时，未生成有效图片；三份文档就近保留待补标记。

## 验证结果

2026-11-20，功能分支 codex/payroll-hourly-summary，main@3a5fa52b9 起点，未提交。
四组脚本通过：verify-payroll-hourly-summary、verify-payroll-continuous-merge、verify-payroll-ca-bridge、verify-payroll-ca-inline；tsc --noEmit、git diff --check通过。
外部浏览器实际项目双周示例：工时112h、收入$5880；连勤62h/$4760，下分10h×$60=$600与52h×$80=$4160。三卡8行位置逐行相同；帮助入口数量0。未修改计薪引擎和导出逻辑。
截图及窄屏视觉验收未完成；生产工资数据未验证。
