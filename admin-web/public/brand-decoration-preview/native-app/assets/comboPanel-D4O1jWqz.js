const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./fullComboPanel-ZP46yP1H.js","./toast-C8a1ReSo.js","./toast-oEOJ74Oh.css","./utils-Cdx9DbDR.js","./es-CFYDnMm2.js","./react-router-zXytb7Dz.js","./tiny-warning.esm-Cf7nlwXj.js","./setPrototypeOf-fzM5qJP3.js","./actions-BwRPwnFF.js","./native-store-B_9Z_F59.js","./kioskConfigApi-68IKDHob.js","./native-i18n-Bya1piKW.js","./i18nInstance-DFZX1Hui.js","./withTranslation-B2KLWeHY.js","./useTranslation-BJXMWyG7.js","./icon-CewZkCRp.js","./icon-B0ozedc9.css","./VtKeyboard-THFka-J_.js","./VtKeyboard-BziWIHJP.css","./debounce-BPwiJQPb.js","./isEqual-PfNrN1Me.js","./checkCRMIntegrationCampaign-Bubup5KG.js","./resolveCRMRewardItem-Du3vuEgI.js","./omit-DznhFjWg.js","./PromotionTagsWrap-CjrBw9bq.js","./classnames-CpUpjBdR.js","./objectWithoutProperties-DDcNLcsK.js","./getPromotionCenterDisplayText-Bfjuriuq.js","./getItemCardProperties-CHuqwFqK.js","./getImageHost-CiGAQi_-.js","./PromotionTagsWrap-DY3fP8OM.css","./star-C6iOuR53.js","./star-Bawd9sot.css","./DescModal-Q1_miAgO.js","./dialog-B9IyI7AU.js","./dialog-DX0HK5qt.css","./ButtonBase-CpioktX3.js","./createSvgIcon-DxdaFuGn.js","./DescModal-D4HzYle2.css","./itemCard-A1oFTMZK.js","./itemCard-BIcTjMY_.css","./getComboSectionItem-BQc55mkq.js","./round-CmfkCJn-.js","./getComboSectionItem-C6GLPYB8.css","./comboItemsDetailModal-W9qdOX-Y.js","./comboItemsDetailModal-DDwUS2Jr.css","./bottomToast-B74lRND-.js","./bottomToast-554wkuSX.css","./setComboItemBasePrice-B4XHluz0.js","./fullComboPanel-BiZA4sFF.css","./ComboHeader-1fpnSkDZ.js","./ComboHeader-DCNVP6mw.js","./arrow-right-BJDuAGvX.js","./backHomeModal-p8XgRZSA.js","./backHomeModal-icAaDDtJ.css","./MobyBattery-HWZsMM4L.js","./MobyBattery-Hs7r7u2r.css","./ComboHeader-C85vVzuX.css"])))=>i.map(i=>d[i]);
import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { V as __vitePreload } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { I as initCurrentOrderCombo, ft as resetCurrentOrderCombo } from "./actions-BwRPwnFF.js";
import { t as RotateLoading } from "./rotateLoading-ByQXAFnC.js";
//#region source-snapshot/src/container/comboPanel/comboPanel.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var comboPanel_module_default = { comboPanelBx: "comboPanelBx___aCh8H" };
//#endregion
//#region source-snapshot/src/component/FallbackLoading/index.module.scss
var import_jsx_runtime = require_jsx_runtime();
var index_module_default = { loadingWrapper: "loadingWrapper___1F1KK" };
//#endregion
//#region source-snapshot/src/component/FallbackLoading/index.js
var FallbackLoading = (props) => {
	const [show, setShow] = (0, import_react.useState)(false);
	const { visible, delay = 300 } = props;
	const isControlled = visible !== void 0;
	(0, import_react.useEffect)(() => {
		if (isControlled) {
			if (!visible) {
				setShow(false);
				return;
			}
			const timer = setTimeout(() => setShow(true), delay);
			return () => clearTimeout(timer);
		}
		const timer = setTimeout(() => setShow(true), delay);
		return () => clearTimeout(timer);
	}, [
		isControlled,
		visible,
		delay
	]);
	if (!show) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: index_module_default.loadingWrapper,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateLoading, {})
	});
};
//#endregion
//#region source-snapshot/src/container/comboPanel/index.js
var FullComboPanel = (0, import_react.lazy)(() => __vitePreload(() => import("./fullComboPanel-ZP46yP1H.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49]), import.meta.url));
var ComboHeader = (0, import_react.lazy)(() => __vitePreload(() => import("./ComboHeader-1fpnSkDZ.js"), __vite__mapDeps([50,51,1,2,3,4,5,6,7,8,9,10,11,12,13,14,52,53,34,35,54,15,16,55,56,57]), import.meta.url));
var ComboPanel = class extends import_react.Component {
	state = { comboScrollY: 0 };
	componentWillMount() {
		if (this.props.currentOrderCombo.length === 0 && !this.props.itemInfo) {
			const { currentCategoryList, currentItem } = this.props;
			const itemInfo = { ...currentItem };
			const currentCategory = currentCategoryList?.find((cate) => cate.saleItems?.find((item) => item.id === itemInfo.id));
			this.props.initCurrentOrderCombo(itemInfo, currentCategory);
		}
		if (this.props.itemInfo) {
			const { currentCategoryList } = this.props;
			const itemInfo = this.props.itemInfo;
			const currentCategory = currentCategoryList?.find((cate) => cate.saleItems?.find((item) => item.id === itemInfo.id));
			this.props.initCurrentOrderCombo(itemInfo, currentCategory);
		}
	}
	componentWillUnmount() {
		this.props.resetCurrentOrderCombo();
	}
	getComboScrollY = (value) => {
		this.setState({ comboScrollY: value });
	};
	render() {
		const { onCloseModal, comboPanelIdx, isInFreeItem = false, isSpecialItem = false, isPromotionItem, isExchangePurchase = false, onAddFreeItem, max, itemPoints, itemVoucherPrice, onEditPromotionItem, ruleId, selectedPromotion, editingSequence } = this.props;
		const { comboScrollY } = this.state;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: comboPanel_module_default.comboPanelBx,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Suspense, {
				fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FallbackLoading, {}),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboHeader, {
					handleGoBack: onCloseModal,
					comboScrollY
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FullComboPanel, {
					isInFreeItem,
					isSpecialItem,
					onAddFreeItem,
					max,
					itemPoints,
					itemVoucherPrice,
					comboPanelIdx,
					onCloseModal,
					isPromotionItem,
					isExchangePurchase,
					onEditPromotionItem,
					selectedPromotion,
					editingSequence,
					ruleId,
					onScroll: this.getComboScrollY
				})]
			})
		});
	}
};
function mapStateToProps(state) {
	return {
		currentItem: state.currentItem,
		currentCategoryList: state.currentCategoryList,
		currentOrderCombo: state.currentOrderCombo,
		crm: state.crm
	};
}
var comboPanel_default = connect(mapStateToProps, {
	initCurrentOrderCombo,
	resetCurrentOrderCombo
})(ComboPanel);
//#endregion
export { FallbackLoading as n, comboPanel_default as t };
