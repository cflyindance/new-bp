export const FREE_OPTION_PROBABILITY = 0.2;
export const MIN_MARKUP_COEFFICIENT = 0.5;
export const MAX_MARKUP_COEFFICIENT = 2;

export type BatchOptionPricingDraft = {
  inputPrice: number;
  markupCoefficient: number;
};

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function generateMarkupCoefficient(random: () => number = Math.random): number {
  const sample = Math.min(1, Math.max(0, random()));
  if (sample < FREE_OPTION_PROBABILITY) return 0;
  const paidSample = (sample - FREE_OPTION_PROBABILITY) / (1 - FREE_OPTION_PROBABILITY);
  return roundCurrency(MIN_MARKUP_COEFFICIENT + paidSample * (MAX_MARKUP_COEFFICIENT - MIN_MARKUP_COEFFICIENT));
}

export function createBatchOptionPricing(random: () => number = Math.random): BatchOptionPricingDraft {
  return { inputPrice: 0, markupCoefficient: generateMarkupCoefficient(random) };
}

export function updateBatchInputPrice(draft: BatchOptionPricingDraft, inputPrice: number): BatchOptionPricingDraft {
  if (draft.markupCoefficient === 0) return { ...draft, inputPrice: 0 };
  const normalized = Number.isFinite(inputPrice) ? Math.max(0, roundCurrency(inputPrice)) : 0;
  return { ...draft, inputPrice: normalized };
}

export function calculateActualMarkupPrice(inputPrice: number, markupCoefficient: number): number {
  if (markupCoefficient <= 0) return 0;
  return roundCurrency(Math.max(0, inputPrice) * markupCoefficient);
}
