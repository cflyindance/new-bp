import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  configFile: './vite.config.js',
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const {
    CRM_INTEGRATION_BENEFIT_SELECTION_ACTION,
    resolveCrmIntegrationBenefitSelection,
  } = await server.ssrLoadModule('/src/utils/crmIntegrationBenefitSelection.js')

  const reward = { id: 'crm-integration-reward-rule-1' }
  const voucher = { id: 'crm-integration-voucher-rule-1' }

  assert.equal(
    resolveCrmIntegrationBenefitSelection(null, reward),
    CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.SELECT
  )
  assert.equal(
    resolveCrmIntegrationBenefitSelection(reward, reward),
    CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.CLEAR
  )
  assert.equal(
    resolveCrmIntegrationBenefitSelection(reward, voucher),
    CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.BLOCK
  )
  assert.equal(
    resolveCrmIntegrationBenefitSelection(reward, null),
    CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.BLOCK
  )

  console.log('crmIntegrationBenefitSelection tests passed')
} finally {
  await server.close()
}
