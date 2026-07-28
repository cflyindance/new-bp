# 门店信息 · 意图 vs 实现差异（DIFF）

> 范围：门店信息  
> 版本：v1.1  
> 导出日期：2026-07-28  
> 关联 PRD：`./PRD.md` · SPEC：`./SPEC.md`

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 首次导出（v1） |
| 2026-07-28 | v1.1：PM 裁决关闭 D1/D5/D7/D10；原型已落地 store.profile 域与旧路由重定向 |

---

## 已关闭（裁决）

| ID | 原类型 | 裁决 | 落地 |
|----|--------|------|------|
| D1 | 行为冲突 | **正式范围 = 现网 4 项**（417/433/418/582）；设计稿 10 项不作为本模块交付 | PRD/SPEC 已改 |
| D5 | 双轨入口 | **废弃** `/store/basic|logo|business-hours|*`，重定向至 `/stores/settings/*` | `main.ts`；`STORE_BASIC_SUBNAV` @deprecated |
| D7 | 下发域 | **纳入** `store.profile` | `deployment-config-domains.ts` |
| D10 | 582 产线 | **不加 POS** | PRD SI-31 / SPEC 约束；代码本就无 POS |

---

## 仍开放 / 跟踪

| ID | 类型 | 说明 | 证据 | 建议处理 | 置信度 |
|----|------|------|------|----------|--------|
| D2 | 代码有、范围外 | seq 173/170 UI 仍在仓库但未挂本 hub；按 D1 **不交付** | `store-profile-ui` / `store-operation-mode-ui` | 可另开清理任务或迁他 hub；不阻塞本模块工程 | 高 |
| D3 | 意图有、本 hub 未做 | 77 / 419 / 420 不在 4 项范围 | 设计方案 | 关闭为本模块 Out；若要做另立项 | 高 |
| D4 | 在他 hub | 547/530 在 brand-menu 设置 | catalog | 接受；文案勿暗示在「门店信息」内 | 高 |
| D6 | 推测项 | 工程 API / 表结构；SPEC §7.2 建议契约 | localStorage | 后端评审 | 中 |
| D8 | 代码有 | 417 ADP CO CODE | `STORE_ADP_CO_CODE_FIELD_ID` | PRD SI-08 已收录；与薪资对齐即可 | 中 |
| D9 | 推测项 | 设置项级 RBAC 码未定义 | — | 权限模型评审 | 中 |
| D11 | 推测项 | 跨午夜营业时段 | `saveScheduleDialog` | PRD Q3 仍开放 | 中 |
| D12 | 代码有 | 删除营业时间无引用级联提示 | `removeSchedule` | 工程可加引用检查 | 中 |

---

## 裁决摘要（给研发）

1. 只实现 catalog 四项，勿按设计稿补 173/170/77 等到本 hub。  
2. 下发需支持 `store.profile` + `store.hours`。  
3. 旧 `/store/*` 书签必须重定向（原型已做，工程路由表同步）。  
4. 582 配置面仅 Kiosk / eMenu / SDI。  
