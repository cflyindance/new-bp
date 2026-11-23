import { c as __exportAll, d as __toESM, i as require_react, r as require_react_dom, s as __esmMin } from "./toast-C8a1ReSo.js";
import { a as require_hoist_non_react_statics_cjs, c as init_objectWithoutPropertiesLoose, l as _extends, o as require_react_is, s as _objectWithoutPropertiesLoose, u as init_extends } from "./es-CFYDnMm2.js";
import { a as init_inheritsLoose, i as _inheritsLoose, n as warning, r as require_prop_types, t as init_tiny_warning_esm } from "./tiny-warning.esm-Cf7nlwXj.js";
import { S as init_typeof, _ as _createClass, b as init_defineProperty, g as init_assertThisInitialized, h as _assertThisInitialized, i as init_slicedToArray, l as _toConsumableArray, n as init_objectWithoutProperties, r as _slicedToArray, t as _objectWithoutProperties, u as init_toConsumableArray, v as init_createClass, x as _typeof$1, y as _defineProperty } from "./objectWithoutProperties-DDcNLcsK.js";
//#region node_modules/clsx/dist/clsx.m.js
function r(e) {
	var t, f, n = "";
	if ("string" == typeof e || "number" == typeof e) n += e;
	else if ("object" == typeof e) if (Array.isArray(e)) for (t = 0; t < e.length; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
	else for (t in e) e[t] && (n && (n += " "), n += t);
	return n;
}
function clsx() {
	for (var e, t, f = 0, n = ""; f < arguments.length;) (e = arguments[f++]) && (t = r(e)) && (n && (n += " "), n += t);
	return n;
}
var init_clsx_m = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/utils/esm/chainPropTypes.js
function chainPropTypes(propType1, propType2) {
	return function validate() {
		return propType1.apply(void 0, arguments) || propType2.apply(void 0, arguments);
	};
}
var init_chainPropTypes = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/utils/esm/deepmerge.js
function isPlainObject(item) {
	return item && _typeof$1(item) === "object" && item.constructor === Object;
}
function deepmerge(target, source) {
	var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : { clone: true };
	var output = options.clone ? _extends({}, target) : target;
	if (isPlainObject(target) && isPlainObject(source)) Object.keys(source).forEach(function(key) {
		if (key === "__proto__") return;
		if (isPlainObject(source[key]) && key in target) output[key] = deepmerge(target[key], source[key], options);
		else output[key] = source[key];
	});
	return output;
}
var init_deepmerge = __esmMin((() => {
	init_extends();
	init_typeof();
}));
//#endregion
//#region node_modules/@material-ui/utils/esm/elementTypeAcceptingRef.js
function isClassComponent(elementType) {
	var _elementType$prototyp = elementType.prototype;
	return Boolean((_elementType$prototyp === void 0 ? {} : _elementType$prototyp).isReactComponent);
}
function elementTypeAcceptingRef(props, propName, componentName, location, propFullName) {
	var propValue = props[propName];
	var safePropName = propFullName || propName;
	if (propValue == null) return null;
	var warningHint;
	/**
	* Blacklisting instead of whitelisting
	*
	* Blacklisting will miss some components, such as React.Fragment. Those will at least
	* trigger a warning in React.
	* We can't whitelist because there is no safe way to detect React.forwardRef
	* or class components. "Safe" means there's no public API.
	*
	*/
	if (typeof propValue === "function" && !isClassComponent(propValue)) warningHint = "Did you accidentally provide a plain function component instead?";
	if (warningHint !== void 0) return /* @__PURE__ */ new Error("Invalid ".concat(location, " `").concat(safePropName, "` supplied to `").concat(componentName, "`. ") + "Expected an element type that can hold a ref. ".concat(warningHint, " ") + "For more information see https://mui.com/r/caveat-with-refs-guide");
	return null;
}
var import_prop_types$6, elementTypeAcceptingRef_default;
var init_elementTypeAcceptingRef = __esmMin((() => {
	import_prop_types$6 = /* @__PURE__ */ __toESM(require_prop_types());
	init_chainPropTypes();
	elementTypeAcceptingRef_default = chainPropTypes(import_prop_types$6.elementType, elementTypeAcceptingRef);
}));
//#endregion
//#region node_modules/@material-ui/utils/esm/exactProp.js
function exactProp(propTypes) {
	return _extends({}, propTypes, _defineProperty({}, specialProperty, function(props) {
		var unsupportedProps = Object.keys(props).filter(function(prop) {
			return !propTypes.hasOwnProperty(prop);
		});
		if (unsupportedProps.length > 0) return new Error("The following props are not supported: ".concat(unsupportedProps.map(function(prop) {
			return "`".concat(prop, "`");
		}).join(", "), ". Please remove them."));
		return null;
	}));
}
var specialProperty;
var init_exactProp = __esmMin((() => {
	init_defineProperty();
	init_extends();
	specialProperty = "exact-prop: ​";
}));
//#endregion
//#region node_modules/@material-ui/utils/esm/getDisplayName.js
function getFunctionName(fn) {
	var match = "".concat(fn).match(fnNameMatchRegex);
	return match && match[1] || "";
}
/**
* @param {function} Component
* @param {string} fallback
* @returns {string | undefined}
*/
function getFunctionComponentName(Component) {
	var fallback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
	return Component.displayName || Component.name || getFunctionName(Component) || fallback;
}
function getWrappedName(outerType, innerType, wrapperName) {
	var functionName = getFunctionComponentName(innerType);
	return outerType.displayName || (functionName !== "" ? "".concat(wrapperName, "(").concat(functionName, ")") : wrapperName);
}
/**
* cherry-pick from
* https://github.com/facebook/react/blob/769b1f270e1251d9dbdce0fcbd9e92e502d059b8/packages/shared/getComponentName.js
* originally forked from recompose/getDisplayName with added IE 11 support
*
* @param {React.ReactType} Component
* @returns {string | undefined}
*/
function getDisplayName(Component) {
	if (Component == null) return;
	if (typeof Component === "string") return Component;
	if (typeof Component === "function") return getFunctionComponentName(Component, "Component");
	if (_typeof$1(Component) === "object") switch (Component.$$typeof) {
		case import_react_is.ForwardRef: return getWrappedName(Component, Component.render, "ForwardRef");
		case import_react_is.Memo: return getWrappedName(Component, Component.type, "memo");
		default: return;
	}
}
var import_react_is, fnNameMatchRegex;
var init_getDisplayName = __esmMin((() => {
	init_typeof();
	import_react_is = require_react_is();
	fnNameMatchRegex = /^\s*function(?:\s|\s*\/\*.*\*\/\s*)+([^(\s/]*)\s*/;
}));
//#endregion
//#region node_modules/@material-ui/utils/esm/refType.js
var import_prop_types$5, refType;
var init_refType = __esmMin((() => {
	import_prop_types$5 = /* @__PURE__ */ __toESM(require_prop_types());
	refType = import_prop_types$5.default.oneOfType([import_prop_types$5.default.func, import_prop_types$5.default.object]);
}));
//#endregion
//#region node_modules/@material-ui/utils/esm/index.js
var init_esm$2 = __esmMin((() => {
	init_chainPropTypes();
	init_deepmerge();
	init_elementTypeAcceptingRef();
	init_exactProp();
	init_getDisplayName();
	init_refType();
}));
/** @license Material-UI v4.11.3
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
//#endregion
//#region node_modules/@material-ui/core/esm/styles/colorManipulator.js
/**
* Returns a number whose value is limited to the given range.
*
* @param {number} value The value to be clamped
* @param {number} min The lower boundary of the output range
* @param {number} max The upper boundary of the output range
* @returns {number} A number in the range [min, max]
*/
function clamp(value) {
	var min = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
	var max = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
	if (value < min || value > max) console.error("Material-UI: The value provided ".concat(value, " is out of range [").concat(min, ", ").concat(max, "]."));
	return Math.min(Math.max(min, value), max);
}
/**
* Converts a color from CSS hex format to CSS rgb format.
*
* @param {string} color - Hex color, i.e. #nnn or #nnnnnn
* @returns {string} A CSS rgb color string
*/
function hexToRgb(color) {
	color = color.substr(1);
	var re = new RegExp(".{1,".concat(color.length >= 6 ? 2 : 1, "}"), "g");
	var colors = color.match(re);
	if (colors && colors[0].length === 1) colors = colors.map(function(n) {
		return n + n;
	});
	return colors ? "rgb".concat(colors.length === 4 ? "a" : "", "(").concat(colors.map(function(n, index) {
		return index < 3 ? parseInt(n, 16) : Math.round(parseInt(n, 16) / 255 * 1e3) / 1e3;
	}).join(", "), ")") : "";
}
/**
* Converts a color from hsl format to rgb format.
*
* @param {string} color - HSL color values
* @returns {string} rgb color values
*/
function hslToRgb(color) {
	color = decomposeColor(color);
	var values = color.values;
	var h = values[0];
	var s = values[1] / 100;
	var l = values[2] / 100;
	var a = s * Math.min(l, 1 - l);
	var f = function f(n) {
		var k = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : (n + h / 30) % 12;
		return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	};
	var type = "rgb";
	var rgb = [
		Math.round(f(0) * 255),
		Math.round(f(8) * 255),
		Math.round(f(4) * 255)
	];
	if (color.type === "hsla") {
		type += "a";
		rgb.push(values[3]);
	}
	return recomposeColor({
		type,
		values: rgb
	});
}
/**
* Returns an object with the type and values of a color.
*
* Note: Does not support rgb % values.
*
* @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
* @returns {object} - A MUI color object: {type: string, values: number[]}
*/
function decomposeColor(color) {
	if (color.type) return color;
	if (color.charAt(0) === "#") return decomposeColor(hexToRgb(color));
	var marker = color.indexOf("(");
	var type = color.substring(0, marker);
	if ([
		"rgb",
		"rgba",
		"hsl",
		"hsla"
	].indexOf(type) === -1) throw new Error("Material-UI: Unsupported `".concat(color, "` color.\nWe support the following formats: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()."));
	var values = color.substring(marker + 1, color.length - 1).split(",");
	values = values.map(function(value) {
		return parseFloat(value);
	});
	return {
		type,
		values
	};
}
/**
* Converts a color object with type and values to a string.
*
* @param {object} color - Decomposed color
* @param {string} color.type - One of: 'rgb', 'rgba', 'hsl', 'hsla'
* @param {array} color.values - [n,n,n] or [n,n,n,n]
* @returns {string} A CSS color string
*/
function recomposeColor(color) {
	var type = color.type;
	var values = color.values;
	if (type.indexOf("rgb") !== -1) values = values.map(function(n, i) {
		return i < 3 ? parseInt(n, 10) : n;
	});
	else if (type.indexOf("hsl") !== -1) {
		values[1] = "".concat(values[1], "%");
		values[2] = "".concat(values[2], "%");
	}
	return "".concat(type, "(").concat(values.join(", "), ")");
}
/**
* Calculates the contrast ratio between two colors.
*
* Formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
*
* @param {string} foreground - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
* @param {string} background - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
* @returns {number} A contrast ratio value in the range 0 - 21.
*/
function getContrastRatio(foreground, background) {
	var lumA = getLuminance(foreground);
	var lumB = getLuminance(background);
	return (Math.max(lumA, lumB) + .05) / (Math.min(lumA, lumB) + .05);
}
/**
* The relative brightness of any point in a color space,
* normalized to 0 for darkest black and 1 for lightest white.
*
* Formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
*
* @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
* @returns {number} The relative brightness of the color in the range 0 - 1
*/
function getLuminance(color) {
	color = decomposeColor(color);
	var rgb = color.type === "hsl" ? decomposeColor(hslToRgb(color)).values : color.values;
	rgb = rgb.map(function(val) {
		val /= 255;
		return val <= .03928 ? val / 12.92 : Math.pow((val + .055) / 1.055, 2.4);
	});
	return Number((.2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]).toFixed(3));
}
/**
* Set the absolute transparency of a color.
* Any existing alpha value is overwritten.
*
* @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
* @param {number} value - value to set the alpha channel to in the range 0-1
* @returns {string} A CSS color string. Hex input values are returned as rgb
*/
function alpha(color, value) {
	color = decomposeColor(color);
	value = clamp(value);
	if (color.type === "rgb" || color.type === "hsl") color.type += "a";
	color.values[3] = value;
	return recomposeColor(color);
}
/**
* Darkens a color.
*
* @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
* @param {number} coefficient - multiplier in the range 0 - 1
* @returns {string} A CSS color string. Hex input values are returned as rgb
*/
function darken(color, coefficient) {
	color = decomposeColor(color);
	coefficient = clamp(coefficient);
	if (color.type.indexOf("hsl") !== -1) color.values[2] *= 1 - coefficient;
	else if (color.type.indexOf("rgb") !== -1) for (var i = 0; i < 3; i += 1) color.values[i] *= 1 - coefficient;
	return recomposeColor(color);
}
/**
* Lightens a color.
*
* @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
* @param {number} coefficient - multiplier in the range 0 - 1
* @returns {string} A CSS color string. Hex input values are returned as rgb
*/
function lighten(color, coefficient) {
	color = decomposeColor(color);
	coefficient = clamp(coefficient);
	if (color.type.indexOf("hsl") !== -1) color.values[2] += (100 - color.values[2]) * coefficient;
	else if (color.type.indexOf("rgb") !== -1) for (var i = 0; i < 3; i += 1) color.values[i] += (255 - color.values[i]) * coefficient;
	return recomposeColor(color);
}
var init_colorManipulator = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/core/esm/styles/createBreakpoints.js
function createBreakpoints(breakpoints) {
	var _breakpoints$values = breakpoints.values, values = _breakpoints$values === void 0 ? {
		xs: 0,
		sm: 600,
		md: 960,
		lg: 1280,
		xl: 1920
	} : _breakpoints$values, _breakpoints$unit = breakpoints.unit, unit = _breakpoints$unit === void 0 ? "px" : _breakpoints$unit, _breakpoints$step = breakpoints.step, step = _breakpoints$step === void 0 ? 5 : _breakpoints$step, other = _objectWithoutProperties(breakpoints, [
		"values",
		"unit",
		"step"
	]);
	function up(key) {
		var value = typeof values[key] === "number" ? values[key] : key;
		return "@media (min-width:".concat(value).concat(unit, ")");
	}
	function down(key) {
		var endIndex = keys.indexOf(key) + 1;
		var upperbound = values[keys[endIndex]];
		if (endIndex === keys.length) return up("xs");
		var value = typeof upperbound === "number" && endIndex > 0 ? upperbound : key;
		return "@media (max-width:".concat(value - step / 100).concat(unit, ")");
	}
	function between(start, end) {
		var endIndex = keys.indexOf(end);
		if (endIndex === keys.length - 1) return up(start);
		return "@media (min-width:".concat(typeof values[start] === "number" ? values[start] : start).concat(unit, ") and ") + "(max-width:".concat((endIndex !== -1 && typeof values[keys[endIndex + 1]] === "number" ? values[keys[endIndex + 1]] : end) - step / 100).concat(unit, ")");
	}
	function only(key) {
		return between(key, key);
	}
	var warnedOnce = false;
	function width(key) {
		if (!warnedOnce) {
			warnedOnce = true;
			console.warn(["Material-UI: The `theme.breakpoints.width` utility is deprecated because it's redundant.", "Use the `theme.breakpoints.values` instead."].join("\n"));
		}
		return values[key];
	}
	return _extends({
		keys,
		values,
		up,
		down,
		between,
		only,
		width
	}, other);
}
var keys;
var init_createBreakpoints = __esmMin((() => {
	init_extends();
	init_objectWithoutProperties();
	keys = [
		"xs",
		"sm",
		"md",
		"lg",
		"xl"
	];
}));
//#endregion
//#region node_modules/@material-ui/core/esm/styles/createMixins.js
function createMixins(breakpoints, spacing, mixins) {
	var _toolbar;
	return _extends({
		gutters: function gutters() {
			var styles = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
			console.warn([
				"Material-UI: theme.mixins.gutters() is deprecated.",
				"You can use the source of the mixin directly:",
				"\n      paddingLeft: theme.spacing(2),\n      paddingRight: theme.spacing(2),\n      [theme.breakpoints.up('sm')]: {\n        paddingLeft: theme.spacing(3),\n        paddingRight: theme.spacing(3),\n      },\n      "
			].join("\n"));
			return _extends({
				paddingLeft: spacing(2),
				paddingRight: spacing(2)
			}, styles, _defineProperty({}, breakpoints.up("sm"), _extends({
				paddingLeft: spacing(3),
				paddingRight: spacing(3)
			}, styles[breakpoints.up("sm")])));
		},
		toolbar: (_toolbar = { minHeight: 56 }, _defineProperty(_toolbar, "".concat(breakpoints.up("xs"), " and (orientation: landscape)"), { minHeight: 48 }), _defineProperty(_toolbar, breakpoints.up("sm"), { minHeight: 64 }), _toolbar)
	}, mixins);
}
var init_createMixins = __esmMin((() => {
	init_defineProperty();
	init_extends();
}));
//#endregion
//#region node_modules/@material-ui/core/esm/colors/common.js
var common;
var init_common = __esmMin((() => {
	common = {
		black: "#000",
		white: "#fff"
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/colors/grey.js
var grey;
var init_grey = __esmMin((() => {
	grey = {
		50: "#fafafa",
		100: "#f5f5f5",
		200: "#eeeeee",
		300: "#e0e0e0",
		400: "#bdbdbd",
		500: "#9e9e9e",
		600: "#757575",
		700: "#616161",
		800: "#424242",
		900: "#212121",
		A100: "#d5d5d5",
		A200: "#aaaaaa",
		A400: "#303030",
		A700: "#616161"
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/colors/indigo.js
var indigo;
var init_indigo = __esmMin((() => {
	indigo = {
		50: "#e8eaf6",
		100: "#c5cae9",
		200: "#9fa8da",
		300: "#7986cb",
		400: "#5c6bc0",
		500: "#3f51b5",
		600: "#3949ab",
		700: "#303f9f",
		800: "#283593",
		900: "#1a237e",
		A100: "#8c9eff",
		A200: "#536dfe",
		A400: "#3d5afe",
		A700: "#304ffe"
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/colors/pink.js
var pink;
var init_pink = __esmMin((() => {
	pink = {
		50: "#fce4ec",
		100: "#f8bbd0",
		200: "#f48fb1",
		300: "#f06292",
		400: "#ec407a",
		500: "#e91e63",
		600: "#d81b60",
		700: "#c2185b",
		800: "#ad1457",
		900: "#880e4f",
		A100: "#ff80ab",
		A200: "#ff4081",
		A400: "#f50057",
		A700: "#c51162"
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/colors/red.js
var red;
var init_red = __esmMin((() => {
	red = {
		50: "#ffebee",
		100: "#ffcdd2",
		200: "#ef9a9a",
		300: "#e57373",
		400: "#ef5350",
		500: "#f44336",
		600: "#e53935",
		700: "#d32f2f",
		800: "#c62828",
		900: "#b71c1c",
		A100: "#ff8a80",
		A200: "#ff5252",
		A400: "#ff1744",
		A700: "#d50000"
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/colors/orange.js
var orange;
var init_orange = __esmMin((() => {
	orange = {
		50: "#fff3e0",
		100: "#ffe0b2",
		200: "#ffcc80",
		300: "#ffb74d",
		400: "#ffa726",
		500: "#ff9800",
		600: "#fb8c00",
		700: "#f57c00",
		800: "#ef6c00",
		900: "#e65100",
		A100: "#ffd180",
		A200: "#ffab40",
		A400: "#ff9100",
		A700: "#ff6d00"
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/colors/blue.js
var blue;
var init_blue = __esmMin((() => {
	blue = {
		50: "#e3f2fd",
		100: "#bbdefb",
		200: "#90caf9",
		300: "#64b5f6",
		400: "#42a5f5",
		500: "#2196f3",
		600: "#1e88e5",
		700: "#1976d2",
		800: "#1565c0",
		900: "#0d47a1",
		A100: "#82b1ff",
		A200: "#448aff",
		A400: "#2979ff",
		A700: "#2962ff"
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/colors/green.js
var green;
var init_green = __esmMin((() => {
	green = {
		50: "#e8f5e9",
		100: "#c8e6c9",
		200: "#a5d6a7",
		300: "#81c784",
		400: "#66bb6a",
		500: "#4caf50",
		600: "#43a047",
		700: "#388e3c",
		800: "#2e7d32",
		900: "#1b5e20",
		A100: "#b9f6ca",
		A200: "#69f0ae",
		A400: "#00e676",
		A700: "#00c853"
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/styles/createPalette.js
function addLightOrDark(intent, direction, shade, tonalOffset) {
	var tonalOffsetLight = tonalOffset.light || tonalOffset;
	var tonalOffsetDark = tonalOffset.dark || tonalOffset * 1.5;
	if (!intent[direction]) {
		if (intent.hasOwnProperty(shade)) intent[direction] = intent[shade];
		else if (direction === "light") intent.light = lighten(intent.main, tonalOffsetLight);
		else if (direction === "dark") intent.dark = darken(intent.main, tonalOffsetDark);
	}
}
function createPalette(palette) {
	var _palette$primary = palette.primary, primary = _palette$primary === void 0 ? {
		light: indigo[300],
		main: indigo[500],
		dark: indigo[700]
	} : _palette$primary, _palette$secondary = palette.secondary, secondary = _palette$secondary === void 0 ? {
		light: pink.A200,
		main: pink.A400,
		dark: pink.A700
	} : _palette$secondary, _palette$error = palette.error, error = _palette$error === void 0 ? {
		light: red[300],
		main: red[500],
		dark: red[700]
	} : _palette$error, _palette$warning = palette.warning, warning = _palette$warning === void 0 ? {
		light: orange[300],
		main: orange[500],
		dark: orange[700]
	} : _palette$warning, _palette$info = palette.info, info = _palette$info === void 0 ? {
		light: blue[300],
		main: blue[500],
		dark: blue[700]
	} : _palette$info, _palette$success = palette.success, success = _palette$success === void 0 ? {
		light: green[300],
		main: green[500],
		dark: green[700]
	} : _palette$success, _palette$type = palette.type, type = _palette$type === void 0 ? "light" : _palette$type, _palette$contrastThre = palette.contrastThreshold, contrastThreshold = _palette$contrastThre === void 0 ? 3 : _palette$contrastThre, _palette$tonalOffset = palette.tonalOffset, tonalOffset = _palette$tonalOffset === void 0 ? .2 : _palette$tonalOffset, other = _objectWithoutProperties(palette, [
		"primary",
		"secondary",
		"error",
		"warning",
		"info",
		"success",
		"type",
		"contrastThreshold",
		"tonalOffset"
	]);
	function getContrastText(background) {
		var contrastText = getContrastRatio(background, dark.text.primary) >= contrastThreshold ? dark.text.primary : light.text.primary;
		var contrast = getContrastRatio(background, contrastText);
		if (contrast < 3) console.error([
			"Material-UI: The contrast ratio of ".concat(contrast, ":1 for ").concat(contrastText, " on ").concat(background),
			"falls below the WCAG recommended absolute minimum contrast ratio of 3:1.",
			"https://www.w3.org/TR/2008/REC-WCAG20-20081211/#visual-audio-contrast-contrast"
		].join("\n"));
		return contrastText;
	}
	var augmentColor = function augmentColor(color) {
		var mainShade = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 500;
		var lightShade = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 300;
		var darkShade = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 700;
		color = _extends({}, color);
		if (!color.main && color[mainShade]) color.main = color[mainShade];
		if (!color.main) throw new Error("Material-UI: The color provided to augmentColor(color) is invalid.\nThe color object needs to have a `main` property or a `".concat(mainShade, "` property."));
		if (typeof color.main !== "string") throw new Error("Material-UI: The color provided to augmentColor(color) is invalid.\n`color.main` should be a string, but `".concat(JSON.stringify(color.main), "` was provided instead.\n\nDid you intend to use one of the following approaches?\n\nimport {\xA0green } from \"@material-ui/core/colors\";\n\nconst theme1 = createTheme({ palette: {\n  primary: green,\n} });\n\nconst theme2 = createTheme({ palette: {\n  primary: { main: green[500] },\n} });"));
		addLightOrDark(color, "light", lightShade, tonalOffset);
		addLightOrDark(color, "dark", darkShade, tonalOffset);
		if (!color.contrastText) color.contrastText = getContrastText(color.main);
		return color;
	};
	var types = {
		dark,
		light
	};
	if (!types[type]) console.error("Material-UI: The palette type `".concat(type, "` is not supported."));
	return deepmerge(_extends({
		common,
		type,
		primary: augmentColor(primary),
		secondary: augmentColor(secondary, "A400", "A200", "A700"),
		error: augmentColor(error),
		warning: augmentColor(warning),
		info: augmentColor(info),
		success: augmentColor(success),
		grey,
		contrastThreshold,
		getContrastText,
		augmentColor,
		tonalOffset
	}, types[type]), other);
}
var light, dark;
var init_createPalette = __esmMin((() => {
	init_extends();
	init_objectWithoutProperties();
	init_esm$2();
	init_common();
	init_grey();
	init_indigo();
	init_pink();
	init_red();
	init_orange();
	init_blue();
	init_green();
	init_colorManipulator();
	light = {
		text: {
			primary: "rgba(0, 0, 0, 0.87)",
			secondary: "rgba(0, 0, 0, 0.54)",
			disabled: "rgba(0, 0, 0, 0.38)",
			hint: "rgba(0, 0, 0, 0.38)"
		},
		divider: "rgba(0, 0, 0, 0.12)",
		background: {
			paper: common.white,
			default: grey[50]
		},
		action: {
			active: "rgba(0, 0, 0, 0.54)",
			hover: "rgba(0, 0, 0, 0.04)",
			hoverOpacity: .04,
			selected: "rgba(0, 0, 0, 0.08)",
			selectedOpacity: .08,
			disabled: "rgba(0, 0, 0, 0.26)",
			disabledBackground: "rgba(0, 0, 0, 0.12)",
			disabledOpacity: .38,
			focus: "rgba(0, 0, 0, 0.12)",
			focusOpacity: .12,
			activatedOpacity: .12
		}
	};
	dark = {
		text: {
			primary: common.white,
			secondary: "rgba(255, 255, 255, 0.7)",
			disabled: "rgba(255, 255, 255, 0.5)",
			hint: "rgba(255, 255, 255, 0.5)",
			icon: "rgba(255, 255, 255, 0.5)"
		},
		divider: "rgba(255, 255, 255, 0.12)",
		background: {
			paper: grey[800],
			default: "#303030"
		},
		action: {
			active: common.white,
			hover: "rgba(255, 255, 255, 0.08)",
			hoverOpacity: .08,
			selected: "rgba(255, 255, 255, 0.16)",
			selectedOpacity: .16,
			disabled: "rgba(255, 255, 255, 0.3)",
			disabledBackground: "rgba(255, 255, 255, 0.12)",
			disabledOpacity: .38,
			focus: "rgba(255, 255, 255, 0.12)",
			focusOpacity: .12,
			activatedOpacity: .24
		}
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/styles/createTypography.js
function round(value) {
	return Math.round(value * 1e5) / 1e5;
}
function roundWithDeprecationWarning(value) {
	if (!warnedOnce) {
		console.warn(["Material-UI: The `theme.typography.round` helper is deprecated.", "Head to https://mui.com/r/migration-v4/#theme for a migration path."].join("\n"));
		warnedOnce = true;
	}
	return round(value);
}
/**
* @see @link{https://material.io/design/typography/the-type-system.html}
* @see @link{https://material.io/design/typography/understanding-typography.html}
*/
function createTypography(palette, typography) {
	var _ref = typeof typography === "function" ? typography(palette) : typography, _ref$fontFamily = _ref.fontFamily, fontFamily = _ref$fontFamily === void 0 ? defaultFontFamily : _ref$fontFamily, _ref$fontSize = _ref.fontSize, fontSize = _ref$fontSize === void 0 ? 14 : _ref$fontSize, _ref$fontWeightLight = _ref.fontWeightLight, fontWeightLight = _ref$fontWeightLight === void 0 ? 300 : _ref$fontWeightLight, _ref$fontWeightRegula = _ref.fontWeightRegular, fontWeightRegular = _ref$fontWeightRegula === void 0 ? 400 : _ref$fontWeightRegula, _ref$fontWeightMedium = _ref.fontWeightMedium, fontWeightMedium = _ref$fontWeightMedium === void 0 ? 500 : _ref$fontWeightMedium, _ref$fontWeightBold = _ref.fontWeightBold, fontWeightBold = _ref$fontWeightBold === void 0 ? 700 : _ref$fontWeightBold, _ref$htmlFontSize = _ref.htmlFontSize, htmlFontSize = _ref$htmlFontSize === void 0 ? 16 : _ref$htmlFontSize, allVariants = _ref.allVariants, pxToRem2 = _ref.pxToRem, other = _objectWithoutProperties(_ref, [
		"fontFamily",
		"fontSize",
		"fontWeightLight",
		"fontWeightRegular",
		"fontWeightMedium",
		"fontWeightBold",
		"htmlFontSize",
		"allVariants",
		"pxToRem"
	]);
	if (typeof fontSize !== "number") console.error("Material-UI: `fontSize` is required to be a number.");
	if (typeof htmlFontSize !== "number") console.error("Material-UI: `htmlFontSize` is required to be a number.");
	var coef = fontSize / 14;
	var pxToRem = pxToRem2 || function(size) {
		return "".concat(size / htmlFontSize * coef, "rem");
	};
	var buildVariant = function buildVariant(fontWeight, size, lineHeight, letterSpacing, casing) {
		return _extends({
			fontFamily,
			fontWeight,
			fontSize: pxToRem(size),
			lineHeight
		}, fontFamily === defaultFontFamily ? { letterSpacing: "".concat(round(letterSpacing / size), "em") } : {}, casing, allVariants);
	};
	var variants = {
		h1: buildVariant(fontWeightLight, 96, 1.167, -1.5),
		h2: buildVariant(fontWeightLight, 60, 1.2, -.5),
		h3: buildVariant(fontWeightRegular, 48, 1.167, 0),
		h4: buildVariant(fontWeightRegular, 34, 1.235, .25),
		h5: buildVariant(fontWeightRegular, 24, 1.334, 0),
		h6: buildVariant(fontWeightMedium, 20, 1.6, .15),
		subtitle1: buildVariant(fontWeightRegular, 16, 1.75, .15),
		subtitle2: buildVariant(fontWeightMedium, 14, 1.57, .1),
		body1: buildVariant(fontWeightRegular, 16, 1.5, .15),
		body2: buildVariant(fontWeightRegular, 14, 1.43, .15),
		button: buildVariant(fontWeightMedium, 14, 1.75, .4, caseAllCaps),
		caption: buildVariant(fontWeightRegular, 12, 1.66, .4),
		overline: buildVariant(fontWeightRegular, 12, 2.66, 1, caseAllCaps)
	};
	return deepmerge(_extends({
		htmlFontSize,
		pxToRem,
		round: roundWithDeprecationWarning,
		fontFamily,
		fontSize,
		fontWeightLight,
		fontWeightRegular,
		fontWeightMedium,
		fontWeightBold
	}, variants), other, { clone: false });
}
var warnedOnce, caseAllCaps, defaultFontFamily;
var init_createTypography = __esmMin((() => {
	init_extends();
	init_objectWithoutProperties();
	init_esm$2();
	warnedOnce = false;
	caseAllCaps = { textTransform: "uppercase" };
	defaultFontFamily = "\"Roboto\", \"Helvetica\", \"Arial\", sans-serif";
}));
//#endregion
//#region node_modules/@material-ui/core/esm/styles/shadows.js
function createShadow() {
	return [
		"".concat(arguments.length <= 0 ? void 0 : arguments[0], "px ").concat(arguments.length <= 1 ? void 0 : arguments[1], "px ").concat(arguments.length <= 2 ? void 0 : arguments[2], "px ").concat(arguments.length <= 3 ? void 0 : arguments[3], "px rgba(0,0,0,").concat(shadowKeyUmbraOpacity, ")"),
		"".concat(arguments.length <= 4 ? void 0 : arguments[4], "px ").concat(arguments.length <= 5 ? void 0 : arguments[5], "px ").concat(arguments.length <= 6 ? void 0 : arguments[6], "px ").concat(arguments.length <= 7 ? void 0 : arguments[7], "px rgba(0,0,0,").concat(shadowKeyPenumbraOpacity, ")"),
		"".concat(arguments.length <= 8 ? void 0 : arguments[8], "px ").concat(arguments.length <= 9 ? void 0 : arguments[9], "px ").concat(arguments.length <= 10 ? void 0 : arguments[10], "px ").concat(arguments.length <= 11 ? void 0 : arguments[11], "px rgba(0,0,0,").concat(shadowAmbientShadowOpacity, ")")
	].join(",");
}
var shadowKeyUmbraOpacity, shadowKeyPenumbraOpacity, shadowAmbientShadowOpacity, shadows;
var init_shadows = __esmMin((() => {
	shadowKeyUmbraOpacity = .2;
	shadowKeyPenumbraOpacity = .14;
	shadowAmbientShadowOpacity = .12;
	shadows = [
		"none",
		createShadow(0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0),
		createShadow(0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0),
		createShadow(0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0),
		createShadow(0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0),
		createShadow(0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0),
		createShadow(0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0),
		createShadow(0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1),
		createShadow(0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2),
		createShadow(0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2),
		createShadow(0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3),
		createShadow(0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3),
		createShadow(0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4),
		createShadow(0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4),
		createShadow(0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4),
		createShadow(0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5),
		createShadow(0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5),
		createShadow(0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5),
		createShadow(0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6),
		createShadow(0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6),
		createShadow(0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7),
		createShadow(0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7),
		createShadow(0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7),
		createShadow(0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8),
		createShadow(0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8)
	];
}));
//#endregion
//#region node_modules/@material-ui/core/esm/styles/shape.js
var shape;
var init_shape = __esmMin((() => {
	shape = { borderRadius: 4 };
}));
//#endregion
//#region node_modules/@material-ui/system/esm/responsivePropType.js
var import_prop_types$4, responsivePropType;
var init_responsivePropType = __esmMin((() => {
	import_prop_types$4 = /* @__PURE__ */ __toESM(require_prop_types());
	responsivePropType = import_prop_types$4.default.oneOfType([
		import_prop_types$4.default.number,
		import_prop_types$4.default.string,
		import_prop_types$4.default.object,
		import_prop_types$4.default.array
	]);
}));
//#endregion
//#region node_modules/@material-ui/system/esm/merge.js
function merge(acc, item) {
	if (!item) return acc;
	return deepmerge(acc, item, { clone: false });
}
var init_merge = __esmMin((() => {
	init_esm$2();
}));
//#endregion
//#region node_modules/@material-ui/system/esm/breakpoints.js
function handleBreakpoints(props, propValue, styleFromPropValue) {
	if (!props.theme) console.error("Material-UI: You are calling a style function without a theme value.");
	if (Array.isArray(propValue)) {
		var themeBreakpoints = props.theme.breakpoints || defaultBreakpoints;
		return propValue.reduce(function(acc, item, index) {
			acc[themeBreakpoints.up(themeBreakpoints.keys[index])] = styleFromPropValue(propValue[index]);
			return acc;
		}, {});
	}
	if (_typeof$1(propValue) === "object") {
		var _themeBreakpoints = props.theme.breakpoints || defaultBreakpoints;
		return Object.keys(propValue).reduce(function(acc, breakpoint) {
			acc[_themeBreakpoints.up(breakpoint)] = styleFromPropValue(propValue[breakpoint]);
			return acc;
		}, {});
	}
	return styleFromPropValue(propValue);
}
var values$1, defaultBreakpoints;
var init_breakpoints = __esmMin((() => {
	init_typeof();
	values$1 = {
		xs: 0,
		sm: 600,
		md: 960,
		lg: 1280,
		xl: 1920
	};
	defaultBreakpoints = {
		keys: [
			"xs",
			"sm",
			"md",
			"lg",
			"xl"
		],
		up: function up(key) {
			return "@media (min-width:".concat(values$1[key], "px)");
		}
	};
}));
//#endregion
//#region node_modules/@material-ui/system/esm/borders.js
var init_borders = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/system/esm/styleFunctionSx.js
var init_styleFunctionSx = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/system/esm/flexbox.js
var init_flexbox = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/system/esm/grid.js
var init_grid = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/system/esm/palette.js
var init_palette = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/system/esm/positions.js
var init_positions = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/system/esm/sizing.js
var init_sizing = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/system/esm/memoize.js
function memoize$1(fn) {
	var cache = {};
	return function(arg) {
		if (cache[arg] === void 0) cache[arg] = fn(arg);
		return cache[arg];
	};
}
var init_memoize = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/system/esm/spacing.js
function createUnarySpacing(theme) {
	var themeSpacing = theme.spacing || 8;
	if (typeof themeSpacing === "number") return function(abs) {
		if (typeof abs !== "number") console.error("Material-UI: Expected spacing argument to be a number, got ".concat(abs, "."));
		return themeSpacing * abs;
	};
	if (Array.isArray(themeSpacing)) return function(abs) {
		if (abs > themeSpacing.length - 1) console.error([
			"Material-UI: The value provided (".concat(abs, ") overflows."),
			"The supported values are: ".concat(JSON.stringify(themeSpacing), "."),
			"".concat(abs, " > ").concat(themeSpacing.length - 1, ", you need to add the missing values.")
		].join("\n"));
		return themeSpacing[abs];
	};
	if (typeof themeSpacing === "function") return themeSpacing;
	console.error(["Material-UI: The `theme.spacing` value (".concat(themeSpacing, ") is invalid."), "It should be a number, an array or a function."].join("\n"));
	return function() {};
}
function getValue(transformer, propValue) {
	if (typeof propValue === "string" || propValue == null) return propValue;
	var transformed = transformer(Math.abs(propValue));
	if (propValue >= 0) return transformed;
	if (typeof transformed === "number") return -transformed;
	return "-".concat(transformed);
}
function getStyleFromPropValue(cssProperties, transformer) {
	return function(propValue) {
		return cssProperties.reduce(function(acc, cssProperty) {
			acc[cssProperty] = getValue(transformer, propValue);
			return acc;
		}, {});
	};
}
function spacing(props) {
	var theme = props.theme;
	var transformer = createUnarySpacing(theme);
	return Object.keys(props).map(function(prop) {
		if (spacingKeys.indexOf(prop) === -1) return null;
		var styleFromPropValue = getStyleFromPropValue(getCssProperties(prop), transformer);
		var propValue = props[prop];
		return handleBreakpoints(props, propValue, styleFromPropValue);
	}).reduce(merge, {});
}
var properties, directions, aliases, getCssProperties, spacingKeys;
var init_spacing = __esmMin((() => {
	init_slicedToArray();
	init_responsivePropType();
	init_breakpoints();
	init_merge();
	init_memoize();
	properties = {
		m: "margin",
		p: "padding"
	};
	directions = {
		t: "Top",
		r: "Right",
		b: "Bottom",
		l: "Left",
		x: ["Left", "Right"],
		y: ["Top", "Bottom"]
	};
	aliases = {
		marginX: "mx",
		marginY: "my",
		paddingX: "px",
		paddingY: "py"
	};
	getCssProperties = memoize$1(function(prop) {
		if (prop.length > 2) if (aliases[prop]) prop = aliases[prop];
		else return [prop];
		var _prop$split2 = _slicedToArray(prop.split(""), 2), a = _prop$split2[0], b = _prop$split2[1];
		var property = properties[a];
		var direction = directions[b] || "";
		return Array.isArray(direction) ? direction.map(function(dir) {
			return property + dir;
		}) : [property + direction];
	});
	spacingKeys = [
		"m",
		"mt",
		"mr",
		"mb",
		"ml",
		"mx",
		"my",
		"p",
		"pt",
		"pr",
		"pb",
		"pl",
		"px",
		"py",
		"margin",
		"marginTop",
		"marginRight",
		"marginBottom",
		"marginLeft",
		"marginX",
		"marginY",
		"padding",
		"paddingTop",
		"paddingRight",
		"paddingBottom",
		"paddingLeft",
		"paddingX",
		"paddingY"
	];
	spacing.propTypes = spacingKeys.reduce(function(obj, key) {
		obj[key] = responsivePropType;
		return obj;
	}, {});
	spacing.filterProps = spacingKeys;
}));
//#endregion
//#region node_modules/@material-ui/system/esm/typography.js
var init_typography = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/system/esm/index.js
var init_esm$1 = __esmMin((() => {
	init_borders();
	init_borders();
	init_breakpoints();
	init_merge();
	init_styleFunctionSx();
	init_styleFunctionSx();
	init_responsivePropType();
	init_flexbox();
	init_flexbox();
	init_grid();
	init_grid();
	init_palette();
	init_palette();
	init_positions();
	init_positions();
	init_sizing();
	init_sizing();
	init_spacing();
	init_spacing();
	init_typography();
	init_typography();
}));
/** @license Material-UI v4.12.2
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
//#endregion
//#region node_modules/@material-ui/core/esm/styles/createSpacing.js
function createSpacing() {
	var spacingInput = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 8;
	if (spacingInput.mui) return spacingInput;
	var transform = createUnarySpacing({ spacing: spacingInput });
	var spacing = function spacing() {
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
		if (!(args.length <= 4)) console.error("Material-UI: Too many arguments provided, expected between 0 and 4, got ".concat(args.length));
		if (args.length === 0) return transform(1);
		if (args.length === 1) return transform(args[0]);
		return args.map(function(argument) {
			if (typeof argument === "string") return argument;
			var output = transform(argument);
			return typeof output === "number" ? "".concat(output, "px") : output;
		}).join(" ");
	};
	Object.defineProperty(spacing, "unit", { get: function get() {
		if (!warnOnce || false) console.error([
			"Material-UI: theme.spacing.unit usage has been deprecated.",
			"It will be removed in v5.",
			"You can replace `theme.spacing.unit * y` with `theme.spacing(y)`.",
			"",
			"You can use the `https://github.com/mui-org/material-ui/tree/master/packages/material-ui-codemod/README.md#theme-spacing-api` migration helper to make the process smoother."
		].join("\n"));
		warnOnce = true;
		return spacingInput;
	} });
	spacing.mui = true;
	return spacing;
}
var warnOnce;
var init_createSpacing = __esmMin((() => {
	init_esm$1();
}));
//#endregion
//#region node_modules/@material-ui/core/esm/styles/transitions.js
function formatMs(milliseconds) {
	return "".concat(Math.round(milliseconds), "ms");
}
var easing, duration, transitions_default;
var init_transitions = __esmMin((() => {
	init_objectWithoutProperties();
	easing = {
		easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
		easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
		easeIn: "cubic-bezier(0.4, 0, 1, 1)",
		sharp: "cubic-bezier(0.4, 0, 0.6, 1)"
	};
	duration = {
		shortest: 150,
		shorter: 200,
		short: 250,
		standard: 300,
		complex: 375,
		enteringScreen: 225,
		leavingScreen: 195
	};
	transitions_default = {
		easing,
		duration,
		create: function create() {
			var props = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : ["all"];
			var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
			var _options$duration = options.duration, durationOption = _options$duration === void 0 ? duration.standard : _options$duration, _options$easing = options.easing, easingOption = _options$easing === void 0 ? easing.easeInOut : _options$easing, _options$delay = options.delay, delay = _options$delay === void 0 ? 0 : _options$delay, other = _objectWithoutProperties(options, [
				"duration",
				"easing",
				"delay"
			]);
			var isString = function isString(value) {
				return typeof value === "string";
			};
			var isNumber = function isNumber(value) {
				return !isNaN(parseFloat(value));
			};
			if (!isString(props) && !Array.isArray(props)) console.error("Material-UI: Argument \"props\" must be a string or Array.");
			if (!isNumber(durationOption) && !isString(durationOption)) console.error("Material-UI: Argument \"duration\" must be a number or a string but found ".concat(durationOption, "."));
			if (!isString(easingOption)) console.error("Material-UI: Argument \"easing\" must be a string.");
			if (!isNumber(delay) && !isString(delay)) console.error("Material-UI: Argument \"delay\" must be a number or a string.");
			if (Object.keys(other).length !== 0) console.error("Material-UI: Unrecognized argument(s) [".concat(Object.keys(other).join(","), "]."));
			return (Array.isArray(props) ? props : [props]).map(function(animatedProp) {
				return "".concat(animatedProp, " ").concat(typeof durationOption === "string" ? durationOption : formatMs(durationOption), " ").concat(easingOption, " ").concat(typeof delay === "string" ? delay : formatMs(delay));
			}).join(",");
		},
		getAutoHeightDuration: function getAutoHeightDuration(height) {
			if (!height) return 0;
			var constant = height / 36;
			return Math.round((4 + 15 * Math.pow(constant, .25) + constant / 5) * 10);
		}
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/styles/zIndex.js
var zIndex;
var init_zIndex = __esmMin((() => {
	zIndex = {
		mobileStepper: 1e3,
		speedDial: 1050,
		appBar: 1100,
		drawer: 1200,
		modal: 1300,
		snackbar: 1400,
		tooltip: 1500
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/styles/createTheme.js
function createTheme() {
	var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
	var _options$breakpoints = options.breakpoints, breakpointsInput = _options$breakpoints === void 0 ? {} : _options$breakpoints, _options$mixins = options.mixins, mixinsInput = _options$mixins === void 0 ? {} : _options$mixins, _options$palette = options.palette, paletteInput = _options$palette === void 0 ? {} : _options$palette, spacingInput = options.spacing, _options$typography = options.typography, typographyInput = _options$typography === void 0 ? {} : _options$typography, other = _objectWithoutProperties(options, [
		"breakpoints",
		"mixins",
		"palette",
		"spacing",
		"typography"
	]);
	var palette = createPalette(paletteInput);
	var breakpoints = createBreakpoints(breakpointsInput);
	var spacing = createSpacing(spacingInput);
	var muiTheme = deepmerge({
		breakpoints,
		direction: "ltr",
		mixins: createMixins(breakpoints, spacing, mixinsInput),
		overrides: {},
		palette,
		props: {},
		shadows,
		typography: createTypography(palette, typographyInput),
		spacing,
		shape,
		transitions: transitions_default,
		zIndex
	}, other);
	for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) args[_key - 1] = arguments[_key];
	muiTheme = args.reduce(function(acc, argument) {
		return deepmerge(acc, argument);
	}, muiTheme);
	var pseudoClasses = [
		"checked",
		"disabled",
		"error",
		"focused",
		"focusVisible",
		"required",
		"expanded",
		"selected"
	];
	(function traverse(node, parentKey) {
		var depth = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
		var key;
		for (key in node) {
			var child = node[key];
			if (depth === 1) {
				if (key.indexOf("Mui") === 0 && child) traverse(child, key, depth + 1);
			} else if (pseudoClasses.indexOf(key) !== -1 && Object.keys(child).length > 0) {
				console.error([
					"Material-UI: The `".concat(parentKey, "` component increases ") + "the CSS specificity of the `".concat(key, "` internal state."),
					"You can not override it like this: ",
					JSON.stringify(node, null, 2),
					"",
					"Instead, you need to use the $ruleName syntax:",
					JSON.stringify({ root: _defineProperty({}, "&$".concat(key), child) }, null, 2),
					"",
					"https://mui.com/r/pseudo-classes-guide"
				].join("\n"));
				node[key] = {};
			}
		}
	})(muiTheme.overrides);
	return muiTheme;
}
var init_createTheme = __esmMin((() => {
	init_defineProperty();
	init_objectWithoutProperties();
	init_esm$2();
	init_createBreakpoints();
	init_createMixins();
	init_createPalette();
	init_createTypography();
	init_shadows();
	init_shape();
	init_createSpacing();
	init_transitions();
	init_zIndex();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/ThemeProvider/nested.js
var hasSymbol, nested_default;
var init_nested = __esmMin((() => {
	hasSymbol = typeof Symbol === "function" && Symbol.for;
	nested_default = hasSymbol ? Symbol.for("mui.nested") : "__THEME_NESTED__";
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/createGenerateClassName/createGenerateClassName.js
function createGenerateClassName() {
	var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, _options$disableGloba = options.disableGlobal, disableGlobal = _options$disableGloba === void 0 ? false : _options$disableGloba;
	options.productionPrefix;
	var _options$seed = options.seed, seed = _options$seed === void 0 ? "" : _options$seed;
	var seedPrefix = seed === "" ? "" : "".concat(seed, "-");
	var ruleCounter = 0;
	var getNextCounterId = function getNextCounterId() {
		ruleCounter += 1;
		if (ruleCounter >= 1e10) console.warn(["Material-UI: You might have a memory leak.", "The ruleCounter is not supposed to grow that much."].join(""));
		return ruleCounter;
	};
	return function(rule, styleSheet) {
		var name = styleSheet.options.name;
		if (name && name.indexOf("Mui") === 0 && !styleSheet.options.link && !disableGlobal) {
			if (pseudoClasses.indexOf(rule.key) !== -1) return "Mui-".concat(rule.key);
			var prefix = "".concat(seedPrefix).concat(name, "-").concat(rule.key);
			if (!styleSheet.options.theme[nested_default] || seed !== "") return prefix;
			return "".concat(prefix, "-").concat(getNextCounterId());
		}
		var suffix = "".concat(rule.key, "-").concat(getNextCounterId());
		if (styleSheet.options.classNamePrefix) return "".concat(seedPrefix).concat(styleSheet.options.classNamePrefix, "-").concat(suffix);
		return "".concat(seedPrefix).concat(suffix);
	};
}
var pseudoClasses;
var init_createGenerateClassName$1 = __esmMin((() => {
	init_nested();
	pseudoClasses = [
		"checked",
		"disabled",
		"error",
		"focused",
		"focusVisible",
		"required",
		"expanded",
		"selected"
	];
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/createGenerateClassName/index.js
var init_createGenerateClassName = __esmMin((() => {
	init_createGenerateClassName$1();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/createStyles/index.js
var init_createStyles = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/styles/esm/getThemeProps/getThemeProps.js
function getThemeProps(params) {
	var theme = params.theme, name = params.name, props = params.props;
	if (!theme || !theme.props || !theme.props[name]) return props;
	var defaultProps = theme.props[name];
	var propName;
	for (propName in defaultProps) if (props[propName] === void 0) props[propName] = defaultProps[propName];
	return props;
}
var init_getThemeProps$1 = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/styles/esm/getThemeProps/index.js
var init_getThemeProps = __esmMin((() => {
	init_getThemeProps$1();
}));
//#endregion
//#region node_modules/is-in-browser/dist/module.js
var _typeof, isBrowser;
var init_module = __esmMin((() => {
	_typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
		return typeof obj;
	} : function(obj) {
		return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};
	isBrowser = (typeof window === "undefined" ? "undefined" : _typeof(window)) === "object" && (typeof document === "undefined" ? "undefined" : _typeof(document)) === "object" && document.nodeType === 9;
}));
//#endregion
//#region node_modules/jss/dist/jss.esm.js
function cloneStyle(style) {
	if (style == null || typeof style !== "object") return style;
	if (Array.isArray(style)) return style.map(cloneStyle);
	if (style.constructor !== plainObjectConstrurctor) return style;
	var newStyle = {};
	for (var name in style) newStyle[name] = cloneStyle(style[name]);
	return newStyle;
}
/**
* Create a rule instance.
*/
function createRule(name, decl, options) {
	if (name === void 0) name = "unnamed";
	var jss = options.jss;
	var declCopy = cloneStyle(decl);
	var rule = jss.plugins.onCreateRule(name, declCopy, options);
	if (rule) return rule;
	if (name[0] === "@") warning(false, "[JSS] Unknown rule " + name);
	return null;
}
function getWhitespaceSymbols(options) {
	if (options && options.format === false) return {
		linebreak: "",
		space: ""
	};
	return {
		linebreak: "\n",
		space: " "
	};
}
/**
* Indent a string.
* http://jsperf.com/array-join-vs-for
*/
function indentStr(str, indent) {
	var result = "";
	for (var index = 0; index < indent; index++) result += "  ";
	return result + str;
}
/**
* Converts a Rule to CSS string.
*/
function toCss(selector, style, options) {
	if (options === void 0) options = {};
	var result = "";
	if (!style) return result;
	var _options$indent = options.indent, indent = _options$indent === void 0 ? 0 : _options$indent;
	var fallbacks = style.fallbacks;
	if (options.format === false) indent = -Infinity;
	var _getWhitespaceSymbols = getWhitespaceSymbols(options), linebreak = _getWhitespaceSymbols.linebreak, space = _getWhitespaceSymbols.space;
	if (selector) indent++;
	if (fallbacks) if (Array.isArray(fallbacks)) for (var index = 0; index < fallbacks.length; index++) {
		var fallback = fallbacks[index];
		for (var prop in fallback) {
			var value = fallback[prop];
			if (value != null) {
				if (result) result += linebreak;
				result += indentStr(prop + ":" + space + toCssValue(value) + ";", indent);
			}
		}
	}
	else for (var _prop in fallbacks) {
		var _value = fallbacks[_prop];
		if (_value != null) {
			if (result) result += linebreak;
			result += indentStr(_prop + ":" + space + toCssValue(_value) + ";", indent);
		}
	}
	for (var _prop2 in style) {
		var _value2 = style[_prop2];
		if (_value2 != null && _prop2 !== "fallbacks") {
			if (result) result += linebreak;
			result += indentStr(_prop2 + ":" + space + toCssValue(_value2) + ";", indent);
		}
	}
	if (!result && !options.allowEmpty) return result;
	if (!selector) return result;
	indent--;
	if (result) result = "" + linebreak + result + linebreak;
	return indentStr("" + selector + space + "{" + result, indent) + indentStr("}", indent);
}
/**
* Find attached sheet with an index higher than the passed one.
*/
function findHigherSheet(registry, options) {
	for (var i = 0; i < registry.length; i++) {
		var sheet = registry[i];
		if (sheet.attached && sheet.options.index > options.index && sheet.options.insertionPoint === options.insertionPoint) return sheet;
	}
	return null;
}
/**
* Find attached sheet with the highest index.
*/
function findHighestSheet(registry, options) {
	for (var i = registry.length - 1; i >= 0; i--) {
		var sheet = registry[i];
		if (sheet.attached && sheet.options.insertionPoint === options.insertionPoint) return sheet;
	}
	return null;
}
/**
* Find a comment with "jss" inside.
*/
function findCommentNode(text) {
	var head = getHead();
	for (var i = 0; i < head.childNodes.length; i++) {
		var node = head.childNodes[i];
		if (node.nodeType === 8 && node.nodeValue.trim() === text) return node;
	}
	return null;
}
/**
* Find a node before which we can insert the sheet.
*/
function findPrevNode(options) {
	var registry = sheets.registry;
	if (registry.length > 0) {
		var sheet = findHigherSheet(registry, options);
		if (sheet && sheet.renderer) return {
			parent: sheet.renderer.element.parentNode,
			node: sheet.renderer.element
		};
		sheet = findHighestSheet(registry, options);
		if (sheet && sheet.renderer) return {
			parent: sheet.renderer.element.parentNode,
			node: sheet.renderer.element.nextSibling
		};
	}
	var insertionPoint = options.insertionPoint;
	if (insertionPoint && typeof insertionPoint === "string") {
		var comment = findCommentNode(insertionPoint);
		if (comment) return {
			parent: comment.parentNode,
			node: comment.nextSibling
		};
		warning(false, "[JSS] Insertion point \"" + insertionPoint + "\" not found.");
	}
	return false;
}
/**
* Insert style element into the DOM.
*/
function insertStyle(style, options) {
	var insertionPoint = options.insertionPoint;
	var nextNode = findPrevNode(options);
	if (nextNode !== false && nextNode.parent) {
		nextNode.parent.insertBefore(style, nextNode.node);
		return;
	}
	if (insertionPoint && typeof insertionPoint.nodeType === "number") {
		var insertionPointElement = insertionPoint;
		var parentNode = insertionPointElement.parentNode;
		if (parentNode) parentNode.insertBefore(style, insertionPointElement.nextSibling);
		else warning(false, "[JSS] Insertion point is not in the DOM.");
		return;
	}
	getHead().appendChild(style);
}
/**
* Extracts a styles object with only props that contain function values.
*/
function getDynamicStyles(styles) {
	var to = null;
	for (var key in styles) {
		var value = styles[key];
		var type = typeof value;
		if (type === "function") {
			if (!to) to = {};
			to[key] = value;
		} else if (type === "object" && value !== null && !Array.isArray(value)) {
			var extracted = getDynamicStyles(value);
			if (extracted) {
				if (!to) to = {};
				to[key] = extracted;
			}
		}
	}
	return to;
}
var plainObjectConstrurctor, join, toCssValue, escapeRegex, nativeEscape, escape, BaseStyleRule, StyleRule, pluginStyleRule, defaultToStringOptions, atRegExp, ConditionalRule, keyRegExp, pluginConditionalRule, defaultToStringOptions$1, nameRegExp, KeyframesRule, keyRegExp$1, refRegExp$1, findReferencedKeyframe, replaceRef, pluginKeyframesRule, KeyframeRule, pluginKeyframeRule, FontFaceRule, keyRegExp$2, pluginFontFaceRule, ViewportRule, pluginViewportRule, SimpleRule, keysMap, plugins$1, defaultUpdateOptions, forceUpdateOptions, RuleList, StyleSheet, PluginsRegistry, SheetsRegistry, sheets, globalThis$1, ns, moduleId, maxRules, createGenerateId, memoize, getPropertyValue, setProperty, removeProperty, setSelector, getHead, getNonce, _insertRule, getValidRuleInsertionIndex, createStyle, DomRenderer, instanceCounter, Jss, createJss, hasCSSTOMSupport;
var init_jss_esm = __esmMin((() => {
	init_extends();
	init_module();
	init_tiny_warning_esm();
	init_createClass();
	init_inheritsLoose();
	init_assertThisInitialized();
	init_objectWithoutPropertiesLoose();
	plainObjectConstrurctor = {}.constructor;
	join = function join(value, by) {
		var result = "";
		for (var i = 0; i < value.length; i++) {
			if (value[i] === "!important") break;
			if (result) result += by;
			result += value[i];
		}
		return result;
	};
	toCssValue = function toCssValue(value) {
		if (!Array.isArray(value)) return value;
		var cssValue = "";
		if (Array.isArray(value[0])) for (var i = 0; i < value.length; i++) {
			if (value[i] === "!important") break;
			if (cssValue) cssValue += ", ";
			cssValue += join(value[i], " ");
		}
		else cssValue = join(value, ", ");
		if (value[value.length - 1] === "!important") cssValue += " !important";
		return cssValue;
	};
	escapeRegex = /([[\].#*$><+~=|^:(),"'`\s])/g;
	nativeEscape = typeof CSS !== "undefined" && CSS.escape;
	escape = (function(str) {
		return nativeEscape ? nativeEscape(str) : str.replace(escapeRegex, "\\$1");
	});
	BaseStyleRule = /*#__PURE__*/ function() {
		function BaseStyleRule(key, style, options) {
			this.type = "style";
			this.isProcessed = false;
			var sheet = options.sheet, Renderer = options.Renderer;
			this.key = key;
			this.options = options;
			this.style = style;
			if (sheet) this.renderer = sheet.renderer;
			else if (Renderer) this.renderer = new Renderer();
		}
		/**
		* Get or set a style property.
		*/
		var _proto = BaseStyleRule.prototype;
		_proto.prop = function prop(name, value, options) {
			if (value === void 0) return this.style[name];
			var force = options ? options.force : false;
			if (!force && this.style[name] === value) return this;
			var newValue = value;
			if (!options || options.process !== false) newValue = this.options.jss.plugins.onChangeValue(value, name, this);
			var isEmpty = newValue == null || newValue === false;
			var isDefined = name in this.style;
			if (isEmpty && !isDefined && !force) return this;
			var remove = isEmpty && isDefined;
			if (remove) delete this.style[name];
			else this.style[name] = newValue;
			if (this.renderable && this.renderer) {
				if (remove) this.renderer.removeProperty(this.renderable, name);
				else this.renderer.setProperty(this.renderable, name, newValue);
				return this;
			}
			var sheet = this.options.sheet;
			if (sheet && sheet.attached) warning(false, "[JSS] Rule is not linked. Missing sheet option \"link: true\".");
			return this;
		};
		return BaseStyleRule;
	}();
	StyleRule = /*#__PURE__*/ function(_BaseStyleRule) {
		_inheritsLoose(StyleRule, _BaseStyleRule);
		function StyleRule(key, style, options) {
			var _this = _BaseStyleRule.call(this, key, style, options) || this;
			var selector = options.selector, scoped = options.scoped, sheet = options.sheet, generateId = options.generateId;
			if (selector) _this.selectorText = selector;
			else if (scoped !== false) {
				_this.id = generateId(_assertThisInitialized(_assertThisInitialized(_this)), sheet);
				_this.selectorText = "." + escape(_this.id);
			}
			return _this;
		}
		/**
		* Set selector string.
		* Attention: use this with caution. Most browsers didn't implement
		* selectorText setter, so this may result in rerendering of entire Style Sheet.
		*/
		var _proto2 = StyleRule.prototype;
		/**
		* Apply rule to an element inline.
		*/
		_proto2.applyTo = function applyTo(renderable) {
			var renderer = this.renderer;
			if (renderer) {
				var json = this.toJSON();
				for (var prop in json) renderer.setProperty(renderable, prop, json[prop]);
			}
			return this;
		};
		_proto2.toJSON = function toJSON() {
			var json = {};
			for (var prop in this.style) {
				var value = this.style[prop];
				if (typeof value !== "object") json[prop] = value;
				else if (Array.isArray(value)) json[prop] = toCssValue(value);
			}
			return json;
		};
		_proto2.toString = function toString(options) {
			var sheet = this.options.sheet;
			var opts = (sheet ? sheet.options.link : false) ? _extends({}, options, { allowEmpty: true }) : options;
			return toCss(this.selectorText, this.style, opts);
		};
		_createClass(StyleRule, [{
			key: "selector",
			set: function set(selector) {
				if (selector === this.selectorText) return;
				this.selectorText = selector;
				var renderer = this.renderer, renderable = this.renderable;
				if (!renderable || !renderer) return;
				if (!renderer.setSelector(renderable, selector)) renderer.replaceRule(renderable, this);
			},
			get: function get() {
				return this.selectorText;
			}
		}]);
		return StyleRule;
	}(BaseStyleRule);
	pluginStyleRule = { onCreateRule: function onCreateRule(key, style, options) {
		if (key[0] === "@" || options.parent && options.parent.type === "keyframes") return null;
		return new StyleRule(key, style, options);
	} };
	defaultToStringOptions = {
		indent: 1,
		children: true
	};
	atRegExp = /@([\w-]+)/;
	ConditionalRule = /*#__PURE__*/ function() {
		function ConditionalRule(key, styles, options) {
			this.type = "conditional";
			this.isProcessed = false;
			this.key = key;
			var atMatch = key.match(atRegExp);
			this.at = atMatch ? atMatch[1] : "unknown";
			this.query = options.name || "@" + this.at;
			this.options = options;
			this.rules = new RuleList(_extends({}, options, { parent: this }));
			for (var name in styles) this.rules.add(name, styles[name]);
			this.rules.process();
		}
		/**
		* Get a rule.
		*/
		var _proto = ConditionalRule.prototype;
		_proto.getRule = function getRule(name) {
			return this.rules.get(name);
		};
		_proto.indexOf = function indexOf(rule) {
			return this.rules.indexOf(rule);
		};
		_proto.addRule = function addRule(name, style, options) {
			var rule = this.rules.add(name, style, options);
			if (!rule) return null;
			this.options.jss.plugins.onProcessRule(rule);
			return rule;
		};
		_proto.replaceRule = function replaceRule(name, style, options) {
			var newRule = this.rules.replace(name, style, options);
			if (newRule) this.options.jss.plugins.onProcessRule(newRule);
			return newRule;
		};
		_proto.toString = function toString(options) {
			if (options === void 0) options = defaultToStringOptions;
			var linebreak = getWhitespaceSymbols(options).linebreak;
			if (options.indent == null) options.indent = defaultToStringOptions.indent;
			if (options.children == null) options.children = defaultToStringOptions.children;
			if (options.children === false) return this.query + " {}";
			var children = this.rules.toString(options);
			return children ? this.query + " {" + linebreak + children + linebreak + "}" : "";
		};
		return ConditionalRule;
	}();
	keyRegExp = /@container|@media|@supports\s+/;
	pluginConditionalRule = { onCreateRule: function onCreateRule(key, styles, options) {
		return keyRegExp.test(key) ? new ConditionalRule(key, styles, options) : null;
	} };
	defaultToStringOptions$1 = {
		indent: 1,
		children: true
	};
	nameRegExp = /@keyframes\s+([\w-]+)/;
	KeyframesRule = /*#__PURE__*/ function() {
		function KeyframesRule(key, frames, options) {
			this.type = "keyframes";
			this.at = "@keyframes";
			this.isProcessed = false;
			var nameMatch = key.match(nameRegExp);
			if (nameMatch && nameMatch[1]) this.name = nameMatch[1];
			else {
				this.name = "noname";
				warning(false, "[JSS] Bad keyframes name " + key);
			}
			this.key = this.type + "-" + this.name;
			this.options = options;
			var scoped = options.scoped, sheet = options.sheet, generateId = options.generateId;
			this.id = scoped === false ? this.name : escape(generateId(this, sheet));
			this.rules = new RuleList(_extends({}, options, { parent: this }));
			for (var name in frames) this.rules.add(name, frames[name], _extends({}, options, { parent: this }));
			this.rules.process();
		}
		/**
		* Generates a CSS string.
		*/
		var _proto = KeyframesRule.prototype;
		_proto.toString = function toString(options) {
			if (options === void 0) options = defaultToStringOptions$1;
			var linebreak = getWhitespaceSymbols(options).linebreak;
			if (options.indent == null) options.indent = defaultToStringOptions$1.indent;
			if (options.children == null) options.children = defaultToStringOptions$1.children;
			if (options.children === false) return this.at + " " + this.id + " {}";
			var children = this.rules.toString(options);
			if (children) children = "" + linebreak + children + linebreak;
			return this.at + " " + this.id + " {" + children + "}";
		};
		return KeyframesRule;
	}();
	keyRegExp$1 = /@keyframes\s+/;
	refRegExp$1 = /\$([\w-]+)/g;
	findReferencedKeyframe = function findReferencedKeyframe(val, keyframes) {
		if (typeof val === "string") return val.replace(refRegExp$1, function(match, name) {
			if (name in keyframes) return keyframes[name];
			warning(false, "[JSS] Referenced keyframes rule \"" + name + "\" is not defined.");
			return match;
		});
		return val;
	};
	replaceRef = function replaceRef(style, prop, keyframes) {
		var value = style[prop];
		var refKeyframe = findReferencedKeyframe(value, keyframes);
		if (refKeyframe !== value) style[prop] = refKeyframe;
	};
	pluginKeyframesRule = {
		onCreateRule: function onCreateRule(key, frames, options) {
			return typeof key === "string" && keyRegExp$1.test(key) ? new KeyframesRule(key, frames, options) : null;
		},
		onProcessStyle: function onProcessStyle(style, rule, sheet) {
			if (rule.type !== "style" || !sheet) return style;
			if ("animation-name" in style) replaceRef(style, "animation-name", sheet.keyframes);
			if ("animation" in style) replaceRef(style, "animation", sheet.keyframes);
			return style;
		},
		onChangeValue: function onChangeValue(val, prop, rule) {
			var sheet = rule.options.sheet;
			if (!sheet) return val;
			switch (prop) {
				case "animation": return findReferencedKeyframe(val, sheet.keyframes);
				case "animation-name": return findReferencedKeyframe(val, sheet.keyframes);
				default: return val;
			}
		}
	};
	KeyframeRule = /*#__PURE__*/ function(_BaseStyleRule) {
		_inheritsLoose(KeyframeRule, _BaseStyleRule);
		function KeyframeRule() {
			return _BaseStyleRule.apply(this, arguments) || this;
		}
		var _proto = KeyframeRule.prototype;
		/**
		* Generates a CSS string.
		*/
		_proto.toString = function toString(options) {
			var sheet = this.options.sheet;
			var opts = (sheet ? sheet.options.link : false) ? _extends({}, options, { allowEmpty: true }) : options;
			return toCss(this.key, this.style, opts);
		};
		return KeyframeRule;
	}(BaseStyleRule);
	pluginKeyframeRule = { onCreateRule: function onCreateRule(key, style, options) {
		if (options.parent && options.parent.type === "keyframes") return new KeyframeRule(key, style, options);
		return null;
	} };
	FontFaceRule = /*#__PURE__*/ function() {
		function FontFaceRule(key, style, options) {
			this.type = "font-face";
			this.at = "@font-face";
			this.isProcessed = false;
			this.key = key;
			this.style = style;
			this.options = options;
		}
		/**
		* Generates a CSS string.
		*/
		var _proto = FontFaceRule.prototype;
		_proto.toString = function toString(options) {
			var linebreak = getWhitespaceSymbols(options).linebreak;
			if (Array.isArray(this.style)) {
				var str = "";
				for (var index = 0; index < this.style.length; index++) {
					str += toCss(this.at, this.style[index]);
					if (this.style[index + 1]) str += linebreak;
				}
				return str;
			}
			return toCss(this.at, this.style, options);
		};
		return FontFaceRule;
	}();
	keyRegExp$2 = /@font-face/;
	pluginFontFaceRule = { onCreateRule: function onCreateRule(key, style, options) {
		return keyRegExp$2.test(key) ? new FontFaceRule(key, style, options) : null;
	} };
	ViewportRule = /*#__PURE__*/ function() {
		function ViewportRule(key, style, options) {
			this.type = "viewport";
			this.at = "@viewport";
			this.isProcessed = false;
			this.key = key;
			this.style = style;
			this.options = options;
		}
		/**
		* Generates a CSS string.
		*/
		var _proto = ViewportRule.prototype;
		_proto.toString = function toString(options) {
			return toCss(this.key, this.style, options);
		};
		return ViewportRule;
	}();
	pluginViewportRule = { onCreateRule: function onCreateRule(key, style, options) {
		return key === "@viewport" || key === "@-ms-viewport" ? new ViewportRule(key, style, options) : null;
	} };
	SimpleRule = /*#__PURE__*/ function() {
		function SimpleRule(key, value, options) {
			this.type = "simple";
			this.isProcessed = false;
			this.key = key;
			this.value = value;
			this.options = options;
		}
		/**
		* Generates a CSS string.
		*/
		var _proto = SimpleRule.prototype;
		_proto.toString = function toString(options) {
			if (Array.isArray(this.value)) {
				var str = "";
				for (var index = 0; index < this.value.length; index++) {
					str += this.key + " " + this.value[index] + ";";
					if (this.value[index + 1]) str += "\n";
				}
				return str;
			}
			return this.key + " " + this.value + ";";
		};
		return SimpleRule;
	}();
	keysMap = {
		"@charset": true,
		"@import": true,
		"@namespace": true
	};
	plugins$1 = [
		pluginStyleRule,
		pluginConditionalRule,
		pluginKeyframesRule,
		pluginKeyframeRule,
		pluginFontFaceRule,
		pluginViewportRule,
		{ onCreateRule: function onCreateRule(key, value, options) {
			return key in keysMap ? new SimpleRule(key, value, options) : null;
		} }
	];
	defaultUpdateOptions = { process: true };
	forceUpdateOptions = {
		force: true,
		process: true
	};
	RuleList = /*#__PURE__*/ function() {
		function RuleList(options) {
			this.map = {};
			this.raw = {};
			this.index = [];
			this.counter = 0;
			this.options = options;
			this.classes = options.classes;
			this.keyframes = options.keyframes;
		}
		/**
		* Create and register rule.
		*
		* Will not render after Style Sheet was rendered the first time.
		*/
		var _proto = RuleList.prototype;
		_proto.add = function add(name, decl, ruleOptions) {
			var _this$options = this.options, parent = _this$options.parent, sheet = _this$options.sheet, jss = _this$options.jss, Renderer = _this$options.Renderer, generateId = _this$options.generateId, scoped = _this$options.scoped;
			var options = _extends({
				classes: this.classes,
				parent,
				sheet,
				jss,
				Renderer,
				generateId,
				scoped,
				name,
				keyframes: this.keyframes,
				selector: void 0
			}, ruleOptions);
			var key = name;
			if (name in this.raw) key = name + "-d" + this.counter++;
			this.raw[key] = decl;
			if (key in this.classes) options.selector = "." + escape(this.classes[key]);
			var rule = createRule(key, decl, options);
			if (!rule) return null;
			this.register(rule);
			var index = options.index === void 0 ? this.index.length : options.index;
			this.index.splice(index, 0, rule);
			return rule;
		};
		_proto.replace = function replace(name, decl, ruleOptions) {
			var oldRule = this.get(name);
			var oldIndex = this.index.indexOf(oldRule);
			if (oldRule) this.remove(oldRule);
			var options = ruleOptions;
			if (oldIndex !== -1) options = _extends({}, ruleOptions, { index: oldIndex });
			return this.add(name, decl, options);
		};
		_proto.get = function get(nameOrSelector) {
			return this.map[nameOrSelector];
		};
		_proto.remove = function remove(rule) {
			this.unregister(rule);
			delete this.raw[rule.key];
			this.index.splice(this.index.indexOf(rule), 1);
		};
		_proto.indexOf = function indexOf(rule) {
			return this.index.indexOf(rule);
		};
		_proto.process = function process() {
			var plugins = this.options.jss.plugins;
			this.index.slice(0).forEach(plugins.onProcessRule, plugins);
		};
		_proto.register = function register(rule) {
			this.map[rule.key] = rule;
			if (rule instanceof StyleRule) {
				this.map[rule.selector] = rule;
				if (rule.id) this.classes[rule.key] = rule.id;
			} else if (rule instanceof KeyframesRule && this.keyframes) this.keyframes[rule.name] = rule.id;
		};
		_proto.unregister = function unregister(rule) {
			delete this.map[rule.key];
			if (rule instanceof StyleRule) {
				delete this.map[rule.selector];
				delete this.classes[rule.key];
			} else if (rule instanceof KeyframesRule) delete this.keyframes[rule.name];
		};
		_proto.update = function update() {
			var name;
			var data;
			var options;
			if (typeof (arguments.length <= 0 ? void 0 : arguments[0]) === "string") {
				name = arguments.length <= 0 ? void 0 : arguments[0];
				data = arguments.length <= 1 ? void 0 : arguments[1];
				options = arguments.length <= 2 ? void 0 : arguments[2];
			} else {
				data = arguments.length <= 0 ? void 0 : arguments[0];
				options = arguments.length <= 1 ? void 0 : arguments[1];
				name = null;
			}
			if (name) this.updateOne(this.get(name), data, options);
			else for (var index = 0; index < this.index.length; index++) this.updateOne(this.index[index], data, options);
		};
		_proto.updateOne = function updateOne(rule, data, options) {
			if (options === void 0) options = defaultUpdateOptions;
			var _this$options2 = this.options, plugins = _this$options2.jss.plugins, sheet = _this$options2.sheet;
			if (rule.rules instanceof RuleList) {
				rule.rules.update(data, options);
				return;
			}
			var style = rule.style;
			plugins.onUpdate(data, rule, sheet, options);
			if (options.process && style && style !== rule.style) {
				plugins.onProcessStyle(rule.style, rule, sheet);
				for (var prop in rule.style) {
					var nextValue = rule.style[prop];
					if (nextValue !== style[prop]) rule.prop(prop, nextValue, forceUpdateOptions);
				}
				for (var _prop in style) {
					var _nextValue = rule.style[_prop];
					var _prevValue = style[_prop];
					if (_nextValue == null && _nextValue !== _prevValue) rule.prop(_prop, null, forceUpdateOptions);
				}
			}
		};
		_proto.toString = function toString(options) {
			var str = "";
			var sheet = this.options.sheet;
			var link = sheet ? sheet.options.link : false;
			var linebreak = getWhitespaceSymbols(options).linebreak;
			for (var index = 0; index < this.index.length; index++) {
				var css = this.index[index].toString(options);
				if (!css && !link) continue;
				if (str) str += linebreak;
				str += css;
			}
			return str;
		};
		return RuleList;
	}();
	StyleSheet = /*#__PURE__*/ function() {
		function StyleSheet(styles, options) {
			this.attached = false;
			this.deployed = false;
			this.classes = {};
			this.keyframes = {};
			this.options = _extends({}, options, {
				sheet: this,
				parent: this,
				classes: this.classes,
				keyframes: this.keyframes
			});
			if (options.Renderer) this.renderer = new options.Renderer(this);
			this.rules = new RuleList(this.options);
			for (var name in styles) this.rules.add(name, styles[name]);
			this.rules.process();
		}
		/**
		* Attach renderable to the render tree.
		*/
		var _proto = StyleSheet.prototype;
		_proto.attach = function attach() {
			if (this.attached) return this;
			if (this.renderer) this.renderer.attach();
			this.attached = true;
			if (!this.deployed) this.deploy();
			return this;
		};
		_proto.detach = function detach() {
			if (!this.attached) return this;
			if (this.renderer) this.renderer.detach();
			this.attached = false;
			return this;
		};
		_proto.addRule = function addRule(name, decl, options) {
			var queue = this.queue;
			if (this.attached && !queue) this.queue = [];
			var rule = this.rules.add(name, decl, options);
			if (!rule) return null;
			this.options.jss.plugins.onProcessRule(rule);
			if (this.attached) {
				if (!this.deployed) return rule;
				if (queue) queue.push(rule);
				else {
					this.insertRule(rule);
					if (this.queue) {
						this.queue.forEach(this.insertRule, this);
						this.queue = void 0;
					}
				}
				return rule;
			}
			this.deployed = false;
			return rule;
		};
		_proto.replaceRule = function replaceRule(nameOrSelector, decl, options) {
			var oldRule = this.rules.get(nameOrSelector);
			if (!oldRule) return this.addRule(nameOrSelector, decl, options);
			var newRule = this.rules.replace(nameOrSelector, decl, options);
			if (newRule) this.options.jss.plugins.onProcessRule(newRule);
			if (this.attached) {
				if (!this.deployed) return newRule;
				if (this.renderer) {
					if (!newRule) this.renderer.deleteRule(oldRule);
					else if (oldRule.renderable) this.renderer.replaceRule(oldRule.renderable, newRule);
				}
				return newRule;
			}
			this.deployed = false;
			return newRule;
		};
		_proto.insertRule = function insertRule(rule) {
			if (this.renderer) this.renderer.insertRule(rule);
		};
		_proto.addRules = function addRules(styles, options) {
			var added = [];
			for (var name in styles) {
				var rule = this.addRule(name, styles[name], options);
				if (rule) added.push(rule);
			}
			return added;
		};
		_proto.getRule = function getRule(nameOrSelector) {
			return this.rules.get(nameOrSelector);
		};
		_proto.deleteRule = function deleteRule(name) {
			var rule = typeof name === "object" ? name : this.rules.get(name);
			if (!rule || this.attached && !rule.renderable) return false;
			this.rules.remove(rule);
			if (this.attached && rule.renderable && this.renderer) return this.renderer.deleteRule(rule.renderable);
			return true;
		};
		_proto.indexOf = function indexOf(rule) {
			return this.rules.indexOf(rule);
		};
		_proto.deploy = function deploy() {
			if (this.renderer) this.renderer.deploy();
			this.deployed = true;
			return this;
		};
		_proto.update = function update() {
			var _this$rules;
			(_this$rules = this.rules).update.apply(_this$rules, arguments);
			return this;
		};
		_proto.updateOne = function updateOne(rule, data, options) {
			this.rules.updateOne(rule, data, options);
			return this;
		};
		_proto.toString = function toString(options) {
			return this.rules.toString(options);
		};
		return StyleSheet;
	}();
	PluginsRegistry = /*#__PURE__*/ function() {
		function PluginsRegistry() {
			this.plugins = {
				internal: [],
				external: []
			};
			this.registry = {};
		}
		var _proto = PluginsRegistry.prototype;
		/**
		* Call `onCreateRule` hooks and return an object if returned by a hook.
		*/
		_proto.onCreateRule = function onCreateRule(name, decl, options) {
			for (var i = 0; i < this.registry.onCreateRule.length; i++) {
				var rule = this.registry.onCreateRule[i](name, decl, options);
				if (rule) return rule;
			}
			return null;
		};
		_proto.onProcessRule = function onProcessRule(rule) {
			if (rule.isProcessed) return;
			var sheet = rule.options.sheet;
			for (var i = 0; i < this.registry.onProcessRule.length; i++) this.registry.onProcessRule[i](rule, sheet);
			if (rule.style) this.onProcessStyle(rule.style, rule, sheet);
			rule.isProcessed = true;
		};
		_proto.onProcessStyle = function onProcessStyle(style, rule, sheet) {
			for (var i = 0; i < this.registry.onProcessStyle.length; i++) rule.style = this.registry.onProcessStyle[i](rule.style, rule, sheet);
		};
		_proto.onProcessSheet = function onProcessSheet(sheet) {
			for (var i = 0; i < this.registry.onProcessSheet.length; i++) this.registry.onProcessSheet[i](sheet);
		};
		_proto.onUpdate = function onUpdate(data, rule, sheet, options) {
			for (var i = 0; i < this.registry.onUpdate.length; i++) this.registry.onUpdate[i](data, rule, sheet, options);
		};
		_proto.onChangeValue = function onChangeValue(value, prop, rule) {
			var processedValue = value;
			for (var i = 0; i < this.registry.onChangeValue.length; i++) processedValue = this.registry.onChangeValue[i](processedValue, prop, rule);
			return processedValue;
		};
		_proto.use = function use(newPlugin, options) {
			if (options === void 0) options = { queue: "external" };
			var plugins = this.plugins[options.queue];
			if (plugins.indexOf(newPlugin) !== -1) return;
			plugins.push(newPlugin);
			this.registry = [].concat(this.plugins.external, this.plugins.internal).reduce(function(registry, plugin) {
				for (var name in plugin) if (name in registry) registry[name].push(plugin[name]);
				else warning(false, "[JSS] Unknown hook \"" + name + "\".");
				return registry;
			}, {
				onCreateRule: [],
				onProcessRule: [],
				onProcessStyle: [],
				onProcessSheet: [],
				onChangeValue: [],
				onUpdate: []
			});
		};
		return PluginsRegistry;
	}();
	SheetsRegistry = /*#__PURE__*/ function() {
		function SheetsRegistry() {
			this.registry = [];
		}
		var _proto = SheetsRegistry.prototype;
		/**
		* Register a Style Sheet.
		*/
		_proto.add = function add(sheet) {
			var registry = this.registry;
			var index = sheet.options.index;
			if (registry.indexOf(sheet) !== -1) return;
			if (registry.length === 0 || index >= this.index) {
				registry.push(sheet);
				return;
			}
			for (var i = 0; i < registry.length; i++) if (registry[i].options.index > index) {
				registry.splice(i, 0, sheet);
				return;
			}
		};
		_proto.reset = function reset() {
			this.registry = [];
		};
		_proto.remove = function remove(sheet) {
			var index = this.registry.indexOf(sheet);
			this.registry.splice(index, 1);
		};
		_proto.toString = function toString(_temp) {
			var _ref = _temp === void 0 ? {} : _temp, attached = _ref.attached, options = _objectWithoutPropertiesLoose(_ref, ["attached"]);
			var linebreak = getWhitespaceSymbols(options).linebreak;
			var css = "";
			for (var i = 0; i < this.registry.length; i++) {
				var sheet = this.registry[i];
				if (attached != null && sheet.attached !== attached) continue;
				if (css) css += linebreak;
				css += sheet.toString(options);
			}
			return css;
		};
		_createClass(SheetsRegistry, [{
			key: "index",
			/**
			* Current highest index number.
			*/
			get: function get() {
				return this.registry.length === 0 ? 0 : this.registry[this.registry.length - 1].options.index;
			}
		}]);
		return SheetsRegistry;
	}();
	sheets = new SheetsRegistry();
	globalThis$1 = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" && window.Math === Math ? window : typeof self !== "undefined" && self.Math === Math ? self : Function("return this")();
	ns = "2f1acc6c3a606b082e5eef5e54414ffb";
	if (globalThis$1[ns] == null) globalThis$1[ns] = 0;
	moduleId = globalThis$1[ns]++;
	maxRules = 1e10;
	createGenerateId = function createGenerateId(options) {
		if (options === void 0) options = {};
		var ruleCounter = 0;
		return function generateId(rule, sheet) {
			ruleCounter += 1;
			if (ruleCounter > maxRules) warning(false, "[JSS] You might have a memory leak. Rule counter is at " + ruleCounter + ".");
			var jssId = "";
			var prefix = "";
			if (sheet) {
				if (sheet.options.classNamePrefix) prefix = sheet.options.classNamePrefix;
				if (sheet.options.jss.id != null) jssId = String(sheet.options.jss.id);
			}
			if (options.minify) return "" + (prefix || "c") + moduleId + jssId + ruleCounter;
			return prefix + rule.key + "-" + moduleId + (jssId ? "-" + jssId : "") + "-" + ruleCounter;
		};
	};
	memoize = function memoize(fn) {
		var value;
		return function() {
			if (!value) value = fn();
			return value;
		};
	};
	getPropertyValue = function getPropertyValue(cssRule, prop) {
		try {
			if (cssRule.attributeStyleMap) return cssRule.attributeStyleMap.get(prop);
			return cssRule.style.getPropertyValue(prop);
		} catch (err) {
			return "";
		}
	};
	setProperty = function setProperty(cssRule, prop, value) {
		try {
			var cssValue = value;
			if (Array.isArray(value)) cssValue = toCssValue(value);
			if (cssRule.attributeStyleMap) cssRule.attributeStyleMap.set(prop, cssValue);
			else {
				var indexOfImportantFlag = cssValue ? cssValue.indexOf("!important") : -1;
				var cssValueWithoutImportantFlag = indexOfImportantFlag > -1 ? cssValue.substr(0, indexOfImportantFlag - 1) : cssValue;
				cssRule.style.setProperty(prop, cssValueWithoutImportantFlag, indexOfImportantFlag > -1 ? "important" : "");
			}
		} catch (err) {
			return false;
		}
		return true;
	};
	removeProperty = function removeProperty(cssRule, prop) {
		try {
			if (cssRule.attributeStyleMap) cssRule.attributeStyleMap.delete(prop);
			else cssRule.style.removeProperty(prop);
		} catch (err) {
			warning(false, "[JSS] DOMException \"" + err.message + "\" was thrown. Tried to remove property \"" + prop + "\".");
		}
	};
	setSelector = function setSelector(cssRule, selectorText) {
		cssRule.selectorText = selectorText;
		return cssRule.selectorText === selectorText;
	};
	getHead = memoize(function() {
		return document.querySelector("head");
	});
	getNonce = memoize(function() {
		var node = document.querySelector("meta[property=\"csp-nonce\"]");
		return node ? node.getAttribute("content") : null;
	});
	_insertRule = function insertRule(container, rule, index) {
		try {
			if ("insertRule" in container) container.insertRule(rule, index);
			else if ("appendRule" in container) container.appendRule(rule);
		} catch (err) {
			warning(false, "[JSS] " + err.message);
			return false;
		}
		return container.cssRules[index];
	};
	getValidRuleInsertionIndex = function getValidRuleInsertionIndex(container, index) {
		var maxIndex = container.cssRules.length;
		if (index === void 0 || index > maxIndex) return maxIndex;
		return index;
	};
	createStyle = function createStyle() {
		var el = document.createElement("style");
		el.textContent = "\n";
		return el;
	};
	DomRenderer = /*#__PURE__*/ function() {
		function DomRenderer(sheet) {
			this.getPropertyValue = getPropertyValue;
			this.setProperty = setProperty;
			this.removeProperty = removeProperty;
			this.setSelector = setSelector;
			this.hasInsertedRules = false;
			this.cssRules = [];
			if (sheet) sheets.add(sheet);
			this.sheet = sheet;
			var _ref = this.sheet ? this.sheet.options : {}, media = _ref.media, meta = _ref.meta, element = _ref.element;
			this.element = element || createStyle();
			this.element.setAttribute("data-jss", "");
			if (media) this.element.setAttribute("media", media);
			if (meta) this.element.setAttribute("data-meta", meta);
			var nonce = getNonce();
			if (nonce) this.element.setAttribute("nonce", nonce);
		}
		/**
		* Insert style element into render tree.
		*/
		var _proto = DomRenderer.prototype;
		_proto.attach = function attach() {
			if (this.element.parentNode || !this.sheet) return;
			insertStyle(this.element, this.sheet.options);
			var deployed = Boolean(this.sheet && this.sheet.deployed);
			if (this.hasInsertedRules && deployed) {
				this.hasInsertedRules = false;
				this.deploy();
			}
		};
		_proto.detach = function detach() {
			if (!this.sheet) return;
			var parentNode = this.element.parentNode;
			if (parentNode) parentNode.removeChild(this.element);
			if (this.sheet.options.link) {
				this.cssRules = [];
				this.element.textContent = "\n";
			}
		};
		_proto.deploy = function deploy() {
			var sheet = this.sheet;
			if (!sheet) return;
			if (sheet.options.link) {
				this.insertRules(sheet.rules);
				return;
			}
			this.element.textContent = "\n" + sheet.toString() + "\n";
		};
		_proto.insertRules = function insertRules(rules, nativeParent) {
			for (var i = 0; i < rules.index.length; i++) this.insertRule(rules.index[i], i, nativeParent);
		};
		_proto.insertRule = function insertRule(rule, index, nativeParent) {
			if (nativeParent === void 0) nativeParent = this.element.sheet;
			if (rule.rules) {
				var parent = rule;
				var latestNativeParent = nativeParent;
				if (rule.type === "conditional" || rule.type === "keyframes") {
					var _insertionIndex = getValidRuleInsertionIndex(nativeParent, index);
					latestNativeParent = _insertRule(nativeParent, parent.toString({ children: false }), _insertionIndex);
					if (latestNativeParent === false) return false;
					this.refCssRule(rule, _insertionIndex, latestNativeParent);
				}
				this.insertRules(parent.rules, latestNativeParent);
				return latestNativeParent;
			}
			var ruleStr = rule.toString();
			if (!ruleStr) return false;
			var insertionIndex = getValidRuleInsertionIndex(nativeParent, index);
			var nativeRule = _insertRule(nativeParent, ruleStr, insertionIndex);
			if (nativeRule === false) return false;
			this.hasInsertedRules = true;
			this.refCssRule(rule, insertionIndex, nativeRule);
			return nativeRule;
		};
		_proto.refCssRule = function refCssRule(rule, index, cssRule) {
			rule.renderable = cssRule;
			if (rule.options.parent instanceof StyleSheet) this.cssRules.splice(index, 0, cssRule);
		};
		_proto.deleteRule = function deleteRule(cssRule) {
			var sheet = this.element.sheet;
			var index = this.indexOf(cssRule);
			if (index === -1) return false;
			sheet.deleteRule(index);
			this.cssRules.splice(index, 1);
			return true;
		};
		_proto.indexOf = function indexOf(cssRule) {
			return this.cssRules.indexOf(cssRule);
		};
		_proto.replaceRule = function replaceRule(cssRule, rule) {
			var index = this.indexOf(cssRule);
			if (index === -1) return false;
			this.element.sheet.deleteRule(index);
			this.cssRules.splice(index, 1);
			return this.insertRule(rule, index);
		};
		_proto.getRules = function getRules() {
			return this.element.sheet.cssRules;
		};
		return DomRenderer;
	}();
	instanceCounter = 0;
	Jss = /*#__PURE__*/ function() {
		function Jss(options) {
			this.id = instanceCounter++;
			this.version = "10.10.0";
			this.plugins = new PluginsRegistry();
			this.options = {
				id: { minify: false },
				createGenerateId,
				Renderer: isBrowser ? DomRenderer : null,
				plugins: []
			};
			this.generateId = createGenerateId({ minify: false });
			for (var i = 0; i < plugins$1.length; i++) this.plugins.use(plugins$1[i], { queue: "internal" });
			this.setup(options);
		}
		/**
		* Prepares various options, applies plugins.
		* Should not be used twice on the same instance, because there is no plugins
		* deduplication logic.
		*/
		var _proto = Jss.prototype;
		_proto.setup = function setup(options) {
			if (options === void 0) options = {};
			if (options.createGenerateId) this.options.createGenerateId = options.createGenerateId;
			if (options.id) this.options.id = _extends({}, this.options.id, options.id);
			if (options.createGenerateId || options.id) this.generateId = this.options.createGenerateId(this.options.id);
			if (options.insertionPoint != null) this.options.insertionPoint = options.insertionPoint;
			if ("Renderer" in options) this.options.Renderer = options.Renderer;
			if (options.plugins) this.use.apply(this, options.plugins);
			return this;
		};
		_proto.createStyleSheet = function createStyleSheet(styles, options) {
			if (options === void 0) options = {};
			var index = options.index;
			if (typeof index !== "number") index = sheets.index === 0 ? 0 : sheets.index + 1;
			var sheet = new StyleSheet(styles, _extends({}, options, {
				jss: this,
				generateId: options.generateId || this.generateId,
				insertionPoint: this.options.insertionPoint,
				Renderer: this.options.Renderer,
				index
			}));
			this.plugins.onProcessSheet(sheet);
			return sheet;
		};
		_proto.removeStyleSheet = function removeStyleSheet(sheet) {
			sheet.detach();
			sheets.remove(sheet);
			return this;
		};
		_proto.createRule = function createRule$1(name, style, options) {
			if (style === void 0) style = {};
			if (options === void 0) options = {};
			if (typeof name === "object") return this.createRule(void 0, name, style);
			var ruleOptions = _extends({}, options, {
				name,
				jss: this,
				Renderer: this.options.Renderer
			});
			if (!ruleOptions.generateId) ruleOptions.generateId = this.generateId;
			if (!ruleOptions.classes) ruleOptions.classes = {};
			if (!ruleOptions.keyframes) ruleOptions.keyframes = {};
			var rule = createRule(name, style, ruleOptions);
			if (rule) this.plugins.onProcessRule(rule);
			return rule;
		};
		_proto.use = function use() {
			var _this = this;
			for (var _len = arguments.length, plugins = new Array(_len), _key = 0; _key < _len; _key++) plugins[_key] = arguments[_key];
			plugins.forEach(function(plugin) {
				_this.plugins.use(plugin);
			});
			return this;
		};
		return Jss;
	}();
	createJss = function createJss(options) {
		return new Jss(options);
	};
	hasCSSTOMSupport = typeof CSS === "object" && CSS != null && "number" in CSS;
	createJss();
}));
/**
* A better abstraction over CSS.
*
* @copyright Oleg Isonen (Slobodskoi) / Isonen 2014-present
* @website https://github.com/cssinjs/jss
* @license MIT
*/
//#endregion
//#region node_modules/jss-plugin-rule-value-function/dist/jss-plugin-rule-value-function.esm.js
var now, fnValuesNs, fnRuleNs, functionPlugin;
var init_jss_plugin_rule_value_function_esm = __esmMin((() => {
	init_tiny_warning_esm();
	init_jss_esm();
	now = Date.now();
	fnValuesNs = "fnValues" + now;
	fnRuleNs = "fnStyle" + ++now;
	functionPlugin = function functionPlugin() {
		return {
			onCreateRule: function onCreateRule(name, decl, options) {
				if (typeof decl !== "function") return null;
				var rule = createRule(name, {}, options);
				rule[fnRuleNs] = decl;
				return rule;
			},
			onProcessStyle: function onProcessStyle(style, rule) {
				if (fnValuesNs in rule || fnRuleNs in rule) return style;
				var fnValues = {};
				for (var prop in style) {
					var value = style[prop];
					if (typeof value !== "function") continue;
					delete style[prop];
					fnValues[prop] = value;
				}
				rule[fnValuesNs] = fnValues;
				return style;
			},
			onUpdate: function onUpdate(data, rule, sheet, options) {
				var styleRule = rule;
				var fnRule = styleRule[fnRuleNs];
				if (fnRule) {
					styleRule.style = fnRule(data) || {};
					for (var prop in styleRule.style) if (typeof styleRule.style[prop] === "function") {
						warning(false, "[JSS] Function values inside function rules are not supported.");
						break;
					}
				}
				var fnValues = styleRule[fnValuesNs];
				if (fnValues) for (var _prop in fnValues) styleRule.prop(_prop, fnValues[_prop](data), options);
			}
		};
	};
}));
//#endregion
//#region node_modules/jss-plugin-global/dist/jss-plugin-global.esm.js
function addScope(selector, scope) {
	var parts = selector.split(separatorRegExp$1);
	var scoped = "";
	for (var i = 0; i < parts.length; i++) {
		scoped += scope + " " + parts[i].trim();
		if (parts[i + 1]) scoped += ", ";
	}
	return scoped;
}
function handleNestedGlobalContainerRule(rule, sheet) {
	var options = rule.options, style = rule.style;
	var rules = style ? style[at] : null;
	if (!rules) return;
	for (var name in rules) sheet.addRule(name, rules[name], _extends({}, options, { selector: addScope(name, rule.selector) }));
	delete style[at];
}
function handlePrefixedGlobalRule(rule, sheet) {
	var options = rule.options, style = rule.style;
	for (var prop in style) {
		if (prop[0] !== "@" || prop.substr(0, at.length) !== at) continue;
		var selector = addScope(prop.substr(at.length), rule.selector);
		sheet.addRule(selector, style[prop], _extends({}, options, { selector }));
		delete style[prop];
	}
}
/**
* Convert nested rules to separate, remove them from original styles.
*/
function jssGlobal() {
	function onCreateRule(name, styles, options) {
		if (!name) return null;
		if (name === at) return new GlobalContainerRule(name, styles, options);
		if (name[0] === "@" && name.substr(0, atPrefix.length) === atPrefix) return new GlobalPrefixedRule(name, styles, options);
		var parent = options.parent;
		if (parent) {
			if (parent.type === "global" || parent.options.parent && parent.options.parent.type === "global") options.scoped = false;
		}
		if (!options.selector && options.scoped === false) options.selector = name;
		return null;
	}
	function onProcessRule(rule, sheet) {
		if (rule.type !== "style" || !sheet) return;
		handleNestedGlobalContainerRule(rule, sheet);
		handlePrefixedGlobalRule(rule, sheet);
	}
	return {
		onCreateRule,
		onProcessRule
	};
}
var at, atPrefix, GlobalContainerRule, GlobalPrefixedRule, separatorRegExp$1;
var init_jss_plugin_global_esm = __esmMin((() => {
	init_extends();
	init_jss_esm();
	at = "@global";
	atPrefix = "@global ";
	GlobalContainerRule = /*#__PURE__*/ function() {
		function GlobalContainerRule(key, styles, options) {
			this.type = "global";
			this.at = at;
			this.isProcessed = false;
			this.key = key;
			this.options = options;
			this.rules = new RuleList(_extends({}, options, { parent: this }));
			for (var selector in styles) this.rules.add(selector, styles[selector]);
			this.rules.process();
		}
		/**
		* Get a rule.
		*/
		var _proto = GlobalContainerRule.prototype;
		_proto.getRule = function getRule(name) {
			return this.rules.get(name);
		};
		_proto.addRule = function addRule(name, style, options) {
			var rule = this.rules.add(name, style, options);
			if (rule) this.options.jss.plugins.onProcessRule(rule);
			return rule;
		};
		_proto.replaceRule = function replaceRule(name, style, options) {
			var newRule = this.rules.replace(name, style, options);
			if (newRule) this.options.jss.plugins.onProcessRule(newRule);
			return newRule;
		};
		_proto.indexOf = function indexOf(rule) {
			return this.rules.indexOf(rule);
		};
		_proto.toString = function toString(options) {
			return this.rules.toString(options);
		};
		return GlobalContainerRule;
	}();
	GlobalPrefixedRule = /*#__PURE__*/ function() {
		function GlobalPrefixedRule(key, style, options) {
			this.type = "global";
			this.at = at;
			this.isProcessed = false;
			this.key = key;
			this.options = options;
			var selector = key.substr(atPrefix.length);
			this.rule = options.jss.createRule(selector, style, _extends({}, options, { parent: this }));
		}
		var _proto2 = GlobalPrefixedRule.prototype;
		_proto2.toString = function toString(options) {
			return this.rule ? this.rule.toString(options) : "";
		};
		return GlobalPrefixedRule;
	}();
	separatorRegExp$1 = /\s*,\s*/g;
}));
//#endregion
//#region node_modules/jss-plugin-nested/dist/jss-plugin-nested.esm.js
/**
* Convert nested rules to separate, remove them from original styles.
*/
function jssNested() {
	function getReplaceRef(container, sheet) {
		return function(match, key) {
			var rule = container.getRule(key) || sheet && sheet.getRule(key);
			if (rule) return rule.selector;
			warning(false, "[JSS] Could not find the referenced rule \"" + key + "\" in \"" + (container.options.meta || container.toString()) + "\".");
			return key;
		};
	}
	function replaceParentRefs(nestedProp, parentProp) {
		var parentSelectors = parentProp.split(separatorRegExp);
		var nestedSelectors = nestedProp.split(separatorRegExp);
		var result = "";
		for (var i = 0; i < parentSelectors.length; i++) {
			var parent = parentSelectors[i];
			for (var j = 0; j < nestedSelectors.length; j++) {
				var nested = nestedSelectors[j];
				if (result) result += ", ";
				result += nested.indexOf("&") !== -1 ? nested.replace(parentRegExp, parent) : parent + " " + nested;
			}
		}
		return result;
	}
	function getOptions(rule, container, prevOptions) {
		if (prevOptions) return _extends({}, prevOptions, { index: prevOptions.index + 1 });
		var nestingLevel = rule.options.nestingLevel;
		nestingLevel = nestingLevel === void 0 ? 1 : nestingLevel + 1;
		var options = _extends({}, rule.options, {
			nestingLevel,
			index: container.indexOf(rule) + 1
		});
		delete options.name;
		return options;
	}
	function onProcessStyle(style, rule, sheet) {
		if (rule.type !== "style") return style;
		var styleRule = rule;
		var container = styleRule.options.parent;
		var options;
		var replaceRef;
		for (var prop in style) {
			var isNested = prop.indexOf("&") !== -1;
			var isNestedConditional = prop[0] === "@";
			if (!isNested && !isNestedConditional) continue;
			options = getOptions(styleRule, container, options);
			if (isNested) {
				var selector = replaceParentRefs(prop, styleRule.selector);
				if (!replaceRef) replaceRef = getReplaceRef(container, sheet);
				selector = selector.replace(refRegExp, replaceRef);
				var name = styleRule.key + "-" + prop;
				if ("replaceRule" in container) container.replaceRule(name, style[prop], _extends({}, options, { selector }));
				else container.addRule(name, style[prop], _extends({}, options, { selector }));
			} else if (isNestedConditional) container.addRule(prop, {}, options).addRule(styleRule.key, style[prop], { selector: styleRule.selector });
			delete style[prop];
		}
		return style;
	}
	return { onProcessStyle };
}
var separatorRegExp, parentRegExp, refRegExp;
var init_jss_plugin_nested_esm = __esmMin((() => {
	init_extends();
	init_tiny_warning_esm();
	separatorRegExp = /\s*,\s*/g;
	parentRegExp = /&/g;
	refRegExp = /\$([\w-]+)/g;
}));
//#endregion
//#region node_modules/hyphenate-style-name/index.js
function toHyphenLower(match) {
	return "-" + match.toLowerCase();
}
function hyphenateStyleName(name) {
	if (cache$2.hasOwnProperty(name)) return cache$2[name];
	var hName = name.replace(uppercasePattern, toHyphenLower);
	return cache$2[name] = msPattern.test(hName) ? "-" + hName : hName;
}
var uppercasePattern, msPattern, cache$2;
var init_hyphenate_style_name = __esmMin((() => {
	uppercasePattern = /[A-Z]/g;
	msPattern = /^ms-/;
	cache$2 = {};
}));
//#endregion
//#region node_modules/jss-plugin-camel-case/dist/jss-plugin-camel-case.esm.js
/**
* Convert camel cased property names to dash separated.
*/
function convertCase(style) {
	var converted = {};
	for (var prop in style) {
		var key = prop.indexOf("--") === 0 ? prop : hyphenateStyleName(prop);
		converted[key] = style[prop];
	}
	if (style.fallbacks) if (Array.isArray(style.fallbacks)) converted.fallbacks = style.fallbacks.map(convertCase);
	else converted.fallbacks = convertCase(style.fallbacks);
	return converted;
}
/**
* Allow camel cased property names by converting them back to dasherized.
*/
function camelCase() {
	function onProcessStyle(style) {
		if (Array.isArray(style)) {
			for (var index = 0; index < style.length; index++) style[index] = convertCase(style[index]);
			return style;
		}
		return convertCase(style);
	}
	function onChangeValue(value, prop, rule) {
		if (prop.indexOf("--") === 0) return value;
		var hyphenatedProp = hyphenateStyleName(prop);
		if (prop === hyphenatedProp) return value;
		rule.prop(hyphenatedProp, value);
		return null;
	}
	return {
		onProcessStyle,
		onChangeValue
	};
}
var init_jss_plugin_camel_case_esm = __esmMin((() => {
	init_hyphenate_style_name();
}));
//#endregion
//#region node_modules/jss-plugin-default-unit/dist/jss-plugin-default-unit.esm.js
/**
* Clones the object and adds a camel cased property version.
*/
function addCamelCasedVersion(obj) {
	var regExp = /(-[a-z])/g;
	var replace = function replace(str) {
		return str[1].toUpperCase();
	};
	var newObj = {};
	for (var key in obj) {
		newObj[key] = obj[key];
		newObj[key.replace(regExp, replace)] = obj[key];
	}
	return newObj;
}
/**
* Recursive deep style passing function
*/
function iterate(prop, value, options) {
	if (value == null) return value;
	if (Array.isArray(value)) for (var i = 0; i < value.length; i++) value[i] = iterate(prop, value[i], options);
	else if (typeof value === "object") if (prop === "fallbacks") for (var innerProp in value) value[innerProp] = iterate(innerProp, value[innerProp], options);
	else for (var _innerProp in value) value[_innerProp] = iterate(prop + "-" + _innerProp, value[_innerProp], options);
	else if (typeof value === "number" && isNaN(value) === false) {
		var unit = options[prop] || units[prop];
		if (unit && !(value === 0 && unit === px)) return typeof unit === "function" ? unit(value).toString() : "" + value + unit;
		return value.toString();
	}
	return value;
}
/**
* Add unit to numeric values.
*/
function defaultUnit(options) {
	if (options === void 0) options = {};
	var camelCasedOptions = addCamelCasedVersion(options);
	function onProcessStyle(style, rule) {
		if (rule.type !== "style") return style;
		for (var prop in style) style[prop] = iterate(prop, style[prop], camelCasedOptions);
		return style;
	}
	function onChangeValue(value, prop) {
		return iterate(prop, value, camelCasedOptions);
	}
	return {
		onProcessStyle,
		onChangeValue
	};
}
var px, ms, percent, defaultUnits, units;
var init_jss_plugin_default_unit_esm = __esmMin((() => {
	init_jss_esm();
	px = hasCSSTOMSupport && CSS ? CSS.px : "px";
	ms = hasCSSTOMSupport && CSS ? CSS.ms : "ms";
	percent = hasCSSTOMSupport && CSS ? CSS.percent : "%";
	defaultUnits = {
		"animation-delay": ms,
		"animation-duration": ms,
		"background-position": px,
		"background-position-x": px,
		"background-position-y": px,
		"background-size": px,
		border: px,
		"border-bottom": px,
		"border-bottom-left-radius": px,
		"border-bottom-right-radius": px,
		"border-bottom-width": px,
		"border-left": px,
		"border-left-width": px,
		"border-radius": px,
		"border-right": px,
		"border-right-width": px,
		"border-top": px,
		"border-top-left-radius": px,
		"border-top-right-radius": px,
		"border-top-width": px,
		"border-width": px,
		"border-block": px,
		"border-block-end": px,
		"border-block-end-width": px,
		"border-block-start": px,
		"border-block-start-width": px,
		"border-block-width": px,
		"border-inline": px,
		"border-inline-end": px,
		"border-inline-end-width": px,
		"border-inline-start": px,
		"border-inline-start-width": px,
		"border-inline-width": px,
		"border-start-start-radius": px,
		"border-start-end-radius": px,
		"border-end-start-radius": px,
		"border-end-end-radius": px,
		margin: px,
		"margin-bottom": px,
		"margin-left": px,
		"margin-right": px,
		"margin-top": px,
		"margin-block": px,
		"margin-block-end": px,
		"margin-block-start": px,
		"margin-inline": px,
		"margin-inline-end": px,
		"margin-inline-start": px,
		padding: px,
		"padding-bottom": px,
		"padding-left": px,
		"padding-right": px,
		"padding-top": px,
		"padding-block": px,
		"padding-block-end": px,
		"padding-block-start": px,
		"padding-inline": px,
		"padding-inline-end": px,
		"padding-inline-start": px,
		"mask-position-x": px,
		"mask-position-y": px,
		"mask-size": px,
		height: px,
		width: px,
		"min-height": px,
		"max-height": px,
		"min-width": px,
		"max-width": px,
		bottom: px,
		left: px,
		top: px,
		right: px,
		inset: px,
		"inset-block": px,
		"inset-block-end": px,
		"inset-block-start": px,
		"inset-inline": px,
		"inset-inline-end": px,
		"inset-inline-start": px,
		"box-shadow": px,
		"text-shadow": px,
		"column-gap": px,
		"column-rule": px,
		"column-rule-width": px,
		"column-width": px,
		"font-size": px,
		"font-size-delta": px,
		"letter-spacing": px,
		"text-decoration-thickness": px,
		"text-indent": px,
		"text-stroke": px,
		"text-stroke-width": px,
		"word-spacing": px,
		motion: px,
		"motion-offset": px,
		outline: px,
		"outline-offset": px,
		"outline-width": px,
		perspective: px,
		"perspective-origin-x": percent,
		"perspective-origin-y": percent,
		"transform-origin": percent,
		"transform-origin-x": percent,
		"transform-origin-y": percent,
		"transform-origin-z": percent,
		"transition-delay": ms,
		"transition-duration": ms,
		"vertical-align": px,
		"flex-basis": px,
		"shape-margin": px,
		size: px,
		gap: px,
		grid: px,
		"grid-gap": px,
		"row-gap": px,
		"grid-row-gap": px,
		"grid-column-gap": px,
		"grid-template-rows": px,
		"grid-template-columns": px,
		"grid-auto-rows": px,
		"grid-auto-columns": px,
		"box-shadow-x": px,
		"box-shadow-y": px,
		"box-shadow-blur": px,
		"box-shadow-spread": px,
		"font-line-height": px,
		"text-shadow-x": px,
		"text-shadow-y": px,
		"text-shadow-blur": px
	};
	units = addCamelCasedVersion(defaultUnits);
}));
//#endregion
//#region node_modules/css-vendor/dist/css-vendor.esm.js
/**
* Test if a keyframe at-rule should be prefixed or not
*
* @param {String} vendor prefix string for the current browser.
* @return {String}
* @api public
*/
function supportedKeyframes(key) {
	if (key[1] === "-") return key;
	if (prefix.js === "ms") return key;
	return "@" + prefix.css + "keyframes" + key.substr(10);
}
/**
* Replaces the letter with the capital letter
*
* @param {String} match
* @param {String} c
* @return {String}
* @api private
*/
function toUpper(match, c) {
	return c ? c.toUpperCase() : "";
}
/**
* Convert dash separated strings to camel-cased.
*
* @param {String} str
* @return {String}
* @api private
*/
function camelize(str) {
	return str.replace(regExp, toUpper);
}
/**
* Convert dash separated strings to pascal cased.
*
* @param {String} str
* @return {String}
* @api private
*/
function pascalize(str) {
	return camelize("-" + str);
}
/**
* Test if a property is supported, returns supported property with vendor
* prefix if required. Returns `false` if not supported.
*
* @param {String} prop dash separated
* @param {Object} [options]
* @return {String|Boolean}
* @api public
*/
function supportedProperty(prop, options) {
	if (options === void 0) options = {};
	if (!el) return prop;
	if (cache[prop] != null) return cache[prop];
	if (prop === "transition" || prop === "transform") options[prop] = prop in el.style;
	for (var i = 0; i < propertyDetectors.length; i++) {
		cache[prop] = propertyDetectors[i](prop, el.style, options);
		if (cache[prop]) break;
	}
	try {
		el.style[prop] = "";
	} catch (err) {
		return false;
	}
	return cache[prop];
}
/**
* Returns prefixed value transition/transform if needed.
*
* @param {String} match
* @param {String} p1
* @param {String} p2
* @return {String}
* @api private
*/
function prefixTransitionCallback(match, p1, p2) {
	if (p1 === "var") return "var";
	if (p1 === "all") return "all";
	if (p2 === "all") return ", all";
	var prefixedValue = p1 ? supportedProperty(p1) : ", " + supportedProperty(p2);
	if (!prefixedValue) return p1 || p2;
	return prefixedValue;
}
/**
* Returns prefixed value if needed. Returns `false` if value is not supported.
*
* @param {String} property
* @param {String} value
* @return {String|Boolean}
* @api public
*/
function supportedValue(property, value) {
	var prefixedValue = value;
	if (!el$1 || property === "content") return value;
	if (typeof prefixedValue !== "string" || !isNaN(parseInt(prefixedValue, 10))) return prefixedValue;
	var cacheKey = property + prefixedValue;
	if (cache$1[cacheKey] != null) return cache$1[cacheKey];
	try {
		el$1.style[property] = prefixedValue;
	} catch (err) {
		cache$1[cacheKey] = false;
		return false;
	}
	if (transitionProperties[property]) prefixedValue = prefixedValue.replace(transPropsRegExp, prefixTransitionCallback);
	else if (el$1.style[property] === "") {
		prefixedValue = prefix.css + prefixedValue;
		if (prefixedValue === "-ms-flex") el$1.style[property] = "-ms-flexbox";
		el$1.style[property] = prefixedValue;
		if (el$1.style[property] === "") {
			cache$1[cacheKey] = false;
			return false;
		}
	}
	el$1.style[property] = "";
	cache$1[cacheKey] = prefixedValue;
	return cache$1[cacheKey];
}
var js, css, vendor, browser, isTouch, jsCssMap, style, testProp, prefix, appearence, colorAdjust, regExp, mask, textOrientation, transform, transition, writingMode, userSelect, breakPropsOld, inlineLogicalOld, unprefixed, prefixed, scrollSnap, overscrollBehavior, propMap, flex2012, propMap$1, propKeys, prefixCss, plugins, propertyDetectors, noPrefill, el, cache, computed, cache$1, transitionProperties, transPropsRegExp, el$1;
var init_css_vendor_esm = __esmMin((() => {
	init_module();
	init_toConsumableArray();
	js = "";
	css = "";
	vendor = "";
	browser = "";
	isTouch = isBrowser && "ontouchstart" in document.documentElement;
	if (isBrowser) {
		jsCssMap = {
			Moz: "-moz-",
			ms: "-ms-",
			O: "-o-",
			Webkit: "-webkit-"
		};
		style = document.createElement("p").style;
		testProp = "Transform";
		for (var key in jsCssMap) if (key + testProp in style) {
			js = key;
			css = jsCssMap[key];
			break;
		}
		if (js === "Webkit" && "msHyphens" in style) {
			js = "ms";
			css = jsCssMap.ms;
			browser = "edge";
		}
		if (js === "Webkit" && "-apple-trailing-word" in style) vendor = "apple";
	}
	prefix = {
		js,
		css,
		vendor,
		browser,
		isTouch
	};
	appearence = {
		noPrefill: ["appearance"],
		supportedProperty: function supportedProperty(prop) {
			if (prop !== "appearance") return false;
			if (prefix.js === "ms") return "-webkit-" + prop;
			return prefix.css + prop;
		}
	};
	colorAdjust = {
		noPrefill: ["color-adjust"],
		supportedProperty: function supportedProperty(prop) {
			if (prop !== "color-adjust") return false;
			if (prefix.js === "Webkit") return prefix.css + "print-" + prop;
			return prop;
		}
	};
	regExp = /[-\s]+(.)?/g;
	mask = {
		noPrefill: ["mask"],
		supportedProperty: function supportedProperty(prop, style) {
			if (!/^mask/.test(prop)) return false;
			if (prefix.js === "Webkit") {
				var longhand = "mask-image";
				if (camelize(longhand) in style) return prop;
				if (prefix.js + pascalize(longhand) in style) return prefix.css + prop;
			}
			return prop;
		}
	};
	textOrientation = {
		noPrefill: ["text-orientation"],
		supportedProperty: function supportedProperty(prop) {
			if (prop !== "text-orientation") return false;
			if (prefix.vendor === "apple" && !prefix.isTouch) return prefix.css + prop;
			return prop;
		}
	};
	transform = {
		noPrefill: ["transform"],
		supportedProperty: function supportedProperty(prop, style, options) {
			if (prop !== "transform") return false;
			if (options.transform) return prop;
			return prefix.css + prop;
		}
	};
	transition = {
		noPrefill: ["transition"],
		supportedProperty: function supportedProperty(prop, style, options) {
			if (prop !== "transition") return false;
			if (options.transition) return prop;
			return prefix.css + prop;
		}
	};
	writingMode = {
		noPrefill: ["writing-mode"],
		supportedProperty: function supportedProperty(prop) {
			if (prop !== "writing-mode") return false;
			if (prefix.js === "Webkit" || prefix.js === "ms" && prefix.browser !== "edge") return prefix.css + prop;
			return prop;
		}
	};
	userSelect = {
		noPrefill: ["user-select"],
		supportedProperty: function supportedProperty(prop) {
			if (prop !== "user-select") return false;
			if (prefix.js === "Moz" || prefix.js === "ms" || prefix.vendor === "apple") return prefix.css + prop;
			return prop;
		}
	};
	breakPropsOld = { supportedProperty: function supportedProperty(prop, style) {
		if (!/^break-/.test(prop)) return false;
		if (prefix.js === "Webkit") return "WebkitColumn" + pascalize(prop) in style ? prefix.css + "column-" + prop : false;
		if (prefix.js === "Moz") return "page" + pascalize(prop) in style ? "page-" + prop : false;
		return false;
	} };
	inlineLogicalOld = { supportedProperty: function supportedProperty(prop, style) {
		if (!/^(border|margin|padding)-inline/.test(prop)) return false;
		if (prefix.js === "Moz") return prop;
		var newProp = prop.replace("-inline", "");
		return prefix.js + pascalize(newProp) in style ? prefix.css + newProp : false;
	} };
	unprefixed = { supportedProperty: function supportedProperty(prop, style) {
		return camelize(prop) in style ? prop : false;
	} };
	prefixed = { supportedProperty: function supportedProperty(prop, style) {
		var pascalized = pascalize(prop);
		if (prop[0] === "-") return prop;
		if (prop[0] === "-" && prop[1] === "-") return prop;
		if (prefix.js + pascalized in style) return prefix.css + prop;
		if (prefix.js !== "Webkit" && "Webkit" + pascalized in style) return "-webkit-" + prop;
		return false;
	} };
	scrollSnap = { supportedProperty: function supportedProperty(prop) {
		if (prop.substring(0, 11) !== "scroll-snap") return false;
		if (prefix.js === "ms") return "" + prefix.css + prop;
		return prop;
	} };
	overscrollBehavior = { supportedProperty: function supportedProperty(prop) {
		if (prop !== "overscroll-behavior") return false;
		if (prefix.js === "ms") return prefix.css + "scroll-chaining";
		return prop;
	} };
	propMap = {
		"flex-grow": "flex-positive",
		"flex-shrink": "flex-negative",
		"flex-basis": "flex-preferred-size",
		"justify-content": "flex-pack",
		order: "flex-order",
		"align-items": "flex-align",
		"align-content": "flex-line-pack"
	};
	flex2012 = { supportedProperty: function supportedProperty(prop, style) {
		var newProp = propMap[prop];
		if (!newProp) return false;
		return prefix.js + pascalize(newProp) in style ? prefix.css + newProp : false;
	} };
	propMap$1 = {
		flex: "box-flex",
		"flex-grow": "box-flex",
		"flex-direction": ["box-orient", "box-direction"],
		order: "box-ordinal-group",
		"align-items": "box-align",
		"flex-flow": ["box-orient", "box-direction"],
		"justify-content": "box-pack"
	};
	propKeys = Object.keys(propMap$1);
	prefixCss = function prefixCss(p) {
		return prefix.css + p;
	};
	plugins = [
		appearence,
		colorAdjust,
		mask,
		textOrientation,
		transform,
		transition,
		writingMode,
		userSelect,
		breakPropsOld,
		inlineLogicalOld,
		unprefixed,
		prefixed,
		scrollSnap,
		overscrollBehavior,
		flex2012,
		{ supportedProperty: function supportedProperty(prop, style, _ref) {
			var multiple = _ref.multiple;
			if (propKeys.indexOf(prop) > -1) {
				var newProp = propMap$1[prop];
				if (!Array.isArray(newProp)) return prefix.js + pascalize(newProp) in style ? prefix.css + newProp : false;
				if (!multiple) return false;
				for (var i = 0; i < newProp.length; i++) if (!(prefix.js + pascalize(newProp[0]) in style)) return false;
				return newProp.map(prefixCss);
			}
			return false;
		} }
	];
	propertyDetectors = plugins.filter(function(p) {
		return p.supportedProperty;
	}).map(function(p) {
		return p.supportedProperty;
	});
	noPrefill = plugins.filter(function(p) {
		return p.noPrefill;
	}).reduce(function(a, p) {
		a.push.apply(a, _toConsumableArray(p.noPrefill));
		return a;
	}, []);
	cache = {};
	if (isBrowser) {
		el = document.createElement("p");
		computed = window.getComputedStyle(document.documentElement, "");
		for (var key$1 in computed) if (!isNaN(key$1)) cache[computed[key$1]] = computed[key$1];
		noPrefill.forEach(function(x) {
			return delete cache[x];
		});
	}
	cache$1 = {};
	transitionProperties = {
		transition: 1,
		"transition-property": 1,
		"-webkit-transition": 1,
		"-webkit-transition-property": 1
	};
	transPropsRegExp = /(^\s*[\w-]+)|, (\s*[\w-]+)(?![^()]*\))/g;
	if (isBrowser) el$1 = document.createElement("p");
}));
//#endregion
//#region node_modules/jss-plugin-vendor-prefixer/dist/jss-plugin-vendor-prefixer.esm.js
/**
* Add vendor prefix to a property name when needed.
*/
function jssVendorPrefixer() {
	function onProcessRule(rule) {
		if (rule.type === "keyframes") {
			var atRule = rule;
			atRule.at = supportedKeyframes(atRule.at);
		}
	}
	function prefixStyle(style) {
		for (var prop in style) {
			var value = style[prop];
			if (prop === "fallbacks" && Array.isArray(value)) {
				style[prop] = value.map(prefixStyle);
				continue;
			}
			var changeProp = false;
			var supportedProp = supportedProperty(prop);
			if (supportedProp && supportedProp !== prop) changeProp = true;
			var changeValue = false;
			var supportedValue$1 = supportedValue(supportedProp, toCssValue(value));
			if (supportedValue$1 && supportedValue$1 !== value) changeValue = true;
			if (changeProp || changeValue) {
				if (changeProp) delete style[prop];
				style[supportedProp || prop] = supportedValue$1 || value;
			}
		}
		return style;
	}
	function onProcessStyle(style, rule) {
		if (rule.type !== "style") return style;
		return prefixStyle(style);
	}
	function onChangeValue(value, prop) {
		return supportedValue(prop, toCssValue(value)) || value;
	}
	return {
		onProcessRule,
		onProcessStyle,
		onChangeValue
	};
}
var init_jss_plugin_vendor_prefixer_esm = __esmMin((() => {
	init_css_vendor_esm();
	init_jss_esm();
}));
//#endregion
//#region node_modules/jss-plugin-props-sort/dist/jss-plugin-props-sort.esm.js
/**
* Sort props by length.
*/
function jssPropsSort() {
	var sort = function sort(prop0, prop1) {
		if (prop0.length === prop1.length) return prop0 > prop1 ? 1 : -1;
		return prop0.length - prop1.length;
	};
	return { onProcessStyle: function onProcessStyle(style, rule) {
		if (rule.type !== "style") return style;
		var newStyle = {};
		var props = Object.keys(style).sort(sort);
		for (var i = 0; i < props.length; i++) newStyle[props[i]] = style[props[i]];
		return newStyle;
	} };
}
var init_jss_plugin_props_sort_esm = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/styles/esm/jssPreset/jssPreset.js
function jssPreset() {
	return { plugins: [
		functionPlugin(),
		jssGlobal(),
		jssNested(),
		camelCase(),
		defaultUnit(),
		typeof window === "undefined" ? null : jssVendorPrefixer(),
		jssPropsSort()
	] };
}
var init_jssPreset$1 = __esmMin((() => {
	init_jss_plugin_rule_value_function_esm();
	init_jss_plugin_global_esm();
	init_jss_plugin_nested_esm();
	init_jss_plugin_camel_case_esm();
	init_jss_plugin_default_unit_esm();
	init_jss_plugin_vendor_prefixer_esm();
	init_jss_plugin_props_sort_esm();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/jssPreset/index.js
var init_jssPreset = __esmMin((() => {
	init_jssPreset$1();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/mergeClasses/mergeClasses.js
function mergeClasses() {
	var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
	var baseClasses = options.baseClasses, newClasses = options.newClasses, Component = options.Component;
	if (!newClasses) return baseClasses;
	var nextClasses = _extends({}, baseClasses);
	if (typeof newClasses === "string") {
		console.error(["Material-UI: The value `".concat(newClasses, "` ") + "provided to the classes prop of ".concat(getDisplayName(Component), " is incorrect."), "You might want to use the className prop instead."].join("\n"));
		return baseClasses;
	}
	Object.keys(newClasses).forEach(function(key) {
		if (!baseClasses[key] && newClasses[key]) console.error(["Material-UI: The key `".concat(key, "` ") + "provided to the classes prop is not implemented in ".concat(getDisplayName(Component), "."), "You can only override one of the following: ".concat(Object.keys(baseClasses).join(","), ".")].join("\n"));
		if (newClasses[key] && typeof newClasses[key] !== "string") console.error(["Material-UI: The key `".concat(key, "` ") + "provided to the classes prop is not valid for ".concat(getDisplayName(Component), "."), "You need to provide a non empty string instead of: ".concat(newClasses[key], ".")].join("\n"));
		if (newClasses[key]) nextClasses[key] = "".concat(baseClasses[key], " ").concat(newClasses[key]);
	});
	return nextClasses;
}
var init_mergeClasses$1 = __esmMin((() => {
	init_extends();
	init_esm$2();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/mergeClasses/index.js
var init_mergeClasses = __esmMin((() => {
	init_mergeClasses$1();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/makeStyles/multiKeyStore.js
var multiKeyStore;
var init_multiKeyStore = __esmMin((() => {
	multiKeyStore = {
		set: function set(cache, key1, key2, value) {
			var subCache = cache.get(key1);
			if (!subCache) {
				subCache = /* @__PURE__ */ new Map();
				cache.set(key1, subCache);
			}
			subCache.set(key2, value);
		},
		get: function get(cache, key1, key2) {
			var subCache = cache.get(key1);
			return subCache ? subCache.get(key2) : void 0;
		},
		delete: function _delete(cache, key1, key2) {
			cache.get(key1).delete(key2);
		}
	};
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/useTheme/ThemeContext.js
var import_react$14, ThemeContext;
var init_ThemeContext = __esmMin((() => {
	import_react$14 = /* @__PURE__ */ __toESM(require_react());
	ThemeContext = import_react$14.createContext(null);
	ThemeContext.displayName = "ThemeContext";
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/useTheme/useTheme.js
function useTheme() {
	var theme = import_react$13.useContext(ThemeContext);
	import_react$13.useDebugValue(theme);
	return theme;
}
var import_react$13;
var init_useTheme$1 = __esmMin((() => {
	import_react$13 = /* @__PURE__ */ __toESM(require_react());
	init_ThemeContext();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/useTheme/index.js
var init_useTheme = __esmMin((() => {
	init_useTheme$1();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/StylesProvider/StylesProvider.js
function StylesProvider(props) {
	var children = props.children, _props$injectFirst = props.injectFirst, injectFirst = _props$injectFirst === void 0 ? false : _props$injectFirst, _props$disableGenerat = props.disableGeneration, disableGeneration = _props$disableGenerat === void 0 ? false : _props$disableGenerat, localOptions = _objectWithoutProperties(props, [
		"children",
		"injectFirst",
		"disableGeneration"
	]);
	var context = _extends({}, import_react$12.useContext(StylesContext), { disableGeneration }, localOptions);
	if (typeof window === "undefined" && !context.sheetsManager) console.error("Material-UI: You need to use the ServerStyleSheets API when rendering on the server.");
	if (context.jss.options.insertionPoint && injectFirst) console.error("Material-UI: You cannot use a custom insertionPoint and <StylesContext injectFirst> at the same time.");
	if (injectFirst && localOptions.jss) console.error("Material-UI: You cannot use the jss and injectFirst props at the same time.");
	if (!context.jss.options.insertionPoint && injectFirst && typeof window !== "undefined") {
		if (!injectFirstNode) {
			var head = document.head;
			injectFirstNode = document.createComment("mui-inject-first");
			head.insertBefore(injectFirstNode, head.firstChild);
		}
		context.jss = createJss({
			plugins: jssPreset().plugins,
			insertionPoint: injectFirstNode
		});
	}
	return /*#__PURE__*/ import_react$12.createElement(StylesContext.Provider, { value: context }, children);
}
var import_react$12, import_prop_types$3, jss, generateClassName, sheetsManager, defaultOptions, StylesContext, injectFirstNode;
var init_StylesProvider$1 = __esmMin((() => {
	init_extends();
	init_objectWithoutProperties();
	import_react$12 = /* @__PURE__ */ __toESM(require_react());
	import_prop_types$3 = /* @__PURE__ */ __toESM(require_prop_types());
	init_esm$2();
	init_createGenerateClassName();
	init_jss_esm();
	init_jssPreset();
	jss = createJss(jssPreset());
	generateClassName = createGenerateClassName();
	sheetsManager = /* @__PURE__ */ new Map();
	defaultOptions = {
		disableGeneration: false,
		generateClassName,
		jss,
		sheetsCache: null,
		sheetsManager,
		sheetsRegistry: null
	};
	StylesContext = import_react$12.createContext(defaultOptions);
	StylesContext.displayName = "StylesContext";
	StylesProvider.propTypes = {
		/**
		* Your component tree.
		*/
		children: import_prop_types$3.default.node.isRequired,
		/**
		* You can disable the generation of the styles with this option.
		* It can be useful when traversing the React tree outside of the HTML
		* rendering step on the server.
		* Let's say you are using react-apollo to extract all
		* the queries made by the interface server-side - you can significantly speed up the traversal with this prop.
		*/
		disableGeneration: import_prop_types$3.default.bool,
		/**
		* JSS's class name generator.
		*/
		generateClassName: import_prop_types$3.default.func,
		/**
		* By default, the styles are injected last in the <head> element of the page.
		* As a result, they gain more specificity than any other style sheet.
		* If you want to override Material-UI's styles, set this prop.
		*/
		injectFirst: import_prop_types$3.default.bool,
		/**
		* JSS's instance.
		*/
		jss: import_prop_types$3.default.object,
		/**
		* @ignore
		*/
		serverGenerateClassName: import_prop_types$3.default.func,
		/**
		* @ignore
		*
		* Beta feature.
		*
		* Cache for the sheets.
		*/
		sheetsCache: import_prop_types$3.default.object,
		/**
		* @ignore
		*
		* The sheetsManager is used to deduplicate style sheet injection in the page.
		* It's deduplicating using the (theme, styles) couple.
		* On the server, you should provide a new instance for each request.
		*/
		sheetsManager: import_prop_types$3.default.object,
		/**
		* @ignore
		*
		* Collect the sheets.
		*/
		sheetsRegistry: import_prop_types$3.default.object
	};
	StylesProvider.propTypes = exactProp(StylesProvider.propTypes);
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/StylesProvider/index.js
var init_StylesProvider = __esmMin((() => {
	init_StylesProvider$1();
	init_StylesProvider$1();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/makeStyles/indexCounter.js
function increment() {
	indexCounter += 1;
	if (indexCounter >= 0) console.warn(["Material-UI: You might have a memory leak.", "The indexCounter is not supposed to grow that much."].join("\n"));
	return indexCounter;
}
var indexCounter;
var init_indexCounter = __esmMin((() => {
	indexCounter = -1e9;
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/getStylesCreator/noopTheme.js
var noopTheme;
var init_noopTheme = __esmMin((() => {
	noopTheme = {};
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/getStylesCreator/getStylesCreator.js
function getStylesCreator(stylesOrCreator) {
	var themingEnabled = typeof stylesOrCreator === "function";
	if (_typeof$1(stylesOrCreator) !== "object" && !themingEnabled) console.error(["Material-UI: The `styles` argument provided is invalid.", "You need to provide a function generating the styles or a styles object."].join("\n"));
	return {
		create: function create(theme, name) {
			var styles;
			try {
				styles = themingEnabled ? stylesOrCreator(theme) : stylesOrCreator;
			} catch (err) {
				if (themingEnabled === true && theme === noopTheme) console.error([
					"Material-UI: The `styles` argument provided is invalid.",
					"You are providing a function without a theme in the context.",
					"One of the parent elements needs to use a ThemeProvider."
				].join("\n"));
				throw err;
			}
			if (!name || !theme.overrides || !theme.overrides[name]) return styles;
			var overrides = theme.overrides[name];
			var stylesWithOverrides = _extends({}, styles);
			Object.keys(overrides).forEach(function(key) {
				if (!stylesWithOverrides[key]) console.warn(["Material-UI: You are trying to override a style that does not exist.", "Fix the `".concat(key, "` key of `theme.overrides.").concat(name, "`.")].join("\n"));
				stylesWithOverrides[key] = deepmerge(stylesWithOverrides[key], overrides[key]);
			});
			return stylesWithOverrides;
		},
		options: {}
	};
}
var init_getStylesCreator$1 = __esmMin((() => {
	init_extends();
	init_typeof();
	init_esm$2();
	init_noopTheme();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/getStylesCreator/index.js
var init_getStylesCreator = __esmMin((() => {
	init_getStylesCreator$1();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/makeStyles/makeStyles.js
function getClasses(_ref, classes, Component) {
	var state = _ref.state;
	if (_ref.stylesOptions.disableGeneration) return classes || {};
	if (!state.cacheClasses) state.cacheClasses = {
		value: null,
		lastProp: null,
		lastJSS: {}
	};
	var generate = false;
	if (state.classes !== state.cacheClasses.lastJSS) {
		state.cacheClasses.lastJSS = state.classes;
		generate = true;
	}
	if (classes !== state.cacheClasses.lastProp) {
		state.cacheClasses.lastProp = classes;
		generate = true;
	}
	if (generate) state.cacheClasses.value = mergeClasses({
		baseClasses: state.cacheClasses.lastJSS,
		newClasses: classes,
		Component
	});
	return state.cacheClasses.value;
}
function attach(_ref2, props) {
	var state = _ref2.state, theme = _ref2.theme, stylesOptions = _ref2.stylesOptions, stylesCreator = _ref2.stylesCreator, name = _ref2.name;
	if (stylesOptions.disableGeneration) return;
	var sheetManager = multiKeyStore.get(stylesOptions.sheetsManager, stylesCreator, theme);
	if (!sheetManager) {
		sheetManager = {
			refs: 0,
			staticSheet: null,
			dynamicStyles: null
		};
		multiKeyStore.set(stylesOptions.sheetsManager, stylesCreator, theme, sheetManager);
	}
	var options = _extends({}, stylesCreator.options, stylesOptions, {
		theme,
		flip: typeof stylesOptions.flip === "boolean" ? stylesOptions.flip : theme.direction === "rtl"
	});
	options.generateId = options.serverGenerateClassName || options.generateClassName;
	var sheetsRegistry = stylesOptions.sheetsRegistry;
	if (sheetManager.refs === 0) {
		var staticSheet;
		if (stylesOptions.sheetsCache) staticSheet = multiKeyStore.get(stylesOptions.sheetsCache, stylesCreator, theme);
		var styles = stylesCreator.create(theme, name);
		if (!staticSheet) {
			staticSheet = stylesOptions.jss.createStyleSheet(styles, _extends({ link: false }, options));
			staticSheet.attach();
			if (stylesOptions.sheetsCache) multiKeyStore.set(stylesOptions.sheetsCache, stylesCreator, theme, staticSheet);
		}
		if (sheetsRegistry) sheetsRegistry.add(staticSheet);
		sheetManager.staticSheet = staticSheet;
		sheetManager.dynamicStyles = getDynamicStyles(styles);
	}
	if (sheetManager.dynamicStyles) {
		var dynamicSheet = stylesOptions.jss.createStyleSheet(sheetManager.dynamicStyles, _extends({ link: true }, options));
		dynamicSheet.update(props);
		dynamicSheet.attach();
		state.dynamicSheet = dynamicSheet;
		state.classes = mergeClasses({
			baseClasses: sheetManager.staticSheet.classes,
			newClasses: dynamicSheet.classes
		});
		if (sheetsRegistry) sheetsRegistry.add(dynamicSheet);
	} else state.classes = sheetManager.staticSheet.classes;
	sheetManager.refs += 1;
}
function update(_ref3, props) {
	var state = _ref3.state;
	if (state.dynamicSheet) state.dynamicSheet.update(props);
}
function detach(_ref4) {
	var state = _ref4.state, theme = _ref4.theme, stylesOptions = _ref4.stylesOptions, stylesCreator = _ref4.stylesCreator;
	if (stylesOptions.disableGeneration) return;
	var sheetManager = multiKeyStore.get(stylesOptions.sheetsManager, stylesCreator, theme);
	sheetManager.refs -= 1;
	var sheetsRegistry = stylesOptions.sheetsRegistry;
	if (sheetManager.refs === 0) {
		multiKeyStore.delete(stylesOptions.sheetsManager, stylesCreator, theme);
		stylesOptions.jss.removeStyleSheet(sheetManager.staticSheet);
		if (sheetsRegistry) sheetsRegistry.remove(sheetManager.staticSheet);
	}
	if (state.dynamicSheet) {
		stylesOptions.jss.removeStyleSheet(state.dynamicSheet);
		if (sheetsRegistry) sheetsRegistry.remove(state.dynamicSheet);
	}
}
function useSynchronousEffect(func, values) {
	var key = import_react$11.useRef([]);
	var output;
	var currentKey = import_react$11.useMemo(function() {
		return {};
	}, values);
	if (key.current !== currentKey) {
		key.current = currentKey;
		output = func();
	}
	import_react$11.useEffect(function() {
		return function() {
			if (output) output();
		};
	}, [currentKey]);
}
function makeStyles(stylesOrCreator) {
	var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	var name = options.name, classNamePrefixOption = options.classNamePrefix, Component = options.Component, _options$defaultTheme = options.defaultTheme, defaultTheme = _options$defaultTheme === void 0 ? noopTheme : _options$defaultTheme, stylesOptions2 = _objectWithoutProperties(options, [
		"name",
		"classNamePrefix",
		"Component",
		"defaultTheme"
	]);
	var stylesCreator = getStylesCreator(stylesOrCreator);
	var classNamePrefix = name || classNamePrefixOption || "makeStyles";
	stylesCreator.options = {
		index: increment(),
		name,
		meta: classNamePrefix,
		classNamePrefix
	};
	return function useStyles() {
		var props = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		var theme = useTheme() || defaultTheme;
		var stylesOptions = _extends({}, import_react$11.useContext(StylesContext), stylesOptions2);
		var instance = import_react$11.useRef();
		var shouldUpdate = import_react$11.useRef();
		useSynchronousEffect(function() {
			var current = {
				name,
				state: {},
				stylesCreator,
				stylesOptions,
				theme
			};
			attach(current, props);
			shouldUpdate.current = false;
			instance.current = current;
			return function() {
				detach(current);
			};
		}, [theme, stylesCreator]);
		import_react$11.useEffect(function() {
			if (shouldUpdate.current) update(instance.current, props);
			shouldUpdate.current = true;
		});
		var classes = getClasses(instance.current, props.classes, Component);
		import_react$11.useDebugValue(classes);
		return classes;
	};
}
var import_react$11;
var init_makeStyles$1 = __esmMin((() => {
	init_objectWithoutProperties();
	init_extends();
	import_react$11 = /* @__PURE__ */ __toESM(require_react());
	init_jss_esm();
	init_mergeClasses();
	init_multiKeyStore();
	init_useTheme();
	init_StylesProvider();
	init_indexCounter();
	init_getStylesCreator();
	init_noopTheme();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/makeStyles/index.js
var init_makeStyles = __esmMin((() => {
	init_makeStyles$1();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/ServerStyleSheets/index.js
var init_ServerStyleSheets = __esmMin((() => {
	init_jss_esm();
	init_StylesProvider();
	init_createGenerateClassName();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/styled/index.js
var init_styled = __esmMin((() => {
	init_clsx_m();
	init_esm$2();
	init_makeStyles();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/ThemeProvider/index.js
var init_ThemeProvider = __esmMin((() => {
	init_esm$2();
	init_ThemeContext();
	init_useTheme();
	init_nested();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/withStyles/withStyles.js
var import_react$10, import_prop_types$2, import_hoist_non_react_statics_cjs$1, withStyles$1;
var init_withStyles$2 = __esmMin((() => {
	init_extends();
	init_objectWithoutProperties();
	import_react$10 = /* @__PURE__ */ __toESM(require_react());
	import_prop_types$2 = /* @__PURE__ */ __toESM(require_prop_types());
	import_hoist_non_react_statics_cjs$1 = /* @__PURE__ */ __toESM(require_hoist_non_react_statics_cjs());
	init_esm$2();
	init_makeStyles();
	init_getThemeProps();
	init_useTheme();
	withStyles$1 = function withStyles(stylesOrCreator) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		return function(Component) {
			var defaultTheme = options.defaultTheme, _options$withTheme = options.withTheme, withTheme = _options$withTheme === void 0 ? false : _options$withTheme, name = options.name, stylesOptions = _objectWithoutProperties(options, [
				"defaultTheme",
				"withTheme",
				"name"
			]);
			if (Component === void 0) throw new Error(["You are calling withStyles(styles)(Component) with an undefined component.", "You may have forgotten to import it."].join("\n"));
			var classNamePrefix = name;
			if (!name) {
				var displayName = getDisplayName(Component);
				if (displayName !== void 0) classNamePrefix = displayName;
			}
			var useStyles = makeStyles(stylesOrCreator, _extends({
				defaultTheme,
				Component,
				name: name || Component.displayName,
				classNamePrefix
			}, stylesOptions));
			var WithStyles = /*#__PURE__*/ import_react$10.forwardRef(function WithStyles(props, ref) {
				props.classes;
				var innerRef = props.innerRef, other = _objectWithoutProperties(props, ["classes", "innerRef"]);
				var classes = useStyles(_extends({}, Component.defaultProps, props));
				var theme;
				var more = other;
				if (typeof name === "string" || withTheme) {
					theme = useTheme() || defaultTheme;
					if (name) more = getThemeProps({
						theme,
						name,
						props: other
					});
					if (withTheme && !more.theme) more.theme = theme;
				}
				return /*#__PURE__*/ import_react$10.createElement(Component, _extends({
					ref: innerRef || ref,
					classes
				}, more));
			});
			WithStyles.propTypes = {
				/**
				* Override or extend the styles applied to the component.
				*/
				classes: import_prop_types$2.default.object,
				/**
				* Use that prop to pass a ref to the decorated component.
				* @deprecated
				*/
				innerRef: chainPropTypes(import_prop_types$2.default.oneOfType([import_prop_types$2.default.func, import_prop_types$2.default.object]), function(props) {
					if (props.innerRef == null) return null;
					return null;
				})
			};
			WithStyles.displayName = "WithStyles(".concat(getDisplayName(Component), ")");
			(0, import_hoist_non_react_statics_cjs$1.default)(WithStyles, Component);
			WithStyles.Naked = Component;
			WithStyles.options = options;
			WithStyles.useStyles = useStyles;
			return WithStyles;
		};
	};
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/withStyles/index.js
var init_withStyles$1 = __esmMin((() => {
	init_withStyles$2();
}));
var init_withTheme$1 = __esmMin((() => {
	require_react();
	require_hoist_non_react_statics_cjs();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/withTheme/index.js
var init_withTheme = __esmMin((() => {
	init_withTheme$1();
	init_withTheme$1();
}));
//#endregion
//#region node_modules/@material-ui/styles/esm/index.js
var init_esm = __esmMin((() => {
	init_createGenerateClassName();
	init_createGenerateClassName();
	init_createStyles();
	init_createStyles();
	init_getThemeProps();
	init_getThemeProps();
	init_jssPreset();
	init_jssPreset();
	init_makeStyles();
	init_makeStyles();
	init_mergeClasses();
	init_mergeClasses();
	init_ServerStyleSheets();
	init_ServerStyleSheets();
	init_styled();
	init_styled();
	init_StylesProvider();
	init_StylesProvider();
	init_ThemeProvider();
	init_ThemeProvider();
	init_useTheme();
	init_useTheme();
	init_withStyles$1();
	init_withStyles$1();
	init_withTheme();
	init_withTheme();
}));
/** @license Material-UI v4.11.5
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
//#endregion
//#region node_modules/@material-ui/core/esm/styles/defaultTheme.js
var defaultTheme;
var init_defaultTheme = __esmMin((() => {
	init_createTheme();
	defaultTheme = createTheme();
}));
//#endregion
//#region node_modules/@material-ui/core/esm/styles/withStyles.js
function withStyles(stylesOrCreator, options) {
	return withStyles$1(stylesOrCreator, _extends({ defaultTheme }, options));
}
var init_withStyles = __esmMin((() => {
	init_extends();
	init_esm();
	init_defaultTheme();
}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/capitalize.js
function capitalize(string) {
	if (typeof string !== "string") throw new Error("Material-UI: capitalize(string) expects a string argument.");
	return string.charAt(0).toUpperCase() + string.slice(1);
}
var init_capitalize = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/createChainedFunction.js
/**
* Safe chained function
*
* Will only create a new function if needed,
* otherwise will pass back existing functions or null.
*
* @param {function} functions to chain
* @returns {function|null}
*/
function createChainedFunction() {
	for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) funcs[_key] = arguments[_key];
	return funcs.reduce(function(acc, func) {
		if (func == null) return acc;
		if (typeof func !== "function") console.error("Material-UI: Invalid Argument Type, must only provide functions, undefined, or null.");
		return function chainedFunction() {
			for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) args[_key2] = arguments[_key2];
			acc.apply(this, args);
			func.apply(this, args);
		};
	}, function() {});
}
var init_createChainedFunction = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/core/esm/SvgIcon/SvgIcon.js
var import_react$8, import_prop_types$1, styles$2, SvgIcon, SvgIcon_default;
var init_SvgIcon$1 = __esmMin((() => {
	init_extends();
	init_objectWithoutProperties();
	import_react$8 = /* @__PURE__ */ __toESM(require_react());
	import_prop_types$1 = /* @__PURE__ */ __toESM(require_prop_types());
	init_clsx_m();
	init_esm$2();
	init_withStyles();
	init_capitalize();
	styles$2 = function styles(theme) {
		return {
			root: {
				userSelect: "none",
				width: "1em",
				height: "1em",
				display: "inline-block",
				fill: "currentColor",
				flexShrink: 0,
				fontSize: theme.typography.pxToRem(24),
				transition: theme.transitions.create("fill", { duration: theme.transitions.duration.shorter })
			},
			colorPrimary: { color: theme.palette.primary.main },
			colorSecondary: { color: theme.palette.secondary.main },
			colorAction: { color: theme.palette.action.active },
			colorError: { color: theme.palette.error.main },
			colorDisabled: { color: theme.palette.action.disabled },
			fontSizeInherit: { fontSize: "inherit" },
			fontSizeSmall: { fontSize: theme.typography.pxToRem(20) },
			fontSizeLarge: { fontSize: theme.typography.pxToRem(35) }
		};
	};
	SvgIcon = /*#__PURE__*/ import_react$8.forwardRef(function SvgIcon(props, ref) {
		var children = props.children, classes = props.classes, className = props.className, _props$color = props.color, color = _props$color === void 0 ? "inherit" : _props$color, _props$component = props.component, Component = _props$component === void 0 ? "svg" : _props$component, _props$fontSize = props.fontSize, fontSize = _props$fontSize === void 0 ? "medium" : _props$fontSize, htmlColor = props.htmlColor, titleAccess = props.titleAccess, _props$viewBox = props.viewBox, viewBox = _props$viewBox === void 0 ? "0 0 24 24" : _props$viewBox, other = _objectWithoutProperties(props, [
			"children",
			"classes",
			"className",
			"color",
			"component",
			"fontSize",
			"htmlColor",
			"titleAccess",
			"viewBox"
		]);
		return /*#__PURE__*/ import_react$8.createElement(Component, _extends({
			className: clsx(classes.root, className, color !== "inherit" && classes["color".concat(capitalize(color))], fontSize !== "default" && fontSize !== "medium" && classes["fontSize".concat(capitalize(fontSize))]),
			focusable: "false",
			viewBox,
			color: htmlColor,
			"aria-hidden": titleAccess ? void 0 : true,
			role: titleAccess ? "img" : void 0,
			ref
		}, other), children, titleAccess ? /*#__PURE__*/ import_react$8.createElement("title", null, titleAccess) : null);
	});
	SvgIcon.propTypes = {
		/**
		* Node passed into the SVG element.
		*/
		children: import_prop_types$1.default.node,
		/**
		* Override or extend the styles applied to the component.
		* See [CSS API](#css) below for more details.
		*/
		classes: import_prop_types$1.default.object,
		/**
		* @ignore
		*/
		className: import_prop_types$1.default.string,
		/**
		* The color of the component. It supports those theme colors that make sense for this component.
		* You can use the `htmlColor` prop to apply a color attribute to the SVG element.
		*/
		color: import_prop_types$1.default.oneOf([
			"action",
			"disabled",
			"error",
			"inherit",
			"primary",
			"secondary"
		]),
		/**
		* The component used for the root node.
		* Either a string to use a HTML element or a component.
		*/
		component: import_prop_types$1.default.elementType,
		/**
		* The fontSize applied to the icon. Defaults to 24px, but can be configure to inherit font size.
		*/
		fontSize: chainPropTypes(import_prop_types$1.default.oneOf([
			"default",
			"inherit",
			"large",
			"medium",
			"small"
		]), function(props) {
			if (props.fontSize === "default") throw new Error("Material-UI: `fontSize=\"default\"` is deprecated. Use `fontSize=\"medium\"` instead.");
			return null;
		}),
		/**
		* Applies a color attribute to the SVG element.
		*/
		htmlColor: import_prop_types$1.default.string,
		/**
		* The shape-rendering attribute. The behavior of the different options is described on the
		* [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/shape-rendering).
		* If you are having issues with blurry icons you should investigate this property.
		*/
		shapeRendering: import_prop_types$1.default.string,
		/**
		* Provides a human-readable title for the element that contains it.
		* https://www.w3.org/TR/SVG-access/#Equivalent
		*/
		titleAccess: import_prop_types$1.default.string,
		/**
		* Allows you to redefine what the coordinates without units mean inside an SVG element.
		* For example, if the SVG element is 500 (width) by 200 (height),
		* and you pass viewBox="0 0 50 20",
		* this means that the coordinates inside the SVG will go from the top left corner (0,0)
		* to bottom right (50,20) and each unit will be worth 10px.
		*/
		viewBox: import_prop_types$1.default.string
	};
	SvgIcon.muiName = "SvgIcon";
	SvgIcon_default = withStyles(styles$2, { name: "MuiSvgIcon" })(SvgIcon);
}));
//#endregion
//#region node_modules/@material-ui/core/esm/SvgIcon/index.js
var init_SvgIcon = __esmMin((() => {
	init_SvgIcon$1();
}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/createSvgIcon.js
/**
* Private module reserved for @material-ui/x packages.
*/
function createSvgIcon(path, displayName) {
	var Component = function Component(props, ref) {
		return /*#__PURE__*/ import_react$7.createElement(SvgIcon_default, _extends({ ref }, props), path);
	};
	Component.displayName = "".concat(displayName, "Icon");
	Component.muiName = SvgIcon_default.muiName;
	return /*#__PURE__*/ import_react$7.memo(/*#__PURE__*/ import_react$7.forwardRef(Component));
}
var import_react$7;
var init_createSvgIcon = __esmMin((() => {
	init_extends();
	import_react$7 = /* @__PURE__ */ __toESM(require_react());
	init_SvgIcon();
}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/debounce.js
function debounce(func) {
	var wait = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 166;
	var timeout;
	function debounced() {
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
		var that = this;
		var later = function later() {
			func.apply(that, args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	}
	debounced.clear = function() {
		clearTimeout(timeout);
	};
	return debounced;
}
var init_debounce = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/deprecatedPropType.js
function deprecatedPropType(validator, reason) {
	return function(props, propName, componentName, location, propFullName) {
		var componentNameSafe = componentName || "<<anonymous>>";
		var propFullNameSafe = propFullName || propName;
		if (typeof props[propName] !== "undefined") return new Error("The ".concat(location, " `").concat(propFullNameSafe, "` of ") + "`".concat(componentNameSafe, "` is deprecated. ").concat(reason));
		return null;
	};
}
var init_deprecatedPropType = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/isMuiElement.js
function isMuiElement(element, muiNames) {
	return /*#__PURE__*/ import_react$6.isValidElement(element) && muiNames.indexOf(element.type.muiName) !== -1;
}
var import_react$6;
var init_isMuiElement = __esmMin((() => {
	import_react$6 = /* @__PURE__ */ __toESM(require_react());
}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/ownerDocument.js
function ownerDocument(node) {
	return node && node.ownerDocument || document;
}
var init_ownerDocument = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/ownerWindow.js
function ownerWindow(node) {
	return ownerDocument(node).defaultView || window;
}
var init_ownerWindow = __esmMin((() => {
	init_ownerDocument();
}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/requirePropFactory.js
function requirePropFactory(componentNameInError) {
	return function requireProp(requiredProp) {
		return function(props, propName, componentName, location, propFullName) {
			var propFullNameSafe = propFullName || propName;
			if (typeof props[propName] !== "undefined" && !props[requiredProp]) return new Error("The prop `".concat(propFullNameSafe, "` of ") + "`".concat(componentNameInError, "` must be used on `").concat(requiredProp, "`."));
			return null;
		};
	};
}
var init_requirePropFactory = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/setRef.js
function setRef(ref, value) {
	if (typeof ref === "function") ref(value);
	else if (ref) ref.current = value;
}
var init_setRef = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/unsupportedProp.js
function unsupportedProp(props, propName, componentName, location, propFullName) {
	var propFullNameSafe = propFullName || propName;
	if (typeof props[propName] !== "undefined") return new Error("The prop `".concat(propFullNameSafe, "` is not supported. Please remove it."));
	return null;
}
var init_unsupportedProp = __esmMin((() => {}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/useControlled.js
function useControlled(_ref) {
	var controlled = _ref.controlled, defaultProp = _ref.default, name = _ref.name, _ref$state = _ref.state, state = _ref$state === void 0 ? "value" : _ref$state;
	var isControlled = import_react$5.useRef(controlled !== void 0).current;
	var _React$useState = import_react$5.useState(defaultProp), valueState = _React$useState[0], setValue = _React$useState[1];
	var value = isControlled ? controlled : valueState;
	import_react$5.useEffect(function() {
		if (isControlled !== (controlled !== void 0)) console.error([
			"Material-UI: A component is changing the ".concat(isControlled ? "" : "un", "controlled ").concat(state, " state of ").concat(name, " to be ").concat(isControlled ? "un" : "", "controlled."),
			"Elements should not switch from uncontrolled to controlled (or vice versa).",
			"Decide between using a controlled or uncontrolled ".concat(name, " ") + "element for the lifetime of the component.",
			"The nature of the state is determined during the first render, it's considered controlled if the value is not `undefined`.",
			"More info: https://fb.me/react-controlled-components"
		].join("\n"));
	}, [controlled]);
	var defaultValue = import_react$5.useRef(defaultProp).current;
	import_react$5.useEffect(function() {
		if (!isControlled && defaultValue !== defaultProp) console.error(["Material-UI: A component is changing the default ".concat(state, " state of an uncontrolled ").concat(name, " after being initialized. ") + "To suppress this warning opt to use a controlled ".concat(name, ".")].join("\n"));
	}, [JSON.stringify(defaultProp)]);
	return [value, import_react$5.useCallback(function(newValue) {
		if (!isControlled) setValue(newValue);
	}, [])];
}
var import_react$5;
var init_useControlled = __esmMin((() => {
	import_react$5 = /* @__PURE__ */ __toESM(require_react());
}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/useEventCallback.js
/**
* https://github.com/facebook/react/issues/14099#issuecomment-440013892
*
* @param {function} fn
*/
function useEventCallback(fn) {
	var ref = import_react$4.useRef(fn);
	useEnhancedEffect$1(function() {
		ref.current = fn;
	});
	return import_react$4.useCallback(function() {
		return ref.current.apply(void 0, arguments);
	}, []);
}
var import_react$4, useEnhancedEffect$1;
var init_useEventCallback = __esmMin((() => {
	import_react$4 = /* @__PURE__ */ __toESM(require_react());
	useEnhancedEffect$1 = typeof window !== "undefined" ? import_react$4.useLayoutEffect : import_react$4.useEffect;
}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/useForkRef.js
function useForkRef(refA, refB) {
	/**
	* This will create a new function if the ref props change and are defined.
	* This means react will call the old forkRef with `null` and the new forkRef
	* with the ref. Cleanup naturally emerges from this behavior
	*/
	return import_react$3.useMemo(function() {
		if (refA == null && refB == null) return null;
		return function(refValue) {
			setRef(refA, refValue);
			setRef(refB, refValue);
		};
	}, [refA, refB]);
}
var import_react$3;
var init_useForkRef = __esmMin((() => {
	import_react$3 = /* @__PURE__ */ __toESM(require_react());
	init_setRef();
}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/unstable_useId.js
/**
* Private module reserved for @material-ui/x packages.
*/
function useId(idOverride) {
	var _React$useState = import_react$2.useState(idOverride), defaultId = _React$useState[0], setDefaultId = _React$useState[1];
	var id = idOverride || defaultId;
	import_react$2.useEffect(function() {
		if (defaultId == null) setDefaultId("mui-".concat(Math.round(Math.random() * 1e5)));
	}, [defaultId]);
	return id;
}
var import_react$2;
var init_unstable_useId = __esmMin((() => {
	import_react$2 = /* @__PURE__ */ __toESM(require_react());
}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/useIsFocusVisible.js
/**
* Computes whether the given element should automatically trigger the
* `focus-visible` class being added, i.e. whether it should always match
* `:focus-visible` when focused.
* @param {Element} node
* @return {boolean}
*/
function focusTriggersKeyboardModality(node) {
	var type = node.type, tagName = node.tagName;
	if (tagName === "INPUT" && inputTypesWhitelist[type] && !node.readOnly) return true;
	if (tagName === "TEXTAREA" && !node.readOnly) return true;
	if (node.isContentEditable) return true;
	return false;
}
/**
* Keep track of our keyboard modality state with `hadKeyboardEvent`.
* If the most recent user interaction was via the keyboard;
* and the key press did not include a meta, alt/option, or control key;
* then the modality is keyboard. Otherwise, the modality is not keyboard.
* @param {KeyboardEvent} event
*/
function handleKeyDown(event) {
	if (event.metaKey || event.altKey || event.ctrlKey) return;
	hadKeyboardEvent = true;
}
/**
* If at any point a user clicks with a pointing device, ensure that we change
* the modality away from keyboard.
* This avoids the situation where a user presses a key on an already focused
* element, and then clicks on a different element, focusing it with a
* pointing device, while we still think we're in keyboard modality.
*/
function handlePointerDown() {
	hadKeyboardEvent = false;
}
function handleVisibilityChange() {
	if (this.visibilityState === "hidden") {
		if (hadFocusVisibleRecently) hadKeyboardEvent = true;
	}
}
function prepare(doc) {
	doc.addEventListener("keydown", handleKeyDown, true);
	doc.addEventListener("mousedown", handlePointerDown, true);
	doc.addEventListener("pointerdown", handlePointerDown, true);
	doc.addEventListener("touchstart", handlePointerDown, true);
	doc.addEventListener("visibilitychange", handleVisibilityChange, true);
}
function isFocusVisible(event) {
	var target = event.target;
	try {
		return target.matches(":focus-visible");
	} catch (error) {}
	return hadKeyboardEvent || focusTriggersKeyboardModality(target);
}
/**
* Should be called if a blur event is fired on a focus-visible element
*/
function handleBlurVisible() {
	hadFocusVisibleRecently = true;
	window.clearTimeout(hadFocusVisibleRecentlyTimeout);
	hadFocusVisibleRecentlyTimeout = window.setTimeout(function() {
		hadFocusVisibleRecently = false;
	}, 100);
}
function useIsFocusVisible() {
	var ref = import_react$1.useCallback(function(instance) {
		var node = import_react_dom$1.findDOMNode(instance);
		if (node != null) prepare(node.ownerDocument);
	}, []);
	import_react$1.useDebugValue(isFocusVisible);
	return {
		isFocusVisible,
		onBlurVisible: handleBlurVisible,
		ref
	};
}
var import_react$1, import_react_dom$1, hadKeyboardEvent, hadFocusVisibleRecently, hadFocusVisibleRecentlyTimeout, inputTypesWhitelist;
var init_useIsFocusVisible = __esmMin((() => {
	import_react$1 = /* @__PURE__ */ __toESM(require_react());
	import_react_dom$1 = /* @__PURE__ */ __toESM(require_react_dom());
	hadKeyboardEvent = true;
	hadFocusVisibleRecently = false;
	hadFocusVisibleRecentlyTimeout = null;
	inputTypesWhitelist = {
		text: true,
		search: true,
		url: true,
		tel: true,
		email: true,
		password: true,
		number: true,
		date: true,
		month: true,
		week: true,
		time: true,
		datetime: true,
		"datetime-local": true
	};
}));
//#endregion
//#region node_modules/@material-ui/core/esm/utils/index.js
var utils_exports = /* @__PURE__ */ __exportAll({
	capitalize: () => capitalize,
	createChainedFunction: () => createChainedFunction,
	createSvgIcon: () => createSvgIcon,
	debounce: () => debounce,
	deprecatedPropType: () => deprecatedPropType,
	isMuiElement: () => isMuiElement,
	ownerDocument: () => ownerDocument,
	ownerWindow: () => ownerWindow,
	requirePropFactory: () => requirePropFactory,
	setRef: () => setRef,
	unstable_useId: () => useId,
	unsupportedProp: () => unsupportedProp,
	useControlled: () => useControlled,
	useEventCallback: () => useEventCallback,
	useForkRef: () => useForkRef,
	useIsFocusVisible: () => useIsFocusVisible
});
var init_utils = __esmMin((() => {
	init_capitalize();
	init_createChainedFunction();
	init_createSvgIcon();
	init_debounce();
	init_deprecatedPropType();
	init_isMuiElement();
	init_ownerDocument();
	init_ownerWindow();
	init_requirePropFactory();
	init_setRef();
	init_unsupportedProp();
	init_useControlled();
	init_useEventCallback();
	init_useForkRef();
	init_unstable_useId();
	init_useIsFocusVisible();
}));
//#endregion
//#region node_modules/react-transition-group/esm/TransitionGroupContext.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var TransitionGroupContext_default = import_react.createContext(null);
//#endregion
//#region node_modules/react-transition-group/esm/utils/ChildMapping.js
/**
* Given `this.props.children`, return an object mapping key to child.
*
* @param {*} children `this.props.children`
* @return {object} Mapping of key to child
*/
function getChildMapping(children, mapFn) {
	var mapper = function mapper(child) {
		return mapFn && (0, import_react.isValidElement)(child) ? mapFn(child) : child;
	};
	var result = Object.create(null);
	if (children) import_react.Children.map(children, function(c) {
		return c;
	}).forEach(function(child) {
		result[child.key] = mapper(child);
	});
	return result;
}
/**
* When you're adding or removing children some may be added or removed in the
* same render pass. We want to show *both* since we want to simultaneously
* animate elements in and out. This function takes a previous set of keys
* and a new set of keys and merges them with its best guess of the correct
* ordering. In the future we may expose some of the utilities in
* ReactMultiChild to make this easy, but for now React itself does not
* directly have this concept of the union of prevChildren and nextChildren
* so we implement it here.
*
* @param {object} prev prev children as returned from
* `ReactTransitionChildMapping.getChildMapping()`.
* @param {object} next next children as returned from
* `ReactTransitionChildMapping.getChildMapping()`.
* @return {object} a key set that contains all keys in `prev` and all keys
* in `next` in a reasonable order.
*/
function mergeChildMappings(prev, next) {
	prev = prev || {};
	next = next || {};
	function getValueForKey(key) {
		return key in next ? next[key] : prev[key];
	}
	var nextKeysPending = Object.create(null);
	var pendingKeys = [];
	for (var prevKey in prev) if (prevKey in next) {
		if (pendingKeys.length) {
			nextKeysPending[prevKey] = pendingKeys;
			pendingKeys = [];
		}
	} else pendingKeys.push(prevKey);
	var i;
	var childMapping = {};
	for (var nextKey in next) {
		if (nextKeysPending[nextKey]) for (i = 0; i < nextKeysPending[nextKey].length; i++) {
			var pendingNextKey = nextKeysPending[nextKey][i];
			childMapping[nextKeysPending[nextKey][i]] = getValueForKey(pendingNextKey);
		}
		childMapping[nextKey] = getValueForKey(nextKey);
	}
	for (i = 0; i < pendingKeys.length; i++) childMapping[pendingKeys[i]] = getValueForKey(pendingKeys[i]);
	return childMapping;
}
function getProp(child, prop, props) {
	return props[prop] != null ? props[prop] : child.props[prop];
}
function getInitialChildMapping(props, onExited) {
	return getChildMapping(props.children, function(child) {
		return (0, import_react.cloneElement)(child, {
			onExited: onExited.bind(null, child),
			in: true,
			appear: getProp(child, "appear", props),
			enter: getProp(child, "enter", props),
			exit: getProp(child, "exit", props)
		});
	});
}
function getNextChildMapping(nextProps, prevChildMapping, onExited) {
	var nextChildMapping = getChildMapping(nextProps.children);
	var children = mergeChildMappings(prevChildMapping, nextChildMapping);
	Object.keys(children).forEach(function(key) {
		var child = children[key];
		if (!(0, import_react.isValidElement)(child)) return;
		var hasPrev = key in prevChildMapping;
		var hasNext = key in nextChildMapping;
		var prevChild = prevChildMapping[key];
		var isLeaving = (0, import_react.isValidElement)(prevChild) && !prevChild.props.in;
		if (hasNext && (!hasPrev || isLeaving)) children[key] = (0, import_react.cloneElement)(child, {
			onExited: onExited.bind(null, child),
			in: true,
			exit: getProp(child, "exit", nextProps),
			enter: getProp(child, "enter", nextProps)
		});
		else if (!hasNext && hasPrev && !isLeaving) children[key] = (0, import_react.cloneElement)(child, { in: false });
		else if (hasNext && hasPrev && (0, import_react.isValidElement)(prevChild)) children[key] = (0, import_react.cloneElement)(child, {
			onExited: onExited.bind(null, child),
			in: prevChild.props.in,
			exit: getProp(child, "exit", nextProps),
			enter: getProp(child, "enter", nextProps)
		});
	});
	return children;
}
//#endregion
//#region node_modules/react-transition-group/esm/TransitionGroup.js
init_objectWithoutPropertiesLoose();
init_extends();
init_assertThisInitialized();
init_inheritsLoose();
var import_prop_types = /* @__PURE__ */ __toESM(require_prop_types());
var values = Object.values || function(obj) {
	return Object.keys(obj).map(function(k) {
		return obj[k];
	});
};
var defaultProps = {
	component: "div",
	childFactory: function childFactory(child) {
		return child;
	}
};
/**
* The `<TransitionGroup>` component manages a set of transition components
* (`<Transition>` and `<CSSTransition>`) in a list. Like with the transition
* components, `<TransitionGroup>` is a state machine for managing the mounting
* and unmounting of components over time.
*
* Consider the example below. As items are removed or added to the TodoList the
* `in` prop is toggled automatically by the `<TransitionGroup>`.
*
* Note that `<TransitionGroup>`  does not define any animation behavior!
* Exactly _how_ a list item animates is up to the individual transition
* component. This means you can mix and match animations across different list
* items.
*/
var TransitionGroup = /*#__PURE__*/ function(_React$Component) {
	_inheritsLoose(TransitionGroup, _React$Component);
	function TransitionGroup(props, context) {
		var _this = _React$Component.call(this, props, context) || this;
		_this.state = {
			contextValue: { isMounting: true },
			handleExited: _this.handleExited.bind(_assertThisInitialized(_this)),
			firstRender: true
		};
		return _this;
	}
	var _proto = TransitionGroup.prototype;
	_proto.componentDidMount = function componentDidMount() {
		this.mounted = true;
		this.setState({ contextValue: { isMounting: false } });
	};
	_proto.componentWillUnmount = function componentWillUnmount() {
		this.mounted = false;
	};
	TransitionGroup.getDerivedStateFromProps = function getDerivedStateFromProps(nextProps, _ref) {
		var prevChildMapping = _ref.children, handleExited = _ref.handleExited;
		return {
			children: _ref.firstRender ? getInitialChildMapping(nextProps, handleExited) : getNextChildMapping(nextProps, prevChildMapping, handleExited),
			firstRender: false
		};
	};
	_proto.handleExited = function handleExited(child, node) {
		var currentChildMapping = getChildMapping(this.props.children);
		if (child.key in currentChildMapping) return;
		if (child.props.onExited) child.props.onExited(node);
		if (this.mounted) this.setState(function(state) {
			var children = _extends({}, state.children);
			delete children[child.key];
			return { children };
		});
	};
	_proto.render = function render() {
		var _this$props = this.props, Component = _this$props.component, childFactory = _this$props.childFactory, props = _objectWithoutPropertiesLoose(_this$props, ["component", "childFactory"]);
		var contextValue = this.state.contextValue;
		var children = values(this.state.children).map(childFactory);
		delete props.appear;
		delete props.enter;
		delete props.exit;
		if (Component === null) return /*#__PURE__*/ import_react.createElement(TransitionGroupContext_default.Provider, { value: contextValue }, children);
		return /*#__PURE__*/ import_react.createElement(TransitionGroupContext_default.Provider, { value: contextValue }, /*#__PURE__*/ import_react.createElement(Component, props, children));
	};
	return TransitionGroup;
}(import_react.Component);
TransitionGroup.propTypes = {
	/**
	* `<TransitionGroup>` renders a `<div>` by default. You can change this
	* behavior by providing a `component` prop.
	* If you use React v16+ and would like to avoid a wrapping `<div>` element
	* you can pass in `component={null}`. This is useful if the wrapping div
	* borks your css styles.
	*/
	component: import_prop_types.default.any,
	/**
	* A set of `<Transition>` components, that are toggled `in` and out as they
	* leave. the `<TransitionGroup>` will inject specific transition props, so
	* remember to spread them through if you are wrapping the `<Transition>` as
	* with our `<Fade>` example.
	*
	* While this component is meant for multiple `Transition` or `CSSTransition`
	* children, sometimes you may want to have a single transition child with
	* content that you want to be transitioned out and in when you change it
	* (e.g. routes, images etc.) In that case you can change the `key` prop of
	* the transition child as you change its content, this will cause
	* `TransitionGroup` to transition the child out and back in.
	*/
	children: import_prop_types.default.node,
	/**
	* A convenience prop that enables or disables appear animations
	* for all children. Note that specifying this will override any defaults set
	* on individual children Transitions.
	*/
	appear: import_prop_types.default.bool,
	/**
	* A convenience prop that enables or disables enter animations
	* for all children. Note that specifying this will override any defaults set
	* on individual children Transitions.
	*/
	enter: import_prop_types.default.bool,
	/**
	* A convenience prop that enables or disables exit animations
	* for all children. Note that specifying this will override any defaults set
	* on individual children Transitions.
	*/
	exit: import_prop_types.default.bool,
	/**
	* You may need to apply reactive updates to a child as it is exiting.
	* This is generally done by using `cloneElement` however in the case of an exiting
	* child the element has already been removed and not accessible to the consumer.
	*
	* If you do need to update a child as it leaves you can provide a `childFactory`
	* to wrap every child, even the ones that are leaving.
	*
	* @type Function(child: ReactElement) -> ReactElement
	*/
	childFactory: import_prop_types.default.func
};
TransitionGroup.defaultProps = defaultProps;
//#endregion
//#region node_modules/@material-ui/core/esm/ButtonBase/Ripple.js
init_clsx_m();
init_useEventCallback();
var useEnhancedEffect = typeof window === "undefined" ? import_react.useEffect : import_react.useLayoutEffect;
/**
* @ignore - internal component.
*/
function Ripple(props) {
	var classes = props.classes, _props$pulsate = props.pulsate, pulsate = _props$pulsate === void 0 ? false : _props$pulsate, rippleX = props.rippleX, rippleY = props.rippleY, rippleSize = props.rippleSize, inProp = props.in, _props$onExited = props.onExited, onExited = _props$onExited === void 0 ? function() {} : _props$onExited, timeout = props.timeout;
	var _React$useState = import_react.useState(false), leaving = _React$useState[0], setLeaving = _React$useState[1];
	var rippleClassName = clsx(classes.ripple, classes.rippleVisible, pulsate && classes.ripplePulsate);
	var rippleStyles = {
		width: rippleSize,
		height: rippleSize,
		top: -(rippleSize / 2) + rippleY,
		left: -(rippleSize / 2) + rippleX
	};
	var childClassName = clsx(classes.child, leaving && classes.childLeaving, pulsate && classes.childPulsate);
	var handleExited = useEventCallback(onExited);
	useEnhancedEffect(function() {
		if (!inProp) {
			setLeaving(true);
			var timeoutId = setTimeout(handleExited, timeout);
			return function() {
				clearTimeout(timeoutId);
			};
		}
	}, [
		handleExited,
		inProp,
		timeout
	]);
	return /*#__PURE__*/ import_react.createElement("span", {
		className: rippleClassName,
		style: rippleStyles
	}, /*#__PURE__*/ import_react.createElement("span", { className: childClassName }));
}
Ripple.propTypes = {
	/**
	* Override or extend the styles applied to the component.
	* See [CSS API](#css) below for more details.
	*/
	classes: import_prop_types.default.object.isRequired,
	/**
	* @ignore - injected from TransitionGroup
	*/
	in: import_prop_types.default.bool,
	/**
	* @ignore - injected from TransitionGroup
	*/
	onExited: import_prop_types.default.func,
	/**
	* If `true`, the ripple pulsates, typically indicating the keyboard focus state of an element.
	*/
	pulsate: import_prop_types.default.bool,
	/**
	* Diameter of the ripple.
	*/
	rippleSize: import_prop_types.default.number,
	/**
	* Horizontal position of the ripple center.
	*/
	rippleX: import_prop_types.default.number,
	/**
	* Vertical position of the ripple center.
	*/
	rippleY: import_prop_types.default.number,
	/**
	* exit delay
	*/
	timeout: import_prop_types.default.number.isRequired
};
//#endregion
//#region node_modules/@material-ui/core/esm/ButtonBase/TouchRipple.js
init_extends();
init_toConsumableArray();
init_objectWithoutProperties();
init_clsx_m();
init_withStyles();
var DURATION = 550;
var styles$1 = function styles(theme) {
	return {
		root: {
			overflow: "hidden",
			pointerEvents: "none",
			position: "absolute",
			zIndex: 0,
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
			borderRadius: "inherit"
		},
		ripple: {
			opacity: 0,
			position: "absolute"
		},
		rippleVisible: {
			opacity: .3,
			transform: "scale(1)",
			animation: "$enter ".concat(DURATION, "ms ").concat(theme.transitions.easing.easeInOut)
		},
		ripplePulsate: { animationDuration: "".concat(theme.transitions.duration.shorter, "ms") },
		child: {
			opacity: 1,
			display: "block",
			width: "100%",
			height: "100%",
			borderRadius: "50%",
			backgroundColor: "currentColor"
		},
		childLeaving: {
			opacity: 0,
			animation: "$exit ".concat(DURATION, "ms ").concat(theme.transitions.easing.easeInOut)
		},
		childPulsate: {
			position: "absolute",
			left: 0,
			top: 0,
			animation: "$pulsate 2500ms ".concat(theme.transitions.easing.easeInOut, " 200ms infinite")
		},
		"@keyframes enter": {
			"0%": {
				transform: "scale(0)",
				opacity: .1
			},
			"100%": {
				transform: "scale(1)",
				opacity: .3
			}
		},
		"@keyframes exit": {
			"0%": { opacity: 1 },
			"100%": { opacity: 0 }
		},
		"@keyframes pulsate": {
			"0%": { transform: "scale(1)" },
			"50%": { transform: "scale(0.92)" },
			"100%": { transform: "scale(1)" }
		}
	};
};
/**
* @ignore - internal component.
*
* TODO v5: Make private
*/
var TouchRipple = /*#__PURE__*/ import_react.forwardRef(function TouchRipple(props, ref) {
	var _props$center = props.center, centerProp = _props$center === void 0 ? false : _props$center, classes = props.classes, className = props.className, other = _objectWithoutProperties(props, [
		"center",
		"classes",
		"className"
	]);
	var _React$useState = import_react.useState([]), ripples = _React$useState[0], setRipples = _React$useState[1];
	var nextKey = import_react.useRef(0);
	var rippleCallback = import_react.useRef(null);
	import_react.useEffect(function() {
		if (rippleCallback.current) {
			rippleCallback.current();
			rippleCallback.current = null;
		}
	}, [ripples]);
	var ignoringMouseDown = import_react.useRef(false);
	var startTimer = import_react.useRef(null);
	var startTimerCommit = import_react.useRef(null);
	var container = import_react.useRef(null);
	import_react.useEffect(function() {
		return function() {
			clearTimeout(startTimer.current);
		};
	}, []);
	var startCommit = import_react.useCallback(function(params) {
		var pulsate = params.pulsate, rippleX = params.rippleX, rippleY = params.rippleY, rippleSize = params.rippleSize, cb = params.cb;
		setRipples(function(oldRipples) {
			return [].concat(_toConsumableArray(oldRipples), [/*#__PURE__*/ import_react.createElement(Ripple, {
				key: nextKey.current,
				classes,
				timeout: DURATION,
				pulsate,
				rippleX,
				rippleY,
				rippleSize
			})]);
		});
		nextKey.current += 1;
		rippleCallback.current = cb;
	}, [classes]);
	var start = import_react.useCallback(function() {
		var event = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		var cb = arguments.length > 2 ? arguments[2] : void 0;
		var _options$pulsate = options.pulsate, pulsate = _options$pulsate === void 0 ? false : _options$pulsate, _options$center = options.center, center = _options$center === void 0 ? centerProp || options.pulsate : _options$center, _options$fakeElement = options.fakeElement, fakeElement = _options$fakeElement === void 0 ? false : _options$fakeElement;
		if (event.type === "mousedown" && ignoringMouseDown.current) {
			ignoringMouseDown.current = false;
			return;
		}
		if (event.type === "touchstart") ignoringMouseDown.current = true;
		var element = fakeElement ? null : container.current;
		var rect = element ? element.getBoundingClientRect() : {
			width: 0,
			height: 0,
			left: 0,
			top: 0
		};
		var rippleX;
		var rippleY;
		var rippleSize;
		if (center || event.clientX === 0 && event.clientY === 0 || !event.clientX && !event.touches) {
			rippleX = Math.round(rect.width / 2);
			rippleY = Math.round(rect.height / 2);
		} else {
			var _ref = event.touches ? event.touches[0] : event, clientX = _ref.clientX, clientY = _ref.clientY;
			rippleX = Math.round(clientX - rect.left);
			rippleY = Math.round(clientY - rect.top);
		}
		if (center) {
			rippleSize = Math.sqrt((2 * Math.pow(rect.width, 2) + Math.pow(rect.height, 2)) / 3);
			if (rippleSize % 2 === 0) rippleSize += 1;
		} else {
			var sizeX = Math.max(Math.abs((element ? element.clientWidth : 0) - rippleX), rippleX) * 2 + 2;
			var sizeY = Math.max(Math.abs((element ? element.clientHeight : 0) - rippleY), rippleY) * 2 + 2;
			rippleSize = Math.sqrt(Math.pow(sizeX, 2) + Math.pow(sizeY, 2));
		}
		if (event.touches) {
			if (startTimerCommit.current === null) {
				startTimerCommit.current = function() {
					startCommit({
						pulsate,
						rippleX,
						rippleY,
						rippleSize,
						cb
					});
				};
				startTimer.current = setTimeout(function() {
					if (startTimerCommit.current) {
						startTimerCommit.current();
						startTimerCommit.current = null;
					}
				}, 80);
			}
		} else startCommit({
			pulsate,
			rippleX,
			rippleY,
			rippleSize,
			cb
		});
	}, [centerProp, startCommit]);
	var pulsate = import_react.useCallback(function() {
		start({}, { pulsate: true });
	}, [start]);
	var stop = import_react.useCallback(function(event, cb) {
		clearTimeout(startTimer.current);
		if (event.type === "touchend" && startTimerCommit.current) {
			event.persist();
			startTimerCommit.current();
			startTimerCommit.current = null;
			startTimer.current = setTimeout(function() {
				stop(event, cb);
			});
			return;
		}
		startTimerCommit.current = null;
		setRipples(function(oldRipples) {
			if (oldRipples.length > 0) return oldRipples.slice(1);
			return oldRipples;
		});
		rippleCallback.current = cb;
	}, []);
	import_react.useImperativeHandle(ref, function() {
		return {
			pulsate,
			start,
			stop
		};
	}, [
		pulsate,
		start,
		stop
	]);
	return /*#__PURE__*/ import_react.createElement("span", _extends({
		className: clsx(classes.root, className),
		ref: container
	}, other), /*#__PURE__*/ import_react.createElement(TransitionGroup, {
		component: null,
		exit: true
	}, ripples));
});
TouchRipple.propTypes = {
	/**
	* If `true`, the ripple starts at the center of the component
	* rather than at the point of interaction.
	*/
	center: import_prop_types.default.bool,
	/**
	* Override or extend the styles applied to the component.
	* See [CSS API](#css) below for more details.
	*/
	classes: import_prop_types.default.object.isRequired,
	/**
	* @ignore
	*/
	className: import_prop_types.default.string
};
var TouchRipple_default = withStyles(styles$1, {
	flip: false,
	name: "MuiTouchRipple"
})(/*#__PURE__*/ import_react.memo(TouchRipple));
//#endregion
//#region node_modules/@material-ui/core/esm/ButtonBase/ButtonBase.js
init_extends();
init_objectWithoutProperties();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
init_clsx_m();
init_esm$2();
init_useForkRef();
init_useEventCallback();
init_deprecatedPropType();
init_withStyles();
init_useIsFocusVisible();
var styles = {
	root: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
		WebkitTapHighlightColor: "transparent",
		backgroundColor: "transparent",
		outline: 0,
		border: 0,
		margin: 0,
		borderRadius: 0,
		padding: 0,
		cursor: "pointer",
		userSelect: "none",
		verticalAlign: "middle",
		"-moz-appearance": "none",
		"-webkit-appearance": "none",
		textDecoration: "none",
		color: "inherit",
		"&::-moz-focus-inner": { borderStyle: "none" },
		"&$disabled": {
			pointerEvents: "none",
			cursor: "default"
		},
		"@media print": { colorAdjust: "exact" }
	},
	disabled: {},
	focusVisible: {}
};
/**
* `ButtonBase` contains as few styles as possible.
* It aims to be a simple building block for creating a button.
* It contains a load of style reset and some focus/ripple logic.
*/
var ButtonBase = /*#__PURE__*/ import_react.forwardRef(function ButtonBase(props, ref) {
	var action = props.action, buttonRefProp = props.buttonRef, _props$centerRipple = props.centerRipple, centerRipple = _props$centerRipple === void 0 ? false : _props$centerRipple, children = props.children, classes = props.classes, className = props.className, _props$component = props.component, component = _props$component === void 0 ? "button" : _props$component, _props$disabled = props.disabled, disabled = _props$disabled === void 0 ? false : _props$disabled, _props$disableRipple = props.disableRipple, disableRipple = _props$disableRipple === void 0 ? false : _props$disableRipple, _props$disableTouchRi = props.disableTouchRipple, disableTouchRipple = _props$disableTouchRi === void 0 ? false : _props$disableTouchRi, _props$focusRipple = props.focusRipple, focusRipple = _props$focusRipple === void 0 ? false : _props$focusRipple, focusVisibleClassName = props.focusVisibleClassName, onBlur = props.onBlur, onClick = props.onClick, onFocus = props.onFocus, onFocusVisible = props.onFocusVisible, onKeyDown = props.onKeyDown, onKeyUp = props.onKeyUp, onMouseDown = props.onMouseDown, onMouseLeave = props.onMouseLeave, onMouseUp = props.onMouseUp, onTouchEnd = props.onTouchEnd, onTouchMove = props.onTouchMove, onTouchStart = props.onTouchStart, onDragLeave = props.onDragLeave, _props$tabIndex = props.tabIndex, tabIndex = _props$tabIndex === void 0 ? 0 : _props$tabIndex, TouchRippleProps = props.TouchRippleProps, _props$type = props.type, type = _props$type === void 0 ? "button" : _props$type, other = _objectWithoutProperties(props, [
		"action",
		"buttonRef",
		"centerRipple",
		"children",
		"classes",
		"className",
		"component",
		"disabled",
		"disableRipple",
		"disableTouchRipple",
		"focusRipple",
		"focusVisibleClassName",
		"onBlur",
		"onClick",
		"onFocus",
		"onFocusVisible",
		"onKeyDown",
		"onKeyUp",
		"onMouseDown",
		"onMouseLeave",
		"onMouseUp",
		"onTouchEnd",
		"onTouchMove",
		"onTouchStart",
		"onDragLeave",
		"tabIndex",
		"TouchRippleProps",
		"type"
	]);
	var buttonRef = import_react.useRef(null);
	function getButtonNode() {
		return import_react_dom.findDOMNode(buttonRef.current);
	}
	var rippleRef = import_react.useRef(null);
	var _React$useState = import_react.useState(false), focusVisible = _React$useState[0], setFocusVisible = _React$useState[1];
	if (disabled && focusVisible) setFocusVisible(false);
	var _useIsFocusVisible = useIsFocusVisible(), isFocusVisible = _useIsFocusVisible.isFocusVisible, onBlurVisible = _useIsFocusVisible.onBlurVisible, focusVisibleRef = _useIsFocusVisible.ref;
	import_react.useImperativeHandle(action, function() {
		return { focusVisible: function focusVisible() {
			setFocusVisible(true);
			buttonRef.current.focus();
		} };
	}, []);
	import_react.useEffect(function() {
		if (focusVisible && focusRipple && !disableRipple) rippleRef.current.pulsate();
	}, [
		disableRipple,
		focusRipple,
		focusVisible
	]);
	function useRippleHandler(rippleAction, eventCallback) {
		var skipRippleAction = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : disableTouchRipple;
		return useEventCallback(function(event) {
			if (eventCallback) eventCallback(event);
			if (!skipRippleAction && rippleRef.current) rippleRef.current[rippleAction](event);
			return true;
		});
	}
	var handleMouseDown = useRippleHandler("start", onMouseDown);
	var handleDragLeave = useRippleHandler("stop", onDragLeave);
	var handleMouseUp = useRippleHandler("stop", onMouseUp);
	var handleMouseLeave = useRippleHandler("stop", function(event) {
		if (focusVisible) event.preventDefault();
		if (onMouseLeave) onMouseLeave(event);
	});
	var handleTouchStart = useRippleHandler("start", onTouchStart);
	var handleTouchEnd = useRippleHandler("stop", onTouchEnd);
	var handleTouchMove = useRippleHandler("stop", onTouchMove);
	var handleBlur = useRippleHandler("stop", function(event) {
		if (focusVisible) {
			onBlurVisible(event);
			setFocusVisible(false);
		}
		if (onBlur) onBlur(event);
	}, false);
	var handleFocus = useEventCallback(function(event) {
		if (!buttonRef.current) buttonRef.current = event.currentTarget;
		if (isFocusVisible(event)) {
			setFocusVisible(true);
			if (onFocusVisible) onFocusVisible(event);
		}
		if (onFocus) onFocus(event);
	});
	var isNonNativeButton = function isNonNativeButton() {
		var button = getButtonNode();
		return component && component !== "button" && !(button.tagName === "A" && button.href);
	};
	/**
	* IE 11 shim for https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
	*/
	var keydownRef = import_react.useRef(false);
	var handleKeyDown = useEventCallback(function(event) {
		if (focusRipple && !keydownRef.current && focusVisible && rippleRef.current && event.key === " ") {
			keydownRef.current = true;
			event.persist();
			rippleRef.current.stop(event, function() {
				rippleRef.current.start(event);
			});
		}
		if (event.target === event.currentTarget && isNonNativeButton() && event.key === " ") event.preventDefault();
		if (onKeyDown) onKeyDown(event);
		if (event.target === event.currentTarget && isNonNativeButton() && event.key === "Enter" && !disabled) {
			event.preventDefault();
			if (onClick) onClick(event);
		}
	});
	var handleKeyUp = useEventCallback(function(event) {
		if (focusRipple && event.key === " " && rippleRef.current && focusVisible && !event.defaultPrevented) {
			keydownRef.current = false;
			event.persist();
			rippleRef.current.stop(event, function() {
				rippleRef.current.pulsate(event);
			});
		}
		if (onKeyUp) onKeyUp(event);
		if (onClick && event.target === event.currentTarget && isNonNativeButton() && event.key === " " && !event.defaultPrevented) onClick(event);
	});
	var ComponentProp = component;
	if (ComponentProp === "button" && other.href) ComponentProp = "a";
	var buttonProps = {};
	if (ComponentProp === "button") {
		buttonProps.type = type;
		buttonProps.disabled = disabled;
	} else {
		if (ComponentProp !== "a" || !other.href) buttonProps.role = "button";
		buttonProps["aria-disabled"] = disabled;
	}
	var handleRef = useForkRef(useForkRef(buttonRefProp, ref), useForkRef(focusVisibleRef, buttonRef));
	var _React$useState2 = import_react.useState(false), mountedState = _React$useState2[0], setMountedState = _React$useState2[1];
	import_react.useEffect(function() {
		setMountedState(true);
	}, []);
	var enableTouchRipple = mountedState && !disableRipple && !disabled;
	import_react.useEffect(function() {
		if (enableTouchRipple && !rippleRef.current) console.error(["Material-UI: The `component` prop provided to ButtonBase is invalid.", "Please make sure the children prop is rendered in this custom component."].join("\n"));
	}, [enableTouchRipple]);
	return /*#__PURE__*/ import_react.createElement(ComponentProp, _extends({
		className: clsx(classes.root, className, focusVisible && [classes.focusVisible, focusVisibleClassName], disabled && classes.disabled),
		onBlur: handleBlur,
		onClick,
		onFocus: handleFocus,
		onKeyDown: handleKeyDown,
		onKeyUp: handleKeyUp,
		onMouseDown: handleMouseDown,
		onMouseLeave: handleMouseLeave,
		onMouseUp: handleMouseUp,
		onDragLeave: handleDragLeave,
		onTouchEnd: handleTouchEnd,
		onTouchMove: handleTouchMove,
		onTouchStart: handleTouchStart,
		ref: handleRef,
		tabIndex: disabled ? -1 : tabIndex
	}, buttonProps, other), children, enableTouchRipple ? /*#__PURE__*/ import_react.createElement(TouchRipple_default, _extends({
		ref: rippleRef,
		center: centerRipple
	}, TouchRippleProps)) : null);
});
ButtonBase.propTypes = {
	/**
	* A ref for imperative actions.
	* It currently only supports `focusVisible()` action.
	*/
	action: refType,
	/**
	* @ignore
	*
	* Use that prop to pass a ref to the native button component.
	* @deprecated Use `ref` instead.
	*/
	buttonRef: deprecatedPropType(refType, "Use `ref` instead."),
	/**
	* If `true`, the ripples will be centered.
	* They won't start at the cursor interaction position.
	*/
	centerRipple: import_prop_types.default.bool,
	/**
	* The content of the component.
	*/
	children: import_prop_types.default.node,
	/**
	* Override or extend the styles applied to the component.
	* See [CSS API](#css) below for more details.
	*/
	classes: import_prop_types.default.object,
	/**
	* @ignore
	*/
	className: import_prop_types.default.string,
	/**
	* The component used for the root node.
	* Either a string to use a HTML element or a component.
	*/
	component: elementTypeAcceptingRef_default,
	/**
	* If `true`, the base button will be disabled.
	*/
	disabled: import_prop_types.default.bool,
	/**
	* If `true`, the ripple effect will be disabled.
	*
	* ⚠️ Without a ripple there is no styling for :focus-visible by default. Be sure
	* to highlight the element by applying separate styles with the `focusVisibleClassName`.
	*/
	disableRipple: import_prop_types.default.bool,
	/**
	* If `true`, the touch ripple effect will be disabled.
	*/
	disableTouchRipple: import_prop_types.default.bool,
	/**
	* If `true`, the base button will have a keyboard focus ripple.
	*/
	focusRipple: import_prop_types.default.bool,
	/**
	* This prop can help identify which element has keyboard focus.
	* The class name will be applied when the element gains the focus through keyboard interaction.
	* It's a polyfill for the [CSS :focus-visible selector](https://drafts.csswg.org/selectors-4/#the-focus-visible-pseudo).
	* The rationale for using this feature [is explained here](https://github.com/WICG/focus-visible/blob/master/explainer.md).
	* A [polyfill can be used](https://github.com/WICG/focus-visible) to apply a `focus-visible` class to other components
	* if needed.
	*/
	focusVisibleClassName: import_prop_types.default.string,
	/**
	* @ignore
	*/
	href: import_prop_types.default.string,
	/**
	* @ignore
	*/
	onBlur: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onClick: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onDragLeave: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onFocus: import_prop_types.default.func,
	/**
	* Callback fired when the component is focused with a keyboard.
	* We trigger a `onFocus` callback too.
	*/
	onFocusVisible: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onKeyDown: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onKeyUp: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onMouseDown: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onMouseLeave: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onMouseUp: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onTouchEnd: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onTouchMove: import_prop_types.default.func,
	/**
	* @ignore
	*/
	onTouchStart: import_prop_types.default.func,
	/**
	* @ignore
	*/
	tabIndex: import_prop_types.default.oneOfType([import_prop_types.default.number, import_prop_types.default.string]),
	/**
	* Props applied to the `TouchRipple` element.
	*/
	TouchRippleProps: import_prop_types.default.object,
	/**
	* @ignore
	*/
	type: import_prop_types.default.oneOfType([import_prop_types.default.oneOf([
		"button",
		"reset",
		"submit"
	]), import_prop_types.default.string])
};
var ButtonBase_default = withStyles(styles, { name: "MuiButtonBase" })(ButtonBase);
//#endregion
export { clsx as _, init_createSvgIcon as a, init_withStyles as c, darken as d, init_colorManipulator as f, init_chainPropTypes as g, chainPropTypes as h, createSvgIcon as i, withStyles as l, init_esm$2 as m, init_utils as n, capitalize as o, lighten as p, utils_exports as r, init_capitalize as s, ButtonBase_default as t, alpha as u, init_clsx_m as v };
