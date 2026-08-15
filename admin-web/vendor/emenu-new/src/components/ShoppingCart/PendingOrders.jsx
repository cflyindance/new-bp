import {
  alpha,
  Box,
  Button,
  colors,
  Divider,
  Typography,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useBoolean, useRequest, useSetState } from 'ahooks'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useCheckPermission } from '@/hooks/useCheckPermission'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import { useSendKitchen } from '@/hooks/useSendKitchen'
import { roundToPrecision } from '@/utils/number'
import { listTaxes } from '@/services/system'
import {
  generateOrder,
  saveOrder,
  transformOrder,
  getChargeList,
  dealTimeAlert,
} from '@/services/orders'
import EmptyCart from './EmptyCart'
import AddInstructionsDialog from '../AddInstructionsDialog'
import DishDialog from '../DishDialog'
import LoadingOverlay from '../common/LoadingOverlay'
import dayjs from 'dayjs'
import useSystemConfig from '@/hooks/useSystemConfig'
import CartItem from '@/components/ShoppingCart/CartItem'
import isHasPot from '@/utils/isHasPot'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'
import useCheckMemberStatus from '@/hooks/useCheckMemberStatus'
import useGetDefaultDish from '@/hooks/useGetDefaultDish'
import useGetUserId from '@/hooks/useGetUserId'
import { fetchTable } from '@/services/tables'
import { SWITCH_NEW_ORDER } from '@/constants/order'
import { useThrottleFn } from 'ahooks'
import isOrderCrmDiscount from '@/utils/isOrderCrmDiscount'
import { useSelector } from 'react-redux'
import Toast from '@/components/Toast'
import useSendMessage from '@/hooks/useSendMessage'
import useCheckDishBeforeOrder from '@/hooks/useCheckDishBeforeOrder'
import { getStorageValue } from '@/utils/storage'
import { useNavigate } from 'react-router-dom'
import { sendPosLog } from '@/services/setting'
import useCountDown from '@/hooks/useCountDown'
import CircularProgress from '@material-ui/core/CircularProgress'
import { usePrintReceipt } from '@/hooks/usePrintReceipt'
import useClassifyOrderMode from '@/hooks/useClassifyOrderMode'
import { useLocalStorageState } from 'bhooks'
import { getDiscountedUnitPrice } from '@/utils/cartItemDiscount'
import {
  CRM_INTEGRATION_REWARD_KIND,
  isCrmIntegrationQuantityItemDiscountBenefit,
  isCrmIntegrationSpecialItemBenefit,
} from '@/utils/crmIntegrationRewards'
import {
  isCrmIntegrationPointItemCartItem,
  normalizeCrmIntegrationFreeItemSubmitReward,
} from '@/utils/crmIntegrationCartValidation'

const AdminLogin = lazy(() => import('../AdminLogin'))
const FeedbackToast = lazy(() => import('../common/FeedbackToast'))

function isCrmIntegrationPendingBenefitItem(item, itemDiscounts = []) {
  if (isCrmIntegrationPointItemCartItem(item)) {
    return true
  }
  if (item?.crmIntegrationItemLevelDiscountDisplay) {
    return true
  }
  if (
    item?.crmIntegrationBenefitRuleId &&
    Array.isArray(itemDiscounts) &&
    itemDiscounts.length > 0
  ) {
    return true
  }
  return (
    Array.isArray(item?.discountList) &&
    item.discountList.some((discount) => discount?.extraInfo?.enableBenefit)
  )
}

function toPositiveInteger(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.floor(number))
}

function getDiscountAmount(discount) {
  const amount = Number(discount?.amount || 0)
  return Number.isFinite(amount) ? amount : 0
}

function splitDiscountsByQuantity(discounts, quantity) {
  if (!quantity) return []
  return discounts.map((discount) => ({
    ...discount,
    amount: roundToPrecision(getDiscountAmount(discount) / quantity),
  }))
}

function shouldSplitCrmIntegrationItemLevelBenefit(benefit) {
  return (
    isCrmIntegrationSpecialItemBenefit(benefit) ||
    isCrmIntegrationQuantityItemDiscountBenefit(benefit)
  )
}

function getCartItemSubmitUnitPrice(item, useBenefitPrice = false) {
  return useBenefitPrice
    ? (item.realBenefitPrice ?? item.realPrice ?? item.price)
    : (item.realPrice ?? item.price)
}

function buildCrmIntegrationFallbackRewardDiscount(item, discount) {
  const itemAmount = roundToPrecision(
    Number(item?.realPrice ?? item?.price ?? 0) * Number(item?.count || 1)
  )
  const discountAmount = Number(discount?.amount || 0)
  const amount = discountAmount > 0 ? discountAmount : itemAmount

  if (!amount && !discount?.isReward) return null

  return {
    ...discount,
    amount,
    extraInfo: {
      ...(discount?.extraInfo || {}),
      enableBenefit: true,
      isItemDetailDiscount: true,
    },
  }
}

function buildCrmIntegrationDiscountOrderRewardForSubmit({
  cart,
  selectedBenefit,
  selectedBenefitValidation,
}) {
  const orderDiscountInfo = Array.isArray(
    selectedBenefitValidation?.orderDiscountInfo
  )
    ? selectedBenefitValidation.orderDiscountInfo
    : []
  const discountedItemInfoByKey = {
    ...(selectedBenefitValidation?.discountedItemInfoByKey || {}),
  }
  const fallbackOrderDiscountInfo = []

  ;(Array.isArray(cart) ? cart : []).forEach((item) => {
    if (!isCrmIntegrationPointItemCartItem(item)) return
    if (discountedItemInfoByKey[String(item.key)]) return

    const rewardDiscounts = (
      Array.isArray(item.discountList) ? item.discountList : []
    )
      .filter((discount) => discount?.isReward)
      .map((discount) =>
        buildCrmIntegrationFallbackRewardDiscount(item, discount)
      )
      .filter(Boolean)

    if (!rewardDiscounts.length) return

    discountedItemInfoByKey[String(item.key)] = {
      orderItem: {
        id: String(item.key),
        quantity: Number(item.count || 1),
      },
      discounts: rewardDiscounts,
    }
    fallbackOrderDiscountInfo.push(...rewardDiscounts)
  })

  const actualOrderDiscountInfo = orderDiscountInfo.length
    ? orderDiscountInfo
    : fallbackOrderDiscountInfo
  const hasItemDiscountInfo = Object.keys(discountedItemInfoByKey).length > 0

  if (
    !selectedBenefit?.id &&
    !actualOrderDiscountInfo.length &&
    !hasItemDiscountInfo
  ) {
    return null
  }

  if (!actualOrderDiscountInfo.length && !hasItemDiscountInfo) return null

  return normalizeCrmIntegrationFreeItemSubmitReward({
    crmIntegrationBenefit: true,
    selectedBenefitId: selectedBenefit?.id,
    crmIntegrationRewardKind:
      selectedBenefit?.crmIntegrationRewardKind ||
      CRM_INTEGRATION_REWARD_KIND.FREE_ITEM,
    orderDiscountInfo: actualOrderDiscountInfo,
    discountedItemInfoByKey,
    result: selectedBenefitValidation?.result || null,
  })
}

function createCrmIntegrationDisplayCartItem(item, options) {
  return {
    ...item,
    key: options.key,
    count: options.count,
    crmIntegrationDisplaySourceKey: item.key,
    crmIntegrationDisplaySourceCount: item.count,
    crmIntegrationDisplaySourceItem: item,
    crmIntegrationDisplayDiscounts: options.discounts,
    crmIntegrationItemLevelDiscountDisplay: options.isDiscounted,
  }
}

function buildCrmIntegrationDisplayCartItems({
  cart,
  selectedBenefit,
  selectedBenefitValidation,
}) {
  if (!shouldSplitCrmIntegrationItemLevelBenefit(selectedBenefit)) {
    return cart
  }

  const discountedItemInfoByKey =
    selectedBenefitValidation?.discountedItemInfoByKey || {}

  return cart.flatMap((item) => {
    const itemCount = toPositiveInteger(item?.count)
    const discountedItemInfo = discountedItemInfoByKey[String(item?.key)]
    const discounts = Array.isArray(discountedItemInfo?.discounts)
      ? discountedItemInfo.discounts
      : []
    const discountQuantity = Math.min(
      toPositiveInteger(discountedItemInfo?.orderItem?.quantity),
      itemCount
    )

    if (!itemCount || !discounts.length || !discountQuantity) {
      return item
    }

    const unitDiscounts = splitDiscountsByQuantity(discounts, discountQuantity)
    const displayItems = Array.from({ length: discountQuantity }, (_, index) =>
      createCrmIntegrationDisplayCartItem(item, {
        key: `${item.key}__crm_discount_${index}`,
        count: 1,
        discounts: unitDiscounts,
        isDiscounted: true,
      })
    )
    const remainingCount = itemCount - discountQuantity
    if (remainingCount > 0) {
      displayItems.push(
        createCrmIntegrationDisplayCartItem(item, {
          key: `${item.key}__crm_regular`,
          count: remainingCount,
          discounts: [],
          isDiscounted: false,
        })
      )
    }

    return displayItems
  })
}

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
  },
  cartItemList: {
    overflowY: 'auto',
    margin: theme.spacing(1, -1),
    padding: theme.spacing(0, 1),
    '&::-webkit-scrollbar': {
      width: 5,
      height: 5,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey.A200,
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.primary.light,
    },
  },
  bottomBtns: {
    backgroundColor: theme.palette.common.white,
  },
  addNoteBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    height: 51,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: '19px',
    borderRadius: 0,
    backgroundColor: '#F9F9FA',
  },
  submitBtn: {
    height: 56,
    fontSize: 20,
    lineHeight: 1.2,
  },
  submitLoading: {
    marginRight: 8,
  },
}))

function PendingOrders({ jumpTab, handleClose, toggleOrderPlaceStatus }) {
  const navigate = useNavigate()
  const classes = useStyles()
  const [crmRewardRules] = useGlobalState('crmRewardRules')
  const { t } = useTranslation(['translation', 'dish'])
  const [cart, setCart] = useGlobalState('Cart')
  const actualCart = useMemo(
    () => cart.filter((each) => !each.isBuffetItem),
    [cart]
  )
  const [, setTaxList] = useGlobalState('TaxList')
  const [instructions, setInstructions] = useGlobalState('instructions')
  const [isHasHotpot] = useGlobalState('isHasHotpot')
  const { getFinalConfigById } = useSystemConfig()
  const [checkData, setCheckData] = useState(null)
  const [memberInfo] = useGlobalState('memberInfo')
  const { isHasBenefit } = useCheckMemberStatus(memberInfo)
  const { getUserId } = useGetUserId()
  const isDisplayMode = getFinalConfigById(10)?.open
  const isOpenSpecialDishPermission = getFinalConfigById(36)?.open
  const isOpenDuration = getFinalConfigById(5)?.open
  const durationTime = getFinalConfigById(5)?.duration
  const isOpenAlert = getFinalConfigById(14)?.open
  const alertTime = getFinalConfigById(14)?.restTimeAlert
  const { allMenuItem } = useSetMenus()
  const [orders, setOrders] = useGlobalState('Orders')
  const [earningRule] = useGlobalState('earningRule')
  const [menuClassify] = useGlobalState('selectedMenuClassify')
  const [currentSpecialMenu] = useGlobalState('currentSpecialMenu')
  const [currentBuffetInfo] = useGlobalState('currentBuffetInfo')
  const [modifierActionList] = useGlobalState('modifierActionList')
  const specialMenuInfo = getFinalConfigById(55)
  const isNeedPasswordAuth = getFinalConfigById(54)?.open
  const authBeforeOrderConfig = getFinalConfigById(79)
  const { isMenuClassifyMode, isBrandModeOpen } = useClassifyOrderMode()
  const {
    needRestTimeAlertPermission,
    needDurationPermission,
    needOrderIntervalPermission,
    needQuantityPermission,
    needDishLimitPerRoundPermission,
    needDishLimitPerRoundCartPermission,
    needMutexDishPermission,
    needCombinationDishPermission,
  } = useCheckDishBeforeOrder()

  const quantityPerm = needQuantityPermission(cart)
  const durPermPerRound = needDishLimitPerRoundPermission()
  const durPermPerRoundCart = needDishLimitPerRoundCartPermission(cart)
  const mutexDishPerm = needMutexDishPermission()
  const intervalPermission = needOrderIntervalPermission(orders)
  // 下单时间间隔倒计时
  const intervalSeconds = useMemo(() => {
    return intervalPermission.leftMin
  }, [intervalPermission])
  const { remainingTime } = useCountDown(intervalSeconds)
  const isDisplayZeroPrice = getFinalConfigById(65)?.open
  const isDisplayCartOrderPrice = getFinalConfigById(82)?.open

  const [
    { needSpecialPermission, isHadBuffetViewOnly },
    savedPermission,
    setSavedPermission,
    overLimitDish,
  ] = useCheckPermission(cart)
  const { runSendKitchen } = useSendKitchen()
  const { runPrintReceipt } = usePrintReceipt()
  const displayDishDetailsConfig = getFinalConfigById(27)
  const displayDishNote = getFinalConfigById(28)
  const displayOrderNote = getFinalConfigById(32)?.open
  const customDishOrderMessagesConfig = getFinalConfigById(75)
  const posterInfo = getFinalConfigById(56)
  const posterBeforeOrder = useMemo(() => {
    return (
      posterInfo?.open &&
      posterInfo?.posterAds?.[0] &&
      posterInfo?.posterBeforeOrder
    )
  }, [posterInfo])
  const [, setPosterConfig] = useGlobalState('poster')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const [storagedLottery, setStoragedLottery] = useLocalStorageState(
    'emenu_lottery',
    {
      defaultValue: { count: 0 },
      listenStorageChange: true,
    }
  )
  const [tableInfo, setTableInfo] = useLocalStorage('emenu_table', {})
  const [editItem, setEditItem] = useState(null)
  const [privilegeItem] = useGlobalState('privilegeItem')
  const [notCountAsGuestNumber] = useGlobalState('notCountAsGuestNumber')
  const [
    openDishDialog,
    { setTrue: setOpenDishDialog, setFalse: setCloseDishDialog },
  ] = useBoolean()
  const [adminLogin, setAdminLogin] = useSetState({
    open: false,
    permission: '',
    next: () => {},
  })
  const [submitting, { setTrue: startSubmitting, setFalse: endSubmitting }] =
    useBoolean()

  const [dishIntervalList, setDishIntervalList] = useState([])
  const { cartWithoutDishInterval, cartWithDishInterval } = useMemo(() => {
    let cartWithoutDishInterval = []
    let cartWithDishInterval = []
    cart.forEach((e) => {
      if (dishIntervalList.includes(e.id)) {
        cartWithDishInterval.push(e)
      } else {
        cartWithoutDishInterval.push(e)
      }
    })
    return {
      cartWithoutDishInterval,
      cartWithDishInterval,
    }
  }, [dishIntervalList, cart])

  useEffect(() => {
    toggleOrderPlaceStatus(submitting)
  }, [submitting])

  const crmIntegrationValidationSlice = useSelector(
    (state) => state.crmIntegrationValidationSlice
  )

  const [
    openFeedback,
    { setTrue: setOpenFeedback, setFalse: setCloseFeedback },
  ] = useBoolean()
  const onSendOrderError = () => {
    endSubmitting()
    setCloseFeedback()
  }
  const [isNeedCheckDishAuth, setIsNeedCheckDishAuth] = useGlobalState(
    'isNeedCheckDishAuth'
  )
  const { runFetchOrder } = useFetchOrder(onSendOrderError)
  const { defaultDishIds } = useGetDefaultDish()
  const { currentTable } = tableInfo
  const orderId = useMemo(() => tableInfo?.currentOrder?.id, [tableInfo])
  const isSubOrder = useMemo(
    () => tableInfo?.currentOrder?.parentOrderId > 0,
    [tableInfo]
  )
  const cartCount = useMemo(
    () => actualCart.reduce((prev, curr) => prev + curr.count, 0),
    [actualCart]
  )

  const getCrmIntegrationItemDiscounts = useCallback(
    (item) => {
      const discounts =
        crmIntegrationValidationSlice?.selectedBenefitValidation
          ?.discountedItemInfoByKey?.[String(item.key)]?.discounts
      if (Array.isArray(discounts)) {
        return discounts
      }
      return Array.isArray(item?.discountList) ? item.discountList : []
    },
    [crmIntegrationValidationSlice]
  )

  const getDisplayCrmIntegrationItemDiscounts = useCallback(
    (item) => {
      if (Array.isArray(item?.crmIntegrationDisplayDiscounts)) {
        return item.crmIntegrationDisplayDiscounts
      }
      return getCrmIntegrationItemDiscounts(item)
    },
    [getCrmIntegrationItemDiscounts]
  )

  const displayCartItems = useMemo(
    () =>
      buildCrmIntegrationDisplayCartItems({
        cart: actualCart,
        selectedBenefit: crmIntegrationValidationSlice?.selectedBenefit,
        selectedBenefitValidation:
          crmIntegrationValidationSlice?.selectedBenefitValidation,
      }),
    [
      actualCart,
      crmIntegrationValidationSlice?.selectedBenefit,
      crmIntegrationValidationSlice?.selectedBenefitValidation,
    ]
  )

  const getCartItemActualUnitPrice = useCallback(
    (item, useBenefitPrice = false) => {
      const crmIntegrationDiscounts = getCrmIntegrationItemDiscounts(item)
      return (
        getDiscountedUnitPrice(item, crmIntegrationDiscounts) ??
        (useBenefitPrice
          ? (item.realBenefitPrice ?? item.realPrice ?? item.price)
          : (item.realPrice ?? item.price))
      )
    },
    [getCrmIntegrationItemDiscounts]
  )

  const totalPrice = useMemo(
    () =>
      roundToPrecision(
        actualCart.reduce((acc, cur) => {
          const unitPrice = getCartItemActualUnitPrice(cur)
          return acc + unitPrice * cur.count
        }, 0)
      ),
    [actualCart, getCartItemActualUnitPrice]
  )

  const totalPriceWithoutDishInterval = useMemo(
    () =>
      roundToPrecision(
        cartWithoutDishInterval.reduce(
          (acc, cur) => acc + getCartItemSubmitUnitPrice(cur) * cur.count,
          0
        )
      ),
    [cartWithoutDishInterval]
  )

  const totalBenefitPrice = useMemo(
    () =>
      roundToPrecision(
        actualCart.reduce((acc, cur) => {
          const unitPrice = getCartItemActualUnitPrice(cur, true)
          return acc + unitPrice * cur.count
        }, 0)
      ),
    [actualCart, getCartItemActualUnitPrice]
  )

  const totalBenefitPriceWithoutDishInterval = useMemo(
    () =>
      roundToPrecision(
        cartWithoutDishInterval.reduce(
          (acc, cur) => acc + getCartItemSubmitUnitPrice(cur, true) * cur.count,
          0
        )
      ),
    [cartWithoutDishInterval]
  )

  const crmIntegrationDiscountOrderRewardForSubmit = useMemo(
    () =>
      buildCrmIntegrationDiscountOrderRewardForSubmit({
        cart: cartWithoutDishInterval,
        selectedBenefit: crmIntegrationValidationSlice?.selectedBenefit,
        selectedBenefitValidation:
          crmIntegrationValidationSlice?.selectedBenefitValidation,
      }),
    [
      cartWithoutDishInterval,
      crmIntegrationValidationSlice?.selectedBenefit,
      crmIntegrationValidationSlice?.selectedBenefitValidation,
    ]
  )

  const isShowBenefitPrice = useMemo(() => {
    return (
      typeof totalBenefitPrice === 'number' && totalBenefitPrice !== totalPrice
    )
  }, [totalPrice, totalBenefitPrice])

  const closeAdminLogin = () =>
    setAdminLogin({ open: false, permission: '', next: () => {} })

  const { run: runSaveMessage } = useSendMessage({
    onBeforeSend: () => {},
    onAfterSend: () => {},
  })

  const countIsShowNote = (id) => {
    const isOpen = displayDishNote?.open
    if (!isOpen || !id) return false
    const openList = displayDishNote?.displayDishNote
    return openList.includes(id)
  }

  const handleEditItem = (item) => () => {
    const { large, id, isBuffetItem } = item
    const isDisplayDishDetails =
      displayDishDetailsConfig?.open &&
      displayDishDetailsConfig.showDishDetail?.includes(id)
    const isShowDetail =
      large || isDisplayDishDetails || countIsShowNote(id) || !isBuffetItem
    if (isShowDetail) {
      setEditItem(item)
      setOpenDishDialog()
    }
  }

  const handleChangeCart = (data) => {
    const newCart = [...cart]
      .map((e) => (e.key === editItem.key ? { ...editItem, ...data } : e))
      .filter((e) => e.count > 0)
    setCart(newCart)
    setStoragedCart(newCart)
  }

  const handleChangeCount = (key, value, tempHotPotId) => {
    const newCart = [...cart]
      .map((e) => {
        let isSame = e.key === key
        if (tempHotPotId) {
          isSame = isSame && e.tempHotPotId === tempHotPotId
        }
        return isSame ? { ...e, count: value } : e
      })
      .filter((e) => e.count > 0)
    setCart(newCart)
    setStoragedCart(newCart)
  }

  // 数量限制和特殊菜品限制是否已通过, 每次下单生效
  const [oncePassed, setOncePassed] = useSetState({
    special: false,
    quantity: false,
    dishLimit: false,
    combinationDish: false,
    authBeforeOrderDefaultMode: false,
    authBeforeOrderMenuClassifyMode: false,
    authBeforeOrderCategoryMode: false,
    dishOrderIntervalCart: false,
  })

  const submitBackup = useRef(null)
  const submitBtnRef = useRef(null)
  const posterOpenFlagRef = useRef(false)

  const { run: doSubmit } = useThrottleFn(
    async () => {
      if (posterBeforeOrder && !posterOpenFlagRef.current) {
        posterOpenFlagRef.current = true
        setPosterConfig({
          open: true,
          posterBeforeOrder: true,
          closeNext: () => {
            posterOpenFlagRef.current = false
          },
          orderNext: () => {
            submitBtnRef.current?.click()
          },
        })
        return
      }
      try {
        if (submitting) return
        submitBackup.current = null
        const userInfo = getStorageValue('emenu_user')
        const currentTable = getStorageValue('emenu_table')?.currentTable
        if (!userInfo) {
          setAdminLogin({
            open: true,
            permission: 'setOrderUser',
            next: closeAdminLogin,
          })
          return
        }
        if (!currentTable?.id) {
          Toast.error(t('AdminLogin.permission_setOrderTable'))
          navigate('/')
          return false
        }
        const isRequirePot = getFinalConfigById(20)?.open
        // 锅底必选，菜单中有火锅，下单菜品中不含锅底
        if (
          isRequirePot &&
          isHasHotpot &&
          !isHasPot([...cart, ...(orders?.[0]?.cart || [])])
        ) {
          setCheckData({
            status: 200,
            message: t('ShoppingCart.send_hotpot'),
          })
          setOpenFeedback()
          return
        }
        // !第一步：下单限制
        const needSpecial = needSpecialPermission() || isHadBuffetViewOnly()
        // 可看不可点-下单时候的判断逻辑
        if (
          needSpecial &&
          isOpenSpecialDishPermission &&
          !oncePassed.special &&
          isNeedCheckDishAuth
        ) {
          setAdminLogin({
            open: true,
            permission: 'special',
            next: () => {
              setIsNeedCheckDishAuth(false)
              setOncePassed({ special: true })
            },
          })
          return false
        }

        submitBackup.current = {
          cartWithDishInterval,
          cartWithoutDishInterval,
          totalPriceWithoutDishInterval,
          totalBenefitPriceWithoutDishInterval,
          crmIntegrationDiscountOrderRewardForSubmit,
        }

        const combinationDishPerm = needCombinationDishPermission(
          cartWithoutDishInterval
        )
        if (
          combinationDishPerm.needPermission &&
          !oncePassed.combinationDish &&
          isNeedCheckDishAuth
        ) {
          Toast.error(
            t('checkDish.permission_combinationDish', {
              count1: combinationDishPerm.dishACount || 0,
              count2: combinationDishPerm.additionalDishBCount || 0,
            })
          )
          setAdminLogin({
            open: true,
            permission: 'combinationDish',
            next: () => {
              setIsNeedCheckDishAuth(false)
              setOncePassed({ combinationDish: true })
            },
          })
          return false
        }

        if (durPermPerRoundCart.needPermission) {
          if (durPermPerRoundCart.maxLimit) {
            Toast.error(
              t('checkDish.permission_dishLimitPerRoundCartMax', {
                maxLimit: durPermPerRoundCart.maxLimit,
                overCount: durPermPerRoundCart.overCount,
              })
            )
            setAdminLogin({
              open: true,
              permission: 'dishLimitPerRoundCartMax',
              next: () => {
                setIsNeedCheckDishAuth(false)
              },
            })
            return false
          }

          if (durPermPerRoundCart.minLimit) {
            Toast.error(
              t('checkDish.permission_dishLimitPerRoundCartMin', {
                minLimit: durPermPerRoundCart.minLimit,
                underCount: durPermPerRoundCart.underCount,
              })
            )
            setAdminLogin({
              open: true,
              permission: 'dishLimitPerRoundCartMin',
              next: () => {
                setIsNeedCheckDishAuth(false)
              },
            })
          }
          return false
        }

        if (quantityPerm.needPermission) {
          Toast.error(
            t('checkDish.permission_orderQuantity', {
              val: quantityPerm.maxLimit,
            })
          )
          setAdminLogin({
            open: true,
            permission: 'quantity',
            next: () => {
              setIsNeedCheckDishAuth(false)
            },
          })
          return false
        }

        if (authBeforeOrderConfig?.open && isNeedCheckDishAuth) {
          if (
            !isBrandModeOpen &&
            !isMenuClassifyMode &&
            !(authBeforeOrderConfig.defaultMode === false) &&
            !oncePassed.authBeforeOrderDefaultMode
          ) {
            setAdminLogin({
              open: true,
              permission: 'authBeforeOrder',
              next: () => {
                setIsNeedCheckDishAuth(false)
                setOncePassed({ authBeforeOrderDefaultMode: true })
              },
            })
            return false
          } else if (
            ((isBrandModeOpen && isMenuClassifyMode && menuClassify) ||
              (!isBrandModeOpen && isMenuClassifyMode)) &&
            !(authBeforeOrderConfig.menuClassifyMode === false) &&
            !oncePassed.authBeforeOrderMenuClassifyMode
          ) {
            setAdminLogin({
              open: true,
              permission: 'authBeforeOrder',
              next: () => {
                setIsNeedCheckDishAuth(false)
                setOncePassed({ authBeforeOrderMenuClassifyMode: true })
              },
            })
            return false
          } else if (
            ((isBrandModeOpen && isMenuClassifyMode && !menuClassify) ||
              (isBrandModeOpen && !isMenuClassifyMode)) &&
            !(authBeforeOrderConfig.categoryMode === false) &&
            !oncePassed.authBeforeOrderCategoryMode
          ) {
            setAdminLogin({
              open: true,
              permission: 'authBeforeOrder',
              next: () => {
                setIsNeedCheckDishAuth(false)
                setOncePassed({ authBeforeOrderCategoryMode: true })
              },
            })
            return false
          }
        }

        if (
          cartWithoutDishInterval.length <= 0 &&
          cartWithDishInterval.length > 0
        ) {
          Toast.error(t('checkDish.permission_dishOrderIntervalCart'))
          setAdminLogin({
            open: true,
            permission: 'dishOrderIntervalCart',
            next: () => {
              setIsNeedCheckDishAuth(false)
              setOncePassed({ dishOrderIntervalCart: true })
            },
          })
          return false
        }

        posterOpenFlagRef.current = false
        setPosterConfig({
          open: false,
        })

        startSubmitting()
        setOpenFeedback()
        // 切桌时, add new order 下单时不再检查桌子订单
        const isSkipCheckTable =
          tableInfo?.currentOrder?.switchOrderType === SWITCH_NEW_ORDER
        if (orderId || isSkipCheckTable) {
          // 获取订单最新信息
          await runFetchOrder()
        } else {
          // 没有订单时，检查是否pos在间隙时已开单
          await checkTableOrderBeforeSend()
          return
        }
        // 获取税信息
        await runListTaxes()
      } catch (e) {
        sendPosLog(`EMenu send order doSubmit error - ${e.message}`)
      }
    },
    { wait: 800 }
  )

  const checkTableOrderBeforeSend = async () => {
    try {
      const { id } = currentTable
      const res = await fetchTable(id)
      if (res) {
        // 兑换过crm 折扣后的订单 不能再被操作
        const currentTableOrders = res.table?.orders?.filter(
          (order) => order.productLine === 'EMENU' && !isOrderCrmDiscount(order)
        )
        // 只考虑一桌一单情况
        if (currentTableOrders?.length === 1) {
          // 直接选中此订单
          const { id } = currentTableOrders[0]
          setTableInfo({
            ...tableInfo,
            currentOrder: {
              id,
            },
          })
          if (id) {
            await runFetchOrder()
          }
          const timer = setTimeout(async () => {
            await runListTaxes()
            clearTimeout(timer)
          }, 1000)
          return
        }
        await runListTaxes()
        return
      }
      await runListTaxes()
    } catch (e) {
      sendPosLog(`EMenu send order check table order error - ${e.message}`)
    }
  }

  // 获取税信息
  const { runAsync: runListTaxes } = useRequest(listTaxes, {
    manual: true,
    onSuccess: async (res) => {
      try {
        const taxes = res.taxes ?? []
        setTaxList(taxes)
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
        await runAsync({
          cart: submitBackup.current?.cartWithoutDishInterval,
          instructions,
          totalPrice: submitBackup.current?.totalPriceWithoutDishInterval,
          taxes,
          crmMemberId: memberInfo?.userId,
          discountOrderReward:
            submitBackup.current?.crmIntegrationDiscountOrderRewardForSubmit,
          isHasBenefit, // 是否有权益 - 有 -> 会员价下单
          totalBenefitPrice:
            submitBackup.current?.totalBenefitPriceWithoutDishInterval, // 总会员价
          earningRule, // 积分规则
          ...timeAlert,
          buffetItemIdList,
        })
      } catch (e) {
        sendPosLog(`EMenu send order get tax list error - ${e.message}`)
      }
    },
    onError: () => {
      endSubmitting()
      setCloseFeedback()
    },
  })

  // 提交订单
  const submitOrder = useCallback(
    async (data) => {
      try {
        const { discountOrderReward, ...orderData } = data
        const isHasPreOrder = orders?.[0]
        let newPreOrder = orders?.[0]
        // 加菜或者编辑订单
        if (isHasPreOrder) {
          const preCart = orders?.[0]?.cart
          const currentCart = orderData.cart
          const newPreCart = preCart?.map((dish) => {
            const { id } = dish
            if (!defaultDishIds.includes(id)) return dish
            const isInCurrentCart = currentCart.find((item) => item.id === id)
            return isInCurrentCart ? { ...dish, count: 0 } : dish
          })
          newPreOrder = {
            ...orders?.[0],
            cart: newPreCart,
            totalPrice:
              newPreCart?.length > 0
                ? roundToPrecision(
                    newPreCart?.reduce(
                      (acc, cur) =>
                        acc +
                        (isHasBenefit
                          ? (cur.realBenefitPrice ?? cur.realPrice ?? cur.price)
                          : (cur.realPrice ?? cur.price)) *
                          cur.count,
                      0
                    )
                  )
                : 0,
          }
        }
        const res = await getChargeList()
        const order = generateOrder({
          order: {
            ...orderData,
            chargeInfo: res.charge,
            menuClassify,
            currentSpecialMenu,
            notCountAsGuestNumber,
            lotteryCount: storagedLottery.count,
          },
          prevOrder: newPreOrder,
          userId: getUserId(),
          discountOrderReward,
        })
        return saveOrder({ order })
      } catch (e) {
        sendPosLog(`EMenu send order submit error - ${e.message}`)
      }
    },
    [orders, menuClassify, currentSpecialMenu, notCountAsGuestNumber]
  )
  const { data, mutate, error, runAsync } = useRequest(submitOrder, {
    manual: true,
    onSuccess: async (result, [params]) => {
      try {
        setTableInfo((info) => ({
          ...info,
          currentOrder: result.order,
        }))
        const orders = [
          transformOrder({
            order: result.order,
            menuList: allMenuItem,
            modifierActionList: modifierActionList,
            crmRewardRules,
            memberCard: privilegeItem,
          }),
        ].filter(Boolean)
        setOrders(orders)
        // !全新订单时次数初始为1且未保存权限，追加订单时次数累加
        const newOrderId = result.order?.id
        console.log(
          `🚀 ~ PendingOrders ~ orderId, newOrderId`,
          orderId,
          newOrderId
        )
        const oldPermission = savedPermission[newOrderId]
        const currentTime = dayjs().format('YYYY/MM/DD HH:mm:ss')
        const sendDishOrderTime = (
          oldPermission?.sendDishOrderTime || []
        ).concat(
          submitBackup.current?.cartWithoutDishInterval?.map((e) => ({
            id: e.id,
            createdOn: currentTime,
          })) || []
        )
        const newPermission = oldPermission
          ? {
              ...oldPermission,
              times: oldPermission.times + 1,
              sendOrderTime: currentTime,
              sendDishOrderTime: sendDishOrderTime,
            }
          : {
              times: 1,
              durationPermitted: false,
              timesPermitted: false,
              sendOrderTime: currentTime,
              sendDishOrderTime: sendDishOrderTime,
            }
        setSavedPermission((prev) => ({
          ...prev,
          [newOrderId]: newPermission,
        }))
        // 下单后 需要重新验证菜品权限
        setIsNeedCheckDishAuth(true)
        setCart(submitBackup.current?.cartWithDishInterval)
        setInstructions('')
        setStoragedCart(submitBackup.current?.cartWithDishInterval)
        setStoragedLottery((prev) => ({ ...prev, count: 0 }))
        mutate({ status: 'ok', data })
        // 发送消息给POS
        const customDishOrderMessages =
          (customDishOrderMessagesConfig?.open &&
            customDishOrderMessagesConfig?.customDishOrderMessages) ||
          []
        const cart = params.cart || []
        const customDishOrderMessageList = []
        customDishOrderMessages.forEach((item) => {
          if (
            item.message &&
            item.dishes?.find((dishId) => cart.find((c) => c.id === dishId))
          ) {
            customDishOrderMessageList.push(item.message)
          }
        })
        const customDishOrderMessageContent =
          customDishOrderMessageList.join('\n')

        runSaveMessage({
          type: newOrderId === orderId ? 'editOrder' : 'newOrder',
          title: newOrderId === orderId ? 'Additional Order' : 'New Order',
          content: `${currentTable?.name ?? 'None'}${customDishOrderMessageContent ? `|${customDishOrderMessageContent}` : ''}`,
          tableId: currentTable?.id,
        })

        const asyncFn = async () => {
          // 延迟送厨
          await runSendKitchen(orders)
          // 打印小票
          await runPrintReceipt(orders)
        }
        asyncFn()
      } catch (e) {
        sendPosLog(`EMenu send order submit error onSuccess - ${e.message}`)
      }
    },
    onFinally: (params, result, error) => {
      endSubmitting()
      const t = setTimeout(() => {
        setCloseFeedback()
        endSubmitting()
        if (!error && data?.status === 'ok') {
          // 跳转到已下单
          jumpTab(1)
        }
        clearTimeout(t)
      }, 3000)
    },
  })

  const handleCloseFeedBack = () => {
    setCloseFeedback()
    if (checkData) {
      handleClose()
      setCheckData(null)
    }
  }

  const permissions = useMemo(() => {
    if (!isNeedCheckDishAuth) {
      return {}
    }
    const restTimeAlertPermission = needRestTimeAlertPermission(orders)
    const durationPermission = needDurationPermission(orders)
    if (
      durationPermission.needPermission &&
      restTimeAlertPermission.leftMin === 0
    ) {
      return {
        addToCart: {
          disabled: true,
          toast: t('checkDish.permission_noMealTime'),
        },
        submitOrder: {
          disabled: true,
          text: t('checkDish.permission_noMealTime'),
        },
      }
    }
    if (
      !durationPermission.needPermission &&
      restTimeAlertPermission.needPermission
    ) {
      return {
        addToCart: {
          disabled: true,
          toast: t('checkDish.permission_orderRestTimeAlert', {
            val: restTimeAlertPermission.leftMin,
          }),
        },
        submitOrder: {
          disabled: true,
          text: t('ShoppingCart.rest_meal_time', {
            minutes: restTimeAlertPermission.leftMin,
          }),
        },
      }
    }

    if (remainingTime) {
      return {
        submitOrder: {
          disabled: true,
          text: t('ShoppingCart.order_again', {
            value: remainingTime,
          }),
          isOrderAgain: true,
        },
      }
    }

    return {}
  }, [
    t,
    needRestTimeAlertPermission,
    orders,
    remainingTime,
    isNeedCheckDishAuth,
  ])

  const onHandleWrapperClick = (event) => {
    if (permissions.addToCart?.disabled) {
      event.stopPropagation()
      Toast.error(permissions.addToCart.toast)
    }
  }

  const isSubmitDisabled = useMemo(
    () =>
      permissions.submitOrder?.disabled || submitting[(permissions, submitting)]
  )

  const doWrapperSubmit = useCallback(() => {
    if (isSubmitDisabled) {
      if (
        permissions.submitOrder?.disabled &&
        permissions.submitOrder.isOrderAgain &&
        isNeedPasswordAuth
      ) {
        setAdminLogin({
          open: true,
          permission: 'sendOrderTime',
          next: () => {
            setIsNeedCheckDishAuth(false)
          },
        })
      }
    }
  }, [isSubmitDisabled, permissions])

  const cartPermission = useMemo(() => {
    if (durPermPerRoundCart.needPermission) {
      return durPermPerRoundCart
    }
    if (quantityPerm.needPermission) {
      return quantityPerm
    }
    return {
      needPermission: false,
    }
  }, [durPermPerRoundCart, quantityPerm])

  return (
    <Box className={classes.root}>
      {actualCart.length ? (
        <>
          {cartPermission.needPermission && (
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              marginY={2}
              padding={1}
              borderRadius={5}
              bgcolor={alpha(colors.red[500], 0.05)}
            >
              <Typography variant="body2" color="error">
                {cartPermission.maxLimit > 0 &&
                  t('ShoppingCart.exceed_tips_max', {
                    value: cartPermission.maxLimit,
                  })}
                {cartPermission.minLimit > 0 &&
                  t('ShoppingCart.exceed_tips_min', {
                    value: cartPermission.minLimit,
                  })}
              </Typography>
              <Typography variant="subtitle2" color="error">
                {cartPermission.maxLimit > 0 &&
                  `(${cartCount}/${cartPermission.maxLimit})`}
                {cartPermission.minLimit > 0 &&
                  `(${cartCount}/${cartPermission.minLimit})`}
              </Typography>
            </Box>
          )}
          <Box
            className={classes.cartItemList}
            height={`calc(100vh - ${cartPermission.needPermission ? 408 : 346}px)`}
          >
            <div onClickCapture={onHandleWrapperClick}>
              {displayCartItems.map((e) => {
                const num = actualCart.reduce((pre, cur) => {
                  return pre + cur.count
                }, 0)
                const overLimitItem = overLimitDish?.find(
                  (each) => each.id === e.id
                )
                return (
                  <CartItem
                    key={e.key}
                    disabled={
                      num >=
                      (durPermPerRound?.maxCartNum ||
                        quantityPerm?.maxCartNum ||
                        mutexDishPerm?.maxCartNum ||
                        999999)
                    }
                    e={e}
                    isComboCart={e.comboCart?.length > 0}
                    overLimitItem={overLimitItem}
                    handleEditItem={handleEditItem}
                    handleChangeCount={handleChangeCount}
                    isDisabledCounter={
                      defaultDishIds.includes(e.id) || e.isBuffetItem
                    }
                    disableAddOnly={isCrmIntegrationPendingBenefitItem(
                      e,
                      getDisplayCrmIntegrationItemDiscounts(e)
                    )}
                    isDisplayZeroPrice={isDisplayZeroPrice}
                    setDishIntervalList={setDishIntervalList}
                  />
                )
              })}
            </div>
          </Box>
          {editItem && (
            <DishDialog
              data={
                isCrmIntegrationPointItemCartItem(editItem)
                  ? { ...editItem, itemMax: editItem.count }
                  : editItem
              }
              mode="edit"
              open={openDishDialog}
              onSubmit={handleChangeCart}
              onClose={setCloseDishDialog}
              isShowDisplayNote={countIsShowNote(editItem?.id)}
            />
          )}
          <Box
            className={classes.bottomBtns}
            position="absolute"
            left={0}
            right={0}
            bottom={0}
            padding={3}
            paddingTop={0}
            hidden={isDisplayMode || isSubOrder}
          >
            <Divider />
            <Box marginTop={3} marginBottom={2}>
              {displayOrderNote && (
                <AddInstructionsDialog
                  type="cart"
                  content={instructions}
                  onChange={(v) => setInstructions(v)}
                />
              )}
            </Box>
            <Box onClick={doWrapperSubmit}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                className={classes.submitBtn}
                disabled={isSubmitDisabled}
                ref={submitBtnRef}
                onClick={doSubmit}
              >
                {!submitting && permissions.submitOrder?.disabled ? (
                  permissions.submitOrder.text
                ) : (
                  <>
                    {submitting && (
                      <CircularProgress
                        color="#ffffff"
                        size={20}
                        className={classes.submitLoading}
                      />
                    )}
                    {t('ShoppingCart.place_order')}
                    {isDisplayCartOrderPrice &&
                      `・${Number(totalPrice ?? 0)?.toFixed(2)}`}
                    {isDisplayCartOrderPrice && isShowBenefitPrice && (
                      <VipPriceWithImg
                        imgType="white"
                        style={{ margin: '4px 0 0 8px', color: '#fff' }}
                        benefitPrice={`$${totalBenefitPrice?.toFixed(2)}`}
                      />
                    )}
                  </>
                )}
              </Button>
            </Box>
          </Box>
        </>
      ) : (
        <EmptyCart />
      )}
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <AdminLogin
          isOpen={adminLogin.open}
          handleClose={closeAdminLogin}
          permission={adminLogin.permission}
          next={adminLogin.next}
        />
        <FeedbackToast
          open={openFeedback}
          loading={submitting}
          error={error}
          data={data || checkData}
          onClose={handleCloseFeedBack}
        />
      </Suspense>
    </Box>
  )
}

export default PendingOrders
