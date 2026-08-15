import request from '@/utils/request'
import { getStorageValue } from '@/utils/storage'
import { getRuntimeEnv } from '@/utils/runtimeEnv'

export const CRM_INTEGRATION_META_REFRESH_INTERVAL = 30 * 60 * 1000

const TOKEN_REFRESH_BUFFER = 60 * 1000
const DEFAULT_CHANNEL_CODE = 'EMENU'

const apiMap = {
  DEV: 'https://cloud.menusifudev.com/api/crm-integration',
  QA: 'https://cloud.menusifucloudqa.com/api/crm-integration',
  PROD: 'https://cloud.menusifucloud.com/api/crm-integration',
}

function getHost() {
  const runtimeEnv = getRuntimeEnv()
  const host = apiMap[runtimeEnv]

  if (!host) {
    throw new Error(`Unsupported CRM integration environment: ${runtimeEnv}`)
  }

  return host
}

function unwrapResponseData(response) {
  if (response?.data?.data !== undefined) return response.data.data
  if (response?.data !== undefined) return response.data
  return response
}

class CRMIntegrationClient {
  constructor() {
    this.token = null
    this.tokenExpireAt = 0
    this.refreshTokenPromise = null
    this.merchantId = null
    this.metaData = null
    this.metaFetchedAt = 0
    this.metaRefreshTimer = null
  }

  setMerchantId(merchantId) {
    this.merchantId = merchantId
  }

  getMerchantId() {
    return this.merchantId || getStorageValue('emenu_company')?.merchantId || ''
  }

  isTokenValid() {
    return (
      this.token &&
      this.tokenExpireAt &&
      Date.now() < Number(this.tokenExpireAt) - TOKEN_REFRESH_BUFFER
    )
  }

  async refreshToken() {
    if (this.refreshTokenPromise) return this.refreshTokenPromise

    this.refreshTokenPromise = request({
      url: `/crmToken/getToken`,
      method: 'get',
    })
      .then((response) => {
        const data = unwrapResponseData(response)
        const token = data?.token
        const expiredTime = Number(data?.expiredTime || 0)

        if (!token || !expiredTime) {
          throw new Error('Failed to refresh CRM integration token')
        }

        this.token = token
        this.tokenExpireAt = expiredTime
        return token
      })
      .finally(() => {
        this.refreshTokenPromise = null
      })

    return this.refreshTokenPromise
  }

  async getValidToken(options = {}) {
    const { force = false } = options
    if (!force && this.isTokenValid()) return this.token
    return this.refreshToken()
  }

  getAuthHeaders(token) {
    const merchantId = this.getMerchantId()

    if (!merchantId) {
      throw new Error('Missing CRM integration merchantId')
    }

    return {
      'x-api-token': token,
      'x-merchant-id': merchantId,
    }
  }

  async requestWithToken(config) {
    const token = await this.getValidToken()
    const requestConfig = {
      ...config,
      headers: {
        ...(config.headers || {}),
        ...this.getAuthHeaders(token),
      },
    }

    const response = await request(requestConfig)
    return unwrapResponseData(response)
  }

  searchCustomers(params) {
    return this.requestWithToken({
      url: `${getHost()}/integration/customers/search`,
      method: 'get',
      params,
      data: {},
    })
  }

  getCustomerAssets(customerId) {
    return this.requestWithToken({
      url: `${getHost()}/integration/promotion/assets`,
      method: 'get',
      params: { customerId },
      data: {},
    })
  }

  getCustomerInfo(id) {
    return this.requestWithToken({
      url: `${getHost()}/integration/customers/get`,
      method: 'get',
      params: { id },
      data: {},
    })
  }

  createNewCustomer(data) {
    return this.requestWithToken({
      url: `${getHost()}/integration/customers/create`,
      method: 'post',
      data: {
        channelCode: DEFAULT_CHANNEL_CODE,
        ...data,
      },
    })
  }

  getMerchantReward() {
    return this.requestWithToken({
      url: `${getHost()}/integration/promotion/reward`,
      method: 'get',
      data: {},
    })
  }

  isMetaFresh() {
    return (
      this.metaData &&
      this.metaFetchedAt &&
      Date.now() - this.metaFetchedAt < CRM_INTEGRATION_META_REFRESH_INTERVAL
    )
  }

  async refreshSDKMeta() {
    const response = await request({
      url: `/promotion/runtime/couponTemplate/querySdkMetas`,
      method: 'get',
      data: {},
      headers: {},
    })
    const metaData = unwrapResponseData(response)

    this.metaData = metaData
    this.metaFetchedAt = Date.now()
    return metaData
  }

  async getSDKMeta(options = {}) {
    const { force = false } = options
    if (!force && this.isMetaFresh()) return this.metaData
    return this.refreshSDKMeta()
  }

  startMetaRefresh(onMeta, onError, options = {}) {
    const { immediate = true } = options
    this.stopMetaRefresh()

    const refresh = async () => {
      try {
        const metaData = await this.getSDKMeta({ force: true })
        onMeta?.(metaData)
        return metaData
      } catch (error) {
        onError?.(error)
        return null
      }
    }

    if (immediate) {
      refresh()
    }

    this.metaRefreshTimer = window.setInterval(
      refresh,
      CRM_INTEGRATION_META_REFRESH_INTERVAL
    )

    return () => this.stopMetaRefresh()
  }

  stopMetaRefresh() {
    if (this.metaRefreshTimer) {
      window.clearInterval(this.metaRefreshTimer)
      this.metaRefreshTimer = null
    }
  }
}

const crmIntegration = new CRMIntegrationClient()

export default crmIntegration
