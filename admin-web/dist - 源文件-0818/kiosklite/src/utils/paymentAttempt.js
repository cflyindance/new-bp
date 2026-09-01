let activePaymentOrderId = null;

const normalizeOrderId = (orderId) =>
  orderId == null || orderId === '' ? null : String(orderId);

export const beginPaymentAttempt = (orderId) => {
  if (activePaymentOrderId !== null) return false;
  activePaymentOrderId = normalizeOrderId(orderId);
  return activePaymentOrderId !== null;
};

export const bindPaymentAttemptOrderId = (orderId) => {
  if (activePaymentOrderId === null) return false;
  activePaymentOrderId = normalizeOrderId(orderId);
  return activePaymentOrderId !== null;
};

export const getPaymentAttemptOrderId = () => activePaymentOrderId;

export const finishPaymentAttempt = (orderId) => {
  const normalizedOrderId = normalizeOrderId(orderId);
  if (
    normalizedOrderId !== null &&
    activePaymentOrderId !== normalizedOrderId
  ) {
    return false;
  }
  activePaymentOrderId = null;
  return true;
};
