import { t as toast_default } from "./toast-C8a1ReSo.js";
import { li as crmIntegrationSDK } from "./actions-BwRPwnFF.js";
import { t as native_i18n_default } from "./native-i18n-Bya1piKW.js";
import "./resolveCRMRewardItem-Du3vuEgI.js";
//#region source-snapshot/src/utils/CRMIntegration/resolveDiscountCampaign.js
var resolveDiscountCampaign = (rules) => {
	return rules.map((rule) => {
		const redeemPoint = rule?.redeemRule?.parameters?.point;
		const { ruleId } = rule;
		const template = rule.couponTemplate;
		const benefits = template.ruleExpression && template.ruleExpression.benefits;
		const action = benefits && benefits[benefits.length - 1] && benefits[benefits.length - 1].actions && benefits[benefits.length - 1].actions[benefits[benefits.length - 1].actions.length - 1];
		const rewardType = rule.type === "reward" ? "loyalty" : "voucher";
		const strategy = action.type === "minus" ? "byFixedAmount" : "byPercentageOff";
		const maxAmount = template.ruleExpression.options?.maxAmount;
		const actualDiscount = getActualDiscount(rule);
		const newRedeemRule = {
			parameters: {
				discount: action.params.value,
				maxDiscount: maxAmount,
				points: redeemPoint
			},
			strategy
		};
		return {
			...rule,
			_id: ruleId,
			campaignId: ruleId,
			rewardType,
			rewardRule: {
				redeemRule: newRedeemRule,
				rewardType
			},
			redeemRule: newRedeemRule,
			itemPoints: redeemPoint,
			isSatisfyMinSpend: true,
			actualDiscount
		};
	});
};
var getActualDiscount = (rule) => {
	return rule.crmIntegrationRule?.result?.[0]?.calculatedOrder?.discounts?.[0]?.amount;
};
//#endregion
//#region source-snapshot/src/utils/CRMIntegration/checkCRMIntegrationCampaign.js
var checkIsCampaignValid = async ({ coupons, metaData, extraItems, allItems }) => {
	const res = await (await crmIntegrationSDK.getCouponPlugin({
		coupons,
		metas: metaData,
		extraItems,
		allItems
	})).MarketGetOrderCoupons();
	return res?.data?.map((each) => {
		const { coupon } = each;
		return {
			...coupon,
			crmIntegrationRule: each,
			actualDiscount: each.result?.[0]?.calculatedOrder?.discounts?.[0]?.amount,
			formattedOrder: res.formattedOrder
		};
	});
};
var getInvalidReason = (rule) => {
	const language = native_i18n_default.language;
	const actualLang = language.includes("zh") ? "zh-cn" : language;
	return rule.crmIntegrationRule.invalidReason?.map((each) => each[actualLang || "en"]);
};
var handleCheckInvalid = ({ rule, onCheckFailed, toastPosition }) => {
	const reasons = getInvalidReason(rule);
	const info = reasons.reduce((pre, cur, idx) => {
		return `${pre}${reasons?.length > 1 ? `${idx + 1}:` : ""} ${cur} `;
	}, "");
	toast_default.info(`${info}`, toastPosition);
	onCheckFailed?.({ failureReason: info });
};
var handleCheckDiscount = ({ rule, onCheckSuccess, onCheckFailed }) => {
	if (!rule.crmIntegrationRule.isValid) {
		handleCheckInvalid({
			rule,
			onCheckFailed
		});
		return false;
	}
	const actualDiscount = getActualDiscount(rule);
	onCheckSuccess?.({
		...rule,
		actualDiscount
	});
	return true;
};
var handleCheckFreeItem = ({ rule, onCheckSuccess, onCheckFailed, toastPosition }) => {
	if (!rule.crmIntegrationRule.isValid) {
		handleCheckInvalid({
			rule,
			onCheckFailed,
			toastPosition
		});
		return false;
	}
	onCheckSuccess?.({ ...rule });
	return true;
};
var handleCheckSpecialItem = ({ rule, onCheckSuccess, onCheckFailed }) => {
	if (!rule.crmIntegrationRule.isValid) {
		handleCheckInvalid({
			rule,
			onCheckFailed
		});
		return false;
	}
	onCheckSuccess?.({ ...rule });
	return true;
};
var handleCheckBundleDiscount = ({ rule, onCheckSuccess, onCheckFailed }) => {
	if (!rule.crmIntegrationRule.isValid) {
		handleCheckInvalid({
			rule,
			onCheckFailed
		});
		return false;
	}
	onCheckSuccess?.({ ...rule });
	return true;
};
//#endregion
export { handleCheckSpecialItem as a, handleCheckFreeItem as i, handleCheckBundleDiscount as n, resolveDiscountCampaign as o, handleCheckDiscount as r, checkIsCampaignValid as t };
