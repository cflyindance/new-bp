import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { H as EventBus, d as on, p as solveScrollElem, u as off } from "./utils-Cdx9DbDR.js";
import { d as useSelector, i as shallowEqual, r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { $ as removeFreeItemInOrder, Ar as getOccupiedQtyByStockId, Ci as getExchangePurchaseDisplayPrices, Ei as getSatisfiedExchangePurchaseRules, Er as lineBreakTransfer, Fr as isTotalQtyWithinStock, Ir as showInsufficientStockToast, It as setExpandFreeList, Kn as changeFreeItem, M as getCurrentItem, Nr as isInvalidStockNum, Pr as isStockSufficient, Qi as Big, Sn as setorderPageDomTop, T as deleteAllById, Tn as spliceOrderItemAction, Xi as v4, Xr as checkCRMStatus, Yr as isHasPromotionFn, Zi as getItemPrice, _t as setActivityCurrentItem, aa as getStockItemId, bn as setVListScroll, cr as attachCategoryOptionsToItem, da as require_cloneDeep, gr as getItemSizeName, ii as filterValidPromotionCenterList, j as getCurrentCategory, kr as getItemStockNum, mr as getDishItemLanguage, n as addCampaignItemsToOrder, oi as isItemMatchedPromotionFilter, or as setTempCampaign, pr as getCurrentItemLanguage, r as addCombo2Order, ra as observeLayoutSize, ta as getCardColumnStyle, tt as removeItemFromOrder, wr as judgeHasDetailInfo, xi as applyExchangePurchaseDiscount, zr as itemIsSoldOut } from "./actions-BwRPwnFF.js";
import { t as native_i18n_default } from "./native-i18n-Bya1piKW.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { i as deleteDishModal_default, n as ItemsDrawer_default, r as cart_bag_default, t as useCrmPromotionContrary } from "./useCrmPromotionContrary-DFA1wQZz.js";
import { t as arrow_right_default } from "./arrow-right-BJDuAGvX.js";
import "./icon-CewZkCRp.js";
import { t as require_debounce } from "./debounce-BPwiJQPb.js";
import { t as useAddOnPromotion } from "./hooks-DiifsOH5.js";
import { n as getValidCategoryList } from "./getStandardCateDish-BKfAMpZF.js";
import { n as changePromotionStatusAfterCheck, t as changeCrmPromotionContraryInfo, u as setItemValidPromotion } from "./promotion-BUTvAW3c.js";
import { n as getPromotionCenterActivityRuleText, t as getPromotionActivityDisplayText } from "./getPromotionCenterDisplayText-Bfjuriuq.js";
import { i as handleCheckFreeItem, t as checkIsCampaignValid } from "./checkCRMIntegrationCampaign-Bubup5KG.js";
import { i as VariableSizeList, n as formatOrdinals } from "./PromotionTagsWrap-CjrBw9bq.js";
import { d as remToPx, t as createItemPromotionIndex, u as updateMeasuredItemCardRowHeight } from "./getItemCardProperties-CHuqwFqK.js";
import { c as require_Remove, l as require_Add, u as Fab_default } from "./DescModal-Q1_miAgO.js";
import { t as orderDetailModal_default } from "./orderDetailModal-CXMeGrAX.js";
import "./moreTip-DweVCJKq.js";
import { t as comboPanel_default } from "./comboPanel-D4O1jWqz.js";
import { t as DescViewModal_default } from "./DescViewModal-CDcpjYEk.js";
import { t as handleCountRowNum } from "./handleCountRowNum-B73-PziM.js";
import { n as notifyItemCardListScroll, t as itemCard_default } from "./itemCard-A1oFTMZK.js";
import { t as BottomToast } from "./bottomToast-B74lRND-.js";
import { a as getVirtualListData, n as getVirtualRowKeys, t as getAnchoredScrollOffset } from "./menuUpdatePosition-YdhPKLgg.js";
import { t as promotion_tag_default } from "./promotion-tag-B_BQp28s.js";
import { t as close_default } from "./close-F8X4N7jn.js";
//#region source-snapshot/src/container/orderPage/currentItemList/currentItemList.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var currentItemList_module_default = {
	itemInfoBx: "itemInfoBx___j3Xj-",
	itemListContainer: "itemListContainer___4grhQ",
	itemListInner: "itemListInner___63IGk",
	cateBox: "cateBox___SjLim",
	cateText: "cateText___gK8s1",
	descContainer: "descContainer___-N6A3",
	innerDesc: "innerDesc___0FW7J",
	descText: "descText___Mc-Xk",
	overflowSign: "overflowSign___afOLG",
	descModalWrapper: "descModalWrapper___8haAS",
	header: "header___kEwxb",
	text: "text___Ac4KC",
	content: "content___cfaRC",
	expandButtonContainer: "expandButtonContainer___2t9Lk",
	expandButton: "expandButton___dh87p"
};
var chooseDeleteOrder_module_default = {
	deleteContainer: "deleteContainer___sUKtu",
	deleteBox: "deleteBox___pCVVy",
	deleteList: "deleteList___nWoT7",
	itemBox: "itemBox___MzG0n",
	itemLeft: "itemLeft___Jbb26",
	opt: "opt___QdZKG",
	price: "price___ij5AA",
	note: "note___0wjT1",
	sizePrice: "sizePrice___RO4nt",
	comboDeleteList: "comboDeleteList___feyKZ",
	calcBox: "calcBox___nlwa3",
	sidenavBox: "sidenavBox___twOSu",
	sidenavTitle: "sidenavTitle___-S6g0",
	comboItemBox: "comboItemBox___5rV2Q",
	muiDiyIcon: "muiDiyIcon___HBgHF",
	btnDis: "btnDis___GUy-A",
	btnEn: "btnEn___KVDM5",
	qty: "qty___HW8fL",
	deleteBottom: "deleteBottom___D4-gf",
	cartIcon: "cartIcon___qlRky",
	cart: "cart___At08C",
	count: "count___qmZpK",
	addCart: "addCart___FHg4w",
	itemName: "itemName___VqtE0"
};
//#endregion
//#region source-snapshot/src/container/orderPage/chooseDeleteOrder/index.js
var import_Add = /* @__PURE__ */ __toESM(require_Add());
var import_Remove = /* @__PURE__ */ __toESM(require_Remove());
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_jsx_runtime = require_jsx_runtime();
var defaultMax$1 = 99;
var ChooseDeleteOrder = class extends import_react.Component {
	constructor() {
		super();
		this.state = {
			isShowMore: false,
			isScroll: false,
			deleteLoading: false,
			maxNum: defaultMax$1,
			deleteSequence: -1,
			cloneItemList: []
		};
	}
	orderDetailWriter = (item) => {
		const { i18n: { language } } = this.props;
		let price = null;
		let options = null;
		let cateOptions = null;
		let stack = [];
		if (item.sectionDetail) item.sectionDetail.forEach((sct) => {
			if (sct.id == -1) price = sct;
			if (sct.id == -2) options = sct;
			if (sct.id == -3) cateOptions = sct;
		});
		if (price) {
			let size = getItemSizeName(price.sizeInfo.sizeId, price.sizeInfo.size, this.props.itemSizeList, language);
			stack.push(size + "($" + price.sizeInfo.price + ") ");
		}
		if (options) {
			const optMap = this.getOptionMap(options.options);
			Object.keys(optMap).forEach((id, i) => {
				let str = optMap[id].name + (" ($" + optMap[id].price + ")") + (" x" + optMap[id].quantity) + (i < Object.keys(optMap).length - 1 ? ", " : "");
				stack.push(str);
			});
		}
		if (cateOptions) {
			const optMap = this.getOptionMap(cateOptions.options);
			Object.keys(optMap).forEach((id, i) => {
				let str = optMap[id].name + (" ($" + optMap[id].price + ")") + (" x" + optMap[id].quantity) + (Object.keys(optMap).length > 0 && i < Object.keys(optMap).length - 1 ? ", " : "");
				stack.push(str);
			});
		}
		if (item.sectionDetail) item.sectionDetail.forEach((sct) => {
			let itemsArr = [];
			if (sct.id > 0 && sct.items.length > 0) {
				sct.items.map((item) => {
					let str = "";
					if (!item.itemPrices) str = (getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name) + " ($" + item.price + ") x" + item.quantity;
					let optArr = [];
					if (item.selectedOptionList) item.selectedOptionList.forEach((list) => {
						if (list.id == -1) {
							let name = getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name;
							let size = getItemSizeName(list.sizeInfo.sizeId, list.sizeInfo.size, this.props.itemSizeList, language);
							optArr.push(`${name}(${size}) ($${list.sizeInfo.price})(x${item.quantity})`);
						} else {
							const subOptMap = this.getOptionMap(list.options);
							Object.keys(subOptMap).map((id) => {
								optArr.push(subOptMap[id].name + (" ($" + subOptMap[id].price + ")") + (" x" + subOptMap[id].quantity));
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
		return stack.join("");
	};
	getOptionMap(options) {
		const { i18n: { language } } = this.props;
		const map = {};
		options.forEach((opt) => {
			let nameStr = opt?.fieldDisplayNameGroups?.length && getCurrentItemLanguage(opt.fieldDisplayNameGroups, language) || opt.name;
			if (map[opt.id]) map[opt.id].quantity++;
			else map[opt.id] = {
				id: opt.id,
				name: nameStr,
				quantity: 1,
				price: opt.price
			};
		});
		return map;
	}
	showCollectOptions = (list) => {
		const { i18n: { language } } = this.props;
		let sizeArr = [];
		let optionArr = [];
		if (list && list.length) list.forEach((item) => {
			if (item.sizeInfo) {
				let size = getItemSizeName(item.sizeInfo.sizeId, item.sizeInfo.size, this.props.itemSizeList, language);
				sizeArr.push(`${size}($${item.sizeInfo.price})`);
			}
			if (item.options && item.options.length) {
				let t = item.options.reduce((pre, cur) => {
					let nameStr = cur?.fieldDisplayNameGroups?.length && getCurrentItemLanguage(cur.fieldDisplayNameGroups, language) || cur.name;
					if (cur.id in pre) pre[cur.id].count++;
					else pre[cur.id] = {
						count: 1,
						name: nameStr,
						price: cur.price
					};
					return pre;
				}, {});
				let tArr = [];
				for (let g in t) tArr.push(t[g]);
				tArr.forEach((tItem) => {
					optionArr.push(`${tItem.name}($${tItem.price})x${tItem.count}`);
				});
			}
		});
		return [...sizeArr, ...optionArr].join(", ");
	};
	showCategoryOptions = (optionsList) => {
		const { i18n: { language } } = this.props;
		let optionArr = [];
		if (optionsList && optionsList.length) {
			let t = optionsList.reduce((pre, cur) => {
				let nameStr = cur?.fieldDisplayNameGroups?.length && getCurrentItemLanguage(cur.fieldDisplayNameGroups, language) || cur.name;
				if (cur.id in pre) pre[cur.id].count++;
				else pre[cur.id] = {
					count: 1,
					name: nameStr,
					price: cur.price
				};
				return pre;
			}, {});
			let tArr = [];
			for (let g in t) tArr.push(t[g]);
			tArr.forEach((tItem) => {
				optionArr.push(`${tItem.name}($${tItem.price})x${tItem.count}`);
			});
		}
		return optionArr.join(", ");
	};
	handleContinue = () => {
		const { t } = this.props;
		let cloneItemList = this.state.cloneItemList;
		let idx = cloneItemList.findIndex((c) => c.sequence == this.state.deleteSequence);
		if (idx > -1) cloneItemList.splice(idx, 1);
		this.setState({ cloneItemList });
		this.handleCancel();
	};
	handleCancel = () => {
		this.setState({ deleteLoading: false });
	};
	handleAddSubNum = (item, isSub = false) => {
		const { t } = this.props;
		let cloneItemList = this.state.cloneItemList;
		if (isSub) if (item.quantity - 1 < 1) this.setState({
			deleteLoading: true,
			deleteSequence: item.sequence
		});
		else {
			item.quantity -= 1;
			let idx = cloneItemList.findIndex((c) => c.sequence == item.sequence);
			if (idx > -1) {
				let cloneItem = (0, import_cloneDeep.default)(cloneItemList[idx]);
				cloneItem.quantity = item.quantity;
				cloneItemList.splice(idx, 1, cloneItem);
			}
			this.setState({ cloneItemList });
		}
		else {
			let newNum = item.quantity + 1;
			const { menuItemList, currentOrderCombo, crm, currentOrder } = this.props;
			if (!isTotalQtyWithinStock({
				itemInfo: item,
				totalQty: this.state.cloneItemList.reduce((sum, cloneItem) => {
					if (cloneItem.sequence === item.sequence) return sum + newNum;
					return sum + (cloneItem.quantity || 0);
				}, 0),
				menuItemList,
				itemList: this.props.currentOrder.itemList,
				currentOrderCombo: this.props.currentOrderCombo,
				crm: this.props.crm,
				promotion: this.props.promotion
			})) {
				showInsufficientStockToast(void 0, item, menuItemList);
				return;
			}
			const draftItemList = (currentOrder?.itemList || []).map((orderItem) => {
				const editedItem = this.state.cloneItemList.find((cloneItem) => cloneItem.sequence === orderItem.sequence);
				if (!editedItem) return orderItem;
				if (orderItem.sequence === item.sequence) return {
					...(0, import_cloneDeep.default)(editedItem),
					quantity: newNum
				};
				return (0, import_cloneDeep.default)(editedItem);
			});
			const optionAddMap = {};
			const optionSection = item.sectionDetail?.find((section) => section.id === -2);
			for (const option of optionSection?.options || []) {
				const optionStockItemId = getStockItemId(option);
				const optionStockCloudId = option.cloudId;
				if (optionStockItemId == null && optionStockCloudId == null) continue;
				const optionKey = optionStockCloudId ? `${optionStockCloudId}` : `${optionStockItemId}`;
				if (!optionAddMap[optionKey]) optionAddMap[optionKey] = option;
			}
			for (const optionItem of Object.values(optionAddMap)) {
				const optionStockNum = getItemStockNum(optionItem, menuItemList);
				if (optionStockNum === void 0) continue;
				const optionStockItemId = getStockItemId(optionItem);
				const optionStockCloudId = optionItem.cloudId;
				const optionOccupiedQty = getOccupiedQtyByStockId({
					itemList: draftItemList,
					promotion: this.props.promotion,
					currentOrderCombo,
					crm,
					stockItemId: optionStockItemId,
					stockCloudId: optionStockCloudId,
					menuItemList
				});
				if (isInvalidStockNum(optionStockNum) || optionOccupiedQty > optionStockNum) {
					showInsufficientStockToast(void 0, optionItem, menuItemList);
					return;
				}
			}
			if (newNum <= this.state.maxNum) {
				item.quantity += 1;
				let idx = cloneItemList.findIndex((c) => c.sequence == item.sequence);
				if (idx > -1) {
					let cloneItem = (0, import_cloneDeep.default)(cloneItemList[idx]);
					cloneItem.quantity = item.quantity;
					cloneItemList.splice(idx, 1, cloneItem);
				}
				this.setState({ cloneItemList });
				if (newNum == this.state.maxNum) toast_default.info(t("max-up", { rplc: defaultMax$1 }));
			}
		}
	};
	handleConfirm = () => {
		let cloneItemList = this.state.cloneItemList;
		let id = cloneItemList[0].id;
		this.props.spliceOrderItemAction({
			id,
			cloneItemList
		});
		this.props.handleCloseDeleteModal();
	};
	handleScroll = () => {
		if (!this.state.isScroll) this.setState({ isScroll: true }, () => {
			off(this.scrollDom, "scroll", this.handleScroll);
		});
	};
	componentDidMount() {
		const cloneItemList = (0, import_cloneDeep.default)(this.props.currentOrder.itemList.filter((o) => o.id == this.props.itemInfo.id));
		this.setState({ cloneItemList });
		if (this.scrollDom) on(this.scrollDom, "scroll", this.handleScroll);
	}
	componentDidUpdate() {
		if (!this.state.cloneItemList.length) {
			this.props.deleteAllById({ foodId: this.props.itemInfo.id });
			this.props.handleCloseDeleteModal();
			return;
		}
		if (!this.state.isScroll) {
			let bool = !!(this.scrollDom.scrollHeight > this.scrollDom.offsetHeight);
			if (bool != this.state.isShowMore) this.setState({ isShowMore: bool });
		}
	}
	componentWillUnmount() {
		off(this.scrollDom, "scroll", this.handleScroll);
	}
	render() {
		let bottomTotalPrice = 0;
		let itemNum = 0;
		const { cloneItemList, maxNum, deleteLoading, isScroll, isShowMore } = this.state;
		const { t, i18n: { language }, itemInfo, handleCloseDeleteModal } = this.props;
		let deleteList = [];
		getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name;
		const showFoodList = (0, import_cloneDeep.default)(cloneItemList);
		if (showFoodList.length) if (itemInfo.itemType == "SALE_ITEM" || itemInfo?.comboType == "FIXED_SELECTION") deleteList = showFoodList.map((item, idx) => {
			const isHasDiscount = Number(item.discount || 0) > 0;
			itemNum += item.quantity;
			let itemTotalPrice = Big(getItemPrice(item)).minus(item.discount || 0).toFixed(2);
			bottomTotalPrice = Big(bottomTotalPrice).plus(Big(itemTotalPrice).times(item.quantity)).toFixed(2);
			const isAddDisabled = item.quantity >= maxNum || isHasDiscount;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: chooseDeleteOrder_module_default.itemBox,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: chooseDeleteOrder_module_default.itemName,
						children: item.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: chooseDeleteOrder_module_default.itemLeft,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: chooseDeleteOrder_module_default.opt,
								dangerouslySetInnerHTML: { __html: this.orderDetailWriter(item) }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: chooseDeleteOrder_module_default.price,
								children: ["$", itemTotalPrice]
							}),
							item?.remark?.optionName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: chooseDeleteOrder_module_default.note,
								children: item.remark.optionName
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: chooseDeleteOrder_module_default.calcBox,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
								"aria-label": "Remove",
								className: chooseDeleteOrder_module_default.btnEn,
								onClick: () => {
									this.handleAddSubNum(item, true);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: chooseDeleteOrder_module_default.muiDiyIcon })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: chooseDeleteOrder_module_default.qty,
								children: item.quantity
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
								disabled: isAddDisabled,
								"aria-label": "Add",
								className: isAddDisabled ? chooseDeleteOrder_module_default.btnDis : `${chooseDeleteOrder_module_default.btnEn} animate-btn`,
								onClick: () => {
									this.handleAddSubNum(item);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: chooseDeleteOrder_module_default.muiDiyIcon })
							})
						]
					})
				]
			}, item.id + "_" + idx);
		});
		else {
			showFoodList.forEach((clone) => {
				const OptList = clone.sectionDetail.find((c) => c.id == -2);
				const cateOptList = clone.sectionDetail.find((c) => c.id == -3);
				if (cateOptList) if (OptList) {
					let idx = clone.sectionDetail.findIndex((c) => c.id == -3);
					OptList.options.push(...cateOptList.options);
					clone.sectionDetail.splice(idx, 1);
				} else cateOptList.id = -2;
			});
			deleteList = showFoodList.map((item, index) => {
				let comboList = [];
				itemNum += item.quantity;
				let itemTotalPrice = Big(getItemPrice(item)).toFixed(2);
				bottomTotalPrice = Big(bottomTotalPrice).plus(Big(itemTotalPrice).times(item.quantity)).toFixed(2);
				if (item.sectionDetail && item.sectionDetail.length) comboList = item.sectionDetail.map((sct, idx) => {
					if (sct.id == -1) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: chooseDeleteOrder_module_default.sizePrice,
						children: [
							getItemSizeName(sct.sizeInfo.sizeId, sct.sizeInfo.size, this.props.itemSizeList, this.props.i18n.language),
							"($",
							sct.sizeInfo.price,
							")"
						]
					}, sct.id + "_" + idx);
					else if (sct.id == -2 && sct.options?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: chooseDeleteOrder_module_default.sidenavBox,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: chooseDeleteOrder_module_default.sidenavTitle,
							children: [t("item_option"), ":"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: chooseDeleteOrder_module_default.comboItemBox,
							children: this.showCategoryOptions(sct.options)
						})]
					}, sct.id + "_" + idx);
					else if (sct.id > 0) {
						let sideNavName = "";
						const sideNav = item.comboSections.find((com) => com.id == sct.id);
						if (sideNav) sideNavName = sideNav?.fieldDisplayNameGroups?.length && getCurrentItemLanguage(sideNav.fieldDisplayNameGroups, language) || sideNav.name;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: chooseDeleteOrder_module_default.sidenavBox,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: chooseDeleteOrder_module_default.sidenavTitle,
								children: [sideNavName, ":"]
							}), sct.items.map((combo, sId) => {
								const comboName = combo?.fieldDisplayNameGroups?.length && getDishItemLanguage(combo.fieldDisplayNameGroups, language) || combo.name;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: chooseDeleteOrder_module_default.comboBox,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: chooseDeleteOrder_module_default.itemLeft,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: chooseDeleteOrder_module_default.comboItemBox,
											children: [
												comboName,
												combo.selectedOptionList?.length ? ": " + this.showCollectOptions(combo.selectedOptionList) : null,
												combo.remark && combo.remark.optionName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: chooseDeleteOrder_module_default.note,
													children: combo.remark.optionName
												})
											]
										}, combo.id + "_" + sId)
									})
								}, combo.id + "_" + sId);
							})]
						}, sct.id + "_" + idx);
					}
				});
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: chooseDeleteOrder_module_default.comboDeleteList,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: chooseDeleteOrder_module_default.itemName,
							children: item.name
						}),
						comboList,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: chooseDeleteOrder_module_default.price,
							children: ["$", itemTotalPrice]
						}),
						item?.remark?.optionName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: chooseDeleteOrder_module_default.note,
							children: item.remark.optionName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: chooseDeleteOrder_module_default.calcBox,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									"aria-label": "Remove",
									className: chooseDeleteOrder_module_default.btnEn,
									onClick: () => {
										this.handleAddSubNum(item, true);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: chooseDeleteOrder_module_default.muiDiyIcon })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: chooseDeleteOrder_module_default.qty,
									children: item.quantity
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: item.quantity >= maxNum,
									"aria-label": "Add",
									className: item.quantity < maxNum ? `${chooseDeleteOrder_module_default.btnEn} animate-btn` : chooseDeleteOrder_module_default.btnDis,
									onClick: () => {
										this.handleAddSubNum(item);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: chooseDeleteOrder_module_default.muiDiyIcon })
								})
							]
						})
					]
				}, item.id + "_" + index);
			});
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: chooseDeleteOrder_module_default.deleteContainer,
			onClick: handleCloseDeleteModal,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: chooseDeleteOrder_module_default.deleteBox,
				onClick: (e) => e.stopPropagation(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: chooseDeleteOrder_module_default.deleteList,
					ref: (el) => this.scrollDom = el,
					children: deleteList
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: chooseDeleteOrder_module_default.deleteBottom,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: chooseDeleteOrder_module_default.cartIcon,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: cart_bag_default,
							className: `${chooseDeleteOrder_module_default.cart}`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: chooseDeleteOrder_module_default.count,
							children: itemNum
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `${chooseDeleteOrder_module_default.addCart} linear-animate-btn`,
						onClick: this.handleConfirm,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("confirm") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: chooseDeleteOrder_module_default.price,
							children: ["$", bottomTotalPrice]
						})]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(deleteDishModal_default, {
				isShowModal: deleteLoading,
				handleContinue: this.handleContinue,
				handleCancel: this.handleCancel
			})]
		});
	}
};
function mapStateToProps$2(state) {
	return {
		currentOrder: state.currentOrder,
		itemSizeList: state.itemSizeList,
		menuItemList: state.menuItemList,
		crm: state.crm,
		promotion: state.promotion,
		currentOrderCombo: state.currentOrderCombo
	};
}
var chooseDeleteOrder_default = connect(mapStateToProps$2, {
	deleteAllById,
	spliceOrderItemAction
})(withTranslation()(ChooseDeleteOrder));
//#endregion
//#region source-snapshot/src/container/orderPage/currentItemList/DishRow.js
var import_debounce = /* @__PURE__ */ __toESM(require_debounce());
var DishRow = (props) => {
	const { cate, getCurrentItemQty, handleClickItem, handleReduceItem, colNum, promotion, cardRowKey, onCardHeightChange } = props;
	const itemRef = (0, import_react.useRef)();
	let visibleColumnIndex = 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: itemRef,
		className: currentItemList_module_default.cateBox,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: currentItemList_module_default.itemListInner,
			children: cate.saleItems?.map((itemInfo, itemIndex) => {
				itemInfo.remark = {
					optionName: "",
					optionType: "NOTE",
					quantity: 1,
					price: 0
				};
				const { isFreeItem, id, oId } = itemInfo;
				const itemQty = getCurrentItemQty({
					itemId: isFreeItem ? oId : id,
					isFreeItem
				});
				if (!itemInfo.hiddenItem || itemInfo.hiddenItem && itemInfo.isFreeItem) {
					const isSoldoutMark = itemIsSoldOut(itemInfo);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: getCardColumnStyle(colNum, visibleColumnIndex++),
						children: /* @__PURE__ */ (0, import_react.createElement)(itemCard_default, {
							...props,
							isThumbPath: true,
							key: itemInfo.id,
							itemInfo,
							itemQty,
							onClick: () => {
								handleClickItem(itemInfo);
							},
							onQtyClicked: () => {
								handleReduceItem(itemInfo);
							},
							isInFreeItem: itemInfo.isFreeItem,
							isSoldoutMark,
							onCardHeightChange: (height) => onCardHeightChange?.({
								rowKey: cardRowKey,
								itemIndex,
								height
							})
						})
					}, itemInfo.id);
				}
			})
		})
	}, cate.id);
};
//#endregion
//#region source-snapshot/src/hooks/useLayoutWidth.js
function useLayoutWidth(ref) {
	const [size, setSize] = (0, import_react.useState)({ width: 0 });
	(0, import_react.useLayoutEffect)(() => observeLayoutSize(ref.current, (width) => setSize({ width })), [ref]);
	return size.width;
}
var index_module_default$1 = {
	promotionDealWrap: "promotionDealWrap___ufhb9",
	dealHeader: "dealHeader___5S-ux",
	dealText: "dealText___6zHCZ",
	dealItemMore: "dealItemMore___FbZ-T",
	dealItemList: "dealItemList___0WYI5",
	dealItem: "dealItem___x-Jne",
	dealItemInfo: "dealItemInfo___0stkD",
	dealItemTag: "dealItemTag___TSCUD",
	dealItemText: "dealItemText___Rzv7t",
	dealItemTitle: "dealItemTitle___Nv1N0",
	dealItemTips: "dealItemTips___YDQt2",
	dealItemArrow: "dealItemArrow___d3-pv",
	dealItemListNoLimit: "dealItemListNoLimit___z5XE9",
	dealItemListCol3: "dealItemListCol3___BLAtN",
	dealItemListCol2: "dealItemListCol2___mXf0c"
};
var index_module_default = {
	orderDiscountInfo: "orderDiscountInfo___Q-r9r",
	closeIcon: "closeIcon___YwiDW",
	discountListWrap: "discountListWrap___UM5t7",
	headerText: "headerText___oqvr6",
	PROMOTIONTAG: "PROMOTIONTAG___yEuKA",
	discountList: "discountList___BZvRH",
	discountGroup: "discountGroup___U0Zij",
	groupTitle: "groupTitle___OGV7A",
	discountItem: "discountItem___2OmN6"
};
//#endregion
//#region source-snapshot/src/component/OrderDiscountInfo/index.js
var OrderDiscountInfo = (props) => {
	const { data, setDetailVisible, promotionType, promotionItem } = props;
	const { t } = useTranslation();
	const normalizedData = (0, import_react.useMemo)(() => {
		if (promotionItem) return Array.isArray(promotionItem) ? promotionItem : [promotionItem];
		if (promotionType && data) return data.filter((item) => item?.promotionType === promotionType);
		if (!data) return [];
		return Array.isArray(data) ? data : [data];
	}, [
		data,
		promotionType,
		promotionItem
	]);
	const totalAmountQuantityDiscountList = (0, import_react.useMemo)(() => {
		return normalizedData.filter((item) => item?.promotionType === "totalAmountQuantityDiscount");
	}, [normalizedData]);
	const amountGiftItemList = (0, import_react.useMemo)(() => {
		return normalizedData.filter((item) => item?.promotionType === "amountGiftItem");
	}, [normalizedData]);
	const quantityItemDiscountList = (0, import_react.useMemo)(() => {
		return normalizedData.filter((item) => item?.promotionType === "quantityItemDiscount");
	}, [normalizedData]);
	const orderItemGiftItemList = (0, import_react.useMemo)(() => {
		return normalizedData.filter((item) => item?.promotionType === "orderItemGiftItem");
	}, [normalizedData]);
	const orderItemChangeItemList = (0, import_react.useMemo)(() => {
		return normalizedData.filter((item) => item?.promotionType === "orderItemChangeItem");
	}, [normalizedData]);
	const orderItemFixedPriceList = (0, import_react.useMemo)(() => {
		return normalizedData.filter((item) => item?.promotionType === "orderItemFixedPrice");
	}, [normalizedData]);
	const newMemberList = (0, import_react.useMemo)(() => {
		return normalizedData.filter((item) => item?.promotionType === "newMember");
	}, [normalizedData]);
	const exchangePurchaseGroups = (0, import_react.useMemo)(() => {
		const groups = /* @__PURE__ */ new Map();
		normalizedData.filter((item) => item?.promotionType === "exchangePurchase").forEach((item) => {
			const { conditionType, satisfyPrice } = item?.activityRule || {};
			const isOrderAmount = conditionType === "orderAmount";
			if (!isOrderAmount && conditionType !== "itemQuantity") return;
			const type = isOrderAmount ? `exchangeOrderDeal-${satisfyPrice}` : "exchangeItemDeal";
			const currentGroup = groups.get(type) || {
				list: [],
				type,
				title: isOrderAmount ? t("exchangeOrderDealTitle", { price: satisfyPrice }) : t("exchangeItemDealTitle"),
				forceGroup: true
			};
			currentGroup.list.push(item);
			groups.set(type, currentGroup);
		});
		return Array.from(groups.values());
	}, [normalizedData, t]);
	const arrays = (0, import_react.useMemo)(() => {
		return [
			{
				list: totalAmountQuantityDiscountList,
				type: "totalAmountQuantityDiscount"
			},
			{
				list: amountGiftItemList,
				type: "amountGiftItem"
			},
			{
				list: quantityItemDiscountList,
				type: "quantityItemDiscount"
			},
			{
				list: orderItemGiftItemList,
				type: "orderItemGiftItem"
			},
			{
				list: orderItemChangeItemList,
				type: "orderItemChangeItem"
			},
			...exchangePurchaseGroups,
			{
				list: orderItemFixedPriceList,
				type: "orderItemFixedPrice"
			},
			{
				list: newMemberList,
				type: "newMember"
			}
		];
	}, [
		totalAmountQuantityDiscountList,
		amountGiftItemList,
		quantityItemDiscountList,
		orderItemGiftItemList,
		orderItemChangeItemList,
		exchangePurchaseGroups,
		orderItemFixedPriceList,
		newMemberList
	]);
	const promotionHeader = (0, import_react.useMemo)(() => {
		const arraysWithData = arrays.filter(({ list }) => list.length > 0);
		if (arraysWithData.length === 1) return arraysWithData[0].title || t(`${arraysWithData[0].type}_title`);
		return t("allDeal_title");
	}, [arrays, t]);
	const groupedData = (0, import_react.useMemo)(() => {
		const result = [];
		let globalIndex = 1;
		arrays.forEach(({ list, type, title, forceGroup }) => {
			if (list.length === 0) return;
			if (forceGroup || list.length > 1 || list.length === 1 && Array.isArray(list[0]?.text) && list[0].text.length > 1) {
				result.push({
					type: "group",
					title: title || t(`${type}_title`),
					promotionType: type,
					index: globalIndex++
				});
				let subItemIndex = 0;
				list.forEach((item, idx) => {
					const text = item?.text;
					if (Array.isArray(text)) text.forEach((textItem) => {
						const letterIndex = String.fromCharCode(97 + subItemIndex);
						result.push({
							type: "item",
							text: textItem,
							index: letterIndex,
							promotionType: type
						});
						subItemIndex++;
					});
					else {
						const letterIndex = String.fromCharCode(97 + subItemIndex);
						result.push({
							type: "item",
							text,
							index: letterIndex,
							promotionType: type
						});
						subItemIndex++;
					}
				});
			} else {
				const text = list[0]?.text;
				if (Array.isArray(text)) text.forEach((textItem, textIdx) => {
					result.push({
						type: "item",
						text: textItem,
						index: globalIndex++,
						promotionType: type,
						isSingleItem: true
					});
				});
				else result.push({
					type: "item",
					text,
					index: globalIndex++,
					promotionType: type,
					isSingleItem: true
				});
			}
		});
		return result;
	}, [arrays, t]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: index_module_default.orderDiscountInfo,
		onClick: (e) => e.stopPropagation(),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: close_default,
			alt: "close",
			className: index_module_default.closeIcon,
			onClick: () => setDetailVisible(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index_module_default.discountListWrap,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: index_module_default.headerText,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: promotion_tag_default,
					alt: "PROMOTIONTAG",
					className: index_module_default.PROMOTIONTAG
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: promotionHeader })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: index_module_default.discountList,
				children: groupedData.map((item, idx) => {
					if (item.type === "group") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: index_module_default.discountGroup,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: index_module_default.groupTitle,
							children: [
								item.index,
								". ",
								item.title
							]
						})
					}, `group-${item.promotionType}-${idx}`);
					if (item.isSingleItem) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: index_module_default.discountGroup,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: index_module_default.groupTitle,
							children: [
								item.index,
								". ",
								item.text
							]
						})
					}, `item-${item.promotionType}-${idx}`);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: index_module_default.discountItem,
						children: [
							item.index,
							". ",
							item.text
						]
					}, `item-${item.promotionType}-${idx}`);
				})
			})]
		})]
	});
};
//#endregion
//#region source-snapshot/src/component/PromotionDealList/index.js
var initLocalPromotionDrawerState = {
	visible: false,
	info: null
};
var PromotionDealList = (props) => {
	const { promotion: { cloudPromotion, orderDiscount, buyGiftRule, buyDiscountRule, exchangePurchaseRule, promotionCenterList, promotionCenterMetas }, selfConfig, currentOrder, menuGroup, menuItemList, merchantProfile, allSysConfig, addCampaignItemsToOrder } = props;
	const { orderType, itemList } = currentOrder;
	const { t } = useTranslation();
	const selectTips = {
		part: t("promotion-select-part-item"),
		all: t("promotion-select-all"),
		allMember: t("promotion-select-member-item")
	};
	const { handleCheckIsHasCampaign } = useCrmPromotionContrary();
	const [detailVisible, setDetailVisible] = (0, import_react.useState)(false);
	const [dealItemInfo, setDealItemInfo] = (0, import_react.useState)(null);
	const [localPromotionDrawerState, setLocalPromotionDrawerState] = (0, import_react.useState)(initLocalPromotionDrawerState);
	const { drawerProps, goAddOnPromotion, handleDrawerConfirm, handleCloseDrawer } = useAddOnPromotion({ promotionCenterList });
	const isCRMEnable = (0, import_react.useMemo)(() => {
		if (allSysConfig && Object.keys(allSysConfig).length) return !checkCRMStatus(allSysConfig);
		return false;
	}, [allSysConfig]);
	const localPromotionCategoryList = (0, import_react.useMemo)(() => {
		if (!orderType) return [];
		return getValidCategoryList((menuGroup || []).filter((group) => !group.isFreeItemMenu && group.id !== "promotion-deals-list"), orderType, false);
	}, [menuGroup, orderType]);
	const localPromotionItemList = (0, import_react.useMemo)(() => {
		if (!orderType) return [];
		const info = localPromotionDrawerState.info;
		const activityRule = info?.activityRule || {};
		const itemIds = info?.localDrawerMode === "exchangeReward" ? activityRule.giftsDishes || [] : activityRule.buyDishes || [];
		if (!itemIds.length) return [];
		return localPromotionCategoryList.flatMap((category) => (category.saleItems || []).map((item) => ({
			...item,
			categoryId: item.categoryId ?? category.id
		}))).filter((item) => {
			if (!item) return false;
			if (itemIds.includes(item.id)) return true;
			return item.comboSections?.some((section) => itemIds.includes(`${item.id}${section.id}`));
		}).map((item) => {
			if (info?.localDrawerMode !== "exchangeReward") return item;
			const prices = getExchangePurchaseDisplayPrices({
				item,
				rule: info.promotion,
				currentOrder,
				categoryList: localPromotionCategoryList
			});
			return {
				...item,
				exchangePurchaseOriginalPrice: Number(prices.originalPrice),
				specialPrice: Number(prices.discountedPrice),
				isLocalExchangePurchaseItem: true,
				exchangePurchaseRuleId: info.promotion.id,
				exchangePurchaseRule: info.promotion
			};
		});
	}, [
		currentOrder,
		localPromotionCategoryList,
		localPromotionDrawerState.info,
		orderType
	]);
	const localPromotionDrawerValue = (0, import_react.useMemo)(() => {
		const info = localPromotionDrawerState.info;
		return (info?.localDrawerMode === "exchangeReward" ? itemList?.filter((item) => item.isLocalExchangePurchaseItem && item.exchangePurchaseRuleId === info.promotion?.id) : itemList)?.map((item) => ({
			...item,
			uniqueItemTempId: v4()
		})) || [];
	}, [itemList, localPromotionDrawerState.info]);
	const handleCloseLocalPromotionDrawer = (0, import_react.useCallback)(() => {
		setLocalPromotionDrawerState(initLocalPromotionDrawerState);
	}, []);
	const localPromotionDrawerProps = (0, import_react.useMemo)(() => {
		const displayName = Array.isArray(localPromotionDrawerState.info?.text) ? localPromotionDrawerState.info?.text?.[0] : localPromotionDrawerState.info?.text;
		return {
			open: localPromotionDrawerState.visible,
			displayName,
			activityInfo: localPromotionDrawerState.info?.localDrawerMode === "exchangeReward" ? {
				type: "localExchangePurchase",
				activityRule: [localPromotionDrawerState.info?.activityRule || {}]
			} : void 0,
			itemList: localPromotionItemList,
			value: localPromotionDrawerValue,
			max: localPromotionDrawerState.info?.localDrawerMode === "exchangeReward" ? Number(localPromotionDrawerState.info?.activityRule?.giftsNumber || 1) : 9999,
			drawerType: localPromotionDrawerState.info?.localDrawerMode === "exchangeReward" ? "reward" : "addon",
			isPromotionSelection: localPromotionDrawerState.info?.localDrawerMode === "exchangeReward",
			isExchangePurchase: localPromotionDrawerState.info?.localDrawerMode === "exchangeReward",
			showHiddenItems: localPromotionDrawerState.info?.localDrawerMode === "exchangeReward"
		};
	}, [
		localPromotionDrawerState,
		localPromotionItemList,
		localPromotionDrawerValue,
		t
	]);
	const getOrderRedeemItem = (0, import_react.useCallback)((info) => {
		const condition = info.conditions[0];
		const benefitCondition = info.benefits[0]?.condition;
		const range = condition["order/totalAmount"];
		const count = benefitCondition.maxNum;
		let price = `$${range["gt*"]}+`;
		if (Object.keys(range).length === 2) price = `$${range["gt*"]}-$${range["lt*"]}`;
		return {
			text: t("redeemItemInfo", {
				price,
				count
			}),
			commercialType: "all",
			promotionType: "amountGiftItem"
		};
	}, [t]);
	const oldCloudPromotionList = (0, import_react.useMemo)(() => {
		const actualType = {
			TO_GO: "TOGO",
			DINE_IN: "DINE_IN",
			PICK_UP: "PICKUP"
		}[orderType];
		return cloudPromotion.filter((each) => each.type === "WholeOrderGift" && each.conditions[0]["order/orderType"]?.includes(actualType)).map((info) => getOrderRedeemItem(info));
	}, [
		cloudPromotion,
		orderType,
		getOrderRedeemItem
	]);
	const kioskOrderDiscountList = (0, import_react.useMemo)(() => {
		return (orderDiscount?.filter((each) => (each?.activityRule?.isFirstOrderDiscount === "1" && isCRMEnable || each?.activityRule?.isFirstOrderDiscount !== "1") && each?.activityRule?.usePromotionCode !== "1")).map((row) => {
			const { activityRule } = row;
			const { satisfyPrice, discountType, discountNumber, isFirstOrderDiscount } = activityRule;
			const isFixed = discountType === "fixDiscount";
			const discountNumberStr = `${isFixed ? "$" : ""}${discountNumber}${!isFixed ? "%" : ""}`;
			let content = null;
			if (isFirstOrderDiscount === "1") content = Number(satisfyPrice) > 0 ? t("firstOrder_threshold", {
				satisfyPrice,
				discountNumber: discountNumberStr
			}) : t("firstOrder_no_threshold", { discountNumber: discountNumberStr });
			else content = Number(satisfyPrice) > 0 ? t("discountItemInfo", {
				price: satisfyPrice,
				discountNumber: discountNumberStr
			}) : t("discountWithZeroPrice", { discountNumber: `${isFixed ? "$" : ""}${discountNumber}${!isFixed ? "%" : ""}` });
			const promotionType = row?.activityRule?.isFirstOrderDiscount === "1" ? "newMember" : "totalAmountQuantityDiscount";
			return {
				text: getPromotionActivityDisplayText({
					defaultText: content,
					activityName: row.activityName,
					activityLabel: row.activityLabel,
					selfConfig
				}),
				commercialType: "all",
				isLocalPromotion: true,
				promotionType
			};
		});
	}, [
		orderDiscount,
		isCRMEnable,
		t,
		selfConfig
	]);
	const kioskBuyDiscountlist = (0, import_react.useMemo)(() => {
		return buyDiscountRule.map((discountInfo) => {
			const { activityRule: { giftsDiscount, buyNumber, giftsDiscountRule, buyType } } = discountInfo;
			const isIdenticalBuyType = buyType === "identical";
			const isEachItemQty = Number(buyNumber) === 1;
			const buyNumberStr = native_i18n_default.language === "en" ? formatOrdinals(buyNumber + "") : buyNumber + "";
			return {
				text: getPromotionActivityDisplayText({
					defaultText: giftsDiscountRule !== "1" ? isEachItemQty ? t("secondDiscountEach", { value: giftsDiscount }) : t(isIdenticalBuyType ? "secondDiscountIdentical" : "secondDiscount", {
						value: giftsDiscount,
						quantity: buyNumberStr
					}) : t(isIdenticalBuyType ? "overDiscountIdentical" : "overDiscount", {
						value: giftsDiscount,
						quantity: buyNumber
					}),
					activityName: discountInfo.activityName,
					activityLabel: discountInfo.activityLabel,
					selfConfig
				}),
				isLocalPromotion: true,
				commercialType: "part",
				activityRule: discountInfo.activityRule,
				promotionType: "quantityItemDiscount"
			};
		});
	}, [
		buyDiscountRule,
		t,
		selfConfig
	]);
	const kioskBuyGiftList = (0, import_react.useMemo)(() => {
		return buyGiftRule?.map((giftInfo) => {
			const { activityRule: { buyNumber, giftsNumber } } = giftInfo;
			return {
				text: getPromotionActivityDisplayText({
					defaultText: t("buy-x-give-n", {
						buyNumber,
						giftsNumber
					}),
					activityName: giftInfo.activityName,
					activityLabel: giftInfo.activityLabel,
					selfConfig
				}),
				commercialType: "part",
				isLocalPromotion: true,
				activityRule: giftInfo.activityRule,
				promotion: giftInfo,
				localDrawerMode: "trigger",
				promotionType: "orderItemGiftItem"
			};
		});
	}, [
		buyGiftRule,
		t,
		selfConfig
	]);
	const kioskExchangePurchaseList = (0, import_react.useMemo)(() => {
		return exchangePurchaseRule?.map((rule) => {
			const { activityRule } = rule;
			const discount = activityRule.discountType === "fixDiscount" ? `$${activityRule.discountNumber}` : `${activityRule.discountNumber}%`;
			return {
				title: getPromotionActivityDisplayText({
					defaultText: t(activityRule.conditionType === "orderAmount" ? "exchangeOrderDealTitle" : "exchangeItemDealTitle", { price: activityRule.satisfyPrice }),
					activityName: rule.activityName,
					activityLabel: rule.activityLabel,
					selfConfig
				}),
				text: getPromotionActivityDisplayText({
					defaultText: t(activityRule.conditionType === "orderAmount" ? "exchangeOrderDeal" : "exchangeItemDeal", {
						price: activityRule.satisfyPrice,
						buyNumber: activityRule.buyNumber,
						giftsNumber: activityRule.giftsNumber,
						giftsTypeLabel: t(activityRule.giftsType),
						discount
					}),
					activityName: rule.activityName,
					activityLabel: rule.activityLabel,
					selfConfig
				}),
				commercialType: "part",
				isLocalPromotion: true,
				promotionType: "exchangePurchase",
				promotion: rule,
				activityRule,
				localDrawerMode: activityRule.conditionType === "orderAmount" ? "exchangeReward" : "trigger"
			};
		});
	}, [
		exchangePurchaseRule,
		t,
		selfConfig
	]);
	const [cloudPromotionCenterList, setCloudPromotionCenterList] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const fetchPromotionList = async () => {
			if (!promotionCenterList?.length || !promotionCenterMetas) {
				setCloudPromotionCenterList([]);
				return;
			}
			try {
				const mappedList = (await filterValidPromotionCenterList({
					promotionCenterList,
					promotionCenterMetas,
					allItems: []
				}))?.map((each) => {
					const { activityRule, type, memberScope, promotionName, activityLabel, promotionChineseTag, promotionEnglishTag, ruleExpression: { condition, benefits } } = each;
					let itemFilterType = "";
					if (type === "orderItemGiftItem" || type === "orderItemFixedPrice") itemFilterType = benefits[0]?.condition?.itemFilter?.type;
					else itemFilterType = condition?.itemFilter?.type;
					const commercialType = itemFilterType === "all" || !itemFilterType ? "all" : "part";
					return {
						text: getPromotionCenterActivityRuleText({
							t,
							activityRule,
							type,
							promotionName,
							activityLabel,
							promotionChineseTag,
							promotionEnglishTag,
							selfConfig
						}),
						commercialType,
						memberScope,
						promotionType: type,
						promotion: each
					};
				});
				if (!cancelled) setCloudPromotionCenterList(mappedList || []);
			} catch (error) {
				console.error("获取促销中心活动失败:", error);
				if (!cancelled) setCloudPromotionCenterList([]);
			}
		};
		fetchPromotionList();
		return () => {
			cancelled = true;
		};
	}, [
		promotionCenterList,
		promotionCenterMetas,
		menuItemList,
		orderType,
		merchantProfile?.merchantId,
		t,
		selfConfig
	]);
	const data = (0, import_react.useMemo)(() => {
		return [
			...oldCloudPromotionList || [],
			...kioskOrderDiscountList || [],
			...kioskBuyDiscountlist || [],
			...kioskBuyGiftList || [],
			...kioskExchangePurchaseList || [],
			...cloudPromotionCenterList || []
		];
	}, [
		oldCloudPromotionList,
		kioskOrderDiscountList,
		kioskBuyDiscountlist,
		kioskBuyGiftList,
		kioskExchangePurchaseList,
		cloudPromotionCenterList
	]);
	const checkDealItemInfo = (0, import_react.useCallback)((info) => {
		if (info?.isLocalPromotion && info?.commercialType === "part") {
			handleCloseDrawer();
			setLocalPromotionDrawerState({
				visible: true,
				info
			});
			return;
		}
		if (info?.commercialType === "all") {
			setDealItemInfo(info);
			setDetailVisible(true);
		} else goAddOnPromotion(info, true);
	}, [goAddOnPromotion, handleCloseDrawer]);
	const isTopMenu = (0, import_react.useMemo)(() => {
		return selfConfig?.configMap?.id_33 === 1;
	}, [selfConfig]);
	const isOpenLazyLoad = (0, import_react.useMemo)(() => {
		return selfConfig?.configMap?.id_32;
	}, [selfConfig]);
	const maxDisplayItems = (0, import_react.useMemo)(() => {
		return isTopMenu ? 3 : 2;
	}, [isTopMenu]);
	const isShowMore = (0, import_react.useMemo)(() => {
		return data.length > maxDisplayItems;
	}, [data, maxDisplayItems]);
	const renderItem = (info, index) => {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index_module_default$1.dealItem,
			onClick: () => checkDealItemInfo(info),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: index_module_default$1.dealItemInfo,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: promotion_tag_default,
					alt: "promotionTag",
					className: index_module_default$1.dealItemTag
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: index_module_default$1.dealItemText,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: index_module_default$1.dealItemTitle,
						children: info?.title || (Array.isArray(info?.text) ? info?.text[0] : info?.text)
					}), !info?.isLocalPromotion && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: index_module_default$1.dealItemTips,
						children: selectTips[info?.memberScope === "allMember" ? info?.memberScope : info?.commercialType] || ""
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: arrow_right_default,
				alt: "more",
				className: index_module_default$1.dealItemArrow
			})]
		}, info?.promotion?.id || `${info?.promotionType}-${index}`);
	};
	const beforeSelectItemCheck = () => {
		return !handleCheckIsHasCampaign();
	};
	const getLocalPromotionOrderAmount = (0, import_react.useCallback)(() => {
		return Number((itemList || []).filter((item) => !item.isLocalExchangePurchaseItem).filter((item) => {
			const categoryId = item.oCategoryId || item.categoryId;
			return localPromotionCategoryList.find((category) => category.id === categoryId)?.applicableToTriggerPromotion;
		}).reduce((total, item) => Big(total).plus(Big(getItemPrice(item) || 0).times(item.quantity || 0)), Big(0)).toFixed(2));
	}, [itemList, localPromotionCategoryList]);
	const isLocalAmountExchangeSatisfied = (0, import_react.useCallback)(() => {
		const info = localPromotionDrawerState.info;
		if (info?.localDrawerMode !== "exchangeReward") return true;
		return getSatisfiedExchangePurchaseRules([info.promotion], itemList, getLocalPromotionOrderAmount()).length > 0;
	}, [
		getLocalPromotionOrderAmount,
		itemList,
		localPromotionDrawerState.info
	]);
	const beforeSelectLocalPromotionItem = (0, import_react.useCallback)(() => {
		if (isLocalAmountExchangeSatisfied()) return true;
		toast_default.info(t("exchangePurchaseAmountNotMet", { amount: localPromotionDrawerState.info?.activityRule?.satisfyPrice }));
		return false;
	}, [
		isLocalAmountExchangeSatisfied,
		localPromotionDrawerState.info,
		t
	]);
	const isLocalPromotionDrawerVisible = localPromotionDrawerState.visible;
	const handleCloseAddOnDrawer = (0, import_react.useCallback)(() => {
		if (isLocalPromotionDrawerVisible) {
			handleCloseLocalPromotionDrawer();
			return;
		}
		handleCloseDrawer();
	}, [
		isLocalPromotionDrawerVisible,
		handleCloseLocalPromotionDrawer,
		handleCloseDrawer
	]);
	const handleAddOnDrawerConfirm = (0, import_react.useCallback)(async (items) => {
		if (isLocalPromotionDrawerVisible) {
			const info = localPromotionDrawerState.info;
			if (info?.localDrawerMode === "exchangeReward") {
				if (!isLocalAmountExchangeSatisfied()) {
					beforeSelectLocalPromotionItem();
					return false;
				}
				const normalItems = itemList.filter((item) => !item.isLocalExchangePurchaseItem);
				const exchangeItems = items.map((item) => {
					const normalizedItem = { ...item };
					delete normalizedItem.specialPrice;
					delete normalizedItem.exchangePurchaseOriginalPrice;
					delete normalizedItem.uniqueItemTempId;
					return applyExchangePurchaseDiscount(normalizedItem, info.promotion);
				});
				addCampaignItemsToOrder([...normalItems, ...exchangeItems]);
				handleCloseLocalPromotionDrawer();
				return true;
			}
			if (info?.promotionType === "exchangePurchase") {
				const buyDishes = info.activityRule?.buyDishes || [];
				const taggedItems = items.map((item) => {
					const normalizedItem = { ...item };
					delete normalizedItem.localExchangePurchaseTriggerRuleId;
					if (buyDishes.includes(item.id) || item.comboSections?.some((section) => buyDishes.includes(`${item.id}${section.id}`))) normalizedItem.localExchangePurchaseTriggerRuleId = info.promotion.id;
					return normalizedItem;
				});
				addCampaignItemsToOrder(taggedItems);
			} else addCampaignItemsToOrder(items);
			handleCloseLocalPromotionDrawer();
			return true;
		}
		return handleDrawerConfirm(items);
	}, [
		isLocalPromotionDrawerVisible,
		addCampaignItemsToOrder,
		handleCloseLocalPromotionDrawer,
		handleDrawerConfirm,
		beforeSelectLocalPromotionItem,
		isLocalAmountExchangeSatisfied,
		itemList,
		localPromotionDrawerState.info
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index_module_default$1.promotionDealWrap,
			children: [isOpenLazyLoad && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: index_module_default$1.dealHeader,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: index_module_default$1.dealText,
					children: t("promotion-deals-list")
				}), isShowMore && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: index_module_default$1.dealItemMore,
					onClick: () => {
						setDealItemInfo(null);
						setDetailVisible(true);
					},
					children: [t("see_all"), " →"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `${index_module_default$1.dealItemList} ${!isOpenLazyLoad ? index_module_default$1.dealItemListNoLimit : ""} ${index_module_default$1[`dealItemListCol${maxDisplayItems}`]}`,
				children: (isOpenLazyLoad ? data.slice(0, maxDisplayItems) : data).map((item, index) => renderItem(item, index))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			visible: detailVisible,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderDiscountInfo, {
				data,
				setDetailVisible,
				promotionItem: dealItemInfo
			}),
			onClose: () => setDetailVisible(false),
			isMountOnBody: true
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemsDrawer_default, {
			...isLocalPromotionDrawerVisible ? localPromotionDrawerProps : drawerProps,
			onClose: handleCloseAddOnDrawer,
			handleConfirm: handleAddOnDrawerConfirm,
			beforeSelectItemCheck: isLocalPromotionDrawerVisible ? beforeSelectLocalPromotionItem : beforeSelectItemCheck
		})
	] });
};
function mapStateToProps$1(state) {
	return {
		promotion: state.promotion,
		currentOrder: state.currentOrder,
		menuGroup: state.menuGroup,
		menuItemList: state.menuItemList,
		merchantProfile: state.merchantProfile,
		crm: state.crm,
		allSysConfig: state.allSysConfig,
		selfConfig: state.selfConfig
	};
}
var PromotionDealList_default = connect(mapStateToProps$1, { addCampaignItemsToOrder })(PromotionDealList);
//#endregion
//#region source-snapshot/src/container/orderPage/currentItemList/DishList.js
var selectListPromotion = (state) => ({
	buyDiscountRule: state.promotion.buyDiscountRule,
	buyGiftRule: state.promotion.buyGiftRule,
	exchangePurchaseRule: state.promotion.exchangePurchaseRule,
	itemMatchCloudPromotion: state.promotion.itemMatchCloudPromotion
});
var DishList = (props) => {
	const { t, allCategoryItem, onScroll, listRef, virtualDishListHeight, getCurrentItemLanguage, language, handleShowDesc, isTopMenu, selfConfig, freeListIsExpanded, freeItemMenuPosition, handleExpandToggle, onListReady } = props;
	const listPromotion = useSelector(selectListPromotion, shallowEqual);
	const containerRef = (0, import_react.useRef)(null);
	const containerWidth = useLayoutWidth(containerRef);
	const availableWidth = Math.max(0, containerWidth - remToPx(6));
	const promotionIndex = (0, import_react.useMemo)(() => createItemPromotionIndex(listPromotion), [listPromotion]);
	const isListReadyRef = (0, import_react.useRef)(false);
	const hasItemsRenderedRef = (0, import_react.useRef)(false);
	const previousVirtualDataListRef = (0, import_react.useRef)([]);
	const scrollOffsetRef = (0, import_react.useRef)(0);
	const latestPropsRef = (0, import_react.useRef)(props);
	latestPropsRef.current = props;
	const virtualDataList = (0, import_react.useMemo)(() => {
		if (!allCategoryItem.length) return [];
		return getVirtualListData({
			allCateList: allCategoryItem,
			isTopMenu,
			selfConfig,
			isExpand: freeListIsExpanded,
			freeItemMenuPosition,
			listPromotion,
			promotionIndex,
			availableWidth
		});
	}, [
		allCategoryItem,
		isTopMenu,
		selfConfig,
		freeListIsExpanded,
		freeItemMenuPosition,
		listPromotion,
		promotionIndex,
		availableWidth
	]);
	const count = (0, import_react.useMemo)(() => {
		return virtualDataList?.length || 0;
	}, [virtualDataList]);
	const getItemSize = (0, import_react.useCallback)((index) => {
		return virtualDataList[index]?.height;
	}, [virtualDataList]);
	const virtualRowKeys = (0, import_react.useMemo)(() => getVirtualRowKeys(virtualDataList), [virtualDataList]);
	const virtualDataListRef = (0, import_react.useRef)(virtualDataList);
	const virtualRowKeysRef = (0, import_react.useRef)(virtualRowKeys);
	virtualDataListRef.current = virtualDataList;
	virtualRowKeysRef.current = virtualRowKeys;
	const handleCardHeightChange = (0, import_react.useCallback)(({ rowKey, itemIndex, height }) => {
		const rowIndex = virtualRowKeysRef.current.indexOf(rowKey);
		if (rowIndex < 0) return;
		const rows = virtualDataListRef.current;
		const row = rows[rowIndex];
		const previousHeight = row.height;
		if (!updateMeasuredItemCardRowHeight({
			row,
			rowIndex,
			itemIndex,
			measuredHeight: height,
			listRef
		})) return;
		if (rows.slice(0, rowIndex).reduce((height, currentRow) => height + currentRow.height, previousHeight) <= scrollOffsetRef.current + .5) {
			const nextOffset = scrollOffsetRef.current + row.height - previousHeight;
			scrollOffsetRef.current = nextOffset;
			listRef?.current?.scrollTo(nextOffset);
		}
	}, [listRef]);
	(0, import_react.useLayoutEffect)(() => {
		if (virtualDataList.length > 0) {
			const previousRows = previousVirtualDataListRef.current;
			const previousScrollOffset = scrollOffsetRef.current;
			const nextScrollOffset = getAnchoredScrollOffset({
				previousRows,
				nextRows: virtualDataList,
				scrollOffset: previousScrollOffset
			});
			listRef?.current?.resetAfterIndex(0);
			if (previousRows.length > 0 && nextScrollOffset !== previousScrollOffset) {
				listRef?.current?.scrollTo(nextScrollOffset);
				scrollOffsetRef.current = nextScrollOffset;
			}
		}
		previousVirtualDataListRef.current = virtualDataList;
	}, [virtualDataList, listRef]);
	const handleItemsRendered = (0, import_react.useCallback)(({ visibleStartIndex, visibleStopIndex }) => {
		if (!hasItemsRenderedRef.current && count > 0) {
			hasItemsRenderedRef.current = true;
			requestAnimationFrame(() => {
				if (listRef?.current && !isListReadyRef.current) {
					isListReadyRef.current = true;
					onListReady && onListReady();
				}
			});
		}
	}, [
		listRef,
		count,
		onListReady
	]);
	(0, import_react.useEffect)(() => {
		if (listRef?.current && count > 0 && !isListReadyRef.current) {
			const timer = setTimeout(() => {
				if (listRef?.current && !isListReadyRef.current) {
					isListReadyRef.current = true;
					onListReady && onListReady();
				}
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [
		listRef,
		count,
		onListReady
	]);
	(0, import_react.useEffect)(() => {
		if (count === 0) {
			isListReadyRef.current = false;
			hasItemsRenderedRef.current = false;
		}
	}, [count]);
	const handleListScroll = (0, import_react.useCallback)((e) => {
		scrollOffsetRef.current = e.scrollOffset ?? 0;
		notifyItemCardListScroll();
		onScroll && onScroll(e);
	}, [onScroll]);
	const listItemData = (0, import_react.useMemo)(() => ({
		virtualDataList,
		virtualRowKeys,
		listPromotion,
		promotionIndex,
		stockRenderDeps: {
			itemList: props.currentOrder?.itemList,
			currentOrderCombo: props.currentOrderCombo,
			menuItemList: props.menuItemList,
			crmSelectedFreeItem: props.crm?.selectedFreeItem,
			crmTempCampaign: props.crm?.tempCampaign
		}
	}), [
		virtualDataList,
		virtualRowKeys,
		listPromotion,
		promotionIndex,
		props.currentOrder?.itemList,
		props.currentOrderCombo,
		props.menuItemList,
		props.crm?.selectedFreeItem,
		props.crm?.tempCampaign
	]);
	const rowRender = (0, import_react.useCallback)(({ index: rowIndex, style, data }) => {
		const cate = data.virtualDataList[rowIndex];
		const latestProps = latestPropsRef.current;
		const { type } = cate;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"data-cate": cate.id,
			"data-group-id": cate.groupId,
			index: rowIndex,
			style,
			children: [
				type === "promotionDealList" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromotionDealList_default, {}),
				type === "cateText" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: currentItemList_module_default.cateText,
					children: lineBreakTransfer(getCurrentItemLanguage(cate.fieldDisplayNameGroups, language) || cate.name)
				}),
				type === "cateDesc" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: currentItemList_module_default.descContainer,
					onClick: () => handleShowDesc(cate),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: currentItemList_module_default.innerDesc,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: [currentItemList_module_default.descText, currentItemList_module_default.overflowSign].join(" "),
							children: cate.description
						})
					})
				}),
				type === "cateList" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DishRow, {
					...latestProps,
					promotion: data.listPromotion,
					promotionIndex: data.promotionIndex,
					cate,
					colNum: cate.colNum,
					cardRowKey: data.virtualRowKeys[rowIndex],
					onCardHeightChange: handleCardHeightChange
				}),
				type === "expendButton" && !freeListIsExpanded && freeItemMenuPosition === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: currentItemList_module_default.expandButtonContainer,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: currentItemList_module_default.expandButton,
						onClick: () => handleExpandToggle(),
						children: t("moreFreeItem")
					})
				}),
				type === "emptyBox" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomToast, {})
			]
		}, data.virtualRowKeys[rowIndex]);
	}, [
		language,
		freeListIsExpanded,
		freeItemMenuPosition,
		getCurrentItemLanguage,
		handleShowDesc,
		handleExpandToggle,
		handleCardHeightChange,
		t
	]);
	const itemKey = (0, import_react.useCallback)((index, data) => data.virtualRowKeys[index], []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VariableSizeList, {
		className: "v_dishList",
		width: isTopMenu ? "100vw" : "calc(100vw - 32rem)",
		height: virtualDishListHeight,
		itemCount: count,
		itemSize: getItemSize,
		itemKey,
		ref: listRef,
		outerRef: containerRef,
		onScroll: handleListScroll,
		onItemsRendered: handleItemsRendered,
		itemData: listItemData,
		style: { overflowX: "hidden" },
		overscanCount: 1,
		children: rowRender
	});
};
var DishList_default = (0, import_react.memo)(DishList);
var oldDishList_module_default = {
	itemListContainer: "itemListContainer___5zv-Y",
	descContainer: "descContainer___EtCGH",
	innerDesc: "innerDesc___CO9Wa",
	descText: "descText___PHVnc",
	overflowSign: "overflowSign___RP6X8",
	itemListInner: "itemListInner___qCsrA",
	virtualItemListContainer: "virtualItemListContainer___ryCEu",
	virtualRow: "virtualRow___eA07E"
};
//#endregion
//#region source-snapshot/src/container/orderPage/oldDIshList/index.js
var VIRTUAL_CATEGORY_MIN_ITEMS = 100;
var CategoryOuter = import_react.forwardRef((props, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	...props,
	id: "itemListContainerId",
	ref
}));
var CategoryRow = ({ index, style, data }) => {
	const row = data.rows[index];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style,
		children: [
			row.type === "cateDesc" && data.description,
			row.type === "cateList" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: oldDishList_module_default.virtualRow,
				children: row.saleItems.map((item, itemIndex) => data.renderCard(item, itemIndex, data.keys[index]))
			}),
			row.type === "emptyBox" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomToast, {})
		]
	});
};
var OldDIshList = (props) => {
	const { itemListDom, currentCategory, handleShowDesc, allCategoryItem, getCurrentItemQty, handleClickItem, handleReduceItem, promotion, headerHeight, onListReady } = props;
	const isListReadyRef = (0, import_react.useRef)(false);
	const listRef = (0, import_react.useRef)(null);
	const [container, setContainer] = (0, import_react.useState)(null);
	const containerRef = (0, import_react.useMemo)(() => ({ current: container }), [container]);
	const setOuterRef = (0, import_react.useCallback)((element) => {
		itemListDom.current = element;
		setContainer(element);
	}, [itemListDom]);
	const containerWidth = useLayoutWidth(containerRef);
	const availableWidth = Math.max(0, containerWidth - remToPx(6));
	const colNum = handleCountRowNum({
		selfConfig: props.selfConfig,
		availableWidth,
		isTopMenu: props.isTopMenu
	});
	const saleItems = (0, import_react.useMemo)(() => (allCategoryItem?.find((category) => category.id === currentCategory.id)?.saleItems || []).filter((item) => !item.hiddenItem || item.isFreeItem), [allCategoryItem, currentCategory.id]);
	const isVirtual = currentCategory.id !== "promotion-deals-list" && saleItems.length >= VIRTUAL_CATEGORY_MIN_ITEMS;
	const promotionIndex = (0, import_react.useMemo)(() => createItemPromotionIndex(promotion), [promotion]);
	const previousRows = (0, import_react.useRef)([]);
	const previousCategory = (0, import_react.useRef)(null);
	const scrollOffset = (0, import_react.useRef)(0);
	const rows = (0, import_react.useMemo)(() => {
		if (!isVirtual) return [];
		const result = getVirtualListData({
			allCateList: [{
				...currentCategory,
				hiddenCategory: false,
				saleItems
			}],
			isTopMenu: props.isTopMenu,
			selfConfig: props.selfConfig,
			isExpand: true,
			availableWidth,
			listPromotion: promotion,
			promotionIndex
		}).filter((row) => row.type !== "cateText");
		for (const row of result) if (row.type === "cateList") {
			row.rowSpacing = remToPx(2.6);
			row.height = row.rowSpacing + Math.max(0, ...row.cardEstimatedHeights);
		} else if (row.type === "emptyBox") row.height = remToPx(15);
		const firstCard = result.findIndex((row) => row.type === "cateList");
		result.splice(firstCard, 0, {
			id: currentCategory.id,
			type: "topSpace",
			height: remToPx(2)
		});
		return result;
	}, [
		isVirtual,
		saleItems,
		currentCategory,
		props.selfConfig,
		props.isTopMenu,
		availableWidth,
		promotion,
		promotionIndex
	]);
	const keys = (0, import_react.useMemo)(() => getVirtualRowKeys(rows), [rows]);
	const latestRows = (0, import_react.useRef)({
		rows,
		keys
	});
	latestRows.current = {
		rows,
		keys
	};
	const handleCardHeightChange = (0, import_react.useCallback)((rowKey, itemIndex, height) => {
		const latest = latestRows.current;
		const rowIndex = latest.keys.indexOf(rowKey);
		if (rowIndex < 0) return;
		const row = latest.rows[rowIndex];
		const oldHeight = row.height;
		const oldBottom = latest.rows.slice(0, rowIndex).reduce((sum, entry) => sum + entry.height, oldHeight);
		if (updateMeasuredItemCardRowHeight({
			row,
			rowIndex,
			itemIndex,
			measuredHeight: height,
			listRef
		}) && oldBottom <= scrollOffset.current + .5) {
			scrollOffset.current += row.height - oldHeight;
			listRef.current?.scrollTo(scrollOffset.current);
		}
	}, []);
	(0, import_react.useLayoutEffect)(() => {
		const categoryChanged = previousCategory.current != null && previousCategory.current !== currentCategory.id;
		if (isVirtual) {
			const offset = categoryChanged ? 0 : previousRows.current.length ? getAnchoredScrollOffset({
				previousRows: previousRows.current,
				nextRows: rows,
				scrollOffset: scrollOffset.current
			}) : props.orderPageDomTop || 0;
			listRef.current?.resetAfterIndex(0);
			listRef.current?.scrollTo(offset);
			scrollOffset.current = offset;
		} else if (categoryChanged && itemListDom.current) itemListDom.current.scrollTop = 0;
		previousRows.current = rows;
		previousCategory.current = currentCategory.id;
	}, [
		rows,
		isVirtual,
		currentCategory.id,
		itemListDom,
		props.orderPageDomTop
	]);
	(0, import_react.useEffect)(() => {
		if (container && !isListReadyRef.current) {
			const frame = requestAnimationFrame(() => {
				isListReadyRef.current = saleItems.length > 0;
				onListReady?.();
			});
			return () => cancelAnimationFrame(frame);
		}
	}, [
		container,
		onListReady,
		saleItems,
		currentCategory.id
	]);
	(0, import_react.useEffect)(() => {
		if (saleItems.length === 0) isListReadyRef.current = false;
	}, [saleItems, currentCategory.id]);
	const renderCard = (0, import_react.useCallback)((itemInfo, index, rowKey) => {
		itemInfo.remark = {
			optionName: "",
			optionType: "NOTE",
			quantity: 1,
			price: 0
		};
		const itemQty = getCurrentItemQty({
			itemId: itemInfo.isFreeItem ? itemInfo.oId : itemInfo.id,
			isFreeItem: itemInfo.isFreeItem
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: getCardColumnStyle(colNum, index),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(itemCard_default, {
				...props,
				isThumbPath: true,
				lazyImages: true,
				itemInfo,
				itemQty,
				onClick: () => handleClickItem(itemInfo),
				onQtyClicked: () => handleReduceItem(itemInfo),
				promotionIndex,
				isInFreeItem: itemInfo.isFreeItem,
				isSoldoutMark: itemIsSoldOut(itemInfo),
				onCardHeightChange: rowKey == null ? void 0 : (height) => handleCardHeightChange(rowKey, index, height)
			})
		}, itemInfo.id);
	}, [
		props,
		colNum.count,
		colNum.widthRate,
		getCurrentItemQty,
		handleClickItem,
		handleReduceItem,
		promotionIndex,
		handleCardHeightChange
	]);
	const description = currentCategory.description && currentCategory.description !== "undefined" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: oldDishList_module_default.descContainer,
		onClick: () => handleShowDesc(currentCategory),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: oldDishList_module_default.innerDesc,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: oldDishList_module_default.descText + " " + oldDishList_module_default.overflowSign,
				children: currentCategory.description
			})
		})
	}) : null;
	const itemData = {
		rows,
		keys,
		renderCard,
		description
	};
	if (isVirtual) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VariableSizeList, {
		outerElementType: CategoryOuter,
		ref: listRef,
		outerRef: setOuterRef,
		className: oldDishList_module_default.itemListContainer + " " + oldDishList_module_default.virtualItemListContainer,
		width: "100%",
		height: props.virtualDishListHeight || Math.max(1, window.innerHeight - remToPx(headerHeight)),
		itemCount: rows.length,
		itemSize: (index) => rows[index].height,
		estimatedItemSize: rows.find((row) => row.type === "cateList")?.height,
		itemKey: (index) => keys[index],
		itemData,
		overscanCount: 1,
		initialScrollOffset: props.orderPageDomTop || 0,
		onScroll: ({ scrollOffset: offset }) => {
			scrollOffset.current = offset;
			notifyItemCardListScroll();
		},
		children: CategoryRow
	}, currentCategory.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: { height: "calc(100vh - " + headerHeight + "rem)" },
		id: "itemListContainerId",
		className: oldDishList_module_default.itemListContainer,
		ref: setOuterRef,
		children: [
			description,
			currentCategory.id === "promotion-deals-list" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromotionDealList_default, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: oldDishList_module_default.itemListInner,
				children: saleItems.map((item, index) => renderCard(item, index))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomToast, {})
		]
	});
};
//#endregion
//#region source-snapshot/src/container/orderPage/currentItemList/index.js
var defaultMax = 99;
var CurrentItemList = class extends import_react.Component {
	constructor() {
		super();
		this.state = {
			viewportHeight: window.innerHeight,
			maxNum: defaultMax,
			isShowDeleteModal: false,
			toggleSizePanel: false,
			toggleItemDetailPanel: false,
			selectedItem: {},
			cateDescShow: false,
			description: "",
			scrollTimer: null,
			orderPanelShow: false,
			allCategoryItem: [],
			comboPanelVisible: false,
			isReady: false,
			dishListReady: false,
			oldDishListReady: false
		};
		this.itemListDom = import_react.createRef();
		this.orderDetailModal = import_react.createRef();
	}
	judegCartHasSameDish = (itemInfo) => {
		const { currentOrder: { itemList } } = this.props;
		return !!(itemList.filter((o) => o.id == itemInfo.id).length == 1);
	};
	handleOpenDeleteModal = (e) => {
		this.setState({
			selectedItem: e,
			isShowDeleteModal: true
		}, () => {
			solveScrollElem(true);
		});
	};
	handleCloseDeleteModal = () => {
		this.setState({
			selectedItem: {},
			isShowDeleteModal: false
		}, () => {
			solveScrollElem(false);
		});
	};
	openOrderDetailModal = (ref) => {
		this.orderDetailModal = ref;
	};
	getCurrentItemQty = ({ itemId, isFreeItem }) => {
		const { crm: { selectedFreeItem }, currentOrder: { itemList } } = this.props;
		if (selectedFreeItem?.length > 0 && isFreeItem) {
			const isCurrentItem = selectedFreeItem.find((each) => each.id === itemId);
			if (isCurrentItem) return isCurrentItem?.quantity;
		}
		let itemQty = 0;
		for (let item of itemList) if (isFreeItem) {
			if (item.isFreeItem && item.oId === itemId) itemQty += item.quantity;
		} else if (item.id === itemId) itemQty += item.quantity;
		return itemQty;
	};
	resizeload = (0, import_debounce.default)(() => {
		this.setState({ viewportHeight: window.innerHeight });
	}, 500);
	componentDidMount() {
		on(window, "resize", this.resizeload);
		const { orderPageDomTop } = this.props;
		let el = this.itemListDom.current;
		if (el) orderPageDomTop && (el.scrollTop = orderPageDomTop);
		this.setState({ allCategoryItem: this.props.allMenu.map((each) => each.menuCategories).flat() });
	}
	componentWillUnmount() {
		off(window, "resize", this.resizeload);
		this.resizeload.cancel();
		const { history } = this.props;
		if (history.location.pathname.indexOf("/orderReview") > -1 || history.location.pathname.indexOf("/comboPanel") > -1) {
			let top = Math.floor(this.itemListDom?.current?.scrollTop) || 0;
			this.props.setorderPageDomTop(top);
		} else this.props.setorderPageDomTop(0);
	}
	handleHorizontalScroll = (cateItemWrapper) => {
		const topContainer = document.getElementById("topCategoryList");
		const { getCurrentCategory } = this.props;
		const cateId = cateItemWrapper.getAttribute("data-cate");
		const groupId = cateItemWrapper.getAttribute("data-group-id");
		if (cateId && groupId) {
			getCurrentCategory(isNaN(+cateId) ? cateId : +cateId);
			const topNavs = topContainer.querySelectorAll("[datacategoryid]");
			Array.from(topNavs).find((navItem) => {
				return navItem.getAttribute("datacategoryid") === cateId;
			})?.scrollIntoView({
				behavior: "smooth",
				inline: "center",
				block: "end"
			});
		}
	};
	handleVerticalScroll = (cateItemWrapper) => {
		const leftContainer = document.getElementById("categoryListId");
		const { getCurrentCategory, selfConfig, headerHeight } = this.props;
		const cateId = cateItemWrapper.getAttribute("data-cate");
		const groupId = cateItemWrapper.getAttribute("data-group-id");
		if (cateId && groupId) {
			const t = setTimeout(() => {
				const _cateId = isNaN(+cateId) ? cateId : +cateId;
				getCurrentCategory(_cateId);
				const isShowGroup = selfConfig?.configMap?.id_17;
				const leftNavs = leftContainer.querySelectorAll("[datacategoryid]");
				let scrollNav = null;
				if (!isShowGroup) scrollNav = Array.from(leftNavs).find((navItem) => {
					return navItem.getAttribute("datacategoryid") === cateId;
				});
				else scrollNav = leftContainer?.querySelector(`div[datagroupid="${groupId}"]`)?.querySelector(`div[datacategoryid="${cateId}"]`);
				if (!scrollNav) return clearTimeout(t);
				let { top, height } = scrollNav.getBoundingClientRect();
				const standardTop = remToPx(headerHeight) - remToPx(2);
				const standardBottom = remToPx(20);
				const roundTop = Math.round(top);
				if (roundTop >= standardTop && roundTop <= window.innerHeight - standardBottom) return clearTimeout(t);
				const elCenter = roundTop + height / 2;
				const center = window.innerHeight / 2;
				const countTop = leftContainer.scrollTop - (center - elCenter);
				leftContainer.scrollTo({
					top: countTop,
					behavior: "smooth"
				});
				clearTimeout(t);
			}, 100);
		}
	};
	handleScrollList = (0, import_debounce.default)((e) => {
		this.props.setVListScroll(e.scrollOffset ?? 0);
		if (window.isManualScrolling) return;
		if (window.leftNavTimer) return;
		const cateList = document.getElementsByClassName("v_dishList")[0]?.childNodes[0]?.querySelectorAll("div[index]");
		if (!cateList?.length) return;
		const { isTopMenu, headerHeight } = this.props;
		let areaHeight = remToPx(headerHeight) + 130;
		if (isTopMenu) areaHeight += remToPx(12);
		const groupList = Array.from(cateList);
		let cateItemWrapper = groupList.find((item) => {
			let itemReact = item.getBoundingClientRect();
			return itemReact.y <= areaHeight && itemReact.y + itemReact.height > areaHeight;
		});
		if (!cateItemWrapper) return;
		const emptyCate = cateItemWrapper.getAttribute("data-group-id");
		if (emptyCate === "emptyBox") cateItemWrapper = groupList[groupList.findIndex((cate) => {
			return cate.getAttribute("data-group-id") === emptyCate;
		}) - 1];
		if (cateItemWrapper) if (isTopMenu) this.handleHorizontalScroll(cateItemWrapper);
		else this.handleVerticalScroll(cateItemWrapper);
	}, 80, {
		leading: false,
		trailing: true
	});
	handleDishListReady = () => {
		this.setState({ dishListReady: true }, () => {
			this.checkAndNotifyReady();
		});
	};
	handleOldDishListReady = () => {
		this.setState({ oldDishListReady: true }, () => {
			this.checkAndNotifyReady();
		});
	};
	checkAndNotifyReady = () => {
		const { selfConfig } = this.props;
		const { dishListReady, oldDishListReady, isReady } = this.state;
		const currentListReady = selfConfig?.configList?.find((each) => each.id === 32)?.value ? dishListReady : oldDishListReady;
		if (!isReady && currentListReady) this.setState({ isReady: true }, () => {
			this.props.onReady && this.props.onReady();
		});
	};
	componentDidUpdate(prevProps) {
		const orderTypeChanged = prevProps.currentOrder?.orderType !== this.props.currentOrder?.orderType;
		const allMenuReferenceChanged = prevProps.allMenu !== this.props.allMenu;
		if (orderTypeChanged || allMenuReferenceChanged) this.setState({ allCategoryItem: this.props.allMenu.map((each) => each.menuCategories).flat() });
		if (prevProps.selfConfig?.configList?.find((each) => each.id === 32)?.value !== this.props.selfConfig?.configList?.find((each) => each.id === 32)?.value) this.setState({
			dishListReady: false,
			oldDishListReady: false,
			isReady: false
		});
		if (this.props.currentCategory.id !== prevProps.currentCategory.id) {
			if (this.itemListDom.current) this.itemListDom.current.scrollTop = 0;
		}
	}
	handleShowDesc = (cate) => {
		this.setState({
			cateDescShow: true,
			description: cate.description
		});
	};
	clickItemCardHandler = async (itemInfo) => {
		const { t, currentOrder: { itemList }, crm: { memberCRMInfo, selectedFreeItem }, avocado: { metaData }, promotion, selfConfig, setTempCampaign, changeCrmPromotionContraryInfo, changePromotionStatusAfterCheck } = this.props;
		this.setState({ selectedItem: itemInfo });
		let tempRule = null;
		changePromotionStatusAfterCheck(itemInfo);
		if (itemInfo.isFreeItem) {
			if (Object.keys(memberCRMInfo ?? {}).length === 0) {
				toast_default.info(t("redeem-login-first"), "top");
				EventBus.emit("open_login_modal");
				return;
			}
			if ((memberCRMInfo.pointBalance ?? 0) < itemInfo.itemPoints) {
				toast_default.info(t("noEnoughPoints"));
				return;
			}
			if (itemList.find((item) => item.isFreeItem) || selectedFreeItem?.length > 0) {
				toast_default.info(t("onlyOneFree"));
				return;
			}
			const promotionReward = isHasPromotionFn({
				promotion,
				itemList
			});
			if (promotionReward) {
				changeCrmPromotionContraryInfo({
					visible: true,
					type: "promotion",
					content: promotionReward
				});
				return;
			}
			if (itemInfo.hasOwnProperty("couponTemplate")) {
				const rule = (await checkIsCampaignValid({
					coupons: [(0, import_cloneDeep.default)(itemInfo)],
					metaData
				}))?.[0];
				handleCheckFreeItem({ rule });
				if (!rule.crmIntegrationRule.isValid) return;
				tempRule = rule;
			}
		}
		const hasSelectedPromotion = promotion?.itemValidPromotion?.find((promotion) => promotion?.isSelected);
		if (hasSelectedPromotion && hasSelectedPromotion?.promotion?.type === "orderItemFixedPrice") {
			const specialItemFilters = hasSelectedPromotion?.promotion?.activityRule?.flatMap((item) => item?.specialPriceItemFilters || []) || [];
			if (specialItemFilters.some((itemFilter) => isItemMatchedPromotionFilter(itemInfo, itemFilter))) {
				const quantityLimit = hasSelectedPromotion?.promotion?.activityRule[0]?.quantityLimit;
				if (itemList.filter((item) => specialItemFilters.some((itemFilter) => isItemMatchedPromotionFilter(item, itemFilter)))?.reduce((acc, item) => acc + item.quantity, 0) === quantityLimit) toast_default.info(t("quantity_limit_condition", { value: quantityLimit }));
			}
		}
		if (itemInfo.itemType === "SALE_ITEM") {
			if (tempRule) {
				const { couponTemplate, crmIntegrationRule } = tempRule;
				itemInfo.couponTemplate = couponTemplate;
				itemInfo.crmIntegrationRule = crmIntegrationRule;
			}
			const { isFreeItem, id, oId } = itemInfo;
			const showSimpleDishDetail = selfConfig.configMap.id_61?.status && selfConfig.configMap.id_61?.dishIds?.includes(isFreeItem ? oId : id);
			if (judgeHasDetailInfo(itemInfo) || showSimpleDishDetail) this.setState({ orderPanelShow: true });
			else {
				let { maxNum } = this.state;
				let n = this.getCurrentItemQty({
					itemId: isFreeItem ? oId : id,
					isFreeItem
				});
				if (!isStockSufficient({
					itemInfo,
					addQty: 1,
					itemList: this.props.currentOrder.itemList,
					menuItemList: this.props.menuItemList,
					currentOrderCombo: this.props.currentOrderCombo,
					crm: this.props.crm,
					promotion: this.props.promotion
				})) {
					showInsufficientStockToast(void 0, itemInfo, this.props.menuItemList);
					return;
				}
				if (n >= maxNum) setTimeout(() => {
					toast_default.info(t("max-up", { rplc: defaultMax }));
				}, 0);
				else {
					let cloneItem = (0, import_cloneDeep.default)(itemInfo);
					cloneItem.quantity = 1;
					if (cloneItem.itemPrices?.length === 1) {
						cloneItem.sectionDetail = [{
							id: -1,
							sizeInfo: Object.assign({}, cloneItem.itemPrices[0])
						}];
						cloneItem.price = 0;
					} else cloneItem.sectionDetail = [];
					this.props.addCombo2Order(cloneItem);
					if (itemInfo.isFreeItem) setTempCampaign([cloneItem]);
				}
			}
		} else if (itemInfo?.comboType === "FIXED_SELECTION") this.setState({ orderPanelShow: true });
		else {
			const comboItemData = attachCategoryOptionsToItem(itemInfo, this.props.currentCategoryList);
			this.props.setActivityCurrentItem(comboItemData);
			this.setState({
				selectedItem: comboItemData,
				comboPanelVisible: true
			});
		}
	};
	handleReduceItem = (itemInfo) => {
		const { removeFreeItemInOrder, changeFreeItem, setTempCampaign } = this.props;
		if (itemInfo.isFreeItem) {
			removeFreeItemInOrder({ freeItemId: itemInfo.id });
			changeFreeItem([]);
			setTempCampaign(null);
			return;
		}
		if (this.judegCartHasSameDish(itemInfo)) this.props.removeItemFromOrder(itemInfo.id);
		else this.handleOpenDeleteModal(itemInfo);
	};
	handleExpandToggle = () => {
		const { freeListIsExpanded, setExpandFreeList } = this.props;
		setExpandFreeList(!freeListIsExpanded);
		setTimeout(() => {
			this.props.listRef?.current?.resetAfterIndex(0);
			this.props.listRef?.current?.scrollTo(0);
		}, 0);
	};
	render() {
		const { t, i18n: { language }, listRef, headerHeight, selfConfig, isTopMenu, freeListIsExpanded, crm: { freeItemMenuPosition } } = this.props;
		const { currentCategory, promotion, ...rest } = this.props;
		const { selectedItem, isShowDeleteModal, cateDescShow, description, orderPanelShow, allCategoryItem, comboPanelVisible } = this.state;
		const isOpenLazyLoad = selfConfig?.configList?.find((each) => each.id === 32)?.value;
		let virtualDishListHeight = window.innerHeight - remToPx(headerHeight);
		if (isTopMenu) virtualDishListHeight = virtualDishListHeight - remToPx(12);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [
			isOpenLazyLoad ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DishList_default, {
				...rest,
				getCurrentItemQty: this.getCurrentItemQty,
				getCurrentItemLanguage,
				language,
				selfConfig,
				handleShowDesc: this.handleShowDesc,
				allCategoryItem,
				handleClickItem: this.clickItemCardHandler,
				handleReduceItem: this.handleReduceItem,
				onScroll: this.handleScrollList,
				listRef,
				virtualDishListHeight,
				freeListIsExpanded,
				freeItemMenuPosition,
				handleExpandToggle: this.handleExpandToggle,
				onListReady: this.handleDishListReady
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OldDIshList, {
				...this.props,
				itemListDom: this.itemListDom,
				selfConfig,
				currentCategory,
				getCurrentItemQty: this.getCurrentItemQty,
				handleShowDesc: this.handleShowDesc,
				allCategoryItem,
				handleClickItem: this.clickItemCardHandler,
				handleReduceItem: this.handleReduceItem,
				onListReady: this.handleOldDishListReady,
				virtualDishListHeight
			}),
			orderPanelShow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(orderDetailModal_default, {
				orderPanelShow,
				itemInfo: selectedItem,
				onRef: this.openOrderDetailModal,
				onCloseModal: () => this.setState({ orderPanelShow: false }),
				...selectedItem.isFreeItem ? {
					isInFreeItem: true,
					max: 1
				} : {}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: comboPanelVisible,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboPanel_default, {
					itemInfo: selectedItem?.id ? selectedItem : void 0,
					onCloseModal: () => {
						this.setState({ comboPanelVisible: false });
					},
					...selectedItem.isFreeItem ? {
						isInFreeItem: true,
						max: 1,
						itemPoints: selectedItem.itemPoints
					} : {}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DescViewModal_default, {
				visible: cateDescShow,
				description,
				onClose: () => {
					this.setState({ cateDescShow: false });
				}
			}),
			isShowDeleteModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(chooseDeleteOrder_default, {
				itemInfo: selectedItem,
				handleOpenDeleteModal: this.handleOpenDeleteModal,
				handleCloseDeleteModal: this.handleCloseDeleteModal
			})
		] });
	}
};
function mapStateToProps(state) {
	return {
		currentOrder: state.currentOrder,
		orderPageDomTop: state.orderEdit.orderPageDomTop,
		menuGroup: state.menuGroup,
		freeListIsExpanded: state.freeListIsExpanded,
		categoryList: state.currentCategoryList,
		searchItem: state.searchItem,
		searchKeyWord: state.searchKeyWord,
		brandSetting: state.brandSetting,
		selfConfig: state.selfConfig,
		sideNavList: state.sideNav.sideNavList,
		currentOrderCombo: state.currentOrderCombo,
		currentCategoryList: state.currentCategoryList,
		discount: state.discount,
		currentCategory: state.currentCategory,
		promotion: state.promotion,
		allMenu: state.cateDish.allMenu,
		crm: state.crm,
		avocado: state.avocado,
		menuItemList: state.menuItemList,
		currentOrderCombo: state.currentOrderCombo,
		merchantProfile: state.merchantProfile
	};
}
var currentItemList_default = withRouter(connect(mapStateToProps, {
	getCurrentItem,
	removeItemFromOrder,
	getCurrentCategory,
	addCombo2Order,
	setorderPageDomTop,
	setVListScroll,
	changeFreeItem,
	removeFreeItemInOrder,
	setTempCampaign,
	setExpandFreeList,
	setItemValidPromotion,
	changeCrmPromotionContraryInfo,
	changePromotionStatusAfterCheck,
	setActivityCurrentItem
})(withTranslation()(CurrentItemList)));
//#endregion
export { currentItemList_default as default };
