import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
//#region source-snapshot/src/component/bottomToast/bottomToast.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var bottomToast_module_default = { container: "container___URPpf" };
//#endregion
//#region source-snapshot/src/component/bottomToast/index.js
var import_jsx_runtime = require_jsx_runtime();
var BottomToast = (props) => {
	const { t } = useTranslation();
	const { onLoadingShow, onLoadingHide } = props;
	const bottomRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let intersectionObserver = null;
		if (bottomRef.current) {
			intersectionObserver = new IntersectionObserver(function(entries) {
				if (entries[0].intersectionRatio > 0) onLoadingShow?.();
				else onLoadingHide?.();
			});
			intersectionObserver.observe(bottomRef.current);
		}
		return () => {
			if (bottomRef.current) intersectionObserver.unobserve(bottomRef.current);
			intersectionObserver.disconnect();
			intersectionObserver = null;
		};
	}, [
		bottomRef.current,
		onLoadingShow,
		onLoadingHide
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: bottomRef,
		className: bottomToast_module_default.container,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: t("bottom") })
	});
};
//#endregion
export { BottomToast as t };
