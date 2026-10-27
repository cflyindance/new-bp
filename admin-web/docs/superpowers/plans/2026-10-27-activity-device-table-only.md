# 门店设备表精简实施计划

**Goal:** 门店详情设备表直接展示使用指标，不提供设备展开。
**Architecture:** 删除门店 UI 的行内详情渲染和专用事件/CSS，复用现有统计；旧设备路径只确定门店及页签。独立设备模块不改。
**Tech Stack:** TypeScript、Vite、原生 DOM。
**Spec:** ../specs/2026-10-27-activity-device-table-only.md。

## 执行清单

- [x] 在 src/config/merchant-activity-ui.ts 移除设备链接、操作列、devicePage 和设备 toggle 事件；空表 colspan 为 11。删除历史深链设备额外插入例外，保留路径校验。
- [x] 在 merchant-activity.css 移除仅用于展开的样式；保留共享独立设备详情样式。
- [x] 三份既有文档 V2.1 同步设备字段、旧地址定位、操作清单及实际截图，保留未变数据与独立设备定义。
- [x] 路径/统计/独立设备/权限/导航回归、TypeScript、diff 检查；独立功能预览实际验证全部产线、Kiosk、旧设备地址、空表/异常和独立设备。

用户在效果交付后已明确授权提交、合并和推送；按安全主线流程整合和核验。源自最新本地 main@49bc9269；变更位于新功能分支。
