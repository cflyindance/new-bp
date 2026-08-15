import React, { memo, useCallback, useMemo } from 'react'
import { Dialog } from '@material-ui/core'
import { CloseRounded as CloseIcon } from '@material-ui/icons'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import ARROW_RIGHT from '@/assets/image/arrow-right.png'
import CrmIntegrationRewardCard from '@/components/CrmIntegrationRewardCard'
import { CRM_INTEGRATION_REWARD_SOURCE } from '@/utils/crmIntegrationRewards'
import styles from './index.module.less'

export const TAB_LIST = [
  CRM_INTEGRATION_REWARD_SOURCE.REWARD,
  CRM_INTEGRATION_REWARD_SOURCE.VOUCHER,
]

export const CartDiscountEntry = memo(function CartDiscountEntry({ onClick }) {
  const { t } = useTranslation()

  return (
    <div className={styles.cartDiscountWrapper} onClick={onClick}>
      <div className={styles.text}>
        {t('crmIntegration.cartDiscountEntry', {
          defaultValue: t('crm.discountBar'),
        })}
      </div>
      <img className={styles.sign} src={ARROW_RIGHT} alt="arrow_right" />
    </div>
  )
})

export const CartDiscountBenefitCard = memo(function CartDiscountBenefitCard({
  benefit,
  selected,
  disabled,
  onSelect,
}) {
  const handleSelect = useCallback(() => {
    onSelect?.(benefit)
  }, [benefit, onSelect])

  return (
    <div
      className={classNames(styles.cardFrame, disabled && styles.disabledFrame)}
    >
      <CrmIntegrationRewardCard
        benefit={benefit}
        onClick={handleSelect}
        onSelect={handleSelect}
        selectedOverride={selected}
        disabledOverride={disabled}
      />
    </div>
  )
})

export const CartDiscountDialog = memo(function CartDiscountDialog({
  open,
  activeTab,
  activeBenefits,
  hasRewardBenefits,
  hasVoucherBenefits,
  onClose,
  onConfirm,
  onTabChange,
  onBenefitSelect,
  isBenefitSelected,
  isBenefitDisabled,
  confirmDisabled,
  loading,
}) {
  const { t } = useTranslation()
  const visibleTabs = useMemo(
    () =>
      TAB_LIST.filter((tab) =>
        tab === CRM_INTEGRATION_REWARD_SOURCE.REWARD
          ? hasRewardBenefits
          : hasVoucherBenefits
      ),
    [hasRewardBenefits, hasVoucherBenefits]
  )

  return (
    <Dialog open={open} onClose={onClose}>
      <div className={styles.contentWrapper}>
        <button
          className={styles.closeBtn}
          type="button"
          onClick={onClose}
          aria-label={t('crmIntegration.close')}
        >
          <CloseIcon />
        </button>
        <div className={styles.header}>
          {t('crmIntegration.cartDiscountTitle', {
            defaultValue: t('crm.discountBar'),
          })}
        </div>
        <div className={styles.tab}>
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={classNames(
                styles.tabItem,
                activeTab === tab && styles.selectedTab
              )}
              onClick={() => onTabChange(tab)}
            >
              {tab === CRM_INTEGRATION_REWARD_SOURCE.REWARD
                ? t('crmIntegration.rewardTab', { defaultValue: 'Reward' })
                : t('crmIntegration.voucherTab', {
                    defaultValue: 'Voucher',
                  })}
            </button>
          ))}
        </div>
        <div className={styles.cardGrid}>
          {activeBenefits.length ? (
            activeBenefits.map((benefit) => (
              <CartDiscountBenefitCard
                key={benefit.id}
                benefit={benefit}
                onSelect={onBenefitSelect}
                selected={isBenefitSelected(benefit)}
                disabled={isBenefitDisabled(benefit)}
              />
            ))
          ) : (
            <div className={styles.empty}>
              {t('crmIntegration.noCartDiscounts', {
                defaultValue: 'No available discounts',
              })}
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            {t('crmIntegration.close')}
          </button>
          <button
            type="button"
            className={classNames(
              styles.confirmButton,
              (loading || confirmDisabled) && styles.disabledButton
            )}
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
          >
            {t('crmIntegration.confirm')}
          </button>
        </div>
      </div>
    </Dialog>
  )
})
