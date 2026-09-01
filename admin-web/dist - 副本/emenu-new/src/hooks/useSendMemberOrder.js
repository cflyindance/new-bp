import {
  generateOrder,
  saveOrder,
  getChargeList,
  dealTimeAlert,
} from '@/services/orders'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useCallback, useMemo } from 'react'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useRequest } from 'ahooks'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { listTaxes } from '@/services/system'
import { getStorageValue } from '@/utils/storage'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import useGetUserId from '@/hooks/useGetUserId'
import useClassifyOrderMode from '@/hooks/useClassifyOrderMode'
import { SWITCH_NEW_ORDER } from '@/constants/order'
import { useDispatch } from 'react-redux'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'

const useSendMemberOrder = ({ onClose, setCloseFeedback, endSubmitting }) => {
  const dispatch = useDispatch()
  const [orders] = useGlobalState('Orders')
  const { getFinalConfigById } = useSystemConfig()
  const isOpenDuration = getFinalConfigById(5)?.open
  const durationTime = getFinalConfigById(5)?.duration
  const isOpenAlert = getFinalConfigById(14)?.open
  const alertTime = getFinalConfigById(14)?.restTimeAlert
  const [privilegeItem] = useGlobalState('privilegeItem')
  const [cart, setCart] = useGlobalState('Cart')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const { runFetchOrder } = useFetchOrder()
  const [, setMemberInfo] = useGlobalState('memberInfo')
  const [earningRule] = useGlobalState('earningRule')
  const { getUserId } = useGetUserId()

  // 品类模式兼容
  const { isBrandModeOpen } = useClassifyOrderMode()
  const [menuClassify] = useGlobalState('selectedMenuClassify')
  const [currentSpecialMenu] = useGlobalState('currentSpecialMenu')
  const [currentBuffetInfo] = useGlobalState('currentBuffetInfo')
  const [notCountAsGuestNumber] = useGlobalState('notCountAsGuestNumber')
  const specialMenuInfo = getFinalConfigById(55)
  const isBrandMode = useMemo(() => {
    return isBrandModeOpen && !menuClassify
  }, [isBrandModeOpen, menuClassify])
  const brandModeInfo = getFinalConfigById(13)
  const allBrandSetting = useMemo(() => {
    return brandModeInfo?.brandMeuSetting
  }, [brandModeInfo])

  const { run: runListTaxes } = useRequest(listTaxes, {
    manual: true,
    onSuccess: (res, params) => {
      const taxes = res.taxes ?? []
      const { isHasBenefit, crmMemberId, type } = params[0]
      const timeAlert = dealTimeAlert(
        { isOpenAlert, alertTime },
        { isOpenDuration, durationTime }
      )
      let buffetItemIdList = null
      if (currentBuffetInfo?.length > 0) {
        buffetItemIdList = []
        currentBuffetInfo.forEach((each) => {
          buffetItemIdList.push(
            ...(each.orderDishes || []),
            ...(each.viewOnlyDishIds || [])
          )
        })
        specialMenuInfo?.open &&
          specialMenuInfo?.specialMenu?.forEach((cur) => {
            if (currentSpecialMenu?.includes(cur.id)) {
              buffetItemIdList.push(...(cur.dishes || []))
            }
          })
      }

      // 提交订单
      run({
        cart: [],
        totalPrice: 0,
        taxes,
        crmMemberId,
        isHasBenefit,
        totalBenefitPrice: 0,
        type,
        earningRule,
        ...timeAlert,
        buffetItemIdList,
      })
    },
    onError: () => {
      dispatch(
        crmIntegrationValidationActions.setOrderDiscountSyncSuspended(false)
      )
      endSubmitting()
      setCloseFeedback()
    },
  })

  // 提交订单
  const submitOrder = useCallback(
    async (data) => {
      const { type } = data
      let prevOrder = orders?.[0]
      // 退出时 如果下单了会员卡 需要把会员卡删掉
      if (type === 'logout') {
        const { cart } = prevOrder
        const isHasBenefitCard = cart.find(
          (item) => item.id === privilegeItem.id
        )
        if (isHasBenefitCard) {
          prevOrder.cart = cart.map((item) => {
            if (item.id === privilegeItem.id) {
              return {
                ...item,
                count: 0,
              }
            }
            return item
          })
        }
      }
      const res = await getChargeList()
      const order = generateOrder({
        order: {
          ...data,
          chargeInfo: res.charge,
          menuClassify,
          currentSpecialMenu,
          notCountAsGuestNumber,
          clearCrmIntegrationDiscountList: type === 'logout',
        },
        prevOrder,
        isBuffetOrder: isBrandMode,
        brandSettings: allBrandSetting,
        isResendOrder: true,
        userId: getUserId(),
      })
      return saveOrder({ order })
    },
    [
      orders,
      isBrandMode,
      allBrandSetting,
      menuClassify,
      currentSpecialMenu,
      notCountAsGuestNumber,
    ]
  )

  const { data, mutate, error, run, loading } = useRequest(submitOrder, {
    manual: true,
    onSuccess: async (result, params) => {
      const type = params?.[0]?.type
      if (type === 'logout') {
        setMemberInfo({})
      }
      mutate({ status: 'ok', data })
      await runFetchOrder()
      if (type === 'logout') {
        dispatch(
          crmIntegrationValidationActions.setOrderDiscountSyncSuspended(false)
        )
      }
      onClose()
    },
    onError: () => {
      dispatch(
        crmIntegrationValidationActions.setOrderDiscountSyncSuspended(false)
      )
    },
    onFinally: () => {
      endSubmitting()
      const t = setTimeout(() => {
        setCloseFeedback()
        clearTimeout(t)
      }, 3000)
    },
  })

  const memberLoginSubmit = async ({
    isHasBenefit,
    isNewMember,
    crmMemberId,
    beforeLogin,
  }) => {
    const currentOrder = getStorageValue('emenu_table')?.currentOrder
    const isOrdered =
      currentOrder &&
      Object.keys(currentOrder)?.length > 0 &&
      currentOrder.switchOrderType !== SWITCH_NEW_ORDER
    // 未下单
    if (!isOrdered) return onClose(isNewMember)
    beforeLogin()
    await runListTaxes({
      isHasBenefit,
      crmMemberId,
      type: 'login',
    })
  }

  const memberLogoutSubmit = async ({ beforeLogout }) => {
    const currentOrder = getStorageValue('emenu_table')?.currentOrder
    const isOrdered =
      currentOrder &&
      Object.keys(currentOrder)?.length > 0 &&
      currentOrder.switchOrderType !== SWITCH_NEW_ORDER
    if (isOrdered) {
      dispatch(
        crmIntegrationValidationActions.setOrderDiscountSyncSuspended(true)
      )
    }
    dispatch(crmIntegrationValidationActions.clearSelectedBenefit())
    // 退出时要删除未下单的会员卡和兑换菜
    const newCart = cart.filter(
      (dish) =>
        dish.id !== privilegeItem.id &&
        !dish.rewardRule &&
        !dish.crmIntegrationPointItem &&
        !dish.crmIntegrationPointItemKey &&
        !dish.crmIntegrationVoucherItem &&
        !dish.crmIntegrationVoucherItemKey
    )
    setCart(newCart)
    setStoragedCart(newCart)
    // 未下单
    if (!isOrdered) {
      onClose()
      setMemberInfo({})
      return
    }
    beforeLogout()
    await runListTaxes({
      isHasBenefit: false,
      type: 'logout',
    })
  }

  return {
    memberLoginSubmit,
    loading,
    memberLogoutSubmit,
    error,
    data,
  }
}

export default useSendMemberOrder
