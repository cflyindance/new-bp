import React, { memo, useMemo } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import RedeemPoint from '@/components/RedeemPoint'
import { CRM_INTEGRATION_REWARD_KIND } from '@/utils/crmIntegrationRewards'
import dayjs from 'dayjs'
import styles from './index.module.less'

const CrmIntegrationRewardCard = (props) => {
  const { t } = useTranslation()
  const { benefit, onClick, onSelect, selectedOverride, disabledOverride } =
    props
  const selectedBenefitId = useSelector(
    (state) => state.crmIntegrationValidationSlice.selectedBenefit?.id
  )
  const {
    name,
    points,
    discountValue,
    crmIntegrationRewardKind,
    giftQuantity,
    eligibleItemScope,
    eligibleItemCount,
    minSpend,
    expireAt,
    isPermanent,
    specialPrice,
    discountQuantity,
    bundleDiscountRule,
    buyQuantity,
    crmIntegrationRewardSource,
    crmIntegrationVoucher,
    voucherCount,
    hasCouponItemDialog,
  } = benefit

  const selected =
    selectedOverride === undefined
      ? selectedBenefitId === benefit.id
      : selectedOverride
  const disabled =
    disabledOverride === undefined
      ? !!selectedBenefitId && selectedBenefitId !== benefit.id
      : disabledOverride

  const isVoucher =
    crmIntegrationVoucher || crmIntegrationRewardSource === 'voucher'

  const rewardTypeText = useMemo(() => {
    if (crmIntegrationRewardKind === CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT)
      return t('crmIntegration.fixedDiscount')
    if (
      crmIntegrationRewardKind ===
      CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT
    )
      return t('crmIntegration.percentageDiscount')
    if (crmIntegrationRewardKind === CRM_INTEGRATION_REWARD_KIND.FREE_ITEM)
      return t('crmIntegration.freeItemReward')
    if (crmIntegrationRewardKind === CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM)
      return t('crmIntegration.specialItemReward')
    if (
      crmIntegrationRewardKind ===
      CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT
    )
      return t('crmIntegration.quantityItemDiscountReward', {
        buyQuantity: buyQuantity || 1,
        discountQuantity:
          discountQuantity || bundleDiscountRule?.discountNum || 1,
      })
    return ''
  }, [
    bundleDiscountRule,
    buyQuantity,
    crmIntegrationRewardKind,
    discountQuantity,
    t,
  ])

  const discountText = useMemo(() => {
    if (crmIntegrationRewardKind === CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT)
      return t('crmIntegration.fixedAmountOff', {
        value: `$${discountValue.toFixed(2)}`,
      })
    if (
      crmIntegrationRewardKind ===
      CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT
    )
      return t('crmIntegration.percentageOff', { value: discountValue })
    if (crmIntegrationRewardKind === CRM_INTEGRATION_REWARD_KIND.FREE_ITEM) {
      return t('crmIntegration.freeItemQuantity', {
        value: giftQuantity || 1,
      })
    }
    if (crmIntegrationRewardKind === CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM) {
      return t('crmIntegration.specialPriceFrom', {
        value: `$${Number(specialPrice || 0).toFixed(2)}`,
      })
    }
    if (
      crmIntegrationRewardKind ===
      CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT
    ) {
      const discountType = bundleDiscountRule?.discountType
      const value = Number(bundleDiscountRule?.discountValue || discountValue)
      const text =
        discountType === 'minus' ? `$${value.toFixed(2)}` : `${value}%`
      const discountItemIndex = Number(bundleDiscountRule?.orderQuantity || 0)

      if ((discountQuantity || bundleDiscountRule?.discountNum) === 1) {
        const item = t('crmIntegration.quantityDiscountItemOrdinal', {
          count: discountItemIndex,
          ordinal: true,
        })

        return t('crmIntegration.quantitySingleItemDiscountOff', {
          item,
          value: text,
        })
      }

      return t('crmIntegration.quantityDiscountOff', {
        value: text,
        quantity: discountQuantity || bundleDiscountRule?.discountNum || 1,
      })
    }
    return ''
  }, [
    bundleDiscountRule,
    crmIntegrationRewardKind,
    discountQuantity,
    discountValue,
    giftQuantity,
    specialPrice,
    t,
  ])

  const thresholdText = useMemo(() => {
    if (minSpend) {
      return t('crmIntegration.minSpendAvailable', {
        value: `$${Number(minSpend).toFixed(2)}`,
      })
    }
    return t('crmIntegration.noThresholdAvailable')
  }, [minSpend, t])

  const expirationText = useMemo(() => {
    if (expireAt) {
      return t('crmIntegration.expiresAt', {
        value: dayjs(expireAt).format('MM/DD/YYYY'),
      })
    }
    if (isPermanent) return t('crmIntegration.permanent')
    return ''
  }, [expireAt, isPermanent, t])

  const eligibleItemText = useMemo(() => {
    if (eligibleItemScope === 'all') return t('crmIntegration.allItemsEligible')
    if (eligibleItemCount === undefined || eligibleItemCount === null) return ''
    return t('crmIntegration.eligibleItemCount', {
      value: eligibleItemCount,
    })
  }, [eligibleItemScope, eligibleItemCount, t])

  const handleClick = () => {
    if (hasCouponItemDialog) {
      onClick?.(benefit)
      return
    }
    onSelect?.(benefit)
  }

  return (
    <div
      className={classNames(
        styles.rewardCard,
        selected && styles.selected,
        disabled && styles.disabled
      )}
      aria-disabled={disabled}
      aria-pressed={selected}
      onClick={handleClick}
    >
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.type}>{rewardTypeText}</div>
          <div className={styles.discount}>{discountText}</div>
        </div>
        <div className={styles.name}>{name}</div>
      </div>
      <div className={styles.body}>
        <div className={styles.bottomArea}>
          {eligibleItemText ? (
            <div className={styles.eligibleItemText}>{eligibleItemText}</div>
          ) : null}
          <div className={styles.threshold}>{thresholdText}</div>
          {expirationText ? (
            <div className={styles.expiration}>{expirationText}</div>
          ) : null}
        </div>
        <div className={styles.footer}>
          {isVoucher ? (
            <div className={styles.voucherCount}>
              {t('crmIntegration.voucherCount', { value: voucherCount || 0 })}
            </div>
          ) : (
            <RedeemPoint points={points} />
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(CrmIntegrationRewardCard)
