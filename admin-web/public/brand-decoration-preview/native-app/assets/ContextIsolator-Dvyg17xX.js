import { d as __toESM, i as require_react, r as require_react_dom } from "./toast-C8a1ReSo.js";
import { l as _extends, u as init_extends } from "./es-CFYDnMm2.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { _ as _createClass, b as init_defineProperty, i as init_slicedToArray, l as _toConsumableArray, r as _slicedToArray, u as init_toConsumableArray, v as init_createClass, y as _defineProperty } from "./objectWithoutProperties-DDcNLcsK.js";
import { $ as warningOnce, F as removeCSS, H as _classCallCheck, I as updateCSS, J as useComposeRef, L as canUseDom, O as useLayoutEffect, U as init_classCallCheck, X as _objectSpread2, q as supportRef, u as useToken } from "./style-DWrLyeCr.js";
import { n as NoFormStyle } from "./context-LOicZ8vw.js";
import { i as localeValues, o as devUseWarning, r as LocaleContext } from "./es-CH_mXwwY.js";
import { t as Icon } from "./AntdIcon-bxYy9EiO.js";
//#region node_modules/@ant-design/cssinjs/es/Keyframes.js
init_classCallCheck();
init_createClass();
init_defineProperty();
var Keyframe = /*#__PURE__*/ function() {
	function Keyframe(name, style) {
		_classCallCheck(this, Keyframe);
		_defineProperty(this, "name", void 0);
		_defineProperty(this, "style", void 0);
		_defineProperty(this, "_keyframe", true);
		this.name = name;
		this.style = style;
	}
	_createClass(Keyframe, [{
		key: "getName",
		value: function getName() {
			var hashId = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
			return hashId ? "".concat(hashId, "-").concat(this.name) : this.name;
		}
	}]);
	return Keyframe;
}();
//#endregion
//#region node_modules/antd/es/locale/useLocale.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var useLocale = (componentName, defaultLocale) => {
	const fullLocale = import_react.useContext(LocaleContext);
	return [import_react.useMemo(() => {
		var _a;
		const locale = defaultLocale || localeValues[componentName];
		const localeFromContext = (_a = fullLocale === null || fullLocale === void 0 ? void 0 : fullLocale[componentName]) !== null && _a !== void 0 ? _a : {};
		return Object.assign(Object.assign({}, typeof locale === "function" ? locale() : locale), localeFromContext || {});
	}, [
		componentName,
		defaultLocale,
		fullLocale
	]), import_react.useMemo(() => {
		const localeCode = fullLocale === null || fullLocale === void 0 ? void 0 : fullLocale.locale;
		if ((fullLocale === null || fullLocale === void 0 ? void 0 : fullLocale.exist) && !localeCode) return localeValues.locale;
		return localeCode;
	}, [fullLocale])];
};
//#endregion
//#region node_modules/@ant-design/icons-svg/es/asn/CloseOutlined.js
init_extends();
var CloseOutlined = {
	"icon": {
		"tag": "svg",
		"attrs": {
			"fill-rule": "evenodd",
			"viewBox": "64 64 896 896",
			"focusable": "false"
		},
		"children": [{
			"tag": "path",
			"attrs": { "d": "M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z" }
		}]
	},
	"name": "close",
	"theme": "outlined"
};
//#endregion
//#region node_modules/@ant-design/icons/es/icons/CloseOutlined.js
/**![close](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjYWNhY2EiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdmlld0JveD0iNjQgNjQgODk2IDg5NiIgZm9jdXNhYmxlPSJmYWxzZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNzk5Ljg2IDE2Ni4zMWMuMDIgMCAuMDQuMDIuMDguMDZsNTcuNjkgNTcuN2MuMDQuMDMuMDUuMDUuMDYuMDhhLjEyLjEyIDAgMDEwIC4wNmMwIC4wMy0uMDIuMDUtLjA2LjA5TDU2OS45MyA1MTJsMjg3LjcgMjg3LjdjLjA0LjA0LjA1LjA2LjA2LjA5YS4xMi4xMiAwIDAxMCAuMDdjMCAuMDItLjAyLjA0LS4wNi4wOGwtNTcuNyA1Ny42OWMtLjAzLjA0LS4wNS4wNS0uMDcuMDZhLjEyLjEyIDAgMDEtLjA3IDBjLS4wMyAwLS4wNS0uMDItLjA5LS4wNkw1MTIgNTY5LjkzbC0yODcuNyAyODcuN2MtLjA0LjA0LS4wNi4wNS0uMDkuMDZhLjEyLjEyIDAgMDEtLjA3IDBjLS4wMiAwLS4wNC0uMDItLjA4LS4wNmwtNTcuNjktNTcuN2MtLjA0LS4wMy0uMDUtLjA1LS4wNi0uMDdhLjEyLjEyIDAgMDEwLS4wN2MwLS4wMy4wMi0uMDUuMDYtLjA5TDQ1NC4wNyA1MTJsLTI4Ny43LTI4Ny43Yy0uMDQtLjA0LS4wNS0uMDYtLjA2LS4wOWEuMTIuMTIgMCAwMTAtLjA3YzAtLjAyLjAyLS4wNC4wNi0uMDhsNTcuNy01Ny42OWMuMDMtLjA0LjA1LS4wNS4wNy0uMDZhLjEyLjEyIDAgMDEuMDcgMGMuMDMgMCAuMDUuMDIuMDkuMDZMNTEyIDQ1NC4wN2wyODcuNy0yODcuN2MuMDQtLjA0LjA2LS4wNS4wOS0uMDZhLjEyLjEyIDAgMDEuMDcgMHoiIC8+PC9zdmc+) */
var RefIcon = /*#__PURE__*/ import_react.forwardRef(function CloseOutlined$1(props, ref) {
	return /*#__PURE__*/ import_react.createElement(Icon, _extends({}, props, {
		ref,
		icon: CloseOutlined
	}));
});
RefIcon.displayName = "CloseOutlined";
//#endregion
//#region node_modules/rc-util/es/pickAttrs.js
var propList = "".concat("accept acceptCharset accessKey action allowFullScreen allowTransparency\n    alt async autoComplete autoFocus autoPlay capture cellPadding cellSpacing challenge\n    charSet checked classID className colSpan cols content contentEditable contextMenu\n    controls coords crossOrigin data dateTime default defer dir disabled download draggable\n    encType form formAction formEncType formMethod formNoValidate formTarget frameBorder\n    headers height hidden high href hrefLang htmlFor httpEquiv icon id inputMode integrity\n    is keyParams keyType kind label lang list loop low manifest marginHeight marginWidth max maxLength media\n    mediaGroup method min minLength multiple muted name noValidate nonce open\n    optimum pattern placeholder poster preload radioGroup readOnly rel required\n    reversed role rowSpan rows sandbox scope scoped scrolling seamless selected\n    shape size sizes span spellCheck src srcDoc srcLang srcSet start step style\n    summary tabIndex target title type useMap value width wmode wrap", " ").concat("onCopy onCut onPaste onCompositionEnd onCompositionStart onCompositionUpdate onKeyDown\n    onKeyPress onKeyUp onFocus onBlur onChange onInput onSubmit onClick onContextMenu onDoubleClick\n    onDrag onDragEnd onDragEnter onDragExit onDragLeave onDragOver onDragStart onDrop onMouseDown\n    onMouseEnter onMouseLeave onMouseMove onMouseOut onMouseOver onMouseUp onSelect onTouchCancel\n    onTouchEnd onTouchMove onTouchStart onScroll onWheel onAbort onCanPlay onCanPlayThrough\n    onDurationChange onEmptied onEncrypted onEnded onError onLoadedData onLoadedMetadata\n    onLoadStart onPause onPlay onPlaying onProgress onRateChange onSeeked onSeeking onStalled onSuspend onTimeUpdate onVolumeChange onWaiting onLoad onError").split(/[\s\n]+/);
var ariaPrefix = "aria-";
var dataPrefix = "data-";
function match(key, prefix) {
	return key.indexOf(prefix) === 0;
}
/**
* Picker props from exist props with filter
* @param props Passed props
* @param ariaOnly boolean | { aria?: boolean; data?: boolean; attr?: boolean; } filter config
*/
function pickAttrs(props) {
	var ariaOnly = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
	var mergedConfig;
	if (ariaOnly === false) mergedConfig = {
		aria: true,
		data: true,
		attr: true
	};
	else if (ariaOnly === true) mergedConfig = { aria: true };
	else mergedConfig = _objectSpread2({}, ariaOnly);
	var attrs = {};
	Object.keys(props).forEach(function(key) {
		if (mergedConfig.aria && (key === "role" || match(key, ariaPrefix)) || mergedConfig.data && match(key, dataPrefix) || mergedConfig.attr && propList.includes(key)) attrs[key] = props[key];
	});
	return attrs;
}
//#endregion
//#region node_modules/rc-util/es/KeyCode.js
/**
* @ignore
* some key-codes definition and utils from closure-library
* @author yiminghe@gmail.com
*/
var KeyCode = {
	/**
	* MAC_ENTER
	*/
	MAC_ENTER: 3,
	/**
	* BACKSPACE
	*/
	BACKSPACE: 8,
	/**
	* TAB
	*/
	TAB: 9,
	/**
	* NUMLOCK on FF/Safari Mac
	*/
	NUM_CENTER: 12,
	/**
	* ENTER
	*/
	ENTER: 13,
	/**
	* SHIFT
	*/
	SHIFT: 16,
	/**
	* CTRL
	*/
	CTRL: 17,
	/**
	* ALT
	*/
	ALT: 18,
	/**
	* PAUSE
	*/
	PAUSE: 19,
	/**
	* CAPS_LOCK
	*/
	CAPS_LOCK: 20,
	/**
	* ESC
	*/
	ESC: 27,
	/**
	* SPACE
	*/
	SPACE: 32,
	/**
	* PAGE_UP
	*/
	PAGE_UP: 33,
	/**
	* PAGE_DOWN
	*/
	PAGE_DOWN: 34,
	/**
	* END
	*/
	END: 35,
	/**
	* HOME
	*/
	HOME: 36,
	/**
	* LEFT
	*/
	LEFT: 37,
	/**
	* UP
	*/
	UP: 38,
	/**
	* RIGHT
	*/
	RIGHT: 39,
	/**
	* DOWN
	*/
	DOWN: 40,
	/**
	* PRINT_SCREEN
	*/
	PRINT_SCREEN: 44,
	/**
	* INSERT
	*/
	INSERT: 45,
	/**
	* DELETE
	*/
	DELETE: 46,
	/**
	* ZERO
	*/
	ZERO: 48,
	/**
	* ONE
	*/
	ONE: 49,
	/**
	* TWO
	*/
	TWO: 50,
	/**
	* THREE
	*/
	THREE: 51,
	/**
	* FOUR
	*/
	FOUR: 52,
	/**
	* FIVE
	*/
	FIVE: 53,
	/**
	* SIX
	*/
	SIX: 54,
	/**
	* SEVEN
	*/
	SEVEN: 55,
	/**
	* EIGHT
	*/
	EIGHT: 56,
	/**
	* NINE
	*/
	NINE: 57,
	/**
	* QUESTION_MARK
	*/
	QUESTION_MARK: 63,
	/**
	* A
	*/
	A: 65,
	/**
	* B
	*/
	B: 66,
	/**
	* C
	*/
	C: 67,
	/**
	* D
	*/
	D: 68,
	/**
	* E
	*/
	E: 69,
	/**
	* F
	*/
	F: 70,
	/**
	* G
	*/
	G: 71,
	/**
	* H
	*/
	H: 72,
	/**
	* I
	*/
	I: 73,
	/**
	* J
	*/
	J: 74,
	/**
	* K
	*/
	K: 75,
	/**
	* L
	*/
	L: 76,
	/**
	* M
	*/
	M: 77,
	/**
	* N
	*/
	N: 78,
	/**
	* O
	*/
	O: 79,
	/**
	* P
	*/
	P: 80,
	/**
	* Q
	*/
	Q: 81,
	/**
	* R
	*/
	R: 82,
	/**
	* S
	*/
	S: 83,
	/**
	* T
	*/
	T: 84,
	/**
	* U
	*/
	U: 85,
	/**
	* V
	*/
	V: 86,
	/**
	* W
	*/
	W: 87,
	/**
	* X
	*/
	X: 88,
	/**
	* Y
	*/
	Y: 89,
	/**
	* Z
	*/
	Z: 90,
	/**
	* META
	*/
	META: 91,
	/**
	* WIN_KEY_RIGHT
	*/
	WIN_KEY_RIGHT: 92,
	/**
	* CONTEXT_MENU
	*/
	CONTEXT_MENU: 93,
	/**
	* NUM_ZERO
	*/
	NUM_ZERO: 96,
	/**
	* NUM_ONE
	*/
	NUM_ONE: 97,
	/**
	* NUM_TWO
	*/
	NUM_TWO: 98,
	/**
	* NUM_THREE
	*/
	NUM_THREE: 99,
	/**
	* NUM_FOUR
	*/
	NUM_FOUR: 100,
	/**
	* NUM_FIVE
	*/
	NUM_FIVE: 101,
	/**
	* NUM_SIX
	*/
	NUM_SIX: 102,
	/**
	* NUM_SEVEN
	*/
	NUM_SEVEN: 103,
	/**
	* NUM_EIGHT
	*/
	NUM_EIGHT: 104,
	/**
	* NUM_NINE
	*/
	NUM_NINE: 105,
	/**
	* NUM_MULTIPLY
	*/
	NUM_MULTIPLY: 106,
	/**
	* NUM_PLUS
	*/
	NUM_PLUS: 107,
	/**
	* NUM_MINUS
	*/
	NUM_MINUS: 109,
	/**
	* NUM_PERIOD
	*/
	NUM_PERIOD: 110,
	/**
	* NUM_DIVISION
	*/
	NUM_DIVISION: 111,
	/**
	* F1
	*/
	F1: 112,
	/**
	* F2
	*/
	F2: 113,
	/**
	* F3
	*/
	F3: 114,
	/**
	* F4
	*/
	F4: 115,
	/**
	* F5
	*/
	F5: 116,
	/**
	* F6
	*/
	F6: 117,
	/**
	* F7
	*/
	F7: 118,
	/**
	* F8
	*/
	F8: 119,
	/**
	* F9
	*/
	F9: 120,
	/**
	* F10
	*/
	F10: 121,
	/**
	* F11
	*/
	F11: 122,
	/**
	* F12
	*/
	F12: 123,
	/**
	* NUMLOCK
	*/
	NUMLOCK: 144,
	/**
	* SEMICOLON
	*/
	SEMICOLON: 186,
	/**
	* DASH
	*/
	DASH: 189,
	/**
	* EQUALS
	*/
	EQUALS: 187,
	/**
	* COMMA
	*/
	COMMA: 188,
	/**
	* PERIOD
	*/
	PERIOD: 190,
	/**
	* SLASH
	*/
	SLASH: 191,
	/**
	* APOSTROPHE
	*/
	APOSTROPHE: 192,
	/**
	* SINGLE_QUOTE
	*/
	SINGLE_QUOTE: 222,
	/**
	* OPEN_SQUARE_BRACKET
	*/
	OPEN_SQUARE_BRACKET: 219,
	/**
	* BACKSLASH
	*/
	BACKSLASH: 220,
	/**
	* CLOSE_SQUARE_BRACKET
	*/
	CLOSE_SQUARE_BRACKET: 221,
	/**
	* WIN_KEY
	*/
	WIN_KEY: 224,
	/**
	* MAC_FF_META
	*/
	MAC_FF_META: 224,
	/**
	* WIN_IME
	*/
	WIN_IME: 229,
	/**
	* whether text and modified key is entered at the same time.
	*/
	isTextModifyingKeyEvent: function isTextModifyingKeyEvent(e) {
		var keyCode = e.keyCode;
		if (e.altKey && !e.ctrlKey || e.metaKey || keyCode >= KeyCode.F1 && keyCode <= KeyCode.F12) return false;
		switch (keyCode) {
			case KeyCode.ALT:
			case KeyCode.CAPS_LOCK:
			case KeyCode.CONTEXT_MENU:
			case KeyCode.CTRL:
			case KeyCode.DOWN:
			case KeyCode.END:
			case KeyCode.ESC:
			case KeyCode.HOME:
			case KeyCode.INSERT:
			case KeyCode.LEFT:
			case KeyCode.MAC_FF_META:
			case KeyCode.META:
			case KeyCode.NUMLOCK:
			case KeyCode.NUM_CENTER:
			case KeyCode.PAGE_DOWN:
			case KeyCode.PAGE_UP:
			case KeyCode.PAUSE:
			case KeyCode.PRINT_SCREEN:
			case KeyCode.RIGHT:
			case KeyCode.SHIFT:
			case KeyCode.UP:
			case KeyCode.WIN_KEY:
			case KeyCode.WIN_KEY_RIGHT: return false;
			default: return true;
		}
	},
	/**
	* whether character is entered.
	*/
	isCharacterKey: function isCharacterKey(keyCode) {
		if (keyCode >= KeyCode.ZERO && keyCode <= KeyCode.NINE) return true;
		if (keyCode >= KeyCode.NUM_ZERO && keyCode <= KeyCode.NUM_MULTIPLY) return true;
		if (keyCode >= KeyCode.A && keyCode <= KeyCode.Z) return true;
		if (window.navigator.userAgent.indexOf("WebKit") !== -1 && keyCode === 0) return true;
		switch (keyCode) {
			case KeyCode.SPACE:
			case KeyCode.QUESTION_MARK:
			case KeyCode.NUM_PLUS:
			case KeyCode.NUM_MINUS:
			case KeyCode.NUM_PERIOD:
			case KeyCode.NUM_DIVISION:
			case KeyCode.SEMICOLON:
			case KeyCode.DASH:
			case KeyCode.EQUALS:
			case KeyCode.COMMA:
			case KeyCode.PERIOD:
			case KeyCode.SLASH:
			case KeyCode.APOSTROPHE:
			case KeyCode.SINGLE_QUOTE:
			case KeyCode.OPEN_SQUARE_BRACKET:
			case KeyCode.BACKSLASH:
			case KeyCode.CLOSE_SQUARE_BRACKET: return true;
			default: return false;
		}
	}
};
//#endregion
//#region node_modules/antd/es/_util/zindexContext.js
var zIndexContext = /*#__PURE__*/ import_react.createContext(void 0);
zIndexContext.displayName = "zIndexContext";
//#endregion
//#region node_modules/antd/es/_util/hooks/useZIndex.js
var CONTAINER_OFFSET = 100;
CONTAINER_OFFSET * 10;
/**
* Static function will default be the `CONTAINER_MAX_OFFSET`.
* But it still may have children component like Select, Dropdown.
* So the warning zIndex should exceed the `CONTAINER_MAX_OFFSET`.
*/
var CONTAINER_MAX_OFFSET_WITH_CHILDREN = 1100;
var containerBaseZIndexOffset = {
	Modal: CONTAINER_OFFSET,
	Drawer: CONTAINER_OFFSET,
	Popover: CONTAINER_OFFSET,
	Popconfirm: CONTAINER_OFFSET,
	Tooltip: CONTAINER_OFFSET,
	Tour: CONTAINER_OFFSET,
	FloatButton: CONTAINER_OFFSET
};
var consumerBaseZIndexOffset = {
	SelectLike: 50,
	Dropdown: 50,
	DatePicker: 50,
	Menu: 50,
	ImagePreview: 1
};
function isContainerType(type) {
	return type in containerBaseZIndexOffset;
}
var useZIndex = (componentType, customZIndex) => {
	const [, token] = useToken();
	const parentZIndex = import_react.useContext(zIndexContext);
	const isContainer = isContainerType(componentType);
	let result;
	if (customZIndex !== void 0) result = [customZIndex, customZIndex];
	else {
		let zIndex = parentZIndex !== null && parentZIndex !== void 0 ? parentZIndex : 0;
		if (isContainer) zIndex += (parentZIndex ? 0 : token.zIndexPopupBase) + containerBaseZIndexOffset[componentType];
		else zIndex += consumerBaseZIndexOffset[componentType];
		result = [parentZIndex === void 0 ? customZIndex : zIndex, zIndex];
	}
	{
		const warning = devUseWarning(componentType);
		const maxZIndex = token.zIndexPopupBase + CONTAINER_MAX_OFFSET_WITH_CHILDREN;
		const currentZIndex = result[0] || 0;
		warning(customZIndex !== void 0 || currentZIndex <= maxZIndex, "usage", "`zIndex` is over design token `zIndexPopupBase` too much. It may cause unexpected override.");
	}
	return result;
};
//#endregion
//#region node_modules/antd/es/_util/motion.js
var getTransitionName = (rootPrefixCls, motion, transitionName) => {
	if (transitionName !== void 0) return transitionName;
	return `${rootPrefixCls}-${motion}`;
};
//#endregion
//#region node_modules/antd/es/space/Compact.js
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
init_toConsumableArray();
init_slicedToArray();
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var SpaceCompactItemContext = /*#__PURE__*/ import_react.createContext(null);
var useCompactItemContext = (prefixCls, direction) => {
	const compactItemContext = import_react.useContext(SpaceCompactItemContext);
	const compactItemClassnames = import_react.useMemo(() => {
		if (!compactItemContext) return "";
		const { compactDirection, isFirstItem, isLastItem } = compactItemContext;
		const separator = compactDirection === "vertical" ? "-vertical-" : "-";
		return (0, import_classnames.default)(`${prefixCls}-compact${separator}item`, {
			[`${prefixCls}-compact${separator}first-item`]: isFirstItem,
			[`${prefixCls}-compact${separator}last-item`]: isLastItem,
			[`${prefixCls}-compact${separator}item-rtl`]: direction === "rtl"
		});
	}, [
		prefixCls,
		direction,
		compactItemContext
	]);
	return {
		compactSize: compactItemContext === null || compactItemContext === void 0 ? void 0 : compactItemContext.compactSize,
		compactDirection: compactItemContext === null || compactItemContext === void 0 ? void 0 : compactItemContext.compactDirection,
		compactItemClassnames
	};
};
var NoCompactStyle = (props) => {
	const { children } = props;
	return /*#__PURE__*/ import_react.createElement(SpaceCompactItemContext.Provider, { value: null }, children);
};
//#endregion
//#region node_modules/@rc-component/portal/es/Context.js
var OrderContext = /*#__PURE__*/ import_react.createContext(null);
//#endregion
//#region node_modules/@rc-component/portal/es/useDom.js
var EMPTY_LIST = [];
/**
* Will add `div` to document. Nest call will keep order
* @param render Render DOM in document
*/
function useDom(render, debug) {
	var ele = _slicedToArray(import_react.useState(function() {
		if (!canUseDom()) return null;
		var defaultEle = document.createElement("div");
		if (debug) defaultEle.setAttribute("data-debug", debug);
		return defaultEle;
	}), 1)[0];
	var appendedRef = import_react.useRef(false);
	var queueCreate = import_react.useContext(OrderContext);
	var _React$useState4 = _slicedToArray(import_react.useState(EMPTY_LIST), 2), queue = _React$useState4[0], setQueue = _React$useState4[1];
	var mergedQueueCreate = queueCreate || (appendedRef.current ? void 0 : function(appendFn) {
		setQueue(function(origin) {
			return [appendFn].concat(_toConsumableArray(origin));
		});
	});
	function append() {
		if (!ele.parentElement) document.body.appendChild(ele);
		appendedRef.current = true;
	}
	function cleanup() {
		var _ele$parentElement;
		(_ele$parentElement = ele.parentElement) === null || _ele$parentElement === void 0 || _ele$parentElement.removeChild(ele);
		appendedRef.current = false;
	}
	useLayoutEffect(function() {
		if (render) if (queueCreate) queueCreate(append);
		else append();
		else cleanup();
		return cleanup;
	}, [render]);
	useLayoutEffect(function() {
		if (queue.length) {
			queue.forEach(function(appendFn) {
				return appendFn();
			});
			setQueue(EMPTY_LIST);
		}
	}, [queue]);
	return [ele, mergedQueueCreate];
}
//#endregion
//#region node_modules/rc-util/es/getScrollBarSize.js
function measureScrollbarSize(ele) {
	var randomId = "rc-scrollbar-measure-".concat(Math.random().toString(36).substring(7));
	var measureEle = document.createElement("div");
	measureEle.id = randomId;
	var measureStyle = measureEle.style;
	measureStyle.position = "absolute";
	measureStyle.left = "0";
	measureStyle.top = "0";
	measureStyle.width = "100px";
	measureStyle.height = "100px";
	measureStyle.overflow = "scroll";
	var fallbackWidth;
	var fallbackHeight;
	if (ele) {
		var targetStyle = getComputedStyle(ele);
		measureStyle.scrollbarColor = targetStyle.scrollbarColor;
		measureStyle.scrollbarWidth = targetStyle.scrollbarWidth;
		var webkitScrollbarStyle = getComputedStyle(ele, "::-webkit-scrollbar");
		var width = parseInt(webkitScrollbarStyle.width, 10);
		var height = parseInt(webkitScrollbarStyle.height, 10);
		try {
			var widthStyle = width ? "width: ".concat(webkitScrollbarStyle.width, ";") : "";
			var heightStyle = height ? "height: ".concat(webkitScrollbarStyle.height, ";") : "";
			updateCSS("\n#".concat(randomId, "::-webkit-scrollbar {\n").concat(widthStyle, "\n").concat(heightStyle, "\n}"), randomId);
		} catch (e) {
			console.error(e);
			fallbackWidth = width;
			fallbackHeight = height;
		}
	}
	document.body.appendChild(measureEle);
	var scrollWidth = ele && fallbackWidth && !isNaN(fallbackWidth) ? fallbackWidth : measureEle.offsetWidth - measureEle.clientWidth;
	var scrollHeight = ele && fallbackHeight && !isNaN(fallbackHeight) ? fallbackHeight : measureEle.offsetHeight - measureEle.clientHeight;
	document.body.removeChild(measureEle);
	removeCSS(randomId);
	return {
		width: scrollWidth,
		height: scrollHeight
	};
}
function getTargetScrollBarSize(target) {
	if (typeof document === "undefined" || !target || !(target instanceof Element)) return {
		width: 0,
		height: 0
	};
	return measureScrollbarSize(target);
}
//#endregion
//#region node_modules/@rc-component/portal/es/util.js
/**
* Test usage export. Do not use in your production
*/
function isBodyOverflowing() {
	return document.body.scrollHeight > (window.innerHeight || document.documentElement.clientHeight) && window.innerWidth > document.body.offsetWidth;
}
//#endregion
//#region node_modules/@rc-component/portal/es/useScrollLocker.js
init_slicedToArray();
var UNIQUE_ID = "rc-util-locker-".concat(Date.now());
var uuid = 0;
function useScrollLocker(lock) {
	var mergedLock = !!lock;
	var id = _slicedToArray(import_react.useState(function() {
		uuid += 1;
		return "".concat(UNIQUE_ID, "_").concat(uuid);
	}), 1)[0];
	useLayoutEffect(function() {
		if (mergedLock) {
			var scrollbarSize = getTargetScrollBarSize(document.body).width;
			var isOverflow = isBodyOverflowing();
			updateCSS("\nhtml body {\n  overflow-y: hidden;\n  ".concat(isOverflow ? "width: calc(100% - ".concat(scrollbarSize, "px);") : "", "\n}"), id);
		} else removeCSS(id);
		return function() {
			removeCSS(id);
		};
	}, [mergedLock, id]);
}
//#endregion
//#region node_modules/@rc-component/portal/es/mock.js
var inline = false;
function inlineMock(nextInline) {
	if (typeof nextInline === "boolean") inline = nextInline;
	return inline;
}
//#endregion
//#region node_modules/@rc-component/portal/es/Portal.js
init_slicedToArray();
var getPortalContainer = function getPortalContainer(getContainer) {
	if (getContainer === false) return false;
	if (!canUseDom() || !getContainer) return null;
	if (typeof getContainer === "string") return document.querySelector(getContainer);
	if (typeof getContainer === "function") return getContainer();
	return getContainer;
};
var Portal = /*#__PURE__*/ import_react.forwardRef(function(props, ref) {
	var open = props.open, autoLock = props.autoLock, getContainer = props.getContainer, debug = props.debug, _props$autoDestroy = props.autoDestroy, autoDestroy = _props$autoDestroy === void 0 ? true : _props$autoDestroy, children = props.children;
	var _React$useState2 = _slicedToArray(import_react.useState(open), 2), shouldRender = _React$useState2[0], setShouldRender = _React$useState2[1];
	var mergedRender = shouldRender || open;
	warningOnce(canUseDom() || !open, "Portal only work in client side. Please call 'useEffect' to show Portal instead default render in SSR.");
	import_react.useEffect(function() {
		if (autoDestroy || open) setShouldRender(open);
	}, [open, autoDestroy]);
	var _React$useState4 = _slicedToArray(import_react.useState(function() {
		return getPortalContainer(getContainer);
	}), 2), innerContainer = _React$useState4[0], setInnerContainer = _React$useState4[1];
	import_react.useEffect(function() {
		var customizeContainer = getPortalContainer(getContainer);
		setInnerContainer(customizeContainer !== null && customizeContainer !== void 0 ? customizeContainer : null);
	});
	var _useDom2 = _slicedToArray(useDom(mergedRender && !innerContainer, debug), 2), defaultContainer = _useDom2[0], queueCreate = _useDom2[1];
	var mergedContainer = innerContainer !== null && innerContainer !== void 0 ? innerContainer : defaultContainer;
	useScrollLocker(autoLock && open && canUseDom() && (mergedContainer === defaultContainer || mergedContainer === document.body));
	var childRef = null;
	if (children && supportRef(children) && ref) childRef = children.ref;
	var mergedRef = useComposeRef(childRef, ref);
	if (!mergedRender || !canUseDom() || innerContainer === void 0) return null;
	var renderInline = mergedContainer === false || inlineMock();
	var reffedChildren = children;
	if (ref) reffedChildren = /*#__PURE__*/ import_react.cloneElement(children, { ref: mergedRef });
	return /*#__PURE__*/ import_react.createElement(OrderContext.Provider, { value: queueCreate }, renderInline ? reffedChildren : /*#__PURE__*/ (0, import_react_dom.createPortal)(reffedChildren, mergedContainer));
});
Portal.displayName = "Portal";
//#endregion
//#region node_modules/@rc-component/portal/es/index.js
var es_default = Portal;
//#endregion
//#region node_modules/antd/es/_util/ContextIsolator.js
var ContextIsolator = (props) => {
	const { space, form, children } = props;
	if (children === void 0 || children === null) return null;
	let result = children;
	if (form) result = /*#__PURE__*/ import_react.createElement(NoFormStyle, {
		override: true,
		status: true
	}, result);
	if (space) result = /*#__PURE__*/ import_react.createElement(NoCompactStyle, null, result);
	return result;
};
//#endregion
export { useZIndex as a, pickAttrs as c, Keyframe as d, getTransitionName as i, RefIcon as l, es_default as n, zIndexContext as o, useCompactItemContext as r, KeyCode as s, ContextIsolator as t, useLocale as u };
