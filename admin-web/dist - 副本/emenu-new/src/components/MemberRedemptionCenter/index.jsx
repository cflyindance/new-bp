import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { isEqual } from 'lodash-es'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import { nanoid } from 'nanoid'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import CrmIntegrationRewardItemsDialog from '@/components/CrmIntegrationRewardItemsDialog'
import DishDialog from '@/components/DishDialog'
import Toast from '@/components/Toast'
import FeedbackToast from '@/components/common/FeedbackToast'
import { memberRedemptionCenter } from '@/constants/systemConfig'
import { CRM_PROVIDER } from '@/crm'
import useCheckOrderBenefit from '@/hooks/useCheckOrderBenefit'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import { useGlobalState } from '@/hooks/useGlobalState'
import useIsMemberLogin from '@/hooks/useIsMemberLogin'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import useSendCrmIntegrationDiscountOrder from '@/hooks/useSendCrmIntegrationDiscountOrder'
import useSystemConfig from '@/hooks/useSystemConfig'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'
import defaultMemberRedemptionCenterIcon from '@/assets/image/member_redemption_center_default.png'
import {
  createCrmIntegrationPointItemCandidate,
  getCrmIntegrationPointBenefitCartItems,
  resolveCrmIntegrationPointItemCandidates,
} from '@/utils/crmIntegrationCartValidation'
import {
  CRM_INTEGRATION_REWARD_KIND,
  isCrmIntegrationOrderDiscountBenefit,
} from '@/utils/crmIntegrationRewards'
import { serverUrl } from '@/utils/env_var'
import { formatUSPhoneNumber } from '@/utils/formatPhone'
import { getStorageValue } from '@/utils/storage'
import {
  buildLegacyCrmPointItems,
  getMemberRedemptionCenterPointOptions,
  MEMBER_REDEMPTION_ROW_HEIGHT,
  MEMBER_REDEMPTION_TYPE,
  resolveLegacyPointRedemptionFailure,
  resolveMemberRedemptionCenterDraftChange,
  resolveMemberRedemptionCenterView,
  shouldShowMemberRedemptionCenter,
  shouldSubmitCrmIntegrationDiscountOrder,
} from './model'
import {
  clampMemberRedemptionCenterPosition,
  hasExceededMemberRedemptionCenterDragThreshold,
} from './position'
import RewardList from './RewardList'
import styles from './index.module.less'

const DEFAULT_ICON_SIZE = 100
const DEFAULT_LIST_HEIGHT = MEMBER_REDEMPTION_ROW_HEIGHT * 4
const BENEFIT_ONLY_CANDIDATE = 'crm-integration-benefit-only'
const MOUSE_DRAG_ID = 'mouse'

function getBenefitId(benefit) {
  return benefit?.id ?? benefit?._id
}

function getPointItemKey(item) {
  return item?.crmIntegrationPointItemKey || String(item?.id)
}

function getVoucherItemKey(item) {
  return item?.crmIntegrationVoucherItemKey || String(item?.id)
}

function getRowBenefit(row) {
  if (row?.type === MEMBER_REDEMPTION_TYPE.VOUCHER) {
    return row?.item?.crmIntegrationVoucherBenefit || row?.item
  }
  return (
    row?.item?.crmIntegrationBenefit ||
    (isCrmIntegrationOrderDiscountBenefit(row?.item)
      ? row.item
      : row?.item?.rewardRule)
  )
}

function getCandidateCount(candidates = []) {
  return candidates.reduce(
    (total, candidate) => total + Number(candidate?.count || 0),
    0
  )
}

function isSameCrmIntegrationRewardItemCandidate(left, right) {
  return (
    String(left?.id) === String(right?.id) &&
    isEqual(left?.priceItem, right?.priceItem) &&
    isEqual(left?.options, right?.options) &&
    left?.instructions === right?.instructions
  )
}

function createCrmIntegrationVoucherItemCandidate(item, detailData = {}) {
  const candidate = createCrmIntegrationPointItemCandidate(item, detailData)
  delete candidate.crmIntegrationVoucherBenefit
  delete candidate.crmIntegrationVoucherItem
  delete candidate.crmIntegrationMaxSelectable
  delete candidate.crmIntegrationHideDetailPrice
  return candidate
}

function resolveCrmIntegrationVoucherItemCandidates(options = {}) {
  const {
    currentBenefitItems = [],
    item,
    count,
    detailData,
    maxPending = Infinity,
  } = options
  const currentItems = Array.isArray(currentBenefitItems)
    ? currentBenefitItems
    : []
  if (!item?.crmIntegrationVoucherItemKey) return currentItems

  const normalizedMaxPending = Number.isFinite(maxPending)
    ? Math.max(Number(maxPending), 0)
    : Infinity

  if (detailData !== undefined) {
    const nextCandidate = createCrmIntegrationVoucherItemCandidate(
      item,
      detailData
    )
    const currentTotal = currentItems.reduce(
      (total, candidate) => total + Number(candidate?.count || 0),
      0
    )
    const allowedCount = Number.isFinite(normalizedMaxPending)
      ? Math.min(
          Number(nextCandidate.count || 0),
          Math.max(normalizedMaxPending - currentTotal, 0)
        )
      : Number(nextCandidate.count || 0)
    if (allowedCount <= 0) return currentItems

    nextCandidate.count = allowedCount
    const sameIndex = currentItems.findIndex((candidate) =>
      isSameCrmIntegrationRewardItemCandidate(candidate, nextCandidate)
    )
    if (sameIndex < 0) return [...currentItems, nextCandidate]

    return currentItems.map((candidate, index) =>
      index === sameIndex
        ? {
            ...candidate,
            count:
              Number(candidate.count || 0) + Number(nextCandidate.count || 0),
          }
        : candidate
    )
  }

  const voucherItemKey = getVoucherItemKey(item)
  const otherCandidates = currentItems.filter(
    (candidate) => getVoucherItemKey(candidate) !== voucherItemKey
  )
  const otherTotal = otherCandidates.reduce(
    (total, candidate) => total + Number(candidate?.count || 0),
    0
  )
  const nextCount = Number.isFinite(normalizedMaxPending)
    ? Math.min(
        Number(count || 0),
        Math.max(normalizedMaxPending - otherTotal, 0)
      )
    : Number(count || 0)

  if (nextCount <= 0) return otherCandidates
  return [
    ...otherCandidates,
    createCrmIntegrationVoucherItemCandidate(item, { count: nextCount }),
  ]
}

function getVoucherMaxSelectable(benefit) {
  const giftQuantity = Number(benefit?.giftQuantity || 0)
  const quantityLimit = Number(benefit?.quantityLimit || 0)
  if (
    benefit?.crmIntegrationRewardKind ===
    CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT
  ) {
    return quantityLimit > 0 ? quantityLimit : Infinity
  }
  if (giftQuantity > 0) return giftQuantity
  if (quantityLimit > 0) return quantityLimit
  if (
    benefit?.crmIntegrationRewardKind === CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
  ) {
    return 1
  }
  return benefit?.hasCouponItemDialog ? Infinity : 1
}

function getRewardDescription(row) {
  const item = row?.item
  if (!item) return ''
  if (row.type === MEMBER_REDEMPTION_TYPE.VOUCHER) {
    const benefit = getRowBenefit(row)
    return (
      benefit?.couponTemplate?.description ||
      benefit?.description ||
      benefit?.desc ||
      item?.desc ||
      item?.description
    )
  }
  if (item?.crmIntegrationPointItem) {
    return (
      item?.crmIntegrationBenefit?.description ||
      item?.crmIntegrationBenefit?.rawReward?.couponTemplate?.description ||
      item?.crmIntegrationBenefit?.rawReward?.description ||
      item?.desc ||
      item?.description
    )
  }
  return item?.desc || item?.description
}

function maskMemberPhone(phoneStr, maskCount = 6, maskChar = '*') {
  const phone = String(phoneStr || '')
  const digits = phone.replace(/\D/g, '')
  const formatted = digits.length === 10 ? formatUSPhoneNumber(digits) : phone
  let maskedDigitCount = 0

  return formatted
    .split('')
    .map((char) => {
      if (!/\d/.test(char) || maskedDigitCount >= maskCount) return char
      maskedDigitCount += 1
      return maskChar
    })
    .join('')
}

function shouldOpenPointItemDetail(item) {
  return (
    item?.large ||
    item?.showLarge ||
    item?.combo ||
    item?.comboType === 'FIXED_SELECTION' ||
    item?.comboType === 'SELF_SELECTION' ||
    (Array.isArray(item?.itemPrices) && item.itemPrices.length > 1) ||
    (Array.isArray(item?.optionList) && item.optionList.length > 0)
  )
}

const MemberRedemptionCenter = ({ crmIntegrationRedemption }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { getFinalConfigById } = useSystemConfig()
  const { runFetchOrder } = useFetchOrder()
  const [allMenus] = useGlobalState('All_Menus', [])
  const [crmRewardRules] = useGlobalState('crmRewardRules')
  const [memberInfo] = useGlobalState('memberInfo')
  const [cart, setCart] = useGlobalState('Cart')
  const [orders] = useGlobalState('Orders')
  const [, setLoginOpen] = useGlobalState('open')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const { isCartRedeem, isOrderRedeem } = useCheckOrderBenefit()
  const { crmStatus } = useIsMemberLogin()
  const [open, setOpen] = useState(false)
  const [activeType, setActiveType] = useState(MEMBER_REDEMPTION_TYPE.ALL)
  const [activePoints, setActivePoints] = useState('all')
  const [draftSelection, setDraftSelection] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [voucherDialog, setVoucherDialog] = useState(null)
  const [descriptionRow, setDescriptionRow] = useState(null)
  const [stagePendingBenefitId, setStagePendingBenefitId] = useState(null)
  const [confirmPending, setConfirmPending] = useState(false)
  const [orderDiscountSubmitting, setOrderDiscountSubmitting] = useState(false)
  const [orderDiscountFeedbackOpen, setOrderDiscountFeedbackOpen] =
    useState(false)
  const [iconLoadFallback, setIconLoadFallback] = useState(false)
  const [listHeight, setListHeight] = useState(DEFAULT_LIST_HEIGHT)
  const buttonRef = useRef(null)
  const listAreaRef = useRef(null)
  const pointerStateRef = useRef(null)
  const [position, setPosition] = useState(null)
  const positionRef = useRef(position)
  const config = getFinalConfigById(memberRedemptionCenter.id)
  const shouldShow = shouldShowMemberRedemptionCenter({
    configOpen: config?.open,
    crmEnabled: crmStatus,
  })
  const iconPath = config?.memberRedemptionCenterIcon?.[0]
  const isDefaultFloatingIcon = !iconPath || iconLoadFallback
  const providerType = crmIntegrationRedemption.providerType
  const isMemberLoggedIn = Object.keys(memberInfo || {}).length > 0
  const memberIdentity = memberInfo?.userId || memberInfo?.phone || ''
  const saleItems = useMemo(
    () =>
      allMenus
        .map((group) => group.list?.map((item) => item.list) ?? [])
        .flat(2),
    [allMenus]
  )
  const legacyPointItems = useMemo(
    () =>
      buildLegacyCrmPointItems({
        rewardRules: crmRewardRules,
        saleItems,
      }),
    [crmRewardRules, saleItems]
  )
  const pointItems = useMemo(() => {
    if (providerType === CRM_PROVIDER.INTEGRATION) {
      return crmIntegrationRedemption.pointItems || []
    }
    if (providerType === CRM_PROVIDER.LEGACY) return legacyPointItems
    return []
  }, [crmIntegrationRedemption.pointItems, legacyPointItems, providerType])
  const voucherItems = useMemo(
    () =>
      providerType === CRM_PROVIDER.INTEGRATION && isMemberLoggedIn
        ? crmIntegrationRedemption.voucherItems || []
        : [],
    [crmIntegrationRedemption.voucherItems, isMemberLoggedIn, providerType]
  )
  const pointOptions = useMemo(
    () => getMemberRedemptionCenterPointOptions(pointItems),
    [pointItems]
  )
  const showTypeTabs = pointItems.length > 0 && voucherItems.length > 0
  const resolvedActiveType = showTypeTabs
    ? activeType
    : pointItems.length
      ? MEMBER_REDEMPTION_TYPE.POINT
      : MEMBER_REDEMPTION_TYPE.VOUCHER
  const view = useMemo(
    () =>
      resolveMemberRedemptionCenterView({
        pointItems,
        voucherItems,
        activeType: resolvedActiveType,
        activePoints,
      }),
    [activePoints, pointItems, resolvedActiveType, voucherItems]
  )
  const isAppliedLocked =
    providerType === CRM_PROVIDER.INTEGRATION
      ? crmIntegrationRedemption.pointItemGlobalLocked ||
        crmIntegrationRedemption.benefitDisabledOverride === true ||
        !!crmIntegrationRedemption.selectedBenefitId
      : !!isCartRedeem || !!isOrderRedeem
  const selectedOrderDiscount =
    providerType === CRM_PROVIDER.INTEGRATION &&
    crmIntegrationRedemption.benefitDisabledOverride !== true &&
    isCrmIntegrationOrderDiscountBenefit(
      crmIntegrationRedemption.selectedBenefit
    )
      ? crmIntegrationRedemption.selectedBenefit
      : null
  const availableBenefitIds = useMemo(
    () =>
      new Set(
        [
          ...pointItems.map((item) =>
            getBenefitId(
              item.crmIntegrationBenefit ||
                item.rewardRule ||
                (isCrmIntegrationOrderDiscountBenefit(item) ? item : undefined)
            )
          ),
          ...voucherItems.map(getBenefitId),
        ]
          .filter((id) => id !== undefined && id !== null)
          .map(String)
      ),
    [pointItems, voucherItems]
  )
  const memberPhone = maskMemberPhone(memberInfo?.phone || '')

  const getPositionOptions = useMemoizedFn(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      iconWidth: rect?.width || DEFAULT_ICON_SIZE,
      iconHeight: rect?.height || DEFAULT_ICON_SIZE,
    }
  })
  const updatePosition = useMemoizedFn((nextPosition) => {
    positionRef.current = nextPosition
    setPosition(nextPosition)
  })
  const resetPosition = useMemoizedFn(() => {
    positionRef.current = null
    setPosition(null)
  })
  const updateListHeight = useMemoizedFn((height) => {
    const availableHeight = height ?? listAreaRef.current?.clientHeight
    if (!Number.isFinite(availableHeight) || availableHeight <= 0) return

    setListHeight(availableHeight)
  })
  const handleIconLoad = useMemoizedFn(() => {
    resetPosition()
  })
  const startDrag = useMemoizedFn((inputId, clientX, clientY) => {
    const rect = buttonRef.current?.getBoundingClientRect()
    pointerStateRef.current = {
      inputId,
      startX: clientX,
      startY: clientY,
      startPosition: positionRef.current || {
        x: rect?.left || 0,
        y: rect?.top || 0,
      },
      dragged: false,
    }
  })
  const moveDrag = useMemoizedFn((inputId, clientX, clientY, event) => {
    const pointerState = pointerStateRef.current
    if (!pointerState || pointerState.inputId !== inputId) return

    pointerState.dragged =
      pointerState.dragged ||
      hasExceededMemberRedemptionCenterDragThreshold({
        startX: pointerState.startX,
        startY: pointerState.startY,
        currentX: clientX,
        currentY: clientY,
      })
    if (!pointerState.dragged) return

    event?.preventDefault?.()
    updatePosition(
      clampMemberRedemptionCenterPosition(
        {
          x: pointerState.startPosition.x + clientX - pointerState.startX,
          y: pointerState.startPosition.y + clientY - pointerState.startY,
        },
        getPositionOptions()
      )
    )
  })
  const finishDrag = useMemoizedFn(
    (inputId, clientX, clientY, event, cancelled = false) => {
      const pointerState = pointerStateRef.current
      if (!pointerState || pointerState.inputId !== inputId) return

      const dragged =
        pointerState.dragged ||
        hasExceededMemberRedemptionCenterDragThreshold({
          startX: pointerState.startX,
          startY: pointerState.startY,
          currentX: clientX,
          currentY: clientY,
        })
      if (dragged) {
        event?.preventDefault?.()
        const nextPosition = clampMemberRedemptionCenterPosition(
          {
            x: pointerState.startPosition.x + clientX - pointerState.startX,
            y: pointerState.startPosition.y + clientY - pointerState.startY,
          },
          getPositionOptions()
        )
        updatePosition(nextPosition)
      } else if (!cancelled) {
        setOpen(true)
      }

      pointerStateRef.current = null
    }
  )
  const clearDraftState = useMemoizedFn(() => {
    setDraftSelection(null)
    setDetailItem(null)
    setVoucherDialog(null)
    setDescriptionRow(null)
    setStagePendingBenefitId(null)
  })
  const handleOrderDiscountSubmitComplete = useMemoizedFn(async () => {
    setOrderDiscountFeedbackOpen(false)
    setOrderDiscountSubmitting(false)
    try {
      await runFetchOrder()
    } finally {
      dispatch(
        crmIntegrationValidationActions.setOrderDiscountSyncSuspended(false)
      )
      clearDraftState()
      setOpen(false)
    }
  })
  const {
    doSubmit: submitCrmIntegrationDiscountOrder,
    data: orderDiscountSubmitData,
    error: orderDiscountSubmitError,
    loading: orderDiscountSubmitLoading,
  } = useSendCrmIntegrationDiscountOrder({
    beforeSubmit: () => {
      setOrderDiscountFeedbackOpen(true)
      setOrderDiscountSubmitting(true)
    },
    afterSubmit: handleOrderDiscountSubmitComplete,
  })
  const hasPointRemovalDraft = useMemo(() => {
    if (
      providerType !== CRM_PROVIDER.INTEGRATION ||
      draftSelection?.type !== MEMBER_REDEMPTION_TYPE.POINT ||
      getCandidateCount(draftSelection?.candidates || []) > 0
    ) {
      return false
    }

    return (
      getCrmIntegrationPointBenefitCartItems(cart, draftSelection.benefit)
        .length > 0
    )
  }, [cart, draftSelection, providerType])
  const hasAppliedItemRemovalDraft = useMemo(() => {
    if (
      providerType !== CRM_PROVIDER.INTEGRATION ||
      !draftSelection ||
      getCandidateCount(draftSelection?.candidates || []) > 0
    ) {
      return false
    }

    return (
      getCrmIntegrationPointBenefitCartItems(cart, draftSelection.benefit)
        .length > 0
    )
  }, [cart, draftSelection, providerType])
  const hasSelectedOrderDiscountRemovalDraft = useMemo(() => {
    if (
      providerType !== CRM_PROVIDER.INTEGRATION ||
      draftSelection?.type !== MEMBER_REDEMPTION_TYPE.POINT ||
      !selectedOrderDiscount ||
      !isCrmIntegrationOrderDiscountBenefit(draftSelection?.benefit) ||
      getCandidateCount(draftSelection?.candidates || []) > 0
    ) {
      return false
    }

    return (
      String(getBenefitId(draftSelection.benefit)) ===
      String(getBenefitId(selectedOrderDiscount))
    )
  }, [draftSelection, providerType, selectedOrderDiscount])
  const hasReplaceableRemovalDraft =
    hasAppliedItemRemovalDraft || hasSelectedOrderDiscountRemovalDraft
  const applyDraftChange = useMemoizedFn((options) => {
    const shouldReplaceAppliedRedemptionDraft =
      hasReplaceableRemovalDraft &&
      String(getBenefitId(draftSelection?.benefit)) !==
        String(getBenefitId(options.benefit))
    const result = resolveMemberRedemptionCenterDraftChange({
      draft: draftSelection,
      providerType,
      ...options,
      replaceAppliedRedemptionItems:
        shouldReplaceAppliedRedemptionDraft ||
        options.replaceAppliedRedemptionItems,
    })
    if (!result.accepted) {
      Toast.info(
        result.reason === 'different-benefit'
          ? t('crmIntegration.onlyOneBenefitSelectable')
          : t('crmIntegration.giftItemLimitReached', {
              value: options.maxSelectable,
            })
      )
      return false
    }
    setDraftSelection(result.draft)
    return true
  })
  const isPointRemovalDraftForBenefit = useMemoizedFn((benefit) => {
    if (
      !hasPointRemovalDraft ||
      String(getBenefitId(draftSelection?.benefit)) !==
        String(getBenefitId(benefit))
    ) {
      return false
    }

    return true
  })
  const handleClose = useMemoizedFn(() => {
    if (confirmPending || orderDiscountSubmitting || orderDiscountSubmitLoading)
      return
    clearDraftState()
    setOpen(false)
  })
  const handleUnavailableEntry = useMemoizedFn((row) => {
    const nextBenefit = getRowBenefit(row)
    if (
      isAppliedLocked &&
      !hasReplaceableRemovalDraft &&
      !isPointRemovalDraftForBenefit(nextBenefit)
    ) {
      Toast.info(t('crm.upperLimit'))
      return true
    }
    if (!isMemberLoggedIn) {
      Toast.info(t('crm.loginFirst'))
      setLoginOpen(true)
      return true
    }
    if (
      draftSelection &&
      !hasReplaceableRemovalDraft &&
      String(getBenefitId(draftSelection.benefit)) !==
        String(getBenefitId(nextBenefit))
    ) {
      Toast.info(t('crmIntegration.onlyOneBenefitSelectable'))
      return true
    }
    if (isCrmIntegrationOrderDiscountBenefit(row.item)) return false
    return (
      row.item?.outOfStock ||
      row.item?.displayMode ||
      row.item?.unavailable ||
      row.item?.enabled === false
    )
  })

  useEffect(() => {
    if (config?.open !== true || !buttonRef.current) return
    resetPosition()
  }, [config?.open, resetPosition])

  useEffect(() => {
    if (config?.open !== true) {
      clearDraftState()
      setOpen(false)
      return
    }

    let resizeFrame
    const handleResize = () => {
      resetPosition()
      window.cancelAnimationFrame(resizeFrame)
      resizeFrame = window.requestAnimationFrame(() => updateListHeight())
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.cancelAnimationFrame(resizeFrame)
      window.removeEventListener('resize', handleResize)
    }
  }, [config?.open, clearDraftState, resetPosition, updateListHeight])

  useEffect(() => {
    if (!open) return
    setActivePoints('all')
  }, [open])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => updateListHeight())
    return () => window.cancelAnimationFrame(frame)
  }, [
    activePoints,
    isMemberLoggedIn,
    open,
    resolvedActiveType,
    showTypeTabs,
    updateListHeight,
    view.rows.length,
    view.showPointFilters,
  ])

  useLayoutEffect(() => {
    if (!open) return undefined
    updateListHeight()

    const listArea = listAreaRef.current
    if (!listArea || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver((entries) => {
      updateListHeight(entries[0]?.contentRect?.height)
    })
    observer.observe(listArea)
    return () => observer.disconnect()
  }, [open, updateListHeight])

  useEffect(() => {
    setIconLoadFallback(false)
  }, [iconPath])

  useEffect(() => {
    const handleMouseMove = (event) => {
      moveDrag(MOUSE_DRAG_ID, event.clientX, event.clientY, event)
    }
    const handleMouseUp = (event) => {
      finishDrag(MOUSE_DRAG_ID, event.clientX, event.clientY, event)
    }
    const handleTouchMove = (event) => {
      const pointerState = pointerStateRef.current
      if (!pointerState?.inputId?.startsWith('touch:')) return
      const touch = Array.from(event.touches).find(
        (item) => pointerState.inputId === `touch:${item.identifier}`
      )
      if (touch)
        moveDrag(pointerState.inputId, touch.clientX, touch.clientY, event)
    }
    const handleTouchEnd = (event) => {
      const pointerState = pointerStateRef.current
      if (!pointerState?.inputId?.startsWith('touch:')) return
      const touch = Array.from(event.changedTouches).find(
        (item) => pointerState.inputId === `touch:${item.identifier}`
      )
      if (touch)
        finishDrag(pointerState.inputId, touch.clientX, touch.clientY, event)
    }
    const handleTouchCancel = (event) => {
      const pointerState = pointerStateRef.current
      if (!pointerState?.inputId?.startsWith('touch:')) return
      const touch = Array.from(event.changedTouches).find(
        (item) => pointerState.inputId === `touch:${item.identifier}`
      )
      if (touch) {
        finishDrag(
          pointerState.inputId,
          touch.clientX,
          touch.clientY,
          event,
          true
        )
      } else {
        pointerStateRef.current = null
      }
    }
    const handleNativeDragStart = (event) => {
      if (pointerStateRef.current) event.preventDefault()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchCancel)
    window.addEventListener('dragstart', handleNativeDragStart, true)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchCancel)
      window.removeEventListener('dragstart', handleNativeDragStart, true)
    }
  }, [finishDrag, moveDrag])

  useEffect(() => {
    clearDraftState()
    setActiveType(MEMBER_REDEMPTION_TYPE.ALL)
    setActivePoints('all')
  }, [memberIdentity, providerType, clearDraftState])

  useEffect(() => {
    if (isAppliedLocked && !selectedOrderDiscount) setDraftSelection(null)
  }, [isAppliedLocked, selectedOrderDiscount])

  useEffect(() => {
    if (
      draftSelection &&
      !availableBenefitIds.has(String(getBenefitId(draftSelection.benefit)))
    ) {
      setDraftSelection(null)
    }
  }, [availableBenefitIds, draftSelection])

  useEffect(() => {
    if (!pointOptions.includes(activePoints)) setActivePoints('all')
  }, [activePoints, pointOptions])

  const handlePointerDown = useMemoizedFn((event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    event.preventDefault()
    startDrag(`pointer:${event.pointerId}`, event.clientX, event.clientY)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch (error) {
      console.warn(error)
    }
  })

  const handlePointerMove = useMemoizedFn((event) => {
    moveDrag(`pointer:${event.pointerId}`, event.clientX, event.clientY, event)
  })

  const finishPointer = useMemoizedFn((event, cancelled = false) => {
    finishDrag(
      `pointer:${event.pointerId}`,
      event.clientX,
      event.clientY,
      event,
      cancelled
    )
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    } catch (error) {
      console.warn(error)
    }
  })
  const handleMouseDown = useMemoizedFn((event) => {
    if (event.button !== 0) return
    event.preventDefault()
    if (pointerStateRef.current) return
    startDrag(MOUSE_DRAG_ID, event.clientX, event.clientY)
  })
  const handleTouchStart = useMemoizedFn((event) => {
    event.preventDefault()
    if (pointerStateRef.current || !event.changedTouches.length) return
    const touch = event.changedTouches[0]
    startDrag(`touch:${touch.identifier}`, touch.clientX, touch.clientY)
  })

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return undefined

    const handleNativePointerMove = (event) => {
      moveDrag(
        `pointer:${event.pointerId}`,
        event.clientX,
        event.clientY,
        event
      )
    }
    const handleNativePointerUp = (event) => {
      finishDrag(
        `pointer:${event.pointerId}`,
        event.clientX,
        event.clientY,
        event
      )
    }
    const handleNativePointerCancel = (event) => {
      finishDrag(
        `pointer:${event.pointerId}`,
        event.clientX,
        event.clientY,
        event,
        true
      )
    }

    button.addEventListener('pointerdown', handlePointerDown)
    button.addEventListener('mousedown', handleMouseDown)
    button.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('pointermove', handleNativePointerMove)
    window.addEventListener('pointerup', handleNativePointerUp)
    window.addEventListener('pointercancel', handleNativePointerCancel)
    return () => {
      button.removeEventListener('pointerdown', handlePointerDown)
      button.removeEventListener('mousedown', handleMouseDown)
      button.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('pointermove', handleNativePointerMove)
      window.removeEventListener('pointerup', handleNativePointerUp)
      window.removeEventListener('pointercancel', handleNativePointerCancel)
    }
  }, [
    config?.open,
    finishDrag,
    handleMouseDown,
    handlePointerDown,
    handleTouchStart,
    moveDrag,
  ])

  const handlePointSelect = useMemoizedFn(async (row) => {
    if (handleUnavailableEntry(row)) return
    const item = row.item
    const benefit = getRowBenefit(row)
    const currentCandidates =
      draftSelection &&
      String(getBenefitId(draftSelection.benefit)) ===
        String(getBenefitId(benefit))
        ? draftSelection.candidates
        : []

    if (providerType === CRM_PROVIDER.LEGACY) {
      const failure = resolveLegacyPointRedemptionFailure({
        isLoggedIn: isMemberLoggedIn,
        hasRedeemed: isAppliedLocked,
        pointBalance: memberInfo?.pointBalance,
        requiredPoints: benefit?.redeemRule?.parameters?.points,
      })
      if (failure) {
        Toast.info(
          t(
            failure === 'login'
              ? 'crm.loginFirst'
              : failure === 'limit'
                ? 'crm.upperLimit'
                : 'crm.noEnoughPoint'
          )
        )
        return
      }
      applyDraftChange({
        benefit,
        type: MEMBER_REDEMPTION_TYPE.POINT,
        candidates: [
          {
            ...item,
            key: nanoid(),
            count: 1,
            realBenefitPrice: item.benefitPrice,
          },
        ],
        maxSelectable: 1,
      })
      return
    }

    if (isCrmIntegrationOrderDiscountBenefit(item)) {
      const benefitId = getBenefitId(benefit)
      if (
        hasSelectedOrderDiscountRemovalDraft &&
        String(benefitId) === String(getBenefitId(selectedOrderDiscount))
      ) {
        setDraftSelection(null)
        return
      }
      if (stagePendingBenefitId) return
      setStagePendingBenefitId(benefitId)
      try {
        const valid = await crmIntegrationRedemption.validateBenefitBeforeStage(
          benefit,
          {
            includeSdk: true,
            replaceAppliedRedemptionItems: hasReplaceableRemovalDraft,
          }
        )
        if (!valid) return
        applyDraftChange({
          benefit,
          type: MEMBER_REDEMPTION_TYPE.POINT,
          candidates: [
            {
              id: `${BENEFIT_ONLY_CANDIDATE}:${benefitId}`,
              count: 1,
              crmIntegrationBenefitOnly: true,
            },
          ],
          maxSelectable: 1,
        })
      } finally {
        setStagePendingBenefitId(null)
      }
      return
    }

    const benefitId = getBenefitId(benefit)
    if (stagePendingBenefitId) return
    setStagePendingBenefitId(benefitId)
    try {
      const valid = await crmIntegrationRedemption.validatePointItemBeforeStage(
        {
          benefit,
          item,
          draft: draftSelection,
        }
      )
      if (!valid) return
      if (shouldOpenPointItemDetail(item)) {
        setDetailItem({ item, benefit })
        return
      }
      const selectedCount = currentCandidates
        .filter(
          (candidate) => getPointItemKey(candidate) === getPointItemKey(item)
        )
        .reduce((total, candidate) => total + Number(candidate?.count || 0), 0)
      const candidates = resolveCrmIntegrationPointItemCandidates({
        currentBenefitItems: currentCandidates,
        item,
        count: selectedCount + 1,
        maxPending: item.crmIntegrationMaxSelectable,
      })
      applyDraftChange({
        benefit,
        type: MEMBER_REDEMPTION_TYPE.POINT,
        candidates,
        maxSelectable: item.crmIntegrationMaxSelectable,
      })
    } finally {
      setStagePendingBenefitId(null)
    }
  })

  const handleVoucherSelect = useMemoizedFn(async (row) => {
    if (handleUnavailableEntry(row) || stagePendingBenefitId) return
    const benefit = getRowBenefit(row)
    const benefitId = getBenefitId(benefit)
    setStagePendingBenefitId(benefitId)
    try {
      if (row.item?.crmIntegrationVoucherItem) {
        const currentCandidates =
          draftSelection &&
          String(getBenefitId(draftSelection.benefit)) ===
            String(getBenefitId(benefit))
            ? draftSelection.candidates
            : []
        if (shouldOpenPointItemDetail(row.item)) {
          const valid =
            await crmIntegrationRedemption.validateBenefitBeforeStage(benefit, {
              includeSdk: false,
              replaceAppliedRedemptionItems: hasAppliedItemRemovalDraft,
            })
          if (!valid) return
          setDetailItem({
            item: row.item,
            benefit,
            type: MEMBER_REDEMPTION_TYPE.VOUCHER,
          })
          return
        }
        const selectedCount = currentCandidates
          .filter(
            (candidate) =>
              getVoucherItemKey(candidate) === getVoucherItemKey(row.item)
          )
          .reduce(
            (total, candidate) => total + Number(candidate?.count || 0),
            0
          )
        const candidates = resolveCrmIntegrationVoucherItemCandidates({
          currentBenefitItems: currentCandidates,
          item: row.item,
          count: selectedCount + 1,
          maxPending: row.item.crmIntegrationMaxSelectable,
        })
        const valid =
          await crmIntegrationRedemption.validateBenefitCandidatesBeforeStage(
            benefit,
            candidates,
            {
              replaceAppliedRedemptionItems: hasAppliedItemRemovalDraft,
            }
          )
        if (!valid) return
        applyDraftChange({
          benefit,
          type: MEMBER_REDEMPTION_TYPE.VOUCHER,
          candidates,
          maxSelectable: getVoucherMaxSelectable(benefit),
        })
        return
      }

      const valid = await crmIntegrationRedemption.validateBenefitBeforeStage(
        benefit,
        {
          includeSdk: !benefit.hasCouponItemDialog,
          replaceAppliedRedemptionItems: hasAppliedItemRemovalDraft,
        }
      )
      if (!valid) return
      if (benefit.hasCouponItemDialog) {
        setVoucherDialog(benefit)
        return
      }
      applyDraftChange({
        benefit,
        type: MEMBER_REDEMPTION_TYPE.VOUCHER,
        candidates: [
          {
            id: `${BENEFIT_ONLY_CANDIDATE}:${benefitId}`,
            count: 1,
            crmIntegrationBenefitOnly: true,
          },
        ],
        maxSelectable: 1,
      })
    } finally {
      setStagePendingBenefitId(null)
    }
  })

  const handleSelect = useMemoizedFn((row) => {
    if (row.type === MEMBER_REDEMPTION_TYPE.VOUCHER) {
      handleVoucherSelect(row)
      return
    }
    handlePointSelect(row)
  })

  const stageAppliedPointItemReduction = useMemoizedFn((row, benefit) => {
    if (
      providerType !== CRM_PROVIDER.INTEGRATION ||
      row.type !== MEMBER_REDEMPTION_TYPE.POINT
    ) {
      return false
    }

    const pointItemKey = getPointItemKey(row.item)
    const currentBenefitItems = getCrmIntegrationPointBenefitCartItems(
      cart,
      benefit
    )
      .filter((item) => Number(item?.count || 0) > 0)
      .map((item) => ({ ...item }))
    const matchedItems = currentBenefitItems.filter(
      (item) => getPointItemKey(item) === pointItemKey
    )
    const targetItem = matchedItems[matchedItems.length - 1]
    if (!targetItem?.key) return false

    let reduced = false
    const candidates = currentBenefitItems
      .map((item) => {
        if (!reduced && item.key === targetItem.key) {
          reduced = true
          return {
            ...item,
            count: Number(item.count || 0) - 1,
          }
        }
        return item
      })
      .filter((item) => Number(item?.count || 0) > 0)

    if (!reduced) return false
    return applyDraftChange({
      benefit,
      type: MEMBER_REDEMPTION_TYPE.POINT,
      candidates,
      maxSelectable: row.item.crmIntegrationMaxSelectable,
      keepEmptyDraft: true,
    })
  })

  const stageAppliedVoucherItemReduction = useMemoizedFn((row, benefit) => {
    if (
      providerType !== CRM_PROVIDER.INTEGRATION ||
      row.type !== MEMBER_REDEMPTION_TYPE.VOUCHER ||
      !row.item?.crmIntegrationVoucherItem
    ) {
      return false
    }

    const voucherItemKey = getVoucherItemKey(row.item)
    const currentBenefitItems = getCrmIntegrationPointBenefitCartItems(
      cart,
      benefit
    )
      .filter((item) => Number(item?.count || 0) > 0)
      .map((item) => ({ ...item }))
    const matchedItems = currentBenefitItems.filter(
      (item) => getVoucherItemKey(item) === voucherItemKey
    )
    const targetItem = matchedItems[matchedItems.length - 1]
    if (!targetItem?.key) return false

    let reduced = false
    const candidates = currentBenefitItems
      .map((item) => {
        if (!reduced && item.key === targetItem.key) {
          reduced = true
          return {
            ...item,
            count: Number(item.count || 0) - 1,
          }
        }
        return item
      })
      .filter((item) => Number(item?.count || 0) > 0)

    if (!reduced) return false
    return applyDraftChange({
      benefit,
      type: MEMBER_REDEMPTION_TYPE.VOUCHER,
      candidates,
      maxSelectable: getVoucherMaxSelectable(benefit),
      keepEmptyDraft: true,
    })
  })

  const handleReduce = useMemoizedFn((row) => {
    const benefit = getRowBenefit(row)
    if (
      !draftSelection ||
      String(getBenefitId(draftSelection.benefit)) !==
        String(getBenefitId(benefit))
    ) {
      if (
        selectedOrderDiscount &&
        isCrmIntegrationOrderDiscountBenefit(row.item) &&
        String(getBenefitId(selectedOrderDiscount)) ===
          String(getBenefitId(benefit))
      ) {
        setDraftSelection({
          providerType: CRM_PROVIDER.INTEGRATION,
          type: MEMBER_REDEMPTION_TYPE.POINT,
          benefit,
          candidates: [],
        })
        return
      }
      if (stageAppliedPointItemReduction(row, benefit)) return
      stageAppliedVoucherItemReduction(row, benefit)
      return
    }
    if (row.type === MEMBER_REDEMPTION_TYPE.VOUCHER) {
      if (row.item?.crmIntegrationVoucherItem) {
        const voucherItemKey = getVoucherItemKey(row.item)
        const candidates = draftSelection.candidates.map((candidate) => ({
          ...candidate,
        }))
        let candidateIndex = -1
        for (let index = candidates.length - 1; index >= 0; index--) {
          if (getVoucherItemKey(candidates[index]) === voucherItemKey) {
            candidateIndex = index
            break
          }
        }
        if (candidateIndex < 0) return
        if (Number(candidates[candidateIndex].count || 0) <= 1) {
          candidates.splice(candidateIndex, 1)
        } else {
          candidates[candidateIndex].count -= 1
        }
        applyDraftChange({
          benefit,
          type: MEMBER_REDEMPTION_TYPE.VOUCHER,
          candidates,
          maxSelectable: getVoucherMaxSelectable(benefit),
        })
        return
      }
      setDraftSelection(null)
      return
    }

    if (isCrmIntegrationOrderDiscountBenefit(row.item)) {
      setDraftSelection(null)
      return
    }

    const pointItemKey = getPointItemKey(row.item)
    const candidates = draftSelection.candidates.map((candidate) => ({
      ...candidate,
    }))
    let candidateIndex = -1
    for (let index = candidates.length - 1; index >= 0; index--) {
      if (getPointItemKey(candidates[index]) === pointItemKey) {
        candidateIndex = index
        break
      }
    }
    if (candidateIndex < 0) return
    if (Number(candidates[candidateIndex].count || 0) <= 1) {
      candidates.splice(candidateIndex, 1)
    } else {
      candidates[candidateIndex].count -= 1
    }
    applyDraftChange({
      benefit,
      type: MEMBER_REDEMPTION_TYPE.POINT,
      candidates,
      maxSelectable:
        providerType === CRM_PROVIDER.LEGACY
          ? 1
          : row.item.crmIntegrationMaxSelectable,
      keepEmptyDraft:
        providerType === CRM_PROVIDER.INTEGRATION &&
        candidates.length === 0 &&
        getCrmIntegrationPointBenefitCartItems(cart, benefit).length > 0,
    })
  })

  const handlePointDetailSubmit = useMemoizedFn(async (detailData) => {
    if (!detailItem) return
    const { item, benefit } = detailItem
    const currentCandidates =
      draftSelection &&
      String(getBenefitId(draftSelection.benefit)) ===
        String(getBenefitId(benefit))
        ? draftSelection.candidates
        : []
    const isVoucherDetail = detailItem.type === MEMBER_REDEMPTION_TYPE.VOUCHER
    const candidates = isVoucherDetail
      ? resolveCrmIntegrationVoucherItemCandidates({
          currentBenefitItems: currentCandidates,
          item,
          detailData,
          maxPending: item.crmIntegrationMaxSelectable,
        })
      : resolveCrmIntegrationPointItemCandidates({
          currentBenefitItems: currentCandidates,
          item,
          detailData,
          maxPending: item.crmIntegrationMaxSelectable,
        })
    if (isVoucherDetail) {
      const valid =
        await crmIntegrationRedemption.validateBenefitCandidatesBeforeStage(
          benefit,
          candidates,
          {
            replaceAppliedRedemptionItems: hasAppliedItemRemovalDraft,
          }
        )
      if (!valid) return
    }

    applyDraftChange({
      benefit,
      type: isVoucherDetail
        ? MEMBER_REDEMPTION_TYPE.VOUCHER
        : MEMBER_REDEMPTION_TYPE.POINT,
      candidates,
      maxSelectable: isVoucherDetail
        ? getVoucherMaxSelectable(benefit)
        : item.crmIntegrationMaxSelectable,
    })
    setDetailItem(null)
  })

  const handleVoucherStage = useMemoizedFn(async (benefit, candidates) => {
    const valid =
      await crmIntegrationRedemption.validateBenefitCandidatesBeforeStage(
        benefit,
        candidates,
        {
          replaceAppliedRedemptionItems: hasAppliedItemRemovalDraft,
        }
      )
    if (!valid) return false

    return applyDraftChange({
      benefit,
      type: MEMBER_REDEMPTION_TYPE.VOUCHER,
      candidates,
      maxSelectable: getVoucherMaxSelectable(benefit),
    })
  })

  const appliedCartRewardCount = useMemo(() => {
    if (providerType !== CRM_PROVIDER.INTEGRATION) return 0

    return (Array.isArray(cart) ? cart : [])
      .filter(
        (item) =>
          item?.crmIntegrationPointItemKey || item?.crmIntegrationVoucherItemKey
      )
      .reduce((total, item) => total + Number(item?.count || 0), 0)
  }, [cart, providerType])
  const hasAppliedCartReward = isAppliedLocked && appliedCartRewardCount > 0

  const handleConfirm = useMemoizedFn(async () => {
    if (!isMemberLoggedIn) {
      setLoginOpen(true)
      return
    }
    if (confirmPending || orderDiscountSubmitting || orderDiscountSubmitLoading)
      return
    if (!draftSelection) {
      setOpen(false)
      return
    }
    const isSelectedOrderDiscountRemovalDraft =
      providerType === CRM_PROVIDER.INTEGRATION &&
      isCrmIntegrationOrderDiscountBenefit(draftSelection.benefit) &&
      getCandidateCount(draftSelection.candidates || []) === 0 &&
      String(getBenefitId(crmIntegrationRedemption.selectedBenefit)) ===
        String(getBenefitId(draftSelection.benefit))
    if (isSelectedOrderDiscountRemovalDraft) {
      dispatch(crmIntegrationValidationActions.clearSelectedBenefit())
      clearDraftState()
      setOpen(false)
      return
    }
    setConfirmPending(true)
    try {
      if (providerType === CRM_PROVIDER.LEGACY) {
        const benefit = draftSelection.benefit
        const failure = resolveLegacyPointRedemptionFailure({
          isLoggedIn: isMemberLoggedIn,
          hasRedeemed: isAppliedLocked,
          pointBalance: memberInfo?.pointBalance,
          requiredPoints: benefit?.redeemRule?.parameters?.points,
        })
        if (failure) {
          Toast.info(
            t(
              failure === 'login'
                ? 'crm.loginFirst'
                : failure === 'limit'
                  ? 'crm.upperLimit'
                  : 'crm.noEnoughPoint'
            )
          )
          return
        }
        const nextCart = [
          ...(Array.isArray(cart) ? cart : []),
          ...draftSelection.candidates,
        ]
        setCart(nextCart)
        setStoragedCart(nextCart)
        clearDraftState()
        setOpen(false)
        return
      }

      const isOrderDiscountDraft =
        providerType === CRM_PROVIDER.INTEGRATION &&
        isCrmIntegrationOrderDiscountBenefit(draftSelection.benefit)
      if (isOrderDiscountDraft) {
        dispatch(
          crmIntegrationValidationActions.setOrderDiscountSyncSuspended(true)
        )
      }
      try {
        const confirmed =
          await crmIntegrationRedemption.confirmRedemptionDraft(draftSelection)
        if (!confirmed) {
          if (isOrderDiscountDraft) {
            dispatch(
              crmIntegrationValidationActions.setOrderDiscountSyncSuspended(
                false
              )
            )
          }
          return
        }
        if (
          shouldSubmitCrmIntegrationDiscountOrder({
            isOrderDiscountDraft,
            currentOrderId: getStorageValue('emenu_table', {})?.currentOrder
              ?.id,
            orders,
          })
        ) {
          await submitCrmIntegrationDiscountOrder()
          return
        }
        if (isOrderDiscountDraft) {
          dispatch(
            crmIntegrationValidationActions.setOrderDiscountSyncSuspended(false)
          )
        }
        clearDraftState()
        setOpen(false)
      } catch (error) {
        if (isOrderDiscountDraft) {
          dispatch(
            crmIntegrationValidationActions.setOrderDiscountSyncSuspended(false)
          )
        }
        throw error
      }
    } finally {
      setConfirmPending(false)
    }
  })

  const getRowProps = useMemoizedFn((row) => {
    const benefit = getRowBenefit(row)
    const isSelectedOrderDiscount =
      !!selectedOrderDiscount &&
      String(getBenefitId(selectedOrderDiscount)) ===
        String(getBenefitId(benefit))
    const isCurrentBenefit =
      draftSelection &&
      String(getBenefitId(draftSelection.benefit)) ===
        String(getBenefitId(benefit))
    const currentDraftTotal = isCurrentBenefit
      ? getCandidateCount(draftSelection.candidates)
      : 0
    const isCurrentPointRemovalDraft =
      row.type === MEMBER_REDEMPTION_TYPE.POINT &&
      isPointRemovalDraftForBenefit(benefit)
    const appliedCount = isSelectedOrderDiscount
      ? 1
      : providerType === CRM_PROVIDER.INTEGRATION
        ? row.type === MEMBER_REDEMPTION_TYPE.POINT
          ? getCrmIntegrationPointBenefitCartItems(cart, benefit)
              .filter(
                (candidate) =>
                  getPointItemKey(candidate) === getPointItemKey(row.item)
              )
              .reduce(
                (total, candidate) => total + Number(candidate?.count || 0),
                0
              )
          : row.type === MEMBER_REDEMPTION_TYPE.VOUCHER &&
              row.item?.crmIntegrationVoucherItem
            ? getCrmIntegrationPointBenefitCartItems(cart, benefit)
                .filter(
                  (candidate) =>
                    getVoucherItemKey(candidate) === getVoucherItemKey(row.item)
                )
                .reduce(
                  (total, candidate) => total + Number(candidate?.count || 0),
                  0
                )
            : 0
        : 0
    const selectedCount = !isCurrentBenefit
      ? 0
      : row.type === MEMBER_REDEMPTION_TYPE.VOUCHER
        ? row.item?.crmIntegrationVoucherItem
          ? draftSelection.candidates
              .filter(
                (candidate) =>
                  getVoucherItemKey(candidate) === getVoucherItemKey(row.item)
              )
              .reduce(
                (total, candidate) => total + Number(candidate?.count || 0),
                0
              )
          : getCandidateCount(draftSelection.candidates)
        : isCrmIntegrationOrderDiscountBenefit(row.item)
          ? getCandidateCount(draftSelection.candidates)
          : draftSelection.candidates
              .filter(
                (candidate) =>
                  getPointItemKey(candidate) === getPointItemKey(row.item)
              )
              .reduce(
                (total, candidate) => total + Number(candidate?.count || 0),
                0
              )
    const disabledByAppliedLimit =
      isAppliedLocked &&
      !hasReplaceableRemovalDraft &&
      draftSelection?.replaceAppliedRedemptionItems !== true &&
      appliedCount <= 0 &&
      !isCurrentPointRemovalDraft
    const disabledByLogin = !isMemberLoggedIn
    const shouldRestrictToCurrentDraft =
      !!draftSelection && !hasReplaceableRemovalDraft
    const disabled =
      disabledByAppliedLimit ||
      disabledByLogin ||
      row.item?.outOfStock ||
      row.item?.displayMode ||
      row.item?.unavailable ||
      row.item?.enabled === false ||
      (shouldRestrictToCurrentDraft &&
        (!isCurrentBenefit || (currentDraftTotal > 0 && selectedCount <= 0)))

    return {
      disabled,
      disabledClickable: disabledByAppliedLimit || disabledByLogin,
      pending: String(stagePendingBenefitId) === String(getBenefitId(benefit)),
      selectedCount,
      appliedCount,
      hasDraftSelection: !!draftSelection && isCurrentBenefit,
    }
  })

  const rowProps = useMemo(
    () => ({
      onSelect: handleSelect,
      onReduce: handleReduce,
      onDetail: setDescriptionRow,
    }),
    [handleReduce, handleSelect]
  )
  const listStateKey = useMemo(() => {
    const candidatesKey = (draftSelection?.candidates || [])
      .map(
        (candidate) =>
          `${
            candidate.crmIntegrationVoucherItemKey ||
            candidate.crmIntegrationPointItemKey ||
            candidate.id
          }:${candidate.count || 0}`
      )
      .join('|')
    const appliedCartKey = (Array.isArray(cart) ? cart : [])
      .filter(
        (item) =>
          item?.crmIntegrationPointItemKey || item?.crmIntegrationVoucherItemKey
      )
      .map(
        (item) =>
          `${
            item.crmIntegrationPointItemKey || item.crmIntegrationVoucherItemKey
          }:${item.count || 0}`
      )
      .join('|')

    return [
      getBenefitId(draftSelection?.benefit) || '',
      candidatesKey,
      appliedCartKey,
      stagePendingBenefitId || '',
      isAppliedLocked ? 'locked' : '',
      hasPointRemovalDraft ? 'point-removal-draft' : '',
      hasAppliedItemRemovalDraft ? 'item-removal-draft' : '',
      hasSelectedOrderDiscountRemovalDraft
        ? 'order-discount-removal-draft'
        : '',
      draftSelection?.replaceAppliedRedemptionItems ? 'replacement-draft' : '',
      isMemberLoggedIn ? 'member' : 'guest',
    ].join(';')
  }, [
    cart,
    draftSelection,
    hasAppliedItemRemovalDraft,
    hasPointRemovalDraft,
    hasSelectedOrderDiscountRemovalDraft,
    isAppliedLocked,
    isMemberLoggedIn,
    stagePendingBenefitId,
  ])
  const draftRewardCount = useMemo(
    () => getCandidateCount(draftSelection?.candidates || []),
    [draftSelection]
  )
  const footerRewardCount = draftSelection
    ? draftRewardCount
    : selectedOrderDiscount
      ? 1
      : hasAppliedCartReward
        ? appliedCartRewardCount
        : 0
  const stagedVoucherCandidates =
    voucherDialog &&
    String(getBenefitId(draftSelection?.benefit)) ===
      String(getBenefitId(voucherDialog))
      ? draftSelection.candidates
      : []
  const pointDetailSelectedTotal = detailItem
    ? getCandidateCount(
        String(getBenefitId(draftSelection?.benefit)) ===
          String(getBenefitId(detailItem.benefit))
          ? draftSelection.candidates
          : []
      )
    : 0
  const pointDetailMax = detailItem?.item?.crmIntegrationMaxSelectable
  const pointDetailRemaining = Number.isFinite(pointDetailMax)
    ? Math.max(pointDetailMax - pointDetailSelectedTotal, 0)
    : 99

  if (!shouldShow) return null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.floatingButton}
        aria-label={t('MemberRedemptionCenter.title')}
        style={
          position
            ? { left: position.x, top: position.y }
            : { right: 20, bottom: 20 }
        }
        onClick={(event) => {
          if (event.detail === 0) setOpen(true)
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishPointer(event)}
        onPointerCancel={(event) => finishPointer(event, true)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <img
          draggable={false}
          src={
            isDefaultFloatingIcon
              ? defaultMemberRedemptionCenterIcon
              : serverUrl + iconPath
          }
          alt={t('MemberRedemptionCenter.title')}
          className={`${styles.floatingIcon} ${
            isDefaultFloatingIcon ? styles.defaultFloatingIcon : ''
          }`}
          onLoad={handleIconLoad}
          onError={(event) => {
            event.currentTarget.onerror = null
            setIconLoadFallback(true)
            event.currentTarget.src = defaultMemberRedemptionCenterIcon
          }}
        />
      </button>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={false}
        classes={{ paper: styles.dialogPaper }}
      >
        <div className={styles.dialogLayout}>
          <DialogTitle disableTypography className={styles.dialogTitle}>
            <span>{t('MemberRedemptionCenter.title')}</span>
            <IconButton
              aria-label={t('common.close', { defaultValue: 'Close' })}
              disabled={
                confirmPending ||
                orderDiscountSubmitting ||
                orderDiscountSubmitLoading
              }
              onClick={handleClose}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <div className={styles.dialogTop}>
            {showTypeTabs ? (
              <div className={styles.typeTabs}>
                {[
                  MEMBER_REDEMPTION_TYPE.ALL,
                  MEMBER_REDEMPTION_TYPE.POINT,
                  MEMBER_REDEMPTION_TYPE.VOUCHER,
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`${styles.typeTab} ${
                      resolvedActiveType === type ? styles.selectedTypeTab : ''
                    }`}
                    onClick={() => setActiveType(type)}
                  >
                    {t(
                      `MemberRedemptionCenter.${
                        type === MEMBER_REDEMPTION_TYPE.ALL
                          ? 'typeAll'
                          : type === MEMBER_REDEMPTION_TYPE.POINT
                            ? 'typePoint'
                            : 'typeVoucher'
                      }`
                    )}
                  </button>
                ))}
              </div>
            ) : null}
            {isMemberLoggedIn ? (
              <div className={styles.memberInfo}>
                <span>{memberPhone}</span>
                <span className={styles.memberPoints}>
                  {t('MemberRedemptionCenter.memberPoints', {
                    value: memberInfo?.pointBalance || 0,
                  })}
                </span>
              </div>
            ) : null}
            {view.showPointFilters ? (
              <div className={styles.pointFilters}>
                {pointOptions.map((points) => (
                  <button
                    key={points}
                    type="button"
                    className={`${styles.pointFilter} ${
                      activePoints === points ? styles.selectedPointFilter : ''
                    }`}
                    onClick={() => setActivePoints(points)}
                  >
                    {points === 'all'
                      ? t('MemberRedemptionCenter.allPoints')
                      : t('MemberRedemptionCenter.pointsFilter', {
                          value: points,
                        })}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div ref={listAreaRef} className={styles.listArea}>
            {view.rows.length ? (
              <RewardList
                rows={view.rows}
                height={listHeight}
                resetKey={`${resolvedActiveType}:${activePoints}`}
                stateKey={listStateKey}
                rowProps={rowProps}
                getRowProps={getRowProps}
              />
            ) : (
              <div className={styles.empty}>
                {t('MemberRedemptionCenter.empty')}
              </div>
            )}
          </div>
          <div className={styles.dialogFooter}>
            <button
              type="button"
              className={`${styles.footerButton} ${
                !isMemberLoggedIn ? styles.loginFooterButton : ''
              }`}
              disabled={
                isMemberLoggedIn &&
                (confirmPending ||
                  orderDiscountSubmitting ||
                  orderDiscountSubmitLoading)
              }
              onClick={handleConfirm}
            >
              {isMemberLoggedIn
                ? t('MemberRedemptionCenter.confirmRewards', {
                    count: footerRewardCount,
                  })
                : t('crm.login')}
            </button>
          </div>
        </div>
      </Dialog>
      <DishDialog
        data={
          detailItem
            ? {
                ...detailItem.item,
                itemMax: pointDetailRemaining,
              }
            : {}
        }
        open={!!detailItem}
        onSubmit={handlePointDetailSubmit}
        onClose={() => setDetailItem(null)}
        hidePrice={detailItem?.item?.crmIntegrationHideDetailPrice === true}
        comboItem={!!detailItem?.item?.combo}
        combo={detailItem?.item?.combo}
      />
      <CrmIntegrationRewardItemsDialog
        reward={voucherDialog}
        stageOnly
        stagedCandidates={stagedVoucherCandidates}
        onStage={handleVoucherStage}
        onClose={() => setVoucherDialog(null)}
      />
      <Dialog
        open={!!descriptionRow}
        onClose={() => setDescriptionRow(null)}
        maxWidth="sm"
        fullWidth
        classes={{ paper: styles.descriptionDialogPaper }}
      >
        <DialogTitle
          disableTypography
          className={styles.descriptionDialogTitle}
        >
          <span>{t('MemberRedemptionCenter.descriptionTitle')}</span>
          <IconButton
            className={styles.descriptionDialogClose}
            aria-label={t('common.close', { defaultValue: 'Close' })}
            onClick={() => setDescriptionRow(null)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className={styles.descriptionDialogContent}>
          {getRewardDescription(descriptionRow)}
        </DialogContent>
      </Dialog>
      <FeedbackToast
        open={orderDiscountFeedbackOpen}
        loading={orderDiscountSubmitting}
        error={orderDiscountSubmitError}
        data={orderDiscountSubmitData}
        onClose={() => setOrderDiscountFeedbackOpen(false)}
      />
    </>
  )
}

export default MemberRedemptionCenter
