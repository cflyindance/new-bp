import Alert from '@material-ui/lab/Alert';
import Dialog from '@/component/dialog';
import CardPaymentWrapper from './CardPaymentWrapper';
import { useCloseModalOnHomePage } from '@/hooks';
import Loading from '@/component/loading';
import React from 'react';

const GiftCardPayment = (props) => {
  const {
    visible,
    onClose,
    handleSelectGiftCard,
    giftCardPaymentInfo,
    showGiftCardPartialPayInfo,
    giftCardFlowMode,
    giftCardQueryFromPartialPay,
    onPayByCard,
    onPayByCash,
    onPayByOtherGiftCard,
    onContinuePayByGiftCard,
    onBackToPartialPay,
    loading,
    errorApiShow,
    errorApiMsg,
  } = props;

  useCloseModalOnHomePage(onClose);

  return (
    <>
      <Dialog
        visible={visible}
        html={
          <CardPaymentWrapper
            handleSelectGiftCard={handleSelectGiftCard}
            onClose={onClose}
            giftCardPaymentInfo={giftCardPaymentInfo}
            showGiftCardPartialPayInfo={showGiftCardPartialPayInfo}
            giftCardFlowMode={giftCardFlowMode}
            onPayByCard={onPayByCard}
            onPayByCash={onPayByCash}
            onPayByOtherGiftCard={onPayByOtherGiftCard}
            onContinuePayByGiftCard={onContinuePayByGiftCard}
            giftCardQueryFromPartialPay={giftCardQueryFromPartialPay}
            onBackToPartialPay={onBackToPartialPay}
          />
        }
      />
      <Loading visible={loading} />
      {errorApiShow ? (
        <Alert variant="filled" severity="error">
          {errorApiMsg}
        </Alert>
      ) : null}
    </>
  );
};

export default GiftCardPayment;
