import { useEffect, useMemo } from 'react'
import { getI18n } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Toast from '@/components/Toast'
import { useGlobalState } from '@/hooks/useGlobalState'
import {
  formatCrmIntegrationInvalidReason,
  mergeCrmIntegrationValidationResultToBenefit,
  validateCrmIntegrationSelectedBenefit,
} from '@/services/crmIntegrationBenefitValidator'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'
import { getCrmIntegrationCurrentOrderItems } from '@/utils/crmIntegrationCartValidation'
import { buildCrmIntegrationBenefitValidation } from '@/utils/crmIntegrationDiscountMapping'
import {
  isCrmIntegrationOrderDiscountBenefit,
  isCrmIntegrationSdkValidatedBenefit,
} from '@/utils/crmIntegrationRewards'

export default function useCrmIntegrationBenefitAutoValidation() {
  const dispatch = useDispatch()
  const [cart] = useGlobalState('Cart')
  const [orders] = useGlobalState('Orders')
  const [memberInfo] = useGlobalState('memberInfo')
  const selectedBenefit = useSelector(
    (state) => state.crmIntegrationValidationSlice.selectedBenefit
  )
  const metaData = useSelector((state) => state.crmProviderSlice.metaData)

  const currentOrderItemsForSdk = useMemo(() => {
    return getCrmIntegrationCurrentOrderItems(cart, orders)
  }, [cart, orders])

  const shouldValidate = useMemo(
    () => isCrmIntegrationSdkValidatedBenefit(selectedBenefit),
    [selectedBenefit]
  )

  useEffect(() => {
    if (!selectedBenefit) return
    if (!metaData) return
    if (!shouldValidate) return

    const validate = async () => {
      try {
        const result = await validateCrmIntegrationSelectedBenefit({
          selectedBenefit,
          metaData,
          allItems: currentOrderItemsForSdk,
          memberInfo,
          includeSelectedDiscount:
            isCrmIntegrationOrderDiscountBenefit(selectedBenefit),
        })

        if (!result.isSupported) return

        if (result.isValid) {
          const validatedBenefit = mergeCrmIntegrationValidationResultToBenefit(
            selectedBenefit,
            result
          )
          if (
            selectedBenefit.isValid !== result.isValid ||
            selectedBenefit.actualDiscount !== result.actualDiscount
          ) {
            dispatch(
              crmIntegrationValidationActions.setValidatedSelectedBenefit(
                validatedBenefit
              )
            )
          }
          dispatch(
            crmIntegrationValidationActions.setSelectedBenefitValidation(
              buildCrmIntegrationBenefitValidation(result)
            )
          )
          return
        }

        dispatch(
          crmIntegrationValidationActions.clearSelectedBenefitById(
            selectedBenefit.id
          )
        )

        const reason = formatCrmIntegrationInvalidReason(
          result.invalidReason,
          getI18n().language
        )
        if (reason) Toast.info(reason)
      } catch (error) {
        console.warn(error?.message || error)
      }
    }

    validate()
  }, [
    currentOrderItemsForSdk,
    dispatch,
    memberInfo,
    metaData,
    selectedBenefit,
    shouldValidate,
  ])
}
