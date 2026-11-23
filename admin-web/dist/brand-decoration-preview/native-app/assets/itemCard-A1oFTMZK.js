import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { Di as getItemDisplayPrice, Hr as itemIsUnavailable, Mr as getStockNumDisplayValue, fr as getComboSectionInfo, gr as getItemSizeName, jr as getRemainingStockNum, mr as getDishItemLanguage, wr as judgeHasDetailInfo } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { t as ButtonBase_default } from "./ButtonBase-CpioktX3.js";
import { r as DishTag, t as PromotionTagsWrap } from "./PromotionTagsWrap-CjrBw9bq.js";
import { l as isDishTagHeightBearing, o as getVisibleItemCardProperties } from "./getItemCardProperties-CHuqwFqK.js";
import { n as imgCard_default, r as hasRealItemImage, t as star_default } from "./star-C6iOuR53.js";
import { a as Counter, d as shouldShowBenefitPrice, f as BenefitPrice, p as BenefitPrice_module_default } from "./DescModal-Q1_miAgO.js";
//#region source-snapshot/src/component/itemCard/itemCard.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var itemCard_module_default = {
	itemCard: "itemCard___w7w8x",
	soldOut: "soldOut___LiPGX",
	itemCardInner: "itemCardInner___dkZoW",
	standardItemCard: "standardItemCard___H-FN2",
	itemImage: "itemImage___3Cged",
	itemPrice: "itemPrice___SLg7A",
	preSel: "preSel___6p7Qd",
	measuredItemCard: "measuredItemCard___GOrfr",
	stockNum: "stockNum___YuZHd",
	itemName: "itemName___VVByi",
	itemProperty: "itemProperty___qiwEt",
	cardTags: "cardTags___srg4J",
	leftPrice: "leftPrice___DC-3q",
	min: "min___iTqjz",
	specialItemOriginPrice: "specialItemOriginPrice___ZiWvp",
	specialItemPrice: "specialItemPrice___FRDwM",
	priceText: "priceText___RNgui",
	discount: "discount___sPI1D",
	strikethroughPrice: "strikethroughPrice___8URV0",
	comboCard: "comboCard___fkonQ",
	reserveCounterSpace: "reserveCounterSpace___Lc69-",
	noOperationRow: "noOperationRow___mDE0u",
	singleMaxChosen: "singleMaxChosen___EdpcR",
	checkIcon: "checkIcon___lz4ZD",
	bannerProCard: "bannerProCard___e0jPp",
	simpleItemCard: "simpleItemCard___mzGPh",
	bannerProName: "bannerProName___tOiyx",
	itemDetails: "itemDetails___JOD4q",
	wrappedItem: "wrappedItem___P9LQA",
	bannerProItem: "bannerProItem___ZZIiy",
	bannerProDetailsPrice: "bannerProDetailsPrice___dUGGu",
	bannerProNameChecked: "bannerProNameChecked___K-A49",
	itemDetailsChecked: "itemDetailsChecked___8kZgT",
	bannerProPrice: "bannerProPrice___x3h99",
	simpleComboWithTags: "simpleComboWithTags___zDOBN",
	simpleComboTags: "simpleComboTags___fmQmZ",
	itemCardRippleHost: "itemCardRippleHost___dF-Hm",
	itemCardRippleHostInteractive: "itemCardRippleHostInteractive___PAzzW",
	slideIn: "slideIn___C38qG"
};
//#endregion
//#region source-snapshot/src/utils/itemCardScrollGuard.js
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var scrollDebounceTimer = null;
var clicksBlockedByScroll = false;
/** 滚动停止后多久内仍禁止卡片主点击（防抖，每次滚动重置计时） */
var SCROLL_CLICK_QUIET_MS = 200;
function notifyItemCardListScroll() {
	clicksBlockedByScroll = true;
	if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
	scrollDebounceTimer = setTimeout(() => {
		clicksBlockedByScroll = false;
		scrollDebounceTimer = null;
	}, SCROLL_CLICK_QUIET_MS);
}
function isItemCardClickBlockedAfterScroll() {
	return clicksBlockedByScroll;
}
//#endregion
//#region source-snapshot/src/component/itemCard/index.js
var import_jsx_runtime = require_jsx_runtime();
var MemoDishTag = (0, import_react.memo)(DishTag);
var ItemCard = class extends import_react.Component {
	state = { isItemNameWrapped: false };
	itemNameRef = import_react.createRef();
	cardContentRef = import_react.createRef();
	compactContentRef = import_react.createRef();
	simpleComboTagsRef = import_react.createRef();
	/** 斜对角距离，计算的是平方数，比如想限制为2px，则此处写4，滑动与轻触区分 */
	TAP_MOVE_THRESHOLD_SQ = 100;
	componentDidMount() {
		this.observeItemName();
		this.updateItemNameWrapped();
		this.observeCardContent();
		this.observeSimpleComboTags();
	}
	getSnapshotBeforeUpdate(prevProps) {
		if (!this.props.isComboType || !this.props.isSimpleMode || prevProps.itemQty > 0 === this.props.itemQty > 0) return null;
		return Array.from(this.compactContentRef.current?.children || []).map((element) => ({
			element,
			left: this.getCompactTextLeft(element)
		}));
	}
	getCompactTextLeft = (element) => {
		const range = document.createRange();
		range.selectNodeContents(element);
		return range.getBoundingClientRect().left;
	};
	animateCompactSelection = (snapshot) => {
		const content = this.compactContentRef.current;
		snapshot?.forEach(({ element, left }) => {
			if (element.parentElement !== content) return;
			element.style.transition = "none";
			element.style.transform = "none";
			const offset = left - this.getCompactTextLeft(element);
			element.style.transform = `translateX(${offset}px)`;
			element.offsetWidth;
			element.style.transition = "";
			element.style.transform = "translateX(0)";
		});
	};
	componentDidUpdate(prevProps, prevState, snapshot) {
		this.animateCompactSelection(snapshot);
		this.observeItemName();
		this.updateItemNameWrapped();
		this.observeCardContent();
		this.observeSimpleComboTags();
	}
	componentWillUnmount() {
		this.itemNameResizeObserver?.disconnect();
		this.cardContentResizeObserver?.disconnect();
		this.simpleComboTagsResizeObserver?.disconnect();
		window.cancelAnimationFrame(this.cardContentFrame);
		window.removeEventListener("resize", this.scheduleCardHeight);
		window.removeEventListener("resize", this.updateItemNameWrapped);
		window.removeEventListener("resize", this.updateSimpleComboTagsHeight);
		this.teardownPointerTracking();
	}
	updateItemNameWrapped = () => {
		const element = this.itemNameRef.current;
		if (!element) return;
		const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
		const isItemNameWrapped = Number.isFinite(lineHeight) ? element.scrollHeight > lineHeight + 1 : element.scrollHeight > element.clientHeight;
		if (isItemNameWrapped !== this.state.isItemNameWrapped) this.setState({ isItemNameWrapped });
	};
	updateSimpleComboTagsHeight = () => {
		const element = this.simpleComboTagsRef.current;
		if (!element) return;
		this.compactContentRef.current?.parentElement?.style.setProperty("--simple-combo-tags-height", `${element.getBoundingClientRect().height}px`);
	};
	observeSimpleComboTags = () => {
		const element = this.simpleComboTagsRef.current;
		if (element !== this.observedSimpleComboTags) {
			this.simpleComboTagsResizeObserver?.disconnect();
			window.removeEventListener("resize", this.updateSimpleComboTagsHeight);
			this.observedSimpleComboTags = element;
			if (element) if (window.ResizeObserver) {
				this.simpleComboTagsResizeObserver = new window.ResizeObserver(this.updateSimpleComboTagsHeight);
				this.simpleComboTagsResizeObserver.observe(element);
			} else window.addEventListener("resize", this.updateSimpleComboTagsHeight);
		}
		this.updateSimpleComboTagsHeight();
	};
	scheduleCardHeight = () => {
		if (!this.props.onCardHeightChange) return;
		window.cancelAnimationFrame(this.cardContentFrame);
		this.cardContentFrame = window.requestAnimationFrame(() => {
			const element = this.cardContentRef.current;
			if (!element) return;
			const height = Array.from(element.children).reduce((total, child) => total + child.getBoundingClientRect().height, 0);
			this.props.onCardHeightChange?.(height);
		});
	};
	observeCardContent = () => {
		const children = Array.from(this.cardContentRef.current?.children || []);
		if (children.length !== this.observedCardChildren?.length || children.some((child, index) => child !== this.observedCardChildren[index])) {
			this.cardContentResizeObserver?.disconnect();
			window.removeEventListener("resize", this.scheduleCardHeight);
			this.observedCardChildren = children;
			if (children.length) if (window.ResizeObserver) {
				this.cardContentResizeObserver = new window.ResizeObserver(this.scheduleCardHeight);
				children.forEach((child) => this.cardContentResizeObserver.observe(child));
			} else window.addEventListener("resize", this.scheduleCardHeight);
		}
		this.scheduleCardHeight();
	};
	observeItemName = () => {
		const element = this.itemNameRef.current;
		if (element === this.observedItemName) return;
		this.itemNameResizeObserver?.disconnect();
		this.observedItemName = element;
		window.removeEventListener("resize", this.updateItemNameWrapped);
		if (!element) return;
		if (!window.ResizeObserver) {
			window.addEventListener("resize", this.updateItemNameWrapped);
			return;
		}
		this.itemNameResizeObserver = new window.ResizeObserver(this.updateItemNameWrapped);
		this.itemNameResizeObserver.observe(element);
	};
	teardownPointerTracking = () => {
		if (this._pointerGestureEnd) {
			window.removeEventListener("pointermove", this._pointerGestureMove, true);
			window.removeEventListener("pointerup", this._pointerGestureEnd, true);
			window.removeEventListener("pointercancel", this._pointerGestureEnd, true);
			this._pointerGestureMove = null;
			this._pointerGestureEnd = null;
		}
	};
	handlePointerDown = (e) => {
		if (!this.props.onClick) return;
		if (e.button != null && e.button !== 0) return;
		this.teardownPointerTracking();
		const startX = e.clientX;
		const startY = e.clientY;
		let tapMoved = false;
		const thresholdSq = this.TAP_MOVE_THRESHOLD_SQ;
		this._pointerGestureMove = (ev) => {
			const dx = ev.clientX - startX;
			const dy = ev.clientY - startY;
			if (dx * dx + dy * dy > thresholdSq) tapMoved = true;
		};
		this._pointerGestureEnd = () => {
			this.teardownPointerTracking();
			this._tapMoved = tapMoved;
		};
		window.addEventListener("pointermove", this._pointerGestureMove, true);
		window.addEventListener("pointerup", this._pointerGestureEnd, true);
		window.addEventListener("pointercancel", this._pointerGestureEnd, true);
	};
	tryFireItemClick = (isStoppedMark) => {
		if (isStoppedMark || !this.props.onClick) return;
		if (this._tapMoved) {
			this._tapMoved = false;
			return;
		}
		if (isItemCardClickBlockedAfterScroll()) return;
		this.props.onClick();
	};
	renderDiscount = (price, strikethroughPrice) => {
		if (strikethroughPrice === void 0 || strikethroughPrice === null || price === void 0 || price === null) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: itemCard_module_default.discount,
			children: "-" + ((strikethroughPrice - price) / strikethroughPrice).toFixed(2) * 100 + "%"
		}) });
	};
	renderPrice = (price, isShowIcon) => {
		if (price === void 0 || price === null) return;
		const { isComboType, selfConfig } = this.props;
		const zeroShow = selfConfig?.configMap?.id_51;
		if (!isComboType) {
			if (!(zeroShow || price > 0 || isShowIcon)) return;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: price.toFixed(2) })] });
		}
		return isShowIcon || price > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: price.toFixed(2) })] }) : null;
	};
	hasBenefitPrice = (benefitPrice) => {
		const { itemInfo, isInFreeItem, isPromotionItem, isSpecialItem, isHasBenefit } = this.props;
		return shouldShowBenefitPrice(benefitPrice, isHasBenefit) && !itemInfo.isFreeItem && !isInFreeItem && !isPromotionItem && !isSpecialItem;
	};
	renderItemPrice = (displayPrices, showStrikethroughPrice = true) => {
		const { price, isShowIcon, benefitPrice, benefitIsShowIcon } = displayPrices;
		const { itemInfo } = this.props;
		if (this.hasBenefitPrice(benefitPrice)) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: BenefitPrice_module_default.priceGroup,
			children: [price !== void 0 && price !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: [`$${price.toFixed(2)}`, isShowIcon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
				className: itemCard_module_default.min,
				children: "+"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: BenefitPrice_module_default.benefitPrice,
				style: { gap: 0 },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice }), benefitIsShowIcon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
					className: itemCard_module_default.min,
					children: "+"
				})]
			})]
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			this.renderDiscount(itemInfo.price, itemInfo.strikethroughPrice),
			this.renderPrice(price, isShowIcon),
			isShowIcon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
				className: itemCard_module_default.min,
				children: "+"
			}),
			showStrikethroughPrice && itemInfo?.strikethroughPrice != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: itemCard_module_default.strikethroughPrice,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$" }), itemInfo.strikethroughPrice.toFixed(2)]
			})
		] });
	};
	renderPromotionTags = () => {
		const { isComboType, itemInfo, promotion, promotionIndex, onCardHeightChange } = this.props;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromotionTagsWrap, {
			itemInfo,
			promotion,
			promotionIndex,
			isComboType,
			onHeightChange: onCardHeightChange ? this.scheduleCardHeight : void 0
		});
	};
	renderCardTags = (property) => {
		const tags = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [property.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: itemCard_module_default.itemProperty,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoDishTag, { tagsInfo: property })
		}), this.renderPromotionTags()] });
		return this.props.onCardHeightChange ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: itemCard_module_default.cardTags,
			children: tags
		}) : tags;
	};
	renderPoint = (point, isComboType) => {
		const { isInFreeItem, t } = this.props;
		if (isComboType) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "0.00" })] });
		else if (isInFreeItem && point > 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: star_default,
			alt: "point"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: `${point} ${t("pts")}` })] });
		return null;
	};
	render() {
		const { t, i18n: { language }, isComboType, isThumbPath, currentOrder, itemInfo, currentCategoryList, selfConfig, isSimpleMode, isInFreeItem, isPromotionItem, isSpecialItem, menuItemList, sideNavList, sideNavId, currentOrderCombo, isSoldoutMark, isUnavailableMark: propsUnavailableMark } = this.props;
		const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
		const priceRule = sectionInfo?.priceRule;
		const orderItem = currentOrderCombo?.find((item) => item.id === sideNavId)?.items;
		const orderItemQty = orderItem?.length ?? 0;
		const currentOrderItemQty = orderItem?.filter((item) => item.id === itemInfo.id)?.length ?? 0;
		let addLimit;
		if (sectionInfo) if (sectionInfo.mergeDisplay && itemInfo.itemPrices?.length) addLimit = itemInfo.itemPrices.reduce((acc, item) => {
			let _addLimit = item.originalComboSectionSaleItem?.addLimit;
			if (_addLimit) if (acc) acc = acc + _addLimit;
			else acc = _addLimit;
			return acc;
		}, void 0);
		else addLimit = sectionInfo.comboSectionSaleItems?.find((item) => item.saleItemId === itemInfo.id)?.addLimit;
		const counterMax = isComboType ? priceRule === "FIXED_UNTIL_MAX" ? addLimit > 0 ? addLimit : Infinity : Math.min(addLimit ?? sectionInfo?.maxNumOfSelectionAllowed, sectionInfo?.maxNumOfSelectionAllowed - (orderItemQty - currentOrderItemQty)) : void 0;
		const isMaxNumLimit = sectionInfo?.itemSelectionRule === "MAX_NUM_LIMIT" || addLimit > 0;
		const isSingleMaxChosen = sectionInfo?.maxNumOfSelectionAllowed === 1 && priceRule !== "FIXED_UNTIL_MAX";
		const isImageSingleCombo = isComboType && hasRealItemImage(itemInfo) && !isSimpleMode && isSingleMaxChosen;
		const isHasDetail = judgeHasDetailInfo(itemInfo, isComboType);
		const itemNumber = itemInfo.itemNumber;
		let itemName = getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name;
		let sizeName = "";
		if (isComboType && itemInfo?.itemPrices?.length === 1) {
			sizeName = getItemSizeName(itemInfo.itemPrices[0]?.sizeId, itemInfo.itemPrices[0]?.size, this.props?.itemSizeList, language);
			itemName += `(${sizeName})`;
		}
		const showStockNum = selfConfig?.configMap?.id_74 !== false;
		const stockNum = showStockNum ? getRemainingStockNum({
			itemInfo,
			itemList: currentOrder?.itemList,
			menuItemList,
			currentOrderCombo,
			crm: this.props.crm,
			promotion: this.props.promotion
		}) : void 0;
		const displayPrices = getItemDisplayPrice({
			itemInfo,
			isComboType,
			currentOrder,
			currentCategoryList,
			sideNavList,
			sideNavId,
			currentOrderCombo,
			useInitialPrice: !isComboType && !itemInfo.isFreeItem && !isInFreeItem && !isPromotionItem && !isSpecialItem && !itemInfo.isPromotionItem && !itemInfo.isSpecialItem,
			isInFreeItem,
			isPromotionItem,
			isSpecialItem
		});
		const { price, isShowIcon } = displayPrices;
		const property = getVisibleItemCardProperties({
			itemInfo,
			selfConfig
		});
		const showBenefitPrice = this.hasBenefitPrice(displayPrices.benefitPrice);
		const hasBodyTags = property.some(isDishTagHeightBearing);
		const simpleNoProperty = isSimpleMode && (isComboType || !hasBodyTags);
		const showSimpleComboTags = isComboType && isSimpleMode && property.length > 0;
		const canShowCounter = !isSingleMaxChosen || isMaxNumLimit && isHasDetail || isImageSingleCombo;
		const pointContent = this.renderPoint(itemInfo.itemPoints, isComboType);
		const discountContent = this.renderDiscount(itemInfo.price, itemInfo.strikethroughPrice);
		const priceContent = this.renderPrice(price, isShowIcon);
		const hasStrikePrice = itemInfo.strikethroughPrice != null;
		const hasPriceContent = isInFreeItem || isPromotionItem ? Boolean(pointContent) : Boolean(showBenefitPrice || discountContent || priceContent || isShowIcon || hasStrikePrice);
		const renderedPrice = isInFreeItem || isPromotionItem ? pointContent : this.renderItemPrice(displayPrices);
		const showOperationRow = !isComboType || hasPriceContent || canShowCounter;
		const isWrapped = this.state.isItemNameWrapped;
		const isUnavailableMark = propsUnavailableMark !== void 0 ? propsUnavailableMark : itemIsUnavailable(itemInfo);
		const isStoppedMark = isUnavailableMark || isSoldoutMark;
		const { onClick } = this.props;
		const rippleEnabled = Boolean(onClick) && !isStoppedMark;
		const counter = this.props.itemQty > 0 && canShowCounter ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Counter, {
			iconSize: 5.1,
			needGreyBg: true,
			plusVersion: true,
			quantity: this.props.itemQty,
			handleReduce: () => this.props.onQtyClicked(),
			handleAdd: () => this.tryFireItemClick(isStoppedMark),
			max: isInFreeItem && !isComboType || isSingleMaxChosen && isMaxNumLimit || isImageSingleCombo ? 1 : !isSingleMaxChosen && isMaxNumLimit ? counterMax : void 0
		}) : null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: (0, import_classnames.default)(itemCard_module_default.itemCard, this.props.onCardHeightChange && itemCard_module_default.measuredItemCard, isSimpleMode && itemCard_module_default.simpleItemCard, showSimpleComboTags && itemCard_module_default.simpleComboWithTags, isComboType && itemCard_module_default.comboCard, isComboType && !simpleNoProperty && !showOperationRow && itemCard_module_default.noOperationRow, !isComboType && !simpleNoProperty && itemCard_module_default.standardItemCard, isComboType && this.props.itemQty > 0 && itemCard_module_default.singleMaxChosen, simpleNoProperty && itemCard_module_default.bannerProCard),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ButtonBase_default, {
				component: "div",
				tabIndex: -1,
				focusRipple: false,
				disableRipple: !rippleEnabled,
				className: (0, import_classnames.default)(itemCard_module_default.itemCardRippleHost, rippleEnabled && itemCard_module_default.itemCardRippleHostInteractive),
				onPointerDown: this.handlePointerDown,
				onClick: () => this.tryFireItemClick(isStoppedMark),
				children: [isStoppedMark && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: itemCard_module_default.soldOut,
					children: isUnavailableMark ? t("item-unavailable") : t("sold-out")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: itemCard_module_default.itemCardInner,
					ref: this.props.onCardHeightChange ? this.cardContentRef : void 0,
					onLoadCapture: this.props.onCardHeightChange ? this.scheduleCardHeight : void 0,
					children: [isThumbPath ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: itemCard_module_default.itemImage,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
							selfConfig,
							itemInfo,
							deferLoad: this.props.deferImages,
							lazy: this.props.lazyImages
						}), showStockNum && stockNum !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: itemCard_module_default.stockNum,
							children: t("item-stock-num", { stockNum: getStockNumDisplayValue(stockNum) })
						})]
					}) : null, simpleNoProperty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [!isComboType && property.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoDishTag, { tagsInfo: property }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: (0, import_classnames.default)(isSingleMaxChosen ? itemCard_module_default.bannerProName : itemCard_module_default.itemDetails, this.props.itemQty > 0 && (isSingleMaxChosen ? itemCard_module_default.bannerProNameChecked : itemCard_module_default.itemDetailsChecked), isWrapped && itemCard_module_default.wrappedItem),
						children: [
							this.props.itemQty > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
								type: "check",
								size: 5.5,
								className: itemCard_module_default.checkIcon
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								ref: this.compactContentRef,
								className: isSingleMaxChosen ? itemCard_module_default.bannerProItem : itemCard_module_default.bannerProDetailsPrice,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: itemCard_module_default.itemName,
										ref: this.itemNameRef,
										children: [!isSingleMaxChosen && selfConfig?.configMap?.id_16 && itemNumber ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [itemNumber, "."] }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: itemName })]
									}),
									showSimpleComboTags && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: itemCard_module_default.simpleComboTags,
										ref: this.simpleComboTagsRef,
										onLoadCapture: this.updateSimpleComboTagsHeight,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoDishTag, {
											tagsInfo: property,
											isItemCard: false,
											textTagStyle: {
												fontSize: "1.4rem",
												padding: "0.4rem",
												margin: "0 0.4rem 0.4rem 0"
											},
											imgTagStyle: {
												height: "2rem",
												margin: "0 0.4rem 0.4rem 0"
											}
										})
									}),
									(hasPriceContent || showStockNum && stockNum !== void 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: itemCard_module_default.bannerProPrice,
										children: [hasPriceContent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: itemCard_module_default.priceText,
											children: renderedPrice
										}), showStockNum && stockNum !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: itemCard_module_default.stockNum,
											children: t("item-stock-num", { stockNum: getStockNumDisplayValue(stockNum) })
										})]
									})
								]
							}),
							counter
						]
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: itemCard_module_default.itemName,
							children: [selfConfig?.configMap?.id_16 && itemNumber ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [itemNumber, "."] }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: itemName })]
						}),
						this.renderCardTags(property),
						showOperationRow && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: (0, import_classnames.default)(itemCard_module_default.itemPrice, isComboType && canShowCounter && itemCard_module_default.reserveCounterSpace),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: itemCard_module_default.leftPrice,
								children: renderedPrice
							}), counter]
						})
					] })]
				})]
			})
		});
	}
};
var itemCard_default = connect((state) => ({
	isHasBenefit: state.crm.isHasBenefit,
	promotion: state.promotion
}))(withTranslation()(ItemCard));
//#endregion
export { notifyItemCardListScroll as n, itemCard_default as t };
