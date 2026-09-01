import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import Big from 'big.js';
import styles from './CardPartPayInfo.module.scss';
import IconCredit from '@/assets/images/icon-credit.png';
import IconCash from '@/assets/images/icon-cash.png';
import GiftCardImage from '@/assets/images/gift-card-image.png';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';

const toCurrency = (amount) => {
  const numberAmount = Number(amount) || 0;
  return `$${numberAmount.toFixed(2)}`;
};

const CardPartPayInfo = (props) => {
  const {
    giftCardPaymentInfo,
    onPayByCard,
    onPayByCash,
    onPayByOtherGiftCard,
    paymentRouteResult,
    t,
  } = props;
  const { canPayByCard, canPayByCash, canPayByEcard } =
    paymentRouteResult || {};
  const isGiftCardError = giftCardPaymentInfo?.isGiftCardError;

  const paidAmount =
    Number(giftCardPaymentInfo?.paidTotal) ||
    Number(giftCardPaymentInfo?.paymentObj?.paymentRecord?.paidAmount) ||
    0;
  const totalAmount = Number(giftCardPaymentInfo?.totalAmount) || 0;
  const unpaidAmount =
    Number(giftCardPaymentInfo?.remainingAmount) ||
    Math.max(Big(totalAmount).minus(paidAmount).toNumber(), 0);

  const actionList = [
    {
      key: 'card',
      label: t('credit_debit_card'),
      icon: IconCredit,
      onClick: onPayByCard,
      iconClassName: styles.creditIcon,
      visible: canPayByCard,
    },
    {
      key: 'cash',
      label: t('cash'),
      icon: IconCash,
      onClick: onPayByCash,
      iconClassName: styles.cashIcon,
      visible: canPayByCash,
    },
    {
      key: 'gift-card',
      label: t('ecard'),
      icon: GiftCardImage,
      onClick: onPayByOtherGiftCard,
      iconClassName: styles.giftCardIcon,
      visible: canPayByEcard && !isGiftCardError,
    },
  ].filter((action) => action.visible);

  return (
    <div className={styles.cardPartPayInfo}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          {t(
            isGiftCardError
              ? 'gift_card_abnormal'
              : 'gift_card_insufficient_balance'
          )}
        </h2>

        <div className={styles.helperText}>
          {t('choose_other_payment_method')}
        </div>

        <div className={styles.actionList}>
          {actionList.map((action) => (
            <button
              key={action.key}
              type="button"
              className={`${styles.actionCard} linear-animate-btn`}
              onClick={() => action.onClick?.()}
            >
              <div className={styles.iconWrapper}>
                <img
                  src={action.icon}
                  alt=""
                  className={`${styles.actionIcon} ${action.iconClassName}`}
                />
              </div>
              <span className={styles.actionLabel}>{action.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.amountPanel}>
          <div className={styles.amountRow}>
            <span className={styles.amountLabel}>{t('paid')}</span>
            <span className={styles.amountValue}>{toCurrency(paidAmount)}</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.amountRow}>
            <span
              className={`${styles.amountLabel} ${styles.amountLabelStrong}`}
            >
              {t('unpaid')}
            </span>
            <span
              className={`${styles.amountValue} ${styles.amountValueStrong}`}
            >
              {toCurrency(unpaidAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  paymentRouteResult: handlePaymentTypeRoute(
    state.systemConfig,
    state.selfConfig
  ),
});

export default withTranslation()(connect(mapStateToProps)(CardPartPayInfo));
