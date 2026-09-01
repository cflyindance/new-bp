export const getGiftCardPaymentCardType = (card) =>
  card?.local === true ? 'GIFT_CARD' : 'CLOUD_GIFT_CARD';
