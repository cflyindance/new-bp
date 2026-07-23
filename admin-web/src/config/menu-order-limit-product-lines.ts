/**
 * 菜单下单限制 · 其他设置：各规则适用产线（多选）。
 */

export const MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "paypad", label: "PayPad" },
  { id: "pos-go", label: "POS GO" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type MenuOrderLimitOtherProductLineId =
  (typeof MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES)[number]["id"];

export const MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS: MenuOrderLimitOtherProductLineId[] =
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES.map((l) => l.id);

export function normalizeMenuOrderLimitOtherProductLineIds(
  raw: unknown,
): MenuOrderLimitOtherProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS);
  return MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS.filter((id) =>
    raw.some((item) => typeof item === "string" && item === id && valid.has(id)),
  );
}
