import { d as __toESM, i as require_react, n as require_jsx_runtime, r as require_react_dom } from "./toast-C8a1ReSo.js";
require_react();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var dialog_module_default = {
	dialogPanelOuter: "dialogPanelOuter___IhQE0",
	dialogPanelInner: "dialogPanelInner___m4piZ"
};
//#endregion
//#region source-snapshot/src/component/dialog/index.js
var import_jsx_runtime = require_jsx_runtime();
var Dialog = (props) => {
	const { outerStyle, visible, html, onClose = () => {}, isMountOnBody, closeOnBackdrop = true, stopPropagation = false } = props;
	if (!visible) return null;
	const content = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: dialog_module_default.dialogPanelOuter,
		style: outerStyle || {},
		onClick: (event) => {
			if (stopPropagation) event.stopPropagation();
			if (closeOnBackdrop) onClose(event);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: dialog_module_default.dialogPanelInner,
			children: html
		})
	});
	if (isMountOnBody) return import_react_dom.createPortal(content, document.body);
	return content;
};
//#endregion
export { Dialog as t };
