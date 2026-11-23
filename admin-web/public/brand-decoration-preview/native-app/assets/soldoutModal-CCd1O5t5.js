import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { d as on, u as off } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { _r as getMissingRequiredCategories, mr as getDishItemLanguage, pr as getCurrentItemLanguage } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import "./moreTip-DweVCJKq.js";
//#region source-snapshot/src/component/soldoutModal/soldoutModal.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var soldoutModal_module_default = {
	soldoutBox: "soldoutBox___3KSUF",
	title: "title___6lkdU",
	soldoutContent: "soldoutContent___Cj3Tn",
	name: "name___XPmS8",
	soldoutBtn: "soldoutBtn___pZAzo",
	reorder: "reorder___G9--C",
	"continue": "continue___Qau9P",
	soldoutTip: "soldoutTip___lF4zu"
};
var requireCategoryTip_module_default = {
	categoryTipBox: "categoryTipBox___q2nAa",
	tipTitle: "tipTitle___eyyp5"
};
//#endregion
//#region source-snapshot/src/component/requireCategoryTip/index.js
var import_jsx_runtime = require_jsx_runtime();
var RequireCategoryTip = class extends import_react.Component {
	render() {
		const { t, i18n: { language }, requireCategory, currentOrder, onlyMissing } = this.props;
		let categoryNameList = [];
		let tip = "";
		(onlyMissing ? getMissingRequiredCategories(requireCategory, currentOrder.itemList) : requireCategory).forEach((item) => {
			const itemName = getCurrentItemLanguage(item.fieldDisplayNameGroups, language) || item.name;
			categoryNameList.push(itemName);
		});
		if (categoryNameList.length == 1) tip = t("category-tip-single");
		else tip = t("category-tips");
		if (!categoryNameList.length) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: requireCategoryTip_module_default.categoryTipBox,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: requireCategoryTip_module_default.tipTitle,
				children: [
					categoryNameList.join(", "),
					", ",
					tip
				]
			})
		});
	}
};
function mapStateToProps$1(state) {
	return {
		requireCategory: state.requireCategory,
		currentOrder: state.currentOrder
	};
}
var requireCategoryTip_default = connect(mapStateToProps$1)(withTranslation()(RequireCategoryTip));
//#endregion
//#region source-snapshot/src/component/soldoutModal/index.js
var SoldoutModal = class extends import_react.Component {
	constructor() {
		super();
		this.state = {
			isScroll: false,
			isShowMore: false
		};
	}
	handleScroll = () => {
		if (!this.state.isScroll) this.setState({ isScroll: true }, () => {
			off(this.scrollDom, "scroll", this.handleScroll);
		});
	};
	handleReorder = () => {
		this.props.reorder();
	};
	handleContinueReorder = () => {
		this.props.continueReorder();
	};
	handleBackHome = () => {
		this.props.history.push("/");
	};
	formatterRequireCategory = (list) => {
		const { requireCategory } = this.props;
		if (requireCategory.length) {
			let obj = {};
			requireCategory.forEach((c) => {
				obj[c.id] = 0;
			});
			list.forEach((item) => {
				if (obj.hasOwnProperty(item.categoryId)) obj[item.categoryId] += item.quantity;
			});
			return obj;
		} else return null;
	};
	filterSameIdDish = (soldoutDetailList) => {
		const soldoutArr = [];
		soldoutDetailList.forEach((detail) => {
			const currentIdentity = detail?.cloudId ?? detail?.id;
			const compareKey = `${detail?.soldoutType || "item"}_${currentIdentity}`;
			if (!soldoutArr.find((item) => {
				const itemIdentity = item?.cloudId ?? item?.id;
				return `${item?.soldoutType || "item"}_${itemIdentity}` === compareKey;
			})) soldoutArr.push(detail);
		});
		return soldoutArr;
	};
	getDisplayItemName = (item, language) => {
		if (!item) return "";
		return getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name || "";
	};
	componentDidMount() {
		if (this.scrollDom) {
			this.setState({ isShowMore: !!(this.scrollDom.scrollHeight > this.scrollDom.offsetHeight) });
			on(this.scrollDom, "scroll", this.handleScroll);
		}
	}
	componentWillUnmount() {
		off(this.scrollDom, "scroll", this.handleScroll);
	}
	render() {
		const { t, i18n: { language }, isHasSoldoutDish, dishMap: { saleList, slodoutList, soldoutDetailList = [] }, requireCategory, inOrderPage } = this.props;
		let requireBool = false;
		let title = "";
		let isCartAllSold = false;
		const filteredSoldoutDetailList = this.filterSameIdDish(soldoutDetailList.length ? soldoutDetailList : slodoutList);
		if (!saleList.length) {
			isCartAllSold = true;
			title = "sold-out-title-cart";
		} else {
			isCartAllSold = false;
			title = "sold-out-title-list";
		}
		if (requireCategory.length) {
			let m = this.formatterRequireCategory(saleList);
			let arr = [];
			for (let key in m) arr.push(m[key]);
			requireBool = !arr.every((n) => n > 0);
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			visible: isHasSoldoutDish,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: soldoutModal_module_default.soldoutBox,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: soldoutModal_module_default.soldoutIcon,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
							type: "svg_warn",
							size: 8
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: soldoutModal_module_default.title,
						children: t([title])
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: soldoutModal_module_default.soldoutContent,
						ref: (el) => this.scrollDom = el,
						children: filteredSoldoutDetailList.map((detail, idx) => {
							const itemName = this.getDisplayItemName(detail, language);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: soldoutModal_module_default.name,
								children: [
									idx + 1,
									"、",
									itemName
								]
							}, detail.soldoutDisplayKey || `${detail.id}_${idx}`);
						})
					}),
					inOrderPage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: soldoutModal_module_default.soldoutBtn,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `${soldoutModal_module_default.continue} linear-animate-btn`,
							onClick: this.handleContinueReorder,
							children: t("continue-order-in-order-page")
						})
					}) : isCartAllSold || requireCategory.length && requireBool ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: soldoutModal_module_default.soldoutBtn,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: soldoutModal_module_default.reorder,
							onClick: this.handleBackHome,
							children: t("cancel_order")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `${soldoutModal_module_default.continue} linear-animate-btn`,
							onClick: this.handleReorder,
							children: t("reorder")
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: soldoutModal_module_default.soldoutBtn,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: soldoutModal_module_default.reorder,
							onClick: this.handleReorder,
							children: t("reorder")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `${soldoutModal_module_default.continue} linear-animate-btn`,
							onClick: this.handleContinueReorder,
							children: t("continue-order")
						})]
					}),
					requireCategory.length && requireBool && !inOrderPage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(requireCategoryTip_default, {}) : null,
					inOrderPage || isCartAllSold ? null : requireCategory.length && requireBool ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: soldoutModal_module_default.soldoutTip,
						children: t("sold-out-tip")
					})
				]
			})
		});
	}
};
function mapStateToProps(state) {
	return { requireCategory: state.requireCategory };
}
var soldoutModal_default = withRouter(connect(mapStateToProps)(withTranslation()(SoldoutModal)));
//#endregion
export { requireCategoryTip_default as n, soldoutModal_default as t };
