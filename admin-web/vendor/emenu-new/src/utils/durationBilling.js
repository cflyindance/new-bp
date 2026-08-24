const MINUTE_MS = 60 * 1000

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function toTimestamp(value) {
  const timestamp = value instanceof Date ? value.getTime() : Number(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function isKtvDurationBillingTable(table) {
  if (!table || typeof table !== 'object') return false
  const category = String(table.category ?? '').trim().toLowerCase()
  const shape = String(table.shape ?? '').trim().toUpperCase()
  const kposShape = String(table.kposShape ?? '').trim().toUpperCase()
  return category === 'ktv' || shape === 'KTV' || kposShape === 'KTV'
}

export function calcUnitPricingFee(ruleSnapshot, startedAt, endedAt) {
  const pricing = ruleSnapshot?.pricing
  const start = toTimestamp(startedAt)
  const end = toTimestamp(endedAt)
  const amount = Number(pricing?.amount)
  const unitMinutes = Number(pricing?.unitMinutes)

  if (
    pricing?.type !== 'unit' ||
    start === null ||
    end === null ||
    end < start ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(unitMinutes) ||
    unitMinutes <= 0
  ) {
    return null
  }

  const rawUnits = (end - start) / (unitMinutes * MINUTE_MS)
  const units = pricing.roundUp === false ? rawUnits : Math.ceil(rawUnits)
  return roundMoney(units * amount)
}

export function calcIntervalPricingFee(ruleSnapshot, startedAt, endedAt) {
  const pricing = ruleSnapshot?.pricing
  const start = toTimestamp(startedAt)
  const end = toTimestamp(endedAt)
  if (pricing?.type !== 'interval' || start === null || end === null || end < start) {
    return null
  }

  const durationMs = end - start
  if (durationMs === 0) return 0
  const durationMinutes = Math.ceil(durationMs / MINUTE_MS)
  const interval = pricing.intervals?.find(
    (item) => item?.endMinutes === null || durationMinutes <= item.endMinutes
  )
  const amount = Number(interval?.amount)
  return Number.isFinite(amount) && amount > 0 ? roundMoney(amount) : null
}

export function calcDurationBillingFee(ruleSnapshot, startedAt, endedAt) {
  if (ruleSnapshot?.pricing?.type === 'unit') {
    return calcUnitPricingFee(ruleSnapshot, startedAt, endedAt)
  }
  if (ruleSnapshot?.pricing?.type === 'interval') {
    return calcIntervalPricingFee(ruleSnapshot, startedAt, endedAt)
  }
  return null
}

export function formatDurationBillingRule(ruleSnapshot) {
  const pricing = ruleSnapshot?.pricing
  if (pricing?.type === 'unit') {
    return `¥${pricing.amount}/${pricing.unitMinutes}min`
  }
  if (pricing?.type === 'interval' && Array.isArray(pricing.intervals)) {
    let start = 1
    return pricing.intervals
      .slice(0, 3)
      .map((item) => {
        const range = item.endMinutes === null ? `${start}min+` : `${start}-${item.endMinutes}min`
        if (item.endMinutes !== null) start = item.endMinutes + 1
        return `${range} ¥${item.amount}`
      })
      .join(' · ')
  }
  return ''
}

export function formatDurationBillingElapsed(startedAt, now = Date.now()) {
  const start = toTimestamp(startedAt)
  const end = toTimestamp(now)
  if (start === null || end === null || end < start) return '00:00:00'
  const totalSeconds = Math.floor((end - start) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export function parseEmenuKioskExtendedInfo(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {}
  } catch {
    return {}
  }
}

export function readDurationBillingSession(tableInfo) {
  const extendedInfo = parseEmenuKioskExtendedInfo(
    tableInfo?.currentOrder?.emenuKioskextendedInfo
  )
  return extendedInfo.durationBilling ?? null
}

export function readCurrentDurationBillingSession(tableInfo) {
  const currentOrderId = tableInfo?.currentOrder?.id
  const session = readDurationBillingSession(tableInfo)
  if (
    !currentOrderId ||
    !session?.orderId ||
    String(session.orderId) !== String(currentOrderId)
  ) return null
  return session
}

export function mergeDurationBillingSessionIntoOrder(localOrder, serverOrder) {
  if (
    !serverOrder ||
    String(localOrder?.id ?? '') !== String(serverOrder?.id ?? '')
  ) return serverOrder

  const serverExtra = parseEmenuKioskExtendedInfo(
    serverOrder.emenuKioskextendedInfo
  )
  if (serverExtra.durationBilling) return serverOrder

  const localExtra = parseEmenuKioskExtendedInfo(
    localOrder?.emenuKioskextendedInfo
  )
  if (!localExtra.durationBilling) return serverOrder

  return {
    ...serverOrder,
    emenuKioskextendedInfo: JSON.stringify({
      ...serverExtra,
      durationBilling: localExtra.durationBilling,
    }),
  }
}

export function withDurationBillingSession(tableInfo, durationBilling) {
  const currentOrder = tableInfo?.currentOrder ?? {}
  const extendedInfo = parseEmenuKioskExtendedInfo(
    currentOrder.emenuKioskextendedInfo
  )
  return {
    ...(tableInfo ?? {}),
    currentOrder: {
      ...currentOrder,
      emenuKioskextendedInfo: JSON.stringify({
        ...extendedInfo,
        durationBilling,
      }),
    },
  }
}

export function createDurationBillingSession(
  ruleSnapshot,
  orderItem,
  startedAt = Date.now()
) {
  const timestamp = toTimestamp(startedAt)
  const productBinding = ruleSnapshot?.productBinding
  if (
    !ruleSnapshot?.enabled ||
    !productBinding?.productId ||
    productBinding?.requiredTag !== 'KTV' ||
    !orderItem?.orderId ||
    !orderItem?.orderItemId ||
    timestamp === null
  ) return null
  const snapshot = JSON.parse(JSON.stringify(ruleSnapshot))
  return {
    id: orderItem.sessionId,
    status: 'timing',
    ruleSnapshot: snapshot,
    productSnapshot: JSON.parse(JSON.stringify(productBinding)),
    orderId: orderItem.orderId,
    orderItemId: orderItem.orderItemId,
    startIdempotencyKey: orderItem.idempotencyKey,
    startedAt: timestamp,
    endedAt: null,
    estimatedFee: 0,
    finalFee: null,
    authorizedBy: null,
  }
}

export function getDurationBillingFinalFee(session) {
  if (session?.status !== 'ended') return 0
  const amount = Number(session?.finalFee)
  return Number.isFinite(amount) && amount > 0 ? roundMoney(amount) : 0
}
