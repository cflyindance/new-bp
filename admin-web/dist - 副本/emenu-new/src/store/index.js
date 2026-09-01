import { configureStore } from '@reduxjs/toolkit'
import systemConfigSlice from './slices/systemConfig.slice'
import system from './slices/system.slice'
import crmProviderSlice from './slices/crmProvider.slice'
import crmIntegrationValidationSlice from './slices/crmIntegrationValidation.slice'

export default configureStore({
  reducer: {
    systemConfigSlice,
    system,
    crmProviderSlice,
    crmIntegrationValidationSlice,
  },
})
