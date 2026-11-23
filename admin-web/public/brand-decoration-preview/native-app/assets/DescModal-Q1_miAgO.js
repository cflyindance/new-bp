import { d as __toESM, i as require_react, n as require_jsx_runtime, o as __commonJSMin, t as toast_default } from "./toast-C8a1ReSo.js";
import { W as removeEmoji, a as getDeviceOrientation, s as isOpenVtkeyboadrd } from "./utils-Cdx9DbDR.js";
import { l as _extends, r as connect, u as init_extends } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { r as require_prop_types } from "./tiny-warning.esm-Cf7nlwXj.js";
import { Br as itemIsSubOptionSoldOut, Ir as showInsufficientStockToast, Mr as getStockNumDisplayValue, Nr as isInvalidStockNum, Qi as Big, Vr as itemIsSubOptionUnavailable, da as require_cloneDeep, dr as getComboItemDetailInfo, fr as getComboSectionInfo, gr as getItemSizeName, hr as getItemOptionName, jr as getRemainingStockNum, mr as getDishItemLanguage, oa as isSameStockItem, pr as getCurrentItemLanguage } from "./actions-BwRPwnFF.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { n as init_objectWithoutProperties, t as _objectWithoutProperties } from "./objectWithoutProperties-DDcNLcsK.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { _ as clsx, c as init_withStyles, h as chainPropTypes, l as withStyles, m as init_esm, o as capitalize, s as init_capitalize, t as ButtonBase_default, v as init_clsx_m } from "./ButtonBase-CpioktX3.js";
import "./star-C6iOuR53.js";
import { n as require_interopRequireWildcard, r as require_interopRequireDefault, t as require_createSvgIcon } from "./createSvgIcon-DxdaFuGn.js";
//#region source-snapshot/src/component/BenefitPrice/BenefitPrice.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
init_extends();
var import_prop_types = /* @__PURE__ */ __toESM(require_prop_types());
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
init_objectWithoutProperties();
init_clsx_m();
init_esm();
init_withStyles();
init_capitalize();
var BenefitPrice_module_default = {
	priceGroup: "priceGroup___sa02A",
	benefitPrice: "benefitPrice___WIkBH",
	button: "button___fniEm"
};
//#endregion
//#region source-snapshot/src/component/BenefitPrice/index.jsx
var import_jsx_runtime = require_jsx_runtime();
function BenefitPrice({ benefitPrice, className, variant = "default" }) {
	if (!Number.isFinite(benefitPrice)) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: (0, import_classnames.default)(BenefitPrice_module_default.benefitPrice, className, { [BenefitPrice_module_default.button]: variant === "button" }),
		children: [variant !== "button" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: "data:image/png;base64,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",
			alt: ""
		}), `$${benefitPrice.toFixed(2)}`]
	});
}
//#endregion
//#region source-snapshot/src/utils/shouldShowBenefitPrice.js
function shouldShowBenefitPrice(benefitPrice, isHasBenefit) {
	return isHasBenefit === true && Number.isFinite(benefitPrice);
}
//#endregion
//#region node_modules/@material-ui/core/esm/Fab/Fab.js
var styles = function styles(theme) {
	return {
		root: _extends({}, theme.typography.button, {
			boxSizing: "border-box",
			minHeight: 36,
			transition: theme.transitions.create([
				"background-color",
				"box-shadow",
				"border"
			], { duration: theme.transitions.duration.short }),
			borderRadius: "50%",
			padding: 0,
			minWidth: 0,
			width: 56,
			height: 56,
			boxShadow: theme.shadows[6],
			"&:active": { boxShadow: theme.shadows[12] },
			color: theme.palette.getContrastText(theme.palette.grey[300]),
			backgroundColor: theme.palette.grey[300],
			"&:hover": {
				backgroundColor: theme.palette.grey.A100,
				"@media (hover: none)": { backgroundColor: theme.palette.grey[300] },
				"&$disabled": { backgroundColor: theme.palette.action.disabledBackground },
				textDecoration: "none"
			},
			"&$focusVisible": { boxShadow: theme.shadows[6] },
			"&$disabled": {
				color: theme.palette.action.disabled,
				boxShadow: theme.shadows[0],
				backgroundColor: theme.palette.action.disabledBackground
			}
		}),
		label: {
			width: "100%",
			display: "inherit",
			alignItems: "inherit",
			justifyContent: "inherit"
		},
		primary: {
			color: theme.palette.primary.contrastText,
			backgroundColor: theme.palette.primary.main,
			"&:hover": {
				backgroundColor: theme.palette.primary.dark,
				"@media (hover: none)": { backgroundColor: theme.palette.primary.main }
			}
		},
		secondary: {
			color: theme.palette.secondary.contrastText,
			backgroundColor: theme.palette.secondary.main,
			"&:hover": {
				backgroundColor: theme.palette.secondary.dark,
				"@media (hover: none)": { backgroundColor: theme.palette.secondary.main }
			}
		},
		extended: {
			borderRadius: 48 / 2,
			padding: "0 16px",
			width: "auto",
			minHeight: "auto",
			minWidth: 48,
			height: 48,
			"&$sizeSmall": {
				width: "auto",
				padding: "0 8px",
				borderRadius: 34 / 2,
				minWidth: 34,
				height: 34
			},
			"&$sizeMedium": {
				width: "auto",
				padding: "0 16px",
				borderRadius: 40 / 2,
				minWidth: 40,
				height: 40
			}
		},
		focusVisible: {},
		disabled: {},
		colorInherit: { color: "inherit" },
		sizeSmall: {
			width: 40,
			height: 40
		},
		sizeMedium: {
			width: 48,
			height: 48
		}
	};
};
var Fab = /*#__PURE__*/ import_react.forwardRef(function Fab(props, ref) {
	var children = props.children, classes = props.classes, className = props.className, _props$color = props.color, color = _props$color === void 0 ? "default" : _props$color, _props$component = props.component, component = _props$component === void 0 ? "button" : _props$component, _props$disabled = props.disabled, disabled = _props$disabled === void 0 ? false : _props$disabled, _props$disableFocusRi = props.disableFocusRipple, disableFocusRipple = _props$disableFocusRi === void 0 ? false : _props$disableFocusRi, focusVisibleClassName = props.focusVisibleClassName, _props$size = props.size, size = _props$size === void 0 ? "large" : _props$size, _props$variant = props.variant, variant = _props$variant === void 0 ? "circular" : _props$variant, other = _objectWithoutProperties(props, [
		"children",
		"classes",
		"className",
		"color",
		"component",
		"disabled",
		"disableFocusRipple",
		"focusVisibleClassName",
		"size",
		"variant"
	]);
	return /*#__PURE__*/ import_react.createElement(ButtonBase_default, _extends({
		className: clsx(classes.root, className, size !== "large" && classes["size".concat(capitalize(size))], disabled && classes.disabled, variant === "extended" && classes.extended, {
			"primary": classes.primary,
			"secondary": classes.secondary,
			"inherit": classes.colorInherit
		}[color]),
		component,
		disabled,
		focusRipple: !disableFocusRipple,
		focusVisibleClassName: clsx(classes.focusVisible, focusVisibleClassName),
		ref
	}, other), /*#__PURE__*/ import_react.createElement("span", { className: classes.label }, children));
});
Fab.propTypes = {
	/**
	* The content of the button.
	*/
	children: import_prop_types.default.node.isRequired,
	/**
	* Override or extend the styles applied to the component.
	* See [CSS API](#css) below for more details.
	*/
	classes: import_prop_types.default.object,
	/**
	* @ignore
	*/
	className: import_prop_types.default.string,
	/**
	* The color of the component. It supports those theme colors that make sense for this component.
	*/
	color: import_prop_types.default.oneOf([
		"default",
		"inherit",
		"primary",
		"secondary"
	]),
	/**
	* The component used for the root node.
	* Either a string to use a HTML element or a component.
	*/
	component: import_prop_types.default.elementType,
	/**
	* If `true`, the button will be disabled.
	*/
	disabled: import_prop_types.default.bool,
	/**
	* If `true`, the  keyboard focus ripple will be disabled.
	*/
	disableFocusRipple: import_prop_types.default.bool,
	/**
	* If `true`, the ripple effect will be disabled.
	*/
	disableRipple: import_prop_types.default.bool,
	/**
	* @ignore
	*/
	focusVisibleClassName: import_prop_types.default.string,
	/**
	* The URL to link to when the button is clicked.
	* If defined, an `a` element will be used as the root node.
	*/
	href: import_prop_types.default.string,
	/**
	* The size of the button.
	* `small` is equivalent to the dense button styling.
	*/
	size: import_prop_types.default.oneOf([
		"large",
		"medium",
		"small"
	]),
	/**
	* The variant to use.
	* 'round' is deprecated, use 'circular' instead.
	*/
	variant: chainPropTypes(import_prop_types.default.oneOf([
		"extended",
		"circular",
		"round"
	]), function(props) {
		if (props.variant === "round") throw new Error("Material-UI: variant=\"round\" was renamed variant=\"circular\" for consistency.");
		return null;
	})
};
var Fab_default = withStyles(styles, { name: "MuiFab" })(Fab);
//#endregion
//#region node_modules/@material-ui/icons/Add.js
var require_Add = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _interopRequireWildcard = require_interopRequireWildcard();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	exports.default = (0, _interopRequireDefault(require_createSvgIcon()).default)(/*#__PURE__*/ React.createElement("path", { d: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" }), "Add");
}));
//#endregion
//#region node_modules/@material-ui/icons/Remove.js
var require_Remove = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _interopRequireWildcard = require_interopRequireWildcard();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	exports.default = (0, _interopRequireDefault(require_createSvgIcon()).default)(/*#__PURE__*/ React.createElement("path", { d: "M19 13H5v-2h14v2z" }), "Remove");
}));
var sizeOptionSelect_module_default = {
	sizeItem: "sizeItem___qKXGz",
	sizeItemChecked: "sizeItemChecked___zPk0r",
	bannerProItem: "bannerProItem___WdpFA",
	bannerProItemName: "bannerProItemName___EXnh0",
	comboSection: "comboSection___S6JEX",
	strikethroughPrice: "strikethroughPrice___hXlyq",
	min: "min___YydfJ",
	checkIcon: "checkIcon___O3lPN",
	sizeItemDisabled: "sizeItemDisabled___xRJzo",
	slideIn: "slideIn___uf-Ij"
};
//#endregion
//#region source-snapshot/src/container/orderPage/sizeOptionSelect/index.js
var SizeOptionSelect = class extends import_react.Component {
	componentDidMount() {
		this.handleRenderSelected();
	}
	componentDidUpdate(prevProps) {
		const orderTypeChanged = prevProps.currentOrder?.orderType !== this.props.currentOrder?.orderType;
		if (prevProps.defaultItemSizeId !== this.props.defaultItemSizeId || orderTypeChanged || prevProps.sectionItemList !== this.props.sectionItemList) this.handleRenderSelected();
	}
	handleRenderSelected = () => {
		const { sectionItemList, changeSize, defaultItemSizeId, itemInfo, currentOrderCombo, isSingleMaxChosen, sideNavList } = this.props;
		let currentSideNav = currentOrderCombo?.find((item) => item.id === itemInfo?.sideNavId);
		const sectionInfo = getComboSectionInfo(sideNavList, itemInfo?.sideNavId);
		let orderedItemsMap = /* @__PURE__ */ new Map();
		if (sectionInfo?.mergeDisplay) (currentOrderCombo?.filter((sct) => sct.id == itemInfo?.sideNavId)?.[0]?.items).forEach((item) => {
			const iSizeInfo = item.selectedOptionList?.find((item) => item.id === -1)?.sizeInfo;
			if (iSizeInfo?.sizeId) if (orderedItemsMap.has(iSizeInfo.sizeId)) orderedItemsMap.set(iSizeInfo.sizeId, orderedItemsMap.get(iSizeInfo.sizeId) + 1);
			else orderedItemsMap.set(iSizeInfo.sizeId, 1);
		});
		let tempSizeInfo = null;
		const sizeChosen = currentSideNav?.items[0]?.selectedOptionList?.find((c) => c.id === -1)?.sizeInfo;
		const defaultItemSize = sectionItemList?.find((item) => item.sizeId === defaultItemSizeId);
		if (sizeChosen && isSingleMaxChosen && currentSideNav?.items[0]?.id && currentSideNav?.items[0]?.id === itemInfo?.id) tempSizeInfo = sizeChosen;
		else if (defaultItemSize) tempSizeInfo = defaultItemSize;
		else if (sectionItemList?.length === 1) tempSizeInfo = sectionItemList[0];
		if (sectionInfo?.mergeDisplay) {
			let tempSectionItemList = [...sectionItemList];
			if (tempSizeInfo) {
				const addLimit = tempSizeInfo.originalComboSectionSaleItem?.addLimit;
				if ((orderedItemsMap.get(tempSizeInfo?.sizeId) || 0) < addLimit) {
					tempSectionItemList = [];
					changeSize(tempSizeInfo);
				}
			}
			const nextSizeInfo = tempSectionItemList.filter((item) => {
				if (tempSizeInfo && item.sizeId === tempSizeInfo?.sizeId) return false;
				const addLimit = item.originalComboSectionSaleItem?.addLimit;
				if ((orderedItemsMap.get(item?.sizeId) || 0) < addLimit) return true;
				return false;
			});
			if (nextSizeInfo.length === 1) changeSize(nextSizeInfo[0]);
		} else if (tempSizeInfo) changeSize(tempSizeInfo);
	};
	render() {
		const { itemInfo, sideNavList, selectedItem, changeSize, sectionItemList, fixItemPrice = 0, fixItemBenefitPrice, currentOrder: { orderType }, isInFreeItem, isPromotionItem, isSpecialItem, i18n: { language }, itemSizeList, currentOrderCombo, isHasBenefit } = this.props;
		const sideNavId = itemInfo?.sideNavId;
		let finalPrice = Big(0);
		let filterSizeByOrderType = [];
		const allList = sectionItemList.filter((size) => {
			return size.type === "ALL";
		});
		if (orderType === "DINE_IN") {
			const dineInList = sectionItemList.filter((size) => {
				return size.type === "DINE_IN";
			});
			if (dineInList.length) filterSizeByOrderType = dineInList;
			else filterSizeByOrderType = allList;
		} else if (orderType === "TO_GO") {
			const togoList = sectionItemList.filter((size) => {
				return size.type === "TOGO";
			});
			if (togoList.length) filterSizeByOrderType = togoList;
			else filterSizeByOrderType = allList;
		} else if (orderType === "PICK_UP") {
			const pickUpList = sectionItemList.filter((size) => {
				return size.type === "PICKUP";
			});
			if (pickUpList.length) filterSizeByOrderType = pickUpList;
			else filterSizeByOrderType = allList;
		}
		const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
		let orderedItems = [];
		if (sectionInfo?.mergeDisplay) orderedItems = currentOrderCombo?.filter((sct) => sct.id == sideNavId)?.[0]?.items;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: sizeOptionSelect_module_default.comboSection,
			children: filterSizeByOrderType?.map((itemInfo) => {
				const showBenefitPrice = !isInFreeItem && !isPromotionItem && !isSpecialItem && (shouldShowBenefitPrice(itemInfo.benefitPrice, isHasBenefit) || shouldShowBenefitPrice(fixItemBenefitPrice, isHasBenefit));
				const OriginalPrice = showBenefitPrice ? "del" : "span";
				let itemInfoName = "";
				let itemInfoPrice = "";
				let isLimitReached = false;
				if (itemInfo.size) {
					itemInfoName = `${getItemSizeName(itemInfo.sizeId, itemInfo.size, itemSizeList, language)}`;
					if (itemInfo.price) if (sideNavId) if (sectionInfo?.priceRule === "FIXED_PRICE") itemInfoPrice = "0.00";
					else itemInfoPrice = itemInfo.price;
					else itemInfoPrice = itemInfo.price;
					if (sectionInfo?.mergeDisplay) {
						const addLimit = itemInfo.originalComboSectionSaleItem?.addLimit;
						if (orderedItems?.filter((item) => {
							if ((item.selectedOptionList?.find((item) => item.id === -1)?.sizeInfo)?.sizeId === itemInfo.sizeId) return true;
						})?.length >= addLimit) isLimitReached = true;
					}
				} else itemInfoName = getItemOptionName(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: [
						sizeOptionSelect_module_default.sizeItem,
						selectedItem?.sizeId === itemInfo.sizeId && sizeOptionSelect_module_default.sizeItemChecked,
						isLimitReached && sizeOptionSelect_module_default.sizeItemDisabled
					].join(" "),
					onClick: () => changeSize(itemInfo, { isLimitReached }),
					children: [selectedItem?.sizeId === itemInfo.sizeId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
						type: "check",
						size: 5.5,
						className: sizeOptionSelect_module_default.checkIcon
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: sizeOptionSelect_module_default.bannerProItem,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: sizeOptionSelect_module_default.bannerProItemName,
							children: itemInfoName
						}), isInFreeItem || isPromotionItem ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "$0.00" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: BenefitPrice_module_default.priceGroup,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OriginalPrice, { children: ["$", finalPrice?.plus(itemInfoPrice || 0)?.plus(fixItemPrice || 0)?.toFixed(2)] }),
								showBenefitPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: Big(Number.isFinite(itemInfo.benefitPrice) ? itemInfo.benefitPrice : itemInfoPrice || 0).plus(fixItemBenefitPrice ?? fixItemPrice).toNumber() }),
								itemInfo?.strikethroughPrice !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: sizeOptionSelect_module_default.strikethroughPrice,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "$" }), itemInfo.strikethroughPrice.toFixed(2)]
								})
							]
						})]
					})]
				}, itemInfo.id ?? itemInfo.sizeId);
			})
		});
	}
};
function mapStateToProps$2(state, ownProps) {
	return {
		itemSizeList: state.itemSizeList,
		sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
		currentOrder: state.currentOrder,
		currentOrderCombo: state.currentOrderCombo,
		isHasBenefit: state.crm?.isHasBenefit
	};
}
var sizeOptionSelect_default = connect(mapStateToProps$2)(withTranslation()(SizeOptionSelect));
var ItemOptionSelectWithSub_module_default = {
	title: "title___HcmNY",
	ruleTip: "ruleTip___rit1t",
	titlePrice: "titlePrice___7OLb2",
	required: "required___hVO3t",
	require: "require___rZMb6",
	itemCardList: "itemCardList___Vm5Lv",
	itemCard: "itemCard___uZ9Ed",
	itemName: "itemName___ybqHX",
	actived: "actived___PMXV8",
	itemPrice: "itemPrice___rEwMP",
	multiItem: "multiItem___MZzGR",
	wrappedItem: "wrappedItem___m-ph5",
	disabled: "disabled___N43yA",
	priceText: "priceText___7Unkn",
	checkIcon: "checkIcon___njIgb",
	soldOut: "soldOut___cIQsk",
	stockNum: "stockNum___tNV7H",
	priceContainer: "priceContainer___SxBzO"
};
var index_module_default$1 = {
	rightCounter: "rightCounter___4meW3",
	counterBtnSubtract: "counterBtnSubtract___pAEtL",
	counterBtnAdd: "counterBtnAdd___74JLZ",
	optionMode: "optionMode___dFLrf",
	disableCounter: "disableCounter___uWLDt",
	counterIcon: "counterIcon___Hr1Tx",
	plusVersionBg: "plusVersionBg___3Urky",
	counterNum: "counterNum___flX3W"
};
//#endregion
//#region node_modules/@material-ui/icons/Delete.js
var require_Delete = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _interopRequireWildcard = require_interopRequireWildcard();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	exports.default = (0, _interopRequireDefault(require_createSvgIcon()).default)(/*#__PURE__*/ React.createElement("path", { d: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" }), "Delete");
}));
//#endregion
//#region source-snapshot/src/component/Counter/index.js
var import_Remove = /* @__PURE__ */ __toESM(require_Remove());
var import_Add = /* @__PURE__ */ __toESM(require_Add());
var import_Delete = /* @__PURE__ */ __toESM(require_Delete());
var Counter = class extends import_react.Component {
	render() {
		const { quantity, handleReduce, handleAdd, optionMode = false, max = 99, iconSize = 3.5, needGreyBg, plusVersion } = this.props;
		if (!quantity) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index_module_default$1.rightCounter,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: [
						index_module_default$1.counterBtnSubtract,
						optionMode && index_module_default$1.optionMode,
						needGreyBg && index_module_default$1.plusVersionBg
					].join(" "),
					style: {
						width: `${iconSize}rem`,
						height: `${iconSize}rem`
					},
					onClick: (event) => {
						event.stopPropagation();
						handleReduce();
					},
					children: quantity > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: index_module_default$1.counterIcon }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Delete.default, { className: index_module_default$1.counterIcon })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: plusVersion ? index_module_default$1.counterNum : "",
					children: quantity || null
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: [
						index_module_default$1.counterBtnAdd,
						optionMode && index_module_default$1.optionMode,
						quantity >= max && index_module_default$1.disableCounter,
						quantity < max && "animate-btn"
					].join(" "),
					style: {
						width: `${iconSize}rem`,
						height: `${iconSize}rem`
					},
					onClick: (event) => {
						event.stopPropagation();
						if (quantity >= max) return;
						handleAdd();
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: index_module_default$1.counterIcon })
				})
			]
		});
	}
};
//#endregion
//#region source-snapshot/src/container/orderPage/ItemOptionSelectWithSub/clearStoppedSubOptionCounts.js
var clearStoppedSubOptionCounts = ({ checkedCountMap, displayOptionList, itemInfo, availabilityOptions, isSubOptionUnavailable, isSubOptionSoldOut }) => {
	if (!checkedCountMap || !displayOptionList?.length || !itemInfo?.options?.length) return checkedCountMap;
	const productCenterOptionIdSet = new Set(itemInfo.options.map((option) => String(option?.id)));
	let hasChange = false;
	const next = { ...checkedCountMap };
	displayOptionList.forEach((option) => {
		if (option?.id === void 0 || !productCenterOptionIdSet.has(String(option.id))) return;
		option?.subOptions?.forEach((subOption) => {
			const optionCountMap = next[option.id];
			if (!optionCountMap?.[subOption.id]) return;
			const isUnavailableMark = isSubOptionUnavailable(itemInfo, option, subOption, availabilityOptions);
			const isSoldoutMark = isSubOptionSoldOut(itemInfo, option, subOption, availabilityOptions);
			if (isUnavailableMark || isSoldoutMark) {
				next[option.id] = {
					...optionCountMap,
					[subOption.id]: 0
				};
				hasChange = true;
			}
		});
	});
	return hasChange ? next : checkedCountMap;
};
//#endregion
//#region source-snapshot/src/container/orderPage/ItemOptionSelectWithSub/index.jsx
var maxNum = 99;
var ItemOptionSelectWithSub = (props) => {
	const [checkedCountMap, setCheckedCountMap] = (0, import_react.useState)({});
	const [hasNoSubList, setHasNoSubList] = (0, import_react.useState)([]);
	const [hasSubList, setHasSubList] = (0, import_react.useState)([]);
	const [selectedItemList, setSelectedItemList] = (0, import_react.useState)([]);
	const [ruleToastOptionId, setRuleToastOptionId] = (0, import_react.useState)(null);
	const itemNameRefList = (0, import_react.useRef)({});
	const isVertical = getDeviceOrientation() === "vertical";
	const { globalCount, optionCountMap, subOptionCountMap } = (0, import_react.useMemo)(() => {
		return Object.entries(checkedCountMap).reduce((acc, [optionId, subOptionCountObj]) => {
			Object.entries(subOptionCountObj).forEach(([subOptionId, count]) => {
				acc.optionCountMap[optionId] = (acc.optionCountMap[optionId] || 0) + count;
				acc.subOptionCountMap[subOptionId] = (acc.subOptionCountMap[subOptionId] || 0) + count;
				acc.globalCount += count;
			});
			return acc;
		}, {
			globalCount: 0,
			optionCountMap: {},
			subOptionCountMap: {}
		});
	}, [checkedCountMap]);
	const { t, i18n: { language }, sectionItemList, itemInfo, onRef, calPrice, isInFreeItem, isPromotionItem, isSpecialItem, isHasBenefit, currentOrderCombo, currentOrder, promotion, menuItemList, isSingleMaxChosen, selfConfig, parentQty = 1 } = props;
	const isComboSubDish = itemInfo?.sideNavId != null;
	const currentSideNav = (0, import_react.useMemo)(() => currentOrderCombo?.find((item) => item.id === itemInfo?.sideNavId), [currentOrderCombo, itemInfo?.sideNavId]);
	const productCenterOptionIdSet = (0, import_react.useMemo)(() => new Set((itemInfo?.options || []).map((option) => String(option?.id))), [itemInfo?.options]);
	(0, import_react.useEffect)(() => {
		return () => {
			itemNameRefList.current = {};
			onRef?.({});
		};
	}, []);
	const zeroShow = (0, import_react.useMemo)(() => {
		return selfConfig?.configMap?.id_51;
	}, [selfConfig]);
	const getNoSubList = () => {
		let sub = [];
		let pri = [];
		sectionItemList?.forEach((item) => {
			if (!item?.subOptions?.length) sub.push(item);
			else pri.push(item);
		});
		setHasNoSubList(sub);
		setHasSubList(pri);
	};
	const getCurrentItem = () => {
		let sectionDetaillist = [];
		if (isSingleMaxChosen && currentSideNav?.items[0]?.id && currentSideNav?.items[0]?.id !== itemInfo?.id) return;
		sectionDetaillist = isSingleMaxChosen ? currentSideNav?.items[0]?.selectedOptionList || [] : itemInfo?.sectionDetail || [];
		const updateOptions = (options) => {
			const countById = options?.reduce((acc, item) => {
				if (!acc[item.id]) acc[item.id] = 0;
				acc[item.id] += 1;
				return acc;
			}, {});
			options?.forEach((f) => {
				const id = f.itemOptionId || f.id;
				setCheckedCountMap((prev) => ({
					...prev,
					[id]: {
						...prev[id],
						[f.id]: countById[f.id] || 0
					}
				}));
			}, {});
		};
		const opt = sectionDetaillist?.find((c) => c.id === -2);
		if (opt?.originalOptions || opt?.options) updateOptions(opt.originalOptions || opt?.options);
		const cateOpt = sectionDetaillist?.find((c) => c.id === -3);
		if (cateOpt?.options) updateOptions(cateOpt.options);
		const CCOptions = itemInfo?.options?.map((item) => {
			return { options: item?.subOptions?.filter((sub) => sub?.defaultSelected) };
		});
		if (!sectionDetaillist.length && CCOptions?.length) CCOptions?.forEach((item) => {
			item?.options?.forEach((f) => {
				const id = f.itemOptionId || f.id;
				setCheckedCountMap((prev) => ({
					...prev,
					[id]: {
						...prev[id],
						[f.id]: f.defaultQuantity || 0
					}
				}));
			}, {});
		}, {});
	};
	(0, import_react.useEffect)(() => {
		getNoSubList();
		getCurrentItem();
	}, [sectionItemList]);
	const getLocalSelectedQtyByStock = (targetItem) => {
		let count = 0;
		for (const [strOptionId, subOptionCountObj] of Object.entries(checkedCountMap || {})) {
			const optionId = Number(strOptionId);
			const parentOption = sectionItemList?.find((c) => c.id === optionId);
			if (!parentOption) continue;
			for (const [strSubOptionId, selectedCount] of Object.entries(subOptionCountObj || {})) {
				if (!selectedCount) continue;
				const subOptionId = Number(strSubOptionId);
				const currentItem = subOptionId === parentOption.id ? parentOption : parentOption.subOptions?.find((sub) => sub.id === subOptionId);
				if (!currentItem) continue;
				if (isSameStockItem(currentItem, targetItem, menuItemList)) count += selectedCount;
			}
		}
		return count;
	};
	const getPersistedSelectedQtyByStock = (targetItem) => {
		let sectionDetailList = [];
		if (isComboSubDish && isSingleMaxChosen && currentSideNav?.items?.[0]?.id === itemInfo?.id) sectionDetailList = currentSideNav?.items?.[0]?.selectedOptionList || [];
		else sectionDetailList = itemInfo?.selectedOptionList?.length ? itemInfo.selectedOptionList : itemInfo?.sectionDetail || [];
		let count = 0;
		for (const section of sectionDetailList || []) {
			if (section?.id !== -2) continue;
			for (const option of section?.options || []) {
				const qty = option?.quantity || 1;
				if (isSameStockItem(option, targetItem, menuItemList)) count += qty;
			}
		}
		return count;
	};
	const getDisplayStockNum = (targetItem) => {
		const remainingStockNum = getRemainingStockNum({
			itemInfo: targetItem,
			itemList: currentOrder?.itemList,
			menuItemList,
			currentOrderCombo: isComboSubDish ? currentOrderCombo : [],
			promotion,
			excludePromotionRuleId: props.excludePromotionRuleId,
			excludeSequence: props.excludeSequence
		});
		if (remainingStockNum === void 0) return;
		const extraQty = parentQty || 1;
		const persistedSelectedQty = getPersistedSelectedQtyByStock(targetItem);
		const localSelectedQty = getLocalSelectedQtyByStock(targetItem);
		const localOccupiedQty = isComboSubDish ? localSelectedQty - persistedSelectedQty : localSelectedQty;
		return Math.max(remainingStockNum - localOccupiedQty * extraQty, 0);
	};
	const handleClick = (obj, mode = 1) => {
		const option = sectionItemList?.find((c) => c.id === (obj.itemOptionId || obj.id));
		if (!option) return;
		const globalMax = itemInfo.numOfItemOptionAllowed || maxNum;
		const optionMax = option.max || 1;
		const checkGlobalCountMax = (quantity, optionId) => {
			if ((optionId ? globalCount - (optionCountMap[optionId] || 0) : globalCount) + quantity > globalMax) {
				toast_default.info(t("max-up", { rplc: globalMax }), props.toastPosition);
				return false;
			}
			return true;
		};
		const checkOptionStockForPlus = (targetItem) => {
			const stockNum = getDisplayStockNum(targetItem);
			if (stockNum === void 0) return true;
			const extraQty = parentQty || 1;
			if (isInvalidStockNum(stockNum) || stockNum < extraQty) {
				showInsufficientStockToast(props.toastPosition, targetItem, menuItemList);
				return false;
			}
			return true;
		};
		if (obj.itemOptionId && optionMax === 1) if (checkedCountMap[option.id]?.[obj.id] > 0) setCheckedCountMap((prev) => ({
			...prev,
			[option.id]: { [obj.id]: 0 }
		}));
		else {
			if (!checkGlobalCountMax(1, option.id)) return;
			if (!checkOptionStockForPlus(obj)) return;
			setCheckedCountMap((prev) => ({
				...prev,
				[option.id]: { [obj.id]: 1 }
			}));
		}
		else if (mode === 1) {
			if (obj.itemOptionId && optionMax > 1) {
				if (optionCountMap[obj.itemOptionId] >= optionMax) return;
			}
			if (obj.itemOptionId && obj.addLimit > 0) {
				if (subOptionCountMap[obj.id] >= obj.addLimit) return;
			}
			if (!checkOptionStockForPlus(obj)) return;
			if (checkedCountMap[option.id]?.[obj.id] > 0) {
				if (!checkGlobalCountMax(1)) return;
				setCheckedCountMap((prev) => ({
					...prev,
					[option.id]: {
						...checkedCountMap[option.id],
						[obj.id]: checkedCountMap[option.id]?.[obj.id] + 1
					}
				}));
			} else {
				if (!checkGlobalCountMax(1)) return;
				setCheckedCountMap((prev) => ({
					...prev,
					[option.id]: {
						...checkedCountMap[option.id],
						[obj.id]: 1
					}
				}));
			}
		} else if (checkedCountMap[option.id]?.[obj.id] > 0) setCheckedCountMap((prev) => ({
			...prev,
			[option.id]: {
				...checkedCountMap[option.id],
				[obj.id]: checkedCountMap[option.id]?.[obj.id] - 1
			}
		}));
	};
	(0, import_react.useEffect)(() => {
		if (!sectionItemList || !checkedCountMap) {
			setSelectedItemList([]);
			return;
		}
		const newSelectedItemList = Object.entries(checkedCountMap).reduce((acc, [strOptionId, subOptionCountObj]) => {
			const optionId = Number(strOptionId);
			const option = sectionItemList.find((c) => c.id === optionId);
			if (!option) return acc;
			const subOptionList = Object.entries(subOptionCountObj).reduce((acc, [strSubOptionId, count]) => {
				if (count <= 0) return acc;
				const subOptionId = Number(strSubOptionId);
				const [targetItem, price] = (() => {
					if (subOptionId === optionId) return [option, option.price];
					const subOption = option.subOptions?.find((s) => s.id === subOptionId);
					return subOption ? [{
						...subOption,
						itemOption: option
					}, subOption.addPrice ?? subOption.price + option.price] : [null, 0];
				})();
				if (!targetItem) return acc;
				return acc.concat(Array.from({ length: count }, () => ({
					...targetItem,
					price,
					quantity: 1
				})));
			}, []);
			return acc.concat(subOptionList);
		}, []);
		setSelectedItemList((prev) => {
			let prevList = [...prev];
			let newList = [...newSelectedItemList];
			let resList = [];
			prevList.forEach((item) => {
				const idx = newList.findIndex((newItem) => newItem.id === item.id);
				if (idx > -1) {
					resList.push(newList[idx]);
					newList.splice(idx, 1);
				}
			});
			resList = resList.concat(newList);
			resList.reduce((acc, item) => {
				if (item.itemOptionId && !acc.includes(item.itemOptionId)) acc.push(item.itemOptionId);
				return acc;
			}, []).forEach((id) => {
				const option = sectionItemList.find((c) => c.id === id);
				let freeQuantity = option && option.freeQuantity || 0;
				for (let i = 0; freeQuantity > 0 && i < resList.length; i++) {
					const item = resList[i];
					if (item.itemOptionId === id) {
						freeQuantity--;
						item.isFreeItem = true;
					}
				}
			});
			return resList;
		});
	}, [checkedCountMap]);
	const clearSelectedItemList = () => {
		setSelectedItemList([]);
	};
	const showRuleToast = (option) => {
		if (option) {
			setRuleToastOptionId(option.id);
			const optionName = getCurrentItemLanguage(option.fieldDisplayNameGroups, language) || option.name;
			toast_default.info(t("requireDish", { name: optionName }), props.toastPosition);
		} else setRuleToastOptionId(null);
	};
	(0, import_react.useEffect)(() => {
		onRef({
			clearSelectedItemList,
			showRuleToast,
			state: { selectedItemList }
		});
		calPrice();
	}, [selectedItemList]);
	const renderItemCard = (item, isActive, isDisabled, onClick, max, isFree, parentOption) => {
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
		let displayDisabled = false;
		if (max > 1 && item.itemOptionId) displayDisabled = optionCountMap[item.itemOptionId] >= max && !subOptionCountMap[item.id] > 0;
		const price = isFree ? 0 : item.addPrice ?? item.price;
		const counterMax = Math.min(item.addLimit ?? maxNum, max - ((optionCountMap[item.itemOptionId] ?? 0) - (subOptionCountMap[item.id] ?? 0)));
		const availabilityOptions = {
			menuItemList,
			kioskSoldOutList: selfConfig?.soldOut
		};
		const isProductCenterOption = parentOption?.id !== void 0 && productCenterOptionIdSet.has(String(parentOption.id));
		const isUnavailableMark = isProductCenterOption && item && itemIsSubOptionUnavailable(itemInfo, parentOption, item, availabilityOptions);
		const isSoldoutMark = !isUnavailableMark && isProductCenterOption && item && itemIsSubOptionSoldOut(itemInfo, parentOption, item, availabilityOptions);
		const isStoppedMark = isUnavailableMark || isSoldoutMark;
		const showStockNum = selfConfig?.configMap?.id_74 !== false;
		const stockNum = showStockNum ? getDisplayStockNum(item) : void 0;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${ItemOptionSelectWithSub_module_default.itemCard} ${isActive ? ItemOptionSelectWithSub_module_default.actived : ""} ${!isStoppedMark && (isDisabled || displayDisabled) ? ItemOptionSelectWithSub_module_default.disabled : ""} ${max !== 1 || !item.itemOptionId ? ItemOptionSelectWithSub_module_default.multiItem : ""} ${isWrapped ? ItemOptionSelectWithSub_module_default.wrappedItem : ""}`,
			onClick: () => {
				if (isStoppedMark) return;
				onClick(item);
			},
			style: {
				...!item.itemOptionId && !isVertical ? {
					width: `100%`,
					margin: `0 0 2rem 0`
				} : {},
				...isStoppedMark ? { pointerEvents: "none" } : {}
			},
			children: [
				isStoppedMark && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: ItemOptionSelectWithSub_module_default.soldOut,
					children: isUnavailableMark ? t("item-unavailable") : t("sold-out")
				}),
				isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
					type: "check",
					size: 5.5,
					className: ItemOptionSelectWithSub_module_default.checkIcon
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `${ItemOptionSelectWithSub_module_default.itemPrice}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ItemOptionSelectWithSub_module_default.itemName,
						ref: itemNameRefList.current[item.id],
						children: getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name
					}), (zeroShow || price > 0 || showStockNum && stockNum !== void 0 || showBenefitPrice) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ItemOptionSelectWithSub_module_default.priceContainer,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: BenefitPrice_module_default.priceGroup,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OriginalPrice, {
								className: ItemOptionSelectWithSub_module_default.priceText,
								children: ["$", isInFreeItem || isPromotionItem ? "0.00" : price.toFixed(2)]
							}), showBenefitPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: item.benefitPrice })]
						}), showStockNum && stockNum !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ItemOptionSelectWithSub_module_default.stockNum,
							children: t("item-stock-num", { stockNum: getStockNumDisplayValue(stockNum) })
						})]
					})]
				}),
				isActive && checkedCountMap[item.itemOptionId || item.id]?.[item.id] > 0 && (max !== 1 || !item.itemOptionId) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Counter, {
					iconSize: 5.1,
					plusVersion: true,
					quantity: checkedCountMap[item.itemOptionId || item.id]?.[item.id] || 0,
					handleReduce: handleRemoveClick,
					handleAdd: handleAddClick,
					max: counterMax
				})
			]
		}, item.id);
	};
	const handleItemClick = (item, mode) => {
		handleClick(item, mode);
	};
	(0, import_react.useEffect)(() => {
		setCheckedCountMap((prev) => {
			const availabilityOptions = {
				menuItemList,
				kioskSoldOutList: selfConfig?.soldOut
			};
			return clearStoppedSubOptionCounts({
				checkedCountMap: prev,
				displayOptionList: sectionItemList,
				itemInfo,
				availabilityOptions,
				isSubOptionUnavailable: itemIsSubOptionUnavailable,
				isSubOptionSoldOut: itemIsSubOptionSoldOut
			});
		});
	}, [
		sectionItemList,
		itemInfo,
		menuItemList,
		selfConfig?.soldOut
	]);
	const renderNoSubOptions = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: ItemOptionSelectWithSub_module_default.title,
		children: t("item_option")
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: ItemOptionSelectWithSub_module_default.itemCardList,
		children: hasNoSubList?.map((item) => renderItemCard(item, checkedCountMap[item.id]?.[item.id] > 0, false, handleItemClick, itemInfo.max || 1, false, null))
	})] });
	const renderSubOptions = (itemInfo) => {
		const itemName = getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name;
		const showBenefitPrice = !isInFreeItem && !isPromotionItem && !isSpecialItem && shouldShowBenefitPrice(itemInfo.benefitPrice, isHasBenefit);
		const max = itemInfo.max || 1;
		const tip = (() => {
			let str = [];
			if (itemInfo.min > 0 && itemInfo.min === itemInfo.max) str.push(t("selectionRuleEqual", { rplc: itemInfo.min }));
			else if (itemInfo.min > 0 && itemInfo.min < itemInfo.max) {
				str.push(t("selectionRuleRange", {
					rplc1: itemInfo.min,
					rplc2: itemInfo.max
				}));
				if (itemInfo.freeQuantity > 0 && !isInFreeItem && !isPromotionItem) str.push(t("selectionRuleRangeFree", { rplc: itemInfo.freeQuantity }));
			} else if (itemInfo.max > 0) {
				str.push(t("selectionRuleMax", { rplc: itemInfo.max }));
				if (itemInfo.freeQuantity > 0 && !isInFreeItem && !isPromotionItem) str.push(t("selectionRuleRangeFree", { rplc: itemInfo.freeQuantity }));
			}
			return str.length > 0 ? str.join(", ") : "";
		})();
		const isFree = itemInfo.freeQuantity > 0 && (optionCountMap[itemInfo.id] || 0) <= itemInfo.freeQuantity;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: ItemOptionSelectWithSub_module_default.title,
			children: [
				itemName,
				showBenefitPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `${ItemOptionSelectWithSub_module_default.titlePrice} ${BenefitPrice_module_default.priceGroup}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", (itemInfo.addPrice ?? itemInfo.price).toFixed(2)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: itemInfo.benefitPrice })]
				}),
				ruleToastOptionId !== itemInfo.id && tip && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: ItemOptionSelectWithSub_module_default.ruleTip,
					children: [
						"(",
						tip,
						")"
					]
				}),
				ruleToastOptionId === itemInfo.id && tip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: ItemOptionSelectWithSub_module_default.required,
					children: `${t("required")}: ${tip || ""}`
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: ItemOptionSelectWithSub_module_default.itemCardList,
			children: itemInfo?.subOptions?.map((item) => renderItemCard(item, checkedCountMap[itemInfo.id]?.[item.id] > 0, max === 1 && Object.entries(checkedCountMap[itemInfo.id] || {}).some(([id, count]) => count > 0 && Number(id) !== item.id), handleItemClick, max, isFree, itemInfo))
		})] }, itemInfo.id);
	};
	const renderItemList = () => hasSubList?.map((itemInfo) => renderSubOptions(itemInfo));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [hasSubList.length > 0 && renderItemList(), hasNoSubList.length > 0 && renderNoSubOptions()] });
};
function mapStateToProps$1(state) {
	return {
		currentItem: state.currentItem,
		currentOrderCombo: state.currentOrderCombo,
		isHasBenefit: state.crm?.isHasBenefit,
		currentOrder: state.currentOrder,
		promotion: state.promotion,
		menuItemList: state.menuItemList,
		selfConfig: state.selfConfig
	};
}
var ItemOptionSelectWithSub_default = connect(mapStateToProps$1)(withTranslation()(ItemOptionSelectWithSub));
var fixComboOption_module_default = {
	fixComboSection: "fixComboSection___pMDvB",
	fixComboItem: "fixComboItem___0Gif7",
	content: "content___GWhWv"
};
//#endregion
//#region source-snapshot/src/container/orderPage/fixComboOption/index.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var FixComboOption = class extends import_react.Component {
	render() {
		const { i18n: { language }, sectionItemList, currentCategoryList, currentOrder } = this.props;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: fixComboOption_module_default.fixComboSection,
			children: sectionItemList.map((itemInfo) => {
				const itemName = getDishItemLanguage(itemInfo?.fieldDisplayNameGroups, language) || itemInfo.name;
				let detailItemList = [];
				const priceRule = itemInfo?.priceRule;
				itemInfo.comboSectionSaleItems.map((item) => {
					let food = (0, import_cloneDeep.default)(getComboItemDetailInfo(item.saleItemId, currentCategoryList));
					if (food) {
						let saleItemName = getDishItemLanguage(food?.fieldDisplayNameGroups, language) || food.name;
						if (priceRule == "ADJUSTABLE_PRICE") {
							let orderType = currentOrder.orderType;
							if (food?.itemPrices) {
								if (orderType == "DINE_IN") {
									let dineInList = food.itemPrices.filter((f) => f.type == "DINE_IN");
									if (dineInList.length) food.itemPrices = (0, import_cloneDeep.default)(dineInList);
									else {
										let AllList = food.itemPrices.filter((f) => f.type == "ALL");
										if (AllList.length) food.itemPrices = (0, import_cloneDeep.default)(AllList);
										else {
											delete food.itemPrices;
											food.price = food.price ? food.price : 0;
										}
									}
								} else if (orderType == "TO_GO") {
									let togoList = food.itemPrices.filter((f) => f.type == "TOGO");
									if (togoList.length) food.itemPrices = (0, import_cloneDeep.default)(togoList);
									else {
										let AllList = food.itemPrices.filter((f) => f.type == "ALL");
										if (AllList.length) food.itemPrices = (0, import_cloneDeep.default)(AllList);
										else {
											delete food.itemPrices;
											food.price = food.price ? food.price : 0;
										}
									}
								} else if (orderType == "PICK_UP") {
									let pickUpList = food.itemPrices.filter((f) => f.type == "PICKUP");
									if (pickUpList.length) food.itemPrices = (0, import_cloneDeep.default)(pickUpList);
									else {
										let AllList = food.itemPrices.filter((f) => f.type == "ALL");
										if (AllList.length) food.itemPrices = (0, import_cloneDeep.default)(AllList);
										else {
											delete food.itemPrices;
											food.price = food.price ? food.price : 0;
										}
									}
								}
							}
							if (food?.itemPrices?.length) {
								let minObj = food.itemPrices[0];
								food.itemPrices.forEach((p) => {
									if (p.price < minObj.price) minObj = p;
								});
								detailItemList.push(`${saleItemName}(x1)`);
							} else detailItemList.push(`${saleItemName}(x1)`);
						} else detailItemList.push(`${saleItemName}(x1)`);
					}
				});
				const detail = detailItemList.join(", ");
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: fixComboOption_module_default.fixComboItem,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: fixComboOption_module_default.content,
						children: [itemName, ":\xA0\xA0"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: detail })]
				}, itemInfo.id);
			})
		});
	}
};
function mapStateToProps(state) {
	return {
		currentOrder: state.currentOrder,
		currentCategoryList: state.currentCategoryList
	};
}
var fixComboOption_default = connect(mapStateToProps)(withTranslation()(FixComboOption));
//#endregion
//#region source-snapshot/src/assets/images/arrow-left.png
var arrow_left_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAABBBAMAAABP4st/AAAAGFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABWNxwqAAAAB3RSTlMAIN+AX79Q2+I70wAAAExJREFUOMtjIAIwJmCKCZVgKlMvd8BQVl5egqmsHK4QoQyoEFNZeTGmsnKDUWXDWxlDOEiolAG/OoR5owpHtMISwuULohzCLK8wyzUAfG6UUmF+9KQAAAAASUVORK5CYII=";
var index_module_default = {
	descContentWrapper: "descContentWrapper___l253K",
	titleText: "titleText___DmFKX",
	textArea: "textArea___8xntf",
	textLength: "textLength___kg6gE",
	textContent: "textContent___oFPS5",
	footerBtn: "footerBtn___KYDrR",
	btn: "btn___j0qDU",
	btnActive: "btnActive___MTLKk",
	btnNormal: "btnNormal___TH-IA"
};
//#endregion
//#region source-snapshot/src/component/DescModal/index.js
var DescModal = (props) => {
	const { visible, title, onClose, preVal, onSetVal, isMountOnBody } = props;
	const [val, setVal] = (0, import_react.useState)("");
	const [keyboardToggle, setKeyboardToggle] = (0, import_react.useState)(false);
	const inputRef = (0, import_react.useRef)();
	const { t } = useTranslation();
	(0, import_react.useEffect)(() => {
		if (visible) setVal(preVal || "");
	}, [preVal, visible]);
	const keyboardChange = (event, isVKboard = false) => {
		let value = isVKboard ? event : removeEmoji(event.target.value);
		if (!isVKboard) event.target.value = value;
		if (value.length > 255) value = value.substr(0, 255);
		setVal(value);
	};
	const showKeyboard = () => {
		setKeyboardToggle(true);
	};
	const hideKeyboard = () => {
		setKeyboardToggle(false);
	};
	const handleCancelVal = () => {
		setVal("");
		onClose();
		hideKeyboard();
	};
	const handleConfirmVal = () => {
		onSetVal(val);
		handleCancelVal();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		isMountOnBody,
		visible,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index_module_default.descContentWrapper,
			style: { top: "30%" },
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: index_module_default.titleText,
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: index_module_default.textArea,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						autoFocus: true,
						ref: inputRef,
						maxLength: 255,
						placeholder: t("noteDishPlaceholder"),
						value: val,
						className: index_module_default.textContent,
						onChange: keyboardChange,
						onClick: () => {
							if (isOpenVtkeyboadrd()) showKeyboard();
						},
						onFocus: (e) => {
							const textLen = e.target?.value?.length;
							if (textLen) e.currentTarget.setSelectionRange(textLen, textLen);
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: index_module_default.textLength,
						children: [val.length, "/255"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: index_module_default.footerBtn,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: handleCancelVal,
						className: (0, import_classnames.default)(index_module_default.btn, index_module_default.btnNormal),
						children: t("cancel")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: handleConfirmVal,
						className: (0, import_classnames.default)(index_module_default.btn, index_module_default.btnActive, "linear-animate-btn"),
						children: t("confirm")
					})]
				})
			]
		}),
		onClose: handleCancelVal
	}), keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
		keyboardValue: val,
		changeInput: (v) => keyboardChange(v, true),
		closeKeyboard: () => hideKeyboard(),
		VKOuterStyle: { zIndex: 9999 }
	}) : null] });
};
//#endregion
export { Counter as a, require_Remove as c, shouldShowBenefitPrice as d, BenefitPrice as f, ItemOptionSelectWithSub_default as i, require_Add as l, arrow_left_default as n, require_Delete as o, BenefitPrice_module_default as p, fixComboOption_default as r, sizeOptionSelect_default as s, DescModal as t, Fab_default as u };
