import { d as __toESM, i as require_react, r as require_react_dom } from "./toast-C8a1ReSo.js";
import { l as _extends, u as init_extends } from "./es-CFYDnMm2.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { S as init_typeof, _ as _createClass, a as _nonIterableRest, b as init_defineProperty, c as init_arrayWithHoles, d as _unsupportedIterableToArray, f as init_unsupportedIterableToArray, g as init_assertThisInitialized, h as _assertThisInitialized, i as init_slicedToArray, l as _toConsumableArray, m as init_iterableToArray, n as init_objectWithoutProperties, o as init_nonIterableRest, p as _iterableToArray, r as _slicedToArray, s as _arrayWithHoles, t as _objectWithoutProperties, u as init_toConsumableArray, v as init_createClass, x as _typeof, y as _defineProperty } from "./objectWithoutProperties-DDcNLcsK.js";
import { $ as warningOnce, G as fillRef, H as _classCallCheck, K as getNodeRef, L as canUseDom, R as _createSuper, U as init_classCallCheck, V as _inherits, X as _objectSpread2, f as useSafeState, p as useEvent, q as supportRef } from "./style-DWrLyeCr.js";
//#region node_modules/rc-util/es/Dom/findDOMNode.js
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
init_defineProperty();
init_typeof();
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
function isDOM(node) {
	return node instanceof HTMLElement || node instanceof SVGElement;
}
/**
* Retrieves a DOM node via a ref, and does not invoke `findDOMNode`.
*/
function getDOM(node) {
	if (node && _typeof(node) === "object" && isDOM(node.nativeElement)) return node.nativeElement;
	if (isDOM(node)) return node;
	return null;
}
/**
* Return if a node is a DOM node. Else will return by `findDOMNode`
*/
function findDOMNode(node) {
	var domNode = getDOM(node);
	if (domNode) return domNode;
	if (node instanceof import_react.Component) {
		var _ReactDOM$findDOMNode;
		return (_ReactDOM$findDOMNode = import_react_dom.findDOMNode) === null || _ReactDOM$findDOMNode === void 0 ? void 0 : _ReactDOM$findDOMNode.call(import_react_dom.default, node);
	}
	return null;
}
//#endregion
//#region node_modules/rc-util/es/raf.js
init_classCallCheck();
init_createClass();
init_iterableToArray();
init_unsupportedIterableToArray();
init_toConsumableArray();
var raf = function raf(callback) {
	return +setTimeout(callback, 16);
};
var caf = function caf(num) {
	return clearTimeout(num);
};
if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
	raf = function raf(callback) {
		return window.requestAnimationFrame(callback);
	};
	caf = function caf(handle) {
		return window.cancelAnimationFrame(handle);
	};
}
var rafUUID = 0;
var rafIds = /* @__PURE__ */ new Map();
function cleanup(id) {
	rafIds.delete(id);
}
var wrapperRaf = function wrapperRaf(callback) {
	var times = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
	rafUUID += 1;
	var id = rafUUID;
	function callRef(leftTimes) {
		if (leftTimes === 0) {
			cleanup(id);
			callback();
		} else {
			var realId = raf(function() {
				callRef(leftTimes - 1);
			});
			rafIds.set(id, realId);
		}
	}
	callRef(times);
	return id;
};
wrapperRaf.cancel = function(id) {
	var realId = rafIds.get(id);
	cleanup(id);
	return caf(realId);
};
wrapperRaf.ids = function() {
	return rafIds;
};
//#endregion
//#region node_modules/@ant-design/icons/es/components/Context.js
var IconContext = /*#__PURE__*/ (0, import_react.createContext)({});
//#endregion
//#region node_modules/@babel/runtime/helpers/esm/toArray.js
init_arrayWithHoles();
init_nonIterableRest();
function _toArray(r) {
	return _arrayWithHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableRest();
}
//#endregion
//#region node_modules/rc-util/es/utils/get.js
function get(entity, path) {
	var current = entity;
	for (var i = 0; i < path.length; i += 1) {
		if (current === null || current === void 0) return;
		current = current[path[i]];
	}
	return current;
}
//#endregion
//#region node_modules/rc-util/es/utils/set.js
init_typeof();
function internalSet(entity, paths, value, removeIfUndefined) {
	if (!paths.length) return value;
	var _paths = _toArray(paths), path = _paths[0], restPath = _paths.slice(1);
	var clone;
	if (!entity && typeof path === "number") clone = [];
	else if (Array.isArray(entity)) clone = _toConsumableArray(entity);
	else clone = _objectSpread2({}, entity);
	if (removeIfUndefined && value === void 0 && restPath.length === 1) delete clone[path][restPath[0]];
	else clone[path] = internalSet(clone[path], restPath, value, removeIfUndefined);
	return clone;
}
function set(entity, paths, value) {
	var removeIfUndefined = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
	if (paths.length && removeIfUndefined && value === void 0 && !get(entity, paths.slice(0, -1))) return entity;
	return internalSet(entity, paths, value, removeIfUndefined);
}
function isObject(obj) {
	return _typeof(obj) === "object" && obj !== null && Object.getPrototypeOf(obj) === Object.prototype;
}
function createEmpty(source) {
	return Array.isArray(source) ? [] : {};
}
var keys = typeof Reflect === "undefined" ? Object.keys : Reflect.ownKeys;
/**
* Merge objects which will create
*/
function merge() {
	for (var _len = arguments.length, sources = new Array(_len), _key = 0; _key < _len; _key++) sources[_key] = arguments[_key];
	var clone = createEmpty(sources[0]);
	sources.forEach(function(src) {
		function internalMerge(path, parentLoopSet) {
			var loopSet = new Set(parentLoopSet);
			var value = get(src, path);
			var isArr = Array.isArray(value);
			if (isArr || isObject(value)) {
				if (!loopSet.has(value)) {
					loopSet.add(value);
					var originValue = get(clone, path);
					if (isArr) clone = set(clone, path, []);
					else if (!originValue || _typeof(originValue) !== "object") clone = set(clone, path, createEmpty(value));
					keys(value).forEach(function(key) {
						internalMerge([].concat(_toConsumableArray(path), [key]), loopSet);
					});
				}
			} else clone = set(clone, path, value);
		}
		internalMerge([]);
	});
	return clone;
}
//#endregion
//#region node_modules/antd/es/_util/warning.js
function noop() {}
var deprecatedWarnList = null;
var _warning = noop;
_warning = (valid, component, message) => {
	warningOnce(valid, `[antd: ${component}] ${message}`);
};
var warning = _warning;
var WarningContext = /*#__PURE__*/ import_react.createContext({});
/**
* This is a hook but we not named as `useWarning`
* since this is only used in development.
* We should always wrap this in `if (process.env.NODE_ENV !== 'production')` condition
*/
var devUseWarning = (component) => {
	const { strict } = import_react.useContext(WarningContext);
	const typeWarning = (valid, type, message) => {
		if (!valid) if (strict === false && type === "deprecated") {
			const existWarning = deprecatedWarnList;
			if (!deprecatedWarnList) deprecatedWarnList = {};
			deprecatedWarnList[component] = deprecatedWarnList[component] || [];
			if (!deprecatedWarnList[component].includes(message || "")) deprecatedWarnList[component].push(message || "");
			if (!existWarning) console.warn("[antd] There exists deprecated usage in your code:", deprecatedWarnList);
		} else warning(valid, component, message);
	};
	typeWarning.deprecated = (valid, oldProp, newProp, message) => {
		typeWarning(valid, "deprecated", `\`${oldProp}\` is deprecated. Please use \`${newProp}\` instead.${message ? ` ${message}` : ""}`);
	};
	return typeWarning;
};
//#endregion
//#region node_modules/rc-pagination/es/locale/en_US.js
var locale$3 = {
	items_per_page: "/ page",
	jump_to: "Go to",
	jump_to_confirm: "confirm",
	page: "Page",
	prev_page: "Previous Page",
	next_page: "Next Page",
	prev_5: "Previous 5 Pages",
	next_5: "Next 5 Pages",
	prev_3: "Previous 3 Pages",
	next_3: "Next 3 Pages",
	page_size: "Page Size"
};
//#endregion
//#region node_modules/rc-picker/es/locale/en_US.js
var locale$2 = _objectSpread2(_objectSpread2({}, {
	yearFormat: "YYYY",
	dayFormat: "D",
	cellMeridiemFormat: "A",
	monthBeforeYear: true
}), {}, {
	locale: "en_US",
	today: "Today",
	now: "Now",
	backToToday: "Back to today",
	ok: "OK",
	clear: "Clear",
	week: "Week",
	month: "Month",
	year: "Year",
	timeSelect: "select time",
	dateSelect: "select date",
	weekSelect: "Choose a week",
	monthSelect: "Choose a month",
	yearSelect: "Choose a year",
	decadeSelect: "Choose a decade",
	dateFormat: "M/D/YYYY",
	dateTimeFormat: "M/D/YYYY HH:mm:ss",
	previousMonth: "Previous month (PageUp)",
	nextMonth: "Next month (PageDown)",
	previousYear: "Last year (Control + left)",
	nextYear: "Next year (Control + right)",
	previousDecade: "Last decade",
	nextDecade: "Next decade",
	previousCentury: "Last century",
	nextCentury: "Next century"
});
//#endregion
//#region node_modules/antd/es/time-picker/locale/en_US.js
var locale$1 = {
	placeholder: "Select time",
	rangePlaceholder: ["Start time", "End time"]
};
//#endregion
//#region node_modules/antd/es/date-picker/locale/en_US.js
var locale = {
	lang: Object.assign({
		placeholder: "Select date",
		yearPlaceholder: "Select year",
		quarterPlaceholder: "Select quarter",
		monthPlaceholder: "Select month",
		weekPlaceholder: "Select week",
		rangePlaceholder: ["Start date", "End date"],
		rangeYearPlaceholder: ["Start year", "End year"],
		rangeQuarterPlaceholder: ["Start quarter", "End quarter"],
		rangeMonthPlaceholder: ["Start month", "End month"],
		rangeWeekPlaceholder: ["Start week", "End week"]
	}, locale$2),
	timePickerLocale: Object.assign({}, locale$1)
};
//#endregion
//#region node_modules/antd/es/calendar/locale/en_US.js
var en_US_default = locale;
//#endregion
//#region node_modules/antd/es/locale/en_US.js
var typeTemplate = "${label} is not a valid ${type}";
var localeValues = {
	locale: "en",
	Pagination: locale$3,
	DatePicker: locale,
	TimePicker: locale$1,
	Calendar: en_US_default,
	global: {
		placeholder: "Please select",
		close: "Close"
	},
	Table: {
		filterTitle: "Filter menu",
		filterConfirm: "OK",
		filterReset: "Reset",
		filterEmptyText: "No filters",
		filterCheckAll: "Select all items",
		filterSearchPlaceholder: "Search in filters",
		emptyText: "No data",
		selectAll: "Select current page",
		selectInvert: "Invert current page",
		selectNone: "Clear all data",
		selectionAll: "Select all data",
		sortTitle: "Sort",
		expand: "Expand row",
		collapse: "Collapse row",
		triggerDesc: "Click to sort descending",
		triggerAsc: "Click to sort ascending",
		cancelSort: "Click to cancel sorting"
	},
	Tour: {
		Next: "Next",
		Previous: "Previous",
		Finish: "Finish"
	},
	Modal: {
		okText: "OK",
		cancelText: "Cancel",
		justOkText: "OK"
	},
	Popconfirm: {
		okText: "OK",
		cancelText: "Cancel"
	},
	Transfer: {
		titles: ["", ""],
		searchPlaceholder: "Search here",
		itemUnit: "item",
		itemsUnit: "items",
		remove: "Remove",
		selectCurrent: "Select current page",
		removeCurrent: "Remove current page",
		selectAll: "Select all data",
		deselectAll: "Deselect all data",
		removeAll: "Remove all data",
		selectInvert: "Invert current page"
	},
	Upload: {
		uploading: "Uploading...",
		removeFile: "Remove file",
		uploadError: "Upload error",
		previewFile: "Preview file",
		downloadFile: "Download file"
	},
	Empty: { description: "No data" },
	Icon: { icon: "icon" },
	Text: {
		edit: "Edit",
		copy: "Copy",
		copied: "Copied",
		expand: "Expand",
		collapse: "Collapse"
	},
	Form: {
		optional: "(optional)",
		defaultValidateMessages: {
			default: "Field validation error for ${label}",
			required: "Please enter ${label}",
			enum: "${label} must be one of [${enum}]",
			whitespace: "${label} cannot be a blank character",
			date: {
				format: "${label} date format is invalid",
				parse: "${label} cannot be converted to a date",
				invalid: "${label} is an invalid date"
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
				len: "${label} must be ${len} characters",
				min: "${label} must be at least ${min} characters",
				max: "${label} must be up to ${max} characters",
				range: "${label} must be between ${min}-${max} characters"
			},
			number: {
				len: "${label} must be equal to ${len}",
				min: "${label} must be minimum ${min}",
				max: "${label} must be maximum ${max}",
				range: "${label} must be between ${min}-${max}"
			},
			array: {
				len: "Must be ${len} ${label}",
				min: "At least ${min} ${label}",
				max: "At most ${max} ${label}",
				range: "The amount of ${label} must be between ${min}-${max}"
			},
			pattern: { mismatch: "${label} does not match the pattern ${pattern}" }
		}
	},
	Image: { preview: "Preview" },
	QRCode: {
		expired: "QR code expired",
		refresh: "Refresh",
		scanned: "Scanned"
	},
	ColorPicker: {
		presetEmpty: "Empty",
		transparent: "Transparent",
		singleColor: "Single",
		gradientColor: "Gradient"
	}
};
//#endregion
//#region node_modules/antd/es/locale/context.js
var LocaleContext = /*#__PURE__*/ (0, import_react.createContext)(void 0);
//#endregion
//#region node_modules/rc-motion/es/context.js
init_slicedToArray();
init_objectWithoutProperties();
var _excluded$1 = ["children"];
var Context = /*#__PURE__*/ import_react.createContext({});
function MotionProvider(_ref) {
	var children = _ref.children, props = _objectWithoutProperties(_ref, _excluded$1);
	return /*#__PURE__*/ import_react.createElement(Context.Provider, { value: props }, children);
}
//#endregion
//#region node_modules/rc-motion/es/DomWrapper.js
var DomWrapper = /*#__PURE__*/ function(_React$Component) {
	_inherits(DomWrapper, _React$Component);
	var _super = _createSuper(DomWrapper);
	function DomWrapper() {
		_classCallCheck(this, DomWrapper);
		return _super.apply(this, arguments);
	}
	_createClass(DomWrapper, [{
		key: "render",
		value: function render() {
			return this.props.children;
		}
	}]);
	return DomWrapper;
}(import_react.Component);
//#endregion
//#region node_modules/rc-util/es/hooks/useSyncState.js
/**
* Same as React.useState but will always get latest state.
* This is useful when React merge multiple state updates into one.
* e.g. onTransitionEnd trigger multiple event at once will be merged state update in React.
*/
function useSyncState(defaultValue) {
	var forceUpdate = _slicedToArray(import_react.useReducer(function(x) {
		return x + 1;
	}, 0), 2)[1];
	var currentValueRef = import_react.useRef(defaultValue);
	return [useEvent(function() {
		return currentValueRef.current;
	}), useEvent(function(updater) {
		currentValueRef.current = typeof updater === "function" ? updater(currentValueRef.current) : updater;
		forceUpdate();
	})];
}
//#endregion
//#region node_modules/rc-motion/es/interface.js
var STATUS_NONE = "none";
var STATUS_APPEAR = "appear";
var STATUS_ENTER = "enter";
var STATUS_LEAVE = "leave";
var STEP_NONE = "none";
var STEP_PREPARE = "prepare";
var STEP_START = "start";
var STEP_ACTIVE = "active";
/**
* Used for disabled motion case.
* Prepare stage will still work but start & active will be skipped.
*/
var STEP_PREPARED = "prepared";
//#endregion
//#region node_modules/rc-motion/es/util/motion.js
init_typeof();
function makePrefixMap(styleProp, eventName) {
	var prefixes = {};
	prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
	prefixes["Webkit".concat(styleProp)] = "webkit".concat(eventName);
	prefixes["Moz".concat(styleProp)] = "moz".concat(eventName);
	prefixes["ms".concat(styleProp)] = "MS".concat(eventName);
	prefixes["O".concat(styleProp)] = "o".concat(eventName.toLowerCase());
	return prefixes;
}
function getVendorPrefixes(domSupport, win) {
	var prefixes = {
		animationend: makePrefixMap("Animation", "AnimationEnd"),
		transitionend: makePrefixMap("Transition", "TransitionEnd")
	};
	if (domSupport) {
		if (!("AnimationEvent" in win)) delete prefixes.animationend.animation;
		if (!("TransitionEvent" in win)) delete prefixes.transitionend.transition;
	}
	return prefixes;
}
var vendorPrefixes = getVendorPrefixes(canUseDom(), typeof window !== "undefined" ? window : {});
var style = {};
if (canUseDom()) style = document.createElement("div").style;
var prefixedEventNames = {};
function getVendorPrefixedEventName(eventName) {
	if (prefixedEventNames[eventName]) return prefixedEventNames[eventName];
	var prefixMap = vendorPrefixes[eventName];
	if (prefixMap) {
		var stylePropList = Object.keys(prefixMap);
		var len = stylePropList.length;
		for (var i = 0; i < len; i += 1) {
			var styleProp = stylePropList[i];
			if (Object.prototype.hasOwnProperty.call(prefixMap, styleProp) && styleProp in style) {
				prefixedEventNames[eventName] = prefixMap[styleProp];
				return prefixedEventNames[eventName];
			}
		}
	}
	return "";
}
var internalAnimationEndName = getVendorPrefixedEventName("animationend");
var internalTransitionEndName = getVendorPrefixedEventName("transitionend");
var supportTransition = !!(internalAnimationEndName && internalTransitionEndName);
var animationEndName = internalAnimationEndName || "animationend";
var transitionEndName = internalTransitionEndName || "transitionend";
function getTransitionName(transitionName, transitionType) {
	if (!transitionName) return null;
	if (_typeof(transitionName) === "object") return transitionName[transitionType.replace(/-\w/g, function(match) {
		return match[1].toUpperCase();
	})];
	return "".concat(transitionName, "-").concat(transitionType);
}
//#endregion
//#region node_modules/rc-motion/es/hooks/useDomMotionEvents.js
var useDomMotionEvents_default = (function(onInternalMotionEnd) {
	var cacheElementRef = (0, import_react.useRef)();
	function removeMotionEvents(element) {
		if (element) {
			element.removeEventListener(transitionEndName, onInternalMotionEnd);
			element.removeEventListener(animationEndName, onInternalMotionEnd);
		}
	}
	function patchMotionEvents(element) {
		if (cacheElementRef.current && cacheElementRef.current !== element) removeMotionEvents(cacheElementRef.current);
		if (element && element !== cacheElementRef.current) {
			element.addEventListener(transitionEndName, onInternalMotionEnd);
			element.addEventListener(animationEndName, onInternalMotionEnd);
			cacheElementRef.current = element;
		}
	}
	import_react.useEffect(function() {
		return function() {
			removeMotionEvents(cacheElementRef.current);
		};
	}, []);
	return [patchMotionEvents, removeMotionEvents];
});
//#endregion
//#region node_modules/rc-motion/es/hooks/useIsomorphicLayoutEffect.js
var useIsomorphicLayoutEffect = canUseDom() ? import_react.useLayoutEffect : import_react.useEffect;
//#endregion
//#region node_modules/rc-motion/es/hooks/useNextFrame.js
var useNextFrame_default = (function() {
	var nextFrameRef = import_react.useRef(null);
	function cancelNextFrame() {
		wrapperRaf.cancel(nextFrameRef.current);
	}
	function nextFrame(callback) {
		var delay = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 2;
		cancelNextFrame();
		var nextFrameId = wrapperRaf(function() {
			if (delay <= 1) callback({ isCanceled: function isCanceled() {
				return nextFrameId !== nextFrameRef.current;
			} });
			else nextFrame(callback, delay - 1);
		});
		nextFrameRef.current = nextFrameId;
	}
	import_react.useEffect(function() {
		return function() {
			cancelNextFrame();
		};
	}, []);
	return [nextFrame, cancelNextFrame];
});
//#endregion
//#region node_modules/rc-motion/es/hooks/useStepQueue.js
init_slicedToArray();
var FULL_STEP_QUEUE = [
	STEP_PREPARE,
	STEP_START,
	STEP_ACTIVE,
	"end"
];
var SIMPLE_STEP_QUEUE = [STEP_PREPARE, STEP_PREPARED];
function isActive(step) {
	return step === "active" || step === "end";
}
var useStepQueue_default = (function(status, prepareOnly, callback) {
	var _useState2 = _slicedToArray(useSafeState(STEP_NONE), 2), step = _useState2[0], setStep = _useState2[1];
	var _useNextFrame2 = _slicedToArray(useNextFrame_default(), 2), nextFrame = _useNextFrame2[0], cancelNextFrame = _useNextFrame2[1];
	function startQueue() {
		setStep(STEP_PREPARE, true);
	}
	var STEP_QUEUE = prepareOnly ? SIMPLE_STEP_QUEUE : FULL_STEP_QUEUE;
	useIsomorphicLayoutEffect(function() {
		if (step !== "none" && step !== "end") {
			var nextStep = STEP_QUEUE[STEP_QUEUE.indexOf(step) + 1];
			var result = callback(step);
			if (result === false) setStep(nextStep, true);
			else if (nextStep) nextFrame(function(info) {
				function doNext() {
					if (info.isCanceled()) return;
					setStep(nextStep, true);
				}
				if (result === true) doNext();
				else Promise.resolve(result).then(doNext);
			});
		}
	}, [status, step]);
	import_react.useEffect(function() {
		return function() {
			cancelNextFrame();
		};
	}, []);
	return [startQueue, step];
});
//#endregion
//#region node_modules/rc-motion/es/hooks/useStatus.js
init_slicedToArray();
function useStatus(supportMotion, visible, getElement, _ref) {
	var _ref$motionEnter = _ref.motionEnter, motionEnter = _ref$motionEnter === void 0 ? true : _ref$motionEnter, _ref$motionAppear = _ref.motionAppear, motionAppear = _ref$motionAppear === void 0 ? true : _ref$motionAppear, _ref$motionLeave = _ref.motionLeave, motionLeave = _ref$motionLeave === void 0 ? true : _ref$motionLeave, motionDeadline = _ref.motionDeadline, motionLeaveImmediately = _ref.motionLeaveImmediately, onAppearPrepare = _ref.onAppearPrepare, onEnterPrepare = _ref.onEnterPrepare, onLeavePrepare = _ref.onLeavePrepare, onAppearStart = _ref.onAppearStart, onEnterStart = _ref.onEnterStart, onLeaveStart = _ref.onLeaveStart, onAppearActive = _ref.onAppearActive, onEnterActive = _ref.onEnterActive, onLeaveActive = _ref.onLeaveActive, onAppearEnd = _ref.onAppearEnd, onEnterEnd = _ref.onEnterEnd, onLeaveEnd = _ref.onLeaveEnd, onVisibleChanged = _ref.onVisibleChanged;
	var _useState2 = _slicedToArray(useSafeState(), 2), asyncVisible = _useState2[0], setAsyncVisible = _useState2[1];
	var _useSyncState2 = _slicedToArray(useSyncState(STATUS_NONE), 2), getStatus = _useSyncState2[0], setStatus = _useSyncState2[1];
	var _useState4 = _slicedToArray(useSafeState(null), 2), style = _useState4[0], setStyle = _useState4[1];
	var currentStatus = getStatus();
	var mountedRef = (0, import_react.useRef)(false);
	var deadlineRef = (0, import_react.useRef)(null);
	function getDomElement() {
		return getElement();
	}
	var activeRef = (0, import_react.useRef)(false);
	/**
	* Clean up status & style
	*/
	function updateMotionEndStatus() {
		setStatus(STATUS_NONE);
		setStyle(null, true);
	}
	var onInternalMotionEnd = useEvent(function(event) {
		var status = getStatus();
		if (status === "none") return;
		var element = getDomElement();
		if (event && !event.deadline && event.target !== element) return;
		var currentActive = activeRef.current;
		var canEnd;
		if (status === "appear" && currentActive) canEnd = onAppearEnd === null || onAppearEnd === void 0 ? void 0 : onAppearEnd(element, event);
		else if (status === "enter" && currentActive) canEnd = onEnterEnd === null || onEnterEnd === void 0 ? void 0 : onEnterEnd(element, event);
		else if (status === "leave" && currentActive) canEnd = onLeaveEnd === null || onLeaveEnd === void 0 ? void 0 : onLeaveEnd(element, event);
		if (currentActive && canEnd !== false) updateMotionEndStatus();
	});
	var patchMotionEvents = _slicedToArray(useDomMotionEvents_default(onInternalMotionEnd), 1)[0];
	var getEventHandlers = function getEventHandlers(targetStatus) {
		switch (targetStatus) {
			case STATUS_APPEAR: return _defineProperty(_defineProperty(_defineProperty({}, STEP_PREPARE, onAppearPrepare), STEP_START, onAppearStart), STEP_ACTIVE, onAppearActive);
			case STATUS_ENTER: return _defineProperty(_defineProperty(_defineProperty({}, STEP_PREPARE, onEnterPrepare), STEP_START, onEnterStart), STEP_ACTIVE, onEnterActive);
			case STATUS_LEAVE: return _defineProperty(_defineProperty(_defineProperty({}, STEP_PREPARE, onLeavePrepare), STEP_START, onLeaveStart), STEP_ACTIVE, onLeaveActive);
			default: return {};
		}
	};
	var eventHandlers = import_react.useMemo(function() {
		return getEventHandlers(currentStatus);
	}, [currentStatus]);
	var _useStepQueue2 = _slicedToArray(useStepQueue_default(currentStatus, !supportMotion, function(newStep) {
		if (newStep === "prepare") {
			var onPrepare = eventHandlers[STEP_PREPARE];
			if (!onPrepare) return false;
			return onPrepare(getDomElement());
		}
		if (step in eventHandlers) {
			var _eventHandlers$step;
			setStyle(((_eventHandlers$step = eventHandlers[step]) === null || _eventHandlers$step === void 0 ? void 0 : _eventHandlers$step.call(eventHandlers, getDomElement(), null)) || null);
		}
		if (step === "active" && currentStatus !== "none") {
			patchMotionEvents(getDomElement());
			if (motionDeadline > 0) {
				clearTimeout(deadlineRef.current);
				deadlineRef.current = setTimeout(function() {
					onInternalMotionEnd({ deadline: true });
				}, motionDeadline);
			}
		}
		if (step === "prepared") updateMotionEndStatus();
		return true;
	}), 2), startStep = _useStepQueue2[0], step = _useStepQueue2[1];
	activeRef.current = isActive(step);
	var visibleRef = (0, import_react.useRef)(null);
	useIsomorphicLayoutEffect(function() {
		if (mountedRef.current && visibleRef.current === visible) return;
		setAsyncVisible(visible);
		var isMounted = mountedRef.current;
		mountedRef.current = true;
		var nextStatus;
		if (!isMounted && visible && motionAppear) nextStatus = STATUS_APPEAR;
		if (isMounted && visible && motionEnter) nextStatus = STATUS_ENTER;
		if (isMounted && !visible && motionLeave || !isMounted && motionLeaveImmediately && !visible && motionLeave) nextStatus = STATUS_LEAVE;
		var nextEventHandlers = getEventHandlers(nextStatus);
		if (nextStatus && (supportMotion || nextEventHandlers["prepare"])) {
			setStatus(nextStatus);
			startStep();
		} else setStatus(STATUS_NONE);
		visibleRef.current = visible;
	}, [visible]);
	(0, import_react.useEffect)(function() {
		if (currentStatus === "appear" && !motionAppear || currentStatus === "enter" && !motionEnter || currentStatus === "leave" && !motionLeave) setStatus(STATUS_NONE);
	}, [
		motionAppear,
		motionEnter,
		motionLeave
	]);
	(0, import_react.useEffect)(function() {
		return function() {
			mountedRef.current = false;
			clearTimeout(deadlineRef.current);
		};
	}, []);
	var firstMountChangeRef = import_react.useRef(false);
	(0, import_react.useEffect)(function() {
		if (asyncVisible) firstMountChangeRef.current = true;
		if (asyncVisible !== void 0 && currentStatus === "none") {
			if (firstMountChangeRef.current || asyncVisible) onVisibleChanged === null || onVisibleChanged === void 0 || onVisibleChanged(asyncVisible);
			firstMountChangeRef.current = true;
		}
	}, [asyncVisible, currentStatus]);
	var mergedStyle = style;
	if (eventHandlers["prepare"] && step === "start") mergedStyle = _objectSpread2({ transition: "none" }, mergedStyle);
	return [
		currentStatus,
		step,
		mergedStyle,
		asyncVisible !== null && asyncVisible !== void 0 ? asyncVisible : visible
	];
}
//#endregion
//#region node_modules/rc-motion/es/CSSMotion.js
init_defineProperty();
init_slicedToArray();
init_typeof();
/**
* `transitionSupport` is used for none transition test case.
* Default we use browser transition event support check.
*/
function genCSSMotion(config) {
	var transitionSupport = config;
	if (_typeof(config) === "object") transitionSupport = config.transitionSupport;
	function isSupportTransition(props, contextMotion) {
		return !!(props.motionName && transitionSupport && contextMotion !== false);
	}
	var CSSMotion = /*#__PURE__*/ import_react.forwardRef(function(props, ref) {
		var _props$visible = props.visible, visible = _props$visible === void 0 ? true : _props$visible, _props$removeOnLeave = props.removeOnLeave, removeOnLeave = _props$removeOnLeave === void 0 ? true : _props$removeOnLeave, forceRender = props.forceRender, children = props.children, motionName = props.motionName, leavedClassName = props.leavedClassName, eventProps = props.eventProps;
		var contextMotion = import_react.useContext(Context).motion;
		var supportMotion = isSupportTransition(props, contextMotion);
		var nodeRef = (0, import_react.useRef)();
		var wrapperNodeRef = (0, import_react.useRef)();
		function getDomElement() {
			try {
				return nodeRef.current instanceof HTMLElement ? nodeRef.current : findDOMNode(wrapperNodeRef.current);
			} catch (e) {
				return null;
			}
		}
		var _useStatus2 = _slicedToArray(useStatus(supportMotion, visible, getDomElement, props), 4), status = _useStatus2[0], statusStep = _useStatus2[1], statusStyle = _useStatus2[2], mergedVisible = _useStatus2[3];
		var renderedRef = import_react.useRef(mergedVisible);
		if (mergedVisible) renderedRef.current = true;
		var setNodeRef = import_react.useCallback(function(node) {
			nodeRef.current = node;
			fillRef(ref, node);
		}, [ref]);
		var motionChildren;
		var mergedProps = _objectSpread2(_objectSpread2({}, eventProps), {}, { visible });
		if (!children) motionChildren = null;
		else if (status === "none") if (mergedVisible) motionChildren = children(_objectSpread2({}, mergedProps), setNodeRef);
		else if (!removeOnLeave && renderedRef.current && leavedClassName) motionChildren = children(_objectSpread2(_objectSpread2({}, mergedProps), {}, { className: leavedClassName }), setNodeRef);
		else if (forceRender || !removeOnLeave && !leavedClassName) motionChildren = children(_objectSpread2(_objectSpread2({}, mergedProps), {}, { style: { display: "none" } }), setNodeRef);
		else motionChildren = null;
		else {
			var statusSuffix;
			if (statusStep === "prepare") statusSuffix = "prepare";
			else if (isActive(statusStep)) statusSuffix = "active";
			else if (statusStep === "start") statusSuffix = "start";
			var motionCls = getTransitionName(motionName, "".concat(status, "-").concat(statusSuffix));
			motionChildren = children(_objectSpread2(_objectSpread2({}, mergedProps), {}, {
				className: (0, import_classnames.default)(getTransitionName(motionName, status), _defineProperty(_defineProperty({}, motionCls, motionCls && statusSuffix), motionName, typeof motionName === "string")),
				style: statusStyle
			}), setNodeRef);
		}
		if (/*#__PURE__*/ import_react.isValidElement(motionChildren) && supportRef(motionChildren)) {
			if (!getNodeRef(motionChildren)) motionChildren = /*#__PURE__*/ import_react.cloneElement(motionChildren, { ref: setNodeRef });
		}
		return /*#__PURE__*/ import_react.createElement(DomWrapper, { ref: wrapperNodeRef }, motionChildren);
	});
	CSSMotion.displayName = "CSSMotion";
	return CSSMotion;
}
var CSSMotion_default = genCSSMotion(supportTransition);
//#endregion
//#region node_modules/rc-motion/es/util/diff.js
init_extends();
init_assertThisInitialized();
init_typeof();
var STATUS_KEEP = "keep";
var STATUS_REMOVE = "remove";
var STATUS_REMOVED = "removed";
function wrapKeyToObject(key) {
	var keyObj;
	if (key && _typeof(key) === "object" && "key" in key) keyObj = key;
	else keyObj = { key };
	return _objectSpread2(_objectSpread2({}, keyObj), {}, { key: String(keyObj.key) });
}
function parseKeys() {
	return (arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : []).map(wrapKeyToObject);
}
function diffKeys() {
	var prevKeys = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
	var currentKeys = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
	var list = [];
	var currentIndex = 0;
	var currentLen = currentKeys.length;
	var prevKeyObjects = parseKeys(prevKeys);
	var currentKeyObjects = parseKeys(currentKeys);
	prevKeyObjects.forEach(function(keyObj) {
		var hit = false;
		for (var i = currentIndex; i < currentLen; i += 1) {
			var currentKeyObj = currentKeyObjects[i];
			if (currentKeyObj.key === keyObj.key) {
				if (currentIndex < i) {
					list = list.concat(currentKeyObjects.slice(currentIndex, i).map(function(obj) {
						return _objectSpread2(_objectSpread2({}, obj), {}, { status: "add" });
					}));
					currentIndex = i;
				}
				list.push(_objectSpread2(_objectSpread2({}, currentKeyObj), {}, { status: STATUS_KEEP }));
				currentIndex += 1;
				hit = true;
				break;
			}
		}
		if (!hit) list.push(_objectSpread2(_objectSpread2({}, keyObj), {}, { status: STATUS_REMOVE }));
	});
	if (currentIndex < currentLen) list = list.concat(currentKeyObjects.slice(currentIndex).map(function(obj) {
		return _objectSpread2(_objectSpread2({}, obj), {}, { status: "add" });
	}));
	/**
	* Merge same key when it remove and add again:
	*    [1 - add, 2 - keep, 1 - remove] -> [1 - keep, 2 - keep]
	*/
	var keys = {};
	list.forEach(function(_ref) {
		var key = _ref.key;
		keys[key] = (keys[key] || 0) + 1;
	});
	Object.keys(keys).filter(function(key) {
		return keys[key] > 1;
	}).forEach(function(matchKey) {
		list = list.filter(function(_ref2) {
			var key = _ref2.key, status = _ref2.status;
			return key !== matchKey || status !== "remove";
		});
		list.forEach(function(node) {
			if (node.key === matchKey) node.status = STATUS_KEEP;
		});
	});
	return list;
}
//#endregion
//#region node_modules/rc-motion/es/CSSMotionList.js
init_objectWithoutProperties();
init_classCallCheck();
init_createClass();
init_defineProperty();
var _excluded = [
	"component",
	"children",
	"onVisibleChanged",
	"onAllRemoved"
];
var _excluded2 = ["status"];
var MOTION_PROP_NAMES = [
	"eventProps",
	"visible",
	"children",
	"motionName",
	"motionAppear",
	"motionEnter",
	"motionLeave",
	"motionLeaveImmediately",
	"motionDeadline",
	"removeOnLeave",
	"leavedClassName",
	"onAppearPrepare",
	"onAppearStart",
	"onAppearActive",
	"onAppearEnd",
	"onEnterStart",
	"onEnterActive",
	"onEnterEnd",
	"onLeaveStart",
	"onLeaveActive",
	"onLeaveEnd"
];
/**
* Generate a CSSMotionList component with config
* @param transitionSupport No need since CSSMotionList no longer depends on transition support
* @param CSSMotion CSSMotion component
*/
function genCSSMotionList(transitionSupport) {
	var CSSMotion = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : CSSMotion_default;
	var CSSMotionList = /*#__PURE__*/ function(_React$Component) {
		_inherits(CSSMotionList, _React$Component);
		var _super = _createSuper(CSSMotionList);
		function CSSMotionList() {
			var _this;
			_classCallCheck(this, CSSMotionList);
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			_this = _super.call.apply(_super, [this].concat(args));
			_defineProperty(_assertThisInitialized(_this), "state", { keyEntities: [] });
			_defineProperty(_assertThisInitialized(_this), "removeKey", function(removeKey) {
				_this.setState(function(prevState) {
					return { keyEntities: prevState.keyEntities.map(function(entity) {
						if (entity.key !== removeKey) return entity;
						return _objectSpread2(_objectSpread2({}, entity), {}, { status: STATUS_REMOVED });
					}) };
				}, function() {
					if (_this.state.keyEntities.filter(function(_ref) {
						return _ref.status !== "removed";
					}).length === 0 && _this.props.onAllRemoved) _this.props.onAllRemoved();
				});
			});
			return _this;
		}
		_createClass(CSSMotionList, [{
			key: "render",
			value: function render() {
				var _this2 = this;
				var keyEntities = this.state.keyEntities, _this$props = this.props, component = _this$props.component, children = _this$props.children, _onVisibleChanged = _this$props.onVisibleChanged;
				_this$props.onAllRemoved;
				var restProps = _objectWithoutProperties(_this$props, _excluded);
				var Component = component || import_react.Fragment;
				var motionProps = {};
				MOTION_PROP_NAMES.forEach(function(prop) {
					motionProps[prop] = restProps[prop];
					delete restProps[prop];
				});
				delete restProps.keys;
				return /*#__PURE__*/ import_react.createElement(Component, restProps, keyEntities.map(function(_ref2, index) {
					var status = _ref2.status, eventProps = _objectWithoutProperties(_ref2, _excluded2);
					var visible = status === "add" || status === "keep";
					return /*#__PURE__*/ import_react.createElement(CSSMotion, _extends({}, motionProps, {
						key: eventProps.key,
						visible,
						eventProps,
						onVisibleChanged: function onVisibleChanged(changedVisible) {
							_onVisibleChanged === null || _onVisibleChanged === void 0 || _onVisibleChanged(changedVisible, { key: eventProps.key });
							if (!changedVisible) _this2.removeKey(eventProps.key);
						}
					}), function(props, ref) {
						return children(_objectSpread2(_objectSpread2({}, props), {}, { index }), ref);
					});
				}));
			}
		}], [{
			key: "getDerivedStateFromProps",
			value: function getDerivedStateFromProps(_ref3, _ref4) {
				var keys = _ref3.keys;
				var keyEntities = _ref4.keyEntities;
				return { keyEntities: diffKeys(keyEntities, parseKeys(keys)).filter(function(entity) {
					var prevEntity = keyEntities.find(function(_ref5) {
						var key = _ref5.key;
						return entity.key === key;
					});
					if (prevEntity && prevEntity.status === "removed" && entity.status === "remove") return false;
					return true;
				}) };
			}
		}]);
		return CSSMotionList;
	}(import_react.Component);
	_defineProperty(CSSMotionList, "defaultProps", { component: "div" });
	return CSSMotionList;
}
genCSSMotionList(supportTransition);
//#endregion
//#region node_modules/rc-motion/es/index.js
var es_default = CSSMotion_default;
//#endregion
export { WarningContext as a, merge as c, _toArray as d, IconContext as f, isDOM as h, localeValues as i, set as l, findDOMNode as m, MotionProvider as n, devUseWarning as o, wrapperRaf as p, LocaleContext as r, warning as s, es_default as t, get as u };
