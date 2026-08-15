import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { CRM_PROVIDER } from '@/crm'
import { useGlobalState } from '@/hooks/useGlobalState'
import {
  groupCrmIntegrationVoucherBenefitsForDisplay,
  isCrmIntegrationOrderDiscountBenefit,
} from '@/utils/crmIntegrationRewards'

export default function useCrmIntegrationCartDiscountBenefits() {
  const [memberInfo] = useGlobalState('memberInfo')
  const { providerType, validRewards, validVouchers } = useSelector(
    (state) => state.crmProviderSlice
  )

  const rewardBenefits = useMemo(() => {
    if (providerType !== CRM_PROVIDER.INTEGRATION) return []

    return validRewards.filter(isCrmIntegrationOrderDiscountBenefit)
  }, [providerType, validRewards])

  const voucherBenefits = useMemo(() => {
    if (providerType !== CRM_PROVIDER.INTEGRATION) return []
    if (!memberInfo?.userId) return []

    return validVouchers.filter(isCrmIntegrationOrderDiscountBenefit)
  }, [providerType, memberInfo?.userId, validVouchers])
  const displayVoucherBenefits = useMemo(
    () => groupCrmIntegrationVoucherBenefitsForDisplay(voucherBenefits),
    [voucherBenefits]
  )

  const allBenefits = useMemo(
    () => [...rewardBenefits, ...voucherBenefits],
    [rewardBenefits, voucherBenefits]
  )
  const hasRewardBenefits = rewardBenefits.length > 0
  const hasVoucherBenefits = displayVoucherBenefits.length > 0

  const benefitById = useMemo(() => {
    return new Map(allBenefits.map((benefit) => [benefit.id, benefit]))
  }, [allBenefits])

  return {
    providerType,
    memberInfo,
    rewardBenefits,
    voucherBenefits: displayVoucherBenefits,
    allBenefits,
    benefitById,
    hasRewardBenefits,
    hasVoucherBenefits,
    hasBenefits: hasRewardBenefits || hasVoucherBenefits,
  }
}
