# 商家后台选商品对齐 KPOS 菜单数据源设计

## 1. 目标与范围

### 目标

商家后台所有「组 / 类 / 菜」选商品场景：若已配置 Demo 悬浮球全局主机且能拉到该产线真实菜单，则使用真实菜单；否则使用系统预设静态菜单（当前无主机时的本地树）。取数方式对齐调味「批量建立关联」的 KPOS `/menu/menu` 路径。

同时修正调味一期「无缓存硬失败」：调味选商品在拉菜单失败且无缓存时，改为回退 seed 静态菜单，不再 `menu_unavailable` 空态。

### 本期范围

- 抽出共享 **Menu Catalog**（扩展一期调味 map / cache / provider，不另起 KPOS 客户端）。
- 商家后台品牌菜单选择器改读 Catalog；产线列增加 **POS**。
- 调味选商品仍固定 `product=EMENU`；失败路径改为缓存 → 静态 seed。
- 按「主机 + 产线」隔离缓存；轻量提示数据来源（真实 / 缓存 / 静态）。

### 不在本期范围

- 营业时段过滤。
- 把静态 `g-*` / `c-*` / `d-*` ID 自动映射成 KPOS `saleItem.id`。
- 新增 PayPad、线上点餐等产线。
- 改 Demo 悬浮球主机 cookie / storage 约定。
- 改 Option / 关系 CRUD、加价、预览确认等调味业务规则。
- 前端直连 KPOS 旁路 Catalog（浏览器不复制一套拉菜单客户端）。

### 与一期调味 spec 的关系

本文覆盖并修正 `2026-08-16-emenu-seasoning-kpos-menu-source-design.md` 中「无缓存硬失败、禁止回退 seed」的失败策略。主机 cookie、直连 URL、静态 `Authorization`、不做时段过滤、映射隐藏项规则、演示快照分轨等其余契约沿用一期。

## 2. 背景与现状

| 路径 | 当前菜单来源 |
| --- | --- |
| 嵌入 eMenu / Kiosk 等点餐端 | KPOS `/menu/menu?product=<产线>` |
| 调味批量关联 / 总览 | 一期 Menu Provider：live KPOS `product=EMENU`；失败用缓存；无缓存硬失败 |
| 商家后台组/类/菜选择器 | `BRAND_MENU_STRUCTURE_TREE` / `BRAND_MENU_STRUCTURE_BY_LINE`（仅 kiosk / emenu / sdi） |

选择器与点餐端、调味模块商品集合不一致；无 POS 列；调味在无主机或首次失败时无法选品。

## 3. 架构与数据流

```text
Demo 悬浮球全局主机 IP
  cookie menusifu-emenu-kpos-target
  storage menusifu:emenu-local:kpos-host
        │
        ▼
Shared Menu Catalog
  GET ${host}/kpos/api/menu/menu
    ?product=EMENU|KIOSK|POS|SDI
    &showInactive=false&showDeleted=false
  （Node 直连主机，不回环 Vite /kpos）
  鉴权：静态 Authorization（对齐 emenu-new request.js）
        │
        ├─ 成功 → 写入缓存（键 = 主机 + 产线）→ source=live
        ├─ 失败且有该键缓存 → source=cache
        └─ 无主机 / 失败且无缓存 → source=static
              · 商家 picker：BRAND_MENU_STRUCTURE_*
              · 调味：seed 静态菜单
        │
        ▼
  ┌─────────────────────┬──────────────────────────┐
  │ 品牌菜单选择器       │ 调味选商品                 │
  │ 按当前产线列取树     │ 固定 product=EMENU         │
  │ 勾选 key 写入原存储  │ 既有 seasoning API 视图    │
  └─────────────────────┴──────────────────────────┘
```

### 运行态分轨

| 运行态 | Catalog 行为 |
| --- | --- |
| 本地 Vite / 带主机的配置后台 | 有主机则 live；失败缓存；再失败静态 |
| 无主机（含未填 IP） | 不请求 KPOS，直接静态 |
| GitHub Pages / 浏览器演示 | 不请求 KPOS。picker 用静态树；调味仍只读一期静态快照（不是 seed，也不是 live） |

### 边界约定

- **写菜单**：不允许。
- **读菜单**：仅经 Catalog（调味 handler 与 picker 目录 API 共用同一解析函数）。
- **写配置**：商家勾选仍写各设置原存储；调味关系仍写 seasoning DB。

## 4. Shared Menu Catalog

### 解析入参

- `host`：cookie `menusifu-emenu-kpos-target` 归一化 origin；缺失则 `source=static`，不抛 `menu_unavailable`。
- `product`：KPOS 查询参数，仅允许 `EMENU` \| `KIOSK` \| `POS` \| `SDI`。

### 产线映射

| 选择器 `BrandMenuLineId` | KPOS `product=` |
| --- | --- |
| `kiosk` | `KIOSK` |
| `emenu` | `EMENU` |
| `pos` | `POS` |
| `sdi` | `SDI` |

解析当前该拉哪条产线：

1. 选择器开启产线列（`enableLines`）：用当前选中产线。
2. 无产线列但宿主传入 `treeLineId`（按产线分栏的设置页）：用该 `treeLineId`。
3. 无产线列且无 `treeLineId`：固定 `EMENU`。
4. 调味（批量关联 / 总览 / 单商品编辑菜单视图）：固定 `EMENU`。

### 输出

Catalog 一次解析产出可同时供给两边的数据：

- **品牌树** `BrandMenuGroupNode[]`（组 → 类 → 菜，id/name）。
- **调味视图**（沿用一期）：`menuGroups` + `products` + `fingerprint` / `sourceMenuVersion`。
- 元数据：`source`: `live` \| `cache` \| `static` \| `snapshot`；`fromCache`；`product`；`host`。

KPOS JSON → 调味视图继续用现有 `mapKposMenusToSeasoningView`（隐藏项、空组空类、多挂载去重规则不变）。品牌树由该视图转换：

| 调味视图 | `BrandMenuGroupNode` |
| --- | --- |
| `menuGroups[].id/name` | `group.id/name` |
| `group.categories[].id/name` | `category.id/name` |
| `category.productIds` → `products[id]` | `dish.id/name` |

勾选 key 算法不变：`g:{groupId}` / `c:{groupId}:{categoryId}` / `d:{groupId}:{categoryId}:{dishId}`，仅 ID 换成 KPOS 组/类/`saleItem.id`。

### 缓存

- **隔离键**：归一化主机 + `product`。更换主机或切换产线不得复用另一键的缓存。
- **内容**：映射后的视图（含品牌树所需字段）、源 `menuVersion`、拉取时间、`product`。
- **写入**：该键 live 成功则覆盖。
- **存储**：Vite / Node 项目 `.cache` 文件；文件名须包含产线，避免覆盖一期仅按主机的调味缓存语义。
- **浏览器演示 / GitHub Pages**：不建 KPOS 缓存。

一期仅按主机的旧缓存文件：读取时若无 `product` 字段，只可作为 `EMENU` 的兼容缓存；`KIOSK` / `POS` / `SDI` 不得误用。

### 失败顺序（Vite / Node）

1. 无合法主机 → 静态，不打 KPOS。
2. 有主机且 live 成功 → 写缓存，`source=live`。
3. live 失败且该「主机+产线」有缓存 → `source=cache`。
4. live 失败且无该键缓存 → `source=static`（**不再**抛 `menu_unavailable`）。

静态内容：

| 消费者 | `source=static` 时的树 |
| --- | --- |
| 有产线列 / `treeLineId` 的 picker | `BRAND_MENU_STRUCTURE_BY_LINE[line]`（含新增 `pos`） |
| 无产线上下文的 picker | 现有 `BRAND_MENU_STRUCTURE_TREE`（全量预设，保持无主机观感） |
| 调味（Vite / Node） | 现有 seasoning seed 菜单 |
| 调味（GitHub Pages / 浏览器演示） | 一期静态快照（`snapshot`，不是 seed） |

### picker 如何读 Catalog

选择器仍是前端组件，不在浏览器里直连 KPOS。本地 Vite 增加（或复用）一条只读目录 API，由 Node Catalog 解析后返回品牌树 + `source`。打开选择器或切换产线时异步取树：完成前轻量加载；得到树后按现有三列交互渲染。GitHub Pages 无该 API 时直接静态树。

调味继续走既有 seasoning handler；内部 Provider 改用同一 Catalog，并把无缓存失败改为静态 seed。

## 5. 选择器、产线列与已存 ID

### 交互

- 三列勾选、半选、只读浏览保持不变。
- 产线列增加 `{ id: "pos", label: "POS" }`，与 Kiosk / eMenu / SDI 并列。`BrandMenuLineId` 增加 `pos` 后，共用该类型的 UI（如店中店展示渠道）也会出现 POS，这是期望副作用，不把菜单产线与展示渠道拆成两套类型。
- `emptyBrandMenuStructureByLine` / `clone` / `normalize` / `coerce` 均包含 `pos`。旧存储没有 `pos` 键时视为该产线空选，不从其它产线抄菜单树。
- `coerceBrandMenuStructureByLine` 的旧版全局 keys：复制到 **四** 条产线（含 `pos`），与现有「复制到当时全部产线」语义一致。
- 静态 POS 树：与其它产线一样从 `BRAND_MENU_STRUCTURE_TREE` 裁剪并加「（POS）」后缀；裁剪范围与 eMenu 列相同（中餐 / 日料 / 饮品），不另造一套假菜。

### 数据来源提示

选择器与调味选品区可显示轻量文案，不打断勾选：

- live：可不提示，或极轻提示。
- cache：沿用「菜单服务暂不可用，正在使用缓存菜单」。
- static（Vite 且本应 live 却回退）：提示正在使用系统预设菜单。无主机的默认静态不必当成错误。

### 已保存勾选

- **不**把静态 ID 自动映射成真实 ID。
- 当前树找不到的已存 key：界面未勾选，**不从存储删除**。
- 选择器**每次收集勾选**（不仅是设置页点保存）：只按当前树更新「树内 key」；把「当前树不包含的已存 key」原样并回结果。禁止先 `selectionToKeys(当前树)` 丢掉树外 key 再保存。用户必须在能看见该节点的数据源上取消勾选，才能去掉该 key。
- 换回能对上的数据源（同一主机+产线的 live/缓存，或回到静态）后，原先对得上的 key 再显示为已勾选。

### 调味

- 取数固定 `EMENU`。
- Vite / Node：无主机或 live 失败无缓存 → seed，可继续勾选；有缓存 → 提示使用缓存。
- 去掉选品路径上的 `menu_unavailable` 硬失败空态。纯 Option 库维护仍不依赖菜单。
- 关系 `productId` 不迁移。总览仍可显示孤儿；选品树只出现当前视图中的商品；终端导出仍不含孤儿（一期 §7 不变）。
- GitHub Pages 调味仍只读快照，不改为 seed。

## 6. 影响面

| 能力 | 改动要点 |
| --- | --- |
| `emenu-local-seasoning-menu-{map,cache,provider}` | 扩展 `product` 参数与「主机+产线」缓存；失败回退静态；供 Catalog 复用 |
| 品牌菜单选择器 | 异步注入 Catalog 树；产线列 + `pos`；保存时保留树外 key |
| 前厅品类 / 分类 | `enableLines` 选择器改读 Catalog |
| 菜品规则、延迟出餐、宾客点餐间隔、店中店品牌 | 同上 |
| 宾客菜品详情 / 菜单图模式、火锅半份加价、商品备注 | `treeLineId` 分栏选择器按该产线拉 Catalog |
| 调味批量关联 / 总览 / 单商品菜单 | Provider 回退 seed；校验脚本不再要求无缓存硬失败 |
| 演示 / GitHub Pages | picker 静态；调味快照；无 `/menu/menu` 请求 |

不改各设置项的存储 schema 形状（仍是按产线的 key 数组或全局 key 数组），只扩展 `pos` 键。

## 7. 验收标准

1. 已填主机且该产线 live 成功：选择器树与对应点餐端在**未按时段过滤前**的可售菜单一致（组/类/菜 ID 与名称可对上）。
2. 未填主机：不请求 KPOS；picker 为预设静态树，可勾选；调味（Vite）为 seed，可勾选。
3. 断网或接口失败：有该主机+产线缓存则用缓存并提示；否则静态树，**不**出现假失败空态，**不**把另一产线缓存当成当前树。
4. 切换产线只换该产线的树与勾选；各产线缓存互不覆盖。
5. 产线列可见并可选 POS；`treeLineId` / 无产线上下文 / 调味的取数符合 §4 产线映射。
6. 当前树没有的已存勾选：界面未勾选；保存后存储仍保留这些 key；换回能对上的数据源后可再显示为已勾选。
7. 调味：无缓存失败也能打开批量关联并勾选 seed 商品；有缓存时提示使用缓存；Option CRUD 不回归。
8. GitHub Pages：无真实 `/menu/menu`；调味仍为快照而非 seed。
9. 更换主机后不混用上一主机的菜单缓存。

## 8. 实现提示（非绑定）

优先落点（实施计划阶段细化）：

- 将 `createLiveMenuProvider` 的 `product=EMENU` 提升为入参；缓存路径纳入 `product`。
- Catalog 对 picker 输出 `BrandMenuGroupNode[]`；`resolveTree` 改为使用注入树，静态树仅作 `source=static` 回退。
- `BRAND_MENU_LINE_OPTIONS` 增加 `pos`；补齐 `BRAND_MENU_STRUCTURE_BY_LINE.pos` 与所有 `emptyBrandMenuStructureByLine` 字面量。
- 选择器收集勾选时 union「当前树外的旧 key」。
- 调味 UI / `verify-emenu-local-seasoning-menu-provider.mjs`：删除「无缓存必须 `menu_unavailable`」断言，改为断言回退 seed / static。
- 目录 API 仅本地 Vite 中间件暴露，不作为云端商品中心。
