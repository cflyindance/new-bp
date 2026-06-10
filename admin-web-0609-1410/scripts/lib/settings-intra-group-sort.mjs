/**
 * 设置项组内展示顺序（sortInGroup 越小越靠前）。
 * 未列出的 seq 在组内仍按 seq 升序排在已定义项之后。
 */

import { KDS_TERMINAL_INTRA_GROUP_SORT_BY_SEQ } from "./kds-terminal-settings-groups.mjs";

/** POS 操作按钮：主流程显隐 → 工具栏显隐 → 排序集合 */
const FOH_POS_BUTTONS_SEQ_ORDER = [
  193, 194, 195, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210,
  196, 110, 211, 212, 213, 214, 215, 483, 484, 485, 486,
];

/** 菜单查找与时段：搜索/比价 → 堂吃/外食时段 → iPad 时段 */
const FOH_POS_MENU_SCOPE_SEQ_ORDER = [118, 148, 176, 177, 348];

/** 菜单区界面布局：组 → 类 → 菜 → 价格 → 样式 → iPad 扩展 */
const FOH_POS_MENU_UI_LAYOUT_SEQ_ORDER = [216, 217, 218, 220, 219, 350];

/** @deprecated 已拆为 foh-pos-menu-scope + foh-pos-menu-ui-layout，保留供文档脚本引用 */
export const POS_MENU_UI_SEQ_ORDER = [...FOH_POS_MENU_SCOPE_SEQ_ORDER, ...FOH_POS_MENU_UI_LAYOUT_SEQ_ORDER];

/** @type {Map<number, number>} */
export const INTRA_GROUP_SORT_BY_SEQ = new Map();

let sortCursor = 0;
function assignSort(seqList, step = 10) {
  for (const seq of seqList) {
    INTRA_GROUP_SORT_BY_SEQ.set(seq, (sortCursor += step));
  }
}

assignSort(FOH_POS_BUTTONS_SEQ_ORDER);
assignSort(FOH_POS_MENU_SCOPE_SEQ_ORDER);
assignSort(FOH_POS_MENU_UI_LAYOUT_SEQ_ORDER);

/** 选桌与开台流程：选桌/人数页 → 人数规则 → 开单前桌台约束 */
const FOH_TABLE_START_FLOW_SEQ_ORDER = [107, 619, 111, 625, 621, 643, 644, 592];

/** 清桌与企台：清桌策略 → iPad 通知与企台 */
const FOH_TABLE_CLEAR_OPS_SEQ_ORDER = [169, 534, 642, 351, 347];

/** @deprecated 已拆为 foh-table-start-flow + foh-table-clear-ops，保留供文档脚本引用 */
export const FOH_TABLES_START_SEQ_ORDER = [
  ...FOH_TABLE_START_FLOW_SEQ_ORDER,
  ...FOH_TABLE_CLEAR_OPS_SEQ_ORDER,
];

/** 登录与主界面 */
const FOH_POS_SHELL_SEQ_ORDER = [165, 346];

/** 送厨时机：延迟参数 → 手动送厨 → 打单/付款/结账链路 → 密码权限 → 送厨后改调味（141） */
const FOH_KITCHEN_SEND_TIMING_SEQ_ORDER = [125, 113, 123, 114, 120, 345, 141];

/** POS 找单列表 */
const FOH_POS_FIND_ORDER_LIST_SEQ_ORDER = [153, 151, 152, 251];

/** POS 结账入口 */
const FOH_POS_CHECKOUT_ENTRY_SEQ_ORDER = [248, 221];

/** 购物车行展示 */
const FOH_POS_ORDER_CART_SEQ_ORDER = [132, 133, 135, 137, 178, 121, 122, 222, 223];

/** 套餐与自定义点单 */
const FOH_POS_COMBO_ORDERING_SEQ_ORDER = [138, 139, 145];

/** 权限 · 门店安全策略（349 企台点只读菜） */
const STORE_SECURITY_POLICY_SEQ_ORDER = [349];

/** 菜单展示与购物车：视觉样式 → 积分露出 → 树形导航 → 购物车展示 */
const FOH_GUEST_MENU_BODY_SEQ_ORDER = [
  606, 607, 608, 645, 509, 525, 526, 515, 516, 517, 518, 519, 520, 524, 528, 616, 617, 618,
];

/** 点餐首页与入口：菜单组 → 版式 → 浏览结构 → 纯展示 → 入口 → 品牌 */
const FOH_GUEST_MENU_HOME_SEQ_ORDER = [599, 604, 601, 602, 600, 611, 532];

/** 食客端语言 */
const FOH_GUEST_FACING_LOCALE_SEQ_ORDER = [652, 653];

/** 订单类型与取餐 */
const FOH_GUEST_ORDER_TYPE_SEQ_ORDER = [487, 488, 489, 490, 491, 503];

/** 食客登记与会员 */
const FOH_GUEST_REGISTRATION_SEQ_ORDER = [623, 622, 504, 505, 506, 507, 510];

/** 点单前须知与授权 */
const FOH_GUEST_PRE_ORDER_SEQ_ORDER = [569, 620, 626, 627];

/** 食客端送厨 */
const FOH_GUEST_KITCHEN_SEND_SEQ_ORDER = [581, 502, 91, 567];

/** 火锅点餐 */
const FOH_GUEST_HOTPOT_SEQ_ORDER = [570, 572, 574, 573, 575];

/** 时长与自助餐 */
const FOH_GUEST_DURATION_SCENARIOS_SEQ_ORDER = [443, 571, 577, 578, 579, 580];

/** @deprecated 已拆为 foh-guest-kitchen-send + foh-guest-hotpot + foh-guest-duration-scenarios */
export const FOH_GUEST_SCENARIO_DINING_SEQ_ORDER = [
  ...FOH_GUEST_KITCHEN_SEND_SEQ_ORDER,
  ...FOH_GUEST_HOTPOT_SEQ_ORDER,
  ...FOH_GUEST_DURATION_SCENARIOS_SEQ_ORDER,
];

/** 桌边服务 */
const FOH_TABLESIDE_SERVICE_SEQ_ORDER = [629, 641, 640, 333, 521, 522, 523];

/** 排队与等待展示（产线多选，见 wait-time-display-ui） */
const FOH_WAIT_TIME_DISPLAY_SEQ_ORDER = [673, 535, 536, 537, 538, 539, 540];

assignSort(FOH_TABLE_START_FLOW_SEQ_ORDER);
assignSort(FOH_TABLE_CLEAR_OPS_SEQ_ORDER);
assignSort(FOH_POS_SHELL_SEQ_ORDER);
assignSort(FOH_KITCHEN_SEND_TIMING_SEQ_ORDER);
assignSort(FOH_POS_FIND_ORDER_LIST_SEQ_ORDER);
assignSort(FOH_POS_CHECKOUT_ENTRY_SEQ_ORDER);
assignSort(FOH_POS_ORDER_CART_SEQ_ORDER);
assignSort(FOH_POS_COMBO_ORDERING_SEQ_ORDER);
assignSort(STORE_SECURITY_POLICY_SEQ_ORDER);
assignSort(FOH_GUEST_MENU_BODY_SEQ_ORDER);
assignSort(FOH_GUEST_MENU_HOME_SEQ_ORDER);
assignSort(FOH_GUEST_FACING_LOCALE_SEQ_ORDER);
assignSort(FOH_GUEST_ORDER_TYPE_SEQ_ORDER);
assignSort(FOH_GUEST_REGISTRATION_SEQ_ORDER);
assignSort(FOH_GUEST_PRE_ORDER_SEQ_ORDER);
assignSort(FOH_GUEST_KITCHEN_SEND_SEQ_ORDER);
assignSort(FOH_GUEST_HOTPOT_SEQ_ORDER);
assignSort(FOH_GUEST_DURATION_SCENARIOS_SEQ_ORDER);
assignSort(FOH_TABLESIDE_SERVICE_SEQ_ORDER);
assignSort(FOH_WAIT_TIME_DISPLAY_SEQ_ORDER);

/** 外卖/来取 v2.4：线上下单开关 → 外送区域 */
const DELIVERY_SCAN_ONLINE_SEQ_ORDER = [90, 92];
const DELIVERY_PLATFORM_SLIPS_SEQ_ORDER = [257, 267];
const DELIVERY_PACKAGING_SEQ_ORDER = [429];

/** 平台业务中心 · 线上订餐对接（host/callback） */
const ONLINE_ORDER_SERVICE_SEQ_ORDER = [93, 95, 96, 97, 99, 100, 101, 102, 103, 104, 105, 106];

/** 桌边·呼叫服务员：总开关 → 未开单 → 间隔 → 服务类型 */
const TABLESIDE_SERVICE_CALL_SEQ_ORDER = [629, 641, 640, 333];

/** 前厅 · POS 通知总控 */
const FOH_POS_NOTIFICATION_CONTROL_SEQ_ORDER = [331, 332];

/** 前厅 · 订单消息提醒 */
const STAFF_ORDER_ALERTS_SEQ_ORDER = [638, 639, 637];

/** 消息中心 · 顾客短信渠道（文案/场景关联见消息模板 + 消息配置） */
const CUSTOMER_ORDER_SMS_SEQ_ORDER = [334, 335];

/** 备注与附加服务：备注 → 餐具/打包附加费 */
const GUEST_NOTES_FEES_SEQ_ORDER = [521, 522, 523];

/** @deprecated 已合并至 FOH_GUEST_* 组内排序，保留常量供文档脚本引用 */
export const GUEST_MENU_STRUCTURE_SEQ_ORDER = [515, 516, 517, 518, 519, 520, 524, 525, 526, 528];
export const GUEST_ORDER_THROTTLE_SEQ_ORDER = [588, 589, 590, 591];

/** 权限中心 · 账户与会话安全：空闲/操作后登出、登录输入规则 */
const ACCOUNT_SESSION_SECURITY_SEQ_ORDER = [75, 166, 175];

/** 团队管理 · 考勤与工时：休息/工时上限 → 登出与工单状态 → 打卡与 batch 门禁 */
const TIME_ATTENDANCE_SEQ_ORDER = [66, 67, 68, 69, 70, 71, 72, 73, 329, 241];

assignSort(ACCOUNT_SESSION_SECURITY_SEQ_ORDER);

/** 主界面与导航：默认主界面 → 主页密码门禁 */
const POS_SHELL_LANDING_SEQ_ORDER = [165, 346];

assignSort(POS_SHELL_LANDING_SEQ_ORDER);
assignSort(TIME_ATTENDANCE_SEQ_ORDER);
assignSort(FOH_POS_NOTIFICATION_CONTROL_SEQ_ORDER);
assignSort(STAFF_ORDER_ALERTS_SEQ_ORDER);
assignSort(CUSTOMER_ORDER_SMS_SEQ_ORDER);
assignSort(DELIVERY_SCAN_ONLINE_SEQ_ORDER);
assignSort(DELIVERY_PLATFORM_SLIPS_SEQ_ORDER);
assignSort(DELIVERY_PACKAGING_SEQ_ORDER);
assignSort(ONLINE_ORDER_SERVICE_SEQ_ORDER);
assignSort(GUEST_NOTES_FEES_SEQ_ORDER);

/** 支付中心 · 卡付规则与加价 */
const PAYMENT_CARD_FEES_SEQ_ORDER = [454, 305, 242, 82, 172, 243, 180];

/** 支付中心 · 食客结账界面（含小费页、收取方式、刷卡顺序、签名、小票、签购单） */
const CDS_CHECKOUT_UX_SEQ_ORDER = [463, 493, 9, 464, 465, 669];

assignSort(PAYMENT_CARD_FEES_SEQ_ORDER);
assignSort(CDS_CHECKOUT_UX_SEQ_ORDER);

/** 后厨 · 删单向厨房通知（155，自订单中心迁入） */
const KITCHEN_VOID_NOTIFY_SEQ_ORDER = [155];

/** 后厨管理中心设置页二级导航展示顺序 */
export const KITCHEN_SETTINGS_GROUP_ORDER = [
  "kitchen-order-send",
  "kitchen-void-notify",
  "kitchen-ticket-issue",
  "kitchen-printer-route",
  "ticket-grouping",
  "line-merge-rules",
  "cross-ticket-fields",
  "ticket-fields",
  "ticket-format",
  "packing-slip",
];

/** 订单类型与送厨条件：排除单型 → 未付能否送 */
const KITCHEN_ORDER_SEND_SEQ_ORDER = [36, 62];

/** 分票与首次送厨：首次整单 → 0 元菜分票 */
const KITCHEN_TICKET_ISSUE_SEQ_ORDER = [304, 32];

/** 厨房打印机路由 */
const KITCHEN_PRINTER_ROUTE_SEQ_ORDER = [37];

/** 行级合并规则：矩阵宿主 52（53/287/288/301/302 在 UI 中合并展示） */
const KITCHEN_LINE_MERGE_RULES_SEQ_ORDER = [52, 53, 287, 288, 301, 302];

/** 跨票种显示：271 菜品编号 → 258 外带强调（厨房单/打包单/订单收据） */
const KITCHEN_CROSS_TICKET_FIELDS_SEQ_ORDER = [271, 258];

/** 厨房单·分组与拆单：分区 → 多语言分行 → 结构拆分（合并规则见 line-merge-rules） */
const KITCHEN_TICKET_GROUPING_SEQ_ORDER = [54, 40, 47, 51, 61];

/** 厨房单·票面信息：送厨次数 → 价格/序号/顾客/合计 */
const KITCHEN_TICKET_FIELDS_SEQ_ORDER = [35, 42, 45, 46, 48, 49, 50, 55, 56, 57, 58];

/** 厨房单样式：边距 → 备注/行强调 → 行分隔 → 数量与分段序号 */
const KITCHEN_TICKET_FORMAT_SEQ_ORDER = [43, 44, 38, 41, 33, 59, 60];

/** 打包单：触发类型 → 票面字段 → 重打 → 分张 */
const KITCHEN_PACKING_SLIP_SEQ_ORDER = [39, 298, 299, 300];

assignSort(KITCHEN_VOID_NOTIFY_SEQ_ORDER);
assignSort(KITCHEN_ORDER_SEND_SEQ_ORDER);
assignSort(KITCHEN_TICKET_ISSUE_SEQ_ORDER);
assignSort(KITCHEN_PRINTER_ROUTE_SEQ_ORDER);
assignSort(KITCHEN_LINE_MERGE_RULES_SEQ_ORDER);
assignSort(KITCHEN_CROSS_TICKET_FIELDS_SEQ_ORDER);
assignSort(KITCHEN_TICKET_GROUPING_SEQ_ORDER);
assignSort(KITCHEN_TICKET_FIELDS_SEQ_ORDER);
assignSort(KITCHEN_TICKET_FORMAT_SEQ_ORDER);
assignSort(KITCHEN_PACKING_SLIP_SEQ_ORDER);

/** 门店管理 · 设置滑层二级导航（品牌与菜单已抽离为 /stores/brand-menu） */
export const STORE_SETTINGS_GROUP_ORDER = [
  "store-profile",
  "store-hours-operation",
  "address-data-maintenance",
];

/** 门店管理 · 品牌与菜单（与门店状态同级入口） */
export const STORE_BRAND_MENU_GROUP_ORDER = ["brand-menu-presentation"];

/** 门店档案：国家/地区 → 基本信息 */
const STORE_PROFILE_SEQ_ORDER = [173, 417, 433];

/** 营业与运营：时段 → 周期 → 打烊提示 → 餐厅模式 */
const STORE_HOURS_OPERATION_SEQ_ORDER = [418, 77, 582, 170];

/** 品牌与菜单：品牌数据 → 品牌页作为首页（含原 531） */
const STORE_BRAND_MENU_SEQ_ORDER = [547, 530];

assignSort(STORE_PROFILE_SEQ_ORDER);
assignSort(STORE_HOURS_OPERATION_SEQ_ORDER);
assignSort(STORE_BRAND_MENU_SEQ_ORDER);

/** 支付中心 · 支付手段：预设清单 → 渠道 → 自定义 → 界面暴露 */
const PAYMENT_METHODS_SEQ_ORDER = [234];

assignSort(PAYMENT_METHODS_SEQ_ORDER);

/** 支付中心 · 税务计算：税率 → 税基 → 加收应税 → 免税 → 服务费计税顺序 */
const PAYMENT_TAX_RULES_SEQ_ORDER = [445, 143, 142, 144, 160];

assignSort(PAYMENT_TAX_RULES_SEQ_ORDER);

/** 支付中心 · 小费：计算 → POS 录入 → 结账预设 → 收据建议 */
const PAYMENT_TIP_POLICY_SEQ_ORDER = [293, 294, 253, 232, 231, 244, 237, 266, 295, 296];

assignSort(PAYMENT_TIP_POLICY_SEQ_ORDER);

/** 支付中心 · BATCH与日结：关账时刻 → 结算周期 → 队列上限 → 准入/前置 → 后置打印 */
const PAYMENT_BATCH_SETTLEMENT_SEQ_ORDER = [238, 230, 236, 239, 240, 235];

assignSort(PAYMENT_BATCH_SETTLEMENT_SEQ_ORDER);

/** 团队 · 考勤：241 Batch 门禁置末 */
const TEAM_BATCH_ATTENDANCE_SEQ_ORDER = [241];

/** 财务 · 钱箱备款与平账（v2 方案 A；64 合并进 63） */
const DRAWER_FLOAT_RECONCILE_SEQ_ORDER = [63, 76, 181];

/** 财务 · 现金日结与班结（v2 方案 A） */
const DAILY_CASH_CLOSE_SEQ_ORDER = [171, 65, 330];

/** 财务 · 收单成本与报表口径（v2 方案 A；305 已迁支付中心） */
const PROCESSOR_COST_BASIS_SEQ_ORDER = [307];

assignSort(TEAM_BATCH_ATTENDANCE_SEQ_ORDER);
assignSort(DRAWER_FLOAT_RECONCILE_SEQ_ORDER);
assignSort(DAILY_CASH_CLOSE_SEQ_ORDER);
assignSort(PROCESSOR_COST_BASIS_SEQ_ORDER);

/** 系统设置 · 区域与显示 */
const LOCALE_DISPLAY_SEQ_ORDER = [109, 168];

assignSort(LOCALE_DISPLAY_SEQ_ORDER);

/** 系统设置 · 数据与备份 */
const DATA_BACKUP_SEQ_ORDER = [423, 422];

assignSort(DATA_BACKUP_SEQ_ORDER);

/** 系统设置 · 连接与服务 */
const CONNECTIONS_ONLINE_ORDER_SEQ_ORDER = [93, 95, 96, 97, 99, 100, 101, 102, 103, 104, 105, 106];
const CONNECTIONS_HR_SCHEDULING_SEQ_ORDER = [78, 79, 80, 81, 458];
const CONNECTIONS_PAYMENT_ACQUIRING_SEQ_ORDER = [459, 460];

assignSort(CONNECTIONS_ONLINE_ORDER_SEQ_ORDER);
assignSort(CONNECTIONS_HR_SCHEDULING_SEQ_ORDER);
assignSort(CONNECTIONS_PAYMENT_ACQUIRING_SEQ_ORDER);

/** 系统设置 · 高级与诊断 */
const ADVANCED_DEBUG_SEQ_ORDER = [188, 189];
const ADVANCED_PLATFORM_SEQ_ORDER = [187, 190, 191, 192];

assignSort(ADVANCED_DEBUG_SEQ_ORDER);
assignSort(ADVANCED_PLATFORM_SEQ_ORDER);

export {
  FINANCE_SETTINGS_GROUP_ORDER,
  FINANCE_SETTINGS_GROUP_NAV_SECTIONS,
} from "./finance-settings-groups.mjs";

export {
  PAYMENT_SETTINGS_GROUP_ORDER,
  PAYMENT_SETTINGS_GROUP_NAV_SECTIONS,
} from "./payment-settings-groups.mjs";

export {
  ORDER_SETTINGS_GROUP_ORDER,
  ORDER_SETTINGS_GROUP_NAV_SECTIONS,
} from "./order-settings-groups.mjs";

/** 促销中心 · /promotions/settings 二级导航（150 子单促销重算等） */
export const PROMOTION_SETTINGS_GROUP_ORDER = ["promo-strategy", "promo-channel"];

/** 硬件管理中心 · 全局默认设备（386–395，virtual catalog） */
export const HARDWARE_SETTINGS_GROUP_ORDER = ["global-default-devices"];

const HARDWARE_GLOBAL_DEFAULT_SEQ_ORDER = [386, 387, 388, 389, 390, 391, 392, 393, 394, 395];

assignSort(HARDWARE_GLOBAL_DEFAULT_SEQ_ORDER);

/** 点单页展示（与 foh-pos-order-cart 同序；138 已迁 foh-pos-combo-ordering） */
const POS_ORDER_CART_SEQ_ORDER = [132, 133, 135, 137, 178, 121, 122, 222, 223];

/** 前厅 · 套餐与自定义点单（v2.0 自商品中心迁入 + 138） */
const POS_COMBO_ORDERING_SEQ_ORDER = [138, 139, 145];

/** 会员中心 · 会员账户与卡体系（v1.8 仅 1 组） */
const MEMBER_ACCOUNT_SYSTEM_SEQ_ORDER = [86, 87, 88, 89];

assignSort(POS_ORDER_CART_SEQ_ORDER);
assignSort(POS_COMBO_ORDERING_SEQ_ORDER);
assignSort(MEMBER_ACCOUNT_SYSTEM_SEQ_ORDER);

/** 订单基础：默认类型 → 单号模式 → 起始/上限 → 分类 → 重置 */
const ORDER_BASICS_SEQ_ORDER = [126, 129, 128, 127, 130, 131];

/** 改单与分合单：部分支付改单 → 应收编辑 → 合单 → 分单展示 */
const ORDER_EDIT_SPLIT_MERGE_SEQ_ORDER = [117, 116, 115, 124, 119, 140];

/** 促销中心 · 促销活动与规则（150 子单促销重算） */
const PROMO_STRATEGY_SEQ_ORDER = [150];

/** 促销中心 · 抽奖活动设置 */
const LOTTERY_ACTIVITY_SETTINGS_SEQ_ORDER = [647];

/** 促销中心 · 抽奖动画设置 */
const LOTTERY_ANIMATION_SETTINGS_SEQ_ORDER = [672];

assignSort(PROMO_STRATEGY_SEQ_ORDER);
assignSort(LOTTERY_ACTIVITY_SETTINGS_SEQ_ORDER);
assignSort(LOTTERY_ANIMATION_SETTINGS_SEQ_ORDER);

/** 折扣：预设 → 原因策略 */
const ORDER_DISCOUNT_SEQ_ORDER = [446, 162, 163, 164];

/** 附加费与服务费：预设 → 合单重算 → 线上服务费 */
const ORDER_SURCHARGE_FEES_SEQ_ORDER = [447, 149, 161];

/** 结算取整：总价四舍五入 */
const ORDER_SETTLEMENT_ROUNDING_SEQ_ORDER = [147];

/** 删单与退款：删未付款 → 按菜退款 → 原因必填 → 原因枚举 */
const ORDER_VOID_REFUND_SEQ_ORDER = [158, 159, 157, 156];

/** POS 找单列表：展示/筛选 → 打印（154 盘点模式已下线） */
const POS_FIND_ORDER_LIST_SEQ_ORDER = [151, 152, 153, 251];

/** POS 结账入口：条码找单进付款 → 支付前确认 */
const POS_CHECKOUT_ENTRY_SEQ_ORDER = [248, 221];

assignSort(POS_ORDER_CART_SEQ_ORDER);
assignSort(POS_FIND_ORDER_LIST_SEQ_ORDER);
assignSort(POS_CHECKOUT_ENTRY_SEQ_ORDER);
assignSort(ORDER_BASICS_SEQ_ORDER);
assignSort(ORDER_EDIT_SPLIT_MERGE_SEQ_ORDER);
assignSort(ORDER_DISCOUNT_SEQ_ORDER);
assignSort(ORDER_SURCHARGE_FEES_SEQ_ORDER);
assignSort(ORDER_SETTLEMENT_ROUNDING_SEQ_ORDER);
assignSort(ORDER_VOID_REFUND_SEQ_ORDER);

export {
  PRINT_SETTINGS_GROUP_ORDER,
  PRINT_SETTINGS_GROUP_NAV_SECTIONS,
} from "./print-settings-groups.mjs";

import { PRINT_SETTINGS_INTRA_GROUP_SEQ } from "./print-settings-groups.mjs";

for (const seqs of Object.values(PRINT_SETTINGS_INTRA_GROUP_SEQ)) {
  assignSort(seqs);
}

/** 外卖/来取设置页二级导航展示顺序（v2.5） */
export const DELIVERY_SETTINGS_GROUP_ORDER = [
  "scan-online-basics",
  "map-address-services",
  "platform-delivery-slips",
  "delivery-packaging",
];

/** 消息中心设置页二级导航展示顺序（v1.3：仅顾客短信渠道） */
export const NOTIFICATIONS_SETTINGS_GROUP_ORDER = ["customer-order-sms"];

export {
  LOCALE_DISPLAY_GROUP_ORDER,
  DATA_BACKUP_GROUP_ORDER,
  CONNECTIONS_GROUP_ORDER,
  ADVANCED_GROUP_ORDER,
  ADVANCED_GROUP_NAV_SECTIONS,
} from "./system-settings-groups.mjs";

export { FOH_SETTINGS_GROUP_ORDER } from "./foh-settings-groups.mjs";

export {
  KDS_DISPLAY_SETTINGS_GROUP_ORDER,
  KDS_WORKFLOW_SETTINGS_GROUP_ORDER,
} from "./kds-terminal-settings-groups.mjs";

for (const [seq, sort] of Object.entries(KDS_TERMINAL_INTRA_GROUP_SORT_BY_SEQ)) {
  INTRA_GROUP_SORT_BY_SEQ.set(Number(seq), sort);
}
