import { createSlice } from '@reduxjs/toolkit'
import { CRM_PROVIDER } from '@/crm/providerType'

export const crmProviderSlice = createSlice({
  name: 'crmProviderSlice',
  initialState: {
    providerType: CRM_PROVIDER.NONE,
    integrationStatus: 'idle',
    integrationError: '',
    rewards: [],
    validRewards: [],
    validVouchers: [],
    metaData: null,
    metaUpdatedAt: 0,
  },
  reducers: {
    setProviderType(state, action) {
      state.providerType = action.payload
    },
    setIntegrationLoading(state) {
      state.integrationStatus = 'loading'
      state.integrationError = ''
    },
    setIntegrationBootstrapData(state, action) {
      state.integrationStatus = 'success'
      state.integrationError = ''
      state.rewards = action.payload.rewards || []
      state.metaData = action.payload.metaData || null
      state.metaUpdatedAt = action.payload.metaData ? Date.now() : 0
    },
    setIntegrationValidBenefits(state, action) {
      state.validRewards = action.payload.validRewards || []
      state.validVouchers = action.payload.validVouchers || []
    },
    setIntegrationMeta(state, action) {
      state.metaData = action.payload || null
      state.metaUpdatedAt = Date.now()
    },
    setIntegrationError(state, action) {
      state.integrationStatus = 'error'
      state.integrationError = action.payload || ''
    },
  },
})

export default crmProviderSlice.reducer
export const actions = crmProviderSlice.actions
