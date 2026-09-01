import { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useGlobalState } from '@/hooks/useGlobalState'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'
import {
  hasCrmIntegrationBenefitItemMarker,
  hasCrmIntegrationDiscountId,
} from '@/utils/crmIntegrationRewards'

function getBenefitRuleId(benefit) {
  const ruleId =
    benefit?.rawReward?.ruleId || benefit?.rawVoucher?.rewardRule?.ruleId || ''
  return ruleId ? String(ruleId) : ''
}

function getServerDiscountIds(orders = []) {
  if (!Array.isArray(orders)) return []

  const discountIds = orders.flatMap((order) => {
    const discountList = Array.isArray(order?.discountList)
      ? order.discountList
      : []

    return discountList
      .map((discount) => discount?.id)
      .filter(Boolean)
      .map((discountId) => String(discountId))
  })

  return Array.from(new Set(discountIds))
}

function hasPendingSelectedBenefitItem(cart = [], benefitRuleId = '') {
  if (!benefitRuleId || !Array.isArray(cart)) return false

  return cart.some(
    (item) =>
      hasCrmIntegrationDiscountId(item, benefitRuleId) ||
      hasCrmIntegrationBenefitItemMarker(item, benefitRuleId)
  )
}

export default function useCrmIntegrationOrderDiscountSync() {
  const dispatch = useDispatch()
  const lastSyncedBenefitRuleIdRef = useRef('')
  const [cart] = useGlobalState('Cart')
  const [orders] = useGlobalState('Orders')
  const { validRewards, validVouchers } = useSelector(
    (state) => state.crmProviderSlice
  )
  const selectedBenefit = useSelector(
    (state) => state.crmIntegrationValidationSlice.selectedBenefit
  )
  const isOrderDiscountSyncSuspended = useSelector(
    (state) => state.crmIntegrationValidationSlice.isOrderDiscountSyncSuspended
  )

  const serverDiscountIds = useMemo(
    () => getServerDiscountIds(orders),
    [orders]
  )
  const selectedBenefitRuleId = useMemo(
    () => getBenefitRuleId(selectedBenefit),
    [selectedBenefit]
  )
  const hasPendingSelectedBenefit = useMemo(
    () => hasPendingSelectedBenefitItem(cart, selectedBenefitRuleId),
    [cart, selectedBenefitRuleId]
  )
  const availableBenefits = useMemo(() => {
    return [
      ...(Array.isArray(validRewards) ? validRewards : []),
      ...(Array.isArray(validVouchers) ? validVouchers : []),
    ]
  }, [validRewards, validVouchers])

  useEffect(() => {
    if (isOrderDiscountSyncSuspended) return

    if (!selectedBenefitRuleId) {
      lastSyncedBenefitRuleIdRef.current = ''
    }
    const lastSyncedBenefitRuleId = lastSyncedBenefitRuleIdRef.current

    if (!serverDiscountIds.length) {
      if (hasPendingSelectedBenefit) {
        lastSyncedBenefitRuleIdRef.current = ''
        return
      }
      if (
        lastSyncedBenefitRuleId &&
        selectedBenefitRuleId === lastSyncedBenefitRuleId
      ) {
        dispatch(crmIntegrationValidationActions.clearSelectedBenefit())
        lastSyncedBenefitRuleIdRef.current = ''
      }
      return
    }

    if (
      selectedBenefitRuleId &&
      serverDiscountIds.includes(selectedBenefitRuleId)
    ) {
      lastSyncedBenefitRuleIdRef.current = selectedBenefitRuleId
      return
    }

    if (!availableBenefits.length) return

    const matchedBenefit = availableBenefits.find((benefit) =>
      serverDiscountIds.includes(getBenefitRuleId(benefit))
    )

    if (!matchedBenefit) {
      if (
        lastSyncedBenefitRuleId &&
        selectedBenefitRuleId === lastSyncedBenefitRuleId &&
        !serverDiscountIds.includes(selectedBenefitRuleId)
      ) {
        if (hasPendingSelectedBenefit) {
          lastSyncedBenefitRuleIdRef.current = ''
          return
        }
        dispatch(crmIntegrationValidationActions.clearSelectedBenefit())
        lastSyncedBenefitRuleIdRef.current = ''
      }
      return
    }

    const matchedBenefitRuleId = getBenefitRuleId(matchedBenefit)
    lastSyncedBenefitRuleIdRef.current = matchedBenefitRuleId

    if (selectedBenefitRuleId === matchedBenefitRuleId) return

    dispatch(crmIntegrationValidationActions.setSelectedBenefit(matchedBenefit))
  }, [
    availableBenefits,
    dispatch,
    hasPendingSelectedBenefit,
    isOrderDiscountSyncSuspended,
    selectedBenefitRuleId,
    serverDiscountIds,
  ])
}
