import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  configFile: './vite.config.js',
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const sliceModule = await server.ssrLoadModule(
    '/src/store/slices/crmIntegrationValidation.slice.js'
  )
  const reducer = sliceModule.default
  const { actions } = sliceModule

  let state = reducer(undefined, { type: '@@INIT' })
  assert.deepEqual(state, { selectedBenefit: null })

  state = reducer(
    state,
    actions.setSelectedBenefit({
      id: 'crm-integration-reward-rule-1',
      crmIntegrationRewardSource: 'reward',
    })
  )
  assert.equal(state.selectedBenefit.id, 'crm-integration-reward-rule-1')
  assert.equal(state.selectedBenefit.crmIntegrationRewardSource, 'reward')

  state = reducer(state, actions.clearSelectedBenefit())
  assert.deepEqual(state, { selectedBenefit: null })

  state = reducer(
    state,
    actions.setSelectedBenefit({
      id: 'crm-integration-reward-rule-1',
      crmIntegrationRewardSource: 'reward',
    })
  )
  state = reducer(
    state,
    actions.clearSelectedBenefitById('crm-integration-voucher-rule-1')
  )
  assert.equal(state.selectedBenefit.id, 'crm-integration-reward-rule-1')

  state = reducer(
    state,
    actions.clearSelectedBenefitById('crm-integration-reward-rule-1')
  )
  assert.deepEqual(state, { selectedBenefit: null })

  console.log('crmIntegrationValidationSlice tests passed')
} finally {
  await server.close()
}
