import { r as instance } from "./native-i18n-Bya1piKW.js";
//#region source-snapshot/src/utils/PromotionCenterIntegration/getMatchedActivityRuleItem.js
/**
* 获取匹配的活动规则项
* @param {Object} PromoCenterHitActivity - 促销中心命中的活动对象
* @returns {Object} 匹配的活动规则项，如果没有匹配则返回空对象或默认规则项
*/
var getMatchedActivityRuleItem = (PromoCenterHitActivity) => {
	if (!PromoCenterHitActivity) return {};
	const { promotion: { activityRule, type }, validateInfo } = PromoCenterHitActivity;
	if (type === "totalAmountQuantityDiscount") {
		const orderSubtotal = validateInfo?.result?.rule?.condition?.totalAmount;
		if (orderSubtotal != void 0) {
			const matchedByAmount = activityRule.find((item) => item?.satisfyPrice != void 0 && orderSubtotal === item.satisfyPrice);
			if (matchedByAmount) return matchedByAmount;
		}
		const validateQuantity = validateInfo?.result?.rule?.condition?.quantity;
		if (validateQuantity != void 0) {
			const matchedByQuantity = activityRule.find((item) => item?.buyNumber != void 0 && validateQuantity === item.buyNumber);
			if (matchedByQuantity) return matchedByQuantity;
		}
	}
	return activityRule[0];
};
//#endregion
//#region source-snapshot/src/utils/PromotionCenterIntegration/getPromotionCenterDisplayText.js
/**
* 是否使用促销平台活动名称（promotionName）作为展示文案
*/
var isPromotionCenterActivityNameFromPlatform = (selfConfig) => {
	return selfConfig?.configMap?.id_64 === 1;
};
/**
* 是否使用活动配置中的自定义标签作为展示文案
*/
var isPromotionActivityLabel = (selfConfig) => {
	return selfConfig?.configMap?.id_64 === 2;
};
/**
* 根据配置选择促销活动展示文案
*/
var getPromotionActivityDisplayText = ({ defaultText, promotionName, activityName, activityLabel, promotionChineseTag, promotionEnglishTag, language = instance.language, selfConfig }) => {
	if (isPromotionCenterActivityNameFromPlatform(selfConfig)) {
		const activityNameText = activityName?.trim() || promotionName;
		if (activityNameText) return activityNameText;
	}
	if (isPromotionActivityLabel(selfConfig)) {
		const isChineseLanguage = ["zh_cn", "zh_tc"].includes(language);
		const promotionTag = isChineseLanguage ? promotionChineseTag : promotionEnglishTag;
		const labelLanguage = isChineseLanguage ? "zh_cn" : "en";
		const labelText = promotionTag?.trim() || activityLabel?.[labelLanguage]?.trim();
		if (labelText) return labelText;
	}
	return defaultText;
};
/**
* 从 activityRule 单条规则获取 i18n 文案
*/
var getActivityRuleItemI18nText = (t, activityRuleItem) => {
	if (!activityRuleItem?.text?.i18nKey) return "";
	return t(activityRuleItem.text.i18nKey, activityRuleItem.text.params);
};
/**
* 促销中心活动展示文案（根据 id_64 配置）
* @param {Object} [params.promoCenterHitActivity] 命中活动对象，系统预设文案时用于匹配阶梯规则
* @returns {string|string[]} 单条为 string，满减/满赠阶梯为 string[]
*/
var getPromotionCenterActivityRuleText = ({ t, activityRule, type, promotionName, activityLabel, promotionChineseTag, promotionEnglishTag, selfConfig, promoCenterHitActivity }) => {
	const promotionType = type ?? promoCenterHitActivity?.promotion?.type;
	let defaultText = "";
	if (promoCenterHitActivity) {
		const matchedActivityRuleItem = getMatchedActivityRuleItem(promoCenterHitActivity);
		if (matchedActivityRuleItem?.text?.i18nKey) defaultText = getActivityRuleItemI18nText(t, matchedActivityRuleItem);
	}
	if (!defaultText && activityRule?.length) {
		const ruleTextList = activityRule.map((item) => getActivityRuleItemI18nText(t, item));
		defaultText = promotionType === "totalAmountQuantityDiscount" || promotionType === "amountGiftItem" ? ruleTextList : ruleTextList[0] ?? "";
	}
	return getPromotionActivityDisplayText({
		defaultText,
		promotionName,
		promotionChineseTag: promotionChineseTag ?? promoCenterHitActivity?.promotionChineseTag ?? promoCenterHitActivity?.promotion?.promotionChineseTag,
		promotionEnglishTag: promotionEnglishTag ?? promoCenterHitActivity?.promotionEnglishTag ?? promoCenterHitActivity?.promotion?.promotionEnglishTag,
		activityLabel: activityLabel ?? promoCenterHitActivity?.promotion?.activityLabel,
		selfConfig
	});
};
/**
* 从 text 对象（含 i18nKey）获取展示文案
*/
var getPromotionCenterTextFromTextObject = ({ t, text, promotionName, activityLabel, promotionChineseTag, promotionEnglishTag, selfConfig }) => {
	return getPromotionActivityDisplayText({
		defaultText: text?.i18nKey ? t(text.i18nKey, text.params ?? {}) : "",
		promotionName,
		activityLabel,
		promotionChineseTag,
		promotionEnglishTag,
		selfConfig
	});
};
//#endregion
export { getPromotionCenterActivityRuleText as n, getPromotionCenterTextFromTextObject as r, getPromotionActivityDisplayText as t };
