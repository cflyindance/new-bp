import { useEffect, useMemo, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Toast from '@/components/Toast'
import { CRM_PROVIDER } from '@/crm'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import useCrmIntegrationBenefitAutoValidation from '@/hooks/useCrmIntegrationBenefitAutoValidation'
import useCrmIntegrationBenefitSelection from '@/hooks/useCrmIntegrationBenefitSelection'
import crmIntegrationMarketSDK from '@/services/crmIntegrationMarketSDK'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'
import {
  buildCrmIntegrationPointItemCart,
  getCrmIntegrationCurrentOrderItems,
  getCrmIntegrationPointBenefitCartItems,
  getCrmIntegrationPointBenefitSubmittedItems,
  hasCrmIntegrationRedemptionItemInCart,
  hasCrmIntegrationPointItemRedemption,
  isCrmIntegrationRedemptionItemCartItem,
  resolveCrmIntegrationPointItemCandidates,
} from '@/utils/crmIntegrationCartValidation'
import {
  CRM_INTEGRATION_POINT_ITEM_APPLY_MODE,
  resolveCrmIntegrationPointItemApplyMode,
} from '@/utils/crmIntegrationBenefitSelection'
import { formatCrmIntegrationOrderStructure } from '@/utils/crmIntegrationOrderFormatter'
import {
  buildCrmIntegrationRedeemMenu,
  flattenCrmIntegrationPointItems,
  getCrmIntegrationBenefitRuleId,
  groupCrmIntegrationVoucherBenefitsForDisplay,
  isCrmIntegrationOrderDiscountBenefit,
} from '@/utils/crmIntegrationRewards'
import { getStorageValue } from '@/utils/storage'

function getSubmittedCrmIntegrationDiscountIds(orders) {
  if (!Array.isArray(orders)) return []

  const ids = orders.flatMap((order) => {
    const discountList = Array.isArray(order?.discountList)
      ? order.discountList
      : []
    return discountList.map((discount) => discount?.id).filter(Boolean)
  })

  return Array.from(new Set(ids.map(String)))
}

function getStableStringArrayKey(values) {
  if (!Array.isArray(values)) return '[]'

  const uniqueValues = Array.from(
    new Set(values.filter(Boolean).map(String))
  ).sort()

  return JSON.stringify(uniqueValues)
}

export async function runCrmIntegrationBenefitStageValidation(options = {}) {
  if (typeof options.validateBeforePending !== 'function') return false
  if (!(await options.validateBeforePending())) return false
  if (options.includeSdk === false) return true
  if (typeof options.validateSdk !== 'function') return false
  return (await options.validateSdk()) === true
}

export function resolveCrmIntegrationPointItemStageState(options = {}) {
  const { draft, benefit, item } = options
  const draftBenefitId = draft?.benefit?.id
  const isCurrentBenefit =
    !!benefit?.id && String(draftBenefitId) === String(benefit.id)
  const draftCandidates =
    isCurrentBenefit && Array.isArray(draft?.candidates) ? draft.candidates : []
  const submittedBenefitItems = Array.isArray(options.submittedBenefitItems)
    ? options.submittedBenefitItems
    : []
  const selectedTotal = [...draftCandidates, ...submittedBenefitItems].reduce(
    (total, candidate) => total + Number(candidate?.count || 0),
    0
  )
  const maxSelectable = item?.crmIntegrationMaxSelectable

  return {
    selectedTotal,
    maxSelectable,
    limitReached:
      Number.isFinite(maxSelectable) && selectedTotal >= maxSelectable,
  }
}

export function buildCrmIntegrationRedemptionDraftApply(options = {}) {
  const { cart, draft } = options
  if (draft?.providerType !== CRM_PROVIDER.INTEGRATION || !draft?.benefit?.id) {
    return null
  }
  const cartItems = Array.isArray(cart) ? cart : []
  const replaceAppliedRedemptionItems = !!draft.replaceAppliedRedemptionItems

  const candidates = (
    Array.isArray(draft.candidates) ? draft.candidates : []
  ).filter((candidate) => Number(candidate?.count || 0) > 0)

  const replaceGiftItemDiscountId = getCrmIntegrationBenefitRuleId(
    draft.benefit
  )
  if (!replaceGiftItemDiscountId) return null

  const currentBenefitItems = getCrmIntegrationPointBenefitCartItems(
    cartItems,
    draft.benefit
  )
  const hasAppliedRedemptionItems =
    replaceAppliedRedemptionItems &&
    cartItems.some(isCrmIntegrationRedemptionItemCartItem)
  if (
    !candidates.length &&
    !currentBenefitItems.length &&
    !hasAppliedRedemptionItems
  ) {
    return null
  }

  const submittedBenefitItems = Array.isArray(options.submittedBenefitItems)
    ? options.submittedBenefitItems
    : []
  const cartForDraftApply = replaceAppliedRedemptionItems
    ? cartItems.filter((item) => !isCrmIntegrationRedemptionItemCartItem(item))
    : cartItems

  return {
    nextCart: buildCrmIntegrationPointItemCart({
      cart: cartForDraftApply,
      benefit: draft.benefit,
      candidates,
    }),
    selectedGiftItemCandidates: [...submittedBenefitItems, ...candidates],
    replaceGiftItemDiscountId,
    isRemoval: candidates.length === 0,
    replaceAppliedRedemptionItems,
  }
}

export function resolveCrmIntegrationRedemptionBenefits(options = {}) {
  const { providerType } = options
  if (providerType !== CRM_PROVIDER.INTEGRATION) {
    return {
      rewardItems: [],
      pointItems: [],
      voucherItems: [],
      redeemMenu: {},
    }
  }

  const validRewards = Array.isArray(options.validRewards)
    ? options.validRewards
    : []
  const validVouchers = Array.isArray(options.validVouchers)
    ? options.validVouchers
    : []
  const rewardItems = validRewards.filter(
    (benefit) => !isCrmIntegrationOrderDiscountBenefit(benefit)
  )
  const pointVoucherItems = options.isLoggedIn
    ? validRewards.filter(isCrmIntegrationOrderDiscountBenefit)
    : []
  const voucherItems = groupCrmIntegrationVoucherBenefitsForDisplay(
    validVouchers.filter(
      (benefit) => !isCrmIntegrationOrderDiscountBenefit(benefit)
    )
  )

  return {
    rewardItems,
    pointItems: [
      ...flattenCrmIntegrationPointItems(rewardItems),
      ...pointVoucherItems,
    ],
    voucherItems,
    redeemMenu: buildCrmIntegrationRedeemMenu({
      rewardItems,
    }),
  }
}

export default function useCrmIntegrationRedemptionController() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [memberInfo] = useGlobalState('memberInfo')
  const [cart, setCart] = useGlobalState('Cart')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const [orders] = useGlobalState('Orders')
  const [rewardDialog, setRewardDialog] = useState(null)
  const pointItemPendingRef = useRef(false)
  const redemptionConfirmPendingRef = useRef(false)
  const {
    providerType,
    validRewards: crmIntegrationValidRewards,
    validVouchers: crmIntegrationValidVouchers,
  } = useSelector((state) => state.crmProviderSlice)
  const selectedBenefit = useSelector(
    (state) => state.crmIntegrationValidationSlice.selectedBenefit
  )
  const selectedBenefitId = selectedBenefit?.id

  useCrmIntegrationBenefitAutoValidation()

  const submittedOrderDiscountIdKey = useMemo(
    () =>
      getStableStringArrayKey(getSubmittedCrmIntegrationDiscountIds(orders)),
    [orders]
  )
  const submittedOrderDiscountIds = useMemo(
    () => JSON.parse(submittedOrderDiscountIdKey),
    [submittedOrderDiscountIdKey]
  )
  const benefitRuleIdKey = useMemo(() => {
    const validRewards = Array.isArray(crmIntegrationValidRewards)
      ? crmIntegrationValidRewards
      : []
    const validVouchers = Array.isArray(crmIntegrationValidVouchers)
      ? crmIntegrationValidVouchers
      : []

    return getStableStringArrayKey(
      [...validRewards, ...validVouchers]
        .map(getCrmIntegrationBenefitRuleId)
        .filter(Boolean)
    )
  }, [crmIntegrationValidRewards, crmIntegrationValidVouchers])
  const benefitRuleIdSet = useMemo(
    () => new Set(JSON.parse(benefitRuleIdKey)),
    [benefitRuleIdKey]
  )
  const submittedDiscountIds = useMemo(
    () =>
      submittedOrderDiscountIds.filter((discountId) =>
        benefitRuleIdSet.has(discountId)
      ),
    [benefitRuleIdSet, submittedOrderDiscountIds]
  )
  const submittedDiscountIdKey = useMemo(
    () => getStableStringArrayKey(submittedDiscountIds),
    [submittedDiscountIds]
  )
  const submittedDiscountIdSet = useMemo(
    () => new Set(JSON.parse(submittedDiscountIdKey)),
    [submittedDiscountIdKey]
  )
  const hasSubmittedBenefit = submittedDiscountIdSet.size > 0
  const isSubmittedBenefit = useMemoizedFn((benefit) => {
    const ruleId = getCrmIntegrationBenefitRuleId(benefit)
    return !!ruleId && submittedDiscountIdSet.has(String(ruleId))
  })
  const benefitDisabledOverride = hasSubmittedBenefit ? true : undefined
  const currentOrderItems = useMemo(
    () => getCrmIntegrationCurrentOrderItems(cart, orders),
    [cart, orders]
  )
  const getReplaceAppliedRedemptionSelectOptions = useMemoizedFn(() => ({
    currentOrderItems: getCrmIntegrationCurrentOrderItems(
      (Array.isArray(cart) ? cart : []).filter(
        (item) => !isCrmIntegrationRedemptionItemCartItem(item)
      ),
      orders
    ),
    forceReplaceSelectedBenefit: true,
  }))
  const pointItemGlobalLocked = useMemo(
    () =>
      providerType === CRM_PROVIDER.INTEGRATION &&
      (hasSubmittedBenefit ||
        hasCrmIntegrationRedemptionItemInCart(cart) ||
        hasCrmIntegrationPointItemRedemption({
          cart,
          orders,
          pointBenefits: crmIntegrationValidRewards,
        })),
    [
      cart,
      crmIntegrationValidRewards,
      hasSubmittedBenefit,
      orders,
      providerType,
    ]
  )
  const {
    finalizePrevalidatedCrmIntegrationPointItem,
    selectCrmIntegrationBenefit,
    validateCrmIntegrationBenefitBeforePending,
    validateCrmIntegrationBenefitSdkBeforeStage,
    validateCrmIntegrationPointItemBeforeAdd,
  } = useCrmIntegrationBenefitSelection({
    currentOrderItems,
  })
  const orderContext = useMemo(
    () => ({
      orderType: orders?.[0]?.type || 'DINE_IN',
      paymentType: orders?.[0]?.paymentType,
      merchantId: getStorageValue('emenu_company')?.merchantId,
    }),
    [orders]
  )

  useEffect(() => {
    crmIntegrationMarketSDK.setOrderFormatter((options = {}) =>
      formatCrmIntegrationOrderStructure({
        ...options,
        memberInfo: options.memberInfo || memberInfo,
        orderContext: {
          ...orderContext,
          ...(options.orderContext || {}),
        },
      })
    )
  }, [memberInfo, orderContext])

  const validateBenefitBeforeStage = useMemoizedFn(
    async (reward, options = {}) => {
      if (hasSubmittedBenefit) {
        Toast.info(t('crm.upperLimit'))
        return false
      }
      const replaceSelectOptions = options.replaceAppliedRedemptionItems
        ? getReplaceAppliedRedemptionSelectOptions()
        : {}

      const valid = await runCrmIntegrationBenefitStageValidation({
        includeSdk: options.includeSdk,
        validateBeforePending: () =>
          validateCrmIntegrationBenefitBeforePending(
            reward,
            replaceSelectOptions
          ),
        validateSdk: () =>
          validateCrmIntegrationBenefitSdkBeforeStage(
            reward,
            replaceSelectOptions
          ),
      })

      return valid
    }
  )

  const validateBenefitCandidatesBeforeStage = useMemoizedFn(
    async (reward, candidates, options = {}) => {
      const selectedGiftItemCandidates = Array.isArray(candidates)
        ? candidates
        : []
      if (!selectedGiftItemCandidates.length) return false

      if (hasSubmittedBenefit) {
        Toast.info(t('crm.upperLimit'))
        return false
      }
      const replaceSelectOptions = options.replaceAppliedRedemptionItems
        ? getReplaceAppliedRedemptionSelectOptions()
        : {}

      return runCrmIntegrationBenefitStageValidation({
        validateBeforePending: () =>
          validateCrmIntegrationBenefitBeforePending(
            reward,
            replaceSelectOptions
          ),
        validateSdk: () =>
          validateCrmIntegrationBenefitSdkBeforeStage(reward, {
            ...replaceSelectOptions,
            selectedGiftItemCandidates,
          }),
      })
    }
  )

  const openRewardDialog = useMemoizedFn(async (reward) => {
    if (!reward?.hasCouponItemDialog) return false

    const valid = await validateBenefitBeforeStage(reward, {
      includeSdk: false,
    })
    if (!valid) return false

    setRewardDialog(reward)
    return true
  })

  const handleBenefitSelect = useMemoizedFn((benefit, options) => {
    if (hasSubmittedBenefit) {
      Toast.info(t('crm.upperLimit'))
      return false
    }

    return selectCrmIntegrationBenefit(benefit, options)
  })

  const handlePointItemBeforeAdd = useMemoizedFn(({ benefit, item }) => {
    if (!benefit || !item?.crmIntegrationPointItemKey) return false
    if (pointItemPendingRef.current) return false

    if (pointItemGlobalLocked) {
      return validateCrmIntegrationPointItemBeforeAdd(benefit, {
        item,
        crmIntegrationPointItemGlobalLocked: true,
      })
    }

    const currentBenefitItems = getCrmIntegrationPointBenefitCartItems(
      cart,
      benefit
    )
    const submittedBenefitItems = getCrmIntegrationPointBenefitSubmittedItems(
      (Array.isArray(orders) ? orders : []).flatMap((order) =>
        Array.isArray(order?.cart) ? order.cart : []
      ),
      benefit
    )
    const selectedTotal = [
      ...currentBenefitItems,
      ...submittedBenefitItems,
    ].reduce((total, candidate) => total + Number(candidate?.count || 0), 0)
    const maxSelectable = item.crmIntegrationMaxSelectable
    const limitReached =
      Number.isFinite(maxSelectable) && selectedTotal >= maxSelectable

    return validateCrmIntegrationPointItemBeforeAdd(benefit, {
      item,
      hasSubmittedBenefit,
      isSubmittedBenefit: isSubmittedBenefit(benefit),
      limitReached,
      maxSelectable,
    })
  })

  const validatePointItemBeforeStage = useMemoizedFn(
    async ({ benefit, item, draft }) => {
      if (!benefit || !item?.crmIntegrationPointItemKey) return false
      if (pointItemPendingRef.current || redemptionConfirmPendingRef.current) {
        return false
      }

      if (draft?.benefit?.id && draft.benefit.id !== benefit.id) {
        Toast.info(t('crmIntegration.onlyOneBenefitSelectable'))
        return false
      }

      const isReplacingLockedPointItem =
        pointItemGlobalLocked &&
        draft?.benefit?.id === benefit.id &&
        getCrmIntegrationPointBenefitCartItems(cart, benefit).length > 0 &&
        (Array.isArray(draft.candidates) ? draft.candidates : []).reduce(
          (total, candidate) => total + Number(candidate?.count || 0),
          0
        ) === 0

      if (pointItemGlobalLocked && !isReplacingLockedPointItem) {
        return validateCrmIntegrationPointItemBeforeAdd(benefit, {
          item,
          crmIntegrationPointItemGlobalLocked: true,
        })
      }

      const submittedBenefitItems = getCrmIntegrationPointBenefitSubmittedItems(
        (Array.isArray(orders) ? orders : []).flatMap((order) =>
          Array.isArray(order?.cart) ? order.cart : []
        ),
        benefit
      )
      const { limitReached, maxSelectable } =
        resolveCrmIntegrationPointItemStageState({
          draft,
          benefit,
          item,
          submittedBenefitItems,
        })

      return runCrmIntegrationBenefitStageValidation({
        validateBeforePending: () =>
          validateCrmIntegrationPointItemBeforeAdd(benefit, {
            item,
            hasSubmittedBenefit,
            isSubmittedBenefit: isSubmittedBenefit(benefit),
            limitReached,
            maxSelectable,
          }),
        validateSdk: () =>
          validateCrmIntegrationBenefitSdkBeforeStage(benefit, {
            allowMissingDiscountsAtStage: true,
            replaceGiftItemDiscountId: isReplacingLockedPointItem
              ? getCrmIntegrationBenefitRuleId(benefit)
              : undefined,
          }),
      })
    }
  )

  const handlePointItemChange = useMemoizedFn(
    async ({ benefit, item, count, detailData, entryValidated = false }) => {
      if (!benefit || !item?.crmIntegrationPointItemKey) return false
      if (pointItemPendingRef.current) return false

      if (hasSubmittedBenefit && !entryValidated) {
        return handleBenefitSelect(benefit)
      }

      const ruleId = getCrmIntegrationBenefitRuleId(benefit)
      const currentBenefitItems = getCrmIntegrationPointBenefitCartItems(
        cart,
        benefit
      )
      const submittedBenefitItems = getCrmIntegrationPointBenefitSubmittedItems(
        (Array.isArray(orders) ? orders : []).flatMap((order) =>
          Array.isArray(order?.cart) ? order.cart : []
        ),
        benefit
      )
      const submittedTotal = submittedBenefitItems.reduce(
        (total, candidate) => total + Number(candidate?.count || 0),
        0
      )
      const maxPending = Number.isFinite(item.crmIntegrationMaxSelectable)
        ? Math.max(item.crmIntegrationMaxSelectable - submittedTotal, 0)
        : Infinity
      const nextCandidates = resolveCrmIntegrationPointItemCandidates({
        currentBenefitItems,
        item,
        count,
        detailData,
        maxPending,
      })

      if (nextCandidates === currentBenefitItems) return false

      const nextCart = buildCrmIntegrationPointItemCart({
        cart,
        benefit,
        candidates: nextCandidates,
      })
      const applyMode = resolveCrmIntegrationPointItemApplyMode({
        candidateCount: nextCandidates.length,
        entryValidated,
      })

      if (applyMode === CRM_INTEGRATION_POINT_ITEM_APPLY_MODE.REMOVE) {
        setCart(nextCart)
        setStoragedCart(nextCart)
        dispatch(
          crmIntegrationValidationActions.clearSelectedBenefitById(benefit.id)
        )
        return true
      }

      pointItemPendingRef.current = true
      try {
        const applyBenefit =
          applyMode === CRM_INTEGRATION_POINT_ITEM_APPLY_MODE.FINALIZE
            ? finalizePrevalidatedCrmIntegrationPointItem
            : handleBenefitSelect

        return await applyBenefit(benefit, {
          selectedGiftItemCandidates: [
            ...submittedBenefitItems,
            ...nextCandidates,
          ],
          forceSelectSelectedBenefit: true,
          replaceGiftItemDiscountId: ruleId,
          beforeApplySelectedBenefit: () => {
            setCart(nextCart)
            setStoragedCart(nextCart)
          },
        })
      } finally {
        pointItemPendingRef.current = false
      }
    }
  )

  const confirmRedemptionDraft = useMemoizedFn(async (draft) => {
    if (
      draft?.providerType !== CRM_PROVIDER.INTEGRATION ||
      redemptionConfirmPendingRef.current
    ) {
      return false
    }

    const isBenefitOnlyRedemption =
      draft.candidates?.length === 1 &&
      draft.candidates[0]?.crmIntegrationBenefitOnly === true
    if (isBenefitOnlyRedemption) {
      redemptionConfirmPendingRef.current = true
      try {
        const replaceSelectOptions = draft.replaceAppliedRedemptionItems
          ? getReplaceAppliedRedemptionSelectOptions()
          : {}
        return await handleBenefitSelect(draft.benefit, {
          ...replaceSelectOptions,
          beforeApplySelectedBenefit: draft.replaceAppliedRedemptionItems
            ? () => {
                const nextCart = (Array.isArray(cart) ? cart : []).filter(
                  (item) => !isCrmIntegrationRedemptionItemCartItem(item)
                )
                setCart(nextCart)
                setStoragedCart(nextCart)
              }
            : undefined,
        })
      } finally {
        redemptionConfirmPendingRef.current = false
      }
    }

    const submittedBenefitItems = getCrmIntegrationPointBenefitSubmittedItems(
      (Array.isArray(orders) ? orders : []).flatMap((order) =>
        Array.isArray(order?.cart) ? order.cart : []
      ),
      draft.benefit
    )
    const draftApply = buildCrmIntegrationRedemptionDraftApply({
      cart,
      draft,
      submittedBenefitItems,
    })
    if (!draftApply) return false

    redemptionConfirmPendingRef.current = true
    try {
      if (draftApply.isRemoval) {
        setCart(draftApply.nextCart)
        setStoragedCart(draftApply.nextCart)
        dispatch(
          draftApply.replaceAppliedRedemptionItems
            ? crmIntegrationValidationActions.clearSelectedBenefit()
            : crmIntegrationValidationActions.clearSelectedBenefitById(
                draft.benefit.id
              )
        )
        return true
      }

      const replaceSelectOptions = draftApply.replaceAppliedRedemptionItems
        ? getReplaceAppliedRedemptionSelectOptions()
        : {}
      return await handleBenefitSelect(draft.benefit, {
        ...replaceSelectOptions,
        selectedGiftItemCandidates: draftApply.selectedGiftItemCandidates,
        forceSelectSelectedBenefit: true,
        replaceGiftItemDiscountId: draftApply.replaceGiftItemDiscountId,
        beforeApplySelectedBenefit: () => {
          setCart(draftApply.nextCart)
          setStoragedCart(draftApply.nextCart)
        },
      })
    } finally {
      redemptionConfirmPendingRef.current = false
    }
  })

  const closeRewardDialog = useMemoizedFn(() => {
    setRewardDialog(null)
  })
  const redemptionBenefits = useMemo(
    () =>
      resolveCrmIntegrationRedemptionBenefits({
        providerType,
        validRewards: crmIntegrationValidRewards,
        validVouchers: [],
        isLoggedIn: !!memberInfo?.userId,
      }),
    [
      crmIntegrationValidRewards,
      crmIntegrationValidVouchers,
      memberInfo?.userId,
      providerType,
    ]
  )

  return {
    providerType,
    ...redemptionBenefits,
    selectedBenefit,
    selectedBenefitId,
    benefitDisabledOverride,
    pointItemGlobalLocked,
    rewardDialog,
    openRewardDialog,
    closeRewardDialog,
    selectBenefit: selectCrmIntegrationBenefit,
    handleBenefitSelect,
    validateBenefitBeforeStage,
    validateBenefitCandidatesBeforeStage,
    validateBenefitBeforePending: validateCrmIntegrationBenefitBeforePending,
    validatePointItemBeforeStage,
    confirmRedemptionDraft,
    handlePointItemBeforeAdd,
    handlePointItemChange,
  }
}
