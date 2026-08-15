import { CRM_PROVIDER } from '@/crm/providerType'
import crmIntegration from '@/services/crmIntegration'
import crmIntegrationMarketSDK from '@/services/crmIntegrationMarketSDK'
import { normalizeCrmIntegrationMember } from '@/utils/crmIntegrationMember'

const EMENU_PRODUCT_LINE = 'EMENU'

function filterEmenuRewards(rewards) {
  if (!Array.isArray(rewards)) return []

  return rewards.filter((reward) =>
    reward?.couponTemplate?.productLine?.includes?.(EMENU_PRODUCT_LINE)
  )
}

export const integrationCrmProvider = {
  id: CRM_PROVIDER.INTEGRATION,
  capabilities: {
    bootstrap: true,
    memberLogin: true,
    redeemItems: false,
    discountRules: false,
    redemptionCommit: false,
  },
  setMerchantId(merchantId) {
    crmIntegration.setMerchantId(merchantId)
    crmIntegrationMarketSDK.setMerchantId(merchantId)
  },
  async fetchBootstrapData(options = {}) {
    const { onMeta, onError } = options
    let marketSDKError = null
    const [rewards, metaData, marketSDKRes] = await Promise.all([
      crmIntegration.getMerchantReward(),
      crmIntegration.getSDKMeta({ force: true }),
      crmIntegrationMarketSDK.mount().then(
        (res) => {
          return res
        },
        (error) => {
          marketSDKError = error
          onError?.(error)
          return null
        }
      ),
    ])

    const stopMetaRefresh = crmIntegration.startMetaRefresh(onMeta, onError, {
      immediate: false,
    })

    return {
      rewards: filterEmenuRewards(rewards),
      metaData,
      marketSDKRes,
      marketSDKError,
      stopMetaRefresh,
      stopMarketSDK: () => crmIntegrationMarketSDK.unMount(),
    }
  },
  async searchMemberByPhone(phone) {
    const response = await crmIntegration.searchCustomers({
      areaCode: 1,
      phone,
    })
    const list = Array.isArray(response) ? response : []
    const customer = list[0]
    if (!customer) return null

    const assets = await this.fetchMemberAssets(customer.id)
    return normalizeCrmIntegrationMember(customer, assets)
  },
  async fetchMemberAssets(customerId) {
    if (!customerId) return {}
    return crmIntegration.getCustomerAssets(customerId)
  },
  async createMemberByPhone(phone) {
    const customerId = await crmIntegration.createNewCustomer({
      areaCode: 1,
      phone,
    })
    if (typeof customerId !== 'string' && typeof customerId !== 'number') {
      return null
    }
    return this.fetchMemberInfo(customerId)
  },
  async fetchMemberInfo(userId) {
    if (!userId) return null

    const customer = await crmIntegration.getCustomerInfo(userId)
    if (!customer) return null

    const customerId = customer.id || customer.userId || userId
    const assets = await this.fetchMemberAssets(customerId)
    return normalizeCrmIntegrationMember(customer, assets)
  },
}
