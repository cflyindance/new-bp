import { lazy, useCallback, useEffect, Suspense, useMemo, useRef } from 'react'
import { useMount, useUnmount } from 'ahooks'
import { Routes, Route } from 'react-router-dom'
import useFocusScroll from './hooks/useFocusScroll'
import { useDispatch } from 'react-redux'
import { getStorageValue, setStorageValue } from '@/utils/storage'
import { effects } from '@/store/slices/systemConfig.slice'
import useCheckLocation from '@/hooks/useCheckLocation'
import { useTranslation, getI18n } from 'react-i18next'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import ToasterProvider from '@/components/Toast/ToasterProvider'
import {
  getAllMenu,
  getPointRule,
  searchPrivileges,
  searchRewardRule,
} from '@/services/crm'
import useIsMemberLogin from '@/hooks/useIsMemberLogin'
import { useGlobalState } from '@/hooks/useGlobalState'
import useSystemConfig from '@/hooks/useSystemConfig'
import { getCrmProvider, CRM_PROVIDER } from '@/crm'
import { actions as crmProviderActions } from '@/store/slices/crmProvider.slice'
import useCrmIntegrationBenefitsSync from '@/hooks/useCrmIntegrationBenefitsSync'
import useCrmIntegrationOrderDiscountSync from '@/hooks/useCrmIntegrationOrderDiscountSync'
import useCrmIntegrationOrderContextReset from '@/hooks/useCrmIntegrationOrderContextReset'
import '@/components/BatteryWifi'

const Index = lazy(() => import('@/pages/Index'))
const Landing = lazy(() => import('@/pages/Landing'))
const Order = lazy(() => import('@/pages/Order'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const SystemSetting = lazy(() => import('@/pages/SystemSetting'))
const GlobalSetting = lazy(() => import('@/pages/GlobalSetting'))
const DeviceSetting = lazy(() => import('@/pages/DeviceSetting'))
const CategorySetting = lazy(() => import('@/pages/CategorySetting'))
const SetupOrder = lazy(() => import('@/pages/SetupOrder'))
const MenuClassify = lazy(() => import('@/pages/MenuClassify'))

function App() {
  const [focusIn, focusOut] = useFocusScroll()
  const { isInSettingPage } = useCheckLocation()
  const dispatch = useDispatch()
  const { i18n } = useTranslation()
  const table = getStorageValue('emenu_table', {})?.currentTable
  const area = getStorageValue('emenu_table', {})?.currentArea
  const tableName = useMemo(() => {
    return `${area?.name}-${table?.name}`
  }, [area, table])
  const tableId = useMemo(() => {
    return `${area?.id}-${table?.id}`
  }, [area, table])
  const { crmStatus, crmType, crmProvider } = useIsMemberLogin()
  useCrmIntegrationBenefitsSync()
  useCrmIntegrationOrderContextReset()
  useCrmIntegrationOrderDiscountSync()
  const stopMetaRefreshRef = useRef(null)
  const stopMarketSDKRef = useRef(null)
  const [, setPrivilege] = useGlobalState('privilege')
  const [, setPrivilegeItem] = useGlobalState('privilegeItem')
  const [, setIsOpenPrivilege] = useGlobalState('isOpenPrivilege')
  const [, setEarningRule] = useGlobalState('earningRule')
  const [, setCrmRewardRules] = useGlobalState('crmRewardRules')
  const { getFinalConfigById } = useSystemConfig()
  const posterInfo = getFinalConfigById(56)

  const stopIntegrationCrm = useCallback(async () => {
    const stopMetaRefresh = stopMetaRefreshRef.current
    stopMetaRefreshRef.current = null
    try {
      await stopMetaRefresh?.()
    } catch (error) {
      console.warn(error?.message || error)
    }

    const stopMarketSDK = stopMarketSDKRef.current
    stopMarketSDKRef.current = null
    try {
      await stopMarketSDK?.()
    } catch (error) {
      console.warn(error?.message || error)
    }
  }, [])

  useEffect(() => {
    if (posterInfo?.open) {
      if (posterInfo.displayButton && posterInfo.text) {
        const i18n = getI18n()
        Object.keys(posterInfo.text)
          .filter((each) => posterInfo.text[each])
          .forEach((each) => {
            i18n.addResources(each, 'Poster', {
              button: posterInfo.text[each],
            })
          })
      }
    }
  }, [posterInfo])

  useEffect(() => {
    if (crmStatus && crmType) {
      if (crmType === 1) {
        // 活动规则
        getRewardRule()
        // 积分规则
        handleGetPointRule()
        // 会员权益相关
        initPrivileges()
        initPrivilegeItem()
      }
      if (crmProvider === CRM_PROVIDER.INTEGRATION) {
        initIntegrationCrm()
      }
    }

    return () => {
      void stopIntegrationCrm()
    }
  }, [crmStatus, crmType, crmProvider, stopIntegrationCrm])

  const initIntegrationCrm = async () => {
    const provider = getCrmProvider(crmProvider)
    if (!provider) return

    await stopIntegrationCrm()
    dispatch(crmProviderActions.setProviderType(crmProvider))
    dispatch(crmProviderActions.setIntegrationLoading())

    try {
      const companyInfo = getStorageValue('emenu_company')
      provider.setMerchantId?.(companyInfo?.merchantId)
      const data = await provider.fetchBootstrapData({
        onMeta: (metaData) => {
          dispatch(crmProviderActions.setIntegrationMeta(metaData))
        },
        onError: (error) => {
          console.warn(error?.message || error)
        },
      })

      stopMetaRefreshRef.current = data.stopMetaRefresh
      stopMarketSDKRef.current = data.stopMarketSDK
      dispatch(
        crmProviderActions.setIntegrationBootstrapData({
          rewards: data.rewards,
          metaData: data.metaData,
        })
      )
    } catch (e) {
      dispatch(crmProviderActions.setIntegrationError(e?.message || String(e)))
    }
  }

  const handleGetPointRule = async () => {
    const res = await getPointRule()
    if (res?.length > 0) {
      const pointRule = res?.[0]
      if (!pointRule) return
      const earningRule = {
        earningStrategy: pointRule.rule.strategy === 'byAmountSpent' ? 1 : 2,
        parameters: pointRule.rule.parameters,
        minimunPurchase: pointRule.minimunPurchase,
        includeTax: pointRule.spentAmountIncludeTax.enabled,
        expiration: pointRule.expiration,
        rounding: 1,
      }
      if (pointRule?.roundingPoints?.enabled) {
        const allRoundType = ['Round off', 'Round up', 'Round down']
        const roundType = pointRule.roundingPoints.roundingType
        const typeIdx = allRoundType.findIndex((each) => each === roundType)
        earningRule.rounding = typeIdx + 1
      }
      setEarningRule(earningRule)
    }
  }
  const getRewardRule = async () => {
    try {
      const res = await searchRewardRule()
      if (res?.length > 0) {
        setCrmRewardRules(res)
      }
    } catch (e) {
      console.warn(e?.message)
    }
  }
  const initPrivileges = async () => {
    try {
      const res = await searchPrivileges()
      if (res?.[0]) {
        setPrivilege(res?.[0] || {})
        setIsOpenPrivilege(true)
      }
    } catch (e) {
      console.warn(e?.message)
    }
  }
  const initPrivilegeItem = async () => {
    try {
      const res = await getAllMenu()
      if (res) {
        const privilegeItem = res.data?.menus?.[0]?.menuGroups.find(
          (cate) => cate.name === 'Member Privilege'
        )?.menuCategories?.[0]?.saleItems?.[0]
        setPrivilegeItem(privilegeItem || {})
      }
    } catch (e) {
      console.warn(e?.message)
    }
  }

  useMount(async () => {
    const lang = getStorageValue('emenu_lang')
    i18n.changeLanguage(lang)

    // for dev
    if (process.env.NODE_ENV === 'development')
      await dispatch(effects.initConfig({ tableName, tableId }))
    await init()
  })

  const languageSetting = getFinalConfigById(71)

  useEffect(() => {
    if (!isInSettingPage && languageSetting) {
      const lang = getStorageValue('emenu_lang')
      if (lang && languageSetting?.languages?.includes(lang)) {
        i18n.changeLanguage(lang)
      } else {
        i18n.changeLanguage(languageSetting?.defaultLanguage)
      }
    }
  }, [isInSettingPage, languageSetting])

  useEffect(() => {
    setStorageValue('emenu_lang', i18n.language)
  }, [i18n.language])

  useUnmount(() => {
    window.removeEventListener('message', fetchSetting)
  })

  const init = async () => {
    if (isInSettingPage) {
      window.parent.postMessage({ type: 'getSessionKey' }, '*')
      window.addEventListener('message', fetchSetting)
      return
    }
    // const info = await getDeviceInfo()
    await dispatch(effects.initConfig({ tableName, tableId }))
    await dispatch(effects.initConfig({ tableName, tableId }))
  }

  // 在pos 后台设置页下只查询配置
  const fetchSetting = async (event) => {
    if (event.data.type === 'sessionKey') {
      const newSessionKey = event.data.data
      setStorageValue('emenu_auth', {
        sessionKey: newSessionKey,
      })
      const res = await dispatch(effects.fetchConfig({ isSettingInit: true }))
      if (res === '{}') {
        await dispatch(effects.initConfig({}))
      }
      window.removeEventListener('message', fetchSetting)
    }
  }

  useEffect(() => {
    document.body.addEventListener('focus', focusIn)
    document.body.addEventListener('blur', focusOut)
    return () => {
      document.body.removeEventListener('focus', focusIn)
      document.body.removeEventListener('blur', focusOut)
    }
  }, [focusIn, focusOut])

  return (
    <Suspense fallback={<LoadingOverlay loading={true} />}>
      <ToasterProvider />
      <Routes>
        <Route path="/" element={<Index />}>
          <Route index element={<Landing />} />
          <Route path="setup" element={<SetupOrder />} />
          <Route path="order" element={<Order />} />
          <Route path="setting" element={<SystemSetting />} />
          <Route path="setting/global" element={<GlobalSetting />} />
          <Route path="setting/device" element={<DeviceSetting />} />
          <Route path="setting/category" element={<CategorySetting />} />
          <Route path="setting/menuClassify" element={<MenuClassify />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
