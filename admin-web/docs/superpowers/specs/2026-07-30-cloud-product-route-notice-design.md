# 云产品入口提示 — 设计说明

> 日期：2026-07-30
> 范围：商家后台侧栏一级 / 二级入口
> 状态：已实施

## 目标

点击已由云产品承载的中心或页面时，弹出提示说明该能力通过路由配置接入，便于演示时区分「后台自研页面」与「云产品嵌入」。原有导航、滑层展开与页面跳转行为保持不变。

## 触发清单

一级导航点击即提示：

| 入口 | 提示文案 |
|------|----------|
| 商品中心 `product-center-main` | 云产品-商品中心-通过路由配置 |
| 会员中心 `members` | 云产品-会员中心-通过路由配置 |
| 评价中心 `reviews` | 云产品-评价中心-通过路由配置 |
| 预约等位中心 `reservations` | 云产品-云等位-通过路由配置 |
| 报表中心 `reports-finance` | 云产品-云报表-通过路由配置 |
| 礼品卡中心 `gift-cards` | 云产品-E-Card-通过路由配置 |

仅二级入口点击时提示（一级不提示）：

| 路由 | 提示文案 |
|------|----------|
| `/promotions/campaigns` | 云产品-促销中心-通过路由配置 |
| `/print-templates/decoration` | 云产品-打印模板-通过路由配置 |
| `/marketing/campaigns`、`/marketing/manual` | 云产品-营销活动-通过路由配置 |
| `/marketing/screensaver` | 云产品-云屏保-通过路由配置 |
| `/notifications/templates`、`/notifications/scene-config`、`/notifications/quota` | 云产品-消息中心-通过路由配置 |

## 实现方案

`src/config/cloud-product-route-notice-ui.ts` 收敛全部配置与弹窗：

1. 两张映射表：`NAV_MODULE_NOTICES`（按 `NAV_MODULES` id）与 `NAV_PATH_NOTICES`（按路由前缀）。
2. 文档级捕获阶段单例点击代理：先按 `a[href^="#/"]` 命中路由表，未命中再按最近的 `[data-nav-module]` 命中模块表。
3. 命中后仅记录待提示内容，`setTimeout(remount, 0)` 把重渲染推迟到导航 / 滑层自身处理之后，避免抢先重建 DOM 导致原有点击行为丢失。
4. 弹窗渲染在 shell 根节点（`z-[60]`，高于侧滑层 `z-[31]`），遮罩或「知道了」关闭。

## 验收

- 上述 6 个一级入口与 8 条二级路由点击后文案与清单一致。
- 促销中心、营销中心、打印中心、消息中心的一级行点击不提示。
- 弹窗关闭后导航状态与目标页面保持正常，控制台无新增报错。
