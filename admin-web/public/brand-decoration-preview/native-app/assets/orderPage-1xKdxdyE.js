const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./categoryList-Cha55-qa.js","./toast-C8a1ReSo.js","./toast-oEOJ74Oh.css","./utils-Cdx9DbDR.js","./es-CFYDnMm2.js","./react-router-zXytb7Dz.js","./tiny-warning.esm-Cf7nlwXj.js","./setPrototypeOf-fzM5qJP3.js","./actions-BwRPwnFF.js","./native-store-B_9Z_F59.js","./kioskConfigApi-68IKDHob.js","./native-i18n-Bya1piKW.js","./i18nInstance-DFZX1Hui.js","./withTranslation-B2KLWeHY.js","./useTranslation-BJXMWyG7.js","./classnames-CpUpjBdR.js","./icon-CewZkCRp.js","./icon-B0ozedc9.css","./getStandardCateDish-BKfAMpZF.js","./isEqual-PfNrN1Me.js","./menuUpdatePosition-YdhPKLgg.js","./getItemCardProperties-CHuqwFqK.js","./handleCountRowNum-B73-PziM.js","./categoryList-CqE-JeTK.css","./currentItemList-Ozb4c9c4.js","./dialog-B9IyI7AU.js","./dialog-DX0HK5qt.css","./useCrmPromotionContrary-DFA1wQZz.js","./objectWithoutProperties-DDcNLcsK.js","./style-DWrLyeCr.js","./context-LOicZ8vw.js","./es-CH_mXwwY.js","./ContextIsolator-Dvyg17xX.js","./AntdIcon-bxYy9EiO.js","./genStyleUtils-Bvib8P-r.js","./hooks-DiifsOH5.js","./promotion-BUTvAW3c.js","./getPromotionCenterDisplayText-Bfjuriuq.js","./PromotionTagsWrap-CjrBw9bq.js","./getImageHost-CiGAQi_-.js","./PromotionTagsWrap-DY3fP8OM.css","./star-C6iOuR53.js","./star-Bawd9sot.css","./DescModal-Q1_miAgO.js","./VtKeyboard-THFka-J_.js","./VtKeyboard-BziWIHJP.css","./ButtonBase-CpioktX3.js","./createSvgIcon-DxdaFuGn.js","./DescModal-D4HzYle2.css","./orderDetailModal-CXMeGrAX.js","./moreTip-DweVCJKq.js","./orderDetailModal-CQCZ7ogS.css","./comboPanel-D4O1jWqz.js","./rotateLoading-ByQXAFnC.js","./getDeviceDirection-BKza3HeE.js","./process-Cqmrsqte.js","./LottiePlayer-CG-ciSfh.js","./comboPanel-Df_cWi36.css","./useCrmPromotionContrary-3Z5soLFb.css","./arrow-right-BJDuAGvX.js","./debounce-BPwiJQPb.js","./checkCRMIntegrationCampaign-Bubup5KG.js","./resolveCRMRewardItem-Du3vuEgI.js","./omit-DznhFjWg.js","./DescViewModal-CDcpjYEk.js","./DescViewModal-CeoUwqrr.css","./itemCard-A1oFTMZK.js","./itemCard-BIcTjMY_.css","./bottomToast-B74lRND-.js","./bottomToast-554wkuSX.css","./promotion-tag-B_BQp28s.js","./close-F8X4N7jn.js","./currentItemList-C0L4CTSt.css"])))=>i.map(i=>d[i]);
import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { C as getMarginappFetchConfig, H as EventBus, K as serverURL, N as saveOrder, V as __vitePreload, W as removeEmoji, a as getDeviceOrientation, c as judgeSskeyIsActiveTime, d as on, i as getCssValue, p as solveScrollElem, r as getCookie, t as compare, tt as systemLanguage, u as off } from "./utils-Cdx9DbDR.js";
import { d as useSelector, i as shallowEqual, r as connect, t as useDispatch } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { $i as floatNumberRounding, A as fetchCloudGiftCardItem, Bi as getOrderMemberPrices, Bt as setIsReorderFlag, Ct as setBrandMenu, Ei as getSatisfiedExchangePurchaseRules, Fr as isTotalQtyWithinStock, Gr as getOrderInfoObj, I as initCurrentOrderCombo, Ir as showInsufficientStockToast, Jr as isHasCRMCampaignFn, L as initEditOrderMode, Ln as saveGiftCardOrderBySoap, Lt as setGiftCardPaymentInfo, M as getCurrentItem, Nn as STANDARD_TOP, O as editOrderItemAction, Or as getCartItemQtyByStockId, Pt as setEditComboQty, Qi as Big, Rr as getItemStoppedStatus, Ti as getSatisfiedBuyGiftRules, Tt as setCateDish, Ut as setLanModal, Xr as checkCRMStatus, Z as removeFootItemComboSection, Zi as getItemPrice, _r as getMissingRequiredCategories, a as addItem2ComboSection, aa as getStockItemId, an as setSelfConfig, br as judegOrderDishIsHasSoldout, cn as setShowBannerPro, ct as removeSearchItem, da as require_cloneDeep, dn as setShowWaitingTimeModal, dr as getComboItemDetailInfo, dt as resetCurrentOrder, en as setOrderStatus, et as removeItemFromComboSection, fr as getComboSectionInfo, ft as resetCurrentOrderCombo, g as clearECardState, gr as getItemSizeName, h as clearCurrentItem, j as getCurrentCategory, la as getOrderItemCategory, li as crmIntegrationSDK, ln as setShowLoginGuideDialog, mi as getMemberCheckoutState, mn as setTabelServiceType, mr as getDishItemLanguage, n as addCampaignItemsToOrder, pi as getMemberActivityState, pr as getCurrentItemLanguage, pt as saveOrderResult, qi as GIFT_PROMOTION_TYPE, r as addCombo2Order, rn as setSelectedBrand, sn as setShowBanner, sr as allRangHandler, ti as checkIsRuleValid, u as changeDefaultDish, ua as isMembershipCard, ui as canUseMemberPrice, ut as replaceItemOrder, vr as getOneUncompletedSection, wn as spliceOrderBySoldout, wr as judgeHasDetailInfo, wt as setCardPaidResult, x as clearSearchKeyWord, xi as applyExchangePurchaseDiscount, xn as setkeyboardToggle, xr as judegStepIsHasMustDish, yi as checkCRMType, yr as judegIsComboStatusAndIsPreSelected, zi as getItemActualPrices, zr as itemIsSoldOut } from "./actions-BwRPwnFF.js";
import { t as Trans } from "./Trans-BKMH8GOf.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { l as RefIcon } from "./ContextIsolator-Dvyg17xX.js";
import { r as cart_bag_default } from "./useCrmPromotionContrary-DFA1wQZz.js";
import { i as preloadPosterImagesWithConcurrency, n as getPosterPrimaryItem, o as getKioskMenu_default, r as getUniquePosterImageUrls, s as BrandList_default, t as getBannerProImageSrc } from "./bannerProAssets-DUJFJj80.js";
import { t as backHomeModal_default } from "./backHomeModal-p8XgRZSA.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import "./VtKeyboard-THFka-J_.js";
import { t as require_debounce } from "./debounce-BPwiJQPb.js";
import { a as getOrderInfo, t as getChargeList } from "./apiPos-BvOUwi7i.js";
import { t as XMLObjTree } from "./ObjectTree-D9iCBoZ6.js";
import { i as LangSwitch_default } from "./MobyBattery-HWZsMM4L.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as LottiePlayer } from "./LottiePlayer-CG-ciSfh.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { i as handleCheckOrderPromotion, n as getSingleAutoApplicableFixedPricePromotion, r as getSingleItemSelectionPromotion } from "./hooks-DiifsOH5.js";
import { a as setBuyGifts, m as setSatisfyRules, u as setItemValidPromotion } from "./promotion-BUTvAW3c.js";
import { t as require_isEqual } from "./isEqual-PfNrN1Me.js";
import { t as ComboHeader_default } from "./ComboHeader-DCNVP6mw.js";
import { o as isValidUSPhone, s as normalizePhoneDigits } from "./phoneNumber-CPrZu7TP.js";
import { t as PhoneNumberEntryLayout } from "./PhoneNumberEntryLayout-DWDXd7Tb.js";
import { n as withMemberPrivilege, t as useMemberPrivilege } from "./useMemberPrivilege-BabAJmwD.js";
import { i as VariableSizeList, r as DishTag } from "./PromotionTagsWrap-CjrBw9bq.js";
import { a as getItemCardProperties, d as remToPx } from "./getItemCardProperties-CHuqwFqK.js";
import { a as benefitIcon_default, i as probeComboItemImages, n as imgCard_default, r as hasRealItemImage } from "./star-C6iOuR53.js";
import { c as require_Remove, d as shouldShowBenefitPrice, f as BenefitPrice, i as ItemOptionSelectWithSub_default, l as require_Add, n as arrow_left_default, o as require_Delete, p as BenefitPrice_module_default, r as fixComboOption_default, s as sizeOptionSelect_default, u as Fab_default } from "./DescModal-Q1_miAgO.js";
import { n as FallbackLoading } from "./comboPanel-D4O1jWqz.js";
import { t as IMG_HOST } from "./getImageHost-CiGAQi_-.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { n as requireCategoryTip_default, t as soldoutModal_default } from "./soldoutModal-CCd1O5t5.js";
import { n as notifyItemCardListScroll, t as itemCard_default } from "./itemCard-A1oFTMZK.js";
import { a as ComboOptionItem_default, i as noActivityTag_default, n as comboSelectionModal_default, o as comboSizeSelect_default, r as ComboCateyOptionItem_default, t as getComboSectionItem } from "./getComboSectionItem-BQc55mkq.js";
import { t as comboItemsDetailModal_default } from "./comboItemsDetailModal-W9qdOX-Y.js";
import { t as setComboItemBasePrice } from "./setComboItemBasePrice-B4XHluz0.js";
import { t as waitingInfo_default } from "./waitingInfo-s8_Ks5BC.js";
import { i as ItemPromotionModal_default, n as purchaseMembershipCard, r as removeMembershipCard, t as getMemberPricedCartItems } from "./memberCartPrices-h2WovEgt.js";
import { t as coin_smile_default } from "./coin_smile-DXCmPg65.js";
//#region source-snapshot/src/container/orderPage/footBtn/footBtn.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var footBtn_module_default = {
	footBtnBox: "footBtnBox___56UJ9",
	memberPriceBar: "memberPriceBar___5ppC9",
	cartIcon: "cartIcon___bQToJ",
	cart: "cart___vQfr4",
	count: "count___p40h4",
	cartAnimation: "cartAnimation___D5-W4",
	cartAdd: "cartAdd___PFNMh",
	countAnimation: "countAnimation___MXela",
	countAdd: "countAdd___9QVzi",
	actived: "actived___C4Qjl",
	noActived: "noActived___JXgxV",
	rightBtns: "rightBtns___0siV6",
	footContent: "footContent___8EC3U",
	hasDiscount: "hasDiscount___JilqP",
	text: "text___7DjJ9",
	total: "total___AKAyR",
	discountInfo: "discountInfo___ChuGZ",
	right_img: "right_img___zJI-I",
	savedInfo: "savedInfo___7txW8",
	saved: "saved___UPBrv",
	discountNum: "discountNum___nXxsw",
	footContentSameWidth: "footContentSameWidth___erlXJ"
};
//#endregion
//#region source-snapshot/src/utils/memberOrderSummary.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var getMemberOrderSummary = (state) => {
	const prices = getOrderMemberPrices(state.currentOrder.itemList);
	const eligible = canUseMemberPrice(state);
	const hasPointsDiscount = ["byPercentageOff", "byFixedAmount"].includes(state.crm?.selectedDiscount?.redeemRule?.strategy);
	const selectedDiscount = eligible && hasPointsDiscount ? getMemberActivityState(state).crm?.selectedDiscount : state.crm?.selectedDiscount;
	return {
		...prices,
		selectedDiscount,
		memberDiscount: eligible ? Math.max(0, Number(Big(prices.realPrice).minus(prices.realBenefitPrice).toFixed(2))) : 0,
		memberPayable: eligible && hasPointsDiscount ? Math.max(0, Number(Big(prices.realBenefitPrice).minus(selectedDiscount.actualDiscount || 0).toFixed(2))) : prices.realBenefitPrice
	};
};
//#endregion
//#region source-snapshot/src/component/PaidMemberPriceBar/PaidMemberPriceBar.module.scss
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var PaidMemberPriceBar_module_default = {
	bar: "bar___kUtWn",
	icon: "icon___7YWda",
	priceInfo: "priceInfo___6tZm1",
	label: "label___fDyPK",
	prices: "prices___-VX3U",
	login: "login___AeBJr"
};
//#endregion
//#region source-snapshot/src/component/PaidMemberPriceBar/index.jsx
var import_jsx_runtime = require_jsx_runtime();
var PERIOD_KEYS = {
	weeks: "paid-member-week",
	months: "paid-member-month",
	years: "paid-member-year"
};
var getJoinLabel = (paymentOption, t) => {
	const { price, expiration } = paymentOption !== null && typeof paymentOption === "object" && !Array.isArray(paymentOption) ? paymentOption : {};
	const amount = Number.isFinite(price) && price > 0 ? `$${Number(price.toFixed(2))}` : "";
	const periodKey = Object.prototype.hasOwnProperty.call(PERIOD_KEYS, expiration?.unit) ? PERIOD_KEYS[expiration.unit] : void 0;
	const details = [amount, expiration?.enabled === true && Number.isFinite(expiration.quantity) && expiration.quantity > 0 && periodKey ? t(amount && expiration.quantity === 1 ? `${periodKey}-unit` : periodKey, { count: expiration.quantity }) : expiration?.enabled === false ? t("paid-member-lifetime") : ""].filter(Boolean).join(amount ? "/" : "");
	return details ? t("paid-member-join-details", { details }) : t("paid-member-join");
};
function PaidMemberPriceBar({ className, style, onBeforeLogin }) {
	const pricingState = useSelector(({ currentOrder, crm, allSysConfig, avocado }) => ({
		currentOrder,
		crm,
		allSysConfig,
		avocado
	}), shallowEqual);
	const { currentOrder: { itemList }, crm } = pricingState;
	const dispatch = useDispatch();
	const purchasing = (0, import_react.useRef)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const { t } = useTranslation();
	const hasMemberPrivilege = useMemberPrivilege(crm);
	const card = crm.privileges?.[0];
	const paymentOption = card?.paymentOptions?.[0];
	const hasMembershipCard = itemList.some(isMembershipCard);
	const showJoin = !hasMemberPrivilege && !hasMembershipCard && card !== null && typeof card === "object" && !Array.isArray(card);
	if (crm.isHasBenefit !== true) return null;
	const prices = getMemberOrderSummary(pricingState);
	if (!prices.hasBenefitPrice) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: (0, import_classnames.default)(PaidMemberPriceBar_module_default.bar, className),
		style: {
			"--paid-member-bar-height": `12rem`,
			...style
		},
		onClick: (event) => event.stopPropagation(),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				className: PaidMemberPriceBar_module_default.icon,
				src: benefitIcon_default,
				alt: ""
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: PaidMemberPriceBar_module_default.priceInfo,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: PaidMemberPriceBar_module_default.label,
					children: t("paid-member-price")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: PaidMemberPriceBar_module_default.prices,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: `$${prices.memberPayable.toFixed(2)}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("del", { children: `$${prices.realPrice.toFixed(2)}` })]
				})]
			}),
			!crm.memberCRMInfo?.userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: PaidMemberPriceBar_module_default.login,
				onClick: (event) => {
					event.stopPropagation();
					onBeforeLogin?.();
					EventBus.emit("open_login_modal");
				},
				children: t("paid-member-login")
			}) : hasMembershipCard ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: PaidMemberPriceBar_module_default.login,
				onClick: (event) => {
					event.stopPropagation();
					dispatch(removeMembershipCard());
				},
				children: t("paid-member-remove")
			}) : showJoin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: PaidMemberPriceBar_module_default.login,
				disabled: loading,
				onClick: async (event) => {
					event.stopPropagation();
					if (purchasing.current) return;
					purchasing.current = true;
					setLoading(true);
					try {
						await dispatch(purchaseMembershipCard());
					} catch (error) {
						toast_default.info(error.message);
					} finally {
						purchasing.current = false;
						setLoading(false);
					}
				},
				children: getJoinLabel(paymentOption, t)
			}) : null
		]
	});
}
//#endregion
//#region source-snapshot/src/container/orderPage/footBtn/index.js
var FootBtnBox = class extends import_react.Component {
	state = {
		showModal: false,
		shouldAnimate: false,
		itemCount: 0,
		itemPromotionVisible: false,
		isHasSoldoutDish: false,
		dishMap: {},
		localPromotionOptions: [],
		autoOpenPromotionItems: false
	};
	getLocalPromotionOrderAmount = (itemList) => {
		const { currentCategoryList } = this.props;
		const pricedItems = getMemberCheckoutState({
			crm: this.props.crm,
			avocado: this.props.avocado,
			allSysConfig: this.props.store.allSysConfig,
			currentOrder: { itemList: itemList || [] }
		}).currentOrder.itemList;
		return Number(pricedItems.filter((item) => !item.isLocalExchangePurchaseItem).filter((item) => {
			return getOrderItemCategory(currentCategoryList, item)?.applicableToTriggerPromotion;
		}).reduce((total, item) => Big(total).plus(Big(getItemPrice(item) || 0).times(item.quantity || 0)), Big(0)).toFixed(2));
	};
	getSatisfiedLocalPromotionOptions = () => {
		const { t, currentOrder, crm: { selectedDiscount, selectedFreeItem }, promotion: { buyGiftRule, buyGifts, exchangePurchaseRule, isSkipPromotionCalculation } } = this.props;
		const hasCrmCampaign = isHasCRMCampaignFn({
			itemList: currentOrder.itemList,
			selectedFreeItem,
			selectedDiscount
		});
		if (isSkipPromotionCalculation || hasCrmCampaign) return [];
		if (buyGifts?.length > 0 || currentOrder.itemList.some((item) => item.isLocalExchangePurchaseItem)) return [];
		const normalItems = currentOrder.itemList.filter((item) => !item.isLocalExchangePurchaseItem);
		const buyGiftOptions = getSatisfiedBuyGiftRules(buyGiftRule, normalItems).map((rule) => ({
			kind: "buyGift",
			rule,
			displayName: t("buy-x-give-n", {
				buyNumber: rule.activityRule?.buyNumber,
				giftsNumber: rule.activityRule?.giftsNumber
			})
		}));
		const exchangeOptions = getSatisfiedExchangePurchaseRules(exchangePurchaseRule, normalItems, this.getLocalPromotionOrderAmount(normalItems)).map((rule) => {
			const { activityRule = {} } = rule;
			const discount = activityRule.discountType === "fixDiscount" ? `$${activityRule.discountNumber}` : `${activityRule.discountNumber}%`;
			return {
				kind: "exchangePurchase",
				rule,
				displayName: t(activityRule.conditionType === "orderAmount" ? "exchangeOrderDeal" : "exchangeItemDeal", {
					price: activityRule.satisfyPrice,
					buyNumber: activityRule.buyNumber,
					giftsNumber: activityRule.giftsNumber,
					giftsTypeLabel: t(activityRule.giftsType),
					discount
				})
			};
		});
		return [...buyGiftOptions, ...exchangeOptions];
	};
	static getDerivedStateFromProps(nextProps, prevState) {
		let itemCount = nextProps.currentOrder.itemList.reduce((sum, item) => sum + item.quantity, 0);
		const freeItemCount = nextProps.crm?.selectedFreeItem?.length || 0;
		itemCount += freeItemCount;
		if (itemCount !== prevState.itemCount) return { itemCount };
		return null;
	}
	handleContinue = () => {
		const { resetCurrentOrder, history } = this.props;
		this.setState({ showModal: false });
		resetCurrentOrder();
		history.goBack();
	};
	handleCancel = () => {
		this.setState({ showModal: false });
	};
	componentDidUpdate(prevProps, prevState) {
		if (prevState.itemCount < this.state.itemCount) this.setState({ shouldAnimate: true }, () => {
			this.animationTimer = setTimeout(() => {
				this.setState({ shouldAnimate: false });
			}, 500);
		});
		if (prevProps.currentOrder !== this.props.currentOrder || prevProps.selfConfig?.soldOut !== this.props.selfConfig?.soldOut || prevProps.menuItemList !== this.props.menuItemList) this.checkSoldout();
	}
	componentWillUnmount() {
		if (this.animationTimer) clearTimeout(this.animationTimer);
	}
	componentDidMount() {
		this.checkSoldout();
	}
	handleCheckPromotionCenter = async (localPromotionOptions = []) => {
		const { promotion: { itemValidPromotion, promotionCenterList, promotionCenterMetas, promotionCode }, history: { push }, setItemValidPromotion, merchantProfile } = this.props;
		const openPromotionModalOrReview = () => {
			if (!localPromotionOptions.length) return push("/orderReview");
			this.setState({
				itemPromotionVisible: true,
				localPromotionOptions
			});
		};
		const onCheckSuccess = (validateRes) => {
			if (!validateRes?.length) {
				setItemValidPromotion(null);
				return openPromotionModalOrReview();
			}
			if (validateRes?.every((item) => item?.promotion?.promotionCodes?.length)) {
				if (!(promotionCode && validateRes?.some((item) => item?.promotion?.promotionCodes?.includes(promotionCode)))) return openPromotionModalOrReview();
			}
			const afterCheckValidatePromotion = validateRes?.map((r) => {
				if (itemValidPromotion?.find((e) => e.isSelected && e.promotion.id === r.promotion.id)) {
					const isStillValid = checkIsRuleValid(r.validateInfo);
					return {
						...r,
						isSelected: isStillValid
					};
				}
				return r;
			});
			setItemValidPromotion(afterCheckValidatePromotion);
			const autoApplicablePromotion = getSingleAutoApplicableFixedPricePromotion(afterCheckValidatePromotion, promotionCode);
			const hasCrmCampaign = isHasCRMCampaignFn({
				itemList: this.props.currentOrder.itemList,
				selectedFreeItem: this.props.crm.selectedFreeItem,
				selectedDiscount: this.props.crm.selectedDiscount
			}) || this.props.crm.tempCampaign?.length > 0;
			if (autoApplicablePromotion && !hasCrmCampaign) {
				setItemValidPromotion([{
					...autoApplicablePromotion,
					isSelected: true
				}]);
				return push("/orderReview");
			}
			if (getSingleItemSelectionPromotion(afterCheckValidatePromotion, promotionCode)) {
				this.setState({
					itemPromotionVisible: true,
					autoOpenPromotionItems: true,
					localPromotionOptions: []
				});
				return;
			}
			if (afterCheckValidatePromotion?.length === 1 && afterCheckValidatePromotion?.[0]?.isSelected && !GIFT_PROMOTION_TYPE.includes(afterCheckValidatePromotion?.[0]?.promotion?.type)) return push("/orderReview");
			this.setState({ itemPromotionVisible: true });
		};
		const onCheckFailed = () => {
			setItemValidPromotion(null);
			return openPromotionModalOrReview();
		};
		if (!promotionCenterList?.length) {
			setItemValidPromotion(null);
			return openPromotionModalOrReview();
		}
		await handleCheckOrderPromotion({
			promotionCenterList,
			promotionCenterMetas,
			onCheckSuccess,
			onCheckFailed,
			merchantId: merchantProfile?.merchantId
		});
	};
	handleClosePromotionModal = () => {
		this.setState({
			itemPromotionVisible: false,
			localPromotionOptions: [],
			autoOpenPromotionItems: false
		});
	};
	handleSkipPromotion = () => {
		this.handleClosePromotionModal();
		this.props.history.push("/orderReview");
	};
	handleSelectPromotion = (rule) => {
		const { promotion: { itemValidPromotion }, setItemValidPromotion } = this.props;
		const updatedItemPromotion = itemValidPromotion?.map((each) => {
			return {
				...each,
				isSelected: each.promotion.id === rule.promotion.id ? true : void 0
			};
		});
		setItemValidPromotion(updatedItemPromotion);
		this.handleSkipPromotion();
	};
	handleSelectLocalPromotion = ({ kind, rule, selection }) => {
		const { currentOrder, setItemValidPromotion, setBuyGifts, setSatisfyRules, addCampaignItemsToOrder } = this.props;
		setItemValidPromotion(null);
		if (kind === "buyGift") {
			setSatisfyRules([rule]);
			setBuyGifts(selection);
		} else {
			const normalItems = currentOrder.itemList.filter((item) => !item.isLocalExchangePurchaseItem);
			const exchangeItems = selection.flatMap((promotion) => (promotion.items || []).map((item) => applyExchangePurchaseDiscount(item, rule)));
			addCampaignItemsToOrder([...normalItems, ...exchangeItems]);
		}
		this.handleSkipPromotion();
	};
	handleViewOrder = async () => {
		const { history: { push }, promotion: { promotionCenterList, buyGifts }, currentOrder, requireCategory } = this.props;
		const { itemCount } = this.state;
		if (itemCount > 0) {
			const [firstMissingCategory] = getMissingRequiredCategories(requireCategory, currentOrder.itemList);
			if (firstMissingCategory) {
				EventBus.emit("navigate_to_required_category", firstMissingCategory.id);
				this.props.onMissingRequiredCategory?.();
				return;
			}
			if (buyGifts?.length > 0 || this.props.currentOrder.itemList.some((item) => item.isLocalExchangePurchaseItem)) return push("/orderReview");
			const localPromotionOptions = this.getSatisfiedLocalPromotionOptions();
			if (!(promotionCenterList?.length > 0 || localPromotionOptions.length > 0)) return push("/orderReview");
			await this.handleCheckPromotionCenter(localPromotionOptions);
		}
	};
	checkSoldout = () => {
		const { currentOrder } = this.props;
		const dishMap = judegOrderDishIsHasSoldout((0, import_cloneDeep.default)(currentOrder?.itemList || []));
		if (dishMap?.slodoutList?.length) this.setState({
			dishMap,
			isHasSoldoutDish: true
		});
	};
	continueReorder = () => {
		if (this?.state?.dishMap?.allSoldIds?.length) this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
		this.setState({ isHasSoldoutDish: false });
	};
	render() {
		const { t, store, currentOrder, crm: { selectedFreeItem }, promotion: { itemValidPromotion } } = this.props;
		const { itemCount, shouldAnimate, itemPromotionVisible, isHasSoldoutDish, dishMap, localPromotionOptions } = this.state;
		const orderInfo = getOrderInfoObj(store);
		const { selectedDiscount, memberDiscount } = getMemberOrderSummary(store);
		let discount = orderInfo?.orderDiscount || 0;
		if (selectedDiscount?.actualDiscount) discount += selectedDiscount?.actualDiscount;
		let freeItemPrice = 0;
		if (selectedFreeItem) {
			const freeItemDiscount = selectedFreeItem.reduce((pre, cur) => {
				const itemPrice = getItemPrice({
					...cur,
					price: cur.itemPrices?.length ? 0 : cur.freeItemOriginPrice
				});
				return pre + (cur.freeItemOriginPrice != null ? itemPrice : itemPrice || cur.totalPrice || 0);
			}, 0);
			discount += freeItemDiscount;
			freeItemPrice = freeItemDiscount;
		}
		const freeItemInOrder = currentOrder?.itemList?.find((item) => item.isFreeItem);
		if (freeItemInOrder) if (freeItemInOrder.hasOwnProperty("freeItemOriginPrice")) {
			const freeItemOrderTotalPrice = Big(getItemPrice({
				...freeItemInOrder,
				price: freeItemInOrder.itemPrices?.length ? 0 : freeItemInOrder.freeItemOriginPrice
			})).times(freeItemInOrder.quantity).toNumber();
			discount += freeItemOrderTotalPrice;
			freeItemPrice = freeItemOrderTotalPrice;
		} else {
			discount += freeItemInOrder.totalPrice || 0;
			freeItemPrice = freeItemInOrder.totalPrice;
		}
		const bundleDiscountItems = currentOrder?.itemList.filter((each) => each.isCRMIntegrationBundleDiscountItem || each.isCRMIntegrationSpecialItem);
		if (bundleDiscountItems?.length > 0) {
			const bundleItemsDiscount = bundleDiscountItems.reduce((pre, cur) => {
				return Number(Big(pre).plus(cur.actualDiscount || 0).toFixed(2));
			}, 0);
			discount += bundleItemsDiscount || 0;
		}
		const promotionRewardItems = currentOrder?.itemList.filter((e) => e.promotionRewardItem);
		if (promotionRewardItems?.length > 0) {
			const promotionItemsDiscount = promotionRewardItems.reduce((pre, cur) => {
				return Number(Big(pre).plus(cur.actualDiscount || 0).toFixed(2));
			}, 0);
			discount += promotionItemsDiscount || 0;
		}
		const savedDiscount = Number(Big(discount).plus(memberDiscount).toFixed(2));
		const hasDiscount = savedDiscount > 0;
		let subTotal = orderInfo?.orderSubtotal?.toFixed(2);
		if (discount > 0) {
			subTotal = Big(subTotal).plus(freeItemPrice).minus(discount)?.toFixed(2);
			subTotal = Number(subTotal) < 0 ? `0.00` : subTotal;
		}
		const saveUpto = itemValidPromotion?.find((e) => e.isSelected && e.discountAmount >= e.promotion?.activityRule[0]?.maxAmount && e.promotion?.activityRule[0]?.maxAmount);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: footBtn_module_default.footBtnBox,
				onClick: this.handleViewOrder,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaidMemberPriceBar, { className: footBtn_module_default.memberPriceBar }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: footBtn_module_default.cartIcon,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: cart_bag_default,
							className: `${footBtn_module_default.cart} ${shouldAnimate ? footBtn_module_default.cartAnimation : ""}`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: `${footBtn_module_default.count} ${shouldAnimate ? footBtn_module_default.countAnimation : ""}`,
							children: itemCount
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: footBtn_module_default.rightBtns,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: [
								footBtn_module_default.footContent,
								hasDiscount && footBtn_module_default.hasDiscount,
								itemCount > 0 ? `${footBtn_module_default.actived} linear-animate-btn` : footBtn_module_default.noActived
							].join(" "),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: footBtn_module_default.text,
									children: t("viewOrder")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: footBtn_module_default.total,
									children: `$${subTotal}`
								}),
								hasDiscount && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: footBtn_module_default.discountInfo,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										className: footBtn_module_default.right_img,
										src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHcAAABeCAYAAAAZmot0AAAACXBIWXMAACE4AAAhOAFFljFgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMtSURBVHgB7dzbbdwwEIVhygWkgnSQdoIUElcVwAUESB2BCwjcQBpY89iivavVhaR4mRmeHyAMwy+SPqzXXonjHGOsX5fL5Ytj9vKwj349+/XNMTvNsC/zIrCVFrBZwJNj4gKs//Jz48f//fo+TdNfdxBxhXUAG4oCJq6gImFDh8DEFVIibGgXmLgCyoQNbQITt3MnYUOrwMTtWCHY0B0wcTtVGDZ0A0zcDlWCDX0AE7dxlWFD78CONasRbOgfcRvVGJav3FZ1geV7bv16weIb4lasJywibqV6wyLiVkgCLCJu4aTAIuIWTBIsIm6hpMEi4hZIIiwi7smkwiLinkgyLCJuZtJhEXEz0gCLiJuYFlhE3IQ0wSLiRqYNFhE3Io2wiLgHaYVFxN1JMywi7kbaYRFxV7IAi4i7yAosIu5VlmARceeswaIHlxHmIvn1ZGW6ikVYlPzKnQdePfkF2GYHWiursCgJdwEbUgtsGRZF427AhtQBW4dFUbgHsCE1wCPAokPcSNiQeOBRYNEubiJsSCzwSLBoEzcTNiQOeDRYtIp7EjYkBnhEWHSHWwg21P1ER4VFN7iFYUPdTnhkWPSBWwk21PzER4dFb7iVYUPNLgBh35tm2D9+fXX1q34hCPvZgz8wHOAv16a33xC17iYR9rbr91xclEfXpuIXhrD3Lf9aVglM2PXW/s9VBUzY7bY+oVIBTNj99j5bFg1M2OOO7gqJBCZsXDH3c0UBEza+2CcxRAATNq2UZ6i6AhM2vdSnH7sAEzavnOeWWwP/9uuHa5MZWJS1naQxcKtMwaLsvULGgM3BolMbwYwAm4RFp3f5KQc2C4uKbOFUCmwaFhXbn6sM2DwsKrr5WgnwELCo+M564cDDwKIqYxOEAg8Fi6rNxBAGPBwsqjrwRAjwkLCo+jSbzsDDwqImo4o6AQ8Ni5rNodL+XLTGmg4ZawRM2LnmE+QqAxP2qi7jASsBE3ZRt9mPhYEJu1LXwZ6FgAm7UfeprSeBCbuTiJG8mcCEPUjMvOVEYMJGJGqYdiQwYSMTNyn9AJiw2gOwXy+L9XwxMpl9+BbAhLXWDEzYzF4B/1cNH6bO2mIAAAAASUVORK5CYII=",
										alt: "right sign"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: footBtn_module_default.savedInfo,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: footBtn_module_default.saved,
											children: saveUpto ? t("save_up_to") : t("saved")
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: footBtn_module_default.discountNum,
											children: ["$", savedDiscount.toFixed(2)]
										})]
									})]
								})
							]
						})
					})
				]
			}),
			itemPromotionVisible && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemPromotionModal_default, {
				visible: itemPromotionVisible,
				skipOnKeepCampaign: true,
				onConfirm: this.handleSelectPromotion,
				onSkip: this.handleSkipPromotion,
				onClose: this.handleClosePromotionModal,
				localPromotionOptions,
				autoOpenItems: this.state.autoOpenPromotionItems,
				onConfirmLocalPromotion: this.handleSelectLocalPromotion
			}),
			isHasSoldoutDish ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(soldoutModal_default, {
				isHasSoldoutDish,
				dishMap,
				inOrderPage: true,
				continueReorder: this.continueReorder
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(backHomeModal_default, {
				isGoBack: true,
				isShowModal: this.state.showModal,
				handleContinue: this.handleContinue,
				handleCancel: this.handleCancel
			})
		] });
	}
};
function mapStateToProps$12(state) {
	return {
		store: state,
		currentOrder: state.currentOrder,
		crm: state.crm,
		avocado: state.avocado,
		promotion: state.promotion,
		merchantProfile: state.merchantProfile,
		selfConfig: state.selfConfig,
		menuItemList: state.menuItemList,
		currentCategoryList: state.currentCategoryList,
		requireCategory: state.requireCategory
	};
}
var footBtn_default = withRouter(connect(mapStateToProps$12, {
	resetCurrentOrder,
	setItemValidPromotion,
	setBuyGifts,
	setSatisfyRules,
	addCampaignItemsToOrder,
	spliceOrderBySoldout
})(withMemberPrivilege(withTranslation()(FootBtnBox))));
var changeBrandBtn_module_default = {
	changeBrandAnchor: "changeBrandAnchor___aNRxW",
	changeBrandBtn: "changeBrandBtn___bvVGn"
};
//#endregion
//#region source-snapshot/src/container/orderPage/changeBrandBtn/index.js
var { handleGetBrandMenu } = getKioskMenu_default;
var ChangeBrandBtn = ({ t, selfConfig, menuGroup, currentOrder, setSelectedBrand, setBrandMenu }) => {
	const [showBrandList, setShowBrandList] = (0, import_react.useState)(false);
	if (!selfConfig?.configList?.find((config) => config.id === 26)?.value) return null;
	const { brandManage } = selfConfig;
	const handleOpenBrandOption = () => {
		setShowBrandList(true);
	};
	const closeBrandList = (brand) => {
		setShowBrandList(false);
		if (!brand) return;
		const { dishIds } = brand;
		setBrandMenu(handleGetBrandMenu(menuGroup, dishIds));
		setSelectedBrand(brand);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: changeBrandBtn_module_default.changeBrandAnchor,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: changeBrandBtn_module_default.changeBrandBtn,
			onClick: handleOpenBrandOption,
			children: t("changeBrand")
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		visible: showBrandList,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandList_default, {
			brandManage,
			menuGroup,
			currentOrder,
			selfConfig,
			onClose: closeBrandList
		})
	})] });
};
function mapStateToProps$11(state) {
	return {
		selfConfig: state.selfConfig,
		menuGroup: state.menuGroup,
		currentOrder: state.currentOrder
	};
}
var changeBrandBtn_default = connect(mapStateToProps$11, {
	setSelectedBrand,
	setBrandMenu
})(withTranslation()(ChangeBrandBtn));
var orderPage_module_default = {
	tipBoxShake: "tipBoxShake___y2NRg",
	shakeRequiredCategoryTip: "shakeRequiredCategoryTip___AEtuI",
	orderPageLoading: "orderPageLoading___CEBA2",
	loadingText: "loadingText___PlK68",
	itemName: "itemName___qG7sm",
	orderPage: "orderPage___XET-w",
	orderPageBody: "orderPageBody___QFzHy",
	emptyWrapper: "emptyWrapper___fSAXv",
	topMenu: "topMenu___UY1p-",
	orderPageRequire: "orderPageRequire___VgGro",
	bannerWrapper: "bannerWrapper___oL5qG",
	banner: "banner___rNznz",
	start: "start___KfyIw",
	waitingTimeWrapper: "waitingTimeWrapper___r-7ox",
	waitingTimeImg: "waitingTimeImg___djkBJ",
	gotIt: "gotIt___S-J1K"
};
var bannerPro_module_default = {
	bannerProBox: "bannerProBox___lzzTh",
	countComp: "countComp___2tTQV",
	countImg: "countImg___nvuV6",
	countNum: "countNum___VR6BL",
	continueOrderFallback: "continueOrderFallback___hl0pg",
	memberPriceBar: "memberPriceBar___uVAE-",
	cartWrapper: "cartWrapper___Pqin1",
	cartItemList: "cartItemList___u72PT",
	orderItem: "orderItem___0-QBX",
	orderItemInfo: "orderItemInfo___dbO9P",
	orderItemImage: "orderItemImage___oPf6B",
	textInfo: "textInfo___qZ28l",
	name: "name___5e-ne",
	price: "price___8rMCE",
	calcBox: "calcBox___Fz74Y",
	muiDiyIcon: "muiDiyIcon___RAKoj",
	btnDel: "btnDel___MTmQ1",
	btnDis: "btnDis___KHa5T",
	btnEn: "btnEn___m9l9I",
	qty: "qty___-y4rc",
	"continue": "continue___MpSHy",
	noData: "noData___TqPCC"
};
//#endregion
//#region source-snapshot/src/container/orderPage/bannerPro/components/detailModal.module.scss
var import_Add = /* @__PURE__ */ __toESM(require_Add());
var import_Remove = /* @__PURE__ */ __toESM(require_Remove());
var import_Delete = /* @__PURE__ */ __toESM(require_Delete());
var detailModal_module_default = {
	drawBody: "drawBody___cfclu",
	header: "header___pL6vR",
	backPrePage: "backPrePage___gvcse",
	navigateRight: "navigateRight___BH0dK",
	langIcon: "langIcon___LQnu8",
	contentTopBox: "contentTopBox___GY30I",
	maxNote: "maxNote___wNQcl",
	basicInfo: "basicInfo___cXNyS",
	leftBox: "leftBox___-R0Wm",
	rightBox: "rightBox___VMiog",
	comboItemsName: "comboItemsName___0UxdA",
	singlePrice: "singlePrice___sg3x2",
	textContent: "textContent___-FSgx",
	iconEmpty: "iconEmpty___ojjlZ",
	area: "area___8zBCV",
	price: "price___TRn5V",
	word: "word___aZIm8",
	title: "title___6jJkB",
	required: "required___-wrWx",
	require: "require___iPA94",
	areaFixCombo: "areaFixCombo___-Y3jf",
	foot: "foot___ZRRHB",
	countBtn: "countBtn___r5-ub",
	muiDiyIcon: "muiDiyIcon___0y8qQ",
	count: "count___CWNYa",
	btnDis: "btnDis___ePwv2",
	btnEn: "btnEn___1KOE-",
	addCart: "addCart___0R-pl",
	pointImg: "pointImg___ZKBRq",
	addCartDisabled: "addCartDisabled___elg-o"
};
//#endregion
//#region source-snapshot/src/container/orderPage/bannerPro/components/detail.js
var defaultMax$3 = 99;
var MemoDishTag$1 = (0, import_react.memo)(DishTag);
var DetailModal = class extends import_react.Component {
	constructor() {
		super();
		this.state = {
			isOpenLanSwitch: false,
			isOpenMulLanSelect: false,
			maxNum: defaultMax$3,
			defaultItemSizeId: -1,
			toggleSizePanel: false,
			toggleItemDetailPanel: false,
			keyboardValue: "",
			sizeInfo: {},
			options: [],
			totalPrice: "0.00",
			keyboardToggle: false,
			chooseNum: 1,
			isScroll: false,
			isShowMore: false,
			descVisible: false,
			showRequired: false
		};
		this.itemOptionChild = {};
		this.flag = false;
	}
	handleResetEmpty = () => {
		this.setState({ keyboardValue: "" });
	};
	changeSize = (sizeInfo) => {
		this.setState({ sizeInfo }, () => this.calPrice());
	};
	viewOrderPanel = () => {
		const { currentCategoryList, itemInfo } = this.props;
		const { defaultItemSizeId: preSelectItemSize } = itemInfo;
		let options = [];
		if (itemInfo?.options?.length) options = options.concat(itemInfo.options);
		const itemCategoryId = itemInfo.isFreeItem ? itemInfo.oCategoryId : itemInfo.categoryId;
		if (currentCategoryList?.length && itemCategoryId) {
			let result = currentCategoryList.find((cate) => cate.id == itemCategoryId);
			if (result?.options?.length) options = options.concat(result.options);
		}
		let defaultItemSizeId;
		if (itemInfo?.itemPrices?.length) {
			const isExist = itemInfo.itemPrices.find((each) => each.sizeId === preSelectItemSize);
			let minObj = itemInfo.itemPrices[0];
			itemInfo.itemPrices.forEach((p) => {
				if (p.price < minObj.price) minObj = p;
			});
			defaultItemSizeId = isExist ? preSelectItemSize : null;
		}
		if (itemInfo?.sectionDetail?.length) itemInfo.sectionDetail.forEach((p) => {
			if (p.id == -1) defaultItemSizeId = p.sizeInfo.sizeId;
		});
		this.setState({
			defaultItemSizeId,
			options,
			keyboardValue: itemInfo.remark && itemInfo.remark.optionName || "",
			sizeInfo: {},
			totalPrice: "0.00"
		}, () => {
			solveScrollElem(true);
			this.calPrice();
		});
	};
	closePanel = () => {
		const { onCloseModal } = this.props;
		solveScrollElem(false);
		this.setState({
			isScroll: false,
			isShowMore: false,
			keyboardToggle: false,
			chooseNum: 1,
			keyboardValue: "",
			sizeInfo: {},
			totalPrice: "0.00"
		});
		onCloseModal?.();
	};
	calFixItemPrice = () => {
		let fixItemPrice = Big(0);
		const { itemInfo, currentCategoryList, currentOrder } = this.props;
		if (itemInfo?.comboType === "FIXED_SELECTION" && itemInfo?.comboSections?.length) {
			let orderType = currentOrder.orderType;
			itemInfo.comboSections.forEach((cs) => {
				if (cs.priceRule == "ADJUSTABLE_PRICE") {
					if (cs.comboSectionSaleItems) cs.comboSectionSaleItems.forEach((csItem) => {
						const sItem = (0, import_cloneDeep.default)(getComboItemDetailInfo(csItem.saleItemId, currentCategoryList));
						if (sItem) {
							if (sItem.itemPrices) {
								if (orderType == "DINE_IN") {
									let dineInList = sItem.itemPrices.filter((f) => f.type == "DINE_IN");
									if (dineInList.length) sItem.itemPrices = (0, import_cloneDeep.default)(dineInList);
									else {
										let AllList = sItem.itemPrices.filter((f) => f.type == "ALL");
										if (AllList.length) sItem.itemPrices = (0, import_cloneDeep.default)(AllList);
										else {
											delete sItem.itemPrices;
											sItem.price = sItem.price ? sItem.price : 0;
										}
									}
								} else if (orderType == "TO_GO") {
									let togoList = sItem.itemPrices.filter((f) => f.type == "TOGO");
									if (togoList.length) sItem.itemPrices = (0, import_cloneDeep.default)(togoList);
									else {
										let AllList = sItem.itemPrices.filter((f) => f.type == "ALL");
										if (AllList.length) sItem.itemPrices = (0, import_cloneDeep.default)(AllList);
										else {
											delete sItem.itemPrices;
											sItem.price = sItem.price ? sItem.price : 0;
										}
									}
								} else if (orderType == "PICK_UP") {
									let pickUpList = sItem.itemPrices.filter((f) => f.type == "PICKUP");
									if (pickUpList.length) sItem.itemPrices = (0, import_cloneDeep.default)(pickUpList);
									else {
										let AllList = sItem.itemPrices.filter((f) => f.type == "ALL");
										if (AllList.length) sItem.itemPrices = (0, import_cloneDeep.default)(AllList);
										else {
											delete sItem.itemPrices;
											sItem.price = sItem.price ? sItem.price : 0;
										}
									}
								}
							}
							if (sItem && sItem.itemPrices && sItem.itemPrices.length) {
								let minObj = sItem.itemPrices[0];
								sItem.itemPrices.forEach((p) => {
									if (p.price < minObj.price) minObj = p;
								});
								fixItemPrice = fixItemPrice.plus(minObj.price);
							} else fixItemPrice = fixItemPrice.plus(sItem.price);
						}
					});
				}
			});
		}
		return fixItemPrice;
	};
	calPrice = () => {
		const { state } = this.itemOptionChild;
		const { itemInfo } = this.props;
		const { chooseNum, sizeInfo } = this.state;
		let isItemPrice = (itemInfo?.itemPrices)?.length > 0;
		let totalPrice = "0.00";
		let optionTotalPrice = Big(0);
		if (state?.selectedItemList?.length) state?.selectedItemList.map((item) => {
			optionTotalPrice = optionTotalPrice.plus(item.isFreeItem ? 0 : item.price);
		});
		optionTotalPrice = optionTotalPrice.plus(this.calFixItemPrice());
		if (!isItemPrice) totalPrice = optionTotalPrice.plus(itemInfo?.price).times(chooseNum).toFixed(2);
		else if (sizeInfo?.price) totalPrice = optionTotalPrice.plus(sizeInfo?.price).times(chooseNum).toFixed(2);
		if (totalPrice == "NaN") this.setState({ totalPrice: "0.00" });
		else this.setState({ totalPrice });
	};
	addOrder = () => {
		const { t, currentOrder, itemInfo, currentCategoryList } = this.props;
		const stoppedStatus = getItemStoppedStatus(itemInfo);
		if (stoppedStatus) {
			toast_default.info(t(stoppedStatus === "unavailable" ? "dish-item-unavailable" : "dish-sold-out", { item: itemInfo.name }));
			return;
		}
		const { state, showRuleToast } = this.itemOptionChild;
		const { chooseNum, keyboardValue, sizeInfo } = this.state;
		itemInfo.remark.optionName = keyboardValue;
		const itemPrice = itemInfo?.itemPrices;
		let isItemPrice = itemPrice && itemPrice.length > 0;
		itemInfo.quantity = chooseNum;
		const tempItem = Object.assign({}, itemInfo);
		tempItem.sectionDetail = [];
		if (isItemPrice && !Object.keys(sizeInfo).length) {
			toast_default.info(t("choose-size"));
			this.setState({ showRequired: true });
			return;
		}
		const options = itemInfo.options || [];
		for (let option of options) if (option.min > 0) {
			if ((state?.selectedItemList?.reduce((acc, item) => {
				if (item.itemOptionId === option.id) acc = acc + item.quantity;
				return acc;
			}, 0) || 0) < option.min) {
				showRuleToast?.(option);
				return;
			}
		}
		showRuleToast?.(null);
		let opts_2 = {
			id: -2,
			options: []
		};
		let opts_3 = {
			id: -3,
			options: []
		};
		if (state?.selectedItemList?.length) {
			state?.selectedItemList.map((item) => {
				if (item?.menuCategoryId) opts_3.options.push({
					...item,
					quantity: 1
				});
				else opts_2.options.push({
					...item,
					quantity: 1
				});
			});
			if (opts_2.options.length) {
				opts_2.options.sort(compare("id"));
				tempItem.sectionDetail.push(opts_2);
			}
			if (opts_3.options.length) {
				opts_3.options.sort(compare("id"));
				tempItem.sectionDetail.push(opts_3);
			}
		}
		if (tempItem?.comboType === "FIXED_SELECTION" && tempItem.comboSections && tempItem.comboSections.length) {
			let orderType = currentOrder.orderType;
			tempItem.comboSections.forEach((cs) => {
				let fixObj = {
					id: cs.id,
					items: []
				};
				if (cs.comboSectionSaleItems) cs.comboSectionSaleItems.forEach((csItem) => {
					let sItem = (0, import_cloneDeep.default)(getComboItemDetailInfo(csItem.saleItemId, currentCategoryList));
					if (sItem) {
						sItem.remark = {
							optionName: "",
							optionType: "NOTE",
							quantity: 1,
							price: 0
						};
						sItem.quantity = 1;
						sItem.selectedOptionList = [];
						if (sItem.itemPrices) {
							if (orderType == "DINE_IN") {
								let dineInList = sItem.itemPrices.filter((f) => f.type == "DINE_IN");
								if (dineInList.length) sItem.itemPrices = (0, import_cloneDeep.default)(dineInList);
								else {
									let AllList = sItem.itemPrices.filter((f) => f.type == "ALL");
									if (AllList.length) sItem.itemPrices = (0, import_cloneDeep.default)(AllList);
									else {
										delete sItem.itemPrices;
										sItem.price = sItem.price ? sItem.price : 0;
									}
								}
							} else if (orderType == "TO_GO") {
								let togoList = sItem.itemPrices.filter((f) => f.type == "TOGO");
								if (togoList.length) sItem.itemPrices = (0, import_cloneDeep.default)(togoList);
								else {
									let AllList = sItem.itemPrices.filter((f) => f.type == "ALL");
									if (AllList.length) sItem.itemPrices = (0, import_cloneDeep.default)(AllList);
									else {
										delete sItem.itemPrices;
										sItem.price = sItem.price ? sItem.price : 0;
									}
								}
							} else if (orderType == "PICK_UP") {
								let pickUpList = sItem.itemPrices.filter((f) => f.type == "PICKUP");
								if (pickUpList.length) sItem.itemPrices = (0, import_cloneDeep.default)(pickUpList);
								else {
									let AllList = sItem.itemPrices.filter((f) => f.type == "ALL");
									if (AllList.length) sItem.itemPrices = (0, import_cloneDeep.default)(AllList);
									else {
										delete sItem.itemPrices;
										sItem.price = sItem.price ? sItem.price : 0;
									}
								}
							}
						}
						if (sItem && sItem.itemPrices && sItem.itemPrices.length) {
							let minObj = sItem.itemPrices[0];
							sItem.itemPrices.forEach((p) => {
								if (p.price < minObj.price) minObj = p;
							});
							sItem.price = 0;
							if (cs.priceRule == "FIXED_PRICE") minObj.price = 0;
							sItem.selectedOptionList.push({
								id: -1,
								sizeInfo: minObj
							});
							fixObj.items.push(sItem);
						} else {
							if (cs.priceRule == "FIXED_PRICE") sItem.price = 0;
							fixObj.items.push(sItem);
						}
					}
				});
				tempItem.sectionDetail.push(fixObj);
			});
		}
		if (isItemPrice) {
			if (sizeInfo?.sizeId) {
				tempItem.sectionDetail.unshift({
					id: -1,
					sizeInfo: Object.assign({}, sizeInfo)
				});
				tempItem.price = 0;
				if (this.props.addCombo2Order(tempItem) === false) {
					this.closePanel();
					return;
				}
			}
		} else if (this.props.addCombo2Order(tempItem) === false) {
			this.closePanel();
			return;
		}
		this.closePanel();
	};
	onChange = (input) => {
		this.setState({ keyboardValue: input });
		this.inputRef.scrollIntoViewIfNeeded(true);
	};
	showKeyboard = () => {
		this.setState({ keyboardToggle: true });
	};
	hideKeyboard = () => {
		this.setState({ keyboardToggle: false });
	};
	keyboardChange = (eventOrValue) => {
		let value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
		value = removeEmoji(value);
		if (eventOrValue?.target) eventOrValue.target.value = value;
		if (value.length > 255) value = value.substr(0, 255);
		this.setState({ keyboardValue: value });
	};
	changeChooseNum = (isAdd) => {
		const { t, itemInfo, currentOrder, menuItemList, crm } = this.props;
		let { chooseNum, maxNum } = this.state;
		let n = isAdd ? chooseNum + 1 : chooseNum - 1;
		if (isAdd) {
			if (!isTotalQtyWithinStock({
				itemInfo,
				totalQty: getCartItemQtyByStockId(currentOrder.itemList, getStockItemId(itemInfo), itemInfo.cloudId, void 0, menuItemList) + n,
				promotion: this.props.promotion,
				menuItemList,
				itemList: currentOrder.itemList,
				currentOrderCombo: this.props.currentOrderCombo,
				crm
			})) {
				showInsufficientStockToast(void 0, itemInfo, menuItemList);
				return;
			}
		}
		if (n >= maxNum) toast_default.info(t("max-up", { rplc: defaultMax$3 }));
		this.setState({ chooseNum: n }, () => {
			this.calPrice();
		});
	};
	handleScroll = () => {
		if (!this.state.isScroll) this.setState({ isScroll: true }, () => {
			off(this.scrollDom, "scroll", this.handleScroll);
		});
	};
	judegIsShowLangSwitch = () => {
		const { selfConfig } = this.props;
		if (selfConfig?.configMap?.id_10?.length === 2) this.setState({
			isOpenLanSwitch: true,
			isOpenMulLanSelect: false
		});
		else this.setState({
			isOpenLanSwitch: false,
			isOpenMulLanSelect: true
		});
	};
	handleLang = (flag) => {
		this.props.setLanModal(flag);
	};
	componentDidMount() {
		this.props.onRef(this);
		this.viewOrderPanel();
		this.judegIsShowLangSwitch();
	}
	componentDidUpdate(prevProps, prevState) {
		if (this.props.orderPanelShow) {
			if (prevProps.orderPanelShow !== this.props.orderPanelShow) {
				this.itemOptionChild?.clearSelectedItemList && this.itemOptionChild.clearSelectedItemList();
				if (this.scrollDom) {
					this.setState({ isShowMore: !!(this.scrollDom.scrollHeight > this.scrollDom.offsetHeight) });
					on(this.scrollDom, "scroll", this.handleScroll);
				}
			}
			if (!!(String(this.state.keyboardValue).length >= 255) && this.maxNoteRef) this.maxNoteRef.scrollIntoViewIfNeeded(true);
		}
	}
	componentWillUnmount() {
		off(this.scrollDom, "scroll", this.handleScroll);
	}
	render() {
		const { t, i18n: { language }, itemInfo, selfConfig, orderPanelShow, isBannerPro } = this.props;
		const { keyboardToggle, keyboardValue, sizeInfo, totalPrice, chooseNum, options, defaultItemSizeId, maxNum, descVisible, showRequired, isOpenLanSwitch, isOpenMulLanSelect } = this.state;
		const langTxt = systemLanguage.find((item) => item.code == language)?.abbr;
		const isItemPrice = itemInfo?.itemPrices?.length > 0;
		const showBenefitPrice = shouldShowBenefitPrice(itemInfo.benefitPrice, this.props.isHasBenefit) && !itemInfo.isFreeItem && !this.props.isInFreeItem && !this.props.isPromotionItem && !this.props.isSpecialItem;
		const isItemOption = options.length > 0;
		const isFixCombo = itemInfo?.comboType === "FIXED_SELECTION";
		const itemName = itemInfo?.id ? getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name : "";
		String(keyboardValue).length;
		selfConfig?.configMap?.id_3;
		const zeroShow = selfConfig?.configMap?.id_51;
		const property = getItemCardProperties({
			itemInfo,
			selfConfig
		});
		const isSoldOut = Boolean(getItemStoppedStatus(itemInfo));
		let isDisabled = true;
		if (!isSoldOut) isDisabled = false;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			visible: orderPanelShow,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: detailModal_module_default.drawBody,
				onClick: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: detailModal_module_default.header,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: arrow_left_default,
							className: detailModal_module_default.backPrePage,
							onClick: this.closePanel
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: detailModal_module_default.navigateRight,
							children: [isOpenLanSwitch && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LangSwitch_default, {}), isOpenMulLanSelect && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: detailModal_module_default.langIcon,
								onClick: () => {
									this.handleLang(true);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
									className: detailModal_module_default.languageIcon,
									type: "language",
									size: 3.4,
									color: "#000"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: langTxt })]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: detailModal_module_default.contentTopBox,
						ref: (el) => this.scrollDom = el,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: detailModal_module_default.basicInfo,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: detailModal_module_default.leftBox,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
										selfConfig,
										itemInfo
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: detailModal_module_default.rightBox,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: detailModal_module_default.comboItemsName,
											children: itemName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: detailModal_module_default.property,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoDishTag$1, {
												tagsInfo: property,
												isItemCard: false
											})
										}),
										(itemInfo.description || itemInfo.otherDescription) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: detailModal_module_default.word,
											children: [itemInfo.otherDescription && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												style: {
													fontWeight: "bolder",
													marginBottom: "2.5rem",
													fontSize: "3.5rem"
												},
												children: itemInfo.otherDescription || ""
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: itemInfo.description || "" })]
										}),
										!isItemPrice && (zeroShow || itemInfo.price > 0 || showBenefitPrice) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: detailModal_module_default.price,
											children: showBenefitPrice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: BenefitPrice_module_default.priceGroup,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", itemInfo.price] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: itemInfo.benefitPrice })]
											}) : `$${itemInfo.price}`
										})
									]
								})]
							}),
							isFixCombo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: detailModal_module_default.areaFixCombo,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: detailModal_module_default.title,
									children: t("items")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: detailModal_module_default.word,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(fixComboOption_default, { sectionItemList: itemInfo.comboSections })
								})]
							}),
							isItemPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: detailModal_module_default.area,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: detailModal_module_default.title,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("section") }), showRequired && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: detailModal_module_default.required,
										children: t("required")
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `${detailModal_module_default.word} `,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(sizeOptionSelect_default, {
										sectionItemList: itemInfo.itemPrices || [],
										defaultItemSizeId,
										selectedItem: sizeInfo,
										changeSize: this.changeSize,
										fixItemPrice: this.calFixItemPrice().toFixed(2) || 0,
										itemInfo
									})
								})]
							}),
							isItemOption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: detailModal_module_default.area,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemOptionSelectWithSub_default, {
									onRef: (ref) => this.itemOptionChild = ref,
									calPrice: this.calPrice,
									sectionItemList: options,
									itemInfo,
									parentQty: chooseNum
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: detailModal_module_default.foot,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: detailModal_module_default.countBtn,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: chooseNum === 1,
									"aria-label": "Remove",
									className: chooseNum > 1 ? `${detailModal_module_default.btnEn} animate-btn` : detailModal_module_default.btnDis,
									onClick: () => this.changeChooseNum(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: detailModal_module_default.muiDiyIcon })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: detailModal_module_default.count,
									children: chooseNum
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: chooseNum === maxNum,
									"aria-label": "Add",
									className: chooseNum !== maxNum ? `${detailModal_module_default.btnEn} animate-btn` : detailModal_module_default.btnDis,
									onClick: () => this.changeChooseNum(true),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: detailModal_module_default.muiDiyIcon })
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `${detailModal_module_default.addCart} ${isDisabled ? detailModal_module_default.addCartDisabled : "linear-animate-btn"} `,
							onClick: this.addOrder,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("addToOrder") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: detailModal_module_default.price,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", totalPrice] })
							})]
						})]
					})
				]
			}),
			onClose: this.closePanel
		}) });
	}
};
function mapStateToProps$10(state) {
	return {
		currentOrder: state.currentOrder,
		selfConfig: state.selfConfig,
		currentCategoryList: state.currentCategoryList,
		promotion: state.promotion,
		itemSizeList: state.itemSizeList,
		menuItemList: state.menuItemList,
		currentOrderCombo: state.currentOrderCombo,
		crm: state.crm,
		isHasBenefit: state.crm.isHasBenefit
	};
}
var detail_default = withRouter(connect(mapStateToProps$10, {
	replaceItemOrder,
	getCurrentItem,
	addCombo2Order,
	setLanModal
})(withTranslation()(DetailModal)));
var combo_module_default = {
	comboModalBx: "comboModalBx___F9ceU",
	header: "header___BrXnk",
	navigateLeft: "navigateLeft___SdUOq",
	backPrePage: "backPrePage___bmB6B",
	navigateRight: "navigateRight___mIDhB",
	langIcon: "langIcon___hkHhj",
	panelBox: "panelBox___25IV7",
	contentTopBox: "contentTopBox___4Quwh",
	basicInfo: "basicInfo___UNwt3",
	leftBox: "leftBox___YKPHe",
	rightBox: "rightBox___LJpFm",
	comboItemsName: "comboItemsName___ldyY6",
	area: "area___cwEtn",
	price: "price___dQItZ",
	title: "title___zdv9p",
	required: "required___lUPkt",
	require: "require___5iT9K",
	sub: "sub___e1T7M",
	titleWithRequired: "titleWithRequired___iERhI",
	word: "word___FZPMI",
	wordSize: "wordSize___YxxTR",
	textContent: "textContent___6jZ0i",
	iconEmpty: "iconEmpty___eKh8s",
	comboItemsTitle: "comboItemsTitle___tXZHS",
	sectionName: "sectionName___wt4It",
	comboItemsRule: "comboItemsRule___cgSlo",
	noAllow: "noAllow___BrHe8",
	comboItemsMust: "comboItemsMust___tHSuI",
	comboItemsBox: "comboItemsBox___cSpup",
	comboItemsList: "comboItemsList___w38aP",
	comboItems: "comboItems___22AZm",
	disabled: "disabled___7u808",
	optInfo: "optInfo___HA4Ko",
	optDisabled: "optDisabled___Xc177",
	maxNote: "maxNote___Daa1a",
	footBtnBox: "footBtnBox___Qxc-X",
	countBtn: "countBtn___XvuL-",
	btnEn: "btnEn___xS78r",
	btnDis: "btnDis___6hulF",
	muiDiyIcon: "muiDiyIcon___d2cjW",
	qty: "qty___FtEQL",
	details: "details___JnY29",
	num: "num___zbOnr",
	arrow: "arrow___xcoC9",
	actived: "actived___-esBd",
	noActived: "noActived___BOa-w",
	orderView: "orderView___GzcuZ",
	total: "total___zDNXn",
	point: "point___r07OP"
};
//#endregion
//#region source-snapshot/src/container/orderPage/bannerPro/components/combo/itemInfo.js
var MemoDishTag = (0, import_react.memo)(DishTag);
var ComboItemInfo = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			keyboardToggle: false,
			descVisible: false
		};
		this.flag = false;
	}
	handleResetEmpty = () => {
		this.setState({ keyboardValue: "" });
		const { currentItem } = this.props;
		currentItem.remark = {
			optionName: "",
			optionType: "NOTE",
			quantity: 1,
			price: 0
		};
	};
	onChange = (input) => {
		this.inputRef.scrollIntoViewIfNeeded(true);
		this.setState({ keyboardValue: input }, () => {
			const { currentItem } = this.props;
			currentItem.remark = {
				optionName: input,
				optionType: "NOTE",
				quantity: 1,
				price: 0
			};
		});
	};
	showKeyboard = () => {
		this.setState({ keyboardToggle: true });
	};
	hideKeyboard = () => {
		this.setState({ keyboardToggle: false });
	};
	keyboardChange = (eventOrValue) => {
		let value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
		value = removeEmoji(value);
		if (eventOrValue?.target) eventOrValue.target.value = value;
		if (value.length > 255) value = value.substr(0, 255);
		this.setState({ keyboardValue: value }, () => {
			const { currentItem } = this.props;
			currentItem.remark = {
				optionName: value,
				optionType: "NOTE",
				quantity: 1,
				price: 0
			};
		});
	};
	componentDidMount() {
		const { currentItem } = this.props;
		if (currentItem.remark?.optionName) this.setState({ keyboardValue: currentItem.remark.optionName || "" });
	}
	componentDidUpdate(prevProps, prevState) {
		if (!!(String(this.state.keyboardValue).length >= 255) && this.maxNoteRef) this.maxNoteRef.scrollIntoViewIfNeeded(true);
		if (this.state.keyboardToggle != prevState.keyboardToggle) if (this.state.keyboardToggle) {
			this.scrollDom.parentNode.parentNode.style.maxHeight = "calc(100vh - 380px)";
			this.inputRef.scrollIntoViewIfNeeded(true);
		} else this.scrollDom.parentNode.parentNode.style.maxHeight = "calc(100vh - 21.8rem)";
	}
	componentWillUnmount() {
		if (this.scrollDom) this.scrollDom.parentNode.parentNode.style.maxHeight = "calc(100vh - 21.8rem)";
	}
	render() {
		const { t, i18n: { language }, currentItem: tempCurrentItem, currentOrder, selfConfig, showRequireId } = this.props;
		const { descVisible } = this.state;
		const currentItem = (0, import_cloneDeep.default)(tempCurrentItem);
		const { keyboardValue, keyboardToggle } = this.state;
		let comboSizeList = [];
		if (currentItem.itemPrices && currentItem.itemPrices.length) {
			if (currentOrder.orderType == "DINE_IN") {
				let dineInList = currentItem.itemPrices.filter((f) => f.type == "DINE_IN");
				if (dineInList.length) comboSizeList.push(...(0, import_cloneDeep.default)(dineInList));
				else {
					let AllList = currentItem.itemPrices.filter((f) => f.type == "ALL");
					if (AllList.length) comboSizeList.push(...(0, import_cloneDeep.default)(AllList));
				}
			} else if (currentOrder.orderType == "TO_GO") {
				let togoList = currentItem.itemPrices.filter((f) => f.type == "TOGO");
				if (togoList.length) comboSizeList.push(...(0, import_cloneDeep.default)(togoList));
				else {
					let AllList = currentItem.itemPrices.filter((f) => f.type == "ALL");
					if (AllList.length) comboSizeList.push(...(0, import_cloneDeep.default)(AllList));
				}
			} else if (currentOrder.orderType == "PICK_UP") {
				let pickUpList = currentItem.itemPrices.filter((f) => f.type == "PICKUP");
				if (pickUpList.length) comboSizeList.push(...(0, import_cloneDeep.default)(pickUpList));
				else {
					let AllList = currentItem.itemPrices.filter((f) => f.type == "ALL");
					if (AllList.length) comboSizeList.push(...(0, import_cloneDeep.default)(AllList));
				}
			}
		}
		let comboOptionList = [];
		if (currentItem.options?.length) comboOptionList.push(...currentItem.options);
		const isItemPrice = comboSizeList.length > 0;
		const showBenefitPrice = shouldShowBenefitPrice(currentItem.benefitPrice, this.props.isHasBenefit) && !currentItem.isFreeItem && !this.props.isInFreeItem && !this.props.isPromotionItem && !this.props.isSpecialItem;
		const isItemOption = comboOptionList.length > 0;
		String(keyboardValue).length;
		const isShowRemark = selfConfig?.configMap?.id_3;
		const property = getItemCardProperties({
			itemInfo: currentItem,
			selfConfig
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: combo_module_default.contentTopBox,
			ref: (el) => this.scrollDom = el,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: combo_module_default.basicInfo,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: combo_module_default.leftBox,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
							selfConfig,
							itemInfo: currentItem,
							hideWhenMissing: true
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: combo_module_default.rightBox,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: combo_module_default.comboItemsName,
								children: getDishItemLanguage(currentItem.fieldDisplayNameGroups, language) || currentItem.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: combo_module_default.property,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoDishTag, {
									tagsInfo: property,
									isItemCard: false
								})
							}),
							(currentItem.description || currentItem.otherDescription) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: combo_module_default.word,
								children: [currentItem.otherDescription && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										fontWeight: "bolder",
										marginBottom: "2.5rem",
										fontSize: "3.5rem"
									},
									children: currentItem.otherDescription || ""
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: currentItem.description || "" })]
							}),
							!isItemPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: combo_module_default.price,
								children: showBenefitPrice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: BenefitPrice_module_default.priceGroup,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", currentItem.price] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: currentItem.benefitPrice })]
								}) : `$${currentItem.price}`
							})
						]
					})]
				}),
				isItemPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: combo_module_default.area,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `${combo_module_default.title} ${combo_module_default.titleWithRequired}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("section") }), showRequireId === -1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: combo_module_default.required,
							children: t("required")
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `${combo_module_default.word} ${combo_module_default.wordSize}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboSizeSelect_default, {
							comboSizeList,
							setCurSectionId: this.props.setCurSectionId,
							comboStepUpTop: this.props.comboStepUpTop,
							optAndRemark: !!(!isItemOption && !isShowRemark)
						})
					})]
				}),
				isItemOption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: combo_module_default.area,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboOptionItem_default, { comboOptionList })
				})
			]
		});
	}
};
function mapStateToProps$9(state) {
	return {
		currentItem: state.currentItem,
		currentOrder: state.currentOrder,
		selfConfig: state.selfConfig,
		crm: state.crm,
		isHasBenefit: state.crm.isHasBenefit
	};
}
var itemInfo_default = connect(mapStateToProps$9)(withTranslation()(ComboItemInfo));
//#endregion
//#region source-snapshot/src/container/orderPage/bannerPro/components/combo/comboContent.js
var import_debounce = /* @__PURE__ */ __toESM(require_debounce());
var import_isEqual = /* @__PURE__ */ __toESM(require_isEqual());
var ComboContent = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			colNum: 2,
			cutPaddingTop: 0,
			childrenListHeightList: [],
			selectedComboItem: {},
			isEditPreSelect: false,
			listHeight: 0,
			listWidth: 0,
			virtualData: [],
			virtualDataHeight: [],
			scrollEnabled: true,
			overscanCount: 5
		};
		this.comboBoxPanel = import_react.createRef();
		this.comboItemModal = import_react.createRef();
		this.comboDetailModal = import_react.createRef();
		this.listRef = import_react.createRef();
	}
	openOrderDetailModal = (ref) => {
		this.comboItemModal = ref;
	};
	openComboDetailModal = (ref) => {
		this.comboDetailModal = ref;
	};
	judegStepCanRepeated = (sideNavId) => {
		const { sideNavList } = this.props;
		return getComboSectionInfo(sideNavList, sideNavId)?.allowRepeatedItems;
	};
	selectedComboItemHandler = (e) => {
		const { sideNavList, currentOrderCombo, isPromotionItem, selfConfig } = this.props;
		const sideNavId = e.sideNavId;
		const preOrderCombo = (0, import_cloneDeep.default)(currentOrderCombo);
		const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
		if (!sectionInfo) return;
		const { priceRule, maxNumOfSelectionAllowed, itemSelectionRule, freeQuantity } = sectionInfo;
		const selectedDish = currentOrderCombo?.find((sec) => sec?.id === sideNavId)?.items?.find((item) => item?.id === e.id);
		let cloneItem = isPromotionItem ? (0, import_cloneDeep.default)(selectedDish || e) : (0, import_cloneDeep.default)(e);
		this.setState({ selectedComboItem: cloneItem }, () => {
			const showSimpleDishDetail = selfConfig.configMap.id_61?.status && selfConfig.configMap.id_61?.dishIds?.includes(cloneItem?.id);
			if (judgeHasDetailInfo(cloneItem, true) || showSimpleDishDetail) this.comboDetailModal.viewOrderPanel();
			else {
				cloneItem.remark = {
					optionName: "",
					optionType: "NOTE",
					quantity: 1,
					price: 0
				};
				cloneItem.quantity = 1;
				if (cloneItem.itemPrices?.length === 1) {
					cloneItem.selectedOptionList = [{
						id: -1,
						sizeInfo: Object.assign({}, cloneItem.itemPrices[0])
					}];
					cloneItem.price = 0;
				} else cloneItem.selectedOptionList = [];
				const addComboList = [];
				cloneItem.isComboBaseFree = false;
				const chargeableBasePrice = cloneItem.selectedOptionList?.find((section) => section.id === -1)?.sizeInfo?.price ?? e.price;
				const removePreviousItems = (sideNavId) => {
					const result = currentOrderCombo.find((c) => c.id == sideNavId);
					if (result?.items.length > 0) {
						const indicesToRemove = result.items.map((item, idx) => {
							return result.items.findIndex((i) => i.id == item.id) > -1 ? idx : -1;
						}).filter((idx) => idx > -1);
						indicesToRemove.sort((a, b) => b - a);
						indicesToRemove.forEach((idx) => {
							this.props.removeFootItemComboSection({
								sectionId: sideNavId,
								idx,
								sideNavList
							});
						});
					}
				};
				if (maxNumOfSelectionAllowed === 1 && priceRule !== "FIXED_UNTIL_MAX") removePreviousItems(sideNavId);
				const orderedItemQty = currentOrderCombo?.find((sct) => sct?.id == sideNavId)?.items?.length;
				if (priceRule === "FIXED_UNTIL_MAX") {
					if (orderedItemQty < maxNumOfSelectionAllowed) setComboItemBasePrice(cloneItem, 0, true);
					else setComboItemBasePrice(cloneItem, chargeableBasePrice);
					addComboList.push(cloneItem);
				} else if (priceRule === "FIXED_PRICE") {
					setComboItemBasePrice(cloneItem, 0, true);
					addComboList.push(cloneItem);
				} else if (freeQuantity > 0) {
					if (orderedItemQty < freeQuantity) setComboItemBasePrice(cloneItem, 0, true);
					else setComboItemBasePrice(cloneItem, chargeableBasePrice);
					addComboList.push(cloneItem);
				} else addComboList.push(cloneItem);
				if (addComboList.length > 0) addComboList[0].id_sizeId = addComboList[0].id;
				this.props.addItem2ComboSection(sideNavId, addComboList);
				if (maxNumOfSelectionAllowed === 1 && orderedItemQty === 1 && itemSelectionRule === "MAX_NUM_LIMIT" && priceRule !== "FIXED_UNTIL_MAX") {
					if (preOrderCombo.find((sct) => sct.id == sideNavId)?.items[0]?.id === e.id) {
						const idx = currentOrderCombo.find((c) => c.id === sideNavId)?.items?.findIndex((i) => i.id === e.id);
						this.props.removeFootItemComboSection({
							sectionId: sideNavId,
							idx,
							sideNavList
						});
					}
				}
				const sectionIdx = sideNavList?.findIndex((s) => s.id == sideNavId) ?? 0;
				let min = sectionInfo.minNumOfSelectionAllowed;
				let max = sectionInfo.maxNumOfSelectionAllowed;
				let obj = getOneUncompletedSection(sideNavList, currentOrderCombo);
				let isCompleted = obj[sideNavId]?.isCompleted;
				let isContinueChoose = obj[sideNavId]?.isContinueChoose;
				let len = sideNavList?.length ?? 0;
				if ((sideNavList?.findIndex((p) => p.id == -2) ?? -1) > -1) len--;
				if (min == void 0) {
					if (isCompleted && !isContinueChoose) {
						if (sectionIdx < len - 1) {}
					}
				} else if (max == void 0) return false;
				else if (min == max) {
					if (isCompleted && !isContinueChoose) {
						if (sectionIdx < len - 1) {}
					}
				} else if (isCompleted && !isContinueChoose) {
					if (sectionIdx < len - 1) {}
				}
			}
		});
	};
	getCurrentItemQty = (id, sideNavId, currentOrderCombo = this.props.currentOrderCombo) => {
		let n = 0;
		if (sideNavId > 0) {
			let res = currentOrderCombo.find((c) => c.id == sideNavId);
			if (res && res.items) res.items.forEach((f) => {
				if (f.id == id) n += f.quantity;
			});
		}
		return n;
	};
	/**
	* 自选套餐点击角标，删除子菜：
	* 如果子菜个数=1，可直接删除，不弹items列表；
	* 如果子菜个数>1且子菜都相同，可直接删除(优先删除最后添加的子菜)，不弹items列表；
	* 如果子菜个数>1且子菜不相同，弹items列表，再选择具体删除哪一个子菜；
	*/
	handleQtyClicked = (num, sectionId, itemInfo) => {
		const { currentOrderCombo, sideNavList } = this.props;
		if (num == 1) {
			let idx = currentOrderCombo.find((c) => c.id == sectionId)?.items?.findIndex((i) => i.id == itemInfo.id);
			if (idx > -1) this.props.removeFootItemComboSection({
				sectionId,
				idx,
				sideNavList
			});
		} else {
			let isAllSame = true;
			let result = currentOrderCombo.find((c) => c.id == sectionId);
			let itemsArr = result?.items?.filter((i) => i.id == itemInfo.id);
			for (let k = 0; k < itemsArr.length - 1; k++) {
				let standard = itemsArr[0];
				if ((0, import_isEqual.default)(standard, itemsArr[k + 1])) continue;
				else {
					isAllSame = false;
					break;
				}
			}
			if (isAllSame) {
				let idx = -1;
				for (let j = result.items.length - 1; j >= 0; j--) if (result.items[j].id == itemInfo.id) {
					idx = j;
					break;
				}
				if (idx > -1) this.props.removeFootItemComboSection({
					sectionId,
					idx,
					sideNavList
				});
			} else this.comboItemModal.viewOrderPanel({
				sectionId,
				itemInfo
			});
		}
	};
	comboStepUpTop = (idx) => {
		const { childrenListHeightList } = this.state;
		if (!this.listRef.current) return;
		this.setState({ scrollEnabled: false }, () => {
			if ((idx == 0 ? 0 : childrenListHeightList[idx]) > this.listRef.current.props.height / 2) this.setState({ overscanCount: 10 });
			else this.setState({ overscanCount: 5 });
			if (idx == 0 || idx >= childrenListHeightList.length) this.scrollToTop();
			else {
				this.listRef.current.scrollTo(childrenListHeightList[idx - 1], "start");
				this.listRef.current.resetAfterIndex(0);
			}
			window.scrollEnabledTimer && clearTimeout(window.scrollEnabledTimer);
			window.scrollEnabledTimer = setTimeout(() => {
				this.setState({ scrollEnabled: true });
				clearTimeout(window.scrollEnabledTimer);
			}, 300);
		});
	};
	handleScroll = (e) => {
		notifyItemCardListScroll();
		if (!this.state.scrollEnabled) return;
		window.comboScrollTimer && clearTimeout(window.comboScrollTimer);
		window.comboScrollTimer = setTimeout(() => {
			const { sideNavId, sideNavList } = this.props;
			let sectionIdx = sideNavList?.findIndex((s) => s.id == sideNavId) ?? 0;
			const { childrenListHeightList } = this.state;
			let currentIdx = 0;
			let scrollTop = Math.floor(e.scrollOffset);
			for (let i = 0; i < childrenListHeightList.length; i++) if (scrollTop <= childrenListHeightList[0]) {
				currentIdx = 0;
				break;
			} else if (scrollTop < childrenListHeightList[i + 1]) {
				currentIdx = i + 1;
				break;
			}
			if (currentIdx != sectionIdx) this.props.setCurSectionId(currentIdx);
			clearTimeout(window.comboScrollTimer);
		}, 100);
	};
	scrollToTop() {
		if (!this.listRef.current) return;
		this.listRef.current.scrollTo(0, "start");
	}
	resizeload = (0, import_debounce.default)(() => {
		this.updateListWidth();
		this.updateListHeight();
	}, 500);
	componentDidMount() {
		on(window, "resize", this.resizeload);
		this.props.onRef(this);
		this.updateListWidth();
		this.updateListHeight();
		this.getvirtualData();
	}
	componentWillUnmount() {
		off(window, "resize", this.resizeload);
		window.comboScrollTimer && clearTimeout(window.comboScrollTimer);
		window.scrollEnabledTimer && clearTimeout(window.scrollEnabledTimer);
	}
	componentDidUpdate(prevProps) {
		if (!(0, import_isEqual.default)(prevProps.comboAllChildDish, this.props.comboAllChildDish)) this.getvirtualData();
		if (!(0, import_isEqual.default)(prevProps.currentOrderCombo, this.props.currentOrderCombo)) {
			if (this.listRef.current) this.listRef.current.resetAfterIndex(0);
		}
	}
	getvirtualData = () => {
		const data = [];
		const { comboAllChildDish } = this.props;
		data.push({
			type: "comboItem",
			data: []
		});
		if (comboAllChildDish.length > 0) comboAllChildDish.forEach((sideItemInfo) => {
			data.push({
				data: sideItemInfo,
				type: "comboItemsTitle"
			});
			data.push({
				data: sideItemInfo,
				type: "comboItemsBox"
			});
		});
		data.push({
			type: "comboCateyOptionItem",
			data: []
		});
		data.push({
			type: "bottom",
			data: []
		});
		this.setState({
			virtualData: data,
			virtualDataHeight: new Array(data.length).fill(0)
		}, () => {
			if (this.listRef.current) this.listRef.current.resetAfterIndex(0);
		});
	};
	getItemSize = (index) => {
		const { virtualDataHeight, virtualData } = this.state;
		if (virtualData[index].type === "bottom") return remToPx(22);
		else return virtualDataHeight[index];
	};
	renderRow = ({ index, style, data }) => {
		const item = data.virtualData[index];
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style,
			ref: (el) => this.measureRef(el, index),
			children: this.renderContentItem(item, data.currentOrderCombo)
		});
	};
	measureRef = (el, index) => {
		if (!el || !this.state.virtualData[index]) return;
		let totalHeight = 0;
		const children = el.children;
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const style = window.getComputedStyle(child);
			const marginTop = parseFloat(style.marginTop) || 0;
			const marginBottom = parseFloat(style.marginBottom) || 0;
			totalHeight += child?.offsetHeight + marginTop + marginBottom;
		}
		if (this.state.virtualDataHeight[index] !== totalHeight) {
			const newHeights = [...this.state.virtualDataHeight];
			newHeights[index] = totalHeight;
			let sum = 0;
			let childrenListHeightList = [];
			for (let i = 0; i < newHeights.length; i++) {
				sum += newHeights[i - 1] || 0;
				if (i % 2 === 1) childrenListHeightList.push(sum);
			}
			this.setState({
				virtualDataHeight: newHeights,
				childrenListHeightList
			}, () => {
				if (this.listRef.current) this.listRef.current.resetAfterIndex(0);
			});
		}
	};
	updateListHeight = () => {
		const height = window.innerHeight * .9 - remToPx(9);
		this.setState({ listHeight: height });
	};
	updateListWidth = () => {
		if (this.comboBoxPanel?.current) {
			const width = this.comboBoxPanel.current.offsetWidth;
			this.setState({ listWidth: width });
		}
	};
	renderContentItem = (item, currentOrderCombo) => {
		const { showRequireId } = this.props;
		switch (item.type) {
			case "comboItem": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(itemInfo_default, {
				setCurSectionId: this.props.setCurSectionId,
				comboStepUpTop: this.comboStepUpTop,
				showRequireId
			});
			case "comboItemsTitle": return this.renderComboItemsTitle(item.data);
			case "comboItemsBox": return this.renderComboItemsBox(item.data, currentOrderCombo);
			case "comboCateyOptionItem": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboCateyOptionItem_default, {});
			default: return null;
		}
	};
	renderComboItemsTitle = (sideItemInfo) => {
		const { t, i18n: { language }, selfConfig, sideNavList, currentOrderCombo, itemId, showRequireId } = this.props;
		const chooseTipMap = allRangHandler(sideNavList, t);
		const isShowComboSideNav = selfConfig?.configMap?.id_19;
		const o = judegStepIsHasMustDish(sideNavList, currentOrderCombo);
		const isRequestSubDish = sideItemInfo.isRequestSubDish;
		let sectionName = "";
		if (sideItemInfo.sideNameMap?.fieldDisplayNameGroups?.length) sectionName = getCurrentItemLanguage(sideItemInfo.sideNameMap.fieldDisplayNameGroups, language) || sideItemInfo.sideNameMap.name;
		this.judegStepCanRepeated(sideItemInfo.sideNameMap.id);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: combo_module_default.comboItemsTitle,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: combo_module_default.sectionName,
					children: sectionName
				}),
				!isShowComboSideNav && showRequireId !== sideItemInfo.sideNameMap.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
					className: combo_module_default.comboItemsRule,
					children: chooseTipMap[sideItemInfo.sideNameMap.id] || ""
				}),
				!isShowComboSideNav && !o[sideItemInfo.sideNameMap.id] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("i", {
					className: combo_module_default.comboItemsMust,
					children: [
						"(",
						t("must-select-pre-dish"),
						")"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(noActivityTag_default, {
					itemId,
					sideItemInfo
				}),
				isRequestSubDish && showRequireId === sideItemInfo.sideNameMap.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: combo_module_default.required,
					children: `${t("required")}: ${chooseTipMap[sideItemInfo.sideNameMap.id] || ""}`
				})
			]
		});
	};
	renderComboItemsBox = (sideItemInfo, currentOrderCombo) => {
		const { colNum } = this.state;
		const { t, sideNavList, selfConfig } = this.props;
		const isCompleteObj = getOneUncompletedSection(sideNavList, currentOrderCombo);
		const isSimpleMode = !sideItemInfo.hasThumbPath;
		const allowRepeatedItems = getComboSectionInfo(sideNavList, sideItemInfo.sideNameMap.id)?.allowRepeatedItems;
		let isContinueChoose = isCompleteObj[sideItemInfo.sideNameMap.id]?.isContinueChoose;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: combo_module_default.comboItemsBox,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: combo_module_default.comboItemsList,
				children: sideItemInfo.sideDishList?.length ? sideItemInfo.sideDishList.map((sideDish) => {
					const sectionInfo = getComboSectionInfo(sideNavList, sideDish.sideNavId);
					const comboSectionSaleItem = (sectionInfo?.comboSectionSaleItems)?.find((item) => item.saleItemId == sideDish?.id);
					const itemInfo = {
						...sideDish,
						price: comboSectionSaleItem?.addPrice ?? sideDish.price,
						itemPrices: sideDish.itemPrices?.map((item) => {
							return {
								...item,
								price: comboSectionSaleItem?.addPrice ?? item.price
							};
						})
					};
					let isPreSelected = judegIsComboStatusAndIsPreSelected(itemInfo, sideNavList, sideItemInfo.sideNameMap.id, currentOrderCombo);
					const itemQty = this.getCurrentItemQty(itemInfo.id, sideItemInfo.sideNameMap.id, currentOrderCombo);
					let max = sectionInfo?.maxNumOfSelectionAllowed;
					let isDisabled = !itemQty && !isContinueChoose && max !== 1;
					const selectedDish = currentOrderCombo?.find((sec) => sec.id === itemInfo.sideNavId)?.items?.find((item) => item.id === itemInfo.id);
					const isHasDefaultBySystem = selectedDish?.isDefaultSelect;
					const isSoldoutMark = itemIsSoldOut(itemInfo);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: [combo_module_default.comboItems, isDisabled && !isSoldoutMark && combo_module_default.disabled].join(" "),
						style: { width: `calc((100% - 1rem * ${colNum}) / ${colNum})` },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(itemCard_default, {
							...this.props,
							isBannerPro: true,
							isSimpleMode,
							sideNavId: sideItemInfo.sideNameMap.id,
							isThumbPath: sideItemInfo.hasThumbPath,
							lazyImages: true,
							isComboType: true,
							itemInfo,
							isPreSelected,
							itemQty,
							isSoldoutMark,
							onClick: () => {
								if (isHasDefaultBySystem && judgeHasDetailInfo(selectedDish, true)) {
									this.props.changeDefaultDish(itemInfo.sideNavId, itemInfo.id);
									let cloneItem = (0, import_cloneDeep.default)(selectedDish);
									this.setState({
										selectedComboItem: {
											...cloneItem,
											isDefaultSelect: false
										},
										isEditPreSelect: true
									}, () => {
										this.comboDetailModal.viewOrderPanel();
									});
									return;
								}
								const currentComboSectionItem = sectionInfo?.comboSectionSaleItems?.find((item) => item.saleItemId === itemInfo.id);
								let addLimit;
								if (sectionInfo?.mergeDisplay && itemInfo.itemPrices?.length) addLimit = itemInfo.itemPrices.reduce((acc, item) => {
									let _addLimit = item.originalComboSectionSaleItem?.addLimit;
									if (_addLimit) if (acc) acc = acc + _addLimit;
									else acc = _addLimit;
									return acc;
								}, void 0);
								else addLimit = currentComboSectionItem?.addLimit;
								if (isContinueChoose && (!addLimit > 0 || itemQty < addLimit) || max === 1) if (!allowRepeatedItems && itemQty >= 1) {
									toast_default.info(t("no-allow-repeated-item"));
									return;
								} else this.selectedComboItemHandler(itemInfo, sideItemInfo.sideDishList);
							},
							onQtyClicked: () => {
								let sectionId = sideItemInfo.sideNameMap.id;
								this.handleQtyClicked(itemQty, sectionId, itemInfo);
							}
						})
					}, sideItemInfo.sideNameMap.id + "_" + itemInfo.id);
				}) : null
			})
		});
	};
	render() {
		const { selectedComboItem, listHeight, listWidth, virtualData, overscanCount } = this.state;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: combo_module_default.panelBox,
				ref: this.comboBoxPanel,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VariableSizeList, {
					ref: this.listRef,
					height: listHeight,
					width: listWidth || 0,
					itemCount: virtualData.length,
					itemSize: this.getItemSize,
					itemData: {
						virtualData,
						currentOrderCombo: this.props.currentOrderCombo
					},
					onScroll: this.handleScroll,
					overscanCount,
					useIsScrolling: true,
					children: this.renderRow
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboSelectionModal_default, {
				sideNavList: this.props.sideNavList,
				itemInfo: selectedComboItem,
				onRef: this.openComboDetailModal,
				setCurSectionId: this.props.setCurSectionId,
				comboStepUpTop: this.comboStepUpTop,
				isEditPreSelect: this.state.isEditPreSelect,
				onCloseEffect: () => {
					this.setState({ isEditPreSelect: false });
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboItemsDetailModal_default, {
				sideNavList: this.props.sideNavList,
				onRef: this.openOrderDetailModal,
				setCurSectionId: this.props.setCurSectionId,
				handleChildUpTop: this.comboStepUpTop
			})
		] });
	}
};
function mapStateToProps$8(state, ownProps) {
	return {
		currentOrder: state.currentOrder,
		currentOrderCombo: state.currentOrderCombo,
		sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
		sideNavId: ownProps.sideNavId ?? state.sideNav.sideNavId,
		selfConfig: state.selfConfig,
		currentItem: state.currentItem,
		itemSizeList: state.itemSizeList,
		menuItemList: state.menuItemList,
		crm: state.crm
	};
}
var comboContent_default = connect(mapStateToProps$8, {
	addItem2ComboSection,
	removeFootItemComboSection,
	changeDefaultDish
})(withTranslation()(ComboContent));
//#endregion
//#region source-snapshot/src/container/orderPage/bannerPro/components/combo/footer.js
var defaultMax$2 = 99;
var ComboFooter = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			priceTotal: "0.00",
			isAddToCart: false,
			defaultMax: defaultMax$2,
			notCompleteId: ""
		};
	}
	calcPrice = (list) => {
		let o = {};
		if (list.length) list.forEach((r) => {
			if (r.sizeInfo) if (r.sizeInfo.id) o[r.id] = {
				t: r.sizeInfo.price,
				subList: [r.sizeInfo.price]
			};
			else o[r.id] = {
				t: "0.00",
				subList: []
			};
			else if (r.items && r.items.length) {
				let fItemsList = r.items;
				if (fItemsList.length) {
					let t = Big(0);
					let subList = [];
					fItemsList.forEach((o) => {
						let subT = Big(getItemPrice(o)).times(o.quantity).toNumber();
						t = t.plus(subT);
						subList.push(subT);
					});
					o[r.id] = {
						t: t.toNumber(),
						subList
					};
				}
			} else if (r.options && r.options.length) {
				let fItemsList = r.options;
				if (fItemsList.length) {
					let t = Big(0);
					let subList = [];
					fItemsList.forEach((o) => {
						let subT = Big(getItemPrice(o)).times(o.quantity).toNumber();
						t = t.plus(subT);
						subList.push(subT);
					});
					o[r.id] = {
						t: t.toNumber(),
						subList
					};
				}
			}
		});
		return o;
	};
	calcTotalPrice = (obj) => {
		let t = Big(0);
		for (let k in obj) t = t.plus(Big(obj[k].t));
		return floatNumberRounding(t.toNumber());
	};
	handleAddToCart = () => {
		const { isAddToCart, notCompleteId } = this.state;
		const { sideNavList, handleChildUpTop, setCurSectionId, t, showRequireLabel, currentOrderCombo, currentItem } = this.props;
		const stoppedStatus = getItemStoppedStatus(currentItem);
		if (stoppedStatus) {
			toast_default.info(t(stoppedStatus === "unavailable" ? "dish-item-unavailable" : "dish-sold-out", { item: currentItem.name }));
			return;
		}
		if (isAddToCart) {
			this.props.submitCurrentOrderCombo();
			return;
		} else {
			let isItemPrice = currentItem?.itemPrices && currentItem?.itemPrices.length > 0;
			const sizeInfo = currentOrderCombo.find((nav) => nav.id === -1)?.sizeInfo || {};
			if (isItemPrice && !Object.keys(sizeInfo).length) {
				toast_default.info(t("choose-size"));
				this.props.scrollGeneralUsePanelToTop();
				showRequireLabel(-1);
				return;
			}
			const idx = sideNavList?.findIndex((nav) => nav.id === Number(notCompleteId));
			if (idx == null || idx < 0) return toast_default.info(t("requireDish"));
			handleChildUpTop(idx);
			setCurSectionId(idx);
			showRequireLabel(Number(notCompleteId));
			return toast_default.info(t("requireDish", { name: sideNavList[idx]?.name }));
		}
	};
	judegAll = () => {
		const { sideNavList, currentOrderCombo, currentItem } = this.props;
		let isItemPrice = currentItem?.itemPrices && currentItem?.itemPrices.length > 0;
		const sizeInfo = currentOrderCombo.find((nav) => nav.id === -1)?.sizeInfo || {};
		const hasChosenSize = isItemPrice && Object.keys(sizeInfo).length || !isItemPrice;
		let mustObj = judegStepIsHasMustDish(sideNavList, currentOrderCombo);
		let mustArr = [];
		for (let k in mustObj) mustArr.push(mustObj[k]);
		const isMustDish = mustArr.every((_) => _);
		const removeSoldOutCombo = currentOrderCombo?.map((item) => {
			if (item.id < 0) return item;
			else return {
				...item,
				items: item?.items?.filter((each) => {
					const stoppedStatus = getItemStoppedStatus(each);
					if (stoppedStatus) this.props.removeItemFromComboSection(item.id, each.id);
					return !stoppedStatus;
				})
			};
		});
		let obj = getOneUncompletedSection(sideNavList, removeSoldOutCombo);
		let arr = [];
		Object.keys(obj).forEach((o) => {
			arr.push(obj[o].isCompleted);
		});
		const isAdd = arr.every((_) => _);
		const notCompleteId = Object.keys(obj).find((each) => {
			return !obj[each].isCompleted;
		});
		return {
			isAddToCart: !!(isMustDish && isAdd && hasChosenSize),
			notCompleteId
		};
	};
	componentDidMount() {
		const { isInFreeItem, max, isPromotionItem } = this.props;
		if ((isInFreeItem || isPromotionItem) && max) this.setState({ defaultMax: max });
		const { isAddToCart, notCompleteId } = this.judegAll();
		this.setState({
			isAddToCart,
			notCompleteId
		});
	}
	componentDidUpdate() {
		const { isAddToCart, notCompleteId } = this.judegAll();
		if (this.state.isAddToCart != isAddToCart || this.state.notCompleteId !== notCompleteId) this.setState({
			isAddToCart,
			notCompleteId
		});
	}
	render() {
		const { t, currentOrderCombo, currentItem, orderDishCount, changeDishNum } = this.props;
		const { isAddToCart, defaultMax } = this.state;
		if (!currentOrderCombo?.length) return null;
		const priceObj = this.calcPrice(currentOrderCombo);
		let priceTotal = this.calcTotalPrice(priceObj);
		let n = 0;
		currentOrderCombo.forEach((p) => {
			if (p?.items?.length) p.items.forEach((i) => {
				n += i.quantity;
			});
			if (p?.options?.length) p.options.forEach((i) => {
				n += i.quantity;
			});
		});
		if (!!!currentOrderCombo.find((s) => s.id == -1)) {
			const parsedPrice = Number.parseFloat(currentItem.price);
			const singlePrice = isNaN(parsedPrice) ? 0 : parsedPrice;
			priceTotal = Big(isNaN(priceTotal) ? 0 : priceTotal).plus(singlePrice).toNumber().toFixed(2);
		}
		let showText = "addToOrder";
		const minDisabled = orderDishCount <= 1;
		const maxDisabled = orderDishCount >= defaultMax;
		const stoppedStatus = getItemStoppedStatus(currentItem);
		const isSoldOut = Boolean(stoppedStatus);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: combo_module_default.countBtn,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
					className: minDisabled ? combo_module_default.btnDis : `${combo_module_default.btnEn} animate-btn`,
					"aria-label": "Remove",
					disabled: minDisabled,
					onClick: () => changeDishNum(orderDishCount - 1),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: combo_module_default.muiDiyIcon })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: combo_module_default.qty,
					children: orderDishCount
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
					className: maxDisabled ? combo_module_default.btnDis : `${combo_module_default.btnEn} animate-btn`,
					"aria-label": "Add",
					disabled: maxDisabled,
					onClick: () => changeDishNum(orderDishCount + 1),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: combo_module_default.muiDiyIcon })
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: [combo_module_default.orderView, isAddToCart && !isSoldOut ? `${combo_module_default.actived} linear-animate-btn` : combo_module_default.noActived].join(" "),
			onClick: this.handleAddToCart,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: combo_module_default.btn,
				children: t([showText])
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: combo_module_default.total,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", floatNumberRounding(priceTotal * orderDishCount)] })
			})]
		})] });
	}
};
function mapStateToProps$7(state, ownProps) {
	return {
		currentItem: state.currentItem,
		sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
		currentOrderCombo: state.currentOrderCombo,
		selfConfig: state.selfConfig
	};
}
var footer_default = withRouter(connect(mapStateToProps$7, { removeItemFromComboSection })(withTranslation()(ComboFooter)));
//#endregion
//#region source-snapshot/src/container/orderPage/bannerPro/components/combo/comboModal.js
var defaultMax$1 = 99;
var ComboModal = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			isOpenLanSwitch: false,
			isOpenMulLanSelect: false,
			comboAllChildDish: [],
			sectionIndex: 0,
			sectionId: null,
			sectionList: null,
			orderDishCount: 1,
			showRequireId: null
		};
		this.generalUsePanelDom = import_react.createRef();
	}
	componentDidMount() {
		this._isMounted = true;
		this.probeComboImages();
		if (this.props.currentOrderCombo.length == 0) {
			const { currentCategoryList, currentItem } = this.props;
			const itemInfo = { ...currentItem };
			const currentCategory = currentCategoryList?.find((cate) => cate.saleItems?.find((item) => item.id === itemInfo.id));
			this.props.initCurrentOrderCombo(itemInfo, currentCategory);
		}
		this.judegIsShowLangSwitch();
	}
	componentWillUnmount() {
		this._isMounted = false;
		this.props.resetCurrentOrderCombo();
	}
	probeComboImages = async () => {
		const groups = this.state.comboAllChildDish;
		await probeComboItemImages(groups, serverURL);
		if (!this._isMounted) return;
		this.setState((state) => ({ comboAllChildDish: state.comboAllChildDish.map((group) => ({
			...group,
			hasThumbPath: group.sideDishList.some(hasRealItemImage)
		})) }));
	};
	generalUsePanel = (ref) => {
		this.generalUsePanelDom = ref;
	};
	static getDerivedStateFromProps(props, state) {
		if (props.currentItem.id != void 0 && state.sectionList == null) {
			const sectionList = Object.assign([], props.currentItem.comboSections);
			const { t, i18n: { language }, currentOrder, currentCategoryList } = props;
			sectionList.unshift({
				id: -1,
				name: getDishItemLanguage(props.currentItem.fieldDisplayNameGroups, language) || props.currentItem.name,
				info: props.currentItem
			});
			if (props.currentItem.categoryOptions) sectionList.push({
				id: -3,
				name: t("item_option"),
				key: "item_option",
				numOfItemOptionAllowed: props?.currentItem?.numOfItemOptionAllowed || 0
			});
			return {
				sectionList,
				sectionId: sectionList[state.sectionIndex].id,
				comboAllChildDish: getComboSectionItem(sectionList, currentCategoryList, currentOrder)
			};
		}
		return null;
	}
	setCurSectionId = (i, sectionList = this.state.sectionList) => {
		if (sectionList[i]?.id == -2) this.setState({
			sectionIndex: 0,
			sectionId: -1
		});
		else if (sectionList[i]?.id == -3) this.setState({
			sectionIndex: i,
			sectionId: -3
		});
		else this.setState({
			sectionIndex: i,
			sectionId: sectionList[i]?.id
		});
	};
	handleChildUpTop = (idx) => {
		this.generalUsePanelDom.comboStepUpTop(idx);
	};
	submitCurrentOrderCombo = () => {
		const { currentOrderCombo, currentItem } = this.props;
		const { orderDishCount } = this.state;
		const tempCurrentItem = Object.assign({}, currentItem);
		if (tempCurrentItem.itemPrices && tempCurrentItem.itemPrices.length > 0) tempCurrentItem.price = 0;
		tempCurrentItem.sectionDetail = currentOrderCombo;
		tempCurrentItem.quantity = orderDishCount;
		this.props.addCombo2Order(tempCurrentItem);
		this.props.onCloseModal();
	};
	changeDishNum = (num) => {
		if (num > defaultMax$1 || num < 1) return;
		this.setState({ orderDishCount: num });
	};
	showRequireLabel = (id) => {
		this.setState({ showRequireId: id });
	};
	scrollGeneralUsePanelToTop = () => {
		this.generalUsePanelDom?.scrollToTop();
	};
	judegIsShowLangSwitch = () => {
		const { selfConfig } = this.props;
		if (selfConfig?.configMap?.id_10?.length === 2) this.setState({
			isOpenLanSwitch: true,
			isOpenMulLanSelect: false
		});
		else this.setState({
			isOpenLanSwitch: false,
			isOpenMulLanSelect: true
		});
	};
	handleLang = (flag) => {
		this.props.setLanModal(flag);
	};
	render() {
		const { currentItem, i18n: { language }, onCloseModal } = this.props;
		const { sectionIndex, sectionList, sectionId, comboAllChildDish, orderDishCount, showRequireId, isOpenLanSwitch, isOpenMulLanSelect } = this.state;
		if (!currentItem.id) return null;
		const langTxt = systemLanguage.find((item) => item.code == language)?.abbr;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: combo_module_default.comboModalBx,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: combo_module_default.header,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: combo_module_default.navigateLeft,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: arrow_left_default,
							className: combo_module_default.backPrePage,
							onClick: onCloseModal
						}), sectionIndex > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: getDishItemLanguage(currentItem.fieldDisplayNameGroups, language) || currentItem.name })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: combo_module_default.navigateRight,
						children: [isOpenLanSwitch && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LangSwitch_default, {}), isOpenMulLanSelect && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: combo_module_default.langIcon,
							onClick: () => {
								this.handleLang(true);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
								className: combo_module_default.languageIcon,
								type: "language",
								size: 3.4,
								color: "#000"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: langTxt })]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboContent_default, {
					onRef: this.generalUsePanel,
					setCurSectionId: this.setCurSectionId,
					sideNavList: sectionList,
					sideNavId: sectionId,
					comboAllChildDish,
					itemId: currentItem.id,
					showRequireId
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: combo_module_default.footBtnBox,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(footer_default, {
						sideNavList: sectionList,
						setCurSectionId: this.setCurSectionId,
						submitCurrentOrderCombo: this.submitCurrentOrderCombo,
						handleChildUpTop: this.handleChildUpTop,
						orderDishCount,
						changeDishNum: this.changeDishNum,
						showRequireLabel: this.showRequireLabel,
						scrollGeneralUsePanelToTop: this.scrollGeneralUsePanelToTop
					})
				})
			]
		});
	}
};
function mapStateToProps$6(state) {
	return {
		selfConfig: state.selfConfig,
		currentOrder: state.currentOrder,
		currentItem: state.currentItem,
		currentCategoryList: state.currentCategoryList,
		currentOrderCombo: state.currentOrderCombo
	};
}
var comboModal_default = connect(mapStateToProps$6, {
	initCurrentOrderCombo,
	resetCurrentOrderCombo,
	addCombo2Order,
	setLanModal
})(withTranslation()(ComboModal));
var BuyGiftCardConfirm_module_default = {
	confirmWrapper: "confirmWrapper___jzavW",
	confirmTitle: "confirmTitle___zc0wU",
	innerConfirmWrapper: "innerConfirmWrapper___Vs16l",
	heroSection: "heroSection___XfLJY",
	giftCardVisual: "giftCardVisual___pUnRh",
	giftCardImage: "giftCardImage___huKv9",
	giftCardImage_left_tri: "giftCardImage_left_tri___sRpD6",
	giftCardImage_right_tri: "giftCardImage_right_tri___ojqRl",
	metaInfo: "metaInfo___O3FLJ",
	metaRow: "metaRow___pGuB8",
	metaLabel: "metaLabel___zkStg",
	metaValue: "metaValue___2YPof",
	amountSection: "amountSection___mP1xq",
	amountValue: "amountValue___EHlty",
	benefitBadge: "benefitBadge___EKlhR",
	payButton: "payButton___RAHPH"
};
//#endregion
//#region source-snapshot/src/utils/structureOrderInfoKey.js
var toNumber = (value) => {
	if (value === void 0 || value === null || value === "") return value;
	const num = Number(value);
	return Number.isNaN(num) ? value : num;
};
var toBoolean = (value) => {
	if (value === "true") return true;
	if (value === "false") return false;
	return value;
};
var normalizeFieldDisplayNames = (fieldDisplayNames) => {
	if (!fieldDisplayNames) return [];
	return (Array.isArray(fieldDisplayNames) ? fieldDisplayNames : [fieldDisplayNames]).map((item) => ({
		name: item?.name || "",
		languageID: toNumber(item?.languageid),
		languageCode: item?.languagecode || "",
		languageName: item?.languagename || ""
	}));
};
var normalizeFieldDisplayNameGroups = (groups) => {
	if (!groups) return [];
	return (Array.isArray(groups) ? groups : [groups]).map((item) => ({
		fieldName: item?.fieldname || "",
		fieldDisplayNames: normalizeFieldDisplayNames(item?.fielddisplaynames)
	}));
};
var normalizeOrderItem = (item) => ({
	id: toNumber(item?.id),
	saleItemId: toNumber(item?.saleitemid),
	displayName: item?.displayname || "",
	quantity: toNumber(item?.quantity),
	originalSalePrice: toNumber(item?.originalsaleprice),
	price: toNumber(item?.price),
	useBenefitPrice: toBoolean(item?.usebenefitprice),
	discount: toNumber(item?.discount),
	discountRateType: toNumber(item?.discountratetype),
	discountRate: toNumber(item?.discountrate),
	charge: toNumber(item?.charge),
	chargeRateType: toNumber(item?.chargeratetype),
	chargeRate: toNumber(item?.chargerate),
	chargeTaxed: toBoolean(item?.chargetaxed),
	taxExempt: toBoolean(item?.taxexempt),
	manualTaxed: toBoolean(item?.manualtaxed),
	status: item?.status || "",
	totalAmount: toNumber(item?.totalamount),
	qtySentToKitchen: toNumber(item?.qtysenttokitchen),
	qtyVoid: toNumber(item?.qtyvoid),
	eCard: item?.ecard || {},
	taxSnapshot: toBoolean(item?.taxsnapshot),
	rewardItem: toBoolean(item?.rewarditem),
	isGiftItem: toBoolean(item?.isgiftitem),
	originDualPrice: toNumber(item?.origindualprice),
	fieldDisplayNameGroups: normalizeFieldDisplayNameGroups(item?.fielddisplaynamegroups),
	receiptPrintingCount: toNumber(item?.receiptprintingcount),
	receiptPrintedItemQty: toNumber(item?.receiptprinteditemqty),
	productLine: item?.productline || ""
});
function parseSaveGiftCardOrderSoapResponse(xml) {
	const bodyStart = xml?.indexOf("<soap:Body>");
	const bodyEnd = xml?.indexOf("</soap:Body>");
	if (bodyStart === -1 || bodyEnd === -1) throw new Error("Invalid SOAP response");
	const soapBody = xml.substring(bodyStart + 11, bodyEnd);
	const response = new XMLObjTree().parseXML(soapBody)?.saveorderresponsetype;
	const orderItems = response?.order?.orderitems;
	const orderItemList = orderItems ? Array.isArray(orderItems) ? orderItems : [orderItems] : [];
	return {
		result: {
			id: toNumber(response?.result?.id),
			successful: toBoolean(response?.result?.successful)
		},
		order: {
			id: toNumber(response?.order?.id),
			type: response?.order?.type || "",
			totalPrice: toNumber(response?.order?.totalprice),
			totalTax: toNumber(response?.order?.totaltax),
			totalTips: toNumber(response?.order?.totaltips),
			discount: toNumber(response?.order?.discount),
			discountRateType: toNumber(response?.order?.discountratetype),
			discountRate: toNumber(response?.order?.discountrate),
			rewardDiscount: toNumber(response?.order?.rewarddiscount),
			isBeMerged: toBoolean(response?.order?.isbemerged),
			charge: toNumber(response?.order?.charge),
			roundingAmount: toNumber(response?.order?.roundingamount),
			status: response?.order?.status || "",
			createTime: response?.order?.createtime || "",
			orderItems: orderItemList.map(normalizeOrderItem),
			numOfGuests: toNumber(response?.order?.numofguests),
			loyaltyDiscount: toBoolean(response?.order?.loyaltydiscount),
			point: toNumber(response?.order?.point),
			userId: toNumber(response?.order?.userid),
			serverName: response?.order?.servername || "",
			orderNumber: response?.order?.ordernumber || "",
			taxExempt: toBoolean(response?.order?.taxexempt),
			checksum: response?.order?.checksum || "",
			sendToKitchenCount: toNumber(response?.order?.sendtokitchencount),
			printReceiptCount: toNumber(response?.order?.printreceiptcount),
			appTypeCreatedOn: response?.order?.apptypecreatedon || "",
			menuId: toNumber(response?.order?.menuid),
			productLine: response?.order?.productline || "",
			totalMultipleDiscount: toNumber(response?.order?.totalmultiplediscount),
			cashDiscount: toNumber(response?.order?.cashdiscount),
			taxCashDiscount: toNumber(response?.order?.taxcashdiscount),
			paidTotal: toNumber(response?.order?.paidtotal)
		},
		menuChanged: toBoolean(response?.menuchanged)
	};
}
//#endregion
//#region source-snapshot/src/hooks/useBuyGiftCard.js
var attachDualPriceToGiftCardOrder = (order, allSysConfig) => {
	if (allSysConfig?.CREDIT_CHARGE_ENABLE !== "true" && allSysConfig?.CREDIT_CHARGE_ENABLE !== true) return order;
	const rate = Number(allSysConfig?.CREDIT_CHARGE_RATE || 0);
	const dpMultiplier = Number(Big(1).plus(Big(rate).div(100)));
	const toRoundedNumber = (val) => Number(floatNumberRounding(val ?? 0));
	const toDpAmount = (val) => {
		if (val === void 0 || val === null || val === "") return val;
		return toRoundedNumber(Big(val).times(dpMultiplier).toNumber());
	};
	const cashSubtotalFromItems = (order.orderItems || []).reduce((sum, item) => {
		const qty = Number(item.quantity || 1);
		const linePrice = Number(item.price ?? 0);
		const lineTotal = Number(item.totalAmount != null ? item.totalAmount : Big(linePrice).times(qty).toNumber());
		const lineDiscount = Number(item.discount || 0);
		return Number(Big(sum).plus(lineTotal).minus(lineDiscount).toFixed(2));
	}, 0);
	const cashTaxBase = (Array.isArray(order.orderTax) && order.orderTax.length ? order.orderTax.reduce((sum, t) => Number(Big(sum).plus(Number(t.taxAmount || 0)).toFixed(2)), 0) : 0) || Number(order.totalTax || 0);
	const cashDiscountBase = Number(order.discount || 0);
	const cashRewardDiscount = Number(order.rewardDiscount || 0);
	const cashTips = Number(order.totalTips || 0);
	const cashCharge = Number(order.chargeTotal ?? order.charge ?? 0);
	const cashTogo = Number(order.togoTotal || 0);
	const totalPrice = toDpAmount(cashSubtotalFromItems);
	const totalTax = toDpAmount(cashTaxBase);
	const discount = cashDiscountBase ? toDpAmount(cashDiscountBase) : 0;
	const rewardDiscount = cashRewardDiscount ? toDpAmount(cashRewardDiscount) : 0;
	const totalTips = cashTips ? toDpAmount(cashTips) : 0;
	const chargeTotal = cashCharge ? toDpAmount(cashCharge) : 0;
	const togoTotal = cashTogo ? toDpAmount(cashTogo) : 0;
	const totalPriceAfterDp = totalPrice;
	const totalTaxAfterDp = totalTax;
	const discountAfterDp = discount || 0;
	const rewardDiscountAfterDp = rewardDiscount || 0;
	const totalTipsAfterDp = totalTips || 0;
	const chargeTotalAfterDp = chargeTotal || 0;
	const cashPaymentTotal = Number(Big(cashSubtotalFromItems).plus(cashTaxBase).plus(cashTogo).minus(cashRewardDiscount).minus(cashDiscountBase).toFixed(2));
	const creditPaymentTotal = Number(Big(totalPrice || 0).plus(totalTax || 0).plus(chargeTotal || 0).plus(togoTotal || 0).plus(totalTips || 0).minus(rewardDiscount || 0).minus(discount || 0).toFixed(2));
	const orderItems = Array.isArray(order.orderItems) ? order.orderItems.map((item) => {
		const qty = Number(item.quantity || 1);
		const linePrice = Number(item.price ?? 0);
		const lineTotal = Number(item.totalAmount != null ? item.totalAmount : Big(linePrice).times(qty).toNumber());
		const lineDiscount = Number(item.discount || 0);
		const priceAfterDp = toDpAmount(linePrice);
		let next = {
			...item,
			priceAfterDp
		};
		if (lineDiscount) {
			const discountDp = toDpAmount(lineDiscount);
			next = {
				...next,
				discount: discountDp,
				discountAfterDp: discountDp,
				totalAmount: Number(Big(toDpAmount(lineTotal)).minus(discountDp).toFixed(2))
			};
		} else next.totalAmount = toDpAmount(lineTotal);
		return next;
	}) : order.orderItems;
	const nextOrder = {
		...order,
		totalPrice,
		totalTax,
		discount,
		rewardDiscount,
		totalTips,
		togoTotal,
		priceType: "CREDIT_PRICE",
		cashPaymentTotal,
		creditPaymentTotal,
		totalPriceAfterDp,
		totalTaxAfterDp,
		totalTipsAfterDp,
		orderItems
	};
	if (cashDiscountBase) nextOrder.discountAfterDp = discountAfterDp;
	if (cashRewardDiscount) nextOrder.rewardDiscountAfterDp = rewardDiscountAfterDp;
	if (cashCharge) {
		nextOrder.chargeTotal = chargeTotal;
		nextOrder.chargeTotalAfterDp = chargeTotalAfterDp;
		nextOrder.charge = chargeTotal;
	}
	if (Array.isArray(order.orderTax) && order.orderTax.length) nextOrder.orderTax = order.orderTax.map((t) => ({
		...t,
		taxAmountAfterDp: toDpAmount(t.taxAmount || 0)
	}));
	return nextOrder;
};
var SOAP_BODY_START = "<soap:Body>";
var SOAP_BODY_END = "</soap:Body>";
var CHECK_GIFT_CARD_ERROR = "Check gift card number failed";
var parseSoapOrder = (data, responseType) => {
	let soapResponse = data;
	const start = soapResponse?.indexOf(SOAP_BODY_START);
	const end = soapResponse?.indexOf(SOAP_BODY_END);
	soapResponse = soapResponse?.substring(start + 11, end);
	return (new XMLObjTree()?.parseXML(soapResponse))?.[responseType]?.order;
};
var fetchOrderXMLInfo = (data) => {
	return parseSoapOrder(data, "fetchorderresponsetype");
};
var getXMLOrderInfo = (data) => {
	return parseSoapOrder(data, "saveorderresponsetype");
};
var buildRegistrationOrder = ({ receivedAmount, cloudGiftCardItem, phone }) => {
	return {
		totalPrice: receivedAmount,
		saleItemId: cloudGiftCardItem.id,
		quantity: 1,
		price: receivedAmount,
		actionType: "registration",
		cardType: "virtual",
		to: phone.replace(/\D/g, ""),
		toType: "phone",
		expirationTime: "2099-12-31",
		sessionKey: getCookie("sessionKey")
	};
};
var useBuyGiftCard = (props) => {
	const { setCardPaidResult, saveOrderResult } = props;
	const [loading, setLoading] = (0, import_react.useState)(false);
	const changeGiftCardOrderPrice = async ({ orderInfo, quickAmount, onCreateSuccess }) => {
		try {
			const { bonusAmount, saveAmount, discountValue } = quickAmount;
			const isSaveType = (saveAmount || 0) > 0;
			const isBonusType = (bonusAmount || 0) > 0;
			const { allSysConfig } = native_store_default.getState();
			const isDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === "true" || allSysConfig?.CREDIT_CHARGE_ENABLE === true;
			if (isSaveType || isBonusType || isDualPrice) {
				const discountInfo = {
					discountID: -1,
					discountRateType: isSaveType ? 2 : 1,
					discount: isSaveType ? saveAmount : bonusAmount,
					discountRate: discountValue
				};
				let orderForSave = {
					...orderInfo,
					...discountInfo,
					userAuth: { sessionKey: getCookie("sessionKey") }
				};
				let dualTotals = null;
				if (isDualPrice) {
					orderForSave = attachDualPriceToGiftCardOrder(orderForSave, allSysConfig);
					dualTotals = {
						cashPaymentTotal: orderForSave.cashPaymentTotal,
						creditPaymentTotal: orderForSave.creditPaymentTotal
					};
				}
				const unpaidInfo = {
					paid: 0,
					unpaid: isDualPrice ? Number(dualTotals.creditPaymentTotal) : Number(Big(orderForSave.totalPrice || 0).minus(orderForSave.discount || 0).toFixed(2))
				};
				const res = await saveOrder({ order: {
					...orderForSave,
					unpaidInfo
				} });
				if (!res?.data?.result?.successful) throw new Error(CHECK_GIFT_CARD_ERROR);
				const orderResultData = res.data.order;
				if (dualTotals) {
					orderResultData.cashPaymentTotal = dualTotals.cashPaymentTotal;
					orderResultData.creditPaymentTotal = dualTotals.creditPaymentTotal;
				}
				orderResultData.unpaidInfo = unpaidInfo;
				const orderId = orderResultData.id;
				const fetchOrderRes = await getOrderInfo(orderId);
				const cardPaidResultData = fetchOrderRes.data ? fetchOrderXMLInfo(fetchOrderRes.data) || {} : {};
				if (JSON.stringify(cardPaidResultData) === "{}") throw new Error(CHECK_GIFT_CARD_ERROR);
				cardPaidResultData.unpaidInfo = unpaidInfo;
				setCardPaidResult(cardPaidResultData);
				saveOrderResult(orderResultData);
				onCreateSuccess();
			}
		} catch (e) {
			throw new Error(CHECK_GIFT_CARD_ERROR);
		}
	};
	const createGiftCardOrder = async ({ quickAmount, cloudGiftCardItem, phone, onCreateSuccess }) => {
		try {
			setLoading(true);
			const { receivedAmount, bonusAmount, saveAmount } = quickAmount;
			const orderData = buildRegistrationOrder({
				receivedAmount,
				cloudGiftCardItem,
				phone
			});
			const saveOrderRes = await saveGiftCardOrderBySoap(orderData);
			let orderInfo = saveOrderRes.data ? getXMLOrderInfo(saveOrderRes.data) || {} : {};
			if (JSON.stringify(orderInfo) !== "{}") {
				const unpaidInfo = {
					paid: 0,
					unpaid: orderInfo.totalprice
				};
				const cardPaidResultOrderData = {
					...orderInfo,
					unpaidInfo
				};
				const orderResultOrderData = parseSaveGiftCardOrderSoapResponse(saveOrderRes.data).order;
				orderResultOrderData.unpaidInfo = unpaidInfo;
				const { allSysConfig } = native_store_default.getState();
				const isDualPriceEnabled = allSysConfig?.CREDIT_CHARGE_ENABLE === "true" || allSysConfig?.CREDIT_CHARGE_ENABLE === true;
				if (!(Number(bonusAmount || 0) > 0 || Number(saveAmount || 0) > 0 || isDualPriceEnabled)) {
					setCardPaidResult(cardPaidResultOrderData);
					saveOrderResult(orderResultOrderData);
					return onCreateSuccess();
				}
				orderResultOrderData.orderItems = orderResultOrderData.orderItems.map((item) => ({
					...item,
					eCard: {
						...item.eCard,
						actionType: orderData.actionType,
						cardType: orderData.cardType,
						to: orderData.to,
						toType: orderData.toType,
						expirationTime: orderData.expirationTime
					}
				}));
				await changeGiftCardOrderPrice({
					orderInfo: orderResultOrderData,
					quickAmount,
					onCreateSuccess
				});
			}
		} catch (error) {
			throw error;
		} finally {
			setLoading(false);
		}
	};
	return {
		createGiftCardOrder,
		loading
	};
};
//#endregion
//#region source-snapshot/src/assets/images/buy_new_giftCard.png
var buy_new_giftCard_default = "" + new URL("buy_new_giftCard-DU3UBAyN.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/assets/images/left_botton_tri.png
var left_botton_tri_default = "" + new URL("left_botton_tri-D8mg_xwm.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/assets/images/right_up_tri.png
var right_up_tri_default = "" + new URL("right_up_tri-eQLhGm7o.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/container/orderPage/bannerPro/components/BuyGiftCardConfirm.js
var formatAmount = (value) => Number(value || 0).toFixed(2);
var formatDisplayAmount = (value) => {
	const numberValue = Number(value || 0);
	return Number.isInteger(numberValue) ? `${numberValue}` : numberValue.toFixed(2);
};
var getBenefitType = ({ bonusAmount, saveAmount }) => {
	if (bonusAmount > 0) return "bonus";
	if (saveAmount > 0) return "save";
	return "";
};
var getBenefitText = (benefitType, bonusAmount, saveAmount) => {
	if (benefitType === "bonus") return {
		key: "gift_card_bonus_badge",
		params: { amount: formatDisplayAmount(bonusAmount) }
	};
	if (benefitType === "save") return {
		key: "gift_card_save_badge",
		params: { amount: formatDisplayAmount(saveAmount) }
	};
	return null;
};
var BuyGiftCardConfirm = (props) => {
	const { quickAmount, phone, cloudGiftCardItem, setCardPaidResult, saveOrderResult, onPosterClose, history } = props;
	const { t } = useTranslation();
	const { createGiftCardOrder, loading } = useBuyGiftCard({
		setCardPaidResult,
		saveOrderResult
	});
	const { label = "", rechargeAmount = 0, bonusAmount = 0, saveAmount = 0, paymentAmount = 0 } = quickAmount || {};
	const benefitText = getBenefitText(getBenefitType({
		bonusAmount: Number(bonusAmount || 0),
		saveAmount: Number(saveAmount || 0)
	}), bonusAmount, saveAmount);
	const handlePay = async () => {
		try {
			const onCreateSuccess = () => {
				onPosterClose();
				history.push("/cardPayment");
			};
			await createGiftCardOrder({
				quickAmount,
				cloudGiftCardItem,
				phone,
				onCreateSuccess
			});
		} catch (error) {
			toast_default.info(error?.message || "Create gift card failed", "top");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: BuyGiftCardConfirm_module_default.confirmWrapper,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: BuyGiftCardConfirm_module_default.confirmTitle,
			children: t("blocks.buyGiftCard_label")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: BuyGiftCardConfirm_module_default.innerConfirmWrapper,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: BuyGiftCardConfirm_module_default.heroSection,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: BuyGiftCardConfirm_module_default.giftCardVisual,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: buy_new_giftCard_default,
								alt: t("blocks.buyGiftCard_label"),
								className: BuyGiftCardConfirm_module_default.giftCardImage
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: BuyGiftCardConfirm_module_default.giftCardImage_left_tri,
								src: left_botton_tri_default,
								alt: "LEFT_BOTTOM_TRI"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: BuyGiftCardConfirm_module_default.giftCardImage_right_tri,
								src: right_up_tri_default,
								alt: "RIGHT_UP_TRI"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: BuyGiftCardConfirm_module_default.metaInfo,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: BuyGiftCardConfirm_module_default.metaRow,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: BuyGiftCardConfirm_module_default.metaLabel,
								children: [t("gift_card_valid_until_label"), " :"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: BuyGiftCardConfirm_module_default.metaValue,
								children: t("permanently_voucher")
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: BuyGiftCardConfirm_module_default.metaRow,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: BuyGiftCardConfirm_module_default.metaLabel,
								children: [t("gift_card_bound_phone_label"), " :"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: BuyGiftCardConfirm_module_default.metaValue,
								children: phone
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: BuyGiftCardConfirm_module_default.amountSection,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: BuyGiftCardConfirm_module_default.amountValue,
						children: ["$", formatDisplayAmount(rechargeAmount)]
					}), benefitText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: BuyGiftCardConfirm_module_default.benefitBadge,
						children: t(benefitText.key, benefitText.params)
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: BuyGiftCardConfirm_module_default.payButton,
					onClick: handlePay,
					children: t("gift_card_go_pay", { amount: formatAmount(paymentAmount) })
				})
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: loading })] });
};
function mapStateToProps$5(state) {
	return { cloudGiftCardItem: state.ecard?.cloudGiftCardItem };
}
var BuyGiftCardConfirm_default = withRouter(connect(mapStateToProps$5, {
	setCardPaidResult,
	saveOrderResult
})(BuyGiftCardConfirm));
var buyGiftCard_module_default = {
	triggerImage: "triggerImage___gZWil",
	fullScreenWrapper: "fullScreenWrapper___qKaoJ",
	loginWrapper: "loginWrapper___BZn9q",
	loginModal: "loginModal___v9Mam",
	queryButton: "queryButton___ue5CC",
	enableQueryButton: "enableQueryButton___3BSPr",
	disableQueryButton: "disableQueryButton___NSq30"
};
//#endregion
//#region source-snapshot/src/container/orderPage/bannerPro/components/buyGiftCard.js
var buildQuickAmountKey = (amountInfo = {}) => {
	const { rechargeAmount = "", bonusAmount, saveAmount } = amountInfo;
	return `${rechargeAmount}_${saveAmount ? "save" : bonusAmount ? "bonus" : "base"}`;
};
var BuyGiftCard = (props) => {
	const { item, style, src, cloudGiftCardItem, quickAmounts, onPosterClose, selfConfig, systemConfig } = props;
	const { t } = useTranslation();
	const [visible, setVisible] = (0, import_react.useState)(false);
	const [step, setStep] = (0, import_react.useState)("input");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [confirmPhone, setConfirmPhone] = (0, import_react.useState)("");
	const [isPrivacyConfirm, setIsPrivacyConfirm] = (0, import_react.useState)(selfConfig?.configMap?.id_49);
	const quickAmount = (0, import_react.useMemo)(() => {
		const quickAmountSnapshot = item?.props?.quickAmount;
		if (!quickAmountSnapshot) return null;
		const quickAmountList = quickAmounts || [];
		const snapshotKey = buildQuickAmountKey(quickAmountSnapshot);
		const matchedByKey = quickAmountList.find((amountInfo) => buildQuickAmountKey(amountInfo) === snapshotKey);
		if (matchedByKey) return matchedByKey;
		return quickAmountList.find((amountInfo) => Number(amountInfo?.rechargeAmount) === Number(quickAmountSnapshot?.rechargeAmount)) || quickAmountSnapshot;
	}, [item, quickAmounts]);
	const isVertical = getDeviceOrientation() === "vertical";
	const paymentRouteResult = (0, import_react.useMemo)(() => handlePaymentTypeRoute(systemConfig, selfConfig), [selfConfig, systemConfig]);
	const normalizedPhone = (0, import_react.useMemo)(() => normalizePhoneDigits(phone), [phone]);
	const normalizedConfirmPhone = (0, import_react.useMemo)(() => normalizePhoneDigits(confirmPhone), [confirmPhone]);
	const isPhoneValid = isValidUSPhone(phone);
	const isConfirmValid = isValidUSPhone(confirmPhone);
	const closeDialog = () => {
		setVisible(false);
		setStep("input");
		setPhone("");
		setConfirmPhone("");
	};
	const handlePhoneChange = (value, targetStep) => {
		if (targetStep === "input") {
			setPhone(value);
			return;
		}
		setConfirmPhone(value);
	};
	const handleBuyGiftCardClick = () => {
		if (!paymentRouteResult?.canPayByCard) {
			toast_default.info(t("gift_card_credit_card_payment_required"), "top");
			return;
		}
		if (!cloudGiftCardItem) {
			toast_default.info(t("gift_card_item_not_found"), "top");
			return;
		}
		setVisible(true);
	};
	const handleNext = () => {
		if (!isPrivacyConfirm) {
			toast_default.info(t("confirm-policy"), "top");
			return;
		}
		if (!isPhoneValid) {
			toast_default.info(t("phone-required"), "top");
			return;
		}
		setConfirmPhone("");
		setStep("confirmPhone");
	};
	const handleConfirm = () => {
		if (!isPrivacyConfirm) {
			toast_default.info(t("confirm-policy"), "top");
			return;
		}
		if (!isConfirmValid) {
			toast_default.info(t("phone-required"), "top");
			return;
		}
		if (normalizedPhone !== normalizedConfirmPhone) {
			toast_default.info(t("gift_card_confirm_phone_mismatch"), "top");
			return;
		}
		setStep("confirmPurchase");
	};
	const handleButtonEnter = (event) => {
		if (event.key !== "Enter") return;
		event.preventDefault();
		if (step === "input") {
			handleNext();
			return;
		}
		handleConfirm();
	};
	const title = step === "input" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trans, {
		t,
		i18nKey: "gift_card_bind_phone_title",
		components: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {})]
	}) : t("gift_card_confirm_phone_title");
	const actions = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: `${buyGiftCard_module_default.queryButton} ${step === "input" ? isPhoneValid && isPrivacyConfirm ? buyGiftCard_module_default.enableQueryButton : buyGiftCard_module_default.disableQueryButton : isConfirmValid && isPrivacyConfirm ? buyGiftCard_module_default.enableQueryButton : buyGiftCard_module_default.disableQueryButton}`,
		onClick: step === "input" ? handleNext : handleConfirm,
		children: step === "input" ? t("gift_card_bind_next") : t("gift_card_bind_confirm")
	});
	const dialogContent = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: buyGiftCard_module_default.fullScreenWrapper,
		onClick: (e) => e.stopPropagation(),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboHeader_default, { handleGoBack: () => {
			if (step === "confirmPurchase") {
				setStep("confirmPhone");
				return;
			}
			if (step === "confirmPhone") {
				setStep("input");
				setConfirmPhone("");
				return;
			}
			closeDialog();
		} }), step === "confirmPurchase" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BuyGiftCardConfirm_default, {
			onPosterClose,
			quickAmount,
			phone
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: buyGiftCard_module_default.loginWrapper,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: buyGiftCard_module_default.loginModal,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneNumberEntryLayout, {
					title,
					value: step === "input" ? phone : confirmPhone,
					placeholder: t("inputPhone"),
					isVertical,
					onPhoneChange: (nextValue) => handlePhoneChange(nextValue, step),
					onKeyDown: handleButtonEnter,
					isPrivacyConfirm,
					changePrivacyConfirm: setIsPrivacyConfirm,
					actions
				})
			})
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		style,
		src,
		alt: item?.component,
		className: buyGiftCard_module_default.triggerImage,
		onClick: handleBuyGiftCardClick,
		"data-quick-amount": quickAmount?.rechargeAmount
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		visible,
		html: dialogContent,
		onClose: closeDialog,
		outerStyle: { background: "#fff" },
		isMountOnBody: true
	})] });
};
function mapStateToProps$4(state) {
	return {
		cloudGiftCardItem: state.ecard?.cloudGiftCardItem,
		quickAmounts: state.ecard?.quickAmounts,
		selfConfig: state.selfConfig,
		systemConfig: state.systemConfig
	};
}
var buyGiftCard_default = connect(mapStateToProps$4)(BuyGiftCard);
//#endregion
//#region source-snapshot/src/utils/transformTreeMenu.js
var transformTreeDishId = (dishId, removePrefix = false) => {
	if (dishId == null || dishId === "") return dishId;
	if (removePrefix) {
		if (typeof dishId === "string") {
			if (dishId.startsWith("dish_combo_")) return dishId.replace("dish_combo_", "");
			if (dishId.startsWith("dish_")) return Number(dishId.replace("dish_", ""));
			const num = Number(dishId);
			return Number.isNaN(num) ? dishId : num;
		}
		return dishId;
	}
	if (typeof dishId === "string") {
		if (dishId.startsWith("dish_combo_") || dishId.startsWith("dish_")) return dishId;
		return "dish_combo_" + dishId;
	}
	if (typeof dishId === "number") return "dish_" + dishId;
	return dishId;
};
//#endregion
//#region source-snapshot/src/container/orderPage/bannerPro/index.js
var defaultMax = 99;
var EMPTY_POSTER_CHILDREN = [];
var BannerPro = (props) => {
	const { img, menuGroup, currentOrder, selfConfig, onClose, addCombo2Order, editOrderItemAction, fetchCloudGiftCardItem, getCurrentCategory, getCurrentItem, spliceOrderBySoldout, brandSetting, itemSizeList, menuItemList, crm, onPrimaryImageReady } = props;
	const { t, i18n: { language } } = useTranslation();
	const { itemList } = currentOrder;
	const pricedCartItems = getMemberPricedCartItems(props);
	const { posterData, viewportHeight, viewportWidth, aspectRatio } = img.bannerPro;
	const posterChildren = posterData?.[0]?.children ?? EMPTY_POSTER_CHILDREN;
	const imageSourceOptions = (0, import_react.useMemo)(() => ({ serverIP: getCookie("kioskServerIP") }), []);
	const primaryItem = (0, import_react.useMemo)(() => getPosterPrimaryItem(posterChildren), [posterChildren]);
	const primaryImageUrl = (0, import_react.useMemo)(() => getBannerProImageSrc(primaryItem, imageSourceOptions), [imageSourceOptions, primaryItem]);
	const nonCriticalImageUrls = (0, import_react.useMemo)(() => getUniquePosterImageUrls(posterChildren, imageSourceOptions).filter((url) => url !== primaryImageUrl), [
		imageSourceOptions,
		posterChildren,
		primaryImageUrl
	]);
	const [primaryImagePainted, setPrimaryImagePainted] = (0, import_react.useState)(false);
	const [loadedImageUrls, setLoadedImageUrls] = (0, import_react.useState)(() => /* @__PURE__ */ new Set());
	const primaryImageRef = (0, import_react.useRef)(null);
	const primaryFrameReportedRef = (0, import_react.useRef)(false);
	const primaryFrameRafRef = (0, import_react.useRef)([]);
	const [screenHeight, setScreenHeight] = (0, import_react.useState)(window.innerHeight);
	(0, import_react.useEffect)(() => {
		const handleResize = () => setScreenHeight(window.innerHeight);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);
	const markImageLoaded = (0, import_react.useCallback)((url) => {
		if (!url) return;
		setLoadedImageUrls((previous) => {
			if (previous.has(url)) return previous;
			const next = new Set(previous);
			next.add(url);
			return next;
		});
	}, []);
	const reportPrimaryImageFrame = (0, import_react.useCallback)((status = "loaded") => {
		if (primaryFrameReportedRef.current) return;
		primaryFrameReportedRef.current = true;
		if (status === "loaded") markImageLoaded(primaryImageUrl);
		const firstFrame = requestAnimationFrame(() => {
			const secondFrame = requestAnimationFrame(() => {
				setPrimaryImagePainted(true);
				onPrimaryImageReady?.();
			});
			primaryFrameRafRef.current.push(secondFrame);
		});
		primaryFrameRafRef.current.push(firstFrame);
	}, [
		markImageLoaded,
		onPrimaryImageReady,
		primaryImageUrl
	]);
	(0, import_react.useLayoutEffect)(() => {
		primaryFrameRafRef.current.forEach(cancelAnimationFrame);
		primaryFrameRafRef.current = [];
		primaryFrameReportedRef.current = false;
		setPrimaryImagePainted(false);
		setLoadedImageUrls(/* @__PURE__ */ new Set());
		if (!primaryImageUrl) reportPrimaryImageFrame("skipped");
		else if (primaryImageRef.current?.complete) reportPrimaryImageFrame(primaryImageRef.current.naturalWidth > 0 ? "loaded" : "error");
		return () => {
			primaryFrameRafRef.current.forEach(cancelAnimationFrame);
			primaryFrameRafRef.current = [];
		};
	}, [primaryImageUrl, reportPrimaryImageFrame]);
	(0, import_react.useEffect)(() => {
		if (!primaryImagePainted || !nonCriticalImageUrls.length) return;
		let active = true;
		preloadPosterImagesWithConcurrency(nonCriticalImageUrls, {
			concurrency: 2,
			priority: "low",
			onSettled: ({ status, url }) => {
				if (active && status === "loaded") markImageLoaded(url);
			},
			shouldContinue: () => active
		});
		return () => {
			active = false;
		};
	}, [
		markImageLoaded,
		nonCriticalImageUrls,
		primaryImagePainted
	]);
	const [cartShow, setCartShow] = (0, import_react.useState)(false);
	const [orderPanelShow, setOrderPanelShow] = (0, import_react.useState)(false);
	const [comboModalVisible, setComboModalVisible] = (0, import_react.useState)(false);
	const [tempItem, setTempItem] = (0, import_react.useState)({});
	const [isHasSoldoutDish, setIsHasSoldoutDish] = (0, import_react.useState)(false);
	const [dishMap, setDishMap] = (0, import_react.useState)({});
	const isOpenBrandSetting = selfConfig?.configMap?.id_26;
	const detailModal = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		fetchCloudGiftCardItem();
	}, [fetchCloudGiftCardItem]);
	(0, import_react.useEffect)(() => {
		const soldoutDishMap = judegOrderDishIsHasSoldout((0, import_cloneDeep.default)(itemList || []));
		if (soldoutDishMap?.slodoutList?.length) {
			setDishMap(soldoutDishMap);
			setIsHasSoldoutDish(true);
		}
	}, [
		itemList,
		selfConfig?.soldOut,
		menuItemList
	]);
	const continueReorder = () => {
		if (dishMap?.allSoldIds?.length) spliceOrderBySoldout(dishMap.allSoldIds);
		setIsHasSoldoutDish(false);
	};
	const openDetailModal = (ref) => {
		detailModal.current = ref;
	};
	const itemResources = (0, import_react.useMemo)(() => {
		return (isOpenBrandSetting ? brandSetting.brandMenu : menuGroup).flatMap((group) => group.menuCategories.flatMap((category) => category.saleItems));
	}, [
		isOpenBrandSetting,
		brandSetting.brandMenu,
		menuGroup
	]);
	const resolveBoundItemId = (itemId) => transformTreeDishId(itemId, true);
	const getCurrentItemQty = (itemId) => {
		const resolvedItemId = resolveBoundItemId(itemId);
		let itemQty = 0;
		for (let item of itemList) if (item.id == resolvedItemId) itemQty += item.quantity;
		return itemQty;
	};
	const cartQuantity = (0, import_react.useMemo)(() => itemList.reduce((sum, item) => sum + item.quantity, 0), [itemList]);
	const handleAdd = (itemInfo) => {
		if (!itemInfo) {
			toast_default.info(t("banner-pro-not-bind-dish"));
			return;
		}
		const stoppedStatus = getItemStoppedStatus(itemInfo);
		if (stoppedStatus) {
			toast_default.info(t(stoppedStatus === "unavailable" ? "dish-item-unavailable" : "dish-sold-out", { item: itemInfo.name }));
			return;
		}
		setTempItem({
			...itemInfo,
			remark: {
				optionName: "",
				optionType: "NOTE",
				quantity: 1,
				price: 0
			}
		});
		if (itemInfo.itemType === "SALE_ITEM") if (judgeHasDetailInfo(itemInfo)) setOrderPanelShow(true);
		else {
			if (getCurrentItemQty(itemInfo.id) >= defaultMax) {
				toast_default.info(t("max-up", { rplc: defaultMax }));
				return;
			}
			const cloneItem = {
				...itemInfo,
				quantity: 1
			};
			if (cloneItem.itemPrices?.length === 1) {
				cloneItem.sectionDetail = [{
					id: -1,
					sizeInfo: Object.assign({}, cloneItem.itemPrices[0])
				}];
				cloneItem.price = 0;
			} else cloneItem.sectionDetail = [];
			addCombo2Order(cloneItem);
		}
		else if (itemInfo?.comboType === "FIXED_SELECTION") setOrderPanelShow(true);
		else {
			getCurrentCategory(itemInfo.categoryId);
			getCurrentItem(itemInfo.id);
			setComboModalVisible(true);
		}
	};
	const handleComponentClick = (item) => {
		switch (item.component) {
			case "AddToCart": {
				const itemInfo = itemResources.find((e) => e?.id == resolveBoundItemId(item?.props?.itemId));
				handleAdd(itemInfo);
				break;
			}
			case "ShoppingCart":
				setCartShow((prev) => !prev);
				break;
			case "ContinueOrder":
				onClose();
				break;
			default: break;
		}
	};
	const renderImg = (item) => getBannerProImageSrc(item, imageSourceOptions);
	const calcStyle = (item) => {
		if (item.component === "Page") return {
			...item.style,
			aspectRatio
		};
		const { width, height, left, top } = item.style;
		const x = (getCssValue(left) / viewportWidth).toFixed(2) * 100 + "vw";
		const y = (getCssValue(top) / viewportHeight).toFixed(2) * 100 + "vh";
		const w = getCssValue(width) / viewportWidth.toFixed(2) * 100 + "vw";
		const h = (getCssValue(height) / viewportHeight).toFixed(2) * 100 + "vh";
		return {
			...item.style,
			left: x,
			top: y,
			width: w,
			height: h
		};
	};
	const CountableImage = (0, import_react.useCallback)(({ item, quantity }) => {
		const { width } = item.style;
		const size = getCssValue(width) / viewportWidth * 40;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: calcStyle(item),
			onClick: () => handleComponentClick(item),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: bannerPro_module_default.countComp,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: renderImg(item),
					alt: item.component,
					className: bannerPro_module_default.countImg,
					decoding: "async"
				}), quantity > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: bannerPro_module_default.countNum,
					style: {
						width: `${size}vw`,
						height: `${size}vw`,
						lineHeight: `${size}vw`
					},
					children: quantity
				})]
			})
		});
	}, [viewportWidth]);
	const cartItem = (item, index) => {
		let name = getDishItemLanguage(item.fieldDisplayNameGroups, language);
		const price = (getItemPrice(item) || 0).toFixed(2);
		const memberPrices = getItemActualPrices(item);
		const showMemberPrice = canUseMemberPrice(props) && memberPrices.hasBenefitPrice;
		const pricedItem = pricedCartItems[index];
		const groupedTotal = pricedItem.memberCartDisplayTotal;
		const originalTotal = Big(price).times(item.quantity).toFixed(2);
		const localMemberDiscountPrice = pricedCartItems !== itemList && pricedItem.secondHalfInfo && pricedItem.discountID ? Big(getItemPrice(pricedItem)).minus(pricedItem.discount).toFixed(2) : null;
		const size = item?.sectionDetail.find((section) => section?.id === -1);
		let sizeName = "";
		if (item?.itemPrices?.length > 1) {
			sizeName = getItemSizeName(size?.sizeInfo?.sizeId, size?.sizeInfo?.size, itemSizeList, language);
			name += `(${sizeName})`;
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: bannerPro_module_default.orderItem,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: bannerPro_module_default.orderItemInfo,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: bannerPro_module_default.orderItemImage,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
						itemInfo: item,
						selfConfig
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: bannerPro_module_default.textInfo,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: bannerPro_module_default.name,
						children: name || item.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: bannerPro_module_default.price,
						children: groupedTotal != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [originalTotal !== groupedTotal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", originalTotal] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							t("subtotal"),
							" $",
							groupedTotal
						] })] }) : localMemberDiscountPrice != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", price] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", localMemberDiscountPrice] })] }) : showMemberPrice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", price] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: memberPrices.realBenefitPrice })] }) : `$${price}`
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuantityControl, { item })]
		}, `${item.sequence}-${item.id}`);
	};
	const QuantityControl = ({ item }) => !isMembershipCard(item) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: bannerPro_module_default.calcBox,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
				"aria-label": "Remove",
				className: item.quantity > 1 ? bannerPro_module_default.btnEn : bannerPro_module_default.btnDel,
				onClick: () => {
					editOrderItemAction({
						deleteSequence: item.sequence,
						isSub: true
					});
				},
				children: item.quantity > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: bannerPro_module_default.muiDiyIcon }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Delete.default, { className: bannerPro_module_default.muiDiyIcon })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: bannerPro_module_default.qty,
				children: item.quantity
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
				disabled: item.quantity >= defaultMax,
				"aria-label": "Add",
				className: item.quantity < defaultMax ? `${bannerPro_module_default.btnEn} animate-btn` : bannerPro_module_default.btnDis,
				onClick: () => {
					const stoppedStatus = getItemStoppedStatus(item, { fromOrder: true });
					if (stoppedStatus) {
						toast_default.info(t(stoppedStatus === "unavailable" ? "dish-item-unavailable" : "dish-sold-out", { item: item.name }));
						return;
					}
					editOrderItemAction({
						deleteSequence: item.sequence,
						isSub: false
					});
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: bannerPro_module_default.muiDiyIcon })
			})
		]
	});
	const cartContent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: bannerPro_module_default.cartWrapper,
		onClick: (e) => e.stopPropagation(),
		children: [itemList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: bannerPro_module_default.noData,
			children: t("no-data")
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: bannerPro_module_default.cartItemList,
			children: itemList.map((item, index) => cartItem(item, index))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `${bannerPro_module_default.continue}  linear-animate-btn`,
			onClick: onClose,
			children: t("see-full-menu")
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: bannerPro_module_default.bannerProBox,
		children: [
			posterChildren.map((item) => {
				const imageUrl = renderImg(item);
				const isPrimaryImage = item === primaryItem;
				const isImageReady = isPrimaryImage || loadedImageUrls.has(imageUrl);
				if (item.component === "ContinueOrder" && !isImageReady) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					style: calcStyle(item),
					className: `${bannerPro_module_default.continueOrderFallback} linear-animate-btn`,
					onClick: () => handleComponentClick(item),
					children: t("see-full-menu")
				}, item.id);
				if (!isImageReady) return null;
				switch (item.component) {
					case "AddToCart": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountableImage, {
						item,
						quantity: getCurrentItemQty(item.props.itemId) || 0
					}, item.id);
					case "ShoppingCart": {
						const top = getCssValue(item.style.top) / viewportHeight * 100;
						const height = getCssValue(item.style.height) / viewportHeight * 100;
						const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
						const gap = 2 * rem;
						const barHeight = 12 * rem;
						const cartTop = top / 100 * screenHeight;
						const preferredTop = cartTop >= barHeight + gap ? cartTop - barHeight - gap : (top + height) / 100 * screenHeight + gap;
						const barTop = Math.max(gap, Math.min(preferredTop, screenHeight - barHeight - gap));
						return cartQuantity > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountableImage, {
							item,
							quantity: cartQuantity
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaidMemberPriceBar, {
							className: bannerPro_module_default.memberPriceBar,
							onBeforeLogin: onClose,
							style: { top: barTop }
						})] }, item.id);
					}
					case "BuyGiftCard": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(buyGiftCard_default, {
						item,
						style: calcStyle(item),
						src: renderImg(item),
						onPosterClose: onClose
					}, item.id);
					default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						ref: isPrimaryImage ? primaryImageRef : void 0,
						src: imageUrl,
						alt: item.component,
						style: calcStyle(item),
						className: item.component === "ContinueOrder" ? bannerPro_module_default.countComp : "",
						onClick: () => handleComponentClick(item),
						onLoad: isPrimaryImage ? () => reportPrimaryImageFrame() : void 0,
						onError: isPrimaryImage ? () => reportPrimaryImageFrame("error") : void 0,
						loading: isPrimaryImage ? "eager" : void 0,
						fetchpriority: isPrimaryImage ? "high" : void 0,
						decoding: "async"
					}, item.id);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: cartShow,
				html: cartContent(),
				onClose: () => setCartShow(false)
			}),
			orderPanelShow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(detail_default, {
				orderPanelShow,
				itemInfo: tempItem,
				isBannerPro: true,
				onRef: openDetailModal,
				onCloseModal: () => setOrderPanelShow(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: comboModalVisible,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboModal_default, { onCloseModal: () => setComboModalVisible(false) }),
				onClose: () => {
					setComboModalVisible(false);
				}
			}),
			isHasSoldoutDish ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(soldoutModal_default, {
				isHasSoldoutDish,
				dishMap,
				inOrderPage: true,
				continueReorder
			}) : null
		]
	});
};
function mapStateToProps$3(state) {
	return {
		selfConfig: state.selfConfig,
		currentOrder: state.currentOrder,
		img: state.img,
		menuGroup: state.menuGroup,
		brandSetting: state.brandSetting,
		itemSizeList: state.itemSizeList,
		menuItemList: state.menuItemList,
		crm: state.crm,
		avocado: state.avocado,
		promotion: state.promotion,
		allSysConfig: state.allSysConfig
	};
}
var bannerPro_default = connect(mapStateToProps$3, {
	addCombo2Order,
	editOrderItemAction,
	fetchCloudGiftCardItem,
	getCurrentCategory,
	getCurrentItem,
	spliceOrderBySoldout
})(withTranslation()(BannerPro));
var noMenuTips_module_default = {
	containerBox: "containerBox___RtFzU",
	noMenuTitle: "noMenuTitle___7omDP",
	noMenuCheck: "noMenuCheck___JJavs",
	reasonTitle: "reasonTitle___H5YSx",
	backHome: "backHome___9NTn8"
};
//#endregion
//#region source-snapshot/src/container/orderPage/noMenuTips/index.js
var NoMenuTips = (props) => {
	const { t, handleBackHome, time } = props;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: noMenuTips_module_default.containerBox,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: noMenuTips_module_default.noMenuTitle,
				children: t("no-menu")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: noMenuTips_module_default.noMenuCheck,
				children: t("no-menu-check")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: noMenuTips_module_default.noMenuReason,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: noMenuTips_module_default.reasonTitle,
						children: t("menu-time-zone")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: noMenuTips_module_default.reasonTitle,
						children: t("menu-license", { licenseName: getCookie("kioskLicense") })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: noMenuTips_module_default.reasonTitle,
						children: t("menu-business-time")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: noMenuTips_module_default.reasonTitle,
						children: t("menu-set")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: noMenuTips_module_default.reasonTitle,
						children: t("menu-hidden")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: noMenuTips_module_default.backHome,
				onClick: handleBackHome,
				children: `${t("go-back-home")}(${time}s)`
			})
		]
	});
};
function mapStateToProps$2(state) {
	return {};
}
var noMenuTips_default = connect(mapStateToProps$2, {})(withTranslation()(NoMenuTips));
//#endregion
//#region source-snapshot/src/assets/images/login_star.png
var login_star_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE4AAABPCAMAAAByKAOKAAAAPFBMVEUAAABmZmZoaGhmZmZlZWVmZmZlZWVkZGRgYGBoaGhmZmZwcHBlZWVmZmZlZWVmZmZmZmZlZWVmZmZmZmYQp5FWAAAAE3RSTlMA3yC/76BfQBBAgBCQfzBwz0+wfquEhgAAAdZJREFUWMPtl9uSgjAQRMmNm4rI/P+/7lqlDs0sFWcb3+w3inAKcoZJ0nyzzWkY4mGwKclv0kHAmzzSHkGL+YnLseFT5JVzwycoLvc0rZVVrjQurXGJFiGQ4QgRh8nos6JQBi+ClzE/KCEdIWN6/V9XkMGKiH1WGbSI0jRnXka7+sJOZdAi7he0jAkaHS2jwHSxMqKoiHtUBidiul+xMuKzb87bXjVH/1JYBESADCnRB7tk00RUhgKdMBWhMhTogGlWT3XY+y7RBbNVdhZIUGAdpp9qeQr0wFJnijFsge27sKAwN3DaH1UHToZWgVWAWx7ez+MJ7laBwezhDMwFHLAALKyeMZjytHuHm6OFZVOftjzTm917SKIZ4VYn+Hf7YHYBSWKADpgstve+D4xJMCGaIUX2gPWRWgteoB216Kg60NN06sAQcYYdMD2A7W3Wg4HV0+1W1M0FU2D4+/UWP8y2i/41cxbmB+rvOCqMOD7lrYil+U+6jYwWWpg/GWUkaOT+jCAj4lz60wOg4KaFkWFE0DJQBCsDRdAyUAQtA0XQMgKsp4wM2654GSCCloFnDF4GiuBlqAhehoqgk60IXoaKYGUEeDk6McCGgE7fziLzeGq++WR+AAXvZsNM08FbAAAAAElFTkSuQmCC";
//#endregion
//#region source-snapshot/src/assets/images/login_gift.png
var login_gift_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEwAAABPCAMAAAB23dO3AAAAP1BMVEUAAABnZ2dlZWVmZmZnZ2dmZmZmZmZoaGhlZWVlZWVoaGhmZmZoaGhkZGRkZGRlZWVmZmZmZmZmZmZpaWlmZmaNzL6aAAAAFHRSTlMAn2Dfv4CgIJDvEM9AQFAwr29wXxADlLwAAAGWSURBVFjD7dfbcsIgEAZgwiGcYhLtvv+zdiJsMdCEJbbTmQ7fnYz+YHZBYV3XZroPg+E6H15wuCVKQiBeP6iNjcNDQ5yCF8rFqBESyxuzkHguY7awQ0zjkONfEySW9k0FFLiCwsAIbkDkWJ2BQA4ednBYNDy12BU+FTCxW2l1LIVhdXE9j9APYreq8M1G+kPzOG+RtuLaySvDeS32qoVI4Ajg2usesJ/Y5G2KdZlYnbP45qxVYpfecaGMYtxtI+YAy/v0Qd5PjiulxtTkaoPZarMC2l7Nx3tqkUBXOYzucImqHDxvp01w2VQ/eOg8+eBpX1rqcysbiGyzIJn2Hx1+ai2GU2Waf8ZkNryWw/TjSh48MzE0SM/sV6r5fp8J9oONxr+tzN/v9INu0h6a+VvlL4stG6BsGls7vHlenZPfXNHDelgP62E97F+FzRC4epirXlM0BKYepiBY2CELgXLnYc4Q7jwGkEjiDFYkpIu6hka6ekGnU+yUv34BKDnfkOUI/6CJDCPQo4AqazQjWmZ+al5Y1zX4BNdpmaF/P3pLAAAAAElFTkSuQmCC";
//#endregion
//#region source-snapshot/src/assets/images/login_discount.png
var login_discount_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE4AAABLCAMAAADpuUGcAAAAPFBMVEUAAABlZWVnZ2doaGhmZmZnZ2dmZmZmZmZlZWVmZmZmZmZmZmZlZWVlZWVmZmZlZWVmZmZnZ2djY2NmZmZk8ofPAAAAE3RSTlMAYL8g359AgO8Qr6CQMM9vcE9QgorgpQAAActJREFUWMPtl9tuhSAQRYEBBERtO///r00T4j7lZsCmOQ+uxzEsYQYHFA8PD/+JPYwawiy2LVM8gd7qtoUnWa5s930b36BMoL6jU0UZ+Ba2kbkoh1jTsI9Ml+JGDBLr49KWk6M6mZL3Ljor7azOLyH8DpH+yZQf1WEsa8ojvIzrEFS5jfWEDt+dz2y8X+tSXFa+FMpsbNDSmrrETufSMDvYXrJJGNTWsbNZ0NRtm+ambmXgtqyyhS0FQOh1FH3mXqpw+MJWdjTZbcZGZJS25aIdkzxWh+T3bZicC4ckUYcC+lff9oV90GPHans2ERFogrfuFzahsIoeNg3s2qD7HGiHpQ2sKGkTDA5dG3LnqLtUjW3Zs2Hb68+WKpqdE44aNuDOJyFKAZAMsLRs4INfWCslALpu25RjdXpV75sNrzaq2sjh/oDHjWP70iZwTsB33T6jr9s8JzZ0oSudi5QCa14FqtyWaNVdnUQgr6l3KUIzl4pw2rKlRTGjs+V+i9hiIzpMRiVbgo7DTt+gvN3e5X4X/la3InxNOQ3TaBDaDLE3WoDnW5AoazGPETnkZjzt09bOysrjEfe1P/w/pjghdIvv/YMMsomHh4f/5Bup1X51iAxP9gAAAABJRU5ErkJggg==";
var loginGuideDialog_module_default = {
	containerBox: "containerBox___QSOrh",
	swipeImageBx: "swipeImageBx___ftPid",
	notMember: "notMember___rsaWN",
	joinNow: "joinNow___r7QoF",
	registerBr: "registerBr___757yt",
	benefitsList: "benefitsList___uW7Xo",
	benefits: "benefits___0BUXk",
	benefitsGift: "benefitsGift___oZM23",
	joinBtn: "joinBtn___nU3VE",
	dialogBgImg: "dialogBgImg___el67G",
	picContainerBox: "picContainerBox___z3o-A",
	closeIcon: "closeIcon___z4GCd"
};
//#endregion
//#region source-snapshot/src/container/orderPage/loginGuideDialog/index.jsx
var LoginGuideDialog = (props) => {
	const { t, handleConfirm, onClose, selfConfig } = props;
	const dialogBgInfo = selfConfig?.configList?.find((item) => item.id === 45)?.value?.dialog || {};
	const [orientation, setOrientation] = (0, import_react.useState)(getDeviceOrientation());
	(0, import_react.useEffect)(() => {
		const handleResize = () => {
			setOrientation(getDeviceOrientation());
		};
		const handleOrientationChange = () => {
			setOrientation(getDeviceOrientation());
		};
		window.addEventListener("resize", handleResize);
		window.addEventListener("orientationchange", handleOrientationChange);
		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("orientationchange", handleOrientationChange);
		};
	}, []);
	const showDefaultDialog = (0, import_react.useMemo)(() => {
		return !dialogBgInfo[`${orientation}Img`];
	}, [dialogBgInfo, orientation]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `${loginGuideDialog_module_default.containerBox} ${showDefaultDialog ? "" : loginGuideDialog_module_default.picContainerBox}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefIcon, {
				className: loginGuideDialog_module_default.closeIcon,
				onClick: onClose
			}),
			showDefaultDialog && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: loginGuideDialog_module_default.swipeImageBx,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LottiePlayer, { animationData: coin_smile_default })
			}),
			showDefaultDialog ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				onClick: (e) => {
					e.stopPropagation();
					handleConfirm();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: loginGuideDialog_module_default.notMember,
						children: t("login-guide-not-member")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: loginGuideDialog_module_default.joinNow,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trans, {
							t,
							i18nKey: "login-guide-register",
							components: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: loginGuideDialog_module_default.registerBr })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: loginGuideDialog_module_default.benefitsList,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: loginGuideDialog_module_default.benefits,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: login_star_default,
									alt: "star"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("login-guide-earn-points") })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `${loginGuideDialog_module_default.benefits} ${loginGuideDialog_module_default.benefitsGift}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: login_gift_default,
									alt: "gift"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("login-guide-claim-free-items") })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: loginGuideDialog_module_default.benefits,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: login_discount_default,
									alt: "discount"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("login-guide-exclusive-member-discounts") })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: loginGuideDialog_module_default.joinBtn,
						children: t("login-guide-join-for-free")
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: `${IMG_HOST}/${dialogBgInfo[`${orientation}Img`] || ""}`,
				alt: "dialogBg",
				className: loginGuideDialog_module_default.dialogBgImg,
				onClick: (e) => {
					e.stopPropagation();
					handleConfirm();
				}
			})
		]
	});
};
var mapStateToProps$1 = (state) => {
	return { selfConfig: state.selfConfig };
};
var loginGuideDialog_default = connect(mapStateToProps$1)(withTranslation()(LoginGuideDialog));
//#endregion
//#region source-snapshot/src/assets/images/waiting.png
var waiting_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWgAAAFoCAMAAABNO5HnAAAASFBMVEUAkP8AAAAAkP8AhvAAjv8AjfoAkP8AiPEAhOsAkP8AkP8AhOwAjvwAi/8Ahu8AifQAjv8Ahu4Ai/YAhewAifMAhesAhe0AhOo40U1gAAAAF3RSTlNMAEGkCGMhkO4sNNFYEa57GLxx3YflxrZawMgAAA6lSURBVHja7NrhbhwhDARgL6VcQCFC/ZP3f9NGqdoqqU71ZfCsYT2P8AnN2r6Tw31yH6XU2lp6i/xJektrtZYyej7cxzF0HqW2JMqkVstwDO4Sut8RVnr3w2G8QfeiIFZwu9N2BJ1LTTIxqRZHVeIEOpeWxCCpecF2AJ1HTWKYVD18JM+GziUJIen0h30qdK9JaEm1H6flPGiN8lbWJ0HrG2OXDuFDP6q8iTUfujc5PY1dIWTo0x/zac+aDN2rOArzy0iFHg4642PaOEghQnvpjM8NclBCgvbKzKNmQDv6Ap73XWRA5yLuQ6A2hvZcGswCMYZehZlAbQs9lmF+pzYc9kyhs7u5+X9pZlVtCJ1dbYHaVCNqK+iVyplS1VbQfVHmd+p+GMQAetXWMO0PA+jVZg3O/DEdesVZgzB/TIfe4TkbPOq50Ps8Z4NHPRV67WHDavywgF582Pg3FTcxgM5bPedfSWB9WEAvcHX+SgpiMhF639qYVh849Oa1gdaHBfSQrTMAGhj6AvUMFfVM6A2XlInLCw59oXrGixqH3nMZnLQm4tDXq2ewqB+HvryzWnoS9DW2FGB3sYC+wLjxMU2BgkFfd9yAhg89dDgD0nrocAak9dDhDEjrocMZkNZDhzMgrYcOZ0BaDx3OgLQeOpwBaT10OAPSeuhwBqRnQ4fzb+m/JgB03JGgC5MeOu6i+qspBB13fuCXgPvQ4QxIG0B3iXxKfxA6Bjv7IU/CGZTWQ8dgxxjyJD6EWAoGfbH/iyIZM6GzRO4m66DjwsG5ekhs3pxdXOJDyPkgShQ0p6YlCppT0xIFzalpiVMS57wkceLgHD0kThyco4fE6s1ZxSWKg1MeEsXBKQ/hFMeP2zeXuX1nlYcQiuP55enVbZ5eninlIfaryu3Vd36yd247jQNBED2JMTHriY0vyfz/n65AC4HIJMOW224rU68gIU5a1dU9E7salxhbMB9VztG9CouxJR30/lE4x9ja7zwwXo6OcQs62S9MMe6EQ9yEWvN+iHEnjNtQYd4PMd72Ow52X3UwPwPAeCas4yZUms+H/DwTPlAzPNvPh/wY7R6opE/B/lgL63Pv4D93nErA+kwc8/PY0EXfagDMS5oFLnKUjd+qrooSwL6kWWbdH/rx8KnraGWu5nvnu/ygD6RJn1pQC1ofYjBXKw8nekmTMqtk0PrUQkpBZ9B6SZMSOTJoPXiQUtAZtF7SpBR0Bq2XNCkFnUHrJU1KQWfQekmTsrbLoPUlHil76Axa30uTcsUgg9avHpByUphB66eHpEzfGbQ+h5OS7TJoPeGRku0yaD3hkdIKM2i9HZKS7TJoPeGR0gozaL0dktIKM2i9HaK2Qh10wFqjDFpvh6jOod/HK7HWQQateweqc+hXeXus1cgXGnXvQHUO/ZbYiLVqGbTuHazw7fpOuZuse1XLcjpOgH5hKRXxm2qM1es9Qd8sITqHnrZihbEKPeXo3sHyzkGIy3bDQf9cde9Adg49djSYqtedCt07WN45oFnUOzr9Y0X3DqRpRTdp+4BXCn9sxpkFfVrRZ8MBQ3XCxD/jzMIKzgGNUGViQQ8IErwD3Tn0/hSrgJWGKFj0jN5B2r0Z63+/w0hFFLLknDdpEMKdvE+zX0D0UXCOWQMegkWr7dB+AxEq4Uvf85o0skXrJZ3eEPXvOAYEKSaNEO7EkrYvtlr5TuHMAY+1Hrs2RmsKoY4eCpo/X0DvWV6DMekwRBcFzf4C+okV1EdTEOUpXiTHdd2kESxaVGFJuqxilPrt3CaNkKINzCM2hpzPCFKTNIJFyzSiFek+RjfGAftP0Kyk0Yh0KzwJzEIfoI+spcKE9BijH4P+OM9i3fesdAakDwbPAdO7ISs/JbqenXThjvP7yILQC+1quhPOFPxxZv8PNL+Sb9KdN3/+6Ias/6aVOUmfneWNSzfEwTvHZiMdJh2/6pGld0M8vKNpJtJhmORcsrpedjtcvJriDmmF8+CA81vswMfb3XTSlKdJzgEH2r+DxoNk0mUVJ1S74MwbZS/vhRRJ95OcO5zoaYeb12EppN85OzlQmdTrjvXTnUj6shZd/2rBjXyHg3R3k/Q5hbPDsfs63+Eh3YmkW5dj91W+w0W6u7kROm9szT+d7/CR7gTSrdOx+7u8gf496dbr2H0N2kmMvkN665x54ogzTZKuN86ZI17mlf8iXW6FM6+4mVfukQ5Tv7kVzjx7BJ1MOmyGM8/4GQzvnmQX16gPzufBL3rxCfon0vdPCE/41F/2zm03chAIooyveEzs8f3//3SljVasd9tuEApdWNRr8nTiFNXQNJ0CqsBZ0r06K4FC5Y/eqKBp0iuzlzSA7PNToJG2Ok4yxJI43Vr0grW/cVKBC1qpkfGOEvQ4JTnQamVAp5DrkgCtpnvQKeS6b2FjVqp2B72orAD1t6BBDwhTVOkMGtqh8bU6g1ZZIRoz6DgabwuWbB0/AJoqwWG7C9JTezucQANci32IltvduyF7x884x/Dvj1OqWKBrw+3+9GRG7WlMa6/DtDtza96cf9zC7kZDgzYL3+58nKVLWNS4oOvt4GcD9phXVijQqEdZtXY5dy1BLwelc2Y4a6cG/hn1Gtb/oDHbDaiWuo0iuKVCGrOvYz1c+bXUXwSRdIfYEtZ6XBjcKNKARSJi713pczlrPtIg3eC17Q4EuSH5jv8PXCP6RPbcJX+34gvtasVON4IlT7rCuixkevoiW/qksW5lmYXuD30AaagLnfVGB4gHkC6QrijXmi5TnkD6DXTpftZ0mfII0h3OGInxokx5BukGZjDKSnN+CukPyqiflub8GNIVyPCqEM5WM+6cA5BxbBecn0O6wBgweMH5QaTfECMzLzg/iXSHMAS29Z6jZua5vk7jiCtiAzDW2JfzOOnf7AaTEOkv+UHdgx9ns7OGMGukp0G+JT96nuTsuu003pCWfzDyLxXijymUfpxH7XQiUGuwMaVv0edBeH/mf729Io01QLMRfvBm9ONcsvTOpMWf9bVroewTTkaznPn3KIYr0kiNNcKPkvU+nE1/0JquSONMOS5kn9lrCRJM3CC1X5GGMY9O9OHImuHMJTar3riS7pWIGtGnUHcPzutxq+WC9AYy6riSfNx3ps2WjxsevXZmgShbCtHnqnv3f+vpYKWvSCN80m/JB9hnZjOCiRuuO6G1BvikGws6vklPTCBg4oZz49gMEDwqCzq6SRt2IeTjhpsrDOJbHsXLgo6epEtH41gPD7VO5aeKre4E+qOiauEY8XHDdeOjlV4OPxZ0RJOmi5WN2eQP+qa1sHdUFnR0k24pQHw24zXy/xZaxVXxsqCjB7zdxaGdv2dmaEctmzsaCzq+d2iHyNE6ouVzci96AFBZ0IHeEW7RI5MWfNSy3rGrmCpeFnS8gEeHNh0WOFgbGiVnpndn0JHOs+giYmLcJTTjGckk/WVBx/eOiUNjv0J/afaPVqt4Kl4WdHzvWHiLHhicXqV4L/cuXEeAjuAdzBdGs+HFOdEkVxt+EaDjecdxlgmzaD7hDWIvtRQvAnSEmoUGzfxKuEkPYkG6OYPmapa0QB9EVJQCXZ1As96RQQc4hwXNe0cGHeAcFjTvHRl0sHNY0HeH4Rl0wPH3CTQTpTPokBBtQbPLYQYdshRa0OxymEGHLIUWNLscCoDuA4QCuiJAMztLMUGHCwR09yJAM8thBh2yFFrQbMLLoEOyHQ36owhl0P76EKDZhJdB/2LvDnYaBmIggGaWbWhKElIKyv//KRKXwIlpx1bXiefK7cnyek3UVWa7DfrfCS+hxdnuB5oo6YSWCxodiJJOaLmg0YEo6YSWCxodiJJOaK2gN2jhHq5Dn7wzr38yb38ZO59UBtq/pNeGcptPnXl6cNDVuEuPr9fb+VfWtjJbO5dKQqM3ZZ7XxnMbXQt6g3YdPN5bK2D33wEq4KF7w090I+TFvaDRwbWkP9YQORsXNA+9mH04GiMfdtALAW2+lz6tQfJqvIfmoavRz1MFiV2TrndCY8iKfiQDCGiHW0uA2e4no/VdhYdGb7PPCZHZfrTjoVEOM3a8eYx2PPRkcgEPIH3trDKx0B5f07S+6jh/mjkPIKD9tnjj5/Wr1UPx6/rutrXjoRt5CydMFjwI3cCDFpFywePQ9flvtIRJqf9BZ/NwbRwbdDYP18axQWfzMGkcIjRae8660UwQoZ//wlOIDJChW3gdrvkUGEC38bJk26kW0E9/taz99OCgs01rGUBCZ5uWUsBCZ5uWUu+Dzqu4cPVmofNA1A9CHjqXHtKKg4fOpYew4mCgU9rGmYfO9ZKwSuKg80BUDkIeOqUNnHnovIsLN28eOoc8dbDjoXPrIW04eOgc8rTBjodOadGZh05p0ZmHTmnRmYdOadGZh05p0ZmHTmnRmYdOadGZh05p0ZmHTmnRmYdOadWZh84N0117JA06t6b8XlSEzv8E0Ht+ETqlFWcdGtNBjsQygY4OfdzhQxg3rKBRDzB8XO521qGP2Kh7CBGgj/at6QIhIvSBGrXWnnXoo9xdBsjRoQ/QqHsIMYTeeftQ24Yl9J7bxwA5ptA7vSaWCQYxht7h5eVSYZkOtll2UtRlgVnsofdT1Lbl7AC9j6I2L2e4QKMGHz+GCuv4QMceP8oEj3TwSR+UuvTwiBt01P4xVLjEETri/HFxY3aFjjZ/lAVucYaO1Kq/u7HbFAWCGAjDXSEEEgj0/U+77ezK/lFRsZNy3iM8FJkPMWxsO/S3UO9mLoCGfsGfalPsbmB/yr1qKWCugQbzARFDQWXQrNRVzIXQwKR7r46JsgYKS6qvRU+UVQxN9FwUU5Q2UF0SXJBI1NYB3T5rMUV9Aw09b30S5dVAV+nl1uKJrgbaemx9KmU0Q+P+DTnLxfirH3qlc++wxaeiPQLoS2qxBVuifcpHNNCX1Fw+u2QWZIAK+igt5CNDTnDFBn2U5iHvEjud8YoU+jedh/cLwgwPvdtRQ1/TnGbuEbL6l5VVhLvZTGLgaz8Pat7ja3hSLQAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/utils/bannerProVisibility.js
var BANNER_PRO_RESOURCES_READY_EVENT = "banner_pro_resources_ready";
function shouldShowBannerPro(img = {}) {
	return Boolean(img.bannerPro?.posterData?.length && img.bannerPro?.status === "enabled" && img.isShowBannerPro);
}
//#endregion
//#region source-snapshot/src/container/orderPage/index.js
var CategoryList = (0, import_react.lazy)(() => __vitePreload(() => import("./categoryList-Cha55-qa.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]), import.meta.url));
var CurrentItemList = (0, import_react.lazy)(() => __vitePreload(() => import("./currentItemList-Ozb4c9c4.js"), __vite__mapDeps([24,1,2,3,4,25,26,5,6,7,8,9,10,11,12,14,13,27,15,28,29,30,31,32,33,34,35,18,36,37,19,38,21,39,40,41,42,43,16,17,44,45,46,47,48,49,50,51,52,53,54,55,56,57,22,58,59,60,61,62,63,64,65,66,67,68,69,20,70,71,72]), import.meta.url));
var isVertical = getDeviceOrientation() === "vertical";
/** 根据当前 menuGroup 计算可展示菜品，避免 menuGroup 异步更新后 state 仍为空 */
function computeValidMenuList(menuGroup) {
	return (menuGroup || []).map((group) => group?.menuCategories || []).flat().map((each) => each?.saleItems || []).flat().filter((item) => !item?.hiddenItem);
}
var OrderPage = class extends import_react.Component {
	constructor(props) {
		super(props);
		const showBannerPro = shouldShowBannerPro(props.img);
		this.state = {
			errorApiMsg: "",
			errorApiShow: false,
			isShowBanner: false,
			showBannerPro,
			isBannerProPrimaryReady: !showBannerPro,
			showLoginGuideDialog: false,
			isShowWaitingTimeModal: false,
			time: 20,
			isCategoryReady: false,
			isItemListReady: false
		};
		this.timer = null;
		this.noMenuTimer = null;
		this.listRef = import_react.createRef();
		this.waitingInfoRef = null;
	}
	showApiModalTip = (errMsg) => {
		this.setState({
			errorApiMsg: errMsg,
			errorApiShow: true
		});
		this.timer = setTimeout(() => {
			this.setState({
				errorApiMsg: "",
				errorApiShow: false
			});
		}, 2e3);
	};
	parseSurchargeXml = (data) => {
		let start = data?.indexOf("<soap:Body>");
		let end = data?.indexOf("</soap:Body>");
		data = data?.substring(start + 11, end);
		return new XMLObjTree().parseXML(data)?.listchargesresponsetype?.charge;
	};
	updateInfo = () => {
		judgeSskeyIsActiveTime().then(() => {
			getMarginappFetchConfig().then((res) => {
				if (res.data.result.successful) {
					if (res.data.marginAppConfigTypes.length) {
						let obj = res.data.marginAppConfigTypes?.find((p) => p.product == "KIOSKLITE");
						let configObj = JSON?.parse(obj.data);
						getChargeList().then((resp) => {
							let surchargeList = [];
							let surchargeInfo = resp.data ? this.parseSurchargeXml(resp.data) || [] : [];
							if (Object.prototype.toString.call(surchargeInfo) === "[object Object]") surchargeList?.push(surchargeInfo);
							else surchargeList = [...surchargeInfo];
							surchargeList?.unshift({
								id: -1,
								name: "Free",
								rate: 0,
								ratetype: 1,
								type: "DEFAULT"
							});
							surchargeList?.forEach((sur) => {
								sur.rate = parseFloat(Big(sur.rate).toFixed(2));
							});
							if (configObj.charge?.length) configObj?.charge?.forEach((c) => {
								if (c?.select?.id) {
									let r = surchargeList?.find((item) => item.id == c.select.id);
									if (r) {
										if (c.id === 1) if (c.select.rate === r.rate && c.select.ratetype === r.ratetype) c.select = r;
										else c.select = {};
										else if (c.id == 2 || c.id == 3) if (r.ratetype == 1) c.select = r;
										else c.select = {};
									} else c.select = {};
								}
							});
							else configObj.charge = [];
							this.props.setSelfConfig(configObj);
						}).catch(() => {
							configObj.charge = [];
							this.props.setSelfConfig(configObj);
						});
					}
				} else this.showApiModalTip(res.data?.result?.failureReason);
			}).catch((err) => {
				this.showApiModalTip(err?.message);
			});
		});
	};
	crmIntegrationSDKInit = async () => {
		const { allSysConfig } = this.props;
		if (!checkCRMStatus(allSysConfig)) {
			if (checkCRMType(allSysConfig) === 2) await crmIntegrationSDK.mount();
		}
	};
	componentDidMount() {
		this.initializePage();
	}
	initializePage = async () => {
		this.props.setkeyboardToggle(false);
		this.props.setTabelServiceType("");
		this.props.setOrderStatus("");
		this.props.clearCurrentItem();
		this.props.resetCurrentOrderCombo();
		this.props.setIsReorderFlag(false);
		this.props.initEditOrderMode();
		this.props.setEditComboQty(1);
		this.props.setCardPaidResult({});
		this.props.setGiftCardPaymentInfo(null);
		this.props.clearECardState();
		await Promise.all([this.updateInfo(), this.crmIntegrationSDKInit()]);
		if (!await this.noMenuCountDown()) return;
		this.checkIsShowBannerPro();
		this.checkIsShowLoginGuideDialog();
		this.checkIsShowWaitingTimeModal();
		EventBus.on("show_banner_in_orderpage", this.handleShowBannerFromLoginCRM);
	};
	componentDidUpdate(prevProps) {
		const prevValid = computeValidMenuList(prevProps.menuGroup);
		const currValid = computeValidMenuList(this.props.menuGroup);
		if (!prevValid.length && currValid.length) {
			if (this.noMenuTimer) {
				clearInterval(this.noMenuTimer);
				this.noMenuTimer = null;
			}
			this.setState({ time: 20 });
		} else if (prevValid.length && !currValid.length) this.startNoMenuTimer();
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
		this.noMenuTimer && clearInterval(this.noMenuTimer);
		this.props.clearSearchKeyWord();
		this.props.removeSearchItem();
		EventBus.off("show_banner_in_orderpage", this.handleShowBannerFromLoginCRM);
	}
	shakeRequiredCategoryTip = () => {
		if (!this.requiredCategoryTipDom) return;
		this.requiredCategoryTipDom.classList.remove(orderPage_module_default.tipBoxShake);
		this.requiredCategoryTipDom.getBoundingClientRect();
		this.requiredCategoryTipDom.classList.add(orderPage_module_default.tipBoxShake);
	};
	checkIsShowBanner = () => {
		const { img: { isShowBanner, banner } } = this.props;
		if (banner && isShowBanner) this.setState({ isShowBanner: true });
	};
	closeBanner = () => {
		this.props.setShowBanner(false);
		this.setState({ isShowBanner: false });
	};
	checkIsShowBannerPro = () => {
		if (shouldShowBannerPro(this.props.img) && !this.state.showBannerPro) this.setState({
			showBannerPro: true,
			isBannerProPrimaryReady: false
		});
	};
	handleBannerProPrimaryImageReady = () => {
		if (!this.state.isBannerProPrimaryReady) {
			this.setState({ isBannerProPrimaryReady: true });
			EventBus.emit(BANNER_PRO_RESOURCES_READY_EVENT);
		}
	};
	closeBannerPro = () => {
		this.props.setShowBannerPro(false);
		EventBus.emit(BANNER_PRO_RESOURCES_READY_EVENT);
		this.setState({
			showBannerPro: false,
			isBannerProPrimaryReady: true
		});
	};
	checkIsShowWaitingTimeModal = () => {
		const { img: { isShowWaitingTimeModal }, selfConfig } = this.props;
		const overTimeShowModal = selfConfig?.configList?.find((each) => each.id === 44)?.value?.overTimeShowModal;
		const shouldShow = this.waitingInfoRef?.shouldShow || false;
		const waitingMinutes = Math.ceil(this.waitingInfoRef?.waitingTimeTotal / 60) || 0;
		const showModal = isShowWaitingTimeModal && shouldShow && overTimeShowModal && waitingMinutes > overTimeShowModal;
		this.setState({ isShowWaitingTimeModal: showModal });
	};
	setWaitingInfoRef = (ref) => {
		this.waitingInfoRef = ref;
		if (this.props.img.isShowWaitingTimeModal) this.checkIsShowWaitingTimeModal();
	};
	closeWaitingTimeModal = () => {
		this.props.setShowWaitingTimeModal(false);
		this.setState({ isShowWaitingTimeModal: false });
	};
	checkIsShowLoginGuideDialog = () => {
		const { img: { isShowLoginGuideDialog }, selfConfig, allSysConfig } = this.props;
		const loginGuideStatus = selfConfig?.configList?.find((each) => each.id === 45).value?.dialog?.status;
		if (!checkCRMStatus(allSysConfig) && loginGuideStatus && isShowLoginGuideDialog) this.setState({ showLoginGuideDialog: true });
		else this.checkIsShowBanner();
	};
	confirmLoginGuideDialog = () => {
		this.closeLoginGuideDialog(true);
		EventBus.emit("open_login_modal");
	};
	closeLoginGuideDialog = (goInput = false) => {
		if (!goInput) this.checkIsShowBanner();
		this.props.setShowLoginGuideDialog(false);
		this.setState({ showLoginGuideDialog: false });
	};
	handleShowBannerFromLoginCRM = () => {
		this.checkIsShowBanner();
	};
	handleBackHome = () => {
		this.props.history.push("/");
	};
	startNoMenuTimer = () => {
		if (this.noMenuTimer) return;
		this.setState({ time: 20 });
		this.noMenuTimer = setInterval(() => {
			if (this.state.time > 0) this.setState({ time: this.state.time - 1 });
			else this.handleBackHome();
		}, 1e3);
	};
	noMenuCountDown = async () => {
		if (!computeValidMenuList(this.props.menuGroup).length) {
			this.startNoMenuTimer();
			return false;
		}
		return true;
	};
	render() {
		const { requireCategory, crm: { isShowLoginBar, memberCRMInfo, selectedFreeItem }, img: { banner }, t, promotion, currentOrder, selfConfig, avocado: { hasAssertList } } = this.props;
		const { errorApiShow, errorApiMsg, isShowBanner, time, showBannerPro, showLoginGuideDialog, isShowWaitingTimeModal, isCategoryReady, isItemListReady, isBannerProPrimaryReady } = this.state;
		const validMenuList = computeValidMenuList(this.props.menuGroup);
		const isRequireTipShow = !!requireCategory.length;
		const { itemList, isShowCheckFooter } = currentOrder;
		const isTopMenu = selfConfig?.configList?.find((each) => each.id === 33).value === 1;
		let classname = "";
		if (isRequireTipShow) classname = "orderPageRequire";
		let headerHeight = STANDARD_TOP;
		const rewardTop = hasAssertList ? isVertical ? 35 : 26 : 12;
		if (isShowLoginBar) headerHeight += memberCRMInfo?.id ? rewardTop : 22;
		const allOrderItems = [...itemList];
		if (selectedFreeItem?.length > 0) allOrderItems.push(...selectedFreeItem);
		const isOrderedItem = allOrderItems.length > 0;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			(!showBannerPro || isBannerProPrimaryReady) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderPage_module_default.orderPage,
				style: { top: isShowLoginBar ? "auto" : "8.8rem" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(waitingInfo_default, {
						isFixed: true,
						ref: this.setWaitingInfoRef
					}),
					isRequireTipShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: (el) => this.requiredCategoryTipDom = el,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(requireCategoryTip_default, {})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: [
							orderPage_module_default.orderPageBody,
							classname ? orderPage_module_default[classname] : "",
							isTopMenu ? orderPage_module_default.topMenu : ""
						].join(" "),
						onClick: () => {
							this.props.setkeyboardToggle(false);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryList, {
							headerHeight,
							listRef: this.listRef,
							isTopMenu,
							onReady: () => this.setState({ isCategoryReady: true })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CurrentItemList, {
							headerHeight,
							listRef: this.listRef,
							isTopMenu,
							deferImages: showBannerPro,
							onReady: () => {
								this.setState({ isItemListReady: true });
							}
						})]
					}),
					isOrderedItem && isShowCheckFooter && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(footBtn_default, { onMissingRequiredCategory: this.shakeRequiredCategoryTip }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(changeBrandBtn_default, {})
				]
			}),
			errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
				variant: "filled",
				severity: "error",
				children: errorApiMsg
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: isShowBanner,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: orderPage_module_default.bannerWrapper,
					onClick: (e) => e.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: orderPage_module_default.banner,
						style: { backgroundImage: `url(${banner})` }
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: orderPage_module_default.start,
						onClick: this.closeBanner,
						children: t("i-know")
					})]
				}),
				onClose: this.closeBanner
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: showLoginGuideDialog,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(loginGuideDialog_default, {
					onClose: () => {
						this.closeLoginGuideDialog(false);
					},
					handleConfirm: this.confirmLoginGuideDialog
				}),
				onClose: () => {
					this.closeLoginGuideDialog(false);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: showBannerPro,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(bannerPro_default, {
					onClose: this.closeBannerPro,
					onPrimaryImageReady: this.handleBannerProPrimaryImageReady
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: isShowWaitingTimeModal,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: orderPage_module_default.waitingTimeWrapper,
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: waiting_default,
							className: orderPage_module_default.waitingTimeImg
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(waitingInfo_default, { outputNormalText: true }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderPage_module_default.gotIt,
							onClick: this.closeWaitingTimeModal,
							children: t("i-know")
						})
					]
				}),
				onClose: this.closeWaitingTimeModal
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: !validMenuList.length,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(noMenuTips_default, {
					handleBackHome: this.handleBackHome,
					time
				})
			}),
			!showBannerPro && (!isCategoryReady || !isItemListReady) && validMenuList.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FallbackLoading, {})
		] });
	}
};
function mapStateToProps(state) {
	return {
		requireCategory: state.requireCategory,
		currentOrder: state.currentOrder,
		crm: state.crm,
		menuGroup: state.menuGroup,
		selfConfig: state.selfConfig,
		brandSetting: state.brandSetting,
		img: state.img,
		promotion: state.promotion,
		allSysConfig: state.allSysConfig,
		avocado: state.avocado
	};
}
var orderPage_default = connect(mapStateToProps, {
	initEditOrderMode,
	setEditComboQty,
	clearCurrentItem,
	setkeyboardToggle,
	resetCurrentOrderCombo,
	setSelfConfig,
	setIsReorderFlag,
	setOrderStatus,
	setCardPaidResult,
	setGiftCardPaymentInfo,
	clearECardState,
	setTabelServiceType,
	clearSearchKeyWord,
	removeSearchItem,
	setCateDish,
	setShowBanner,
	setShowBannerPro,
	setShowWaitingTimeModal,
	setShowLoginGuideDialog
})(withTranslation()(OrderPage));
//#endregion
export { orderPage_default as default };
