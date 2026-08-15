import useSystemConfig from '@/hooks/useSystemConfig'
import { useCallback, useMemo } from 'react'
import { saveMessage, sendCdsMsg } from '@/services/system'
import { useRequest } from 'ahooks'
import { useGlobalState } from '@/hooks/useGlobalState'

const useSendMessage = (props) => {
  const { onBeforeSend, onAfterSend } = props
  const { getFinalConfigById } = useSystemConfig()
  // 结账
  const checkoutNotification = getFinalConfigById(29)?.open
  const addWaterNotification = getFinalConfigById(41)?.open
  const sendTablewareNotification = getFinalConfigById(42)?.open
  const sendTissueNotification = getFinalConfigById(43)?.open
  // 新订单
  const newOrderNotification = getFinalConfigById(38)?.open
  // 编辑订单
  const editOrderNotification = getFinalConfigById(39)?.open
  // 加汤
  const addSoupBrothNotification = getFinalConfigById(68)?.open
  // 换烤盘
  const changeGrillTopNotification = getFinalConfigById(69)?.open
  // 点酒水
  const orderDrinksNotification = getFinalConfigById(70)?.open
  // 叫号屏消息通知
  const cdsMessageEnabled = getFinalConfigById(92)?.open

  const [orders] = useGlobalState('Orders')
  const orderId = useMemo(() => orders?.[0]?.id, [orders])

  const notificationMap = useMemo(() => {
    return {
      // 呼叫服务员服务
      callServer: true,
      mealDurationReminder: true,
      checkout: checkoutNotification,
      newOrder: newOrderNotification,
      editOrder: editOrderNotification,
      addWater: addWaterNotification,
      tableware: sendTablewareNotification,
      napkin: sendTissueNotification,
      addSoupBroth: addSoupBrothNotification,
      changeGrillTop: changeGrillTopNotification,
      orderDrinks: orderDrinksNotification,
    }
  }, [
    checkoutNotification,
    newOrderNotification,
    editOrderNotification,
    addWaterNotification,
    sendTablewareNotification,
    sendTissueNotification,
    addSoupBrothNotification,
    changeGrillTopNotification,
    orderDrinksNotification,
  ])

  // 发送消息给POS
  const sendMessage = useCallback(
    ({ type, title, content, iconType, tableId }) => {
      if (!notificationMap[type])
        return Promise.reject('current notification is closed')
      saveMessage({
        title,
        content,
        order: { id: orderId },
        iconType, //  'WAITER'
        sender: 'EMENU',
        topicName: 'EMENU',
        tableId,
      })
    },
    [notificationMap, orderId]
  )

  const onCallServerSuccess = (mutate) => {
    mutate({
      status: 'warn',
      message: 'Your server will be here in a minute.',
    })

    if (cdsMessageEnabled && orderId) {
      sendCdsMsg(orderId)
    }
  }

  const { loading, data, mutate, error, run, params } = useRequest(
    sendMessage,
    {
      manual: true,
      onBefore: () => {
        onBeforeSend?.()
      },
      onSuccess: () => {
        const type = params?.[0]?.type
        if (
          [
            'checkout',
            'callServer',
            'addWater',
            'tableware',
            'napkin',
            'addSoupBroth',
            'changeGrillTop',
            'orderDrinks',
          ].includes(type)
        ) {
          onCallServerSuccess(mutate)
        }
      },
      onError: (e) => {
        console.log(e)
      },
      onFinally: () => {
        const t = setTimeout(() => {
          onAfterSend?.()
          clearTimeout(t)
        }, 3000)
      },
    }
  )

  return {
    loading,
    data,
    error,
    run,
  }
}

export default useSendMessage
