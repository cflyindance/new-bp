import { i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { na as getLayoutScale } from "./actions-BwRPwnFF.js";
import { N as StyleProvider, T as transform } from "./style-DWrLyeCr.js";
import { t as ConfigProvider } from "./config-provider-20CUitiF.js";
require_react();
var import_jsx_runtime = require_jsx_runtime();
var AntdWrapper = (props) => {
	const { children } = props;
	const countGrid = () => {
		const scale = getLayoutScale();
		return {
			screenXSMin: 480 / scale,
			screenXS: 480 / scale,
			screenXSMax: 575 / scale,
			screenSMMin: 576 / scale,
			screenSM: 576 / scale,
			screenSMMax: 767 / scale,
			screenMDMin: 768 / scale,
			screenMD: 768 / scale,
			screenMDMax: 991 / scale,
			screenLGMin: 992 / scale,
			screenLG: 992 / scale,
			screenLGMax: 1199 / scale,
			screenXLMin: 1200 / scale,
			screenXL: 1200 / scale,
			screenXLMax: 1599 / scale,
			screenXXLMin: 1600 / scale,
			screenXXL: 1600 / scale
		};
	};
	const getPrimaryColor = () => {
		if (typeof window !== "undefined") return getComputedStyle(document.documentElement).getPropertyValue("--primary-selected-color").trim();
		return "#FFB600";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfigProvider, {
		theme: { token: {
			colorPrimary: getPrimaryColor(),
			...countGrid()
		} },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StyleProvider, {
			transformers: [transform],
			hashPriority: "high",
			children
		})
	});
};
//#endregion
export { AntdWrapper as t };
