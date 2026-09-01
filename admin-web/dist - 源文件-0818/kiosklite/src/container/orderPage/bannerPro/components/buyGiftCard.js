import React, { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import Dialog from '@/component/dialog';
import Toast from '@/component/toast';
import ComboHeader from '@/container/comboPanel/ComboHeader';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';
import { getDeviceOrientation } from '@/utils';
import BuyGiftCardConfirm from './BuyGiftCardConfirm';
import styles from './buyGiftCard.module.scss';
import PhoneNumberEntryLayout from '@/component/PhoneNumberEntryLayout';
import { isValidUSPhone, normalizePhoneDigits } from '@/utils/phoneNumber';

const buildQuickAmountKey = (amountInfo = {}) => {
  const { rechargeAmount = '', bonusAmount, saveAmount } = amountInfo;
  const amountType = saveAmount ? 'save' : bonusAmount ? 'bonus' : 'base';
  return `${rechargeAmount}_${amountType}`;
};

const BuyGiftCard = (props) => {
  const {
    item,
    style,
    src,
    cloudGiftCardItem,
    quickAmounts,
    onPosterClose,
    selfConfig,
    systemConfig,
  } = props;
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState('input');
  const [phone, setPhone] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [isPrivacyConfirm, setIsPrivacyConfirm] = useState(
    selfConfig?.configMap?.id_49
  );
  const quickAmount = useMemo(() => {
    const quickAmountSnapshot = item?.props?.quickAmount;
    if (!quickAmountSnapshot) {
      return null;
    }

    const quickAmountList = quickAmounts || [];
    const snapshotKey = buildQuickAmountKey(quickAmountSnapshot);
    const matchedByKey = quickAmountList.find(
      (amountInfo) => buildQuickAmountKey(amountInfo) === snapshotKey
    );
    if (matchedByKey) {
      return matchedByKey;
    }

    const matchedByRechargeAmount = quickAmountList.find(
      (amountInfo) =>
        Number(amountInfo?.rechargeAmount) ===
        Number(quickAmountSnapshot?.rechargeAmount)
    );
    return matchedByRechargeAmount || quickAmountSnapshot;
  }, [item, quickAmounts]);
  const isVertical = getDeviceOrientation() === 'vertical';
  const paymentRouteResult = useMemo(
    () => handlePaymentTypeRoute(systemConfig, selfConfig),
    [selfConfig, systemConfig]
  );

  const normalizedPhone = useMemo(() => normalizePhoneDigits(phone), [phone]);
  const normalizedConfirmPhone = useMemo(
    () => normalizePhoneDigits(confirmPhone),
    [confirmPhone]
  );

  const isPhoneValid = isValidUSPhone(phone);
  const isConfirmValid = isValidUSPhone(confirmPhone);

  const closeDialog = () => {
    setVisible(false);
    setStep('input');
    setPhone('');
    setConfirmPhone('');
  };

  const handlePhoneChange = (value, targetStep) => {
    if (targetStep === 'input') {
      setPhone(value);
      return;
    }

    setConfirmPhone(value);
  };

  const handleBuyGiftCardClick = () => {
    if (!paymentRouteResult?.canPayByCard) {
      Toast.info(t('gift_card_credit_card_payment_required'), 1000);
      return;
    }

    if (!cloudGiftCardItem) {
      Toast.info(t('gift_card_item_not_found'), 1000);
      return;
    }

    setVisible(true);
  };

  const handleNext = () => {
    if (!isPrivacyConfirm) {
      Toast.info(t('confirm-policy'), 1000);
      return;
    }

    if (!isPhoneValid) {
      Toast.info(t('phone-required'), 1000);
      return;
    }

    setConfirmPhone('');
    setStep('confirmPhone');
  };

  const handleConfirm = () => {
    if (!isPrivacyConfirm) {
      Toast.info(t('confirm-policy'), 1000);
      return;
    }

    if (!isConfirmValid) {
      Toast.info(t('phone-required'), 1000);
      return;
    }

    if (normalizedPhone !== normalizedConfirmPhone) {
      Toast.info(t('gift_card_confirm_phone_mismatch'), 1000);
      return;
    }

    setStep('confirmPurchase');
  };

  const handleButtonEnter = (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (step === 'input') {
      handleNext();
      return;
    }

    handleConfirm();
  };

  const title =
    step === 'input' ? (
      <Trans
        t={t}
        i18nKey="gift_card_bind_phone_title"
        components={[<div></div>]}
      />
    ) : (
      t('gift_card_confirm_phone_title')
    );

  const actions = (
    <button
      type="button"
      className={`${styles.queryButton} ${
        step === 'input'
          ? isPhoneValid && isPrivacyConfirm
            ? styles.enableQueryButton
            : styles.disableQueryButton
          : isConfirmValid && isPrivacyConfirm
            ? styles.enableQueryButton
            : styles.disableQueryButton
      }`}
      onClick={step === 'input' ? handleNext : handleConfirm}
    >
      {step === 'input'
        ? t('gift_card_bind_next')
        : t('gift_card_bind_confirm')}
    </button>
  );

  const dialogContent = (
    <div
      className={styles.fullScreenWrapper}
      onClick={(e) => e.stopPropagation()}
    >
      <ComboHeader
        handleGoBack={() => {
          if (step === 'confirmPurchase') {
            setStep('confirmPhone');
            return;
          }

          if (step === 'confirmPhone') {
            setStep('input');
            setConfirmPhone('');
            return;
          }

          closeDialog();
        }}
      />

      {step === 'confirmPurchase' ? (
        <BuyGiftCardConfirm
          onPosterClose={onPosterClose}
          quickAmount={quickAmount}
          phone={phone}
        />
      ) : (
        <div className={styles.loginWrapper}>
          <div className={styles.loginModal}>
            <PhoneNumberEntryLayout
              title={title}
              value={step === 'input' ? phone : confirmPhone}
              placeholder={t('inputPhone')}
              isVertical={isVertical}
              onPhoneChange={(nextValue) => handlePhoneChange(nextValue, step)}
              onKeyDown={handleButtonEnter}
              isPrivacyConfirm={isPrivacyConfirm}
              changePrivacyConfirm={setIsPrivacyConfirm}
              actions={actions}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <img
        style={style}
        src={src}
        alt={item?.component}
        className={styles.triggerImage}
        onClick={handleBuyGiftCardClick}
        data-quick-amount={quickAmount?.rechargeAmount}
      />
      <Dialog
        visible={visible}
        html={dialogContent}
        onClose={closeDialog}
        outerStyle={{ background: '#fff' }}
        isMountOnBody
      />
    </>
  );
};

function mapStateToProps(state) {
  return {
    cloudGiftCardItem: state.ecard?.cloudGiftCardItem,
    quickAmounts: state.ecard?.quickAmounts,
    selfConfig: state.selfConfig,
    systemConfig: state.systemConfig,
  };
}

export default connect(mapStateToProps)(BuyGiftCard);
