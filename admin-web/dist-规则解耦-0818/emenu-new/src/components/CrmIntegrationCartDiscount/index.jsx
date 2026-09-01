import React, { Suspense, useCallback } from 'react'
import { useBoolean } from 'ahooks'
import { useDispatch } from 'react-redux'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import FeedbackToast from '@/components/common/FeedbackToast'
import { CRM_PROVIDER } from '@/crm'
import { useGlobalState } from '@/hooks/useGlobalState'
import useSendCrmIntegrationDiscountOrder from '@/hooks/useSendCrmIntegrationDiscountOrder'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'
import { CartDiscountDialog, CartDiscountEntry } from './components'
import useCrmIntegrationCartDiscountBenefits from './useCrmIntegrationCartDiscountBenefits'
import useCrmIntegrationCartDiscountDialog from './useCrmIntegrationCartDiscountDialog'

const CrmIntegrationCartDiscount = ({ orders = [] }) => {
  const dispatch = useDispatch()
  const [, setLoginOpen] = useGlobalState('open')
  const { runFetchOrder } = useFetchOrder()
  const [
    openFeedback,
    { setTrue: setOpenFeedback, setFalse: setCloseFeedback },
  ] = useBoolean()
  const [submitting, { setTrue: startSubmitting, setFalse: endSubmitting }] =
    useBoolean()
  const {
    providerType,
    memberInfo,
    rewardBenefits,
    voucherBenefits,
    benefitById,
    hasRewardBenefits,
    hasVoucherBenefits,
    hasBenefits,
  } = useCrmIntegrationCartDiscountBenefits()
  const openLogin = useCallback(() => {
    setLoginOpen(true)
  }, [setLoginOpen])
  const beforeSubmit = useCallback(() => {
    setOpenFeedback()
    startSubmitting()
  }, [setOpenFeedback, startSubmitting])
  const {
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
  } = useCrmIntegrationCartDiscountDialog({
    orders,
    memberInfo,
    rewardBenefits,
    voucherBenefits,
    hasRewardBenefits,
    hasVoucherBenefits,
    benefitById,
    onLoginRequired: openLogin,
  })
  const afterSubmit = useCallback(async () => {
    setCloseFeedback()
    endSubmitting()
    try {
      await runFetchOrder()
    } finally {
      dispatch(
        crmIntegrationValidationActions.setOrderDiscountSyncSuspended(false)
      )
      closeDialog()
    }
  }, [closeDialog, dispatch, endSubmitting, runFetchOrder, setCloseFeedback])
  const { doSubmit, data, error, loading } = useSendCrmIntegrationDiscountOrder(
    {
      beforeSubmit,
      afterSubmit,
    }
  )
  const handleConfirm = useCallback(() => {
    if (loading || submitting) return
    confirmPendingBenefit(doSubmit)
  }, [confirmPendingBenefit, doSubmit, loading, submitting])

  if (providerType !== CRM_PROVIDER.INTEGRATION || !hasBenefits) return null

  return (
    <>
      <CartDiscountEntry onClick={openDialog} />
      <CartDiscountDialog
        open={open}
        activeTab={activeTab}
        activeBenefits={activeBenefits}
        hasRewardBenefits={hasRewardBenefits}
        hasVoucherBenefits={hasVoucherBenefits}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        onTabChange={setActiveTab}
        onBenefitSelect={selectPendingBenefit}
        isBenefitSelected={isBenefitSelected}
        isBenefitDisabled={isBenefitDisabled}
        confirmDisabled={confirmDisabled}
        loading={loading || submitting}
      />
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <FeedbackToast
          open={openFeedback}
          loading={submitting}
          error={error}
          data={data}
          onClose={setCloseFeedback}
        />
      </Suspense>
    </>
  )
}

export default CrmIntegrationCartDiscount
