import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CRM_PROVIDER } from '@/crm'
import { actions as crmProviderActions } from '@/store/slices/crmProvider.slice'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useSetMenus } from '@/hooks/useSetMenus'
import {
  resolveCrmIntegrationMenuRewards,
  resolveCrmIntegrationMenuVouchers,
} from '@/utils/crmIntegrationRewards'
import { getStorageValue } from '@/utils/storage'

export default function useCrmIntegrationBenefitsSync() {
  const dispatch = useDispatch()
  const { allMenuItem } = useSetMenus()
  const [memberInfo] = useGlobalState('memberInfo')
  const { providerType, rewards } = useSelector(
    (state) => state.crmProviderSlice
  )
  const merchantId = getStorageValue('emenu_company')?.merchantId

  const visibleSaleItems = useMemo(() => {
    return (allMenuItem || []).map((item) => ({
      ...item,
      hidden: false,
    }))
  }, [allMenuItem])

  const validRewards = useMemo(() => {
    if (providerType !== CRM_PROVIDER.INTEGRATION) return []

    return resolveCrmIntegrationMenuRewards(rewards, {
      saleItems: visibleSaleItems,
      merchantId,
    })
  }, [providerType, rewards, visibleSaleItems, merchantId])

  const validVouchers = useMemo(() => {
    if (providerType !== CRM_PROVIDER.INTEGRATION) return []
    if (!memberInfo?.userId) return []

    return resolveCrmIntegrationMenuVouchers(
      memberInfo.crmIntegrationVouchers,
      {
        saleItems: visibleSaleItems,
        merchantId,
      }
    )
  }, [providerType, memberInfo, visibleSaleItems, merchantId])

  useEffect(() => {
    dispatch(
      crmProviderActions.setIntegrationValidBenefits({
        validRewards,
        validVouchers,
      })
    )
  }, [dispatch, validRewards, validVouchers])
}
