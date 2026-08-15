import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Dialog, IconButton } from '@material-ui/core'
import { ArrowBackIosRounded } from '@material-ui/icons'
import { FixedSizeList as List } from 'react-window'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import classNames from 'classnames'
import { nanoid } from 'nanoid'
import { isEqual } from 'lodash-es'
import DishDialog from '@/components/DishDialog'
import OperateSubDishModal from '@/components/DishDialog/OperateSubDishModal'
import ImgFallback from '@/components/common/ImgFallback'
import ManualCounter from '@/components/ManualCounter'
import Toast from '@/components/Toast'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { serverUrl } from '@/utils/env_var'
import { runCrmIntegrationRewardDialogConfirm } from '@/components/MemberRedemptionCenter/model'
import {
  buildCrmIntegrationManualGiftItemDiscount,
  CRM_INTEGRATION_REWARD_KIND,
  getCrmIntegrationBenefitRuleId,
  hasCrmIntegrationBenefitItemMarker,
  hasCrmIntegrationDiscountId,
} from '@/utils/crmIntegrationRewards'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'
import styles from './index.module.less'

const EMPTY_CANDIDATES = []

function getDisplayPrice(item) {
  if (Array.isArray(item.itemPrices) && item.itemPrices.length > 0) {
    return Math.min(...item.itemPrices.map((price) => Number(price.price || 0)))
  }
  return Number(item.price || item.displayPrice || 0)
}

function hasFilteredSizes(item) {
  return Array.isArray(item.itemPrices) && item.itemPrices.length > 0
}

function createGiftCandidateCartItem(item, detailData = {}) {
  const cartItem = { ...item, ...detailData }
  delete cartItem.discountList
  const priceItem =
    detailData.priceItem ??
    (Array.isArray(item.itemPrices) && item.itemPrices.length === 1
      ? item.itemPrices[0]
      : undefined)
  const price = Number(
    detailData.realPrice ?? priceItem?.price ?? getDisplayPrice(item)
  )
  const benefitPrice = Number(
    detailData.realBenefitPrice ?? item.benefitPrice ?? price
  )
  const crmIntegrationPointItemBasePrice = getDisplayPrice(item)
  const crmIntegrationPointItemBaseBenefitPrice =
    Array.isArray(item.itemPrices) && item.itemPrices.length > 0
      ? Math.min(
          ...item.itemPrices.map((price) =>
            Number(price.benefitPrice ?? price.price ?? 0)
          )
        )
      : Number(item.benefitPrice ?? crmIntegrationPointItemBasePrice)

  return {
    ...cartItem,
    key: nanoid(),
    count: Number(detailData.count || 1),
    options: detailData.options || [],
    priceItem,
    crmIntegrationPointItemBasePrice,
    crmIntegrationPointItemBaseBenefitPrice,
    benefitPrice: detailData.benefitPrice ?? item.benefitPrice ?? price,
    realPrice: price,
    realBenefitPrice: benefitPrice,
  }
}

function getGiftCandidateCount(candidate) {
  return Number(candidate?.count || 0)
}

function isSameGiftCandidate(candidate, nextCandidate) {
  return (
    String(candidate?.id) === String(nextCandidate?.id) &&
    isEqual(candidate?.priceItem, nextCandidate?.priceItem) &&
    isEqual(candidate?.options, nextCandidate?.options) &&
    candidate?.instructions === nextCandidate?.instructions
  )
}

function mergeGiftCandidate(prev, nextCandidate, remainingCount) {
  const nextCount = Math.min(
    getGiftCandidateCount(nextCandidate),
    Math.max(remainingCount, 0)
  )
  if (nextCount <= 0) return prev

  const normalizedCandidate = {
    ...nextCandidate,
    count: nextCount,
  }
  const index = prev.findIndex((candidate) =>
    isSameGiftCandidate(candidate, normalizedCandidate)
  )

  if (index < 0) {
    return [...prev, normalizedCandidate]
  }

  return prev.map((candidate, candidateIndex) =>
    candidateIndex === index
      ? {
          ...candidate,
          count: getGiftCandidateCount(candidate) + nextCount,
        }
      : candidate
  )
}

function getCounterMax(value, selectedTotal, maxSelectable) {
  if (!Number.isFinite(maxSelectable)) return maxSelectable
  return value + Math.max(maxSelectable - selectedTotal, 0)
}

function shouldOpenDishDetail(item) {
  return !!item?.large
}

const CrmIntegrationRewardItemRow = memo(function CrmIntegrationRewardItemRow({
  index,
  style,
  data,
}) {
  const item = data.itemList[index]
  const itemId = String(item?.id)
  const selectedCount = data.selectedCountById.get(itemId) || 0
  const submittedCount = data.submittedCountById.get(itemId) || 0
  const selected = selectedCount > 0
  const disabled =
    data.isSubmittedBenefitLocked ||
    (data.isSelectableItemBenefit &&
      data.selectedTotal >= data.maxSelectable &&
      !selected)
  const counterMax = getCounterMax(
    selectedCount,
    data.selectedTotal,
    data.maxSelectable
  )
  const name = data.t(item.id, {
    defaultValue: item.name,
    ns: 'dish',
  })
  const price = getDisplayPrice(item)
  const hasSize = hasFilteredSizes(item)
  const priceSuffix = hasSize ? '+' : ''
  const handleSelectItem = () => {
    if (disabled) return
    if (shouldOpenDishDetail(item)) {
      if (
        data.isSelectableItemBenefit &&
        data.selectedTotal >= data.maxSelectable
      ) {
        return
      }
      data.onOpenDetail(item)
      return
    }
    data.onAdd(item)
  }
  const handleRowClick = () => {
    handleSelectItem()
  }
  const stopPropagation = (event) => {
    event.stopPropagation()
  }

  return (
    <div style={style} className={styles.rowWrapper}>
      <div
        className={classNames(
          styles.row,
          selected && styles.selectedRow,
          disabled && styles.disabledRow
        )}
        onClick={handleRowClick}
      >
        <ImgFallback
          src={item.pic ? serverUrl + item.pic : ''}
          className={styles.image}
          itemName={item.name}
        />
        <div className={styles.info}>
          <div className={styles.name}>{name}</div>
          <div className={styles.meta}>
            {data.isGiftItem ? (
              <>
                <span className={styles.giftOriginalPrice}>
                  ${price.toFixed(2)}
                  {priceSuffix}
                </span>
                <span className={styles.giftFreePrice}>$0.00</span>
              </>
            ) : data.isSpecialItem && typeof item.specialPrice === 'number' ? (
              <>
                <span className={styles.specialPrice}>
                  ${Number(item.specialPrice).toFixed(2)}
                  {priceSuffix}
                </span>
                <span className={styles.originalPrice}>
                  ${price.toFixed(2)}
                  {priceSuffix}
                </span>
              </>
            ) : (
              <span className={styles.price}>
                ${price.toFixed(2)}
                {priceSuffix}
              </span>
            )}
          </div>
        </div>
        {data.isSelectableItemBenefit && selected ? (
          <div className={styles.counter} onClick={stopPropagation}>
            <ManualCounter
              value={selectedCount}
              max={counterMax}
              min={submittedCount}
              disabled={disabled}
              onClickAdd={handleSelectItem}
              onClickReduce={() => data.onReduce(item)}
            />
          </div>
        ) : null}
        {data.isSelectableItemBenefit && !selected ? (
          <div className={styles.counter} onClick={stopPropagation}>
            <ManualCounter
              value={0}
              max={counterMax}
              disabled={disabled}
              onClickAdd={handleSelectItem}
              onClickReduce={() => data.onReduce(item)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
})

const CrmIntegrationRewardItemsDialog = ({
  reward,
  onClose,
  onSelect,
  onBeforeConfirm,
  stageOnly = false,
  stagedCandidates = EMPTY_CANDIDATES,
  onStage,
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [cart, setCart] = useGlobalState('Cart')
  const [orders] = useGlobalState('Orders')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const selectedBenefit = useSelector(
    (state) => state.crmIntegrationValidationSlice.selectedBenefit
  )
  const [selectedGiftItemCandidates, setSelectedGiftItemCandidates] = useState(
    []
  )
  const [detailItem, setDetailItem] = useState(null)
  const [removeDetailItem, setRemoveDetailItem] = useState(null)
  const open = !!reward?.id
  const itemList = reward?.couponItemList || []
  const title = reward?.name
  const isGiftItem =
    reward?.crmIntegrationRewardKind === CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
  const isSpecialItem =
    reward?.crmIntegrationRewardKind ===
    CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM
  const isQuantityItemDiscount =
    reward?.crmIntegrationRewardKind ===
    CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT
  const isSelectableItemBenefit =
    isGiftItem || isSpecialItem || isQuantityItemDiscount
  const hideDetailPrice =
    isGiftItem || (isSpecialItem && reward?.includeSpecItems === true)
  const rewardRuleId = useMemo(
    () => getCrmIntegrationBenefitRuleId(reward),
    [reward]
  )
  const giftQuantity = Number(reward?.giftQuantity || 0)
  const specialQuantityLimit = Number(reward?.quantityLimit || 0)
  const maxSelectable =
    isGiftItem && giftQuantity > 0
      ? giftQuantity
      : isGiftItem
        ? 1
        : isSpecialItem && specialQuantityLimit > 0
          ? specialQuantityLimit
          : Infinity
  const selectedTotal = useMemo(
    () =>
      selectedGiftItemCandidates.reduce(
        (total, candidate) => total + getGiftCandidateCount(candidate),
        0
      ),
    [selectedGiftItemCandidates]
  )
  const hasCurrentBenefitPendingCartItem = useCallback(
    (item) => {
      if (isGiftItem) {
        return hasCrmIntegrationDiscountId(item, rewardRuleId)
      }
      if (isSpecialItem) {
        return hasCrmIntegrationBenefitItemMarker(item, rewardRuleId)
      }
      if (isQuantityItemDiscount) {
        return hasCrmIntegrationBenefitItemMarker(item, rewardRuleId)
      }
      return false
    },
    [isGiftItem, isQuantityItemDiscount, isSpecialItem, rewardRuleId]
  )
  const hasCurrentBenefitSubmittedOrderItem = useCallback(
    (item) => {
      if (!isSelectableItemBenefit) return false
      return hasCrmIntegrationDiscountId(item, rewardRuleId)
    },
    [isSelectableItemBenefit, rewardRuleId]
  )
  const submittedGiftItemCandidates = useMemo(() => {
    if (!isSelectableItemBenefit || !rewardRuleId) return []
    return (Array.isArray(orders) ? orders : [])
      .flatMap((order) => (Array.isArray(order?.cart) ? order.cart : []))
      .filter((item) => hasCurrentBenefitSubmittedOrderItem(item))
  }, [
    hasCurrentBenefitSubmittedOrderItem,
    isSelectableItemBenefit,
    orders,
    rewardRuleId,
  ])
  const submittedTotal = useMemo(
    () =>
      submittedGiftItemCandidates.reduce(
        (total, candidate) => total + getGiftCandidateCount(candidate),
        0
      ),
    [submittedGiftItemCandidates]
  )
  const submittedCountById = useMemo(() => {
    return submittedGiftItemCandidates.reduce((result, candidate) => {
      result.set(
        String(candidate.id),
        (result.get(String(candidate.id)) || 0) +
          getGiftCandidateCount(candidate)
      )
      return result
    }, new Map())
  }, [submittedGiftItemCandidates])
  const isSubmittedBenefitLocked = useMemo(() => {
    if (!rewardRuleId) return false
    return (Array.isArray(orders) ? orders : []).some((order) =>
      hasCrmIntegrationDiscountId(order, rewardRuleId)
    )
  }, [orders, rewardRuleId])
  const selectedCountById = useMemo(() => {
    const result = new Map(submittedCountById)
    return selectedGiftItemCandidates.reduce((result, candidate) => {
      result.set(
        String(candidate.id),
        (result.get(String(candidate.id)) || 0) +
          getGiftCandidateCount(candidate)
      )
      return result
    }, result)
  }, [selectedGiftItemCandidates, submittedCountById])

  useEffect(() => {
    if (!open || !isSelectableItemBenefit || !rewardRuleId) {
      setSelectedGiftItemCandidates([])
      return
    }

    if (stageOnly) {
      setSelectedGiftItemCandidates(
        Array.isArray(stagedCandidates) ? stagedCandidates : []
      )
      return
    }

    setSelectedGiftItemCandidates(
      (Array.isArray(cart) ? cart : []).filter((item) =>
        hasCurrentBenefitPendingCartItem(item)
      )
    )
  }, [
    cart,
    hasCurrentBenefitPendingCartItem,
    isSelectableItemBenefit,
    open,
    rewardRuleId,
    stageOnly,
    stagedCandidates,
  ])

  useEffect(() => {
    if (!open) {
      setDetailItem(null)
      setRemoveDetailItem(null)
    }
  }, [open])

  const handleOpenDetail = useCallback((item) => {
    setDetailItem(item)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetailItem(null)
  }, [])

  const handleCloseRemoveDetail = useCallback(() => {
    setRemoveDetailItem(null)
  }, [])

  const addGiftItemCandidate = useCallback(
    (item) => {
      if (!isSelectableItemBenefit) return
      setSelectedGiftItemCandidates((prev) => {
        const currentTotal = prev.reduce(
          (total, candidate) => total + getGiftCandidateCount(candidate),
          0
        )
        if (submittedTotal + currentTotal >= maxSelectable) return prev

        const itemId = String(item.id)
        const index = prev.findIndex(
          (candidate) => String(candidate.id) === itemId
        )
        if (index >= 0) {
          return prev.map((candidate, candidateIndex) =>
            candidateIndex === index
              ? { ...candidate, count: getGiftCandidateCount(candidate) + 1 }
              : candidate
          )
        }
        return [...prev, createGiftCandidateCartItem(item)]
      })
    },
    [isSelectableItemBenefit, maxSelectable, submittedTotal]
  )

  const reduceGiftItemCandidate = useCallback(
    (item) => {
      if (!isSelectableItemBenefit) return
      if (shouldOpenDishDetail(item)) {
        setRemoveDetailItem(item)
        return
      }
      setSelectedGiftItemCandidates((prev) => {
        const itemId = String(item.id)
        const index = prev.findIndex(
          (candidate) => String(candidate.id) === itemId
        )
        if (index < 0) return prev

        const candidate = prev[index]
        const count = getGiftCandidateCount(candidate)
        if (count <= 1) {
          return prev.filter((_, candidateIndex) => candidateIndex !== index)
        }

        return prev.map((candidate, candidateIndex) =>
          candidateIndex === index
            ? { ...candidate, count: getGiftCandidateCount(candidate) - 1 }
            : candidate
        )
      })
    },
    [isSelectableItemBenefit]
  )

  const handleChangeSelectedGiftItemCandidates = useCallback((nextSelected) => {
    setSelectedGiftItemCandidates(nextSelected)
  }, [])

  const handleDetailSubmit = useCallback(
    (detailData) => {
      if (!isSelectableItemBenefit || !detailItem) return

      const nextCandidate = createGiftCandidateCartItem(detailItem, {
        ...detailData,
        price: detailData.priceItem?.price ?? detailItem.price,
      })
      setSelectedGiftItemCandidates((prev) => {
        const currentTotal = prev.reduce(
          (total, candidate) => total + getGiftCandidateCount(candidate),
          0
        )
        return mergeGiftCandidate(
          prev,
          nextCandidate,
          maxSelectable - submittedTotal - currentTotal
        )
      })
      setDetailItem(null)
    },
    [detailItem, isSelectableItemBenefit, maxSelectable, submittedTotal]
  )

  const appendSelectedItemsToCart = useCallback(() => {
    const selectedItems = selectedGiftItemCandidates.map((item) => ({
      ...item,
      ...(isGiftItem
        ? { discountList: buildCrmIntegrationManualGiftItemDiscount(reward) }
        : {}),
      ...(isSpecialItem || isQuantityItemDiscount
        ? { crmIntegrationBenefitRuleId: rewardRuleId }
        : {}),
    }))
    const cartWithoutCurrentGiftItems = (
      Array.isArray(cart) ? cart : []
    ).filter((item) => !hasCurrentBenefitPendingCartItem(item))
    const nextCart = [...cartWithoutCurrentGiftItems, ...selectedItems]
    setCart(nextCart)
    setStoragedCart(nextCart)
  }, [
    cart,
    hasCurrentBenefitPendingCartItem,
    isGiftItem,
    isQuantityItemDiscount,
    isSpecialItem,
    reward,
    rewardRuleId,
    selectedGiftItemCandidates,
    setCart,
    setStoragedCart,
  ])

  const handleCancel = useCallback(() => {
    if (stageOnly) {
      setSelectedGiftItemCandidates([])
      onClose?.()
      return
    }
    if (isSubmittedBenefitLocked) return

    const currentCart = Array.isArray(cart) ? cart : []
    const hasCurrentGiftItems =
      isSelectableItemBenefit &&
      currentCart.some((item) => hasCurrentBenefitPendingCartItem(item))
    const isCurrentBenefitSelected = selectedBenefit?.id === reward?.id

    if (isSelectableItemBenefit && rewardRuleId) {
      const nextCart = currentCart.filter(
        (item) => !hasCurrentBenefitPendingCartItem(item)
      )
      if (nextCart.length !== currentCart.length) {
        setCart(nextCart)
        setStoragedCart(nextCart)
      }
    }

    dispatch(
      crmIntegrationValidationActions.clearSelectedBenefitById(reward?.id)
    )
    setSelectedGiftItemCandidates([])

    if (hasCurrentGiftItems || isCurrentBenefitSelected) {
      Toast.info(
        t('crmIntegration.currentBenefitRemoved', {
          defaultValue: 'Selected offer removed',
        })
      )
    }

    onClose?.()
  }, [
    cart,
    dispatch,
    hasCurrentBenefitPendingCartItem,
    isSelectableItemBenefit,
    isSubmittedBenefitLocked,
    onClose,
    reward?.id,
    rewardRuleId,
    selectedBenefit?.id,
    setCart,
    setStoragedCart,
    stageOnly,
    t,
  ])

  const handleConfirm = async () => {
    if (isSubmittedBenefitLocked) return

    if (!stageOnly && onBeforeConfirm && !onBeforeConfirm(reward)) {
      return
    }

    const selectedBenefitItemCandidates = [
      ...submittedGiftItemCandidates,
      ...selectedGiftItemCandidates,
    ]

    if (isSelectableItemBenefit && submittedTotal + selectedTotal <= 0) {
      Toast.info(
        isGiftItem
          ? t('crmIntegration.selectGiftItemFirst')
          : t('crmIntegration.selectBenefitItemFirst', {
              defaultValue: 'Please select items first',
            })
      )
      return
    }

    const selectResult = await runCrmIntegrationRewardDialogConfirm({
      stageOnly,
      reward,
      candidates: selectedGiftItemCandidates,
      onStage,
      onSelect,
      selectOptions: isSelectableItemBenefit
        ? {
            selectedGiftItemCandidates: selectedBenefitItemCandidates,
            forceSelectSelectedBenefit: true,
            replaceGiftItemDiscountId: rewardRuleId,
            beforeApplySelectedBenefit: appendSelectedItemsToCart,
          }
        : undefined,
    })

    if (selectResult) {
      onClose?.()
    }
  }

  const itemData = useMemo(
    () => ({
      itemList,
      selectedCountById,
      submittedCountById,
      isSubmittedBenefitLocked,
      selectedTotal: submittedTotal + selectedTotal,
      maxSelectable,
      isGiftItem,
      isSpecialItem,
      isSelectableItemBenefit,
      onAdd: addGiftItemCandidate,
      onReduce: reduceGiftItemCandidate,
      onOpenDetail: handleOpenDetail,
      t,
    }),
    [
      itemList,
      selectedCountById,
      submittedCountById,
      isSubmittedBenefitLocked,
      selectedTotal,
      submittedTotal,
      maxSelectable,
      isGiftItem,
      isSpecialItem,
      isSelectableItemBenefit,
      addGiftItemCandidate,
      reduceGiftItemCandidate,
      handleOpenDetail,
      t,
    ]
  )
  const detailItemMax = useMemo(() => {
    if (!isSelectableItemBenefit) return undefined
    if (!Number.isFinite(maxSelectable)) return 99
    return Math.max(maxSelectable - submittedTotal - selectedTotal, 0)
  }, [isSelectableItemBenefit, maxSelectable, selectedTotal, submittedTotal])
  const detailDialogData = useMemo(() => {
    if (!detailItem) return {}
    return {
      ...detailItem,
      disableBtn: !isSelectableItemBenefit || isSubmittedBenefitLocked,
      itemMax:
        typeof detailItemMax === 'number' ? detailItemMax : detailItem.itemMax,
    }
  }, [
    detailItem,
    detailItemMax,
    isSelectableItemBenefit,
    isSubmittedBenefitLocked,
  ])

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <div className={styles.itemVoucherContent}>
          <IconButton className={styles.closeIcon} onClick={onClose}>
            <ArrowBackIosRounded />
          </IconButton>
          <div className={styles.itemVoucherHeader}>{title}</div>
          <List
            className={styles.itemList}
            height={380}
            itemCount={itemList.length}
            itemSize={92}
            width="100%"
            itemData={itemData}
          >
            {CrmIntegrationRewardItemRow}
          </List>
          <div className={styles.actions}>
            <Button
              className={styles.closeButton}
              disabled={isSubmittedBenefitLocked}
              onClick={handleCancel}
            >
              {t('AdminSetting.btn_cancel')}
            </Button>
            <Button
              className={styles.confirmButton}
              disabled={isSubmittedBenefitLocked}
              onClick={handleConfirm}
            >
              {t('crmIntegration.confirm')}
            </Button>
          </div>
        </div>
      </Dialog>
      <DishDialog
        data={detailDialogData}
        open={!!detailItem}
        onSubmit={handleDetailSubmit}
        onClose={handleCloseDetail}
        hidePrice={hideDetailPrice}
      />
      {removeDetailItem && (
        <OperateSubDishModal
          open={!!removeDetailItem}
          onClose={handleCloseRemoveDetail}
          subDishInfo={removeDetailItem}
          selectedSubDish={selectedGiftItemCandidates}
          setNewSelected={handleChangeSelectedGiftItemCandidates}
        />
      )}
    </>
  )
}

export default CrmIntegrationRewardItemsDialog
