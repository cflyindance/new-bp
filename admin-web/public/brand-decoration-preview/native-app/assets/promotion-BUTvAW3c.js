import { As as SET_CLOUD_PROMOTION_LIST, Dc as SET_SATISFY_RULES, Ds as SET_BUY_GIFTS_RULES, Ec as SET_PROMO_CODE, Es as SET_BUY_GIFTS, Jr as isHasCRMCampaignFn, Qs as SET_IS_PAUSE_AUTO_VALIDATE_PROMOTION, Tc as SET_PROMOTION, Ts as SET_BUY_DISCOUNT_RULES, Wa as CHANGE_SKIP_PROMOTION_CALCULATION_STATUS, Ys as SET_EXCHANGE_PURCHASE_RULES, ks as SET_CLOUD_PROMOTION, mc as SET_ORDER_DISCOUNT, tc as SET_ITEM_VALID_PROMOTION, za as CHANGE_CRM_PROMOTION_CONTRARY_INFO } from "./actions-BwRPwnFF.js";
//#region source-snapshot/src/actions/promotion.js
/**
* 促销相关
* */
var setPromotion = (data) => ({
	type: SET_PROMOTION,
	data
});
var setBuyGifts = (data) => ({
	type: SET_BUY_GIFTS,
	data
});
var setSatisfyRules = (data) => ({
	type: SET_SATISFY_RULES,
	data
});
var setBuyGiftRule = (data) => ({
	type: SET_BUY_GIFTS_RULES,
	data
});
var setBuyDiscountRule = (data) => ({
	type: SET_BUY_DISCOUNT_RULES,
	data
});
var setExchangePurchaseRule = (data) => ({
	type: SET_EXCHANGE_PURCHASE_RULES,
	data
});
var setOrderDiscount = (data) => ({
	type: SET_ORDER_DISCOUNT,
	data
});
var setPromotionCode = (data) => ({
	type: SET_PROMO_CODE,
	data
});
/**
* 云 Promotion
* */
var setCloudPromotion = (data) => ({
	type: SET_CLOUD_PROMOTION,
	data
});
/**
* 促销中台
* */
var setCloudPromotionList = (data) => ({
	type: SET_CLOUD_PROMOTION_LIST,
	data
});
var setItemValidPromotion = (data) => ({
	type: SET_ITEM_VALID_PROMOTION,
	data
});
var changeCrmPromotionContraryInfo = (data) => ({
	type: CHANGE_CRM_PROMOTION_CONTRARY_INFO,
	data
});
var setIsPauseAutoValidatePromotion = (data) => ({
	type: SET_IS_PAUSE_AUTO_VALIDATE_PROMOTION,
	data
});
var changePromotionStatusAfterCheck = (item) => {
	return (dispatch, getState) => {
		if (item.isFreeItem || item.isCRMFreeItem || item.isCRMIntegrationFreeItem) return;
		const { selectedDiscount, selectedFreeItem } = getState().crm;
		const { itemList } = getState().currentOrder;
		if (!isHasCRMCampaignFn({
			itemList,
			selectedFreeItem,
			selectedDiscount
		})) dispatch({
			type: CHANGE_SKIP_PROMOTION_CALCULATION_STATUS,
			data: false
		});
	};
};
//#endregion
export { setBuyGifts as a, setExchangePurchaseRule as c, setOrderDiscount as d, setPromotion as f, setBuyGiftRule as i, setIsPauseAutoValidatePromotion as l, setSatisfyRules as m, changePromotionStatusAfterCheck as n, setCloudPromotion as o, setPromotionCode as p, setBuyDiscountRule as r, setCloudPromotionList as s, changeCrmPromotionContraryInfo as t, setItemValidPromotion as u };
