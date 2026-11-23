const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./kioskConfigApi-C6DnSyFk.js","./kioskConfigApi-68IKDHob.js","./toast-C8a1ReSo.js","./toast-oEOJ74Oh.css","./utils-Cdx9DbDR.js","./native-store-B_9Z_F59.js","./actions-eeOD9syp.js","./actions-BwRPwnFF.js","./native-i18n-Bya1piKW.js","./i18nInstance-DFZX1Hui.js"])))=>i.map(i=>d[i]);
import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { V as __vitePreload } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { Ci as getExchangePurchaseDisplayPrices, Ei as getSatisfiedExchangePurchaseRules, Go as REMOVE_MEMBERSHIP_CARD, Jr as isHasCRMCampaignFn, Qi as Big, Qr as checkIsGiftPromotionValid, Vi as hasActiveMemberPrivilege, Xi as v4, Zi as getItemPrice, Zr as checkIsFixedPriceSelectItems, ca as findMembershipProduct, da as require_cloneDeep, la as getOrderItemCategory, mi as getMemberCheckoutState, mr as getDishItemLanguage, qi as GIFT_PROMOTION_TYPE, sa as buildMembershipCard, ti as checkIsRuleValid, ua as isMembershipCard } from "./actions-BwRPwnFF.js";
import { t as native_i18n_default } from "./native-i18n-Bya1piKW.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { l as RefIcon } from "./ContextIsolator-Dvyg17xX.js";
import { n as ItemsDrawer_default, t as useCrmPromotionContrary } from "./useCrmPromotionContrary-DFA1wQZz.js";
import { o as useCloseModalOnHomePage, r as getSingleItemSelectionPromotion, t as useAddOnPromotion } from "./hooks-DiifsOH5.js";
import { n as getValidCategoryList } from "./getStandardCateDish-BKfAMpZF.js";
import { l as setIsPauseAutoValidatePromotion, u as setItemValidPromotion } from "./promotion-BUTvAW3c.js";
import { n as getPromotionCenterActivityRuleText } from "./getPromotionCenterDisplayText-Bfjuriuq.js";
import { t as require_isEqual } from "./isEqual-PfNrN1Me.js";
import { t as require_omit } from "./omit-DznhFjWg.js";
import { t as promotion_tag_default } from "./promotion-tag-B_BQp28s.js";
//#region source-snapshot/src/assets/images/right_sign.png
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var right_sign_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHcAAABeCAYAAAAZmot0AAAACXBIWXMAACE4AAAhOAFFljFgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMtSURBVHgB7dzbbdwwEIVhygWkgnSQdoIUElcVwAUESB2BCwjcQBpY89iivavVhaR4mRmeHyAMwy+SPqzXXonjHGOsX5fL5Ytj9vKwj349+/XNMTvNsC/zIrCVFrBZwJNj4gKs//Jz48f//fo+TdNfdxBxhXUAG4oCJq6gImFDh8DEFVIibGgXmLgCyoQNbQITt3MnYUOrwMTtWCHY0B0wcTtVGDZ0A0zcDlWCDX0AE7dxlWFD78CONasRbOgfcRvVGJav3FZ1geV7bv16weIb4lasJywibqV6wyLiVkgCLCJu4aTAIuIWTBIsIm6hpMEi4hZIIiwi7smkwiLinkgyLCJuZtJhEXEz0gCLiJuYFlhE3IQ0wSLiRqYNFhE3Io2wiLgHaYVFxN1JMywi7kbaYRFxV7IAi4i7yAosIu5VlmARceeswaIHlxHmIvn1ZGW6ikVYlPzKnQdePfkF2GYHWiursCgJdwEbUgtsGRZF427AhtQBW4dFUbgHsCE1wCPAokPcSNiQeOBRYNEubiJsSCzwSLBoEzcTNiQOeDRYtIp7EjYkBnhEWHSHWwg21P1ER4VFN7iFYUPdTnhkWPSBWwk21PzER4dFb7iVYUPNLgBh35tm2D9+fXX1q34hCPvZgz8wHOAv16a33xC17iYR9rbr91xclEfXpuIXhrD3Lf9aVglM2PXW/s9VBUzY7bY+oVIBTNj99j5bFg1M2OOO7gqJBCZsXDH3c0UBEza+2CcxRAATNq2UZ6i6AhM2vdSnH7sAEzavnOeWWwP/9uuHa5MZWJS1naQxcKtMwaLsvULGgM3BolMbwYwAm4RFp3f5KQc2C4uKbOFUCmwaFhXbn6sM2DwsKrr5WgnwELCo+M564cDDwKIqYxOEAg8Fi6rNxBAGPBwsqjrwRAjwkLCo+jSbzsDDwqImo4o6AQ8Ni5rNodL+XLTGmg4ZawRM2LnmE+QqAxP2qi7jASsBE3ZRt9mPhYEJu1LXwZ6FgAm7UfeprSeBCbuTiJG8mcCEPUjMvOVEYMJGJGqYdiQwYSMTNyn9AJiw2gOwXy+L9XwxMpl9+BbAhLXWDEzYzF4B/1cNH6bO2mIAAAAASUVORK5CYII=";
var ItemPromotionModal_module_default = {
	itemPromotionCenter: "itemPromotionCenter___Ha2iZ",
	closeIcon: "closeIcon___cMMbg",
	item_promotion_header: "item_promotion_header___4T-yN",
	item_promotion_content: "item_promotion_content___tCvsf",
	item_promotion_item: "item_promotion_item___g3ssS",
	item_promotion_selected: "item_promotion_selected___Zd-aF",
	goAddItem: "goAddItem___GafvU",
	item_promotion_disabled: "item_promotion_disabled___4hj08",
	item_promotion_valid: "item_promotion_valid___qUIlO",
	item_promotion_info: "item_promotion_info___nrNTJ",
	item_promotion_tag: "item_promotion_tag___781Hn",
	item_promotion_title: "item_promotion_title___Bkim6",
	item_promotion_name: "item_promotion_name___AzTwy",
	item_promotion_invalidReason: "item_promotion_invalidReason___dYyqX",
	discountNumber: "discountNumber___WAyvL",
	item_promotion_type: "item_promotion_type___Dz2-0",
	item_promotion_type_invalid: "item_promotion_type_invalid___nnIyE",
	item_promotion_footer: "item_promotion_footer___6Nrd-"
};
//#endregion
//#region source-snapshot/src/utils/promotionSelection.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_isEqual = /* @__PURE__ */ __toESM(require_isEqual());
var import_omit = /* @__PURE__ */ __toESM(require_omit());
var PROMOTION_ITEM_IDENTITY_FIELDS = [
	"quantity",
	"sequence",
	"totalAmount",
	"totalPrice"
];
var mergeIdenticalPromotionItems = (items = []) => items.reduce((result, item) => {
	const comparableItem = (0, import_omit.default)(item, PROMOTION_ITEM_IDENTITY_FIELDS);
	const existingItem = result.find((candidate) => (0, import_isEqual.default)((0, import_omit.default)(candidate, PROMOTION_ITEM_IDENTITY_FIELDS), comparableItem));
	if (!existingItem) {
		result.push({ ...item });
		return result;
	}
	existingItem.quantity = Number(existingItem.quantity || 0) + Number(item.quantity || 0);
	if ("totalAmount" in existingItem || "totalAmount" in item) existingItem.totalAmount = Number(existingItem.totalAmount || 0) + Number(item.totalAmount || 0);
	return result;
}, []);
//#endregion
//#region source-snapshot/src/container/orderReview/components/PromotionItems.js
var import_jsx_runtime = require_jsx_runtime();
var getVariantDescription = (item, language) => {
	const details = [];
	(item.sectionDetail || []).forEach((section) => {
		if (section.sizeInfo) details.push(section.sizeInfo.size || section.sizeInfo.name || "");
		(section.options || []).forEach((option) => {
			details.push(getDishItemLanguage(option.fieldDisplayNameGroups, language) || option.name);
		});
		(section.items || []).forEach((sectionItem) => {
			const itemDetails = [getDishItemLanguage(sectionItem.fieldDisplayNameGroups, language) || sectionItem.name];
			(sectionItem.selectedOptionList || []).forEach((optionSection) => {
				if (optionSection.sizeInfo) itemDetails.push(optionSection.sizeInfo.size || optionSection.sizeInfo.name || "");
				(optionSection.options || []).forEach((option) => {
					itemDetails.push(getDishItemLanguage(option.fieldDisplayNameGroups, language) || option.name);
				});
			});
			details.push(itemDetails.filter(Boolean).join(": "));
		});
	});
	return details.filter(Boolean).join(", ");
};
var getPromotionItemsByRule = (rule, categoryList = []) => {
	const { activityRule, id: ruleId, promotionInfo } = rule || {};
	const giftsDishes = activityRule?.giftsDishes || [];
	return categoryList.flatMap((category) => (category.saleItems || []).map((item) => ({
		...item,
		categoryId: item.categoryId ?? category.id
	}))).filter((item) => giftsDishes.includes(item?.id)).map((item) => ({
		...(0, import_cloneDeep.default)(item),
		ruleId,
		promotionInfo,
		promotionItem: true
	}));
};
var PromotionItems = ({ onClose, satisfyRules = [], categoryList = [], alreadySelectedPromotion = [], exchangePurchase = false, currentOrder, showSkip = false, open = true }) => {
	const { t } = useTranslation();
	const activeRule = (0, import_react.useMemo)(() => {
		const selectedRuleId = alreadySelectedPromotion?.[0]?.ruleId;
		return satisfyRules.find((rule) => rule.id === selectedRuleId) || satisfyRules[0];
	}, [alreadySelectedPromotion, satisfyRules]);
	const itemList = (0, import_react.useMemo)(() => {
		if (!activeRule) return [];
		return getPromotionItemsByRule(activeRule, categoryList).map((item) => {
			if (!exchangePurchase) return {
				...item,
				specialPrice: 0
			};
			const prices = getExchangePurchaseDisplayPrices({
				item,
				rule: activeRule,
				currentOrder,
				categoryList
			});
			return {
				...item,
				exchangePurchaseOriginalPrice: Number(prices.originalPrice),
				specialPrice: Number(prices.discountedPrice),
				isLocalExchangePurchaseItem: true,
				exchangePurchaseRuleId: activeRule.id,
				exchangePurchaseRule: activeRule
			};
		});
	}, [
		activeRule,
		categoryList,
		currentOrder,
		exchangePurchase
	]);
	const value = (0, import_react.useMemo)(() => {
		if (!activeRule) return [];
		return (alreadySelectedPromotion.find((promotion) => promotion.ruleId === activeRule.id)?.items || []).map((item) => ({
			...item,
			uniqueItemTempId: item.uniqueItemTempId || v4()
		}));
	}, [activeRule, alreadySelectedPromotion]);
	const handleItemChange = (0, import_react.useCallback)((item, { tempValue }) => {
		if (activeRule?.activityRule?.giftsType === "identical" && tempValue.length > 0 && !tempValue.some((selectedItem) => selectedItem.id === item.id)) {
			toast_default.info(t("select-same-item"));
			return false;
		}
		return true;
	}, [activeRule, t]);
	const handleConfirm = (0, import_react.useCallback)(async (items) => {
		if (!activeRule) return false;
		const normalizedItems = items.map((item) => {
			const normalizedItem = {
				...item,
				ruleId: activeRule.id,
				sequence: item.sequence || item.uniqueItemTempId || v4()
			};
			delete normalizedItem.specialPrice;
			delete normalizedItem.exchangePurchaseOriginalPrice;
			delete normalizedItem.uniqueItemTempId;
			if (!exchangePurchase && activeRule.isOrderGift) normalizedItem.price = 0;
			return normalizedItem;
		});
		onClose?.([{
			ruleId: activeRule.id,
			items: mergeIdenticalPromotionItems(normalizedItems)
		}]);
		return false;
	}, [
		activeRule,
		exchangePurchase,
		onClose
	]);
	const handleDrawerClose = (0, import_react.useCallback)(() => {
		onClose?.(alreadySelectedPromotion.length ? alreadySelectedPromotion : false);
	}, [alreadySelectedPromotion, onClose]);
	const handleSkip = (0, import_react.useCallback)(() => {
		onClose?.({ skipped: true });
	}, [onClose]);
	if (!activeRule) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemsDrawer_default, {
		open,
		displayName: t(exchangePurchase ? "exchangePurchaseAvailable" : "achieveStandard"),
		activityInfo: {
			type: exchangePurchase ? "localExchangePurchase" : "localBuyGift",
			activityRule: [activeRule.activityRule || {}]
		},
		itemList,
		value,
		max: Number(activeRule.activityRule?.giftsNumber || 1),
		drawerType: "reward",
		isPromotionSelection: true,
		excludePromotionRuleId: !exchangePurchase ? activeRule.id : void 0,
		isExchangePurchase: exchangePurchase,
		showHiddenItems: true,
		onItemChange: handleItemChange,
		onSkip: showSkip ? handleSkip : void 0,
		onClose: handleDrawerClose,
		handleConfirm
	});
};
//#endregion
//#region source-snapshot/src/component/CloudPromotionCenter/ItemPromotionModal.js
var ItemPromotionModal = (props) => {
	const { t, visible, onClose, onSkip, onConfirm, goOrder, promotion: { itemValidPromotion, promotionCode, promotionCenterList }, crm: { selectedDiscount, selectedFreeItem, tempCampaign }, currentOrder, setItemValidPromotion, selfConfig, localPromotionOptions = [], onConfirmLocalPromotion, menuGroup, autoOpenItems = false, skipOnKeepCampaign = false, setIsPauseAutoValidatePromotion } = props;
	useCloseModalOnHomePage(onClose);
	const [tempPromotion, setTempPromotion] = (0, import_react.useState)(null);
	const [selectedLocalPromotion, setSelectedLocalPromotion] = (0, import_react.useState)(null);
	const autoOpenedRef = (0, import_react.useRef)(false);
	const [autoOpenFailed, setAutoOpenFailed] = (0, import_react.useState)(false);
	const localPromotionCategoryList = (0, import_react.useMemo)(() => {
		return getValidCategoryList(menuGroup || [], currentOrder.orderType, false).filter((group) => !group.isFreeItemMenu && group.id !== "promotion-deals-list");
	}, [currentOrder.orderType, menuGroup]);
	const { drawerProps, handleDrawerConfirm, handleCloseDrawer, goAddOnPromotion, handleSelectGiftReward } = useAddOnPromotion({
		onSkip,
		onClose,
		goOrder,
		promotionCenterList
	});
	(0, import_react.useEffect)(() => {
		const isAlreadySelected = itemValidPromotion?.find((each) => each.isSelected);
		setTempPromotion((previous) => isAlreadySelected || itemValidPromotion?.find((item) => item.promotion.id === previous?.promotion.id) || null);
	}, [itemValidPromotion]);
	const handleSkip = () => {
		setIsPauseAutoValidatePromotion(true);
		setItemValidPromotion((itemValidPromotion || []).map((each) => ({
			...each,
			isSelected: void 0
		})));
		onSkip();
	};
	const { handleCheckIsHasCampaign } = useCrmPromotionContrary({ onKeepCampaign: skipOnKeepCampaign ? () => {
		handleCloseDrawer();
		handleSkip();
	} : void 0 });
	const handleConfirm = () => {
		if (!tempPromotion) return toast_default.info(t("choose-a-activity"));
		onConfirm(tempPromotion);
		onClose();
	};
	const handleLocalPromotionResult = (result) => {
		if (!Array.isArray(result)) {
			setSelectedLocalPromotion(null);
			return;
		}
		if (!result.some((promotion) => promotion.items?.length > 0)) {
			setSelectedLocalPromotion(null);
			onClose();
			return;
		}
		onConfirmLocalPromotion?.({
			...selectedLocalPromotion,
			selection: result
		});
		setSelectedLocalPromotion(null);
		onClose();
	};
	const { validPromotion, invalidPromotion } = (0, import_react.useMemo)(() => {
		const beforeSortValidPromotion = [];
		const invalidPromotion = [];
		itemValidPromotion?.forEach((each) => {
			const { validateInfo, promotion, recommendType } = each;
			const isRuleValid = checkIsRuleValid(validateInfo);
			const isGiftPromotionValid = checkIsGiftPromotionValid({
				promotion,
				recommendType
			});
			const isFixedPriceSelectItems = checkIsFixedPriceSelectItems(each);
			const promotionCodes = promotion?.promotionCodes;
			if (promotionCodes?.length && (!promotionCode || !promotionCodes.includes(promotionCode))) return;
			if (isRuleValid || isGiftPromotionValid || isFixedPriceSelectItems) {
				const discountAmount = validateInfo?.result?.result?.discounts?.[0]?.amount || 0;
				const promotionDiscountValue = Number(discountAmount).toFixed(2);
				beforeSortValidPromotion.push({
					...each,
					available: true,
					promotionDiscountValue,
					clickable: isGiftPromotionValid || isFixedPriceSelectItems || discountAmount !== 0
				});
			} else invalidPromotion.push({
				...each,
				available: false,
				clickable: true
			});
		});
		return {
			validPromotion: beforeSortValidPromotion.sort((a, b) => b.promotionDiscountValue - a.promotionDiscountValue),
			invalidPromotion
		};
	}, [itemValidPromotion, promotionCode]);
	const handleClickPromotionItem = (each) => {
		if (!each.available || !each.clickable) return;
		setTempPromotion(each);
	};
	const isHasCrmCampaign = (0, import_react.useMemo)(() => {
		return isHasCRMCampaignFn({
			itemList: currentOrder.itemList,
			selectedFreeItem,
			selectedDiscount
		}) || tempCampaign?.length > 0;
	}, [
		currentOrder.itemList,
		selectedFreeItem,
		selectedDiscount,
		tempCampaign
	]);
	const directItemSelection = autoOpenItems && !autoOpenFailed && !isHasCrmCampaign;
	(0, import_react.useEffect)(() => {
		if (!directItemSelection || autoOpenedRef.current) return;
		autoOpenedRef.current = true;
		const activity = getSingleItemSelectionPromotion(itemValidPromotion, promotionCode);
		if (!(activity && (GIFT_PROMOTION_TYPE.includes(activity.promotion.type) ? handleSelectGiftReward(activity) : goAddOnPromotion(activity, true)))) setAutoOpenFailed(true);
	}, [
		directItemSelection,
		itemValidPromotion,
		promotionCode,
		handleSelectGiftReward,
		goAddOnPromotion
	]);
	const handleConfirmDrawer = async (items) => {
		const success = await handleDrawerConfirm(items);
		if (success && directItemSelection) onSkip();
		return success;
	};
	const handleCloseItemsDrawer = () => {
		handleCloseDrawer();
		if (directItemSelection) onClose();
	};
	(0, import_react.useEffect)(() => {
		if (validPromotion?.length !== 1 || isHasCrmCampaign) return;
		if (!GIFT_PROMOTION_TYPE.includes(validPromotion[0]?.promotion?.type) && !checkIsFixedPriceSelectItems(validPromotion[0])) setTempPromotion(validPromotion[0]);
	}, [validPromotion, isHasCrmCampaign]);
	const isHasValidPromotion = (0, import_react.useMemo)(() => {
		return validPromotion?.length > 0;
	}, [validPromotion]);
	const renderPromotionItem = (each) => {
		const isSelected = tempPromotion?.promotion.id === each.promotion.id;
		const isAvailable = each.available;
		const isGiftPromotion = GIFT_PROMOTION_TYPE.includes(each.promotion.type);
		const isFixedPriceSelectItems = checkIsFixedPriceSelectItems(each);
		const isShowDiscountVal = !isGiftPromotion && !isFixedPriceSelectItems && isAvailable;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: (0, import_classnames.default)(ItemPromotionModal_module_default.item_promotion_item, isSelected && ItemPromotionModal_module_default.item_promotion_selected, !each.clickable && ItemPromotionModal_module_default.item_promotion_disabled, isAvailable && ItemPromotionModal_module_default.item_promotion_valid),
			onClick: () => {
				if (!isAvailable) return goAddOnPromotion(each);
				if (!isGiftPromotion) {
					if (handleCheckIsHasCampaign()) return;
					if (isFixedPriceSelectItems) return goAddOnPromotion(each);
					return handleClickPromotionItem(each);
				}
				return handleSelectGiftReward(each);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: ItemPromotionModal_module_default.item_promotion_info,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: ItemPromotionModal_module_default.item_promotion_tag,
						src: isSelected ? right_sign_default : promotion_tag_default,
						alt: "promotionTag"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ItemPromotionModal_module_default.item_promotion_title,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ItemPromotionModal_module_default.item_promotion_name,
							children: getPromotionCenterActivityRuleText({
								t,
								activityRule: each.promotion?.activityRule,
								type: each.promotion?.type,
								promotionName: each.promotion?.promotionName,
								selfConfig,
								promoCenterHitActivity: each
							})
						}), !isAvailable && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ItemPromotionModal_module_default.item_promotion_invalidReason,
							children: renderInvalidReason(each)
						})]
					})]
				}),
				!isAvailable && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: ItemPromotionModal_module_default.goAddItem,
					children: t("goAddItem")
				}),
				isShowDiscountVal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: ItemPromotionModal_module_default.discountNumber,
					children: ["-$", each.promotionDiscountValue]
				}),
				isAvailable && isGiftPromotion && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: ItemPromotionModal_module_default.goAddItem,
					children: t("selectGift")
				}),
				isAvailable && isFixedPriceSelectItems && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: ItemPromotionModal_module_default.goAddItem,
					children: t("special_item_select")
				})
			]
		}, each.promotion.id);
	};
	const renderLocalPromotionItem = (each) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `${ItemPromotionModal_module_default.item_promotion_item} ${ItemPromotionModal_module_default.item_promotion_valid}`,
		onClick: () => setSelectedLocalPromotion(each),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: ItemPromotionModal_module_default.item_promotion_info,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				className: ItemPromotionModal_module_default.item_promotion_tag,
				src: promotion_tag_default,
				alt: "promotionTag"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: ItemPromotionModal_module_default.item_promotion_title,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: ItemPromotionModal_module_default.item_promotion_name,
					children: each.displayName
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: ItemPromotionModal_module_default.goAddItem,
			children: t(each.kind === "exchangePurchase" ? "exchange" : "selectGift")
		})]
	}, `${each.kind}-${each.rule.id}`);
	const renderInvalidReason = (each) => {
		const { promotion: { type }, recommendType, discountRate, benefitAmount, selectQuantity, selectDiscountRate } = each;
		const targetCount = type === "totalAmountQuantityDiscount" && recommendType === "QUANTITY_TO_DISCOUNT" || type === "quantityItemDiscount" ? each?.targetCount : each?.targetCount.toFixed(2);
		const discountValue = discountRate ? `${discountRate}%` : `$${benefitAmount}`;
		if (type === "totalAmountQuantityDiscount") {
			if (recommendType === "QUANTITY_TO_DISCOUNT") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("buyMoreAmountEnjoyDiscount", {
				targetCount,
				discountValue
			}) });
			if (recommendType === "AMOUNT_TO_DISCOUNT") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("buyMoreItemEnjoyDiscount", {
				targetCount,
				discountValue
			}) });
		}
		if (type === "quantityItemDiscount") {
			if (recommendType === "QUANTITY_TO_DISCOUNT") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("buyMoreItemEnjoyBundleDiscount", {
				targetCount,
				selectQuantity,
				discountValue: selectDiscountRate
			}) });
		}
		if (type === "orderItemFixedPrice") {
			if (recommendType === "AMOUNT_TO_DISCOUNT") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("buyMoreAmountEnjoySpecialItem", { targetCount }) });
		}
		if (GIFT_PROMOTION_TYPE.includes(type)) {
			if (recommendType === "AMOUNT_TO_DISCOUNT") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("buyMoreAmountEnjoyGiftItem", {
				targetCount,
				selectQuantity
			}) });
			if (recommendType === "QUANTITY_TO_DISCOUNT") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("buyMoreItemEnjoyGiftItem", {
				targetCount,
				selectQuantity
			}) });
		}
	};
	const beforeSelectItemCheck = () => {
		return !handleCheckIsHasCampaign();
	};
	const hasLocalPromotion = localPromotionOptions.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			visible: visible && !directItemSelection,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: ItemPromotionModal_module_default.itemPromotionCenter,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefIcon, {
						className: ItemPromotionModal_module_default.closeIcon,
						onClick: onClose
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
						className: ItemPromotionModal_module_default.item_promotion_header,
						children: t("chooseOneDeal")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ItemPromotionModal_module_default.item_promotion_content,
						children: [
							isHasValidPromotion && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: ItemPromotionModal_module_default.item_promotion_type,
								children: t("validPromotion")
							}), validPromotion?.map((each) => renderPromotionItem(each))] }),
							hasLocalPromotion && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [!isHasValidPromotion && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: ItemPromotionModal_module_default.item_promotion_type,
								children: t("validPromotion")
							}), localPromotionOptions.map(renderLocalPromotionItem)] }),
							invalidPromotion.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `${ItemPromotionModal_module_default.item_promotion_type} ${ItemPromotionModal_module_default.item_promotion_type_invalid}`,
								children: t("invalidPromotion")
							}), invalidPromotion?.map((each) => renderPromotionItem(each))] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ItemPromotionModal_module_default.item_promotion_footer,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							onClick: handleSkip,
							children: t("origin-price-buy")
						}), isHasValidPromotion && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							onClick: handleConfirm,
							className: "linear-animate-btn",
							children: t("confirm")
						})]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemsDrawer_default, {
			...drawerProps,
			onClose: handleCloseItemsDrawer,
			handleConfirm: handleConfirmDrawer,
			beforeSelectItemCheck
		}),
		selectedLocalPromotion && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromotionItems, {
			satisfyRules: [selectedLocalPromotion.rule],
			categoryList: localPromotionCategoryList,
			currentOrder,
			exchangePurchase: selectedLocalPromotion.kind === "exchangePurchase",
			onClose: handleLocalPromotionResult
		})
	] });
};
function mapStateToProps(state) {
	return {
		crm: state.crm,
		promotion: state.promotion,
		currentOrder: state.currentOrder,
		selfConfig: state.selfConfig,
		menuGroup: state.menuGroup
	};
}
var ItemPromotionModal_default = withRouter(connect(mapStateToProps, {
	setItemValidPromotion,
	setIsPauseAutoValidatePromotion
})(withTranslation()(ItemPromotionModal)));
//#endregion
//#region source-snapshot/src/actions/memberPurchase.js
var removeMembershipCard = () => (dispatch, getState) => {
	const { buyDiscountRule, isSkipPromotionCalculation } = getState().promotion;
	return dispatch({
		type: REMOVE_MEMBERSHIP_CARD,
		buyDiscountRule,
		isSkipPromotionCalculation
	});
};
var purchaseMembershipCard = () => async (dispatch, getState) => {
	const before = getState();
	const userId = before.crm.memberCRMInfo?.userId;
	if (!userId || before.crm.isHasBenefit !== true || hasActiveMemberPrivilege(before.crm)) return false;
	if (before.currentOrder.itemList.some(isMembershipCard)) return false;
	const [{ getMembershipMenu }, { addCombo2Order, addCampaignItemsToOrder }] = await Promise.all([__vitePreload(() => import("./kioskConfigApi-C6DnSyFk.js"), __vite__mapDeps([0,1,2,3,4,5]), import.meta.url), __vitePreload(() => import("./actions-eeOD9syp.js"), __vite__mapDeps([6,7,2,3,4,5,1,8,9]), import.meta.url)]);
	const response = await getMembershipMenu();
	const state = getState();
	if (state.crm.memberCRMInfo?.userId !== userId || state.currentOrder !== before.currentOrder || hasActiveMemberPrivilege(state.crm)) return false;
	const product = findMembershipProduct(response?.data?.menus);
	if (!product) throw new Error("Membership card product is unavailable");
	const added = dispatch(addCombo2Order(buildMembershipCard({
		...product,
		privilege: state.crm.privileges?.[0],
		userId
	})));
	if (!added) return added;
	const nextState = getState();
	const items = nextState.currentOrder.itemList;
	const exchangeItems = items.filter((item) => item.isLocalExchangePurchaseItem);
	if (!exchangeItems.length) return added;
	const normalItems = items.filter((item) => !item.isLocalExchangePurchaseItem);
	const orderAmount = Number(getMemberCheckoutState(nextState).currentOrder.itemList.filter((item) => !item.isLocalExchangePurchaseItem).filter((item) => getOrderItemCategory(nextState.currentCategoryList, item)?.applicableToTriggerPromotion).reduce((total, item) => Big(total).plus(Big(getItemPrice(item) || 0).times(item.quantity || 0)), Big(0)).toFixed(2));
	const satisfiedRuleIds = getSatisfiedExchangePurchaseRules(nextState.promotion.exchangePurchaseRule, normalItems, orderAmount).map((rule) => rule.id);
	if (exchangeItems.some((item) => !satisfiedRuleIds.includes(item.exchangePurchaseRuleId))) {
		dispatch(addCampaignItemsToOrder(normalItems));
		toast_default.info(native_i18n_default.t("exchangePurchaseInvalid"), "top");
	}
	return added;
};
//#endregion
//#region source-snapshot/src/utils/memberCartPrices.js
var getMemberPricedCartItems = (state) => {
	const items = state.currentOrder.itemList;
	const taggedState = {
		...state,
		currentOrder: {
			...state.currentOrder,
			itemList: items.map((item, index) => ({
				...item,
				memberPriceSourceIndex: index
			}))
		}
	};
	const pricedState = getMemberCheckoutState(taggedState);
	if (pricedState === taggedState) return items;
	const pricesBySource = /* @__PURE__ */ new Map();
	pricedState.currentOrder.itemList.forEach((item) => {
		const group = pricesBySource.get(item.memberPriceSourceIndex) || [];
		group.push(item);
		pricesBySource.set(item.memberPriceSourceIndex, group);
	});
	return items.map((item, index) => {
		const group = pricesBySource.get(index);
		if (!group?.length) return item;
		if (group.length === 1) return group[0];
		return {
			...group[0],
			memberCartDisplayTotal: group.reduce((total, row) => total.plus(Big(getItemPrice(row)).times(row.quantity).minus(row.discount || 0)), Big(0)).toFixed(2)
		};
	});
};
//#endregion
export { getVariantDescription as a, ItemPromotionModal_default as i, purchaseMembershipCard as n, right_sign_default as o, removeMembershipCard as r, getMemberPricedCartItems as t };
