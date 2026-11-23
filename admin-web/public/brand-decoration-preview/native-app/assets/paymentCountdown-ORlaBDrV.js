//#region source-snapshot/src/utils/paymentCountdown.js
var isPaymentInProgress = (hash, orderStatus) => hash.includes("cardPayment") && orderStatus === "in payment";
var canCancelPosOrder = (posOrderStatus) => posOrderStatus === "ORDERED";
//#endregion
export { isPaymentInProgress as n, canCancelPosOrder as t };
