import React, { memo, useMemo } from 'react'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { CircularProgress, IconButton } from '@material-ui/core'
import { AddCircleRounded } from '@material-ui/icons'
import { useTranslation } from 'react-i18next'
import ImgFallback from '@/components/common/ImgFallback'
import DishItemCount from '@/components/DishItemCount'
import RedeemPoint from '@/components/RedeemPoint'
import { CRM_INTEGRATION_REWARD_KIND } from '@/utils/crmIntegrationRewards'
import { serverUrl } from '@/utils/env_var'
import styles from './index.module.less'

function getPointValue(item) {
  return (
    item?.crmIntegrationPoints ??
    item?.points ??
    item?.rewardRule?.redeemRule?.parameters?.points ??
    0
  )
}

function getRowBenefit(row) {
  if (row?.type !== 'voucher') return row?.item
  return row?.item?.crmIntegrationVoucherBenefit || row?.item
}

function getVoucherIconInfo(item, t) {
  const kind = item?.crmIntegrationRewardKind
  const discountValue = Number(item?.discountValue || 0)

  if (kind === CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT) {
    return { value: `$${discountValue.toFixed(2)}`, suffix: 'OFF' }
  }
  if (kind === CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT) {
    return { value: `${discountValue}%`, suffix: 'OFF' }
  }
  if (kind === CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM) {
    return { value: 'Item', suffix: '' }
  }
  if (kind === CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT) {
    const value = Number(
      item?.bundleDiscountRule?.discountValue || item?.discountValue || 0
    )
    return {
      value:
        item?.bundleDiscountRule?.discountType === 'minus'
          ? `$${value.toFixed(2)}`
          : `${value}%`,
      suffix: 'OFF',
    }
  }
  return { value: t('crmIntegration.freeItemReward'), suffix: '' }
}

function getRewardDescription(row) {
  const { type, item } = row
  if (type === 'voucher') {
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

function renderImageFallback(isVoucherIcon, voucherIconInfo) {
  if (isVoucherIcon) {
    return (
      <>
        <span className={styles.voucherImageValue}>
          {voucherIconInfo.value}
        </span>
        {voucherIconInfo.suffix ? (
          <span className={styles.voucherImageSuffix}>
            {voucherIconInfo.suffix}
          </span>
        ) : null}
      </>
    )
  }
  return null
}

const RewardRow = ({
  row,
  style,
  disabled = false,
  disabledClickable = false,
  pending = false,
  selectedCount = 0,
  appliedCount = 0,
  hasDraftSelection = false,
  onSelect,
  onReduce,
  onDetail,
}) => {
  const { t } = useTranslation()
  const { type, item } = row
  const isVoucher = type === 'voucher'
  const voucherBenefit = getRowBenefit(row)
  const isVoucherItem = isVoucher && item?.crmIntegrationVoucherItem
  const isPointDiscountIcon =
    !isVoucher &&
    [
      CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT,
      CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT,
    ].includes(item?.crmIntegrationRewardKind)
  const isDiscountIcon = (isVoucher && !isVoucherItem) || isPointDiscountIcon
  const description = getRewardDescription(row)
  const translatedPointName = isVoucher
    ? isVoucherItem
      ? t(String(item?.id), { ns: 'dish', defaultValue: item?.name })
      : ''
    : t(String(item?.id), { ns: 'dish', defaultValue: item?.name })
  const name = isVoucher
    ? isVoucherItem && translatedPointName !== String(item?.id)
      ? translatedPointName
      : item?.name
    : translatedPointName === String(item?.id)
      ? item?.name
      : translatedPointName
  const imagePath =
    item?.pic || item?.couponTemplate?.image || item?.couponTemplate?.icon
  const fallbackClassName = classNames(
    styles.rewardImageFallback,
    isDiscountIcon && styles.voucherImageFallback
  )
  const expirationText = useMemo(() => {
    const expireAt = item?.expireAt || voucherBenefit?.expireAt
    if (!expireAt) return t('MemberRedemptionCenter.neverExpires')
    return t('crmIntegration.expiresAt', {
      value: dayjs(expireAt).format('MM/DD/YYYY'),
    })
  }, [item?.expireAt, t, voucherBenefit?.expireAt])
  const voucherIconInfo = getVoucherIconInfo(voucherBenefit, t)
  const displayedCount = hasDraftSelection ? selectedCount : appliedCount
  const handleSelect = (event) => {
    event?.stopPropagation()
    if (pending || (disabled && !disabledClickable)) return
    onSelect?.(row)
  }
  const handleCountChange = (nextCount) => {
    if (pending) return
    if (Number(nextCount || 0) < Number(displayedCount || 0)) {
      onReduce?.(row)
    }
  }
  const handleCounterIncrease = () => {
    if (pending) return false
    return false
  }

  return (
    <div style={style} className={styles.rewardRowWrapper}>
      <div
        className={classNames(
          styles.rewardRow,
          displayedCount > 0 && styles.selectedRow,
          disabled && styles.disabledRow
        )}
        aria-disabled={disabled}
        onClick={handleSelect}
      >
        <div className={styles.rewardImage}>
          {imagePath ? (
            <ImgFallback
              src={serverUrl + imagePath}
              itemName={item?.name}
              className={styles.rewardImageContent}
            />
          ) : (
            <div className={fallbackClassName}>
              {renderImageFallback(isDiscountIcon, voucherIconInfo)}
            </div>
          )}
        </div>
        <div className={styles.rewardInfo}>
          <div className={styles.rewardName}>{name}</div>
          {expirationText ? (
            <div className={styles.rewardMeta}>{expirationText}</div>
          ) : null}
          {description ? (
            <div className={styles.rewardDescriptionRow}>
              <span className={styles.rewardDescription}>{description}</span>
              <button
                type="button"
                className={styles.detailButton}
                onClick={(event) => {
                  event.stopPropagation()
                  onDetail?.(row)
                }}
              >
                {t('MemberRedemptionCenter.detail')}
              </button>
            </div>
          ) : null}
          <div className={styles.rewardFooter}>
            <div className={styles.rewardValue}>
              {isVoucher ? (
                <div className={styles.rewardMeta}>
                  {t('crmIntegration.voucherCount', {
                    value: voucherBenefit?.voucherCount || 0,
                  })}
                </div>
              ) : (
                <div className={styles.rewardPointCompact}>
                  <RedeemPoint points={getPointValue(item)} />
                </div>
              )}
            </div>
            <div className={styles.rewardOperation}>
              {pending ? (
                <CircularProgress size={28} />
              ) : displayedCount > 0 ? (
                <div className={styles.rewardCounter}>
                  <DishItemCount
                    count={displayedCount}
                    size="small"
                    width={84}
                    fontSize={15}
                    min={0}
                    max={displayedCount}
                    onChange={handleCountChange}
                    isContinueAddFn={handleCounterIncrease}
                  />
                </div>
              ) : (
                <IconButton
                  aria-label="add reward"
                  size="small"
                  className={styles.addRewardButton}
                  disabled={disabled && !disabledClickable}
                  onClick={handleSelect}
                >
                  <AddCircleRounded style={{ fontSize: 24 }} />
                </IconButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(RewardRow)
