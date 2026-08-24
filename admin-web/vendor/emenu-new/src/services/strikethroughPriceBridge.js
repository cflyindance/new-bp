export const STRIKETHROUGH_PRICE_STORAGE_KEY =
  'menusifu:emenu-local:strikethrough-prices:v2'

function readState(storage) {
  try {
    const raw = storage?.getItem?.(STRIKETHROUGH_PRICE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/**
 * Resolve the admin-configured product-level strikethrough price.
 * A stored null is an explicit clear and must override the KPOS menu value.
 */
export function resolveConfiguredStrikethroughPrice(
  productId,
  storage = globalThis.localStorage
) {
  const prices = readState(storage)?.prices
  if (!prices || !Object.prototype.hasOwnProperty.call(prices, String(productId))) {
    return { hasOverride: false, value: undefined }
  }
  const cents = prices[String(productId)]?.cents
  if (cents === null) return { hasOverride: true, value: null }
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    return { hasOverride: false, value: undefined }
  }
  return { hasOverride: true, value: cents / 100 }
}
