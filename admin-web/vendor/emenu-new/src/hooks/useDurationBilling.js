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
  const startInFlightRef = useRef(null)
  const finishInFlightRef = useRef(null)

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
        await updateDurationBillingOrderItemPrice({
          orderId: durationBilling.orderId,
          orderItemId: durationBilling.orderItemId,
          sessionId: durationBilling.id,
          finalAmount: finalFee,
          authorizedBy: authorizedBy ?? null,
          idempotencyKey,
        })
        const endedSession = {
          ...durationBilling,
          status: 'ended',
          endedAt,
          estimatedFee: finalFee,
          finalFee,
          authorizedBy: authorizedBy ?? null,
          finishIdempotencyKey: idempotencyKey,
        }
        persistSession(endedSession)
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
  }
}
