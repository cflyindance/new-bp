import { d as __toESM, i as require_react, s as __esmMin } from "./toast-C8a1ReSo.js";
import { l as _extends, o as require_react_is, u as init_extends } from "./es-CFYDnMm2.js";
import { n as init_setPrototypeOf, t as _setPrototypeOf } from "./setPrototypeOf-fzM5qJP3.js";
import { S as init_typeof, _ as _createClass, b as init_defineProperty, g as init_assertThisInitialized, h as _assertThisInitialized, i as init_slicedToArray, l as _toConsumableArray, n as init_objectWithoutProperties, r as _slicedToArray, t as _objectWithoutProperties, u as init_toConsumableArray, v as init_createClass, x as _typeof, y as _defineProperty } from "./objectWithoutProperties-DDcNLcsK.js";
//#region node_modules/rc-util/es/React/isFragment.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_react_is = require_react_is();
init_typeof();
var REACT_ELEMENT_TYPE_18 = Symbol.for("react.element");
var REACT_ELEMENT_TYPE_19 = Symbol.for("react.transitional.element");
var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
/**
* Compatible with React 18 or 19 to check if node is a Fragment.
*/
function isFragment(object) {
	return object && _typeof(object) === "object" && (object.$$typeof === REACT_ELEMENT_TYPE_18 || object.$$typeof === REACT_ELEMENT_TYPE_19) && object.type === REACT_FRAGMENT_TYPE;
}
//#endregion
//#region node_modules/rc-util/es/warning.js
var warned = {};
var preWarningFns = [];
/**
* Pre warning enable you to parse content before console.error.
* Modify to null will prevent warning.
*/
var preMessage = function preMessage(fn) {
	preWarningFns.push(fn);
};
/**
* Warning if condition not match.
* @param valid Condition
* @param message Warning message
* @example
* ```js
* warning(false, 'some error'); // print some error
* warning(true, 'some error'); // print nothing
* warning(1 === 2, 'some error'); // print some error
* ```
*/
function warning(valid, message) {
	if (!valid && console !== void 0) {
		var finalMessage = preWarningFns.reduce(function(msg, preMessageFn) {
			return preMessageFn(msg !== null && msg !== void 0 ? msg : "", "warning");
		}, message);
		if (finalMessage) console.error("Warning: ".concat(finalMessage));
	}
}
/** @see Similar to {@link warning} */
function note(valid, message) {
	if (!valid && console !== void 0) {
		var finalMessage = preWarningFns.reduce(function(msg, preMessageFn) {
			return preMessageFn(msg !== null && msg !== void 0 ? msg : "", "note");
		}, message);
		if (finalMessage) console.warn("Note: ".concat(finalMessage));
	}
}
function resetWarned() {
	warned = {};
}
function call(method, valid, message) {
	if (!valid && !warned[message]) {
		method(false, message);
		warned[message] = true;
	}
}
/** @see Same as {@link warning}, but only warn once for the same message */
function warningOnce(valid, message) {
	call(warning, valid, message);
}
/** @see Same as {@link warning}, but only warn once for the same message */
function noteOnce(valid, message) {
	call(note, valid, message);
}
warningOnce.preMessage = preMessage;
warningOnce.resetWarned = resetWarned;
warningOnce.noteOnce = noteOnce;
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/objectSpread2.js
init_defineProperty();
function ownKeys(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread2(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
//#endregion
//#region node_modules/rc-util/es/hooks/useMemo.js
function useMemo(getValue, condition, shouldUpdate) {
	var cacheRef = import_react.useRef({});
	if (!("value" in cacheRef.current) || shouldUpdate(cacheRef.current.condition, condition)) {
		cacheRef.current.value = getValue();
		cacheRef.current.condition = condition;
	}
	return cacheRef.current.value;
}
//#endregion
//#region node_modules/rc-util/es/ref.js
init_typeof();
var ReactMajorVersion = Number(import_react.version.split(".")[0]);
var fillRef = function fillRef(ref, node) {
	if (typeof ref === "function") ref(node);
	else if (_typeof(ref) === "object" && ref && "current" in ref) ref.current = node;
};
/**
* Merge refs into one ref function to support ref passing.
*/
var composeRef = function composeRef() {
	for (var _len = arguments.length, refs = new Array(_len), _key = 0; _key < _len; _key++) refs[_key] = arguments[_key];
	var refList = refs.filter(Boolean);
	if (refList.length <= 1) return refList[0];
	return function(node) {
		refs.forEach(function(ref) {
			fillRef(ref, node);
		});
	};
};
var useComposeRef = function useComposeRef() {
	for (var _len2 = arguments.length, refs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) refs[_key2] = arguments[_key2];
	return useMemo(function() {
		return composeRef.apply(void 0, refs);
	}, refs, function(prev, next) {
		return prev.length !== next.length || prev.every(function(ref, i) {
			return ref !== next[i];
		});
	});
};
var supportRef = function supportRef(nodeOrComponent) {
	var _type$prototype, _nodeOrComponent$prot;
	if (!nodeOrComponent) return false;
	if (isReactElement(nodeOrComponent) && ReactMajorVersion >= 19) return true;
	var type = (0, import_react_is.isMemo)(nodeOrComponent) ? nodeOrComponent.type.type : nodeOrComponent.type;
	if (typeof type === "function" && !((_type$prototype = type.prototype) !== null && _type$prototype !== void 0 && _type$prototype.render) && type.$$typeof !== import_react_is.ForwardRef) return false;
	if (typeof nodeOrComponent === "function" && !((_nodeOrComponent$prot = nodeOrComponent.prototype) !== null && _nodeOrComponent$prot !== void 0 && _nodeOrComponent$prot.render) && nodeOrComponent.$$typeof !== import_react_is.ForwardRef) return false;
	return true;
};
function isReactElement(node) {
	return /*#__PURE__*/ (0, import_react.isValidElement)(node) && !isFragment(node);
}
/**
* In React 19. `ref` is not a property from node.
* But a property from `props.ref`.
* To check if `props.ref` exist or fallback to `ref`.
*/
var getNodeRef = function getNodeRef(node) {
	if (node && isReactElement(node)) {
		var ele = node;
		return ele.props.propertyIsEnumerable("ref") ? ele.props.ref : ele.ref;
	}
	return null;
};
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/classCallCheck.js
function _classCallCheck(a, n) {
	if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
var init_classCallCheck = __esmMin((() => {}));
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/inherits.js
init_classCallCheck();
init_createClass();
init_setPrototypeOf();
function _inherits(t, e) {
	if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
	t.prototype = Object.create(e && e.prototype, { constructor: {
		value: t,
		writable: !0,
		configurable: !0
	} }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e);
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js
function _getPrototypeOf(t) {
	return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t) {
		return t.__proto__ || Object.getPrototypeOf(t);
	}, _getPrototypeOf(t);
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/isNativeReflectConstruct.js
function _isNativeReflectConstruct() {
	try {
		var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
	} catch (t) {}
	return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {
		return !!t;
	})();
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js
init_typeof();
init_assertThisInitialized();
function _possibleConstructorReturn(t, e) {
	if (e && ("object" == _typeof(e) || "function" == typeof e)) return e;
	if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
	return _assertThisInitialized(t);
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/createSuper.js
function _createSuper(t) {
	var r = _isNativeReflectConstruct();
	return function() {
		var e, o = _getPrototypeOf(t);
		if (r) {
			var s = _getPrototypeOf(this).constructor;
			e = Reflect.construct(o, arguments, s);
		} else e = o.apply(this, arguments);
		return _possibleConstructorReturn(this, e);
	};
}
//#endregion
//#region node_modules/@emotion/hash/dist/hash.browser.esm.js
init_toConsumableArray();
init_slicedToArray();
function murmur2(str) {
	var h = 0;
	var k, i = 0, len = str.length;
	for (; len >= 4; ++i, len -= 4) {
		k = str.charCodeAt(i) & 255 | (str.charCodeAt(++i) & 255) << 8 | (str.charCodeAt(++i) & 255) << 16 | (str.charCodeAt(++i) & 255) << 24;
		k = (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16);
		k ^= k >>> 24;
		h = (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16) ^ (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
	}
	switch (len) {
		case 3: h ^= (str.charCodeAt(i + 2) & 255) << 16;
		case 2: h ^= (str.charCodeAt(i + 1) & 255) << 8;
		case 1:
			h ^= str.charCodeAt(i) & 255;
			h = (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
	}
	h ^= h >>> 13;
	h = (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
	return ((h ^ h >>> 15) >>> 0).toString(36);
}
//#endregion
//#region node_modules/rc-util/es/Dom/canUseDom.js
function canUseDom() {
	return !!(typeof window !== "undefined" && window.document && window.document.createElement);
}
//#endregion
//#region node_modules/rc-util/es/Dom/contains.js
function contains(root, n) {
	if (!root) return false;
	if (root.contains) return root.contains(n);
	var node = n;
	while (node) {
		if (node === root) return true;
		node = node.parentNode;
	}
	return false;
}
//#endregion
//#region node_modules/rc-util/es/Dom/dynamicCSS.js
var APPEND_ORDER = "data-rc-order";
var APPEND_PRIORITY = "data-rc-priority";
var MARK_KEY = "rc-util-key";
var containerCache = /* @__PURE__ */ new Map();
function getMark() {
	var mark = (arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}).mark;
	if (mark) return mark.startsWith("data-") ? mark : "data-".concat(mark);
	return MARK_KEY;
}
function getContainer(option) {
	if (option.attachTo) return option.attachTo;
	return document.querySelector("head") || document.body;
}
function getOrder(prepend) {
	if (prepend === "queue") return "prependQueue";
	return prepend ? "prepend" : "append";
}
/**
* Find style which inject by rc-util
*/
function findStyles(container) {
	return Array.from((containerCache.get(container) || container).children).filter(function(node) {
		return node.tagName === "STYLE";
	});
}
function injectCSS(css) {
	var option = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	if (!canUseDom()) return null;
	var csp = option.csp, prepend = option.prepend, _option$priority = option.priority, priority = _option$priority === void 0 ? 0 : _option$priority;
	var mergedOrder = getOrder(prepend);
	var isPrependQueue = mergedOrder === "prependQueue";
	var styleNode = document.createElement("style");
	styleNode.setAttribute(APPEND_ORDER, mergedOrder);
	if (isPrependQueue && priority) styleNode.setAttribute(APPEND_PRIORITY, "".concat(priority));
	if (csp !== null && csp !== void 0 && csp.nonce) styleNode.nonce = csp === null || csp === void 0 ? void 0 : csp.nonce;
	styleNode.innerHTML = css;
	var container = getContainer(option);
	var firstChild = container.firstChild;
	if (prepend) {
		if (isPrependQueue) {
			var existStyle = (option.styles || findStyles(container)).filter(function(node) {
				if (!["prepend", "prependQueue"].includes(node.getAttribute(APPEND_ORDER))) return false;
				return priority >= Number(node.getAttribute(APPEND_PRIORITY) || 0);
			});
			if (existStyle.length) {
				container.insertBefore(styleNode, existStyle[existStyle.length - 1].nextSibling);
				return styleNode;
			}
		}
		container.insertBefore(styleNode, firstChild);
	} else container.appendChild(styleNode);
	return styleNode;
}
function findExistNode(key) {
	var option = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	var container = getContainer(option);
	return (option.styles || findStyles(container)).find(function(node) {
		return node.getAttribute(getMark(option)) === key;
	});
}
function removeCSS(key) {
	var option = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	var existNode = findExistNode(key, option);
	if (existNode) getContainer(option).removeChild(existNode);
}
/**
* qiankun will inject `appendChild` to insert into other
*/
function syncRealContainer(container, option) {
	var cachedRealContainer = containerCache.get(container);
	if (!cachedRealContainer || !contains(document, cachedRealContainer)) {
		var placeholderStyle = injectCSS("", option);
		var parentNode = placeholderStyle.parentNode;
		containerCache.set(container, parentNode);
		container.removeChild(placeholderStyle);
	}
}
function updateCSS(css, key) {
	var originOption = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
	var container = getContainer(originOption);
	var styles = findStyles(container);
	var option = _objectSpread2(_objectSpread2({}, originOption), {}, { styles });
	syncRealContainer(container, option);
	var existNode = findExistNode(key, option);
	if (existNode) {
		var _option$csp, _option$csp2;
		if ((_option$csp = option.csp) !== null && _option$csp !== void 0 && _option$csp.nonce && existNode.nonce !== ((_option$csp2 = option.csp) === null || _option$csp2 === void 0 ? void 0 : _option$csp2.nonce)) {
			var _option$csp3;
			existNode.nonce = (_option$csp3 = option.csp) === null || _option$csp3 === void 0 ? void 0 : _option$csp3.nonce;
		}
		if (existNode.innerHTML !== css) existNode.innerHTML = css;
		return existNode;
	}
	var newNode = injectCSS(css, option);
	newNode.setAttribute(getMark(option), key);
	return newNode;
}
//#endregion
//#region node_modules/rc-util/es/isEqual.js
init_objectWithoutProperties();
init_typeof();
/**
* Deeply compares two object literals.
* @param obj1 object 1
* @param obj2 object 2
* @param shallow shallow compare
* @returns
*/
function isEqual(obj1, obj2) {
	var shallow = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
	var refSet = /* @__PURE__ */ new Set();
	function deepEqual(a, b) {
		var level = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
		var circular = refSet.has(a);
		warningOnce(!circular, "Warning: There may be circular references");
		if (circular) return false;
		if (a === b) return true;
		if (shallow && level > 1) return false;
		refSet.add(a);
		var newLevel = level + 1;
		if (Array.isArray(a)) {
			if (!Array.isArray(b) || a.length !== b.length) return false;
			for (var i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i], newLevel)) return false;
			return true;
		}
		if (a && b && _typeof(a) === "object" && _typeof(b) === "object") {
			var keys = Object.keys(a);
			if (keys.length !== Object.keys(b).length) return false;
			return keys.every(function(key) {
				return deepEqual(a[key], b[key], newLevel);
			});
		}
		return false;
	}
	return deepEqual(obj1, obj2);
}
//#endregion
//#region node_modules/@ant-design/cssinjs/es/Cache.js
init_defineProperty();
var SPLIT = "%";
/** Connect key with `SPLIT` */
function pathKey(keys) {
	return keys.join(SPLIT);
}
var Entity = /*#__PURE__*/ function() {
	function Entity(instanceId) {
		_classCallCheck(this, Entity);
		_defineProperty(this, "instanceId", void 0);
		/** @private Internal cache map. Do not access this directly */
		_defineProperty(this, "cache", /* @__PURE__ */ new Map());
		_defineProperty(this, "extracted", /* @__PURE__ */ new Set());
		this.instanceId = instanceId;
	}
	_createClass(Entity, [
		{
			key: "get",
			value: function get(keys) {
				return this.opGet(pathKey(keys));
			}
		},
		{
			key: "opGet",
			value: function opGet(keyPathStr) {
				return this.cache.get(keyPathStr) || null;
			}
		},
		{
			key: "update",
			value: function update(keys, valueFn) {
				return this.opUpdate(pathKey(keys), valueFn);
			}
		},
		{
			key: "opUpdate",
			value: function opUpdate(keyPathStr, valueFn) {
				var nextValue = valueFn(this.cache.get(keyPathStr));
				if (nextValue === null) this.cache.delete(keyPathStr);
				else this.cache.set(keyPathStr, nextValue);
			}
		}
	]);
	return Entity;
}();
//#endregion
//#region node_modules/@ant-design/cssinjs/es/StyleContext.js
var _excluded = ["children"];
var ATTR_TOKEN = "data-token-hash";
var ATTR_MARK = "data-css-hash";
var ATTR_CACHE_PATH = "data-cache-path";
var CSS_IN_JS_INSTANCE = "__cssinjs_instance__";
function createCache() {
	var cssinjsInstanceId = Math.random().toString(12).slice(2);
	if (typeof document !== "undefined" && document.head && document.body) {
		var styles = document.body.querySelectorAll("style[".concat("data-css-hash", "]")) || [];
		var firstChild = document.head.firstChild;
		Array.from(styles).forEach(function(style) {
			style[CSS_IN_JS_INSTANCE] = style["__cssinjs_instance__"] || cssinjsInstanceId;
			if (style["__cssinjs_instance__"] === cssinjsInstanceId) document.head.insertBefore(style, firstChild);
		});
		var styleHash = {};
		Array.from(document.querySelectorAll("style[".concat(ATTR_MARK, "]"))).forEach(function(style) {
			var hash = style.getAttribute(ATTR_MARK);
			if (styleHash[hash]) {
				if (style["__cssinjs_instance__"] === cssinjsInstanceId) {
					var _style$parentNode;
					(_style$parentNode = style.parentNode) === null || _style$parentNode === void 0 || _style$parentNode.removeChild(style);
				}
			} else styleHash[hash] = true;
		});
	}
	return new Entity(cssinjsInstanceId);
}
var StyleContext = /*#__PURE__*/ import_react.createContext({
	hashPriority: "low",
	cache: createCache(),
	defaultCache: true
});
var StyleProvider = function StyleProvider(props) {
	var children = props.children, restProps = _objectWithoutProperties(props, _excluded);
	var parentContext = import_react.useContext(StyleContext);
	var context = useMemo(function() {
		var mergedContext = _objectSpread2({}, parentContext);
		Object.keys(restProps).forEach(function(key) {
			var value = restProps[key];
			if (restProps[key] !== void 0) mergedContext[key] = value;
		});
		var cache = restProps.cache;
		mergedContext.cache = mergedContext.cache || createCache();
		mergedContext.defaultCache = !cache && parentContext.defaultCache;
		return mergedContext;
	}, [parentContext, restProps], function(prev, next) {
		return !isEqual(prev[0], next[0], true) || !isEqual(prev[1], next[1], true);
	});
	return /*#__PURE__*/ import_react.createElement(StyleContext.Provider, { value: context }, children);
};
//#endregion
//#region node_modules/@ant-design/cssinjs/es/theme/ThemeCache.js
init_classCallCheck();
init_createClass();
init_defineProperty();
function sameDerivativeOption(left, right) {
	if (left.length !== right.length) return false;
	for (var i = 0; i < left.length; i++) if (left[i] !== right[i]) return false;
	return true;
}
var ThemeCache = /*#__PURE__*/ function() {
	function ThemeCache() {
		_classCallCheck(this, ThemeCache);
		_defineProperty(this, "cache", void 0);
		_defineProperty(this, "keys", void 0);
		_defineProperty(this, "cacheCallTimes", void 0);
		this.cache = /* @__PURE__ */ new Map();
		this.keys = [];
		this.cacheCallTimes = 0;
	}
	_createClass(ThemeCache, [
		{
			key: "size",
			value: function size() {
				return this.keys.length;
			}
		},
		{
			key: "internalGet",
			value: function internalGet(derivativeOption) {
				var _cache2, _cache3;
				var updateCallTimes = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
				var cache = { map: this.cache };
				derivativeOption.forEach(function(derivative) {
					if (!cache) cache = void 0;
					else {
						var _cache;
						cache = (_cache = cache) === null || _cache === void 0 || (_cache = _cache.map) === null || _cache === void 0 ? void 0 : _cache.get(derivative);
					}
				});
				if ((_cache2 = cache) !== null && _cache2 !== void 0 && _cache2.value && updateCallTimes) cache.value[1] = this.cacheCallTimes++;
				return (_cache3 = cache) === null || _cache3 === void 0 ? void 0 : _cache3.value;
			}
		},
		{
			key: "get",
			value: function get(derivativeOption) {
				var _this$internalGet;
				return (_this$internalGet = this.internalGet(derivativeOption, true)) === null || _this$internalGet === void 0 ? void 0 : _this$internalGet[0];
			}
		},
		{
			key: "has",
			value: function has(derivativeOption) {
				return !!this.internalGet(derivativeOption);
			}
		},
		{
			key: "set",
			value: function set(derivativeOption, value) {
				var _this = this;
				if (!this.has(derivativeOption)) {
					if (this.size() + 1 > ThemeCache.MAX_CACHE_SIZE + ThemeCache.MAX_CACHE_OFFSET) {
						var targetKey = _slicedToArray(this.keys.reduce(function(result, key) {
							var callTimes = _slicedToArray(result, 2)[1];
							if (_this.internalGet(key)[1] < callTimes) return [key, _this.internalGet(key)[1]];
							return result;
						}, [this.keys[0], this.cacheCallTimes]), 1)[0];
						this.delete(targetKey);
					}
					this.keys.push(derivativeOption);
				}
				var cache = this.cache;
				derivativeOption.forEach(function(derivative, index) {
					if (index === derivativeOption.length - 1) cache.set(derivative, { value: [value, _this.cacheCallTimes++] });
					else {
						var cacheValue = cache.get(derivative);
						if (!cacheValue) cache.set(derivative, { map: /* @__PURE__ */ new Map() });
						else if (!cacheValue.map) cacheValue.map = /* @__PURE__ */ new Map();
						cache = cache.get(derivative).map;
					}
				});
			}
		},
		{
			key: "deleteByPath",
			value: function deleteByPath(currentCache, derivatives) {
				var cache = currentCache.get(derivatives[0]);
				if (derivatives.length === 1) {
					var _cache$value;
					if (!cache.map) currentCache.delete(derivatives[0]);
					else currentCache.set(derivatives[0], { map: cache.map });
					return (_cache$value = cache.value) === null || _cache$value === void 0 ? void 0 : _cache$value[0];
				}
				var result = this.deleteByPath(cache.map, derivatives.slice(1));
				if ((!cache.map || cache.map.size === 0) && !cache.value) currentCache.delete(derivatives[0]);
				return result;
			}
		},
		{
			key: "delete",
			value: function _delete(derivativeOption) {
				if (this.has(derivativeOption)) {
					this.keys = this.keys.filter(function(item) {
						return !sameDerivativeOption(item, derivativeOption);
					});
					return this.deleteByPath(this.cache, derivativeOption);
				}
			}
		}
	]);
	return ThemeCache;
}();
_defineProperty(ThemeCache, "MAX_CACHE_SIZE", 20);
_defineProperty(ThemeCache, "MAX_CACHE_OFFSET", 5);
//#endregion
//#region node_modules/@ant-design/cssinjs/es/theme/Theme.js
init_classCallCheck();
init_createClass();
init_defineProperty();
var uuid = 0;
/**
* Theme with algorithms to derive tokens from design tokens.
* Use `createTheme` first which will help to manage the theme instance cache.
*/
var Theme = /*#__PURE__*/ function() {
	function Theme(derivatives) {
		_classCallCheck(this, Theme);
		_defineProperty(this, "derivatives", void 0);
		_defineProperty(this, "id", void 0);
		this.derivatives = Array.isArray(derivatives) ? derivatives : [derivatives];
		this.id = uuid;
		if (derivatives.length === 0) warning(derivatives.length > 0, "[Ant Design CSS-in-JS] Theme should have at least one derivative function.");
		uuid += 1;
	}
	_createClass(Theme, [{
		key: "getDerivativeToken",
		value: function getDerivativeToken(token) {
			return this.derivatives.reduce(function(result, derivative) {
				return derivative(token, result);
			}, void 0);
		}
	}]);
	return Theme;
}();
//#endregion
//#region node_modules/@ant-design/cssinjs/es/theme/createTheme.js
var cacheThemes = new ThemeCache();
/**
* Same as new Theme, but will always return same one if `derivative` not changed.
*/
function createTheme(derivatives) {
	var derivativeArr = Array.isArray(derivatives) ? derivatives : [derivatives];
	if (!cacheThemes.has(derivativeArr)) cacheThemes.set(derivativeArr, new Theme(derivativeArr));
	return cacheThemes.get(derivativeArr);
}
//#endregion
//#region node_modules/@ant-design/cssinjs/es/util/index.js
init_defineProperty();
init_typeof();
var resultCache = /* @__PURE__ */ new WeakMap();
var RESULT_VALUE = {};
function memoResult(callback, deps) {
	var current = resultCache;
	for (var i = 0; i < deps.length; i += 1) {
		var dep = deps[i];
		if (!current.has(dep)) current.set(dep, /* @__PURE__ */ new WeakMap());
		current = current.get(dep);
	}
	if (!current.has(RESULT_VALUE)) current.set(RESULT_VALUE, callback());
	return current.get(RESULT_VALUE);
}
var flattenTokenCache = /* @__PURE__ */ new WeakMap();
/**
* Flatten token to string, this will auto cache the result when token not change
*/
function flattenToken(token) {
	var str = flattenTokenCache.get(token) || "";
	if (!str) {
		Object.keys(token).forEach(function(key) {
			var value = token[key];
			str += key;
			if (value instanceof Theme) str += value.id;
			else if (value && _typeof(value) === "object") str += flattenToken(value);
			else str += value;
		});
		str = murmur2(str);
		flattenTokenCache.set(token, str);
	}
	return str;
}
/**
* Convert derivative token to key string
*/
function token2key(token, salt) {
	return murmur2("".concat(salt, "_").concat(flattenToken(token)));
}
"random-".concat(Date.now(), "-").concat(Math.random()).replace(/\./g, "");
var isClientSide = canUseDom();
function unit(num) {
	if (typeof num === "number") return "".concat(num, "px");
	return num;
}
function toStyleStr(style, tokenKey, styleId) {
	var customizeAttrs = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
	if (arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : false) return style;
	var attrs = _objectSpread2(_objectSpread2({}, customizeAttrs), {}, _defineProperty(_defineProperty({}, ATTR_TOKEN, tokenKey), ATTR_MARK, styleId));
	var attrStr = Object.keys(attrs).map(function(attr) {
		var val = attrs[attr];
		return val ? "".concat(attr, "=\"").concat(val, "\"") : null;
	}).filter(function(v) {
		return v;
	}).join(" ");
	return "<style ".concat(attrStr, ">").concat(style, "</style>");
}
//#endregion
//#region node_modules/@ant-design/cssinjs/es/util/css-variables.js
init_slicedToArray();
var token2CSSVar = function token2CSSVar(token) {
	var prefix = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
	return "--".concat(prefix ? "".concat(prefix, "-") : "").concat(token).replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, "$1-$2").replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase();
};
var serializeCSSVar = function serializeCSSVar(cssVars, hashId, options) {
	if (!Object.keys(cssVars).length) return "";
	return ".".concat(hashId).concat(options !== null && options !== void 0 && options.scope ? ".".concat(options.scope) : "", "{").concat(Object.entries(cssVars).map(function(_ref) {
		var _ref2 = _slicedToArray(_ref, 2), key = _ref2[0], value = _ref2[1];
		return "".concat(key, ":").concat(value, ";");
	}).join(""), "}");
};
var transformToken = function transformToken(token, themeKey, config) {
	var cssVars = {};
	var result = {};
	Object.entries(token).forEach(function(_ref3) {
		var _config$preserve, _config$ignore;
		var _ref4 = _slicedToArray(_ref3, 2), key = _ref4[0], value = _ref4[1];
		if (config !== null && config !== void 0 && (_config$preserve = config.preserve) !== null && _config$preserve !== void 0 && _config$preserve[key]) result[key] = value;
		else if ((typeof value === "string" || typeof value === "number") && !(config !== null && config !== void 0 && (_config$ignore = config.ignore) !== null && _config$ignore !== void 0 && _config$ignore[key])) {
			var _config$unitless;
			var cssVar = token2CSSVar(key, config === null || config === void 0 ? void 0 : config.prefix);
			cssVars[cssVar] = typeof value === "number" && !(config !== null && config !== void 0 && (_config$unitless = config.unitless) !== null && _config$unitless !== void 0 && _config$unitless[key]) ? "".concat(value, "px") : String(value);
			result[key] = "var(".concat(cssVar, ")");
		}
	});
	return [result, serializeCSSVar(cssVars, themeKey, { scope: config === null || config === void 0 ? void 0 : config.scope })];
};
//#endregion
//#region node_modules/rc-util/es/hooks/useLayoutEffect.js
/**
* Wrap `React.useLayoutEffect` which will not throw warning message in test env
*/
var useInternalLayoutEffect = canUseDom() ? import_react.useLayoutEffect : import_react.useEffect;
var useLayoutEffect = function useLayoutEffect(callback, deps) {
	var firstMountRef = import_react.useRef(true);
	useInternalLayoutEffect(function() {
		return callback(firstMountRef.current);
	}, deps);
	useInternalLayoutEffect(function() {
		firstMountRef.current = false;
		return function() {
			firstMountRef.current = true;
		};
	}, []);
};
var useLayoutUpdateEffect = function useLayoutUpdateEffect(callback, deps) {
	useLayoutEffect(function(firstMount) {
		if (!firstMount) return callback();
	}, deps);
};
//#endregion
//#region node_modules/@ant-design/cssinjs/es/hooks/useCompatibleInsertionEffect.js
var useInsertionEffect = _objectSpread2({}, import_react).useInsertionEffect;
/**
* Compatible `useInsertionEffect`
* will use `useInsertionEffect` if React version >= 18,
* otherwise use `useInsertionEffectPolyfill`.
*/
var useCompatibleInsertionEffect = useInsertionEffect ? function(renderEffect, effect, deps) {
	return useInsertionEffect(function() {
		renderEffect();
		return effect();
	}, deps);
} : function useInsertionEffectPolyfill(renderEffect, effect, deps) {
	import_react.useMemo(renderEffect, deps);
	useLayoutEffect(function() {
		return effect(true);
	}, deps);
};
//#endregion
//#region node_modules/@ant-design/cssinjs/es/hooks/useEffectCleanupRegister.js
var useEffectCleanupRegister = typeof _objectSpread2({}, import_react).useInsertionEffect !== "undefined" ? function useCleanupRegister(deps) {
	var effectCleanups = [];
	var cleanupFlag = false;
	function register(fn) {
		if (cleanupFlag) {
			warning(false, "[Ant Design CSS-in-JS] You are registering a cleanup function after unmount, which will not have any effect.");
			return;
		}
		effectCleanups.push(fn);
	}
	import_react.useEffect(function() {
		cleanupFlag = false;
		return function() {
			cleanupFlag = true;
			if (effectCleanups.length) effectCleanups.forEach(function(fn) {
				return fn();
			});
		};
	}, deps);
	return register;
} : function useRun() {
	return function(fn) {
		fn();
	};
};
//#endregion
//#region node_modules/@ant-design/cssinjs/es/hooks/useHMR.js
var webpackHMR = false;
function useDevHMR() {
	return webpackHMR;
}
if (typeof module !== "undefined" && module && module.hot && typeof window !== "undefined") {
	var win = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : null;
	if (win && typeof win.webpackHotUpdate === "function") {
		var originWebpackHotUpdate = win.webpackHotUpdate;
		win.webpackHotUpdate = function() {
			webpackHMR = true;
			setTimeout(function() {
				webpackHMR = false;
			}, 0);
			return originWebpackHotUpdate.apply(void 0, arguments);
		};
	}
}
//#endregion
//#region node_modules/@ant-design/cssinjs/es/hooks/useGlobalCache.js
init_slicedToArray();
function useGlobalCache(prefix, keyPath, cacheFn, onCacheRemove, onCacheEffect) {
	var globalCache = import_react.useContext(StyleContext).cache;
	var fullPathStr = pathKey([prefix].concat(_toConsumableArray(keyPath)));
	var register = useEffectCleanupRegister([fullPathStr]);
	var HMRUpdate = useDevHMR();
	var buildCache = function buildCache(updater) {
		globalCache.opUpdate(fullPathStr, function(prevCache) {
			var _ref2 = _slicedToArray(prevCache || [void 0, void 0], 2), _ref2$ = _ref2[0], times = _ref2$ === void 0 ? 0 : _ref2$, cache = _ref2[1];
			var tmpCache = cache;
			if (cache && HMRUpdate) {
				onCacheRemove === null || onCacheRemove === void 0 || onCacheRemove(tmpCache, HMRUpdate);
				tmpCache = null;
			}
			var data = [times, tmpCache || cacheFn()];
			return updater ? updater(data) : data;
		});
	};
	import_react.useMemo(function() {
		buildCache();
	}, [fullPathStr]);
	var cacheEntity = globalCache.opGet(fullPathStr);
	if (!cacheEntity) {
		buildCache();
		cacheEntity = globalCache.opGet(fullPathStr);
	}
	var cacheContent = cacheEntity[1];
	useCompatibleInsertionEffect(function() {
		onCacheEffect === null || onCacheEffect === void 0 || onCacheEffect(cacheContent);
	}, function(polyfill) {
		buildCache(function(_ref3) {
			var _ref4 = _slicedToArray(_ref3, 2), times = _ref4[0], cache = _ref4[1];
			if (polyfill && times === 0) onCacheEffect === null || onCacheEffect === void 0 || onCacheEffect(cacheContent);
			return [times + 1, cache];
		});
		return function() {
			globalCache.opUpdate(fullPathStr, function(prevCache) {
				var _ref6 = _slicedToArray(prevCache || [], 2), _ref6$ = _ref6[0], times = _ref6$ === void 0 ? 0 : _ref6$, cache = _ref6[1];
				if (times - 1 === 0) {
					register(function() {
						if (polyfill || !globalCache.opGet(fullPathStr)) onCacheRemove === null || onCacheRemove === void 0 || onCacheRemove(cache, false);
					});
					return null;
				}
				return [times - 1, cache];
			});
		};
	}, [fullPathStr]);
	return cacheContent;
}
//#endregion
//#region node_modules/@ant-design/cssinjs/es/hooks/useCacheToken.js
init_slicedToArray();
init_toConsumableArray();
var EMPTY_OVERRIDE = {};
var hashPrefix = "css-dev-only-do-not-override";
var tokenKeys = /* @__PURE__ */ new Map();
function recordCleanToken(tokenKey) {
	tokenKeys.set(tokenKey, (tokenKeys.get(tokenKey) || 0) + 1);
}
function removeStyleTags(key, instanceId) {
	if (typeof document !== "undefined") document.querySelectorAll("style[".concat(ATTR_TOKEN, "=\"").concat(key, "\"]")).forEach(function(style) {
		if (style["__cssinjs_instance__"] === instanceId) {
			var _style$parentNode;
			(_style$parentNode = style.parentNode) === null || _style$parentNode === void 0 || _style$parentNode.removeChild(style);
		}
	});
}
var TOKEN_THRESHOLD = 0;
function cleanTokenStyle(tokenKey, instanceId) {
	tokenKeys.set(tokenKey, (tokenKeys.get(tokenKey) || 0) - 1);
	var cleanableKeyList = /* @__PURE__ */ new Set();
	tokenKeys.forEach(function(value, key) {
		if (value <= 0) cleanableKeyList.add(key);
	});
	if (tokenKeys.size - cleanableKeyList.size > TOKEN_THRESHOLD) cleanableKeyList.forEach(function(key) {
		removeStyleTags(key, instanceId);
		tokenKeys.delete(key);
	});
}
var getComputedToken$1 = function getComputedToken(originToken, overrideToken, theme, format) {
	var mergedDerivativeToken = _objectSpread2(_objectSpread2({}, theme.getDerivativeToken(originToken)), overrideToken);
	if (format) mergedDerivativeToken = format(mergedDerivativeToken);
	return mergedDerivativeToken;
};
var TOKEN_PREFIX = "token";
/**
* Cache theme derivative token as global shared one
* @param theme Theme entity
* @param tokens List of tokens, used for cache. Please do not dynamic generate object directly
* @param option Additional config
* @returns Call Theme.getDerivativeToken(tokenObject) to get token
*/
function useCacheToken(theme, tokens) {
	var option = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
	var _useContext = (0, import_react.useContext)(StyleContext), instanceId = _useContext.cache.instanceId, container = _useContext.container;
	var _option$salt = option.salt, salt = _option$salt === void 0 ? "" : _option$salt, _option$override = option.override, override = _option$override === void 0 ? EMPTY_OVERRIDE : _option$override, formatToken = option.formatToken, compute = option.getComputedToken, cssVar = option.cssVar;
	var mergedToken = memoResult(function() {
		return Object.assign.apply(Object, [{}].concat(_toConsumableArray(tokens)));
	}, tokens);
	var tokenStr = flattenToken(mergedToken);
	var overrideTokenStr = flattenToken(override);
	var cssVarStr = cssVar ? flattenToken(cssVar) : "";
	return useGlobalCache(TOKEN_PREFIX, [
		salt,
		theme.id,
		tokenStr,
		overrideTokenStr,
		cssVarStr
	], function() {
		var _cssVar$key;
		var mergedDerivativeToken = compute ? compute(mergedToken, override, theme) : getComputedToken$1(mergedToken, override, theme, formatToken);
		var actualToken = _objectSpread2({}, mergedDerivativeToken);
		var cssVarsStr = "";
		if (!!cssVar) {
			var _transformToken2 = _slicedToArray(transformToken(mergedDerivativeToken, cssVar.key, {
				prefix: cssVar.prefix,
				ignore: cssVar.ignore,
				unitless: cssVar.unitless,
				preserve: cssVar.preserve
			}), 2);
			mergedDerivativeToken = _transformToken2[0];
			cssVarsStr = _transformToken2[1];
		}
		var tokenKey = token2key(mergedDerivativeToken, salt);
		mergedDerivativeToken._tokenKey = tokenKey;
		actualToken._tokenKey = token2key(actualToken, salt);
		var themeKey = (_cssVar$key = cssVar === null || cssVar === void 0 ? void 0 : cssVar.key) !== null && _cssVar$key !== void 0 ? _cssVar$key : tokenKey;
		mergedDerivativeToken._themeKey = themeKey;
		recordCleanToken(themeKey);
		var hashId = "".concat(hashPrefix, "-").concat(murmur2(tokenKey));
		mergedDerivativeToken._hashId = hashId;
		return [
			mergedDerivativeToken,
			hashId,
			actualToken,
			cssVarsStr,
			(cssVar === null || cssVar === void 0 ? void 0 : cssVar.key) || ""
		];
	}, function(cache) {
		cleanTokenStyle(cache[0]._themeKey, instanceId);
	}, function(_ref) {
		var _ref2 = _slicedToArray(_ref, 4), token = _ref2[0], cssVarsStr = _ref2[3];
		if (cssVar && cssVarsStr) {
			var style = updateCSS(cssVarsStr, murmur2("css-variables-".concat(token._themeKey)), {
				mark: ATTR_MARK,
				prepend: "queue",
				attachTo: container,
				priority: -999
			});
			style[CSS_IN_JS_INSTANCE] = instanceId;
			style.setAttribute(ATTR_TOKEN, token._themeKey);
		}
	});
}
var extract$2 = function extract(cache, effectStyles, options) {
	var _cache = _slicedToArray(cache, 5), realToken = _cache[2], styleStr = _cache[3], cssVarKey = _cache[4];
	var plain = (options || {}).plain;
	if (!styleStr) return null;
	var styleId = realToken._tokenKey;
	var order = -999;
	return [
		order,
		styleId,
		toStyleStr(styleStr, cssVarKey, styleId, {
			"data-rc-order": "prependQueue",
			"data-rc-priority": "".concat(order)
		}, plain)
	];
};
//#endregion
//#region node_modules/@emotion/unitless/dist/unitless.browser.esm.js
init_extends();
var unitlessKeys = {
	animationIterationCount: 1,
	borderImageOutset: 1,
	borderImageSlice: 1,
	borderImageWidth: 1,
	boxFlex: 1,
	boxFlexGroup: 1,
	boxOrdinalGroup: 1,
	columnCount: 1,
	columns: 1,
	flex: 1,
	flexGrow: 1,
	flexPositive: 1,
	flexShrink: 1,
	flexNegative: 1,
	flexOrder: 1,
	gridRow: 1,
	gridRowEnd: 1,
	gridRowSpan: 1,
	gridRowStart: 1,
	gridColumn: 1,
	gridColumnEnd: 1,
	gridColumnSpan: 1,
	gridColumnStart: 1,
	msGridRow: 1,
	msGridRowSpan: 1,
	msGridColumn: 1,
	msGridColumnSpan: 1,
	fontWeight: 1,
	lineHeight: 1,
	opacity: 1,
	order: 1,
	orphans: 1,
	tabSize: 1,
	widows: 1,
	zIndex: 1,
	zoom: 1,
	WebkitLineClamp: 1,
	fillOpacity: 1,
	floodOpacity: 1,
	stopOpacity: 1,
	strokeDasharray: 1,
	strokeDashoffset: 1,
	strokeMiterlimit: 1,
	strokeOpacity: 1,
	strokeWidth: 1
};
//#endregion
//#region node_modules/stylis/src/Enum.js
var COMMENT = "comm";
var RULESET = "rule";
var DECLARATION = "decl";
var IMPORT = "@import";
var NAMESPACE = "@namespace";
var KEYFRAMES = "@keyframes";
var LAYER = "@layer";
//#endregion
//#region node_modules/stylis/src/Utility.js
/**
* @param {number}
* @return {number}
*/
var abs = Math.abs;
/**
* @param {number}
* @return {string}
*/
var from = String.fromCharCode;
/**
* @param {string} value
* @return {string}
*/
function trim(value) {
	return value.trim();
}
/**
* @param {string} value
* @param {(string|RegExp)} pattern
* @param {string} replacement
* @return {string}
*/
function replace(value, pattern, replacement) {
	return value.replace(pattern, replacement);
}
/**
* @param {string} value
* @param {string} search
* @param {number} position
* @return {number}
*/
function indexof(value, search, position) {
	return value.indexOf(search, position);
}
/**
* @param {string} value
* @param {number} index
* @return {number}
*/
function charat(value, index) {
	return value.charCodeAt(index) | 0;
}
/**
* @param {string} value
* @param {number} begin
* @param {number} end
* @return {string}
*/
function substr(value, begin, end) {
	return value.slice(begin, end);
}
/**
* @param {string} value
* @return {number}
*/
function strlen(value) {
	return value.length;
}
/**
* @param {any[]} value
* @return {number}
*/
function sizeof(value) {
	return value.length;
}
/**
* @param {any} value
* @param {any[]} array
* @return {any}
*/
function append(value, array) {
	return array.push(value), value;
}
//#endregion
//#region node_modules/stylis/src/Tokenizer.js
var line = 1;
var column = 1;
var length = 0;
var position = 0;
var character = 0;
var characters = "";
/**
* @param {string} value
* @param {object | null} root
* @param {object | null} parent
* @param {string} type
* @param {string[] | string} props
* @param {object[] | string} children
* @param {object[]} siblings
* @param {number} length
*/
function node(value, root, parent, type, props, children, length, siblings) {
	return {
		value,
		root,
		parent,
		type,
		props,
		children,
		line,
		column,
		length,
		return: "",
		siblings
	};
}
/**
* @return {number}
*/
function char() {
	return character;
}
/**
* @return {number}
*/
function prev() {
	character = position > 0 ? charat(characters, --position) : 0;
	if (column--, character === 10) column = 1, line--;
	return character;
}
/**
* @return {number}
*/
function next() {
	character = position < length ? charat(characters, position++) : 0;
	if (column++, character === 10) column = 1, line++;
	return character;
}
/**
* @return {number}
*/
function peek() {
	return charat(characters, position);
}
/**
* @return {number}
*/
function caret() {
	return position;
}
/**
* @param {number} begin
* @param {number} end
* @return {string}
*/
function slice(begin, end) {
	return substr(characters, begin, end);
}
/**
* @param {number} type
* @return {number}
*/
function token(type) {
	switch (type) {
		case 0:
		case 9:
		case 10:
		case 13:
		case 32: return 5;
		case 33:
		case 43:
		case 44:
		case 47:
		case 62:
		case 64:
		case 126:
		case 59:
		case 123:
		case 125: return 4;
		case 58: return 3;
		case 34:
		case 39:
		case 40:
		case 91: return 2;
		case 41:
		case 93: return 1;
	}
	return 0;
}
/**
* @param {string} value
* @return {any[]}
*/
function alloc(value) {
	return line = column = 1, length = strlen(characters = value), position = 0, [];
}
/**
* @param {any} value
* @return {any}
*/
function dealloc(value) {
	return characters = "", value;
}
/**
* @param {number} type
* @return {string}
*/
function delimit(type) {
	return trim(slice(position - 1, delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)));
}
/**
* @param {number} type
* @return {string}
*/
function whitespace(type) {
	while (character = peek()) if (character < 33) next();
	else break;
	return token(type) > 2 || token(character) > 3 ? "" : " ";
}
/**
* @param {number} index
* @param {number} count
* @return {string}
*/
function escaping(index, count) {
	while (--count && next()) if (character < 48 || character > 102 || character > 57 && character < 65 || character > 70 && character < 97) break;
	return slice(index, caret() + (count < 6 && peek() == 32 && next() == 32));
}
/**
* @param {number} type
* @return {number}
*/
function delimiter(type) {
	while (next()) switch (character) {
		case type: return position;
		case 34:
		case 39:
			if (type !== 34 && type !== 39) delimiter(character);
			break;
		case 40:
			if (type === 41) delimiter(type);
			break;
		case 92:
			next();
			break;
	}
	return position;
}
/**
* @param {number} type
* @param {number} index
* @return {number}
*/
function commenter(type, index) {
	while (next()) if (type + character === 57) break;
	else if (type + character === 84 && peek() === 47) break;
	return "/*" + slice(index, position - 1) + "*" + from(type === 47 ? type : next());
}
/**
* @param {number} index
* @return {string}
*/
function identifier(index) {
	while (!token(peek())) next();
	return slice(index, position);
}
//#endregion
//#region node_modules/stylis/src/Parser.js
/**
* @param {string} value
* @return {object[]}
*/
function compile(value) {
	return dealloc(parse("", null, null, null, [""], value = alloc(value), 0, [0], value));
}
/**
* @param {string} value
* @param {object} root
* @param {object?} parent
* @param {string[]} rule
* @param {string[]} rules
* @param {string[]} rulesets
* @param {number[]} pseudo
* @param {number[]} points
* @param {string[]} declarations
* @return {object}
*/
function parse(value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
	var index = 0;
	var offset = 0;
	var length = pseudo;
	var atrule = 0;
	var property = 0;
	var previous = 0;
	var variable = 1;
	var scanning = 1;
	var ampersand = 1;
	var character = 0;
	var type = "";
	var props = rules;
	var children = rulesets;
	var reference = rule;
	var characters = type;
	while (scanning) switch (previous = character, character = next()) {
		case 40: if (previous != 108 && charat(characters, length - 1) == 58) {
			if (indexof(characters += replace(delimit(character), "&", "&\f"), "&\f", abs(index ? points[index - 1] : 0)) != -1) ampersand = -1;
			break;
		}
		case 34:
		case 39:
		case 91:
			characters += delimit(character);
			break;
		case 9:
		case 10:
		case 13:
		case 32:
			characters += whitespace(previous);
			break;
		case 92:
			characters += escaping(caret() - 1, 7);
			continue;
		case 47:
			switch (peek()) {
				case 42:
				case 47:
					append(comment(commenter(next(), caret()), root, parent, declarations), declarations);
					if ((token(previous || 1) == 5 || token(peek() || 1) == 5) && strlen(characters) && substr(characters, -1, void 0) !== " ") characters += " ";
					break;
				default: characters += "/";
			}
			break;
		case 123 * variable: points[index++] = strlen(characters) * ampersand;
		case 125 * variable:
		case 59:
		case 0:
			switch (character) {
				case 0:
				case 125: scanning = 0;
				case 59 + offset:
					if (ampersand == -1) characters = replace(characters, /\f/g, "");
					if (property > 0 && (strlen(characters) - length || variable === 0 && previous === 47)) append(property > 32 ? declaration(characters + ";", rule, parent, length - 1, declarations) : declaration(replace(characters, " ", "") + ";", rule, parent, length - 2, declarations), declarations);
					break;
				case 59: characters += ";";
				default:
					append(reference = ruleset(characters, root, parent, index, offset, rules, points, type, props = [], children = [], length, rulesets), rulesets);
					if (character === 123) if (offset === 0) parse(characters, root, reference, reference, props, rulesets, length, points, children);
					else {
						switch (atrule) {
							case 99: if (charat(characters, 3) === 110) break;
							case 108: if (charat(characters, 2) === 97) break;
							default: offset = 0;
							case 100:
							case 109:
							case 115:
						}
						if (offset) parse(value, reference, reference, rule && append(ruleset(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length, children), children), rules, children, length, points, rule ? props : children);
						else parse(characters, reference, reference, reference, [""], children, 0, points, children);
					}
			}
			index = offset = property = 0, variable = ampersand = 1, type = characters = "", length = pseudo;
			break;
		case 58: length = 1 + strlen(characters), property = previous;
		default:
			if (variable < 1) {
				if (character == 123) --variable;
				else if (character == 125 && variable++ == 0 && prev() == 125) continue;
			}
			switch (characters += from(character), character * variable) {
				case 38:
					ampersand = offset > 0 ? 1 : (characters += "\f", -1);
					break;
				case 44:
					points[index++] = (strlen(characters) - 1) * ampersand, ampersand = 1;
					break;
				case 64:
					if (peek() === 45) characters += delimit(next());
					atrule = peek(), offset = length = strlen(type = characters += identifier(caret())), character++;
					break;
				case 45: if (previous === 45 && strlen(characters) == 2) variable = 0;
			}
	}
	return rulesets;
}
/**
* @param {string} value
* @param {object} root
* @param {object?} parent
* @param {number} index
* @param {number} offset
* @param {string[]} rules
* @param {number[]} points
* @param {string} type
* @param {string[]} props
* @param {string[]} children
* @param {number} length
* @param {object[]} siblings
* @return {object}
*/
function ruleset(value, root, parent, index, offset, rules, points, type, props, children, length, siblings) {
	var post = offset - 1;
	var rule = offset === 0 ? rules : [""];
	var size = sizeof(rule);
	for (var i = 0, j = 0, k = 0; i < index; ++i) for (var x = 0, y = substr(value, post + 1, post = abs(j = points[i])), z = value; x < size; ++x) if (z = trim(j > 0 ? rule[x] + " " + y : replace(y, /&\f/g, rule[x]))) props[k++] = z;
	return node(value, root, parent, offset === 0 ? RULESET : type, props, children, length, siblings);
}
/**
* @param {number} value
* @param {object} root
* @param {object?} parent
* @param {object[]} siblings
* @return {object}
*/
function comment(value, root, parent, siblings) {
	return node(value, root, parent, COMMENT, from(char()), substr(value, 2, -2), 0, siblings);
}
/**
* @param {string} value
* @param {object} root
* @param {object?} parent
* @param {number} length
* @param {object[]} siblings
* @return {object}
*/
function declaration(value, root, parent, length, siblings) {
	return node(value, root, parent, DECLARATION, substr(value, 0, length), substr(value, length + 1, -1), length, siblings);
}
//#endregion
//#region node_modules/stylis/src/Serializer.js
/**
* @param {object[]} children
* @param {function} callback
* @return {string}
*/
function serialize(children, callback) {
	var output = "";
	for (var i = 0; i < children.length; i++) output += callback(children[i], i, children, callback) || "";
	return output;
}
/**
* @param {object} element
* @param {number} index
* @param {object[]} children
* @param {function} callback
* @return {string}
*/
function stringify(element, index, children, callback) {
	switch (element.type) {
		case LAYER: if (element.children.length) break;
		case IMPORT:
		case NAMESPACE:
		case DECLARATION: return element.return = element.return || element.value;
		case COMMENT: return "";
		case KEYFRAMES: return element.return = element.value + "{" + serialize(element.children, callback) + "}";
		case RULESET: if (!strlen(element.value = element.props.join(","))) return "";
	}
	return strlen(children = serialize(element.children, callback)) ? element.return = element.value + "{" + children + "}" : "";
}
//#endregion
//#region node_modules/@ant-design/cssinjs/es/linters/utils.js
function lintWarning(message, info) {
	var path = info.path, parentSelectors = info.parentSelectors;
	warningOnce(false, "[Ant Design CSS-in-JS] ".concat(path ? "Error in ".concat(path, ": ") : "").concat(message).concat(parentSelectors.length ? " Selector: ".concat(parentSelectors.join(" | ")) : ""));
}
//#endregion
//#region node_modules/@ant-design/cssinjs/es/linters/contentQuotesLinter.js
var linter$1 = function linter(key, value, info) {
	if (key === "content") {
		if (typeof value !== "string" || [
			"normal",
			"none",
			"initial",
			"inherit",
			"unset"
		].indexOf(value) === -1 && !/(attr|counters?|url|(((repeating-)?(linear|radial))|conic)-gradient)\(|(no-)?(open|close)-quote/.test(value) && (value.charAt(0) !== value.charAt(value.length - 1) || value.charAt(0) !== "\"" && value.charAt(0) !== "'")) lintWarning("You seem to be using a value for 'content' without quotes, try replacing it with `content: '\"".concat(value, "\"'`."), info);
	}
};
//#endregion
//#region node_modules/@ant-design/cssinjs/es/linters/hashedAnimationLinter.js
var linter = function linter(key, value, info) {
	if (key === "animation") {
		if (info.hashId && value !== "none") lintWarning("You seem to be using hashed animation '".concat(value, "', in which case 'animationName' with Keyframe as value is recommended."), info);
	}
};
//#endregion
//#region node_modules/@ant-design/cssinjs/es/util/cacheMapUtil.js
init_slicedToArray();
var ATTR_CACHE_MAP = "data-ant-cssinjs-cache-path";
/**
* This marks style from the css file.
* Which means not exist in `<style />` tag.
*/
var CSS_FILE_STYLE = "_FILE_STYLE__";
var cachePathMap;
var fromCSSFile = true;
function prepare() {
	if (!cachePathMap) {
		cachePathMap = {};
		if (canUseDom()) {
			var div = document.createElement("div");
			div.className = ATTR_CACHE_MAP;
			div.style.position = "fixed";
			div.style.visibility = "hidden";
			div.style.top = "-9999px";
			document.body.appendChild(div);
			var content = getComputedStyle(div).content || "";
			content = content.replace(/^"/, "").replace(/"$/, "");
			content.split(";").forEach(function(item) {
				var _item$split2 = _slicedToArray(item.split(":"), 2), path = _item$split2[0], hash = _item$split2[1];
				cachePathMap[path] = hash;
			});
			var inlineMapStyle = document.querySelector("style[".concat(ATTR_CACHE_MAP, "]"));
			if (inlineMapStyle) {
				var _inlineMapStyle$paren;
				fromCSSFile = false;
				(_inlineMapStyle$paren = inlineMapStyle.parentNode) === null || _inlineMapStyle$paren === void 0 || _inlineMapStyle$paren.removeChild(inlineMapStyle);
			}
			document.body.removeChild(div);
		}
	}
}
function existPath(path) {
	prepare();
	return !!cachePathMap[path];
}
function getStyleAndHash(path) {
	var hash = cachePathMap[path];
	var styleStr = null;
	if (hash && canUseDom()) if (fromCSSFile) styleStr = CSS_FILE_STYLE;
	else {
		var _style = document.querySelector("style[".concat(ATTR_MARK, "=\"").concat(cachePathMap[path], "\"]"));
		if (_style) styleStr = _style.innerHTML;
		else delete cachePathMap[path];
	}
	return [styleStr, hash];
}
//#endregion
//#region node_modules/@ant-design/cssinjs/es/hooks/useStyleRegister.js
init_defineProperty();
init_slicedToArray();
init_toConsumableArray();
init_typeof();
var SKIP_CHECK = "_skip_check_";
var MULTI_VALUE = "_multi_value_";
function normalizeStyle(styleStr) {
	return serialize(compile(styleStr), stringify).replace(/\{%%%\:[^;];}/g, ";");
}
function isCompoundCSSProperty(value) {
	return _typeof(value) === "object" && value && (SKIP_CHECK in value || MULTI_VALUE in value);
}
function injectSelectorHash(key, hashId, hashPriority) {
	if (!hashId) return key;
	var hashClassName = ".".concat(hashId);
	var hashSelector = hashPriority === "low" ? ":where(".concat(hashClassName, ")") : hashClassName;
	return key.split(",").map(function(k) {
		var _firstPath$match;
		var fullPath = k.trim().split(/\s+/);
		var firstPath = fullPath[0] || "";
		var htmlElement = ((_firstPath$match = firstPath.match(/^\w+/)) === null || _firstPath$match === void 0 ? void 0 : _firstPath$match[0]) || "";
		firstPath = "".concat(htmlElement).concat(hashSelector).concat(firstPath.slice(htmlElement.length));
		return [firstPath].concat(_toConsumableArray(fullPath.slice(1))).join(" ");
	}).join(",");
}
var parseStyle = function parseStyle(interpolation) {
	var config = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	var _ref = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
		root: true,
		parentSelectors: []
	}, root = _ref.root, injectHash = _ref.injectHash, parentSelectors = _ref.parentSelectors;
	var hashId = config.hashId, layer = config.layer, path = config.path, hashPriority = config.hashPriority, _config$transformers = config.transformers, transformers = _config$transformers === void 0 ? [] : _config$transformers, _config$linters = config.linters, linters = _config$linters === void 0 ? [] : _config$linters;
	var styleStr = "";
	var effectStyle = {};
	function parseKeyframes(keyframes) {
		var animationName = keyframes.getName(hashId);
		if (!effectStyle[animationName]) {
			var _parsedStr = _slicedToArray(parseStyle(keyframes.style, config, {
				root: false,
				parentSelectors
			}), 1)[0];
			effectStyle[animationName] = "@keyframes ".concat(keyframes.getName(hashId)).concat(_parsedStr);
		}
	}
	function flattenList(list) {
		var fullList = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
		list.forEach(function(item) {
			if (Array.isArray(item)) flattenList(item, fullList);
			else if (item) fullList.push(item);
		});
		return fullList;
	}
	flattenList(Array.isArray(interpolation) ? interpolation : [interpolation]).forEach(function(originStyle) {
		var style = typeof originStyle === "string" && !root ? {} : originStyle;
		if (typeof style === "string") styleStr += "".concat(style, "\n");
		else if (style._keyframe) parseKeyframes(style);
		else {
			var mergedStyle = transformers.reduce(function(prev, trans) {
				var _trans$visit;
				return (trans === null || trans === void 0 || (_trans$visit = trans.visit) === null || _trans$visit === void 0 ? void 0 : _trans$visit.call(trans, prev)) || prev;
			}, style);
			Object.keys(mergedStyle).forEach(function(key) {
				var value = mergedStyle[key];
				if (_typeof(value) === "object" && value && (key !== "animationName" || !value._keyframe) && !isCompoundCSSProperty(value)) {
					var subInjectHash = false;
					var mergedKey = key.trim();
					var nextRoot = false;
					if ((root || injectHash) && hashId) if (mergedKey.startsWith("@")) subInjectHash = true;
					else if (mergedKey === "&") mergedKey = injectSelectorHash("", hashId, hashPriority);
					else mergedKey = injectSelectorHash(key, hashId, hashPriority);
					else if (root && !hashId && (mergedKey === "&" || mergedKey === "")) {
						mergedKey = "";
						nextRoot = true;
					}
					var _parseStyle4 = _slicedToArray(parseStyle(value, config, {
						root: nextRoot,
						injectHash: subInjectHash,
						parentSelectors: [].concat(_toConsumableArray(parentSelectors), [mergedKey])
					}), 2), _parsedStr2 = _parseStyle4[0], childEffectStyle = _parseStyle4[1];
					effectStyle = _objectSpread2(_objectSpread2({}, effectStyle), childEffectStyle);
					styleStr += "".concat(mergedKey).concat(_parsedStr2);
				} else {
					var _value;
					function appendStyle(cssKey, cssValue) {
						if (_typeof(value) !== "object" || !(value !== null && value !== void 0 && value[SKIP_CHECK])) [linter$1, linter].concat(_toConsumableArray(linters)).forEach(function(linter) {
							return linter(cssKey, cssValue, {
								path,
								hashId,
								parentSelectors
							});
						});
						var styleName = cssKey.replace(/[A-Z]/g, function(match) {
							return "-".concat(match.toLowerCase());
						});
						var formatValue = cssValue;
						if (!unitlessKeys[cssKey] && typeof formatValue === "number" && formatValue !== 0) formatValue = "".concat(formatValue, "px");
						if (cssKey === "animationName" && cssValue !== null && cssValue !== void 0 && cssValue._keyframe) {
							parseKeyframes(cssValue);
							formatValue = cssValue.getName(hashId);
						}
						styleStr += "".concat(styleName, ":").concat(formatValue, ";");
					}
					var actualValue = (_value = value === null || value === void 0 ? void 0 : value.value) !== null && _value !== void 0 ? _value : value;
					if (_typeof(value) === "object" && value !== null && value !== void 0 && value[MULTI_VALUE] && Array.isArray(actualValue)) actualValue.forEach(function(item) {
						appendStyle(key, item);
					});
					else appendStyle(key, actualValue);
				}
			});
		}
	});
	if (!root) styleStr = "{".concat(styleStr, "}");
	else if (layer) {
		if (styleStr) styleStr = "@layer ".concat(layer.name, " {").concat(styleStr, "}");
		if (layer.dependencies) effectStyle["@layer ".concat(layer.name)] = layer.dependencies.map(function(deps) {
			return "@layer ".concat(deps, ", ").concat(layer.name, ";");
		}).join("\n");
	}
	return [styleStr, effectStyle];
};
function uniqueHash(path, styleStr) {
	return murmur2("".concat(path.join("%")).concat(styleStr));
}
function Empty() {
	return null;
}
var STYLE_PREFIX = "style";
/**
* Register a style to the global style sheet.
*/
function useStyleRegister(info, styleFn) {
	var token = info.token, path = info.path, hashId = info.hashId, layer = info.layer, nonce = info.nonce, clientOnly = info.clientOnly, _info$order = info.order, order = _info$order === void 0 ? 0 : _info$order;
	var _React$useContext = import_react.useContext(StyleContext), autoClear = _React$useContext.autoClear, mock = _React$useContext.mock, defaultCache = _React$useContext.defaultCache, hashPriority = _React$useContext.hashPriority, container = _React$useContext.container, ssrInline = _React$useContext.ssrInline, transformers = _React$useContext.transformers, linters = _React$useContext.linters, cache = _React$useContext.cache, enableLayer = _React$useContext.layer;
	var tokenKey = token._tokenKey;
	var fullPath = [tokenKey];
	if (enableLayer) fullPath.push("layer");
	fullPath.push.apply(fullPath, _toConsumableArray(path));
	var isMergedClientSide = isClientSide;
	if (mock !== void 0) isMergedClientSide = mock === "client";
	var _useGlobalCache2 = _slicedToArray(useGlobalCache(STYLE_PREFIX, fullPath, function() {
		var cachePath = fullPath.join("|");
		if (existPath(cachePath)) {
			var _getStyleAndHash2 = _slicedToArray(getStyleAndHash(cachePath), 2), inlineCacheStyleStr = _getStyleAndHash2[0], styleHash = _getStyleAndHash2[1];
			if (inlineCacheStyleStr) return [
				inlineCacheStyleStr,
				tokenKey,
				styleHash,
				{},
				clientOnly,
				order
			];
		}
		var _parseStyle6 = _slicedToArray(parseStyle(styleFn(), {
			hashId,
			hashPriority,
			layer: enableLayer ? layer : void 0,
			path: path.join("-"),
			transformers,
			linters
		}), 2), parsedStyle = _parseStyle6[0], effectStyle = _parseStyle6[1];
		var styleStr = normalizeStyle(parsedStyle);
		return [
			styleStr,
			tokenKey,
			uniqueHash(fullPath, styleStr),
			effectStyle,
			clientOnly,
			order
		];
	}, function(_ref2, fromHMR) {
		var styleId = _slicedToArray(_ref2, 3)[2];
		if ((fromHMR || autoClear) && isClientSide) removeCSS(styleId, {
			mark: ATTR_MARK,
			attachTo: container
		});
	}, function(_ref4) {
		var _ref5 = _slicedToArray(_ref4, 4), styleStr = _ref5[0];
		_ref5[1];
		var styleId = _ref5[2], effectStyle = _ref5[3];
		if (isMergedClientSide && styleStr !== "_FILE_STYLE__") {
			var mergedCSSConfig = {
				mark: ATTR_MARK,
				prepend: enableLayer ? false : "queue",
				attachTo: container,
				priority: order
			};
			var nonceStr = typeof nonce === "function" ? nonce() : nonce;
			if (nonceStr) mergedCSSConfig.csp = { nonce: nonceStr };
			var effectLayerKeys = [];
			var effectRestKeys = [];
			Object.keys(effectStyle).forEach(function(key) {
				if (key.startsWith("@layer")) effectLayerKeys.push(key);
				else effectRestKeys.push(key);
			});
			effectLayerKeys.forEach(function(effectKey) {
				updateCSS(normalizeStyle(effectStyle[effectKey]), "_layer-".concat(effectKey), _objectSpread2(_objectSpread2({}, mergedCSSConfig), {}, { prepend: true }));
			});
			var style = updateCSS(styleStr, styleId, mergedCSSConfig);
			style[CSS_IN_JS_INSTANCE] = cache.instanceId;
			style.setAttribute(ATTR_TOKEN, tokenKey);
			style.setAttribute(ATTR_CACHE_PATH, fullPath.join("|"));
			effectRestKeys.forEach(function(effectKey) {
				updateCSS(normalizeStyle(effectStyle[effectKey]), "_effect-".concat(effectKey), mergedCSSConfig);
			});
		}
	}), 3), cachedStyleStr = _useGlobalCache2[0], cachedTokenKey = _useGlobalCache2[1], cachedStyleId = _useGlobalCache2[2];
	return function(node) {
		var styleNode;
		if (!ssrInline || isMergedClientSide || !defaultCache) styleNode = /*#__PURE__*/ import_react.createElement(Empty, null);
		else styleNode = /*#__PURE__*/ import_react.createElement("style", _extends({}, _defineProperty(_defineProperty({}, ATTR_TOKEN, cachedTokenKey), ATTR_MARK, cachedStyleId), { dangerouslySetInnerHTML: { __html: cachedStyleStr } }));
		return /*#__PURE__*/ import_react.createElement(import_react.Fragment, null, styleNode, node);
	};
}
var extract$1 = function extract(cache, effectStyles, options) {
	var _cache = _slicedToArray(cache, 6), styleStr = _cache[0], tokenKey = _cache[1], styleId = _cache[2], effectStyle = _cache[3], clientOnly = _cache[4], order = _cache[5];
	var plain = (options || {}).plain;
	if (clientOnly) return null;
	var keyStyleText = styleStr;
	var sharedAttrs = {
		"data-rc-order": "prependQueue",
		"data-rc-priority": "".concat(order)
	};
	keyStyleText = toStyleStr(styleStr, tokenKey, styleId, sharedAttrs, plain);
	if (effectStyle) Object.keys(effectStyle).forEach(function(effectKey) {
		if (!effectStyles[effectKey]) {
			effectStyles[effectKey] = true;
			var effectStyleHTML = toStyleStr(normalizeStyle(effectStyle[effectKey]), tokenKey, "_effect-".concat(effectKey), sharedAttrs, plain);
			if (effectKey.startsWith("@layer")) keyStyleText = effectStyleHTML + keyStyleText;
			else keyStyleText += effectStyleHTML;
		}
	});
	return [
		order,
		styleId,
		keyStyleText
	];
};
//#endregion
//#region node_modules/@ant-design/cssinjs/es/hooks/useCSSVarRegister.js
init_slicedToArray();
init_toConsumableArray();
var CSS_VAR_PREFIX = "cssVar";
var useCSSVarRegister = function useCSSVarRegister(config, fn) {
	var key = config.key, prefix = config.prefix, unitless = config.unitless, ignore = config.ignore, token = config.token, _config$scope = config.scope, scope = _config$scope === void 0 ? "" : _config$scope;
	var _useContext = (0, import_react.useContext)(StyleContext), instanceId = _useContext.cache.instanceId, container = _useContext.container;
	var tokenKey = token._tokenKey;
	var stylePath = [].concat(_toConsumableArray(config.path), [
		key,
		scope,
		tokenKey
	]);
	return useGlobalCache(CSS_VAR_PREFIX, stylePath, function() {
		var _transformToken2 = _slicedToArray(transformToken(fn(), key, {
			prefix,
			unitless,
			ignore,
			scope
		}), 2), mergedToken = _transformToken2[0], cssVarsStr = _transformToken2[1];
		return [
			mergedToken,
			cssVarsStr,
			uniqueHash(stylePath, cssVarsStr),
			key
		];
	}, function(_ref) {
		var styleId = _slicedToArray(_ref, 3)[2];
		if (isClientSide) removeCSS(styleId, {
			mark: ATTR_MARK,
			attachTo: container
		});
	}, function(_ref3) {
		var _ref4 = _slicedToArray(_ref3, 3), cssVarsStr = _ref4[1], styleId = _ref4[2];
		if (!cssVarsStr) return;
		var style = updateCSS(cssVarsStr, styleId, {
			mark: ATTR_MARK,
			prepend: "queue",
			attachTo: container,
			priority: -999
		});
		style[CSS_IN_JS_INSTANCE] = instanceId;
		style.setAttribute(ATTR_TOKEN, key);
	});
};
var extract = function extract(cache, effectStyles, options) {
	var _cache = _slicedToArray(cache, 4), styleStr = _cache[1], styleId = _cache[2], cssVarKey = _cache[3];
	var plain = (options || {}).plain;
	if (!styleStr) return null;
	var order = -999;
	return [
		order,
		styleId,
		toStyleStr(styleStr, cssVarKey, styleId, {
			"data-rc-order": "prependQueue",
			"data-rc-priority": "".concat(order)
		}, plain)
	];
};
//#endregion
//#region node_modules/@ant-design/cssinjs/es/extractStyle.js
init_defineProperty();
_defineProperty(_defineProperty(_defineProperty({}, STYLE_PREFIX, extract$1), TOKEN_PREFIX, extract$2), CSS_VAR_PREFIX, extract);
//#endregion
//#region node_modules/@ant-design/cssinjs/es/transformers/legacyLogicalProperties.js
init_slicedToArray();
function splitValues(value) {
	if (typeof value === "number") return [[value], false];
	var rawStyle = String(value).trim();
	var importantCells = rawStyle.match(/(.*)(!important)/);
	var splitStyle = (importantCells ? importantCells[1] : rawStyle).trim().split(/\s+/);
	var temp = [];
	var brackets = 0;
	return [splitStyle.reduce(function(list, item) {
		if (item.includes("(") || item.includes(")")) {
			var left = item.split("(").length - 1;
			var right = item.split(")").length - 1;
			brackets += left - right;
		}
		if (brackets >= 0) temp.push(item);
		if (brackets === 0) {
			list.push(temp.join(" "));
			temp = [];
		}
		return list;
	}, []), !!importantCells];
}
function noSplit(list) {
	list.notSplit = true;
	return list;
}
var keyMap = {
	inset: [
		"top",
		"right",
		"bottom",
		"left"
	],
	insetBlock: ["top", "bottom"],
	insetBlockStart: ["top"],
	insetBlockEnd: ["bottom"],
	insetInline: ["left", "right"],
	insetInlineStart: ["left"],
	insetInlineEnd: ["right"],
	marginBlock: ["marginTop", "marginBottom"],
	marginBlockStart: ["marginTop"],
	marginBlockEnd: ["marginBottom"],
	marginInline: ["marginLeft", "marginRight"],
	marginInlineStart: ["marginLeft"],
	marginInlineEnd: ["marginRight"],
	paddingBlock: ["paddingTop", "paddingBottom"],
	paddingBlockStart: ["paddingTop"],
	paddingBlockEnd: ["paddingBottom"],
	paddingInline: ["paddingLeft", "paddingRight"],
	paddingInlineStart: ["paddingLeft"],
	paddingInlineEnd: ["paddingRight"],
	borderBlock: noSplit(["borderTop", "borderBottom"]),
	borderBlockStart: noSplit(["borderTop"]),
	borderBlockEnd: noSplit(["borderBottom"]),
	borderInline: noSplit(["borderLeft", "borderRight"]),
	borderInlineStart: noSplit(["borderLeft"]),
	borderInlineEnd: noSplit(["borderRight"]),
	borderBlockWidth: ["borderTopWidth", "borderBottomWidth"],
	borderBlockStartWidth: ["borderTopWidth"],
	borderBlockEndWidth: ["borderBottomWidth"],
	borderInlineWidth: ["borderLeftWidth", "borderRightWidth"],
	borderInlineStartWidth: ["borderLeftWidth"],
	borderInlineEndWidth: ["borderRightWidth"],
	borderBlockStyle: ["borderTopStyle", "borderBottomStyle"],
	borderBlockStartStyle: ["borderTopStyle"],
	borderBlockEndStyle: ["borderBottomStyle"],
	borderInlineStyle: ["borderLeftStyle", "borderRightStyle"],
	borderInlineStartStyle: ["borderLeftStyle"],
	borderInlineEndStyle: ["borderRightStyle"],
	borderBlockColor: ["borderTopColor", "borderBottomColor"],
	borderBlockStartColor: ["borderTopColor"],
	borderBlockEndColor: ["borderBottomColor"],
	borderInlineColor: ["borderLeftColor", "borderRightColor"],
	borderInlineStartColor: ["borderLeftColor"],
	borderInlineEndColor: ["borderRightColor"],
	borderStartStartRadius: ["borderTopLeftRadius"],
	borderStartEndRadius: ["borderTopRightRadius"],
	borderEndStartRadius: ["borderBottomLeftRadius"],
	borderEndEndRadius: ["borderBottomRightRadius"]
};
function wrapImportantAndSkipCheck(value, important) {
	var parsedValue = value;
	if (important) parsedValue = "".concat(parsedValue, " !important");
	return {
		_skip_check_: true,
		value: parsedValue
	};
}
/**
* Convert css logical properties to legacy properties.
* Such as: `margin-block-start` to `margin-top`.
* Transform list:
* - inset
* - margin
* - padding
* - border
*/
var transform = { visit: function visit(cssObj) {
	var clone = {};
	Object.keys(cssObj).forEach(function(key) {
		var value = cssObj[key];
		var matchValue = keyMap[key];
		if (matchValue && (typeof value === "number" || typeof value === "string")) {
			var _splitValues2 = _slicedToArray(splitValues(value), 2), _values = _splitValues2[0], _important = _splitValues2[1];
			if (matchValue.length && matchValue.notSplit) matchValue.forEach(function(matchKey) {
				clone[matchKey] = wrapImportantAndSkipCheck(value, _important);
			});
			else if (matchValue.length === 1) clone[matchValue[0]] = wrapImportantAndSkipCheck(_values[0], _important);
			else if (matchValue.length === 2) matchValue.forEach(function(matchKey, index) {
				var _values$index;
				clone[matchKey] = wrapImportantAndSkipCheck((_values$index = _values[index]) !== null && _values$index !== void 0 ? _values$index : _values[0], _important);
			});
			else if (matchValue.length === 4) matchValue.forEach(function(matchKey, index) {
				var _ref, _values$index2;
				clone[matchKey] = wrapImportantAndSkipCheck((_ref = (_values$index2 = _values[index]) !== null && _values$index2 !== void 0 ? _values$index2 : _values[index - 2]) !== null && _ref !== void 0 ? _ref : _values[0], _important);
			});
			else clone[key] = value;
		} else clone[key] = value;
	});
	return clone;
} };
//#endregion
//#region node_modules/antd/es/theme/themes/seed.js
var defaultPresetColors = {
	blue: "#1677FF",
	purple: "#722ED1",
	cyan: "#13C2C2",
	green: "#52C41A",
	magenta: "#EB2F96",
	/**
	* @deprecated Use magenta instead
	*/
	pink: "#EB2F96",
	red: "#F5222D",
	orange: "#FA8C16",
	yellow: "#FADB14",
	volcano: "#FA541C",
	geekblue: "#2F54EB",
	gold: "#FAAD14",
	lime: "#A0D911"
};
var seedToken = Object.assign(Object.assign({}, defaultPresetColors), {
	colorPrimary: "#1677ff",
	colorSuccess: "#52c41a",
	colorWarning: "#faad14",
	colorError: "#ff4d4f",
	colorInfo: "#1677ff",
	colorLink: "",
	colorTextBase: "",
	colorBgBase: "",
	fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
'Noto Color Emoji'`,
	fontFamilyCode: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace`,
	fontSize: 14,
	lineWidth: 1,
	lineType: "solid",
	motionUnit: .1,
	motionBase: 0,
	motionEaseOutCirc: "cubic-bezier(0.08, 0.82, 0.17, 1)",
	motionEaseInOutCirc: "cubic-bezier(0.78, 0.14, 0.15, 0.86)",
	motionEaseOut: "cubic-bezier(0.215, 0.61, 0.355, 1)",
	motionEaseInOut: "cubic-bezier(0.645, 0.045, 0.355, 1)",
	motionEaseOutBack: "cubic-bezier(0.12, 0.4, 0.29, 1.46)",
	motionEaseInBack: "cubic-bezier(0.71, -0.46, 0.88, 0.6)",
	motionEaseInQuint: "cubic-bezier(0.755, 0.05, 0.855, 0.06)",
	motionEaseOutQuint: "cubic-bezier(0.23, 1, 0.32, 1)",
	borderRadius: 6,
	sizeUnit: 4,
	sizeStep: 4,
	sizePopupArrow: 16,
	controlHeight: 32,
	zIndexBase: 0,
	zIndexPopupBase: 1e3,
	opacityImage: 1,
	wireframe: false,
	motion: true
});
//#endregion
//#region node_modules/@ant-design/fast-color/es/FastColor.js
init_defineProperty();
var round = Math.round;
/**
* Support format, alpha unit will check the % mark:
* - rgba(102, 204, 255, .5)      -> [102, 204, 255, 0.5]
* - rgb(102 204 255 / .5)        -> [102, 204, 255, 0.5]
* - rgb(100%, 50%, 0% / 50%)     -> [255, 128, 0, 0.5]
* - hsl(270, 60, 40, .5)         -> [270, 60, 40, 0.5]
* - hsl(270deg 60% 40% / 50%)   -> [270, 60, 40, 0.5]
*
* When `base` is provided, the percentage value will be divided by `base`.
*/
function splitColorStr(str, parseNum) {
	const match = str.replace(/^[^(]*\((.*)/, "$1").replace(/\).*/, "").match(/\d*\.?\d+%?/g) || [];
	const numList = match.map((item) => parseFloat(item));
	for (let i = 0; i < 3; i += 1) numList[i] = parseNum(numList[i] || 0, match[i] || "", i);
	if (match[3]) numList[3] = match[3].includes("%") ? numList[3] / 100 : numList[3];
	else numList[3] = 1;
	return numList;
}
var parseHSVorHSL = (num, _, index) => index === 0 ? num : num / 100;
/** round and limit number to integer between 0-255 */
function limitRange(value, max) {
	const mergedMax = max || 255;
	if (value > mergedMax) return mergedMax;
	if (value < 0) return 0;
	return value;
}
var FastColor = class FastColor {
	constructor(input) {
		/**
		* All FastColor objects are valid. So isValid is always true. This property is kept to be compatible with TinyColor.
		*/
		_defineProperty(this, "isValid", true);
		/**
		* Red, R in RGB
		*/
		_defineProperty(this, "r", 0);
		/**
		* Green, G in RGB
		*/
		_defineProperty(this, "g", 0);
		/**
		* Blue, B in RGB
		*/
		_defineProperty(this, "b", 0);
		/**
		* Alpha/Opacity, A in RGBA/HSLA
		*/
		_defineProperty(this, "a", 1);
		_defineProperty(this, "_h", void 0);
		_defineProperty(this, "_s", void 0);
		_defineProperty(this, "_l", void 0);
		_defineProperty(this, "_v", void 0);
		_defineProperty(this, "_max", void 0);
		_defineProperty(this, "_min", void 0);
		_defineProperty(this, "_brightness", void 0);
		/**
		* Always check 3 char in the object to determine the format.
		* We not use function in check to save bundle size.
		* e.g. 'rgb' -> { r: 0, g: 0, b: 0 }.
		*/
		function matchFormat(str) {
			return str[0] in input && str[1] in input && str[2] in input;
		}
		if (!input) {} else if (typeof input === "string") {
			const trimStr = input.trim();
			function matchPrefix(prefix) {
				return trimStr.startsWith(prefix);
			}
			if (/^#?[A-F\d]{3,8}$/i.test(trimStr)) this.fromHexString(trimStr);
			else if (matchPrefix("rgb")) this.fromRgbString(trimStr);
			else if (matchPrefix("hsl")) this.fromHslString(trimStr);
			else if (matchPrefix("hsv") || matchPrefix("hsb")) this.fromHsvString(trimStr);
		} else if (input instanceof FastColor) {
			this.r = input.r;
			this.g = input.g;
			this.b = input.b;
			this.a = input.a;
			this._h = input._h;
			this._s = input._s;
			this._l = input._l;
			this._v = input._v;
		} else if (matchFormat("rgb")) {
			this.r = limitRange(input.r);
			this.g = limitRange(input.g);
			this.b = limitRange(input.b);
			this.a = typeof input.a === "number" ? limitRange(input.a, 1) : 1;
		} else if (matchFormat("hsl")) this.fromHsl(input);
		else if (matchFormat("hsv")) this.fromHsv(input);
		else throw new Error("@ant-design/fast-color: unsupported input " + JSON.stringify(input));
	}
	setR(value) {
		return this._sc("r", value);
	}
	setG(value) {
		return this._sc("g", value);
	}
	setB(value) {
		return this._sc("b", value);
	}
	setA(value) {
		return this._sc("a", value, 1);
	}
	setHue(value) {
		const hsv = this.toHsv();
		hsv.h = value;
		return this._c(hsv);
	}
	/**
	* Returns the perceived luminance of a color, from 0-1.
	* @see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
	*/
	getLuminance() {
		function adjustGamma(raw) {
			const val = raw / 255;
			return val <= .03928 ? val / 12.92 : Math.pow((val + .055) / 1.055, 2.4);
		}
		const R = adjustGamma(this.r);
		const G = adjustGamma(this.g);
		const B = adjustGamma(this.b);
		return .2126 * R + .7152 * G + .0722 * B;
	}
	getHue() {
		if (typeof this._h === "undefined") {
			const delta = this.getMax() - this.getMin();
			if (delta === 0) this._h = 0;
			else this._h = round(60 * (this.r === this.getMax() ? (this.g - this.b) / delta + (this.g < this.b ? 6 : 0) : this.g === this.getMax() ? (this.b - this.r) / delta + 2 : (this.r - this.g) / delta + 4));
		}
		return this._h;
	}
	getSaturation() {
		if (typeof this._s === "undefined") {
			const delta = this.getMax() - this.getMin();
			if (delta === 0) this._s = 0;
			else this._s = delta / this.getMax();
		}
		return this._s;
	}
	getLightness() {
		if (typeof this._l === "undefined") this._l = (this.getMax() + this.getMin()) / 510;
		return this._l;
	}
	getValue() {
		if (typeof this._v === "undefined") this._v = this.getMax() / 255;
		return this._v;
	}
	/**
	* Returns the perceived brightness of the color, from 0-255.
	* Note: this is not the b of HSB
	* @see http://www.w3.org/TR/AERT#color-contrast
	*/
	getBrightness() {
		if (typeof this._brightness === "undefined") this._brightness = (this.r * 299 + this.g * 587 + this.b * 114) / 1e3;
		return this._brightness;
	}
	darken(amount = 10) {
		const h = this.getHue();
		const s = this.getSaturation();
		let l = this.getLightness() - amount / 100;
		if (l < 0) l = 0;
		return this._c({
			h,
			s,
			l,
			a: this.a
		});
	}
	lighten(amount = 10) {
		const h = this.getHue();
		const s = this.getSaturation();
		let l = this.getLightness() + amount / 100;
		if (l > 1) l = 1;
		return this._c({
			h,
			s,
			l,
			a: this.a
		});
	}
	/**
	* Mix the current color a given amount with another color, from 0 to 100.
	* 0 means no mixing (return current color).
	*/
	mix(input, amount = 50) {
		const color = this._c(input);
		const p = amount / 100;
		const calc = (key) => (color[key] - this[key]) * p + this[key];
		const rgba = {
			r: round(calc("r")),
			g: round(calc("g")),
			b: round(calc("b")),
			a: round(calc("a") * 100) / 100
		};
		return this._c(rgba);
	}
	/**
	* Mix the color with pure white, from 0 to 100.
	* Providing 0 will do nothing, providing 100 will always return white.
	*/
	tint(amount = 10) {
		return this.mix({
			r: 255,
			g: 255,
			b: 255,
			a: 1
		}, amount);
	}
	/**
	* Mix the color with pure black, from 0 to 100.
	* Providing 0 will do nothing, providing 100 will always return black.
	*/
	shade(amount = 10) {
		return this.mix({
			r: 0,
			g: 0,
			b: 0,
			a: 1
		}, amount);
	}
	onBackground(background) {
		const bg = this._c(background);
		const alpha = this.a + bg.a * (1 - this.a);
		const calc = (key) => {
			return round((this[key] * this.a + bg[key] * bg.a * (1 - this.a)) / alpha);
		};
		return this._c({
			r: calc("r"),
			g: calc("g"),
			b: calc("b"),
			a: alpha
		});
	}
	isDark() {
		return this.getBrightness() < 128;
	}
	isLight() {
		return this.getBrightness() >= 128;
	}
	equals(other) {
		return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
	}
	clone() {
		return this._c(this);
	}
	toHexString() {
		let hex = "#";
		const rHex = (this.r || 0).toString(16);
		hex += rHex.length === 2 ? rHex : "0" + rHex;
		const gHex = (this.g || 0).toString(16);
		hex += gHex.length === 2 ? gHex : "0" + gHex;
		const bHex = (this.b || 0).toString(16);
		hex += bHex.length === 2 ? bHex : "0" + bHex;
		if (typeof this.a === "number" && this.a >= 0 && this.a < 1) {
			const aHex = round(this.a * 255).toString(16);
			hex += aHex.length === 2 ? aHex : "0" + aHex;
		}
		return hex;
	}
	/** CSS support color pattern */
	toHsl() {
		return {
			h: this.getHue(),
			s: this.getSaturation(),
			l: this.getLightness(),
			a: this.a
		};
	}
	/** CSS support color pattern */
	toHslString() {
		const h = this.getHue();
		const s = round(this.getSaturation() * 100);
		const l = round(this.getLightness() * 100);
		return this.a !== 1 ? `hsla(${h},${s}%,${l}%,${this.a})` : `hsl(${h},${s}%,${l}%)`;
	}
	/** Same as toHsb */
	toHsv() {
		return {
			h: this.getHue(),
			s: this.getSaturation(),
			v: this.getValue(),
			a: this.a
		};
	}
	toRgb() {
		return {
			r: this.r,
			g: this.g,
			b: this.b,
			a: this.a
		};
	}
	toRgbString() {
		return this.a !== 1 ? `rgba(${this.r},${this.g},${this.b},${this.a})` : `rgb(${this.r},${this.g},${this.b})`;
	}
	toString() {
		return this.toRgbString();
	}
	/** Return a new FastColor object with one channel changed */
	_sc(rgb, value, max) {
		const clone = this.clone();
		clone[rgb] = limitRange(value, max);
		return clone;
	}
	_c(input) {
		return new this.constructor(input);
	}
	getMax() {
		if (typeof this._max === "undefined") this._max = Math.max(this.r, this.g, this.b);
		return this._max;
	}
	getMin() {
		if (typeof this._min === "undefined") this._min = Math.min(this.r, this.g, this.b);
		return this._min;
	}
	fromHexString(trimStr) {
		const withoutPrefix = trimStr.replace("#", "");
		function connectNum(index1, index2) {
			return parseInt(withoutPrefix[index1] + withoutPrefix[index2 || index1], 16);
		}
		if (withoutPrefix.length < 6) {
			this.r = connectNum(0);
			this.g = connectNum(1);
			this.b = connectNum(2);
			this.a = withoutPrefix[3] ? connectNum(3) / 255 : 1;
		} else {
			this.r = connectNum(0, 1);
			this.g = connectNum(2, 3);
			this.b = connectNum(4, 5);
			this.a = withoutPrefix[6] ? connectNum(6, 7) / 255 : 1;
		}
	}
	fromHsl({ h, s, l, a }) {
		this._h = h % 360;
		this._s = s;
		this._l = l;
		this.a = typeof a === "number" ? a : 1;
		if (s <= 0) {
			const rgb = round(l * 255);
			this.r = rgb;
			this.g = rgb;
			this.b = rgb;
		}
		let r = 0, g = 0, b = 0;
		const huePrime = h / 60;
		const chroma = (1 - Math.abs(2 * l - 1)) * s;
		const secondComponent = chroma * (1 - Math.abs(huePrime % 2 - 1));
		if (huePrime >= 0 && huePrime < 1) {
			r = chroma;
			g = secondComponent;
		} else if (huePrime >= 1 && huePrime < 2) {
			r = secondComponent;
			g = chroma;
		} else if (huePrime >= 2 && huePrime < 3) {
			g = chroma;
			b = secondComponent;
		} else if (huePrime >= 3 && huePrime < 4) {
			g = secondComponent;
			b = chroma;
		} else if (huePrime >= 4 && huePrime < 5) {
			r = secondComponent;
			b = chroma;
		} else if (huePrime >= 5 && huePrime < 6) {
			r = chroma;
			b = secondComponent;
		}
		const lightnessModification = l - chroma / 2;
		this.r = round((r + lightnessModification) * 255);
		this.g = round((g + lightnessModification) * 255);
		this.b = round((b + lightnessModification) * 255);
	}
	fromHsv({ h, s, v, a }) {
		this._h = h % 360;
		this._s = s;
		this._v = v;
		this.a = typeof a === "number" ? a : 1;
		const vv = round(v * 255);
		this.r = vv;
		this.g = vv;
		this.b = vv;
		if (s <= 0) return;
		const hh = h / 60;
		const i = Math.floor(hh);
		const ff = hh - i;
		const p = round(v * (1 - s) * 255);
		const q = round(v * (1 - s * ff) * 255);
		const t = round(v * (1 - s * (1 - ff)) * 255);
		switch (i) {
			case 0:
				this.g = t;
				this.b = p;
				break;
			case 1:
				this.r = q;
				this.b = p;
				break;
			case 2:
				this.r = p;
				this.b = t;
				break;
			case 3:
				this.r = p;
				this.g = q;
				break;
			case 4:
				this.r = t;
				this.g = p;
				break;
			default:
				this.g = p;
				this.b = q;
				break;
		}
	}
	fromHsvString(trimStr) {
		const cells = splitColorStr(trimStr, parseHSVorHSL);
		this.fromHsv({
			h: cells[0],
			s: cells[1],
			v: cells[2],
			a: cells[3]
		});
	}
	fromHslString(trimStr) {
		const cells = splitColorStr(trimStr, parseHSVorHSL);
		this.fromHsl({
			h: cells[0],
			s: cells[1],
			l: cells[2],
			a: cells[3]
		});
	}
	fromRgbString(trimStr) {
		const cells = splitColorStr(trimStr, (num, txt) => txt.includes("%") ? round(num / 100 * 255) : num);
		this.r = cells[0];
		this.g = cells[1];
		this.b = cells[2];
		this.a = cells[3];
	}
};
//#endregion
//#region node_modules/@ant-design/colors/es/generate.js
var hueStep = 2;
var saturationStep = .16;
var saturationStep2 = .05;
var brightnessStep1 = .05;
var brightnessStep2 = .15;
var lightColorCount = 5;
var darkColorCount = 4;
var darkColorMap = [
	{
		index: 7,
		amount: 15
	},
	{
		index: 6,
		amount: 25
	},
	{
		index: 5,
		amount: 30
	},
	{
		index: 5,
		amount: 45
	},
	{
		index: 5,
		amount: 65
	},
	{
		index: 5,
		amount: 85
	},
	{
		index: 4,
		amount: 90
	},
	{
		index: 3,
		amount: 95
	},
	{
		index: 2,
		amount: 97
	},
	{
		index: 1,
		amount: 98
	}
];
function getHue(hsv, i, light) {
	var hue;
	if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) hue = light ? Math.round(hsv.h) - hueStep * i : Math.round(hsv.h) + hueStep * i;
	else hue = light ? Math.round(hsv.h) + hueStep * i : Math.round(hsv.h) - hueStep * i;
	if (hue < 0) hue += 360;
	else if (hue >= 360) hue -= 360;
	return hue;
}
function getSaturation(hsv, i, light) {
	if (hsv.h === 0 && hsv.s === 0) return hsv.s;
	var saturation;
	if (light) saturation = hsv.s - saturationStep * i;
	else if (i === darkColorCount) saturation = hsv.s + saturationStep;
	else saturation = hsv.s + saturationStep2 * i;
	if (saturation > 1) saturation = 1;
	if (light && i === lightColorCount && saturation > .1) saturation = .1;
	if (saturation < .06) saturation = .06;
	return Math.round(saturation * 100) / 100;
}
function getValue(hsv, i, light) {
	var value;
	if (light) value = hsv.v + brightnessStep1 * i;
	else value = hsv.v - brightnessStep2 * i;
	value = Math.max(0, Math.min(1, value));
	return Math.round(value * 100) / 100;
}
function generate(color) {
	var opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	var patterns = [];
	var pColor = new FastColor(color);
	var hsv = pColor.toHsv();
	for (var i = lightColorCount; i > 0; i -= 1) {
		var c = new FastColor({
			h: getHue(hsv, i, true),
			s: getSaturation(hsv, i, true),
			v: getValue(hsv, i, true)
		});
		patterns.push(c);
	}
	patterns.push(pColor);
	for (var _i = 1; _i <= darkColorCount; _i += 1) {
		var _c = new FastColor({
			h: getHue(hsv, _i),
			s: getSaturation(hsv, _i),
			v: getValue(hsv, _i)
		});
		patterns.push(_c);
	}
	if (opts.theme === "dark") return darkColorMap.map(function(_ref) {
		var index = _ref.index, amount = _ref.amount;
		return new FastColor(opts.backgroundColor || "#141414").mix(patterns[index], amount).toHexString();
	});
	return patterns.map(function(c) {
		return c.toHexString();
	});
}
//#endregion
//#region node_modules/@ant-design/colors/es/presets.js
var presetPrimaryColors = {
	"red": "#F5222D",
	"volcano": "#FA541C",
	"orange": "#FA8C16",
	"gold": "#FAAD14",
	"yellow": "#FADB14",
	"lime": "#A0D911",
	"green": "#52C41A",
	"cyan": "#13C2C2",
	"blue": "#1677FF",
	"geekblue": "#2F54EB",
	"purple": "#722ED1",
	"magenta": "#EB2F96",
	"grey": "#666666"
};
var red = [
	"#fff1f0",
	"#ffccc7",
	"#ffa39e",
	"#ff7875",
	"#ff4d4f",
	"#f5222d",
	"#cf1322",
	"#a8071a",
	"#820014",
	"#5c0011"
];
red.primary = red[5];
var volcano = [
	"#fff2e8",
	"#ffd8bf",
	"#ffbb96",
	"#ff9c6e",
	"#ff7a45",
	"#fa541c",
	"#d4380d",
	"#ad2102",
	"#871400",
	"#610b00"
];
volcano.primary = volcano[5];
var orange = [
	"#fff7e6",
	"#ffe7ba",
	"#ffd591",
	"#ffc069",
	"#ffa940",
	"#fa8c16",
	"#d46b08",
	"#ad4e00",
	"#873800",
	"#612500"
];
orange.primary = orange[5];
var gold = [
	"#fffbe6",
	"#fff1b8",
	"#ffe58f",
	"#ffd666",
	"#ffc53d",
	"#faad14",
	"#d48806",
	"#ad6800",
	"#874d00",
	"#613400"
];
gold.primary = gold[5];
var yellow = [
	"#feffe6",
	"#ffffb8",
	"#fffb8f",
	"#fff566",
	"#ffec3d",
	"#fadb14",
	"#d4b106",
	"#ad8b00",
	"#876800",
	"#614700"
];
yellow.primary = yellow[5];
var lime = [
	"#fcffe6",
	"#f4ffb8",
	"#eaff8f",
	"#d3f261",
	"#bae637",
	"#a0d911",
	"#7cb305",
	"#5b8c00",
	"#3f6600",
	"#254000"
];
lime.primary = lime[5];
var green = [
	"#f6ffed",
	"#d9f7be",
	"#b7eb8f",
	"#95de64",
	"#73d13d",
	"#52c41a",
	"#389e0d",
	"#237804",
	"#135200",
	"#092b00"
];
green.primary = green[5];
var cyan = [
	"#e6fffb",
	"#b5f5ec",
	"#87e8de",
	"#5cdbd3",
	"#36cfc9",
	"#13c2c2",
	"#08979c",
	"#006d75",
	"#00474f",
	"#002329"
];
cyan.primary = cyan[5];
var blue = [
	"#e6f4ff",
	"#bae0ff",
	"#91caff",
	"#69b1ff",
	"#4096ff",
	"#1677ff",
	"#0958d9",
	"#003eb3",
	"#002c8c",
	"#001d66"
];
blue.primary = blue[5];
var geekblue = [
	"#f0f5ff",
	"#d6e4ff",
	"#adc6ff",
	"#85a5ff",
	"#597ef7",
	"#2f54eb",
	"#1d39c4",
	"#10239e",
	"#061178",
	"#030852"
];
geekblue.primary = geekblue[5];
var purple = [
	"#f9f0ff",
	"#efdbff",
	"#d3adf7",
	"#b37feb",
	"#9254de",
	"#722ed1",
	"#531dab",
	"#391085",
	"#22075e",
	"#120338"
];
purple.primary = purple[5];
var magenta = [
	"#fff0f6",
	"#ffd6e7",
	"#ffadd2",
	"#ff85c0",
	"#f759ab",
	"#eb2f96",
	"#c41d7f",
	"#9e1068",
	"#780650",
	"#520339"
];
magenta.primary = magenta[5];
var grey = [
	"#a6a6a6",
	"#999999",
	"#8c8c8c",
	"#808080",
	"#737373",
	"#666666",
	"#404040",
	"#1a1a1a",
	"#000000",
	"#000000"
];
grey.primary = grey[5];
var presetPalettes = {
	red,
	volcano,
	orange,
	gold,
	yellow,
	lime,
	green,
	cyan,
	blue,
	geekblue,
	purple,
	magenta,
	grey
};
var redDark = [
	"#2a1215",
	"#431418",
	"#58181c",
	"#791a1f",
	"#a61d24",
	"#d32029",
	"#e84749",
	"#f37370",
	"#f89f9a",
	"#fac8c3"
];
redDark.primary = redDark[5];
var volcanoDark = [
	"#2b1611",
	"#441d12",
	"#592716",
	"#7c3118",
	"#aa3e19",
	"#d84a1b",
	"#e87040",
	"#f3956a",
	"#f8b692",
	"#fad4bc"
];
volcanoDark.primary = volcanoDark[5];
var orangeDark = [
	"#2b1d11",
	"#442a11",
	"#593815",
	"#7c4a15",
	"#aa6215",
	"#d87a16",
	"#e89a3c",
	"#f3b765",
	"#f8cf8d",
	"#fae3b7"
];
orangeDark.primary = orangeDark[5];
var goldDark = [
	"#2b2111",
	"#443111",
	"#594214",
	"#7c5914",
	"#aa7714",
	"#d89614",
	"#e8b339",
	"#f3cc62",
	"#f8df8b",
	"#faedb5"
];
goldDark.primary = goldDark[5];
var yellowDark = [
	"#2b2611",
	"#443b11",
	"#595014",
	"#7c6e14",
	"#aa9514",
	"#d8bd14",
	"#e8d639",
	"#f3ea62",
	"#f8f48b",
	"#fafab5"
];
yellowDark.primary = yellowDark[5];
var limeDark = [
	"#1f2611",
	"#2e3c10",
	"#3e4f13",
	"#536d13",
	"#6f9412",
	"#8bbb11",
	"#a9d134",
	"#c9e75d",
	"#e4f88b",
	"#f0fab5"
];
limeDark.primary = limeDark[5];
var greenDark = [
	"#162312",
	"#1d3712",
	"#274916",
	"#306317",
	"#3c8618",
	"#49aa19",
	"#6abe39",
	"#8fd460",
	"#b2e58b",
	"#d5f2bb"
];
greenDark.primary = greenDark[5];
var cyanDark = [
	"#112123",
	"#113536",
	"#144848",
	"#146262",
	"#138585",
	"#13a8a8",
	"#33bcb7",
	"#58d1c9",
	"#84e2d8",
	"#b2f1e8"
];
cyanDark.primary = cyanDark[5];
var blueDark = [
	"#111a2c",
	"#112545",
	"#15325b",
	"#15417e",
	"#1554ad",
	"#1668dc",
	"#3c89e8",
	"#65a9f3",
	"#8dc5f8",
	"#b7dcfa"
];
blueDark.primary = blueDark[5];
var geekblueDark = [
	"#131629",
	"#161d40",
	"#1c2755",
	"#203175",
	"#263ea0",
	"#2b4acb",
	"#5273e0",
	"#7f9ef3",
	"#a8c1f8",
	"#d2e0fa"
];
geekblueDark.primary = geekblueDark[5];
var purpleDark = [
	"#1a1325",
	"#24163a",
	"#301c4d",
	"#3e2069",
	"#51258f",
	"#642ab5",
	"#854eca",
	"#ab7ae0",
	"#cda8f0",
	"#ebd7fa"
];
purpleDark.primary = purpleDark[5];
var magentaDark = [
	"#291321",
	"#40162f",
	"#551c3b",
	"#75204f",
	"#a02669",
	"#cb2b83",
	"#e0529c",
	"#f37fb7",
	"#f8a8cc",
	"#fad2e3"
];
magentaDark.primary = magentaDark[5];
var greyDark = [
	"#151515",
	"#1f1f1f",
	"#2d2d2d",
	"#393939",
	"#494949",
	"#5a5a5a",
	"#6a6a6a",
	"#7b7b7b",
	"#888888",
	"#969696"
];
greyDark.primary = greyDark[5];
//#endregion
//#region node_modules/antd/es/theme/themes/shared/genColorMapToken.js
function genColorMapToken(seed, { generateColorPalettes, generateNeutralColorPalettes }) {
	const { colorSuccess: colorSuccessBase, colorWarning: colorWarningBase, colorError: colorErrorBase, colorInfo: colorInfoBase, colorPrimary: colorPrimaryBase, colorBgBase, colorTextBase } = seed;
	const primaryColors = generateColorPalettes(colorPrimaryBase);
	const successColors = generateColorPalettes(colorSuccessBase);
	const warningColors = generateColorPalettes(colorWarningBase);
	const errorColors = generateColorPalettes(colorErrorBase);
	const infoColors = generateColorPalettes(colorInfoBase);
	const neutralColors = generateNeutralColorPalettes(colorBgBase, colorTextBase);
	const linkColors = generateColorPalettes(seed.colorLink || seed.colorInfo);
	const colorErrorBgFilledHover = new FastColor(errorColors[1]).mix(new FastColor(errorColors[3]), 50).toHexString();
	return Object.assign(Object.assign({}, neutralColors), {
		colorPrimaryBg: primaryColors[1],
		colorPrimaryBgHover: primaryColors[2],
		colorPrimaryBorder: primaryColors[3],
		colorPrimaryBorderHover: primaryColors[4],
		colorPrimaryHover: primaryColors[5],
		colorPrimary: primaryColors[6],
		colorPrimaryActive: primaryColors[7],
		colorPrimaryTextHover: primaryColors[8],
		colorPrimaryText: primaryColors[9],
		colorPrimaryTextActive: primaryColors[10],
		colorSuccessBg: successColors[1],
		colorSuccessBgHover: successColors[2],
		colorSuccessBorder: successColors[3],
		colorSuccessBorderHover: successColors[4],
		colorSuccessHover: successColors[4],
		colorSuccess: successColors[6],
		colorSuccessActive: successColors[7],
		colorSuccessTextHover: successColors[8],
		colorSuccessText: successColors[9],
		colorSuccessTextActive: successColors[10],
		colorErrorBg: errorColors[1],
		colorErrorBgHover: errorColors[2],
		colorErrorBgFilledHover,
		colorErrorBgActive: errorColors[3],
		colorErrorBorder: errorColors[3],
		colorErrorBorderHover: errorColors[4],
		colorErrorHover: errorColors[5],
		colorError: errorColors[6],
		colorErrorActive: errorColors[7],
		colorErrorTextHover: errorColors[8],
		colorErrorText: errorColors[9],
		colorErrorTextActive: errorColors[10],
		colorWarningBg: warningColors[1],
		colorWarningBgHover: warningColors[2],
		colorWarningBorder: warningColors[3],
		colorWarningBorderHover: warningColors[4],
		colorWarningHover: warningColors[4],
		colorWarning: warningColors[6],
		colorWarningActive: warningColors[7],
		colorWarningTextHover: warningColors[8],
		colorWarningText: warningColors[9],
		colorWarningTextActive: warningColors[10],
		colorInfoBg: infoColors[1],
		colorInfoBgHover: infoColors[2],
		colorInfoBorder: infoColors[3],
		colorInfoBorderHover: infoColors[4],
		colorInfoHover: infoColors[4],
		colorInfo: infoColors[6],
		colorInfoActive: infoColors[7],
		colorInfoTextHover: infoColors[8],
		colorInfoText: infoColors[9],
		colorInfoTextActive: infoColors[10],
		colorLinkHover: linkColors[4],
		colorLink: linkColors[6],
		colorLinkActive: linkColors[7],
		colorBgMask: new FastColor("#000").setA(.45).toRgbString(),
		colorWhite: "#fff"
	});
}
//#endregion
//#region node_modules/antd/es/theme/themes/shared/genRadius.js
var genRadius = (radiusBase) => {
	let radiusLG = radiusBase;
	let radiusSM = radiusBase;
	let radiusXS = radiusBase;
	let radiusOuter = radiusBase;
	if (radiusBase < 6 && radiusBase >= 5) radiusLG = radiusBase + 1;
	else if (radiusBase < 16 && radiusBase >= 6) radiusLG = radiusBase + 2;
	else if (radiusBase >= 16) radiusLG = 16;
	if (radiusBase < 7 && radiusBase >= 5) radiusSM = 4;
	else if (radiusBase < 8 && radiusBase >= 7) radiusSM = 5;
	else if (radiusBase < 14 && radiusBase >= 8) radiusSM = 6;
	else if (radiusBase < 16 && radiusBase >= 14) radiusSM = 7;
	else if (radiusBase >= 16) radiusSM = 8;
	if (radiusBase < 6 && radiusBase >= 2) radiusXS = 1;
	else if (radiusBase >= 6) radiusXS = 2;
	if (radiusBase > 4 && radiusBase < 8) radiusOuter = 4;
	else if (radiusBase >= 8) radiusOuter = 6;
	return {
		borderRadius: radiusBase,
		borderRadiusXS: radiusXS,
		borderRadiusSM: radiusSM,
		borderRadiusLG: radiusLG,
		borderRadiusOuter: radiusOuter
	};
};
//#endregion
//#region node_modules/antd/es/theme/themes/shared/genCommonMapToken.js
function genCommonMapToken(token) {
	const { motionUnit, motionBase, borderRadius, lineWidth } = token;
	return Object.assign({
		motionDurationFast: `${(motionBase + motionUnit).toFixed(1)}s`,
		motionDurationMid: `${(motionBase + motionUnit * 2).toFixed(1)}s`,
		motionDurationSlow: `${(motionBase + motionUnit * 3).toFixed(1)}s`,
		lineWidthBold: lineWidth + 1
	}, genRadius(borderRadius));
}
//#endregion
//#region node_modules/antd/es/theme/themes/shared/genControlHeight.js
var genControlHeight = (token) => {
	const { controlHeight } = token;
	return {
		controlHeightSM: controlHeight * .75,
		controlHeightXS: controlHeight * .5,
		controlHeightLG: controlHeight * 1.25
	};
};
//#endregion
//#region node_modules/antd/es/theme/themes/shared/genFontSizes.js
function getLineHeight(fontSize) {
	return (fontSize + 8) / fontSize;
}
function getFontSizes(base) {
	const fontSizes = Array.from({ length: 10 }).map((_, index) => {
		const i = index - 1;
		const baseSize = base * Math.pow(Math.E, i / 5);
		return Math.floor((index > 1 ? Math.floor(baseSize) : Math.ceil(baseSize)) / 2) * 2;
	});
	fontSizes[1] = base;
	return fontSizes.map((size) => ({
		size,
		lineHeight: getLineHeight(size)
	}));
}
//#endregion
//#region node_modules/antd/es/theme/themes/shared/genFontMapToken.js
var genFontMapToken = (fontSize) => {
	const fontSizePairs = getFontSizes(fontSize);
	const fontSizes = fontSizePairs.map((pair) => pair.size);
	const lineHeights = fontSizePairs.map((pair) => pair.lineHeight);
	const fontSizeMD = fontSizes[1];
	const fontSizeSM = fontSizes[0];
	const fontSizeLG = fontSizes[2];
	const lineHeight = lineHeights[1];
	const lineHeightSM = lineHeights[0];
	const lineHeightLG = lineHeights[2];
	return {
		fontSizeSM,
		fontSize: fontSizeMD,
		fontSizeLG,
		fontSizeXL: fontSizes[3],
		fontSizeHeading1: fontSizes[6],
		fontSizeHeading2: fontSizes[5],
		fontSizeHeading3: fontSizes[4],
		fontSizeHeading4: fontSizes[3],
		fontSizeHeading5: fontSizes[2],
		lineHeight,
		lineHeightLG,
		lineHeightSM,
		fontHeight: Math.round(lineHeight * fontSizeMD),
		fontHeightLG: Math.round(lineHeightLG * fontSizeLG),
		fontHeightSM: Math.round(lineHeightSM * fontSizeSM),
		lineHeightHeading1: lineHeights[6],
		lineHeightHeading2: lineHeights[5],
		lineHeightHeading3: lineHeights[4],
		lineHeightHeading4: lineHeights[3],
		lineHeightHeading5: lineHeights[2]
	};
};
//#endregion
//#region node_modules/antd/es/theme/themes/shared/genSizeMapToken.js
function genSizeMapToken(token) {
	const { sizeUnit, sizeStep } = token;
	return {
		sizeXXL: sizeUnit * (sizeStep + 8),
		sizeXL: sizeUnit * (sizeStep + 4),
		sizeLG: sizeUnit * (sizeStep + 2),
		sizeMD: sizeUnit * (sizeStep + 1),
		sizeMS: sizeUnit * sizeStep,
		size: sizeUnit * sizeStep,
		sizeSM: sizeUnit * (sizeStep - 1),
		sizeXS: sizeUnit * (sizeStep - 2),
		sizeXXS: sizeUnit * (sizeStep - 3)
	};
}
//#endregion
//#region node_modules/antd/es/theme/themes/default/colorAlgorithm.js
var getAlphaColor$1 = (baseColor, alpha) => new FastColor(baseColor).setA(alpha).toRgbString();
var getSolidColor = (baseColor, brightness) => {
	return new FastColor(baseColor).darken(brightness).toHexString();
};
//#endregion
//#region node_modules/antd/es/theme/themes/default/colors.js
var generateColorPalettes = (baseColor) => {
	const colors = generate(baseColor);
	return {
		1: colors[0],
		2: colors[1],
		3: colors[2],
		4: colors[3],
		5: colors[4],
		6: colors[5],
		7: colors[6],
		8: colors[4],
		9: colors[5],
		10: colors[6]
	};
};
var generateNeutralColorPalettes = (bgBaseColor, textBaseColor) => {
	const colorBgBase = bgBaseColor || "#fff";
	const colorTextBase = textBaseColor || "#000";
	return {
		colorBgBase,
		colorTextBase,
		colorText: getAlphaColor$1(colorTextBase, .88),
		colorTextSecondary: getAlphaColor$1(colorTextBase, .65),
		colorTextTertiary: getAlphaColor$1(colorTextBase, .45),
		colorTextQuaternary: getAlphaColor$1(colorTextBase, .25),
		colorFill: getAlphaColor$1(colorTextBase, .15),
		colorFillSecondary: getAlphaColor$1(colorTextBase, .06),
		colorFillTertiary: getAlphaColor$1(colorTextBase, .04),
		colorFillQuaternary: getAlphaColor$1(colorTextBase, .02),
		colorBgSolid: getAlphaColor$1(colorTextBase, 1),
		colorBgSolidHover: getAlphaColor$1(colorTextBase, .75),
		colorBgSolidActive: getAlphaColor$1(colorTextBase, .95),
		colorBgLayout: getSolidColor(colorBgBase, 4),
		colorBgContainer: getSolidColor(colorBgBase, 0),
		colorBgElevated: getSolidColor(colorBgBase, 0),
		colorBgSpotlight: getAlphaColor$1(colorTextBase, .85),
		colorBgBlur: "transparent",
		colorBorder: getSolidColor(colorBgBase, 15),
		colorBorderSecondary: getSolidColor(colorBgBase, 6)
	};
};
//#endregion
//#region node_modules/antd/es/theme/themes/default/index.js
function derivative(token) {
	presetPrimaryColors.pink = presetPrimaryColors.magenta;
	presetPalettes.pink = presetPalettes.magenta;
	const colorPalettes = Object.keys(defaultPresetColors).map((colorKey) => {
		const colors = token[colorKey] === presetPrimaryColors[colorKey] ? presetPalettes[colorKey] : generate(token[colorKey]);
		return Array.from({ length: 10 }, () => 1).reduce((prev, _, i) => {
			prev[`${colorKey}-${i + 1}`] = colors[i];
			prev[`${colorKey}${i + 1}`] = colors[i];
			return prev;
		}, {});
	}).reduce((prev, cur) => {
		prev = Object.assign(Object.assign({}, prev), cur);
		return prev;
	}, {});
	return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, token), colorPalettes), genColorMapToken(token, {
		generateColorPalettes,
		generateNeutralColorPalettes
	})), genFontMapToken(token.fontSize)), genSizeMapToken(token)), genControlHeight(token)), genCommonMapToken(token));
}
//#endregion
//#region node_modules/antd/es/theme/themes/default/theme.js
var defaultTheme = createTheme(derivative);
//#endregion
//#region node_modules/antd/es/theme/context.js
var defaultConfig = {
	token: seedToken,
	override: { override: seedToken },
	hashed: true
};
var DesignTokenContext = /*#__PURE__*/ import_react.createContext(defaultConfig);
var defaultIconPrefixCls = "anticon";
var Variants = [
	"outlined",
	"borderless",
	"filled",
	"underlined"
];
var defaultGetPrefixCls = (suffixCls, customizePrefixCls) => {
	if (customizePrefixCls) return customizePrefixCls;
	return suffixCls ? `ant-${suffixCls}` : "ant";
};
var ConfigContext = /*#__PURE__*/ import_react.createContext({
	getPrefixCls: defaultGetPrefixCls,
	iconPrefixCls: defaultIconPrefixCls
});
var { Consumer: ConfigConsumer } = ConfigContext;
var EMPTY_OBJECT = {};
/**
* Get ConfigProvider configured component props.
* This help to reduce bundle size for saving `?.` operator.
* Do not use as `useMemo` deps since we do not cache the object here.
*
* NOTE: not refactor this with `useMemo` since memo will cost another memory space,
* which will waste both compare calculation & memory.
*/
function useComponentConfig(propName) {
	const context = import_react.useContext(ConfigContext);
	const { getPrefixCls, direction, getPopupContainer } = context;
	const propValue = context[propName];
	return Object.assign(Object.assign({
		classNames: EMPTY_OBJECT,
		styles: EMPTY_OBJECT
	}, propValue), {
		getPrefixCls,
		direction,
		getPopupContainer
	});
}
//#endregion
//#region node_modules/rc-util/es/hooks/useEvent.js
function useEvent(callback) {
	var fnRef = import_react.useRef();
	fnRef.current = callback;
	return import_react.useCallback(function() {
		var _fnRef$current;
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
		return (_fnRef$current = fnRef.current) === null || _fnRef$current === void 0 ? void 0 : _fnRef$current.call.apply(_fnRef$current, [fnRef].concat(args));
	}, []);
}
//#endregion
//#region node_modules/rc-util/es/hooks/useState.js
init_slicedToArray();
/**
* Same as React.useState but `setState` accept `ignoreDestroy` param to not to setState after destroyed.
* We do not make this auto is to avoid real memory leak.
* Developer should confirm it's safe to ignore themselves.
*/
function useSafeState(defaultValue) {
	var destroyRef = import_react.useRef(false);
	var _React$useState2 = _slicedToArray(import_react.useState(defaultValue), 2), value = _React$useState2[0], setValue = _React$useState2[1];
	import_react.useEffect(function() {
		destroyRef.current = false;
		return function() {
			destroyRef.current = true;
		};
	}, []);
	function safeSetState(updater, ignoreDestroy) {
		if (ignoreDestroy && destroyRef.current) return;
		setValue(updater);
	}
	return [value, safeSetState];
}
//#endregion
//#region node_modules/rc-util/es/hooks/useMergedState.js
init_slicedToArray();
/** We only think `undefined` is empty */
function hasValue(value) {
	return value !== void 0;
}
/**
* Similar to `useState` but will use props value if provided.
* Note that internal use rc-util `useState` hook.
*/
function useMergedState(defaultStateValue, option) {
	var _ref = option || {}, defaultValue = _ref.defaultValue, value = _ref.value, onChange = _ref.onChange, postState = _ref.postState;
	var _useState2 = _slicedToArray(useSafeState(function() {
		if (hasValue(value)) return value;
		else if (hasValue(defaultValue)) return typeof defaultValue === "function" ? defaultValue() : defaultValue;
		else return typeof defaultStateValue === "function" ? defaultStateValue() : defaultStateValue;
	}), 2), innerValue = _useState2[0], setInnerValue = _useState2[1];
	var mergedValue = value !== void 0 ? value : innerValue;
	var postMergedValue = postState ? postState(mergedValue) : mergedValue;
	var onChangeFn = useEvent(onChange);
	var _useState4 = _slicedToArray(useSafeState([mergedValue]), 2), prevValue = _useState4[0], setPrevValue = _useState4[1];
	useLayoutUpdateEffect(function() {
		var prev = prevValue[0];
		if (innerValue !== prev) onChangeFn(innerValue, prev);
	}, [prevValue]);
	useLayoutUpdateEffect(function() {
		if (!hasValue(value)) setInnerValue(value);
	}, [value]);
	return [postMergedValue, useEvent(function(updater, ignoreDestroy) {
		setInnerValue(updater, ignoreDestroy);
		setPrevValue([mergedValue], ignoreDestroy);
	})];
}
//#endregion
//#region node_modules/antd/es/version/index.js
var version_default = "5.27.5";
//#endregion
//#region node_modules/antd/es/theme/util/getAlphaColor.js
function isStableColor(color) {
	return color >= 0 && color <= 255;
}
function getAlphaColor(frontColor, backgroundColor) {
	const { r: fR, g: fG, b: fB, a: originAlpha } = new FastColor(frontColor).toRgb();
	if (originAlpha < 1) return frontColor;
	const { r: bR, g: bG, b: bB } = new FastColor(backgroundColor).toRgb();
	for (let fA = .01; fA <= 1; fA += .01) {
		const r = Math.round((fR - bR * (1 - fA)) / fA);
		const g = Math.round((fG - bG * (1 - fA)) / fA);
		const b = Math.round((fB - bB * (1 - fA)) / fA);
		if (isStableColor(r) && isStableColor(g) && isStableColor(b)) return new FastColor({
			r,
			g,
			b,
			a: Math.round(fA * 100) / 100
		}).toRgbString();
	}
	/* istanbul ignore next */
	return new FastColor({
		r: fR,
		g: fG,
		b: fB,
		a: 1
	}).toRgbString();
}
//#endregion
//#region node_modules/antd/es/theme/util/alias.js
var __rest$1 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
/**
* Seed (designer) > Derivative (designer) > Alias (developer).
*
* Merge seed & derivative & override token and generate alias token for developer.
*/
function formatToken(derivativeToken) {
	const { override } = derivativeToken, restToken = __rest$1(derivativeToken, ["override"]);
	const overrideTokens = Object.assign({}, override);
	Object.keys(seedToken).forEach((token) => {
		delete overrideTokens[token];
	});
	const mergedToken = Object.assign(Object.assign({}, restToken), overrideTokens);
	const screenXS = 480;
	const screenSM = 576;
	const screenMD = 768;
	const screenLG = 992;
	const screenXL = 1200;
	const screenXXL = 1600;
	if (mergedToken.motion === false) {
		const fastDuration = "0s";
		mergedToken.motionDurationFast = fastDuration;
		mergedToken.motionDurationMid = fastDuration;
		mergedToken.motionDurationSlow = fastDuration;
	}
	return Object.assign(Object.assign(Object.assign({}, mergedToken), {
		colorFillContent: mergedToken.colorFillSecondary,
		colorFillContentHover: mergedToken.colorFill,
		colorFillAlter: mergedToken.colorFillQuaternary,
		colorBgContainerDisabled: mergedToken.colorFillTertiary,
		colorBorderBg: mergedToken.colorBgContainer,
		colorSplit: getAlphaColor(mergedToken.colorBorderSecondary, mergedToken.colorBgContainer),
		colorTextPlaceholder: mergedToken.colorTextQuaternary,
		colorTextDisabled: mergedToken.colorTextQuaternary,
		colorTextHeading: mergedToken.colorText,
		colorTextLabel: mergedToken.colorTextSecondary,
		colorTextDescription: mergedToken.colorTextTertiary,
		colorTextLightSolid: mergedToken.colorWhite,
		colorHighlight: mergedToken.colorError,
		colorBgTextHover: mergedToken.colorFillSecondary,
		colorBgTextActive: mergedToken.colorFill,
		colorIcon: mergedToken.colorTextTertiary,
		colorIconHover: mergedToken.colorText,
		colorErrorOutline: getAlphaColor(mergedToken.colorErrorBg, mergedToken.colorBgContainer),
		colorWarningOutline: getAlphaColor(mergedToken.colorWarningBg, mergedToken.colorBgContainer),
		fontSizeIcon: mergedToken.fontSizeSM,
		lineWidthFocus: mergedToken.lineWidth * 3,
		lineWidth: mergedToken.lineWidth,
		controlOutlineWidth: mergedToken.lineWidth * 2,
		controlInteractiveSize: mergedToken.controlHeight / 2,
		controlItemBgHover: mergedToken.colorFillTertiary,
		controlItemBgActive: mergedToken.colorPrimaryBg,
		controlItemBgActiveHover: mergedToken.colorPrimaryBgHover,
		controlItemBgActiveDisabled: mergedToken.colorFill,
		controlTmpOutline: mergedToken.colorFillQuaternary,
		controlOutline: getAlphaColor(mergedToken.colorPrimaryBg, mergedToken.colorBgContainer),
		lineType: mergedToken.lineType,
		borderRadius: mergedToken.borderRadius,
		borderRadiusXS: mergedToken.borderRadiusXS,
		borderRadiusSM: mergedToken.borderRadiusSM,
		borderRadiusLG: mergedToken.borderRadiusLG,
		fontWeightStrong: 600,
		opacityLoading: .65,
		linkDecoration: "none",
		linkHoverDecoration: "none",
		linkFocusDecoration: "none",
		controlPaddingHorizontal: 12,
		controlPaddingHorizontalSM: 8,
		paddingXXS: mergedToken.sizeXXS,
		paddingXS: mergedToken.sizeXS,
		paddingSM: mergedToken.sizeSM,
		padding: mergedToken.size,
		paddingMD: mergedToken.sizeMD,
		paddingLG: mergedToken.sizeLG,
		paddingXL: mergedToken.sizeXL,
		paddingContentHorizontalLG: mergedToken.sizeLG,
		paddingContentVerticalLG: mergedToken.sizeMS,
		paddingContentHorizontal: mergedToken.sizeMS,
		paddingContentVertical: mergedToken.sizeSM,
		paddingContentHorizontalSM: mergedToken.size,
		paddingContentVerticalSM: mergedToken.sizeXS,
		marginXXS: mergedToken.sizeXXS,
		marginXS: mergedToken.sizeXS,
		marginSM: mergedToken.sizeSM,
		margin: mergedToken.size,
		marginMD: mergedToken.sizeMD,
		marginLG: mergedToken.sizeLG,
		marginXL: mergedToken.sizeXL,
		marginXXL: mergedToken.sizeXXL,
		boxShadow: `
      0 6px 16px 0 rgba(0, 0, 0, 0.08),
      0 3px 6px -4px rgba(0, 0, 0, 0.12),
      0 9px 28px 8px rgba(0, 0, 0, 0.05)
    `,
		boxShadowSecondary: `
      0 6px 16px 0 rgba(0, 0, 0, 0.08),
      0 3px 6px -4px rgba(0, 0, 0, 0.12),
      0 9px 28px 8px rgba(0, 0, 0, 0.05)
    `,
		boxShadowTertiary: `
      0 1px 2px 0 rgba(0, 0, 0, 0.03),
      0 1px 6px -1px rgba(0, 0, 0, 0.02),
      0 2px 4px 0 rgba(0, 0, 0, 0.02)
    `,
		screenXS,
		screenXSMin: screenXS,
		screenXSMax: screenSM - 1,
		screenSM,
		screenSMMin: screenSM,
		screenSMMax: screenMD - 1,
		screenMD,
		screenMDMin: screenMD,
		screenMDMax: screenLG - 1,
		screenLG,
		screenLGMin: screenLG,
		screenLGMax: screenXL - 1,
		screenXL,
		screenXLMin: screenXL,
		screenXLMax: screenXXL - 1,
		screenXXL,
		screenXXLMin: screenXXL,
		boxShadowPopoverArrow: "2px 2px 5px rgba(0, 0, 0, 0.05)",
		boxShadowCard: `
      0 1px 2px -2px ${new FastColor("rgba(0, 0, 0, 0.16)").toRgbString()},
      0 3px 6px 0 ${new FastColor("rgba(0, 0, 0, 0.12)").toRgbString()},
      0 5px 12px 4px ${new FastColor("rgba(0, 0, 0, 0.09)").toRgbString()}
    `,
		boxShadowDrawerRight: `
      -6px 0 16px 0 rgba(0, 0, 0, 0.08),
      -3px 0 6px -4px rgba(0, 0, 0, 0.12),
      -9px 0 28px 8px rgba(0, 0, 0, 0.05)
    `,
		boxShadowDrawerLeft: `
      6px 0 16px 0 rgba(0, 0, 0, 0.08),
      3px 0 6px -4px rgba(0, 0, 0, 0.12),
      9px 0 28px 8px rgba(0, 0, 0, 0.05)
    `,
		boxShadowDrawerUp: `
      0 6px 16px 0 rgba(0, 0, 0, 0.08),
      0 3px 6px -4px rgba(0, 0, 0, 0.12),
      0 9px 28px 8px rgba(0, 0, 0, 0.05)
    `,
		boxShadowDrawerDown: `
      0 -6px 16px 0 rgba(0, 0, 0, 0.08),
      0 -3px 6px -4px rgba(0, 0, 0, 0.12),
      0 -9px 28px 8px rgba(0, 0, 0, 0.05)
    `,
		boxShadowTabsOverflowLeft: "inset 10px 0 8px -8px rgba(0, 0, 0, 0.08)",
		boxShadowTabsOverflowRight: "inset -10px 0 8px -8px rgba(0, 0, 0, 0.08)",
		boxShadowTabsOverflowTop: "inset 0 10px 8px -8px rgba(0, 0, 0, 0.08)",
		boxShadowTabsOverflowBottom: "inset 0 -10px 8px -8px rgba(0, 0, 0, 0.08)"
	}), overrideTokens);
}
//#endregion
//#region node_modules/antd/es/theme/useToken.js
var __rest = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var unitless = {
	lineHeight: true,
	lineHeightSM: true,
	lineHeightLG: true,
	lineHeightHeading1: true,
	lineHeightHeading2: true,
	lineHeightHeading3: true,
	lineHeightHeading4: true,
	lineHeightHeading5: true,
	opacityLoading: true,
	fontWeightStrong: true,
	zIndexPopupBase: true,
	zIndexBase: true,
	opacityImage: true
};
var ignore = {
	motionBase: true,
	motionUnit: true
};
var preserve = {
	screenXS: true,
	screenXSMin: true,
	screenXSMax: true,
	screenSM: true,
	screenSMMin: true,
	screenSMMax: true,
	screenMD: true,
	screenMDMin: true,
	screenMDMax: true,
	screenLG: true,
	screenLGMin: true,
	screenLGMax: true,
	screenXL: true,
	screenXLMin: true,
	screenXLMax: true,
	screenXXL: true,
	screenXXLMin: true
};
var getComputedToken = (originToken, overrideToken, theme) => {
	const derivativeToken = theme.getDerivativeToken(originToken);
	const { override } = overrideToken, components = __rest(overrideToken, ["override"]);
	let mergedDerivativeToken = Object.assign(Object.assign({}, derivativeToken), { override });
	mergedDerivativeToken = formatToken(mergedDerivativeToken);
	if (components) Object.entries(components).forEach(([key, value]) => {
		const { theme: componentTheme } = value, componentTokens = __rest(value, ["theme"]);
		let mergedComponentToken = componentTokens;
		if (componentTheme) mergedComponentToken = getComputedToken(Object.assign(Object.assign({}, mergedDerivativeToken), componentTokens), { override: componentTokens }, componentTheme);
		mergedDerivativeToken[key] = mergedComponentToken;
	});
	return mergedDerivativeToken;
};
function useToken() {
	const { token: rootDesignToken, hashed, theme, override, cssVar } = import_react.useContext(DesignTokenContext);
	const salt = `${version_default}-${hashed || ""}`;
	const mergedTheme = theme || defaultTheme;
	const [token, hashId, realToken] = useCacheToken(mergedTheme, [seedToken, rootDesignToken], {
		salt,
		override,
		getComputedToken,
		formatToken,
		cssVar: cssVar && {
			prefix: cssVar.prefix,
			key: cssVar.key,
			unitless,
			ignore,
			preserve
		}
	});
	return [
		mergedTheme,
		realToken,
		hashed ? hashId : "",
		token,
		cssVar
	];
}
//#endregion
//#region node_modules/antd/es/style/index.js
var textEllipsis = {
	overflow: "hidden",
	whiteSpace: "nowrap",
	textOverflow: "ellipsis"
};
var resetComponent = (token, needInheritFontFamily = false) => ({
	boxSizing: "border-box",
	margin: 0,
	padding: 0,
	color: token.colorText,
	fontSize: token.fontSize,
	lineHeight: token.lineHeight,
	listStyle: "none",
	fontFamily: needInheritFontFamily ? "inherit" : token.fontFamily
});
var resetIcon = () => ({
	display: "inline-flex",
	alignItems: "center",
	color: "inherit",
	fontStyle: "normal",
	lineHeight: 0,
	textAlign: "center",
	textTransform: "none",
	verticalAlign: "-0.125em",
	textRendering: "optimizeLegibility",
	"-webkit-font-smoothing": "antialiased",
	"-moz-osx-font-smoothing": "grayscale",
	"> *": { lineHeight: 1 },
	svg: { display: "inline-block" }
});
var genLinkStyle = (token) => ({ a: {
	color: token.colorLink,
	textDecoration: token.linkDecoration,
	backgroundColor: "transparent",
	outline: "none",
	cursor: "pointer",
	transition: `color ${token.motionDurationSlow}`,
	"-webkit-text-decoration-skip": "objects",
	"&:hover": { color: token.colorLinkHover },
	"&:active": { color: token.colorLinkActive },
	"&:active, &:hover": {
		textDecoration: token.linkHoverDecoration,
		outline: 0
	},
	"&:focus": {
		textDecoration: token.linkFocusDecoration,
		outline: 0
	},
	"&[disabled]": {
		color: token.colorTextDisabled,
		cursor: "not-allowed"
	}
} });
var genCommonStyle = (token, componentPrefixCls, rootCls, resetFont) => {
	const prefixSelector = `[class^="${componentPrefixCls}"], [class*=" ${componentPrefixCls}"]`;
	const rootPrefixSelector = rootCls ? `.${rootCls}` : prefixSelector;
	const resetStyle = {
		boxSizing: "border-box",
		"&::before, &::after": { boxSizing: "border-box" }
	};
	let resetFontStyle = {};
	if (resetFont !== false) resetFontStyle = {
		fontFamily: token.fontFamily,
		fontSize: token.fontSize
	};
	return { [rootPrefixSelector]: Object.assign(Object.assign(Object.assign({}, resetFontStyle), resetStyle), { [prefixSelector]: resetStyle }) };
};
var genFocusOutline = (token, offset) => ({
	outline: `${unit(token.lineWidthFocus)} solid ${token.colorPrimaryBorder}`,
	outlineOffset: offset !== null && offset !== void 0 ? offset : 1,
	transition: "outline-offset 0s, outline 0s"
});
var genFocusStyle = (token, offset) => ({ "&:focus-visible": genFocusOutline(token, offset) });
var genIconStyle = (iconPrefixCls) => ({ [`.${iconPrefixCls}`]: Object.assign(Object.assign({}, resetIcon()), { [`.${iconPrefixCls} .${iconPrefixCls}-icon`]: { display: "block" } }) });
//#endregion
export { warningOnce as $, unit as A, _getPrototypeOf as B, FastColor as C, useStyleRegister as D, useCSSVarRegister as E, removeCSS as F, fillRef as G, _classCallCheck as H, updateCSS as I, useComposeRef as J, getNodeRef as K, canUseDom as L, StyleContext as M, StyleProvider as N, useLayoutEffect as O, isEqual as P, warning as Q, _createSuper as R, generate as S, transform as T, init_classCallCheck as U, _inherits as V, composeRef as W, _objectSpread2 as X, useMemo as Y, noteOnce as Z, useComponentConfig as _, genLinkStyle as a, defaultTheme as b, textEllipsis as c, useMergedState as d, isFragment as et, useSafeState as f, defaultIconPrefixCls as g, Variants as h, genIconStyle as i, createTheme as j, token2CSSVar as k, unitless as l, ConfigContext as m, genFocusOutline as n, resetComponent as o, useEvent as p, supportRef as q, genFocusStyle as r, resetIcon as s, genCommonStyle as t, useToken as u, DesignTokenContext as v, seedToken as w, blue as x, defaultConfig as y, _isNativeReflectConstruct as z };
