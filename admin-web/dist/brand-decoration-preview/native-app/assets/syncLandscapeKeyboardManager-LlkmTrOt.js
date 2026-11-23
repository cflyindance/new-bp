import { i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { t as LandscapeKeyboardManager } from "./landscapeKeyboardManager-BXsgiuB_.js";
require_react();
var PhoneBlacklistDialog_module_default = { content: "content___sUK-Z" };
//#endregion
//#region source-snapshot/src/component/PhoneBlacklistDialog/index.js
var import_jsx_runtime = require_jsx_runtime();
var PhoneBlacklistDialog = ({ visible, onConfirm, t }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
	visible,
	closeOnBackdrop: false,
	isMountOnBody: true,
	html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: PhoneBlacklistDialog_module_default.content,
		role: "alertdialog",
		"aria-modal": "true",
		"aria-label": t("phone-blacklist-blocked"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("phone-blacklist-blocked") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onConfirm,
			children: t("confirm")
		})]
	})
});
//#endregion
//#region source-snapshot/src/utils/syncLandscapeKeyboardManager.js
var syncLandscapeKeyboardManager = (component, getInputRef) => {
	if (component.state.deviceOrientation === "vertical") {
		if (component.keyboardManager) {
			component.keyboardManager.cleanup();
			component.keyboardManager = null;
		}
		return;
	}
	if (!component.keyboardManager) {
		component.keyboardManager = new LandscapeKeyboardManager(getInputRef);
		component.keyboardManager.setup();
	}
};
//#endregion
export { PhoneBlacklistDialog as n, syncLandscapeKeyboardManager as t };
