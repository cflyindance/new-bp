export const isPaymentInProgress = (hash, orderStatus) =>
  hash.includes('cardPayment') && orderStatus === 'in payment';

export const shouldCancelOrderBeforeHome = (hash, hasOrderId) =>
  Boolean(hasOrderId) &&
  (hash.includes('connectionError') || hash.includes('cardPayment'));

export const canCancelPosOrder = (posOrderStatus) =>
  posOrderStatus === 'ORDERED';
