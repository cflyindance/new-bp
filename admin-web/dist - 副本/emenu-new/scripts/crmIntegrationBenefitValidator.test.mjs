import assert from 'node:assert/strict'
import { createServer } from 'vite'

function createMarketSDKMock() {
  const calls = {
    getCouponPlugin: [],
    marketGetOrderCoupons: 0,
  }

  return {
    calls,
    async getCouponPlugin(args) {
      calls.getCouponPlugin.push(args)
      return {
        async MarketGetOrderCoupons() {
          calls.marketGetOrderCoupons += 1
          return {
            formattedOrder: { orderId: 'formatted-order' },
            data: [
              {
                coupon: args.coupons[0],
                isValid: false,
                invalidReason: [
                  {
                    en: 'Minimum quantity not met',
                    'zh-cn': '未满足最低数量',
                  },
                ],
                result: [
                  {
                    calculatedOrder: {
                      discounts: [{ amount: 3.25 }],
                    },
                  },
                ],
              },
            ],
          }
        },
      }
    },
  }
}

async function loadValidator(marketSDKMock) {
  globalThis.__crmIntegrationBenefitValidatorMarketSDKMock = marketSDKMock

  const server = await createServer({
    configFile: './vite.config.js',
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [
      {
        name: 'mock-crm-integration-market-sdk',
        enforce: 'pre',
        resolveId(id) {
          if (id === '@/services/crmIntegrationMarketSDK') {
            return '\0mock-crm-integration-market-sdk'
          }
          return null
        },
        load(id) {
          const normalizedId = id.replaceAll('\\', '/')
          if (
            id === '\0mock-crm-integration-market-sdk' ||
            normalizedId.endsWith('/src/services/crmIntegrationMarketSDK.js')
          ) {
            return `
              const crmIntegrationMarketSDK = globalThis.__crmIntegrationBenefitValidatorMarketSDKMock
              export default crmIntegrationMarketSDK
            `
          }
          return null
        },
      },
    ],
  })

  const module = await server.ssrLoadModule(
    '/src/services/crmIntegrationBenefitValidator.js'
  )
  return { server, ...module }
}

const marketSDKMock = createMarketSDKMock()
const {
  server,
  getCrmIntegrationSelectedBenefitCoupon,
  validateCrmIntegrationSelectedBenefit,
  formatCrmIntegrationInvalidReason,
} = await loadValidator(marketSDKMock)

try {
  const rewardBenefit = {
    id: 'crm-integration-reward-rule-1',
    crmIntegrationVoucher: false,
    rawReward: {
      ruleId: 'reward-rule-1',
      couponTemplate: { id: 'reward-template-1' },
    },
  }
  const voucherBenefit = {
    id: 'crm-integration-voucher-rule-1',
    crmIntegrationVoucher: true,
    rawVoucher: {
      rewardRule: {
        ruleId: 'voucher-rule-1',
        couponTemplate: { id: 'voucher-template-1' },
      },
    },
  }

  assert.equal(
    getCrmIntegrationSelectedBenefitCoupon(rewardBenefit).ruleId,
    'reward-rule-1'
  )
  assert.equal(
    getCrmIntegrationSelectedBenefitCoupon(voucherBenefit).ruleId,
    'voucher-rule-1'
  )
  assert.throws(
    () => getCrmIntegrationSelectedBenefitCoupon({ id: 'missing-raw' }),
    /Missing CRM integration selected benefit coupon/
  )

  const validation = await validateCrmIntegrationSelectedBenefit({
    selectedBenefit: voucherBenefit,
    metaData: [{ id: 'meta-1' }],
    allItems: [{ id: 1, count: 1 }],
  })

  assert.equal(marketSDKMock.calls.getCouponPlugin.length, 1)
  assert.equal(
    marketSDKMock.calls.getCouponPlugin[0].coupons[0].ruleId,
    'voucher-rule-1'
  )
  assert.equal(marketSDKMock.calls.getCouponPlugin[0].metas[0].id, 'meta-1')
  assert.equal(marketSDKMock.calls.getCouponPlugin[0].allItems[0].id, 1)
  assert.equal(marketSDKMock.calls.marketGetOrderCoupons, 1)
  assert.equal(validation.isValid, false)
  assert.equal(validation.actualDiscount, 3.25)
  assert.equal(validation.formattedOrder.orderId, 'formatted-order')
  assert.equal(
    formatCrmIntegrationInvalidReason(validation.invalidReason, 'zh_cn'),
    '未满足最低数量'
  )

  console.log('crmIntegrationBenefitValidator tests passed')
} finally {
  await server.close()
}
