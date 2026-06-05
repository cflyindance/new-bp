/**
 * 设置滑层中展示开关控件的 seq（原型：本地 localStorage 持久化）。
 */

import { PRINT_FOUNDATION_TOGGLE_SEQS } from "./module-settings-print-foundation-ui";
import {
  DELETE_CARD_RECEIPT_PRINT_TOGGLE_SEQS,
  PAYMENT_RECEIPT_FLOW_TOGGLE_SEQS,
} from "./module-settings-payment-receipt-flow-ui";
import {
  TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ,
  TABLESIDE_SERVICE_CALL_TOGGLE_SEQS,
} from "./module-settings-tableside-service-call-ui";
import { DELIVERY_PLATFORM_SLIPS_TOGGLE_SEQS } from "./module-settings-delivery-platform-slips-ui";
import { PAYMENT_TAX_POLICY_TOGGLE_SEQS } from "./module-settings-payment-tax-rules-ui";
import { TIP_RECEIPT_SUGGESTION_TOGGLE_SEQS } from "./module-settings-payment-tip-policy-ui";
import { PACKING_SLIP_PRINT_TOGGLE_SEQS } from "./module-settings-packing-slip-print-ui";
import { PACKING_SLIP_VOID_STYLE_TOGGLE_SEQS } from "./module-settings-packing-slip-void-style-ui";
import { RECEIPT_LAYOUT_FORMAT_TOGGLE_SEQS } from "./module-settings-receipt-layout-format-ui";
import { RECEIPT_LINE_CONTENT_TOGGLE_SEQS } from "./module-settings-receipt-line-content-ui";
import { RECEIPT_PRINT_EXECUTION_TOGGLE_SEQS } from "./module-settings-receipt-print-execution-ui";

export {
  DELETE_CARD_RECEIPT_PRINT_TOGGLE_SEQS,
  PRINT_FOUNDATION_TOGGLE_SEQS,
  PAYMENT_RECEIPT_FLOW_TOGGLE_SEQS,
  RECEIPT_PRINT_EXECUTION_TOGGLE_SEQS,
  RECEIPT_LINE_CONTENT_TOGGLE_SEQS,
  RECEIPT_LAYOUT_FORMAT_TOGGLE_SEQS,
  PACKING_SLIP_PRINT_TOGGLE_SEQS,
  DELIVERY_PLATFORM_SLIPS_TOGGLE_SEQS,
  PACKING_SLIP_VOID_STYLE_TOGGLE_SEQS,
  TABLESIDE_SERVICE_CALL_TOGGLE_SEQS,
};

/** 操作按钮显隐：193–195、197–215（不含 196；按产线见 pos-button-visibility-ui） */
export const POS_BUTTON_VISIBILITY_TOGGLE_SEQ: readonly number[] = [
  ...Array.from({ length: 3 }, (_, i) => 193 + i),
  ...Array.from({ length: 19 }, (_, i) => 197 + i),
];

/** 桌台与餐位：清桌、企台等运营策略（平面图 seq 428 见餐位平面图功能页） */
/** 前厅 · 选桌页面（107 合并 533；产线多选见 table-selection-page-ui） */
export const TABLE_SELECTION_PAGE_TOGGLE_SEQ: readonly number[] = [107];

/** 前厅 · 人数选择（619 合并 108；产线多选见 party-size-selection-page-ui） */
export const PARTY_SIZE_SELECTION_PAGE_TOGGLE_SEQ: readonly number[] = [619];

/** 前厅 · 开单前换桌 / 开单前必须换桌（643/644；产线多选见 pre-order-table-change-ui） */
export const PRE_ORDER_TABLE_CHANGE_TOGGLE_SEQ: readonly number[] = [643, 644];

/** 前厅 · 不允许一桌多单（592 按产线见 single-table-order-limit-ui） */
export const SINGLE_TABLE_NO_MULTI_ORDER_TOGGLE_SEQ: readonly number[] = [592];

/** 前厅 · 付款后清桌模式（169 按产线见 post-payment-clear-table-ui） */
export const POST_PAYMENT_CLEAR_TABLE_TOGGLE_SEQ: readonly number[] = [169];

/** 前厅 · 自动清桌（534 按产线见 auto-clear-table-ui） */
export const AUTO_CLEAR_TABLE_TOGGLE_SEQ: readonly number[] = [534];

/** 前厅 · 展示清桌按钮（642，仅 eMenu，见 clear-table-button-ui） */
export const CLEAR_TABLE_BUTTON_TOGGLE_SEQ: readonly number[] = [642];

/** 前厅 · 向客户端发送清桌通知（351 按产线见 clear-table-client-notification-ui） */
export const CLEAR_TABLE_CLIENT_NOTIFICATION_TOGGLE_SEQ: readonly number[] = [351];

/** 前厅 · 允许更换企台（347 按产线见 allow-change-server-ui） */
export const ALLOW_CHANGE_SERVER_TOGGLE_SEQ: readonly number[] = [347];

/** 前厅 · 主页密码权限（346 按产线见 home-password-auth-ui） */
export const HOME_PASSWORD_AUTH_TOGGLE_SEQ: readonly number[] = [346];

/** 前厅 · 允许食客更改人数（621 按产线见 guest-change-party-size-ui） */
export const GUEST_CHANGE_PARTY_SIZE_TOGGLE_SEQ: readonly number[] = [621];

/** 前厅 · 儿童不参与下单限制规则人数计算（625 按产线见 child-excluded-from-order-limit-ui） */
export const CHILD_EXCLUDED_FROM_ORDER_LIMIT_TOGGLE_SEQ: readonly number[] = [625];

/** 前厅 · 点击「送厨」整单送厨（113 按产线见 send-kitchen-whole-order-ui） */
export const SEND_KITCHEN_WHOLE_ORDER_TOGGLE_SEQ: readonly number[] = [113];

/** 前厅 · 结账后自动送厨（120 按产线见 send-kitchen-after-checkout-ui） */
export const SEND_KITCHEN_AFTER_CHECKOUT_TOGGLE_SEQ: readonly number[] = [120];

/** 前厅 · 付款/打单送厨触发（114/123 按产线见 pos-kitchen-send-trigger-ui） */
export const POS_KITCHEN_SEND_TRIGGER_TOGGLE_SEQ: readonly number[] = [114, 123];

/** 前厅 · 送厨密码权限（345 按产线见 kitchen-send-password-auth-ui） */
export const KITCHEN_SEND_PASSWORD_AUTH_TOGGLE_SEQ: readonly number[] = [345];

/** 前厅 · 点单显示座位（132 按产线订单类型见 order-display-seat-ui） */
export const ORDER_DISPLAY_SEAT_TOGGLE_SEQ: readonly number[] = [132];

/** 前厅 · 菜序模式（135 按产线见 course-sequence-mode-ui） */
export const COURSE_SEQUENCE_MODE_TOGGLE_SEQ: readonly number[] = [135];

/** 前厅 · 显示单菜序号（178 按产线见 dish-sequence-id-display-ui） */
export const DISH_SEQUENCE_ID_DISPLAY_TOGGLE_SEQ: readonly number[] = [178];

/** 前厅 · 减菜重定向/客户信息必填/自定义点单（122/222/223/138 按产线见 pos-order-cart-pos-lines-ui） */
export const POS_ORDER_CART_POS_LINES_TOGGLE_SEQ: readonly number[] = [122, 222, 223, 138];

/** 前厅 · 允许企台在电子菜单上点只读菜（349 按产线见 emenu-server-readonly-dish-ui） */
export const EMENU_SERVER_READONLY_DISH_TOGGLE_SEQ: readonly number[] = [349];

/** 前厅 · 可看不可点菜规则（595/596 按产线见 viewonly-dish-rules-ui） */
export const VIEWONLY_DISH_RULES_TOGGLE_SEQ: readonly number[] = [595, 596];

/** 前厅 · 订单备注（521 按产线见 order-remark-lines-ui） */
export const ORDER_REMARK_TOGGLE_SEQ: readonly number[] = [521];

/** 前厅 · 商品备注（522 按产线选商品见 product-remark-ui） */
export const PRODUCT_REMARK_TOGGLE_SEQ: readonly number[] = [522];

/** 打印中心 · 支付收据流程 · 收据确认签名栏（94 按产线见 receipt-signature-line-ui） */
export const RECEIPT_SIGNATURE_LINE_TOGGLE_SEQ: readonly number[] = [94];

/** 前厅 · 套餐子项备注（523 按产线见 combo-subitem-remark-lines-ui） */
export const COMBO_SUBITEM_REMARK_TOGGLE_SEQ: readonly number[] = [523];

/** 前厅 · 点单页展示简单开关 */
export const POS_ORDER_CART_SIMPLE_TOGGLE_SEQ: readonly number[] = [121, 137];

/** 后厨 · 送厨触发与路由（seq 36 为订单类型多选，见 module-settings-kitchen-order-type-ui） */
export const KITCHEN_SEND_ROUTING_TOGGLE_SEQ: readonly number[] = [32, 37, 62, 304];

/** 后厨 · 厨房单·分组与拆单（52/53 见行级合并矩阵） */
export const KITCHEN_TICKET_GROUPING_TOGGLE_SEQ: readonly number[] = [54, 40, 47, 51, 61];

/** 后厨 · 行级合并矩阵（含打包单 301/302、食客收据 287/288，由矩阵内开关控制） */
export const KITCHEN_LINE_MERGE_MATRIX_TOGGLE_SEQ: readonly number[] = [52, 53, 287, 288, 301, 302];

/** 后厨 · 厨房单显示什么（仅厨房单；271/258 见 cross-ticket-fields） */
export const KITCHEN_TICKET_FIELDS_TOGGLE_SEQ: readonly number[] = [
  35, 42, 45, 46, 48, 49, 50, 55, 56, 57, 58,
];

/** 后厨 · 跨票种显示 · 打印菜品编号（271） */
export const KITCHEN_PRINT_DISH_CODE_TOGGLE_SEQ: readonly number[] = [271];

/** 后厨 · 跨票种显示 · 外带订单增强显示（258） */
export const KITCHEN_TAKEOUT_ENHANCED_DISPLAY_TOGGLE_SEQ: readonly number[] = [258];

/** 后厨 · 厨房单样式（43+44 合并为边距输入+范围下拉，见 module-settings-kitchen-ticket-margin-ui） */
export const KITCHEN_TICKET_FORMAT_TOGGLE_SEQ: readonly number[] = [38, 41, 33, 59, 60];

/** 后厨 · 打包单（seq 39 为订单类型多选，见 module-settings-packing-slip-order-type-ui） */
export const KITCHEN_PACKING_SLIP_TOGGLE_SEQ: readonly number[] = [298, 299, 300];

/** 订单 · 改单与分合单（141/150 已迁前厅、促销中心） */
export const ORDER_SPLIT_MERGE_EDIT_TOGGLE_SEQ: readonly number[] = [
  115, 116, 117, 119, 124, 140,
];

/** 前厅 · 送厨后改调味（141，自订单中心迁入） */
export const FOH_KITCHEN_LINE_EDIT_TOGGLE_SEQ: readonly number[] = [141];

/** 后厨 · 删单向厨房通知（155，自订单中心迁入） */
export const KITCHEN_VOID_NOTIFY_TOGGLE_SEQ: readonly number[] = [155];

/** 促销 · 子单促销自动重算（150，自订单中心迁入） */
export const PROMO_SPLIT_ORDER_RECALC_TOGGLE_SEQ: readonly number[] = [150];

/** 订单 · 删单与退款（156 原因多选见 order-void-ui；155 已迁后厨） */
export const ORDER_VOID_TOGGLE_SEQ: readonly number[] = [157, 158, 159];

/** 前厅 · POS 结账入口（原订单中心 checkout-entry 迁入） */
export const POS_CHECKOUT_ENTRY_TOGGLE_SEQ: readonly number[] = [248, 221];

/** 订单 · 折扣（446 预设表；163 开关+输入见 order-discount-reason-ui） */
export const ORDER_DISCOUNT_TOGGLE_SEQ: readonly number[] = [162, 163, 164];

/** 订单 · 加收（447 预设表；147 四舍五入见 order-settlement） */
export const ORDER_SURCHARGE_TOGGLE_SEQ: readonly number[] = [149, 161];

/** 门店 · 营业与运营（seq 170 单选、418 营业时段见各自 UI 模块） */
export const STORE_HOURS_OPERATION_TOGGLE_SEQ: readonly number[] = [77, 582];

/** 支付中心 · 税务计算（445 税率输入、143 折前/折后单选；开关见 payment-tax-rules-ui） */
export const PAYMENT_TAX_POLICY_TOGGLE_SEQ = PAYMENT_TAX_POLICY_TOGGLE_SEQS;

/** 支付中心 · 小费（293/294/253/244 开关；232 开关+比例面板见 tip-policy-ui） */
export const PAYMENT_TIP_POLICY_TOGGLE_SEQ: readonly number[] = [293, 294, 253, 244];

/** 支付中心 · 小费异常提醒（232 开关 + 开启后比例输入） */
export const PAYMENT_TIP_ALERT_RATIO_TOGGLE_SEQ: readonly number[] = [232];

/** 支付中心 · 卡交易 Batch（239/240 开关；238/230/236/235 见 batch-settlement-ui） */
export const PAYMENT_BATCH_TOGGLE_SEQ: readonly number[] = [239, 240];

/** 外卖/来取 · 扫码·线上下单基础 */
export const DELIVERY_SCAN_ONLINE_BASICS_TOGGLE_SEQ: readonly number[] = [90, 92];

/** 外卖/来取 · 平台订单与小票（267 份数见 delivery-platform-slips-ui） */
export const DELIVERY_PLATFORM_SLIPS_TOGGLE_SEQ = DELIVERY_PLATFORM_SLIPS_TOGGLE_SEQS;

/** 前厅 · 可自动送厨的订单支付状态（502 产线×支付状态矩阵见 auto-kitchen-send-payment-ui） */
export const AUTO_KITCHEN_SEND_PAYMENT_TOGGLE_SEQ: readonly number[] = [502];

/** 前厅 · Kiosk 履约展示页（488–491 主开关 + Kiosk 产线，见 order-type-selection-page-ui） */
export const GUEST_KIOSK_FLOW_PAGE_TOGGLE_SEQ: readonly number[] = [488, 489, 490, 491];

/** 前厅 · eMenu 授权/开单限制（620/626 主开关 + eMenu 产线，见 guest-emenu-auth-page-ui） */
export const GUEST_EMENU_AUTH_PAGE_TOGGLE_SEQ: readonly number[] = [620, 626];

/** 前厅 · 品类模式（601/571/627 主开关 + 产线多选；601 含 eMenu/SDI，见 guest-category-mode-ui） */
export const GUEST_CATEGORY_MODE_TOGGLE_SEQ: readonly number[] = [601, 571, 627];

/** 前厅 · 菜单分类模式（602 主开关 + eMenu/SDI 产线，见 guest-menu-classification-mode-ui） */
export const GUEST_MENU_CLASSIFICATION_MODE_TOGGLE_SEQ: readonly number[] = [602];

/** 前厅 · 展示菜单类名称（606 主开关 + Kiosk/eMenu/SDI/Online Order，见 guest-menu-class-name-display-ui） */
export const GUEST_MENU_CLASS_NAME_DISPLAY_TOGGLE_SEQ: readonly number[] = [606];

/** 前厅 · 菜单图片展示模式（607 主开关 + 按产线配置，见 guest-menu-image-mode-ui） */
export const GUEST_MENU_IMAGE_MODE_TOGGLE_SEQ: readonly number[] = [607];

/** 前厅 · 火锅锅底必选（572 主开关 + eMenu/SDI 产线，见 hotpot-base-required-ui） */
export const HOTPOT_BASE_REQUIRED_TOGGLE_SEQ: readonly number[] = [572];

/** 前厅 · 火锅锅底下单后仍展示锅底（573 主开关 + eMenu/SDI 产线，见 hotpot-base-still-show-ui） */
export const HOTPOT_BASE_STILL_SHOW_TOGGLE_SEQ: readonly number[] = [573];

/** 前厅 · 点单须知（569 主开关 + 各产线标题/内容，见 guest-order-notice-ui） */
export const GUEST_ORDER_NOTICE_TOGGLE_SEQ: readonly number[] = [569];

/** 前厅 · 用餐时长（577–580 主开关 + eMenu 产线，见 guest-dining-duration-ui） */
export const GUEST_DINING_DURATION_TOGGLE_SEQ: readonly number[] = [577, 578, 579, 580];

/** 前厅 · 订单下单时间间隔（588 主开关 + 间隔秒数 + eMenu/SDI，见 guest-order-place-interval-ui） */
export const GUEST_ORDER_PLACE_INTERVAL_TOGGLE_SEQ: readonly number[] = [588];

/** 前厅 · 菜单下单时间间隔（590 主开关 + 规则 + eMenu/SDI，见 guest-menu-order-interval-ui） */
export const GUEST_MENU_ORDER_INTERVAL_TOGGLE_SEQ: readonly number[] = [590];

/** 前厅 · 火锅锅底下单方式（574 主开关 + 单选 + eMenu/SDI，见 hotpot-base-order-mode-ui） */
export const HOTPOT_BASE_ORDER_MODE_TOGGLE_SEQ: readonly number[] = [574];

/** 前厅 · 同一锅型相同锅底过半加收（575 主开关 + 规则列表，见 hotpot-half-surcharge-ui） */
export const HOTPOT_HALF_SURCHARGE_TOGGLE_SEQ: readonly number[] = [575];

/** 前厅 · 需要权限下单的积分菜（594 主开关 + eMenu 产线，见 points-dish-auth-order-ui） */
export const POINTS_DISH_AUTH_ORDER_TOGGLE_SEQ: readonly number[] = [594];

/** 前厅 · 命中任意规则后弹出密码授权（646 主开关 + eMenu 产线，见 rule-hit-password-auth-ui） */
export const RULE_HIT_PASSWORD_AUTH_TOGGLE_SEQ: readonly number[] = [646];

/** 前厅 · 展示输入手机号（504 主开关 + Kiosk 产线，见 guest-phone-display-page-ui） */
export const GUEST_PHONE_DISPLAY_PAGE_TOGGLE_SEQ: readonly number[] = [504];

/** 前厅 · 输入姓名/姓名必填（506/507 主开关 + Kiosk 产线，见 guest-name-display-page-ui） */
export const GUEST_NAME_PAGE_TOGGLE_SEQ: readonly number[] = [506, 507];

/** 前厅 · 默认选中隐私条款（510 主开关 + 多产线，见 member-registration-fields-ui） */
export const MEMBER_PRIVACY_DEFAULT_TOGGLE_SEQ: readonly number[] = [510];

/** @deprecated 使用 MEMBER_PRIVACY_DEFAULT_TOGGLE_SEQ */
export const MEMBER_REGISTRATION_FIELD_TOGGLE_SEQ = MEMBER_PRIVACY_DEFAULT_TOGGLE_SEQ;

/** 前厅 · 手机号必填（505 主开关 + Kiosk 产线，见 guest-phone-required-ui） */
export const GUEST_PHONE_REQUIRED_TOGGLE_SEQ: readonly number[] = [505];

/** 前厅 · 送餐到桌餐牌号获取方式（503 主开关 + Kiosk 产线，见 table-delivery-meal-card-ui） */
export const TABLE_DELIVERY_MEAL_CARD_TOGGLE_SEQ: readonly number[] = [503];

/** @deprecated 使用 GUEST_KIOSK_FLOW_PAGE_TOGGLE_SEQ */
export const ORDER_TYPE_SELECTION_PAGE_TOGGLE_SEQ = GUEST_KIOSK_FLOW_PAGE_TOGGLE_SEQ;

/** 预约等位 · 叫号屏开关（3/4/5 数值、7 单选见 caller-screen-display-ui） */
export const CALLER_SCREEN_DISPLAY_TOGGLE_SEQ: readonly number[] = [2, 6];

/** 预约等位 · 等位排队规则（12 开关；529 主开关+产线见 waitlist-queue-rules-ui） */
export const WAITLIST_QUEUE_RULES_TOGGLE_SEQ: readonly number[] = [12];

/** 预约等位 · 预约提醒与自动化（341 小时输入见 reservation-automation-ui） */
export const RESERVATION_AUTOMATION_TOGGLE_SEQ: readonly number[] = [342];

/** 财务 · 现金日结与班结（171 主开关；65/330 见 daily-close-settlement-ui） */
export const DAILY_CLOSE_SETTLEMENT_TOGGLE_SEQ: readonly number[] = [171, 65, 330];

/** 财务 · 钱箱备款与平账（63/76 数值；181 开关见 cash-drawer-reconciliation-ui） */
export const CASH_DRAWER_RECONCILIATION_TOGGLE_SEQ: readonly number[] = [181];

/** 团队 · 考勤 Batch 门禁 */
export const TEAM_BATCH_ATTENDANCE_TOGGLE_SEQ: readonly number[] = [241];

/** 团队 · 登出/企台登出条件（迁员工打卡页） */
export const TEAM_CLOCK_LOGOUT_TOGGLE_SEQ: readonly number[] = [68, 69];

/** 平台业务 · 外部系统对接（79–81 链接输入见 external-integrations-ui） */
export const EXTERNAL_INTEGRATIONS_TOGGLE_SEQ: readonly number[] = [78];

/** 系统设置 · 界面与操作偏好 */
export const UI_OPERATION_PREFERENCES_TOGGLE_SEQ: readonly number[] = [168];

/** 系统设置 · 地址与地图服务 */
export const MAP_ADDRESS_SERVICES_TOGGLE_SEQ: readonly number[] = [182, 183];

/** @deprecated 使用 STORE_HOURS_OPERATION_TOGGLE_SEQ */
export const STORE_OPERATION_MODE_ALERTS_TOGGLE_SEQ = STORE_HOURS_OPERATION_TOGGLE_SEQ;

/** 前厅 · POS 找单列表（151/152/153/251 主开关 + 产线，见 pos-find-order-list-ui） */
export const POS_FIND_ORDER_LIST_TOGGLE_SEQ: readonly number[] = [151, 152, 153, 251];

/** 前厅 · 套餐点单与展示（139/145 主开关 + 产线，见 pos-combo-ordering-ui） */
export const POS_COMBO_ORDERING_TOGGLE_SEQ: readonly number[] = [139, 145];

export const MODULE_SETTING_TOGGLE_SEQ = new Set([
  ...POS_FIND_ORDER_LIST_TOGGLE_SEQ,
  ...POS_COMBO_ORDERING_TOGGLE_SEQ,
  ...POS_CHECKOUT_ENTRY_TOGGLE_SEQ,
  ...ORDER_SPLIT_MERGE_EDIT_TOGGLE_SEQ,
  ...FOH_KITCHEN_LINE_EDIT_TOGGLE_SEQ,
  ...KITCHEN_VOID_NOTIFY_TOGGLE_SEQ,
  ...PROMO_SPLIT_ORDER_RECALC_TOGGLE_SEQ,
  ...ORDER_VOID_TOGGLE_SEQ,
  ...ORDER_DISCOUNT_TOGGLE_SEQ,
  ...ORDER_SURCHARGE_TOGGLE_SEQ,
  ...KITCHEN_SEND_ROUTING_TOGGLE_SEQ,
  ...KITCHEN_TICKET_GROUPING_TOGGLE_SEQ,
  ...KITCHEN_LINE_MERGE_MATRIX_TOGGLE_SEQ,
  ...KITCHEN_TICKET_FIELDS_TOGGLE_SEQ,
  ...KITCHEN_PRINT_DISH_CODE_TOGGLE_SEQ,
  ...KITCHEN_TAKEOUT_ENHANCED_DISPLAY_TOGGLE_SEQ,
  ...KITCHEN_TICKET_FORMAT_TOGGLE_SEQ,
  ...KITCHEN_PACKING_SLIP_TOGGLE_SEQ,
  ...STORE_OPERATION_MODE_ALERTS_TOGGLE_SEQ,
  ...PAYMENT_TAX_POLICY_TOGGLE_SEQ,
  ...PAYMENT_TIP_POLICY_TOGGLE_SEQ,
  ...TIP_RECEIPT_SUGGESTION_TOGGLE_SEQS,
  ...PAYMENT_TIP_ALERT_RATIO_TOGGLE_SEQ,
  ...PAYMENT_BATCH_TOGGLE_SEQ,
  ...DELIVERY_SCAN_ONLINE_BASICS_TOGGLE_SEQ,
  ...DELIVERY_PLATFORM_SLIPS_TOGGLE_SEQ,
  ...AUTO_KITCHEN_SEND_PAYMENT_TOGGLE_SEQ,
  ...GUEST_KIOSK_FLOW_PAGE_TOGGLE_SEQ,
  ...GUEST_EMENU_AUTH_PAGE_TOGGLE_SEQ,
  ...GUEST_CATEGORY_MODE_TOGGLE_SEQ,
  ...GUEST_MENU_CLASSIFICATION_MODE_TOGGLE_SEQ,
  ...GUEST_MENU_CLASS_NAME_DISPLAY_TOGGLE_SEQ,
  ...GUEST_MENU_IMAGE_MODE_TOGGLE_SEQ,
  ...HOTPOT_BASE_REQUIRED_TOGGLE_SEQ,
  ...HOTPOT_BASE_STILL_SHOW_TOGGLE_SEQ,
  ...GUEST_ORDER_NOTICE_TOGGLE_SEQ,
  ...GUEST_DINING_DURATION_TOGGLE_SEQ,
  ...GUEST_ORDER_PLACE_INTERVAL_TOGGLE_SEQ,
  ...GUEST_MENU_ORDER_INTERVAL_TOGGLE_SEQ,
  ...HOTPOT_BASE_ORDER_MODE_TOGGLE_SEQ,
  ...HOTPOT_HALF_SURCHARGE_TOGGLE_SEQ,
  ...POINTS_DISH_AUTH_ORDER_TOGGLE_SEQ,
  ...RULE_HIT_PASSWORD_AUTH_TOGGLE_SEQ,
  ...GUEST_PHONE_DISPLAY_PAGE_TOGGLE_SEQ,
  ...GUEST_NAME_PAGE_TOGGLE_SEQ,
  ...MEMBER_PRIVACY_DEFAULT_TOGGLE_SEQ,
  ...GUEST_PHONE_REQUIRED_TOGGLE_SEQ,
  ...TABLE_DELIVERY_MEAL_CARD_TOGGLE_SEQ,
  ...CALLER_SCREEN_DISPLAY_TOGGLE_SEQ,
  ...WAITLIST_QUEUE_RULES_TOGGLE_SEQ,
  ...RESERVATION_AUTOMATION_TOGGLE_SEQ,
  ...DAILY_CLOSE_SETTLEMENT_TOGGLE_SEQ,
  ...CASH_DRAWER_RECONCILIATION_TOGGLE_SEQ,
  ...PRINT_FOUNDATION_TOGGLE_SEQS,
  ...PAYMENT_RECEIPT_FLOW_TOGGLE_SEQS,
  ...DELETE_CARD_RECEIPT_PRINT_TOGGLE_SEQS,
  ...RECEIPT_PRINT_EXECUTION_TOGGLE_SEQS,
  ...RECEIPT_LINE_CONTENT_TOGGLE_SEQS,
  ...RECEIPT_LAYOUT_FORMAT_TOGGLE_SEQS,
  ...PACKING_SLIP_PRINT_TOGGLE_SEQS,
  ...PACKING_SLIP_VOID_STYLE_TOGGLE_SEQS,
  ...TABLESIDE_SERVICE_CALL_TOGGLE_SEQS,
  ...TEAM_BATCH_ATTENDANCE_TOGGLE_SEQ,
  ...TEAM_CLOCK_LOGOUT_TOGGLE_SEQ,
  ...EXTERNAL_INTEGRATIONS_TOGGLE_SEQ,
  ...UI_OPERATION_PREFERENCES_TOGGLE_SEQ,
  ...MAP_ADDRESS_SERVICES_TOGGLE_SEQ,
  /** 535/536 排队与等待展示（Kiosk 产线多选，见 wait-time-display-ui） */
  535, 536,
  570,
  /** 597/598 每轮菜品互斥/组合：UI 在 menu-order-limits 业务页，见 foh-menu-order-limits-ui */
  597, 598,
  /** 食客端·购物车展示 616–618（产线 eMenu/SDI，见 guest-menu-cart-ui） */
  616, 617, 618,
  73, 74, 118, 176, 177, 216, 219, 220, 348, 350,
  /** 食客端·菜单结构 515–520、524、528（产线多选，见 guest-menu-structure-ui） */
  515, 516, 517, 518, 519, 520, 524, 528,
  /** 530 品牌页作为首页（合并原 531；Kiosk/eMenu/SDI 产线多选） */
  530,
  /** 532 展示 MenuSifu 品牌 LOGO（Kiosk/eMenu，见 menusifu-brand-logo-ui） */
  532,
  /** 食客端·首页与版式 509/600/611（产线多选，见 guest-menu-line-toggle-ui） */
  509, 600, 611,
  /** 645 菜品名称字体大小（Kiosk/eMenu/SDI 按产线，见 guest-menu-dish-name-font-ui） */
  645,
  604, 608, 647, 672,
  ...TABLE_SELECTION_PAGE_TOGGLE_SEQ,
  ...PARTY_SIZE_SELECTION_PAGE_TOGGLE_SEQ,
  ...PRE_ORDER_TABLE_CHANGE_TOGGLE_SEQ,
  ...SINGLE_TABLE_NO_MULTI_ORDER_TOGGLE_SEQ,
  ...POST_PAYMENT_CLEAR_TABLE_TOGGLE_SEQ,
  ...AUTO_CLEAR_TABLE_TOGGLE_SEQ,
  ...CLEAR_TABLE_BUTTON_TOGGLE_SEQ,
  ...CLEAR_TABLE_CLIENT_NOTIFICATION_TOGGLE_SEQ,
  ...ALLOW_CHANGE_SERVER_TOGGLE_SEQ,
  ...HOME_PASSWORD_AUTH_TOGGLE_SEQ,
  ...GUEST_CHANGE_PARTY_SIZE_TOGGLE_SEQ,
  ...CHILD_EXCLUDED_FROM_ORDER_LIMIT_TOGGLE_SEQ,
  ...SEND_KITCHEN_WHOLE_ORDER_TOGGLE_SEQ,
  ...SEND_KITCHEN_AFTER_CHECKOUT_TOGGLE_SEQ,
  ...POS_KITCHEN_SEND_TRIGGER_TOGGLE_SEQ,
  ...KITCHEN_SEND_PASSWORD_AUTH_TOGGLE_SEQ,
  ...ORDER_DISPLAY_SEAT_TOGGLE_SEQ,
  ...COURSE_SEQUENCE_MODE_TOGGLE_SEQ,
  ...DISH_SEQUENCE_ID_DISPLAY_TOGGLE_SEQ,
  ...POS_ORDER_CART_POS_LINES_TOGGLE_SEQ,
  ...EMENU_SERVER_READONLY_DISH_TOGGLE_SEQ,
  ...VIEWONLY_DISH_RULES_TOGGLE_SEQ,
  ...ORDER_REMARK_TOGGLE_SEQ,
  ...PRODUCT_REMARK_TOGGLE_SEQ,
  ...RECEIPT_SIGNATURE_LINE_TOGGLE_SEQ,
  ...COMBO_SUBITEM_REMARK_TOGGLE_SEQ,
  ...POS_ORDER_CART_SIMPLE_TOGGLE_SEQ,
  ...POS_BUTTON_VISIBILITY_TOGGLE_SEQ,
]);

export function isModuleSettingToggleSeq(seq: number): boolean {
  return MODULE_SETTING_TOGGLE_SEQ.has(seq);
}

export function moduleSettingToggleStorageKey(seq: number): string {
  return `bplant-module-setting-toggle:${seq}`;
}

/** 默认开启展示（640 呼叫间隔默认关，见 tableside-service-call-ui 迁移） */
export function getDefaultModuleSettingToggleOn(seq: number): boolean {
  if (seq === TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ) return false;
  if (seq === 74) return false;
  return MODULE_SETTING_TOGGLE_SEQ.has(seq);
}

export function readModuleSettingToggleOn(seq: number): boolean {
  try {
    const raw = localStorage.getItem(moduleSettingToggleStorageKey(seq));
    if (raw === null) return getDefaultModuleSettingToggleOn(seq);
    return raw === "1";
  } catch {
    return getDefaultModuleSettingToggleOn(seq);
  }
}

export function writeModuleSettingToggleOn(seq: number, on: boolean): void {
  try {
    localStorage.setItem(moduleSettingToggleStorageKey(seq), on ? "1" : "0");
  } catch {
    /* ignore quota */
  }
}
