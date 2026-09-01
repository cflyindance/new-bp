import { getStorageValue } from '@/utils/storage'

const DEFAULT_PRODUCT_LINE = 'EMENU'
const DEFAULT_BUSINESS_TYPE = 'EMENU'
const DEFAULT_ENVIRONMENT = 'dev'
const GIFT_PROMOTION_TYPE = ['amountGiftItem', 'orderItemGiftItem']
const RECOMMEND_SUCCESS_TYPE = [
  'REACHED_SELECT_ITEMS',
  'REACHED_RECOMMEND',
  'NONE',
]
const GIFT_PROMOTION_INVALID_TYPE = [
  'AMOUNT_TO_DISCOUNT',
  'QUANTITY_TO_DISCOUNT',
]

let orderFormatter = null

function getGlobalMarketApi() {
  if (typeof window === 'undefined') return null
  return window.marketAPI || window.MarketSDK || null
}

export function setCrmIntegrationOrderFormatter(formatter) {
  orderFormatter = formatter
}

export async function formatOrderStructure(options = {}) {
  if (typeof orderFormatter !== 'function') {
    throw new Error('CRM integration order formatter is not configured')
  }
  return orderFormatter(options)
}

function hasGiftPromotion(promotionList = []) {
  return promotionList.some((promotion) =>
    GIFT_PROMOTION_TYPE.includes(promotion?.type)
  )
}

function isSameOrderItem(orderItem, promotionItem) {
  if (!orderItem || !promotionItem) return false
  const isSameItem = String(orderItem.itemId) === String(promotionItem.itemId)
  if (!isSameItem) return false

  const itemSizeIds = promotionItem.itemSizeIds || []
  if (!itemSizeIds.length) return true
  return itemSizeIds.map(String).includes(String(orderItem.sizeId))
}

function filterAddOnRecommendations(recommendations, order) {
  if (!Array.isArray(recommendations)) return recommendations

  const orderItemInfo = order?.orderItems?.map((item) => ({
    itemId: item.itemId,
    sizeId: item.sizeId,
  }))

  return recommendations.filter((recommendation) => {
    const { recommendType, promotion, orderItemList } = recommendation || {}
    if (recommendType === 'NONE') return true
    if (!GIFT_PROMOTION_TYPE.includes(promotion?.type)) return true
    if (RECOMMEND_SUCCESS_TYPE.includes(recommendType)) return true
    if (!GIFT_PROMOTION_INVALID_TYPE.includes(recommendType)) return false

    return orderItemList?.some((item) =>
      orderItemInfo?.some((orderItem) => isSameOrderItem(orderItem, item))
    )
  })
}

class CrmIntegrationMarketSDK {
  constructor() {
    this.api = null
    this.mountPromise = null
    this.merchantId = null
    this.productLine = DEFAULT_PRODUCT_LINE
    this.businessType = DEFAULT_BUSINESS_TYPE
    this.environment = DEFAULT_ENVIRONMENT
  }

  setMerchantId(merchantId) {
    this.merchantId = merchantId
  }

  getMerchantId() {
    return this.merchantId || getStorageValue('emenu_company')?.merchantId || ''
  }

  setOrderFormatter(formatter) {
    setCrmIntegrationOrderFormatter(formatter)
  }

  createOptions() {
    const merchantId = this.getMerchantId()
    if (!merchantId) {
      throw new Error('Missing CRM integration merchantId for MarketSDK')
    }

    return {
      environment: this.environment,
      cache: {
        ttl: 600,
        prefix: 'promo',
        maxSize: 5000,
      },
      monitor: {
        enabled: false,
      },
      business: {
        type: this.businessType,
        merchantId,
      },
    }
  }

  async createApi() {
    const globalMarketApi = getGlobalMarketApi()
    if (!globalMarketApi) {
      throw new Error('CRM integration MarketSDK global API is missing')
    }
    this.api = globalMarketApi(this.createOptions())
  }

  async mount() {
    if (this.api) return this.api
    if (this.mountPromise) return this.mountPromise

    this.mountPromise = this.createApi()
      .then(async () => {
        try {
          await this.api?.init?.()
          return this.api
        } catch (error) {
          this.api = null
          throw error
        }
      })
      .catch((error) => {
        this.api = null
        throw error
      })
      .finally(() => {
        this.mountPromise = null
      })

    return this.mountPromise
  }

  async unMount() {
    if (this.mountPromise) {
      try {
        await this.mountPromise
      } catch {
        this.api = null
        return
      }
    }
    if (!this.api) return
    const api = this.api
    this.api = null
    await api?.destroy?.()
  }

  async getCouponPlugin({
    coupons,
    metas,
    extraItems,
    allItems,
    selectedBenefit,
    memberInfo,
    orderContext,
  } = {}) {
    const formattedOrder = await formatOrderStructure({
      extraItems,
      allItems,
      selectedBenefit,
      memberInfo,
      orderContext,
    })
    if (!this.api) await this.mount()
    const couponService = this.api?.getCouponPlugin?.()
    console.log('formattedOrder', formattedOrder)
    return {
      MarketGetOrderCoupons: async () => {
        const res = await couponService?.getOrderCoupons?.(
          formattedOrder,
          coupons,
          metas
        )
        console.log('getOrderCoupons res', res)
        return { ...res, formattedOrder }
      },
      MarketValidateCoupons: async () => {
        return couponService?.validateCoupons?.(formattedOrder, coupons, metas)
      },
    }
  }

  async getPromotionPlugin() {
    if (!this.api) await this.mount()
    const promotionService = this.api?.getPromotionPlugin?.()

    return {
      GetItemMatchedCampaign: async ({
        orderItemList,
        promotionList,
        orderType,
        appointItemFlag,
        merchantId,
      }) => {
        return promotionService?.matchItemPromotion?.({
          orderItemList,
          promotionList,
          productLine: this.productLine,
          channel: null,
          orderType,
          appointItemFlag,
          merchantId,
        })
      },
      GetItemValidateStatus: async ({ rules, metas, allItems }) => {
        const formattedOrder = await formatOrderStructure({ allItems })
        return promotionService?.getOrderRules?.(formattedOrder, rules, metas)
      },
      AddOnItem: async ({
        promotionResult,
        itemList,
        promotionList,
        appointPromotionId,
        allItems,
      }) => {
        const order = await formatOrderStructure({ allItems })
        if (hasGiftPromotion(promotionList)) {
          delete order.discounts
        }

        const recommendations =
          await promotionService?.recommendOrderPromotion?.({
            order,
            promotionResult,
            itemList,
            promotionList,
            appointPromotionId,
            needPromotionCodes: true,
          })
        return filterAddOnRecommendations(recommendations, order)
      },
    }
  }
}

const crmIntegrationMarketSDK = new CrmIntegrationMarketSDK()

export default crmIntegrationMarketSDK
