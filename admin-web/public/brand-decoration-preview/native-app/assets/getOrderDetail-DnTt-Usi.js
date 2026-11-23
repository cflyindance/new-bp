import { Qi as Big } from "./actions-BwRPwnFF.js";
import { a as getOrderInfo } from "./apiPos-BvOUwi7i.js";
import { t as XMLObjTree } from "./ObjectTree-D9iCBoZ6.js";
//#region source-snapshot/src/utils/getOrderDetail.js
var parseLicenseXml = (data) => {
	let findAppInstances = data;
	let start = findAppInstances?.indexOf("<soap:Body>");
	let end = findAppInstances?.indexOf("</soap:Body>");
	findAppInstances = findAppInstances?.substring(start + 11, end);
	return (new XMLObjTree()?.parseXML(findAppInstances))?.fetchorderresponsetype?.order;
};
var getOrderDetail = async ({ orderId, setCardPaidResult }) => {
	const res = await getOrderInfo(orderId);
	let r = res.data ? parseLicenseXml(res.data) || {} : {};
	if (JSON.stringify(r) !== "{}") {
		let chargeTotal = 0;
		if (r.ordercharges) if (Object.prototype.toString.call(r.ordercharges) === "[object Object]") chargeTotal = r.ordercharges.charge;
		else r.ordercharges.forEach((c) => {
			chargeTotal = Big(chargeTotal).plus(c.charge).toNumber();
		});
		let crmIntegrationDiscount = 0;
		if (r?.discountlist) {
			const crmIntegrationDiscountList = JSON.parse(r.discountlist);
			if (crmIntegrationDiscountList?.length > 0) {
				const discountInfo = crmIntegrationDiscountList[0];
				if (discountInfo.type === "promotion" && !discountInfo?.extraInfo?.isItemDetailDiscount) crmIntegrationDiscount = discountInfo.amount;
				else if (!discountInfo.isReward && !discountInfo?.extraInfo?.isItemDetailDiscount) crmIntegrationDiscount = discountInfo.amount;
			}
		}
		let paid = 0;
		if (Array.isArray(r?.payments)) paid = r.payments.reduce((sum, payment) => {
			const paymentAmount = payment?.transactionrecord?.amount ?? payment?.amount ?? 0;
			return Big(sum).plus(paymentAmount).toNumber();
		}, 0);
		else paid = r?.payments?.transactionrecord?.amount ?? r?.payments?.amount ?? 0;
		const unpaid = Big(r.totalprice).plus(r.totaltax).plus(r.totaltips).plus(Big(chargeTotal).toFixed(2)).minus(paid).minus(r.discount || 0).minus(r.rewarddiscount || 0).minus(crmIntegrationDiscount).toNumber();
		r.unpaidInfo = {
			paid,
			unpaid
		};
	}
	setCardPaidResult(r);
	return r;
};
//#endregion
export { getOrderDetail as t };
