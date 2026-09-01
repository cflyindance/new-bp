import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  selectedBenefit: null,
  selectedBenefitValidation: null,
  isOrderDiscountSyncSuspended: false,
}

export const crmIntegrationValidationSlice = createSlice({
  name: 'crmIntegrationValidationSlice',
  initialState,
  reducers: {
    setSelectedBenefit(state, action) {
      state.selectedBenefit = action.payload || null
      state.selectedBenefitValidation = null
    },
    setValidatedSelectedBenefit(state, action) {
      state.selectedBenefit = action.payload || null
    },
    setSelectedBenefitValidation(state, action) {
      state.selectedBenefitValidation = action.payload || null
    },
    clearSelectedBenefitValidation(state) {
      state.selectedBenefitValidation = null
    },
    clearSelectedBenefit(state) {
      state.selectedBenefit = null
      state.selectedBenefitValidation = null
    },
    setOrderDiscountSyncSuspended(state, action) {
      state.isOrderDiscountSyncSuspended = !!action.payload
    },
    clearSelectedBenefitById(state, action) {
      if (state.selectedBenefit?.id === action.payload) {
        state.selectedBenefit = null
        state.selectedBenefitValidation = null
      }
    },
    resetCrmIntegrationValidation() {
      return { ...initialState }
    },
  },
})

export default crmIntegrationValidationSlice.reducer
export const actions = crmIntegrationValidationSlice.actions
