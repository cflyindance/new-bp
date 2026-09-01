import { useBoolean, useRequest } from 'ahooks'
import { listTaxes } from '@/services/system'
import { useCallback, useMemo, useState } from 'react'
import {
  generateOrder,
  saveOrder,
  transformOrder,
  getChargeList,
  dealTimeAlert,
} from '@/services/orders'
import { useGlobalState } from '@/hooks/useGlobalState'
import { roundToPrecision } from '@/utils/number'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useNavigate } from 'react-router-dom'
import { useSendKitchen } from '@/hooks/useSendKitchen'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import { getStorageValue, setStorageValue } from '@/utils/storage'
import useCheckMemberStatus from '@/hooks/useCheckMemberStatus'
import useGetUserId from '@/hooks/useGetUserId'
import useSystemConfig from './useSystemConfig'
import Toast from '@/components/Toast'
import { usePrintReceipt } from './usePrintReceipt'
import { isEqual } from 'lodash-es'

const useSendBuffetOrder = (allBrandSetting, specialMenuList, successCb) => {
  const navigate = useNavigate()
  const { runSendKitchen } = useSendKitchen()
  const { runPrintReceipt } = usePrintReceipt()
  const { allMenuItem } = useSetMenus()
  const { runFetchOrder } = useFetchOrder()
  const { getUserId } = useGetUserId()
  const [orders, setOrders] = useGlobalState('Orders')
  const [earningRule] = useGlobalState('earningRule')
  const [modifierActionList] = useGlobalState('modifierActionList')
  const [, setTableInfo] = useLocalStorage('emenu_table', {})
  const tableInfo = getStorageValue('emenu_table') || {}
  const [cart, setCart] = useState([])
  const [tempSelectSpecialMenu, setTempSelectSpecialMenu] = useState(null)
  const [submitting, { setTrue: startSubmitting, setFalse: endSubmitting }] =
    useBoolean()
  const { currentTable } = tableInfo
  const orderId = useMemo(() => tableInfo?.currentOrder?.id, [tableInfo])

  const [memberInfo] = useGlobalState('memberInfo')
  const { isHasBenefit } = useCheckMemberStatus(memberInfo)
  const [privilegeItem] = useGlobalState('privilegeItem')
  const { getFinalConfigById } = useSystemConfig()
  const isOpenDuration = getFinalConfigById(5)?.open
  const durationTime = getFinalConfigById(5)?.duration
  const isOpenAlert = getFinalConfigById(14)?.open
  const alertTime = getFinalConfigById(14)?.restTimeAlert
  const brandMeuSetting = getFinalConfigById(13)?.brandMeuSetting
  const isSubmitBuffetFirst = getFinalConfigById(89)?.open

  const [, setNotCountAsGuestNumber] = useGlobalState('notCountAsGuestNumber')
  const [, setCurrentBuffetInfo] = useGlobalState('currentBuffetInfo', [])
  const [, setCurrentSpecialMenu] = useGlobalState('currentSpecialMenu')
  const [globalCart, setGlobalCart] = useGlobalState('Cart')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])

  const totalPrice = useMemo(
    () =>
      roundToPrecision(
        cart?.reduce(
          (acc, cur) => acc + (cur.realPrice ?? cur.price) * cur.count,
          0
        )
      ),
    [cart]
  )

  const totalBenefitPrice = useMemo(
    () =>
      roundToPrecision(
        cart?.reduce((acc, cur) => {
          return (
            acc + (cur.benefitPrice ?? cur.realPrice ?? cur.price) * cur.count
          )
        }, 0)
      ),
    [cart]
  )

  // 获取税信息
  const { runAsync: runListTaxes } = useRequest(listTaxes, {
    manual: true,
    onSuccess: async (res, params) => {
      const buffetNumOfGuests = params?.[0]
      const notCountAsGuestNumber = params?.[1]
      const buffetItemIdList = params?.[2]
      const taxes = res.taxes ?? []
      const timeAlert = dealTimeAlert(
        { isOpenAlert, alertTime },
        { isOpenDuration, durationTime }
      )

      // 提交订单
      await runAsync({
        cart,
        totalPrice,
        taxes,
        isHasBenefit, // 是否有权益 - 有 -> 会员价下单
        totalBenefitPrice,
        crmMemberId: orders?.[0]?.crmMemberId || memberInfo?.userId,
        earningRule,
        ...timeAlert,
        buffetNumOfGuests,
        notCountAsGuestNumber,
        buffetItemIdList,
      })
    },
  })

  // 提交订单
  const submitOrder = useCallback(
    async (data) => {
      const res = await getChargeList()
      const order = generateOrder({
        order: {
          ...data,
          chargeInfo: res.charge,
          currentSpecialMenu: tempSelectSpecialMenu,
          notCountAsGuestNumber: data.notCountAsGuestNumber ?? undefined,
        },
        prevOrder: orders?.[0],
        isBuffetOrder: true,
        brandSettings: allBrandSetting,
        userId: getUserId(),
        buffetNumOfGuests: data.buffetNumOfGuests,
      })
      return saveOrder({ order })
    },
    [orders, tempSelectSpecialMenu]
  )

  const { data, mutate, runAsync } = useRequest(submitOrder, {
    manual: true,
    onSuccess: async (result) => {
      setTableInfo(() => ({
        ...tableInfo,
        currentOrder: result.order,
      }))
      const orders = [
        transformOrder({
          order: result.order,
          menuList: allMenuItem,
          modifierActionList: modifierActionList,
          memberCard: privilegeItem,
        }),
      ].filter(Boolean)
      setOrders(orders)
      // setCart([])
      // setStoragedCart([])
      mutate({ status: 'ok', data })
      // 发送消息给POS
      // runSaveMessage(newOrderId === orderId ? 'Additional Order' : 'New Order')
      const asyncFn = async () => {
        // 延迟送厨
        await runSendKitchen(orders)
        // 打印小票
        await runPrintReceipt(orders)
      }
      asyncFn()
    },
    onError: (error) => {
      Toast.error(error.message)
    },
    onFinally: async (params, result, error) => {
      if (!error && data?.status === 'ok') {
        if (orderId) {
          await runFetchOrder()
        }
        const t = setTimeout(() => {
          successCb?.()
          endSubmitting()
          navigate('/order')
          clearTimeout(t)
        }, 1000)
        return
      }
      endSubmitting() // 兼容提交订单失败后 允许再次下单
    },
  })

  const doSubmit = async ({
    buffetSalesItem,
    selectedSpecialMenu,
    buffetNumOfGuests,
    notCountAsGuestNumber,
  }) => {
    const userInfo = getStorageValue('emenu_user')
    if (!currentTable || !userInfo) {
      navigate('/')
      return false
    }

    startSubmitting()

    if (!isSubmitBuffetFirst && !orderId) {
      setNotCountAsGuestNumber(notCountAsGuestNumber)
      setStorageValue('emenu_partySize', buffetNumOfGuests)
      const newBuffetInfo = buffetSalesItem.map((each) => {
        if (!each) return each
        const { viewOnlyDishes, dishType, viewOnlyIds } = each
        const viewOnlyDishIds =
          dishType === 1
            ? viewOnlyIds || []
            : brandMeuSetting
                .filter((each) => viewOnlyDishes.includes(each.itemName))
                .reduce((pre, cur) => {
                  return pre.concat(cur.orderDishes)
                }, [])

        return {
          ...each,
          viewOnlyDishIds,
          isBuffetItem: true,
        }
      })
      setCurrentBuffetInfo((prev) =>
        isEqual(prev, newBuffetInfo) ? prev : newBuffetInfo
      )
      setCurrentSpecialMenu((prev) =>
        isEqual(prev, selectedSpecialMenu) ? prev : selectedSpecialMenu
      )
      const newCart = [
        ...newBuffetInfo,
        ...globalCart.filter((each) => !each.isBuffetItem),
      ]
      setGlobalCart(newCart)
      setStoragedCart(newCart)
      const t = setTimeout(() => {
        successCb?.()
        endSubmitting()
        navigate('/order')
        clearTimeout(t)
      }, 500)
      return false
    }

    await runFetchOrder()
    setCart(buffetSalesItem)
    setTempSelectSpecialMenu(selectedSpecialMenu)

    let buffetItemIdList = null
    if (buffetSalesItem?.length > 0) {
      buffetItemIdList = []
      buffetSalesItem.forEach((each) => {
        const {
          orderDishes = [],
          dishType,
          viewOnlyDishes = [],
          viewOnlyIds = [],
        } = each
        const viewOnlyDishIds =
          dishType === 1
            ? viewOnlyIds
            : allBrandSetting
                .filter((each) => viewOnlyDishes.includes(each.itemName))
                .reduce((pre, cur) => {
                  return pre.concat(cur.orderDishes)
                }, [])
        buffetItemIdList.push(...orderDishes, ...(viewOnlyDishIds || []))
      })
      specialMenuList.forEach((each) => {
        if (selectedSpecialMenu?.includes(each.id)) {
          buffetItemIdList.push(...(each.dishes || []))
        }
      })
    }

    await runListTaxes(
      buffetNumOfGuests,
      notCountAsGuestNumber,
      buffetItemIdList
    )
  }

  return {
    submitting,
    doSubmit,
  }
}

export default useSendBuffetOrder
