import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as menusifuLoading } from "./menusifuLoading-BlNMP81R.js";
//#region source-snapshot/src/component/callModal/callModal.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var callModal_module_default = {
	loadBox: "loadBox___dMrSe",
	orderBox: "orderBox___a5O3O",
	msg: "msg___wo3SU",
	orderBottom: "orderBottom___Re-6K",
	itemBox: "itemBox___RQP40",
	itemName: "itemName___BtvnZ",
	subItemName: "subItemName___1RL7O"
};
//#endregion
//#region source-snapshot/src/component/callModal/index.js
var import_jsx_runtime = require_jsx_runtime();
var DELAY = 600;
var CallModal = (props) => {
	const { t } = useTranslation();
	const { loadObj: { msgDone, handlePrint, handleSkip }, callLoading } = props;
	const [show, setShow] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let timer;
		if (callLoading) timer = setTimeout(() => {
			setShow(true);
		}, DELAY);
		else {
			clearTimeout(timer);
			setShow(false);
		}
		return () => clearTimeout(timer);
	}, [callLoading]);
	if (!show) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		visible: show,
		html: msgDone == "fail" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: callModal_module_default.loadBox,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: callModal_module_default.orderBox,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: callModal_module_default.msg,
					children: t("delivery-number-fail")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: callModal_module_default.orderBottom,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: handleSkip,
						children: t("skip")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: handlePrint,
						className: "linear-animate-btn",
						children: t("delivery-number-again")
					})]
				})]
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: callModal_module_default.loadBox,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(menusifuLoading, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: callModal_module_default.itemBox,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: callModal_module_default.itemName,
					children: t("print-msg-loading-title")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: callModal_module_default.subItemName,
					children: t("wait")
				})]
			})]
		})
	});
};
//#endregion
export { CallModal as t };
