import assert from 'node:assert/strict'
import { createServer } from 'vite'

async function loadService() {
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    resolve: {
      alias: {
        '@': `${process.cwd()}/src`,
      },
    },
    server: {
      middlewareMode: true,
    },
  })

  try {
    const mod = await server.ssrLoadModule(
      '/src/services/crmIntegrationMarketSDK.js'
    )
    return { server, ...mod }
  } catch (error) {
    await server.close()
    throw error
  }
}

function createMarketApiMock(state) {
  return (options) => {
    state.lastInitOptions = options
    return {
      async init() {
        state.initCount += 1
      },
      async destroy() {
        state.destroyCount += 1
      },
      getCouponPlugin() {
        return {
          async getOrderCoupons(order, coupons, metas) {
            state.lastCouponArgs = { order, coupons, metas }
            return { data: [{ coupon: coupons[0], result: [] }] }
          },
          async validateCoupons(order, coupons, metas) {
            state.lastValidateCouponArgs = { order, coupons, metas }
            return { order, coupons, metas, validated: true }
          },
        }
      },
      getPromotionPlugin() {
        return {
          async matchItemPromotion(args) {
            state.lastPromotionMatchArgs = args
            return new Map([['item-1', ['promo-1']]])
          },
          async getOrderRules(order, rules, metas) {
            state.lastPromotionRulesArgs = { order, rules, metas }
            return { data: [] }
          },
          async recommendOrderPromotion(args) {
            state.lastPromotionRecommendArgs = args
            return state.recommendations || [{ recommendType: 'NONE' }]
          },
        }
      },
    }
  }
}

function installBrowserMocks(state) {
  globalThis.window = {
    location: { hostname: 'localhost' },
    setTimeout,
    clearTimeout,
    marketAPI: createMarketApiMock(state),
  }
}

const state = {
  initCount: 0,
  destroyCount: 0,
  lastInitOptions: null,
  lastCouponArgs: null,
  lastValidateCouponArgs: null,
  lastPromotionMatchArgs: null,
  lastPromotionRulesArgs: null,
  lastPromotionRecommendArgs: null,
  recommendations: null,
}

installBrowserMocks(state)

const {
  server,
  default: crmIntegrationMarketSDK,
  formatOrderStructure,
} = await loadService()

try {
  await assert.rejects(
    () => formatOrderStructure({}),
    /CRM integration order formatter is not configured/
  )

  crmIntegrationMarketSDK.setMerchantId('M000020684')
  crmIntegrationMarketSDK.setOrderFormatter(async ({ allItems }) => ({
    orderType: 'DINE_IN',
    merchantId: 'M000020684',
    productLine: 'EMENU',
    orderItems: allItems || [],
    discounts: [{ id: 'discount-1' }],
  }))

  await Promise.all([
    crmIntegrationMarketSDK.mount(),
    crmIntegrationMarketSDK.mount(),
  ])

  assert.equal(state.initCount, 1)
  assert.equal(state.lastInitOptions.business.merchantId, 'M000020684')
  assert.equal(state.lastInitOptions.business.type, 'EMENU')
  assert.equal(state.lastInitOptions.cache.ttl, 600)

  const couponPlugin = await crmIntegrationMarketSDK.getCouponPlugin({
    coupons: [{ id: 'coupon-1' }],
    metas: [{ id: 'meta-1' }],
    allItems: [{ itemId: 'item-1' }],
  })
  const couponRes = await couponPlugin.MarketGetOrderCoupons()
  assert.equal(couponRes.formattedOrder.productLine, 'EMENU')
  assert.equal(state.lastCouponArgs.coupons[0].id, 'coupon-1')
  assert.equal(state.lastCouponArgs.metas[0].id, 'meta-1')

  const validateRes = await couponPlugin.MarketValidateCoupons()
  assert.equal(validateRes.validated, true)
  assert.equal(state.lastValidateCouponArgs.order.productLine, 'EMENU')

  const promotionPlugin = await crmIntegrationMarketSDK.getPromotionPlugin()
  const matchRes = await promotionPlugin.GetItemMatchedCampaign({
    orderItemList: [{ itemId: '1' }],
    promotionList: [{ id: 'promo-1' }],
    orderType: 'DINE_IN',
    appointItemFlag: true,
    merchantId: 'M000020684',
  })
  assert.ok(matchRes instanceof Map)
  assert.equal(state.lastPromotionMatchArgs.productLine, 'EMENU')
  assert.equal(state.lastPromotionMatchArgs.channel, null)

  await promotionPlugin.GetItemValidateStatus({
    rules: [{ id: 'rule-1' }],
    metas: [{ id: 'meta-1' }],
    allItems: [{ itemId: 'item-1' }],
  })
  assert.equal(state.lastPromotionRulesArgs.order.productLine, 'EMENU')

  state.recommendations = [
    {
      recommendType: 'NONE',
      promotion: { type: 'amountGiftItem' },
    },
    {
      recommendType: 'REACHED_SELECT_ITEMS',
      promotion: { type: 'amountGiftItem' },
    },
    {
      recommendType: 'AMOUNT_TO_DISCOUNT',
      promotion: { type: 'amountGiftItem' },
      orderItemList: [{ itemId: 'item-1' }],
    },
    {
      recommendType: 'AMOUNT_TO_DISCOUNT',
      promotion: { type: 'amountGiftItem' },
      orderItemList: [{ itemId: 'item-2' }],
    },
    {
      recommendType: 'AMOUNT_TO_DISCOUNT',
      promotion: { type: 'discount' },
      orderItemList: [],
    },
  ]
  const addOnRes = await promotionPlugin.AddOnItem({
    promotionResult: [{ id: 'result-1' }],
    itemList: [{ itemId: 'item-1' }],
    promotionList: [{ id: 'promo-1', type: 'amountGiftItem' }],
    appointPromotionId: 'promo-1',
    allItems: [{ itemId: 'item-1' }],
  })
  assert.equal(state.lastPromotionRecommendArgs.needPromotionCodes, true)
  assert.equal(state.lastPromotionRecommendArgs.order.productLine, 'EMENU')
  assert.equal(state.lastPromotionRecommendArgs.order.discounts, undefined)
  assert.equal(addOnRes.length, 4)

  await crmIntegrationMarketSDK.unMount()
  assert.equal(state.destroyCount, 1)

  window.marketAPI = null
  await assert.rejects(
    () => crmIntegrationMarketSDK.mount(),
    /CRM integration MarketSDK global API is missing/
  )

  console.log('crmIntegrationMarketSDK tests passed')
} finally {
  await server.close()
}
