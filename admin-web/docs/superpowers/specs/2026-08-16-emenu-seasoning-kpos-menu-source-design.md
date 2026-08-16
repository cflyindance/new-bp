# eMenu 调味模块菜单数据源对齐 KPOS 设计

## 1. 目标与范围

### 目标

使 eMenu 本地配置后台「调味设置」中所有依赖菜单结构（组 / 类 / 菜）的商品数据，与嵌入 eMenu 页面使用同一菜单数据源：当前主机上的 KPOS `GET /menu/menu`（`product=EMENU`）。

消除调味模块本地 seed 假菜单与点餐端真实菜单不一致的问题，保证批量建立关联、总览、搜索与单商品编辑所见商品集合一致。

### 本期范围

- 在调味 API 层（Node handler 与浏览器演示 handler）引入统一 **Menu Provider**。
- 真实运行态：经与嵌入页相同的主机 IP / `/kpos` 拉取菜单；成功写入本地缓存；失败读缓存；无缓存硬失败。
- 演示运行态（GitHub Pages / 浏览器演示）：只读仓库内静态近真快照，不请求真实 KPOS。
- 调味模块内所有依赖菜单结构或商品元数据的路径改读 Provider：
  - 批量建立关联 · 选商品（`/menu-structure`、商品选择草稿）
  - 调味关联总览与商品搜索（`/products`、`/relations/products`）
  - 单商品编辑打开与保存时的商品解析
  - 终端导出 / checksum 中的 products 集合
- 选择草稿指纹改为基于当前生效菜单视图。
- Option、Option 分类、商品↔调味关系仍存本地调味库；关系 `productId` 使用 KPOS 商品 ID。

### 不在本期范围

- 营业时段过滤（后台始终使用完整可售菜单，与点餐端按时段过滤的可见集可不相同）。
- 接入独立「Menu 商品菜单 Catalog」SSOT（另案）；本期真源为 KPOS `/menu/menu`。
- 前端直连 KPOS 旁路调味 handler。
- 自动把历史 seed 假 `productId`（如 `p-kungpao`）映射到真实商品 ID。
- 修改 Option / 动作 / 加价系数 / 预览确认 / 冲突决策等业务规则。
- 系统设置「菜单模式」(POS / eMenu) 开关的二次路由（本期固定与嵌入 eMenu 一致：`product=EMENU`）。

## 2. 背景与现状

| 路径 | 当前菜单来源 |
| --- | --- |
| 嵌入 eMenu | KPOS `/menu/menu?product=EMENU&showInactive=false`，并可按营业时段过滤 |
| 调味批量关联 / 总览等 | `emenu-local-seasoning-seed` 内嵌 `menuGroups` + `products` |

两者商品集合、ID、组类结构均不一致，导致配置的调味关系无法可靠对应点餐端商品。

## 3. 架构

```text
eMenu 主机 IP（emenu-local-host-control，与嵌入页同一配置）
        │
        ▼
  GET /kpos/.../menu/menu
  ?product=EMENU&showInactive=false&showDeleted=false
  （不按时段过滤）
        │
        ▼
  Seasoning Menu Provider
  · 映射 → menuGroups + products 视图
  · 成功写入本地菜单缓存
  · 失败读缓存；无缓存硬失败
        │
        ▼
  既有 seasoning API
  /menu-structure、/products、选择草稿、关系预览、终端导出…
        │
        ▼
  调味 UI（批量关联 / 总览 / 单商品编辑等）
```

### 运行态分轨

| 运行态 | 菜单来源 |
| --- | --- |
| 本地 Vite / 带主机的 eMenu 配置后台 | 实时 KPOS；失败用缓存 |
| GitHub Pages / 浏览器演示 | 仓库内静态近真快照（不连 KPOS） |

### 边界约定

- **写菜单**：不允许；调味不编辑门店菜单。
- **读菜单**：仅经 Menu Provider。
- **写调味配置**：仍只写本地 seasoning DB（options / relations 等）。
- **seed 假菜单**：不再进入运行时菜单路径；可保留给单测或迁移辅助。

## 4. KPOS → 调味视图映射

### 请求

与嵌入 eMenu 的菜单拉取参数对齐：

- `product=EMENU`
- `showInactive=false`
- `showDeleted=false`
- **不做** `filterMenuByHour` 类营业时段过滤

主机基址复用 `emenu-local-host-control`（Vite 下经 `/kpos` 代理；静态托管下直连主机）。会话依赖现有 eMenu 本地会话桥接；未登录或会话失效按现有 KPOS 错误处理，再走缓存 / 硬失败。

### 字段映射

| KPOS | 调味视图 |
| --- | --- |
| `menus[0].menuGroups[]` | `menuGroups[]` |
| `group.menuCategories[]` | `group.categories[]` |
| `category.saleItems[]` | 该类 `productIds` + 扁平 `products` |
| `saleItem.id` | `product.id`（关系主键） |
| `itemNumber`（或等价编码字段） | `product.code` |
| `name` | `product.name` |
| 未隐藏且接口已返回 | `status=active`、`emenuSellable=true` |

同一商品出现在多组 / 多类时：按 `productId` 去重；各路径挂载同一 ID（与现有选择器去重语义一致）。

隐藏项不进入可选集，包括但不限于：

- `hiddenItem === true`
- eMenu 侧因无有效价格而隐藏的菜（与嵌入端 `transformItem` 的 hidden 判定对齐，避免后台出现点餐端永远看不到的菜）

空组、空类（映射后无可用商品）不进入菜单结构结果。

### 视图形状

Provider 输出须满足现有 seasoning handler 对 `menuGroups` / `products` 的消费约定（组 → 类 → `productIds`，商品带 `id/code/name/categoryId/categoryName/status/emenuSellable/sortOrder`），以便 `/menu-structure`、范围选择、指纹计算少改协议。

## 5. 缓存与指纹

### 缓存

- **隔离键**：按当前 KPOS 主机归一化地址隔离；更换主机不得复用另一主机的缓存。
- **内容**：映射后的 `menuGroups` + `products`、源 `menuVersion`（若响应提供）、拉取时间。
- **写入**：每次成功拉取覆盖。
- **存储位置**：
  - Node / Vite：项目 `.cache` 下按主机隔离的菜单缓存文件
  - 浏览器演示：不写 KPOS 缓存；演示只读静态快照
  - 真实浏览器若存在「带主机的静态托管」路径：可用 `localStorage` 按主机键缓存（与 Node 语义一致）
- **读取**：网络 / 会话失败时用缓存；无缓存则菜单相关 API 返回可识别错误码（建议 `menu_unavailable`），UI 空态 + 重试，**禁止**回退 seed 假菜单。

### 选择草稿指纹

`productSelectionToken.menuVersion` 改为基于「当前生效菜单视图」（实时成功结果或缓存）的指纹（可优先使用 KPOS `menuVersion`，否则对映射后的组/类/商品稳定字段做哈希）。

菜单变更导致指纹变化时，沿用现有协议使 token 失效（如 `product_selection_stale`），向导回到选商品步骤，不静默改变已选范围。

## 6. 演示静态快照

- 仓库提交一份近真静态 JSON，形状与 Provider 映射结果相同。
- 演示模式 Provider **只读**该快照，网络面板不应出现对真实主机的 `/menu/menu` 请求。
- 快照可与真实门店脱敏样例对齐，但不得依赖运行时网络。

## 7. 本地调味库与孤儿关系

- Option、Option 分类、relations、audit、orderSnapshots 仍存 seasoning DB。
- 新建立的关系使用 KPOS `product.id`。
- 历史基于 seed 假 ID 的关系：**不**自动迁移。一期默认：
  - 总览仍可列出孤儿关系（`productId` 不在当前菜单视图中），便于发现脏数据；
  - 该商品不可再出现在批量选品 / 可选菜单中；
  - 单商品编辑若打不开对应菜单商品，展示只读提示。

## 8. 错误与空态

| 情况 | 行为 |
| --- | --- |
| KPOS 成功 | 更新缓存并返回菜单视图 |
| KPOS 失败且有缓存 | 用缓存；UI 可轻量提示「使用缓存菜单」 |
| KPOS 失败且无缓存 | `menu_unavailable`；菜单相关页空态 + 重试 |
| 演示模式 | 只读静态快照，永不请求 KPOS |
| 选择草稿期间菜单指纹变 | 沿用现有 stale / expired 协议 |

非菜单能力（纯 Option 库维护）在菜单不可用时仍可使用，只要不依赖商品列表。

## 9. 影响面

| 能力 | 改动要点 |
| --- | --- |
| 批量建立关联 · 选商品 | `/menu-structure` 与选择草稿读 Provider |
| 调味关联总览 / 搜索 | 商品元数据来自 Provider |
| 单商品编辑 | 按 Provider 解析商品；不在菜单则只读提示 |
| 终端导出 products | 与当前菜单视图中 active 且可售商品对齐 |
| Option / 关系 CRUD | 协议不变；`productId` 语义改为 KPOS ID |

前端三列组/类/菜交互、半选、分页、预览确认流程保持；主要改动在 handler、Provider、缓存与演示快照。

## 10. 验收标准

1. 配置同一主机后，批量关联中的组/类/菜商品集合与嵌入 eMenu 在**未按时段过滤前**的可售菜单一致（ID 与名称可对上）。
2. 断网或主机错误时：有缓存可继续配置；清除缓存后硬失败，且界面不出现 seed 假菜单。
3. 演示模式仅静态快照；无真实 `/menu/menu` 请求。
4. 总览、搜索、单商品编辑、批量选品菜单同源。
5. Option / 关系保存与批量预览流程不回归。
6. 孤儿 `productId` 不出现在可选菜单中；总览可识别孤儿关系。
7. 更换主机后不混用上一主机的菜单缓存。

## 11. 实现提示（非绑定）

优先落点（实施计划阶段细化）：

- `scripts/lib/emenu-local-seasoning-api-handler.mjs` 与生成的 browser handler：注入 Menu Provider，替换 `db.products` / `menuGroups` 作为菜单读路径。
- 新建共享映射模块（KPOS menus → seasoning 视图）与缓存读写。
- `emenu-local-host-control` / session bridge：复用主机与会话，不新造第二套主机配置。
- 演示：静态快照文件 + browser runtime 分轨。
- 校验脚本：扩展现有 `verify-emenu-local-seasoning-*`，覆盖缓存失败路径与演示无网络断言。
