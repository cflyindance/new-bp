import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { G as require_dayjs_min, W as removeEmoji, g as fetchCompanyProfile, p as solveScrollElem, s as isOpenVtkeyboadrd } from "./utils-Cdx9DbDR.js";
import { l as _extends, r as connect, u as init_extends } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { Ar as getOccupiedQtyByStockId, Bi as getOrderMemberPrices, Cr as judgeConfigToSoldout, Ei as getSatisfiedExchangePurchaseRules, Ft as setEditOrderMode, G as payByCash, Gr as getOrderInfoObj, Ir as showInsufficientStockToast, Jr as isHasCRMCampaignFn, Kn as changeFreeItem, L as initEditOrderMode, Lr as validateComboSubmitStock, M as getCurrentItem, Nr as isInvalidStockNum, O as editOrderItemAction, Pr as isStockSufficient, Qi as Big, Si as getExchangePurchaseDiscountedUnitPrice, Sr as judgeCharge, U as notes, W as payByCard, Zi as getItemPrice, _r as getMissingRequiredCategories, aa as getStockItemId, an as setSelfConfig, br as judegOrderDishIsHasSoldout, da as require_cloneDeep, fn as setSideNavIndex, ft as resetCurrentOrderCombo, gn as setTogoOption, gr as getItemSizeName, j as getCurrentCategory, kr as getItemStockNum, la as getOrderItemCategory, lr as calcCardMinAmout, mi as getMemberCheckoutState, mn as setTabelServiceType, mr as getDishItemLanguage, n as addCampaignItemsToOrder, or as setTempCampaign, pn as setSideNavList, pr as getCurrentItemLanguage, pt as saveOrderResult, qi as GIFT_PROMOTION_TYPE, qt as setLocator, ti as checkIsRuleValid, ua as isMembershipCard, ui as canUseMemberPrice, wn as spliceOrderBySoldout, wr as judgeHasDetailInfo, zi as getItemActualPrices } from "./actions-BwRPwnFF.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { t as Icon } from "./AntdIcon-bxYy9EiO.js";
import { a as ItemDeleteDrawer_module_default, i as deleteDishModal_default, n as ItemsDrawer_default } from "./useCrmPromotionContrary-DFA1wQZz.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { a as isSameItems, i as handleCheckOrderPromotion, t as useAddOnPromotion } from "./hooks-DiifsOH5.js";
import { a as setBuyGifts, m as setSatisfyRules, n as changePromotionStatusAfterCheck, p as setPromotionCode, u as setItemValidPromotion } from "./promotion-BUTvAW3c.js";
import { n as getPromotionCenterActivityRuleText, r as getPromotionCenterTextFromTextObject, t as getPromotionActivityDisplayText } from "./getPromotionCenterDisplayText-Bfjuriuq.js";
import { n as withMemberPrivilege } from "./useMemberPrivilege-BabAJmwD.js";
import { n as imgCard_default, t as star_default } from "./star-C6iOuR53.js";
import { c as require_Remove, f as BenefitPrice, l as require_Add, o as require_Delete, t as DescModal, u as Fab_default } from "./DescModal-Q1_miAgO.js";
import { t as orderDetailModal_default } from "./orderDetailModal-CXMeGrAX.js";
import { t as comboPanel_default } from "./comboPanel-D4O1jWqz.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { r as isTipEnabledForPayment } from "./tipPaymentMethods-DcvlIwUR.js";
import { n as CallerBoard_default, t as navigatePartySizeIfNeeded } from "./navigatePartySizeIfNeeded-BuTz0eO5.js";
import { n as requireCategoryTip_default, t as soldoutModal_default } from "./soldoutModal-CCd1O5t5.js";
import { t as cardMinAmount_default } from "./cardMinAmount-DfJqO2k_.js";
import { t as judgeOnlyHaveFreeItem } from "./judgeOnlyHaveFreeItem-Bgp5tyri.js";
import { t as runJudgeSMSAfterOperation } from "./runJudgeSMSAfterOperation-CBdP8zKG.js";
import { t as require_round } from "./round-CmfkCJn-.js";
import { t as comboItemsDetailModal_default } from "./comboItemsDetailModal-W9qdOX-Y.js";
import { t as BottomToast } from "./bottomToast-B74lRND-.js";
import { a as getVariantDescription, i as ItemPromotionModal_default, r as removeMembershipCard, t as getMemberPricedCartItems } from "./memberCartPrices-h2WovEgt.js";
import { t as cardPayTipModal_default } from "./cardPayTipModal-LshELHlv.js";
//#region node_modules/@ant-design/icons-svg/es/asn/RightOutlined.js
var RightOutlined = {
	"icon": {
		"tag": "svg",
		"attrs": {
			"viewBox": "64 64 896 896",
			"focusable": "false"
		},
		"children": [{
			"tag": "path",
			"attrs": { "d": "M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z" }
		}]
	},
	"name": "right",
	"theme": "outlined"
};
//#endregion
//#region node_modules/@ant-design/icons/es/icons/RightOutlined.js
init_extends();
var import_react = /* @__PURE__ */ __toESM(require_react());
/**![right](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjYWNhY2EiIHZpZXdCb3g9IjY0IDY0IDg5NiA4OTYiIGZvY3VzYWJsZT0iZmFsc2UiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTc2NS43IDQ4Ni44TDMxNC45IDEzNC43QTcuOTcgNy45NyAwIDAwMzAyIDE0MXY3Ny4zYzAgNC45IDIuMyA5LjYgNi4xIDEyLjZsMzYwIDI4MS4xLTM2MCAyODEuMWMtMy45IDMtNi4xIDcuNy02LjEgMTIuNlY4ODNjMCA2LjcgNy43IDEwLjQgMTIuOSA2LjNsNDUwLjgtMzUyLjFhMzEuOTYgMzEuOTYgMCAwMDAtNTAuNHoiIC8+PC9zdmc+) */
var RefIcon = /*#__PURE__*/ import_react.forwardRef(function RightOutlined$1(props, ref) {
	return /*#__PURE__*/ import_react.createElement(Icon, _extends({}, props, {
		ref,
		icon: RightOutlined
	}));
});
RefIcon.displayName = "RightOutlined";
var orderReview_module_default = {
	orderReview: "orderReview___KmfW2",
	noCrmBar: "noCrmBar___bYhBb",
	tipBox: "tipBox___J5eCe",
	tipBoxShake: "tipBoxShake___wF-79",
	shakeRequiredCategoryTip: "shakeRequiredCategoryTip___LgO3x",
	maxNote: "maxNote___aX-D1",
	area: "area___OK2VG",
	title: "title___XfUCM",
	sub: "sub___Fh3gN",
	textareaBox: "textareaBox___0X166",
	textContent: "textContent___LrT3h",
	iconEmpty: "iconEmpty___QofGZ",
	bottomSpacer: "bottomSpacer___dfWzQ",
	orderItemListContainer: "orderItemListContainer___2H6Pw",
	giftListWrapper: "giftListWrapper___zt1zR",
	titleRow: "titleRow___lvQHB",
	titleText: "titleText___8z0kQ",
	btn: "btn___JuMvA",
	orderItemInfoBx: "orderItemInfoBx___JkGs9",
	orderBox: "orderBox___--AlP",
	info: "info___ahAfb",
	hasNoteInfo: "hasNoteInfo___blWlZ",
	orderItemImage: "orderItemImage___D0uLb",
	textInfo: "textInfo___n5xmh",
	optText: "optText___vH-lb",
	name: "name___3TQNG",
	opt: "opt___JjMQD",
	price: "price___csCya",
	pointImg: "pointImg___UfZDE",
	discountPrice: "discountPrice___UwcsT",
	promotionItemPrice: "promotionItemPrice___nKtpP",
	originPrice: "originPrice___dfOw-",
	tag: "tag___CwvDK",
	note: "note___AgCDP",
	calcBox: "calcBox___rvuMc",
	calcBoxIcons: "calcBoxIcons___Ss3yC",
	muiDiyIcon: "muiDiyIcon___5HI--",
	btnDis: "btnDis___mrGd5",
	btnEn: "btnEn___3CGVO",
	qty: "qty___ghTUS",
	giftsNumber: "giftsNumber___glR3z",
	promotion: "promotion___6a--9",
	removeBtnBg: "removeBtnBg___lJxlE",
	removeBtn: "removeBtn___QD2t3",
	promoCodeArea: "promoCodeArea___HG678",
	promoCodeWrap: "promoCodeWrap___k4RcR",
	promoCodeTitle: "promoCodeTitle___nP1PR",
	promoCodeBtn: "promoCodeBtn___iluXN",
	promoCodeBtnDisabled: "promoCodeBtnDisabled___0u7Mo",
	promoCodeOpration: "promoCodeOpration___tjCIj",
	promoCodeText: "promoCodeText___RQPRN",
	joinedRewardTips: "joinedRewardTips___-betZ",
	orderDiscountInfo: "orderDiscountInfo___4P6-s",
	aimRule: "aimRule___9cEca",
	promotionCenterInfo: "promotionCenterInfo___6boqB",
	progressBar: "progressBar___xhvIV",
	progressRow: "progressRow___e263N",
	progressWrapper: "progressWrapper___HJEnS",
	progressInner: "progressInner___8TnEH",
	nextThresholdPrice: "nextThresholdPrice___aqQ8p",
	nextLevelReward: "nextLevelReward___LriQ1",
	goAddItems: "goAddItems___fcWgG",
	promotionTagList: "promotionTagList___92DzA",
	promotionTag: "promotionTag___NuBmL",
	footBtnBox: "footBtnBox___rf3aH",
	actived: "actived___OgN2j",
	noActived: "noActived___UNBaV",
	cartIcon: "cartIcon___NXJJ9",
	cart: "cart___LPG-E",
	count: "count___fB1FH",
	cartAnimation: "cartAnimation___drk4R",
	cartAdd: "cartAdd___Bx7Od",
	countAnimation: "countAnimation___G1sW7",
	countAdd: "countAdd___4w-Bq",
	footContent: "footContent___zTbaJ",
	hasDiscount: "hasDiscount___Epxml",
	total: "total___kYVUZ",
	footContentSameWidth: "footContentSameWidth___ktf-n",
	discountInfo: "discountInfo___hcfzb",
	right_img: "right_img___KUKLZ",
	savedInfo: "savedInfo___qJv9S",
	saved: "saved___8nIyy",
	discountNum: "discountNum___eUfYh"
};
//#endregion
//#region source-snapshot/src/container/orderReview/components/PromoCodeInput.module.scss
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var import_Add = /* @__PURE__ */ __toESM(require_Add());
var import_Remove = /* @__PURE__ */ __toESM(require_Remove());
var import_Delete = /* @__PURE__ */ __toESM(require_Delete());
var import_round = /* @__PURE__ */ __toESM(require_round());
var PromoCodeInput_module_default = {
	containerBox: "containerBox___eAsqU",
	itemBox: "itemBox___3a3y-",
	itemName: "itemName___QpVnc",
	subItemName: "subItemName___2eFEV",
	inputBox: "inputBox___HrwqR",
	btnBox: "btnBox___Z9hJx",
	cancel: "cancel___IJPE8",
	apply: "apply___IkxXv",
	disabled: "disabled___29Pt6"
};
//#endregion
//#region source-snapshot/src/container/orderReview/components/PromoCodeInput.js
var import_jsx_runtime = require_jsx_runtime();
var PromoCodeInput = (props) => {
	const { isShowModal, handleContinue, handleCancel } = props;
	const [promoCode, setPromoCode] = (0, import_react.useState)("");
	const [keyboardToggle, setKeyboardToggle] = (0, import_react.useState)(false);
	const { t } = useTranslation();
	(0, import_react.useEffect)(() => {
		if (isShowModal) setPromoCode("");
	}, [isShowModal]);
	const changeLocator = (event, isVKboard = false) => {
		let value = isVKboard ? event : event.target.value;
		if (value?.length > 15) return;
		setPromoCode(value);
	};
	const showKeyboard = () => {
		setKeyboardToggle(true);
	};
	const hideKeyboard = () => {
		setKeyboardToggle(false);
	};
	const handleKeyUp = (e) => {
		if (e.keyCode === 13) handleContinue(promoCode);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		visible: isShowModal,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: PromoCodeInput_module_default.containerBox,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: PromoCodeInput_module_default.itemBox,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: PromoCodeInput_module_default.itemName,
						children: t("enterPromoCode")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: PromoCodeInput_module_default.subItemName,
						children: t("promoCodeSubtitle")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "promoCode",
					placeholder: t("enterPromoCode"),
					value: promoCode,
					className: PromoCodeInput_module_default.inputBox,
					type: "text",
					onChange: changeLocator,
					onKeyUp: handleKeyUp,
					onClick: () => {
						if (isOpenVtkeyboadrd()) showKeyboard();
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: PromoCodeInput_module_default.btnBox,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: PromoCodeInput_module_default.cancel,
						onClick: () => {
							handleCancel();
							hideKeyboard();
						},
						children: t("cancel")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: () => {
							handleContinue(promoCode);
							hideKeyboard();
						},
						className: promoCode ? `${PromoCodeInput_module_default.apply} animate-btn` : PromoCodeInput_module_default.disabled,
						children: t("apply")
					})]
				})
			]
		}),
		onClose: () => {
			handleCancel();
			hideKeyboard();
		}
	}), keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
		keyboardValue: promoCode,
		handlePressEnter: () => {
			handleContinue(promoCode);
			hideKeyboard();
		},
		changeInput: (v) => changeLocator(v, true),
		closeKeyboard: () => hideKeyboard(),
		VKOuterStyle: { zIndex: 9999 }
	}) : null] });
};
function mapStateToProps$1(state) {
	return {};
}
var PromoCodeInput_default = withRouter(connect(mapStateToProps$1)(PromoCodeInput));
//#endregion
//#region source-snapshot/src/utils/handleCalculateCloudPromotion.js
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min());
var handleCalculatePromotion = ({ promotionRules, orderType, itemList, totalAmount }) => {
	const cal = window.execute_promotion;
	const actualOrderType = orderType === "TO_GO" ? "TOGO" : orderType;
	return cal(promotionRules, {
		system: {
			merchantId: "M000015679",
			productLine: "KIOSK",
			local: {
				dayOfWeek: [
					"Sunday",
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday"
				][(0, import_dayjs_min.default)().day()],
				timeOfDay: (0, import_dayjs_min.default)().format("HH:mm"),
				dateTime: (0, import_dayjs_min.default)().valueOf()
			}
		},
		order: {
			orderType: actualOrderType,
			orderItems: itemList.map((each) => {
				return {
					...each,
					itemId: each.id,
					itemPrice: each.price
				};
			}),
			totalAmount
		}
	});
};
//#endregion
//#region source-snapshot/src/component/AddOnPromotion/index.js
/**
* 促销凑单功能组件
* 封装了 useAddOnPromotion hooks，可以在类组件中使用
*/
var AddOnPromotion = (0, import_react.forwardRef)((props, ref) => {
	const { onSkip, onClose, isGiftPromotionAutoOpenRewardModal, promotionCenterList } = props;
	const { drawerProps, goAddOnPromotion, handleCloseDrawer, handleDrawerConfirm } = useAddOnPromotion({
		onSkip,
		onClose,
		isGiftPromotionAutoOpenRewardModal,
		promotionCenterList
	});
	(0, import_react.useImperativeHandle)(ref, () => ({
		drawerProps,
		goAddOnPromotion,
		handleCloseDrawer,
		handleDrawerConfirm
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemsDrawer_default, {
		...drawerProps,
		onClose: handleCloseDrawer,
		handleConfirm: handleDrawerConfirm
	});
});
AddOnPromotion.displayName = "AddOnPromotion";
function calculateBottomSpacerPx(containerRect, obstructionRects, gapPx = 32) {
	const containerBottom = Number(containerRect?.bottom);
	if (!Number.isFinite(containerBottom)) return 0;
	const obstructionTop = (obstructionRects || []).reduce((highestTop, rect) => {
		const top = Number(rect?.top);
		const height = Number(rect?.height);
		if (!Number.isFinite(top) || !Number.isFinite(height) || height <= 0) return highestTop;
		return Math.min(highestTop, top);
	}, containerBottom);
	const overlap = Math.max(0, containerBottom - obstructionTop);
	return overlap > 0 ? Math.ceil(overlap + gapPx) : 0;
}
//#endregion
//#region source-snapshot/src/container/orderReview/index.js
var defaultMax = 99;
var OrderReview = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.addOnPromotionRef = import_react.createRef();
		this.state = {
			isScroll: false,
			maxNum: defaultMax,
			keyboardValue: props.currentOrder.notes || "",
			keyboardToggle: false,
			selectedItem: {},
			lastReuqireItem: {},
			deleteLoading: false,
			deleteSequence: -1,
			promoCodeVisiable: false,
			isHasSoldoutDish: false,
			dishMap: {},
			errorApiMsg: "",
			errorApiShow: false,
			isShowCardMinModal: false,
			currentAmount: 0,
			isHasOrderCharge: false,
			orderPanelShow: false,
			comboPanelVisible: false,
			comboPanelIdx: 0,
			descVisible: false,
			promotionFn: void 0,
			selectedPromotion: [],
			shouldAnimate: false,
			showCallBoard: false,
			tableServiceType: "",
			isShowDesc: false,
			itemPromotionVisible: false,
			deleteFreeItem: {},
			giftDeleteSelection: null,
			bottomSpacerPx: 0
		};
		this.orderDetailModal = import_react.createRef();
		this.comboItemModal = import_react.createRef();
		this.timer = null;
		this.flag = false;
		this.callBoardPromiseResolve = null;
	}
	openOrderDetailModal = (ref) => {
		this.orderDetailModal = ref;
	};
	openItemsDetailModal = (ref) => {
		this.comboItemModal = ref;
	};
	resolveItemDetail = (str) => {
		return str.replace(/,+/g, ",").replace(/x1|\(x1\)/g, "").replace(/\(\$0\)/g, "");
	};
	orderDetailWriter = (item) => {
		const { i18n: { language } } = this.props;
		let price = null;
		let options = null;
		let cateOptions = null;
		let stack = [];
		const isFreeItem = item.isFreeItem;
		const isPromotionItemFree = item.promotionItem && !item.isLocalExchangePurchaseItem;
		if (item.sectionDetail) item.sectionDetail.forEach((sct) => {
			if (sct.id == -1) price = sct;
			if (sct.id == -2) options = sct;
			if (sct.id == -3) cateOptions = sct;
		});
		if (price) {
			let size = getItemSizeName(price.sizeInfo.sizeId, price.sizeInfo.size, this.props.itemSizeList, language);
			if (isFreeItem || isPromotionItemFree) stack.push(size + "($0.00); ");
			else stack.push(size + ` ($${(0, import_round.default)(price.sizeInfo.price, 2).toFixed(2)}); `);
		}
		if (options) this.getOptionList(options.options).forEach((opt) => {
			let str = "";
			if (isFreeItem || isPromotionItemFree) str = opt.name + " ($0.00),";
			else str = opt.name + (" ($" + (0, import_round.default)(opt.price, 2).toFixed(2) + ")") + (" x" + opt.quantity) + ",";
			stack.push(str);
		});
		if (cateOptions) {
			const optMap = this.getOptionMap(cateOptions.options);
			Object.keys(optMap).forEach((id, i) => {
				let str = "";
				if (isFreeItem || isPromotionItemFree) str = optMap[id].name + " ($0.00),";
				else str = optMap[id].name + (" ($" + (0, import_round.default)(optMap[id].price, 2).toFixed(2) + ")") + (" x" + optMap[id].quantity) + ",";
				stack.push(str);
			});
		}
		if (item.sectionDetail) item.sectionDetail.forEach((sct) => {
			let itemsArr = [];
			if (sct.id > 0 && sct.items.length > 0) {
				sct.items.map((item) => {
					let str = "";
					if (!item.itemPrices) str = (getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name) + " ($" + (isFreeItem || isPromotionItemFree ? "0.00" : (0, import_round.default)(item.price, 2).toFixed(2)) + ") x" + item.quantity + ",";
					let optArr = [];
					if (item.selectedOptionList) item.selectedOptionList.forEach((list) => {
						if (list.id == -1) {
							let name = getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name;
							let size = getItemSizeName(list?.sizeInfo?.sizeId, list?.sizeInfo?.size, this.props.itemSizeList, language);
							optArr.push(`${name}(${size}) ($${isFreeItem || isPromotionItemFree ? "0.00" : list.sizeInfo.price})(x${item.quantity}),`);
						} else if (list.id === -2) this.getOptionList(list.options).forEach((opt) => {
							optArr.push(opt.name + (" ($" + (isFreeItem || isPromotionItemFree ? "0.00" : (0, import_round.default)(opt.price, 2).toFixed(2)) + ")") + (" x" + opt.quantity) + ",");
						});
						else if (list.id === -3) {
							const subOptMap = this.getOptionMap(list.options);
							Object.keys(subOptMap).map((id) => {
								optArr.push(subOptMap[id].name + (" ($" + (isFreeItem || isPromotionItemFree ? "0.00" : (0, import_round.default)(subOptMap[id].price, 2).toFixed(2)) + ")") + (" x" + subOptMap[id].quantity) + ",");
							});
						}
					});
					if (optArr.length > 0) {
						str += optArr.join(",");
						itemsArr.push(str);
					} else itemsArr.push(str);
				});
				stack.push(itemsArr);
			}
		});
		const stackStr = stack.join("");
		return this.resolveItemDetail(stackStr.endsWith(",") ? stackStr.slice(0, stackStr.length - 1) : stackStr);
	};
	getOptionMap(options) {
		const map = {};
		options.forEach((opt) => {
			if (map[opt.id]) map[opt.id].quantity++;
			else map[opt.id] = {
				id: opt.id,
				name: opt.name,
				quantity: 1,
				price: opt.price
			};
		});
		return map;
	}
	getOptionList(options) {
		const { i18n: { language } } = this.props;
		const list = [];
		options.forEach((opt) => {
			const idx = list.findIndex((item) => item.id === opt.id && item.price === opt.price);
			if (idx > -1) list[idx].quantity += opt.quantity;
			else {
				let name = getCurrentItemLanguage(opt.fieldDisplayNameGroups, language) || opt.name;
				list.push({
					id: opt.id,
					name,
					quantity: opt.quantity,
					price: opt.isFreeItem ? 0 : opt.price
				});
			}
		});
		return list;
	}
	handleContinue = () => {
		const { currentOrder, setTempCampaign, changeFreeItem, editOrderItemAction } = this.props;
		const { deleteFreeItem, deleteSequence } = this.state;
		console.log("deleteFreeItem", deleteFreeItem);
		if (deleteFreeItem?.isFreeItem || deleteFreeItem?.isCRMFreeItem) {
			setTempCampaign(null);
			changeFreeItem([]);
			if (currentOrder.itemList?.find((each) => each.isFreeItem || each?.isCRMFreeItem)) editOrderItemAction({
				deleteSequence,
				isSub: true
			});
		} else editOrderItemAction({
			deleteSequence,
			isSub: true
		});
		this.handleCancel();
	};
	handleCancel = () => {
		solveScrollElem(false);
		this.setState({
			lastReuqireItem: {},
			deleteLoading: false,
			deleteFreeItem: {}
		});
	};
	handleContinueOrder = () => {
		solveScrollElem(false);
		this.setState({ isShowCardMinModal: false });
	};
	handleCloseMin = () => {
		this.handleContinueOrder();
	};
	handleResetEmpty = () => {
		this.setState({ keyboardValue: "" });
		this.props.notes("");
	};
	handleAddSubNum = (item, isSub = false) => {
		if (isMembershipCard(item)) return;
		const { t, changePromotionStatusAfterCheck } = this.props;
		changePromotionStatusAfterCheck(item);
		if (this.state.keyboardToggle) this.hideKeyboard();
		if (isSub) if (item.quantity - 1 < 1) if (this.props.requireCategory.length) {
			let m = this.formatterRequireCategory();
			let arr = [];
			for (let key in m) arr.push(m[key]);
			if (m[item.categoryId] <= 1) {
				solveScrollElem(true);
				this.setState({
					lastReuqireItem: (0, import_cloneDeep.default)(item),
					deleteLoading: true,
					deleteSequence: item.sequence
				});
			} else {
				solveScrollElem(true);
				this.setState({
					lastReuqireItem: {},
					deleteLoading: true,
					deleteSequence: item.sequence
				});
			}
		} else {
			solveScrollElem(true);
			this.setState({
				lastReuqireItem: {},
				deleteLoading: true,
				deleteSequence: item.sequence
			});
		}
		else this.props.editOrderItemAction({
			deleteSequence: item.sequence,
			isSub
		});
		else {
			let newNum = item.quantity + 1;
			if (newNum <= this.state.maxNum) {
				const nextItemList = (this.props.currentOrder.itemList || []).map((orderItem) => {
					if (orderItem.sequence === item.sequence) return {
						...orderItem,
						quantity: newNum
					};
					return orderItem;
				});
				const stockCheckMap = {};
				const appendStockCheckItem = (checkItem) => {
					const checkStockItemId = getStockItemId(checkItem);
					const checkStockCloudId = checkItem?.cloudId;
					if (checkStockItemId == null && checkStockCloudId == null) return;
					const key = checkStockCloudId ? `${checkStockCloudId}` : `${checkStockItemId}`;
					if (!stockCheckMap[key]) stockCheckMap[key] = checkItem;
				};
				for (const section of item.sectionDetail || []) {
					if (section.id === -2 || section.id === -3) {
						for (const option of section.options || []) appendStockCheckItem(option);
						continue;
					}
					if (section.id <= 0) continue;
					for (const subItem of section.items || []) {
						appendStockCheckItem(subItem);
						const optionSectionList = subItem.selectedOptionList?.length ? subItem.selectedOptionList : subItem.sectionDetail;
						for (const optionSection of optionSectionList || []) {
							if (optionSection.id !== -2) continue;
							for (const option of optionSection.options || []) appendStockCheckItem(option);
						}
					}
				}
				for (const checkItem of Object.values(stockCheckMap)) {
					const checkStockNum = getItemStockNum(checkItem, this.props.store?.menuItemList);
					if (checkStockNum === void 0) continue;
					const checkStockItemId = getStockItemId(checkItem);
					const checkStockCloudId = checkItem.cloudId;
					const checkOccupiedQty = getOccupiedQtyByStockId({
						itemList: nextItemList,
						currentOrderCombo: this.props.store?.currentOrderCombo,
						crm: this.props.crm,
						promotion: this.props.promotion,
						stockItemId: checkStockItemId,
						stockCloudId: checkStockCloudId,
						menuItemList: this.props.store?.menuItemList
					});
					if (isInvalidStockNum(checkStockNum) || checkOccupiedQty > checkStockNum) {
						showInsufficientStockToast("top", checkItem, this.props.store?.menuItemList);
						return;
					}
				}
				if (this.props.editOrderItemAction({
					deleteSequence: item.sequence,
					isSub
				}) === false) return;
				if (newNum == this.state.maxNum) toast_default.info(t("max-up", { rplc: defaultMax }), "top");
			}
			this.setState({ shouldAnimate: true }, () => {
				this.animationTimer = setTimeout(() => {
					this.setState({ shouldAnimate: false });
				}, 500);
			});
		}
	};
	keyboardChange = (eventOrValue) => {
		let value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
		value = removeEmoji(value);
		if (eventOrValue?.target) eventOrValue.target.value = value;
		if (value.length > 255) value = value.substr(0, 255);
		this.setState({ keyboardValue: value });
		this.props.notes(value);
	};
	onChange = (input) => {
		this.setState({ keyboardValue: input });
		this.props.notes(input);
		this.inputRef.scrollIntoViewIfNeeded(true);
	};
	showKeyboard = () => {
		this.setState({ keyboardToggle: true });
	};
	hideKeyboard = () => {
		this.setState({ keyboardToggle: false });
	};
	dineInProcess = async () => {
		const { selfConfig, history, setLocator, setTabelServiceType } = this.props;
		const serviceTypes = selfConfig?.configList?.find((each) => each.id === 4)?.value;
		const serviceSwitch = selfConfig?.configList?.find((each) => each.id === 29)?.value;
		const chooseTableSwitch = selfConfig?.configList?.find((each) => each.id === 39)?.value;
		const sendFoodToTable = !!serviceTypes.find((each) => each === 1);
		const isActualSwitchOpen = serviceSwitch && serviceTypes?.length > 0;
		if (isActualSwitchOpen || serviceTypes?.length === 2) {
			history.push("./tabelService");
			return;
		} else if (chooseTableSwitch && sendFoodToTable) {
			history.push("./chooseTable");
			return;
		}
		if (!isActualSwitchOpen) {
			if (!serviceTypes?.length) {
				await this.judgeSMSAfterOperation();
				return;
			}
			if (serviceTypes?.length === 1) {
				const isShowDesc = serviceTypes[0] === 1;
				setLocator("");
				if (selfConfig?.configMap?.id_28 === 1) {
					this.setState({
						tableServiceType: "DINE_IN",
						isShowDesc,
						showCallBoard: true
					});
					await this.showCallBoard();
				} else setTabelServiceType("DINE_IN");
				await this.judgeSMSAfterOperation();
			}
		}
	};
	togoProcess = async () => {
		const { selfConfig, systemConfig, setLocator, currentOrder } = this.props;
		const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
		setLocator("");
		const locatorType = selfConfig?.configMap?.id_28;
		const togoShowNumCards = selfConfig?.configMap?.id_36;
		if (locatorType === 1 && (currentOrder.orderType !== "TO_GO" || currentOrder.orderType === "TO_GO" && togoShowNumCards)) {
			this.setState({
				tableServiceType: "TO_GO",
				isShowDesc: false,
				showCallBoard: true
			});
			await this.showCallBoard();
		}
		if (judgeCharge()) if (paymentRouteResult.onlyCard) this.handleConfirmOrderCharge();
		else await this.judgeSMSAfterOperation();
		else if (!isTipEnabledForPayment(selfConfig, "CREDIT_CARD") && calcCardMinAmout() && paymentRouteResult.onlyCard) this.setState({
			isShowCardMinModal: true,
			currentAmount: calcCardMinAmout()
		});
		else await this.judgeSMSAfterOperation();
	};
	getSatisfyRules = (rules, itemList) => {
		return rules.filter((rule) => {
			const inThisRuleItems = itemList.filter((item) => rule.activityRule.buyDishes.includes(item.id));
			const orderNumbers = inThisRuleItems.reduce((pre, cur) => {
				return pre + (cur.quantity ?? 0);
			}, 0);
			const needOrderNumbers = Number(rule.activityRule.buyNumber);
			if (rule.activityRule.buyType === "identical") {
				const quantityByItemId = inThisRuleItems.reduce((result, item) => {
					result[item.id] = (result[item.id] || 0) + Number(item.quantity || 0);
					return result;
				}, {});
				return Object.values(quantityByItemId).some((quantity) => quantity >= needOrderNumbers);
			}
			if (orderNumbers >= needOrderNumbers) return true;
			return false;
		});
	};
	getLocalPromotionOrderAmount = (itemList) => {
		const { currentCategoryList } = this.props;
		const pricedItems = getMemberCheckoutState({
			crm: this.props.crm,
			avocado: this.props.avocado,
			allSysConfig: this.props.store.allSysConfig,
			currentOrder: { itemList }
		}).currentOrder.itemList;
		return Number(pricedItems.filter((item) => !item.isLocalExchangePurchaseItem).filter((item) => {
			return getOrderItemCategory(currentCategoryList, item)?.applicableToTriggerPromotion;
		}).reduce((total, item) => Big(total).plus(Big(getItemPrice(item) || 0).times(item.quantity || 0)), Big(0)).toFixed(2));
	};
	handleCheckExchangePurchase = async () => {
		const { crm: { tempCampaign, selectedDiscount }, currentOrder, t, promotion: { exchangePurchaseRule, isSkipPromotionCalculation }, addCampaignItemsToOrder } = this.props;
		const normalItems = currentOrder.itemList.filter((item) => !item.isLocalExchangePurchaseItem);
		const selectedExchangeItems = currentOrder.itemList.filter((item) => item.isLocalExchangePurchaseItem);
		const hasCrmCampaign = Object.keys(selectedDiscount)?.length > 0 || tempCampaign?.length > 0;
		if (selectedExchangeItems.length && (!exchangePurchaseRule?.length || isSkipPromotionCalculation || hasCrmCampaign)) {
			addCampaignItemsToOrder(normalItems);
			toast_default.info(t("exchangePurchaseInvalid"), "top");
			return false;
		}
		if (!exchangePurchaseRule?.length || isSkipPromotionCalculation || hasCrmCampaign) return true;
		const matchedRules = getSatisfiedExchangePurchaseRules(exchangePurchaseRule, normalItems, this.getLocalPromotionOrderAmount(normalItems));
		const preferredRuleIds = [...new Set(normalItems.map((item) => item.localExchangePurchaseTriggerRuleId).filter(Boolean))];
		const satisfiedRules = [...preferredRuleIds.map((ruleId) => matchedRules.find((rule) => rule.id === ruleId)).filter(Boolean), ...matchedRules.filter((rule) => !preferredRuleIds.includes(rule.id))];
		if (selectedExchangeItems.length) {
			const satisfiedRuleIds = satisfiedRules.map((rule) => rule.id);
			if (selectedExchangeItems.every((item) => satisfiedRuleIds.includes(item.exchangePurchaseRuleId))) return true;
			addCampaignItemsToOrder(normalItems);
			toast_default.info(t("exchangePurchaseInvalid"), "top");
			return false;
		}
		return true;
	};
	handleCheckPromotion = async () => {
		const { t, crm: { tempCampaign, selectedDiscount }, promotion: { buyGiftRule, buyGifts, cloudPromotion, isSkipPromotionCalculation }, setBuyGifts, setSatisfyRules } = this.props;
		const isHasCrmCampaign = Object.keys(selectedDiscount)?.length > 0 || tempCampaign?.length > 0;
		if (!await this.handleCheckExchangePurchase()) return false;
		if (buyGifts?.length > 0 && (isSkipPromotionCalculation || isHasCrmCampaign || !buyGiftRule?.length && !cloudPromotion?.length)) {
			setBuyGifts([]);
			setSatisfyRules([]);
			toast_default.info(t("activityInvalidPleaseReselect"), "top");
			return false;
		}
		if ((buyGiftRule?.length > 0 || cloudPromotion?.length > 0) && !isSkipPromotionCalculation && !isHasCrmCampaign) {
			let satisfyRules = [];
			if (cloudPromotion?.length > 0) satisfyRules = this.handleGetCloudOrderGift();
			if (buyGiftRule?.length > 0) satisfyRules = this.getSatisfyRules(buyGiftRule, this.props.currentOrder.itemList);
			setSatisfyRules(satisfyRules);
			if (buyGifts?.length) {
				const satisfiedRuleIds = satisfyRules.map((rule) => rule.id);
				const validBuyGifts = buyGifts.filter((gift) => satisfiedRuleIds.includes(gift.ruleId));
				if (validBuyGifts.length !== buyGifts.length) {
					setBuyGifts(validBuyGifts);
					toast_default.info(t("activityInvalidPleaseReselect"), "top");
					return false;
				}
			}
			return true;
		}
		return true;
	};
	handleConfirm = async () => {
		const { t, i18n: { language }, currentOrder, selfConfig } = this.props;
		const { itemList } = currentOrder;
		if (judgeOnlyHaveFreeItem()) {
			if (!selfConfig?.configList?.find((config) => config.id === 46)?.value) {
				toast_default.info(t("order-uncheckable-only-reward"), "top");
				return;
			}
		}
		const dishMap = judegOrderDishIsHasSoldout((0, import_cloneDeep.default)(itemList || []));
		if (dishMap?.slodoutList?.length) {
			this.setState({
				dishMap,
				isHasSoldoutDish: true
			});
			return;
		}
		if (await this.handleCheckPromotion()) this.handleContinueConfirm();
	};
	handleGetCloudOrderGift = () => {
		const { store, currentOrder, promotion: { cloudPromotion } } = this.props;
		const { itemList, orderType } = currentOrder;
		return handleCalculatePromotion({
			promotionRules: cloudPromotion,
			orderType,
			itemList,
			totalAmount: getOrderInfoObj(store).orderSubtotal
		}).map((each) => {
			const { condition: { maxNum, menuItem }, promotionInfo } = each;
			const giftsDishes = menuItem.map((each) => each["menuItem/itemId"]);
			const giftsNumber = maxNum;
			const id = promotionInfo.promotionId;
			return {
				activityRule: {
					giftsDishes,
					giftsNumber
				},
				id,
				isOrderGift: true,
				promotionInfo
			};
		});
	};
	handleContinueConfirm = () => {
		const { store, selfConfig, systemConfig, currentOrder } = this.props;
		const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
		if (currentOrder.orderType == "DINE_IN") if (judgeCharge()) if (paymentRouteResult.onlyCard) this.handleConfirmOrderCharge();
		else this.dineInProcess();
		else if (!isTipEnabledForPayment(selfConfig, "CREDIT_CARD") && calcCardMinAmout() && paymentRouteResult.onlyCard) this.setState({
			isShowCardMinModal: true,
			currentAmount: calcCardMinAmout()
		});
		else this.dineInProcess();
		else if (selfConfig?.charge?.length) {
			let r2 = selfConfig.charge.find((c) => c.id == 2);
			let r3 = selfConfig.charge.find((c) => c.id == 3);
			let r4 = selfConfig.charge.find((c) => c.id == 4);
			if (r2?.select?.id || r3?.select?.id) this.props.history.push("./togoOption");
			else {
				const togoList = (0, import_cloneDeep.default)(store.togoList);
				if (r4?.select?.id) {
					for (let i = 0; i < togoList.length; i++) if (togoList[i].id === 4) {
						togoList[i] = {
							id: r4?.id,
							name: togoList[i].name,
							select: r4?.select
						};
						break;
					}
					this.props.setTogoOption(togoList);
				}
				this.togoProcess();
			}
		} else this.togoProcess();
	};
	judgeSMSAfterOperation = async () => {
		const { systemConfig, selfConfig, store } = this.props;
		if (navigatePartySizeIfNeeded(this.props.history, selfConfig)) return;
		await runJudgeSMSAfterOperation({
			systemConfig,
			selfConfig,
			store,
			history: this.props.history,
			payByCard: this.props.payByCard,
			payByCash: this.props.payByCash,
			saveOrderResult: this.props.saveOrderResult,
			kioskConfigUserId: this.props.userId,
			judgeConfigToSoldout: this.judgeConfigToSoldout,
			judgeFillCardMinAmout: this.judgeFillCardMinAmout,
			setLoading: (loading) => this.setState({ loading }),
			onError: this.showApiModalTip
		});
	};
	judgeConfigToSoldout = (fn) => {
		judgeConfigToSoldout(fn, {
			setSelfConfig: this.props.setSelfConfig,
			setState: this.setState.bind(this),
			showApiModalTip: this.showApiModalTip,
			onSoldoutDetected: () => {
				solveScrollElem(true);
			}
		});
	};
	judgeFillCardMinAmout = () => {
		if (calcCardMinAmout()) this.setState({
			isShowCardMinModal: true,
			currentAmount: calcCardMinAmout()
		});
		else this.props.history.push("/cardPayment");
	};
	reorder = () => {
		if (this?.state?.dishMap?.allSoldIds?.length) this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
		solveScrollElem(false);
		this.setState({ isHasSoldoutDish: false });
	};
	continueReorder = () => {
		if (this?.state?.dishMap?.allSoldIds?.length) this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
		solveScrollElem(false);
		this.setState({ isHasSoldoutDish: false });
		setTimeout(async () => {
			await this.judgeSMSAfterOperation();
		}, 0);
	};
	handleCancelOrderCharge = () => {
		this.setState({ isHasOrderCharge: false });
	};
	handleConfirmOrderCharge = async () => {
		const { selfConfig, currentOrder } = this.props;
		this.setState({ isHasOrderCharge: false });
		if (currentOrder.orderType == "DINE_IN") if (!isTipEnabledForPayment(selfConfig, "CREDIT_CARD") && calcCardMinAmout()) this.setState({
			isShowCardMinModal: true,
			currentAmount: calcCardMinAmout()
		});
		else await this.dineInProcess();
		else if (!isTipEnabledForPayment(selfConfig, "CREDIT_CARD") && calcCardMinAmout()) this.setState({
			isShowCardMinModal: true,
			currentAmount: calcCardMinAmout()
		});
		else await this.judgeSMSAfterOperation();
	};
	backBtnHandler = () => {
		this.props.history.goBack();
	};
	saveSideNav = (currentItem) => {
		const { t, i18n: { language } } = this.props;
		const sectionList = Object.assign([], currentItem.comboSections);
		sectionList.unshift({
			id: -1,
			name: getDishItemLanguage(currentItem.fieldDisplayNameGroups, language) || currentItem.name,
			info: currentItem
		});
		if (currentItem.categoryOptions) sectionList.push({
			id: -3,
			name: t("item_option"),
			key: "item_option",
			numOfItemOptionAllowed: currentItem?.numOfItemOptionAllowed || 0
		});
		const sectionId = sectionList[0].id;
		this.props.setSideNavIndex(sectionId);
		this.props.setSideNavList(sectionList);
	};
	handleEdit = (itemInfo, promotionObj = {}) => {
		if (isMembershipCard(itemInfo)) return;
		const { t, promotion: { buyGifts }, changePromotionStatusAfterCheck } = this.props;
		changePromotionStatusAfterCheck(itemInfo);
		if (itemInfo.isFreeItem || itemInfo.promotionRewardItem && itemInfo.manualSelectRewardDiscount?.length > 0) return toast_default.info(t("no-edit-freeItem"), "top");
		const { selectedPromotion, Fn: promotionFn } = promotionObj;
		if (this.state.keyboardToggle) this.hideKeyboard();
		if (!itemInfo.itemType || itemInfo.itemType === "SALE_ITEM" || itemInfo?.comboType === "FIXED_SELECTION") if (judgeHasDetailInfo(itemInfo)) this.setState({
			selectedItem: (0, import_cloneDeep.default)(itemInfo),
			orderPanelShow: true,
			promotionFn: promotionFn || void 0,
			selectedPromotion: selectedPromotion || []
		});
		else if (promotionFn) {
			const clonedItem = (0, import_cloneDeep.default)(itemInfo);
			if (clonedItem.itemPrices?.length === 1) {
				clonedItem.sectionDetail = [{
					id: -1,
					sizeInfo: Object.assign({}, clonedItem.itemPrices[0])
				}];
				clonedItem.price = 0;
			} else clonedItem.sectionDetail = [];
			promotionFn(clonedItem);
		} else toast_default.info(t("no-details"), "top");
		else if (promotionFn) {
			const deepCloneObj = (0, import_cloneDeep.default)(itemInfo);
			if (!selectedPromotion.length) this.props.resetCurrentOrderCombo();
			this.props.getCurrentCategory(itemInfo.categoryId);
			this.props.getCurrentItem(itemInfo.id);
			this.setState({
				selectedItem: deepCloneObj,
				comboPanelVisible: true,
				promotionFn,
				selectedPromotion
			});
			if (selectedPromotion.length) this.props.setEditOrderMode(deepCloneObj);
			else this.props.initEditOrderMode();
		} else {
			const deepCloneObj = (0, import_cloneDeep.default)(itemInfo);
			this.saveSideNav(deepCloneObj);
			this.props.setEditOrderMode(deepCloneObj);
			this.setState({
				selectedItem: (0, import_cloneDeep.default)(itemInfo),
				promotionFn: void 0,
				selectedPromotion: []
			}, () => {
				this.comboItemModal.viewOrderPanel();
			});
		}
	};
	formatterRequireCategory = () => {
		const { requireCategory, currentOrder } = this.props;
		if (requireCategory.length) {
			let obj = {};
			requireCategory.forEach((c) => {
				obj[c.id] = 0;
			});
			currentOrder.itemList.forEach((item) => {
				if (obj.hasOwnProperty(item.categoryId)) obj[item.categoryId] += item.quantity;
			});
			return obj;
		} else return null;
	};
	judgeClick = () => {
		const { requireCategory, currentOrder, crm: { selectedFreeItem }, promotion } = this.props;
		const count = [
			...currentOrder.itemList,
			...selectedFreeItem,
			...promotion?.buyGifts?.[0]?.items || []
		].reduce((total, item) => total + (item.quantity || 1), 0);
		if (requireCategory.length) return {
			isClick: !getMissingRequiredCategories(requireCategory, currentOrder.itemList).length,
			count
		};
		else return {
			isClick: count > 0,
			count
		};
	};
	shakeRequiredCategoryTip = () => {
		if (!this.requiredCategoryTipDom) return;
		this.requiredCategoryTipDom.classList.remove(orderReview_module_default.tipBoxShake);
		this.requiredCategoryTipDom.getBoundingClientRect();
		this.requiredCategoryTipDom.classList.add(orderReview_module_default.tipBoxShake);
	};
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
	async componentDidMount() {
		const { isReorderFlag } = this.props;
		window.addEventListener("resize", this.scheduleBottomSpacerRecalc);
		this.scheduleBottomSpacerRecalc();
		if (isReorderFlag) this.backBtnHandler();
		else {
			await this.handleCheckPromotion();
			await this.handleSetPosVersion();
		}
		this.scheduleBottomSpacerRecalc();
	}
	recalcBottomSpacer = () => {
		if (!this.scrollDom) return;
		const bottomSpacerPx = calculateBottomSpacerPx(this.scrollDom.getBoundingClientRect(), [this.footBtnBoxDom, this.discountInfoDom].filter(Boolean).map((element) => element.getBoundingClientRect()));
		if (Math.abs(bottomSpacerPx - this.state.bottomSpacerPx) > 1) this.setState({ bottomSpacerPx });
	};
	scheduleBottomSpacerRecalc = () => {
		if (this.bottomSpacerFrame) window.cancelAnimationFrame(this.bottomSpacerFrame);
		this.bottomSpacerFrame = window.requestAnimationFrame(() => {
			this.bottomSpacerFrame = null;
			this.recalcBottomSpacer();
		});
	};
	handleSetPosVersion = async () => {
		const posVersion = (await fetchCompanyProfile())?.data?.company?.appInfo?.version;
		if (posVersion) localStorage.setItem("posVersion", JSON.stringify(posVersion));
	};
	handleGoBackToOrderPage = (prevProps) => {
		const goBackToOrderPage = () => {
			this.props.history.goBack();
			this.props.notes("");
		};
		const { currentOrder: prevOrder, crm: preCrm } = prevProps;
		const prevItemLst = [...prevOrder?.itemList || [], ...preCrm?.selectedFreeItem || []];
		const { currentOrder, crm } = this.props;
		const currentItemList = [...currentOrder?.itemList || [], ...crm?.selectedFreeItem || []];
		if (prevItemLst.length > 0 && currentItemList.length <= 0) goBackToOrderPage();
	};
	handleCheckPromotionGiftItem = (prevProps) => {
		const { currentOrder: prevOrder } = prevProps;
		const { currentOrder, t } = this.props;
		const preOrderGiftItem = prevOrder?.itemList?.filter((e) => e.promotionRewardItem && e.manualSelectRewardDiscount?.length > 0);
		if (preOrderGiftItem?.length > 0) {
			const onCheckFailed = () => {
				const timer = setTimeout(() => {
					toast_default.info(t("gift-item-change"), "top");
					clearTimeout(timer);
				}, 100);
			};
			const currentOrderGiftItem = currentOrder?.itemList?.filter((e) => e.promotionRewardItem && e.manualSelectRewardDiscount?.length > 0);
			if (!(currentOrderGiftItem?.length > 0)) {
				onCheckFailed();
				return;
			}
			if (!isSameItems(preOrderGiftItem, currentOrderGiftItem)) onCheckFailed();
		}
	};
	componentDidUpdate(prevProps, prevState) {
		const { t } = this.props;
		this.handleGoBackToOrderPage(prevProps);
		this.handleCheckPromotionGiftItem(prevProps);
		if (prevState.bottomSpacerPx === this.state.bottomSpacerPx) this.scheduleBottomSpacerRecalc();
		let isScroll = this.state.isScroll;
		let isExceedlimit = !!(String(this.state.keyboardValue).length >= 255);
		if (!isScroll && isExceedlimit && this.scrollDom) {
			if (this.scrollDom.scrollHeight > this.scrollDom.offsetHeight) {
				let scrollTop = this.scrollDom.scrollHeight - this.scrollDom.offsetHeight;
				this.scrollDom.scrollTop = scrollTop;
				this.setState({ isScroll: true });
			}
		}
		if (this.state.keyboardToggle != prevState.keyboardToggle) if (this.state.keyboardToggle) {
			this.scrollDom.style.height = "calc(100vh - 80px - 380px)";
			this.inputRef.scrollIntoViewIfNeeded(true);
		} else this.scrollDom.style.height = "calc(100vh - 24.8rem)";
		if (this.props.currentOrder.itemList !== prevProps.currentOrder.itemList) {
			if (this.props.currentOrder.itemList?.some((item) => item.isLocalExchangePurchaseItem)) this.handleCheckExchangePurchase();
			const { promotion: { buyGiftRule, buyGifts, cloudPromotion }, setSatisfyRules, setBuyGifts } = this.props;
			if ((buyGiftRule.length > 0 || cloudPromotion.length > 0) && buyGifts.length > 0) {
				let satisfyRules = [];
				if (cloudPromotion.length > 0) satisfyRules = this.handleGetCloudOrderGift();
				if (buyGiftRule.length > 0) satisfyRules = this.getSatisfyRules(buyGiftRule, this.props.currentOrder.itemList);
				setSatisfyRules(satisfyRules);
				const invalidRule = buyGifts.filter((each) => {
					return !satisfyRules.map((promotion) => promotion.id).includes(each.ruleId);
				});
				if (invalidRule?.length > 0) setBuyGifts(buyGifts.filter((each) => {
					return !invalidRule.map((rule) => rule.ruleId).includes(each.ruleId);
				}));
			}
			const hasValidPromotionBefore = prevProps?.currentOrder?.itemList?.some((item) => item?.promotionRewardItem || item?.manualSelectRewardDiscount?.length > 0);
			const hasValidPromotionNow = this.props?.currentOrder?.itemList?.some((item) => item?.promotionRewardItem || item?.manualSelectRewardDiscount?.length > 0);
			if (hasValidPromotionBefore && !hasValidPromotionNow) {
				toast_default.info(t("activityInvalidPleaseReselect"), "top");
				this.props.setPromotionCode("");
			}
		}
	}
	showCallBoard = () => {
		return new Promise((resolve) => {
			this.callBoardPromiseResolve = resolve;
		});
	};
	closeCallBoard = (locatorVal) => {
		this.setState({ showCallBoard: false }, () => {
			if (!locatorVal) return;
			else if (this.callBoardPromiseResolve) this.callBoardPromiseResolve(true);
			if (this.callBoardPromiseResolve) this.callBoardPromiseResolve = null;
		});
	};
	componentWillUnmount() {
		clearTimeout(this.timer);
		if (this.animationTimer) clearTimeout(this.animationTimer);
		window.removeEventListener("resize", this.scheduleBottomSpacerRecalc);
		if (this.bottomSpacerFrame) window.cancelAnimationFrame(this.bottomSpacerFrame);
	}
	updateGiftItem = (updatedItem, originalItem) => {
		const { promotion: { buyGifts }, setBuyGifts } = this.props;
		const stockState = this.props.store;
		if (!isStockSufficient({
			itemInfo: updatedItem,
			addQty: updatedItem.quantity || 1,
			itemList: stockState.currentOrder.itemList,
			menuItemList: stockState.menuItemList,
			crm: this.props.crm,
			promotion: this.props.promotion,
			excludeSequence: originalItem.sequence
		}) || !validateComboSubmitStock(updatedItem, stockState, { excludeSequence: originalItem.sequence })) {
			showInsufficientStockToast("top", updatedItem, stockState.menuItemList);
			return false;
		}
		setBuyGifts(buyGifts.map((giftRule) => ({
			...giftRule,
			items: giftRule.items.map((item) => item.id === originalItem.id && item.sequence === originalItem.sequence ? {
				...updatedItem,
				sequence: originalItem.sequence,
				ruleId: giftRule.ruleId
			} : item)
		})));
	};
	editGiftItem = (item) => {
		if (!judgeHasDetailInfo(item) && !item.comboSections?.length) return;
		this.handleEdit(item, {
			selectedPromotion: this.props.promotion.buyGifts,
			Fn: (updatedItem) => this.updateGiftItem(updatedItem, item)
		});
	};
	removeGiftItem = (item) => {
		const { promotion: { buyGifts }, setBuyGifts } = this.props;
		const giftRule = buyGifts.find((each) => each.ruleId === item.ruleId);
		const sameItems = (giftRule?.items || []).filter((giftItem) => giftItem.id === item.id);
		if (sameItems.length > 1) {
			this.setState({ giftDeleteSelection: {
				item,
				ruleId: giftRule.ruleId,
				items: sameItems
			} });
			return;
		}
		const newBuyGifts = buyGifts.map((each) => {
			if (each.ruleId !== item.ruleId) return each;
			const { items } = each;
			const newItems = items.reduce((result, giftItem) => {
				if (!(giftItem.id === item.id && (item.sequence == null || giftItem.sequence === item.sequence))) result.push(giftItem);
				else if (Number(giftItem.quantity || 1) > 1) result.push({
					...giftItem,
					quantity: Number(giftItem.quantity || 1) - 1
				});
				return result;
			}, []);
			if (!newItems?.length) return null;
			return {
				...each,
				items: newItems
			};
		})?.filter(Boolean);
		setBuyGifts(newBuyGifts);
	};
	stageGiftVariantRemoval = (sequence) => {
		this.setState(({ giftDeleteSelection }) => ({ giftDeleteSelection: {
			...giftDeleteSelection,
			items: giftDeleteSelection.items.filter((item) => item.sequence !== sequence)
		} }));
	};
	confirmGiftVariantRemoval = () => {
		const { giftDeleteSelection } = this.state;
		if (!giftDeleteSelection) return;
		const { promotion: { buyGifts }, setBuyGifts } = this.props;
		const retainedSequences = new Set(giftDeleteSelection.items.map((item) => item.sequence));
		setBuyGifts(buyGifts.map((giftRule) => {
			if (giftRule.ruleId !== giftDeleteSelection.ruleId) return giftRule;
			const items = giftRule.items.filter((item) => item.id !== giftDeleteSelection.item.id || retainedSequences.has(item.sequence));
			return items.length ? {
				...giftRule,
				items
			} : null;
		}).filter(Boolean));
		this.setState({ giftDeleteSelection: null });
	};
	discountNumberText = (activityRule) => {
		return `${activityRule?.discountType === "fixDiscount" ? "$" : ""}${activityRule?.discountNumber}${activityRule?.discountType === "rateDiscount" ? "% " : ""}`;
	};
	handlePromoCodeContinue = async (code) => {
		const { t, store, promotion: { orderDiscount, isOpenCloudPromotion, promotionCenterList, itemValidPromotion } } = this.props;
		if (isOpenCloudPromotion) {
			const hitPromoCodeActivity = (promotionCenterList?.filter((item) => item?.promotionCodes?.length)).find((item) => item?.promotionCodes?.includes(code));
			if (Object.keys(hitPromoCodeActivity || {}).length === 0) {
				toast_default.info(t("promoCodeInvalid"), "top");
				return;
			}
			const isPromotionAlreadySelect = itemValidPromotion?.find((e) => e.isSelected);
			if (isPromotionAlreadySelect) {
				toast_default.info(t("haveJoin", { activeTxt: `${getPromotionCenterActivityRuleText({
					t,
					activityRule: isPromotionAlreadySelect?.promotion?.activityRule,
					type: isPromotionAlreadySelect?.promotion?.type,
					promotionName: isPromotionAlreadySelect?.promotion?.promotionName,
					selfConfig: this.props.selfConfig,
					promoCenterHitActivity: isPromotionAlreadySelect
				})}` }), "top");
				return;
			}
			if (this.getHasCampaignInfo()) {
				toast_default.info(t("haveJoin", { activeTxt: `${t("reward_point")}${t("activity")}` }), "top");
				return;
			}
			this.handleCheckPromotionCenter({ code });
		} else {
			const hitPromoCodeActivity = orderDiscount.find((item) => item?.activityRule?.promotionCode === code);
			if (Object.keys(hitPromoCodeActivity || {}).length === 0) {
				toast_default.info(t("promoCodeInvalid"), "top");
				return;
			}
			const { activityRule } = hitPromoCodeActivity;
			if (getOrderInfoObj(store).orderSubtotal < activityRule.satisfyPrice) {
				const discountNumber = this.discountNumberText(activityRule);
				toast_default.info(t("promoCodeUnderCondition", {
					price: activityRule.satisfyPrice,
					discountNumber
				}), "top");
				return;
			}
			this.props.setPromotionCode(code);
			this.handlePromoCodeCancel();
		}
	};
	handlePromoCodeCancel = () => {
		this.setState({ promoCodeVisiable: false });
	};
	handleCheckPromotionCenter = async ({ code }) => {
		const { t, promotion: { itemValidPromotion, promotionCenterList, promotionCenterMetas }, setItemValidPromotion, merchantProfile } = this.props;
		const onCheckSuccess = (validateRes) => {
			if (!validateRes?.length) {
				setItemValidPromotion(null);
				this.handlePromoCodeCancel();
				return;
			}
			const promotionCodeInfo = validateRes?.find((item) => item?.promotion?.promotionCodes?.includes(code));
			if (promotionCodeInfo === void 0) {
				toast_default.info(t("promoCodeActivityInvalid"), "top");
				setItemValidPromotion(validateRes);
				this.props.setPromotionCode("");
				this.handlePromoCodeCancel();
				return;
			}
			const disabledPromotionCodeInfo = promotionCodeInfo.validateInfo?.result?.result?.discounts?.[0]?.amount === 0;
			if (disabledPromotionCodeInfo) toast_default.info(t("notReachThreshold"), "top");
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
			const isRuleValid = checkIsRuleValid(afterCheckValidatePromotion?.[0]?.validateInfo);
			const promotionCodeIsValidOnly = afterCheckValidatePromotion?.length === 1 && isRuleValid && !GIFT_PROMOTION_TYPE.includes(afterCheckValidatePromotion?.[0]?.promotion?.type);
			if (promotionCodeIsValidOnly) setItemValidPromotion(afterCheckValidatePromotion?.map((item) => ({
				...item,
				isSelected: true
			})));
			else setItemValidPromotion(afterCheckValidatePromotion);
			this.props.setPromotionCode(code);
			this.handlePromoCodeCancel();
			const onlyCodePromotion = afterCheckValidatePromotion?.every((item) => item?.promotion?.promotionCodes?.length);
			if (onlyCodePromotion && promotionCodeInfo && !disabledPromotionCodeInfo || !onlyCodePromotion || !promotionCodeIsValidOnly) this.setState({ itemPromotionVisible: true });
		};
		const onCheckFailed = () => {
			setItemValidPromotion(null);
			this.handlePromoCodeCancel();
			toast_default.info(t("promoCodeActivityInvalid"), "top");
		};
		await handleCheckOrderPromotion({
			promotionCenterList,
			promotionCenterMetas,
			onCheckSuccess,
			onCheckFailed,
			merchantId: merchantProfile?.merchantId
		});
	};
	handleClosePromotionModal = () => {
		this.setState({ itemPromotionVisible: false });
	};
	handleSkipPromotion = () => {
		this.handleClosePromotionModal();
		this.props.setPromotionCode("");
	};
	handleSelectPromotion = (rule) => {
		const { promotion: { itemValidPromotion, promotionCode }, setItemValidPromotion } = this.props;
		const updatedItemPromotion = itemValidPromotion?.map((each) => {
			return {
				...each,
				isSelected: each.promotion.id === rule.promotion.id ? true : void 0
			};
		});
		if (!updatedItemPromotion?.find((item) => item?.isSelected)?.promotion?.promotionCodes?.includes(promotionCode)) this.props.setPromotionCode("");
		setItemValidPromotion(updatedItemPromotion);
		this.handleClosePromotionModal();
	};
	renderLocalPromotionInfo = (orderInfo) => {
		const { t, selfConfig, promotion: { orderDiscount, promotionCode, isOpenCloudPromotion } } = this.props;
		if (isOpenCloudPromotion) return;
		let defaultText = "";
		let activityName;
		let activityLabel;
		if (orderInfo.promotionDiscountInfo) {
			const { activityRule } = orderInfo.promotionDiscountInfo;
			activityName = orderInfo.promotionDiscountInfo.activityName;
			activityLabel = orderInfo.promotionDiscountInfo.activityLabel;
			const discountNumber = this.discountNumberText(activityRule);
			if (activityRule.isFirstOrderDiscount === "1") defaultText = activityRule.satisfyPrice === "0" ? t("firstOrder_no_threshold", { discountNumber }) : t("firstOrder_threshold", {
				satisfyPrice: activityRule.satisfyPrice,
				discountNumber
			});
			else if (activityRule.satisfyPrice === "0") defaultText = t("no_threshold_coupon", { discountNumber });
			else defaultText = t("discountItemInfo", {
				price: activityRule.satisfyPrice,
				discountNumber
			});
		} else {
			const hitPromoCodeActivity = orderDiscount.find((item) => item?.activityRule?.promotionCode === promotionCode);
			activityName = hitPromoCodeActivity?.activityName;
			activityLabel = hitPromoCodeActivity?.activityLabel;
			const discountNumber = this.discountNumberText(hitPromoCodeActivity?.activityRule);
			defaultText = `${t("promoCodeUnderCondition", {
				price: hitPromoCodeActivity?.activityRule.satisfyPrice,
				discountNumber
			})} ${hitPromoCodeActivity?.activityRule?.isFirstOrderDiscount === "1" ? `, ${t("only-newMember")}` : ""}`;
		}
		return getPromotionActivityDisplayText({
			defaultText,
			activityName,
			activityLabel,
			selfConfig
		});
	};
	delPromoCodeInput = () => {
		const { promotion: { itemValidPromotion }, setItemValidPromotion } = this.props;
		this.props.setPromotionCode("");
		const updatedItemPromotion = itemValidPromotion?.map((each) => {
			return {
				...each,
				isSelected: each?.promotion?.promotionCodes?.length ? void 0 : each?.isSelected
			};
		});
		setItemValidPromotion(updatedItemPromotion);
	};
	getHasCampaignInfo = () => {
		const { currentOrder: { itemList }, crm: { selectedDiscount, selectedFreeItem } } = this.props;
		return isHasCRMCampaignFn({
			itemList,
			selectedFreeItem,
			selectedDiscount
		});
	};
	renderPromotionCode = (orderInfo) => {
		const { t, promotion: { orderDiscount, promotionCode, promotionCenterList, isOpenCloudPromotion, itemValidPromotion } } = this.props;
		const hasLocalPromocodeActivity = orderDiscount?.some((item) => item?.activityRule?.usePromotionCode === "1") && !isOpenCloudPromotion;
		const hasPromoCenterCodeActivity = promotionCenterList?.some((item) => item?.promotionCodes?.length) && isOpenCloudPromotion;
		const hasPromoCodeActivity = hasLocalPromocodeActivity || hasPromoCenterCodeActivity;
		let validActivityIsPromoCode = false;
		if (hasLocalPromocodeActivity) validActivityIsPromoCode = !orderInfo?.promotionDiscountInfo || orderInfo?.promotionDiscountInfo && orderInfo?.promotionDiscountInfo?.activityRule?.usePromotionCode === "1";
		else if (hasPromoCenterCodeActivity) validActivityIsPromoCode = true;
		const PromoCenterHitActivity = isOpenCloudPromotion && itemValidPromotion?.find((e) => e.isSelected);
		let isRuleValid = false;
		if (PromoCenterHitActivity && PromoCenterHitActivity.promotion?.promotionCodes?.includes(promotionCode)) isRuleValid = checkIsRuleValid(PromoCenterHitActivity?.validateInfo);
		const isSelected = PromoCenterHitActivity?.isSelected && PromoCenterHitActivity.promotion?.promotionCodes?.includes(promotionCode);
		if (!hasPromoCodeActivity) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: orderReview_module_default.promoCodeArea,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderReview_module_default.promoCodeWrap,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: orderReview_module_default.promoCodeTitle,
					children: t("promotion")
				}), !promotionCode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `${orderReview_module_default.promoCodeBtn} ${validActivityIsPromoCode ? "" : orderReview_module_default.promoCodeBtnDisabled}`,
					onClick: () => {
						if (validActivityIsPromoCode) this.setState({ promoCodeVisiable: true });
						else toast_default.info(t("currentOtherValidPromotion"), "top");
					},
					children: t("enterPromoCode")
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [hasLocalPromocodeActivity && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: orderReview_module_default.promoCodeOpration,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderReview_module_default.promoCodeText,
							children: this.renderLocalPromotionInfo(orderInfo)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
							"aria-label": "Remove",
							className: orderReview_module_default.btnEn,
							onClick: this.delPromoCodeInput,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Delete.default, { className: orderReview_module_default.muiDiyIcon })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.promoCodeBtn,
							onClick: () => {
								this.setState({ promoCodeVisiable: true });
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("ExchangeCode") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAvCAMAAACSXLn7AAAANlBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC3dmhyAAAAEnRSTlMAspwWhVlvLEKnC2SQQyF6N06ceUVLAAABX0lEQVRIx7WWS7aDIAxAIUCQj1X3v9lHiTZwEMTBuyNLc00gp6GixS8hgkyADqsSD/hDy4o4dLxxsgFCVzkovFVWcYfSsov+JgmQ4PgP/L4Nu8orNsRfkrSCMsHxZznOqCotnob7XEIdH3xTKV5GKSigxFbcYIEMXQi0FJVooddlWDAU77v9ibWgroPooqAStvzYjTeJrRRsfjKihyRYwFyQmBZoB+u8sFCCaYG2jAPBlFxNs2IaT5nmsbnJb4XtheAdHeo8Sm+7mCI4MGIeatgbQb8VIgn/17D9bJjVJQMBvwLS3pnB6edBtE8K/CuYFmgM4LyANChKAW1iVBAlYMF9nnYMigX6/DDHVk5GQKci686CWNii7E8zc77OFwJewxP25vWRCy4EHrew+uYWpvhKqO5EHRabWEKx5DklJlaqtcshXl28ut+h5UbRVoxQCPX/BgofO7vZdALD0vb+D+wECcv2RybeAAAAAElFTkSuQmCC",
								alt: "change code"
							})]
						})
					]
				}), hasPromoCenterCodeActivity && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: orderReview_module_default.promoCodeOpration,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderReview_module_default.promoCodeText,
							children: isSelected ? getPromotionCenterActivityRuleText({
								t,
								promotionName: PromoCenterHitActivity?.promotion?.promotionName,
								selfConfig: this.props.selfConfig,
								promoCenterHitActivity: PromoCenterHitActivity
							}) : PromoCenterHitActivity ? t("haveJoin", { activeTxt: ` ${getPromotionCenterActivityRuleText({
								t,
								promotionName: PromoCenterHitActivity?.promotion?.promotionName,
								selfConfig: this.props.selfConfig,
								promoCenterHitActivity: PromoCenterHitActivity
							})}` }) : t("notHasValidPromotion")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
							"aria-label": "Remove",
							className: orderReview_module_default.btnEn,
							onClick: this.delPromoCodeInput,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Delete.default, { className: orderReview_module_default.muiDiyIcon })
						}),
						!isRuleValid && isSelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderReview_module_default.promoCodeBtn,
							onClick: () => {
								this.handleContinueAddPromotionItem(PromoCenterHitActivity);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("goAddItem") })
						})
					]
				})] })]
			})
		});
	};
	handleContinueAddPromotionItem = (hasNextLevelPromotion) => {
		if (this.addOnPromotionRef.current) this.addOnPromotionRef.current.goAddOnPromotion(hasNextLevelPromotion);
	};
	handleCloseAddOnPromotion = () => {
		this.props.history.push("/orderPage");
	};
	getNextLevelPromotionDom = ({ hasNextLevelPromotion, orderOriginPrice, nextLevel }) => {
		const { validateInfo, discountRate, targetCount, selectQuantity, benefitAmount, promotion, discountAmount, extraInfo } = hasNextLevelPromotion;
		const { activityRule, type } = promotion;
		const { t } = this.props;
		let addItemDom = null;
		let widthRate = null;
		let moreItemDom = null;
		let nextLevelText = null;
		const discountValue = discountRate ? `${discountRate}%` : `$${benefitAmount}`;
		if (GIFT_PROMOTION_TYPE.includes(type)) {
			if (!extraInfo) return;
			const { nextBenefit } = extraInfo;
			const nextThresholdPrice = nextBenefit.condition.totalAmount;
			const orderedPrice = Big(nextThresholdPrice).minus(targetCount).toNumber();
			nextLevelText = activityRule.find((e) => e.satisfyPrice === nextThresholdPrice).text;
			widthRate = Big(orderedPrice).div(nextThresholdPrice).toNumber() * 100;
			moreItemDom = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderReview_module_default.nextThresholdPrice,
				children: [
					"$",
					orderedPrice.toFixed(2),
					" / $",
					nextThresholdPrice
				]
			});
			const nextLevelSelectQuantity = extraInfo?.nextBenefit?.actions?.[0]?.params?.quantity;
			addItemDom = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("buyMoreAmountEnjoyGiftItem", {
				targetCount: targetCount.toFixed(2),
				selectQuantity: nextLevelSelectQuantity
			}) });
			return {
				addItemDom,
				widthRate,
				moreItemDom,
				nextLevelText
			};
		}
		const { key } = nextLevel;
		if (key === "SHORT_OF_NEXT_QUANTITY_THRESHOLD") {
			const { result: { result: { orderItems } } } = validateInfo;
			const promotionItemNumber = orderItems?.reduce((pre, cur) => {
				return pre + cur.quantity;
			}, 0);
			const nextLevelItemNumber = promotionItemNumber + targetCount;
			const sameRule = activityRule.find((e) => e.buyNumber === nextLevelItemNumber);
			if (!sameRule) return;
			nextLevelText = sameRule.text;
			widthRate = Big(promotionItemNumber).div(nextLevelItemNumber).toNumber() * 100;
			moreItemDom = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderReview_module_default.nextThresholdPrice,
				children: [
					promotionItemNumber,
					" / ",
					nextLevelItemNumber
				]
			});
			addItemDom = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("buyMoreAmountEnjoyDiscount", {
				targetCount,
				discountValue
			}) });
		} else if (key === "SHORT_OF_NEXT_AMOUNT_THRESHOLD") {
			const orderedPrice = Number(orderOriginPrice);
			const nextThresholdPrice = Big(Number(orderOriginPrice)).plus(Number(targetCount)).toNumber();
			const sameRule = activityRule.find((e) => e.satisfyPrice === nextThresholdPrice);
			if (!sameRule) return;
			nextLevelText = sameRule.text;
			widthRate = Big(orderedPrice).div(nextThresholdPrice).toNumber() * 100;
			moreItemDom = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderReview_module_default.nextThresholdPrice,
				children: [
					"$",
					orderedPrice.toFixed(2),
					" / $",
					nextThresholdPrice
				]
			});
			addItemDom = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("buyMoreItemEnjoyDiscount", {
				targetCount: targetCount.toFixed(2),
				discountValue
			}) });
		}
		return {
			addItemDom,
			widthRate,
			moreItemDom,
			nextLevelText
		};
	};
	renderPromotionCenterNextLevel = ({ hasNextLevelPromotion, orderOriginPrice }) => {
		if (!hasNextLevelPromotion) return null;
		const { validateInfo, promotion } = hasNextLevelPromotion;
		const { t, selfConfig } = this.props;
		const nextLevel = validateInfo.invalidReason.find((e) => [
			"SHORT_OF_NEXT_AMOUNT_THRESHOLD",
			"SHORT_OF_NEXT_QUANTITY_THRESHOLD",
			"SHORT_OF_NEXT_DISCOUNT_ROUND "
		].includes(e.key));
		if (nextLevel || GIFT_PROMOTION_TYPE.includes(promotion.type)) {
			const domSet = this.getNextLevelPromotionDom({
				hasNextLevelPromotion,
				orderOriginPrice,
				nextLevel
			});
			if (!domSet) return null;
			const { addItemDom, widthRate, moreItemDom, nextLevelText } = domSet;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderReview_module_default.promotionCenterInfo,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: addItemDom }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.progressBar,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.progressRow,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: orderReview_module_default.progressWrapper,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: { width: `${widthRate}%` },
									className: orderReview_module_default.progressInner
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: moreItemDom })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderReview_module_default.nextLevelReward,
							children: getPromotionCenterTextFromTextObject({
								t,
								text: nextLevelText,
								type: promotion?.type,
								promotionName: promotion?.promotionName,
								activityLabel: promotion?.activityLabel,
								promotionChineseTag: promotion?.promotionChineseTag,
								promotionEnglishTag: promotion?.promotionEnglishTag,
								selfConfig
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.goAddItems,
						onClick: () => this.handleContinueAddPromotionItem(hasNextLevelPromotion),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("addItems") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefIcon, {})]
					})
				]
			});
		}
	};
	renderPromotionTag = (item) => {
		const { t, promotion: { promotionCenterList } } = this.props;
		const { promotionRewardItem, manualSelectRewardDiscount, itemDiscountInfo } = item;
		if (!promotionRewardItem) return null;
		if (manualSelectRewardDiscount?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: orderReview_module_default.promotionTagList,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: orderReview_module_default.promotionTag,
				children: t("gift")
			})
		});
		const ItemJoinedPromotion = promotionCenterList?.find((item) => item?.id === itemDiscountInfo?.[0]?.id);
		if (ItemJoinedPromotion?.type === "quantityItemDiscount") {
			const discountType = ItemJoinedPromotion?.activityRule?.[0]?.discountType;
			const discountNumber = ItemJoinedPromotion?.activityRule?.[0]?.discountNumber;
			const discountText = discountType && `${discountType === "minus" ? "$" : ""}${discountNumber}${discountType === "percentage" ? "%" : ""}`;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: orderReview_module_default.promotionTagList,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: orderReview_module_default.promotionTag,
					children: `${discountText} ${t("off")}`
				})
			});
		}
		if (ItemJoinedPromotion?.type === "orderItemFixedPrice") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: orderReview_module_default.promotionTagList,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: orderReview_module_default.promotionTag,
				children: t("orderItemFixedPrice_tag")
			})
		});
	};
	render() {
		const { t, i18n: { language }, store, selfConfig, requireCategory, crm: { isShowLoginBar, selectedFreeItem, selectedDiscount }, currentOrder, promotion: { buyGifts, itemValidPromotion, promotionCenterList }, setLocator } = this.props;
		const { keyboardToggle, keyboardValue, selectedItem, maxNum, deleteLoading, lastReuqireItem, promoCodeVisiable, isHasSoldoutDish, dishMap, errorApiShow, errorApiMsg, isShowCardMinModal, currentAmount, isHasOrderCharge, orderPanelShow, comboPanelVisible, comboPanelIdx, descVisible, promotionFn, selectedPromotion, showCallBoard, isShowDesc, tableServiceType, itemPromotionVisible } = this.state;
		const { isShowCheckFooter } = currentOrder;
		const orderInfo = getOrderInfoObj(store);
		const pricedCartItems = getMemberPricedCartItems(store);
		const orderItemList = (0, import_cloneDeep.default)([...currentOrder.itemList, ...selectedFreeItem])?.map((item, i) => {
			if (item.itemPrices && item.itemPrices.length > 0) item.price = 0;
			const renderPrice = (item, pricedItem = item) => {
				const { rewardRule, promotionRewardItem, manualSelectRewardDiscount } = item;
				const originalPrice = (getItemPrice(item) || 0).toFixed(2);
				if (promotionRewardItem && manualSelectRewardDiscount?.length > 0) return null;
				if (pricedItem.memberCartDisplayTotal != null) {
					const originalTotal = Big(originalPrice).times(item.quantity).toFixed(2);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.discountPrice,
						children: [
							originalTotal !== pricedItem.memberCartDisplayTotal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: orderReview_module_default.originPrice,
								children: ["$", originalTotal]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: orderReview_module_default.price,
								children: ["$", pricedItem.memberCartDisplayTotal]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: orderReview_module_default.tag,
								children: t("subtotal")
							})
						]
					});
				}
				if (pricedItem.discountID) {
					const exchangePurchaseActivityRule = item.exchangePurchaseRule?.activityRule;
					const discountText = item.isLocalExchangePurchaseItem ? `${exchangePurchaseActivityRule?.discountType === "fixDiscount" ? "$" : ""}${exchangePurchaseActivityRule?.discountNumber || 0}${exchangePurchaseActivityRule?.discountType === "rateDiscount" ? "%" : ""}` : `${pricedItem.discountRate}%`;
					const discountedPrice = item.isLocalExchangePurchaseItem ? getExchangePurchaseDiscountedUnitPrice(item) : Big(getItemPrice(pricedItem)).minus(pricedItem.discount).toFixed(2);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.discountPrice,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: orderReview_module_default.originPrice,
								children: [" $", originalPrice]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: orderReview_module_default.price,
								children: ["$", discountedPrice]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: orderReview_module_default.tag,
								children: `${discountText} ${t("off")}`
							})
						]
					});
				}
				if (rewardRule?.rewardType === "voucher" && rewardRule?.redeemRule?.strategy === "byFreeItem") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: orderReview_module_default.price,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$0.00" })
				});
				if (item.isFreeItem || item.discountList?.[0]?.isReward || item.isCRMFreeItem) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: orderReview_module_default.price,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: orderReview_module_default.pointImg,
						src: star_default,
						alt: "point"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: `${item.itemPoints || item.redeemRule?.parameters?.point} ${t("pts")}` })]
				});
				if (item.isCRMIntegrationSpecialItem || item.isCRMIntegrationBundleDiscountItem && item.hasOwnProperty("actualDiscount")) {
					const { actualDiscount } = item;
					const originalPrice = Number(Big(item.totalAmount ?? item.totalPrice ?? item.price).div(item.quantity).toFixed(2));
					const specialPrice = Number(Big(originalPrice).minus(Big(actualDiscount).div(item.quantity)).toFixed(2));
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.discountPrice,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.originPrice,
							children: ["$", originalPrice.toFixed(2)]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.price,
							children: ["$", specialPrice.toFixed(2)]
						})]
					});
				}
				if (item.promotionRewardItem) {
					const originalPrice = Number(Big(item.totalPrice ?? item.price).toFixed(2));
					const specialPrice = Number(Big(getItemPrice(pricedItem)).times(pricedItem.quantity).minus(pricedItem.actualDiscount ?? 0).toFixed(2));
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.discountPrice,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.originPrice,
							children: ["$", originalPrice.toFixed(2)]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.promotionItemPrice,
							children: ["$", specialPrice.toFixed(2)]
						})]
					});
				}
				const prices = getItemActualPrices(item);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: orderReview_module_default.price,
					children: canUseMemberPrice(store) && prices.hasBenefitPrice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", originalPrice] }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: prices.realBenefitPrice })
					] }) : `$${originalPrice}`
				});
			};
			const _maxNum = item.isFreeItem ? 1 : maxNum;
			const optText = this.orderDetailWriter(item);
			const isPromotionRewardItem = item.promotionRewardItem && item.manualSelectRewardDiscount?.length > 0;
			const promotionRewardMoreThanOne = isPromotionRewardItem && item.quantity > 1;
			const onlyOnePromotionReward = isPromotionRewardItem && item.quantity === 1;
			const isCRMDiscountRewardItem = item.isCRMIntegrationSpecialItem || item.isCRMIntegrationBundleDiscountItem && item.hasOwnProperty("actualDiscount");
			let isShowCounter = !isMembershipCard(item) && !item.discountID && !item.isFreeItem && !item.isCRMFreeItem && !isPromotionRewardItem;
			if (promotionRewardMoreThanOne) isShowCounter = true;
			const isAddItemBtnDisabled = item.quantity >= _maxNum || isPromotionRewardItem || isCRMDiscountRewardItem;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: (0, import_classnames.default)(orderReview_module_default.orderItemInfoBx),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.orderBox,
						onClick: () => this.handleEdit(item),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `${orderReview_module_default.info} ${item?.remark?.optionName.trim() ? orderReview_module_default.hasNoteInfo : ""}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: orderReview_module_default.orderItemImage,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
									itemInfo: item,
									selfConfig
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: orderReview_module_default.textInfo,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: orderReview_module_default.name,
										children: getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name
									}),
									optText && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: orderReview_module_default.opt,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: orderReview_module_default.optText,
											children: optText
										})
									}),
									this.renderPromotionTag(item),
									renderPrice(item, pricedCartItems[i])
								]
							})]
						}), item?.remark?.optionName.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderReview_module_default.note,
							children: item.remark.optionName
						})]
					}),
					isShowCounter && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: orderReview_module_default.calcBox,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.calcBoxIcons,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									"aria-label": "Remove",
									className: orderReview_module_default.btnEn,
									onClick: () => {
										this.handleAddSubNum(item, true);
									},
									children: item.quantity > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: orderReview_module_default.muiDiyIcon }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Delete.default, { className: orderReview_module_default.muiDiyIcon })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: orderReview_module_default.qty,
									children: item.quantity
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: isAddItemBtnDisabled,
									"aria-label": "Add",
									className: isAddItemBtnDisabled ? orderReview_module_default.btnDis : `${orderReview_module_default.btnEn} animate-btn`,
									onClick: () => {
										this.handleAddSubNum(item);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: orderReview_module_default.muiDiyIcon })
								})
							]
						})
					}),
					isMembershipCard(item) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: orderReview_module_default.promotion,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
							"aria-label": "Remove",
							className: orderReview_module_default.removeBtnBg,
							onClick: this.props.removeMembershipCard,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Delete.default, { className: orderReview_module_default.removeBtn })
						})
					}),
					!isMembershipCard(item) && (item.isLocalExchangePurchaseItem || item.discountID && item.secondHalfInfo?.activityRule?.buyType === "random" || item.isFreeItem || item.isCRMFreeItem || onlyOnePromotionReward) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.promotion,
						children: [item.isLocalExchangePurchaseItem && Number(item.quantity || 1) > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderReview_module_default.qty,
							children: item.quantity
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
							"aria-label": "Remove",
							className: orderReview_module_default.removeBtnBg,
							onClick: () => {
								if (item.isFreeItem || item.isCRMFreeItem) this.setState({ deleteFreeItem: item });
								this.handleAddSubNum(item, true);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Delete.default, { className: orderReview_module_default.removeBtn })
						})]
					})
				]
			}, `${item.sequence}-${item.id}-${i}`);
		});
		const giftsList = buyGifts?.[0]?.items?.map((item, index) => {
			const optText = this.orderDetailWriter(item);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderReview_module_default.orderItemInfoBx,
				onClick: () => this.editGiftItem(item),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: orderReview_module_default.orderBox,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.info,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderReview_module_default.orderItemImage,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
								itemInfo: item,
								selfConfig
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.textInfo,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: orderReview_module_default.name,
									children: getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name
								}),
								optText && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: orderReview_module_default.opt,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: orderReview_module_default.optText,
										children: optText
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: orderReview_module_default.price,
									children: "$0.00"
								})
							]
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: orderReview_module_default.giftsNumber,
					children: [Number(item.quantity || 1) > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: orderReview_module_default.qty,
						children: item.quantity
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
						"aria-label": "Remove",
						className: orderReview_module_default.removeBtnBg,
						onClick: (e) => {
							e.stopPropagation();
							this.removeGiftItem(item);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Delete.default, { className: orderReview_module_default.removeBtn })
					})]
				})]
			}, item.sequence || `${item.id}-${index}`);
		});
		let isExceedlimit = !!(String(keyboardValue).length >= 255);
		const isShowRemark = selfConfig?.configMap?.id_2;
		const { isClick, count } = this.judgeClick();
		const missingRequiredCategories = getMissingRequiredCategories(requireCategory, currentOrder.itemList);
		const { shouldAnimate } = this.state;
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
			freeItemInOrder.price = freeItemInOrder.freeItemOriginPrice;
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
		const exchangePurchaseDiscount = currentOrder?.itemList.filter((item) => item.isLocalExchangePurchaseItem).reduce((total, item) => Number(Big(total).plus(item.discount || 0).toFixed(2)), 0);
		let memberDiscount = 0;
		if (canUseMemberPrice(store)) {
			const { realPrice, realBenefitPrice } = getOrderMemberPrices(currentOrder.itemList);
			memberDiscount = Math.max(0, Big(realPrice).minus(realBenefitPrice).toNumber());
		}
		const savedDiscount = Number(Big(discount).plus(exchangePurchaseDiscount || 0).plus(memberDiscount).toFixed(2));
		const hasDiscount = savedDiscount > 0;
		let totalPrice = orderInfo.orderSubtotal.toFixed(2);
		if (hasDiscount) {
			totalPrice = Big(totalPrice).plus(freeItemPrice).minus(discount).toFixed(2);
			totalPrice = Number(totalPrice) < 0 ? `0.00` : totalPrice;
		}
		itemValidPromotion?.find((e) => {
			const { isSelected, validateInfo, promotion, extraInfo } = e;
			if (GIFT_PROMOTION_TYPE.includes(promotion.type)) return isSelected && Object.keys(extraInfo?.nextBenefit || {})?.length > 0;
			return isSelected && validateInfo.invalidReason?.find((r) => [
				"SHORT_OF_NEXT_AMOUNT_THRESHOLD",
				"SHORT_OF_NEXT_QUANTITY_THRESHOLD",
				"SHORT_OF_NEXT_DISCOUNT_ROUND "
			].includes(r.key));
		});
		const saveUpto = itemValidPromotion?.find((e) => e.isSelected && e.discountAmount >= e.promotion?.activityRule[0]?.maxAmount && e.promotion?.activityRule[0]?.maxAmount);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				id: "orderReviewId",
				className: `${orderReview_module_default.orderReview} ${isShowLoginBar ? "" : orderReview_module_default.noCrmBar}`,
				style: { visibility: this.props.isReorderFlag ? "hidden" : "visible" },
				ref: (el) => this.scrollDom = el,
				children: [
					missingRequiredCategories.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: (el) => this.requiredCategoryTipDom = el,
						className: `${orderReview_module_default.tipBox} ${orderReview_module_default.tipBoxShake}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(requireCategoryTip_default, { onlyMissing: true })
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.orderItemListContainer,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: orderItemList }), buyGifts?.[0]?.items?.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.giftListWrapper,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: orderReview_module_default.titleRow,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: orderReview_module_default.titleText,
									children: t("giveAway")
								})
							}), giftsList]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderReview_module_default.area,
						style: { display: isShowRemark ? "block" : "none" },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: orderReview_module_default.title,
								children: t("orderExtraDescription")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: orderReview_module_default.textareaBox,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									ref: (el) => this.inputRef = el,
									maxLength: 255,
									placeholder: `${t("noteDishPlaceholder")},${t("note_tip")}`,
									value: keyboardValue,
									className: orderReview_module_default.textContent,
									onFocus: () => {
										window.scroll(0, 0);
									},
									onBlur: () => {
										window.scroll(0, 0);
									},
									onClick: () => {
										this.setState({ descVisible: true });
									},
									onCompositionStart: () => {
										this.flag = true;
									},
									onCompositionEnd: () => {
										this.flag = false;
										this.inputRef.value = this.inputRef.value;
									},
									onChange: this.keyboardChange
								}), !!keyboardValue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
									className: orderReview_module_default.iconEmpty,
									type: "round_close_light",
									size: 5,
									onClick: this.handleResetEmpty
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: orderReview_module_default.maxNote,
								style: { display: isExceedlimit ? "block" : "none" },
								children: t("maxNoteTip")
							})
						]
					}),
					this.renderPromotionCode(orderInfo),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomToast, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: orderReview_module_default.bottomSpacer,
						style: { height: `${this.state.bottomSpacerPx}px` }
					})
				]
			}),
			orderInfo.promotionDiscountInfo && isShowCheckFooter && Number(orderInfo?.orderDiscount) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderReview_module_default.orderDiscountInfo,
				ref: (el) => this.discountInfoDom = el,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("alreadyDiscount", { price: orderInfo?.orderDiscount.toFixed(2) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: orderReview_module_default.aimRule,
					children: [
						"(",
						this.renderLocalPromotionInfo(orderInfo),
						")"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddOnPromotion, {
				ref: this.addOnPromotionRef,
				onClose: this.handleCloseAddOnPromotion,
				isGiftPromotionAutoOpenRewardModal: true,
				promotionCenterList
			}),
			isShowCheckFooter && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderReview_module_default.footBtnBox,
				ref: (el) => this.footBtnBoxDom = el,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: orderReview_module_default.cartIcon,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMMAAADWCAMAAABbusawAAAASFBMVEX/tgAAAAD/tgD/uQD/twD/twD/tQD/tQD/tQD/uQD/tQD/tgD/tgD/twD/twD/uQD/tgD/tgD/tgD/tgD/tQD/tgD/uQD/tgBI5dDmAAAAGHRSTlOyAOgWm8u5WUIsb4Wn4L8LkdlOemQ3IdRfAnH2AAAFSklEQVR42tzY0XKrIBSF4UXAiELUGDXv/6bn7kz3jGhxKc3O/wB2vprAamH0xxuWsQ3uWEN4jYvh4g19HUHmvDVEhEEIWEVtiDiDdTgpZw0RYZgjTis2Jj/e4HFq+QjeYCNOLS4mL97QO5yc601WvGHC6dUmJ95gcUHWZMQbWlzQZDKiDT2uKPYmI9Yw438fcL7mGuRH6TM+TMcMAy5pMBmxhgjR0NhDNQ6iaDJiDdyhmD6iTUakwULkzOEc8cvgDAtEwRxuIA4mztBwhvQB501GnGGGqDWHmyAaTUacYSSPdf5JvKEmBqfME2+UM0zEp1jWEJccZ2ghmk1m/CnNG8Jpfwr3xCXHGQaIFnO8SFxyhIG8XWWO+HVQBsgM0Yv4alEGYm1SFzVp4A8T/qphDfxc4i+5TzXM1LPSht5uN95FL0s030XRpvu9oa8DdqpuogpMNxk2Ct7+yjBGoKjhsW2QOf8LQw38reF+4J+yyCfgeRN1yIh+2LhjWFDe8M59qcu2IWS/ft5Q5RrCpsHSH2He8MZu/ZZhpI9D3vDEbn7L0P6F4X4TPbDbtGUIxE8taGh5A7qMt3/FW31tGYYSBv6EGLYM7oKT5IKT2m0ZiBOd6Jn9uM8z5D/Opg2WWAdFDQtp4OcS//Wa04amjIE/5jxp4Ccff8mNaYM/ZgBKX3JTwsBMvtKXXJs21J9h6LBXSBumMpOPPyNc2tAWnUvp+4YxvAhD2UsubQiFJh//QJs0DIXmEv9il6TBEYayl9ycNBBfQdIgw26eNPBzib9wxpTBEobCF/WUYSB+ImHocscG2NkKlL/kAmng5xJ/0rmUwesxxJRhLDb5+H+5pgw1cauWvuRswjApMiwJQ0sstNKX3CwN2dO7qt7P5+NBTI3Ucf14PN9VVXXYzScMAXnd7133/wdyVe+q6rqM27JOGAboaUoYHPTUJgxQVPgCg1s3WCgqfoEB64YGmrJfYFhWDR6amlcNIzTlVw01NFWvGiZoalo1tNBUu2p4QVNh1RCgKScMGqc3EIVB4/QGIAwaZysA+wWG5adB5WwF5i8w+J8GlbMVqL/AMP00qJzecmxA5fSWYwMqp7ccG1A5veXYgMrpLccGVE5vOTagcnrLsQGV01uODeic3v+6uQNUB2EgAKLzsfBtERS1vf9R2yYmWegJZvcGg8i+gAbm34YF2QRs4KQ3nD8NK7YJ2MBJbyI2cLIVbgkaAjZw0htYEzQMbOCkN/BK0DCwgZTeERtI6R2xgZTecVEjpTexQUrviA2k9I7YQErviA2k9I7YQErviA2kbAVeCRo6NrCyFeYEDR0bWNkKjwQNR2+w0hu23mCld8AGVnoHbGCld8AGVnoHbGCld7g3Fiu9w6JGS+/QoKX3wAZatsIjQUPDBlq2wpagoWEDLVthSdDQsIGW3gMbaOk9sIGW3mNR46U37FeDl94dG3jp3bGBl94dG3jp3bGBl94dG3jZCmRoqNjAy1ZgStBQsYGYrTAnaKjYQEzvhg3E9G7YQExvOBI0VGwgpnfDBmJ6N2wgpnfDBmJ6N2wgpnfDBma2wpygYb8anninYAMzvS9sYGYrHAkaCjYw0/vCBmZ6A6XBzFZgTdDwxQZmel/YQE3vig3U9K7YQE3vig3U9K7YQM1WOBI0fLGBmt4VG6jpXbGBmq3AlKXBTO+KDdz0LtjAzVbYEzScnwY3vQs2cNO7YAM3vQs2cNO7YAM3vQs2cLMVmHI0uOkN3HM06N/p1b/jtgTnh+LWVf0gbtOnwXdlKHFm/TdY/Ov/4Vj2eDeF8VC9nNNfmTdZl0SOjGaxdQAAAABJRU5ErkJggg==",
						className: `${orderReview_module_default.cart} ${shouldAnimate ? orderReview_module_default.cartAnimation : ""}`
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
						className: `${orderReview_module_default.count} ${shouldAnimate ? orderReview_module_default.countAnimation : ""}`,
						children: count
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: [
						orderReview_module_default.footContent,
						hasDiscount && orderReview_module_default.hasDiscount,
						isClick ? `${orderReview_module_default.actived} linear-animate-btn` : orderReview_module_default.noActived
					].join(" "),
					onClick: () => {
						if (isClick) this.handleConfirm();
						else if (missingRequiredCategories.length) this.shakeRequiredCategoryTip();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderReview_module_default.text,
							children: t("confirm-order")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.total,
							children: ["$", totalPrice]
						}),
						hasDiscount && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderReview_module_default.discountInfo,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: orderReview_module_default.right_img,
								src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHcAAABeCAYAAAAZmot0AAAACXBIWXMAACE4AAAhOAFFljFgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMtSURBVHgB7dzbbdwwEIVhygWkgnSQdoIUElcVwAUESB2BCwjcQBpY89iivavVhaR4mRmeHyAMwy+SPqzXXonjHGOsX5fL5Ytj9vKwj349+/XNMTvNsC/zIrCVFrBZwJNj4gKs//Jz48f//fo+TdNfdxBxhXUAG4oCJq6gImFDh8DEFVIibGgXmLgCyoQNbQITt3MnYUOrwMTtWCHY0B0wcTtVGDZ0A0zcDlWCDX0AE7dxlWFD78CONasRbOgfcRvVGJav3FZ1geV7bv16weIb4lasJywibqV6wyLiVkgCLCJu4aTAIuIWTBIsIm6hpMEi4hZIIiwi7smkwiLinkgyLCJuZtJhEXEz0gCLiJuYFlhE3IQ0wSLiRqYNFhE3Io2wiLgHaYVFxN1JMywi7kbaYRFxV7IAi4i7yAosIu5VlmARceeswaIHlxHmIvn1ZGW6ikVYlPzKnQdePfkF2GYHWiursCgJdwEbUgtsGRZF427AhtQBW4dFUbgHsCE1wCPAokPcSNiQeOBRYNEubiJsSCzwSLBoEzcTNiQOeDRYtIp7EjYkBnhEWHSHWwg21P1ER4VFN7iFYUPdTnhkWPSBWwk21PzER4dFb7iVYUPNLgBh35tm2D9+fXX1q34hCPvZgz8wHOAv16a33xC17iYR9rbr91xclEfXpuIXhrD3Lf9aVglM2PXW/s9VBUzY7bY+oVIBTNj99j5bFg1M2OOO7gqJBCZsXDH3c0UBEza+2CcxRAATNq2UZ6i6AhM2vdSnH7sAEzavnOeWWwP/9uuHa5MZWJS1naQxcKtMwaLsvULGgM3BolMbwYwAm4RFp3f5KQc2C4uKbOFUCmwaFhXbn6sM2DwsKrr5WgnwELCo+M564cDDwKIqYxOEAg8Fi6rNxBAGPBwsqjrwRAjwkLCo+jSbzsDDwqImo4o6AQ8Ni5rNodL+XLTGmg4ZawRM2LnmE+QqAxP2qi7jASsBE3ZRt9mPhYEJu1LXwZ6FgAm7UfeprSeBCbuTiJG8mcCEPUjMvOVEYMJGJGqYdiQwYSMTNyn9AJiw2gOwXy+L9XwxMpl9+BbAhLXWDEzYzF4B/1cNH6bO2mIAAAAASUVORK5CYII=",
								alt: "right sign"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: orderReview_module_default.savedInfo,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: orderReview_module_default.saved,
									children: saveUpto ? t("save_up_to") : t("saved")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: orderReview_module_default.discountNum,
									children: ["$", savedDiscount.toFixed(2)]
								})]
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: showCallBoard,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallerBoard_default, {
					tableServiceType,
					setLocator,
					isShowDesc,
					onClose: this.closeCallBoard
				})
			}),
			orderPanelShow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(orderDetailModal_default, {
				isMountOnBody: Boolean(promotionFn),
				orderPanelShow,
				onCloseModal: () => {
					this.setState({ orderPanelShow: false });
				},
				itemInfo: selectedItem,
				onRef: this.openOrderDetailModal,
				...selectedItem.isFreeItem ? {
					isInFreeItem: true,
					max: 1
				} : {},
				...selectedItem.promotionItem ? {
					isPromotionItem: true,
					isExchangePurchase: selectedItem.isLocalExchangePurchaseItem,
					promotionFn,
					max: 1
				} : {}
			}),
			keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
				keyboardValue,
				changeInput: this.onChange,
				closeKeyboard: this.hideKeyboard
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(deleteDishModal_default, {
				isShowModal: deleteLoading,
				lastReuqireItem,
				handleContinue: this.handleContinue,
				handleCancel: this.handleCancel
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromoCodeInput_default, {
				isShowModal: promoCodeVisiable,
				handleContinue: this.handlePromoCodeContinue,
				handleCancel: this.handlePromoCodeCancel
			}),
			isShowCardMinModal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(cardMinAmount_default, {
				isShowCardMinModal,
				currentAmount,
				handleContinueOrder: this.handleContinueOrder,
				handleCloseMin: this.handleCloseMin
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboItemsDetailModal_default, {
				onRef: this.openItemsDetailModal,
				comboInfo: selectedItem,
				handleCloseDetail: this.handleCloseDetail,
				setCurSectionId: this.props.setCurSectionId,
				getOneUncompletedSection: this.props.getOneUncompletedSection,
				openComboDetail: (idx) => this.setState({
					comboPanelVisible: true,
					comboPanelIdx: idx
				}),
				isInFreeItem: selectedItem.isFreeItem,
				isPromotionItem: selectedItem.promotionItem,
				isExchangePurchase: selectedItem.isLocalExchangePurchaseItem,
				itemPoints: selectedItem.itemPoints
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				isMountOnBody: Boolean(promotionFn),
				visible: comboPanelVisible,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboPanel_default, {
					comboPanelIdx,
					editingSequence: selectedItem.sequence,
					onCloseModal: () => {
						this.setState({ comboPanelVisible: false });
					},
					...selectedItem.isFreeItem ? {
						isInFreeItem: true,
						max: 1,
						itemPoints: selectedItem.itemPoints
					} : {},
					...selectedItem.promotionItem ? {
						isPromotionItem: true,
						isExchangePurchase: selectedItem.isLocalExchangePurchaseItem,
						max: 1,
						onEditPromotionItem: promotionFn,
						ruleId: selectedItem.ruleId,
						selectedPromotion
					} : {}
				})
			}),
			isHasSoldoutDish ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(soldoutModal_default, {
				isHasSoldoutDish,
				dishMap,
				reorder: this.reorder,
				continueReorder: this.continueReorder
			}) : null,
			isHasOrderCharge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(cardPayTipModal_default, {
				isHasOrderCharge,
				handleCancel: this.handleCancelOrderCharge,
				handleConfirm: this.handleConfirmOrderCharge
			}) : null,
			itemPromotionVisible && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemPromotionModal_default, {
				visible: itemPromotionVisible,
				onConfirm: this.handleSelectPromotion,
				onSkip: this.handleSkipPromotion,
				onClose: this.handleClosePromotionModal,
				goOrder: () => {
					this.backBtnHandler();
					toast_default.info(t("selectItemInMenuPage"), "top");
				}
			}),
			errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
				variant: "filled",
				severity: "error",
				children: errorApiMsg
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: this.state.loading }),
			this.state.giftDeleteSelection && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: true,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: ItemDeleteDrawer_module_default.deleteContainer,
					onClick: () => this.setState({ giftDeleteSelection: null }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ItemDeleteDrawer_module_default.deleteBox,
						onClick: (event) => event.stopPropagation(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ItemDeleteDrawer_module_default.deleteList,
							children: this.state.giftDeleteSelection.items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: ItemDeleteDrawer_module_default.itemBox,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: ItemDeleteDrawer_module_default.itemName,
										children: getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: ItemDeleteDrawer_module_default.itemLeft,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: ItemDeleteDrawer_module_default.opt,
											children: getVariantDescription(item, language)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: ItemDeleteDrawer_module_default.price,
											children: "$0.00"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: ItemDeleteDrawer_module_default.calcBox,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
											"aria-label": "Remove",
											className: ItemDeleteDrawer_module_default.btnEn,
											onClick: () => this.stageGiftVariantRemoval(item.sequence),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: ItemDeleteDrawer_module_default.muiDiyIcon })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: ItemDeleteDrawer_module_default.qty,
											children: "1"
										})]
									})
								]
							}, item.sequence || index))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ItemDeleteDrawer_module_default.deleteBottom,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `${ItemDeleteDrawer_module_default.addCart} linear-animate-btn`,
								onClick: this.confirmGiftVariantRemoval,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("confirm") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: ItemDeleteDrawer_module_default.price,
									children: this.state.giftDeleteSelection.items.length
								})]
							})
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DescModal, {
				preVal: keyboardValue,
				visible: descVisible,
				title: t("orderExtraDescription"),
				onClose: () => this.setState({ descVisible: false }),
				onSetVal: (v) => this.keyboardChange(v)
			})
		] });
	}
};
function mapStateToProps(state) {
	return {
		store: state,
		requireCategory: state.requireCategory,
		currentOrder: state.currentOrder,
		selfConfig: state.selfConfig,
		systemConfig: state.systemConfig,
		isReorderFlag: state.orderEdit.isReorderFlag,
		itemSizeList: state.itemSizeList,
		crm: state.crm,
		avocado: state.avocado,
		discount: state.discount,
		promotion: state.promotion,
		currentCategoryList: state.currentCategoryList,
		userId: state.sysCookie.kioskConfigUserId,
		merchantProfile: state.merchantProfile
	};
}
var orderReview_default = withRouter(connect(mapStateToProps, {
	setSideNavIndex,
	setSideNavList,
	initEditOrderMode,
	resetCurrentOrderCombo,
	setEditOrderMode,
	setTogoOption,
	notes,
	editOrderItemAction,
	spliceOrderBySoldout,
	payByCard,
	payByCash,
	getCurrentCategory,
	setSelfConfig,
	setLocator,
	setTabelServiceType,
	setBuyGifts,
	setSatisfyRules,
	getCurrentItem,
	setTempCampaign,
	changeFreeItem,
	setPromotionCode,
	saveOrderResult,
	setItemValidPromotion,
	addCampaignItemsToOrder,
	changePromotionStatusAfterCheck,
	removeMembershipCard
})(withMemberPrivilege(withTranslation()(OrderReview))));
//#endregion
export { orderReview_default as default };
