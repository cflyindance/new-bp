export const MIN_MARKUP_COEFFICIENT = 0.5;
export const MAX_MARKUP_COEFFICIENT = 2;

export type BatchOptionPricingDraft = {
  inputPrice: number;
  markupCoefficient: number;
};

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function decimalHundredths(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`invalid_${field}`);
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new Error(`invalid_${field}`);
  const scaled = BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0") || "0");
  if (scaled > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`invalid_${field}`);
  return Number(scaled);
}

export function generateMarkupCoefficient(random: () => number = Math.random): number {
  const sample = Math.min(1, Math.max(0, random()));
  return roundCurrency(MIN_MARKUP_COEFFICIENT + sample * (MAX_MARKUP_COEFFICIENT - MIN_MARKUP_COEFFICIENT));
}

export function createBatchOptionPricing(random: () => number = Math.random): BatchOptionPricingDraft {
  return { inputPrice: 0, markupCoefficient: generateMarkupCoefficient(random) };
}

export function updateBatchInputPrice(draft: BatchOptionPricingDraft, inputPrice: number): BatchOptionPricingDraft {
  const normalized = Number.isFinite(inputPrice) ? Math.max(0, roundCurrency(inputPrice)) : 0;
  return { ...draft, inputPrice: normalized };
}

export function calculateActualMarkupPrice(inputPrice: number, markupCoefficient: number): number {
  const inputCents = decimalHundredths(inputPrice, "input_price");
  const coefficientHundredths = decimalHundredths(markupCoefficient, "markup_coefficient");
  if (coefficientHundredths < 50 || coefficientHundredths > 200) throw new Error("invalid_markup_coefficient");
  const product = BigInt(inputCents) * BigInt(coefficientHundredths);
  if (product > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("invalid_price_delta");
  const actualCents = (product + 50n) / 100n;
  if (actualCents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("invalid_price_delta");
  return Number(actualCents) / 100;
}
