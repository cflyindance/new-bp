//#region source-snapshot/src/utils/handleGetDevicePaymentInfo.js
var handleGetDevicePaymentInfo = (selfConfig) => {
	const currentDeviceId = localStorage.getItem("deviceId");
	if (!currentDeviceId) return {
		devicePayByCard: true,
		devicePayByCash: true,
		devicePayByEcard: true
	};
	const { devicePaymentType } = selfConfig?.configList?.find((config) => config.id === 34)?.value?.find((device) => device.deviceId === currentDeviceId);
	return {
		devicePayByCard: devicePaymentType.canPayByCard,
		devicePayByCash: devicePaymentType.canPayByCash,
		devicePayByEcard: devicePaymentType.canPayByEcard || false
	};
};
//#endregion
//#region source-snapshot/src/utils/handlePaymentTypeRoute.js
/**
* 判断当前支付方式是否需要进入 paymentType 路由
*
* 支付方式代码：
* - '0' = credit/debit card (信用卡/借记卡)
* - '1' = cash (现金)
* - '2' = ecard (电子卡)
*
* @param {Object} systemConfig - 系统配置
* @param {Object} selfConfig - 设备配置
* @returns {Object} 判断结果
* @returns {boolean} returns.shouldSkipPaymentType - 是否跳过 paymentType
* @returns {boolean} returns.canPayByCard - 是否支持 card 支付（全局+设备）
* @returns {boolean} returns.canPayByCash - 是否支持 cash 支付（全局+设备）
* @returns {boolean} returns.canPayByEcard - 是否支持 ecard 支付（全局+设备）
*/
var handlePaymentTypeRoute = (systemConfig, selfConfig) => {
	const { devicePayByCard = true, devicePayByCash = true, devicePayByEcard = true } = handleGetDevicePaymentInfo(selfConfig);
	const paymentTypeValue = systemConfig?.KIOSK_PAYMENT_TYPE?.value;
	if (!paymentTypeValue) return {
		shouldSkipPaymentType: false,
		canPayByCard: false,
		canPayByCash: false,
		canPayByEcard: false
	};
	const canPayByCard = paymentTypeValue.includes("0") && devicePayByCard;
	const canPayByCash = paymentTypeValue.includes("1") && devicePayByCash;
	const canPayByEcard = paymentTypeValue.includes("2") && devicePayByEcard;
	const onlyCard = canPayByCard && !canPayByCash && !canPayByEcard;
	const onlyCash = !canPayByCard && canPayByCash && !canPayByEcard;
	return {
		shouldSkipPaymentType: onlyCard || onlyCash,
		canPayByCard,
		canPayByCash,
		canPayByEcard,
		onlyCard,
		onlyCash
	};
};
//#endregion
export { handlePaymentTypeRoute as t };
