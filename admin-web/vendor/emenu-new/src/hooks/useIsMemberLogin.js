import { useGlobalState } from '@/hooks/useGlobalState'
import { useMemo } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { checkCRMStatus, getCRMProviderType } from '@/services/crm'
import { CRM_PROVIDER } from '@/crm/providerType'
import useSystemConfig from '@/hooks/useSystemConfig'
import { showMenuMemberLoginEntry } from '@/constants/systemConfig'
import { isMenuMemberLoginEntryShown } from '@/utils/memberLoginEntryPolicy'

const useIsMemberLogin = () => {
  const [memberInfo] = useGlobalState('memberInfo')
  const [systemInfo] = useLocalStorage('emenu_system', [])
  const crmStatus = checkCRMStatus(systemInfo)
  const { getFinalConfigById } = useSystemConfig()
  const showMenuLoginEntry = isMenuMemberLoginEntryShown(
    getFinalConfigById(showMenuMemberLoginEntry.id)
  )

  const crmProvider = useMemo(() => {
    return getCRMProviderType(systemInfo)
  }, [systemInfo])

  const crmType = useMemo(() => {
    if (crmProvider === CRM_PROVIDER.LEGACY) return 1
    if (crmProvider === CRM_PROVIDER.INTEGRATION) return 3
    return 0
  }, [crmProvider])

  const isLogin = useMemo(() => {
    return Object.keys(memberInfo).length > 0
  }, [memberInfo])

  const isHideBar = useMemo(() => {
    return isLogin || !crmStatus || !showMenuLoginEntry
  }, [isLogin, crmStatus, showMenuLoginEntry])

  return {
    isLogin,
    crmStatus,
    isHideBar,
    crmType,
    crmProvider,
    showMenuLoginEntry,
  }
}

export default useIsMemberLogin
