import { i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as RotateLoading } from "./rotateLoading-ByQXAFnC.js";
require_react();
var loading_module_default = {
	loadingBox: "loadingBox___eyE9-",
	itemBox: "itemBox___u7r03",
	itemName: "itemName___rc1In"
};
//#endregion
//#region source-snapshot/src/component/loading/index.js
var import_jsx_runtime = require_jsx_runtime();
var Loading = (props) => {
	const { t } = useTranslation();
	const { visible, tipsText } = props;
	if (!visible) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: loading_module_default.loadingBox,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateLoading, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: loading_module_default.itemBox,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: loading_module_default.itemName,
				children: tipsText || t("loading")
			})
		})]
	});
};
//#endregion
export { Loading as t };
