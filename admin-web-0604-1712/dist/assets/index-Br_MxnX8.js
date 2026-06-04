(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function r(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=r(s);fetch(s.href,i)}})();const mm=[{id:"bp-products",title:"商品",titleEn:"Products",path:"/brand-products/products"},{id:"bp-product-multi-language",title:"商品多语言",titleEn:"Product multi-language",path:"/brand-products/product-multi-language"},{id:"bp-product-categories",title:"商品分类",titleEn:"Product categories",path:"/brand-products/product-categories"},{id:"bp-spec-groups",title:"规格组",titleEn:"Spec groups",path:"/brand-products/spec-groups"},{id:"bp-flavor-groups",title:"口味组",titleEn:"Flavor groups",path:"/brand-products/flavor-groups"},{id:"bp-prep-groups",title:"做法组",titleEn:"Preparation groups",path:"/brand-products/prep-groups"},{id:"bp-addon-groups",title:"加料组",titleEn:"Add-on groups",path:"/brand-products/addon-groups"},{id:"bp-combo-groups",title:"套餐组",titleEn:"Combo groups",path:"/brand-products/combo-groups"},{id:"bp-seasoning",title:"调味管理",titleEn:"Seasoning management",path:"/brand-products/seasoning-mgmt/seasoning"},{id:"bp-tags",title:"标签管理",titleEn:"Tag management",path:"/brand-products/tags/description"},{id:"bp-ingredients",title:"原料管理",titleEn:"Ingredients",path:"/brand-products/ingredients"},{id:"bp-ingredient-categories",title:"原料分类",titleEn:"Ingredient categories",path:"/brand-products/ingredient-categories"},{id:"bp-images",title:"图片管理",titleEn:"Image management",path:"/brand-products/images"},{id:"bp-recipes",title:"配方管理",titleEn:"Recipe management",path:"/brand-products/recipes/list"},{id:"bp-seasoning-distribution",title:"下发记录",titleEn:"Distribution log",path:"/brand-products/seasoning-mgmt/distribution-log"},{id:"bm-menus",title:"品牌菜单",titleEn:"Brand menus",path:"/brand-menu/menus"},{id:"bm-distribution-log",title:"下发记录",titleEn:"Distribution log",path:"/brand-menu/distribution-log"},{id:"bm-groups",title:"菜单分组",titleEn:"Menu groups",path:"/brand-menu/groups"},{id:"bm-channel-visibility",title:"渠道可见性",titleEn:"Channel visibility",path:"/brand-menu/channel-visibility"},{id:"bm-publish",title:"发布与版本",titleEn:"Publish & versions",path:"/brand-menu/publish-versions"},{id:"menu-store-menu",title:"门店菜单",titleEn:"Store menu",path:"/menu/store-menu"},{id:"menu-store-products",title:"门店商品",titleEn:"Store products",path:"/menu/store-products"},{id:"menu-inventory-changes",title:"库存变更记录",titleEn:"Inventory change log",path:"/menu/inventory-changes"},{id:"menu-product-recipe",title:"商品配方",titleEn:"Product recipe",path:"/menu/product-recipe"},{id:"menu-recipe-list",title:"配方列表",titleEn:"Recipe list",path:"/menu/recipe-list"},{id:"menu-store-seasoning",title:"门店调味",titleEn:"Store seasoning",path:"/menu/store-seasoning"},{id:"menu-print-settings",title:"打印设置",titleEn:"Print settings",path:"/menu/print-settings"},{id:"menu-multi-language",title:"菜单多语言",titleEn:"Menu multi-language",path:"/menu/multi-language"},{id:"menu-tax-types",title:"税种管理",titleEn:"Tax types",path:"/menu/tax-types/settings"},{id:"menu-product-tax-mgmt",title:"商品税管理",titleEn:"Product tax management",path:"/menu/tax-types/product-tax"}],R=[{id:"brand-mgmt",title:"品牌管理",titleEn:"Brand management",icon:"brandMgmt",path:"/brand",subNavPlacement:"sheet",defaultChildPath:"/brand/overview",children:[{id:"br-overview",title:"品牌总览",titleEn:"Overview",path:"/brand/overview"},{id:"br-list",title:"品牌列表",titleEn:"Brand list",path:"/brand/list"},{id:"br-settings",title:"品牌设置",titleEn:"Brand settings",path:"/brand/settings"}]},{id:"store-mgmt",title:"门店管理",titleEn:"Store management",icon:"storeMgmt",path:"/stores",subNavPlacement:"sheet",defaultChildPath:"/stores/overview",children:[{id:"st-overview",title:"门店总览",titleEn:"Overview",path:"/stores/overview"},{id:"st-list",title:"门店列表",titleEn:"Store list",path:"/stores/list"},{id:"st-status",title:"门店状态",titleEn:"Store status",path:"/stores/status"},{id:"st-settings",title:"设置",path:"/stores/settings"}]},{id:"dashboard",title:"主页",titleEn:"Dashboard",icon:"home",path:"/dashboard",subNavPlacement:"sheet",defaultChildPath:"/dashboard/overview",children:[{id:"dash-overview",title:"今日概览",path:"/dashboard/overview"},{id:"dash-todos",title:"待办",path:"/dashboard/todos"},{id:"dash-kpi",title:"关键指标",path:"/dashboard/kpi"},{id:"dash-settings",title:"设置",titleEn:"Settings",path:"/dashboard/settings"}]},{id:"team",title:"团队管理",titleEn:"Team",icon:"team",path:"/team",subNavPlacement:"sheet",defaultChildPath:"/team/roles-employees",children:[{id:"team-roles",title:"角色与员工",path:"/team/roles-employees"},{id:"team-breaks",title:"休息与加班",path:"/team/breaks-overtime"},{id:"team-clock",title:"员工打卡",path:"/team/clock-in"},{id:"team-tips",title:"小费管理",path:"/team/tips"},{id:"team-tax-payroll",title:"报税报表",titleEn:"Tax payroll reports",path:"/team/payroll-report"},{id:"team-reports",title:"员工报表",path:"/team/reports"},{id:"team-7shifts",title:"7Shifts 对接（排班）",path:"/team/integrations/7shifts"},{id:"team-schedule",title:"排班与考勤",path:"/team/scheduling",chainOnly:!0},{id:"team-training",title:"绩效与培训",path:"/team/training-performance"},{id:"team-settings",title:"设置",path:"/team/settings"}]},{id:"product-center-main",title:"商品中心",titleEn:"Product center",icon:"menu",path:"/product-center-main",matchPrefixes:["/product-center-main","/brand-products","/brand-menu","/menu"],defaultChildPath:"/brand-products/products",children:[{id:"pcm-brand-products",title:"商品管理",titleEn:"Product management",path:"/brand-products/products"},{id:"pcm-brand-menu",title:"品牌菜单",titleEn:"Brand menus",path:"/brand-menu/menus"},{id:"pcm-store-mgmt",title:"门店管理",titleEn:"Store management",path:"/menu/store-menu"},{id:"pcm-settings",title:"设置",titleEn:"Settings",path:"/product-center-main/settings"}]},{id:"orders",title:"订单中心",titleEn:"Order center",icon:"orders",path:"/orders",subNavPlacement:"sheet",defaultChildPath:"/orders/all",children:[{id:"orders-all",title:"全部订单",path:"/orders/all"},{id:"orders-refunds",title:"退单",titleEn:"Refunds & voids",path:"/orders/refunds"},{id:"orders-history",title:"订单历史",path:"/orders/history"},{id:"orders-settings",title:"设置",path:"/orders/settings"}]},{id:"transactions",title:"支付中心",titleEn:"Payment center",icon:"receipt",path:"/transactions",subNavPlacement:"sheet",defaultChildPath:"/transactions/ledger",children:[{id:"tx-ledger",title:"交易流水",path:"/transactions/ledger"},{id:"tx-payments",title:"支付方式",path:"/transactions/payments"},{id:"tx-reconcile",title:"对账",path:"/transactions/reconcile"},{id:"tx-settings",title:"设置",path:"/transactions/settings"}]},{id:"waitlist",title:"外卖/来取",titleEn:"Delivery & pickup",icon:"waitlist",path:"/operations/waitlist",subNavPlacement:"sheet",defaultChildPath:"/operations/waitlist",children:[{id:"wl-main",title:"外卖/来取",titleEn:"Delivery & pickup",path:"/operations/waitlist"},{id:"wl-settings",title:"设置",titleEn:"Settings",path:"/operations/waitlist/settings"}]},{id:"marketing",title:"营销中心",titleEn:"Marketing center",icon:"marketing",path:"/marketing",defaultChildPath:"/marketing/campaigns",children:[{id:"mkt-campaigns",title:"营销活动",titleEn:"Campaigns",path:"/marketing/campaigns"},{id:"mkt-manual",title:"手动营销",titleEn:"Manual marketing",path:"/marketing/manual"},{id:"mkt-screensaver",title:"屏保",titleEn:"Screensaver",path:"/marketing/screensaver"},{id:"mkt-ads",title:"广告",titleEn:"Ads",path:"/marketing/ads"},{id:"mkt-poster-pro",title:"海报Pro",titleEn:"Poster Pro",path:"/marketing/poster-pro"}]},{id:"promotions",title:"促销中心",titleEn:"Promotion center",icon:"promo",path:"/promotions",defaultChildPath:"/promotions/campaigns",children:[{id:"promo-campaigns",title:"促销活动",titleEn:"Promotional activities",path:"/promotions/campaigns"},{id:"promo-lottery",title:"抽奖活动",titleEn:"Lottery",path:"/promotions/lottery"}]},{id:"members",title:"会员中心",titleEn:"Member center",icon:"members",path:"/members",defaultChildPath:"/members/card/coupon-mgmt",children:[{id:"mem-card-entry",title:"卡券管理",titleEn:"Cards & coupons",path:"/members/card/coupon-mgmt"},{id:"mem-points",title:"积分配置",titleEn:"Points config",path:"/members/points"},{id:"mem-settings",title:"设置",titleEn:"Settings",path:"/members/settings"}]},{id:"gift-cards",title:"礼品卡中心",titleEn:"Gift card center",icon:"gift",path:"/gift-cards",defaultChildPath:"/gift-cards/cards",children:[{id:"gc-cards",title:"Cards",titleEn:"礼品卡工厂",path:"/gift-cards/cards"},{id:"gc-settings",title:"设置",titleEn:"Settings",path:"/gift-cards/settings"}]},{id:"reviews",title:"评价中心",titleEn:"Review center",icon:"reviews",path:"/reviews",subNavPlacement:"sheet",defaultChildPath:"/reviews/insights",children:[{id:"rev-insights",title:"评价洞察",path:"/reviews/insights"},{id:"rev-settings",title:"设置",titleEn:"Settings",path:"/reviews/settings"},{id:"rev-detail",title:"评价明细",path:"/reviews/detail"},{id:"rev-stats",title:"评价统计",path:"/reviews/stats"}]},{id:"queue-call",title:"前厅管理中心",titleEn:"Front of house management center",icon:"queueCall",path:"/operations/queue-call",subNavPlacement:"sheet",defaultChildPath:"/operations/queue-call",children:[{id:"qc-main",title:"前厅管理中心",titleEn:"Front of house management center",path:"/operations/queue-call"},{id:"qc-floor-plan",title:"餐位平面图",titleEn:"Table layout",path:"/operations/queue-call/floor-plan"},{id:"qc-settings",title:"设置",titleEn:"Settings",path:"/operations/queue-call/settings"}]},{id:"kitchen-kds",title:"后厨管理中心",titleEn:"Back-of-house management center",icon:"kitchenKds",path:"/operations/kitchen-kds",subNavPlacement:"sheet",defaultChildPath:"/operations/kitchen-kds",children:[{id:"kds-main",title:"后厨设置",titleEn:"Back-of-house settings",path:"/operations/kitchen-kds"},{id:"kds-settings",title:"设置",titleEn:"Settings",path:"/operations/kitchen-kds/settings"}]},{id:"reservations",title:"预约等位中心",titleEn:"Reservation & waitlist center",icon:"reservations",path:"/operations/reservations",defaultChildPath:"/operations/reservations/waitlist",children:[{id:"res-waitlist",title:"Waitlist",titleEn:"等位",path:"/operations/reservations/waitlist"},{id:"res-rsv",title:"RSV",titleEn:"预订",path:"/operations/reservations/rsv"},{id:"res-history",title:"History",titleEn:"历史",path:"/operations/reservations/history"},{id:"res-section",title:"Section",titleEn:"分区",path:"/operations/reservations/section"},{id:"res-settings",title:"设置",titleEn:"Settings",path:"/operations/reservations/settings"}]},{id:"reports-finance",title:"报表中心",titleEn:"Reporting center",icon:"reports",path:"/reports",defaultChildPath:"/reports/revenue",children:[{id:"rpt-revenue",title:"营业汇总",titleEn:"Business summary",path:"/reports/revenue"},{id:"rpt-sales",title:"销售汇总",titleEn:"Sales summary",path:"/reports/sales/orders"},{id:"rpt-products",title:"商品报表",titleEn:"Product reports",path:"/reports/products/ranking"},{id:"rpt-staff",title:"员工报表",titleEn:"Staff reports",path:"/reports/staff/overview"},{id:"rpt-trends",title:"走势详情",titleEn:"Trend details",path:"/reports/trends/store-overview"},{id:"rpt-monthly",title:"月度经营分析",titleEn:"Monthly analysis",path:"/reports/monthly-analysis"},{id:"rpt-settings",title:"设置",titleEn:"Settings",path:"/reports/settings"}]},{id:"finance-center",title:"财务中心",titleEn:"Finance center",icon:"financeCenter",path:"/finance",subNavPlacement:"sheet",defaultChildPath:"/finance/overview",children:[{id:"fin-overview",title:"财务总览",titleEn:"Overview",path:"/finance/overview"},{id:"fin-cash-flow",title:"收支流水",titleEn:"Cash flow",path:"/finance/cash-flow"},{id:"fin-reconcile",title:"对账管理",titleEn:"Reconciliation",path:"/finance/reconciliation"},{id:"fin-register-audit",title:"收银记录与审计",titleEn:"Register audit",path:"/finance/register-audit/payments"},{id:"fin-invoices",title:"发票与税务",titleEn:"Invoices & tax",path:"/finance/invoices"},{id:"fin-settings",title:"设置",path:"/finance/settings"}]},{id:"print-templates",title:"打印中心",titleEn:"Print center",icon:"printTemplate",path:"/print-templates",defaultChildPath:"/print-templates/decoration",children:[{id:"pt-decoration",title:"打印装修",titleEn:"Print styling",path:"/print-templates/decoration"},{id:"pt-settings",title:"设置",titleEn:"Settings",path:"/print-templates/settings"}]},{id:"notifications",title:"消息中心",titleEn:"Message center",icon:"notifications",path:"/notifications",subNavPlacement:"sheet",defaultChildPath:"/notifications/center",children:[{id:"notif-center",title:"收件箱",titleEn:"Inbox",path:"/notifications/center"},{id:"notif-settings",title:"通知设置",titleEn:"Preferences",path:"/notifications/settings"},{id:"notif-templates",title:"模板与订阅",titleEn:"Templates & subscriptions",path:"/notifications/templates"}]},{id:"inventory-ordering",title:"库存管理中心",titleEn:"Inventory management center",icon:"inventory",path:"/operations/inventory-ordering",subNavPlacement:"tabs",defaultChildPath:"/operations/inventory-ordering/expiry",children:[{id:"inv-expiry",title:"效期管理",titleEn:"Expiry management",path:"/operations/inventory-ordering/expiry"},{id:"inv-materials",title:"物料管理",titleEn:"Materials management",path:"/operations/inventory-ordering/materials"},{id:"inv-settings",title:"设置",titleEn:"Settings",path:"/operations/inventory-ordering/settings"}]},{id:"device-management",title:"硬件管理中心",titleEn:"Hardware management center",icon:"deviceManagement",path:"/device-management",subNavPlacement:"sheet",defaultChildPath:"/device-management/overview",children:[{id:"dm-overview",title:"设备总览",titleEn:"Overview",path:"/device-management/overview"},{id:"dm-hardware",title:"硬件",titleEn:"Hardware",path:"/device-management/hardware/payments"},{id:"dm-terminals",title:"终端管理",titleEn:"Terminals",path:"/device-management/terminals"},{id:"dm-binding",title:"绑定与授权",titleEn:"Binding & authorization",path:"/device-management/binding"},{id:"dm-alerts",title:"监控告警",titleEn:"Monitoring & alerts",path:"/device-management/alerts"},{id:"dm-settings",title:"设置",path:"/device-management/settings"}]},{id:"permission-mgmt",title:"权限管理中心",titleEn:"Access management center",icon:"permissionMgmt",path:"/permissions",subNavPlacement:"sheet",defaultChildPath:"/permissions/overview",children:[{id:"perm-overview",title:"权限总览",titleEn:"Overview",path:"/permissions/overview"},{id:"perm-roles",title:"角色与功能权限",titleEn:"Roles & permissions",path:"/permissions/roles"},{id:"perm-staff",title:"员工授权",titleEn:"Staff assignments",path:"/permissions/staff"},{id:"perm-changelog",title:"权限变更记录",titleEn:"Permission change log",path:"/permissions/change-log"},{id:"perm-order-limit",title:"下单限制",titleEn:"Order limits",path:"/permissions/order-limit"},{id:"perm-settings",title:"设置",path:"/permissions/settings"}]},{id:"capital-turnover",title:"信贷中心",titleEn:"Credit center",icon:"capital",path:"/reports/capital",defaultChildPath:"/reports/capital",children:[{id:"capital-main",title:"信贷中心",titleEn:"Credit center",path:"/reports/capital"}]},{id:"asset-center",title:"素材中心",titleEn:"Asset center",icon:"assetCenter",path:"/asset-center",subNavPlacement:"sheet",defaultChildPath:"/asset-center/materials",children:[{id:"ac-materials",title:"图片素材",titleEn:"Image materials",path:"/asset-center/materials"},{id:"ac-videos",title:"视频库",titleEn:"Video library",path:"/asset-center/videos"},{id:"ac-settings",title:"设置",path:"/asset-center/settings"}]},{id:"settings",title:"系统设置",titleEn:"System settings",icon:"settings",path:"/settings",subNavPlacement:"sheet",defaultChildPath:"/settings/overview",children:[{id:"set-overview",title:"系统设置总揽",titleEn:"System settings overview",path:"/settings/overview"},{id:"set-basic",title:"基础设置（门店、营业时间、多门店）",path:"/settings/basic"},{id:"set-report",title:"报表设置",path:"/settings/reports"},{id:"set-print",title:"打印与票据",path:"/settings/printing"},{id:"set-tips",title:"小费设置",path:"/settings/tips"},{id:"set-service",title:"服务流程",path:"/settings/service-flow"},{id:"set-security",title:"安全设置",path:"/settings/security"},{id:"set-accounts",title:"账号与权限",path:"/settings/accounts"},{id:"set-audit",title:"操作日志",path:"/settings/audit-log"},{id:"set-integrations",title:"集成与 API",path:"/settings/integrations"},{id:"set-data-scope",title:"角色与数据范围",path:"/settings/data-scope",chainOnly:!0}]}],pr=[{id:"dmh-payments",title:"支付",titleEn:"Payments",path:"/device-management/hardware/payments"},{id:"dmh-cash-drawer",title:"钱箱",titleEn:"Cash drawer",path:"/device-management/hardware/cash-drawer"},{id:"dmh-router",title:"路由器",titleEn:"Router",path:"/device-management/hardware/router"},{id:"dmh-pos",title:"POS",titleEn:"POS",path:"/device-management/hardware/pos"},{id:"dmh-pos-go",title:"POS GO",titleEn:"POS Go",path:"/device-management/hardware/pos-go"},{id:"dmh-kds",title:"KDS",titleEn:"KDS",path:"/device-management/hardware/kds"},{id:"dmh-queue-display",title:"叫号屏",titleEn:"Queue display",path:"/device-management/hardware/queue-display"},{id:"dmh-printers",title:"打印机",titleEn:"Printers",path:"/device-management/hardware/printers"},{id:"dmh-scale",title:"电子秤",titleEn:"Electronic scale",path:"/device-management/hardware/scale"},{id:"dmh-kiosk",title:"Kiosk",titleEn:"Kiosk",path:"/device-management/hardware/kiosk"},{id:"dmh-emenu",title:"eMenu",titleEn:"eMenu devices",path:"/device-management/hardware/emenu"}];function gm(){var e;return((e=pr[0])==null?void 0:e.path)??"/device-management/hardware/payments"}function Xs(e){const t=[...pr].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return r.path;return""}function fm(e){return Xs(e)!==""}const bm=pr.map(e=>({id:`so-${e.id}`,title:e.title,titleEn:e.titleEn,path:e.path})),Zr=[{id:"tips-distribution",title:"小费分配",titleEn:"Tip distribution",path:"/team/tips/distribution"},{id:"tips-details",title:"分配明细",titleEn:"Distribution details",path:"/team/tips/details"},{id:"tips-rules",title:"分配规则",titleEn:"Distribution rules",path:"/team/tips/rules"}];function hm(){var e;return((e=Zr[0])==null?void 0:e.path)??"/team/tips/distribution"}function Zs(e){const t=[...Zr].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return r.path;return""}function vm(e){return Zs(e)!==""}const Jr=[{id:"team-rpt-overview",title:"概览",titleEn:"Overview",path:"/team/reports/overview"},{id:"team-rpt-tips",title:"小费",titleEn:"Tips",path:"/team/reports/tips"},{id:"team-rpt-performance",title:"绩效",titleEn:"Performance",path:"/team/reports/performance"},{id:"team-rpt-payroll",title:"薪资",titleEn:"Payroll",path:"/team/reports/payroll"}];function ym(){var e;return((e=Jr[0])==null?void 0:e.path)??"/team/reports/overview"}function Js(e){const t=[...Jr].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return r.path;return""}function xm(e){return Js(e)!==""}const en=[{id:"team-sch-attendance",title:"考勤记录",titleEn:"Attendance records",path:"/team/scheduling/attendance-records"},{id:"team-sch-overtime",title:"加班规则",titleEn:"Overtime rules",path:"/team/scheduling/overtime-rules"}];function Sm(){var e;return((e=en[0])==null?void 0:e.path)??"/team/scheduling/attendance-records"}function ei(e){const t=[...en].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return r.path;return""}function Tm(e){return ei(e)!==""}function Em(e){var t;return(t=e.activePrefixes)!=null&&t.length?e.activePrefixes:e.activePrefix?[e.activePrefix]:[e.path]}const ti=[{id:"bp-products",title:"商品",titleEn:"Products",path:"/brand-products/products"},{id:"bp-product-multi-language",title:"商品多语言",titleEn:"Product multi-language",path:"/brand-products/product-multi-language"},{id:"bp-product-categories",title:"分类",titleEn:"Categories",path:"/brand-products/product-categories"},{id:"bp-spec-groups",title:"规格组",titleEn:"Spec groups",path:"/brand-products/spec-groups"},{id:"bp-flavor-groups",title:"口味组",titleEn:"Flavor groups",path:"/brand-products/flavor-groups"},{id:"bp-prep-groups",title:"做法组",titleEn:"Prep groups",path:"/brand-products/prep-groups"},{id:"bp-addon-groups",title:"加料组",titleEn:"Add-on groups",path:"/brand-products/addon-groups"},{id:"bp-combo-groups",title:"套餐组",titleEn:"Combo groups",path:"/brand-products/combo-groups"},{id:"bp-seasoning-mgmt",title:"调味管理",titleEn:"Seasoning",path:"/brand-products/seasoning-mgmt/seasoning",activePrefix:"/brand-products/seasoning-mgmt",sidebarChildren:[{title:"调味",titleEn:"Seasoning",path:"/brand-products/seasoning-mgmt/seasoning"},{title:"下发记录",titleEn:"Distribution log",path:"/brand-products/seasoning-mgmt/distribution-log"}]},{id:"bp-tags-mgmt",title:"标签管理",titleEn:"Tags",path:"/brand-products/tags/description",activePrefix:"/brand-products/tags",sidebarChildren:[{title:"描述标签",titleEn:"Description tags",path:"/brand-products/tags/description"},{title:"商品角标",titleEn:"Product corner badges",path:"/brand-products/tags/corner-badge"},{title:"统计标签",titleEn:"Statistics tags",path:"/brand-products/tags/stats"}]},{id:"bp-ingredients",title:"原料管理",titleEn:"Ingredients",path:"/brand-products/ingredients"},{id:"bp-ingredient-categories",title:"原料分类",titleEn:"Ingredient categories",path:"/brand-products/ingredient-categories"},{id:"bp-images",title:"图片管理",titleEn:"Images",path:"/brand-products/images"},{id:"bp-recipes-mgmt",title:"配方管理",titleEn:"Recipes",path:"/brand-products/recipes/list",activePrefix:"/brand-products/recipes",sidebarChildren:[{title:"配方列表",titleEn:"Recipe list",path:"/brand-products/recipes/list"},{title:"原料管理",titleEn:"Ingredients (recipes)",path:"/brand-products/recipes/ingredients"},{title:"记录中心",titleEn:"Records center",path:"/brand-products/recipes/records"}]}],ri=[{id:"bm-menus",title:"菜单",titleEn:"Menus",path:"/brand-menu/menus",activePrefix:"/brand-menu"},{id:"bm-distribution",title:"下发记录",titleEn:"Distribution log",path:"/brand-menu/distribution-log",activePrefix:"/brand-menu/distribution-log"}],nl=[{id:"mkt-campaigns",title:"营销活动",titleEn:"Campaigns",path:"/marketing/campaigns"},{id:"mkt-manual",title:"手动营销",titleEn:"Manual marketing",path:"/marketing/manual"},{id:"mkt-screensaver",title:"屏保",titleEn:"Screensaver",path:"/marketing/screensaver"},{id:"mkt-ads",title:"广告",titleEn:"Ads",path:"/marketing/ads"},{id:"mkt-poster-pro",title:"海报Pro",titleEn:"Poster Pro",path:"/marketing/poster-pro"}],$m=[{id:"pcm-settings",title:"设置",titleEn:"Settings",path:"/product-center-main/settings"}];function wm(e){return e==="/product-center-main/settings"||e.startsWith("/product-center-main/settings/")?"/product-center-main/settings":""}const wo=[];function km(e){return""}const sl=[{id:"promo-campaigns",title:"促销活动",titleEn:"Promotional activities",path:"/promotions/campaigns"},{id:"promo-lottery",title:"抽奖活动",titleEn:"Lottery",path:"/promotions/lottery"}],ko=[];function _m(e){return e==="/promotions/settings"||e.startsWith("/promotions/settings/")?"/promotions/settings":""}const il=[{id:"gc-cards",title:"礼品卡工厂",titleEn:"Gift cards",path:"/gift-cards/cards"}],ol=[{id:"gc-settings",title:"设置",titleEn:"Settings",path:"/gift-cards/settings"}],ni=[...il,...ol],Lt=[{id:"pt-decoration",title:"打印装修",titleEn:"Print styling",path:"/print-templates/decoration"},{id:"pt-settings",title:"设置",titleEn:"Settings",path:"/print-templates/settings"}],tn=[{id:"res-waitlist",title:"等位",titleEn:"Waitlist",path:"/operations/reservations/waitlist"},{id:"res-rsv",title:"预订",titleEn:"RSV",path:"/operations/reservations/rsv"},{id:"res-history",title:"历史",titleEn:"History",path:"/operations/reservations/history"},{id:"res-section",title:"分区",titleEn:"Section",path:"/operations/reservations/section"},{id:"res-settings",title:"设置",titleEn:"Settings",path:"/operations/reservations/settings"}],rn=[{id:"rpt-business-overview",title:"营业汇总",titleEn:"Business summary",path:"/reports/revenue"},{id:"rpt-sales-summary",title:"销售汇总",titleEn:"Sales summary",path:"/reports/sales/orders",activePrefix:"/reports/sales",sidebarChildren:[{title:"订单",titleEn:"Orders",path:"/reports/sales/orders"},{title:"支付",titleEn:"Payments",path:"/reports/sales/payments"},{title:"折扣金额",titleEn:"Discounts",path:"/reports/sales/discounts"},{title:"加收",titleEn:"Surcharges",path:"/reports/sales/surcharges"}]},{id:"rpt-product-reports",title:"商品报表",titleEn:"Product reports",path:"/reports/products/ranking",activePrefix:"/reports/products",sidebarChildren:[{title:"排名",titleEn:"Ranking",path:"/reports/products/ranking"},{title:"商品潜力分析",titleEn:"Product potential",path:"/reports/products/potential"}]},{id:"rpt-center-staff",title:"员工报表",titleEn:"Staff reports",path:"/reports/staff/overview",activePrefix:"/reports/staff",sidebarChildren:[{title:"员工概观",titleEn:"Staff overview",path:"/reports/staff/overview"},{title:"小费分配",titleEn:"Tips allocation",path:"/reports/staff/tips-allocation"}]},{id:"rpt-trends",title:"走势详情",titleEn:"Trend details",path:"/reports/trends/store-overview",activePrefix:"/reports/trends",sidebarChildren:[{title:"分店概观",titleEn:"Store overview",path:"/reports/trends/store-overview"},{title:"销售额比对",titleEn:"Sales comparison",path:"/reports/trends/sales-comparison"}]},{id:"rpt-monthly",title:"月度经营分析",titleEn:"Monthly analysis",path:"/reports/monthly-analysis"},{id:"rpt-settings",title:"设置",titleEn:"Settings",path:"/reports/settings"}],si=[{id:"fin-overview",title:"财务总览",titleEn:"Overview",path:"/finance/overview"},{id:"fin-cash-flow",title:"收支流水",titleEn:"Cash flow",path:"/finance/cash-flow"},{id:"fin-reconcile",title:"对账管理",titleEn:"Reconciliation",path:"/finance/reconciliation"},{id:"fin-register-audit",title:"收银记录与审计",titleEn:"Register audit",path:"/finance/register-audit/payments",activePrefix:"/finance/register-audit"},{id:"fin-invoices",title:"发票与税务",titleEn:"Invoices & tax",path:"/finance/invoices"}],Pm=[{id:"fin-settings",title:"设置",titleEn:"Settings",path:"/finance/settings"}];function Nm(e){return e==="/finance"||e.startsWith("/finance/")}function Im(e){return!Nm(e)||e==="/finance/settings"||e.startsWith("/finance/settings/")?"":Ae(e,si)}function Dm(e){return e==="/finance/settings"||e.startsWith("/finance/settings/")?"/finance/settings":""}const nr=[{id:"mem-card-mgmt",title:"卡券管理",titleEn:"Cards & coupons",path:"/members/card/coupon-mgmt",activePrefix:"/members/card",sidebarChildren:[{title:"优惠券管理",titleEn:"Coupon management",path:"/members/card/coupon-mgmt"},{title:"付费会员明细",titleEn:"Paid member details",path:"/members/card/paid-detail"},{title:"付费会员配置",titleEn:"Paid member settings",path:"/members/card/paid-config"}]},{id:"mem-points",title:"积分配置",titleEn:"Points config",path:"/members/points"}],Am=[{id:"mem-settings",title:"设置",titleEn:"Settings",path:"/members/settings"}];function qm(e){return e==="/members/settings"||e.startsWith("/members/settings/")?"/members/settings":""}const nn=[{id:"sm-store-menu",title:"门店菜单",titleEn:"Store menu",path:"/menu/store-menu"},{id:"sm-store-products",title:"门店商品",titleEn:"Store products",path:"/menu/store-products"},{id:"sm-store-seasoning",title:"门店调味",titleEn:"Store seasoning",path:"/menu/store-seasoning"},{id:"sm-inventory-changes",title:"库存变更记录",titleEn:"Inventory changes",path:"/menu/inventory-changes"},{id:"sm-print-settings",title:"打印设置",titleEn:"Print settings",path:"/menu/print-settings"},{id:"sm-tax-types",title:"税种管理",titleEn:"Tax types",path:"/menu/tax-types/settings",activePrefix:"/menu/tax-types",sidebarChildren:[{title:"税种管理",titleEn:"Tax types",path:"/menu/tax-types/settings"},{title:"商品税管理",titleEn:"Product tax management",path:"/menu/tax-types/product-tax"}]},{id:"sm-recipe-list",title:"配方列表",titleEn:"Recipe list",path:"/menu/recipe-list",activePrefixes:["/menu/recipe-list","/menu/product-recipe"]}];function Ae(e,t){const r=t.flatMap(n=>Em(n).map(s=>({item:n,prefix:s}))).sort((n,s)=>s.prefix.length-n.prefix.length);for(const{item:n,prefix:s}of r)if(e===s||e.startsWith(`${s}/`))return n.path;return""}function ii(e){return e.children.map(t=>({id:t.id,title:t.title,titleEn:t.titleEn,path:t.path,chainOnly:t.chainOnly}))}function Lm(e,t){var s;return((s=t.matchPrefixes)!=null&&s.length?t.matchPrefixes:[t.path]).some(i=>e===i||e.startsWith(`${i}/`))?Ae(e,ii(t)):""}function Cm(e){return e.startsWith("/brand-products")?Ae(e,ti):""}function Mm(e){return e.startsWith("/brand-products")}function al(e){return e.startsWith("/brand-menu")?Ae(e,ri):""}function Rm(e){return e.startsWith("/marketing")?Ae(e,nl):""}function Om(e){return e.startsWith("/promotions")?Ae(e,sl):""}function Km(e){return e.startsWith("/members")?Ae(e,nr):""}function _o(e){return e.startsWith("/gift-cards")?Ae(e,ni):""}function Bm(e){return e.startsWith("/print-templates")?Ae(e,Lt):""}function sr(e){return e==="/operations/reservations"||e.startsWith("/operations/reservations/")}function Hm(e){return sr(e)?Ae(e,tn):""}function Fm(e){if(!sr(e))return null;const t=[...tn].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return{title:r.title,module:"预约等位中心 · Reservation & waitlist center"};return{title:"预约等位中心",module:"预约等位中心 · Reservation & waitlist center"}}function Gm(e){if(!e.startsWith("/print-templates"))return null;const t=[...Lt].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return{title:r.title,module:"打印中心 · Print center"};return{title:"打印中心",module:"打印中心 · Print center"}}function ir(e){return e==="/reports/capital"||e.startsWith("/reports/capital/")?!1:e==="/reports"||e.startsWith("/reports/")}function Um(e){return ir(e)?Ae(e,rn):""}function jm(e,t){var n;if(!((n=t.sidebarChildren)!=null&&n.length))return"";const r=[...t.sidebarChildren].sort((s,i)=>i.path.length-s.path.length);for(const s of r)if(e===s.path||e.startsWith(`${s.path}/`))return s.path;return""}function Vm(e,t){var n;if(t.id!=="mem-card-mgmt"||!((n=t.sidebarChildren)!=null&&n.length))return"";const r=[...t.sidebarChildren].sort((s,i)=>i.path.length-s.path.length);for(const s of r)if(e===s.path||e.startsWith(`${s.path}/`))return s.path;return""}function Wm(e){return e.startsWith("/brand-menu")}function ll(e){return e.startsWith("/menu")?Ae(e,nn):""}function Qm(e){return e.startsWith("/menu")}const dl=[{id:"mt-tax-settings",title:"税种管理",titleEn:"Tax type settings",path:"/menu/tax-types/settings"},{id:"mt-product-tax",title:"商品税管理",titleEn:"Product tax management",path:"/menu/tax-types/product-tax"}];function cl(e){const t=[...dl].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return r.path;return""}const oi=[{id:"bp-sm-seasoning",title:"调味",titleEn:"Seasoning",path:"/brand-products/seasoning-mgmt/seasoning"},{id:"bp-sm-distribution-log",title:"下发记录",titleEn:"Distribution log",path:"/brand-products/seasoning-mgmt/distribution-log"}];function zm(){var e;return((e=oi[0])==null?void 0:e.path)??"/brand-products/seasoning-mgmt/seasoning"}function ul(e){const t=[...oi].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return r.path;return""}const ai=[{id:"bp-tg-description",title:"描述标签",titleEn:"Description tags",path:"/brand-products/tags/description"},{id:"bp-tg-corner",title:"商品角标",titleEn:"Product corner badges",path:"/brand-products/tags/corner-badge"},{id:"bp-tg-stats",title:"统计标签",titleEn:"Statistics tags",path:"/brand-products/tags/stats"}];function Ym(){var e;return((e=ai[0])==null?void 0:e.path)??"/brand-products/tags/description"}function pl(e){const t=[...ai].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return r.path;return""}const li=[{id:"bp-rc-list",title:"配方列表",titleEn:"Recipe list",path:"/brand-products/recipes/list"},{id:"bp-rc-ingredients",title:"原料管理",titleEn:"Ingredients (recipes)",path:"/brand-products/recipes/ingredients"},{id:"bp-rc-records",title:"记录中心",titleEn:"Records center",path:"/brand-products/recipes/records"}];function Xm(){var e;return((e=li[0])==null?void 0:e.path)??"/brand-products/recipes/list"}function ml(e){const t=[...li].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return r.path;return""}const sn="/finance/register-audit/payments",Zm="/finance/register-audit/cash-drawer",Po="/finance/register-audit",di=[{seq:449,path:sn,title:"付款记录",titleEn:"Payment records",sceneDesc:"查看各收银终端（POS）的付款与退款流水，用于对账与稽核。与「收支流水」的全店资金视角不同，本条以收银机/班次为审计粒度。"},{seq:450,path:Zm,title:"钱箱登入退出记录",titleEn:"Cash drawer session log",sceneDesc:"查看收银员开启、关闭钱箱（登入/退出）的操作记录，用于现金内控审计。钱箱容差规则见设置 · 钱箱与现金平账。"}],gl=["张三","李四","王五"],Jm=["1号钱箱","2号钱箱","Bar"];let fl=[{id:"p1",payee:"张三",date:"2026-06-03",amount:128.5,operator:"李四",drawer:"1号钱箱",voided:!1}],bl=[{id:"d1",name:"张三",drawer:"1号钱箱",loginAmount:200,logoutAmount:null,from:"2026-06-03T09:00",to:null,amountMismatchRemark:null}];const se={dateFrom:new Date().toISOString().slice(0,10),dateTo:new Date().toISOString().slice(0,10),employee:"",showVoided:!1};function z(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Jn(e){return e.toFixed(2)}function hl(){return new Date().toISOString().slice(0,10)}function ci(e){return e===Po||e.startsWith(`${Po}/`)}function vl(e){if(!ci(e))return"";const t=[...di].sort((r,n)=>n.path.length-r.path.length);for(const r of t)if(e===r.path||e.startsWith(`${r.path}/`))return r.path;return sn}function eg(e){if(!ci(e))return null;const t=vl(e),r=di.find(n=>n.path===t);return{title:(r==null?void 0:r.title)??"收银记录与审计",module:"财务中心 · 收银记录与审计"}}function tg(){return fl.filter(e=>!(e.date<se.dateFrom||e.date>se.dateTo||se.employee&&e.payee!==se.employee||!se.showVoided&&e.voided))}function rg(){return bl.filter(e=>{const t=e.from.slice(0,10);return!(t<se.dateFrom||t>se.dateTo||se.employee&&e.name!==se.employee)})}function ng(e,t){return[`<option value="">${z(t?"根据支付员工筛选":"按收银员筛选")}</option>`,...gl.map(s=>`<option value="${z(s)}"${s===e?" selected":""}>${z(s)}</option>`)].join("")}function sg(e){return e.length?e.map(t=>`
    <tr class="border-b border-border/60 hover:bg-muted/30">
      <td class="px-4 py-2.5 text-sm">${z(t.payee)}</td>
      <td class="px-4 py-2.5 text-sm">${z(t.date)}</td>
      <td class="px-4 py-2.5 text-sm tabular-nums">${Jn(t.amount)}</td>
      <td class="px-4 py-2.5 text-sm">${z(t.operator)}</td>
      <td class="px-4 py-2.5 text-sm">${z(t.drawer)}</td>
      <td class="px-4 py-2.5 text-sm">${t.voided?"是":"—"}</td>
    </tr>`).join(""):'<tr><td colspan="6" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无记录，可点击右上角「+」新增</td></tr>'}function es(e,t){return t!=null&&Math.abs(e-t)>.001}function ig(e){return e.length?e.map(t=>`
    <tr class="border-b border-border/60 hover:bg-muted/30">
      <td class="px-4 py-2.5 text-sm">${z(t.name)}</td>
      <td class="px-4 py-2.5 text-sm">${z(t.drawer)}</td>
      <td class="px-4 py-2.5 text-sm tabular-nums">${Jn(t.loginAmount)}</td>
      <td class="px-4 py-2.5 text-sm tabular-nums">${t.logoutAmount==null?"—":Jn(t.logoutAmount)}</td>
      <td class="px-4 py-2.5 text-sm">${z(t.from.replace("T"," "))}</td>
      <td class="px-4 py-2.5 text-sm">${t.to?z(t.to.replace("T"," ")):"—"}</td>
      <td class="max-w-[12rem] truncate px-4 py-2.5 text-sm" title="${z(t.amountMismatchRemark??"")}">${t.amountMismatchRemark?z(t.amountMismatchRemark):"—"}</td>
    </tr>`).join(""):'<tr><td colspan="7" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无记录，可点击右上角「+」新增</td></tr>'}function No(e,t,r){return`
    <div
      id="finance-register-audit-add-dialog"
      class="fixed inset-0 z-[10040] hidden items-center justify-center overflow-y-auto p-4"
      data-register-audit-add-overlay
      aria-hidden="true"
      role="presentation"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-register-audit-add-backdrop aria-label="关闭"></button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="finance-register-audit-add-dialog-title"
        class="relative z-10 my-auto w-full max-w-md rounded-xl border border-border bg-card p-0 shadow-xl"
      >
        <form class="flex flex-col" data-register-audit-add-form="${r}">
          <div class="border-b border-border px-5 py-4">
            <h2 id="finance-register-audit-add-dialog-title" class="text-base font-semibold text-foreground">${z(e)}</h2>
          </div>
          <div class="space-y-3 px-5 py-4">${t}</div>
          <div class="flex justify-end gap-2 border-t border-border px-5 py-3">
            <button type="button" class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted" data-register-audit-add-cancel>取消</button>
            <button type="submit" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">保存</button>
          </div>
        </form>
      </div>
    </div>`}function og(e){const t=e===sn,r=Jm.map(s=>`<option value="${z(s)}">${z(s)}</option>`).join(""),n=gl.map(s=>`<option value="${z(s)}">${z(s)}</option>`).join("");return t?No("新增付款记录",`
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">收款人</span>
            <select name="payee" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">${n}</select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">日期</span>
            <input name="date" type="date" required value="${hl()}" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">金额</span>
            <input name="amount" type="number" step="0.01" min="0" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">操作人员</span>
            <select name="operator" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">${n}</select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">钱箱</span>
            <select name="drawer" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">${r}</select>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input name="voided" type="checkbox" class="size-4 rounded border-input" />
            <span>已作废</span>
          </label>`,"payments"):No("新增钱箱登入退出记录",`
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">姓名</span>
            <select name="name" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">${n}</select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">钱箱</span>
            <select name="drawer" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">${r}</select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">登入金额</span>
            <input name="loginAmount" type="number" step="0.01" min="0" required data-register-audit-login-amount class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">登出金额（可选）</span>
            <input name="logoutAmount" type="number" step="0.01" min="0" data-register-audit-logout-amount class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label class="hidden text-sm" data-register-audit-mismatch-remark-wrap>
            <span class="mb-1 block text-muted-foreground">登入登出金额不一致理由备注</span>
            <textarea
              name="amountMismatchRemark"
              rows="3"
              maxlength="200"
              placeholder="请说明登入与登出金额不一致的原因"
              data-register-audit-mismatch-remark
              class="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
            ></textarea>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">从</span>
            <input name="from" type="datetime-local" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">到（可选）</span>
            <input name="to" type="datetime-local" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>`,"cash-drawer")}function ag(){const e=document.getElementById("finance-register-audit-add-dialog");e&&(e.classList.remove("hidden"),e.classList.add("flex"),e.setAttribute("aria-hidden","false"))}function An(){const e=document.getElementById("finance-register-audit-add-dialog");e&&(e.classList.add("hidden"),e.classList.remove("flex"),e.setAttribute("aria-hidden","true"))}function lg(e){const t=vl(e),r=t===sn,n=di.map(l=>{const u=l.path===t;return`
      <a href="#${l.path}"
        role="tab"
        class="inline-flex min-h-10 items-center border-b-2 px-4 text-sm font-medium transition-colors ${u?"border-primary text-primary":"border-transparent text-muted-foreground hover:border-border hover:text-foreground"}"
        ${u?'aria-selected="true"':'aria-selected="false"'}
      >${z(l.title)}</a>`}).join(""),s=tg(),i=rg(),o=r?`<tr class="bg-primary text-primary-foreground">
        <th class="px-4 py-2.5 text-left text-sm font-medium">收款人</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">日期</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">金额</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">操作人员</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">钱箱</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">已作废</th>
      </tr>`:`<tr class="bg-primary text-primary-foreground">
        <th class="px-4 py-2.5 text-left text-sm font-medium">姓名</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">钱箱</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">登入金额</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">登出金额</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">从</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">到</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">不一致备注</th>
      </tr>`,a=r?sg(s):ig(i);return`
    <div class="finance-register-audit-page flex min-h-0 flex-1 flex-col gap-4" data-register-audit-page="${r?"payments":"cash-drawer"}">
      <div role="tablist" aria-label="收银记录与审计" class="flex shrink-0 border-b border-border">
        ${n}
      </div>

      <div class="flex shrink-0 flex-wrap items-end gap-3">
        <label class="text-sm">
          <span class="mb-1 block text-xs text-muted-foreground">从</span>
          <input type="date" data-register-audit-date-from value="${z(se.dateFrom)}" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        </label>
        <label class="text-sm">
          <span class="mb-1 block text-xs text-muted-foreground">到</span>
          <input type="date" data-register-audit-date-to value="${z(se.dateTo)}" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        </label>
        <label class="text-sm">
          <span class="mb-1 block text-xs text-transparent select-none">.</span>
          <select data-register-audit-employee class="h-9 min-w-[10rem] rounded-md border border-input bg-background px-3 text-sm">
            ${ng(se.employee,r)}
          </select>
        </label>
        ${r?`<label class="mb-1.5 flex items-center gap-2 text-sm">
            <input type="checkbox" data-register-audit-show-voided class="size-4 rounded border-input"${se.showVoided?" checked":""} />
            <span>显示已作废记录</span>
          </label>`:""}
        <div class="flex items-end gap-2">
          <button type="button" data-register-audit-query class="h-9 min-w-[7rem] rounded-md bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">查询</button>
          <button type="button" data-register-audit-add class="h-9 min-w-[7rem] rounded-md border border-foreground bg-background px-4 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">新增</button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
        <table class="w-full min-w-[640px] border-collapse">
          <thead class="sticky top-0 z-[1]">${o}</thead>
          <tbody>${a}</tbody>
        </table>
      </div>

      ${og(t)}
    </div>`}function dg(e){const t=e.querySelector("[data-register-audit-date-from]"),r=e.querySelector("[data-register-audit-date-to]"),n=e.querySelector("[data-register-audit-employee]"),s=e.querySelector("[data-register-audit-show-voided]");t!=null&&t.value&&(se.dateFrom=t.value),r!=null&&r.value&&(se.dateTo=r.value),n&&(se.employee=n.value),s&&(se.showVoided=s.checked)}function qn(e){const t=e.querySelector("[data-register-audit-login-amount]"),r=e.querySelector("[data-register-audit-logout-amount]"),n=e.querySelector("[data-register-audit-mismatch-remark-wrap]"),s=e.querySelector("[data-register-audit-mismatch-remark]");if(!t||!r||!n||!s)return;const i=Number(t.value),o=r.value.trim(),a=o===""?null:Number(o),l=a!=null&&Number.isFinite(i)&&es(i,a);n.classList.toggle("hidden",!l),s.required=l,l||(s.value="")}function cg(e){var n,s,i,o,a;const t=document.querySelector("[data-register-audit-page]");if(!t)return;(n=t.querySelector("[data-register-audit-query]"))==null||n.addEventListener("click",()=>{dg(t),e()}),(s=t.querySelector("[data-register-audit-add]"))==null||s.addEventListener("click",()=>{ag();const l=t.querySelector('[data-register-audit-add-form="cash-drawer"]');l&&qn(l)}),(i=t.querySelector("[data-register-audit-add-backdrop]"))==null||i.addEventListener("click",()=>{An()}),t.querySelectorAll("[data-register-audit-add-cancel]").forEach(l=>{l.addEventListener("click",()=>{An()})});const r=t.querySelector("[data-register-audit-add-form]");(o=r==null?void 0:r.querySelector("[data-register-audit-login-amount]"))==null||o.addEventListener("input",()=>{r&&qn(r)}),(a=r==null?void 0:r.querySelector("[data-register-audit-logout-amount]"))==null||a.addEventListener("input",()=>{r&&qn(r)}),r==null||r.addEventListener("submit",l=>{var T;l.preventDefault();const u=r.getAttribute("data-register-audit-add-form"),m=new FormData(r);if(u==="payments")fl.unshift({id:`p${Date.now()}`,payee:String(m.get("payee")??""),date:String(m.get("date")??hl()),amount:Number(m.get("amount")??0),operator:String(m.get("operator")??""),drawer:String(m.get("drawer")??""),voided:m.get("voided")==="on"});else{const k=m.get("logoutAmount"),S=m.get("to"),p=Number(m.get("loginAmount")??0),f=k?Number(k):null,E=String(m.get("amountMismatchRemark")??"").trim();if(es(p,f)&&!E){(T=r.querySelector("[data-register-audit-mismatch-remark]"))==null||T.focus();return}bl.unshift({id:`d${Date.now()}`,name:String(m.get("name")??""),drawer:String(m.get("drawer")??""),loginAmount:p,logoutAmount:f,from:String(m.get("from")??""),to:S?String(S):null,amountMismatchRemark:es(p,f)?E:null})}An(),e()})}const yl={"/asset-center/settings":{hubTitle:"素材中心",settingsPath:"/asset-center/settings",items:[{id:"s430-screen-terminal-assets-叫号屏图片",groupTitle:"屏显与终端素材",groupKey:"screen-terminal-assets",sceneDesc:"设置叫号屏显示的图片",moduleName:"叫号屏",feature:"（未填写）",title:"叫号屏图片",seq:430},{id:"s431-screen-terminal-assets-客显屏图片",groupTitle:"屏显与终端素材",groupKey:"screen-terminal-assets",sceneDesc:"设置客显屏显示的图片",moduleName:"双屏",feature:"（未填写）",title:"客显屏图片",seq:431},{id:"s432-cover-background-assets-公司封面图",groupTitle:"封面与背景素材",groupKey:"cover-background-assets",sceneDesc:"设置Pad显示的首页封面图",moduleName:"公司封面",feature:"（未填写）",title:"公司封面图",seq:432},{id:"s433-brand-identity-assets-餐厅LOGO",groupTitle:"品牌标识素材",groupKey:"brand-identity-assets",sceneDesc:"设置餐厅的LOGO",moduleName:"餐厅LOGO",feature:"（未填写）",title:"餐厅LOGO",seq:433},{id:"s434-brand-identity-assets-打印小票LOGO",groupTitle:"品牌标识素材",groupKey:"brand-identity-assets",sceneDesc:"设置打印小票上的打印LOGO",moduleName:"打印Logo",feature:"（未填写）",title:"打印小票LOGO",seq:434},{id:"s555-cover-background-assets-首页封面图",groupTitle:"封面与背景素材",groupKey:"cover-background-assets",sceneDesc:"设置首页展示的封面图",moduleName:"封面/背景图",feature:"（未填写）",title:"首页封面图",seq:555},{id:"s556-brand-identity-assets-未填写",groupTitle:"品牌标识素材",groupKey:"brand-identity-assets",sceneDesc:"设置首页展示的门店LOGO",moduleName:"LOGO",feature:"（未填写）",title:"（未填写）",seq:556}]},"/dashboard/settings":{hubTitle:"主页",settingsPath:"/dashboard/settings",items:[{id:"s531-home-entry-display-品牌作为首页",groupTitle:"主页入口与展示",groupKey:"home-entry-display",sceneDesc:"设置多品牌分类展示页面是否作为首页进行展示",moduleName:"展示设置",feature:"（未填写）",title:"品牌作为首页",seq:531},{id:"s551-idle-screensaver-屏保",groupTitle:"待机屏保",groupKey:"idle-screensaver",sceneDesc:"设置是否开启屏保功能及屏保切换的动化效果和切换时时间设置",moduleName:"屏保",feature:"（未填写）",title:"屏保",seq:551}]},"/device-management/settings":{hubTitle:"设置设备与License的绑定关系",settingsPath:"/device-management/settings",items:[{id:"s1-device-integration-basics-钱箱开关",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"控制钱箱的开启还是关闭，开启后，使用钱箱需要权限才能打开",moduleName:"钱箱管理",feature:"启用与受控开钱箱（需权限）",title:"钱箱开关",seq:1},{id:"s11-device-integration-basics-打印小票",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"控制终端/食客端，是否打印纸质的等位号码",moduleName:"等位",feature:"等位打印小票开关",title:"打印小票",seq:11},{id:"s15-device-integration-basics-Serial-Caller-ID-Modem-Settings",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"等位高级设置：Serial Caller ID Modem Settings（串行来电显示调制解调器设置）”，该功能涉及串口通信硬件参数配置（如波特率、端口等），用于等位/排队系统中通过电话线接收来电信号或呼叫器数据",moduleName:"高级设置",feature:"等位系统串行来电显示调制解调器设置",title:"Serial Caller ID Modem Settings",seq:15},{id:"s184-device-integration-basics-来电显示功能",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"设置POS上是否启用来电点单显示功能",moduleName:"来电显示",feature:"（未填写）",title:"来电显示功能",seq:184},{id:"s185-device-integration-basics-来电显示设备类型",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"设置来电显示的设备类型是哪种类型",moduleName:"来电显示",feature:"（未填写）",title:"来电显示设备类型",seq:185},{id:"s228-device-integration-basics-分隔符1-分隔符2",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"",moduleName:"奶茶机对接",feature:"（未填写）",title:"分隔符1，分隔符2",seq:228},{id:"s254-cash-payment-terminals-以下操作时自动开钱箱-刷卡",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"设置使用信用卡支付时是否自动打开钱箱",moduleName:"钱箱管理",feature:"（未填写）",title:"以下操作时自动开钱箱(刷卡)",seq:254},{id:"s255-cash-payment-terminals-当用现金付款时自动打开钱箱",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"设置使用现金支付时是否自动打开钱箱",moduleName:"钱箱管理",feature:"（未填写）",title:"当用现金付款时自动打开钱箱",seq:255},{id:"s352-printer-output-devices-打印机设置",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"配置打印机的名称、语言、打印机类型，IP地址等",moduleName:"打印机设置",feature:"（未填写）",title:"打印机设置",seq:352},{id:"s353-printer-output-devices-名称",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"名称",seq:353},{id:"s354-printer-output-devices-语言设置",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"语言设置",seq:354},{id:"s355-printer-output-devices-第二语言",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"第二语言",seq:355},{id:"s356-printer-output-devices-打印机类型",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"打印机类型",seq:356},{id:"s357-printer-output-devices-IP地址",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"IP地址",seq:357},{id:"s358-printer-output-devices-厨房名称",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"厨房名称",seq:358},{id:"s359-printer-output-devices-打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"打印机",seq:359},{id:"s360-printer-output-devices-打印机名称-第二语言",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"打印机名称(第二语言)",seq:360},{id:"s361-printer-output-devices-第三语言",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"第三语言",seq:361},{id:"s362-printer-output-devices-切纸打印",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"切纸打印",seq:362},{id:"s363-printer-output-devices-备用打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"",moduleName:"打印机设置",feature:"（未填写）",title:"备用打印机",seq:363},{id:"s364-cash-payment-terminals-钱箱设置",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"设置钱箱的名称、设备名称、设备类型、链接哪个打印机",moduleName:"钱箱设置",feature:"（未填写）",title:"钱箱设置",seq:364},{id:"s365-cash-payment-terminals-名称",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"钱箱设置",feature:"（未填写）",title:"名称",seq:365},{id:"s366-cash-payment-terminals-设备名称",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"钱箱设置",feature:"（未填写）",title:"设备名称",seq:366},{id:"s367-cash-payment-terminals-设备类型",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"钱箱设置",feature:"（未填写）",title:"设备类型",seq:367},{id:"s368-cash-payment-terminals-连接的打印机",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"钱箱设置",feature:"（未填写）",title:"连接的打印机",seq:368},{id:"s370-client-device-binding-客户端设置-终端设备绑定与参数配置",groupTitle:"终端设备绑定与区域",groupKey:"client-device-binding",sceneDesc:"设置终端设备的名称、打印机绑定、钱箱、磅秤等",moduleName:"客户端设置",feature:"（未填写）",title:"客户端设置（终端设备绑定与参数配置）",seq:370},{id:"s371-client-device-binding-名称",groupTitle:"终端设备绑定与区域",groupKey:"client-device-binding",sceneDesc:"设置终端设备的名称是什么",moduleName:"客户端设置",feature:"（未填写）",title:"名称",seq:371},{id:"s372-printer-output-devices-收据打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置终端设备的纸质订单收据的打印机绑定的是哪一个",moduleName:"客户端设置",feature:"（未填写）",title:"收据打印机",seq:372},{id:"s373-printer-output-devices-支付打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置终端设备的纸质签名支付收据的打印机绑定的是哪一个",moduleName:"客户端设置",feature:"（未填写）",title:"支付打印机",seq:373},{id:"s374-printer-output-devices-叫号打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置终端设备的叫号收据的打印机绑定的是哪一个",moduleName:"客户端设置",feature:"（未填写）",title:"叫号打印机",seq:374},{id:"s375-printer-output-devices-上菜打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置终端设备的上菜/传菜收据的打印机绑定的是哪一个",moduleName:"客户端设置",feature:"（未填写）",title:"上菜打印机",seq:375},{id:"s376-printer-output-devices-打包打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置终端设备的打包单收据的打印机绑定的是哪一个",moduleName:"客户端设置",feature:"（未填写）",title:"打包打印机",seq:376},{id:"s377-cash-payment-terminals-钱箱",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"设置终端设备的钱箱绑定的是哪一个",moduleName:"客户端设置",feature:"（未填写）",title:"钱箱",seq:377},{id:"s378-client-device-binding-启用来电显示",groupTitle:"终端设备绑定与区域",groupKey:"client-device-binding",sceneDesc:"设置终端设备是否开启来电显示功能",moduleName:"客户端设置",feature:"（未填写）",title:"启用来电显示",seq:378},{id:"s379-device-integration-basics-启用磅秤",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"设置终端设备是否启用磅秤",moduleName:"客户端设置",feature:"（未填写）",title:"启用磅秤",seq:379},{id:"s380-device-integration-basics-启用顾客显示屏",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"设置终端设备是否启用顾客显示屏",moduleName:"客户端设置",feature:"（未填写）",title:"启用顾客显示屏",seq:380},{id:"s381-device-integration-basics-顾客显示屏型号",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"设置终端设备顾客显示屏型号是哪一个",moduleName:"客户端设置",feature:"（未填写）",title:"顾客显示屏型号",seq:381},{id:"s382-device-integration-basics-设备管理器端口",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"设置终端设备管理器端口是多少",moduleName:"客户端设置",feature:"（未填写）",title:"设备管理器端口",seq:382},{id:"s383-device-integration-basics-支付终端",groupTitle:"设备接入与基础外设",groupKey:"device-integration-basics",sceneDesc:"设置终端设备绑定的支付设备是哪一个",moduleName:"客户端设置",feature:"（未填写）",title:"支付终端",seq:383},{id:"s384-client-device-binding-区域",groupTitle:"终端设备绑定与区域",groupKey:"client-device-binding",sceneDesc:"设置终端设备所在的位置在哪里",moduleName:"客户端设置",feature:"（未填写）",title:"区域",seq:384},{id:"s385-printer-output-devices-等位打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置终端设备的等位单号的打印机绑定的是哪一个",moduleName:"客户端设置",feature:"（未填写）",title:"等位打印机",seq:385},{id:"s386-printer-output-devices-全局收据打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置所有终端设备默认的纸质订单收据的打印机绑定的是哪一个",moduleName:"默认设备设置",feature:"（未填写）",title:"全局收据打印机",seq:386},{id:"s387-printer-output-devices-全局打包打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置所有终端设备默认的打包单收据的打印机绑定的是哪一个",moduleName:"默认设备设置",feature:"（未填写）",title:"全局打包打印机",seq:387},{id:"s388-printer-output-devices-全局打包打印机2",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置所有终端设备默认的打包单收据的打印机绑定的是哪一个",moduleName:"默认设备设置",feature:"（未填写）",title:"全局打包打印机2",seq:388},{id:"s389-printer-output-devices-全局上菜打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置所有终端设备默认的上菜/传菜收据的打印机绑定的是哪一个",moduleName:"默认设备设置",feature:"（未填写）",title:"全局上菜打印机",seq:389},{id:"s390-cash-payment-terminals-全局钱箱",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"设置所有终端设备默认的钱箱绑定的是哪一个",moduleName:"默认设备设置",feature:"（未填写）",title:"全局钱箱",seq:390},{id:"s391-printer-output-devices-全局报表打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置所有终端设备默认的报表打印机绑定的是哪一个",moduleName:"默认设备设置",feature:"（未填写）",title:"全局报表打印机",seq:391},{id:"s392-cash-payment-terminals-全局支付终端",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"设置所有终端设备默认的支付终端绑定的是哪一个",moduleName:"默认设备设置",feature:"（未填写）",title:"全局支付终端",seq:392},{id:"s393-printer-output-devices-全局等位打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置所有终端设备的等位单号的打印机绑定的是哪一个",moduleName:"默认设备设置",feature:"（未填写）",title:"全局等位打印机",seq:393},{id:"s394-printer-output-devices-全局自定义菜打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置所有终端设备的自定义输入的菜品的打印机绑定的是哪一个",moduleName:"默认设备设置",feature:"（未填写）",title:"全局自定义菜打印机",seq:394},{id:"s395-printer-output-devices-全局机器人通知打印机",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置所有终端设备的机器人通知的打印机绑定的是哪一个",moduleName:"默认设备设置",feature:"（未填写）",title:"全局机器人通知打印机",seq:395},{id:"s396-cash-payment-terminals-支付终端设置",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"支付终端相关的配置设置，比如设备名称、品牌、型号、IP地址等",moduleName:"支付终端",feature:"（未填写）",title:"支付终端设置",seq:396},{id:"s397-cash-payment-terminals-名称",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"支付终端",feature:"（未填写）",title:"名称",seq:397},{id:"s398-cash-payment-terminals-终端品牌",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"新建支付终端后，设置支付设备的品牌、型号、IP地址、端口号等",moduleName:"支付终端",feature:"（未填写）",title:"终端品牌",seq:398},{id:"s399-cash-payment-terminals-终端型号",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"支付终端",feature:"（未填写）",title:"终端型号",seq:399},{id:"s400-cash-payment-terminals-IP地址",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"支付终端",feature:"（未填写）",title:"IP地址",seq:400},{id:"s401-cash-payment-terminals-端口号",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"支付终端",feature:"（未填写）",title:"端口号",seq:401},{id:"s402-cash-payment-terminals-通讯方式",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"支付终端",feature:"（未填写）",title:"通讯方式",seq:402},{id:"s403-cash-payment-terminals-其他额外设置",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"支付终端",feature:"（未填写）",title:"其他额外设置",seq:403},{id:"s404-cash-payment-terminals-启用在PINPad上加小费",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"支付终端",feature:"（未填写）",title:"启用在PINPad上加小费",seq:404},{id:"s405-cash-payment-terminals-启用在PINPad上签名",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"",moduleName:"支付终端",feature:"（未填写）",title:"启用在PINPad上签名",seq:405},{id:"s406-fiscal-bluetooth-名称",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"新建税控机终端后，设置税控机设备名称、端口号等",moduleName:"税控机",feature:"（未填写）",title:"名称",seq:406},{id:"s407-fiscal-bluetooth-设备名称",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"",moduleName:"税控机",feature:"（未填写）",title:"设备名称",seq:407},{id:"s408-fiscal-bluetooth-连接类型",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"",moduleName:"税控机",feature:"（未填写）",title:"连接类型",seq:408},{id:"s409-fiscal-bluetooth-TP-S",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"",moduleName:"税控机",feature:"（未填写）",title:"TP S",seq:409},{id:"s410-fiscal-bluetooth-端口",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"",moduleName:"税控机",feature:"（未填写）",title:"端口",seq:410},{id:"s411-fiscal-bluetooth-连接的打印机",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"",moduleName:"税控机",feature:"（未填写）",title:"连接的打印机",seq:411},{id:"s412-fiscal-bluetooth-TVQ",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"",moduleName:"税控机",feature:"（未填写）",title:"TVQ",seq:412},{id:"s413-fiscal-bluetooth-快餐模式",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"",moduleName:"税控机",feature:"（未填写）",title:"快餐模式",seq:413},{id:"s414-fiscal-bluetooth-关闭交易时打印收据",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"",moduleName:"税控机",feature:"（未填写）",title:"关闭交易时打印收据",seq:414},{id:"s415-fiscal-bluetooth-运行模式",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"",moduleName:"税控机",feature:"（未填写）",title:"运行模式",seq:415},{id:"s416-fiscal-bluetooth-设备列表",groupTitle:"税控与蓝牙外设",groupKey:"fiscal-bluetooth",sceneDesc:"蓝牙支付设备列表及软硬件关联绑定信息",moduleName:"设备列表",feature:"（未填写）",title:"设备列表",seq:416},{id:"s498-printer-output-devices-打印纸质支付收据方式",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置订单完成后打印纸质支付收据的方式（自动/手动/不打印）",moduleName:"收据",feature:"（未填写）",title:"打印纸质支付收据方式",seq:498},{id:"s499-printer-output-devices-打印纸质订单收据方式",groupTitle:"打印机与输出设备",groupKey:"printer-output-devices",sceneDesc:"设置订单完成后打印纸质订单收据的方式（自动/手动/不打印）",moduleName:"收据",feature:"（未填写）",title:"打印纸质订单收据方式",seq:499},{id:"s550-client-device-binding-设备列表",groupTitle:"终端设备绑定与区域",groupKey:"client-device-binding",sceneDesc:"查看当前门店的Kiosk硬件的设备列表及设备的支付方式设置",moduleName:"设备管理",feature:"（未填写）",title:"设备列表",seq:550},{id:"s558-核心是-将特定终端设备与-绑定设置",groupTitle:"核心是“将特定终端设备与",groupKey:"核心是-将特定终端设备与",sceneDesc:"",moduleName:"设备管理",feature:"设备绑定License",title:"绑定设置",seq:558},{id:"s559-emenu-device-display-设备绑定桌子",groupTitle:"eMenu设备与展示模式",groupKey:"emenu-device-display",sceneDesc:"设置设备与桌子的绑定关系",moduleName:"设备管理",feature:"（未填写）",title:"设备绑定桌子",seq:559},{id:"s560-emenu-device-display-选择您想展示的菜单组",groupTitle:"eMenu设备与展示模式",groupKey:"emenu-device-display",sceneDesc:"设置哪个设备或者哪个桌子展示哪些菜单",moduleName:"菜单显示",feature:"（未填写）",title:"选择您想展示的菜单组",seq:560},{id:"s561-emenu-device-display-纯展示模式",groupTitle:"eMenu设备与展示模式",groupKey:"emenu-device-display",sceneDesc:"设置哪个设备或者哪个桌子菜单是否是纯展示不能操作添加购物车",moduleName:"菜单展示",feature:"（未填写）",title:"纯展示模式",seq:561},{id:"s562-emenu-device-display-eMenu-Pro模式",groupTitle:"eMenu设备与展示模式",groupKey:"emenu-device-display",sceneDesc:"设置哪个设备或者哪个桌子菜单展示形式（普通菜单 / 高级菜单设计稿）",moduleName:"菜单展示",feature:"（未填写）",title:"eMenu Pro模式",seq:562},{id:"s668-cash-payment-terminals-打印纸质订单收据方式",groupTitle:"钱箱与支付终端",groupKey:"cash-payment-terminals",sceneDesc:"控制手持POS终端打印纸质订单收据的出纸方式",moduleName:"Paypad设置",feature:"（未填写）",title:"打印纸质订单收据方式",seq:668}]},"/finance/settings":{hubTitle:"财务中心",settingsPath:"/finance/settings",groupOrder:["cash-drawer-reconciliation","daily-close-settlement","fees-tips-expense"],items:[{id:"s63-cash-drawer-reconciliation-现金底金金额",groupTitle:"钱箱与现金平账",groupKey:"cash-drawer-reconciliation",sceneDesc:"设置每班/每钱箱开班备用金；可选配置硬币卷明细（原 seq 64）辅助核算。",moduleName:"钱箱管理",feature:"（未填写）",title:"现金底金金额",seq:63},{id:"s65-daily-close-settlement-现金结算-平账-时显示现金销售总额",groupTitle:"日结与结算",groupKey:"daily-close-settlement",sceneDesc:"现金班结（提现/平账）界面是否向收银员展示系统推算的现金销售总额，辅助对数。须 171 开启；钱箱容差见 76/181。",moduleName:"钱箱管理",feature:"现金结算时显示现金销售总额",title:"现金结算(平账)时显示现金销售总额",seq:65},{id:"s76-cash-drawer-reconciliation-现金平账允许误差值",groupTitle:"钱箱与现金平账",groupKey:"cash-drawer-reconciliation",sceneDesc:"现金班结时允许的长短款容差；与 seq 181「超差提醒」联动。",moduleName:"系统安全",feature:"（未填写）",title:"现金平账允许误差值",seq:76},{id:"s171-daily-close-settlement-启用每日日结-现金班结-即每日结算",groupTitle:"日结与结算",groupKey:"daily-close-settlement",sceneDesc:"开启后，门店按营业日执行现金日结/班结流程；关闭则不走本组 65/330 现金班结配置。自动关账/Batch 时刻见支付中心 238，与本开关独立。",moduleName:"基本设置",feature:"（未填写）",title:"启用每日日结（现金班结：即每日结算）",seq:171},{id:"s181-cash-drawer-reconciliation-钱箱现金平账误差提醒",groupTitle:"钱箱与现金平账",groupKey:"cash-drawer-reconciliation",sceneDesc:"实点现金与系统应有金额之差超过 seq 76 设定容差时，是否在 POS 提醒。",moduleName:"现金平账",feature:"地址自动填充城市和邮编",title:"钱箱现金平账误差提醒",seq:181},{id:"s305-fees-tips-expense-现金付费折扣",groupTitle:"费用折扣与小费支出",groupKey:"fees-tips-expense",sceneDesc:"设置使用现金支付时，享受的折扣比率是多少",moduleName:"其他",feature:"（未填写）",title:"现金付费折扣(%)",seq:305},{id:"s307-fees-tips-expense-信用卡交易手续费比例",groupTitle:"费用折扣与小费支出",groupKey:"fees-tips-expense",sceneDesc:"用于报表与成本核算的收单通道费率（商户付给收单方）；不改变顾客结账应付。对客加价见支付中心「卡付加价策略」。",moduleName:"基本设置",feature:"（未填写）",title:"信用卡交易手续费比例(%)",seq:307},{id:"s330-daily-close-settlement-完成现金结算后自动打印现金备款-现金结算报表",groupTitle:"日结与结算",groupKey:"daily-close-settlement",sceneDesc:"现金班结完成后是否自动打印现金备款/现金结算报表。须 171 开启；Batch 完成后打印见支付中心 235。",moduleName:"现金备款/结算报表",feature:"（未填写）",title:"完成现金结算后自动打印现金备款/现金结算报表",seq:330},{id:"s451-fees-tips-expense-未填写",groupTitle:"费用折扣与小费支出",groupKey:"fees-tips-expense",sceneDesc:"查看收银机的小费支出记录",moduleName:"小费支出",feature:"收银机稽核 — 小费支出流水",title:"（未填写）",seq:451}]},"/gift-cards/settings":{hubTitle:"礼品卡中心",settingsPath:"/gift-cards/settings",items:[{id:"s16-giftcard-rules-金额设置",groupTitle:"礼品卡规则与参数",groupKey:"giftcard-rules",sceneDesc:"设置实体礼品卡金额的预设充值选项",moduleName:"礼品卡设置",feature:"礼品卡预设充值面额",title:"金额设置",seq:16},{id:"s17-giftcard-rules-销售价格",groupTitle:"礼品卡规则与参数",groupKey:"giftcard-rules",sceneDesc:"设置实体礼品卡金额的预设售卖时的选项",moduleName:"礼品卡设置",feature:"礼品卡销售价格（定价策略）",title:"销售价格",seq:17},{id:"s18-giftcard-rules-有效期",groupTitle:"礼品卡规则与参数",groupKey:"giftcard-rules",sceneDesc:"设置实体礼品卡的有效期",moduleName:"礼品卡设置",feature:"礼品卡有效期设置",title:"有效期",seq:18},{id:"s19-giftcard-rules-查询方式",groupTitle:"礼品卡规则与参数",groupKey:"giftcard-rules",sceneDesc:"搜索礼品卡按照卡号进行查询，是模糊搜索、还是准确匹配搜索",moduleName:"礼品卡设置",feature:"礼品卡卡号查询方式（模糊/精确）",title:"查询方式",seq:19},{id:"s478-giftcard-channels-E-Card礼品卡",groupTitle:"电子礼品卡渠道",groupKey:"giftcard-channels",sceneDesc:"",moduleName:"E-Card礼品卡",feature:"（未填写）",title:"E-Card礼品卡",seq:478}]},"/members/settings":{hubTitle:"会员中心",settingsPath:"/members/settings",items:[{id:"s86-member-account-system-云端会员系统模式",groupTitle:"会员账户与卡体系",groupKey:"member-account-system",sceneDesc:"控制是否使用云端会员还是本地会员",moduleName:"基础设置",feature:"（未填写）",title:"云端会员系统模式",seq:86},{id:"s87-member-account-system-会员卡使用模式",groupTitle:"会员账户与卡体系",groupKey:"member-account-system",sceneDesc:"设置会员卡只能使用积分，还是只能使用余额，还是有食客自己选择是使用积分还是使用余额",moduleName:"基础设置",feature:"（未填写）",title:"会员卡使用模式",seq:87},{id:"s88-member-account-system-会员卡有效时长-年-月-日",groupTitle:"会员账户与卡体系",groupKey:"member-account-system",sceneDesc:"会员卡有效期",moduleName:"基础设置",feature:"（未填写）",title:"会员卡有效时长(年,月,日)",seq:88},{id:"s89-member-account-system-会员卡号查询方式",groupTitle:"会员账户与卡体系",groupKey:"member-account-system",sceneDesc:"查询会员卡号是模糊搜索还是准确搜索",moduleName:"基础设置",feature:"（未填写）",title:"会员卡号查询方式",seq:89}]},"/notifications/settings":{hubTitle:"消息中心",settingsPath:"/notifications/settings",items:[{id:"s331-notification-basics-消息中心的主题",groupTitle:"通知基础与渠道",groupKey:"notification-basics",sceneDesc:"多选启用哪些消息主题的通知提醒：Announcement、Online Order、Reservation、Alipay/Wechat Pay、Service Request、Cravee Order、Kiosk、Emenu、Self Dine In、Printer、Expiration Management、System。",moduleName:"消息中心",feature:"（未填写）",title:"消息中心的主题",seq:331},{id:"s332-notification-basics-语音提醒",groupTitle:"通知基础与渠道",groupKey:"notification-basics",sceneDesc:"多选适用产线：Kiosk、eMenu、POS、POS GO、PayPad、SDI、Online Order；勾选后该产线新订单等进行语音播报提醒。",moduleName:"消息中心",feature:"（未填写）",title:"语音提醒",seq:332},{id:"s333-service-call-alerts-用餐者请求服务的类型",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"",moduleName:"消息中心",feature:"（未填写）",title:"用餐者请求服务的类型",seq:333},{id:"s334-order-pickup-messages-点单完成发送短信渠道",groupTitle:"订单与取餐通知",groupKey:"order-pickup-messages",sceneDesc:"设置哪些渠道订单完成需要发送订单短信小票",moduleName:"消息中心",feature:"（未填写）",title:"点单完成发送短信渠道",seq:334},{id:"s335-order-pickup-messages-顾客取餐发送短信渠道",groupTitle:"订单与取餐通知",groupKey:"order-pickup-messages",sceneDesc:"设置哪些渠道订单完成可以发送取餐短信通知",moduleName:"消息中心",feature:"（未填写）",title:"顾客取餐发送短信渠道",seq:335},{id:"s336-order-pickup-messages-下单短信通知-ASAP-非配送",groupTitle:"订单与取餐通知",groupKey:"order-pickup-messages",sceneDesc:"设置下单短信通知(ASAP)的内容",moduleName:"消息中心",feature:"（未填写）",title:"下单短信通知(ASAP)-非配送",seq:336},{id:"s337-order-pickup-messages-下单短信通知-预点单-非配送",groupTitle:"订单与取餐通知",groupKey:"order-pickup-messages",sceneDesc:"设置下单短信通知(预点单)的内容",moduleName:"消息中心",feature:"（未填写）",title:"下单短信通知(预点单)-非配送",seq:337},{id:"s338-order-pickup-messages-取餐通知-出餐时提醒",groupTitle:"订单与取餐通知",groupKey:"order-pickup-messages",sceneDesc:"设置取餐短信通知的内容",moduleName:"消息中心",feature:"（未填写）",title:"取餐通知--出餐时提醒",seq:338},{id:"s339-order-pickup-messages-下单短信通知-ASAP-配送",groupTitle:"订单与取餐通知",groupKey:"order-pickup-messages",sceneDesc:"设置下单短信通知(ASAP)的内容",moduleName:"消息中心",feature:"（未填写）",title:"下单短信通知(ASAP)-配送",seq:339},{id:"s340-order-pickup-messages-下单短信通知-预点单-配送",groupTitle:"订单与取餐通知",groupKey:"order-pickup-messages",sceneDesc:"设置下单短信通知(预点单)的内容",moduleName:"消息中心",feature:"（未填写）",title:"下单短信通知(预点单)-配送",seq:340},{id:"s629-service-call-alerts-呼叫服务员",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置是否开启呼叫服务员功能",moduleName:"消息通知",feature:"（未填写）",title:"呼叫服务员",seq:629},{id:"s630-service-call-alerts-呼叫服务员结账",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置是否开启呼叫服务员结账功能",moduleName:"消息通知",feature:"（未填写）",title:"呼叫服务员结账",seq:630},{id:"s631-service-call-alerts-呼叫服务员加水",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置是否开启呼叫服务员加水功能",moduleName:"消息通知",feature:"（未填写）",title:"呼叫服务员加水",seq:631},{id:"s632-service-call-alerts-呼叫服务员加餐具",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置是否开启呼叫服务员加餐具功能",moduleName:"消息通知",feature:"（未填写）",title:"呼叫服务员加餐具",seq:632},{id:"s633-service-call-alerts-呼叫服务员送纸巾",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置是否开启呼叫服务员送纸巾功能",moduleName:"消息通知",feature:"（未填写）",title:"呼叫服务员送纸巾",seq:633},{id:"s634-service-call-alerts-呼叫服务员加汤",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置是否开启呼叫服务员加汤功能",moduleName:"消息通知",feature:"（未填写）",title:"呼叫服务员加汤",seq:634},{id:"s635-service-call-alerts-呼叫服务员换烤盘",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置是否开启呼叫服务员换烤盘功能",moduleName:"消息通知",feature:"（未填写）",title:"呼叫服务员换烤盘",seq:635},{id:"s636-service-call-alerts-呼叫服务员点酒水",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置是否开启呼叫服务员点酒水功能",moduleName:"消息通知",feature:"（未填写）",title:"呼叫服务员点酒水",seq:636},{id:"s637-service-call-alerts-自定义菜单下单消息通知",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置是否开启指定菜品下单消息通知",moduleName:"消息通知",feature:"（未填写）",title:"自定义菜单下单消息通知",seq:637},{id:"s638-order-pickup-messages-新订单消息通知",groupTitle:"订单与取餐通知",groupKey:"order-pickup-messages",sceneDesc:"设置是否开启新订单消息通知（eMenu→POS）",moduleName:"消息通知",feature:"（未填写）",title:"新订单消息通知",seq:638},{id:"s639-order-pickup-messages-订单追加消息通知",groupTitle:"订单与取餐通知",groupKey:"order-pickup-messages",sceneDesc:"设置是否开启订单追加消息通知（eMenu→POS）",moduleName:"消息通知",feature:"（未填写）",title:"订单追加消息通知",seq:639},{id:"s640-service-call-alerts-呼叫服务员时间间隔",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置呼叫服务员时间间隔（限制重复呼叫）",moduleName:"消息通知",feature:"（未填写）",title:"呼叫服务员时间间隔",seq:640},{id:"s641-service-call-alerts-未开单可呼叫服务员",groupTitle:"呼叫服务员与现场提醒",groupKey:"service-call-alerts",sceneDesc:"设置未开单是否可呼叫服务员",moduleName:"消息通知",feature:"（未填写）",title:"未开单可呼叫服务员",seq:641}]},"/operations/inventory-ordering/settings":{hubTitle:"供应链中心",settingsPath:"/operations/inventory-ordering/settings",items:[{id:"s20-inventory-control-rules-库存清点增量调整原因",groupTitle:"库存管控规则",groupKey:"inventory-control-rules",sceneDesc:"用于盘点后正向库存调整的原因枚举",moduleName:"库存设置",feature:"库存清点增量调整原因",title:"库存清点增量调整原因",seq:20},{id:"s21-inventory-control-rules-库存清点减量调整原因",groupTitle:"库存管控规则",groupKey:"inventory-control-rules",sceneDesc:"库存清点减量调整原因",moduleName:"库存设置",feature:"库存清点减量调整原因",title:"库存清点减量调整原因",seq:21},{id:"s22-inventory-control-rules-当库存不足时允许保存单",groupTitle:"库存管控规则",groupKey:"inventory-control-rules",sceneDesc:"控制库存不足时是否允许保存订单",moduleName:"库存设置",feature:"当库存不足时允许保存单",title:"当库存不足时允许保存单",seq:22},{id:"s23-procurement-supplier-自动生成购货单-默认供应商",groupTitle:"采购与供应商",groupKey:"procurement-supplier",sceneDesc:"在自动补货生成购货单时，为未绑定主供应商的物料配置默认回退供应商",moduleName:"库存设置",feature:"自动生成购货单默认供应商",title:"自动生成购货单:默认供应商",seq:23},{id:"s24-procurement-supplier-自动发送购货单-邮箱地址",groupTitle:"采购与供应商",groupKey:"procurement-supplier",sceneDesc:"用于配置自动发送购货单时使用的邮箱地址",moduleName:"库存设置",feature:"自动发送购货单的邮箱地址",title:"自动发送购货单:邮箱地址",seq:24},{id:"s25-procurement-supplier-自动发送购货单-邮件主题",groupTitle:"采购与供应商",groupKey:"procurement-supplier",sceneDesc:"配置自动发送购货单的邮件主题",moduleName:"库存设置",feature:"自动发送购货单的邮件主题",title:"自动发送购货单:邮件主题",seq:25},{id:"s26-procurement-supplier-自动生成和发送购货单-开始时间",groupTitle:"采购与供应商",groupKey:"procurement-supplier",sceneDesc:"计划开始时间是周期性自动生成和发送购货单的触发时刻参数",moduleName:"库存设置",feature:"自动生成和发送购货单的开始时间",title:"自动生成和发送购货单:开始时间",seq:26},{id:"s27-procurement-supplier-购货单自动入库",groupTitle:"采购与供应商",groupKey:"procurement-supplier",sceneDesc:"自动入库是采购自动化流程的一环",moduleName:"库存设置",feature:"购货单自动入库",title:"购货单自动入库",seq:27},{id:"s28-procurement-supplier-显示预估剩余数量",groupTitle:"采购与供应商",groupKey:"procurement-supplier",sceneDesc:"在点单/菜单侧展示基于库存与消耗模型的预估剩余可售数量",moduleName:"库存设置",feature:"显示预估剩余数量",title:"显示预估剩余数量",seq:28},{id:"s179-inventory-control-rules-在库存管理里自动显示低库存菜",groupTitle:"库存管控规则",groupKey:"inventory-control-rules",sceneDesc:"设置是否在库存管理里自动显示低库存菜",moduleName:"单菜设置",feature:"（未填写）",title:"在库存管理里自动显示低库存菜",seq:179},{id:"s224-integration-expiry-Marketman-API-Key",groupTitle:"系统对接与效期管理",groupKey:"integration-expiry",sceneDesc:"",moduleName:"Marketman",feature:"（未填写）",title:"Marketman API Key",seq:224},{id:"s225-integration-expiry-Marketman-API-Password",groupTitle:"系统对接与效期管理",groupKey:"integration-expiry",sceneDesc:"",moduleName:"Marketman",feature:"（未填写）",title:"Marketman API Password",seq:225},{id:"s226-integration-expiry-Marketman-Upload-Price",groupTitle:"系统对接与效期管理",groupKey:"integration-expiry",sceneDesc:"",moduleName:"Marketman",feature:"（未填写）",title:"Marketman Upload Price",seq:226},{id:"s227-integration-expiry-Marketman-Upload-Order-Date",groupTitle:"系统对接与效期管理",groupKey:"integration-expiry",sceneDesc:"",moduleName:"Marketman",feature:"（未填写）",title:"Marketman Upload Order Date",seq:227},{id:"s468-master-data-locations-库存货品-物品主数据",groupTitle:"库存主数据与库位",groupKey:"master-data-locations",sceneDesc:"名称、库存类别、菜谱单位、购买单位等",moduleName:"（未填写）",feature:"（未填写）",title:"库存货品（物品主数据）",seq:468},{id:"s469-master-data-locations-库存货品类别",groupTitle:"库存主数据与库位",groupKey:"master-data-locations",sceneDesc:"库存货品类别的新建维护",moduleName:"（未填写）",feature:"（未填写）",title:"库存货品类别",seq:469},{id:"s470-未填写-库存供应商",groupTitle:"（未填写）",groupKey:"未填写",sceneDesc:"供应商的名称、电话",moduleName:"（未填写）",feature:"（未填写）",title:"库存供应商",seq:470},{id:"s471-master-data-locations-库房地点",groupTitle:"库存主数据与库位",groupKey:"master-data-locations",sceneDesc:"库房的名称、地址、联系人、电话、城市、邮编等信息",moduleName:"（未填写）",feature:"（未填写）",title:"库房地点",seq:471},{id:"s472-stocktaking-operations-库存清点",groupTitle:"盘点与运营视图",groupKey:"stocktaking-operations",sceneDesc:"名称、成本价、低库存提示阈值、库存总值等",moduleName:"（未填写）",feature:"（未填写）",title:"库存清点",seq:472},{id:"s473-stocktaking-operations-库存概况",groupTitle:"盘点与运营视图",groupKey:"stocktaking-operations",sceneDesc:"名称、类型、初始库存数、估计使用量、估计库存剩余数等",moduleName:"（未填写）",feature:"（未填写）",title:"库存概况",seq:473},{id:"s474-未填写-采购订单",groupTitle:"（未填写）",groupKey:"未填写",sceneDesc:"总价、价格、备注、订单状态、供应商名等",moduleName:"（未填写）",feature:"（未填写）",title:"采购订单",seq:474},{id:"s475-stocktaking-operations-采购物品入库",groupTitle:"盘点与运营视图",groupKey:"stocktaking-operations",sceneDesc:"名称、收到数量、单价、库存剩余数量",moduleName:"（未填写）",feature:"（未填写）",title:"采购物品入库",seq:475},{id:"s477-integration-expiry-未填写",groupTitle:"系统对接与效期管理",groupKey:"integration-expiry",sceneDesc:"商品的有效期管理",moduleName:"效期管理",feature:"（未填写）",title:"（未填写）",seq:477}]},"/operations/kitchen-kds/settings":{hubTitle:"后厨管理中心",settingsPath:"/operations/kitchen-kds/settings",groupOrder:["send-routing","ticket-grouping","line-merge-rules","ticket-fields","ticket-format","packing-slip"],items:[{id:"s32-send-routing-价格为0的菜单独打印",groupTitle:"送厨触发与路由",groupKey:"send-routing",sceneDesc:"控制一个订单中多个商品，价格为0的菜是否单独打印出一个小票",moduleName:"打印设置",feature:"价格为0的菜单独打印",title:"价格为0的菜单独打印",seq:32},{id:"s33-ticket-format-菜品之间打印分割线",groupTitle:"厨房单·版式格式",groupKey:"ticket-format",sceneDesc:"控制一个订单中多个商品，每个商品之间是否打印分割线",moduleName:"打印设置",feature:"菜品之间打印分割线",title:"菜品之间打印分割线",seq:33},{id:"s35-ticket-fields-厨房单-打印送厨的次数",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制一个订单，每次打印是否展示送厨的次数",moduleName:"打印设置",feature:"厨房单打印送厨次数",title:"厨房单:打印送厨的次数",seq:35},{id:"s36-send-routing-不需要厨房单的单类",groupTitle:"送厨触发与路由",groupKey:"send-routing",sceneDesc:"控制哪些订单类型的商品订单，不要送厨",moduleName:"打印设置",feature:"不需要厨房单的订单类型",title:"不需要厨房单的单类",seq:36},{id:"s37-send-routing-打印发送到其他打印机的菜",groupTitle:"送厨触发与路由",groupKey:"send-routing",sceneDesc:"配置满足条件的菜品，送厨时打印到其他厨房打印机",moduleName:"打印设置",feature:"打印发送到其他打印机的菜",title:"打印发送到其他打印机的菜",seq:37},{id:"s38-ticket-format-厨房单-备注增强显示-黑底白字",groupTitle:"厨房单·版式格式",groupKey:"ticket-format",sceneDesc:"控制一个订单的备注是否要重点强调突出显示",moduleName:"打印设置",feature:"厨房单备注增强显示（黑底白字）",title:"厨房单:备注增强显示(黑底白字)",seq:38},{id:"s39-packing-slip-需要打包单的订单类型",groupTitle:"打包单",groupKey:"packing-slip",sceneDesc:"控制哪些订单类型的订单需要打印打包单（与「不需要厨房单的单类」独立，仅作用于打包条）",moduleName:"打包单设置",feature:"需要打包单的订单类型",title:"需要打包单的订单类型",seq:39},{id:"s40-ticket-grouping-按座位分菜",groupTitle:"厨房单·分组与拆单",groupKey:"ticket-grouping",sceneDesc:"控制厨房单一个订单上多个商品，是否按照每个商品所对应的桌子进行归类展示",moduleName:"厨房单排版",feature:"按座位分菜",title:"按座位分菜",seq:40},{id:"s41-ticket-format-标记非零价格的菜",groupTitle:"厨房单·版式格式",groupKey:"ticket-format",sceneDesc:"控制厨房单是否将价格不为0的商品进行特殊标记，重点突出",moduleName:"厨房单排版",feature:"标记非零价格的菜",title:"标记非零价格的菜",seq:41},{id:"s42-ticket-fields-打印套餐数量",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制厨房单是否打印展示套餐的数量",moduleName:"厨房单排版",feature:"打印套餐数量",title:"打印套餐数量",seq:42},{id:"s43-ticket-format-打印边距",groupTitle:"厨房单·版式格式",groupKey:"ticket-format",sceneDesc:"设置厨房单的打印边距的大小",moduleName:"厨房单排版",feature:"厨房单打印边距大小",title:"打印边距",seq:43},{id:"s44-ticket-format-打印边距范围",groupTitle:"厨房单·版式格式",groupKey:"ticket-format",sceneDesc:"设置厨房单的打印边距是顶部和底部同时生效，还是仅顶部生效，还是仅底部生效",moduleName:"厨房单排版",feature:"厨房单打印边距范围（顶/底/同时）",title:"打印边距范围",seq:44},{id:"s45-ticket-fields-打印调味价格",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制厨房单是否展示调味商品的价格",moduleName:"厨房单排版",feature:"打印调味价格",title:"打印调味价格",seq:45},{id:"s46-ticket-fields-打印菜单价",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制厨房单是否展示普通商品的价格",moduleName:"厨房单排版",feature:"打印菜单价",title:"打印菜单价",seq:46},{id:"s47-ticket-grouping-根据菜序分菜打印",groupTitle:"厨房单·分组与拆单",groupKey:"ticket-grouping",sceneDesc:"控制厨房单是否按照相同菜品序号统一一起打印，不分菜序，分开打印",moduleName:"厨房单排版",feature:"根据菜序分菜打印",title:"根据菜序分菜打印",seq:47},{id:"s48-ticket-fields-打印单菜序号",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制厨房单是否打印单个商品的商品序号ID",moduleName:"厨房单排版",feature:"（未填写）",title:"打印单菜序号",seq:48},{id:"s49-ticket-fields-打印顾客姓名",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制厨房单是否打印食客姓名",moduleName:"厨房单排版",feature:"（未填写）",title:"打印顾客姓名",seq:49},{id:"s50-ticket-fields-打印订单时间",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制厨房单是否打印订单下单时间",moduleName:"厨房单排版",feature:"（未填写）",title:"打印订单时间",seq:50},{id:"s51-ticket-grouping-普通菜-套餐主菜-不同语言分开显示",groupTitle:"厨房单·分组与拆单",groupKey:"ticket-grouping",sceneDesc:"控制厨房单商品不同语言是否分开显示",moduleName:"厨房单排版",feature:"（未填写）",title:"普通菜/套餐主菜,不同语言分开显示",seq:51},{id:"s52-line-merge-rules-合并相同菜",groupTitle:"行级合并规则",groupKey:"line-merge-rules",sceneDesc:"控制厨房单相同商品是否合并展示为一个名称，相同名称展示商品总数",moduleName:"厨房单排版",feature:"（未填写）",title:"合并相同菜",seq:52},{id:"s53-line-merge-rules-合并相同子菜",groupTitle:"行级合并规则",groupKey:"line-merge-rules",sceneDesc:"控制厨房单相同商品是否合并展示为一个名称，相同名称展示商品总数",moduleName:"厨房单排版",feature:"（未填写）",title:"合并相同子菜",seq:53},{id:"s54-ticket-grouping-KDS分离相同菜",groupTitle:"厨房单·分组与拆单",groupKey:"ticket-grouping",sceneDesc:"控制厨房单相同商品是否分开多行展示",moduleName:"厨房单排版",feature:"KDS分离相同菜（多行展示）",title:"KDS分离相同菜",seq:54},{id:"s55-ticket-fields-打印菜品总数",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制厨房单是否展示订单中商品的总数量",moduleName:"厨房单排版",feature:"打印菜品总数",title:"打印菜品总数",seq:55},{id:"s56-ticket-fields-打印订单金额",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制厨房单是否展示订单总金额",moduleName:"厨房单排版",feature:"打印订单金额",title:"打印订单金额",seq:56},{id:"s57-ticket-fields-打印电话",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制厨房单是否展示食客的电话",moduleName:"厨房单排版",feature:"（未填写）",title:"打印电话",seq:57},{id:"s58-ticket-fields-打印地址",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"控制厨房单是否展示食客的地址",moduleName:"厨房单排版",feature:"（未填写）",title:"打印地址",seq:58},{id:"s59-ticket-format-数量后打印x",groupTitle:"厨房单·版式格式",groupKey:"ticket-format",sceneDesc:"数量后打印x：控制厨房单数量显示格式，如数量后是否附加打印字符‘x’",moduleName:"厨房单排版",feature:"数量后打印x",title:"数量后打印x",seq:59},{id:"s60-ticket-format-切纸打印时打印序号N-M",groupTitle:"厨房单·版式格式",groupKey:"ticket-format",sceneDesc:"切纸打印时打印序号N/M：控制厨房单在切纸/分段打印时是否打印当前段序号和总段数（如第N段/共M段）",moduleName:"厨房单排版",feature:"切纸打印时打印序号N/M",title:"切纸打印时打印序号N/M",seq:60},{id:"s61-ticket-grouping-子菜-调味分开打印",groupTitle:"厨房单·分组与拆单",groupKey:"ticket-grouping",sceneDesc:"控制厨房单中商品子菜和调味是否分开打印",moduleName:"厨房单排版",feature:"子菜/调味分开打印",title:"子菜/调味分开打印",seq:61},{id:"s62-send-routing-未付单直接送厨",groupTitle:"送厨触发与路由",groupKey:"send-routing",sceneDesc:"控制未付款的订单是否下单后直接送厨",moduleName:"其他",feature:"未付单直接送厨",title:"未付单直接送厨",seq:62},{id:"s258-ticket-format-外带订单-厨房单-收据单-增强显示-黑底白字",groupTitle:"厨房单·版式格式",groupKey:"ticket-format",sceneDesc:"设置外带订单(厨房单/收据单):是否增强突出显示",moduleName:"基本设置",feature:"（未填写）",title:"外带订单(厨房单/收据单):增强显示(黑底白字)",seq:258},{id:"s271-ticket-fields-打印菜品编号在-打包单-订单收据-厨房单",groupTitle:"厨房单·票面信息",groupKey:"ticket-fields",sceneDesc:"设置打包单/订单收据/厨房单是否打印菜品编号",moduleName:"打印设置",feature:"打印菜品编号（按票种）",title:"打印菜品编号在:打包单/订单收据/厨房单",seq:271},{id:"s287-line-merge-rules-收据-合并相同子菜",groupTitle:"行级合并规则",groupKey:"line-merge-rules",sceneDesc:"设置是否合并相同子菜",moduleName:"收据排版",feature:"（未填写）",title:"收据:合并相同子菜",seq:287},{id:"s288-line-merge-rules-收据-合并相同菜",groupTitle:"行级合并规则",groupKey:"line-merge-rules",sceneDesc:"设置是否合并相同菜",moduleName:"收据排版",feature:"（未填写）",title:"收据:合并相同菜",seq:288},{id:"s298-packing-slip-打包单-显示价格为0的调味",groupTitle:"打包单",groupKey:"packing-slip",sceneDesc:"设置打包单是否显示价格为0的调味",moduleName:"打包单设置",feature:"（未填写）",title:"打包单:显示价格为0的调味",seq:298},{id:"s299-packing-slip-打包单-只再次打印修改过的菜",groupTitle:"打包单",groupKey:"packing-slip",sceneDesc:"设置打包单是否只再次打印修改过的菜",moduleName:"打包单设置",feature:"（未填写）",title:"打包单:只再次打印修改过的菜",seq:299},{id:"s300-packing-slip-打包单-根据座位-分割线分开打印",groupTitle:"打包单",groupKey:"packing-slip",sceneDesc:"设置打包单是否根据座位/分割线分开打印",moduleName:"打包单设置",feature:"（未填写）",title:"打包单:根据座位/分割线分开打印",seq:300},{id:"s301-line-merge-rules-打包单-合并相同菜",groupTitle:"行级合并规则",groupKey:"line-merge-rules",sceneDesc:"设置打包单是否合并相同菜",moduleName:"打包单设置",feature:"（未填写）",title:"打包单:合并相同菜",seq:301},{id:"s302-line-merge-rules-打包单-合并相同子菜",groupTitle:"行级合并规则",groupKey:"line-merge-rules",sceneDesc:"设置打包单是否合并相同子菜",moduleName:"打包单设置",feature:"（未填写）",title:"打包单:合并相同子菜",seq:302},{id:"s304-send-routing-第一次送厨打印整张单",groupTitle:"送厨触发与路由",groupKey:"send-routing",sceneDesc:"设置订单首次送厨时，是否打印整张订单",moduleName:"上菜单设置",feature:"（未填写）",title:"第一次送厨打印整张单",seq:304}]},"/operations/queue-call/settings":{hubTitle:"前厅管理中心",settingsPath:"/operations/queue-call/settings",groupOrder:["tables-floor","pos-order-init","pos-kitchen-send","pos-button-visibility","pos-order-toolbar","pos-order-cart","pos-find-order-list","pos-checkout-entry","pos-menu-ui","guest-menu-structure","guest-menu-scenarios","guest-menu-global","guest-menu-cart","guest-facing-locale","guest-order-rules","guest-notes-fees","wait-time","cds"],items:[{id:"s10-cds-加入会员",groupTitle:"客显屏",groupKey:"cds",sceneDesc:"控制终端/食客端，是否展示加入会员按钮入口",moduleName:"客显屏",feature:"客显屏是否展示加入会员按钮",title:"加入会员",seq:10},{id:"s91-guest-order-rules-自助点餐不直接送厨-转-扫码点餐是否直接送厨",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"",moduleName:"基础设置",feature:"自助点餐/扫码点餐是否直接送厨",title:"自助点餐不直接送厨（转：扫码点餐是否直接送厨）",seq:91},{id:"s94-guest-order-rules-收据小票上打印确认签名栏",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"网上点餐订单的收据是否打印确认签名栏；属 C 端渠道规则，配置入口在前厅 · 食客端下单与规则。",moduleName:"基础设置",feature:"收据小票上打印确认签名栏",title:"收据小票上打印确认签名栏",seq:94},{id:"s98-guest-order-rules-Menusifu-self-dine-in-host-URL",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"Menusifu self dine in host URL",seq:98},{id:"s107-tables-floor-跳过选桌",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置点单是否需要展示选择桌子页面",moduleName:"基础设置",feature:"跳过选桌（是否展示选桌页面）",title:"跳过选桌",seq:107},{id:"s108-pos-order-init-跳过选择人数",groupTitle:"POS 开单流程",groupKey:"pos-order-init",sceneDesc:"设置点单是否需要展示选择人数页面",moduleName:"基础设置",feature:"跳过选择人数（是否展示选人数页面）",title:"跳过选择人数",seq:108},{id:"s110-pos-order-toolbar-点单超时提醒-分钟",groupTitle:"POS 点单页工具栏",groupKey:"pos-order-toolbar",sceneDesc:"设置订单创建后显示警告的时间间隔。",moduleName:"基础设置",feature:"（未填写）",title:"点单超时提醒(分钟)",seq:110},{id:"s111-pos-order-init-每单最多客人数量",groupTitle:"POS 开单流程",groupKey:"pos-order-init",sceneDesc:"设置每单最多可以选择的客人数量",moduleName:"基础设置",feature:"（未填写）",title:"每单最多客人数量",seq:111},{id:"s113-pos-kitchen-send-点击-送厨-整单送厨",groupTitle:"POS 送厨流程",groupKey:"pos-kitchen-send",sceneDesc:'设置点击"送厨"订单是否整单送厨',moduleName:"基础设置",feature:"（未填写）",title:'点击"送厨"整单送厨',seq:113},{id:"s114-pos-kitchen-send-点击-付款-直接送厨",groupTitle:"POS 送厨流程",groupKey:"pos-kitchen-send",sceneDesc:'设置点击"付款"订单是否直接送厨',moduleName:"基础设置",feature:"（未填写）",title:'点击"付款"直接送厨',seq:114},{id:"s118-pos-menu-ui-搜索菜单",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"设置是否支持搜索菜单",moduleName:"基础设置",feature:"（未填写）",title:"搜索菜单",seq:118},{id:"s120-pos-kitchen-send-结账后自动送厨",groupTitle:"POS 送厨流程",groupKey:"pos-kitchen-send",sceneDesc:"设置结账后是否自动送厨",moduleName:"基础设置",feature:"（未填写）",title:"结账后自动送厨",seq:120},{id:"s121-pos-order-cart-订单数量支持小数",groupTitle:"POS 点单页展示",groupKey:"pos-order-cart",sceneDesc:"设置订单数量是否支持小数展示，比如有半份，三分之一份的",moduleName:"基础设置",feature:"（未填写）",title:"订单数量支持小数",seq:121},{id:"s122-pos-order-cart-减菜后自动重定向",groupTitle:"POS 点单页展示",groupKey:"pos-order-cart",sceneDesc:"设置减菜后是否自动重定向",moduleName:"基础设置",feature:"（未填写）",title:"减菜后自动重定向",seq:122},{id:"s123-pos-kitchen-send-打单后自动送厨",groupTitle:"POS 送厨流程",groupKey:"pos-kitchen-send",sceneDesc:"设置打单后是否自动送厨",moduleName:"基础设置",feature:"（未填写）",title:"打单后自动送厨",seq:123},{id:"s125-pos-kitchen-send-延迟送厨时间",groupTitle:"POS 送厨流程",groupKey:"pos-kitchen-send",sceneDesc:"设置订单下单后多久再自动送厨",moduleName:"基础设置",feature:"（未填写）",title:"延迟送厨时间",seq:125},{id:"s132-pos-order-cart-点单显示座位",groupTitle:"POS 点单页展示",groupKey:"pos-order-cart",sceneDesc:"设置哪种订单类型(Dinein、Delivery、Pick Up、To Go)的点单，点单显示座位，用于一个订单，多个座位，按照座位点单加菜",moduleName:"点单界面设置",feature:"点单显示座位（按订单类型）",title:"点单显示座位",seq:132},{id:"s133-pos-order-cart-相同菜拆分显示",groupTitle:"POS 点单页展示",groupKey:"pos-order-cart",sceneDesc:"设置相同的菜是分开展示，还是合并展示",moduleName:"点单界面设置",feature:"（未填写）",title:"相同菜拆分显示",seq:133},{id:"s135-pos-order-cart-菜序模式",groupTitle:"POS 点单页展示",groupKey:"pos-order-cart",sceneDesc:"设置订单中，相同的类（即菜序）下的商品，合并到一个类下进行展示。",moduleName:"点单界面设置",feature:"（未填写）",title:"菜序模式",seq:135},{id:"s136-pos-order-cart-默认键盘类型",groupTitle:"POS 点单页展示",groupKey:"pos-order-cart",sceneDesc:"设置系统键盘是仅支持英文，还是支持多语言",moduleName:"点单界面设置",feature:"（未填写）",title:"默认键盘类型",seq:136},{id:"s137-pos-order-cart-显示ASAP订单时间",groupTitle:"POS 点单页展示",groupKey:"pos-order-cart",sceneDesc:"设置订单时间是否显示ASAP订单时间",moduleName:"点单界面设置",feature:"（未填写）",title:"显示ASAP订单时间",seq:137},{id:"s148-pos-menu-ui-比价功能模式",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"",moduleName:"价格",feature:"（未填写）",title:"比价功能模式",seq:148},{id:"s151-pos-find-order-list-显示所有单的总计价格",groupTitle:"POS 找单列表",groupKey:"pos-find-order-list",sceneDesc:"设置订单列表页面，是否展示所有订单的总价合计金额",moduleName:"找单",feature:"（未填写）",title:"显示所有单的总计价格",seq:151},{id:"s152-pos-find-order-list-显示-关闭以下全部单子-按钮",groupTitle:"POS 找单列表",groupKey:"pos-find-order-list",sceneDesc:"设置是否显示“关闭以下全部单子“按钮",moduleName:"找单",feature:"（未填写）",title:'显示："关闭以下全部单子"按钮',seq:152},{id:"s153-pos-find-order-list-默认显示未加小费订单",groupTitle:"POS 找单列表",groupKey:"pos-find-order-list",sceneDesc:"设置订单列表页面是否显示没有添加小费的订单",moduleName:"找单",feature:"（未填写）",title:"默认显示未加小费订单",seq:153},{id:"s154-pos-find-order-list-盘点模式",groupTitle:"POS 找单列表",groupKey:"pos-find-order-list",sceneDesc:"设置营业结束后进行盘点时的订单列表展示形式",moduleName:"找单",feature:"（未填写）",title:"盘点模式",seq:154},{id:"s169-tables-floor-付款后清桌模式",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置订单付款后是否自动清除桌子上的订单",moduleName:"基本设置",feature:"（未填写）",title:"付款后清桌模式",seq:169},{id:"s176-pos-menu-ui-按时段显示菜单-堂吃菜单",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"设置是否按照不同的时间段显示不同的菜单",moduleName:"时段菜单",feature:"（未填写）",title:"按时段显示菜单:堂吃菜单",seq:176},{id:"s177-pos-menu-ui-按时段显示菜单-外食菜单",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"设置是否按照不同的时间段显示不同的菜单",moduleName:"时段菜单",feature:"（未填写）",title:"按时段显示菜单:外食菜单",seq:177},{id:"s178-pos-order-cart-显示单菜序号",groupTitle:"POS 点单页展示",groupKey:"pos-order-cart",sceneDesc:"设置是否显示单个菜的菜品序号ID",moduleName:"单菜设置",feature:"（未填写）",title:"显示单菜序号",seq:178},{id:"s193-pos-button-visibility-将-删单-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"删单"按钮隐藏到"更多"中...',moduleName:"常见按键",feature:"将“删单”隐藏到“更多”（POS布局）",title:'将"删单"隐藏到"更多"',seq:193},{id:"s194-pos-button-visibility-将-移单-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"移单"隐藏到"更多"中...',moduleName:"常见按键",feature:"（未填写）",title:'将"移单"隐藏到"更多"',seq:194},{id:"s195-pos-button-visibility-将-清桌-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"清桌"隐藏到"更多"中...',moduleName:"常见按键",feature:"（未填写）",title:'将"清桌"隐藏到"更多"',seq:195},{id:"s196-pos-order-toolbar-自定义分割线名称",groupTitle:"POS 点单页工具栏",groupKey:"pos-order-toolbar",sceneDesc:"设置POS点单页面，自定义分割线名称",moduleName:"常见按键",feature:"（未填写）",title:"自定义分割线名称",seq:196},{id:"s197-pos-button-visibility-将-编辑-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"编辑"隐藏到"更多"中...',moduleName:"常见按键",feature:"（未填写）",title:'将"编辑"隐藏到"更多"',seq:197},{id:"s198-pos-button-visibility-将-送厨-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"送厨"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"送厨"隐藏到"更多"',seq:198},{id:"s199-pos-button-visibility-将-付款-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"付款"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"付款"隐藏到"更多"',seq:199},{id:"s200-pos-button-visibility-将-合并-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"合并"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"合并"隐藏到"更多"',seq:200},{id:"s201-pos-button-visibility-将-分单-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"分单"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"分单"隐藏到"更多"',seq:201},{id:"s202-pos-button-visibility-将-打单-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"打单"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"打单"隐藏到"更多"',seq:202},{id:"s203-pos-button-visibility-将-小费-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"小费"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"小费"隐藏到"更多"',seq:203},{id:"s204-pos-button-visibility-将-加收-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"加收"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"加收"隐藏到"更多"',seq:204},{id:"s205-pos-button-visibility-将-复制-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"复制"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"复制"隐藏到"更多"',seq:205},{id:"s206-pos-button-visibility-将-打折-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"打折"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"打折"隐藏到"更多"',seq:206},{id:"s207-pos-button-visibility-将-移菜-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"移菜"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"移菜"隐藏到"更多"',seq:207},{id:"s208-pos-button-visibility-将-顾客信息-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"顾客信息"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"顾客信息"隐藏到"更多"',seq:208},{id:"s209-pos-button-visibility-将-退款并删单-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"退款并删单"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"退款并删单"隐藏到"更多"',seq:209},{id:"s210-pos-button-visibility-将-叫号-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"叫号"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"叫号"隐藏到"更多"',seq:210},{id:"s211-pos-button-visibility-将-类型-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"类型"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"类型"隐藏到"更多"',seq:211},{id:"s212-pos-button-visibility-将-销号-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"销号"隐藏到"更多"',moduleName:"常见按键",feature:"（未填写）",title:'将"销号"隐藏到"更多"',seq:212},{id:"s213-pos-button-visibility-将-催菜-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"催菜"隐藏到"更多"',moduleName:"其他按键",feature:"（未填写）",title:'将"催菜"隐藏到"更多"',seq:213},{id:"s214-pos-button-visibility-将-企台-隐藏到-更多",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，将"企台"隐藏到"更多"',moduleName:"其他按键",feature:"（未填写）",title:'将"企台"隐藏到"更多"',seq:214},{id:"s215-pos-button-visibility-来取-外送历史订单界面-将-复制-隐藏",groupTitle:"POS 按钮显隐",groupKey:"pos-button-visibility",sceneDesc:'设置POS点单页面，来取/外送历史订单界面:将"复制"隐藏',moduleName:"其他按键",feature:"（未填写）",title:'来取/外送历史订单界面:将"复制"隐藏',seq:215},{id:"s216-pos-menu-ui-组平铺展示",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"设置POS点单页面，组是否平铺展示",moduleName:"点餐界面模式",feature:"（未填写）",title:"组平铺展示",seq:216},{id:"s217-pos-menu-ui-类展示",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"设置POS点单页面，分类的展示布局形式Horizontal 2、Horizontal 3、Vertical 1",moduleName:"点餐界面模式",feature:"类展示（分类布局形式）",title:"类展示",seq:217},{id:"s218-pos-menu-ui-菜展示",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"设置POS点单页面，菜的展示布局形式Regular Buttons、Large Buttons",moduleName:"点餐界面模式",feature:"（未填写）",title:"菜展示",seq:218},{id:"s219-pos-menu-ui-按钮颜色满铺",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"设置POS点单页面，按钮颜色是否铺满",moduleName:"点餐界面模式",feature:"（未填写）",title:"按钮颜色满铺",seq:219},{id:"s220-pos-menu-ui-显示菜品价格",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"设置POS点单页面，是否显示菜品价格",moduleName:"点餐界面模式",feature:"（未填写）",title:"显示菜品价格",seq:220},{id:"s221-pos-checkout-entry-支付前确认客户信息",groupTitle:"POS 结账入口",groupKey:"pos-checkout-entry",sceneDesc:"设置POS点单页面，是否支付前需要服务员二次确认客户信息",moduleName:"点餐界面模式",feature:"（未填写）",title:"支付前确认客户信息",seq:221},{id:"s222-pos-order-cart-客户姓名必填",groupTitle:"POS 点单页展示",groupKey:"pos-order-cart",sceneDesc:"设置POS点单页面，是否客户姓名必填",moduleName:"点餐界面模式",feature:"（未填写）",title:"客户姓名必填",seq:222},{id:"s223-pos-order-cart-客户电话必填",groupTitle:"POS 点单页展示",groupKey:"pos-order-cart",sceneDesc:"设置POS点单页面，是否客户电话必填",moduleName:"点餐界面模式",feature:"（未填写）",title:"客户电话必填",seq:223},{id:"s248-pos-checkout-entry-当用条形码找单时打开单子付款界面",groupTitle:"POS 结账入口",groupKey:"pos-checkout-entry",sceneDesc:"设置当用条形码找单时是否打开单子的付款界面",moduleName:"付款收据",feature:"（未填写）",title:"当用条形码找单时打开单子付款界面",seq:248},{id:"s251-pos-find-order-list-找单界面打印所选收据类型",groupTitle:"POS 找单列表",groupKey:"pos-find-order-list",sceneDesc:"设置找单界面打印时是否展示收据类型选择",moduleName:"付款收据",feature:"（未填写）",title:"找单界面打印所选收据类型",seq:251},{id:"s347-tables-floor-允许更换企台",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置Ipad上使用POS，是否允许更换服务员",moduleName:"基础设置",feature:"（未填写）",title:"允许更换企台",seq:347},{id:"s348-pos-menu-ui-按照时段显示菜单",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"设置Ipad上使用POS，是否按照时段显示菜单",moduleName:"基础设置",feature:"（未填写）",title:"按照时段显示菜单",seq:348},{id:"s350-pos-menu-ui-电子菜单自定义消息",groupTitle:"POS 菜单与布局",groupKey:"pos-menu-ui",sceneDesc:"设置Ipad上使用POS，是否允许电子菜单自定义消息",moduleName:"基础设置",feature:"（未填写）",title:"电子菜单自定义消息",seq:350},{id:"s351-tables-floor-启用向客户端发送清桌通知",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置Ipad上使用POS，是否启用向客户端发送清桌通知",moduleName:"基础设置",feature:"（未填写）",title:"启用向客户端发送清桌通知",seq:351},{id:"s443-guest-order-rules-未填写",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"比如KTV场景，按照使用时长收费",moduleName:"按时计价",feature:"按时计价（如KTV按时长收费）",title:"（未填写）",seq:443},{id:"s461-cds-封面",groupTitle:"客显屏",groupKey:"cds",sceneDesc:"设置客显屏的广告宣传图是否展示 维护请至素材中心。",moduleName:"封面",feature:"（未填写）",title:"封面",seq:461},{id:"s462-cds-Logo",groupTitle:"客显屏",groupKey:"cds",sceneDesc:"设置客显屏的LOGO是否展示 维护请至素材中心。",moduleName:"Logo",feature:"（未填写）",title:"Logo",seq:462},{id:"s466-cds-其他",groupTitle:"客显屏",groupKey:"cds",sceneDesc:"Pickup/Delivery类型订单是否启用客显屏",moduleName:"服务",feature:"（未填写）",title:"其他",seq:466},{id:"s483-pos-order-toolbar-分单-删单-保存-退出-付款-送厨-直送-仅付款",groupTitle:"POS 点单页工具栏",groupKey:"pos-order-toolbar",sceneDesc:"整单操作相关操作的按钮及排序顺序",moduleName:"整单操作",feature:"点单页配置：整单操作（按钮集合/排序）",title:"分单、删单、保存、退出、付款、送厨、直送、仅付款",seq:483},{id:"s484-pos-order-toolbar-分割线-加1-数量-减1-备注-税-调味-改价",groupTitle:"POS 点单页工具栏",groupKey:"pos-order-toolbar",sceneDesc:"菜品详情相关操作的按钮及排序顺序",moduleName:"菜品详情",feature:"菜品详情（按钮集合/排序）",title:"分割线、加1、数量、减1、备注、税、调味、改价",seq:484},{id:"s485-pos-order-toolbar-排序-客人信息-类型-换桌-企台-客人-整单备注-会员-打单",groupTitle:"POS 点单页工具栏",groupKey:"pos-order-toolbar",sceneDesc:"订单信息相关操作的按钮及排序顺序",moduleName:"订单信息",feature:"POS点单页配置订单信息（按钮排序/显隐）",title:"排序、客人信息、类型、换桌、企台、客人、整单备注、会员、打单",seq:485},{id:"s486-pos-order-toolbar-加收-折扣-小费-整单税",groupTitle:"POS 点单页工具栏",groupKey:"pos-order-toolbar",sceneDesc:"订单金额相关操作的按钮及排序顺序",moduleName:"订单金额",feature:"点单页配置订单金额（按钮排序/显隐）",title:"加收、折扣、小费、整单税",seq:486},{id:"s487-guest-order-rules-订单类型可用范围-堂吃-外带-来取",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置订单类型是支持堂吃，还是支持打包，还是支持外带",moduleName:"订单类型",feature:"（未填写）",title:"订单类型可用范围（堂吃/外带/来取）",seq:487},{id:"s488-guest-order-rules-展示订单类型选择页面",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置食客端是否展示订单类型选择页面",moduleName:"订单类型",feature:"（未填写）",title:"展示订单类型选择页面",seq:488},{id:"s489-guest-order-rules-送餐取餐服务方式",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置食客端是否展示送餐取餐服务方式（柜台自取/服务员送餐到桌）",moduleName:"订单类型",feature:"（未填写）",title:"送餐取餐服务方式",seq:489},{id:"s490-guest-order-rules-展示取餐方式",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置食客端是否展示送餐取餐服务方式选择页面",moduleName:"订单类型",feature:"（未填写）",title:"展示取餐方式",seq:490},{id:"s491-guest-order-rules-打包展示输入号码牌",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置打包场景下是否展示输入取餐实体号码牌页面",moduleName:"订单类型",feature:"（未填写）",title:"打包展示输入号码牌",seq:491},{id:"s502-guest-order-rules-可自动送厨的Kiosk订单支付类型",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置订单在何种支付状态下自动送厨",moduleName:"收据",feature:"（未填写）",title:"可自动送厨的Kiosk订单支付类型",seq:502},{id:"s503-guest-order-rules-送餐到桌餐牌号获取方式",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置送餐到桌餐牌号获取方式是输入实体号码牌还是使用虚拟的订单号",moduleName:"收据",feature:"（未填写）",title:"送餐到桌餐牌号获取方式",seq:503},{id:"s504-guest-order-rules-展示输入手机号",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"食客端（Kiosk/eMenu/扫码等）是否展示输入手机号页面；合并原 seq 30（终端/食客端）为 SSOT。",moduleName:"用户信息",feature:"（未填写）",title:"展示输入手机号",seq:504},{id:"s505-guest-order-rules-手机号必填",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"开启后，在选定产线的输入手机号页面要求手机号必填（取餐联络等；与 seq 504 展示页配套，非会员专属）。",moduleName:"用户信息",feature:"（未填写）",title:"手机号必填",seq:505},{id:"s506-guest-order-rules-输入姓名",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置食客端是否展示输入食客姓名页面",moduleName:"用户信息",feature:"（未填写）",title:"输入姓名",seq:506},{id:"s507-guest-order-rules-姓名必填",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"开启后，在选定产线的输入姓名页面要求姓名必填（取餐叫号等；与 seq 506 展示页配套，非会员专属）。",moduleName:"用户信息",feature:"（未填写）",title:"姓名必填",seq:507},{id:"s509-guest-menu-global-展示账户积分",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"开启后，在选定产线展示会员账户积分余额。",moduleName:"用户信息",feature:"（未填写）",title:"展示账户积分",seq:509},{id:"s510-guest-order-rules-默认选中隐私条款",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"开启后，在选定产线输入手机号页面的隐私条款默认勾选（食客仍可取消）。",moduleName:"用户信息",feature:"（未填写）",title:"默认选中隐私条款",seq:510},{id:"s515-guest-menu-structure-展示菜单序号",groupTitle:"食客端·菜单结构",groupKey:"guest-menu-structure",sceneDesc:"设置菜单是否展示菜单序号ID",moduleName:"菜单",feature:"（未填写）",title:"展示菜单序号",seq:515},{id:"s516-guest-menu-structure-显示组名称",groupTitle:"食客端·菜单结构",groupKey:"guest-menu-structure",sceneDesc:"设置菜单分类，按照组类菜树形结构，是否展示组名称",moduleName:"菜单",feature:"（未填写）",title:"显示组名称",seq:516},{id:"s517-guest-menu-structure-菜单展示位置",groupTitle:"食客端·菜单结构",groupKey:"guest-menu-structure",sceneDesc:"设置菜单分类导航是顶部展示，还是侧边展示",moduleName:"菜单",feature:"（未填写）",title:"菜单展示位置",seq:517},{id:"s518-guest-menu-structure-默认展开第一组",groupTitle:"食客端·菜单结构",groupKey:"guest-menu-structure",sceneDesc:"设置菜单组类菜树形结构，是否默认展开第一个组下面的类名称",moduleName:"菜单",feature:"（未填写）",title:"默认展开第一组",seq:518},{id:"s519-guest-menu-structure-菜单图片裁切显示",groupTitle:"食客端·菜单结构",groupKey:"guest-menu-structure",sceneDesc:"设置菜单图片是填充菜单卡片，还是按照图片大小等比放大缩小展示",moduleName:"菜单",feature:"（未填写）",title:"菜单图片裁切显示",seq:519},{id:"s520-guest-menu-structure-套餐展示导航栏",groupTitle:"食客端·菜单结构",groupKey:"guest-menu-structure",sceneDesc:"设置套餐页面，是否展示套餐步骤分类导航栏",moduleName:"菜单",feature:"（未填写）",title:"套餐展示导航栏",seq:520},{id:"s521-guest-notes-fees-订单备注",groupTitle:"备注与附加服务",groupKey:"guest-notes-fees",sceneDesc:"设置订单是否支持食客进行特殊备注",moduleName:"菜单",feature:"（未填写）",title:"订单备注",seq:521},{id:"s522-guest-notes-fees-产品备注",groupTitle:"备注与附加服务",groupKey:"guest-notes-fees",sceneDesc:"设置商品是否支持食客进行特殊备注",moduleName:"菜单",feature:"（未填写）",title:"产品备注",seq:522},{id:"s523-guest-notes-fees-套餐子项备注",groupTitle:"备注与附加服务",groupKey:"guest-notes-fees",sceneDesc:"设置套餐内的子商品是否支持食客进行特殊备注",moduleName:"菜单",feature:"（未填写）",title:"套餐子项备注",seq:523},{id:"s524-guest-menu-structure-瀑布流模式",groupTitle:"食客端·菜单结构",groupKey:"guest-menu-structure",sceneDesc:"设置菜单浏览形式（连续滚动 / 分类导航切换）",moduleName:"菜单",feature:"（未填写）",title:"瀑布流模式",seq:524},{id:"s525-guest-menu-structure-菜单页面展示积分菜",groupTitle:"食客端·菜单结构",groupKey:"guest-menu-structure",sceneDesc:"开启后，在选定产线的菜单页展示积分兑换商品。",moduleName:"菜单",feature:"（未填写）",title:"菜单页面展示积分菜",seq:525},{id:"s526-guest-menu-structure-菜单页面积分菜展示位置",groupTitle:"食客端·菜单结构",groupKey:"guest-menu-structure",sceneDesc:"各产线（POS/Kiosk/eMenu/Paypad）独立配置积分菜展示位置：顶部展示或尾部展示。",moduleName:"菜单",feature:"（未填写）",title:"菜单页面积分菜展示位置",seq:526},{id:"s527-guest-order-rules-订单仅有积分商品可以兑换",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"开启后，在选定产线允许订单仅含积分商品时直接下单兑换。",moduleName:"菜单",feature:"（未填写）",title:"订单仅有积分商品可以兑换",seq:527},{id:"s528-guest-menu-structure-菜价为0展示价格",groupTitle:"食客端·菜单结构",groupKey:"guest-menu-structure",sceneDesc:"设置价格为0的菜品是否在菜单上展示价格",moduleName:"菜单",feature:"（未填写）",title:"菜价为0展示价格",seq:528},{id:"s532-guest-menu-global-展示MenuSifu品牌LOGO",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置是否展示MenuSifu品牌LOGO",moduleName:"展示设置",feature:"（未填写）",title:"展示MenuSifu品牌LOGO",seq:532},{id:"s533-tables-floor-选择桌子页面",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置是否展示选择桌子页面",moduleName:"桌子设置",feature:"（未填写）",title:"选择桌子页面",seq:533},{id:"s534-tables-floor-自动清桌",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置桌子被占用超过多久后是否自动清桌",moduleName:"桌子设置",feature:"（未填写）",title:"自动清桌",seq:534},{id:"s535-wait-time-展示当前订单预计等待时长",groupTitle:"等待时长提示",groupKey:"wait-time",sceneDesc:"设置是否展示当前订单预计等待时长（开启后配置自动关闭/菜单弹框分钟数）",moduleName:"等待时长",feature:"（未填写）",title:"展示当前订单预计等待时长",seq:535},{id:"s536-wait-time-预计等待时长区间设置",groupTitle:"等待时长提示",groupKey:"wait-time",sceneDesc:"设置是否启用预计等待时长区间（杯数/分钟阈值与区间加减分钟）",moduleName:"等待时长",feature:"（未填写）",title:"预计等待时长区间设置",seq:536},{id:"s537-wait-time-等待时长展示类型",groupTitle:"等待时长提示",groupKey:"wait-time",sceneDesc:"设置等待时长展示类型（排队杯数/制作等待时间）",moduleName:"等待时长",feature:"（未填写）",title:"等待时长展示类型",seq:537},{id:"s538-wait-time-字体大小",groupTitle:"等待时长提示",groupKey:"wait-time",sceneDesc:"设置等待时长提示样式的字体大小（系统默认/自定义）",moduleName:"等待时长",feature:"（未填写）",title:"字体大小",seq:538},{id:"s539-wait-time-字体背景色",groupTitle:"等待时长提示",groupKey:"wait-time",sceneDesc:"设置等待时长提示样式的字体背景色（系统默认/自定义）",moduleName:"等待时长",feature:"（未填写）",title:"字体背景色",seq:539},{id:"s540-wait-time-字体颜色",groupTitle:"等待时长提示",groupKey:"wait-time",sceneDesc:"设置等待时长提示样式的字体颜色（系统默认/自定义）",moduleName:"等待时长",feature:"（未填写）",title:"字体颜色",seq:540},{id:"s542-guest-menu-global-开启Kiosk本地菜单标签设置",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置是否使用本地商品标签功能配置还是使用商品中心的商品标签功能配置",moduleName:"平台设置",feature:"（未填写）",title:"开启Kiosk本地菜单标签设置",seq:542},{id:"s544-guest-notes-fees-餐具加收",groupTitle:"备注与附加服务",groupKey:"guest-notes-fees",sceneDesc:"设置是否支持食客选择餐具及餐具是否收费",moduleName:"附加费设置",feature:"（未填写）",title:"餐具加收",seq:544},{id:"s545-guest-notes-fees-打包带加收",groupTitle:"备注与附加服务",groupKey:"guest-notes-fees",sceneDesc:"设置是否支持食客选择打包及打包带是否收费",moduleName:"附加费设置",feature:"（未填写）",title:"打包带加收",seq:545},{id:"s567-guest-order-rules-菜单延迟送厨",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置菜品下单限制，哪些菜品食客下单后需要延迟送厨，及设置延迟多久自动送厨",moduleName:"权限设置",feature:"（未填写）",title:"菜单延迟送厨",seq:567},{id:"s569-guest-order-rules-点单须知",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置食客端是否展示点单须知弹框及自定义内容",moduleName:"提示信息",feature:"（未填写）",title:"点单须知",seq:569},{id:"s570-guest-order-rules-火锅页面提示",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置火锅菜单的特殊说明提示",moduleName:"提示信息",feature:"（未填写）",title:"火锅页面提示",seq:570},{id:"s571-guest-order-rules-品类先下单",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置菜单模式是品类模式（自助餐场景）选择某个套餐后是否默认先下单",moduleName:"下单设置",feature:"（未填写）",title:"品类先下单",seq:571},{id:"s572-guest-order-rules-火锅锅底必选",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置下单时，火锅锅底是否必选",moduleName:"下单设置",feature:"（未填写）",title:"火锅锅底必选",seq:572},{id:"s573-guest-order-rules-火锅锅底下单后仍展示锅底",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置火锅锅底下单后，菜单中是否还展示火锅锅底",moduleName:"下单设置",feature:"（未填写）",title:"火锅锅底下单后仍展示锅底",seq:573},{id:"s574-guest-order-rules-火锅锅底下单方式",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置火锅锅底选择后必须先下单还是可加入购物车",moduleName:"下单设置",feature:"（未填写）",title:"火锅锅底下单方式",seq:574},{id:"s575-guest-order-rules-同一锅型-相同锅底超过一半默认加收",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置火锅同一锅型,相同锅底超过一半默认加收多少钱",moduleName:"下单设置",feature:"（未填写）",title:"同一锅型,相同锅底超过一半默认加收",seq:575},{id:"s577-guest-order-rules-展示用餐时长",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置订单下单后是否展示用餐时长",moduleName:"下单设置",feature:"（未填写）",title:"展示用餐时长",seq:577},{id:"s578-guest-order-rules-用餐时长倒计时展示",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置订单下单后展示的用餐时长是正计时还是倒计时",moduleName:"下单设置",feature:"（未填写）",title:"用餐时长倒计时展示",seq:578},{id:"s579-guest-order-rules-用餐剩余时长提示",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置用餐剩余多少时间后弹出用餐剩余时长提示",moduleName:"下单设置",feature:"（未填写）",title:"用餐剩余时长提示",seq:579},{id:"s580-guest-order-rules-用餐剩余时长提示后不允许下单",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置用餐剩余时长提示后是否允许食客自助下单",moduleName:"下单设置",feature:"（未填写）",title:"用餐剩余时长提示后不允许下单",seq:580},{id:"s581-guest-order-rules-菜单送厨方式",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置菜单下单后自动送厨还是需要服务员在POS上手动操作送厨",moduleName:"下单设置",feature:"（未填写）",title:"菜单送厨方式",seq:581},{id:"s592-tables-floor-不允许一桌多单",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置一个桌子是否允许创建多个订单",moduleName:"下单设置",feature:"（未填写）",title:"不允许一桌多单",seq:592},{id:"s597-guest-order-rules-每轮菜品互斥下单",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置每轮下单时菜品互斥规则",moduleName:"下单设置",feature:"（未填写）",title:"每轮菜品互斥下单",seq:597},{id:"s598-guest-order-rules-每轮菜品组合下单",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"设置每轮下单时菜品组合规则",moduleName:"下单设置",feature:"（未填写）",title:"每轮菜品组合下单",seq:598},{id:"s599-guest-menu-global-选择您想展示的菜单组",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置所有设备/桌子默认展示哪些菜单",moduleName:"展示设置",feature:"（未填写）",title:"选择您想展示的菜单组",seq:599},{id:"s600-guest-menu-global-纯展示模式",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置所有设备/桌子菜单是否为纯展示模式（不可加购）",moduleName:"展示设置",feature:"（未填写）",title:"纯展示模式",seq:600},{id:"s601-guest-menu-global-品牌-品类模式",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置菜单点单模式是普通菜单模式还是按照品类先分类查看再选择的菜单点单形式",moduleName:"展示设置",feature:"（未填写）",title:"品牌/品类模式",seq:601},{id:"s602-guest-menu-global-菜单分类模式",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置菜单点单模式是普通菜单模式还是按照分类先分类查看再选择的菜单点单形式",moduleName:"展示设置",feature:"（未填写）",title:"菜单分类模式",seq:602},{id:"s604-guest-menu-global-eMenu-Pro模式",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置所有设备/桌子的菜单页面展示形式（普通/高级设计稿）",moduleName:"展示设置",feature:"（未填写）",title:"eMenu Pro模式",seq:604},{id:"s606-guest-menu-global-展示菜单类名称",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置菜单树形结构中是否展示类名称",moduleName:"展示设置",feature:"（未填写）",title:"展示菜单类名称",seq:606},{id:"s607-guest-menu-global-菜单图片展示模式",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置菜单是默认大图展示形式，还是默认小图展示形式",moduleName:"展示设置",feature:"（未填写）",title:"菜单图片展示模式",seq:607},{id:"s608-guest-menu-global-展示菜详情",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置菜单是否展示菜单详情页面",moduleName:"展示设置",feature:"（未填写）",title:"展示菜详情",seq:608},{id:"s611-guest-menu-global-展示开始按钮",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置首页是否展示开始点单按钮",moduleName:"展示设置",feature:"（未填写）",title:"展示开始按钮",seq:611},{id:"s612-guest-menu-global-展示品牌",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置首页是否展示软件服务商的品牌LOGO",moduleName:"展示设置",feature:"（未填写）",title:"展示品牌",seq:612},{id:"s616-guest-menu-cart-展示菜单送厨状态",groupTitle:"食客端·购物车展示",groupKey:"guest-menu-cart",sceneDesc:"设置购物车是否展示菜单的送厨状态",moduleName:"展示设置",feature:"（未填写）",title:"展示菜单送厨状态",seq:616},{id:"s617-guest-menu-cart-购物车展示订单价格",groupTitle:"食客端·购物车展示",groupKey:"guest-menu-cart",sceneDesc:"设置购物车是否展示订单价格",moduleName:"展示设置",feature:"（未填写）",title:"购物车展示订单价格",seq:617},{id:"s618-guest-menu-cart-菜品售罄自动隐藏",groupTitle:"食客端·购物车展示",groupKey:"guest-menu-cart",sceneDesc:"设置菜品售罄是否自动隐藏不展示",moduleName:"展示设置",feature:"（未填写）",title:"菜品售罄自动隐藏",seq:618},{id:"s619-tables-floor-人数选择",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置是否展示人数选择页面。关闭后跳过人数选择",moduleName:"用户设置",feature:"（未填写）",title:"人数选择",seq:619},{id:"s622-guest-order-rules-登录-注册需要短信验证码",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"开启后，在选定产线的会员登录/注册页要求短信验证码（须开通会员且该产线 623≠不展示登录页；合并原 seq 508）。",moduleName:"用户设置",feature:"（未填写）",title:"登录/注册需要短信验证码",seq:622},{id:"s623-guest-order-rules-点单前会员身份策略",groupTitle:"食客端·下单与规则",groupKey:"guest-order-rules",sceneDesc:"各产线（POS/Kiosk/eMenu/Paypad）点单前会员身份：可选登录、强制登录/注册，或不展示登录页；每产线三选一；合并原 seq 623/624 布尔开关。",moduleName:"用户设置",feature:"（未填写）",title:"点单前会员身份策略",seq:623},{id:"s625-pos-order-init-儿童将不参与下单限制规则的人数计算",groupTitle:"POS 开单流程",groupKey:"pos-order-init",sceneDesc:"设置儿童是否参与下单限制规则的人数计算",moduleName:"用户设置",feature:"（未填写）",title:"儿童将不参与下单限制规则的人数计算",seq:625},{id:"s642-tables-floor-清桌",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置是否展示清桌按钮（eMenu上）",moduleName:"服务员设置",feature:"（未填写）",title:"清桌",seq:642},{id:"s643-tables-floor-开单前-换桌",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置开单前是否需要换桌（防止订单误追加）",moduleName:"服务员设置",feature:"（未填写）",title:"开单前,换桌",seq:643},{id:"s644-tables-floor-开单前-必换桌",groupTitle:"桌台与餐位",groupKey:"tables-floor",sceneDesc:"设置开单前是否必须选择桌子（强制选桌）",moduleName:"服务员设置",feature:"（未填写）",title:"开单前,必换桌",seq:644},{id:"s645-guest-menu-global-菜品名称字体大小",groupTitle:"食客端·首页与版式",groupKey:"guest-menu-global",sceneDesc:"设置菜品名称字体大小",moduleName:"菜单样式",feature:"（未填写）",title:"菜品名称字体大小",seq:645},{id:"s652-guest-facing-locale-选择语言",groupTitle:"食客端·界面语言",groupKey:"guest-facing-locale",sceneDesc:"设置终端支持的语言列表",moduleName:"多语言",feature:"（未填写）",title:"选择语言",seq:652},{id:"s653-guest-facing-locale-默认语言",groupTitle:"食客端·界面语言",groupKey:"guest-facing-locale",sceneDesc:"设置终端的默认语言",moduleName:"多语言",feature:"（未填写）",title:"默认语言",seq:653},{id:"s655-guest-menu-scenarios-年龄-类别",groupTitle:"食客端·品类与场景菜单",groupKey:"guest-menu-scenarios",sceneDesc:"自助餐品类设置（人数/套餐/菜单关联、年龄阶段、套餐名自定义）",moduleName:"类别设置",feature:"（未填写）",title:"年龄、类别",seq:655},{id:"s656-guest-menu-scenarios-菜单设置",groupTitle:"食客端·品类与场景菜单",groupKey:"guest-menu-scenarios",sceneDesc:"将商品与不同套餐关联（决定不同套餐食客看到的菜单）",moduleName:"菜单设置",feature:"（未填写）",title:"菜单设置",seq:656},{id:"s657-guest-menu-scenarios-营业时间",groupTitle:"食客端·品类与场景菜单",groupKey:"guest-menu-scenarios",sceneDesc:"",moduleName:"营业时间",feature:"（未填写）",title:"营业时间",seq:657},{id:"s658-guest-menu-scenarios-开启特殊菜单",groupTitle:"食客端·品类与场景菜单",groupKey:"guest-menu-scenarios",sceneDesc:"特殊菜单（额外分类并行展示）",moduleName:"特殊菜单",feature:"（未填写）",title:"开启特殊菜单",seq:658},{id:"s659-guest-menu-scenarios-类别名称",groupTitle:"食客端·品类与场景菜单",groupKey:"guest-menu-scenarios",sceneDesc:"",moduleName:"类别设置",feature:"（未填写）",title:"类别名称",seq:659},{id:"s660-guest-menu-scenarios-菜单设置",groupTitle:"食客端·品类与场景菜单",groupKey:"guest-menu-scenarios",sceneDesc:"",moduleName:"菜单设置",feature:"（未填写）",title:"菜单设置",seq:660},{id:"s661-guest-menu-scenarios-营业时间",groupTitle:"食客端·品类与场景菜单",groupKey:"guest-menu-scenarios",sceneDesc:"",moduleName:"营业时间",feature:"（未填写）",title:"营业时间",seq:661}]},"/operations/reservations/settings":{hubTitle:"预约等位中心",settingsPath:"/operations/reservations/settings",items:[{id:"s2-caller-screen-display-叫号屏开关",groupTitle:"叫号屏与显示策略",groupKey:"caller-screen-display",sceneDesc:"控制叫号屏的开启还是关闭，开启后，叫号屏才能使用",moduleName:"叫号屏",feature:"启用与取餐叫号能力总开关",title:"叫号屏开关",seq:2},{id:"s3-caller-screen-display-单号显示时长",groupTitle:"叫号屏与显示策略",groupKey:"caller-screen-display",sceneDesc:"控制叫号屏上单号展示的时长，超过设定的时长后，不在展示该单号",moduleName:"叫号屏",feature:"叫号屏单号显示时长",title:"单号显示时长",seq:3},{id:"s4-caller-screen-display-单号数量上限",groupTitle:"叫号屏与显示策略",groupKey:"caller-screen-display",sceneDesc:"控制叫号屏上最多展示多少个单号，超过数量后，暂时不展示超出的单号",moduleName:"叫号屏",feature:"叫号屏同屏展示单号数量上限",title:"单号数量上限",seq:4},{id:"s5-caller-screen-display-数据存储时间-天",groupTitle:"叫号屏与显示策略",groupKey:"caller-screen-display",sceneDesc:"控制叫号屏数据的存储时长，超出时间后，清空历史数据",moduleName:"叫号屏",feature:"叫号屏历史数据保留天数",title:"数据存储时间(天)",seq:5},{id:"s6-caller-screen-display-付款后自动移除单号",groupTitle:"叫号屏与显示策略",groupKey:"caller-screen-display",sceneDesc:"控制叫号屏上展示的订单，如果是待支付的订单正常在叫号屏显示，订单支付成功后单号从叫号屏移除",moduleName:"叫号屏",feature:"付款成功后自动移除叫号屏单号",title:"付款后自动移除单号",seq:6},{id:"s7-caller-screen-display-显示模式",groupTitle:"叫号屏与显示策略",groupKey:"caller-screen-display",sceneDesc:"控制叫号屏是同时展示广告图和订单号，还是仅展示订单号，不展示广告图片；还是展示Multiple kitchens或者Show kitchen preparation status",moduleName:"叫号屏",feature:"叫号屏显示模式（广告图/仅单号/多厨房/备餐状态）",title:"显示模式",seq:7},{id:"s12-waitlist-queue-rules-按照团体人数分开排队",groupTitle:"等位排队规则",groupKey:"waitlist-queue-rules",sceneDesc:"等位按照团体人数分开排队：控制等位时是否根据团体人数（如小桌、大桌）分别排队",moduleName:"等位",feature:"等位按团体人数分开排队",title:"按照团体人数分开排队",seq:12},{id:"s13-waitlist-queue-rules-团体人数",groupTitle:"等位排队规则",groupKey:"waitlist-queue-rules",sceneDesc:"设置等位时可接受的团体人数（如2人、4人、6人桌等）或团体人数参数",moduleName:"等位",feature:"等位团体人数设置（如可排队的人数选项）",title:"团体人数",seq:13},{id:"s14-waitlist-queue-rules-团体代号",groupTitle:"等位排队规则",groupKey:"waitlist-queue-rules",sceneDesc:"等位团体代号”，通常指等位时为每个排队团体分配的唯一代号（如号码或姓名），用于叫号识别。",moduleName:"等位",feature:"等位团体代号（排队识别标识）",title:"团体代号",seq:14},{id:"s341-reservation-automation-预约消息提前提醒-单位-小时",groupTitle:"预约提醒与自动化",groupKey:"reservation-automation",sceneDesc:"设置预约订单提前多久在POS上进行消息通知提醒",moduleName:"Default",feature:"（未填写）",title:"预约消息提前提醒(单位:小时)",seq:341},{id:"s342-reservation-automation-自动填充",groupTitle:"预约提醒与自动化",groupKey:"reservation-automation",sceneDesc:"",moduleName:"Default",feature:"（未填写）",title:"自动填充",seq:342},{id:"s529-waitlist-queue-rules-等位模式",groupTitle:"等位排队规则",groupKey:"waitlist-queue-rules",sceneDesc:"设置是否支持等位排队取号功能",moduleName:"产品对接",feature:"（未填写）",title:"等位模式",seq:529}]},"/operations/waitlist/settings":{hubTitle:"外卖/来取",settingsPath:"/operations/waitlist/settings",groupOrder:["scan-online-basics","platform-delivery-slips","delivery-packaging"],items:[{id:"s90-scan-online-basics-网上订餐单号区分-转-订餐单号区分",groupTitle:"扫码·线上下单基础",groupKey:"scan-online-basics",sceneDesc:"",moduleName:"基础设置",feature:"网上订餐单号区分",title:"网上订餐单号区分（转：订餐单号区分）",seq:90},{id:"s92-scan-online-basics-自助点餐功能-扫码点餐",groupTitle:"扫码·线上下单基础",groupKey:"scan-online-basics",sceneDesc:"",moduleName:"基础设置",feature:"开启自助点餐功能（扫码点餐）",title:"自助点餐功能（扫码点餐）",seq:92},{id:"s257-platform-delivery-slips-外卖平台订单打印平台备注",groupTitle:"平台订单与小票",groupKey:"platform-delivery-slips",sceneDesc:"设置外卖平台订单哪种类型的收据上是否打印外卖平台下单的备注",moduleName:"基本设置",feature:"（未填写）",title:"外卖平台订单打印平台备注",seq:257},{id:"s267-platform-delivery-slips-外送小票打印份数",groupTitle:"平台订单与小票",groupKey:"platform-delivery-slips",sceneDesc:"设置外卖订单打印收据的份数",moduleName:"打印设置",feature:"（未填写）",title:"外送小票打印份数",seq:267},{id:"s429-delivery-packaging-外送区域设置",groupTitle:"外送区域与打包费",groupKey:"delivery-packaging",sceneDesc:"设置哪些城市支持外送，外送的城市名称、州、邮编详情",moduleName:"区域设置",feature:"外送区域设置",title:"外送区域设置",seq:429}]},"/orders/settings":{hubTitle:"订单中心",settingsPath:"/orders/settings",groupOrder:["order-init-scenario","order-numbering","split-merge-edit","order-discount","order-surcharge","order-settlement","order-void"],items:[{id:"s115-split-merge-edit-编辑应收金额",groupTitle:"分单合单与改单",groupKey:"split-merge-edit",sceneDesc:"设置是否可以编辑应收金额",moduleName:"基础设置",feature:"（未填写）",title:"编辑应收金额",seq:115},{id:"s116-split-merge-edit-取消部分支付订单",groupTitle:"分单合单与改单",groupKey:"split-merge-edit",sceneDesc:"设置是否可以取消部分支付订单",moduleName:"基础设置",feature:"（未填写）",title:"取消部分支付订单",seq:116},{id:"s117-split-merge-edit-编辑部分支付订单",groupTitle:"分单合单与改单",groupKey:"split-merge-edit",sceneDesc:"设置是否可以编辑部分支付订单",moduleName:"基础设置",feature:"（未填写）",title:"编辑部分支付订单",seq:117},{id:"s119-split-merge-edit-分单时展示未分单菜品",groupTitle:"分单合单与改单",groupKey:"split-merge-edit",sceneDesc:"设置分单时是否展示未分单菜品",moduleName:"基础设置",feature:"（未填写）",title:"分单时展示未分单菜品",seq:119},{id:"s124-split-merge-edit-支持SelfDineIn与POSDineIn-ToGo合单-转-支持合单",groupTitle:"分单合单与改单",groupKey:"split-merge-edit",sceneDesc:"设置是否支持不同产线下的订单进行合单",moduleName:"基础设置",feature:"支持跨产线订单合单",title:"支持SelfDineIn与POSDineIn/ToGo合单（转：支持合单）",seq:124},{id:"s126-order-init-scenario-默认新订单类型",groupTitle:"开单·桌台与场景",groupKey:"order-init-scenario",sceneDesc:"控制每次新创建订单的订单类型的默认类型是Dine In、To Go、Pick Up、Delivery的哪一种",moduleName:"基础设置",feature:"（未填写）",title:"默认新订单类型",seq:126},{id:"s127-order-numbering-最大单号-单号循环上限",groupTitle:"单号规则",groupKey:"order-numbering",sceneDesc:"订单单号生成的最大单号设置，比如最大999",moduleName:"单号设置",feature:"（未填写）",title:"最大单号(单号循环上限)",seq:127},{id:"s128-order-numbering-起始单号",groupTitle:"单号规则",groupKey:"order-numbering",sceneDesc:"订单单号生成的起始单号设置，比如最大每天的第一个订单，单号从25开始，第二单则是26号单号",moduleName:"单号设置",feature:"（未填写）",title:"起始单号",seq:128},{id:"s129-order-numbering-单号模式",groupTitle:"单号规则",groupKey:"order-numbering",sceneDesc:"订单号按照不同的分类，不同的单号规则",moduleName:"单号设置",feature:"（未填写）",title:"单号模式",seq:129},{id:"s130-order-numbering-分类单号设置",groupTitle:"单号规则",groupKey:"order-numbering",sceneDesc:"设置单号模式下，不同分类单号的展示规则",moduleName:"单号设置",feature:"（未填写）",title:"分类单号设置",seq:130},{id:"s131-order-numbering-单号重置",groupTitle:"单号规则",groupKey:"order-numbering",sceneDesc:"设置每天单号从起始单号开始，还是一直累加订单号",moduleName:"单号设置",feature:"单号重置（按日/持续累加）",title:"单号重置",seq:131},{id:"s140-split-merge-edit-分单时分离相同菜",groupTitle:"分单合单与改单",groupKey:"split-merge-edit",sceneDesc:"设置订单进行分单时，相同菜品是否拆开",moduleName:"自定义单/套餐",feature:"（未填写）",title:"分单时分离相同菜",seq:140},{id:"s141-split-merge-edit-支持为已送厨的菜修改调味",groupTitle:"分单合单与改单",groupKey:"split-merge-edit",sceneDesc:"设置已经送厨的菜，是否可以再次修改调味",moduleName:"自定义单/套餐",feature:"（未填写）",title:"支持为已送厨的菜修改调味",seq:141},{id:"s147-order-settlement-总价四舍五入设置",groupTitle:"金额结算",groupKey:"order-settlement",sceneDesc:"设置订单总价四舍五入的方式",moduleName:"价格",feature:"（未填写）",title:"总价四舍五入设置",seq:147},{id:"s149-order-surcharge-合单时自动加收重算",groupTitle:"加收",groupKey:"order-surcharge",sceneDesc:"设置在多个订单进行合并订单时，加收费用是否根据合并后的订单金额进行重新计算",moduleName:"价格",feature:"（未填写）",title:"合单时自动加收重算",seq:149},{id:"s150-split-merge-edit-子单促销自动重算",groupTitle:"分单合单与改单",groupKey:"split-merge-edit",sceneDesc:"设置当一个母单拆分多个子单，子单参与促销活动时是否自动重新计算",moduleName:"价格",feature:"（未填写）",title:"子单促销自动重算",seq:150},{id:"s155-order-void-是否向厨房发送删单信息",groupTitle:"删退与作废",groupKey:"order-void",sceneDesc:"设置删除订单时，是否向厨房发送删单信息",moduleName:"删单",feature:"（未填写）",title:"是否向厨房发送删单信息?",seq:155},{id:"s156-order-void-订单失效原因",groupTitle:"删退与作废",groupKey:"order-void",sceneDesc:"设置删除订单需要填写的删除原因有哪些原因选项",moduleName:"删单",feature:"订单失效原因（删除原因枚举）",title:"订单失效原因",seq:156},{id:"s157-order-void-删单原因必填",groupTitle:"删退与作废",groupKey:"order-void",sceneDesc:"设置删除订单的原因是否是必选",moduleName:"删单",feature:"（未填写）",title:"删单原因必填",seq:157},{id:"s158-order-void-删除未付款单",groupTitle:"删退与作废",groupKey:"order-void",sceneDesc:"设置是否可以删除未付款的订单",moduleName:"删单",feature:"（未填写）",title:"删除未付款单",seq:158},{id:"s159-order-void-根据菜退款",groupTitle:"删退与作废",groupKey:"order-void",sceneDesc:"设置是否支持按照单个菜品进行退款",moduleName:"删单",feature:"（未填写）",title:"根据菜退款",seq:159},{id:"s161-order-surcharge-允许清除线上订单服务费",groupTitle:"加收",groupKey:"order-surcharge",sceneDesc:"设置是否允许清除Online Order订单渠道的加收服务费",moduleName:"加收",feature:"（未填写）",title:"允许清除线上订单服务费",seq:161},{id:"s162-order-discount-折扣原因必填",groupTitle:"折扣",groupKey:"order-discount",sceneDesc:"设置当服务员对订单进行折扣操作时，是否需要填写原因，原因是否必填",moduleName:"折扣",feature:"（未填写）",title:"折扣原因必填",seq:162},{id:"s163-order-discount-折扣原因",groupTitle:"折扣",groupKey:"order-discount",sceneDesc:"设置折扣原因的默认值",moduleName:"折扣",feature:"（未填写）",title:"折扣原因",seq:163},{id:"s164-order-discount-自定义折扣原因",groupTitle:"折扣",groupKey:"order-discount",sceneDesc:"是否支持自定义输入折扣原因",moduleName:"折扣",feature:"（未填写）",title:"自定义折扣原因",seq:164},{id:"s446-order-discount-折扣设置",groupTitle:"折扣",groupKey:"order-discount",sceneDesc:"折扣比率设置，用于对订单或者商品进行额外折扣的预设选择项目",moduleName:"折扣比率设置",feature:"折扣比率设置（预设折扣选项）",title:"折扣设置",seq:446},{id:"s447-order-surcharge-加收设置",groupTitle:"加收",groupKey:"order-surcharge",sceneDesc:"加收比率设置，用于对订单或者商品进行额外加收的预设选择项目",moduleName:"加收比率设置",feature:"加收比率设置（预设加收选项）",title:"加收设置",seq:447},{id:"s546-order-surcharge-根据订单中每个菜品打包盒默认加收",groupTitle:"加收",groupKey:"order-surcharge",sceneDesc:"设置默认哪些商品每个需要收取多少钱的额外费用",moduleName:"附加费设置",feature:"（未填写）",title:"根据订单中每个菜品打包盒默认加收",seq:546}]},"/permissions/settings":{hubTitle:"权限管理中心",settingsPath:"/permissions/settings",items:[{id:"s68-role-employee-permissions-在单子还没全部关闭的情况下-允许经理强制登出",groupTitle:"角色与员工权限",groupKey:"role-employee-permissions",sceneDesc:"",moduleName:"员工工时",feature:"（未填写）",title:"在单子还没全部关闭的情况下,允许经理强制登出",seq:68},{id:"s69-role-employee-permissions-在单子全部付完款的情况下-才允许企台登出",groupTitle:"角色与员工权限",groupKey:"role-employee-permissions",sceneDesc:"",moduleName:"员工工时",feature:"（未填写）",title:"在单子全部付完款的情况下,才允许企台登出",seq:69},{id:"s75-account-security-auth-自动登出时间-分钟",groupTitle:"账户安全与授权",groupKey:"account-security-auth",sceneDesc:"设置超过多久系统没有操作，自动退出登录",moduleName:"系统安全",feature:"（未填写）",title:"自动登出时间(分钟)",seq:75},{id:"s138-order-operation-guardrails-自定义点单",groupTitle:"下单操作限制与授权",groupKey:"order-operation-guardrails",sceneDesc:"设置是否支持自定义手动录入菜品功能",moduleName:"自定义单/套餐",feature:"自定义点单（手写录入菜品开关）",title:"自定义点单",seq:138},{id:"s166-account-security-auth-完成每次操作后账号自动登出",groupTitle:"账户安全与授权",groupKey:"account-security-auth",sceneDesc:"设置POS系统完成每次操作后账号是否自动登出",moduleName:"基本设置",feature:"（未填写）",title:"完成每次操作后账号自动登出",seq:166},{id:"s175-account-security-auth-登录忽略特殊符号",groupTitle:"账户安全与授权",groupKey:"account-security-auth",sceneDesc:"设置进行登录输入时是否允许输入特殊符号",moduleName:"基本设置",feature:"（未填写）",title:"登录忽略特殊符号",seq:175},{id:"s345-account-security-auth-送厨密码权限",groupTitle:"账户安全与授权",groupKey:"account-security-auth",sceneDesc:"设置Ipad上使用POS，送厨操作是否需要权限",moduleName:"基础设置",feature:"（未填写）",title:"送厨密码权限",seq:345},{id:"s346-account-security-auth-主页密码权限",groupTitle:"账户安全与授权",groupKey:"account-security-auth",sceneDesc:"设置Ipad上使用POS，进入主页是否需要权限",moduleName:"基础设置",feature:"（未填写）",title:"主页密码权限",seq:346},{id:"s349-role-employee-permissions-允许企台在电子菜单上点只读菜",groupTitle:"角色与员工权限",groupKey:"role-employee-permissions",sceneDesc:"设置Ipad上使用POS，是否允许企台在电子菜单上点只读菜",moduleName:"基础设置",feature:"（未填写）",title:"允许企台在电子菜单上点只读菜",seq:349},{id:"s369-role-employee-permissions-允许开钱箱的员工",groupTitle:"角色与员工权限",groupKey:"role-employee-permissions",sceneDesc:"设置哪些员工有权限打开钱箱",moduleName:"钱箱设置",feature:"（未填写）",title:"允许开钱箱的员工",seq:369},{id:"s426-role-employee-permissions-未填写",groupTitle:"角色与员工权限",groupKey:"role-employee-permissions",sceneDesc:"设置餐厅有哪些角色",moduleName:"角色",feature:"角色（门店角色主数据）",title:"（未填写）",seq:426},{id:"s563-guest-order-limits-用餐时长限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置哪个设备或者哪个桌子订单用餐总时长，超时后食客加菜需服务员授权",moduleName:"下单限制",feature:"（未填写）",title:"用餐时长限制",seq:563},{id:"s564-guest-order-limits-下单次数限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置哪个设备或者哪个桌子订单下单次数上限，超限后需服务员授权方可继续加菜",moduleName:"下单限制",feature:"（未填写）",title:"下单次数限制",seq:564},{id:"s565-guest-order-limits-每位食客每轮下单菜品数量限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置哪个设备或者哪个桌子每轮每食客下单菜品数量上限，超限后需服务员授权方可加菜",moduleName:"下单限制",feature:"（未填写）",title:"每位食客每轮下单菜品数量限制",seq:565},{id:"s566-guest-order-limits-菜单下单限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置菜品下单限制（可看不可点，下单需服务员授权）",moduleName:"权限设置",feature:"（未填写）",title:"菜单下单限制",seq:566},{id:"s568-guest-order-limits-订单下单数量限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置订单维度的下单数量限制，超限需服务员授权",moduleName:"权限设置",feature:"（未填写）",title:"订单下单数量限制",seq:568},{id:"s576-guest-order-limits-用餐时长限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置订单用餐总时长，超时后食客加菜需服务员授权",moduleName:"下单设置",feature:"（未填写）",title:"用餐时长限制",seq:576},{id:"s583-guest-order-limits-下单次数限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置订单下单次数上限，超限后需服务员授权方可继续点餐",moduleName:"下单设置",feature:"（未填写）",title:"下单次数限制",seq:583},{id:"s584-guest-order-limits-每人每轮-每轮下单菜品数量限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置每轮/每人每轮下单菜品数量上限，超限后需服务员授权",moduleName:"下单设置",feature:"（未填写）",title:"每人每轮/每轮下单菜品数量限制",seq:584},{id:"s585-guest-order-limits-每轮下单指定菜品数量限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置每轮指定菜品数量上限，超限后需服务员授权",moduleName:"下单设置",feature:"（未填写）",title:"每轮下单指定菜品数量限制",seq:585},{id:"s586-guest-order-limits-每位食客每轮下单菜品数量限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置每位食客每轮下单菜品数量上限，超限后需服务员授权",moduleName:"下单设置",feature:"（未填写）",title:"每位食客每轮下单菜品数量限制",seq:586},{id:"s587-guest-order-limits-每位食客每轮下单指定菜品数量限制",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置每位食客每轮指定菜品数量上限，超限后需服务员授权",moduleName:"下单设置",feature:"（未填写）",title:"每位食客每轮下单指定菜品数量限制",seq:587},{id:"s588-guest-order-limits-订单下单时间间隔",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置订单下单最小时间间隔，小于间隔时需服务员授权",moduleName:"下单设置",feature:"（未填写）",title:"订单下单时间间隔",seq:588},{id:"s589-guest-order-limits-间隔时间内允许加购",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置订单下单间隔时间内是否允许加购，以及触发授权的条件",moduleName:"下单设置",feature:"（未填写）",title:"间隔时间内允许加购",seq:589},{id:"s590-guest-order-limits-菜品下单时间间隔",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置菜品下单最小时间间隔，小于间隔时需服务员授权",moduleName:"下单设置",feature:"（未填写）",title:"菜品下单时间间隔",seq:590},{id:"s591-guest-order-limits-间隔时间内允许加购",groupTitle:"食客下单限制规则",groupKey:"guest-order-limits",sceneDesc:"设置菜品下单时间间隔内是否允许加入购物车，以及触发授权的条件",moduleName:"下单设置",feature:"（未填写）",title:"间隔时间内允许加购",seq:591},{id:"s594-order-operation-guardrails-需要权限下单的积分菜",groupTitle:"下单操作限制与授权",groupKey:"order-operation-guardrails",sceneDesc:"设置积分菜是否需要服务员输入密码兑换",moduleName:"下单设置",feature:"（未填写）",title:"需要权限下单的积分菜",seq:594},{id:"s595-order-operation-guardrails-允许可看不可点的菜添加至购物车",groupTitle:"下单操作限制与授权",groupKey:"order-operation-guardrails",sceneDesc:"设置是否允许可看不可点的菜添加至购物车，关闭时需密码授权",moduleName:"下单设置",feature:"（未填写）",title:"允许可看不可点的菜添加至购物车",seq:595},{id:"s596-order-operation-guardrails-可看不可点的菜弹出服务员授权",groupTitle:"下单操作限制与授权",groupKey:"order-operation-guardrails",sceneDesc:"设置可看不可点的菜是否弹出服务员授权",moduleName:"下单设置",feature:"（未填写）",title:"可看不可点的菜弹出服务员授权",seq:596},{id:"s620-order-operation-guardrails-限制食客提前开单",groupTitle:"下单操作限制与授权",groupKey:"order-operation-guardrails",sceneDesc:"设置是否允许食客直接点单（开启限制则需服务员授权并绑定小费）",moduleName:"用户设置",feature:"（未填写）",title:"限制食客提前开单",seq:620},{id:"s621-order-operation-guardrails-允许食客更改人数",groupTitle:"下单操作限制与授权",groupKey:"order-operation-guardrails",sceneDesc:"设置是否允许食客更改就餐人数。关闭后需要服务员输入密码更改当前桌人数",moduleName:"用户设置",feature:"（未填写）",title:"允许食客更改人数",seq:621},{id:"s626-order-operation-guardrails-下单前-需要服务员授权",groupTitle:"下单操作限制与授权",groupKey:"order-operation-guardrails",sceneDesc:"设置食客下单前是否需要服务员授权",moduleName:"用户设置",feature:"（未填写）",title:"下单前,需要服务员授权",seq:626},{id:"s627-order-operation-guardrails-下单前允许食客切换品类",groupTitle:"下单操作限制与授权",groupKey:"order-operation-guardrails",sceneDesc:"设置下单前是否允许食客切换品类（关闭时需授权）",moduleName:"用户设置",feature:"（未填写）",title:"下单前允许食客切换品类",seq:627},{id:"s646-account-security-auth-命中任意规则后-弹出密码授权",groupTitle:"账户安全与授权",groupKey:"account-security-auth",sceneDesc:"设置命中下单限制规则后是否弹出密码授权",moduleName:"授权设置",feature:"（未填写）",title:"命中任意规则后,弹出密码授权",seq:646}]},"/print-templates/settings":{hubTitle:"打印中心",settingsPath:"/print-templates/settings",groupOrder:["print-foundation-devices","order-receipt-trigger","payment-receipt-flow","receipt-print-execution","receipt-line-content","receipt-layout-format","packing-slip-print","ticket-number-slip"],items:[{id:"s34-packing-slip-print-打包单份数",groupTitle:"打包单打印",groupKey:"packing-slip-print",sceneDesc:"控制一个订单，打包单打印的份数是几份",moduleName:"打印设置",feature:"打包单打印份数",title:"打包单份数",seq:34},{id:"s167-print-foundation-devices-打印页高",groupTitle:"打印基础",groupKey:"print-foundation-devices",sceneDesc:"设置单张小票打印最长大小",moduleName:"基本设置",feature:"打印页高（小票最大长度）",title:"打印页高",seq:167},{id:"s246-payment-receipt-flow-按支付方式打印收据-使用以下支付方式时打印收据小票",groupTitle:"支付收据流程",groupKey:"payment-receipt-flow",sceneDesc:"按支付方式勾选：使用该方式完成支付后是否自动打印收据小票；已合并原 263（信用卡）、268（微信/阿里）。",moduleName:"付款收据",feature:"（未填写）",title:"按支付方式打印收据：使用以下支付方式时打印收据小票",seq:246},{id:"s247-payment-receipt-flow-打印持卡人姓名",groupTitle:"支付收据流程",groupKey:"payment-receipt-flow",sceneDesc:"开启后，信用卡支付签名收据上打印持卡人姓名。",moduleName:"付款收据",feature:"（未填写）",title:"打印持卡人姓名",seq:247},{id:"s250-payment-receipt-flow-删除信用卡支付时打印支付收据",groupTitle:"支付收据流程",groupKey:"payment-receipt-flow",sceneDesc:"开启后，删除/撤销信用卡支付时可按所选联次自动打印签购单（Customer copy / Merchant copy，可多选）。",moduleName:"付款收据",feature:"（未填写）",title:"删除信用卡支付时打印支付收据",seq:250},{id:"s256-print-foundation-devices-打印Logo",groupTitle:"打印基础",groupKey:"print-foundation-devices",sceneDesc:"设置哪种类型的收据上是否打印LOGO",moduleName:"基本设置",feature:"（未填写）",title:"打印Logo",seq:256},{id:"s259-print-foundation-devices-启用轮打",groupTitle:"打印基础",groupKey:"print-foundation-devices",sceneDesc:"设置当请求打印服务失败时，是否一直轮询请求打印机进行打印",moduleName:"基本设置",feature:"（未填写）",title:"启用轮打",seq:259},{id:"s261-payment-receipt-flow-付款前打印收据",groupTitle:"支付收据流程",groupKey:"payment-receipt-flow",sceneDesc:"设置订单支付前是否自动打印收据小票",moduleName:"打印设置",feature:"（未填写）",title:"付款前打印收据",seq:261},{id:"s262-receipt-print-execution-第一份收据份数",groupTitle:"收据打印执行",groupKey:"receipt-print-execution",sceneDesc:"首次打印订单收据的默认份数（触发后执行层，非票面字段）。",moduleName:"打印设置",feature:"（未填写）",title:"第一份收据份数",seq:262},{id:"s264-receipt-layout-format-重打收据显示日期",groupTitle:"收据版式与辅助",groupKey:"receipt-layout-format",sceneDesc:"设置重新打印收据是否显示打印日期",moduleName:"打印设置",feature:"（未填写）",title:"重打收据显示日期",seq:264},{id:"s265-print-foundation-devices-快速打印收据模式",groupTitle:"打印基础",groupKey:"print-foundation-devices",sceneDesc:"全局快速打印管线：缩短收据出纸等待，属打印引擎策略（非票面字段）；配置入口在打印基础。",moduleName:"打印设置",feature:"（未填写）",title:"快速打印收据模式",seq:265},{id:"s269-print-foundation-devices-打印前选择打印机",groupTitle:"打印基础",groupKey:"print-foundation-devices",sceneDesc:"按 POS / PayPad / POS Go 多选：对应产线出纸前是否弹出打印机选择；原 270（手持移动 POS）并入 POS Go 列。",moduleName:"打印设置",feature:"（未填写）",title:"打印前选择打印机",seq:269},{id:"s272-payment-receipt-flow-支付收据显示复选框",groupTitle:"支付收据流程",groupKey:"payment-receipt-flow",sceneDesc:"开启后，信用卡支付签名收据上显示复选框。",moduleName:"打印设置",feature:"（未填写）",title:"支付收据显示复选框",seq:272},{id:"s273-receipt-print-execution-收据单-仅打印新菜",groupTitle:"收据打印执行",groupKey:"receipt-print-execution",sceneDesc:"再次打印收据时是否仅输出本次新增菜品行。",moduleName:"打印设置",feature:"（未填写）",title:"收据单:仅打印新菜",seq:273},{id:"s274-receipt-line-content-收据-打印价格为0的子菜",groupTitle:"收据明细与价格",groupKey:"receipt-line-content",sceneDesc:"设置是否打印价格为0的子菜",moduleName:"打印设置",feature:"（未填写）",title:"收据:打印价格为0的子菜",seq:274},{id:"s275-receipt-line-content-收据-打印价格为0的菜",groupTitle:"收据明细与价格",groupKey:"receipt-line-content",sceneDesc:"设置是否打印价格为0的菜",moduleName:"收据排版",feature:"（未填写）",title:"收据:打印价格为0的菜",seq:275},{id:"s276-receipt-line-content-收据-打印调味-打折-加收价格",groupTitle:"收据明细与价格",groupKey:"receipt-line-content",sceneDesc:"设置是否打印调味/打折/加收价格",moduleName:"收据排版",feature:"（未填写）",title:"收据:打印调味/打折/加收价格",seq:276},{id:"s277-receipt-layout-format-收据-打印单号条形码",groupTitle:"收据版式与辅助",groupKey:"receipt-layout-format",sceneDesc:"设置是否打印单号条形码",moduleName:"收据排版",feature:"（未填写）",title:"收据:打印单号条形码",seq:277},{id:"s278-receipt-line-content-收据-打印价格为0的调味",groupTitle:"收据明细与价格",groupKey:"receipt-line-content",sceneDesc:"设置是否打印价格为0的调味",moduleName:"收据排版",feature:"（未填写）",title:"收据:打印价格为0的调味",seq:278},{id:"s279-receipt-layout-format-收据-打印自动加收提示",groupTitle:"收据版式与辅助",groupKey:"receipt-layout-format",sceneDesc:"设置是否打印自动加收提示",moduleName:"收据排版",feature:"（未填写）",title:"收据:打印自动加收提示",seq:279},{id:"s280-receipt-layout-format-收据-自动加收提示",groupTitle:"收据版式与辅助",groupKey:"receipt-layout-format",sceneDesc:"设置收据自动加收提示信息默认文案",moduleName:"收据排版",feature:"（未填写）",title:"收据:自动加收提示",seq:280},{id:"s281-packing-slip-print-收据单和打包单-打印-堂食-信息",groupTitle:"打包单打印",groupKey:"packing-slip-print",sceneDesc:"是否在收据单与打包单上打印「堂食」标识；打包单侧与本组其它打包项一并配置。",moduleName:"收据排版",feature:"（未填写）",title:'收据单和打包单:打印"堂食"信息',seq:281},{id:"s282-receipt-layout-format-收据-菜间距",groupTitle:"收据版式与辅助",groupKey:"receipt-layout-format",sceneDesc:"设置菜品之间的间距",moduleName:"收据排版",feature:"（未填写）",title:"收据:菜间距",seq:282},{id:"s283-receipt-line-content-收据-显示客人备注",groupTitle:"收据明细与价格",groupKey:"receipt-line-content",sceneDesc:"设置是否显示客人备注",moduleName:"收据排版",feature:"（未填写）",title:"收据:显示客人备注",seq:283},{id:"s284-receipt-line-content-收据-打印厨房名称",groupTitle:"收据明细与价格",groupKey:"receipt-line-content",sceneDesc:"设置是否打印厨房名称",moduleName:"收据排版",feature:"（未填写）",title:"收据:打印厨房名称",seq:284},{id:"s285-receipt-line-content-收据-显示打折菜的原价",groupTitle:"收据明细与价格",groupKey:"receipt-line-content",sceneDesc:"设置是否显示打折菜的原价",moduleName:"收据排版",feature:"（未填写）",title:"收据:显示打折菜的原价",seq:285},{id:"s286-receipt-layout-format-收据-显示分割线",groupTitle:"收据版式与辅助",groupKey:"receipt-layout-format",sceneDesc:"设置是否显示分割线",moduleName:"收据排版",feature:"（未填写）",title:"收据:显示分割线",seq:286},{id:"s289-receipt-line-content-收据单-打印菜品数量",groupTitle:"收据明细与价格",groupKey:"receipt-line-content",sceneDesc:"设置是否打印菜品数量",moduleName:"收据排版",feature:"（未填写）",title:"收据单:打印菜品数量",seq:289},{id:"s291-ticket-number-slip-以下情况打印单号小票",groupTitle:"单号小票",groupKey:"ticket-number-slip",sceneDesc:"设置哪种订单状态打印单号的小票",moduleName:"单号设置",feature:"（未填写）",title:"以下情况打印单号小票",seq:291},{id:"s292-ticket-number-slip-单号小票打印份数",groupTitle:"单号小票",groupKey:"ticket-number-slip",sceneDesc:"设置打印单号小票的份数",moduleName:"单号设置",feature:"（未填写）",title:"单号小票打印份数",seq:292},{id:"s297-packing-slip-print-打包单-显示价格",groupTitle:"打包单打印",groupKey:"packing-slip-print",sceneDesc:"设置打包单是否显示价格",moduleName:"打包单设置",feature:"（未填写）",title:"打包单:显示价格",seq:297},{id:"s303-packing-slip-print-打包单-删除菜品样式",groupTitle:"打包单打印",groupKey:"packing-slip-print",sceneDesc:"设置被删除的菜品展示什么样式进行标记",moduleName:"打包单设置",feature:"（未填写）",title:"打包单:删除菜品样式",seq:303},{id:"s500-order-receipt-trigger-部分付款自动打印纸质订单收据",groupTitle:"订单收据触发",groupKey:"order-receipt-trigger",sceneDesc:"按产线配置：订单部分付款后是否在门店收据机自动打印纸质订单收据（订单明细单，非签购单）。",moduleName:"收据",feature:"（未填写）",title:"部分付款自动打印纸质订单收据",seq:500},{id:"s654-order-receipt-trigger-下单后自动打印纸质订单收据",groupTitle:"订单收据触发",groupKey:"order-receipt-trigger",sceneDesc:"按产线（POS/Kiosk/eMenu/PayPad）配置：订单提交成功后，是否在门店绑定的收据打印机自动打印纸质订单收据。",moduleName:"收据",feature:"（未填写）",title:"下单后自动打印纸质订单收据",seq:654}]},"/product-center-main/settings":{hubTitle:"商品中心",settingsPath:"/product-center-main/settings",groupOrder:["combo-ordering"],items:[{id:"s139-combo-ordering-自动点完套餐",groupTitle:"套餐点单与展示",groupKey:"combo-ordering",sceneDesc:"",moduleName:"自定义单/套餐",feature:"（未填写）",title:"自动点完套餐",seq:139},{id:"s145-combo-ordering-当套餐价钱规则是可调时-显示套餐子菜价格",groupTitle:"套餐点单与展示",groupKey:"combo-ordering",sceneDesc:"设置当套餐价钱规则是可调整时,是否显示套餐子菜价格",moduleName:"价格",feature:"（未填写）",title:"当套餐价钱规则是可调时,显示套餐子菜价格",seq:145}]},"/promotions/lottery":{hubTitle:"促销中心",settingsPath:"/promotions/lottery",groupOrder:["lottery-activity-settings","lottery-animation-settings"],items:[{id:"s647-lottery-activity-settings-抽奖活动",groupTitle:"抽奖活动设置",groupKey:"lottery-activity-settings",sceneDesc:"开启后，满足条件后可参与抽奖活动",moduleName:"抽奖活动",feature:"（未填写）",title:"抽奖活动",seq:647},{id:"s672-lottery-animation-settings-自定义抽奖动画",groupTitle:"抽奖动画设置",groupKey:"lottery-animation-settings",sceneDesc:"开启后，支持上传视频和GIF格式抽奖动画视频",moduleName:"抽奖活动",feature:"（未填写）",title:"自定义抽奖动画",seq:672}]},"/reports/settings":{hubTitle:"报表中心",settingsPath:"/reports/settings",items:[{id:"s308-report-basics-export-报表标题",groupTitle:"报表基础口径与导出",groupKey:"report-basics-export",sceneDesc:"设置报表的标题展示",moduleName:"基本设置",feature:"（未填写）",title:"报表标题",seq:308},{id:"s311-report-basics-export-每周起始日",groupTitle:"报表基础口径与导出",groupKey:"report-basics-export",sceneDesc:"设置每周的第一天是周几",moduleName:"基本设置",feature:"（未填写）",title:"每周起始日",seq:311},{id:"s312-report-basics-export-云报表",groupTitle:"报表基础口径与导出",groupKey:"report-basics-export",sceneDesc:"是否启用云报表",moduleName:"基本设置",feature:"（未填写）",title:"云报表",seq:312},{id:"s313-summary-report-fields-总报表页脚表格列数",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表页脚表格列数",moduleName:"报表界面",feature:"（未填写）",title:"总报表页脚表格列数",seq:313},{id:"s314-summary-report-fields-总报表页脚表格行数",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表页脚表格行数",moduleName:"报表界面",feature:"（未填写）",title:"总报表页脚表格行数",seq:314},{id:"s315-summary-report-fields-总报表-显示礼品卡-会员卡销售情况",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示礼品卡/会员卡销售情况",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示礼品卡/会员卡销售情况",seq:315},{id:"s316-summary-report-fields-总报表-显示运营详情",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示运营详情",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示运营详情",seq:316},{id:"s317-summary-report-fields-总报表-直到营业结束才把企台现金收入算入店内现金",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否直到营业结束才把企台现金收入算入店内现金",moduleName:"总报表",feature:"（未填写）",title:"总报表:直到营业结束才把企台现金收入算入店内现金",seq:317},{id:"s318-summary-report-fields-总报表-显示礼品卡-会员卡充值情况",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示礼品卡/会员卡充值情况",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示礼品卡/会员卡充值情况",seq:318},{id:"s319-summary-report-fields-总报表-显示现金平账详情",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示现金平账详情",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示现金平账详情",seq:319},{id:"s320-summary-report-fields-总报表-显示钱箱内应有金额",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示钱箱内应有金额",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示钱箱内应有金额",seq:320},{id:"s321-summary-report-fields-总报表-显示删单详情",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示删单详情",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示删单详情",seq:321},{id:"s322-summary-report-fields-总报表-显示打折-加收详情",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示打折/加收详情",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示打折/加收详情",seq:322},{id:"s323-summary-report-fields-总报表-显示菜单组销售信息",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示菜单组销售信息",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示菜单组销售信息",seq:323},{id:"s324-summary-report-fields-总报表-显示区域销售详情",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示区域销售详情",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示区域销售详情",seq:324},{id:"s325-summary-report-fields-总报表-显示特殊折扣-损耗金额",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示特殊折扣/损耗金额",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示特殊折扣/损耗金额",seq:325},{id:"s326-summary-report-fields-总报表-显示单菜成本详情",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示单菜成本详情",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示单菜成本详情",seq:326},{id:"s327-summary-report-fields-总报表-显示绩效指数",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表是否显示绩效指数",moduleName:"总报表",feature:"（未填写）",title:"总报表:显示绩效指数",seq:327},{id:"s328-summary-report-fields-总报表-报表默认的订单类型选择",groupTitle:"总报表字段与核算项",groupKey:"summary-report-fields",sceneDesc:"设置总报表默认的订单类型选择",moduleName:"总报表",feature:"（未填写）",title:"总报表:报表默认的订单类型选择",seq:328},{id:"s424-report-basics-export-打印所有选择日期内的收据",groupTitle:"报表基础口径与导出",groupKey:"report-basics-export",sceneDesc:"打印所有选择日期内的收据",moduleName:"数据管理",feature:"（未填写）",title:"打印所有选择日期内的收据",seq:424},{id:"s435-topic-analysis-reports-销售额报表",groupTitle:"专题分析报表",groupKey:"topic-analysis-reports",sceneDesc:"销售额报表",moduleName:"销售",feature:"（未填写）",title:"销售额报表",seq:435},{id:"s436-topic-analysis-reports-工资报表",groupTitle:"专题分析报表",groupKey:"topic-analysis-reports",sceneDesc:"工资报表",moduleName:"工资",feature:"（未填写）",title:"工资报表",seq:436},{id:"s453-topic-analysis-reports-未填写",groupTitle:"专题分析报表",groupKey:"topic-analysis-reports",sceneDesc:"信用卡支付收取的订单手续费报表",moduleName:"报表",feature:"（未填写）",title:"（未填写）",seq:453}]},"/reviews/settings":{hubTitle:"评价中心",settingsPath:"/reviews/settings",groupOrder:["review-content-moderation"],items:[{id:"s421-review-content-moderation-删除菜品评价",groupTitle:"评价内容治理",groupKey:"review-content-moderation",sceneDesc:"批量删除菜品评价数据（评价/UGC 治理，配置入口在评价中心设置）",moduleName:"其他",feature:"（未填写）",title:"删除菜品评价",seq:421}]},"/settings/basic":{hubTitle:"系统设置",settingsPath:"/settings/basic",items:[{id:"s109-language-localization-系统默认语言",groupTitle:"语言与本地化",groupKey:"language-localization",sceneDesc:"设置终端系统的默认语言，比如默认英文，默认中文",moduleName:"基础设置",feature:"（未填写）",title:"系统默认语言",seq:109},{id:"s165-ui-operation-preferences-默认主界面",groupTitle:"界面与操作偏好",groupKey:"ui-operation-preferences",sceneDesc:"设置POS系统的默认主界面是哪一个页面",moduleName:"基本设置",feature:"默认主界面（POS启动落地页）",title:"默认主界面",seq:165},{id:"s168-ui-operation-preferences-时间显示24小时制",groupTitle:"界面与操作偏好",groupKey:"ui-operation-preferences",sceneDesc:"设置时间显示是否是24小时制",moduleName:"基本设置",feature:"（未填写）",title:"时间显示24小时制",seq:168},{id:"s174-ui-operation-preferences-菜单模式",groupTitle:"界面与操作偏好",groupKey:"ui-operation-preferences",sceneDesc:"设置点单获取的菜单是哪一套菜单（POS菜单还是eMenu菜单）",moduleName:"基本设置",feature:"菜单模式（POS菜单/eMenu菜单）",title:"菜单模式",seq:174},{id:"s182-map-address-services-地址自动填充城市和邮编",groupTitle:"地址与地图服务",groupKey:"map-address-services",sceneDesc:"设置输入地址是否自动填充城市和邮编",moduleName:"地图",feature:"谷歌地图地址自动填充",title:"地址自动填充城市和邮编",seq:182},{id:"s183-map-address-services-谷歌地图地址自动填充",groupTitle:"地址与地图服务",groupKey:"map-address-services",sceneDesc:"设置输入地址是否自动填充城市和邮编",moduleName:"地图",feature:"（未填写）",title:"谷歌地图地址自动填充",seq:183},{id:"s187-advanced-service-switches-MEV模式",groupTitle:"高级服务与运行模式",groupKey:"advanced-service-switches",sceneDesc:"是否启用MEV模式...",moduleName:"高级设置",feature:"（未填写）",title:"MEV模式",seq:187},{id:"s188-advanced-service-switches-打印测试模式",groupTitle:"高级服务与运行模式",groupKey:"advanced-service-switches",sceneDesc:"是否启用打印测试模式，设置打印模式，则下单不会打印任何收据",moduleName:"高级设置",feature:"（未填写）",title:"打印测试模式",seq:188},{id:"s189-advanced-service-switches-前端操作记录模式",groupTitle:"高级服务与运行模式",groupKey:"advanced-service-switches",sceneDesc:"是否启用前端操作记录模式",moduleName:"高级设置",feature:"（未填写）",title:"前端操作记录模式",seq:189},{id:"s190-advanced-service-switches-启用MenusifuAviato服务",groupTitle:"高级服务与运行模式",groupKey:"advanced-service-switches",sceneDesc:"是否启用MenusifuAviato服务",moduleName:"高级设置",feature:"（未填写）",title:"启用MenusifuAviato服务",seq:190},{id:"s191-advanced-service-switches-启用Menusifu公开接口服务",groupTitle:"高级服务与运行模式",groupKey:"advanced-service-switches",sceneDesc:"是否启用Menusifu公开接口服务",moduleName:"高级设置",feature:"（未填写）",title:"启用Menusifu公开接口服务",seq:191},{id:"s192-advanced-service-switches-启用云等位服务",groupTitle:"高级服务与运行模式",groupKey:"advanced-service-switches",sceneDesc:"是否启用云等位服务",moduleName:"高级设置",feature:"（未填写）",title:"启用云等位服务",seq:192},{id:"s344-advanced-service-switches-上传POS心跳的时间间隔-单位-秒",groupTitle:"高级服务与运行模式",groupKey:"advanced-service-switches",sceneDesc:"设置上传POS心跳的时间间隔",moduleName:"高级设置",feature:"（未填写）",title:"上传POS心跳的时间间隔(单位:秒)",seq:344},{id:"s422-data-maintenance-backup-清除交易",groupTitle:"数据维护与备份",groupKey:"data-maintenance-backup",sceneDesc:"设置餐厅数据保存时长",moduleName:"数据管理",feature:"数据管理（数据保存时长）",title:"清除交易",seq:422},{id:"s423-data-maintenance-backup-备份数据",groupTitle:"数据维护与备份",groupKey:"data-maintenance-backup",sceneDesc:"备份餐厅数据",moduleName:"数据管理",feature:"（未填写）",title:"备份数据",seq:423}]},"/settings/integrations":{hubTitle:"平台业务中心",settingsPath:"/settings/integrations",groupOrder:["integrations","online-order-service","高级设置","LevelUp","7shifts","Ingenico-Blu","WorldPay"],items:[{id:"s78-integrations-同步云员工系统",groupTitle:"外部系统对接",groupKey:"integrations",sceneDesc:"",moduleName:"其他",feature:"（未填写）",title:"同步云员工系统",seq:78},{id:"s79-integrations-云员工管理系统地址",groupTitle:"外部系统对接",groupKey:"integrations",sceneDesc:"",moduleName:"其他",feature:"（未填写）",title:"云员工管理系统地址",seq:79},{id:"s80-integrations-第三方排班表链接",groupTitle:"外部系统对接",groupKey:"integrations",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"第三方排班表链接",seq:80},{id:"s81-integrations-第三方打卡记录链接",groupTitle:"外部系统对接",groupKey:"integrations",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"第三方打卡记录链接",seq:81},{id:"s93-online-order-service-网上点餐免开端口设置",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"基础设置",feature:"网上点餐免开端口设置",title:"网上点餐免开端口设置",seq:93},{id:"s95-online-order-service-Online-order-service-host",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"Online order service host",seq:95},{id:"s96-online-order-service-Online-order-service-merchant-ID",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"Online order service merchant ID",seq:96},{id:"s97-online-order-service-Online-order-service-external-port-number",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"Online order service external port number",seq:97},{id:"s99-online-order-service-callback-remotehost",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"callback remotehost",seq:99},{id:"s100-online-order-service-callback-remoteport",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"callback remoteport",seq:100},{id:"s101-online-order-service-callback-lan-host",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"callback lan host",seq:101},{id:"s102-online-order-service-callback-lan-port",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"callback lan port",seq:102},{id:"s103-online-order-service-callback-service-delay-seconds-to-start",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"callback service delay seconds to start",seq:103},{id:"s104-online-order-service-callback-service-interval-seconds-to-repeat",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"callback service interval seconds to repeat",seq:104},{id:"s105-online-order-service-callback-service-hash1-to-connect",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"callback service hash1 to connect",seq:105},{id:"s106-online-order-service-callback-service-hash2-to-connect",groupTitle:"线上订餐服务对接",groupKey:"online-order-service",sceneDesc:"",moduleName:"高级设置",feature:"（未填写）",title:"callback service hash2 to connect",seq:106},{id:"s343-高级设置-Datahub-订单报告配置",groupTitle:"高级设置",groupKey:"高级设置",sceneDesc:"设置Datahub订单报告配置",moduleName:"高级设置",feature:"（未填写）",title:"Datahub（订单报告配置）",seq:343},{id:"s457-LevelUp-LevelUp对接",groupTitle:"LevelUp",groupKey:"LevelUp",sceneDesc:"第三方会员/储值系统对接",moduleName:"LevelUp",feature:"（未填写）",title:"LevelUp对接",seq:457},{id:"s458-7shifts-7shifts对接",groupTitle:"7shifts",groupKey:"7shifts",sceneDesc:"",moduleName:"7shifts",feature:"（未填写）",title:"7shifts对接",seq:458},{id:"s459-Ingenico-Blu-Ingenico-Bluetooth-对接",groupTitle:"Ingenico-Blu",groupKey:"Ingenico-Blu",sceneDesc:"",moduleName:"Ingenico-Bluetooth",feature:"（未填写）",title:"Ingenico-Bluetooth 对接",seq:459},{id:"s460-WorldPay-WorldPay-对接",groupTitle:"WorldPay",groupKey:"WorldPay",sceneDesc:"",moduleName:"WorldPay",feature:"（未填写）",title:"WorldPay 对接",seq:460}]},"/stores/settings":{hubTitle:"门店管理",settingsPath:"/stores/settings",groupOrder:["store-profile","store-hours-operation","brand-menu-presentation","address-data-maintenance"],items:[{id:"s77-store-hours-operation-营业周期",groupTitle:"营业与运营",groupKey:"store-hours-operation",sceneDesc:"",moduleName:"其他",feature:"（未填写）",title:"营业周期",seq:77},{id:"s170-store-hours-operation-餐厅模式选择",groupTitle:"营业与运营",groupKey:"store-hours-operation",sceneDesc:"设置餐厅是堂吃店还是快餐店",moduleName:"基本设置",feature:"（未填写）",title:"餐厅模式选择",seq:170},{id:"s173-store-profile-国家-州-省份-地区",groupTitle:"门店档案",groupKey:"store-profile",sceneDesc:"设置系统的国家是美国还是加拿大使用",moduleName:"基本设置",feature:"（未填写）",title:"国家-州/省份/地区",seq:173},{id:"s417-store-profile-基本信息",groupTitle:"门店档案",groupKey:"store-profile",sceneDesc:"餐厅的基本信息",moduleName:"餐馆信息",feature:"餐馆信息（基本信息）",title:"基本信息",seq:417},{id:"s418-store-hours-operation-营业时段",groupTitle:"营业与运营",groupKey:"store-hours-operation",sceneDesc:"餐厅的营业时间段设置",moduleName:"营业时段",feature:"（未填写）",title:"营业时段",seq:418},{id:"s419-address-data-maintenance-上传地址数据",groupTitle:"地址数据维护",groupKey:"address-data-maintenance",sceneDesc:"批量上传地址数据（门店运维；若为外送顾客地址库则归属外卖/来取，待产品确认）",moduleName:"其他",feature:"（未填写）",title:"上传地址数据",seq:419},{id:"s420-address-data-maintenance-删除地址数据",groupTitle:"地址数据维护",groupKey:"address-data-maintenance",sceneDesc:"批量删除地址数据（门店运维；若为外送顾客地址库则归属外卖/来取，待产品确认）",moduleName:"其他",feature:"（未填写）",title:"删除地址数据",seq:420},{id:"s530-brand-menu-presentation-品牌设置",groupTitle:"品牌与菜单展示",groupKey:"brand-menu-presentation",sceneDesc:"设置菜单是否按多品牌分类展示（先选品牌再点餐）",moduleName:"展示设置",feature:"（未填写）",title:"品牌设置",seq:530},{id:"s547-brand-menu-presentation-品牌管理",groupTitle:"品牌与菜单展示",groupKey:"brand-menu-presentation",sceneDesc:"配置一个门店有哪些品牌，并为每个品牌绑定营业时间与菜单（原 seq 548 并入）",moduleName:"品牌管理",feature:"（未填写）",title:"品牌管理",seq:547},{id:"s582-store-hours-operation-营业时间即将结束提示",groupTitle:"营业与运营",groupKey:"store-hours-operation",sceneDesc:"设置营业时间结束前多少分钟进行提示",moduleName:"下单设置",feature:"（未填写）",title:"营业时间即将结束提示",seq:582}]},"/team/settings":{hubTitle:"团队管理",settingsPath:"/team/settings",items:[{id:"s66-time-attendance-员工强制休息时长-分钟",groupTitle:"考勤与工时",groupKey:"time-attendance",sceneDesc:"设置员工强制休息的时长",moduleName:"员工工时",feature:"（未填写）",title:"员工强制休息时长(分钟)",seq:66},{id:"s67-time-attendance-员工持续工作时长上限",groupTitle:"考勤与工时",groupKey:"time-attendance",sceneDesc:"设置员工持续工作时长上限",moduleName:"员工工时",feature:"（未填写）",title:"员工持续工作时长上限",seq:67},{id:"s70-time-attendance-下班打卡打印确认小票",groupTitle:"考勤与工时",groupKey:"time-attendance",sceneDesc:"控制打卡打印小票是仅打印工作时间还是打印工作时间和小费",moduleName:"员工工时",feature:"下班打卡打印确认小票内容（工时/小费）",title:"下班打卡打印确认小票",seq:70},{id:"s71-time-attendance-员工最长工作时间-小时",groupTitle:"考勤与工时",groupKey:"time-attendance",sceneDesc:"控制员工最长工作时间(小时)",moduleName:"员工工时",feature:"（未填写）",title:"员工最长工作时间(小时)",seq:71},{id:"s72-time-attendance-重置开工-每日-HH-mm",groupTitle:"考勤与工时",groupKey:"time-attendance",sceneDesc:"",moduleName:"员工工时",feature:"（未填写）",title:"重置开工(每日,HH:mm)",seq:72},{id:"s73-time-attendance-自动收工打卡",groupTitle:"考勤与工时",groupKey:"time-attendance",sceneDesc:"",moduleName:"员工工时",feature:"（未填写）",title:"自动收工打卡",seq:73},{id:"s74-scheduling-是否启用打卡依赖排班",groupTitle:"排班",groupKey:"scheduling",sceneDesc:"",moduleName:"员工工时",feature:"（未填写）",title:"是否启用打卡依赖排班",seq:74},{id:"s186-payroll-tips-分享小费金额计算-按照",groupTitle:"薪酬与小费",groupKey:"payroll-tips",sceneDesc:"设置分享小费金额计算基数（Net Sales / Grand Total / Account Receivable / Only Gratuity）",moduleName:"分享小费",feature:"（未填写）",title:"分享小费金额计算:按照",seq:186},{id:"s241-time-attendance-Batch-前检查未打下班卡",groupTitle:"考勤与工时",groupKey:"time-attendance",sceneDesc:"Batch/关账前是否检查仍有员工未打下班卡（考勤门禁）。考勤规则 SSOT 在团队管理；支付中心 Batch 流程会引用本开关。",moduleName:"基本设置",feature:"（未填写）",title:"Batch 前检查未打下班卡",seq:241},{id:"s306-payroll-tips-分摊小费比例",groupTitle:"薪酬与小费",groupKey:"payroll-tips",sceneDesc:"设置每个员工小费的分配获得比例",moduleName:"基本设置",feature:"（未填写）",title:"分摊小费比例(%)",seq:306},{id:"s309-payroll-tips-小费计算标准",groupTitle:"薪酬与小费",groupKey:"payroll-tips",sceneDesc:"设置员工的小费计算标准按照上班工时进行计算还是其他的计算方式",moduleName:"基本设置",feature:"（未填写）",title:"小费计算标准",seq:309},{id:"s310-payroll-tips-工资计算标准",groupTitle:"薪酬与小费",groupKey:"payroll-tips",sceneDesc:"设置员工的工资计算标准是按照什么规则",moduleName:"基本设置",feature:"（未填写）",title:"工资计算标准",seq:310},{id:"s329-time-attendance-员工报表-带薪休息时长-分钟",groupTitle:"考勤与工时",groupKey:"time-attendance",sceneDesc:"设置员工带薪休息的时长",moduleName:"员工报表",feature:"（未填写）",title:"员工报表:带薪休息时长(分钟)",seq:329}]},"/transactions/settings":{hubTitle:"支付中心",settingsPath:"/transactions/settings",groupOrder:["payment-gateway","payment-methods","tax-rules","tip-policy","batch-settlement","card-fees","checkout-tip-card-order","cds-checkout-ux"],items:[{id:"s9-checkout-tip-card-order-小费与刷卡顺序",groupTitle:"小费与刷卡顺序",groupKey:"checkout-tip-card-order",sceneDesc:"控制 CDS、Kiosk、PayPad 在卡付结账时，小费选择页与刷卡步骤的先后顺序；各产线可独立配置。原 495/663 已合并。",moduleName:"客显屏",feature:"客显屏小费与刷卡流程顺序",title:"小费与刷卡顺序",seq:9},{id:"s82-card-fees-会员卡最低消费金额",groupTitle:"卡支付规则与合规",groupKey:"card-fees",sceneDesc:"订单金额低于该值时不可使用会员卡支付；0 表示不限制。与 242 信用卡最低消费同类，属支付门槛规则（v1.2 自会员中心迁入）。",moduleName:"基础设置",feature:"（未填写）",title:"会员卡最低消费金额",seq:82},{id:"s142-tax-rules-加收费用要算税",groupTitle:"税务规则",groupKey:"tax-rules",sceneDesc:"加收类费用（如服务费、附加费）是否计入应税销售额。与 seq 160「服务费是否按税后金额计算」不同。",moduleName:"税",feature:"（未填写）",title:"加收费用要算税",seq:142},{id:"s143-tax-rules-根据折扣后价格算税",groupTitle:"税务规则",groupKey:"tax-rules",sceneDesc:"应税金额是否扣除订单折扣。未免税的订单在确定税基后乘以基础税率。",moduleName:"税",feature:"（未填写）",title:"根据折扣后价格算税",seq:143},{id:"s144-tax-rules-外送-外卖单免税",groupTitle:"税务规则",groupKey:"tax-rules",sceneDesc:"按订单履约方式豁免：外送/外带订单是否不计销售税（与折前/折后税基 143 正交）。",moduleName:"税",feature:"（未填写）",title:"外送/外卖单免税",seq:144},{id:"s160-tax-rules-服务费按税后金额计算",groupTitle:"税务规则",groupKey:"tax-rules",sceneDesc:"服务费/加收的计算基数是否包含已算税额。与 seq 142「加收是否要交税」不同。",moduleName:"加收",feature:"（未填写）",title:"服务费按税后金额计算",seq:160},{id:"s172-card-fees-收据未付价格显示",groupTitle:"卡支付规则与合规",groupKey:"card-fees",sceneDesc:"未结清订单在收据上展示现金价、信用卡价或其它价；属卡付/双轨定价呈现，配置入口在支付中心。",moduleName:"基本设置",feature:"（未填写）",title:"收据未付价格显示",seq:172},{id:"s180-card-fees-Merchantcopy电子签名存储天数",groupTitle:"卡支付规则与合规",groupKey:"card-fees",sceneDesc:"设置商互联Merchantcopy信用卡电子签名收据存储天数",moduleName:"信用卡",feature:"（未填写）",title:"Merchantcopy电子签名存储天数",seq:180},{id:"s229-payment-gateway-Payment-Service-设置",groupTitle:"支付网关与受理",groupKey:"payment-gateway",sceneDesc:"设置刷卡机的类型、商家名称、商家ID、账户密码等信息",moduleName:"Payment Service Settings",feature:"（未填写）",title:"Payment Service 设置",seq:229},{id:"s230-batch-settlement-收单结算周期-结算天数",groupTitle:"BATCH与日结",groupKey:"batch-settlement",sceneDesc:"卡交易 Batch 提交后，多少天向收单行/支付通道自动结算付款（结算周期，非每日关账时刻）。",moduleName:"基本设置",feature:"（未填写）",title:"收单结算周期（结算天数）",seq:230},{id:"s231-tip-policy-POS-服务员小费录入方式",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"控制服务员在 POS 结账时如何录入小费：仅手输、预设+手输、或不允许。与结账页预设小费（237）、收据建议（295/296）相互独立。",moduleName:"基本设置",feature:"（未填写）",title:"POS 服务员小费录入方式",seq:231},{id:"s232-tip-policy-小费提醒比例",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"开启后，当小费超过订单金额指定占比时向操作员发出异常提示；关闭则不校验。",moduleName:"基本设置",feature:"（未填写）",title:"小费提醒比例",seq:232},{id:"s234-payment-methods-支付方式",groupTitle:"支付方式",groupKey:"payment-methods",sceneDesc:"以支付方式为维度：内置现金/信用卡/礼品卡/会员卡/微信/阿里，每种方式勾选适用的 POS、Kiosk、eMenu、Paypad 产线；支持新增自定义。",moduleName:"基本设置",feature:"（未填写）",title:"支付方式",seq:234},{id:"s235-batch-settlement-批量结算后打印报告",groupTitle:"BATCH与日结",groupKey:"batch-settlement",sceneDesc:"Batch 完成后自动打印的报告类型（信用卡报告单或结算单）；属 Batch 后置动作，非日常现金日结打印（见财务 330）。",moduleName:"基本设置",feature:"（未填写）",title:"批量结算后打印报告",seq:235},{id:"s236-batch-settlement-未batch订单数量上限",groupTitle:"BATCH与日结",groupKey:"batch-settlement",sceneDesc:"未执行 Batch 的订单数量达到上限时的处理策略阈值。",moduleName:"基本设置",feature:"（未填写）",title:"未batch订单数量上限",seq:236},{id:"s237-tip-policy-结账页预设小费",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"定义结账页可选的预设小费按钮（百分比或固定金额，可新增/删除）。与「POS 服务员小费录入方式」是否允许选手输/预设无关，可单独维护。",moduleName:"基本设置",feature:"（未填写）",title:"结账页预设小费",seq:237},{id:"s238-batch-settlement-自动关账时间-每日-Batch-日切",groupTitle:"BATCH与日结",groupKey:"batch-settlement",sceneDesc:"门店营业日结束、自动触发关账/Batch 的每日时刻（日切调度）。与 230「收单结算周期（结算天数）」不同；现金日结/班结见财务中心 171/65/330。",moduleName:"基本设置",feature:"（未填写）",title:"自动关账时间（每日 Batch 日切）",seq:238},{id:"s239-batch-settlement-含未付款-现金部分付款订单时允许batch",groupTitle:"BATCH与日结",groupKey:"batch-settlement",sceneDesc:"存在未付清或仅现金部分支付的订单时，是否仍允许执行 Batch。",moduleName:"基本设置",feature:"（未填写）",title:"含未付款/现金部分付款订单时允许batch",seq:239},{id:"s240-batch-settlement-Batch前自动处理超时支付单据",groupTitle:"BATCH与日结",groupKey:"batch-settlement",sceneDesc:"Batch 执行前是否自动处理超时未完成的支付单据。",moduleName:"基本设置",feature:"（未填写）",title:"Batch前自动处理超时支付单据",seq:240},{id:"s242-card-fees-信用卡最低消费金额",groupTitle:"卡支付规则与合规",groupKey:"card-fees",sceneDesc:"各产线（POS/Kiosk/eMenu/Paypad）订单金额低于该值时不可选择信用卡；0 表示不限制。原 512 已合并。",moduleName:"信用卡",feature:"（未填写）",title:"信用卡最低消费金额",seq:242},{id:"s243-card-fees-信用卡签名最低金额",groupTitle:"卡支付规则与合规",groupKey:"card-fees",sceneDesc:"各产线（POS/Kiosk/eMenu/Paypad）卡交易金额达到该值时要求电子签名；低于该值且终端已开启签名页时可跳过。",moduleName:"信用卡",feature:"（未填写）",title:"信用卡签名最低金额",seq:243},{id:"s244-tip-policy-隐藏现金小费",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"信用卡结账流程中是否隐藏现金小费选项（非关闭小费能力，见「POS 服务员小费录入方式」）。",moduleName:"信用卡",feature:"（未填写）",title:"隐藏现金小费",seq:244},{id:"s252-tip-policy-小费",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"订单收据上小费行的打印时机（与结账页小费收取解耦）；配置入口在支付中心 · 小费政策。",moduleName:"付款收据",feature:"（未填写）",title:"小费",seq:252},{id:"s253-tip-policy-多次支付时基于整单金额收小费",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"订单分多次支付时，小费是否仍按整单金额计算（而非仅按当次支付金额）。",moduleName:"付款收据",feature:"（未填写）",title:"多次支付时基于整单金额收小费",seq:253},{id:"s266-tip-policy-小费-收据打印建议小费",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"是否在食客订单收据上打印建议小费行；档位预设见同组 295/296。",moduleName:"打印设置",feature:"（未填写）",title:"小费（收据打印建议小费）",seq:266},{id:"s290-tax-rules-依据税别设定自动调整折扣-加收打印位置",groupTitle:"税务规则",groupKey:"tax-rules",sceneDesc:"是否按税别自动调整折扣/加收在收据上的打印位置；税基规则见同组基础税率与折前折后。",moduleName:"收据排版",feature:"（未填写）",title:"依据税别设定自动调整折扣/加收打印位置",seq:290},{id:"s293-tip-policy-税前计算小费金额",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"小费百分比所乘的订单金额是否含税。与税务组 seq 143「税基是否折后」不同。",moduleName:"小费设置",feature:"（未填写）",title:"税前计算小费金额",seq:293},{id:"s294-tip-policy-折扣前计算小费金额",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"小费百分比所乘的订单金额是否扣减折扣。与 seq 293 正交。",moduleName:"小费设置",feature:"（未填写）",title:"折扣前计算小费金额",seq:294},{id:"s295-tip-policy-收据建议小费-未付过小费时的小费建议",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"未付小费时，食客收据上展示的建议小费预设列表（百分比或固定金额，可新增/删除，与结账页预设 237 独立配置）。",moduleName:"小费设置",feature:"（未填写）",title:"收据建议小费（未付过小费时的小费建议）",seq:295},{id:"s296-tip-policy-收据建议小费-已经付过小费时的小费建议",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"订单已含小费时，收据仍展示建议行所用的预设列表（百分比或固定金额，可新增/删除，与 295 独立）。",moduleName:"小费设置",feature:"（未填写）",title:"收据建议小费（已经付过小费时的小费建议）",seq:296},{id:"s445-tax-rules-基础税率",groupTitle:"税务规则",groupKey:"tax-rules",sceneDesc:"门店结账销售税主税率（百分比）。配置计税策略前请先设定税率。",moduleName:"税率",feature:"税率（设置基础税率）",title:"基础税率",seq:445},{id:"s454-card-fees-卡付加价策略",groupTitle:"卡支付规则与合规",groupKey:"card-fees",sceneDesc:"卡付加价策略：不加价 / 双重定价 / 整单加收三选一；原 543 整单加收已并入。与订单中心通用加收（447）独立。",moduleName:"双重定价",feature:"双重定价（信用卡手续费比例）",title:"卡付加价策略",seq:454},{id:"s463-cds-checkout-ux-展示小费页",groupTitle:"结账与交互",groupKey:"cds-checkout-ux",sceneDesc:"CDS、Kiosk、PayPad 各产线是否在结账时展示小费页；预设 SSOT 见 tip-policy 237。原 492/662 已合并。",moduleName:"服务",feature:"小费（客显屏展示小费页及预设值）",title:"展示小费页",seq:463},{id:"s464-cds-checkout-ux-签名页",groupTitle:"结账与交互",groupKey:"cds-checkout-ux",sceneDesc:"CDS、Kiosk、PayPad 各产线卡付后是否展示签名页；金额门槛见 243；原 8/497/664 已合并。",moduleName:"服务",feature:"刷卡签字（客显屏签名页显隐）",title:"签名页",seq:464},{id:"s465-cds-checkout-ux-结账小票",groupTitle:"结账与交互",groupKey:"cds-checkout-ux",sceneDesc:"按 POS / CDS / Kiosk / PayPad 配置结账小票三通道（纸质、短信、邮箱）；纸质「自动打印」已合并原 seq 260。",moduleName:"服务",feature:"小票（客显屏自主选择打印）",title:"结账小票",seq:465},{id:"s493-tip-policy-小费收取方式",groupTitle:"小费政策与计算",groupKey:"tip-policy",sceneDesc:"CDS、Kiosk、PayPad 各产线小费页收取方式（固定金额 / 百分比）；预设按钮见 237。须 463 对应产线展示小费页开启。",moduleName:"小费",feature:"（未填写）",title:"小费收取方式",seq:493},{id:"s669-cds-checkout-ux-刷卡签购单",groupTitle:"结账与交互",groupKey:"cds-checkout-ux",sceneDesc:"按 POS / CDS / Kiosk / PayPad 配置刷卡签购单商户联与客户联；已合并原 seq 245、249、670。",moduleName:"Paypad设置",feature:"（未填写）",title:"刷卡签购单",seq:669}]}};function ug(e){for(const t of Object.keys(yl))if(e===t||e.startsWith(`${t}/`))return t}function Et(e){const t=ug(e);return t?yl[t]:void 0}const Io={9:1590,10:580,32:1670,33:1970,34:3300,35:1800,36:1640,37:1650,38:1940,39:2e3,40:1760,41:1960,42:1810,43:1920,44:1930,45:1820,46:1830,47:1770,48:1840,49:1860,50:1870,51:1780,52:1690,53:1700,54:1750,55:1880,56:1890,57:1900,58:1910,59:1980,60:1990,61:1790,62:1660,63:2360,65:2400,76:2370,77:2070,82:1530,86:2550,87:2560,88:2570,89:2580,90:1310,91:980,92:1320,93:1360,94:970,95:1370,96:1380,97:1390,98:1290,99:1400,100:1410,101:1420,102:1430,103:1440,104:1450,105:1460,106:1470,107:390,108:500,110:240,111:510,113:530,114:540,115:2800,116:2810,117:2820,118:290,119:2830,120:550,121:2680,122:2700,123:560,124:2860,125:570,132:2630,133:2640,135:2650,136:2660,137:2670,139:2590,140:2840,141:2850,142:2140,143:2130,144:2120,145:2600,147:2960,149:2930,150:2870,151:2730,152:2740,153:2750,154:2760,155:2970,156:2980,157:2990,158:3e3,159:3010,160:2150,161:2940,162:2890,163:2900,164:2910,167:3020,169:450,170:2090,171:2390,172:1580,173:2040,176:300,177:310,178:2690,180:1560,181:2380,193:10,194:20,195:30,196:230,197:40,198:50,199:60,200:70,201:80,202:90,203:100,204:110,205:120,206:130,207:140,208:150,209:160,210:170,211:180,212:190,213:200,214:210,215:220,216:330,217:340,218:350,219:360,220:370,221:2790,222:2710,223:2720,230:2300,231:2170,232:2280,234:2100,235:2340,236:2310,237:2210,238:2290,239:2320,240:2330,241:2350,242:1540,243:1550,244:2270,246:3090,247:3120,248:2780,250:3110,251:2770,252:2250,253:2200,256:3030,257:1330,258:1950,259:3040,261:3100,262:3140,264:3290,265:3050,266:2260,267:1340,269:3060,271:1850,272:3130,273:3150,274:3170,275:3160,276:3190,277:3260,278:3180,279:3270,280:3280,281:3310,282:3240,283:3220,284:3230,285:3200,286:3250,287:1710,288:1720,289:3210,290:2160,293:2180,294:2190,295:2230,296:2240,297:3320,298:2010,299:2020,300:2030,301:1730,302:1740,303:3330,304:1680,305:2420,307:2430,330:2410,347:490,348:320,350:380,351:480,417:2050,418:2060,429:1350,443:1150,445:2110,446:2880,447:2920,451:2440,454:1570,461:590,462:600,463:1600,464:1610,465:1620,466:610,483:250,484:260,485:270,486:280,487:1020,488:1030,489:1040,490:1050,491:1060,493:2220,500:3080,502:990,503:1300,504:1090,505:1100,506:1110,507:1120,509:900,510:1130,515:640,516:650,517:660,518:670,519:680,520:690,521:1480,522:1490,523:1500,524:700,525:710,526:720,527:1140,528:730,532:810,533:400,534:460,544:1510,545:1520,546:2950,567:1010,569:1210,570:1220,571:1160,572:1170,573:1200,574:1180,575:1190,577:1230,578:1240,579:1250,580:1260,581:1e3,582:2080,592:440,597:1270,598:1280,599:820,600:910,601:830,602:840,604:850,606:860,607:870,608:880,611:890,612:920,616:940,617:950,618:960,619:410,622:1080,623:1070,625:520,642:470,643:420,644:430,645:930,647:2610,652:620,653:630,654:3070,655:740,656:750,657:760,658:770,659:780,660:790,661:800,669:1630,672:2620};function pg(e,t){if(e.groupKey!==t.groupKey)return 0;const r=Io[e.seq],n=Io[t.seq],s=r!==void 0,i=n!==void 0;return s&&i&&r!==n?r-n:s!==i?s?-1:1:e.seq-t.seq}function on(e,t){const r=[],n=new Map;for(const i of e)n.has(i.groupKey)||(n.set(i.groupKey,[]),r.push(i.groupKey)),n.get(i.groupKey).push(i);return(t&&t.length>0?[...t.filter(i=>n.has(i)),...r.filter(i=>!t.includes(i))]:r).map(i=>{var a;const o=n.get(i).slice().sort(pg);return{groupKey:i,groupTitle:((a=o[0])==null?void 0:a.groupTitle)??i,items:o}})}const mg=[{seq:537,kind:"checkbox-group",checkboxes:[{fieldId:"537-queue-count",label:"展示排队数量",defaultChecked:!0},{fieldId:"537-wait-time",label:"展示等待时间",defaultChecked:!0}]},{seq:538,kind:"radio-group",radioFieldId:"538-font-size-mode",radioDefault:"system",radios:[{value:"system",label:"系统默认大小"},{value:"multiplier",labelBefore:"系统默认大小的",numberFieldId:"538-font-size-multiplier",numberDefault:1,labelAfter:"倍",numberMin:.1,numberMax:10}]},{seq:539,kind:"radio-color",radioFieldId:"539-font-bg-mode",radioDefault:"system",customColorValue:"custom",colorFieldId:"539-font-bg-color",colorDefault:"#9ca3af",radios:[{value:"system",label:"系统默认背景色"},{value:"custom",label:"自定义背景色"}]},{seq:540,kind:"radio-color",radioFieldId:"540-font-color-mode",radioDefault:"system",customColorValue:"custom",colorFieldId:"540-font-color",colorDefault:"#ffffff",radios:[{value:"system",label:"系统默认颜色"},{value:"custom",label:"自定义颜色"}]}],gg=[{seq:517,kind:"radio-group",radioFieldId:"517-menu-nav-position",radioDefault:"top",radios:[{value:"side",label:"侧边展示"},{value:"top",label:"顶部展示"}]}],fg=[{seq:217,kind:"radio-group",radioFieldId:"217-category-layout",radioDefault:"horizontal2",radios:[{value:"horizontal2",label:"Horizontal2"},{value:"horizontal3",label:"Horizontal 3"},{value:"vertical1",label:"Vertical 1"}]},{seq:218,kind:"radio-group",radioFieldId:"218-item-layout",radioDefault:"regular-buttons",radios:[{value:"regular-buttons",label:"Regular Buttons"},{value:"large-buttons",label:"Large Buttons"}]}],bg=[{seq:70,kind:"radio-group",radioFieldId:"70-clockout-slip-mode",radioDefault:"none",radios:[{value:"work-hours-only",label:"Print work hours only"},{value:"work-hours-and-tips",label:"Print work hours&Tips"},{value:"none",label:"None"}]}],hg=[{seq:186,kind:"radio-group",radioFieldId:"186-tip-base-mode",radioDefault:"net-sales",radios:[{value:"net-sales",label:"Net Sales"},{value:"grand-total",label:"Grand Total"},{value:"account-receivable",label:"Account Receivable"},{value:"only-gratuity",label:"Only Gratuity"}]},{seq:309,kind:"radio-group",radioFieldId:"309-tip-calculation-standard",radioDefault:"default",radios:[{value:"default",label:"DEFAULT"},{value:"working-hours",label:"WORKING HOURS"}]},{seq:310,kind:"radio-group",radioFieldId:"310-wage-calculation-standard",radioDefault:"default",radios:[{value:"default",label:"Default"},{value:"california-rule",label:"California Rule"},{value:"40-hours-per-week",label:"40 Hours Per Week Rule"},{value:"44-hours-per-week",label:"44 Hours Per Week Rule"},{value:"46-hours-per-week",label:"46 Hours Per Week Rule"},{value:"48-hours-per-week",label:"48 Hours Per Week Rule"}]}],vg=[{seq:489,kind:"checkbox-group",checkboxes:[{fieldId:"489-service-counter-pickup",label:"柜台自取",defaultChecked:!0},{fieldId:"489-service-table-delivery",label:"服务员送餐到桌",defaultChecked:!0},{fieldId:"489-service-delivery",label:"外卖配送",defaultChecked:!1},{fieldId:"489-service-curbside-pickup",label:"路边取餐（Curbside）",defaultChecked:!1}]}],yg=[...mg,...gg,...fg,...bg,...hg,...vg],xl=new Map(yg.map(e=>[e.seq,e]));function xg(e){return xl.get(e)}function Sg(e){return xl.has(e)}function ke(e){return`bplant-module-setting-field:${e}`}function le(e,t){try{const r=localStorage.getItem(ke(e));return r===null?t:r==="1"}catch{return t}}function Sl(e,t){try{localStorage.setItem(ke(e),t?"1":"0")}catch{}}function H(e,t){try{const r=localStorage.getItem(ke(e));return r===null||r===""?t:r}catch{return t}}function Ht(e,t){try{localStorage.setItem(ke(e),t)}catch{}}function Tg(e,t){try{const r=localStorage.getItem(ke(e));return r===null||r===""?t:r}catch{return t}}function Do(e,t){try{localStorage.setItem(ke(e),t)}catch{}}function F(e,t){try{const r=localStorage.getItem(ke(e));if(r===null||r==="")return t;const n=Number(r);return Number.isFinite(n)?n:t}catch{return t}}function ui(e,t){try{localStorage.setItem(ke(e),String(t))}catch{}}function Ge(e,t=""){try{const r=localStorage.getItem(ke(e));return r===null?t:r}catch{return t}}function Eg(e,t){try{localStorage.setItem(ke(e),t)}catch{}}function A(e,t){try{const r=localStorage.getItem(ke(e));return r===null||r===""?t:JSON.parse(r)}catch{return t}}function _(e,t){try{localStorage.setItem(ke(e),JSON.stringify(t))}catch{}}const $g={parentSeq:535,fields:[{kind:"inline",fieldKey:"auto-close-minutes",parts:[{type:"text",value:"当前下单预计等待时间大于"},{type:"number",fieldId:"535-auto-close-minutes",defaultValue:30,min:0,widthClass:"w-16"},{type:"text",value:"分钟后，自动关闭提示"}]},{kind:"inline",fieldKey:"menu-popup-minutes",parts:[{type:"text",value:"当前下单预计等待时间大于"},{type:"number",fieldId:"535-menu-popup-minutes",defaultValue:10,min:0,widthClass:"w-16"},{type:"text",value:"分钟后，菜单页自动展示弹框提示"}]}]},wg={parentSeq:536,fields:[{kind:"inline",fieldKey:"cups-or-minutes",parts:[{type:"text",value:"当杯数大于"},{type:"number",fieldId:"536-cups-threshold",defaultValue:10,min:0,widthClass:"w-16"},{type:"text",value:"杯，或者当预计等待时长大于"},{type:"number",fieldId:"536-minutes-threshold",defaultValue:10,min:0,widthClass:"w-16"},{type:"text",value:"分钟"}]},{kind:"inline",fieldKey:"range-start-offset",parts:[{type:"text",value:"区间开始：在原固定时长上减"},{type:"number",fieldId:"536-range-start-minus",defaultValue:2,min:0,widthClass:"w-16"},{type:"text",value:"分钟"}]},{kind:"inline",fieldKey:"range-end-offset",parts:[{type:"text",value:"区间结束：在原固定时长上加"},{type:"number",fieldId:"536-range-end-plus",defaultValue:2,min:0,widthClass:"w-16"},{type:"text",value:"分钟"}]}]},kg={parentSeq:196,fields:[{kind:"text-input",fieldKey:"divider-name",textFieldId:"196-custom-divider-name",label:"分割线名称",placeholder:"请输入 POS 点单页自定义分割线名称",maxLength:40}]},_g={parentSeq:522,fields:[{kind:"dish-tags",fieldKey:"remark-dishes",label:"请选择展示备注的菜品",storageFieldId:"522-remark-dishes"}]},Pg={parentSeq:544,fields:[{kind:"radio",fieldKey:"utensils-fee",radioFieldId:"544-utensils-fee-mode",radioDefault:"free",options:[{value:"free",label:"免费"},{value:"1.5",label:"$1.5"},{value:"other",label:"其他金额"}]}]},Ng={parentSeq:545,fields:[{kind:"radio",fieldKey:"packaging-fee",radioFieldId:"545-packaging-fee-mode",radioDefault:"free",options:[{value:"free",label:"免费"},{value:"1.5",label:"$1.5"},{value:"other",label:"其他金额"}]}]},Ig={parentSeq:569,fields:[{kind:"copy-form",fieldKey:"order-notice",titleFieldId:"569-title",contentFieldId:"569-content",titleMaxLength:20,contentMaxLength:200}]},Dg={parentSeq:570,fields:[{kind:"copy-form",fieldKey:"hotpot-tip",titleFieldId:"570-title",contentFieldId:"570-content",titleMaxLength:20,contentMaxLength:200}]},Ag={parentSeq:597,fields:[{kind:"dish-mutex-rules",fieldKey:"mutex",storageFieldId:"597-mutex-rules"}]},qg={parentSeq:598,fields:[{kind:"dish-combo-rules",fieldKey:"combo",storageFieldId:"598-combo-rules"}]},Lg={parentSeq:607,fields:[{kind:"radio",fieldKey:"image-mode",radioFieldId:"607-image-mode",radioDefault:"small",options:[{value:"original",label:"原始模式"},{value:"small",label:"小图模式"},{value:"large",label:"大图模式"}]},{kind:"conditional-dish-tags",fieldKey:"small-dishes",label:"请选择大图菜",storageFieldId:"607-small-dishes",whenRadioFieldId:"607-image-mode",whenRadioValue:"small",whenRadioDefault:"small"},{kind:"conditional-dish-tags",fieldKey:"large-dishes",label:"请选择小图菜",storageFieldId:"607-large-dishes",whenRadioFieldId:"607-image-mode",whenRadioValue:"large",whenRadioDefault:"small"}]},Cg={parentSeq:608,fields:[{kind:"hint",fieldKey:"detail-hint",text:"只针对仅有图片、名称、价格、描述的菜生效"},{kind:"dish-tags",fieldKey:"no-attr-dishes",label:"请选择无属性的菜",storageFieldId:"608-no-attr-dishes"}]},Mg={parentSeq:645,fields:[{kind:"hint",fieldKey:"font-hint",text:"打开后，你可以设置菜品名称字体大小"},{kind:"inline",fieldKey:"font-size",parts:[{type:"number",fieldId:"645-dish-name-font-px",defaultValue:16,min:8,max:72,widthClass:"w-16"},{type:"text",value:"px"}]}]},Rg={parentSeq:647,fields:[{kind:"inline",fieldKey:"draw-quota",parts:[{type:"text",value:"每满"},{type:"number",fieldId:"647-items-per-draw",defaultValue:1,min:1,widthClass:"w-16"},{type:"text",value:"件菜品抽一次  最多抽"},{type:"number",fieldId:"647-max-draws",defaultValue:1,min:1,widthClass:"w-16"},{type:"text",value:"次"}]},{kind:"dish-tags",fieldKey:"excluded-dishes",label:"不参与计算的菜品",storageFieldId:"647-excluded-dishes",pickerUi:"select"},{kind:"inline",fieldKey:"win-probability",parts:[{type:"text",value:"每次中奖概率"},{type:"number",fieldId:"647-win-probability-percent",defaultValue:10,min:0,max:100,widthClass:"w-16"},{type:"text",value:"%"}]},{kind:"dish-tags",fieldKey:"prize-pool",label:"奖励池商品",storageFieldId:"647-prize-pool-dishes",pickerUi:"select"}]},Tl=new Map([[535,$g],[536,wg],[196,kg],[522,_g],[544,Pg],[545,Ng],[569,Ig],[570,Dg],[597,Ag],[598,qg],[607,Lg],[608,Cg],[645,Mg],[647,Rg]]);function Og(e){return Tl.get(e)}function El(e){return Tl.has(e)}const q="size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";function Ie(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function tt(e){const r=(e.layout??"vertical")==="vertical"?"flex flex-col gap-2":"flex flex-wrap items-center gap-x-4 gap-y-2",n=e.options.map(i=>{const o=e.currentValue===i.value;return`
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="${Ie(e.groupName)}"
            value="${Ie(i.value)}"
            class="${q}"
            ${o?"checked":""}
            data-module-setting-radio="${Ie(e.fieldId)}"
          />
          <span>${Ie(i.label)}</span>
        </label>`}).join(""),s=e.ariaLabel?` aria-label="${Ie(e.ariaLabel)}"`:"";return`<div class="${r}" role="radiogroup"${s}>${n}</div>`}function Kg(e){const t="flex flex-wrap items-center gap-x-3 gap-y-2",r=e.options.map(n=>{const s=e.currentValue===n.value;return`
        <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${Ie(e.groupName)}"
            value="${Ie(n.value)}"
            class="${q}"
            ${s?"checked":""}
            ${e.radioDataAttr}="${Ie(n.value)}"
          />
          <span>${Ie(n.label)}</span>
        </label>`}).join("");return`<div class="${t}" role="radiogroup">${r}</div>`}function pi(e){const r=(e.layout??"wrap")==="grid"?"grid grid-cols-2 gap-2 sm:grid-cols-3":"flex flex-wrap gap-x-4 gap-y-2",n=e.options.map(s=>{var l;const i=e.selectedValues.has(s.value),o=((l=e.getItemAttrs)==null?void 0:l.call(e,s.value,s.label))??{},a=Object.entries(o).map(([u,m])=>` ${u}="${Ie(m)}"`).join("");return`
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            class="${q} rounded-sm"
            value="${Ie(s.value)}"
            ${i?"checked":""}
            ${e.checkboxDataAttr}="1"${a}
          />
          <span>${Ie(s.label)}</span>
        </label>`}).join("");return`<div class="${r}" role="group">${n}</div>`}const an=[{id:"d-beef-premium",name:"极品肥牛133333"},{id:"d-pork-belly",name:"五花肉"},{id:"d-combo-1",name:"牛羊组合"},{id:"d-combo-2",name:"牛羊组合-1"}],mi="597-mutex-rules",gi="598-combo-rules";function Y(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ft(){return`r-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}function Bg(){return[{id:ft(),trigger:[{id:"d-beef-premium",name:"极品肥牛133333"}],excluded:[{id:"d-pork-belly",name:"五花肉"},{id:"d-combo-1",name:"牛羊组合"},{id:"d-combo-2",name:"牛羊组合-1"}]}]}function Hg(){return[{id:ft(),trigger:[{id:"d-pork-belly",name:"五花肉"}],requiredQty:1,required:[{id:"d-combo-1",name:"牛羊组合"}]}]}function $l(e=mi){const t=A(e,[]);return!Array.isArray(t)||t.length===0?Bg():t.map(r=>({id:r.id||ft(),trigger:Array.isArray(r.trigger)?r.trigger:[],excluded:Array.isArray(r.excluded)?r.excluded:[]}))}function wl(e,t=mi){_(t,e)}function kl(e=gi){const t=A(e,[]);return!Array.isArray(t)||t.length===0?Hg():t.map(r=>({id:r.id||ft(),trigger:Array.isArray(r.trigger)?r.trigger:[],requiredQty:Number.isFinite(Number(r.requiredQty))?Math.max(1,Number(r.requiredQty)):1,required:Array.isArray(r.required)?r.required:[]}))}function _l(e,t=gi){_(t,e)}function ln(e){return`
    <span
      data-dish-tag
      data-dish-id="${Y(e.id)}"
      data-dish-name="${Y(e.name)}"
      class="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted/80 px-2 py-0.5 text-xs text-foreground"
    >
      <span class="truncate">${Y(e.name)}</span>
      <button
        type="button"
        class="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
        data-dish-tag-remove
        aria-label="移除 ${Y(e.name)}"
      >×</button>
    </span>`}function Fg(e){const t=A(e,[]);return Array.isArray(t)?t.filter(r=>(r==null?void 0:r.id)&&(r==null?void 0:r.name)):[]}function Gg(e,t){_(e,t)}function or(e,t,r,n,s="checkbox"){if(s==="select")return Ug(e,t,r,n);const i=new Set(n.map(l=>l.id)),o=n.length>0?`<div class="flex flex-wrap gap-1.5" data-dish-tags>${n.map(ln).join("")}</div>`:"",a=pi({options:an.map(l=>({value:l.id,label:l.name})),selectedValues:i,checkboxDataAttr:"data-dish-choice",getItemAttrs:(l,u)=>({"data-dish-id":l,"data-dish-name":u}),layout:"wrap"});return`
    <div
      class="module-setting-dish-picker min-w-0 flex-1 space-y-2 rounded-md border border-input bg-background px-2 py-2"
      data-dish-picker
      data-picker-role="${Y(r)}"
      data-parent-seq="${e}"
      data-rule-id="${Y(t)}"
    >
      ${o}
      ${a}
    </div>`}function Ug(e,t,r,n){const s=new Set(n.map(l=>l.id)),i=n.length>0?`<div class="flex flex-wrap gap-1.5" data-dish-tags>${n.map(ln).join("")}</div>`:"",o=an.filter(l=>!s.has(l.id)),a=o.map(l=>`<option value="${Y(l.id)}" data-dish-name="${Y(l.name)}">${Y(l.name)}</option>`).join("");return`
    <div
      class="module-setting-dish-picker min-w-0 flex-1 space-y-2 rounded-md border border-input bg-background px-2 py-2"
      data-dish-picker
      data-picker-ui="select"
      data-picker-role="${Y(r)}"
      data-parent-seq="${e}"
      data-rule-id="${Y(t)}"
    >
      ${i}
      <div class="flex min-w-0 items-center gap-2">
        <select
          class="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          data-dish-select
          aria-label="选择商品"
          ${o.length===0?"disabled":""}
        >
          <option value="">${o.length===0?"已选全部可选商品":"请选择商品"}</option>
          ${a}
        </select>
      </div>
    </div>`}function Pl(e){const t=e.querySelector("[data-dish-select]");if(!t)return;const r=new Set($t(e).map(s=>s.id)),n=an.filter(s=>!r.has(s.id));t.innerHTML=`<option value="">${n.length===0?"已选全部可选商品":"请选择商品"}</option>`+n.map(s=>`<option value="${Y(s.id)}" data-dish-name="${Y(s.name)}">${Y(s.name)}</option>`).join(""),t.disabled=n.length===0,t.value=""}function jg(e,t){const r=t.value;if(!r)return;const n=an.find(u=>u.id===r);if(!n)return;if($t(e).some(u=>u.id===r)){t.value="";return}let i=e.querySelector("[data-dish-tags]");if(i||(e.insertAdjacentHTML("afterbegin",'<div class="flex flex-wrap gap-1.5" data-dish-tags></div>'),i=e.querySelector("[data-dish-tags]")),i==null||i.insertAdjacentHTML("beforeend",ln(n)),Pl(e),e.closest("[data-standalone-dish-picker]")){bi(e);return}const a=e.closest("[data-mutex-rules-editor]");if(a){fi(a);return}const l=e.closest("[data-combo-rules-editor]");l&&ar(l)}function Nl(e,t,r){return`
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3" data-mutex-rule-row data-rule-id="${Y(e.id)}">
      <div class="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        ${or(t,e.id,"trigger",e.trigger)}
        <span class="shrink-0 text-center text-sm text-muted-foreground sm:px-1">互斥</span>
        ${or(t,e.id,"excluded",e.excluded)}
      </div>
      ${r?'<button type="button" class="shrink-0 self-end text-sm font-medium text-primary hover:underline sm:self-center" data-mutex-add-rule>增加</button>':""}
    </div>`}function Il(e,t,r){const n=e.requiredQty;return`
    <div class="space-y-3 rounded-md border border-border/60 bg-background/60 p-3" data-combo-rule-row data-rule-id="${Y(e.id)}">
      <div class="space-y-1.5">
        <span class="text-sm font-medium text-foreground">下单菜品</span>
        ${or(t,e.id,"trigger",e.trigger)}
      </div>
      <div class="flex flex-wrap items-center gap-2 text-sm text-foreground">
        <span>订单中必须再包含任意菜品</span>
        <input
          type="number"
          inputmode="numeric"
          min="1"
          class="w-14 h-8 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value="${n}"
          data-combo-qty
          aria-label="份数"
        />
        <span>份</span>
      </div>
      <div class="min-w-0">
        ${or(t,e.id,"required",e.required)}
      </div>
      ${r?'<div class="flex justify-end"><button type="button" class="text-sm font-medium text-primary hover:underline" data-combo-add-rule>增加</button></div>':""}
    </div>`}function Vg(e,t){const r=$l(t),n=r.map((s,i)=>Nl(s,e,i===r.length-1)).join("");return`
    <div class="space-y-3" data-mutex-rules-editor data-storage-id="${Y(t)}" data-parent-seq="${e}">
      ${n}
    </div>`}function Wg(e,t){const r=kl(t),n=r.map((s,i)=>Il(s,e,i===r.length-1)).join("");return`
    <div class="space-y-3" data-combo-rules-editor data-storage-id="${Y(t)}" data-parent-seq="${e}">
      ${n}
    </div>`}function Dl(e){return[...e.querySelectorAll("[data-dish-choice]:checked")].map(t=>({id:t.getAttribute("data-dish-id")??t.value,name:t.getAttribute("data-dish-name")??""}))}function Qg(e){const t=Dl(e);let r=e.querySelector("[data-dish-tags]");if(t.length===0){r==null||r.remove();return}r||(e.insertAdjacentHTML("afterbegin",'<div class="flex flex-wrap gap-1.5" data-dish-tags></div>'),r=e.querySelector("[data-dish-tags]")),r&&(r.innerHTML=t.map(ln).join(""))}function $t(e){const t=e;return t.querySelector("[data-dish-choice]")?Dl(t):[...e.querySelectorAll("[data-dish-tag]")].map(r=>({id:r.getAttribute("data-dish-id")??"",name:r.getAttribute("data-dish-name")??""}))}function Or(e){if(Qg(e),e.closest("[data-standalone-dish-picker]")){bi(e);return}const r=e.closest("[data-mutex-rules-editor]");if(r){fi(r);return}const n=e.closest("[data-combo-rules-editor]");n&&ar(n)}function ts(e,t){var s;const r=e.querySelector(`[data-dish-choice][data-dish-id="${t}"]`);r&&(r.checked=!1),(s=e.querySelector(`[data-dish-tag][data-dish-id="${t}"]`))==null||s.remove();const n=e.querySelector("[data-dish-tags]");if(n&&!n.querySelector("[data-dish-tag]")&&n.remove(),e.getAttribute("data-picker-ui")==="select"){if(Pl(e),e.closest("[data-standalone-dish-picker]")){bi(e);return}const o=e.closest("[data-mutex-rules-editor]");if(o){fi(o);return}const a=e.closest("[data-combo-rules-editor]");a&&ar(a);return}Or(e)}function fi(e){const t=e.getAttribute("data-storage-id");if(!t)return;const r=[];e.querySelectorAll("[data-mutex-rule-row]").forEach(n=>{const s=n.getAttribute("data-rule-id")??ft(),i=n.querySelector('[data-dish-picker][data-picker-role="trigger"]'),o=n.querySelector('[data-dish-picker][data-picker-role="excluded"]');!i||!o||r.push({id:s,trigger:$t(i),excluded:$t(o)})}),wl(r,t)}function ar(e){const t=e.getAttribute("data-storage-id");if(!t)return;const r=[];e.querySelectorAll("[data-combo-rule-row]").forEach(n=>{const s=n.getAttribute("data-rule-id")??ft(),i=n.querySelector('[data-dish-picker][data-picker-role="trigger"]'),o=n.querySelector('[data-dish-picker][data-picker-role="required"]'),a=n.querySelector("[data-combo-qty]");if(!i||!o)return;const l=Number((a==null?void 0:a.value)??1);r.push({id:s,trigger:$t(i),requiredQty:Number.isFinite(l)&&l>=1?l:1,required:$t(o)})}),_l(r,t)}function zg(e){const t=Number(e.getAttribute("data-parent-seq")??0),r=e.getAttribute("data-storage-id")??mi,n=$l(r);n.push({id:ft(),trigger:[],excluded:[]}),wl(n,r),e.innerHTML=n.map((s,i)=>Nl(s,t,i===n.length-1)).join("")}function Yg(e){const t=Number(e.getAttribute("data-parent-seq")??0),r=e.getAttribute("data-storage-id")??gi,n=kl(r);n.push({id:ft(),trigger:[],requiredQty:1,required:[]}),_l(n,r),e.innerHTML=n.map((s,i)=>Il(s,t,i===n.length-1)).join("")}function Al(e,t,r,n="checkbox"){const s=Fg(r);return`
    <div data-standalone-dish-picker data-storage-id="${Y(r)}" data-field-key="${Y(t)}" data-picker-ui="${n}">
      ${or(e,t,"tags",s,n)}
    </div>`}function bi(e){const t=e.closest("[data-standalone-dish-picker]"),r=t==null?void 0:t.getAttribute("data-storage-id");r&&Gg(r,$t(e))}function Xg(){document.querySelectorAll("[data-standalone-dish-picker]").forEach(e=>{e.dataset.standaloneDishPickerBound!=="1"&&(e.dataset.standaloneDishPickerBound="1",e.addEventListener("click",t=>{const r=t.target.closest("[data-dish-tag-remove]");if(!r)return;const n=r.closest("[data-dish-tag]"),s=n==null?void 0:n.closest("[data-dish-picker]"),i=n==null?void 0:n.getAttribute("data-dish-id");s&&i&&ts(s,i)}),e.addEventListener("change",t=>{const r=t.target.closest("[data-dish-select]");if(r){const i=r.closest("[data-dish-picker]");i&&jg(i,r);return}const n=t.target.closest("[data-dish-choice]");if(!n)return;const s=n.closest("[data-dish-picker]");s&&Or(s)}))})}function Zg(){Xg(),document.querySelectorAll("[data-mutex-rules-editor]").forEach(e=>{e.dataset.dishRulesBound!=="1"&&(e.dataset.dishRulesBound="1",e.addEventListener("click",t=>{const r=t.target;if(r.closest("[data-mutex-add-rule]")){zg(e);return}const n=r.closest("[data-dish-tag-remove]");if(n){const s=n.closest("[data-dish-tag]"),i=s==null?void 0:s.closest("[data-dish-picker]"),o=s==null?void 0:s.getAttribute("data-dish-id");i&&o&&ts(i,o)}}),e.addEventListener("change",t=>{const r=t.target.closest("[data-dish-choice]");if(!r)return;const n=r.closest("[data-dish-picker]");n&&Or(n)}))}),document.querySelectorAll("[data-combo-rules-editor]").forEach(e=>{e.dataset.dishRulesBound!=="1"&&(e.dataset.dishRulesBound="1",e.addEventListener("click",t=>{const r=t.target;if(r.closest("[data-combo-add-rule]")){Yg(e);return}const n=r.closest("[data-dish-tag-remove]");if(n){const s=n.closest("[data-dish-tag]"),i=s==null?void 0:s.closest("[data-dish-picker]"),o=s==null?void 0:s.getAttribute("data-dish-id");i&&o&&ts(i,o)}}),e.addEventListener("change",t=>{const r=t.target.closest("[data-dish-choice]");if(r){const s=r.closest("[data-dish-picker]");s&&Or(s);return}t.target.closest("[data-combo-qty]")&&ar(e)}),e.addEventListener("input",t=>{t.target.closest("[data-combo-qty]")&&ar(e)}))})}const hi=[{code:"en",label:"英语"},{code:"zh-Hans",label:"中文简体"},{code:"zh-Hant",label:"中文繁体"},{code:"fr",label:"法语"},{code:"ja",label:"日语"},{code:"ru",label:"俄语"},{code:"es",label:"西班牙语"},{code:"vi",label:"越南语"},{code:"th",label:"泰语"},{code:"ko",label:"韩语"}],Jg=new Set(["en","zh-Hans"]),ql="en",ef=652,tf=653,dn="653-default-locale";function rf(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function vi(e){return`652-lang-${e}`}function nf(e){return e===ef}function sf(e){return e===tf}function of(e){return Jg.has(e)}function af(){return hi.filter(e=>le(vi(e.code),of(e.code))).map(e=>e.code)}function lf(){return H(dn,ql)}function df(e){Ht(dn,e)}function cf(e){const t=lf();if(e.includes(t))return t;const r=e[0]??ql;return df(r),r}function Ll(){const e=af();if(e.length===0)return'<p class="m-0 text-sm text-muted-foreground">请至少选择一种语言</p>';const t=cf(e),r="module-setting-locale-default";return e.map(n=>{const s=hi.find(o=>o.code===n);return s?`
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="radio"
          name="${r}"
          value="${n}"
          class="size-4 shrink-0 rounded-full border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          ${t===n?"checked":""}
          data-locale-default-radio
          data-module-setting-radio="${dn}"
        />
        <span>${rf(s.label)}</span>
      </label>`:""}).join("")}function uf(){document.querySelectorAll("[data-locale-default-radios]").forEach(e=>{e.innerHTML=Ll()})}function pf(){document.documentElement.dataset.guestFacingLocaleBound!=="1"&&(document.documentElement.dataset.guestFacingLocaleBound="1",document.addEventListener("change",e=>{const t=e.target,r=t.closest("[data-locale-select-checkbox]");if(r){const s=r.getAttribute("data-locale-code");if(!s)return;if([...document.querySelectorAll("[data-locale-select-checkbox]")].filter(o=>o.checked).length===0){r.checked=!0;return}Sl(vi(s),r.checked),uf();return}const n=t.closest("[data-locale-default-radio]");n!=null&&n.checked&&Ht(dn,n.value)}))}const mf=[{id:"mg-hot",name:"热菜"},{id:"mg-cold",name:"冷菜"},{id:"mg-staple",name:"主食"},{id:"mg-soup",name:"汤品"},{id:"mg-drink",name:"饮品"},{id:"mg-dessert",name:"甜品"}],gf=new Set([560,599]);function Xt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ff(e){return gf.has(e)}function bf(e){return`${e}-menu-groups`}function hf(e){const t=A(e,[]);return Array.isArray(t)?t.filter(r=>(r==null?void 0:r.id)&&(r==null?void 0:r.name)):[]}function vf(e,t){_(e,t)}function Cl(e){return`
    <span
      data-menu-group-tag
      data-group-id="${Xt(e.id)}"
      data-group-name="${Xt(e.name)}"
      class="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted/80 px-2 py-0.5 text-xs text-foreground"
    >
      <span class="truncate">${Xt(e.name)}</span>
      <button
        type="button"
        class="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
        data-menu-group-tag-remove
        aria-label="移除 ${Xt(e.name)}"
      >×</button>
    </span>`}function Ml(e){return[...e.querySelectorAll("[data-menu-group-choice]:checked")].map(t=>({id:t.getAttribute("data-group-id")??t.value,name:t.getAttribute("data-group-name")??""}))}function yf(e){const t=Ml(e);let r=e.querySelector("[data-menu-group-tags]");if(t.length===0){r==null||r.remove();return}r||(e.insertAdjacentHTML("afterbegin",'<div class="flex flex-wrap gap-1.5" data-menu-group-tags></div>'),r=e.querySelector("[data-menu-group-tags]")),r&&(r.innerHTML=t.map(Cl).join(""))}function xf(e,t){const r=new Set(t.map(i=>i.id)),n=t.length>0?`<div class="flex flex-wrap gap-1.5" data-menu-group-tags>${t.map(Cl).join("")}</div>`:"",s=pi({options:mf.map(i=>({value:i.id,label:i.name})),selectedValues:r,checkboxDataAttr:"data-menu-group-choice",getItemAttrs:(i,o)=>({"data-group-id":i,"data-group-name":o}),layout:"wrap"});return`
    <div
      class="module-setting-menu-group-picker w-full min-w-0 space-y-2 rounded-md border border-input bg-background px-3 py-2.5"
      data-menu-group-picker
      data-setting-seq="${e}"
    >
      ${n}
      ${s}
    </div>`}function Sf(e,t){const r=hf(t);return`
    <div
      class="w-full min-w-0"
      data-standalone-menu-group-picker
      data-storage-id="${Xt(t)}"
      data-setting-seq="${e}"
    >
      ${xf(e,r)}
    </div>`}function Ao(e){const t=e.closest("[data-standalone-menu-group-picker]"),r=t==null?void 0:t.getAttribute("data-storage-id");r&&vf(r,Ml(e))}function Tf(){document.querySelectorAll("[data-standalone-menu-group-picker]").forEach(e=>{e.dataset.menuGroupPickerBound!=="1"&&(e.dataset.menuGroupPickerBound="1",e.addEventListener("click",t=>{const r=t.target.closest("[data-menu-group-tag-remove]");if(!r)return;const n=r.closest("[data-menu-group-tag]"),s=n==null?void 0:n.closest("[data-menu-group-picker]"),i=n==null?void 0:n.getAttribute("data-group-id");if(i&&s){const o=s.querySelector(`[data-menu-group-choice][data-group-id="${i}"]`);o&&(o.checked=!1),n==null||n.remove();const a=s.querySelector("[data-menu-group-tags]");a&&!a.querySelector("[data-menu-group-tag]")&&a.remove(),Ao(s)}}),e.addEventListener("change",t=>{const r=t.target.closest("[data-menu-group-choice]");if(!r)return;const n=r.closest("[data-menu-group-picker]");n&&(yf(n),Ao(n))}))})}const yi=[{seq:483,storageFieldId:"483-pos-toolbar",title:"整单操作",hint:"订单底部操作，最多展示6个",buttons:[{id:"split",label:"分单"},{id:"delete-order",label:"删单"},{id:"save",label:"保存"},{id:"exit",label:"退出"},{id:"pay",label:"付款"},{id:"send-kitchen",label:"送厨"},{id:"direct-send",label:"直送"},{id:"pay-only",label:"仅付款"}],defaultEnabled:{split:!0,"delete-order":!0,save:!0,exit:!0,pay:!0,"send-kitchen":!0,"direct-send":!1,"pay-only":!1}},{seq:484,storageFieldId:"484-pos-toolbar",title:"菜品详情",hint:"选中任意菜品时展示",buttons:[{id:"divider",label:"分割线"},{id:"plus-one",label:"加1"},{id:"qty",label:"数量"},{id:"minus-one",label:"减1"},{id:"note",label:"备注"},{id:"tax",label:"税"},{id:"seasoning",label:"调味"},{id:"change-price",label:"改价"}],defaultEnabled:{divider:!0,"plus-one":!1,qty:!0,"minus-one":!1,note:!0,tax:!0,seasoning:!0,"change-price":!0}},{seq:485,storageFieldId:"485-pos-toolbar",title:"订单信息",hint:"选中订单信息顶部时展示",buttons:[{id:"sort",label:"排序"},{id:"guest-info",label:"客人信息"},{id:"type",label:"类型"},{id:"change-table",label:"换桌"},{id:"server",label:"企台"},{id:"guest",label:"客人"},{id:"order-note",label:"整单备注"},{id:"member",label:"会员"},{id:"print",label:"打单"}],defaultEnabled:{sort:!0,"guest-info":!0,type:!0,"change-table":!0,server:!0,guest:!0,"order-note":!0,member:!0,print:!1}},{seq:486,storageFieldId:"486-pos-toolbar",title:"订单金额",hint:"选中订单金额区域时展示",buttons:[{id:"surcharge",label:"加收"},{id:"discount",label:"折扣"},{id:"tip",label:"小费"},{id:"order-tax",label:"整单税"}],defaultEnabled:{surcharge:!0,discount:!0,tip:!0,"order-tax":!0}}],rs=new Map(yi.map(e=>[e.seq,e])),xi=new Map;for(const e of yi)for(const t of e.buttons)xi.set(t.id,t.label);const Ef=new Set(["save","exit","sort"]),$f=new Set([483,485,486]),wf={483:[485,486],485:[486,483],486:[485,483]},kf=483,_f=new Set([484,485,486]);let we=null,dt=null,Ke=null;const ns=[],Pf=10050,ct={passive:!0,capture:!0};function ut(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Si(e){return $f.has(e)}function Ti(e){return!Ef.has(e)}function Nf(e){return e.buttons.map(t=>({id:t.id,label:t.label,enabled:e.defaultEnabled[t.id]??!0}))}function If(e,t){return!Array.isArray(t)||t.length===0?Nf(e):t.filter(r=>r==null?void 0:r.id).map(r=>({id:r.id,label:xi.get(r.id)??r.label??r.id,enabled:!!r.enabled}))}function ss(e,t){const r=A(e,[]);return If(t,r)}function is(e,t){_(e,t)}function Df(){return'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>'}function Af(e){return(wf[e]??[]).map(r=>{const n=rs.get(r);return n?`
        <button
          type="button"
          class="w-full rounded-md border border-border bg-muted px-3 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          data-pos-toolbar-move-confirm
          data-move-to-seq="${r}"
        >${ut(n.title)}</button>`:""}).join("")}function qf(e,t){const n=Si(t)&&Ti(e.id)?`
      <div class="relative shrink-0" data-pos-toolbar-move-anchor>
        <button
          type="button"
          class="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          data-pos-toolbar-move-trigger
          aria-label="移动 ${ut(e.label)}"
          aria-haspopup="true"
          aria-expanded="false"
        >${Df()}</button>
      </div>`:'<span class="inline-block size-7 shrink-0" aria-hidden="true"></span>';return`
    <li
      class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 border-b border-border/60 bg-background px-2 py-2 last:border-b-0"
      data-pos-toolbar-item
      data-button-id="${ut(e.id)}"
      draggable="true"
    >
      <button
        type="button"
        class="inline-flex size-7 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted active:cursor-grabbing"
        data-pos-toolbar-drag-handle
        aria-label="拖动排序"
        tabindex="-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </button>
      <span class="min-w-0 truncate text-sm text-foreground">${ut(e.label)}</span>
      <label class="inline-flex shrink-0 cursor-pointer items-center justify-center">
        <span class="sr-only">启用 ${ut(e.label)}</span>
        <input
          type="checkbox"
          class="size-4 shrink-0 rounded-full border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-pos-toolbar-enable
          ${e.enabled?"checked":""}
        />
      </label>
      ${n}
    </li>`}function Lf(e){const r=ss(e.storageFieldId,e).map(i=>qf(i,e.seq)).join(""),s=Si(e.seq)?`
      <div class="grid grid-cols-[1fr_auto_auto] items-center gap-x-2 border-b border-border/80 bg-muted/30 px-2 py-1.5 text-xs font-medium text-muted-foreground">
        <span class="pl-9">功能</span>
        <span class="text-center">启用</span>
        <span class="w-7 text-center">移动</span>
      </div>`:`
      <div class="grid grid-cols-[1fr_auto] items-center gap-x-2 border-b border-border/80 bg-muted/30 px-2 py-1.5 text-xs font-medium text-muted-foreground">
        <span class="pl-9">功能</span>
        <span class="pr-1">启用</span>
      </div>`;return`
    <div
      class="flex min-w-0 flex-col overflow-visible rounded-lg border border-border bg-card"
      data-pos-toolbar-group
      data-storage-id="${ut(e.storageFieldId)}"
      data-group-seq="${e.seq}"
    >
      <div class="border-b border-border px-3 py-2.5">
        <h4 class="m-0 text-sm font-semibold text-foreground">${ut(e.title)}</h4>
        <p class="m-0 mt-0.5 text-xs text-muted-foreground">${ut(e.hint)}</p>
      </div>
      ${s}
      <ul class="m-0 list-none overflow-visible p-0" data-pos-toolbar-list role="list">${r}</ul>
    </div>`}function Rl(){return yi.map(Lf).join("")}function Cf(){return`
    <li class="list-none">
      <div class="border-b border-border px-4 py-3">
        <p class="m-0 text-sm font-medium text-foreground">点单页工具栏配置</p>
        <p class="m-0 mt-1 text-xs text-muted-foreground">拖动排序、勾选启用；整单操作/订单信息/订单金额支持通过「移动」调整按钮归属组</p>
        <div class="relative mt-4 overflow-visible" data-pos-toolbar-grid>
          <div class="grid grid-cols-1 gap-4 overflow-visible xl:grid-cols-2 2xl:grid-cols-4">${Rl()}</div>
        </div>
      </div>
    </li>`}function Mf(e){return e===kf}function Rf(e){return _f.has(e)}function Of(e){return[...e.querySelectorAll("[data-pos-toolbar-item]")].map(t=>{var s;const r=t.getAttribute("data-button-id")??"",n=((s=t.querySelector("[data-pos-toolbar-enable]"))==null?void 0:s.checked)??!1;return{id:r,label:xi.get(r)??r,enabled:n}})}function qo(e){const t=e.getAttribute("data-storage-id");t&&is(t,Of(e))}function Kf(e,t,r,n){if(t===r.getAttribute("data-button-id"))return;const s=[...e.querySelectorAll("[data-pos-toolbar-item]")].find(a=>a.getAttribute("data-button-id")===t);if(!s)return;const i=r.getBoundingClientRect();n>i.top+i.height/2?r.after(s):r.before(s)}function Ol(){if(Ke){for(const e of ns)e===window?(window.removeEventListener("scroll",Ke,ct),window.removeEventListener("wheel",Ke,ct)):(e.removeEventListener("scroll",Ke,ct),e.removeEventListener("wheel",Ke,ct));ns.length=0,Ke=null}}function Bf(){const e=[window,document.documentElement,document.body];return document.querySelectorAll(".module-settings-scroll-host, .tertiary-inline-subnav-scroll, main, [data-pos-toolbar-grid]").forEach(t=>{e.includes(t)||e.push(t)}),e}function Hf(){if(Ol(),!!we){Ke=()=>xt();for(const e of Bf())ns.push(e),e===window?(window.addEventListener("scroll",Ke,ct),window.addEventListener("wheel",Ke,ct)):(e.addEventListener("scroll",Ke,ct),e.addEventListener("wheel",Ke,ct))}}function xt(){Ol(),dt==null||dt.setAttribute("aria-expanded","false"),dt=null,we==null||we.remove(),we=null}function Ff(e){return!!(e.closest("[data-pos-toolbar-move-menu]")||e.closest("[data-pos-toolbar-move-trigger]"))}function Gf(e,t){const r=t.getBoundingClientRect(),n=4,s=e.offsetWidth,i=e.offsetHeight;let o=r.right-s,a=r.bottom+n;const l=8;o<l&&(o=l),o+s>window.innerWidth-l&&(o=window.innerWidth-s-l),a+i>window.innerHeight-l&&(a=r.top-i-n),a<l&&(a=l),e.style.left=`${Math.round(o)}px`,e.style.top=`${Math.round(a)}px`}function Uf(e,t,r){xt();const n=document.createElement("div");n.className="pos-toolbar-move-menu fixed min-w-[10.5rem] rounded-lg border border-border bg-card p-3 text-card-foreground shadow-md",n.style.zIndex=String(Pf),n.style.opacity="1",n.style.backgroundColor="var(--color-card)",n.style.isolation="isolate",n.setAttribute("data-pos-toolbar-move-menu",""),n.setAttribute("data-move-from-seq",String(t)),n.setAttribute("data-move-button-id",r),n.innerHTML=`
    <p class="m-0 mb-2 text-center text-xs text-muted-foreground">将此按钮移动到</p>
    <div class="flex flex-col gap-2">${Af(t)}</div>`,n.style.left="-9999px",n.style.top="0",document.body.appendChild(n),we=n,dt=e,e.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{!we||!dt||(Gf(we,dt),Hf())})}function jf(){const e=document.querySelector("[data-pos-toolbar-grid] > div");e&&(xt(),e.innerHTML=Rl(),document.querySelectorAll("[data-pos-toolbar-group]").forEach(t=>{delete t.dataset.posToolbarBound}),Kl())}function Vf(e,t,r){if(e===t||!Ti(r))return;const n=rs.get(e),s=rs.get(t);if(!n||!s)return;const i=ss(n.storageFieldId,n),o=i.findIndex(u=>u.id===r);if(o<0)return;const[a]=i.splice(o,1),l=ss(s.storageFieldId,s);l.some(u=>u.id===r)||l.push(a),is(n.storageFieldId,i),is(s.storageFieldId,l),jf()}let Lo=!1;function Kl(){Lo||(Lo=!0,document.addEventListener("pointerdown",e=>{if(!we)return;const t=e.target;Ff(t)||xt()},!0),document.addEventListener("click",e=>{const t=e.target,r=t.closest("[data-pos-toolbar-move-confirm]");if(r&&we){e.preventDefault(),e.stopPropagation();const s=Number(we.getAttribute("data-move-from-seq")),i=we.getAttribute("data-move-button-id")??"",o=Number(r.getAttribute("data-move-to-seq"));xt(),Vf(s,o,i);return}const n=t.closest("[data-pos-toolbar-move-trigger]");if(n){if(e.preventDefault(),e.stopPropagation(),we&&dt===n){xt();return}const s=n.closest("[data-pos-toolbar-group]"),i=n.closest("[data-pos-toolbar-item]"),o=Number((s==null?void 0:s.getAttribute("data-group-seq"))??0),a=(i==null?void 0:i.getAttribute("data-button-id"))??"";Si(o)&&Ti(a)&&Uf(n,o,a)}}),document.addEventListener("keydown",e=>{e.key==="Escape"&&xt()})),document.querySelectorAll("[data-pos-toolbar-group]").forEach(e=>{if(e.dataset.posToolbarBound==="1")return;e.dataset.posToolbarBound="1";const t=e.querySelector("[data-pos-toolbar-list]");if(!t)return;let r="";e.addEventListener("change",n=>{n.target.closest("[data-pos-toolbar-enable]")&&qo(e)}),t.addEventListener("dragstart",n=>{var i;const s=n.target.closest("[data-pos-toolbar-item]");s&&(r=s.getAttribute("data-button-id")??"",(i=n.dataTransfer)==null||i.setData("text/plain",r),n.dataTransfer&&(n.dataTransfer.effectAllowed="move"),s.classList.add("opacity-50"))}),t.addEventListener("dragend",n=>{const s=n.target.closest("[data-pos-toolbar-item]");s==null||s.classList.remove("opacity-50"),r=""}),t.addEventListener("dragover",n=>{n.preventDefault(),n.dataTransfer&&(n.dataTransfer.dropEffect="move")}),t.addEventListener("drop",n=>{var o;n.preventDefault();const s=n.target.closest("[data-pos-toolbar-item]"),i=r||((o=n.dataTransfer)==null?void 0:o.getData("text/plain"))||"";!i||!s||(Kf(t,i,s,n.clientY),qo(e))})})}const Wf=43,Qf=44,Co="43-print-margin-size",Bl="44-print-margin-range",Hl=[{value:"default",label:"Default"},{value:"top-bottom",label:"Top & Bottom"},{value:"top-only",label:"Top margin only"},{value:"bottom-only",label:"Bottom margin only"}],zf="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function Mo(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Yf(e){return e===Wf}function Xf(e){return e===Qf}function Zf(){const e=H(Bl,"top-bottom");return Hl.some(t=>t.value===e)?e:"top-bottom"}function Jf(e){const t=F(Co,0),r=tt({options:Hl,fieldId:Bl,groupName:"module-setting-radio-44-print-margin-range",currentValue:Zf(),layout:"vertical",ariaLabel:"打印边距范围"});return`
    <div class="mt-3 space-y-3" data-kitchen-ticket-margin-controls>
      <input
        type="number"
        inputmode="decimal"
        step="1"
        min="0"
        class="${zf} tabular-nums"
        value="${Mo(String(t))}"
        data-module-setting-field="${Mo(Co)}"
        data-default-value="0"
        aria-label="打印边距"
      />
      <div class="space-y-2">
        <span class="block text-sm font-medium text-foreground">打印边距范围</span>
        ${r}
      </div>
    </div>`}const eb=[{code:"dine-in",label:"Dine In"},{code:"to-go",label:"To Go"},{code:"pick-up",label:"Pick Up"},{code:"delivery",label:"Delivery"}],tb=new Set([36]),rb="size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";function Ln(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function nb(e){return tb.has(e)}function sb(e,t){return`${e}-order-type-${t}`}function ib(e){const t=eb.map((r,n)=>{const s=sb(e,r.code),i=le(s,!1);return`
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-4 ${n>0?"border-l border-border":""}"
      >
        <input
          type="checkbox"
          class="${rb} rounded-sm"
          ${i?"checked":""}
          data-module-setting-checkbox="${Ln(s)}"
          aria-label="${Ln(r.label)}"
        />
        <span class="text-center leading-tight">${Ln(r.label)}</span>
      </label>`}).join("");return`
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-kitchen-order-type-multiselect="${e}"
      role="group"
      aria-label="订单类型多选"
    >
      ${t}
    </div>`}const Fl=52,Gl=[{key:"items",label:"合并相同菜",kitchenSeq:52,packingSeq:301,receiptSeq:288},{key:"modifiers",label:"合并相同子菜",kitchenSeq:53,packingSeq:302,receiptSeq:287}],ob=Gl.flatMap(e=>[e.kitchenSeq,e.packingSeq,e.receiptSeq]),ab=new Set(ob.filter(e=>e!==Fl)),lb=[{key:"kitchen",label:"厨房单"},{key:"packing",label:"打包单"},{key:"receipt",label:"食客收据"}];function Cn(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function db(e){return e===Fl}function cb(e){return ab.has(e)}function ub(e){const t=lb.map(n=>`<th scope="col" class="px-3 py-2 text-center text-xs font-medium text-muted-foreground">${Cn(n.label)}</th>`).join(""),r=Gl.map(n=>{const i=[n.kitchenSeq,n.packingSeq,n.receiptSeq].map(o=>{const a=e(o),l=`${n.label} · seq ${o}`,u=a?"bg-primary border-primary":"bg-muted border-border",m=a?"translate-x-5":"translate-x-0.5";return`
        <td class="border-t border-border px-3 py-2.5 text-center align-middle">
          <button
            type="button"
            role="switch"
            aria-checked="${a?"true":"false"}"
            aria-label="${Cn(l)}"
            data-module-setting-toggle="${o}"
            class="module-setting-toggle relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${u}"
          >
            <span class="pointer-events-none block size-5 rounded-full bg-background shadow transition-transform duration-200 ${m}" aria-hidden="true"></span>
          </button>
        </td>`}).join("");return`
      <tr>
        <th scope="row" class="border-t border-border px-3 py-2.5 text-left text-sm font-medium text-foreground">${Cn(n.label)}</th>
        ${i}
      </tr>`}).join("");return`
    <div class="mt-3 overflow-x-auto rounded-md border border-border" data-line-merge-matrix>
      <table class="w-full min-w-[20rem] border-collapse text-sm">
        <thead>
          <tr class="bg-muted/40">
            <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">规则</th>
            ${t}
          </tr>
        </thead>
        <tbody>${r}</tbody>
      </table>
    </div>`}const pb=167,Ul=256,mb=259,gb=265,cn=269,jl="269-printer-pick-before-print-lines",fb=269,bb=270,Vl=[{id:"pos",label:"POS"},{id:"paypad",label:"PayPad"},{id:"posGo",label:"POS Go"}],Ei=Vl.map(e=>e.id),hb=[mb,gb],Wl="167-print-page-height-mm",Ro=0,Ql=0,zl=2e3,vb=[{code:"order-receipt",label:"订单收据"},{code:"packing-slip",label:"打包单"},{code:"payment-signature",label:"支付签名收据"}],Yl="size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",yb="h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function Ze(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function xb(e){return e===pb}function Sb(e){return e===Ul}function Tb(e){return e===cn}function Oo(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function Eb(e){if(!Array.isArray(e))return[];const t=new Set(Ei);return e.filter(r=>typeof r=="string"&&t.has(r))}function $b(){const e=A(jl,null),t=Eb(e);if(t.length>0)return t;const r=[];return Oo(fb)&&r.push("pos"),Oo(bb)&&r.push("posGo"),r.length>0?(Xl(r),r):[]}function Xl(e){const t=Ei.filter(r=>e.includes(r));_(jl,t)}function wb(){const e=new Set($b()),t=Vl.map((r,n)=>{const s=e.has(r.id);return`
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-4 ${n>0?"border-l border-border":""}"
      >
        <input
          type="checkbox"
          class="${Yl} rounded-sm"
          value="${Ze(r.id)}"
          data-printer-pick-line="${Ze(r.id)}"
          ${s?"checked":""}
          aria-label="${Ze(r.label)}"
        />
        <span class="text-center leading-tight">${Ze(r.label)}</span>
      </label>`}).join("");return`
    <div class="flex flex-col items-end gap-2">
      <div
        class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
        data-printer-pick-before-print-editor="${cn}"
        role="group"
        aria-label="打印前选择打印机适用产线"
      >
        ${t}
      </div>
      <p class="max-w-xl text-right text-xs text-muted-foreground">
        勾选产线在出纸前弹出打印机选择；原 seq <strong>269</strong>（桌面 POS）、<strong>270</strong>（手持移动 POS）已合并。
      </p>
    </div>`}function kb(e){const t=[];return e.querySelectorAll(`[data-printer-pick-before-print-editor="${cn}"] [data-printer-pick-line]:checked`).forEach(r=>{const n=r.getAttribute("data-printer-pick-line");n&&Ei.includes(n)&&t.push(n)}),Xl(t),t}function _b(e=document){e.querySelectorAll(`[data-printer-pick-before-print-editor="${cn}"]`).forEach(t=>{t.dataset.printerPickBound!=="1"&&(t.dataset.printerPickBound="1",t.addEventListener("change",r=>{r.target.matches("[data-printer-pick-line]")&&kb(e)}))})}function Pb(e){return`256-print-logo-${e}`}function Nb(){const e=F(Wl,Ro);return Number.isFinite(e)?Math.min(zl,Math.max(Ql,Math.round(e))):Ro}function Ib(){const e=Nb();return`
    <div class="flex flex-col items-end gap-1">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${yb}"
          value="${Ze(String(e))}"
          min="${Ql}"
          max="${zl}"
          step="1"
          data-module-setting-number="${Ze(Wl)}"
          aria-label="单张小票最大页高（毫米）"
        />
        <span class="text-sm text-muted-foreground">mm</span>
      </div>
      <span class="text-xs text-muted-foreground">0 表示不限制长度</span>
    </div>`}function Db(){const e=vb.map((t,r)=>{const n=Pb(t.code),s=t.code==="order-receipt",i=le(n,s);return`
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-4 ${r>0?"border-l border-border":""}"
      >
        <input
          type="checkbox"
          class="${Yl} rounded-sm"
          ${i?"checked":""}
          data-module-setting-checkbox="${Ze(n)}"
          aria-label="${Ze(t.label)}"
        />
        <span class="text-center leading-tight">${Ze(t.label)}</span>
      </label>`}).join("");return`
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-print-logo-by-ticket="${Ul}"
      role="group"
      aria-label="按票种打印 Logo"
    >
      ${e}
    </div>`}const Ab=234,qb=[29,233,448,511],Zl="234-payment-methods-config",wt=[{id:"pos",label:"POS"},{id:"kiosk",label:"Kiosk"},{id:"emenu",label:"eMenu"},{id:"paypad",label:"Paypad"}],bt=[{code:"cash",label:"现金"},{code:"credit-card",label:"信用卡"},{code:"gift-card",label:"礼品卡"},{code:"member-card",label:"会员卡"},{code:"wechat",label:"微信"},{code:"alipay",label:"阿里"}];new Set(bt.map(e=>e.code));const Lb=new Set(qb),Zt=wt.map(e=>e.id),Jl={cash:["pos","kiosk","emenu","paypad"],"credit-card":["pos","kiosk","emenu","paypad"],"gift-card":["pos","emenu","paypad"],"member-card":["pos","emenu","paypad"],wechat:["pos","emenu","paypad"],alipay:["pos","emenu","paypad"]};function ze(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function $i(){return`custom-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}function Cb(e){return{id:typeof e.id=="string"&&e.id?e.id:$i(),name:typeof e.name=="string"?e.name:"",openDrawer:!!e.openDrawer}}function Kr(){const e={};for(const t of bt)e[t.code]=[...Jl[t.code]??Zt];return e}function Mb(){return{customMethods:[],byMethod:Kr()}}function Rb(e){const t={};for(const n of wt)for(const s of e[n.id]??[])t[s]||(t[s]=new Set),t[s].add(n.id);const r={...Kr()};for(const[n,s]of Object.entries(t))r[n]=[...s];return r}function Ob(){const e=le("233-wechat",!1)||le("233-payment-wechat",!1),t=le("233-alipay",!1)||le("233-payment-alipay",!1);return{wechat:e,alipay:t}}function ed(e){var i,o;const t=Array.isArray(e.customMethods)?e.customMethods.map(a=>Cb(a)):[],r=e.byMethod&&typeof e.byMethod=="object"&&Object.keys(e.byMethod).length>0,n=e.byProductLine&&typeof e.byProductLine=="object"&&Object.keys(e.byProductLine).length>0;let s=Kr();if(r){s={...Kr()};for(const[a,l]of Object.entries(e.byMethod))Array.isArray(l)&&(s[a]=l.filter(u=>Zt.includes(u)))}else n&&(s=Rb(e.byProductLine));if(!r&&!n){const a=Ob();if(a.wechat){const l=new Set(s.wechat??[]);Zt.forEach(u=>l.add(u)),s.wechat=[...l]}if(a.alipay){const l=new Set(s.alipay??[]);Zt.forEach(u=>l.add(u)),s.alipay=[...l]}}for(const a of bt)(i=s[a.code])!=null&&i.length||(s[a.code]=[...Jl[a.code]??Zt]);for(const a of t)(o=s[a.id])!=null&&o.length||(s[a.id]=["pos"]);return{customMethods:t,byMethod:s}}function td(){const e=A(Zl,{});return!e||typeof e!="object"?Mb():ed(e)}function os(e){_(Zl,ed(e))}function Kb(e){return e===Ab}function Bb(e){return Lb.has(e)}function Hb(e,t,r){return(e.byMethod[t]??[]).includes(r)}function Fb(e){const t=bt.map(n=>({id:n.code,label:n.label,isCustom:!1})),r=e.customMethods.map(n=>({id:n.id,label:n.name.trim()||"（未命名）",isCustom:!0,openDrawer:n.openDrawer}));return[...t,...r]}function Gb(){return wt.map(e=>`<th scope="col" class="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">${ze(e.label)}</th>`).join("")}function Ub(e,t){return wt.map(r=>{const n=Hb(t,e,r.id);return`
      <td class="border-t border-border px-2 py-2 text-center align-middle">
        <input
          type="checkbox"
          class="${q} rounded-sm"
          ${n?"checked":""}
          data-payment-method-id="${ze(e)}"
          data-payment-product-line="${ze(r.id)}"
          aria-label="${ze(r.label)}"
        />
      </td>`}).join("")}function jb(e){const r=Fb(e).map(n=>{var o;const s=n.isCustom?`
        <td class="border-t border-border px-2 py-2 text-center align-middle">
          <input
            type="checkbox"
            class="${q} rounded-sm"
            ${n.openDrawer?"checked":""}
            data-payment-custom-open-drawer
            data-custom-id="${ze(n.id)}"
            aria-label="可开钱箱"
          />
        </td>
        <td class="border-t border-border px-2 py-2 text-right align-middle">
          <button type="button" class="text-sm text-destructive hover:underline" data-payment-custom-remove>删除</button>
        </td>`:`
        <td class="border-t border-border px-2 py-2 text-center text-muted-foreground">—</td>
        <td class="border-t border-border px-2 py-2 text-center text-muted-foreground">—</td>`,i=n.isCustom?`<input
            type="text"
            class="h-8 w-full min-w-[6rem] rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value="${ze(((o=e.customMethods.find(a=>a.id===n.id))==null?void 0:o.name)??"")}"
            placeholder="支付方式名称"
            data-payment-custom-name
            data-custom-id="${ze(n.id)}"
          />`:`<span class="text-sm font-medium text-foreground">${ze(n.label)}</span>`;return`
      <tr data-payment-method-row data-method-id="${ze(n.id)}" ${n.isCustom?"data-payment-custom-row":""} ${n.isCustom?`data-custom-id="${ze(n.id)}"`:""}>
        <th scope="row" class="border-t border-border px-3 py-2.5 text-left align-middle font-normal">${i}</th>
        ${Ub(n.id,e)}
        ${s}
      </tr>`}).join("");return`
    <div class="overflow-x-auto rounded-md border border-border" data-payment-methods-matrix>
      <table class="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr class="bg-muted/50">
            <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">支付方式</th>
            ${Gb()}
            <th scope="col" class="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">可开钱箱</th>
            <th scope="col" class="px-2 py-2 text-right text-xs font-medium text-muted-foreground w-14">操作</th>
          </tr>
        </thead>
        <tbody>${r}</tbody>
      </table>
    </div>`}function rd(){const e=td();return`
    <div class="space-y-3" data-payment-methods-editor>
      <p class="m-0 text-xs text-muted-foreground">每种支付方式勾选适用的产线终端（多选）。例：现金、刷卡可同时用于 POS 与 Kiosk，会员卡仅 POS。</p>
      ${jb(e)}
      <button
        type="button"
        class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
        data-payment-custom-add
      >新增支付方式</button>
    </div>`}function as(e){const t=td(),r={...t.byMethod},n=new Set([...bt.map(i=>i.code),...t.customMethods.map(i=>i.id)]);for(const i of n){const o=[];e.querySelectorAll(`input[data-payment-method-id="${i}"][data-payment-product-line]:checked`).forEach(a=>{const l=a.getAttribute("data-payment-product-line");l&&o.push(l)}),r[i]=o}const s=[];return e.querySelectorAll("[data-payment-custom-row]").forEach(i=>{var u,m,T;const o=i.getAttribute("data-custom-id")??$i(),a=((u=i.querySelector("[data-payment-custom-name]"))==null?void 0:u.value.trim())??"",l=!!((m=i.querySelector("[data-payment-custom-open-drawer]"))!=null&&m.checked);s.push({id:o,name:a,openDrawer:l}),(T=r[o])!=null&&T.length||(r[o]=["pos"])}),{customMethods:s,byMethod:r}}function Ko(e){if(!e.parentElement)return;const r=document.createElement("div");r.innerHTML=rd().trim();const n=r.firstElementChild;n&&(e.replaceWith(n),nd(n))}function Bo(e){os(as(e))}function nd(e=document){e.querySelectorAll("[data-payment-methods-editor]").forEach(t=>{t.dataset.paymentMethodsEditorBound!=="1"&&(t.dataset.paymentMethodsEditorBound="1",t.addEventListener("change",r=>{const n=r.target;(n.matches("[data-payment-product-line]")||n.matches("[data-payment-custom-open-drawer]"))&&Bo(t)}),t.addEventListener("input",r=>{r.target.matches("[data-payment-custom-name]")&&Bo(t)}),t.addEventListener("click",r=>{const n=r.target;if(n.closest("[data-payment-custom-add]")){const i=as(t),o=$i();i.customMethods.push({id:o,name:"",openDrawer:!1}),i.byMethod[o]=["pos","kiosk","emenu","paypad"],os(i),Ko(t);return}const s=n.closest("[data-payment-custom-remove]");if(s){const i=s.closest("[data-payment-custom-row]"),o=i==null?void 0:i.getAttribute("data-custom-id");if(!o)return;const a=as(t);a.customMethods=a.customMethods.filter(l=>l.id!==o),delete a.byMethod[o],os(a),Ko(t)}}))})}const un=246,Vb=247,Wb=261,Qb=272,Ft=250,sd=[Wb,Vb,Qb],zb=[Ft],id="246-receipt-print-by-method",od="250-delete-card-receipt-copies",ad=[{key:"customerCopy",label:"Customer copy"},{key:"merchantCopy",label:"Merchant copy"}],Yb="size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";function qt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function wi(){const e={};for(const t of bt)e[t.code]=!1;return e}function ls(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function ld(e){const t=wi();if(!e||typeof e!="object")return t;for(const r of bt){const n=e[r.code];typeof n=="boolean"&&(t[r.code]=n)}return t}function Xb(){const e=A(id,null),t=ld(e);if(Object.values(t).some(Boolean)||e&&typeof e=="object"&&Object.keys(e).length>0)return t;const n=wi();return ls(263)&&(n["credit-card"]=!0),ls(268)&&(n.wechat=!0,n.alipay=!0),n}function Zb(e){_(id,ld(e))}function Jb(e){return e===un}function eh(e){return sd.includes(e)}function dd(e){return e===Ft}function ki(){return{customerCopy:!1,merchantCopy:!1}}function cd(e){const t=ki();if(!e||typeof e!="object")return t;for(const r of ad){const n=e[r.key];typeof n=="boolean"&&(t[r.key]=n)}return t}function th(){const e=A(od,null);return e&&typeof e=="object"&&Object.keys(e).length>0?cd(e):ls(Ft)?{customerCopy:!0,merchantCopy:!0}:ki()}function rh(e){_(od,cd(e))}function nh(e,t){const r=th(),n=t?"":"hidden",s=ad.map(i=>{const o=r[i.key];return`
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${q} rounded-sm"
          data-delete-card-receipt-copy="${qt(i.key)}"
          ${o?"checked":""}
          ${t?"":"disabled"}
          aria-label="${qt(i.label)}"
        />
        <span>${qt(i.label)}</span>
      </label>`}).join("");return`
    <div
      class="mt-3 rounded-lg bg-muted/50 p-3 ${n}"
      data-delete-card-receipt-panel="${e}"
      ${t?"":'aria-hidden="true"'}
    >
      <div
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="删除信用卡支付时打印的签购单联次"
        data-delete-card-receipt-copies-editor="${Ft}"
      >
        ${s}
      </div>
    </div>`}function sh(e,t){document.querySelectorAll(`[data-delete-card-receipt-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true"),r.querySelectorAll("[data-delete-card-receipt-copy]").forEach(n=>{var s,i,o;n.disabled=!t,(s=n.closest("label"))==null||s.classList.toggle("cursor-not-allowed",!t),(i=n.closest("label"))==null||i.classList.toggle("opacity-50",!t),(o=n.closest("label"))==null||o.classList.toggle("cursor-pointer",t)})})}function ih(e){const t=ki();return e.querySelectorAll(`[data-delete-card-receipt-copies-editor="${Ft}"] [data-delete-card-receipt-copy]`).forEach(r=>{const n=r.getAttribute("data-delete-card-receipt-copy");n&&n in t&&(t[n]=r.checked)}),t}function oh(){const e=Xb(),t=bt.map(r=>{const n=e[r.code];return`
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${Yb} rounded-sm"
          data-receipt-print-by-method="${qt(r.code)}"
          ${n?"checked":""}
          aria-label="${qt(r.label)}"
        />
        <span>${qt(r.label)}</span>
      </label>`}).join("");return`
    <div
      class="flex max-w-xl flex-col items-end gap-2"
      data-receipt-print-by-method-editor="${un}"
    >
      <div class="flex flex-wrap justify-end gap-2" role="group" aria-label="按支付方式打印收据：使用以下支付方式时打印收据小票">
        ${t}
      </div>
      <p class="text-right text-xs text-muted-foreground">
        原「一键付款/信用卡」「微信/阿里」打印已并入本项（seq 263/268）。
      </p>
    </div>`}function ah(e){const t=wi();return e.querySelectorAll(`[data-receipt-print-by-method-editor="${un}"] [data-receipt-print-by-method]`).forEach(r=>{const n=r.getAttribute("data-receipt-print-by-method");n&&n in t&&(t[n]=r.checked)}),t}function lh(e=document){e.querySelectorAll(`[data-receipt-print-by-method-editor="${un}"]`).forEach(t=>{t.dataset.receiptPrintByMethodBound!=="1"&&(t.dataset.receiptPrintByMethodBound="1",t.addEventListener("change",r=>{r.target.matches("[data-receipt-print-by-method]")&&Zb(ah(e))}))}),e.querySelectorAll(`[data-delete-card-receipt-copies-editor="${Ft}"]`).forEach(t=>{t.dataset.deleteCardReceiptCopiesBound!=="1"&&(t.dataset.deleteCardReceiptCopiesBound="1",t.addEventListener("change",r=>{r.target.matches("[data-delete-card-receipt-copy]")&&rh(ih(e))}))})}const ud=34,dh=281,ch=297,pd="34-packing-slip-copies",md=[dh,ch],Ho=1,ds=1,cs=9,uh="h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function Fo(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ph(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function mh(e){return e===ud}function gh(e){return md.includes(e)}function fh(){let e=F(pd,Ho);return!Number.isFinite(e)&&ph(ud)&&(e=1),Number.isFinite(e)?Math.min(cs,Math.max(ds,Math.round(e))):Ho}function bh(){const e=fh();return`
    <div class="flex flex-col items-end gap-1">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${uh}"
          value="${Fo(String(e))}"
          min="${ds}"
          max="${cs}"
          step="1"
          data-module-setting-number="${Fo(pd)}"
          aria-label="打包单打印份数"
        />
        <span class="text-sm text-muted-foreground">份</span>
      </div>
      <span class="text-xs text-muted-foreground">${ds}–${cs} 份</span>
    </div>`}const _i=303,hh=[_i],gd="303-packing-slip-void-item-style",vh="module-setting-radio-303-packing-slip-void-item-style",fd=[{value:"crosses",label:"print crosses(X) on void items"},{value:"zero-amount",label:"print 0 amount on void items"}],Mn="crosses";function yh(e){return fd.some(t=>t.value===e)}function xh(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function bd(e){return e===_i}function Sh(){const e=H(gd,Mn);return yh(e)?e:(xh(_i),Mn)}function Th(e,t){const r=t?"":"hidden",n=tt({options:fd,fieldId:gd,groupName:vh,currentValue:Sh(),layout:"vertical",ariaLabel:"打包单删除菜品展示样式"});return`
    <div
      class="mt-3 rounded-lg bg-muted/50 p-3 ${r}"
      data-packing-slip-void-style-panel="${e}"
      ${t?"":'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">删菜展示样式</p>
      ${n}
    </div>`}function Eh(e,t){document.querySelectorAll(`[data-packing-slip-void-style-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true"),r.querySelectorAll("input[type='radio']").forEach(n=>{var s,i,o;n.disabled=!t,(s=n.closest("label"))==null||s.classList.toggle("cursor-not-allowed",!t),(i=n.closest("label"))==null||i.classList.toggle("opacity-50",!t),(o=n.closest("label"))==null||o.classList.toggle("cursor-pointer",t)})})}const $h=282,wh=286,kh=277,_h=279,Ph=280,Nh=264,hd="282-receipt-dish-spacing",vd="280-receipt-auto-surcharge-hint",Go=0,us=0,ps=9,Ih="h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",Dh="h-9 w-full min-w-[12rem] max-w-md rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",yd=[wh,kh,_h,Nh];function Br(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Ah(e){return e===$h}function qh(e){return e===Ph}function Lh(e){return yd.includes(e)}function Ch(){const e=F(hd,Go);return Number.isFinite(e)?Math.min(ps,Math.max(us,Math.round(e))):Go}function Mh(){const e=Ch();return`
    <div class="flex flex-col items-end gap-1">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${Ih}"
          value="${Br(String(e))}"
          min="${us}"
          max="${ps}"
          step="1"
          data-module-setting-number="${Br(hd)}"
          aria-label="收据菜品行间距"
        />
        <span class="text-sm text-muted-foreground">空行</span>
      </div>
      <span class="text-xs text-muted-foreground">${us}–${ps}，0 为默认间距</span>
    </div>`}function Rh(){return Ge(vd,"")}function Oh(){const e=Rh();return`
    <input
      type="text"
      class="${Dh}"
      value="${Br(e)}"
      placeholder="请输入自动加收提示文案"
      data-module-setting-text="${Br(vd)}"
      autocomplete="off"
      aria-label="收据自动加收提示默认文案"
    />`}const Kh=275,Bh=274,Hh=278,Fh=276,Gh=285,Uh=289,jh=283,Vh=284,xd=[Kh,Bh,Hh,Fh,Gh,Uh,jh,Vh];function Wh(e){return xd.includes(e)}const Sd=262,Td=273,Qh=[Td],Ed="262-first-receipt-copies",Uo=1,ms=1,gs=9,zh="h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function jo(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Yh(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function Xh(e){return e===Sd}function Zh(e){return e===Td}function Jh(){let e=F(Ed,Uo);return!Number.isFinite(e)&&Yh(Sd)&&(e=1),Number.isFinite(e)?Math.min(gs,Math.max(ms,Math.round(e))):Uo}function ev(){const e=Jh();return`
    <div class="flex flex-col items-end gap-1">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${zh}"
          value="${jo(String(e))}"
          min="${ms}"
          max="${gs}"
          step="1"
          data-module-setting-number="${jo(Ed)}"
          aria-label="第一份收据打印份数"
        />
        <span class="text-sm text-muted-foreground">份</span>
      </div>
      <span class="text-xs text-muted-foreground">${ms}–${gs} 份</span>
    </div>`}const tv=[...Array.from({length:3},(e,t)=>193+t),...Array.from({length:19},(e,t)=>197+t)],rv=[169,347,351,534,642],nv=[32,37,62,304],sv=[54,40,47,51,61],iv=[52,53,287,288,301,302],ov=[35,42,45,46,48,49,50,55,56,57,58],av=[38,41,33,59,60],lv=[298,299,300],dv=[115,116,117,119,124,140,141],cv=[155,157,158,159],uv=[248,221],pv=[162,163,164],mv=[149,161],gv=[77,582],fv=[142,144,160],bv=[293,294,253,244],hv=[232],vv=[239,240],yv=[90,92],xv=[488,490,491],Sv=[2,6],Tv=[12],Ev=[342],$v=[171,65,330],wv=[181],kv=[241],_v=gv,$d=new Set([...uv,...dv,...cv,...pv,...mv,...nv,...sv,...iv,...ov,...av,...lv,..._v,...fv,...bv,...hv,...vv,...yv,...xv,...Sv,...Tv,...Ev,...$v,...wv,...hb,...sd,...zb,...Qh,...xd,...yd,...md,...hh,...kv,461,462,466,521,522,523,535,536,544,545,569,570,573,577,578,579,580,597,598,616,617,618,73,74,118,176,177,216,219,220,348,350,515,516,518,519,520,524,528,530,532,600,601,602,604,606,607,608,611,612,645,647,672,...rv,...tv]);function Pv(e){return $d.has(e)}function ee(e){return`bplant-module-setting-toggle:${e}`}function Vo(e){return $d.has(e)}const Pi=133,Ni=134,wd="order-same-dish-display-mode",Nv={split:"拆分显示",merge:"合并显示"};function Wo(e){try{const t=localStorage.getItem(ee(e));return t===null?null:t==="1"}catch{return null}}function Iv(){const e=H(wd,"");if(e==="split"||e==="merge")return e;const t=Wo(Pi),r=Wo(Ni);return r===!0&&t!==!0?"merge":t===!0&&r!==!0?"split":"merge"}function Dv(e){Ht(wd,e);try{localStorage.setItem(ee(Pi),e==="split"?"1":"0"),localStorage.setItem(ee(Ni),e==="merge"?"1":"0")}catch{}}function Av(e){return e===Pi}function qv(e){return e===Ni}function hr(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Lv(e,t){const r=Iv(),n="module-setting-radio-order-same-dish-display",s=["split","merge"].map(o=>{const a=r===o;return`
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="${hr(n)}"
            value="${o}"
            class="${hr(e)}"
            ${a?"checked":""}
            data-order-same-dish-display-radio="1"
          />
          <span>${hr(Nv[o])}</span>
        </label>`}).join(""),i=(t==null?void 0:t.trim())||"设置相同的菜在点单页分开展示，还是合并为一行展示。";return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1 space-y-1">
              <p class="text-sm font-medium text-card-foreground">相同菜品展示</p>
              <p class="text-xs leading-relaxed text-muted-foreground">${hr(i)}</p>
            </div>
            <div class="flex flex-wrap items-center gap-4 sm:pt-0.5">${s}</div>
          </div>
        </li>`}function Cv(e=document){e.querySelectorAll("[data-order-same-dish-display-radio]").forEach(t=>{t.dataset.orderSameDishDisplayBound!=="1"&&(t.dataset.orderSameDishDisplayBound="1",t.addEventListener("change",()=>{if(!t.checked)return;const r=t.value;r!=="split"&&r!=="merge"||Dv(r)}))})}const Ii=446,Ue=447,mr=new Set([Ii,Ue]),Mv={[Ii]:"446-discount-presets",[Ue]:"447-surcharge-presets"},kd={[Ii]:{addLabel:"新增折扣",nameHeader:"折扣名称",namePlaceholder:"请输入折扣名称"},[Ue]:{addLabel:"新增加收",nameHeader:"加收名称",namePlaceholder:"请输入加收名称"}},vt="h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",Rv="min-h-[84px] w-full min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",Ov=[{id:"dine-in",label:"Dine In"},{id:"to-go",label:"To Go"},{id:"delivery",label:"Delivery"},{id:"pick-up",label:"Pick Up"},{id:"ktv5554",label:"KTV5554"},{id:"hu",label:"HU"},{id:"custom-order-type-1",label:"Custom Order Type 1"},{id:"custom-order-type-4",label:"Custom Order Type 4"},{id:"online-to-go",label:"Online To Go"}],_d=[{value:"service",label:"服务费"},{value:"delivery",label:"送餐费"},{value:"other",label:"其他"}];function re(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function pn(){return`preset-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}function Di(e){return Mv[e]??`${e}-rate-presets`}function Pd(e){var t;return((t=_d.find(r=>r.value===e))==null?void 0:t.label)??"服务费"}function Nd(e){if(e==="service"||e==="delivery"||e==="other")return e;if(typeof e=="string"){const t=e.trim().toLowerCase();if(t.includes("送餐")||t.includes("delivery"))return"delivery";if(t.includes("其他")||t.includes("other"))return"other"}return"service"}function Kv(){return{feeType:"service",feeTypeLabel:"服务费",minGuests:0,minDistance:0,minAmount:0,description:"",applyMode:"auto",taxable:!1,asTip:!1,enabled:!0,orderTypes:["dine-in"]}}function Ai(e){const t=Kv(),r=Nd((e==null?void 0:e.feeType)??(e==null?void 0:e.feeTypeLabel)),n=Number(e==null?void 0:e.minGuests),s=Number(e==null?void 0:e.minDistance),i=Number(e==null?void 0:e.minAmount),o=Array.isArray(e==null?void 0:e.orderTypes)?e.orderTypes.filter(a=>typeof a=="string"&&a.trim().length>0).map(a=>a.trim()):t.orderTypes;return{feeType:r,feeTypeLabel:Pd(r),minGuests:Number.isFinite(n)?Math.max(0,Math.round(n)):t.minGuests,minDistance:Number.isFinite(s)?Math.max(0,s):t.minDistance,minAmount:Number.isFinite(i)?Math.max(0,i):t.minAmount,description:typeof(e==null?void 0:e.description)=="string"?e.description.slice(0,100):t.description,applyMode:(e==null?void 0:e.applyMode)==="manual"?"manual":"auto",taxable:(e==null?void 0:e.taxable)===!0,asTip:(e==null?void 0:e.asTip)===!0,enabled:(e==null?void 0:e.enabled)!==!1,orderTypes:o.length?[...new Set(o)]:t.orderTypes}}function mn(e,t){const r=e.kind==="fixed"?"fixed":"percent",n=Number(e.value),s=Number.isFinite(n)?Math.max(0,n):0,i=r==="percent"?Math.min(100,s):s,o={id:typeof e.id=="string"&&e.id?e.id:pn(),name:typeof e.name=="string"?e.name:"",kind:r,value:i};return t===Ue&&(o.surcharge=Ai(e.surcharge)),o}function kt(e){const t=Di(e),r=A(t,[]);return Array.isArray(r)?r.map(n=>mn(n,e)):[]}function gr(e,t){_(Di(e),t.map(r=>mn(r,e)))}function Bv(e){return mr.has(e)}function Id(e){return e==="fixed"?"元":"%"}function Hv(e){const t=`rate-preset-kind-${re(e.id)}`;return[{value:"percent",label:"百分比"},{value:"fixed",label:"固定金额"}].map(n=>{const s=e.kind===n.value;return`
        <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${t}"
            value="${n.value}"
            class="${q}"
            ${s?"checked":""}
            data-rate-preset-kind
            aria-label="${re(n.label)}"
          />
          <span>${re(n.label)}</span>
        </label>`}).join("")}function Fv(e,t,r){var i;if(e===Ue){const o=t.kind==="percent"?"百分比":"固定金额",a=t.kind==="percent"?`${t.value}%`:`${t.value} 元`,l=((i=t.surcharge)==null?void 0:i.enabled)!==!1;return`
    <tr class="border-t border-border" data-rate-preset-row data-preset-id="${re(t.id)}">
      <td class="px-3 py-2.5">
        <span class="text-sm text-foreground">${re(t.name||"未命名加收")}</span>
      </td>
      <td class="px-3 py-2.5">
        <span class="text-sm text-muted-foreground">${re(o)}</span>
      </td>
      <td class="px-3 py-2.5">
        <span class="text-sm tabular-nums text-foreground">${re(a)}</span>
      </td>
      <td class="px-3 py-2.5 text-right whitespace-nowrap">
        <div class="inline-flex items-center gap-2">
          <button
            type="button"
            class="rounded border border-border px-2 py-1 text-xs ${l?"text-emerald-600 hover:bg-emerald-50":"text-muted-foreground hover:bg-muted"}"
            data-surcharge-row-toggle-enabled
          >${l?"已启用":"已停用"}</button>
          <button
            type="button"
            class="text-xs font-medium text-foreground hover:underline"
            data-surcharge-row-edit
          >编辑</button>
          <button
            type="button"
            class="text-xs font-medium text-destructive hover:underline"
            data-rate-preset-remove
          >删除</button>
        </div>
      </td>
    </tr>`}const n=Id(t.kind),s=t.kind==="percent"?' max="100"':"";return`
    <tr class="border-t border-border" data-rate-preset-row data-preset-id="${re(t.id)}">
      <td class="px-3 py-2.5">
        <input
          type="text"
          class="${vt}"
          value="${re(t.name)}"
          placeholder="${re(r)}"
          data-rate-preset-name
        />
      </td>
      <td class="px-3 py-2.5">
        <div class="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3" role="radiogroup" aria-label="比例类型">
          ${Hv(t)}
        </div>
      </td>
      <td class="px-3 py-2.5">
        <div class="flex items-center gap-1.5">
          <input
            type="number"
            inputmode="decimal"
            class="${vt} max-w-[8rem] tabular-nums"
            value="${re(String(t.value))}"
            min="0"
            step="0.01"${s}
            data-rate-preset-value
            aria-label="比例数值"
          />
          <span class="shrink-0 text-sm text-muted-foreground" data-rate-preset-suffix>${re(n)}</span>
        </div>
      </td>
      <td class="px-3 py-2.5 text-right whitespace-nowrap">
        <button
          type="button"
          class="text-sm font-medium text-destructive hover:underline"
          data-rate-preset-remove
        >删除</button>
      </td>
    </tr>`}function Dd(e,t){const r=kd[e];if(!r||t.length===0)return"";const n=e===Ue?"w-[16rem]":"w-[4.5rem]",s=t.map(i=>Fv(e,i,r.namePlaceholder)).join("");return`
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">${re(r.nameHeader)}</th>
            <th class="px-3 py-2 font-medium w-[8.5rem]">比例类型</th>
            <th class="px-3 py-2 font-medium w-[10rem]">比例</th>
            <th class="px-3 py-2 text-right font-medium ${n}">操作</th>
          </tr>
        </thead>
        <tbody data-rate-preset-list>${s}</tbody>
      </table>
    </div>`}function Gv(e,t){const r=t.length>0,n=r?Dd(e,t):"";return`
    <div
      data-rate-preset-table-wrap
      class="${r?"":"hidden"}"
      ${r?"":'aria-hidden="true"'}
    >${n}</div>`}function Uv(){const e=Ov.map(r=>`
      <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
        <input type="checkbox" class="${q}" value="${re(r.id)}" data-surcharge-dialog-order-type ${r.id==="dine-in"?"checked":""}/>
        <span>${re(r.label)}</span>
      </label>`).join(""),t=_d.map((r,n)=>`
      <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
        <input
          type="radio"
          name="surcharge-dialog-fee-type"
          value="${r.value}"
          class="${q}"
          data-surcharge-dialog-fee-type
          ${n===0?"checked":""}
        />
        <span>${re(r.label)}</span>
      </label>`).join("");return`
    <div class="fixed inset-0 z-[10040] hidden items-start justify-center overflow-y-auto p-4 sm:items-center" data-surcharge-create-dialog aria-hidden="true">
      <button type="button" class="absolute inset-0 bg-black/45" data-surcharge-dialog-close aria-label="关闭"></button>
      <div class="relative z-10 my-6 flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="surcharge-create-dialog-title">
        <div class="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h3 id="surcharge-create-dialog-title" class="text-base font-semibold text-foreground" data-surcharge-dialog-title>新增加收</h3>
          <button type="button" class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" data-surcharge-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4">
          <div class="space-y-4">
          <div class="grid grid-cols-1 gap-3">
            <label class="space-y-1.5">
              <span class="text-sm text-foreground">名称</span>
              <input class="${vt}" type="text" maxlength="50" placeholder="不能为空" data-surcharge-dialog-name />
            </label>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">金额类型</span>
            <div class="flex flex-wrap items-center gap-4">
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-kind" value="fixed" class="${q}" checked data-surcharge-dialog-kind />
                <span>$ 金额</span>
              </label>
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-kind" value="percent" class="${q}" data-surcharge-dialog-kind />
                <span>% 百分比</span>
              </label>
            </div>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground" data-surcharge-dialog-value-label>金额（固定）</span>
            <div class="flex items-center gap-2">
              <input
                class="${vt} max-w-[16rem]"
                type="number"
                min="0"
                max="10000"
                step="0.001"
                placeholder="在 0 到 10000 之间，最多三位小数"
                data-surcharge-dialog-value
              />
              <span class="text-sm text-muted-foreground" data-surcharge-dialog-value-suffix>元</span>
            </div>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">类型</span>
            <div class="flex flex-wrap items-center gap-4">${t}</div>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">最低消费金额</span>
            <input class="${vt}" type="number" min="0" max="10000000" step="0.01" placeholder="在 0 到 10000000 之间，最多两位小数" data-surcharge-dialog-min-amount />
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="space-y-1.5" data-surcharge-field-group="service">
              <span class="text-sm text-foreground">最低用餐人数</span>
              <input class="${vt}" type="number" min="0" max="1000" step="1" placeholder="在 0 到 1000 之间，是一个整数" data-surcharge-dialog-min-guests />
            </label>
            <label class="hidden space-y-1.5" data-surcharge-field-group="delivery">
              <span class="text-sm text-foreground">最低里程</span>
              <input class="${vt}" type="number" min="0" max="1000" step="0.1" placeholder="在 0 到 1000 之间，最多一位小数" data-surcharge-dialog-min-distance />
            </label>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">描述</span>
            <textarea class="${Rv}" maxlength="100" placeholder="最长100个字符" data-surcharge-dialog-description></textarea>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">应用</span>
            <div class="flex items-center gap-4">
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-apply-mode" value="auto" class="${q}" checked data-surcharge-dialog-apply-mode />
                <span>自动加收</span>
              </label>
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-apply-mode" value="manual" class="${q}" data-surcharge-dialog-apply-mode />
                <span>手动加收</span>
              </label>
            </div>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">计税</span>
            <div class="flex items-center gap-4">
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-taxable" value="yes" class="${q}" data-surcharge-dialog-taxable />
                <span>是</span>
              </label>
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground">
                <input type="radio" name="surcharge-dialog-taxable" value="no" class="${q}" checked data-surcharge-dialog-taxable />
                <span>否</span>
              </label>
            </div>
          </div>
          <div class="space-y-2">
            <span class="text-sm text-foreground">记作小费</span>
            <div class="flex items-center gap-4">
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground" data-surcharge-dialog-tip-option="yes">
                <input type="radio" name="surcharge-dialog-tip" value="yes" class="${q}" data-surcharge-dialog-tip />
                <span>是</span>
              </label>
              <label class="inline-flex items-center gap-1.5 text-sm text-foreground" data-surcharge-dialog-tip-option="no">
                <input type="radio" name="surcharge-dialog-tip" value="no" class="${q}" checked data-surcharge-dialog-tip />
                <span>否</span>
              </label>
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-sm text-foreground">状态</div>
            <div>
              <label class="inline-flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" class="${q}" checked data-surcharge-dialog-enabled />
                <span>是否生效</span>
              </label>
            </div>
          </div>
            <fieldset class="space-y-2">
              <legend class="text-sm text-foreground">订单类型</legend>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">${e}</div>
            </fieldset>
          </div>
        </div>
        <div class="sticky bottom-0 z-20 flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted" data-surcharge-dialog-cancel>取消</button>
          <button type="button" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" data-surcharge-dialog-save>保存</button>
        </div>
      </div>
    </div>`}function jv(e){const t=kd[e];if(!t)return"";const r=kt(e),n=e===Ue?Uv():"";return`
    <div
      class="space-y-3"
      data-rate-preset-editor
      data-preset-seq="${e}"
      data-storage-id="${re(Di(e))}"
    >
      ${Gv(e,r)}
      <div class="flex justify-start">
        <button
          type="button"
          class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
          data-rate-preset-add
        >${re(t.addLabel)}</button>
      </div>
      ${n}
    </div>`}function Ad(e){const t=e.querySelector("[data-rate-preset-kind]:checked");return(t==null?void 0:t.value)==="fixed"?"fixed":"percent"}function $r(e){const t=Ad(e),r=e.querySelector("[data-rate-preset-suffix]");r&&(r.textContent=Id(t));const n=e.querySelector("[data-rate-preset-value]");if(n)if(t==="percent"){n.setAttribute("max","100");const s=Number(n.value);Number.isFinite(s)&&s>100&&(n.value="100")}else n.removeAttribute("max")}function Vv(e){const t=[];return e.querySelectorAll("[data-rate-preset-row]").forEach(r=>{var a,l;const n=r.getAttribute("data-preset-id")??pn(),s=((a=r.querySelector("[data-rate-preset-name]"))==null?void 0:a.value.trim())??"",i=Ad(r),o=Number((l=r.querySelector("[data-rate-preset-value]"))==null?void 0:l.value);t.push(mn({id:n,name:s,kind:i,value:Number.isFinite(o)?o:0}))}),t}function Rn(e){const t=Number(e.getAttribute("data-preset-seq"));mr.has(t)&&gr(t,Vv(e))}function gn(e){const t=Number(e.getAttribute("data-preset-seq"));if(!mr.has(t))return;const r=kt(t),n=e.querySelector("[data-rate-preset-table-wrap]");if(n){if(r.length===0){n.innerHTML="",n.classList.add("hidden"),n.setAttribute("aria-hidden","true");return}n.innerHTML=Dd(t,r),n.classList.remove("hidden"),n.removeAttribute("aria-hidden"),n.querySelectorAll("[data-rate-preset-row]").forEach($r)}}function Wv(e){var i;const t=Number(e.getAttribute("data-preset-seq"));if(!mr.has(t))return;const r=kt(t);r.push({id:pn(),name:"",kind:"percent",value:10}),gr(t,r),gn(e);const n=e.querySelectorAll("[data-rate-preset-row]"),s=n[n.length-1];(i=s==null?void 0:s.querySelector("[data-rate-preset-name]"))==null||i.focus()}function qi(e,t,r=""){const n=e.querySelector("[data-surcharge-create-dialog]");if(!n)return;n.dataset.dialogMode=t,n.dataset.editPresetId=r;const s=n.querySelector("[data-surcharge-dialog-title]");s&&(s.textContent=t==="edit"?"编辑加收":"新增加收");const i=n.querySelector("[data-surcharge-dialog-save]");i&&(i.textContent=t==="edit"?"保存修改":"保存")}function Qv(e){var s;const t=e.querySelector("[data-surcharge-create-dialog]");if(!t)return;const r=(i,o)=>{const a=t.querySelector(i);a&&(a.value=o)},n=(i,o)=>{const a=t.querySelector(i);a&&(a.checked=o)};r("[data-surcharge-dialog-name]",""),n('[data-surcharge-dialog-fee-type][value="service"]',!0),n('[data-surcharge-dialog-fee-type][value="delivery"]',!1),n('[data-surcharge-dialog-fee-type][value="other"]',!1),n('[data-surcharge-dialog-kind][value="fixed"]',!0),n('[data-surcharge-dialog-kind][value="percent"]',!1),r("[data-surcharge-dialog-value]",""),r("[data-surcharge-dialog-min-guests]",""),r("[data-surcharge-dialog-min-distance]",""),r("[data-surcharge-dialog-min-amount]",""),r("[data-surcharge-dialog-description]",""),n('[data-surcharge-dialog-apply-mode][value="auto"]',!0),n('[data-surcharge-dialog-apply-mode][value="manual"]',!1),n('[data-surcharge-dialog-taxable][value="no"]',!0),n('[data-surcharge-dialog-taxable][value="yes"]',!1),n('[data-surcharge-dialog-tip][value="no"]',!0),n('[data-surcharge-dialog-tip][value="yes"]',!1),n("[data-surcharge-dialog-enabled]",!0),t.querySelectorAll("[data-surcharge-dialog-order-type]").forEach(i=>{i.checked=i.value==="dine-in"}),qi(e,"create"),Li(e),Hr(e),Ci(e),t.classList.remove("hidden"),t.classList.add("flex"),t.setAttribute("aria-hidden","false"),(s=t.querySelector("[data-surcharge-dialog-name]"))==null||s.focus()}function fs(e){const t=e.querySelector("[data-surcharge-create-dialog]");t&&(t.classList.add("hidden"),t.classList.remove("flex"),t.setAttribute("aria-hidden","true"),qi(e,"create"))}function St(e,t,r){var n;return((n=e.querySelector(`${t}:checked`))==null?void 0:n.value)??r}function qd(e){return Nd(St(e,"[data-surcharge-dialog-fee-type]","service"))}function Li(e){const r=St(e,"[data-surcharge-dialog-kind]","fixed")==="percent",n=e.querySelector("[data-surcharge-dialog-value-label]");n&&(n.textContent=r?"金额（百分比）":"金额（固定）");const s=e.querySelector("[data-surcharge-dialog-value-suffix]");s&&(s.textContent=r?"%":"元");const i=e.querySelector("[data-surcharge-dialog-value]");if(i)if(r){i.step="0.01",i.max="100",i.placeholder="在 0 到 100 之间，最多两位小数";const o=Number(i.value);Number.isFinite(o)&&o>100&&(i.value="100")}else i.step="0.001",i.max="10000",i.placeholder="在 0 到 10000 之间，最多三位小数"}function Hr(e){const t=St(e,"[data-surcharge-dialog-taxable]","no")==="yes",r=e.querySelector('[data-surcharge-dialog-tip-option="yes"]'),n=e.querySelector('[data-surcharge-dialog-tip-option="no"]'),s=e.querySelector('[data-surcharge-dialog-tip][value="no"]'),i=e.querySelector('[data-surcharge-dialog-tip][value="yes"]');s&&(t?(r&&(r.classList.add("hidden"),r.setAttribute("aria-hidden","true")),i&&(i.checked=!1,i.disabled=!0),n&&n.classList.add("opacity-100"),s.disabled=!1,s.checked=!0):r&&(r.classList.remove("hidden"),r.setAttribute("aria-hidden","false"),i&&(i.disabled=!1),s.disabled=!1))}function Ci(e){const t=qd(e);e.querySelectorAll("[data-surcharge-field-group]").forEach(r=>{const s=r.getAttribute("data-surcharge-field-group")===t;r.classList.toggle("hidden",!s),r.setAttribute("aria-hidden",s?"false":"true")})}function zv(e){const t=[];return e.querySelectorAll("[data-surcharge-dialog-order-type]:checked").forEach(r=>{r.value.trim()&&t.push(r.value.trim())}),t.length?t:["dine-in"]}function Yv(e,t){const r=Number(e.getAttribute("data-preset-seq"));if(r!==Ue)return;const n=e.querySelector("[data-surcharge-create-dialog]");if(!n)return;const s=kt(r).find(l=>l.id===t);if(!s)return;const i=Ai(s.surcharge),o=(l,u)=>{const m=n.querySelector(l);m&&(m.value=u)},a=(l,u)=>{const m=n.querySelector(l);m&&(m.checked=u)};o("[data-surcharge-dialog-name]",s.name),a('[data-surcharge-dialog-fee-type][value="service"]',i.feeType==="service"),a('[data-surcharge-dialog-fee-type][value="delivery"]',i.feeType==="delivery"),a('[data-surcharge-dialog-fee-type][value="other"]',i.feeType==="other"),a('[data-surcharge-dialog-kind][value="fixed"]',s.kind==="fixed"),a('[data-surcharge-dialog-kind][value="percent"]',s.kind==="percent"),o("[data-surcharge-dialog-value]",String(s.value)),o("[data-surcharge-dialog-min-guests]",String(i.minGuests)),o("[data-surcharge-dialog-min-distance]",String(i.minDistance)),o("[data-surcharge-dialog-min-amount]",String(i.minAmount)),o("[data-surcharge-dialog-description]",i.description),a('[data-surcharge-dialog-apply-mode][value="auto"]',i.applyMode==="auto"),a('[data-surcharge-dialog-apply-mode][value="manual"]',i.applyMode==="manual"),a('[data-surcharge-dialog-taxable][value="yes"]',i.taxable),a('[data-surcharge-dialog-taxable][value="no"]',!i.taxable),a('[data-surcharge-dialog-tip][value="yes"]',i.asTip),a('[data-surcharge-dialog-tip][value="no"]',!i.asTip),a("[data-surcharge-dialog-enabled]",i.enabled),n.querySelectorAll("[data-surcharge-dialog-order-type]").forEach(l=>{l.checked=i.orderTypes.includes(l.value)}),qi(e,"edit",t),Li(e),Hr(e),Ci(e),n.classList.remove("hidden"),n.classList.add("flex"),n.setAttribute("aria-hidden","false")}function Xv(e,t){const r=Number(e.getAttribute("data-preset-seq"));if(r!==Ue)return;const s=kt(r).map(i=>{if(i.id!==t)return i;const o=Ai(i.surcharge);return{...i,surcharge:{...o,enabled:!o.enabled}}});gr(r,s),gn(e)}function Zv(e){var D,Z,W,ce,ue,ie,b,$;const t=Number(e.getAttribute("data-preset-seq"));if(t!==Ue)return;const r=((D=e.querySelector("[data-surcharge-dialog-name]"))==null?void 0:D.value.trim())??"";if(!r){alert("请输入加收名称"),(Z=e.querySelector("[data-surcharge-dialog-name]"))==null||Z.focus();return}const s=St(e,"[data-surcharge-dialog-kind]","fixed")==="percent"?"percent":"fixed",i=Number((W=e.querySelector("[data-surcharge-dialog-value]"))==null?void 0:W.value),o=Number.isFinite(i)?i:0,a=Number((ce=e.querySelector("[data-surcharge-dialog-min-guests]"))==null?void 0:ce.value),l=Number((ue=e.querySelector("[data-surcharge-dialog-min-distance]"))==null?void 0:ue.value),u=Number((ie=e.querySelector("[data-surcharge-dialog-min-amount]"))==null?void 0:ie.value),m=qd(e),T=Pd(m),k=((b=e.querySelector("[data-surcharge-dialog-description]"))==null?void 0:b.value)??"",S=St(e,"[data-surcharge-dialog-apply-mode]","auto")==="manual"?"manual":"auto",p=St(e,"[data-surcharge-dialog-taxable]","no")==="yes",f=p?!1:St(e,"[data-surcharge-dialog-tip]","no")==="yes",E=(($=e.querySelector("[data-surcharge-dialog-enabled]"))==null?void 0:$.checked)!==!1,x=e.querySelector("[data-surcharge-create-dialog]"),P=(x==null?void 0:x.dataset.dialogMode)==="edit"?x.dataset.editPresetId??"":"",O=mn({id:P||pn(),name:r,kind:s,value:o,surcharge:{feeType:m,feeTypeLabel:T,minGuests:m==="service"&&Number.isFinite(a)?a:0,minDistance:m==="delivery"&&Number.isFinite(l)?l:0,minAmount:Number.isFinite(u)?u:0,description:k,applyMode:S,taxable:p,asTip:f,enabled:E,orderTypes:zv(e)}},t),g=kt(t),N=P?g.map(y=>y.id===P?O:y):[...g,O];gr(t,N),gn(e),fs(e)}function Jv(e,t){const r=Number(e.getAttribute("data-preset-seq"));if(!mr.has(r))return;const n=t.getAttribute("data-preset-id"),s=kt(r).filter(i=>i.id!==n);gr(r,s),gn(e)}function ey(e=document){e.querySelectorAll("[data-rate-preset-editor]").forEach(t=>{t.dataset.ratePresetEditorBound!=="1"&&(t.dataset.ratePresetEditorBound="1",t.querySelectorAll("[data-rate-preset-row]").forEach($r),t.addEventListener("click",r=>{const n=r.target;if(n.closest("[data-rate-preset-add]")){Number(t.getAttribute("data-preset-seq"))===Ue?Qv(t):Wv(t);return}if(n.closest("[data-surcharge-dialog-cancel]")||n.closest("[data-surcharge-dialog-close]")){fs(t);return}if(n.closest("[data-surcharge-dialog-save]")){Zv(t);return}const s=n.closest("[data-surcharge-row-edit]");if(s){const a=s.closest("[data-rate-preset-row]"),l=a==null?void 0:a.getAttribute("data-preset-id");l&&Yv(t,l);return}const i=n.closest("[data-surcharge-row-toggle-enabled]");if(i){const a=i.closest("[data-rate-preset-row]"),l=a==null?void 0:a.getAttribute("data-preset-id");l&&Xv(t,l);return}const o=n.closest("[data-rate-preset-remove]");if(o){const a=o.closest("[data-rate-preset-row]");a&&Jv(t,a)}}),t.addEventListener("input",r=>{const n=r.target;(n.matches("[data-rate-preset-name]")||n.matches("[data-rate-preset-value]"))&&Rn(t)}),t.addEventListener("change",r=>{const n=r.target;if(n.matches("[data-rate-preset-kind]")){const s=n.closest("[data-rate-preset-row]");s&&$r(s),Rn(t);return}if(n.matches("[data-rate-preset-name]")||n.matches("[data-rate-preset-value]")){const s=n.closest("[data-rate-preset-row]");s&&$r(s),Rn(t);return}if(n.matches("[data-surcharge-dialog-fee-type]")){Ci(t);return}if(n.matches("[data-surcharge-dialog-kind]")){Li(t);return}n.matches("[data-surcharge-dialog-taxable]")&&Hr(t)}),t.addEventListener("click",r=>{r.target.closest("[data-surcharge-dialog-taxable]")&&Hr(t)}),t.addEventListener("keydown",r=>{const n=t.querySelector("[data-surcharge-create-dialog]");!n||n.classList.contains("hidden")||r.key==="Escape"&&(r.preventDefault(),fs(t))}))})}const ty=445,ry=143,Ld="445-base-tax-rate-percent",Cd="143-tax-base-mode",ny="module-setting-radio-143-tax-base",Qo=0,Md=0,Rd=100,Od=[{value:"before-discount",label:"按折扣前金额计税"},{value:"after-discount",label:"按折扣后金额计税"}];function sy(e){return Od.some(t=>t.value===e)}function iy(){const e=F(Ld,Qo);return Number.isFinite(e)?Math.min(Rd,Math.max(Md,e)):Qo}function oy(){const e=H(Cd,"after-discount");return sy(e)?e:"after-discount"}function ay(e){return e===ty}function ly(e){return e===ry}function zo(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function dy(){const e=iy(),t=(Number.isInteger(e),String(e));return`
    <div class="flex flex-wrap items-center gap-2" data-payment-base-tax-rate>
      <input
        type="number"
        inputmode="decimal"
        class="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${zo(t)}"
        min="${Md}"
        max="${Rd}"
        step="0.001"
        data-module-setting-number="${zo(Ld)}"
        aria-label="基础税率百分比"
      />
      <span class="text-sm text-muted-foreground">%</span>
      <span class="text-xs text-muted-foreground">结账销售税主税率（组内 SSOT）</span>
    </div>`}function cy(){return tt({options:Od,fieldId:Cd,groupName:ny,currentValue:oy(),layout:"vertical",ariaLabel:"折扣与税基"})}const de=[{id:"cds",label:"客显（CDS）"},{id:"kiosk",label:"Kiosk"},{id:"paypad",label:"PayPad"}],_e=[{id:"pos",label:"POS"},{id:"cds",label:"客显（CDS）"},{id:"kiosk",label:"Kiosk"},{id:"paypad",label:"PayPad"}];function Kd(e=!1){return{cds:e,kiosk:e,paypad:e}}function Fr(e,t=!1){const r=Kd(t);for(const n of de)typeof e[n.id]=="boolean"&&(r[n.id]=e[n.id]);return r}const uy=231,py=232,Mi=237,my=244,gy=253,fy=293,by=294,Bd=295,Hd=296,hy=493,vy=[Mi,Bd,Hd],yy=[fy,by,gy,my],Fd="231-tip-collection-mode",Gd="232-tip-alert-ratio-percent",xy="493-kiosk-tip-collection-mode",bs="493-tip-collection-mode-by-line",Sy="module-setting-radio-231-tip-collection-mode",Ty=50,Ud=0,fn=100,jd=[{value:"manual",label:"仅手输小费"},{value:"presets",label:"预设选项 + 可手输"},{value:"disabled",label:"不允许选择小费"}],Vd=[{value:"fixed",label:"固定金额"},{value:"percent",label:"百分比"}],Ey=[{value:"percent",label:"百分比"},{value:"fixed",label:"固定金额"}],$y={[Mi]:{storageId:"237-tip-percent-presets",percentColumnLabel:"结账页预设比例",fixedColumnLabel:"结账页预设金额",percentAddLabel:"新增预设比例",fixedAddLabel:"新增预设金额",defaultPercentValues:[15,18,20,25],defaultFixedValues:[3,5,7,10]},[Bd]:{storageId:"295-receipt-tip-default-presets",percentColumnLabel:"收据建议比例（未付）",fixedColumnLabel:"收据建议金额（未付）",percentAddLabel:"新增预设比例",fixedAddLabel:"新增预设金额",defaultPercentValues:[15,18,20],defaultFixedValues:[3,5,7],legacyPercentFieldId:"295-receipt-tip-default-percent"},[Hd]:{storageId:"296-receipt-tip-after-paid-presets",percentColumnLabel:"收据建议比例（已付后）",fixedColumnLabel:"收据建议金额（已付后）",percentAddLabel:"新增预设比例",fixedAddLabel:"新增预设金额",defaultPercentValues:[15,18,20],defaultFixedValues:[3,5,7],legacyPercentFieldId:"296-receipt-tip-after-paid-percent"}},wy="h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function j(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Wd(){return`tip-preset-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}function bn(e){return Vd.some(t=>t.value===e)}function Qd(){return vn(Mi)}function wr(){const e=Qd();return{cds:e,kiosk:e,paypad:e}}function ky(){const e=H("493-tip-collection-mode","").trim().toLowerCase();return e==="fixed"||e==="percent"?e:e==="fixed-amount"||e==="amount"?"fixed":null}function _y(){const e=H(xy,"");if(bn(e))return{kiosk:e};const t=ky();return t?{kiosk:t}:null}function hn(){const e=A(bs,{});if(e&&typeof e=="object"&&Object.keys(e).length>0){const r=wr();for(const n of de){const s=e[n.id];bn(String(s??""))&&(r[n.id]=s)}return r}const t=_y();if(t){const r={...wr(),...t};return _(bs,r),r}return wr()}function Py(e){const t=wr();for(const r of de)t[r.id]=bn(e[r.id])?e[r.id]:Qd();_(bs,t)}function Ny(e){return jd.some(t=>t.value===e)}function zd(e){return Number.isFinite(e)?Math.min(fn,Math.max(Ud,e)):0}function Iy(e){const t=F(e,NaN);return Number.isFinite(t)?zd(t):null}function Yd(e){return`${e}-tip-preset-value-kind`}function Xd(e){return`${e}-tip-preset-default-id`}function Dy(e){return e==="percent"||e==="fixed"}function Ay(e){return e==="fixed"?"元":"%"}function qy(e,t){return t==="fixed"?e.fixedColumnLabel:e.percentColumnLabel}function Ly(e,t){return t==="fixed"?e.fixedAddLabel:e.percentAddLabel}function Cy(e){return e==="fixed"?5:20}function Ct(e,t){const r=e.value??e.percent??0;return{id:typeof e.id=="string"&&e.id?e.id:Wd(),value:My(Number(r),t)}}function My(e,t){if(!Number.isFinite(e))return 0;const r=Math.max(0,e);return t==="percent"?Math.min(fn,r):r}function Gt(e){return $y[e]}function Ry(e,t){const r=Gt(e);return r?(t==="fixed"?r.defaultFixedValues:r.defaultPercentValues).map(s=>Ct({value:s},t)):[]}function vn(e){const t=H(Yd(e),"percent");return Dy(t)?t:"percent"}function Oy(e,t){Ht(Yd(e),t)}function Ky(e){const t=H(Xd(e),"").trim();return t||null}function Zd(e,t){Ht(Xd(e),(t??"").trim())}function Jd(e,t){var n;if(t.length===0)return null;const r=Ky(e);return r&&t.some(s=>s.id===r)?r:((n=t[0])==null?void 0:n.id)??null}function By(e,t){const r=Jd(e,t);return Zd(e,r),r}function Hy(e){const t=Gt(e);if(!t)return[];const r=vn(e),n=A(t.storageId,[]);if(Array.isArray(n)&&n.length>0)return n.map(s=>Ct(s,r));if(t.legacyPercentFieldId){const s=Iy(t.legacyPercentFieldId);if(s!==null)return[Ct({value:s},r)]}return Ry(e,r)}function kr(e,t){const r=Gt(e);if(!r)return;const n=vn(e),s=t.map(i=>Ct(i,n));_(r.storageId,s),By(e,s)}function Fy(){const e=H(Fd,"presets");return Ny(e)?e:"presets"}function Gy(){return zd(F(Gd,Ty))}function Uy(e){return e===hy}function jy(e){return e===uy}function Vy(e){return vy.includes(e)}function ec(e){return e===py}function Wy(e){return yy.includes(e)}function Qy(){return`
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组为结账小费规则（含 POS 服务员录入方式、计算基数与收据建议）。
      自助端小费页<strong>收取方式</strong>（固定/百分比）见 <strong>493</strong>（CDS / Kiosk / PayPad 分产线）；页内展示细节见「结账与交互」<strong>463</strong>。
    </p>`}function zy(){return tt({options:jd,fieldId:Fd,groupName:Sy,currentValue:Fy(),layout:"vertical",ariaLabel:"小费收取模式"})}function Yy(e){const t=`tip-collection-mode-${e.lineId}`,r=Vd.map(n=>{const s=e.mode===n.value;return`
        <label class="inline-flex items-center gap-1.5 text-sm cursor-pointer text-foreground">
          <input
            type="radio"
            name="${j(t)}"
            value="${j(n.value)}"
            class="${q}"
            ${s?"checked":""}
            data-tip-collection-mode-line="${j(e.lineId)}"
            aria-label="${j(e.lineLabel)} ${j(n.label)}"
          />
          <span>${j(n.label)}</span>
        </label>`}).join("");return`
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-3" role="radiogroup" aria-label="${j(e.lineLabel)} 小费收取方式">${r}</div>`}function Xy(){const e=hn();return`
    <div data-tip-collection-mode-by-line-editor class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">小费收取方式</th>
            </tr>
          </thead>
          <tbody>${de.map(r=>`
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm text-foreground">${j(r.label)}</td>
      <td class="px-3 py-2.5">
        ${Yy({lineId:r.id,lineLabel:r.label,mode:e[r.id]})}
      </td>
    </tr>`).join("")}</tbody>
        </table>
      </div>
    </div>`}function Zy(){return`
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      <strong>CDS、Kiosk、PayPad</strong> 各产线小费页按<strong>固定金额</strong>或<strong>百分比</strong>展示（须先在「展示小费页 463」开启对应产线）。
      预设按钮内容仍维护于「结账页预设小费 <strong>237</strong>」中<strong>对应类型</strong>的列。
    </p>
    <div class="mt-3 max-w-2xl">
      ${Xy()}
    </div>`}function Jy(e){const t=hn();return e.querySelectorAll("[data-tip-collection-mode-line]").forEach(r=>{if(!r.checked)return;const n=r.getAttribute("data-tip-collection-mode-line"),s=r.value;!n||!bn(s)||(t[n]=s)}),t}function ex(e=document){e.querySelectorAll("[data-tip-collection-mode-by-line-editor]").forEach(t=>{t.dataset.tipCollectionModeByLineBound!=="1"&&(t.dataset.tipCollectionModeByLineBound="1",t.addEventListener("change",r=>{r.target.matches("[data-tip-collection-mode-line]")&&Py(Jy(t))}))})}function tx(e,t,r){const n=(Number.isInteger(t),String(t));return`
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputmode="decimal"
        class="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${j(n)}"
        min="${Ud}"
        max="${fn}"
        step="0.1"
        data-module-setting-number="${j(e)}"
        aria-label="${j(r)}"
      />
      <span class="text-sm text-muted-foreground">%</span>
    </div>`}function rx(){return tx(Gd,Gy(),"小费异常提醒比例")}function nx(e,t){return`
    <div
      class="mt-3 rounded-lg bg-muted/50 p-3 ${t?"":"hidden"}"
      data-tip-alert-ratio-panel="${e}"
      ${t?"":'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs text-muted-foreground">小费金额超过订单金额的以下比例时，向操作员提示。</p>
      ${rx()}
    </div>`}function sx(e,t){document.querySelectorAll(`[data-tip-alert-ratio-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true")})}function ix(e,t){const r=`tip-preset-value-kind-${e}`;return`
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2" role="radiogroup" aria-label="预设小费类型">
      <span class="text-xs font-medium text-muted-foreground">预设类型</span>
      ${Ey.map(s=>{const i=t===s.value;return`
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="radio"
          name="${j(r)}"
          value="${j(s.value)}"
          class="${q}"
          ${i?"checked":""}
          data-tip-preset-value-kind
          aria-label="${j(s.label)}"
        />
        <span>${j(s.label)}</span>
      </label>`}).join("")}
    </div>`}function ox(e,t,r,n){const s=Jd(e,n),i=qy(t,r),o=Ay(r),a=r==="percent"?` max="${fn}"`:"",l=r==="fixed"?"预设小费金额":"预设小费百分比",u=`tip-preset-default-${e}`,m=n.map(T=>`
    <tr class="border-t border-border" data-tip-preset-row data-preset-id="${j(T.id)}">
      <td class="px-3 py-2.5">
        <div class="flex items-center gap-1.5">
          <input
            type="number"
            inputmode="decimal"
            class="${wy} max-w-[8rem] tabular-nums"
            value="${j(String(T.value))}"
            min="0"
            step="${r==="fixed"?"0.01":"0.1"}"${a}
            data-tip-preset-value
            aria-label="${j(l)}"
          />
          <span class="shrink-0 text-sm text-muted-foreground">${j(o)}</span>
        </div>
      </td>
      <td class="px-3 py-2.5 text-center">
        <label class="inline-flex cursor-pointer items-center justify-center">
          <input
            type="radio"
            name="${j(u)}"
            class="${q}"
            data-tip-preset-default
            ${T.id===s?"checked":""}
            aria-label="设为默认预设"
          />
        </label>
      </td>
      <td class="px-3 py-2.5 text-right whitespace-nowrap">
        <button type="button" class="text-sm font-medium text-destructive hover:underline" data-tip-preset-remove>删除</button>
      </td>
    </tr>`).join("");return`
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[12rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">${j(i)}</th>
            <th class="px-3 py-2 text-center font-medium w-[5rem]">默认</th>
            <th class="px-3 py-2 text-right font-medium w-[4.5rem]">操作</th>
          </tr>
        </thead>
        <tbody data-tip-preset-list>${m}</tbody>
      </table>
    </div>`}function tc(e){const t=Gt(e);if(!t)return"";const r=vn(e),n=Hy(e);return`
    <div
      class="space-y-3"
      data-tip-preset-editor
      data-preset-seq="${e}"
      data-storage-id="${j(t.storageId)}"
      data-preset-value-kind="${r}"
    >
      ${ix(e,r)}
      ${ox(e,t,r,n)}
      <button
        type="button"
        class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
        data-tip-preset-add
      >${j(Ly(t,r))}</button>
    </div>`}function rc(e){const t=e.querySelector("[data-tip-preset-value-kind]:checked");return(t==null?void 0:t.value)==="fixed"?"fixed":"percent"}function _r(e){const t=rc(e),r=[];return e.querySelectorAll("[data-tip-preset-row]").forEach(n=>{var o;const s=n.getAttribute("data-preset-id")??Wd(),i=Number((o=n.querySelector("[data-tip-preset-value]"))==null?void 0:o.value);r.push(Ct({id:s,value:i},t))}),r}function Yo(e){const t=Number(e.getAttribute("data-preset-seq"));Gt(t)&&kr(t,_r(e))}function On(e){const t=Number(e.getAttribute("data-preset-seq")),r=e.parentElement;!r||!Gt(t)||(e.outerHTML=tc(t),nc(r))}function nc(e=document){e.querySelectorAll("[data-tip-preset-editor]").forEach(t=>{t.dataset.tipPresetEditorBound!=="1"&&(t.dataset.tipPresetEditorBound="1",t.addEventListener("click",r=>{const n=r.target;if(n.closest("[data-tip-preset-add]")){const i=Number(t.getAttribute("data-preset-seq")),o=rc(t),a=_r(t);a.push(Ct({value:Cy(o)},o)),kr(i,a),On(t);return}const s=n.closest("[data-tip-preset-remove]");if(s){const i=s.closest("[data-tip-preset-row]"),o=i==null?void 0:i.getAttribute("data-preset-id");if(!o)return;const a=Number(t.getAttribute("data-preset-seq"));kr(a,_r(t).filter(l=>l.id!==o)),On(t)}}),t.addEventListener("change",r=>{const n=r.target;if(n.matches("[data-tip-preset-value-kind]")){const s=n;if(!s.checked)return;const i=Number(t.getAttribute("data-preset-seq")),o=s.value==="fixed"?"fixed":"percent";Oy(i,o),kr(i,_r(t)),On(t);return}if(n.matches("[data-tip-preset-default]")){const s=n;if(!s.checked)return;const i=Number(t.getAttribute("data-preset-seq")),o=s.closest("[data-tip-preset-row]"),a=(o==null?void 0:o.getAttribute("data-preset-id"))??null;Zd(i,a);return}n.matches("[data-tip-preset-value]")&&Yo(t)}),t.addEventListener("input",r=>{r.target.matches("[data-tip-preset-value]")&&Yo(t)}))})}const ax=672,sc="672-lottery-custom-anim-config",lx=5*1024*1024,dx=new Set(["video/mp4","video/quicktime","video/x-msvideo","video/x-matroska","video/x-ms-wmv","image/gif"]),ic=/\.(mp4|mov|avi|mkv|wmv|gif)$/i,cx={fullscreen:!1,win:null,lose:null};function pt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function oc(e){return e===ax}function lr(){const e=A(sc,cx);return{fullscreen:!!e.fullscreen,win:Xo(e.win),lose:Xo(e.lose)}}function hs(e){_(sc,e)}function Xo(e){if(!e||typeof e!="object")return null;const t=e;return typeof t.dataUrl!="string"||!t.dataUrl?null:{dataUrl:t.dataUrl,fileName:typeof t.fileName=="string"?t.fileName:"",kind:t.kind==="gif"?"gif":"video",mimeType:typeof t.mimeType=="string"?t.mimeType:""}}function ux(e){return e.type==="image/gif"||/\.gif$/i.test(e.name)?"gif":e.type.startsWith("video/")||ic.test(e.name)?"video":null}function px(e){return dx.has(e.type)?!0:ic.test(e.name)}function mx(e){return new Promise((t,r)=>{const n=new FileReader;n.onload=()=>t(String(n.result??"")),n.onerror=()=>r(new Error("读取文件失败")),n.readAsDataURL(e)})}function gx(e){return e?e.kind==="gif"?`<img src="${pt(e.dataUrl)}" alt="" class="h-full w-full object-cover" />`:`<video src="${pt(e.dataUrl)}" class="h-full w-full object-cover" muted playsinline></video>`:'<span class="text-2xl font-light leading-none text-muted-foreground">+</span>'}function Zo(e,t,r,n){const s=n?"":" pointer-events-none opacity-50",i=gx(r),o=r!=null&&r.fileName?`<p class="mt-1 max-w-[8rem] truncate text-[10px] text-muted-foreground">${pt(r.fileName)}</p>`:"";return`
    <div class="space-y-1.5">
      <p class="m-0 text-sm text-foreground">${pt(t)}</p>
      <div class="relative inline-block">
        <button
          type="button"
          class="lottery-anim-upload-slot flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/[0.04]${s}"
          data-lottery-anim-upload="${e}"
          aria-label="上传${pt(t)}"
          ${n?"":"disabled"}
        >
          ${i}
        </button>
        ${r?`<button
          type="button"
          class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-xs text-muted-foreground shadow hover:bg-destructive/10 hover:text-destructive"
          data-lottery-anim-remove="${e}"
          aria-label="删除${pt(t)}"
        >×</button>`:""}
      </div>
      ${o}
      <input
        type="file"
        class="hidden"
        accept=".mp4,.mov,.avi,.mkv,.wmv,.gif,video/*,image/gif"
        data-lottery-anim-file="${e}"
        ${n?"":"disabled"}
      />
    </div>`}function fx(e,t,r=t){const n=lr();return`
    <div
      class="mt-3 space-y-4 rounded-lg bg-muted/50 p-3 ${t?"":"hidden"}"
      data-lottery-custom-anim-panel="${e}"
      ${t?"":'aria-hidden="true"'}
    >
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-lottery-anim-fullscreen
          ${n.fullscreen?"checked":""}
          ${r?"":"disabled"}
        />
        <span>动画全屏展示</span>
      </label>
      <div class="flex flex-wrap gap-6" data-lottery-custom-anim-editor>
        ${ac(r)}
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        动画大小：5M 内；动画格式：MP4、MOV、AVI、MKV、WMV、GIF
      </p>
    </div>`}function bx(e,t){document.querySelectorAll(`[data-lottery-custom-anim-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true")}),document.querySelectorAll("[data-lottery-custom-anim-editor]").forEach(r=>{r.querySelectorAll("[data-lottery-anim-fullscreen]").forEach(n=>{n.disabled=!t}),r.querySelectorAll("[data-lottery-anim-upload]").forEach(n=>{n.disabled=!t,n.classList.toggle("pointer-events-none",!t),n.classList.toggle("opacity-50",!t)}),r.querySelectorAll("[data-lottery-anim-file]").forEach(n=>{n.disabled=!t})})}function ac(e){const t=lr();return`
        ${Zo("win","中奖动画",t.win,e)}
        ${Zo("lose","未中奖动画",t.lose,e)}`}function Jo(e){const t=!e.classList.contains("hidden"),r=e.querySelector("[data-lottery-custom-anim-editor]");r&&(r.innerHTML=ac(t))}async function hx(e,t){if(!px(t)){window.alert("仅支持 MP4、MOV、AVI、MKV、WMV、GIF 格式");return}if(t.size>lx){window.alert("动画大小不能超过 5M");return}const r=ux(t);if(!r){window.alert("无法识别文件格式");return}const n=await mx(t),s=lr(),i={dataUrl:n,fileName:t.name,kind:r,mimeType:t.type};e==="win"?s.win=i:s.lose=i,hs(s)}function vx(e=document){e.querySelectorAll("[data-lottery-custom-anim-panel]").forEach(t=>{t.dataset.lotteryAnimBound!=="1"&&(t.dataset.lotteryAnimBound="1",t.addEventListener("change",r=>{var a;const n=r.target.closest("[data-lottery-anim-fullscreen]");if(n){const l=lr();l.fullscreen=n.checked,hs(l);return}const s=r.target.closest("[data-lottery-anim-file]");if(!s)return;const i=s.getAttribute("data-lottery-anim-file"),o=(a=s.files)==null?void 0:a[0];s.value="",!(!i||!o)&&hx(i,o).then(()=>{Jo(t)}).catch(l=>{window.alert(l instanceof Error?l.message:"上传失败")})}),t.addEventListener("click",r=>{const n=r.target.closest("[data-lottery-anim-upload]");if(n){const a=n.getAttribute("data-lottery-anim-upload"),l=t.querySelector(`[data-lottery-anim-file="${a}"]`);l==null||l.click();return}const s=r.target.closest("[data-lottery-anim-remove]");if(!s)return;const i=s.getAttribute("data-lottery-anim-remove");if(!i)return;const o=lr();i==="win"?o.win=null:o.lose=null,hs(o),Jo(t)}))})}function yx(e,t,r){const n=r(e.seq);return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex flex-col gap-1">
                <span class="text-sm font-medium text-card-foreground">${pt(e.title)}</span>
                ${e.sceneDesc.trim()?`<p class="m-0 text-xs leading-relaxed text-muted-foreground">${pt(e.sceneDesc.trim())}</p>`:""}
              </div>
              <div class="shrink-0 pt-0.5">${t(e)}</div>
            </div>
            ${fx(e.seq,n)}
          </div>
        </li>`}const xx=238,Sx=230,Tx=236,Ex=235,$x=239,wx=240,kx=[$x,wx],lc="238-auto-close-hhmm",dc="230-settlement-days",cc="236-unbatched-order-limit",uc="235-batch-post-print-report",Kn=["settlement-report"],pc=[{value:"credit-card-report",label:"信用卡报告单"},{value:"settlement-report",label:"结算单"}];function Mt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function _x(e,t){return/^\d{1,2}:\d{2}$/.test(e)?e:t}function Px(){const e=Ge(lc,"23:00");return _x(e,"23:00")}function Nx(){const e=F(dc,1);return Number.isFinite(e)?Math.min(30,Math.max(0,Math.round(e))):1}function Ix(){const e=F(cc,500);return Number.isFinite(e)?Math.min(1e5,Math.max(1,Math.round(e))):500}function Ri(e){return pc.some(t=>t.value===e)}function mc(e){const t=new Set,r=[];for(const n of e)!Ri(n)||t.has(n)||(t.add(n),r.push(n));return r}function Dx(){try{const e=localStorage.getItem(ke(uc));if(e===null||e==="")return[...Kn];try{const t=JSON.parse(e);if(Array.isArray(t)){const r=mc(t.filter(n=>typeof n=="string"));return r.length>0?r:[...Kn]}}catch{}if(Ri(e))return[e]}catch{}return[...Kn]}function Ax(e){_(uc,mc(e))}function qx(e){return e===xx}function Lx(e){return e===Sx}function Cx(e){return e===Tx}function Mx(e){return e===Ex}function Rx(e){return kx.includes(e)}function Ox(){return`
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组为 Batch 收单与日切关账调度（238 每日关账时刻、230 向收单行结算周期等）。
      门店<strong>现金日结/班结</strong>（是否启用、班结展示、现金报表打印）见财务中心「日结与结算」（171、65、330）；员工下班卡 Batch 门禁见团队管理「考勤与工时」（241）。
    </p>`}function Kx(){const e=Px();return`
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="time"
        class="h-9 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${Mt(e)}"
        data-module-setting-text="${Mt(lc)}"
        aria-label="自动关账时间"
      />
      <span class="text-xs text-muted-foreground">每日营业日结束自动关账/Batch 触发时刻（非收单结算天数）</span>
    </div>`}function Bx(){const e=Nx();return`
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${Mt(String(e))}"
        min="0"
        max="30"
        data-module-setting-number="${Mt(dc)}"
        aria-label="收单结算周期天数"
      />
      <span class="text-sm text-muted-foreground">天</span>
      <span class="text-xs text-muted-foreground">交易 Batch 后多少天向收单方自动结算（与 238 关账时刻不同）</span>
    </div>`}function Hx(){const e=Ix();return`
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${Mt(String(e))}"
        min="1"
        max="100000"
        data-module-setting-number="${Mt(cc)}"
        aria-label="未 Batch 订单数量上限"
      />
      <span class="text-xs text-muted-foreground">单</span>
    </div>`}function Fx(){const e=new Set(Dx());return`
    <div data-batch-post-print-picker aria-label="Batch 后打印报告类型">
      <p class="mb-2 text-xs text-muted-foreground">可多选；Batch 完成后将按勾选类型分别打印。</p>
      ${pi({options:pc,selectedValues:e,checkboxDataAttr:"data-batch-post-print-choice",layout:"wrap"})}
    </div>`}function Gx(){document.querySelectorAll("[data-batch-post-print-picker]").forEach(e=>{e.dataset.batchPostPrintBound!=="1"&&(e.dataset.batchPostPrintBound="1",e.addEventListener("change",t=>{if(!t.target.closest("[data-batch-post-print-choice]"))return;const n=[...e.querySelectorAll("[data-batch-post-print-choice]:checked")].map(s=>s.value).filter(Ri);Ax(n)}))})}const Ux=429,gc="429-delivery-regions",Bn="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function vr(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Oi(){return`dr-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}function fr(e){return{id:e.id??Oi(),city:(e.city??"").trim(),stateOrProvince:(e.stateOrProvince??"").trim(),postalCode:(e.postalCode??"").trim()}}function jx(){return[fr({city:"San Jose",stateOrProvince:"CA",postalCode:"95112"})]}function Vx(e){return e===Ux}function Wx(){const e=A(gc,[]);return!Array.isArray(e)||e.length===0?jx():e.map(t=>fr(t)).filter(t=>t.id)}function Hn(e){_(gc,e.map(t=>fr(t)))}function fc(e){return`
    <div
      class="grid grid-cols-1 gap-2 rounded-md border border-border bg-muted/20 p-2 sm:grid-cols-[1fr_1fr_140px_auto]"
      data-delivery-region-row
      data-region-id="${vr(e.id)}"
    >
      <label class="space-y-1">
        <span class="block text-xs text-muted-foreground">城市</span>
        <input
          type="text"
          class="${Bn}"
          value="${vr(e.city)}"
          placeholder="请输入城市"
          data-delivery-region-city
        />
      </label>
      <label class="space-y-1">
        <span class="block text-xs text-muted-foreground">州/省</span>
        <input
          type="text"
          class="${Bn}"
          value="${vr(e.stateOrProvince)}"
          placeholder="请输入州/省"
          data-delivery-region-state
        />
      </label>
      <label class="space-y-1">
        <span class="block text-xs text-muted-foreground">邮编</span>
        <input
          type="text"
          class="${Bn}"
          value="${vr(e.postalCode)}"
          placeholder="请输入邮编"
          data-delivery-region-zip
        />
      </label>
      <button
        type="button"
        class="inline-flex h-9 items-center justify-center self-end rounded-md border border-border px-3 text-sm text-destructive hover:bg-destructive/10"
        data-delivery-region-remove
      >删除</button>
    </div>`}function Fn(e){return[...e.querySelectorAll("[data-delivery-region-row]")].map(t=>{var o,a,l;const r=t.getAttribute("data-region-id")??Oi(),n=((o=t.querySelector("[data-delivery-region-city]"))==null?void 0:o.value.trim())??"",s=((a=t.querySelector("[data-delivery-region-state]"))==null?void 0:a.value.trim())??"",i=((l=t.querySelector("[data-delivery-region-zip]"))==null?void 0:l.value.trim())??"";return fr({id:r,city:n,stateOrProvince:s,postalCode:i})}).filter(t=>t.city||t.stateOrProvince||t.postalCode)}function ea(e,t){const r=e.querySelector("[data-delivery-region-rows]");r&&(r.innerHTML=t.map(fc).join(""))}function Qx(){return`
    <div
      class="mt-3 space-y-2 rounded-md border border-input bg-background p-3"
      data-delivery-region-editor
    >
      <div class="space-y-2" data-delivery-region-rows>
        ${Wx().map(fc).join("")}
      </div>
      <button
        type="button"
        class="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-primary hover:bg-primary/10"
        data-delivery-region-add
      >新增区域</button>
    </div>`}function zx(){document.querySelectorAll("[data-delivery-region-editor]").forEach(e=>{if(e.dataset.deliveryRegionBound==="1")return;e.dataset.deliveryRegionBound="1",e.addEventListener("click",r=>{const n=r.target;if(n.closest("[data-delivery-region-add]")){const a=Fn(e);a.push(fr({id:Oi()})),Hn(a),ea(e,a);return}const s=n.closest("[data-delivery-region-remove]");if(!s)return;const i=s.closest("[data-delivery-region-row]");if(!i)return;i.remove();const o=Fn(e);Hn(o),ea(e,o.length>0?o:[])});const t=()=>Hn(Fn(e));e.addEventListener("input",t),e.addEventListener("change",t)})}const Yx=242,Xx=243,Zx=454,bc="242-card-min-spend-by-line",hc="243-card-signature-min-by-line",vc="454-card-pricing-strategy",Jx=["242-card-min-payment","512-card-min-spend"],e0=["243-card-signature-min-amount"],t0="h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",r0=[{value:"none",label:"不加价（现金与卡付同价）"},{value:"dual-pricing",label:"双重定价"},{value:"surcharge",label:"整单加收"}],yc=4;function Ne(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function vs(){return{pos:0,kiosk:0,emenu:0,paypad:0}}function xc(e){const t=vs();for(const r of wt){const n=Number(e[r.id]);t[r.id]=yn(n)}return t}function n0(e){for(const t of e){const r=F(t,NaN);if(Number.isFinite(r)&&r>0)return yn(r)}return null}function Sc(e,t){const r=A(e,{});if(r&&typeof r=="object"&&Object.keys(r).length>0)return xc(r);const n=n0(t);if(n!==null){const s=vs();for(const i of wt)s[i.id]=n;return s}return vs()}function Tc(e,t){_(e,xc(t))}function Ec(){return Sc(bc,Jx)}function s0(e){Tc(bc,e)}function $c(){return Sc(hc,e0)}function i0(e){Tc(hc,e)}function yn(e){return Number.isFinite(e)?Math.max(0,Math.round(e*100)/100):0}function Gr(e){return Number.isFinite(e)?Math.min(yc,Math.max(0,Math.round(e*100)/100)):0}function wc(e){return e==="none"||e==="dual-pricing"||e==="surcharge"}function o0(){return F("543-card-surcharge-enabled",0)>0}function kc(e){return{mode:wc(String(e.mode??""))?e.mode:"none",percent:Gr(Number(e.percent))}}function a0(){const e=A(vc,{});if(e&&typeof e=="object"&&e.mode)return kc(e);const t=F("454-dual-pricing-percent",NaN);if(Number.isFinite(t)&&t>0)return{mode:"dual-pricing",percent:Gr(t)};const r=F("543-surcharge-percent",NaN);return o0()||Number.isFinite(r)&&r>0?{mode:"surcharge",percent:Gr(Number.isFinite(r)?r:3)}:{mode:"none",percent:0}}function l0(e){_(vc,kc(e))}function _c(e){const t=wt.map(r=>`
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm text-foreground">${Ne(r.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex items-center gap-1.5">
          <input
            type="number"
            inputmode="decimal"
            class="${t0} max-w-[8rem]"
            value="${Ne(String(e.values[r.id]))}"
            min="0"
            step="0.01"
            ${e.lineDataAttr}="${Ne(r.id)}"
            aria-label="${Ne(r.label)} ${Ne(e.valueAriaSuffix)}"
          />
          <span class="shrink-0 text-sm text-muted-foreground">元</span>
        </div>
      </td>
    </tr>`).join("");return`
    <div ${e.editorAttr} class="space-y-2">
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[16rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">产线</th>
            <th class="px-3 py-2 font-medium">${Ne(e.valueHeader)}</th>
          </tr>
        </thead>
        <tbody>${t}</tbody>
      </table>
    </div>
    <p class="mt-2 text-xs text-muted-foreground">${Ne(e.hint)}</p>
    </div>`}function d0(e){return e===Yx}function c0(e){return e===Zx}function u0(e){return e===Xx}function p0(){return`
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组配置<strong>能否刷卡</strong>（242 产线最低消费）、<strong>签名金额门槛</strong>（243）与<strong>刷卡是否对顾客加价</strong>（454）。
      各终端小费页 / 签名页开关见「结账与交互」463/464；收单通道成本见财务中心。
    </p>`}function m0(){return _c({editorAttr:"data-card-min-spend-editor",lineDataAttr:"data-card-min-spend-line",values:Ec(),valueHeader:"信用卡最低消费",valueAriaSuffix:"最低消费",hint:"订单金额低于该值时，对应产线不可选择信用卡支付。0 表示不限制。"})}function g0(e){const t=e.mode==="none";return`
    <div class="flex flex-wrap items-center gap-2 ${t?"opacity-50":""}">
      <input
        type="number"
        inputmode="decimal"
        class="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
        value="${Ne(String(e.percent))}"
        min="0"
        max="${yc}"
        step="0.01"
        data-card-pricing-percent
        ${t?"disabled":""}
        aria-label="卡付加价比例"
      />
      <span class="text-sm text-muted-foreground">%</span>
    </div>`}function f0(){const e=a0(),t="card-pricing-strategy-mode",r=r0.map(s=>{const i=e.mode===s.value;return`
      <label class="flex cursor-pointer items-start gap-2 text-sm text-foreground">
        <input
          type="radio"
          name="${t}"
          value="${Ne(s.value)}"
          class="${q} mt-0.5"
          ${i?"checked":""}
          data-card-pricing-mode
          aria-label="${Ne(s.label)}"
        />
        <span>${Ne(s.label)}</span>
      </label>`}).join(""),n=e.mode==="dual-pricing"?"卡付价 = 现金价 × (1 + 比例)；菜单/小票需合规披露现金价与卡价。":e.mode==="surcharge"?"仅在选择信用卡支付时，在订单总额上加收该比例；与订单中心「加收」预设（447）不同。":"现金与信用卡支付使用同一应付金额。";return`
    <div class="space-y-3" data-card-pricing-editor>
      <div class="flex flex-col gap-2" role="radiogroup" aria-label="卡付加价策略">${r}</div>
      ${g0(e)}
      <p class="text-xs text-muted-foreground" data-card-pricing-hint>${Ne(n)}</p>
    </div>`}function b0(){return _c({editorAttr:"data-card-signature-min-editor",lineDataAttr:"data-card-signature-min-line",values:$c(),valueHeader:"信用卡签名最低金额",valueAriaSuffix:"签名最低金额",hint:"卡交易金额达到该值时要求电子签名；低于该值且终端已开启签名页时可跳过。0 表示任意金额均需签名（若终端开启）。"})}function h0(e){const t=Ec();return e.querySelectorAll("[data-card-min-spend-line]").forEach(r=>{const n=r.getAttribute("data-card-min-spend-line");n&&(t[n]=yn(Number(r.value)))}),t}function v0(e){const t=$c();return e.querySelectorAll("[data-card-signature-min-line]").forEach(r=>{const n=r.getAttribute("data-card-signature-min-line");n&&(t[n]=yn(Number(r.value)))}),t}function Pc(e){const t=e.querySelector("[data-card-pricing-mode]:checked"),r=(t==null?void 0:t.value)??"";return wc(r)?r:"none"}function ta(e){var s;const t=Pc(e),r=e.querySelector("[data-card-pricing-percent]"),n=e.querySelector("[data-card-pricing-hint]");if(r){const i=t==="none";r.disabled=i,(s=r.closest("div"))==null||s.classList.toggle("opacity-50",i)}n&&(n.textContent=t==="dual-pricing"?"卡付价 = 现金价 × (1 + 比例)；菜单/小票需合规披露现金价与卡价。":t==="surcharge"?"仅在选择信用卡支付时，在订单总额上加收该比例；与订单中心「加收」预设（447）不同。":"现金与信用卡支付使用同一应付金额。")}function Gn(e){var n;const t=Pc(e),r=Number((n=e.querySelector("[data-card-pricing-percent]"))==null?void 0:n.value);l0({mode:t,percent:t==="none"?0:Gr(r)})}function y0(e=document){e.querySelectorAll("[data-card-min-spend-editor]").forEach(t=>{if(t.dataset.cardMinSpendEditorBound==="1")return;t.dataset.cardMinSpendEditorBound="1";const r=()=>s0(h0(t));t.addEventListener("input",n=>{n.target.matches("[data-card-min-spend-line]")&&r()}),t.addEventListener("change",n=>{n.target.matches("[data-card-min-spend-line]")&&r()})})}function x0(e=document){e.querySelectorAll("[data-card-pricing-editor]").forEach(t=>{t.dataset.cardPricingEditorBound!=="1"&&(t.dataset.cardPricingEditorBound="1",ta(t),t.addEventListener("change",r=>{const n=r.target;if(n.matches("[data-card-pricing-mode]")){ta(t),Gn(t);return}n.matches("[data-card-pricing-percent]")&&Gn(t)}),t.addEventListener("input",r=>{r.target.matches("[data-card-pricing-percent]")&&Gn(t)}))})}function S0(e=document){e.querySelectorAll("[data-card-signature-min-editor]").forEach(t=>{if(t.dataset.cardSignatureMinEditorBound==="1")return;t.dataset.cardSignatureMinEditorBound="1";const r=()=>i0(v0(t));t.addEventListener("input",n=>{n.target.matches("[data-card-signature-min-line]")&&r()}),t.addEventListener("change",n=>{n.target.matches("[data-card-signature-min-line]")&&r()})})}function T0(e=document){y0(e),x0(e),S0(e)}const E0=463,$0=464,w0=465,k0=669,Nc="463-tip-page-by-line",ys="463-tip-page-detail-by-line",_0="463-kiosk-tip-page-detail",Ic="464-signature-page-by-line",Jt="465-receipt-by-line",Pr="669-card-slip-by-line",P0="465-receipt-print-by-line",N0=669,I0=670,D0=260,A0=245,Dc=249,q0=["249-receipt-slip-print-mode","249-receipt-slip-print-option",`${Dc}-receipt-copy-mode`],xn=["paper","electronicSms","electronicEmail"],ra=[{key:"paper",label:"纸质小票"},{key:"electronicSms",label:"电子小票（短信）"},{key:"electronicEmail",label:"电子小票（邮箱）"}],X="none",Ac=[{value:"manual",label:"手动打印"},{value:"auto",label:"自动打印"},{value:"none",label:"不打印"}],L0=[{value:"manual",label:"手动发送"},{value:"auto",label:"自动发送"},{value:"none",label:"不发送"}],na=[{key:"merchantCopy",label:"Merchant Copy（商户联）"},{key:"customerCopy",label:"Customer Copy（客户联）"}],C0=Ac,sa={cds:465,kiosk:501,paypad:665},M0={cds:"465-receipt-print-mode",kiosk:"501-sms-receipt-mode",paypad:"665-email-receipt-mode"},R0={cds:463,kiosk:492,paypad:662},O0={cds:464,kiosk:497,paypad:664},K0=8,B0=494,H0=496,Sn="bg-primary border-primary shadow-sm",Tn="bg-neutral-300 border-neutral-400/80 shadow-inner dark:bg-neutral-600 dark:border-neutral-500",qc="bg-white shadow-md ring-1 ring-black/10 dark:bg-neutral-100 dark:ring-white/15";function L(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function De(e){try{const t=localStorage.getItem(ee(e));return t===null?null:t==="1"}catch{return null}}function Be(e){return e==="manual"||e==="auto"||e==="none"}function F0(e){const t=e.trim().toLowerCase();return Be(t)?t:t==="manual-send"||t==="manual-print"||t==="1"?"manual":t==="auto-send"||t==="auto-print"||t==="automatic"?"auto":t==="off"||t==="no"||t==="0"||t==="dont-send"?"none":null}function G0(){return{paper:X,electronicSms:X,electronicEmail:X}}function En(){const e={};for(const t of _e)e[t.id]=G0();return e}function U0(e,t){if(!e||typeof e!="object")return null;const r=e,n=Be(String(r.paper??""))?r.paper:X;if(Be(String(r.electronicSms??""))&&Be(String(r.electronicEmail??"")))return{paper:n,electronicSms:r.electronicSms,electronicEmail:r.electronicEmail};if(Be(String(r.electronic??""))){const s=r.electronic;return{paper:n,electronicSms:t==="paypad"?X:s,electronicEmail:t==="paypad"?s:X}}return{paper:n,electronicSms:X,electronicEmail:X}}function Ki(e,t){const r={...e};if(r[t]!=="auto")return r;for(const n of xn)n!==t&&r[n]==="auto"&&(r[n]="manual");return r}function Nr(e){const t=En();for(const r of _e){const n=e[r.id],s=U0(n,r.id);s?t[r.id]=Ki(s,"paper"):typeof n=="string"&&Be(n)&&(t[r.id]={paper:n,electronicSms:X,electronicEmail:X})}return t}function j0(){const e={},t=De(sa.cds);t!==null&&(e.cds={paper:t?"manual":"none",electronicSms:X,electronicEmail:X});for(const r of["kiosk","paypad"]){const n=M0[r],s=F0(H(n,"")),i=De(sa[r]),o=s??(i===null?null:i?"manual":"none");o!==null&&(e[r]={paper:X,electronicSms:r==="kiosk"?o:X,electronicEmail:r==="paypad"?o:X})}return e}function V0(){const e=A(P0,{});if(!e||typeof e!="object"||Object.keys(e).length===0)return null;const t={};for(const r of _e){const n=e[r.id];typeof n=="string"&&Be(n)&&(t[r.id]={paper:n,electronicSms:X,electronicEmail:X})}return Object.keys(t).length>0?t:null}function W0(){const e=De(D0);if(e===null)return null;const t=En();for(const r of _e)t[r.id]=Ki({...t[r.id],paper:e?"auto":t[r.id].paper},"paper");return t}function Bi(){const e=A(Jt,{});if(e&&typeof e=="object"&&Object.keys(e).length>0)return Nr(e);const t=V0();if(t){const s=Nr(t);return _(Jt,s),s}const r=j0();if(Object.keys(r).length>0){const s=Nr(r);return _(Jt,s),s}const n=W0();return n?(_(Jt,n),n):En()}function Q0(e){_(Jt,Nr(e))}function z0(){return{merchantCopy:X,customerCopy:X}}function $n(){const e={};for(const t of _e)e[t.id]=z0();return e}function Y0(e){if(!e||typeof e!="object")return null;const t=e;return Be(String(t.merchantCopy??""))&&Be(String(t.customerCopy??""))?{merchantCopy:t.merchantCopy,customerCopy:t.customerCopy}:null}function X0(){for(const t of q0){const r=H(t,"").trim().toLowerCase();if(r){if(r.includes("both")||r.includes("双")||r==="2")return{merchantCopy:"auto",customerCopy:"auto"};if(r.includes("none")||r.includes("不")||r==="0")return{merchantCopy:"none",customerCopy:"none"};if(r.includes("merchant")||r.includes("商户"))return{merchantCopy:"auto",customerCopy:"none"};if(r.includes("customer")||r.includes("食客")||r.includes("客户"))return{merchantCopy:"none",customerCopy:"auto"}}}const e=De(Dc);return e===null?null:e?{merchantCopy:"auto",customerCopy:"auto"}:{merchantCopy:"none",customerCopy:"none"}}function Z0(){const e=X0(),t=De(A0);if(e===null&&t===null)return null;const r=e??(t?{merchantCopy:"auto",customerCopy:"auto"}:{merchantCopy:"none",customerCopy:"none"}),n=$n();for(const s of _e)n[s.id]={...r};return n}function xs(e){const t=$n();for(const r of _e){const n=Y0(e[r.id]);n&&(t[r.id]=n)}return t}function J0(){const e=De(I0),t=De(N0);if(e===null&&t===null)return{};const r=n=>n===null?X:n?"manual":"none";return{paypad:{merchantCopy:r(e),customerCopy:r(t)}}}function Lc(){const e=A(Pr,{});if(e&&typeof e=="object"&&Object.keys(e).length>0)return xs(e);const t=J0();if(Object.keys(t).length>0){const n=xs(t);return _(Pr,n),n}const r=Z0();return r?(_(Pr,r),r):$n()}function eS(e){_(Pr,xs(e))}function tS(){const e={};for(const t of de){const r=De(R0[t.id]);r!==null&&(e[t.id]=r)}return e}function rS(){const e={};for(const t of de){const r=O0[t.id];let n=De(r);t.id==="cds"&&n===null&&(n=De(K0)),n!==null&&(e[t.id]=n)}return e}function Cc(e,t){const r=A(e,{});if(r&&typeof r=="object"&&Object.keys(r).length>0)return Fr(r,!1);const n=t();if(Object.keys(n).length>0){const s=Fr(n,!1);return _(e,s),s}return Kd(!1)}function wn(){return Cc(Nc,tS)}function nS(e){_(Nc,Fr(e,!1))}function Un(){return{showPercentAmount:!1,showNoTip:!0}}function Ir(){return{cds:Un(),kiosk:Un(),paypad:Un()}}function Mc(e){if(!e||typeof e!="object")return null;const t=e;return{showPercentAmount:!!t.showPercentAmount,showNoTip:t.showNoTip!==!1}}function sS(){const e=De(B0),t=De(H0);return e===null&&t===null?null:{kiosk:{showPercentAmount:e??!1,showNoTip:t??!0}}}function iS(){const e=A(_0,{}),t=Mc(e);return t?{kiosk:t}:null}function Rc(){const e=A(ys,{});if(e&&typeof e=="object"&&Object.keys(e).length>0){const s=Ir();for(const i of de){const o=Mc(e[i.id]);o&&(s[i.id]=o)}return s}const t=iS(),r=sS(),n=t??r;if(n){const s={...Ir(),...n};return _(ys,s),s}return Ir()}function oS(e){var r,n;const t=Ir();for(const s of de)t[s.id]={showPercentAmount:!!((r=e[s.id])!=null&&r.showPercentAmount),showNoTip:((n=e[s.id])==null?void 0:n.showNoTip)!==!1};_(ys,t)}function Oc(){return Cc(Ic,rS)}function aS(e){_(Ic,Fr(e,!1))}function lS(e){const t=e.getAttribute("aria-checked")==="true",r=e.querySelector("span[aria-hidden='true']");r&&(r.classList.toggle("translate-x-5",t),r.classList.toggle("translate-x-0.5",!t));for(const o of Sn.split(/\s+/))e.classList.toggle(o,t);for(const o of Tn.split(/\s+/))e.classList.toggle(o,!t);const n=e.closest("[data-module-setting-toggle-group]"),s=n==null?void 0:n.querySelector("[data-toggle-off-label]"),i=n==null?void 0:n.querySelector("[data-toggle-on-label]");s&&(s.className=t?"text-xs text-muted-foreground":"text-xs font-medium text-foreground"),i&&(i.className=t?"text-xs font-medium text-foreground":"text-xs text-muted-foreground")}function dS(e){const t=e.on?Sn:Tn,r=e.on?"translate-x-5":"translate-x-0.5";return`
    <div class="flex shrink-0 items-center gap-2" data-module-setting-toggle-group>
      <span data-toggle-off-label class="${e.on?"text-xs text-muted-foreground":"text-xs font-medium text-foreground"}">关</span>
      <button
        type="button"
        role="switch"
        aria-checked="${e.on?"true":"false"}"
        aria-label="${L(e.lineLabel)} ${e.editorKind==="tip-page"?"展示小费页":"展示签名页"}"
        data-checkout-ux-toggle="${L(e.editorKind)}"
        data-checkout-ux-line="${L(e.lineId)}"
        class="module-setting-toggle relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${t}"
      >
        <span class="pointer-events-none block size-5 ${r} ${qc} rounded-full transition-transform duration-200" aria-hidden="true"></span>
      </button>
      <span data-toggle-on-label class="${e.on?"text-xs font-medium text-foreground":"text-xs text-muted-foreground"}">开</span>
    </div>`}function Kc(e){const t=de.map(r=>`
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm text-foreground">${L(r.label)}</td>
      <td class="px-3 py-2.5">
        ${dS({editorKind:e.editorKind,lineId:r.id,lineLabel:r.label,on:e.values[r.id]})}
      </td>
    </tr>`).join("");return`
    <div ${e.editorAttr} class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[16rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium">产线</th>
              <th class="px-3 py-2 font-medium">${L(e.valueHeader)}</th>
            </tr>
          </thead>
          <tbody>${t}</tbody>
        </table>
      </div>
    </div>`}function cS(e){return e===E0}function uS(e){return e===$0}function pS(e){return e===w0}function mS(e){return e===k0}function gS(){return`
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      <strong>463 / 464 / 465 / 669</strong> 均按 <strong>CDS、Kiosk、PayPad</strong> 产线独立配置。
      签名金额门槛见「卡支付规则与合规」；小费与刷卡顺序见「小费与刷卡顺序」。
    </p>`}function fS(){return`
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      原 seq <strong>492</strong>（Kiosk）、<strong>662</strong>（PayPad）已合并。
      预设小费选项维护于「小费政策与计算」<strong>237</strong>；各产线收取方式（固定/百分比）见 <strong>493</strong>。
      下方分两项：原 <strong>494</strong>「展示百分比小费的具体金额」、原 <strong>496</strong>「展示 No Tip」，均按产线配置。
    </p>`}function bS(){return`
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      原 seq <strong>497</strong>（Kiosk）、<strong>664</strong>（PayPad）、客显 <strong>8</strong> 已合并。
      低于「卡支付规则与合规」<strong>243</strong> 产线门槛时可跳过（若门槛 &gt; 0）。
    </p>`}function hS(){return`
    <div data-checkout-tip-page-editor class="space-y-4">
      ${Kc({editorKind:"tip-page",editorAttr:"data-checkout-tip-page-matrix",valueHeader:"展示小费页",values:wn()})}
      ${xS()}
    </div>`}function vS(e){const t=e.getAttribute("aria-checked")==="true",r=e.querySelector("span[aria-hidden='true']");r&&(r.classList.toggle("translate-x-5",t),r.classList.toggle("translate-x-0.5",!t));for(const o of Sn.split(/\s+/))e.classList.toggle(o,t);for(const o of Tn.split(/\s+/))e.classList.toggle(o,!t);const n=e.closest("[data-module-setting-toggle-group]"),s=n==null?void 0:n.querySelector("[data-toggle-off-label]"),i=n==null?void 0:n.querySelector("[data-toggle-on-label]");s&&(s.className=t?"text-xs text-muted-foreground":"text-xs font-medium text-foreground"),i&&(i.className=t?"text-xs font-medium text-foreground":"text-xs text-muted-foreground")}function yS(e){const t=e.field==="showPercentAmount"?"data-tip-page-show-percent-amount":"data-tip-page-show-no-tip",r=e.checked?Sn:Tn,n=e.checked?"translate-x-5":"translate-x-0.5";return`
    <div class="flex shrink-0 items-center gap-2 ${e.disabled?"opacity-50":""}" data-module-setting-toggle-group>
      <span data-toggle-off-label class="${e.checked?"text-xs text-muted-foreground":"text-xs font-medium text-foreground"}">关</span>
      <button
        type="button"
        role="switch"
        aria-checked="${e.checked?"true":"false"}"
        class="group inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${r} ${e.disabled?"cursor-not-allowed":"cursor-pointer"}"
        ${t}
        data-tip-page-detail-line="${L(e.lineId)}"
        ${e.disabled?"disabled":""}
        aria-label="${L(e.label)}"
      >
        <span
          aria-hidden="true"
          class="inline-block h-5 w-5 rounded-full transition-transform duration-200 ${qc} ${n}"
        ></span>
      </button>
      <span data-toggle-on-label class="${e.checked?"text-xs font-medium text-foreground":"text-xs text-muted-foreground"}">开</span>
    </div>`}function ia(e){const t=Rc(),r=de.map(n=>{const s=t[n.id],i=e.isRowDisabled(n.id),o=e.isInputDisabled(n.id),a=e.field==="showPercentAmount"?s.showPercentAmount:s.showNoTip;return`
    <tr class="border-t border-border ${i?"opacity-50":""}" ${e.rowAttr}="${L(n.id)}">
      <td class="px-3 py-2.5 text-sm text-foreground">${L(n.label)}</td>
      <td class="px-3 py-2.5">
        ${yS({lineId:n.id,field:e.field,checked:a,disabled:o,label:`${n.label} ${e.valueHeader}`})}
      </td>
    </tr>`}).join("");return`
      <div class="overflow-x-auto rounded-md border border-border bg-background">
        <table class="w-full min-w-[18rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">${L(e.valueHeader)}</th>
            </tr>
          </thead>
          <tbody>${r}</tbody>
        </table>
      </div>`}function xS(){const e=wn(),t=hn(),r=ia({rowAttr:"data-tip-page-percent-row",valueHeader:"展示",field:"showPercentAmount",isRowDisabled:s=>!e[s]||t[s]!=="percent",isInputDisabled:s=>!e[s]||t[s]!=="percent"}),n=ia({rowAttr:"data-tip-page-no-tip-row",valueHeader:"展示",field:"showNoTip",isRowDisabled:s=>!e[s],isInputDisabled:s=>!e[s]});return`
    <div data-tip-page-detail-by-line class="space-y-4">
      <div class="rounded-md border border-border bg-muted/20 p-3">
        <p class="mb-1 text-sm font-semibold text-foreground">展示百分比小费的具体金额</p>
        <p class="mb-3 text-xs leading-relaxed text-muted-foreground">
          原 seq <strong>494</strong>。仅当对应产线「展示小费页」为开且「小费政策」<strong>493</strong> 为「百分比」时生效。
        </p>
        ${r}
      </div>
      <div class="rounded-md border border-border bg-muted/20 p-3">
        <p class="mb-1 text-sm font-semibold text-foreground">展示 No Tip</p>
        <p class="mb-3 text-xs leading-relaxed text-muted-foreground">
          原 seq <strong>496</strong>。仅当对应产线「展示小费页」为开时生效，与收取方式无关。
        </p>
        ${n}
      </div>
    </div>`}function jn(e){var n,s;const t=wn(),r=hn();for(const i of de){const o=t[i.id],a=!o||r[i.id]!=="percent";e.querySelectorAll(`[data-tip-page-detail-line="${i.id}"][data-tip-page-show-percent-amount]`).forEach(l=>{l.disabled=a,l.classList.toggle("cursor-not-allowed",a),l.classList.toggle("cursor-pointer",!a)}),e.querySelectorAll(`[data-tip-page-detail-line="${i.id}"][data-tip-page-show-no-tip]`).forEach(l=>{l.disabled=!o,l.classList.toggle("cursor-not-allowed",!o),l.classList.toggle("cursor-pointer",o)}),(n=e.querySelector(`[data-tip-page-percent-row="${i.id}"]`))==null||n.classList.toggle("opacity-50",a),(s=e.querySelector(`[data-tip-page-no-tip-row="${i.id}"]`))==null||s.classList.toggle("opacity-50",!o)}}function SS(e){const t=Rc();for(const r of de){const n=e.querySelector(`[data-tip-page-detail-line="${r.id}"][data-tip-page-show-percent-amount]`),s=e.querySelector(`[data-tip-page-detail-line="${r.id}"][data-tip-page-show-no-tip]`);t[r.id]={showPercentAmount:n!==null?n.getAttribute("aria-checked")==="true":t[r.id].showPercentAmount,showNoTip:s!==null?s.getAttribute("aria-checked")==="true":t[r.id].showNoTip}}return t}function TS(){return Kc({editorKind:"signature-page",editorAttr:"data-checkout-signature-page-editor",valueHeader:"展示签名页",values:Oc()})}function ES(){return`
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      按 <strong>POS / CDS / Kiosk / PayPad</strong> 配置<strong>纸质小票</strong>、<strong>电子小票（短信）</strong>、<strong>电子小票（邮箱）</strong>三通道。
      同一产线<strong>仅允许一个通道为「自动」</strong>。原 <strong>260</strong>（支付后自动打印）并入纸质「自动打印」；<strong>501/665</strong> 并入短信/邮箱通道。
    </p>`}function $S(){return`
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      按 <strong>POS / CDS / Kiosk / PayPad</strong> 配置信用卡<strong>纸质签购单</strong>：商户联与客户联可分别选手动/自动/不打印。
      原打印中心 <strong>245、249</strong> 与硬件 <strong>670</strong> 已并入本项。
    </p>`}function Bc(e,t){return xn.some(r=>r!==t&&e[r]==="auto")}function wS(e){const t=`receipt-${e.channel}-${e.lineId}`,r=Bc(e.channels,e.channel),n=e.optionList.map(s=>{const i=e.mode===s.value,o=s.value==="auto"&&r;return`
        <label class="inline-flex items-center gap-1.5 text-sm ${o?"cursor-not-allowed opacity-50":"cursor-pointer text-foreground"}">
          <input
            type="radio"
            name="${L(t)}"
            value="${L(s.value)}"
            class="${q}"
            ${i?"checked":""}
            ${o?"disabled":""}
            data-receipt-line="${L(e.lineId)}"
            data-receipt-channel="${L(e.channel)}"
            aria-label="${L(e.lineLabel)} ${L(e.channelLabel)} ${L(s.label)}"
          />
          <span>${L(s.label)}</span>
        </label>`}).join("");return`
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-3" role="radiogroup" aria-label="${L(e.lineLabel)} ${L(e.channelLabel)}">${n}</div>`}function kS(){const e=Bi();return`
    <div data-receipt-settings-editor class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[7.5rem]">通道</th>
              <th class="px-3 py-2 font-medium">输出方式</th>
            </tr>
          </thead>
          <tbody>${_e.flatMap(r=>{const n=e[r.id];return ra.map((s,i)=>{const o=s.key==="paper"?Ac:L0,a=i===0?`<td class="px-3 py-2.5 text-sm text-foreground align-top" rowspan="${ra.length}">${L(r.label)}</td>`:"";return`
    <tr class="${i===0?"border-t border-border":"border-t border-border/60"}">
      ${a}
      <td class="px-3 py-2 text-xs font-medium text-muted-foreground align-top">${L(s.label)}</td>
      <td class="px-3 py-2.5">
        ${wS({lineId:r.id,lineLabel:r.label,channel:s.key,channelLabel:s.label,mode:n[s.key],channels:n,optionList:o})}
      </td>
    </tr>`})}).join("")}</tbody>
        </table>
      </div>
    </div>`}function _S(e){const t=`card-slip-${e.copy}-${e.lineId}`,r=C0.map(n=>{const s=e.mode===n.value;return`
        <label class="inline-flex items-center gap-1.5 text-sm cursor-pointer text-foreground">
          <input
            type="radio"
            name="${L(t)}"
            value="${L(n.value)}"
            class="${q}"
            ${s?"checked":""}
            data-card-slip-line="${L(e.lineId)}"
            data-card-slip-copy="${L(e.copy)}"
            aria-label="${L(e.lineLabel)} ${L(e.copyLabel)} ${L(n.label)}"
          />
          <span>${L(n.label)}</span>
        </label>`}).join("");return`
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-3" role="radiogroup" aria-label="${L(e.lineLabel)} ${L(e.copyLabel)}">${r}</div>`}function PS(){const e=Lc();return`
    <div data-card-slip-settings-editor class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[10rem]">联次</th>
              <th class="px-3 py-2 font-medium">输出方式</th>
            </tr>
          </thead>
          <tbody>${_e.flatMap(r=>{const n=e[r.id];return na.map((s,i)=>{const o=i===0?`<td class="px-3 py-2.5 text-sm text-foreground align-top" rowspan="${na.length}">${L(r.label)}</td>`:"";return`
    <tr class="${i===0?"border-t border-border":"border-t border-border/60"}">
      ${o}
      <td class="px-3 py-2 text-xs font-medium text-muted-foreground align-top">${L(s.label)}</td>
      <td class="px-3 py-2.5">
        ${_S({lineId:r.id,lineLabel:r.label,copy:s.key,copyLabel:s.label,mode:n[s.key]})}
      </td>
    </tr>`})}).join("")}</tbody>
        </table>
      </div>
    </div>`}function NS(e,t,r,n){e[t][r]=n}function IS(e){const t=Lc(),r=$n();for(const n of _e)r[n.id]={...t[n.id]};return e.querySelectorAll("[data-card-slip-line]").forEach(n=>{if(!n.checked)return;const s=n.getAttribute("data-card-slip-line"),i=n.getAttribute("data-card-slip-copy"),o=n.value;!s||!i||!Be(o)||NS(r,s,i,o)}),r}function DS(e,t,r,n){e[t][r]=n}function AS(e,t,r){e[t]=Ki({...e[t]},r)}function qS(e){const t=Bi(),r=En();for(const i of _e)r[i.id]={...t[i.id]};let n=null,s=null;return e.querySelectorAll("[data-receipt-line]").forEach(i=>{if(!i.checked)return;const o=i.getAttribute("data-receipt-line"),a=i.getAttribute("data-receipt-channel"),l=i.value;!o||!a||!Be(l)||(DS(r,o,a,l),n=o,s=a)}),n!==null&&s!==null&&AS(r,n,s),r}function LS(e,t){for(const r of _e)for(const n of xn){const s=t[r.id][n];e.querySelectorAll(`[data-receipt-line="${r.id}"][data-receipt-channel="${n}"]`).forEach(i=>{i.checked=i.value===s})}}function oa(e){const t=Bi();for(const r of _e){const n=t[r.id];for(const s of xn){const i=Bc(n,s);e.querySelectorAll(`[data-receipt-line="${r.id}"][data-receipt-channel="${s}"][value="auto"]`).forEach(o=>{var a,l,u;o.disabled=i,(a=o.closest("label"))==null||a.classList.toggle("cursor-not-allowed",i),(l=o.closest("label"))==null||l.classList.toggle("opacity-50",i),(u=o.closest("label"))==null||u.classList.toggle("cursor-pointer",!i)})}}}function CS(e,t){const r=t==="tip-page"?wn():Oc();return e.querySelectorAll(`[data-checkout-ux-toggle="${t}"]`).forEach(n=>{const s=n.getAttribute("data-checkout-ux-line");s&&(r[s]=n.getAttribute("aria-checked")==="true")}),r}function aa(e,t,r,n){e.querySelectorAll(t).forEach(s=>{const i=r==="tip-page"?"checkoutTipPageEditorBound":"checkoutSignaturePageEditorBound";s.dataset[i]!=="1"&&(s.dataset[i]="1",s.querySelectorAll(`[data-checkout-ux-toggle="${r}"]`).forEach(o=>{o.dataset.checkoutUxToggleBound!=="1"&&(o.dataset.checkoutUxToggleBound="1",o.addEventListener("click",()=>{const a=o.getAttribute("aria-checked")!=="true";o.setAttribute("aria-checked",a?"true":"false"),lS(o),n(CS(s,r))}))}))})}function MS(e=document){aa(e,"[data-checkout-tip-page-editor]","tip-page",t=>{nS(t),e.querySelectorAll("[data-checkout-tip-page-editor]").forEach(jn)}),aa(e,"[data-checkout-signature-page-editor]","signature-page",aS),e.querySelectorAll("[data-checkout-tip-page-editor]").forEach(t=>{t.dataset.tipPageDetailByLineBound!=="1"&&(t.dataset.tipPageDetailByLineBound="1",jn(t),t.addEventListener("click",r=>{const s=r.target.closest("[data-tip-page-show-percent-amount], [data-tip-page-show-no-tip]");if(s){if(s.disabled)return;const i=s.getAttribute("aria-checked")!=="true";s.setAttribute("aria-checked",i?"true":"false"),vS(s),oS(SS(t)),jn(t)}}))}),e.querySelectorAll("[data-receipt-settings-editor]").forEach(t=>{if(t.dataset.receiptSettingsEditorBound==="1")return;t.dataset.receiptSettingsEditorBound="1";const r=()=>{const n=qS(t);Q0(n),LS(t,n),oa(t)};t.addEventListener("change",n=>{n.target.matches("[data-receipt-line]")&&r()}),oa(t)}),e.querySelectorAll("[data-card-slip-settings-editor]").forEach(t=>{t.dataset.cardSlipSettingsEditorBound!=="1"&&(t.dataset.cardSlipSettingsEditorBound="1",t.addEventListener("change",r=>{r.target.matches("[data-card-slip-line]")&&eS(IS(t))}))})}const RS=9,Hc="9-tip-card-order-by-line",OS=[{value:"tip-before-card",label:"刷卡前选择小费"},{value:"tip-after-card",label:"刷卡后选择小费"}],KS={cds:"9-tip-card-order",kiosk:"495-tip-card-order",paypad:"663-tip-card-order"},Dr="tip-before-card";function st(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Hi(e){return e==="tip-before-card"||e==="tip-after-card"}function BS(e){const t=e.trim().toLowerCase();return Hi(t)?t:t==="before"||t==="tip-first"||t==="1"?"tip-before-card":t==="after"||t==="card-first"||t==="0"?"tip-after-card":null}function Fc(){return{cds:Dr,kiosk:Dr,paypad:Dr}}function HS(e){const t=KS[e],r=H(t,"");return r?BS(r):null}function Gc(e){const t=Fc();for(const r of de){const n=e[r.id];t[r.id]=Hi(String(n??""))?n:Dr}return t}function Uc(){const e=A(Hc,{});if(e&&typeof e=="object"&&Object.keys(e).length>0)return Gc(e);const t=Fc();let r=!1;for(const n of de){const s=HS(n.id);s&&(t[n.id]=s,r=!0)}return r&&jc(t),t}function jc(e){_(Hc,Gc(e))}function FS(e){return e===RS}function GS(){return`
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      控制 <strong>CDS、Kiosk、PayPad</strong> 在卡付结账时，先进入小费页还是先刷卡。各产线可独立配置；POS / eMenu 不涉及食客自助刷卡流程。
      原扫码端 <strong>495</strong>、PayPad <strong>663</strong> 已合并于此。
    </p>`}function US(){const e=Uc();return`
    <div data-tip-card-order-editor class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">小费与刷卡顺序</th>
            </tr>
          </thead>
          <tbody>${de.map(r=>{const n=`tip-card-order-${r.id}`,s=OS.map(i=>{const o=e[r.id]===i.value;return`
        <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${st(n)}"
            value="${st(i.value)}"
            class="${q}"
            ${o?"checked":""}
            data-tip-card-order-line="${st(r.id)}"
            aria-label="${st(r.label)} ${st(i.label)}"
          />
          <span>${st(i.label)}</span>
        </label>`}).join("");return`
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm text-foreground align-top">${st(r.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4" role="radiogroup" aria-label="${st(r.label)} 小费与刷卡顺序">${s}</div>
      </td>
    </tr>`}).join("")}</tbody>
        </table>
      </div>
    </div>`}function jS(e){const t=Uc();return e.querySelectorAll("[data-tip-card-order-line]").forEach(r=>{if(!r.checked)return;const n=r.getAttribute("data-tip-card-order-line"),s=r.value;!n||!Hi(s)||(t[n]=s)}),t}function VS(e=document){e.querySelectorAll("[data-tip-card-order-editor]").forEach(t=>{if(t.dataset.tipCardOrderEditorBound==="1")return;t.dataset.tipCardOrderEditorBound="1";const r=()=>jc(jS(t));t.addEventListener("change",n=>{n.target.matches("[data-tip-card-order-line]")&&r()})})}const WS=307,Vc="307-processor-fee-percent",Wc=100;function la(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function QS(e){return Number.isFinite(e)?Math.min(Wc,Math.max(0,Math.round(e*100)/100)):0}function zS(){return QS(F(Vc,2.5))}function YS(e){return e===WS}function XS(){const e=zS();return`
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputmode="decimal"
        class="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${la(String(e))}"
        min="0"
        max="${Wc}"
        step="0.01"
        data-module-setting-number="${la(Vc)}"
        aria-label="信用卡交易手续费比例"
      />
      <span class="text-sm text-muted-foreground">%</span>
      <span class="text-xs text-muted-foreground">用于报表与成本核算；对客加价见支付中心「卡付加价策略」。</span>
    </div>`}const ZS=163,da="163-discount-reason-default",JS="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function ca(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Qc(e){return e===ZS}function e2(e,t){const r=Ge(da,"");return`
    <div
      class="mt-3 rounded-lg bg-muted/50 p-3 ${t?"":"hidden"}"
      data-order-discount-reason-panel="${e}"
      ${t?"":'aria-hidden="true"'}
    >
      <label class="mb-1.5 block text-xs text-muted-foreground" for="order-discount-reason-default-${e}">
        默认折扣原因
      </label>
      <input
        id="order-discount-reason-default-${e}"
        type="text"
        class="${JS}"
        value="${ca(r)}"
        placeholder="请输入默认折扣原因"
        data-module-setting-text="${ca(da)}"
        autocomplete="off"
      />
    </div>`}function t2(e,t){document.querySelectorAll(`[data-order-discount-reason-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true")})}const zc=127,r2=128,Fi=129,n2=130,Gi=131,Yc="130-classification-order-numbers",Ss="10,20,30,40,50,60,70,80,90,110,120,130,140,150",Ui="129-order-number-mode",s2="131-order-number-reset-mode",i2="default",Ur="timestamp",o2="daily",Xc=[{value:"timestamp",label:"TIMESTAMP"},{value:"classification",label:"CLASSIFICATION"}],a2=[{value:"daily",label:"Daily"},{value:"never",label:"Never"}],Zc={[zc]:{fieldId:"127-order-number-max",defaultValue:999,min:1,max:99999},[r2]:{fieldId:"128-order-number-start",defaultValue:1,min:1,max:99999}},l2="h-8 w-28 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",d2="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function yt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function c2(e){return Zc[e]!==void 0}function u2(e){const t=Zc[e];if(!t)return"";const r=F(t.fieldId,t.defaultValue),n=Math.min(t.max,Math.max(t.min,Math.round(r)));return`
    <input
      type="number"
      inputmode="numeric"
      class="${l2}"
      value="${yt(String(n))}"
      min="${t.min}"
      max="${t.max}"
      step="1"
      data-module-setting-number="${yt(t.fieldId)}"
      aria-label="${e===zc?"最大单号":"起始单号"}"
    />`}const Jc={[Fi]:{fieldId:Ui,groupName:"module-setting-radio-129-order-number-mode",options:Xc,defaultValue:Ur,ariaLabel:"单号模式"},[Gi]:{fieldId:s2,groupName:"module-setting-radio-131-order-number-reset",options:a2,defaultValue:o2,ariaLabel:"单号重置"}};function eu(e,t){return t.some(r=>r.value===e)}function ua(e){return eu(e,Xc)}function p2(e){const t=e.trim();if(ua(t))return t;const r=t.toLowerCase();return ua(r)?r:Ur}function m2(){return p2(H(Ui,Ur))}function g2(e){return e===Fi}function f2(e){return e===Gi}function b2(e){const t=H(e.fieldId,e.defaultValue);return eu(t,e.options)?t:e.defaultValue}function tu(e){return tt({options:e.options,fieldId:e.fieldId,groupName:e.groupName,currentValue:b2(e),layout:"vertical",ariaLabel:e.ariaLabel})}function h2(){return tu(Jc[Fi])}function v2(){return tu(Jc[Gi])}function y2(){return Ge(Yc,Ss).trim()||Ss}function x2(e){return e===n2}function ru(){return m2()==="classification"}function pa(e=document){const t=ru();e.querySelectorAll("[data-classification-mode-hint]").forEach(r=>{r.classList.toggle("hidden",t)})}function S2(e,t){const r=ru(),n=y2();return`
    <li class="list-none" data-order-classification-setting>
      <div class="border-b border-border px-4 py-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1 space-y-1">
            <p class="text-sm font-medium text-card-foreground">${yt(e)}</p>
            ${t?`<p class="text-xs leading-relaxed text-muted-foreground">${yt(t)}</p>`:""}
          </div>
          <button
            type="button"
            class="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground hover:bg-muted"
            data-classification-collapse-toggle
            aria-expanded="true"
            aria-label="展开或收起分类单号输入"
            title="收起"
          >
            <svg class="size-4 transition-transform" data-classification-chevron viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        </div>
        <div class="mt-3" data-classification-input-panel>
          <input
            type="text"
            class="${d2}"
            value="${yt(n)}"
            placeholder="${yt(Ss)}"
            data-module-setting-text="${yt(Yc)}"
            aria-label="分类单号列表"
            autocomplete="off"
            spellcheck="false"
          />
          <p class="mt-1.5 text-xs text-muted-foreground">多个分类单号请用英文逗号分隔，例如 10,20,30</p>
          <p
            class="mt-1 text-xs text-muted-foreground ${r?"hidden":""}"
            data-classification-mode-hint
          >生效需将上方「单号模式」设为 CLASSIFICATION</p>
        </div>
      </div>
    </li>`}function T2(e,t){var s;e.classList.toggle("hidden",t);const r=(s=e.closest("[data-order-classification-setting]"))==null?void 0:s.querySelector("[data-classification-collapse-toggle]"),n=r==null?void 0:r.querySelector("[data-classification-chevron]");r&&(r.setAttribute("aria-expanded",t?"false":"true"),r.title=t?"展开":"收起"),n&&n.classList.toggle("rotate-180",t)}function E2(e=document){pa(e),e.querySelectorAll(`[data-module-setting-radio="${Ui}"]`).forEach(t=>{t.dataset.orderNumberModeSyncBound!=="1"&&(t.dataset.orderNumberModeSyncBound="1",t.addEventListener("change",()=>{t.checked&&pa(e)}))})}function $2(e=document){e.querySelectorAll("[data-classification-collapse-toggle]").forEach(t=>{t.dataset.classificationCollapseBound!=="1"&&(t.dataset.classificationCollapseBound="1",t.addEventListener("click",()=>{const r=t.closest("[data-order-classification-setting]"),n=r==null?void 0:r.querySelector("[data-classification-input-panel]");if(!n)return;const s=n.classList.contains("hidden");T2(n,!s)}))})}const w2=3,k2=4,_2=5,P2=7,N2="h-8 w-20 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",nu={[w2]:{fieldId:"3-caller-ticket-display-minutes",defaultValue:5,min:1,max:480,unit:"分钟",inputAriaLabel:"单号展示时长（分钟）"},[k2]:{fieldId:"4-caller-ticket-slot-limit",defaultValue:10,min:1,max:50,unit:"个",inputAriaLabel:"同屏单号数量上限"},[_2]:{fieldId:"5-caller-data-retention-days",defaultValue:30,min:1,max:365,unit:"天",inputAriaLabel:"历史数据保留天数"}},su="7-caller-display-mode",I2="module-setting-radio-7-caller-display-mode",iu=[{value:"ad_and_tickets",label:"广告图 + 订单号"},{value:"tickets_only",label:"仅订单号（不展示广告图）"},{value:"multiple_kitchens",label:"多厨房（Multiple kitchens）"},{value:"prep_status",label:"备餐状态展示（Show kitchen preparation status）"}],ma="ad_and_tickets";function yr(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function D2(e){return nu[e]!==void 0}function A2(e){return e===P2}function q2(e){return iu.some(t=>t.value===e)}function L2(){const e=H(su,ma);return q2(e)?e:ma}function C2(e){const t=nu[e];if(!t)return"";const r=F(t.fieldId,t.defaultValue),n=Math.min(t.max,Math.max(t.min,Math.round(r)));return`
    <div class="flex flex-wrap items-center justify-end gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="${N2}"
        value="${yr(String(n))}"
        min="${t.min}"
        max="${t.max}"
        step="1"
        data-module-setting-number="${yr(t.fieldId)}"
        aria-label="${yr(t.inputAriaLabel)}"
      />
      <span class="text-sm text-muted-foreground">${yr(t.unit)}</span>
    </div>`}function M2(){return tt({options:iu,fieldId:su,groupName:I2,currentValue:L2(),layout:"vertical",ariaLabel:"叫号屏显示模式"})}const R2=341,ou="341-reservation-reminder-hours",O2=24,au=1,lu=168,K2="h-8 w-20 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function ga(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function B2(e){return e===R2}function H2(){const e=F(ou,O2);return Math.min(lu,Math.max(au,Math.round(e)))}function F2(){const e=H2();return`
    <div class="flex flex-wrap items-center justify-end gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="${K2}"
        value="${ga(String(e))}"
        min="${au}"
        max="${lu}"
        step="1"
        data-module-setting-number="${ga(ou)}"
        aria-label="预约消息提前提醒（小时）"
      />
      <span class="text-sm text-muted-foreground">小时</span>
    </div>`}const jr=171,G2=65,U2=330,j2=[G2,U2];function du(e){return e===jr}function V2(e){return j2.includes(e)}function W2(){return`
    <p class="m-0 mb-3 text-xs leading-relaxed text-muted-foreground">
      本组配置<strong>门店现金日结/班结</strong>流程：是否按营业日执行班结、班结界面展示与完成后报表输出。
      <strong>不是</strong>卡交易 Batch 调度——自动关账时刻、收单结算周期、Batch 后打印见支付中心「BATCH与日结」（238、230、235）。
      钱箱容差与备款见「钱箱与现金平账」（63、76、181）。
    </p>`}function Q2(e){return`
    <div
      class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-3 ${e?"":"hidden"}"
      data-daily-close-enabled-panel="${jr}"
      ${e?"":'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">开启后可配置的现金班结项</p>
      <ul class="m-0 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
        <li><strong>65</strong> 班结界面是否展示系统现金销售总额</li>
        <li><strong>330</strong> 班结完成后是否自动打印备款/现金结算报表</li>
      </ul>
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        关闭主开关后，65/330 不可用；不影响支付中心 Batch 关账时刻（238）。
      </p>
    </div>`}function cu(e,t){document.querySelectorAll(`[data-daily-close-enabled-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true")})}function Ts(e){document.querySelectorAll("[data-daily-close-cash-option]").forEach(t=>{t.classList.toggle("opacity-50",!e),t.querySelectorAll("[data-module-setting-toggle]").forEach(r=>{r.disabled=!e,e?r.removeAttribute("aria-disabled"):r.setAttribute("aria-disabled","true")})})}function z2(){try{const e=`bplant-module-setting-toggle:${jr}`,t=localStorage.getItem(e)==="1";Ts(t),cu(jr,t)}catch{Ts(!0)}}const Y2=63,X2=76,Z2=181,uu="63-cash-drawer-float-amount",pu="64-coin-roll-counts",ji="76-cash-reconciliation-tolerance",Es=200,mu=0,gu=1e4,$s=5,fu=0,bu=500,hu="h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",J2="h-8 w-16 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",Vi=[{id:"quarter",label:"25¢ 卷",valuePerRoll:10},{id:"dime",label:"10¢ 卷",valuePerRoll:5},{id:"nickel",label:"5¢ 卷",valuePerRoll:2},{id:"penny",label:"1¢ 卷",valuePerRoll:.5}],vu=Vi.map(e=>e.id),Wi={quarter:0,dime:0,nickel:0,penny:0};function Je(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Qi(e,t,r,n){return Number.isFinite(e)?Math.min(r,Math.max(t,Math.round(e*100)/100)):n}function yu(e){const t={...Wi};if(!e||typeof e!="object")return t;for(const r of vu){const n=Number(e[r]);t[r]=Number.isFinite(n)?Math.min(99,Math.max(0,Math.round(n))):0}return t}function e1(){return Qi(F(uu,Es),mu,gu,Es)}function t1(){return yu(A(pu,Wi))}function r1(e){_(pu,yu(e))}function xu(e){let t=0;for(const r of Vi)t+=(e[r.id]??0)*r.valuePerRoll;return Math.round(t*100)/100}function zi(){return Qi(F(ji,$s),fu,bu,$s)}function n1(e){return e===Y2}function s1(e){return e===X2}function Su(e){return e===Z2}function i1(){return`
    <p class="m-0 mb-3 text-xs leading-relaxed text-muted-foreground">
      本组为<strong>现金内控策略</strong>：开班备款、班结长短款容差与超差提醒。
      现金日结流程见「日结与结算」（171、65、330）；开钱箱硬件见硬件管理中心。
    </p>`}function o1(){const e=e1();return`
    <div class="flex flex-wrap items-center justify-end gap-2">
      <span class="text-sm text-muted-foreground">$</span>
      <input
        type="number"
        inputmode="decimal"
        class="${hu} w-28"
        value="${Je(String(e))}"
        min="${mu}"
        max="${gu}"
        step="0.01"
        data-cash-drawer-money-number="${Je(uu)}"
        aria-label="现金底金金额"
      />
    </div>`}function a1(e,t){return`
    <label class="flex items-center justify-between gap-3 text-sm text-foreground">
      <span class="text-muted-foreground">${Je(e.label)}<span class="ml-1 text-xs">($${e.valuePerRoll}/卷)</span></span>
      <input
        type="number"
        inputmode="numeric"
        class="${J2}"
        value="${t}"
        min="0"
        max="99"
        step="1"
        data-cash-drawer-coin-roll="${Je(e.id)}"
        aria-label="${Je(e.label)} 卷数"
      />
    </label>`}function l1(){const e=t1(),t=xu(e);return`
    <details class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2" data-cash-drawer-coin-rolls-panel>
      <summary class="cursor-pointer select-none py-1 text-xs font-medium text-muted-foreground">
        硬币卷明细（可选，原 seq 64）
      </summary>
      <div class="mt-2 space-y-2 border-t border-border pt-3">
        ${Vi.map(n=>a1(n,e[n.id])).join("")}
        <p class="m-0 text-xs text-muted-foreground" data-cash-drawer-coin-rolls-total>
          硬币卷合计约 <strong>$${Je(t.toFixed(2))}</strong>（辅助核对，不自动覆盖底金金额）
        </p>
      </div>
    </details>`}function d1(){return`
    <div class="mt-3 space-y-0">
      ${l1()}
    </div>`}function c1(){const e=zi();return`
    <div class="flex flex-wrap items-center justify-end gap-2">
      <span class="text-sm text-muted-foreground">± $</span>
      <input
        type="number"
        inputmode="decimal"
        class="${hu} w-28"
        value="${Je(String(e))}"
        min="${fu}"
        max="${bu}"
        step="0.01"
        data-cash-drawer-money-number="${Je(ji)}"
        data-cash-drawer-tolerance-input
        aria-label="现金平账允许误差值"
      />
    </div>`}function u1(e,t){const r=zi();return`
    <div
      class="mt-3 rounded-lg bg-muted/50 px-3 py-3 ${t?"":"hidden"}"
      data-cash-drawer-variance-alert-panel="${e}"
      ${t?"":'aria-hidden="true"'}
    >
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        实点与系统应有现金之差超过 <strong data-cash-drawer-variance-alert-threshold>$${Je(r.toFixed(2))}</strong> 时在 POS 提醒。
        容差金额在上方「现金平账允许误差值」修改。
      </p>
    </div>`}function p1(e,t){document.querySelectorAll(`[data-cash-drawer-variance-alert-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true")})}function Tu(){const t=`$${zi().toFixed(2)}`;document.querySelectorAll("[data-cash-drawer-variance-alert-threshold]").forEach(r=>{r.textContent=t})}function Eu(e){const t={...Wi};return e.querySelectorAll("[data-cash-drawer-coin-roll]").forEach(r=>{const n=r.getAttribute("data-cash-drawer-coin-roll");if(!n||!vu.includes(n))return;const s=Math.round(Number(r.value));t[n]=Number.isFinite(s)?Math.min(99,Math.max(0,s)):0}),t}function m1(e){const t=xu(Eu(e)),r=e.querySelector("[data-cash-drawer-coin-rolls-total]");r&&(r.innerHTML=`硬币卷合计约 <strong>$${t.toFixed(2)}</strong>（辅助核对，不自动覆盖底金金额）`)}function g1(e,t,r,n){const s=e.getAttribute("data-cash-drawer-money-number");if(!s)return;const i=Qi(Number(e.value),t,r,n);e.value=String(i),ui(s,i)}function f1(e=document){e.querySelectorAll("[data-cash-drawer-money-number]").forEach(t=>{if(t.dataset.cashDrawerMoneyBound==="1")return;t.dataset.cashDrawerMoneyBound="1";const r=t.getAttribute("data-cash-drawer-money-number"),n=Number(t.getAttribute("min")??"0"),s=Number(t.getAttribute("max")??"999999"),i=r===ji?$s:Es,o=()=>{g1(t,n,s,i),t.hasAttribute("data-cash-drawer-tolerance-input")&&Tu()};t.addEventListener("change",o),t.addEventListener("blur",o)}),e.querySelectorAll("[data-cash-drawer-coin-rolls-panel]").forEach(t=>{t.dataset.cashDrawerCoinRollsBound!=="1"&&(t.dataset.cashDrawerCoinRollsBound="1",t.addEventListener("input",r=>{r.target.matches("[data-cash-drawer-coin-roll]")&&(r1(Eu(t)),m1(t))}))})}const $u=529,b1=13,h1=14,wu=[{id:"kiosk",label:"Kiosk"},{id:"emenu",label:"eMenu"},{id:"pos",label:"POS"}],ku="529-waitlist-mode-lines",_u="13-waitlist-party-size-options",ws="2,3,4,5,6,7,8",Pu="14-waitlist-party-identifier",v1="module-setting-radio-14-waitlist-party-identifier",Nu=[{value:"queue_number",label:"排队号码（系统自动分配）"},{value:"guest_name",label:"客人姓名"},{value:"number_and_name",label:"号码 + 姓名"}],fa="queue_number",Rt=wu.map(e=>e.id),y1="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function Tt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function x1(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function S1(e){if(!Array.isArray(e))return[];const t=new Set(Rt);return e.filter(r=>typeof r=="string"&&t.has(r))}function Iu(){const e=S1(A(ku,null));return e.length>0?e:x1($u)?(Yi(Rt),[...Rt]):[]}function Yi(e){const t=Rt.filter(r=>e.includes(r));_(ku,t)}function T1(){Iu().length===0&&Yi(Rt)}function Du(e){return e===$u}function E1(e){return e===b1}function $1(e){return e===h1}function w1(e){return Nu.some(t=>t.value===e)}function k1(){return Ge(_u,ws).trim()||ws}function _1(){const e=H(Pu,fa);return w1(e)?e:fa}function P1(e,t){const r=new Set(Iu()),n=wu.map(i=>{const o=r.has(i.id);return`
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${q}"
          value="${Tt(i.id)}"
          data-waitlist-mode-line="${e}"
          data-waitlist-mode-line-id="${Tt(i.id)}"
          ${o?"checked":""}
          ${t?"":"disabled"}
          aria-label="${Tt(i.label)}"
        />
        <span>${Tt(i.label)}</span>
      </label>`}).join("");return`
    <div
      class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-3 ${t?"":"hidden"}"
      data-waitlist-mode-panel="${e}"
      ${t?"":'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="等位模式适用产线">
        ${n}
      </div>
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        开启后，仅在勾选的产线展示等位排队取号能力；关闭主开关后所有产线均不可用。
      </p>
    </div>`}function N1(e,t){document.querySelectorAll(`[data-waitlist-mode-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true"),r.querySelectorAll("[data-waitlist-mode-line]").forEach(n=>{n.disabled=!t})})}function I1(e){const t=[];return e.querySelectorAll("[data-waitlist-mode-line]:checked").forEach(r=>{const n=r.getAttribute("data-waitlist-mode-line-id");n&&Rt.includes(n)&&t.push(n)}),t}function D1(e=document){e.querySelectorAll("[data-waitlist-mode-panel]").forEach(t=>{t.dataset.waitlistModePanelBound!=="1"&&(t.dataset.waitlistModePanelBound="1",t.addEventListener("change",r=>{r.target.matches("[data-waitlist-mode-line]")&&Yi(I1(t))}))})}function A1(){const e=k1();return`
    <input
      type="text"
      class="${y1}"
      value="${Tt(e)}"
      placeholder="${Tt(ws)}"
      data-module-setting-text="${Tt(_u)}"
      aria-label="等位可选团体人数"
    />
    <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
      英文逗号分隔，如 2,4,6 表示食客可选 2 人桌、4 人桌、6 人桌等；与「按团体人数分开排队」联动时分队依据。
    </p>`}function q1(){return tt({options:Nu,fieldId:Pu,groupName:v1,currentValue:_1(),layout:"vertical",ariaLabel:"等位团体代号识别方式"})}const L1=126,Au="126-default-new-order-type",C1="module-setting-radio-126-default-order-type",Xi=[{value:"dine-in",label:"Dine In"},{value:"to-go",label:"To Go"},{value:"pick-up",label:"Pick Up"},{value:"delivery",label:"Delivery"}];function Vn(e){return Xi.some(t=>t.value===e)}function M1(e){const t=e.trim();if(Vn(t))return t;const r=t.toLowerCase();if(Vn(r))return r;const n=r.replace(/\s+/g,"-");if(Vn(n))return n;const s=Xi.find(i=>i.label.toLowerCase()===r);return s?s.value:"dine-in"}function R1(){return M1(H(Au,"dine-in"))}function O1(e){return e===L1}function K1(){return tt({options:Xi,fieldId:Au,groupName:C1,currentValue:R1(),layout:"wrap",ariaLabel:"默认新订单类型"})}const qu=622,Lu="622-sms-verification-lines",qe=[{id:"pos",label:"POS"},{id:"kiosk",label:"Kiosk"},{id:"emenu",label:"eMenu"},{id:"paypad",label:"Paypad"}],Ot=qe.map(e=>e.id);function xr(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ba(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function B1(e){if(!Array.isArray(e))return[];const t=new Set(Ot);return e.filter(r=>typeof r=="string"&&t.has(r))}function Cu(){const e=A(Lu,null),t=B1(e);return t.length>0?t:ba(qu)||ba(508)?(Zi(Ot),[...Ot]):[]}function Zi(e){const t=Ot.filter(r=>e.includes(r));_(Lu,t)}function H1(){Cu().length===0&&Zi(Ot)}function Mu(e){return e===qu}function F1(e,t){const r=new Set(Cu()),n=qe.map(i=>{const o=r.has(i.id);return`
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${q}"
          value="${xr(i.id)}"
          data-member-sms-verification-line="${xr(i.id)}"
          ${o?"checked":""}
          ${t?"":"disabled"}
          aria-label="${xr(i.label)}"
        />
        <span>${xr(i.label)}</span>
      </label>`}).join("");return`
    <div
      class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-3 ${t?"":"hidden"}"
      data-member-sms-verification-panel="${e}"
      ${t?"":'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="短信验证码适用产线">
        ${n}
      </div>
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        仅对勾选的产线生效；关闭主开关后，所有产线均不要求短信验证码。
      </p>
    </div>`}function G1(e,t){document.querySelectorAll(`[data-member-sms-verification-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true"),r.querySelectorAll("[data-member-sms-verification-line]").forEach(n=>{n.disabled=!t})})}function U1(e){const t=[];return e.querySelectorAll("[data-member-sms-verification-line]:checked").forEach(r=>{const n=r.getAttribute("data-member-sms-verification-line");n&&Ot.includes(n)&&t.push(n)}),t}function j1(e=document){e.querySelectorAll("[data-member-sms-verification-panel]").forEach(t=>{t.dataset.memberSmsVerificationPanelBound!=="1"&&(t.dataset.memberSmsVerificationPanelBound="1",t.addEventListener("change",r=>{r.target.matches("[data-member-sms-verification-line]")&&Zi(U1(t))}))})}const V1=623,W1="623-member-pre-order-login-policy",Ru="623-member-pre-order-login-policy-by-line",Ou=[{value:"optional",label:"可选登录（展示登录/注册页，不强制）"},{value:"required",label:"点单前必须登录/注册"},{value:"hidden",label:"不展示登录/注册页"}],Ji="optional";function it(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function eo(e){return Ou.some(t=>t.value===e)}function Vr(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function Q1(){return Vr(623)?"required":Vr(624)?"hidden":"optional"}function Ku(e=Ji){return Object.fromEntries(qe.map(t=>[t.id,e]))}function Bu(e){const t=Ku();for(const r of qe){const n=e[r.id];t[r.id]=eo(String(n??""))?n:Ji}return t}function z1(){const e=H(W1,"");return eo(e)?e:Vr(623)||Vr(624)?Q1():null}function Hu(){const e=A(Ru,{});if(e&&typeof e=="object"&&Object.keys(e).length>0)return Bu(e);const t=z1(),r=Ku(t??Ji);return Fu(r),r}function Fu(e){_(Ru,Bu(e))}function Y1(e){return e===V1}function X1(){const e=Hu();return`
    <div data-member-login-policy-editor class="space-y-2">
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        每条产线独立配置，且只能选一种策略；与 seq 622 短信验证码产线范围可不同。
      </p>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[6.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">点单前会员身份策略（单选）</th>
            </tr>
          </thead>
          <tbody>${qe.map(r=>{const n=`member-pre-order-login-policy-${r.id}`,s=Ou.map(i=>{const o=e[r.id]===i.value;return`
        <label class="inline-flex cursor-pointer items-start gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${it(n)}"
            value="${it(i.value)}"
            class="${q} mt-0.5"
            ${o?"checked":""}
            data-member-login-policy-line="${it(r.id)}"
            aria-label="${it(r.label)} ${it(i.label)}"
          />
          <span class="leading-snug">${it(i.label)}</span>
        </label>`}).join("");return`
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${it(r.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-col gap-2" role="radiogroup" aria-label="${it(r.label)} 点单前会员身份策略">${s}</div>
      </td>
    </tr>`}).join("")}</tbody>
        </table>
      </div>
    </div>`}function Z1(e){const t=Hu();return e.querySelectorAll("[data-member-login-policy-line]").forEach(r=>{if(!r.checked)return;const n=r.getAttribute("data-member-login-policy-line"),s=r.value;!n||!eo(s)||(t[n]=s)}),t}function J1(e=document){e.querySelectorAll("[data-member-login-policy-editor]").forEach(t=>{t.dataset.memberLoginPolicyEditorBound!=="1"&&(t.dataset.memberLoginPolicyEditorBound="1",t.addEventListener("change",r=>{r.target.matches("[data-member-login-policy-line]")&&Fu(Z1(t))}))})}const Gu=505,Uu=507,ju=510,eT=[Gu,Uu,ju],kn={[Gu]:{linesStorageId:"505-phone-required-lines",panelHint:"勾选产线在输入手机号页面要求手机号必填（取餐联络等）。"},[Uu]:{linesStorageId:"507-name-required-lines",panelHint:"勾选产线在输入姓名页面要求姓名必填（叫号等）。"},[ju]:{linesStorageId:"510-privacy-default-lines",panelHint:"勾选产线在输入手机号页面默认勾选隐私条款（食客仍可取消）。"}},Kt=qe.map(e=>e.id);function Vt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function tT(e){return e in kn}function rT(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function nT(e){if(!Array.isArray(e))return[];const t=new Set(Kt);return e.filter(r=>typeof r=="string"&&t.has(r))}function Vu(e){const{linesStorageId:t}=kn[e],r=nT(A(t,null));return r.length>0?r:rT(e)?(to(e,Kt),[...Kt]):[]}function to(e,t){const r=Kt.filter(n=>t.includes(n));_(kn[e].linesStorageId,r)}function sT(e){Vu(e).length===0&&to(e,Kt)}function Wu(e){return tT(e)}function iT(e,t){const r=new Set(Vu(e)),{panelHint:n}=kn[e],s=qe.map(o=>{const a=r.has(o.id);return`
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${q}"
          value="${Vt(o.id)}"
          data-member-registration-field-line="${e}"
          data-member-registration-line-id="${Vt(o.id)}"
          ${a?"checked":""}
          ${t?"":"disabled"}
          aria-label="${Vt(o.label)}"
        />
        <span>${Vt(o.label)}</span>
      </label>`}).join("");return`
    <div
      class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-3 ${t?"":"hidden"}"
      data-member-registration-field-panel="${e}"
      ${t?"":'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="适用产线">
        ${s}
      </div>
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${Vt(n)}</p>
    </div>`}function oT(e,t){document.querySelectorAll(`[data-member-registration-field-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true"),r.querySelectorAll("[data-member-registration-field-line]").forEach(n=>{Number(n.getAttribute("data-member-registration-field-line"))===e&&(n.disabled=!t)})})}function aT(e,t){const r=[];return e.querySelectorAll(`[data-member-registration-field-line="${t}"]:checked`).forEach(n=>{const s=n.getAttribute("data-member-registration-line-id");s&&Kt.includes(s)&&r.push(s)}),r}function lT(e=document){for(const t of eT)e.querySelectorAll(`[data-member-registration-field-panel="${t}"]`).forEach(r=>{r.dataset.memberRegistrationFieldPanelBound!=="1"&&(r.dataset.memberRegistrationFieldPanelBound="1",r.addEventListener("change",n=>{n.target.matches(`[data-member-registration-field-line="${t}"]`)&&to(t,aT(r,t))}))})}const Qu=509,zu=525,dT=526,Yu=527,cT=[Qu,zu,Yu],_n={[Qu]:{linesStorageId:"509-show-account-points-lines",panelHint:"勾选产线在会员账户/菜单中展示积分余额。"},[zu]:{linesStorageId:"525-show-points-dishes-lines",panelHint:"勾选产线在菜单页展示可积分兑换的商品。"},[Yu]:{linesStorageId:"527-points-only-order-lines",panelHint:"勾选产线允许订单仅含积分商品时直接下单兑换。"}},Xu="526-points-dish-position-by-line",Zu=[{value:"top",label:"顶部展示"},{value:"bottom",label:"尾部展示"}],Ju="top",Bt=qe.map(e=>e.id);function Pe(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function uT(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function pT(e){if(!Array.isArray(e))return[];const t=new Set(Bt);return e.filter(r=>typeof r=="string"&&t.has(r))}function mT(e){return e in _n}function ep(e){return Zu.some(t=>t.value===e)}function tp(e){return mT(e)}function gT(e){return e===dT}function rp(e){const{linesStorageId:t}=_n[e],r=pT(A(t,null));return r.length>0?r:uT(e)?(ro(e,Bt),[...Bt]):[]}function ro(e,t){const r=Bt.filter(n=>t.includes(n));_(_n[e].linesStorageId,r)}function fT(e){rp(e).length===0&&ro(e,Bt)}function np(e=Ju){return Object.fromEntries(qe.map(t=>[t.id,e]))}function sp(e){const t=np();for(const r of qe){const n=e[r.id];t[r.id]=ep(String(n??""))?n:Ju}return t}function ip(){const e=A(Xu,{});if(e&&typeof e=="object"&&Object.keys(e).length>0)return sp(e);const t=np();return op(t),t}function op(e){_(Xu,sp(e))}function bT(e,t){const r=new Set(rp(e)),{panelHint:n}=_n[e],s=qe.map(o=>{const a=r.has(o.id);return`
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${q}"
          data-member-points-toggle-field-line="${e}"
          data-member-points-line-id="${Pe(o.id)}"
          ${a?"checked":""}
          ${t?"":"disabled"}
          aria-label="${Pe(o.label)}"
        />
        <span>${Pe(o.label)}</span>
      </label>`}).join("");return`
    <div
      class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-3 ${t?"":"hidden"}"
      data-member-points-toggle-field-panel="${e}"
      ${t?"":'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="适用产线">
        ${s}
      </div>
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${Pe(n)}</p>
    </div>`}function hT(e,t){document.querySelectorAll(`[data-member-points-toggle-field-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true"),r.querySelectorAll(`[data-member-points-toggle-field-line="${e}"]`).forEach(n=>{n.disabled=!t})})}function vT(){const e=ip();return`
    <div data-member-points-dish-position-editor class="space-y-2">
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        各产线独立配置积分菜在菜单中的展示位置；须对应产线已开启「菜单页面展示积分菜」。
      </p>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[6.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">展示位置（单选）</th>
            </tr>
          </thead>
          <tbody>${qe.map(r=>{const n=`member-points-dish-position-${r.id}`,s=Zu.map(i=>{const o=e[r.id]===i.value;return`
        <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${Pe(n)}"
            value="${Pe(i.value)}"
            class="${q}"
            ${o?"checked":""}
            data-member-points-dish-position-line="${Pe(r.id)}"
            aria-label="${Pe(r.label)} ${Pe(i.label)}"
          />
          <span>${Pe(i.label)}</span>
        </label>`}).join("");return`
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${Pe(r.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="radiogroup" aria-label="${Pe(r.label)} 积分菜展示位置">${s}</div>
      </td>
    </tr>`}).join("")}</tbody>
        </table>
      </div>
    </div>`}function yT(e,t){const r=[];return e.querySelectorAll(`[data-member-points-toggle-field-line="${t}"]:checked`).forEach(n=>{const s=n.getAttribute("data-member-points-line-id");s&&Bt.includes(s)&&r.push(s)}),r}function xT(e){const t=ip();return e.querySelectorAll("[data-member-points-dish-position-line]").forEach(r=>{if(!r.checked)return;const n=r.getAttribute("data-member-points-dish-position-line"),s=r.value;!n||!ep(s)||(t[n]=s)}),t}function ST(e=document){for(const t of cT)e.querySelectorAll(`[data-member-points-toggle-field-panel="${t}"]`).forEach(r=>{r.dataset.memberPointsToggleFieldPanelBound!=="1"&&(r.dataset.memberPointsToggleFieldPanelBound="1",r.addEventListener("change",n=>{n.target.matches(`[data-member-points-toggle-field-line="${t}"]`)&&ro(t,yT(r,t))}))});e.querySelectorAll("[data-member-points-dish-position-editor]").forEach(t=>{t.dataset.memberPointsDishPositionEditorBound!=="1"&&(t.dataset.memberPointsDishPositionEditorBound="1",t.addEventListener("change",r=>{r.target.matches("[data-member-points-dish-position-line]")&&op(xT(t))}))})}const TT=487,ap="487-order-type-by-line",lp=[{id:"kiosk",label:"Kiosk"},{id:"emenu",label:"eMenu"},{id:"paypad",label:"PayPad"},{id:"online-order",label:"Online Order"},{id:"scan-order",label:"扫码点单"}],ks=[{id:"dine-in",label:"堂吃"},{id:"to-go",label:"外带"},{id:"pick-up",label:"来取"}],dp=ks.map(e=>e.id),_s=lp.map(e=>e.id);function Wt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function cp(){return{byLine:{kiosk:["dine-in","to-go","pick-up"],emenu:["dine-in","to-go","pick-up"],paypad:["dine-in","to-go","pick-up"],"online-order":["to-go","pick-up"],"scan-order":["dine-in","to-go","pick-up"]}}}function up(e){if(!Array.isArray(e))return[];const t=new Set,r=[];for(const n of e){if(typeof n!="string"||!dp.includes(n))continue;const s=n;t.has(s)||(t.add(s),r.push(s))}return r}function pp(e){const t=cp();if(!e||typeof e!="object")return t;const r=e.byLine;if(!r||typeof r!="object")return t;const n={...t.byLine};for(const s of _s)n[s]=up(r[s]);return{byLine:n}}function ET(e){return e===TT}function $T(){return pp(A(ap,cp()))}function wT(e){_(ap,pp(e))}function kT(e,t,r){return(e.byLine[t]??[]).includes(r)}function _T(){const e=$T(),t=ks.map(n=>`<th scope="col" class="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">${Wt(n.label)}</th>`).join(""),r=lp.map(n=>{const s=ks.map(i=>{const o=kT(e,n.id,i.id);return`
        <td class="border-t border-border px-2 py-2 text-center align-middle">
          <input
            type="checkbox"
            class="${q} rounded-sm"
            ${o?"checked":""}
            data-order-type-line="${Wt(n.id)}"
            data-order-type-id="${Wt(i.id)}"
          />
        </td>`}).join("");return`
      <tr data-order-type-row="${Wt(n.id)}">
        <th scope="row" class="border-t border-border px-3 py-2 text-left text-sm font-medium text-foreground whitespace-nowrap">${Wt(n.label)}</th>
        ${s}
      </tr>`}).join("");return`
    <div class="space-y-2" data-order-type-by-line-editor>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[34rem] border-collapse">
          <thead class="bg-muted/40">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">产线 \\ 订单类型</th>
              ${t}
            </tr>
          </thead>
          <tbody>${r}</tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground">可按产线独立设置可用订单类型（堂吃/外带/来取）。</p>
    </div>`}function PT(){document.querySelectorAll("[data-order-type-by-line-editor]").forEach(e=>{if(e.dataset.orderTypeByLineBound==="1")return;e.dataset.orderTypeByLineBound="1";const t=()=>{const r={kiosk:[],emenu:[],paypad:[],"online-order":[],"scan-order":[]};e.querySelectorAll("[data-order-type-line][data-order-type-id]:checked").forEach(n=>{const s=n.getAttribute("data-order-type-line"),i=n.getAttribute("data-order-type-id");!s||!i||!_s.includes(s)||!dp.includes(i)||r[s].push(i)});for(const n of _s)r[n]=up(r[n]);wT({byLine:r})};e.addEventListener("change",r=>{r.target.closest("[data-order-type-line][data-order-type-id]")&&t()})})}const NT=147,mp="147-order-total-rounding-mode",IT="module-setting-radio-147-order-total-rounding",gp=[{value:"default",label:"Default"},{value:"none",label:"No Rounding"},{value:"down-5c",label:"Rounding down to nearest 5 cents"},{value:"down-10c",label:"Rounding down to nearest 10 cents"},{value:"nearest-5-10c",label:"Round down or Round up to nearest 5 or 10cents"}];function DT(e){return gp.some(t=>t.value===e)}function AT(){const e=H(mp,"down-10c");return DT(e)?e:"down-10c"}function qT(e){return e===NT}function LT(){return tt({options:gp,fieldId:mp,groupName:IT,currentValue:AT(),layout:"vertical",ariaLabel:"总价四舍五入方式"})}const CT=156,MT=[{code:"food-allergy",label:"Food Allergy"},{code:"foreign-objects",label:"Foreign Objects in Food"},{code:"servers-mistake",label:"Servers Mistake"},{code:"waited-too-long",label:"Waited Too Long"},{code:"undercooked",label:"Food is Undercooked"},{code:"improperly-prepared",label:"Improperly Prepared"},{code:"not-as-described",label:"Orders Arriving Not as Described"}],RT="size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";function Wn(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function OT(e){return e===CT}function KT(e,t){return`${e}-void-reason-${t}`}function BT(e){const t=MT.map(r=>{const n=KT(e,r.code),s=le(n,!0);return`
      <label
        class="flex min-h-[4.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-3 text-sm text-foreground"
      >
        <input
          type="checkbox"
          class="${RT} rounded-sm"
          ${s?"checked":""}
          data-module-setting-checkbox="${Wn(n)}"
          aria-label="${Wn(r.label)}"
        />
        <span class="text-center text-xs leading-snug sm:text-sm">${Wn(r.label)}</span>
      </label>`}).join("");return`
    <div
      class="grid grid-cols-2 gap-2 sm:grid-cols-4"
      data-order-void-invalidation-reasons="${e}"
      role="group"
      aria-label="订单失效原因多选"
    >
      ${t}
    </div>`}const HT=417,FT="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",GT="text-xs font-semibold uppercase tracking-wide text-muted-foreground",fp=[{title:"门店标识",fields:[{fieldId:"417-restaurant-name",label:"餐馆名",placeholder:"Restaurant name"},{fieldId:"417-store-no",label:"门店编号",placeholder:"Store #"}]},{title:"联系信息",fields:[{fieldId:"417-phone-1",label:"电话1",inputType:"tel",placeholder:"Phone 1"},{fieldId:"417-phone-2",label:"电话2",inputType:"tel",placeholder:"Phone 2"},{fieldId:"417-fax",label:"传真",inputType:"tel",placeholder:"Fax"},{fieldId:"417-website",label:"网站",inputType:"url",placeholder:"https://"},{fieldId:"417-email",label:"邮箱地址",inputType:"email",placeholder:"Email"}]},{title:"地址",fields:[{fieldId:"417-address-line-1",label:"地址栏1",placeholder:"Address line 1"},{fieldId:"417-address-line-2",label:"地址栏2",placeholder:"Address line 2"},{fieldId:"417-city",label:"城市",placeholder:"City"},{fieldId:"417-zip",label:"邮编",placeholder:"ZIP / Postal code"},{fieldId:"417-region",label:"地区",placeholder:"Region / State / Province"}]},{title:"商户与证书",fields:[{fieldId:"417-merchant-group-no",label:"商家组编号",placeholder:"Merchant group #"},{fieldId:"417-merchant-code",label:"商家代号",placeholder:"Merchant code"},{fieldId:"417-merchant-no",label:"商户编号",placeholder:"Merchant #"},{fieldId:"417-dealer",label:"经销商",placeholder:"Dealer"},{fieldId:"417-version-cert",label:"版本证书信息",placeholder:"Version / certificate info"}]}];fp.flatMap(e=>e.fields);function lt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function UT(e){return e===HT}function jT(e){const t=Ge(e.fieldId,"");return`
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-foreground">${lt(e.label)}</label>
      <input
        type="${lt(e.inputType??"text")}"
        class="${FT}"
        value="${lt(t)}"
        data-module-setting-text="${lt(e.fieldId)}"
        aria-label="${lt(e.label)}"
        placeholder="${lt(e.placeholder??"")}"
      />
    </div>`}function VT(e,t){const r=t>0?"border-t border-border pt-5":"",n=e.fields.map(jT).join("");return`
    <section class="space-y-3 ${r}" data-store-basic-info-section="${lt(e.title)}">
      <h4 class="${GT}">${lt(e.title)}</h4>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        ${n}
      </div>
    </section>`}function WT(){return`
    <div class="mt-3 space-y-5" data-store-basic-info-form>
      ${fp.map(VT).join("")}
    </div>`}const QT="548-brand-menus";function zT(){return`menu-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}function Ar(e){return{id:e.id??zT(),name:e.name??"未命名菜单",channelLabel:e.channelLabel}}function YT(e){const t=new Set,r=[];for(const n of e)t.has(n.id)||(t.add(n.id),r.push(n));return r}function XT(){return[Ar({id:"menu-dine-in",name:"堂食标准菜单",channelLabel:"堂食 · POS / eMenu"}),Ar({id:"menu-delivery",name:"外卖菜单",channelLabel:"外卖 / 来取"}),Ar({id:"menu-breakfast",name:"早餐菜单",channelLabel:"限时 · 06:00–10:30"})]}function no(){const e=A(QT,[]);return!Array.isArray(e)||e.length===0?XT():YT(e.filter(t=>(t==null?void 0:t.id)&&(t==null?void 0:t.name)).map(t=>Ar(t)))}function ZT(e){return e.channelLabel??"品牌菜单"}const JT=418,bp="418-business-hour-schedules",eE=["418-business-hours","417-business-hours"],so=[{day:"mon",label:"周一"},{day:"tue",label:"周二"},{day:"wed",label:"周三"},{day:"thu",label:"周四"},{day:"fri",label:"周五"},{day:"sat",label:"周六"},{day:"sun",label:"周日"}],Qt="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",tE="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",rE="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",nE="inline-flex shrink-0 items-center text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",sE="text-xs font-semibold uppercase tracking-wide text-muted-foreground",iE="text-xs font-medium text-muted-foreground",ot="block text-sm font-medium text-foreground";function At(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function qr(){return`bh-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}function oE(e){return so.some(t=>t.day===e)}function Wr(e,t){return oE(e)?e:t}function Pn(){const e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}`}function Ps(e){return!!e&&/^\d{4}-\d{2}$/.test(e)}function Sr(e){return e?Ps(e)?e:/^\d{4}-\d{2}-\d{2}$/.test(e)?e.slice(0,7):"":""}function Lr(e){const t=e;let r=Sr(e.fromMonth)||Sr(t.fromDate),n=Sr(e.toMonth)||Sr(t.toDate);return r||(r=Pn()),n||(n=r),{id:e.id,name:e.name,openTime:e.openTime||"09:00",closeTime:e.closeTime||"22:00",fromMonth:r,toMonth:n,fromDay:Wr(e.fromDay,"mon"),toDay:Wr(e.toDay,"fri")}}function Qn(e){var t;return((t=so.find(r=>r.day===e))==null?void 0:t.label)??e}function aE(){for(const e of eE){const t=Ge(e,"").trim();if(t)return t}return""}function lE(){const e=Pn();return aE()?[Lr({id:qr(),name:"默认营业时间",openTime:"09:00",closeTime:"22:00",fromMonth:e,toMonth:e,fromDay:"mon",toDay:"sun"})]:[Lr({id:qr(),name:"平日营业",openTime:"11:00",closeTime:"22:00",fromMonth:e,toMonth:e,fromDay:"mon",toDay:"fri"}),Lr({id:qr(),name:"周末营业",openTime:"10:00",closeTime:"23:00",fromMonth:e,toMonth:e,fromDay:"sat",toDay:"sun"})]}function _t(){const e=A(bp,[]);return!Array.isArray(e)||e.length===0?lE():e.filter(t=>(t==null?void 0:t.id)&&(t==null?void 0:t.name)).map(t=>Lr(t))}function hp(e){_(bp,e)}function dE(e,t){return e===t?e:`${e} 至 ${t}`}function cE(e,t){return e===t?Qn(e):`${Qn(e)}至${Qn(t)}`}function vp(e){return`${dE(e.fromMonth,e.toMonth)} · ${cE(e.fromDay,e.toDay)} · ${e.openTime}–${e.closeTime}`}function ha(e,t,r){return Kg({options:so.map(n=>({value:n.day,label:n.label})),groupName:t,currentValue:e,radioDataAttr:r})}function uE(e){return`
    <li
      class="flex flex-col gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
      data-business-hour-schedule
      data-schedule-id="${At(e.id)}"
    >
      <div class="min-w-0">
        <p class="text-sm font-medium text-foreground">${At(e.name)}</p>
        <p class="text-xs text-muted-foreground tabular-nums">${At(vp(e))}</p>
      </div>
      <button
        type="button"
        class="self-start text-sm text-destructive hover:underline sm:self-center"
        data-business-hour-schedule-remove
        aria-label="删除 ${At(e.name)}"
      >删除</button>
    </li>`}function pE(){const e=Pn();return`
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-business-hour-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-hour-dialog-title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40"
        data-business-hour-dialog-backdrop
        aria-label="关闭对话框"
      ></button>
      <div class="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-lg">
        <h3 id="business-hour-dialog-title" class="text-base font-semibold text-card-foreground">新建营业时间</h3>
        <div class="mt-4 space-y-4">
          <div class="space-y-1.5">
            <label class="${ot}" for="business-hour-create-name">名称</label>
            <input
              id="business-hour-create-name"
              type="text"
              class="${Qt}"
              data-business-hour-create-name
              aria-label="名称"
            />
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label class="${ot}" for="business-hour-create-open">从(hh:mm)</label>
              <input
                id="business-hour-create-open"
                type="time"
                class="${Qt} tabular-nums"
                data-business-hour-create-open
                value="11:00"
                aria-label="从(hh:mm)"
              />
            </div>
            <div class="space-y-1.5">
              <label class="${ot}" for="business-hour-create-close">到(hh:mm)</label>
              <input
                id="business-hour-create-close"
                type="time"
                class="${Qt} tabular-nums"
                data-business-hour-create-close
                value="22:00"
                aria-label="到(hh:mm)"
              />
            </div>
          </div>
          <fieldset class="space-y-4 rounded-md border border-border p-3">
            <legend class="${ot} px-1">生效范围</legend>
            <div class="space-y-3">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <label class="${ot}" for="business-hour-create-from-month">开始年月</label>
                  <input
                    id="business-hour-create-from-month"
                    type="month"
                    class="${Qt} tabular-nums"
                    data-business-hour-create-from-month
                    value="${At(e)}"
                    aria-label="开始年月"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="${ot}" for="business-hour-create-to-month">结束年月</label>
                  <input
                    id="business-hour-create-to-month"
                    type="month"
                    class="${Qt} tabular-nums"
                    data-business-hour-create-to-month
                    value="${At(e)}"
                    aria-label="结束年月"
                  />
                </div>
              </div>
            </div>
            <div class="space-y-3 border-t border-border pt-3">
              <p class="${iE}">星期</p>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                  <span class="${ot}">从周几</span>
                  ${ha("mon","business-hour-create-from-day","data-business-hour-create-from-day")}
                </div>
                <div class="space-y-2">
                  <span class="${ot}">到周几</span>
                  ${ha("fri","business-hour-create-to-day","data-business-hour-create-to-day")}
                </div>
              </div>
            </div>
          </fieldset>
        </div>
        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" class="${rE}" data-business-hour-create-cancel>取消</button>
          <button type="button" class="${tE}" data-business-hour-create-save>保存</button>
        </div>
      </div>
    </div>`}function mE(e){const t=e.length>0?`<ul class="space-y-2" data-business-hour-schedule-list>${e.map(uE).join("")}</ul>`:'<p class="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground" data-business-hour-empty>暂无营业时间，请点击「新建营业时间」</p>';return`
    <section class="space-y-3" data-business-hour-schedules-section>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h4 class="${sE}">营业时间</h4>
        <button type="button" class="${nE}" data-business-hour-create-toggle>+ 新建营业时间</button>
      </div>
      ${t}
    </section>`}function yp(e){return mE(e)}function gE(e){return e===JT}function fE(){const e=_t();return`
    <div class="mt-3 space-y-5" data-store-business-hours-panel>
      <div data-store-business-hours-body>${yp(e)}</div>
      ${pE()}
    </div>`}function xp(e){const t=e.querySelector("[data-store-business-hours-body]");t&&(t.innerHTML=yp(_t()))}function bE(e){const t=Pn(),r=e.querySelector("[data-business-hour-create-name]"),n=e.querySelector("[data-business-hour-create-open]"),s=e.querySelector("[data-business-hour-create-close]"),i=e.querySelector("[data-business-hour-create-from-month]"),o=e.querySelector("[data-business-hour-create-to-month]");r&&(r.value=""),n&&(n.value="11:00"),s&&(s.value="22:00"),i&&(i.value=t),o&&(o.value=t);const a=e.querySelector('[data-business-hour-create-from-day][value="mon"]'),l=e.querySelector('[data-business-hour-create-to-day][value="fri"]');a&&(a.checked=!0),l&&(l.checked=!0)}function hE(e){var r;const t=e.querySelector("[data-business-hour-dialog]");t&&(bE(e),t.classList.remove("hidden"),t.classList.add("flex"),(r=e.querySelector("[data-business-hour-create-name]"))==null||r.focus())}function Ns(e){const t=e.querySelector("[data-business-hour-dialog]");t&&(t.classList.add("hidden"),t.classList.remove("flex"))}function vE(e){var m,T,k,S,p,f,E,x,P,O;const t=(m=e.querySelector("[data-business-hour-create-name]"))==null?void 0:m.value.trim(),r=((T=e.querySelector("[data-business-hour-create-open]"))==null?void 0:T.value)||"09:00",n=((k=e.querySelector("[data-business-hour-create-close]"))==null?void 0:k.value)||"22:00",s=((S=e.querySelector("[data-business-hour-create-from-month]"))==null?void 0:S.value)??"",i=((p=e.querySelector("[data-business-hour-create-to-month]"))==null?void 0:p.value)??"",o=Wr((f=e.querySelector("[data-business-hour-create-from-day]:checked"))==null?void 0:f.value,"mon"),a=Wr((E=e.querySelector("[data-business-hour-create-to-day]:checked"))==null?void 0:E.value,"fri");if(!t){(x=e.querySelector("[data-business-hour-create-name]"))==null||x.focus();return}if(!Ps(s)||!Ps(i)){(P=e.querySelector("[data-business-hour-create-from-month]"))==null||P.focus();return}if(s>i){(O=e.querySelector("[data-business-hour-create-to-month]"))==null||O.focus();return}const l={id:qr(),name:t,openTime:r,closeTime:n,fromMonth:s,toMonth:i,fromDay:o,toDay:a},u=_t();u.push(l),hp(u),Ns(e),xp(e)}function yE(e,t){hp(_t().filter(r=>r.id!==t)),xp(e)}function xE(){document.querySelectorAll("[data-store-business-hours-panel]").forEach(e=>{e.dataset.storeBusinessHoursBound!=="1"&&(e.dataset.storeBusinessHoursBound="1",e.addEventListener("click",t=>{const r=t.target;if(r.closest("[data-business-hour-create-toggle]")){hE(e);return}if(r.closest("[data-business-hour-create-cancel]")||r.closest("[data-business-hour-dialog-backdrop]")){Ns(e);return}if(r.closest("[data-business-hour-create-save]")){vE(e);return}const n=r.closest("[data-business-hour-schedule-remove]");if(n){const s=n.closest("[data-business-hour-schedule]"),i=s==null?void 0:s.getAttribute("data-schedule-id");i&&yE(e,i)}}),e.addEventListener("keydown",t=>{if(t.key!=="Escape")return;const r=e.querySelector("[data-business-hour-dialog]");r&&!r.classList.contains("hidden")&&(t.preventDefault(),Ns(e))}))})}const SE=547,Sp="547-store-brands",TE="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",Tp="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90",EE="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted",$E="text-sm font-medium text-primary hover:underline";function oe(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Qr(){return`brand-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}function Nn(e){const t=new Set,r=[];for(const n of e)t.has(n)||(t.add(n),r.push(n));return r}function wE(e){return Array.isArray(e)?Nn(e.filter(t=>typeof t=="string"&&t.length>0)):[]}function kE(e){return Array.isArray(e)?Nn(e.filter(t=>typeof t=="string"&&t.length>0)):[]}function Is(e){const t=wE(e.scheduleIds),r=kE(e.menuIds);return{id:e.id??Qr(),name:e.name??"",imageDataUrl:e.imageDataUrl,scheduleIds:t,menuIds:r}}function _E(){var o,a;const e=_t(),t=no(),r=(o=e[0])==null?void 0:o.id,n=e.slice(0,2).map(l=>l.id),s=(a=t[0])==null?void 0:a.id,i=t.slice(0,2).map(l=>l.id);return[Is({id:Qr(),name:"杨国富麻辣烫",scheduleIds:r?[r]:[],menuIds:s?[s]:[]}),Is({id:Qr(),name:"张亮麻辣烫",scheduleIds:n.length>0?n:r?[r]:[],menuIds:i.length>0?i:s?[s]:[]})]}function In(){const e=A(Sp,[]);return!Array.isArray(e)||e.length===0?_E():e.map(t=>Is(t))}function Ep(e){_(Sp,e)}function PE(e){const t=_t(),r=e.scheduleIds.map(n=>{var s;return(s=t.find(i=>i.id===n))==null?void 0:s.name}).filter(n=>!!n);return r.length>0?Nn(r).join(" / "):"—"}function NE(e){const t=no(),r=e.menuIds.map(n=>{var s;return(s=t.find(i=>i.id===n))==null?void 0:s.name}).filter(n=>!!n);return r.length>0?Nn(r).join(" / "):"—"}function IE(e){return e.imageDataUrl?`<img src="${oe(e.imageDataUrl)}" alt="" class="size-12 rounded border border-border object-cover" />`:'<div class="flex size-12 items-center justify-center rounded border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground">NO IMAGE</div>'}function $p(e){return e.length===0?'<p class="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">暂无品牌，请点击「新增品牌」</p>':`
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">品牌名称</th>
            <th class="px-3 py-2 font-medium">品牌图片</th>
            <th class="px-3 py-2 font-medium">品牌营业时间</th>
            <th class="px-3 py-2 font-medium">品牌菜单</th>
            <th class="px-3 py-2 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>${e.map(r=>`
      <tr class="border-t border-border" data-brand-row data-brand-id="${oe(r.id)}">
        <td class="py-3 pr-3 text-sm text-foreground">${oe(r.name)}</td>
        <td class="py-3 pr-3">${IE(r)}</td>
        <td class="py-3 pr-3 text-sm text-muted-foreground">${oe(PE(r))}</td>
        <td class="py-3 pr-3 text-sm text-muted-foreground">${oe(NE(r))}</td>
        <td class="py-3 text-right text-sm whitespace-nowrap">
          <button type="button" class="${$E} mr-3" data-brand-edit data-brand-id="${oe(r.id)}">编辑</button>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-brand-delete data-brand-id="${oe(r.id)}">删除</button>
        </td>
      </tr>`).join("")}</tbody>
      </table>
    </div>`}function DE(e,t){const r=t.includes(e.id);return`
    <label
      class="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
      data-brand-schedule-option
    >
      <input
        type="checkbox"
        class="mt-0.5 size-4 shrink-0 accent-primary"
        data-brand-schedule-id
        value="${oe(e.id)}"
        ${r?"checked":""}
      />
      <span class="min-w-0">
        <span class="block text-sm font-medium text-foreground">${oe(e.name)}</span>
        <span class="block text-xs tabular-nums text-muted-foreground">${oe(vp(e))}</span>
      </span>
    </label>`}function AE(e){const t=_t();return t.length===0?`
      <div class="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
        暂无可用营业时间，请先在「营业与运营 → 营业时段」中新建营业时间规则。
      </div>`:`
    <div class="space-y-2" data-brand-schedule-picker>
      ${t.map(r=>DE(r,e)).join("")}
    </div>`}function qE(e,t){const r=t.includes(e.id);return`
    <label
      class="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
      data-brand-menu-option
    >
      <input
        type="checkbox"
        class="mt-0.5 size-4 shrink-0 accent-primary"
        data-brand-menu-id
        value="${oe(e.id)}"
        ${r?"checked":""}
      />
      <span class="min-w-0">
        <span class="block text-sm font-medium text-foreground">${oe(e.name)}</span>
        <span class="block text-xs text-muted-foreground">${oe(ZT(e))}</span>
      </span>
    </label>`}function LE(e){const t=no();return t.length===0?`
      <div class="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
        暂无可用品牌菜单，请先在「商品中心 → 品牌菜单」中创建菜单。
      </div>`:`
    <div class="space-y-2" data-brand-menu-picker>
      ${t.map(r=>qE(r,e)).join("")}
    </div>`}function wp(e,t){const r=t?e.find(l=>l.id===t):null,n=r?"编辑品牌":"新增品牌",s=(r==null?void 0:r.name)??"",i=r!=null&&r.imageDataUrl?`<img src="${oe(r.imageDataUrl)}" alt="" class="mx-auto max-h-24 rounded border border-border object-contain" data-brand-image-preview />`:'<div class="mx-auto flex h-24 w-24 items-center justify-center rounded border border-dashed border-border bg-muted/30 text-xs text-muted-foreground" data-brand-image-preview>NO IMAGES</div>',o=(r==null?void 0:r.scheduleIds)??[],a=(r==null?void 0:r.menuIds)??[];return`
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-brand-dialog
      data-editing-id="${oe(t??"")}"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-brand-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-lg">
        <div class="flex items-start justify-between gap-3">
          <h3 id="brand-dialog-title" class="text-base font-semibold text-card-foreground">${n}</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-brand-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="mt-4 space-y-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground" for="brand-create-name">品牌名称</label>
            <input id="brand-create-name" type="text" maxlength="50" class="${TE}" data-brand-name value="${oe(s)}" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground">品牌图片</label>
            <p class="text-xs text-muted-foreground">支持 PNG、JPG、JPEG；比例 1:1，建议 500×500，1MB 以内</p>
            <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              ${i}
              <input type="file" accept="image/png,image/jpeg,image/jpg" class="text-sm text-foreground" data-brand-image-input />
            </div>
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">品牌营业时间</p>
            <p class="text-xs text-muted-foreground">从已创建的营业时间规则中选择（可多选）</p>
            ${AE(o)}
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">品牌菜单</p>
            <p class="text-xs text-muted-foreground">从已创建的品牌菜单中选择（可多选）</p>
            ${LE(a)}
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="${EE}" data-brand-dialog-cancel>取消</button>
          <button type="button" class="${Tp}" data-brand-dialog-save>确定</button>
        </div>
      </div>
    </div>`}function CE(e){return e===SE}function ME(){const e=In();return`
    <div class="mt-3 space-y-3" data-store-brand-management>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-muted-foreground">配置本店启用的品牌；品牌主数据见「品牌管理」hub，此处为 Location 级启用、营业时间与菜单绑定。</p>
        <button type="button" class="${Tp}" data-brand-create>新增品牌</button>
      </div>
      <div data-brand-table-wrap>${$p(e)}</div>
      ${wp(e,null)}
    </div>`}function io(e,t=null){const r=In(),n=e.querySelector("[data-brand-table-wrap]");n&&(n.innerHTML=$p(r));const s=e.querySelector("[data-brand-dialog]");s==null||s.remove(),e.insertAdjacentHTML("beforeend",wp(r,t))}function va(e,t){var n;io(e,t);const r=e.querySelector("[data-brand-dialog]");r==null||r.classList.remove("hidden"),r==null||r.classList.add("flex"),(n=r==null?void 0:r.querySelector("[data-brand-name]"))==null||n.focus()}function Ds(e){const t=e.querySelector("[data-brand-dialog]");t&&(t.classList.add("hidden"),t.classList.remove("flex"),t.setAttribute("data-editing-id",""))}function RE(e){return[...e.querySelectorAll("[data-brand-schedule-id]:checked")].map(t=>t.value)}function OE(e){return[...e.querySelectorAll("[data-brand-menu-id]:checked")].map(t=>t.value)}function KE(e){var u,m;const t=e.querySelector("[data-brand-dialog]");if(!t)return;const r=((u=t.querySelector("[data-brand-name]"))==null?void 0:u.value.trim())??"";if(!r){(m=t.querySelector("[data-brand-name]"))==null||m.focus();return}const n=t.getAttribute("data-editing-id")||"",s=t.querySelector("[data-brand-image-preview]"),i=(s==null?void 0:s.tagName)==="IMG"?s.src:void 0,o=RE(t),a=OE(t),l=In();if(n){const T=l.findIndex(k=>k.id===n);T>=0&&(l[T]={...l[T],name:r,imageDataUrl:i,scheduleIds:o,menuIds:a})}else l.push({id:Qr(),name:r,imageDataUrl:i,scheduleIds:o,menuIds:a});Ep(l),Ds(e),io(e,null)}function BE(e,t){Ep(In().filter(r=>r.id!==t)),io(e,null)}function HE(){document.querySelectorAll("[data-store-brand-management]").forEach(e=>{e.dataset.storeBrandBound!=="1"&&(e.dataset.storeBrandBound="1",e.addEventListener("click",t=>{const r=t.target;if(r.closest("[data-brand-create]")){va(e,null);return}const n=r.closest("[data-brand-edit]");if(n){va(e,n.getAttribute("data-brand-id"));return}const s=r.closest("[data-brand-delete]");if(s){const i=s.getAttribute("data-brand-id");i&&BE(e,i);return}if(r.closest("[data-brand-dialog-cancel]")||r.closest("[data-brand-dialog-close]")||r.closest("[data-brand-dialog-backdrop]")){Ds(e);return}r.closest("[data-brand-dialog-save]")&&KE(e)}),e.addEventListener("change",t=>{var a;const r=t.target;if(!r.matches("[data-brand-image-input]"))return;const n=(a=r.files)==null?void 0:a[0],s=e.querySelector("[data-brand-dialog]"),i=s==null?void 0:s.querySelector("[data-brand-image-preview]");if(!n||!i)return;const o=new FileReader;o.onload=()=>{const l=document.createElement("img");l.src=String(o.result),l.alt="",l.className="mx-auto max-h-24 rounded border border-border object-contain",l.dataset.brandImagePreview="",i.replaceWith(l)},o.readAsDataURL(n)}),e.addEventListener("keydown",t=>{if(t.key!=="Escape")return;const r=e.querySelector("[data-brand-dialog]");r&&!r.classList.contains("hidden")&&(t.preventDefault(),Ds(e))}))})}const FE=173,ya="173-country-region",GE=[{code:"us",label:"United States"},{code:"ca",label:"Canada"}],UE="size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";function zt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function jE(e){return e===FE}function VE(e){const t=H(ya,"us"),r=`module-setting-radio-${e}`,n=GE.map((s,i)=>{const o=t===s.code;return`
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-6 ${i>0?"border-l border-border":""}"
      >
        <input
          type="radio"
          name="${zt(r)}"
          value="${zt(s.code)}"
          class="${UE}"
          ${o?"checked":""}
          data-module-setting-radio="${zt(ya)}"
          aria-label="${zt(s.label)}"
        />
        <span class="text-center leading-tight">${zt(s.label)}</span>
      </label>`}).join("");return`
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-store-country-region-radio="${e}"
      role="radiogroup"
      aria-label="国家-州/省份/地区"
    >
      ${n}
    </div>`}const WE=170,xa="170-restaurant-mode",QE=[{code:"dining",label:"Dining"},{code:"fast-food",label:"Fast Food"}],zE="size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";function Yt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function YE(e){return e===WE}function XE(e){const t=H(xa,"dining"),r=`module-setting-radio-${e}`,n=QE.map((s,i)=>{const o=t===s.code;return`
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-6 ${i>0?"border-l border-border":""}"
      >
        <input
          type="radio"
          name="${Yt(r)}"
          value="${Yt(s.code)}"
          class="${zE}"
          ${o?"checked":""}
          data-module-setting-radio="${Yt(xa)}"
          aria-label="${Yt(s.label)}"
        />
        <span class="text-center leading-tight">${Yt(s.label)}</span>
      </label>`}).join("");return`
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-store-restaurant-mode-radio="${e}"
      role="radiogroup"
      aria-label="餐厅模式选择"
    >
      ${n}
    </div>`}const ZE=[{code:"to-go",label:"To Go"},{code:"pick-up",label:"Pick Up"},{code:"delivery",label:"Delivery"}],JE=39,e$="size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";function zn(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function t$(e){return e===JE}function r$(e,t){return`${e}-order-type-${t}`}function n$(e){const t=ZE.map((r,n)=>{const s=r$(e,r.code),i=le(s,!1);return`
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-4 ${n>0?"border-l border-border":""}"
      >
        <input
          type="checkbox"
          class="${e$} rounded-sm"
          ${i?"checked":""}
          data-module-setting-checkbox="${zn(s)}"
          aria-label="${zn(r.label)}"
        />
        <span class="text-center leading-tight">${zn(r.label)}</span>
      </label>`}).join("");return`
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-packing-slip-order-type-multiselect="${e}"
      role="group"
      aria-label="需要打包单的订单类型"
    >
      ${t}
    </div>`}const oo=654,Dn=500,s$="654-order-receipt-trigger-lines",i$="500-partial-payment-order-receipt-lines",kp=[{id:"pos",label:"POS"},{id:"kiosk",label:"Kiosk"},{id:"emenu",label:"eMenu"},{id:"paypad",label:"PayPad"}],dr=kp.map(e=>e.id),o$="size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";function It(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function _p(e){return e===oo?s$:e===Dn?i$:`${e}-order-receipt-trigger-lines`}function a$(e){if(!Array.isArray(e))return[];const t=new Set(dr);return e.filter(r=>typeof r=="string"&&t.has(r))}function l$(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function d$(e){const t=A(_p(e),null),r=a$(t);return r.length>0?r:e===Dn&&l$(e)?(Pp(e,[...dr]),[...dr]):[]}function Pp(e,t){const r=dr.filter(n=>t.includes(n));_(_p(e),r)}function c$(e){return e===oo}function u$(e){return e===Dn}function Np(e,t,r){const n=new Set(d$(e)),s=kp.map((i,o)=>{const a=n.has(i.id);return`
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-4 ${o>0?"border-l border-border":""}"
      >
        <input
          type="checkbox"
          class="${o$} rounded-sm"
          value="${It(i.id)}"
          data-order-receipt-trigger-line="${It(i.id)}"
          data-order-receipt-trigger-seq="${e}"
          ${a?"checked":""}
          aria-label="${It(i.label)}"
        />
        <span class="text-center leading-tight">${It(i.label)}</span>
      </label>`}).join("");return`
    <div class="flex flex-col items-end gap-2">
      <div
        class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
        data-order-receipt-trigger-by-line="${e}"
        role="group"
        aria-label="${It(t)}"
      >
        ${s}
      </div>
      <p class="max-w-xl text-right text-xs text-muted-foreground">${It(r)}</p>
    </div>`}function p$(){return Np(oo,"下单后自动打印纸质订单收据适用产线","订单提交成功后，在门店绑定的收据打印机出纸；eMenu 等为渠道下单，非平板本地打印。")}function m$(){return Np(Dn,"部分付款后自动打印纸质订单收据适用产线","订单发生部分付款后出纸；输出为订单收据（非支付签购单）。与支付收据流程中的「支付后打印」不同。")}function g$(e){const t=Number(e.getAttribute("data-order-receipt-trigger-by-line")),r=[];return e.querySelectorAll("[data-order-receipt-trigger-line]:checked").forEach(n=>{const s=n.getAttribute("data-order-receipt-trigger-line");s&&dr.includes(s)&&r.push(s)}),t&&Pp(t,r),r}function f$(e=document){e.querySelectorAll("[data-order-receipt-trigger-by-line]").forEach(t=>{t.dataset.orderReceiptTriggerBound!=="1"&&(t.dataset.orderReceiptTriggerBound="1",t.addEventListener("change",r=>{r.target.matches("[data-order-receipt-trigger-line]")&&g$(t)}))})}const ao=332,Ip="332-voice-alert-product-lines",Dp=[{id:"kiosk",label:"Kiosk"},{id:"emenu",label:"eMenu"},{id:"pos",label:"POS"},{id:"pos-go",label:"POS GO"},{id:"paypad",label:"PayPad"},{id:"sdi",label:"SDI"},{id:"online-order",label:"Online Order"}],cr=Dp.map(e=>e.id),b$="size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";function Tr(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function h$(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function v$(e){if(!Array.isArray(e))return[];const t=new Set(cr);return e.filter(r=>typeof r=="string"&&t.has(r))}function y$(){const e=A(Ip,null),t=v$(e);return t.length>0?t:h$(ao)?(Ap([...cr]),[...cr]):[]}function Ap(e){const t=cr.filter(r=>e.includes(r));_(Ip,t)}function x$(e){return e===ao}function S$(){const e=new Set(y$()),t=Dp.map((r,n)=>{const s=e.has(r.id);return`
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${n>0?"border-l border-border":""}"
      >
        <input
          type="checkbox"
          class="${b$} rounded-sm"
          value="${Tr(r.id)}"
          data-voice-alert-product-line="${Tr(r.id)}"
          ${s?"checked":""}
          aria-label="${Tr(r.label)}"
        />
        <span class="text-center leading-tight">${Tr(r.label)}</span>
      </label>`}).join("");return`
    <div
      class="flex w-full max-w-3xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-voice-alert-by-line="${ao}"
      role="group"
      aria-label="语音提醒适用产线"
    >
      ${t}
    </div>`}function T$(e){const t=[];return e.querySelectorAll("[data-voice-alert-product-line]:checked").forEach(r=>{const n=r.getAttribute("data-voice-alert-product-line");n&&cr.includes(n)&&t.push(n)}),Ap(t),t}function E$(e=document){e.querySelectorAll("[data-voice-alert-by-line]").forEach(t=>{t.dataset.voiceAlertBound!=="1"&&(t.dataset.voiceAlertBound="1",t.addEventListener("change",r=>{r.target.matches("[data-voice-alert-product-line]")&&T$(t)}))})}const $$=331,w$=[{code:"announcement",label:"Announcement"},{code:"online-order",label:"Online Order"},{code:"reservation",label:"Reservation"},{code:"alipay-wechat-pay",label:"Alipay/Wechat Pay"},{code:"service-request",label:"Service Request"},{code:"cravee-order",label:"Cravee Order"},{code:"kiosk",label:"Kiosk"},{code:"emenu",label:"Emenu"},{code:"self-dine-in",label:"Self Dine In"},{code:"printer",label:"Printer"},{code:"expiration-management",label:"Expiration Management"},{code:"system",label:"System"}];function Yn(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function k$(e){return e===$$}function _$(e,t){return`${e}-notification-topic-${t}`}function P$(e){const t=w$.map(r=>{const n=_$(e,r.code),s=le(n,!1);return`
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${q} rounded-sm"
          ${s?"checked":""}
          data-module-setting-checkbox="${Yn(n)}"
          aria-label="${Yn(r.label)}"
        />
        <span>${Yn(r.label)}</span>
      </label>`}).join("");return`
    <div
      class="flex max-w-3xl flex-wrap gap-2"
      data-notification-center-topics-multiselect="${e}"
      role="group"
      aria-label="消息中心的主题"
    >
      ${t}
    </div>`}const N$=291,qp=292,Lp="292-ticket-number-slip-copies",Sa=1,As=1,qs=9,I$="h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",D$=[{code:"paid",label:"Paid"},{code:"receipt-printed",label:"Receipt printed"},{code:"sent-to-kitchen",label:"Sent to kitchen"},{code:"create-new-order",label:"Create New Order"}];function er(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function A$(e){try{return localStorage.getItem(ee(e))==="1"}catch{return!1}}function q$(e){return e===N$}function L$(e){return e===qp}function C$(){let e=F(Lp,Sa);return!Number.isFinite(e)&&A$(qp)&&(e=1),Number.isFinite(e)?Math.min(qs,Math.max(As,Math.round(e))):Sa}function M$(){const e=C$();return`
    <div class="flex flex-col items-end gap-1">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${I$}"
          value="${er(String(e))}"
          min="${As}"
          max="${qs}"
          step="1"
          data-module-setting-number="${er(Lp)}"
          aria-label="单号小票打印份数"
        />
        <span class="text-sm text-muted-foreground">份</span>
      </div>
      <span class="text-xs text-muted-foreground">${As}–${qs} 份</span>
    </div>`}function R$(e,t){return`${e}-ticket-number-slip-trigger-${t}`}function O$(e){const t=D$.map(r=>{const n=R$(e,r.code),s=le(n,!1);return`
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${q} rounded-sm"
          ${s?"checked":""}
          data-module-setting-checkbox="${er(n)}"
          aria-label="${er(r.label)}"
        />
        <span>${er(r.label)}</span>
      </label>`}).join("");return`
    <div
      class="flex max-w-xl flex-wrap gap-2"
      data-ticket-number-slip-trigger-multiselect="${e}"
      role="group"
      aria-label="以下情况打印单号小票"
    >
      ${t}
    </div>`}const Ta="/operations/queue-call/floor-plan",Cp="bplant-floor-plan:v1";function B(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Mp(e){return`${e}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}function Xn(){return{areas:[],activeAreaId:"",selectedTableId:null,tableDialog:null,areaDialog:null}}function K$(e){return{id:Mp("t"),name:`T${e.tables.length+1}`,seats:4,width:80,height:60,rotation:0,shape:"rectangle",category:"standard",x:32+e.tables.length*24,y:32+e.tables.length*16}}function Rp(e){const t=e.tableDialog;if(!t)return null;if(t.mode==="create")return e.dialogDraft??null;const r=Re(e);return(r==null?void 0:r.tables.find(n=>n.id===t.tableId))??null}function J(){try{const e=localStorage.getItem(Cp);if(!e)return Xn();const t=JSON.parse(e);if(!Array.isArray(t==null?void 0:t.areas))return Xn();const r=t.areas;return{areas:r,activeAreaId:r.length>0?t.activeAreaId&&r.some(n=>n.id===t.activeAreaId)?t.activeAreaId:r[0].id:"",selectedTableId:t.selectedTableId??null,tableDialog:t.tableDialog??null,dialogDraft:t.dialogDraft,areaDialog:t.areaDialog??null}}catch{return Xn()}}function Ea(e){localStorage.setItem(Cp,JSON.stringify(e))}function B$(e){return e===Ta||e.startsWith(`${Ta}/`)}function Re(e){return e.areas.length?e.areas.find(t=>t.id===e.activeAreaId)??e.areas[0]??null:null}function H$(e){const t=Re(e);return!t||!e.selectedTableId?null:t.tables.find(r=>r.id===e.selectedTableId)??null}function tr(e){return{...e,areaDialog:null}}function Oe(e){return{...e,tableDialog:null,dialogDraft:void 0}}function $a(e){return tr(Oe(e))}const F$=["A1","A2","A3","A4","B1","B2","B3","C1","C2","VIP1","VIP2","吧台1","包间1"],G$=[1,2,4,6,8,10,12,14],wa=[48,60,64,80,100,120,140],U$=[0,45,90,135,180,270],zr=[{value:"rectangle",label:"Rectangle / 矩形"},{value:"circle",label:"Circle / 圆形"},{value:"oval",label:"Oval / 椭圆"}],ur=[{value:"standard",label:"标准桌"},{value:"booth",label:"卡座"},{value:"bar",label:"吧台"},{value:"private",label:"包间"}],lo="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm",Op="w-[5.75rem] shrink-0 rounded-md border border-input bg-background px-2 py-2 text-sm text-muted-foreground",j$="w-[5.75rem] shrink-0 rounded-md border border-input bg-background px-2 py-2 text-sm text-muted-foreground hover:bg-muted",V$=10060;function W$(e){var t;return((t=zr.find(r=>r.value===e))==null?void 0:t.label)??e}function Q$(e){var t;return((t=ur.find(r=>r.value===e))==null?void 0:t.label)??e}function z$(e){return e==="rectangle"||e==="circle"||e==="oval"}function Y$(e){return e==="standard"||e==="booth"||e==="bar"||e==="private"}function X$(e){const t=e.trim().toLowerCase();return t?t.includes("rect")||t.includes("矩")?"rectangle":t.includes("circle")||t.includes("圆")?"circle":t.includes("oval")||t.includes("椭")?"oval":z$(t)?t:null:null}function Z$(e){const t=e.trim();if(!t)return null;const r=ur.find(n=>n.label===t||n.value===t);return r?r.value:t.includes("卡座")?"booth":t.includes("吧台")?"bar":t.includes("包间")?"private":t.includes("标准")?"standard":Y$(t)?t:null}function J$(e){const t=new Set(F$);for(const r of e.areas)for(const n of r.tables)n.name.trim()&&t.add(n.name.trim());return[...t].sort((r,n)=>r.localeCompare(n,"zh"))}function ew(e,t){return`<option value="">选择</option>${[...new Set([...t,e])].sort((s,i)=>s-i).map(s=>`<option value="${s}"${s===e?" selected":""}>${s}</option>`).join("")}`}function tw(e,t){const r=[...new Set([...t,e].filter(Boolean))].sort((o,a)=>o.localeCompare(a,"zh")),n=r.map(o=>`<option value="${B(o)}"${o===e?" selected":""}>${B(o)}</option>`).join(""),s=r.includes(e);return`<option value="">选择</option>${e&&!s?`<option value="${B(e)}" selected>${B(e)}</option>`:""}${n}`}function ka(e,t,r,n,s){return`
    <label class="block space-y-1">
      <span class="text-xs text-muted-foreground">${B(e)}</span>
      <div class="flex gap-2">
        <input
          data-floor-plan-field="${t}"
          type="text"
          class="${lo}"
          value="${B(r)}"
          list="${n}"
          autocomplete="off"
          placeholder="可输入或点击选择"
        />
        <datalist id="${n}">${s}</datalist>
        <button
          type="button"
          class="${j$}"
          data-floor-plan-preset-trigger="${t}"
          aria-haspopup="listbox"
          aria-expanded="false"
          title="快捷选择"
        >选择</button>
      </div>
    </label>`}function Er(e,t,r,n,s,i=""){return`
    <label class="block space-y-1">
      <span class="text-xs text-muted-foreground">${B(e)}</span>
      <div class="flex gap-2">
        <input
          data-floor-plan-field="${t}"
          type="number"
          class="${lo}"
          value="${r}"
          ${i}
          
        />
        <select data-floor-plan-preset="${t}" class="${Op}" title="快捷选择" >
          ${ew(r,n)}
        </select>
      </div>
    </label>`}function rw(e,t,r,n,s,i=""){const a=`floor-plan-${t}-datalist`,l=n.map(u=>`<option value="${B(u)}"></option>`).join("");return`
    <label class="block space-y-1">
      <span class="text-xs text-muted-foreground">${B(e)}</span>
      <div class="flex gap-2">
        <input
          data-floor-plan-field="${t}"
          type="text"
          class="${lo}"
          value="${B(r)}"
          list="${a}"
          autocomplete="off"
          ${i}
          
        />
        <datalist id="${a}">${l}</datalist>
        <select data-floor-plan-preset="${t}" class="${Op} max-w-[7.5rem]" title="快捷选择" >
          ${tw(r,n)}
        </select>
      </div>
    </label>`}function nw(e,t){const r=t?"z-20 border-primary bg-primary/20 ring-2 ring-primary shadow-md":"z-10 border-border bg-card/90 hover:border-primary/60 hover:shadow",n=e.shape==="circle"?"rounded-full":e.shape==="oval"?"rounded-[999px]":"rounded-md";return`<button
    type="button"
    class="floor-plan-table absolute flex items-center justify-center border text-xs font-medium shadow-sm transition-[box-shadow,background-color,border-color] ${r} ${n}"
    data-floor-plan-table-id="${B(e.id)}"
    data-floor-plan-selected="${t?"true":"false"}"
    aria-pressed="${t?"true":"false"}"
    style="left:${e.x}px;top:${e.y}px;width:${e.width}px;height:${e.height}px;transform:rotate(${e.rotation}deg)"
    title="${B(e.name)} · ${e.seats}人"
  >${B(e.name)}</button>`}function sw(e,t){const r=e.name,n=e.seats,s=e.width,i=e.height,o=e.rotation,a=e.shape,l=e.category,u=J$(t);return`
    <fieldset class="space-y-3" data-floor-plan-form>
      <p class="text-xs text-muted-foreground">各字段左侧可输入，右侧下拉可快捷选择</p>
      ${rw("名称","name",r,u,!1,'placeholder="如 A1、包间1"')}
      ${Er("人数","seats",n,G$,!1,'min="1" step="1"')}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${Er("宽","width",s,wa,!1,'min="24" step="1"')}
        ${Er("高","height",i,wa,!1,'min="24" step="1"')}
      </div>
      ${Er("旋转(度)","rotation",o,U$,!1,'step="1"')}
      ${ka("类型","shape",W$(a),"floor-plan-shape-datalist",zr.map(m=>`<option value="${B(m.label)}"></option>`).join(""))}
      ${ka("桌子类别","category",Q$(l),"floor-plan-category-datalist",ur.map(m=>`<option value="${B(m.label)}"></option>`).join(""))}
    </fieldset>`}function iw(e){if(!e.areaDialog)return"";const t=e.areaDialog,r=t.mode==="create",n=t.mode==="edit"?e.areas.find(o=>o.id===t.areaId):null,s=r?"新增区域":`编辑区域 · ${(n==null?void 0:n.name)??""}`,i=r?"":(n==null?void 0:n.name)??"";return`
    <div
      class="fixed inset-0 z-[10050] flex items-center justify-center overflow-y-auto p-4"
      data-floor-plan-area-dialog-overlay
      role="presentation"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/50"
        data-floor-plan-area-dialog-close
        aria-label="关闭"
      ></button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="floor-plan-area-dialog-title"
        class="relative z-10 my-auto w-full max-w-md overflow-visible rounded-xl border border-border bg-card shadow-xl"
        data-floor-plan-area-dialog
      >
        <header class="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 id="floor-plan-area-dialog-title" class="text-base font-semibold text-foreground">${B(s)}</h2>
          <button
            type="button"
            class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            data-floor-plan-area-dialog-close
            aria-label="关闭"
          >×</button>
        </header>
        <div class="px-5 py-4">
          <label class="block space-y-1">
            <span class="text-xs text-muted-foreground">区域名称</span>
            <input
              data-floor-plan-area-name
              type="text"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value="${B(i)}"
              placeholder="如 Floor 1、大厅、KTV"
              autocomplete="off"
            />
          </label>
        </div>
        <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div class="shrink-0">
            ${r?"":`<button
              type="button"
              class="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
              data-floor-plan-area-dialog-delete
            >删除区域</button>`}
          </div>
          <div class="flex shrink-0 items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
              data-floor-plan-area-dialog-cancel
            >取消</button>
            <button
              type="button"
              class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              data-floor-plan-area-dialog-save
            >保存</button>
          </div>
        </footer>
      </div>
    </div>`}function ow(e){return{...Oe(e),selectedTableId:null,areaDialog:{mode:"create"}}}function aw(e,t){return{...Oe(e),selectedTableId:null,areaDialog:{mode:"edit",areaId:t}}}function lw(){const e=document.querySelector("[data-floor-plan-area-name]");return(e==null?void 0:e.value.trim())??""}function dw(e,t){if(!e.areas.length)return`
      <div class="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
        <p class="text-sm text-muted-foreground">请先创建就餐区域，再布置桌位</p>
        <button
          type="button"
          class="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          data-floor-plan-area-add
        >新增区域</button>
      </div>`;const r=H$(e),n=!t||t.tables.length===0?'<p class="text-sm text-muted-foreground">当前区域暂无桌位</p>':`<ul class="max-h-48 space-y-1 overflow-y-auto" role="list">
          ${t.tables.map(i=>`<li>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${i.id===e.selectedTableId?"border-primary bg-primary/10 font-medium text-foreground":"border-border hover:bg-muted"}"
                  data-floor-plan-table-pick="${B(i.id)}"
                >
                  <span>${B(i.name)}</span>
                  <span class="text-xs text-muted-foreground">${i.seats}人</span>
                </button>
              </li>`).join("")}
        </ul>`;return`
    <div class="space-y-4">
      <div class="space-y-2">
        <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">当前区域</h3>
        <div class="flex flex-wrap gap-2" role="tablist" aria-label="区域">${e.areas.map(i=>`<button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium ${i.id===e.activeAreaId?"bg-primary text-primary-foreground":"bg-muted text-foreground hover:bg-muted/80"}" data-floor-plan-area-id="${B(i.id)}">${B(i.name)}</button>`).join("")}</div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted" data-floor-plan-area-edit>编辑区域</button>
          <button type="button" class="rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10" data-floor-plan-area-delete>删除区域</button>
          <button type="button" class="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted" data-floor-plan-area-add>新增区域</button>
        </div>
      </div>
      <div class="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
        <p class="text-sm text-muted-foreground">在画布点击桌位可编辑；为「${B((t==null?void 0:t.name)??"")}」新增桌位</p>
        <button
          type="button"
          class="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          data-floor-plan-table-add
        >新增桌子</button>
      </div>
      ${r?`<p class="text-xs text-muted-foreground">已选中：<span class="font-medium text-foreground">${B(r.name)}</span>（点击画布或列表可编辑）</p>`:""}
      <div class="space-y-2">
        <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">本区域桌位 (${(t==null?void 0:t.tables.length)??0})</h3>
        ${n}
      </div>
    </div>`}function cw(e){if(!e.tableDialog)return"";const t=Rp(e);if(!t)return"";const r=e.tableDialog.mode==="create",n=r?"新增桌子":`编辑桌子 · ${t.name}`;return`
    <div
      class="fixed inset-0 z-[10050] flex items-center justify-center overflow-y-auto p-4"
      data-floor-plan-dialog-overlay
      role="presentation"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/50"
        data-floor-plan-dialog-close
        aria-label="关闭"
      ></button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="floor-plan-dialog-title"
        class="relative z-10 my-auto flex w-full max-w-xl flex-col overflow-visible rounded-xl border border-border bg-card shadow-xl"
        data-floor-plan-dialog
      >
        <header class="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 id="floor-plan-dialog-title" class="text-base font-semibold text-foreground">${B(n)}</h2>
          <button
            type="button"
            class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            data-floor-plan-dialog-close
            aria-label="关闭"
          >×</button>
        </header>
        <div class="overflow-visible px-5 py-4">
          ${sw(t,e)}
        </div>
        <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div class="shrink-0">
            ${r?"":`<button
              type="button"
              class="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
              data-floor-plan-dialog-delete
            >删除</button>`}
          </div>
          <div class="flex shrink-0 items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
              data-floor-plan-dialog-cancel
            >取消</button>
            <button
              type="button"
              class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              data-floor-plan-dialog-save
            >保存</button>
          </div>
        </footer>
      </div>
    </div>`}function uw(e){const t=Re(e);if(!t)return e;const r=K$(t);return{...tr(Oe(e)),selectedTableId:null,tableDialog:{mode:"create"},dialogDraft:r}}function _a(e,t){return{...e,selectedTableId:t,tableDialog:{mode:"edit",tableId:t},dialogDraft:void 0}}function pw(){const e=J(),t=Re(e),r=e.areas.length>0,n=(t==null?void 0:t.tables.map(i=>nw(i,i.id===e.selectedTableId)).join(""))??"";return`
    <div class="floor-plan-editor flex min-h-[min(72vh,640px)] flex-col gap-4 lg:flex-row" data-floor-plan-root>
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <div
          class="floor-plan-canvas relative min-h-[420px] flex-1 overflow-hidden rounded-xl border border-border bg-sky-100/70 dark:bg-sky-950/40"
          data-floor-plan-canvas
          role="application"
          aria-label="餐位平面图画布"
          data-floor-plan-has-areas="${r?"true":"false"}"
        >
          ${n}
          ${r?n?"":'<p class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">当前区域暂无桌位，请点击右侧「新增桌子」</p>':'<p class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">请先点击右侧「新增区域」创建楼层或分区</p>'}
        </div>
        <button
          type="button"
          class="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          data-floor-plan-save-area
          ${r?"":"disabled"}
        >保存区域图</button>
      </div>
      <aside class="w-full shrink-0 space-y-4 rounded-xl border border-border bg-card p-4 lg:w-80">
        ${dw(e,t)}
        <p class="text-xs text-muted-foreground">拖拽画布上的桌子可调整位置 · seq 428</p>
      </aside>
      ${iw(e)}
      ${cw(e)}
    </div>`}function Pa(){gt(),window.dispatchEvent(new CustomEvent("menusifu:floor-plan-remount"))}const Na="z-20 border-primary bg-primary/20 ring-2 ring-primary shadow-md",Ia="z-10 border-border bg-card/90 hover:border-primary/60 hover:shadow";function mw(e,t){e.querySelectorAll("[data-floor-plan-table-id]").forEach(r=>{const n=r.getAttribute("data-floor-plan-table-id")===t;r.dataset.floorPlanSelected=n?"true":"false",r.setAttribute("aria-pressed",n?"true":"false"),r.classList.remove(...Na.split(" "),...Ia.split(" ")),r.classList.add(...(n?Na:Ia).split(" "))})}function gw(e){const t=document.querySelector("[data-floor-plan-dialog]"),r=i=>{var o;return((o=t==null?void 0:t.querySelector(`[data-floor-plan-field="${i}"]`))==null?void 0:o.value)??""},n=X$(r("shape"))??e.shape,s=Z$(r("category"))??e.category;return{...e,name:r("name").trim()||e.name,seats:Math.max(1,Number(r("seats"))||e.seats),width:Math.max(24,Number(r("width"))||e.width),height:Math.max(24,Number(r("height"))||e.height),rotation:Number(r("rotation"))||0,shape:n,category:s}}let He=null,Fe=null,Da=!1;function gt(){He==null||He.remove(),He=null,Fe==null||Fe.setAttribute("aria-expanded","false"),Fe=null}function fw(e,t){const r=t.getBoundingClientRect(),n=4,s=e.offsetWidth,i=e.offsetHeight,o=8;let a=r.right-s,l=r.bottom+n;a<o&&(a=o),a+s>window.innerWidth-o&&(a=window.innerWidth-s-o),l+i>window.innerHeight-o&&(l=r.top-i-n),l<o&&(l=o),e.style.left=`${Math.round(a)}px`,e.style.top=`${Math.round(l)}px`}function bw(e,t,r){if(Fe===e&&He){gt();return}gt();const n=t==="shape"?zr:ur,s=document.createElement("div");s.className="floor-plan-preset-menu fixed min-w-[10.5rem] max-h-[min(240px,50vh)] overflow-y-auto rounded-lg border border-border bg-card p-1 text-card-foreground shadow-md",s.style.zIndex=String(V$),s.style.backgroundColor="var(--color-card)",s.setAttribute("role","listbox"),s.setAttribute("data-floor-plan-preset-menu",t),s.innerHTML=n.map(i=>`<button
          type="button"
          role="option"
          class="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
          data-floor-plan-preset-pick="${B(i.value)}"
          data-floor-plan-preset-field="${t}"
        >${B(i.label)}</button>`).join(""),s.style.left="-9999px",s.style.top="0",document.body.appendChild(s),He=s,Fe=e,e.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{!He||!Fe||fw(He,Fe)}),s.addEventListener("click",i=>{const o=i.target.closest("[data-floor-plan-preset-pick]");if(!o)return;i.preventDefault(),i.stopPropagation();const a=o.getAttribute("data-floor-plan-preset-field"),l=o.getAttribute("data-floor-plan-preset-pick");if(!a||!l)return;const u=r.querySelector(`[data-floor-plan-field="${a}"]`);if(u){if(a==="shape"){const m=zr.find(T=>T.value===l);m&&(u.value=m.label)}else if(a==="category"){const m=ur.find(T=>T.value===l);m&&(u.value=m.label)}gt()}})}function hw(){Da||(Da=!0,document.addEventListener("pointerdown",e=>{if(!He)return;const t=e.target;He.contains(t)||Fe!=null&&Fe.contains(t)||gt()},!0),window.addEventListener("scroll",()=>{He&&gt()},!0))}function vw(e){hw(),e.querySelectorAll("[data-floor-plan-preset-trigger]").forEach(t=>{t.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation();const n=t.getAttribute("data-floor-plan-preset-trigger");n!=="shape"&&n!=="category"||bw(t,n,e)})}),e.querySelectorAll("[data-floor-plan-preset]").forEach(t=>{t.addEventListener("change",()=>{const r=t.getAttribute("data-floor-plan-preset");if(!r||!t.value)return;const n=e.querySelector(`[data-floor-plan-field="${r}"]`);n&&(n.value=t.value)})}),e.querySelectorAll("[data-floor-plan-field]").forEach(t=>{t.addEventListener("input",()=>{const r=t.getAttribute("data-floor-plan-field");if(!r||r==="shape"||r==="category")return;const n=e.querySelector(`[data-floor-plan-preset="${r}"]`);if(!n)return;const s=t.value.trim(),i=[...n.options].find(o=>o.value===s||o.value===t.value);n.value=(i==null?void 0:i.value)??""})})}function yw(e){var x,P,O,g,N,D,Z,W,ce,ue,ie;const t=document.querySelector("[data-floor-plan-root]");if(!t)return;window.addEventListener("menusifu:floor-plan-remount",e,{once:!0});const r=t.querySelector("[data-floor-plan-dialog]");r&&vw(r);const n=b=>{Ea(b),Pa()},s=()=>{gt();const b=J();n(Oe({...b,selectedTableId:null}))},i=()=>{const b=J(),$=Rp(b);if(!$||!b.tableDialog)return;const y=gw($),I=Re(b);if(!I)return;const G=b.tableDialog.mode==="create"?{...I,tables:[...I.tables,y]}:{...I,tables:I.tables.map(M=>M.id===y.id?y:M)};n(Oe({...b,areas:b.areas.map(M=>M.id===I.id?G:M),selectedTableId:y.id}))},o=5,a=t.querySelector("[data-floor-plan-area-dialog]"),l=()=>{gt(),n(tr(Oe({...J(),selectedTableId:null})))},u=()=>{const b=J();if(!b.areaDialog)return;const $=lw();if(!$){alert("请输入区域名称");return}if(b.areaDialog.mode==="create"){const I={id:Mp("area"),name:$,tables:[]};n(tr({...Oe(b),areas:[...b.areas,I],activeAreaId:I.id,selectedTableId:null}));return}const y=b.areaDialog.areaId;n(tr({...b,areas:b.areas.map(I=>I.id===y?{...I,name:$}:I)}))},m=b=>{var G;const $=J(),y=$.areas.find(M=>M.id===b);if(!y||!window.confirm(`删除区域「${y.name}」及其全部桌位？`))return;const I=$.areas.filter(M=>M.id!==b);n($a({...$,areas:I,activeAreaId:((G=I[0])==null?void 0:G.id)??"",selectedTableId:null}))};(x=t.querySelector("[data-floor-plan-save-area]"))==null||x.addEventListener("click",()=>{const b=Re(J());if(!b){alert("请先新增区域");return}alert(`已保存「${b.name}」区域图（${b.tables.length} 张桌）`)}),t.querySelectorAll("[data-floor-plan-area-add]").forEach(b=>{b.addEventListener("click",()=>n(ow(J())))}),t.querySelectorAll("[data-floor-plan-area-id]").forEach(b=>{b.addEventListener("click",()=>{const $=b.getAttribute("data-floor-plan-area-id");if(!$)return;const y=J();n(Oe({...y,activeAreaId:$,selectedTableId:null}))})}),(P=t.querySelector("[data-floor-plan-area-edit]"))==null||P.addEventListener("click",()=>{const b=J(),$=Re(b);$&&n(aw(b,$.id))}),(O=t.querySelector("[data-floor-plan-area-delete]"))==null||O.addEventListener("click",()=>{const b=Re(J());b&&m(b.id)}),(g=a==null?void 0:a.querySelector("[data-floor-plan-area-dialog-save]"))==null||g.addEventListener("click",u),(N=a==null?void 0:a.querySelector("[data-floor-plan-area-dialog-cancel]"))==null||N.addEventListener("click",l),a==null||a.querySelectorAll("[data-floor-plan-area-dialog-close]").forEach(b=>{b.addEventListener("click",l)}),(D=a==null?void 0:a.querySelector("[data-floor-plan-area-dialog-delete]"))==null||D.addEventListener("click",()=>{var $;const b=J();(($=b.areaDialog)==null?void 0:$.mode)==="edit"&&m(b.areaDialog.areaId)}),(Z=a==null?void 0:a.querySelector("[data-floor-plan-area-name]"))==null||Z.focus(),(W=t.querySelector("[data-floor-plan-table-add]"))==null||W.addEventListener("click",()=>{n(uw(J()))}),t.querySelectorAll("[data-floor-plan-table-pick]").forEach(b=>{b.addEventListener("click",()=>{const $=b.getAttribute("data-floor-plan-table-pick");$&&n(_a(J(),$))})}),(ce=r==null?void 0:r.querySelector("[data-floor-plan-dialog-save]"))==null||ce.addEventListener("click",i),(ue=r==null?void 0:r.querySelector("[data-floor-plan-dialog-cancel]"))==null||ue.addEventListener("click",s),r==null||r.querySelectorAll("[data-floor-plan-dialog-close]").forEach(b=>{b.addEventListener("click",s)}),(ie=r==null?void 0:r.querySelector("[data-floor-plan-dialog-delete]"))==null||ie.addEventListener("click",()=>{var G;const b=J();if(((G=b.tableDialog)==null?void 0:G.mode)!=="edit")return;const $=b.tableDialog.tableId,y=Re(b);if(!y)return;const I=y.tables.find(M=>M.id===$);!I||!window.confirm(`删除桌子「${I.name}」？`)||n(Oe({...b,areas:b.areas.map(M=>M.id===y.id?{...M,tables:M.tables.filter(pe=>pe.id!==$)}:M),selectedTableId:null}))});const T=b=>{if(b.key!=="Escape")return;const $=J();if($.tableDialog){b.preventDefault(),s();return}$.areaDialog&&(b.preventDefault(),l())};document.addEventListener("keydown",T),window.addEventListener("menusifu:floor-plan-remount",()=>document.removeEventListener("keydown",T),{once:!0});const k=t.querySelector("[data-floor-plan-canvas]");if(!k)return;let S=null;const p=b=>{if(!S||b.pointerId!==S.pointerId)return;const $=b.clientX-S.startClientX,y=b.clientY-S.startClientY;if(!S.dragged&&Math.hypot($,y)<o)return;S.dragged=!0;const I=Math.max(0,S.originX+$),G=Math.max(0,S.originY+y),M=k.querySelector(`[data-floor-plan-table-id="${S.tableId}"]`);M&&(M.style.left=`${I}px`,M.style.top=`${G}px`)},f=()=>{if(!S)return;const{tableId:b,dragged:$}=S;let y=J();if($){const I=Re(y);if(!I)return;const G=k.querySelector(`[data-floor-plan-table-id="${b}"]`),M=G?parseFloat(G.style.left):0,pe=G?parseFloat(G.style.top):0;y={...y,areas:y.areas.map(Ye=>Ye.id===I.id?{...Ye,tables:Ye.tables.map(jt=>jt.id===b?{...jt,x:M,y:pe}:jt)}:Ye)},Ea(Oe({...y,selectedTableId:b})),S=null,window.removeEventListener("pointermove",p),window.removeEventListener("pointerup",E),window.removeEventListener("pointercancel",E),Pa();return}S=null,window.removeEventListener("pointermove",p),window.removeEventListener("pointerup",E),window.removeEventListener("pointercancel",E),n(_a(y,b))},E=()=>f();k.querySelectorAll("[data-floor-plan-table-id]").forEach(b=>{b.addEventListener("pointerdown",$=>{const y=$;if(y.button!==0)return;const I=b.getAttribute("data-floor-plan-table-id");if(!I)return;const G=J(),M=Re(G),pe=M==null?void 0:M.tables.find(Ye=>Ye.id===I);!pe||!M||(y.preventDefault(),y.stopPropagation(),b.setPointerCapture(y.pointerId),mw(t,I),S={tableId:I,pointerId:y.pointerId,startClientX:y.clientX,startClientY:y.clientY,originX:pe.x,originY:pe.y,dragged:!1},window.addEventListener("pointermove",p),window.addEventListener("pointerup",E),window.addEventListener("pointercancel",E))})}),k.addEventListener("pointerdown",b=>{if(b.target.closest("[data-floor-plan-table-id]"))return;const y=J();!y.selectedTableId&&!y.tableDialog&&!y.areaDialog||n($a({...y,selectedTableId:null}))})}const Kp="menusifu-admin-ui-locale",Aa={zh:{"locale.label":"界面语言","locale.optionZh":"中文","locale.optionEn":"English","nav.backToPrimaryNav":"返回主导航","nav.secondarySuffix":"·二级导航","nav.subNavQualifier":"子导航","nav.openSecondary":"打开{name}二级导航","nav.sheetNavFunction":"{name}功能","nav.tertiarySuffix":" · 三级导航","nav.subPagesAria":"{name}子页面","badge.chain":"连锁","shell.appName":"米聚集团","shell.appTagline":"MenuSifu智慧餐饮管理中心","shell.navTree":"主导航树","shell.navAside":"主导航","header.aiOpenTitle":"打开 AI 智能助手","header.aiShort":"AI助手","header.themeToggle":"切换深色模式","header.scopeGroup":"数据范围筛选：品牌、区域、门店","header.scopeGroupTitle":"按品牌、区域、门店筛选当前数据范围（演示；可对接组织架构接口）","header.scopeBrand":"品牌","header.scopeBrandAria":"按品牌筛选","header.scopeAllBrands":"全部品牌","header.scopeRegion":"区域","header.scopeRegionAria":"按区域筛选","header.scopeAllRegions":"全部区域","header.scopeStore":"门店","header.scopeStoreAria":"按门店筛选","header.scopeAllStores":"全部门店","findTitle.aiChat":"智能对话","findTitle.aiModule":"AI智能助手 · AI Assistant","findTitle.productCenterB":"商品中心B","findTitle.productCenterBModule":"商品中心B · Product center B","findTitle.page":"页面","findTitle.inventoryChangeTitle":"库存变更记录","findTitle.inventoryChangeModule":"库存管理中心 / Inventory management center","findTitle.moduleTax":"商品中心 · 门店管理 · 税种管理","findTitle.moduleSeasoning":"商品中心 · 商品管理 · 调味管理","findTitle.moduleTags":"商品中心 · 商品管理 · 标签管理","findTitle.moduleRecipes":"商品中心 · 商品管理 · 配方管理","findTitle.moduleDmHw":"硬件管理中心 · 硬件","findTitle.moduleTips":"团队管理 · 小费管理","findTitle.moduleTeamReports":"团队管理 · 员工报表","findTitle.moduleTeamScheduling":"团队管理 · 排班与考勤","findTitle.moduleBrandProducts":"商品中心 · 商品管理","findTitle.moduleBrandMenu":"商品中心 · 品牌菜单","findTitle.moduleStoreProducts":"商品中心 · 门店管理","findTitle.moduleGiftCards":"礼品卡中心 · Gift card center","findTitle.moduleMembers":"会员中心 · Member center","findTitle.moduleMembersCards":"会员中心 · 卡券管理","findTitle.modulePoints":"积分配置","findTitle.moduleReportsBase":"报表中心 · Reporting center","findTitle.moduleReportsPrefix":"报表中心 · {name}","findTitle.modulePrint":"打印中心 · Print center","findTitle.moduleReservations":"预约等位中心 · Reservation & waitlist center","findTitle.moduleReservationsShort":"预约等位中心","inventory.sheetTitle":"库存管理中心·二级导航","inventory.sheetNav":"库存功能","inventory.centerTitle":"库存管理中心","placeholder.route":"当前路由：","placeholder.intro":"「{title}」页面占位 — 可在此接入列表、表单或图表。","placeholder.tabModule":"本模块（{title}）二级导航在上方 Tab 切换；侧栏仅保留该模块一级入口","placeholder.sidebarModule":"本模块（{title}）二级在左侧主导航：点击侧栏「{title}」展开/收起子列表后切换。","placeholder.sheetModule":"本模块（{title}）：点击侧栏该名称行打开右滑二级导航（与营销中心同交互），在滑层内切换本模块二级路由。","placeholder.designTokens":"设计令牌使用 Tailwind v4 @theme（OKLCH 语义色）","placeholder.chainTab":"标记为「连锁」的 Tab 为加盟/多店场景常用入口（配置见 navigation.ts 中 chainOnly）","placeholder.kpi.sales":"今日销售额","placeholder.kpi.orders":"待处理订单","placeholder.kpi.staff":"在岗员工","placeholder.navDoc":"侧栏一级顺序与主导航、滑层、Tab 的说明见占位区首条长列表；AI 智能助手仅顶栏入口。结构来源：docs/餐饮商家后台-导航与目录结构建议.md","tabPanel.fallbackAria":"主内容","moduleTabs.fallbackNav":"子页面","giftCards.embedTitle":"礼品卡工厂","inventory.iframeTitle":"WMS 效期分类","capital.newTab":"在新标签页打开如意财（EZ Capital）","capital.aria":"信贷中心：在新标签页打开 EZ Capital","placeholder.navDocLong":'侧栏一级顺序：品牌管理、门店管理、主页、团队管理、商品中心、订单中心、支付中心、外卖/来取、营销中心、营促销中心、会员中心、礼品卡中心、评价中心、前厅管理中心、后厨管理中心、预约等位中心、报表中心、财务中心、打印中心、消息中心、库存管理中心、硬件管理中心、权限管理中心、信贷中心、素材中心、系统设置。**品牌管理、门店管理、团队管理、订单中心、支付中心、外卖/来取、前厅管理中心、后厨管理中心、评价中心、财务中心、硬件管理中心、权限管理中心、素材管理中心**与**商品中心**、**营销中心**、**促销中心**、**会员中心**、**礼品卡中心**、**报表中心**、**打印中心**、**预约等位中心**、**库存管理中心**均为侧栏自右滑入的二级导航；**主页、消息中心、系统设置**的二级仍在主导航树内可折叠展开（一级行展开/收起，再点子项）。品牌/门店置顶；**商品中心**紧接**团队管理**之后。外卖/来取、前厅管理中心、后厨管理中心滑层内均为业务主入口与「设置」；营销中心滑层内为「营销管理」及子项「营销活动」「手动营销」，并含「设置」；商品中心滑层含商品管理、品牌菜单、门店管理及「设置」；库存管理中心滑层含效期管理、物料管理及「设置」；促销中心滑层内为「促销活动」与「设置」；会员中心滑层内为「卡券管理」（含「优惠券管理」「付费会员明细」「付费会员配置」）、「积分配置」与「设置」；礼品卡中心滑层内为「礼品卡工厂」与「设置」，其中礼品卡工厂在主内容区嵌入云端礼品卡工厂；评价中心滑层含「评价洞察」「评价明细」「评价统计」与「设置」；报表中心滑层内为「营业汇总」「销售汇总」（子项：订单、支付、折扣金额、加收）、「商品报表」（排名、商品潜力分析）、「员工报表」（员工概观、小费分配）、「走势详情」（分店概观、销售额比对）及「月度经营分析」；打印中心滑层内仅「打印装修」；预约等位中心滑层内为「Waitlist」「RSV」「History」「Section」「设置」，界面语言在顶栏全局。其它模块二级多在上方 Tab。 <strong class="text-card-foreground">AI智能助手</strong> 仅顶栏全局入口（<code class="font-mono text-xs">#/ai-assistant/chat</code>），非侧栏一级。结构来源：<strong class="text-card-foreground">docs/餐饮商家后台-导航与目录结构建议.md</strong>',"placeholder.navDocShort":"侧栏一级入口；多数模块二级在上方 Tab。","ai.welcomeHtml":'您好，我是 <strong class="text-card-foreground">MenuSifu 智能助手</strong>（单一智能体）。您可以用<strong class="text-card-foreground">文字或语音</strong>让我：检索全站模块与数据、说明或协助调整<strong class="text-card-foreground">配置与权限</strong>、做经营<strong class="text-card-foreground">分析摘要</strong>。下方为演示回复，接入大模型与业务 API 后即可真实执行（受策略与审批约束）。',"ai.contextNote":"同一对话上下文贯穿全程：无需切换「配置机器人」「分析机器人」——由本智能体统一理解意图并调用工具链（检索 / 配置 / 数仓 / 权限服务）。","ai.quickAria":"快捷示例指令","ai.quick.permissions":"权限说明","ai.quick.search":"全站查找","ai.quick.analysis":"数据分析","ai.quick.config":"改配示例","ai.link.permissions":"打开权限管理中心","ai.input.placeholder":"输入问题，Enter 发送；Shift+Enter 换行","ai.send":"发送","ai.voice":"语音输入","settings.overview.title":"硬件与终端","settings.overview.desc":'从系统设置总揽快速进入 <strong class="text-card-foreground">硬件管理中心 → 硬件</strong> 下各终端配置页（含 POS GO）；左侧主导航请展开 <strong class="text-card-foreground">硬件管理中心</strong> → <strong class="text-card-foreground">硬件</strong>。',"moduleSettings.intro":'以下按<strong class="text-card-foreground">功能场景</strong>归类展示本模块相关「功能设置」（来源：<code class="font-mono text-xs">docs/分析.md</code> 与 CSV 归类表）。点击项为占位，后续可对接具体配置页。',"moduleSettings.count":"共 {count} 项","moduleSettings.empty":'当前模块在归类表中尚无「功能设置」条目；可在 <code class="font-mono text-xs">docs/分析.md</code> 补充后重新运行 <code class="font-mono text-xs">node scripts/build-module-settings-catalog.mjs</code> 生成目录。',"moduleSettings.categoryAria":"{category} 设置项","moduleSettings.toggleAria":"{name}：是否展示","moduleSettings.toggleOn":"已开启展示","moduleSettings.toggleOff":"已关闭展示","moduleSettings.toggleOffLabel":"关闭","moduleSettings.toggleOnLabel":"开启","sheet.marketingMgmt":"营销管理","placeholder.bullet.deviceHw":'<strong class="text-card-foreground">硬件管理中心 · 硬件</strong>：在左侧主导航点击「硬件管理中心」打开<strong class="text-card-foreground">右滑二级导航</strong>后选择 <strong class="text-card-foreground">硬件</strong>；本区域左侧为硬件细项（支付、钱箱、路由器、POS、POS GO、KDS、叫号屏、打印机、电子秤、Kiosk、eMenu），交互同本后台其它三级侧栏。',"placeholder.bullet.tips":'<strong class="text-card-foreground">团队管理 · 小费管理</strong>：在左侧主导航点击「团队管理」打开<strong class="text-card-foreground">右滑二级导航</strong>后选择 <strong class="text-card-foreground">小费管理</strong>；本区域左侧为细项（小费分配、分配明细、分配规则），交互同本后台其它三级侧栏。',"placeholder.bullet.teamReports":'<strong class="text-card-foreground">团队管理 · 员工报表</strong>：在左侧主导航点击「团队管理」打开<strong class="text-card-foreground">右滑二级导航</strong>后选择 <strong class="text-card-foreground">员工报表</strong>；本区域左侧为细项（概览、小费、绩效、薪资），交互同小费管理。',"placeholder.bullet.teamScheduling":'<strong class="text-card-foreground">团队管理 · 排班与考勤</strong>：在左侧主导航点击「团队管理」打开<strong class="text-card-foreground">右滑二级导航</strong>后选择 <strong class="text-card-foreground">排班与考勤</strong>；本区域左侧为细项（考勤记录、加班规则），交互同小费管理。',"placeholder.bullet.brandProducts":'<strong class="text-card-foreground">商品管理</strong>：侧栏打开「<strong class="text-card-foreground">商品中心</strong>」滑层后，在「<strong class="text-card-foreground">商品管理</strong>」下为全部细项二级导航（商品、分类、规格组、口味组、做法组、加料组、套餐组、调味管理、标签管理、原料管理、原料分类、图片管理、配方管理）；调味/标签/配方分组可折叠，交互与主区左侧三级侧栏一致。配方内「原料管理」：<code class="font-mono text-xs">/brand-products/recipes/ingredients</code>。',"placeholder.bullet.brandMenu":'<strong class="text-card-foreground">品牌菜单</strong>：侧栏打开「<strong class="text-card-foreground">商品中心</strong>」滑层后选择「<strong class="text-card-foreground">品牌菜单</strong>」；本区域左侧为 <strong class="text-card-foreground">菜单、下发记录</strong> 三级导航。其它品牌菜单路由（如分组、渠道可见性）仍可通过链接进入，侧栏「菜单」项保持高亮。',"placeholder.bullet.storeMenu":'<strong class="text-card-foreground">门店管理</strong>：侧栏打开「<strong class="text-card-foreground">商品中心</strong>」滑层后选择「<strong class="text-card-foreground">门店管理</strong>」；本区域左侧为 <strong class="text-card-foreground">门店菜单、门店商品、门店调味、库存变更记录、打印设置、税种管理、配方列表</strong> 三级导航。其中 <strong class="text-card-foreground">税种管理</strong> 为可折叠分组，内含二级入口 <strong class="text-card-foreground">税种管理、商品税管理</strong>（一级行点击仅展开/收起，交互同左侧主导航可折叠模块）。',"placeholder.bullet.permissions":'<strong class="text-card-foreground">权限管理中心</strong>（RBAC）：侧栏点击「权限管理中心」打开右滑二级导航；在「<strong class="text-card-foreground">角色与功能权限</strong>」中配置各 <strong class="text-card-foreground">角色</strong> 可访问的后台模块与操作（查看、编辑、导出、审核等）；在「<strong class="text-card-foreground">员工授权</strong>」中指定 <strong class="text-card-foreground">哪位员工</strong> 拥有哪些角色。「权限总览」便于审计当前策略；「权限变更记录」留痕赋权调整。与「系统设置 → 账号与权限」可分工：本模块侧重可编排的权限矩阵与员工赋权，系统设置侧重账号安全与基础开关。',"placeholder.bullet.reservations":'<strong class="text-card-foreground">预约等位中心</strong>：点击侧栏「预约等位中心」打开与营销中心相同的右滑二级导航；滑层内为 <strong class="text-card-foreground">Waitlist、RSV、History、Section、设置</strong>；<strong class="text-card-foreground">界面语言</strong>在顶栏全局下拉（深浅色切换旁）。',"tertiaryNav.tips":"小费管理","tertiaryNav.teamReports":"员工报表","tertiaryNav.teamScheduling":"排班与考勤","ai.srInputLabel":"输入指令或问题","ai.tipVoiceLang":"提示：点击麦克风使用语音输入（随界面语言切换识别语言；Chrome / Edge 体验更佳）。","ai.speech.unsupported":"当前浏览器不支持语音识别，请直接输入文字，或使用 Chrome / Edge 重试。","ai.speech.micError":"未听清或未授权麦克风，请检查权限后重试。","ai.speech.startFailed":"无法启动语音识别，请改用文本输入。"},en:{"locale.label":"Interface language","locale.optionZh":"中文","locale.optionEn":"English","nav.backToPrimaryNav":"Back to main navigation","nav.secondarySuffix":" · Secondary navigation","nav.subNavQualifier":"Sub-navigation","nav.openSecondary":"Open secondary navigation: {name}","nav.sheetNavFunction":"{name} menu","nav.tertiarySuffix":" · Tertiary navigation","nav.subPagesAria":"{name} sub-pages","badge.chain":"Chain","shell.appName":"Miju Group","shell.appTagline":"MenuSifu merchant admin","shell.navTree":"Main navigation tree","shell.navAside":"Main navigation","header.aiOpenTitle":"Open AI assistant","header.aiShort":"AI","header.themeToggle":"Toggle dark mode","header.scopeGroup":"Scope: brand, region, store","header.scopeGroupTitle":"Filter data by brand, region, and store (demo; connect to org APIs)","header.scopeBrand":"Brand","header.scopeBrandAria":"Filter by brand","header.scopeAllBrands":"All brands","header.scopeRegion":"Region","header.scopeRegionAria":"Filter by region","header.scopeAllRegions":"All regions","header.scopeStore":"Store","header.scopeStoreAria":"Filter by store","header.scopeAllStores":"All stores","findTitle.aiChat":"Chat","findTitle.aiModule":"AI Assistant","findTitle.productCenterB":"Product center B","findTitle.productCenterBModule":"Product center B","findTitle.page":"Page","findTitle.inventoryChangeTitle":"Inventory change log","findTitle.inventoryChangeModule":"Inventory management center","findTitle.moduleTax":"Product center · Store management · Tax types","findTitle.moduleSeasoning":"Product center · Product management · Seasoning","findTitle.moduleTags":"Product center · Product management · Tags","findTitle.moduleRecipes":"Product center · Product management · Recipes","findTitle.moduleDmHw":"Hardware · Devices","findTitle.moduleTips":"Team · Tips","findTitle.moduleTeamReports":"Team · Staff reports","findTitle.moduleTeamScheduling":"Team · Scheduling & attendance","findTitle.moduleBrandProducts":"Product center · Product management","findTitle.moduleBrandMenu":"Product center · Brand menus","findTitle.moduleStoreProducts":"Product center · Store management","findTitle.moduleGiftCards":"Gift card center","findTitle.moduleMembers":"Member center","findTitle.moduleMembersCards":"Member center · Cards & coupons","findTitle.modulePoints":"Points configuration","findTitle.moduleReportsBase":"Reporting center","findTitle.moduleReportsPrefix":"Reporting center · {name}","findTitle.modulePrint":"Print center","findTitle.moduleReservations":"Reservation & waitlist center","findTitle.moduleReservationsShort":"Reservation & waitlist","inventory.sheetTitle":"Inventory management · Secondary navigation","inventory.sheetNav":"Inventory","inventory.centerTitle":"Inventory management center","placeholder.route":"Current route:","placeholder.intro":"“{title}” is a placeholder — add lists, forms, or charts here.","placeholder.tabModule":"Module ({title}): use the top tabs for secondary navigation; the sidebar keeps only the top-level entry.","placeholder.sidebarModule":"Module ({title}): expand or collapse the item in the sidebar, then choose a child link.","placeholder.sheetModule":"Module ({title}): click the row in the sidebar to open the slide-in secondary navigation (same pattern as Marketing), then pick a route inside the sheet.","placeholder.designTokens":"Design tokens use Tailwind v4 @theme (OKLCH semantic colors).","placeholder.chainTab":"Tabs marked “Chain” are common for franchise / multi-store setups (see chainOnly in navigation.ts).","placeholder.kpi.sales":"Today’s sales","placeholder.kpi.orders":"Pending orders","placeholder.kpi.staff":"Staff on duty","placeholder.navDoc":"See the first long bullet in this card for sidebar order, sheets, and tabs. AI assistant is header-only. Source: docs/餐饮商家后台-导航与目录结构建议.md","tabPanel.fallbackAria":"Main content","moduleTabs.fallbackNav":"Sub-pages","giftCards.embedTitle":"Gift card factory","inventory.iframeTitle":"WMS expiry categories","capital.newTab":"Open EZ Capital in a new tab","capital.aria":"Credit center: open EZ Capital in a new tab","placeholder.navDocLong":'Sidebar order: Brand, Stores, Home, Team, Product center, Orders, Payments, Delivery & pickup, Marketing, Promotions, Members, Gift cards, Reviews, Front of house, Kitchen, Reservations, Reports, Finance, Print, Messages, Inventory, Hardware, Permissions, Credit, Assets, Settings. **Brand, Stores, Team, Orders, Payments, Delivery & pickup, Front of house, Kitchen, Reviews, Finance, Hardware, Permissions, Assets**, plus **Product center**, **Marketing**, **Promotions**, **Members**, **Gift cards**, **Reports**, **Print**, **Reservations**, and **Inventory** use a slide-in secondary sheet; **Home**, **Messages**, and **Settings** keep collapsible children in the main tree. Delivery & pickup, front of house, and kitchen sheets: main entry plus Settings; Marketing sheet: campaigns, manual marketing, and Settings; Product center sheet: product management, brand menus, store management, and Settings; Inventory sheet: expiry, materials, and Settings; Promotions: campaigns & Settings; Members: cards & coupons, points & Settings; Gift cards: factory (embedded) & Settings; Reviews: insights, detail, stats & Settings; Reports: business summary, sales, products, staff, trends, monthly analysis; Print: decoration only; Reservations: Waitlist, RSV, History, Section, Settings; UI language is global in the header. Most other modules use top tabs. <strong class="text-card-foreground">AI Assistant</strong> is header-only (<code class="font-mono text-xs">#/ai-assistant/chat</code>). Source: docs/餐饮商家后台-导航与目录结构建议.md',"placeholder.navDocShort":"Sidebar entries; most modules use top tabs for level-2 navigation.","ai.welcomeHtml":'Hello, I am the <strong class="text-card-foreground">MenuSifu assistant</strong> (single agent). Use <strong class="text-card-foreground">text or voice</strong> to search modules and data, explain or help adjust <strong class="text-card-foreground">configuration & permissions</strong>, and run <strong class="text-card-foreground">analytics summaries</strong>. Replies below are demos; connect an LLM and business APIs for real actions (subject to policy and approvals).',"ai.contextNote":"One conversation context end-to-end—no separate “config bot” vs “analytics bot”; this agent routes intent to retrieval, config, data, and permission tools.","ai.quickAria":"Quick prompt examples","ai.quick.permissions":"RBAC help","ai.quick.search":"Site search","ai.quick.analysis":"Analytics","ai.quick.config":"Config example","ai.link.permissions":"Open access management","ai.input.placeholder":"Type a question; Enter to send; Shift+Enter for newline","ai.send":"Send","ai.voice":"Voice input","settings.overview.title":"Hardware & terminals","settings.overview.desc":'From this overview jump to <strong class="text-card-foreground">Hardware management → Hardware</strong> for each terminal (including POS GO). In the sidebar open <strong class="text-card-foreground">Hardware management</strong> → <strong class="text-card-foreground">Hardware</strong>.',"moduleSettings.intro":'Grouped by <strong class="text-card-foreground">functional scenario</strong> from the classification table (<code class="font-mono text-xs">docs/分析.md</code> / CSV). Rows are placeholders until wired to real config screens.',"moduleSettings.count":"{count} items","moduleSettings.empty":'No classified settings for this module yet. Add rows in <code class="font-mono text-xs">docs/分析.md</code>, then run <code class="font-mono text-xs">node scripts/build-module-settings-catalog.mjs</code>.',"moduleSettings.categoryAria":"Settings in {category}","moduleSettings.toggleAria":"{name}: show on screen","moduleSettings.toggleOn":"Shown","moduleSettings.toggleOff":"Hidden","moduleSettings.toggleOffLabel":"Off","moduleSettings.toggleOnLabel":"On","sheet.marketingMgmt":"Marketing management","placeholder.bullet.deviceHw":'<strong class="text-card-foreground">Hardware · Devices</strong>: open <strong class="text-card-foreground">Hardware management</strong> from the sidebar, then the <strong class="text-card-foreground">slide-in sheet</strong> and choose <strong class="text-card-foreground">Devices</strong>. The left column lists terminals (payments, cash drawer, router, POS, POS GO, KDS, queue display, printers, scales, Kiosk, eMenu)—same tertiary pattern as elsewhere.',"placeholder.bullet.tips":'<strong class="text-card-foreground">Team · Tips</strong>: open Team from the sidebar, use the sheet, pick <strong class="text-card-foreground">Tips</strong>. Left column covers allocation, details, and rules.',"placeholder.bullet.teamReports":'<strong class="text-card-foreground">Team · Staff reports</strong>: open Team → <strong class="text-card-foreground">Staff reports</strong> from the sheet. Left column: overview, tips, performance, payroll.',"placeholder.bullet.teamScheduling":'<strong class="text-card-foreground">Team · Scheduling & attendance</strong>: open Team → <strong class="text-card-foreground">Scheduling</strong> from the sheet. Left column: attendance log and overtime rules.',"placeholder.bullet.brandProducts":'<strong class="text-card-foreground">Brand products</strong>: open the <strong class="text-card-foreground">Product center</strong> sheet, then <strong class="text-card-foreground">Product management</strong> for the full secondary list (products, categories, spec/flavor/prep/add-on/combo groups, seasoning, tags, ingredients, images, recipes). Collapsible groups match the old tertiary sidebar. You can also enter via <strong class="text-card-foreground">Product center A → Brand products</strong>. Ingredients under recipes: <code class="font-mono text-xs">/brand-products/recipes/ingredients</code>.',"placeholder.bullet.brandMenu":'<strong class="text-card-foreground">Brand menus</strong>: expand <strong class="text-card-foreground">Product center A → Brand menus</strong>. Left column: menus and distribution log; other routes (groups, channel visibility) still work and keep “Menus” highlighted.',"placeholder.bullet.storeMenu":'<strong class="text-card-foreground">Store products</strong>: expand <strong class="text-card-foreground">Product center A → Store products</strong>. Left column: store menu, store products, seasoning, inventory change log, print settings, tax types, recipe list. <strong class="text-card-foreground">Tax types</strong> is a collapsible group with settings and product tax entries.',"placeholder.bullet.permissions":'<strong class="text-card-foreground">Access management (RBAC)</strong>: open the sheet from the sidebar. Configure <strong class="text-card-foreground">roles & permissions</strong>, assign <strong class="text-card-foreground">roles to staff</strong>, review the matrix, and audit changes. Complements <strong class="text-card-foreground">Settings → Accounts & permissions</strong> for security basics.',"placeholder.bullet.reservations":'<strong class="text-card-foreground">Reservations & waitlist</strong>: same slide-in pattern as Marketing. Sheet entries: Waitlist, RSV, History, Section, Settings. <strong class="text-card-foreground">UI language</strong> is global in the header.',"tertiaryNav.tips":"Tips","tertiaryNav.teamReports":"Staff reports","tertiaryNav.teamScheduling":"Scheduling & attendance","ai.srInputLabel":"Prompt or question","ai.tipVoiceLang":"Tip: use the microphone for voice input (recognition language follows the UI language; Chrome / Edge recommended).","ai.speech.unsupported":"Speech recognition is not available in this browser. Type your question or try Chrome / Edge.","ai.speech.micError":"Could not hear you or microphone permission was denied. Check permissions and try again.","ai.speech.startFailed":"Could not start speech recognition. Please type instead."}};function rt(){try{const e=localStorage.getItem(Kp);if(e==="en")return"en";if(e==="zh")return"zh"}catch{}return"zh"}function xw(e){try{localStorage.setItem(Kp,e)}catch{}}function Bp(e){document.documentElement.lang=e==="en"?"en":"zh-Hans",document.documentElement.setAttribute("data-ui-locale",e)}function h(e,t,r=rt()){return r==="en"&&t!=null&&String(t).trim()!==""?t:e}function Sw(e){let t=e.trim();for(let r=0;r<8;r++){const n=t;if(t=t.replace(/\s+Management\s+Center$/i,"").trim(),t=t.replace(/\s+Center$/i,"").trim(),t=t.replace(/\s+Management$/i,"").trim(),t===n)break}return t.replace(/\s{2,}/g," ").trim()}function U(e){return rt()!=="en"?e.title:Sw(e.titleEn)}function c(e){return rt()==="en"?Aa.en[e]:Aa.zh[e]}function Q(e,t){let r=String(c(e));for(const[n,s]of Object.entries(t))r=r.replace(new RegExp(`\\{${n}\\}`,"g"),s);return r}function co(e){return rt()==="en"?e.titleEn:`${e.title} · ${e.titleEn}`}function d(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Tw(e,t){return`${co(e)} — ${h(t.title,t.titleEn)}`}function nt(e){const t=d(`${h(e.title,e.titleEn)}${c("nav.secondarySuffix")}`),r=d(Q("nav.sheetNavFunction",{name:h(e.title,e.titleEn)}));return{dialog:t,navFunc:r}}function Ew(e){const t=e.trim();return t?/权限|角色|RBAC|员工授权/i.test(t)?"【演示】可说明权限矩阵、员工与角色绑定，并在对接后端后协助跳转「权限管理中心」与预填变更。也可回答例如：谁能改价、店长默认可见哪些报表。":/搜索|查找|搜|哪里有|在哪/i.test(t)?"【演示】全站检索由同一智能体完成：可定位侧栏模块、路由、帮助文档与业务对象（订单、门店、商品等）。接入索引与向量库后支持口语化问法。":/分析|报表|趋势|统计|营业额|收入/i.test(t)?"【演示】可按您描述的时间、门店、品类做对比与摘要；接入数仓后可拉取真实指标、生成图表与下钻链接。":/配置|设置|修改|改|打开|关闭/i.test(t)?"【演示】配置类意图会解析为「目标模块 + 动作」，走策略校验与（可选）人工审批后再执行。当前壳层仅模拟确认，不写回生产。":"【演示】单一智能体持续本对话上下文，接入模型后可执行查数、改配、导表与权限调整（受租户策略约束）。请补充门店、时间范围或要操作的对象。":""}const Hp='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',$e={home:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',orders:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',receipt:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>',menu:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>',floorPlan:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>',kitchenKds:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 13h12"/><path d="M6 9h12"/><path d="M9 5h6v4H9z"/><path d="M8 21h8v-4H8z"/></svg>',queueCall:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',reservations:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',waitlist:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',inventory:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',promo:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><path d="M11.5 11.5 6 17l-4 1 1-4 5.5-5.5"/></svg>',marketing:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',members:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',reviews:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>',gift:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>',team:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',reports:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',capital:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/></svg>',financeCenter:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',notifications:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',printTemplate:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>',deviceManagement:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="5" x="4" y="4" rx="1"/><rect width="16" height="5" x="4" y="15" rx="1"/><path d="M8 8h.01"/><path d="M8 19h.01"/><path d="M12 8h.01"/><path d="M12 19h.01"/><path d="M16 8h.01"/><path d="M16 19h.01"/></svg>',brandProducts:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l6.88-6.88a1 1 0 0 0 0-1.41L12 2Z"/><path d="M7 7h.01"/></svg>',brandMenu:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h4"/></svg>',brandMgmt:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>',storeMgmt:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/><path d="M17 14h1"/><path d="M17 18h1"/></svg>',permissionMgmt:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',assetCenter:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',configCenter:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>',settings:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>'},Pt="tertiary-inline-subnav-scroll min-h-0 max-h-[min(52dvh,26rem)] overflow-y-auto overscroll-y-contain sm:max-h-full sm:self-stretch",$w="https://cloud.menusifucloudqa.com/factory/giftcardb";function ww(e){return e==="/gift-cards/cards"||e.startsWith("/gift-cards/cards/")}function kw(){const e=d($w);return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <p class="sr-only">内嵌云端礼品卡工厂。若内容空白，请确认 cloud.menusifucloudqa.com 允许被本后台来源嵌入。</p>
      <iframe
        title="${d(c("giftCards.embedTitle"))}"
        class="block h-full min-h-[22rem] w-full flex-1 border-0 sm:min-h-0"
        src="${e}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}const _w="https://www.ezcapital.com/zh",Pw="https://wms.menusifuchina.com/platform-expiration-category",Nw="./Configuration%20center/kiosk-screensaver.html?embedded=1",Iw="./Configuration%20center/marketing-ads.html?embedded=1",Dw="./Configuration%20center/marketing-poster-pro.html?embedded=1",Aw="./Configuration%20center/material.html?embedded=1",qw="./Configuration%20center/order-limit.html?embedded=1",Lw="./TipOut/index.html?embedded=1",Cw="./TipOut/employees.html?embedded=1",Mw="./TipOut/index.html?embedded=1",Rw="./TipOut/detail.html?embedded=1",Ow="./TipOut/rules.html?embedded=1",Kw="./TipOut/payroll.html?embedded=1";function Bw(e){return e==="/operations/inventory-ordering/expiry"||e.startsWith("/operations/inventory-ordering/expiry/")}function Hw(e){return e==="/marketing/screensaver"||e.startsWith("/marketing/screensaver/")}function Fw(e){return e==="/marketing/ads"||e.startsWith("/marketing/ads/")}function Gw(e){return e==="/marketing/poster-pro"||e.startsWith("/marketing/poster-pro/")}function Uw(e){return e==="/asset-center/materials"||e.startsWith("/asset-center/materials/")}function jw(e){return e==="/permissions/order-limit"||e.startsWith("/permissions/order-limit/")}function Vw(e){return e==="/reports/staff/tips-allocation"||e.startsWith("/reports/staff/tips-allocation/")}function Ww(e){return e==="/team/roles-employees"||e.startsWith("/team/roles-employees/")}function Qw(e){return e==="/team/tips"||e.startsWith("/team/tips/")}function zw(e){return e==="/team/payroll-report"||e.startsWith("/team/payroll-report/")}function Yw(e){return e==="/team/tips/rules"||e.startsWith("/team/tips/rules/")?Ow:e==="/team/tips/details"||e.startsWith("/team/tips/details/")?Rw:Mw}function Xe(e,t){const r=R.find(n=>n.id===e);return(r==null?void 0:r.defaultChildPath)??t}function Xw(){return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <iframe
        title="${d(c("inventory.iframeTitle"))}"
        class="block h-full min-h-[22rem] w-full flex-1 border-0 sm:min-h-0"
        src="${Pw}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}function Zw(){return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <iframe
        title="营销中心屏保功能"
        class="block h-full w-full flex-1 border-0"
        src="${Nw}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}function Jw(){return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <iframe
        title="营销中心广告功能"
        class="block h-full w-full flex-1 border-0"
        src="${Iw}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}function ek(){return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <iframe
        title="营销中心海报 Pro"
        class="block h-full w-full flex-1 border-0"
        src="${Dw}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}function tk(){return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <iframe
        title="素材中心图片素材功能"
        class="block h-full w-full flex-1 border-0"
        src="${Aw}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}function rk(){return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <iframe
        title="权限管理下单限制配置"
        class="block h-full w-full flex-1 border-0"
        src="${qw}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}function nk(){return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <iframe
        title="报表中心小费分配"
        class="block h-full w-full flex-1 border-0"
        src="${Lw}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}function sk(){return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <iframe
        title="团队管理角色与员工"
        class="block h-full w-full flex-1 border-0"
        src="${Cw}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}function ik(e){return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <iframe
        title="团队管理小费管理"
        class="block h-full w-full flex-1 border-0"
        src="${Yw(e)}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}function ok(){return`
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <iframe
        title="团队管理报税报表"
        class="block h-full w-full flex-1 border-0"
        src="${Kw}"
        referrerpolicy="no-referrer-when-downgrade"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    </div>`}function ak(e){return!e||e.subNavPlacement==="sidebar"||e.subNavPlacement==="sheet"||e.id==="inventory-ordering"||e.id==="product-center-main"||e.id==="marketing"||e.id==="promotions"||e.id==="members"||e.id==="gift-cards"||e.id==="reports-finance"||e.id==="print-templates"||e.id==="reservations"?!1:e.children.length>1}const Ls="sidebar-inventory-secondary-open",Cs="sidebar-product-center-main-secondary-open",Ms="sidebar-marketing-secondary-open",Rs="sidebar-promotions-secondary-open",Os="sidebar-members-secondary-open",Ks="sidebar-gift-cards-secondary-open",Bs="sidebar-reports-secondary-open",Hs="sidebar-print-secondary-open",Fs="sidebar-reservations-secondary-open",Fp="pcm-sheet-brand-products-mgmt-expanded",Gp="pcm-sheet-brand-menu-expanded",Up="pcm-sheet-store-menu-expanded",jp="marketing-sheet-mgmt-expanded";let qa="",La="",Ca="",Ma="",Ra="",Oa="",Ka="",Ba="",Ha="";const uo="sidebar-nav-module-sheets-open-json-v1";let Fa={};const je="transition-[transform,opacity] duration-[1000ms] ease-in-out will-change-[transform,opacity]",Te="bg-sidebar-active/12 text-sidebar-foreground dark:bg-white/10 dark:text-white",Gs="bg-sidebar-active/12 font-medium text-sidebar-foreground dark:bg-white/10 dark:text-white",te="text-sidebar-muted hover:bg-sidebar-foreground/[0.06] dark:hover:bg-white/5 hover:text-sidebar-foreground",Le="border-b border-sidebar-foreground/10 dark:border-white/10",Ve="border-l border-sidebar-foreground/10 dark:border-white/10",Ut="border-t border-sidebar-foreground/10 dark:border-white/10",Ce="text-sidebar-foreground dark:text-white",We="text-sidebar-muted transition-colors hover:bg-sidebar-foreground/[0.06] dark:hover:bg-white/5 hover:text-sidebar-foreground",Cr="text-sidebar-foreground dark:text-white transition-colors hover:bg-sidebar-foreground/[0.06] dark:hover:bg-white/5",Qe="shadow-[6px_0_28px_rgba(15,23,42,0.07)] dark:shadow-[6px_0_32px_rgba(0,0,0,0.45)]";function po(){try{const e=sessionStorage.getItem(uo);if(!e)return{};const t=JSON.parse(e);if(!t||typeof t!="object"||Array.isArray(t))return{};const r={};for(const[n,s]of Object.entries(t))s===!0&&(r[n]=!0);return r}catch{return{}}}function Mr(e){return po()[e]===!0}function Rr(e,t){const r={...po()};t?r[e]=!0:delete r[e];try{sessionStorage.setItem(uo,JSON.stringify(r))}catch{}}function Me(){try{sessionStorage.removeItem(uo)}catch{}}let Ga=!1;function lk(){Ga||(Ga=!0,window.addEventListener("keydown",e=>{if(e.key!=="Escape")return;let t=!1;mo()&&(me(!1),t=!0),go()&&(ge(!1),t=!0),fo()&&(fe(!1),t=!0),bo()&&(be(!1),t=!0),ho()&&(he(!1),t=!0),vo()&&(ve(!1),t=!0),yo()&&(ye(!1),t=!0),xo()&&(xe(!1),t=!0),So()&&(Se(!1),t=!0),Object.keys(po()).length>0&&(Me(),t=!0),t&&C()}))}function Ua(e){return e==="/operations/inventory-ordering"||e.startsWith("/operations/inventory-ordering/")}function mo(){try{return sessionStorage.getItem(Ls)==="true"}catch{return!1}}function me(e){try{e?sessionStorage.setItem(Ls,"true"):sessionStorage.removeItem(Ls)}catch{}}function dk(){const e=R.find(t=>t.id==="inventory-ordering");return(e==null?void 0:e.children)??[]}function Us(e){return!!(e==="/product-center-main"||e.startsWith("/product-center-main/")||e==="/brand-products"||e.startsWith("/brand-products/")||e==="/brand-menu"||e.startsWith("/brand-menu/")||e==="/menu"||e.startsWith("/menu/"))}function go(){try{return sessionStorage.getItem(Cs)==="true"}catch{return!1}}function ge(e){try{e?sessionStorage.setItem(Cs,"true"):sessionStorage.removeItem(Cs)}catch{}}function js(e){return e==="/marketing"||e.startsWith("/marketing/")}function fo(){try{return sessionStorage.getItem(Ms)==="true"}catch{return!1}}function fe(e){try{e?sessionStorage.setItem(Ms,"true"):sessionStorage.removeItem(Ms)}catch{}}function Vs(e){return e==="/promotions"||e.startsWith("/promotions/")}function bo(){try{return sessionStorage.getItem(Rs)==="true"}catch{return!1}}function be(e){try{e?sessionStorage.setItem(Rs,"true"):sessionStorage.removeItem(Rs)}catch{}}function Ws(e){return e==="/members"||e.startsWith("/members/")}function ho(){try{return sessionStorage.getItem(Os)==="true"}catch{return!1}}function he(e){try{e?sessionStorage.setItem(Os,"true"):sessionStorage.removeItem(Os)}catch{}}function Qs(e){return e==="/gift-cards"||e.startsWith("/gift-cards/")}function vo(){try{return sessionStorage.getItem(Ks)==="true"}catch{return!1}}function ve(e){try{e?sessionStorage.setItem(Ks,"true"):sessionStorage.removeItem(Ks)}catch{}}function yo(){try{return sessionStorage.getItem(Bs)==="true"}catch{return!1}}function ye(e){try{e?sessionStorage.setItem(Bs,"true"):sessionStorage.removeItem(Bs)}catch{}}function zs(e){return e==="/print-templates"||e.startsWith("/print-templates/")}function xo(){try{return sessionStorage.getItem(Hs)==="true"}catch{return!1}}function xe(e){try{e?sessionStorage.setItem(Hs,"true"):sessionStorage.removeItem(Hs)}catch{}}function So(){try{return sessionStorage.getItem(Fs)==="true"}catch{return!1}}function Se(e){try{e?sessionStorage.setItem(Fs,"true"):sessionStorage.removeItem(Fs)}catch{}}const rr='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';function ne(e,t,r,n,s){const i=r(e),o=(s==null?void 0:s.brandProductSecondLevel)===!0,a=o?"space-y-1 border-l-2 border-sidebar-active/40 pl-2.5":"space-y-0.5",l=o?"pl-0.5 pr-2.5":"px-2.5",u=o?"mt-1.5 space-y-0.5 border-l-2 border-sidebar-foreground/20 dark:border-white/25 ml-2 pl-3":"mt-1 space-y-0.5 border-l border-sidebar-foreground/15 dark:border-white/15 ml-3 pl-2",m=S=>{const p=S.sidebarChildren;if(p!=null&&p.length){const E=S.activePrefix??S.path,x=e===E||e.startsWith(`${E}/`),P=To(S.id,e,x),O=S.path===i,g=`pcm-sheet-tertiary-children-${S.id}`,N=n(e,S),D=`${h(S.title,S.titleEn)}${c("nav.tertiarySuffix")}`.replace(/"/g,"&quot;");return`
        <li class="mb-1">
          <button type="button"
            data-tertiary-sidebar-toggle="${S.id}"
            class="flex w-full min-h-11 items-center gap-2 rounded-lg ${l} py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${O?Te:te}"
            aria-expanded="${P}"
            aria-controls="${g}"
          >
            <span class="min-w-0 flex-1 truncate">${h(S.title,S.titleEn)}</span>
            <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${P?"":"-rotate-90"}">${rr}</span>
          </button>
          <ul id="${g}" class="${u} ${P?"":"hidden"}" role="list" aria-label="${D}" ${P?"":'aria-hidden="true"'}>
            ${p.map(Z=>{const W=Z.path===N;return`
            <li>
              <a href="#${Z.path}"
                class="flex min-h-9 items-center rounded-md px-2 py-1.5 text-xs sm:text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${W?Gs:te}"
                ${W?'aria-current="page"':""}
                tabindex="${P?"0":"-1"}"
              >${h(Z.title,Z.titleEn)}</a>
            </li>`}).join("")}
          </ul>
        </li>`}const f=S.path===i;return`
        <li class="mb-0.5">
          <a href="#${S.path}"
            class="flex min-h-9 items-center rounded-md ${l} py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${f?Gs:te}"
            ${f?'aria-current="page"':""}
          >${h(S.title,S.titleEn)}</a>
        </li>`},T=`<ul class="${a}" role="list">${t.map(m).join("")}</ul>`;return o?`<nav class="min-w-0" aria-label="${((s==null?void 0:s.sheetGroupedSubnavAriaLabel)??"商品管理 · 二级导航").replace(/"/g,"&quot;")}">${T}</nav>`:T}function Ee(e,t){return""}function ck(e,t){const r=R.find(O=>O.id==="product-center-main"),n=r.children,s=h(n[0].title,n[0].titleEn),i=h(n[1].title,n[1].titleEn),o=h(n[2].title,n[2].titleEn),a=d(`${h(r.title,r.titleEn)}${c("nav.secondarySuffix")}`),l=d(Q("nav.sheetNavFunction",{name:h(r.title,r.titleEn)})),u=`${i} · ${c("nav.subNavQualifier")}`,m=`${o} · ${c("nav.subNavQualifier")}`,T=t?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",k='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',S=Xp(e),p=Zp(e),f=Jp(e),E="pt-0",x=`${Ut} pt-3`,P=`
        <div class="space-y-4">
          <section class="${E}">
            <button
              type="button"
              data-pcm-sheet-bp-mgmt-toggle
              class="mb-2 flex w-full min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-semibold tracking-tight ${Cr} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              aria-expanded="${S}"
              aria-controls="pcm-sheet-bp-mgmt-children"
            >
              <span class="min-w-0 flex-1 truncate">${s}</span>
              <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${S?"":"-rotate-90"}">${rr}</span>
            </button>
            <div id="pcm-sheet-bp-mgmt-children" class="${S?"":"hidden"}" ${S?"":'aria-hidden="true"'}>
              ${ne(e,ti,Cm,qk,{brandProductSecondLevel:!0})}
            </div>
          </section>
          <section class="${x}">
            <button
              type="button"
              data-pcm-sheet-brand-menu-toggle
              class="mb-2 flex w-full min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-semibold tracking-tight ${Cr} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              aria-expanded="${p}"
              aria-controls="pcm-sheet-brand-menu-children"
            >
              <span class="min-w-0 flex-1 truncate">${i}</span>
              <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${p?"":"-rotate-90"}">${rr}</span>
            </button>
            <div id="pcm-sheet-brand-menu-children" class="${p?"":"hidden"}" ${p?"":'aria-hidden="true"'}>
              ${ne(e,ri,al,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:u})}
            </div>
          </section>
          <section class="${x}">
            <button
              type="button"
              data-pcm-sheet-store-menu-toggle
              class="mb-2 flex w-full min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-semibold tracking-tight ${Cr} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              aria-expanded="${f}"
              aria-controls="pcm-sheet-store-menu-children"
            >
              <span class="min-w-0 flex-1 truncate">${o}</span>
              <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${f?"":"-rotate-90"}">${rr}</span>
            </button>
            <div id="pcm-sheet-store-menu-children" class="${f?"":"hidden"}" ${f?"":'aria-hidden="true"'}>
              ${ne(e,nn,ll,tm,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:m})}
            </div>
          </section>
          <section class="${x}">
            ${ne(e,$m,wm,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:`${h(r.title,r.titleEn)} · ${c("nav.subNavQualifier")}`})}
          </section>
        </div>`;return`
    <div
      id="product-center-main-secondary-sheet"
      class="absolute inset-0 z-[31] flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${T}"
      ${t?"":"inert"}
      aria-hidden="${t?"false":"true"}"
      role="dialog"
      aria-modal="${t?"true":"false"}"
      aria-label="${a}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-product-center-main-secondary-close
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${k}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${h(r.title,r.titleEn)}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${l}">
        ${P}
      </nav>
    </div>`}function uk(e,t){const r=R.find(k=>k.id==="marketing"),{dialog:n,navFunc:s}=nt(r),i=c("sheet.marketingMgmt"),o=`${i} · ${c("nav.subNavQualifier")}`,a=t?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",l='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',u=em(e),T=`
        <div class="space-y-4">
          <section class="pt-0">
            <button
              type="button"
              data-marketing-sheet-mgmt-toggle
              class="mb-2 flex w-full min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-semibold tracking-tight ${Cr} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              aria-expanded="${u}"
              aria-controls="marketing-sheet-mgmt-children"
            >
              <span class="min-w-0 flex-1 truncate">${i}</span>
              <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${u?"":"-rotate-90"}">${rr}</span>
            </button>
            <div id="marketing-sheet-mgmt-children" class="${u?"":"hidden"}" ${u?"":'aria-hidden="true"'}>
              ${ne(e,nl,Rm,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:o})}
            </div>
          </section>
          ${wo.length>0?`<section class="${Ut} pt-3">
            ${ne(e,wo,km,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:`${h(r.title,r.titleEn)} · ${c("nav.subNavQualifier")}`})}
          </section>`:""}
        </div>`;return`
    <div
      id="marketing-secondary-sheet"
      class="absolute inset-0 z-[31] flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${a}"
      ${t?"":"inert"}
      aria-hidden="${t?"false":"true"}"
      role="dialog"
      aria-modal="${t?"true":"false"}"
      aria-label="${n}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-marketing-secondary-close
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${l}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${h(r.title,r.titleEn)}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${s}">
        ${T}
      </nav>
    </div>`}function pk(e,t){const r=R.find(u=>u.id==="promotions"),{dialog:n,navFunc:s}=nt(r),i=`${h(r.title,r.titleEn)} · ${c("nav.subNavQualifier")}`,o=t?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",a='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',l=`
        <div class="space-y-4">
          <section class="pt-0">
            ${ne(e,sl,Om,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:i})}
          </section>
          ${ko.length>0?`<section class="${Ut} pt-3">
            ${ne(e,ko,_m,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:`${h(r.title,r.titleEn)} · ${c("nav.subNavQualifier")}`})}
          </section>`:""}
        </div>`;return`
    <div
      id="promotions-secondary-sheet"
      class="absolute inset-0 z-[31] flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${o}"
      ${t?"":"inert"}
      aria-hidden="${t?"false":"true"}"
      role="dialog"
      aria-modal="${t?"true":"false"}"
      aria-label="${n}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-promotions-secondary-close
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${a}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${h(r.title,r.titleEn)}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${s}">
        ${l}
      </nav>
    </div>`}function mk(e,t){const r=R.find(u=>u.id==="members"),{dialog:n,navFunc:s}=nt(r),i=`${h(r.title,r.titleEn)}${c("nav.secondarySuffix")}`,o=t?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",a='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',l=`
        <div class="space-y-4">
          <section class="pt-0">
            ${ne(e,nr,Km,Vm,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:i})}
          </section>
          <section class="${Ut} pt-3">
            ${ne(e,Am,qm,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:`${h(r.title,r.titleEn)} · ${c("nav.subNavQualifier")}`})}
          </section>
        </div>`;return`
    <div
      id="members-secondary-sheet"
      class="absolute inset-0 z-[31] flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${o}"
      ${t?"":"inert"}
      aria-hidden="${t?"false":"true"}"
      role="dialog"
      aria-modal="${t?"true":"false"}"
      aria-label="${n}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-members-secondary-close
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${a}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${h(r.title,r.titleEn)}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${s}">
        ${l}
      </nav>
    </div>`}function gk(e,t){const r=R.find(u=>u.id==="gift-cards"),{dialog:n,navFunc:s}=nt(r),i=`${h(r.title,r.titleEn)} · ${c("nav.subNavQualifier")}`,o=t?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",a='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',l=`
        <div class="space-y-4">
          <section class="pt-0">
            ${ne(e,il,_o,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:i})}
          </section>
          <section class="${Ut} pt-3">
            ${ne(e,ol,_o,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:`${h(r.title,r.titleEn)} · ${c("nav.subNavQualifier")}`})}
          </section>
        </div>`;return`
    <div
      id="gift-cards-secondary-sheet"
      class="absolute inset-0 z-[31] flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${o}"
      ${t?"":"inert"}
      aria-hidden="${t?"false":"true"}"
      role="dialog"
      aria-modal="${t?"true":"false"}"
      aria-label="${n}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-gift-cards-secondary-close
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${a}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${h(r.title,r.titleEn)}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${s}">
        ${l}
      </nav>
    </div>`}function fk(e,t){const r=R.find(u=>u.id==="reports-finance"),{dialog:n,navFunc:s}=nt(r),i=`${h(r.title,r.titleEn)}${c("nav.secondarySuffix")}`,o=t?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",a='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',l=`
        <div class="space-y-4">
          <section class="pt-0">
            ${ne(e,rn,Um,jm,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:i})}
          </section>
        </div>`;return`
    <div
      id="reports-secondary-sheet"
      class="absolute inset-0 z-[31] flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${o}"
      ${t?"":"inert"}
      aria-hidden="${t?"false":"true"}"
      role="dialog"
      aria-modal="${t?"true":"false"}"
      aria-label="${n}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-reports-secondary-close
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${a}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${h(r.title,r.titleEn)}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${s}">
        ${l}
      </nav>
    </div>`}function bk(e,t){const r=R.find(m=>m.id==="print-templates"),{dialog:n,navFunc:s}=nt(r),i=Lt[0],o=h(i.title,i.titleEn),a=t?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",l='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',u=`
        <div class="space-y-4">
          <section class="pt-0">
            ${ne(e,Lt,Bm,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:o})}
          </section>
        </div>`;return`
    <div
      id="print-secondary-sheet"
      class="absolute inset-0 z-[31] flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${a}"
      ${t?"":"inert"}
      aria-hidden="${t?"false":"true"}"
      role="dialog"
      aria-modal="${t?"true":"false"}"
      aria-label="${n}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-print-secondary-close
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${l}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${h(r.title,r.titleEn)}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${s}">
        ${u}
      </nav>
    </div>`}function hk(e,t){const r=R.find(u=>u.id==="reservations"),{dialog:n,navFunc:s}=nt(r),i=`${h(r.title,r.titleEn)} · ${c("nav.subNavQualifier")}`,o=t?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",a='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',l=`
        <div class="space-y-4">
          <section class="pt-0">
            ${ne(e,tn,Hm,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:i})}
          </section>
        </div>`;return`
    <div
      id="reservations-secondary-sheet"
      class="absolute inset-0 z-[31] flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${o}"
      ${t?"":"inert"}
      aria-hidden="${t?"false":"true"}"
      role="dialog"
      aria-modal="${t?"true":"false"}"
      aria-label="${n}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-reservations-secondary-close
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${a}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${h(r.title,r.titleEn)}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${s}">
        ${l}
      </nav>
    </div>`}function vk(e,t){const r=R.find(u=>u.id==="finance-center"),{dialog:n,navFunc:s}=nt(r),i=`${h(r.title,r.titleEn)} · ${c("nav.subNavQualifier")}`,o=t?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",a='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',l=`
        <div class="space-y-4">
          <section class="pt-0">
            ${ne(e,si,Im,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:i})}
          </section>
          <section class="${Ut} pt-3">
            ${ne(e,Pm,Dm,Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:`${h(r.title,r.titleEn)} · ${c("nav.subNavQualifier")}`})}
          </section>
        </div>`;return`
    <div
      id="finance-center-secondary-sheet"
      class="absolute inset-0 z-[31] flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${o}"
      ${t?"":"inert"}
      aria-hidden="${t?"false":"true"}"
      role="dialog"
      aria-modal="${t?"true":"false"}"
      aria-label="${n}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-nav-module-sheet-secondary-close="finance-center"
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${a}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${d(h(r.title,r.titleEn))}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${s}">
        ${l}
      </nav>
    </div>`}function yk(e,t,r){const{dialog:n,navFunc:s}=nt(e),i=`${h(e.title,e.titleEn)} · ${c("nav.subNavQualifier")}`,o=r?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",a='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',l=ii(e),u=`
        <div class="space-y-4">
          <section class="pt-0">
            ${ne(t,l,T=>Lm(T,e),Ee,{brandProductSecondLevel:!0,sheetGroupedSubnavAriaLabel:i})}
          </section>
        </div>`;return`
    <div
      id="${`${e.id}-secondary-sheet`}"
      class="absolute inset-0 z-[31] flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${o}"
      ${r?"":"inert"}
      aria-hidden="${r?"false":"true"}"
      role="dialog"
      aria-modal="${r?"true":"false"}"
      aria-label="${n}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-nav-module-sheet-secondary-close="${e.id}"
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${a}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${d(h(e.title,e.titleEn))}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${s}">
        ${u}
      </nav>
    </div>`}function xk(e,t){const r=R.find(u=>u.id==="inventory-ordering"),n=d(c("inventory.sheetTitle")),s=d(c("inventory.sheetNav")),i=dk(),o=t?"translate-x-0 pointer-events-auto opacity-100":"translate-x-full pointer-events-none opacity-0",a='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',l=i.map(u=>{const m=e===u.path||e.startsWith(`${u.path}/`);return`
        <li>
          <a
            href="#${u.path}"
            class="flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${m?Te:te}"
            ${m?'aria-current="page"':""}
          >
            <span class="min-w-0 flex-1 truncate">${h(u.title,u.titleEn)}</span>
          </a>
        </li>`}).join("");return`
    <div
      id="inventory-secondary-sheet"
      class="absolute inset-0 z-30 flex flex-col ${Ve} bg-sidebar ${Qe} ${je} ${o}"
      ${t?"":"inert"}
      aria-hidden="${t?"false":"true"}"
      role="dialog"
      aria-modal="${t?"true":"false"}"
      aria-label="${n}"
    >
      <div class="flex h-14 shrink-0 items-center gap-1 ${Le} px-2">
        <button
          type="button"
          data-inventory-secondary-close
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${We} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="${d(c("nav.backToPrimaryNav"))}"
        >
          ${a}
        </button>
        <span class="min-w-0 truncate text-sm font-semibold ${Ce}">${h(r.title,r.titleEn)}</span>
      </div>
      <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="${s}">
        <ul class="space-y-1" role="list">${l}</ul>
      </nav>
    </div>`}function Sk(e){var S;if(e==="/ai-assistant/chat"||e.startsWith("/ai-assistant/"))return{title:c("findTitle.aiChat"),module:c("findTitle.aiModule")};if(e.startsWith("/gift-cards")){const p=R.find(x=>x.id==="gift-cards"),f=[...ni].sort((x,P)=>P.path.length-x.path.length);let E;for(const x of f)if(e===x.path||e.startsWith(`${x.path}/`)){E=x;break}return{title:E?h(E.title,E.titleEn):h(p.title,p.titleEn),module:c("findTitle.moduleGiftCards")}}if(e.startsWith("/members")){const p=R.find(x=>x.id==="members"),f=nr.find(x=>x.id==="mem-card-mgmt");if(f!=null&&f.sidebarChildren){const x=[...f.sidebarChildren].sort((P,O)=>O.path.length-P.path.length);for(const P of x)if(e===P.path||e.startsWith(`${P.path}/`))return{title:h(P.title,P.titleEn),module:c("findTitle.moduleMembersCards")}}const E=nr.find(x=>x.id==="mem-points");return e==="/members/points"||e.startsWith("/members/points/")?{title:h((E==null?void 0:E.title)??"积分配置",E==null?void 0:E.titleEn),module:c("findTitle.moduleMembers")}:{title:h(p.title,p.titleEn),module:c("findTitle.moduleMembers")}}if(ir(e)){for(const f of rn){if((S=f.sidebarChildren)!=null&&S.length){const E=[...f.sidebarChildren].sort((x,P)=>P.path.length-x.path.length);for(const x of E)if(e===x.path||e.startsWith(`${x.path}/`))return{title:h(x.title,x.titleEn),module:Q("findTitle.moduleReportsPrefix",{name:h(f.title,f.titleEn)})}}if(e===f.path||e.startsWith(`${f.path}/`))return{title:h(f.title,f.titleEn),module:c("findTitle.moduleReportsBase")}}const p=R.find(f=>f.id==="reports-finance");return{title:h((p==null?void 0:p.title)??"报表中心",p==null?void 0:p.titleEn),module:c("findTitle.moduleReportsBase")}}if(Gm(e)){const p=[...Lt].sort((x,P)=>P.path.length-x.path.length);let f;for(const x of p)if(e===x.path||e.startsWith(`${x.path}/`)){f=x;break}const E=R.find(x=>x.id==="print-templates");return{title:f?h(f.title,f.titleEn):h(E.title,E.titleEn),module:c("findTitle.modulePrint")}}if(Fm(e)){const p=[...tn].sort((x,P)=>P.path.length-x.path.length);let f;for(const x of p)if(e===x.path||e.startsWith(`${x.path}/`)){f=x;break}const E=R.find(x=>x.id==="reservations");return{title:f?h(f.title,f.titleEn):h(E.title,E.titleEn),module:c("findTitle.moduleReservations")}}const n=cl(e);if(n){const p=dl.find(f=>f.path===n);if(p)return{title:h(p.title,p.titleEn),module:c("findTitle.moduleTax")}}const s=ul(e);if(s){const p=oi.find(f=>f.path===s);if(p)return{title:h(p.title,p.titleEn),module:c("findTitle.moduleSeasoning")}}const i=pl(e);if(i){const p=ai.find(f=>f.path===i);if(p)return{title:h(p.title,p.titleEn),module:c("findTitle.moduleTags")}}const o=ml(e);if(o){const p=li.find(f=>f.path===o);if(p)return{title:h(p.title,p.titleEn),module:c("findTitle.moduleRecipes")}}const a=Xs(e);if(a){const p=pr.find(f=>f.path===a);if(p)return{title:h(p.title,p.titleEn),module:c("findTitle.moduleDmHw")}}const l=Zs(e);if(l){const p=Zr.find(f=>f.path===l);if(p)return{title:h(p.title,p.titleEn),module:c("findTitle.moduleTips")}}const u=Js(e);if(u){const p=Jr.find(f=>f.path===u);if(p)return{title:h(p.title,p.titleEn),module:c("findTitle.moduleTeamReports")}}const m=ei(e);if(m){const p=en.find(f=>f.path===m);if(p)return{title:h(p.title,p.titleEn),module:c("findTitle.moduleTeamScheduling")}}if(e==="/operations/inventory-ordering/inventory-change-log"||e.startsWith("/operations/inventory-ordering/inventory-change-log/"))return{title:c("findTitle.inventoryChangeTitle"),module:c("findTitle.inventoryChangeModule")};const T=eg(e);if(T)return T;const k=[...mm].sort((p,f)=>f.path.length-p.path.length);for(const p of k)if(e===p.path||e.startsWith(`${p.path}/`)){const f=e.startsWith("/brand-products")||e==="/brand-products"?c("findTitle.moduleBrandProducts"):e.startsWith("/brand-menu")||e==="/brand-menu"?c("findTitle.moduleBrandMenu"):c("findTitle.moduleStoreProducts");return{title:h(p.title,p.titleEn),module:f}}for(const p of R){if(p.path===e)return{title:h(p.title,p.titleEn),module:co(p)};const f=[...p.children].sort((E,x)=>x.path.length-E.path.length);for(const E of f)if(e===E.path||e.startsWith(`${E.path}/`))return{title:h(E.title,E.titleEn),module:Tw(p,E)}}return{title:c("findTitle.page"),module:void 0}}function mt(e,t){var n;return((n=t.matchPrefixes)!=null&&n.length?t.matchPrefixes:[t.path]).some(s=>e===s||e.startsWith(`${s}/`))}function Tk(e){for(const t of R){if(t.subNavPlacement!=="sheet")continue;const r=Fa[t.id];r!==void 0&&r!==e&&!mt(e,t)&&Rr(t.id,!1),Fa[t.id]=e}}function Ek(e){var n;let t,r=-1;for(const s of R){const i=(n=s.matchPrefixes)!=null&&n.length?s.matchPrefixes:[s.path];for(const o of i)(e===o||e.startsWith(`${o}/`))&&o.length>r&&(r=o.length,t=s)}return t}function w(e){const r=`#${e.startsWith("/")?e:`/${e}`}`;if(location.hash===r)return;const n=`${location.pathname}${location.search}${r}`;try{history.replaceState(history.state,"",n)}catch{location.replace(r)}}const Vp="sidebar-primary-nav-scrollTop",Dt={brand:"header-scope-filter-brand",region:"header-scope-filter-region",store:"header-scope-filter-store"};function $k(){const e=rt(),t=d(c("locale.label"));return`<div class="flex shrink-0 items-center">
      <label for="global-ui-locale" class="sr-only">${t}</label>
      <select
        id="global-ui-locale"
        title="${t}"
        class="h-9 max-w-[8.5rem] cursor-pointer rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-11 sm:max-w-none sm:px-2.5"
        aria-label="${t}"
      >
        <option value="zh" ${e==="zh"?"selected":""}>${d(c("locale.optionZh"))}</option>
        <option value="en" ${e==="en"?"selected":""}>${d(c("locale.optionEn"))}</option>
      </select>
    </div>`}function wk(){const e=document.getElementById("global-ui-locale");e&&(e.value=rt(),e.addEventListener("change",()=>{const t=e.value==="en"?"en":"zh";xw(t),Bp(t),window.dispatchEvent(new CustomEvent("menusifu:ui-locale-change",{detail:{locale:t}})),C()}))}function kk(){try{const e=sessionStorage.getItem(Vp);if(e==null)return 0;const t=Number(e);return Number.isFinite(t)&&t>=0?t:0}catch{return 0}}function ja(e){try{sessionStorage.setItem(Vp,String(Math.max(0,Math.floor(e))))}catch{}}function _k(){const e=location.hash.slice(1);if(e==="/config-center"||e.startsWith("/config-center/")){w("/settings/overview");return}if(e==="/product-center-a"||e.startsWith("/product-center-a/")){w("/dashboard/overview");return}if(e==="/product-center"||e==="/product-center/"){w("/brand-products/products");return}if(e==="/brand-products"||e==="/brand-products/"){w("/brand-products/products");return}if(e==="/brand-menu"||e==="/brand-menu/"){w("/brand-menu/menus");return}if(e==="/menu"||e==="/menu/"){w("/menu/store-menu");return}if(e==="/gift-cards"||e==="/gift-cards/"){w("/gift-cards/cards");return}if(e==="/gift-cards/design"||e==="/gift-cards/design/"||e.startsWith("/gift-cards/design/")){w("/gift-cards/cards");return}if(e==="/marketing/ai/ads"||e.startsWith("/marketing/ai/ads/")){w("/marketing/campaigns");return}if(e==="/marketing"||e==="/marketing/"){w("/marketing/campaigns");return}if(e==="/marketing/settings"||e.startsWith("/marketing/settings/")){w("/marketing/ads");return}if(e==="/promotions/settings/lottery-activity"||e.startsWith("/promotions/settings/lottery-activity/")||e==="/promotions/settings/lottery-activity-settings"||e.startsWith("/promotions/settings/lottery-activity-settings/")||e==="/promotions/settings/lottery-animation-settings"||e.startsWith("/promotions/settings/lottery-animation-settings/")){w("/promotions/lottery");return}if(e==="/promotions/settings"||e.startsWith("/promotions/settings/")){w("/promotions/campaigns");return}if(e==="/promotions/lottery/lottery-activity"||e.startsWith("/promotions/lottery/lottery-activity/")){w("/promotions/lottery/lottery-activity-settings");return}if(e==="/asset-center/overview"||e==="/asset-center/overview/"||e.startsWith("/asset-center/overview/")||e==="/asset-center/images"||e==="/asset-center/images/"||e.startsWith("/asset-center/images/")||e==="/asset-center/templates"||e==="/asset-center/templates/"||e.startsWith("/asset-center/templates/")){w("/asset-center/materials");return}if(e==="/reports"||e==="/reports/"){w("/reports/revenue");return}if(e==="/members"||e==="/members/"){w("/members/card/coupon-mgmt");return}if(e==="/print-templates"||e==="/print-templates/"){w("/print-templates/decoration");return}if(e==="/print-templates/list"||e==="/print-templates/list/"||e.startsWith("/print-templates/list/")){w("/print-templates/decoration");return}if(e==="/operations/reservations"||e==="/operations/reservations/"){w("/operations/reservations/waitlist");return}if(e==="/operations/reservations/language"||e==="/operations/reservations/language/"||e.startsWith("/operations/reservations/language/")||e==="/operations/reservations/refresh"||e==="/operations/reservations/refresh/"||e.startsWith("/operations/reservations/refresh/")){w("/operations/reservations/waitlist");return}if(e==="/operations/inventory-ordering"||e==="/operations/inventory-ordering/"){w("/operations/inventory-ordering/expiry");return}if(e==="/finance/register-audit"||e==="/finance/register-audit/"||e.startsWith("/finance/register-audit/?")){w("/finance/register-audit/payments");return}if(e==="/finance"||e==="/finance/"){w("/finance/overview");return}if(e==="/product-center-main"||e==="/product-center-main/"){w("/brand-products/products");return}if(e==="/reports/capital"||e==="/reports/capital/"||e.startsWith("/reports/capital/")){w("/dashboard/overview");return}if(e==="/store"||e==="/store/"||e.startsWith("/store/")){location.replace("#/stores/overview");return}if(e==="/ordering"||e==="/ordering/"||e.startsWith("/ordering/")){location.replace("#/dashboard/overview");return}if(e==="/payment-services"||e==="/payment-services/"||e.startsWith("/payment-services/")){location.replace("#/dashboard/overview");return}if(e==="/surcharge-fees"||e==="/surcharge-fees/"||e.startsWith("/surcharge-fees/")){location.replace("#/dashboard/overview");return}if(e==="/regions"||e==="/regions/"||e.startsWith("/regions/")){location.replace("#/stores/overview");return}if(e==="/operations/devices"||e==="/operations/devices/"){location.replace("#/device-management/overview");return}const t=e.match(/^\/operations\/devices\/([^/]+)(.*)$/);if(t){const o=t[1],a=t[2]??"",u={payments:"payments","cash-drawer":"cash-drawer",router:"router",pos:"pos","pos-go":"pos-go",kds:"kds","queue-display":"queue-display",printers:"printers",kiosk:"kiosk",emenu:"emenu"}[o];if(u){location.replace(`#/device-management/hardware/${u}${a}`);return}location.replace("#/device-management/overview");return}if(["/dashboard/shortcuts","/dashboard/locations"].some(o=>e===o||e.startsWith(`${o}/`))){location.replace("#/dashboard/overview");return}if(e==="/operations/customer-display"||e.startsWith("/operations/customer-display/")){location.replace("#/dashboard/overview");return}if(e==="/operations/store-patrol"||e.startsWith("/operations/store-patrol/")){location.replace("#/dashboard/overview");return}if(e==="/operations/floor-plan"||e.startsWith("/operations/floor-plan/")){location.replace("#/operations/queue-call/floor-plan");return}if(e==="/ai-assistant"||e==="/ai-assistant/"){location.replace("#/ai-assistant/chat");return}if(["/orders/dine-in","/orders/online","/orders/delivery","/orders/pickup"].some(o=>e===o||e.startsWith(`${o}/`))){location.replace("#/orders/all");return}if(["/menu/groups","/menu/items","/menu/availability"].some(o=>e===o||e.startsWith(`${o}/`))){location.replace("#/menu/store-menu");return}if(e==="/menu/inventory-change-log"||e.startsWith("/menu/inventory-change-log/")){const o=e.startsWith("/menu/inventory-change-log/")?e.slice(26):"";w(o?`/menu/inventory-changes${o}`:"/menu/inventory-changes");return}if(e==="/menu/product-recipe"||e.startsWith("/menu/product-recipe/")){const o=e.startsWith("/menu/product-recipe/")?e.slice(20):"";w(o?`/menu/recipe-list${o}`:"/menu/recipe-list");return}if(e==="/team/tips"||e==="/team/tips/"){w(hm());return}if(e==="/team/reports"||e==="/team/reports/"){w(ym());return}if(e==="/team/scheduling"||e==="/team/scheduling/"){w(Sm());return}if(e==="/menu/tax-types"||e==="/menu/tax-types/"){location.replace("#/menu/tax-types/settings");return}if(e==="/device-management/hardware"||e==="/device-management/hardware/"){location.replace(`#${gm()}`);return}if(e==="/brand-products/seasoning-mgmt"||e==="/brand-products/seasoning-mgmt/"){w(zm());return}if(e==="/brand-products/tags"||e==="/brand-products/tags/"){w(Ym());return}if(e==="/brand-products/recipes"||e==="/brand-products/recipes/"){w(Xm());return}const i=[["/brand-products/catalog","/brand-products/product-categories"],["/brand-products/categories","/brand-products/product-categories"],["/brand-products/specs","/brand-products/spec-groups"],["/brand-products/distribution","/brand-products/products"],["/brand-products/meal-groups","/brand-products/combo-groups"]];for(const[o,a]of i){if(e===o||e===`${o}/`){w(a);return}if(e.startsWith(`${o}/`)){w(`${a}${e.slice(o.length)}`);return}}for(const o of R)if((e===o.path||e===`${o.path}/`)&&o.defaultChildPath!==o.path){location.replace(`#${o.defaultChildPath}`);return}}function Wp(e){return`sidebar-nav-expanded:${e}`}function Qp(e,t){try{const r=sessionStorage.getItem(Wp(e.id));if(r==="true")return!0;if(r==="false")return!1}catch{}return mt(t,e)}function Pk(e,t){try{sessionStorage.setItem(Wp(e),t?"true":"false")}catch{}}function zp(e,t){const r=[...t].sort((n,s)=>s.path.length-n.path.length);for(const n of r)if(e===n.path||e.startsWith(`${n.path}/`))return n.path;return""}function Yp(e){return`tertiary-sidebar-expanded:${e}`}function To(e,t,r){try{const n=sessionStorage.getItem(Yp(e));if(n==="true")return!0;if(n==="false")return!1}catch{}return r}function Va(e,t){try{sessionStorage.setItem(Yp(e),t?"true":"false")}catch{}}function Xp(e){try{const t=sessionStorage.getItem(Fp);if(t==="true")return!0;if(t==="false")return!1}catch{}return e.startsWith("/brand-products")}function Nk(e){try{sessionStorage.setItem(Fp,e?"true":"false")}catch{}}function Zp(e){try{const t=sessionStorage.getItem(Gp);if(t==="true")return!0;if(t==="false")return!1}catch{}return e.startsWith("/brand-menu")}function Ik(e){try{sessionStorage.setItem(Gp,e?"true":"false")}catch{}}function Jp(e){try{const t=sessionStorage.getItem(Up);if(t==="true")return!0;if(t==="false")return!1}catch{}return e.startsWith("/menu")}function Dk(e){try{sessionStorage.setItem(Up,e?"true":"false")}catch{}}function em(e){try{const t=sessionStorage.getItem(jp);if(t==="true")return!0;if(t==="false")return!1}catch{}return e.startsWith("/marketing")}function Ak(e){try{sessionStorage.setItem(jp,e?"true":"false")}catch{}}function qk(e,t){return t.id==="bp-seasoning-mgmt"?ul(e):t.id==="bp-tags-mgmt"?pl(e):t.id==="bp-recipes-mgmt"?ml(e):""}function tm(e,t){return t.id==="sm-tax-types"?cl(e):""}const Lk='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';function Ck(e,t){const{navClass:r,navAriaLabel:n,heading:s,items:i,getActiveSubPath:o,getCollapsibleChildActivePath:a}=t,l=o(e),u=m=>{const T=m.sidebarChildren;if(T!=null&&T.length){const S=m.activePrefix??m.path,p=e===S||e.startsWith(`${S}/`),f=To(m.id,e,p),E=m.path===l,x=`tertiary-children-${m.id}`,P=a(e,m);return`
        <li class="mb-1">
          <button type="button"
            data-tertiary-sidebar-toggle="${m.id}"
            class="flex w-full min-h-11 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${E?"bg-primary/10 text-primary":"text-muted-foreground hover:bg-muted/60 hover:text-foreground"}"
            aria-expanded="${f}"
            aria-controls="${x}"
          >
            <span class="min-w-0 flex-1 truncate">${h(m.title,m.titleEn)}</span>
            <span class="shrink-0 text-muted-foreground transition-transform duration-200 ${f?"":"-rotate-90"}">${Lk}</span>
          </button>
          <ul id="${x}" class="mt-1 space-y-0.5 border-l border-border ml-3 pl-2 ${f?"":"hidden"}" role="list" ${f?"":'aria-hidden="true"'}>
            ${T.map(O=>{const g=O.path===P;return`
            <li>
              <a href="#${O.path}"
                class="flex min-h-9 items-center rounded-md px-2 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${g?"bg-primary/10 font-medium text-primary":"text-muted-foreground hover:bg-muted/60 hover:text-foreground"}"
                ${g?'aria-current="page"':""}
                tabindex="${f?"0":"-1"}"
              >${h(O.title,O.titleEn)}</a>
            </li>`}).join("")}
          </ul>
        </li>`}const k=m.path===l;return`
        <li>
          <a href="#${m.path}"
            class="flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${k?"bg-primary/10 font-medium text-primary":"text-muted-foreground hover:bg-muted/60 hover:text-foreground"}"
            ${k?'aria-current="page"':""}
          >${h(m.title,m.titleEn)}</a>
        </li>`};return`
    <nav class="${r} w-52 shrink-0 border-r border-border pr-4 ${Pt}" aria-label="${n}">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">${s}</p>
      <ul class="space-y-0.5">
        ${i.map(u).join("")}
      </ul>
    </nav>
  `}function Mk(e){const r=R.find(o=>o.id==="product-center-main").children.find(o=>o.id==="pcm-brand-menu"),n=h(r.title,r.titleEn),s=n.replace(/"/g,"&quot;"),i=al(e);return`
    <nav class="brand-menu-subnav w-52 shrink-0 border-r border-border pr-4 ${Pt}" aria-label="${s}">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">${n}</p>
      <ul class="space-y-0.5">
        ${ri.map(o=>{const a=o.path===i;return`
        <li>
          <a href="#${o.path}"
            class="flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${a?"bg-primary/10 font-medium text-primary":"text-muted-foreground hover:bg-muted/60 hover:text-foreground"}"
            ${a?'aria-current="page"':""}
          >${h(o.title,o.titleEn)}</a>
        </li>`}).join("")}
      </ul>
    </nav>
  `}function Rk(e){const r=R.find(s=>s.id==="product-center-main").children.find(s=>s.id==="pcm-store-mgmt"),n=h(r.title,r.titleEn);return Ck(e,{navClass:"store-menu-subnav",navAriaLabel:n.replace(/"/g,"&quot;"),heading:n,items:nn,getActiveSubPath:ll,getCollapsibleChildActivePath:tm})}function Ok(e){const t=R.find(o=>o.id==="device-management"),r=t.children.find(o=>o.id==="dm-hardware"),n=`${h(t.title,t.titleEn)} · ${h(r.title,r.titleEn)}`.replace(/"/g,"&quot;"),s=h(r.title,r.titleEn),i=Xs(e);return`
    <nav class="device-management-hardware-subnav w-52 shrink-0 border-r border-border pr-4 ${Pt}" aria-label="${n}">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">${s}</p>
      <ul class="space-y-0.5">
        ${pr.map(o=>{const a=o.path===i;return`
        <li>
          <a href="#${o.path}"
            class="flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${a?"bg-primary/10 font-medium text-primary":"text-muted-foreground hover:bg-muted/60 hover:text-foreground"}"
            ${a?'aria-current="page"':""}
          >${h(o.title,o.titleEn)}</a>
        </li>`}).join("")}
      </ul>
    </nav>
  `}function Kk(){const e=location.hash.slice(1)||"/dashboard/overview",t=mo(),r=go(),n=fo(),s=bo(),i=ho(),o=vo(),a=yo(),l=xo(),u=So(),m=R.some(k=>k.subNavPlacement==="sheet"&&Mr(k.id)),T=t||r||n||s||i||o||a||l||u||m?"opacity-40 pointer-events-none transition-opacity duration-300":"transition-opacity duration-300";return`
    <aside class="flex h-full min-h-0 w-72 shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar text-sidebar-foreground" aria-label="${d(c("shell.navAside"))}">
      <div class="flex h-14 shrink-0 items-center gap-2 ${Le} px-4">
        <span class="flex size-9 items-center justify-center rounded-lg bg-sidebar-active text-sidebar-active-fg" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h0v7"/></svg>
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold tracking-tight ${Ce}">${d(c("shell.appName"))}</p>
          <p class="truncate text-xs text-sidebar-muted">${d(c("shell.appTagline"))}</p>
        </div>
      </div>
      <div class="relative min-h-0 flex flex-1 flex-col overflow-hidden">
        <nav class="sidebar-primary-nav-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-3 ${T}" id="nav-tree" aria-label="${d(c("shell.navTree"))}">
          ${R.map(k=>Uk(k,e)).join("")}
        </nav>
        ${xk(e,t)}
        ${ck(e,r)}
        ${uk(e,n)}
        ${pk(e,s)}
        ${mk(e,i)}
        ${gk(e,o)}
        ${fk(e,a)}
        ${bk(e,l)}
        ${hk(e,u)}
        ${vk(e,Mr("finance-center"))}
        ${R.filter(k=>k.subNavPlacement==="sheet"&&k.id!=="finance-center").map(k=>yk(k,e,Mr(k.id))).join("")}
      </div>
    </aside>
  `}function Bk(e){const t=c("tertiaryNav.tips").replace(/"/g,"&quot;"),r=Zs(e);return`
    <nav class="tips-management-subnav w-52 shrink-0 border-r border-border pr-4 ${Pt}" aria-label="${t}">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">${c("tertiaryNav.tips")}</p>
      <ul class="space-y-0.5">
        ${Zr.map(n=>{const s=n.path===r;return`
        <li>
          <a href="#${n.path}"
            class="flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${s?"bg-primary/10 font-medium text-primary":"text-muted-foreground hover:bg-muted/60 hover:text-foreground"}"
            ${s?'aria-current="page"':""}
          >${h(n.title,n.titleEn)}</a>
        </li>`}).join("")}
      </ul>
    </nav>
  `}function Hk(e){const t=c("tertiaryNav.teamReports").replace(/"/g,"&quot;"),r=Js(e);return`
    <nav class="team-reports-subnav w-52 shrink-0 border-r border-border pr-4 ${Pt}" aria-label="${t}">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">${c("tertiaryNav.teamReports")}</p>
      <ul class="space-y-0.5">
        ${Jr.map(n=>{const s=n.path===r;return`
        <li>
          <a href="#${n.path}"
            class="flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${s?"bg-primary/10 font-medium text-primary":"text-muted-foreground hover:bg-muted/60 hover:text-foreground"}"
            ${s?'aria-current="page"':""}
          >${h(n.title,n.titleEn)}</a>
        </li>`}).join("")}
      </ul>
    </nav>
  `}function Fk(e){const t=c("tertiaryNav.teamScheduling").replace(/"/g,"&quot;"),r=ei(e);return`
    <nav class="team-scheduling-subnav w-52 shrink-0 border-r border-border pr-4 ${Pt}" aria-label="${t}">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">${c("tertiaryNav.teamScheduling")}</p>
      <ul class="space-y-0.5">
        ${en.map(n=>{const s=n.path===r;return`
        <li>
          <a href="#${n.path}"
            class="flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${s?"bg-primary/10 font-medium text-primary":"text-muted-foreground hover:bg-muted/60 hover:text-foreground"}"
            ${s?'aria-current="page"':""}
          >${h(n.title,n.titleEn)}</a>
        </li>`}).join("")}
      </ul>
    </nav>
  `}function Gk(e,t,r){const n=mt(t,e),s=zp(t,e.children),i=`sidebar-children-${e.id}`;return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button type="button"
        data-sidebar-toggle="${e.id}"
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${r}"
        aria-controls="${i}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${r?"":"-rotate-90"}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>
      </button>
      <ul id="${i}" class="mt-1 space-y-0.5 border-l border-sidebar-foreground/15 dark:border-white/15 ml-4 pl-2 ${r?"":"hidden"}" role="list" ${r?"":'aria-hidden="true"'}>
        ${e.children.map(a=>{const l=a.path===s,u=a.chainOnly?`<span class="ml-1 rounded bg-sidebar-active/25 px-1 py-px text-[10px] text-sidebar-active-fg">${d(c("badge.chain"))}</span>`:"";return`
        <li>
          <a href="#${a.path}"
            class="flex min-h-9 items-center rounded-md px-2 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${l?Gs:te}"
            ${l?'aria-current="page"':""}
            tabindex="${r?"0":"-1"}"
          ><span class="min-w-0 flex-1 truncate">${h(a.title,a.titleEn)}${u}</span></a>
        </li>`}).join("")}
      </ul>
    </div>`}function Uk(e,t){const r=e.defaultChildPath;if(e.id==="capital-turnover")return`
    <div class="mb-1" data-nav-module="${e.id}">
      <a
        href="${_w}"
        target="_blank"
        rel="noopener noreferrer"
        class="flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${te}"
        title="${d(c("capital.newTab"))}"
        aria-label="${d(c("capital.aria"))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-xs text-sidebar-muted/90" aria-hidden="true">↗</span>
      </a>
    </div>`;if(e.id==="product-center-main"){const n=Us(t),s=go();return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button
        type="button"
        data-product-center-main-sidebar-open
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${s}"
        aria-controls="product-center-main-secondary-sheet"
        title="${d(Q("nav.openSecondary",{name:U(e)}))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${s?"rotate-180":""}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span>
      </button>
    </div>`}if(e.id==="marketing"){const n=js(t),s=fo();return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button
        type="button"
        data-marketing-sidebar-open
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${s}"
        aria-controls="marketing-secondary-sheet"
        title="${d(Q("nav.openSecondary",{name:U(e)}))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${s?"rotate-180":""}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span>
      </button>
    </div>`}if(e.id==="promotions"){const n=Vs(t),s=bo();return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button
        type="button"
        data-promotions-sidebar-open
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${s}"
        aria-controls="promotions-secondary-sheet"
        title="${d(Q("nav.openSecondary",{name:U(e)}))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${s?"rotate-180":""}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span>
      </button>
    </div>`}if(e.id==="members"){const n=Ws(t),s=ho();return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button
        type="button"
        data-members-sidebar-open
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${s}"
        aria-controls="members-secondary-sheet"
        title="${d(Q("nav.openSecondary",{name:U(e)}))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${s?"rotate-180":""}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span>
      </button>
    </div>`}if(e.id==="reports-finance"){const n=ir(t),s=yo();return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button
        type="button"
        data-reports-sidebar-open
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${s}"
        aria-controls="reports-secondary-sheet"
        title="${d(Q("nav.openSecondary",{name:U(e)}))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${s?"rotate-180":""}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span>
      </button>
    </div>`}if(e.id==="print-templates"){const n=zs(t),s=xo();return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button
        type="button"
        data-print-sidebar-open
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${s}"
        aria-controls="print-secondary-sheet"
        title="${d(Q("nav.openSecondary",{name:U(e)}))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${s?"rotate-180":""}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span>
      </button>
    </div>`}if(e.id==="reservations"){const n=sr(t),s=So();return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button
        type="button"
        data-reservations-sidebar-open
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${s}"
        aria-controls="reservations-secondary-sheet"
        title="${d(Q("nav.openSecondary",{name:U(e)}))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${s?"rotate-180":""}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span>
      </button>
    </div>`}if(e.id==="gift-cards"){const n=Qs(t),s=vo();return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button
        type="button"
        data-gift-cards-sidebar-open
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${s}"
        aria-controls="gift-cards-secondary-sheet"
        title="${d(Q("nav.openSecondary",{name:U(e)}))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${s?"rotate-180":""}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span>
      </button>
    </div>`}if(e.id==="inventory-ordering"){const n=mt(t,e),s=mo();return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button
        type="button"
        data-inventory-sidebar-open
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${s}"
        aria-controls="inventory-secondary-sheet"
        title="${d(Q("nav.openSecondary",{name:U(e)}))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${s?"rotate-180":""}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span>
      </button>
    </div>`}if(e.subNavPlacement==="sheet"){const n=mt(t,e),s=Mr(e.id),i=`${e.id}-secondary-sheet`;return`
    <div class="mb-1" data-nav-module="${e.id}">
      <button
        type="button"
        data-nav-module-sheet-sidebar-open="${e.id}"
        class="flex w-full min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${n?Te:te}"
        aria-expanded="${s}"
        aria-controls="${i}"
        title="${d(Q("nav.openSecondary",{name:U(e)}))}"
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
        <span class="shrink-0 text-sidebar-muted transition-transform duration-200 ${s?"rotate-180":""}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span>
      </button>
    </div>`}if(e.subNavPlacement==="sidebar"){const n=Qp(e,t);return Gk(e,t,n)}return`
    <div class="mb-1" data-nav-module="${e.id}">
      <a href="#${r}"
        class="flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${mt(t,e)?Te:te}"
        ${mt(t,e)?'aria-current="page"':""}
      >
        <span class="text-sidebar-active shrink-0 [&>svg]:block" aria-hidden="true">${$e[e.icon]}</span>
        <span class="min-w-0 flex-1 truncate">${U(e)}</span>
      </a>
    </div>`}const jk=new Set(["/reviews/settings","/brand/settings"]),rm=new Map;function Wa(e){if(e==="/settings/overview"||e==="/menu/tax-types/settings")return!1;const t=Et(e);return t?e===t.settingsPath||e.startsWith(`${t.settingsPath}/`):jk.has(e)}function Yr(e){return e.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"item"}function Vk(e,t){return`${e}/${encodeURIComponent(Yr(t))}`}function nm(e){return`module-settings-cat-${Yr(e)}`}function Wk(e,t){if(!e.startsWith(`${t}/`))return"";const r=e.slice(t.length+1).split("/")[0]??"";try{return decodeURIComponent(r)}catch{return r}}function Eo(e,t,r){if(r.length===0||e===t)return;const n=Wk(e,t);if(n)return r.find(s=>Yr(s.groupKey)===Yr(n))}function sm(e){const t=nm(e),r=()=>{const n=document.getElementById(t);if(!n)return;const s=n.closest(".module-settings-scroll-host");if(s){const i=s.getBoundingClientRect(),o=n.getBoundingClientRect(),a=s.scrollTop+(o.top-i.top)-12;s.scrollTo({top:Math.max(0,a),behavior:"smooth"});return}n.scrollIntoView({behavior:"smooth",block:"start"})};requestAnimationFrame(()=>requestAnimationFrame(r))}function Qk(e){const t=Et(e);if(!t)return;const r=on(t.items,t.groupOrder),n=Eo(e,t.settingsPath,r);n&&sm(n.groupKey)}function zk(e,t){rm.set(e,Math.max(0,Math.floor(t)))}function Yk(e){const t=Et(e);if(!t)return;const r=rm.get(t.settingsPath);if(typeof r!="number")return;const n=document.querySelector(".module-settings-scroll-host");if(!n)return;const s=Math.max(0,n.scrollHeight-n.clientHeight);n.scrollTop=Math.min(r,s)}function Xk(){document.querySelectorAll(".module-settings-subnav a[href^='#']").forEach(e=>{e.addEventListener("click",()=>{var o;const t=(o=e.getAttribute("href"))==null?void 0:o.slice(1);if(!t)return;const r=Et(t);if(!r)return;const n=document.querySelector(".module-settings-scroll-host");n&&zk(r.settingsPath,n.scrollTop);const s=on(r.items,r.groupOrder),i=Eo(t,r.settingsPath,s);i&&window.setTimeout(()=>sm(i.groupKey),0)})})}function Zk(e,t){const r=Et(e);if(!r||r.items.length===0)return"";const n=on(r.items,r.groupOrder),s=Eo(e,r.settingsPath,n);return`
    <nav class="module-settings-subnav w-56 shrink-0 border-r border-border pr-4 ${Pt}" aria-label="${d(t)}">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">${d(t)}</p>
      <ul class="space-y-0.5" role="list">
        ${n.map(i=>{const o=Vk(r.settingsPath,i.groupKey),a=(s==null?void 0:s.groupKey)===i.groupKey;return`
              <li>
                <a href="#${o}"
                  class="flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${a?"bg-primary/10 font-medium text-primary":"text-muted-foreground hover:bg-muted/60 hover:text-foreground"}"
                  ${a?'aria-current="page"':""}
                >
                  <span class="min-w-0 flex-1 truncate">${d(i.groupTitle)}</span>
                  <span class="ml-2 shrink-0 text-xs tabular-nums text-muted-foreground">${i.items.length}</span>
                </a>
              </li>`}).join("")}
      </ul>
    </nav>
  `}function ae(e){try{const t=localStorage.getItem(ee(e));return t===null?Vo(e):t==="1"}catch{return Vo(e)}}function Jk(e,t){try{localStorage.setItem(ee(e),t?"1":"0")}catch{}}const im="bg-primary border-primary shadow-sm",om="bg-neutral-300 border-neutral-400/80 shadow-inner dark:bg-neutral-600 dark:border-neutral-500",e_="bg-white shadow-md ring-1 ring-black/10 dark:bg-neutral-100 dark:ring-white/15";function am(e){return e?"text-xs text-muted-foreground":"text-xs font-medium text-foreground"}function lm(e){return e?"text-xs font-medium text-foreground":"text-xs text-muted-foreground"}function V(e){const t=ae(e.seq),r=Q("moduleSettings.toggleAria",{name:e.title}),n=c(t?"moduleSettings.toggleOn":"moduleSettings.toggleOff"),s=t?im:om,i=t?"translate-x-5":"translate-x-0.5";return`
    <div class="flex shrink-0 items-center gap-2" data-module-setting-toggle-group>
      <span data-toggle-off-label class="${am(t)}">${d(c("moduleSettings.toggleOffLabel"))}</span>
      <button
        type="button"
        role="switch"
        aria-checked="${t?"true":"false"}"
        aria-label="${d(r)}"
        title="${d(n)}"
        data-module-setting-toggle="${e.seq}"
        class="module-setting-toggle relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${s}"
      >
        <span
          class="pointer-events-none block size-5 ${i} ${e_} rounded-full transition-transform duration-200"
          aria-hidden="true"
        ></span>
      </button>
      <span data-toggle-on-label class="${lm(t)}">${d(c("moduleSettings.toggleOnLabel"))}</span>
    </div>`}function t_(e){const t=e.sceneDesc.trim();return t?`<p class="m-0 text-xs leading-relaxed text-muted-foreground">${d(t)}</p>`:""}function v(e){const t=t_(e);return`
    <div class="min-w-0 flex flex-col gap-1">
      <span class="text-sm font-medium text-card-foreground">${d(e.title)}</span>
      ${t}
    </div>`}const et="size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";function r_(e){if(e.type==="text")return`<span class="text-sm text-foreground">${d(e.value)}</span>`;const t=F(e.fieldId,e.defaultValue),r=e.widthClass??"w-16",n=e.min!==void 0?` min="${e.min}"`:"",s=e.max!==void 0?` max="${e.max}"`:"";return`<input
    type="number"
    inputmode="numeric"
    class="${r} h-8 shrink-0 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    value="${d(String(t))}"
    data-module-setting-field="${d(e.fieldId)}"
    data-default-value="${e.defaultValue}"${n}${s}
  />`}function Ys(e,t){return`${e} / ${t}`}function n_(e){const t=e.titleLabel??"标题",r=e.contentLabel??"内容",n=Ge(e.titleFieldId,""),s=Ge(e.contentFieldId,""),i=n.length,o=s.length,a="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";return`
    <div class="space-y-4" data-copy-form-field="${d(e.fieldKey)}">
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">${d(t)}</label>
        <div class="relative">
          <input
            type="text"
            class="${a} pr-14"
            maxlength="${e.titleMaxLength}"
            value="${d(n)}"
            placeholder=""
            data-module-setting-text="${d(e.titleFieldId)}"
            data-max-length="${e.titleMaxLength}"
          />
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground" data-text-counter="title">${d(Ys(i,e.titleMaxLength))}</span>
        </div>
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">${d(r)}</label>
        <textarea
          rows="4"
          class="${a} min-h-[5rem] resize-y"
          maxlength="${e.contentMaxLength}"
          placeholder=""
          data-module-setting-text="${d(e.contentFieldId)}"
          data-max-length="${e.contentMaxLength}"
        >${d(s)}</textarea>
        <div class="flex justify-end">
          <span class="text-xs tabular-nums text-muted-foreground" data-text-counter="content">${d(Ys(o,e.contentMaxLength))}</span>
        </div>
      </div>
    </div>`}function s_(e,t){const r=`module-setting-nested-radio-${e}-${t.fieldKey}`,n=H(t.radioFieldId,t.radioDefault);return`<div class="flex flex-wrap items-center gap-4">${t.options.map(i=>{const o=n===i.value;return`
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input type="radio" name="${d(r)}" value="${d(i.value)}" class="${et}" ${o?"checked":""} data-module-setting-radio="${d(t.radioFieldId)}" />
        <span>${d(i.label)}</span>
      </label>`}).join("")}</div>`}function i_(e,t){return Vg(e,t.storageFieldId)}function o_(e,t){return Wg(e,t.storageFieldId)}function a_(e){return`<p class="m-0 text-xs leading-relaxed text-muted-foreground">${d(e.text)}</p>`}function l_(e,t){return`
    <div class="space-y-1.5">
      <p class="m-0 text-xs text-muted-foreground">${d(t.label)}</p>
      ${Al(e,t.fieldKey,t.storageFieldId,t.pickerUi??"checkbox")}
    </div>`}function d_(e,t){return`
    <div
      class="space-y-1.5 ${H(t.whenRadioFieldId,t.whenRadioDefault)!==t.whenRadioValue?"hidden":""}"
      data-conditional-panel
      data-when-radio-field="${d(t.whenRadioFieldId)}"
      data-when-radio-value="${d(t.whenRadioValue)}"
    >
      <p class="m-0 text-xs text-muted-foreground">${d(t.label)}</p>
      ${Al(e,t.fieldKey,t.storageFieldId)}
    </div>`}function c_(e){const t=e.label??"",r=Ge(e.textFieldId,""),n=e.maxLength??0,s=n>0?` maxlength="${n}"`:"",i=e.placeholder??"";return`
    <div class="space-y-1.5" data-nested-text-input="${d(e.fieldKey)}">
      ${t?`<label class="text-sm font-medium text-foreground">${d(t)}</label>`:""}
      <input
        type="text"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${d(r)}"
        placeholder="${d(i)}"${s}
        data-module-setting-text="${d(e.textFieldId)}"
      />
    </div>`}function Zn(e){document.querySelectorAll("[data-conditional-panel]").forEach(t=>{const r=t.getAttribute("data-when-radio-field");if(e&&r!==e)return;const n=t.getAttribute("data-when-radio-value")??"",s=r?document.querySelector(`[data-module-setting-radio="${r}"]:checked`):null,i=(s==null?void 0:s.value)??"";t.classList.toggle("hidden",i!==n),i!==n?t.setAttribute("aria-hidden","true"):t.removeAttribute("aria-hidden")})}function u_(e,t){return t.kind==="copy-form"?n_(t):t.kind==="hint"?a_(t):t.kind==="dish-tags"?l_(e,t):t.kind==="conditional-dish-tags"?d_(e,t):t.kind==="text-input"?c_(t):t.kind==="dish-mutex-rules"?i_(e,t):t.kind==="dish-combo-rules"?o_(e,t):t.kind==="radio"?s_(e,t):`
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 leading-relaxed">
        ${t.parts.map(r=>r_(r)).join("")}
      </div>`}function p_(e){const t=Og(e.seq);if(!t)return Nt(e);const r=ae(e.seq),n=r?"":"hidden",s=t.fields.map(i=>u_(e.seq,i)).join("");return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3 last:border-b-0">
            <div class="flex items-start justify-between gap-3">
              ${v(e)}
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            <div
              data-nested-panel="${e.seq}"
              class="module-setting-nested-panel mt-3 space-y-3 rounded-lg bg-muted/50 p-3 ${n}"
              ${r?"":'aria-hidden="true"'}
            >
              ${s}
            </div>
          </div>
        </li>`}function m_(e,t){document.querySelectorAll(`[data-nested-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true")})}function g_(e,t,r){const n=e.radioFieldId,s=H(n,e.radioDefault??"system"),i=s===t.value;if("label"in t)return`
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input type="radio" name="${d(r)}" value="${d(t.value)}" class="${et}" ${i?"checked":""} data-module-setting-radio="${d(n)}" />
        <span>${d(t.label)}</span>
      </label>`;const o=F(t.numberFieldId,t.numberDefault),a=s!==t.value?"disabled":"";return`
      <label class="inline-flex cursor-pointer flex-wrap items-center gap-2 text-sm text-foreground">
        <input type="radio" name="${d(r)}" value="${d(t.value)}" class="${et}" ${i?"checked":""} data-module-setting-radio="${d(n)}" />
        <span>${d(t.labelBefore)}</span>
        <input type="number" step="0.1" class="w-14 h-8 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" value="${d(String(o))}" data-module-setting-field="${d(t.numberFieldId)}" data-default-value="${t.numberDefault}" min="${t.numberMin??0}" max="${t.numberMax??99}" ${a} />
        <span>${d(t.labelAfter)}</span>
      </label>`}function f_(e){const t=xg(e.seq);if(!t)return Nt(e);const r=`module-setting-radio-${e.seq}`;if(t.kind==="checkbox-group"&&t.checkboxes){const n=t.checkboxes.map(s=>{const i=le(s.fieldId,s.defaultChecked);return`
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input type="checkbox" class="${et} rounded-sm" ${i?"checked":""} data-module-setting-checkbox="${d(s.fieldId)}" />
          <span>${d(s.label)}</span>
        </label>`}).join("");return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="flex flex-wrap items-center gap-4 sm:pt-0.5">${n}</div>
          </div>
        </li>`}if(t.kind==="radio-group"&&t.radios){const n=t.radios.map(s=>g_(t,s,r)).join("");return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="flex flex-wrap items-center gap-4 sm:pt-0.5">${n}</div>
          </div>
        </li>`}if(t.kind==="radio-color"&&t.radios){const n=t.radioFieldId,s=H(n,t.radioDefault??"system"),i=Tg(t.colorFieldId,t.colorDefault??"#ffffff"),o=t.customColorValue??"custom",a=t.radios.map(l=>{const u=s===l.value,T=l.value===o?`<input type="color" class="size-9 shrink-0 cursor-pointer rounded border border-input bg-background p-0.5 disabled:opacity-50" value="${d(i)}" data-module-setting-color="${d(t.colorFieldId)}" ${u?"":"disabled"} />`:"";return`
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input type="radio" name="${d(r)}" value="${d(l.value)}" class="${et}" ${u?"checked":""} data-module-setting-radio="${d(n)}" />
          <span>${d("label"in l?l.label:l.value)}</span>
          ${T}
        </label>`}).join("");return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="flex flex-wrap items-center gap-4 sm:pt-0.5">${a}</div>
          </div>
        </li>`}return`
        <li class="px-3 py-2.5">
          ${v(e)}
        </li>`}function Qa(e,t){document.querySelectorAll(`input[name="${e}"]`).forEach(r=>{const n=r.closest("label");if(!n)return;const s=n.querySelector("[data-module-setting-field]");s&&(s.disabled=r.value!==t);const i=n.querySelector("[data-module-setting-color]");i&&(i.disabled=r.value!==t)})}function b_(e){const t=hi.map(r=>{const n=vi(r.code),s=le(n,r.code==="en"||r.code==="zh-Hans");return`
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            class="${et} rounded-sm"
            ${s?"checked":""}
            data-locale-select-checkbox
            data-locale-code="${d(r.code)}"
            data-module-setting-checkbox="${d(n)}"
          />
          <span>${d(r.label)}</span>
        </label>`}).join("");return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 sm:pt-0.5">${t}</div>
          </div>
        </li>`}function h_(e){const t=Ll();return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="flex flex-wrap items-center gap-4 sm:pt-0.5" data-locale-default-radios>${t}</div>
          </div>
        </li>`}function v_(e){const t=bf(e.seq);return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3">
              ${Sf(e.seq,t)}
            </div>
          </div>
        </li>`}function y_(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3">
              ${ib(e.seq)}
            </div>
          </div>
        </li>`}function x_(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-3xl">
              ${BT(e.seq)}
            </div>
          </div>
        </li>`}function S_(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-3xl">
              ${jv(e.seq)}
            </div>
          </div>
        </li>`}function T_(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-4xl">
              ${rd()}
            </div>
          </div>
        </li>`}function E_(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3">
              ${dy()}
            </div>
          </div>
        </li>`}function br(e){return v(e)}function $_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${Qy()}
            ${br(e)}
            <div class="mt-3 max-w-xl">
              ${zy()}
            </div>
          </div>
        </li>`}function w_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              ${br(e)}
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
          </div>
        </li>`}function k_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${br(e)}
            ${Zy()}
          </div>
        </li>`}function __(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${br(e)}
            <div class="mt-3 max-w-md">
              ${tc(e.seq)}
            </div>
          </div>
        </li>`}function P_(e){const t=ae(e.seq);return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              ${br(e)}
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${nx(e.seq,t)}
          </div>
        </li>`}function N_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${Ox()}
            ${v(e)}
            <div class="mt-3 max-w-xl">
              ${Kx()}
            </div>
          </div>
        </li>`}function I_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-xl">
              ${Bx()}
            </div>
          </div>
        </li>`}function D_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-xs">
              ${Hx()}
            </div>
          </div>
        </li>`}function A_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-md">
              ${Fx()}
            </div>
          </div>
        </li>`}function q_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              ${v(e)}
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
          </div>
        </li>`}function L_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${p0()}
            ${v(e)}
            <div class="mt-3 max-w-lg">
              ${m0()}
            </div>
          </div>
        </li>`}function C_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-xl">
              ${f0()}
            </div>
          </div>
        </li>`}function M_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-lg">
              ${b0()}
            </div>
          </div>
        </li>`}function R_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${GS()}
            ${v(e)}
            <div class="mt-3 max-w-2xl">
              ${US()}
            </div>
          </div>
        </li>`}function Xr(e,t,r,n){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${n?gS():""}
            ${v(e)}
            ${r}
            <div class="mt-3 max-w-2xl">
              ${t}
            </div>
          </div>
        </li>`}function O_(e){return Xr(e,kS(),ES(),!1)}function K_(e){return Xr(e,PS(),$S(),!1)}function B_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-xl">
              ${XS()}
            </div>
          </div>
        </li>`}function H_(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-xl">
              ${cy()}
            </div>
          </div>
        </li>`}function F_(e){return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="w-full shrink-0 sm:max-w-xl sm:pt-0.5">
              ${LT()}
            </div>
          </div>
        </li>`}function G_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-4xl">
              ${X1()}
            </div>
          </div>
        </li>`}function U_(e){const t=ae(e.seq);return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${F1(e.seq,t)}
          </div>
        </li>`}function j_(e){const t=e.seq,r=ae(e.seq);return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${iT(t,r)}
          </div>
        </li>`}function V_(e){const t=e.seq,r=ae(e.seq);return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${bT(t,r)}
          </div>
        </li>`}function W_(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-4xl">
              ${vT()}
            </div>
          </div>
        </li>`}function Q_(e){return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="w-full shrink-0 sm:max-w-xs sm:pt-0.5">
              ${K1()}
            </div>
          </div>
        </li>`}function z_(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3 max-w-4xl">
              ${_T()}
            </div>
          </div>
        </li>`}function Y_(e){const t=ae(e.seq);return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${P1(e.seq,t)}
          </div>
        </li>`}function X_(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3">${A1()}</div>
          </div>
        </li>`}function Z_(e){return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="w-full shrink-0 sm:max-w-md sm:pt-0.5">${q1()}</div>
          </div>
        </li>`}function J_(e){return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="shrink-0 sm:pt-0.5">${F2()}</div>
          </div>
        </li>`}function eP(e){const t=ae(e.seq);return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${W2()}
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${Q2(t)}
          </div>
        </li>`}function tP(e){return`
        <li class="list-none" data-daily-close-cash-option data-module-setting-row-seq="${e.seq}">
          <div class="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="shrink-0 pt-0.5">${V(e)}</div>
          </div>
        </li>`}function rP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${i1()}
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 sm:pt-0.5">${o1()}</div>
            </div>
            ${d1()}
          </div>
        </li>`}function nP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="shrink-0 sm:pt-0.5">${c1()}</div>
          </div>
        </li>`}function sP(e){const t=ae(e.seq);return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${u1(e.seq,t)}
          </div>
        </li>`}function iP(e){const t=C2(e.seq);return t?`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="shrink-0 sm:pt-0.5">${t}</div>
          </div>
        </li>`:Nt(e)}function oP(e){return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="w-full shrink-0 sm:max-w-md sm:pt-0.5">${M2()}</div>
          </div>
        </li>`}function aP(e){const t=u2(e.seq);return t?`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="shrink-0 sm:pt-0.5">${t}</div>
          </div>
        </li>`:Nt(e)}function za(e,t){return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="w-full shrink-0 sm:max-w-md sm:pt-0.5">${t}</div>
          </div>
        </li>`}function lP(e){const t=ae(e.seq);return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              ${v(e)}
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${e2(e.seq,t)}
          </div>
        </li>`}function dP(e){return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="shrink-0 sm:pt-0.5">${Ib()}</div>
          </div>
        </li>`}function cP(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3">
              ${Db()}
            </div>
          </div>
        </li>`}function uP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="w-full shrink-0 sm:max-w-xl sm:pt-0.5">${wb()}</div>
          </div>
        </li>`}function Ya(e,t){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="w-full shrink-0 sm:max-w-md sm:pt-0.5">${t}</div>
          </div>
        </li>`}function pP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="shrink-0 sm:pt-0.5">${ev()}</div>
          </div>
        </li>`}function mP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
          </div>
        </li>`}function gP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="shrink-0 sm:pt-0.5">${Mh()}</div>
          </div>
        </li>`}function fP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="w-full shrink-0 sm:max-w-md sm:pt-0.5">${Oh()}</div>
          </div>
        </li>`}function dm(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
          </div>
        </li>`}function bP(e){return dm(e)}function hP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="w-full shrink-0 sm:max-w-md sm:pt-0.5">${oh()}</div>
          </div>
        </li>`}function vP(e){const t=ae(e.seq);return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${nh(e.seq,t)}
          </div>
        </li>`}function yP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="shrink-0 sm:pt-0.5">${bh()}</div>
          </div>
        </li>`}function xP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
          </div>
        </li>`}function SP(e){const t=ae(e.seq);return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${Th(e.seq,t)}
          </div>
        </li>`}function TP(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            ${Jf()}
          </div>
        </li>`}function EP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3">
              ${P$(e.seq)}
            </div>
          </div>
        </li>`}function $P(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0 flex-1">${v(e)}</div>
              <div class="w-full shrink-0 sm:max-w-3xl">${S$()}</div>
            </div>
          </div>
        </li>`}function wP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3">
              ${O$(e.seq)}
            </div>
          </div>
        </li>`}function kP(e){return`
        <li class="list-none" data-module-setting-row-seq="${e.seq}">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">${v(e)}</div>
            <div class="shrink-0 sm:pt-0.5">${M$()}</div>
          </div>
        </li>`}function _P(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3">
              ${n$(e.seq)}
            </div>
          </div>
        </li>`}function PP(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            ${Qx()}
          </div>
        </li>`}const cm={66:{fieldId:"66-mandatory-break-minutes",defaultValue:30,min:1,max:240,unit:"分钟"},67:{fieldId:"67-continuous-work-hour-limit",defaultValue:8,min:1,max:24,unit:"小时"},71:{fieldId:"71-max-work-hours",defaultValue:12,min:1,max:24,unit:"小时"},329:{fieldId:"329-paid-break-minutes",defaultValue:10,min:0,max:240,unit:"分钟"},306:{fieldId:"306-tip-share-ratio",defaultValue:0,min:0,max:100,unit:"%"}},um={72:{fieldId:"72-reset-start-work-hhmm",defaultValue:"09:00"}};function NP(e){return cm[e]!==void 0}function IP(e){return um[e]!==void 0}function DP(e,t){return/^\d{2}:\d{2}$/.test(e)?e:t}function AP(e){const t=cm[e.seq];if(!t)return Nt(e);const r=F(t.fieldId,t.defaultValue),n=Math.min(t.max,Math.max(t.min,Math.round(r)));return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="inline-flex items-center gap-2 sm:pt-0.5">
              <input
                type="number"
                inputmode="numeric"
                class="h-8 w-20 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value="${d(String(n))}"
                min="${t.min}"
                max="${t.max}"
                data-module-setting-number="${d(t.fieldId)}"
              />
              <span class="text-sm text-muted-foreground">${t.unit}</span>
            </div>
          </div>
        </li>`}function qP(e){const t=um[e.seq];if(!t)return Nt(e);const r=Ge(t.fieldId,t.defaultValue),n=DP(r,t.defaultValue);return`
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            ${v(e)}
            <div class="inline-flex items-center gap-2 sm:pt-0.5">
              <input
                type="time"
                step="60"
                class="h-8 w-28 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value="${d(n)}"
                data-module-setting-text="${d(t.fieldId)}"
              />
              <span class="text-sm text-muted-foreground">时:分</span>
            </div>
          </div>
        </li>`}const LP=[{fieldId:"582-c-line-kiosk",label:"Kiosk",defaultChecked:!0},{fieldId:"582-c-line-emenu",label:"eMenu",defaultChecked:!0},{fieldId:"582-c-line-sdi",label:"SDI",defaultChecked:!0}],CP=[{fieldId:"530-c-line-kiosk",label:"Kiosk",defaultChecked:!0},{fieldId:"530-c-line-emenu",label:"eMenu",defaultChecked:!0},{fieldId:"530-c-line-sdi",label:"SDI",defaultChecked:!0}],Xa="582-alert-minutes",MP=15,Za=1,Ja=180;function RP(e,t){const r=LP.map(o=>{const a=le(o.fieldId,o.defaultChecked);return`
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input type="checkbox" class="${et} rounded-sm" ${a?"checked":""} data-module-setting-checkbox="${d(o.fieldId)}" />
        <span>${d(o.label)}</span>
      </label>`}).join(""),n=F(Xa,MP),s=Math.min(Ja,Math.max(Za,Math.round(n)));return`
    <div class="mt-3 rounded-lg bg-muted/50 p-3 ${t?"":"hidden"}" data-store-closing-alert-panel="${e}" ${t?"":'aria-hidden="true"'}>
      <div class="flex flex-wrap items-center gap-2">
        <p class="m-0 text-xs text-muted-foreground">结束前</p>
        <input
          type="number"
          inputmode="numeric"
          class="h-8 w-20 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value="${d(String(s))}"
          min="${Za}"
          max="${Ja}"
          data-module-setting-number="${Xa}"
        />
        <p class="m-0 text-xs text-muted-foreground">分钟进行提示</p>
      </div>
      <p class="m-0 text-xs text-muted-foreground">C端产品线（多选）</p>
      <div class="mt-2 flex flex-wrap items-center gap-4">${r}</div>
    </div>`}function OP(e,t){const r=CP.map(s=>{const i=le(s.fieldId,s.defaultChecked);return`
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input type="checkbox" class="${et} rounded-sm" ${i?"checked":""} data-module-setting-checkbox="${d(s.fieldId)}" />
        <span>${d(s.label)}</span>
      </label>`}).join("");return`
    <div class="mt-3 rounded-lg bg-muted/50 p-3 ${t?"":"hidden"}" data-store-brand-setting-panel="${e}" ${t?"":'aria-hidden="true"'}>
      <p class="m-0 text-xs text-muted-foreground">C端产品线（多选）</p>
      <div class="mt-2 flex flex-wrap items-center gap-4">${r}</div>
    </div>`}function KP(e){const t=ae(e.seq);return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              ${v(e)}
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${OP(e.seq,t)}
          </div>
        </li>`}function BP(e){const t=ae(e.seq);return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              ${v(e)}
              <div class="shrink-0 pt-0.5">${V(e)}</div>
            </div>
            ${RP(e.seq,t)}
          </div>
        </li>`}function HP(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3">
              ${XE(e.seq)}
            </div>
          </div>
        </li>`}function FP(e,t){document.querySelectorAll(`[data-store-brand-setting-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true")})}function GP(e,t){document.querySelectorAll(`[data-store-closing-alert-panel="${e}"]`).forEach(r=>{r.classList.toggle("hidden",!t),t?r.removeAttribute("aria-hidden"):r.setAttribute("aria-hidden","true")})}function UP(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            <div class="mt-3">
              ${VE(e.seq)}
            </div>
          </div>
        </li>`}function jP(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            ${WT()}
          </div>
        </li>`}function VP(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            ${ME()}
          </div>
        </li>`}function WP(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            ${v(e)}
            ${fE()}
          </div>
        </li>`}function QP(e){return`
        <li class="list-none">
          <div class="border-b border-border px-4 py-3">
            <div class="min-w-0">
              <p class="m-0 text-sm font-medium text-foreground">行级合并规则</p>
              <p class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">按票据类型分别配置是否将相同主菜/子菜合并为一行并汇总数量。厨房单、打包单、食客收据可独立开关。</p>
            </div>
            ${ub(ae)}
          </div>
        </li>`}function Nt(e){if(Rf(e.seq)||Xf(e.seq)||cb(e.seq)||qv(e.seq)||Bb(e.seq))return"";if(Av(e.seq))return Lv(et,e.sceneDesc);if(Mf(e.seq))return Cf();if(ff(e.seq))return v_(e);if(nb(e.seq))return y_(e);if(OT(e.seq))return x_(e);if(Bv(e.seq))return S_(e);if(Kb(e.seq))return T_(e);if(ay(e.seq))return E_(e);if(ly(e.seq))return H_(e);if(jy(e.seq))return $_(e);if(Wy(e.seq))return w_(e);if(Vy(e.seq))return __(e);if(Uy(e.seq))return k_(e);if(ec(e.seq))return P_(e);if(oc(e.seq))return yx(e,V,ae);if(qx(e.seq))return N_(e);if(Lx(e.seq))return I_(e);if(Cx(e.seq))return D_(e);if(Mx(e.seq))return A_(e);if(Rx(e.seq))return q_(e);if(d0(e.seq))return L_(e);if(c0(e.seq))return C_(e);if(u0(e.seq))return M_(e);if(FS(e.seq))return R_(e);if(cS(e.seq))return Xr(e,hS(),fS(),!0);if(uS(e.seq))return Xr(e,TS(),bS(),!1);if(pS(e.seq))return O_(e);if(mS(e.seq))return K_(e);if(YS(e.seq))return B_(e);if(Y1(e.seq))return G_(e);if(Mu(e.seq))return U_(e);if(Wu(e.seq))return j_(e);if(tp(e.seq))return V_(e);if(gT(e.seq))return W_(e);if(O1(e.seq))return Q_(e);if(ET(e.seq))return z_(e);if(c2(e.seq))return aP(e);if(D2(e.seq))return iP(e);if(A2(e.seq))return oP(e);if(Du(e.seq))return Y_(e);if(E1(e.seq))return X_(e);if($1(e.seq))return Z_(e);if(B2(e.seq))return J_(e);if(du(e.seq))return eP(e);if(V2(e.seq))return tP(e);if(n1(e.seq))return rP(e);if(s1(e.seq))return nP(e);if(Su(e.seq))return sP(e);if(g2(e.seq))return za(e,h2());if(x2(e.seq))return S2(e.title,e.sceneDesc);if(f2(e.seq))return za(e,v2());if(qT(e.seq))return F_(e);if(Qc(e.seq))return lP(e);if(Yf(e.seq))return TP(e);if(xb(e.seq))return dP(e);if(Sb(e.seq))return cP(e);if(Tb(e.seq))return uP(e);if(Jb(e.seq))return hP(e);if(dd(e.seq))return vP(e);if(mh(e.seq))return yP(e);if(gh(e.seq))return xP(e);if(bd(e.seq))return SP(e);if(eh(e.seq)){const r=V(e);return`
        <li class="px-3 py-2.5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">${v(e)}</div>
            ${r}
          </div>
        </li>`}if(Xh(e.seq))return pP(e);if(Zh(e.seq))return mP(e);if(Ah(e.seq))return gP(e);if(qh(e.seq))return fP(e);if(Lh(e.seq))return dm(e);if(Wh(e.seq))return bP(e);if(c$(e.seq))return Ya(e,p$());if(u$(e.seq))return Ya(e,m$());if(k$(e.seq))return EP(e);if(x$(e.seq))return $P(e);if(q$(e.seq))return wP(e);if(L$(e.seq))return kP(e);if(t$(e.seq))return _P(e);if(Vx(e.seq))return PP(e);if(IP(e.seq))return qP(e);if(NP(e.seq))return AP(e);if(e.seq===530)return KP(e);if(e.seq===582)return BP(e);if(YE(e.seq))return HP(e);if(jE(e.seq))return UP(e);if(UT(e.seq))return jP(e);if(gE(e.seq))return WP(e);if(CE(e.seq))return VP(e);if(db(e.seq))return QP();if(nf(e.seq))return b_(e);if(sf(e.seq))return h_(e);if(Sg(e.seq))return f_(e);if(El(e.seq))return p_(e);const t=Pv(e.seq)?V(e):"";return`
        <li class="px-3 py-2.5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">${v(e)}</div>
            ${t}
          </div>
        </li>`}function el(e){const t=e.getAttribute("aria-checked")==="true",r=e.querySelector("span");r&&(r.classList.toggle("translate-x-5",t),r.classList.toggle("translate-x-0.5",!t));for(const o of im.split(/\s+/))e.classList.toggle(o,t);for(const o of om.split(/\s+/))e.classList.toggle(o,!t);const n=e.closest("[data-module-setting-toggle-group]"),s=n==null?void 0:n.querySelector("[data-toggle-off-label]"),i=n==null?void 0:n.querySelector("[data-toggle-on-label]");s&&(s.className=am(t)),i&&(i.className=lm(t))}function zP(){document.querySelectorAll("[data-module-setting-toggle]").forEach(e=>{el(e),e.dataset.moduleSettingToggleBound!=="1"&&(e.dataset.moduleSettingToggleBound="1",e.addEventListener("click",()=>{const t=Number(e.getAttribute("data-module-setting-toggle"));if(!t)return;const r=e.getAttribute("aria-checked")!=="true";e.setAttribute("aria-checked",r?"true":"false"),e.title=c(r?"moduleSettings.toggleOn":"moduleSettings.toggleOff"),el(e),Jk(t,r),El(t)&&m_(t,r),t===530&&FP(t,r),t===582&&GP(t,r),Qc(t)&&t2(t,r),dd(t)&&sh(t,r),bd(t)&&Eh(t,r),ec(t)&&sx(t,r),Du(t)&&(r&&T1(),N1(t,r)),du(t)&&(cu(t,r),Ts(r)),Su(t)&&p1(t,r),Mu(t)&&(r&&H1(),G1(t,r)),Wu(t)&&(r&&sT(t),oT(t,r)),tp(t)&&(r&&fT(t),hT(t,r)),oc(t)&&bx(t,r)}))})}function tl(e){const t=Number(e.getAttribute("data-max-length")??"0");if(!t)return;const r=e.tagName==="TEXTAREA"?"content":"title",n=e.closest("[data-copy-form-field]"),s=n==null?void 0:n.querySelector(`[data-text-counter="${r}"]`);s&&(s.textContent=Ys(e.value.length,t))}function YP(){document.querySelectorAll("[data-module-setting-field]").forEach(e=>{if(e.dataset.moduleSettingFieldBound==="1")return;e.dataset.moduleSettingFieldBound="1";const t=e.getAttribute("data-module-setting-field");if(!t)return;const r=()=>{const n=Number(e.value);Number.isFinite(n)&&ui(t,n)};e.addEventListener("change",r),e.addEventListener("blur",r)}),document.querySelectorAll("[data-module-setting-text]").forEach(e=>{if(e.dataset.moduleSettingTextBound==="1")return;e.dataset.moduleSettingTextBound="1";const t=e.getAttribute("data-module-setting-text");if(!t)return;tl(e);const r=()=>{const n=Number(e.getAttribute("maxlength")??"0"),s=n>0?e.value.slice(0,n):e.value;e.value!==s&&(e.value=s),Eg(t,s),tl(e)};e.addEventListener("input",r),e.addEventListener("blur",r)})}function XP(){document.querySelectorAll("[data-module-setting-checkbox]").forEach(e=>{if(e.dataset.moduleSettingFormBound==="1")return;e.dataset.moduleSettingFormBound="1";const t=e.getAttribute("data-module-setting-checkbox");t&&e.addEventListener("change",()=>{Sl(t,e.checked)})}),document.querySelectorAll("[data-module-setting-radio]").forEach(e=>{if(e.dataset.moduleSettingFormBound==="1")return;e.dataset.moduleSettingFormBound="1";const t=e.getAttribute("data-module-setting-radio"),r=e.name;if(!t||!r)return;const n=()=>{e.checked&&(Ht(t,e.value),Qa(r,e.value),Zn(t))};e.addEventListener("change",n),e.checked&&(Qa(r,e.value),Zn(t))}),Zn(),document.querySelectorAll("[data-module-setting-color]").forEach(e=>{if(e.dataset.moduleSettingFormBound==="1")return;e.dataset.moduleSettingFormBound="1";const t=e.getAttribute("data-module-setting-color");t&&(e.addEventListener("input",()=>Do(t,e.value)),e.addEventListener("change",()=>Do(t,e.value)))}),document.querySelectorAll("[data-module-setting-number]").forEach(e=>{if(e.dataset.moduleSettingFormBound==="1")return;e.dataset.moduleSettingFormBound="1";const t=e.getAttribute("data-module-setting-number");if(!t)return;const r=Number(e.getAttribute("min")??"-Infinity"),n=Number(e.getAttribute("max")??"Infinity"),s=()=>{const i=Number(e.value);if(!Number.isFinite(i))return;const o=Math.min(n,Math.max(r,Math.round(i)));e.value=String(o),ui(t,o)};e.addEventListener("change",s),e.addEventListener("blur",s)})}function ZP(e,t){const r=Et(e),n=(r==null?void 0:r.items)??[];if(n.length===0)return`
    <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 class="text-base font-semibold tracking-tight text-card-foreground">${d(t)}</h2>
      <p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">${c("moduleSettings.empty")}</p>
    </div>`;const s=Et(e),i=on(n,s==null?void 0:s.groupOrder),o=Q("moduleSettings.count",{count:String(n.length)}),a=i.map(l=>{const u=nm(l.groupKey),m=l.items.map(T=>Nt(T)).filter(T=>T.trim()!=="").join("");return`
      <section
        id="${u}"
        class="module-settings-category-card scroll-mt-4 rounded-xl border border-border bg-card shadow-sm"
        aria-label="${d(Q("moduleSettings.categoryAria",{category:l.groupTitle}))}"
      >
        <div class="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
          <h3 class="text-sm font-semibold text-card-foreground">${d(l.groupTitle)}</h3>
          <span class="shrink-0 text-xs tabular-nums text-muted-foreground">${l.items.length}</span>
        </div>
        <ul class="m-0 list-none divide-y divide-border p-0" role="list">${m}</ul>
      </section>`}).join("");return`
    <div class="module-settings-main space-y-4">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p class="text-sm leading-relaxed text-muted-foreground">${c("moduleSettings.intro")}</p>
        <p class="mt-2 text-xs font-medium tabular-nums text-muted-foreground">${d(o)}</p>
      </div>
      <div class="flex flex-col gap-4">${a}</div>
    </div>`}function JP(){const e=bm.map(t=>`
      <li>
        <a
          href="#${t.path}"
          class="group flex min-h-[4.25rem] flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors duration-200 hover:border-primary/35 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span class="text-sm font-semibold text-card-foreground group-hover:text-primary">${h(t.title,t.titleEn)}</span>
          <span class="mt-0.5 text-xs text-muted-foreground">${rt()==="en"?t.title:t.titleEn??""}</span>
        </a>
      </li>`).join("");return`
    <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 class="text-base font-semibold tracking-tight text-card-foreground">${c("settings.overview.title")}</h2>
      <p class="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        ${c("settings.overview.desc")}
      </p>
      <ul class="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3" role="list">
        ${e}
      </ul>
    </div>
  `}function eN(){const e=c("ai.welcomeHtml"),t="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",r=d(c("ai.voice"));return`
    <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-4" id="ai-assistant-root">
      <div class="rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-sm leading-relaxed text-muted-foreground dark:bg-primary/10">
        <p class="flex items-start gap-2">
          <span class="mt-0.5 shrink-0 text-primary" aria-hidden="true">${Hp}</span>
          <span>${c("ai.contextNote")}</span>
        </p>
      </div>
      <div class="flex flex-wrap gap-2" role="group" aria-label="${d(c("ai.quickAria"))}">
        <button type="button" class="${t}" data-ai-quick-prompt="帮我查一下权限管理中心里店长和收银员的区别">${d(c("ai.quick.permissions"))}</button>
        <button type="button" class="${t}" data-ai-quick-prompt="搜索一下和打印中心相关的设置在哪里">${d(c("ai.quick.search"))}</button>
        <button type="button" class="${t}" data-ai-quick-prompt="分析一下最近一周各门店营业额趋势">${d(c("ai.quick.analysis"))}</button>
        <button type="button" class="${t}" data-ai-quick-prompt="我想把旗舰店的营业时间改成早上8点到晚上11点">${d(c("ai.quick.config"))}</button>
        <a href="#/permissions/overview" class="inline-flex items-center rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/35 hover:text-foreground">${d(c("ai.link.permissions"))}</a>
      </div>
      <div
        id="ai-assistant-thread"
        class="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-muted/25 p-4 dark:bg-muted/15"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div class="flex justify-start">
          <div class="max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm leading-relaxed text-card-foreground shadow-sm sm:max-w-[85%]">
            ${e}
            <p class="mt-2 text-xs text-muted-foreground">${c("ai.tipVoiceLang")}</p>
          </div>
        </div>
      </div>
      <form id="ai-assistant-form" class="flex min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-end">
        <div class="min-w-0 w-full flex-1 overflow-hidden sm:min-w-0">
          <label for="ai-assistant-input" class="sr-only">${d(c("ai.srInputLabel"))}</label>
          <textarea
            id="ai-assistant-input"
            rows="2"
            autocomplete="off"
            placeholder="${d(c("ai.input.placeholder"))}"
            class="box-border min-h-[2.75rem] max-w-full w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          ></textarea>
        </div>
        <div class="flex w-full shrink-0 gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            id="ai-assistant-voice"
            class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="${r}"
            aria-pressed="false"
            title="${r}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
          <button
            type="submit"
            id="ai-assistant-send"
            class="inline-flex h-11 min-w-[5rem] items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            ${d(c("ai.send"))}
          </button>
        </div>
      </form>
    </div>
  `}function tN(){const e=document.getElementById("ai-assistant-root"),t=document.getElementById("ai-assistant-form"),r=document.getElementById("ai-assistant-input"),n=document.getElementById("ai-assistant-thread");if(!e||!t||!r||!n)return;const s=(o,a)=>{const l=document.createElement("div");l.className=o==="user"?"flex justify-end":"flex justify-start";const u=document.createElement("div");u.className=o==="user"?"max-w-[90%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm sm:max-w-[85%]":"max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm leading-relaxed text-card-foreground shadow-sm sm:max-w-[85%]",u.innerHTML=d(a).replace(/\n/g,"<br/>"),l.appendChild(u),n.appendChild(l),n.scrollTop=n.scrollHeight};e.addEventListener("click",o=>{const a=o.target.closest("[data-ai-quick-prompt]");if(!a||!(a instanceof HTMLElement))return;const l=a.getAttribute("data-ai-quick-prompt");l&&(r.value=l,r.focus(),t.requestSubmit())}),t.addEventListener("submit",o=>{o.preventDefault();const a=r.value.trim();a&&(s("user",a),r.value="",window.setTimeout(()=>s("assistant",Ew(a)),450))}),r.addEventListener("keydown",o=>{o.key==="Enter"&&(o.shiftKey||o.isComposing||(o.preventDefault(),t.requestSubmit()))});const i=document.getElementById("ai-assistant-voice");i==null||i.addEventListener("click",()=>{const o=window,a=o.SpeechRecognition??o.webkitSpeechRecognition;if(!a){s("assistant",c("ai.speech.unsupported"));return}const l=new a;l.lang=rt()==="en"?"en-US":"zh-CN",l.continuous=!1,l.interimResults=!1,i.setAttribute("aria-pressed","true"),i.classList.add("ring-2","ring-ring"),l.onresult=u=>{const m=u.results,T=Array.from(m).map(k=>{var S;return((S=k[0])==null?void 0:S.transcript)??""}).join("");r.value=(r.value?`${r.value} `:"")+T.trim()},l.onerror=()=>{s("assistant",c("ai.speech.micError"))},l.onend=()=>{i.setAttribute("aria-pressed","false"),i.classList.remove("ring-2","ring-ring")};try{l.start()}catch{s("assistant",c("ai.speech.startFailed")),i.setAttribute("aria-pressed","false"),i.classList.remove("ring-2","ring-ring")}})}function rl(e,t){const r=t.children,n=zp(e,r);return`
    <nav class="mb-6" aria-label="${Q("nav.subPagesAria",{name:h(t.title,t.titleEn)}).replace(/"/g,"&quot;")}">
      <div class="-mx-1 flex gap-0.5 overflow-x-auto overflow-y-hidden pb-px scroll-smooth [scrollbar-width:thin]" role="tablist">
        ${r.map(i=>{const o=i.path===n,a=i.chainOnly?`<span class="ml-1 rounded bg-primary/15 px-1 py-px text-[10px] text-primary dark:bg-primary/25">${d(c("badge.chain"))}</span>`:"";return`
          <a href="#${i.path}"
            role="tab"
            aria-selected="${o}"
            tabindex="${o?"0":"-1"}"
            class="shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-200 min-h-11 inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t-md ${o?"border-primary text-primary bg-primary/5":"border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"}"
          >
            <span class="truncate">${h(i.title,i.titleEn)}${a}</span>
          </a>`}).join("")}
      </div>
      <div class="h-px w-full bg-border" aria-hidden="true"></div>
    </nav>
  `}function rN(){const e="h-9 max-w-[9rem] rounded-md border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:max-w-[10.5rem]";return`
    <div
      class="flex max-w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2"
      role="group"
      aria-label="${d(c("header.scopeGroup"))}"
      title="${d(c("header.scopeGroupTitle"))}"
    >
      <label class="sr-only" for="scope-brand-select">${d(c("header.scopeBrand"))}</label>
      <select id="scope-brand-select" class="${e}" aria-label="${d(c("header.scopeBrandAria"))}">
        <option value="">${d(c("header.scopeAllBrands"))}</option>
        <option value="miju">米聚餐饮集团</option>
        <option value="menusifu-na">MenuSifu 北美</option>
      </select>
      <label class="sr-only" for="scope-region-select">${d(c("header.scopeRegion"))}</label>
      <select id="scope-region-select" class="${e}" aria-label="${d(c("header.scopeRegionAria"))}">
        <option value="">${d(c("header.scopeAllRegions"))}</option>
        <option value="east-cn">华东大区</option>
        <option value="south-cn">华南大区</option>
        <option value="north-cn">华北大区</option>
        <option value="us-west">美国西海岸</option>
        <option value="us-east">美国东海岸</option>
      </select>
      <label class="sr-only" for="scope-store-select">${d(c("header.scopeStore"))}</label>
      <select id="scope-store-select" class="${e}" aria-label="${d(c("header.scopeStoreAria"))}">
        <option value="">${d(c("header.scopeAllStores"))}</option>
        <option value="flagship-nyc">旗舰店 · NYC</option>
        <option value="branch-la">分店 · LA</option>
        <option value="shanghai-ljz">上海陆家嘴店</option>
        <option value="guangzhou-tzh">广州天河店</option>
      </select>
    </div>
  `}function nN(){const e=document.getElementById("scope-brand-select"),t=document.getElementById("scope-region-select"),r=document.getElementById("scope-store-select");if(!e||!t||!r)return;const n=o=>new Set(Array.from(o.options,a=>a.value));(()=>{try{const o=sessionStorage.getItem(Dt.brand);o!=null&&n(e).has(o)&&(e.value=o);const a=sessionStorage.getItem(Dt.region);a!=null&&n(t).has(a)&&(t.value=a);const l=sessionStorage.getItem(Dt.store);l!=null&&n(r).has(l)&&(r.value=l)}catch{}})();const i=()=>{try{sessionStorage.setItem(Dt.brand,e.value),sessionStorage.setItem(Dt.region,t.value),sessionStorage.setItem(Dt.store,r.value)}catch{}window.dispatchEvent(new CustomEvent("menusifu:scope-filter-change",{detail:{brand:e.value,region:t.value,store:r.value}}))};e.addEventListener("change",i),t.addEventListener("change",i),r.addEventListener("change",i)}function sN(){const e=location.hash.slice(1)||"/dashboard/overview",t=Ek(e),{title:r,module:n}=Sk(e),s=t?co(t):n??"",i=e.startsWith("/ai-assistant"),o=Mm(e),a=Wm(e),l=Qm(e),u=fm(e),m=vm(e),T=xm(e),k=Tm(e),S=ww(e),p=Bw(e),f=Hw(e),E=Fw(e),x=Gw(e),P=Uw(e),O=jw(e),g=Vw(e),N=Ww(e),D=Qw(e),Z=zw(e),W=f||E||x||P||O||g||N||D||Z,ce=Wa(e),ue=ci(e),ie=i||a||l||u||m||T||k||p||f||E||x||P||O||g||N||D||Z||S||ue||ce,b=ak(t),$="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden sm:flex-row sm:items-stretch",y="min-w-0 min-h-0 flex-1 overflow-y-auto",I=W?"min-h-0 flex-1 flex flex-col overflow-hidden p-0 animate-fade-in":ie?"min-h-0 flex-1 flex flex-col overflow-hidden p-4 md:p-6 animate-fade-in":"min-h-0 flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in",G=W?"flex w-full min-h-0 min-w-0 flex-1 flex-col":i?"mx-auto flex w-full min-h-0 min-w-0 max-w-3xl flex-1 flex-col":ie?"mx-auto flex w-full min-h-0 flex-1 flex-col max-w-[90rem]":"mx-auto max-w-6xl space-y-6",M=b?ie?`<div class="mb-6 shrink-0">${rl(e,t)}</div>`:rl(e,t):"",pe=ie?' class="min-h-0 flex-1 flex flex-col overflow-hidden"':"";return`
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      ${`<header class="z-40 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:flex-nowrap sm:gap-4 sm:py-0">
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">${s}</p>
          <h1 id="main-content" tabindex="-1" class="truncate text-lg font-semibold tracking-tight text-card-foreground">${d(r)}</h1>
        </div>
        <div class="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
          <a
            href="#/ai-assistant/chat"
            class="inline-flex h-9 items-center gap-1.5 rounded-md border border-primary/35 bg-primary/[0.08] px-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:h-10 sm:px-3"
            title="${d(c("header.aiOpenTitle"))}"
          >
            <span class="shrink-0 text-primary [&>svg]:block" aria-hidden="true">${Hp}</span>
            <span class="hidden sm:inline">${d(c("header.aiShort"))}</span>
          </a>
          ${rN()}
          ${$k()}
          <button type="button" id="theme-toggle" class="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:size-11" aria-label="${d(c("header.themeToggle"))}">
            <svg class="size-5 dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            <svg class="size-5 hidden dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          </button>
        </div>
      </header>`}
      <main class="${I}">
        <div class="${G}">
          ${M}
          <div role="tabpanel" aria-label="${r.replace(/"/g,"&quot;")}" id="module-tab-panel"${pe}>
            ${i?eN():S?kw():p?Xw():f?Zw():E?Jw():x?ek():P?tk():O?rk():g?nk():N?sk():D?ik(e):Z?ok():o?at(e,r,t,{brandProductsSubnav:!0}):a?`<div class="${$}">
                    ${Mk(e)}
                    <div class="${y}">${at(e,r,t,{brandMenuSubnav:!0})}</div>
                  </div>`:l?`<div class="${$}">
                    ${Rk(e)}
                    <div class="${y}">${at(e,r,t,{storeMenuSubnav:!0})}</div>
                  </div>`:u?`<div class="${$}">
                    ${Ok(e)}
                    <div class="${y}">${at(e,r,t,{deviceManagementHardwareSubnav:!0})}</div>
                  </div>`:T?`<div class="${$}">
                    ${Hk(e)}
                    <div class="${y}">${at(e,r,t,{teamReportsSubnav:!0})}</div>
                  </div>`:k?`<div class="${$}">
                    ${Fk(e)}
                    <div class="${y}">${at(e,r,t,{teamSchedulingSubnav:!0})}</div>
                  </div>`:m?`<div class="${$}">
                    ${Bk(e)}
                    <div class="${y}">${at(e,r,t,{tipsManagementSubnav:!0})}</div>
                  </div>`:B$(e)?pw():ue?lg(e):e==="/settings/overview"?JP():Wa(e)?`<div class="${$}">
                    ${Zk(e,r)}
                    <div class="${y} module-settings-scroll-host">${ZP(e,r)}</div>
                  </div>`:at(e,r,t)}
          </div>
        </div>
      </main>
    </div>
  `}function at(e,t,r,n){const s=(r==null?void 0:r.subNavPlacement)==="sidebar",i=(r==null?void 0:r.subNavPlacement)==="sheet",o=n==null?void 0:n.brandProductsSubnav,a=n==null?void 0:n.brandMenuSubnav,l=n==null?void 0:n.storeMenuSubnav,u=n==null?void 0:n.deviceManagementHardwareSubnav,m=n==null?void 0:n.tipsManagementSubnav,T=n==null?void 0:n.teamReportsSubnav,k=n==null?void 0:n.teamSchedulingSubnav,S=r?h(r.title,r.titleEn):"",p=u?c("placeholder.bullet.deviceHw"):m?c("placeholder.bullet.tips"):T?c("placeholder.bullet.teamReports"):k?c("placeholder.bullet.teamScheduling"):o?c("placeholder.bullet.brandProducts"):a?c("placeholder.bullet.brandMenu"):l?c("placeholder.bullet.storeMenu"):(r==null?void 0:r.id)==="permission-mgmt"?c("placeholder.bullet.permissions"):(r==null?void 0:r.id)==="reservations"?c("placeholder.bullet.reservations"):i&&r?Q("placeholder.sheetModule",{title:S}):s&&r?Q("placeholder.sidebarModule",{title:S}):r?Q("placeholder.tabModule",{title:S}):"",f=c(s||i?"placeholder.navDocLong":"placeholder.navDocShort"),E=[c("placeholder.kpi.sales"),c("placeholder.kpi.orders"),c("placeholder.kpi.staff")];return`
    <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
      <p class="text-sm text-muted-foreground leading-relaxed">${d(c("placeholder.route"))}<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">${e}</code></p>
      <p class="mt-4 text-base text-card-foreground">${Q("placeholder.intro",{title:t})}</p>
      <ul class="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
        ${p?`<li>${p}</li>`:""}
        <li>${f}</li>
        <li>${c("placeholder.designTokens")}</li>
        <li>${c("placeholder.chainTab")}</li>
      </ul>
    </div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${E.map(x=>`<div class="rounded-lg border border-border bg-card p-4 shadow-sm"><p class="text-xs font-medium text-muted-foreground">${d(x)}</p><p class="mt-2 text-2xl font-semibold tabular-nums text-card-foreground">—</p></div>`).join("")}
    </div>
  `}function C(){var i,o,a,l,u,m,T,k,S,p,f,E,x,P,O;_k(),Bp(rt());const e=location.hash.slice(1)||"/dashboard/overview";qa!==e&&!Ua(e)&&me(!1),qa=e,La!==e&&!Us(e)&&ge(!1),La=e,Ca!==e&&!js(e)&&fe(!1),Ca=e,Ma!==e&&!Vs(e)&&be(!1),Ma=e,Ra!==e&&!Ws(e)&&he(!1),Ra=e,Oa!==e&&!Qs(e)&&ve(!1),Oa=e,Ka!==e&&!ir(e)&&ye(!1),Ka=e,Ba!==e&&!zs(e)&&xe(!1),Ba=e,Ha!==e&&!sr(e)&&Se(!1),Ha=e,Tk(e);const t=document.getElementById("app");if(!t)return;const r=((i=document.getElementById("nav-tree"))==null?void 0:i.scrollTop)??0,n=Math.max(r,kk());t.innerHTML=`
    <div class="relative h-dvh min-h-0 w-full overflow-hidden">
      <div class="flex h-full min-h-0 w-full">
        ${Kk()}
        ${sN()}
      </div>
    </div>
  `;const s=()=>{const g=document.getElementById("nav-tree");if(!g)return;const N=Math.max(0,g.scrollHeight-g.clientHeight);g.scrollTop=Math.min(n,N),ja(g.scrollTop)};requestAnimationFrame(()=>{s(),requestAnimationFrame(s)}),(o=document.getElementById("nav-tree"))==null||o.addEventListener("scroll",()=>{const g=document.getElementById("nav-tree");g&&ja(g.scrollTop)},{passive:!0}),(a=document.getElementById("nav-tree"))==null||a.addEventListener("click",g=>{var $o;const N=g.target.closest("[data-inventory-sidebar-open]");if(N&&N instanceof HTMLButtonElement){g.preventDefault(),Me(),ge(!1),fe(!1),be(!1),he(!1),ve(!1),ye(!1),xe(!1),Se(!1),me(!0),w(Xe("inventory-ordering","/operations/inventory-ordering/expiry")),C();return}const D=g.target.closest("[data-product-center-main-sidebar-open]");if(D&&D instanceof HTMLButtonElement){g.preventDefault(),Me(),me(!1),fe(!1),be(!1),he(!1),ve(!1),ye(!1),xe(!1),Se(!1),ge(!0),w(Xe("product-center-main","/brand-products/products")),C();return}const Z=g.target.closest("[data-marketing-sidebar-open]");if(Z&&Z instanceof HTMLButtonElement){g.preventDefault(),Me(),me(!1),ge(!1),be(!1),he(!1),ve(!1),ye(!1),xe(!1),Se(!1),fe(!0),w(Xe("marketing","/marketing/campaigns")),C();return}const W=g.target.closest("[data-promotions-sidebar-open]");if(W&&W instanceof HTMLButtonElement){g.preventDefault(),Me(),me(!1),ge(!1),fe(!1),he(!1),ve(!1),ye(!1),xe(!1),Se(!1),be(!0),w(Xe("promotions","/promotions/campaigns")),C();return}const ce=g.target.closest("[data-members-sidebar-open]");if(ce&&ce instanceof HTMLButtonElement){g.preventDefault(),Me(),me(!1),ge(!1),fe(!1),be(!1),ve(!1),ye(!1),xe(!1),Se(!1),he(!0),w(Xe("members","/members/card/coupon-mgmt")),C();return}const ue=g.target.closest("[data-reports-sidebar-open]");if(ue&&ue instanceof HTMLButtonElement){g.preventDefault(),Me(),me(!1),ge(!1),fe(!1),be(!1),he(!1),ve(!1),xe(!1),Se(!1),ye(!0),w(Xe("reports-finance","/reports/revenue")),C();return}const ie=g.target.closest("[data-print-sidebar-open]");if(ie&&ie instanceof HTMLButtonElement){g.preventDefault(),Me(),me(!1),ge(!1),fe(!1),be(!1),he(!1),ve(!1),ye(!1),Se(!1),xe(!0),w(Xe("print-templates","/print-templates/decoration")),C();return}const b=g.target.closest("[data-reservations-sidebar-open]");if(b&&b instanceof HTMLButtonElement){g.preventDefault(),Me(),me(!1),ge(!1),fe(!1),be(!1),he(!1),ve(!1),ye(!1),xe(!1),Se(!0),w(Xe("reservations","/operations/reservations/waitlist")),C();return}const $=g.target.closest("[data-gift-cards-sidebar-open]");if($&&$ instanceof HTMLButtonElement){g.preventDefault(),Me(),me(!1),ge(!1),fe(!1),be(!1),he(!1),ye(!1),xe(!1),Se(!1),ve(!0),w(Xe("gift-cards","/gift-cards/cards")),C();return}const y=g.target.closest("[data-nav-module-sheet-sidebar-open]");if(y&&y instanceof HTMLButtonElement){const K=y.getAttribute("data-nav-module-sheet-sidebar-open");if(!K)return;g.preventDefault(),me(!1),ge(!1),fe(!1),be(!1),he(!1),ve(!1),ye(!1),xe(!1),Se(!1),Me(),Rr(K,!0);const ht=R.find(pm=>pm.id===K);ht&&w(ht.defaultChildPath??ht.path),C();return}const I=g.target.closest("a[href^='#']");if(I&&I instanceof HTMLAnchorElement){const K=(($o=I.getAttribute("href"))==null?void 0:$o.slice(1))??"";K&&!Ua(K)&&me(!1),K&&!Us(K)&&ge(!1),K&&!js(K)&&fe(!1),K&&!Vs(K)&&be(!1),K&&!Ws(K)&&he(!1),K&&!Qs(K)&&ve(!1),K&&!ir(K)&&ye(!1),K&&!zs(K)&&xe(!1),K&&!sr(K)&&Se(!1);for(const ht of R)ht.subNavPlacement==="sheet"&&K&&!mt(K,ht)&&Rr(ht.id,!1)}const G=g.target.closest("[data-sidebar-toggle]");if(!G||!(G instanceof HTMLButtonElement))return;const M=G.getAttribute("data-sidebar-toggle");if(!M)return;const pe=R.find(K=>K.id===M);if(!pe||pe.subNavPlacement!=="sidebar")return;g.preventDefault();const Ye=location.hash.slice(1)||"/dashboard/overview",jt=Qp(pe,Ye);Pk(pe.id,!jt),C()},!0),(l=document.getElementById("inventory-secondary-sheet"))==null||l.addEventListener("click",g=>{if(g.target.closest("[data-inventory-secondary-close]")){g.preventDefault(),me(!1),C();return}},!0),(u=document.getElementById("product-center-main-secondary-sheet"))==null||u.addEventListener("click",g=>{const N=g.target;if(N.closest("[data-pcm-sheet-bp-mgmt-toggle]")){g.preventDefault();const D=location.hash.slice(1)||"/dashboard/overview";Nk(!Xp(D)),C();return}if(N.closest("[data-pcm-sheet-brand-menu-toggle]")){g.preventDefault();const D=location.hash.slice(1)||"/dashboard/overview";Ik(!Zp(D)),C();return}if(N.closest("[data-pcm-sheet-store-menu-toggle]")){g.preventDefault();const D=location.hash.slice(1)||"/dashboard/overview";Dk(!Jp(D)),C();return}N.closest("[data-product-center-main-secondary-close]")&&(g.preventDefault(),ge(!1),C())},!0),(m=document.getElementById("marketing-secondary-sheet"))==null||m.addEventListener("click",g=>{const N=g.target;if(N.closest("[data-marketing-sheet-mgmt-toggle]")){g.preventDefault();const D=location.hash.slice(1)||"/dashboard/overview";Ak(!em(D)),C();return}N.closest("[data-marketing-secondary-close]")&&(g.preventDefault(),fe(!1),C())},!0),(T=document.getElementById("promotions-secondary-sheet"))==null||T.addEventListener("click",g=>{g.target.closest("[data-promotions-secondary-close]")&&(g.preventDefault(),be(!1),C())},!0),(k=document.getElementById("members-secondary-sheet"))==null||k.addEventListener("click",g=>{g.target.closest("[data-members-secondary-close]")&&(g.preventDefault(),he(!1),C())},!0),(S=document.getElementById("gift-cards-secondary-sheet"))==null||S.addEventListener("click",g=>{g.target.closest("[data-gift-cards-secondary-close]")&&(g.preventDefault(),ve(!1),C())},!0),(p=document.getElementById("reports-secondary-sheet"))==null||p.addEventListener("click",g=>{g.target.closest("[data-reports-secondary-close]")&&(g.preventDefault(),ye(!1),C())},!0),(f=document.getElementById("print-secondary-sheet"))==null||f.addEventListener("click",g=>{g.target.closest("[data-print-secondary-close]")&&(g.preventDefault(),xe(!1),C())},!0),(E=document.getElementById("reservations-secondary-sheet"))==null||E.addEventListener("click",g=>{g.target.closest("[data-reservations-secondary-close]")&&(g.preventDefault(),Se(!1),C())},!0);for(const g of R)g.subNavPlacement==="sheet"&&((x=document.getElementById(`${g.id}-secondary-sheet`))==null||x.addEventListener("click",N=>{N.target.closest(`[data-nav-module-sheet-secondary-close="${g.id}"]`)&&(N.preventDefault(),Rr(g.id,!1),C())},!0));(P=t.firstElementChild)==null||P.addEventListener("click",g=>{var $;const N=g.target.closest("[data-tertiary-sidebar-toggle]");if(!N||!(N instanceof HTMLButtonElement))return;const D=N.getAttribute("data-tertiary-sidebar-toggle");if(!D)return;const Z=R.filter(y=>y.subNavPlacement==="sheet").reduce((y,I)=>y||ii(I).find(G=>G.id===D),void 0),W=ti.find(y=>y.id===D)??nn.find(y=>y.id===D)??nr.find(y=>y.id===D)??ni.find(y=>y.id===D)??rn.find(y=>y.id===D)??Lt.find(y=>y.id===D)??si.find(y=>y.id===D)??Z;if(!(($=W==null?void 0:W.sidebarChildren)!=null&&$.length))return;g.preventDefault();const ce=location.hash.slice(1)||"/dashboard/overview",ue=W.activePrefix??W.path,ie=ce===ue||ce.startsWith(`${ue}/`);if(!ie){w(W.path),Va(D,!0),C();return}const b=To(D,ce,ie);Va(D,!b),C()}),(O=document.getElementById("theme-toggle"))==null||O.addEventListener("click",()=>{var N;document.documentElement.classList.toggle("dark");const g=document.documentElement.classList.contains("dark");(N=document.querySelector('meta[name="theme-color"]'))==null||N.setAttribute("content",g?"#0f172a":"#f8fafc")}),tN(),nN(),wk(),lk(),Yk(e),yw(C),Xk(),zP(),z2(),YP(),Zg(),vx(),Tf(),Kl(),pf(),xE(),HE(),zx(),PT(),XP(),Gx(),Cv(),ey(),nd(),j1(),f$(),E$(),lh(),_b(),D1(),f1(),cg(C),Tu(),lT(),ST(),J1(),nc(),ex(),T0(),VS(),MS(),E2(),$2(),Qk(e)}window.addEventListener("hashchange",C);typeof window<"u"&&window.matchMedia("(prefers-color-scheme: dark)").matches&&document.documentElement.classList.add("dark");C();
