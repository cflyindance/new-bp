import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useBoolean, useRequest } from 'ahooks'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  fetchCompanyProfile,
  listAppInstances,
  listSystemConfiguration,
} from '@/services/system'
import ChooseLicense from '@/components/common/ChooseLicense'
import WebSocketUpdate from '@/components/common/WebSocketUpdate'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import useClientLogin from '@/hooks/useClientLogin'
import GlobalStorageContext from '@/context/GlobalStorageContext'
import useCheckLocation from '@/hooks/useCheckLocation'
import { getStorageValue, setStorageValue } from '@/utils/storage'
import useCountOrderDuration from '@/hooks/useCountOrderDuration'
import useCountBusinessTime from '@/hooks/useCountBusinessTime'
import MealAlert from '@/components/MealAlert'
import BusinessTimeAlert from '@/components/BusinessTimeAlert'
import GlobalNetworkModal from '@/components/GlobalNetworkModal'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useSelector } from 'react-redux'
import { clearAllStorage } from '@/utils/clearStorage'
import Toast from '@/components/Toast'
import { sendPosLog } from '@/services/setting'
import { deleteImageCache, preloadImage } from '@/components/CacheImage'
import { useLocalStorageState } from 'bhooks'
import useSystemConfig from '@/hooks/useSystemConfig'
import { EmenuViewportProvider } from '@/context/EmenuViewportContext'
import ResizableMenuViewport from '@/components/ResizableMenuViewport'
import { EMENU_DISPLAY_CONFIG_ID } from '@/utils/emenuViewportLayout'
import {
  buildEmenuViewportSessionKey,
  buildEmenuViewportTableKey,
} from '@/utils/emenuViewportPreference'

const Index = () => {
  const { enqueueSnackbar } = useSnackbar()
  const [appInstances, setAppInstances] = useState([])
  const [chooseLicenseOpen, { setTrue, setFalse }] = useBoolean()
  const [authInfo, setAuthInfo] = useLocalStorageState('emenu_auth', {
    defaultValue: {},
    listenStorageChange: true,
  })
  const [companyInfo, setCompanyInfo] = useLocalStorage('emenu_company', {})
  const [, setPosVersion] = useLocalStorage('posVersion', {})
  const [systemInfo, setSystemConfig] = useLocalStorage('emenu_system', [])
  const { instanceName, sessionKey, sessionExpireTime } = authInfo
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { run, loading } = useClientLogin(authInfo, setAuthInfo, setFalse)
  const tableInfo = getStorageValue('emenu_table', {})
  const createTime = useMemo(
    () => tableInfo?.currentOrder?.createTime,
    [tableInfo]
  )
  const {
    isShowAlert,
    closeAlert,
    leftMealTime,
    isShowLastOrderAlert,
    closeLastOrderAlert,
    lastOrderRemainingMinutes,
  } = useCountOrderDuration(createTime)
  const [isNewSocket, setIsNewSocket] = useState(null)

  const [orders, setOrders] = useGlobalState('Orders')
  const orderId = useMemo(() => orders?.[0]?.id, [orders])
  const [, setIsNeedCheckDishAuth] = useGlobalState('isNeedCheckDishAuth')
  const { deviceBindInfo } = useSelector((state) => state.systemConfigSlice)
  const currentInstanceName = authInfo?.instanceName
  const currentTableId = getStorageValue('emenu_table')?.currentTable?.id

  useEffect(() => {
    if (window.deviceUuId && deviceBindInfo?.length && currentInstanceName) {
      const currentDeviceBindInfo = deviceBindInfo.find(
        (device) => device.value?.deviceId === window.deviceUuId
      )
      if (!currentDeviceBindInfo) return
      // 当前设备使用的license 和 绑定的license 不同
      const boundLicense = currentDeviceBindInfo.value.licenseName
      if (boundLicense && boundLicense !== currentInstanceName) {
        const errMsg = t('bind.check_bind_license')
        onCheckErrorCB(errMsg, 'license')
        return
      }
      // 当前license 被其他设备绑定了
      const isOtherDeviceBindCurrLicense = deviceBindInfo.find(
        (device) =>
          device.value?.licenseName === currentInstanceName &&
          device.value?.deviceId !== window.deviceUuId
      )
      if (isOtherDeviceBindCurrLicense) {
        const errMsg = t('bind.check_license_bind')
        onCheckErrorCB(errMsg, 'license')
      }
    }
  }, [currentInstanceName, deviceBindInfo])

  const onCheckErrorCB = (errMsg, checkType) => {
    Toast.error(errMsg)
    const t = setTimeout(() => {
      if (checkType === 'table') {
        setStorageValue('emenu_table', {})
      } else {
        clearAllStorage()
      }
      setOrders([])
      navigate('/')
      window.location.reload()
      clearTimeout(t)
    }, 2500)
  }

  // 当前设备绑定了桌子，检查是否和当前桌子一致
  useEffect(() => {
    if (window.deviceUuId && deviceBindInfo?.length && currentTableId) {
      const errMsg = t('bind.check_bind_table')
      const currentDeviceBindInfo = deviceBindInfo.find(
        (device) => device.value?.deviceId === window.deviceUuId
      )
      if (!currentDeviceBindInfo) return
      const areaTableId = currentDeviceBindInfo.value.tableId
      if (!areaTableId) return
      const tableId = Number(areaTableId.split('-')[1])
      if (tableId !== currentTableId) {
        onCheckErrorCB(errMsg, 'table')
      }
    }
  }, [currentTableId, deviceBindInfo])

  // 检查当前桌子是否被其他设备绑定
  useEffect(() => {
    if (window.deviceUuId && deviceBindInfo?.length && currentTableId) {
      const errMsg = t('bind.other_bind_table')
      const currentDeviceBindInfo = deviceBindInfo.find((device) => {
        return (
          device.value?.deviceId !== window.deviceUuId &&
          device.value.tableId &&
          Number(device.value.tableId.split('-')[1]) === currentTableId
        )
      })
      if (currentDeviceBindInfo) {
        onCheckErrorCB(errMsg, 'table')
      }
    }
  }, [currentTableId, deviceBindInfo])

  useEffect(() => {
    setIsNeedCheckDishAuth(true)
  }, [orderId])

  // license list
  useRequest(listAppInstances, {
    ready: !instanceName,
    onSuccess: (result) => {
      setAppInstances(
        result.appInstances
          ?.filter((e) => e?.type === 'EMENU')
          ?.map((e) => ({
            id: e.id,
            name: e.displayName,
            inUse: e.inUse,
          }))
      )
    },
  })

  // 获取店铺信息 fetchCompanyProfile()
  useRequest(fetchCompanyProfile, {
    // ready: isEmpty(companyInfo),
    onSuccess: (result) => {
      setCompanyInfo(result.company)
      setIsNewSocket(result.company?.newWsType === true)
      setPosVersion(result.company.appInfo.version)
    },
  })

  // system config
  useRequest(listSystemConfiguration, {
    onSuccess: (result) => {
      setSystemConfig(result.systemConfiguration)
    },
  })

  // select/create license
  const enterLicense = async (name, state) => {
    if (state === 'new') {
      const sameName = appInstances?.find((each) => each.name === name)
      if (sameName) {
        enqueueSnackbar(t('ChooseLicense.already'), { variant: 'error' })
        return
      }
    }
    await run(name)
  }

  const { isInSettingPage, isInIndexPage } = useCheckLocation()

  useEffect(() => {
    if (!instanceName && !isInSettingPage) {
      setTrue()
      if (!isInIndexPage) navigate('/')
    }
  }, [instanceName, isInSettingPage])

  useEffect(() => {
    const handleLogin = async (now) => {
      // 登陆前 先断联ws
      if (window.globalWs) {
        window.globalWs?.close(4444, 'disconnect')
      }
      sendPosLog(
        `Emenu login, sessionKey: ${sessionKey}, is session expire time: ${sessionExpireTime < now + 10000}`
      )
      await run(instanceName)
    }
    if (instanceName) {
      const now = Date.now()
      if (!sessionKey || sessionExpireTime < now + 10000) {
        handleLogin(now)
      }
    }
  }, [instanceName, sessionKey, sessionExpireTime])

  const { emenuProConfig } = useSelector((state) => state.systemConfigSlice)
  const originalPageImgUrlSet = useRef(new Set())
  useEffect(() => {
    if (!isInSettingPage && emenuProConfig?.globalData) {
      const pageImgUrlSet = new Set(
        emenuProConfig.globalData.flatMap((group) =>
          group.children.flatMap((category) =>
            category.pageData.flatMap((page) =>
              page.children
                .map((component) =>
                  component.props.imgUrl
                    ? '/kpos/' + component.props.imgUrl
                    : null
                )
                .filter(Boolean)
            )
          )
        )
      )

      pageImgUrlSet.forEach((imgUrl) => preloadImage(imgUrl))

      const diffPageUrlList = []
      originalPageImgUrlSet.current.forEach((imgUrl) => {
        if (!pageImgUrlSet.has(imgUrl)) {
          diffPageUrlList.push(imgUrl)
        }
      })
      deleteImageCache(diffPageUrlList)
      originalPageImgUrlSet.current = pageImgUrlSet
    }
  }, [isInSettingPage, emenuProConfig])

  return (
    <GlobalStorageContext.Provider
      value={{
        authInfo,
        companyInfo,
        systemInfo,
        setAuthInfo,
        setCompanyInfo,
        setSystemConfig,
        isNewSocket,
        setIsNewSocket,
      }}
    >
      <ChooseLicense
        open={chooseLicenseOpen}
        licenses={appInstances}
        onClose={setFalse}
        onEnter={enterLicense}
        loading={loading}
      />
      <WebSocketUpdate />
      <CustomerViewportOutlet />
      <MealAlert
        open={isShowAlert}
        onCancel={closeAlert}
        title={t('SystemSetting.overTime')}
        subTitle={t('SystemSetting.leftTime', {
          value: !leftMealTime || leftMealTime <= 0 ? 0 : leftMealTime,
        })}
      />
      <MealAlert
        open={isShowLastOrderAlert}
        onCancel={closeLastOrderAlert}
        title={t('SystemSetting.lastOrderAlertTitle')}
        subTitle={t('SystemSetting.lastOrderAlertSubtitle', {
          value:
            !lastOrderRemainingMinutes || lastOrderRemainingMinutes <= 0
              ? 0
              : lastOrderRemainingMinutes,
        })}
      />
      {!isInSettingPage && <ComponentsOutOfSettingPage />}
      <GlobalNetworkModal />
    </GlobalStorageContext.Provider>
  )
}

const CUSTOMER_ROUTES = new Set(['/', '/setup', '/order'])

const CustomerViewportOutlet = () => {
  const { pathname } = useLocation()
  const { getFinalConfigById } = useSystemConfig()
  const [orders] = useGlobalState('Orders')
  const authInfo = getStorageValue('emenu_auth', {})
  const tableInfo = getStorageValue('emenu_table', {})
  const orderId = orders?.[0]?.id || tableInfo?.currentOrder?.id

  if (!CUSTOMER_ROUTES.has(pathname)) return <Outlet />

  const temporaryKey = `customer-flow:${authInfo?.instanceName || 'anonymous'}:${
    window.deviceUuId || 'browser'
  }`
  const formalKey = buildEmenuViewportSessionKey(tableInfo, orderId)
  const tableKey = buildEmenuViewportTableKey(tableInfo)

  return (
    <EmenuViewportProvider
      storeConfig={getFinalConfigById(EMENU_DISPLAY_CONFIG_ID)}
      sessionKey={formalKey || temporaryKey}
      fallbackSessionKey={formalKey ? tableKey || temporaryKey : temporaryKey}
    >
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          overflow: 'hidden',
          background: '#eef2f8',
        }}
      >
        <ResizableMenuViewport>
          <Outlet />
        </ResizableMenuViewport>
      </div>
    </EmenuViewportProvider>
  )
}

const ComponentsOutOfSettingPage = () => {
  const {
    isShowAlert: isShowBusinessTimeAlert,
    closeAlert: closeBusinessTimeAlert,
    groupCloseList,
    isMultiple,
    allDiffMin,
  } = useCountBusinessTime()

  return (
    <>
      <BusinessTimeAlert
        open={isShowBusinessTimeAlert}
        onCancel={closeBusinessTimeAlert}
        groupCloseList={groupCloseList}
        isMultiple={isMultiple}
        allDiffMin={allDiffMin}
      />
    </>
  )
}

export default Index
