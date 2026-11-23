import { w as getPaymentMemberSettings } from "./utils-Cdx9DbDR.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { xc as SET_PAYMENT_MEMBER_CARD_RECORD } from "./actions-BwRPwnFF.js";
import { n as getOrderPhoneDigits } from "./phoneNumber-CPrZu7TP.js";
//#region source-snapshot/src/utils/paymentMemberNavigation.js
var isAdMemberEnabled = (allSysConfig) => allSysConfig?.CRM_INTEGRATION_SERVICE_ENABLED === "true" || allSysConfig?.CRM_INTEGRATION_SERVICE_ENABLED === true;
var shouldEnterPaymentMember = (settings) => {
	return settings?.enabled === true && settings?.terminalRegistrationGuide?.enabled === true;
};
var isFullCreditPayment = (currentOrder) => {
	const record = currentOrder?.paymentMemberCardRecord;
	return !!(record?.paymentRecordId && record.orderStatus === "PAID" && record.isFullCreditPayment === true && record.orderId === Number(currentOrder?.saveOrderResult?.id) && !(currentOrder?.paymentTypeTrail || []).some((type) => type !== "CREDIT_CARD"));
};
async function goToPaymentMemberOrFinish({ history, allSysConfig, currentOrder, crm }) {
	if (!isAdMemberEnabled(allSysConfig) || !isFullCreditPayment(currentOrder) || getOrderPhoneDigits(currentOrder)) {
		history.push("/orderFinish");
		return;
	}
	try {
		const settings = await getPaymentMemberSettings();
		if (shouldEnterPaymentMember(settings)) {
			native_store_default.dispatch({
				type: SET_PAYMENT_MEMBER_CARD_RECORD,
				record: {
					...currentOrder.paymentMemberCardRecord,
					guideSettings: settings
				}
			});
			history.push("/paymentMember");
			return;
		}
	} catch (error) {}
	history.push("/orderFinish");
}
//#endregion
export { shouldEnterPaymentMember as i, isAdMemberEnabled as n, isFullCreditPayment as r, goToPaymentMemberOrFinish as t };
