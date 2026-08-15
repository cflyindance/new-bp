import assert from 'node:assert/strict'
import { createServer } from 'vite'

function createCrmIntegrationMock(overrides = {}) {
  const calls = {
    createNewCustomer: [],
    getCustomerInfo: [],
    getCustomerAssets: [],
    getMerchantReward: [],
    getSDKMeta: [],
    startMetaRefresh: [],
    setMerchantId: [],
  }

  const mock = {
    calls,
    createNewCustomer(data) {
      calls.createNewCustomer.push(data)
      return 'created-customer-id'
    },
    getCustomerInfo(id) {
      calls.getCustomerInfo.push(id)
      return {
        id,
        phone: '2135550000',
      }
    },
    getCustomerAssets(customerId) {
      calls.getCustomerAssets.push(customerId)
      return {
        loyaltyAccount: {
          pointBalance: 188,
        },
        vouchers: [],
      }
    },
    setMerchantId(merchantId) {
      calls.setMerchantId.push(merchantId)
    },
    getMerchantReward() {
      calls.getMerchantReward.push({})
      return [
        {
          id: 'reward-emenu',
          couponTemplate: {
            productLine: ['EMENU'],
          },
        },
        {
          id: 'reward-kiosk',
          couponTemplate: {
            productLine: ['KIOSK'],
          },
        },
      ]
    },
    getSDKMeta(options) {
      calls.getSDKMeta.push(options)
      return { meta: true }
    },
    startMetaRefresh(onMeta, onError, options) {
      calls.startMetaRefresh.push({ onMeta, onError, options })
      return () => {
        calls.stopMetaRefresh = true
      }
    },
    ...overrides,
  }

  return mock
}

function createMarketSDKMock(overrides = {}) {
  const calls = {
    setMerchantId: [],
    mount: [],
    unMount: [],
  }

  const mock = {
    calls,
    setMerchantId(merchantId) {
      calls.setMerchantId.push(merchantId)
    },
    mount() {
      calls.mount.push({})
      return Promise.resolve({})
    },
    unMount() {
      calls.unMount.push({})
      return Promise.resolve()
    },
    ...overrides,
  }

  return mock
}

async function loadIntegrationCrmProvider(
  mock,
  marketSDKMock = createMarketSDKMock()
) {
  globalThis.__integrationCrmProviderTestMock = mock
  globalThis.__integrationCrmMarketSDKProviderTestMock = marketSDKMock

  const server = await createServer({
    configFile: './vite.config.js',
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [
      {
        name: 'mock-crm-integration-service',
        enforce: 'pre',
        resolveId(id) {
          if (id === '@/services/crmIntegration') {
            return '\0mock-crm-integration-service'
          }
          if (id === '@/services/crmIntegrationMarketSDK') {
            return '\0mock-crm-integration-market-sdk-service'
          }
          return null
        },
        load(id) {
          const normalizedId = id.replaceAll('\\', '/')
          if (
            id === '\0mock-crm-integration-service' ||
            normalizedId.endsWith('/src/services/crmIntegration.js')
          ) {
            return `
              const crmIntegration = globalThis.__integrationCrmProviderTestMock
              export default crmIntegration
            `
          }
          if (
            id === '\0mock-crm-integration-market-sdk-service' ||
            normalizedId.endsWith('/src/services/crmIntegrationMarketSDK.js')
          ) {
            return `
              const crmIntegrationMarketSDK = globalThis.__integrationCrmMarketSDKProviderTestMock
              export default crmIntegrationMarketSDK
            `
          }
          return null
        },
      },
    ],
  })

  const module = await server.ssrLoadModule(
    '/src/crm/providers/integrationCrmProvider.js'
  )

  return {
    server,
    provider: module.integrationCrmProvider,
  }
}

{
  const mock = createCrmIntegrationMock()
  const marketSDKMock = createMarketSDKMock()
  const { server, provider } = await loadIntegrationCrmProvider(
    mock,
    marketSDKMock
  )

  try {
    const member = await provider.createMemberByPhone('2135550000')

    assert.deepEqual(mock.calls.createNewCustomer, [
      {
        areaCode: 1,
        phone: '2135550000',
      },
    ])
    assert.deepEqual(mock.calls.getCustomerInfo, ['created-customer-id'])
    assert.equal(member.id, 'created-customer-id')
    assert.equal(member.userId, 'created-customer-id')
    assert.equal(member.pointBalance, 188)
  } finally {
    await server.close()
  }
}

{
  const mock = createCrmIntegrationMock()
  const marketSDKMock = createMarketSDKMock()
  const { server, provider } = await loadIntegrationCrmProvider(
    mock,
    marketSDKMock
  )

  try {
    provider.setMerchantId('M000020684')
    const bootstrapData = await provider.fetchBootstrapData()

    assert.deepEqual(marketSDKMock.calls.setMerchantId, ['M000020684'])
    assert.equal(marketSDKMock.calls.mount.length, 1)
    assert.equal(mock.calls.getSDKMeta[0].force, true)
    assert.equal(mock.calls.startMetaRefresh[0].options.immediate, false)
    assert.deepEqual(
      bootstrapData.rewards.map((reward) => reward.id),
      ['reward-emenu']
    )

    await bootstrapData.stopMarketSDK()
    assert.equal(marketSDKMock.calls.unMount.length, 1)
  } finally {
    await server.close()
  }
}

{
  const sdkError = new Error('market sdk failed')
  const mock = createCrmIntegrationMock()
  const marketSDKMock = createMarketSDKMock({
    mount() {
      marketSDKMock.calls.mount.push({})
      return Promise.reject(sdkError)
    },
  })
  const { server, provider } = await loadIntegrationCrmProvider(
    mock,
    marketSDKMock
  )
  const errors = []

  try {
    const bootstrapData = await provider.fetchBootstrapData({
      onError(error) {
        errors.push(error)
      },
    })

    assert.equal(bootstrapData.marketSDKError, sdkError)
    assert.deepEqual(errors, [sdkError])
    assert.deepEqual(
      bootstrapData.rewards.map((reward) => reward.id),
      ['reward-emenu']
    )
    assert.equal(mock.calls.getSDKMeta[0].force, true)
  } finally {
    await server.close()
  }
}

{
  const mock = createCrmIntegrationMock({
    createNewCustomer(data) {
      mock.calls.createNewCustomer.push(data)
      return { id: 'unsupported-object-id' }
    },
  })
  const { server, provider } = await loadIntegrationCrmProvider(mock)

  try {
    const member = await provider.createMemberByPhone('2135550000')

    assert.equal(member, null)
    assert.deepEqual(mock.calls.getCustomerInfo, [])
  } finally {
    await server.close()
  }
}

console.log('integrationCrmProvider member tests passed')
