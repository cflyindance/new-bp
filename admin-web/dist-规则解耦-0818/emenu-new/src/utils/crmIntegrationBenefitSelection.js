export const CRM_INTEGRATION_BENEFIT_SELECTION_ACTION = {
  SELECT: 'select',
  CLEAR: 'clear',
  BLOCK: 'block',
}

export const CRM_INTEGRATION_BENEFIT_ORDER_FAILURE = {
  NO_ORDER_ITEM: 'noOrderItem',
  POINTS: 'points',
  MIN_SPEND: 'minSpend',
  NO_ELIGIBLE_ORDER_ITEM: 'noEligibleOrderItem',
}

export const CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE = {
  GLOBAL_LIMIT: 'globalLimit',
  LOGIN: 'login',
  ONLY_ONE_BENEFIT: 'onlyOneBenefit',
  ALREADY_APPLIED: 'alreadyApplied',
  LIMIT_REACHED: 'limitReached',
  POINTS: CRM_INTEGRATION_BENEFIT_ORDER_FAILURE.POINTS,
  MIN_SPEND: CRM_INTEGRATION_BENEFIT_ORDER_FAILURE.MIN_SPEND,
  NO_ELIGIBLE_ORDER_ITEM:
    CRM_INTEGRATION_BENEFIT_ORDER_FAILURE.NO_ELIGIBLE_ORDER_ITEM,
  NO_ELIGIBLE_SPEC: 'noEligibleSpec',
}

export const CRM_INTEGRATION_POINT_ITEM_APPLY_MODE = {
  REMOVE: 'remove',
  FINALIZE: 'finalize',
  FULL: 'full',
}

export function resolveCrmIntegrationBenefitSelection(
  selectedBenefit,
  nextBenefit,
  options = {}
) {
  if (!nextBenefit?.id) return CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.BLOCK
  if (!selectedBenefit?.id) {
    return CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.SELECT
  }
  if (selectedBenefit.id === nextBenefit.id) {
    return CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.CLEAR
  }
  if (options.forceReplaceSelectedBenefit === true) {
    return CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.SELECT
  }
  return CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.BLOCK
}

export function resolveCrmIntegrationBenefitOrderFailure(options = {}) {
  const {
    requiredPoints = 0,
    currentPoints = 0,
    minSpend = 0,
    orderAmount = 0,
    requiresOrderItem = false,
    hasOrderItem = true,
    requiresEligibleOrderItem = false,
    hasEligibleOrderItem = true,
  } = options

  if (requiresOrderItem && !hasOrderItem) {
    return CRM_INTEGRATION_BENEFIT_ORDER_FAILURE.NO_ORDER_ITEM
  }
  if (Number(requiredPoints) > Number(currentPoints)) {
    return CRM_INTEGRATION_BENEFIT_ORDER_FAILURE.POINTS
  }
  if (Number(minSpend) > Number(orderAmount)) {
    return CRM_INTEGRATION_BENEFIT_ORDER_FAILURE.MIN_SPEND
  }
  if (requiresEligibleOrderItem && !hasEligibleOrderItem) {
    return CRM_INTEGRATION_BENEFIT_ORDER_FAILURE.NO_ELIGIBLE_ORDER_ITEM
  }
  return null
}

export function resolveCrmIntegrationPointItemPrecheckFailure(options = {}) {
  const {
    crmIntegrationPointItemGlobalLocked,
    isLoggedIn,
    selectionAction,
    hasSubmittedBenefit,
    isSubmittedBenefit,
    limitReached,
    orderFailure,
    hasEligibleSpec,
  } = options

  if (!isLoggedIn) {
    return CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.LOGIN
  }
  if (crmIntegrationPointItemGlobalLocked) {
    return CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.GLOBAL_LIMIT
  }
  if (hasSubmittedBenefit) {
    return CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.GLOBAL_LIMIT
  }
  if (selectionAction === CRM_INTEGRATION_BENEFIT_SELECTION_ACTION.BLOCK) {
    return CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.ONLY_ONE_BENEFIT
  }
  if (isSubmittedBenefit) {
    return CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.ALREADY_APPLIED
  }
  if (limitReached) {
    return CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.LIMIT_REACHED
  }
  if (orderFailure) return orderFailure
  if (!hasEligibleSpec) {
    return CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.NO_ELIGIBLE_SPEC
  }
  return null
}

export function getCrmIntegrationPointItemPrecheckToast(failure, options = {}) {
  const toastMap = {
    [CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.GLOBAL_LIMIT]: {
      key: 'crm.upperLimit',
    },
    [CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.LOGIN]: {
      key: 'crm.loginFirst',
    },
    [CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.ONLY_ONE_BENEFIT]: {
      key: 'crmIntegration.onlyOneBenefitSelectable',
    },
    [CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.ALREADY_APPLIED]: {
      key: 'crmIntegration.cartDiscountAlreadyApplied',
    },
    [CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.LIMIT_REACHED]: {
      key: 'crmIntegration.giftItemLimitReached',
      values: { value: options.maxSelectable },
    },
    [CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.POINTS]: {
      key: 'crm.noEnoughPoint',
    },
    [CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.MIN_SPEND]: {
      key: 'crmIntegration.minSpendNotReached',
      values: { value: `$${Number(options.minSpend || 0).toFixed(2)}` },
    },
    [CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.NO_ELIGIBLE_ORDER_ITEM]: {
      key: 'crmIntegration.noEligibleOrderItems',
    },
    [CRM_INTEGRATION_POINT_ITEM_PRECHECK_FAILURE.NO_ELIGIBLE_SPEC]: {
      key: 'crmIntegration.noEligibleOrderItems',
    },
  }

  return toastMap[failure] || null
}

export function resolveCrmIntegrationPointItemApplyMode(options = {}) {
  if (Number(options.candidateCount || 0) <= 0) {
    return CRM_INTEGRATION_POINT_ITEM_APPLY_MODE.REMOVE
  }
  return options.entryValidated
    ? CRM_INTEGRATION_POINT_ITEM_APPLY_MODE.FINALIZE
    : CRM_INTEGRATION_POINT_ITEM_APPLY_MODE.FULL
}
