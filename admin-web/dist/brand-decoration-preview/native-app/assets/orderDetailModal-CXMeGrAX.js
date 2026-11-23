import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { W as removeEmoji, d as on, p as solveScrollElem, t as compare, u as off } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { Fr as isTotalQtyWithinStock, Ir as showInsufficientStockToast, M as getCurrentItem, Or as getCartItemQtyByStockId, Qi as Big, Rr as getItemStoppedStatus, aa as getStockItemId, da as require_cloneDeep, dr as getComboItemDetailInfo, mr as getDishItemLanguage, or as setTempCampaign, r as addCombo2Order, ut as replaceItemOrder, wi as getPromotionModalDisplayPrice, zi as getItemActualPrices } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { n as imgCard_default, t as star_default } from "./star-C6iOuR53.js";
import { c as require_Remove, d as shouldShowBenefitPrice, f as BenefitPrice, i as ItemOptionSelectWithSub_default, l as require_Add, n as arrow_left_default, p as BenefitPrice_module_default, r as fixComboOption_default, s as sizeOptionSelect_default, t as DescModal, u as Fab_default } from "./DescModal-Q1_miAgO.js";
import "./moreTip-DweVCJKq.js";
//#region source-snapshot/src/container/orderPage/orderDetailModal/orderDetailModal.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var orderDetailModal_module_default = {
	drawBody: "drawBody___2OKpN",
	header: "header___WjzV9",
	text: "text___Sww5B",
	backPrePage: "backPrePage___sgnph",
	contentTopBox: "contentTopBox___iA7rf",
	maxNote: "maxNote___ozDCr",
	leftBox: "leftBox___9ItYp",
	rightBox: "rightBox___91pr5",
	title: "title___Z-GBw",
	sub: "sub___-5nIH",
	word: "word___ZVYBA",
	singlePrice: "singlePrice___Xhtwz",
	textContent: "textContent___-AAmt",
	iconEmpty: "iconEmpty___lR7w5",
	areaImg: "areaImg___Dbxg9",
	area: "area___lz8A8",
	required: "required___uDbVh",
	require: "require___aT4zC",
	areaFixCombo: "areaFixCombo___dl35U",
	foot: "foot___kx7sF",
	countBtn: "countBtn___325kJ",
	muiDiyIcon: "muiDiyIcon___PfXTp",
	count: "count___riSe7",
	btnDis: "btnDis___PsIUL",
	btnEn: "btnEn___2Gr94",
	addCart: "addCart___96Sp9",
	price: "price___uHDwh",
	pointImg: "pointImg___7wymD",
	addCartDisabled: "addCartDisabled___g7Akh"
};
//#endregion
//#region source-snapshot/src/container/orderPage/orderDetailModal/index.js
var import_Add = /* @__PURE__ */ __toESM(require_Add());
var import_Remove = /* @__PURE__ */ __toESM(require_Remove());
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_jsx_runtime = require_jsx_runtime();
var defaultMax = 99;
var OrderDetailModal = class extends import_react.Component {
	constructor() {
		super();
		this.state = {
			maxNum: defaultMax,
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
		const { currentCategory, currentCategoryList, itemInfo, max, isInFreeItem = false, isPromotionItem, isSpecialItem = false } = this.props;
		if ((isInFreeItem || isPromotionItem || isSpecialItem) && max) this.setState({ maxNum: max });
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
		let chooseNum = 1;
		if (this.props.history.location.pathname.indexOf("/orderReview") > -1 && !isInFreeItem && !isPromotionItem && !isSpecialItem) chooseNum = itemInfo?.quantity || 1;
		this.setState({
			defaultItemSizeId,
			options,
			chooseNum,
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
	calFixItemPrice = (memberPrice = false) => {
		if (memberPrice) this.fixedHasBenefitPrice = false;
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
								if (memberPrice && Number.isFinite(minObj.benefitPrice)) this.fixedHasBenefitPrice = true;
								fixItemPrice = fixItemPrice.plus(memberPrice && Number.isFinite(minObj.benefitPrice) ? minObj.benefitPrice : minObj.price);
							} else {
								if (memberPrice && Number.isFinite(sItem.benefitPrice)) this.fixedHasBenefitPrice = true;
								fixItemPrice = fixItemPrice.plus(memberPrice && Number.isFinite(sItem.benefitPrice) ? sItem.benefitPrice : sItem.price);
							}
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
		const itemPrice = itemInfo?.itemPrices;
		let isItemPrice = itemPrice != void 0 && itemPrice.length > 0;
		let totalPrice = "0.00";
		let optionTotalPrice = Big(0);
		if (state?.selectedItemList?.length) state?.selectedItemList.map((item) => {
			optionTotalPrice = optionTotalPrice.plus(item.isFreeItem ? 0 : item.price);
		});
		optionTotalPrice = optionTotalPrice.plus(this.calFixItemPrice());
		if (!isItemPrice) totalPrice = optionTotalPrice.plus(itemInfo?.price).times(chooseNum).toFixed(2);
		else totalPrice = optionTotalPrice.plus(sizeInfo?.price ?? 0).times(chooseNum).toFixed(2);
		if (totalPrice == "NaN") this.setState({ totalPrice: "0.00" });
		else {
			const selectedPrices = getItemActualPrices({
				...itemInfo,
				price: isItemPrice ? 0 : itemInfo.price,
				sectionDetail: [...isItemPrice ? [{
					id: -1,
					sizeInfo
				}] : [], {
					id: -2,
					options: state?.selectedItemList || []
				}]
			});
			const fixedMemberPrice = this.calFixItemPrice(true);
			this.setState({
				totalPrice,
				totalBenefitPrice: Big(selectedPrices.realBenefitPrice).plus(fixedMemberPrice).times(chooseNum).toNumber(),
				hasSelectedBenefitPrice: selectedPrices.hasBenefitPrice || this.fixedHasBenefitPrice
			});
		}
	};
	addOrder = () => {
		const { t, currentOrder, itemInfo, currentCategoryList, isInFreeItem = false, isPromotionItem, onAddFreeItem, promotionFn, isSpecialItem = false } = this.props;
		const stoppedStatus = getItemStoppedStatus(itemInfo);
		if (stoppedStatus) {
			toast_default.info(t(stoppedStatus === "unavailable" ? "dish-item-unavailable" : "dish-sold-out", { item: itemInfo.name }), "top");
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
			toast_default.info(t("choose-size"), "top");
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
				opts_2.originalOptions = (0, import_cloneDeep.default)(opts_2.options);
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
							sItem.isComboBaseFree = cs.priceRule == "FIXED_PRICE";
							if (cs.priceRule == "FIXED_PRICE") minObj.price = 0;
							sItem.selectedOptionList.push({
								id: -1,
								sizeInfo: minObj
							});
							fixObj.items.push(sItem);
						} else {
							sItem.isComboBaseFree = cs.priceRule == "FIXED_PRICE";
							if (cs.priceRule == "FIXED_PRICE") sItem.price = 0;
							fixObj.items.push(sItem);
						}
					}
				});
				tempItem.sectionDetail.push(fixObj);
			});
		}
		if (this.props.history.location.pathname.indexOf("/orderPage") > -1 || isInFreeItem && !itemInfo.isFreeItem || isPromotionItem && promotionFn || isSpecialItem) if (isItemPrice) if (sizeInfo?.sizeId) {
			tempItem.sectionDetail.unshift({
				id: -1,
				sizeInfo: Object.assign({}, sizeInfo)
			});
			tempItem.price = 0;
			if (isInFreeItem && !itemInfo.isFreeItem || isSpecialItem) {
				onAddFreeItem(tempItem);
				this.closePanel();
				return;
			} else if (isPromotionItem && promotionFn) {
				promotionFn(tempItem);
				this.closePanel();
				return;
			}
			if (this.props.addCombo2Order(tempItem) === false) {
				this.closePanel();
				return;
			}
			if (itemInfo.isFreeItem) this.props.setTempCampaign([tempItem]);
		} else return;
		else {
			if (isInFreeItem && !itemInfo.isFreeItem || isSpecialItem) {
				onAddFreeItem(tempItem);
				this.closePanel();
				return;
			} else if (isPromotionItem && promotionFn) {
				promotionFn(tempItem);
				this.closePanel();
				return;
			}
			if (this.props.addCombo2Order(tempItem) === false) {
				this.closePanel();
				return;
			}
			if (itemInfo.isFreeItem) this.props.setTempCampaign([tempItem]);
		}
		else if (this.props.history.location.pathname.indexOf("/orderReview") > -1) {
			if (sizeInfo?.sizeId) {
				tempItem.sectionDetail.unshift({
					id: -1,
					sizeInfo: Object.assign({}, sizeInfo)
				});
				tempItem.price = 0;
			}
			if (this.props.replaceItemOrder(tempItem, tempItem.sequence) === false) {
				this.closePanel();
				return;
			}
			toast_default.info(t("edit-success"), "top");
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
				excludeSequence: this.props.isPromotionItem ? itemInfo.sequence : void 0,
				excludePromotionRuleId: this.props.excludePromotionRuleId,
				menuItemList,
				itemList: currentOrder.itemList,
				currentOrderCombo: this.props.currentOrderCombo,
				crm
			})) {
				showInsufficientStockToast("top", itemInfo, menuItemList);
				return;
			}
		}
		if (n >= maxNum) {
			toast_default.info(t("max-up", { rplc: maxNum || defaultMax }), "top");
			n = maxNum;
		}
		this.setState({ chooseNum: n }, () => {
			this.calPrice();
		});
	};
	handleScroll = () => {
		if (!this.state.isScroll) this.setState({ isScroll: true }, () => {
			off(this.scrollDom, "scroll", this.handleScroll);
		});
	};
	componentDidMount() {
		this.props.onRef(this);
		this.viewOrderPanel();
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
			if (this.state.keyboardToggle && !prevState.keyboardToggle) requestAnimationFrame(() => {
				this.inputRef?.scrollIntoViewIfNeeded(true);
			});
		}
	}
	componentWillUnmount() {
		off(this.scrollDom, "scroll", this.handleScroll);
	}
	render() {
		const { t, i18n: { language }, itemInfo, selfConfig, orderPanelShow, isInFreeItem = false, isSpecialItem = false, isPromotionItem, isExchangePurchase = false, isMountOnBody } = this.props;
		const { keyboardToggle, keyboardValue, sizeInfo, totalPrice, chooseNum, options, defaultItemSizeId, maxNum, descVisible, showRequired } = this.state;
		const isItemPrice = itemInfo?.itemPrices?.length > 0;
		const fixItemPrice = this.calFixItemPrice().toNumber();
		const fixItemBenefitPrice = this.calFixItemPrice(true).toNumber();
		const showBenefitPrice = shouldShowBenefitPrice(itemInfo.benefitPrice, this.props.isHasBenefit) && !itemInfo.isFreeItem && !this.props.isInFreeItem && !this.props.isPromotionItem && !this.props.isSpecialItem;
		const isItemOption = options.length > 0;
		const isFixCombo = itemInfo?.comboType === "FIXED_SELECTION";
		const itemName = itemInfo?.id ? getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name : "";
		let isExceedlimit = !!(String(keyboardValue).length >= 255);
		let showText = "addToOrder";
		if (this.props.history.location.pathname.indexOf("/orderReview") > -1) showText = "confirm";
		const isShowRemark = selfConfig?.configMap?.id_3;
		const stoppedStatus = getItemStoppedStatus(itemInfo);
		let isDisabled = true;
		if (!stoppedStatus && (isItemPrice && Object.keys(sizeInfo).length || !isItemPrice)) isDisabled = false;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			isMountOnBody,
			visible: orderPanelShow,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderDetailModal_module_default.drawBody,
				onClick: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderDetailModal_module_default.header,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: arrow_left_default,
							className: orderDetailModal_module_default.backPrePage,
							onClick: this.closePanel
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderDetailModal_module_default.text,
							children: itemName
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderDetailModal_module_default.contentTopBox,
						ref: (el) => this.scrollDom = el,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: orderDetailModal_module_default.leftBox,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: orderDetailModal_module_default.areaImg,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
									selfConfig,
									itemInfo
								})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderDetailModal_module_default.rightBox,
							children: [
								(itemInfo.description || itemInfo.otherDescription) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: orderDetailModal_module_default.areaDetail,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: { marginTop: 0 },
										className: orderDetailModal_module_default.title,
										children: t("description")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: orderDetailModal_module_default.word,
										children: [itemInfo.otherDescription && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												fontWeight: "bolder",
												marginBottom: "2.5rem",
												fontSize: "3.5rem"
											},
											children: itemInfo.otherDescription || ""
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: itemInfo.description || "" })]
									})]
								}),
								!isItemPrice && showBenefitPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: orderDetailModal_module_default.area,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: orderDetailModal_module_default.title,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: BenefitPrice_module_default.priceGroup,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", itemInfo.price] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: itemInfo.benefitPrice })]
										})
									})
								}),
								isFixCombo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: orderDetailModal_module_default.areaFixCombo,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: orderDetailModal_module_default.title,
										children: t("items")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: orderDetailModal_module_default.word,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(fixComboOption_default, { sectionItemList: itemInfo.comboSections })
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: orderDetailModal_module_default.area,
									style: { display: isItemPrice ? "block" : "none" },
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: orderDetailModal_module_default.title,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("section") }), showRequired && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: orderDetailModal_module_default.required,
											children: t("required")
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: orderDetailModal_module_default.word,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(sizeOptionSelect_default, {
											sectionItemList: itemInfo.itemPrices || [],
											defaultItemSizeId,
											selectedItem: sizeInfo,
											changeSize: this.changeSize,
											fixItemPrice,
											fixItemBenefitPrice: this.fixedHasBenefitPrice ? fixItemBenefitPrice : void 0,
											itemInfo,
											isInFreeItem,
											isSpecialItem,
											isPromotionItem: isPromotionItem && !isExchangePurchase
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: orderDetailModal_module_default.area,
									style: { display: isItemOption ? "block" : "none" },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemOptionSelectWithSub_default, {
										toastPosition: "top",
										onRef: (ref) => this.itemOptionChild = ref,
										calPrice: this.calPrice,
										sectionItemList: options,
										itemInfo,
										parentQty: chooseNum,
										excludePromotionRuleId: this.props.excludePromotionRuleId,
										excludeSequence: isPromotionItem ? itemInfo.sequence : void 0,
										isSpecialItem,
										isInFreeItem,
										isPromotionItem: isPromotionItem && !isExchangePurchase
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: orderDetailModal_module_default.area,
									style: { display: isShowRemark ? "block" : "none" },
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: orderDetailModal_module_default.title,
											children: t("dishExtraDescription")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											ref: (el) => this.inputRef = el,
											maxLength: 255,
											placeholder: `${t("noteDishPlaceholder")},${t("note_tip")}`,
											value: keyboardValue,
											className: orderDetailModal_module_default.textContent,
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
										}),
										!!keyboardValue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
											className: orderDetailModal_module_default.iconEmpty,
											type: "round_close_light",
											size: 5,
											onClick: this.handleResetEmpty
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											ref: (el) => this.maxNoteRef = el,
											className: orderDetailModal_module_default.maxNote,
											style: { display: isExceedlimit ? "block" : "none" },
											children: t("maxNoteTip")
										})
									]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: orderDetailModal_module_default.foot,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderDetailModal_module_default.countBtn,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: chooseNum === 1,
									"aria-label": "Remove",
									className: chooseNum > 1 ? `${orderDetailModal_module_default.btnEn} animate-btn` : orderDetailModal_module_default.btnDis,
									onClick: () => this.changeChooseNum(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: orderDetailModal_module_default.muiDiyIcon })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: orderDetailModal_module_default.count,
									children: chooseNum
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: chooseNum >= maxNum,
									"aria-label": "Add",
									className: chooseNum !== maxNum ? `${orderDetailModal_module_default.btnEn} animate-btn` : orderDetailModal_module_default.btnDis,
									onClick: () => this.changeChooseNum(true),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: orderDetailModal_module_default.muiDiyIcon })
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `${orderDetailModal_module_default.addCart} ${isDisabled ? orderDetailModal_module_default.addCartDisabled : "linear-animate-btn"} `,
							onClick: this.addOrder,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t([showText]) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: orderDetailModal_module_default.price,
								children: isInFreeItem ? itemInfo.itemPoints ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									className: orderDetailModal_module_default.pointImg,
									src: star_default,
									alt: "point"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									itemInfo.itemPoints,
									" ",
									t("pts")
								] })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["$", itemInfo.price?.toFixed(2)] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: this.props.isHasBenefit === true && this.state.hasSelectedBenefitPrice && !isPromotionItem && !isSpecialItem ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", totalPrice] }),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, {
										variant: "button",
										benefitPrice: this.state.totalBenefitPrice
									})
								] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["$", getPromotionModalDisplayPrice({
									isPromotionItem,
									isExchangePurchase,
									totalPrice
								})] }) })
							})]
						})]
					}),
					keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
						VKOuterStyle: {
							position: "relative",
							flex: "0 0 auto"
						},
						keyboardValue,
						changeInput: this.onChange,
						closeKeyboard: () => {
							this.hideKeyboard();
						}
					}) : null
				]
			}),
			onClose: this.closePanel
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DescModal, {
			isMountOnBody,
			preVal: keyboardValue,
			visible: descVisible,
			title: t("dishExtraDescription"),
			onClose: () => this.setState({ descVisible: false }),
			onSetVal: (v) => this.keyboardChange(v)
		})] });
	}
};
function mapStateToProps(state) {
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
var orderDetailModal_default = withRouter(connect(mapStateToProps, {
	replaceItemOrder,
	getCurrentItem,
	addCombo2Order,
	setTempCampaign
})(withTranslation()(OrderDetailModal)));
//#endregion
export { orderDetailModal_default as t };
