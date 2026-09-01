import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Toast from '@/components/Toast'
import useCountOrderInfo from '@/hooks/useCountOrderInfo'
import useCrmIntegrationBenefitSelection from '@/hooks/useCrmIntegrationBenefitSelection'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'
import {
  CRM_INTEGRATION_REWARD_SOURCE,
  isCrmIntegrationOrderDiscountBenefit,
} from '@/utils/crmIntegrationRewards'

export function getOrderItems(orders) {
  if (!Array.isArray(orders)) return []
  return orders.flatMap((order) =>
    Array.isArray(order?.cart) ? order.cart : []
  )
}

function hasBenefitsForTab({ tab, hasRewardBenefits, hasVoucherBenefits }) {
  return tab === CRM_INTEGRATION_REWARD_SOURCE.REWARD
    ? hasRewardBenefits
    : hasVoucherBenefits
}

function getInitialTab({
  selectedDialogBenefit,
  hasRewardBenefits,
  hasVoucherBenefits,
}) {
  if (
    selectedDialogBenefit?.crmIntegrationRewardSource &&
    hasBenefitsForTab({
      tab: selectedDialogBenefit.crmIntegrationRewardSource,
      hasRewardBenefits,
      hasVoucherBenefits,
    })
  ) {
    return selectedDialogBenefit.crmIntegrationRewardSource
  }
  if (hasRewardBenefits) {
    return CRM_INTEGRATION_REWARD_SOURCE.REWARD
  }
  return CRM_INTEGRATION_REWARD_SOURCE.VOUCHER
}

function getBenefitRuleId(benefit) {
  return (
    benefit?.rawReward?.ruleId || benefit?.rawVoucher?.rewardRule?.ruleId || ''
  )
}

function getSubmittedDiscountIds(orders) {
  if (!Array.isArray(orders)) return []

  return orders.flatMap((order) => {
    const discountList = Array.isArray(order?.discountList)
      ? order.discountList
      : []

    return discountList.map((discount) => discount?.id).filter(Boolean)
  })
}

export default function useCrmIntegrationCartDiscountDialog({
  orders,
  memberInfo,
  rewardBenefits,
  voucherBenefits,
  hasRewardBenefits,
  hasVoucherBenefits,
  benefitById,
  onLoginRequired,
}) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { subtotal } = useCountOrderInfo()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(
    CRM_INTEGRATION_REWARD_SOURCE.REWARD
  )
  const [pendingBenefitId, setPendingBenefitId] = useState(null)
  const selectedBenefit = useSelector(
    (state) => state.crmIntegrationValidationSlice.selectedBenefit
  )
  const selectedBenefitId = selectedBenefit?.id
  const selectedBenefitIsCartDiscount =
    isCrmIntegrationOrderDiscountBenefit(selectedBenefit)
  const selectedBenefitBlocksCartDiscount =
    !!selectedBenefitId && !selectedBenefitIsCartDiscount
  const orderItems = useMemo(() => getOrderItems(orders), [orders])
  const submittedDiscountIds = useMemo(
    () => getSubmittedDiscountIds(orders),
    [orders]
  )
  const hasSubmittedCartDiscount = submittedDiscountIds.length > 0
  const hasSubmittedDiscountForBenefit = useCallback(
    (benefit) => {
      const benefitRuleId = getBenefitRuleId(benefit)
      return !!benefitRuleId && submittedDiscountIds.includes(benefitRuleId)
    },
    [submittedDiscountIds]
  )
  const {
    selectCrmIntegrationBenefit,
    validateCrmIntegrationBenefitBeforePending,
  } = useCrmIntegrationBenefitSelection({
    currentOrderItems: orderItems,
    orderAmount: subtotal,
  })

  const selectedDialogBenefit = useMemo(() => {
    return selectedBenefitId ? benefitById.get(selectedBenefitId) : null
  }, [benefitById, selectedBenefitId])

  const isSelectedBenefitOutsideDialog =
    !!selectedBenefitId && !selectedDialogBenefit

  const activeBenefits = useMemo(
    () =>
      activeTab === CRM_INTEGRATION_REWARD_SOURCE.REWARD
        ? rewardBenefits
        : voucherBenefits,
    [activeTab, rewardBenefits, voucherBenefits]
  )
  useEffect(() => {
    if (!hasRewardBenefits && !hasVoucherBenefits) return

    const currentTabHasBenefits = hasBenefitsForTab({
      tab: activeTab,
      hasRewardBenefits,
      hasVoucherBenefits,
    })
    if (currentTabHasBenefits) return

    const nextTab = getInitialTab({
      selectedDialogBenefit,
      hasRewardBenefits,
      hasVoucherBenefits,
    })
    if (activeTab !== nextTab) {
      setActiveTab(nextTab)
    }
  }, [activeTab, hasRewardBenefits, hasVoucherBenefits, selectedDialogBenefit])

  const openDialog = useCallback(() => {
    if (!memberInfo?.userId) {
      onLoginRequired?.()
      return
    }

    setPendingBenefitId(selectedBenefitId || null)
    setActiveTab(
      getInitialTab({
        selectedDialogBenefit,
        hasRewardBenefits,
        hasVoucherBenefits,
      })
    )
    setOpen(true)
  }, [
    hasRewardBenefits,
    hasVoucherBenefits,
    memberInfo?.userId,
    onLoginRequired,
    selectedBenefitId,
    selectedDialogBenefit,
  ])

  const closeDialog = useCallback(() => {
    setOpen(false)
  }, [])

  const selectPendingBenefit = useCallback(
    (benefit) => {
      if (hasSubmittedDiscountForBenefit(benefit)) {
        Toast.info(t('crmIntegration.cartDiscountAlreadyApplied'))
        return
      }

      if (hasSubmittedCartDiscount || selectedBenefitBlocksCartDiscount) {
        Toast.info(t('crmIntegration.onlyOneBenefitSelectable'))
        return
      }

      if (pendingBenefitId === benefit.id) {
        setPendingBenefitId(null)
        return
      }

      const canSelect = validateCrmIntegrationBenefitBeforePending(benefit, {
        currentOrderItems: orderItems,
        orderAmount: subtotal,
        pendingBenefitId,
      })
      if (!canSelect) return

      setPendingBenefitId(benefit.id)
    },
    [
      hasSubmittedCartDiscount,
      hasSubmittedDiscountForBenefit,
      orderItems,
      pendingBenefitId,
      selectedBenefitBlocksCartDiscount,
      subtotal,
      t,
      validateCrmIntegrationBenefitBeforePending,
    ]
  )

  const confirmPendingBenefit = useCallback(
    async (afterSelect) => {
      const pendingBenefit = pendingBenefitId
        ? benefitById.get(pendingBenefitId)
        : null

      if (pendingBenefit && hasSubmittedDiscountForBenefit(pendingBenefit)) {
        Toast.info(t('crmIntegration.cartDiscountAlreadyApplied'))
        return
      }

      if (hasSubmittedCartDiscount || selectedBenefitBlocksCartDiscount) {
        Toast.info(t('crmIntegration.onlyOneBenefitSelectable'))
        return
      }

      if (!pendingBenefit) {
        closeDialog()
        return
      }

      if (pendingBenefit.id === selectedBenefitId) {
        closeDialog()
        return
      }

      dispatch(
        crmIntegrationValidationActions.setOrderDiscountSyncSuspended(true)
      )

      try {
        const result = await selectCrmIntegrationBenefit(pendingBenefit, {
          currentOrderItems: orderItems,
          orderAmount: subtotal,
        })
        if (!result) {
          dispatch(
            crmIntegrationValidationActions.setOrderDiscountSyncSuspended(false)
          )
          return
        }

        await afterSelect?.()

        if (!afterSelect) {
          dispatch(
            crmIntegrationValidationActions.setOrderDiscountSyncSuspended(false)
          )
        }
      } catch (error) {
        dispatch(
          crmIntegrationValidationActions.setOrderDiscountSyncSuspended(false)
        )
        throw error
      }
    },
    [
      benefitById,
      closeDialog,
      dispatch,
      hasSubmittedCartDiscount,
      hasSubmittedDiscountForBenefit,
      orderItems,
      pendingBenefitId,
      selectCrmIntegrationBenefit,
      selectedBenefitBlocksCartDiscount,
      selectedBenefitId,
      subtotal,
      t,
    ]
  )

  const isBenefitSelected = useCallback(
    (benefit) => pendingBenefitId === benefit.id,
    [pendingBenefitId]
  )

  const isBenefitDisabled = useCallback(
    (benefit) =>
      selectedBenefitBlocksCartDiscount ||
      hasSubmittedCartDiscount ||
      hasSubmittedDiscountForBenefit(benefit) ||
      isSelectedBenefitOutsideDialog ||
      (!!pendingBenefitId && pendingBenefitId !== benefit.id),
    [
      hasSubmittedCartDiscount,
      hasSubmittedDiscountForBenefit,
      isSelectedBenefitOutsideDialog,
      pendingBenefitId,
      selectedBenefitBlocksCartDiscount,
    ]
  )

  const confirmDisabled =
    selectedBenefitBlocksCartDiscount || hasSubmittedCartDiscount

  return {
    open,
    activeTab,
    activeBenefits,
    openDialog,
    closeDialog,
    setActiveTab,
    selectPendingBenefit,
    confirmPendingBenefit,
    confirmDisabled,
    isBenefitSelected,
    isBenefitDisabled,
  }
}
