var getSupportedTipPaymentMethods = (paymentTypeValue) => {
	const value = String(paymentTypeValue ?? "");
	const supported = [];
	if (value.split(",").includes(String(1))) supported.push(1);
	if (value.split(",").includes(String(0))) supported.push(0);
	if (value.split(",").includes(String(2))) supported.push(2);
	return supported;
};
var normalizeTipPaymentMethodConfig = (configList = [], paymentTypeValue) => {
	const configIndex = configList.findIndex((item) => item.id === 70);
	const supportedMethods = getSupportedTipPaymentMethods(paymentTypeValue);
	if (configIndex < 0 || !supportedMethods.length) return {
		configList,
		hasUpdated: false,
		supportedMethods
	};
	const config = configList[configIndex];
	const currentValue = Array.isArray(config.value) ? config.value : [];
	const giftCardSupported = supportedMethods.includes(2);
	let nextValue = currentValue.filter((method) => supportedMethods.includes(Number(method)));
	if (!config.init) nextValue = [...supportedMethods];
	else {
		if (giftCardSupported && config.giftCardInit !== true && !nextValue.includes(2)) nextValue.push(2);
		if (!nextValue.length) nextValue = [supportedMethods[0]];
	}
	const normalizedCurrentValue = currentValue.map(Number);
	if (!(normalizedCurrentValue.length !== nextValue.length || normalizedCurrentValue.some((method, index) => method !== nextValue[index]) || config.init !== true || config.giftCardInit !== giftCardSupported)) return {
		configList,
		hasUpdated: false,
		supportedMethods
	};
	const nextConfigList = [...configList];
	nextConfigList[configIndex] = {
		...config,
		value: nextValue,
		init: true,
		giftCardInit: giftCardSupported
	};
	return {
		configList: nextConfigList,
		hasUpdated: true,
		supportedMethods
	};
};
var isTipEnabledForPayment = (selfConfig, paymentType) => {
	if (!selfConfig?.configMap?.id_5) return false;
	const config = selfConfig?.configList?.find((item) => item.id === 70);
	const value = selfConfig?.configMap?.id_70 ?? config?.value;
	if (!Array.isArray(value) || config?.init !== true) return paymentType === "CREDIT_CARD";
	const method = paymentType === "CASH" ? 1 : paymentType === "CREDIT_CARD" ? 0 : paymentType === "GIFT_CARD" ? 2 : null;
	return method !== null && value.map(Number).includes(method);
};
var getTipProcedureConfig = (configList = []) => configList.find((item) => item.id === 24);
var getSelectedTipPaymentMethods = (configList = []) => (configList.find((item) => item.id === 70)?.value || []).map(Number);
var hasOnlyCashTipPaymentMethod = (configList = []) => {
	const selectedMethods = getSelectedTipPaymentMethods(configList);
	return selectedMethods.length === 1 && selectedMethods[0] === 1;
};
var doTipPaymentMethodsCoverAllPaymentMethods = (configList = [], paymentTypeValue) => {
	const supportedMethods = getSupportedTipPaymentMethods(paymentTypeValue);
	const selectedMethods = getSelectedTipPaymentMethods(configList);
	return supportedMethods.length > 0 && supportedMethods.every((method) => selectedMethods.includes(method));
};
var getTipProcedureValue = (selfConfig) => Number(selfConfig?.configMap?.id_24 ?? getTipProcedureConfig(selfConfig?.configList)?.value);
var shouldCollectTipBeforePaymentMethod = (selfConfig, paymentTypeValue) => !!selfConfig?.configMap?.id_5 && getTipProcedureValue(selfConfig) === 2 && !hasOnlyCashTipPaymentMethod(selfConfig?.configList) && doTipPaymentMethodsCoverAllPaymentMethods(selfConfig?.configList, paymentTypeValue);
var shouldCollectTipBeforePayment = (selfConfig, paymentType) => isTipEnabledForPayment(selfConfig, paymentType) && getTipProcedureValue(selfConfig) === 0;
var shouldCollectTipAfterPayment = (selfConfig, paymentType) => isTipEnabledForPayment(selfConfig, paymentType) && getTipProcedureValue(selfConfig) === 1;
//#endregion
export { shouldCollectTipAfterPayment as a, normalizeTipPaymentMethodConfig as i, hasOnlyCashTipPaymentMethod as n, shouldCollectTipBeforePayment as o, isTipEnabledForPayment as r, shouldCollectTipBeforePaymentMethod as s, getTipProcedureValue as t };
