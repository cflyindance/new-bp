import useSystemConfig from '@/hooks/useSystemConfig'
import dayjs from 'dayjs'
import { cloneDeep } from 'lodash-es'
import { getStorageValue } from '@/utils/storage'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useCallback, useMemo } from 'react'
import { useLocalStorageState } from 'bhooks'
import {
  perTypes,
  specificDishTypes,
  specificDishUnits,
} from '@/constants/limitConfig'

const useCheckDishBeforeOrder = () => {
  const { getFinalConfigById } = useSystemConfig()
  /* 3，44，9999 四个订单维度优先级较高，用于直接disable加减菜品功能 */
  const dishQuantityLimit = getFinalConfigById(3) // 订单下单数量限制
  const dishSetQuantityLimit = getFinalConfigById(81) // 订单下单数量限制(指定菜品集每个订单)
  const dishQuantityLimitEveryone = getFinalConfigById(44) // 每位食客每单指定菜品数量限制
  const dishSetConfig = getFinalConfigById(9999) // 每位食客订单菜品集
  const quantityConfig = getFinalConfigById(7) // 每位食客每轮下单菜品数量限制
  const intervalMinutesConfig = getFinalConfigById(12) // 下单时间 间隔设置
  const dishIntervalMinutesConfig = getFinalConfigById(72) // 菜品下单时间间隔设置
  const timesConfig = getFinalConfigById(6) // 下单次数设置
  const dishQuantityLimitOnce = getFinalConfigById(46) // 每位食客每轮下单指定菜品菜品数量限制
  const durationConfig = getFinalConfigById(5) // 用餐时长限制
  const isNeedSelectGuest = getFinalConfigById(11)?.open
  const restTimeAlertConfig = getFinalConfigById(14) // 用餐剩余时间提示
  const dishQuantityPerRoundConfig = getFinalConfigById(57) // 每轮下单菜品数量限制
  const mutexDishConfig = getFinalConfigById(76) // 菜品互斥
  const combinationDishConfig = getFinalConfigById(77) // 菜品组合
  const isChildNotCountAsGuest = getFinalConfigById(59)?.open
  const [notCountAsGuestNumber] = useGlobalState('notCountAsGuestNumber')
  const [savedPermission] = useLocalStorageState('emenu_permission', {
    defaultValue: {},
    listenStorageChange: true,
  })
  const [isNeedCheckDishAuth] = useGlobalState('isNeedCheckDishAuth')

  const actualNotCountNum = useMemo(() => {
    return isChildNotCountAsGuest ? (notCountAsGuestNumber ?? 0) : 0
  }, [isChildNotCountAsGuest, notCountAsGuestNumber])

  // 是否有菜品数量限制 id:7
  const needQuantityPermission = (cart, id) => {
    if (dishQuantityPerRoundConfig?.open) {
      return {
        needPermission: false,
      }
    }
    const partySize =
      (isNeedSelectGuest ? getStorageValue('emenu_partySize', 1) : 1) -
      actualNotCountNum
    const actualCart = cart?.filter((each) => !each.isBuffetItem)
    if (!actualCart?.length) {
      return { needPermission: false }
    }
    let maxLimit = 0
    if (quantityConfig?.open && (quantityConfig?.quantity || 0) > 0) {
      maxLimit = quantityConfig?.quantity * (isNeedSelectGuest ? partySize : 1)
    } else {
      maxLimit = -1
    }
    const { cartCount, currentDishCount } = actualCart.reduce(
      (prev, curr) => {
        if (id && curr.id === id) {
          prev.currentDishCount = prev.currentDishCount + curr.count
        }
        prev.cartCount = prev.cartCount + curr.count
        return prev
      },
      { cartCount: 0, currentDishCount: 0 }
    )

    if (id) {
      return {
        needPermission: maxLimit > 0 && cartCount >= maxLimit,
        maxLimit,
        maxCartNum:
          maxLimit > 0
            ? Math.max(maxLimit - cartCount + currentDishCount, 0)
            : undefined,
      }
    } else {
      return {
        needPermission: maxLimit > 0 && cartCount > maxLimit,
        maxLimit,
        maxCartNum: maxLimit > 0 ? maxLimit : undefined,
      }
    }
  }

  // 订单下单时间间隔
  const needOrderIntervalPermission = (orders) => {
    const orderId = orders?.[0]?.id
    const sendOrderTime =
      getStorageValue('emenu_permission')?.[orderId]?.sendOrderTime
    if (
      !orderId ||
      !intervalMinutesConfig?.open ||
      !intervalMinutesConfig?.intervalMinutes ||
      !sendOrderTime
    )
      return { needPermission: false }
    const timeDiff = dayjs(dayjs()).diff(sendOrderTime, 'seconds')
    const leftMin = intervalMinutesConfig?.intervalMinutes * 60 - timeDiff
    // leftMin = Math.floor(leftMin/60)+''+Math.floor(leftMin%60)
    return {
      needPermission: intervalMinutesConfig?.allowAddToCart
        ? false
        : timeDiff < intervalMinutesConfig?.intervalMinutes * 60,
      leftMin,
    }
  }

  // 菜品下单时间间隔
  const needDishOrderIntervalPermission = useCallback(
    (id, orders) => {
      if (!dishIntervalMinutesConfig?.open || !isNeedCheckDishAuth) {
        return { needPermission: false }
      }

      const dishIntervalMinutes =
        dishIntervalMinutesConfig?.dishIntervalMinutes || []
      const dishIntervalMinutesItem = dishIntervalMinutes.find((item) =>
        item.dishes?.includes(id)
      )
      if (!dishIntervalMinutesItem) {
        return { needPermission: false }
      }

      const orderId = orders?.[0]?.id
      const sendDishOrderTime = savedPermission[orderId]?.sendDishOrderTime
      if (!sendDishOrderTime) {
        return { needPermission: false }
      }

      const currentOrderDishLatestTime = sendDishOrderTime.reduce(
        (pre, cur) => {
          if (
            dishIntervalMinutesItem.specificDishType ===
            specificDishTypes.specificDishCollection
          ) {
            if (!dishIntervalMinutesItem.dishes?.includes(cur.id)) return pre
          } else {
            if (!(cur.id === id)) return pre
          }
          const createTime = dayjs(cur.createdOn)
          if (!pre) return createTime
          return createTime.isAfter(pre) ? createTime : pre
        },
        null
      )
      if (!currentOrderDishLatestTime) {
        return { needPermission: false }
      }

      const timeDiff = dayjs().diff(currentOrderDishLatestTime, 'seconds')
      const leftMin = dishIntervalMinutesItem.minutes * 60 - timeDiff

      return {
        needPermission: dishIntervalMinutesConfig?.allowAddToCart
          ? false
          : leftMin > 0,
        leftMin,
        startTime: currentOrderDishLatestTime,
        durationMax: dishIntervalMinutesItem.minutes * 60,
        isDishCollection:
          dishIntervalMinutesItem.specificDishType ===
          specificDishTypes.specificDishCollection,
      }
    },
    [dishIntervalMinutesConfig, savedPermission, isNeedCheckDishAuth]
  )

  // 下单次数设置
  const needTimesPermission = (orders) => {
    if (!orders?.length) {
      return {
        needPermission: false,
      }
    }
    const orderId = orders?.[0]?.id
    if (timesConfig?.open && (timesConfig?.times || 0) > 0) {
      return {
        needPermission:
          getStorageValue('emenu_permission')?.[orderId]?.times >=
          timesConfig?.times,
        maxTimes: timesConfig?.times,
      }
    } else {
      return {
        needPermission: false,
      }
    }
  }

  // 订单下单数量限制(指定菜品每个订单) id:3
  const needOrderDishPermission = (cart, id, orders) => {
    if (!dishQuantityLimit?.length || !isNeedCheckDishAuth)
      return {
        needPermission: false,
      }
    const isDishInConfig = dishQuantityLimit.find((limit) =>
      limit?.dishes?.includes(id)
    )
    if (!isDishInConfig)
      return {
        needPermission: false,
      }
    const maxCartNum = isDishInConfig.quantity
    const actualCart = cart?.filter((each) => !each.isBuffetItem)
    const orderDishes = cloneDeep([...actualCart, ...(orders?.[0]?.cart || [])])
    const currentOrderAllDish = orderDishes.reduce((pre, cur) => {
      const dishIdx = pre?.findIndex((each) => each.id === cur.id)
      if (dishIdx === -1) return pre.concat(cur)
      pre[dishIdx].count += cur?.count ?? 0
      return pre
    }, [])
    const currentDishInfo = currentOrderAllDish?.find((each) => each.id === id)
    const currentDishCount = currentDishInfo?.count || 0
    const needPermission = currentDishCount >= maxCartNum
    const currentDishCartCount = actualCart
      .filter((each) => each.id === id)
      ?.reduce((pre, cur) => {
        return pre + cur.count
      }, 0)
    return {
      needPermission,
      limitNum: maxCartNum,
      maxCartNum: needPermission
        ? 0
        : maxCartNum - currentDishCount + (currentDishCartCount || 0),
    }
  }

  // 订单下单数量限制(指定菜品集每个订单) id:81
  const needOrderDishSetPermission = (cart, id, orders) => {
    if (!dishSetQuantityLimit?.length || !isNeedCheckDishAuth)
      return {
        needPermission: false,
      }
    const isDishInConfig = dishSetQuantityLimit.find((limit) =>
      limit?.dishes?.includes(id)
    )
    if (!isDishInConfig)
      return {
        needPermission: false,
      }
    const maxCartNum = isDishInConfig.quantity
    const actualCart = cart?.filter((each) => !each.isBuffetItem)
    const orderDishes = cloneDeep([...actualCart, ...(orders?.[0]?.cart || [])])
    const needCountDishes = orderDishes.filter((each) =>
      isDishInConfig?.dishes.includes(each.id)
    )
    const currentAllDishCount = needCountDishes.reduce(
      (prev, cur) => prev + cur.count || 0,
      0
    )
    const needPermission = currentAllDishCount >= maxCartNum
    const currentDishCount = actualCart
      .filter((each) => each.id === id)
      ?.reduce((pre, cur) => {
        return pre + cur.count
      }, 0)
    return {
      needPermission,
      limitNum: maxCartNum,
      maxCartNum: needPermission
        ? 0
        : maxCartNum - currentAllDishCount + (currentDishCount || 0),
    }
  }

  // 菜品集 id:9999
  const needDishSetPermission = (cart, id, orders) => {
    if (!dishSetConfig?.length || !isNeedCheckDishAuth)
      return {
        needPermission: false,
      }
    const isDishInConfig = dishSetConfig.find((limit) =>
      limit?.dishes?.includes(id)
    )
    if (!isDishInConfig)
      return {
        needPermission: false,
      }
    const partySize =
      (orders?.[0]?.id
        ? orders?.[0]?.numOfGuests
        : getStorageValue('emenu_partySize')) - actualNotCountNum

    // 菜品集下数量限制
    const maxCartNum = isDishInConfig.quantity * partySize
    const actualCart = cart?.filter((each) => !each.isBuffetItem)
    const orderDishes = cloneDeep([...actualCart, ...(orders?.[0]?.cart || [])])
    const needCountDishes = orderDishes.filter((each) =>
      isDishInConfig?.dishes.includes(each.id)
    )
    const currentAllDishCount = needCountDishes.reduce(
      (prev, cur) => prev + cur.count || 0,
      0
    )
    const needPermission = currentAllDishCount >= maxCartNum
    const currentDishCount = actualCart
      .filter((each) => each.id === id)
      ?.reduce((pre, cur) => {
        return pre + cur.count
      }, 0)
    return {
      needPermission,
      limitNum: maxCartNum,
      maxCartNum: needPermission
        ? 0
        : maxCartNum - currentAllDishCount + (currentDishCount || 0),
    }
  }

  // 订单下单数量限制(指定菜品每人每个订单) id:44
  const needOrderDishEveryonePermission = (cart, id, orders) => {
    if (!dishQuantityLimitEveryone?.length || !isNeedCheckDishAuth)
      return {
        needPermission: false,
      }
    const isDishInConfig = dishQuantityLimitEveryone.find((limit) =>
      limit?.dishes?.includes(id)
    )
    if (!isDishInConfig)
      return {
        needPermission: false,
      }
    const partySize =
      (orders?.[0]?.id
        ? orders?.[0]?.numOfGuests
        : getStorageValue('emenu_partySize')) - actualNotCountNum
    const maxCartNum = isDishInConfig.quantity * partySize
    const actualCart = cart?.filter((each) => !each.isBuffetItem)
    const orderDishes = cloneDeep([...actualCart, ...(orders?.[0]?.cart || [])])
    const currentOrderAllDish = orderDishes.reduce((pre, cur) => {
      const dishIdx = pre?.findIndex((each) => each.id === cur.id)
      if (dishIdx === -1) return pre.concat(cur)
      pre[dishIdx].count += cur?.count ?? 0
      return pre
    }, [])
    const currentDishInfo = currentOrderAllDish?.find((each) => each.id === id)
    const currentDishCount = currentDishInfo?.count || 0
    const needPermission = currentDishCount >= maxCartNum
    const currentDishCartCount = actualCart
      .filter((each) => each.id === id)
      ?.reduce((pre, cur) => {
        return pre + cur.count
      }, 0)

    return {
      needPermission,
      limitNum: maxCartNum,
      maxCartNum: needPermission
        ? 0
        : maxCartNum - currentDishCount + (currentDishCartCount || 0),
    }
  }

  // 每位食客每轮下单指定菜品数量限制 id:46
  const needOrderDishOncePermission = (cart, id) => {
    if (!dishQuantityLimitOnce?.length || dishQuantityPerRoundConfig?.open)
      return {
        needPermission: false,
      }
    const isDishInConfig = dishQuantityLimitOnce.find((limit) =>
      limit?.dishes?.includes(id)
    )
    if (!isDishInConfig)
      return {
        needPermission: false,
      }
    const partySize = getStorageValue('emenu_partySize') - actualNotCountNum
    const maxCartNum = isDishInConfig.quantity * partySize
    const actualCart = cart?.filter((each) => !each.isBuffetItem)
    const orderDishes = cloneDeep([...actualCart])
    const currentOrderAllDish = orderDishes.reduce((pre, cur) => {
      const dishIdx = pre?.findIndex((each) => each.id === cur.id)
      if (dishIdx === -1) return pre.concat(cur)
      pre[dishIdx].count += cur?.count ?? 0
      return pre
    }, [])
    const currentDishLimit = currentOrderAllDish?.map((each) => {
      const limitNum = dishQuantityLimitOnce.find((limit) =>
        limit?.dishes?.includes(each.id)
      )?.quantity
      return {
        id: each.id,
        count: each.count,
        limitNum: limitNum * partySize,
      }
    })
    const overLimitDish = currentDishLimit?.filter(
      (each) => each.count >= each.limitNum && each.id === id
    )
    return {
      needPermission: overLimitDish?.length > 0,
      limitNum: overLimitDish[0]?.limitNum,
      maxCartNum,
    }
  }

  // 是否有用餐时长限制
  const needDurationPermission = (orders) => {
    if (!orders?.length) {
      return { needPermission: false }
    }
    if (durationConfig?.open && (durationConfig?.duration || 0) > 0) {
      const createTime = orders?.[0]?.time
      const limitSeconds = durationConfig?.duration * 60
      const spentSeconds = dayjs().diff(dayjs(createTime), 'second')
      return {
        needPermission: spentSeconds > limitSeconds,
        durationMin: durationConfig?.duration,
      }
    } else {
      return { needPermission: false }
    }
  }

  // 是否有用餐剩余时间提示限制
  const needRestTimeAlertPermission = (orders) => {
    if (!orders?.length) {
      return { needPermission: false }
    }
    if (
      durationConfig &&
      durationConfig.open &&
      (durationConfig.duration || 0) > 0
    ) {
      if (
        restTimeAlertConfig &&
        restTimeAlertConfig.open &&
        (restTimeAlertConfig.restTimeAlert || 0) > 0 &&
        restTimeAlertConfig.disableOrderAfterAlert
      ) {
        const createTime = orders?.[0]?.time
        const durationMin = durationConfig.duration
        const limitMin = durationMin - restTimeAlertConfig.restTimeAlert
        const spentMin = dayjs().diff(dayjs(createTime), 'minutes')
        const diffMin = durationMin - spentMin
        return {
          needPermission: spentMin >= limitMin,
          leftMin: diffMin > 0 ? diffMin : 0,
        }
      }
    }

    return { needPermission: false }
  }

  // 每轮指定菜品下单数量限制 id:57
  const needDishLimitPerRoundPermission = (cart, id) => {
    if (!dishQuantityPerRoundConfig?.open || !isNeedCheckDishAuth) {
      return { needPermission: false }
    }
    const partySize =
      (isNeedSelectGuest ? getStorageValue('emenu_partySize', 1) : 1) -
      actualNotCountNum
    const dishQuantityPerRound = dishQuantityPerRoundConfig.dishQuantityPerRound
    const matchedRule = dishQuantityPerRound?.find((item) => {
      if (item.before) return partySize <= item.before
      if (item.after) return partySize >= item.after
      return false
    })

    const isPerPersonPerRound =
      matchedRule?.perType === perTypes.perPerson_perRound
    let matchedRuleMaxCartNum = Math.min(
      (matchedRule?.maxCount || Infinity) *
        (isPerPersonPerRound ? partySize : 1),
      matchedRule?.maxCountPerRound || Infinity
    )
    matchedRuleMaxCartNum =
      matchedRuleMaxCartNum === Infinity ? 0 : matchedRuleMaxCartNum

    const actualCart = cart?.filter((each) => !each.isBuffetItem)
    if (!actualCart?.length) {
      return {
        needPermission: false,
        maxCartNum:
          matchedRuleMaxCartNum > 0 ? matchedRuleMaxCartNum : undefined,
      }
    }

    const { cartCount, currentDishCount, allDishCountMap } = actualCart.reduce(
      (prev, cur) => {
        prev.cartCount += cur.count
        if (cur.id === id) {
          prev.currentDishCount += cur.count
        }
        if (prev.allDishCountMap.has(cur.id)) {
          prev.allDishCountMap.set(
            cur.id,
            prev.allDishCountMap.get(cur.id) + cur.count
          )
        } else {
          prev.allDishCountMap.set(cur.id, cur.count)
        }
        return prev
      },
      {
        cartCount: 0,
        currentDishCount: 0,
        allDishCountMap: new Map(),
      }
    )

    if (matchedRuleMaxCartNum > 0 && cartCount >= matchedRuleMaxCartNum) {
      return {
        needPermission: true,
        maxLimit: matchedRuleMaxCartNum,
        maxCartNum: Math.max(
          0,
          matchedRuleMaxCartNum - cartCount + currentDishCount
        ),
      }
    }

    if (id) {
      const isDishInConfig = matchedRule?.specificDishLimit?.find((limit) =>
        limit?.dishes?.includes(id)
      )
      if (isDishInConfig) {
        const isSpecificDishPerPersonPerRound =
          (isDishInConfig.perType ?? matchedRule?.perType) ===
          perTypes.perPerson_perRound
        const isDishCollection =
          isDishInConfig.specificDishType ===
          specificDishTypes.specificDishCollection

        if (
          isDishCollection &&
          isDishInConfig.unit === specificDishUnits.types
        ) {
          const dishTypeMaxCartNum =
            (isDishInConfig.quantity || 0) *
            (isSpecificDishPerPersonPerRound ? partySize : 1)

          let typeCount = 0
          let currentDishCount = 0
          allDishCountMap.forEach((value, key) => {
            if (isDishInConfig.dishes?.includes(key)) {
              typeCount++
              if (key === id) {
                currentDishCount = value
              }
            }
          })

          const maxDishCountConfig = isDishInConfig.specificTypeDishLimit?.find(
            (item) => item.dishes?.includes(id)
          )?.quantity
          const maxDishCount =
            (maxDishCountConfig || 0) *
            (isSpecificDishPerPersonPerRound ? partySize : 1)

          if (
            dishTypeMaxCartNum > 0 &&
            typeCount >= dishTypeMaxCartNum &&
            currentDishCount <= 0
          ) {
            return {
              needPermission: true,
              limitNum: dishTypeMaxCartNum,
              maxCartNum: 0,
              isDishLimit: true,
              isDishCollection: true,
              isDishType: true,
            }
          } else if (maxDishCount > 0 && currentDishCount >= maxDishCount) {
            return {
              needPermission: true,
              limitNum: maxDishCount,
              maxCartNum: Math.max(0, maxDishCount - currentDishCount),
              isDishLimit: true,
              isDishCollection: true,
              isDishType: false,
            }
          }
        } else if (
          isDishCollection &&
          isDishInConfig.unit === specificDishUnits.pieces
        ) {
          const dishMaxCartNum =
            (isDishInConfig.quantity || 0) *
            (isSpecificDishPerPersonPerRound ? partySize : 1)

          const currentDishCount = allDishCountMap.get(id) || 0
          const allDishCount = isDishInConfig.dishes?.reduce((prev, cur) => {
            if (allDishCountMap.has(cur)) {
              prev += allDishCountMap.get(cur)
            }
            return prev
          }, 0)
          const maxDishCount = isDishInConfig.specificPieceSameDishLimit?.find(
            (item) => item.dishes?.includes(id)
          )?.quantity

          if (maxDishCount > 0 && currentDishCount >= maxDishCount) {
            return {
              needPermission: true,
              limitNum: maxDishCount,
              maxCartNum: Math.max(0, maxDishCount - currentDishCount),
              isDishLimit: true,
              isDishCollection: true,
              isDishPieceSame: true,
            }
          }

          if (dishMaxCartNum > 0 && allDishCount >= dishMaxCartNum) {
            return {
              needPermission: true,
              limitNum: dishMaxCartNum,
              maxCartNum: Math.max(0, dishMaxCartNum - allDishCount),
              isDishLimit: true,
              isDishCollection: true,
              isDishPieceSame: false,
            }
          }
        } else {
          const dishMaxCartNum =
            (isDishInConfig.quantity || 0) *
            (isSpecificDishPerPersonPerRound ? partySize : 1)

          if (dishMaxCartNum > 0) {
            return {
              needPermission: currentDishCount >= dishMaxCartNum,
              limitNum: dishMaxCartNum,
              maxCartNum: dishMaxCartNum,
              isDishLimit: true,
              isDishCollection: false,
            }
          }
        }
      }
    }
    return {
      needPermission: false,
      maxLimit: matchedRuleMaxCartNum,
      maxCartNum:
        matchedRuleMaxCartNum > 0
          ? Math.max(0, matchedRuleMaxCartNum - cartCount + currentDishCount)
          : undefined,
    }
  }

  // 每轮指定菜品下单数量限制 id:57 购物车
  const needDishLimitPerRoundCartPermission = (cart) => {
    if (!dishQuantityPerRoundConfig?.open || !isNeedCheckDishAuth) {
      return { needPermission: false }
    }
    const actualCart = cart?.filter((each) => !each.isBuffetItem)
    if (!actualCart?.length) {
      return { needPermission: false }
    }
    const partySize =
      (isNeedSelectGuest ? getStorageValue('emenu_partySize', 1) : 1) -
      actualNotCountNum
    const dishQuantityPerRound = dishQuantityPerRoundConfig.dishQuantityPerRound
    const matchedRule = dishQuantityPerRound?.find((item) => {
      if (item.before) return partySize <= item.before
      if (item.after) return partySize >= item.after
      return false
    })

    const matchedRuleMaxCartNum = Math.min(
      (matchedRule?.maxCount || Infinity) *
        (matchedRule?.perType === perTypes.perPerson_perRound ? partySize : 1),
      matchedRule?.maxCountPerRound || Infinity
    )

    const matchedRuleMinCartNum = Math.max(
      (matchedRule?.minCount || 0) *
        (matchedRule?.perType === perTypes.perPerson_perRound ? partySize : 1),
      matchedRule?.minCountPerRound || 0
    )

    const cartCount = actualCart?.reduce((prev, cur) => prev + cur.count, 0)

    if (matchedRuleMaxCartNum > 0 && cartCount > matchedRuleMaxCartNum) {
      return {
        needPermission: true,
        maxLimit: matchedRuleMaxCartNum,
        overCount: cartCount - matchedRuleMaxCartNum,
      }
    } else if (matchedRuleMinCartNum > 0 && cartCount < matchedRuleMinCartNum) {
      return {
        needPermission: true,
        minLimit: matchedRuleMinCartNum,
        underCount: matchedRuleMinCartNum - cartCount,
      }
    } else {
      return { needPermission: false }
    }
  }

  // 每轮互斥菜品 id: 76
  const needMutexDishPermission = (cart, id) => {
    if (
      !mutexDishConfig?.open ||
      !id ||
      !cart?.length ||
      !isNeedCheckDishAuth
    ) {
      return { needPermission: false }
    }
    const mutexDishOptions = mutexDishConfig?.mutexDish || []
    const actualCart = cart?.filter((each) => !each.isBuffetItem)
    for (const item of mutexDishOptions) {
      let mutexDishList = []
      if (item.dishA?.includes(id)) {
        mutexDishList = item.dishB || []
      }
      if (item.dishB?.includes(id)) {
        mutexDishList = item.dishA || []
      }
      if (mutexDishList.length > 0) {
        const idx = actualCart.findIndex((each) =>
          mutexDishList.includes(each.id)
        )
        if (idx !== -1) {
          return {
            needPermission: true,
            limitNum: 0,
            maxCartNum: 0,
            mutexId: actualCart[idx].id,
          }
        }
      }
    }
    return { needPermission: false }
  }

  // 每轮组合菜品 id: 77
  const needCombinationDishPermission = (cart) => {
    if (!combinationDishConfig?.open || !cart?.length || !isNeedCheckDishAuth) {
      return { needPermission: false }
    }
    const combinationDishOptions = combinationDishConfig?.combinationDish || []
    const actualCart = cart?.filter((each) => !each.isBuffetItem)
    for (const item of combinationDishOptions) {
      const dishACount = actualCart
        .filter((each) => item.dishA?.includes(each.id))
        .reduce((prev, cur) => prev + cur.count, 0)
      if (dishACount > 0 && item.dishB?.length > 0) {
        const dishB = item.dishB
        const dishBCount = (item.dishBCount || 0) * dishACount
        if (dishBCount > 0) {
          const actualDishBCount = actualCart
            .filter((each) => dishB.includes(each.id))
            .reduce((prev, cur) => prev + cur.count, 0)
          if (actualDishBCount < dishBCount) {
            return {
              needPermission: true,
              combinationDishIds: dishB,
              dishACount,
              additionalDishBCount: dishBCount - actualDishBCount,
            }
          }
        }
      }
    }
    return { needPermission: false }
  }

  return {
    needQuantityPermission,
    needOrderIntervalPermission,
    needDishOrderIntervalPermission,
    needTimesPermission,
    needOrderDishPermission,
    needOrderDishEveryonePermission,
    needOrderDishOncePermission,
    needDurationPermission,
    needDishSetPermission,
    needRestTimeAlertPermission,
    needDishLimitPerRoundPermission,
    needDishLimitPerRoundCartPermission,
    needMutexDishPermission,
    needCombinationDishPermission,
    needOrderDishSetPermission,
  }
}

export default useCheckDishBeforeOrder
