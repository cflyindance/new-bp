import { d as __toESM } from "./toast-C8a1ReSo.js";
import { l as normalizeConfigList, p as solveScrollElem, t as compare } from "./utils-Cdx9DbDR.js";
import { n as combineReducers } from "./native-store-B_9Z_F59.js";
import { $a as CRM_REWARD_RULE, $c as TRIPOS_PAY_READY, $o as RESET_ITEM_LIST, $s as SET_ITEM_MATCH_CLOUD_PROMOTION, Aa as ADD_COMBO_TO_ORDER, Ac as SET_SELECTED_ECARD, Ao as MOBY_DEVICE_LINK_STATUS, As as SET_CLOUD_PROMOTION_LIST, Ba as CHANGE_DEFAULT_DISH, Bc as SET_THIRD_PARTY_COMMIT_ID, Bo as REMOVE_FROM_SECTION, Bs as SET_CUSTOMER_NAME, Cc as SET_PICKUP_TIME, Co as ITEM_SIZE_LIST, Cs as SET_BANNER, Dc as SET_SATISFY_RULES, Do as MENULOAD, Ds as SET_BUY_GIFTS_RULES, Ec as SET_PROMO_CODE, Eo as MARK_POST_PAYMENT_ACTION, Es as SET_BUY_GIFTS, Fa as APPEND_PAYMENT_TYPE_TRAIL, Fc as SET_SYSTEM_CONFIG, Fo as RECORD_KIOSK_DISCOUNT_PROMOTION, Fs as SET_CRM_CUSTOMER_INFO, Ga as CLEARDIYCOMBO, Gc as SPLICE_ALL_ITEMS, Go as REMOVE_MEMBERSHIP_CARD, Gs as SET_ECARD_LAST_QUERY, Ha as CHANGE_POSTER_STATUS, Hc as SIDENAVINDEX, Ho as REMOVE_ITEM_REWARD_INFO, Hs as SET_DOLLAR_PERCENTAGE_VOUCHERS, Ia as BRANDMENU, Ic as SET_TABLE_ID, Io as RECOUNT_CURRENT_ORDER_LIST, Is as SET_CRM_INTEGRATION_CUSTOMER_VOUCHERS, Ja as CLEAR_TOGO_OPTION, Jc as STANDARD_CATE_DISH, Jo as REMOVE_PROMOTION_DISCOUNT_ITEM, Js as SET_ECARD_SETTINGS, Ka as CLEAR_PAYMENT_TYPE_TRAIL, Kc as SPLICE_ORDER, Ko as REMOVE_ONE_ITEMS, Ks as SET_ECARD_LOADING, La as CHANGE_CHECK_FOOTER_VISIBLE, Lc as SET_TAX_INFO, Lo as REMOVEDIYCOMBO, Ls as SET_CRM_INTEGRATION_REWARD, Ma as ADD_TO_SECTION, Mc as SET_SHOW_BANNERPRO, Mo as ORDER_SEQUENCE, Ms as SET_COMMIT_ID, Na as ADD_TO_SECTION_BYID, Nc as SET_SHOW_LOGINGUIDEDIALOG, No as ORDER_TYPE, Ns as SET_CRM_AUTH_CODE_VERIFIED, Oa as ADD_CAMPAIGN_ITEMS_TO_ORDER, Oc as SET_SCREENSAVER, Oo as MENU_ITEM_LIST, Os as SET_CARD_RESULT, Pa as ALL_SET_SYSTEM_CONFIG, Pc as SET_SHOW_WAITING_TIME_MODAL, Po as PP_WS, Ps as SET_CRM_AUTH_CODE_VERIFIED_PHONE, Qa as CRM_PRIVILEGES, Qc as TRIPOS_PAY_FINISH, Qo as RESET_CURRENT_COMBO, Qs as SET_IS_PAUSE_AUTO_VALIDATE_PROMOTION, Ra as CHANGE_CLOUD_PROMOTION_STATUS, Rc as SET_TEMP_CAMPAIGN, Ro as REMOVEDIYOPTCOMBO, Rs as SET_CURRENT_BLOCK, Sc as SET_PAYMENT_MEMBER_POINTS_ESTIMATE, So as IS_SHOW_LOGIN_BAR, Ss as SET_AVAILABLE_ECARDS, Tc as SET_PROMOTION, To as MAKINGCUPNUM, Ts as SET_BUY_DISCOUNT_RULES, Ua as CHANGE_REWARD_MODAL_VISIBLE, Uc as SIDENAVLISTINFO, Uo as REMOVE_LOCAL_PROMOTION_REWARD_INFO, Us as SET_DOLLAR_VALUE_VOUCHERS, Va as CHANGE_FREE_ITEM, Vc as SET_TOGO_OPTION, Vo as REMOVE_ITEM_FROM_ORDER, Vs as SET_DISCOUNT, Wa as CHANGE_SKIP_PROMOTION_CALCULATION_STATUS, Wc as SPLICEORDERBYSOLDOUT, Wo as REMOVE_MANUAL_SELECT_REWARD_ITEM, Ws as SET_ECARD_CLOUD_GIFT_CARD_ITEM, Xa as CRM_EARN_RULE, Xc as TEMP_CURRENT_CATEGORY, Xo as REPLACEORREDUCEOLDCOMBO, Xs as SET_GIFT_CARD_PAYMENT_INFO, Ya as COMBO_MENU, Yc as SYSTEM_LICENSE, Yo as REMOVE_REWARD_ITEM_FROM_ORDER, Ys as SET_EXCHANGE_PURCHASE_RULES, Za as CRM_MEMBER_INFO, Zc as TEMP_ITEM_LIST, Zo as REPLACE_TO_ORDER, Zs as SET_IMG, _c as SET_ORDER_SEQUENCE, _o as ISMENUUPDATED, _s as SETTABELSERVICETYPE, ac as SET_LANMODALFN, ao as CURRENT_SALE_ITEMS, as as SAVE_TIP_AMOUNT, bc as SET_PAYMENT_ID, bi as handleResolveList, bo as IS_NEW_MEMBER, bs as SET_AESERT_LIST_STATUS, cc as SET_MEMBERSHIP, co as EDIT_DEFAULT_DISH, cs as SELF_CONFIG, da as require_cloneDeep, dc as SET_NETWORKTATUS, do as FETCH_LANGUAGE, dr as getComboItemDetailInfo, ds as SETISREORDERFLAG, ec as SET_ITEM_PRICE, eo as CURRENT_CATEGORY, es as RESET_ORDER, fc as SET_NUM_OF_GUESTS, fo as FETCH_MENUGROUP, fr as getComboSectionInfo, fs as SETKEYBOARDTOGGLE, gc as SET_ORDER_REWARD_ID, go as INIT_ORDER_SEQUENCE, gs as SETREQUIRECATEGORY, hc as SET_ORDER_NOTES, ho as IGNORE_REWARD, hs as SETORDERPAGEDOMTOP, ic as SET_LANMODAL, io as CURRENT_LANGUAGE, is as SAVE_PAYMENT_TYPE, ja as ADD_OPTION, jc as SET_SHOW_BANNER, jo as ONBOARD_GIFT_RULE, js as SET_CLOUD_PROMOTION_METAS, ka as ADD_COMBO_OPTION, kc as SET_SDK_META_DATA, ko as MOBY_DEVICE_INFO, ks as SET_CLOUD_PROMOTION, lc as SET_MERCHANT_CAMPAIGN_LIST, lo as EDIT_ORDER, ls as SETCATEYPAGEDOMTOP, mc as SET_ORDER_DISCOUNT, mo as FREE_ITEM_MENU_POSITION, ms as SETLOCATOR, nc as SET_ITEM_VOUCHERS, no as CURRENT_COMBO, ns as SAVESEARCHITEM, oc as SET_LOGO, oo as DEFAULT_CURRENT_COMBO, os as SEARCH_KEY_WORD, pc as SET_ORDER_CUSTOMER, po as FETCH_MERCHANT_PROFILE, ps as SETKIOSKCONFIGUSERID, qa as CLEAR_POST_PAYMENT_ACTIONS, qc as SPLICE_SINGLE_ITEMS, qo as REMOVE_ONE_OPTIONS, qs as SET_ECARD_QUICK_AMOUNTS, rc as SET_KIOSK_MENU_TREE, ro as CURRENT_ITEM, rs as SAVE_ORDER_RESULT, sc as SET_LOYALTY, so as DELETEALLBYID, ss as SELECTEDBRAND, tc as SET_ITEM_VALID_PROMOTION, to as CURRENT_CATEGORY_LIST, ts as RESET_PROMOTION, ua as isMembershipCard, uc as SET_NEED_COMMIT, uo as EXPEND_FREELIST, us as SETEDITCOMBOQTY, vc as SET_ORDER_STATUS, vo as IS_AUTHORIZATION_DISPLAY_NAME, vs as SETVLISTSCROLLHEIGHT, wc as SET_POSTER_DATA, wo as LOGIN_TYPE, ws as SET_BANNERPRO, xc as SET_PAYMENT_MEMBER_CARD_RECORD, xo as IS_ORDER_EDIT, xs as SET_ALL_MENU, yc as SET_ORIGINAL_ITEM_LIST, yo as IS_MEMBER_ORDERED_BEFORE, ys as SET_AD_OUTLET_INFO, za as CHANGE_CRM_PROMOTION_CONTRARY_INFO, zc as SET_TEMP_FREE_ITEM, zo as REMOVE_FREE_ITEM_IN_ORDER, zr as itemIsSoldOut, zs as SET_CURRENT_PAGE } from "./actions-BwRPwnFF.js";
import { t as selfConfigList } from "./selfConfig-DGGo01Xu.js";
import { t as require_isEqual } from "./isEqual-PfNrN1Me.js";
import { t as require_omit } from "./omit-DznhFjWg.js";
import { a as removeCRMCampaignItems } from "./resolveCRMRewardItem-Du3vuEgI.js";
import { t as setComboItemBasePrice } from "./setComboItemBasePrice-B4XHluz0.js";
//#region source-snapshot/src/constants/posterPro.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var ASPECT_RATIO = "9 / 16";
//#endregion
//#region source-snapshot/src/reducers/item.js
var initState$28 = {
	currentSaleItems: [],
	currentItem: {},
	menuItemList: {},
	itemSizeList: [],
	tempItemList: [],
	searchItem: []
};
function currentSaleItems(state = initState$28.currentSaleItems, action) {
	switch (action.type) {
		case CURRENT_SALE_ITEMS: return action.currentSaleItems;
		default: return state;
	}
}
function currentItem(state = initState$28.currentItem, action) {
	switch (action.type) {
		case CURRENT_ITEM: return action.currentItem;
		default: return state;
	}
}
function menuItemList(state = initState$28.menuItemList, action) {
	switch (action.type) {
		case MENU_ITEM_LIST: return action.menuItemList;
		default: return state;
	}
}
function itemSizeList(state = initState$28.itemSizeList, action) {
	switch (action.type) {
		case ITEM_SIZE_LIST: return action.itemSizeList;
		default: return state;
	}
}
function tempItemList(state = initState$28.tempItemList, action) {
	switch (action.type) {
		case TEMP_ITEM_LIST: return action.tempItemList;
		default: return state;
	}
}
function searchItem(state = initState$28.searchItem, action) {
	switch (action.type) {
		case SAVESEARCHITEM: return action.searchItem;
		default: return state;
	}
}
//#endregion
//#region source-snapshot/src/reducers/category.js
var initState$27 = {
	currentCategory: {},
	currentCategoryList: [],
	searchKeyWord: "",
	keyboardToggle: false,
	tempCurrentCategory: {}
};
function currentCategory(state = initState$27.currentCategory, action) {
	switch (action.type) {
		case CURRENT_CATEGORY: return action.currentCategory;
		default: return state;
	}
}
function currentCategoryList(state = initState$27.currentCategoryList, action) {
	switch (action.type) {
		case CURRENT_CATEGORY_LIST: return filterCategoryWithOrderType(action.categoryAction.currentCategoryList, action.categoryAction.orderType);
		default: return state;
	}
}
function filterCategoryWithOrderType(currentCategoryList, orderType) {
	const menuCategoryList = Object.assign([], currentCategoryList);
	if (orderType == "") return menuCategoryList;
	for (let i = menuCategoryList.length - 1; i >= 0; i--) {
		const cate = { ...menuCategoryList[i] };
		menuCategoryList[i] = cate;
		if (!cate.saleItems) {
			menuCategoryList.splice(i, 1);
			continue;
		}
		cate.saleItems = [...cate.saleItems];
		for (let j = cate.saleItems.length - 1; j >= 0; j--) {
			const item = { ...cate.saleItems[j] };
			cate.saleItems[j] = item;
			if (!item.itemPrices) continue;
			item.itemPrices = [...item.itemPrices];
			for (let k = item.itemPrices.length - 1; k >= 0; k--) {
				const price = item.itemPrices[k];
				if (price.type != "ALL" && price.type.split("_").join("") != orderType.split("_").join("")) item.itemPrices.splice(k, 1);
			}
			if (item.itemPrices.length == 0) cate.saleItems.splice(j, 1);
			if (item.itemType == "COMBO_SALE_ITEM" && item.comboSections == void 0) cate.saleItems.splice(j, 1);
		}
		if (cate.saleItems.length == 0) menuCategoryList.splice(i, 1);
	}
	return menuCategoryList;
}
function searchKeyWord(state = initState$27.searchKeyWord, action) {
	switch (action.type) {
		case SEARCH_KEY_WORD: return action.searchKeyWord;
		default: return state;
	}
}
function tempCurrentCategory(state = initState$27.tempCurrentCategory, action) {
	switch (action.type) {
		case TEMP_CURRENT_CATEGORY: return action.tempCurrentCategory;
		default: return state;
	}
}
function keyboardToggle(state = initState$27.keyboardToggle, action) {
	switch (action.type) {
		case SETKEYBOARDTOGGLE: return action.data;
		default: return state;
	}
}
//#endregion
//#region source-snapshot/src/reducers/language.js
var initState$26 = {
	languageList: [],
	currentLanguage: "en"
};
function languageList(state = initState$26.languageList, action) {
	switch (action.type) {
		case FETCH_LANGUAGE: return action.languageList;
		default: return state;
	}
}
function currentLanguage(state = initState$26.currentLanguage, action) {
	switch (action.type) {
		case CURRENT_LANGUAGE:
			document.documentElement.setAttribute("data-lang", action.currentLanguage);
			return action.currentLanguage;
		default: return state;
	}
}
var language_default = combineReducers({
	languageList,
	currentLanguage
});
//#endregion
//#region source-snapshot/src/reducers/menu.js
var initState$25 = {
	menuGroup: [],
	freeListIsExpanded: false,
	comboMenu: []
};
function menuGroup(state = initState$25.menuGroup, action) {
	switch (action.type) {
		case FETCH_MENUGROUP: return action.menuGroup.filter((each) => each.menuCategories?.length > 0);
		default: return state;
	}
}
function freeListIsExpanded(state = initState$25.freeListIsExpanded, action) {
	switch (action.type) {
		case EXPEND_FREELIST: return action.data;
		default: return state;
	}
}
function comboMenu(state = initState$25.comboMenu, action) {
	switch (action.type) {
		case COMBO_MENU: return action.comboMenu;
		default: return state;
	}
}
//#endregion
//#region source-snapshot/src/reducers/requireCategory.js
var initState$24 = { requireCategoryList: [] };
function requireCategoryList(state = initState$24.requireCategoryList, action) {
	switch (action.type) {
		case SETREQUIRECATEGORY: return filterCategoryList(action.data);
		default: return state;
	}
}
function filterCategoryList(menuData) {
	let requireCategoryList = [];
	menuData.forEach((item) => {
		if (item.menuCategories?.length) {
			for (let i = 0; i < item.menuCategories.length; i++) if (item.menuCategories[i].saleItems?.length) {
				if (!item.menuCategories[i].saleItems.filter((nk) => {
					return !nk.hiddenItem || nk.hiddenItem && nk.isFreeItem;
				}).length) continue;
				else if (item.menuCategories[i].requireCategory) requireCategoryList.push((0, import_cloneDeep.default)(item.menuCategories[i]));
			}
		}
	});
	return requireCategoryList;
}
//#endregion
//#region source-snapshot/src/reducers/merchantProfile.js
var initState$23 = { merchantProfile: {} };
function merchantProfile(state = initState$23.merchantProfile, action) {
	switch (action.type) {
		case FETCH_MERCHANT_PROFILE: return action.merchantProfile;
		default: return state;
	}
}
//#endregion
//#region source-snapshot/src/reducers/order.js
var import_isEqual = /* @__PURE__ */ __toESM(require_isEqual());
var import_omit = /* @__PURE__ */ __toESM(require_omit());
var compareByProperty = (property) => (a, b) => {
	const value1 = a[property];
	const value2 = b[property];
	if (value1 && value2) return value1 - value2;
};
var initState$22 = {
	orderType: "",
	itemList: [],
	saveOrderResult: {},
	orderStatus: "",
	paymentId: "",
	paymentMemberCardRecord: null,
	paymentMemberPointsEstimate: null,
	originalItemList: [],
	tipAmount: 0,
	paymentType: "",
	paymentTypeTrail: [],
	postPaymentActions: {
		kitchenSent: false,
		newOrderMessageSent: false,
		callTicketPrinted: false,
		signatureSubmitted: false,
		paymentReceiptPrinted: false,
		tipApplied: false
	},
	notes: "",
	pickupTime: "",
	customer: {
		firstName: "",
		phone: [{}]
	},
	tabelServiceType: "",
	locator: "",
	tableId: null,
	isAuthorizationDisplayName: false,
	IS_AUTHORIZATION_DISPLAY_NAME,
	customerName: "",
	isShowCheckFooter: true,
	numOfGuests: null
};
function itemList(state = initState$22.itemList, action) {
	const cards = state.filter(isMembershipCard);
	if ([
		"DELETEALLBYID",
		"SPLICE_ORDER",
		"REMOVE_ITEM_FROM_ORDER"
	].includes(action.type) && cards.some((card) => card.id == (action.data?.foodId ?? action.data?.id ?? action.itemId))) return state;
	if ([
		"EDIT_ORDER",
		"REPLACE_TO_ORDER",
		"REPLACEORREDUCEOLDCOMBO"
	].includes(action.type) && cards.some((card) => card.sequence == (action.data?.deleteSequence ?? action.data?.sequence ?? action.data?.comboIdx))) return state;
	switch (action.type) {
		case REMOVE_MEMBERSHIP_CARD:
			if (!cards.length) return state;
			return handleResolveList(state.filter((item) => !isMembershipCard(item)), action.buyDiscountRule, action.isSkipPromotionCalculation);
		case CRM_MEMBER_INFO: return state.filter((item) => !isMembershipCard(item) || !!action.data?.userId && item.membershipUserId === action.data.userId);
		case ADD_COMBO_TO_ORDER:
			if (isMembershipCard(action.comboInfo) && (cards.length || action.comboInfo.quantity !== 1)) return state;
			return compareItemList(action.comboInfo, action.buyDiscountRule, state, action.isSkipPromotionCalculation);
		case DELETEALLBYID:
			const foodList = [...state];
			const { foodId } = action.data;
			for (let g = 0; g < foodList.length; g++) if (foodList[g].id == foodId) {
				foodList.splice(g, 1);
				g--;
			}
			return handleResolveList(foodList, action.buyDiscountRule, action.isSkipPromotionCalculation);
		case SPLICE_ORDER:
			const tempStateList = [...state];
			const { id, cloneItemList } = action.data;
			const cloneSequenceList = cloneItemList.map((c) => c.sequence);
			for (let i = 0; i < tempStateList.length; i++) if (id == tempStateList[i].id && !cloneSequenceList.includes(tempStateList[i].sequence)) {
				tempStateList.splice(i, 1);
				i--;
			}
			for (let k = 0; k < cloneItemList.length; k++) {
				let idx = tempStateList.findIndex((t) => {
					return id == t.id && t.sequence == cloneItemList[k].sequence;
				});
				if (idx > -1) {
					tempStateList.splice(idx, 1, cloneItemList[k]);
					continue;
				}
			}
			return handleResolveList(tempStateList, action.buyDiscountRule, action.isSkipPromotionCalculation);
		case EDIT_ORDER:
			let temp = {};
			let tempIndex = -1;
			const tempState = [...state];
			const { deleteSequence, isSub } = action.data;
			for (let i = 0; i < tempState.length; i++) if (tempState[i].sequence == deleteSequence) {
				temp = tempState[i];
				tempIndex = i;
				break;
			}
			if (temp) if (isSub) if (temp.quantity > 1) temp.quantity--;
			else tempState.splice(tempIndex, 1);
			else temp.quantity++;
			return handleResolveList(tempState, action.buyDiscountRule, action.isSkipPromotionCalculation);
		case RESET_ORDER: return [];
		case REMOVE_ITEM_FROM_ORDER:
			const itemId = action.itemId;
			const itemList = Object.assign([], state);
			for (let i = itemList.length - 1; i >= 0; i--) {
				const item = itemList[i];
				if (item.id == itemId) {
					if (item.quantity > 1) item.quantity--;
					else itemList.splice(i, 1);
					break;
				}
			}
			return handleResolveList(itemList, action.buyDiscountRule, action.isSkipPromotionCalculation);
		case RESET_ITEM_LIST: return [];
		case REMOVE_FREE_ITEM_IN_ORDER:
			const { freeItemId } = action.data;
			return state.filter((each) => !(each.id === freeItemId && (each.isFreeItem || each.isCRMFreeItem)));
		case REPLACE_TO_ORDER:
			const list = Object.assign([], state);
			const { tempItem, sequence } = action.data;
			let idx = list.findIndex((f) => f.sequence == sequence);
			if (idx > -1) list.splice(idx, 1, tempItem);
			return handleResolveList(list, action.buyDiscountRule, action.isSkipPromotionCalculation);
		case REPLACEORREDUCEOLDCOMBO:
			const oldCombo = Object.assign([], state);
			const { comboObjInfo, comboIdx } = action.data;
			let comIdx = oldCombo.findIndex((f) => f.sequence == comboIdx);
			if (comIdx > -1) oldCombo.splice(comIdx, 1, comboObjInfo);
			return handleResolveList(oldCombo, action.buyDiscountRule, action.isSkipPromotionCalculation);
		case SPLICEORDERBYSOLDOUT:
			const orderList = [...state];
			const soldoutItems = (action.data || []).map((entry) => typeof entry === "object" ? entry : {
				id: entry,
				sequence: void 0
			});
			for (let j = 0; j < orderList.length; j++) if (soldoutItems.some((soldout) => {
				if (soldout?.sequence != null) return String(orderList[j]?.sequence) === String(soldout.sequence) && String(orderList[j]?.id) === String(soldout.id);
				return String(orderList[j]?.id) === String(soldout?.id);
			})) {
				orderList.splice(j, 1);
				j--;
			}
			return handleResolveList(orderList, action.buyDiscountRule, action.isSkipPromotionCalculation);
		case REMOVE_PROMOTION_DISCOUNT_ITEM: return removePromotionDiscountItem((0, import_cloneDeep.default)(state));
		case ADD_CAMPAIGN_ITEMS_TO_ORDER: return handleResolveList(action.data, action.buyDiscountRule, action.isSkipPromotionCalculation);
		case REMOVE_REWARD_ITEM_FROM_ORDER: return handleResolveList(removeCRMCampaignItems(state, action.campaignId), action.buyDiscountRule, action.isSkipPromotionCalculation);
		case RECOUNT_CURRENT_ORDER_LIST: return handleResolveList(state, action.buyDiscountRule, action.isSkipPromotionCalculation);
		case REMOVE_ITEM_REWARD_INFO: return handleResolveList(removeRewardItemInfo([...state]), action.buyDiscountRule, action.isSkipPromotionCalculation);
		case REMOVE_LOCAL_PROMOTION_REWARD_INFO: return removeLocalPromotion([...state]);
		case REMOVE_MANUAL_SELECT_REWARD_ITEM: return removeManualSelectRewardItem([...state]);
		default: return state;
	}
}
var removeRewardItemInfo = (allItems) => {
	return allItems.filter((e) => !e.manualSelectRewardDiscount).map((each) => {
		return !each.promotionRewardItem ? each : {
			...each,
			actualDiscount: void 0,
			orderDiscountInfo: void 0,
			itemDiscountInfo: void 0,
			promotionRewardItem: void 0
		};
	});
};
var removeManualSelectRewardItem = (allItems) => {
	return allItems.filter((e) => !e.manualSelectRewardDiscount);
};
var removePromotionDiscountItem = (itemList) => {
	const kioskPromotionDiscountItem = itemList.find((each) => each.discountID === -1 && each.discountName === "promotion discount");
	return itemList.filter((item) => item.sequence !== kioskPromotionDiscountItem?.sequence);
};
var removeLocalPromotion = (itemList) => {
	return itemList.filter((each) => !each.isLocalExchangePurchaseItem).map((each) => (0, import_omit.default)(each, [
		"discountRate",
		"discount",
		"tempId",
		"discountID",
		"discountRateType",
		"secondHalfInfo"
	]));
};
var compareItemList = (newItem, buyDiscountRule, allList, isSkipPromotionCalculation) => {
	const normalizeItemForComparison = (item, fieldsToDelete) => {
		const normalizedItem = (0, import_cloneDeep.default)(item);
		fieldsToDelete.forEach((field) => delete normalizedItem[field]);
		if (normalizedItem.itemType !== "SALE_ITEM" && normalizedItem?.comboType !== "FIXED_SELECTION") {
			if (normalizedItem.sectionDetail?.length) normalizedItem.sectionDetail.forEach((n) => {
				if (n.id > 0 && n.items?.length) n.items.sort(compareByProperty("id_sizeId"));
			});
		}
		return normalizedItem;
	};
	const normalizedNewItem = normalizeItemForComparison(newItem, ["sequence", "quantity"]);
	const nextList = [...allList];
	if (nextList.length) {
		let merged = false;
		for (let i = 0; i < nextList.length; i++) if (normalizedNewItem.id == nextList[i].id) {
			if ((0, import_isEqual.default)(normalizedNewItem, normalizeItemForComparison(nextList[i], [
				"quantity",
				"sequence",
				"totalPrice",
				"tempId",
				"secondHalfInfo"
			]))) {
				nextList[i] = {
					...nextList[i],
					quantity: nextList[i].quantity + newItem.quantity
				};
				merged = true;
				break;
			}
		}
		if (!merged) nextList.push(newItem);
	} else nextList.push(newItem);
	return [...handleResolveList(nextList, buyDiscountRule, isSkipPromotionCalculation)];
};
function saveOrderResult(state = initState$22.saveOrderResult, action) {
	switch (action.type) {
		case SAVE_ORDER_RESULT: return action.result;
		case RESET_ORDER: return {};
		default: return state;
	}
}
function notes(state = initState$22.notes, action) {
	switch (action.type) {
		case SET_ORDER_NOTES: return action.notes;
		case RESET_ORDER: return "";
		default: return state;
	}
}
function pickupTime(state = initState$22.pickupTime, action) {
	switch (action.type) {
		case SET_PICKUP_TIME: return action.pickupTime;
		default: return state;
	}
}
function customer(state = initState$22.customer, action) {
	switch (action.type) {
		case SET_ORDER_CUSTOMER: return action.customer;
		case RESET_ORDER: return {
			firstName: "",
			phone: [{}]
		};
		default: return state;
	}
}
function savePaymentId(state = initState$22.paymentId, action) {
	switch (action.type) {
		case SET_PAYMENT_ID: return action.paymentId;
		case RESET_ORDER: return "";
		default: return state;
	}
}
function paymentMemberCardRecord(state = initState$22.paymentMemberCardRecord, action) {
	switch (action.type) {
		case SET_PAYMENT_MEMBER_CARD_RECORD: return action.record;
		case RESET_ORDER: return null;
		default: return state;
	}
}
function paymentMemberPointsEstimate(state = initState$22.paymentMemberPointsEstimate, action) {
	switch (action.type) {
		case SET_PAYMENT_MEMBER_POINTS_ESTIMATE: return action.estimate;
		case SAVE_ORDER_RESULT: return state?.orderId === String(action.result?.id) ? state : null;
		case RESET_ORDER: return null;
		default: return state;
	}
}
function orderType(state = initState$22.orderType, action) {
	switch (action.type) {
		case ORDER_TYPE: return action.orderType;
		case RESET_ORDER: return "";
		default: return state;
	}
}
function orderStatus(state = initState$22.orderStatus, action) {
	switch (action.type) {
		case SET_ORDER_STATUS: return action.status;
		case RESET_ORDER: return "";
		default: return state;
	}
}
function originalItemList(state = initState$22.originalItemList, action) {
	switch (action.type) {
		case SET_ORIGINAL_ITEM_LIST: return action.itemList;
		default: return state;
	}
}
function tipAmount(state = initState$22.tipAmount, action) {
	switch (action.type) {
		case SAVE_TIP_AMOUNT: return action.tipAmount;
		default: return state;
	}
}
function paymentType(state = initState$22.paymentType, action) {
	switch (action.type) {
		case SAVE_PAYMENT_TYPE: return action.paymentType;
		case RESET_ORDER: return "";
		default: return state;
	}
}
function paymentTypeTrail(state = initState$22.paymentTypeTrail, action) {
	switch (action.type) {
		case APPEND_PAYMENT_TYPE_TRAIL:
			if (!action.paymentType) return state;
			if (state.includes(action.paymentType)) return state;
			return [...state, action.paymentType].slice(0, 2);
		case CLEAR_PAYMENT_TYPE_TRAIL:
		case RESET_ORDER: return [];
		default: return state;
	}
}
function postPaymentActions(state = initState$22.postPaymentActions, action) {
	switch (action.type) {
		case MARK_POST_PAYMENT_ACTION:
			if (!action.actionName) return state;
			return {
				...state,
				[action.actionName]: true
			};
		case CLEAR_POST_PAYMENT_ACTIONS:
		case RESET_ORDER: return initState$22.postPaymentActions;
		default: return state;
	}
}
function tabelServiceType(state = initState$22.tabelServiceType, action) {
	switch (action.type) {
		case SETTABELSERVICETYPE: return action.data;
		default: return state;
	}
}
function locator(state = initState$22.locator, action) {
	switch (action.type) {
		case SETLOCATOR: return action.data;
		default: return state;
	}
}
function tableId(state = initState$22.tableId, action) {
	switch (action.type) {
		case SET_TABLE_ID: return action.data;
		default: return state;
	}
}
function numOfGuests(state = initState$22.numOfGuests, action) {
	switch (action.type) {
		case SET_NUM_OF_GUESTS: return action.numOfGuests;
		case RESET_ORDER: return null;
		default: return state;
	}
}
function isAuthorizationDisplayName(state = initState$22.isAuthorizationDisplayName, action) {
	switch (action.type) {
		case IS_AUTHORIZATION_DISPLAY_NAME: return action.data;
		default: return state;
	}
}
function customerName(state = initState$22.customerName, action) {
	switch (action.type) {
		case SET_CUSTOMER_NAME: return action.data;
		default: return state;
	}
}
function isShowCheckFooter(state = initState$22.isShowCheckFooter, action) {
	switch (action.type) {
		case CHANGE_CHECK_FOOTER_VISIBLE: return action.data;
		default: return state;
	}
}
var order_default = combineReducers({
	itemList,
	orderType,
	saveOrderResult,
	orderStatus,
	savePaymentId,
	paymentMemberCardRecord,
	paymentMemberPointsEstimate,
	notes,
	pickupTime,
	customer,
	originalItemList,
	tipAmount,
	paymentType,
	paymentTypeTrail,
	postPaymentActions,
	tabelServiceType,
	locator,
	tableId,
	numOfGuests,
	isAuthorizationDisplayName,
	customerName,
	isShowCheckFooter
});
//#endregion
//#region source-snapshot/src/reducers/orderSequence.js
var initState$21 = { orderSequence: 0 };
function orderSequence(state = initState$21.orderSequence, action) {
	switch (action.type) {
		case ORDER_SEQUENCE: return state + action.increaseInterval;
		case INIT_ORDER_SEQUENCE: return action.initSequence;
		case SET_ORDER_SEQUENCE: return action.data;
		default: return state;
	}
}
//#endregion
//#region source-snapshot/src/reducers/combo.js
var initState$20 = { currentOrderCombo: [] };
var ITEM_PRICE_ID = -1;
var OPTION_ID = -2;
var CATEGORY_OPTION_ID = -3;
function currentOrderCombo(state = initState$20.currentOrderCombo, action) {
	switch (action.type) {
		case CURRENT_COMBO: return initComboSection(Object.assign([], state), action.comboInfo);
		case ADD_TO_SECTION: return addItemToComboSection(Object.assign([], state), action.itemInfo);
		case ADD_TO_SECTION_BYID:
			let arr = Object.assign([], state);
			action.data.forEach((d) => {
				for (let i = 0; i < arr.length; i++) if (arr[i].id == d.id) {
					arr[i] = d;
					break;
				}
			});
			return arr;
		case REMOVE_FROM_SECTION: return removeItemFromComboSection(Object.assign([], state), action.itemInfo);
		case REMOVEDIYCOMBO: return removeFootItemComboSection(Object.assign([], state), action.data);
		case REMOVEDIYOPTCOMBO: return removeFootOptComboSection(Object.assign([], state), action.data);
		case CLEARDIYCOMBO: return clearFootItemComboSection(Object.assign([], state), action.data);
		case SET_ITEM_PRICE: return setItemPrice(Object.assign([], state), action.sizeInfo);
		case ADD_COMBO_OPTION: return addComboOption(Object.assign([], state), action.option);
		case ADD_OPTION: return addOption(Object.assign([], state), action.optionInfo);
		case REMOVE_ONE_OPTIONS: return removeOneOption(Object.assign([], state), action.data);
		case REMOVE_ONE_ITEMS: return removeOneItems(Object.assign([], state), action.data);
		case SPLICE_ALL_ITEMS: return spliceComboAllItems(Object.assign([], state), action.data);
		case SPLICE_SINGLE_ITEMS: return spliceComboSingleItems(Object.assign([], state), action.data);
		case RESET_CURRENT_COMBO: return [];
		case DEFAULT_CURRENT_COMBO: return action.sectionDetail;
		case CHANGE_DEFAULT_DISH: return resetDefaultStatus(Object.assign([], state), action.itemInfo);
		case EDIT_DEFAULT_DISH: return editSystemDefaultDish(Object.assign([], state), action.itemInfo);
		default: return state;
	}
}
function initComboSection(comboInfo, optionInfo) {
	const orderType = optionInfo.orderType;
	const currentItem = optionInfo.currentItem;
	const { currentCategoryList, selfConfig, menuItemList, kioskSoldOutList } = optionInfo;
	const soldOutOptions = {
		menuItemList,
		kioskSoldOutList
	};
	const { defaultItemSizeId } = currentItem;
	let newCombo = [];
	let itemPrices = (0, import_cloneDeep.default)(currentItem.itemPrices);
	const currentCategory = optionInfo.currentCategory;
	let categoryOptions = null;
	if (currentCategory?.isFreeItemCategory) {
		const category = currentCategoryList.find((_) => _.id === currentItem.oCategoryId);
		categoryOptions = category && category?.options;
	} else categoryOptions = currentCategory?.options;
	const itemOptions = currentItem?.options;
	let defaultSizeInfo = null;
	if (itemPrices && itemPrices.length) {
		if (orderType == "DINE_IN") {
			let dineInList = itemPrices.filter((f) => f.type == "DINE_IN");
			if (dineInList.length) itemPrices = (0, import_cloneDeep.default)(dineInList);
			else {
				let AllList = itemPrices.filter((f) => f.type == "ALL");
				if (AllList.length) itemPrices = (0, import_cloneDeep.default)(AllList);
			}
		} else if (orderType == "TO_GO") {
			let togoList = itemPrices.filter((f) => f.type == "TOGO");
			if (togoList.length) itemPrices = (0, import_cloneDeep.default)(togoList);
			else {
				let AllList = itemPrices.filter((f) => f.type == "ALL");
				if (AllList.length) itemPrices = (0, import_cloneDeep.default)(AllList);
			}
		} else if (orderType == "PICK_UP") {
			let pickUpList = itemPrices.filter((f) => f.type == "PICKUP");
			if (pickUpList.length) itemPrices = (0, import_cloneDeep.default)(pickUpList);
			else {
				let AllList = itemPrices.filter((f) => f.type == "ALL");
				if (AllList.length) itemPrices = (0, import_cloneDeep.default)(AllList);
			}
		}
	}
	if (itemPrices && itemPrices.length) {
		if (defaultItemSizeId) {
			const sizeDefault = itemPrices.find((each) => each.sizeId === defaultItemSizeId);
			if (sizeDefault) defaultSizeInfo = sizeDefault;
		}
		if (!defaultItemSizeId || !defaultSizeInfo) defaultSizeInfo = {};
		let tempPriceSection = {
			id: ITEM_PRICE_ID,
			sizeInfo: defaultSizeInfo
		};
		newCombo.push(tempPriceSection);
	}
	if (currentItem.comboSections != void 0) for (let section of currentItem.comboSections) {
		let tempSectionInfo = {};
		const { priceRule } = section;
		const subDishItem = section.comboSectionSaleItems.map((each) => {
			return {
				...each,
				...getComboItemDetailInfo(each.saleItemId, currentCategoryList)
			};
		});
		const preSelectedItem = section.priceRule == "ITEM_CENTER" ? [] : subDishItem.filter((each) => each.preSelected).map((dish) => {
			const isHasDetailPrice = dish.itemPrices?.length > 0;
			const selectedOptionList = [];
			if (isHasDetailPrice) {
				const filterPriceByType = dish.itemPrices.filter((price) => price.type === (orderType === "DINE_IN" ? orderType : orderType.replace("_", "")));
				const defaultSize = filterPriceByType.find((itemPrice) => itemPrice.sizeId === dish.defaultItemSizeId);
				selectedOptionList.push({
					id: -1,
					sizeInfo: defaultSize || filterPriceByType[0]
				});
			}
			const selectedDish = {
				...dish,
				quantity: itemIsSoldOut(dish, soldOutOptions) ? 0 : 1,
				remark: {
					optionName: "",
					optionType: "NOTE",
					quantity: itemIsSoldOut(dish, soldOutOptions) ? 0 : 1,
					price: priceRule === "FIXED_PRICE" ? 0 : dish?.price
				},
				price: priceRule === "FIXED_PRICE" ? 0 : dish?.price,
				sideNavId: section.id,
				selectedOptionList,
				isDefaultSelect: true
			};
			if (priceRule === "FIXED_PRICE" && !isHasDetailPrice) setComboItemBasePrice(selectedDish, 0, true);
			return selectedDish;
		});
		tempSectionInfo.id = section.id;
		tempSectionInfo.items = preSelectedItem || [];
		newCombo.push(tempSectionInfo);
	}
	if (itemOptions != void 0 && itemOptions.length > 0) {
		let tempItemOptions = {};
		tempItemOptions.id = OPTION_ID;
		tempItemOptions.options = [];
		newCombo.push(tempItemOptions);
	}
	if (categoryOptions != void 0 && categoryOptions.length > 0) {
		let tempCategoryOptions = {};
		tempCategoryOptions.id = CATEGORY_OPTION_ID;
		tempCategoryOptions.options = [];
		newCombo.push(tempCategoryOptions);
	}
	return newCombo;
}
function addItemToComboSection(comboInfo, itemInfo) {
	for (let section of comboInfo) if (section.id == itemInfo.sectionId) {
		section.items.push(...itemInfo.item);
		break;
	}
	return comboInfo;
}
function removeItemFromComboSection(comboInfo, itemInfo) {
	const { isPreSelected } = itemInfo;
	for (let section of comboInfo) if (section.id == itemInfo.sectionId) if (section.id == OPTION_ID || section.id == CATEGORY_OPTION_ID) {
		const sectionOptions = section.options;
		if (itemInfo.itemId == void 0) sectionOptions.splice(0, 1);
		else for (let i = 0; i < sectionOptions.length; i++) if (sectionOptions[i].id == itemInfo.itemId) {
			if (sectionOptions[i].quantity > 1) sectionOptions[i].quantity -= 1;
			else sectionOptions.splice(i, 1);
			break;
		}
	} else {
		const sectionItems = section.items;
		if (itemInfo.itemId == void 0) sectionItems.splice(0, 1);
		else for (let i = 0; i < sectionItems.length; i++) if (sectionItems[i].id == itemInfo.itemId) {
			let sectionList = [];
			sectionItems.forEach((section, idx) => {
				if (section.id === itemInfo.itemId) sectionList.push(idx);
			});
			sectionItems.splice(isPreSelected && sectionList.length > 1 ? sectionList[1] : i, 1);
			break;
		}
	}
	return comboInfo;
}
function removeFootItemComboSection(comboInfo, data) {
	const { sectionId, idx, sideNavList } = data;
	const sideNavInfo = getComboSectionInfo(sideNavList, sectionId);
	const priceRule = sideNavInfo?.priceRule;
	const freeQuantity = sideNavInfo?.freeQuantity;
	const max = sideNavInfo?.maxNumOfSelectionAllowed;
	if (comboInfo && comboInfo.length) {
		for (let section of comboInfo) if (section.id == sectionId) {
			if (section.items && section.items.length) {
				section.items.splice(idx, 1);
				break;
			}
		}
		if (priceRule == "FIXED_UNTIL_MAX") {
			let result = comboInfo.find((c) => c.id == sectionId);
			if (result) for (let k = 0; k < result.items.length; k++) {
				let food = result.items[k];
				if (k < max) setComboItemBasePrice(food, 0, true);
				else break;
			}
		}
		if (freeQuantity > 0) {
			let result = comboInfo.find((c) => c.id == sectionId);
			if (result) for (let k = 0; k < result.items.length; k++) {
				let food = result.items[k];
				if (k < freeQuantity) setComboItemBasePrice(food, 0, true);
				else break;
			}
		}
	}
	return comboInfo;
}
function removeFootOptComboSection(comboInfo, data) {
	const { sectionId, p } = data;
	let sequence = p.sequence;
	if (comboInfo && comboInfo.length) {
		for (let section of comboInfo) if (section.id == sectionId) {
			if (section.options && section.options.length) {
				let idx = section.options.findIndex((s) => s.sequence == sequence);
				if (idx >= 0) section.options.splice(idx, 1);
				break;
			}
		}
	}
	return comboInfo;
}
function clearFootItemComboSection(comboInfo, data) {
	const { id } = data;
	if (comboInfo?.length) if (id > 0) {
		let itemObj = comboInfo.find((c) => c.id == id);
		if (itemObj) itemObj.items.splice(0, itemObj.items.length);
	} else {
		let optObj = comboInfo.find((c) => c.id == id);
		if (optObj) optObj.options.splice(0, optObj.options.length);
	}
	return comboInfo;
}
function setItemPrice(comboInfo, itemPrice) {
	for (let section of comboInfo) if (section.id == ITEM_PRICE_ID) section.sizeInfo = Object.assign({}, itemPrice);
	return comboInfo;
}
function addComboOption(comboInfo, option) {
	for (let section of comboInfo) if (section.id == CATEGORY_OPTION_ID || section.id == OPTION_ID) {
		let tempOption = Object.assign({}, option);
		tempOption.quantity = 1;
		section.options.push(tempOption);
	}
	return comboInfo;
}
function addOption(comboInfo, optionInfo) {
	let sectionId = optionInfo.sectionId;
	for (let section of comboInfo) if (section.id == sectionId) {
		let thisOption = Object.assign({}, optionInfo.option);
		section.options.push(thisOption);
		section.options.sort(compare("id"));
		break;
	}
	return comboInfo;
}
function removeOneOption(comboInfo, data) {
	const { sideNavId, id } = data;
	let realRes = comboInfo.find((c) => c.id == sideNavId);
	if (realRes) {
		for (let i = 0; i < realRes.options.length; i++) if (realRes.options[i].id == id) {
			realRes.options.splice(i, 1);
			break;
		}
	}
	return comboInfo;
}
function removeOneItems(comboInfo, data) {
	const { sideNavId, id } = data;
	let realRes = comboInfo.find((c) => c.id == sideNavId);
	if (realRes) {
		for (let i = 0; i < realRes.items.length; i++) if (realRes.items[i].id == id) {
			realRes.items.splice(i, 1);
			break;
		}
	}
	return comboInfo;
}
function spliceComboAllItems(comboInfo, data) {
	const { sideNavId, cloneItemList } = data;
	let realRes = comboInfo.find((c) => c.id == sideNavId);
	if (realRes) if (sideNavId == CATEGORY_OPTION_ID) realRes.options = cloneItemList;
	else realRes.items = cloneItemList;
	return comboInfo;
}
function spliceComboSingleItems(comboInfo, data) {
	const { sideNavId, cloneItemList, id } = data;
	const tempStateList = comboInfo.find((c) => c.id == sideNavId).items;
	for (let i = 0; i < tempStateList.length; i++) if (id == tempStateList[i].id) {
		tempStateList.splice(i, 1);
		i--;
	}
	for (let k = 0; k < cloneItemList.length; k++) if (cloneItemList[k].quantity > 1) for (let j = 0; j < cloneItemList[k].quantity; j++) {
		let obj = (0, import_cloneDeep.default)(cloneItemList[k]);
		obj.quantity = 1;
		tempStateList.push(obj);
	}
	else tempStateList.push(cloneItemList[k]);
	return comboInfo;
}
function resetDefaultStatus(comboInfo, data) {
	return comboInfo.map((each) => {
		if (each.id === data.sideNavId) {
			const newItems = each.items.map((item) => {
				return item.id === data.itemId ? {
					...item,
					isDefaultSelect: false
				} : item;
			});
			return {
				id: each.id,
				items: newItems
			};
		}
		return each;
	});
}
function editSystemDefaultDish(comboInfo, data) {
	return comboInfo.map((each) => {
		if (each.id === data.sideNavId) {
			const newItems = each.items.map((item) => {
				return item.id === data.newDishInfo[0].id ? data.newDishInfo[0] : item;
			});
			return {
				id: each.id,
				items: newItems
			};
		}
		return each;
	});
}
//#endregion
//#region source-snapshot/src/reducers/isOrderEdit.js
var initState$19 = {
	isOrderEdit: false,
	editComboQty: 1,
	isReorderFlag: false,
	cateyPageDomTop: 0,
	orderPageDomTop: 0,
	isUpdateMenu: false,
	vListScrollHeight: 0
};
function isOrderEdit(state = initState$19.isOrderEdit, action) {
	switch (action.type) {
		case IS_ORDER_EDIT: return action.isOrderEdit;
		default: return state;
	}
}
function editComboQty(state = initState$19.editComboQty, action) {
	switch (action.type) {
		case SETEDITCOMBOQTY: return action.data;
		default: return state;
	}
}
function isReorderFlag(state = initState$19.isReorderFlag, action) {
	switch (action.type) {
		case SETISREORDERFLAG: return action.data;
		default: return state;
	}
}
function cateyPageDomTop(state = initState$19.cateyPageDomTop, action) {
	switch (action.type) {
		case SETCATEYPAGEDOMTOP: return action.data;
		default: return state;
	}
}
function orderPageDomTop(state = initState$19.orderPageDomTop, action) {
	switch (action.type) {
		case SETORDERPAGEDOMTOP: return action.data;
		default: return state;
	}
}
function isUpdateMenu(state = initState$19.isUpdateMenu, action) {
	switch (action.type) {
		case MENULOAD: return action.data;
		default: return state;
	}
}
function vListScrollHeight(state = initState$19.vListScrollHeight, action) {
	switch (action.type) {
		case SETVLISTSCROLLHEIGHT: return action.data;
		default: return state;
	}
}
var isOrderEdit_default = combineReducers({
	isOrderEdit,
	editComboQty,
	isReorderFlag,
	orderPageDomTop,
	cateyPageDomTop,
	isUpdateMenu,
	vListScrollHeight
});
//#endregion
//#region source-snapshot/src/reducers/tax.js
var initState$18 = { taxList: [] };
function taxList(state = initState$18.taxList, action) {
	switch (action.type) {
		case SET_TAX_INFO: return action.taxInfo;
		default: return state;
	}
}
//#endregion
//#region source-snapshot/src/reducers/systemConfig.js
var initState$17 = { sysConfig: [] };
function systemConfig(state = initState$17.sysConfig, action) {
	switch (action.type) {
		case SET_SYSTEM_CONFIG: return action.sysConfig;
		default: return state;
	}
}
/**
* 字段说明
*
* "CASH_DISCOUNT_RATE"
* "value": "",
*
* "IS_CHARGE_TAX"（加收费用要算税（整单加收，餐具，打包带））
* "booleanValue": true,
*
* "CHOOSE_ORDER_TYPE"（订单类型（0：DineIn，1：ToGo，2：Pickup））
* "value": "0,1,2",
*
* "ORDER_TOTAL_ROUNDING_STRATEGY"
* "value": "NO_ROUNDING",
*
* "KIOSK_COMBO_MODE"（已废弃）
* "booleanValue": false,
*
* "COUNTRY_STATES_PROVINCE_TERRITORY"
* "value": "USA",
*
* "KIOSK_PAYMENT_TYPE"（支付方式（0：card，1：cash，2：ecard））
* "value": "1,0",
*
* "KIOSK_SEND_MESSAGE"（开通SMS（控制phoneInput页面））
* "booleanValue": true,
*
* "TIPS_SUGGESTIONS_PERCENTAGE"
* "value": "15|18|20",
*
* "IS_DISCOUNT_VOID_TAX"
* "booleanValue": true,
*
* "CASH_DISCOUNT_SETTING"
* "booleanValue": false,
*
* "IS_EXEMPT_TAX_ON_TAKEOUT_ORDER"（togo下，是否全部免税（整单加收，餐具，打包带全免税））
* "booleanValue": false,
*
*/
//#endregion
//#region source-snapshot/src/reducers/img.js
var initState$16 = {
	bgImg: "",
	logoImg: "",
	banner: "",
	isShowBanner: true,
	bannerPro: "",
	isShowBannerPro: true,
	isShowLoginGuideDialog: true,
	isShowWaitingTimeModal: true,
	isShowScreensaver: false
};
function bgImg(state = initState$16.bgImg, action) {
	switch (action.type) {
		case SET_IMG: return action.data;
		default: return state;
	}
}
function logoImg(state = initState$16.logoImg, action) {
	switch (action.type) {
		case SET_LOGO: return action.data;
		default: return state;
	}
}
function banner(state = initState$16.banner, action) {
	switch (action.type) {
		case SET_BANNER: return action.data;
		default: return state;
	}
}
function isShowBanner(state = initState$16.isShowBanner, action) {
	switch (action.type) {
		case SET_SHOW_BANNER: return action.data;
		default: return state;
	}
}
function bannerPro(state = initState$16.bannerPro, action) {
	switch (action.type) {
		case SET_BANNERPRO: return action.data;
		default: return state;
	}
}
function isShowBannerPro(state = initState$16.isShowBannerPro, action) {
	switch (action.type) {
		case SET_SHOW_BANNERPRO: return action.data;
		default: return state;
	}
}
function isShowWaitingTimeModal(state = initState$16.isShowWaitingTimeModal, action) {
	switch (action.type) {
		case SET_SHOW_WAITING_TIME_MODAL: return action.data;
		default: return state;
	}
}
function isShowLoginGuideDialog(state = initState$16.isShowLoginGuideDialog, action) {
	switch (action.type) {
		case SET_SHOW_LOGINGUIDEDIALOG: return action.data;
		default: return state;
	}
}
function isShowScreensaver(state = initState$16.isShowScreensaver, action) {
	switch (action.type) {
		case SET_SCREENSAVER: return action.data;
		default: return state;
	}
}
var img_default = combineReducers({
	bgImg,
	logoImg,
	banner,
	isShowBanner,
	bannerPro,
	isShowBannerPro,
	isShowLoginGuideDialog,
	isShowWaitingTimeModal,
	isShowScreensaver
});
//#endregion
//#region source-snapshot/src/reducers/sideNav.js
var initState$15 = {
	sectionId: 0,
	sectionList: []
};
function sideNavList(state = initState$15.sectionList, action) {
	switch (action.type) {
		case SIDENAVLISTINFO: return Object.assign([], action.data);
		default: return state;
	}
}
function sideNavId(state = initState$15.sectionId, action) {
	switch (action.type) {
		case SIDENAVINDEX:
			state = action.data;
			return state;
		default: return state;
	}
}
var sideNav_default = combineReducers({
	sideNavList,
	sideNavId
});
//#endregion
//#region source-snapshot/src/reducers/lanModal.js
var initState$14 = {
	isLanModalOpen: false,
	langFn: null
};
function lanModalshow(state = initState$14.isLanModalOpen, action) {
	switch (action.type) {
		case SET_LANMODAL:
			solveScrollElem(action.data);
			return action.data;
		default: return state;
	}
}
function lanModalFn(state = initState$14.langFn, action) {
	switch (action.type) {
		case SET_LANMODALFN: return action.data;
		default: return state;
	}
}
var lanModal_default = combineReducers({
	lanModalshow,
	lanModalFn
});
//#endregion
//#region source-snapshot/src/reducers/allSystemConfigList.js
var initState$13 = { allSysConfig: [] };
function allSysConfig(state = initState$13.allSysConfig, action) {
	switch (action.type) {
		case ALL_SET_SYSTEM_CONFIG:
			const sysObj = {};
			if (action.allSysConfig?.length) action.allSysConfig.forEach((item) => {
				sysObj[item.name] = item.value === void 0 || item.value === null ? "" : item.value;
			});
			return sysObj;
		default: return state;
	}
}
/**
* 字段说明
*
* "RECEIPT_PRINT"（"true": 打印收据小票，"false": 不打印）
* "value": "true"
*
* "TIPS_SUGGESTIONS_CALCULATION"（含'0'则代表税前算小费，含'1'代表税前折扣算）
* "value": "1"
*
*/
//#endregion
//#region source-snapshot/src/reducers/selfConfig.js
var initState$12 = { selfConfig: {} };
function selfConfigMap(state = initState$12.selfConfig, action) {
	switch (action.type) {
		case SELF_CONFIG: return configMap(action.data);
		default: return state;
	}
}
function configMap(list) {
	if (list?.configList?.length) {
		const originalLength = list.configList.length;
		let configList = normalizeConfigList(list.configList);
		let defectList = [];
		selfConfigList.configList.forEach((item) => {
			if (!configList.find((c) => c.id == item.id)) defectList.push(item);
		});
		const hasInvalidConfigItems = originalLength !== configList.length;
		if (defectList.length || hasInvalidConfigItems) {
			configList = configList.concat(defectList);
			configList.sort(compare("id"));
			list.configList = configList;
		}
	} else list.configList = selfConfigList.configList;
	const obj = {};
	if (list?.configList?.length) list.configList.forEach((item) => {
		obj["id_" + item.id] = item.value;
	});
	list.configMap = obj;
	return list;
}
//#endregion
//#region source-snapshot/src/reducers/sysCookie.js
var initState$11 = {
	kioskConfigUserId: "",
	systemLicense: [],
	networkStatus: { rtt: 0 },
	mobyDeviceLinkStatus: null,
	mobyDeviceInfo: {},
	triposPayReady: false,
	triposPayFinish: false
};
function kioskConfigUserId(state = initState$11.kioskConfigUserId, action) {
	switch (action.type) {
		case SETKIOSKCONFIGUSERID: return action.data;
		default: return state;
	}
}
function systemLicense(state = initState$11.systemLicense, action) {
	switch (action.type) {
		case SYSTEM_LICENSE: return action.data;
		default: return state;
	}
}
function networkStatus(state = initState$11.networkStatus, action) {
	switch (action.type) {
		case SET_NETWORKTATUS: return action.data;
		default: return state;
	}
}
function mobyDeviceLinkStatus(state = initState$11.mobyDeviceLinkStatus, action) {
	switch (action.type) {
		case MOBY_DEVICE_LINK_STATUS: return action.data;
		default: return state;
	}
}
function mobyDeviceInfo(state = initState$11.mobyDeviceInfo, action) {
	switch (action.type) {
		case MOBY_DEVICE_INFO: return action.data;
		default: return state;
	}
}
function triposPayReady(state = initState$11.triposPayReady, action) {
	switch (action.type) {
		case TRIPOS_PAY_READY: return action.data;
		default: return state;
	}
}
function triposPayFinish(state = initState$11.triposPayFinish, action) {
	switch (action.type) {
		case TRIPOS_PAY_FINISH: return action.data;
		default: return state;
	}
}
var sysCookie_default = combineReducers({
	kioskConfigUserId,
	systemLicense,
	networkStatus,
	mobyDeviceLinkStatus,
	mobyDeviceInfo,
	triposPayReady,
	triposPayFinish
});
//#endregion
//#region source-snapshot/src/reducers/togoList.js
var initState$10 = { togoList: [
	{
		id: 2,
		name: "Utensil",
		select: {}
	},
	{
		id: 3,
		name: "Bag",
		select: {}
	},
	{
		id: 4,
		name: "Takeout Box",
		select: {}
	}
] };
function togoList(state = initState$10.togoList, action) {
	switch (action.type) {
		case SET_TOGO_OPTION: return action.data;
		case CLEAR_TOGO_OPTION: return [
			{
				id: 2,
				name: "Utensil",
				select: {}
			},
			{
				id: 3,
				name: "Bag",
				select: {}
			},
			{
				id: 4,
				name: "Takeout Box",
				select: {}
			}
		];
		default: return state;
	}
}
//#endregion
//#region source-snapshot/src/reducers/cardPaidResult.js
var initState$9 = { result: {} };
function cardResult(state = initState$9.result, action) {
	switch (action.type) {
		case SET_CARD_RESULT: return action.data;
		default: return state;
	}
}
//#endregion
//#region source-snapshot/src/reducers/giftCardPaymentInfo.js
var initState$8 = null;
function giftCardPaymentInfo(state = initState$8, action) {
	switch (action.type) {
		case SET_GIFT_CARD_PAYMENT_INFO: return action.data;
		case RESET_ORDER: return initState$8;
		default: return state;
	}
}
//#endregion
//#region source-snapshot/src/reducers/brandSetting.js
var initState$7 = {
	selectedBrand: { id: null },
	brandMenu: []
};
function selectedBrand(state = initState$7.selectedBrand, action) {
	switch (action.type) {
		case SELECTEDBRAND: return action.data;
		default: return state;
	}
}
function brandMenu(state = initState$7.brandMenu, action) {
	switch (action.type) {
		case BRANDMENU: return action.data;
		default: return state;
	}
}
var brandSetting_default = combineReducers({
	selectedBrand,
	brandMenu
});
//#endregion
//#region source-snapshot/src/reducers/socket.js
var initState$6 = {
	isConnectWs: false,
	isMenuUpdated: false,
	makingCupNum: null
};
function isConnectWs(state = initState$6.isConnectWs, action) {
	switch (action.type) {
		case PP_WS: return action.data;
		default: return state;
	}
}
function isMenuUpdated(state = initState$6.isMenuUpdated, action) {
	switch (action.type) {
		case ISMENUUPDATED: return action.data;
		default: return state;
	}
}
function makingCupNum(state = initState$6.makingCupNum, action) {
	switch (action.type) {
		case MAKINGCUPNUM: return action.data;
		default: return state;
	}
}
var socket_default = combineReducers({
	isConnectWs,
	isMenuUpdated,
	makingCupNum
});
//#endregion
//#region source-snapshot/src/reducers/crm.js
var initState$5 = {
	isShowLoginBar: false,
	memberCRMInfo: {},
	earningRule: {},
	isNewMember: true,
	loginType: null,
	isCRMAuthCodeVerified: false,
	crmAuthCodeVerifiedPhone: "",
	selectedFreeItem: [],
	tempFreeItem: {},
	selectedDiscount: {},
	isIgnoreReward: false,
	rewardRule: [],
	onboardGiftRule: {},
	freeItemMenuPosition: 0,
	isMemberOrderedBefore: true,
	tempCampaign: null,
	privileges: [],
	isHasBenefit: false
};
function isShowLoginBar(state = initState$5.isShowLoginBar, action) {
	switch (action.type) {
		case IS_SHOW_LOGIN_BAR: return action.data;
		default: return state;
	}
}
function memberCRMInfo(state = initState$5.memberCRMInfo, action) {
	switch (action.type) {
		case CRM_MEMBER_INFO: return action.data;
		default: return state;
	}
}
function privileges(state = initState$5.privileges, action) {
	switch (action.type) {
		case CRM_PRIVILEGES: return action.data;
		default: return state;
	}
}
function isHasBenefit(state = initState$5.isHasBenefit, action) {
	switch (action.type) {
		case CRM_PRIVILEGES: return action.data.length > 0;
		default: return state;
	}
}
function earningRule(state = initState$5.earningRule, action) {
	switch (action.type) {
		case CRM_EARN_RULE: return action.data;
		default: return state;
	}
}
function isNewMember(state = initState$5.isNewMember, action) {
	switch (action.type) {
		case IS_NEW_MEMBER: return action.data;
		default: return state;
	}
}
function loginType(state = initState$5.loginType, action) {
	switch (action.type) {
		case LOGIN_TYPE: return action.data;
		default: return state;
	}
}
function isCRMAuthCodeVerified(state = initState$5.isCRMAuthCodeVerified, action) {
	switch (action.type) {
		case SET_CRM_AUTH_CODE_VERIFIED: return action.data;
		default: return state;
	}
}
function crmAuthCodeVerifiedPhone(state = initState$5.crmAuthCodeVerifiedPhone, action) {
	switch (action.type) {
		case SET_CRM_AUTH_CODE_VERIFIED_PHONE: return action.data;
		case SET_CRM_AUTH_CODE_VERIFIED: return action.data ? state : initState$5.crmAuthCodeVerifiedPhone;
		default: return state;
	}
}
function selectedFreeItem(state = initState$5.selectedFreeItem, action) {
	switch (action.type) {
		case CHANGE_FREE_ITEM: return action.data;
		default: return state;
	}
}
function tempFreeItem(state = initState$5.tempFreeItem, action) {
	switch (action.type) {
		case SET_TEMP_FREE_ITEM: return action.data;
		default: return state;
	}
}
function selectedDiscount(state = initState$5.selectedDiscount, action) {
	switch (action.type) {
		case SET_DISCOUNT: return action.data;
		default: return state;
	}
}
function isIgnoreReward(state = initState$5.isIgnoreReward, action) {
	switch (action.type) {
		case IGNORE_REWARD: return action.data;
		default: return state;
	}
}
function rewardRule(state = initState$5.rewardRule, action) {
	switch (action.type) {
		case CRM_REWARD_RULE: return action.data;
		default: return state;
	}
}
function onboardGiftRule(state = initState$5.onboardGiftRule, action) {
	switch (action.type) {
		case ONBOARD_GIFT_RULE: return action.data;
		default: return state;
	}
}
function freeItemMenuPosition(state = initState$5.freeItemMenuPosition, action) {
	switch (action.type) {
		case FREE_ITEM_MENU_POSITION: return action.data;
		default: return state;
	}
}
function isMemberOrderedBefore(state = initState$5.isMemberOrderedBefore, action) {
	switch (action.type) {
		case IS_MEMBER_ORDERED_BEFORE: return action.data;
		default: return state;
	}
}
function tempCampaign(state = initState$5.tempCampaign, action) {
	switch (action.type) {
		case SET_TEMP_CAMPAIGN: return action.data;
		default: return state;
	}
}
var crm_default = combineReducers({
	isShowLoginBar,
	memberCRMInfo,
	privileges,
	isHasBenefit,
	earningRule,
	isNewMember,
	loginType,
	isCRMAuthCodeVerified,
	crmAuthCodeVerifiedPhone,
	selectedFreeItem,
	tempFreeItem,
	selectedDiscount,
	isIgnoreReward,
	rewardRule,
	onboardGiftRule,
	freeItemMenuPosition,
	isMemberOrderedBefore,
	tempCampaign
});
//#endregion
//#region source-snapshot/src/reducers/cateDish.js
var initState$4 = {
	standardCateDish: [],
	allMenu: []
};
function standardCateDish(state = initState$4.standardCateDish, action) {
	switch (action.type) {
		case STANDARD_CATE_DISH: return action.data;
		default: return state;
	}
}
function allMenu(state = initState$4.allMenu, action) {
	switch (action.type) {
		case SET_ALL_MENU: return action.data;
		default: return state;
	}
}
var cateDish_default = combineReducers({
	standardCateDish,
	allMenu
});
//#endregion
//#region source-snapshot/src/reducers/promotion.js
var initState$3 = {
	promotionList: [],
	buyGiftRule: [],
	buyGifts: [],
	satisfyRules: [],
	buyDiscountRule: [],
	exchangePurchaseRule: [],
	orderDiscount: [],
	cloudPromotion: [],
	isSkipPromotionCalculation: false,
	promotionCode: "",
	promotionCenterList: null,
	promotionCenterMetas: null,
	isOpenCloudPromotion: false,
	itemMatchCloudPromotion: null,
	itemValidPromotion: null,
	kioskLocalDiscountPromotion: null
};
function promotionList(state = initState$3.promotionList, action) {
	switch (action.type) {
		case SET_PROMOTION: return action.data;
		case RESET_PROMOTION: return initState$3.promotionList;
		default: return state;
	}
}
function buyGifts(state = initState$3.buyGifts, action) {
	switch (action.type) {
		case SET_BUY_GIFTS: return action.data;
		case RESET_PROMOTION: return initState$3.buyGifts;
		default: return state;
	}
}
function satisfyRules(state = initState$3.satisfyRules, action) {
	switch (action.type) {
		case SET_SATISFY_RULES: return action.data;
		case RESET_PROMOTION: return initState$3.satisfyRules;
		default: return state;
	}
}
function buyGiftRule(state = initState$3.buyGiftRule, action) {
	switch (action.type) {
		case SET_BUY_GIFTS_RULES: return action.data;
		case RESET_PROMOTION: return initState$3.buyGiftRule;
		default: return state;
	}
}
function buyDiscountRule(state = initState$3.buyDiscountRule, action) {
	switch (action.type) {
		case SET_BUY_DISCOUNT_RULES: return action.data;
		case RESET_PROMOTION: return initState$3.buyDiscountRule;
		default: return state;
	}
}
function exchangePurchaseRule(state = initState$3.exchangePurchaseRule, action) {
	switch (action.type) {
		case SET_EXCHANGE_PURCHASE_RULES: return action.data;
		case RESET_PROMOTION: return initState$3.exchangePurchaseRule;
		default: return state;
	}
}
function orderDiscount(state = initState$3.orderDiscount, action) {
	switch (action.type) {
		case SET_ORDER_DISCOUNT: return action.data;
		case RESET_PROMOTION: return initState$3.orderDiscount;
		default: return state;
	}
}
function cloudPromotion(state = initState$3.cloudPromotion, action) {
	switch (action.type) {
		case SET_CLOUD_PROMOTION: return action.data;
		case RESET_PROMOTION: return initState$3.cloudPromotion;
		default: return state;
	}
}
function isSkipPromotionCalculation(state = initState$3.isSkipPromotionCalculation, action) {
	switch (action.type) {
		case CHANGE_SKIP_PROMOTION_CALCULATION_STATUS: return action.data;
		default: return state;
	}
}
function promotionCode(state = initState$3.promotionCode, action) {
	switch (action.type) {
		case SET_PROMO_CODE: return action.data;
		default: return state;
	}
}
function promotionCenterList(state = initState$3.promotionCenterList, action) {
	switch (action.type) {
		case SET_CLOUD_PROMOTION_LIST: return action.data;
		default: return state;
	}
}
function promotionCenterMetas(state = initState$3.promotionCenterMetas, action) {
	switch (action.type) {
		case SET_CLOUD_PROMOTION_METAS: return action.data;
		default: return state;
	}
}
function isOpenCloudPromotion(state = initState$3.isOpenCloudPromotion, action) {
	switch (action.type) {
		case CHANGE_CLOUD_PROMOTION_STATUS: return action.data;
		default: return state;
	}
}
function itemMatchCloudPromotion(state = initState$3.itemMatchCloudPromotion, action) {
	switch (action.type) {
		case SET_ITEM_MATCH_CLOUD_PROMOTION: return action.data;
		default: return state;
	}
}
function itemValidPromotion(state = initState$3.itemValidPromotion, action) {
	switch (action.type) {
		case SET_ITEM_VALID_PROMOTION: return action.data;
		default: return state;
	}
}
function kioskLocalDiscountPromotion(state = initState$3.kioskLocalDiscountPromotion, action) {
	switch (action.type) {
		case RECORD_KIOSK_DISCOUNT_PROMOTION: return action.data;
		default: return state;
	}
}
var promotion_default = combineReducers({
	promotionList,
	buyGifts,
	satisfyRules,
	buyGiftRule,
	buyDiscountRule,
	exchangePurchaseRule,
	orderDiscount,
	cloudPromotion,
	isSkipPromotionCalculation,
	promotionCode,
	promotionCenterList,
	promotionCenterMetas,
	isOpenCloudPromotion,
	itemMatchCloudPromotion,
	itemValidPromotion,
	kioskLocalDiscountPromotion
});
//#endregion
//#region source-snapshot/src/reducers/avocado.js
var initState$2 = {
	outletInfo: null,
	merchantCampaignList: [],
	memberShip: null,
	loyalty: null,
	itemVouchers: [],
	dollarValueVouchers: [],
	dollarPercentageVouchers: [],
	transactionCommitId: null,
	orderRewardId: null,
	thirdPartyCrmCommitId: null,
	rewards: null,
	vouchers: null,
	metaData: null,
	crmCustomerInfo: null,
	needCommit: false,
	rewardModalVisible: false,
	hasAssertList: false
};
function outletInfo(state = initState$2.outletInfo, action) {
	switch (action.type) {
		case SET_AD_OUTLET_INFO: return action.data;
		default: return state;
	}
}
function merchantCampaignList(state = initState$2.merchantCampaignList, action) {
	switch (action.type) {
		case SET_MERCHANT_CAMPAIGN_LIST: return action.data;
		default: return state;
	}
}
function memberShip(state = initState$2.memberShip, action) {
	switch (action.type) {
		case SET_MEMBERSHIP: return action.data;
		default: return state;
	}
}
function loyalty(state = initState$2.loyalty, action) {
	switch (action.type) {
		case SET_LOYALTY: return action.data;
		default: return state;
	}
}
function itemVouchers(state = initState$2.itemVouchers, action) {
	switch (action.type) {
		case SET_ITEM_VOUCHERS: return action.data;
		default: return state;
	}
}
function dollarValueVouchers(state = initState$2.dollarValueVouchers, action) {
	switch (action.type) {
		case SET_DOLLAR_VALUE_VOUCHERS: return action.data;
		default: return state;
	}
}
function dollarPercentageVouchers(state = initState$2.dollarPercentageVouchers, action) {
	switch (action.type) {
		case SET_DOLLAR_PERCENTAGE_VOUCHERS: return action.data;
		default: return state;
	}
}
function transactionCommitId(state = initState$2.transactionCommitId, action) {
	switch (action.type) {
		case SET_COMMIT_ID: return action.data;
		default: return state;
	}
}
function orderRewardId(state = initState$2.orderRewardId, action) {
	switch (action.type) {
		case SET_ORDER_REWARD_ID: return action.data;
		default: return state;
	}
}
function thirdPartyCrmCommitId(state = initState$2.thirdPartyCrmCommitId, action) {
	switch (action.type) {
		case SET_THIRD_PARTY_COMMIT_ID: return action.data;
		default: return state;
	}
}
function rewards(state = initState$2.rewards, action) {
	switch (action.type) {
		case SET_CRM_INTEGRATION_REWARD: return action.data;
		default: return state;
	}
}
function vouchers(state = initState$2.vouchers, action) {
	switch (action.type) {
		case SET_CRM_INTEGRATION_CUSTOMER_VOUCHERS: return action.data;
		default: return state;
	}
}
function metaData(state = initState$2.metaData, action) {
	switch (action.type) {
		case SET_SDK_META_DATA: return action.data;
		default: return state;
	}
}
function crmCustomerInfo(state = initState$2.crmCustomerInfo, action) {
	switch (action.type) {
		case SET_CRM_CUSTOMER_INFO: return action.data;
		default: return state;
	}
}
function needCommit(state = initState$2.needCommit, action) {
	switch (action.type) {
		case SET_NEED_COMMIT: return action.data;
		default: return state;
	}
}
function rewardModalVisible(state = initState$2.rewardModalVisible, action) {
	switch (action.type) {
		case CHANGE_REWARD_MODAL_VISIBLE: return action.data;
		default: return state;
	}
}
function hasAssertList(state = initState$2.hasAssertList, action) {
	switch (action.type) {
		case SET_AESERT_LIST_STATUS: return action.data;
		default: return state;
	}
}
var avocado_default = combineReducers({
	outletInfo,
	merchantCampaignList,
	memberShip,
	loyalty,
	itemVouchers,
	dollarValueVouchers,
	dollarPercentageVouchers,
	transactionCommitId,
	orderRewardId,
	thirdPartyCrmCommitId,
	rewards,
	vouchers,
	metaData,
	crmCustomerInfo,
	needCommit,
	rewardModalVisible,
	hasAssertList
});
//#endregion
//#region source-snapshot/src/reducers/posterPro.js
var initState$1 = {
	status: "enabled",
	posterData: [],
	currentBlock: null,
	currentPageData: null,
	version: "0.0.1",
	aspectRatio: ASPECT_RATIO,
	kioskMenuTree: []
};
function posterData(state = initState$1.posterData, action) {
	switch (action.type) {
		case SET_POSTER_DATA: return action.data;
		default: return state;
	}
}
function currentBlock(state = initState$1.currentBlock, action) {
	switch (action.type) {
		case SET_CURRENT_BLOCK: return action.data;
		default: return state;
	}
}
function currentPageData(state = initState$1.currentPageData, action) {
	switch (action.type) {
		case SET_CURRENT_PAGE: return action.data;
		default: return state;
	}
}
function status(state = initState$1.status, action) {
	switch (action.type) {
		case CHANGE_POSTER_STATUS: return action.data;
		default: return state;
	}
}
function kioskMenuTree(state = initState$1.kioskMenuTree, action) {
	switch (action.type) {
		case SET_KIOSK_MENU_TREE: return action.data;
		default: return state;
	}
}
var posterPro_default = combineReducers({
	posterData,
	currentBlock,
	currentPageData,
	status,
	kioskMenuTree
});
//#endregion
//#region source-snapshot/src/reducers/crmPromotionContrary.js
var initState = {
	crmPromotionContraryInfo: {
		visible: false,
		content: void 0,
		type: void 0
	},
	isPauseAutoValidatePromotion: false
};
function crmPromotionContraryInfo(state = initState.crmPromotionContraryInfo, action) {
	switch (action.type) {
		case CHANGE_CRM_PROMOTION_CONTRARY_INFO: return action.data;
		default: return state;
	}
}
function isPauseAutoValidatePromotion(state = initState.isPauseAutoValidatePromotion, action) {
	switch (action.type) {
		case SET_IS_PAUSE_AUTO_VALIDATE_PROMOTION: return action.data;
		default: return state;
	}
}
var crmPromotionContrary_default = combineReducers({
	crmPromotionContraryInfo,
	isPauseAutoValidatePromotion
});
//#endregion
//#region source-snapshot/src/reducers/ecard.js
var initialState = {
	settings: null,
	quickAmounts: [],
	cloudGiftCardItem: null,
	selectedCard: null,
	availableCards: [],
	lastQuery: null,
	loading: false
};
function ecard(state = initialState, action) {
	switch (action.type) {
		case SET_ECARD_SETTINGS: return {
			...state,
			settings: action.data
		};
		case SET_ECARD_QUICK_AMOUNTS: return {
			...state,
			quickAmounts: action.data
		};
		case SET_ECARD_CLOUD_GIFT_CARD_ITEM: return {
			...state,
			cloudGiftCardItem: action.data
		};
		case SET_SELECTED_ECARD: return {
			...state,
			selectedCard: action.data
		};
		case SET_AVAILABLE_ECARDS: return {
			...state,
			availableCards: action.data
		};
		case SET_ECARD_LAST_QUERY: return {
			...state,
			lastQuery: action.data
		};
		case SET_ECARD_LOADING: return {
			...state,
			loading: action.data
		};
		default: return state;
	}
}
//#endregion
//#region source-snapshot/src/reducers/index.js
var reducers_default = combineReducers({
	currentSaleItems,
	currentItem,
	currentCategory,
	currentCategoryList,
	menuGroup,
	freeListIsExpanded,
	comboMenu,
	requireCategory: requireCategoryList,
	currentOrder: order_default,
	language: language_default,
	merchantProfile,
	orderSequence,
	orderEdit: isOrderEdit_default,
	currentOrderCombo,
	taxList,
	systemConfig,
	img: img_default,
	sideNav: sideNav_default,
	menuItemList,
	itemSizeList,
	tempItemList,
	searchItem,
	searchKeyWord,
	keyboardToggle,
	tempCurrentCategory,
	lanModal: lanModal_default,
	allSysConfig,
	selfConfig: selfConfigMap,
	sysCookie: sysCookie_default,
	togoList,
	cardPaidResult: cardResult,
	giftCardPaymentInfo,
	socket: socket_default,
	brandSetting: brandSetting_default,
	crm: crm_default,
	cateDish: cateDish_default,
	promotion: promotion_default,
	avocado: avocado_default,
	posterPro: posterPro_default,
	crmPromotionContrary: crmPromotionContrary_default,
	ecard
});
//#endregion
export { reducers_default as default };
