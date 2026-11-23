import { Tr as judgeNeedPayOtherCharge } from "./actions-BwRPwnFF.js";
import { n as processZeroAmountOrder, t as calculateTotalAmount } from "./processZeroAmountOrder-bzVRsrOO.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { o as shouldCollectTipBeforePayment, r as isTipEnabledForPayment } from "./tipPaymentMethods-DcvlIwUR.js";
import { t as judgeOnlyHaveFreeItem } from "./judgeOnlyHaveFreeItem-Bgp5tyri.js";
//#region source-snapshot/src/utils/runJudgeSMSAfterOperation.js
/**
* 人数选择 / 购物车后续：按 SMS、姓名、支付等配置继续流转
*/
async function runJudgeSMSAfterOperation({ systemConfig, selfConfig, store, history, payByCard, payByCash, saveOrderResult, kioskConfigUserId, judgeConfigToSoldout, judgeFillCardMinAmout, setLoading, onError }) {
	const onlyHaveFreeItem = judgeOnlyHaveFreeItem();
	const needPayForCharge = judgeNeedPayOtherCharge();
	if (systemConfig.KIOSK_SEND_MESSAGE?.booleanValue) {
		history.push("./phoneInput");
		return;
	}
	if (selfConfig?.configMap?.id_1) {
		history.push("./enterName");
		return;
	}
	const totalAmount = calculateTotalAmount(store);
	if (onlyHaveFreeItem && !needPayForCharge || totalAmount === 0) {
		if (totalAmount === 0) {
			setLoading?.(true);
			const result = await processZeroAmountOrder({
				store,
				payByCash,
				saveOrderResult,
				userId: null,
				checksum: null,
				kioskConfigUserId,
				onError: (errMsg) => {
					setLoading?.(false);
					onError?.(errMsg);
				}
			});
			setLoading?.(false);
			if (result) history.push("/orderFinish");
			return;
		}
		judgeConfigToSoldout(() => {
			history.push("/paymentType");
		});
		return;
	}
	judgeConfigToSoldout(() => {
		const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
		if (paymentRouteResult.shouldSkipPaymentType) {
			if (paymentRouteResult.canPayByCard) {
				payByCard();
				if (isTipEnabledForPayment(selfConfig, "CREDIT_CARD")) if (shouldCollectTipBeforePayment(selfConfig, "CREDIT_CARD")) history.push("/tippingPanel");
				else judgeConfigToSoldout(judgeFillCardMinAmout);
				else judgeConfigToSoldout(judgeFillCardMinAmout);
			} else if (paymentRouteResult.canPayByCash) history.push("/paymentType");
		} else history.push("/paymentType");
	});
}
//#endregion
export { runJudgeSMSAfterOperation as t };
