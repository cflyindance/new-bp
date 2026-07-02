# M 平台 · 企业级平台预设 — 设计方案

> 版本：v1.0 · 2026-06-26  
> 状态：Phase 1 已落地（M 平台入口 + 企业级平台预设 CRUD）  
> 关联：`平台预设-产品需求与设计说明.md`、`platform-preset-ui.ts`、`enterprise-platform-preset-store.ts`

---

## 一、背景与目标

### 1.1 现状

当前 `admin-web` 已实现完整的**商家后台平台预设**能力：

| 能力 | 实现位置 |
|------|----------|
| 列表页 + 四列编辑页 | `platform-preset-ui.ts` + `permission-four-column-ui.ts` |
| 快照存储（演示） | `localStorage` → `menusifu:platform-preset-v1` |
| 运行时侧栏过滤 | `platform-preset-nav-filter.ts` |
| 首次登录引导 | `platform-preset-onboarding.ts` |
| 业态 × 产线 × 四级树 | `platform-preset-tree.ts`（1201 节点） |

顶栏已有 **门店版 / 连锁版** 布局切换（`renderHeaderNavLayoutPresetControl`），控制侧栏「主导航 vs 更多」收纳策略，与平台预设正交。

### 1.2 目标

引入 **M 平台**（企业级控制台），作为软件服务商面向**企业租户**的默认配置中心：

```
M 平台（企业级预设）  ──同步──▶  商家后台（租户级预设）  ──过滤──▶  侧栏/滑层/设置页可见性
         ▲                              │
         │                              │ 商家可局部覆盖
         └──────── 不回写 ──────────────┘
```

**核心约束**（与 `平台预设-产品需求与设计说明.md` 一致）：

1. 只控制**可见性**，不改导航/设置项定义
2. 树结构仍从 `NAV_MODULES` + `module-settings-catalog` 生成
3. 商家修改仅影响**当前商家**侧栏，不影响 M 平台企业预设

---

## 二、概念模型：双层预设

| 层级 | 名称 | 配置主体 | 作用域 | 存储键（演示期） |
|------|------|----------|--------|------------------|
| L0 | **企业级预设** | M 平台管理员 | 该企业下所有商家 | `menusifu:enterprise-platform-preset-v1` |
| L1 | **商家级预设** | 商家后台管理员 | 当前商家/门店 | `menusifu:platform-preset-v1` |

### 2.1 生效链（商家运行时）

```
NAV_MODULES
  → filterVisibleNavModules()     // RBAC + 单店/连锁
  → filterNavByPlatformPreset()   // 读商家级 effective snapshot
  → renderSidebar()
```

M 平台配置**不直接参与**商家运行时过滤，只通过「同步」写入商家级预设。

### 2.2 数据关系

```typescript
/** 企业级（M 平台） */
interface EnterprisePlatformPresetStore {
  enterpriseId: string;
  snapshots: Record<ComboKey, PlatformPresetSnapshot>;
  customBusinessTypes: CustomBusinessType[];
  changelog: PlatformPresetChangeLogEntry[];
}

/** 商家级（商家后台） */
interface MerchantPlatformPresetStore {
  merchantId: string;
  snapshots: Record<ComboKey, PlatformPresetSnapshot>;
  /** 记录每个 combo 上次从企业同步的版本，用于判断是否被商家改过 */
  syncedFromEnterprise: Record<ComboKey, {
    enterpriseVersion: number;
    syncedAt: string;
  }>;
  customBusinessTypes: CustomBusinessType[];
  changelog: PlatformPresetChangeLogEntry[];
}
```

`PlatformPresetSnapshot` 结构**完全复用**现有定义（`businessTypeId` + `productLineId` + `version` + `selection`）。

---

## 三、入口与 Shell 设计

### 3.1 顶栏布局

在 **连锁版** 按钮右侧新增 **M 平台**：

```
[ 语言 ] [ 用户 ] [ 主题 ] [ 门店版 | 连锁版 | M平台 ]
```

| 控件 | 行为 |
|------|------|
| 门店版 / 连锁版 | 保持现状，仅影响商家 Shell 侧栏收纳 |
| **M 平台** | 进入企业级 Shell；第一步直达平台预设页 |

### 3.2 Shell 模式（三态）

```typescript
type AppShellMode = "merchant" | "m-platform";
```

| 模式 | 触发 | Shell 表现 |
|------|------|------------|
| `merchant` | 默认 / 点击「返回商家后台」 | 完整 27 模块侧栏 + 顶栏 scope 筛选 |
| `m-platform` | 点击「M 平台」 | **精简 Shell**：顶栏保留品牌/用户/退出；侧栏仅企业配置项（第一步只有「平台预设」） |

**路由**：

```
#/m-platform/platform-preset
#/m-platform/platform-preset/:businessTypeId/:productLineId/edit
```

与商家后台路由对称，便于复用同一套 UI 组件：

```
商家：#/settings/platform-preset/...
M平台：#/m-platform/platform-preset/...
```

### 3.3 返回商家后台

- 顶栏 M 平台按钮在 M 平台 Shell 内高亮
- 点击「返回商家后台」→ `shellMode = merchant`，回到商家 Shell
- 持久化：`sessionStorage` → `menusifu:app-shell-mode-v1`（刷新保持 M 平台上下文）

### 3.4 权限（生产）

| 角色 | M 平台入口 | 商家平台预设 |
|------|------------|--------------|
| 企业超级管理员 | ✅ | ✅（可覆盖） |
| 商家店长 | ❌ 隐藏 | ✅ |
| 软件服务商运营 | ✅（跨企业） | — |

演示期：对连锁账号（如 `hq.admin@menusifu.cn`）开放 M 平台入口。

---

## 四、UI 复用策略

现有代码已具备高复用基础：

| 模块 | 复用方式 |
|------|----------|
| `permission-four-column-ui.ts` | 四列矩阵 UI |
| `platform-preset-ui.ts` | `renderPlatformPresetPages(scope: PresetScopeConfig)` |
| `platform-preset-store-factory.ts` | `createPresetStore(storageKey)` |
| `platform-preset-catalog.ts` / `platform-preset-tree.ts` | 只读，两端共用 |
| `platform-preset-changelog-diff.ts` | 变更记录逻辑共用 |

### 4.1 PresetScope 抽象

```typescript
type PresetScope = "merchant" | "enterprise";

interface PresetScopeConfig {
  scope: PresetScope;
  routePrefix: string;        // "/m-platform/platform-preset" | "/settings/platform-preset"
  moduleLabel: string;        // "M 平台" | "系统设置"
  listIntro: string;
  editorHint: string;
  publishSuccessMessage: (version: number) => string;
  versionBadge: (version: number, hasPublished: boolean) => string;
  store: PlatformPresetStoreApi;
}
```

### 4.2 M 平台与商家 UI 差异

| 元素 | 商家后台 | M 平台 |
|------|----------|--------|
| 页面标题 | 系统设置 · 平台预设 | **M 平台 · 平台预设** |
| 主操作按钮 | 保存并发布 | 保存并发布（Phase 2 增加「同步到全部商家」） |
| 产线卡片标签 | 「已覆盖平台默认」 | 「企业默认」 |
| 底栏提示 | 影响当前商家侧栏 | 新商家/首次引导将获取此预设 |
| 「应用为门店上下文」 | 有 | 无（企业级不直接驱动侧栏） |

---

## 五、同步机制设计

### 5.1 同步时机

| 场景 | 行为 |
|------|------|
| **新商家首次 onboarding** | 从企业级 `getEffectivePresetSnapshot` 复制到商家级；写入 `syncedFromEnterprise` |
| **企业发布新版本** | 见 §5.3 覆盖策略 |
| **商家在后台修改并发布** | 仅写商家级 store；`syncedFromEnterprise` 标记为「已偏离」 |
| **商家未改过** | 企业发布后可自动覆盖商家对应 combo |

### 5.2 同步方向

```
M 平台发布 → 企业级 store
         ↓（单向同步，Phase 2）
商家 store ← 首次引导 / 手动同步 / 自动推送
         ↓
商家侧栏过滤（仅读商家 store）
```

商家修改**不回写**企业级预设。

### 5.3 企业更新时的覆盖策略（建议）

采用 **「商家未自定义则跟随，已自定义则保留」**：

```typescript
function shouldOverwriteOnEnterpriseSync(
  merchantSnap: PlatformPresetSnapshot | undefined,
  syncedMeta: SyncedMeta | undefined,
  newEnterpriseVersion: number,
): boolean {
  if (!merchantSnap || merchantSnap.version === 0) return true;
  if (!syncedMeta) return false; // 商家自建，不覆盖
  if (merchantSnap.version > syncedMeta.enterpriseVersion) return false; // 商家已改过
  return true;
}
```

商家后台产线卡片可展示：

- 「与企业默认一致」
- 「已自定义（v3，企业当前 v5）」+ 可选「恢复企业默认」

### 5.4 首次登录引导改造

当前 `platform-preset-onboarding.ts` 从商家 `getEffectivePresetSnapshot` 读数据。

改造后：

```typescript
function getOnboardingPresetSnapshot(businessTypeId, productLineId) {
  const merchantSnap = getMerchantPublishedSnapshot(...);
  if (merchantSnap) return merchantSnap;

  // 首次：回落到企业级
  return getEnterpriseEffectivePresetSnapshot(enterpriseId, businessTypeId, productLineId);
}
```

引导完成时：

1. 若商家无快照 → 从企业复制并标记 `syncedFromEnterprise`
2. `applyPlatformPresetContext` → 写入 session 上下文（逻辑不变）

---

## 六、运行时过滤（商家侧）

过滤链保持现有顺序：

```
NAV_MODULES
  → filterVisibleNavModules()      // RBAC + 单店/连锁
  → filterNavByPlatformPreset()    // 读商家级 effective snapshot
  → renderSidebar()
```

`platform-preset-context.ts` 仍用 `sessionStorage`，表示**当前会话**生效的业态×产线组合。

M 平台编辑页**不写入** `platform-preset-context`，避免误过滤商家 Shell。

---

## 七、后端 API 预留（生产）

演示期双层 localStorage；生产建议：

| API | 方法 | 说明 |
|-----|------|------|
| `/api/enterprises/{eid}/platform-presets` | GET | 列表 + 各 combo 版本摘要 |
| `/api/enterprises/{eid}/platform-presets/{bt}/{pl}` | GET/PUT | 读取/发布企业快照 |
| `/api/enterprises/{eid}/platform-presets/sync` | POST | 推送到下属商家 |
| `/api/merchants/{mid}/platform-presets/{bt}/{pl}` | GET/PUT | 商家级读写 |
| `/api/merchants/{mid}/platform-presets/reset-from-enterprise` | POST | 恢复企业默认 |

存储：企业表 `enterprise_platform_preset_snapshot`；商家表 `merchant_platform_preset_snapshot`，加 `source_enterprise_version` 字段。

---

## 八、实施分期

### Phase 1 — M 平台入口 + 企业级平台预设 ✅ 已落地

| 任务 | 说明 | 状态 |
|------|------|------|
| P1-1 | 顶栏「M 平台」按钮 + `AppShellMode` 状态机 | ✅ |
| P1-2 | M 平台精简 Shell（侧栏仅「平台预设」） | ✅ |
| P1-3 | 路由 `#/m-platform/platform-preset/*` | ✅ |
| P1-4 | `enterprise-platform-preset-store.ts`（独立 localStorage） | ✅ |
| P1-5 | 复用 `platform-preset-ui` 渲染列表页 + 四列编辑页 | ✅ |
| P1-6 | M 平台发布/变更记录（与商家逻辑一致，不写商家 store） | ✅ |

**验收**：点击 M 平台 → 进入与商家后台一致的平台预设配置能力；数据存于企业级 key，与商家 `menusifu:platform-preset-v1` 隔离。

### Phase 2 — 同步到商家

| 任务 | 说明 |
|------|------|
| P2-1 | 商家 store 与企业 store 同步 API / 模块 |
| P2-2 | M 平台「同步到全部商家」+ 覆盖策略 |
| P2-3 | 商家列表页展示「与企业默认关系」状态 |

### Phase 3 — 首次引导 + 运行时打通

| 任务 | 说明 |
|------|------|
| P3-1 | onboarding 回落企业级快照 |
| P3-2 | 新商家首次引导自动 seed 商家 store |
| P3-3 | 商家修改后与企业脱钩标记 |

### Phase 4 — 运营增强

- 版本对比、批量同步、自定义业态 CRUD 审计
- 按商家/区域选择性推送企业预设

---

## 九、代码结构（Phase 1 已落地）

```
src/
├── shell/
│   ├── app-shell-mode.ts              # merchant | m-platform 状态
│   └── m-platform-shell.ts            # M 平台 Shell 渲染与绑定
├── config/
│   ├── platform-preset-scope.ts       # PresetScopeConfig
│   ├── platform-preset-store-factory.ts
│   ├── enterprise-platform-preset-store.ts
│   ├── platform-preset-store.ts       # 商家级（工厂实例）
│   └── platform-preset-ui.ts          # 参数化 scope + routePrefix
├── main.ts                            # 顶栏 M 平台按钮、Shell 分支路由
└── i18n.ts                            # shell.mPlatform 等文案
```

`main.ts` 路由分发示意：

```typescript
if (isMPlatformShellMode() || isMPlatformPresetPath(path)) {
  // 渲染 M 平台 Shell + 企业级平台预设页
  return;
}
// 现有商家路由逻辑不变
```

---

## 十、边界与风险

| 问题 | 处理 |
|------|------|
| 门店版/连锁版 与 M 平台同时存在 | M 平台模式下使用独立 Shell；商家模式顶栏显示三者并列 |
| 自定义业态 | 企业创建 → 同步时可下发；商家自建不反向同步 |
| 多业态×多产线并集 | 商家 onboarding 已支持多选并集；企业端同样支持 |
| 演示环境单浏览器测两家 | `enterpriseId` / `merchantId` 绑定登录账号或演示常量 |
| RBAC 与预设交叉 | M 平台配置页不走商家 RBAC 树过滤；仅企业管理员可进 |

---

## 十一、决策摘要

| 维度 | 决策 |
|------|------|
| **定位** | M 平台 = 企业租户级默认配置；商家后台 = 可覆盖的租户实例 |
| **第一步** | 顶栏入口 + 独立存储 + 复用现有四列 UI，路由 `/m-platform/platform-preset` |
| **数据隔离** | 企业 `enterprise-platform-preset` ≠ 商家 `platform-preset` |
| **同步方向** | 企业 → 商家（单向）；商家修改不回写 |
| **首次引导** | 商家无预设时，从企业级复制（Phase 3） |
| **代码策略** | `PresetScope` 参数化 store + UI，避免双份维护 |

---

## 十二、相关文档

| 文档 | 说明 |
|------|------|
| [平台预设-产品需求与设计说明.md](./平台预设-产品需求与设计说明.md) | 商家后台平台预设原始需求 |
| [平台预设-配置预设四级导航树.md](./平台预设-配置预设四级导航树.md) | 四级树节点清单 |
| [侧栏导航布局-门店版与连锁版.md](./侧栏导航布局-门店版与连锁版.md) | 门店版/连锁版与平台预设正交 |
