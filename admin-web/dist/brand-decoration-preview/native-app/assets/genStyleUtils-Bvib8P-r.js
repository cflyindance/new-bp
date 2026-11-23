import { d as __toESM, i as require_react } from "./toast-C8a1ReSo.js";
import { S as init_typeof, _ as _createClass, b as init_defineProperty, g as init_assertThisInitialized, h as _assertThisInitialized, i as init_slicedToArray, r as _slicedToArray, v as init_createClass, x as _typeof, y as _defineProperty } from "./objectWithoutProperties-DDcNLcsK.js";
import { $ as warningOnce, A as unit$1, D as useStyleRegister, E as useCSSVarRegister, H as _classCallCheck, R as _createSuper, U as init_classCallCheck, V as _inherits, X as _objectSpread2, a as genLinkStyle, g as defaultIconPrefixCls, i as genIconStyle, k as token2CSSVar, l as unitless, m as ConfigContext, t as genCommonStyle, u as useToken } from "./style-DWrLyeCr.js";
//#region node_modules/@ant-design/cssinjs-utils/es/util/calc/calculator.js
var import_react = /* @__PURE__ */ __toESM(require_react());
init_typeof();
init_defineProperty();
init_assertThisInitialized();
init_slicedToArray();
init_createClass();
init_classCallCheck();
var AbstractCalculator = /*#__PURE__*/ _createClass(function AbstractCalculator() {
	_classCallCheck(this, AbstractCalculator);
});
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/util/calc/CSSCalculator.js
init_classCallCheck();
init_createClass();
var CALC_UNIT = "CALC_UNIT";
var regexp = new RegExp(CALC_UNIT, "g");
function unit(value) {
	if (typeof value === "number") return "".concat(value).concat(CALC_UNIT);
	return value;
}
var CSSCalculator = /*#__PURE__*/ function(_AbstractCalculator) {
	_inherits(CSSCalculator, _AbstractCalculator);
	var _super = _createSuper(CSSCalculator);
	function CSSCalculator(num, unitlessCssVar) {
		var _this;
		_classCallCheck(this, CSSCalculator);
		_this = _super.call(this);
		_defineProperty(_assertThisInitialized(_this), "result", "");
		_defineProperty(_assertThisInitialized(_this), "unitlessCssVar", void 0);
		_defineProperty(_assertThisInitialized(_this), "lowPriority", void 0);
		var numType = _typeof(num);
		_this.unitlessCssVar = unitlessCssVar;
		if (num instanceof CSSCalculator) _this.result = "(".concat(num.result, ")");
		else if (numType === "number") _this.result = unit(num);
		else if (numType === "string") _this.result = num;
		return _this;
	}
	_createClass(CSSCalculator, [
		{
			key: "add",
			value: function add(num) {
				if (num instanceof CSSCalculator) this.result = "".concat(this.result, " + ").concat(num.getResult());
				else if (typeof num === "number" || typeof num === "string") this.result = "".concat(this.result, " + ").concat(unit(num));
				this.lowPriority = true;
				return this;
			}
		},
		{
			key: "sub",
			value: function sub(num) {
				if (num instanceof CSSCalculator) this.result = "".concat(this.result, " - ").concat(num.getResult());
				else if (typeof num === "number" || typeof num === "string") this.result = "".concat(this.result, " - ").concat(unit(num));
				this.lowPriority = true;
				return this;
			}
		},
		{
			key: "mul",
			value: function mul(num) {
				if (this.lowPriority) this.result = "(".concat(this.result, ")");
				if (num instanceof CSSCalculator) this.result = "".concat(this.result, " * ").concat(num.getResult(true));
				else if (typeof num === "number" || typeof num === "string") this.result = "".concat(this.result, " * ").concat(num);
				this.lowPriority = false;
				return this;
			}
		},
		{
			key: "div",
			value: function div(num) {
				if (this.lowPriority) this.result = "(".concat(this.result, ")");
				if (num instanceof CSSCalculator) this.result = "".concat(this.result, " / ").concat(num.getResult(true));
				else if (typeof num === "number" || typeof num === "string") this.result = "".concat(this.result, " / ").concat(num);
				this.lowPriority = false;
				return this;
			}
		},
		{
			key: "getResult",
			value: function getResult(force) {
				return this.lowPriority || force ? "(".concat(this.result, ")") : this.result;
			}
		},
		{
			key: "equal",
			value: function equal(options) {
				var _this2 = this;
				var cssUnit = (options || {}).unit;
				var mergedUnit = true;
				if (typeof cssUnit === "boolean") mergedUnit = cssUnit;
				else if (Array.from(this.unitlessCssVar).some(function(cssVar) {
					return _this2.result.includes(cssVar);
				})) mergedUnit = false;
				this.result = this.result.replace(regexp, mergedUnit ? "px" : "");
				if (typeof this.lowPriority !== "undefined") return "calc(".concat(this.result, ")");
				return this.result;
			}
		}
	]);
	return CSSCalculator;
}(AbstractCalculator);
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/util/calc/NumCalculator.js
init_classCallCheck();
init_createClass();
init_assertThisInitialized();
init_defineProperty();
var NumCalculator = /*#__PURE__*/ function(_AbstractCalculator) {
	_inherits(NumCalculator, _AbstractCalculator);
	var _super = _createSuper(NumCalculator);
	function NumCalculator(num) {
		var _this;
		_classCallCheck(this, NumCalculator);
		_this = _super.call(this);
		_defineProperty(_assertThisInitialized(_this), "result", 0);
		if (num instanceof NumCalculator) _this.result = num.result;
		else if (typeof num === "number") _this.result = num;
		return _this;
	}
	_createClass(NumCalculator, [
		{
			key: "add",
			value: function add(num) {
				if (num instanceof NumCalculator) this.result += num.result;
				else if (typeof num === "number") this.result += num;
				return this;
			}
		},
		{
			key: "sub",
			value: function sub(num) {
				if (num instanceof NumCalculator) this.result -= num.result;
				else if (typeof num === "number") this.result -= num;
				return this;
			}
		},
		{
			key: "mul",
			value: function mul(num) {
				if (num instanceof NumCalculator) this.result *= num.result;
				else if (typeof num === "number") this.result *= num;
				return this;
			}
		},
		{
			key: "div",
			value: function div(num) {
				if (num instanceof NumCalculator) this.result /= num.result;
				else if (typeof num === "number") this.result /= num;
				return this;
			}
		},
		{
			key: "equal",
			value: function equal() {
				return this.result;
			}
		}
	]);
	return NumCalculator;
}(AbstractCalculator);
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/util/calc/index.js
var genCalc = function genCalc(type, unitlessCssVar) {
	var Calculator = type === "css" ? CSSCalculator : NumCalculator;
	return function(num) {
		return new Calculator(num, unitlessCssVar);
	};
};
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/util/getCompVarPrefix.js
var getCompVarPrefix = function getCompVarPrefix(component, prefix) {
	return "".concat([prefix, component.replace(/([A-Z]+)([A-Z][a-z]+)/g, "$1-$2").replace(/([a-z])([A-Z])/g, "$1-$2")].filter(Boolean).join("-"));
};
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/util/getComponentToken.js
function getComponentToken(component, token, defaultToken, options) {
	var customToken = _objectSpread2({}, token[component]);
	if (options !== null && options !== void 0 && options.deprecatedTokens) options.deprecatedTokens.forEach(function(_ref) {
		var _ref2 = _slicedToArray(_ref, 2), oldTokenKey = _ref2[0], newTokenKey = _ref2[1];
		warningOnce(!(customToken !== null && customToken !== void 0 && customToken[oldTokenKey]), "Component Token `".concat(String(oldTokenKey), "` of ").concat(String(component), " is deprecated. Please use `").concat(String(newTokenKey), "` instead."));
		if (customToken !== null && customToken !== void 0 && customToken[oldTokenKey] || customToken !== null && customToken !== void 0 && customToken[newTokenKey]) {
			var _customToken$newToken;
			(_customToken$newToken = customToken[newTokenKey]) !== null && _customToken$newToken !== void 0 || (customToken[newTokenKey] = customToken === null || customToken === void 0 ? void 0 : customToken[oldTokenKey]);
		}
	});
	var mergedToken = _objectSpread2(_objectSpread2({}, defaultToken), customToken);
	Object.keys(mergedToken).forEach(function(key) {
		if (mergedToken[key] === token[key]) delete mergedToken[key];
	});
	return mergedToken;
}
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/util/statistic.js
init_typeof();
var enableStatistic = true;
var recording = true;
/**
* This function will do as `Object.assign` in production. But will use Object.defineProperty:get to
* pass all value access in development. To support statistic field usage with alias token.
*/
function merge() {
	for (var _len = arguments.length, objs = new Array(_len), _key = 0; _key < _len; _key++) objs[_key] = arguments[_key];
	/* istanbul ignore next */
	if (!enableStatistic) return Object.assign.apply(Object, [{}].concat(objs));
	recording = false;
	var ret = {};
	objs.forEach(function(obj) {
		if (_typeof(obj) !== "object") return;
		Object.keys(obj).forEach(function(key) {
			Object.defineProperty(ret, key, {
				configurable: true,
				enumerable: true,
				get: function get() {
					return obj[key];
				}
			});
		});
	});
	recording = true;
	return ret;
}
/** @internal Internal Usage. Not use in your production. */
var statistic = {};
/* istanbul ignore next */
function noop() {}
/** Statistic token usage case. Should use `merge` function if you do not want spread record. */
var statisticToken = function statisticToken(token) {
	var tokenKeys;
	var proxy = token;
	var flush = noop;
	if (enableStatistic && typeof Proxy !== "undefined") {
		tokenKeys = /* @__PURE__ */ new Set();
		proxy = new Proxy(token, { get: function get(obj, prop) {
			if (recording) {
				var _tokenKeys;
				(_tokenKeys = tokenKeys) === null || _tokenKeys === void 0 || _tokenKeys.add(prop);
			}
			return obj[prop];
		} });
		flush = function flush(componentName, componentToken) {
			var _statistic$componentN;
			statistic[componentName] = {
				global: Array.from(tokenKeys),
				component: _objectSpread2(_objectSpread2({}, (_statistic$componentN = statistic[componentName]) === null || _statistic$componentN === void 0 ? void 0 : _statistic$componentN.component), componentToken)
			};
		};
	}
	return {
		token: proxy,
		keys: tokenKeys,
		flush
	};
};
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/util/getDefaultComponentToken.js
function getDefaultComponentToken(component, token, getDefaultToken) {
	if (typeof getDefaultToken === "function") {
		var _token$component;
		return getDefaultToken(merge(token, (_token$component = token[component]) !== null && _token$component !== void 0 ? _token$component : {}));
	}
	return getDefaultToken !== null && getDefaultToken !== void 0 ? getDefaultToken : {};
}
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/util/maxmin.js
function genMaxMin(type) {
	if (type === "js") return {
		max: Math.max,
		min: Math.min
	};
	return {
		max: function max() {
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			return "max(".concat(args.map(function(value) {
				return unit$1(value);
			}).join(","), ")");
		},
		min: function min() {
			for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) args[_key2] = arguments[_key2];
			return "min(".concat(args.map(function(value) {
				return unit$1(value);
			}).join(","), ")");
		}
	};
}
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/_util/hooks/useUniqueMemo.js
init_typeof();
init_classCallCheck();
init_createClass();
init_defineProperty();
var BEAT_LIMIT = 1e3 * 60 * 10;
var uniqueMap = new (/* @__PURE__ */ function() {
	function ArrayKeyMap() {
		_classCallCheck(this, ArrayKeyMap);
		_defineProperty(this, "map", /* @__PURE__ */ new Map());
		_defineProperty(this, "objectIDMap", /* @__PURE__ */ new WeakMap());
		_defineProperty(this, "nextID", 0);
		_defineProperty(this, "lastAccessBeat", /* @__PURE__ */ new Map());
		_defineProperty(this, "accessBeat", 0);
	}
	_createClass(ArrayKeyMap, [
		{
			key: "set",
			value: function set(keys, value) {
				this.clear();
				var compositeKey = this.getCompositeKey(keys);
				this.map.set(compositeKey, value);
				this.lastAccessBeat.set(compositeKey, Date.now());
			}
		},
		{
			key: "get",
			value: function get(keys) {
				var compositeKey = this.getCompositeKey(keys);
				var cache = this.map.get(compositeKey);
				this.lastAccessBeat.set(compositeKey, Date.now());
				this.accessBeat += 1;
				return cache;
			}
		},
		{
			key: "getCompositeKey",
			value: function getCompositeKey(keys) {
				var _this = this;
				return keys.map(function(key) {
					if (key && _typeof(key) === "object") return "obj_".concat(_this.getObjectID(key));
					return "".concat(_typeof(key), "_").concat(key);
				}).join("|");
			}
		},
		{
			key: "getObjectID",
			value: function getObjectID(obj) {
				if (this.objectIDMap.has(obj)) return this.objectIDMap.get(obj);
				var id = this.nextID;
				this.objectIDMap.set(obj, id);
				this.nextID += 1;
				return id;
			}
		},
		{
			key: "clear",
			value: function clear() {
				var _this2 = this;
				if (this.accessBeat > 1e4) {
					var now = Date.now();
					this.lastAccessBeat.forEach(function(beat, key) {
						if (now - beat > BEAT_LIMIT) {
							_this2.map.delete(key);
							_this2.lastAccessBeat.delete(key);
						}
					});
					this.accessBeat = 0;
				}
			}
		}
	]);
	return ArrayKeyMap;
}())();
/**
* Like `useMemo`, but this hook result will be shared across all instances.
*/
function useUniqueMemo(memoFn, deps) {
	return import_react.useMemo(function() {
		var cachedValue = uniqueMap.get(deps);
		if (cachedValue) return cachedValue;
		var newValue = memoFn();
		uniqueMap.set(deps, newValue);
		return newValue;
	}, deps);
}
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/hooks/useCSP.js
/**
* Provide a default hook since not everyone needs to config this.
*/
var useDefaultCSP = function useDefaultCSP() {
	return {};
};
//#endregion
//#region node_modules/@ant-design/cssinjs-utils/es/util/genStyleUtils.js
init_typeof();
init_slicedToArray();
init_defineProperty();
function genStyleUtils(config) {
	var _config$useCSP = config.useCSP, useCSP = _config$useCSP === void 0 ? useDefaultCSP : _config$useCSP, useToken = config.useToken, usePrefix = config.usePrefix, getResetStyles = config.getResetStyles, getCommonStyle = config.getCommonStyle, getCompUnitless = config.getCompUnitless;
	function genStyleHooks(component, styleFn, getDefaultToken, options) {
		var componentName = Array.isArray(component) ? component[0] : component;
		function prefixToken(key) {
			return "".concat(String(componentName)).concat(key.slice(0, 1).toUpperCase()).concat(key.slice(1));
		}
		var originUnitless = (options === null || options === void 0 ? void 0 : options.unitless) || {};
		var compUnitless = _objectSpread2(_objectSpread2({}, typeof getCompUnitless === "function" ? getCompUnitless(component) : {}), {}, _defineProperty({}, prefixToken("zIndexPopup"), true));
		Object.keys(originUnitless).forEach(function(key) {
			compUnitless[prefixToken(key)] = originUnitless[key];
		});
		var mergedOptions = _objectSpread2(_objectSpread2({}, options), {}, {
			unitless: compUnitless,
			prefixToken
		});
		var useStyle = genComponentStyleHook(component, styleFn, getDefaultToken, mergedOptions);
		var useCSSVar = genCSSVarRegister(componentName, getDefaultToken, mergedOptions);
		return function(prefixCls) {
			var rootCls = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : prefixCls;
			var hashId = _slicedToArray(useStyle(prefixCls, rootCls), 2)[1];
			var _useCSSVar2 = _slicedToArray(useCSSVar(rootCls), 2);
			return [
				_useCSSVar2[0],
				hashId,
				_useCSSVar2[1]
			];
		};
	}
	function genCSSVarRegister(component, getDefaultToken, options) {
		var compUnitless = options.unitless, _options$injectStyle = options.injectStyle, injectStyle = _options$injectStyle === void 0 ? true : _options$injectStyle, prefixToken = options.prefixToken, ignore = options.ignore;
		var CSSVarRegister = function CSSVarRegister(_ref) {
			var rootCls = _ref.rootCls, _ref$cssVar = _ref.cssVar, cssVar = _ref$cssVar === void 0 ? {} : _ref$cssVar;
			var realToken = useToken().realToken;
			useCSSVarRegister({
				path: [component],
				prefix: cssVar.prefix,
				key: cssVar.key,
				unitless: compUnitless,
				ignore,
				token: realToken,
				scope: rootCls
			}, function() {
				var defaultToken = getDefaultComponentToken(component, realToken, getDefaultToken);
				var componentToken = getComponentToken(component, realToken, defaultToken, { deprecatedTokens: options === null || options === void 0 ? void 0 : options.deprecatedTokens });
				Object.keys(defaultToken).forEach(function(key) {
					componentToken[prefixToken(key)] = componentToken[key];
					delete componentToken[key];
				});
				return componentToken;
			});
			return null;
		};
		return function useCSSVar(rootCls) {
			var cssVar = useToken().cssVar;
			return [function(node) {
				return injectStyle && cssVar ? /*#__PURE__*/ import_react.createElement(import_react.default.Fragment, null, /*#__PURE__*/ import_react.createElement(CSSVarRegister, {
					rootCls,
					cssVar,
					component
				}), node) : node;
			}, cssVar === null || cssVar === void 0 ? void 0 : cssVar.key];
		};
	}
	function genComponentStyleHook(componentName, styleFn, getDefaultToken) {
		var options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
		var cells = Array.isArray(componentName) ? componentName : [componentName, componentName];
		var component = _slicedToArray(cells, 1)[0];
		var concatComponent = cells.join("-");
		var mergedLayer = config.layer || { name: "antd" };
		return function(prefixCls) {
			var rootCls = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : prefixCls;
			var _useToken3 = useToken(), theme = _useToken3.theme, realToken = _useToken3.realToken, hashId = _useToken3.hashId, token = _useToken3.token, cssVar = _useToken3.cssVar;
			var _usePrefix = usePrefix(), rootPrefixCls = _usePrefix.rootPrefixCls, iconPrefixCls = _usePrefix.iconPrefixCls;
			var csp = useCSP();
			var type = cssVar ? "css" : "js";
			var calc = useUniqueMemo(function() {
				var unitlessCssVar = /* @__PURE__ */ new Set();
				if (cssVar) Object.keys(options.unitless || {}).forEach(function(key) {
					unitlessCssVar.add(token2CSSVar(key, cssVar.prefix));
					unitlessCssVar.add(token2CSSVar(key, getCompVarPrefix(component, cssVar.prefix)));
				});
				return genCalc(type, unitlessCssVar);
			}, [
				type,
				component,
				cssVar === null || cssVar === void 0 ? void 0 : cssVar.prefix
			]);
			var _genMaxMin = genMaxMin(type), max = _genMaxMin.max, min = _genMaxMin.min;
			var sharedConfig = {
				theme,
				token,
				hashId,
				nonce: function nonce() {
					return csp.nonce;
				},
				clientOnly: options.clientOnly,
				layer: mergedLayer,
				order: options.order || -999
			};
			if (typeof getResetStyles === "function") useStyleRegister(_objectSpread2(_objectSpread2({}, sharedConfig), {}, {
				clientOnly: false,
				path: ["Shared", rootPrefixCls]
			}), function() {
				return getResetStyles(token, {
					prefix: {
						rootPrefixCls,
						iconPrefixCls
					},
					csp
				});
			});
			return [useStyleRegister(_objectSpread2(_objectSpread2({}, sharedConfig), {}, { path: [
				concatComponent,
				prefixCls,
				iconPrefixCls
			] }), function() {
				if (options.injectStyle === false) return [];
				var _statisticToken = statisticToken(token), proxyToken = _statisticToken.token, flush = _statisticToken.flush;
				var defaultComponentToken = getDefaultComponentToken(component, realToken, getDefaultToken);
				var componentCls = ".".concat(prefixCls);
				var componentToken = getComponentToken(component, realToken, defaultComponentToken, { deprecatedTokens: options.deprecatedTokens });
				if (cssVar && defaultComponentToken && _typeof(defaultComponentToken) === "object") Object.keys(defaultComponentToken).forEach(function(key) {
					defaultComponentToken[key] = "var(".concat(token2CSSVar(key, getCompVarPrefix(component, cssVar.prefix)), ")");
				});
				var mergedToken = merge(proxyToken, {
					componentCls,
					prefixCls,
					iconCls: ".".concat(iconPrefixCls),
					antCls: ".".concat(rootPrefixCls),
					calc,
					max,
					min
				}, cssVar ? defaultComponentToken : componentToken);
				var styleInterpolation = styleFn(mergedToken, {
					hashId,
					prefixCls,
					rootPrefixCls,
					iconPrefixCls
				});
				flush(component, componentToken);
				var commonStyle = typeof getCommonStyle === "function" ? getCommonStyle(mergedToken, prefixCls, rootCls, options.resetFont) : null;
				return [options.resetStyle === false ? null : commonStyle, styleInterpolation];
			}), hashId];
		};
	}
	function genSubStyleComponent(componentName, styleFn, getDefaultToken) {
		var useStyle = genComponentStyleHook(componentName, styleFn, getDefaultToken, _objectSpread2({
			resetStyle: false,
			order: -998
		}, arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {}));
		var StyledComponent = function StyledComponent(_ref2) {
			var prefixCls = _ref2.prefixCls, _ref2$rootCls = _ref2.rootCls;
			useStyle(prefixCls, _ref2$rootCls === void 0 ? prefixCls : _ref2$rootCls);
			return null;
		};
		StyledComponent.displayName = "SubStyle_".concat(String(Array.isArray(componentName) ? componentName.join(".") : componentName));
		return StyledComponent;
	}
	return {
		genStyleHooks,
		genSubStyleComponent,
		genComponentStyleHook
	};
}
//#endregion
//#region node_modules/antd/es/theme/util/genStyleUtils.js
var { genStyleHooks, genComponentStyleHook, genSubStyleComponent } = genStyleUtils({
	usePrefix: () => {
		const { getPrefixCls, iconPrefixCls } = (0, import_react.useContext)(ConfigContext);
		return {
			rootPrefixCls: getPrefixCls(),
			iconPrefixCls
		};
	},
	useToken: () => {
		const [theme, realToken, hashId, token, cssVar] = useToken();
		return {
			theme,
			realToken,
			hashId,
			token,
			cssVar
		};
	},
	useCSP: () => {
		const { csp } = (0, import_react.useContext)(ConfigContext);
		return csp !== null && csp !== void 0 ? csp : {};
	},
	getResetStyles: (token, config) => {
		var _a;
		const linkStyle = genLinkStyle(token);
		return [
			linkStyle,
			{ "&": linkStyle },
			genIconStyle((_a = config === null || config === void 0 ? void 0 : config.prefix.iconPrefixCls) !== null && _a !== void 0 ? _a : defaultIconPrefixCls)
		];
	},
	getCommonStyle: genCommonStyle,
	getCompUnitless: () => unitless
});
//#endregion
export { genStyleHooks as n, merge as r, genComponentStyleHook as t };
