import { useCallback, useEffect, useRef, useState } from 'react'
import { getStorageValue, setStorageValue } from '@/utils/storage'
import {
  calcDurationBillingFee,
  createDurationBillingSession,
  formatDurationBillingRule,
  isKtvDurationBillingTable,
  readCurrentDurationBillingSession,
  withDurationBillingSession,
} from '@/utils/durationBilling'
import {
  createDurationBillingOrderItem,
  updateDurationBillingOrderItemPrice,
} from '@/services/durationBillingOrders'
import { useSetMenus } from '@/hooks/useSetMenus'
import { fetchKposHourlyRateRule } from '@/services/kposHourlyRates'
import { resolveDurationBillingProductId } from '@/services/durationBillingOrderItems'

const TABLE_STORAGE_KEY = 'emenu_table'
const ESTIMATE_REFRESH_MS = 30 * 1000

function readStoredSession() {
  return readCurrentDurationBillingSession(
    getStorageValue(TABLE_STORAGE_KEY, {})
  )
}

function persistSession(session, currentOrder) {
  const tableInfo = getStorageValue(TABLE_STORAGE_KEY, {})
  const nextTableInfo = currentOrder
    ? { ...tableInfo, currentOrder }
    : tableInfo
  setStorageValue(
    TABLE_STORAGE_KEY,
    withDurationBillingSession(nextTableInfo, session)
  )
  return session
}

export default function useDurationBilling() {
  const { allMenuItem } = useSetMenus()
  const [durationBilling, setDurationBilling] = useState(readStoredSession)
  const [durationBillingRule, setDurationBillingRule] = useState(null)
  const [ruleError, setRuleError] = useState(null)
  const startInFlightRef = useRef(null)
  const finishInFlightRef = useRef(null)

  const refreshRule = useCallback(async () => {
    const table = getStorageValue(TABLE_STORAGE_KEY, {})?.currentTable
    const saleItemId = table?.defaultSaleItemId
    setDurationBillingRule(null)
    setRuleError(null)
    if (!saleItemId || !isKtvDurationBillingTable(table)) return null
    try {
      const rule = await fetchKposHourlyRateRule(saleItemId)
      const product = allMenuItem.find((item) => String(item?.id) === String(saleItemId))
      const enriched = rule ? {
        ...rule,
        name: product?.name || product?.displayName || `商品 ${saleItemId}`,
        productBinding: {
          ...rule.productBinding,
          productNameSnapshot: product?.name || product?.displayName || `商品 ${saleItemId}`,
        },
      } : null
      setDurationBillingRule(enriched)
      return enriched
    } catch (error) {
      setRuleError(error instanceof Error ? error.message : '无法读取 KPOS 按时计费规则')
      return null
    }
  }, [allMenuItem])

  const startTiming = useCallback(async ({ ruleSnapshot, tableSnapshot, previousOrder, userId }, startedAt = Date.now()) => {
    if (startInFlightRef.current) return startInFlightRef.current
    if (durationBilling?.status === 'timing') return null
    const tableId = tableSnapshot?.id
    const tableProductId = tableSnapshot?.defaultSaleItemId
    const productId = ruleSnapshot?.productBinding?.productId
    if (
      !tableId ||
      !isKtvDurationBillingTable(tableSnapshot) ||
      !productId ||
      !tableProductId ||
      String(tableProductId) !== String(productId)
    ) return null
    const sessionId = `duration-${tableId}-${startedAt}`
    const idempotencyKey = `duration-start:${tableId}:${ruleSnapshot.id}:${startedAt}`
    const productSnapshot = allMenuItem.find(
      (item) => String(item?.id) === String(productId)
    )
    if (!productSnapshot) return null
    startInFlightRef.current = (async () => {
      const result = await createDurationBillingOrderItem({
        ruleId: ruleSnapshot.id,
        productId,
        productSnapshot,
        pricingSummary: formatDurationBillingRule(ruleSnapshot),
        sessionId,
        previousOrder,
        userId,
      })
      const next = createDurationBillingSession(ruleSnapshot, {
        sessionId,
        orderId: result?.order?.id ?? result?.orderId,
        orderItemId: result?.orderItem?.id ?? result?.orderItemId,
        idempotencyKey,
      }, startedAt)
      if (!next) return null
      persistSession(next, result?.order)
      setDurationBilling(next)
      return next
    })()
    try {
      return await startInFlightRef.current
    } finally {
      startInFlightRef.current = null
    }
  }, [allMenuItem, durationBilling?.status])

  const endTiming = useCallback(
    async (authorizedBy, endedAt = Date.now()) => {
      if (finishInFlightRef.current) return finishInFlightRef.current
      if (durationBilling?.status !== 'timing') return null
      const finalFee = calcDurationBillingFee(
        durationBilling.ruleSnapshot,
        durationBilling.startedAt,
        endedAt
      )
      if (!Number.isFinite(finalFee) || finalFee < 0) return null
      const idempotencyKey = `duration-finish:${durationBilling.id}:${endedAt}`
      finishInFlightRef.current = (async () => {
        const finishResult = await updateDurationBillingOrderItemPrice({
          orderId: durationBilling.orderId,
          orderItemId: durationBilling.orderItemId,
          productId: resolveDurationBillingProductId(durationBilling),
          sessionId: durationBilling.id,
          finalAmount: finalFee,
          authorizedBy: authorizedBy ?? null,
          idempotencyKey,
        })
        if (!finishResult) return null
        const endedSession = {
          ...durationBilling,
          orderItemId:
            finishResult?.durationBillingOrderItemId ?? durationBilling.orderItemId,
          status: 'ended',
          endedAt,
          estimatedFee: finalFee,
          finalFee,
          authorizedBy: authorizedBy ?? null,
          finishIdempotencyKey: idempotencyKey,
        }
        persistSession(endedSession, finishResult?.order)
        setDurationBilling(endedSession)
        return endedSession
      })()
      try {
        return await finishInFlightRef.current
      } finally {
        finishInFlightRef.current = null
      }
    },
    [durationBilling]
  )

  const refresh = useCallback(() => {
    const stored = readStoredSession()
    setDurationBilling(stored)
    return stored
  }, [])

  useEffect(() => {
    const syncCurrentSession = () => {
      setDurationBilling(readStoredSession())
    }
    window.addEventListener('emenu_table_changed', syncCurrentSession)
    return () => {
      window.removeEventListener('emenu_table_changed', syncCurrentSession)
    }
  }, [])

  useEffect(() => {
    void refreshRule()
  }, [refreshRule])

  useEffect(() => {
    if (durationBilling?.status !== 'timing') return undefined
    const updateEstimate = () => {
      setDurationBilling((current) => {
        if (current?.status !== 'timing') return current
        const estimatedFee = calcDurationBillingFee(
          current.ruleSnapshot,
          current.startedAt,
          Date.now()
        )
        if (estimatedFee === current.estimatedFee) return current
        return persistSession({ ...current, estimatedFee })
      })
    }
    updateEstimate()
    const timer = window.setInterval(updateEstimate, ESTIMATE_REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [durationBilling?.status, durationBilling?.startedAt])

  return {
    durationBilling,
    status: durationBilling?.status ?? 'idle',
    startTiming,
    endTiming,
    refresh,
    refreshRule,
    durationBillingRule,
    ruleError,
  }
}
