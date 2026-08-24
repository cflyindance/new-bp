export const STRIKETHROUGH_PRICE_MAX_CENTS = 999_999_999;

export type StrikethroughPriceChange = {
  productId: string;
  expectedVersion: number;
  originalPriceCents: number | null;
  targetPriceCents: number | null;
  kind: "create" | "update" | "clear";
};

export function parsePriceToCents(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= STRIKETHROUGH_PRICE_MAX_CENTS ? cents : Number.NaN;
}

export function formatPrice(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

export function validateStrikethroughPrice(value: string, salePriceCents: number): string {
  const cents = parsePriceToCents(value);
  if (cents === null) return "";
  if (Number.isNaN(cents)) return "请输入 0.01 至 9,999,999.99，最多两位小数";
  if (cents <= salePriceCents) return "划线价必须高于当前售价";
  return "";
}

export function classifyChange(
  productId: string,
  expectedVersion: number,
  originalPriceCents: number | null,
  targetPriceCents: number | null,
): StrikethroughPriceChange | null {
  if (originalPriceCents === targetPriceCents) return null;
  return {
    productId,
    expectedVersion,
    originalPriceCents,
    targetPriceCents,
    kind: targetPriceCents === null ? "clear" : originalPriceCents === null ? "create" : "update",
  };
}

export function discountLabel(salePriceCents: number, strikePriceCents: number | null): string {
  if (!strikePriceCents || strikePriceCents <= salePriceCents) return "—";
  return `${((salePriceCents / strikePriceCents) * 10).toFixed(1)} 折`;
}
