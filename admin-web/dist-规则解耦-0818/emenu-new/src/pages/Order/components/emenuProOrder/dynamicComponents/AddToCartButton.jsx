import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Badge, makeStyles } from '@material-ui/core'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { serverUrl } from '@/utils/env_var'
import DishDialog from '@/components/DishDialog'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useGlobalState } from '@/hooks/useGlobalState'
import { isEqual } from 'lodash-es'
import { nanoid } from '@reduxjs/toolkit'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useBoolean, useDebounceFn, useSafeState } from 'ahooks'
import useCheckOrderBenefit from '@/hooks/useCheckOrderBenefit'
import { ButtonBase } from '@material-ui/core'
import useGetDishMax from '@/hooks/useGetDishMax'
import useCheckDishBeforeOrder from '@/hooks/useCheckDishBeforeOrder'
import Toast from '@/components/Toast'
import { getI18n } from 'react-i18next'
import { getStorageValue } from '@/utils/storage'
import {
  getCrmIntegrationPointBenefitCartItems,
  getCrmIntegrationPointBenefitSubmittedItems,
  getCrmIntegrationPointItemCount,
  isCrmIntegrationRedemptionItemCartItem,
} from '@/utils/crmIntegrationCartValidation'
import {
  resolveCrmIntegrationPointItemEntryAction,
  runCrmIntegrationPointItemPendingChange,
  shouldGrayCrmIntegrationPointItemAddButton,
  shouldSetCrmIntegrationPointItemPending,
} from '@/utils/crmIntegrationRewards'

const useStyles = makeStyles(() => ({
  btnIcon: {
    width: '100%',
    height: '100%',
  },
  btnIconDisabled: {
    filter: 'grayscale(100%) brightness(0.6)',
  },
}))

const getT = () => {
  const i18n = getI18n()
  return i18n.t.bind(i18n)
}

const AddToCartButtonComponent = ({
  config,
  saleItem,
  onCrmIntegrationPointItemChange,
  onCrmIntegrationPointItemBeforeAdd,
  crmIntegrationPointItemGlobalLocked,
}) => {
  const { style, props } = config

  const classes = useStyles()
  const themeStyles = useEmenuProThemeAdapter(style)
  const [crmIntegrationPointItemPending, setCrmIntegrationPointItemPending] =
    useSafeState(false)

  const { getFinalConfigById } = useSystemConfig()
  const isOpenSpecialDishPermission = getFinalConfigById(36)?.open //有没有开启可看不可见的配置参数
  const isSpecialDishServePermission = getFinalConfigById(49)?.open //有没有开启弹出服务员权限谈款
  const displayDishNoteConfig = getFinalConfigById(28)
  const isNeedPasswordAuth = getFinalConfigById(54)?.open
  const restrictRedeemItemConfig = getFinalConfigById(33)
  const isDisplayMode = getFinalConfigById(10)?.open
  const displayDishDetailsConfig = getFinalConfigById(27)
  const isSpecialPermission = getFinalConfigById(1)
  const isBrandOpen = getFinalConfigById(13)?.open
  const isMenuClassifyOpen = getFinalConfigById(52)?.open

  const [storagedCart, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const [cart, setCart] = useGlobalState('Cart')
  const [, setCurrentBuffetInfo] = useGlobalState('currentBuffetInfo', [])
  const [memberInfo] = useGlobalState('memberInfo')
  const memberInfoRef = useRef(memberInfo)
  memberInfoRef.current = memberInfo
  // 初始化加载Storage保存的购物车数据
  useEffect(() => {
    if (storagedCart.length) {
      const isCRMLogin = Object.keys(memberInfoRef.current || {}).length > 0
      const needClearRedeemItem = !isCRMLogin
      const currentCart = needClearRedeemItem
        ? storagedCart.filter(
            (each) =>
              !each.rewardRule && !isCrmIntegrationRedemptionItemCartItem(each)
          )
        : storagedCart
      if (!isEqual(currentCart, storagedCart)) {
        setStoragedCart(currentCart)
      }
      setCart((prev) => (isEqual(prev, currentCart) ? prev : currentCart))
      const currentBuffetInfo = currentCart.filter((each) => each.isBuffetItem)
      if (currentBuffetInfo.length) {
        setCurrentBuffetInfo((prev) =>
          isEqual(prev, currentBuffetInfo) ? prev : currentBuffetInfo
        )
      }
    }
  }, [setCart, storagedCart, setCurrentBuffetInfo])

  const [, setOrderAdminPermission] = useGlobalState('orderAdminPermission')
  const [, setAddToCartQueue] = useGlobalState('addToCartQueue')
  const [, setLoginOpen] = useGlobalState('open')
  const [orders] = useGlobalState('Orders')
  const [isNeedCheckDishAuth, setIsNeedCheckDishAuth] = useGlobalState(
    'isNeedCheckDishAuth'
  )

  const {
    needQuantityPermission,
    needOrderIntervalPermission,
    needDishOrderIntervalPermission,
    needTimesPermission,
    needOrderDishPermission,
    needOrderDishSetPermission,
    needOrderDishEveryonePermission,
    needOrderDishOncePermission,
    needDurationPermission,
    needDishSetPermission,
    needRestTimeAlertPermission,
    needDishLimitPerRoundPermission,
    needMutexDishPermission,
  } = useCheckDishBeforeOrder()

  const imgUrl = useMemo(() => {
    const imgUrl = props.imgUrl
    if (imgUrl) return serverUrl + imgUrl
    const defaultImg = props.defaultImg
    if (defaultImg) {
      const defaultImgArray = defaultImg.split('/')
      const imageName = defaultImgArray[defaultImgArray.length - 1]
      return `${serverUrl}emenuPro/images/${imageName}`
    }
    return undefined
  }, [props.imgUrl, props.defaultImg])

  const [disableBtn, setDisableBtn] = useState(false)
  const setDisable = (params) => {
    setDisableBtn(params)
  }

  const isShowDisplayNote = useMemo(() => {
    const isOpen = displayDishNoteConfig?.open
    if (!isOpen) return false
    const openList = displayDishNoteConfig?.displayDishNote
    return openList.includes(saleItem.id)
  }, [displayDishNoteConfig, saleItem.id])

  const [
    dishDialogVisible,
    { setTrue: openDishDialog, setFalse: closeDishDialog },
  ] = useBoolean()

  const showPermissionModal = (next) => {
    setOrderAdminPermission({
      open: true,
      permission: 'errorMsg',
      next,
    })
  }

  const rewardRule = useMemo(() => {
    return saleItem.rewardRule
  }, [saleItem.rewardRule])

  // 是否需要权限兑换菜品
  const isNeedPermissionToRedeem = useMemo(() => {
    if (!restrictRedeemItemConfig?.open || !rewardRule) return false
    const configDishIds = restrictRedeemItemConfig.restrictRedeemItem
    return configDishIds.includes(saleItem.id)
  }, [restrictRedeemItemConfig, saleItem.id, rewardRule])

  const addButtonRef = useRef(null)

  const { run } = useDebounceFn(
    (newCart) => {
      setStoragedCart(newCart)
    },
    {
      wait: 300,
    }
  )

  const handleChangeCart = (data) => {
    const newCart = [...cart]
    let idx = newCart?.findIndex((e) => {
      return (
        e.id === data.id &&
        !e.crmIntegrationPointItemKey &&
        isEqual(e.priceItem, data.priceItem) &&
        isEqual(e.options, data.options) &&
        e.instructions === data.instructions
      )
    })
    let dishKey = undefined
    if (idx > -1) {
      const { count, ...rest } = newCart[idx]
      dishKey = newCart[idx].key
      newCart[idx] = {
        ...rest,
        count: count + data.count,
      }
    } else {
      dishKey = nanoid()
      newCart.push({
        key: dishKey,
        ...saleItem,
        ...data,
      })
    }
    if (data.count > 0) {
      const addButtonRect = addButtonRef.current?.getBoundingClientRect?.()
      if (addButtonRect) {
        setAddToCartQueue((prev) => [
          ...prev,
          { key: nanoid(), count: data.count, addButtonRect, dishKey },
        ])
      }
    }
    setCart(newCart)
    run(newCart)
  }

  const { isCartRedeem, isOrderRedeem } = useCheckOrderBenefit()
  // crm 是否登陆
  const isCRMLogin = useMemo(() => {
    return Object.keys(memberInfo).length > 0
  }, [memberInfo])

  // 积分是否满足兑换
  const isPointEnough = useMemo(() => {
    if (!memberInfo || !rewardRule) return false
    return memberInfo.pointBalance >= rewardRule.redeemRule.parameters.points
  }, [memberInfo, rewardRule])

  // 是否不能选redeem
  const isDisableRedeem = useMemo(() => {
    if (!rewardRule) return false
    // 未登录, 积分不足, 购物车/订单 已选, 不能选择
    return !!(!isCRMLogin || !isPointEnough || isCartRedeem || isOrderRedeem)
  }, [rewardRule, isCRMLogin, isPointEnough, isCartRedeem, isOrderRedeem])

  const smallItems = useMemo(() => {
    if (saleItem.crmIntegrationPointItem) {
      return cart?.filter(
        (item) =>
          !item.large &&
          item.crmIntegrationPointItemKey ===
            saleItem.crmIntegrationPointItemKey
      )
    }
    let items = cart?.filter((e) => {
      const isSameId = !e.large && e.id === saleItem.id
      if (rewardRule) {
        return isSameId && e.rewardRule
      }
      return isSameId && !e.rewardRule && !e.crmIntegrationPointItemKey
    })
    return items
  }, [
    cart,
    saleItem.crmIntegrationPointItem,
    saleItem.crmIntegrationPointItemKey,
    saleItem.id,
    rewardRule,
  ])

  const crmIntegrationPointItemCount = useMemo(
    () =>
      saleItem.crmIntegrationPointItem
        ? getCrmIntegrationPointItemCount(
            cart,
            saleItem.crmIntegrationPointItemKey
          )
        : 0,
    [
      cart,
      saleItem.crmIntegrationPointItem,
      saleItem.crmIntegrationPointItemKey,
    ]
  )

  const smallCount = useMemo(
    () =>
      saleItem.crmIntegrationPointItem
        ? crmIntegrationPointItemCount
        : smallItems?.reduce((acc, cur) => acc + cur.count, 0) || 0,
    [crmIntegrationPointItemCount, saleItem.crmIntegrationPointItem, smallItems]
  )

  const largeCount = useMemo(
    () =>
      saleItem.crmIntegrationPointItem
        ? crmIntegrationPointItemCount
        : cart
            .filter(
              (e) =>
                e.large && e.id === saleItem.id && !e.crmIntegrationPointItemKey
            )
            .reduce((acc, cur) => acc + cur.count, 0),
    [
      cart,
      crmIntegrationPointItemCount,
      saleItem.crmIntegrationPointItem,
      saleItem.id,
    ]
  )

  // count={props.large ? largeCount : smallCount}
  const count = useMemo(
    () => (saleItem.large ? largeCount : smallCount),
    [saleItem.large, largeCount, smallCount]
  )

  const dishMax = useGetDishMax(saleItem.id)
  const submittedItems = useMemo(
    () =>
      (Array.isArray(orders) ? orders : []).flatMap((order) =>
        Array.isArray(order?.cart) ? order.cart : []
      ),
    [orders]
  )
  const pendingBenefitItems = useMemo(
    () =>
      saleItem.crmIntegrationPointItem
        ? getCrmIntegrationPointBenefitCartItems(
            cart,
            saleItem.crmIntegrationBenefit
          )
        : [],
    [cart, saleItem.crmIntegrationBenefit, saleItem.crmIntegrationPointItem]
  )
  const submittedBenefitItems = useMemo(
    () =>
      saleItem.crmIntegrationPointItem
        ? getCrmIntegrationPointBenefitSubmittedItems(
            submittedItems,
            saleItem.crmIntegrationBenefit
          )
        : [],
    [
      saleItem.crmIntegrationBenefit,
      saleItem.crmIntegrationPointItem,
      submittedItems,
    ]
  )
  const selectedTotal = useMemo(
    () =>
      [...pendingBenefitItems, ...submittedBenefitItems].reduce(
        (total, item) => total + Number(item?.count || 0),
        0
      ),
    [pendingBenefitItems, submittedBenefitItems]
  )
  const remainingSelectable = Number.isFinite(
    saleItem.crmIntegrationMaxSelectable
  )
    ? Math.max(saleItem.crmIntegrationMaxSelectable - selectedTotal, 0)
    : Infinity
  const currentPointItemCount = saleItem.large ? largeCount : smallCount
  const itemMax = useMemo(() => {
    if (saleItem.crmIntegrationPointItem) {
      return Number.isFinite(remainingSelectable)
        ? currentPointItemCount + remainingSelectable
        : 99
    }
    return rewardRule ? 1 : dishMax
  }, [
    currentPointItemCount,
    dishMax,
    remainingSelectable,
    rewardRule,
    saleItem.crmIntegrationPointItem,
  ])

  const orderId = useMemo(() => orders?.[0]?.id, [orders])
  const orderNums = useMemo(() => orders?.[0]?.numOfGuests, [orders])
  const currentPartySize = useMemo(() => {
    if (!orderId) return getStorageValue('emenu_partySize')
    return orderNums
  }, [orderId, orderNums])

  const countMax = useMemo(() => {
    const DishPerm = needOrderDishPermission(cart, saleItem.id, orders)
    const orderDishSetPerm = needOrderDishSetPermission(
      cart,
      saleItem.id,
      orders
    )
    const onePerm = needOrderDishEveryonePermission(cart, saleItem.id, orders)
    const dishSetPerm = needDishSetPermission(cart, saleItem.id, orders)
    const mutexDishPerm = needMutexDishPermission(cart, saleItem.id)
    const num = Math.min(
      itemMax,
      orderDishSetPerm?.maxCartNum ?? 99,
      dishSetPerm?.maxCartNum ?? 99,
      onePerm?.maxCartNum ?? 99,
      DishPerm?.maxCartNum ?? 99,
      mutexDishPerm?.maxCartNum ?? 99
    )
    return num
  }, [
    itemMax,
    orders,
    cart,
    currentPartySize,
    saleItem.id,
    needMutexDishPermission,
  ])

  const isDisplayDishDetails = useMemo(
    () =>
      displayDishDetailsConfig?.open &&
      displayDishDetailsConfig.showDishDetail?.includes(saleItem.id),
    [displayDishDetailsConfig, saleItem.id]
  )

  const isShowDetail = useMemo(() => {
    return saleItem.large || isDisplayDishDetails || isShowDisplayNote
  }, [saleItem.large, isDisplayDishDetails, isShowDisplayNote])

  const soldOut = useMemo(() => saleItem.outOfStock, [saleItem.outOfStock])

  const isSpecial = useMemo(() => {
    if (isBrandOpen || isMenuClassifyOpen) return false
    if (
      Array.isArray(isSpecialPermission) &&
      isSpecialPermission.length > 0 &&
      isSpecialPermission.indexOf(saleItem.id) > -1
    ) {
      return true
    }
    return false
  }, [isSpecialPermission, saleItem.id, isBrandOpen, isMenuClassifyOpen])

  const checkDish = useCallback(
    ({ cart, id, orders }) => {
      const t = getT()
      const dishOrderIntervalPermission = needDishOrderIntervalPermission(
        id,
        orders
      )
      if (dishOrderIntervalPermission.needPermission) {
        if (dishOrderIntervalPermission.isDishCollection) {
          return {
            text: 'checkDish.permission_dishCollectionOrderInterval',
            val: t('checkDish.permission_dishCollectionOrderInterval_time', {
              minutes: Math.floor(dishOrderIntervalPermission.leftMin / 60),
              seconds: Math.floor(dishOrderIntervalPermission.leftMin % 60),
            }),
          }
        } else {
          return {
            text: 'checkDish.permission_dishOrderInterval',
            val: t('checkDish.permission_dishOrderInterval_time', {
              minutes: Math.floor(dishOrderIntervalPermission.leftMin / 60),
              seconds: Math.floor(dishOrderIntervalPermission.leftMin % 60),
            }),
          }
        }
      }

      const dishLimitPerRoundPermission = needDishLimitPerRoundPermission(
        cart,
        id
      )
      if (dishLimitPerRoundPermission.needPermission) {
        if (dishLimitPerRoundPermission.isDishLimit) {
          if (dishLimitPerRoundPermission.isDishCollection) {
            if (dishLimitPerRoundPermission.isDishType) {
              return {
                text: 'checkDish.permission_dishSetLimitPerRoundType',
                val: dishLimitPerRoundPermission.limitNum,
              }
            } else if (dishLimitPerRoundPermission.isDishPieceSame) {
              return {
                text: 'checkDish.permission_dishSetLimitPerRoundPieceSame',
                val: dishLimitPerRoundPermission.limitNum,
              }
            } else {
              return {
                text: 'checkDish.permission_dishSetLimitPerRound',
                val: dishLimitPerRoundPermission.limitNum,
              }
            }
          } else {
            return {
              text: 'checkDish.permission_singleDishLimit',
              val: dishLimitPerRoundPermission.limitNum,
            }
          }
        } else {
          return {
            text: 'checkDish.permission_orderQuantity',
            val: dishLimitPerRoundPermission.maxLimit,
          }
        }
      }

      const mutexDishPermission = needMutexDishPermission(cart, id)
      if (mutexDishPermission.needPermission) {
        return {
          text: 'checkDish.permission_mutexDish',
          dishA: t(mutexDishPermission.mutexId, { ns: 'dish' }),
          dishB: t(id, { ns: 'dish' }),
        }
      }

      const quantityPermission = needQuantityPermission(cart, id)
      if (quantityPermission.needPermission) {
        return {
          text: 'checkDish.permission_orderQuantity',
          val: quantityPermission.maxLimit,
        }
      }
      const intervalPermission = needOrderIntervalPermission(orders)
      if (intervalPermission.needPermission) {
        return {
          text: 'checkDish.permission_orderInterval',
          val: t('checkDish.permission_orderInterval_time', {
            minutes: Math.floor(intervalPermission.leftMin / 60),
            seconds: Math.floor(intervalPermission.leftMin % 60),
          }),
        }
      }
      const timesPermission = needTimesPermission(orders)
      if (timesPermission.needPermission) {
        return {
          text: 'checkDish.permission_orderTimes',
          val: timesPermission.maxTimes,
        }
      }
      const orderDishPermission = needOrderDishPermission(cart, id, orders)
      if (orderDishPermission.needPermission) {
        return {
          text: 'checkDish.permission_singleDishLimit',
          val: orderDishPermission.limitNum,
        }
      }
      const orderDishSetPermission = needOrderDishSetPermission(
        cart,
        id,
        orders
      )
      if (orderDishSetPermission.needPermission) {
        return {
          text: 'checkDish.permission_dishSetLimit',
          val: orderDishSetPermission.limitNum,
        }
      }
      const dishSetPermission = needDishSetPermission(cart, id, orders)
      if (dishSetPermission.needPermission) {
        return {
          text: 'checkDish.permission_dishSetLimit',
          val: dishSetPermission.limitNum,
        }
      }

      const orderDishEveryonePermission = needOrderDishEveryonePermission(
        cart,
        id,
        orders
      )
      if (orderDishEveryonePermission.needPermission) {
        return {
          text: 'checkDish.permission_singleDishLimit',
          val: orderDishEveryonePermission.limitNum,
        }
      }
      const orderDishOncePermission = needOrderDishOncePermission(cart, id)
      if (orderDishOncePermission.needPermission) {
        return {
          text: 'checkDish.permission_singleDishLimit',
          val: orderDishOncePermission.limitNum,
        }
      }
      const durationPermission = needDurationPermission(orders)
      if (durationPermission.needPermission) {
        return {
          text: 'checkDish.permission_orderDuration',
          val: durationPermission.durationMin,
        }
      }
      const restTimeAlertPermission = needRestTimeAlertPermission(orders)
      if (restTimeAlertPermission.needPermission) {
        return {
          text: 'checkDish.permission_orderRestTimeAlert',
          val: restTimeAlertPermission.leftMin,
        }
      }

      return null
    },
    [
      needQuantityPermission,
      needOrderIntervalPermission,
      needDishOrderIntervalPermission,
      needTimesPermission,
      needOrderDishPermission,
      needOrderDishSetPermission,
      needOrderDishEveryonePermission,
      needOrderDishOncePermission,
      needDurationPermission,
      needDishLimitPerRoundPermission,
      needMutexDishPermission,
    ]
  )

  const checkDishStatus = useCallback(() => {
    if (!isNeedCheckDishAuth) return true
    const checkDishRes = checkDish({ cart, id: saleItem.id, orders })
    if (!checkDishRes) return true
    const { text, ...val } = checkDishRes
    const type = text.split('_')[1]
    const typeMap = {
      orderQuantity: 'quantity', // 购物车中菜品数量
      orderInterval: 'sendOrderTime', // 订单下单间隔
      dishOrderInterval: 'sendDishOrderTime', // 菜品下单间隔
      dishCollectionOrderInterval: 'sendDishCollectionOrderTime', // 菜品集下单间隔
      orderTimes: 'times', // 下单次数
      singleDishLimit: 'dishLimit', // 单个菜品
      orderDuration: 'duration', // 用餐时长
      dishSetLimit: 'dishSetLimit', // 订单菜品集
      dishSetLimitPerRound: 'dishSetLimitPerRound', // 每轮购物车菜品集
      dishSetLimitPerRoundType: 'dishSetLimitPerRoundType', // 每轮购物车菜品集种类
      dishSetLimitPerRoundPieceSame: 'dishSetLimitPerRoundPieceSame', // 每轮购物车菜品集相同菜品
      orderRestTimeAlert: 'restTimeAlert', // 剩余时长
      mutexDish: 'mutexDish', // 互斥菜品
    }
    const t = getT()
    Toast.error(t(text, val))
    if (!isNeedPasswordAuth) return false
    if (typeMap[type] === typeMap.orderRestTimeAlert) {
      return false
    }
    setOrderAdminPermission({
      open: true,
      permission: typeMap[type],
      next: () => {
        onAddToCart(undefined, false)
        setIsNeedCheckDishAuth(false)
      },
    })
    return false
  }, [
    checkDish,
    cart,
    saleItem.id,
    orders,
    setOrderAdminPermission,
    isNeedCheckDishAuth,
    isNeedPasswordAuth,
  ])

  const handleShowRedeemStatus = () => {
    // 非积分兑换菜不展示信息
    if (!rewardRule) return
    const t = getT()
    if (!isCRMLogin) {
      Toast.info(t('crm.loginFirst'))
      setLoginOpen(true)
      return
    }
    const isHasRedeemItem = isCartRedeem || isOrderRedeem
    if (isHasRedeemItem) return Toast.info(t('crm.upperLimit'))
    if (!isPointEnough) return Toast.info(t('crm.noEnoughPoint'))
  }

  const handleChangeCount = (value) => {
    const newCart = [...cart]
    let idx = newCart?.findIndex((e) => {
      const isSameId = e.id === saleItem.id
      if (rewardRule) {
        return isSameId && e.rewardRule
      }
      return isSameId && !e.rewardRule && !e.crmIntegrationPointItemKey
    })
    let originalCount = 0
    let dishKey = undefined
    if (idx > -1) {
      if (value > 0) {
        originalCount = newCart[idx].count
        dishKey = newCart[idx].key
        newCart[idx] = {
          ...newCart[idx],
          count: value,
        }
      } else {
        newCart.splice(idx, 1)
      }
    } else {
      if (value > 0) {
        dishKey = nanoid()
        newCart.push({
          ...saleItem,
          key: dishKey,
          count: value,
          realBenefitPrice: saleItem.benefitPrice,
        })
      }
    }
    const count = value - originalCount

    if (count > 0) {
      const addButtonRect = addButtonRef.current?.getBoundingClientRect?.()
      if (addButtonRect) {
        setAddToCartQueue((prev) => [
          ...prev,
          { key: nanoid(), count, addButtonRect, dishKey },
        ])
      }
    }
    setCart(newCart)
    run(newCart)
  }

  const handleChangeCrmIntegrationPointItem = ({
    count,
    detailData,
    isDetailSubmit = false,
  }) => {
    const shouldSetPending = shouldSetCrmIntegrationPointItemPending({
      currentCount: currentPointItemCount,
      nextCount: count,
      isDetailSubmit,
    })
    return runCrmIntegrationPointItemPendingChange({
      shouldSetPending,
      onPendingChange: setCrmIntegrationPointItemPending,
      onChange: () =>
        onCrmIntegrationPointItemChange?.({
          benefit: saleItem.crmIntegrationBenefit,
          item: saleItem,
          count,
          detailData,
          entryValidated: shouldSetPending,
        }),
    })
  }

  const onAddToCart = (_, isNeedCheckDishStatus = true) => {
    if (saleItem.crmIntegrationPointItem) {
      const isHardBlocked =
        soldOut || isDisplayMode || crmIntegrationPointItemPending
      const precheckPassed =
        !isHardBlocked &&
        onCrmIntegrationPointItemBeforeAdd?.({
          benefit: saleItem.crmIntegrationBenefit,
          item: saleItem,
        }) === true
      const crmIntegrationPointItemAction =
        resolveCrmIntegrationPointItemEntryAction({
          crmIntegrationPointItem: true,
          outOfStock: soldOut,
          displayMode: isDisplayMode,
          pending: crmIntegrationPointItemPending,
          disabled: saleItem.crmIntegrationPointItemDisabled,
          isShowDetail,
          count,
          itemMax: countMax,
          precheckPassed,
        })

      if (crmIntegrationPointItemAction === 'detail') {
        setDisable(
          (saleItem.buffetViewOnly || isSpecial) &&
            !isOpenSpecialDishPermission &&
            !isSpecialDishServePermission
        )
        openDishDialog()
        return
      }
      if (crmIntegrationPointItemAction === 'increment') {
        handleChangeCrmIntegrationPointItem({ count: count + 1 })
      }
      return
    }

    if (rewardRule) {
      handleShowRedeemStatus()
      if (isDisableRedeem) return
      if (
        (!isShowDetail && isNeedPermissionToRedeem) ||
        (isSpecial && isOpenSpecialDishPermission)
      ) {
        showPermissionModal(() => handleChangeCount(count + 1))
        return
      }
    }
    if (isNeedCheckDishStatus) {
      if (!checkDishStatus()) return
    }
    if (isShowDetail) {
      setDisable(
        (saleItem.buffetViewOnly || isSpecial) &&
          !isOpenSpecialDishPermission &&
          !isSpecialDishServePermission
      )
      openDishDialog()
      return
    }
    if (isSpecial || saleItem.buffetViewOnly) {
      if (isOpenSpecialDishPermission) {
        handleChangeCount(count + 1)
      } else if (isSpecialDishServePermission) {
        showPermissionModal(() => handleChangeCount(count + 1))
      }
    } else {
      handleChangeCount(count + 1)
    }
  }

  const buttonDisabled = useMemo(() => {
    if (saleItem.crmIntegrationPointItem) return false
    return (
      count >= countMax ||
      ((saleItem.buffetViewOnly || isSpecial) &&
        !isOpenSpecialDishPermission &&
        !isSpecialDishServePermission)
    )
  }, [
    count,
    countMax,
    saleItem.buffetViewOnly,
    isSpecial,
    isOpenSpecialDishPermission,
    isSpecialDishServePermission,
    saleItem.crmIntegrationPointItem,
  ])

  const buttonIconDisabled = useMemo(() => {
    if (saleItem.crmIntegrationPointItem) {
      return (
        crmIntegrationPointItemPending ||
        count >= countMax ||
        saleItem.crmIntegrationPointItemDisabled ||
        shouldGrayCrmIntegrationPointItemAddButton({
          crmIntegrationPointItem: true,
          isLoggedIn: isCRMLogin,
          crmIntegrationPointItemGlobalLocked,
        })
      )
    }
    return isDisableRedeem
  }, [
    crmIntegrationPointItemGlobalLocked,
    crmIntegrationPointItemPending,
    count,
    countMax,
    isCRMLogin,
    isDisableRedeem,
    saleItem.crmIntegrationPointItem,
    saleItem.crmIntegrationPointItemDisabled,
  ])

  const badgeContent = useMemo(() => {
    if (isDisableRedeem) return 0
    return count
  }, [count, isDisableRedeem])

  if (isDisplayMode || soldOut || saleItem.marketPriceItem) {
    return null
  }

  return (
    <>
      <ButtonBase
        style={{ ...themeStyles, position: 'absolute' }}
        onClick={onAddToCart}
        disabled={buttonDisabled}
        ref={addButtonRef}
      >
        <Badge
          badgeContent={badgeContent}
          color="primary"
          overlap="circular"
          classes={{
            root: classes.btnIcon,
          }}
        >
          <img
            src={imgUrl}
            className={`${classes.btnIcon} ${buttonDisabled || buttonIconDisabled ? classes.btnIconDisabled : ''}`}
          />
        </Badge>
      </ButtonBase>
      <DishDialog
        data={{
          id: saleItem.id,
          name: saleItem.name,
          desc: saleItem.desc,
          disableBtn,
          price: saleItem.price,
          itemPrices: saleItem.itemPrices,
          taxIds: saleItem.taxIds,
          pic: saleItem.pic,
          comboType: saleItem.comboType,
          optionList: saleItem.optionList,
          buffetViewOnly: saleItem.buffetViewOnly,
          benefitPrice: saleItem.benefitPrice,
          itemMax: countMax,
          isSpecial,
          isOpenSpecialDishPermission,
          isSpecialDishServePermission,
        }}
        open={dishDialogVisible}
        showPermissionModal={showPermissionModal}
        onSubmit={(data) => {
          if (saleItem.crmIntegrationPointItem) {
            handleChangeCrmIntegrationPointItem({
              detailData: data,
              isDetailSubmit: true,
            })
            return
          }
          // 有详情，需要权限的兑换菜
          if (rewardRule && isNeedPermissionToRedeem) {
            showPermissionModal(() => handleChangeCart(data))
            return
          }
          handleChangeCart(data)
        }}
        onClose={closeDishDialog}
        isShowDisplayNote={isShowDisplayNote}
        isNeedPasswordAuth={isNeedPasswordAuth}
        hidePrice={!!rewardRule || !!saleItem.crmIntegrationHideDetailPrice}
      />
    </>
  )
}

const AddToCartButton = ({
  config,
  saleItemMap,
  saleItemsWithCrmMap,
  crmIntegrationPointItemMap,
  isMembershipPointRedeemPage,
  onCrmIntegrationPointItemChange,
  onCrmIntegrationPointItemBeforeAdd,
  crmIntegrationPointItemGlobalLocked,
}) => {
  const saleItem = useMemo(() => {
    const saleItemId = Number(config.props.itemId)
    const crmIntegrationPointItem = isMembershipPointRedeemPage
      ? crmIntegrationPointItemMap.get(saleItemId)
      : null
    if (isMembershipPointRedeemPage) return crmIntegrationPointItem
    const saleItem = saleItemMap.get(saleItemId)
    const saleItemWithCrm = saleItemsWithCrmMap.get(saleItemId)
    return saleItemWithCrm || saleItem
  }, [
    config.props.itemId,
    crmIntegrationPointItemMap,
    isMembershipPointRedeemPage,
    saleItemMap,
    saleItemsWithCrmMap,
  ])

  if (!saleItem) return null
  return (
    <AddToCartButtonComponent
      config={config}
      saleItem={saleItem}
      onCrmIntegrationPointItemChange={onCrmIntegrationPointItemChange}
      onCrmIntegrationPointItemBeforeAdd={onCrmIntegrationPointItemBeforeAdd}
      crmIntegrationPointItemGlobalLocked={crmIntegrationPointItemGlobalLocked}
    />
  )
}

export default React.memo(AddToCartButton)
