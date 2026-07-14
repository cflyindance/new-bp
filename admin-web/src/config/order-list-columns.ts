/**
 * 订单中心 · 订单列表表头字段（设计方案 v1.1+）
 * defaultVisible：列设置未配置时的默认显隐；用户勾选结果持久化到 localStorage。
 */

export type OrderListColumnKey =
  | "orderNumber"
  | "status"
  | "orderType"
  | "orderChannel"
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

/** 订单渠道枚举（列表展示值） */
export const ORDER_LIST_CHANNELS = [
  "KIOSK",
  "EMENU",
  "OO",
  "SDI",
  "POS",
  "PAYPAD",
  "POS GO",
  "三方外卖",
] as const;

export type OrderListChannel = (typeof ORDER_LIST_CHANNELS)[number];

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
  { key: "orderChannel", order: 4, titleZh: "订单渠道", titleEn: "Channel", defaultVisible: true },
  { key: "tableOrPickupNo", order: 5, titleZh: "桌号/取餐号", titleEn: "Table / Pickup #", defaultVisible: true },
  { key: "subtotal", order: 6, titleZh: "菜品小计", titleEn: "Subtotal", defaultVisible: true },
  { key: "totalDue", order: 7, titleZh: "应收总额", titleEn: "Total Due", defaultVisible: true },
  { key: "totalCollected", order: 8, titleZh: "实收总额", titleEn: "Total Collected", defaultVisible: true },
  { key: "cardTip", order: 9, titleZh: "信用卡小费", titleEn: "Card Tip", defaultVisible: true },
  { key: "cashTip", order: 10, titleZh: "现金小费", titleEn: "Cash Tip", defaultVisible: true },
  { key: "serviceCharge", order: 11, titleZh: "加收服务费", titleEn: "Service Charge", defaultVisible: true },
  { key: "tax", order: 12, titleZh: "税", titleEn: "Tax", defaultVisible: true },
  { key: "serverName", order: 13, titleZh: "开单服务员", titleEn: "Server", defaultVisible: true },
  { key: "openedAt", order: 14, titleZh: "开单时间", titleEn: "Opened At", defaultVisible: true },
  { key: "closerName", order: 15, titleZh: "结账员", titleEn: "Closer", defaultVisible: false },
  { key: "closedAt", order: 16, titleZh: "结账时间", titleEn: "Closed At", defaultVisible: false },
  { key: "paymentMethodSummary", order: 17, titleZh: "支付方式", titleEn: "Payment", defaultVisible: false },
  { key: "discount", order: 18, titleZh: "折扣金额", titleEn: "Discount", defaultVisible: false },
  { key: "guestCount", order: 19, titleZh: "人数", titleEn: "Guests", defaultVisible: false },
  { key: "storeName", order: 20, titleZh: "门店", titleEn: "Store", defaultVisible: false },
] as const;

/** 订单号列不可隐藏，保证列表可识别 */
export const ORDER_LIST_LOCKED_COLUMN_KEY: OrderListColumnKey = "orderNumber";

/** v2：含订单渠道列；旧 v1 偏好作废，回退默认 14 列 */
export const ORDER_LIST_COLUMN_VISIBILITY_STORAGE_KEY = "order-list-column-visibility-v2";

export function getDefaultVisibleColumns(): OrderListColumnDef[] {
  return ORDER_LIST_COLUMNS.filter((c) => c.defaultVisible);
}

export function getOptionalColumns(): OrderListColumnDef[] {
  return ORDER_LIST_COLUMNS.filter((c) => !c.defaultVisible);
}

export function getDefaultVisibleKeySet(): Set<OrderListColumnKey> {
  return new Set(ORDER_LIST_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
}

export function readOrderListVisibleKeys(): Set<OrderListColumnKey> {
  const defaults = getDefaultVisibleKeySet();
  try {
    const raw = localStorage.getItem(ORDER_LIST_COLUMN_VISIBILITY_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaults;
    const known = new Set(ORDER_LIST_COLUMNS.map((c) => c.key));
    const next = new Set<OrderListColumnKey>();
    for (const k of parsed) {
      if (typeof k === "string" && known.has(k as OrderListColumnKey)) {
        next.add(k as OrderListColumnKey);
      }
    }
    next.add(ORDER_LIST_LOCKED_COLUMN_KEY);
    if (next.size === 0) return defaults;
    return next;
  } catch {
    return defaults;
  }
}

export function writeOrderListVisibleKeys(keys: Iterable<OrderListColumnKey>): void {
  const known = new Set(ORDER_LIST_COLUMNS.map((c) => c.key));
  const next = new Set<OrderListColumnKey>();
  for (const k of keys) {
    if (known.has(k)) next.add(k);
  }
  next.add(ORDER_LIST_LOCKED_COLUMN_KEY);
  localStorage.setItem(ORDER_LIST_COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify([...next]));
}

export function resetOrderListVisibleKeys(): void {
  writeOrderListVisibleKeys(getDefaultVisibleKeySet());
}

/** 按 §4.1 列序返回当前应展示的列 */
export function getVisibleOrderListColumns(
  visibleKeys: Set<OrderListColumnKey> = readOrderListVisibleKeys(),
): OrderListColumnDef[] {
  return ORDER_LIST_COLUMNS.filter((c) => visibleKeys.has(c.key));
}
