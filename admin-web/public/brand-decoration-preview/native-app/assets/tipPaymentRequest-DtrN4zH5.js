//#region source-snapshot/src/utils/tipPaymentRequest.js
var buildGiftCardPaymentRecord = ({ orderId, checksum, amount, cardType, cardNumber, tipAmount = 0, paymentId }) => {
	const normalizedTipAmount = Number(tipAmount) || 0;
	const record = {
		amount,
		paidAmount: amount,
		checksum,
		tipAmount: normalizedTipAmount,
		tipAdded: normalizedTipAmount > 0
	};
	if (paymentId) return {
		checksum,
		cashTipAmount: 0,
		amount,
		paidAmount: amount,
		id: paymentId,
		tipAmount: normalizedTipAmount,
		tipAdded: normalizedTipAmount > 0
	};
	return {
		orderId,
		type: "GIFT_CARD",
		...record,
		cardType,
		cardNumber,
		multiplePayments: false
	};
};
var getRemainingPaymentTipAmount = ({ selectedTipAmount, recordedOrderTipAmount, orderDetail }) => {
	const recordedTipAmount = recordedOrderTipAmount ?? orderDetail?.totaltips ?? orderDetail?.totalTips ?? 0;
	return (Number(recordedTipAmount) || 0) > 0 ? 0 : Number(selectedTipAmount) || 0;
};
var getGiftCardCoveredTipAmount = ({ selectedTipAmount, availableBalance }) => {
	const normalizedTipAmount = Math.max(Number(selectedTipAmount) || 0, 0);
	const normalizedBalance = Math.max(Number(availableBalance) || 0, 0);
	return Number(Math.min(normalizedTipAmount, normalizedBalance).toFixed(2));
};
var buildPostPaymentTipRequest = ({ paymentType, checksum, amount, paidAmount, paymentId, tipAmount, sessionKey }) => {
	const normalizedTipAmount = Number(tipAmount) || 0;
	const request = {
		fromProduct: "KIOSK",
		paymentRecord: paymentType === "GIFT_CARD" ? buildGiftCardPaymentRecord({
			checksum,
			amount,
			paymentId,
			tipAmount: normalizedTipAmount
		}) : {
			checksum,
			cashTipAmount: 0,
			amount,
			paidAmount,
			id: paymentId
		},
		printPaymentReceipt: false,
		merchantCopyOnly: false,
		userAuth: { sessionKey }
	};
	if (paymentType !== "GIFT_CARD") request.transactionDetail = {
		actionType: "APPLY_TIP",
		tipAmount: normalizedTipAmount
	};
	return request;
};
//#endregion
export { getRemainingPaymentTipAmount as i, buildPostPaymentTipRequest as n, getGiftCardCoveredTipAmount as r, buildGiftCardPaymentRecord as t };
