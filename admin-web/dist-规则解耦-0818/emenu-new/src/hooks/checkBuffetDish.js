// 检查 品类模式下 订单中是否包含品类， 用于解决品类模式下提前开单时，以选择酒水提前开单导致没有菜品可选的问题
// 检查 菜单分类模式 是否下单菜单
import { fetchOrder } from '@/services/orders'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useGlobalState } from './useGlobalState'
import { useEffect, useMemo, useRef } from 'react'

const useCheckBuffetDish = () => {
  const { menuSource } = useSetMenus()
  const menuSourceRef = useRef([])

  useEffect(() => {
    menuSourceRef.current = menuSource
  }, [menuSource])

  const [menuInit] = useGlobalState('menuInit')
  const menuInitResolveRef = useRef(null)
  const menuInitPromise = useMemo(() => {
    return new Promise((resolve) => {
      menuInitResolveRef.current = resolve
    })
  }, [])

  useEffect(() => {
    if (menuInit) {
      menuInitResolveRef?.current()
    }
  }, [menuInit])

  const checkBuffetDish = async (orderId) => {
    const [res] = await Promise.all([
      fetchOrder({ params: { orderId } }),
      menuInitPromise,
    ])
    if (res?.order) {
      const { orderItems } = res.order.subOrders[0]
      // 已下单商品id
      const itemIds = orderItems
        .filter((each) => each.quantity > 0)
        .map((item) => item.saleItemId)
      // 全部品类id
      const menuSource = menuSourceRef.current
      const buffetDishes = menuSource
        .filter((group) => group.name === 'ALL_YOU_CAN_EAT')?.[0]
        ?.list?.map((category) => category.list)
        ?.flat()
        ?.map((dish) => dish.id)
      return itemIds.find((saleItemId) => buffetDishes?.includes(saleItemId))
    }
    return false
  }

  const checkMenuClassify = async (orderId) => {
    const res = await fetchOrder({ params: { orderId } })
    if (res?.order) {
      const { emenuKioskextendedInfo } = res.order
      let eMenuExtraData = null
      if (emenuKioskextendedInfo) {
        eMenuExtraData = JSON.parse(emenuKioskextendedInfo)
      }
      return !!eMenuExtraData?.menuClassify
    }
    return false
  }

  return {
    checkBuffetDish,
    checkMenuClassify,
  }
}

export default useCheckBuffetDish
