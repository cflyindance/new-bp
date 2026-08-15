import { useEffect, useMemo } from 'react'
import { useGlobalState } from './useGlobalState'
import dayjs from 'dayjs'
import useSystemConfig from '@/hooks/useSystemConfig'
import { cloneDeep } from 'lodash-es'
import { useLocalStorageState } from 'bhooks'

export function useCheckPermission(originalCart) {
  const { getFinalConfigById } = useSystemConfig()
  const restrictDish = getFinalConfigById(1)
  const dishQuantityLimit = getFinalConfigById(3)

  const cart = originalCart?.filter((each) => !each.isBuffetItem)

  const [orders] = useGlobalState('Orders')

  const orderId = useMemo(() => orders?.[0]?.id, [orders])
  const [savedPermission, setSavedPermission] = useLocalStorageState(
    'emenu_permission',
    {
      defaultValue: {},
      listenStorageChange: true,
    }
  )
  const [savedPermissionClearDate, setSavedPermissionClearDate] =
    useLocalStorageState('emenu_permission_clearDate', {
      defaultValue: '',
      listenStorageChange: true,
    })

  const overLimitDish = useMemo(() => {
    if (!dishQuantityLimit?.length) return []
    const orderDishes = cloneDeep([...cart, ...(orders?.[0]?.cart || [])])
    const currentOrderAllDish = orderDishes.reduce((pre, cur) => {
      const dishIdx = pre?.findIndex((each) => each.id === cur.id)
      if (dishIdx === -1) return pre.concat(cur)
      pre[dishIdx].count += cur?.count ?? 0
      return pre
    }, [])
    const currentDishLimit = currentOrderAllDish?.map((each) => {
      const limitNum = dishQuantityLimit.find((limit) =>
        limit?.dishes?.includes(each.id)
      )?.quantity
      return {
        id: each.id,
        count: each.count,
        limitNum,
      }
    })
    // 新增条件 购物车中没有命中的菜品，即使订单下单菜品已超量也忽略
    const cartIds = cart.map((each) => each.id)
    return currentDishLimit?.filter(
      (each) => each.count > each.limitNum && cartIds.includes(each.id)
    )
  }, [cart, orders])

  useEffect(() => {
    if (orderId > 0 && !savedPermission[orderId]) {
      setSavedPermission((prev) => ({
        ...prev,
        [orderId]: {
          times: 0,
          durationPermitted: false,
          timesPermitted: false,
          sendOrderTime: null,
          sendDishOrderTime: null,
        },
      }))
    }
  }, [orderId, savedPermission, setSavedPermission])

  useEffect(() => {
    const currentTime = dayjs()
    if (!(currentTime.diff(savedPermissionClearDate, 'day') <= 0)) {
      setSavedPermissionClearDate(currentTime.format('YYYY-MM-DD'))
      setSavedPermission((prev) => {
        return Object.keys(prev).reduce((acc, key) => {
          if (
            prev[key].sendOrderTime &&
            dayjs(prev[key].sendOrderTime).isAfter(
              currentTime.subtract(3, 'day')
            )
          ) {
            return {
              ...acc,
              [key]: prev[key],
            }
          } else {
            return acc
          }
        }, {})
      })
    }
  }, [
    savedPermission,
    setSavedPermission,
    savedPermissionClearDate,
    setSavedPermissionClearDate,
  ])

  // 是否有特殊菜品限制
  const needSpecialPermission = () => {
    if (!cart?.length) {
      return false
    }
    const specialDishes = restrictDish ?? []
    return cart?.every((e) => e?.combo?.id > 0)
      ? // 锅底下单
        //    可看不可 之前锅底下单的业务逻辑，代码：  cart?.some((e) => specialDishes.includes(e?.combo?.id) || specialDishes.includes(e?.id) )
        cart?.every((e) => specialDishes.includes(e?.combo?.id))
      : // 普通下单
        cart?.some((e) => specialDishes.includes(e?.id))
  }
  // 是否有特殊菜品限制
  const isHadBuffetViewOnly = () => {
    if (!cart?.length) {
      return false
    }
    return cart?.some((e) => !!e.buffetViewOnly)
  }

  const checkNeedPermission = {
    needSpecialPermission,
    isHadBuffetViewOnly,
  }

  return [
    checkNeedPermission,
    savedPermission,
    setSavedPermission,
    overLimitDish,
  ]
}
