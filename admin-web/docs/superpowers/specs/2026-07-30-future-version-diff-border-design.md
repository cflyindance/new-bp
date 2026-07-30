# 未来版本差异功能红框标注 — 设计说明

> 日期：2026-07-30  
> 范围：商家后台真实页面  
> 状态：已实施

## 目标

当顶栏版本视角为「未来版本」时，对相较 MVP **真正新增/恢复展示** 的功能添加红色边框，帮助演示与评审识别版本差异。切回 MVP 时不展示红框。

仅覆盖 UI 显隐差异，不标注纯行为差异（如 MVP 跳过首次引导、自动踢出集团总部/M 平台视角）。

## 唯一宿主清单

| 差异 | 唯一宿主 |
|------|----------|
| 侧栏 brand-mgmt / group-store-list / brand-store-list | `[data-nav-module="…"]` |
| 系统设置「平台预设」 | 二级导航对应 `<li>`（sheet / sidebar） |
| 模块设置 seq 583「额外时间」 | `[data-module-setting-row-seq="583"]`；Hub 搜索命中同 seq 的按钮 |
| 顶栏「重新引导」 | `[data-restart-onboarding]`（顶栏 + 平台预设页横幅） |
| 顶栏 AI 助手入口 | `[data-ai-assistant-open]`（不标浮层面板） |
| 品牌多门店「区域」筛选 | `#scope-region-select`，**仅品牌多门店视角**（集团总部 MVP 也有区域，不标） |
| 视角「集团总部」 | `data-view-switch-chain-perspective="group-hq"` 菜单项 |
| 视角「M 平台」 | `data-view-switch-option="m-platform"` 菜单项 |
| 前厅「查看方式」 | `[data-foh-settings-view-mode-bar]` |
| 营业时间卡片生效日期徽章 | 未来版本才渲染的日期 `<span>` |
| 营业时间弹窗生效日期 | `[data-business-hour-schedule-effective-dates]` |
| 额外时间「+ 添加生效时间」 | `[data-business-hour-exception-date-add]` |
| 从营业时间添加额外时间：名称 | `[data-business-hour-exception-name-field]` |
| 从营业时间添加额外时间：开始/结束时间 | 两个时间字段各自的容器 |
| 从营业时间添加额外时间：每周重复 | `[data-business-hour-exception-weekly-repeat]` |
| 员工打卡「打卡管理」页签 | `[data-clock-tab="live"]` |
| 员工打卡「规则设置」中的迟到宽限 | `[data-clock-late-grace-row]` |
| 团队管理「绩效与培训」 | 侧滑二级 `[data-future-version-diff]`（`team-training`） |
| 团队管理「设置」 | 侧滑二级 `[data-future-version-diff]`（`team-settings`） |

**明确不标：** 营业时间弹窗「每周重复」；AI 浮层整板。

## 实现方案

1. 差异容器添加 `data-future-version-diff`，每个差异只挂一个宿主。
2. `writeProductVersion()` 与每次 `mount()` 同步 `document.documentElement.dataset.productVersion`。
3. 样式门控：

```css
html[data-product-version="future"] [data-future-version-diff] {
  outline: 2px solid #ef4444;
  outline-offset: -2px;
}
html[data-product-version="future"] [data-future-version-diff] [data-future-version-diff] {
  outline: none;
}
```

禁止用会占盒模型宽度的 `border` 增宽实现红框。

## 验收

- MVP 无红框，显隐行为不变。
- 未来版本下，上表宿主均有一层红框。
- 集团总部未来版本下，区域筛选**无**红框。
- seq 583 列表行与 Hub 搜索结果均能标到。
- 红框不引发布局位移；版本切换后状态立即正确。
