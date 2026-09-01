import { useLocation, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { useRequest } from 'ahooks'
import { useSetMenus } from './useSetMenus'
import { useGlobalState } from './useGlobalState'
import { fetchOrder, transformOrder } from '@/services/orders'
import { OrderStatus } from '@/constants/order'
import { getStorageValue, setStorageValue } from '@/utils/storage'
import { useLocalStorage } from './useLocalStorage'
import useSystemConfig from '@/hooks/useSystemConfig'
import { isEqual } from 'lodash-es'
import isOrderCrmDiscount from '@/utils/isOrderCrmDiscount'
import { useDispatch } from 'react-redux'
import useClassifyOrderMode from '@/hooks/useClassifyOrderMode'
import { useLocalStorageState } from 'bhooks'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'

export function useFetchOrder(errorCb) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const { allMenuItem } = useSetMenus()
  const { getFinalConfigById } = useSystemConfig()
  const [, setOrders] = useGlobalState('Orders')
  const [, setRedeemDiscountOpen] = useGlobalState('redeemDiscountOpen')
  const [, setTableInfo] = useLocalStorage('emenu_table', {})
  const [, setCurrentBuffetInfo] = useGlobalState('currentBuffetInfo', [])
  const [menuClassify, setMenuClassify] = useGlobalState('selectedMenuClassify')
  const [cart, setCart] = useGlobalState('Cart')
  const [, setInstructions] = useGlobalState('instructions')
  const [modifierActionList] = useGlobalState('modifierActionList')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const [, setStoragedLottery] = useLocalStorageState('emenu_lottery', {
    defaultValue: { count: 0 },
    listenStorageChange: true,
  })
  const [, setMemberInfo] = useGlobalState('memberInfo')
  const { isBrandModeOpen, isMenuClassifyMode } = useClassifyOrderMode()
  const brandMeuSetting = getFinalConfigById(13)?.brandMeuSetting
  const [crmRewardRules] = useGlobalState('crmRewardRules')
  const [, setIsAvoidAutoModal] = useGlobalState('isAvoidAutoModal')
  const [, setIsNeedCheckDishAuth] = useGlobalState('isNeedCheckDishAuth')
  const [currentSpecialMenu, setCurrentSpecialMenu] =
    useGlobalState('currentSpecialMenu')
  const [, setNotCountAsGuestNumber] = useGlobalState('notCountAsGuestNumber')
  const [privilegeItem] = useGlobalState('privilegeItem')
  const languageSetting = getFinalConfigById(71)
  const [isUpdatingPartySize] = useGlobalState('isUpdatingPartySize')
  const [, setSelectedSpecialComboId] = useGlobalState('selectedSpecialComboId')
  const [, setComboCart] = useGlobalState('ComboCart')
  // const [apiVersions, setApiVersions] = useGlobalState('apiVersions')

  const fetchOrderService = (data = {}) => {
    const tableInfo = getStorageValue('emenu_table')
    // const orderVersionInfo = apiVersions.orderVersionInfo
    // // 在轮询时 传递orderVersion信息
    // let { orderVersion } = orderVersionInfo
    // const isPolling = polling === 'polling'
    // if (!isPolling) orderVersion = undefined
    const currentOrder = tableInfo?.currentOrder
    const requests = [currentOrder?.id, currentOrder?.parentOrderId]
      ?.filter(Boolean)
      ?.map((orderId) =>
        fetchOrder({
          ...data,
          params: {
            ...data.params,
            orderId,
            // orderVersion,
          },
        })
      )
    return Promise.all(requests)
  }
  // 兑换过crm 折扣后的订单 不能再被操作下单
  const isRedeemDiscount = (order) => isOrderCrmDiscount(order)

  const isInvalidOrder = (order) => {
    return (
      order?.status === OrderStatus.CANCELED_AFTER_SENT_TO_KITCHEN ||
      order?.status === OrderStatus.CANCELED ||
      order?.status === OrderStatus.VOID_BY_SYSTEM ||
      order?.status === OrderStatus.PAID || // 已支付
      order?.additionalStatus === 'CLEARED_FROM_TABLE' || // 已清桌
      order?.parentOrderId > 0 // 子单定义为不可用订单
    )
  }

  const addProgortionToSubOrderItems = (thisOrder, parentOrder) => {
    const parentItems = parentOrder?.subOrders?.[0]?.orderItems
    const orderItems = thisOrder?.shareProportions?.map((i) => {
      const sharedItem = parentItems?.find((e) => e?.id === i?.orderItemId)
      return {
        ...sharedItem,
        proportion: i.proportion,
        splitWay: i.splitWay,
      }
    })
    const order = {
      ...thisOrder,
      subOrders: [
        {
          orderItems: [
            ...(thisOrder?.subOrders?.[0]?.orderItems ?? []),
            ...(orderItems ?? []),
          ],
        },
      ],
    }
    return order
  }

  const [, setSavedPermission] = useLocalStorageState('emenu_permission', {
    defaultValue: {},
    listenStorageChange: true,
  })

  const {
    data,
    error,
    loading,
    runAsync: runFetchOrder,
  } = useRequest(fetchOrderService, {
    manual: true,
    onSuccess: async (res, params = []) => {
      const thisOrder = res[0]?.order
      const isPolling = params?.[1] === 'polling'
      const hasPendingCart = Array.isArray(cart) && cart.length > 0
      // const isPolling = params?.[1] === 'polling'
      // if (isPolling) {
      //   // 订单轮询优化， 记录checksum
      //   const { orderVersion, id } = res[0]?.orderVersion || {}
      //   if (orderVersion && id) {
      //     const orderVersionInfo = apiVersions.orderVersionInfo
      //     const { orderId: storedOrderId, orderVersion: storedOrderVersion } =
      //       orderVersionInfo
      //     if (storedOrderId === id && storedOrderVersion === orderVersion) {
      //       return
      //     }
      //     setApiVersions({
      //       ...apiVersions,
      //       orderVersionInfo: { orderId: id, orderVersion },
      //     })
      //   }
      // }
      const parentOrder = res[1]?.order
      if (!thisOrder) {
        setOrders((prev) => (isEqual(prev, []) ? prev : []))
        if (!(isPolling && hasPendingCart)) {
          dispatch(
            crmIntegrationValidationActions.resetCrmIntegrationValidation()
          )
        }
        return false
      }
      const tableInfo = getStorageValue('emenu_table')
      const currentTableId = getStorageValue('emenu_table')?.currentTable?.id
      // 新增 - 订单换桌后清除相关信息
      if (isInvalidOrder(thisOrder) || thisOrder?.tableId !== currentTableId) {
        // 订单结束后 需要重新验证菜品权限
        setIsNeedCheckDishAuth(true)
        setIsAvoidAutoModal(true)
        setOrders([])
        dispatch(
          crmIntegrationValidationActions.resetCrmIntegrationValidation()
        )
        setTableInfo({
          ...tableInfo,
          currentOrder: {},
        })
        setRedeemDiscountOpen(false)
        // !无效订单或已分单的延迟返回首页
        enqueueSnackbar(t('OrderUpdatedToast.invalid'), {
          variant: 'warning',
          onClose() {
            setIsAvoidAutoModal(false)
            setStorageValue(
              'emenu_lang',
              languageSetting?.defaultLanguage || ''
            )
            i18n.changeLanguage(languageSetting?.defaultLanguage)
            navigate('/', { replace: true })
          },
        })
        // 清空会员信息
        setMemberInfo({})
        // setSelectedDiscountRule(null)
        setCurrentBuffetInfo((prev) => (isEqual(prev, []) ? prev : []))
        setMenuClassify(null)
        setCurrentSpecialMenu(null)
        setNotCountAsGuestNumber(undefined)
        // 当前订单结束后 清空购物车
        setCart([])
        setSelectedSpecialComboId(0)
        setComboCart([])
        setStoragedCart([])
        setInstructions('')
        setStoragedLottery((prev) => ({ ...prev, count: 0 }))
        setSavedPermission((prev) => {
          if (prev[thisOrder.id]) {
            delete prev[thisOrder.id]
          }
          return prev
        })
        return false
      }
      // 更新订单信息 numOfGuests etc...
      setTableInfo({
        ...tableInfo,
        currentOrder: thisOrder,
      })
      // 兑换过折扣, 或者POS打过折, 展示结单弹窗 不允许继续下单
      setRedeemDiscountOpen(isRedeemDiscount(thisOrder))

      // 是否下单分类
      const { emenuKioskextendedInfo } = thisOrder
      let eMenuExtraData = null
      if (emenuKioskextendedInfo) {
        eMenuExtraData = JSON.parse(emenuKioskextendedInfo)
      }
      const isOrderMenuClassify = !!eMenuExtraData?.menuClassify

      // 订单人数对比当前记录人数, 以订单人数为准，品类模式以品类菜为准
      const currentPartySize = getStorageValue('emenu_partySize')
      if (
        !(isBrandModeOpen && !isOrderMenuClassify) &&
        currentPartySize !== thisOrder.numOfGuests &&
        !isUpdatingPartySize
      ) {
        setStorageValue('emenu_partySize', thisOrder.numOfGuests)
      }
      let order = thisOrder
      if (thisOrder?.shareProportions?.length > 0) {
        order = addProgortionToSubOrderItems(thisOrder, parentOrder)
      }
      const resolvedOrder = [
        transformOrder({
          order,
          menuList: allMenuItem,
          modifierActionList: modifierActionList,
          crmRewardRules,
          memberCard: privilegeItem,
        }),
      ].filter(Boolean)
      setOrders(resolvedOrder)

      // 品牌模式兼容 分类
      if (isBrandModeOpen && !isOrderMenuClassify) {
        const orderItems = thisOrder?.subOrders?.[0]?.orderItems
        const buffetItems = orderItems.filter((each) => {
          return (
            each.quantity &&
            brandMeuSetting
              .map((brand) => brand.buffetId)
              ?.includes(each.saleItemId)
          )
        })

        if (buffetItems.length > 0) {
          const childBuffetIds = brandMeuSetting
            .filter((each) => each.mark === 'child')
            ?.map((item) => item.buffetId)

          const { newPartySize, childPartySize } = buffetItems.reduce(
            (pre, cur) => {
              if (childBuffetIds?.includes(cur.saleItemId)) {
                pre.childPartySize = pre.childPartySize + (cur.quantity || 0)
              }
              pre.newPartySize = pre.newPartySize + (cur.quantity || 0)
              return pre
            },
            { newPartySize: 0, childPartySize: 0 }
          )

          setNotCountAsGuestNumber(childPartySize)

          const prePartySize = getStorageValue('emenu_partySize') || 0
          if (newPartySize !== prePartySize) {
            setStorageValue('emenu_partySize', newPartySize)
          }
          const newBuffetInfo = buffetItems.map((each) => {
            const itemBuffetInfo = brandMeuSetting.find(
              (item) => item.buffetId === each.saleItemId
            )
            if (itemBuffetInfo) {
              const { viewOnlyDishes, dishType, viewOnlyIds } = itemBuffetInfo
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
                ...itemBuffetInfo,
                viewOnlyDishIds,
                count: each.quantity,
              }
            }
            return each
          })
          setCurrentBuffetInfo((prev) =>
            isEqual(prev, newBuffetInfo) ? prev : newBuffetInfo
          )
        }

        // 品类模式下特殊菜
        const orderedSpecialMenu = eMenuExtraData?.currentSpecialMenu
        if (!isEqual(currentSpecialMenu, orderedSpecialMenu)) {
          setCurrentSpecialMenu(orderedSpecialMenu)
        }
      }
      // 分类模式
      if (isMenuClassifyMode && isOrderMenuClassify) {
        const orderedMenuClassify = eMenuExtraData?.menuClassify
        if (!isEqual(menuClassify, orderedMenuClassify)) {
          setMenuClassify(orderedMenuClassify)
        }
      }
      // 母单
      if (thisOrder?.subOrderGroups?.length > 0 && pathname !== '/') {
        navigate('/')
      }
    },
    onError: () => {
      errorCb?.()
    },
  })

  return { data, error, loading, runFetchOrder, isInvalidOrder }
}
