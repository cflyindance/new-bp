import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { p as solveScrollElem } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { $i as floatNumberRounding, Pt as setEditComboQty, Q as removeFootOptComboSection, Qi as Big, Z as removeFootItemComboSection, Zi as getItemPrice, _ as clearFootItemComboSection, da as require_cloneDeep, gr as getItemSizeName, lt as replaceComboOrder, mr as getDishItemLanguage, pr as getCurrentItemLanguage, sr as allRangHandler, vr as getOneUncompletedSection, wi as getPromotionModalDisplayPrice } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as star_default } from "./star-C6iOuR53.js";
import { c as require_Remove, l as require_Add, u as Fab_default } from "./DescModal-Q1_miAgO.js";
import { t as require_round } from "./round-CmfkCJn-.js";
//#region source-snapshot/src/container/comboPanel/comboFooter/comboItemsDetailModal/comboItemsDetailModal.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_Add = /* @__PURE__ */ __toESM(require_Add());
var import_Remove = /* @__PURE__ */ __toESM(require_Remove());
var comboItemsDetailModal_module_default = {
	drawBody: "drawBody___wd96Q",
	header: "header___9g-O0",
	content: "content___i8aJv",
	box: "box___sR7SF",
	itemHeader: "itemHeader___QLLZe",
	calcBox: "calcBox___boqxo",
	point: "point___CXyiz",
	pointImg: "pointImg___n8XlU",
	pointValue: "pointValue___AwaNO",
	itemsBox: "itemsBox___q06CH",
	item: "item___2TNHk",
	opt2: "opt2___wuLul",
	contentReview: "contentReview___xgaw3",
	"continue": "continue___9t3GV",
	foot: "foot___LKYRJ",
	countBtn: "countBtn___EwSjZ",
	muiDiyIcon: "muiDiyIcon___tRVKB",
	count: "count___x-rrK",
	btnDis: "btnDis___CMwe3",
	btnEn: "btnEn___nzZjn",
	addCart: "addCart___M-uMi",
	price: "price___7jvh5"
};
//#endregion
//#region source-snapshot/src/container/comboPanel/comboFooter/comboItemsDetailModal/index.js
var import_round = /* @__PURE__ */ __toESM(require_round());
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_jsx_runtime = require_jsx_runtime();
var defaultMax = 99;
var ComboItemsDetailModal = class extends import_react.Component {
	constructor() {
		super();
		this.state = {
			sectionId: null,
			itemInfo: {},
			isSpecial: false,
			cloneSideNavList: [],
			maxNum: defaultMax,
			chooseNum: 1,
			orderPanelShow: false
		};
	}
	viewOrderPanel = (e) => {
		let chooseNum = 1;
		if (this.props.history.location.pathname.indexOf("/orderReview") > -1) chooseNum = this.props?.comboInfo?.quantity || 1;
		this.setState({
			sectionId: e?.sectionId || null,
			itemInfo: e?.itemInfo || {},
			chooseNum,
			orderPanelShow: true
		}, () => {
			solveScrollElem(true);
		});
	};
	closePanel = () => {
		solveScrollElem(false);
		this.setState({
			sectionId: null,
			itemInfo: {},
			orderPanelShow: false
		});
	};
	showCollectOptions = (list, p, isInFreeItem, isPromotionItem) => {
		const { i18n: { language }, isExchangePurchase = false } = this.props;
		const isPromotionItemFree = isPromotionItem && !isExchangePurchase;
		let sizeArr = [];
		let optionArr = [];
		let remarkArr = [];
		if (!list.find((p) => p.id == -1)) sizeArr.push("$" + (isInFreeItem || isPromotionItemFree ? "0.00" : (0, import_round.default)(p.price, 2).toFixed(2)));
		if (p?.remark?.optionName) remarkArr.push(p.remark.optionName);
		if (list && list.length) list.forEach((item) => {
			if (item.sizeInfo) {
				let size = getItemSizeName(item.sizeInfo.sizeId, item.sizeInfo.size, this.props.itemSizeList, language);
				sizeArr.push(`${size}($${isInFreeItem || isPromotionItemFree ? "0.00" : (0, import_round.default)(item.sizeInfo.price, 2).toFixed(2)})`);
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
					optionArr.push(`${tItem.name}($${isInFreeItem || isPromotionItemFree ? "0.00" : tItem.price})x${tItem.count}`);
				});
			}
		});
		return [
			...sizeArr,
			...optionArr,
			...remarkArr
		].join(", ");
	};
	handleJumpItems = (obj) => {
		const { sideNavList, isOrderEdit } = this.props;
		let r = !!(this.props.history.location.pathname.indexOf("/orderReview") > -1);
		let idx = 0;
		if (obj.id == -2) idx = 0;
		else idx = sideNavList?.findIndex((s) => s.id == obj.id) ?? 0;
		if (isOrderEdit && r) {
			this.props.setEditComboQty(this.state.chooseNum);
			this.props.openComboDetail(idx);
			this.setState({ orderPanelShow: false });
		} else this.closePanel();
	};
	handleRemoveItems = (sectionId, p, idx) => {
		const { t, sideNavList, isOrderEdit } = this.props;
		let r = !!(this.props.history.location.pathname.indexOf("/orderReview") > -1);
		if (sectionId > 0) this.props.removeFootItemComboSection({
			sectionId,
			idx,
			sideNavList
		});
		else this.props.removeFootOptComboSection({
			sectionId,
			p
		});
		if (isOrderEdit && r) {
			if (sectionId == -2) {} else sideNavList?.findIndex((s) => s.id == sectionId);
			this.props.setEditComboQty(this.state.chooseNum);
			this.props.openComboDetail(idx);
			this.setState({ orderPanelShow: false });
		}
	};
	handleClearItems = (id) => {
		const { t, sideNavList, isOrderEdit } = this.props;
		let r = !!(this.props.history.location.pathname.indexOf("/orderReview") > -1);
		this.props.clearFootItemComboSection({ id });
		if (isOrderEdit && r) {
			let i = 0;
			if (id == -2) i = 0;
			else i = sideNavList?.findIndex((s) => s.id == id) ?? 0;
			this.props.setEditComboQty(this.state.chooseNum);
			this.props.openComboDetail(i);
			this.setState({ orderPanelShow: false });
		}
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
	changeChooseNum(isAdd) {
		const { t } = this.props;
		let { maxNum, chooseNum } = this.state;
		let n = isAdd ? chooseNum + 1 : chooseNum - 1;
		if (n >= maxNum) toast_default.info(t("max-up", { rplc: defaultMax }), "top");
		this.setState({ chooseNum: n });
	}
	addOrder = () => {
		const { t, currentOrderCombo, currentItem } = this.props;
		const tempCurrentItem = Object.assign({}, currentItem);
		tempCurrentItem.sectionDetail = currentOrderCombo;
		tempCurrentItem.quantity = this.state.chooseNum;
		this.props.replaceComboOrder(tempCurrentItem, tempCurrentItem.sequence);
		toast_default.info(t("edit-success"), "top");
		this.closePanel();
	};
	findIndexByItemId = (list, itemId) => {
		return list.findIndex((_) => _.id == itemId);
	};
	componentDidMount() {
		this.props.onRef(this);
	}
	componentDidUpdate(prevProps, prevState) {
		if (this.state.orderPanelShow && prevState.orderPanelShow != this.state.orderPanelShow) {
			const { sideNavList, currentOrderCombo } = this.props;
			let isSpecial = false;
			const cloneSideNavList = (0, import_cloneDeep.default)(sideNavList);
			if (!!!currentOrderCombo.find((s) => s.id == -1)) {
				isSpecial = true;
				let i = cloneSideNavList.findIndex((side) => side.id == -1);
				if (i > -1) cloneSideNavList.splice(i, 1);
			}
			let idx_z = cloneSideNavList.findIndex((side) => side.id > 0);
			let r = currentOrderCombo.find((side) => side.id == -2);
			if (r) cloneSideNavList.splice(idx_z, 0, (0, import_cloneDeep.default)(r));
			this.setState({
				isSpecial,
				cloneSideNavList
			});
		}
	}
	render() {
		const { t, i18n: { language }, currentOrderCombo, sideNavList, isOrderEdit, currentItem, isInFreeItem, isSpecialItem, itemPoints, isPromotionItem, isExchangePurchase = false } = this.props;
		const isPromotionItemFree = isPromotionItem && !isExchangePurchase;
		const { itemInfo, sectionId, isSpecial, orderPanelShow, chooseNum, maxNum } = this.state;
		let cloneSideNavList = [];
		if (sectionId) cloneSideNavList = this.state.cloneSideNavList.filter((cs) => cs.id == sectionId);
		else cloneSideNavList = this.state.cloneSideNavList;
		const chooseTipMap = allRangHandler(sideNavList, t, {
			isInFreeItem,
			isPromotionItem
		});
		const priceObj = this.calcPrice(currentOrderCombo);
		let totalPrice = Number.parseFloat(this.calcTotalPrice(priceObj)).toFixed(2);
		let isReviewStatus = !!(isOrderEdit && !!(this.props.history.location.pathname.indexOf("/orderReview") > -1));
		let singlePrice = "0.00";
		if (isSpecial) {
			singlePrice = Number.parseFloat(currentItem.price || 0).toFixed(2);
			totalPrice = Big(totalPrice).plus(Number.parseFloat(singlePrice)).toNumber();
		}
		totalPrice = Number.parseFloat(Big(totalPrice).times(chooseNum).toNumber()).toFixed(2);
		const _maxNum = isInFreeItem || isPromotionItem ? 1 : maxNum;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			visible: orderPanelShow,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: comboItemsDetailModal_module_default.drawBody,
				onClick: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: comboItemsDetailModal_module_default.header }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: [comboItemsDetailModal_module_default.content, isReviewStatus ? comboItemsDetailModal_module_default.contentReview : ""].join(" "),
						children: [isSpecial && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: comboItemsDetailModal_module_default.box,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: comboItemsDetailModal_module_default.itemHeader,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: currentItem?.fieldDisplayNameGroups?.length && getDishItemLanguage(currentItem.fieldDisplayNameGroups, language) || currentItem.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: comboItemsDetailModal_module_default.calcBox,
									children: isInFreeItem ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: comboItemsDetailModal_module_default.point,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											className: comboItemsDetailModal_module_default.pointImg,
											src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAMAAAC7m5rvAAAAllBMVEUAAAD2kBLyiBH0kBP1khX0kRT1lRf4oRzxhA/xgg38siPtcwf7riH2lxfzjhPudgn4oBvxhA/0kxb7sCTucwfzkhX9tCT3nhvtbwX2nBnyiBDrcwj8tyb7riLvfQz8uCfrawT1kxX8siPscgf9tST9uif8tCXtcAb1lBXzjBL4oRv3mhjyhg76qR7wfwzvdwj8siLtcAZrWjNvAAAAKHRSTlMAEB/vj2A/398vjYzf39/fz8+/YF9QH+/vem9A7+/vv7+fT08/MJ+fS0oxsgAAAWtJREFUSMfN1mlzgjAQBmATbvCqCAhUW4+24cb//+dKkrFbBgSSmTLd78+82TWYXfybwliKWZYU8zQpFqpSbLeTYooio3RCdAl2JkSmuTUhChJWWkIIiSTCmlqJhyXUaWIKr5kigVh3asJZJjRML2mKsUwXOKJJFWcBnqqQmT/CmjLQRPWSc8ZdukUTVZtNctjMgVHVlDHaX3wqgVGXMncZRMgpS2AQVxS2/1ztT1WbZT+sWLpPkqJNRRVn4KiirhfGzqGi1ctSxup6+XmD0Vl75/1wv3PFWdKXVtN6fbMvHz5j1xbrpmVpi7mM8Yq/Nu1DgoK0o33rmSMfSd/vVrCRhKgNAHZH8kg7ugM3y+GqO0l7+F5ezb5DBvr4Ve6mGf70DwfYFv3BZwrO/N2bAWqksALMwAKPFDBP8O+VK7G3CincrbDwO0VLm+ehWkQQJtYdhAkNk5DzDAsGrDNzLk9qKMU0b5Y1dHzp/QZM7WiNGMfEbgAAAABJRU5ErkJggg==",
											alt: "point"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: comboItemsDetailModal_module_default.pointValue,
											children: [
												itemPoints,
												" ",
												t("pts")
											]
										})]
									}) : isPromotionItemFree ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$0.00" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", (0, import_round.default)(singlePrice, 2).toFixed(2)] })
								})]
							})
						}), cloneSideNavList.map((item) => {
							let idx = this.findIndexByItemId(currentOrderCombo, item.id);
							let isShowContinue = true;
							if (item.id > 0) isShowContinue = getOneUncompletedSection(sideNavList, currentOrderCombo)[item.id]?.isContinueChoose;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: [comboItemsDetailModal_module_default.box, item.id == -2 && comboItemsDetailModal_module_default.opt2].join(" "),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: comboItemsDetailModal_module_default.itemHeader,
										children: [item.id == -1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item?.info?.fieldDisplayNameGroups?.length && getDishItemLanguage(item.info.fieldDisplayNameGroups, language) || item.info?.name }) : item.id == -2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("item_option") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [item?.fieldDisplayNameGroups?.length && getCurrentItemLanguage(item.fieldDisplayNameGroups, language) || item.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: chooseTipMap[item.id] || "" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: comboItemsDetailModal_module_default.calcBox,
											style: { display: sectionId ? "none" : "flex" },
											children: [isInFreeItem && item.id === -1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: comboItemsDetailModal_module_default.point,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													className: comboItemsDetailModal_module_default.pointImg,
													src: star_default,
													alt: "point"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: comboItemsDetailModal_module_default.pointValue,
													children: [
														itemPoints,
														" ",
														t("pts")
													]
												})]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", isInFreeItem || isPromotionItemFree ? "0.00" : priceObj?.[item.id] && priceObj?.[item.id]?.t != null && Number(priceObj?.[item.id]?.t).toFixed(2) || "0.00"] }), currentOrderCombo[idx] && currentOrderCombo[idx].items && currentOrderCombo[idx].items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
												onClick: () => this.handleClearItems(item.id),
												children: "-"
											}) : currentOrderCombo[idx] && currentOrderCombo[idx].options && currentOrderCombo[idx].options.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
												onClick: () => this.handleClearItems(item.id),
												children: "-"
											}) : null]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: comboItemsDetailModal_module_default.itemsBox,
										children: [currentOrderCombo[idx] && currentOrderCombo[idx].items && currentOrderCombo[idx].items.map((p, i) => {
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: comboItemsDetailModal_module_default.item,
												style: { display: sectionId ? itemInfo?.id == p.id ? "flex" : "none" : "flex" },
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													p?.fieldDisplayNameGroups?.length && getDishItemLanguage(p.fieldDisplayNameGroups, language) || p.name,
													":",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: this.showCollectOptions(p.selectedOptionList, p, isInFreeItem, isPromotionItem) })
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: comboItemsDetailModal_module_default.calcBox,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", isInFreeItem || isPromotionItemFree ? "0.00" : priceObj[item.id] && priceObj[item.id]?.subList && priceObj[item.id]?.subList?.[i]?.toFixed(2) || "0.00"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
														onClick: () => this.handleRemoveItems(item.id, p, i),
														children: "-"
													})]
												})]
											}, p.id + "_" + i);
										}), currentOrderCombo[idx] && currentOrderCombo[idx].options && currentOrderCombo[idx].options.map((p, i) => {
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: comboItemsDetailModal_module_default.item,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p?.fieldDisplayNameGroups?.length && getCurrentItemLanguage(p.fieldDisplayNameGroups, language) || p.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: comboItemsDetailModal_module_default.calcBox,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", isInFreeItem || isPromotionItemFree ? "0.00" : (0, import_round.default)(p.price, 2).toFixed(2)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
														onClick: () => this.handleRemoveItems(item.id, p, i),
														children: "-"
													})]
												})]
											}, p.id + "_" + i);
										})]
									}),
									currentOrderCombo[idx] && currentOrderCombo[idx].sizeInfo && currentOrderCombo[idx].sizeInfo.id ? null : currentOrderCombo[idx] && currentOrderCombo[idx].items ? isShowContinue ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: comboItemsDetailModal_module_default.continue,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("continue-choose") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
											onClick: () => {
												this.handleJumpItems(currentOrderCombo[idx]);
											},
											children: "+"
										})]
									}) : null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: comboItemsDetailModal_module_default.continue,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("continue-choose") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
											onClick: () => {
												this.handleJumpItems(currentOrderCombo[idx]);
											},
											children: "+"
										})]
									})
								]
							}, item.id);
						})]
					}),
					isReviewStatus && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: comboItemsDetailModal_module_default.foot,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: comboItemsDetailModal_module_default.countBtn,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: chooseNum === 1,
									"aria-label": "Remove",
									className: chooseNum > 1 ? `${comboItemsDetailModal_module_default.btnEn} animate-btn` : comboItemsDetailModal_module_default.btnDis,
									onClick: () => this.changeChooseNum(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: comboItemsDetailModal_module_default.muiDiyIcon })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: comboItemsDetailModal_module_default.count,
									children: chooseNum
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: chooseNum === _maxNum,
									"aria-label": "Add",
									className: chooseNum !== _maxNum ? `${comboItemsDetailModal_module_default.btnEn} animate-btn` : comboItemsDetailModal_module_default.btnDis,
									onClick: () => this.changeChooseNum(true),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: comboItemsDetailModal_module_default.muiDiyIcon })
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `${comboItemsDetailModal_module_default.addCart} linear-animate-btn`,
							onClick: this.addOrder,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("confirm") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: comboItemsDetailModal_module_default.price,
								children: isInFreeItem ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAMAAAC7m5rvAAAAllBMVEUAAAD2kBLyiBH0kBP1khX0kRT1lRf4oRzxhA/xgg38siPtcwf7riH2lxfzjhPudgn4oBvxhA/0kxb7sCTucwfzkhX9tCT3nhvtbwX2nBnyiBDrcwj8tyb7riLvfQz8uCfrawT1kxX8siPscgf9tST9uif8tCXtcAb1lBXzjBL4oRv3mhjyhg76qR7wfwzvdwj8siLtcAZrWjNvAAAAKHRSTlMAEB/vj2A/398vjYzf39/fz8+/YF9QH+/vem9A7+/vv7+fT08/MJ+fS0oxsgAAAWtJREFUSMfN1mlzgjAQBmATbvCqCAhUW4+24cb//+dKkrFbBgSSmTLd78+82TWYXfybwliKWZYU8zQpFqpSbLeTYooio3RCdAl2JkSmuTUhChJWWkIIiSTCmlqJhyXUaWIKr5kigVh3asJZJjRML2mKsUwXOKJJFWcBnqqQmT/CmjLQRPWSc8ZdukUTVZtNctjMgVHVlDHaX3wqgVGXMncZRMgpS2AQVxS2/1ztT1WbZT+sWLpPkqJNRRVn4KiirhfGzqGi1ctSxup6+XmD0Vl75/1wv3PFWdKXVtN6fbMvHz5j1xbrpmVpi7mM8Yq/Nu1DgoK0o33rmSMfSd/vVrCRhKgNAHZH8kg7ugM3y+GqO0l7+F5ezb5DBvr4Ve6mGf70DwfYFv3BZwrO/N2bAWqksALMwAKPFDBP8O+VK7G3CincrbDwO0VLm+ehWkQQJtYdhAkNk5DzDAsGrDNzLk9qKMU0b5Y1dHzp/QZM7WiNGMfEbgAAAABJRU5ErkJggg==",
									className: comboItemsDetailModal_module_default.pointImg,
									alt: "point"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									itemPoints,
									" ",
									t("pts")
								] })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", getPromotionModalDisplayPrice({
									isPromotionItem,
									isExchangePurchase,
									totalPrice
								})] })
							})]
						})]
					})
				]
			}),
			onClose: this.closePanel
		});
	}
};
function mapStateToProps(state, ownProps) {
	return {
		isOrderEdit: state.orderEdit.isOrderEdit,
		currentItem: state.currentItem,
		sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
		currentOrderCombo: state.currentOrderCombo,
		itemSizeList: state.itemSizeList
	};
}
var comboItemsDetailModal_default = withRouter(connect(mapStateToProps, {
	removeFootItemComboSection,
	removeFootOptComboSection,
	clearFootItemComboSection,
	replaceComboOrder,
	setEditComboQty
})(withTranslation()(ComboItemsDetailModal)));
//#endregion
export { comboItemsDetailModal_default as t };
