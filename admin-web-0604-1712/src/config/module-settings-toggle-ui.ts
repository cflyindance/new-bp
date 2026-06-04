/**
 * 设置滑层中展示开关控件的 seq（原型：本地 localStorage 持久化）。
 */

import { PRINT_FOUNDATION_TOGGLE_SEQS } from "./module-settings-print-foundation-ui";
import {
  DELETE_CARD_RECEIPT_PRINT_TOGGLE_SEQS,
  PAYMENT_RECEIPT_FLOW_TOGGLE_SEQS,
} from "./module-settings-payment-receipt-flow-ui";
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
  PACKING_SLIP_VOID_STYLE_TOGGLE_SEQS,
};

/** POS 按钮显隐：193–195、197–215（不含 196 分割线，归点单页工具栏） */
export const POS_BUTTON_VISIBILITY_TOGGLE_SEQ: readonly number[] = [
  ...Array.from({ length: 3 }, (_, i) => 193 + i),
  ...Array.from({ length: 19 }, (_, i) => 197 + i),
];

/** 桌台与餐位：清桌、企台等运营策略（平面图 seq 428 见餐位平面图功能页） */
const TABLES_FLOOR_TOGGLE_SEQ: readonly number[] = [169, 347, 351, 534, 642];

/** 后厨 · 送厨触发与路由（seq 36 为订单类型多选，见 module-settings-kitchen-order-type-ui） */
export const KITCHEN_SEND_ROUTING_TOGGLE_SEQ: readonly number[] = [32, 37, 62, 304];

/** 后厨 · 厨房单·分组与拆单（52/53 见行级合并矩阵） */
export const KITCHEN_TICKET_GROUPING_TOGGLE_SEQ: readonly number[] = [54, 40, 47, 51, 61];

/** 后厨 · 行级合并矩阵（含打包单 301/302、食客收据 287/288，由矩阵内开关控制） */
export const KITCHEN_LINE_MERGE_MATRIX_TOGGLE_SEQ: readonly number[] = [52, 53, 287, 288, 301, 302];

/** 后厨 · 厨房单·票面信息 */
export const KITCHEN_TICKET_FIELDS_TOGGLE_SEQ: readonly number[] = [
  35, 42, 45, 46, 48, 49, 50, 55, 56, 57, 58,
];

/** 后厨 · 厨房单·版式格式（43+44 合并为边距输入+范围下拉，见 module-settings-kitchen-ticket-margin-ui） */
export const KITCHEN_TICKET_FORMAT_TOGGLE_SEQ: readonly number[] = [38, 41, 33, 59, 60];

/** 后厨 · 打包单（seq 39 为订单类型多选，见 module-settings-packing-slip-order-type-ui） */
export const KITCHEN_PACKING_SLIP_TOGGLE_SEQ: readonly number[] = [298, 299, 300];

/** 订单 · 分单合单与改单 */
export const ORDER_SPLIT_MERGE_EDIT_TOGGLE_SEQ: readonly number[] = [
  115, 116, 117, 119, 124, 140, 141,
];

/** 订单 · 删退与作废（seq 156 订单失效原因多选，见 module-settings-order-void-ui） */
export const ORDER_VOID_TOGGLE_SEQ: readonly number[] = [155, 157, 158, 159];

/** 前厅 · POS 结账入口（原订单中心 checkout-entry 迁入） */
export const POS_CHECKOUT_ENTRY_TOGGLE_SEQ: readonly number[] = [248, 221];

/** 订单 · 折扣（446 预设表；163 开关+输入见 order-discount-reason-ui） */
export const ORDER_DISCOUNT_TOGGLE_SEQ: readonly number[] = [162, 163, 164];

/** 订单 · 加收（447 预设表；147 四舍五入见 order-settlement / order-total-rounding-ui） */
export const ORDER_SURCHARGE_TOGGLE_SEQ: readonly number[] = [149, 161];

/** 门店 · 营业与运营（seq 170 单选、418 营业时段见各自 UI 模块） */
export const STORE_HOURS_OPERATION_TOGGLE_SEQ: readonly number[] = [77, 582];

/** 支付中心 · 税务规则（445 税率输入、143 折前/折后单选） */
export const PAYMENT_TAX_POLICY_TOGGLE_SEQ: readonly number[] = [142, 144, 160];

/** 支付中心 · 小费政策（293/294/253/244 开关；232 开关+比例面板见 tip-policy-ui） */
export const PAYMENT_TIP_POLICY_TOGGLE_SEQ: readonly number[] = [293, 294, 253, 244];

/** 支付中心 · 小费异常提醒（232 开关 + 开启后比例输入） */
export const PAYMENT_TIP_ALERT_RATIO_TOGGLE_SEQ: readonly number[] = [232];

/** 支付中心 · BATCH（239/240 开关；238/230/236/235 见 batch-settlement-ui） */
export const PAYMENT_BATCH_TOGGLE_SEQ: readonly number[] = [239, 240];

/** 外卖/来取 · 扫码·线上下单基础 */
export const DELIVERY_SCAN_ONLINE_BASICS_TOGGLE_SEQ: readonly number[] = [90, 92];

/** 前厅 · Kiosk 履约流程开关（489 为多选项，不作为单一开关） */
export const DELIVERY_PICKUP_FLOW_TOGGLE_SEQ: readonly number[] = [488, 490, 491];

/** 预约等位 · 叫号屏开关（3/4/5 数值、7 单选见 caller-screen-display-ui） */
export const CALLER_SCREEN_DISPLAY_TOGGLE_SEQ: readonly number[] = [2, 6];

/** 预约等位 · 等位排队规则（12 开关；529 主开关+产线见 waitlist-queue-rules-ui） */
export const WAITLIST_QUEUE_RULES_TOGGLE_SEQ: readonly number[] = [12];

/** 预约等位 · 预约提醒与自动化（341 小时输入见 reservation-automation-ui） */
export const RESERVATION_AUTOMATION_TOGGLE_SEQ: readonly number[] = [342];

/** 财务 · 日结与结算（171 主开关；65/330 现金班结见 daily-close-settlement-ui） */
export const DAILY_CLOSE_SETTLEMENT_TOGGLE_SEQ: readonly number[] = [171, 65, 330];

/** 财务 · 钱箱与现金平账（63/76 数值；181 开关见 cash-drawer-reconciliation-ui） */
export const CASH_DRAWER_RECONCILIATION_TOGGLE_SEQ: readonly number[] = [181];

/** 团队 · 考勤 Batch 门禁 */
export const TEAM_BATCH_ATTENDANCE_TOGGLE_SEQ: readonly number[] = [241];

/** @deprecated 使用 STORE_HOURS_OPERATION_TOGGLE_SEQ */
export const STORE_OPERATION_MODE_ALERTS_TOGGLE_SEQ = STORE_HOURS_OPERATION_TOGGLE_SEQ;

export const MODULE_SETTING_TOGGLE_SEQ = new Set([
  ...POS_CHECKOUT_ENTRY_TOGGLE_SEQ,
  ...ORDER_SPLIT_MERGE_EDIT_TOGGLE_SEQ,
  ...ORDER_VOID_TOGGLE_SEQ,
  ...ORDER_DISCOUNT_TOGGLE_SEQ,
  ...ORDER_SURCHARGE_TOGGLE_SEQ,
  ...KITCHEN_SEND_ROUTING_TOGGLE_SEQ,
  ...KITCHEN_TICKET_GROUPING_TOGGLE_SEQ,
  ...KITCHEN_LINE_MERGE_MATRIX_TOGGLE_SEQ,
  ...KITCHEN_TICKET_FIELDS_TOGGLE_SEQ,
  ...KITCHEN_TICKET_FORMAT_TOGGLE_SEQ,
  ...KITCHEN_PACKING_SLIP_TOGGLE_SEQ,
  ...STORE_OPERATION_MODE_ALERTS_TOGGLE_SEQ,
  ...PAYMENT_TAX_POLICY_TOGGLE_SEQ,
  ...PAYMENT_TIP_POLICY_TOGGLE_SEQ,
  ...PAYMENT_TIP_ALERT_RATIO_TOGGLE_SEQ,
  ...PAYMENT_BATCH_TOGGLE_SEQ,
  ...DELIVERY_SCAN_ONLINE_BASICS_TOGGLE_SEQ,
  ...DELIVERY_PICKUP_FLOW_TOGGLE_SEQ,
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
  ...TEAM_BATCH_ATTENDANCE_TOGGLE_SEQ,
  461, 462, 466, 521, 522, 523, 535, 536, 544, 545, 569, 570, 573, 577, 578, 579, 580, 597, 598,
  616, 617, 618,
  73, 74, 118, 176, 177, 216, 219, 220, 348, 350,
  515, 516, 518, 519, 520, 524, 528,
  530, 532, 600, 601, 602, 604, 606, 607, 608, 611, 612, 645, 647, 672,
  ...TABLES_FLOOR_TOGGLE_SEQ,
  ...POS_BUTTON_VISIBILITY_TOGGLE_SEQ,
]);

export function isModuleSettingToggleSeq(seq: number): boolean {
  return MODULE_SETTING_TOGGLE_SEQ.has(seq);
}

export function moduleSettingToggleStorageKey(seq: number): string {
  return `bplant-module-setting-toggle:${seq}`;
}

/** 默认开启展示 */
export function getDefaultModuleSettingToggleOn(seq: number): boolean {
  return MODULE_SETTING_TOGGLE_SEQ.has(seq);
}
