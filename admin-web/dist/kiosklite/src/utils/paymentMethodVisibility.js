export const getPaymentMethodVisibility = ({
  canPayByCard,
  canPayByCash,
  canPayByEcard,
}) => ({
  showCard: Boolean(canPayByCard),
  showCash: Boolean(canPayByCash),
  showGiftCard: Boolean(canPayByEcard),
  showNoPaymentMessage: !canPayByCard && !canPayByCash && !canPayByEcard,
});
