/**
 * 整合后推荐导航树（融合脑图 + 竞品）
 * 来源：docs/餐饮商家后台-导航与目录结构建议.md §八、§8.1
 */

export interface NavItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
  /** 连锁/加盟补充项 */
  chainOnly?: boolean;
  children?: NavItem[];
}

export interface NavModule {
  id: string;
  title: string;
  titleEn: string;
  icon:
    | "home"
    | "orders"
    | "receipt"
    | "menu"
    | "floorPlan"
    | "kitchenKds"
    | "queueCall"
    | "reservations"
    | "waitlist"
    | "inventory"
    | "promo"
    | "marketing"
    | "members"
    | "reviews"
    | "gift"
    | "team"
    | "reports"
    | "capital"
    | "financeCenter"
    | "settings"
    | "notifications"
    | "printTemplate"
    | "deviceManagement"
    | "brandProducts"
    | "brandMenu"
    | "brandMgmt"
    | "storeMgmt"
    | "permissionMgmt"
    | "assetCenter"
    | "configCenter"
    | "logManagement";
  path: string;
  children: NavItem[];
  /**
   * `tabs`：二级在主内容区顶部 Tab（默认）。
   * `sidebar`：二级在左侧主导航内可折叠展开。一级顺序见 `NAV_MODULES`（品牌→门店→主页→团队→商品中心→订单→支付→外卖/来取→营销→促销→会员→礼品卡→评价→前厅→后厨→预约→报表→财务→打印→消息→库存→硬件→权限；其后为信贷中心、素材中心、系统设置）。**外卖/来取、前厅管理中心、后厨管理中心**与品牌/门店等同为 `sheet` 滑层。重排可运行 `node scripts/reorder-nav-modules.mjs`。
   * `sheet`：二级在侧栏自右向左滑出层（与营销中心同交互），不在主导航树内展开。
   */
  subNavPlacement?: "sidebar" | "tabs" | "sheet";
  /** 访问 `#/模块前缀` 时重定向到该默认子路径；须与 children 中某项一致 */
  defaultChildPath: string;
  /**
   * 聚合模块：路由匹配任一前缀即视为本模块（`path` 可为占位）。
   * 「商品中心」通过 `matchPrefixes` 覆盖 `/product-center-main`、`/brand-products`、`/brand-menu`、`/menu`。
   */
  matchPrefixes?: string[];
}

/** 商品中心下辖全部业务路径，供标题解析与 flattenNavPaths */
export const PRODUCT_CENTER_DEEP_NAV: NavItem[] = [
  { id: "bp-products", title: "商品", titleEn: "Products", path: "/brand-products/products" },
  {
    id: "bp-product-multi-language",
    title: "商品多语言",
    titleEn: "Product multi-language",
    path: "/brand-products/product-multi-language",
  },
  { id: "bp-product-categories", title: "商品分类", titleEn: "Product categories", path: "/brand-products/product-categories" },
  { id: "bp-spec-groups", title: "规格组", titleEn: "Spec groups", path: "/brand-products/spec-groups" },
  { id: "bp-flavor-groups", title: "口味组", titleEn: "Flavor groups", path: "/brand-products/flavor-groups" },
  { id: "bp-prep-groups", title: "做法组", titleEn: "Preparation groups", path: "/brand-products/prep-groups" },
  { id: "bp-addon-groups", title: "加料组", titleEn: "Add-on groups", path: "/brand-products/addon-groups" },
  { id: "bp-combo-groups", title: "套餐组", titleEn: "Combo groups", path: "/brand-products/combo-groups" },
  { id: "bp-seasoning", title: "调味管理", titleEn: "Seasoning management", path: "/brand-products/seasoning-mgmt/seasoning" },
  { id: "bp-tags", title: "标签管理", titleEn: "Tag management", path: "/brand-products/tags/description" },
  { id: "bp-ingredients", title: "原料管理", titleEn: "Ingredients", path: "/brand-products/ingredients" },
  { id: "bp-ingredient-categories", title: "原料分类", titleEn: "Ingredient categories", path: "/brand-products/ingredient-categories" },
  { id: "bp-images", title: "图片管理", titleEn: "Image management", path: "/brand-products/images" },
  { id: "bp-recipes", title: "配方管理", titleEn: "Recipe management", path: "/brand-products/recipes/list" },
  {
    id: "bp-seasoning-distribution",
    title: "下发记录",
    titleEn: "Distribution log",
    path: "/brand-products/seasoning-mgmt/distribution-log",
  },
  { id: "bm-menus", title: "品牌菜单", titleEn: "Brand menus", path: "/brand-menu/menus" },
  {
    id: "bm-distribution-log",
    title: "下发记录",
    titleEn: "Distribution log",
    path: "/brand-menu/distribution-log",
  },
  { id: "bm-groups", title: "菜单分组", titleEn: "Menu groups", path: "/brand-menu/groups" },
  { id: "bm-channel-visibility", title: "渠道可见性", titleEn: "Channel visibility", path: "/brand-menu/channel-visibility" },
  { id: "bm-publish", title: "发布与版本", titleEn: "Publish & versions", path: "/brand-menu/publish-versions" },
  { id: "menu-store-menu", title: "门店菜单", titleEn: "Store menu", path: "/menu/store-menu" },
  { id: "menu-store-products", title: "门店商品", titleEn: "Store products", path: "/menu/store-products" },
  { id: "menu-inventory-changes", title: "库存变更记录", titleEn: "Inventory change log", path: "/menu/inventory-changes" },
  { id: "menu-product-recipe", title: "商品配方", titleEn: "Product recipe", path: "/menu/product-recipe" },
  { id: "menu-recipe-list", title: "配方列表", titleEn: "Recipe list", path: "/menu/recipe-list" },
  { id: "menu-store-seasoning", title: "门店调味", titleEn: "Store seasoning", path: "/menu/store-seasoning" },
  { id: "menu-print-settings", title: "打印设置", titleEn: "Print settings", path: "/menu/print-settings" },
  { id: "menu-multi-language", title: "菜单多语言", titleEn: "Menu multi-language", path: "/menu/multi-language" },
  { id: "menu-tax-types", title: "税种管理", titleEn: "Tax types", path: "/menu/tax-types/settings" },
  {
    id: "menu-product-tax-mgmt",
    title: "商品税管理",
    titleEn: "Product tax management",
    path: "/menu/tax-types/product-tax",
  },
];

export const NAV_MODULES: NavModule[] = [
  {
    id: "brand-mgmt",
    title: "品牌管理",
    titleEn: "Brand management",
    icon: "brandMgmt",
    path: "/brand",
    subNavPlacement: "sheet",
    defaultChildPath: "/brand/overview",
    children: [
      { id: "br-overview", title: "品牌总览", titleEn: "Overview", path: "/brand/overview" },
      { id: "br-list", title: "品牌列表", titleEn: "Brand list", path: "/brand/list" },
      { id: "br-settings", title: "品牌设置", titleEn: "Brand settings", path: "/brand/settings" },
    ],
  },
  {
    id: "store-mgmt",
    title: "门店管理",
    titleEn: "Store management",
    icon: "storeMgmt",
    path: "/stores",
    subNavPlacement: "sheet",
    defaultChildPath: "/stores/overview",
    children: [
      { id: "st-overview", title: "门店总览", titleEn: "Overview", path: "/stores/overview" },
      { id: "st-list", title: "门店列表", titleEn: "Store list", path: "/stores/list" },
      { id: "st-status", title: "门店状态", titleEn: "Store status", path: "/stores/status" },
      {
        id: "st-brand-menu",
        title: "品牌与菜单",
        titleEn: "Brand & menu",
        path: "/stores/brand-menu",
      },
      { id: "st-settings", title: "设置", path: "/stores/settings" },
    ],
  },
  {
    id: "dashboard",
    title: "主页",
    titleEn: "Dashboard",
    icon: "home",
    path: "/dashboard",
    subNavPlacement: "sheet",
    defaultChildPath: "/dashboard/overview",
    children: [
      { id: "dash-overview", title: "今日概览", path: "/dashboard/overview" },
      { id: "dash-todos", title: "待办", path: "/dashboard/todos" },
      { id: "dash-kpi", title: "关键指标", path: "/dashboard/kpi" },
    ],
  },
  {
    id: "team",
    title: "团队管理",
    titleEn: "Team",
    icon: "team",
    path: "/team",
    subNavPlacement: "sheet",
    defaultChildPath: "/team/roles-employees",
    children: [
      { id: "team-roles", title: "角色与员工", path: "/team/roles-employees" },
      { id: "team-breaks", title: "休息与加班", path: "/team/breaks-overtime" },
      { id: "team-clock", title: "员工打卡", path: "/team/clock-in" },
      { id: "team-shifts", title: "排班", titleEn: "Shift scheduling", path: "/team/shift-scheduling" },
      { id: "team-tips", title: "小费管理", path: "/team/tips" },
      { id: "team-tax-payroll", title: "报税报表", titleEn: "Tax payroll reports", path: "/team/payroll-report" },
      { id: "team-reports", title: "员工报表", path: "/team/reports" },
      { id: "team-7shifts", title: "7Shifts 对接（排班）", path: "/team/integrations/7shifts" },
      { id: "team-training", title: "绩效与培训", path: "/team/training-performance" },
      { id: "team-settings", title: "设置", path: "/team/settings" },
    ],
  },
  {
    id: "product-center-main",
    title: "商品中心",
    titleEn: "Product center",
    icon: "menu",
    path: "/product-center-main",
    matchPrefixes: ["/product-center-main", "/brand-products", "/brand-menu", "/menu"],
    defaultChildPath: "/brand-products/products",
    children: [
      {
        id: "pcm-brand-products",
        title: "商品管理",
        titleEn: "Product management",
        path: "/brand-products/products",
      },
      {
        id: "pcm-brand-menu",
        title: "品牌菜单",
        titleEn: "Brand menus",
        path: "/brand-menu/menus",
      },
      {
        id: "pcm-store-mgmt",
        title: "门店管理",
        titleEn: "Store management",
        path: "/menu/store-menu",
      },
    ],
  },
  {
    id: "orders",
    title: "订单中心",
    titleEn: "Order center",
    icon: "orders",
    path: "/orders",
    subNavPlacement: "sheet",
    defaultChildPath: "/orders/settings",
    children: [
      { id: "orders-settings", title: "设置", path: "/orders/settings" },
    ],
  },
  {
    id: "transactions",
    title: "支付中心",
    titleEn: "Payment center",
    icon: "receipt",
    path: "/transactions",
    subNavPlacement: "sheet",
    defaultChildPath: "/transactions/settings",
    children: [
      { id: "tx-settings", title: "设置", path: "/transactions/settings" },
    ],
  },
  {
    id: "waitlist",
    title: "外卖/来取",
    titleEn: "Delivery & pickup",
    icon: "waitlist",
    path: "/operations/waitlist",
    subNavPlacement: "sheet",
    defaultChildPath: "/operations/waitlist",
    children: [
      {
        id: "wl-main",
        title: "外卖/来取",
        titleEn: "Delivery & pickup",
        path: "/operations/waitlist",
      },
      { id: "wl-settings", title: "设置", titleEn: "Settings", path: "/operations/waitlist/settings" },
    ],
  },
  {
    id: "marketing",
    title: "营销中心",
    titleEn: "Marketing center",
    icon: "marketing",
    path: "/marketing",
    defaultChildPath: "/marketing/screensaver",
    children: [
      { id: "mkt-screensaver", title: "屏保", titleEn: "Screensaver", path: "/marketing/screensaver" },
      { id: "mkt-ads", title: "广告", titleEn: "Ads", path: "/marketing/ads" },
      { id: "mkt-poster-pro", title: "海报Pro", titleEn: "Poster Pro", path: "/marketing/poster-pro" },
    ],
  },
  {
    id: "promotions",
    title: "促销中心",
    titleEn: "Promotion center",
    icon: "promo",
    path: "/promotions",
    defaultChildPath: "/promotions/campaigns",
    children: [
      { id: "promo-campaigns", title: "促销活动", titleEn: "Promotional activities", path: "/promotions/campaigns" },
      { id: "promo-lottery", title: "抽奖活动", titleEn: "Lottery", path: "/promotions/lottery" },
    ],
  },
  {
    id: "members",
    title: "会员中心",
    titleEn: "Member center",
    icon: "members",
    path: "/members",
    defaultChildPath: "/members/card/coupon-mgmt",
    children: [
      { id: "mem-card-entry", title: "卡券管理", titleEn: "Cards & coupons", path: "/members/card/coupon-mgmt" },
      { id: "mem-points", title: "积分配置", titleEn: "Points config", path: "/members/points" },
      { id: "mem-settings", title: "设置", titleEn: "Settings", path: "/members/settings" },
    ],
  },
  {
    id: "gift-cards",
    title: "礼品卡中心",
    titleEn: "Gift card center",
    icon: "gift",
    path: "/gift-cards",
    defaultChildPath: "/gift-cards/cards",
    children: [
      { id: "gc-cards", title: "Cards", titleEn: "礼品卡工厂", path: "/gift-cards/cards" },
      { id: "gc-settings", title: "设置", titleEn: "Settings", path: "/gift-cards/settings" },
    ],
  },
  {
    id: "reviews",
    title: "评价中心",
    titleEn: "Review center",
    icon: "reviews",
    path: "/reviews",
    subNavPlacement: "sheet",
    defaultChildPath: "/reviews/insights",
    children: [
      { id: "rev-insights", title: "评价洞察", path: "/reviews/insights" },
      { id: "rev-settings", title: "设置", titleEn: "Settings", path: "/reviews/settings" },
      { id: "rev-detail", title: "评价明细", path: "/reviews/detail" },
      { id: "rev-stats", title: "评价统计", path: "/reviews/stats" },
    ],
  },
  {
    id: "queue-call",
    title: "前厅管理中心",
    titleEn: "Front of house management center",
    icon: "queueCall",
    path: "/operations/queue-call",
    subNavPlacement: "sheet",
    defaultChildPath: "/operations/queue-call/floor-plan",
    children: [
      {
        id: "qc-floor-plan",
        title: "餐位平面图",
        titleEn: "Table layout",
        path: "/operations/queue-call/floor-plan",
      },
      { id: "qc-settings", title: "设置", titleEn: "Settings", path: "/operations/queue-call/settings" },
      {
        id: "qc-menu-order-limits",
        title: "菜单下单限制",
        titleEn: "Menu order limits",
        path: "/operations/queue-call/menu-order-limits",
      },
      {
        id: "qc-category-settings",
        title: "品类设置",
        titleEn: "Category settings",
        path: "/operations/queue-call/category-settings",
      },
    ],
  },
  {
    id: "kitchen-kds",
    title: "后厨管理中心",
    titleEn: "Back-of-house management center",
    icon: "kitchenKds",
    path: "/operations/kitchen-kds",
    subNavPlacement: "sheet",
    defaultChildPath: "/operations/kitchen-kds/settings",
    children: [
      { id: "kds-settings", title: "设置", titleEn: "Settings", path: "/operations/kitchen-kds/settings" },
    ],
  },
  {
    id: "reservations",
    title: "预约等位中心",
    titleEn: "Reservation & waitlist center",
    icon: "reservations",
    path: "/operations/reservations",
    defaultChildPath: "/operations/reservations/waitlist",
    children: [
      { id: "res-waitlist", title: "Waitlist", titleEn: "等位", path: "/operations/reservations/waitlist" },
      { id: "res-rsv", title: "RSV", titleEn: "预订", path: "/operations/reservations/rsv" },
      { id: "res-history", title: "History", titleEn: "历史", path: "/operations/reservations/history" },
      { id: "res-section", title: "Section", titleEn: "分区", path: "/operations/reservations/section" },
      { id: "res-settings", title: "设置", titleEn: "Settings", path: "/operations/reservations/settings" },
    ],
  },
  {
    id: "reports-finance",
    title: "报表中心",
    titleEn: "Reporting center",
    icon: "reports",
    path: "/reports",
    defaultChildPath: "/reports/revenue",
    children: [
      { id: "rpt-revenue", title: "营业汇总", titleEn: "Business summary", path: "/reports/revenue" },
      { id: "rpt-sales", title: "销售汇总", titleEn: "Sales summary", path: "/reports/sales/orders" },
      { id: "rpt-products", title: "商品报表", titleEn: "Product reports", path: "/reports/products/ranking" },
      { id: "rpt-staff", title: "员工报表", titleEn: "Staff reports", path: "/reports/staff/overview" },
      { id: "rpt-trends", title: "走势详情", titleEn: "Trend details", path: "/reports/trends/store-overview" },
      { id: "rpt-monthly", title: "月度经营分析", titleEn: "Monthly analysis", path: "/reports/monthly-analysis" },
      { id: "rpt-settings", title: "设置", titleEn: "Settings", path: "/reports/settings" },
    ],
  },
  {
    id: "finance-center",
    title: "财务中心",
    titleEn: "Finance center",
    icon: "financeCenter",
    path: "/finance",
    subNavPlacement: "sheet",
    defaultChildPath: "/finance/register-audit/payments",
    children: [
      {
        id: "fin-register-audit",
        title: "收银记录与审计",
        titleEn: "Register audit",
        path: "/finance/register-audit/payments",
      },
      { id: "fin-settings", title: "设置", titleEn: "Settings", path: "/finance/settings" },
    ],
  },
  {
    id: "print-templates",
    title: "打印中心",
    titleEn: "Print center",
    icon: "printTemplate",
    path: "/print-templates",
    defaultChildPath: "/print-templates/decoration",
    children: [
      { id: "pt-decoration", title: "打印装修", titleEn: "Print styling", path: "/print-templates/decoration" },
      { id: "pt-settings", title: "设置", titleEn: "Settings", path: "/print-templates/settings" },
    ],
  },
  {
    id: "notifications",
    title: "消息中心",
    titleEn: "Message center",
    icon: "notifications",
    path: "/notifications",
    subNavPlacement: "sheet",
    defaultChildPath: "/notifications/templates",
    children: [
      { id: "notif-templates", title: "消息模板", titleEn: "Message templates", path: "/notifications/templates" },
      { id: "notif-scene-config", title: "消息配置", titleEn: "Message configuration", path: "/notifications/scene-config" },
      { id: "notif-quota", title: "消息额度", titleEn: "Message quota", path: "/notifications/quota" },
      { id: "notif-settings", title: "设置", titleEn: "Settings", path: "/notifications/settings" },
    ],
  },
  {
    id: "inventory-ordering",
    title: "库存管理中心",
    titleEn: "Inventory management center",
    icon: "inventory",
    path: "/operations/inventory-ordering",
    subNavPlacement: "tabs",
    defaultChildPath: "/operations/inventory-ordering/expiry",
    children: [
      {
        id: "inv-expiry",
        title: "效期管理",
        titleEn: "Expiry management",
        path: "/operations/inventory-ordering/expiry",
      },
      {
        id: "inv-materials",
        title: "物料管理",
        titleEn: "Materials management",
        path: "/operations/inventory-ordering/materials",
      },
      { id: "inv-settings", title: "设置", titleEn: "Settings", path: "/operations/inventory-ordering/settings" },
    ],
  },
  {
    id: "device-management",
    title: "硬件管理中心",
    titleEn: "Hardware management center",
    icon: "deviceManagement",
    path: "/device-management",
    subNavPlacement: "sheet",
    defaultChildPath: "/device-management/hardware/payments",
    children: [
      {
        id: "dm-hardware",
        title: "硬件",
        titleEn: "Hardware",
        path: "/device-management/hardware/payments",
      },
      { id: "dm-settings", title: "设置", titleEn: "Settings", path: "/device-management/settings" },
    ],
  },
  {
    id: "permission-mgmt",
    title: "权限管理中心",
    titleEn: "Access management center",
    icon: "permissionMgmt",
    path: "/permissions",
    subNavPlacement: "sheet",
    defaultChildPath: "/permissions/overview",
    children: [
      {
        id: "perm-overview",
        title: "权限总览",
        titleEn: "Overview",
        path: "/permissions/overview",
      },
      {
        id: "perm-roles",
        title: "角色与功能权限",
        titleEn: "Roles & permissions",
        path: "/permissions/roles",
      },
      {
        id: "perm-staff",
        title: "员工授权",
        titleEn: "Staff assignments",
        path: "/permissions/staff",
      },
      {
        id: "perm-changelog",
        title: "权限变更记录",
        titleEn: "Permission change log",
        path: "/permissions/change-log",
      },
      {
        id: "perm-account-session",
        title: "账户与会话安全",
        titleEn: "Account & session security",
        path: "/permissions/account-session",
      },
      {
        id: "perm-store-security",
        title: "门店安全策略",
        titleEn: "Store security policy",
        path: "/permissions/store-security",
      },
    ],
  },
  {
    id: "capital-turnover",
    title: "信贷中心",
    titleEn: "Credit center",
    icon: "capital",
    path: "/reports/capital",
    defaultChildPath: "/reports/capital",
    children: [{ id: "capital-main", title: "信贷中心", titleEn: "Credit center", path: "/reports/capital" }],
  },
  {
    id: "asset-center",
    title: "素材中心",
    titleEn: "Asset center",
    icon: "assetCenter",
    path: "/asset-center",
    subNavPlacement: "sheet",
    defaultChildPath: "/asset-center/materials",
    children: [
      { id: "ac-materials", title: "图片素材", titleEn: "Image materials", path: "/asset-center/materials" },
      { id: "ac-videos", title: "视频库", titleEn: "Video library", path: "/asset-center/videos" },
    ],
  },
  {
    id: "log-management",
    title: "日志管理",
    titleEn: "Log management",
    icon: "logManagement",
    path: "/log-management",
    subNavPlacement: "sheet",
    defaultChildPath: "/log-management/login-logs",
    children: [
      {
        id: "lm-login-logs",
        title: "系统登录日志",
        titleEn: "System login logs",
        path: "/log-management/login-logs",
      },
    ],
  },
  {
    id: "settings",
    title: "系统设置",
    titleEn: "System settings",
    icon: "settings",
    path: "/settings",
    subNavPlacement: "sheet",
    defaultChildPath: "/settings/basic",
    children: [
      { id: "set-basic", title: "基础设置", path: "/settings/basic" },
      { id: "set-integrations", title: "集成与 API", path: "/settings/integrations" },
    ],
  },
];

/** 硬件管理中心 →「硬件」：主内容区左侧细项（路由 `/device-management/hardware/...`，交互对齐 Kiosk 点餐左侧导航） */
export interface DeviceManagementHardwareSubItem {
  id: string;
  title: string;
  titleEn: string;
  path: string;
}

export const DEVICE_MANAGEMENT_HARDWARE_SUBNAV: DeviceManagementHardwareSubItem[] = [
  { id: "dmh-payments", title: "支付设备", titleEn: "Payment devices", path: "/device-management/hardware/payments" },
  { id: "dmh-fiscal", title: "税控机", titleEn: "Fiscal device", path: "/device-management/hardware/fiscal" },
  { id: "dmh-cash-drawer", title: "钱箱", titleEn: "Cash drawer", path: "/device-management/hardware/cash-drawer" },
  { id: "dmh-caller-id", title: "来电显示", titleEn: "Caller ID", path: "/device-management/hardware/caller-id" },
  { id: "dmh-router", title: "路由器", titleEn: "Router", path: "/device-management/hardware/router" },
  { id: "dmh-pos", title: "POS", titleEn: "POS", path: "/device-management/hardware/pos" },
  { id: "dmh-pos-go", title: "POS GO", titleEn: "POS Go", path: "/device-management/hardware/pos-go" },
  { id: "dmh-kds", title: "KDS", titleEn: "KDS", path: "/device-management/hardware/kds" },
  { id: "dmh-queue-display", title: "叫号屏", titleEn: "Queue display", path: "/device-management/hardware/queue-display" },
  { id: "dmh-printers", title: "打印机", titleEn: "Printers", path: "/device-management/hardware/printers" },
  { id: "dmh-scale", title: "电子秤", titleEn: "Electronic scale", path: "/device-management/hardware/scale" },
  { id: "dmh-kiosk", title: "Kiosk", titleEn: "Kiosk", path: "/device-management/hardware/kiosk" },
  { id: "dmh-cds", title: "CDS", titleEn: "Customer display", path: "/device-management/hardware/cds" },
  { id: "dmh-emenu", title: "eMenu", titleEn: "eMenu devices", path: "/device-management/hardware/emenu" },
];

export function getDeviceManagementHardwareDefaultPath(): string {
  return DEVICE_MANAGEMENT_HARDWARE_SUBNAV[0]?.path ?? "/device-management/hardware/payments";
}

export function getActiveDeviceManagementHardwareSubPath(path: string): string {
  const sorted = [...DEVICE_MANAGEMENT_HARDWARE_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isDeviceManagementHardwarePath(path: string): boolean {
  return getActiveDeviceManagementHardwareSubPath(path) !== "";
}

/**
 * 系统设置总揽：硬件与终端快捷入口，与「硬件管理中心 → 硬件」路径一致（避免与已移除的一级「设备」`/operations/devices` 重复维护）。
 */
export const SETTINGS_OVERVIEW_DEVICE_LINKS: { id: string; title: string; titleEn: string; path: string }[] =
  DEVICE_MANAGEMENT_HARDWARE_SUBNAV.map((item) => ({
    id: `so-${item.id}`,
    title: item.title,
    titleEn: item.titleEn,
    path: item.path,
  }));

/** 团队管理 →「小费管理」：主内容区右侧细项导航（路由 `/team/tips/...`） */
export interface TipsManagementSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const TIPS_MANAGEMENT_SUBNAV: TipsManagementSubItem[] = [
  { id: "tips-distribution", title: "小费分配", titleEn: "Tip distribution", path: "/team/tips/distribution" },
  { id: "tips-details", title: "分配明细", titleEn: "Distribution details", path: "/team/tips/details" },
  { id: "tips-rules", title: "分配规则", titleEn: "Distribution rules", path: "/team/tips/rules" },
];

export function getTipsManagementDefaultPath(): string {
  return TIPS_MANAGEMENT_SUBNAV[0]?.path ?? "/team/tips/distribution";
}

export function getActiveTipsManagementSubPath(path: string): string {
  const sorted = [...TIPS_MANAGEMENT_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isTipsManagementTertiaryPath(path: string): boolean {
  return getActiveTipsManagementSubPath(path) !== "";
}

/** 团队管理 →「员工报表」：主内容区细项导航（路由 `/team/reports/...`） */
export interface TeamReportsSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const TEAM_REPORTS_SUBNAV: TeamReportsSubItem[] = [
  { id: "team-rpt-overview", title: "概览", titleEn: "Overview", path: "/team/reports/overview" },
  { id: "team-rpt-tips", title: "小费", titleEn: "Tips", path: "/team/reports/tips" },
  { id: "team-rpt-performance", title: "绩效", titleEn: "Performance", path: "/team/reports/performance" },
  { id: "team-rpt-payroll", title: "薪资", titleEn: "Payroll", path: "/team/reports/payroll" },
];

export function getTeamReportsDefaultPath(): string {
  return TEAM_REPORTS_SUBNAV[0]?.path ?? "/team/reports/overview";
}

export function getActiveTeamReportsSubPath(path: string): string {
  const sorted = [...TEAM_REPORTS_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isTeamReportsTertiaryPath(path: string): boolean {
  return getActiveTeamReportsSubPath(path) !== "";
}

/** POS 点餐：智能点餐 Tab 内左侧三级导航（路由 `/ordering/pos/...`） */
export interface PosOrderingSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const POS_ORDERING_SUBNAV: PosOrderingSubItem[] = [
  { id: "pos-basic-settings", title: "基础设置", titleEn: "Basic settings", path: "/ordering/pos/basic-settings" },
  { id: "pos-ui-settings", title: "界面设置", titleEn: "UI settings", path: "/ordering/pos/ui-settings" },
  { id: "pos-button-settings", title: "按钮设置", titleEn: "Button settings", path: "/ordering/pos/button-settings" },
  { id: "pos-multi-language", title: "多语言", titleEn: "Multi-language", path: "/ordering/pos/multi-language" },
];

export function getPosOrderingDefaultPath(): string {
  return POS_ORDERING_SUBNAV[0]?.path ?? "/ordering/pos";
}

export function getActivePosOrderingSubPath(path: string): string {
  const sorted = [...POS_ORDERING_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isPosOrderingTertiaryPath(path: string): boolean {
  return getActivePosOrderingSubPath(path) !== "";
}

/** PayPad 点餐：智能点餐 Tab 内左侧三级导航（路由 `/ordering/paypad/...`） */
export interface PaypadOrderingSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const PAYPAD_ORDERING_SUBNAV: PaypadOrderingSubItem[] = [
  { id: "paypad-tips", title: "小费", titleEn: "Tips", path: "/ordering/paypad/tips" },
  { id: "paypad-signature", title: "签名", titleEn: "Signature", path: "/ordering/paypad/signature" },
  { id: "paypad-receipt", title: "收据", titleEn: "Receipt", path: "/ordering/paypad/receipt" },
];

export function getPaypadOrderingDefaultPath(): string {
  return PAYPAD_ORDERING_SUBNAV[0]?.path ?? "/ordering/paypad";
}

export function getActivePaypadOrderingSubPath(path: string): string {
  const sorted = [...PAYPAD_ORDERING_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isPaypadOrderingTertiaryPath(path: string): boolean {
  return getActivePaypadOrderingSubPath(path) !== "";
}

/** Kiosk 点餐：智能点餐 Tab 内左侧三级导航（路由 `/ordering/kiosk/...`） */
export interface KioskOrderingSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const KIOSK_ORDERING_SUBNAV: KioskOrderingSubItem[] = [
  { id: "kiosk-order-types", title: "订单类型", titleEn: "Order types", path: "/ordering/kiosk/order-types" },
  { id: "kiosk-tip-settings", title: "小费设置", titleEn: "Tip settings", path: "/ordering/kiosk/tip-settings" },
  { id: "kiosk-receipt-settings", title: "收据设置", titleEn: "Receipt settings", path: "/ordering/kiosk/receipt-settings" },
  { id: "kiosk-user-info", title: "用户信息", titleEn: "User profile", path: "/ordering/kiosk/user-info" },
  { id: "kiosk-payment", title: "支付", titleEn: "Payment", path: "/ordering/kiosk/payment" },
  { id: "kiosk-language", title: "语言", titleEn: "Language", path: "/ordering/kiosk/language" },
  { id: "kiosk-menu", title: "菜单", titleEn: "Menu", path: "/ordering/kiosk/menu" },
  { id: "kiosk-menu-tags", title: "菜单标签", titleEn: "Menu tags", path: "/ordering/kiosk/menu-tags" },
  { id: "kiosk-local-promotions", title: "本地促销", titleEn: "Local promotions", path: "/ordering/kiosk/local-promotions" },
  { id: "kiosk-display-settings", title: "展示设置", titleEn: "Display settings", path: "/ordering/kiosk/display-settings" },
  { id: "kiosk-wait-time", title: "等待时间", titleEn: "Wait time", path: "/ordering/kiosk/wait-time" },
  { id: "kiosk-table-settings", title: "桌子设置", titleEn: "Table settings", path: "/ordering/kiosk/table-settings" },
  { id: "kiosk-platform-settings", title: "平台设置", titleEn: "Platform settings", path: "/ordering/kiosk/platform-settings" },
  { id: "kiosk-product-integration", title: "产品对接", titleEn: "Product integration", path: "/ordering/kiosk/product-integration" },
  { id: "kiosk-cover-image", title: "封面图", titleEn: "Cover image", path: "/ordering/kiosk/cover-image" },
  { id: "kiosk-poster", title: "海报", titleEn: "Poster", path: "/ordering/kiosk/poster" },
  { id: "kiosk-poster-pro", title: "海报Pro", titleEn: "Poster Pro", path: "/ordering/kiosk/poster-pro" },
  { id: "kiosk-screensaver", title: "屏保", titleEn: "Screensaver", path: "/ordering/kiosk/screensaver" },
  { id: "kiosk-login-guide", title: "登录引导图", titleEn: "Login guide", path: "/ordering/kiosk/login-guide" },
  { id: "kiosk-surcharge", title: "附加费", titleEn: "Surcharge", path: "/ordering/kiosk/surcharge" },
  { id: "kiosk-brand-settings", title: "品牌设置", titleEn: "Brand settings", path: "/ordering/kiosk/brand-settings" },
  { id: "kiosk-device-management", title: "设备管理", titleEn: "Device management", path: "/ordering/kiosk/device-management" },
];

export function getKioskOrderingDefaultPath(): string {
  return KIOSK_ORDERING_SUBNAV[0]?.path ?? "/ordering/kiosk";
}

/** eMenu 点餐：智能点餐 Tab 内左侧三级导航（路由 `/ordering/tablet/...`） */
export interface EmenuOrderingSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const EMENU_ORDERING_SUBNAV: EmenuOrderingSubItem[] = [
  { id: "em-device-management", title: "设备管理", titleEn: "Device management", path: "/ordering/tablet/device-management" },
  { id: "em-permission-settings", title: "权限设置", titleEn: "Permission settings", path: "/ordering/tablet/permission-settings" },
  { id: "em-prompt-messages", title: "提示信息", titleEn: "Prompt messages", path: "/ordering/tablet/prompt-messages" },
  { id: "em-order-settings", title: "下单设置", titleEn: "Order settings", path: "/ordering/tablet/order-settings" },
  { id: "em-display-settings", title: "展示设置", titleEn: "Display settings", path: "/ordering/tablet/display-settings" },
  { id: "em-user-info", title: "用户信息", titleEn: "User profile", path: "/ordering/tablet/user-info" },
  { id: "em-tag-settings", title: "标签设置", titleEn: "Tag settings", path: "/ordering/tablet/tag-settings" },
  { id: "em-notifications", title: "消息通知", titleEn: "Notifications", path: "/ordering/tablet/notifications" },
  { id: "em-waiter-settings", title: "服务员设置", titleEn: "Waiter settings", path: "/ordering/tablet/waiter-settings" },
  { id: "em-menu-style", title: "菜单样式", titleEn: "Menu style", path: "/ordering/tablet/menu-style" },
  { id: "em-menu-pro", title: "菜单Pro", titleEn: "Menu Pro", path: "/ordering/tablet/menu-pro" },
  { id: "em-auth-settings", title: "授权设置", titleEn: "Authorization settings", path: "/ordering/tablet/auth-settings" },
  { id: "em-lottery-campaign", title: "抽奖活动", titleEn: "Lottery campaign", path: "/ordering/tablet/lottery-campaign" },
  { id: "em-poster", title: "海报", titleEn: "Poster", path: "/ordering/tablet/poster" },
  { id: "em-membership", title: "权益会员", titleEn: "Membership benefits", path: "/ordering/tablet/membership-benefits" },
  { id: "em-home-video", title: "首页视频", titleEn: "Home video", path: "/ordering/tablet/home-video" },
  { id: "em-home-bg", title: "首页背景图", titleEn: "Home background image", path: "/ordering/tablet/home-background" },
  { id: "em-multi-language", title: "多语言", titleEn: "Multi-language", path: "/ordering/tablet/multi-language" },
  { id: "em-receipt", title: "收据", titleEn: "Receipt", path: "/ordering/tablet/receipt" },
  { id: "em-menu-category-item", title: "菜单品类设置", titleEn: "Menu category item settings", path: "/ordering/tablet/menu-category-item-settings" },
  { id: "em-menu-category", title: "菜单分类设置", titleEn: "Menu category settings", path: "/ordering/tablet/menu-category-settings" },
];

export function getEmenuOrderingDefaultPath(): string {
  return EMENU_ORDERING_SUBNAV[0]?.path ?? "/ordering/tablet";
}

export function getActiveEmenuOrderingSubPath(path: string): string {
  const sorted = [...EMENU_ORDERING_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isEmenuOrderingTertiaryPath(path: string): boolean {
  return getActiveEmenuOrderingSubPath(path) !== "";
}

/** 门店信息 →「门店基础信息」内左侧三级导航（路由 `/store/basic`、`/store/logo`、`/store/business-hours` 等） */
export interface StoreBasicSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const STORE_BASIC_SUBNAV: StoreBasicSubItem[] = [
  { id: "sb-basic", title: "基础信息", titleEn: "Store profile", path: "/store/basic" },
  { id: "sb-logo", title: "LOGO", titleEn: "Logo", path: "/store/logo" },
  { id: "sb-hours", title: "营业时间", titleEn: "Business hours", path: "/store/business-hours" },
];

/** 当前路径落在门店基础信息三级区时，返回匹配的子项 path（最长前缀） */
export function getActiveStoreBasicSubPath(path: string): string {
  const sorted = [...STORE_BASIC_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isStoreBasicTertiaryPath(path: string): boolean {
  return getActiveStoreBasicSubPath(path) !== "";
}

export function getStoreBasicDefaultPath(): string {
  return STORE_BASIC_SUBNAV[0]?.path ?? "/store/basic";
}

/** 三级侧栏内、可折叠分组下的二级链接（交互对齐主导航可折叠模块） */
export interface ProductCenterSidebarSubchild {
  title: string;
  titleEn?: string;
  path: string;
}

/** 商品中心 · 品牌商品 / 品牌菜单 / 门店商品：左侧三级导航项（与门店基础信息同交互） */
export interface ProductCenterSidebarSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
  /** 高亮与归属判定；缺省为 `path` */
  activePrefix?: string;
  /** 多个可匹配前缀（如兼容旧路由） */
  activePrefixes?: string[];
  /** 若存在：一级行点击仅展开/收起，子链进入路由（同侧栏 `subNavPlacement: sidebar`） */
  sidebarChildren?: ProductCenterSidebarSubchild[];
}

function expandProductCenterSidebarPrefixes(item: ProductCenterSidebarSubItem): string[] {
  if (item.activePrefixes?.length) return item.activePrefixes;
  if (item.activePrefix) return [item.activePrefix];
  return [item.path];
}

/** 品牌商品管理 · 左侧三级导航 */
export const BRAND_PRODUCTS_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "bp-products", title: "商品", titleEn: "Products", path: "/brand-products/products" },
  {
    id: "bp-product-multi-language",
    title: "商品多语言",
    titleEn: "Product multi-language",
    path: "/brand-products/product-multi-language",
  },
  { id: "bp-product-categories", title: "分类", titleEn: "Categories", path: "/brand-products/product-categories" },
  { id: "bp-spec-groups", title: "规格组", titleEn: "Spec groups", path: "/brand-products/spec-groups" },
  { id: "bp-flavor-groups", title: "口味组", titleEn: "Flavor groups", path: "/brand-products/flavor-groups" },
  { id: "bp-prep-groups", title: "做法组", titleEn: "Prep groups", path: "/brand-products/prep-groups" },
  { id: "bp-addon-groups", title: "加料组", titleEn: "Add-on groups", path: "/brand-products/addon-groups" },
  { id: "bp-combo-groups", title: "套餐组", titleEn: "Combo groups", path: "/brand-products/combo-groups" },
  {
    id: "bp-seasoning-mgmt",
    title: "调味管理",
    titleEn: "Seasoning",
    path: "/brand-products/seasoning-mgmt/seasoning",
    activePrefix: "/brand-products/seasoning-mgmt",
    sidebarChildren: [
      { title: "调味", titleEn: "Seasoning", path: "/brand-products/seasoning-mgmt/seasoning" },
      {
        title: "下发记录",
        titleEn: "Distribution log",
        path: "/brand-products/seasoning-mgmt/distribution-log",
      },
    ],
  },
  {
    id: "bp-tags-mgmt",
    title: "标签管理",
    titleEn: "Tags",
    path: "/brand-products/tags/description",
    activePrefix: "/brand-products/tags",
    sidebarChildren: [
      { title: "描述标签", titleEn: "Description tags", path: "/brand-products/tags/description" },
      { title: "商品角标", titleEn: "Product corner badges", path: "/brand-products/tags/corner-badge" },
      { title: "统计标签", titleEn: "Statistics tags", path: "/brand-products/tags/stats" },
    ],
  },
  { id: "bp-ingredients", title: "原料管理", titleEn: "Ingredients", path: "/brand-products/ingredients" },
  {
    id: "bp-ingredient-categories",
    title: "原料分类",
    titleEn: "Ingredient categories",
    path: "/brand-products/ingredient-categories",
  },
  { id: "bp-images", title: "图片管理", titleEn: "Images", path: "/brand-products/images" },
  {
    id: "bp-recipes-mgmt",
    title: "配方管理",
    titleEn: "Recipes",
    path: "/brand-products/recipes/list",
    activePrefix: "/brand-products/recipes",
    sidebarChildren: [
      { title: "配方列表", titleEn: "Recipe list", path: "/brand-products/recipes/list" },
      {
        title: "原料管理",
        titleEn: "Ingredients (recipes)",
        path: "/brand-products/recipes/ingredients",
      },
      { title: "记录中心", titleEn: "Records center", path: "/brand-products/recipes/records" },
    ],
  },
];

/** 品牌菜单管理 · 左侧三级导航 */
export const BRAND_MENU_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "bm-menus", title: "菜单", titleEn: "Menus", path: "/brand-menu/menus", activePrefix: "/brand-menu" },
  {
    id: "bm-distribution",
    title: "下发记录",
    titleEn: "Distribution log",
    path: "/brand-menu/distribution-log",
    activePrefix: "/brand-menu/distribution-log",
  },
];

/** 营销中心侧滑层 ·「营销管理」下子导航 */
export const MARKETING_MGMT_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "mkt-screensaver", title: "屏保", titleEn: "Screensaver", path: "/marketing/screensaver" },
  { id: "mkt-ads", title: "广告", titleEn: "Ads", path: "/marketing/ads" },
  { id: "mkt-poster-pro", title: "海报Pro", titleEn: "Poster Pro", path: "/marketing/poster-pro" },
];

/** 商品中心侧滑层 · 设置（139/145 已迁前厅 pos-combo-ordering，无独立设置入口） */
export const PRODUCT_CENTER_MAIN_SHEET_SETTINGS_SUBNAV: ProductCenterSidebarSubItem[] = [];

export function getActiveProductCenterMainSettingsSubPath(_path: string): string {
  return "";
}

/** 营销中心侧滑层 · 设置（已全部迁至广告/海报 Pro，无独立设置入口） */
export const MARKETING_SHEET_SETTINGS_SUBNAV: ProductCenterSidebarSubItem[] = [];

export function getActiveMarketingSettingsSubPath(_path: string): string {
  return "";
}

/** 促销中心侧滑层 ·「促销活动」「抽奖活动」 */
export const PROMOTIONS_MGMT_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "promo-campaigns", title: "促销活动", titleEn: "Promotional activities", path: "/promotions/campaigns" },
  { id: "promo-lottery", title: "抽奖活动", titleEn: "Lottery", path: "/promotions/lottery" },
];

/** 促销中心侧滑层 · 设置（POS 本地促销已迁云促销，无独立设置入口） */
export const PROMOTIONS_SHEET_SETTINGS_SUBNAV: ProductCenterSidebarSubItem[] = [];

export function getActivePromotionsSettingsSubPath(path: string): string {
  if (path === "/promotions/settings" || path.startsWith("/promotions/settings/")) {
    return "/promotions/settings";
  }
  return "";
}

/** 礼品卡中心侧滑层 · Cards */
export const GIFT_CARDS_SHEET_MAIN_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "gc-cards", title: "礼品卡工厂", titleEn: "Gift cards", path: "/gift-cards/cards" },
];

/** 礼品卡中心侧滑层 · 设置 */
export const GIFT_CARDS_SHEET_SETTINGS_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "gc-settings", title: "设置", titleEn: "Settings", path: "/gift-cards/settings" },
];

/** @deprecated 使用 GIFT_CARDS_SHEET_MAIN_SUBNAV + GIFT_CARDS_SHEET_SETTINGS_SUBNAV */
export const GIFT_CARDS_SHEET_SUBNAV: ProductCenterSidebarSubItem[] = [
  ...GIFT_CARDS_SHEET_MAIN_SUBNAV,
  ...GIFT_CARDS_SHEET_SETTINGS_SUBNAV,
];

/** 打印中心侧滑层 · 打印装修 */
export const PRINT_SHEET_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "pt-decoration", title: "打印装修", titleEn: "Print styling", path: "/print-templates/decoration" },
  { id: "pt-settings", title: "设置", titleEn: "Settings", path: "/print-templates/settings" },
];

/** 预约等位中心侧滑层（title=中文，titleEn=英文；界面语言在顶栏切换） */
export const RESERVATIONS_SHEET_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "res-waitlist", title: "等位", titleEn: "Waitlist", path: "/operations/reservations/waitlist" },
  { id: "res-rsv", title: "预订", titleEn: "RSV", path: "/operations/reservations/rsv" },
  { id: "res-history", title: "历史", titleEn: "History", path: "/operations/reservations/history" },
  { id: "res-section", title: "分区", titleEn: "Section", path: "/operations/reservations/section" },
  { id: "res-settings", title: "设置", titleEn: "Settings", path: "/operations/reservations/settings" },
];

/** 报表中心侧滑层：营业汇总、可折叠分组（销售汇总 / 商品报表 / 员工报表 / 走势详情）、月度经营分析 */
export const REPORTS_SHEET_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "rpt-business-overview", title: "营业汇总", titleEn: "Business summary", path: "/reports/revenue" },
  {
    id: "rpt-sales-summary",
    title: "销售汇总",
    titleEn: "Sales summary",
    path: "/reports/sales/orders",
    activePrefix: "/reports/sales",
    sidebarChildren: [
      { title: "订单", titleEn: "Orders", path: "/reports/sales/orders" },
      { title: "支付", titleEn: "Payments", path: "/reports/sales/payments" },
      { title: "折扣金额", titleEn: "Discounts", path: "/reports/sales/discounts" },
      { title: "加收", titleEn: "Surcharges", path: "/reports/sales/surcharges" },
    ],
  },
  {
    id: "rpt-product-reports",
    title: "商品报表",
    titleEn: "Product reports",
    path: "/reports/products/ranking",
    activePrefix: "/reports/products",
    sidebarChildren: [
      { title: "排名", titleEn: "Ranking", path: "/reports/products/ranking" },
      { title: "商品潜力分析", titleEn: "Product potential", path: "/reports/products/potential" },
    ],
  },
  {
    id: "rpt-center-staff",
    title: "员工报表",
    titleEn: "Staff reports",
    path: "/reports/staff/overview",
    activePrefix: "/reports/staff",
    sidebarChildren: [
      { title: "员工概观", titleEn: "Staff overview", path: "/reports/staff/overview" },
      { title: "小费分配", titleEn: "Tips allocation", path: "/reports/staff/tips-allocation" },
    ],
  },
  {
    id: "rpt-trends",
    title: "走势详情",
    titleEn: "Trend details",
    path: "/reports/trends/store-overview",
    activePrefix: "/reports/trends",
    sidebarChildren: [
      { title: "分店概观", titleEn: "Store overview", path: "/reports/trends/store-overview" },
      { title: "销售额比对", titleEn: "Sales comparison", path: "/reports/trends/sales-comparison" },
    ],
  },
  { id: "rpt-monthly", title: "月度经营分析", titleEn: "Monthly analysis", path: "/reports/monthly-analysis" },
  { id: "rpt-settings", title: "设置", titleEn: "Settings", path: "/reports/settings" },
];

/** 财务中心侧滑层 · 业务（收银记录与审计；页内 Tab 切换支付/钱箱） */
export const FINANCE_SHEET_SUBNAV: ProductCenterSidebarSubItem[] = [
  {
    id: "fin-register-audit",
    title: "收银记录与审计",
    titleEn: "Register audit",
    path: "/finance/register-audit/payments",
    activePrefix: "/finance/register-audit",
  },
];

/** 财务中心侧滑层 · 设置 */
export const FINANCE_SHEET_SETTINGS_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "fin-settings", title: "设置", titleEn: "Settings", path: "/finance/settings" },
];

export function isFinanceHubPath(path: string): boolean {
  return path === "/finance" || path.startsWith("/finance/");
}

export function getActiveFinanceSheetSubPath(path: string): string {
  if (!isFinanceHubPath(path)) return "";
  if (path === "/finance/settings" || path.startsWith("/finance/settings/")) return "";
  return getActiveProductCenterSidebarSubPath(path, FINANCE_SHEET_SUBNAV);
}

export function getActiveFinanceSettingsSubPath(path: string): string {
  if (path === "/finance/settings" || path.startsWith("/finance/settings/")) {
    return "/finance/settings";
  }
  return "";
}

/** 会员中心侧滑层 ·「卡券管理」（可展开三级）+「积分配置」 */
export const MEMBERS_SHEET_SUBNAV: ProductCenterSidebarSubItem[] = [
  {
    id: "mem-card-mgmt",
    title: "卡券管理",
    titleEn: "Cards & coupons",
    path: "/members/card/coupon-mgmt",
    activePrefix: "/members/card",
    sidebarChildren: [
      { title: "优惠券管理", titleEn: "Coupon management", path: "/members/card/coupon-mgmt" },
      { title: "付费会员明细", titleEn: "Paid member details", path: "/members/card/paid-detail" },
      { title: "付费会员配置", titleEn: "Paid member settings", path: "/members/card/paid-config" },
    ],
  },
  { id: "mem-points", title: "积分配置", titleEn: "Points config", path: "/members/points" },
];

/** 会员中心侧滑层 · 设置 */
export const MEMBERS_SHEET_SETTINGS_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "mem-settings", title: "设置", titleEn: "Settings", path: "/members/settings" },
];

export function getActiveMembersSettingsSubPath(path: string): string {
  if (path === "/members/settings" || path.startsWith("/members/settings/")) {
    return "/members/settings";
  }
  return "";
}

/** 门店商品管理 · 左侧三级导航 */
export const STORE_MENU_SUBNAV: ProductCenterSidebarSubItem[] = [
  { id: "sm-store-menu", title: "门店菜单", titleEn: "Store menu", path: "/menu/store-menu" },
  { id: "sm-store-products", title: "门店商品", titleEn: "Store products", path: "/menu/store-products" },
  { id: "sm-store-seasoning", title: "门店调味", titleEn: "Store seasoning", path: "/menu/store-seasoning" },
  {
    id: "sm-inventory-changes",
    title: "库存变更记录",
    titleEn: "Inventory changes",
    path: "/menu/inventory-changes",
  },
  { id: "sm-print-settings", title: "打印设置", titleEn: "Print settings", path: "/menu/print-settings" },
  {
    id: "sm-tax-types",
    title: "税种管理",
    titleEn: "Tax types",
    path: "/menu/tax-types/settings",
    activePrefix: "/menu/tax-types",
    sidebarChildren: [
      { title: "税种管理", titleEn: "Tax types", path: "/menu/tax-types/settings" },
      { title: "商品税管理", titleEn: "Product tax management", path: "/menu/tax-types/product-tax" },
    ],
  },
  {
    id: "sm-recipe-list",
    title: "配方列表",
    titleEn: "Recipe list",
    path: "/menu/recipe-list",
    activePrefixes: ["/menu/recipe-list", "/menu/product-recipe"],
  },
];

export function getActiveProductCenterSidebarSubPath(
  path: string,
  items: ProductCenterSidebarSubItem[],
): string {
  const scored = items
    .flatMap((item) => expandProductCenterSidebarPrefixes(item).map((prefix) => ({ item, prefix })))
    .sort((a, b) => b.prefix.length - a.prefix.length);
  for (const { item, prefix } of scored) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return item.path;
  }
  return "";
}

/** `subNavPlacement: "sheet"` 模块：将主导航 children 转为侧滑层子导航项 */
export function navModuleChildrenAsSheetSubnav(m: NavModule): ProductCenterSidebarSubItem[] {
  return m.children.map((c) => ({
    id: c.id,
    title: c.title,
    titleEn: c.titleEn,
    path: c.path,
    chainOnly: c.chainOnly,
  }));
}

/** 当前路由在该模块「站内域」内时，返回侧滑层中高亮的子项 path（最长前缀） */
export function getActiveNavModuleSheetSubPath(path: string, m: NavModule): string {
  const prefixes = m.matchPrefixes?.length ? m.matchPrefixes : [m.path];
  const inHub = prefixes.some((p) => path === p || path.startsWith(`${p}/`));
  if (!inHub) return "";
  return getActiveProductCenterSidebarSubPath(path, navModuleChildrenAsSheetSubnav(m));
}

export function getActiveBrandProductsSubPath(path: string): string {
  if (!path.startsWith("/brand-products")) return "";
  return getActiveProductCenterSidebarSubPath(path, BRAND_PRODUCTS_SUBNAV);
}

export function isBrandProductsTertiaryPath(path: string): boolean {
  return path.startsWith("/brand-products");
}

export function getActiveBrandMenuSubPath(path: string): string {
  if (!path.startsWith("/brand-menu")) return "";
  return getActiveProductCenterSidebarSubPath(path, BRAND_MENU_SUBNAV);
}

export function getActiveMarketingMgmtSubPath(path: string): string {
  if (!path.startsWith("/marketing")) return "";
  return getActiveProductCenterSidebarSubPath(path, MARKETING_MGMT_SUBNAV);
}

export function getActivePromotionsMgmtSubPath(path: string): string {
  if (!path.startsWith("/promotions")) return "";
  return getActiveProductCenterSidebarSubPath(path, PROMOTIONS_MGMT_SUBNAV);
}

export function getActiveMembersSheetSubPath(path: string): string {
  if (!path.startsWith("/members")) return "";
  return getActiveProductCenterSidebarSubPath(path, MEMBERS_SHEET_SUBNAV);
}

export function getActiveGiftCardsSheetSubPath(path: string): string {
  if (!path.startsWith("/gift-cards")) return "";
  return getActiveProductCenterSidebarSubPath(path, GIFT_CARDS_SHEET_SUBNAV);
}

export function getActivePrintSheetSubPath(path: string): string {
  if (!path.startsWith("/print-templates")) return "";
  return getActiveProductCenterSidebarSubPath(path, PRINT_SHEET_SUBNAV);
}

/** 预约等位站内域（`/operations/reservations` 及子路径） */
export function isReservationsHubPath(path: string): boolean {
  return path === "/operations/reservations" || path.startsWith("/operations/reservations/");
}

export function getActiveReservationsSheetSubPath(path: string): string {
  if (!isReservationsHubPath(path)) return "";
  return getActiveProductCenterSidebarSubPath(path, RESERVATIONS_SHEET_SUBNAV);
}

/** 预约等位中心路由 → 主区标题 */
export function findReservationsNavTitle(path: string): { title: string; module: string } | null {
  if (!isReservationsHubPath(path)) return null;
  const sorted = [...RESERVATIONS_SHEET_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) {
      return { title: c.title, module: "预约等位中心 · Reservation & waitlist center" };
    }
  }
  return { title: "预约等位中心", module: "预约等位中心 · Reservation & waitlist center" };
}

/** 打印中心路由 → 主区标题 */
export function findPrintNavTitle(path: string): { title: string; module: string } | null {
  if (!path.startsWith("/print-templates")) return null;
  const sorted = [...PRINT_SHEET_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) {
      return { title: c.title, module: "打印中心 · Print center" };
    }
  }
  return { title: "打印中心", module: "打印中心 · Print center" };
}

/** 站内报表域（不含已废弃的信贷路由 `/reports/capital`） */
export function isReportsCenterHubPath(path: string): boolean {
  if (path === "/reports/capital" || path.startsWith("/reports/capital/")) return false;
  return path === "/reports" || path.startsWith("/reports/");
}

export function getActiveReportsSheetSubPath(path: string): string {
  if (!isReportsCenterHubPath(path)) return "";
  return getActiveProductCenterSidebarSubPath(path, REPORTS_SHEET_SUBNAV);
}

export function getReportsSheetSidebarChildActivePath(path: string, item: ProductCenterSidebarSubItem): string {
  if (!item.sidebarChildren?.length) return "";
  const sorted = [...item.sidebarChildren].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

/** 报表中心路由 → 主区标题 */
export function findReportsNavTitle(path: string): { title: string; module: string } | null {
  if (!isReportsCenterHubPath(path)) return null;
  const modBase = "报表中心 · Reporting center";
  for (const item of REPORTS_SHEET_SUBNAV) {
    if (item.sidebarChildren?.length) {
      const sorted = [...item.sidebarChildren].sort((a, b) => b.path.length - a.path.length);
      for (const c of sorted) {
        if (path === c.path || path.startsWith(`${c.path}/`)) {
          return { title: c.title, module: `报表中心 · ${item.title}` };
        }
      }
    }
    if (path === item.path || path.startsWith(`${item.path}/`)) {
      return { title: item.title, module: modBase };
    }
  }
  return { title: "报表中心", module: modBase };
}

/** 礼品卡中心路由 → 主区标题 */
export function findGiftCardsNavTitle(path: string): { title: string; module: string } | null {
  if (!path.startsWith("/gift-cards")) return null;
  const sorted = [...GIFT_CARDS_SHEET_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) {
      return { title: c.title, module: "礼品卡中心 · Gift card center" };
    }
  }
  return { title: "礼品卡中心", module: "礼品卡中心 · Gift card center" };
}

export function getMembersSheetSidebarChildActivePath(path: string, item: ProductCenterSidebarSubItem): string {
  if (item.id !== "mem-card-mgmt" || !item.sidebarChildren?.length) return "";
  const sorted = [...item.sidebarChildren].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

/** 会员中心路由 → 主区标题 / 模块副标题 */
export function findMembersNavTitle(path: string): { title: string; module: string } | null {
  if (!path.startsWith("/members")) return null;
  const card = MEMBERS_SHEET_SUBNAV.find((x) => x.id === "mem-card-mgmt");
  if (card?.sidebarChildren) {
    const sorted = [...card.sidebarChildren].sort((a, b) => b.path.length - a.path.length);
    for (const c of sorted) {
      if (path === c.path || path.startsWith(`${c.path}/`)) {
        return { title: c.title, module: "会员中心 · 卡券管理" };
      }
    }
  }
  if (path === "/members/points" || path.startsWith("/members/points/")) {
    return { title: "积分配置", module: "会员中心 · Member center" };
  }
  return { title: "会员中心", module: "会员中心 · Member center" };
}

export function isBrandMenuTertiaryPath(path: string): boolean {
  return path.startsWith("/brand-menu");
}

export function getActiveStoreMenuSubPath(path: string): string {
  if (!path.startsWith("/menu")) return "";
  return getActiveProductCenterSidebarSubPath(path, STORE_MENU_SUBNAV);
}

export function isStoreMenuTertiaryPath(path: string): boolean {
  return path.startsWith("/menu");
}

/** 门店商品管理 →「税种管理」内左侧三级导航 */
export interface MenuTaxTypesSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const MENU_TAX_TYPES_SUBNAV: MenuTaxTypesSubItem[] = [
  { id: "mt-tax-settings", title: "税种管理", titleEn: "Tax type settings", path: "/menu/tax-types/settings" },
  { id: "mt-product-tax", title: "商品税管理", titleEn: "Product tax management", path: "/menu/tax-types/product-tax" },
];

export function getActiveMenuTaxSubPath(path: string): string {
  const sorted = [...MENU_TAX_TYPES_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isMenuTaxTertiaryPath(path: string): boolean {
  return getActiveMenuTaxSubPath(path) !== "";
}

/** 品牌商品管理 →「调味管理」：主内容区左侧三级导航（路由 `/brand-products/seasoning-mgmt/...`） */
export interface BrandSeasoningMgmtSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const BRAND_SEASONING_MGMT_SUBNAV: BrandSeasoningMgmtSubItem[] = [
  { id: "bp-sm-seasoning", title: "调味", titleEn: "Seasoning", path: "/brand-products/seasoning-mgmt/seasoning" },
  {
    id: "bp-sm-distribution-log",
    title: "下发记录",
    titleEn: "Distribution log",
    path: "/brand-products/seasoning-mgmt/distribution-log",
  },
];

export function getBrandSeasoningMgmtDefaultPath(): string {
  return BRAND_SEASONING_MGMT_SUBNAV[0]?.path ?? "/brand-products/seasoning-mgmt/seasoning";
}

export function getActiveBrandSeasoningMgmtSubPath(path: string): string {
  const sorted = [...BRAND_SEASONING_MGMT_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isBrandSeasoningMgmtTertiaryPath(path: string): boolean {
  return getActiveBrandSeasoningMgmtSubPath(path) !== "";
}

/** 品牌商品管理 →「标签管理」：主内容区左侧三级导航 */
export interface BrandTagsMgmtSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const BRAND_TAGS_MGMT_SUBNAV: BrandTagsMgmtSubItem[] = [
  { id: "bp-tg-description", title: "描述标签", titleEn: "Description tags", path: "/brand-products/tags/description" },
  { id: "bp-tg-corner", title: "商品角标", titleEn: "Product corner badges", path: "/brand-products/tags/corner-badge" },
  { id: "bp-tg-stats", title: "统计标签", titleEn: "Statistics tags", path: "/brand-products/tags/stats" },
];

export function getBrandTagsMgmtDefaultPath(): string {
  return BRAND_TAGS_MGMT_SUBNAV[0]?.path ?? "/brand-products/tags/description";
}

export function getActiveBrandTagsMgmtSubPath(path: string): string {
  const sorted = [...BRAND_TAGS_MGMT_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isBrandTagsMgmtTertiaryPath(path: string): boolean {
  return getActiveBrandTagsMgmtSubPath(path) !== "";
}

/** 品牌商品管理 →「配方管理」：主内容区左侧三级导航 */
export interface BrandRecipesMgmtSubItem {
  id: string;
  title: string;
  titleEn?: string;
  path: string;
}

export const BRAND_RECIPES_MGMT_SUBNAV: BrandRecipesMgmtSubItem[] = [
  { id: "bp-rc-list", title: "配方列表", titleEn: "Recipe list", path: "/brand-products/recipes/list" },
  {
    id: "bp-rc-ingredients",
    title: "原料管理",
    titleEn: "Ingredients (recipes)",
    path: "/brand-products/recipes/ingredients",
  },
  { id: "bp-rc-records", title: "记录中心", titleEn: "Records center", path: "/brand-products/recipes/records" },
];

export function getBrandRecipesMgmtDefaultPath(): string {
  return BRAND_RECIPES_MGMT_SUBNAV[0]?.path ?? "/brand-products/recipes/list";
}

export function getActiveBrandRecipesMgmtSubPath(path: string): string {
  const sorted = [...BRAND_RECIPES_MGMT_SUBNAV].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c.path;
  }
  return "";
}

export function isBrandRecipesMgmtTertiaryPath(path: string): boolean {
  return getActiveBrandRecipesMgmtSubPath(path) !== "";
}

/** 扁平化所有路径（用于校验 / 生成 sitemap） */
export function flattenNavPaths(modules: NavModule[] = NAV_MODULES): string[] {
  const out: string[] = [];
  for (const m of modules) {
    out.push(m.path);
    for (const c of m.children) out.push(c.path);
  }
  /** 库存变更记录：无侧栏二级入口，仍为占位子路由 */
  out.push("/operations/inventory-ordering/inventory-change-log");
  for (const k of KIOSK_ORDERING_SUBNAV) out.push(k.path);
  for (const p of POS_ORDERING_SUBNAV) out.push(p.path);
  for (const pp of PAYPAD_ORDERING_SUBNAV) out.push(pp.path);
  for (const e of EMENU_ORDERING_SUBNAV) out.push(e.path);
  for (const s of STORE_BASIC_SUBNAV) out.push(s.path);
  for (const bp of BRAND_PRODUCTS_SUBNAV) out.push(bp.path);
  for (const bm of BRAND_MENU_SUBNAV) out.push(bm.path);
  for (const sm of STORE_MENU_SUBNAV) out.push(sm.path);
  for (const t of MENU_TAX_TYPES_SUBNAV) out.push(t.path);
  for (const d of DEVICE_MANAGEMENT_HARDWARE_SUBNAV) out.push(d.path);
  for (const tips of TIPS_MANAGEMENT_SUBNAV) out.push(tips.path);
  for (const tr of TEAM_REPORTS_SUBNAV) out.push(tr.path);
  for (const sm of BRAND_SEASONING_MGMT_SUBNAV) out.push(sm.path);
  for (const tg of BRAND_TAGS_MGMT_SUBNAV) out.push(tg.path);
  for (const rc of BRAND_RECIPES_MGMT_SUBNAV) out.push(rc.path);
  for (const pc of PRODUCT_CENTER_DEEP_NAV) out.push(pc.path);
  for (const mem of MEMBERS_SHEET_SUBNAV) {
    out.push(mem.path);
    if (mem.sidebarChildren) for (const ch of mem.sidebarChildren) out.push(ch.path);
  }
  for (const gc of GIFT_CARDS_SHEET_SUBNAV) {
    out.push(gc.path);
    if (gc.sidebarChildren) for (const ch of gc.sidebarChildren) out.push(ch.path);
  }
  for (const r of REPORTS_SHEET_SUBNAV) {
    out.push(r.path);
    if (r.sidebarChildren) for (const ch of r.sidebarChildren) out.push(ch.path);
  }
  for (const pt of PRINT_SHEET_SUBNAV) {
    out.push(pt.path);
    if (pt.sidebarChildren) for (const ch of pt.sidebarChildren) out.push(ch.path);
  }
  for (const rv of RESERVATIONS_SHEET_SUBNAV) {
    out.push(rv.path);
    if (rv.sidebarChildren) for (const ch of rv.sidebarChildren) out.push(ch.path);
  }
  for (const fin of FINANCE_SHEET_SUBNAV) {
    out.push(fin.path);
    if (fin.activePrefix) out.push(fin.activePrefix);
  }
  out.push("/finance/register-audit/cash-drawer");
  out.push("/finance/settings");
  return out;
}
