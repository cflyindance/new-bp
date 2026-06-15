/** 支付中心 · 食客自助结账 UX 产线（CDS / Kiosk / PayPad） */
export const CHECKOUT_UX_LINES = [
  { id: "cds", label: "客显（CDS）" },
  { id: "kiosk", label: "Kiosk" },
  { id: "paypad", label: "PayPad" },
] as const;

export type CheckoutUxLineId = (typeof CHECKOUT_UX_LINES)[number]["id"];

/** 结账小票 / 刷卡签购单矩阵产线（含 POS 店员端） */
export const CHECKOUT_RECEIPT_LINES = [
  { id: "pos", label: "POS" },
  { id: "cds", label: "客显（CDS）" },
  { id: "kiosk", label: "Kiosk" },
  { id: "paypad", label: "PayPad" },
] as const;

export type CheckoutReceiptLineId = (typeof CHECKOUT_RECEIPT_LINES)[number]["id"];

export function defaultCheckoutReceiptToggleByLine(defaultOn = false): Record<CheckoutReceiptLineId, boolean> {
  return { pos: defaultOn, cds: defaultOn, kiosk: defaultOn, paypad: defaultOn };
}

export type CheckoutUxToggleByLine = Record<CheckoutUxLineId, boolean>;

export function defaultCheckoutUxToggleByLine(defaultOn = false): CheckoutUxToggleByLine {
  return { cds: defaultOn, kiosk: defaultOn, paypad: defaultOn };
}

export function normalizeCheckoutUxToggleByLine(
  raw: Partial<CheckoutUxToggleByLine>,
  defaultOn = false,
): CheckoutUxToggleByLine {
  const base = defaultCheckoutUxToggleByLine(defaultOn);
  for (const line of CHECKOUT_UX_LINES) {
    if (typeof raw[line.id] === "boolean") base[line.id] = raw[line.id]!;
  }
  return base;
}
