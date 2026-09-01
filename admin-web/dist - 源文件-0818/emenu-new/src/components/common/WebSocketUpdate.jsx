import { useCallback, useEffect, useState, useContext } from 'react'
import { getStorageValue } from '@/utils/storage'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useCheckCart } from '@/hooks/useCheckCart'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import CartChangeToast from './CartChangeToast'
// import OrderUpdatedToast from './OrderUpdatedToast'
import LoadingOverlay from './LoadingOverlay'
import { useGlobalState } from '@/hooks/useGlobalState'
import usePollingCenter from '@/hooks/usePollingCenter'
import useCheckLocation from '@/hooks/useCheckLocation'
import LoadingWithText from '@/components/RightContent/LoadingWithText'
import useSystemConfig from '@/hooks/useSystemConfig'
import SystemMessageAlert from '../SystemMessageAlert'
import TimeSyncAlert from '../TimeSyncAlert'
import syncTime from '@/utils/syncTime'
import useWS from '@/hooks/useWS'
import GlobalStorageContext from '@/context/GlobalStorageContext'
import { NEW_MESSAGE_TYPE } from '@/constants/websocket'
import { useSelector } from 'react-redux'
import { useLocalStorageState } from 'bhooks'

function WebSocketUpdate() {
  const [authInfo] = useLocalStorageState('emenu_auth', {
    defaultValue: {},
    listenStorageChange: true,
  })
  const { instanceName, sessionKey } = authInfo
  const { isNewSocket, setIsNewSocket } = useContext(GlobalStorageContext)
  const { message } = useWS({ isNewSocket })
  const { runGetMenus, saleItems, getMenusLoading } = useSetMenus()
  const [wsMenuLoading, setWsMenuLoading] = useState(false)
  const { runFetchOrder, loading } = useFetchOrder()
  const { cartChangeInfo, checkChangedCart, closeCartChangeToast } =
    useCheckCart(saleItems)
  const runGetMenusWithRetry = () => {
    return runGetMenus({
      axiosConfig: {
        raxConfig: {
          retry: 3,
        },
      },
    })
  }
  const runFetchOrderWithRetry = () => {
    return runFetchOrder({
      axiosConfig: {
        raxConfig: {
          retry: 3,
        },
      },
    })
  }
  // const [
  //   orderUpdated,
  //   { setTrue: openOrderUpdated, setFalse: closeOrderUpdated },
  // ] = useBoolean()
  const {
    runPollingMenu,
    cancelPollingMenu,
    runPollingOrder,
    cancelPollingOrder,
    runPollingConfig,
    cancelPollingConfig,
    runPollingEmenuProConfig,
    cancelPollingEmenuProConfig,
  } = usePollingCenter()

  // 在order page 下进行轮询
  const { isInSettingPage } = useCheckLocation()
  const [, setIsLifeCycleResume] = useGlobalState('isLifeCycleResume')

  const [isAdminSettingOpen] = useGlobalState('isAdminSettingOpen')

  const { getFinalConfigById } = useSystemConfig()
  const isEmenuProModeOpen = getFinalConfigById(63)?.open

  useEffect(() => {
    checkChangedCart()
  }, [saleItems?.current])

  const [timeSyncAlertInfo, setTimeSyncAlertInfo] = useState({})
  const checkTimeSync = useCallback(async () => {
    if (window.WebViewJavascriptBridge && instanceName && sessionKey) {
      const result = await syncTime()
      setTimeSyncAlertInfo(result)
    }
  }, [syncTime, instanceName, sessionKey])

  const handleCancelPolling = () => {
    cancelPollingMenu()
    cancelPollingOrder()
    cancelPollingConfig()
    cancelPollingEmenuProConfig()
  }

  window.WebViewJavascriptBridge?.registerHandler?.(
    'lifeCycleChanged',
    function (data) {
      if (data?.name === 'ON_PAUSE') {
        window.webviewConfig = {
          ...window.webviewConfig,
          pauseTime: performance.now(),
          active: false,
        }
        setIsLifeCycleResume(true)
        handleCancelPolling()
      } else if (data?.name === 'ON_RESUME') {
        window.webviewConfig = {
          ...window.webviewConfig,
          resumeTime: performance.now(),
          active: true,
        }
        const t = setTimeout(() => {
          setIsLifeCycleResume(false)
          clearTimeout(t)
        }, 20000)
        if (!isInSettingPage) {
          isEmenuProModeOpen && runPollingEmenuProConfig()
          runPollingConfig()
          checkTimeSync()
          // 新ws不轮训菜单订单
          if (isNewSocket) return
          runPollingMenu()
          !isAdminSettingOpen && runPollingOrder()
        }
      }
    }
  )

  const [systemMessageList, setSystemMessageList] = useState([])
  const [systemMessageAlertVisible, setSystemMessageAlertVisible] =
    useState(false)
  const closeSystemMessageAlert = () => {
    setSystemMessageAlertVisible(false)
    setSystemMessageList([])
  }

  useEffect(() => {
    if (isInSettingPage) return
    checkTimeSync()
  }, [isInSettingPage])

  const { isWSDisconnect } = useSelector((state) => state.system)

  useEffect(() => {
    if (isInSettingPage) {
      handleCancelPolling()
      return
    }
    if (isAdminSettingOpen) {
      cancelPollingOrder()
    }
    // 新ws不轮训菜单订单
    if (isNewSocket && !isWSDisconnect) {
      cancelPollingMenu()
      cancelPollingOrder()
    } else {
      runPollingMenu()
      !isAdminSettingOpen && runPollingOrder()
    }
    isEmenuProModeOpen && runPollingEmenuProConfig()
    runPollingConfig()
  }, [
    isInSettingPage,
    isAdminSettingOpen,
    isEmenuProModeOpen,
    isNewSocket,
    isWSDisconnect,
  ])

  const updateOrder = () => {
    const t = setTimeout(async () => {
      await runFetchOrder()
      // !分单操作后订单信息接口返回并没有立即变化，延迟5秒后再获取
      clearTimeout(t)
    }, 5000)
  }

  // 菜单变化后获取新菜单并检测购物车变化
  const updateMenu = (needRetry = false) => {
    setWsMenuLoading(true)
    needRetry ? runGetMenusWithRetry() : runGetMenus()
  }

  const handleMessage = (msg) => {
    const tableInfo = getStorageValue('emenu_table', {})
    const currentOrder = tableInfo?.currentOrder
    try {
      const data = JSON.parse(msg)
      if (data.menuUpdated) {
        updateMenu(false)
      }
      if (
        data.updatedOrderIds?.includes(currentOrder?.id) ||
        data.updatedOrderIds?.includes(currentOrder?.parentOrderId)
      ) {
        // 当前订单变化后提示
        // openOrderUpdated()
        updateOrder()
      }
      if (data.messageTopic === 'CUSTOM') {
        setSystemMessageList((prev) => [data.content, ...prev])
        setSystemMessageAlertVisible(true)
      }
      if (data.type === 'socketConfigEventTopic') {
        setIsNewSocket(!!data.payload?.enableNewWebsocket)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleSocketCenterMessage = (message) => {
    const tableInfo = getStorageValue('emenu_table', {})
    const currentOrder = tableInfo?.currentOrder
    const currentArea = tableInfo?.currentArea
    const currentTable = tableInfo?.currentTable
    if (message.type === 'messageExpired') {
      updateMenu(true)
      runFetchOrderWithRetry()
      return
    }
    // 处理老事件的订单变化
    if (message.hasOwnProperty('updatedOrderIds')) {
      if (
        message.updatedOrderIds.includes(currentOrder?.id) ||
        message.updatedOrderIds.includes(currentOrder?.parentOrderId)
      ) {
        runFetchOrderWithRetry()
      }
      return
    }
    // 处理socket配置消息
    if (message.hasOwnProperty('enableNewWebsocket')) {
      setIsNewSocket(!!message.enableNewWebsocket)
      return
    }
    // 处理送厨事件
    if (message.type === 'SEND_TO_KITCHEN') {
      const orderId = message.payload
      if (
        orderId === currentOrder?.id ||
        orderId === currentOrder?.parentOrderId
      ) {
        runFetchOrderWithRetry()
      }
      return
    }
    // 处理老事件中的桌子相关事件
    if (message.messageTopic === 'TABLE_OCCUPIED_EVENT') {
      const contentObj = JSON.parse(message.content)
      const { areaId, tableId, status } = contentObj
      if (
        status === 'FREED' &&
        areaId === Number(currentArea?.id) &&
        tableId === Number(currentTable?.id)
      ) {
        runFetchOrderWithRetry()
      }
      return
    }
    // 处理自定义事件
    if (message.messageTopic === 'CUSTOM') {
      setSystemMessageList((prev) => [message.content, ...prev])
      setSystemMessageAlertVisible(true)
      return
    }
    // 处理新事件
    if (NEW_MESSAGE_TYPE.includes(message.type)) {
      if (isInSettingPage) return
      updateMenu(true)
      return
    }
  }

  useEffect(() => {
    if (!message) return
    if (isNewSocket) {
      handleSocketCenterMessage(message)
      return
    }
    handleMessage(message)
  }, [message, isNewSocket])

  return (
    <>
      <LoadingOverlay loading={loading} />
      <LoadingWithText
        loading={wsMenuLoading || getMenusLoading}
        setLoading={setWsMenuLoading}
      />
      <CartChangeToast
        open={cartChangeInfo.open}
        data={cartChangeInfo.data}
        onClose={closeCartChangeToast}
      />
      {/* <OrderUpdatedToast open={orderUpdated} onClose={closeOrderUpdated} /> */}
      <SystemMessageAlert
        open={systemMessageAlertVisible}
        onClose={closeSystemMessageAlert}
        messageList={systemMessageList}
      />
      {timeSyncAlertInfo.isTimeSync === false ? (
        <TimeSyncAlert {...timeSyncAlertInfo} />
      ) : null}
    </>
  )
}

export default WebSocketUpdate
