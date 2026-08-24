import { normalizeEmenuDisplayConfig } from './emenuViewportLayout.js'

export const EMENU_VIEWPORT_PREFERENCE_KEY = 'emenu_viewport_preference'

export function buildEmenuViewportTableKey(tableInfo = {}) {
  const areaId = tableInfo?.currentArea?.id
  const tableId = tableInfo?.currentTable?.id
  if (areaId && tableId) return `table:${areaId}:${tableId}`
  return ''
}

export function buildEmenuViewportSessionKey(tableInfo = {}, orderId) {
  const resolvedOrderId = orderId || tableInfo?.currentOrder?.id
  if (resolvedOrderId) return `order:${resolvedOrderId}`
  return buildEmenuViewportTableKey(tableInfo)
}

export function readEmenuViewportPreference(sessionKey) {
  if (!sessionKey) return null
  try {
    const parsed = JSON.parse(
      localStorage.getItem(EMENU_VIEWPORT_PREFERENCE_KEY) || 'null'
    )
    if (!parsed || parsed.sessionKey !== sessionKey) return null
    return normalizeEmenuDisplayConfig(parsed.value)
  } catch (_) {
    return null
  }
}

export function writeEmenuViewportPreference(sessionKey, value) {
  if (!sessionKey) return
  localStorage.setItem(
    EMENU_VIEWPORT_PREFERENCE_KEY,
    JSON.stringify({
      sessionKey,
      value: normalizeEmenuDisplayConfig(value),
      updatedAt: Date.now(),
    })
  )
}

export function clearEmenuViewportPreference() {
  localStorage.removeItem(EMENU_VIEWPORT_PREFERENCE_KEY)
}
