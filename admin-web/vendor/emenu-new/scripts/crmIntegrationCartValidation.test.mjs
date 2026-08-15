import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  configFile: './vite.config.js',
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const {
    buildCrmIntegrationCartSignature,
    getCrmIntegrationValidationCart,
    removeCrmIntegrationBenefitCartItems,
  } = await server.ssrLoadModule('/src/utils/crmIntegrationCartValidation.js')

  const cartA = [
    {
      key: 'b',
      id: 2,
      count: 1,
      price: 8,
      realPrice: 7,
      priceItem: { sizeId: 22 },
      instructions: 'extra spicy',
    },
    {
      key: 'a',
      id: 1,
      count: 2,
      price: 5,
      realPrice: 5,
      instructions: 'no onion',
    },
    {
      key: 'buffet',
      id: 9,
      count: 10,
      price: 0,
      isBuffetItem: true,
    },
  ]
  const cartB = [
    {
      key: 'a',
      id: 1,
      count: 2,
      price: 5,
      realPrice: 5,
      instructions: 'changed note',
    },
    {
      key: 'b',
      id: 2,
      count: 1,
      price: 8,
      realPrice: 7,
      priceItem: { sizeId: 22 },
    },
  ]
  const cartC = [
    {
      key: 'a',
      id: 1,
      count: 3,
      price: 5,
      realPrice: 5,
    },
    {
      key: 'b',
      id: 2,
      count: 1,
      price: 8,
      realPrice: 7,
      priceItem: { sizeId: 22 },
    },
  ]

  assert.equal(
    buildCrmIntegrationCartSignature(cartA),
    buildCrmIntegrationCartSignature(cartB)
  )
  assert.notEqual(
    buildCrmIntegrationCartSignature(cartA),
    buildCrmIntegrationCartSignature(cartC)
  )
  assert.deepEqual(
    getCrmIntegrationValidationCart(cartA).map((item) => item.key),
    ['b', 'a']
  )

  const selectedBenefit = {
    id: 'crm-integration-reward-rule-1',
  }
  const cartWithBenefitItem = [
    { key: 'normal', id: 1, count: 1 },
    {
      key: 'benefit',
      id: 2,
      count: 1,
      crmIntegrationBenefitId: 'crm-integration-reward-rule-1',
    },
  ]
  const cleanedCart = removeCrmIntegrationBenefitCartItems(
    cartWithBenefitItem,
    selectedBenefit
  )
  assert.deepEqual(
    cleanedCart.map((item) => item.key),
    ['normal']
  )

  const untouchedCart = removeCrmIntegrationBenefitCartItems(
    cartWithBenefitItem,
    {
      id: 'other-benefit',
    }
  )
  assert.equal(untouchedCart, cartWithBenefitItem)

  console.log('crmIntegrationCartValidation tests passed')
} finally {
  await server.close()
}
