# 前厅设置 22 组信息架构重设计

## 背景

前厅设置以“员工端完整一单 → 食客端完整旅程”为主线，但当前生成目录存在三类漂移：

- 分组 SSOT 实际定义 25 个规范组，注释仍称员工端 11 组、食客端 11 组。
- seq 164 未被前厅规范化，额外生成孤立的“折扣”组。
- 多个二级组过细或边界混杂，例如“分割线与超时提醒”“桌边服务”。

本次只调整分类结构、分类名称、设置归属和旧路径兼容；不修改设置项的 seq、交互、表单、存储键或业务逻辑。

## 目标

- 前厅设置的规范 catalog 与复杂版本固定为 22 个规范组：员工端 11 组、食客端 11 组。
- 从生成目录排除 seq 164、176、177，复杂版本最终有效目录为 154 项。
- 每个有效 seq 只归属一个规范组。
- 被合并的旧 groupKey 和书签继续重定向到新组。
- 统一当前运行目录、产线范围、平台预设和设计文档。

## 规范分组

### 员工端 11 组

| 顺序 | groupKey | groupTitle | seq |
|---|---|---|---|
| 1 | `foh-pos-shell` | 登录与终端主界面 | 75、166、175、165、346 |
| 2 | `foh-table-start-flow` | 选桌与开台流程 | 107、619、111、625、621、643、644、592 |
| 3 | `foh-pos-menu-scope` | POS 菜单与界面 | 118、174、148、348、216、217、218、220、219、350 |
| 4 | `foh-pos-order-cart` | 点单内容与客户信息 | 132、133、135、137、178、121、122、222、223、349、141 |
| 5 | `foh-pos-combo-ordering` | 套餐与自定义点单 | 138、139、145 |
| 6 | `foh-pos-buttons` | 点单页按钮显隐 | 193–195、197–215 |
| 7 | `foh-pos-order-toolbar` | 点单页工具栏 | 483–486、196 |
| 8 | `foh-kitchen-send-timing` | 送厨规则与权限 | 125、113、123、114、120、345 |
| 9 | `foh-pos-find-order-list` | 找单与结账入口 | 153、151、152、251、248、221 |
| 10 | `foh-pos-order-alerts` | 消息类型提醒 | 331、332、638、639、637、110 |
| 11 | `foh-table-clear-ops` | 清桌与换服务员（企台） | 534、642、351、347 |

### 食客端 11 组

| 顺序 | groupKey | groupTitle | seq |
|---|---|---|---|
| 1 | `foh-guest-order-type` | 订单类型、取餐与送厨 | 487、488、489、490、491、503、581、502 |
| 2 | `foh-guest-registration` | 食客登记与会员 | 623、622、504、505、506、507、510 |
| 3 | `foh-guest-pre-order` | 点单前限制与授权 | 620、626、627 |
| 4 | `foh-guest-facing-locale` | 食客端语言 | 652、653 |
| 5 | `foh-guest-menu-home` | 点餐首页与入口 | 599、604、601、602、600、611、532 |
| 6 | `foh-guest-menu-body` | 菜单与购物车展示 | 606、607、608、645、509、525、526、515、516、517、518、519、520、524、528、616、617、618 |
| 7 | `foh-guest-hotpot` | 火锅点餐 | 572、574、573、575 |
| 8 | `foh-guest-duration-scenarios` | 计时与自助餐规则 | 443、571、577、578、579、580 |
| 9 | `foh-tableside-service` | 桌边呼叫 | 641、640、333 |
| 10 | `foh-guest-order-notes` | 点单备注 | 521、522、523 |
| 11 | `foh-wait-time-display` | 等待时长计算与展示 | 673、535、536、537、538、539、540 |

员工端合计 86 项，食客端合计 68 项，共 154 项。

## 设置迁移

| seq | 原组 | 目标组 | 原因 |
|---|---|---|---|
| 349 | 登录与主界面 | 点单内容与客户信息 | 控制服务员能否点只读菜，属于点单内容权限 |
| 141 | 送厨时机 | 点单内容与客户信息 | 控制已送厨菜品是否仍可修改调味 |
| 216–220、350 | 菜单区界面布局 | POS 菜单与界面 | 与菜单来源、查找、时段共用同一 POS 菜单场景 |
| 196 | 分割线与超时提醒 | 点单页工具栏 | 分割线属于工具栏结构 |
| 110 | 分割线与超时提醒 | 消息类型提醒 | 点单超时是员工端运营提醒 |
| 248、221 | POS 结账入口 | 找单与结账入口 | 与找单后进入付款的连续操作合并 |
| 581、502 | 食客端送厨 | 订单类型、取餐与送厨 | 属于食客订单履约流程 |
| 521–523 | 桌边服务 | 点单备注 | 订单、商品、套餐子项备注不属于桌边呼叫 |

## 目录排除与退役

- seq 164 已在订单折扣实现中标记下线，本次加入全版本退役和目录排除，不迁移存储。
- seq 176、177 已全版本退役，本次补充目录排除，避免继续参与生成和产线校验。
- `scripts/generate-order-settings-design-doc.mjs` 与当前订单中心设计文档同步删除 seq 164 的有效项表述，或明确标记为退役；当前文档不得继续把它计入有效折扣项。
- 不修改历史原始归类和竞品分析中的旧记录。

## 产品版本基线

- 复杂版本展示规范 catalog 的全部 22 组、154 项。
- MVP 继续沿用现有隐藏策略：隐藏 `foh-pos-buttons`、`foh-pos-order-toolbar` 两组，以及 `MVP_HIDDEN_MODULE_SETTING_SEQS` 中属于前厅的设置；按本规格迁移后应展示 20 组、119 项。
- 本次只向 `RETIRED_MODULE_SETTING_SEQS` 增加 seq 164，不改变 MVP 隐藏组或隐藏 seq 的定义。
- 专项校验分别断言复杂版本与 MVP 的可见 groupKey/seq 集合，防止把复杂版本的 22/154 错误套用到 MVP。

## 旧路径兼容

| 旧 groupKey | 新 groupKey |
|---|---|
| `foh-pos-menu-ui-layout` / `pos-menu-ui-layout` | `foh-pos-menu-scope` |
| `foh-pos-order-extras` / `foh-order-toolbar-extra` | `foh-pos-order-toolbar` |
| `foh-pos-checkout-entry` / `pos-checkout-entry` | `foh-pos-find-order-list` |
| `foh-guest-kitchen-send` / `foh-guest-scenario-dining` / `guest-channel-kitchen-send` / `guest-scenario-dining` / `foh-guest-kitchen-dining` | `foh-guest-order-type` |
| `guest-notes-fees` | `foh-guest-order-notes` |

旧组中设置被拆到多个目标时，组级书签跳转到承担主要结构的目标组；具体设置仍通过 seq 唯一定位。

所有指向被删除组的别名必须直接指向存活组，不依赖单跳规范化器进行链式跳转。`src/main.ts` 不再维护独立的 `fohSettingsLegacyGroup` 副本，改为复用 `src/config/foh-settings-group-keys.ts` 暴露的共享规范化函数；生成侧和运行时镜像对每一个别名执行同一组专项测试。

## SSOT 与派生产物

1. `scripts/lib/foh-settings-groups.mjs` 是生成侧分组顺序、标题、旧路径以及“组内完整 seq 顺序”的 SSOT；同一份有序 seq 列表同时用于归属和排序。
2. `scripts/lib/settings-intra-group-sort.mjs` 必须消费上述有序列表，不再为前厅重复维护 `FOH_*_SEQ_ORDER`；专项校验逐组断言本规格表中的完整 seq 顺序。
3. `src/config/foh-settings-group-keys.ts` 是运行时镜像，必须与生成侧一致，并向 `src/main.ts` 提供共享旧路径规范化函数。
4. 产线生成链同步更新 `scripts/lib/foh-line-scope-extract.mjs`、`scripts/lib/foh-settings-line-scope.seed.json`、`src/config/foh-settings-line-scope.ts`、`src/config/foh-settings-line-storage-registry.ts`、产线矩阵生成器和平台预设 L3 校验；只允许 groupKey 改变，逐 seq 的 `lines` 集合和存储字段不变。
5. `module-settings-catalog.ts`、前厅设计文档及其生成器、订单中心设计文档及其生成器均为派生或同步产物。
6. 实施顺序固定为：先保存迁移前不变量基线，再修改分组 SSOT，再运行 `npm run generate:foh-line-scope`、`npm run build:settings-catalog` 和两份设计文档生成器，最后执行专项校验。
7. 生成命令产生无关漂移时，只接受与本规格分组、名称、归属、排序、重定向和排除项直接相关的差异。

## 回归基线与专项校验

- 新增前厅 22 组专项校验，并提交迁移前基线夹具；基线覆盖 154 个保留 seq 的 catalog 元数据、`seq → lines` 集合和 `seq → storage registry` 映射。
- catalog 元数据对比忽略本次允许变化的 `groupKey`、`groupTitle`、`sortInGroup`，其余字段必须逐项相等；新 catalog 与旧 catalog 的 seq 差集只能是 164、176、177。
- 对迁移项 349、141、216–220、350、196、110、248、221、581、502、521–523 增加自定义控件注册、渲染入口和读写映射冒烟检查，证明迁组没有改变原控件或存储路径。
- 旧路径测试逐项覆盖本规格重定向表，断言目标直接存活且规范化幂等；同时静态断言 `src/main.ts` 不再出现独立别名表。
- 产线对比以迁移前基线为准，逐 seq 比较排序后的 `lines` 集合；不能仅用同步更新后的两个派生产物互相验证。

## 错误与兼容处理

- 未识别的旧 groupKey 保持原路径，不猜测目标。
- 一个有效 seq 同时进入多个规范组时，专项校验失败。
- 任何规范组缺失、顺序变化、员工端/食客端不等于 11 组时，专项校验失败。
- 旧路径重定向必须幂等：规范路径再次归一化后保持不变。
- 复杂版本或 MVP 的可见集合偏离产品版本基线时，专项校验失败。
- 任一保留 seq 的非分组 catalog 元数据、产线集合、存储注册或自定义控件入口发生变化时，专项校验失败。

## 验收标准

1. 规范 catalog 与复杂版本目录恰好包含 22 组、154 项；员工端和食客端各 11 组；MVP 恰好包含 20 组、119 项。
2. 154 个 seq 唯一，无遗漏、无重复。
3. 每组 seq 的展示顺序与本规格表完全一致；侧栏不再出现“折扣”“分割线与超时提醒”“菜单区界面布局”“POS 结账入口”“食客端送厨”。
4. 新增“点单备注”，并使用本规格中的全部新名称。
5. seq 164、176、177 不进入运行目录；当前订单中心文档不再把 164 计为有效项，历史资料保持不变。
6. 旧 groupKey 均直接重定向至表中存活目标，规范路径幂等，运行时不再有第二份硬编码别名表。
7. 基线对比证明所有保留设置的非分组 catalog 元数据、交互入口、存储键和产线集合保持不变。
8. 迁移项自定义控件渲染和读写映射冒烟测试通过。
9. 专项校验、`npm run verify:foh-line-scope`、`npm run verify:foh-lines-store`、`npm run verify:foh-platform-preset-l3`、TypeScript 检查、差异检查和生产构建通过。
