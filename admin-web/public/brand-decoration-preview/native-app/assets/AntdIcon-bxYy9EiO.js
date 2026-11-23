import { d as __toESM, i as require_react } from "./toast-C8a1ReSo.js";
import { l as _extends, u as init_extends } from "./es-CFYDnMm2.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { S as init_typeof, b as init_defineProperty, i as init_slicedToArray, n as init_objectWithoutProperties, r as _slicedToArray, t as _objectWithoutProperties, x as _typeof, y as _defineProperty } from "./objectWithoutProperties-DDcNLcsK.js";
import { $ as warningOnce, I as updateCSS, S as generate$1, X as _objectSpread2, x as blue } from "./style-DWrLyeCr.js";
import { f as IconContext } from "./es-CH_mXwwY.js";
//#region node_modules/rc-util/es/Dom/shadow.js
var import_react = /* @__PURE__ */ __toESM(require_react());
init_extends();
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
init_typeof();
init_defineProperty();
init_slicedToArray();
init_objectWithoutProperties();
function getRoot(ele) {
	var _ele$getRootNode;
	return ele === null || ele === void 0 || (_ele$getRootNode = ele.getRootNode) === null || _ele$getRootNode === void 0 ? void 0 : _ele$getRootNode.call(ele);
}
/**
* Check if is in shadowRoot
*/
function inShadow(ele) {
	return getRoot(ele) instanceof ShadowRoot;
}
/**
* Return shadowRoot if possible
*/
function getShadowRoot(ele) {
	return inShadow(ele) ? getRoot(ele) : null;
}
//#endregion
//#region node_modules/@ant-design/icons/es/utils.js
function camelCase(input) {
	return input.replace(/-(.)/g, function(match, g) {
		return g.toUpperCase();
	});
}
function warning(valid, message) {
	warningOnce(valid, "[@ant-design/icons] ".concat(message));
}
function isIconDefinition(target) {
	return _typeof(target) === "object" && typeof target.name === "string" && typeof target.theme === "string" && (_typeof(target.icon) === "object" || typeof target.icon === "function");
}
function normalizeAttrs() {
	var attrs = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
	return Object.keys(attrs).reduce(function(acc, key) {
		var val = attrs[key];
		switch (key) {
			case "class":
				acc.className = val;
				delete acc.class;
				break;
			default:
				delete acc[key];
				acc[camelCase(key)] = val;
		}
		return acc;
	}, {});
}
function generate(node, key, rootProps) {
	if (!rootProps) return /*#__PURE__*/ import_react.createElement(node.tag, _objectSpread2({ key }, normalizeAttrs(node.attrs)), (node.children || []).map(function(child, index) {
		return generate(child, "".concat(key, "-").concat(node.tag, "-").concat(index));
	}));
	return /*#__PURE__*/ import_react.createElement(node.tag, _objectSpread2(_objectSpread2({ key }, normalizeAttrs(node.attrs)), rootProps), (node.children || []).map(function(child, index) {
		return generate(child, "".concat(key, "-").concat(node.tag, "-").concat(index));
	}));
}
function getSecondaryColor(primaryColor) {
	return generate$1(primaryColor)[0];
}
function normalizeTwoToneColors(twoToneColor) {
	if (!twoToneColor) return [];
	return Array.isArray(twoToneColor) ? twoToneColor : [twoToneColor];
}
var iconStyles = "\n.anticon {\n  display: inline-flex;\n  align-items: center;\n  color: inherit;\n  font-style: normal;\n  line-height: 0;\n  text-align: center;\n  text-transform: none;\n  vertical-align: -0.125em;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.anticon > * {\n  line-height: 1;\n}\n\n.anticon svg {\n  display: inline-block;\n}\n\n.anticon::before {\n  display: none;\n}\n\n.anticon .anticon-icon {\n  display: block;\n}\n\n.anticon[tabindex] {\n  cursor: pointer;\n}\n\n.anticon-spin::before,\n.anticon-spin {\n  display: inline-block;\n  -webkit-animation: loadingCircle 1s infinite linear;\n  animation: loadingCircle 1s infinite linear;\n}\n\n@-webkit-keyframes loadingCircle {\n  100% {\n    -webkit-transform: rotate(360deg);\n    transform: rotate(360deg);\n  }\n}\n\n@keyframes loadingCircle {\n  100% {\n    -webkit-transform: rotate(360deg);\n    transform: rotate(360deg);\n  }\n}\n";
var useInsertStyles = function useInsertStyles(eleRef) {
	var _useContext = (0, import_react.useContext)(IconContext), csp = _useContext.csp, prefixCls = _useContext.prefixCls, layer = _useContext.layer;
	var mergedStyleStr = iconStyles;
	if (prefixCls) mergedStyleStr = mergedStyleStr.replace(/anticon/g, prefixCls);
	if (layer) mergedStyleStr = "@layer ".concat(layer, " {\n").concat(mergedStyleStr, "\n}");
	(0, import_react.useEffect)(function() {
		var ele = eleRef.current;
		var shadowRoot = getShadowRoot(ele);
		updateCSS(mergedStyleStr, "@ant-design-icons", {
			prepend: !layer,
			csp,
			attachTo: shadowRoot
		});
	}, []);
};
//#endregion
//#region node_modules/@ant-design/icons/es/components/IconBase.js
var _excluded$1 = [
	"icon",
	"className",
	"onClick",
	"style",
	"primaryColor",
	"secondaryColor"
];
var twoToneColorPalette = {
	primaryColor: "#333",
	secondaryColor: "#E6E6E6",
	calculated: false
};
function setTwoToneColors(_ref) {
	var primaryColor = _ref.primaryColor, secondaryColor = _ref.secondaryColor;
	twoToneColorPalette.primaryColor = primaryColor;
	twoToneColorPalette.secondaryColor = secondaryColor || getSecondaryColor(primaryColor);
	twoToneColorPalette.calculated = !!secondaryColor;
}
function getTwoToneColors() {
	return _objectSpread2({}, twoToneColorPalette);
}
var IconBase = function IconBase(props) {
	var icon = props.icon, className = props.className, onClick = props.onClick, style = props.style, primaryColor = props.primaryColor, secondaryColor = props.secondaryColor, restProps = _objectWithoutProperties(props, _excluded$1);
	var svgRef = import_react.useRef();
	var colors = twoToneColorPalette;
	if (primaryColor) colors = {
		primaryColor,
		secondaryColor: secondaryColor || getSecondaryColor(primaryColor)
	};
	useInsertStyles(svgRef);
	warning(isIconDefinition(icon), "icon should be icon definiton, but got ".concat(icon));
	if (!isIconDefinition(icon)) return null;
	var target = icon;
	if (target && typeof target.icon === "function") target = _objectSpread2(_objectSpread2({}, target), {}, { icon: target.icon(colors.primaryColor, colors.secondaryColor) });
	return generate(target.icon, "svg-".concat(target.name), _objectSpread2(_objectSpread2({
		className,
		onClick,
		style,
		"data-icon": target.name,
		width: "1em",
		height: "1em",
		fill: "currentColor",
		"aria-hidden": "true"
	}, restProps), {}, { ref: svgRef }));
};
IconBase.displayName = "IconReact";
IconBase.getTwoToneColors = getTwoToneColors;
IconBase.setTwoToneColors = setTwoToneColors;
//#endregion
//#region node_modules/@ant-design/icons/es/components/twoTonePrimaryColor.js
function setTwoToneColor(twoToneColor) {
	var _normalizeTwoToneColo2 = _slicedToArray(normalizeTwoToneColors(twoToneColor), 2), primaryColor = _normalizeTwoToneColo2[0], secondaryColor = _normalizeTwoToneColo2[1];
	return IconBase.setTwoToneColors({
		primaryColor,
		secondaryColor
	});
}
function getTwoToneColor() {
	var colors = IconBase.getTwoToneColors();
	if (!colors.calculated) return colors.primaryColor;
	return [colors.primaryColor, colors.secondaryColor];
}
//#endregion
//#region node_modules/@ant-design/icons/es/components/AntdIcon.js
init_slicedToArray();
init_objectWithoutProperties();
var _excluded = [
	"className",
	"icon",
	"spin",
	"rotate",
	"tabIndex",
	"onClick",
	"twoToneColor"
];
setTwoToneColor(blue.primary);
var Icon = /*#__PURE__*/ import_react.forwardRef(function(props, ref) {
	var className = props.className, icon = props.icon, spin = props.spin, rotate = props.rotate, tabIndex = props.tabIndex, onClick = props.onClick, twoToneColor = props.twoToneColor, restProps = _objectWithoutProperties(props, _excluded);
	var _React$useContext = import_react.useContext(IconContext), _React$useContext$pre = _React$useContext.prefixCls, prefixCls = _React$useContext$pre === void 0 ? "anticon" : _React$useContext$pre, rootClassName = _React$useContext.rootClassName;
	var classString = (0, import_classnames.default)(rootClassName, prefixCls, _defineProperty(_defineProperty({}, "".concat(prefixCls, "-").concat(icon.name), !!icon.name), "".concat(prefixCls, "-spin"), !!spin || icon.name === "loading"), className);
	var iconTabIndex = tabIndex;
	if (iconTabIndex === void 0 && onClick) iconTabIndex = -1;
	var svgStyle = rotate ? {
		msTransform: "rotate(".concat(rotate, "deg)"),
		transform: "rotate(".concat(rotate, "deg)")
	} : void 0;
	var _normalizeTwoToneColo2 = _slicedToArray(normalizeTwoToneColors(twoToneColor), 2), primaryColor = _normalizeTwoToneColo2[0], secondaryColor = _normalizeTwoToneColo2[1];
	return /*#__PURE__*/ import_react.createElement("span", _extends({
		role: "img",
		"aria-label": icon.name
	}, restProps, {
		ref,
		tabIndex: iconTabIndex,
		onClick,
		className: classString
	}), /*#__PURE__*/ import_react.createElement(IconBase, {
		icon,
		primaryColor,
		secondaryColor,
		style: svgStyle
	}));
});
Icon.displayName = "AntdIcon";
Icon.getTwoToneColor = getTwoToneColor;
Icon.setTwoToneColor = setTwoToneColor;
//#endregion
export { getShadowRoot as n, Icon as t };
