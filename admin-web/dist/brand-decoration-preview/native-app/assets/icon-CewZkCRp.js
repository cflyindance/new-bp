import { i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
require_react();
var icon_module_default = {
	iconfont: "iconfont___kCmdT",
	"icon-language": "icon-language___OC08B",
	"icon-a-ziyuan47": "icon-a-ziyuan47___579A8",
	"icon-fenxiang": "icon-fenxiang___VAmDH",
	"icon-more": "icon-more___BULDT",
	"icon-svg_warn": "icon-svg_warn___3pFka",
	"icon-check": "icon-check___XA4wa",
	"icon-refresh": "icon-refresh___LjNCN",
	"icon-round_close_light": "icon-round_close_light___JXQJr",
	"icon-close": "icon-close___UpxIN"
};
//#endregion
//#region source-snapshot/src/component/icon/index.js
var import_jsx_runtime = require_jsx_runtime();
var Icons = (props) => {
	const { type, size, color, style = {}, className, onClick } = props;
	let classname = "";
	if (Object.prototype.toString.call(className) === "[object Array]") classname = className.join(",");
	else classname = className;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
		style: {
			color: color ? color : "none",
			fontSize: size ? `${size}rem` : "inherit",
			...style
		},
		className: [
			icon_module_default.iconfont,
			icon_module_default[`icon-${type}`],
			classname
		].join(" "),
		onClick: onClick ? onClick : null
	});
};
//#endregion
export { Icons as t };
