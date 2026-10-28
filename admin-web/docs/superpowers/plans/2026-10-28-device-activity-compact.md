# 设备抽屉信息精简实施计划

**Goal:** 设备当前信息只在头部展示，正文专注使用指标和历史。
**Architecture:** 删除重复展示，沿用全部数据模型及抽屉状态；桌面指标改为三列，小屏沿用现有响应式规则。
**Tech Stack:** TypeScript、原生 DOM、CSS、Vite。
**Spec:** ../specs/2026-10-28-device-activity-compact.md。

- [x] device-activity-ui.ts 删除状态卡/归属面板，当前 License 并入头部，订单说明精简。
- [x] merchant-activity.css 增加设备抽屉专用桌面三卡规则。
- [x] 同步三份 V2.3 文档与对应实际截图，保留既有验证缺口，不新增统计业务。
- [x] 正常/历史/未绑定/异常与关闭路径浏览器核验；现有统计/权限/导航、TypeScript、宿主构建及文档引用检查。

开发基线 main@914e53c4；用户已授权提交、合并与推送，按安全主线流程交付，结果见 Git 日志和验证记录。
