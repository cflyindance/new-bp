import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './BuyGiftCardConfirm.module.scss';
import useBuyGiftCard from '@/hooks/useBuyGiftCard';
import Toast from '@/component/toast';
import { setCardPaidResult, saveOrderResult } from '@/actions';
import Loading from '@/component/loading';
import BUY_NEW_GIFT_CARD from '@/assets/images/buy_new_giftCard.png';
import LEFT_BOTTOM_TRI from '@/assets/images/left_botton_tri.png';
import RIGHT_UP_TRI from '@/assets/images/right_up_tri.png';

const formatAmount = (value) => Number(value || 0).toFixed(2);
const formatDisplayAmount = (value) => {
  const numberValue = Number(value || 0);
  return Number.isInteger(numberValue)
    ? `${numberValue}`
    : numberValue.toFixed(2);
};

const QUICK_AMOUNT_LABEL = {
  BONUS: 'ecard_quick_amount_bonus_label',
  SAVE: 'ecard_quick_amount_save_label',
};

const getBenefitType = ({ bonusAmount, saveAmount }) => {
  if (bonusAmount > 0) {
    return 'bonus';
  }

  if (saveAmount > 0) {
    return 'save';
  }

  return '';
};

const getBenefitText = (benefitType, bonusAmount, saveAmount) => {
  if (benefitType === 'bonus') {
    return {
      key: 'gift_card_bonus_badge',
      params: {
        amount: formatDisplayAmount(bonusAmount),
      },
    };
  }

  if (benefitType === 'save') {
    return {
      key: 'gift_card_save_badge',
      params: {
        amount: formatDisplayAmount(saveAmount),
      },
    };
  }

  return null;
};

const BuyGiftCardConfirm = (props) => {
  const {
    quickAmount,
    phone,
    cloudGiftCardItem,
    setCardPaidResult,
    saveOrderResult,
    onPosterClose,
    history,
  } = props;
  const { t } = useTranslation();
  const { createGiftCardOrder, loading } = useBuyGiftCard({
    setCardPaidResult,
    saveOrderResult,
  });
  const {
    label = '',
    rechargeAmount = 0,
    bonusAmount = 0,
    saveAmount = 0,
    paymentAmount = 0,
  } = quickAmount || {};
  const benefitType = getBenefitType({
    bonusAmount: Number(bonusAmount || 0),
    saveAmount: Number(saveAmount || 0),
  });
  const benefitText = getBenefitText(benefitType, bonusAmount, saveAmount);

  const handlePay = async () => {
    try {
      const onCreateSuccess = () => {
        onPosterClose();
        history.push('/cardPayment');
      };
      const data = {
        quickAmount,
        cloudGiftCardItem,
        phone,
        onCreateSuccess,
      };
      await createGiftCardOrder(data);
    } catch (error) {
      Toast.info(error?.message || 'Create gift card failed', 1000);
    }
  };

  return (
    <>
      <div className={styles.confirmWrapper}>
        <div className={styles.confirmTitle}>
          {t('blocks.buyGiftCard_label')}
        </div>

        <div className={styles.innerConfirmWrapper}>
          <div className={styles.heroSection}>
            <div className={styles.giftCardVisual}>
              <img
                src={BUY_NEW_GIFT_CARD}
                alt={t('blocks.buyGiftCard_label')}
                className={styles.giftCardImage}
              />
              <img
                className={styles.giftCardImage_left_tri}
                src={LEFT_BOTTOM_TRI}
                alt="LEFT_BOTTOM_TRI"
              />
              <img
                className={styles.giftCardImage_right_tri}
                src={RIGHT_UP_TRI}
                alt="RIGHT_UP_TRI"
              />
            </div>

            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>
                  {t('gift_card_valid_until_label')} :
                </span>
                <span className={styles.metaValue}>
                  {t('permanently_voucher')}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>
                  {t('gift_card_bound_phone_label')} :
                </span>
                <span className={styles.metaValue}>{phone}</span>
              </div>
            </div>
          </div>

          <div className={styles.amountSection}>
            <div className={styles.amountValue}>
              ${formatDisplayAmount(rechargeAmount)}
            </div>

            {benefitText ? (
              <div className={styles.benefitBadge}>
                {t(benefitText.key, benefitText.params)}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className={styles.payButton}
            onClick={handlePay}
          >
            {t('gift_card_go_pay', {
              amount: formatAmount(paymentAmount),
            })}
          </button>
        </div>
      </div>
      <Loading visible={loading} />
    </>
  );
};

function mapStateToProps(state) {
  return {
    cloudGiftCardItem: state.ecard?.cloudGiftCardItem,
  };
}

export default withRouter(
  connect(mapStateToProps, { setCardPaidResult, saveOrderResult })(
    BuyGiftCardConfirm
  )
);
