import { useCallback, useMemo } from 'react'
import { useRequest } from 'ahooks'
import useSystemConfig from '@/hooks/useSystemConfig'
import { sendKitchen } from '@/services/orders'
import { cloneDeep } from 'lodash-es'

export function useSendKitchen() {
  const { getFinalConfigById } = useSystemConfig()

  const delaySendDish = getFinalConfigById(2)
  const delaySendDishType = getFinalConfigById(17)

  const sendKitchenMethod = useMemo(() => {
    return delaySendDishType?.sendKitchenMethod
  }, [delaySendDishType])

  const sendToKitchen = useCallback(
    (orders) => {
      // 是否有延迟送厨
      const items = []
      const order = orders?.[0]

      order?.cart?.forEach((item) => {
        // 订单中此菜已送厨或已有延迟时间的，不设置延迟送厨
        if (item.status === 'SENT_TO_KITCHEN' || item.delay) return
        let delayItem = {}
        // 自动送厨 -> 全局菜品设置
        if (sendKitchenMethod === 'auto') {
          delayItem = {
            id: item.key,
            delay: 0,
          }
        }
        // 个别菜延迟送厨 优先级更高
        const find = (
          cloneDeep(delaySendDish)?.sort((a, b) => b.time - a.time) ?? []
        ).find((e) => e?.dishes?.includes(item?.id))
        //* 配置中包含此菜
        if (find) {
          delayItem = {
            id: item.key, // 菜品id（订单生成的）
            delay: (find.time || 0) * 60 * 1000, // 延迟时间，分钟转毫秒
          }
        }
        items.push(delayItem)
      })
      return items.length > 0
        ? sendKitchen(
            {
              orderId: order?.id,
              items,
            },
            sendKitchenMethod
          )
        : null
    },
    [delaySendDish, sendKitchenMethod]
  )

  const { runAsync: runSendKitchen } = useRequest(sendToKitchen, {
    manual: true,
  })

  return { runSendKitchen }
}
