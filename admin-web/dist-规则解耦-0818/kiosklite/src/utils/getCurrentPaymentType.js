export const isGiftCardWithCreditCardOrder = (paymentTypeTrail = []) => {
  const paymentTypes = new Set(paymentTypeTrail);
  return paymentTypes.has('GIFT_CARD') && paymentTypes.has('CREDIT_CARD');
};

const getCurrentPaymentType = (paymentType, paymentTypeTrail = []) => {
  const isGiftCardType =
    paymentTypeTrail.length === 1 && paymentTypeTrail[0] === 'GIFT_CARD';

  if (paymentType === 'CREDIT_CARD') {
    return 'CREDIT_CARD';
  }

  if (paymentType === 'CASH' || isGiftCardType) {
    return 'CASH';
  }

  return null;
};

export default getCurrentPaymentType;
