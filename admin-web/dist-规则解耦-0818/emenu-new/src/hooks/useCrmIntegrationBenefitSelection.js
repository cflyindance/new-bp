import { getI18n, useTranslation } from 'react-i18next'
import { useMemoizedFn } from 'ahooks'
import { useDispatch, useSelector } from 'react-redux'
import Toast from '@/components/Toast'
import { useGlobalState } from '@/hooks/useGlobalState'
import useCountOrderInfo from '@/hooks/useCountOrderInfo'
import {
  formatCrmIntegrationInvalidReason,
  mergeCrmIntegrationValidationResultToBenefit,
  validateCrmIntegrationSelectedBenefit,
} from '@/services/crmIntegrationBenefitValidator'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'
import {
  hasCrmIntegrationBenefitEligibleOrderItem,
  hasCrmIntegrationPointItemEligibleSpec,
} from '@/utils/crmIntegrationCartValidation'
import { buildCrmIntegrationBenefitValidation } from '@/utils/crmIntegrationDiscountMapping'
import {
  buildCrmIntegrationManualGiftItemDiscount,
  isCrmIntegrationFreeItemBenefit,
  hasCrmIntegrationBenefitItemMarker,
  hasCrmIntegrationDiscountId,
  isCrmIntegrationOrderDiscountBenefit,
  isCrmIntegrationSdkValidatedBenefit,
} from '@/utils/crmIntegrationRewards'
import {
  CRM_INTEGRATION_BENEFIT_ORDER_FAILURE,
  CRM_INTEGRATION_BENEFIT_SELECTION_ACTION,
  CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE,
  getCrmIntegrationPointItemPrecheckToast,
  resolveCrmIntegrationBenefitOrderFailure,
  resolveCrmIntegrationBenefitSelection,
  resolveCrmIntegrationPointItemPrecheckFailure,
} from '@/utils/crmIntegrationBenefitSelection'

function attachManualGiftItemDiscount(items, benefit) {
  const manualSelectRewardDiscount =
    buildCrmIntegrationManualGiftItemDiscount(benefit)
  return items.map((item) => ({
    ...item,
    manualSelectRewardDiscount,
  }))
}

export default function useCrmIntegrationBenefitSelection(options = {}) {
  const { currentOrderItems = [], orderAmount } = options
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [memberInfo] = useGlobalState('memberInfo')
  const [, setLoginOpen] = useGlobalState('open')
  const { cartOrderPrice } = useCountOrderInfo()
  const metaData = useSelector((state) => state.crmProviderSlice.metaData)
  const selectedBenefit = useSelector(
    (state) => state.crmIntegrationValidationSlice.selectedBenefit
  )

  const validateBenefitSelection = useMemoizedFn(
    (benefit, selectOptions = {}) => {
      const selectionAction = resolveCrmIntegrationBenefitSelection(
        selectedBenefit,
        benefit,
        selectOptions
      )

      if (selectionAction === CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.BLOCK) {
        Toast.info(t('crmIntegration.onlyOneBenefitSelectable'))
        return null
      }

      if (!memberInfo?.userId) {
        Toast.info(t('crm.loginFirst'))
        setLoginOpen(true)
        return null
      }

      return selectionAction
    }
  )

  const getBenefitOrderFailure = useMemoizedFn(
    (benefit, selectOptions = {}) => {
      const actualCurrentOrderItems =
        selectOptions.currentOrderItems || currentOrderItems
      const actualOrderAmount = Number(
        selectOptions.orderAmount ?? orderAmount ?? cartOrderPrice ?? 0
      )
      const requiresEligibleOrderItem =
        isCrmIntegrationOrderDiscountBenefit(benefit) &&
        benefit?.eligibleItemScope !== 'all'
      const requiresOrderItem =
        isCrmIntegrationOrderDiscountBenefit(benefit) &&
        benefit?.crmIntegrationVoucher !== true

      return resolveCrmIntegrationBenefitOrderFailure({
        requiredPoints: Number(benefit?.points || 0),
        currentPoints: Number(memberInfo?.pointBalance || 0),
        minSpend: Number(benefit?.minSpend || 0),
        orderAmount: actualOrderAmount,
        requiresOrderItem,
        hasOrderItem: actualCurrentOrderItems.length > 0,
        requiresEligibleOrderItem,
        hasEligibleOrderItem:
          !requiresEligibleOrderItem ||
          hasCrmIntegrationBenefitEligibleOrderItem(
            benefit,
            actualCurrentOrderItems
          ),
      })
    }
  )

  const validateBenefitOrderConditions = useMemoizedFn(
    (benefit, selectOptions = {}) => {
      const failure = getBenefitOrderFailure(benefit, selectOptions)
      if (!failure) return true

      if (failure === CRM_INTEGRATION_BENEFIT_ORDER_FAILURE.NO_ORDER_ITEM) {
        Toast.info(t('crmIntegration.selectDishFirst'))
      } else if (failure === CRM_INTEGRATION_BENEFIT_ORDER_FAILURE.POINTS) {
        Toast.info(t('crm.noEnoughPoint'))
      } else if (failure === CRM_INTEGRATION_BENEFIT_ORDER_FAILURE.MIN_SPEND) {
        const minSpend = Number(benefit?.minSpend || 0)
        Toast.info(
          t('crmIntegration.minSpendNotReached', {
            value: `$${minSpend.toFixed(2)}`,
          })
        )
      } else {
        Toast.info(t('crmIntegration.noEligibleOrderItems'))
      }
      return false
    }
  )

  const validateCrmIntegrationPointItemBeforeAdd = useMemoizedFn(
    (benefit, selectOptions = {}) => {
      const crmIntegrationPointItemGlobalLocked =
        selectOptions.crmIntegrationPointItemGlobalLocked === true
      const failure = resolveCrmIntegrationPointItemPrecheckFailure({
        crmIntegrationPointItemGlobalLocked,
        isLoggedIn: !!memberInfo?.userId,
        selectionAction: crmIntegrationPointItemGlobalLocked
          ? null
          : resolveCrmIntegrationBenefitSelection(selectedBenefit, benefit),
        hasSubmittedBenefit: crmIntegrationPointItemGlobalLocked
          ? false
          : !!selectOptions.hasSubmittedBenefit,
        isSubmittedBenefit: crmIntegrationPointItemGlobalLocked
          ? false
          : !!selectOptions.isSubmittedBenefit,
        limitReached: crmIntegrationPointItemGlobalLocked
          ? false
          : !!selectOptions.limitReached,
        orderFailure: crmIntegrationPointItemGlobalLocked
          ? null
          : getBenefitOrderFailure(benefit, selectOptions),
        hasEligibleSpec:
          crmIntegrationPointItemGlobalLocked ||
          hasCrmIntegrationPointItemEligibleSpec(benefit, selectOptions.item),
      })

      if (!failure) return true

      const toast = getCrmIntegrationPointItemPrecheckToast(failure, {
        maxSelectable: selectOptions.maxSelectable,
        minSpend: benefit?.minSpend,
      })
      if (toast) {
        Toast.info(t(toast.key, toast.values))
      }
      if (failure === CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.LOGIN) {
        setLoginOpen(true)
      }
      return false
    }
  )

  const validateCrmIntegrationBenefitBeforePending = useMemoizedFn(
    (benefit, selectOptions = {}) => {
      const selectionAction = validateBenefitSelection(benefit, selectOptions)
      if (!selectionAction) return false

      const pendingBenefitId = selectOptions.pendingBenefitId
      if (pendingBenefitId && pendingBenefitId !== benefit.id) {
        Toast.info(t('crmIntegration.onlyOneBenefitSelectable'))
        return false
      }

      return validateBenefitOrderConditions(benefit, selectOptions)
    }
  )

  const validateCrmIntegrationBenefitSdkBeforeStage = useMemoizedFn(
    async (benefit, selectOptions = {}) => {
      if (!isCrmIntegrationSdkValidatedBenefit(benefit)) return true
      const allowMissingDiscountsAtStage =
        selectOptions.allowMissingDiscountsAtStage === true
      if (!metaData) {
        Toast.info(
          t('crmIntegration.validationFailed', {
            defaultValue: 'Unable to validate this offer',
          })
        )
        return false
      }

      let actualCurrentOrderItems =
        selectOptions.currentOrderItems || currentOrderItems
      if (selectOptions.replaceGiftItemDiscountId) {
        actualCurrentOrderItems = actualCurrentOrderItems.filter(
          (item) =>
            !hasCrmIntegrationDiscountId(
              item,
              selectOptions.replaceGiftItemDiscountId
            ) &&
            !hasCrmIntegrationBenefitItemMarker(
              item,
              selectOptions.replaceGiftItemDiscountId
            )
        )
      }

      try {
        const selectedGiftItemCandidates = Array.isArray(
          selectOptions.selectedGiftItemCandidates
        )
          ? selectOptions.selectedGiftItemCandidates
          : []
        const shouldIncludeSelectedItemCandidates =
          !isCrmIntegrationOrderDiscountBenefit(benefit) &&
          selectedGiftItemCandidates.length > 0
        const selectedItemsForValidation =
          shouldIncludeSelectedItemCandidates &&
          isCrmIntegrationFreeItemBenefit(benefit)
            ? attachManualGiftItemDiscount(selectedGiftItemCandidates, benefit)
            : selectedGiftItemCandidates
        const allItemsForValidation = shouldIncludeSelectedItemCandidates
          ? [...actualCurrentOrderItems, ...selectedItemsForValidation]
          : actualCurrentOrderItems
        const validationResult = await validateCrmIntegrationSelectedBenefit({
          selectedBenefit: benefit,
          metaData,
          allItems: allItemsForValidation,
          memberInfo,
          includeSelectedDiscount: false,
        })

        const hasCalculatedDiscounts =
          Array.isArray(validationResult.orderDiscountInfo) &&
          validationResult.orderDiscountInfo.length > 0
        const hasValidSdkRule =
          validationResult.rule?.isValid === true ||
          validationResult.isValid === true
        const stageAccepted =
          hasValidSdkRule &&
          (allowMissingDiscountsAtStage || hasCalculatedDiscounts)

        if (stageAccepted) return true

        const reason = formatCrmIntegrationInvalidReason(
          validationResult.invalidReason,
          getI18n().language
        )
        Toast.info(
          reason ||
            t('crmIntegration.validationFailed', {
              defaultValue: 'Unable to validate this offer',
            })
        )
        return false
      } catch (error) {
        console.warn(error?.message || error)
        Toast.info(
          t('crmIntegration.validationFailed', {
            defaultValue: 'Unable to validate this offer',
          })
        )
        return false
      }
    }
  )

  const applyBenefitSelection = useMemoizedFn(
    async (benefit, selectionAction, selectOptions = {}) => {
      let actualCurrentOrderItems =
        selectOptions.currentOrderItems || currentOrderItems
      if (selectOptions.replaceGiftItemDiscountId) {
        actualCurrentOrderItems = actualCurrentOrderItems.filter(
          (item) =>
            !hasCrmIntegrationDiscountId(
              item,
              selectOptions.replaceGiftItemDiscountId
            ) &&
            !hasCrmIntegrationBenefitItemMarker(
              item,
              selectOptions.replaceGiftItemDiscountId
            )
        )
      }

      if (isCrmIntegrationSdkValidatedBenefit(benefit)) {
        if (!metaData) {
          Toast.info(
            t('crmIntegration.validationFailed', {
              defaultValue: 'Unable to validate this offer',
            })
          )
          return false
        }

        try {
          const selectedGiftItemCandidates = Array.isArray(
            selectOptions.selectedGiftItemCandidates
          )
            ? selectOptions.selectedGiftItemCandidates
            : []
          const shouldIncludeSelectedItemCandidates =
            !isCrmIntegrationOrderDiscountBenefit(benefit) &&
            selectedGiftItemCandidates.length > 0
          const selectedItemsForValidation =
            shouldIncludeSelectedItemCandidates &&
            isCrmIntegrationFreeItemBenefit(benefit)
              ? attachManualGiftItemDiscount(
                  selectedGiftItemCandidates,
                  benefit
                )
              : selectedGiftItemCandidates
          const allItemsForValidation = shouldIncludeSelectedItemCandidates
            ? [...actualCurrentOrderItems, ...selectedItemsForValidation]
            : actualCurrentOrderItems

          const validationResult = await validateCrmIntegrationSelectedBenefit({
            selectedBenefit: benefit,
            metaData,
            allItems: allItemsForValidation,
            memberInfo,
            includeSelectedDiscount: false,
          })

          if (!validationResult.isValid) {
            const reason = formatCrmIntegrationInvalidReason(
              validationResult.invalidReason,
              getI18n().language
            )
            Toast.info(
              reason ||
                t('crmIntegration.validationFailed', {
                  defaultValue: 'Unable to validate this offer',
                })
            )
            return false
          }

          if (typeof selectOptions.beforeApplySelectedBenefit === 'function') {
            await selectOptions.beforeApplySelectedBenefit()
          }

          const validatedBenefit = mergeCrmIntegrationValidationResultToBenefit(
            benefit,
            validationResult
          )
          dispatch(
            crmIntegrationValidationActions.setValidatedSelectedBenefit(
              validatedBenefit
            )
          )
          dispatch(
            crmIntegrationValidationActions.setSelectedBenefitValidation(
              buildCrmIntegrationBenefitValidation(validationResult)
            )
          )
          return selectionAction
        } catch (error) {
          console.warn(error?.message || error)
          Toast.info(
            t('crmIntegration.validationFailed', {
              defaultValue: 'Unable to validate this offer',
            })
          )
          return false
        }
      }

      dispatch(crmIntegrationValidationActions.setSelectedBenefit(benefit))
      return selectionAction
    }
  )

  const selectBenefit = useMemoizedFn(async (benefit, selectOptions = {}) => {
    let selectionAction = validateBenefitSelection(benefit, selectOptions)
    if (!selectionAction) return false

    if (
      selectionAction === CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.CLEAR &&
      selectOptions.forceSelectSelectedBenefit
    ) {
      selectionAction = CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.SELECT
    }

    if (selectionAction === CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.SELECT) {
      if (!validateBenefitOrderConditions(benefit, selectOptions)) return false
      return applyBenefitSelection(benefit, selectionAction, selectOptions)
    }

    if (selectionAction === CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.CLEAR) {
      dispatch(crmIntegrationValidationActions.clearSelectedBenefit())
      return selectionAction
    }

    return false
  })

  const finalizePrevalidatedCrmIntegrationPointItem = useMemoizedFn(
    async (benefit, selectOptions = {}) => {
      const candidates = selectOptions.selectedGiftItemCandidates
      if (!benefit?.id || !Array.isArray(candidates) || !candidates.length) {
        return false
      }

      return applyBenefitSelection(
        benefit,
        CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.SELECT,
        selectOptions
      )
    }
  )

  return {
    selectCrmIntegrationBenefit: selectBenefit,
    validateCrmIntegrationBenefitSelection: validateBenefitSelection,
    validateCrmIntegrationBenefitBeforePending,
    validateCrmIntegrationBenefitSdkBeforeStage,
    validateCrmIntegrationPointItemBeforeAdd,
    finalizePrevalidatedCrmIntegrationPointItem,
  }
}
