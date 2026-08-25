import request from '@/utils/request'
import { roundToPrecision } from '@/utils/number'
import {
  getStorageValue,
  // setStorageValue,
} from '@/utils/storage'
import { getGlobalState } from '@/hooks/useGlobalState'
import { OrderStatus } from '@/constants/order'
import { add, cloneDeep, isArray, isNil, join, mergeWith } from 'lodash-es'
import {
  countFinalTax,
  distributeByCategoryId,
  getFinalPriceLimitByTaxId,
  getFinalRate,
  getValueAddedRate,
  isExistCATax,
  isExistTaxFreeMinQty,
  isInCanada,
} from '@/utils/taxCountUtil'
import { Decimal } from 'decimal.js'
import getRewardItemByRules from '@/utils/getRewardItemByRules'
import { sendPosLog } from '@/services/setting'
import { v4 as uuidv4 } from 'uuid'
import store from '@/store'
import { CRM_PROVIDER } from '@/crm/providerType'
import { CRM_INTEGRATION_REWARD_KIND } from '@/utils/crmIntegrationRewards'
import { getApplicableCrmIntegrationDiscountOrderReward } from '@/utils/crmIntegrationDiscountMapping'
import { getI18n } from 'react-i18next'
import { getItemSizeNameByLanguage } from '@/utils/itemSizeName'
import { extractSeasoningSnapshotsFromPosOptions } from '@/utils/seasoningGuest'
import {
  parseEmenuKioskExtendedInfo,
  readDurationBillingSession,
} from '@/utils/durationBilling'

function getCrmIntegrationOrderDiscountAmount(discountList) {
  const actualDiscountList = Array.isArray(discountList)
    ? discountList
    : parseOrderDiscountList(discountList)

  return roundToPrecision(
    actualDiscountList.reduce((total, discount) => {
      const amount = Number(discount?.amount || 0)
      return total + (Number.isFinite(amount) ? amount : 0)
    }, 0)
  )
}

function getCrmIntegrationGiftOrderDiscountAmount(discountList) {
  const actualDiscountList = Array.isArray(discountList)
    ? discountList
    : parseOrderDiscountList(discountList)

  return getCrmIntegrationOrderDiscountAmount(
    actualDiscountList.filter((discount) => discount?.isReward === true)
  )
}

function getCrmIntegrationDiscountOrderRewardFromStore() {
  const state = store.getState()
  if (state?.crmProviderSlice?.providerType !== CRM_PROVIDER.INTEGRATION) {
    return null
  }

  const { selectedBenefit, selectedBenefitValidation } =
    state?.crmIntegrationValidationSlice || {}
  const orderDiscountInfo = Array.isArray(
    selectedBenefitValidation?.orderDiscountInfo
  )
    ? selectedBenefitValidation.orderDiscountInfo
    : []
  const discountedItemInfoByKey =
    selectedBenefitValidation?.discountedItemInfoByKey || {}
  const hasItemDiscountInfo = Object.keys(discountedItemInfoByKey).length > 0

  if (
    !selectedBenefit?.id ||
    (!orderDiscountInfo.length && !hasItemDiscountInfo)
  ) {
    return null
  }

  return {
    crmIntegrationBenefit: true,
    selectedBenefitId: selectedBenefit.id,
    crmIntegrationRewardKind: selectedBenefit.crmIntegrationRewardKind,
    orderDiscountInfo,
    discountedItemInfoByKey,
    result: selectedBenefitValidation?.result || null,
  }
}

export function fetchOrder({ params = {}, axiosConfig = {} } = {}) {
  return request({
    url: '/order/fetch',
    method: 'get',
    params: params,
    ...axiosConfig,
  })
}

export function saveOrder({ order }) {
  sendPosLog(`Emenu Send order, status: ${order?.status}`)
  const sessionKey = getStorageValue('emenu_auth')?.sessionKey
  return request({
    url: '/order/save',
    method: 'post',
    data: {
      order,
      userAuth: { sessionKey },
    },
  })
}

export function clearOrderFromTable(order) {
  return request({
    url: `${
      import.meta.env.DEV
        ? `${import.meta.env.VITE_SERVER_URL}webapp`
        : '/kpos/webapp'
    }/order/clearOrderFromTable`,
    method: 'post',
    data: order,
  })
}

export function sendKitchen({ orderId, items }, sendKitchenMethod) {
  sendPosLog(`Emenu ${sendKitchenMethod} send kitchen for order ${orderId}`)
  return request({
    url: '/print/kitchen/ticket',
    method: 'post',
    data: {
      orderId,
      items,
      resend: false,
    },
  })
}

export function printReceipt({ orderId }) {
  return request({
    url: '/print/receipt',
    method: 'post',
    data: {
      orderId,
    },
  })
}

export function getChargeList() {
  return request({
    url: '/charge/list',
    method: 'get',
  })
}

// 用于查询订单信息后，处理订单下单菜品数据
function transformItem({
  item,
  menuList,
  modifierActionList,
  memberCard = null,
}) {
  try {
    let menuItem = menuList?.find((i) => i.id === item.saleItemId)
    // 特殊处理 会员卡
    const isBenefitCard = item.saleItemId === memberCard?.id
    let cartItem = {
      key: item.id,
      orderItemId: item.id,
      id: item.saleItemId,
      price: item.price,
      realPrice: roundToPrecision(item.totalAmount / item.quantity) || 0,
      count: item.splitWay === 'PRICE' ? 0 : (item.proportion ?? item.quantity),
      proportion: item.proportion, // 从count 中拆出来，后续迭代处理
      delay: item.sendToKitchenRemainingDelay,
      status: item.status,
      categoryId: menuItem?.categoryId,
      taxFreeMinQty: menuItem?.taxFreeMinQty,
      name: menuItem?.name || item.displayName,
      pic: menuItem?.pic,
      taxIds: menuItem?.taxIds,
      // 接口中只保存下单时的数据，有可能是原价，有可能是会员价，这里要从菜单源数据中保存一份原价/会员价， 防止切换下单类型(会员价/原价)
      // 自定义菜或者被删除的菜是没有menuItem的
      benefitPrice:
        isBenefitCard || isNil(menuItem)
          ? item.price
          : (menuItem?.benefitPrice ?? menuItem?.price),
      menuItemPrice:
        isBenefitCard || isNil(menuItem) ? item.price : menuItem?.price,
      hotpotPriceRule: menuItem?.hotpotPriceRule,
      // crm 积分兑换菜
      rewardItem: item.rewardItem,
      discount: item.discount,
      discountList: parseOrderDiscountList(item.discountList),
      createdOn: item.createdOn,
      sendToKitchenTime: item.sendToKitchenTime,
      orderItemTaxes: item.orderItemTaxes,
    }
    // 菜品折扣
    if (typeof item?.discount === 'number') {
      cartItem = {
        ...cartItem,
        discountID: item.discountID,
        discountName: item.discountName,
        discountRate: item.discountRate,
        discountRateType: item.discountRateType,
        discountReason: item.discountReason,
      }
    }

    cartItem.size = item.size
    cartItem.sizeID = item.sizeID
    cartItem.itemPrices = menuItem?.itemPrices

    // 有详情价时
    if (item.size && item.sizeID && menuItem?.itemPrices?.length > 0) {
      const sizeInfo = menuItem.itemPrices.find(
        (each) => each.sizeId === item.sizeID
      )
      cartItem.priceItem = {
        price: item.price,
        size: item.size,
        sizeId: item.sizeID,
        benefitPrice: sizeInfo?.benefitPrice,
        menuItemPrice: sizeInfo?.price,
      }
      cartItem.benefitPrice = sizeInfo?.benefitPrice || sizeInfo?.price
      cartItem.menuItemPrice = sizeInfo?.price
    }

    let menuItemOptionList = []
    menuItem?.optionList?.forEach((g) => {
      if ('option' === g?.type) {
        let pOption = item.options?.find((i) => i.optionId === g.id)
        let res = {
          ...g,
          key: pOption?.id,
        }
        menuItemOptionList.push(res)
      } else {
        menuItemOptionList.push(g)
      }
    })

    let comboOptions = []
    item.comboOrderDetails?.comboSections?.forEach((combo) => {
      const menuItemOption = menuItemOptionList?.find(
        (o1) => o1.id === combo.id
      )
      let freeQuantity = menuItemOption?.freeQuantity ?? 0
      if (menuItem?.isSpecialCombo && menuItem.sectionId === combo.id) {
        freeQuantity = menuItem.freeQuantity ?? 0
      }
      const comboItems = combo.orderItems?.map((e) => {
        // 子菜支持详情
        const subDishDetail = transformItem({
          item: e,
          menuList,
          modifierActionList,
        })
        const freeQuantityCount =
          freeQuantity > 0
            ? Math.min(
                subDishDetail.count ?? subDishDetail.quantity ?? 0,
                freeQuantity
              )
            : 0
        freeQuantity = freeQuantity - freeQuantityCount
        return {
          ...subDishDetail,
          isSubDishHasDetail:
            subDishDetail.options.length > 0 ||
            subDishDetail.hasOwnProperty('priceItem') ||
            subDishDetail.instructions,
          freeQuantityCount,
          parent: menuItemOption,
        }
      })
      comboOptions.push(comboItems)
    })
    let options = []
    item.options?.forEach((option) => {
      const menuItemOption = menuItemOptionList?.find(
        (o1) =>
          o1.type === 'option' &&
          ((String(o1.id).includes('season') &&
            o1.options.find((o2) => o2.id === option.optionId)) ||
            o1.id === option.optionId)
      )
      if (menuItemOption) {
        if (String(menuItemOption.id).includes('season')) {
          const originalMenuItemOption = menuItemOption?.options?.find(
            (o1) => o1.id === option.optionId
          )
          options.push([
            {
              ...option,
              count: option.quantity,
              onlyFirstLevel: true,
              key: option.id,
              label: option.displayText,
              id: option.optionId,
              menuItemPrice: originalMenuItemOption?.price,
              benefitPrice: originalMenuItemOption?.benefitPrice,
              parent: menuItemOption,
            },
          ])
          return
        } else if (option.optionType === 'ITEM' && option.subOptions?.length) {
          let subOptions = []
          option.subOptions.forEach((subOption) => {
            const menuItemSubOption = menuItemOption?.options?.find(
              (o1) => o1.id === subOption.subOptionId
            )
            subOptions.push({
              ...subOption,
              key: subOption.id,
              id: subOption.subOptionId,
              count: subOption.quantity,
              isSubOption: true,
              price: subOption.price,
              menuItemPrice: menuItemSubOption?.price,
              benefitPrice: menuItemSubOption?.benefitPrice,
              parent: {
                ...menuItemOption,
                menuItemPrice: menuItemOption?.price,
                benefitPrice: menuItemOption?.benefitPrice,
                count: option.quantity,
                quantity: option.quantity,
              },
            })
          })
          options.push(subOptions)
          return
        }
      }
      const otherOption = {
        ...option,
        key: option.id,
        count: option.quantity,
        id: option.optionId,
      }
      if (option.optionType === 'NOTE') {
        otherOption.isCustomOption = true
        otherOption.label = option.optionName
      } else if (option.optionType === 'GLOBAL') {
        otherOption.label = option.displayText
        if (option.modifierActionId) {
          otherOption.modifierOriginalPrice = otherOption.price
          const modifierAction = modifierActionList?.find(
            (each) => each.id === option.modifierActionId
          )
          const priceMultiplier = modifierAction?.priceMultiplier ?? 1
          otherOption.price = roundToPrecision(
            otherOption.price * priceMultiplier
          )
        }
      }
      options.push([otherOption])
    })

    const seasoningSnapshots = extractSeasoningSnapshotsFromPosOptions(
      item.options
    )
    if (seasoningSnapshots.length) {
      cartItem.seasoningSnapshots = seasoningSnapshots
    }

    if (menuItem?.comboList) {
      return {
        ...cartItem,
        sectionId: item?.comboOrderDetails?.comboSections?.[0]?.id,
        optionList: menuItemOptionList,
        comboCart: comboOptions?.flat(),
        options,
      }
    }

    return {
      ...cartItem,
      optionList: menuItemOptionList,
      options: [...comboOptions, ...options],
    }
  } catch (error) {
    console.warn(error)
  }
}

// 单个商品的总会员价 = 主菜 + 子菜 + option 的会员价
const countRealBenefitPrice = (each, root) => {
  const { options, optionList, comboCart } = each
  const basePrice = roundToPrecision(each.benefitPrice ?? 0)

  let realBenefitPrice = 0

  realBenefitPrice =
    realBenefitPrice +
    (options?.reduce((prevOptionGroupPrice, curOptionGroup) => {
      let prevOptionParent = undefined
      return (
        prevOptionGroupPrice +
        (curOptionGroup?.reduce((prevOptionPrice, curOption) => {
          if (curOption.parent) {
            let parentOptionPrice = 0
            if (curOption.parent?.id !== prevOptionParent?.id) {
              const originalParent = optionList?.find(
                (each) =>
                  each.type === curOption.parent?.type &&
                  each.id === curOption.parent?.id
              )
              prevOptionParent = curOption.parent
              parentOptionPrice =
                originalParent.benefitPrice ??
                originalParent.price ??
                prevOptionParent.benefitPrice ??
                prevOptionParent.price ??
                0
            }
            const count = curOption.count ?? curOption.quantity ?? 1
            let havePriceCount = Math.max(
              0,
              count - (curOption.freeQuantityCount ?? 0)
            )

            let actualAddPrice = curOption.benefitPrice ?? curOption?.price ?? 0
            let subOptionPrice = 0
            if (
              curOption.parent?.type === 'combo' &&
              curOption.isSubDishHasDetail
            ) {
              actualAddPrice = countRealBenefitPrice(curOption)
              havePriceCount = 1
            } else if (curOption.subOptions?.length > 0) {
              subOptionPrice = curOption.subOptions?.reduce(
                (prevSubOptionPrice, curSubOption) => {
                  return (
                    prevSubOptionPrice +
                    (curSubOption.benefitPrice ?? curSubOption?.price ?? 0) *
                      (curSubOption.count ?? curSubOption.quantity ?? 1)
                  )
                },
                subOptionPrice
              )
            }

            prevOptionPrice =
              prevOptionPrice +
              parentOptionPrice * count +
              actualAddPrice * havePriceCount +
              subOptionPrice * count
          } else {
            prevOptionPrice =
              prevOptionPrice +
              ((curOption.benefitPrice ?? curOption?.price ?? 0) +
                (curOption.subOptions?.reduce(
                  (prevSubOptionPrice, curSubOption) => {
                    return (
                      prevSubOptionPrice +
                      (curSubOption.benefitPrice ?? curSubOption?.price ?? 0) *
                        (curSubOption.count ?? curSubOption.quantity ?? 1)
                    )
                  },
                  0
                ) ?? 0)) *
                (curOption.count ?? curOption.quantity ?? 1)
          }
          return prevOptionPrice
        }, 0) ?? 0)
      )
    }, 0) ?? 0)

  // 锅底菜品
  realBenefitPrice =
    realBenefitPrice +
    (comboCart?.reduce((acc, cur) => {
      let optionBenefitPrice = 0
      // 火锅锅底是个复杂菜
      if (cur.options?.length) {
        optionBenefitPrice = countRealBenefitPrice(cur)
      } else {
        const count = cur.count ?? cur.quantity ?? 1
        const havePriceCount = Math.max(0, count - (cur.freeQuantityCount ?? 0))
        optionBenefitPrice =
          (cur?.benefitPrice ?? cur.realPrice ?? cur.price) * havePriceCount
      }
      return acc + optionBenefitPrice
    }, 0) ?? 0)

  const count = root ? 1 : (each.count ?? each.quantity ?? 1)
  const havePriceCount = root
    ? 1
    : Math.max(0, count - (each.freeQuantityCount ?? 0))
  return roundToPrecision(realBenefitPrice * count + basePrice * havePriceCount)
}

// 单个商品的总原价= 主菜 + 子菜 + option 的原价
const countRealMenuItemPrice = (each, root) => {
  const { options, optionList, comboCart } = each
  const basePrice = roundToPrecision(each.menuItemPrice ?? 0)

  let realMenuItemPrice = 0

  realMenuItemPrice =
    realMenuItemPrice +
    (options?.reduce((prevOptionGroupPrice, curOptionGroup) => {
      let prevOptionParent = undefined
      return (
        prevOptionGroupPrice +
        (curOptionGroup.reduce((prevOptionPrice, curOption) => {
          if (curOption.parent) {
            let parentOptionPrice = 0
            if (curOption.parent?.id !== prevOptionParent?.id) {
              const originalParent = optionList?.find(
                (each) =>
                  each.type === curOption.parent?.type &&
                  each.id === curOption.parent?.id
              )
              prevOptionParent = curOption.parent
              parentOptionPrice =
                originalParent.menuItemPrice ??
                originalParent.price ??
                prevOptionParent.menuItemPrice ??
                prevOptionParent.price ??
                0
            }
            const count = curOption.count ?? curOption.quantity ?? 1
            let havePriceCount = Math.max(
              0,
              count - (curOption.freeQuantityCount ?? 0)
            )

            let actualAddPrice =
              curOption.menuItemPrice ?? curOption?.price ?? 0
            let subOptionPrice = 0
            if (
              curOption.parent?.type === 'combo' &&
              curOption.isSubDishHasDetail
            ) {
              actualAddPrice = countRealMenuItemPrice(curOption)
              havePriceCount = 1
            } else if (curOption.subOptions?.length > 0) {
              subOptionPrice = curOption.subOptions?.reduce(
                (prevSubOptionPrice, curSubOption) => {
                  return (
                    prevSubOptionPrice +
                    (curSubOption.menuItemPrice ?? curSubOption?.price ?? 0) *
                      (curSubOption.count ?? curSubOption.quantity ?? 1)
                  )
                },
                subOptionPrice
              )
            }

            prevOptionPrice =
              prevOptionPrice +
              parentOptionPrice * count +
              actualAddPrice * havePriceCount +
              subOptionPrice * count
          } else {
            prevOptionPrice =
              prevOptionPrice +
              ((curOption.menuItemPrice ?? curOption?.price ?? 0) +
                (curOption.subOptions?.reduce(
                  (prevSubOptionPrice, curSubOption) => {
                    return (
                      prevSubOptionPrice +
                      (curSubOption.menuItemPrice ?? curSubOption?.price ?? 0) *
                        (curSubOption.count ?? curSubOption.quantity ?? 1)
                    )
                  },
                  0
                ) ?? 0)) *
                (curOption.count ?? curOption.quantity ?? 1)
          }
          return prevOptionPrice
        }, 0) ?? 0)
      )
    }, 0) ?? 0)

  realMenuItemPrice =
    realMenuItemPrice +
    (comboCart?.reduce((acc, cur) => {
      let optionRealMenuItemPrice = 0
      if (cur.options?.length) {
        optionRealMenuItemPrice = countRealMenuItemPrice(cur)
      } else {
        const count = cur.count ?? cur.quantity ?? 1
        const havePriceCount = Math.max(0, count - (cur.freeQuantityCount ?? 0))
        optionRealMenuItemPrice =
          (cur?.menuItemPrice ?? cur.realPrice ?? cur.price) * havePriceCount
      }

      return acc + optionRealMenuItemPrice
    }, 0) ?? 0)

  const count = root ? 1 : (each.count ?? each.quantity ?? 1)
  const havePriceCount = root
    ? 1
    : Math.max(0, count - (each.freeQuantityCount ?? 0))
  return roundToPrecision(
    realMenuItemPrice * count + basePrice * havePriceCount
  )
}

/**
 * 订单查询 - 接口数据转换
 * @param {Object} order 接口返回的订单数据
 * @param {Array} menuList 所有菜品列表
 * @param crmRewardRules crm活动规则
 * @param memberCard 会员卡信息
 * @returns 转换后组件使用订单数据
 */
function parseOrderDiscountList(discountList) {
  if (!discountList) return []

  try {
    const parsedDiscountList = JSON.parse(discountList)
    return Array.isArray(parsedDiscountList) ? parsedDiscountList : []
  } catch {
    return []
  }
}

export function transformOrder({
  order,
  menuList,
  modifierActionList,
  crmRewardRules = [],
  memberCard = null,
}) {
  const toValidTime = (time) => {
    if (typeof time === 'string') {
      return time?.replace(/-/g, '/')
    } else {
      return time
    }
  }

  // 是否已经是会员
  let isHasActivePrivilege = false
  const privileges = order?.member?.privileges
  if (privileges) {
    const currentTime = Date.now()
    const activePrivilege = JSON.parse(privileges)?.find(
      (each) =>
        each.status === 'ACTIVE' && currentTime <= (each.expireTime ?? Infinity)
    )
    isHasActivePrivilege = !!activePrivilege
  }

  let allCarts
  // 处理 subOrders > 1的情况， 只聚合商品
  if (order?.subOrders?.length > 1) {
    allCarts = order?.subOrders.reduce((pre, cur) => {
      return pre.concat(cur?.orderItems)
    }, [])
  } else {
    allCarts = order?.subOrders?.[0]?.orderItems
  }
  if (order?.orderItems?.length > 0) {
    allCarts = [...allCarts, ...order.orderItems]
  }
  let isIncludeMemberItem = false

  const cart = allCarts
    // ?.filter((e) => e?.quantity > 0)
    ?.map((e) =>
      transformItem({ item: e, menuList, modifierActionList, memberCard })
    )
    ?.map((each) => {
      if (each.isBenefitCard) {
        isIncludeMemberItem = true
      }
      if (!each.count)
        return {
          ...each,
          realBenefitPrice: undefined,
          benefitPrice: undefined,
          realMenuItemPrice: 0,
          price: 0,
        }
      let info = {
        ...each,
      }
      info.realBenefitPrice = countRealBenefitPrice(each, true) // 计算商品会员价
      info.realMenuItemPrice = countRealMenuItemPrice(each, true) // 计算商品原价
      // crm 积分兑换菜/ ad 兑换菜
      if (
        each.rewardItem &&
        crmRewardRules?.length > 0 &&
        order.orderRewards?.length > 0
      ) {
        const freeItemRule = crmRewardRules.filter(
          (each) => each.redeemRule.strategy === 'byFreeItem'
        )
        const itemReward = order.orderRewards.find(
          (reward) => reward.itemId === each.id
        )
        const freeItemInfo = {
          ...info,
          rewardItem: true,
          realBenefitPrice: undefined,
          benefitPrice: undefined,
          realMenuItemPrice: 0,
          // price: 0,
          // 积分只能兑换主菜 无需在菜单中找到对应 option, 子菜
          options: [],
          optionList: [],
          comboList: [],
          itemPrices: [],
          freeItemOriginalPrice: info.price ?? 0,
          freeItemDiscount: info.discount ?? 0,
        }
        freeItemInfo.rewardRule = getRewardItemByRules(freeItemRule, [
          freeItemInfo,
        ])?.find((each) => each.items?.length > 0)
        freeItemInfo.rewardRule.orderRewardId = itemReward.id
        return freeItemInfo
      }
      return info
    })

  // 总权益价 = 菜品权益价 - 菜品折扣
  const totalBenefitPrice = roundToPrecision(
    cart.reduce((pre, cur) => {
      return pre + ((cur.realBenefitPrice ?? 0) - cur.discount) * cur.count
    }, 0)
  )

  // 是否下单会员权益
  const isHasBenefitCart = !!cart.find((each) => each.id === memberCard.id)

  const { emenuKioskextendedInfo } = order
  let eMenuExtraData = null
  if (emenuKioskextendedInfo) {
    eMenuExtraData = JSON.parse(emenuKioskextendedInfo)
  }

  const orderDiscounts = order.orderDiscounts || []
  if (typeof order.discount === 'number' && orderDiscounts.length <= 0) {
    orderDiscounts.push({
      discount: order.discount,
      discountID: order.discountID,
      discountName: order.discountName,
      discountRate: order.discountRate,
      discountRateType: order.discountRateType,
      discountReason: order.discountReason,
      isDiscount: true,
    })
  }
  const discountList = parseOrderDiscountList(order.discountList)

  return {
    id: order?.id,
    charge: order?.charge,
    time: toValidTime(order?.createTime),
    instructions: order?.notes,
    cart,
    totalPrice: order?.totalPrice,
    totalTax: order?.totalTax,
    userId: order?.userId,
    crmMemberId: order.crmMemberId,
    totalBenefitPrice,
    isIncludeMemberItem,
    // 前序订单是否以会员权益类型下单
    isHasBenefit: isHasBenefitCart || isHasActivePrivilege,
    rewardDiscount: order.rewardDiscount,
    discountList,
    orderNumber: order.orderNumber,
    orderRewards: order.orderRewards,
    menuClassify: eMenuExtraData?.menuClassify,
    currentSpecialMenu: eMenuExtraData?.currentSpecialMenu,
    notCountAsGuestNumber: eMenuExtraData?.notCountAsGuestNumber,
    numOfGuests: order.numOfGuests,
    orderDiscounts: orderDiscounts,
    orderCharges: order.orderCharges,
    lotteryCount: eMenuExtraData?.lotteryCount,
    durationBilling: eMenuExtraData?.durationBilling,
    surcharges: eMenuExtraData?.surcharges,
  }
}

// 用于确定 realPrice 和 price
const resolveCart = (cart) => {
  return cart?.map((dish) => {
    const {
      priceItem,
      realBenefitPrice,
      benefitPrice,
      realPrice,
      price,
      options,
      optionList,
      comboCart,
      discountRate,
      discountRateType,
    } = dish
    const data = {
      ...dish,
    }
    data.realPrice = realBenefitPrice ?? realPrice
    data.price = benefitPrice ?? price
    // 百分比折扣 权益价前后重新算discount
    if (discountRateType === 2) {
      data.discount = roundToPrecision(data.realPrice * (discountRate / 100))
    }
    if (priceItem && Object.keys(priceItem)?.length > 0) {
      data.priceItem = {
        ...priceItem,
        price: priceItem.benefitPrice ?? priceItem.price,
      }
    }
    if (optionList?.length > 0 && options?.length > 0) {
      data.optionList = optionList?.map((list) => {
        return {
          ...list,
          price:
            list.type === 'option'
              ? (list.benefitPrice ?? list.price)
              : undefined,
        }
      })
      data.options = options?.map((optionArr) => {
        if (!optionArr?.length) return optionArr
        return optionArr?.map((option) => {
          if (option?.isSubDishHasDetail) {
            return resolveCart([option])?.[0]
          }
          let parent = option.parent ? { ...option.parent } : undefined
          if (option.parent?.type === 'option') {
            const originalParent = data.optionList?.find(
              (each) =>
                each.type === option.parent?.type &&
                each.id === option.parent?.id
            )
            if (originalParent) {
              parent.price = originalParent.benefitPrice ?? originalParent.price
            }
          }
          return {
            ...option,
            parent,
            price: option.benefitPrice ?? option.price,
          }
        })
      })
    }

    if (comboCart?.length > 0) {
      // 子菜都是普通菜，子菜还没有详情和option
      data.comboCart = resolveCart(comboCart)
    }

    return data
  })
}

const resolvePreOrder = (preOrder) => {
  const { cart } = preOrder
  const reSolvePreCart = (cart) => {
    return cart.map((dish) => {
      const {
        menuItemPrice,
        price,
        realMenuItemPrice,
        priceItem,
        comboCart,
        optionList,
        options,
        discount = 0,
        discountRateType,
        discountRate,
      } = dish
      const actualRealPrice = realMenuItemPrice ?? price
      const actualPrice = menuItemPrice ?? price
      // 百分比折扣, 权益价前后需要重新计算discount
      let actualDiscount = discount
      if (discountRateType === 2) {
        actualDiscount = roundToPrecision(
          actualRealPrice * (discountRate / 100)
        )
      }
      const data = {
        ...dish,
        realPrice: roundToPrecision(actualRealPrice - actualDiscount),
        price: actualPrice,
      }
      if (actualDiscount !== discount) {
        data.discount = actualDiscount
      }
      if (priceItem && Object.keys(priceItem)?.length > 0) {
        data.priceItem = {
          ...priceItem,
          price: priceItem.menuItemPrice ?? priceItem.price,
        }
      }
      if (optionList?.length > 0 && options?.length > 0) {
        data.optionList = optionList?.map((list) => {
          return {
            ...list,
            price:
              list.type === 'option'
                ? (list.menuItemPrice ?? list.price)
                : undefined,
          }
        })
        data.options = options?.map((optionArr) => {
          if (!optionArr?.length) return optionArr
          return optionArr?.map((option) => {
            if (option?.isSubDishHasDetail) {
              return reSolvePreCart([option])?.[0]
            }
            let parent = option.parent ? { ...option.parent } : undefined
            if (option.parent?.type === 'option') {
              const originalParent = data.optionList?.find(
                (each) =>
                  each.type === option.parent?.type &&
                  each.id === option.parent?.id
              )
              if (originalParent) {
                parent.price =
                  originalParent.menuItemPrice ?? originalParent.price
              }
            }
            return {
              ...option,
              parent,
              price: option.menuItemPrice ?? option.price,
            }
          })
        })
      }
      if (comboCart?.length > 0) {
        data.comboCart = reSolvePreCart(comboCart)
      }
      return data
    })
  }

  const newCart = reSolvePreCart(cart)

  const newTotalPrice = roundToPrecision(
    newCart.reduce((acc, cur) => acc + cur.realPrice * cur.count, 0)
  )

  const newPreOrder = {
    ...preOrder,
    cart: newCart,
    totalPrice: newTotalPrice,
  }

  return newPreOrder
}

/**
 * 订单保存 - 生成订单接口数据
 * @param {Object} order 待提交订单数据
 * @param {Object} prevOrder 最新已下订单
 * @param isBuffetOrder 是否自助模式
 * @param brandSettings 自助菜
 * @param isResendOrder 重新下单，用于登陆/登出会员后，以会员价/原价 重新下所有菜
 * @param userId 开启排班后按照排班设置userId
 * @param discountOrderReward crm兑换折扣信息
 * @param buffetNumOfGuests 品类模式下单人数
 * @returns 转换后接口所需订单数据
 */
export function generateOrder({
  order = {},
  prevOrder,
  isBuffetOrder = false,
  brandSettings = [],
  isResendOrder = false,
  userId = null,
  discountOrderReward = null,
  buffetNumOfGuests = undefined,
}) {
  console.log('prevOrder', prevOrder)
  const { isHasBenefit } = order
  // realPrice: 主菜+子菜+option商品总价， price: 主菜价， 主要用于计税，不向后台传递
  // 开通权益后，将realPrice或者price 置为 benefitPrice
  // 对于系统菜单 比如 会员卡, 只有price,  price === realPrice
  if (isHasBenefit) {
    // 处理order
    if (Object.keys(order)?.length > 0) {
      order.totalPrice = order.totalBenefitPrice
      order.cart = resolveCart(order.cart)
    }
    // 处理preOrder
    if (prevOrder) {
      const itemDiscount =
        roundToPrecision(
          prevOrder.cart.reduce(
            (acc, cur) => acc + cur?.discount * cur.count,
            0
          )
        ) || 0
      const allItemPrice = roundToPrecision(
        prevOrder.cart.reduce(
          (acc, cur) =>
            acc +
            (cur.realBenefitPrice ?? cur.realPrice ?? cur.price) * cur.count,
          0
        )
      )
      prevOrder.totalPrice = prevOrder.totalBenefitPrice = roundToPrecision(
        allItemPrice - itemDiscount
      )
      prevOrder.cart = resolveCart(prevOrder.cart)
    }
  }

  // 前序下单是会员价下单，当前以普通价下单，修改前序订单为普通价订单
  const isBenefitChange = prevOrder?.isHasBenefit && !isHasBenefit
  if (isBenefitChange) {
    prevOrder = resolvePreOrder(prevOrder)
  }

  // 品类模式下修改品类下单
  if (isBuffetOrder && !isResendOrder) {
    // 需要把preOrder cart下品类菜品数量重置为0 并且重新计算totalPrice
    if (prevOrder) {
      const newPreCart = prevOrder.cart.map((each) => {
        const isBuffetDish = brandSettings.find(
          (brand) => brand.buffetId === each.id
        )
        return isBuffetDish ? { ...each, count: 0 } : each
      })
      prevOrder.cart = newPreCart
      prevOrder.totalPrice = roundToPrecision(
        newPreCart.reduce(
          (acc, cur) => acc + (cur.realPrice ?? cur.price) * cur.count,
          0
        )
      )
      prevOrder.totalTax = 0
    }
  }

  const data = mergeWith({}, prevOrder, order, (objValue, srcValue, key) => {
    if (key === 'instructions') {
      return join([objValue, srcValue].filter(Boolean))
    }
    if (key === 'crmMemberId') {
      return order.crmMemberId || ''
    }
    if (['totalBenefitPrice', 'totalPrice'].includes(key)) {
      return roundToPrecision(add(objValue, srcValue))
    }
    if (key === 'lotteryCount') {
      return add(objValue || 0, srcValue || 0)
    }
    // 分类单点模式, 特殊菜单, 不计算为guest, 以新下单为准
    if (
      ['notCountAsGuestNumber', 'menuClassify', 'currentSpecialMenu'].includes(
        key
      )
    ) {
      return order?.[key]
    }
    if (isArray(objValue)) {
      return objValue.concat(srcValue)
    }
  })

  // 加一个用于税快照的key字段
  if (data.cart?.length > 0) {
    data.cart = data?.cart?.map((d) => ({ ...d, taxTempKey: uuidv4() }))
  }

  // 会员卡不算税 不算整单折扣
  // const benefitCardId = isHasBenefit.saleItemId || isHasBenefit.id
  // pos配置
  const shouldClearCrmIntegrationDiscountList =
    !!data.clearCrmIntegrationDiscountList
  const candidateDiscountOrderReward = shouldClearCrmIntegrationDiscountList
    ? null
    : discountOrderReward || getCrmIntegrationDiscountOrderRewardFromStore()
  const actualDiscountOrderReward =
    getApplicableCrmIntegrationDiscountOrderReward({
      discountOrderReward: candidateDiscountOrderReward,
      cart: data.cart,
    })
  const hadSubmittedOrderDiscount =
    Array.isArray(prevOrder?.discountList) && prevOrder.discountList.length > 0
  const hasOrderDiscountChanged =
    hadSubmittedOrderDiscount !==
    actualDiscountOrderReward?.crmIntegrationBenefit

  const configs = getStorageValue('emenu_system')
  // true -> 折扣后算税 false -> 折扣前算税
  const isCountTaxAfterDiscount =
    configs?.find((each) => each.name === 'IS_DISCOUNT_VOID_TAX')?.value ===
    'true'
  // 算税的菜, 菜价
  let countTaxDishCart = data?.cart || []
  // .filter(
  //   (each) => each.id !== benefitCardId
  // )
  // 权益价计算时需要去掉discount
  if (isHasBenefit) {
    countTaxDishCart = countTaxDishCart.map((each) => {
      return each.discount
        ? {
            ...each,
            realPrice: roundToPrecision(each.realPrice - each.discount),
            realBenefitPrice: roundToPrecision(
              each.realBenefitPrice - each.discount
            ),
          }
        : each
    })
  }
  let orderDiscounts = null
  // 先处理订单级别的折扣
  if (data?.orderDiscounts?.length > 0) {
    // 重新计算 orderDiscounts
    let totalDiscountPrice = countTaxDishCart.reduce((pre, cur) => {
      return roundToPrecision(pre + (cur.realPrice ?? cur.price) * cur.count)
    }, 0)
    const tempItemPrice = totalDiscountPrice
    // 区分固定折扣和百分比折扣
    const fixDiscount = []
    const rateDiscount = []
    data?.orderDiscounts?.forEach((each) => {
      if (each.discountRateType === 1) {
        fixDiscount.push(each)
      } else {
        rateDiscount.push(each)
      }
    })
    // 从大到小排列折扣, 根据pos逻辑来, 先减固定折扣再从小到大减百分比折扣
    const afterSortDiscount = fixDiscount
      .sort((a, b) => a.discountRate - b.discountRate)
      .concat(rateDiscount.sort((a, b) => a.discountRate - b.discountRate))
    orderDiscounts = afterSortDiscount?.map((discountInfo) => {
      const { discountRateType, discountRate, discount } = discountInfo
      if (discountRateType === 1) {
        totalDiscountPrice = roundToPrecision(totalDiscountPrice - discount)
        return discountInfo
      }
      const actualRate = roundToPrecision(discountRate / 100)
      const newDiscount = roundToPrecision(totalDiscountPrice * actualRate)
      totalDiscountPrice = roundToPrecision(totalDiscountPrice - newDiscount)
      return {
        ...discountInfo,
        discount: newDiscount,
      }
    })
    // 折扣前算税: 原价算税 不用处理订单级别的折扣
    // 折扣后算税: 将订单级别的折扣按照比例分摊到菜品上，再算税
    // 先计算出所有折扣的折扣，再算出总折扣，再分摊到菜上
    if (isCountTaxAfterDiscount) {
      const allDiscounts = roundToPrecision(
        orderDiscounts.reduce((pre, cur) => {
          return pre + cur.discount
        }, 0)
      )
      countTaxDishCart = countTaxDishCart?.map((item) => {
        const { price, realPrice } = item
        if (realPrice) {
          const itemPriceProportion = (realPrice / tempItemPrice) * allDiscounts
          return {
            ...item,
            realPrice: roundToPrecision(realPrice - itemPriceProportion),
          }
        }
        if (price) {
          const itemPriceProportion = (price / tempItemPrice) * allDiscounts
          return {
            ...item,
            price: roundToPrecision(price - itemPriceProportion),
          }
        }
        return {
          ...item,
        }
      })
    }
  }
  // 再处理菜品折扣，折扣前算税，实际计税菜价需要加上被减去的discount
  if (!isCountTaxAfterDiscount) {
    countTaxDishCart = countTaxDishCart?.map((each) => {
      if (typeof each.discount === 'number') {
        return {
          ...each,
          realPrice: roundToPrecision(each.discount + each.realPrice),
        }
      }
      return each
    })
  }

  // 有crm兑换discount, 且是折扣后算税，计算需要算税的菜价
  if (actualDiscountOrderReward && isCountTaxAfterDiscount) {
    if (actualDiscountOrderReward.crmIntegrationBenefit) {
      const discountedItemInfoByKey =
        actualDiscountOrderReward.discountedItemInfoByKey || {}
      countTaxDishCart = countTaxDishCart.map((item) => {
        const discounts = Array.isArray(
          discountedItemInfoByKey[String(item.key)]?.discounts
        )
          ? discountedItemInfoByKey[String(item.key)].discounts
          : []
        if (!discounts.length || !item.count) return item

        const itemDiscountAmount = discounts.reduce((total, discount) => {
          const amount = Number(discount?.amount || 0)
          return roundToPrecision(
            total + (Number.isFinite(amount) ? amount : 0)
          )
        }, 0)
        if (!itemDiscountAmount) return item

        const unitDiscountAmount = roundToPrecision(
          itemDiscountAmount / item.count
        )
        return {
          ...item,
          price:
            typeof item.price === 'number'
              ? Math.max(0, roundToPrecision(item.price - unitDiscountAmount))
              : item.price,
          realPrice:
            typeof item.realPrice === 'number'
              ? Math.max(
                  0,
                  roundToPrecision(item.realPrice - unitDiscountAmount)
                )
              : item.realPrice,
        }
      })
    } else {
      // 折扣后算税，要分摊到菜品上，相当给菜打折扣
      let rewardDiscountRate = null
      // 实际抵扣金额
      const { discount, discountRate, strategy, maxDiscount, notEligibleId } =
        actualDiscountOrderReward
      // 百分比折扣
      if (strategy === 'byPercentageOff') {
        rewardDiscountRate = roundToPrecision(1 - discountRate / 100, 4)
        // 达到了最大抵扣金额，需要重新计算百分比
        if (maxDiscount && discount === maxDiscount) {
          rewardDiscountRate = reCountDiscountRate(
            countTaxDishCart,
            notEligibleId,
            discount
          )
        }
      }
      // 固定折扣要换算成百分比
      if (strategy === 'byFixedAmount') {
        rewardDiscountRate = reCountDiscountRate(
          countTaxDishCart,
          notEligibleId,
          discount
        )
      }
      countTaxDishCart = afterDiscountDish(
        countTaxDishCart,
        notEligibleId,
        rewardDiscountRate
      )
    }
  }

  const taxList = data?.taxes

  const amountTaxList = []

  // 是否在加拿大 - 用于加拿大税计算
  const area = isInCanada()
  // 根据 categoryId 分商品
  const catsCart = distributeByCategoryId(countTaxDishCart, area)
  countTaxDishCart?.forEach((each) => {
    // 当前菜品下包含的税种
    const dishIncludeTax = taxList.filter((tax) =>
      each.taxIds?.includes(tax.id)
    )
    // 开启税快照后，已经下单的菜要按照老税计算
    // 但是有折扣的菜 且是折扣后算税 要按照折扣后算税来算
    const crmIntegrationItemDiscounts =
      actualDiscountOrderReward?.crmIntegrationBenefit &&
      isCountTaxAfterDiscount
        ? actualDiscountOrderReward.discountedItemInfoByKey?.[String(each.key)]
            ?.discounts
        : []
    const hasCrmIntegrationItemDiscount =
      Array.isArray(crmIntegrationItemDiscounts) &&
      crmIntegrationItemDiscounts.length > 0
    const hadSubmittedItemDiscount =
      Array.isArray(each.discountList) && each.discountList.length > 0
    const shouldRecalculateTaxForCrmIntegrationDiscount =
      hasOrderDiscountChanged && hadSubmittedItemDiscount
    if (
      each.orderItemTaxes?.length &&
      !hasCrmIntegrationItemDiscount &&
      !shouldRecalculateTaxForCrmIntegrationDiscount
    ) {
      const { taxTempKey, id: dishId, orderItemTaxes } = each
      const preTaxInfo = orderItemTaxes.map((e) => {
        const {
          id: taxSnapshotId,
          outTaxRate,
          priceLimit,
          taxAmount,
          taxId,
          taxIncrease,
          taxIncreaseName,
          taxIncreaseRate,
          taxName,
          taxRate,
        } = e
        return {
          name: taxName,
          outRate: outTaxRate,
          rate: taxRate,
          taxIncrease,
          taxIncreaseName,
          taxIncreaseRate,
          taxTempKey,
          itemTax: taxAmount,
          id: taxId,
          priceLimit,
          dishId,
          taxSnapshotId,
        }
      })
      amountTaxList.push(...preTaxInfo)
    } else {
      // 是否包含加拿大税
      const hasCATax = isExistCATax(dishIncludeTax)
      // 菜品信息
      const {
        taxTempKey,
        id,
        realPrice,
        price,
        count,
        categoryId,
        taxFreeMinQty,
      } = each
      // 是否合法的免税菜品下单量
      const isValidMinQty = isExistTaxFreeMinQty(area, hasCATax, taxFreeMinQty)
      const dishTax = dishIncludeTax.map((tax) => {
        const { rate, priceLimit, taxIncreaseRate, id: taxId } = tax
        // 计算增值税
        const valueAddedTax = getValueAddedRate(area, taxIncreaseRate)
        // 当前菜品相同类下总数量, 用于辨别免税情况
        const countByCate = catsCart?.find(
          (each) => each.categoryId === categoryId
        )?.allCount
        // 加拿大税情况下 总价按包含当前税的所有商品价格计算
        const priceLimitByTaxType = getFinalPriceLimitByTaxId(
          countTaxDishCart,
          taxId,
          catsCart,
          id
        )
        // 实际税率
        const actualRate = getFinalRate(
          area,
          priceLimit,
          priceLimitByTaxType,
          rate,
          valueAddedTax
        )
        // 商品价格, 复杂菜使用realPrice， 普通菜使用price
        const actualPrice = realPrice ?? price
        // 最终算税, 是否免税
        const itemTax = countFinalTax(
          Decimal.mul(actualPrice, count).mul(actualRate).div(100).toNumber(),
          countByCate,
          taxFreeMinQty,
          isValidMinQty
        )
        return {
          ...tax,
          itemTax,
          dishId: id,
          taxTempKey,
        }
      })
      amountTaxList.push(...dishTax)
    }
  })

  const beforeRound = amountTaxList.reduce((pre, cur) => {
    const { id, itemTax } = cur

    const sameTaxIndex = pre?.findIndex((each) => each.taxId === id)
    if (sameTaxIndex === -1) {
      pre.push({
        taxId: id,
        taxAmount: itemTax,
      })
    } else {
      const taxInfo = pre[sameTaxIndex]
      taxInfo.taxAmount = Decimal.add(taxInfo.taxAmount, itemTax).toNumber()
    }
    return pre
  }, [])

  // 传给后台的taxAmount需要保留两位
  const orderTax = beforeRound.map((each) => {
    return {
      ...each,
      taxAmount: roundToPrecision(each.taxAmount),
    }
  })

  // 计算实际总税需要按照实际个税总额
  const totalTax = roundToPrecision(
    beforeRound.reduce((pre, cur) => {
      return roundToPrecision(pre + cur.taxAmount)
    }, 0)
  )
  const itemSizeLanguageList = getGlobalState('itemSizeLanguageList') || []
  const currentLanguage = (
    getI18n()?.language ||
    getStorageValue('emenu_lang', 'en') ||
    'en'
  ).toLocaleLowerCase()

  const resolveDishItem = (item) => {
    const cartItem = {
      taxTempKey: item.taxTempKey,
      saleItemId: item.id,
      displayName: item.name,
      originalSalePrice: roundToPrecision(
        item.priceItem?.price ?? item.price ?? 0
      ),
      price: roundToPrecision(item.priceItem?.price ?? item.price ?? 0),
      sizeID: item.priceItem?.sizeId,
      quantity: item.count,
      // taxIds: item.taxIds,
      taxExempt: false,
      privilegeId: item.privilegeId,
      expiration: item.expiration,
      benefitPrice: item?.benefitPrice,
    }
    if (cartItem.sizeID) {
      const sizeName = getItemSizeNameByLanguage(
        cartItem.sizeID,
        itemSizeLanguageList,
        currentLanguage
      )
      const size = sizeName || item.priceItem?.size || item.size || ''
      if (size) {
        cartItem.size = size
      }
    }
    if (item.key > 0) {
      cartItem.id = item.key
    }
    let options = []
    let comboSections = []
    item.options?.forEach((optionGroup) => {
      optionGroup?.forEach((option) => {
        if (option.parent?.type === 'combo') {
          let resultArr = null
          // 有详情子菜
          if (option.isSubDishHasDetail) {
            let originalDishItem = { ...option }
            if (
              !(
                (originalDishItem.itemPrices?.length > 1 ||
                  (originalDishItem.itemPrices?.length === 1 &&
                    !isNil(option.parent.mergeDisplay))) &&
                originalDishItem.itemPrices.some(
                  (itemPrice) =>
                    itemPrice.sizeId === originalDishItem.priceItem?.sizeId
                )
              )
            ) {
              originalDishItem.priceItem = originalDishItem.priceItem
                ? {
                    ...originalDishItem.priceItem,
                    sizeId: undefined,
                  }
                : undefined
            }
            const dishItem = resolveDishItem(originalDishItem)
            let beforeResolveCount = Array.isArray(dishItem)
              ? dishItem
              : [dishItem]
            // 下单一个有详情的子菜数量为n个时, 要处理成n个为1的菜 * 主菜的数量
            let subDishInfoList = beforeResolveCount.reduce((pre, cur) => {
              let { quantity } = cur
              if (quantity === 1) {
                return pre.concat({
                  ...cur,
                  quantity: cartItem.quantity,
                })
              }
              const tempSubDish = []
              while (quantity >= 1) {
                tempSubDish.push({
                  ...cur,
                  quantity: cartItem.quantity,
                })
                quantity--
              }
              return pre.concat(tempSubDish)
            }, [])
            resultArr = subDishInfoList
          } else {
            const subDishItem = {
              id: option.key,
              saleItemId: option.id,
              displayName: option.name,
              price:
                (option.freeQuantityCount ?? 0) < (option.count ?? 0)
                  ? option.price
                  : 0,
              quantity: item.count,
            }

            if (
              (option.itemPrices?.length > 1 ||
                (option.itemPrices?.length === 1 &&
                  !isNil(option.parent.mergeDisplay))) &&
              option.itemPrices.some(
                (itemPrice) => itemPrice.sizeId === option.priceItem?.sizeId
              )
            ) {
              const subDishSizeId = option.itemPrices[0].sizeId
              subDishItem.sizeID = subDishSizeId
              if (subDishSizeId) {
                const subDishSizeName = getItemSizeNameByLanguage(
                  subDishSizeId,
                  itemSizeLanguageList,
                  currentLanguage
                )
                const size =
                  subDishSizeName ||
                  option.priceItem?.size ||
                  option.itemPrices?.[0]?.size ||
                  ''
                if (size) {
                  subDishItem.size = size
                }
              }
            }

            // combo子菜支持note/global option
            if (option.options?.length) {
              const options = []
              option.options.forEach((f) => {
                if (
                  (f.optionType === 'NOTE' && f.isCustomOption) ||
                  f.optionType === 'GLOBAL'
                ) {
                  options.push({
                    id: f.key,
                    optionId: f.id,
                    optionName: f.label,
                    optionType: f.optionType,
                    price: f.price,
                    quantity: f.count ?? f.quantity ?? 1,
                    modifierActionId: f.modifierActionId,
                    modifierActionName: f.modifierActionName,
                    qtyVoid: f.qtyVoid,
                  })
                }
              })
              subDishItem.options = options
            }
            resultArr = Array(option.count).fill(subDishItem)
          }

          if (resultArr?.length) {
            const comboSection = comboSections.find(
              (c) => c.id === option.parent.id
            )
            if (comboSection) {
              comboSection.orderItems.push(...resultArr)
            } else {
              comboSections.push({
                id: option.parent.id,
                name: option.parent.label,
                orderItems: resultArr,
              })
            }
          }
        } else if (option.parent?.type === 'option') {
          if (option.onlyFirstLevel) {
            options.push({
              id: option.key,
              optionId: option.id,
              optionName: option.label,
              optionType: 'ITEM',
              price: option.price,
              quantity: option.quantity ?? 1,
              qtyVoid: option.qtyVoid,
              modifierActionId: option.modifierActionId,
              modifierActionName: option.modifierActionName,
              subOptions: option.subOptions?.map((subOtion) => ({
                id: subOtion.id,
                subOptionId: subOtion.subOptionId,
                subOptionName: subOtion.subOptionName,
                optionType: subOtion.optionType,
                price: subOtion.price,
                quantity: subOtion.quantity ?? 1,
                qtyVoid: subOtion.qtyVoid,
                modifierActionId: subOtion.modifierActionId,
                modifierActionName: subOtion.modifierActionName,
              })),
            })
          } else if (option.isSubOption) {
            const prevOption = options.find(
              (o) => o.optionId === option.parent.id
            )
            if (!prevOption) {
              options.push({
                id: option.parent.key,
                optionId: option.parent.id,
                optionName: option.parent.label,
                optionType: 'ITEM',
                price: option.parent.price,
                quantity: option.parent.quantity ?? 1,
                qtyVoid: option.parent.qtyVoid,
                modifierActionId: option.parent.modifierActionId,
                modifierActionName: option.parent.modifierActionName,
                subOptions: [],
              })
            }
            const prevSubOptions = options.find(
              (o) => o.optionId === option.parent.id
            ).subOptions

            const item = {
              id: option.key,
              subOptionId: option.id,
              subOptionName: option.name || option.subOptionName,
              optionType: 'ITEM',
              price: option.price,
              quantity: option.count,
              qtyVoid: option.qtyVoid,
              modifierActionId: option.modifierActionId,
              modifierActionName: option.modifierActionName,
            }

            const noFreeCount = item.quantity - (option.freeQuantityCount ?? 0)

            if (noFreeCount > 0) {
              const noFreeItem = {
                ...item,
                quantity: noFreeCount,
              }
              if (option.freeQuantityCount > 0) {
                prevSubOptions.push(
                  {
                    ...item,
                    price: 0,
                    quantity: option.freeQuantityCount,
                  },
                  noFreeItem
                )
              } else {
                return prevSubOptions.push(noFreeItem)
              }
            } else {
              prevSubOptions.push({
                ...item,
                price: 0,
              })
            }
          }
        } else {
          options.push({
            id: option.key,
            optionId: option.id,
            optionName: option.label,
            optionType: option.optionType,
            price: option.modifierOriginalPrice ?? option.price,
            quantity: option.count ?? option.quantity ?? 1,
            modifierActionId: option.modifierActionId,
            modifierActionName: option.modifierActionName,
            qtyVoid: option.qtyVoid,
            subOptions: option.subOptions?.map((subOption) => ({
              id: subOption.id,
              subOptionId: subOption.subOptionId,
              subOptionName: subOption.subOptionName,
              optionType: subOption.optionType,
              price: subOption.modifierOriginalPrice ?? subOption.price,
              quantity: subOption.quantity ?? 1,
              modifierActionId: subOption.modifierActionId,
              modifierActionName: subOption.modifierActionName,
              qtyVoid: subOption.qtyVoid,
            })),
          })
        }
      })
    })

    // 锅底套餐下单
    if (item.comboCart) {
      comboSections = [
        {
          id: item.sectionId,
          orderItems: getComboSection(item),
        },
      ]
    }
    // 菜品备注
    if (item.instructions) {
      options.push({
        id: item.noteId,
        optionName: item.instructions,
        optionType: 'NOTE',
        price: 0,
        quantity: 1,
      })
    }
    // Detail 调味快照：写入 NOTE，价格计入 option，避免 totalPrice 与行项目不一致导致无法下单
    if (Array.isArray(item.seasoningSnapshots) && item.seasoningSnapshots.length) {
      const actionLabels = {
        ADD: '添加',
        LESS: '少放',
        MORE: '多放',
        NONE: '不要',
      }
      item.seasoningSnapshots.forEach((snap) => {
        if (!snap) return
        const actionLabel = actionLabels[snap.action] || snap.action || ''
        const name = [actionLabel, snap.optionName || snap.optionCode]
          .filter(Boolean)
          .join(' ')
        if (!name) return
        options.push({
          optionName: name,
          optionType: 'NOTE',
          price: Number(snap.transactionPrice) || 0,
          quantity: 1,
        })
      })
    }
    // 积分兑换菜
    const isCrmRewardItem = item.hasOwnProperty('rewardRule')
    if (isCrmRewardItem) {
      cartItem.rewardItem = isCrmRewardItem
      cartItem.price = item.freeItemOriginalPrice
      cartItem.discount = item.freeItemDiscount
      cartItem.discountId = -1
      cartItem.discountRate = 0
      cartItem.discountRateType = 0
      cartItem.discountName = '(Reward Discount)'
    }
    // 菜品折扣
    if (!isCrmRewardItem && typeof item.discount === 'number') {
      cartItem.discount = item.discount
      cartItem.discountID = item.discountID
      cartItem.discountName = item.discountName
      cartItem.discountRate = item.discountRate
      cartItem.discountRateType = item.discountRateType
      cartItem.discountReason = item.discountReason
    }

    // crm集成菜品折扣
    const crmIntegrationDiscountedItemInfo =
      actualDiscountOrderReward?.discountedItemInfoByKey?.[String(item.key)]
    const crmIntegrationItemDiscounts =
      actualDiscountOrderReward?.crmIntegrationBenefit &&
      Array.isArray(crmIntegrationDiscountedItemInfo?.discounts)
        ? crmIntegrationDiscountedItemInfo.discounts
        : []
    if (shouldClearCrmIntegrationDiscountList) {
      cartItem.discountList = '[]'
    } else if (crmIntegrationItemDiscounts.length) {
      cartItem.discountList = JSON.stringify(crmIntegrationItemDiscounts)
    } else if (Array.isArray(item.discountList) && item.discountList.length) {
      //cartItem.discountList = JSON.stringify(item.discountList)
      // 前序下单有折扣 本次下单折扣到其他菜品上了
      cartItem.discountList = '[]'
    }

    const dishItem = {
      ...cartItem,
      options,
      comboOrderDetails: { comboSections },
    }

    const noFreeCount = dishItem.quantity - (item.freeQuantityCount ?? 0)
    if (noFreeCount > 0) {
      const noFreeDishItem = {
        ...dishItem,
        quantity: noFreeCount,
      }
      if (item.freeQuantityCount > 0) {
        return [
          {
            ...dishItem,
            price: 0,
            quantity: item.freeQuantityCount,
          },
          noFreeDishItem,
        ]
      } else {
        return noFreeDishItem
      }
    } else {
      return {
        ...dishItem,
        price: 0,
      }
    }
  }

  const orderDiscountsData =
    orderDiscounts?.length > 0
      ? orderDiscounts.reduce((pre, cur) => {
          if (cur.isDiscount) {
            pre.discount = cur.discount
            pre.discountID = cur.discountID
            pre.discountName = cur.discountName
            pre.discountRate = cur.discountRate
            pre.discountRateType = cur.discountRateType
            pre.discountReason = cur.discountReason
          } else {
            if (pre.orderDiscounts) {
              pre.orderDiscounts.push(cur)
            } else {
              pre.orderDiscounts = [cur]
            }
          }
          return pre
        }, {})
      : {}

  const numOfGuests = buffetNumOfGuests ?? getStorageValue('emenu_partySize', 1)
  const chargeDetail = order.chargeInfo
    ? dealCharge(order.chargeInfo, data.totalPrice, numOfGuests, prevOrder)
    : null
  const isChargeTax =
    configs?.find((each) => each.name === 'IS_CHARGE_TAX')?.value === 'true'
  let newOrder = {
    id: data?.id,
    charge: chargeDetail?.charge,
    orderCharges: chargeDetail?.orderCharges,
    tableId: getStorageValue('emenu_table')?.currentTable?.id,
    tableName: getStorageValue('emenu_table')?.currentTable?.name,
    // 已下单后不能更改userId, 开启排班后优先级大于输入密码, 未开启排班以密码为准
    userId: data.userId ?? userId ?? getStorageValue('emenu_user')?.userId,
    crmMemberId: data.crmMemberId,
    numOfGuests,
    notes: data.instructions,
    productLine: 'EMENU',
    type: 'DINE_IN',
    totalPrice: data.totalPrice ?? 0,
    totalTax: totalTax ?? 0,
    orderTax: orderTax ?? 0,
    status: data?.id ? OrderStatus.PARTIALLY_SUBMITTED : OrderStatus.ORDERED,
    // createTime: Date.now(),
    subOrders: [
      {
        orderItems: data.cart.flatMap((item) => {
          const resolved = resolveDishItem(item)
          return Array.isArray(resolved) ? resolved : [resolved]
        }),
      },
    ],
    ...orderDiscountsData,
  }

  // 给每个 orderItem 添加 taxSnapshot 和 orderItemTaxes
  newOrder.subOrders[0].orderItems = newOrder.subOrders[0].orderItems.map(
    (orderItem) => {
      // 根据 saleItemId 匹配 amountTaxList 中的税项
      const orderItemTaxes = amountTaxList
        .filter(
          (taxItem) =>
            taxItem.dishId === orderItem.saleItemId &&
            taxItem.taxTempKey === orderItem.taxTempKey
        )
        .map((e) => ({
          taxId: e.id,
          taxAmount: e.itemTax,
          taxName: e.name,
          taxRate: e.rate,
          outTaxRate: e.outRate,
          taxIncrease: e.taxIncrease,
          priceLimit: e.priceLimit,
          taxIncreaseRate: e.taxIncreaseRate,
          id: e.taxSnapshotId,
        }))

      return {
        ...orderItem,
        taxSnapshot: true,
        orderItemTaxes,
      }
    }
  )

  /* CRM 相关 */
  // crm 兑换菜信息
  const crmFreeItem = data.cart.find((dish) =>
    dish.hasOwnProperty('rewardRule')
  )
  if (crmFreeItem) {
    const { rewardRule } = crmFreeItem
    const orderRewards = {
      rewardId: rewardRule._id,
      rewardName: rewardRule.rewardName,
      strategy: rewardRule.redeemRule.strategy,
      point: rewardRule.redeemRule.parameters?.points || 0,
      itemId: crmFreeItem.id,
      rewardType: rewardRule.rewardType,
      id: rewardRule.orderRewardId,
    }
    newOrder.orderRewards = [orderRewards]
  }
  // crm集成订单折扣信息
  if (shouldClearCrmIntegrationDiscountList) {
    newOrder.discountList = '[]'
    const clearedGiftOrderDiscountAmount =
      getCrmIntegrationGiftOrderDiscountAmount(prevOrder?.discountList)
    if (clearedGiftOrderDiscountAmount > 0) {
      newOrder.totalPrice = roundToPrecision(
        Number(newOrder.totalPrice || 0) + clearedGiftOrderDiscountAmount
      )
    }
  } else if (actualDiscountOrderReward?.crmIntegrationBenefit) {
    const crmIntegrationOrderDiscountInfo = Array.isArray(
      actualDiscountOrderReward.orderDiscountInfo
    )
      ? actualDiscountOrderReward.orderDiscountInfo
      : []
    if (crmIntegrationOrderDiscountInfo.length) {
      newOrder.discountList = JSON.stringify(crmIntegrationOrderDiscountInfo)
    }
  }
  // crm 兑换折扣信息
  if (
    actualDiscountOrderReward?.crmIntegrationRewardKind ===
    CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
  ) {
    const crmIntegrationOrderDiscountAmount =
      getCrmIntegrationOrderDiscountAmount(newOrder.discountList)
    if (crmIntegrationOrderDiscountAmount > 0) {
      newOrder.totalPrice = Math.max(
        0,
        roundToPrecision(
          (newOrder.totalPrice || 0) - crmIntegrationOrderDiscountAmount
        )
      )
    }
  }
  if (
    actualDiscountOrderReward &&
    !actualDiscountOrderReward.crmIntegrationBenefit
  ) {
    const { rewardDiscount, ...rest } = actualDiscountOrderReward
    newOrder.orderRewards = [...(newOrder.orderRewards || []), rest]
    newOrder.rewardDiscount = rewardDiscount
  }
  // crm 计算积分
  if (data.earningRule && data.crmMemberId) {
    const { type, totalPrice, totalTax, rewardDiscount } = newOrder
    const total = roundToPrecision(totalPrice + totalTax)
    const orderItems = newOrder.subOrders?.[0]?.orderItems
    const orderInfo = {
      type,
      orderItems,
      totalTax,
      totalPrice,
      total,
      rewardDiscount,
    }
    newOrder.point = handleCalculatePoint(orderInfo, data.earningRule)
    newOrder.expiration = JSON.stringify(data.earningRule.expiration)
  }

  // 计算加收算税
  let taxPrice = prevOrder?.totalPrice
    ? order.totalPrice + prevOrder?.totalPrice
    : order.totalPrice
  if (newOrder?.rewardDiscount) {
    taxPrice = taxPrice - newOrder?.rewardDiscount
  }
  const service = chargeDetail?.charge ?? 0
  const serviceTax =
    taxPrice > 0 && totalTax ? (service / taxPrice) * totalTax : 0
  const totalTaxNew = roundToPrecision(totalTax + serviceTax)

  const orderTaxNew = beforeRound.map((each) => {
    const tax = totalTax ? (each.taxAmount / totalTax) * serviceTax : 0
    return {
      ...each,
      taxAmount: roundToPrecision(each.taxAmount + tax),
    }
  })
  newOrder = {
    ...newOrder,
    totalTax: isChargeTax && service > 0 ? (totalTaxNew ?? 0) : (totalTax ?? 0),
    orderTax: isChargeTax && service > 0 ? (orderTaxNew ?? 0) : (orderTax ?? 0),
  }

  /**
   * emenu extra data
   **/
  const storedTableInfo = getStorageValue('emenu_table', {})
  const storedExtraData = parseEmenuKioskExtendedInfo(
    storedTableInfo?.currentOrder?.emenuKioskextendedInfo
  )
  const durationBilling =
    data?.durationBilling ??
    prevOrder?.durationBilling ??
    readDurationBillingSession(storedTableInfo)
  const eMenuExtraData = {
    ...storedExtraData,
    menuClassify: data?.menuClassify,
    emenuMealTimeLimit: data?.emenuMealTimeLimit,
    emenuRestAlertTime: data?.emenuRestAlertTime,
    currentSpecialMenu: data?.currentSpecialMenu,
    notCountAsGuestNumber: data?.notCountAsGuestNumber,
    itemIdList: data?.buffetItemIdList,
    lotteryCount: data?.lotteryCount,
    durationBilling,
    durationBillingPending:
      data?.durationBillingPending ?? storedExtraData.durationBillingPending,
    surcharges: storedExtraData.surcharges ?? [],
  }
  newOrder.emenuKioskextendedInfo = JSON.stringify(eMenuExtraData)

  console.log(`🚀 ~ generatedOrder ~`, newOrder)
  localStorage.setItem('emenu_temporarily_order', JSON.stringify(newOrder))
  return newOrder
}

function handleCalculatePoint(orderInfo, earningRule) {
  const { type, orderItems, totalTax, totalPrice, total, rewardDiscount } =
    orderInfo
  const pointOrderInfo = {
    orderType: type,
    orderItems,
    price: {
      subTotal: totalPrice,
      total,
      charge: 0,
      taxTotal: totalTax,
      tips: 0,
      discount: rewardDiscount ?? 0,
      round: 0,
    },
  }
  const cal = window.PointCalculator.Calculator
  const pointCal = new cal({
    description: 'earning point calc',
    version: '1.0.0',
    createAt: '2023-06-01',
    updateAt: '2023-06-01',
    tasks: [
      {
        description: 'earning calc',
        name: 'earningTask',
      },
    ],
  })
  return pointCal.doEarningCalc(pointOrderInfo, earningRule)
}

export function getComboSection(item) {
  const itemSizeLanguageList = getGlobalState('itemSizeLanguageList') || []
  const currentLanguage = (
    getI18n()?.language ||
    getStorageValue('emenu_lang', 'en') ||
    'en'
  ).toLocaleLowerCase()
  return item.comboCart.map((o) => {
    const comboItem = {
      saleItemId: o.id,
      displayName: o.name,
      price:
        o.freeQuantityCount === o.count ? 0 : (o.priceItem?.price ?? o.price),
      quantity: item.count,
    }
    if (
      (o.itemPrices?.length > 1 ||
        (o.itemPrices?.length === 1 && !isNil(item.mergeDisplay))) &&
      o.itemPrices.some((itemPrice) => itemPrice.sizeId === o.priceItem?.sizeId)
    ) {
      const comboSizeId = o.itemPrices[0].sizeId
      comboItem.sizeID = comboSizeId
      if (comboSizeId) {
        const comboSizeName = getItemSizeNameByLanguage(
          comboSizeId,
          itemSizeLanguageList,
          currentLanguage
        )
        const size =
          comboSizeName || o.priceItem?.size || o.itemPrices?.[0]?.size || ''
        if (size) {
          comboItem.size = size
        }
      }
    }
    if (o.key > 0) {
      comboItem.id = o.key
    }
    let options = []
    o.options?.forEach((optionGroup) => {
      optionGroup?.forEach((option) => {
        if (option.parent?.type === 'option') {
          if (option.onlyFirstLevel) {
            options.push({
              id: option.key,
              optionId: option.id,
              optionName: option.label,
              optionType: 'ITEM',
              price: option.price,
              quantity: option.quantity ?? 1,
              qtyVoid: option.qtyVoid,
              modifierActionId: option.modifierActionId,
              modifierActionName: option.modifierActionName,
              subOptions: option.subOptions?.map((subOtion) => ({
                id: subOtion.id,
                subOptionId: subOtion.subOptionId,
                subOptionName: subOtion.subOptionName,
                optionType: subOtion.optionType,
                price: subOtion.price,
                quantity: subOtion.quantity ?? 1,
                qtyVoid: subOtion.qtyVoid,
                modifierActionId: subOtion.modifierActionId,
                modifierActionName: subOtion.modifierActionName,
              })),
            })
          } else if (option.isSubOption) {
            const prevOption = options.find(
              (o) => o.optionId === option.parent.id
            )
            if (!prevOption) {
              options.push({
                id: option.parent.key,
                optionId: option.parent.id,
                optionName: option.parent.label,
                optionType: 'ITEM',
                price: option.parent.price,
                quantity: option.parent.quantity ?? 1,
                qtyVoid: option.parent.qtyVoid,
                modifierActionId: option.parent.modifierActionId,
                modifierActionName: option.parent.modifierActionName,
                subOptions: [],
              })
            }
            const prevSubOptions = options.find(
              (o) => o.optionId === option.parent.id
            ).subOptions

            const item = {
              id: option.key,
              subOptionId: option.id,
              subOptionName: option.name || option.subOptionName,
              optionType: 'ITEM',
              price: option.price,
              quantity: option.count,
              qtyVoid: option.qtyVoid,
              modifierActionId: option.modifierActionId,
              modifierActionName: option.modifierActionName,
            }

            const noFreeCount = item.quantity - (option.freeQuantityCount ?? 0)

            if (noFreeCount > 0) {
              const noFreeItem = {
                ...item,
                quantity: noFreeCount,
              }
              if (option.freeQuantityCount > 0) {
                prevSubOptions.push(
                  {
                    ...item,
                    price: 0,
                    quantity: option.freeQuantityCount,
                  },
                  noFreeItem
                )
              } else {
                return prevSubOptions.push(noFreeItem)
              }
            } else {
              prevSubOptions.push({
                ...item,
                price: 0,
              })
            }
          }
        } else {
          options.push({
            id: option.key,
            optionId: option.id,
            optionName: option.label,
            optionType: option.optionType,
            price: option.price,
            quantity: option.count ?? option.quantity ?? 1,
            qtyVoid: option.qtyVoid,
            modifierActionId: option.modifierActionId,
            modifierActionName: option.modifierActionName,
            subOptions: option.subOptions?.map((subOption) => ({
              id: subOption.id,
              subOptionId: subOption.subOptionId,
              subOptionName: subOption.subOptionName,
              optionType: subOption.optionType,
              price: subOption.price,
              quantity: subOption.quantity ?? 1,
              qtyVoid: subOption.qtyVoid,
              modifierActionId: subOption.modifierActionId,
              modifierActionName: subOption.modifierActionName,
            })),
          })
        }
      })
    })

    if (o.instructions?.length) {
      options.push({
        id: o.noteId,
        optionName: o.instructions,
        optionType: 'NOTE',
        quantity: 1,
      })
    }
    return { ...comboItem, options }
  })
}

export const dealCharge = (charge, total, numGuest, prevOrder) => {
  let num = numGuest

  const chargeListFilter = charge.filter((i) => {
    return (
      (prevOrder
        ? prevOrder.orderCharges?.find((each) => each.chargeID === i.id)
        : i.triggerMode === 1) &&
      i.type === 'SERVICE' &&
      i.active &&
      i.minGuest <= num &&
      i.minConsumption <= total
    )
  })

  if (chargeListFilter.length <= 0) return {}

  let service = 0
  //按人数顺序排加收策略，取最后一个加收策略
  const chargeListSort = chargeListFilter.sort(
    (a, b) => a.minGuest - b.minGuest
  )
  let returnObj = chargeListSort[chargeListSort.length - 1]
  if (returnObj?.rateType === 2) {
    service = (total * returnObj.rate) / 100
  } else {
    service = returnObj?.rate
  }

  // setStorageValue('emenu_charge', { ...returnObj, charge: service })
  const systemConfig = getStorageValue('emenu_system')
  const chargeTax = systemConfig.find((each) => each.name === 'IS_CHARGE_TAX')
  return {
    orderCharges: [
      {
        chargeID: returnObj.id,
        id: returnObj.id,
        chargeName: returnObj.name,
        chargeRateType: returnObj.rateType,
        chargeRate: returnObj.rate,
        type: returnObj.type,
        triggerMode: returnObj.triggerMode,
        orderType: 'DINE_IN',
        minConsumption: returnObj.minConsumption,
        minGuest: returnObj.minGuest,
        minMileage: returnObj.minMileage,
        sharedTip: returnObj.sharedTip,
        taxed: chargeTax?.value === 'true', // returnObj.taxed,
        taxCharge: '0',
        charge: service,
        description: returnObj.description,
      },
    ],
    charge: service,
  }
}

export function sortOrders(orderList) {
  // 先按照id排
  const sortById = cloneDeep(orderList).sort((a, b) => {
    return a.id - b.id
  })
  // 处理子母单关系
  const resolveOrder = sortById.reduce((pre, cur) => {
    if (!cur.parentOrderId) {
      pre.push({ ...cur, children: [] })
    } else {
      const idx = pre?.findIndex((each) => each.id === cur.parentOrderId)
      if (idx === -1) {
        pre.push({
          id: cur.parentOrderId,
          children: [{ ...cur, isParentOrderInOtherTable: true }],
          isInOtherTable: true,
        })
      } else {
        pre?.[idx].children.push(cur)
      }
    }
    return pre
  }, [])
  // 把子单插入到母单后
  const finalOrder = []
  resolveOrder.forEach((each) => {
    finalOrder.push(each)
    if (each.children.length) {
      each.children.forEach((child) => {
        finalOrder.push(child)
      })
    }
  })

  return finalOrder
}

// 重新计算折扣率
function reCountDiscountRate(orderItems, notEligibleId, actualDiscount) {
  const eligiblePrice = orderItems
    .filter((orderItem) => !notEligibleId.includes(orderItem.id))
    ?.reduce((pre, cur) => {
      return roundToPrecision(pre + (cur.realPrice ?? cur.price) * cur.count)
    }, 0)
  return roundToPrecision(1 - actualDiscount / eligiblePrice, 4)
}

// 给菜品打折，重新计算菜价
function afterDiscountDish(itemList, notEligibleId, rewardDiscountRate) {
  const itemListWithDiscountPrice = itemList.map((each) =>
    countActualPrice(each, notEligibleId, rewardDiscountRate)
  )
  return itemListWithDiscountPrice
}

function countActualPrice(item, notEligibleId, rewardDiscountRate) {
  if (notEligibleId.includes(item.id)) {
    return item
  }
  return {
    ...item,
    price: roundToPrecision(item.price * rewardDiscountRate),
    realPrice: roundToPrecision(item.realPrice * rewardDiscountRate),
  }
}

export function dealTimeAlert(
  { isOpenAlert, alertTime },
  { isOpenDuration, durationTime }
) {
  let res = {}
  if (
    isOpenDuration &&
    isOpenAlert &&
    typeof alertTime === 'number' &&
    typeof durationTime === 'number'
  ) {
    res.emenuMealTimeLimit = durationTime * 60 * 1000
    res.emenuRestAlertTime = alertTime * 60 * 1000
  }
  return res
}
