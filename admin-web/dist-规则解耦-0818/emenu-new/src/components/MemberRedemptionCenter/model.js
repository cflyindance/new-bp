import { cloneDeep } from 'lodash-es'
import { CRM_PROVIDER } from '@/crm'
import { CRM_INTEGRATION_REWARD_KIND } from '@/utils/crmIntegrationRewards'
import getRewardItemByRules from '@/utils/getRewardItemByRules'

export const MEMBER_REDEMPTION_TYPE = {
  ALL: 'all',
  POINT: 'point',
  VOUCHER: 'voucher',
}

export const MEMBER_REDEMPTION_ROW_HEIGHT = 116

export function shouldShowMemberRedemptionCenter(options = {}) {
  return options.configOpen !== false && options.crmEnabled === true
}

export function shouldSubmitCrmIntegrationDiscountOrder(options = {}) {
  return (
    options.isOrderDiscountDraft === true &&
    !!options.currentOrderId &&
    Array.isArray(options.orders) &&
    options.orders.length > 0
  )
}

function getMemberRedemptionCenterItemPoints(item) {
  const points =
    item?.crmIntegrationPoints ??
    item?.points ??
    item?.rewardRule?.redeemRule?.parameters?.points
  return Number.isFinite(Number(points)) ? Number(points) : null
}

export function getMemberRedemptionCenterPointOptions(pointItems = []) {
  const points = pointItems
    .map(getMemberRedemptionCenterItemPoints)
    .filter((value) => value !== null)

  return ['all', ...Array.from(new Set(points)).sort((a, b) => a - b)]
}

function getCrmIntegrationVoucherBenefitId(benefit) {
  return benefit?.id ?? benefit?._id
}

function isCrmIntegrationGiftVoucherBenefit(benefit) {
  return (
    benefit?.crmIntegrationRewardKind ===
      CRM_INTEGRATION_REWARD_KIND.FREE_ITEM &&
    Array.isArray(benefit?.couponItemList) &&
    benefit.couponItemList.length > 0
  )
}

function buildCrmIntegrationGiftVoucherItemRows(benefit) {
  const benefitId = getCrmIntegrationVoucherBenefitId(benefit)
  return benefit.couponItemList.map((item) => ({
    type: MEMBER_REDEMPTION_TYPE.VOUCHER,
    item: {
      ...item,
      crmIntegrationVoucherItem: true,
      crmIntegrationVoucherBenefit: benefit,
      crmIntegrationVoucherItemKey: `${benefitId}:${item?.id}`,
      crmIntegrationMaxSelectable:
        Number(benefit?.giftQuantity || 0) > 0 ? benefit.giftQuantity : 1,
      crmIntegrationHideDetailPrice: true,
    },
  }))
}

function buildCrmIntegrationVoucherRows(voucherItems = []) {
  const voucherRows = []
  const giftVoucherItemRows = []

  voucherItems.forEach((item) => {
    if (isCrmIntegrationGiftVoucherBenefit(item)) {
      giftVoucherItemRows.push(...buildCrmIntegrationGiftVoucherItemRows(item))
      return
    }
    voucherRows.push({ type: MEMBER_REDEMPTION_TYPE.VOUCHER, item })
  })

  return [...voucherRows, ...giftVoucherItemRows]
}

export function resolveMemberRedemptionCenterView(options = {}) {
  const pointItems = Array.isArray(options.pointItems) ? options.pointItems : []
  const voucherItems = Array.isArray(options.voucherItems)
    ? options.voucherItems
    : []
  const showTypeTabs = pointItems.length > 0 && voucherItems.length > 0
  const activeType = showTypeTabs
    ? options.activeType
    : pointItems.length > 0
      ? MEMBER_REDEMPTION_TYPE.POINT
      : MEMBER_REDEMPTION_TYPE.VOUCHER
  const showPointFilters =
    pointItems.length > 0 && activeType === MEMBER_REDEMPTION_TYPE.POINT

  if (activeType === MEMBER_REDEMPTION_TYPE.VOUCHER) {
    return {
      showTypeTabs,
      showPointFilters: false,
      rows: buildCrmIntegrationVoucherRows(voucherItems),
    }
  }

  if (activeType === MEMBER_REDEMPTION_TYPE.POINT) {
    const activePoints = options.activePoints ?? 'all'
    const filteredPointItems =
      activePoints === 'all'
        ? pointItems
        : pointItems.filter(
            (item) =>
              getMemberRedemptionCenterItemPoints(item) === Number(activePoints)
          )

    return {
      showTypeTabs,
      showPointFilters,
      rows: filteredPointItems.map((item) => ({ type: 'point', item })),
    }
  }

  return {
    showTypeTabs,
    showPointFilters: false,
    rows: [
      ...pointItems.map((item) => ({ type: 'point', item })),
      ...buildCrmIntegrationVoucherRows(voucherItems),
    ],
  }
}

export function resolveMemberRedemptionCenterDraftChange(options = {}) {
  const {
    draft,
    providerType,
    benefit,
    type,
    maxSelectable = Infinity,
    keepEmptyDraft = false,
    replaceAppliedRedemptionItems = false,
  } = options
  const candidates = (
    Array.isArray(options.candidates) ? options.candidates : []
  ).filter((candidate) => Number(candidate?.count || 0) > 0)
  const currentBenefitId = draft?.benefit?.id ?? draft?.benefit?._id
  const nextBenefitId = benefit?.id ?? benefit?._id

  if (
    draft &&
    (draft.providerType !== providerType ||
      (String(currentBenefitId) !== String(nextBenefitId) &&
        !replaceAppliedRedemptionItems))
  ) {
    return {
      accepted: false,
      reason: 'different-benefit',
      draft,
    }
  }

  const selectedTotal = candidates.reduce(
    (total, candidate) => total + Number(candidate.count || 0),
    0
  )
  if (Number.isFinite(maxSelectable) && selectedTotal > maxSelectable) {
    return {
      accepted: false,
      reason: 'limit-reached',
      draft,
    }
  }

  return {
    accepted: true,
    reason: null,
    draft:
      candidates.length || keepEmptyDraft
        ? {
            providerType,
            benefit,
            type,
            candidates,
            replaceAppliedRedemptionItems:
              replaceAppliedRedemptionItems ||
              draft?.replaceAppliedRedemptionItems,
          }
        : null,
  }
}

export async function runCrmIntegrationRewardDialogConfirm(options = {}) {
  const { stageOnly, reward, candidates, onStage, onSelect, selectOptions } =
    options

  if (stageOnly) {
    if (typeof onStage !== 'function') return false
    return (await onStage(reward, candidates)) !== false
  }

  if (typeof onSelect !== 'function') return false
  return onSelect(reward, selectOptions)
}

export function resolveLegacyPointRedemptionFailure(options = {}) {
  if (!options.isLoggedIn) return 'login'
  if (options.hasRedeemed) return 'limit'
  if (Number(options.pointBalance || 0) < Number(options.requiredPoints || 0)) {
    return 'points'
  }
  return null
}

export function buildLegacyCrmPointItems(options = {}) {
  const rewardRules = Array.isArray(options.rewardRules)
    ? options.rewardRules
    : []
  const saleItems = Array.isArray(options.saleItems) ? options.saleItems : []
  if (!rewardRules.length || !saleItems.length) return []

  const freeItemRules = rewardRules.filter(
    (rule) => rule?.redeemRule?.strategy === 'byFreeItem'
  )
  const visibleItems = saleItems.map((item) => ({
    ...item,
    hidden: false,
  }))

  return getRewardItemByRules(freeItemRules, visibleItems)
    .flatMap((rule) => rule?.items || [])
    .map((item) => {
      let originalPrice = item.price ?? 0
      if (item.itemPrices) {
        originalPrice = cloneDeep(item.itemPrices).sort(
          (a, b) => a.price - b.price
        )?.[0]?.price
      }

      return {
        ...item,
        optionList: [],
        comboList: [],
        itemPrices: [],
        price: 0,
        large: false,
        showLarge: false,
        itemMax: 1,
        benefitPrice: undefined,
        realBenefitPrice: undefined,
        freeItemOriginalPrice: originalPrice ?? 0,
        freeItemDiscount: originalPrice ?? 0,
      }
    })
}

export function buildMemberRedemptionCenterSections(options = {}) {
  const {
    providerType,
    integrationVoucherItems = [],
    integrationPointItems = [],
    legacyPointItems = [],
  } = options

  if (providerType === CRM_PROVIDER.INTEGRATION) {
    const sections = []
    if (integrationVoucherItems.length) {
      sections.push({
        id: 'avocado-item-voucher',
        type: 'voucher',
        items: integrationVoucherItems,
      })
    }
    if (integrationPointItems.length) {
      sections.push({
        id: 'crm-point-item',
        type: 'point',
        items: integrationPointItems,
      })
    }
    return sections
  }

  if (providerType === CRM_PROVIDER.LEGACY && legacyPointItems.length) {
    return [
      {
        id: 'crm-point-item',
        type: 'point',
        items: legacyPointItems,
      },
    ]
  }

  return []
}
