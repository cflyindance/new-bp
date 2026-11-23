import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { W as removeEmoji, a as getDeviceOrientation, d as on, p as solveScrollElem, s as isOpenVtkeyboadrd, t as compare, u as off } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { D as editDefaultDish, Ki as ORDER_TYPE, Qi as Big, Rr as getItemStoppedStatus, Vt as setItemPrice, Z as removeFootItemComboSection, a as addItem2ComboSection, da as require_cloneDeep, dr as getComboItemDetailInfo, fr as getComboSectionInfo, gr as getItemSizeName, mr as getDishItemLanguage, o as addOption, ot as removeOneOption, sr as allRangHandler, vr as getOneUncompletedSection, wi as getPromotionModalDisplayPrice, zi as getItemActualPrices } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { n as imgCard_default, r as hasRealItemImage } from "./star-C6iOuR53.js";
import { a as Counter, c as require_Remove, d as shouldShowBenefitPrice, f as BenefitPrice, i as ItemOptionSelectWithSub_default, l as require_Add, n as arrow_left_default, p as BenefitPrice_module_default, r as fixComboOption_default, s as sizeOptionSelect_default, u as Fab_default } from "./DescModal-Q1_miAgO.js";
import { t as require_round } from "./round-CmfkCJn-.js";
//#region source-snapshot/src/container/comboPanel/fullComboPanel/comboSizeSelect/comboSizeSelect.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var comboSizeSelect_module_default = {
	sizeItem: "sizeItem___y3jZE",
	sizeItemChecked: "sizeItemChecked___dt6yp",
	bannerProItem: "bannerProItem___xDd55",
	bannerProItemName: "bannerProItemName___vJ2GN",
	strikethroughPrice: "strikethroughPrice___5AtTp",
	min: "min___V-yWv",
	checkIcon: "checkIcon___wcxz0",
	slideIn: "slideIn___WJ-QG"
};
//#endregion
//#region source-snapshot/src/container/comboPanel/fullComboPanel/comboSizeSelect/index.js
var import_round = /* @__PURE__ */ __toESM(require_round());
var import_jsx_runtime = require_jsx_runtime();
var ComboSizeSelect = class extends import_react.Component {
	handleChooseSize = (e) => {
		const { optAndRemark, sideNavList } = this.props;
		if (optAndRemark) {}
		this.props.setItemPrice(e);
	};
	render() {
		const { currentOrderCombo, comboSizeList, isHasBenefit, isInFreeItem, isPromotionItem, isSpecialItem, selfConfig, i18n: { language }, itemSizeList } = this.props;
		let activedSizeId = null;
		const result = currentOrderCombo.find((s) => s.id == -1);
		if (result) activedSizeId = result.sizeInfo.sizeId;
		const zeroShow = selfConfig?.configMap?.id_51;
		return comboSizeList.map((sizeInfo) => {
			const showBenefitPrice = !isInFreeItem && !isPromotionItem && !isSpecialItem && shouldShowBenefitPrice(sizeInfo.benefitPrice, isHasBenefit);
			const OriginalPrice = showBenefitPrice ? "del" : "span";
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: [comboSizeSelect_module_default.sizeItem, activedSizeId == sizeInfo.sizeId && comboSizeSelect_module_default.sizeItemChecked].join(" "),
				onClick: () => {
					this.handleChooseSize(sizeInfo);
				},
				children: [activedSizeId == sizeInfo.sizeId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
					type: "check",
					size: 5.5,
					className: comboSizeSelect_module_default.checkIcon
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: comboSizeSelect_module_default.bannerProItem,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: comboSizeSelect_module_default.bannerProItemName,
							children: getItemSizeName(sizeInfo.sizeId, sizeInfo.size, itemSizeList, language)
						}),
						(zeroShow || sizeInfo.price > 0 || showBenefitPrice) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: BenefitPrice_module_default.priceGroup,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OriginalPrice, { children: ["$", isInFreeItem || isPromotionItem ? "0.00" : (0, import_round.default)(sizeInfo.price, 2).toFixed(2)] }), showBenefitPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: sizeInfo.benefitPrice })]
						}),
						sizeInfo?.strikethroughPrice !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: comboSizeSelect_module_default.strikethroughPrice,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$" }), sizeInfo.strikethroughPrice.toFixed(2)]
						})
					]
				}, sizeInfo.id)]
			});
		});
	}
};
function mapStateToProps$4(state, ownProps) {
	return {
		currentOrderCombo: state.currentOrderCombo,
		isHasBenefit: state.crm?.isHasBenefit,
		itemSizeList: state.itemSizeList,
		sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
		currentItem: state.currentItem,
		selfConfig: state.selfConfig
	};
}
var comboSizeSelect_default = connect(mapStateToProps$4, { setItemPrice })(withTranslation()(ComboSizeSelect));
var ComboOptionItem_module_default = {
	title: "title___vlaoB",
	titlePrice: "titlePrice___x7Qq9",
	itemCardList: "itemCardList___UCLYH",
	itemCard: "itemCard___P5X-G",
	itemName: "itemName___sPn8U",
	actived: "actived___RdRy6",
	itemPrice: "itemPrice___EeOh7",
	multiItem: "multiItem___eaR2z",
	wrappedItem: "wrappedItem___ZHm6x",
	disabled: "disabled___yLAvi",
	priceText: "priceText___QVNLv",
	checkIcon: "checkIcon___YSVeG"
};
//#endregion
//#region source-snapshot/src/container/comboPanel/fullComboPanel/ComboOptionItem/index.jsx
var getInitialCheckedState = (currentOrderCombo) => {
	const checkedMap = {};
	const checkedIds = {};
	(currentOrderCombo?.find((item) => item.id === -2)?.options)?.forEach((item) => {
		const id = item.itemOptionId || item.id;
		checkedMap[id] = (checkedMap[id] || 0) + 1;
		checkedIds[id] = item.id;
	});
	return {
		checkedMap,
		checkedIds
	};
};
var ComboOptionItem = (props) => {
	const [checkedMap, setCheckedMap] = (0, import_react.useState)(() => getInitialCheckedState(props.currentOrderCombo).checkedMap);
	const [checkedIds, setCheckedIds] = (0, import_react.useState)(() => getInitialCheckedState(props.currentOrderCombo).checkedIds);
	const [maxNum] = (0, import_react.useState)(99);
	const itemNameRefList = (0, import_react.useRef)({});
	const { t, i18n: { language }, currentItem, currentOrderCombo, comboOptionList, isInFreeItem, isPromotionItem, isSpecialItem, isHasBenefit, selfConfig } = props;
	(0, import_react.useEffect)(() => {
		return () => {
			itemNameRefList.current = {};
		};
	}, []);
	const zeroShow = (0, import_react.useMemo)(() => {
		return selfConfig?.configMap?.id_51;
	}, [selfConfig]);
	const { hasNoSubList, hasSubList } = (0, import_react.useMemo)(() => {
		let sub = [];
		let pri = [];
		comboOptionList?.forEach((item) => {
			if (!item?.subOptions?.length) sub.push(item);
			else pri.push(item);
		});
		return {
			hasNoSubList: sub,
			hasSubList: pri
		};
	}, [comboOptionList]);
	const isShowComboSideNav = selfConfig?.configMap?.id_19;
	const getAddOptionsTotal = () => {
		const getQuantityFromOption = (id) => {
			return (currentOrderCombo?.find((c) => c.id === id))?.options?.reduce((total, f) => total + f.quantity, 0) || 0;
		};
		return getQuantityFromOption(-2) + getQuantityFromOption(-3);
	};
	const handleClick = (obj, mode = 1) => {
		const currentCheckCate = comboOptionList?.find((c) => c.id === (obj.itemOptionId || obj.id));
		if (!currentCheckCate) return;
		const checkCount = checkedMap[currentCheckCate.id];
		const isCurrentIdMatched = checkedIds[currentCheckCate.id] === obj.id;
		const maxLimit = currentItem.numOfItemOptionAllowed || maxNum;
		const handleOptionAdd = (quantity) => {
			if (getAddOptionsTotal() + quantity > maxLimit) {
				toast_default.info(t("max-up", { rplc: maxLimit }), props.toastPosition);
				return false;
			}
			return true;
		};
		const updateCheckedMapAndIds = (quantity, id) => {
			setCheckedMap((prev) => ({
				...prev,
				[currentCheckCate.id]: quantity
			}));
			setCheckedIds((prev) => ({
				...prev,
				[currentCheckCate.id]: id
			}));
		};
		if (obj.itemOptionId) {
			const price = obj.id !== currentCheckCate.id ? obj.price + currentCheckCate.price : obj.price;
			if (checkCount && isCurrentIdMatched) {
				updateCheckedMapAndIds(0, null);
				props.removeOneOption({
					sideNavId: -2,
					id: obj.id
				});
			} else if (!checkCount) {
				if (!handleOptionAdd(1)) return;
				updateCheckedMapAndIds(1, obj.id);
				props.addOption(-2, {
					...obj,
					price,
					quantity: 1,
					itemOption: currentCheckCate
				});
			} else if (!isCurrentIdMatched) {
				props.removeOneOption({
					sideNavId: -2,
					id: checkedIds[currentCheckCate.id]
				});
				props.addOption(-2, {
					...obj,
					price,
					quantity: 1,
					itemOption: currentCheckCate
				});
				updateCheckedMapAndIds(1, obj.id);
			}
		} else if (mode === 1) if (checkCount && isCurrentIdMatched) {
			if (!handleOptionAdd(1)) return;
			updateCheckedMapAndIds(checkCount + 1, obj.id);
			const price = obj.id !== currentCheckCate.id ? obj.price + currentCheckCate.price : obj.price;
			props.addOption(-2, {
				...obj,
				price,
				quantity: 1
			});
		} else {
			if (!handleOptionAdd(1)) return;
			updateCheckedMapAndIds(1, obj.id);
			const price = obj.id !== currentCheckCate.id ? obj.price + currentCheckCate.price : obj.price;
			props.addOption(-2, {
				...obj,
				price,
				quantity: 1
			});
		}
		else if (checkCount && isCurrentIdMatched) {
			const newQuantity = checkCount - 1;
			updateCheckedMapAndIds(newQuantity, newQuantity > 0 ? obj.id : null);
			props.removeOneOption({
				sideNavId: -2,
				id: obj.id
			});
		}
	};
	const getCurrentItem = () => {
		const opt = currentOrderCombo?.find((c) => c.id === -2);
		if (!opt || !opt.options) return;
		const countById = opt.options.reduce((acc, item) => {
			if (!acc[item.itemOptionId || item.id]) acc[item.itemOptionId || item.id] = 0;
			acc[item.itemOptionId || item.id] += 1;
			return acc;
		}, {});
		opt.options.forEach((f) => {
			const id = f.itemOptionId || f.id;
			setCheckedMap((prev) => ({
				...prev,
				[id]: countById[id]
			}));
			setCheckedIds((prev) => ({
				...prev,
				[id]: f.id
			}));
		});
	};
	(0, import_react.useEffect)(() => {
		getCurrentItem();
	}, [currentOrderCombo]);
	const renderItemCard = (item, isActive, isDisabled, onClick) => {
		const handleRemoveClick = () => {
			onClick(item, -1);
		};
		const handleAddClick = () => {
			onClick(item);
		};
		const showBenefitPrice = !isInFreeItem && !isPromotionItem && !isSpecialItem && shouldShowBenefitPrice(item.benefitPrice, isHasBenefit);
		const OriginalPrice = showBenefitPrice ? "del" : "span";
		if (!itemNameRefList.current[item.id]) itemNameRefList.current[item.id] = import_react.createRef();
		let isWrapped = false;
		if (itemNameRefList.current[item.id].current) {
			const el = itemNameRefList.current[item.id].current;
			isWrapped = el.scrollHeight > el.clientHeight;
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${ComboOptionItem_module_default.itemCard} ${isActive ? ComboOptionItem_module_default.actived : ""} ${isDisabled ? ComboOptionItem_module_default.disabled : ""} ${!item.itemOptionId ? ComboOptionItem_module_default.multiItem : ""} ${isWrapped ? ComboOptionItem_module_default.wrappedItem : ""}`,
			onClick: () => onClick(item),
			style: !item.itemOptionId && isShowComboSideNav ? {
				width: `100%`,
				margin: `0 0 2rem 0`
			} : {},
			children: [
				isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
					type: "check",
					size: 5.5,
					className: ComboOptionItem_module_default.checkIcon
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `${ComboOptionItem_module_default.itemPrice}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ComboOptionItem_module_default.itemName,
						ref: itemNameRefList.current[item.id],
						children: getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name
					}), (zeroShow || item.price > 0 || showBenefitPrice) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: BenefitPrice_module_default.priceGroup,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OriginalPrice, {
							className: ComboOptionItem_module_default.priceText,
							children: ["$", isInFreeItem || isPromotionItem ? "0.00" : item.price.toFixed(2)]
						}), showBenefitPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: item.benefitPrice })]
					})]
				}),
				isActive && !item.itemOptionId && checkedMap[item.id] > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Counter, {
					iconSize: 5.1,
					plusVersion: true,
					quantity: checkedMap[item.id],
					handleReduce: handleRemoveClick,
					handleAdd: handleAddClick
				})
			]
		}, item.id);
	};
	const handleItemClick = (item, mode) => {
		handleClick(item, mode);
	};
	const renderNoSubOptions = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: ComboOptionItem_module_default.title,
		children: t("item_option")
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: ComboOptionItem_module_default.itemCardList,
		children: hasNoSubList?.map((item) => renderItemCard(item, checkedIds[item.id] === item.id, checkedMap[item.id] && checkedIds[item.id] !== item.id, handleItemClick))
	})] });
	const renderSubOptions = (itemInfo) => {
		const showBenefitPrice = !isInFreeItem && !isPromotionItem && !isSpecialItem && shouldShowBenefitPrice(itemInfo.benefitPrice, isHasBenefit);
		const OriginalPrice = showBenefitPrice ? "del" : "span";
		const itemName = getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: ComboOptionItem_module_default.title,
			children: [itemName, (zeroShow || itemInfo.price > 0 || showBenefitPrice) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `${ComboOptionItem_module_default.titlePrice} ${BenefitPrice_module_default.priceGroup}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OriginalPrice, { children: [
					"($",
					isInFreeItem || isPromotionItem ? "0.00" : itemInfo.price.toFixed(2),
					")"
				] }), showBenefitPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: itemInfo.benefitPrice })]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: ComboOptionItem_module_default.itemCardList,
			children: itemInfo?.subOptions?.map((item) => renderItemCard(item, checkedIds[itemInfo.id] === item.id, checkedMap[itemInfo.id] && checkedIds[itemInfo.id] !== item.id, handleItemClick))
		})] }, itemInfo.id);
	};
	const renderItemList = () => hasSubList?.map((itemInfo) => renderSubOptions(itemInfo));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [hasSubList.length > 0 && renderItemList(), hasNoSubList.length > 0 && renderNoSubOptions()] });
};
function mapStateToProps$3(state) {
	return {
		currentItem: state.currentItem,
		currentOrderCombo: state.currentOrderCombo,
		isHasBenefit: state.crm?.isHasBenefit,
		selfConfig: state.selfConfig
	};
}
var ComboOptionItem_default = connect(mapStateToProps$3, {
	addOption,
	removeOneOption
})(withTranslation()(ComboOptionItem));
var noActivityTag_module_default = { tag: "tag___fJ-Cl" };
//#endregion
//#region source-snapshot/src/container/orderPage/noActivityTag.js
var NoActivityTag = (props) => {
	const { t, itemId, promotion, sideItemInfo = false } = props;
	const isInSecondDiscount = (0, import_react.useMemo)(() => {
		return promotion.buyDiscountRule?.find((info) => info.activityRule.buyDishes.includes(itemId));
	}, [promotion, itemId]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: (0, import_react.useMemo)(() => {
		if (!isInSecondDiscount) return false;
		return !isInSecondDiscount.activityRule.buyDishes.includes(`${itemId}${sideItemInfo.sideNameMap?.id}`);
	}, [
		isInSecondDiscount,
		sideItemInfo,
		itemId
	]) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: noActivityTag_module_default.tag,
		children: t("not_join_activity")
	}) });
};
function mapStateToProps$2(state) {
	return { promotion: state.promotion };
}
var noActivityTag_default = connect(mapStateToProps$2)(withTranslation()(NoActivityTag));
var ComboCateyOptionItem_module_default = {
	cateyBox: "cateyBox___1ADYv",
	title: "title___vwpik",
	titlePrice: "titlePrice___hZ5fg",
	itemCardList: "itemCardList___zePTu",
	itemCard: "itemCard___eikWx",
	itemName: "itemName___IGLMn",
	actived: "actived___IfTTs",
	itemPrice: "itemPrice___GrBzP",
	multiItem: "multiItem___W2EzK",
	wrappedItem: "wrappedItem___1v71F",
	disabled: "disabled___BKVoY",
	priceText: "priceText___bydep",
	checkIcon: "checkIcon___CYyP6"
};
//#endregion
//#region source-snapshot/src/container/comboPanel/fullComboPanel/ComboCateyOptionItem/index.jsx
var ComboCateyOptionItem = (props) => {
	const [checkedMap, setCheckedMap] = (0, import_react.useState)({});
	const [checkedIds, setCheckedIds] = (0, import_react.useState)({});
	const [hasNoSubList, setHasNoSubList] = (0, import_react.useState)([]);
	const [hasSubList, setHasSubList] = (0, import_react.useState)([]);
	const [chooseTipMap, setChoseTipMap] = (0, import_react.useState)();
	const [isShowComboSideNav, setIsShowComboSideNav] = (0, import_react.useState)(false);
	const [maxNum] = (0, import_react.useState)(99);
	const itemNameRefList = (0, import_react.useRef)({});
	const isVertical = getDeviceOrientation() === "vertical";
	const { t, i18n: { language }, currentItem, sideNavList, selfConfig, currentOrderCombo, isInFreeItem, isPromotionItem, isSpecialItem, isHasBenefit } = props;
	(0, import_react.useEffect)(() => {
		return () => {
			itemNameRefList.current = {};
		};
	}, []);
	const zeroShow = (0, import_react.useMemo)(() => {
		return selfConfig?.configMap?.id_51;
	}, [selfConfig]);
	const getNoSubList = () => {
		let sub = [];
		let pri = [];
		currentItem?.categoryOptions?.forEach((item) => {
			if (!item?.subOptions?.length) sub.push(item);
			else pri.push(item);
		});
		setHasNoSubList(sub);
		setHasSubList(pri);
	};
	(0, import_react.useEffect)(() => {
		getNoSubList();
	}, [currentItem]);
	const getAddOptionsTotal = () => {
		const getQuantityFromOption = (id) => {
			return (currentOrderCombo?.find((c) => c.id === id))?.options?.reduce((total, f) => total + f.quantity, 0) || 0;
		};
		return getQuantityFromOption(-2) + getQuantityFromOption(-3);
	};
	const getCurrentItem = () => {
		const cateOpt = currentOrderCombo?.find((c) => c.id === -3);
		if (!cateOpt || !cateOpt.options) return;
		const countById = cateOpt.options.reduce((acc, item) => {
			if (!acc[item.itemOptionId || item.id]) acc[item.itemOptionId || item.id] = 0;
			acc[item.itemOptionId || item.id] += 1;
			return acc;
		}, {});
		cateOpt.options.forEach((f) => {
			const id = f.itemOptionId || f.id;
			setCheckedMap((prev) => ({
				...prev,
				[id]: countById[id]
			}));
			setCheckedIds((prev) => ({
				...prev,
				[id]: f.id
			}));
		});
	};
	(0, import_react.useEffect)(() => {
		setChoseTipMap(allRangHandler(sideNavList, t, {
			isInFreeItem,
			isPromotionItem
		}));
		setIsShowComboSideNav(selfConfig?.configMap?.id_19);
	}, []);
	(0, import_react.useEffect)(() => {
		getCurrentItem();
	}, [currentOrderCombo]);
	const handleClick = (obj, mode = 1) => {
		const currentCheckCate = currentItem?.categoryOptions?.find((c) => c.id === (obj.itemOptionId || obj.id));
		if (!currentCheckCate) return;
		const checkCount = checkedMap[currentCheckCate.id];
		const isCurrentIdMatched = checkedIds[currentCheckCate.id] === obj.id;
		const maxLimit = currentItem.numOfItemOptionAllowed || maxNum;
		const handleOptionAdd = (quantity) => {
			if (getAddOptionsTotal() + quantity > maxLimit) {
				toast_default.info(t("max-up", { rplc: maxLimit }), props.toastPosition);
				return false;
			}
			return true;
		};
		const updateCheckedMapAndIds = (quantity, id) => {
			setCheckedMap((prev) => ({
				...prev,
				[currentCheckCate.id]: quantity
			}));
			setCheckedIds((prev) => ({
				...prev,
				[currentCheckCate.id]: id
			}));
		};
		if (obj.itemOptionId) {
			const price = obj.id !== currentCheckCate.id ? obj.price + currentCheckCate.price : obj.price;
			if (checkCount && isCurrentIdMatched) {
				updateCheckedMapAndIds(0, null);
				props.removeOneOption({
					sideNavId: -3,
					id: obj.id
				});
			} else if (!checkCount) {
				if (!handleOptionAdd(1)) return;
				updateCheckedMapAndIds(1, obj.id);
				props.addOption(-3, {
					...obj,
					price,
					quantity: 1,
					itemOption: currentCheckCate
				});
			} else if (!isCurrentIdMatched) {
				props.removeOneOption({
					sideNavId: -3,
					id: checkedIds[currentCheckCate.id]
				});
				props.addOption(-3, {
					...obj,
					price,
					quantity: 1,
					itemOption: currentCheckCate
				});
				updateCheckedMapAndIds(1, obj.id);
			}
		} else if (mode === 1) if (checkCount && isCurrentIdMatched) {
			if (!handleOptionAdd(1)) return;
			updateCheckedMapAndIds(checkCount + 1, obj.id);
			const price = obj.id !== currentCheckCate.id ? obj.price + currentCheckCate.price : obj.price;
			props.addOption(-3, {
				...obj,
				price,
				quantity: 1
			});
		} else {
			if (!handleOptionAdd(1)) return;
			updateCheckedMapAndIds(1, obj.id);
			const price = obj.id !== currentCheckCate.id ? obj.price + currentCheckCate.price : obj.price;
			props.addOption(-3, {
				...obj,
				price,
				quantity: 1
			});
		}
		else if (checkCount && isCurrentIdMatched) {
			const newQuantity = checkCount - 1;
			updateCheckedMapAndIds(newQuantity, newQuantity > 0 ? obj.id : null);
			props.removeOneOption({
				sideNavId: -3,
				id: obj.id
			});
		}
	};
	const renderItemCard = (item, isActive, isDisabled, onClick) => {
		const handleRemoveClick = () => {
			onClick(item, -1);
		};
		const handleAddClick = () => {
			onClick(item);
		};
		const showBenefitPrice = !isInFreeItem && !isPromotionItem && !isSpecialItem && shouldShowBenefitPrice(item.benefitPrice, isHasBenefit);
		const OriginalPrice = showBenefitPrice ? "del" : "span";
		if (!itemNameRefList.current[item.id]) itemNameRefList.current[item.id] = import_react.createRef();
		let isWrapped = false;
		if (itemNameRefList.current[item.id].current) {
			const el = itemNameRefList.current[item.id].current;
			isWrapped = el.scrollHeight > el.clientHeight;
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${ComboCateyOptionItem_module_default.itemCard} ${isActive ? ComboCateyOptionItem_module_default.actived : ""} ${isDisabled ? ComboCateyOptionItem_module_default.disabled : ""} ${!item.itemOptionId ? ComboCateyOptionItem_module_default.multiItem : ""} ${isWrapped ? ComboCateyOptionItem_module_default.wrappedItem : ""}`,
			onClick: () => onClick(item),
			style: !item.itemOptionId && isVertical && isShowComboSideNav ? {
				width: `100%`,
				margin: `0 0 2rem 0`
			} : {},
			children: [
				isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
					type: "check",
					size: 5.5,
					className: ComboCateyOptionItem_module_default.checkIcon
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `${ComboCateyOptionItem_module_default.itemPrice}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ComboCateyOptionItem_module_default.itemName,
						ref: itemNameRefList.current[item.id],
						children: getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name
					}), (zeroShow || item.price > 0 || showBenefitPrice) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: BenefitPrice_module_default.priceGroup,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OriginalPrice, {
							className: ComboCateyOptionItem_module_default.priceText,
							children: ["$", isInFreeItem || isPromotionItem ? "0.00" : item.price.toFixed(2)]
						}), showBenefitPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: item.benefitPrice })]
					})]
				}),
				isActive && !item.itemOptionId && checkedMap[item.id] > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Counter, {
					iconSize: 5.1,
					plusVersion: true,
					quantity: checkedMap[item.id],
					handleReduce: handleRemoveClick,
					handleAdd: handleAddClick
				})
			]
		}, item.id);
	};
	const handleItemClick = (item, mode) => {
		handleClick(item, mode);
	};
	const renderNoSubOptions = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: ComboCateyOptionItem_module_default.cateyBoxItem,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: ComboCateyOptionItem_module_default.title,
			children: t("item_option")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: ComboCateyOptionItem_module_default.itemCardList,
			children: hasNoSubList?.map((item) => renderItemCard(item, checkedIds[item.id] === item.id, checkedMap[item.id] && checkedIds[item.id] !== item.id, handleItemClick))
		})]
	});
	const renderSubOptions = (itemInfo) => {
		const showBenefitPrice = !isInFreeItem && !isPromotionItem && !isSpecialItem && shouldShowBenefitPrice(itemInfo.benefitPrice, isHasBenefit);
		const OriginalPrice = showBenefitPrice ? "del" : "span";
		const itemName = getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: ComboCateyOptionItem_module_default.cateyBoxItem,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: ComboCateyOptionItem_module_default.title,
				children: [itemName, (zeroShow || itemInfo.price > 0 || showBenefitPrice) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `${ComboCateyOptionItem_module_default.titlePrice} ${BenefitPrice_module_default.priceGroup}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OriginalPrice, { children: [
						"($",
						isInFreeItem || isPromotionItem ? "0.00" : itemInfo.price.toFixed(2),
						")"
					] }), showBenefitPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: itemInfo.benefitPrice })]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: ComboCateyOptionItem_module_default.itemCardList,
				children: itemInfo?.subOptions?.map((item) => renderItemCard(item, checkedIds[itemInfo.id] === item.id, checkedMap[itemInfo.id] && checkedIds[itemInfo.id] !== item.id, handleItemClick))
			})]
		}, itemInfo.id);
	};
	const renderItemList = () => hasSubList?.map((itemInfo) => renderSubOptions(itemInfo));
	return (hasSubList.length > 0 || hasNoSubList.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: ComboCateyOptionItem_module_default.cateyBox,
		children: [hasSubList.length > 0 && renderItemList(), hasNoSubList.length > 0 && renderNoSubOptions()]
	});
};
function mapStateToProps$1(state, ownProps) {
	return {
		currentItem: state.currentItem,
		currentOrderCombo: state.currentOrderCombo,
		isHasBenefit: state.crm?.isHasBenefit,
		sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
		selfConfig: state.selfConfig
	};
}
var ComboCateyOptionItem_default = connect(mapStateToProps$1, {
	addOption,
	removeOneOption
})(withTranslation()(ComboCateyOptionItem));
var comboSelectionModal_module_default = {
	drawBody: "drawBody___15RP3",
	header: "header___vKamM",
	text: "text___2hM3C",
	backPrePage: "backPrePage___kODMF",
	contentTopBox: "contentTopBox___QLwUl",
	maxNote: "maxNote___u7-5Z",
	leftBox: "leftBox___8af3P",
	rightBox: "rightBox___W567L",
	title: "title___q72Md",
	sub: "sub___YYEsz",
	word: "word___qBnf-",
	singlePrice: "singlePrice___btm80",
	textContent: "textContent___JpJAs",
	iconEmpty: "iconEmpty___aMUiv",
	areaImg: "areaImg___TH5aH",
	area: "area___KOZtB",
	required: "required___kzMIa",
	require: "require___5MjN4",
	areaFixCombo: "areaFixCombo___bWDkP",
	foot: "foot___OXLe2",
	countBtn: "countBtn___sD-39",
	count: "count___alXhr",
	muiDiyIcon: "muiDiyIcon___HvBQa",
	btnDis: "btnDis___X-THD",
	btnEn: "btnEn___twwWI",
	addCart: "addCart___d7Fm6",
	price: "price___IxtCb",
	addCartDisabled: "addCartDisabled___AIVqr"
};
//#endregion
//#region source-snapshot/src/container/comboPanel/comboSelectionModal/index.js
var import_Add = /* @__PURE__ */ __toESM(require_Add());
var import_Remove = /* @__PURE__ */ __toESM(require_Remove());
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var defaultMax = 99;
var ComboSelectionModal = class extends import_react.Component {
	constructor() {
		super();
		this.state = {
			maxNum: defaultMax,
			orderPanelShow: false,
			keyboardValue: "",
			sizeInfo: {},
			options: [],
			totalPrice: "0.00",
			keyboardToggle: false,
			chooseNum: 1,
			defaultItemSizeId: -1,
			isScroll: false,
			isShowMore: false,
			showRequired: false
		};
		this.itemOptionChild = {};
		this.flag = false;
	}
	handleResetEmpty = () => {
		this.setState({ keyboardValue: "" });
	};
	handleScroll = () => {
		if (!this.state.isScroll) this.setState({ isScroll: true }, () => {
			off(this.scrollDom, "scroll", this.handleScroll);
		});
	};
	changeSize = (sizeInfo, config) => {
		const { t, itemInfo, sideNavList, currentOrderCombo } = this.props;
		const { chooseNum } = this.state;
		if (config?.isLimitReached) {
			toast_default.info(t("choose-size-limit-reached"), "top");
			return;
		}
		const sideNavId = itemInfo.sideNavId;
		const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
		if (sectionInfo?.mergeDisplay && itemInfo.itemPrices?.length && Object.keys(sizeInfo).length) {
			let maxNum = this.state.maxNum;
			let obj = currentOrderCombo.find((sct) => sct.id == sideNavId);
			if (obj?.items) {
				let orderedItemQty = 0;
				let currentOrderedItemQty = 0;
				obj.items.forEach((i) => {
					orderedItemQty += i.quantity;
					if (i.id === itemInfo.id) {
						if ((i.selectedOptionList?.find((item) => item.id === -1)?.sizeInfo)?.sizeId === sizeInfo.sizeId) currentOrderedItemQty += i.quantity;
					}
				});
				const max = sectionInfo.maxNumOfSelectionAllowed;
				const addLimit = sizeInfo.originalComboSectionSaleItem?.addLimit;
				maxNum = Math.min(addLimit > 0 ? addLimit - currentOrderedItemQty : max, max - orderedItemQty);
			}
			this.setState({
				sizeInfo,
				chooseNum: maxNum && chooseNum > maxNum ? maxNum : chooseNum
			}, () => this.calPrice());
		} else this.setState({ sizeInfo }, () => this.calPrice());
	};
	viewOrderPanel = () => {
		const { itemInfo } = this.props;
		let options = [];
		const { defaultItemSizeId: preSelectItemSize } = itemInfo;
		if (itemInfo?.options?.length > 0) options = options.concat(itemInfo.options);
		if (itemInfo?.categoryOptions?.length > 0) options = options.concat(itemInfo.categoryOptions);
		let defaultItemSizeId;
		if (itemInfo.itemPrices?.length) {
			const isExist = itemInfo.itemPrices.find((each) => each.sizeId === preSelectItemSize);
			let minObj = itemInfo.itemPrices[0];
			itemInfo.itemPrices.forEach((p) => {
				if (p.price < minObj.price) minObj = p;
			});
			defaultItemSizeId = isExist ? preSelectItemSize : null;
		}
		this.setState({
			options,
			defaultItemSizeId,
			orderPanelShow: true,
			chooseNum: 1,
			keyboardValue: "",
			sizeInfo: {},
			totalPrice: "0.00"
		}, () => {
			solveScrollElem(true);
			this.calPrice();
		});
	};
	closePanel = () => {
		solveScrollElem(false);
		this.setState({
			isScroll: false,
			isShowMore: false,
			keyboardToggle: false,
			orderPanelShow: false,
			chooseNum: 1,
			keyboardValue: "",
			sizeInfo: {},
			totalPrice: "0.00"
		});
		this.props.onCloseEffect?.();
	};
	calPrice = () => {
		const { state } = this.itemOptionChild;
		const { itemInfo } = this.props;
		const { chooseNum, sizeInfo } = this.state;
		const itemPrice = itemInfo?.itemPrices;
		let isItemPrice = itemPrice && itemPrice.length > 0;
		let unitPrice = Big(0);
		let totalPrice = "0.00";
		let optionTotalPrice = Big(0);
		if (state?.selectedItemList?.length) state.selectedItemList.map((item) => {
			optionTotalPrice = optionTotalPrice.plus(item.isFreeItem ? 0 : item.price);
		});
		if (!isItemPrice) unitPrice = optionTotalPrice.plus(itemInfo?.price);
		else unitPrice = optionTotalPrice.plus(sizeInfo?.price ?? 0);
		totalPrice = unitPrice.times(chooseNum).toFixed(2);
		const { sideNavList, currentOrderCombo } = this.props;
		const sideNavId = itemInfo?.sideNavId;
		const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
		const priceRule = sectionInfo?.priceRule;
		if (priceRule === "FIXED_PRICE") totalPrice = optionTotalPrice.times(chooseNum).toFixed(2);
		else if (priceRule === "FIXED_UNTIL_MAX") {
			const orderedItemQty = currentOrderCombo.find((sct) => sct.id == sideNavId)?.items?.length ?? 0;
			let max = sectionInfo?.maxNumOfSelectionAllowed;
			if (orderedItemQty <= max) {
				let reduce = max - orderedItemQty;
				if (chooseNum <= reduce) totalPrice = optionTotalPrice.times(chooseNum).toFixed(2);
				else totalPrice = unitPrice.times(chooseNum - reduce).plus(optionTotalPrice.times(reduce)).toFixed(2);
			}
		} else if (sectionInfo?.freeQuantity > 0) {
			const orderedItemQty = currentOrderCombo.find((sct) => sct.id == sideNavId)?.items?.length ?? 0;
			let freeQuantity = sectionInfo?.freeQuantity;
			if (orderedItemQty <= freeQuantity) {
				let reduce = freeQuantity - orderedItemQty;
				if (chooseNum <= reduce) totalPrice = optionTotalPrice.times(chooseNum).toFixed(2);
				else totalPrice = unitPrice.times(chooseNum - reduce).plus(optionTotalPrice.times(reduce)).toFixed(2);
			}
		}
		if (totalPrice == "NaN") this.setState({ totalPrice: "0.00" });
		else {
			const preview = {
				...itemInfo,
				sectionDetail: void 0,
				price: isItemPrice ? 0 : itemInfo.price,
				selectedOptionList: [...isItemPrice ? [{
					id: -1,
					sizeInfo
				}] : [], {
					id: -2,
					options: state?.selectedItemList || []
				}]
			};
			const paidPrices = getItemActualPrices(preview);
			const freePrices = getItemActualPrices({
				...preview,
				price: 0,
				isComboBaseFree: true,
				selectedOptionList: preview.selectedOptionList.map((section) => section.id === -1 ? {
					...section,
					sizeInfo: {
						...section.sizeInfo,
						price: 0
					}
				} : section)
			});
			const orderedQuantity = currentOrderCombo.find((section) => section.id == sideNavId)?.items?.length ?? 0;
			const freeLimit = priceRule === "FIXED_PRICE" ? Infinity : priceRule === "FIXED_UNTIL_MAX" ? sectionInfo.maxNumOfSelectionAllowed : sectionInfo?.freeQuantity || 0;
			const freeCount = Math.min(chooseNum, Math.max(0, freeLimit - orderedQuantity));
			const paidCount = chooseNum - freeCount;
			this.setState({
				totalPrice,
				totalBenefitPrice: Big(paidPrices.realBenefitPrice).times(paidCount).plus(Big(freePrices.realBenefitPrice).times(freeCount)).toNumber(),
				hasSelectedBenefitPrice: paidCount > 0 && paidPrices.hasBenefitPrice || freeCount > 0 && freePrices.hasBenefitPrice
			});
		}
	};
	addOrder = () => {
		const { sideNavList, itemInfo, currentOrderCombo, isEditPreSelect, t, selfConfig } = this.props;
		const { state, showRuleToast } = this.itemOptionChild;
		const { chooseNum, keyboardValue, sizeInfo } = this.state;
		const sideNavId = itemInfo.sideNavId;
		const itemPrice = itemInfo?.itemPrices;
		let isItemPrice = itemPrice && itemPrice.length > 0;
		const stoppedStatus = getItemStoppedStatus(itemInfo);
		if (stoppedStatus) {
			toast_default.info(t(stoppedStatus === "unavailable" ? "dish-item-unavailable" : "dish-sold-out", { item: itemInfo.name }), "top");
			return;
		}
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
		if (!itemInfo.remark) {
			itemInfo.remark = {
				optionName: "",
				optionType: "NOTE",
				quantity: 1,
				price: 0
			};
			itemInfo.remark.optionName = keyboardValue;
		} else itemInfo.remark.optionName = keyboardValue;
		itemInfo.quantity = chooseNum;
		const tempItem = Object.assign({}, itemInfo);
		let selectedOptionList = [];
		let id2List = [];
		let id3List = [];
		if (sizeInfo?.sizeId) selectedOptionList.push({
			id: -1,
			sizeInfo
		});
		if (state?.selectedItemList?.length) state.selectedItemList.forEach((item) => {
			if (item.menuCategoryId) id3List.push(item);
			else id2List.push(item);
		});
		if (id2List.length) {
			id2List.originalOptions = (0, import_cloneDeep.default)(id2List.options);
			id2List.sort(compare("id"));
			selectedOptionList.push({
				id: -2,
				options: id2List
			});
		}
		if (id3List.length) {
			id3List.sort(compare("id"));
			selectedOptionList.push({
				id: -3,
				options: id3List
			});
		}
		const tempComboItem = Object.assign({}, tempItem);
		tempComboItem.isComboBaseFree = false;
		tempComboItem.selectedOptionList = selectedOptionList;
		if (tempComboItem.itemPrices && tempComboItem.itemPrices.length > 0) tempComboItem.price = 0;
		tempComboItem.quantity = 1;
		const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
		if (!sectionInfo) return;
		const { priceRule, maxNumOfSelectionAllowed, freeQuantity } = sectionInfo;
		const orderedItemQty = currentOrderCombo.find((sct) => sct.id == sideNavId)?.items?.length ?? 0;
		const onlySelectOneMode = maxNumOfSelectionAllowed === 1 && priceRule !== "FIXED_UNTIL_MAX";
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
		if (onlySelectOneMode) removePreviousItems(sideNavId);
		const addComboList = [];
		if (itemInfo.itemPrices && itemInfo.itemPrices.length) {
			if (sizeInfo && sizeInfo.sizeId) {
				if (priceRule == "FIXED_UNTIL_MAX") {
					let residue = sectionInfo?.maxNumOfSelectionAllowed - orderedItemQty;
					for (let i = 0; i < chooseNum; i++) {
						let cloneItem = (0, import_cloneDeep.default)(tempComboItem);
						if (i < residue) {
							let obj = cloneItem.selectedOptionList.find((c) => c.id == -1);
							obj.sizeInfo.price = 0;
							cloneItem.isComboBaseFree = true;
						}
						addComboList.push(cloneItem);
					}
				} else if (priceRule == "FIXED_PRICE") for (let i = 0; i < chooseNum; i++) {
					let cloneItem = (0, import_cloneDeep.default)(tempComboItem);
					let obj = cloneItem.selectedOptionList.find((c) => c.id == -1);
					obj.sizeInfo.price = 0;
					cloneItem.isComboBaseFree = true;
					addComboList.push(cloneItem);
				}
				else if (freeQuantity > 0) {
					let residue = freeQuantity - orderedItemQty;
					for (let i = 0; i < chooseNum; i++) {
						let cloneItem = (0, import_cloneDeep.default)(tempComboItem);
						if (i < residue) {
							let obj = cloneItem.selectedOptionList.find((c) => c.id == -1);
							obj.sizeInfo.price = 0;
							cloneItem.isComboBaseFree = true;
						}
						addComboList.push(cloneItem);
					}
				} else for (let i = 0; i < chooseNum; i++) addComboList.push((0, import_cloneDeep.default)(tempComboItem));
				addComboList.forEach((addItem) => addItem.id_sizeId = addComboList[0].id + sizeInfo.sizeId);
			}
		} else {
			if (priceRule == "FIXED_UNTIL_MAX") {
				let residue = sectionInfo?.maxNumOfSelectionAllowed - orderedItemQty;
				for (let i = 0; i < chooseNum; i++) {
					let cloneItem = (0, import_cloneDeep.default)(tempComboItem);
					if (i < residue) {
						cloneItem.price = 0;
						cloneItem.isComboBaseFree = true;
					}
					addComboList.push(cloneItem);
				}
			} else if (priceRule == "FIXED_PRICE") for (let i = 0; i < chooseNum; i++) {
				let cloneItem = (0, import_cloneDeep.default)(tempComboItem);
				cloneItem.price = 0;
				cloneItem.isComboBaseFree = true;
				addComboList.push(cloneItem);
			}
			else if (freeQuantity > 0) {
				let residue = freeQuantity - orderedItemQty;
				for (let i = 0; i < chooseNum; i++) {
					let cloneItem = (0, import_cloneDeep.default)(tempComboItem);
					if (i < residue) {
						cloneItem.price = 0;
						cloneItem.isComboBaseFree = true;
					}
					addComboList.push(cloneItem);
				}
			} else for (let i = 0; i < chooseNum; i++) addComboList.push((0, import_cloneDeep.default)(tempComboItem));
			addComboList.forEach((addItem) => addItem.id_sizeId = addComboList[0].id);
		}
		if (isEditPreSelect && !onlySelectOneMode) this.props.editDefaultDish(sideNavId, addComboList);
		else this.props.addItem2ComboSection(sideNavId, addComboList);
		this.closePanel();
	};
	showKeyboard = () => {
		this.setState({ keyboardToggle: true });
	};
	hideKeyboard = () => {
		this.setState({ keyboardToggle: false });
	};
	keyboardChange = (event, isVKboard = false) => {
		let value = isVKboard ? event : removeEmoji(event.target.value);
		if (value.length > 255) value = value.substr(0, 255);
		this.setState({ keyboardValue: value });
		if (isVKboard) this.inputRef.scrollIntoViewIfNeeded(true);
	};
	changeChooseNum = (isAdd) => {
		const { itemInfo } = this.props;
		const sideNavId = itemInfo.sideNavId;
		const { chooseNum, sizeInfo } = this.state;
		let maxNum = this.state.maxNum;
		const { t, sideNavList } = this.props;
		const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
		if (!sectionInfo) return;
		const orderedItems = this.props.currentOrderCombo.find((sct) => sct.id == sideNavId)?.items ?? [];
		const orderedItemQty = orderedItems.length;
		const currentOrderedItemQty = orderedItems.filter((item) => {
			if (sectionInfo?.mergeDisplay) {
				if (itemInfo.itemPrices?.length && Object.keys(sizeInfo).length) {
					if ((item.selectedOptionList?.find((item) => item.id === -1)?.sizeInfo)?.sizeId === sizeInfo.sizeId) return true;
				}
			} else return item.id === itemInfo.id;
		}).length;
		let min = sectionInfo?.minNumOfSelectionAllowed;
		let max = sectionInfo?.maxNumOfSelectionAllowed;
		let addLimit;
		if (sectionInfo) if (sectionInfo.mergeDisplay && itemInfo?.itemPrices?.length > 0) addLimit = sizeInfo.originalComboSectionSaleItem?.addLimit;
		else addLimit = sectionInfo.comboSectionSaleItems?.find((item) => item.saleItemId === itemInfo.id)?.addLimit;
		if (isAdd) if (min == void 0) {
			if (sectionInfo?.priceRule == "FIXED_UNTIL_MAX") max = this.state.maxNum;
			if (chooseNum < Math.min(addLimit > 0 ? addLimit - currentOrderedItemQty : max, max - orderedItemQty)) this.setState({ chooseNum: chooseNum + 1 }, () => this.calPrice());
		} else if (max == void 0) {
			let n = chooseNum + 1;
			if (n >= maxNum) toast_default.info(t("max-up", { rplc: defaultMax }), "top");
			this.setState({ chooseNum: n }, () => this.calPrice());
		} else if (min == max) {
			if (sectionInfo?.itemSelectionRule == "RANGE" && sectionInfo?.priceRule == "FIXED_UNTIL_MAX") max = this.state.maxNum;
			if (chooseNum < Math.min(addLimit > 0 ? addLimit - currentOrderedItemQty : max, max - orderedItemQty)) this.setState({ chooseNum: chooseNum + 1 }, () => this.calPrice());
		} else {
			if (sectionInfo?.priceRule == "FIXED_UNTIL_MAX") max = this.state.maxNum;
			if (chooseNum < Math.min(addLimit > 0 ? addLimit - currentOrderedItemQty : max, max - orderedItemQty)) this.setState({ chooseNum: chooseNum + 1 }, () => this.calPrice());
		}
		else this.setState({ chooseNum: chooseNum - 1 }, () => this.calPrice());
	};
	showChangeChooseNumDisabledTip = () => {
		const { sizeInfo } = this.state;
		const { t, itemInfo, sideNavList } = this.props;
		const sideNavId = itemInfo.sideNavId;
		if (getComboSectionInfo(sideNavList, sideNavId)?.mergeDisplay && itemInfo?.itemPrices?.length && !Object.keys(sizeInfo).length) {
			toast_default.info(t("choose-size"), "top");
			this.setState({ showRequired: true });
			return;
		}
	};
	componentDidMount() {
		this.props.onRef(this);
	}
	componentDidUpdate(prevProps, prevState) {
		if (prevState.orderPanelShow != this.state.orderPanelShow) if (this.state.orderPanelShow) {
			this.itemOptionChild?.clearSelectedItemList && this.itemOptionChild.clearSelectedItemList();
			if (this.scrollDom) {
				off(this.scrollDom, "scroll", this.handleScroll);
				this.setState({ isShowMore: !!(this.scrollDom.scrollHeight > this.scrollDom.offsetHeight) });
				on(this.scrollDom, "scroll", this.handleScroll);
			}
		} else {
			const { itemInfo, sideNavList, currentOrderCombo } = this.props;
			const sideNavId = itemInfo.sideNavId;
			const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
			if (!sectionInfo) return;
			let sectionIdx = sideNavList?.findIndex((s) => s.id == sideNavId) ?? 0;
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
		if (!!(String(this.state.keyboardValue).length >= 255) && this.maxNoteRef) this.maxNoteRef.scrollIntoViewIfNeeded(true);
		if (this.state.keyboardToggle && !prevState.keyboardToggle && this.state.orderPanelShow) requestAnimationFrame(() => {
			this.inputRef?.scrollIntoViewIfNeeded(true);
		});
	}
	componentWillUnmount() {
		off(this.scrollDom, "scroll", this.handleScroll);
	}
	render() {
		const { t, i18n: { language }, itemInfo, sideNavList, currentOrderCombo, selfConfig, isInFreeItem, isPromotionItem, isExchangePurchase = false } = this.props;
		const { orderPanelShow, keyboardToggle, keyboardValue, sizeInfo, totalPrice, chooseNum, options, defaultItemSizeId, showRequired } = this.state;
		const sideNavId = itemInfo.sideNavId;
		const isItemPrice = itemInfo?.itemPrices?.length > 0;
		const isItemOption = options.length > 0;
		const isFixCombo = itemInfo?.comboType === "FIXED_SELECTION";
		const itemName = itemInfo?.id ? getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name : "";
		let isExceedlimit = !!(String(keyboardValue).length >= 255);
		const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
		let maxNum = this.state.maxNum;
		if (!getComboSectionInfo(sideNavList, sideNavId)?.allowRepeatedItems) maxNum = 1;
		else {
			let obj = currentOrderCombo.find((sct) => sct.id == sideNavId);
			if (obj?.items) {
				let orderedItemQty = 0;
				let currentOrderedItemQty = 0;
				obj.items.forEach((i) => {
					orderedItemQty += i.quantity;
					if (sectionInfo?.mergeDisplay) {
						if (i.id === itemInfo.id && itemInfo.itemPrices?.length && Object.keys(sizeInfo).length) {
							if ((i.selectedOptionList?.find((item) => item.id === -1)?.sizeInfo)?.sizeId === sizeInfo.sizeId) currentOrderedItemQty += i.quantity;
						}
					} else if (i.id === itemInfo.id) currentOrderedItemQty += i.quantity;
				});
				const min = sectionInfo?.minNumOfSelectionAllowed;
				const max = sectionInfo?.maxNumOfSelectionAllowed;
				let addLimit;
				if (sectionInfo) if (sectionInfo.mergeDisplay && isItemPrice) if (Object.keys(sizeInfo).length) addLimit = sizeInfo.originalComboSectionSaleItem?.addLimit;
				else addLimit = 1;
				else addLimit = sectionInfo.comboSectionSaleItems?.find((item) => item.saleItemId === itemInfo.id)?.addLimit;
				if (min == void 0) if (sectionInfo?.priceRule == "FIXED_UNTIL_MAX") maxNum = this.state.maxNum;
				else maxNum = Math.min(addLimit > 0 ? addLimit - currentOrderedItemQty : max, max - orderedItemQty);
				else if (max == void 0) maxNum = this.state.maxNum;
				else if (min == max) if (sectionInfo?.itemSelectionRule == "RANGE" && sectionInfo?.priceRule == "FIXED_UNTIL_MAX") maxNum = this.state.maxNum;
				else maxNum = Math.min(addLimit > 0 ? addLimit - currentOrderedItemQty : max, max - orderedItemQty);
				else if (sectionInfo?.priceRule == "FIXED_UNTIL_MAX") maxNum = this.state.maxNum;
				else maxNum = Math.min(addLimit > 0 ? addLimit - currentOrderedItemQty : max, max - orderedItemQty);
			}
		}
		const isShowRemark = selfConfig?.configMap?.id_3;
		const isSubDishRemark = selfConfig?.configList?.find((config) => config.id === 30)?.value;
		const isSingleMaxChosen = sectionInfo?.maxNumOfSelectionAllowed === 1 && sectionInfo?.priceRule !== "FIXED_UNTIL_MAX";
		let isDisabled = true;
		if (!Boolean(getItemStoppedStatus(itemInfo)) && (Object.keys(sizeInfo).length || !isItemPrice)) isDisabled = false;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			visible: orderPanelShow,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: comboSelectionModal_module_default.drawBody,
				onClick: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: comboSelectionModal_module_default.header,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: arrow_left_default,
							className: comboSelectionModal_module_default.backPrePage,
							onClick: this.closePanel
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: comboSelectionModal_module_default.text,
							children: itemName
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: comboSelectionModal_module_default.contentTopBox,
						ref: (el) => this.scrollDom = el,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: comboSelectionModal_module_default.leftBox,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: comboSelectionModal_module_default.areaImg,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
									selfConfig,
									itemInfo
								})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: comboSelectionModal_module_default.rightBox,
							children: [
								(itemInfo.description || itemInfo.otherDescription) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: comboSelectionModal_module_default.areaDetail,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: { marginTop: 0 },
										className: comboSelectionModal_module_default.title,
										children: t("description")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: comboSelectionModal_module_default.word,
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
								isFixCombo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: comboSelectionModal_module_default.areaFixCombo,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: comboSelectionModal_module_default.title,
										children: t("items")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: comboSelectionModal_module_default.word,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(fixComboOption_default, { sectionItemList: itemInfo.comboSections })
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: comboSelectionModal_module_default.area,
									style: { display: isItemPrice ? "block" : "none" },
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: comboSelectionModal_module_default.title,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("section") }), showRequired && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: comboSelectionModal_module_default.required,
											children: t("required")
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: comboSelectionModal_module_default.word,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(sizeOptionSelect_default, {
											itemInfo,
											sectionItemList: itemInfo.itemPrices || [],
											defaultItemSizeId,
											selectedItem: sizeInfo,
											changeSize: this.changeSize,
											isInFreeItem,
											isPromotionItem: isPromotionItem && !isExchangePurchase,
											isSingleMaxChosen,
											sideNavList
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: comboSelectionModal_module_default.area,
									style: { display: isItemOption ? "block" : "none" },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemOptionSelectWithSub_default, {
										toastPosition: "top",
										onRef: (ref) => this.itemOptionChild = ref,
										calPrice: this.calPrice,
										sectionItemList: options,
										itemInfo,
										parentQty: chooseNum,
										isInFreeItem,
										isPromotionItem: isPromotionItem && !isExchangePurchase,
										isSingleMaxChosen
									})
								}),
								isShowRemark && isSubDishRemark && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: comboSelectionModal_module_default.area,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: comboSelectionModal_module_default.title,
											children: t("dishExtraDescription")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											ref: (el) => this.inputRef = el,
											maxLength: 255,
											placeholder: `${t("noteDishPlaceholder")},${t("note_tip")}`,
											value: keyboardValue,
											className: comboSelectionModal_module_default.textContent,
											onFocus: () => {
												window.scroll(0, 0);
											},
											onBlur: () => {
												window.scroll(0, 0);
											},
											onClick: () => {
												if (this.props.showDescModal) this.props.showDescModal(t("dishExtraDescription"), keyboardValue, (value) => this.keyboardChange(value, true));
												else if (isOpenVtkeyboadrd()) this.showKeyboard();
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
											className: comboSelectionModal_module_default.iconEmpty,
											type: "round_close_light",
											size: 5,
											onClick: this.handleResetEmpty
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											ref: (el) => this.maxNoteRef = el,
											className: comboSelectionModal_module_default.maxNote,
											style: { display: isExceedlimit ? "block" : "none" },
											children: t("maxNoteTip")
										})
									]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: comboSelectionModal_module_default.foot,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: comboSelectionModal_module_default.countBtn,
							onClick: () => this.showChangeChooseNumDisabledTip(),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: chooseNum === 1,
									"aria-label": "Remove",
									className: chooseNum > 1 ? `${comboSelectionModal_module_default.btnEn} animate-btn` : comboSelectionModal_module_default.btnDis,
									onClick: () => this.changeChooseNum(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: comboSelectionModal_module_default.muiDiyIcon })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: comboSelectionModal_module_default.count,
									children: chooseNum
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: chooseNum >= maxNum,
									"aria-label": "Add",
									className: chooseNum < maxNum ? `${comboSelectionModal_module_default.btnEn} animate-btn` : comboSelectionModal_module_default.btnDis,
									onClick: () => this.changeChooseNum(true),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: comboSelectionModal_module_default.muiDiyIcon })
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `${comboSelectionModal_module_default.addCart} ${isDisabled ? comboSelectionModal_module_default.addCartDisabled : "linear-animate-btn"} `,
							onClick: this.addOrder,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("confirm") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: comboSelectionModal_module_default.price,
								children: this.props.crm.isHasBenefit === true && this.state.hasSelectedBenefitPrice && !isInFreeItem && !isPromotionItem ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", totalPrice] }),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, {
										variant: "button",
										benefitPrice: this.state.totalBenefitPrice
									})
								] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["$", isInFreeItem ? "0.00" : getPromotionModalDisplayPrice({
									isPromotionItem,
									isExchangePurchase,
									totalPrice
								})] })
							})]
						})]
					}),
					keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
						VKOuterStyle: {
							position: "relative",
							flex: "0 0 auto"
						},
						keyboardValue,
						changeInput: (v) => this.keyboardChange(v, true),
						closeKeyboard: () => {
							this.hideKeyboard();
						}
					}) : null
				]
			}),
			onClose: this.closePanel
		});
	}
};
function mapStateToProps(state, ownProps) {
	return {
		sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
		selfConfig: state.selfConfig,
		currentOrderCombo: state.currentOrderCombo,
		currentItem: state.currentItem,
		crm: state.crm
	};
}
var comboSelectionModal_default = connect(mapStateToProps, {
	addItem2ComboSection,
	editDefaultDish,
	removeFootItemComboSection
})(withTranslation()(ComboSelectionModal));
//#endregion
//#region source-snapshot/src/utils/getComboSectionItem.js
var getComboSectionItem = (sectionList, currentCategoryList, currentOrder) => {
	let comboAllChildDish = [];
	sectionList.forEach((s) => {
		if (s.id > 0 && s?.comboSectionSaleItems?.length) {
			let childDishItem = [];
			let list = s.comboSectionSaleItems;
			for (let i = 0; i < list.length; i++) {
				const item = list[i];
				let temp = (0, import_cloneDeep.default)(getComboItemDetailInfo(item.saleItemId, currentCategoryList));
				if (temp) {
					temp.sideNavId = s?.id;
					if (!temp.itemPrices?.length) childDishItem.push({
						...temp,
						price: item.addPrice ?? temp.price
					});
					else {
						const currentOrderTypePriceList = temp.itemPrices.filter((f) => f.type === ORDER_TYPE[currentOrder.orderType]);
						const allOrderTypePriceList = temp.itemPrices.filter((f) => f.type === ORDER_TYPE["ALL"]);
						const itemPriceList = currentOrderTypePriceList.length ? currentOrderTypePriceList : allOrderTypePriceList;
						if (itemPriceList?.length > 0) if (s.mergeDisplay) {
							const itemPriceListWithPrice = itemPriceList.map((priceItem) => ({
								...priceItem,
								price: item.addPrice ?? priceItem.price,
								originalSaleItem: temp,
								originalComboSectionSaleItem: item
							}));
							const sameNameItemIdx = childDishItem.findIndex((d) => d.name === temp.name);
							if (sameNameItemIdx > -1) childDishItem[sameNameItemIdx].itemPrices.push(...itemPriceListWithPrice);
							else childDishItem.push({
								...temp,
								itemPrices: itemPriceListWithPrice
							});
						} else {
							const itemPriceListWithPrice = itemPriceList.map((priceItem) => ({
								...priceItem,
								price: item.addPrice ?? priceItem.price
							}));
							childDishItem.push({
								...temp,
								itemPrices: itemPriceListWithPrice
							});
						}
					}
				}
			}
			const hasThumbPath = childDishItem.some(hasRealItemImage);
			const isRequestSubDish = s?.itemSelectionRule ? s.itemSelectionRule !== "MAX_NUM_LIMIT" : false;
			comboAllChildDish.push({
				sideNameMap: {
					id: s?.id,
					name: s?.name,
					fieldDisplayNameGroups: s?.fieldDisplayNameGroups
				},
				hasThumbPath,
				sideDishList: childDishItem,
				discountAllowed: s.discountAllowed,
				isRequestSubDish
			});
		} else if ((s.id === -99 || s.id === -98) && s?.saleItems?.length) {
			let childDishItem = [];
			let list = s.saleItems;
			for (let i = 0; i < list.length; i++) {
				let temp = (0, import_cloneDeep.default)(list[i]);
				temp.sideNavId = s.id;
				if (!temp.itemPrices?.length) childDishItem.push(temp);
				else {
					const currentOrderTypePriceList = temp.itemPrices.filter((f) => f.type === ORDER_TYPE[currentOrder.orderType]);
					const allOrderTypePriceList = temp.itemPrices.filter((f) => f.type === ORDER_TYPE["ALL"]);
					const itemPriceList = currentOrderTypePriceList.length ? currentOrderTypePriceList : allOrderTypePriceList;
					if (itemPriceList?.length > 0) childDishItem.push({
						...temp,
						itemPrices: itemPriceList
					});
				}
			}
			const hasThumbPath = childDishItem.some(hasRealItemImage);
			comboAllChildDish.push({
				sideNameMap: {
					id: s?.id,
					name: s?.name,
					fieldDisplayNameGroups: s?.fieldDisplayNameGroups
				},
				hasThumbPath,
				sideDishList: childDishItem,
				discountAllowed: s.discountAllowed ?? false,
				isRequestSubDish: false
			});
		}
	});
	return comboAllChildDish;
};
//#endregion
export { ComboOptionItem_default as a, noActivityTag_default as i, comboSelectionModal_default as n, comboSizeSelect_default as o, ComboCateyOptionItem_default as r, getComboSectionItem as t };
