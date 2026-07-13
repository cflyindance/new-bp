/**
 * 订单中心 · 订单列表表头字段（设计方案 v1.1）
 * 首期无列设置时仅渲染 defaultVisible === true 的列。
 */

export type OrderListColumnKey =
  | "orderNumber"
  | "status"
  | "orderType"
  | "tableOrPickupNo"
  | "subtotal"
  | "totalDue"
  | "totalCollected"
  | "cardTip"
  | "cashTip"
  | "serviceCharge"
  | "tax"
  | "serverName"
  | "openedAt"
  | "closerName"
  | "closedAt"
  | "paymentMethodSummary"
  | "discount"
  | "guestCount"
  | "storeName";

export type OrderListColumnDef = {
  key: OrderListColumnKey;
  /** 建议列序，从 1 开始 */
  order: number;
  titleZh: string;
  titleEn: string;
  defaultVisible: boolean;
};

export const ORDER_LIST_COLUMNS: readonly OrderListColumnDef[] = [
  { key: "orderNumber", order: 1, titleZh: "订单号", titleEn: "Order #", defaultVisible: true },
  { key: "status", order: 2, titleZh: "订单状态", titleEn: "Status", defaultVisible: true },
  { key: "orderType", order: 3, titleZh: "订单类型", titleEn: "Order Type", defaultVisible: true },
  { key: "tableOrPickupNo", order: 4, titleZh: "桌号/取餐号", titleEn: "Table / Pickup #", defaultVisible: true },
  { key: "subtotal", order: 5, titleZh: "菜品小计", titleEn: "Subtotal", defaultVisible: true },
  { key: "totalDue", order: 6, titleZh: "应收总额", titleEn: "Total Due", defaultVisible: true },
  { key: "totalCollected", order: 7, titleZh: "实收总额", titleEn: "Total Collected", defaultVisible: true },
  { key: "cardTip", order: 8, titleZh: "信用卡小费", titleEn: "Card Tip", defaultVisible: true },
  { key: "cashTip", order: 9, titleZh: "现金小费", titleEn: "Cash Tip", defaultVisible: true },
  { key: "serviceCharge", order: 10, titleZh: "加收服务费", titleEn: "Service Charge", defaultVisible: true },
  { key: "tax", order: 11, titleZh: "税", titleEn: "Tax", defaultVisible: true },
  { key: "serverName", order: 12, titleZh: "开单服务员", titleEn: "Server", defaultVisible: true },
  { key: "openedAt", order: 13, titleZh: "开单时间", titleEn: "Opened At", defaultVisible: true },
  { key: "closerName", order: 14, titleZh: "结账员", titleEn: "Closer", defaultVisible: false },
  { key: "closedAt", order: 15, titleZh: "结账时间", titleEn: "Closed At", defaultVisible: false },
  { key: "paymentMethodSummary", order: 16, titleZh: "支付方式", titleEn: "Payment", defaultVisible: false },
  { key: "discount", order: 17, titleZh: "折扣金额", titleEn: "Discount", defaultVisible: false },
  { key: "guestCount", order: 18, titleZh: "人数", titleEn: "Guests", defaultVisible: false },
  { key: "storeName", order: 19, titleZh: "门店", titleEn: "Store", defaultVisible: false },
] as const;

export function getDefaultVisibleColumns(): OrderListColumnDef[] {
  return ORDER_LIST_COLUMNS.filter((c) => c.defaultVisible);
}

export function getOptionalColumns(): OrderListColumnDef[] {
  return ORDER_LIST_COLUMNS.filter((c) => !c.defaultVisible);
}
