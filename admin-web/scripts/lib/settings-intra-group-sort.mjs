/**
 * 设置项组内展示顺序（sortInGroup 越小越靠前）。
 * 未列出的 seq 在组内仍按 seq 升序排在已定义项之后。
 */

/** 操作按钮显隐：仅「隐藏到更多」类（seq 193–215） */
const POS_BUTTON_VISIBILITY_SEQ_ORDER = [
  193, 194, 195, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212,
  213, 214, 215,
];

/** POS 点单页工具栏：分割线命名 → 超时提醒 → 四区工具栏配置 */
const POS_ORDER_TOOLBAR_SEQ_ORDER = [196, 110, 483, 484, 485, 486];

/**
 * POS 菜单与布局：菜单查找 → 时段菜单 → 点餐界面布局（组/类/菜/样式/价格）→ iPad 扩展
 */
export const POS_MENU_UI_SEQ_ORDER = [
  118,
  176, 177, 348,
  216, 217, 218, 219, 220,
  350,
];

/** @type {Map<number, number>} */
export const INTRA_GROUP_SORT_BY_SEQ = new Map();

let sortCursor = 0;
function assignSort(seqList, step = 10) {
  for (const seq of seqList) {
    INTRA_GROUP_SORT_BY_SEQ.set(seq, (sortCursor += step));
  }
}

assignSort(POS_BUTTON_VISIBILITY_SEQ_ORDER);
assignSort(POS_ORDER_TOOLBAR_SEQ_ORDER);
assignSort(POS_MENU_UI_SEQ_ORDER);

/** 桌台与餐位：选桌/开单桌台校验 → 清桌与企台 */
const TABLES_FLOOR_SEQ_ORDER = [107, 619, 643, 644, 592, 169, 534, 642, 351, 347];

/** 开单流程：人数页与人数规则 */
const POS_ORDER_INIT_SEQ_ORDER = [111, 625, 621];

/** 送厨流程：送厨/付款/结账/打单联动 → 全局延迟 */
const POS_KITCHEN_SEND_SEQ_ORDER = [113, 114, 120, 123, 581, 125, 345];

assignSort(TABLES_FLOOR_SEQ_ORDER);
assignSort(POS_ORDER_INIT_SEQ_ORDER);
assignSort(POS_KITCHEN_SEND_SEQ_ORDER);

/** 食客端·界面语言（C 端多产线 SSOT） */
const GUEST_FACING_LOCALE_SEQ_ORDER = [652, 653];

assignSort(GUEST_FACING_LOCALE_SEQ_ORDER);

/** 食客端·菜单结构：服务设置·菜单树 */
const GUEST_MENU_STRUCTURE_SEQ_ORDER = [515, 516, 517, 518, 519, 520, 524, 525, 526, 528];

/** 食客端·首页与版式：品牌/模式 → 列表 → 首页 → 样式 */
const GUEST_MENU_GLOBAL_SEQ_ORDER = [
  532, 599, 601, 602, 604, 606, 607, 608, 611, 509, 600, 645,
];

/** 食客端·购物车展示 */
const GUEST_MENU_CART_SEQ_ORDER = [616, 617, 618];

/** 食客端·下单与规则：C 端送厨 → Kiosk 履约流程 → 计价/提示 → 火锅 → 用餐时长 → 轮次规则 → 线上 host/送餐到桌餐牌 */
const GUEST_ORDER_RULES_SEQ_ORDER = [
  94, 502, 595, 596, 349, 487, 488, 489, 490, 491, 620, 626, 623, 622, 504, 505, 506, 507, 510, 527, 594, 443, 571, 627, 572, 574, 575, 573, 569, 570, 577, 578, 579, 580, 597, 598, 646,
  503,
];

/** 外卖/来取 v2.4：线上下单开关 → 外送区域 */
const DELIVERY_SCAN_ONLINE_SEQ_ORDER = [90, 92];
const DELIVERY_PLATFORM_SLIPS_SEQ_ORDER = [257, 267];
const DELIVERY_PACKAGING_SEQ_ORDER = [429];

/** 平台业务中心 · 线上订餐对接（host/callback） */
const ONLINE_ORDER_SERVICE_SEQ_ORDER = [93, 95, 96, 97, 99, 100, 101, 102, 103, 104, 105, 106];

/** 桌边·呼叫服务员：总开关 → 未开单 → 间隔 → 服务类型 */
const TABLESIDE_SERVICE_CALL_SEQ_ORDER = [629, 641, 640, 333];

/** 消息中心 · 店内员工订单提醒 */
const STAFF_ORDER_ALERTS_SEQ_ORDER = [638, 639, 637];

/** 消息中心 · 顾客短信与取餐通知 */
const CUSTOMER_ORDER_SMS_SEQ_ORDER = [334, 335, 336, 337, 338, 339, 340];

/** 备注与附加服务：备注 → 餐具/打包附加费 */
const GUEST_NOTES_FEES_SEQ_ORDER = [521, 522, 523];

assignSort(GUEST_MENU_STRUCTURE_SEQ_ORDER);
assignSort(GUEST_MENU_GLOBAL_SEQ_ORDER);
assignSort(GUEST_MENU_CART_SEQ_ORDER);
assignSort(GUEST_ORDER_RULES_SEQ_ORDER);

/** 食客下单限流：下单时间间隔（用餐时长/次数/数量类见菜单下单限制） */
const GUEST_ORDER_THROTTLE_SEQ_ORDER = [588, 589, 590, 591];

assignSort(GUEST_ORDER_THROTTLE_SEQ_ORDER);

/** 权限中心 · 账户与会话安全：空闲/操作后登出、登录输入规则 */
const ACCOUNT_SESSION_SECURITY_SEQ_ORDER = [75, 166, 175];

/** 团队管理 · 考勤与工时：休息/工时上限 → 登出与工单状态 → 打卡与 batch 门禁 */
const TIME_ATTENDANCE_SEQ_ORDER = [66, 67, 68, 69, 70, 71, 72, 73, 329, 241];

assignSort(ACCOUNT_SESSION_SECURITY_SEQ_ORDER);

/** 主界面与导航：默认主界面 → 主页密码门禁 */
const POS_SHELL_LANDING_SEQ_ORDER = [165, 346];

assignSort(POS_SHELL_LANDING_SEQ_ORDER);
assignSort(TIME_ATTENDANCE_SEQ_ORDER);
assignSort(TABLESIDE_SERVICE_CALL_SEQ_ORDER);
assignSort(STAFF_ORDER_ALERTS_SEQ_ORDER);
assignSort(CUSTOMER_ORDER_SMS_SEQ_ORDER);
assignSort(DELIVERY_SCAN_ONLINE_SEQ_ORDER);
assignSort(DELIVERY_PLATFORM_SLIPS_SEQ_ORDER);
assignSort(DELIVERY_PACKAGING_SEQ_ORDER);
assignSort(ONLINE_ORDER_SERVICE_SEQ_ORDER);
assignSort(GUEST_NOTES_FEES_SEQ_ORDER);

/** 支付中心 · 卡支付规则与合规 */
const PAYMENT_CARD_FEES_SEQ_ORDER = [82, 242, 243, 180, 454, 172];

/** 支付中心 · 小费与刷卡顺序（全终端 SSOT） */
const CHECKOUT_TIP_CARD_ORDER_SEQ_ORDER = [9];

/** 支付中心 · 客显结账：小费 → 签名 → 小票 */
const CDS_CHECKOUT_UX_SEQ_ORDER = [463, 464, 465, 669];

assignSort(PAYMENT_CARD_FEES_SEQ_ORDER);
assignSort(CHECKOUT_TIP_CARD_ORDER_SEQ_ORDER);
assignSort(CDS_CHECKOUT_UX_SEQ_ORDER);

/** 后厨管理中心设置页二级导航展示顺序 */
export const KITCHEN_SETTINGS_GROUP_ORDER = [
  "send-routing",
  "ticket-grouping",
  "line-merge-rules",
  "ticket-fields",
  "ticket-format",
  "packing-slip",
];

/** 送厨触发与路由：类型/路由 → 未付送厨 → 分票 → 首次送厨整单 */
const KITCHEN_SEND_ROUTING_SEQ_ORDER = [36, 37, 62, 32, 304];

/** 行级合并规则：矩阵宿主 52（53/287/288/301/302 在 UI 中合并展示） */
const KITCHEN_LINE_MERGE_RULES_SEQ_ORDER = [52, 53, 287, 288, 301, 302];

/** 厨房单·分组与拆单：分区 → 多语言分行 → 结构拆分（合并规则见 line-merge-rules） */
const KITCHEN_TICKET_GROUPING_SEQ_ORDER = [54, 40, 47, 51, 61];

/** 厨房单·票面信息：送厨次数 → 价格/序号/顾客/合计 */
const KITCHEN_TICKET_FIELDS_SEQ_ORDER = [35, 42, 45, 46, 48, 271, 49, 50, 55, 56, 57, 58];

/** 厨房单·版式格式：边距 → 强调样式 → 行分隔 → 数量与分段序号 */
const KITCHEN_TICKET_FORMAT_SEQ_ORDER = [43, 44, 38, 258, 41, 33, 59, 60];

/** 打包单：触发类型 → 票面字段 → 重打 → 分张 */
const KITCHEN_PACKING_SLIP_SEQ_ORDER = [39, 298, 299, 300];

assignSort(KITCHEN_SEND_ROUTING_SEQ_ORDER);
assignSort(KITCHEN_LINE_MERGE_RULES_SEQ_ORDER);
assignSort(KITCHEN_TICKET_GROUPING_SEQ_ORDER);
assignSort(KITCHEN_TICKET_FIELDS_SEQ_ORDER);
assignSort(KITCHEN_TICKET_FORMAT_SEQ_ORDER);
assignSort(KITCHEN_PACKING_SLIP_SEQ_ORDER);

/** 门店管理 · 设置滑层二级导航（品牌与菜单展示已抽离为 /stores/brand-menu） */
export const STORE_SETTINGS_GROUP_ORDER = [
  "store-profile",
  "store-hours-operation",
  "address-data-maintenance",
];

/** 门店管理 · 品牌与菜单展示（与门店状态同级入口） */
export const STORE_BRAND_MENU_GROUP_ORDER = ["brand-menu-presentation"];

/** 门店档案：国家/地区 → 基本信息 */
const STORE_PROFILE_SEQ_ORDER = [173, 417, 433];

/** 营业与运营：时段 → 周期 → 打烊提示 → 餐厅模式 */
const STORE_HOURS_OPERATION_SEQ_ORDER = [418, 77, 582, 170];

assignSort(STORE_PROFILE_SEQ_ORDER);
assignSort(STORE_HOURS_OPERATION_SEQ_ORDER);

/** 支付中心 · 支付手段：预设清单 → 渠道 → 自定义 → 界面暴露 */
const PAYMENT_METHODS_SEQ_ORDER = [234];

assignSort(PAYMENT_METHODS_SEQ_ORDER);

/** 支付中心 · 税务规则：税率 → 免税例外 → 税基 → 加收应税 → 服务费计税顺序 */
const PAYMENT_TAX_RULES_SEQ_ORDER = [445, 144, 143, 142, 160, 290];

assignSort(PAYMENT_TAX_RULES_SEQ_ORDER);

/** 支付中心 · 小费政策：收取模式 → 基数 → 预设/收据 → 展示/风控 */
const PAYMENT_TIP_POLICY_SEQ_ORDER = [231, 293, 294, 253, 237, 493, 295, 296, 266, 244, 232];

assignSort(PAYMENT_TIP_POLICY_SEQ_ORDER);

/** 支付中心 · BATCH与日结：关账时刻 → 结算周期 → 队列上限 → 准入/前置 → 后置打印 */
const PAYMENT_BATCH_SETTLEMENT_SEQ_ORDER = [238, 230, 236, 239, 240, 235];

assignSort(PAYMENT_BATCH_SETTLEMENT_SEQ_ORDER);

/** 团队 · 考勤：241 Batch 门禁置末 */
const TEAM_BATCH_ATTENDANCE_SEQ_ORDER = [241];

/** 财务 · 钱箱与现金平账（v1.1：64 合并进 63） */
const CASH_DRAWER_RECONCILIATION_SEQ_ORDER = [63, 76, 181];

/** 财务 · 日结与结算（v1.1：65 自钱箱组迁入） */
const DAILY_CLOSE_SETTLEMENT_SEQ_ORDER = [171, 65, 330];

/** 财务 · 费用折扣与小费支出 */
const FEES_TIPS_EXPENSE_SEQ_ORDER = [305, 307];

assignSort(TEAM_BATCH_ATTENDANCE_SEQ_ORDER);
assignSort(CASH_DRAWER_RECONCILIATION_SEQ_ORDER);
assignSort(DAILY_CLOSE_SETTLEMENT_SEQ_ORDER);
assignSort(FEES_TIPS_EXPENSE_SEQ_ORDER);

/** 平台业务 · 外部系统对接 */
const INTEGRATIONS_EXTERNAL_SEQ_ORDER = [78, 79, 80, 81];

assignSort(INTEGRATIONS_EXTERNAL_SEQ_ORDER);

/** 系统设置 · 界面与操作偏好 */
const UI_OPERATION_PREFERENCES_SEQ_ORDER = [168, 174];

assignSort(UI_OPERATION_PREFERENCES_SEQ_ORDER);

/** 财务中心设置页二级导航展示顺序（449/450 已迁业务页） */
export const FINANCE_SETTINGS_GROUP_ORDER = [
  "cash-drawer-reconciliation",
  "daily-close-settlement",
  "fees-tips-expense",
];

/** 支付中心设置页二级导航展示顺序 */
export const PAYMENT_SETTINGS_GROUP_ORDER = [
  "payment-gateway",
  "payment-methods",
  "tax-rules",
  "tip-policy",
  "batch-settlement",
  "card-fees",
  "checkout-tip-card-order",
  "cds-checkout-ux",
];

/** 订单中心设置页二级导航展示顺序 */
export const ORDER_SETTINGS_GROUP_ORDER = [
  "order-init-scenario",
  "order-numbering",
  "split-merge-edit",
  "order-discount",
  "order-surcharge",
  "order-settlement",
  "order-void",
];

/** 硬件管理中心 · 全局默认设备（386–395，virtual catalog） */
export const HARDWARE_SETTINGS_GROUP_ORDER = ["global-default-devices"];

const HARDWARE_GLOBAL_DEFAULT_SEQ_ORDER = [386, 387, 388, 389, 390, 391, 392, 393, 394, 395];

assignSort(HARDWARE_GLOBAL_DEFAULT_SEQ_ORDER);

/** 点单页展示：行展示 → 相同菜 → 菜序/时间 → 小数数量 → 单菜序号 → 减菜跳转 → 顾客信息必填 → 自定义点单 */
const POS_ORDER_CART_SEQ_ORDER = [132, 133, 135, 137, 121, 178, 122, 222, 223, 138];

/** 前厅 · 套餐点单与展示（v2.0 自商品中心迁入） */
const POS_COMBO_ORDERING_SEQ_ORDER = [139, 145];

/** 会员中心 · 会员账户与卡体系（v1.8 仅 1 组） */
const MEMBER_ACCOUNT_SYSTEM_SEQ_ORDER = [86, 87, 88, 89];

assignSort(POS_ORDER_CART_SEQ_ORDER);
assignSort(POS_COMBO_ORDERING_SEQ_ORDER);
assignSort(MEMBER_ACCOUNT_SYSTEM_SEQ_ORDER);

/** 分单合单与改单：改应收/部分支付 → 分单展示 → 送厨后改调味 → 合单 → 拆单促销重算 */
const SPLIT_MERGE_EDIT_SEQ_ORDER = [115, 116, 117, 119, 140, 141, 124, 150];

/** 促销中心 · 抽奖活动设置 */
const LOTTERY_ACTIVITY_SETTINGS_SEQ_ORDER = [647];

/** 促销中心 · 抽奖动画设置 */
const LOTTERY_ANIMATION_SETTINGS_SEQ_ORDER = [672];

assignSort(LOTTERY_ACTIVITY_SETTINGS_SEQ_ORDER);
assignSort(LOTTERY_ANIMATION_SETTINGS_SEQ_ORDER);

/** 折扣：预设 → 原因策略 */
const ORDER_DISCOUNT_SEQ_ORDER = [446, 162, 163, 164];

/** 加收：预设 → 合单重算 → 线上服务费 */
const ORDER_SURCHARGE_SEQ_ORDER = [447, 149, 161];

/** 金额结算：总价四舍五入 */
const ORDER_SETTLEMENT_SEQ_ORDER = [147];

/** 删退与作废：厨打联动 → 原因与权限 → 按菜退款 */
const ORDER_VOID_SEQ_ORDER = [155, 156, 157, 158, 159];

/** POS 找单列表：展示/筛选 → 打印（154 盘点模式已下线） */
const POS_FIND_ORDER_LIST_SEQ_ORDER = [151, 152, 153, 251];

/** POS 结账入口：条码找单进付款 → 支付前确认 */
const POS_CHECKOUT_ENTRY_SEQ_ORDER = [248, 221];

assignSort(POS_ORDER_CART_SEQ_ORDER);
assignSort(POS_FIND_ORDER_LIST_SEQ_ORDER);
assignSort(POS_CHECKOUT_ENTRY_SEQ_ORDER);
assignSort(SPLIT_MERGE_EDIT_SEQ_ORDER);
assignSort(ORDER_DISCOUNT_SEQ_ORDER);
assignSort(ORDER_SURCHARGE_SEQ_ORDER);
assignSort(ORDER_SETTLEMENT_SEQ_ORDER);
assignSort(ORDER_VOID_SEQ_ORDER);

/** 打印中心设置页二级导航展示顺序（v1.10 版式拆为明细与价格 + 版式与辅助） */
export const PRINT_SETTINGS_GROUP_ORDER = [
  "print-foundation-devices",
  "order-receipt-trigger",
  "payment-receipt-flow",
  "receipt-print-execution",
  "receipt-line-content",
  "receipt-layout-format",
  "packing-slip-print",
  "ticket-number-slip",
];

const PRINT_FOUNDATION_SEQ_ORDER = [167, 256, 259, 265, 269];
const ORDER_RECEIPT_TRIGGER_SEQ_ORDER = [654, 500];
const PAYMENT_RECEIPT_FLOW_SEQ_ORDER = [246, 261, 250, 247, 272];
const RECEIPT_PRINT_EXECUTION_SEQ_ORDER = [262, 273];
const RECEIPT_LINE_CONTENT_SEQ_ORDER = [275, 274, 278, 276, 285, 289, 283, 284];
const RECEIPT_LAYOUT_FORMAT_SEQ_ORDER = [282, 286, 277, 279, 280, 264];
const PRINT_PACKING_SLIP_PRINT_SEQ_ORDER = [34, 281, 297, 303];

assignSort(PRINT_FOUNDATION_SEQ_ORDER);
assignSort(ORDER_RECEIPT_TRIGGER_SEQ_ORDER);
assignSort(PAYMENT_RECEIPT_FLOW_SEQ_ORDER);
assignSort(RECEIPT_PRINT_EXECUTION_SEQ_ORDER);
assignSort(RECEIPT_LINE_CONTENT_SEQ_ORDER);
assignSort(RECEIPT_LAYOUT_FORMAT_SEQ_ORDER);
assignSort(PRINT_PACKING_SLIP_PRINT_SEQ_ORDER);

/** 外卖/来取设置页二级导航展示顺序（v2.5） */
export const DELIVERY_SETTINGS_GROUP_ORDER = [
  "scan-online-basics",
  "platform-delivery-slips",
  "delivery-packaging",
];

/** 平台业务中心设置页二级导航展示顺序（含线上订餐对接） */
/** 消息中心设置页二级导航展示顺序（v1.1：员工提醒与顾客短信分轨） */
export const NOTIFICATIONS_SETTINGS_GROUP_ORDER = [
  "notification-basics",
  "staff-order-alerts",
  "customer-order-sms",
];

export const INTEGRATIONS_SETTINGS_GROUP_ORDER = [
  "integrations",
  "online-order-service",
  "高级设置",
  "LevelUp",
  "7shifts",
  "Ingenico-Blu",
  "WorldPay",
];

/** 前厅管理中心设置页二级导航展示顺序 */
export const FOH_SETTINGS_GROUP_ORDER = [
  "tables-floor",
  "pos-shell-landing",
  "pos-order-init",
  "pos-kitchen-send",
  "pos-button-visibility",
  "pos-order-toolbar",
  "pos-order-cart",
  "pos-combo-ordering",
  "pos-find-order-list",
  "pos-checkout-entry",
  "pos-menu-ui",
  "guest-menu-structure",
  "guest-menu-global",
  "guest-menu-cart",
  "guest-facing-locale",
  "guest-order-rules",
  "guest-order-throttle",
  "tableside-service-call",
  "guest-notes-fees",
  "wait-time",
];
