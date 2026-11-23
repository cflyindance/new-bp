import { t as toast_default } from "./toast-C8a1ReSo.js";
import { A as printUnpaidReceipt, D as posFrontLog, F as send2Kitchen, I as sendErrorMsg, L as sendMsgReceipt, N as saveOrder, O as printCall, X as TOGONAMELIST, c as judgeSskeyIsActiveTime, r as getCookie } from "./utils-Cdx9DbDR.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { Gr as getOrderInfoObj, H as markPostPaymentAction, Qi as Big, Wr as generateSubmitOrderObj, mr as getDishItemLanguage } from "./actions-BwRPwnFF.js";
import { t as native_i18n_default } from "./native-i18n-Bya1piKW.js";
import { l as setNeedCommit, n as orderLockProcedure } from "./orderLock-9vtPVs0P.js";
import { c as savePaymentRecordType } from "./apiPos-BvOUwi7i.js";
import { t as getChooseTableStatus } from "./chooseTable-BNJLkJ45.js";
//#region source-snapshot/src/api/apiUtil.js
function sendError2MsgCenter(orderId, errorTitle) {
	if (orderId) sendErrorMsg({
		message: {
			title: errorTitle,
			sender: getCookie("kioskLicense"),
			topicId: 7,
			order: { id: orderId },
			content: "some content..."
		},
		userAuth: { sessionKey: getCookie("sessionKey") }
	}).then((res) => {
		console.log(res);
	}).catch((err) => {
		console.log(err);
	});
}
var sendNewOrderMessage = (orderId, orderNumber, phone) => {
	return sendErrorMsg({
		message: {
			title: "New Order",
			content: "None",
			order: {
				id: orderId,
				orderNumber,
				phone,
				phoneNumber: phone
			},
			sender: getCookie("kioskLicense"),
			topicName: "KIOSK"
		},
		userAuth: { sessionKey: getCookie("sessionKey") }
	}).then((res) => {
		console.log(res);
		return res;
	}).catch((err) => {
		console.log(err);
		return null;
	});
};
function printUnpaidReceiptHandler(orderId, paymentTotals = {}) {
	return printUnpaidReceipt({
		orderId,
		merchantCopy: false,
		userAuth: { sessionKey: getCookie("sessionKey") },
		...paymentTotals
	});
}
function buildGiftCardSmsContent({ merchantName, giftCardInfo = {}, finalTotal }) {
	const cardNumber = giftCardInfo?.ecardNumber || "";
	const balance = Big(giftCardInfo?.balance ?? 0).toFixed(2);
	const expirationTime = giftCardInfo?.expirationTime || "2099-12-31";
	return [
		`${native_i18n_default.t("sms-thank-you-order", { merchantName })}.`,
		`${native_i18n_default.t("gift_card_sms_card_label")}: ${cardNumber}.`,
		`${native_i18n_default.t("gift_card_sms_balance_label")}: ${balance}.`,
		`${native_i18n_default.t("gift_card_sms_exp_label")}: ${expirationTime}.`,
		`${native_i18n_default.t("allTotal")}: ${finalTotal} USD. `,
		`${native_i18n_default.t("gift_card_sms_come_again")}`
	].join(" ");
}
function buildGiftCardSmsPartPayContent({ merchantName, unpaid, paid, balance, finalTotal }) {
	return [
		`${native_i18n_default.t("sms-thank-you-order", { merchantName })}. ${native_i18n_default.t("sms-proceed-counter-payment")}. `,
		`${native_i18n_default.t("gift_card_sms_balance_label")}: ${balance}.`,
		`${native_i18n_default.t("allTotal")}: ${finalTotal} USD. `,
		`${native_i18n_default.t("paid")}: ${paid} USD. `,
		`${native_i18n_default.t("unpaid")}: ${unpaid} USD. `,
		`${native_i18n_default.t("gift_card_sms_come_again")}`
	].join(" ");
}
function sendMsgReceiptHandler(options = {}) {
	const state = native_store_default.getState();
	const merchantName = state.merchantProfile.name;
	const { saveOrderResult, paymentType: type } = state.currentOrder;
	const giftCardInfo = options?.giftCardInfo || null;
	const giftCardPhone = giftCardInfo?.cardDetail?.to.slice(-10);
	const phoneNumber = "1 " + (saveOrderResult.customer?.phone?.[0].number || giftCardPhone);
	const language = native_i18n_default.language || "en";
	const totalAmount = calculateTotalAmount(state);
	const isBuyGiftCard = !!giftCardInfo && (saveOrderResult?.type === "CLOUD_GIFT_CARD" || state.cardPaidResult?.type === "CLOUD_GIFT_CARD");
	const isCreditCardFullPaid = type === "CREDIT_CARD" && !state.cardPaidResult?.id;
	let content = [];
	let subTotal = Big(saveOrderResult.totalPrice).toFixed(2);
	let totalTax = Big(saveOrderResult.totalTax).toFixed(2);
	const tipAmount = Big(state.currentOrder.tipAmount).toFixed(2);
	const count = saveOrderResult?.orderItems?.reduce((total, item) => total + (item.quantity || 1), 0);
	let discount = 0;
	let crmIntegrationDiscount = 0;
	if (saveOrderResult?.discountList) {
		const crmIntegrationDiscountList = JSON.parse(saveOrderResult?.discountList);
		if (crmIntegrationDiscountList?.length > 0) {
			const discountInfo = crmIntegrationDiscountList[0];
			if (discountInfo.type === "promotion" && !discountInfo?.extraInfo?.isItemDetailDiscount) crmIntegrationDiscount = discountInfo.amount;
			else if (!discountInfo.isReward && !discountInfo?.extraInfo?.isItemDetailDiscount) crmIntegrationDiscount = discountInfo.amount;
		}
	}
	discount = Big(discount).plus(saveOrderResult?.rewardDiscount ?? 0).plus(saveOrderResult?.discount ?? 0).plus(crmIntegrationDiscount).toFixed(2);
	const itemNames = saveOrderResult?.orderItems?.map((item) => getDishItemLanguage(item?.fieldDisplayNameGroups, language).replaceAll(".", " ") || item.displayName.replaceAll(".", " "))?.join("、");
	let chargeContentList = [];
	let chargeTotal = 0;
	if (state.selfConfig?.charge?.length) {
		if (type == "CREDIT_CARD") {
			let r = state.selfConfig.charge.find((c) => c.id == 1);
			if (r?.select?.id) {
				chargeTotal = Big(subTotal).times(r.select.rate).div(100).toFixed(2);
				chargeContentList.push(`${r.select.name}:$${chargeTotal}.`);
			}
		}
	}
	let togoContentList = [];
	let togoTotal = 0;
	if (state.currentOrder.orderType === "TO_GO" || state.currentOrder.orderType === "PICK_UP") state.togoList.forEach((item) => {
		const rate = item.id !== 4 ? item.select.rate : item.select.rate * count;
		if (item?.select?.id) {
			togoTotal = Big(togoTotal).plus(rate).toFixed(2);
			if (item.select.id == -1) togoContentList.push(`${native_i18n_default.t([TOGONAMELIST[item.id]])}: ${native_i18n_default.t("free")}. `);
			else togoContentList.push(`${native_i18n_default.t([TOGONAMELIST[item.id]])}: ${rate} USD. `);
		}
	});
	if (type === "CREDIT_CARD" || totalAmount === 0) if (isBuyGiftCard) if (isCreditCardFullPaid) content = buildGiftCardSmsContent({
		merchantName,
		giftCardInfo,
		finalTotal: Big(subTotal).plus(totalTax).plus(togoTotal).plus(tipAmount).minus(discount).toFixed(2)
	});
	else {
		const { paid, unpaid } = state.cardPaidResult.unpaidInfo;
		content = buildGiftCardSmsPartPayContent({
			merchantName,
			unpaid,
			paid,
			balance: state.currentOrder.saveOrderResult.totalPrice,
			finalTotal: Big(paid).plus(unpaid).toFixed(2)
		});
	}
	else if (state.cardPaidResult?.id) {
		const { paid, unpaid } = state.cardPaidResult.unpaidInfo;
		content = [
			`${native_i18n_default.t("sms-thank-you-order", { merchantName })}. ${native_i18n_default.t("sms-proceed-counter-payment")}. `,
			`#${saveOrderResult.orderNumber}.  ${saveOrderResult.type}. `,
			`${itemNames}. `,
			`${native_i18n_default.t("subtotal")}: ${subTotal} USD. `,
			`${Number(totalTax) > 0 ? `${native_i18n_default.t("tax")}: ${totalTax} USD. ` : ""}`,
			`${native_i18n_default.t("Tips")}: ${tipAmount} USD. `,
			...chargeContentList,
			...togoContentList,
			`${Number(discount) > 0 ? `${native_i18n_default.t("sms-discount")}: -${discount} USD. ` : ""}`,
			`${native_i18n_default.t("paid")}: ${paid} USD. `,
			`${native_i18n_default.t("unpaid")}: ${unpaid} USD. `,
			`${saveOrderResult.createTime} `,
			`${native_i18n_default.t("sms-enjoy-meal")} `
		].join(" ");
	} else {
		let finalTotal = Big(subTotal).plus(totalTax).plus(chargeTotal).plus(togoTotal).plus(tipAmount).minus(discount).toFixed(2);
		content = [
			`${native_i18n_default.t("sms-thank-you-order", { merchantName })}. `,
			`#${saveOrderResult.orderNumber}.  ${saveOrderResult.type}. `,
			`${itemNames}. `,
			`${native_i18n_default.t("subtotal")}: ${subTotal} USD. `,
			`${Number(totalTax) > 0 ? `${native_i18n_default.t("tax")}: ${totalTax} USD. ` : ""}`,
			`${native_i18n_default.t("Tips")}: ${tipAmount} USD. `,
			...chargeContentList,
			...togoContentList,
			`${Number(discount) > 0 ? `${native_i18n_default.t("sms-discount")}: -${discount} USD. ` : ""}`,
			`${native_i18n_default.t("allTotal")}: ${finalTotal} USD. `,
			`${saveOrderResult.createTime} `,
			`${native_i18n_default.t("sms-enjoy-meal")} `
		].join(" ");
	}
	else if (type === "CASH") content = [
		`${native_i18n_default.t("sms-thank-you-order", { merchantName })}. ${native_i18n_default.t("sms-proceed-counter-payment")}. `,
		`#${saveOrderResult.orderNumber}.  ${saveOrderResult.type}. `,
		`${itemNames}. `,
		`${native_i18n_default.t("subtotal")}: ${subTotal} USD. `,
		`${Number(totalTax) > 0 ? `${native_i18n_default.t("tax")}: ${totalTax} USD. ` : ""}`,
		...chargeContentList,
		...togoContentList,
		`${Number(discount) > 0 ? `${native_i18n_default.t("sms-discount")}: -${discount} USD. ` : ""}`,
		`${saveOrderResult.createTime} `,
		`${native_i18n_default.t("sms-enjoy-meal")} `
	].join(" ");
	return sendMsgReceipt({
		phoneNumber,
		content
	});
}
//#endregion
//#region source-snapshot/src/utils/processZeroAmountOrder.js
/**
* 计算订单总金额
* @param {Object} store - Redux store state
* @returns {number} 总金额
*/
var calculateTotalAmount = (store) => {
	const orderData = generateSubmitOrderObj(store);
	const orderInfo = getOrderInfoObj(store);
	let crmIntegrationDiscount = 0;
	if (orderData?.order?.discountList) {
		const crmIntegrationDiscountList = JSON.parse(orderData.order.discountList);
		if (crmIntegrationDiscountList?.length > 0) {
			const discountInfo = crmIntegrationDiscountList[0];
			if (discountInfo.type === "promotion") crmIntegrationDiscount = discountInfo.amount;
			else if (!discountInfo.isReward) crmIntegrationDiscount = discountInfo.amount;
		}
	}
	return Big(orderInfo?.orderSubtotal).plus(orderData?.order?.totalTax).plus(orderData?.order?.chargeTotal).plus(orderData?.order?.togoTotal).minus(orderData?.order?.rewardDiscount ?? 0).minus(orderData?.order?.discount ?? 0).minus(crmIntegrationDiscount).toNumber();
};
/**
* 保存POS订单状态（用于零金额订单）
* @param {string} orderId - 订单ID
* @param {string} userId - 用户ID
* @param {string} checksum - 校验和
* @returns {Promise}
*/
var savePosStatus = async (orderId, userId, checksum) => {
	await savePaymentRecordType(`<app:printPaymentReceipt>false</app:printPaymentReceipt><app:merchantCopyOnly>false</app:merchantCopyOnly><app:paymentRecord><app:userId>${userId}</app:userId><app:orderId>${orderId}</app:orderId><app:type>CASH</app:type><app:amount>0</app:amount><app:paidAmount>0</app:paidAmount><app:multiplePayments>false</app:multiplePayments><app:changeAmount>0</app:changeAmount><app:tipAmount>0</app:tipAmount><app:checksum>${checksum}</app:checksum></app:paymentRecord>`, userId, getCookie("sessionKey"));
};
/**
* 处理零金额订单的提交逻辑
* @param {Object} params - 参数对象
* @param {Object} params.store - Redux store state
* @param {Function} params.saveOrderResult - 保存订单结果的action
* @param {string} params.userId - 用户ID
* @param {string} params.checksum - 校验和
* @param {string} params.kioskConfigUserId - Kiosk配置用户ID
* @param {Function} params.onError - 错误回调函数
* @param {Function} params.onPrintCall - 打印叫号单回调函数（可选）
* @returns {Promise<Object|null>} 返回订单信息或null
*/
var submitOrderForZeroAmount = async ({ store, saveOrderResult, userId, checksum, kioskConfigUserId, onError, onPrintCall }) => {
	native_store_default.dispatch(setNeedCommit(true));
	const latestStore = native_store_default.getState();
	let orderData = await generateSubmitOrderObj(latestStore);
	if (!orderData?.order?.orderItems?.length) {
		toast_default.info(native_i18n_default.t("order-create-fail"));
		window.location.hash = "/";
		return null;
	}
	posFrontLog(`[0元菜方法]submitOrderForZeroAmount
    -----itemList: ${JSON.stringify(latestStore?.currentOrder?.itemList?.map((item) => ({
		name: item?.name,
		id: item?.oId || item?.id
	})))}
    -----selectedDiscount:
        ${latestStore?.crm?.selectedDiscount?.couponTemplate?.templateName} - ${latestStore?.crm?.selectedDiscount?.couponTemplate?.id}
    -----selectedFreeItem:
        ${latestStore?.crm?.selectedFreeItem?.[0]?.couponTemplate?.templateName} - ${latestStore?.crm?.selectedFreeItem?.[0]?.couponTemplate?.id}
    -----tempCampaign:
        ${latestStore?.crm?.tempCampaign?.[0]?.couponTemplate?.templateName} - ${latestStore?.crm?.tempCampaign?.[0]?.couponTemplate?.id}`);
	try {
		const res = await saveOrder(orderData);
		if (res?.data?.result?.successful) {
			const orderId = res.data.order.id;
			const orderNumber = res.data.order.orderNumber;
			const phoneNumber = res.data.order.customer?.phone?.[0]?.number;
			saveOrderResult(res.data.order);
			const finalUserId = userId || res.data.order?.userId || latestStore?.currentOrder?.saveOrderResult?.userId;
			const finalChecksum = checksum || res.data.order?.checksum || latestStore?.currentOrder?.saveOrderResult?.checksum;
			const lockParm = {
				targetId: res.data.order?.id,
				kioskConfigUserId
			};
			const onErrCb = (apiRes) => {
				if (onError) onError(apiRes?.data?.msg || "Lock Error");
			};
			if (!await orderLockProcedure(lockParm, onErrCb)) return null;
			if (finalUserId && finalChecksum) await savePosStatus(orderId, finalUserId, finalChecksum);
			const { currentOrder: { tableId } } = latestStore;
			if (tableId) getChooseTableStatus(true);
			const send2KitchenObj = {
				orderId,
				userAuth: { sessionKey: getCookie("sessionKey") },
				resend: false
			};
			try {
				if (!(await send2Kitchen(send2KitchenObj)).data.result.successful && orderId) sendError2MsgCenter(orderId, "Send to kitchen failed");
			} catch {
				if (orderId) sendError2MsgCenter(orderId, "Send to kitchen failed");
			}
			const { selfConfig, currentOrder } = latestStore;
			const { orderType, tabelServiceType } = currentOrder;
			const locatorType = selfConfig?.configList?.find((config) => config.id === 28)?.value;
			if (orderType == "DINE_IN" && tabelServiceType == "DINE_IN" && locatorType === 0) {
				if (onPrintCall) onPrintCall(orderId);
				else if (!native_store_default.getState().currentOrder?.postPaymentActions?.callTicketPrinted) {
					const printCallObj = {
						orderId,
						userAuth: { sessionKey: getCookie("sessionKey") }
					};
					try {
						if ((await printCall(printCallObj)).data.result.successful) native_store_default.dispatch(markPostPaymentAction("callTicketPrinted"));
						else sendError2MsgCenter(orderId, "printCall failed");
					} catch {
						sendError2MsgCenter(orderId, "printCall failed");
					}
				}
			}
			sendNewOrderMessage(orderId, orderNumber, phoneNumber);
			return {
				orderId,
				orderNumber,
				phoneNumber
			};
		} else {
			if (onError) onError(res.data?.result?.failureReason);
			return null;
		}
	} catch (err) {
		if (onError) onError(err?.message);
		return null;
	}
};
/**
* 处理零金额订单流程
* @param {Object} params - 参数对象
* @param {Object} params.store - Redux store state
* @param {Function} params.payByCash - 现金支付action
* @param {Function} params.saveOrderResult - 保存订单结果的action
* @param {string} params.userId - 用户ID
* @param {string} params.checksum - 校验和
* @param {string} params.kioskConfigUserId - Kiosk配置用户ID
* @param {Function} params.onError - 错误回调函数
* @param {Function} params.onPrintCall - 打印叫号单回调函数（可选）
* @returns {Promise<Object|null>} 返回订单信息或null
*/
var processZeroAmountOrder = async ({ store, payByCash, saveOrderResult, userId, checksum, kioskConfigUserId, onError, onPrintCall }) => {
	const totalAmount = calculateTotalAmount(store);
	posFrontLog(`[0元菜方法]processZeroAmountOrder
    -----itemList: ${JSON.stringify(store?.currentOrder?.itemList?.map((item) => ({
		name: item?.name,
		id: item?.oId || item?.id
	})))}
    -----selectedDiscount:
        ${store?.crm?.selectedDiscount?.couponTemplate?.templateName} - ${store?.crm?.selectedDiscount?.couponTemplate?.id}
    -----selectedFreeItem:
        ${store?.crm?.selectedFreeItem?.[0]?.couponTemplate?.templateName} - ${store?.crm?.selectedFreeItem?.[0]?.couponTemplate?.id}
    -----tempCampaign:
        ${store?.crm?.tempCampaign?.[0]?.couponTemplate?.templateName} - ${store?.crm?.tempCampaign?.[0]?.couponTemplate?.id}
    ---- totalAmount: ${totalAmount}`);
	if (totalAmount === 0) {
		payByCash();
		await judgeSskeyIsActiveTime();
		return await submitOrderForZeroAmount({
			store,
			saveOrderResult,
			userId: userId || store?.currentOrder?.saveOrderResult?.userId,
			checksum: checksum || store?.currentOrder?.saveOrderResult?.checksum,
			kioskConfigUserId,
			onError,
			onPrintCall
		});
	}
	return null;
};
//#endregion
export { sendError2MsgCenter as a, printUnpaidReceiptHandler as i, processZeroAmountOrder as n, sendMsgReceiptHandler as o, savePosStatus as r, sendNewOrderMessage as s, calculateTotalAmount as t };
