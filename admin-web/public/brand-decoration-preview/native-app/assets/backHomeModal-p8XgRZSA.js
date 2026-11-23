import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
//#region source-snapshot/src/component/backHomeModal/backHomeModal.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var backHomeModal_module_default = {
	containerBox: "containerBox___q9Ov1",
	itemBox: "itemBox___TPeXG",
	itemName: "itemName___Qw2Ev",
	subItemName: "subItemName___3WlTb",
	btnBox: "btnBox___vc8BQ"
};
//#endregion
//#region source-snapshot/src/component/backHomeModal/index.js
var import_jsx_runtime = require_jsx_runtime();
var BackHomeModal = class extends import_react.Component {
	judgeShowTextTip = () => {
		const { isGoBack } = this.props;
		let itemName = "cancel_order_confirm";
		let subItemName = "cancel_order_subtip";
		if (isGoBack) return {
			itemName: "go_to_pre_page",
			subItemName
		};
		if (window.location.hash.indexOf("/signature") > -1) subItemName = "signature_order_subtip";
		else if (window.location.hash.indexOf("/orderFinish") > -1) subItemName = "orderFinish_order_subtip";
		return {
			itemName,
			subItemName
		};
	};
	render() {
		const { t, isShowModal, handleContinue, handleCancel, isGoBack = false } = this.props;
		const msgObj = this.judgeShowTextTip();
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			visible: isShowModal,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: backHomeModal_module_default.containerBox,
				onClick: (e) => e.stopPropagation(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: backHomeModal_module_default.itemBox,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: backHomeModal_module_default.itemName,
						children: t([msgObj.itemName])
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: backHomeModal_module_default.subItemName,
						children: t([msgObj.subItemName])
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: backHomeModal_module_default.btnBox,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						onClick: handleCancel,
						children: t("think-again")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						onClick: handleContinue,
						className: "linear-animate-btn",
						children: t(isGoBack ? "go-back-pre" : "go-back-home")
					})]
				})]
			}),
			onClose: handleCancel
		});
	}
};
var backHomeModal_default = withTranslation()(BackHomeModal);
//#endregion
export { backHomeModal_default as t };
