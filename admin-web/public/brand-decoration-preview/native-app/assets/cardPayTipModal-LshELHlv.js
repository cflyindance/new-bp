import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { t as require_round } from "./round-CmfkCJn-.js";
//#region source-snapshot/src/component/cardPayTipModal/cardPayTipModal.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var cardPayTipModal_module_default = {
	tipBox: "tipBox___IDWOi",
	title: "title___7IMIL",
	tipBtn: "tipBtn___hYh3S",
	cancel: "cancel___0KTaU",
	confirm: "confirm___tDbNj"
};
//#endregion
//#region source-snapshot/src/component/cardPayTipModal/index.js
var import_round = /* @__PURE__ */ __toESM(require_round());
var import_jsx_runtime = require_jsx_runtime();
var CardPayTipModal = class extends import_react.Component {
	render() {
		const { t, isHasOrderCharge, handleCancel, handleConfirm, selfConfig, systemConfig } = this.props;
		const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
		let rate = 0;
		selfConfig.charge.map((item) => {
			if (item.id === 1 && item.select?.id) {
				if (item.select.ratetype == 1) rate = "$" + (0, import_round.default)(item.select.rate, 2).toFixed(2);
				else if (item.select.ratetype == 2) rate = item.select.rate + "%";
			}
		});
		let htmlStr = t("card-tip", { rplc: rate });
		if (paymentRouteResult.onlyCard) htmlStr = t("card-tip-only-card-pay", { rplc: rate });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			visible: isHasOrderCharge,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cardPayTipModal_module_default.tipBox,
				onClick: (e) => e.stopPropagation(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cardPayTipModal_module_default.title,
					dangerouslySetInnerHTML: { __html: htmlStr }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cardPayTipModal_module_default.tipBtn,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cardPayTipModal_module_default.cancel,
						onClick: handleCancel,
						children: t("cancel")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `${cardPayTipModal_module_default.confirm} linear-animate-btn`,
						onClick: handleConfirm,
						children: t("confirm")
					})]
				})]
			}),
			onClose: handleCancel
		});
	}
};
function mapStateToProps(state) {
	return {
		selfConfig: state.selfConfig,
		systemConfig: state.systemConfig
	};
}
var cardPayTipModal_default = withRouter(connect(mapStateToProps)(withTranslation()(CardPayTipModal)));
//#endregion
export { cardPayTipModal_default as t };
