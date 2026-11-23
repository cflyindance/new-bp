import { d as __toESM, i as require_react, o as __commonJSMin, t as toast_default } from "./toast-C8a1ReSo.js";
import "./utils-Cdx9DbDR.js";
import { d as useSelector, t as useDispatch } from "./es-CFYDnMm2.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { $r as checkIsItemPromotionValid, Ai as require__baseIteratee, Gi as scopePromotionItemFilter, Ji as ITEM_SELECTION_PROMOTION_TYPES, Mi as require_get, Qi as Big, Qr as checkIsGiftPromotionValid, Sa as require__baseAssignValue, Ui as getPromotionBenefitItems, Xi as v4, Yi as RECOMMEND_SUCCESS_TYPE, Zi as getItemPrice, Zr as checkIsFixedPriceSelectItems, _a as require_isArrayLike, ai as getGiftPromotionRewardItems, ci as makeUpSpecialPromotionAddOnItem, ei as checkIsRuleDiscountInvalid, ga as require_keys, hi as getMemberPricingContext, n as addCampaignItemsToOrder, ni as checkItemPromotionStatus, pi as getMemberActivityState, qi as GIFT_PROMOTION_TYPE, si as makeUpPromotionAddOnItem, ti as checkIsRuleValid, va as require_isArray } from "./actions-BwRPwnFF.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { n as getValidCategoryList } from "./getStandardCateDish-BKfAMpZF.js";
import { l as setIsPauseAutoValidatePromotion, u as setItemValidPromotion } from "./promotion-BUTvAW3c.js";
import { n as getPromotionCenterActivityRuleText } from "./getPromotionCenterDisplayText-Bfjuriuq.js";
import { t as require_isEqual } from "./isEqual-PfNrN1Me.js";
//#region source-snapshot/src/hooks/useCloseModalOnHomePage.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var useCloseModalOnHomePage = (onCloseFn) => {
	const handleLocationChange = () => {
		if (window.location.hash === "#/") onCloseFn?.();
	};
	(0, import_react.useEffect)(() => {
		window.addEventListener("popstate", handleLocationChange);
		return () => {
			window.removeEventListener("popstate", handleLocationChange);
		};
	}, []);
};
//#endregion
//#region node_modules/lodash/_arrayAggregator.js
var require__arrayAggregator = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* A specialized version of `baseAggregator` for arrays.
	*
	* @private
	* @param {Array} [array] The array to iterate over.
	* @param {Function} setter The function to set `accumulator` values.
	* @param {Function} iteratee The iteratee to transform keys.
	* @param {Object} accumulator The initial aggregated object.
	* @returns {Function} Returns `accumulator`.
	*/
	function arrayAggregator(array, setter, iteratee, accumulator) {
		var index = -1, length = array == null ? 0 : array.length;
		while (++index < length) {
			var value = array[index];
			setter(accumulator, value, iteratee(value), array);
		}
		return accumulator;
	}
	module.exports = arrayAggregator;
}));
//#endregion
//#region node_modules/lodash/_createBaseFor.js
var require__createBaseFor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Creates a base function for methods like `_.forIn` and `_.forOwn`.
	*
	* @private
	* @param {boolean} [fromRight] Specify iterating from right to left.
	* @returns {Function} Returns the new base function.
	*/
	function createBaseFor(fromRight) {
		return function(object, iteratee, keysFunc) {
			var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
			while (length--) {
				var key = props[fromRight ? length : ++index];
				if (iteratee(iterable[key], key, iterable) === false) break;
			}
			return object;
		};
	}
	module.exports = createBaseFor;
}));
//#endregion
//#region node_modules/lodash/_baseFor.js
var require__baseFor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__createBaseFor()();
}));
//#endregion
//#region node_modules/lodash/_baseForOwn.js
var require__baseForOwn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseFor = require__baseFor();
	var keys = require_keys();
	/**
	* The base implementation of `_.forOwn` without support for iteratee shorthands.
	*
	* @private
	* @param {Object} object The object to iterate over.
	* @param {Function} iteratee The function invoked per iteration.
	* @returns {Object} Returns `object`.
	*/
	function baseForOwn(object, iteratee) {
		return object && baseFor(object, iteratee, keys);
	}
	module.exports = baseForOwn;
}));
//#endregion
//#region node_modules/lodash/_createBaseEach.js
var require__createBaseEach = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isArrayLike = require_isArrayLike();
	/**
	* Creates a `baseEach` or `baseEachRight` function.
	*
	* @private
	* @param {Function} eachFunc The function to iterate over a collection.
	* @param {boolean} [fromRight] Specify iterating from right to left.
	* @returns {Function} Returns the new base function.
	*/
	function createBaseEach(eachFunc, fromRight) {
		return function(collection, iteratee) {
			if (collection == null) return collection;
			if (!isArrayLike(collection)) return eachFunc(collection, iteratee);
			var length = collection.length, index = fromRight ? length : -1, iterable = Object(collection);
			while (fromRight ? index-- : ++index < length) if (iteratee(iterable[index], index, iterable) === false) break;
			return collection;
		};
	}
	module.exports = createBaseEach;
}));
//#endregion
//#region node_modules/lodash/_baseEach.js
var require__baseEach = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseForOwn = require__baseForOwn();
	module.exports = require__createBaseEach()(baseForOwn);
}));
//#endregion
//#region node_modules/lodash/_baseAggregator.js
var require__baseAggregator = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseEach = require__baseEach();
	/**
	* Aggregates elements of `collection` on `accumulator` with keys transformed
	* by `iteratee` and values set by `setter`.
	*
	* @private
	* @param {Array|Object} collection The collection to iterate over.
	* @param {Function} setter The function to set `accumulator` values.
	* @param {Function} iteratee The iteratee to transform keys.
	* @param {Object} accumulator The initial aggregated object.
	* @returns {Function} Returns `accumulator`.
	*/
	function baseAggregator(collection, setter, iteratee, accumulator) {
		baseEach(collection, function(value, key, collection) {
			setter(accumulator, value, iteratee(value), collection);
		});
		return accumulator;
	}
	module.exports = baseAggregator;
}));
//#endregion
//#region node_modules/lodash/_createAggregator.js
var require__createAggregator = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var arrayAggregator = require__arrayAggregator();
	var baseAggregator = require__baseAggregator();
	var baseIteratee = require__baseIteratee();
	var isArray = require_isArray();
	/**
	* Creates a function like `_.groupBy`.
	*
	* @private
	* @param {Function} setter The function to set accumulator values.
	* @param {Function} [initializer] The accumulator object initializer.
	* @returns {Function} Returns the new aggregator function.
	*/
	function createAggregator(setter, initializer) {
		return function(collection, iteratee) {
			var func = isArray(collection) ? arrayAggregator : baseAggregator, accumulator = initializer ? initializer() : {};
			return func(collection, setter, baseIteratee(iteratee, 2), accumulator);
		};
	}
	module.exports = createAggregator;
}));
//#endregion
//#region node_modules/lodash/countBy.js
var require_countBy = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseAssignValue = require__baseAssignValue();
	var createAggregator = require__createAggregator();
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	module.exports = createAggregator(function(result, value, key) {
		if (hasOwnProperty.call(result, key)) ++result[key];
		else baseAssignValue(result, key, 1);
	});
}));
//#endregion
//#region source-snapshot/src/utils/PromotionCenterIntegration/index.js
var import_isEqual = /* @__PURE__ */ __toESM(require_isEqual());
require_get();
var import_countBy = /* @__PURE__ */ __toESM(require_countBy());
var handleValidateItemPromotion = async ({ rules, promotionCenterMetas, promotionCenterList, allItems }) => {
	const matchedRuleMap = new Map(rules.map((rule) => [rule.promotionId, rule]));
	const rulesInfo = promotionCenterList?.filter((each) => matchedRuleMap.has(each.id) || GIFT_PROMOTION_TYPE.includes(each.type) || each.type === "orderItemFixedPrice").map((each) => {
		const matchedRule = matchedRuleMap.get(each.id);
		if (!matchedRule) return each;
		return {
			...each,
			promotionChineseTag: matchedRule.promotionChineseTag,
			promotionEnglishTag: matchedRule.promotionEnglishTag
		};
	});
	return await checkIsItemPromotionValid({
		rules: rulesInfo,
		promotionCenterMetas,
		allItems
	});
};
var handleCheckOrderPromotion = async ({ promotionCenterList, promotionCenterMetas, onCheckFailed, onCheckSuccess, allItems, merchantId }) => {
	const stateAtValidation = native_store_default.getState();
	const orderItemsAtValidation = stateAtValidation.currentOrder.itemList;
	const pricingContext = getMemberPricingContext(stateAtValidation);
	const isCurrent = () => {
		const latest = native_store_default.getState();
		return latest.currentOrder.itemList === orderItemsAtValidation && getMemberPricingContext(latest) === pricingContext;
	};
	try {
		const res = await checkItemPromotionStatus({
			promotionList: promotionCenterList,
			allItems,
			merchantId
		});
		if (!isCurrent()) return;
		if (res) {
			const allItemRules = [];
			res.forEach((v) => {
				allItemRules.push(...v);
			});
			const validateRes = await handleValidateItemPromotion({
				rules: allItemRules.reduce((pre, cur) => {
					if (!pre.length) return pre.concat(cur);
					return pre.find((each) => each.promotionId === cur.promotionId) ? pre : pre.concat(cur);
				}, []),
				promotionCenterMetas,
				promotionCenterList,
				allItems
			});
			if (!isCurrent()) return;
			if (!validateRes?.length) return onCheckFailed?.();
			onCheckSuccess?.(validateRes);
			return;
		}
		onCheckFailed?.();
	} catch (e) {
		if (isCurrent()) onCheckFailed?.(e);
	}
};
var INIT_PROMOTION_REWARD_INFO = {
	orderDiscountInfo: void 0,
	actualDiscount: void 0,
	itemDiscountInfo: void 0,
	promotionRewardItem: void 0,
	manualSelectRewardDiscount: void 0,
	memberPricingContext: void 0,
	memberPricingItemsContext: void 0
};
var isSameItems = (a = [], b = []) => {
	if (a.length !== b.length) return false;
	return (0, import_isEqual.default)((0, import_countBy.default)(a, "id"), (0, import_countBy.default)(b, "id"));
};
var makeUpItemValidPromotion = ({ currentRuleInfo, itemValidPromotion, isCurrentSelected = true }) => {
	let newItemValidPromotion = [];
	const { promotion } = currentRuleInfo;
	if (itemValidPromotion?.length > 0) {
		const isPromotionInPool = itemValidPromotion.findIndex((e) => e.promotion.id === promotion.id);
		newItemValidPromotion = itemValidPromotion.map((each, i) => {
			return i === isPromotionInPool ? {
				...currentRuleInfo,
				isSelected: isCurrentSelected
			} : {
				...each,
				isSelected: false
			};
		});
		if (isPromotionInPool === -1) newItemValidPromotion.push({
			...currentRuleInfo,
			isSelected: isCurrentSelected
		});
	} else newItemValidPromotion = [{
		...currentRuleInfo,
		isSelected: isCurrentSelected
	}];
	return newItemValidPromotion;
};
var getSingleItemSelectionPromotion = (promotions, promotionCode) => {
	if (promotions?.length !== 1) return null;
	const activity = promotions[0];
	const { promotion } = activity;
	if (!ITEM_SELECTION_PROMOTION_TYPES.includes(promotion?.type)) return null;
	if (promotion.promotionCodes?.length && (!promotionCode || !promotion.promotionCodes.includes(promotionCode))) return null;
	return (GIFT_PROMOTION_TYPE.includes(promotion.type) ? checkIsGiftPromotionValid(activity) : checkIsFixedPriceSelectItems(activity) || checkIsRuleValid(activity.validateInfo)) ? activity : null;
};
var getSingleAutoApplicableFixedPricePromotion = (promotions, promotionCode) => {
	const activity = getSingleItemSelectionPromotion(promotions, promotionCode);
	if (activity?.promotion.type !== "orderItemFixedPrice" || !checkIsRuleValid(activity.validateInfo) || checkIsRuleDiscountInvalid(activity)) return null;
	return activity.validateInfo.result.result.orderItems?.some((item) => item.discounts?.some((discount) => discount.id === activity.promotion.id && discount.isReward !== false)) ? activity : null;
};
var removeSelectedPromotionRewardItems = (items, promotions) => {
	const activityIds = new Set((promotions || []).filter((promotion) => ITEM_SELECTION_PROMOTION_TYPES.includes(promotion.type)).map((promotion) => promotion.id));
	const fixedPriceIds = new Set((promotions || []).filter((promotion) => promotion.type === "orderItemFixedPrice").map((promotion) => promotion.id));
	return items.reduce((remainingItems, item) => {
		const isActivityReward = (discount) => activityIds.has(discount.id) && discount.isReward !== false;
		if (activityIds.has(item.promotionSelectionId) || item.manualSelectRewardDiscount?.some(isActivityReward) || item.promotionRewardItem && item.itemDiscountInfo?.some((discount) => isActivityReward(discount) && !fixedPriceIds.has(discount.id))) return remainingItems;
		const hasActivityRewardInfo = item.promotionRewardItem && item.itemDiscountInfo?.some(isActivityReward);
		return remainingItems.concat(hasActivityRewardInfo ? {
			...item,
			...INIT_PROMOTION_REWARD_INFO,
			promotionRewardInfo: void 0
		} : item);
	}, []);
};
//#endregion
//#region source-snapshot/src/hooks/useAddOnPromotion.js
var initDrawerState = {
	visible: false,
	promotion: null,
	max: 9999,
	type: null,
	showHiddenItems: false
};
/**
* 促销凑单功能 Hook
* @param {Object} params - 参数对象（可选）
* @param {Function} params.onSkip - 跳过回调（可选）
* @param {Function} params.onClose - 关闭吊起该方法组件的回调（可选）
* @param {Function} params.goOrder - 跳转页面的回调（可选）
* @returns {Object} 返回 ItemsDrawer 组件、控制方法和状态
*/
var useAddOnPromotion = ({ onSkip, onClose, goOrder, isGiftPromotionAutoOpenRewardModal, promotionCenterList } = {}) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const currentOrder = useSelector((state) => state.currentOrder);
	const merchantId = useSelector((state) => state.merchantProfile?.merchantId);
	const menuGroup = useSelector((state) => state.menuGroup);
	const itemValidPromotion = useSelector((state) => state.promotion.itemValidPromotion);
	const promotionCenterMetas = useSelector((state) => state.promotion.promotionCenterMetas);
	const memberCRMInfo = useSelector((state) => state.crm.memberCRMInfo);
	const selfConfig = useSelector((state) => state.selfConfig);
	const [drawerState, setDrawerState] = (0, import_react.useState)(initDrawerState);
	const drawerRequestRef = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => () => {
		drawerRequestRef.current += 1;
	}, []);
	const addOnItemDrawerVisible = (0, import_react.useMemo)(() => {
		return drawerState.visible;
	}, [drawerState]);
	const addOnPromotion = (0, import_react.useMemo)(() => {
		return drawerState.promotion;
	}, [drawerState]);
	const addOnPromotionMax = (0, import_react.useMemo)(() => {
		return drawerState.max;
	}, [drawerState]);
	const drawerType = (0, import_react.useMemo)(() => {
		return drawerState.type;
	}, [drawerState]);
	/**
	* 关闭抽屉
	*/
	const handleCloseDrawer = (0, import_react.useCallback)(() => {
		drawerRequestRef.current += 1;
		setDrawerState(initDrawerState);
	}, []);
	const itemResources = (0, import_react.useMemo)(() => {
		if (!currentOrder?.orderType) return [];
		return getValidCategoryList(menuGroup.filter((g) => !g.isFreeItemMenu && g.id !== "promotion-deals-list"), currentOrder.orderType, false).flatMap((category) => category.saleItems).filter(Boolean);
	}, [menuGroup, currentOrder?.orderType]);
	const orderListItems = (0, import_react.useMemo)(() => {
		if (currentOrder?.itemList?.length > 0) return currentOrder.itemList.map((e) => ({
			...e,
			uniqueItemTempId: v4()
		}));
		return [];
	}, [currentOrder?.itemList]);
	const value = (0, import_react.useMemo)(() => {
		if (addOnPromotion && orderListItems?.length > 0) {
			const { promotion } = addOnPromotion;
			if (promotion.type === "orderItemFixedPrice") return orderListItems.filter((item) => item.promotionSelectionId === promotion.id);
			if (!GIFT_PROMOTION_TYPE.includes(promotion.type)) return orderListItems;
			return drawerType === "addon" ? orderListItems.filter((e) => !e.manualSelectRewardDiscount) : orderListItems.filter((e) => e.manualSelectRewardDiscount);
		}
	}, [
		orderListItems,
		addOnPromotion,
		drawerType
	]);
	const promotionBaseItems = (0, import_react.useMemo)(() => {
		const activity = addOnPromotion?.promotion;
		return activity?.type === "orderItemFixedPrice" ? removeSelectedPromotionRewardItems(orderListItems, [activity]) : void 0;
	}, [orderListItems, addOnPromotion]);
	/**
	* 打开凑单抽屉
	* @param {Object} promotionItem - 促销项
	* @param {Boolean} isDealListClick - 是否是从卡片列表点击，当促销活动是特价优惠时，从卡片列表点击是打开活动列表，若点击【去凑单】，则去菜单页；（因为特价优惠特殊，商品即可以凑单又可以参与活动）
	*/
	const goAddOnPromotion = (0, import_react.useCallback)((promotionItem, isDealListClick = false) => {
		const { promotion: { type, memberScope, ruleExpression: { condition, benefits, options } }, orderItemList } = promotionItem;
		let itemList = [];
		if (memberScope === "allMember" && !Object.keys(memberCRMInfo)?.length) return toast_default.info(t("promotion-select-member-item"));
		const getFilterType = () => {
			return type === "orderItemGiftItem" || type === "orderItemFixedPrice" ? benefits?.[0]?.condition?.itemFilter?.type : condition?.itemFilter?.type;
		};
		const itemFilterType = getFilterType();
		if (type === "orderItemFixedPrice") {
			itemList = makeUpSpecialPromotionAddOnItem({
				benefits,
				itemResources,
				orderType: currentOrder.orderType,
				options
			});
			if (!isDealListClick && !checkIsFixedPriceSelectItems(promotionItem)) {
				if (onClose) onClose();
				if (goOrder) goOrder();
				return;
			}
		} else if (type === "orderItemGiftItem") itemList = getPromotionBenefitItems(promotionItem.promotion, itemResources, {
			merchantId,
			orderType: currentOrder.orderType
		});
		else {
			if (itemFilterType === "all" || !itemFilterType || itemFilterType === "exclude" && condition?.itemFilter?.source !== "itemCenter" && !scopePromotionItemFilter(condition.itemFilter, { merchantId })?.value?.length) {
				if (onClose) onClose();
				if (goOrder) goOrder();
				return;
			}
			itemList = makeUpPromotionAddOnItem({
				promotionRule: promotionItem,
				itemResources,
				orderType: currentOrder.orderType
			});
		}
		if (!itemList?.length) {
			toast_default.info(t("noValidItem"));
			return;
		}
		drawerRequestRef.current += 1;
		setDrawerState({
			visible: true,
			promotion: {
				...promotionItem,
				itemList
			},
			max: itemList[0]?.quantityLimit || 9999,
			type: GIFT_PROMOTION_TYPE.includes(type) ? "addon" : "reward"
		});
		return true;
	}, [
		itemResources,
		currentOrder?.orderType,
		merchantId,
		onClose,
		goOrder,
		t,
		memberCRMInfo
	]);
	const handleSelectGiftReward = (0, import_react.useCallback)((promotionItem) => {
		const { recommendType, orderItemList, promotion, extraInfo, selectQuantity } = promotionItem;
		if (RECOMMEND_SUCCESS_TYPE.includes(recommendType)) {
			const rewardItemPool = promotion.type === "amountGiftItem" ? extraInfo?.currentGiftItemList || orderItemList : orderItemList;
			if (!rewardItemPool?.length) return toast_default.info(t("no-promotion-reward-pool"));
			const itemList = getGiftPromotionRewardItems({
				itemResources: getPromotionBenefitItems(promotion, itemResources, {
					merchantId,
					orderType: currentOrder?.orderType
				}, true),
				orderItemList: rewardItemPool,
				orderType: currentOrder?.orderType
			});
			if (!itemList.length) {
				toast_default.info(t("no-promotion-reward-pool"));
				return false;
			}
			drawerRequestRef.current += 1;
			setDrawerState({
				visible: true,
				promotion: {
					...promotionItem,
					itemList
				},
				max: promotion.type === "orderItemGiftItem" ? selectQuantity : extraInfo?.currentSelectQuantity,
				type: "reward",
				showHiddenItems: true
			});
			return true;
		}
	}, [
		itemResources,
		currentOrder?.orderType,
		merchantId,
		onClose,
		goOrder,
		orderListItems,
		t
	]);
	const handleAddonItemFromGiftPromotion = (0, import_react.useCallback)(async (items) => {
		const rewardItems = orderListItems.filter((e) => e.manualSelectRewardDiscount);
		const allItems = [...items, ...rewardItems];
		const { promotion: rule } = addOnPromotion;
		const requestId = drawerRequestRef.current;
		const pricingContext = getMemberPricingContext(native_store_default.getState());
		const orderAtValidation = native_store_default.getState().currentOrder.itemList;
		const res = await checkIsItemPromotionValid({
			rules: promotionCenterList,
			promotionCenterMetas,
			allItems
		});
		if (requestId !== drawerRequestRef.current || getMemberPricingContext(native_store_default.getState()) !== pricingContext || native_store_default.getState().currentOrder.itemList !== orderAtValidation) return false;
		let newItemValidPromotion = [];
		const currentRule = res.filter((item) => item?.validateInfo?.result?.nodeId === rule?.id);
		if (currentRule?.length === 1) {
			const currentRuleInfo = currentRule[0];
			const { recommendType, promotion, selectQuantity } = currentRuleInfo;
			if (RECOMMEND_SUCCESS_TYPE.includes(recommendType)) {
				if (itemValidPromotion) newItemValidPromotion = itemValidPromotion.map((each) => {
					return each.promotion.id === promotion.id ? {
						...currentRuleInfo,
						isSelected: each.isSelected || false
					} : { ...each };
				});
				else newItemValidPromotion = [{
					...currentRuleInfo,
					isSelected: false
				}];
				dispatch(addCampaignItemsToOrder(items));
				dispatch(setItemValidPromotion(newItemValidPromotion));
				if (isGiftPromotionAutoOpenRewardModal) {
					if (items?.filter((e) => e.manualSelectRewardDiscount)?.reduce((acc, item) => {
						return acc + item.quantity || 0;
					}, 0) < selectQuantity) handleSelectGiftReward(currentRuleInfo);
					return false;
				}
				handleCloseDrawer();
				return true;
			}
			newItemValidPromotion = makeUpItemValidPromotion({
				currentRuleInfo,
				itemValidPromotion,
				isCurrentSelected: false
			});
			dispatch(addCampaignItemsToOrder(items));
			dispatch(setItemValidPromotion(newItemValidPromotion));
			toast_default.info(t("notReachThreshold"));
			handleCloseDrawer();
			return false;
		}
		toast_default.info(t("notValidPromotion"));
		handleCloseDrawer();
		return false;
	}, [
		addOnPromotion,
		promotionCenterMetas,
		itemValidPromotion,
		dispatch,
		handleCloseDrawer,
		t,
		isGiftPromotionAutoOpenRewardModal,
		handleSelectGiftReward,
		orderListItems,
		promotionCenterList
	]);
	const handleConfirmGiftReward = (0, import_react.useCallback)(async (items) => {
		const { promotion: rule } = addOnPromotion;
		const manualSelectRewardItems = items.map((item) => ({
			...item,
			manualSelectRewardDiscount: [{
				extraInfo: { isUserSelected: true },
				isReward: true,
				id: rule.id,
				amount: 0,
				type: "promotion"
			}]
		}));
		const allItems = [...orderListItems.filter((e) => !e.manualSelectRewardDiscount), ...manualSelectRewardItems];
		if (getMemberActivityState(native_store_default.getState(), { itemList: manualSelectRewardItems }).currentOrder.itemList?.reduce((acc, item) => {
			return Big(acc).plus(Big(getItemPrice(item)).times(item.quantity));
		}, 0)?.toNumber() === 0) {
			toast_default.info(t("no-reward-zero-price-item"));
			return false;
		}
		const requestId = drawerRequestRef.current;
		const pricingContext = getMemberPricingContext(native_store_default.getState());
		const orderAtValidation = native_store_default.getState().currentOrder.itemList;
		const res = await checkIsItemPromotionValid({
			rules: promotionCenterList,
			promotionCenterMetas,
			allItems
		});
		if (requestId !== drawerRequestRef.current || getMemberPricingContext(native_store_default.getState()) !== pricingContext || native_store_default.getState().currentOrder.itemList !== orderAtValidation) return false;
		const currentRule = res.filter((item) => item?.validateInfo?.result?.nodeId === rule?.id);
		if (currentRule?.length === 1) {
			const currentRuleInfo = currentRule[0];
			const { validateInfo } = currentRuleInfo;
			const isRuleValid = checkIsRuleValid(validateInfo);
			let newItemValidPromotion = [];
			if (isRuleValid) {
				newItemValidPromotion = makeUpItemValidPromotion({
					currentRuleInfo,
					itemValidPromotion,
					isCurrentSelected: true
				});
				dispatch(addCampaignItemsToOrder(allItems));
				dispatch(setItemValidPromotion(newItemValidPromotion));
				handleCloseDrawer();
				return true;
			}
			toast_default.info(t("notReachThreshold"));
			return false;
		}
		toast_default.info(t("notValidPromotion"));
		handleCloseDrawer();
		return false;
	}, [
		addOnPromotion,
		promotionCenterMetas,
		itemValidPromotion,
		dispatch,
		handleCloseDrawer,
		t,
		orderListItems,
		promotionCenterList
	]);
	/**
	* 非满赠，买赠的凑单确认
	* @param {Array} items - 选中的商品列表
	* @returns {Promise<boolean>} 是否成功
	*/
	const handleSelectRewardItem = (0, import_react.useCallback)(async (items) => {
		const { promotion: rule } = addOnPromotion;
		const allItems = rule.type === "orderItemFixedPrice" ? [...removeSelectedPromotionRewardItems(orderListItems, [rule]), ...items.map((item) => ({
			...item,
			promotionSelectionId: rule.id
		}))] : items;
		if (items?.reduce((acc, item) => {
			return Big(acc).plus(Big(getItemPrice(item)).times(item.quantity));
		}, 0)?.toNumber() === 0) {
			toast_default.info(t("no-reward-zero-price-item"));
			return false;
		}
		const requestId = drawerRequestRef.current;
		const pricingContext = getMemberPricingContext(native_store_default.getState());
		const orderAtValidation = native_store_default.getState().currentOrder.itemList;
		const res = await checkIsItemPromotionValid({
			rules: promotionCenterList,
			promotionCenterMetas,
			allItems
		});
		if (requestId !== drawerRequestRef.current || getMemberPricingContext(native_store_default.getState()) !== pricingContext || native_store_default.getState().currentOrder.itemList !== orderAtValidation) return false;
		const currentRule = res.filter((item) => item?.validateInfo?.result?.nodeId === rule?.id);
		if (currentRule?.length === 1) {
			const currentRuleInfo = currentRule[0];
			const { validateInfo, promotion } = currentRuleInfo;
			const isRuleValid = checkIsRuleValid(validateInfo);
			let newItemValidPromotion = [];
			if (isRuleValid) {
				newItemValidPromotion = makeUpItemValidPromotion({
					currentRuleInfo,
					itemValidPromotion,
					isCurrentSelected: true
				});
				dispatch(addCampaignItemsToOrder(allItems));
				dispatch(setItemValidPromotion(newItemValidPromotion));
				handleCloseDrawer();
				return true;
			}
			newItemValidPromotion = makeUpItemValidPromotion({
				currentRuleInfo,
				itemValidPromotion,
				isCurrentSelected: false
			});
			dispatch(addCampaignItemsToOrder(allItems));
			dispatch(setItemValidPromotion(newItemValidPromotion));
			toast_default.info(t("notReachThreshold"));
			handleCloseDrawer();
			return false;
		}
		toast_default.info(t("notValidPromotion"));
		handleCloseDrawer();
		return false;
	}, [
		addOnPromotion,
		promotionCenterMetas,
		itemValidPromotion,
		dispatch,
		handleCloseDrawer,
		t,
		promotionCenterList,
		orderListItems
	]);
	const handleDrawerConfirm = (0, import_react.useCallback)(async (items) => {
		const { promotion: { type } } = addOnPromotion;
		if (!GIFT_PROMOTION_TYPE.includes(type)) return await handleSelectRewardItem(items);
		return drawerType === "addon" ? await handleAddonItemFromGiftPromotion(items) : await handleConfirmGiftReward(items);
	}, [
		addOnPromotion,
		handleSelectRewardItem,
		handleConfirmGiftReward,
		handleAddonItemFromGiftPromotion,
		drawerType
	]);
	const handleSkipRewardPromotion = () => {
		const activity = addOnPromotion?.promotion;
		if (!activity) return;
		dispatch(setIsPauseAutoValidatePromotion(true));
		const remainingItems = removeSelectedPromotionRewardItems(currentOrder.itemList, [activity]);
		if (remainingItems.length !== currentOrder.itemList.length || remainingItems.some((item, index) => item !== currentOrder.itemList[index])) dispatch(addCampaignItemsToOrder(remainingItems));
		dispatch(setItemValidPromotion((itemValidPromotion || []).map((each) => each.promotion.id === activity.id ? {
			...each,
			isSelected: false
		} : each)));
		handleCloseDrawer();
		onSkip?.();
	};
	return {
		drawerProps: {
			open: addOnItemDrawerVisible,
			displayName: getPromotionCenterActivityRuleText({
				t,
				activityRule: addOnPromotion?.promotion?.activityRule,
				type: addOnPromotion?.promotion?.type,
				promotionName: addOnPromotion?.promotion?.promotionName,
				selfConfig,
				promoCenterHitActivity: addOnPromotion
			}),
			activityInfo: addOnPromotion?.promotion,
			itemList: addOnPromotion?.itemList || [],
			value,
			promotionBaseItems,
			max: addOnPromotionMax,
			drawerType,
			showHiddenItems: drawerState.showHiddenItems,
			onSkip: drawerType === "reward" && ITEM_SELECTION_PROMOTION_TYPES.includes(addOnPromotion?.promotion?.type) ? handleSkipRewardPromotion : void 0
		},
		goAddOnPromotion,
		handleCloseDrawer,
		handleDrawerConfirm,
		handleSelectGiftReward
	};
};
//#endregion
export { isSameItems as a, handleCheckOrderPromotion as i, getSingleAutoApplicableFixedPricePromotion as n, useCloseModalOnHomePage as o, getSingleItemSelectionPromotion as r, useAddOnPromotion as t };
