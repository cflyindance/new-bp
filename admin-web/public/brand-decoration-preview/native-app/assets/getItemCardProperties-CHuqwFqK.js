import { qi as GIFT_PROMOTION_TYPE } from "./actions-BwRPwnFF.js";
//#region source-snapshot/src/utils/CountRemToPx.js
var remToPx = (rem) => {
	const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
	return rem * (rootSize > 0 ? rootSize : 10);
};
//#endregion
//#region source-snapshot/src/utils/getItemCardProperties.js
var ITEM_CARD_IMAGE_TAG_NAMES = ["SPICY", "RECOMMENDED"];
var ITEM_CARD_NEW_TAG_NAMES = ["NEW"];
var isDishTagVisible = (tag) => Boolean(tag?.isKioskTag || !Object.prototype.hasOwnProperty.call(tag || {}, "type") && (ITEM_CARD_IMAGE_TAG_NAMES.includes(tag?.name) || ITEM_CARD_NEW_TAG_NAMES.includes(tag?.name)) || Object.prototype.hasOwnProperty.call(tag || {}, "type") && tag.type !== 3);
var isDishTagHeightBearing = (tag) => isDishTagVisible(tag) && !ITEM_CARD_NEW_TAG_NAMES.includes(tag?.name) && tag?.type !== 2;
var filterVisibleDishTags = (tags = []) => tags.filter(isDishTagVisible);
var getItemCardProperties = ({ itemInfo, selfConfig, matchOriginalId = true }) => {
	const kioskProperties = (selfConfig?.configList?.find((config) => config.id === 54)?.value ? selfConfig?.configList?.find((config) => config.id === 38)?.value || [] : []).filter((property) => property.dish?.includes(itemInfo?.id) || matchOriginalId && property.dish?.includes(itemInfo?.oId)).map((property) => ({
		name: property.labelName,
		displayName: property.labelName,
		labelType: property.labelType,
		labelImg: property.labelImg,
		labelBgColor: property.labelBgColor || "#fffbf2",
		labelTextColor: property.labelTextColor || "#f26e21",
		isKioskTag: true
	}));
	return [...Array.isArray(itemInfo?.properties) ? itemInfo.properties : [], ...kioskProperties];
};
var getVisibleItemCardProperties = (params) => filterVisibleDishTags(getItemCardProperties(params));
var getHeightBearingItemCardProperties = (params) => getItemCardProperties(params).filter(isDishTagHeightBearing);
var isCommercialPromotionTagVisible = (promotion) => {
	const isExcludedType = promotion?.promotionType === "totalAmountQuantityDiscount" || GIFT_PROMOTION_TYPE.includes(promotion?.promotionType);
	const hasPromotionCodes = promotion?.promotionCodes?.length > 0;
	return !isExcludedType && !hasPromotionCodes;
};
var getPromotionItemKey = (itemId) => `${typeof itemId}:${String(itemId)}`;
var createItemPromotionIndex = (promotion = {}) => {
	const buyDiscountByItemId = /* @__PURE__ */ new Map();
	const buyGiftsByItemId = /* @__PURE__ */ new Map();
	const exchangePurchaseByItemId = /* @__PURE__ */ new Map();
	const localVisibleTagCountByItemId = /* @__PURE__ */ new Map();
	const increaseVisibleCount = (itemId) => {
		const key = getPromotionItemKey(itemId);
		localVisibleTagCountByItemId.set(key, (localVisibleTagCountByItemId.get(key) || 0) + 1);
	};
	(promotion.buyDiscountRule || []).forEach((rule) => {
		(rule?.activityRule?.buyDishes || []).forEach((itemId) => {
			const key = getPromotionItemKey(itemId);
			if (!buyDiscountByItemId.has(key)) {
				buyDiscountByItemId.set(key, rule);
				increaseVisibleCount(itemId);
			}
		});
	});
	(promotion.buyGiftRule || []).forEach((rule) => {
		(rule?.activityRule?.buyDishes || []).forEach((itemId) => {
			const key = getPromotionItemKey(itemId);
			const rules = buyGiftsByItemId.get(key) || [];
			rules.push(rule);
			buyGiftsByItemId.set(key, rules);
			increaseVisibleCount(itemId);
		});
	});
	(promotion.exchangePurchaseRule || []).forEach((rule) => {
		if (rule?.activityRule?.conditionType !== "itemQuantity") return;
		(rule?.activityRule?.buyDishes || []).forEach((itemId) => {
			const key = getPromotionItemKey(itemId);
			if (!exchangePurchaseByItemId.has(key)) {
				exchangePurchaseByItemId.set(key, rule);
				increaseVisibleCount(itemId);
			}
		});
	});
	return {
		buyDiscountByItemId,
		buyGiftsByItemId,
		exchangePurchaseByItemId,
		localVisibleTagCountByItemId,
		commercialByItemId: promotion.itemMatchCloudPromotion || {}
	};
};
var getIndexedItemPromotions = (promotionIndex, itemId) => {
	if (!promotionIndex) return null;
	const key = getPromotionItemKey(itemId);
	return {
		buyDiscountRule: promotionIndex.buyDiscountByItemId.get(key),
		buyGiftRules: promotionIndex.buyGiftsByItemId.get(key) || [],
		exchangePurchaseRule: promotionIndex.exchangePurchaseByItemId.get(key),
		commercialPromotions: promotionIndex.commercialByItemId?.[itemId] || []
	};
};
var getVisiblePromotionTagCount = ({ itemId, promotion = {}, promotionIndex }) => {
	if (promotionIndex) {
		const key = getPromotionItemKey(itemId);
		return (promotionIndex.localVisibleTagCountByItemId.get(key) || 0) + (promotionIndex.commercialByItemId?.[itemId]?.filter(isCommercialPromotionTagVisible).length || 0);
	}
	const discountCount = promotion.buyDiscountRule?.some((rule) => rule?.activityRule?.buyDishes?.includes(itemId)) ? 1 : 0;
	const buyGiftCount = promotion.buyGiftRule?.filter((rule) => rule?.activityRule?.buyDishes?.includes(itemId)).length || 0;
	const exchangePurchaseCount = promotion.exchangePurchaseRule?.some((rule) => rule?.activityRule?.conditionType === "itemQuantity" && rule?.activityRule?.buyDishes?.includes(itemId)) ? 1 : 0;
	const commercialPromotionCount = promotion.itemMatchCloudPromotion?.[itemId]?.filter(isCommercialPromotionTagVisible).length || 0;
	return discountCount + buyGiftCount + exchangePurchaseCount + commercialPromotionCount;
};
var CARD_HEIGHT_CHANGE_THRESHOLD = .5;
var updateMeasuredItemCardRowHeight = ({ row, rowIndex, itemIndex, measuredHeight, listRef }) => {
	const normalizedHeight = Number(measuredHeight);
	if (row?.type !== "cateList" || !Number.isFinite(normalizedHeight) || normalizedHeight <= 0 || !Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= (row.saleItems?.length || 0)) return false;
	const measuredCardHeights = row.measuredCardHeights || [];
	const nextItemHeight = normalizedHeight;
	const previousItemHeight = measuredCardHeights[itemIndex];
	if (Number.isFinite(previousItemHeight) && Math.abs(previousItemHeight - nextItemHeight) < CARD_HEIGHT_CHANGE_THRESHOLD) return false;
	measuredCardHeights[itemIndex] = nextItemHeight;
	row.measuredCardHeights = measuredCardHeights;
	const cardHeight = Math.max(0, ...(row.saleItems || []).map((_, index) => {
		const measuredItemHeight = measuredCardHeights[index];
		if (Number.isFinite(measuredItemHeight)) return measuredItemHeight;
		return row.cardEstimatedHeights?.[index] || 0;
	}));
	const nextRowHeight = (row.rowSpacing || 0) + cardHeight;
	if (Math.abs((row.height || 0) - nextRowHeight) < CARD_HEIGHT_CHANGE_THRESHOLD) return false;
	row.height = nextRowHeight;
	listRef?.current?.resetAfterIndex(rowIndex, true);
	return true;
};
//#endregion
export { getItemCardProperties as a, isCommercialPromotionTagVisible as c, remToPx as d, getIndexedItemPromotions as i, isDishTagHeightBearing as l, filterVisibleDishTags as n, getVisibleItemCardProperties as o, getHeightBearingItemCardProperties as r, getVisiblePromotionTagCount as s, createItemPromotionIndex as t, updateMeasuredItemCardRowHeight as u };
