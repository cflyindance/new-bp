import { d as __toESM, i as require_react } from "./toast-C8a1ReSo.js";
import { l as _extends, u as init_extends } from "./es-CFYDnMm2.js";
import { n as init_setPrototypeOf, t as _setPrototypeOf } from "./setPrototypeOf-fzM5qJP3.js";
import { S as init_typeof, _ as _createClass, b as init_defineProperty, g as init_assertThisInitialized, h as _assertThisInitialized, i as init_slicedToArray, l as _toConsumableArray, n as init_objectWithoutProperties, r as _slicedToArray, t as _objectWithoutProperties, u as init_toConsumableArray, v as init_createClass, x as _typeof, y as _defineProperty } from "./objectWithoutProperties-DDcNLcsK.js";
import { $ as warningOnce, B as _getPrototypeOf, H as _classCallCheck, P as isEqual, R as _createSuper, U as init_classCallCheck, V as _inherits, X as _objectSpread2, et as isFragment, z as _isNativeReflectConstruct } from "./style-DWrLyeCr.js";
import { c as merge, l as set, u as get } from "./es-CH_mXwwY.js";
//#region node_modules/rc-util/es/Children/toArray.js
init_extends();
init_typeof();
var import_react = /* @__PURE__ */ __toESM(require_react());
function toArray$1(children) {
	var option = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	var ret = [];
	import_react.Children.forEach(children, function(child) {
		if ((child === void 0 || child === null) && !option.keepEmpty) return;
		if (Array.isArray(child)) ret = ret.concat(toArray$1(child));
		else if (isFragment(child) && child.props) ret = ret.concat(toArray$1(child.props.children, option));
		else ret.push(child);
	});
	return ret;
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/OverloadYield.js
init_objectWithoutProperties();
function _OverloadYield(e, d) {
	this.v = e, this.k = d;
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/regeneratorDefine.js
function _regeneratorDefine(e, r, n, t) {
	var i = Object.defineProperty;
	try {
		i({}, "", {});
	} catch (e) {
		i = 0;
	}
	_regeneratorDefine = function regeneratorDefine(e, r, n, t) {
		function o(r, n) {
			_regeneratorDefine(e, r, function(e) {
				return this._invoke(r, n, e);
			});
		}
		r ? i ? i(e, r, {
			value: n,
			enumerable: !t,
			configurable: !t,
			writable: !t
		}) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
	}, _regeneratorDefine(e, r, n, t);
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/regenerator.js
function _regenerator() {
	/*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
	var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag";
	function i(r, n, o, i) {
		var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype);
		return _regeneratorDefine(u, "_invoke", function(r, n, o) {
			var i, c, u, f = 0, p = o || [], y = !1, G = {
				p: 0,
				n: 0,
				v: e,
				a: d,
				f: d.bind(e, 4),
				d: function d(t, r) {
					return i = t, c = 0, u = e, G.n = r, a;
				}
			};
			function d(r, n) {
				for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
					var o, i = p[t], d = G.p, l = i[2];
					r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
				}
				if (o || r > 1) return a;
				throw y = !0, n;
			}
			return function(o, p, l) {
				if (f > 1) throw TypeError("Generator is already running");
				for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
					i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
					try {
						if (f = 2, i) {
							if (c || (o = "next"), t = i[o]) {
								if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
								if (!t.done) return t;
								u = t.value, c < 2 && (c = 0);
							} else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
							i = e;
						} else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
					} catch (t) {
						i = e, c = 1, u = t;
					} finally {
						f = 1;
					}
				}
				return {
					value: t,
					done: y
				};
			};
		}(r, o, i), !0), u;
	}
	var a = {};
	function Generator() {}
	function GeneratorFunction() {}
	function GeneratorFunctionPrototype() {}
	t = Object.getPrototypeOf;
	var c = [][n] ? t(t([][n]())) : (_regeneratorDefine(t = {}, n, function() {
		return this;
	}), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
	function f(e) {
		return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
	}
	return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine(u), _regeneratorDefine(u, o, "Generator"), _regeneratorDefine(u, n, function() {
		return this;
	}), _regeneratorDefine(u, "toString", function() {
		return "[object Generator]";
	}), (_regenerator = function _regenerator() {
		return {
			w: i,
			m: f
		};
	})();
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/regeneratorAsyncIterator.js
function AsyncIterator(t, e) {
	function n(r, o, i, f) {
		try {
			var c = t[r](o), u = c.value;
			return u instanceof _OverloadYield ? e.resolve(u.v).then(function(t) {
				n("next", t, i, f);
			}, function(t) {
				n("throw", t, i, f);
			}) : e.resolve(u).then(function(t) {
				c.value = t, i(c);
			}, function(t) {
				return n("throw", t, i, f);
			});
		} catch (t) {
			f(t);
		}
	}
	var r;
	this.next || (_regeneratorDefine(AsyncIterator.prototype), _regeneratorDefine(AsyncIterator.prototype, "function" == typeof Symbol && Symbol.asyncIterator || "@asyncIterator", function() {
		return this;
	})), _regeneratorDefine(this, "_invoke", function(t, o, i) {
		function f() {
			return new e(function(e, r) {
				n(t, i, e, r);
			});
		}
		return r = r ? r.then(f, f) : f();
	}, !0);
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/regeneratorAsyncGen.js
function _regeneratorAsyncGen(r, e, t, o, n) {
	return new AsyncIterator(_regenerator().w(r, e, t, o), n || Promise);
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/regeneratorAsync.js
function _regeneratorAsync(n, e, r, t, o) {
	var a = _regeneratorAsyncGen(n, e, r, t, o);
	return a.next().then(function(n) {
		return n.done ? n.value : a.next();
	});
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/regeneratorKeys.js
function _regeneratorKeys(e) {
	var n = Object(e), r = [];
	for (var t in n) r.unshift(t);
	return function e() {
		for (; r.length;) if ((t = r.pop()) in n) return e.value = t, e.done = !1, e;
		return e.done = !0, e;
	};
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/regeneratorValues.js
function _regeneratorValues(e) {
	if (null != e) {
		var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0;
		if (t) return t.call(e);
		if ("function" == typeof e.next) return e;
		if (!isNaN(e.length)) return { next: function next() {
			return e && r >= e.length && (e = void 0), {
				value: e && e[r++],
				done: !e
			};
		} };
	}
	throw new TypeError(_typeof(e) + " is not iterable");
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/regeneratorRuntime.js
function _regeneratorRuntime() {
	"use strict";
	var r = _regenerator(), e = r.m(_regeneratorRuntime), t = (Object.getPrototypeOf ? Object.getPrototypeOf(e) : e.__proto__).constructor;
	function n(r) {
		var e = "function" == typeof r && r.constructor;
		return !!e && (e === t || "GeneratorFunction" === (e.displayName || e.name));
	}
	var o = {
		"throw": 1,
		"return": 2,
		"break": 3,
		"continue": 3
	};
	function a(r) {
		var e, t;
		return function(n) {
			e || (e = {
				stop: function stop() {
					return t(n.a, 2);
				},
				"catch": function _catch() {
					return n.v;
				},
				abrupt: function abrupt(r, e) {
					return t(n.a, o[r], e);
				},
				delegateYield: function delegateYield(r, o, a) {
					return e.resultName = o, t(n.d, _regeneratorValues(r), a);
				},
				finish: function finish(r) {
					return t(n.f, r);
				}
			}, t = function t(r, _t, o) {
				n.p = e.prev, n.n = e.next;
				try {
					return r(_t, o);
				} finally {
					e.next = n.n;
				}
			}), e.resultName && (e[e.resultName] = n.v, e.resultName = void 0), e.sent = n.v, e.next = n.n;
			try {
				return r.call(this, e);
			} finally {
				n.p = e.prev, n.n = e.next;
			}
		};
	}
	return (_regeneratorRuntime = function _regeneratorRuntime() {
		return {
			wrap: function wrap(e, t, n, o) {
				return r.w(a(e), t, n, o && o.reverse());
			},
			isGeneratorFunction: n,
			mark: r.m,
			awrap: function awrap(r, e) {
				return new _OverloadYield(r, e);
			},
			AsyncIterator,
			async: function async(r, e, t, o, u) {
				return (n(e) ? _regeneratorAsyncGen : _regeneratorAsync)(a(r), e, t, o, u);
			},
			keys: _regeneratorKeys,
			values: _regeneratorValues
		};
	})();
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js
function asyncGeneratorStep(n, t, e, r, o, a, c) {
	try {
		var i = n[a](c), u = i.value;
	} catch (n) {
		e(n);
		return;
	}
	i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n) {
	return function() {
		var t = this, e = arguments;
		return new Promise(function(r, o) {
			var a = n.apply(t, e);
			function _next(n) {
				asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
			}
			function _throw(n) {
				asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
			}
			_next(void 0);
		});
	};
}
//#endregion
//#region node_modules/rc-util/es/omit.js
init_setPrototypeOf();
init_defineProperty();
init_classCallCheck();
init_createClass();
init_assertThisInitialized();
init_toConsumableArray();
init_slicedToArray();
function omit(obj, fields) {
	var clone = Object.assign({}, obj);
	if (Array.isArray(fields)) fields.forEach(function(key) {
		delete clone[key];
	});
	return clone;
}
//#endregion
//#region node_modules/rc-field-form/es/FieldContext.js
var HOOK_MARK = "RC_FORM_INTERNAL_HOOKS";
var warningFunc = function warningFunc() {
	warningOnce(false, "Can not find FormContext. Please make sure you wrap Field under Form.");
};
var Context = /*#__PURE__*/ import_react.createContext({
	getFieldValue: warningFunc,
	getFieldsValue: warningFunc,
	getFieldError: warningFunc,
	getFieldWarning: warningFunc,
	getFieldsError: warningFunc,
	isFieldsTouched: warningFunc,
	isFieldTouched: warningFunc,
	isFieldValidating: warningFunc,
	isFieldsValidating: warningFunc,
	resetFields: warningFunc,
	setFields: warningFunc,
	setFieldValue: warningFunc,
	setFieldsValue: warningFunc,
	validateFields: warningFunc,
	submit: warningFunc,
	getInternalHooks: function getInternalHooks() {
		warningFunc();
		return {
			dispatch: warningFunc,
			initEntityValue: warningFunc,
			registerField: warningFunc,
			useSubscribe: warningFunc,
			setInitialValues: warningFunc,
			destroyForm: warningFunc,
			setCallbacks: warningFunc,
			registerWatch: warningFunc,
			getFields: warningFunc,
			setValidateMessages: warningFunc,
			setPreserve: warningFunc,
			getInitialValue: warningFunc
		};
	}
});
//#endregion
//#region node_modules/rc-field-form/es/ListContext.js
var ListContext = /*#__PURE__*/ import_react.createContext(null);
//#endregion
//#region node_modules/rc-field-form/es/utils/typeUtil.js
function toArray(value) {
	if (value === void 0 || value === null) return [];
	return Array.isArray(value) ? value : [value];
}
function isFormInstance(form) {
	return form && !!form._init;
}
//#endregion
//#region node_modules/@rc-component/async-validator/es/messages.js
function newMessages() {
	return {
		default: "Validation error on field %s",
		required: "%s is required",
		enum: "%s must be one of %s",
		whitespace: "%s cannot be empty",
		date: {
			format: "%s date %s is invalid for format %s",
			parse: "%s date could not be parsed, %s is invalid ",
			invalid: "%s date %s is invalid"
		},
		types: {
			string: "%s is not a %s",
			method: "%s is not a %s (function)",
			array: "%s is not an %s",
			object: "%s is not an %s",
			number: "%s is not a %s",
			date: "%s is not a %s",
			boolean: "%s is not a %s",
			integer: "%s is not an %s",
			float: "%s is not a %s",
			regexp: "%s is not a valid %s",
			email: "%s is not a valid %s",
			url: "%s is not a valid %s",
			hex: "%s is not a valid %s"
		},
		string: {
			len: "%s must be exactly %s characters",
			min: "%s must be at least %s characters",
			max: "%s cannot be longer than %s characters",
			range: "%s must be between %s and %s characters"
		},
		number: {
			len: "%s must equal %s",
			min: "%s cannot be less than %s",
			max: "%s cannot be greater than %s",
			range: "%s must be between %s and %s"
		},
		array: {
			len: "%s must be exactly %s in length",
			min: "%s cannot be less than %s in length",
			max: "%s cannot be greater than %s in length",
			range: "%s must be between %s and %s in length"
		},
		pattern: { mismatch: "%s value %s does not match pattern %s" },
		clone: function clone() {
			var cloned = JSON.parse(JSON.stringify(this));
			cloned.clone = this.clone;
			return cloned;
		}
	};
}
var messages = newMessages();
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/isNativeFunction.js
function _isNativeFunction(t) {
	try {
		return -1 !== Function.toString.call(t).indexOf("[native code]");
	} catch (n) {
		return "function" == typeof t;
	}
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/construct.js
function _construct(t, e, r) {
	if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
	var o = [null];
	o.push.apply(o, e);
	var p = new (t.bind.apply(t, o))();
	return r && _setPrototypeOf(p, r.prototype), p;
}
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/wrapNativeSuper.js
init_setPrototypeOf();
function _wrapNativeSuper(t) {
	var r = "function" == typeof Map ? /* @__PURE__ */ new Map() : void 0;
	return _wrapNativeSuper = function _wrapNativeSuper(t) {
		if (null === t || !_isNativeFunction(t)) return t;
		if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function");
		if (void 0 !== r) {
			if (r.has(t)) return r.get(t);
			r.set(t, Wrapper);
		}
		function Wrapper() {
			return _construct(t, arguments, _getPrototypeOf(this).constructor);
		}
		return Wrapper.prototype = Object.create(t.prototype, { constructor: {
			value: Wrapper,
			enumerable: !1,
			writable: !0,
			configurable: !0
		} }), _setPrototypeOf(Wrapper, t);
	}, _wrapNativeSuper(t);
}
//#endregion
//#region node_modules/@rc-component/async-validator/es/util.js
init_typeof();
var formatRegExp = /%[sdj%]/g;
var warning = function warning() {};
if (typeof process !== "undefined" && typeof window !== "undefined" && typeof document !== "undefined") warning = function warning(type, errors) {
	if (typeof console !== "undefined" && console.warn && typeof ASYNC_VALIDATOR_NO_WARNING === "undefined") {
		if (errors.every(function(e) {
			return typeof e === "string";
		})) console.warn(type, errors);
	}
};
function convertFieldsError(errors) {
	if (!errors || !errors.length) return null;
	var fields = {};
	errors.forEach(function(error) {
		var field = error.field;
		fields[field] = fields[field] || [];
		fields[field].push(error);
	});
	return fields;
}
function format(template) {
	for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) args[_key - 1] = arguments[_key];
	var i = 0;
	var len = args.length;
	if (typeof template === "function") return template.apply(null, args);
	if (typeof template === "string") return template.replace(formatRegExp, function(x) {
		if (x === "%%") return "%";
		if (i >= len) return x;
		switch (x) {
			case "%s": return String(args[i++]);
			case "%d": return Number(args[i++]);
			case "%j":
				try {
					return JSON.stringify(args[i++]);
				} catch (_) {
					return "[Circular]";
				}
				break;
			default: return x;
		}
	});
	return template;
}
function isNativeStringType(type) {
	return type === "string" || type === "url" || type === "hex" || type === "email" || type === "date" || type === "pattern";
}
function isEmptyValue(value, type) {
	if (value === void 0 || value === null) return true;
	if (type === "array" && Array.isArray(value) && !value.length) return true;
	if (isNativeStringType(type) && typeof value === "string" && !value) return true;
	return false;
}
function asyncParallelArray(arr, func, callback) {
	var results = [];
	var total = 0;
	var arrLength = arr.length;
	function count(errors) {
		results.push.apply(results, _toConsumableArray(errors || []));
		total++;
		if (total === arrLength) callback(results);
	}
	arr.forEach(function(a) {
		func(a, count);
	});
}
function asyncSerialArray(arr, func, callback) {
	var index = 0;
	var arrLength = arr.length;
	function next(errors) {
		if (errors && errors.length) {
			callback(errors);
			return;
		}
		var original = index;
		index = index + 1;
		if (original < arrLength) func(arr[original], next);
		else callback([]);
	}
	next([]);
}
function flattenObjArr(objArr) {
	var ret = [];
	Object.keys(objArr).forEach(function(k) {
		ret.push.apply(ret, _toConsumableArray(objArr[k] || []));
	});
	return ret;
}
var AsyncValidationError = /*#__PURE__*/ function(_Error) {
	_inherits(AsyncValidationError, _Error);
	var _super = _createSuper(AsyncValidationError);
	function AsyncValidationError(errors, fields) {
		var _this;
		_classCallCheck(this, AsyncValidationError);
		_this = _super.call(this, "Async Validation Error");
		_defineProperty(_assertThisInitialized(_this), "errors", void 0);
		_defineProperty(_assertThisInitialized(_this), "fields", void 0);
		_this.errors = errors;
		_this.fields = fields;
		return _this;
	}
	return _createClass(AsyncValidationError);
}(/*#__PURE__*/ _wrapNativeSuper(Error));
function asyncMap(objArr, option, func, callback, source) {
	if (option.first) {
		var _pending = new Promise(function(resolve, reject) {
			asyncSerialArray(flattenObjArr(objArr), func, function next(errors) {
				callback(errors);
				return errors.length ? reject(new AsyncValidationError(errors, convertFieldsError(errors))) : resolve(source);
			});
		});
		_pending.catch(function(e) {
			return e;
		});
		return _pending;
	}
	var firstFields = option.firstFields === true ? Object.keys(objArr) : option.firstFields || [];
	var objArrKeys = Object.keys(objArr);
	var objArrLength = objArrKeys.length;
	var total = 0;
	var results = [];
	var pending = new Promise(function(resolve, reject) {
		var next = function next(errors) {
			results.push.apply(results, errors);
			total++;
			if (total === objArrLength) {
				callback(results);
				return results.length ? reject(new AsyncValidationError(results, convertFieldsError(results))) : resolve(source);
			}
		};
		if (!objArrKeys.length) {
			callback(results);
			resolve(source);
		}
		objArrKeys.forEach(function(key) {
			var arr = objArr[key];
			if (firstFields.indexOf(key) !== -1) asyncSerialArray(arr, func, next);
			else asyncParallelArray(arr, func, next);
		});
	});
	pending.catch(function(e) {
		return e;
	});
	return pending;
}
function isErrorObj(obj) {
	return !!(obj && obj.message !== void 0);
}
function getValue(value, path) {
	var v = value;
	for (var i = 0; i < path.length; i++) {
		if (v == void 0) return v;
		v = v[path[i]];
	}
	return v;
}
function complementError(rule, source) {
	return function(oe) {
		var fieldValue;
		if (rule.fullFields) fieldValue = getValue(source, rule.fullFields);
		else fieldValue = source[oe.field || rule.fullField];
		if (isErrorObj(oe)) {
			oe.field = oe.field || rule.fullField;
			oe.fieldValue = fieldValue;
			return oe;
		}
		return {
			message: typeof oe === "function" ? oe() : oe,
			fieldValue,
			field: oe.field || rule.fullField
		};
	};
}
function deepMerge(target, source) {
	if (source) {
		for (var s in source) if (source.hasOwnProperty(s)) {
			var value = source[s];
			if (_typeof(value) === "object" && _typeof(target[s]) === "object") target[s] = _objectSpread2(_objectSpread2({}, target[s]), value);
			else target[s] = value;
		}
	}
	return target;
}
//#endregion
//#region node_modules/@rc-component/async-validator/es/rule/enum.js
var ENUM$1 = "enum";
var enumerable$1 = function enumerable(rule, value, source, errors, options) {
	rule[ENUM$1] = Array.isArray(rule[ENUM$1]) ? rule[ENUM$1] : [];
	if (rule[ENUM$1].indexOf(value) === -1) errors.push(format(options.messages[ENUM$1], rule.fullField, rule[ENUM$1].join(", ")));
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/rule/pattern.js
var pattern$2 = function pattern(rule, value, source, errors, options) {
	if (rule.pattern) {
		if (rule.pattern instanceof RegExp) {
			rule.pattern.lastIndex = 0;
			if (!rule.pattern.test(value)) errors.push(format(options.messages.pattern.mismatch, rule.fullField, value, rule.pattern));
		} else if (typeof rule.pattern === "string") {
			if (!new RegExp(rule.pattern).test(value)) errors.push(format(options.messages.pattern.mismatch, rule.fullField, value, rule.pattern));
		}
	}
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/rule/range.js
var range = function range(rule, value, source, errors, options) {
	var len = typeof rule.len === "number";
	var min = typeof rule.min === "number";
	var max = typeof rule.max === "number";
	var spRegexp = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	var val = value;
	var key = null;
	var num = typeof value === "number";
	var str = typeof value === "string";
	var arr = Array.isArray(value);
	if (num) key = "number";
	else if (str) key = "string";
	else if (arr) key = "array";
	if (!key) return false;
	if (arr) val = value.length;
	if (str) val = value.replace(spRegexp, "_").length;
	if (len) {
		if (val !== rule.len) errors.push(format(options.messages[key].len, rule.fullField, rule.len));
	} else if (min && !max && val < rule.min) errors.push(format(options.messages[key].min, rule.fullField, rule.min));
	else if (max && !min && val > rule.max) errors.push(format(options.messages[key].max, rule.fullField, rule.max));
	else if (min && max && (val < rule.min || val > rule.max)) errors.push(format(options.messages[key].range, rule.fullField, rule.min, rule.max));
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/rule/required.js
var required$1 = function required(rule, value, source, errors, options, type) {
	if (rule.required && (!source.hasOwnProperty(rule.field) || isEmptyValue(value, type || rule.type))) errors.push(format(options.messages.required, rule.fullField));
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/rule/url.js
var urlReg;
var url_default = (function() {
	if (urlReg) return urlReg;
	var word = "[a-fA-F\\d:]";
	var b = function b(options) {
		return options && options.includeBoundaries ? "(?:(?<=\\s|^)(?=".concat(word, ")|(?<=").concat(word, ")(?=\\s|$))") : "";
	};
	var v4 = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}";
	var v6seg = "[a-fA-F\\d]{1,4}";
	var v6List = [
		"(?:".concat(v6seg, ":){7}(?:").concat(v6seg, "|:)"),
		"(?:".concat(v6seg, ":){6}(?:").concat(v4, "|:").concat(v6seg, "|:)"),
		"(?:".concat(v6seg, ":){5}(?::").concat(v4, "|(?::").concat(v6seg, "){1,2}|:)"),
		"(?:".concat(v6seg, ":){4}(?:(?::").concat(v6seg, "){0,1}:").concat(v4, "|(?::").concat(v6seg, "){1,3}|:)"),
		"(?:".concat(v6seg, ":){3}(?:(?::").concat(v6seg, "){0,2}:").concat(v4, "|(?::").concat(v6seg, "){1,4}|:)"),
		"(?:".concat(v6seg, ":){2}(?:(?::").concat(v6seg, "){0,3}:").concat(v4, "|(?::").concat(v6seg, "){1,5}|:)"),
		"(?:".concat(v6seg, ":){1}(?:(?::").concat(v6seg, "){0,4}:").concat(v4, "|(?::").concat(v6seg, "){1,6}|:)"),
		"(?::(?:(?::".concat(v6seg, "){0,5}:").concat(v4, "|(?::").concat(v6seg, "){1,7}|:))")
	];
	var v6 = "(?:".concat(v6List.join("|"), ")").concat("(?:%[0-9a-zA-Z]{1,})?");
	var v46Exact = new RegExp("(?:^".concat(v4, "$)|(?:^").concat(v6, "$)"));
	var v4exact = new RegExp("^".concat(v4, "$"));
	var v6exact = new RegExp("^".concat(v6, "$"));
	var ip = function ip(options) {
		return options && options.exact ? v46Exact : new RegExp("(?:".concat(b(options)).concat(v4).concat(b(options), ")|(?:").concat(b(options)).concat(v6).concat(b(options), ")"), "g");
	};
	ip.v4 = function(options) {
		return options && options.exact ? v4exact : new RegExp("".concat(b(options)).concat(v4).concat(b(options)), "g");
	};
	ip.v6 = function(options) {
		return options && options.exact ? v6exact : new RegExp("".concat(b(options)).concat(v6).concat(b(options)), "g");
	};
	var protocol = "(?:(?:[a-z]+:)?//)";
	var auth = "(?:\\S+(?::\\S*)?@)?";
	var ipv4 = ip.v4().source;
	var ipv6 = ip.v6().source;
	var regex = "(?:".concat(protocol, "|www\\.)").concat(auth, "(?:localhost|").concat(ipv4, "|").concat(ipv6, "|").concat("(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)").concat("(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*").concat("(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))", ")").concat("(?::\\d{2,5})?").concat("(?:[/?#][^\\s\"]*)?");
	urlReg = new RegExp("(?:^".concat(regex, "$)"), "i");
	return urlReg;
});
//#endregion
//#region node_modules/@rc-component/async-validator/es/rule/type.js
init_typeof();
var pattern$1 = {
	email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/,
	hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i
};
var types = {
	integer: function integer(value) {
		return types.number(value) && parseInt(value, 10) === value;
	},
	float: function float(value) {
		return types.number(value) && !types.integer(value);
	},
	array: function array(value) {
		return Array.isArray(value);
	},
	regexp: function regexp(value) {
		if (value instanceof RegExp) return true;
		try {
			return !!new RegExp(value);
		} catch (e) {
			return false;
		}
	},
	date: function date(value) {
		return typeof value.getTime === "function" && typeof value.getMonth === "function" && typeof value.getYear === "function" && !isNaN(value.getTime());
	},
	number: function number(value) {
		if (isNaN(value)) return false;
		return typeof value === "number";
	},
	object: function object(value) {
		return _typeof(value) === "object" && !types.array(value);
	},
	method: function method(value) {
		return typeof value === "function";
	},
	email: function email(value) {
		return typeof value === "string" && value.length <= 320 && !!value.match(pattern$1.email);
	},
	url: function url(value) {
		return typeof value === "string" && value.length <= 2048 && !!value.match(url_default());
	},
	hex: function hex(value) {
		return typeof value === "string" && !!value.match(pattern$1.hex);
	}
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/rule/index.js
var rule_default = {
	required: required$1,
	whitespace: function whitespace(rule, value, source, errors, options) {
		if (/^\s+$/.test(value) || value === "") errors.push(format(options.messages.whitespace, rule.fullField));
	},
	type: function type(rule, value, source, errors, options) {
		if (rule.required && value === void 0) {
			required$1(rule, value, source, errors, options);
			return;
		}
		var custom = [
			"integer",
			"float",
			"array",
			"regexp",
			"object",
			"method",
			"email",
			"number",
			"date",
			"url",
			"hex"
		];
		var ruleType = rule.type;
		if (custom.indexOf(ruleType) > -1) {
			if (!types[ruleType](value)) errors.push(format(options.messages.types[ruleType], rule.fullField, rule.type));
		} else if (ruleType && _typeof(value) !== rule.type) errors.push(format(options.messages.types[ruleType], rule.fullField, rule.type));
	},
	range,
	enum: enumerable$1,
	pattern: pattern$2
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/any.js
var any = function any(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/array.js
var array = function array(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if ((value === void 0 || value === null) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options, "array");
		if (value !== void 0 && value !== null) {
			rule_default.type(rule, value, source, errors, options);
			rule_default.range(rule, value, source, errors, options);
		}
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/boolean.js
var boolean = function boolean(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
		if (value !== void 0) rule_default.type(rule, value, source, errors, options);
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/date.js
var date = function date(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value, "date") && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
		if (!isEmptyValue(value, "date")) {
			var dateObject;
			if (value instanceof Date) dateObject = value;
			else dateObject = new Date(value);
			rule_default.type(rule, dateObject, source, errors, options);
			if (dateObject) rule_default.range(rule, dateObject.getTime(), source, errors, options);
		}
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/enum.js
var ENUM = "enum";
var enumerable = function enumerable(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
		if (value !== void 0) rule_default[ENUM](rule, value, source, errors, options);
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/float.js
var floatFn = function floatFn(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
		if (value !== void 0) {
			rule_default.type(rule, value, source, errors, options);
			rule_default.range(rule, value, source, errors, options);
		}
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/integer.js
var integer = function integer(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
		if (value !== void 0) {
			rule_default.type(rule, value, source, errors, options);
			rule_default.range(rule, value, source, errors, options);
		}
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/method.js
var method = function method(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
		if (value !== void 0) rule_default.type(rule, value, source, errors, options);
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/number.js
var number = function number(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (value === "") value = void 0;
		if (isEmptyValue(value) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
		if (value !== void 0) {
			rule_default.type(rule, value, source, errors, options);
			rule_default.range(rule, value, source, errors, options);
		}
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/object.js
var object = function object(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
		if (value !== void 0) rule_default.type(rule, value, source, errors, options);
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/pattern.js
var pattern = function pattern(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value, "string") && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
		if (!isEmptyValue(value, "string")) rule_default.pattern(rule, value, source, errors, options);
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/regexp.js
var regexp = function regexp(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options);
		if (!isEmptyValue(value)) rule_default.type(rule, value, source, errors, options);
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/required.js
init_typeof();
var required = function required(rule, value, callback, source, options) {
	var errors = [];
	var type = Array.isArray(value) ? "array" : _typeof(value);
	rule_default.required(rule, value, source, errors, options, type);
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/string.js
var string = function string(rule, value, callback, source, options) {
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value, "string") && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options, "string");
		if (!isEmptyValue(value, "string")) {
			rule_default.type(rule, value, source, errors, options);
			rule_default.range(rule, value, source, errors, options);
			rule_default.pattern(rule, value, source, errors, options);
			if (rule.whitespace === true) rule_default.whitespace(rule, value, source, errors, options);
		}
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/type.js
var type = function type(rule, value, callback, source, options) {
	var ruleType = rule.type;
	var errors = [];
	if (rule.required || !rule.required && source.hasOwnProperty(rule.field)) {
		if (isEmptyValue(value, ruleType) && !rule.required) return callback();
		rule_default.required(rule, value, source, errors, options, ruleType);
		if (!isEmptyValue(value, ruleType)) rule_default.type(rule, value, source, errors, options);
	}
	callback(errors);
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/validator/index.js
var validator_default = {
	string,
	method,
	number,
	boolean,
	regexp,
	integer,
	float: floatFn,
	array,
	object,
	enum: enumerable,
	pattern,
	date,
	url: type,
	hex: type,
	email: type,
	required,
	any
};
//#endregion
//#region node_modules/@rc-component/async-validator/es/index.js
init_toConsumableArray();
init_typeof();
init_classCallCheck();
init_createClass();
init_defineProperty();
/**
*  Encapsulates a validation schema.
*
*  @param descriptor An object declaring validation rules
*  for this schema.
*/
var Schema = /*#__PURE__*/ function() {
	function Schema(descriptor) {
		_classCallCheck(this, Schema);
		_defineProperty(this, "rules", null);
		_defineProperty(this, "_messages", messages);
		this.define(descriptor);
	}
	_createClass(Schema, [
		{
			key: "define",
			value: function define(rules) {
				var _this = this;
				if (!rules) throw new Error("Cannot configure a schema with no rules");
				if (_typeof(rules) !== "object" || Array.isArray(rules)) throw new Error("Rules must be an object");
				this.rules = {};
				Object.keys(rules).forEach(function(name) {
					var item = rules[name];
					_this.rules[name] = Array.isArray(item) ? item : [item];
				});
			}
		},
		{
			key: "messages",
			value: function messages(_messages) {
				if (_messages) this._messages = deepMerge(newMessages(), _messages);
				return this._messages;
			}
		},
		{
			key: "validate",
			value: function validate(source_) {
				var _this2 = this;
				var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
				var oc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : function() {};
				var source = source_;
				var options = o;
				var callback = oc;
				if (typeof options === "function") {
					callback = options;
					options = {};
				}
				if (!this.rules || Object.keys(this.rules).length === 0) {
					if (callback) callback(null, source);
					return Promise.resolve(source);
				}
				function complete(results) {
					var errors = [];
					var fields = {};
					function add(e) {
						if (Array.isArray(e)) {
							var _errors;
							errors = (_errors = errors).concat.apply(_errors, _toConsumableArray(e));
						} else errors.push(e);
					}
					for (var i = 0; i < results.length; i++) add(results[i]);
					if (!errors.length) callback(null, source);
					else {
						fields = convertFieldsError(errors);
						callback(errors, fields);
					}
				}
				if (options.messages) {
					var messages$1 = this.messages();
					if (messages$1 === messages) messages$1 = newMessages();
					deepMerge(messages$1, options.messages);
					options.messages = messages$1;
				} else options.messages = this.messages();
				var series = {};
				(options.keys || Object.keys(this.rules)).forEach(function(z) {
					var arr = _this2.rules[z];
					var value = source[z];
					arr.forEach(function(r) {
						var rule = r;
						if (typeof rule.transform === "function") {
							if (source === source_) source = _objectSpread2({}, source);
							value = source[z] = rule.transform(value);
							if (value !== void 0 && value !== null) rule.type = rule.type || (Array.isArray(value) ? "array" : _typeof(value));
						}
						if (typeof rule === "function") rule = { validator: rule };
						else rule = _objectSpread2({}, rule);
						rule.validator = _this2.getValidationMethod(rule);
						if (!rule.validator) return;
						rule.field = z;
						rule.fullField = rule.fullField || z;
						rule.type = _this2.getType(rule);
						series[z] = series[z] || [];
						series[z].push({
							rule,
							value,
							source,
							field: z
						});
					});
				});
				var errorFields = {};
				return asyncMap(series, options, function(data, doIt) {
					var rule = data.rule;
					var deep = (rule.type === "object" || rule.type === "array") && (_typeof(rule.fields) === "object" || _typeof(rule.defaultField) === "object");
					deep = deep && (rule.required || !rule.required && data.value);
					rule.field = data.field;
					function addFullField(key, schema) {
						return _objectSpread2(_objectSpread2({}, schema), {}, {
							fullField: "".concat(rule.fullField, ".").concat(key),
							fullFields: rule.fullFields ? [].concat(_toConsumableArray(rule.fullFields), [key]) : [key]
						});
					}
					function cb() {
						var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
						var errorList = Array.isArray(e) ? e : [e];
						if (!options.suppressWarning && errorList.length) Schema.warning("async-validator:", errorList);
						if (errorList.length && rule.message !== void 0) errorList = [].concat(rule.message);
						var filledErrors = errorList.map(complementError(rule, source));
						if (options.first && filledErrors.length) {
							errorFields[rule.field] = 1;
							return doIt(filledErrors);
						}
						if (!deep) doIt(filledErrors);
						else {
							if (rule.required && !data.value) {
								if (rule.message !== void 0) filledErrors = [].concat(rule.message).map(complementError(rule, source));
								else if (options.error) filledErrors = [options.error(rule, format(options.messages.required, rule.field))];
								return doIt(filledErrors);
							}
							var fieldsSchema = {};
							if (rule.defaultField) Object.keys(data.value).map(function(key) {
								fieldsSchema[key] = rule.defaultField;
							});
							fieldsSchema = _objectSpread2(_objectSpread2({}, fieldsSchema), data.rule.fields);
							var paredFieldsSchema = {};
							Object.keys(fieldsSchema).forEach(function(field) {
								var fieldSchema = fieldsSchema[field];
								paredFieldsSchema[field] = (Array.isArray(fieldSchema) ? fieldSchema : [fieldSchema]).map(addFullField.bind(null, field));
							});
							var schema = new Schema(paredFieldsSchema);
							schema.messages(options.messages);
							if (data.rule.options) {
								data.rule.options.messages = options.messages;
								data.rule.options.error = options.error;
							}
							schema.validate(data.value, data.rule.options || options, function(errs) {
								var finalErrors = [];
								if (filledErrors && filledErrors.length) finalErrors.push.apply(finalErrors, _toConsumableArray(filledErrors));
								if (errs && errs.length) finalErrors.push.apply(finalErrors, _toConsumableArray(errs));
								doIt(finalErrors.length ? finalErrors : null);
							});
						}
					}
					var res;
					if (rule.asyncValidator) res = rule.asyncValidator(rule, data.value, cb, data.source, options);
					else if (rule.validator) {
						try {
							res = rule.validator(rule, data.value, cb, data.source, options);
						} catch (error) {
							var _console$error, _console;
							(_console$error = (_console = console).error) === null || _console$error === void 0 || _console$error.call(_console, error);
							if (!options.suppressValidatorError) setTimeout(function() {
								throw error;
							}, 0);
							cb(error.message);
						}
						if (res === true) cb();
						else if (res === false) cb(typeof rule.message === "function" ? rule.message(rule.fullField || rule.field) : rule.message || "".concat(rule.fullField || rule.field, " fails"));
						else if (res instanceof Array) cb(res);
						else if (res instanceof Error) cb(res.message);
					}
					if (res && res.then) res.then(function() {
						return cb();
					}, function(e) {
						return cb(e);
					});
				}, function(results) {
					complete(results);
				}, source);
			}
		},
		{
			key: "getType",
			value: function getType(rule) {
				if (rule.type === void 0 && rule.pattern instanceof RegExp) rule.type = "pattern";
				if (typeof rule.validator !== "function" && rule.type && !validator_default.hasOwnProperty(rule.type)) throw new Error(format("Unknown rule type %s", rule.type));
				return rule.type || "string";
			}
		},
		{
			key: "getValidationMethod",
			value: function getValidationMethod(rule) {
				if (typeof rule.validator === "function") return rule.validator;
				var keys = Object.keys(rule);
				var messageIndex = keys.indexOf("message");
				if (messageIndex !== -1) keys.splice(messageIndex, 1);
				if (keys.length === 1 && keys[0] === "required") return validator_default.required;
				return validator_default[this.getType(rule)] || void 0;
			}
		}
	]);
	return Schema;
}();
_defineProperty(Schema, "register", function register(type, validator) {
	if (typeof validator !== "function") throw new Error("Cannot register a validator by type, validator is not a function");
	validator_default[type] = validator;
});
_defineProperty(Schema, "warning", warning);
_defineProperty(Schema, "messages", messages);
_defineProperty(Schema, "validators", validator_default);
//#endregion
//#region node_modules/rc-field-form/es/utils/messages.js
var typeTemplate = "'${name}' is not a valid ${type}";
var defaultValidateMessages = {
	default: "Validation error on field '${name}'",
	required: "'${name}' is required",
	enum: "'${name}' must be one of [${enum}]",
	whitespace: "'${name}' cannot be empty",
	date: {
		format: "'${name}' is invalid for format date",
		parse: "'${name}' could not be parsed as date",
		invalid: "'${name}' is invalid date"
	},
	types: {
		string: typeTemplate,
		method: typeTemplate,
		array: typeTemplate,
		object: typeTemplate,
		number: typeTemplate,
		date: typeTemplate,
		boolean: typeTemplate,
		integer: typeTemplate,
		float: typeTemplate,
		regexp: typeTemplate,
		email: typeTemplate,
		url: typeTemplate,
		hex: typeTemplate
	},
	string: {
		len: "'${name}' must be exactly ${len} characters",
		min: "'${name}' must be at least ${min} characters",
		max: "'${name}' cannot be longer than ${max} characters",
		range: "'${name}' must be between ${min} and ${max} characters"
	},
	number: {
		len: "'${name}' must equal ${len}",
		min: "'${name}' cannot be less than ${min}",
		max: "'${name}' cannot be greater than ${max}",
		range: "'${name}' must be between ${min} and ${max}"
	},
	array: {
		len: "'${name}' must be exactly ${len} in length",
		min: "'${name}' cannot be less than ${min} in length",
		max: "'${name}' cannot be greater than ${max} in length",
		range: "'${name}' must be between ${min} and ${max} in length"
	},
	pattern: { mismatch: "'${name}' does not match pattern ${pattern}" }
};
//#endregion
//#region node_modules/rc-field-form/es/utils/validateUtil.js
init_toConsumableArray();
init_defineProperty();
var AsyncValidator = Schema;
/**
* Replace with template.
*   `I'm ${name}` + { name: 'bamboo' } = I'm bamboo
*/
function replaceMessage(template, kv) {
	return template.replace(/\\?\$\{\w+\}/g, function(str) {
		if (str.startsWith("\\")) return str.slice(1);
		return kv[str.slice(2, -1)];
	});
}
var CODE_LOGIC_ERROR = "CODE_LOGIC_ERROR";
function validateRule(_x, _x2, _x3, _x4, _x5) {
	return _validateRule.apply(this, arguments);
}
/**
* We use `async-validator` to validate the value.
* But only check one value in a time to avoid namePath validate issue.
*/
function _validateRule() {
	_validateRule = _asyncToGenerator(/*#__PURE__*/ _regeneratorRuntime().mark(function _callee2(name, value, rule, options, messageVariables) {
		var cloneRule, originValidator, subRuleField, validator, messages, result, subResults, kv, fillVariableResult;
		return _regeneratorRuntime().wrap(function _callee2$(_context2) {
			while (1) switch (_context2.prev = _context2.next) {
				case 0:
					cloneRule = _objectSpread2({}, rule);
					delete cloneRule.ruleIndex;
					AsyncValidator.warning = function() {};
					if (cloneRule.validator) {
						originValidator = cloneRule.validator;
						cloneRule.validator = function() {
							try {
								return originValidator.apply(void 0, arguments);
							} catch (error) {
								console.error(error);
								return Promise.reject(CODE_LOGIC_ERROR);
							}
						};
					}
					subRuleField = null;
					if (cloneRule && cloneRule.type === "array" && cloneRule.defaultField) {
						subRuleField = cloneRule.defaultField;
						delete cloneRule.defaultField;
					}
					validator = new AsyncValidator(_defineProperty({}, name, [cloneRule]));
					messages = merge(defaultValidateMessages, options.validateMessages);
					validator.messages(messages);
					result = [];
					_context2.prev = 10;
					_context2.next = 13;
					return Promise.resolve(validator.validate(_defineProperty({}, name, value), _objectSpread2({}, options)));
				case 13:
					_context2.next = 18;
					break;
				case 15:
					_context2.prev = 15;
					_context2.t0 = _context2["catch"](10);
					if (_context2.t0.errors) result = _context2.t0.errors.map(function(_ref4, index) {
						var message = _ref4.message;
						var mergedMessage = message === CODE_LOGIC_ERROR ? messages.default : message;
						return /*#__PURE__*/ import_react.isValidElement(mergedMessage) ? /*#__PURE__*/ import_react.cloneElement(mergedMessage, { key: "error_".concat(index) }) : mergedMessage;
					});
				case 18:
					if (!(!result.length && subRuleField)) {
						_context2.next = 23;
						break;
					}
					_context2.next = 21;
					return Promise.all(value.map(function(subValue, i) {
						return validateRule("".concat(name, ".").concat(i), subValue, subRuleField, options, messageVariables);
					}));
				case 21:
					subResults = _context2.sent;
					return _context2.abrupt("return", subResults.reduce(function(prev, errors) {
						return [].concat(_toConsumableArray(prev), _toConsumableArray(errors));
					}, []));
				case 23:
					kv = _objectSpread2(_objectSpread2({}, rule), {}, {
						name,
						enum: (rule.enum || []).join(", ")
					}, messageVariables);
					fillVariableResult = result.map(function(error) {
						if (typeof error === "string") return replaceMessage(error, kv);
						return error;
					});
					return _context2.abrupt("return", fillVariableResult);
				case 26:
				case "end": return _context2.stop();
			}
		}, _callee2, null, [[10, 15]]);
	}));
	return _validateRule.apply(this, arguments);
}
function validateRules(namePath, value, rules, options, validateFirst, messageVariables) {
	var name = namePath.join(".");
	var filledRules = rules.map(function(currentRule, ruleIndex) {
		var originValidatorFunc = currentRule.validator;
		var cloneRule = _objectSpread2(_objectSpread2({}, currentRule), {}, { ruleIndex });
		if (originValidatorFunc) cloneRule.validator = function(rule, val, callback) {
			var hasPromise = false;
			var promise = originValidatorFunc(rule, val, function wrappedCallback() {
				for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
				Promise.resolve().then(function() {
					warningOnce(!hasPromise, "Your validator function has already return a promise. `callback` will be ignored.");
					if (!hasPromise) callback.apply(void 0, args);
				});
			});
			hasPromise = promise && typeof promise.then === "function" && typeof promise.catch === "function";
			/**
			* 1. Use promise as the first priority.
			* 2. If promise not exist, use callback with warning instead
			*/
			warningOnce(hasPromise, "`callback` is deprecated. Please return a promise instead.");
			if (hasPromise) promise.then(function() {
				callback();
			}).catch(function(err) {
				callback(err || " ");
			});
		};
		return cloneRule;
	}).sort(function(_ref, _ref2) {
		var w1 = _ref.warningOnly, i1 = _ref.ruleIndex;
		var w2 = _ref2.warningOnly, i2 = _ref2.ruleIndex;
		if (!!w1 === !!w2) return i1 - i2;
		if (w1) return 1;
		return -1;
	});
	var summaryPromise;
	if (validateFirst === true) summaryPromise = new Promise(/*#__PURE__*/ function() {
		var _ref3 = _asyncToGenerator(/*#__PURE__*/ _regeneratorRuntime().mark(function _callee(resolve, reject) {
			var i, rule, errors;
			return _regeneratorRuntime().wrap(function _callee$(_context) {
				while (1) switch (_context.prev = _context.next) {
					case 0: i = 0;
					case 1:
						if (!(i < filledRules.length)) {
							_context.next = 12;
							break;
						}
						rule = filledRules[i];
						_context.next = 5;
						return validateRule(name, value, rule, options, messageVariables);
					case 5:
						errors = _context.sent;
						if (!errors.length) {
							_context.next = 9;
							break;
						}
						reject([{
							errors,
							rule
						}]);
						return _context.abrupt("return");
					case 9:
						i += 1;
						_context.next = 1;
						break;
					case 12: resolve([]);
					case 13:
					case "end": return _context.stop();
				}
			}, _callee);
		}));
		return function(_x6, _x7) {
			return _ref3.apply(this, arguments);
		};
	}());
	else {
		var rulePromises = filledRules.map(function(rule) {
			return validateRule(name, value, rule, options, messageVariables).then(function(errors) {
				return {
					errors,
					rule
				};
			});
		});
		summaryPromise = (validateFirst ? finishOnFirstFailed(rulePromises) : finishOnAllFailed(rulePromises)).then(function(errors) {
			return Promise.reject(errors);
		});
	}
	summaryPromise.catch(function(e) {
		return e;
	});
	return summaryPromise;
}
function finishOnAllFailed(_x8) {
	return _finishOnAllFailed.apply(this, arguments);
}
function _finishOnAllFailed() {
	_finishOnAllFailed = _asyncToGenerator(/*#__PURE__*/ _regeneratorRuntime().mark(function _callee3(rulePromises) {
		return _regeneratorRuntime().wrap(function _callee3$(_context3) {
			while (1) switch (_context3.prev = _context3.next) {
				case 0: return _context3.abrupt("return", Promise.all(rulePromises).then(function(errorsList) {
					var _ref5;
					return (_ref5 = []).concat.apply(_ref5, _toConsumableArray(errorsList));
				}));
				case 1:
				case "end": return _context3.stop();
			}
		}, _callee3);
	}));
	return _finishOnAllFailed.apply(this, arguments);
}
function finishOnFirstFailed(_x9) {
	return _finishOnFirstFailed.apply(this, arguments);
}
function _finishOnFirstFailed() {
	_finishOnFirstFailed = _asyncToGenerator(/*#__PURE__*/ _regeneratorRuntime().mark(function _callee4(rulePromises) {
		var count;
		return _regeneratorRuntime().wrap(function _callee4$(_context4) {
			while (1) switch (_context4.prev = _context4.next) {
				case 0:
					count = 0;
					return _context4.abrupt("return", new Promise(function(resolve) {
						rulePromises.forEach(function(promise) {
							promise.then(function(ruleError) {
								if (ruleError.errors.length) resolve([ruleError]);
								count += 1;
								if (count === rulePromises.length) resolve([]);
							});
						});
					}));
				case 2:
				case "end": return _context4.stop();
			}
		}, _callee4);
	}));
	return _finishOnFirstFailed.apply(this, arguments);
}
//#endregion
//#region node_modules/rc-field-form/es/utils/valueUtil.js
init_toConsumableArray();
init_typeof();
/**
* Convert name to internal supported format.
* This function should keep since we still thinking if need support like `a.b.c` format.
* 'a' => ['a']
* 123 => [123]
* ['a', 123] => ['a', 123]
*/
function getNamePath(path) {
	return toArray(path);
}
function cloneByNamePathList(store, namePathList) {
	var newStore = {};
	namePathList.forEach(function(namePath) {
		var value = get(store, namePath);
		newStore = set(newStore, namePath, value);
	});
	return newStore;
}
/**
* Check if `namePathList` includes `namePath`.
* @param namePathList A list of `InternalNamePath[]`
* @param namePath Compare `InternalNamePath`
* @param partialMatch True will make `[a, b]` match `[a, b, c]`
*/
function containsNamePath(namePathList, namePath) {
	var partialMatch = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
	return namePathList && namePathList.some(function(path) {
		return matchNamePath(namePath, path, partialMatch);
	});
}
/**
* Check if `namePath` is super set or equal of `subNamePath`.
* @param namePath A list of `InternalNamePath[]`
* @param subNamePath Compare `InternalNamePath`
* @param partialMatch True will make `[a, b]` match `[a, b, c]`
*/
function matchNamePath(namePath, subNamePath) {
	var partialMatch = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
	if (!namePath || !subNamePath) return false;
	if (!partialMatch && namePath.length !== subNamePath.length) return false;
	return subNamePath.every(function(nameUnit, i) {
		return namePath[i] === nameUnit;
	});
}
function isSimilar(source, target) {
	if (source === target) return true;
	if (!source && target || source && !target) return false;
	if (!source || !target || _typeof(source) !== "object" || _typeof(target) !== "object") return false;
	var sourceKeys = Object.keys(source);
	var targetKeys = Object.keys(target);
	return _toConsumableArray(new Set([].concat(sourceKeys, targetKeys))).every(function(key) {
		var sourceValue = source[key];
		var targetValue = target[key];
		if (typeof sourceValue === "function" && typeof targetValue === "function") return true;
		return sourceValue === targetValue;
	});
}
function defaultGetValueFromEvent(valuePropName) {
	var event = arguments.length <= 1 ? void 0 : arguments[1];
	if (event && event.target && _typeof(event.target) === "object" && valuePropName in event.target) return event.target[valuePropName];
	return event;
}
/**
* Moves an array item from one position in an array to another.
*
* Note: This is a pure function so a new array will be returned, instead
* of altering the array argument.
*
* @param array         Array in which to move an item.         (required)
* @param moveIndex     The index of the item to move.          (required)
* @param toIndex       The index to move item at moveIndex to. (required)
*/
function move(array, moveIndex, toIndex) {
	var length = array.length;
	if (moveIndex < 0 || moveIndex >= length || toIndex < 0 || toIndex >= length) return array;
	var item = array[moveIndex];
	var diff = moveIndex - toIndex;
	if (diff > 0) return [].concat(_toConsumableArray(array.slice(0, toIndex)), [item], _toConsumableArray(array.slice(toIndex, moveIndex)), _toConsumableArray(array.slice(moveIndex + 1, length)));
	if (diff < 0) return [].concat(_toConsumableArray(array.slice(0, moveIndex)), _toConsumableArray(array.slice(moveIndex + 1, toIndex + 1)), [item], _toConsumableArray(array.slice(toIndex + 1, length)));
	return array;
}
//#endregion
//#region node_modules/rc-field-form/es/Field.js
init_toConsumableArray();
init_classCallCheck();
init_createClass();
init_assertThisInitialized();
init_defineProperty();
var _excluded$2 = ["name"];
var EMPTY_ERRORS = [];
function requireUpdate(shouldUpdate, prev, next, prevValue, nextValue, info) {
	if (typeof shouldUpdate === "function") return shouldUpdate(prev, next, "source" in info ? { source: info.source } : {});
	return prevValue !== nextValue;
}
var Field = /*#__PURE__*/ function(_React$Component) {
	_inherits(Field, _React$Component);
	var _super = _createSuper(Field);
	function Field(props) {
		var _this;
		_classCallCheck(this, Field);
		_this = _super.call(this, props);
		_defineProperty(_assertThisInitialized(_this), "state", { resetCount: 0 });
		_defineProperty(_assertThisInitialized(_this), "cancelRegisterFunc", null);
		_defineProperty(_assertThisInitialized(_this), "mounted", false);
		/**
		* Follow state should not management in State since it will async update by React.
		* This makes first render of form can not get correct state value.
		*/
		_defineProperty(_assertThisInitialized(_this), "touched", false);
		/**
		* Mark when touched & validated. Currently only used for `dependencies`.
		* Note that we do not think field with `initialValue` is dirty
		* but this will be by `isFieldDirty` func.
		*/
		_defineProperty(_assertThisInitialized(_this), "dirty", false);
		_defineProperty(_assertThisInitialized(_this), "validatePromise", void 0);
		_defineProperty(_assertThisInitialized(_this), "prevValidating", void 0);
		_defineProperty(_assertThisInitialized(_this), "errors", EMPTY_ERRORS);
		_defineProperty(_assertThisInitialized(_this), "warnings", EMPTY_ERRORS);
		_defineProperty(_assertThisInitialized(_this), "cancelRegister", function() {
			var _this$props = _this.props, preserve = _this$props.preserve, isListField = _this$props.isListField, name = _this$props.name;
			if (_this.cancelRegisterFunc) _this.cancelRegisterFunc(isListField, preserve, getNamePath(name));
			_this.cancelRegisterFunc = null;
		});
		_defineProperty(_assertThisInitialized(_this), "getNamePath", function() {
			var _this$props2 = _this.props, name = _this$props2.name;
			var _fieldContext$prefixN = _this$props2.fieldContext.prefixName, prefixName = _fieldContext$prefixN === void 0 ? [] : _fieldContext$prefixN;
			return name !== void 0 ? [].concat(_toConsumableArray(prefixName), _toConsumableArray(name)) : [];
		});
		_defineProperty(_assertThisInitialized(_this), "getRules", function() {
			var _this$props3 = _this.props, _this$props3$rules = _this$props3.rules, rules = _this$props3$rules === void 0 ? [] : _this$props3$rules, fieldContext = _this$props3.fieldContext;
			return rules.map(function(rule) {
				if (typeof rule === "function") return rule(fieldContext);
				return rule;
			});
		});
		_defineProperty(_assertThisInitialized(_this), "refresh", function() {
			if (!_this.mounted) return;
			/**
			* Clean up current node.
			*/
			_this.setState(function(_ref) {
				return { resetCount: _ref.resetCount + 1 };
			});
		});
		_defineProperty(_assertThisInitialized(_this), "metaCache", null);
		_defineProperty(_assertThisInitialized(_this), "triggerMetaEvent", function(destroy) {
			var onMetaChange = _this.props.onMetaChange;
			if (onMetaChange) {
				var _meta = _objectSpread2(_objectSpread2({}, _this.getMeta()), {}, { destroy });
				if (!isEqual(_this.metaCache, _meta)) onMetaChange(_meta);
				_this.metaCache = _meta;
			} else _this.metaCache = null;
		});
		_defineProperty(_assertThisInitialized(_this), "onStoreChange", function(prevStore, namePathList, info) {
			var _this$props4 = _this.props, shouldUpdate = _this$props4.shouldUpdate, _this$props4$dependen = _this$props4.dependencies, dependencies = _this$props4$dependen === void 0 ? [] : _this$props4$dependen, onReset = _this$props4.onReset;
			var store = info.store;
			var namePath = _this.getNamePath();
			var prevValue = _this.getValue(prevStore);
			var curValue = _this.getValue(store);
			var namePathMatch = namePathList && containsNamePath(namePathList, namePath);
			if (info.type === "valueUpdate" && info.source === "external" && !isEqual(prevValue, curValue)) {
				_this.touched = true;
				_this.dirty = true;
				_this.validatePromise = null;
				_this.errors = EMPTY_ERRORS;
				_this.warnings = EMPTY_ERRORS;
				_this.triggerMetaEvent();
			}
			switch (info.type) {
				case "reset":
					if (!namePathList || namePathMatch) {
						_this.touched = false;
						_this.dirty = false;
						_this.validatePromise = void 0;
						_this.errors = EMPTY_ERRORS;
						_this.warnings = EMPTY_ERRORS;
						_this.triggerMetaEvent();
						onReset === null || onReset === void 0 || onReset();
						_this.refresh();
						return;
					}
					break;
				/**
				* In case field with `preserve = false` nest deps like:
				* - A = 1 => show B
				* - B = 1 => show C
				* - Reset A, need clean B, C
				*/
				case "remove":
					if (shouldUpdate && requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info)) {
						_this.reRender();
						return;
					}
					break;
				case "setField":
					var data = info.data;
					if (namePathMatch) {
						if ("touched" in data) _this.touched = data.touched;
						if ("validating" in data && !("originRCField" in data)) _this.validatePromise = data.validating ? Promise.resolve([]) : null;
						if ("errors" in data) _this.errors = data.errors || EMPTY_ERRORS;
						if ("warnings" in data) _this.warnings = data.warnings || EMPTY_ERRORS;
						_this.dirty = true;
						_this.triggerMetaEvent();
						_this.reRender();
						return;
					} else if ("value" in data && containsNamePath(namePathList, namePath, true)) {
						_this.reRender();
						return;
					}
					if (shouldUpdate && !namePath.length && requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info)) {
						_this.reRender();
						return;
					}
					break;
				case "dependenciesUpdate":
					if (dependencies.map(getNamePath).some(function(dependency) {
						return containsNamePath(info.relatedFields, dependency);
					})) {
						_this.reRender();
						return;
					}
					break;
				default:
					if (namePathMatch || (!dependencies.length || namePath.length || shouldUpdate) && requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info)) {
						_this.reRender();
						return;
					}
					break;
			}
			if (shouldUpdate === true) _this.reRender();
		});
		_defineProperty(_assertThisInitialized(_this), "validateRules", function(options) {
			var namePath = _this.getNamePath();
			var currentValue = _this.getValue();
			var _ref2 = options || {}, triggerName = _ref2.triggerName, _ref2$validateOnly = _ref2.validateOnly, validateOnly = _ref2$validateOnly === void 0 ? false : _ref2$validateOnly;
			var rootPromise = Promise.resolve().then(/*#__PURE__*/ _asyncToGenerator(/*#__PURE__*/ _regeneratorRuntime().mark(function _callee() {
				var _this$props5, _this$props5$validate, validateFirst, messageVariables, validateDebounce, filteredRules, promise;
				return _regeneratorRuntime().wrap(function _callee$(_context) {
					while (1) switch (_context.prev = _context.next) {
						case 0:
							if (_this.mounted) {
								_context.next = 2;
								break;
							}
							return _context.abrupt("return", []);
						case 2:
							_this$props5 = _this.props, _this$props5$validate = _this$props5.validateFirst, validateFirst = _this$props5$validate === void 0 ? false : _this$props5$validate, messageVariables = _this$props5.messageVariables, validateDebounce = _this$props5.validateDebounce;
							filteredRules = _this.getRules();
							if (triggerName) filteredRules = filteredRules.filter(function(rule) {
								return rule;
							}).filter(function(rule) {
								var validateTrigger = rule.validateTrigger;
								if (!validateTrigger) return true;
								return toArray(validateTrigger).includes(triggerName);
							});
							if (!(validateDebounce && triggerName)) {
								_context.next = 10;
								break;
							}
							_context.next = 8;
							return new Promise(function(resolve) {
								setTimeout(resolve, validateDebounce);
							});
						case 8:
							if (!(_this.validatePromise !== rootPromise)) {
								_context.next = 10;
								break;
							}
							return _context.abrupt("return", []);
						case 10:
							promise = validateRules(namePath, currentValue, filteredRules, options, validateFirst, messageVariables);
							promise.catch(function(e) {
								return e;
							}).then(function() {
								var ruleErrors = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : EMPTY_ERRORS;
								if (_this.validatePromise === rootPromise) {
									var _ruleErrors$forEach;
									_this.validatePromise = null;
									var nextErrors = [];
									var nextWarnings = [];
									(_ruleErrors$forEach = ruleErrors.forEach) === null || _ruleErrors$forEach === void 0 || _ruleErrors$forEach.call(ruleErrors, function(_ref4) {
										var warningOnly = _ref4.rule.warningOnly, _ref4$errors = _ref4.errors, errors = _ref4$errors === void 0 ? EMPTY_ERRORS : _ref4$errors;
										if (warningOnly) nextWarnings.push.apply(nextWarnings, _toConsumableArray(errors));
										else nextErrors.push.apply(nextErrors, _toConsumableArray(errors));
									});
									_this.errors = nextErrors;
									_this.warnings = nextWarnings;
									_this.triggerMetaEvent();
									_this.reRender();
								}
							});
							return _context.abrupt("return", promise);
						case 13:
						case "end": return _context.stop();
					}
				}, _callee);
			})));
			if (validateOnly) return rootPromise;
			_this.validatePromise = rootPromise;
			_this.dirty = true;
			_this.errors = EMPTY_ERRORS;
			_this.warnings = EMPTY_ERRORS;
			_this.triggerMetaEvent();
			_this.reRender();
			return rootPromise;
		});
		_defineProperty(_assertThisInitialized(_this), "isFieldValidating", function() {
			return !!_this.validatePromise;
		});
		_defineProperty(_assertThisInitialized(_this), "isFieldTouched", function() {
			return _this.touched;
		});
		_defineProperty(_assertThisInitialized(_this), "isFieldDirty", function() {
			if (_this.dirty || _this.props.initialValue !== void 0) return true;
			var getInitialValue = _this.props.fieldContext.getInternalHooks(HOOK_MARK).getInitialValue;
			if (getInitialValue(_this.getNamePath()) !== void 0) return true;
			return false;
		});
		_defineProperty(_assertThisInitialized(_this), "getErrors", function() {
			return _this.errors;
		});
		_defineProperty(_assertThisInitialized(_this), "getWarnings", function() {
			return _this.warnings;
		});
		_defineProperty(_assertThisInitialized(_this), "isListField", function() {
			return _this.props.isListField;
		});
		_defineProperty(_assertThisInitialized(_this), "isList", function() {
			return _this.props.isList;
		});
		_defineProperty(_assertThisInitialized(_this), "isPreserve", function() {
			return _this.props.preserve;
		});
		_defineProperty(_assertThisInitialized(_this), "getMeta", function() {
			_this.prevValidating = _this.isFieldValidating();
			return {
				touched: _this.isFieldTouched(),
				validating: _this.prevValidating,
				errors: _this.errors,
				warnings: _this.warnings,
				name: _this.getNamePath(),
				validated: _this.validatePromise === null
			};
		});
		_defineProperty(_assertThisInitialized(_this), "getOnlyChild", function(children) {
			if (typeof children === "function") {
				var _meta2 = _this.getMeta();
				return _objectSpread2(_objectSpread2({}, _this.getOnlyChild(children(_this.getControlled(), _meta2, _this.props.fieldContext))), {}, { isFunction: true });
			}
			var childList = toArray$1(children);
			if (childList.length !== 1 || !/*#__PURE__*/ import_react.isValidElement(childList[0])) return {
				child: childList,
				isFunction: false
			};
			return {
				child: childList[0],
				isFunction: false
			};
		});
		_defineProperty(_assertThisInitialized(_this), "getValue", function(store) {
			var getFieldsValue = _this.props.fieldContext.getFieldsValue;
			var namePath = _this.getNamePath();
			return get(store || getFieldsValue(true), namePath);
		});
		_defineProperty(_assertThisInitialized(_this), "getControlled", function() {
			var childProps = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
			var _this$props6 = _this.props, name = _this$props6.name, trigger = _this$props6.trigger, validateTrigger = _this$props6.validateTrigger, getValueFromEvent = _this$props6.getValueFromEvent, normalize = _this$props6.normalize, valuePropName = _this$props6.valuePropName, getValueProps = _this$props6.getValueProps, fieldContext = _this$props6.fieldContext;
			var mergedValidateTrigger = validateTrigger !== void 0 ? validateTrigger : fieldContext.validateTrigger;
			var namePath = _this.getNamePath();
			var getInternalHooks = fieldContext.getInternalHooks, getFieldsValue = fieldContext.getFieldsValue;
			var dispatch = getInternalHooks(HOOK_MARK).dispatch;
			var value = _this.getValue();
			var mergedGetValueProps = getValueProps || function(val) {
				return _defineProperty({}, valuePropName, val);
			};
			var originTriggerFunc = childProps[trigger];
			var valueProps = name !== void 0 ? mergedGetValueProps(value) : {};
			if (valueProps) Object.keys(valueProps).forEach(function(key) {
				warningOnce(typeof valueProps[key] !== "function", "It's not recommended to generate dynamic function prop by `getValueProps`. Please pass it to child component directly (prop: ".concat(key, ")"));
			});
			var control = _objectSpread2(_objectSpread2({}, childProps), valueProps);
			control[trigger] = function() {
				_this.touched = true;
				_this.dirty = true;
				_this.triggerMetaEvent();
				var newValue;
				for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
				if (getValueFromEvent) newValue = getValueFromEvent.apply(void 0, args);
				else newValue = defaultGetValueFromEvent.apply(void 0, [valuePropName].concat(args));
				if (normalize) newValue = normalize(newValue, value, getFieldsValue(true));
				if (newValue !== value) dispatch({
					type: "updateValue",
					namePath,
					value: newValue
				});
				if (originTriggerFunc) originTriggerFunc.apply(void 0, args);
			};
			toArray(mergedValidateTrigger || []).forEach(function(triggerName) {
				var originTrigger = control[triggerName];
				control[triggerName] = function() {
					if (originTrigger) originTrigger.apply(void 0, arguments);
					var rules = _this.props.rules;
					if (rules && rules.length) dispatch({
						type: "validateField",
						namePath,
						triggerName
					});
				};
			});
			return control;
		});
		if (props.fieldContext) {
			var getInternalHooks = props.fieldContext.getInternalHooks;
			var initEntityValue = getInternalHooks(HOOK_MARK).initEntityValue;
			initEntityValue(_assertThisInitialized(_this));
		}
		return _this;
	}
	_createClass(Field, [
		{
			key: "componentDidMount",
			value: function componentDidMount() {
				var _this$props7 = this.props, shouldUpdate = _this$props7.shouldUpdate, fieldContext = _this$props7.fieldContext;
				this.mounted = true;
				if (fieldContext) {
					var getInternalHooks = fieldContext.getInternalHooks;
					var registerField = getInternalHooks(HOOK_MARK).registerField;
					this.cancelRegisterFunc = registerField(this);
				}
				if (shouldUpdate === true) this.reRender();
			}
		},
		{
			key: "componentWillUnmount",
			value: function componentWillUnmount() {
				this.cancelRegister();
				this.triggerMetaEvent(true);
				this.mounted = false;
			}
		},
		{
			key: "reRender",
			value: function reRender() {
				if (!this.mounted) return;
				this.forceUpdate();
			}
		},
		{
			key: "render",
			value: function render() {
				var resetCount = this.state.resetCount;
				var children = this.props.children;
				var _this$getOnlyChild = this.getOnlyChild(children), child = _this$getOnlyChild.child, isFunction = _this$getOnlyChild.isFunction;
				var returnChildNode;
				if (isFunction) returnChildNode = child;
				else if (/*#__PURE__*/ import_react.isValidElement(child)) returnChildNode = /*#__PURE__*/ import_react.cloneElement(child, this.getControlled(child.props));
				else {
					warningOnce(!child, "`children` of Field is not validate ReactElement.");
					returnChildNode = child;
				}
				return /*#__PURE__*/ import_react.createElement(import_react.Fragment, { key: resetCount }, returnChildNode);
			}
		}
	]);
	return Field;
}(import_react.Component);
_defineProperty(Field, "contextType", Context);
_defineProperty(Field, "defaultProps", {
	trigger: "onChange",
	valuePropName: "value"
});
function WrapperField(_ref6) {
	var _restProps$isListFiel;
	var name = _ref6.name, restProps = _objectWithoutProperties(_ref6, _excluded$2);
	var fieldContext = import_react.useContext(Context);
	var listContext = import_react.useContext(ListContext);
	var namePath = name !== void 0 ? getNamePath(name) : void 0;
	var isMergedListField = (_restProps$isListFiel = restProps.isListField) !== null && _restProps$isListFiel !== void 0 ? _restProps$isListFiel : !!listContext;
	var key = "keep";
	if (!isMergedListField) key = "_".concat((namePath || []).join("_"));
	if (restProps.preserve === false && isMergedListField && namePath.length <= 1) warningOnce(false, "`preserve` should not apply on Form.List fields.");
	return /*#__PURE__*/ import_react.createElement(Field, _extends({
		key,
		name: namePath,
		isListField: isMergedListField
	}, restProps, { fieldContext }));
}
//#endregion
//#region node_modules/rc-field-form/es/List.js
init_toConsumableArray();
function List(_ref) {
	var name = _ref.name, initialValue = _ref.initialValue, children = _ref.children, rules = _ref.rules, validateTrigger = _ref.validateTrigger, isListField = _ref.isListField;
	var context = import_react.useContext(Context);
	var wrapperListContext = import_react.useContext(ListContext);
	var keyManager = import_react.useRef({
		keys: [],
		id: 0
	}).current;
	var prefixName = import_react.useMemo(function() {
		var parentPrefixName = getNamePath(context.prefixName) || [];
		return [].concat(_toConsumableArray(parentPrefixName), _toConsumableArray(getNamePath(name)));
	}, [context.prefixName, name]);
	var fieldContext = import_react.useMemo(function() {
		return _objectSpread2(_objectSpread2({}, context), {}, { prefixName });
	}, [context, prefixName]);
	var listContext = import_react.useMemo(function() {
		return { getKey: function getKey(namePath) {
			var len = prefixName.length;
			var pathName = namePath[len];
			return [keyManager.keys[pathName], namePath.slice(len + 1)];
		} };
	}, [prefixName]);
	if (typeof children !== "function") {
		warningOnce(false, "Form.List only accepts function as children.");
		return null;
	}
	return /*#__PURE__*/ import_react.createElement(ListContext.Provider, { value: listContext }, /*#__PURE__*/ import_react.createElement(Context.Provider, { value: fieldContext }, /*#__PURE__*/ import_react.createElement(WrapperField, {
		name: [],
		shouldUpdate: function shouldUpdate(prevValue, nextValue, _ref2) {
			if (_ref2.source === "internal") return false;
			return prevValue !== nextValue;
		},
		rules,
		validateTrigger,
		initialValue,
		isList: true,
		isListField: isListField !== null && isListField !== void 0 ? isListField : !!wrapperListContext
	}, function(_ref3, meta) {
		var _ref3$value = _ref3.value, value = _ref3$value === void 0 ? [] : _ref3$value, onChange = _ref3.onChange;
		var getFieldValue = context.getFieldValue;
		var getNewValue = function getNewValue() {
			return getFieldValue(prefixName || []) || [];
		};
		/**
		* Always get latest value in case user update fields by `form` api.
		*/
		var operations = {
			add: function add(defaultValue, index) {
				var newValue = getNewValue();
				if (index >= 0 && index <= newValue.length) {
					keyManager.keys = [].concat(_toConsumableArray(keyManager.keys.slice(0, index)), [keyManager.id], _toConsumableArray(keyManager.keys.slice(index)));
					onChange([].concat(_toConsumableArray(newValue.slice(0, index)), [defaultValue], _toConsumableArray(newValue.slice(index))));
				} else {
					if (index < 0 || index > newValue.length) warningOnce(false, "The second parameter of the add function should be a valid positive number.");
					keyManager.keys = [].concat(_toConsumableArray(keyManager.keys), [keyManager.id]);
					onChange([].concat(_toConsumableArray(newValue), [defaultValue]));
				}
				keyManager.id += 1;
			},
			remove: function remove(index) {
				var newValue = getNewValue();
				var indexSet = new Set(Array.isArray(index) ? index : [index]);
				if (indexSet.size <= 0) return;
				keyManager.keys = keyManager.keys.filter(function(_, keysIndex) {
					return !indexSet.has(keysIndex);
				});
				onChange(newValue.filter(function(_, valueIndex) {
					return !indexSet.has(valueIndex);
				}));
			},
			move: function move$1(from, to) {
				if (from === to) return;
				var newValue = getNewValue();
				if (from < 0 || from >= newValue.length || to < 0 || to >= newValue.length) return;
				keyManager.keys = move(keyManager.keys, from, to);
				onChange(move(newValue, from, to));
			}
		};
		var listValue = value || [];
		if (!Array.isArray(listValue)) {
			listValue = [];
			warningOnce(false, "Current value of '".concat(prefixName.join(" > "), "' is not an array type."));
		}
		return children(listValue.map(function(__, index) {
			var key = keyManager.keys[index];
			if (key === void 0) {
				keyManager.keys[index] = keyManager.id;
				key = keyManager.keys[index];
				keyManager.id += 1;
			}
			return {
				name: index,
				key,
				isListField: true
			};
		}), operations, meta);
	})));
}
//#endregion
//#region node_modules/rc-field-form/es/utils/asyncUtil.js
function allPromiseFinish(promiseList) {
	var hasError = false;
	var count = promiseList.length;
	var results = [];
	if (!promiseList.length) return Promise.resolve([]);
	return new Promise(function(resolve, reject) {
		promiseList.forEach(function(promise, index) {
			promise.catch(function(e) {
				hasError = true;
				return e;
			}).then(function(result) {
				count -= 1;
				results[index] = result;
				if (count > 0) return;
				if (hasError) reject(results);
				resolve(results);
			});
		});
	});
}
//#endregion
//#region node_modules/rc-field-form/es/utils/NameMap.js
init_toConsumableArray();
init_classCallCheck();
init_createClass();
init_defineProperty();
init_typeof();
var SPLIT = "__@field_split__";
/**
* Convert name path into string to fast the fetch speed of Map.
*/
function normalize(namePath) {
	return namePath.map(function(cell) {
		return "".concat(_typeof(cell), ":").concat(cell);
	}).join(SPLIT);
}
/**
* NameMap like a `Map` but accepts `string[]` as key.
*/
var NameMap = /*#__PURE__*/ function() {
	function NameMap() {
		_classCallCheck(this, NameMap);
		_defineProperty(this, "kvs", /* @__PURE__ */ new Map());
	}
	_createClass(NameMap, [
		{
			key: "set",
			value: function set(key, value) {
				this.kvs.set(normalize(key), value);
			}
		},
		{
			key: "get",
			value: function get(key) {
				return this.kvs.get(normalize(key));
			}
		},
		{
			key: "update",
			value: function update(key, updater) {
				var next = updater(this.get(key));
				if (!next) this.delete(key);
				else this.set(key, next);
			}
		},
		{
			key: "delete",
			value: function _delete(key) {
				this.kvs.delete(normalize(key));
			}
		},
		{
			key: "map",
			value: function map(callback) {
				return _toConsumableArray(this.kvs.entries()).map(function(_ref) {
					var _ref2 = _slicedToArray(_ref, 2), key = _ref2[0], value = _ref2[1];
					return callback({
						key: key.split(SPLIT).map(function(cell) {
							var _cell$match2 = _slicedToArray(cell.match(/^([^:]*):(.*)$/), 3), type = _cell$match2[1], unit = _cell$match2[2];
							return type === "number" ? Number(unit) : unit;
						}),
						value
					});
				});
			}
		},
		{
			key: "toJSON",
			value: function toJSON() {
				var json = {};
				this.map(function(_ref3) {
					var key = _ref3.key, value = _ref3.value;
					json[key.join(".")] = value;
					return null;
				});
				return json;
			}
		}
	]);
	return NameMap;
}();
//#endregion
//#region node_modules/rc-field-form/es/useForm.js
init_slicedToArray();
init_objectWithoutProperties();
init_toConsumableArray();
init_typeof();
init_createClass();
init_classCallCheck();
init_defineProperty();
var _excluded$1 = ["name"];
var FormStore = /*#__PURE__*/ _createClass(function FormStore(forceRootUpdate) {
	var _this = this;
	_classCallCheck(this, FormStore);
	_defineProperty(this, "formHooked", false);
	_defineProperty(this, "forceRootUpdate", void 0);
	_defineProperty(this, "subscribable", true);
	_defineProperty(this, "store", {});
	_defineProperty(this, "fieldEntities", []);
	_defineProperty(this, "initialValues", {});
	_defineProperty(this, "callbacks", {});
	_defineProperty(this, "validateMessages", null);
	_defineProperty(this, "preserve", null);
	_defineProperty(this, "lastValidatePromise", null);
	_defineProperty(this, "getForm", function() {
		return {
			getFieldValue: _this.getFieldValue,
			getFieldsValue: _this.getFieldsValue,
			getFieldError: _this.getFieldError,
			getFieldWarning: _this.getFieldWarning,
			getFieldsError: _this.getFieldsError,
			isFieldsTouched: _this.isFieldsTouched,
			isFieldTouched: _this.isFieldTouched,
			isFieldValidating: _this.isFieldValidating,
			isFieldsValidating: _this.isFieldsValidating,
			resetFields: _this.resetFields,
			setFields: _this.setFields,
			setFieldValue: _this.setFieldValue,
			setFieldsValue: _this.setFieldsValue,
			validateFields: _this.validateFields,
			submit: _this.submit,
			_init: true,
			getInternalHooks: _this.getInternalHooks
		};
	});
	_defineProperty(this, "getInternalHooks", function(key) {
		if (key === "RC_FORM_INTERNAL_HOOKS") {
			_this.formHooked = true;
			return {
				dispatch: _this.dispatch,
				initEntityValue: _this.initEntityValue,
				registerField: _this.registerField,
				useSubscribe: _this.useSubscribe,
				setInitialValues: _this.setInitialValues,
				destroyForm: _this.destroyForm,
				setCallbacks: _this.setCallbacks,
				setValidateMessages: _this.setValidateMessages,
				getFields: _this.getFields,
				setPreserve: _this.setPreserve,
				getInitialValue: _this.getInitialValue,
				registerWatch: _this.registerWatch
			};
		}
		warningOnce(false, "`getInternalHooks` is internal usage. Should not call directly.");
		return null;
	});
	_defineProperty(this, "useSubscribe", function(subscribable) {
		_this.subscribable = subscribable;
	});
	/**
	* Record prev Form unmount fieldEntities which config preserve false.
	* This need to be refill with initialValues instead of store value.
	*/
	_defineProperty(this, "prevWithoutPreserves", null);
	/**
	* First time `setInitialValues` should update store with initial value
	*/
	_defineProperty(this, "setInitialValues", function(initialValues, init) {
		_this.initialValues = initialValues || {};
		if (init) {
			var _this$prevWithoutPres;
			var nextStore = merge(initialValues, _this.store);
			(_this$prevWithoutPres = _this.prevWithoutPreserves) === null || _this$prevWithoutPres === void 0 || _this$prevWithoutPres.map(function(_ref) {
				var namePath = _ref.key;
				nextStore = set(nextStore, namePath, get(initialValues, namePath));
			});
			_this.prevWithoutPreserves = null;
			_this.updateStore(nextStore);
		}
	});
	_defineProperty(this, "destroyForm", function(clearOnDestroy) {
		if (clearOnDestroy) _this.updateStore({});
		else {
			var prevWithoutPreserves = new NameMap();
			_this.getFieldEntities(true).forEach(function(entity) {
				if (!_this.isMergedPreserve(entity.isPreserve())) prevWithoutPreserves.set(entity.getNamePath(), true);
			});
			_this.prevWithoutPreserves = prevWithoutPreserves;
		}
	});
	_defineProperty(this, "getInitialValue", function(namePath) {
		var initValue = get(_this.initialValues, namePath);
		return namePath.length ? merge(initValue) : initValue;
	});
	_defineProperty(this, "setCallbacks", function(callbacks) {
		_this.callbacks = callbacks;
	});
	_defineProperty(this, "setValidateMessages", function(validateMessages) {
		_this.validateMessages = validateMessages;
	});
	_defineProperty(this, "setPreserve", function(preserve) {
		_this.preserve = preserve;
	});
	_defineProperty(this, "watchList", []);
	_defineProperty(this, "registerWatch", function(callback) {
		_this.watchList.push(callback);
		return function() {
			_this.watchList = _this.watchList.filter(function(fn) {
				return fn !== callback;
			});
		};
	});
	_defineProperty(this, "notifyWatch", function() {
		var namePath = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
		if (_this.watchList.length) {
			var values = _this.getFieldsValue();
			var allValues = _this.getFieldsValue(true);
			_this.watchList.forEach(function(callback) {
				callback(values, allValues, namePath);
			});
		}
	});
	_defineProperty(this, "timeoutId", null);
	_defineProperty(this, "warningUnhooked", function() {
		if (!_this.timeoutId && typeof window !== "undefined") _this.timeoutId = setTimeout(function() {
			_this.timeoutId = null;
			if (!_this.formHooked) warningOnce(false, "Instance created by `useForm` is not connected to any Form element. Forget to pass `form` prop?");
		});
	});
	_defineProperty(this, "updateStore", function(nextStore) {
		_this.store = nextStore;
	});
	/**
	* Get registered field entities.
	* @param pure Only return field which has a `name`. Default: false
	*/
	_defineProperty(this, "getFieldEntities", function() {
		if (!(arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false)) return _this.fieldEntities;
		return _this.fieldEntities.filter(function(field) {
			return field.getNamePath().length;
		});
	});
	_defineProperty(this, "getFieldsMap", function() {
		var pure = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
		var cache = new NameMap();
		_this.getFieldEntities(pure).forEach(function(field) {
			var namePath = field.getNamePath();
			cache.set(namePath, field);
		});
		return cache;
	});
	_defineProperty(this, "getFieldEntitiesForNamePathList", function(nameList) {
		if (!nameList) return _this.getFieldEntities(true);
		var cache = _this.getFieldsMap(true);
		return nameList.map(function(name) {
			var namePath = getNamePath(name);
			return cache.get(namePath) || { INVALIDATE_NAME_PATH: getNamePath(name) };
		});
	});
	_defineProperty(this, "getFieldsValue", function(nameList, filterFunc) {
		_this.warningUnhooked();
		var mergedNameList;
		var mergedFilterFunc;
		var mergedStrict;
		if (nameList === true || Array.isArray(nameList)) {
			mergedNameList = nameList;
			mergedFilterFunc = filterFunc;
		} else if (nameList && _typeof(nameList) === "object") {
			mergedStrict = nameList.strict;
			mergedFilterFunc = nameList.filter;
		}
		if (mergedNameList === true && !mergedFilterFunc) return _this.store;
		var fieldEntities = _this.getFieldEntitiesForNamePathList(Array.isArray(mergedNameList) ? mergedNameList : null);
		var filteredNameList = [];
		fieldEntities.forEach(function(entity) {
			var _isListField, _ref3;
			var namePath = "INVALIDATE_NAME_PATH" in entity ? entity.INVALIDATE_NAME_PATH : entity.getNamePath();
			if (mergedStrict) {
				var _isList, _ref2;
				if ((_isList = (_ref2 = entity).isList) !== null && _isList !== void 0 && _isList.call(_ref2)) return;
			} else if (!mergedNameList && (_isListField = (_ref3 = entity).isListField) !== null && _isListField !== void 0 && _isListField.call(_ref3)) return;
			if (!mergedFilterFunc) filteredNameList.push(namePath);
			else {
				var meta = "getMeta" in entity ? entity.getMeta() : null;
				if (mergedFilterFunc(meta)) filteredNameList.push(namePath);
			}
		});
		return cloneByNamePathList(_this.store, filteredNameList.map(getNamePath));
	});
	_defineProperty(this, "getFieldValue", function(name) {
		_this.warningUnhooked();
		var namePath = getNamePath(name);
		return get(_this.store, namePath);
	});
	_defineProperty(this, "getFieldsError", function(nameList) {
		_this.warningUnhooked();
		return _this.getFieldEntitiesForNamePathList(nameList).map(function(entity, index) {
			if (entity && !("INVALIDATE_NAME_PATH" in entity)) return {
				name: entity.getNamePath(),
				errors: entity.getErrors(),
				warnings: entity.getWarnings()
			};
			return {
				name: getNamePath(nameList[index]),
				errors: [],
				warnings: []
			};
		});
	});
	_defineProperty(this, "getFieldError", function(name) {
		_this.warningUnhooked();
		var namePath = getNamePath(name);
		return _this.getFieldsError([namePath])[0].errors;
	});
	_defineProperty(this, "getFieldWarning", function(name) {
		_this.warningUnhooked();
		var namePath = getNamePath(name);
		return _this.getFieldsError([namePath])[0].warnings;
	});
	_defineProperty(this, "isFieldsTouched", function() {
		_this.warningUnhooked();
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
		var arg0 = args[0], arg1 = args[1];
		var namePathList;
		var isAllFieldsTouched = false;
		if (args.length === 0) namePathList = null;
		else if (args.length === 1) if (Array.isArray(arg0)) {
			namePathList = arg0.map(getNamePath);
			isAllFieldsTouched = false;
		} else {
			namePathList = null;
			isAllFieldsTouched = arg0;
		}
		else {
			namePathList = arg0.map(getNamePath);
			isAllFieldsTouched = arg1;
		}
		var fieldEntities = _this.getFieldEntities(true);
		var isFieldTouched = function isFieldTouched(field) {
			return field.isFieldTouched();
		};
		if (!namePathList) return isAllFieldsTouched ? fieldEntities.every(function(entity) {
			return isFieldTouched(entity) || entity.isList();
		}) : fieldEntities.some(isFieldTouched);
		var map = new NameMap();
		namePathList.forEach(function(shortNamePath) {
			map.set(shortNamePath, []);
		});
		fieldEntities.forEach(function(field) {
			var fieldNamePath = field.getNamePath();
			namePathList.forEach(function(shortNamePath) {
				if (shortNamePath.every(function(nameUnit, i) {
					return fieldNamePath[i] === nameUnit;
				})) map.update(shortNamePath, function(list) {
					return [].concat(_toConsumableArray(list), [field]);
				});
			});
		});
		var isNamePathListTouched = function isNamePathListTouched(entities) {
			return entities.some(isFieldTouched);
		};
		var namePathListEntities = map.map(function(_ref4) {
			return _ref4.value;
		});
		return isAllFieldsTouched ? namePathListEntities.every(isNamePathListTouched) : namePathListEntities.some(isNamePathListTouched);
	});
	_defineProperty(this, "isFieldTouched", function(name) {
		_this.warningUnhooked();
		return _this.isFieldsTouched([name]);
	});
	_defineProperty(this, "isFieldsValidating", function(nameList) {
		_this.warningUnhooked();
		var fieldEntities = _this.getFieldEntities();
		if (!nameList) return fieldEntities.some(function(testField) {
			return testField.isFieldValidating();
		});
		var namePathList = nameList.map(getNamePath);
		return fieldEntities.some(function(testField) {
			return containsNamePath(namePathList, testField.getNamePath()) && testField.isFieldValidating();
		});
	});
	_defineProperty(this, "isFieldValidating", function(name) {
		_this.warningUnhooked();
		return _this.isFieldsValidating([name]);
	});
	/**
	* Reset Field with field `initialValue` prop.
	* Can pass `entities` or `namePathList` or just nothing.
	*/
	_defineProperty(this, "resetWithFieldInitialValue", function() {
		var info = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		var cache = new NameMap();
		var fieldEntities = _this.getFieldEntities(true);
		fieldEntities.forEach(function(field) {
			var initialValue = field.props.initialValue;
			var namePath = field.getNamePath();
			if (initialValue !== void 0) {
				var records = cache.get(namePath) || /* @__PURE__ */ new Set();
				records.add({
					entity: field,
					value: initialValue
				});
				cache.set(namePath, records);
			}
		});
		var resetWithFields = function resetWithFields(entities) {
			entities.forEach(function(field) {
				if (field.props.initialValue !== void 0) {
					var namePath = field.getNamePath();
					if (_this.getInitialValue(namePath) !== void 0) warningOnce(false, "Form already set 'initialValues' with path '".concat(namePath.join("."), "'. Field can not overwrite it."));
					else {
						var records = cache.get(namePath);
						if (records && records.size > 1) warningOnce(false, "Multiple Field with path '".concat(namePath.join("."), "' set 'initialValue'. Can not decide which one to pick."));
						else if (records) {
							var originValue = _this.getFieldValue(namePath);
							if (!field.isListField() && (!info.skipExist || originValue === void 0)) _this.updateStore(set(_this.store, namePath, _toConsumableArray(records)[0].value));
						}
					}
				}
			});
		};
		var requiredFieldEntities;
		if (info.entities) requiredFieldEntities = info.entities;
		else if (info.namePathList) {
			requiredFieldEntities = [];
			info.namePathList.forEach(function(namePath) {
				var records = cache.get(namePath);
				if (records) {
					var _requiredFieldEntitie;
					(_requiredFieldEntitie = requiredFieldEntities).push.apply(_requiredFieldEntitie, _toConsumableArray(_toConsumableArray(records).map(function(r) {
						return r.entity;
					})));
				}
			});
		} else requiredFieldEntities = fieldEntities;
		resetWithFields(requiredFieldEntities);
	});
	_defineProperty(this, "resetFields", function(nameList) {
		_this.warningUnhooked();
		var prevStore = _this.store;
		if (!nameList) {
			_this.updateStore(merge(_this.initialValues));
			_this.resetWithFieldInitialValue();
			_this.notifyObservers(prevStore, null, { type: "reset" });
			_this.notifyWatch();
			return;
		}
		var namePathList = nameList.map(getNamePath);
		namePathList.forEach(function(namePath) {
			var initialValue = _this.getInitialValue(namePath);
			_this.updateStore(set(_this.store, namePath, initialValue));
		});
		_this.resetWithFieldInitialValue({ namePathList });
		_this.notifyObservers(prevStore, namePathList, { type: "reset" });
		_this.notifyWatch(namePathList);
	});
	_defineProperty(this, "setFields", function(fields) {
		_this.warningUnhooked();
		var prevStore = _this.store;
		var namePathList = [];
		fields.forEach(function(fieldData) {
			var name = fieldData.name, data = _objectWithoutProperties(fieldData, _excluded$1);
			var namePath = getNamePath(name);
			namePathList.push(namePath);
			if ("value" in data) _this.updateStore(set(_this.store, namePath, data.value));
			_this.notifyObservers(prevStore, [namePath], {
				type: "setField",
				data: fieldData
			});
		});
		_this.notifyWatch(namePathList);
	});
	_defineProperty(this, "getFields", function() {
		return _this.getFieldEntities(true).map(function(field) {
			var namePath = field.getNamePath();
			var fieldData = _objectSpread2(_objectSpread2({}, field.getMeta()), {}, {
				name: namePath,
				value: _this.getFieldValue(namePath)
			});
			Object.defineProperty(fieldData, "originRCField", { value: true });
			return fieldData;
		});
	});
	/**
	* This only trigger when a field is on constructor to avoid we get initialValue too late
	*/
	_defineProperty(this, "initEntityValue", function(entity) {
		var initialValue = entity.props.initialValue;
		if (initialValue !== void 0) {
			var namePath = entity.getNamePath();
			if (get(_this.store, namePath) === void 0) _this.updateStore(set(_this.store, namePath, initialValue));
		}
	});
	_defineProperty(this, "isMergedPreserve", function(fieldPreserve) {
		var mergedPreserve = fieldPreserve !== void 0 ? fieldPreserve : _this.preserve;
		return mergedPreserve !== null && mergedPreserve !== void 0 ? mergedPreserve : true;
	});
	_defineProperty(this, "registerField", function(entity) {
		_this.fieldEntities.push(entity);
		var namePath = entity.getNamePath();
		_this.notifyWatch([namePath]);
		if (entity.props.initialValue !== void 0) {
			var prevStore = _this.store;
			_this.resetWithFieldInitialValue({
				entities: [entity],
				skipExist: true
			});
			_this.notifyObservers(prevStore, [entity.getNamePath()], {
				type: "valueUpdate",
				source: "internal"
			});
		}
		return function(isListField, preserve) {
			var subNamePath = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [];
			_this.fieldEntities = _this.fieldEntities.filter(function(item) {
				return item !== entity;
			});
			if (!_this.isMergedPreserve(preserve) && (!isListField || subNamePath.length > 1)) {
				var defaultValue = isListField ? void 0 : _this.getInitialValue(namePath);
				if (namePath.length && _this.getFieldValue(namePath) !== defaultValue && _this.fieldEntities.every(function(field) {
					return !matchNamePath(field.getNamePath(), namePath);
				})) {
					var _prevStore = _this.store;
					_this.updateStore(set(_prevStore, namePath, defaultValue, true));
					_this.notifyObservers(_prevStore, [namePath], { type: "remove" });
					_this.triggerDependenciesUpdate(_prevStore, namePath);
				}
			}
			_this.notifyWatch([namePath]);
		};
	});
	_defineProperty(this, "dispatch", function(action) {
		switch (action.type) {
			case "updateValue":
				var namePath = action.namePath, value = action.value;
				_this.updateValue(namePath, value);
				break;
			case "validateField":
				var _namePath = action.namePath, triggerName = action.triggerName;
				_this.validateFields([_namePath], { triggerName });
				break;
			default:
		}
	});
	_defineProperty(this, "notifyObservers", function(prevStore, namePathList, info) {
		if (_this.subscribable) {
			var mergedInfo = _objectSpread2(_objectSpread2({}, info), {}, { store: _this.getFieldsValue(true) });
			_this.getFieldEntities().forEach(function(_ref5) {
				var onStoreChange = _ref5.onStoreChange;
				onStoreChange(prevStore, namePathList, mergedInfo);
			});
		} else _this.forceRootUpdate();
	});
	/**
	* Notify dependencies children with parent update
	* We need delay to trigger validate in case Field is under render props
	*/
	_defineProperty(this, "triggerDependenciesUpdate", function(prevStore, namePath) {
		var childrenFields = _this.getDependencyChildrenFields(namePath);
		if (childrenFields.length) _this.validateFields(childrenFields);
		_this.notifyObservers(prevStore, childrenFields, {
			type: "dependenciesUpdate",
			relatedFields: [namePath].concat(_toConsumableArray(childrenFields))
		});
		return childrenFields;
	});
	_defineProperty(this, "updateValue", function(name, value) {
		var namePath = getNamePath(name);
		var prevStore = _this.store;
		_this.updateStore(set(_this.store, namePath, value));
		_this.notifyObservers(prevStore, [namePath], {
			type: "valueUpdate",
			source: "internal"
		});
		_this.notifyWatch([namePath]);
		var childrenFields = _this.triggerDependenciesUpdate(prevStore, namePath);
		var onValuesChange = _this.callbacks.onValuesChange;
		if (onValuesChange) onValuesChange(cloneByNamePathList(_this.store, [namePath]), _this.getFieldsValue());
		_this.triggerOnFieldsChange([namePath].concat(_toConsumableArray(childrenFields)));
	});
	_defineProperty(this, "setFieldsValue", function(store) {
		_this.warningUnhooked();
		var prevStore = _this.store;
		if (store) {
			var nextStore = merge(_this.store, store);
			_this.updateStore(nextStore);
		}
		_this.notifyObservers(prevStore, null, {
			type: "valueUpdate",
			source: "external"
		});
		_this.notifyWatch();
	});
	_defineProperty(this, "setFieldValue", function(name, value) {
		_this.setFields([{
			name,
			value,
			errors: [],
			warnings: []
		}]);
	});
	_defineProperty(this, "getDependencyChildrenFields", function(rootNamePath) {
		var children = /* @__PURE__ */ new Set();
		var childrenFields = [];
		var dependencies2fields = new NameMap();
		/**
		* Generate maps
		* Can use cache to save perf if user report performance issue with this
		*/
		_this.getFieldEntities().forEach(function(field) {
			(field.props.dependencies || []).forEach(function(dependency) {
				var dependencyNamePath = getNamePath(dependency);
				dependencies2fields.update(dependencyNamePath, function() {
					var fields = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : /* @__PURE__ */ new Set();
					fields.add(field);
					return fields;
				});
			});
		});
		(function fillChildren(namePath) {
			(dependencies2fields.get(namePath) || /* @__PURE__ */ new Set()).forEach(function(field) {
				if (!children.has(field)) {
					children.add(field);
					var fieldNamePath = field.getNamePath();
					if (field.isFieldDirty() && fieldNamePath.length) {
						childrenFields.push(fieldNamePath);
						fillChildren(fieldNamePath);
					}
				}
			});
		})(rootNamePath);
		return childrenFields;
	});
	_defineProperty(this, "triggerOnFieldsChange", function(namePathList, filedErrors) {
		var onFieldsChange = _this.callbacks.onFieldsChange;
		if (onFieldsChange) {
			var fields = _this.getFields();
			/**
			* Fill errors since `fields` may be replaced by controlled fields
			*/
			if (filedErrors) {
				var cache = new NameMap();
				filedErrors.forEach(function(_ref6) {
					var name = _ref6.name, errors = _ref6.errors;
					cache.set(name, errors);
				});
				fields.forEach(function(field) {
					field.errors = cache.get(field.name) || field.errors;
				});
			}
			var changedFields = fields.filter(function(_ref7) {
				var fieldName = _ref7.name;
				return containsNamePath(namePathList, fieldName);
			});
			if (changedFields.length) onFieldsChange(changedFields, fields);
		}
	});
	_defineProperty(this, "validateFields", function(arg1, arg2) {
		_this.warningUnhooked();
		var nameList;
		var options;
		if (Array.isArray(arg1) || typeof arg1 === "string" || typeof arg2 === "string") {
			nameList = arg1;
			options = arg2;
		} else options = arg1;
		var provideNameList = !!nameList;
		var namePathList = provideNameList ? nameList.map(getNamePath) : [];
		var promiseList = [];
		var TMP_SPLIT = String(Date.now());
		var validateNamePathList = /* @__PURE__ */ new Set();
		var _ref8 = options || {}, recursive = _ref8.recursive, dirty = _ref8.dirty;
		_this.getFieldEntities(true).forEach(function(field) {
			if (!provideNameList) namePathList.push(field.getNamePath());
			if (!field.props.rules || !field.props.rules.length) return;
			if (dirty && !field.isFieldDirty()) return;
			var fieldNamePath = field.getNamePath();
			validateNamePathList.add(fieldNamePath.join(TMP_SPLIT));
			if (!provideNameList || containsNamePath(namePathList, fieldNamePath, recursive)) {
				var promise = field.validateRules(_objectSpread2({ validateMessages: _objectSpread2(_objectSpread2({}, defaultValidateMessages), _this.validateMessages) }, options));
				promiseList.push(promise.then(function() {
					return {
						name: fieldNamePath,
						errors: [],
						warnings: []
					};
				}).catch(function(ruleErrors) {
					var _ruleErrors$forEach;
					var mergedErrors = [];
					var mergedWarnings = [];
					(_ruleErrors$forEach = ruleErrors.forEach) === null || _ruleErrors$forEach === void 0 || _ruleErrors$forEach.call(ruleErrors, function(_ref9) {
						var warningOnly = _ref9.rule.warningOnly, errors = _ref9.errors;
						if (warningOnly) mergedWarnings.push.apply(mergedWarnings, _toConsumableArray(errors));
						else mergedErrors.push.apply(mergedErrors, _toConsumableArray(errors));
					});
					if (mergedErrors.length) return Promise.reject({
						name: fieldNamePath,
						errors: mergedErrors,
						warnings: mergedWarnings
					});
					return {
						name: fieldNamePath,
						errors: mergedErrors,
						warnings: mergedWarnings
					};
				}));
			}
		});
		var summaryPromise = allPromiseFinish(promiseList);
		_this.lastValidatePromise = summaryPromise;
		summaryPromise.catch(function(results) {
			return results;
		}).then(function(results) {
			var resultNamePathList = results.map(function(_ref10) {
				return _ref10.name;
			});
			_this.notifyObservers(_this.store, resultNamePathList, { type: "validateFinish" });
			_this.triggerOnFieldsChange(resultNamePathList, results);
		});
		var returnPromise = summaryPromise.then(function() {
			if (_this.lastValidatePromise === summaryPromise) return Promise.resolve(_this.getFieldsValue(namePathList));
			return Promise.reject([]);
		}).catch(function(results) {
			var errorList = results.filter(function(result) {
				return result && result.errors.length;
			});
			return Promise.reject({
				values: _this.getFieldsValue(namePathList),
				errorFields: errorList,
				outOfDate: _this.lastValidatePromise !== summaryPromise
			});
		});
		returnPromise.catch(function(e) {
			return e;
		});
		var triggerNamePathList = namePathList.filter(function(namePath) {
			return validateNamePathList.has(namePath.join(TMP_SPLIT));
		});
		_this.triggerOnFieldsChange(triggerNamePathList);
		return returnPromise;
	});
	_defineProperty(this, "submit", function() {
		_this.warningUnhooked();
		_this.validateFields().then(function(values) {
			var onFinish = _this.callbacks.onFinish;
			if (onFinish) try {
				onFinish(values);
			} catch (err) {
				console.error(err);
			}
		}).catch(function(e) {
			var onFinishFailed = _this.callbacks.onFinishFailed;
			if (onFinishFailed) onFinishFailed(e);
		});
	});
	this.forceRootUpdate = forceRootUpdate;
});
function useForm(form) {
	var formRef = import_react.useRef();
	var forceUpdate = _slicedToArray(import_react.useState({}), 2)[1];
	if (!formRef.current) if (form) formRef.current = form;
	else formRef.current = new FormStore(function forceReRender() {
		forceUpdate({});
	}).getForm();
	return [formRef.current];
}
//#endregion
//#region node_modules/rc-field-form/es/FormContext.js
init_defineProperty();
var FormContext = /*#__PURE__*/ import_react.createContext({
	triggerFormChange: function triggerFormChange() {},
	triggerFormFinish: function triggerFormFinish() {},
	registerForm: function registerForm() {},
	unregisterForm: function unregisterForm() {}
});
var FormProvider = function FormProvider(_ref) {
	var validateMessages = _ref.validateMessages, onFormChange = _ref.onFormChange, onFormFinish = _ref.onFormFinish, children = _ref.children;
	var formContext = import_react.useContext(FormContext);
	var formsRef = import_react.useRef({});
	return /*#__PURE__*/ import_react.createElement(FormContext.Provider, { value: _objectSpread2(_objectSpread2({}, formContext), {}, {
		validateMessages: _objectSpread2(_objectSpread2({}, formContext.validateMessages), validateMessages),
		triggerFormChange: function triggerFormChange(name, changedFields) {
			if (onFormChange) onFormChange(name, {
				changedFields,
				forms: formsRef.current
			});
			formContext.triggerFormChange(name, changedFields);
		},
		triggerFormFinish: function triggerFormFinish(name, values) {
			if (onFormFinish) onFormFinish(name, {
				values,
				forms: formsRef.current
			});
			formContext.triggerFormFinish(name, values);
		},
		registerForm: function registerForm(name, form) {
			if (name) formsRef.current = _objectSpread2(_objectSpread2({}, formsRef.current), {}, _defineProperty({}, name, form));
			formContext.registerForm(name, form);
		},
		unregisterForm: function unregisterForm(name) {
			var newForms = _objectSpread2({}, formsRef.current);
			delete newForms[name];
			formsRef.current = newForms;
			formContext.unregisterForm(name);
		}
	}) }, children);
};
//#endregion
//#region node_modules/rc-field-form/es/Form.js
init_extends();
init_slicedToArray();
init_objectWithoutProperties();
var _excluded = [
	"name",
	"initialValues",
	"fields",
	"form",
	"preserve",
	"children",
	"component",
	"validateMessages",
	"validateTrigger",
	"onValuesChange",
	"onFieldsChange",
	"onFinish",
	"onFinishFailed",
	"clearOnDestroy"
];
var Form = function Form(_ref, ref) {
	var name = _ref.name, initialValues = _ref.initialValues, fields = _ref.fields, form = _ref.form, preserve = _ref.preserve, children = _ref.children, _ref$component = _ref.component, Component = _ref$component === void 0 ? "form" : _ref$component, validateMessages = _ref.validateMessages, _ref$validateTrigger = _ref.validateTrigger, validateTrigger = _ref$validateTrigger === void 0 ? "onChange" : _ref$validateTrigger, onValuesChange = _ref.onValuesChange, _onFieldsChange = _ref.onFieldsChange, _onFinish = _ref.onFinish, onFinishFailed = _ref.onFinishFailed, clearOnDestroy = _ref.clearOnDestroy, restProps = _objectWithoutProperties(_ref, _excluded);
	var nativeElementRef = import_react.useRef(null);
	var formContext = import_react.useContext(FormContext);
	var formInstance = _slicedToArray(useForm(form), 1)[0];
	var _getInternalHooks = formInstance.getInternalHooks(HOOK_MARK), useSubscribe = _getInternalHooks.useSubscribe, setInitialValues = _getInternalHooks.setInitialValues, setCallbacks = _getInternalHooks.setCallbacks, setValidateMessages = _getInternalHooks.setValidateMessages, setPreserve = _getInternalHooks.setPreserve, destroyForm = _getInternalHooks.destroyForm;
	import_react.useImperativeHandle(ref, function() {
		return _objectSpread2(_objectSpread2({}, formInstance), {}, { nativeElement: nativeElementRef.current });
	});
	import_react.useEffect(function() {
		formContext.registerForm(name, formInstance);
		return function() {
			formContext.unregisterForm(name);
		};
	}, [
		formContext,
		formInstance,
		name
	]);
	setValidateMessages(_objectSpread2(_objectSpread2({}, formContext.validateMessages), validateMessages));
	setCallbacks({
		onValuesChange,
		onFieldsChange: function onFieldsChange(changedFields) {
			formContext.triggerFormChange(name, changedFields);
			if (_onFieldsChange) {
				for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) rest[_key - 1] = arguments[_key];
				_onFieldsChange.apply(void 0, [changedFields].concat(rest));
			}
		},
		onFinish: function onFinish(values) {
			formContext.triggerFormFinish(name, values);
			if (_onFinish) _onFinish(values);
		},
		onFinishFailed
	});
	setPreserve(preserve);
	var mountRef = import_react.useRef(null);
	setInitialValues(initialValues, !mountRef.current);
	if (!mountRef.current) mountRef.current = true;
	import_react.useEffect(function() {
		return function() {
			return destroyForm(clearOnDestroy);
		};
	}, []);
	var childrenNode;
	var childrenRenderProps = typeof children === "function";
	if (childrenRenderProps) childrenNode = children(formInstance.getFieldsValue(true), formInstance);
	else childrenNode = children;
	useSubscribe(!childrenRenderProps);
	var prevFieldsRef = import_react.useRef();
	import_react.useEffect(function() {
		if (!isSimilar(prevFieldsRef.current || [], fields || [])) formInstance.setFields(fields || []);
		prevFieldsRef.current = fields;
	}, [fields, formInstance]);
	var formContextValue = import_react.useMemo(function() {
		return _objectSpread2(_objectSpread2({}, formInstance), {}, { validateTrigger });
	}, [formInstance, validateTrigger]);
	var wrapperNode = /*#__PURE__*/ import_react.createElement(ListContext.Provider, { value: null }, /*#__PURE__*/ import_react.createElement(Context.Provider, { value: formContextValue }, childrenNode));
	if (Component === false) return wrapperNode;
	return /*#__PURE__*/ import_react.createElement(Component, _extends({}, restProps, {
		ref: nativeElementRef,
		onSubmit: function onSubmit(event) {
			event.preventDefault();
			event.stopPropagation();
			formInstance.submit();
		},
		onReset: function onReset(event) {
			var _restProps$onReset;
			event.preventDefault();
			formInstance.resetFields();
			(_restProps$onReset = restProps.onReset) === null || _restProps$onReset === void 0 || _restProps$onReset.call(restProps, event);
		}
	}), wrapperNode);
};
//#endregion
//#region node_modules/rc-field-form/es/useWatch.js
init_slicedToArray();
function stringify(value) {
	try {
		return JSON.stringify(value);
	} catch (err) {
		return Math.random();
	}
}
var useWatchWarning = function(namePath) {
	var fullyStr = namePath.join("__RC_FIELD_FORM_SPLIT__");
	warningOnce((0, import_react.useRef)(fullyStr).current === fullyStr, "`useWatch` is not support dynamic `namePath`. Please provide static instead.");
};
function useWatch() {
	for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
	var dependencies = args[0], _args$ = args[1], _form = _args$ === void 0 ? {} : _args$;
	var options = isFormInstance(_form) ? { form: _form } : _form;
	var form = options.form;
	var _useState2 = _slicedToArray((0, import_react.useState)(), 2), value = _useState2[0], setValue = _useState2[1];
	var valueStr = (0, import_react.useMemo)(function() {
		return stringify(value);
	}, [value]);
	var valueStrRef = (0, import_react.useRef)(valueStr);
	valueStrRef.current = valueStr;
	var fieldContext = (0, import_react.useContext)(Context);
	var formInstance = form || fieldContext;
	var isValidForm = formInstance && formInstance._init;
	warningOnce(args.length === 2 ? form ? isValidForm : true : isValidForm, "useWatch requires a form instance since it can not auto detect from context.");
	var namePath = getNamePath(dependencies);
	var namePathRef = (0, import_react.useRef)(namePath);
	namePathRef.current = namePath;
	useWatchWarning(namePath);
	(0, import_react.useEffect)(function() {
		if (!isValidForm) return;
		var getFieldsValue = formInstance.getFieldsValue, getInternalHooks = formInstance.getInternalHooks;
		var registerWatch = getInternalHooks(HOOK_MARK).registerWatch;
		var getWatchValue = function getWatchValue(values, allValues) {
			var watchValue = options.preserve ? allValues : values;
			return typeof dependencies === "function" ? dependencies(watchValue) : get(watchValue, namePathRef.current);
		};
		var cancelRegister = registerWatch(function(values, allValues) {
			var newValue = getWatchValue(values, allValues);
			var nextValueStr = stringify(newValue);
			if (valueStrRef.current !== nextValueStr) {
				valueStrRef.current = nextValueStr;
				setValue(newValue);
			}
		});
		var initialValue = getWatchValue(getFieldsValue(), getFieldsValue(true));
		if (value !== initialValue) setValue(initialValue);
		return cancelRegister;
	}, [isValidForm]);
	return value;
}
//#endregion
//#region node_modules/rc-field-form/es/index.js
var RefForm = /* @__PURE__ */ import_react.forwardRef(Form);
RefForm.FormProvider = FormProvider;
RefForm.Field = WrapperField;
RefForm.List = List;
RefForm.useForm = useForm;
RefForm.useWatch = useWatch;
//#endregion
//#region node_modules/antd/es/form/context.js
var FormItemInputContext = /*#__PURE__*/ import_react.createContext({});
FormItemInputContext.displayName = "FormItemInputContext";
var NoFormStyle = ({ children, status, override }) => {
	const formItemInputContext = import_react.useContext(FormItemInputContext);
	const newFormItemInputContext = import_react.useMemo(() => {
		const newContext = Object.assign({}, formItemInputContext);
		if (override) delete newContext.isFormItemInput;
		if (status) {
			delete newContext.status;
			delete newContext.hasFeedback;
			delete newContext.feedbackIcon;
		}
		return newContext;
	}, [
		status,
		override,
		formItemInputContext
	]);
	return /*#__PURE__*/ import_react.createElement(FormItemInputContext.Provider, { value: newFormItemInputContext }, children);
};
var VariantContext = /*#__PURE__*/ import_react.createContext(void 0);
//#endregion
export { _asyncToGenerator as a, omit as i, NoFormStyle as n, _regeneratorRuntime as o, VariantContext as r, toArray$1 as s, FormItemInputContext as t };
