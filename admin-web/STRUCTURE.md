# 餐饮商家后台 — 系统结构目录

依据 `docs/餐饮商家后台-导航与目录结构建议.md` **§八 整合后推荐导航树** 与 **§8.1 连锁/加盟扩展** 生成。

## 仓库目录树

```text
admin-web/
├── index.html                 # 入口 HTML（skip link、viewport、字体）
├── package.json
├── vite.config.ts             # Vite + @tailwindcss/vite
├── tsconfig.json
├── README.md
├── STRUCTURE.md               # 本文件
└── src/
    ├── main.ts                # 布局壳、Hash 路由、主题与连锁开关
    ├── vite-env.d.ts
    ├── styles/
    │   └── app.css            # Tailwind v4：@import + @theme 设计令牌 + dark
    └── config/
        └── navigation.ts      # 导航模块、子路由、chainOnly 标记
```

## 路由与模块映射（一级 → 路径前缀）

| 一级模块 | `path` 前缀 | 说明 |
|----------|-------------|------|
| 品牌管理 | `/brand` | **侧栏**：品牌总览、品牌列表、品牌设置；**主导航顺序**：侧栏最上（组织主数据） |
| 区域管理 | `/regions` | **侧栏**：区域总览、区域列表、区域策略 |
| 门店管理 | `/stores` | **侧栏**：门店总览、门店列表、门店状态；与 **门店信息**（`/store`，单店档案与桌台）路径前缀不同，勿混淆 |
| 品牌商品管理 | `/brand-products` | **侧栏**（交互同 **门店信息**）：商品分类、规格组、口味组、做法组、加料组、套餐组、**调味管理**（三级：调味、下发记录）、**标签管理**（三级：描述标签、商品角标、统计标签）、原料管理、原料分类、图片管理、**配方管理**（三级：配方列表、原料管理、记录中心；配方内原料路由为 `/brand-products/recipes/ingredients`，与一级「原料管理」不同）；**主导航顺序**：紧随组织三项与品牌菜单 |
| 品牌菜单管理 | `/brand-menu` | **侧栏**（交互同 **品牌商品管理**）：品牌菜单、菜单分组、渠道可见性、发布与版本；与「菜单 → 门店菜单」区分：本模块偏连锁总部品牌级菜单结构与下发 |
| 主页 | `/dashboard` | 今日概览、待办、关键指标 |
| 订单 | `/orders` | **侧栏**：全部订单、退单、订单历史 |
| 交易 | `/transactions` | **侧栏**：交易流水、支付方式、对账（可选后续并入报表） |
| 门店信息 | `/store` | **侧栏**：二级为「门店基础信息」「桌台平面图」；**门店基础信息** 在主区内为三级左侧导航（同 Kiosk），含 **基础信息、LOGO、营业时间**（`STORE_BASIC_SUBNAV`） |
| 菜单 | `/menu` | **侧栏**：门店菜单、门店商品、商品配方、门店调味、打印设置、**菜单多语言**、**税种管理**（主区内三级：`MENU_TAX_TYPES_SUBNAV`） |
| 智能点餐 | `/ordering` | **侧栏**：点击「智能点餐」展开/收起二级（POS、POS GO、PayPad、扫码、eMenu、Kiosk、Online Order、餐厅网站、点餐限制规则）；**POS**、**PayPad**、**eMenu** 与 **Kiosk** 在主内容区均有左侧三级细项导航（见下节） |
| 外卖平台对接 | `/ordering/delivery-platforms` | 独立一级导航（原隶属「智能点餐」二级） |
| 后厨系统管理 | `/operations/kitchen-kds` | 侧栏滑层仅「设置」；`#/operations/kitchen-kds` 重定向至 `#/operations/kitchen-kds/settings` |
| 客显系统管理 | `/operations/customer-display` | **不设顶部 Tab**；主内容区左侧三级 **`CUSTOMER_DISPLAY_SUBNAV`**：封面图、多语言、小费、签名、小票 |
| 前厅管理中心 | `/operations/queue-call` | 滑层：餐位平面图、菜单下单限制、设置；`#/operations/queue-call` 重定向至餐位平面图 |
| 预约系统管理 | `/operations/reservations` | 订座、预订 |
| 等位系统管理 | `/operations/waitlist` | 等位、取号队列 |
| 设备管理 | `/device-management` | **侧栏**：**硬件**（无「设置」滑层；原 82 条设置 catalog 已迁至「硬件」子页 SSOT）。选 **硬件** 后，主区内左侧细项见 **`DEVICE_MANAGEMENT_HARDWARE_SUBNAV`**（支付设备、钱箱、路由器、POS、POS GO、KDS、叫号屏、打印机、电子秤、Kiosk、eMenu）。`#/device-management/settings` 重定向至对应硬件子路径。原一级「设备」`/operations/devices` 已移除 |
| 库存管理 | `/operations/inventory-ordering` | **侧栏**：订货与库存、库存变更记录（已从「菜单」迁入；路由前缀仍为 `operations/inventory-ordering`） |
| 巡店与巡检 | `/operations/store-patrol` | 连锁扩展 |
| 促销 | `/promotions` | **侧栏**：展开后二级「促销管理」 |
| 营销 | `/marketing` | **侧栏**：广告智投、社媒营销、创意素材 |
| 会员 | `/members` | **侧栏**：会员设置、福利活动、优惠券、列表、精准触达、360 洞察 |
| 评价 | `/reviews` | **侧栏**：评价洞察、设置、明细、统计 |
| 礼品卡 | `/gift-cards` | **侧栏**：卡面设计、模板管理 |
| 团队管理 | `/team` | **侧栏**：点击「团队管理」展开/收起二级（角色与员工、休息与加班、员工打卡、小费管理、员工报表、7Shifts、排班与考勤「连锁」、绩效与培训）；其中 **小费管理**、**员工报表**、**排班与考勤** 在主区内有三级细项导航（布局同小费管理：主区左侧竖向细项 + 右侧内容） |
| 报表与财务 | `/reports` | **侧栏**：展开后二级含收入/明细/餐段/菜品/损耗/钱箱/异常/礼品卡/会员/优惠券/月结/打款费用等（不含资金周转独立一级） |
| 支付服务 | `/payment-services` | **侧栏**：支付概览、支付渠道、结算与到账、风控与争议 |
| 消息通知 | `/notifications` | **侧栏**：设置 |
| 打印模板 | `/print-templates` | **侧栏**（交互同 **智能点餐**）：点击一级「打印模板」展开/收起，二级为模板列表、模板设计 |
| 资金周转 | `/reports/capital` | 独立一级；路由仍属 `/reports/capital` 前缀；**侧栏顺序**在「权限管理」之上 |
| 权限管理 | `/permissions` | **侧栏**：权限总览、角色与功能权限、员工授权、权限变更记录；**主导航顺序**：紧邻「设置」上方。用于配置 **角色 → 后台模块/操作**，以及 **员工 → 角色** 绑定（RBAC）。与「设置 → 账号与权限」可并存：本模块侧重可编排权限矩阵与赋权留痕 |
| 设置 | `/settings` | **侧栏**（交互同 **设备管理**）：点击一级「设置」展开/收起二级（设置总揽、基础、报表、打印、小费、安全、账号权限、日志、集成等）；连锁：数据范围 |

## 连锁/加盟扩展项（`chainOnly: true`）

在 `navigation.ts` 中标记；侧栏（及 Tab 模块的 Tab）**始终展示**对应入口；Tab 或侧栏二级上保留「连锁」角标以便识别。涉及路径：

- `operations/inventory-ordering` — 订货与库存  
- `operations/store-patrol` — 巡店与巡检  
- `team/scheduling` — 排班与考勤（与 §8.1 对齐）  
- `settings/data-scope` — 角色与数据范围  

## Tab 二级导航（全局约定）

**默认**：侧栏 **一级** 入口链向 `defaultChildPath`，**二级**在右侧主内容区 **顶部 Tab**（`role="tablist"` / `tab` / `tabpanel`）。**例外**：**客显系统管理**（`id: customer-display`）的细项在主内容区 **左侧竖向导航**，不使用顶部 Tab（见下节「客显系统管理」）。

**例外 — 侧栏折叠二级**（`subNavPlacement: "sidebar"`）：当前为 **品牌管理**、**区域管理**、**门店管理**、**品牌商品管理**、**品牌菜单管理**、**订单**、**门店信息**、**菜单**、**主页**、**智能点餐**、**交易**、**设备管理**、**促销**、**营销**、**会员**、**评价**、**礼品卡**、**团队管理**、**报表与财务**、**支付服务**、**消息通知**、**打印模板**、**权限管理**、**设置**（`NAV_MODULES` 中组织与品牌相关五项置顶；**权限管理**在 **设置** 正上方；完整顺序以 `navigation.ts` 为准）。**AI智能助手** 不在侧栏：仅顶栏 **AI助手** → `#/ai-assistant/chat`（`main.ts` 内对话页，非 `NAV_MODULES` 项）。二级在 **左侧主导航**内展示；点击一级行 **仅展开/收起**（不直接跳转路由），再点子项进入对应 `#/...`。展开状态用 `sessionStorage` 键 **`sidebar-nav-expanded:<模块 id>`** 记忆；未设置且当前路由已在该模块前缀下时默认展开。兼容旧键 `ordering-sidebar-expanded`（仅智能点餐）。**资金周转**仍为独立一级（`/reports/capital`），不在「报表与财务」折叠组内。

- `navigation.ts`：每个模块必填 `defaultChildPath`（与某子路由一致）
- `main.ts`：`getTabModule()` 按 **最长 path 前缀** 匹配当前模块（避免 `/orders` 与 `/ordering`、``/reports`` 与 ``/reports/capital`` 等歧义）
- `normalizeTabModuleHashes()`：访问 `#/menu`、`#/reports` 等仅一级路径时，自动跳到对应 `defaultChildPath`（`defaultChildPath === path` 的单页模块不跳转）；**`#/operations/floor-plan`** → **`#/operations/queue-call/floor-plan`**；**`#/orders/dine-in`** 等 → **`#/orders/all`**；**`#/menu/groups`** / **`#/menu/items`** / **`#/menu/availability`**（及子路径）→ **`#/menu/store-menu`**；**`#/menu/tax-types`**（仅该段、无子路径）→ **`#/menu/tax-types/settings`**；**`#/brand-products/seasoning-mgmt`**（仅该两段、无三级）→ **`getBrandSeasoningMgmtDefaultPath()`**（静默 `replaceState`）；**`#/brand-products/tags`**（仅该两段、无三级）→ **`getBrandTagsMgmtDefaultPath()`**；**`#/brand-products/recipes`**（仅该两段、无三级）→ **`getBrandRecipesMgmtDefaultPath()`**；**`#/ordering/tablet`**（仅该段）→ eMenu 默认三级路径；**`#/ordering/pos`**（仅该段）→ POS 默认三级路径；**`#/ordering/paypad`**（仅该段）→ PayPad 默认三级路径；**`#/operations/customer-display`**（仅该段）→ 客显默认三级路径 **`getCustomerDisplayDefaultPath()`**；**`#/device-management/hardware`**（仅该段）→ **`getDeviceManagementHardwareDefaultPath()`**；**`#/team/reports`**（仅该段）→ **`getTeamReportsDefaultPath()`**；**`#/team/scheduling`**（仅该段）→ **`getTeamSchedulingDefaultPath()`**；**`#/operations/devices`**（及子路径）→ **`#/device-management/overview`** 或 **`#/device-management/hardware/...`**（兼容已移除的一级「设备」）
- **侧栏子项高亮**：`getActiveChildTabPath()` 按子项 **最长 path 前缀** 匹配（含 `/ordering/kiosk/...` 归到 Kiosk）；`/ordering/pos/...` 三级区归到侧栏「POS 点餐」；`/ordering/paypad/...` 三级区归到侧栏「PayPad 点餐」；`/operations/customer-display/...` 三级区侧栏一级「客显系统管理」高亮；`/device-management/hardware/...` 归到侧栏二级「硬件」（与 eMenu 归到「eMenu 点餐」同理）；`/store/...` 基础信息区归到「门店基础信息」；`/menu/tax-types/...` 归到侧栏二级「税种管理」；`/brand-products/seasoning-mgmt/...` 归到「调味管理」；`/brand-products/tags/...` 归到「标签管理」；`/brand-products/recipes/...` 归到「配方管理」；`/team/reports/...` 三级区归到侧栏「员工报表」；`/team/scheduling/...` 三级区归到侧栏「排班与考勤」

### 门店基础信息（三级：侧栏「门店基础信息」+ 主区左侧细项）

路径 **`/store/basic`**、**`/store/logo`**、**`/store/business-hours`**（及以其为前缀的子路径）：主导航展开「门店信息」后选 **门店基础信息**，`tabpanel` 内左侧细项见 **`STORE_BASIC_SUBNAV`**，交互对齐 Kiosk 点餐三级区。

### 税种管理（三级：侧栏「税种管理」+ 主区左侧细项）

路径 **`/menu/tax-types/settings`**、**`/menu/tax-types/product-tax`**（及子路径）：主导航展开「菜单」后选 **税种管理**，`tabpanel` 内左侧细项见 **`MENU_TAX_TYPES_SUBNAV`**（税种设置、商品税设置）。

### 品牌商品管理 · 调味管理（三级：侧栏「调味管理」+ 主区左侧细项）

路径 **`/brand-products/seasoning-mgmt/seasoning`**、**`/brand-products/seasoning-mgmt/distribution-log`**（及以其为前缀的子路径）：主导航展开 **品牌商品管理** 后选 **调味管理**，`tabpanel` 内左侧细项见 **`BRAND_SEASONING_MGMT_SUBNAV`**（调味、下发记录）。访问 **`#/brand-products/seasoning-mgmt`**（仅该两段、无三级）会重定向到 **`getBrandSeasoningMgmtDefaultPath()`**。

### 品牌商品管理 · 标签管理（三级：侧栏「标签管理」+ 主区左侧细项）

路径 **`/brand-products/tags/description`**、**`/brand-products/tags/corner-badge`**、**`/brand-products/tags/stats`**（及以其为前缀的子路径）：主导航展开 **品牌商品管理** 后选 **标签管理**，`tabpanel` 内左侧细项见 **`BRAND_TAGS_MGMT_SUBNAV`**（描述标签、商品角标、统计标签）。访问 **`#/brand-products/tags`**（仅该两段、无三级）会重定向到 **`getBrandTagsMgmtDefaultPath()`**。

### 品牌商品管理 · 配方管理（三级：侧栏「配方管理」+ 主区左侧细项）

路径 **`/brand-products/recipes/list`**、**`/brand-products/recipes/ingredients`**、**`/brand-products/recipes/records`**（及以其为前缀的子路径）：主导航展开 **品牌商品管理** 后选 **配方管理**，`tabpanel` 内左侧细项见 **`BRAND_RECIPES_MGMT_SUBNAV`**（配方列表、原料管理、记录中心）。访问 **`#/brand-products/recipes`**（仅该两段、无三级）会重定向到 **`getBrandRecipesMgmtDefaultPath()`**。配方内 **原料管理** 与一级侧栏 **原料管理**（`/brand-products/ingredients`）为不同路由。

### POS 点餐（三级：侧栏渠道 + 主区左侧细项）

路径 **`/ordering/pos/basic-settings`**、**`/ordering/pos/ui-settings`**、**`/ordering/pos/button-settings`**、**`/ordering/pos/multi-language`**（及以其为前缀的子路径）：先在侧栏「智能点餐」下选 **POS 点餐**，再在 `tabpanel` 内左侧细项见 **`POS_ORDERING_SUBNAV`**（基础设置、界面设置、按钮设置、多语言）。访问 **`#/ordering/pos`**（仅该段）会重定向到 **`getPosOrderingDefaultPath()`**。

### PayPad 点餐（三级：侧栏渠道 + 主区左侧细项）

路径 **`/ordering/paypad/tips`**、**`/ordering/paypad/signature`**、**`/ordering/paypad/receipt`**（及以其为前缀的子路径）：先在侧栏「智能点餐」下选 **PayPad 点餐**，再在 `tabpanel` 内左侧细项见 **`PAYPAD_ORDERING_SUBNAV`**（小费、签名、收据）。访问 **`#/ordering/paypad`**（仅该段）会重定向到 **`getPaypadOrderingDefaultPath()`**。

### eMenu 点餐（三级：侧栏渠道 + 主区左侧细项）

路径前缀 **`/ordering/tablet/...`**：先在侧栏「智能点餐」下选 **eMenu 点餐**，再在 `tabpanel` 内渲染左侧细项，条目见 **`EMENU_ORDERING_SUBNAV`**（设备管理、权限设置、提示信息、下单/展示、用户信息、标签、消息通知、服务员、菜单样式、菜单Pro、授权、抽奖、海报、权益会员、首页视频/背景图、多语言、收据、菜单品类/分类设置等）。访问 **`#/ordering/tablet`** 会重定向到 eMenu 默认三级路径。

### Kiosk 点餐（三级：侧栏渠道 + 主区左侧细项）

路径前缀 **`/ordering/kiosk/`**：先在侧栏「智能点餐」下选 **Kiosk 点餐**，再在 `tabpanel` 内渲染 **左侧竖向细项导航**，条目见 **`KIOSK_ORDERING_SUBNAV`**（含订单类型、小费/收据/支付、菜单/菜单标签/本地促销、展示与桌台/平台/产品对接、封面图/海报/屏保/登录引导、附加费、品牌与设备管理等）。访问 **`#/ordering/kiosk`**（或带尾斜杠）会重定向到 **`getKioskOrderingDefaultPath()`**。

### 设备管理 · 硬件（三级：侧栏「硬件」+ 主区左侧细项）

路径 **`/device-management/hardware/payments`**、**`/device-management/hardware/cash-drawer`**、**`/device-management/hardware/router`**、**`/device-management/hardware/pos`**、**`/device-management/hardware/pos-go`**、**`/device-management/hardware/kds`**、**`/device-management/hardware/queue-display`**、**`/device-management/hardware/printers`**、**`/device-management/hardware/scale`**、**`/device-management/hardware/kiosk`**、**`/device-management/hardware/emenu`**（及以其为前缀的子路径）：主导航展开 **设备管理** 后选 **硬件**，`tabpanel` 内左侧细项见 **`DEVICE_MANAGEMENT_HARDWARE_SUBNAV`**。访问 **`#/device-management/hardware`**（仅该段）会重定向到 **`getDeviceManagementHardwareDefaultPath()`**。

### 团队管理 · 小费管理（三级：侧栏「小费管理」+ 主区左侧细项）

路径 **`/team/tips/distribution`**、**`/team/tips/details`**、**`/team/tips/rules`**（及以其为前缀的子路径）：主导航展开 **团队管理** 后选 **小费管理**，`tabpanel` 内左侧细项见 **`TIPS_MANAGEMENT_SUBNAV`**（小费分配、分配明细、分配规则）。访问 **`#/team/tips`**（仅该段）会重定向到 **`getTipsManagementDefaultPath()`**。

### 团队管理 · 员工报表（三级：侧栏「员工报表」+ 主区左侧细项）

路径 **`/team/reports/overview`**、**`/team/reports/tips`**、**`/team/reports/performance`**、**`/team/reports/payroll`**（及以其为前缀的子路径）：主导航展开 **团队管理** 后选 **员工报表**，`tabpanel` 内左侧细项见 **`TEAM_REPORTS_SUBNAV`**（概览、小费、绩效、薪资）。访问 **`#/team/reports`**（仅该段）会重定向到 **`getTeamReportsDefaultPath()`**。

### 团队管理 · 排班与考勤（三级：侧栏「排班与考勤」+ 主区左侧细项）

路径 **`/team/scheduling/attendance-records`**、**`/team/scheduling/overtime-rules`**（及以其为前缀的子路径）：主导航展开 **团队管理** 后选 **排班与考勤**，`tabpanel` 内左侧细项见 **`TEAM_SCHEDULING_SUBNAV`**（考勤记录、加班规则）。访问 **`#/team/scheduling`**（仅该段）会重定向到 **`getTeamSchedulingDefaultPath()`**。

### 客显系统管理（三级：侧栏一级 + 主区左侧细项）

路径 **`/operations/customer-display/cover-image`**、**`/operations/customer-display/multi-language`**、**`/operations/customer-display/tips`**、**`/operations/customer-display/signature`**、**`/operations/customer-display/receipt`**（及以其为前缀的子路径）：侧栏点 **客显系统管理** 进入后，`tabpanel` 内左侧细项见 **`CUSTOMER_DISPLAY_SUBNAV`**（封面图、多语言、小费、签名、小票）。访问 **`#/operations/customer-display`**（仅该段）会重定向到 **`getCustomerDisplayDefaultPath()`**。

| 模块 | `defaultChildPath` |
|------|-------------------|
| 主页 | `/dashboard/overview` |
| 订单 | `/orders/all` |
| 交易 | `/transactions/ledger` |
| 门店信息 | `/store/basic` |
| 菜单 | `/menu/store-menu` |
| 品牌商品管理 | `/brand-products/product-categories` |
| 智能点餐 | `/ordering/pos/basic-settings` |
| 外卖平台对接 | `/ordering/delivery-platforms` |
| 后厨系统管理 | `/operations/kitchen-kds` |
| 客显系统管理 | `/operations/customer-display/cover-image` |
| 前厅管理中心 | `/operations/queue-call/floor-plan` |
| 预约系统管理 | `/operations/reservations` |
| 等位系统管理 | `/operations/waitlist` |
| 设备管理 | `/device-management/overview` |
| 库存管理 | `/operations/inventory-ordering` |
| 巡店与巡检 | `/operations/store-patrol` |
| 促销 | `/promotions/campaigns` |
| 营销 | `/marketing/ai/ads` |
| 会员 | `/members/settings` |
| 评价 | `/reviews/insights` |
| 礼品卡 | `/gift-cards/design` |
| 团队管理 | `/team/roles-employees` |
| 报表与财务 | `/reports/revenue` |
| 支付服务 | `/payment-services/overview` |
| 消息通知 | `/notifications/settings` |
| 打印模板 | `/print-templates/list` |
| 资金周转 | `/reports/capital` |
| 权限管理 | `/permissions/overview` |
| 设置 | `/settings/overview`（设置总揽；一级「设置」为侧栏折叠二级） |

## 后续可扩展目录（建议）

接入真实业务时可在 `src/` 下增加：

```text
src/
├── pages/           # 按模块拆分的页面逻辑
├── components/      # 可复用 UI（按钮、表格、表单 — CVA + 语义 token）
├── lib/utils.ts     # cn() 等
└── router.ts        # 由 Hash 升级为 SPA 路由时可抽出
```
