import { d as __toESM, i as require_react, n as require_jsx_runtime, o as __commonJSMin, t as toast_default } from "./toast-C8a1ReSo.js";
import { a as getDeviceOrientation, s as isOpenVtkeyboadrd } from "./utils-Cdx9DbDR.js";
import { l as _extends, r as connect, u as init_extends } from "./es-CFYDnMm2.js";
import { Qn as setCRMAuthCodeVerifiedPhone, Zn as setCRMAuthCodeVerified } from "./actions-BwRPwnFF.js";
import { P as verifyAuthCode, u as getAuthCode } from "./kioskConfigApi-68IKDHob.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { t as Icon } from "./AntdIcon-bxYy9EiO.js";
import { n as Policy, t as jingleBell_default } from "./jingleBell-vXwHPSmZ.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { t as maskPhoneNumber } from "./maskPhoneNumber-Cwwie3jl.js";
import { o as useCloseModalOnHomePage } from "./hooks-DiifsOH5.js";
import { t as ComboHeader_default } from "./ComboHeader-DCNVP6mw.js";
import { t as numPad_default } from "./numPad-f96Tw6Sn.js";
//#region node_modules/@ant-design/icons-svg/es/asn/EyeOutlined.js
var import_react = /* @__PURE__ */ __toESM(require_react());
init_extends();
var EyeOutlined = {
	"icon": {
		"tag": "svg",
		"attrs": {
			"viewBox": "64 64 896 896",
			"focusable": "false"
		},
		"children": [{
			"tag": "path",
			"attrs": { "d": "M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 000 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z" }
		}]
	},
	"name": "eye",
	"theme": "outlined"
};
//#endregion
//#region node_modules/@ant-design/icons/es/icons/EyeOutlined.js
/**![eye](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjYWNhY2EiIHZpZXdCb3g9IjY0IDY0IDg5NiA4OTYiIGZvY3VzYWJsZT0iZmFsc2UiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTk0Mi4yIDQ4Ni4yQzg0Ny40IDI4Ni41IDcwNC4xIDE4NiA1MTIgMTg2Yy0xOTIuMiAwLTMzNS40IDEwMC41LTQzMC4yIDMwMC4zYTYwLjMgNjAuMyAwIDAwMCA1MS41QzE3Ni42IDczNy41IDMxOS45IDgzOCA1MTIgODM4YzE5Mi4yIDAgMzM1LjQtMTAwLjUgNDMwLjItMzAwLjMgNy43LTE2LjIgNy43LTM1IDAtNTEuNXpNNTEyIDc2NmMtMTYxLjMgMC0yNzkuNC04MS44LTM2Mi43LTI1NEMyMzIuNiAzMzkuOCAzNTAuNyAyNTggNTEyIDI1OGMxNjEuMyAwIDI3OS40IDgxLjggMzYyLjcgMjU0Qzc5MS41IDY4NC4yIDY3My40IDc2NiA1MTIgNzY2em0tNC00MzBjLTk3LjIgMC0xNzYgNzguOC0xNzYgMTc2czc4LjggMTc2IDE3NiAxNzYgMTc2LTc4LjggMTc2LTE3Ni03OC44LTE3Ni0xNzYtMTc2em0wIDI4OGMtNjEuOSAwLTExMi01MC4xLTExMi0xMTJzNTAuMS0xMTIgMTEyLTExMiAxMTIgNTAuMSAxMTIgMTEyLTUwLjEgMTEyLTExMiAxMTJ6IiAvPjwvc3ZnPg==) */
var RefIcon$1 = /*#__PURE__*/ import_react.forwardRef(function EyeOutlined$1(props, ref) {
	return /*#__PURE__*/ import_react.createElement(Icon, _extends({}, props, {
		ref,
		icon: EyeOutlined
	}));
});
RefIcon$1.displayName = "EyeOutlined";
//#endregion
//#region node_modules/@ant-design/icons-svg/es/asn/EyeInvisibleOutlined.js
var EyeInvisibleOutlined = {
	"icon": {
		"tag": "svg",
		"attrs": {
			"viewBox": "64 64 896 896",
			"focusable": "false"
		},
		"children": [{
			"tag": "path",
			"attrs": { "d": "M942.2 486.2Q889.47 375.11 816.7 305l-50.88 50.88C807.31 395.53 843.45 447.4 874.7 512 791.5 684.2 673.4 766 512 766q-72.67 0-133.87-22.38L323 798.75Q408 838 512 838q288.3 0 430.2-300.3a60.29 60.29 0 000-51.5zm-63.57-320.64L836 122.88a8 8 0 00-11.32 0L715.31 232.2Q624.86 186 512 186q-288.3 0-430.2 300.3a60.3 60.3 0 000 51.5q56.69 119.4 136.5 191.41L112.48 835a8 8 0 000 11.31L155.17 889a8 8 0 0011.31 0l712.15-712.12a8 8 0 000-11.32zM149.3 512C232.6 339.8 350.7 258 512 258c54.54 0 104.13 9.36 149.12 28.39l-70.3 70.3a176 176 0 00-238.13 238.13l-83.42 83.42C223.1 637.49 183.3 582.28 149.3 512zm246.7 0a112.11 112.11 0 01146.2-106.69L401.31 546.2A112 112 0 01396 512z" }
		}, {
			"tag": "path",
			"attrs": { "d": "M508 624c-3.46 0-6.87-.16-10.25-.47l-52.82 52.82a176.09 176.09 0 00227.42-227.42l-52.82 52.82c.31 3.38.47 6.79.47 10.25a111.94 111.94 0 01-112 112z" }
		}]
	},
	"name": "eye-invisible",
	"theme": "outlined"
};
//#endregion
//#region node_modules/@ant-design/icons/es/icons/EyeInvisibleOutlined.js
init_extends();
/**![eye-invisible](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjYWNhY2EiIHZpZXdCb3g9IjY0IDY0IDg5NiA4OTYiIGZvY3VzYWJsZT0iZmFsc2UiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTk0Mi4yIDQ4Ni4yUTg4OS40NyAzNzUuMTEgODE2LjcgMzA1bC01MC44OCA1MC44OEM4MDcuMzEgMzk1LjUzIDg0My40NSA0NDcuNCA4NzQuNyA1MTIgNzkxLjUgNjg0LjIgNjczLjQgNzY2IDUxMiA3NjZxLTcyLjY3IDAtMTMzLjg3LTIyLjM4TDMyMyA3OTguNzVRNDA4IDgzOCA1MTIgODM4cTI4OC4zIDAgNDMwLjItMzAwLjNhNjAuMjkgNjAuMjkgMCAwMDAtNTEuNXptLTYzLjU3LTMyMC42NEw4MzYgMTIyLjg4YTggOCAwIDAwLTExLjMyIDBMNzE1LjMxIDIzMi4yUTYyNC44NiAxODYgNTEyIDE4NnEtMjg4LjMgMC00MzAuMiAzMDAuM2E2MC4zIDYwLjMgMCAwMDAgNTEuNXE1Ni42OSAxMTkuNCAxMzYuNSAxOTEuNDFMMTEyLjQ4IDgzNWE4IDggMCAwMDAgMTEuMzFMMTU1LjE3IDg4OWE4IDggMCAwMDExLjMxIDBsNzEyLjE1LTcxMi4xMmE4IDggMCAwMDAtMTEuMzJ6TTE0OS4zIDUxMkMyMzIuNiAzMzkuOCAzNTAuNyAyNTggNTEyIDI1OGM1NC41NCAwIDEwNC4xMyA5LjM2IDE0OS4xMiAyOC4zOWwtNzAuMyA3MC4zYTE3NiAxNzYgMCAwMC0yMzguMTMgMjM4LjEzbC04My40MiA4My40MkMyMjMuMSA2MzcuNDkgMTgzLjMgNTgyLjI4IDE0OS4zIDUxMnptMjQ2LjcgMGExMTIuMTEgMTEyLjExIDAgMDExNDYuMi0xMDYuNjlMNDAxLjMxIDU0Ni4yQTExMiAxMTIgMCAwMTM5NiA1MTJ6IiAvPjxwYXRoIGQ9Ik01MDggNjI0Yy0zLjQ2IDAtNi44Ny0uMTYtMTAuMjUtLjQ3bC01Mi44MiA1Mi44MmExNzYuMDkgMTc2LjA5IDAgMDAyMjcuNDItMjI3LjQybC01Mi44MiA1Mi44MmMuMzEgMy4zOC40NyA2Ljc5LjQ3IDEwLjI1YTExMS45NCAxMTEuOTQgMCAwMS0xMTIgMTEyeiIgLz48L3N2Zz4=) */
var RefIcon = /*#__PURE__*/ import_react.forwardRef(function EyeInvisibleOutlined$1(props, ref) {
	return /*#__PURE__*/ import_react.createElement(Icon, _extends({}, props, {
		ref,
		icon: EyeInvisibleOutlined
	}));
});
RefIcon.displayName = "EyeInvisibleOutlined";
var LoginModal_module_default = {
	loginWrapper: "loginWrapper___3nmXz",
	loginModal: "loginModal___rW-C5",
	never: "never___a10Py",
	confirmBtn: "confirmBtn___bbIGb",
	disableConfirm: "disableConfirm___mpzlL",
	authCodeWrapper: "authCodeWrapper___EbWhz",
	authCodeBox: "authCodeBox___ytanG",
	numPadSpacing: "numPadSpacing___XWiqK",
	authCode: "authCode___22RTC",
	jingleBell: "jingleBell___yJn7S",
	sendTo: "sendTo___jUTBN",
	sendToPhone: "sendToPhone___TEhid",
	authCodeInputBox: "authCodeInputBox___rcQZF",
	displayAuthCode: "displayAuthCode___8vo5b",
	displayAuthCodeText: "displayAuthCodeText___tZYRv"
};
//#endregion
//#region node_modules/react18-input-otp/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports["default"] = void 0;
	var _react = _interopRequireWildcard(require_react());
	var _excluded = [
		"placeholder",
		"separator",
		"isLastChild",
		"ariaLabelOverride",
		"shouldRender",
		"inputStyle",
		"focus",
		"isDisabled",
		"hasErrored",
		"errorStyle",
		"isSuccessed",
		"successStyle",
		"focusStyle",
		"disabledStyle",
		"shouldAutoFocus",
		"isInputNum",
		"index",
		"value",
		"className",
		"isInputSecure",
		"onSubmit"
	];
	function _getRequireWildcardCache(nodeInterop) {
		if (typeof WeakMap !== "function") return null;
		var cacheBabelInterop = /* @__PURE__ */ new WeakMap();
		var cacheNodeInterop = /* @__PURE__ */ new WeakMap();
		return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) {
			return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
		})(nodeInterop);
	}
	function _interopRequireWildcard(obj, nodeInterop) {
		if (!nodeInterop && obj && obj.__esModule) return obj;
		if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") return { "default": obj };
		var cache = _getRequireWildcardCache(nodeInterop);
		if (cache && cache.has(obj)) return cache.get(obj);
		var newObj = {};
		var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
		for (var key in obj) if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
			var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
			if (desc && (desc.get || desc.set)) Object.defineProperty(newObj, key, desc);
			else newObj[key] = obj[key];
		}
		newObj["default"] = obj;
		if (cache) cache.set(obj, newObj);
		return newObj;
	}
	function _extends() {
		_extends = Object.assign ? Object.assign.bind() : function(target) {
			for (var i = 1; i < arguments.length; i++) {
				var source = arguments[i];
				for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
			}
			return target;
		};
		return _extends.apply(this, arguments);
	}
	function _objectWithoutProperties(source, excluded) {
		if (source == null) return {};
		var target = _objectWithoutPropertiesLoose(source, excluded);
		var key, i;
		if (Object.getOwnPropertySymbols) {
			var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
			for (i = 0; i < sourceSymbolKeys.length; i++) {
				key = sourceSymbolKeys[i];
				if (excluded.indexOf(key) >= 0) continue;
				if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
				target[key] = source[key];
			}
		}
		return target;
	}
	function _objectWithoutPropertiesLoose(source, excluded) {
		if (source == null) return {};
		var target = {};
		var sourceKeys = Object.keys(source);
		var key, i;
		for (i = 0; i < sourceKeys.length; i++) {
			key = sourceKeys[i];
			if (excluded.indexOf(key) >= 0) continue;
			target[key] = source[key];
		}
		return target;
	}
	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
	}
	function _defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ("value" in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}
	function _createClass(Constructor, protoProps, staticProps) {
		if (protoProps) _defineProperties(Constructor.prototype, protoProps);
		if (staticProps) _defineProperties(Constructor, staticProps);
		Object.defineProperty(Constructor, "prototype", { writable: false });
		return Constructor;
	}
	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) throw new TypeError("Super expression must either be null or a function");
		subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: {
			value: subClass,
			writable: true,
			configurable: true
		} });
		Object.defineProperty(subClass, "prototype", { writable: false });
		if (superClass) _setPrototypeOf(subClass, superClass);
	}
	function _setPrototypeOf(o, p) {
		_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
			o.__proto__ = p;
			return o;
		};
		return _setPrototypeOf(o, p);
	}
	function _createSuper(Derived) {
		var hasNativeReflectConstruct = _isNativeReflectConstruct();
		return function _createSuperInternal() {
			var Super = _getPrototypeOf(Derived), result;
			if (hasNativeReflectConstruct) {
				var NewTarget = _getPrototypeOf(this).constructor;
				result = Reflect.construct(Super, arguments, NewTarget);
			} else result = Super.apply(this, arguments);
			return _possibleConstructorReturn(this, result);
		};
	}
	function _possibleConstructorReturn(self, call) {
		if (call && (_typeof(call) === "object" || typeof call === "function")) return call;
		else if (call !== void 0) throw new TypeError("Derived constructors may only return object or undefined");
		return _assertThisInitialized(self);
	}
	function _assertThisInitialized(self) {
		if (self === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		return self;
	}
	function _isNativeReflectConstruct() {
		if (typeof Reflect === "undefined" || !Reflect.construct) return false;
		if (Reflect.construct.sham) return false;
		if (typeof Proxy === "function") return true;
		try {
			Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
			return true;
		} catch (e) {
			return false;
		}
	}
	function _getPrototypeOf(o) {
		_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
			return o.__proto__ || Object.getPrototypeOf(o);
		};
		return _getPrototypeOf(o);
	}
	function _defineProperty(obj, key, value) {
		if (key in obj) Object.defineProperty(obj, key, {
			value,
			enumerable: true,
			configurable: true,
			writable: true
		});
		else obj[key] = value;
		return obj;
	}
	function _typeof(obj) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
			return typeof obj;
		} : function(obj) {
			return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
		}, _typeof(obj);
	}
	var BACKSPACE = 8;
	var LEFT_ARROW = 37;
	var RIGHT_ARROW = 39;
	var DELETE = 46;
	var SPACEBAR = 32;
	var ENTER = 13;
	var isStyleObject = function isStyleObject(obj) {
		return _typeof(obj) === "object";
	};
	var SingleOtpInput = function(_PureComponent) {
		_inherits(SingleOtpInput, _PureComponent);
		var _super = _createSuper(SingleOtpInput);
		function SingleOtpInput(props) {
			var _this;
			_classCallCheck(this, SingleOtpInput);
			_this = _super.call(this, props);
			_defineProperty(_assertThisInitialized(_this), "getClasses", function() {
				for (var _len = arguments.length, classes = new Array(_len), _key = 0; _key < _len; _key++) classes[_key] = arguments[_key];
				return classes.filter(function(c) {
					return !isStyleObject(c) && c !== false;
				}).join(" ");
			});
			_defineProperty(_assertThisInitialized(_this), "getType", function() {
				var _this$props = _this.props, isInputSecure = _this$props.isInputSecure, isInputNum = _this$props.isInputNum;
				if (isInputSecure) return "password";
				if (isInputNum) return "tel";
				return "text";
			});
			_defineProperty(_assertThisInitialized(_this), "getAriaLabel", function(index, isInputNum) {
				var ariaLabelOverride = _this.props.ariaLabelOverride;
				if (ariaLabelOverride) return ariaLabelOverride;
				return "".concat(index === 0 ? "Please enter verification code. " : "").concat(isInputNum ? "Digit" : "Character", " ").concat(index + 1);
			});
			_this.input = _react["default"].createRef();
			return _this;
		}
		_createClass(SingleOtpInput, [
			{
				key: "componentDidMount",
				value: function componentDidMount() {
					var _this$props2 = this.props, focus = _this$props2.focus, shouldAutoFocus = _this$props2.shouldAutoFocus;
					var inputEl = this.input.current;
					if (inputEl && focus && shouldAutoFocus) inputEl.focus();
				}
			},
			{
				key: "componentDidUpdate",
				value: function componentDidUpdate(prevProps) {
					var focus = this.props.focus;
					var inputEl = this.input.current;
					if (prevProps.focus !== focus && inputEl && focus) {
						inputEl.focus();
						inputEl.select();
					}
				}
			},
			{
				key: "render",
				value: function render() {
					var _this$props3 = this.props, placeholder = _this$props3.placeholder, separator = _this$props3.separator, isLastChild = _this$props3.isLastChild;
					_this$props3.ariaLabelOverride;
					var shouldRender = _this$props3.shouldRender, inputStyle = _this$props3.inputStyle, focus = _this$props3.focus, isDisabled = _this$props3.isDisabled, hasErrored = _this$props3.hasErrored, errorStyle = _this$props3.errorStyle, isSuccessed = _this$props3.isSuccessed, successStyle = _this$props3.successStyle, focusStyle = _this$props3.focusStyle, disabledStyle = _this$props3.disabledStyle;
					_this$props3.shouldAutoFocus;
					var isInputNum = _this$props3.isInputNum, index = _this$props3.index, value = _this$props3.value, className = _this$props3.className;
					_this$props3.isInputSecure;
					_this$props3.onSubmit;
					var rest = _objectWithoutProperties(_this$props3, _excluded);
					return _react["default"].createElement("div", {
						className,
						style: {
							display: "flex",
							alignItems: "center"
						}
					}, _react["default"].createElement("input", _extends({
						"aria-label": this.getAriaLabel(index, isInputNum),
						style: Object.assign({
							width: "1em",
							textAlign: "center",
							padding: 0
						}, isStyleObject(inputStyle) && inputStyle, focus && isStyleObject(focusStyle) && focusStyle, isDisabled && isStyleObject(disabledStyle) && disabledStyle, hasErrored && !isSuccessed && isStyleObject(errorStyle) && errorStyle, isSuccessed && !hasErrored && isStyleObject(successStyle) && successStyle),
						placeholder,
						className: this.getClasses(inputStyle, focus && focusStyle, isDisabled && disabledStyle, hasErrored && !isSuccessed && errorStyle, isSuccessed && !hasErrored && successStyle),
						type: this.getType(),
						ref: this.input,
						disabled: isDisabled,
						value: value ? value : ""
					}, rest)), !isLastChild && shouldRender && separator);
				}
			}
		]);
		return SingleOtpInput;
	}(_react.PureComponent);
	var OtpInput = function(_Component) {
		_inherits(OtpInput, _Component);
		var _super2 = _createSuper(OtpInput);
		function OtpInput() {
			var _this2;
			_classCallCheck(this, OtpInput);
			for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) args[_key2] = arguments[_key2];
			_this2 = _super2.call.apply(_super2, [this].concat(args));
			_defineProperty(_assertThisInitialized(_this2), "state", { activeInput: 0 });
			_defineProperty(_assertThisInitialized(_this2), "getOtpValue", function() {
				return _this2.props.value ? _this2.props.value.toString().split("") : [];
			});
			_defineProperty(_assertThisInitialized(_this2), "getPlaceholderValue", function() {
				var _this2$props = _this2.props, placeholder = _this2$props.placeholder, numInputs = _this2$props.numInputs;
				if (typeof placeholder === "string") {
					if (placeholder.length === numInputs) return placeholder;
					if (placeholder.length > 0) console.error("Length of the placeholder should be equal to the number of inputs.");
				}
			});
			_defineProperty(_assertThisInitialized(_this2), "handleOtpChange", function(otp) {
				var onChange = _this2.props.onChange;
				onChange(otp.join(""));
			});
			_defineProperty(_assertThisInitialized(_this2), "isInputValueValid", function(value) {
				return (_this2.props.isInputNum ? !isNaN(parseInt(value, 10)) : typeof value === "string") && value.trim().length === 1;
			});
			_defineProperty(_assertThisInitialized(_this2), "focusInput", function(input) {
				var numInputs = _this2.props.numInputs;
				var activeInput = Math.max(Math.min(numInputs - 1, input), 0);
				_this2.setState({ activeInput });
			});
			_defineProperty(_assertThisInitialized(_this2), "focusNextInput", function() {
				var activeInput = _this2.state.activeInput;
				_this2.focusInput(activeInput + 1);
			});
			_defineProperty(_assertThisInitialized(_this2), "focusPrevInput", function() {
				var activeInput = _this2.state.activeInput;
				_this2.focusInput(activeInput - 1);
			});
			_defineProperty(_assertThisInitialized(_this2), "changeCodeAtFocus", function(value) {
				var activeInput = _this2.state.activeInput;
				var otp = _this2.getOtpValue();
				otp[activeInput] = value[0];
				_this2.handleOtpChange(otp);
			});
			_defineProperty(_assertThisInitialized(_this2), "handleOnPaste", function(e) {
				e.preventDefault();
				var activeInput = _this2.state.activeInput;
				var _this2$props2 = _this2.props, numInputs = _this2$props2.numInputs;
				if (_this2$props2.isDisabled) return;
				var otp = _this2.getOtpValue();
				var nextActiveInput = activeInput;
				var rawPastedData = e.clipboardData.getData("text/plain");
				var pastedData = (_this2.props.isInputNum ? rawPastedData.replace(/\D/g, "") : rawPastedData).slice(0, numInputs - activeInput).split("");
				for (var pos = 0; pos < numInputs; ++pos) if (pos >= activeInput && pastedData.length > 0) {
					otp[pos] = pastedData.shift();
					nextActiveInput++;
				}
				_this2.setState({ activeInput: nextActiveInput }, function() {
					_this2.focusInput(nextActiveInput);
					_this2.handleOtpChange(otp);
				});
			});
			_defineProperty(_assertThisInitialized(_this2), "handleOnChange", function(e) {
				var value = e.target.value;
				if (_this2.isInputValueValid(value)) _this2.changeCodeAtFocus(value);
			});
			_defineProperty(_assertThisInitialized(_this2), "handleOnKeyDown", function(e) {
				if (e.keyCode === BACKSPACE || e.key === "Backspace") {
					e.preventDefault();
					_this2.changeCodeAtFocus("");
					_this2.focusInput(_this2.state.activeInput - 1);
				} else if (e.keyCode === DELETE || e.key === "Delete") {
					e.preventDefault();
					_this2.changeCodeAtFocus("");
				} else if (e.keyCode === LEFT_ARROW || e.key === "ArrowLeft") {
					e.preventDefault();
					_this2.focusPrevInput();
				} else if (e.keyCode === RIGHT_ARROW || e.key === "ArrowRight") {
					e.preventDefault();
					_this2.focusNextInput();
				} else if (e.keyCode === SPACEBAR || e.key === " " || e.key === "Spacebar" || e.key === "Space") e.preventDefault();
				else if (e.keyCode === ENTER || e.key === "Enter") _this2.props.onSubmit();
			});
			_defineProperty(_assertThisInitialized(_this2), "handleOnInput", function(e) {
				var value = e.target.value;
				if (!e.target.value) return;
				if (e.target.value && e.target.value.length > 1) {
					e.preventDefault();
					var numInputs = _this2.props.numInputs;
					var activeInput = _this2.state.activeInput;
					var otp = _this2.getOtpValue();
					var pastedData = e.target.value.slice(0, numInputs - activeInput).split("");
					for (var pos = 0; pos < numInputs; ++pos) if (pos >= activeInput && pastedData.length > 0) otp[pos] = pastedData.shift();
					_this2.handleOtpChange(otp);
					_this2.focusInput(_this2.props.numInputs);
				} else if (value && value.trim().length > 1) {
					e.clipboardData = { getData: function getData() {
						return value.trim();
					} };
					_this2.handleOnPaste(e);
				} else if (_this2.isInputValueValid(e.target.value)) _this2.focusNextInput();
				else if (!_this2.props.isInputNum) {
					var nativeEvent = e.nativeEvent;
					if (nativeEvent.data === null && nativeEvent.inputType === "deleteContentBackward") {
						e.preventDefault();
						_this2.changeCodeAtFocus("");
						_this2.focusPrevInput();
					}
				}
			});
			_defineProperty(_assertThisInitialized(_this2), "renderInputs", function() {
				var activeInput = _this2.state.activeInput;
				var _this2$props3 = _this2.props, id = _this2$props3.id, autoComplete = _this2$props3.autoComplete, numInputs = _this2$props3.numInputs, inputStyle = _this2$props3.inputStyle, focusStyle = _this2$props3.focusStyle, separator = _this2$props3.separator, _this2$props3$separat = _this2$props3.separateAfter, separateAfter = _this2$props3$separat === void 0 ? 1 : _this2$props3$separat, isDisabled = _this2$props3.isDisabled, disabledStyle = _this2$props3.disabledStyle, hasErrored = _this2$props3.hasErrored, errorStyle = _this2$props3.errorStyle, isSuccessed = _this2$props3.isSuccessed, successStyle = _this2$props3.successStyle, shouldAutoFocus = _this2$props3.shouldAutoFocus, isInputNum = _this2$props3.isInputNum, isInputSecure = _this2$props3.isInputSecure, className = _this2$props3.className, inputProps = _this2$props3.inputProps, onSubmit = _this2$props3.onSubmit;
				var inputs = [];
				var otp = _this2.getOtpValue();
				var placeholder = _this2.getPlaceholderValue();
				var dataCy = _this2.props["data-cy"];
				var dataTestId = _this2.props["data-testid"];
				var customTestAttr = _this2.props["custom-test-attr"];
				var customTestId = _this2.props["custom-test-id"];
				var _loop = function _loop(i) {
					var shouldRender = void 0;
					if ((i + 1) % parseInt(separateAfter) === 0) shouldRender = true;
					else shouldRender = false;
					var testAttr = {};
					if (customTestAttr) testAttr[customTestAttr] = customTestId && "".concat(customTestId, "-").concat(i);
					var currentInputProps = {};
					if (inputProps) if (Array.isArray(inputProps)) {
						if (inputProps[i]) currentInputProps = inputProps[i];
					} else currentInputProps = inputProps;
					inputs.push(_react["default"].createElement(SingleOtpInput, _extends({
						id: id && "".concat(id, "-").concat(i),
						autoComplete: autoComplete !== null && autoComplete !== void 0 ? autoComplete : "off",
						placeholder: placeholder && placeholder[i],
						key: i,
						index: i,
						focus: activeInput === i,
						value: otp && otp[i],
						onChange: _this2.handleOnChange,
						onKeyDown: _this2.handleOnKeyDown,
						onInput: _this2.handleOnInput,
						onPaste: _this2.handleOnPaste,
						onFocus: function onFocus(e) {
							_this2.setState({ activeInput: i });
							e.target.select();
						},
						onBlur: function onBlur() {
							return _this2.setState({ activeInput: -1 });
						},
						separator,
						inputStyle,
						focusStyle,
						isLastChild: i === numInputs - 1,
						isDisabled,
						disabledStyle,
						hasErrored,
						errorStyle,
						isSuccessed,
						successStyle,
						shouldAutoFocus,
						isInputNum,
						isInputSecure,
						className,
						"data-cy": dataCy && "".concat(dataCy, "-").concat(i),
						"data-testid": dataTestId && "".concat(dataTestId, "-").concat(i),
						shouldRender,
						onSubmit
					}, currentInputProps, testAttr)));
				};
				for (var i = 0; i < numInputs; i++) _loop(i);
				return inputs;
			});
			return _this2;
		}
		_createClass(OtpInput, [{
			key: "componentDidUpdate",
			value: function componentDidUpdate() {
				var value = this.props.value;
				var activeInput = this.state.activeInput;
				if (value == "" && activeInput > 0) this.setState({ activeInput: 0 });
			}
		}, {
			key: "render",
			value: function render() {
				var containerStyle = this.props.containerStyle;
				return _react["default"].createElement("div", {
					style: Object.assign({ display: "flex" }, isStyleObject(containerStyle) && containerStyle),
					className: !isStyleObject(containerStyle) ? containerStyle : ""
				}, this.renderInputs());
			}
		}]);
		return OtpInput;
	}(_react.Component);
	_defineProperty(OtpInput, "defaultProps", {
		numInputs: 4,
		onChange: function onChange(otp) {
			return console.log(otp);
		},
		isDisabled: false,
		shouldAutoFocus: false,
		value: "",
		isInputSecure: false,
		onSubmit: function onSubmit(otp) {
			return console.log(otp);
		}
	});
	exports["default"] = OtpInput;
}));
//#endregion
//#region source-snapshot/src/component/CountDown/index.js
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var import_lib = /* @__PURE__ */ __toESM(require_lib());
var import_jsx_runtime = require_jsx_runtime();
var COUNT_DOWN_TIME = 60;
var CountDown = class extends import_react.Component {
	state = {
		time: this.props.countDownTime || COUNT_DOWN_TIME,
		isFinished: false
	};
	timer = null;
	onBeforeStart = () => {
		this.resetCountDownState();
	};
	componentWillUnmount() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}
	start = () => {
		this.onBeforeStart();
		this.timer = setInterval(() => {
			this.setState((prev) => ({ time: prev.time - 1 }), () => {
				if (this.state.time === 0) this.stop();
			});
		}, 1e3);
	};
	stop = () => {
		const { onFinishedEffect } = this.props;
		this.resetCountDownState(true);
		onFinishedEffect?.();
	};
	resetCountDownState = (isFinished = false) => {
		const { countDownTime } = this.props;
		this.setState({
			isFinished,
			time: countDownTime || COUNT_DOWN_TIME
		});
		this.timer && clearInterval(this.timer);
		this.timer = null;
	};
	render() {
		const { t } = this.props;
		const { time, isFinished } = this.state;
		if (isFinished) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("reSendCode") });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
			"(",
			time,
			"s)",
			t("timeLeft")
		] });
	}
};
//#endregion
//#region source-snapshot/src/component/CRM/LoginCRM/components/SendAuthCode.js
var numInputs = 6;
var SendAuthCode = (props) => {
	const { goBackStep, phoneNum, onVerifySuccess, onClose, t, tempMemberInfo, isShowHeader = true, hideBackButton = false, setCRMAuthCodeVerified, setCRMAuthCodeVerifiedPhone } = props;
	const [authCode, setAuthCode] = (0, import_react.useState)("");
	const [showTotalPhone, setShowTotalPhone] = (0, import_react.useState)(false);
	const countDownRef = (0, import_react.useRef)(null);
	const [reSendCode, setReSendCode] = (0, import_react.useState)(true);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [session, setSession] = (0, import_react.useState)("");
	const [errInfo, setErrorInfo] = (0, import_react.useState)({
		errorApiMsg: "",
		errorApiShow: false
	});
	const [isPrivacyConfirm, setPrivacyConfirm] = (0, import_react.useState)(true);
	const [keyboardToggle, setKeyboardToggle] = (0, import_react.useState)(false);
	const [activeIndex, setActiveIndex] = (0, import_react.useState)(0);
	const [isComplete, setIsComplete] = (0, import_react.useState)(false);
	const isVertical = getDeviceOrientation() === "vertical";
	useCloseModalOnHomePage(onClose);
	(0, import_react.useEffect)(() => {
		handleSendAuthCode(true);
		return () => {};
	}, []);
	(0, import_react.useEffect)(() => {
		if (authCode?.length === 6) {
			if (!isPrivacyConfirm) return toast_default.info(t("confirm-policy"), "top");
			onSubmitAuthCode();
		}
	}, [authCode, isPrivacyConfirm]);
	const showApiModalTip = (errMsg) => {
		setErrorInfo({
			errorApiMsg: errMsg,
			errorApiShow: true
		});
		const timer = setTimeout(() => {
			setErrorInfo({
				errorApiMsg: "",
				errorApiShow: false
			});
			clearTimeout(timer);
		}, 2e3);
	};
	const backToPrevStep = () => {
		goBackStep?.();
		setAuthCode("");
	};
	const changePrivacyConfirm = (v) => {
		setPrivacyConfirm(v);
	};
	const handleSendAuthCode = async (defaultSend = false) => {
		if (!defaultSend && !isPrivacyConfirm) return toast_default.info(t("confirm-policy"), "top");
		const onSendError = (msg) => {
			setReSendCode(true);
			showApiModalTip(msg);
			countDownRef.current.stop();
			return false;
		};
		try {
			setLoading(true);
			setReSendCode(false);
			const codeRes = await getAuthCode({
				phone: `+1${phoneNum.replace(/\D/g, "")}`,
				countryCode: "+1",
				options: { autoSignUp: true }
			});
			if (codeRes.status === 200 && codeRes.data.successful) {
				setSession(codeRes.data?.otpLogin?.Session || "");
				countDownRef.current.start();
				toast_default.info(t("sentSuccess"), "top");
				return true;
			}
			return onSendError(codeRes.data.message);
		} catch (e) {
			return onSendError(e.response?.data?.message || e.message || "Network Error");
		} finally {
			setLoading(false);
		}
	};
	const onSubmitAuthCode = async () => {
		const onVerifyError = (msg) => {
			setAuthCode("");
			showApiModalTip(msg);
			countDownRef.current?.stop();
		};
		hideKeyboard();
		try {
			setLoading(true);
			const phone = phoneNum.replace(/\D/g, "");
			const res = await verifyAuthCode({
				phone: `+1${phone}`,
				countryCode: "+1",
				code: authCode,
				session
			});
			if (res.status === 200 && res.data.token) {
				setCRMAuthCodeVerified(true);
				setCRMAuthCodeVerifiedPhone(phone);
				await onVerifySuccess(phone, tempMemberInfo);
				await backToPrevStep();
				return;
			}
			onVerifyError(res.data.message);
		} catch (e) {
			if (e.response?.data?.code === "INCORRECT_CODE") {
				const session = e.response.data.retrySession;
				setSession(session);
			}
			onVerifyError(e.response?.data?.message || e.message || "Network Error");
		} finally {
			setLoading(false);
		}
	};
	const changeAuthCode = (key, isVKboard = false) => {
		if (isVKboard) {
			if (key === "bksp" || key === "delete") handlePressDelete();
			else if (/^\d$/.test(key)) {
				if (authCode.length < numInputs) {
					const newAuthCode = authCode.substring(0, activeIndex) + key + authCode.substring(activeIndex);
					setAuthCode(newAuthCode);
					if (activeIndex < numInputs - 1) setActiveIndex(activeIndex + 1);
				}
			}
		} else setAuthCode(key);
	};
	const showKeyboard = () => {
		setKeyboardToggle(true);
	};
	const hideKeyboard = () => {
		setKeyboardToggle(false);
	};
	const handleInputFocus = (index) => {
		setActiveIndex(index);
	};
	const handlePressEnter = () => {
		if (isComplete) onSubmitAuthCode();
	};
	const handlePressDelete = () => {
		if (activeIndex > 0) {
			const newAuthCode = authCode.substring(0, activeIndex - 1) + authCode.substring(activeIndex);
			setAuthCode(newAuthCode);
			setActiveIndex(activeIndex - 1);
		} else if (activeIndex === 0 && authCode.length > 0) setAuthCode(authCode.substring(1));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: LoginModal_module_default.authCodeWrapper,
		children: [
			isShowHeader && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboHeader_default, {
				handleGoBack: backToPrevStep,
				hideBackButton
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: LoginModal_module_default.authCodeBox,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: LoginModal_module_default.authCode,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: jingleBell_default,
							className: LoginModal_module_default.jingleBell
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("plsEnterAuth") })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: LoginModal_module_default.sendTo,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [t("sendAuthTo"), ":"] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: LoginModal_module_default.sendToPhone,
								children: ["+1", maskPhoneNumber(phoneNum, showTotalPhone)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								onClick: () => setShowTotalPhone(!showTotalPhone),
								children: showTotalPhone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefIcon$1, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefIcon, {})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: LoginModal_module_default.authCodeInputBox,
						onClick: () => {
							if (isOpenVtkeyboadrd() && !isVertical) showKeyboard();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lib.default, {
							value: authCode,
							onChange: (v) => changeAuthCode(v),
							numInputs,
							separator: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { padding: "0 0.5rem" } }),
							isInputNum: true,
							renderInput: (props, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								...props,
								onFocus: () => handleInputFocus(index),
								className: `otp-input-box ${index === activeIndex ? "active" : ""}`
							}),
							containerStyle: {
								width: "100%",
								justifyContent: "center",
								marginBottom: "10rem",
								opacity: isVertical ? 0 : 1
							},
							inputStyle: {
								width: "11rem",
								height: "13rem",
								outline: "none",
								border: "none",
								background: "var(--background-grey)",
								fontSize: "6rem",
								color: "#000",
								borderRadius: "20rem",
								boxShadow: "0.1rem 0.2rem 1rem rgba(0, 0, 0, 0.1) inset"
							},
							autoComplete: "on"
						}), isVertical && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: LoginModal_module_default.displayAuthCode,
							children: Array.from({ length: numInputs }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: LoginModal_module_default.displayAuthCodeText,
								children: authCode[index] || ""
							}, index))
						})]
					}),
					isVertical && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: LoginModal_module_default.numPadSpacing,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(numPad_default, {
							keys: [
								"1",
								"2",
								"3",
								"4",
								"5",
								"6",
								"7",
								"8",
								"9",
								"0"
							],
							maxLength: 6,
							mode: "direct",
							keyPress: (v) => changeAuthCode(v, true)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Policy, {
						isPrivacyConfirm,
						changePrivacyConfirm
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: (0, import_classnames.default)(LoginModal_module_default.confirmBtn, !reSendCode || !isPrivacyConfirm ? LoginModal_module_default.disableConfirm : "linear-animate-btn"),
						onClick: () => {
							if (!reSendCode) return;
							handleSendAuthCode();
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountDown, {
							t,
							ref: countDownRef,
							onFinishedEffect: () => setReSendCode(true)
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: loading }),
			errInfo.errorApiShow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
				variant: "filled",
				severity: "error",
				children: errInfo.errorApiMsg
			}),
			keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
				keyboardValue: authCode,
				handlePressEnter,
				handlePressDelete,
				onKeyPress: (button) => changeAuthCode(button, true),
				closeKeyboard: () => hideKeyboard(),
				VKOuterStyle: { zIndex: 9999 }
			}) : null
		]
	});
};
var SendAuthCode_default = connect(null, {
	setCRMAuthCodeVerified,
	setCRMAuthCodeVerifiedPhone
})(SendAuthCode);
//#endregion
export { LoginModal_module_default as n, SendAuthCode_default as t };
