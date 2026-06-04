/**
 * 全局 UI 语言：中文（默认）/ English。与路由、业务数据语言分离。
 */

export type UiLocale = "zh" | "en";

export const UI_LOCALE_STORAGE_KEY = "menusifu-admin-ui-locale";

const messages = {
  zh: {
    "locale.label": "界面语言",
    "locale.optionZh": "中文",
    "locale.optionEn": "English",
    "nav.backToPrimaryNav": "返回主导航",
    "nav.secondarySuffix": "·二级导航",
    "nav.subNavQualifier": "子导航",
    "nav.openSecondary": "打开{name}二级导航",
    "nav.sheetNavFunction": "{name}功能",
    "nav.tertiarySuffix": " · 三级导航",
    "nav.subPagesAria": "{name}子页面",
    "badge.chain": "连锁",
    "shell.appName": "米聚集团",
    "shell.appTagline": "MenuSifu智慧餐饮管理中心",
    "shell.navTree": "主导航树",
    "shell.navAside": "主导航",
    "header.aiOpenTitle": "打开 AI 智能助手",
    "header.aiShort": "AI助手",
    "header.themeToggle": "切换深色模式",
    "header.userCenterOpen": "个人中心",
    "header.userCenterAccountLabel": "当前账号",
    "header.userCenterLogout": "退出登录",
    "header.userCenterFallbackAccount": "已登录用户",
    "header.scopeGroup": "数据范围筛选：品牌、区域、门店",
    "header.scopeGroupTitle": "按品牌、区域、门店筛选当前数据范围（演示；可对接组织架构接口）",
    "header.scopeBrand": "品牌",
    "header.scopeBrandAria": "按品牌筛选",
    "header.scopeAllBrands": "全部品牌",
    "header.scopeRegion": "区域",
    "header.scopeRegionAria": "按区域筛选",
    "header.scopeAllRegions": "全部区域",
    "header.scopeStore": "门店",
    "header.scopeStoreAria": "按门店筛选",
    "header.scopeAllStores": "全部门店",
    "findTitle.aiChat": "智能对话",
    "findTitle.aiModule": "AI智能助手 · AI Assistant",
    "findTitle.productCenterB": "商品中心B",
    "findTitle.productCenterBModule": "商品中心B · Product center B",
    "findTitle.page": "页面",
    "findTitle.inventoryChangeTitle": "库存变更记录",
    "findTitle.inventoryChangeModule": "库存管理中心 / Inventory management center",
    "findTitle.moduleTax": "商品中心 · 门店管理 · 税种管理",
    "findTitle.moduleSeasoning": "商品中心 · 商品管理 · 调味管理",
    "findTitle.moduleTags": "商品中心 · 商品管理 · 标签管理",
    "findTitle.moduleRecipes": "商品中心 · 商品管理 · 配方管理",
    "findTitle.moduleDmHw": "硬件管理中心 · 硬件",
    "findTitle.moduleTips": "团队管理 · 小费管理",
    "findTitle.moduleTeamReports": "团队管理 · 员工报表",
    "findTitle.moduleTeamScheduling": "团队管理 · 排班与考勤",
    "findTitle.moduleBrandProducts": "商品中心 · 商品管理",
    "findTitle.moduleBrandMenu": "商品中心 · 品牌菜单",
    "findTitle.moduleStoreProducts": "商品中心 · 门店管理",
    "findTitle.moduleGiftCards": "礼品卡中心 · Gift card center",
    "findTitle.moduleMembers": "会员中心 · Member center",
    "findTitle.moduleMembersCards": "会员中心 · 卡券管理",
    "findTitle.modulePoints": "积分配置",
    "findTitle.moduleReportsBase": "报表中心 · Reporting center",
    "findTitle.moduleReportsPrefix": "报表中心 · {name}",
    "findTitle.modulePrint": "打印中心 · Print center",
    "findTitle.moduleReservations": "预约等位中心 · Reservation & waitlist center",
    "findTitle.moduleReservationsShort": "预约等位中心",
    "inventory.sheetTitle": "库存管理中心·二级导航",
    "inventory.sheetNav": "库存功能",
    "inventory.centerTitle": "库存管理中心",
    "placeholder.route": "当前路由：",
    "placeholder.intro": "「{title}」页面占位 — 可在此接入列表、表单或图表。",
    "placeholder.tabModule": "本模块（{title}）二级导航在上方 Tab 切换；侧栏仅保留该模块一级入口",
    "placeholder.sidebarModule": "本模块（{title}）二级在左侧主导航：点击侧栏「{title}」展开/收起子列表后切换。",
    "placeholder.sheetModule":
      "本模块（{title}）：点击侧栏该名称行打开右滑二级导航（与营销中心同交互），在滑层内切换本模块二级路由。",
    "placeholder.designTokens": "设计令牌使用 Tailwind v4 @theme（OKLCH 语义色）",
    "placeholder.chainTab": "标记为「连锁」的 Tab 为加盟/多店场景常用入口（配置见 navigation.ts 中 chainOnly）",
    "placeholder.kpi.sales": "今日销售额",
    "placeholder.kpi.orders": "待处理订单",
    "placeholder.kpi.staff": "在岗员工",
    "placeholder.navDoc": "侧栏一级顺序与主导航、滑层、Tab 的说明见占位区首条长列表；AI 智能助手仅顶栏入口。结构来源：docs/餐饮商家后台-导航与目录结构建议.md",
    "tabPanel.fallbackAria": "主内容",
    "moduleTabs.fallbackNav": "子页面",
    "giftCards.embedTitle": "礼品卡工厂",
    "inventory.iframeTitle": "WMS 效期分类",
    "capital.newTab": "在新标签页打开如意财（EZ Capital）",
    "capital.aria": "信贷中心：在新标签页打开 EZ Capital",
    "placeholder.navDocLong":
      "侧栏一级顺序：品牌管理、门店管理、主页、团队管理、商品中心、订单中心、支付中心、外卖/来取、营销中心、营促销中心、会员中心、礼品卡中心、评价中心、前厅管理中心、后厨管理中心、预约等位中心、报表中心、财务中心、打印中心、消息中心、库存管理中心、硬件管理中心、权限管理中心、信贷中心、素材中心、系统设置。**品牌管理、门店管理、团队管理、订单中心、支付中心、外卖/来取、前厅管理中心、后厨管理中心、评价中心、财务中心、硬件管理中心、权限管理中心、素材管理中心**与**商品中心**、**营销中心**、**促销中心**、**会员中心**、**礼品卡中心**、**报表中心**、**打印中心**、**预约等位中心**、**库存管理中心**均为侧栏自右滑入的二级导航；**主页、消息中心、系统设置**的二级仍在主导航树内可折叠展开（一级行展开/收起，再点子项）。品牌/门店置顶；**商品中心**紧接**团队管理**之后。外卖/来取、前厅管理中心、后厨管理中心滑层内均为业务主入口与「设置」；营销中心滑层内为「营销管理」及子项「屏保」「广告」「海报 Pro」；商品中心滑层含商品管理、品牌菜单、门店管理及「设置」；库存管理中心滑层含效期管理、物料管理及「设置」；促销中心滑层内为「促销活动」与「设置」；会员中心滑层内为「卡券管理」（含「优惠券管理」「付费会员明细」「付费会员配置」）、「积分配置」与「设置」；礼品卡中心滑层内为「礼品卡工厂」与「设置」，其中礼品卡工厂在主内容区嵌入云端礼品卡工厂；评价中心滑层含「评价洞察」「评价明细」「评价统计」与「设置」；报表中心滑层内为「营业汇总」「销售汇总」（子项：订单、支付、折扣金额、加收）、「商品报表」（排名、商品潜力分析）、「员工报表」（员工概观、小费分配）、「走势详情」（分店概观、销售额比对）及「月度经营分析」；打印中心滑层内为「打印装修」与「设置」；素材中心滑层内为「图片素材」「视频库」；预约等位中心滑层内为「Waitlist」「RSV」「History」「Section」「设置」，界面语言在顶栏全局。其它模块二级多在上方 Tab。 <strong class=\"text-card-foreground\">AI智能助手</strong> 仅顶栏全局入口（<code class=\"font-mono text-xs\">#/ai-assistant/chat</code>），非侧栏一级。结构来源：<strong class=\"text-card-foreground\">docs/餐饮商家后台-导航与目录结构建议.md</strong>",
    "placeholder.navDocShort": "侧栏一级入口；多数模块二级在上方 Tab。",
    "ai.welcomeHtml":
      "您好，我是 <strong class=\"text-card-foreground\">MenuSifu 智能助手</strong>（单一智能体）。您可以用<strong class=\"text-card-foreground\">文字或语音</strong>让我：检索全站模块与数据、说明或协助调整<strong class=\"text-card-foreground\">配置与权限</strong>、做经营<strong class=\"text-card-foreground\">分析摘要</strong>。下方为演示回复，接入大模型与业务 API 后即可真实执行（受策略与审批约束）。",
    "ai.contextNote":
      "同一对话上下文贯穿全程：无需切换「配置机器人」「分析机器人」——由本智能体统一理解意图并调用工具链（检索 / 配置 / 数仓 / 权限服务）。",
    "ai.quickAria": "快捷示例指令",
    "ai.quick.permissions": "权限说明",
    "ai.quick.search": "全站查找",
    "ai.quick.analysis": "数据分析",
    "ai.quick.config": "改配示例",
    "ai.link.permissions": "打开权限管理中心",
    "ai.input.placeholder": "输入问题，Enter 发送；Shift+Enter 换行",
    "ai.send": "发送",
    "ai.voice": "语音输入",
    "settings.overview.title": "硬件与终端",
    "settings.overview.desc":
      "从系统设置总揽快速进入 <strong class=\"text-card-foreground\">硬件管理中心 → 硬件</strong> 下各终端配置页（含 POS GO）；左侧主导航请展开 <strong class=\"text-card-foreground\">硬件管理中心</strong> → <strong class=\"text-card-foreground\">硬件</strong>。",
    "moduleSettings.intro":
      "以下按<strong class=\"text-card-foreground\">功能场景</strong>归类展示本模块相关「功能设置」（来源：<code class=\"font-mono text-xs\">docs/分析.md</code> 与 CSV 归类表）。点击项为占位，后续可对接具体配置页。",
    "moduleSettings.count": "共 {count} 项",
    "moduleSettings.empty":
      "当前模块在归类表中尚无「功能设置」条目；可在 <code class=\"font-mono text-xs\">docs/分析.md</code> 补充后重新运行 <code class=\"font-mono text-xs\">node scripts/build-module-settings-catalog.mjs</code> 生成目录。",
    "moduleSettings.categoryAria": "{category} 设置项",
    "moduleSettings.toggleAria": "{name}：是否展示",
    "moduleSettings.toggleOn": "已开启展示",
    "moduleSettings.toggleOff": "已关闭展示",
    "moduleSettings.toggleOffLabel": "关闭",
    "moduleSettings.toggleOnLabel": "开启",
    "sheet.marketingMgmt": "营销管理",
    "placeholder.bullet.deviceHw":
      "<strong class=\"text-card-foreground\">硬件管理中心 · 硬件</strong>：在左侧主导航点击「硬件管理中心」打开<strong class=\"text-card-foreground\">右滑二级导航</strong>后选择 <strong class=\"text-card-foreground\">硬件</strong>；本区域左侧为硬件细项（支付设备、钱箱、路由器、POS、POS GO、KDS、叫号屏、打印机、电子秤、Kiosk、eMenu），交互同本后台其它三级侧栏。",
    "placeholder.bullet.tips":
      "<strong class=\"text-card-foreground\">团队管理 · 小费管理</strong>：在左侧主导航点击「团队管理」打开<strong class=\"text-card-foreground\">右滑二级导航</strong>后选择 <strong class=\"text-card-foreground\">小费管理</strong>；本区域左侧为细项（小费分配、分配明细、分配规则），交互同本后台其它三级侧栏。",
    "placeholder.bullet.teamReports":
      "<strong class=\"text-card-foreground\">团队管理 · 员工报表</strong>：在左侧主导航点击「团队管理」打开<strong class=\"text-card-foreground\">右滑二级导航</strong>后选择 <strong class=\"text-card-foreground\">员工报表</strong>；本区域左侧为细项（概览、小费、绩效、薪资），交互同小费管理。",
    "placeholder.bullet.teamScheduling":
      "<strong class=\"text-card-foreground\">团队管理 · 排班与考勤</strong>：在左侧主导航点击「团队管理」打开<strong class=\"text-card-foreground\">右滑二级导航</strong>后选择 <strong class=\"text-card-foreground\">排班与考勤</strong>；本区域左侧为细项（考勤记录、加班规则），交互同小费管理。",
    "placeholder.bullet.brandProducts":
      "<strong class=\"text-card-foreground\">商品管理</strong>：侧栏打开「<strong class=\"text-card-foreground\">商品中心</strong>」滑层后，在「<strong class=\"text-card-foreground\">商品管理</strong>」下为全部细项二级导航（商品、分类、规格组、口味组、做法组、加料组、套餐组、调味管理、标签管理、原料管理、原料分类、图片管理、配方管理）；调味/标签/配方分组可折叠，交互与主区左侧三级侧栏一致。配方内「原料管理」：<code class=\"font-mono text-xs\">/brand-products/recipes/ingredients</code>。",
    "placeholder.bullet.brandMenu":
      "<strong class=\"text-card-foreground\">品牌菜单</strong>：侧栏打开「<strong class=\"text-card-foreground\">商品中心</strong>」滑层后选择「<strong class=\"text-card-foreground\">品牌菜单</strong>」；本区域左侧为 <strong class=\"text-card-foreground\">菜单、下发记录</strong> 三级导航。其它品牌菜单路由（如分组、渠道可见性）仍可通过链接进入，侧栏「菜单」项保持高亮。",
    "placeholder.bullet.storeMenu":
      "<strong class=\"text-card-foreground\">门店管理</strong>：侧栏打开「<strong class=\"text-card-foreground\">商品中心</strong>」滑层后选择「<strong class=\"text-card-foreground\">门店管理</strong>」；本区域左侧为 <strong class=\"text-card-foreground\">门店菜单、门店商品、门店调味、库存变更记录、打印设置、税种管理、配方列表</strong> 三级导航。其中 <strong class=\"text-card-foreground\">税种管理</strong> 为可折叠分组，内含二级入口 <strong class=\"text-card-foreground\">税种管理、商品税管理</strong>（一级行点击仅展开/收起，交互同左侧主导航可折叠模块）。",
    "placeholder.bullet.permissions":
      "<strong class=\"text-card-foreground\">权限管理中心</strong>（RBAC）：侧栏点击「权限管理中心」打开右滑二级导航；在「<strong class=\"text-card-foreground\">角色与功能权限</strong>」中配置各 <strong class=\"text-card-foreground\">角色</strong> 可访问的后台模块与操作（查看、编辑、导出、审核等）；在「<strong class=\"text-card-foreground\">员工授权</strong>」中指定 <strong class=\"text-card-foreground\">哪位员工</strong> 拥有哪些角色。「权限总览」便于审计当前策略；「权限变更记录」留痕赋权调整。与「系统设置 → 账号与权限」可分工：本模块侧重可编排的权限矩阵与员工赋权，系统设置侧重账号安全与基础开关。",
    "placeholder.bullet.reservations":
      "<strong class=\"text-card-foreground\">预约等位中心</strong>：点击侧栏「预约等位中心」打开与营销中心相同的右滑二级导航；滑层内为 <strong class=\"text-card-foreground\">Waitlist、RSV、History、Section、设置</strong>；<strong class=\"text-card-foreground\">界面语言</strong>在顶栏全局下拉（深浅色切换旁）。",
    "tertiaryNav.tips": "小费管理",
    "tertiaryNav.teamReports": "员工报表",
    "tertiaryNav.teamScheduling": "排班与考勤",
    "ai.srInputLabel": "输入指令或问题",
    "ai.tipVoiceLang": "提示：点击麦克风使用语音输入（随界面语言切换识别语言；Chrome / Edge 体验更佳）。",
    "ai.speech.unsupported": "当前浏览器不支持语音识别，请直接输入文字，或使用 Chrome / Edge 重试。",
    "ai.speech.micError": "未听清或未授权麦克风，请检查权限后重试。",
    "ai.speech.startFailed": "无法启动语音识别，请改用文本输入。",
  },
  en: {
    "locale.label": "Interface language",
    "locale.optionZh": "中文",
    "locale.optionEn": "English",
    "nav.backToPrimaryNav": "Back to main navigation",
    "nav.secondarySuffix": " · Secondary navigation",
    "nav.subNavQualifier": "Sub-navigation",
    "nav.openSecondary": "Open secondary navigation: {name}",
    "nav.sheetNavFunction": "{name} menu",
    "nav.tertiarySuffix": " · Tertiary navigation",
    "nav.subPagesAria": "{name} sub-pages",
    "badge.chain": "Chain",
    "shell.appName": "Miju Group",
    "shell.appTagline": "MenuSifu merchant admin",
    "shell.navTree": "Main navigation tree",
    "shell.navAside": "Main navigation",
    "header.aiOpenTitle": "Open AI assistant",
    "header.aiShort": "AI",
    "header.themeToggle": "Toggle dark mode",
    "header.userCenterOpen": "Account",
    "header.userCenterAccountLabel": "Signed in as",
    "header.userCenterLogout": "Sign out",
    "header.userCenterFallbackAccount": "Signed-in user",
    "header.scopeGroup": "Scope: brand, region, store",
    "header.scopeGroupTitle": "Filter data by brand, region, and store (demo; connect to org APIs)",
    "header.scopeBrand": "Brand",
    "header.scopeBrandAria": "Filter by brand",
    "header.scopeAllBrands": "All brands",
    "header.scopeRegion": "Region",
    "header.scopeRegionAria": "Filter by region",
    "header.scopeAllRegions": "All regions",
    "header.scopeStore": "Store",
    "header.scopeStoreAria": "Filter by store",
    "header.scopeAllStores": "All stores",
    "findTitle.aiChat": "Chat",
    "findTitle.aiModule": "AI Assistant",
    "findTitle.productCenterB": "Product center B",
    "findTitle.productCenterBModule": "Product center B",
    "findTitle.page": "Page",
    "findTitle.inventoryChangeTitle": "Inventory change log",
    "findTitle.inventoryChangeModule": "Inventory management center",
    "findTitle.moduleTax": "Product center · Store management · Tax types",
    "findTitle.moduleSeasoning": "Product center · Product management · Seasoning",
    "findTitle.moduleTags": "Product center · Product management · Tags",
    "findTitle.moduleRecipes": "Product center · Product management · Recipes",
    "findTitle.moduleDmHw": "Hardware · Devices",
    "findTitle.moduleTips": "Team · Tips",
    "findTitle.moduleTeamReports": "Team · Staff reports",
    "findTitle.moduleTeamScheduling": "Team · Scheduling & attendance",
    "findTitle.moduleBrandProducts": "Product center · Product management",
    "findTitle.moduleBrandMenu": "Product center · Brand menus",
    "findTitle.moduleStoreProducts": "Product center · Store management",
    "findTitle.moduleGiftCards": "Gift card center",
    "findTitle.moduleMembers": "Member center",
    "findTitle.moduleMembersCards": "Member center · Cards & coupons",
    "findTitle.modulePoints": "Points configuration",
    "findTitle.moduleReportsBase": "Reporting center",
    "findTitle.moduleReportsPrefix": "Reporting center · {name}",
    "findTitle.modulePrint": "Print center",
    "findTitle.moduleReservations": "Reservation & waitlist center",
    "findTitle.moduleReservationsShort": "Reservation & waitlist",
    "inventory.sheetTitle": "Inventory management · Secondary navigation",
    "inventory.sheetNav": "Inventory",
    "inventory.centerTitle": "Inventory management center",
    "placeholder.route": "Current route:",
    "placeholder.intro": "“{title}” is a placeholder — add lists, forms, or charts here.",
    "placeholder.tabModule":
      "Module ({title}): use the top tabs for secondary navigation; the sidebar keeps only the top-level entry.",
    "placeholder.sidebarModule":
      "Module ({title}): expand or collapse the item in the sidebar, then choose a child link.",
    "placeholder.sheetModule":
      "Module ({title}): click the row in the sidebar to open the slide-in secondary navigation (same pattern as Marketing), then pick a route inside the sheet.",
    "placeholder.designTokens": "Design tokens use Tailwind v4 @theme (OKLCH semantic colors).",
    "placeholder.chainTab":
      "Tabs marked “Chain” are common for franchise / multi-store setups (see chainOnly in navigation.ts).",
    "placeholder.kpi.sales": "Today’s sales",
    "placeholder.kpi.orders": "Pending orders",
    "placeholder.kpi.staff": "Staff on duty",
    "placeholder.navDoc":
      "See the first long bullet in this card for sidebar order, sheets, and tabs. AI assistant is header-only. Source: docs/餐饮商家后台-导航与目录结构建议.md",
    "tabPanel.fallbackAria": "Main content",
    "moduleTabs.fallbackNav": "Sub-pages",
    "giftCards.embedTitle": "Gift card factory",
    "inventory.iframeTitle": "WMS expiry categories",
    "capital.newTab": "Open EZ Capital in a new tab",
    "capital.aria": "Credit center: open EZ Capital in a new tab",
    "placeholder.navDocLong":
      "Sidebar order: Brand, Stores, Home, Team, Product center, Orders, Payments, Delivery & pickup, Marketing, Promotions, Members, Gift cards, Reviews, Front of house, Kitchen, Reservations, Reports, Finance, Print, Messages, Inventory, Hardware, Permissions, Credit, Assets, Settings. **Brand, Stores, Team, Orders, Payments, Delivery & pickup, Front of house, Kitchen, Reviews, Finance, Hardware, Permissions, Assets**, plus **Product center**, **Marketing**, **Promotions**, **Members**, **Gift cards**, **Reports**, **Print**, **Reservations**, and **Inventory** use a slide-in secondary sheet; **Home**, **Messages**, and **Settings** keep collapsible children in the main tree. Delivery & pickup, front of house, and kitchen sheets: main entry plus Settings; Marketing sheet: screensaver, ads, and Poster Pro; Product center sheet: product management, brand menus, store management, and Settings; Inventory sheet: expiry, materials, and Settings; Promotions: campaigns & Settings; Members: cards & coupons, points & Settings; Gift cards: factory (embedded) & Settings; Reviews: insights, detail, stats & Settings; Reports: business summary, sales, products, staff, trends, monthly analysis; Print: decoration only; Reservations: Waitlist, RSV, History, Section, Settings; UI language is global in the header. Most other modules use top tabs. <strong class=\"text-card-foreground\">AI Assistant</strong> is header-only (<code class=\"font-mono text-xs\">#/ai-assistant/chat</code>). Source: docs/餐饮商家后台-导航与目录结构建议.md",
    "placeholder.navDocShort": "Sidebar entries; most modules use top tabs for level-2 navigation.",
    "ai.welcomeHtml":
      "Hello, I am the <strong class=\"text-card-foreground\">MenuSifu assistant</strong> (single agent). Use <strong class=\"text-card-foreground\">text or voice</strong> to search modules and data, explain or help adjust <strong class=\"text-card-foreground\">configuration & permissions</strong>, and run <strong class=\"text-card-foreground\">analytics summaries</strong>. Replies below are demos; connect an LLM and business APIs for real actions (subject to policy and approvals).",
    "ai.contextNote":
      "One conversation context end-to-end—no separate “config bot” vs “analytics bot”; this agent routes intent to retrieval, config, data, and permission tools.",
    "ai.quickAria": "Quick prompt examples",
    "ai.quick.permissions": "RBAC help",
    "ai.quick.search": "Site search",
    "ai.quick.analysis": "Analytics",
    "ai.quick.config": "Config example",
    "ai.link.permissions": "Open access management",
    "ai.input.placeholder": "Type a question; Enter to send; Shift+Enter for newline",
    "ai.send": "Send",
    "ai.voice": "Voice input",
    "settings.overview.title": "Hardware & terminals",
    "settings.overview.desc":
      "From this overview jump to <strong class=\"text-card-foreground\">Hardware management → Hardware</strong> for each terminal (including POS GO). In the sidebar open <strong class=\"text-card-foreground\">Hardware management</strong> → <strong class=\"text-card-foreground\">Hardware</strong>.",
    "moduleSettings.intro":
      "Grouped by <strong class=\"text-card-foreground\">functional scenario</strong> from the classification table (<code class=\"font-mono text-xs\">docs/分析.md</code> / CSV). Rows are placeholders until wired to real config screens.",
    "moduleSettings.count": "{count} items",
    "moduleSettings.empty":
      "No classified settings for this module yet. Add rows in <code class=\"font-mono text-xs\">docs/分析.md</code>, then run <code class=\"font-mono text-xs\">node scripts/build-module-settings-catalog.mjs</code>.",
    "moduleSettings.categoryAria": "Settings in {category}",
    "moduleSettings.toggleAria": "{name}: show on screen",
    "moduleSettings.toggleOn": "Shown",
    "moduleSettings.toggleOff": "Hidden",
    "moduleSettings.toggleOffLabel": "Off",
    "moduleSettings.toggleOnLabel": "On",
    "sheet.marketingMgmt": "Marketing management",
    "placeholder.bullet.deviceHw":
      "<strong class=\"text-card-foreground\">Hardware · Devices</strong>: open <strong class=\"text-card-foreground\">Hardware management</strong> from the sidebar, then the <strong class=\"text-card-foreground\">slide-in sheet</strong> and choose <strong class=\"text-card-foreground\">Devices</strong>. The left column lists terminals (payments, cash drawer, router, POS, POS GO, KDS, queue display, printers, scales, Kiosk, eMenu)—same tertiary pattern as elsewhere.",
    "placeholder.bullet.tips":
      "<strong class=\"text-card-foreground\">Team · Tips</strong>: open Team from the sidebar, use the sheet, pick <strong class=\"text-card-foreground\">Tips</strong>. Left column covers allocation, details, and rules.",
    "placeholder.bullet.teamReports":
      "<strong class=\"text-card-foreground\">Team · Staff reports</strong>: open Team → <strong class=\"text-card-foreground\">Staff reports</strong> from the sheet. Left column: overview, tips, performance, payroll.",
    "placeholder.bullet.teamScheduling":
      "<strong class=\"text-card-foreground\">Team · Scheduling & attendance</strong>: open Team → <strong class=\"text-card-foreground\">Scheduling</strong> from the sheet. Left column: attendance log and overtime rules.",
    "placeholder.bullet.brandProducts":
      "<strong class=\"text-card-foreground\">Brand products</strong>: open the <strong class=\"text-card-foreground\">Product center</strong> sheet, then <strong class=\"text-card-foreground\">Product management</strong> for the full secondary list (products, categories, spec/flavor/prep/add-on/combo groups, seasoning, tags, ingredients, images, recipes). Collapsible groups match the old tertiary sidebar. You can also enter via <strong class=\"text-card-foreground\">Product center A → Brand products</strong>. Ingredients under recipes: <code class=\"font-mono text-xs\">/brand-products/recipes/ingredients</code>.",
    "placeholder.bullet.brandMenu":
      "<strong class=\"text-card-foreground\">Brand menus</strong>: expand <strong class=\"text-card-foreground\">Product center A → Brand menus</strong>. Left column: menus and distribution log; other routes (groups, channel visibility) still work and keep “Menus” highlighted.",
    "placeholder.bullet.storeMenu":
      "<strong class=\"text-card-foreground\">Store products</strong>: expand <strong class=\"text-card-foreground\">Product center A → Store products</strong>. Left column: store menu, store products, seasoning, inventory change log, print settings, tax types, recipe list. <strong class=\"text-card-foreground\">Tax types</strong> is a collapsible group with settings and product tax entries.",
    "placeholder.bullet.permissions":
      "<strong class=\"text-card-foreground\">Access management (RBAC)</strong>: open the sheet from the sidebar. Configure <strong class=\"text-card-foreground\">roles & permissions</strong>, assign <strong class=\"text-card-foreground\">roles to staff</strong>, review the matrix, and audit changes. Complements <strong class=\"text-card-foreground\">Settings → Accounts & permissions</strong> for security basics.",
    "placeholder.bullet.reservations":
      "<strong class=\"text-card-foreground\">Reservations & waitlist</strong>: same slide-in pattern as Marketing. Sheet entries: Waitlist, RSV, History, Section, Settings. <strong class=\"text-card-foreground\">UI language</strong> is global in the header.",
    "tertiaryNav.tips": "Tips",
    "tertiaryNav.teamReports": "Staff reports",
    "tertiaryNav.teamScheduling": "Scheduling & attendance",
    "ai.srInputLabel": "Prompt or question",
    "ai.tipVoiceLang": "Tip: use the microphone for voice input (recognition language follows the UI language; Chrome / Edge recommended).",
    "ai.speech.unsupported": "Speech recognition is not available in this browser. Type your question or try Chrome / Edge.",
    "ai.speech.micError": "Could not hear you or microphone permission was denied. Check permissions and try again.",
    "ai.speech.startFailed": "Could not start speech recognition. Please type instead.",
  },
} as const;

export type MessageKey = keyof typeof messages.zh;

export function getUiLocale(): UiLocale {
  try {
    const v = localStorage.getItem(UI_LOCALE_STORAGE_KEY);
    if (v === "en") return "en";
    if (v === "zh") return "zh";
  } catch {
    /* ignore */
  }
  return "zh";
}

export function setUiLocale(loc: UiLocale): void {
  try {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, loc);
  } catch {
    /* ignore */
  }
}

export function applyUiLocaleToDocument(loc: UiLocale): void {
  document.documentElement.lang = loc === "en" ? "en" : "zh-Hans";
  document.documentElement.setAttribute("data-ui-locale", loc);
}

export function pick(zh: string, en?: string, loc: UiLocale = getUiLocale()): string {
  if (loc === "en" && en != null && String(en).trim() !== "") return en;
  return zh;
}

/** English-only: shorten primary sidebar labels by dropping trailing "… management center" / "… center" / "… management". */
function shortenEnglishPrimaryNavTitle(titleEn: string): string {
  let s = titleEn.trim();
  for (let i = 0; i < 8; i++) {
    const before = s;
    s = s.replace(/\s+Management\s+Center$/i, "").trim();
    s = s.replace(/\s+Center$/i, "").trim();
    s = s.replace(/\s+Management$/i, "").trim();
    if (s === before) break;
  }
  return s.replace(/\s{2,}/g, " ").trim();
}

/** Primary nav row label: Chinese uses `title`; English uses shortened `titleEn`. */
export function navPrimaryLabel(m: { title: string; titleEn: string }): string {
  if (getUiLocale() !== "en") return m.title;
  return shortenEnglishPrimaryNavTitle(m.titleEn);
}

export function t<K extends MessageKey>(key: K): (typeof messages.zh)[K] {
  const loc = getUiLocale();
  return (loc === "en" ? messages.en[key] : messages.zh[key]) as (typeof messages.zh)[K];
}

export function tf<K extends MessageKey>(key: K, vars: Record<string, string>): string {
  let s = String(t(key));
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return s;
}

export function formatNavModuleKicker(m: { title: string; titleEn: string }): string {
  return getUiLocale() === "en" ? m.titleEn : `${m.title} · ${m.titleEn}`;
}
