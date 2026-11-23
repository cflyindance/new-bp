import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { D as posFrontLog, K as serverURL, W as removeEmoji, a as getDeviceOrientation } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { $i as floatNumberRounding, Qi as Big, Rr as getItemStoppedStatus, Z as removeFootItemComboSection, Zi as getItemPrice, a as addItem2ComboSection, da as require_cloneDeep, et as removeItemFromComboSection, fr as getComboSectionInfo, lt as replaceComboOrder, mr as getDishItemLanguage, or as setTempCampaign, pr as getCurrentItemLanguage, r as addCombo2Order, ra as observeLayoutSize, sr as allRangHandler, tt as removeItemFromOrder, u as changeDefaultDish, ur as calcColNum, vr as getOneUncompletedSection, wi as getPromotionModalDisplayPrice, wr as judgeHasDetailInfo, xr as judegStepIsHasMustDish, yr as judegIsComboStatusAndIsPreSelected, zi as getItemActualPrices, zr as itemIsSoldOut } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { t as require_debounce } from "./debounce-BPwiJQPb.js";
import { t as require_isEqual } from "./isEqual-PfNrN1Me.js";
import { i as handleCheckFreeItem, t as checkIsCampaignValid } from "./checkCRMIntegrationCampaign-Bubup5KG.js";
import { i as VariableSizeList } from "./PromotionTagsWrap-CjrBw9bq.js";
import { d as remToPx } from "./getItemCardProperties-CHuqwFqK.js";
import { i as probeComboItemImages, n as imgCard_default, r as hasRealItemImage } from "./star-C6iOuR53.js";
import { c as require_Remove, d as shouldShowBenefitPrice, f as BenefitPrice, l as require_Add, p as BenefitPrice_module_default, t as DescModal, u as Fab_default } from "./DescModal-Q1_miAgO.js";
import { n as notifyItemCardListScroll, t as itemCard_default } from "./itemCard-A1oFTMZK.js";
import { a as ComboOptionItem_default, i as noActivityTag_default, n as comboSelectionModal_default, o as comboSizeSelect_default, r as ComboCateyOptionItem_default, t as getComboSectionItem } from "./getComboSectionItem-BQc55mkq.js";
import { t as comboItemsDetailModal_default } from "./comboItemsDetailModal-W9qdOX-Y.js";
import { t as BottomToast } from "./bottomToast-B74lRND-.js";
import { t as setComboItemBasePrice } from "./setComboItemBasePrice-B4XHluz0.js";
//#region source-snapshot/src/container/comboPanel/fullComboPanel/fullComboPanel.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var fullComboPanel_module_default = {
	comboStepBox: "comboStepBox___ko7Yj",
	sctHeaderContainer: "sctHeaderContainer___8ZRaS",
	fullComboPanel: "fullComboPanel___ZR7l-",
	seeMore: "seeMore___G0pRm",
	moreIcon: "moreIcon___ILv8u",
	footBtnBox: "footBtnBox___OptZw"
};
var sidenav_module_default = {
	sideNav: "sideNav___9Tmbl",
	sectionInfo: "sectionInfo___6zlJd",
	sectionName: "sectionName___7A3Tg",
	noAllow: "noAllow___XT0CI",
	rangTip: "rangTip___pR--l",
	mustDish: "mustDish___UB4sB",
	sectionInfoSelected: "sectionInfoSelected___Dy3fb",
	incompleted: "incompleted___cCOLq",
	sideBtnBox: "sideBtnBox___Z5Jmv",
	btnPrev: "btnPrev___jdRW8",
	btnNext: "btnNext___CT1YM",
	noActivedPrev: "noActivedPrev___rTZuY",
	noActivedNext: "noActivedNext___fKIdM",
	activedPrev: "activedPrev___4EO7q",
	activedNext: "activedNext___cTvYy"
};
//#endregion
//#region source-snapshot/src/component/sidenav/index.js
var import_jsx_runtime = require_jsx_runtime();
var SideNav = class extends import_react.Component {
	judegStepCanRepeated = (sideNavId) => {
		const { sideNavList } = this.props;
		return getComboSectionInfo(sideNavList, sideNavId)?.allowRepeatedItems;
	};
	handleLeftOneStep = (idx) => {
		const { sideNavList } = this.props;
		this.props.setCurSectionId(idx, sideNavList);
		this.props.handleChildUpTop(idx);
	};
	render() {
		const { t, i18n: { language }, sideNavList, sectionIndex, currentOrderCombo, isInFreeItem, isPromotionItem } = this.props;
		let chooseTipMap = allRangHandler(sideNavList, t, {
			isInFreeItem,
			isPromotionItem
		});
		let o = judegStepIsHasMustDish(sideNavList, currentOrderCombo);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.default.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			id: "sideNavId",
			className: sidenav_module_default.sideNav,
			children: (sideNavList || []).map((section, index) => {
				let sectionName = section.name;
				if (section.id == -1) {
					if (section?.info) sectionName = getDishItemLanguage(section.info.fieldDisplayNameGroups, language) || section.name;
				} else if (section.id == -3) sectionName = t("item_option");
				else if (section?.fieldDisplayNameGroups?.length) sectionName = getCurrentItemLanguage(section.fieldDisplayNameGroups, language) || section.name;
				let isHasMustDish = section.id > 0 && ![-98, -99].includes(section.id) && !o[section.id];
				this.judegStepCanRepeated(section.id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					name: "section",
					className: [sidenav_module_default.sectionInfo, index === sectionIndex ? sidenav_module_default.sectionInfoSelected : ""].join(" "),
					onClick: () => {
						this.handleLeftOneStep(index);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: sidenav_module_default.sectionName,
							children: sectionName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: sidenav_module_default.rangTip,
							children: chooseTipMap[section.id] || ""
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { display: isHasMustDish ? "block" : "none" },
							className: sidenav_module_default.mustDish,
							children: [
								"(",
								t("must-select-pre-dish"),
								")"
							]
						})
					]
				}, section.id);
			})
		}) });
	}
};
function mapStateToProps$4(state, ownProps) {
	return {
		sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
		currentOrderCombo: state.currentOrderCombo
	};
}
var sidenav_default = connect(mapStateToProps$4)(withTranslation()(SideNav));
var generalUsePanel_module_default = {
	panelBox: "panelBox___YXLru",
	preMeasureBox: "preMeasureBox___kn2xO",
	comboItemsTitle: "comboItemsTitle___ABaj9",
	sectionName: "sectionName___Wv1nu",
	required: "required___-OQXH",
	require: "require___c2WvV",
	comboItemsRule: "comboItemsRule___cm1W4",
	noAllow: "noAllow___rU6Ty",
	comboItemsMust: "comboItemsMust___1O01B",
	comboItemsBox: "comboItemsBox___Z5zcg",
	comboItemsList: "comboItemsList___QbMCw",
	comboItems: "comboItems___fVYln",
	simpleModeItems: "simpleModeItems___-qKMR",
	disabled: "disabled___JfAib",
	optInfo: "optInfo___V-QnQ",
	optDisabled: "optDisabled___r-1wB"
};
var comboItem_module_default = {
	comboItemsTitle: "comboItemsTitle___WfmPk",
	contentTopBox: "contentTopBox___qEmO-",
	maxNote: "maxNote___G2kYL",
	leftBox: "leftBox___-T-cW",
	rightBox: "rightBox___MXRO9",
	title: "title___kk05a",
	required: "required___Hbalz",
	require: "require___RXrEp",
	sub: "sub___G97RV",
	noSize: "noSize___NSIGs",
	word: "word___0mouT",
	wordSize: "wordSize___L9Jtz",
	wordOption: "wordOption___ia21k",
	singlePrice: "singlePrice___M--gQ",
	textContent: "textContent___48QWT",
	iconEmpty: "iconEmpty___q9Dv5",
	areaImg: "areaImg___KPOMJ",
	area: "area___pis-Z",
	areaDetail: "areaDetail___zqCzv",
	point: "point___XXS-v",
	titleWithRequired: "titleWithRequired___IZ7VS",
	areaFixCombo: "areaFixCombo___Z0Kyn"
};
//#endregion
//#region source-snapshot/src/container/comboPanel/fullComboPanel/buildComboSizeList.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
function buildComboSizeList(currentItem, currentOrder) {
	const itemPrices = currentItem?.itemPrices || [];
	if (!itemPrices.length) return [];
	const orderType = currentOrder?.orderType;
	if (orderType === "DINE_IN") {
		const dineInList = itemPrices.filter((f) => f?.type === "DINE_IN");
		if (dineInList.length) return (0, import_cloneDeep.default)(dineInList);
		const allList = itemPrices.filter((f) => f?.type === "ALL");
		return allList.length ? (0, import_cloneDeep.default)(allList) : [];
	}
	if (orderType === "TO_GO") {
		const togoList = itemPrices.filter((f) => f?.type === "TOGO");
		if (togoList.length) return (0, import_cloneDeep.default)(togoList);
		const allList = itemPrices.filter((f) => f?.type === "ALL");
		return allList.length ? (0, import_cloneDeep.default)(allList) : [];
	}
	if (orderType === "PICK_UP") {
		const pickUpList = itemPrices.filter((f) => f?.type === "PICKUP");
		if (pickUpList.length) return (0, import_cloneDeep.default)(pickUpList);
		const allList = itemPrices.filter((f) => f?.type === "ALL");
		return allList.length ? (0, import_cloneDeep.default)(allList) : [];
	}
	return [];
}
//#endregion
//#region source-snapshot/src/container/comboPanel/fullComboPanel/comboItem/index.js
var ComboItem = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			keyboardToggle: false,
			comboSizeList: buildComboSizeList(props.currentItem, props.currentOrder)
		};
		this.flag = false;
		this.comboSizeKey = this.getComboSizeKey(props.currentItem, props.currentOrder);
	}
	getComboSizeKey = (currentItem, currentOrder) => {
		const orderType = currentOrder?.orderType || "";
		return `${currentItem?.id || currentItem?.itemId || ""}__${orderType}__${(currentItem?.itemPrices || []).map((p) => `${p?.id || ""}:${p?.type || ""}:${p?.size || ""}`).join("|")}`;
	};
	syncComboSizeListIfNeeded = () => {
		const { currentItem, currentOrder } = this.props;
		const nextKey = this.getComboSizeKey(currentItem, currentOrder);
		if (nextKey && nextKey !== this.comboSizeKey) {
			const nextList = buildComboSizeList(currentItem, currentOrder);
			this.comboSizeKey = nextKey;
			this.setState({ comboSizeList: nextList });
		}
	};
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
		this.syncComboSizeListIfNeeded();
	}
	componentDidUpdate(prevProps, prevState) {
		if (!!(String(this.state.keyboardValue).length >= 255) && this.maxNoteRef) this.maxNoteRef.scrollIntoViewIfNeeded(true);
		if (this.state.keyboardToggle != prevState.keyboardToggle) if (this.state.keyboardToggle) {
			const scrollTarget = this.props.scrollContainerRef?.current;
			if (scrollTarget) {
				this.keyboardScrollTarget = scrollTarget;
				this.keyboardScrollMaxHeight = scrollTarget.style.maxHeight;
				scrollTarget.style.maxHeight = "calc(100vh - 380px)";
			}
			this.inputRef.scrollIntoViewIfNeeded(true);
		} else this.restoreKeyboardScrollHeight();
		if (prevProps.currentOrder?.orderType !== this.props.currentOrder?.orderType || prevProps.currentItem?.id !== this.props.currentItem?.id || (prevProps.currentItem?.itemPrices?.length || 0) !== (this.props.currentItem?.itemPrices?.length || 0)) this.syncComboSizeListIfNeeded();
	}
	restoreKeyboardScrollHeight = () => {
		if (this.keyboardScrollTarget) {
			this.keyboardScrollTarget.style.maxHeight = this.keyboardScrollMaxHeight;
			this.keyboardScrollTarget = null;
		}
	};
	componentWillUnmount() {
		this.restoreKeyboardScrollHeight();
	}
	render() {
		const { t, i18n: { language }, currentItem: tempCurrentItem, currentOrder, selfConfig, isInFreeItem, isSpecialItem, itemPoints, itemVoucherPrice, isPromotionItem, showRequireId } = this.props;
		const currentItem = (0, import_cloneDeep.default)(tempCurrentItem);
		const { keyboardValue, keyboardToggle } = this.state;
		const comboSizeList = this.state.comboSizeList || [];
		let comboOptionList = [];
		if (currentItem.options?.length) comboOptionList.push(...currentItem.options);
		const isItemPrice = comboSizeList.length > 0;
		const showBenefitPrice = shouldShowBenefitPrice(currentItem.benefitPrice, this.props.isHasBenefit) && !currentItem.isFreeItem && !this.props.isInFreeItem && !this.props.isPromotionItem && !this.props.isSpecialItem;
		const isItemOption = comboOptionList.length > 0;
		let isExceedlimit = !!(String(keyboardValue).length >= 255);
		const isShowRemark = selfConfig?.configMap?.id_3;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: comboItem_module_default.comboItemsTitle,
			children: getDishItemLanguage(currentItem.fieldDisplayNameGroups, language) || currentItem.name
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: comboItem_module_default.contentTopBox,
			ref: (el) => this.scrollDom = el,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: comboItem_module_default.leftBox,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
						selfConfig,
						itemInfo: currentItem,
						wrapperClassName: comboItem_module_default.areaImg,
						hideWhenMissing: true
					})
				}),
				(currentItem.description || currentItem.otherDescription || isItemPrice || isItemOption || isShowRemark || !isItemPrice && showBenefitPrice) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: comboItem_module_default.rightBox,
					children: [
						(currentItem.description || currentItem.otherDescription) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: comboItem_module_default.areaDetail,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: { marginTop: 0 },
								className: comboItem_module_default.title,
								children: t("description")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: comboItem_module_default.word,
								children: [currentItem.otherDescription && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										fontWeight: "bolder",
										marginBottom: "2.5rem",
										fontSize: "3.5rem"
									},
									children: currentItem.otherDescription || ""
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: currentItem.description || "" })]
							})]
						}),
						!isItemPrice && showBenefitPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: [comboItem_module_default.area, comboItem_module_default.noSize].join(" "),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: comboItem_module_default.title,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: BenefitPrice_module_default.priceGroup,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", currentItem.price] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, { benefitPrice: currentItem.benefitPrice })]
								})
							})
						}),
						isItemPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: comboItem_module_default.area,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `${comboItem_module_default.title} ${comboItem_module_default.titleWithRequired}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("section") }), showRequireId === -1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: comboItem_module_default.required,
									children: t("required")
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `${comboItem_module_default.word} ${comboItem_module_default.wordSize}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboSizeSelect_default, {
									comboSizeList,
									setCurSectionId: this.props.setCurSectionId,
									comboStepUpTop: this.props.comboStepUpTop,
									optAndRemark: !!(!isItemOption && !isShowRemark),
									isInFreeItem,
									isSpecialItem,
									isPromotionItem
								})
							})]
						}),
						isItemOption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: comboItem_module_default.area,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboOptionItem_default, {
								toastPosition: "top",
								comboOptionList,
								isInFreeItem,
								isSpecialItem,
								isPromotionItem
							})
						}),
						isShowRemark && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: comboItem_module_default.area,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: comboItem_module_default.title,
									children: t("dishExtraDescription")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									ref: (el) => this.inputRef = el,
									maxLength: 255,
									placeholder: `${t("dishExtraDescription")},${t("note_tip")}`,
									value: keyboardValue,
									className: comboItem_module_default.textContent,
									onFocus: () => {
										window.scroll(0, 0);
									},
									onBlur: () => {
										window.scroll(0, 0);
									},
									onClick: () => {
										if (this.props.showDescModal) this.props.showDescModal(t("dishExtraDescription"), keyboardValue, (value) => this.keyboardChange(value));
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
									className: comboItem_module_default.iconEmpty,
									type: "round_close_light",
									size: 5,
									onClick: this.handleResetEmpty
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									ref: (el) => this.maxNoteRef = el,
									className: comboItem_module_default.maxNote,
									style: { display: isExceedlimit ? "block" : "none" },
									children: t("maxNoteTip")
								})
							]
						})
					]
				}),
				keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
					keyboardValue,
					changeInput: this.onChange,
					closeKeyboard: () => {
						this.hideKeyboard();
					}
				}) : null
			]
		})] });
	}
};
function mapStateToProps$3(state) {
	return {
		currentItem: state.currentItem,
		currentOrder: state.currentOrder,
		selfConfig: state.selfConfig,
		crm: state.crm,
		isHasBenefit: state.crm.isHasBenefit
	};
}
var comboItem_default = connect(mapStateToProps$3)(withTranslation()(ComboItem));
//#endregion
//#region source-snapshot/src/utils/getAnchoredListOffset.js
var import_debounce = /* @__PURE__ */ __toESM(require_debounce());
var import_isEqual = /* @__PURE__ */ __toESM(require_isEqual());
function getAnchoredListOffset(previous, next, offset) {
	let before = 0;
	let after = 0;
	for (let index = 0; index < previous.length; index++) {
		const oldHeight = previous[index] || 0;
		const newHeight = next[index] || 0;
		if (offset < before + oldHeight) return after + Math.min(Math.max(0, offset - before), Math.max(0, newHeight - 1));
		before += oldHeight;
		after += newHeight;
	}
	return Math.max(0, after + offset - before);
}
//#endregion
//#region source-snapshot/src/container/comboPanel/fullComboPanel/generalUsePanel/index.js
var isComboNavigationRow = (row) => row?.type === "comboItemsTitle" || row?.type === "comboCateyOptionItem";
var buildComboSectionOffsets = (rows, heights) => {
	let offset = 0;
	const sectionOffsets = [0];
	rows.forEach((row, index) => {
		if (isComboNavigationRow(row)) sectionOffsets.push(offset);
		offset += heights[index] || 0;
	});
	return sectionOffsets;
};
var getComboScrollTarget = (sectionOffset, heights, viewportHeight, headerHeight = 0) => {
	const contentHeight = heights.reduce((sum, height) => sum + (height || 0), 0);
	const maxScrollTop = Math.max(0, contentHeight - viewportHeight);
	const titleScrollTop = Math.max(0, (sectionOffset || 0) - headerHeight);
	return Math.min(titleScrollTop, maxScrollTop);
};
var GeneralUsePanel = class extends import_react.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			colNum: 2,
			cutPaddingTop: 0,
			selectedComboItem: {},
			isEditPreSelect: false,
			listWidth: 0,
			virtualData: [],
			virtualDataHeight: [],
			childrenListHeightList: [],
			scrollEnabled: true,
			overscanCount: 5,
			isListReady: false
		};
		this.comboBoxPanel = import_react.createRef();
		this.comboItemModal = import_react.createRef();
		this.comboDetailModal = import_react.createRef();
		this.preMeasureRef = import_react.createRef();
		this.listRef = import_react.createRef();
		this.listOuterRef = import_react.createRef();
		this._lastScrollOffset = 0;
		this._activeSectionIdx = 0;
		this._measuredRowElements = /* @__PURE__ */ new Map();
		this._measuredRowIndexes = /* @__PURE__ */ new WeakMap();
	}
	setActiveSectionIdx = (idx) => {
		this._activeSectionIdx = idx;
	};
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
	selectedComboItemHandler = (e, currentSubDishList = []) => {
		const { sideNavList, currentOrderCombo, isPromotionItem, selfConfig } = this.props;
		const sideNavId = e.sideNavId;
		const preOrderCombo = (0, import_cloneDeep.default)(currentOrderCombo);
		const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
		if (!sectionInfo) return;
		const { priceRule, maxNumOfSelectionAllowed, itemSelectionRule, freeQuantity } = sectionInfo;
		const orderedItemQty = currentOrderCombo?.find((sct) => sct?.id == sideNavId)?.items?.length;
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
				const chargeableBasePrice = cloneItem.selectedOptionList?.find((section) => section.id === -1)?.sizeInfo?.price ?? e.price;
				cloneItem.isComboBaseFree = false;
				const addComboList = [];
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
				if (priceRule === "FIXED_UNTIL_MAX") {
					if (orderedItemQty < maxNumOfSelectionAllowed) setComboItemBasePrice(cloneItem, 0, true);
					else setComboItemBasePrice(cloneItem, chargeableBasePrice);
					addComboList.push(cloneItem);
				} else if (priceRule === "FIXED_PRICE") {
					setComboItemBasePrice(cloneItem, 0, true);
					addComboList.push(cloneItem);
				} else if (freeQuantity > 0) {
					if (currentOrderCombo?.find((sct) => sct?.id == sideNavId)?.items?.length < freeQuantity) setComboItemBasePrice(cloneItem, 0, true);
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
		} else if (sideNavId === -98 || sideNavId === -99) {
			const { currentOrder } = this.props;
			if (currentOrder?.itemList) currentOrder.itemList.forEach((item) => {
				if (item.id === id) n += item.quantity || 1;
			});
		}
		return n;
	};
	/**
	* 自选套餐点击角标，删除子菜：
	* 如果子菜个数=1，可直接删除，不弹items列表；
	* 如果子菜个数>1且子菜都相同,且都是非详情菜，可直接删除(优先删除最后添加的子菜)，不弹items列表；
	* 如果子菜个数>1且子菜不相同，或是详情菜，弹items列表，再选择具体删除哪一个子菜；
	*/
	handleQtyClicked = (num, sectionId, itemInfo) => {
		const { currentOrderCombo, sideNavList } = this.props;
		if (sectionId === -98 || sectionId === -99) {
			this.props.removeItemFromOrder(itemInfo.id);
			return;
		}
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
			const hasDetail = judgeHasDetailInfo(itemInfo, true);
			for (let k = 0; k < itemsArr.length - 1; k++) {
				let standard = itemsArr[0];
				if ((0, import_isEqual.default)(standard, itemsArr[k + 1]) || !hasDetail) continue;
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
	buildChildrenListHeightList = (heights, rows = this.state.virtualData) => buildComboSectionOffsets(rows, heights);
	hasTallMainComboContent = () => {
		const { currentItem } = this.props;
		return currentItem?.categoryOptions?.length > 0 || currentItem?.itemPrices?.length > 0 || currentItem?.itemOptions?.length > 0;
	};
	getEstimatedItemHeight = (item) => {
		if (!item) return remToPx(10);
		switch (item.type) {
			case "comboItem":
				if (this.hasTallMainComboContent()) return Math.max(remToPx(40), window.innerHeight - remToPx(12));
				return remToPx(40);
			case "comboItemsTitle": return remToPx(6.3);
			case "comboItemsBox": {
				const dishCount = (item.data?.sideDishList || []).length;
				if (!dishCount) return remToPx(10);
				const colNum = this.state.colNum;
				const isSimpleMode = !item.data.hasThumbPath;
				const sideNavId = item.data?.sideNameMap?.id;
				const maxNumOfSelectionAllowed = getComboSectionInfo(this.props.sideNavList, sideNavId)?.maxNumOfSelectionAllowed;
				const columns = isSimpleMode && maxNumOfSelectionAllowed !== 1 && this.props.selfConfig?.configMap?.id_19 && getDeviceOrientation() === "vertical" ? 1 : isSimpleMode ? 2 : colNum;
				const rows = Math.ceil(dishCount / columns);
				return remToPx(4 + rows * (isSimpleMode ? 11 : 32) + Math.max(0, rows - 1) * 2);
			}
			case "comboCateyOptionItem": return remToPx(15);
			default: return remToPx(10);
		}
	};
	measureElementHeight = (el) => {
		if (!el) return 0;
		let totalHeight = 0;
		const children = el.children;
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const style = window.getComputedStyle(child);
			const marginTop = parseFloat(style.marginTop) || 0;
			const marginBottom = parseFloat(style.marginBottom) || 0;
			totalHeight += (child?.offsetHeight || 0) + marginTop + marginBottom;
		}
		return totalHeight;
	};
	startInitialPreMeasure = () => {
		this._preMeasureAttempts = 0;
		this._stablePreMeasureCount = 0;
		this._lastPreMeasureSignature = "";
		clearTimeout(this._preMeasureTimer);
		this._preMeasureTimer = setTimeout(() => {
			requestAnimationFrame(() => {
				this.applyInitialPreMeasure();
			});
		}, 0);
	};
	applyInitialPreMeasure = () => {
		if (!this._isMounted) return;
		const container = this.preMeasureRef.current;
		const { virtualData } = this.state;
		const rowElements = [...container?.children || []];
		const measuredHeights = virtualData.map((row, index) => {
			if (row.type === "top") return remToPx(10);
			if (row.type === "bottom") return remToPx(20);
			return this.measureElementHeight(rowElements[index]);
		});
		const signature = measuredHeights.join(",");
		this._stablePreMeasureCount = signature === this._lastPreMeasureSignature ? this._stablePreMeasureCount + 1 : 0;
		this._lastPreMeasureSignature = signature;
		this._preMeasureAttempts += 1;
		const hasPendingCategoryOption = (this.props.currentItem?.categoryOptions?.length || 0) > 0 && measuredHeights.some((height, index) => virtualData[index]?.type === "comboCateyOptionItem" && height === 0);
		if (!(this._preMeasureAttempts >= 3 && this._stablePreMeasureCount >= 2 && !hasPendingCategoryOption) && this._preMeasureAttempts < 20) {
			clearTimeout(this._preMeasureTimer);
			this._preMeasureTimer = setTimeout(() => {
				requestAnimationFrame(() => {
					this.applyInitialPreMeasure();
				});
			}, 50);
			return;
		}
		const resolvedHeights = measuredHeights.map((height, index) => height > 0 ? height : this.getEstimatedItemHeight(virtualData[index]));
		this.setState({
			virtualDataHeight: resolvedHeights,
			childrenListHeightList: this.buildChildrenListHeightList(resolvedHeights, virtualData)
		}, () => {
			this.finishInitialLayout();
		});
	};
	finishInitialLayout = () => {
		if (!this._isMounted) return;
		this._isUserScrolling = false;
		this.setState({ isListReady: true }, () => {
			requestAnimationFrame(() => {
				if (this.listRef.current) this.listRef.current.resetAfterIndex(0, true);
			});
		});
	};
	flushPendingHeightReset = () => {
		const pending = this._pendingHeightReset;
		if (!pending) return;
		this._pendingHeightReset = null;
		this.resetMeasuredRows(pending.minChangedIndex, pending.previousHeights);
	};
	resetMeasuredRows = (index, previousHeights) => {
		const list = this.listRef.current;
		if (!list) return;
		const offset = this._lastScrollOffset || 0;
		const nextOffset = this._preserveImageScrollAnchor ? getAnchoredListOffset(previousHeights, this.state.virtualDataHeight, offset) : offset;
		list.resetAfterIndex(index);
		if (nextOffset !== offset) {
			this._lastScrollOffset = nextOffset;
			list.scrollTo(nextOffset);
		}
	};
	updateVirtualHeights = (newHeights, minChangedIndex = 0, hasHeightIncrease = false) => {
		const childrenListHeightList = this.buildChildrenListHeightList(newHeights);
		const previousHeights = this.state.virtualDataHeight;
		this.setState({
			virtualDataHeight: newHeights,
			childrenListHeightList
		}, () => {
			if (!this.listRef.current) return;
			if (this._isUserScrolling && !hasHeightIncrease) {
				this._pendingHeightReset = {
					minChangedIndex: Math.min(minChangedIndex, this._pendingHeightReset?.minChangedIndex ?? minChangedIndex),
					previousHeights: this._pendingHeightReset?.previousHeights || previousHeights
				};
				return;
			}
			const pending = this._pendingHeightReset;
			this._pendingHeightReset = null;
			this.resetMeasuredRows(Math.min(minChangedIndex, pending?.minChangedIndex ?? minChangedIndex), pending?.previousHeights || previousHeights);
		});
	};
	comboStepUpTop = (idx) => {
		const { childrenListHeightList, virtualDataHeight } = this.state;
		if (!this.listRef.current) return;
		this._activeSectionIdx = idx;
		this.setState({ scrollEnabled: false }, () => {
			const targetScrollTop = getComboScrollTarget(idx === 0 ? 0 : childrenListHeightList[idx], virtualDataHeight, this.listRef.current.props.height, remToPx(8.8));
			if (idx === 0 || idx >= childrenListHeightList.length) this.scrollToTop();
			else {
				this.listRef.current.scrollTo(targetScrollTop);
				this._lastScrollOffset = targetScrollTop;
			}
			clearTimeout(this._scrollEnabledTimer);
			this._scrollEnabledTimer = setTimeout(() => {
				if (this._isMounted) this.setState({ scrollEnabled: true });
			}, 300);
		});
	};
	getSectionIdxFromScrollTop = (scrollTop, childrenListHeightList) => {
		if (!childrenListHeightList?.length) return 0;
		let currentIdx = childrenListHeightList.length - 1;
		for (let i = childrenListHeightList.length - 1; i >= 0; i--) if (scrollTop >= childrenListHeightList[i]) {
			currentIdx = i;
			break;
		}
		return currentIdx;
	};
	handleScroll = (e) => {
		notifyItemCardListScroll();
		if (!this.state.scrollEnabled) return;
		const scrollTop = Math.floor(e.scrollOffset);
		this.props.onScroll?.(scrollTop);
		const isRealScroll = scrollTop !== this._lastScrollOffset;
		this._lastScrollOffset = scrollTop;
		if (isRealScroll && !e.scrollUpdateWasRequested) {
			this._isUserScrolling = true;
			clearTimeout(this._userScrollEndTimer);
			this._userScrollEndTimer = setTimeout(() => {
				this._isUserScrolling = false;
				this.flushPendingHeightReset();
			}, 200);
		}
		window.comboScrollTimer && clearTimeout(window.comboScrollTimer);
		window.comboScrollTimer = setTimeout(() => {
			const { sideNavList } = this.props;
			const { childrenListHeightList } = this.state;
			const currentIdx = this.getSectionIdxFromScrollTop(scrollTop, childrenListHeightList);
			if (currentIdx !== this._activeSectionIdx) {
				this._activeSectionIdx = currentIdx;
				this.props.onScrollSectionChange?.(currentIdx, sideNavList);
			}
			clearTimeout(window.comboScrollTimer);
		}, 100);
	};
	scrollToTop() {
		if (!this.listRef.current) return;
		this.listRef.current.scrollTo(0, "start");
		this._lastScrollOffset = 0;
	}
	resizeload = (0, import_debounce.default)(() => {
		if (!this._isMounted) return;
		const listWidth = this.comboBoxPanel.current?.clientWidth || 0;
		if (!listWidth) return;
		const colNum = calcColNum(Math.max(0, listWidth - remToPx(4)));
		this._preserveImageScrollAnchor = true;
		this.setState({
			colNum,
			listWidth
		}, () => {
			if (!this.state.isListReady) {
				this.startInitialPreMeasure();
				return;
			}
			this.updateVirtualHeights(this.state.virtualData.map((row, index) => {
				if (row.type === "top") return remToPx(10);
				if (row.type === "bottom") return remToPx(20);
				const measured = this.measureElementHeight(this._measuredRowElements.get(index)?.el);
				return measured > 0 ? measured : this.getEstimatedItemHeight(row);
			}));
		});
	}, 100);
	componentDidMount() {
		this._isMounted = true;
		if (window.ResizeObserver) this._rowResizeObserver = new window.ResizeObserver((entries) => {
			entries.forEach((entry) => {
				const measuredRow = this._measuredRowIndexes.get(entry.target);
				if (measuredRow) this.measureRef(measuredRow.el, measuredRow.index);
			});
		});
		else this._measureFallbackTimer = window.setInterval(() => {
			this._measuredRowElements.forEach(({ el }, index) => this.measureRef(el, index));
		}, 250);
		const colNum = calcColNum(Math.max(0, (this.comboBoxPanel.current?.clientWidth || window.innerWidth) - remToPx(4)));
		this._stopLayoutObserver = observeLayoutSize(this.comboBoxPanel.current, this.resizeload);
		this.props.onRef(this);
		this.setState({ colNum }, () => {
			this.updateListWidth();
			this.getvirtualData();
		});
	}
	componentWillUnmount() {
		this._isMounted = false;
		if (this._measureRafId) cancelAnimationFrame(this._measureRafId);
		clearTimeout(this._scrollEnabledTimer);
		clearTimeout(this._userScrollEndTimer);
		clearTimeout(this._preMeasureTimer);
		this._rowResizeObserver?.disconnect();
		window.clearInterval(this._measureFallbackTimer);
		this._measuredRowElements.clear();
		this._stopLayoutObserver?.();
		this.resizeload.cancel();
	}
	componentDidUpdate(prevProps) {
		if (!(0, import_isEqual.default)(prevProps.comboAllChildDish, this.props.comboAllChildDish)) this.getvirtualData();
		if (!(0, import_isEqual.default)(prevProps.currentOrderCombo, this.props.currentOrderCombo)) this.listRef.current?.resetAfterIndex(0);
	}
	getvirtualData = () => {
		const data = [];
		data.push({
			type: "top",
			data: []
		});
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
		if (this.props.currentItem?.categoryOptions?.length > 0) data.push({
			type: "comboCateyOptionItem",
			data: []
		});
		data.push({
			type: "bottom",
			data: []
		});
		const initialHeights = data.map((row) => {
			if (row.type === "bottom") return remToPx(20);
			if (row.type === "top") return remToPx(10);
			return this.getEstimatedItemHeight(row);
		});
		this.setState({
			virtualData: data,
			virtualDataHeight: initialHeights,
			childrenListHeightList: this.buildChildrenListHeightList(initialHeights, data),
			isListReady: false,
			overscanCount: 5
		}, () => {
			this._activeSectionIdx = 0;
			this._lastScrollOffset = 0;
			this.updateListWidth();
			this.startInitialPreMeasure();
		});
	};
	getItemSize = (index) => {
		const { virtualDataHeight, virtualData } = this.state;
		const item = virtualData[index];
		const measured = virtualDataHeight[index];
		if (measured > 0) return measured;
		if (item.type === "bottom") return remToPx(20);
		if (item.type === "top") return remToPx(10);
		return this.getEstimatedItemHeight(item);
	};
	renderRow = ({ index, style, data }) => {
		const item = data.virtualData[index];
		if (!item) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style,
			ref: (el) => this.setMeasureRef(el, index),
			children: this.renderContentItem(item, data.currentOrderCombo)
		}, `virtual-row-${index}`);
	};
	setMeasureRef = (el, index) => {
		const previousRow = this._measuredRowElements.get(index);
		if (previousRow && previousRow.el !== el) {
			previousRow.targets.forEach((target) => this._rowResizeObserver?.unobserve(target));
			this._measuredRowElements.delete(index);
		}
		if (!el) return;
		const targets = Array.from(el.children);
		this._measuredRowElements.set(index, {
			el,
			targets
		});
		targets.forEach((target) => {
			this._measuredRowIndexes.set(target, {
				el,
				index
			});
			this._rowResizeObserver?.observe(target);
		});
		this.measureRef(el, index);
	};
	measureRef = (el, index) => {
		if (!el || !this.state.virtualData[index]) return;
		const totalHeight = this.measureElementHeight(el);
		if (totalHeight > 0 && this.state.virtualDataHeight[index] !== totalHeight) {
			this._pendingHeights = this._pendingHeights || {};
			this._pendingHeights[index] = totalHeight;
			if (this._measureRafId) return;
			this._measureRafId = requestAnimationFrame(() => {
				this._measureRafId = null;
				if (!this._isMounted) return;
				const pending = this._pendingHeights || {};
				this._pendingHeights = null;
				const newHeights = [...this.state.virtualDataHeight];
				let hasChange = false;
				let hasHeightIncrease = false;
				let minChangedIndex = Infinity;
				Object.keys(pending).forEach((key) => {
					const idx = Number(key);
					if (newHeights[idx] !== pending[key]) {
						hasHeightIncrease ||= pending[key] > newHeights[idx];
						newHeights[idx] = pending[key];
						hasChange = true;
						minChangedIndex = Math.min(minChangedIndex, idx);
					}
				});
				if (!hasChange) return;
				this.updateVirtualHeights(newHeights, minChangedIndex === Infinity ? 0 : minChangedIndex, hasHeightIncrease);
			});
		}
	};
	updateListWidth = () => {
		if (this.comboBoxPanel?.current) {
			const width = this.comboBoxPanel.current.offsetWidth;
			this.setState({ listWidth: width });
		}
	};
	renderContentItem = (item, currentOrderCombo) => {
		const { isInFreeItem, isSpecialItem, itemPoints, itemVoucherPrice, isPromotionItem, isExchangePurchase = false, showRequireId } = this.props;
		switch (item.type) {
			case "comboItem": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboItem_default, {
				scrollContainerRef: this.listOuterRef,
				setCurSectionId: this.props.setCurSectionId,
				comboStepUpTop: this.comboStepUpTop,
				isInFreeItem,
				isSpecialItem,
				itemPoints,
				itemVoucherPrice,
				isPromotionItem: isPromotionItem && !isExchangePurchase,
				showRequireId,
				showDescModal: this.props.showDescModal
			});
			case "comboItemsTitle": return this.renderComboItemsTitle(item.data);
			case "comboItemsBox": return this.renderComboItemsBox(item.data, currentOrderCombo);
			case "comboCateyOptionItem": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboCateyOptionItem_default, {
				toastPosition: "top",
				sideNavList: this.props.sideNavList,
				isInFreeItem,
				isSpecialItem,
				isPromotionItem: isPromotionItem && !isExchangePurchase
			});
			case "bottom": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomToast, {});
			default: return null;
		}
	};
	renderComboItemsTitle = (sideItemInfo) => {
		const { t, i18n: { language }, selfConfig, sideNavList, currentOrderCombo, itemId, showRequireId, isInFreeItem, isPromotionItem } = this.props;
		const chooseTipMap = allRangHandler(sideNavList, t, {
			isInFreeItem,
			isPromotionItem
		});
		const isShowComboSideNav = selfConfig?.configMap?.id_19;
		const o = judegStepIsHasMustDish(sideNavList, currentOrderCombo);
		const isRequestSubDish = sideItemInfo.isRequestSubDish;
		let sectionName = "";
		if (sideItemInfo.sideNameMap?.fieldDisplayNameGroups?.length) sectionName = getCurrentItemLanguage(sideItemInfo.sideNameMap.fieldDisplayNameGroups, language) || sideItemInfo.sideNameMap.name;
		this.judegStepCanRepeated(sideItemInfo.sideNameMap.id);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: generalUsePanel_module_default.comboItemsTitle,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: generalUsePanel_module_default.sectionName,
					children: sectionName
				}),
				!isShowComboSideNav && showRequireId !== sideItemInfo.sideNameMap.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
					className: generalUsePanel_module_default.comboItemsRule,
					children: chooseTipMap[sideItemInfo.sideNameMap.id] || ""
				}),
				!isShowComboSideNav && !o[sideItemInfo.sideNameMap.id] && ![-98, -99].includes(sideItemInfo.sideNameMap.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("i", {
					className: generalUsePanel_module_default.comboItemsMust,
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
					className: generalUsePanel_module_default.required,
					children: `${t("required")}: ${chooseTipMap[sideItemInfo.sideNameMap.id] || ""}`
				})
			]
		});
	};
	renderComboItemsBox = (sideItemInfo, currentOrderCombo) => {
		const { colNum } = this.state;
		const { t, sideNavList, isInFreeItem, isSpecialItem, isPromotionItem, isExchangePurchase = false, selfConfig } = this.props;
		const isCompleteObj = getOneUncompletedSection(sideNavList, currentOrderCombo);
		const isShowComboSideNav = selfConfig?.configMap?.id_19;
		const isSimpleMode = !sideItemInfo.hasThumbPath;
		const allowRepeatedItems = getComboSectionInfo(sideNavList, sideItemInfo.sideNameMap.id)?.allowRepeatedItems;
		let isContinueChoose = isCompleteObj[sideItemInfo.sideNameMap.id]?.isContinueChoose;
		const isVertical = getDeviceOrientation() === "vertical";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: generalUsePanel_module_default.comboItemsBox,
			style: isSimpleMode ? { paddingBottom: 0 } : {},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: generalUsePanel_module_default.comboItemsList,
				children: sideItemInfo.sideDishList?.length ? sideItemInfo.sideDishList.map((sideDish) => {
					const sectionInfo = getComboSectionInfo(sideNavList, sideDish.sideNavId);
					const isSidesOrDrinks = sectionInfo?.id === -98 || sectionInfo?.id === -99;
					const comboSectionSaleItems = sectionInfo?.comboSectionSaleItems;
					const comboSectionSaleItem = isSidesOrDrinks ? null : comboSectionSaleItems?.find((item) => item.saleItemId == sideDish?.id);
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
					const isSimpleMulChoose = max !== 1;
					const isSoldoutMark = itemIsSoldOut(itemInfo);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: [
							generalUsePanel_module_default.comboItems,
							isSimpleMode && generalUsePanel_module_default.simpleModeItems,
							isDisabled && !isSoldoutMark && generalUsePanel_module_default.disabled
						].join(" "),
						style: isSimpleMode ? isSimpleMulChoose && isShowComboSideNav && isVertical ? {
							width: `100%`,
							margin: `0 0 2rem 0`
						} : {} : { width: `calc(((100% - 2rem) - 2rem * ${colNum}) / ${colNum})` },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(itemCard_default, {
							...this.props,
							isSimpleMode,
							sideNavId: sideItemInfo.sideNameMap.id,
							isThumbPath: sideItemInfo.hasThumbPath,
							deferImages: !this.state.isListReady,
							lazyImages: true,
							isComboType: true,
							itemInfo,
							isPreSelected,
							itemQty,
							isInFreeItem,
							isSpecialItem,
							isPromotionItem: isPromotionItem && !isExchangePurchase,
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
								if (sectionInfo?.id === -98 || sectionInfo?.id === -99) {
									let cloneItem = {
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
									this.props.addCombo2Order(cloneItem);
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
									toast_default.info(t("no-allow-repeated-item"), "top");
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
		const { selectedComboItem, listWidth, virtualData, overscanCount, isListReady } = this.state;
		const { isInFreeItem, isPromotionItem, isExchangePurchase = false, isSpecialItem } = this.props;
		const panelWidth = listWidth || this.comboBoxPanel.current?.offsetWidth || 0;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: generalUsePanel_module_default.panelBox,
				ref: this.comboBoxPanel,
				style: !isListReady ? { minHeight: window.innerHeight - remToPx(10) } : void 0,
				children: !isListReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: generalUsePanel_module_default.preMeasureBox,
					ref: this.preMeasureRef,
					style: { width: panelWidth || "100%" },
					children: virtualData.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: this.renderContentItem(item, this.props.currentOrderCombo) }, `pre-measure-row-${index}`))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VariableSizeList, {
					ref: this.listRef,
					outerRef: this.listOuterRef,
					height: window.innerHeight - remToPx(10),
					width: panelWidth || 0,
					itemCount: virtualData.length,
					itemSize: this.getItemSize,
					itemData: {
						virtualData,
						currentOrderCombo: this.props.currentOrderCombo
					},
					onScroll: this.handleScroll,
					overscanCount,
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
				isInFreeItem,
				isSpecialItem,
				isPromotionItem,
				isExchangePurchase,
				onCloseEffect: () => {
					this.setState({ isEditPreSelect: false });
				},
				showDescModal: this.props.showDescModal
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboItemsDetailModal_default, {
				sideNavList: this.props.sideNavList,
				onRef: this.openOrderDetailModal,
				setCurSectionId: this.props.setCurSectionId,
				handleChildUpTop: this.comboStepUpTop,
				isInFreeItem,
				isSpecialItem,
				isPromotionItem,
				isExchangePurchase
			})
		] });
	}
};
function mapStateToProps$2(state, ownProps) {
	return {
		currentOrderCombo: state.currentOrderCombo,
		currentOrder: state.currentOrder,
		sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
		sideNavId: ownProps.sideNavId ?? state.sideNav.sideNavId,
		selfConfig: state.selfConfig,
		promotion: state.promotion,
		currentItem: state.currentItem,
		itemSizeList: state.itemSizeList,
		menuItemList: state.menuItemList,
		crm: state.crm
	};
}
var generalUsePanel_default = connect(mapStateToProps$2, {
	addItem2ComboSection,
	removeFootItemComboSection,
	changeDefaultDish,
	addCombo2Order,
	removeItemFromOrder
})(withTranslation()(GeneralUsePanel));
var comboFooter_module_default = {
	footBtnBox: "footBtnBox___CLEhg",
	countBtn: "countBtn___yse2b",
	btnEn: "btnEn___q7r5u",
	btnDis: "btnDis___xU0dY",
	muiDiyIcon: "muiDiyIcon___o3veN",
	qty: "qty___6-4Pb",
	details: "details___ME5M5",
	num: "num___qEbUk",
	arrow: "arrow___DwKu0",
	actived: "actived___Z4Bqh",
	noActived: "noActived___MuoaL",
	orderView: "orderView___gOi2k",
	total: "total___5xnbK",
	point: "point___Jc7Yp"
};
//#endregion
//#region source-snapshot/src/assets/images/starWhite.png
var import_Add = /* @__PURE__ */ __toESM(require_Add());
var import_Remove = /* @__PURE__ */ __toESM(require_Remove());
//#endregion
//#region source-snapshot/src/container/comboPanel/comboFooter/index.js
var defaultMax$1 = 99;
var ComboFooter = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			priceTotal: "0.00",
			isAddToCart: false,
			defaultMax: defaultMax$1,
			notCompleteId: ""
		};
		this.comboItemModal = import_react.createRef();
	}
	openOrderDetailModal = (ref) => {
		this.comboItemModal = ref;
	};
	handleShowDetail = () => {
		this.comboItemModal.viewOrderPanel();
	};
	backConfirm = () => {
		this.props.history.goBack();
	};
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
	handleAddToCart = async () => {
		const { isAddToCart, notCompleteId } = this.state;
		const { sideNavList, handleChildUpTop, setCurSectionId, t, showRequireLabel, currentOrderCombo, currentItem } = this.props;
		const stoppedStatus = getItemStoppedStatus(currentItem);
		if (stoppedStatus) {
			toast_default.info(t(stoppedStatus === "unavailable" ? "dish-item-unavailable" : "dish-sold-out", { item: currentItem.name }), "top");
			return;
		}
		if (isAddToCart) {
			await this.props.submitCurrentOrderCombo();
			return;
		} else {
			let isItemPrice = currentItem?.itemPrices && currentItem?.itemPrices.length > 0;
			const sizeInfo = currentOrderCombo.find((nav) => nav.id === -1)?.sizeInfo || {};
			if (isItemPrice && !Object.keys(sizeInfo).length) {
				toast_default.info(t("choose-size"), "top");
				this.props.scrollGeneralUsePanelToTop();
				showRequireLabel(-1);
				return;
			}
			const idx = sideNavList?.findIndex((nav) => nav.id === Number(notCompleteId));
			if (idx == null || idx < 0) return toast_default.info(t("requireDish"), "top");
			handleChildUpTop(idx);
			setCurSectionId(idx);
			showRequireLabel(Number(notCompleteId));
			return toast_default.info(t("requireDish", { name: sideNavList[idx]?.name }), "top");
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
		const { isInFreeItem, max, isPromotionItem, isSpecialItem } = this.props;
		if ((isInFreeItem || isPromotionItem || isSpecialItem) && max) this.setState({ defaultMax: max });
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
		const { t, currentOrderCombo, currentItem, orderDishCount, changeDishNum, handleGoBack = null, isInFreeItem = false, isSpecialItem = false, isPromotionItem, isExchangePurchase = false, itemPoints, itemVoucherPrice } = this.props;
		const { isAddToCart, defaultMax } = this.state;
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
		let isHasSize = !!currentOrderCombo.find((s) => s.id == -1);
		if (!isHasSize) {
			const parsedPrice = Number.parseFloat(currentItem.price);
			const singlePrice = isNaN(parsedPrice) ? 0 : parsedPrice;
			priceTotal = Big(isNaN(priceTotal) ? 0 : priceTotal).plus(singlePrice).toNumber().toFixed(2);
		}
		const selectedPrices = getItemActualPrices({
			...currentItem,
			price: isHasSize ? 0 : currentItem.price,
			sectionDetail: currentOrderCombo
		});
		const showMemberPrice = this.props.crm.isHasBenefit === true && selectedPrices.hasBenefitPrice && !isInFreeItem && !isPromotionItem && !isSpecialItem;
		let showText = "addToOrder";
		if (this.props.isOrderEdit) showText = "confirm";
		const minDisabled = orderDishCount <= 1;
		const maxDisabled = orderDishCount >= defaultMax;
		const stoppedStatus = getItemStoppedStatus(currentItem);
		const isSoldOut = Boolean(stoppedStatus);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: comboFooter_module_default.footBtnBox,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: comboFooter_module_default.countBtn,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
						className: minDisabled ? comboFooter_module_default.btnDis : `${comboFooter_module_default.btnEn} animate-btn`,
						"aria-label": "Remove",
						disabled: minDisabled,
						onClick: () => changeDishNum(orderDishCount - 1),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: comboFooter_module_default.muiDiyIcon })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: comboFooter_module_default.qty,
						children: orderDishCount
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
						className: maxDisabled ? comboFooter_module_default.btnDis : `${comboFooter_module_default.btnEn} animate-btn`,
						"aria-label": "Add",
						disabled: maxDisabled,
						onClick: () => changeDishNum(orderDishCount + 1),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: comboFooter_module_default.muiDiyIcon })
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: [comboFooter_module_default.orderView, isAddToCart && !isSoldOut ? `${comboFooter_module_default.actived} linear-animate-btn` : comboFooter_module_default.noActived].join(" "),
				onClick: this.handleAddToCart,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: comboFooter_module_default.btn,
					children: t([showText])
				}), isAddToCart && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: comboFooter_module_default.total,
					children: isInFreeItem ? itemPoints ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: comboFooter_module_default.point,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							className: comboFooter_module_default.pointImg,
							src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABrCAMAAADAUGU4AAAAP1BMVEUAAAD///////////////////////////////////////////////////////////////////////////////9Du/pqAAAAFHRSTlMAIO/fEEC/gHBgMKCQz1Cvn1+PsPr2haAAAAHgSURBVGje7dprjtswDATgoR6W5WeynfuftV0YrbobI4kdDpAf+x2AIMhJYEvGjzeVIDNAJkNmgUyBzJSgMhpUOl1E5gqV0EMkcYJI5i+ILIwQKQwQ6UiDRiQXSBipishCsoPERKr2OPOPAQLGTz0EKqka9spPIcFd4ibDXeXmAncdKZqI8a8KZyM3goxEkppFVjYXQdOSRfb83wf8WOQX5h4PQUgyG9+QpMjvYoKLD976cE9H0+N1A3eFAa+ywH3RHBItqN0qC2rnQGpq93wgntxlWvlYwQlL4DM6O5zmjk8Kxxq3kQfEK56VOx4Ur/ZM3RJ4xmXBPVanyNPCet3JYrJcpzXyZaGb+jwkbMxsqWXqZrqI66XUapa+Bq6OL9UPa5/TvXGvPCWWjIesHu49TBlPyuOhwiUJfo+t8BFLdP97agofOn2sM0TeNxvOspn3jMnhQXJXwWuKe+VmElS+P5MVDtJMqp6CLfCGwcciGfT+KiPcpOA9jqaSstfdjk0weMo3TUvaNvjK7k03/0IywFvhZoa7xM0V/rq2RG+97uAz6Y5r0Sny0TISIJFJ1Z1PaqN2N5MZGiOZoNEzQCSzg4hxwq63viVFXKCyZtx4/3v0Apm9Lb7/RxzC0oYf5/0GQWF80vx1yZUAAAAASUVORK5CYII=",
							alt: "point"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: comboFooter_module_default.pointValue,
							children: [
								itemPoints,
								" ",
								t("pts")
							]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["$", itemVoucherPrice] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: showMemberPrice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("del", { children: ["$", Big(selectedPrices.realPrice).times(orderDishCount).toFixed(2)] }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BenefitPrice, {
							variant: "button",
							benefitPrice: Big(selectedPrices.realBenefitPrice).times(orderDishCount).toNumber()
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["$", getPromotionModalDisplayPrice({
						isPromotionItem,
						isExchangePurchase,
						totalPrice: floatNumberRounding(priceTotal * orderDishCount)
					})] }) })
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboItemsDetailModal_default, {
			onRef: this.openOrderDetailModal,
			setCurSectionId: this.props.setCurSectionId,
			handleChildUpTop: this.props.handleChildUpTop,
			isInFreeItem,
			isPromotionItem,
			isExchangePurchase,
			itemPoints
		})] });
	}
};
function mapStateToProps$1(state, ownProps) {
	return {
		currentItem: state.currentItem,
		sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
		isOrderEdit: state.orderEdit.isOrderEdit,
		currentOrderCombo: state.currentOrderCombo,
		selfConfig: state.selfConfig,
		crm: state.crm
	};
}
var comboFooter_default = withRouter(connect(mapStateToProps$1, { removeItemFromComboSection })(withTranslation()(ComboFooter)));
//#endregion
//#region source-snapshot/src/container/comboPanel/fullComboPanel/index.js
var defaultMax = 99;
var FullComboPanel = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			comboAllChildDish: [],
			sectionIndex: 0,
			sectionId: null,
			sectionList: null,
			orderDishCount: 1,
			showRequireId: null,
			descVisible: false,
			descValue: "",
			descTitle: "",
			descCallback: null
		};
		this.sideNavDom = import_react.createRef();
		this.generalUsePanelDom = import_react.createRef();
		this.listRef = import_react.createRef();
		this._comboDiagLogged = false;
	}
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
			if (props.currentItem.categoryOptions?.length > 0) sectionList.push({
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
	componentDidMount() {
		this._isMounted = true;
		this.probeComboImages();
		if (this.props.isOrderEdit) {
			let idx = this.props.comboPanelIdx;
			const { editComboQty } = this.props;
			this.setState({ orderDishCount: editComboQty });
			if (idx) {
				this.setCurSectionId(idx);
				setTimeout(() => {
					this.handleChildUpTop(idx);
				}, 0);
			}
		}
		this.logComboDiagOnceIfNeeded();
		setTimeout(() => {
			this._comboDiagAllowEmptyPrices = true;
			this.logComboDiagOnceIfNeeded();
		}, 0);
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
	componentDidUpdate(prevProps) {
		if (this._comboDiagLogged) return;
		const prevPricesLen = prevProps.currentItem?.itemPrices?.length || 0;
		const currPricesLen = this.props.currentItem?.itemPrices?.length || 0;
		if (prevProps.currentOrder?.orderType !== this.props.currentOrder?.orderType || prevPricesLen === 0 && currPricesLen > 0) this.logComboDiagOnceIfNeeded();
	}
	logComboDiagOnceIfNeeded = async () => {
		if (this._comboDiagLogged) return;
		const { currentItem, currentOrder } = this.props;
		if (!(currentItem?.id ?? currentItem?.itemId)) return;
		const itemPrices = currentItem?.itemPrices || [];
		if (itemPrices.length === 0 && !this._comboDiagAllowEmptyPrices) return;
		this._comboDiagLogged = true;
		const comboSizeList = buildComboSizeList(currentItem, currentOrder);
		try {
			await posFrontLog(`--currentOrder.orderType-- : ${currentOrder?.orderType} `).catch(() => {});
			if (itemPrices.length) for (const item of itemPrices) await posFrontLog(`--itemPrices-- : ${item?.itemId} - ${item?.id} - ${item?.size} - ${item?.type}`).catch(() => {});
			if (comboSizeList.length) for (const item of comboSizeList) await posFrontLog(`--comboSizeList-- : ${item?.itemId} - ${item?.id} - ${item?.size} - ${item?.type}`).catch(() => {});
		} catch (error) {}
	};
	componentWillUnmount() {
		this._isMounted = false;
		if (this._showDomInViewTimer) clearTimeout(this._showDomInViewTimer);
	}
	showDomInView = (i) => {
		if (this._showDomInViewTimer) clearTimeout(this._showDomInViewTimer);
		this._showDomInViewTimer = setTimeout(() => {
			this._showDomInViewTimer = null;
			if (!this._isMounted || !this.sideNavDom) return;
			(this.sideNavDom.current?.firstElementChild?.childNodes[i])?.scrollIntoViewIfNeeded(true);
		}, 0);
	};
	setCurSectionId = (i, sectionList = this.state.sectionList) => {
		const activeIdx = sectionList[i]?.id == -2 ? 0 : i;
		this.generalUsePanelDom?.setActiveSectionIdx(activeIdx);
		if (sectionList[i]?.id == -2) {
			this.setState({
				sectionIndex: 0,
				sectionId: -1
			});
			this.showDomInView(0);
		} else if (sectionList[i]?.id == -3) {
			this.setState({
				sectionIndex: i,
				sectionId: -3
			});
			this.showDomInView(i);
		} else {
			this.setState({
				sectionIndex: i,
				sectionId: sectionList[i]?.id
			});
			this.showDomInView(i);
		}
	};
	onScrollSectionChange = (i, sectionList = this.state.sectionList) => {
		let sectionIndex = i;
		let sectionId = sectionList[i]?.id;
		if (sectionList[i]?.id == -2) {
			sectionIndex = 0;
			sectionId = -1;
		}
		if (this.state.sectionIndex === sectionIndex && this.state.sectionId === sectionId) return;
		this.setState({
			sectionIndex,
			sectionId
		});
	};
	handleChildUpTop = (idx) => {
		this.generalUsePanelDom.comboStepUpTop(idx);
	};
	submitCurrentOrderCombo = async () => {
		const { t, currentOrderCombo, currentItem, isOrderEdit, isInFreeItem = false, isSpecialItem = false, onAddFreeItem, isPromotionItem, isExchangePurchase = false, onEditPromotionItem, selectedPromotion, editingSequence, promotion: { buyGifts }, avocado: { outletInfo, metaData }, ruleId } = this.props;
		const { orderDishCount } = this.state;
		const tempCurrentItem = Object.assign({}, currentItem);
		if (currentItem.isFreeItem && outletInfo?.enabled === 1 && !currentItem.crmIntegrationRule) {
			const rule = (await checkIsCampaignValid({
				coupons: [currentItem],
				metaData
			}))?.[0];
			handleCheckFreeItem({
				rule,
				toastPosition: "top"
			});
			if (!rule.crmIntegrationRule.isValid) {
				this.props.onCloseModal();
				return;
			}
			const { couponTemplate, crmIntegrationRule } = rule;
			tempCurrentItem.couponTemplate = couponTemplate;
			tempCurrentItem.crmIntegrationRule = crmIntegrationRule;
		}
		if (tempCurrentItem.itemPrices && tempCurrentItem.itemPrices.length > 0) tempCurrentItem.price = 0;
		if (isOrderEdit) {
			tempCurrentItem.sectionDetail = currentOrderCombo;
			tempCurrentItem.quantity = orderDishCount;
			if (isPromotionItem && onEditPromotionItem && selectedPromotion?.length && !currentItem.isLocalExchangePurchaseItem) {
				tempCurrentItem.ruleId = ruleId;
				onEditPromotionItem(tempCurrentItem, ruleId);
			} else this.props.replaceComboOrder(tempCurrentItem, editingSequence ?? tempCurrentItem.sequence);
			toast_default.info(t("edit-success"), "top");
			this.props.onCloseModal();
		} else {
			tempCurrentItem.sectionDetail = currentOrderCombo;
			tempCurrentItem.quantity = orderDishCount;
			if (isInFreeItem && !currentItem.isFreeItem || isSpecialItem) {
				onAddFreeItem({
					remark: {
						optionName: "",
						optionType: "NOTE",
						quantity: 1,
						price: 0
					},
					...tempCurrentItem
				});
				this.props.onCloseModal();
				return;
			} else if (isPromotionItem) {
				if (buyGifts?.length && selectedPromotion?.length) onEditPromotionItem(tempCurrentItem, ruleId);
				else onEditPromotionItem({
					remark: {
						optionName: "",
						optionType: "NOTE",
						quantity: 1,
						price: 0
					},
					promotionItem: true,
					ruleId,
					...tempCurrentItem
				});
				this.props.onCloseModal();
				return;
			}
			this.props.addCombo2Order(tempCurrentItem);
			if (tempCurrentItem.isFreeItem) this.props.setTempCampaign([tempCurrentItem]);
			this.props.onCloseModal();
		}
	};
	changeDishNum = (num) => {
		if (num > defaultMax || num < 1) return;
		this.setState({ orderDishCount: num });
	};
	showRequireLabel = (id) => {
		this.setState({ showRequireId: id });
	};
	scrollGeneralUsePanelToTop = () => {
		this.generalUsePanelDom?.scrollToTop();
	};
	showDescModal = (title, value, callback) => {
		this.setState({
			descVisible: true,
			descTitle: title,
			descValue: value || "",
			descCallback: callback
		});
	};
	hideDescModal = () => {
		this.setState({
			descVisible: false,
			descValue: "",
			descTitle: "",
			descCallback: null
		});
	};
	handleDescModalConfirm = (value) => {
		const { descCallback } = this.state;
		if (descCallback) descCallback(value);
		this.hideDescModal();
	};
	render() {
		const { currentItem, selfConfig, onCloseModal, isInFreeItem = false, isSpecialItem = false, onAddFreeItem, isPromotionItem, isExchangePurchase = false, max, t, itemPoints, itemVoucherPrice, state } = this.props;
		const { sectionIndex, sectionList, sectionId, comboAllChildDish, orderDishCount, showRequireId, descVisible, descValue, descTitle } = this.state;
		let comboPanel = null;
		const isShowComboSideNav = selfConfig?.configMap?.id_19;
		if (currentItem.id && sectionList) comboPanel = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: fullComboPanel_module_default.comboStepBox,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: { display: isShowComboSideNav ? "block" : "none" },
					className: fullComboPanel_module_default.sctHeaderContainer,
					ref: this.sideNavDom,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(sidenav_default, {
						sideNavList: sectionList,
						setCurSectionId: this.setCurSectionId,
						sectionIndex,
						handleChildUpTop: this.handleChildUpTop,
						isInFreeItem,
						isPromotionItem
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					id: "fullComboPanelId",
					style: { marginLeft: isShowComboSideNav ? "32rem" : "0" },
					className: fullComboPanel_module_default.fullComboPanel,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(generalUsePanel_default, {
						onRef: this.generalUsePanel,
						setCurSectionId: this.setCurSectionId,
						onScrollSectionChange: this.onScrollSectionChange,
						sideNavList: sectionList,
						comboAllChildDish,
						itemId: currentItem.id,
						isInFreeItem,
						isSpecialItem,
						isPromotionItem,
						isExchangePurchase,
						itemPoints,
						itemVoucherPrice,
						showRequireId,
						showDescModal: this.showDescModal,
						onScroll: this.props.onScroll
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: fullComboPanel_module_default.footBtnBox,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboFooter_default, {
						sideNavList: sectionList,
						isInFreeItem,
						isSpecialItem,
						isPromotionItem,
						isExchangePurchase,
						onAddFreeItem,
						max,
						itemPoints,
						itemVoucherPrice,
						setCurSectionId: this.setCurSectionId,
						submitCurrentOrderCombo: this.submitCurrentOrderCombo,
						handleChildUpTop: this.handleChildUpTop,
						orderDishCount,
						changeDishNum: this.changeDishNum,
						showRequireLabel: this.showRequireLabel,
						handleGoBack: onCloseModal,
						scrollGeneralUsePanelToTop: this.scrollGeneralUsePanelToTop
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DescModal, {
					preVal: descValue,
					visible: descVisible,
					title: descTitle,
					onClose: this.hideDescModal,
					onSetVal: this.handleDescModalConfirm
				})
			]
		});
		return comboPanel;
	}
};
function mapStateToProps(state) {
	return {
		currentCategoryList: state.currentCategoryList,
		currentOrder: state.currentOrder,
		isOrderEdit: state.orderEdit.isOrderEdit,
		editComboQty: state.orderEdit.editComboQty,
		currentItem: state.currentItem,
		currentOrderCombo: state.currentOrderCombo,
		selfConfig: state.selfConfig,
		promotion: state.promotion,
		avocado: state.avocado,
		menuGroup: state.menuGroup
	};
}
var fullComboPanel_default = connect(mapStateToProps, {
	addCombo2Order,
	replaceComboOrder,
	setTempCampaign
})(withTranslation()(FullComboPanel));
//#endregion
export { fullComboPanel_default as default };
