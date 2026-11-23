import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as menusifuLoading } from "./menusifuLoading-BlNMP81R.js";
//#region source-snapshot/src/component/loadingText/loadingText.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var loadingText_module_default = {
	loadingBox: "loadingBox___fZocT",
	itemBox: "itemBox___HpL4u",
	itemName: "itemName___OoVY-",
	subItemName: "subItemName___Fd-ap"
};
//#endregion
//#region source-snapshot/src/component/loadingText/index.js
var import_jsx_runtime = require_jsx_runtime();
var loadTextObj = {
	1: "try-reconnect-network",
	2: "completing_order",
	3: "update-menu-load"
};
var DELAY = 600;
var LoadingText = (props) => {
	const { t } = useTranslation();
	const { visible, textKey } = props;
	const itemName = t(loadTextObj[textKey]);
	const [show, setShow] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let timer;
		if (visible) timer = setTimeout(() => {
			setShow(true);
		}, DELAY);
		else {
			clearTimeout(timer);
			setShow(false);
		}
		return () => clearTimeout(timer);
	}, [visible]);
	if (!show) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		visible: show,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: loadingText_module_default.loadingBox,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(menusifuLoading, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: loadingText_module_default.itemBox,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: loadingText_module_default.itemName,
					children: itemName
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: loadingText_module_default.subItemName,
					children: t("wait")
				})]
			})]
		})
	});
};
//#endregion
export { LoadingText as t };
