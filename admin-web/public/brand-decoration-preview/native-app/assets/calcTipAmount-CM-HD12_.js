import { i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { Qi as Big } from "./actions-BwRPwnFF.js";
import { t as Icons } from "./icon-CewZkCRp.js";
require_react();
var tipBtn_module_default = {
	tipBtn: "tipBtn___d5iv1",
	tipBtnText: "tipBtnText___Eql6S",
	tipBtnSelected: "tipBtnSelected___i0Z6k",
	customTip: "customTip___jl86h",
	tipBtnTxtBox: "tipBtnTxtBox___XTxOf"
};
//#endregion
//#region source-snapshot/src/component/TipBtn/index.js
var import_jsx_runtime = require_jsx_runtime();
var TipBtn = (props) => {
	const { id, selected, tipToggler, tipStyle, text, ratio, selfConfig } = props;
	const tipCollectMethodPercentage = selfConfig?.configMap?.id_14[0] === 2;
	const isOpenTipPriceDetail = selfConfig?.configMap?.id_55;
	const showText = tipCollectMethodPercentage && isOpenTipPriceDetail && !id || id || !tipCollectMethodPercentage;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id,
		className: `${tipBtn_module_default.tipBtn} ${tipBtn_module_default[id] || ""} ${selected ? tipBtn_module_default.tipBtnSelected : ""}`,
		onClick: tipToggler,
		style: tipStyle || {},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: tipBtn_module_default.tipBtnTxtBox,
			children: [showText && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: tipBtn_module_default.tipBtnText,
				children: text
			}), ratio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: showText ? tipBtn_module_default.tipBtnRatio : tipBtn_module_default.tipBtnText,
				children: showText ? `(${ratio}%)` : `${ratio}%`
			})]
		}), selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
			type: "check",
			size: 7,
			className: tipBtn_module_default.tipBtnIcon
		})]
	});
};
function mapStateToProps(state) {
	return { selfConfig: state.selfConfig };
}
var TipBtn_default = connect(mapStateToProps)(TipBtn);
//#endregion
//#region source-snapshot/src/utils/calcTipAmount.js
var DEFAULT_TIP_LIST = [
	15,
	20,
	25
];
/**
* 小费百分比计算的基数（税前/税后、扣除订单折扣）
*/
function getTipBasePrice(orderInfo, allSysConfig) {
	let totalPrice = orderInfo.orderSubtotal;
	const totalTax = orderInfo.orderTaxTotal;
	if (!!!(allSysConfig?.TIPS_SUGGESTIONS_CALCULATION?.indexOf("0") > -1)) totalPrice = parseFloat(Big(totalPrice).plus(totalTax).toFixed(2));
	if (orderInfo?.orderDiscount) totalPrice = parseFloat(Big(totalPrice).minus(orderInfo.orderDiscount).toFixed(2));
	return totalPrice;
}
/**
* 小费配置：收取方式（1 固定 / 2 百分比）及选项列表
*/
function getTipConfig(selfConfig, defaultTipList = DEFAULT_TIP_LIST) {
	let tipType = null;
	let tipIptList = [...defaultTipList];
	if (selfConfig?.configMap?.id_14) {
		tipType = selfConfig.configMap.id_14[0];
		tipIptList = [...selfConfig.configMap.id_14[1]];
		tipIptList.sort((a, b) => a - b);
	}
	return {
		tipType,
		tipIptList
	};
}
/**
* 计算小费金额
* 自定义小费始终按固定金额处理，不受 id_14 收取方式（固定/百分比）影响
*/
function calcTipAmount({ tipValue, customTip, tipType, totalPrice }) {
	if (tipValue === null || tipValue === void 0) return null;
	if (customTip) return Big(tipValue || 0).toFixed(2);
	if (tipType == 1) return Big(tipValue || 0).toFixed(2);
	return Big(totalPrice || 0).div(100).times(tipValue || 0).toFixed(2);
}
//#endregion
export { TipBtn_default as i, getTipBasePrice as n, getTipConfig as r, calcTipAmount as t };
