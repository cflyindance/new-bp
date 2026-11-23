import { d as __toESM, i as require_react, n as require_jsx_runtime, r as require_react_dom } from "./toast-C8a1ReSo.js";
import { G as require_dayjs_min, a as getDeviceOrientation } from "./utils-Cdx9DbDR.js";
import { l as _extends, r as connect, u as init_extends } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { Et as setCateyPageDomTop, S as clearTogoOption, Sn as setorderPageDomTop, d as changeOrderType, dt as resetCurrentOrder, f as changePickupTime, m as clearCurrentCategory, rn as setSelectedBrand, sn as setShowBanner } from "./actions-BwRPwnFF.js";
import { x as getRestaurantHour } from "./kioskConfigApi-68IKDHob.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { S as init_typeof, _ as _createClass, b as init_defineProperty, i as init_slicedToArray, l as _toConsumableArray, n as init_objectWithoutProperties, r as _slicedToArray, t as _objectWithoutProperties, u as init_toConsumableArray, v as init_createClass, x as _typeof, y as _defineProperty } from "./objectWithoutProperties-DDcNLcsK.js";
import { $ as warningOnce, A as unit, C as FastColor, G as fillRef, H as _classCallCheck, J as useComposeRef, K as getNodeRef, L as canUseDom, O as useLayoutEffect$1, Q as warning, R as _createSuper, U as init_classCallCheck, V as _inherits, W as composeRef, X as _objectSpread2, Y as useMemo$2, Z as noteOnce, _ as useComponentConfig, c as textEllipsis, d as useMergedState, h as Variants, m as ConfigContext, o as resetComponent, p as useEvent, q as supportRef, s as resetIcon, u as useToken } from "./style-DWrLyeCr.js";
import { i as omit, r as VariantContext, s as toArray$2, t as FormItemInputContext } from "./context-LOicZ8vw.js";
import { d as _toArray, h as isDOM, m as findDOMNode, o as devUseWarning, p as wrapperRaf, t as es_default$4 } from "./es-CH_mXwwY.js";
import { t as index } from "./ResizeObserver.es-BEMNHY3K.js";
import { a as useZIndex, c as pickAttrs, d as Keyframe, i as getTransitionName, l as RefIcon$5, n as es_default$5, r as useCompactItemContext, s as KeyCode, t as ContextIsolator, u as useLocale } from "./ContextIsolator-Dvyg17xX.js";
import { n as SizeContext, r as DisabledContext, t as ConfigProvider } from "./config-provider-20CUitiF.js";
import { n as genStyleHooks, r as merge } from "./genStyleUtils-Bvib8P-r.js";
import { n as getShadowRoot, t as Icon } from "./AntdIcon-bxYy9EiO.js";
import { n as useCSSVarCls, t as isVisible_default } from "./isVisible-BkT4ROa_.js";
import { t as getBsTime } from "./getBsTime-BcqvbwVB.js";
import { t as close_default } from "./close-F8X4N7jn.js";
//#region node_modules/rc-resize-observer/es/Collection.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var CollectionContext = /*#__PURE__*/ import_react.createContext(null);
/**
* Collect all the resize event from children ResizeObserver
*/
function Collection(_ref) {
	var children = _ref.children, onBatchResize = _ref.onBatchResize;
	var resizeIdRef = import_react.useRef(0);
	var resizeInfosRef = import_react.useRef([]);
	var onCollectionResize = import_react.useContext(CollectionContext);
	var onResize = import_react.useCallback(function(size, element, data) {
		resizeIdRef.current += 1;
		var currentId = resizeIdRef.current;
		resizeInfosRef.current.push({
			size,
			element,
			data
		});
		Promise.resolve().then(function() {
			if (currentId === resizeIdRef.current) {
				onBatchResize === null || onBatchResize === void 0 || onBatchResize(resizeInfosRef.current);
				resizeInfosRef.current = [];
			}
		});
		onCollectionResize === null || onCollectionResize === void 0 || onCollectionResize(size, element, data);
	}, [onBatchResize, onCollectionResize]);
	return /*#__PURE__*/ import_react.createElement(CollectionContext.Provider, { value: onResize }, children);
}
//#endregion
//#region node_modules/rc-resize-observer/es/utils/observerUtil.js
var elementListeners = /* @__PURE__ */ new Map();
function onResize(entities) {
	entities.forEach(function(entity) {
		var _elementListeners$get;
		var target = entity.target;
		(_elementListeners$get = elementListeners.get(target)) === null || _elementListeners$get === void 0 || _elementListeners$get.forEach(function(listener) {
			return listener(target);
		});
	});
}
var resizeObserver = new index(onResize);
function observe(element, callback) {
	if (!elementListeners.has(element)) {
		elementListeners.set(element, /* @__PURE__ */ new Set());
		resizeObserver.observe(element);
	}
	elementListeners.get(element).add(callback);
}
function unobserve(element, callback) {
	if (elementListeners.has(element)) {
		elementListeners.get(element).delete(callback);
		if (!elementListeners.get(element).size) {
			resizeObserver.unobserve(element);
			elementListeners.delete(element);
		}
	}
}
//#endregion
//#region node_modules/rc-resize-observer/es/SingleObserver/DomWrapper.js
init_classCallCheck();
init_createClass();
/**
* Fallback to findDOMNode if origin ref do not provide any dom element
*/
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
//#region node_modules/rc-resize-observer/es/SingleObserver/index.js
init_typeof();
function SingleObserver(props, ref) {
	var children = props.children, disabled = props.disabled;
	var elementRef = import_react.useRef(null);
	var wrapperRef = import_react.useRef(null);
	var onCollectionResize = import_react.useContext(CollectionContext);
	var isRenderProps = typeof children === "function";
	var mergedChildren = isRenderProps ? children(elementRef) : children;
	var sizeRef = import_react.useRef({
		width: -1,
		height: -1,
		offsetWidth: -1,
		offsetHeight: -1
	});
	var canRef = !isRenderProps && /*#__PURE__*/ import_react.isValidElement(mergedChildren) && supportRef(mergedChildren);
	var mergedRef = useComposeRef(canRef ? getNodeRef(mergedChildren) : null, elementRef);
	var getDom = function getDom() {
		var _elementRef$current;
		return findDOMNode(elementRef.current) || (elementRef.current && _typeof(elementRef.current) === "object" ? findDOMNode((_elementRef$current = elementRef.current) === null || _elementRef$current === void 0 ? void 0 : _elementRef$current.nativeElement) : null) || findDOMNode(wrapperRef.current);
	};
	import_react.useImperativeHandle(ref, function() {
		return getDom();
	});
	var propsRef = import_react.useRef(props);
	propsRef.current = props;
	var onInternalResize = import_react.useCallback(function(target) {
		var _propsRef$current = propsRef.current, onResize = _propsRef$current.onResize, data = _propsRef$current.data;
		var _target$getBoundingCl = target.getBoundingClientRect(), width = _target$getBoundingCl.width, height = _target$getBoundingCl.height;
		var offsetWidth = target.offsetWidth, offsetHeight = target.offsetHeight;
		/**
		* Resize observer trigger when content size changed.
		* In most case we just care about element size,
		* let's use `boundary` instead of `contentRect` here to avoid shaking.
		*/
		var fixedWidth = Math.floor(width);
		var fixedHeight = Math.floor(height);
		if (sizeRef.current.width !== fixedWidth || sizeRef.current.height !== fixedHeight || sizeRef.current.offsetWidth !== offsetWidth || sizeRef.current.offsetHeight !== offsetHeight) {
			var size = {
				width: fixedWidth,
				height: fixedHeight,
				offsetWidth,
				offsetHeight
			};
			sizeRef.current = size;
			var mergedOffsetWidth = offsetWidth === Math.round(width) ? width : offsetWidth;
			var mergedOffsetHeight = offsetHeight === Math.round(height) ? height : offsetHeight;
			var sizeInfo = _objectSpread2(_objectSpread2({}, size), {}, {
				offsetWidth: mergedOffsetWidth,
				offsetHeight: mergedOffsetHeight
			});
			onCollectionResize === null || onCollectionResize === void 0 || onCollectionResize(sizeInfo, target, data);
			if (onResize) Promise.resolve().then(function() {
				onResize(sizeInfo, target);
			});
		}
	}, []);
	import_react.useEffect(function() {
		var currentElement = getDom();
		if (currentElement && !disabled) observe(currentElement, onInternalResize);
		return function() {
			return unobserve(currentElement, onInternalResize);
		};
	}, [elementRef.current, disabled]);
	return /*#__PURE__*/ import_react.createElement(DomWrapper, { ref: wrapperRef }, canRef ? /*#__PURE__*/ import_react.cloneElement(mergedChildren, { ref: mergedRef }) : mergedChildren);
}
var RefSingleObserver = /*#__PURE__*/ import_react.forwardRef(SingleObserver);
RefSingleObserver.displayName = "SingleObserver";
//#endregion
//#region node_modules/rc-resize-observer/es/index.js
init_extends();
var INTERNAL_PREFIX_KEY = "rc-observer-key";
function ResizeObserver$1(props, ref) {
	var children = props.children;
	var childNodes = typeof children === "function" ? [children] : toArray$2(children);
	if (childNodes.length > 1) warning(false, "Find more than one child node with `children` in ResizeObserver. Please use ResizeObserver.Collection instead.");
	else if (childNodes.length === 0) warning(false, "`children` of ResizeObserver is empty. Nothing is in observe.");
	return childNodes.map(function(child, index) {
		var key = (child === null || child === void 0 ? void 0 : child.key) || "".concat(INTERNAL_PREFIX_KEY, "-").concat(index);
		return /*#__PURE__*/ import_react.createElement(RefSingleObserver, _extends({}, props, {
			key,
			ref: index === 0 ? ref : void 0
		}), child);
	});
}
var RefResizeObserver = /*#__PURE__*/ import_react.forwardRef(ResizeObserver$1);
RefResizeObserver.displayName = "ResizeObserver";
RefResizeObserver.Collection = Collection;
//#endregion
//#region node_modules/@ant-design/icons-svg/es/asn/CloseCircleFilled.js
var CloseCircleFilled = {
	"icon": {
		"tag": "svg",
		"attrs": {
			"fill-rule": "evenodd",
			"viewBox": "64 64 896 896",
			"focusable": "false"
		},
		"children": [{
			"tag": "path",
			"attrs": { "d": "M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64zm127.98 274.82h-.04l-.08.06L512 466.75 384.14 338.88c-.04-.05-.06-.06-.08-.06a.12.12 0 00-.07 0c-.03 0-.05.01-.09.05l-45.02 45.02a.2.2 0 00-.05.09.12.12 0 000 .07v.02a.27.27 0 00.06.06L466.75 512 338.88 639.86c-.05.04-.06.06-.06.08a.12.12 0 000 .07c0 .03.01.05.05.09l45.02 45.02a.2.2 0 00.09.05.12.12 0 00.07 0c.02 0 .04-.01.08-.05L512 557.25l127.86 127.87c.04.04.06.05.08.05a.12.12 0 00.07 0c.03 0 .05-.01.09-.05l45.02-45.02a.2.2 0 00.05-.09.12.12 0 000-.07v-.02a.27.27 0 00-.05-.06L557.25 512l127.87-127.86c.04-.04.05-.06.05-.08a.12.12 0 000-.07c0-.03-.01-.05-.05-.09l-45.02-45.02a.2.2 0 00-.09-.05.12.12 0 00-.07 0z" }
		}]
	},
	"name": "close-circle",
	"theme": "filled"
};
//#endregion
//#region node_modules/@ant-design/icons/es/icons/CloseCircleFilled.js
init_extends();
/**![close-circle](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjYWNhY2EiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdmlld0JveD0iNjQgNjQgODk2IDg5NiIgZm9jdXNhYmxlPSJmYWxzZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTEyIDY0YzI0Ny40IDAgNDQ4IDIwMC42IDQ0OCA0NDhTNzU5LjQgOTYwIDUxMiA5NjAgNjQgNzU5LjQgNjQgNTEyIDI2NC42IDY0IDUxMiA2NHptMTI3Ljk4IDI3NC44MmgtLjA0bC0uMDguMDZMNTEyIDQ2Ni43NSAzODQuMTQgMzM4Ljg4Yy0uMDQtLjA1LS4wNi0uMDYtLjA4LS4wNmEuMTIuMTIgMCAwMC0uMDcgMGMtLjAzIDAtLjA1LjAxLS4wOS4wNWwtNDUuMDIgNDUuMDJhLjIuMiAwIDAwLS4wNS4wOS4xMi4xMiAwIDAwMCAuMDd2LjAyYS4yNy4yNyAwIDAwLjA2LjA2TDQ2Ni43NSA1MTIgMzM4Ljg4IDYzOS44NmMtLjA1LjA0LS4wNi4wNi0uMDYuMDhhLjEyLjEyIDAgMDAwIC4wN2MwIC4wMy4wMS4wNS4wNS4wOWw0NS4wMiA0NS4wMmEuMi4yIDAgMDAuMDkuMDUuMTIuMTIgMCAwMC4wNyAwYy4wMiAwIC4wNC0uMDEuMDgtLjA1TDUxMiA1NTcuMjVsMTI3Ljg2IDEyNy44N2MuMDQuMDQuMDYuMDUuMDguMDVhLjEyLjEyIDAgMDAuMDcgMGMuMDMgMCAuMDUtLjAxLjA5LS4wNWw0NS4wMi00NS4wMmEuMi4yIDAgMDAuMDUtLjA5LjEyLjEyIDAgMDAwLS4wN3YtLjAyYS4yNy4yNyAwIDAwLS4wNS0uMDZMNTU3LjI1IDUxMmwxMjcuODctMTI3Ljg2Yy4wNC0uMDQuMDUtLjA2LjA1LS4wOGEuMTIuMTIgMCAwMDAtLjA3YzAtLjAzLS4wMS0uMDUtLjA1LS4wOWwtNDUuMDItNDUuMDJhLjIuMiAwIDAwLS4wOS0uMDUuMTIuMTIgMCAwMC0uMDcgMHoiIC8+PC9zdmc+) */
var RefIcon$4 = /*#__PURE__*/ import_react.forwardRef(function CloseCircleFilled$1(props, ref) {
	return /*#__PURE__*/ import_react.createElement(Icon, _extends({}, props, {
		ref,
		icon: CloseCircleFilled
	}));
});
RefIcon$4.displayName = "CloseCircleFilled";
//#endregion
//#region node_modules/@ant-design/icons-svg/es/asn/LoadingOutlined.js
var LoadingOutlined = {
	"icon": {
		"tag": "svg",
		"attrs": {
			"viewBox": "0 0 1024 1024",
			"focusable": "false"
		},
		"children": [{
			"tag": "path",
			"attrs": { "d": "M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z" }
		}]
	},
	"name": "loading",
	"theme": "outlined"
};
//#endregion
//#region node_modules/@ant-design/icons/es/icons/LoadingOutlined.js
init_extends();
/**![loading](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjYWNhY2EiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIGZvY3VzYWJsZT0iZmFsc2UiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTk4OCA1NDhjLTE5LjkgMC0zNi0xNi4xLTM2LTM2IDAtNTkuNC0xMS42LTExNy0zNC42LTE3MS4zYTQ0MC40NSA0NDAuNDUgMCAwMC05NC4zLTEzOS45IDQzNy43MSA0MzcuNzEgMCAwMC0xMzkuOS05NC4zQzYyOSA4My42IDU3MS40IDcyIDUxMiA3MmMtMTkuOSAwLTM2LTE2LjEtMzYtMzZzMTYuMS0zNiAzNi0zNmM2OS4xIDAgMTM2LjIgMTMuNSAxOTkuMyA0MC4zQzc3Mi4zIDY2IDgyNyAxMDMgODc0IDE1MGM0NyA0NyA4My45IDEwMS44IDEwOS43IDE2Mi43IDI2LjcgNjMuMSA0MC4yIDEzMC4yIDQwLjIgMTk5LjMuMSAxOS45LTE2IDM2LTM1LjkgMzZ6IiAvPjwvc3ZnPg==) */
var RefIcon$3 = /*#__PURE__*/ import_react.forwardRef(function LoadingOutlined$1(props, ref) {
	return /*#__PURE__*/ import_react.createElement(Icon, _extends({}, props, {
		ref,
		icon: LoadingOutlined
	}));
});
RefIcon$3.displayName = "LoadingOutlined";
//#endregion
//#region node_modules/antd/es/config-provider/hooks/useSize.js
var useSize = (customSize) => {
	const size = import_react.useContext(SizeContext);
	return import_react.useMemo(() => {
		if (!customSize) return size;
		if (typeof customSize === "string") return customSize !== null && customSize !== void 0 ? customSize : size;
		if (typeof customSize === "function") return customSize(size);
		return size;
	}, [customSize, size]);
};
//#endregion
//#region node_modules/antd/es/style/motion/motion.js
var initMotionCommon = (duration) => ({
	animationDuration: duration,
	animationFillMode: "both"
});
var initMotionCommonLeave = (duration) => ({
	animationDuration: duration,
	animationFillMode: "both"
});
var initMotion = (motionCls, inKeyframes, outKeyframes, duration, sameLevel = false) => {
	const sameLevelPrefix = sameLevel ? "&" : "";
	return {
		[`
      ${sameLevelPrefix}${motionCls}-enter,
      ${sameLevelPrefix}${motionCls}-appear
    `]: Object.assign(Object.assign({}, initMotionCommon(duration)), { animationPlayState: "paused" }),
		[`${sameLevelPrefix}${motionCls}-leave`]: Object.assign(Object.assign({}, initMotionCommonLeave(duration)), { animationPlayState: "paused" }),
		[`
      ${sameLevelPrefix}${motionCls}-enter${motionCls}-enter-active,
      ${sameLevelPrefix}${motionCls}-appear${motionCls}-appear-active
    `]: {
			animationName: inKeyframes,
			animationPlayState: "running"
		},
		[`${sameLevelPrefix}${motionCls}-leave${motionCls}-leave-active`]: {
			animationName: outKeyframes,
			animationPlayState: "running",
			pointerEvents: "none"
		}
	};
};
//#endregion
//#region node_modules/antd/es/style/motion/move.js
var moveDownIn = new Keyframe("antMoveDownIn", {
	"0%": {
		transform: "translate3d(0, 100%, 0)",
		transformOrigin: "0 0",
		opacity: 0
	},
	"100%": {
		transform: "translate3d(0, 0, 0)",
		transformOrigin: "0 0",
		opacity: 1
	}
});
var moveDownOut = new Keyframe("antMoveDownOut", {
	"0%": {
		transform: "translate3d(0, 0, 0)",
		transformOrigin: "0 0",
		opacity: 1
	},
	"100%": {
		transform: "translate3d(0, 100%, 0)",
		transformOrigin: "0 0",
		opacity: 0
	}
});
var moveLeftIn = new Keyframe("antMoveLeftIn", {
	"0%": {
		transform: "translate3d(-100%, 0, 0)",
		transformOrigin: "0 0",
		opacity: 0
	},
	"100%": {
		transform: "translate3d(0, 0, 0)",
		transformOrigin: "0 0",
		opacity: 1
	}
});
var moveLeftOut = new Keyframe("antMoveLeftOut", {
	"0%": {
		transform: "translate3d(0, 0, 0)",
		transformOrigin: "0 0",
		opacity: 1
	},
	"100%": {
		transform: "translate3d(-100%, 0, 0)",
		transformOrigin: "0 0",
		opacity: 0
	}
});
var moveRightIn = new Keyframe("antMoveRightIn", {
	"0%": {
		transform: "translate3d(100%, 0, 0)",
		transformOrigin: "0 0",
		opacity: 0
	},
	"100%": {
		transform: "translate3d(0, 0, 0)",
		transformOrigin: "0 0",
		opacity: 1
	}
});
var moveRightOut = new Keyframe("antMoveRightOut", {
	"0%": {
		transform: "translate3d(0, 0, 0)",
		transformOrigin: "0 0",
		opacity: 1
	},
	"100%": {
		transform: "translate3d(100%, 0, 0)",
		transformOrigin: "0 0",
		opacity: 0
	}
});
var moveMotion = {
	"move-up": {
		inKeyframes: new Keyframe("antMoveUpIn", {
			"0%": {
				transform: "translate3d(0, -100%, 0)",
				transformOrigin: "0 0",
				opacity: 0
			},
			"100%": {
				transform: "translate3d(0, 0, 0)",
				transformOrigin: "0 0",
				opacity: 1
			}
		}),
		outKeyframes: new Keyframe("antMoveUpOut", {
			"0%": {
				transform: "translate3d(0, 0, 0)",
				transformOrigin: "0 0",
				opacity: 1
			},
			"100%": {
				transform: "translate3d(0, -100%, 0)",
				transformOrigin: "0 0",
				opacity: 0
			}
		})
	},
	"move-down": {
		inKeyframes: moveDownIn,
		outKeyframes: moveDownOut
	},
	"move-left": {
		inKeyframes: moveLeftIn,
		outKeyframes: moveLeftOut
	},
	"move-right": {
		inKeyframes: moveRightIn,
		outKeyframes: moveRightOut
	}
};
var initMoveMotion = (token, motionName) => {
	const { antCls } = token;
	const motionCls = `${antCls}-${motionName}`;
	const { inKeyframes, outKeyframes } = moveMotion[motionName];
	return [initMotion(motionCls, inKeyframes, outKeyframes, token.motionDurationMid), {
		[`
        ${motionCls}-enter,
        ${motionCls}-appear
      `]: {
			opacity: 0,
			animationTimingFunction: token.motionEaseOutCirc
		},
		[`${motionCls}-leave`]: { animationTimingFunction: token.motionEaseInOutCirc }
	}];
};
//#endregion
//#region node_modules/antd/es/style/motion/slide.js
var slideUpIn = new Keyframe("antSlideUpIn", {
	"0%": {
		transform: "scaleY(0.8)",
		transformOrigin: "0% 0%",
		opacity: 0
	},
	"100%": {
		transform: "scaleY(1)",
		transformOrigin: "0% 0%",
		opacity: 1
	}
});
var slideUpOut = new Keyframe("antSlideUpOut", {
	"0%": {
		transform: "scaleY(1)",
		transformOrigin: "0% 0%",
		opacity: 1
	},
	"100%": {
		transform: "scaleY(0.8)",
		transformOrigin: "0% 0%",
		opacity: 0
	}
});
var slideDownIn = new Keyframe("antSlideDownIn", {
	"0%": {
		transform: "scaleY(0.8)",
		transformOrigin: "100% 100%",
		opacity: 0
	},
	"100%": {
		transform: "scaleY(1)",
		transformOrigin: "100% 100%",
		opacity: 1
	}
});
var slideDownOut = new Keyframe("antSlideDownOut", {
	"0%": {
		transform: "scaleY(1)",
		transformOrigin: "100% 100%",
		opacity: 1
	},
	"100%": {
		transform: "scaleY(0.8)",
		transformOrigin: "100% 100%",
		opacity: 0
	}
});
var slideLeftIn = new Keyframe("antSlideLeftIn", {
	"0%": {
		transform: "scaleX(0.8)",
		transformOrigin: "0% 0%",
		opacity: 0
	},
	"100%": {
		transform: "scaleX(1)",
		transformOrigin: "0% 0%",
		opacity: 1
	}
});
var slideLeftOut = new Keyframe("antSlideLeftOut", {
	"0%": {
		transform: "scaleX(1)",
		transformOrigin: "0% 0%",
		opacity: 1
	},
	"100%": {
		transform: "scaleX(0.8)",
		transformOrigin: "0% 0%",
		opacity: 0
	}
});
var slideRightIn = new Keyframe("antSlideRightIn", {
	"0%": {
		transform: "scaleX(0.8)",
		transformOrigin: "100% 0%",
		opacity: 0
	},
	"100%": {
		transform: "scaleX(1)",
		transformOrigin: "100% 0%",
		opacity: 1
	}
});
var slideRightOut = new Keyframe("antSlideRightOut", {
	"0%": {
		transform: "scaleX(1)",
		transformOrigin: "100% 0%",
		opacity: 1
	},
	"100%": {
		transform: "scaleX(0.8)",
		transformOrigin: "100% 0%",
		opacity: 0
	}
});
var slideMotion = {
	"slide-up": {
		inKeyframes: slideUpIn,
		outKeyframes: slideUpOut
	},
	"slide-down": {
		inKeyframes: slideDownIn,
		outKeyframes: slideDownOut
	},
	"slide-left": {
		inKeyframes: slideLeftIn,
		outKeyframes: slideLeftOut
	},
	"slide-right": {
		inKeyframes: slideRightIn,
		outKeyframes: slideRightOut
	}
};
var initSlideMotion = (token, motionName) => {
	const { antCls } = token;
	const motionCls = `${antCls}-${motionName}`;
	const { inKeyframes, outKeyframes } = slideMotion[motionName];
	return [initMotion(motionCls, inKeyframes, outKeyframes, token.motionDurationMid), {
		[`
      ${motionCls}-enter,
      ${motionCls}-appear
    `]: {
			transform: "scale(0)",
			transformOrigin: "0% 0%",
			opacity: 0,
			animationTimingFunction: token.motionEaseOutQuint,
			"&-prepare": { transform: "scale(1)" }
		},
		[`${motionCls}-leave`]: { animationTimingFunction: token.motionEaseInQuint }
	}];
};
//#endregion
//#region node_modules/antd/es/style/compact-item.js
function compactItemBorder(token, parentCls, options, prefixCls) {
	const { focusElCls, focus, borderElCls } = options;
	const childCombinator = borderElCls ? "> *" : "";
	const hoverEffects = [
		"hover",
		focus ? "focus" : null,
		"active"
	].filter(Boolean).map((n) => `&:${n} ${childCombinator}`).join(",");
	return {
		[`&-item:not(${parentCls}-last-item)`]: { marginInlineEnd: token.calc(token.lineWidth).mul(-1).equal() },
		[`&-item:not(${prefixCls}-status-success)`]: { zIndex: 2 },
		"&-item": Object.assign(Object.assign({ [hoverEffects]: { zIndex: 3 } }, focusElCls ? { [`&${focusElCls}`]: { zIndex: 3 } } : {}), { [`&[disabled] ${childCombinator}`]: { zIndex: 0 } })
	};
}
function compactItemBorderRadius(prefixCls, parentCls, options) {
	const { borderElCls } = options;
	const childCombinator = borderElCls ? `> ${borderElCls}` : "";
	return {
		[`&-item:not(${parentCls}-first-item):not(${parentCls}-last-item) ${childCombinator}`]: { borderRadius: 0 },
		[`&-item:not(${parentCls}-last-item)${parentCls}-first-item`]: { [`& ${childCombinator}, &${prefixCls}-sm ${childCombinator}, &${prefixCls}-lg ${childCombinator}`]: {
			borderStartEndRadius: 0,
			borderEndEndRadius: 0
		} },
		[`&-item:not(${parentCls}-first-item)${parentCls}-last-item`]: { [`& ${childCombinator}, &${prefixCls}-sm ${childCombinator}, &${prefixCls}-lg ${childCombinator}`]: {
			borderStartStartRadius: 0,
			borderEndStartRadius: 0
		} }
	};
}
function genCompactItemStyle(token, options = { focus: true }) {
	const { componentCls } = token;
	const compactCls = `${componentCls}-compact`;
	return { [compactCls]: Object.assign(Object.assign({}, compactItemBorder(token, compactCls, options, componentCls)), compactItemBorderRadius(componentCls, compactCls, options)) };
}
//#endregion
//#region node_modules/rc-util/es/hooks/useId.js
init_slicedToArray();
function getUseId() {
	return _objectSpread2({}, import_react).useId;
}
var uuid$1 = 0;
var useOriginId = getUseId();
var useId_default = useOriginId ? function useId(id) {
	var reactId = useOriginId();
	if (id) return id;
	return reactId;
} : function useCompatId(id) {
	var _React$useState2 = _slicedToArray(import_react.useState("ssr-id"), 2), innerId = _React$useState2[0], setInnerId = _React$useState2[1];
	import_react.useEffect(function() {
		var nextId = uuid$1;
		uuid$1 += 1;
		setInnerId("rc_unique_".concat(nextId));
	}, []);
	if (id) return id;
	return innerId;
};
//#endregion
//#region node_modules/antd/es/_util/PurePanel.js
function withPureRenderTheme(Component) {
	return (props) => /*#__PURE__*/ import_react.createElement(ConfigProvider, { theme: { token: {
		motion: false,
		zIndexPopupBase: 0
	} } }, /*#__PURE__*/ import_react.createElement(Component, Object.assign({}, props)));
}
/* istanbul ignore next */
var genPurePanel = (Component, alignPropName, postProps, defaultPrefixCls, getDropdownCls) => {
	const PurePanel = (props) => {
		const { prefixCls: customizePrefixCls, style } = props;
		const holderRef = import_react.useRef(null);
		const [popupHeight, setPopupHeight] = import_react.useState(0);
		const [popupWidth, setPopupWidth] = import_react.useState(0);
		const [open, setOpen] = useMergedState(false, { value: props.open });
		const { getPrefixCls } = import_react.useContext(ConfigContext);
		const prefixCls = getPrefixCls(defaultPrefixCls || "select", customizePrefixCls);
		import_react.useEffect(() => {
			setOpen(true);
			if (typeof ResizeObserver !== "undefined") {
				const resizeObserver = new ResizeObserver((entries) => {
					const element = entries[0].target;
					setPopupHeight(element.offsetHeight + 8);
					setPopupWidth(element.offsetWidth);
				});
				const interval = setInterval(() => {
					var _a;
					const dropdownCls = getDropdownCls ? `.${getDropdownCls(prefixCls)}` : `.${prefixCls}-dropdown`;
					const popup = (_a = holderRef.current) === null || _a === void 0 ? void 0 : _a.querySelector(dropdownCls);
					if (popup) {
						clearInterval(interval);
						resizeObserver.observe(popup);
					}
				}, 10);
				return () => {
					clearInterval(interval);
					resizeObserver.disconnect();
				};
			}
		}, []);
		let mergedProps = Object.assign(Object.assign({}, props), {
			style: Object.assign(Object.assign({}, style), { margin: 0 }),
			open,
			visible: open,
			getPopupContainer: () => holderRef.current
		});
		if (postProps) mergedProps = postProps(mergedProps);
		if (alignPropName) Object.assign(mergedProps, { [alignPropName]: { overflow: {
			adjustX: false,
			adjustY: false
		} } });
		const mergedStyle = {
			paddingBottom: popupHeight,
			position: "relative",
			minWidth: popupWidth
		};
		return /*#__PURE__*/ import_react.createElement("div", {
			ref: holderRef,
			style: mergedStyle
		}, /*#__PURE__*/ import_react.createElement(Component, Object.assign({}, mergedProps)));
	};
	return withPureRenderTheme(PurePanel);
};
//#endregion
//#region node_modules/rc-util/es/isMobile.js
var isMobile_default = (function() {
	if (typeof navigator === "undefined" || typeof window === "undefined") return false;
	var agent = navigator.userAgent || navigator.vendor || window.opera;
	return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(agent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(agent === null || agent === void 0 ? void 0 : agent.substr(0, 4));
});
//#endregion
//#region node_modules/rc-select/es/TransBtn.js
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var TransBtn = function TransBtn(props) {
	var className = props.className, customizeIcon = props.customizeIcon, customizeIconProps = props.customizeIconProps, children = props.children, _onMouseDown = props.onMouseDown, onClick = props.onClick;
	var icon = typeof customizeIcon === "function" ? customizeIcon(customizeIconProps) : customizeIcon;
	return /*#__PURE__*/ import_react.createElement("span", {
		className,
		onMouseDown: function onMouseDown(event) {
			event.preventDefault();
			_onMouseDown === null || _onMouseDown === void 0 || _onMouseDown(event);
		},
		style: {
			userSelect: "none",
			WebkitUserSelect: "none"
		},
		unselectable: "on",
		onClick,
		"aria-hidden": true
	}, icon !== void 0 ? icon : /*#__PURE__*/ import_react.createElement("span", { className: (0, import_classnames.default)(className.split(/\s+/).map(function(cls) {
		return "".concat(cls, "-icon");
	})) }, children));
};
//#endregion
//#region node_modules/rc-select/es/hooks/useAllowClear.js
init_typeof();
var useAllowClear = function useAllowClear(prefixCls, onClearMouseDown, displayValues, allowClear, clearIcon) {
	var disabled = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : false;
	var mergedSearchValue = arguments.length > 6 ? arguments[6] : void 0;
	var mode = arguments.length > 7 ? arguments[7] : void 0;
	var mergedClearIcon = import_react.useMemo(function() {
		if (_typeof(allowClear) === "object") return allowClear.clearIcon;
		if (clearIcon) return clearIcon;
	}, [allowClear, clearIcon]);
	return {
		allowClear: import_react.useMemo(function() {
			if (!disabled && !!allowClear && (displayValues.length || mergedSearchValue) && !(mode === "combobox" && mergedSearchValue === "")) return true;
			return false;
		}, [
			allowClear,
			disabled,
			displayValues.length,
			mergedSearchValue,
			mode
		]),
		clearIcon: /*#__PURE__*/ import_react.createElement(TransBtn, {
			className: "".concat(prefixCls, "-clear"),
			onMouseDown: onClearMouseDown,
			customizeIcon: mergedClearIcon
		}, "×")
	};
};
//#endregion
//#region node_modules/rc-select/es/hooks/useBaseProps.js
/**
* BaseSelect provide some parsed data into context.
* You can use this hooks to get them.
*/
var BaseSelectContext = /*#__PURE__*/ import_react.createContext(null);
function useBaseProps() {
	return import_react.useContext(BaseSelectContext);
}
//#endregion
//#region node_modules/rc-select/es/hooks/useDelayReset.js
init_slicedToArray();
/**
* Similar with `useLock`, but this hook will always execute last value.
* When set to `true`, it will keep `true` for a short time even if `false` is set.
*/
function useDelayReset() {
	var timeout = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 10;
	var _React$useState2 = _slicedToArray(import_react.useState(false), 2), bool = _React$useState2[0], setBool = _React$useState2[1];
	var delayRef = import_react.useRef(null);
	var cancelLatest = function cancelLatest() {
		window.clearTimeout(delayRef.current);
	};
	import_react.useEffect(function() {
		return cancelLatest;
	}, []);
	return [
		bool,
		function delaySetBool(value, callback) {
			cancelLatest();
			delayRef.current = window.setTimeout(function() {
				setBool(value);
				if (callback) callback();
			}, timeout);
		},
		cancelLatest
	];
}
//#endregion
//#region node_modules/rc-select/es/hooks/useLock.js
/**
* Locker return cached mark.
* If set to `true`, will return `true` in a short time even if set `false`.
* If set to `false` and then set to `true`, will change to `true`.
* And after time duration, it will back to `null` automatically.
*/
function useLock() {
	var duration = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 250;
	var lockRef = import_react.useRef(null);
	var timeoutRef = import_react.useRef(null);
	import_react.useEffect(function() {
		return function() {
			window.clearTimeout(timeoutRef.current);
		};
	}, []);
	function doLock(locked) {
		if (locked || lockRef.current === null) lockRef.current = locked;
		window.clearTimeout(timeoutRef.current);
		timeoutRef.current = window.setTimeout(function() {
			lockRef.current = null;
		}, duration);
	}
	return [function() {
		return lockRef.current;
	}, doLock];
}
//#endregion
//#region node_modules/rc-select/es/hooks/useSelectTriggerControl.js
function useSelectTriggerControl(elements, open, triggerOpen, customizedTrigger) {
	var propsRef = import_react.useRef(null);
	propsRef.current = {
		open,
		triggerOpen,
		customizedTrigger
	};
	import_react.useEffect(function() {
		function onGlobalMouseDown(event) {
			var _propsRef$current;
			if ((_propsRef$current = propsRef.current) !== null && _propsRef$current !== void 0 && _propsRef$current.customizedTrigger) return;
			var target = event.target;
			if (target.shadowRoot && event.composed) target = event.composedPath()[0] || target;
			if (propsRef.current.open && elements().filter(function(element) {
				return element;
			}).every(function(element) {
				return !element.contains(target) && element !== target;
			})) propsRef.current.triggerOpen(false);
		}
		window.addEventListener("mousedown", onGlobalMouseDown);
		return function() {
			return window.removeEventListener("mousedown", onGlobalMouseDown);
		};
	}, []);
}
//#endregion
//#region node_modules/rc-select/es/utils/keyUtil.js
/** keyCode Judgment function */
function isValidateOpenKey(currentKeyCode) {
	return currentKeyCode && ![
		KeyCode.ESC,
		KeyCode.SHIFT,
		KeyCode.BACKSPACE,
		KeyCode.TAB,
		KeyCode.WIN_KEY,
		KeyCode.ALT,
		KeyCode.META,
		KeyCode.WIN_KEY_RIGHT,
		KeyCode.CTRL,
		KeyCode.SEMICOLON,
		KeyCode.EQUALS,
		KeyCode.CAPS_LOCK,
		KeyCode.CONTEXT_MENU,
		KeyCode.F1,
		KeyCode.F2,
		KeyCode.F3,
		KeyCode.F4,
		KeyCode.F5,
		KeyCode.F6,
		KeyCode.F7,
		KeyCode.F8,
		KeyCode.F9,
		KeyCode.F10,
		KeyCode.F11,
		KeyCode.F12
	].includes(currentKeyCode);
}
//#endregion
//#region node_modules/rc-overflow/es/Item.js
init_extends();
init_objectWithoutProperties();
var _excluded$10 = [
	"prefixCls",
	"invalidate",
	"item",
	"renderItem",
	"responsive",
	"responsiveDisabled",
	"registerSize",
	"itemKey",
	"className",
	"style",
	"children",
	"display",
	"order",
	"component"
];
var UNDEFINED = void 0;
function InternalItem(props, ref) {
	var prefixCls = props.prefixCls, invalidate = props.invalidate, item = props.item, renderItem = props.renderItem, responsive = props.responsive, responsiveDisabled = props.responsiveDisabled, registerSize = props.registerSize, itemKey = props.itemKey, className = props.className, style = props.style, children = props.children, display = props.display, order = props.order, _props$component = props.component, Component = _props$component === void 0 ? "div" : _props$component, restProps = _objectWithoutProperties(props, _excluded$10);
	var mergedHidden = responsive && !display;
	function internalRegisterSize(width) {
		registerSize(itemKey, width);
	}
	import_react.useEffect(function() {
		return function() {
			internalRegisterSize(null);
		};
	}, []);
	var childNode = renderItem && item !== UNDEFINED ? renderItem(item, { index: order }) : children;
	var overflowStyle;
	if (!invalidate) overflowStyle = {
		opacity: mergedHidden ? 0 : 1,
		height: mergedHidden ? 0 : UNDEFINED,
		overflowY: mergedHidden ? "hidden" : UNDEFINED,
		order: responsive ? order : UNDEFINED,
		pointerEvents: mergedHidden ? "none" : UNDEFINED,
		position: mergedHidden ? "absolute" : UNDEFINED
	};
	var overflowProps = {};
	if (mergedHidden) overflowProps["aria-hidden"] = true;
	var itemNode = /*#__PURE__*/ import_react.createElement(Component, _extends({
		className: (0, import_classnames.default)(!invalidate && prefixCls, className),
		style: _objectSpread2(_objectSpread2({}, overflowStyle), style)
	}, overflowProps, restProps, { ref }), childNode);
	if (responsive) itemNode = /*#__PURE__*/ import_react.createElement(RefResizeObserver, {
		onResize: function onResize(_ref) {
			var offsetWidth = _ref.offsetWidth;
			internalRegisterSize(offsetWidth);
		},
		disabled: responsiveDisabled
	}, itemNode);
	return itemNode;
}
var Item$1 = /*#__PURE__*/ import_react.forwardRef(InternalItem);
Item$1.displayName = "Item";
//#endregion
//#region node_modules/rc-overflow/es/hooks/channelUpdate.js
function channelUpdate(callback) {
	if (typeof MessageChannel === "undefined") wrapperRaf(callback);
	else {
		var channel = new MessageChannel();
		channel.port1.onmessage = function() {
			return callback();
		};
		channel.port2.postMessage(void 0);
	}
}
//#endregion
//#region node_modules/rc-overflow/es/hooks/useEffectState.js
init_slicedToArray();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
/**
* Batcher for record any `useEffectState` need update.
*/
function useBatcher() {
	var updateFuncRef = import_react.useRef(null);
	return function notifyEffectUpdate(callback) {
		if (!updateFuncRef.current) {
			updateFuncRef.current = [];
			channelUpdate(function() {
				(0, import_react_dom.unstable_batchedUpdates)(function() {
					updateFuncRef.current.forEach(function(fn) {
						fn();
					});
					updateFuncRef.current = null;
				});
			});
		}
		updateFuncRef.current.push(callback);
	};
}
/**
* Trigger state update by `useLayoutEffect` to save perf.
*/
function useEffectState(notifyEffectUpdate, defaultValue) {
	var _React$useState2 = _slicedToArray(import_react.useState(defaultValue), 2), stateValue = _React$useState2[0], setStateValue = _React$useState2[1];
	return [stateValue, useEvent(function(nextValue) {
		notifyEffectUpdate(function() {
			setStateValue(nextValue);
		});
	})];
}
//#endregion
//#region node_modules/rc-overflow/es/context.js
var OverflowContext = /*#__PURE__*/ import_react.createContext(null);
//#endregion
//#region node_modules/rc-overflow/es/RawItem.js
init_extends();
init_objectWithoutProperties();
var _excluded$9 = ["component"];
var _excluded2$1 = ["className"];
var _excluded3 = ["className"];
var RawItem = /*#__PURE__*/ import_react.forwardRef(function InternalRawItem(props, ref) {
	var context = import_react.useContext(OverflowContext);
	if (!context) {
		var _props$component = props.component, Component = _props$component === void 0 ? "div" : _props$component, _restProps = _objectWithoutProperties(props, _excluded$9);
		return /*#__PURE__*/ import_react.createElement(Component, _extends({}, _restProps, { ref }));
	}
	var contextClassName = context.className, restContext = _objectWithoutProperties(context, _excluded2$1);
	var className = props.className, restProps = _objectWithoutProperties(props, _excluded3);
	return /*#__PURE__*/ import_react.createElement(OverflowContext.Provider, { value: null }, /*#__PURE__*/ import_react.createElement(Item$1, _extends({
		ref,
		className: (0, import_classnames.default)(contextClassName, className)
	}, restContext, restProps)));
});
RawItem.displayName = "RawItem";
//#endregion
//#region node_modules/rc-overflow/es/Overflow.js
init_extends();
init_slicedToArray();
init_objectWithoutProperties();
var _excluded$8 = [
	"prefixCls",
	"data",
	"renderItem",
	"renderRawItem",
	"itemKey",
	"itemWidth",
	"ssr",
	"style",
	"className",
	"maxCount",
	"renderRest",
	"renderRawRest",
	"prefix",
	"suffix",
	"component",
	"itemComponent",
	"onVisibleChange"
];
var RESPONSIVE = "responsive";
var INVALIDATE = "invalidate";
function defaultRenderRest(omittedItems) {
	return "+ ".concat(omittedItems.length, " ...");
}
function Overflow(props, ref) {
	var _props$prefixCls = props.prefixCls, prefixCls = _props$prefixCls === void 0 ? "rc-overflow" : _props$prefixCls, _props$data = props.data, data = _props$data === void 0 ? [] : _props$data, renderItem = props.renderItem, renderRawItem = props.renderRawItem, itemKey = props.itemKey, _props$itemWidth = props.itemWidth, itemWidth = _props$itemWidth === void 0 ? 10 : _props$itemWidth, ssr = props.ssr, style = props.style, className = props.className, maxCount = props.maxCount, renderRest = props.renderRest, renderRawRest = props.renderRawRest, prefix = props.prefix, suffix = props.suffix, _props$component = props.component, Component = _props$component === void 0 ? "div" : _props$component, itemComponent = props.itemComponent, onVisibleChange = props.onVisibleChange, restProps = _objectWithoutProperties(props, _excluded$8);
	var fullySSR = ssr === "full";
	var notifyEffectUpdate = useBatcher();
	var _useEffectState2 = _slicedToArray(useEffectState(notifyEffectUpdate, null), 2), containerWidth = _useEffectState2[0], setContainerWidth = _useEffectState2[1];
	var mergedContainerWidth = containerWidth || 0;
	var _useEffectState4 = _slicedToArray(useEffectState(notifyEffectUpdate, /* @__PURE__ */ new Map()), 2), itemWidths = _useEffectState4[0], setItemWidths = _useEffectState4[1];
	var _useEffectState6 = _slicedToArray(useEffectState(notifyEffectUpdate, 0), 2), prevRestWidth = _useEffectState6[0], setPrevRestWidth = _useEffectState6[1];
	var _useEffectState8 = _slicedToArray(useEffectState(notifyEffectUpdate, 0), 2), restWidth = _useEffectState8[0], setRestWidth = _useEffectState8[1];
	var _useEffectState10 = _slicedToArray(useEffectState(notifyEffectUpdate, 0), 2), prefixWidth = _useEffectState10[0], setPrefixWidth = _useEffectState10[1];
	var _useEffectState12 = _slicedToArray(useEffectState(notifyEffectUpdate, 0), 2), suffixWidth = _useEffectState12[0], setSuffixWidth = _useEffectState12[1];
	var _useState2 = _slicedToArray((0, import_react.useState)(null), 2), suffixFixedStart = _useState2[0], setSuffixFixedStart = _useState2[1];
	var _useState4 = _slicedToArray((0, import_react.useState)(null), 2), displayCount = _useState4[0], setDisplayCount = _useState4[1];
	var mergedDisplayCount = import_react.useMemo(function() {
		if (displayCount === null && fullySSR) return Number.MAX_SAFE_INTEGER;
		return displayCount || 0;
	}, [displayCount, containerWidth]);
	var _useState6 = _slicedToArray((0, import_react.useState)(false), 2), restReady = _useState6[0], setRestReady = _useState6[1];
	var itemPrefixCls = "".concat(prefixCls, "-item");
	var mergedRestWidth = Math.max(prevRestWidth, restWidth);
	var isResponsive = maxCount === RESPONSIVE;
	var shouldResponsive = data.length && isResponsive;
	var invalidate = maxCount === INVALIDATE;
	/**
	* When is `responsive`, we will always render rest node to get the real width of it for calculation
	*/
	var showRest = shouldResponsive || typeof maxCount === "number" && data.length > maxCount;
	var mergedData = (0, import_react.useMemo)(function() {
		var items = data;
		if (shouldResponsive) if (containerWidth === null && fullySSR) items = data;
		else items = data.slice(0, Math.min(data.length, mergedContainerWidth / itemWidth));
		else if (typeof maxCount === "number") items = data.slice(0, maxCount);
		return items;
	}, [
		data,
		itemWidth,
		containerWidth,
		maxCount,
		shouldResponsive
	]);
	var omittedItems = (0, import_react.useMemo)(function() {
		if (shouldResponsive) return data.slice(mergedDisplayCount + 1);
		return data.slice(mergedData.length);
	}, [
		data,
		mergedData,
		shouldResponsive,
		mergedDisplayCount
	]);
	var getKey = (0, import_react.useCallback)(function(item, index) {
		var _ref;
		if (typeof itemKey === "function") return itemKey(item);
		return (_ref = itemKey && (item === null || item === void 0 ? void 0 : item[itemKey])) !== null && _ref !== void 0 ? _ref : index;
	}, [itemKey]);
	var mergedRenderItem = (0, import_react.useCallback)(renderItem || function(item) {
		return item;
	}, [renderItem]);
	function updateDisplayCount(count, suffixFixedStartVal, notReady) {
		if (displayCount === count && (suffixFixedStartVal === void 0 || suffixFixedStartVal === suffixFixedStart)) return;
		setDisplayCount(count);
		if (!notReady) {
			setRestReady(count < data.length - 1);
			onVisibleChange === null || onVisibleChange === void 0 || onVisibleChange(count);
		}
		if (suffixFixedStartVal !== void 0) setSuffixFixedStart(suffixFixedStartVal);
	}
	function onOverflowResize(_, element) {
		setContainerWidth(element.clientWidth);
	}
	function registerSize(key, width) {
		setItemWidths(function(origin) {
			var clone = new Map(origin);
			if (width === null) clone.delete(key);
			else clone.set(key, width);
			return clone;
		});
	}
	function registerOverflowSize(_, width) {
		setRestWidth(width);
		setPrevRestWidth(restWidth);
	}
	function registerPrefixSize(_, width) {
		setPrefixWidth(width);
	}
	function registerSuffixSize(_, width) {
		setSuffixWidth(width);
	}
	function getItemWidth(index) {
		return itemWidths.get(getKey(mergedData[index], index));
	}
	useLayoutEffect$1(function() {
		if (mergedContainerWidth && typeof mergedRestWidth === "number" && mergedData) {
			var totalWidth = prefixWidth + suffixWidth;
			var len = mergedData.length;
			var lastIndex = len - 1;
			if (!len) {
				updateDisplayCount(0, null);
				return;
			}
			for (var i = 0; i < len; i += 1) {
				var currentItemWidth = getItemWidth(i);
				if (fullySSR) currentItemWidth = currentItemWidth || 0;
				if (currentItemWidth === void 0) {
					updateDisplayCount(i - 1, void 0, true);
					break;
				}
				totalWidth += currentItemWidth;
				if (lastIndex === 0 && totalWidth <= mergedContainerWidth || i === lastIndex - 1 && totalWidth + getItemWidth(lastIndex) <= mergedContainerWidth) {
					updateDisplayCount(lastIndex, null);
					break;
				} else if (totalWidth + mergedRestWidth > mergedContainerWidth) {
					updateDisplayCount(i - 1, totalWidth - currentItemWidth - suffixWidth + restWidth);
					break;
				}
			}
			if (suffix && getItemWidth(0) + suffixWidth > mergedContainerWidth) setSuffixFixedStart(null);
		}
	}, [
		mergedContainerWidth,
		itemWidths,
		restWidth,
		prefixWidth,
		suffixWidth,
		getKey,
		mergedData
	]);
	var displayRest = restReady && !!omittedItems.length;
	var suffixStyle = {};
	if (suffixFixedStart !== null && shouldResponsive) suffixStyle = {
		position: "absolute",
		left: suffixFixedStart,
		top: 0
	};
	var itemSharedProps = {
		prefixCls: itemPrefixCls,
		responsive: shouldResponsive,
		component: itemComponent,
		invalidate
	};
	var internalRenderItemNode = renderRawItem ? function(item, index) {
		var key = getKey(item, index);
		return /*#__PURE__*/ import_react.createElement(OverflowContext.Provider, {
			key,
			value: _objectSpread2(_objectSpread2({}, itemSharedProps), {}, {
				order: index,
				item,
				itemKey: key,
				registerSize,
				display: index <= mergedDisplayCount
			})
		}, renderRawItem(item, index));
	} : function(item, index) {
		var key = getKey(item, index);
		return /*#__PURE__*/ import_react.createElement(Item$1, _extends({}, itemSharedProps, {
			order: index,
			key,
			item,
			renderItem: mergedRenderItem,
			itemKey: key,
			registerSize,
			display: index <= mergedDisplayCount
		}));
	};
	var restContextProps = {
		order: displayRest ? mergedDisplayCount : Number.MAX_SAFE_INTEGER,
		className: "".concat(itemPrefixCls, "-rest"),
		registerSize: registerOverflowSize,
		display: displayRest
	};
	var mergedRenderRest = renderRest || defaultRenderRest;
	var restNode = renderRawRest ? /*#__PURE__*/ import_react.createElement(OverflowContext.Provider, { value: _objectSpread2(_objectSpread2({}, itemSharedProps), restContextProps) }, renderRawRest(omittedItems)) : /*#__PURE__*/ import_react.createElement(Item$1, _extends({}, itemSharedProps, restContextProps), typeof mergedRenderRest === "function" ? mergedRenderRest(omittedItems) : mergedRenderRest);
	var overflowNode = /*#__PURE__*/ import_react.createElement(Component, _extends({
		className: (0, import_classnames.default)(!invalidate && prefixCls, className),
		style,
		ref
	}, restProps), prefix && /*#__PURE__*/ import_react.createElement(Item$1, _extends({}, itemSharedProps, {
		responsive: isResponsive,
		responsiveDisabled: !shouldResponsive,
		order: -1,
		className: "".concat(itemPrefixCls, "-prefix"),
		registerSize: registerPrefixSize,
		display: true
	}), prefix), mergedData.map(internalRenderItemNode), showRest ? restNode : null, suffix && /*#__PURE__*/ import_react.createElement(Item$1, _extends({}, itemSharedProps, {
		responsive: isResponsive,
		responsiveDisabled: !shouldResponsive,
		order: mergedDisplayCount,
		className: "".concat(itemPrefixCls, "-suffix"),
		registerSize: registerSuffixSize,
		display: true,
		style: suffixStyle
	}), suffix));
	return isResponsive ? /*#__PURE__*/ import_react.createElement(RefResizeObserver, {
		onResize: onOverflowResize,
		disabled: !shouldResponsive
	}, overflowNode) : overflowNode;
}
var ForwardOverflow = /*#__PURE__*/ import_react.forwardRef(Overflow);
ForwardOverflow.displayName = "Overflow";
ForwardOverflow.Item = RawItem;
ForwardOverflow.RESPONSIVE = RESPONSIVE;
ForwardOverflow.INVALIDATE = INVALIDATE;
//#endregion
//#region node_modules/rc-overflow/es/index.js
var es_default$3 = ForwardOverflow;
//#endregion
//#region node_modules/rc-util/es/composeProps.js
function composeProps(originProps, patchProps, isAll) {
	var composedProps = _objectSpread2(_objectSpread2({}, originProps), isAll ? patchProps : {});
	Object.keys(patchProps).forEach(function(key) {
		var func = patchProps[key];
		if (typeof func === "function") composedProps[key] = function() {
			var _originProps$key;
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			func.apply(void 0, args);
			return (_originProps$key = originProps[key]) === null || _originProps$key === void 0 ? void 0 : _originProps$key.call.apply(_originProps$key, [originProps].concat(args));
		};
	});
	return composedProps;
}
//#endregion
//#region node_modules/rc-select/es/Selector/Input.js
init_objectWithoutProperties();
var _excluded$7 = [
	"prefixCls",
	"id",
	"inputElement",
	"autoFocus",
	"autoComplete",
	"editable",
	"activeDescendantId",
	"value",
	"open",
	"attrs"
];
var RefInput = /*#__PURE__*/ import_react.forwardRef(function Input(props, ref) {
	var prefixCls = props.prefixCls, id = props.id, inputElement = props.inputElement, autoFocus = props.autoFocus, autoComplete = props.autoComplete, editable = props.editable, activeDescendantId = props.activeDescendantId, value = props.value, open = props.open, attrs = props.attrs, restProps = _objectWithoutProperties(props, _excluded$7);
	var inputNode = inputElement || /*#__PURE__*/ import_react.createElement("input", null);
	var _inputNode = inputNode, originRef = _inputNode.ref, originProps = _inputNode.props;
	warning(!("maxLength" in inputNode.props), "Passing 'maxLength' to input element directly may not work because input in BaseSelect is controlled.");
	inputNode = /*#__PURE__*/ import_react.cloneElement(inputNode, _objectSpread2(_objectSpread2(_objectSpread2({ type: "search" }, composeProps(restProps, originProps, true)), {}, {
		id,
		ref: composeRef(ref, originRef),
		autoComplete: autoComplete || "off",
		autoFocus,
		className: (0, import_classnames.default)("".concat(prefixCls, "-selection-search-input"), originProps === null || originProps === void 0 ? void 0 : originProps.className),
		role: "combobox",
		"aria-expanded": open || false,
		"aria-haspopup": "listbox",
		"aria-owns": "".concat(id, "_list"),
		"aria-autocomplete": "list",
		"aria-controls": "".concat(id, "_list"),
		"aria-activedescendant": open ? activeDescendantId : void 0
	}, attrs), {}, {
		value: editable ? value : "",
		readOnly: !editable,
		unselectable: !editable ? "on" : null,
		style: _objectSpread2(_objectSpread2({}, originProps.style), {}, { opacity: editable ? null : 0 })
	}));
	return inputNode;
});
RefInput.displayName = "Input";
//#endregion
//#region node_modules/rc-select/es/utils/commonUtil.js
init_typeof();
function toArray$1(value) {
	if (Array.isArray(value)) return value;
	return value !== void 0 ? [value] : [];
}
/** Is client side and not jsdom */
var isBrowserClient$1 = typeof window !== "undefined" && window.document && window.document.documentElement;
function hasValue(value) {
	return value !== void 0 && value !== null;
}
/** combo mode no value judgment function */
function isComboNoValue(value) {
	return !value && value !== 0;
}
function isTitleType$1(title) {
	return ["string", "number"].includes(_typeof(title));
}
function getTitle(item) {
	var title = void 0;
	if (item) {
		if (isTitleType$1(item.title)) title = item.title.toString();
		else if (isTitleType$1(item.label)) title = item.label.toString();
	}
	return title;
}
//#endregion
//#region node_modules/rc-select/es/hooks/useLayoutEffect.js
/**
* Wrap `React.useLayoutEffect` which will not throw warning message in test env
*/
function useLayoutEffect(effect, deps) {
	if (isBrowserClient$1)
 /* istanbul ignore next */
	import_react.useLayoutEffect(effect, deps);
	else import_react.useEffect(effect, deps);
}
//#endregion
//#region node_modules/rc-select/es/Selector/MultipleSelector.js
init_defineProperty();
init_slicedToArray();
function itemKey(value) {
	var _value$key;
	return (_value$key = value.key) !== null && _value$key !== void 0 ? _value$key : value.value;
}
var onPreventMouseDown = function onPreventMouseDown(event) {
	event.preventDefault();
	event.stopPropagation();
};
var SelectSelector = function SelectSelector(props) {
	var id = props.id, prefixCls = props.prefixCls, values = props.values, open = props.open, searchValue = props.searchValue, autoClearSearchValue = props.autoClearSearchValue, inputRef = props.inputRef, placeholder = props.placeholder, disabled = props.disabled, mode = props.mode, showSearch = props.showSearch, autoFocus = props.autoFocus, autoComplete = props.autoComplete, activeDescendantId = props.activeDescendantId, tabIndex = props.tabIndex, removeIcon = props.removeIcon, maxTagCount = props.maxTagCount, maxTagTextLength = props.maxTagTextLength, _props$maxTagPlacehol = props.maxTagPlaceholder, maxTagPlaceholder = _props$maxTagPlacehol === void 0 ? function(omittedValues) {
		return "+ ".concat(omittedValues.length, " ...");
	} : _props$maxTagPlacehol, tagRender = props.tagRender, onToggleOpen = props.onToggleOpen, onRemove = props.onRemove, onInputChange = props.onInputChange, onInputPaste = props.onInputPaste, onInputKeyDown = props.onInputKeyDown, onInputMouseDown = props.onInputMouseDown, onInputCompositionStart = props.onInputCompositionStart, onInputCompositionEnd = props.onInputCompositionEnd, onInputBlur = props.onInputBlur;
	var measureRef = import_react.useRef(null);
	var _useState2 = _slicedToArray((0, import_react.useState)(0), 2), inputWidth = _useState2[0], setInputWidth = _useState2[1];
	var _useState4 = _slicedToArray((0, import_react.useState)(false), 2), focused = _useState4[0], setFocused = _useState4[1];
	var selectionPrefixCls = "".concat(prefixCls, "-selection");
	var inputValue = open || mode === "multiple" && autoClearSearchValue === false || mode === "tags" ? searchValue : "";
	var inputEditable = mode === "tags" || mode === "multiple" && autoClearSearchValue === false || showSearch && (open || focused);
	useLayoutEffect(function() {
		setInputWidth(measureRef.current.scrollWidth);
	}, [inputValue]);
	var defaultRenderSelector = function defaultRenderSelector(item, content, itemDisabled, closable, onClose) {
		return /*#__PURE__*/ import_react.createElement("span", {
			title: getTitle(item),
			className: (0, import_classnames.default)("".concat(selectionPrefixCls, "-item"), _defineProperty({}, "".concat(selectionPrefixCls, "-item-disabled"), itemDisabled))
		}, /*#__PURE__*/ import_react.createElement("span", { className: "".concat(selectionPrefixCls, "-item-content") }, content), closable && /*#__PURE__*/ import_react.createElement(TransBtn, {
			className: "".concat(selectionPrefixCls, "-item-remove"),
			onMouseDown: onPreventMouseDown,
			onClick: onClose,
			customizeIcon: removeIcon
		}, "×"));
	};
	var customizeRenderSelector = function customizeRenderSelector(value, content, itemDisabled, closable, onClose, isMaxTag) {
		return /*#__PURE__*/ import_react.createElement("span", { onMouseDown: function onMouseDown(e) {
			onPreventMouseDown(e);
			onToggleOpen(!open);
		} }, tagRender({
			label: content,
			value,
			disabled: itemDisabled,
			closable,
			onClose,
			isMaxTag: !!isMaxTag
		}));
	};
	var renderItem = function renderItem(valueItem) {
		var itemDisabled = valueItem.disabled, label = valueItem.label, value = valueItem.value;
		var closable = !disabled && !itemDisabled;
		var displayLabel = label;
		if (typeof maxTagTextLength === "number") {
			if (typeof label === "string" || typeof label === "number") {
				var strLabel = String(displayLabel);
				if (strLabel.length > maxTagTextLength) displayLabel = "".concat(strLabel.slice(0, maxTagTextLength), "...");
			}
		}
		var onClose = function onClose(event) {
			if (event) event.stopPropagation();
			onRemove(valueItem);
		};
		return typeof tagRender === "function" ? customizeRenderSelector(value, displayLabel, itemDisabled, closable, onClose) : defaultRenderSelector(valueItem, displayLabel, itemDisabled, closable, onClose);
	};
	var renderRest = function renderRest(omittedValues) {
		if (!values.length) return null;
		var content = typeof maxTagPlaceholder === "function" ? maxTagPlaceholder(omittedValues) : maxTagPlaceholder;
		return typeof tagRender === "function" ? customizeRenderSelector(void 0, content, false, false, void 0, true) : defaultRenderSelector({ title: content }, content, false);
	};
	var inputNode = /*#__PURE__*/ import_react.createElement("div", {
		className: "".concat(selectionPrefixCls, "-search"),
		style: { width: inputWidth },
		onFocus: function onFocus() {
			setFocused(true);
		},
		onBlur: function onBlur() {
			setFocused(false);
		}
	}, /*#__PURE__*/ import_react.createElement(RefInput, {
		ref: inputRef,
		open,
		prefixCls,
		id,
		inputElement: null,
		disabled,
		autoFocus,
		autoComplete,
		editable: inputEditable,
		activeDescendantId,
		value: inputValue,
		onKeyDown: onInputKeyDown,
		onMouseDown: onInputMouseDown,
		onChange: onInputChange,
		onPaste: onInputPaste,
		onCompositionStart: onInputCompositionStart,
		onCompositionEnd: onInputCompositionEnd,
		onBlur: onInputBlur,
		tabIndex,
		attrs: pickAttrs(props, true)
	}), /*#__PURE__*/ import_react.createElement("span", {
		ref: measureRef,
		className: "".concat(selectionPrefixCls, "-search-mirror"),
		"aria-hidden": true
	}, inputValue, "\xA0"));
	var selectionNode = /*#__PURE__*/ import_react.createElement(es_default$3, {
		prefixCls: "".concat(selectionPrefixCls, "-overflow"),
		data: values,
		renderItem,
		renderRest,
		suffix: inputNode,
		itemKey,
		maxCount: maxTagCount
	});
	return /*#__PURE__*/ import_react.createElement("span", { className: "".concat(selectionPrefixCls, "-wrap") }, selectionNode, !values.length && !inputValue && /*#__PURE__*/ import_react.createElement("span", { className: "".concat(selectionPrefixCls, "-placeholder") }, placeholder));
};
//#endregion
//#region node_modules/rc-select/es/Selector/SingleSelector.js
init_slicedToArray();
var SingleSelector = function SingleSelector(props) {
	var inputElement = props.inputElement, prefixCls = props.prefixCls, id = props.id, inputRef = props.inputRef, disabled = props.disabled, autoFocus = props.autoFocus, autoComplete = props.autoComplete, activeDescendantId = props.activeDescendantId, mode = props.mode, open = props.open, values = props.values, placeholder = props.placeholder, tabIndex = props.tabIndex, showSearch = props.showSearch, searchValue = props.searchValue, activeValue = props.activeValue, maxLength = props.maxLength, onInputKeyDown = props.onInputKeyDown, onInputMouseDown = props.onInputMouseDown, onInputChange = props.onInputChange, onInputPaste = props.onInputPaste, onInputCompositionStart = props.onInputCompositionStart, onInputCompositionEnd = props.onInputCompositionEnd, onInputBlur = props.onInputBlur, title = props.title;
	var _React$useState2 = _slicedToArray(import_react.useState(false), 2), inputChanged = _React$useState2[0], setInputChanged = _React$useState2[1];
	var combobox = mode === "combobox";
	var inputEditable = combobox || showSearch;
	var item = values[0];
	var inputValue = searchValue || "";
	if (combobox && activeValue && !inputChanged) inputValue = activeValue;
	import_react.useEffect(function() {
		if (combobox) setInputChanged(false);
	}, [combobox, activeValue]);
	var hasTextInput = mode !== "combobox" && !open && !showSearch ? false : !!inputValue;
	var selectionTitle = title === void 0 ? getTitle(item) : title;
	var placeholderNode = import_react.useMemo(function() {
		if (item) return null;
		return /*#__PURE__*/ import_react.createElement("span", {
			className: "".concat(prefixCls, "-selection-placeholder"),
			style: hasTextInput ? { visibility: "hidden" } : void 0
		}, placeholder);
	}, [
		item,
		hasTextInput,
		placeholder,
		prefixCls
	]);
	return /*#__PURE__*/ import_react.createElement("span", { className: "".concat(prefixCls, "-selection-wrap") }, /*#__PURE__*/ import_react.createElement("span", { className: "".concat(prefixCls, "-selection-search") }, /*#__PURE__*/ import_react.createElement(RefInput, {
		ref: inputRef,
		prefixCls,
		id,
		open,
		inputElement,
		disabled,
		autoFocus,
		autoComplete,
		editable: inputEditable,
		activeDescendantId,
		value: inputValue,
		onKeyDown: onInputKeyDown,
		onMouseDown: onInputMouseDown,
		onChange: function onChange(e) {
			setInputChanged(true);
			onInputChange(e);
		},
		onPaste: onInputPaste,
		onCompositionStart: onInputCompositionStart,
		onCompositionEnd: onInputCompositionEnd,
		onBlur: onInputBlur,
		tabIndex,
		attrs: pickAttrs(props, true),
		maxLength: combobox ? maxLength : void 0
	})), !combobox && item ? /*#__PURE__*/ import_react.createElement("span", {
		className: "".concat(prefixCls, "-selection-item"),
		title: selectionTitle,
		style: hasTextInput ? { visibility: "hidden" } : void 0
	}, item.label) : null, placeholderNode);
};
//#endregion
//#region node_modules/rc-select/es/Selector/index.js
/**
* Cursor rule:
* 1. Only `showSearch` enabled
* 2. Only `open` is `true`
* 3. When typing, set `open` to `true` which hit rule of 2
*
* Accessibility:
* - https://www.w3.org/TR/wai-aria-practices/examples/combobox/aria1.1pattern/listbox-combo.html
*/
init_extends();
init_slicedToArray();
var ForwardSelector = /*#__PURE__*/ import_react.forwardRef(function Selector(props, ref) {
	var inputRef = (0, import_react.useRef)(null);
	var compositionStatusRef = (0, import_react.useRef)(false);
	var prefixCls = props.prefixCls, open = props.open, mode = props.mode, showSearch = props.showSearch, tokenWithEnter = props.tokenWithEnter, disabled = props.disabled, prefix = props.prefix, autoClearSearchValue = props.autoClearSearchValue, onSearch = props.onSearch, onSearchSubmit = props.onSearchSubmit, onToggleOpen = props.onToggleOpen, onInputKeyDown = props.onInputKeyDown, onInputBlur = props.onInputBlur, domRef = props.domRef;
	import_react.useImperativeHandle(ref, function() {
		return {
			focus: function focus(options) {
				inputRef.current.focus(options);
			},
			blur: function blur() {
				inputRef.current.blur();
			}
		};
	});
	var _useLock2 = _slicedToArray(useLock(0), 2), getInputMouseDown = _useLock2[0], setInputMouseDown = _useLock2[1];
	var onInternalInputKeyDown = function onInternalInputKeyDown(event) {
		var which = event.which;
		var isTextAreaElement = inputRef.current instanceof HTMLTextAreaElement;
		if (!isTextAreaElement && open && (which === KeyCode.UP || which === KeyCode.DOWN)) event.preventDefault();
		if (onInputKeyDown) onInputKeyDown(event);
		if (which === KeyCode.ENTER && mode === "tags" && !compositionStatusRef.current && !open) onSearchSubmit === null || onSearchSubmit === void 0 || onSearchSubmit(event.target.value);
		if (isTextAreaElement && !open && ~[
			KeyCode.UP,
			KeyCode.DOWN,
			KeyCode.LEFT,
			KeyCode.RIGHT
		].indexOf(which)) return;
		if (isValidateOpenKey(which)) onToggleOpen(true);
	};
	/**
	* We can not use `findDOMNode` sine it will get warning,
	* have to use timer to check if is input element.
	*/
	var onInternalInputMouseDown = function onInternalInputMouseDown() {
		setInputMouseDown(true);
	};
	var pastedTextRef = (0, import_react.useRef)(null);
	var triggerOnSearch = function triggerOnSearch(value) {
		if (onSearch(value, true, compositionStatusRef.current) !== false) onToggleOpen(true);
	};
	var onInputCompositionStart = function onInputCompositionStart() {
		compositionStatusRef.current = true;
	};
	var onInputCompositionEnd = function onInputCompositionEnd(e) {
		compositionStatusRef.current = false;
		if (mode !== "combobox") triggerOnSearch(e.target.value);
	};
	var onInputChange = function onInputChange(event) {
		var value = event.target.value;
		if (tokenWithEnter && pastedTextRef.current && /[\r\n]/.test(pastedTextRef.current)) {
			var replacedText = pastedTextRef.current.replace(/[\r\n]+$/, "").replace(/\r\n/g, " ").replace(/[\r\n]/g, " ");
			value = value.replace(replacedText, pastedTextRef.current);
		}
		pastedTextRef.current = null;
		triggerOnSearch(value);
	};
	var onInputPaste = function onInputPaste(e) {
		var clipboardData = e.clipboardData;
		pastedTextRef.current = (clipboardData === null || clipboardData === void 0 ? void 0 : clipboardData.getData("text")) || "";
	};
	var onClick = function onClick(_ref) {
		if (_ref.target !== inputRef.current) if (document.body.style.msTouchAction !== void 0) setTimeout(function() {
			inputRef.current.focus();
		});
		else inputRef.current.focus();
	};
	var onMouseDown = function onMouseDown(event) {
		var inputMouseDown = getInputMouseDown();
		if (event.target !== inputRef.current && !inputMouseDown && !(mode === "combobox" && disabled)) event.preventDefault();
		if (mode !== "combobox" && (!showSearch || !inputMouseDown) || !open) {
			if (open && autoClearSearchValue !== false) onSearch("", true, false);
			onToggleOpen();
		}
	};
	var sharedProps = {
		inputRef,
		onInputKeyDown: onInternalInputKeyDown,
		onInputMouseDown: onInternalInputMouseDown,
		onInputChange,
		onInputPaste,
		onInputCompositionStart,
		onInputCompositionEnd,
		onInputBlur
	};
	var selectNode = mode === "multiple" || mode === "tags" ? /*#__PURE__*/ import_react.createElement(SelectSelector, _extends({}, props, sharedProps)) : /*#__PURE__*/ import_react.createElement(SingleSelector, _extends({}, props, sharedProps));
	return /*#__PURE__*/ import_react.createElement("div", {
		ref: domRef,
		className: "".concat(prefixCls, "-selector"),
		onClick,
		onMouseDown
	}, prefix && /*#__PURE__*/ import_react.createElement("div", { className: "".concat(prefixCls, "-prefix") }, prefix), selectNode);
});
ForwardSelector.displayName = "Selector";
//#endregion
//#region node_modules/@rc-component/trigger/es/Popup/Arrow.js
function Arrow(props) {
	var prefixCls = props.prefixCls, align = props.align, arrow = props.arrow, arrowPos = props.arrowPos;
	var _ref = arrow || {}, className = _ref.className, content = _ref.content;
	var _arrowPos$x = arrowPos.x, x = _arrowPos$x === void 0 ? 0 : _arrowPos$x, _arrowPos$y = arrowPos.y, y = _arrowPos$y === void 0 ? 0 : _arrowPos$y;
	var arrowRef = import_react.useRef();
	if (!align || !align.points) return null;
	var alignStyle = { position: "absolute" };
	if (align.autoArrow !== false) {
		var popupPoints = align.points[0];
		var targetPoints = align.points[1];
		var popupTB = popupPoints[0];
		var popupLR = popupPoints[1];
		var targetTB = targetPoints[0];
		var targetLR = targetPoints[1];
		if (popupTB === targetTB || !["t", "b"].includes(popupTB)) alignStyle.top = y;
		else if (popupTB === "t") alignStyle.top = 0;
		else alignStyle.bottom = 0;
		if (popupLR === targetLR || !["l", "r"].includes(popupLR)) alignStyle.left = x;
		else if (popupLR === "l") alignStyle.left = 0;
		else alignStyle.right = 0;
	}
	return /*#__PURE__*/ import_react.createElement("div", {
		ref: arrowRef,
		className: (0, import_classnames.default)("".concat(prefixCls, "-arrow"), className),
		style: alignStyle
	}, content);
}
//#endregion
//#region node_modules/@rc-component/trigger/es/Popup/Mask.js
init_extends();
function Mask(props) {
	var prefixCls = props.prefixCls, open = props.open, zIndex = props.zIndex, mask = props.mask, motion = props.motion;
	if (!mask) return null;
	return /*#__PURE__*/ import_react.createElement(es_default$4, _extends({}, motion, {
		motionAppear: true,
		visible: open,
		removeOnLeave: true
	}), function(_ref) {
		var className = _ref.className;
		return /*#__PURE__*/ import_react.createElement("div", {
			style: { zIndex },
			className: (0, import_classnames.default)("".concat(prefixCls, "-mask"), className)
		});
	});
}
//#endregion
//#region node_modules/@rc-component/trigger/es/Popup/PopupContent.js
var PopupContent = /*#__PURE__*/ import_react.memo(function(_ref) {
	return _ref.children;
}, function(_, next) {
	return next.cache;
});
PopupContent.displayName = "PopupContent";
//#endregion
//#region node_modules/@rc-component/trigger/es/Popup/index.js
init_extends();
init_slicedToArray();
var Popup = /*#__PURE__*/ import_react.forwardRef(function(props, ref) {
	var popup = props.popup, className = props.className, prefixCls = props.prefixCls, style = props.style, target = props.target, _onVisibleChanged = props.onVisibleChanged, open = props.open, keepDom = props.keepDom, fresh = props.fresh, onClick = props.onClick, mask = props.mask, arrow = props.arrow, arrowPos = props.arrowPos, align = props.align, motion = props.motion, maskMotion = props.maskMotion, forceRender = props.forceRender, getPopupContainer = props.getPopupContainer, autoDestroy = props.autoDestroy, Portal = props.portal, zIndex = props.zIndex, onMouseEnter = props.onMouseEnter, onMouseLeave = props.onMouseLeave, onPointerEnter = props.onPointerEnter, onPointerDownCapture = props.onPointerDownCapture, ready = props.ready, offsetX = props.offsetX, offsetY = props.offsetY, offsetR = props.offsetR, offsetB = props.offsetB, onAlign = props.onAlign, onPrepare = props.onPrepare, stretch = props.stretch, targetWidth = props.targetWidth, targetHeight = props.targetHeight;
	var childNode = typeof popup === "function" ? popup() : popup;
	var isNodeVisible = open || keepDom;
	var getPopupContainerNeedParams = (getPopupContainer === null || getPopupContainer === void 0 ? void 0 : getPopupContainer.length) > 0;
	var _React$useState2 = _slicedToArray(import_react.useState(!getPopupContainer || !getPopupContainerNeedParams), 2), show = _React$useState2[0], setShow = _React$useState2[1];
	useLayoutEffect$1(function() {
		if (!show && getPopupContainerNeedParams && target) setShow(true);
	}, [
		show,
		getPopupContainerNeedParams,
		target
	]);
	if (!show) return null;
	var AUTO = "auto";
	var offsetStyle = {
		left: "-1000vw",
		top: "-1000vh",
		right: AUTO,
		bottom: AUTO
	};
	if (ready || !open) {
		var _experimental;
		var points = align.points;
		var dynamicInset = align.dynamicInset || ((_experimental = align._experimental) === null || _experimental === void 0 ? void 0 : _experimental.dynamicInset);
		var alignRight = dynamicInset && points[0][1] === "r";
		var alignBottom = dynamicInset && points[0][0] === "b";
		if (alignRight) {
			offsetStyle.right = offsetR;
			offsetStyle.left = AUTO;
		} else {
			offsetStyle.left = offsetX;
			offsetStyle.right = AUTO;
		}
		if (alignBottom) {
			offsetStyle.bottom = offsetB;
			offsetStyle.top = AUTO;
		} else {
			offsetStyle.top = offsetY;
			offsetStyle.bottom = AUTO;
		}
	}
	var miscStyle = {};
	if (stretch) {
		if (stretch.includes("height") && targetHeight) miscStyle.height = targetHeight;
		else if (stretch.includes("minHeight") && targetHeight) miscStyle.minHeight = targetHeight;
		if (stretch.includes("width") && targetWidth) miscStyle.width = targetWidth;
		else if (stretch.includes("minWidth") && targetWidth) miscStyle.minWidth = targetWidth;
	}
	if (!open) miscStyle.pointerEvents = "none";
	return /*#__PURE__*/ import_react.createElement(Portal, {
		open: forceRender || isNodeVisible,
		getContainer: getPopupContainer && function() {
			return getPopupContainer(target);
		},
		autoDestroy
	}, /*#__PURE__*/ import_react.createElement(Mask, {
		prefixCls,
		open,
		zIndex,
		mask,
		motion: maskMotion
	}), /*#__PURE__*/ import_react.createElement(RefResizeObserver, {
		onResize: onAlign,
		disabled: !open
	}, function(resizeObserverRef) {
		return /*#__PURE__*/ import_react.createElement(es_default$4, _extends({
			motionAppear: true,
			motionEnter: true,
			motionLeave: true,
			removeOnLeave: false,
			forceRender,
			leavedClassName: "".concat(prefixCls, "-hidden")
		}, motion, {
			onAppearPrepare: onPrepare,
			onEnterPrepare: onPrepare,
			visible: open,
			onVisibleChanged: function onVisibleChanged(nextVisible) {
				var _motion$onVisibleChan;
				motion === null || motion === void 0 || (_motion$onVisibleChan = motion.onVisibleChanged) === null || _motion$onVisibleChan === void 0 || _motion$onVisibleChan.call(motion, nextVisible);
				_onVisibleChanged(nextVisible);
			}
		}), function(_ref, motionRef) {
			var motionClassName = _ref.className, motionStyle = _ref.style;
			var cls = (0, import_classnames.default)(prefixCls, motionClassName, className);
			return /*#__PURE__*/ import_react.createElement("div", {
				ref: composeRef(resizeObserverRef, ref, motionRef),
				className: cls,
				style: _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({
					"--arrow-x": "".concat(arrowPos.x || 0, "px"),
					"--arrow-y": "".concat(arrowPos.y || 0, "px")
				}, offsetStyle), miscStyle), motionStyle), {}, {
					boxSizing: "border-box",
					zIndex
				}, style),
				onMouseEnter,
				onMouseLeave,
				onPointerEnter,
				onClick,
				onPointerDownCapture
			}, arrow && /*#__PURE__*/ import_react.createElement(Arrow, {
				prefixCls,
				arrow,
				arrowPos,
				align
			}), /*#__PURE__*/ import_react.createElement(PopupContent, { cache: !open && !fresh }, childNode));
		});
	}));
});
Popup.displayName = "Popup";
//#endregion
//#region node_modules/@rc-component/trigger/es/TriggerWrapper.js
var TriggerWrapper = /*#__PURE__*/ import_react.forwardRef(function(props, ref) {
	var children = props.children, getTriggerDOMNode = props.getTriggerDOMNode;
	var canUseRef = supportRef(children);
	var mergedRef = useComposeRef(import_react.useCallback(function(node) {
		fillRef(ref, getTriggerDOMNode ? getTriggerDOMNode(node) : node);
	}, [getTriggerDOMNode]), getNodeRef(children));
	return canUseRef ? /*#__PURE__*/ import_react.cloneElement(children, { ref: mergedRef }) : children;
});
TriggerWrapper.displayName = "TriggerWrapper";
//#endregion
//#region node_modules/@rc-component/trigger/es/context.js
var TriggerContext = /*#__PURE__*/ import_react.createContext(null);
//#endregion
//#region node_modules/@rc-component/trigger/es/hooks/useAction.js
function toArray(val) {
	return val ? Array.isArray(val) ? val : [val] : [];
}
function useAction(mobile, action, showAction, hideAction) {
	return import_react.useMemo(function() {
		var mergedShowAction = toArray(showAction !== null && showAction !== void 0 ? showAction : action);
		var mergedHideAction = toArray(hideAction !== null && hideAction !== void 0 ? hideAction : action);
		var showActionSet = new Set(mergedShowAction);
		var hideActionSet = new Set(mergedHideAction);
		if (mobile) {
			if (showActionSet.has("hover")) {
				showActionSet.delete("hover");
				showActionSet.add("click");
			}
			if (hideActionSet.has("hover")) {
				hideActionSet.delete("hover");
				hideActionSet.add("click");
			}
		}
		return [showActionSet, hideActionSet];
	}, [
		mobile,
		action,
		showAction,
		hideAction
	]);
}
//#endregion
//#region node_modules/@rc-component/trigger/es/util.js
function isPointsEq() {
	var a1 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
	var a2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
	if (arguments.length > 2 ? arguments[2] : void 0) return a1[0] === a2[0];
	return a1[0] === a2[0] && a1[1] === a2[1];
}
function getAlignPopupClassName(builtinPlacements, prefixCls, align, isAlignPoint) {
	var points = align.points;
	var placements = Object.keys(builtinPlacements);
	for (var i = 0; i < placements.length; i += 1) {
		var _builtinPlacements$pl;
		var placement = placements[i];
		if (isPointsEq((_builtinPlacements$pl = builtinPlacements[placement]) === null || _builtinPlacements$pl === void 0 ? void 0 : _builtinPlacements$pl.points, points, isAlignPoint)) return "".concat(prefixCls, "-placement-").concat(placement);
	}
	return "";
}
/** @deprecated We should not use this if we can refactor all deps */
function getMotion(prefixCls, motion, animation, transitionName) {
	if (motion) return motion;
	if (animation) return { motionName: "".concat(prefixCls, "-").concat(animation) };
	if (transitionName) return { motionName: transitionName };
	return null;
}
function getWin(ele) {
	return ele.ownerDocument.defaultView;
}
/**
* Get all the scrollable parent elements of the element
* @param ele       The element to be detected
* @param areaOnly  Only return the parent which will cut visible area
*/
function collectScroller(ele) {
	var scrollerList = [];
	var current = ele === null || ele === void 0 ? void 0 : ele.parentElement;
	var scrollStyle = [
		"hidden",
		"scroll",
		"clip",
		"auto"
	];
	while (current) {
		var _getWin$getComputedSt = getWin(current).getComputedStyle(current);
		if ([
			_getWin$getComputedSt.overflowX,
			_getWin$getComputedSt.overflowY,
			_getWin$getComputedSt.overflow
		].some(function(o) {
			return scrollStyle.includes(o);
		})) scrollerList.push(current);
		current = current.parentElement;
	}
	return scrollerList;
}
function toNum(num) {
	var defaultValue = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
	return Number.isNaN(num) ? defaultValue : num;
}
function getPxValue(val) {
	return toNum(parseFloat(val), 0);
}
/**
*
*
*  **************************************
*  *              Border                *
*  *     **************************     *
*  *     *                  *     *     *
*  *  B  *                  *  S  *  B  *
*  *  o  *                  *  c  *  o  *
*  *  r  *      Content     *  r  *  r  *
*  *  d  *                  *  o  *  d  *
*  *  e  *                  *  l  *  e  *
*  *  r  ********************  l  *  r  *
*  *     *        Scroll          *     *
*  *     **************************     *
*  *              Border                *
*  **************************************
*
*/
/**
* Get visible area of element
*/
function getVisibleArea(initArea, scrollerList) {
	var visibleArea = _objectSpread2({}, initArea);
	(scrollerList || []).forEach(function(ele) {
		if (ele instanceof HTMLBodyElement || ele instanceof HTMLHtmlElement) return;
		var _getWin$getComputedSt2 = getWin(ele).getComputedStyle(ele), overflow = _getWin$getComputedSt2.overflow, overflowClipMargin = _getWin$getComputedSt2.overflowClipMargin, borderTopWidth = _getWin$getComputedSt2.borderTopWidth, borderBottomWidth = _getWin$getComputedSt2.borderBottomWidth, borderLeftWidth = _getWin$getComputedSt2.borderLeftWidth, borderRightWidth = _getWin$getComputedSt2.borderRightWidth;
		var eleRect = ele.getBoundingClientRect();
		var eleOutHeight = ele.offsetHeight, eleInnerHeight = ele.clientHeight, eleOutWidth = ele.offsetWidth, eleInnerWidth = ele.clientWidth;
		var borderTopNum = getPxValue(borderTopWidth);
		var borderBottomNum = getPxValue(borderBottomWidth);
		var borderLeftNum = getPxValue(borderLeftWidth);
		var borderRightNum = getPxValue(borderRightWidth);
		var scaleX = toNum(Math.round(eleRect.width / eleOutWidth * 1e3) / 1e3);
		var scaleY = toNum(Math.round(eleRect.height / eleOutHeight * 1e3) / 1e3);
		var eleScrollWidth = (eleOutWidth - eleInnerWidth - borderLeftNum - borderRightNum) * scaleX;
		var eleScrollHeight = (eleOutHeight - eleInnerHeight - borderTopNum - borderBottomNum) * scaleY;
		var scaledBorderTopWidth = borderTopNum * scaleY;
		var scaledBorderBottomWidth = borderBottomNum * scaleY;
		var scaledBorderLeftWidth = borderLeftNum * scaleX;
		var scaledBorderRightWidth = borderRightNum * scaleX;
		var clipMarginWidth = 0;
		var clipMarginHeight = 0;
		if (overflow === "clip") {
			var clipNum = getPxValue(overflowClipMargin);
			clipMarginWidth = clipNum * scaleX;
			clipMarginHeight = clipNum * scaleY;
		}
		var eleLeft = eleRect.x + scaledBorderLeftWidth - clipMarginWidth;
		var eleTop = eleRect.y + scaledBorderTopWidth - clipMarginHeight;
		var eleRight = eleLeft + eleRect.width + 2 * clipMarginWidth - scaledBorderLeftWidth - scaledBorderRightWidth - eleScrollWidth;
		var eleBottom = eleTop + eleRect.height + 2 * clipMarginHeight - scaledBorderTopWidth - scaledBorderBottomWidth - eleScrollHeight;
		visibleArea.left = Math.max(visibleArea.left, eleLeft);
		visibleArea.top = Math.max(visibleArea.top, eleTop);
		visibleArea.right = Math.min(visibleArea.right, eleRight);
		visibleArea.bottom = Math.min(visibleArea.bottom, eleBottom);
	});
	return visibleArea;
}
//#endregion
//#region node_modules/@rc-component/trigger/es/hooks/useAlign.js
init_slicedToArray();
function getUnitOffset(size) {
	var offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
	var offsetStr = "".concat(offset);
	var cells = offsetStr.match(/^(.*)\%$/);
	if (cells) return size * (parseFloat(cells[1]) / 100);
	return parseFloat(offsetStr);
}
function getNumberOffset(rect, offset) {
	var _ref2 = _slicedToArray(offset || [], 2), offsetX = _ref2[0], offsetY = _ref2[1];
	return [getUnitOffset(rect.width, offsetX), getUnitOffset(rect.height, offsetY)];
}
function splitPoints() {
	var points = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
	return [points[0], points[1]];
}
function getAlignPoint(rect, points) {
	var topBottom = points[0];
	var leftRight = points[1];
	var x;
	var y;
	if (topBottom === "t") y = rect.y;
	else if (topBottom === "b") y = rect.y + rect.height;
	else y = rect.y + rect.height / 2;
	if (leftRight === "l") x = rect.x;
	else if (leftRight === "r") x = rect.x + rect.width;
	else x = rect.x + rect.width / 2;
	return {
		x,
		y
	};
}
function reversePoints(points, index) {
	var reverseMap = {
		t: "b",
		b: "t",
		l: "r",
		r: "l"
	};
	return points.map(function(point, i) {
		if (i === index) return reverseMap[point] || "c";
		return point;
	}).join("");
}
function useAlign(open, popupEle, target, placement, builtinPlacements, popupAlign, onPopupAlign) {
	var _React$useState2 = _slicedToArray(import_react.useState({
		ready: false,
		offsetX: 0,
		offsetY: 0,
		offsetR: 0,
		offsetB: 0,
		arrowX: 0,
		arrowY: 0,
		scaleX: 1,
		scaleY: 1,
		align: builtinPlacements[placement] || {}
	}), 2), offsetInfo = _React$useState2[0], setOffsetInfo = _React$useState2[1];
	var alignCountRef = import_react.useRef(0);
	var scrollerList = import_react.useMemo(function() {
		if (!popupEle) return [];
		return collectScroller(popupEle);
	}, [popupEle]);
	var prevFlipRef = import_react.useRef({});
	var resetFlipCache = function resetFlipCache() {
		prevFlipRef.current = {};
	};
	if (!open) resetFlipCache();
	var onAlign = useEvent(function() {
		if (popupEle && target && open) {
			var _popupElement$parentE, _popupRect$x, _popupRect$y, _popupElement$parentE2;
			var popupElement = popupEle;
			var doc = popupElement.ownerDocument;
			var win = getWin(popupElement);
			var popupPosition = win.getComputedStyle(popupElement).position;
			var originLeft = popupElement.style.left;
			var originTop = popupElement.style.top;
			var originRight = popupElement.style.right;
			var originBottom = popupElement.style.bottom;
			var originOverflow = popupElement.style.overflow;
			var placementInfo = _objectSpread2(_objectSpread2({}, builtinPlacements[placement]), popupAlign);
			var placeholderElement = doc.createElement("div");
			(_popupElement$parentE = popupElement.parentElement) === null || _popupElement$parentE === void 0 || _popupElement$parentE.appendChild(placeholderElement);
			placeholderElement.style.left = "".concat(popupElement.offsetLeft, "px");
			placeholderElement.style.top = "".concat(popupElement.offsetTop, "px");
			placeholderElement.style.position = popupPosition;
			placeholderElement.style.height = "".concat(popupElement.offsetHeight, "px");
			placeholderElement.style.width = "".concat(popupElement.offsetWidth, "px");
			popupElement.style.left = "0";
			popupElement.style.top = "0";
			popupElement.style.right = "auto";
			popupElement.style.bottom = "auto";
			popupElement.style.overflow = "hidden";
			var targetRect;
			if (Array.isArray(target)) targetRect = {
				x: target[0],
				y: target[1],
				width: 0,
				height: 0
			};
			else {
				var _rect$x, _rect$y;
				var rect = target.getBoundingClientRect();
				rect.x = (_rect$x = rect.x) !== null && _rect$x !== void 0 ? _rect$x : rect.left;
				rect.y = (_rect$y = rect.y) !== null && _rect$y !== void 0 ? _rect$y : rect.top;
				targetRect = {
					x: rect.x,
					y: rect.y,
					width: rect.width,
					height: rect.height
				};
			}
			var popupRect = popupElement.getBoundingClientRect();
			var _win$getComputedStyle2 = win.getComputedStyle(popupElement), height = _win$getComputedStyle2.height, width = _win$getComputedStyle2.width;
			popupRect.x = (_popupRect$x = popupRect.x) !== null && _popupRect$x !== void 0 ? _popupRect$x : popupRect.left;
			popupRect.y = (_popupRect$y = popupRect.y) !== null && _popupRect$y !== void 0 ? _popupRect$y : popupRect.top;
			var _doc$documentElement = doc.documentElement, clientWidth = _doc$documentElement.clientWidth, clientHeight = _doc$documentElement.clientHeight, scrollWidth = _doc$documentElement.scrollWidth, scrollHeight = _doc$documentElement.scrollHeight, scrollTop = _doc$documentElement.scrollTop, scrollLeft = _doc$documentElement.scrollLeft;
			var popupHeight = popupRect.height;
			var popupWidth = popupRect.width;
			var targetHeight = targetRect.height;
			var targetWidth = targetRect.width;
			var visibleRegion = {
				left: 0,
				top: 0,
				right: clientWidth,
				bottom: clientHeight
			};
			var scrollRegion = {
				left: -scrollLeft,
				top: -scrollTop,
				right: scrollWidth - scrollLeft,
				bottom: scrollHeight - scrollTop
			};
			var htmlRegion = placementInfo.htmlRegion;
			var VISIBLE = "visible";
			var VISIBLE_FIRST = "visibleFirst";
			if (htmlRegion !== "scroll" && htmlRegion !== VISIBLE_FIRST) htmlRegion = VISIBLE;
			var isVisibleFirst = htmlRegion === VISIBLE_FIRST;
			var scrollRegionArea = getVisibleArea(scrollRegion, scrollerList);
			var visibleRegionArea = getVisibleArea(visibleRegion, scrollerList);
			var visibleArea = htmlRegion === VISIBLE ? visibleRegionArea : scrollRegionArea;
			var adjustCheckVisibleArea = isVisibleFirst ? visibleRegionArea : visibleArea;
			popupElement.style.left = "auto";
			popupElement.style.top = "auto";
			popupElement.style.right = "0";
			popupElement.style.bottom = "0";
			var popupMirrorRect = popupElement.getBoundingClientRect();
			popupElement.style.left = originLeft;
			popupElement.style.top = originTop;
			popupElement.style.right = originRight;
			popupElement.style.bottom = originBottom;
			popupElement.style.overflow = originOverflow;
			(_popupElement$parentE2 = popupElement.parentElement) === null || _popupElement$parentE2 === void 0 || _popupElement$parentE2.removeChild(placeholderElement);
			var _scaleX = toNum(Math.round(popupWidth / parseFloat(width) * 1e3) / 1e3);
			var _scaleY = toNum(Math.round(popupHeight / parseFloat(height) * 1e3) / 1e3);
			if (_scaleX === 0 || _scaleY === 0 || isDOM(target) && !isVisible_default(target)) return;
			var offset = placementInfo.offset, targetOffset = placementInfo.targetOffset;
			var _getNumberOffset2 = _slicedToArray(getNumberOffset(popupRect, offset), 2), popupOffsetX = _getNumberOffset2[0], popupOffsetY = _getNumberOffset2[1];
			var _getNumberOffset4 = _slicedToArray(getNumberOffset(targetRect, targetOffset), 2), targetOffsetX = _getNumberOffset4[0], targetOffsetY = _getNumberOffset4[1];
			targetRect.x -= targetOffsetX;
			targetRect.y -= targetOffsetY;
			var _ref4 = _slicedToArray(placementInfo.points || [], 2), popupPoint = _ref4[0], targetPoint = _ref4[1];
			var targetPoints = splitPoints(targetPoint);
			var popupPoints = splitPoints(popupPoint);
			var targetAlignPoint = getAlignPoint(targetRect, targetPoints);
			var popupAlignPoint = getAlignPoint(popupRect, popupPoints);
			var nextAlignInfo = _objectSpread2({}, placementInfo);
			var nextOffsetX = targetAlignPoint.x - popupAlignPoint.x + popupOffsetX;
			var nextOffsetY = targetAlignPoint.y - popupAlignPoint.y + popupOffsetY;
			function getIntersectionVisibleArea(offsetX, offsetY) {
				var area = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : visibleArea;
				var l = popupRect.x + offsetX;
				var t = popupRect.y + offsetY;
				var r = l + popupWidth;
				var b = t + popupHeight;
				var visibleL = Math.max(l, area.left);
				var visibleT = Math.max(t, area.top);
				var visibleR = Math.min(r, area.right);
				var visibleB = Math.min(b, area.bottom);
				return Math.max(0, (visibleR - visibleL) * (visibleB - visibleT));
			}
			var originIntersectionVisibleArea = getIntersectionVisibleArea(nextOffsetX, nextOffsetY);
			var originIntersectionRecommendArea = getIntersectionVisibleArea(nextOffsetX, nextOffsetY, visibleRegionArea);
			var targetAlignPointTL = getAlignPoint(targetRect, ["t", "l"]);
			var popupAlignPointTL = getAlignPoint(popupRect, ["t", "l"]);
			var targetAlignPointBR = getAlignPoint(targetRect, ["b", "r"]);
			var popupAlignPointBR = getAlignPoint(popupRect, ["b", "r"]);
			var overflow = placementInfo.overflow || {};
			var adjustX = overflow.adjustX, adjustY = overflow.adjustY, shiftX = overflow.shiftX, shiftY = overflow.shiftY;
			var supportAdjust = function supportAdjust(val) {
				if (typeof val === "boolean") return val;
				return val >= 0;
			};
			var nextPopupY;
			var nextPopupBottom;
			var nextPopupX;
			var nextPopupRight;
			function syncNextPopupPosition() {
				nextPopupY = popupRect.y + nextOffsetY;
				nextPopupBottom = nextPopupY + popupHeight;
				nextPopupX = popupRect.x + nextOffsetX;
				nextPopupRight = nextPopupX + popupWidth;
			}
			syncNextPopupPosition();
			var needAdjustY = supportAdjust(adjustY);
			var sameTB = popupPoints[0] === targetPoints[0];
			if (needAdjustY && popupPoints[0] === "t" && (nextPopupBottom > adjustCheckVisibleArea.bottom || prevFlipRef.current.bt)) {
				var tmpNextOffsetY = nextOffsetY;
				if (sameTB) tmpNextOffsetY -= popupHeight - targetHeight;
				else tmpNextOffsetY = targetAlignPointTL.y - popupAlignPointBR.y - popupOffsetY;
				var newVisibleArea = getIntersectionVisibleArea(nextOffsetX, tmpNextOffsetY);
				var newVisibleRecommendArea = getIntersectionVisibleArea(nextOffsetX, tmpNextOffsetY, visibleRegionArea);
				if (newVisibleArea > originIntersectionVisibleArea || newVisibleArea === originIntersectionVisibleArea && (!isVisibleFirst || newVisibleRecommendArea >= originIntersectionRecommendArea)) {
					prevFlipRef.current.bt = true;
					nextOffsetY = tmpNextOffsetY;
					popupOffsetY = -popupOffsetY;
					nextAlignInfo.points = [reversePoints(popupPoints, 0), reversePoints(targetPoints, 0)];
				} else prevFlipRef.current.bt = false;
			}
			if (needAdjustY && popupPoints[0] === "b" && (nextPopupY < adjustCheckVisibleArea.top || prevFlipRef.current.tb)) {
				var _tmpNextOffsetY = nextOffsetY;
				if (sameTB) _tmpNextOffsetY += popupHeight - targetHeight;
				else _tmpNextOffsetY = targetAlignPointBR.y - popupAlignPointTL.y - popupOffsetY;
				var _newVisibleArea = getIntersectionVisibleArea(nextOffsetX, _tmpNextOffsetY);
				var _newVisibleRecommendArea = getIntersectionVisibleArea(nextOffsetX, _tmpNextOffsetY, visibleRegionArea);
				if (_newVisibleArea > originIntersectionVisibleArea || _newVisibleArea === originIntersectionVisibleArea && (!isVisibleFirst || _newVisibleRecommendArea >= originIntersectionRecommendArea)) {
					prevFlipRef.current.tb = true;
					nextOffsetY = _tmpNextOffsetY;
					popupOffsetY = -popupOffsetY;
					nextAlignInfo.points = [reversePoints(popupPoints, 0), reversePoints(targetPoints, 0)];
				} else prevFlipRef.current.tb = false;
			}
			var needAdjustX = supportAdjust(adjustX);
			var sameLR = popupPoints[1] === targetPoints[1];
			if (needAdjustX && popupPoints[1] === "l" && (nextPopupRight > adjustCheckVisibleArea.right || prevFlipRef.current.rl)) {
				var tmpNextOffsetX = nextOffsetX;
				if (sameLR) tmpNextOffsetX -= popupWidth - targetWidth;
				else tmpNextOffsetX = targetAlignPointTL.x - popupAlignPointBR.x - popupOffsetX;
				var _newVisibleArea2 = getIntersectionVisibleArea(tmpNextOffsetX, nextOffsetY);
				var _newVisibleRecommendArea2 = getIntersectionVisibleArea(tmpNextOffsetX, nextOffsetY, visibleRegionArea);
				if (_newVisibleArea2 > originIntersectionVisibleArea || _newVisibleArea2 === originIntersectionVisibleArea && (!isVisibleFirst || _newVisibleRecommendArea2 >= originIntersectionRecommendArea)) {
					prevFlipRef.current.rl = true;
					nextOffsetX = tmpNextOffsetX;
					popupOffsetX = -popupOffsetX;
					nextAlignInfo.points = [reversePoints(popupPoints, 1), reversePoints(targetPoints, 1)];
				} else prevFlipRef.current.rl = false;
			}
			if (needAdjustX && popupPoints[1] === "r" && (nextPopupX < adjustCheckVisibleArea.left || prevFlipRef.current.lr)) {
				var _tmpNextOffsetX = nextOffsetX;
				if (sameLR) _tmpNextOffsetX += popupWidth - targetWidth;
				else _tmpNextOffsetX = targetAlignPointBR.x - popupAlignPointTL.x - popupOffsetX;
				var _newVisibleArea3 = getIntersectionVisibleArea(_tmpNextOffsetX, nextOffsetY);
				var _newVisibleRecommendArea3 = getIntersectionVisibleArea(_tmpNextOffsetX, nextOffsetY, visibleRegionArea);
				if (_newVisibleArea3 > originIntersectionVisibleArea || _newVisibleArea3 === originIntersectionVisibleArea && (!isVisibleFirst || _newVisibleRecommendArea3 >= originIntersectionRecommendArea)) {
					prevFlipRef.current.lr = true;
					nextOffsetX = _tmpNextOffsetX;
					popupOffsetX = -popupOffsetX;
					nextAlignInfo.points = [reversePoints(popupPoints, 1), reversePoints(targetPoints, 1)];
				} else prevFlipRef.current.lr = false;
			}
			syncNextPopupPosition();
			var numShiftX = shiftX === true ? 0 : shiftX;
			if (typeof numShiftX === "number") {
				if (nextPopupX < visibleRegionArea.left) {
					nextOffsetX -= nextPopupX - visibleRegionArea.left - popupOffsetX;
					if (targetRect.x + targetWidth < visibleRegionArea.left + numShiftX) nextOffsetX += targetRect.x - visibleRegionArea.left + targetWidth - numShiftX;
				}
				if (nextPopupRight > visibleRegionArea.right) {
					nextOffsetX -= nextPopupRight - visibleRegionArea.right - popupOffsetX;
					if (targetRect.x > visibleRegionArea.right - numShiftX) nextOffsetX += targetRect.x - visibleRegionArea.right + numShiftX;
				}
			}
			var numShiftY = shiftY === true ? 0 : shiftY;
			if (typeof numShiftY === "number") {
				if (nextPopupY < visibleRegionArea.top) {
					nextOffsetY -= nextPopupY - visibleRegionArea.top - popupOffsetY;
					if (targetRect.y + targetHeight < visibleRegionArea.top + numShiftY) nextOffsetY += targetRect.y - visibleRegionArea.top + targetHeight - numShiftY;
				}
				if (nextPopupBottom > visibleRegionArea.bottom) {
					nextOffsetY -= nextPopupBottom - visibleRegionArea.bottom - popupOffsetY;
					if (targetRect.y > visibleRegionArea.bottom - numShiftY) nextOffsetY += targetRect.y - visibleRegionArea.bottom + numShiftY;
				}
			}
			var popupLeft = popupRect.x + nextOffsetX;
			var popupRight = popupLeft + popupWidth;
			var popupTop = popupRect.y + nextOffsetY;
			var popupBottom = popupTop + popupHeight;
			var targetLeft = targetRect.x;
			var targetRight = targetLeft + targetWidth;
			var targetTop = targetRect.y;
			var targetBottom = targetTop + targetHeight;
			var nextArrowX = (Math.max(popupLeft, targetLeft) + Math.min(popupRight, targetRight)) / 2 - popupLeft;
			var nextArrowY = (Math.max(popupTop, targetTop) + Math.min(popupBottom, targetBottom)) / 2 - popupTop;
			onPopupAlign === null || onPopupAlign === void 0 || onPopupAlign(popupEle, nextAlignInfo);
			var offsetX4Right = popupMirrorRect.right - popupRect.x - (nextOffsetX + popupRect.width);
			var offsetY4Bottom = popupMirrorRect.bottom - popupRect.y - (nextOffsetY + popupRect.height);
			if (_scaleX === 1) {
				nextOffsetX = Math.round(nextOffsetX);
				offsetX4Right = Math.round(offsetX4Right);
			}
			if (_scaleY === 1) {
				nextOffsetY = Math.round(nextOffsetY);
				offsetY4Bottom = Math.round(offsetY4Bottom);
			}
			setOffsetInfo({
				ready: true,
				offsetX: nextOffsetX / _scaleX,
				offsetY: nextOffsetY / _scaleY,
				offsetR: offsetX4Right / _scaleX,
				offsetB: offsetY4Bottom / _scaleY,
				arrowX: nextArrowX / _scaleX,
				arrowY: nextArrowY / _scaleY,
				scaleX: _scaleX,
				scaleY: _scaleY,
				align: nextAlignInfo
			});
		}
	});
	var triggerAlign = function triggerAlign() {
		alignCountRef.current += 1;
		var id = alignCountRef.current;
		Promise.resolve().then(function() {
			if (alignCountRef.current === id) onAlign();
		});
	};
	var resetReady = function resetReady() {
		setOffsetInfo(function(ori) {
			return _objectSpread2(_objectSpread2({}, ori), {}, { ready: false });
		});
	};
	useLayoutEffect$1(resetReady, [placement]);
	useLayoutEffect$1(function() {
		if (!open) resetReady();
	}, [open]);
	return [
		offsetInfo.ready,
		offsetInfo.offsetX,
		offsetInfo.offsetY,
		offsetInfo.offsetR,
		offsetInfo.offsetB,
		offsetInfo.arrowX,
		offsetInfo.arrowY,
		offsetInfo.scaleX,
		offsetInfo.scaleY,
		offsetInfo.align,
		triggerAlign
	];
}
//#endregion
//#region node_modules/@rc-component/trigger/es/hooks/useWatch.js
init_toConsumableArray();
function useWatch(open, target, popup, onAlign, onScroll) {
	useLayoutEffect$1(function() {
		if (open && target && popup) {
			var targetElement = target;
			var popupElement = popup;
			var targetScrollList = collectScroller(targetElement);
			var popupScrollList = collectScroller(popupElement);
			var win = getWin(popupElement);
			var mergedList = new Set([win].concat(_toConsumableArray(targetScrollList), _toConsumableArray(popupScrollList)));
			function notifyScroll() {
				onAlign();
				onScroll();
			}
			mergedList.forEach(function(scroller) {
				scroller.addEventListener("scroll", notifyScroll, { passive: true });
			});
			win.addEventListener("resize", notifyScroll, { passive: true });
			onAlign();
			return function() {
				mergedList.forEach(function(scroller) {
					scroller.removeEventListener("scroll", notifyScroll);
					win.removeEventListener("resize", notifyScroll);
				});
			};
		}
	}, [
		open,
		target,
		popup
	]);
}
//#endregion
//#region node_modules/@rc-component/trigger/es/hooks/useWinClick.js
function useWinClick(open, clickToHide, targetEle, popupEle, mask, maskClosable, inPopupOrChild, triggerOpen) {
	var openRef = import_react.useRef(open);
	openRef.current = open;
	var popupPointerDownRef = import_react.useRef(false);
	import_react.useEffect(function() {
		if (clickToHide && popupEle && (!mask || maskClosable)) {
			var onPointerDown = function onPointerDown() {
				popupPointerDownRef.current = false;
			};
			var onTriggerClose = function onTriggerClose(e) {
				var _e$composedPath;
				if (openRef.current && !inPopupOrChild(((_e$composedPath = e.composedPath) === null || _e$composedPath === void 0 || (_e$composedPath = _e$composedPath.call(e)) === null || _e$composedPath === void 0 ? void 0 : _e$composedPath[0]) || e.target) && !popupPointerDownRef.current) triggerOpen(false);
			};
			var win = getWin(popupEle);
			win.addEventListener("pointerdown", onPointerDown, true);
			win.addEventListener("mousedown", onTriggerClose, true);
			win.addEventListener("contextmenu", onTriggerClose, true);
			var targetShadowRoot = getShadowRoot(targetEle);
			if (targetShadowRoot) {
				targetShadowRoot.addEventListener("mousedown", onTriggerClose, true);
				targetShadowRoot.addEventListener("contextmenu", onTriggerClose, true);
			}
			var _targetEle$getRootNod, _popupEle$getRootNode;
			warning((targetEle === null || targetEle === void 0 || (_targetEle$getRootNod = targetEle.getRootNode) === null || _targetEle$getRootNod === void 0 ? void 0 : _targetEle$getRootNod.call(targetEle)) === ((_popupEle$getRootNode = popupEle.getRootNode) === null || _popupEle$getRootNode === void 0 ? void 0 : _popupEle$getRootNode.call(popupEle)), "trigger element and popup element should in same shadow root.");
			return function() {
				win.removeEventListener("pointerdown", onPointerDown, true);
				win.removeEventListener("mousedown", onTriggerClose, true);
				win.removeEventListener("contextmenu", onTriggerClose, true);
				if (targetShadowRoot) {
					targetShadowRoot.removeEventListener("mousedown", onTriggerClose, true);
					targetShadowRoot.removeEventListener("contextmenu", onTriggerClose, true);
				}
			};
		}
	}, [
		clickToHide,
		targetEle,
		popupEle,
		mask,
		maskClosable
	]);
	function onPopupPointerDown() {
		popupPointerDownRef.current = true;
	}
	return onPopupPointerDown;
}
//#endregion
//#region node_modules/@rc-component/trigger/es/index.js
init_slicedToArray();
init_objectWithoutProperties();
var _excluded$6 = [
	"prefixCls",
	"children",
	"action",
	"showAction",
	"hideAction",
	"popupVisible",
	"defaultPopupVisible",
	"onPopupVisibleChange",
	"afterPopupVisibleChange",
	"mouseEnterDelay",
	"mouseLeaveDelay",
	"focusDelay",
	"blurDelay",
	"mask",
	"maskClosable",
	"getPopupContainer",
	"forceRender",
	"autoDestroy",
	"destroyPopupOnHide",
	"popup",
	"popupClassName",
	"popupStyle",
	"popupPlacement",
	"builtinPlacements",
	"popupAlign",
	"zIndex",
	"stretch",
	"getPopupClassNameFromAlign",
	"fresh",
	"alignPoint",
	"onPopupClick",
	"onPopupAlign",
	"arrow",
	"popupMotion",
	"maskMotion",
	"popupTransitionName",
	"popupAnimation",
	"maskTransitionName",
	"maskAnimation",
	"className",
	"getTriggerDOMNode"
];
function generateTrigger() {
	var PortalComponent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : es_default$5;
	var Trigger = /*#__PURE__*/ import_react.forwardRef(function(props, ref) {
		var _props$prefixCls = props.prefixCls, prefixCls = _props$prefixCls === void 0 ? "rc-trigger-popup" : _props$prefixCls, children = props.children, _props$action = props.action, action = _props$action === void 0 ? "hover" : _props$action, showAction = props.showAction, hideAction = props.hideAction, popupVisible = props.popupVisible, defaultPopupVisible = props.defaultPopupVisible, onPopupVisibleChange = props.onPopupVisibleChange, afterPopupVisibleChange = props.afterPopupVisibleChange, mouseEnterDelay = props.mouseEnterDelay, _props$mouseLeaveDela = props.mouseLeaveDelay, mouseLeaveDelay = _props$mouseLeaveDela === void 0 ? .1 : _props$mouseLeaveDela, focusDelay = props.focusDelay, blurDelay = props.blurDelay, mask = props.mask, _props$maskClosable = props.maskClosable, maskClosable = _props$maskClosable === void 0 ? true : _props$maskClosable, getPopupContainer = props.getPopupContainer, forceRender = props.forceRender, autoDestroy = props.autoDestroy, destroyPopupOnHide = props.destroyPopupOnHide, popup = props.popup, popupClassName = props.popupClassName, popupStyle = props.popupStyle, popupPlacement = props.popupPlacement, _props$builtinPlaceme = props.builtinPlacements, builtinPlacements = _props$builtinPlaceme === void 0 ? {} : _props$builtinPlaceme, popupAlign = props.popupAlign, zIndex = props.zIndex, stretch = props.stretch, getPopupClassNameFromAlign = props.getPopupClassNameFromAlign, fresh = props.fresh, alignPoint = props.alignPoint, onPopupClick = props.onPopupClick, onPopupAlign = props.onPopupAlign, arrow = props.arrow, popupMotion = props.popupMotion, maskMotion = props.maskMotion, popupTransitionName = props.popupTransitionName, popupAnimation = props.popupAnimation, maskTransitionName = props.maskTransitionName, maskAnimation = props.maskAnimation, className = props.className, getTriggerDOMNode = props.getTriggerDOMNode, restProps = _objectWithoutProperties(props, _excluded$6);
		var mergedAutoDestroy = autoDestroy || destroyPopupOnHide || false;
		var _React$useState2 = _slicedToArray(import_react.useState(false), 2), mobile = _React$useState2[0], setMobile = _React$useState2[1];
		useLayoutEffect$1(function() {
			setMobile(isMobile_default());
		}, []);
		var subPopupElements = import_react.useRef({});
		var parentContext = import_react.useContext(TriggerContext);
		var context = import_react.useMemo(function() {
			return { registerSubPopup: function registerSubPopup(id, subPopupEle) {
				subPopupElements.current[id] = subPopupEle;
				parentContext === null || parentContext === void 0 || parentContext.registerSubPopup(id, subPopupEle);
			} };
		}, [parentContext]);
		var id = useId_default();
		var _React$useState4 = _slicedToArray(import_react.useState(null), 2), popupEle = _React$useState4[0], setPopupEle = _React$useState4[1];
		var externalPopupRef = import_react.useRef(null);
		var setPopupRef = useEvent(function(node) {
			externalPopupRef.current = node;
			if (isDOM(node) && popupEle !== node) setPopupEle(node);
			parentContext === null || parentContext === void 0 || parentContext.registerSubPopup(id, node);
		});
		var _React$useState6 = _slicedToArray(import_react.useState(null), 2), targetEle = _React$useState6[0], setTargetEle = _React$useState6[1];
		var externalForwardRef = import_react.useRef(null);
		var setTargetRef = useEvent(function(node) {
			if (isDOM(node) && targetEle !== node) {
				setTargetEle(node);
				externalForwardRef.current = node;
			}
		});
		var child = import_react.Children.only(children);
		var originChildProps = (child === null || child === void 0 ? void 0 : child.props) || {};
		var cloneProps = {};
		var inPopupOrChild = useEvent(function(ele) {
			var _getShadowRoot, _getShadowRoot2;
			var childDOM = targetEle;
			return (childDOM === null || childDOM === void 0 ? void 0 : childDOM.contains(ele)) || ((_getShadowRoot = getShadowRoot(childDOM)) === null || _getShadowRoot === void 0 ? void 0 : _getShadowRoot.host) === ele || ele === childDOM || (popupEle === null || popupEle === void 0 ? void 0 : popupEle.contains(ele)) || ((_getShadowRoot2 = getShadowRoot(popupEle)) === null || _getShadowRoot2 === void 0 ? void 0 : _getShadowRoot2.host) === ele || ele === popupEle || Object.values(subPopupElements.current).some(function(subPopupEle) {
				return (subPopupEle === null || subPopupEle === void 0 ? void 0 : subPopupEle.contains(ele)) || ele === subPopupEle;
			});
		});
		var mergePopupMotion = getMotion(prefixCls, popupMotion, popupAnimation, popupTransitionName);
		var mergeMaskMotion = getMotion(prefixCls, maskMotion, maskAnimation, maskTransitionName);
		var _React$useState8 = _slicedToArray(import_react.useState(defaultPopupVisible || false), 2), internalOpen = _React$useState8[0], setInternalOpen = _React$useState8[1];
		var mergedOpen = popupVisible !== null && popupVisible !== void 0 ? popupVisible : internalOpen;
		var setMergedOpen = useEvent(function(nextOpen) {
			if (popupVisible === void 0) setInternalOpen(nextOpen);
		});
		useLayoutEffect$1(function() {
			setInternalOpen(popupVisible || false);
		}, [popupVisible]);
		var openRef = import_react.useRef(mergedOpen);
		openRef.current = mergedOpen;
		var lastTriggerRef = import_react.useRef([]);
		lastTriggerRef.current = [];
		var internalTriggerOpen = useEvent(function(nextOpen) {
			var _lastTriggerRef$curre;
			setMergedOpen(nextOpen);
			if (((_lastTriggerRef$curre = lastTriggerRef.current[lastTriggerRef.current.length - 1]) !== null && _lastTriggerRef$curre !== void 0 ? _lastTriggerRef$curre : mergedOpen) !== nextOpen) {
				lastTriggerRef.current.push(nextOpen);
				onPopupVisibleChange === null || onPopupVisibleChange === void 0 || onPopupVisibleChange(nextOpen);
			}
		});
		var delayRef = import_react.useRef();
		var clearDelay = function clearDelay() {
			clearTimeout(delayRef.current);
		};
		var triggerOpen = function triggerOpen(nextOpen) {
			var delay = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
			clearDelay();
			if (delay === 0) internalTriggerOpen(nextOpen);
			else delayRef.current = setTimeout(function() {
				internalTriggerOpen(nextOpen);
			}, delay * 1e3);
		};
		import_react.useEffect(function() {
			return clearDelay;
		}, []);
		var _React$useState10 = _slicedToArray(import_react.useState(false), 2), inMotion = _React$useState10[0], setInMotion = _React$useState10[1];
		useLayoutEffect$1(function(firstMount) {
			if (!firstMount || mergedOpen) setInMotion(true);
		}, [mergedOpen]);
		var _React$useState12 = _slicedToArray(import_react.useState(null), 2), motionPrepareResolve = _React$useState12[0], setMotionPrepareResolve = _React$useState12[1];
		var _React$useState14 = _slicedToArray(import_react.useState(null), 2), mousePos = _React$useState14[0], setMousePos = _React$useState14[1];
		var setMousePosByEvent = function setMousePosByEvent(event) {
			setMousePos([event.clientX, event.clientY]);
		};
		var _useAlign2 = _slicedToArray(useAlign(mergedOpen, popupEle, alignPoint && mousePos !== null ? mousePos : targetEle, popupPlacement, builtinPlacements, popupAlign, onPopupAlign), 11), ready = _useAlign2[0], offsetX = _useAlign2[1], offsetY = _useAlign2[2], offsetR = _useAlign2[3], offsetB = _useAlign2[4], arrowX = _useAlign2[5], arrowY = _useAlign2[6], scaleX = _useAlign2[7], scaleY = _useAlign2[8], alignInfo = _useAlign2[9], onAlign = _useAlign2[10];
		var _useAction2 = _slicedToArray(useAction(mobile, action, showAction, hideAction), 2), showActions = _useAction2[0], hideActions = _useAction2[1];
		var clickToShow = showActions.has("click");
		var clickToHide = hideActions.has("click") || hideActions.has("contextMenu");
		var triggerAlign = useEvent(function() {
			if (!inMotion) onAlign();
		});
		useWatch(mergedOpen, targetEle, popupEle, triggerAlign, function onScroll() {
			if (openRef.current && alignPoint && clickToHide) triggerOpen(false);
		});
		useLayoutEffect$1(function() {
			triggerAlign();
		}, [mousePos, popupPlacement]);
		useLayoutEffect$1(function() {
			if (mergedOpen && !(builtinPlacements !== null && builtinPlacements !== void 0 && builtinPlacements[popupPlacement])) triggerAlign();
		}, [JSON.stringify(popupAlign)]);
		var alignedClassName = import_react.useMemo(function() {
			return (0, import_classnames.default)(getAlignPopupClassName(builtinPlacements, prefixCls, alignInfo, alignPoint), getPopupClassNameFromAlign === null || getPopupClassNameFromAlign === void 0 ? void 0 : getPopupClassNameFromAlign(alignInfo));
		}, [
			alignInfo,
			getPopupClassNameFromAlign,
			builtinPlacements,
			prefixCls,
			alignPoint
		]);
		import_react.useImperativeHandle(ref, function() {
			return {
				nativeElement: externalForwardRef.current,
				popupElement: externalPopupRef.current,
				forceAlign: triggerAlign
			};
		});
		var _React$useState16 = _slicedToArray(import_react.useState(0), 2), targetWidth = _React$useState16[0], setTargetWidth = _React$useState16[1];
		var _React$useState18 = _slicedToArray(import_react.useState(0), 2), targetHeight = _React$useState18[0], setTargetHeight = _React$useState18[1];
		var syncTargetSize = function syncTargetSize() {
			if (stretch && targetEle) {
				var rect = targetEle.getBoundingClientRect();
				setTargetWidth(rect.width);
				setTargetHeight(rect.height);
			}
		};
		var onTargetResize = function onTargetResize() {
			syncTargetSize();
			triggerAlign();
		};
		var onVisibleChanged = function onVisibleChanged(visible) {
			setInMotion(false);
			onAlign();
			afterPopupVisibleChange === null || afterPopupVisibleChange === void 0 || afterPopupVisibleChange(visible);
		};
		var onPrepare = function onPrepare() {
			return new Promise(function(resolve) {
				syncTargetSize();
				setMotionPrepareResolve(function() {
					return resolve;
				});
			});
		};
		useLayoutEffect$1(function() {
			if (motionPrepareResolve) {
				onAlign();
				motionPrepareResolve();
				setMotionPrepareResolve(null);
			}
		}, [motionPrepareResolve]);
		/**
		* Util wrapper for trigger action
		*/
		function wrapperAction(eventName, nextOpen, delay, preEvent) {
			cloneProps[eventName] = function(event) {
				var _originChildProps$eve;
				preEvent === null || preEvent === void 0 || preEvent(event);
				triggerOpen(nextOpen, delay);
				for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) args[_key - 1] = arguments[_key];
				(_originChildProps$eve = originChildProps[eventName]) === null || _originChildProps$eve === void 0 || _originChildProps$eve.call.apply(_originChildProps$eve, [originChildProps, event].concat(args));
			};
		}
		if (clickToShow || clickToHide) cloneProps.onClick = function(event) {
			var _originChildProps$onC;
			if (openRef.current && clickToHide) triggerOpen(false);
			else if (!openRef.current && clickToShow) {
				setMousePosByEvent(event);
				triggerOpen(true);
			}
			for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) args[_key2 - 1] = arguments[_key2];
			(_originChildProps$onC = originChildProps.onClick) === null || _originChildProps$onC === void 0 || _originChildProps$onC.call.apply(_originChildProps$onC, [originChildProps, event].concat(args));
		};
		var onPopupPointerDown = useWinClick(mergedOpen, clickToHide, targetEle, popupEle, mask, maskClosable, inPopupOrChild, triggerOpen);
		var hoverToShow = showActions.has("hover");
		var hoverToHide = hideActions.has("hover");
		var onPopupMouseEnter;
		var onPopupMouseLeave;
		if (hoverToShow) {
			wrapperAction("onMouseEnter", true, mouseEnterDelay, function(event) {
				setMousePosByEvent(event);
			});
			wrapperAction("onPointerEnter", true, mouseEnterDelay, function(event) {
				setMousePosByEvent(event);
			});
			onPopupMouseEnter = function onPopupMouseEnter(event) {
				if ((mergedOpen || inMotion) && popupEle !== null && popupEle !== void 0 && popupEle.contains(event.target)) triggerOpen(true, mouseEnterDelay);
			};
			if (alignPoint) cloneProps.onMouseMove = function(event) {
				var _originChildProps$onM;
				(_originChildProps$onM = originChildProps.onMouseMove) === null || _originChildProps$onM === void 0 || _originChildProps$onM.call(originChildProps, event);
			};
		}
		if (hoverToHide) {
			wrapperAction("onMouseLeave", false, mouseLeaveDelay);
			wrapperAction("onPointerLeave", false, mouseLeaveDelay);
			onPopupMouseLeave = function onPopupMouseLeave() {
				triggerOpen(false, mouseLeaveDelay);
			};
		}
		if (showActions.has("focus")) wrapperAction("onFocus", true, focusDelay);
		if (hideActions.has("focus")) wrapperAction("onBlur", false, blurDelay);
		if (showActions.has("contextMenu")) cloneProps.onContextMenu = function(event) {
			var _originChildProps$onC2;
			if (openRef.current && hideActions.has("contextMenu")) triggerOpen(false);
			else {
				setMousePosByEvent(event);
				triggerOpen(true);
			}
			event.preventDefault();
			for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) args[_key3 - 1] = arguments[_key3];
			(_originChildProps$onC2 = originChildProps.onContextMenu) === null || _originChildProps$onC2 === void 0 || _originChildProps$onC2.call.apply(_originChildProps$onC2, [originChildProps, event].concat(args));
		};
		if (className) cloneProps.className = (0, import_classnames.default)(originChildProps.className, className);
		var renderedRef = import_react.useRef(false);
		renderedRef.current || (renderedRef.current = forceRender || mergedOpen || inMotion);
		var mergedChildrenProps = _objectSpread2(_objectSpread2({}, originChildProps), cloneProps);
		var passedProps = {};
		[
			"onContextMenu",
			"onClick",
			"onMouseDown",
			"onTouchStart",
			"onMouseEnter",
			"onMouseLeave",
			"onFocus",
			"onBlur"
		].forEach(function(eventName) {
			if (restProps[eventName]) passedProps[eventName] = function() {
				var _mergedChildrenProps$;
				for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) args[_key4] = arguments[_key4];
				(_mergedChildrenProps$ = mergedChildrenProps[eventName]) === null || _mergedChildrenProps$ === void 0 || _mergedChildrenProps$.call.apply(_mergedChildrenProps$, [mergedChildrenProps].concat(args));
				restProps[eventName].apply(restProps, args);
			};
		});
		var triggerNode = /*#__PURE__*/ import_react.cloneElement(child, _objectSpread2(_objectSpread2({}, mergedChildrenProps), passedProps));
		var arrowPos = {
			x: arrowX,
			y: arrowY
		};
		var innerArrow = arrow ? _objectSpread2({}, arrow !== true ? arrow : {}) : null;
		return /*#__PURE__*/ import_react.createElement(import_react.Fragment, null, /*#__PURE__*/ import_react.createElement(RefResizeObserver, {
			disabled: !mergedOpen,
			ref: setTargetRef,
			onResize: onTargetResize
		}, /*#__PURE__*/ import_react.createElement(TriggerWrapper, { getTriggerDOMNode }, triggerNode)), renderedRef.current && /*#__PURE__*/ import_react.createElement(TriggerContext.Provider, { value: context }, /*#__PURE__*/ import_react.createElement(Popup, {
			portal: PortalComponent,
			ref: setPopupRef,
			prefixCls,
			popup,
			className: (0, import_classnames.default)(popupClassName, alignedClassName),
			style: popupStyle,
			target: targetEle,
			onMouseEnter: onPopupMouseEnter,
			onMouseLeave: onPopupMouseLeave,
			onPointerEnter: onPopupMouseEnter,
			zIndex,
			open: mergedOpen,
			keepDom: inMotion,
			fresh,
			onClick: onPopupClick,
			onPointerDownCapture: onPopupPointerDown,
			mask,
			motion: mergePopupMotion,
			maskMotion: mergeMaskMotion,
			onVisibleChanged,
			onPrepare,
			forceRender,
			autoDestroy: mergedAutoDestroy,
			getPopupContainer,
			align: alignInfo,
			arrow: innerArrow,
			arrowPos,
			ready,
			offsetX,
			offsetY,
			offsetR,
			offsetB,
			onAlign: triggerAlign,
			stretch,
			targetWidth: targetWidth / scaleX,
			targetHeight: targetHeight / scaleY
		})));
	});
	Trigger.displayName = "Trigger";
	return Trigger;
}
var es_default$2 = generateTrigger(es_default$5);
//#endregion
//#region node_modules/rc-select/es/SelectTrigger.js
init_extends();
init_defineProperty();
init_objectWithoutProperties();
var _excluded$5 = [
	"prefixCls",
	"disabled",
	"visible",
	"children",
	"popupElement",
	"animation",
	"transitionName",
	"dropdownStyle",
	"dropdownClassName",
	"direction",
	"placement",
	"builtinPlacements",
	"dropdownMatchSelectWidth",
	"dropdownRender",
	"dropdownAlign",
	"getPopupContainer",
	"empty",
	"getTriggerDOMNode",
	"onPopupVisibleChange",
	"onPopupMouseEnter"
];
var getBuiltInPlacements$1 = function getBuiltInPlacements(dropdownMatchSelectWidth) {
	var adjustX = dropdownMatchSelectWidth === true ? 0 : 1;
	return {
		bottomLeft: {
			points: ["tl", "bl"],
			offset: [0, 4],
			overflow: {
				adjustX,
				adjustY: 1
			},
			htmlRegion: "scroll"
		},
		bottomRight: {
			points: ["tr", "br"],
			offset: [0, 4],
			overflow: {
				adjustX,
				adjustY: 1
			},
			htmlRegion: "scroll"
		},
		topLeft: {
			points: ["bl", "tl"],
			offset: [0, -4],
			overflow: {
				adjustX,
				adjustY: 1
			},
			htmlRegion: "scroll"
		},
		topRight: {
			points: ["br", "tr"],
			offset: [0, -4],
			overflow: {
				adjustX,
				adjustY: 1
			},
			htmlRegion: "scroll"
		}
	};
};
var RefSelectTrigger = /*#__PURE__*/ import_react.forwardRef(function SelectTrigger(props, ref) {
	var prefixCls = props.prefixCls;
	props.disabled;
	var visible = props.visible, children = props.children, popupElement = props.popupElement, animation = props.animation, transitionName = props.transitionName, dropdownStyle = props.dropdownStyle, dropdownClassName = props.dropdownClassName, _props$direction = props.direction, direction = _props$direction === void 0 ? "ltr" : _props$direction, placement = props.placement, builtinPlacements = props.builtinPlacements, dropdownMatchSelectWidth = props.dropdownMatchSelectWidth, dropdownRender = props.dropdownRender, dropdownAlign = props.dropdownAlign, getPopupContainer = props.getPopupContainer, empty = props.empty, getTriggerDOMNode = props.getTriggerDOMNode, onPopupVisibleChange = props.onPopupVisibleChange, onPopupMouseEnter = props.onPopupMouseEnter, restProps = _objectWithoutProperties(props, _excluded$5);
	var dropdownPrefixCls = "".concat(prefixCls, "-dropdown");
	var popupNode = popupElement;
	if (dropdownRender) popupNode = dropdownRender(popupElement);
	var mergedBuiltinPlacements = import_react.useMemo(function() {
		return builtinPlacements || getBuiltInPlacements$1(dropdownMatchSelectWidth);
	}, [builtinPlacements, dropdownMatchSelectWidth]);
	var mergedTransitionName = animation ? "".concat(dropdownPrefixCls, "-").concat(animation) : transitionName;
	var isNumberPopupWidth = typeof dropdownMatchSelectWidth === "number";
	var stretch = import_react.useMemo(function() {
		if (isNumberPopupWidth) return null;
		return dropdownMatchSelectWidth === false ? "minWidth" : "width";
	}, [dropdownMatchSelectWidth, isNumberPopupWidth]);
	var popupStyle = dropdownStyle;
	if (isNumberPopupWidth) popupStyle = _objectSpread2(_objectSpread2({}, popupStyle), {}, { width: dropdownMatchSelectWidth });
	var triggerPopupRef = import_react.useRef(null);
	import_react.useImperativeHandle(ref, function() {
		return { getPopupElement: function getPopupElement() {
			var _triggerPopupRef$curr;
			return (_triggerPopupRef$curr = triggerPopupRef.current) === null || _triggerPopupRef$curr === void 0 ? void 0 : _triggerPopupRef$curr.popupElement;
		} };
	});
	return /*#__PURE__*/ import_react.createElement(es_default$2, _extends({}, restProps, {
		showAction: onPopupVisibleChange ? ["click"] : [],
		hideAction: onPopupVisibleChange ? ["click"] : [],
		popupPlacement: placement || (direction === "rtl" ? "bottomRight" : "bottomLeft"),
		builtinPlacements: mergedBuiltinPlacements,
		prefixCls: dropdownPrefixCls,
		popupTransitionName: mergedTransitionName,
		popup: /*#__PURE__*/ import_react.createElement("div", { onMouseEnter: onPopupMouseEnter }, popupNode),
		ref: triggerPopupRef,
		stretch,
		popupAlign: dropdownAlign,
		popupVisible: visible,
		getPopupContainer,
		popupClassName: (0, import_classnames.default)(dropdownClassName, _defineProperty({}, "".concat(dropdownPrefixCls, "-empty"), empty)),
		popupStyle,
		getTriggerDOMNode,
		onPopupVisibleChange
	}), children);
});
RefSelectTrigger.displayName = "SelectTrigger";
//#endregion
//#region node_modules/rc-select/es/utils/valueUtil.js
init_toConsumableArray();
function getKey(data, index) {
	var key = data.key;
	var value;
	if ("value" in data) value = data.value;
	if (key !== null && key !== void 0) return key;
	if (value !== void 0) return value;
	return "rc-index-key-".concat(index);
}
function isValidCount(value) {
	return typeof value !== "undefined" && !Number.isNaN(value);
}
function fillFieldNames(fieldNames, childrenAsData) {
	var _ref = fieldNames || {}, label = _ref.label, value = _ref.value, options = _ref.options, groupLabel = _ref.groupLabel;
	var mergedLabel = label || (childrenAsData ? "children" : "label");
	return {
		label: mergedLabel,
		value: value || "value",
		options: options || "options",
		groupLabel: groupLabel || mergedLabel
	};
}
/**
* Flat options into flatten list.
* We use `optionOnly` here is aim to avoid user use nested option group.
* Here is simply set `key` to the index if not provided.
*/
function flattenOptions(options) {
	var _ref2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, fieldNames = _ref2.fieldNames, childrenAsData = _ref2.childrenAsData;
	var flattenList = [];
	var _fillFieldNames = fillFieldNames(fieldNames, false), fieldLabel = _fillFieldNames.label, fieldValue = _fillFieldNames.value, fieldOptions = _fillFieldNames.options, groupLabel = _fillFieldNames.groupLabel;
	function dig(list, isGroupOption) {
		if (!Array.isArray(list)) return;
		list.forEach(function(data) {
			if (isGroupOption || !(fieldOptions in data)) {
				var value = data[fieldValue];
				flattenList.push({
					key: getKey(data, flattenList.length),
					groupOption: isGroupOption,
					data,
					label: data[fieldLabel],
					value
				});
			} else {
				var grpLabel = data[groupLabel];
				if (grpLabel === void 0 && childrenAsData) grpLabel = data.label;
				flattenList.push({
					key: getKey(data, flattenList.length),
					group: true,
					data,
					label: grpLabel
				});
				dig(data[fieldOptions], true);
			}
		});
	}
	dig(options, false);
	return flattenList;
}
/**
* Inject `props` into `option` for legacy usage
*/
function injectPropsWithOption(option) {
	var newOption = _objectSpread2({}, option);
	if (!("props" in newOption)) Object.defineProperty(newOption, "props", { get: function get() {
		warningOnce(false, "Return type is option instead of Option instance. Please read value directly instead of reading from `props`.");
		return newOption;
	} });
	return newOption;
}
var getSeparatedContent = function getSeparatedContent(text, tokens, end) {
	if (!tokens || !tokens.length) return null;
	var match = false;
	var list = function separate(str, _ref3) {
		var _ref4 = _toArray(_ref3), token = _ref4[0], restTokens = _ref4.slice(1);
		if (!token) return [str];
		var list = str.split(token);
		match = match || list.length > 1;
		return list.reduce(function(prevList, unitStr) {
			return [].concat(_toConsumableArray(prevList), _toConsumableArray(separate(unitStr, restTokens)));
		}, []).filter(Boolean);
	}(text, tokens);
	if (match) return typeof end !== "undefined" ? list.slice(0, end) : list;
	else return null;
};
//#endregion
//#region node_modules/rc-select/es/SelectContext.js
var SelectContext = /*#__PURE__*/ import_react.createContext(null);
//#endregion
//#region node_modules/rc-select/es/BaseSelect/Polite.js
init_typeof();
function Polite(props) {
	var visible = props.visible, values = props.values;
	if (!visible) return null;
	var MAX_COUNT = 50;
	return /*#__PURE__*/ import_react.createElement("span", {
		"aria-live": "polite",
		style: {
			width: 0,
			height: 0,
			position: "absolute",
			overflow: "hidden",
			opacity: 0
		}
	}, "".concat(values.slice(0, MAX_COUNT).map(function(_ref) {
		var label = _ref.label, value = _ref.value;
		return ["number", "string"].includes(_typeof(label)) ? label : value;
	}).join(", ")), values.length > MAX_COUNT ? ", ..." : null);
}
//#endregion
//#region node_modules/rc-select/es/BaseSelect/index.js
init_extends();
init_defineProperty();
init_toConsumableArray();
init_slicedToArray();
init_objectWithoutProperties();
var _excluded$4 = [
	"id",
	"prefixCls",
	"className",
	"showSearch",
	"tagRender",
	"direction",
	"omitDomProps",
	"displayValues",
	"onDisplayValuesChange",
	"emptyOptions",
	"notFoundContent",
	"onClear",
	"mode",
	"disabled",
	"loading",
	"getInputElement",
	"getRawInputElement",
	"open",
	"defaultOpen",
	"onDropdownVisibleChange",
	"activeValue",
	"onActiveValueChange",
	"activeDescendantId",
	"searchValue",
	"autoClearSearchValue",
	"onSearch",
	"onSearchSplit",
	"tokenSeparators",
	"allowClear",
	"prefix",
	"suffixIcon",
	"clearIcon",
	"OptionList",
	"animation",
	"transitionName",
	"dropdownStyle",
	"dropdownClassName",
	"dropdownMatchSelectWidth",
	"dropdownRender",
	"dropdownAlign",
	"placement",
	"builtinPlacements",
	"getPopupContainer",
	"showAction",
	"onFocus",
	"onBlur",
	"onKeyUp",
	"onKeyDown",
	"onMouseDown"
];
var DEFAULT_OMIT_PROPS = [
	"value",
	"onChange",
	"removeIcon",
	"placeholder",
	"autoFocus",
	"maxTagCount",
	"maxTagTextLength",
	"maxTagPlaceholder",
	"choiceTransitionName",
	"onInputKeyDown",
	"onPopupScroll",
	"tabIndex"
];
var isMultiple = function isMultiple(mode) {
	return mode === "tags" || mode === "multiple";
};
var BaseSelect = /*#__PURE__*/ import_react.forwardRef(function(props, ref) {
	var _customizeRawInputEle;
	var id = props.id, prefixCls = props.prefixCls, className = props.className, showSearch = props.showSearch, tagRender = props.tagRender, direction = props.direction, omitDomProps = props.omitDomProps, displayValues = props.displayValues, onDisplayValuesChange = props.onDisplayValuesChange, emptyOptions = props.emptyOptions, _props$notFoundConten = props.notFoundContent, notFoundContent = _props$notFoundConten === void 0 ? "Not Found" : _props$notFoundConten, onClear = props.onClear, mode = props.mode, disabled = props.disabled, loading = props.loading, getInputElement = props.getInputElement, getRawInputElement = props.getRawInputElement, open = props.open, defaultOpen = props.defaultOpen, onDropdownVisibleChange = props.onDropdownVisibleChange, activeValue = props.activeValue, onActiveValueChange = props.onActiveValueChange, activeDescendantId = props.activeDescendantId, searchValue = props.searchValue, autoClearSearchValue = props.autoClearSearchValue, onSearch = props.onSearch, onSearchSplit = props.onSearchSplit, tokenSeparators = props.tokenSeparators, allowClear = props.allowClear, prefix = props.prefix, suffixIcon = props.suffixIcon, clearIcon = props.clearIcon, OptionList = props.OptionList, animation = props.animation, transitionName = props.transitionName, dropdownStyle = props.dropdownStyle, dropdownClassName = props.dropdownClassName, dropdownMatchSelectWidth = props.dropdownMatchSelectWidth, dropdownRender = props.dropdownRender, dropdownAlign = props.dropdownAlign, placement = props.placement, builtinPlacements = props.builtinPlacements, getPopupContainer = props.getPopupContainer, _props$showAction = props.showAction, showAction = _props$showAction === void 0 ? [] : _props$showAction, onFocus = props.onFocus, onBlur = props.onBlur, onKeyUp = props.onKeyUp, onKeyDown = props.onKeyDown, onMouseDown = props.onMouseDown, restProps = _objectWithoutProperties(props, _excluded$4);
	var multiple = isMultiple(mode);
	var mergedShowSearch = (showSearch !== void 0 ? showSearch : multiple) || mode === "combobox";
	var domProps = _objectSpread2({}, restProps);
	DEFAULT_OMIT_PROPS.forEach(function(propName) {
		delete domProps[propName];
	});
	omitDomProps === null || omitDomProps === void 0 || omitDomProps.forEach(function(propName) {
		delete domProps[propName];
	});
	var _React$useState2 = _slicedToArray(import_react.useState(false), 2), mobile = _React$useState2[0], setMobile = _React$useState2[1];
	import_react.useEffect(function() {
		setMobile(isMobile_default());
	}, []);
	var containerRef = import_react.useRef(null);
	var selectorDomRef = import_react.useRef(null);
	var triggerRef = import_react.useRef(null);
	var selectorRef = import_react.useRef(null);
	var listRef = import_react.useRef(null);
	var blurRef = import_react.useRef(false);
	/** Used for component focused management */
	var _useDelayReset2 = _slicedToArray(useDelayReset(), 3), mockFocused = _useDelayReset2[0], setMockFocused = _useDelayReset2[1], cancelSetMockFocused = _useDelayReset2[2];
	import_react.useImperativeHandle(ref, function() {
		var _selectorRef$current, _selectorRef$current2;
		return {
			focus: (_selectorRef$current = selectorRef.current) === null || _selectorRef$current === void 0 ? void 0 : _selectorRef$current.focus,
			blur: (_selectorRef$current2 = selectorRef.current) === null || _selectorRef$current2 === void 0 ? void 0 : _selectorRef$current2.blur,
			scrollTo: function scrollTo(arg) {
				var _listRef$current;
				return (_listRef$current = listRef.current) === null || _listRef$current === void 0 ? void 0 : _listRef$current.scrollTo(arg);
			},
			nativeElement: containerRef.current || selectorDomRef.current
		};
	});
	var mergedSearchValue = import_react.useMemo(function() {
		var _displayValues$;
		if (mode !== "combobox") return searchValue;
		var val = (_displayValues$ = displayValues[0]) === null || _displayValues$ === void 0 ? void 0 : _displayValues$.value;
		return typeof val === "string" || typeof val === "number" ? String(val) : "";
	}, [
		searchValue,
		mode,
		displayValues
	]);
	var customizeInputElement = mode === "combobox" && typeof getInputElement === "function" && getInputElement() || null;
	var customizeRawInputElement = typeof getRawInputElement === "function" && getRawInputElement();
	var customizeRawInputRef = useComposeRef(selectorDomRef, customizeRawInputElement === null || customizeRawInputElement === void 0 || (_customizeRawInputEle = customizeRawInputElement.props) === null || _customizeRawInputEle === void 0 ? void 0 : _customizeRawInputEle.ref);
	var _React$useState4 = _slicedToArray(import_react.useState(false), 2), rendered = _React$useState4[0], setRendered = _React$useState4[1];
	useLayoutEffect$1(function() {
		setRendered(true);
	}, []);
	var _useMergedState2 = _slicedToArray(useMergedState(false, {
		defaultValue: defaultOpen,
		value: open
	}), 2), innerOpen = _useMergedState2[0], setInnerOpen = _useMergedState2[1];
	var mergedOpen = rendered ? innerOpen : false;
	var emptyListContent = !notFoundContent && emptyOptions;
	if (disabled || emptyListContent && mergedOpen && mode === "combobox") mergedOpen = false;
	var triggerOpen = emptyListContent ? false : mergedOpen;
	var onToggleOpen = import_react.useCallback(function(newOpen) {
		var nextOpen = newOpen !== void 0 ? newOpen : !mergedOpen;
		if (!disabled) {
			setInnerOpen(nextOpen);
			if (mergedOpen !== nextOpen) onDropdownVisibleChange === null || onDropdownVisibleChange === void 0 || onDropdownVisibleChange(nextOpen);
		}
	}, [
		disabled,
		mergedOpen,
		setInnerOpen,
		onDropdownVisibleChange
	]);
	var tokenWithEnter = import_react.useMemo(function() {
		return (tokenSeparators || []).some(function(tokenSeparator) {
			return ["\n", "\r\n"].includes(tokenSeparator);
		});
	}, [tokenSeparators]);
	var _ref = import_react.useContext(SelectContext) || {}, maxCount = _ref.maxCount, rawValues = _ref.rawValues;
	var onInternalSearch = function onInternalSearch(searchText, fromTyping, isCompositing) {
		if (multiple && isValidCount(maxCount) && (rawValues === null || rawValues === void 0 ? void 0 : rawValues.size) >= maxCount) return;
		var ret = true;
		var newSearchText = searchText;
		onActiveValueChange === null || onActiveValueChange === void 0 || onActiveValueChange(null);
		var separatedList = getSeparatedContent(searchText, tokenSeparators, isValidCount(maxCount) ? maxCount - rawValues.size : void 0);
		var patchLabels = isCompositing ? null : separatedList;
		if (mode !== "combobox" && patchLabels) {
			newSearchText = "";
			onSearchSplit === null || onSearchSplit === void 0 || onSearchSplit(patchLabels);
			onToggleOpen(false);
			ret = false;
		}
		if (onSearch && mergedSearchValue !== newSearchText) onSearch(newSearchText, { source: fromTyping ? "typing" : "effect" });
		return ret;
	};
	var onInternalSearchSubmit = function onInternalSearchSubmit(searchText) {
		if (!searchText || !searchText.trim()) return;
		onSearch(searchText, { source: "submit" });
	};
	import_react.useEffect(function() {
		if (!mergedOpen && !multiple && mode !== "combobox") onInternalSearch("", false, false);
	}, [mergedOpen]);
	import_react.useEffect(function() {
		if (innerOpen && disabled) setInnerOpen(false);
		if (disabled && !blurRef.current) setMockFocused(false);
	}, [disabled]);
	/**
	* We record input value here to check if can press to clean up by backspace
	* - null: Key is not down, this is reset by key up
	* - true: Search text is empty when first time backspace down
	* - false: Search text is not empty when first time backspace down
	*/
	var _useLock2 = _slicedToArray(useLock(), 2), getClearLock = _useLock2[0], setClearLock = _useLock2[1];
	var keyLockRef = import_react.useRef(false);
	var onInternalKeyDown = function onInternalKeyDown(event) {
		var clearLock = getClearLock();
		var key = event.key;
		var isEnterKey = key === "Enter";
		if (isEnterKey) {
			if (mode !== "combobox") event.preventDefault();
			if (!mergedOpen) onToggleOpen(true);
		}
		setClearLock(!!mergedSearchValue);
		if (key === "Backspace" && !clearLock && multiple && !mergedSearchValue && displayValues.length) {
			var cloneDisplayValues = _toConsumableArray(displayValues);
			var removedDisplayValue = null;
			for (var i = cloneDisplayValues.length - 1; i >= 0; i -= 1) {
				var current = cloneDisplayValues[i];
				if (!current.disabled) {
					cloneDisplayValues.splice(i, 1);
					removedDisplayValue = current;
					break;
				}
			}
			if (removedDisplayValue) onDisplayValuesChange(cloneDisplayValues, {
				type: "remove",
				values: [removedDisplayValue]
			});
		}
		for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) rest[_key - 1] = arguments[_key];
		if (mergedOpen && (!isEnterKey || !keyLockRef.current)) {
			var _listRef$current2;
			if (isEnterKey) keyLockRef.current = true;
			(_listRef$current2 = listRef.current) === null || _listRef$current2 === void 0 || _listRef$current2.onKeyDown.apply(_listRef$current2, [event].concat(rest));
		}
		onKeyDown === null || onKeyDown === void 0 || onKeyDown.apply(void 0, [event].concat(rest));
	};
	var onInternalKeyUp = function onInternalKeyUp(event) {
		for (var _len2 = arguments.length, rest = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) rest[_key2 - 1] = arguments[_key2];
		if (mergedOpen) {
			var _listRef$current3;
			(_listRef$current3 = listRef.current) === null || _listRef$current3 === void 0 || _listRef$current3.onKeyUp.apply(_listRef$current3, [event].concat(rest));
		}
		if (event.key === "Enter") keyLockRef.current = false;
		onKeyUp === null || onKeyUp === void 0 || onKeyUp.apply(void 0, [event].concat(rest));
	};
	var onSelectorRemove = function onSelectorRemove(val) {
		onDisplayValuesChange(displayValues.filter(function(i) {
			return i !== val;
		}), {
			type: "remove",
			values: [val]
		});
	};
	var onInputBlur = function onInputBlur() {
		keyLockRef.current = false;
	};
	/** Record real focus status */
	var focusRef = import_react.useRef(false);
	var onContainerFocus = function onContainerFocus() {
		setMockFocused(true);
		if (!disabled) {
			if (onFocus && !focusRef.current) onFocus.apply(void 0, arguments);
			if (showAction.includes("focus")) onToggleOpen(true);
		}
		focusRef.current = true;
	};
	var onContainerBlur = function onContainerBlur() {
		blurRef.current = true;
		setMockFocused(false, function() {
			focusRef.current = false;
			blurRef.current = false;
			onToggleOpen(false);
		});
		if (disabled) return;
		if (mergedSearchValue) {
			if (mode === "tags") onSearch(mergedSearchValue, { source: "submit" });
			else if (mode === "multiple") onSearch("", { source: "blur" });
		}
		if (onBlur) onBlur.apply(void 0, arguments);
	};
	var activeTimeoutIds = [];
	import_react.useEffect(function() {
		return function() {
			activeTimeoutIds.forEach(function(timeoutId) {
				return clearTimeout(timeoutId);
			});
			activeTimeoutIds.splice(0, activeTimeoutIds.length);
		};
	}, []);
	var onInternalMouseDown = function onInternalMouseDown(event) {
		var _triggerRef$current;
		var target = event.target;
		var popupElement = (_triggerRef$current = triggerRef.current) === null || _triggerRef$current === void 0 ? void 0 : _triggerRef$current.getPopupElement();
		if (popupElement && popupElement.contains(target)) {
			var timeoutId = setTimeout(function() {
				var index = activeTimeoutIds.indexOf(timeoutId);
				if (index !== -1) activeTimeoutIds.splice(index, 1);
				cancelSetMockFocused();
				if (!mobile && !popupElement.contains(document.activeElement)) {
					var _selectorRef$current3;
					(_selectorRef$current3 = selectorRef.current) === null || _selectorRef$current3 === void 0 || _selectorRef$current3.focus();
				}
			});
			activeTimeoutIds.push(timeoutId);
		}
		for (var _len3 = arguments.length, restArgs = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) restArgs[_key3 - 1] = arguments[_key3];
		onMouseDown === null || onMouseDown === void 0 || onMouseDown.apply(void 0, [event].concat(restArgs));
	};
	var forceUpdate = _slicedToArray(import_react.useState({}), 2)[1];
	function onPopupMouseEnter() {
		forceUpdate({});
	}
	var onTriggerVisibleChange;
	if (customizeRawInputElement) onTriggerVisibleChange = function onTriggerVisibleChange(newOpen) {
		onToggleOpen(newOpen);
	};
	useSelectTriggerControl(function() {
		var _triggerRef$current2;
		return [containerRef.current, (_triggerRef$current2 = triggerRef.current) === null || _triggerRef$current2 === void 0 ? void 0 : _triggerRef$current2.getPopupElement()];
	}, triggerOpen, onToggleOpen, !!customizeRawInputElement);
	var baseSelectContext = import_react.useMemo(function() {
		return _objectSpread2(_objectSpread2({}, props), {}, {
			notFoundContent,
			open: mergedOpen,
			triggerOpen,
			id,
			showSearch: mergedShowSearch,
			multiple,
			toggleOpen: onToggleOpen
		});
	}, [
		props,
		notFoundContent,
		triggerOpen,
		mergedOpen,
		id,
		mergedShowSearch,
		multiple,
		onToggleOpen
	]);
	var showSuffixIcon = !!suffixIcon || loading;
	var arrowNode;
	if (showSuffixIcon) arrowNode = /*#__PURE__*/ import_react.createElement(TransBtn, {
		className: (0, import_classnames.default)("".concat(prefixCls, "-arrow"), _defineProperty({}, "".concat(prefixCls, "-arrow-loading"), loading)),
		customizeIcon: suffixIcon,
		customizeIconProps: {
			loading,
			searchValue: mergedSearchValue,
			open: mergedOpen,
			focused: mockFocused,
			showSearch: mergedShowSearch
		}
	});
	var _useAllowClear = useAllowClear(prefixCls, function onClearMouseDown() {
		var _selectorRef$current4;
		onClear === null || onClear === void 0 || onClear();
		(_selectorRef$current4 = selectorRef.current) === null || _selectorRef$current4 === void 0 || _selectorRef$current4.focus();
		onDisplayValuesChange([], {
			type: "clear",
			values: displayValues
		});
		onInternalSearch("", false, false);
	}, displayValues, allowClear, clearIcon, disabled, mergedSearchValue, mode), mergedAllowClear = _useAllowClear.allowClear, clearNode = _useAllowClear.clearIcon;
	var optionList = /*#__PURE__*/ import_react.createElement(OptionList, { ref: listRef });
	var mergedClassName = (0, import_classnames.default)(prefixCls, className, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, "".concat(prefixCls, "-focused"), mockFocused), "".concat(prefixCls, "-multiple"), multiple), "".concat(prefixCls, "-single"), !multiple), "".concat(prefixCls, "-allow-clear"), allowClear), "".concat(prefixCls, "-show-arrow"), showSuffixIcon), "".concat(prefixCls, "-disabled"), disabled), "".concat(prefixCls, "-loading"), loading), "".concat(prefixCls, "-open"), mergedOpen), "".concat(prefixCls, "-customize-input"), customizeInputElement), "".concat(prefixCls, "-show-search"), mergedShowSearch));
	var selectorNode = /*#__PURE__*/ import_react.createElement(RefSelectTrigger, {
		ref: triggerRef,
		disabled,
		prefixCls,
		visible: triggerOpen,
		popupElement: optionList,
		animation,
		transitionName,
		dropdownStyle,
		dropdownClassName,
		direction,
		dropdownMatchSelectWidth,
		dropdownRender,
		dropdownAlign,
		placement,
		builtinPlacements,
		getPopupContainer,
		empty: emptyOptions,
		getTriggerDOMNode: function getTriggerDOMNode(node) {
			return selectorDomRef.current || node;
		},
		onPopupVisibleChange: onTriggerVisibleChange,
		onPopupMouseEnter
	}, customizeRawInputElement ? /*#__PURE__*/ import_react.cloneElement(customizeRawInputElement, { ref: customizeRawInputRef }) : /*#__PURE__*/ import_react.createElement(ForwardSelector, _extends({}, props, {
		domRef: selectorDomRef,
		prefixCls,
		inputElement: customizeInputElement,
		ref: selectorRef,
		id,
		prefix,
		showSearch: mergedShowSearch,
		autoClearSearchValue,
		mode,
		activeDescendantId,
		tagRender,
		values: displayValues,
		open: mergedOpen,
		onToggleOpen,
		activeValue,
		searchValue: mergedSearchValue,
		onSearch: onInternalSearch,
		onSearchSubmit: onInternalSearchSubmit,
		onRemove: onSelectorRemove,
		tokenWithEnter,
		onInputBlur
	})));
	var renderNode;
	if (customizeRawInputElement) renderNode = selectorNode;
	else renderNode = /*#__PURE__*/ import_react.createElement("div", _extends({ className: mergedClassName }, domProps, {
		ref: containerRef,
		onMouseDown: onInternalMouseDown,
		onKeyDown: onInternalKeyDown,
		onKeyUp: onInternalKeyUp,
		onFocus: onContainerFocus,
		onBlur: onContainerBlur
	}), /*#__PURE__*/ import_react.createElement(Polite, {
		visible: mockFocused && !mergedOpen,
		values: displayValues
	}), selectorNode, arrowNode, mergedAllowClear && clearNode);
	return /*#__PURE__*/ import_react.createElement(BaseSelectContext.Provider, { value: baseSelectContext }, renderNode);
});
BaseSelect.displayName = "BaseSelect";
//#endregion
//#region node_modules/rc-select/es/OptGroup.js
/* istanbul ignore file */
/** This is a placeholder, not real render in dom */
var OptGroup = function OptGroup() {
	return null;
};
OptGroup.isSelectOptGroup = true;
//#endregion
//#region node_modules/rc-select/es/Option.js
/* istanbul ignore file */
/** This is a placeholder, not real render in dom */
var Option$1 = function Option() {
	return null;
};
Option$1.isSelectOption = true;
//#endregion
//#region node_modules/rc-virtual-list/es/Filler.js
init_extends();
init_defineProperty();
/**
* Fill component to provided the scroll content real height.
*/
var Filler = /*#__PURE__*/ import_react.forwardRef(function(_ref, ref) {
	var height = _ref.height, offsetY = _ref.offsetY, offsetX = _ref.offsetX, children = _ref.children, prefixCls = _ref.prefixCls, onInnerResize = _ref.onInnerResize, innerProps = _ref.innerProps, rtl = _ref.rtl, extra = _ref.extra;
	var outerStyle = {};
	var innerStyle = {
		display: "flex",
		flexDirection: "column"
	};
	if (offsetY !== void 0) {
		outerStyle = {
			height,
			position: "relative",
			overflow: "hidden"
		};
		innerStyle = _objectSpread2(_objectSpread2({}, innerStyle), {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({ transform: "translateY(".concat(offsetY, "px)") }, rtl ? "marginRight" : "marginLeft", -offsetX), "position", "absolute"), "left", 0), "right", 0), "top", 0));
	}
	return /*#__PURE__*/ import_react.createElement("div", { style: outerStyle }, /*#__PURE__*/ import_react.createElement(RefResizeObserver, { onResize: function onResize(_ref2) {
		if (_ref2.offsetHeight && onInnerResize) onInnerResize();
	} }, /*#__PURE__*/ import_react.createElement("div", _extends({
		style: innerStyle,
		className: (0, import_classnames.default)(_defineProperty({}, "".concat(prefixCls, "-holder-inner"), prefixCls)),
		ref
	}, innerProps), children, extra)));
});
Filler.displayName = "Filler";
//#endregion
//#region node_modules/rc-virtual-list/es/Item.js
function Item(_ref) {
	var children = _ref.children, setRef = _ref.setRef;
	var refFunc = import_react.useCallback(function(node) {
		setRef(node);
	}, []);
	return /*#__PURE__*/ import_react.cloneElement(children, { ref: refFunc });
}
//#endregion
//#region node_modules/rc-virtual-list/es/hooks/useChildren.js
function useChildren(list, startIndex, endIndex, scrollWidth, offsetX, setNodeRef, renderFunc, _ref) {
	var getKey = _ref.getKey;
	return list.slice(startIndex, endIndex + 1).map(function(item, index) {
		var node = renderFunc(item, startIndex + index, {
			style: { width: scrollWidth },
			offsetX
		});
		var key = getKey(item);
		return /*#__PURE__*/ import_react.createElement(Item, {
			key,
			setRef: function setRef(ele) {
				return setNodeRef(item, ele);
			}
		}, node);
	});
}
//#endregion
//#region node_modules/rc-virtual-list/es/utils/algorithmUtil.js
/**
* We assume that 2 list has only 1 item diff and others keeping the order.
* So we can use dichotomy algorithm to find changed one.
*/
function findListDiffIndex(originList, targetList, getKey) {
	var originLen = originList.length;
	var targetLen = targetList.length;
	var shortList;
	var longList;
	if (originLen === 0 && targetLen === 0) return null;
	if (originLen < targetLen) {
		shortList = originList;
		longList = targetList;
	} else {
		shortList = targetList;
		longList = originList;
	}
	var notExistKey = { __EMPTY_ITEM__: true };
	function getItemKey(item) {
		if (item !== void 0) return getKey(item);
		return notExistKey;
	}
	var diffIndex = null;
	var multiple = Math.abs(originLen - targetLen) !== 1;
	for (var i = 0; i < longList.length; i += 1) {
		var shortKey = getItemKey(shortList[i]);
		if (shortKey !== getItemKey(longList[i])) {
			diffIndex = i;
			multiple = multiple || shortKey !== getItemKey(longList[i + 1]);
			break;
		}
	}
	return diffIndex === null ? null : {
		index: diffIndex,
		multiple
	};
}
//#endregion
//#region node_modules/rc-virtual-list/es/hooks/useDiffItem.js
init_slicedToArray();
function useDiffItem(data, getKey, onDiff) {
	var _React$useState2 = _slicedToArray(import_react.useState(data), 2), prevData = _React$useState2[0], setPrevData = _React$useState2[1];
	var _React$useState4 = _slicedToArray(import_react.useState(null), 2), diffItem = _React$useState4[0], setDiffItem = _React$useState4[1];
	import_react.useEffect(function() {
		var diff = findListDiffIndex(prevData || [], data || [], getKey);
		if ((diff === null || diff === void 0 ? void 0 : diff.index) !== void 0) {
			onDiff === null || onDiff === void 0 || onDiff(diff.index);
			setDiffItem(data[diff.index]);
		}
		setPrevData(data);
	}, [data]);
	return [diffItem];
}
//#endregion
//#region node_modules/rc-virtual-list/es/utils/isFirefox.js
init_typeof();
var isFF = (typeof navigator === "undefined" ? "undefined" : _typeof(navigator)) === "object" && /Firefox/i.test(navigator.userAgent);
//#endregion
//#region node_modules/rc-virtual-list/es/hooks/useOriginScroll.js
var useOriginScroll_default = (function(isScrollAtTop, isScrollAtBottom, isScrollAtLeft, isScrollAtRight) {
	var lockRef = (0, import_react.useRef)(false);
	var lockTimeoutRef = (0, import_react.useRef)(null);
	function lockScroll() {
		clearTimeout(lockTimeoutRef.current);
		lockRef.current = true;
		lockTimeoutRef.current = setTimeout(function() {
			lockRef.current = false;
		}, 50);
	}
	var scrollPingRef = (0, import_react.useRef)({
		top: isScrollAtTop,
		bottom: isScrollAtBottom,
		left: isScrollAtLeft,
		right: isScrollAtRight
	});
	scrollPingRef.current.top = isScrollAtTop;
	scrollPingRef.current.bottom = isScrollAtBottom;
	scrollPingRef.current.left = isScrollAtLeft;
	scrollPingRef.current.right = isScrollAtRight;
	return function(isHorizontal, delta) {
		var smoothOffset = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
		var originScroll = isHorizontal ? delta < 0 && scrollPingRef.current.left || delta > 0 && scrollPingRef.current.right : delta < 0 && scrollPingRef.current.top || delta > 0 && scrollPingRef.current.bottom;
		if (smoothOffset && originScroll) {
			clearTimeout(lockTimeoutRef.current);
			lockRef.current = false;
		} else if (!originScroll || lockRef.current) lockScroll();
		return !lockRef.current && originScroll;
	};
});
//#endregion
//#region node_modules/rc-virtual-list/es/hooks/useFrameWheel.js
function useFrameWheel(inVirtual, isScrollAtTop, isScrollAtBottom, isScrollAtLeft, isScrollAtRight, horizontalScroll, onWheelDelta) {
	var offsetRef = (0, import_react.useRef)(0);
	var nextFrameRef = (0, import_react.useRef)(null);
	var wheelValueRef = (0, import_react.useRef)(null);
	var isMouseScrollRef = (0, import_react.useRef)(false);
	var originScroll = useOriginScroll_default(isScrollAtTop, isScrollAtBottom, isScrollAtLeft, isScrollAtRight);
	function onWheelY(e, deltaY) {
		wrapperRaf.cancel(nextFrameRef.current);
		if (originScroll(false, deltaY)) return;
		var event = e;
		if (!event._virtualHandled) event._virtualHandled = true;
		else return;
		offsetRef.current += deltaY;
		wheelValueRef.current = deltaY;
		if (!isFF) event.preventDefault();
		nextFrameRef.current = wrapperRaf(function() {
			var patchMultiple = isMouseScrollRef.current ? 10 : 1;
			onWheelDelta(offsetRef.current * patchMultiple, false);
			offsetRef.current = 0;
		});
	}
	function onWheelX(event, deltaX) {
		onWheelDelta(deltaX, true);
		if (!isFF) event.preventDefault();
	}
	var wheelDirectionRef = (0, import_react.useRef)(null);
	var wheelDirectionCleanRef = (0, import_react.useRef)(null);
	function onWheel(event) {
		if (!inVirtual) return;
		wrapperRaf.cancel(wheelDirectionCleanRef.current);
		wheelDirectionCleanRef.current = wrapperRaf(function() {
			wheelDirectionRef.current = null;
		}, 2);
		var deltaX = event.deltaX, deltaY = event.deltaY, shiftKey = event.shiftKey;
		var mergedDeltaX = deltaX;
		var mergedDeltaY = deltaY;
		if (wheelDirectionRef.current === "sx" || !wheelDirectionRef.current && (shiftKey || false) && deltaY && !deltaX) {
			mergedDeltaX = deltaY;
			mergedDeltaY = 0;
			wheelDirectionRef.current = "sx";
		}
		var absX = Math.abs(mergedDeltaX);
		var absY = Math.abs(mergedDeltaY);
		if (wheelDirectionRef.current === null) wheelDirectionRef.current = horizontalScroll && absX > absY ? "x" : "y";
		if (wheelDirectionRef.current === "y") onWheelY(event, mergedDeltaY);
		else onWheelX(event, mergedDeltaX);
	}
	function onFireFoxScroll(event) {
		if (!inVirtual) return;
		isMouseScrollRef.current = event.detail === wheelValueRef.current;
	}
	return [onWheel, onFireFoxScroll];
}
//#endregion
//#region node_modules/rc-virtual-list/es/hooks/useGetSize.js
init_slicedToArray();
/**
* Size info need loop query for the `heights` which will has the perf issue.
* Let cache result for each render phase.
*/
function useGetSize(mergedData, getKey, heights, itemHeight) {
	var _React$useMemo2 = _slicedToArray(import_react.useMemo(function() {
		return [/* @__PURE__ */ new Map(), []];
	}, [
		mergedData,
		heights.id,
		itemHeight
	]), 2), key2Index = _React$useMemo2[0], bottomList = _React$useMemo2[1];
	return function getSize(startKey) {
		var endKey = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : startKey;
		var startIndex = key2Index.get(startKey);
		var endIndex = key2Index.get(endKey);
		if (startIndex === void 0 || endIndex === void 0) {
			var dataLen = mergedData.length;
			for (var i = bottomList.length; i < dataLen; i += 1) {
				var _heights$get;
				var item = mergedData[i];
				var key = getKey(item);
				key2Index.set(key, i);
				var cacheHeight = (_heights$get = heights.get(key)) !== null && _heights$get !== void 0 ? _heights$get : itemHeight;
				bottomList[i] = (bottomList[i - 1] || 0) + cacheHeight;
				if (key === startKey) startIndex = i;
				if (key === endKey) endIndex = i;
				if (startIndex !== void 0 && endIndex !== void 0) break;
			}
		}
		return {
			top: bottomList[startIndex - 1] || 0,
			bottom: bottomList[endIndex]
		};
	};
}
//#endregion
//#region node_modules/rc-virtual-list/es/utils/CacheMap.js
init_classCallCheck();
init_createClass();
init_defineProperty();
var CacheMap = /*#__PURE__*/ function() {
	function CacheMap() {
		_classCallCheck(this, CacheMap);
		_defineProperty(this, "maps", void 0);
		_defineProperty(this, "id", 0);
		_defineProperty(this, "diffRecords", /* @__PURE__ */ new Map());
		this.maps = Object.create(null);
	}
	_createClass(CacheMap, [
		{
			key: "set",
			value: function set(key, value) {
				this.diffRecords.set(key, this.maps[key]);
				this.maps[key] = value;
				this.id += 1;
			}
		},
		{
			key: "get",
			value: function get(key) {
				return this.maps[key];
			}
		},
		{
			key: "resetRecord",
			value: function resetRecord() {
				this.diffRecords.clear();
			}
		},
		{
			key: "getRecord",
			value: function getRecord() {
				return this.diffRecords;
			}
		}
	]);
	return CacheMap;
}();
//#endregion
//#region node_modules/rc-virtual-list/es/hooks/useHeights.js
init_slicedToArray();
function parseNumber(value) {
	var num = parseFloat(value);
	return isNaN(num) ? 0 : num;
}
function useHeights(getKey, onItemAdd, onItemRemove) {
	var _React$useState2 = _slicedToArray(import_react.useState(0), 2), updatedMark = _React$useState2[0], setUpdatedMark = _React$useState2[1];
	var instanceRef = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	var heightsRef = (0, import_react.useRef)(new CacheMap());
	var promiseIdRef = (0, import_react.useRef)(0);
	function cancelRaf() {
		promiseIdRef.current += 1;
	}
	function collectHeight() {
		var sync = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
		cancelRaf();
		var doCollect = function doCollect() {
			var changed = false;
			instanceRef.current.forEach(function(element, key) {
				if (element && element.offsetParent) {
					var offsetHeight = element.offsetHeight;
					var _getComputedStyle = getComputedStyle(element), marginTop = _getComputedStyle.marginTop, marginBottom = _getComputedStyle.marginBottom;
					var marginTopNum = parseNumber(marginTop);
					var marginBottomNum = parseNumber(marginBottom);
					var totalHeight = offsetHeight + marginTopNum + marginBottomNum;
					if (heightsRef.current.get(key) !== totalHeight) {
						heightsRef.current.set(key, totalHeight);
						changed = true;
					}
				}
			});
			if (changed) setUpdatedMark(function(c) {
				return c + 1;
			});
		};
		if (sync) doCollect();
		else {
			promiseIdRef.current += 1;
			var id = promiseIdRef.current;
			Promise.resolve().then(function() {
				if (id === promiseIdRef.current) doCollect();
			});
		}
	}
	function setInstanceRef(item, instance) {
		var key = getKey(item);
		var origin = instanceRef.current.get(key);
		if (instance) {
			instanceRef.current.set(key, instance);
			collectHeight();
		} else instanceRef.current.delete(key);
		if (!origin !== !instance) if (instance) onItemAdd === null || onItemAdd === void 0 || onItemAdd(item);
		else onItemRemove === null || onItemRemove === void 0 || onItemRemove(item);
	}
	(0, import_react.useEffect)(function() {
		return cancelRaf;
	}, []);
	return [
		setInstanceRef,
		collectHeight,
		heightsRef.current,
		updatedMark
	];
}
//#endregion
//#region node_modules/rc-virtual-list/es/hooks/useMobileTouchMove.js
var SMOOTH_PTG = 14 / 15;
function useMobileTouchMove(inVirtual, listRef, callback) {
	var touchedRef = (0, import_react.useRef)(false);
	var touchXRef = (0, import_react.useRef)(0);
	var touchYRef = (0, import_react.useRef)(0);
	var elementRef = (0, import_react.useRef)(null);
	var intervalRef = (0, import_react.useRef)(null);
	var cleanUpEvents;
	var onTouchMove = function onTouchMove(e) {
		if (touchedRef.current) {
			var currentX = Math.ceil(e.touches[0].pageX);
			var currentY = Math.ceil(e.touches[0].pageY);
			var offsetX = touchXRef.current - currentX;
			var offsetY = touchYRef.current - currentY;
			var _isHorizontal = Math.abs(offsetX) > Math.abs(offsetY);
			if (_isHorizontal) touchXRef.current = currentX;
			else touchYRef.current = currentY;
			var scrollHandled = callback(_isHorizontal, _isHorizontal ? offsetX : offsetY, false, e);
			if (scrollHandled) e.preventDefault();
			clearInterval(intervalRef.current);
			if (scrollHandled) intervalRef.current = setInterval(function() {
				if (_isHorizontal) offsetX *= SMOOTH_PTG;
				else offsetY *= SMOOTH_PTG;
				var offset = Math.floor(_isHorizontal ? offsetX : offsetY);
				if (!callback(_isHorizontal, offset, true) || Math.abs(offset) <= .1) clearInterval(intervalRef.current);
			}, 16);
		}
	};
	var onTouchEnd = function onTouchEnd() {
		touchedRef.current = false;
		cleanUpEvents();
	};
	var onTouchStart = function onTouchStart(e) {
		cleanUpEvents();
		if (e.touches.length === 1 && !touchedRef.current) {
			touchedRef.current = true;
			touchXRef.current = Math.ceil(e.touches[0].pageX);
			touchYRef.current = Math.ceil(e.touches[0].pageY);
			elementRef.current = e.target;
			elementRef.current.addEventListener("touchmove", onTouchMove, { passive: false });
			elementRef.current.addEventListener("touchend", onTouchEnd, { passive: true });
		}
	};
	cleanUpEvents = function cleanUpEvents() {
		if (elementRef.current) {
			elementRef.current.removeEventListener("touchmove", onTouchMove);
			elementRef.current.removeEventListener("touchend", onTouchEnd);
		}
	};
	useLayoutEffect$1(function() {
		if (inVirtual) listRef.current.addEventListener("touchstart", onTouchStart, { passive: true });
		return function() {
			var _listRef$current;
			(_listRef$current = listRef.current) === null || _listRef$current === void 0 || _listRef$current.removeEventListener("touchstart", onTouchStart);
			cleanUpEvents();
			clearInterval(intervalRef.current);
		};
	}, [inVirtual]);
}
//#endregion
//#region node_modules/rc-virtual-list/es/hooks/useScrollDrag.js
function smoothScrollOffset(offset) {
	return Math.floor(Math.pow(offset, .5));
}
function getPageXY(e, horizontal) {
	return ("touches" in e ? e.touches[0] : e)[horizontal ? "pageX" : "pageY"] - window[horizontal ? "scrollX" : "scrollY"];
}
function useScrollDrag(inVirtual, componentRef, onScrollOffset) {
	import_react.useEffect(function() {
		var ele = componentRef.current;
		if (inVirtual && ele) {
			var mouseDownLock = false;
			var rafId;
			var _offset;
			var stopScroll = function stopScroll() {
				wrapperRaf.cancel(rafId);
			};
			var continueScroll = function continueScroll() {
				stopScroll();
				rafId = wrapperRaf(function() {
					onScrollOffset(_offset);
					continueScroll();
				});
			};
			var clearDragState = function clearDragState() {
				mouseDownLock = false;
				stopScroll();
			};
			var onMouseDown = function onMouseDown(e) {
				if (e.target.draggable || e.button !== 0) return;
				var event = e;
				if (!event._virtualHandled) {
					event._virtualHandled = true;
					mouseDownLock = true;
				}
			};
			var onMouseMove = function onMouseMove(e) {
				if (mouseDownLock) {
					var mouseY = getPageXY(e, false);
					var _ele$getBoundingClien = ele.getBoundingClientRect(), top = _ele$getBoundingClien.top, bottom = _ele$getBoundingClien.bottom;
					if (mouseY <= top) {
						_offset = -smoothScrollOffset(top - mouseY);
						continueScroll();
					} else if (mouseY >= bottom) {
						_offset = smoothScrollOffset(mouseY - bottom);
						continueScroll();
					} else stopScroll();
				}
			};
			ele.addEventListener("mousedown", onMouseDown);
			ele.ownerDocument.addEventListener("mouseup", clearDragState);
			ele.ownerDocument.addEventListener("mousemove", onMouseMove);
			ele.ownerDocument.addEventListener("dragend", clearDragState);
			return function() {
				ele.removeEventListener("mousedown", onMouseDown);
				ele.ownerDocument.removeEventListener("mouseup", clearDragState);
				ele.ownerDocument.removeEventListener("mousemove", onMouseMove);
				ele.ownerDocument.removeEventListener("dragend", clearDragState);
				stopScroll();
			};
		}
	}, [inVirtual]);
}
//#endregion
//#region node_modules/rc-virtual-list/es/hooks/useScrollTo.js
init_typeof();
init_slicedToArray();
var MAX_TIMES = 10;
function useScrollTo(containerRef, data, heights, itemHeight, getKey, collectHeight, syncScrollTop, triggerFlash) {
	var scrollRef = import_react.useRef();
	var _React$useState2 = _slicedToArray(import_react.useState(null), 2), syncState = _React$useState2[0], setSyncState = _React$useState2[1];
	useLayoutEffect$1(function() {
		if (syncState && syncState.times < MAX_TIMES) {
			if (!containerRef.current) {
				setSyncState(function(ori) {
					return _objectSpread2({}, ori);
				});
				return;
			}
			collectHeight();
			var targetAlign = syncState.targetAlign, originAlign = syncState.originAlign, index = syncState.index, offset = syncState.offset;
			var height = containerRef.current.clientHeight;
			var needCollectHeight = false;
			var newTargetAlign = targetAlign;
			var targetTop = null;
			if (height) {
				var mergedAlign = targetAlign || originAlign;
				var stackTop = 0;
				var itemTop = 0;
				var itemBottom = 0;
				var maxLen = Math.min(data.length - 1, index);
				for (var i = 0; i <= maxLen; i += 1) {
					var key = getKey(data[i]);
					itemTop = stackTop;
					var cacheHeight = heights.get(key);
					itemBottom = itemTop + (cacheHeight === void 0 ? itemHeight : cacheHeight);
					stackTop = itemBottom;
				}
				var leftHeight = mergedAlign === "top" ? offset : height - offset;
				for (var _i = maxLen; _i >= 0; _i -= 1) {
					var _key = getKey(data[_i]);
					var _cacheHeight = heights.get(_key);
					if (_cacheHeight === void 0) {
						needCollectHeight = true;
						break;
					}
					leftHeight -= _cacheHeight;
					if (leftHeight <= 0) break;
				}
				switch (mergedAlign) {
					case "top":
						targetTop = itemTop - offset;
						break;
					case "bottom":
						targetTop = itemBottom - height + offset;
						break;
					default:
						var scrollTop = containerRef.current.scrollTop;
						var scrollBottom = scrollTop + height;
						if (itemTop < scrollTop) newTargetAlign = "top";
						else if (itemBottom > scrollBottom) newTargetAlign = "bottom";
				}
				if (targetTop !== null) syncScrollTop(targetTop);
				if (targetTop !== syncState.lastTop) needCollectHeight = true;
			}
			if (needCollectHeight) setSyncState(_objectSpread2(_objectSpread2({}, syncState), {}, {
				times: syncState.times + 1,
				targetAlign: newTargetAlign,
				lastTop: targetTop
			}));
		} else if ((syncState === null || syncState === void 0 ? void 0 : syncState.times) === MAX_TIMES) warningOnce(false, "Seems `scrollTo` with `rc-virtual-list` reach the max limitation. Please fire issue for us. Thanks.");
	}, [syncState, containerRef.current]);
	return function(arg) {
		if (arg === null || arg === void 0) {
			triggerFlash();
			return;
		}
		wrapperRaf.cancel(scrollRef.current);
		if (typeof arg === "number") syncScrollTop(arg);
		else if (arg && _typeof(arg) === "object") {
			var index;
			var align = arg.align;
			if ("index" in arg) index = arg.index;
			else index = data.findIndex(function(item) {
				return getKey(item) === arg.key;
			});
			var _arg$offset = arg.offset;
			setSyncState({
				times: 0,
				index,
				offset: _arg$offset === void 0 ? 0 : _arg$offset,
				originAlign: align
			});
		}
	};
}
//#endregion
//#region node_modules/rc-virtual-list/es/ScrollBar.js
init_defineProperty();
init_slicedToArray();
var ScrollBar = /*#__PURE__*/ import_react.forwardRef(function(props, ref) {
	var prefixCls = props.prefixCls, rtl = props.rtl, scrollOffset = props.scrollOffset, scrollRange = props.scrollRange, onStartMove = props.onStartMove, onStopMove = props.onStopMove, onScroll = props.onScroll, horizontal = props.horizontal, spinSize = props.spinSize, containerSize = props.containerSize, style = props.style, propsThumbStyle = props.thumbStyle, showScrollBar = props.showScrollBar;
	var _React$useState2 = _slicedToArray(import_react.useState(false), 2), dragging = _React$useState2[0], setDragging = _React$useState2[1];
	var _React$useState4 = _slicedToArray(import_react.useState(null), 2), pageXY = _React$useState4[0], setPageXY = _React$useState4[1];
	var _React$useState6 = _slicedToArray(import_react.useState(null), 2), startTop = _React$useState6[0], setStartTop = _React$useState6[1];
	var isLTR = !rtl;
	var scrollbarRef = import_react.useRef();
	var thumbRef = import_react.useRef();
	var _React$useState8 = _slicedToArray(import_react.useState(showScrollBar), 2), visible = _React$useState8[0], setVisible = _React$useState8[1];
	var visibleTimeoutRef = import_react.useRef();
	var delayHidden = function delayHidden() {
		if (showScrollBar === true || showScrollBar === false) return;
		clearTimeout(visibleTimeoutRef.current);
		setVisible(true);
		visibleTimeoutRef.current = setTimeout(function() {
			setVisible(false);
		}, 3e3);
	};
	var enableScrollRange = scrollRange - containerSize || 0;
	var enableOffsetRange = containerSize - spinSize || 0;
	var top = import_react.useMemo(function() {
		if (scrollOffset === 0 || enableScrollRange === 0) return 0;
		return scrollOffset / enableScrollRange * enableOffsetRange;
	}, [
		scrollOffset,
		enableScrollRange,
		enableOffsetRange
	]);
	var onContainerMouseDown = function onContainerMouseDown(e) {
		e.stopPropagation();
		e.preventDefault();
	};
	var stateRef = import_react.useRef({
		top,
		dragging,
		pageY: pageXY,
		startTop
	});
	stateRef.current = {
		top,
		dragging,
		pageY: pageXY,
		startTop
	};
	var onThumbMouseDown = function onThumbMouseDown(e) {
		setDragging(true);
		setPageXY(getPageXY(e, horizontal));
		setStartTop(stateRef.current.top);
		onStartMove();
		e.stopPropagation();
		e.preventDefault();
	};
	import_react.useEffect(function() {
		var onScrollbarTouchStart = function onScrollbarTouchStart(e) {
			e.preventDefault();
		};
		var scrollbarEle = scrollbarRef.current;
		var thumbEle = thumbRef.current;
		scrollbarEle.addEventListener("touchstart", onScrollbarTouchStart, { passive: false });
		thumbEle.addEventListener("touchstart", onThumbMouseDown, { passive: false });
		return function() {
			scrollbarEle.removeEventListener("touchstart", onScrollbarTouchStart);
			thumbEle.removeEventListener("touchstart", onThumbMouseDown);
		};
	}, []);
	var enableScrollRangeRef = import_react.useRef();
	enableScrollRangeRef.current = enableScrollRange;
	var enableOffsetRangeRef = import_react.useRef();
	enableOffsetRangeRef.current = enableOffsetRange;
	import_react.useEffect(function() {
		if (dragging) {
			var moveRafId;
			var onMouseMove = function onMouseMove(e) {
				var _stateRef$current = stateRef.current, stateDragging = _stateRef$current.dragging, statePageY = _stateRef$current.pageY, stateStartTop = _stateRef$current.startTop;
				wrapperRaf.cancel(moveRafId);
				var rect = scrollbarRef.current.getBoundingClientRect();
				var scale = containerSize / (horizontal ? rect.width : rect.height);
				if (stateDragging) {
					var offset = (getPageXY(e, horizontal) - statePageY) * scale;
					var newTop = stateStartTop;
					if (!isLTR && horizontal) newTop -= offset;
					else newTop += offset;
					var tmpEnableScrollRange = enableScrollRangeRef.current;
					var tmpEnableOffsetRange = enableOffsetRangeRef.current;
					var ptg = tmpEnableOffsetRange ? newTop / tmpEnableOffsetRange : 0;
					var newScrollTop = Math.ceil(ptg * tmpEnableScrollRange);
					newScrollTop = Math.max(newScrollTop, 0);
					newScrollTop = Math.min(newScrollTop, tmpEnableScrollRange);
					moveRafId = wrapperRaf(function() {
						onScroll(newScrollTop, horizontal);
					});
				}
			};
			var onMouseUp = function onMouseUp() {
				setDragging(false);
				onStopMove();
			};
			window.addEventListener("mousemove", onMouseMove, { passive: true });
			window.addEventListener("touchmove", onMouseMove, { passive: true });
			window.addEventListener("mouseup", onMouseUp, { passive: true });
			window.addEventListener("touchend", onMouseUp, { passive: true });
			return function() {
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("touchmove", onMouseMove);
				window.removeEventListener("mouseup", onMouseUp);
				window.removeEventListener("touchend", onMouseUp);
				wrapperRaf.cancel(moveRafId);
			};
		}
	}, [dragging]);
	import_react.useEffect(function() {
		delayHidden();
		return function() {
			clearTimeout(visibleTimeoutRef.current);
		};
	}, [scrollOffset]);
	import_react.useImperativeHandle(ref, function() {
		return { delayHidden };
	});
	var scrollbarPrefixCls = "".concat(prefixCls, "-scrollbar");
	var containerStyle = {
		position: "absolute",
		visibility: visible ? null : "hidden"
	};
	var thumbStyle = {
		position: "absolute",
		borderRadius: 99,
		background: "var(--rc-virtual-list-scrollbar-bg, rgba(0, 0, 0, 0.5))",
		cursor: "pointer",
		userSelect: "none"
	};
	if (horizontal) {
		Object.assign(containerStyle, {
			height: 8,
			left: 0,
			right: 0,
			bottom: 0
		});
		Object.assign(thumbStyle, _defineProperty({
			height: "100%",
			width: spinSize
		}, isLTR ? "left" : "right", top));
	} else {
		Object.assign(containerStyle, _defineProperty({
			width: 8,
			top: 0,
			bottom: 0
		}, isLTR ? "right" : "left", 0));
		Object.assign(thumbStyle, {
			width: "100%",
			height: spinSize,
			top
		});
	}
	return /*#__PURE__*/ import_react.createElement("div", {
		ref: scrollbarRef,
		className: (0, import_classnames.default)(scrollbarPrefixCls, _defineProperty(_defineProperty(_defineProperty({}, "".concat(scrollbarPrefixCls, "-horizontal"), horizontal), "".concat(scrollbarPrefixCls, "-vertical"), !horizontal), "".concat(scrollbarPrefixCls, "-visible"), visible)),
		style: _objectSpread2(_objectSpread2({}, containerStyle), style),
		onMouseDown: onContainerMouseDown,
		onMouseMove: delayHidden
	}, /*#__PURE__*/ import_react.createElement("div", {
		ref: thumbRef,
		className: (0, import_classnames.default)("".concat(scrollbarPrefixCls, "-thumb"), _defineProperty({}, "".concat(scrollbarPrefixCls, "-thumb-moving"), dragging)),
		style: _objectSpread2(_objectSpread2({}, thumbStyle), propsThumbStyle),
		onMouseDown: onThumbMouseDown
	}));
});
ScrollBar.displayName = "ScrollBar";
//#endregion
//#region node_modules/rc-virtual-list/es/utils/scrollbarUtil.js
var MIN_SIZE = 20;
function getSpinSize() {
	var containerSize = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0;
	var baseSize = containerSize / (arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0) * containerSize;
	if (isNaN(baseSize)) baseSize = 0;
	baseSize = Math.max(baseSize, MIN_SIZE);
	return Math.floor(baseSize);
}
//#endregion
//#region node_modules/rc-virtual-list/es/List.js
init_extends();
init_typeof();
init_defineProperty();
init_slicedToArray();
init_objectWithoutProperties();
var _excluded$3 = [
	"prefixCls",
	"className",
	"height",
	"itemHeight",
	"fullHeight",
	"style",
	"data",
	"children",
	"itemKey",
	"virtual",
	"direction",
	"scrollWidth",
	"component",
	"onScroll",
	"onVirtualScroll",
	"onVisibleChange",
	"innerProps",
	"extraRender",
	"styles",
	"showScrollBar"
];
var EMPTY_DATA = [];
var ScrollStyle = {
	overflowY: "auto",
	overflowAnchor: "none"
};
function RawList(props, ref) {
	var _props$prefixCls = props.prefixCls, prefixCls = _props$prefixCls === void 0 ? "rc-virtual-list" : _props$prefixCls, className = props.className, height = props.height, itemHeight = props.itemHeight, _props$fullHeight = props.fullHeight, fullHeight = _props$fullHeight === void 0 ? true : _props$fullHeight, style = props.style, data = props.data, children = props.children, itemKey = props.itemKey, virtual = props.virtual, direction = props.direction, scrollWidth = props.scrollWidth, _props$component = props.component, Component = _props$component === void 0 ? "div" : _props$component, onScroll = props.onScroll, onVirtualScroll = props.onVirtualScroll, onVisibleChange = props.onVisibleChange, innerProps = props.innerProps, extraRender = props.extraRender, styles = props.styles, _props$showScrollBar = props.showScrollBar, showScrollBar = _props$showScrollBar === void 0 ? "optional" : _props$showScrollBar, restProps = _objectWithoutProperties(props, _excluded$3);
	var getKey = import_react.useCallback(function(item) {
		if (typeof itemKey === "function") return itemKey(item);
		return item === null || item === void 0 ? void 0 : item[itemKey];
	}, [itemKey]);
	var _useHeights2 = _slicedToArray(useHeights(getKey, null, null), 4), setInstanceRef = _useHeights2[0], collectHeight = _useHeights2[1], heights = _useHeights2[2], heightUpdatedMark = _useHeights2[3];
	var useVirtual = !!(virtual !== false && height && itemHeight);
	var containerHeight = import_react.useMemo(function() {
		return Object.values(heights.maps).reduce(function(total, curr) {
			return total + curr;
		}, 0);
	}, [heights.id, heights.maps]);
	var inVirtual = useVirtual && data && (Math.max(itemHeight * data.length, containerHeight) > height || !!scrollWidth);
	var isRTL = direction === "rtl";
	var mergedClassName = (0, import_classnames.default)(prefixCls, _defineProperty({}, "".concat(prefixCls, "-rtl"), isRTL), className);
	var mergedData = data || EMPTY_DATA;
	var componentRef = (0, import_react.useRef)();
	var fillerInnerRef = (0, import_react.useRef)();
	var containerRef = (0, import_react.useRef)();
	var _useState2 = _slicedToArray((0, import_react.useState)(0), 2), offsetTop = _useState2[0], setOffsetTop = _useState2[1];
	var _useState4 = _slicedToArray((0, import_react.useState)(0), 2), offsetLeft = _useState4[0], setOffsetLeft = _useState4[1];
	var _useState6 = _slicedToArray((0, import_react.useState)(false), 2), scrollMoving = _useState6[0], setScrollMoving = _useState6[1];
	var onScrollbarStartMove = function onScrollbarStartMove() {
		setScrollMoving(true);
	};
	var onScrollbarStopMove = function onScrollbarStopMove() {
		setScrollMoving(false);
	};
	var sharedConfig = { getKey };
	function syncScrollTop(newTop) {
		setOffsetTop(function(origin) {
			var value;
			if (typeof newTop === "function") value = newTop(origin);
			else value = newTop;
			var alignedTop = keepInRange(value);
			componentRef.current.scrollTop = alignedTop;
			return alignedTop;
		});
	}
	var rangeRef = (0, import_react.useRef)({
		start: 0,
		end: mergedData.length
	});
	var diffItemRef = (0, import_react.useRef)();
	diffItemRef.current = _slicedToArray(useDiffItem(mergedData, getKey), 1)[0];
	var _React$useMemo = import_react.useMemo(function() {
		if (!useVirtual) return {
			scrollHeight: void 0,
			start: 0,
			end: mergedData.length - 1,
			offset: void 0
		};
		if (!inVirtual) {
			var _fillerInnerRef$curre;
			return {
				scrollHeight: ((_fillerInnerRef$curre = fillerInnerRef.current) === null || _fillerInnerRef$curre === void 0 ? void 0 : _fillerInnerRef$curre.offsetHeight) || 0,
				start: 0,
				end: mergedData.length - 1,
				offset: void 0
			};
		}
		var itemTop = 0;
		var startIndex;
		var startOffset;
		var endIndex;
		var dataLen = mergedData.length;
		for (var i = 0; i < dataLen; i += 1) {
			var _item = mergedData[i];
			var key = getKey(_item);
			var cacheHeight = heights.get(key);
			var currentItemBottom = itemTop + (cacheHeight === void 0 ? itemHeight : cacheHeight);
			if (currentItemBottom >= offsetTop && startIndex === void 0) {
				startIndex = i;
				startOffset = itemTop;
			}
			if (currentItemBottom > offsetTop + height && endIndex === void 0) endIndex = i;
			itemTop = currentItemBottom;
		}
		if (startIndex === void 0) {
			startIndex = 0;
			startOffset = 0;
			endIndex = Math.ceil(height / itemHeight);
		}
		if (endIndex === void 0) endIndex = mergedData.length - 1;
		endIndex = Math.min(endIndex + 1, mergedData.length - 1);
		return {
			scrollHeight: itemTop,
			start: startIndex,
			end: endIndex,
			offset: startOffset
		};
	}, [
		inVirtual,
		useVirtual,
		offsetTop,
		mergedData,
		heightUpdatedMark,
		height
	]), scrollHeight = _React$useMemo.scrollHeight, start = _React$useMemo.start, end = _React$useMemo.end, fillerOffset = _React$useMemo.offset;
	rangeRef.current.start = start;
	rangeRef.current.end = end;
	import_react.useLayoutEffect(function() {
		var changedRecord = heights.getRecord();
		if (changedRecord.size === 1) {
			var recordKey = Array.from(changedRecord.keys())[0];
			var prevCacheHeight = changedRecord.get(recordKey);
			var startItem = mergedData[start];
			if (startItem && prevCacheHeight === void 0) {
				if (getKey(startItem) === recordKey) {
					var diffHeight = heights.get(recordKey) - itemHeight;
					syncScrollTop(function(ori) {
						return ori + diffHeight;
					});
				}
			}
		}
		heights.resetRecord();
	}, [scrollHeight]);
	var _React$useState2 = _slicedToArray(import_react.useState({
		width: 0,
		height
	}), 2), size = _React$useState2[0], setSize = _React$useState2[1];
	var onHolderResize = function onHolderResize(sizeInfo) {
		setSize({
			width: sizeInfo.offsetWidth,
			height: sizeInfo.offsetHeight
		});
	};
	var verticalScrollBarRef = (0, import_react.useRef)();
	var horizontalScrollBarRef = (0, import_react.useRef)();
	var horizontalScrollBarSpinSize = import_react.useMemo(function() {
		return getSpinSize(size.width, scrollWidth);
	}, [size.width, scrollWidth]);
	var verticalScrollBarSpinSize = import_react.useMemo(function() {
		return getSpinSize(size.height, scrollHeight);
	}, [size.height, scrollHeight]);
	var maxScrollHeight = scrollHeight - height;
	var maxScrollHeightRef = (0, import_react.useRef)(maxScrollHeight);
	maxScrollHeightRef.current = maxScrollHeight;
	function keepInRange(newScrollTop) {
		var newTop = newScrollTop;
		if (!Number.isNaN(maxScrollHeightRef.current)) newTop = Math.min(newTop, maxScrollHeightRef.current);
		newTop = Math.max(newTop, 0);
		return newTop;
	}
	var isScrollAtTop = offsetTop <= 0;
	var isScrollAtBottom = offsetTop >= maxScrollHeight;
	var isScrollAtLeft = offsetLeft <= 0;
	var isScrollAtRight = offsetLeft >= scrollWidth;
	var originScroll = useOriginScroll_default(isScrollAtTop, isScrollAtBottom, isScrollAtLeft, isScrollAtRight);
	var getVirtualScrollInfo = function getVirtualScrollInfo() {
		return {
			x: isRTL ? -offsetLeft : offsetLeft,
			y: offsetTop
		};
	};
	var lastVirtualScrollInfoRef = (0, import_react.useRef)(getVirtualScrollInfo());
	var triggerScroll = useEvent(function(params) {
		if (onVirtualScroll) {
			var nextInfo = _objectSpread2(_objectSpread2({}, getVirtualScrollInfo()), params);
			if (lastVirtualScrollInfoRef.current.x !== nextInfo.x || lastVirtualScrollInfoRef.current.y !== nextInfo.y) {
				onVirtualScroll(nextInfo);
				lastVirtualScrollInfoRef.current = nextInfo;
			}
		}
	});
	function onScrollBar(newScrollOffset, horizontal) {
		var newOffset = newScrollOffset;
		if (horizontal) {
			(0, import_react_dom.flushSync)(function() {
				setOffsetLeft(newOffset);
			});
			triggerScroll();
		} else syncScrollTop(newOffset);
	}
	function onFallbackScroll(e) {
		var newScrollTop = e.currentTarget.scrollTop;
		if (newScrollTop !== offsetTop) syncScrollTop(newScrollTop);
		onScroll === null || onScroll === void 0 || onScroll(e);
		triggerScroll();
	}
	var keepInHorizontalRange = function keepInHorizontalRange(nextOffsetLeft) {
		var tmpOffsetLeft = nextOffsetLeft;
		var max = !!scrollWidth ? scrollWidth - size.width : 0;
		tmpOffsetLeft = Math.max(tmpOffsetLeft, 0);
		tmpOffsetLeft = Math.min(tmpOffsetLeft, max);
		return tmpOffsetLeft;
	};
	var onWheelDelta = useEvent(function(offsetXY, fromHorizontal) {
		if (fromHorizontal) {
			(0, import_react_dom.flushSync)(function() {
				setOffsetLeft(function(left) {
					return keepInHorizontalRange(left + (isRTL ? -offsetXY : offsetXY));
				});
			});
			triggerScroll();
		} else syncScrollTop(function(top) {
			return top + offsetXY;
		});
	});
	var _useFrameWheel2 = _slicedToArray(useFrameWheel(useVirtual, isScrollAtTop, isScrollAtBottom, isScrollAtLeft, isScrollAtRight, !!scrollWidth, onWheelDelta), 2), onRawWheel = _useFrameWheel2[0], onFireFoxScroll = _useFrameWheel2[1];
	useMobileTouchMove(useVirtual, componentRef, function(isHorizontal, delta, smoothOffset, e) {
		var event = e;
		if (originScroll(isHorizontal, delta, smoothOffset)) return false;
		if (!event || !event._virtualHandled) {
			if (event) event._virtualHandled = true;
			onRawWheel({
				preventDefault: function preventDefault() {},
				deltaX: isHorizontal ? delta : 0,
				deltaY: isHorizontal ? 0 : delta
			});
			return true;
		}
		return false;
	});
	useScrollDrag(inVirtual, componentRef, function(offset) {
		syncScrollTop(function(top) {
			return top + offset;
		});
	});
	useLayoutEffect$1(function() {
		function onMozMousePixelScroll(e) {
			var scrollingUpAtTop = isScrollAtTop && e.detail < 0;
			var scrollingDownAtBottom = isScrollAtBottom && e.detail > 0;
			if (useVirtual && !scrollingUpAtTop && !scrollingDownAtBottom) e.preventDefault();
		}
		var componentEle = componentRef.current;
		componentEle.addEventListener("wheel", onRawWheel, { passive: false });
		componentEle.addEventListener("DOMMouseScroll", onFireFoxScroll, { passive: true });
		componentEle.addEventListener("MozMousePixelScroll", onMozMousePixelScroll, { passive: false });
		return function() {
			componentEle.removeEventListener("wheel", onRawWheel);
			componentEle.removeEventListener("DOMMouseScroll", onFireFoxScroll);
			componentEle.removeEventListener("MozMousePixelScroll", onMozMousePixelScroll);
		};
	}, [
		useVirtual,
		isScrollAtTop,
		isScrollAtBottom
	]);
	useLayoutEffect$1(function() {
		if (scrollWidth) {
			var newOffsetLeft = keepInHorizontalRange(offsetLeft);
			setOffsetLeft(newOffsetLeft);
			triggerScroll({ x: newOffsetLeft });
		}
	}, [size.width, scrollWidth]);
	var delayHideScrollBar = function delayHideScrollBar() {
		var _verticalScrollBarRef, _horizontalScrollBarR;
		(_verticalScrollBarRef = verticalScrollBarRef.current) === null || _verticalScrollBarRef === void 0 || _verticalScrollBarRef.delayHidden();
		(_horizontalScrollBarR = horizontalScrollBarRef.current) === null || _horizontalScrollBarR === void 0 || _horizontalScrollBarR.delayHidden();
	};
	var _scrollTo = useScrollTo(componentRef, mergedData, heights, itemHeight, getKey, function() {
		return collectHeight(true);
	}, syncScrollTop, delayHideScrollBar);
	import_react.useImperativeHandle(ref, function() {
		return {
			nativeElement: containerRef.current,
			getScrollInfo: getVirtualScrollInfo,
			scrollTo: function scrollTo(config) {
				function isPosScroll(arg) {
					return arg && _typeof(arg) === "object" && ("left" in arg || "top" in arg);
				}
				if (isPosScroll(config)) {
					if (config.left !== void 0) setOffsetLeft(keepInHorizontalRange(config.left));
					_scrollTo(config.top);
				} else _scrollTo(config);
			}
		};
	});
	/** We need told outside that some list not rendered */
	useLayoutEffect$1(function() {
		if (onVisibleChange) onVisibleChange(mergedData.slice(start, end + 1), mergedData);
	}, [
		start,
		end,
		mergedData
	]);
	var getSize = useGetSize(mergedData, getKey, heights, itemHeight);
	var extraContent = extraRender === null || extraRender === void 0 ? void 0 : extraRender({
		start,
		end,
		virtual: inVirtual,
		offsetX: offsetLeft,
		offsetY: fillerOffset,
		rtl: isRTL,
		getSize
	});
	var listChildren = useChildren(mergedData, start, end, scrollWidth, offsetLeft, setInstanceRef, children, sharedConfig);
	var componentStyle = null;
	if (height) {
		componentStyle = _objectSpread2(_defineProperty({}, fullHeight ? "height" : "maxHeight", height), ScrollStyle);
		if (useVirtual) {
			componentStyle.overflowY = "hidden";
			if (scrollWidth) componentStyle.overflowX = "hidden";
			if (scrollMoving) componentStyle.pointerEvents = "none";
		}
	}
	var containerProps = {};
	if (isRTL) containerProps.dir = "rtl";
	return /*#__PURE__*/ import_react.createElement("div", _extends({
		ref: containerRef,
		style: _objectSpread2(_objectSpread2({}, style), {}, { position: "relative" }),
		className: mergedClassName
	}, containerProps, restProps), /*#__PURE__*/ import_react.createElement(RefResizeObserver, { onResize: onHolderResize }, /*#__PURE__*/ import_react.createElement(Component, {
		className: "".concat(prefixCls, "-holder"),
		style: componentStyle,
		ref: componentRef,
		onScroll: onFallbackScroll,
		onMouseEnter: delayHideScrollBar
	}, /*#__PURE__*/ import_react.createElement(Filler, {
		prefixCls,
		height: scrollHeight,
		offsetX: offsetLeft,
		offsetY: fillerOffset,
		scrollWidth,
		onInnerResize: collectHeight,
		ref: fillerInnerRef,
		innerProps,
		rtl: isRTL,
		extra: extraContent
	}, listChildren))), inVirtual && scrollHeight > height && /*#__PURE__*/ import_react.createElement(ScrollBar, {
		ref: verticalScrollBarRef,
		prefixCls,
		scrollOffset: offsetTop,
		scrollRange: scrollHeight,
		rtl: isRTL,
		onScroll: onScrollBar,
		onStartMove: onScrollbarStartMove,
		onStopMove: onScrollbarStopMove,
		spinSize: verticalScrollBarSpinSize,
		containerSize: size.height,
		style: styles === null || styles === void 0 ? void 0 : styles.verticalScrollBar,
		thumbStyle: styles === null || styles === void 0 ? void 0 : styles.verticalScrollBarThumb,
		showScrollBar
	}), inVirtual && scrollWidth > size.width && /*#__PURE__*/ import_react.createElement(ScrollBar, {
		ref: horizontalScrollBarRef,
		prefixCls,
		scrollOffset: offsetLeft,
		scrollRange: scrollWidth,
		rtl: isRTL,
		onScroll: onScrollBar,
		onStartMove: onScrollbarStartMove,
		onStopMove: onScrollbarStopMove,
		spinSize: horizontalScrollBarSpinSize,
		containerSize: size.width,
		horizontal: true,
		style: styles === null || styles === void 0 ? void 0 : styles.horizontalScrollBar,
		thumbStyle: styles === null || styles === void 0 ? void 0 : styles.horizontalScrollBarThumb,
		showScrollBar
	}));
}
var List = /*#__PURE__*/ import_react.forwardRef(RawList);
List.displayName = "List";
//#endregion
//#region node_modules/rc-virtual-list/es/index.js
var es_default$1 = List;
//#endregion
//#region node_modules/rc-select/es/utils/platformUtil.js
/* istanbul ignore file */
function isPlatformMac() {
	return /(mac\sos|macintosh)/i.test(navigator.appVersion);
}
//#endregion
//#region node_modules/rc-select/es/OptionList.js
init_defineProperty();
init_objectWithoutProperties();
init_extends();
init_slicedToArray();
init_toConsumableArray();
var _excluded$2 = [
	"disabled",
	"title",
	"children",
	"style",
	"className"
];
function isTitleType(content) {
	return typeof content === "string" || typeof content === "number";
}
var RefOptionList = /*#__PURE__*/ import_react.forwardRef(function OptionList(_, ref) {
	var _useBaseProps = useBaseProps(), prefixCls = _useBaseProps.prefixCls, id = _useBaseProps.id, open = _useBaseProps.open, multiple = _useBaseProps.multiple, mode = _useBaseProps.mode, searchValue = _useBaseProps.searchValue, toggleOpen = _useBaseProps.toggleOpen, notFoundContent = _useBaseProps.notFoundContent, onPopupScroll = _useBaseProps.onPopupScroll;
	var _React$useContext = import_react.useContext(SelectContext), maxCount = _React$useContext.maxCount, flattenOptions = _React$useContext.flattenOptions, onActiveValue = _React$useContext.onActiveValue, defaultActiveFirstOption = _React$useContext.defaultActiveFirstOption, onSelect = _React$useContext.onSelect, menuItemSelectedIcon = _React$useContext.menuItemSelectedIcon, rawValues = _React$useContext.rawValues, fieldNames = _React$useContext.fieldNames, virtual = _React$useContext.virtual, direction = _React$useContext.direction, listHeight = _React$useContext.listHeight, listItemHeight = _React$useContext.listItemHeight, optionRender = _React$useContext.optionRender;
	var itemPrefixCls = "".concat(prefixCls, "-item");
	var memoFlattenOptions = useMemo$2(function() {
		return flattenOptions;
	}, [open, flattenOptions], function(prev, next) {
		return next[0] && prev[1] !== next[1];
	});
	var listRef = import_react.useRef(null);
	var overMaxCount = import_react.useMemo(function() {
		return multiple && isValidCount(maxCount) && (rawValues === null || rawValues === void 0 ? void 0 : rawValues.size) >= maxCount;
	}, [
		multiple,
		maxCount,
		rawValues === null || rawValues === void 0 ? void 0 : rawValues.size
	]);
	var onListMouseDown = function onListMouseDown(event) {
		event.preventDefault();
	};
	var scrollIntoView = function scrollIntoView(args) {
		var _listRef$current;
		(_listRef$current = listRef.current) === null || _listRef$current === void 0 || _listRef$current.scrollTo(typeof args === "number" ? { index: args } : args);
	};
	var isSelected = import_react.useCallback(function(value) {
		if (mode === "combobox") return false;
		return rawValues.has(value);
	}, [
		mode,
		_toConsumableArray(rawValues).toString(),
		rawValues.size
	]);
	var getEnabledActiveIndex = function getEnabledActiveIndex(index) {
		var offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
		var len = memoFlattenOptions.length;
		for (var i = 0; i < len; i += 1) {
			var current = (index + i * offset + len) % len;
			var _ref = memoFlattenOptions[current] || {}, group = _ref.group, data = _ref.data;
			if (!group && !(data !== null && data !== void 0 && data.disabled) && (isSelected(data.value) || !overMaxCount)) return current;
		}
		return -1;
	};
	var _React$useState2 = _slicedToArray(import_react.useState(function() {
		return getEnabledActiveIndex(0);
	}), 2), activeIndex = _React$useState2[0], setActiveIndex = _React$useState2[1];
	var setActive = function setActive(index) {
		var fromKeyboard = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
		setActiveIndex(index);
		var info = { source: fromKeyboard ? "keyboard" : "mouse" };
		var flattenItem = memoFlattenOptions[index];
		if (!flattenItem) {
			onActiveValue(null, -1, info);
			return;
		}
		onActiveValue(flattenItem.value, index, info);
	};
	(0, import_react.useEffect)(function() {
		setActive(defaultActiveFirstOption !== false ? getEnabledActiveIndex(0) : -1);
	}, [memoFlattenOptions.length, searchValue]);
	var isAriaSelected = import_react.useCallback(function(value) {
		if (mode === "combobox") return String(value).toLowerCase() === searchValue.toLowerCase();
		return rawValues.has(value);
	}, [
		mode,
		searchValue,
		_toConsumableArray(rawValues).toString(),
		rawValues.size
	]);
	(0, import_react.useEffect)(function() {
		/**
		* React will skip `onChange` when component update.
		* `setActive` function will call root accessibility state update which makes re-render.
		* So we need to delay to let Input component trigger onChange first.
		*/
		var timeoutId = setTimeout(function() {
			if (!multiple && open && rawValues.size === 1) {
				var value = Array.from(rawValues)[0];
				var index = memoFlattenOptions.findIndex(function(_ref2) {
					var data = _ref2.data;
					return searchValue ? String(data.value).startsWith(searchValue) : data.value === value;
				});
				if (index !== -1) {
					setActive(index);
					scrollIntoView(index);
				}
			}
		});
		if (open) {
			var _listRef$current2;
			(_listRef$current2 = listRef.current) === null || _listRef$current2 === void 0 || _listRef$current2.scrollTo(void 0);
		}
		return function() {
			return clearTimeout(timeoutId);
		};
	}, [open, searchValue]);
	var onSelectValue = function onSelectValue(value) {
		if (value !== void 0) onSelect(value, { selected: !rawValues.has(value) });
		if (!multiple) toggleOpen(false);
	};
	import_react.useImperativeHandle(ref, function() {
		return {
			onKeyDown: function onKeyDown(event) {
				var which = event.which, ctrlKey = event.ctrlKey;
				switch (which) {
					case KeyCode.N:
					case KeyCode.P:
					case KeyCode.UP:
					case KeyCode.DOWN:
						var offset = 0;
						if (which === KeyCode.UP) offset = -1;
						else if (which === KeyCode.DOWN) offset = 1;
						else if (isPlatformMac() && ctrlKey) {
							if (which === KeyCode.N) offset = 1;
							else if (which === KeyCode.P) offset = -1;
						}
						if (offset !== 0) {
							var nextActiveIndex = getEnabledActiveIndex(activeIndex + offset, offset);
							scrollIntoView(nextActiveIndex);
							setActive(nextActiveIndex, true);
						}
						break;
					case KeyCode.TAB:
					case KeyCode.ENTER:
						var _item$data;
						var item = memoFlattenOptions[activeIndex];
						if (item && !(item !== null && item !== void 0 && (_item$data = item.data) !== null && _item$data !== void 0 && _item$data.disabled) && !overMaxCount) onSelectValue(item.value);
						else onSelectValue(void 0);
						if (open) event.preventDefault();
						break;
					case KeyCode.ESC:
						toggleOpen(false);
						if (open) event.stopPropagation();
				}
			},
			onKeyUp: function onKeyUp() {},
			scrollTo: function scrollTo(index) {
				scrollIntoView(index);
			}
		};
	});
	if (memoFlattenOptions.length === 0) return /*#__PURE__*/ import_react.createElement("div", {
		role: "listbox",
		id: "".concat(id, "_list"),
		className: "".concat(itemPrefixCls, "-empty"),
		onMouseDown: onListMouseDown
	}, notFoundContent);
	var omitFieldNameList = Object.keys(fieldNames).map(function(key) {
		return fieldNames[key];
	});
	var getLabel = function getLabel(item) {
		return item.label;
	};
	function getItemAriaProps(item, index) {
		return {
			role: item.group ? "presentation" : "option",
			id: "".concat(id, "_list_").concat(index)
		};
	}
	var renderItem = function renderItem(index) {
		var item = memoFlattenOptions[index];
		if (!item) return null;
		var itemData = item.data || {};
		var value = itemData.value;
		var group = item.group;
		var attrs = pickAttrs(itemData, true);
		var mergedLabel = getLabel(item);
		return item ? /*#__PURE__*/ import_react.createElement("div", _extends({ "aria-label": typeof mergedLabel === "string" && !group ? mergedLabel : null }, attrs, { key: index }, getItemAriaProps(item, index), { "aria-selected": isAriaSelected(value) }), value) : null;
	};
	var a11yProps = {
		role: "listbox",
		id: "".concat(id, "_list")
	};
	return /*#__PURE__*/ import_react.createElement(import_react.Fragment, null, virtual && /*#__PURE__*/ import_react.createElement("div", _extends({}, a11yProps, { style: {
		height: 0,
		width: 0,
		overflow: "hidden"
	} }), renderItem(activeIndex - 1), renderItem(activeIndex), renderItem(activeIndex + 1)), /*#__PURE__*/ import_react.createElement(es_default$1, {
		itemKey: "key",
		ref: listRef,
		data: memoFlattenOptions,
		height: listHeight,
		itemHeight: listItemHeight,
		fullHeight: false,
		onMouseDown: onListMouseDown,
		onScroll: onPopupScroll,
		virtual,
		direction,
		innerProps: virtual ? null : a11yProps
	}, function(item, itemIndex) {
		var group = item.group, groupOption = item.groupOption, data = item.data, label = item.label, value = item.value;
		var key = data.key;
		if (group) {
			var _data$title;
			var groupTitle = (_data$title = data.title) !== null && _data$title !== void 0 ? _data$title : isTitleType(label) ? label.toString() : void 0;
			return /*#__PURE__*/ import_react.createElement("div", {
				className: (0, import_classnames.default)(itemPrefixCls, "".concat(itemPrefixCls, "-group"), data.className),
				title: groupTitle
			}, label !== void 0 ? label : key);
		}
		var disabled = data.disabled, title = data.title;
		data.children;
		var style = data.style, className = data.className;
		var passedProps = omit(_objectWithoutProperties(data, _excluded$2), omitFieldNameList);
		var selected = isSelected(value);
		var mergedDisabled = disabled || !selected && overMaxCount;
		var optionPrefixCls = "".concat(itemPrefixCls, "-option");
		var optionClassName = (0, import_classnames.default)(itemPrefixCls, optionPrefixCls, className, _defineProperty(_defineProperty(_defineProperty(_defineProperty({}, "".concat(optionPrefixCls, "-grouped"), groupOption), "".concat(optionPrefixCls, "-active"), activeIndex === itemIndex && !mergedDisabled), "".concat(optionPrefixCls, "-disabled"), mergedDisabled), "".concat(optionPrefixCls, "-selected"), selected));
		var mergedLabel = getLabel(item);
		var iconVisible = !menuItemSelectedIcon || typeof menuItemSelectedIcon === "function" || selected;
		var content = typeof mergedLabel === "number" ? mergedLabel : mergedLabel || value;
		var optionTitle = isTitleType(content) ? content.toString() : void 0;
		if (title !== void 0) optionTitle = title;
		return /*#__PURE__*/ import_react.createElement("div", _extends({}, pickAttrs(passedProps), !virtual ? getItemAriaProps(item, itemIndex) : {}, {
			"aria-selected": isAriaSelected(value),
			className: optionClassName,
			title: optionTitle,
			onMouseMove: function onMouseMove() {
				if (activeIndex === itemIndex || mergedDisabled) return;
				setActive(itemIndex);
			},
			onClick: function onClick() {
				if (!mergedDisabled) onSelectValue(value);
			},
			style
		}), /*#__PURE__*/ import_react.createElement("div", { className: "".concat(optionPrefixCls, "-content") }, typeof optionRender === "function" ? optionRender(item, { index: itemIndex }) : content), /*#__PURE__*/ import_react.isValidElement(menuItemSelectedIcon) || selected, iconVisible && /*#__PURE__*/ import_react.createElement(TransBtn, {
			className: "".concat(itemPrefixCls, "-option-state"),
			customizeIcon: menuItemSelectedIcon,
			customizeIconProps: {
				value,
				disabled: mergedDisabled,
				isSelected: selected
			}
		}, selected ? "✓" : null));
	}));
});
RefOptionList.displayName = "OptionList";
//#endregion
//#region node_modules/rc-select/es/hooks/useCache.js
/**
* Cache `value` related LabeledValue & options.
*/
var useCache_default = (function(labeledValues, valueOptions) {
	var cacheRef = import_react.useRef({
		values: /* @__PURE__ */ new Map(),
		options: /* @__PURE__ */ new Map()
	});
	return [import_react.useMemo(function() {
		var _cacheRef$current = cacheRef.current, prevValueCache = _cacheRef$current.values, prevOptionCache = _cacheRef$current.options;
		var patchedValues = labeledValues.map(function(item) {
			if (item.label === void 0) {
				var _prevValueCache$get;
				return _objectSpread2(_objectSpread2({}, item), {}, { label: (_prevValueCache$get = prevValueCache.get(item.value)) === null || _prevValueCache$get === void 0 ? void 0 : _prevValueCache$get.label });
			}
			return item;
		});
		var valueCache = /* @__PURE__ */ new Map();
		var optionCache = /* @__PURE__ */ new Map();
		patchedValues.forEach(function(item) {
			valueCache.set(item.value, item);
			optionCache.set(item.value, valueOptions.get(item.value) || prevOptionCache.get(item.value));
		});
		cacheRef.current.values = valueCache;
		cacheRef.current.options = optionCache;
		return patchedValues;
	}, [labeledValues, valueOptions]), import_react.useCallback(function(val) {
		return valueOptions.get(val) || cacheRef.current.options.get(val);
	}, [valueOptions])];
});
//#endregion
//#region node_modules/rc-select/es/hooks/useFilterOptions.js
init_defineProperty();
function includes(test, search) {
	return toArray$1(test).join("").toUpperCase().includes(search);
}
var useFilterOptions_default = (function(options, fieldNames, searchValue, filterOption, optionFilterProp) {
	return import_react.useMemo(function() {
		if (!searchValue || filterOption === false) return options;
		var fieldOptions = fieldNames.options, fieldLabel = fieldNames.label, fieldValue = fieldNames.value;
		var filteredOptions = [];
		var customizeFilter = typeof filterOption === "function";
		var upperSearch = searchValue.toUpperCase();
		var filterFunc = customizeFilter ? filterOption : function(_, option) {
			if (optionFilterProp) return includes(option[optionFilterProp], upperSearch);
			if (option[fieldOptions]) return includes(option[fieldLabel !== "children" ? fieldLabel : "label"], upperSearch);
			return includes(option[fieldValue], upperSearch);
		};
		var wrapOption = customizeFilter ? function(opt) {
			return injectPropsWithOption(opt);
		} : function(opt) {
			return opt;
		};
		options.forEach(function(item) {
			if (item[fieldOptions]) {
				if (filterFunc(searchValue, wrapOption(item))) filteredOptions.push(item);
				else {
					var subOptions = item[fieldOptions].filter(function(subItem) {
						return filterFunc(searchValue, wrapOption(subItem));
					});
					if (subOptions.length) filteredOptions.push(_objectSpread2(_objectSpread2({}, item), {}, _defineProperty({}, fieldOptions, subOptions)));
				}
				return;
			}
			if (filterFunc(searchValue, wrapOption(item))) filteredOptions.push(item);
		});
		return filteredOptions;
	}, [
		options,
		filterOption,
		optionFilterProp,
		searchValue,
		fieldNames
	]);
});
//#endregion
//#region node_modules/rc-select/es/hooks/useId.js
init_slicedToArray();
var uuid = 0;
/** Is client side and not jsdom */
var isBrowserClient = canUseDom();
/** Get unique id for accessibility usage */
function getUUID() {
	var retId;
	/* istanbul ignore if */
	if (isBrowserClient) {
		retId = uuid;
		uuid += 1;
	} else retId = "TEST_OR_SSR";
	return retId;
}
function useId(id) {
	var _React$useState2 = _slicedToArray(import_react.useState(), 2), innerId = _React$useState2[0], setInnerId = _React$useState2[1];
	import_react.useEffect(function() {
		setInnerId("rc_select_".concat(getUUID()));
	}, []);
	return id || innerId;
}
//#endregion
//#region node_modules/rc-select/es/utils/legacyUtil.js
init_objectWithoutProperties();
var _excluded$1 = ["children", "value"];
var _excluded2 = ["children"];
function convertNodeToOption(node) {
	var _ref = node, key = _ref.key, _ref$props = _ref.props, children = _ref$props.children, value = _ref$props.value, restProps = _objectWithoutProperties(_ref$props, _excluded$1);
	return _objectSpread2({
		key,
		value: value !== void 0 ? value : key,
		children
	}, restProps);
}
function convertChildrenToData(nodes) {
	var optionOnly = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
	return toArray$2(nodes).map(function(node, index) {
		if (!/*#__PURE__*/ import_react.isValidElement(node) || !node.type) return null;
		var _ref2 = node, isSelectOptGroup = _ref2.type.isSelectOptGroup, key = _ref2.key, _ref2$props = _ref2.props, children = _ref2$props.children, restProps = _objectWithoutProperties(_ref2$props, _excluded2);
		if (optionOnly || !isSelectOptGroup) return convertNodeToOption(node);
		return _objectSpread2(_objectSpread2({
			key: "__RC_SELECT_GRP__".concat(key === null ? index : key, "__"),
			label: key
		}, restProps), {}, { options: convertChildrenToData(children) });
	}).filter(function(data) {
		return data;
	});
}
//#endregion
//#region node_modules/rc-select/es/hooks/useOptions.js
/**
* Parse `children` to `options` if `options` is not provided.
* Then flatten the `options`.
*/
var useOptions = function useOptions(options, children, fieldNames, optionFilterProp, optionLabelProp) {
	return import_react.useMemo(function() {
		var mergedOptions = options;
		if (!options) mergedOptions = convertChildrenToData(children);
		var valueOptions = /* @__PURE__ */ new Map();
		var labelOptions = /* @__PURE__ */ new Map();
		var setLabelOptions = function setLabelOptions(labelOptionsMap, option, key) {
			if (key && typeof key === "string") labelOptionsMap.set(option[key], option);
		};
		(function dig(optionList) {
			var isChildren = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
			for (var i = 0; i < optionList.length; i += 1) {
				var option = optionList[i];
				if (!option[fieldNames.options] || isChildren) {
					valueOptions.set(option[fieldNames.value], option);
					setLabelOptions(labelOptions, option, fieldNames.label);
					setLabelOptions(labelOptions, option, optionFilterProp);
					setLabelOptions(labelOptions, option, optionLabelProp);
				} else dig(option[fieldNames.options], true);
			}
		})(mergedOptions);
		return {
			options: mergedOptions,
			valueOptions,
			labelOptions
		};
	}, [
		options,
		children,
		fieldNames,
		optionFilterProp,
		optionLabelProp
	]);
};
//#endregion
//#region node_modules/rc-select/es/hooks/useRefFunc.js
/**
* Same as `React.useCallback` but always return a memoized function
* but redirect to real function.
*/
function useRefFunc(callback) {
	var funcRef = import_react.useRef();
	funcRef.current = callback;
	return import_react.useCallback(function() {
		return funcRef.current.apply(funcRef, arguments);
	}, []);
}
//#endregion
//#region node_modules/rc-select/es/utils/warningPropsUtil.js
init_typeof();
function warningProps(props) {
	var mode = props.mode, options = props.options, children = props.children, backfill = props.backfill, allowClear = props.allowClear, placeholder = props.placeholder, getInputElement = props.getInputElement, showSearch = props.showSearch, onSearch = props.onSearch, defaultOpen = props.defaultOpen, autoFocus = props.autoFocus, labelInValue = props.labelInValue, value = props.value, inputValue = props.inputValue, optionLabelProp = props.optionLabelProp;
	var multiple = isMultiple(mode);
	var mergedShowSearch = showSearch !== void 0 ? showSearch : multiple || mode === "combobox";
	var mergedOptions = options || convertChildrenToData(children);
	warningOnce(mode !== "tags" || mergedOptions.every(function(opt) {
		return !opt.disabled;
	}), "Please avoid setting option to disabled in tags mode since user can always type text as tag.");
	if (mode === "tags" || mode === "combobox") warningOnce(!mergedOptions.some(function(item) {
		if (item.options) return item.options.some(function(opt) {
			return typeof ("value" in opt ? opt.value : opt.key) === "number";
		});
		return typeof ("value" in item ? item.value : item.key) === "number";
	}), "`value` of Option should not use number type when `mode` is `tags` or `combobox`.");
	warningOnce(mode !== "combobox" || !optionLabelProp, "`combobox` mode not support `optionLabelProp`. Please set `value` on Option directly.");
	warningOnce(mode === "combobox" || !backfill, "`backfill` only works with `combobox` mode.");
	warningOnce(mode === "combobox" || !getInputElement, "`getInputElement` only work with `combobox` mode.");
	noteOnce(mode !== "combobox" || !getInputElement || !allowClear || !placeholder, "Customize `getInputElement` should customize clear and placeholder logic instead of configuring `allowClear` and `placeholder`.");
	if (onSearch && !mergedShowSearch && mode !== "combobox" && mode !== "tags") warningOnce(false, "`onSearch` should work with `showSearch` instead of use alone.");
	noteOnce(!defaultOpen || autoFocus, "`defaultOpen` makes Select open without focus which means it will not close by click outside. You can set `autoFocus` if needed.");
	if (value !== void 0 && value !== null) {
		var values = toArray$1(value);
		warningOnce(!labelInValue || values.every(function(val) {
			return _typeof(val) === "object" && ("key" in val || "value" in val);
		}), "`value` should in shape of `{ value: string | number, label?: ReactNode }` when you set `labelInValue` to `true`");
		warningOnce(!multiple || Array.isArray(value), "`value` should be array when `mode` is `multiple` or `tags`");
	}
	if (children) {
		var invalidateChildType = null;
		toArray$2(children).some(function(node) {
			if (!/*#__PURE__*/ import_react.isValidElement(node) || !node.type) return false;
			var type = node.type;
			if (type.isSelectOption) return false;
			if (type.isSelectOptGroup) {
				if (toArray$2(node.props.children).every(function(subNode) {
					if (!/*#__PURE__*/ import_react.isValidElement(subNode) || !node.type || subNode.type.isSelectOption) return true;
					invalidateChildType = subNode.type;
					return false;
				})) return false;
				return true;
			}
			invalidateChildType = type;
			return true;
		});
		if (invalidateChildType) warningOnce(false, "`children` should be `Select.Option` or `Select.OptGroup` instead of `".concat(invalidateChildType.displayName || invalidateChildType.name || invalidateChildType, "`."));
		warningOnce(inputValue === void 0, "`inputValue` is deprecated, please use `searchValue` instead.");
	}
}
function warningNullOptions(options, fieldNames) {
	if (options) (function recursiveOptions(optionsList) {
		var inGroup = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
		for (var i = 0; i < optionsList.length; i++) {
			var option = optionsList[i];
			if (option[fieldNames === null || fieldNames === void 0 ? void 0 : fieldNames.value] === null) {
				warningOnce(false, "`value` in Select options should not be `null`.");
				return true;
			}
			if (!inGroup && Array.isArray(option[fieldNames === null || fieldNames === void 0 ? void 0 : fieldNames.options]) && recursiveOptions(option[fieldNames === null || fieldNames === void 0 ? void 0 : fieldNames.options], true)) break;
		}
	})(options);
}
//#endregion
//#region node_modules/rc-select/es/Select.js
/**
* To match accessibility requirement, we always provide an input in the component.
* Other element will not set `tabIndex` to avoid `onBlur` sequence problem.
* For focused select, we set `aria-live="polite"` to update the accessibility content.
*
* ref:
* - keyboard: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/listbox_role#Keyboard_interactions
*
* New api:
* - listHeight
* - listItemHeight
* - component
*
* Remove deprecated api:
* - multiple
* - tags
* - combobox
* - firstActiveValue
* - dropdownMenuStyle
* - openClassName (Not list in api)
*
* Update:
* - `backfill` only support `combobox` mode
* - `combobox` mode not support `labelInValue` since it's meaningless
* - `getInputElement` only support `combobox` mode
* - `onChange` return OptionData instead of ReactNode
* - `filterOption` `onChange` `onSelect` accept OptionData instead of ReactNode
* - `combobox` mode trigger `onChange` will get `undefined` if no `value` match in Option
* - `combobox` mode not support `optionLabelProp`
*/
init_extends();
init_toConsumableArray();
init_defineProperty();
init_slicedToArray();
init_objectWithoutProperties();
init_typeof();
var _excluded = [
	"id",
	"mode",
	"prefixCls",
	"backfill",
	"fieldNames",
	"inputValue",
	"searchValue",
	"onSearch",
	"autoClearSearchValue",
	"onSelect",
	"onDeselect",
	"dropdownMatchSelectWidth",
	"filterOption",
	"filterSort",
	"optionFilterProp",
	"optionLabelProp",
	"options",
	"optionRender",
	"children",
	"defaultActiveFirstOption",
	"menuItemSelectedIcon",
	"virtual",
	"direction",
	"listHeight",
	"listItemHeight",
	"labelRender",
	"value",
	"defaultValue",
	"labelInValue",
	"onChange",
	"maxCount"
];
var OMIT_DOM_PROPS = ["inputValue"];
function isRawValue(value) {
	return !value || _typeof(value) !== "object";
}
var Select$1 = /*#__PURE__*/ import_react.forwardRef(function(props, ref) {
	var id = props.id, mode = props.mode, _props$prefixCls = props.prefixCls, prefixCls = _props$prefixCls === void 0 ? "rc-select" : _props$prefixCls, backfill = props.backfill, fieldNames = props.fieldNames, inputValue = props.inputValue, searchValue = props.searchValue, onSearch = props.onSearch, _props$autoClearSearc = props.autoClearSearchValue, autoClearSearchValue = _props$autoClearSearc === void 0 ? true : _props$autoClearSearc, onSelect = props.onSelect, onDeselect = props.onDeselect, _props$dropdownMatchS = props.dropdownMatchSelectWidth, dropdownMatchSelectWidth = _props$dropdownMatchS === void 0 ? true : _props$dropdownMatchS, filterOption = props.filterOption, filterSort = props.filterSort, optionFilterProp = props.optionFilterProp, optionLabelProp = props.optionLabelProp, options = props.options, optionRender = props.optionRender, children = props.children, defaultActiveFirstOption = props.defaultActiveFirstOption, menuItemSelectedIcon = props.menuItemSelectedIcon, virtual = props.virtual, direction = props.direction, _props$listHeight = props.listHeight, listHeight = _props$listHeight === void 0 ? 200 : _props$listHeight, _props$listItemHeight = props.listItemHeight, listItemHeight = _props$listItemHeight === void 0 ? 20 : _props$listItemHeight, labelRender = props.labelRender, value = props.value, defaultValue = props.defaultValue, labelInValue = props.labelInValue, onChange = props.onChange, maxCount = props.maxCount, restProps = _objectWithoutProperties(props, _excluded);
	var mergedId = useId(id);
	var multiple = isMultiple(mode);
	var childrenAsData = !!(!options && children);
	var mergedFilterOption = import_react.useMemo(function() {
		if (filterOption === void 0 && mode === "combobox") return false;
		return filterOption;
	}, [filterOption, mode]);
	var mergedFieldNames = import_react.useMemo(function() {
		return fillFieldNames(fieldNames, childrenAsData);
	}, [JSON.stringify(fieldNames), childrenAsData]);
	var _useMergedState2 = _slicedToArray(useMergedState("", {
		value: searchValue !== void 0 ? searchValue : inputValue,
		postState: function postState(search) {
			return search || "";
		}
	}), 2), mergedSearchValue = _useMergedState2[0], setSearchValue = _useMergedState2[1];
	var parsedOptions = useOptions(options, children, mergedFieldNames, optionFilterProp, optionLabelProp);
	var valueOptions = parsedOptions.valueOptions, labelOptions = parsedOptions.labelOptions, mergedOptions = parsedOptions.options;
	var convert2LabelValues = import_react.useCallback(function(draftValues) {
		return toArray$1(draftValues).map(function(val) {
			var rawValue;
			var rawLabel;
			var rawKey;
			var rawDisabled;
			var rawTitle;
			if (isRawValue(val)) rawValue = val;
			else {
				var _val$value;
				rawKey = val.key;
				rawLabel = val.label;
				rawValue = (_val$value = val.value) !== null && _val$value !== void 0 ? _val$value : rawKey;
			}
			var option = valueOptions.get(rawValue);
			if (option) {
				var _option$key;
				if (rawLabel === void 0) rawLabel = option === null || option === void 0 ? void 0 : option[optionLabelProp || mergedFieldNames.label];
				if (rawKey === void 0) rawKey = (_option$key = option === null || option === void 0 ? void 0 : option.key) !== null && _option$key !== void 0 ? _option$key : rawValue;
				rawDisabled = option === null || option === void 0 ? void 0 : option.disabled;
				rawTitle = option === null || option === void 0 ? void 0 : option.title;
				if (!optionLabelProp) {
					var optionLabel = option === null || option === void 0 ? void 0 : option[mergedFieldNames.label];
					if (optionLabel !== void 0 && !/*#__PURE__*/ import_react.isValidElement(optionLabel) && !/*#__PURE__*/ import_react.isValidElement(rawLabel) && optionLabel !== rawLabel) warningOnce(false, "`label` of `value` is not same as `label` in Select options.");
				}
			}
			return {
				label: rawLabel,
				value: rawValue,
				key: rawKey,
				disabled: rawDisabled,
				title: rawTitle
			};
		});
	}, [
		mergedFieldNames,
		optionLabelProp,
		valueOptions
	]);
	var _useMergedState4 = _slicedToArray(useMergedState(defaultValue, { value }), 2), internalValue = _useMergedState4[0], setInternalValue = _useMergedState4[1];
	var _useCache2 = _slicedToArray(useCache_default(import_react.useMemo(function() {
		var _values$;
		var values = convert2LabelValues(multiple && internalValue === null ? [] : internalValue);
		if (mode === "combobox" && isComboNoValue((_values$ = values[0]) === null || _values$ === void 0 ? void 0 : _values$.value)) return [];
		return values;
	}, [
		internalValue,
		convert2LabelValues,
		mode,
		multiple
	]), valueOptions), 2), mergedValues = _useCache2[0], getMixedOption = _useCache2[1];
	var displayValues = import_react.useMemo(function() {
		if (!mode && mergedValues.length === 1) {
			var firstValue = mergedValues[0];
			if (firstValue.value === null && (firstValue.label === null || firstValue.label === void 0)) return [];
		}
		return mergedValues.map(function(item) {
			var _ref;
			return _objectSpread2(_objectSpread2({}, item), {}, { label: (_ref = typeof labelRender === "function" ? labelRender(item) : item.label) !== null && _ref !== void 0 ? _ref : item.value });
		});
	}, [
		mode,
		mergedValues,
		labelRender
	]);
	/** Convert `displayValues` to raw value type set */
	var rawValues = import_react.useMemo(function() {
		return new Set(mergedValues.map(function(val) {
			return val.value;
		}));
	}, [mergedValues]);
	import_react.useEffect(function() {
		if (mode === "combobox") {
			var _mergedValues$;
			var strValue = (_mergedValues$ = mergedValues[0]) === null || _mergedValues$ === void 0 ? void 0 : _mergedValues$.value;
			setSearchValue(hasValue(strValue) ? String(strValue) : "");
		}
	}, [mergedValues]);
	var createTagOption = useRefFunc(function(val, label) {
		var mergedLabel = label !== null && label !== void 0 ? label : val;
		return _defineProperty(_defineProperty({}, mergedFieldNames.value, val), mergedFieldNames.label, mergedLabel);
	});
	var filteredOptions = useFilterOptions_default(import_react.useMemo(function() {
		if (mode !== "tags") return mergedOptions;
		var cloneOptions = _toConsumableArray(mergedOptions);
		var existOptions = function existOptions(val) {
			return valueOptions.has(val);
		};
		_toConsumableArray(mergedValues).sort(function(a, b) {
			return a.value < b.value ? -1 : 1;
		}).forEach(function(item) {
			var val = item.value;
			if (!existOptions(val)) cloneOptions.push(createTagOption(val, item.label));
		});
		return cloneOptions;
	}, [
		createTagOption,
		mergedOptions,
		valueOptions,
		mergedValues,
		mode
	]), mergedFieldNames, mergedSearchValue, mergedFilterOption, optionFilterProp);
	var filledSearchOptions = import_react.useMemo(function() {
		if (mode !== "tags" || !mergedSearchValue || filteredOptions.some(function(item) {
			return item[optionFilterProp || "value"] === mergedSearchValue;
		})) return filteredOptions;
		if (filteredOptions.some(function(item) {
			return item[mergedFieldNames.value] === mergedSearchValue;
		})) return filteredOptions;
		return [createTagOption(mergedSearchValue)].concat(_toConsumableArray(filteredOptions));
	}, [
		createTagOption,
		optionFilterProp,
		mode,
		filteredOptions,
		mergedSearchValue,
		mergedFieldNames
	]);
	var sorter = function sorter(inputOptions) {
		return _toConsumableArray(inputOptions).sort(function(a, b) {
			return filterSort(a, b, { searchValue: mergedSearchValue });
		}).map(function(item) {
			if (Array.isArray(item.options)) return _objectSpread2(_objectSpread2({}, item), {}, { options: item.options.length > 0 ? sorter(item.options) : item.options });
			return item;
		});
	};
	var orderedFilteredOptions = import_react.useMemo(function() {
		if (!filterSort) return filledSearchOptions;
		return sorter(filledSearchOptions);
	}, [
		filledSearchOptions,
		filterSort,
		mergedSearchValue
	]);
	var displayOptions = import_react.useMemo(function() {
		return flattenOptions(orderedFilteredOptions, {
			fieldNames: mergedFieldNames,
			childrenAsData
		});
	}, [
		orderedFilteredOptions,
		mergedFieldNames,
		childrenAsData
	]);
	var triggerChange = function triggerChange(values) {
		var labeledValues = convert2LabelValues(values);
		setInternalValue(labeledValues);
		if (onChange && (labeledValues.length !== mergedValues.length || labeledValues.some(function(newVal, index) {
			var _mergedValues$index;
			return ((_mergedValues$index = mergedValues[index]) === null || _mergedValues$index === void 0 ? void 0 : _mergedValues$index.value) !== (newVal === null || newVal === void 0 ? void 0 : newVal.value);
		}))) {
			var returnValues = labelInValue ? labeledValues : labeledValues.map(function(v) {
				return v.value;
			});
			var returnOptions = labeledValues.map(function(v) {
				return injectPropsWithOption(getMixedOption(v.value));
			});
			onChange(multiple ? returnValues : returnValues[0], multiple ? returnOptions : returnOptions[0]);
		}
	};
	var _React$useState2 = _slicedToArray(import_react.useState(null), 2), activeValue = _React$useState2[0], setActiveValue = _React$useState2[1];
	var _React$useState4 = _slicedToArray(import_react.useState(0), 2), accessibilityIndex = _React$useState4[0], setAccessibilityIndex = _React$useState4[1];
	var mergedDefaultActiveFirstOption = defaultActiveFirstOption !== void 0 ? defaultActiveFirstOption : mode !== "combobox";
	var onActiveValue = import_react.useCallback(function(active, index) {
		var _ref3$source = (arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}).source, source = _ref3$source === void 0 ? "keyboard" : _ref3$source;
		setAccessibilityIndex(index);
		if (backfill && mode === "combobox" && active !== null && source === "keyboard") setActiveValue(String(active));
	}, [backfill, mode]);
	var triggerSelect = function triggerSelect(val, selected, type) {
		var getSelectEnt = function getSelectEnt() {
			var _option$key2;
			var option = getMixedOption(val);
			return [labelInValue ? {
				label: option === null || option === void 0 ? void 0 : option[mergedFieldNames.label],
				value: val,
				key: (_option$key2 = option === null || option === void 0 ? void 0 : option.key) !== null && _option$key2 !== void 0 ? _option$key2 : val
			} : val, injectPropsWithOption(option)];
		};
		if (selected && onSelect) {
			var _getSelectEnt2 = _slicedToArray(getSelectEnt(), 2), wrappedValue = _getSelectEnt2[0], _option = _getSelectEnt2[1];
			onSelect(wrappedValue, _option);
		} else if (!selected && onDeselect && type !== "clear") {
			var _getSelectEnt4 = _slicedToArray(getSelectEnt(), 2), _wrappedValue = _getSelectEnt4[0], _option2 = _getSelectEnt4[1];
			onDeselect(_wrappedValue, _option2);
		}
	};
	var onInternalSelect = useRefFunc(function(val, info) {
		var cloneValues;
		var mergedSelect = multiple ? info.selected : true;
		if (mergedSelect) cloneValues = multiple ? [].concat(_toConsumableArray(mergedValues), [val]) : [val];
		else cloneValues = mergedValues.filter(function(v) {
			return v.value !== val;
		});
		triggerChange(cloneValues);
		triggerSelect(val, mergedSelect);
		if (mode === "combobox") setActiveValue("");
		else if (!isMultiple || autoClearSearchValue) {
			setSearchValue("");
			setActiveValue("");
		}
	});
	var onDisplayValuesChange = function onDisplayValuesChange(nextValues, info) {
		triggerChange(nextValues);
		var type = info.type, values = info.values;
		if (type === "remove" || type === "clear") values.forEach(function(item) {
			triggerSelect(item.value, false, type);
		});
	};
	var onInternalSearch = function onInternalSearch(searchText, info) {
		setSearchValue(searchText);
		setActiveValue(null);
		if (info.source === "submit") {
			var formatted = (searchText || "").trim();
			if (formatted) {
				triggerChange(Array.from(new Set([].concat(_toConsumableArray(rawValues), [formatted]))));
				triggerSelect(formatted, true);
				setSearchValue("");
			}
			return;
		}
		if (info.source !== "blur") {
			if (mode === "combobox") triggerChange(searchText);
			onSearch === null || onSearch === void 0 || onSearch(searchText);
		}
	};
	var onInternalSearchSplit = function onInternalSearchSplit(words) {
		var patchValues = words;
		if (mode !== "tags") patchValues = words.map(function(word) {
			var opt = labelOptions.get(word);
			return opt === null || opt === void 0 ? void 0 : opt.value;
		}).filter(function(val) {
			return val !== void 0;
		});
		var newRawValues = Array.from(new Set([].concat(_toConsumableArray(rawValues), _toConsumableArray(patchValues))));
		triggerChange(newRawValues);
		newRawValues.forEach(function(newRawValue) {
			triggerSelect(newRawValue, true);
		});
	};
	var selectContext = import_react.useMemo(function() {
		var realVirtual = virtual !== false && dropdownMatchSelectWidth !== false;
		return _objectSpread2(_objectSpread2({}, parsedOptions), {}, {
			flattenOptions: displayOptions,
			onActiveValue,
			defaultActiveFirstOption: mergedDefaultActiveFirstOption,
			onSelect: onInternalSelect,
			menuItemSelectedIcon,
			rawValues,
			fieldNames: mergedFieldNames,
			virtual: realVirtual,
			direction,
			listHeight,
			listItemHeight,
			childrenAsData,
			maxCount,
			optionRender
		});
	}, [
		maxCount,
		parsedOptions,
		displayOptions,
		onActiveValue,
		mergedDefaultActiveFirstOption,
		onInternalSelect,
		menuItemSelectedIcon,
		rawValues,
		mergedFieldNames,
		virtual,
		dropdownMatchSelectWidth,
		direction,
		listHeight,
		listItemHeight,
		childrenAsData,
		optionRender
	]);
	warningProps(props);
	warningNullOptions(mergedOptions, mergedFieldNames);
	return /*#__PURE__*/ import_react.createElement(SelectContext.Provider, { value: selectContext }, /*#__PURE__*/ import_react.createElement(BaseSelect, _extends({}, restProps, {
		id: mergedId,
		prefixCls,
		ref,
		omitDomProps: OMIT_DOM_PROPS,
		mode,
		displayValues,
		onDisplayValuesChange,
		direction,
		searchValue: mergedSearchValue,
		onSearch: onInternalSearch,
		autoClearSearchValue,
		onSearchSplit: onInternalSearchSplit,
		dropdownMatchSelectWidth,
		OptionList: RefOptionList,
		emptyOptions: !displayOptions.length,
		activeValue,
		activeDescendantId: "".concat(mergedId, "_list_").concat(accessibilityIndex)
	})));
});
Select$1.displayName = "Select";
var TypedSelect = Select$1;
TypedSelect.Option = Option$1;
TypedSelect.OptGroup = OptGroup;
//#endregion
//#region node_modules/rc-select/es/index.js
var es_default = TypedSelect;
//#endregion
//#region node_modules/antd/es/_util/statusUtils.js
function getStatusClassNames(prefixCls, status, hasFeedback) {
	return (0, import_classnames.default)({
		[`${prefixCls}-status-success`]: status === "success",
		[`${prefixCls}-status-warning`]: status === "warning",
		[`${prefixCls}-status-error`]: status === "error",
		[`${prefixCls}-status-validating`]: status === "validating",
		[`${prefixCls}-has-feedback`]: hasFeedback
	});
}
var getMergedStatus = (contextStatus, customStatus) => customStatus || contextStatus;
//#endregion
//#region node_modules/antd/es/empty/empty.js
var Empty$1 = () => {
	const [, token] = useToken();
	const [locale] = useLocale("Empty");
	const themeStyle = new FastColor(token.colorBgBase).toHsl().l < .5 ? { opacity: .65 } : {};
	return /*#__PURE__*/ import_react.createElement("svg", {
		style: themeStyle,
		width: "184",
		height: "152",
		viewBox: "0 0 184 152",
		xmlns: "http://www.w3.org/2000/svg"
	}, /*#__PURE__*/ import_react.createElement("title", null, (locale === null || locale === void 0 ? void 0 : locale.description) || "Empty"), /*#__PURE__*/ import_react.createElement("g", {
		fill: "none",
		fillRule: "evenodd"
	}, /*#__PURE__*/ import_react.createElement("g", { transform: "translate(24 31.67)" }, /*#__PURE__*/ import_react.createElement("ellipse", {
		fillOpacity: ".8",
		fill: "#F5F5F7",
		cx: "67.797",
		cy: "106.89",
		rx: "67.797",
		ry: "12.668"
	}), /*#__PURE__*/ import_react.createElement("path", {
		d: "M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674v15.383h108.475V69.674z",
		fill: "#AEB8C2"
	}), /*#__PURE__*/ import_react.createElement("path", {
		d: "M101.537 86.214L80.63 61.102c-1.001-1.207-2.507-1.867-4.048-1.867H31.724c-1.54 0-3.047.66-4.048 1.867L6.769 86.214v13.792h94.768V86.214z",
		fill: "url(#linearGradient-1)",
		transform: "translate(13.56)"
	}), /*#__PURE__*/ import_react.createElement("path", {
		d: "M33.83 0h67.933a4 4 0 0 1 4 4v93.344a4 4 0 0 1-4 4H33.83a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z",
		fill: "#F5F5F7"
	}), /*#__PURE__*/ import_react.createElement("path", {
		d: "M42.678 9.953h50.237a2 2 0 0 1 2 2V36.91a2 2 0 0 1-2 2H42.678a2 2 0 0 1-2-2V11.953a2 2 0 0 1 2-2zM42.94 49.767h49.713a2.262 2.262 0 1 1 0 4.524H42.94a2.262 2.262 0 0 1 0-4.524zM42.94 61.53h49.713a2.262 2.262 0 1 1 0 4.525H42.94a2.262 2.262 0 0 1 0-4.525zM121.813 105.032c-.775 3.071-3.497 5.36-6.735 5.36H20.515c-3.238 0-5.96-2.29-6.734-5.36a7.309 7.309 0 0 1-.222-1.79V69.675h26.318c2.907 0 5.25 2.448 5.25 5.42v.04c0 2.971 2.37 5.37 5.277 5.37h34.785c2.907 0 5.277-2.421 5.277-5.393V75.1c0-2.972 2.343-5.426 5.25-5.426h26.318v33.569c0 .617-.077 1.216-.221 1.789z",
		fill: "#DCE0E6"
	})), /*#__PURE__*/ import_react.createElement("path", {
		d: "M149.121 33.292l-6.83 2.65a1 1 0 0 1-1.317-1.23l1.937-6.207c-2.589-2.944-4.109-6.534-4.109-10.408C138.802 8.102 148.92 0 161.402 0 173.881 0 184 8.102 184 18.097c0 9.995-10.118 18.097-22.599 18.097-4.528 0-8.744-1.066-12.28-2.902z",
		fill: "#DCE0E6"
	}), /*#__PURE__*/ import_react.createElement("g", {
		transform: "translate(149.65 15.383)",
		fill: "#FFF"
	}, /*#__PURE__*/ import_react.createElement("ellipse", {
		cx: "20.654",
		cy: "3.167",
		rx: "2.849",
		ry: "2.815"
	}), /*#__PURE__*/ import_react.createElement("path", { d: "M5.698 5.63H0L2.898.704zM9.259.704h4.985V5.63H9.259z" }))));
};
Empty$1.displayName = "EmptyImage";
//#endregion
//#region node_modules/antd/es/empty/simple.js
var Simple = () => {
	const [, token] = useToken();
	const [locale] = useLocale("Empty");
	const { colorFill, colorFillTertiary, colorFillQuaternary, colorBgContainer } = token;
	const { borderColor, shadowColor, contentColor } = (0, import_react.useMemo)(() => ({
		borderColor: new FastColor(colorFill).onBackground(colorBgContainer).toHexString(),
		shadowColor: new FastColor(colorFillTertiary).onBackground(colorBgContainer).toHexString(),
		contentColor: new FastColor(colorFillQuaternary).onBackground(colorBgContainer).toHexString()
	}), [
		colorFill,
		colorFillTertiary,
		colorFillQuaternary,
		colorBgContainer
	]);
	return /*#__PURE__*/ import_react.createElement("svg", {
		width: "64",
		height: "41",
		viewBox: "0 0 64 41",
		xmlns: "http://www.w3.org/2000/svg"
	}, /*#__PURE__*/ import_react.createElement("title", null, (locale === null || locale === void 0 ? void 0 : locale.description) || "Empty"), /*#__PURE__*/ import_react.createElement("g", {
		transform: "translate(0 1)",
		fill: "none",
		fillRule: "evenodd"
	}, /*#__PURE__*/ import_react.createElement("ellipse", {
		fill: shadowColor,
		cx: "32",
		cy: "33",
		rx: "32",
		ry: "7"
	}), /*#__PURE__*/ import_react.createElement("g", {
		fillRule: "nonzero",
		stroke: borderColor
	}, /*#__PURE__*/ import_react.createElement("path", { d: "M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z" }), /*#__PURE__*/ import_react.createElement("path", {
		d: "M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z",
		fill: contentColor
	}))));
};
Simple.displayName = "SimpleImage";
//#endregion
//#region node_modules/antd/es/empty/style/index.js
var genSharedEmptyStyle = (token) => {
	const { componentCls, margin, marginXS, marginXL, fontSize, lineHeight } = token;
	return { [componentCls]: {
		marginInline: marginXS,
		fontSize,
		lineHeight,
		textAlign: "center",
		[`${componentCls}-image`]: {
			height: token.emptyImgHeight,
			marginBottom: marginXS,
			opacity: token.opacityImage,
			img: { height: "100%" },
			svg: {
				maxWidth: "100%",
				height: "100%",
				margin: "auto"
			}
		},
		[`${componentCls}-description`]: { color: token.colorTextDescription },
		[`${componentCls}-footer`]: { marginTop: margin },
		"&-normal": {
			marginBlock: marginXL,
			color: token.colorTextDescription,
			[`${componentCls}-description`]: { color: token.colorTextDescription },
			[`${componentCls}-image`]: { height: token.emptyImgHeightMD }
		},
		"&-small": {
			marginBlock: marginXS,
			color: token.colorTextDescription,
			[`${componentCls}-image`]: { height: token.emptyImgHeightSM }
		}
	} };
};
var style_default$1 = genStyleHooks("Empty", (token) => {
	const { componentCls, controlHeightLG, calc } = token;
	return genSharedEmptyStyle(merge(token, {
		emptyImgCls: `${componentCls}-img`,
		emptyImgHeight: calc(controlHeightLG).mul(2.5).equal(),
		emptyImgHeightMD: controlHeightLG,
		emptyImgHeightSM: calc(controlHeightLG).mul(.875).equal()
	}));
});
//#endregion
//#region node_modules/antd/es/empty/index.js
var __rest$1 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var defaultEmptyImg = /*#__PURE__*/ import_react.createElement(Empty$1, null);
var simpleEmptyImg = /*#__PURE__*/ import_react.createElement(Simple, null);
var Empty = (props) => {
	var _a;
	const { className, rootClassName, prefixCls: customizePrefixCls, image, description, children, imageStyle, style, classNames: emptyClassNames, styles } = props, restProps = __rest$1(props, [
		"className",
		"rootClassName",
		"prefixCls",
		"image",
		"description",
		"children",
		"imageStyle",
		"style",
		"classNames",
		"styles"
	]);
	const { getPrefixCls, direction, className: contextClassName, style: contextStyle, classNames: contextClassNames, styles: contextStyles, image: contextImage } = useComponentConfig("empty");
	const prefixCls = getPrefixCls("empty", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default$1(prefixCls);
	const [locale] = useLocale("Empty");
	const des = typeof description !== "undefined" ? description : locale === null || locale === void 0 ? void 0 : locale.description;
	const alt = typeof des === "string" ? des : "empty";
	const mergedImage = (_a = image !== null && image !== void 0 ? image : contextImage) !== null && _a !== void 0 ? _a : defaultEmptyImg;
	let imageNode = null;
	if (typeof mergedImage === "string") imageNode = /*#__PURE__*/ import_react.createElement("img", {
		draggable: false,
		alt,
		src: mergedImage
	});
	else imageNode = mergedImage;
	{
		const warning = devUseWarning("Empty");
		[["imageStyle", "styles: { image: {} }"]].forEach(([deprecatedName, newName]) => {
			warning.deprecated(!(deprecatedName in props), deprecatedName, newName);
		});
	}
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement("div", Object.assign({
		className: (0, import_classnames.default)(hashId, cssVarCls, prefixCls, contextClassName, {
			[`${prefixCls}-normal`]: mergedImage === simpleEmptyImg,
			[`${prefixCls}-rtl`]: direction === "rtl"
		}, className, rootClassName, contextClassNames.root, emptyClassNames === null || emptyClassNames === void 0 ? void 0 : emptyClassNames.root),
		style: Object.assign(Object.assign(Object.assign(Object.assign({}, contextStyles.root), contextStyle), styles === null || styles === void 0 ? void 0 : styles.root), style)
	}, restProps), /*#__PURE__*/ import_react.createElement("div", {
		className: (0, import_classnames.default)(`${prefixCls}-image`, contextClassNames.image, emptyClassNames === null || emptyClassNames === void 0 ? void 0 : emptyClassNames.image),
		style: Object.assign(Object.assign(Object.assign({}, imageStyle), contextStyles.image), styles === null || styles === void 0 ? void 0 : styles.image)
	}, imageNode), des && /*#__PURE__*/ import_react.createElement("div", {
		className: (0, import_classnames.default)(`${prefixCls}-description`, contextClassNames.description, emptyClassNames === null || emptyClassNames === void 0 ? void 0 : emptyClassNames.description),
		style: Object.assign(Object.assign({}, contextStyles.description), styles === null || styles === void 0 ? void 0 : styles.description)
	}, des), children && /*#__PURE__*/ import_react.createElement("div", {
		className: (0, import_classnames.default)(`${prefixCls}-footer`, contextClassNames.footer, emptyClassNames === null || emptyClassNames === void 0 ? void 0 : emptyClassNames.footer),
		style: Object.assign(Object.assign({}, contextStyles.footer), styles === null || styles === void 0 ? void 0 : styles.footer)
	}, children)));
};
Empty.PRESENTED_IMAGE_DEFAULT = defaultEmptyImg;
Empty.PRESENTED_IMAGE_SIMPLE = simpleEmptyImg;
Empty.displayName = "Empty";
//#endregion
//#region node_modules/antd/es/config-provider/defaultRenderEmpty.js
var DefaultRenderEmpty = (props) => {
	const { componentName } = props;
	const { getPrefixCls } = (0, import_react.useContext)(ConfigContext);
	const prefix = getPrefixCls("empty");
	switch (componentName) {
		case "Table":
		case "List": return /*#__PURE__*/ import_react.createElement(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE });
		case "Select":
		case "TreeSelect":
		case "Cascader":
		case "Transfer":
		case "Mentions": return /*#__PURE__*/ import_react.createElement(Empty, {
			image: Empty.PRESENTED_IMAGE_SIMPLE,
			className: `${prefix}-small`
		});
		/**
		* This type of component should satisfy the nullish coalescing operator(??) on the left-hand side.
		* to let the component itself implement the logic.
		* For example `Table.filter`.
		*/
		case "Table.filter": return null;
		default: return /*#__PURE__*/ import_react.createElement(Empty, null);
	}
};
//#endregion
//#region node_modules/antd/es/form/hooks/useVariants.js
/**
* Compatible for legacy `bordered` prop.
*/
var useVariant = (component, variant, legacyBordered = void 0) => {
	var _a, _b;
	const { variant: configVariant, [component]: componentConfig } = import_react.useContext(ConfigContext);
	const ctxVariant = import_react.useContext(VariantContext);
	const configComponentVariant = componentConfig === null || componentConfig === void 0 ? void 0 : componentConfig.variant;
	let mergedVariant;
	if (typeof variant !== "undefined") mergedVariant = variant;
	else if (legacyBordered === false) mergedVariant = "borderless";
	else mergedVariant = (_b = (_a = ctxVariant !== null && ctxVariant !== void 0 ? ctxVariant : configComponentVariant) !== null && _a !== void 0 ? _a : configVariant) !== null && _b !== void 0 ? _b : "outlined";
	const enableVariantCls = Variants.includes(mergedVariant);
	return [mergedVariant, enableVariantCls];
};
//#endregion
//#region node_modules/antd/es/select/mergedBuiltinPlacements.js
var getBuiltInPlacements = (popupOverflow) => {
	const sharedConfig = {
		overflow: {
			adjustX: true,
			adjustY: true,
			shiftY: true
		},
		htmlRegion: popupOverflow === "scroll" ? "scroll" : "visible",
		dynamicInset: true
	};
	return {
		bottomLeft: Object.assign(Object.assign({}, sharedConfig), {
			points: ["tl", "bl"],
			offset: [0, 4]
		}),
		bottomRight: Object.assign(Object.assign({}, sharedConfig), {
			points: ["tr", "br"],
			offset: [0, 4]
		}),
		topLeft: Object.assign(Object.assign({}, sharedConfig), {
			points: ["bl", "tl"],
			offset: [0, -4]
		}),
		topRight: Object.assign(Object.assign({}, sharedConfig), {
			points: ["br", "tr"],
			offset: [0, -4]
		})
	};
};
function mergedBuiltinPlacements(buildInPlacements, popupOverflow) {
	return buildInPlacements || getBuiltInPlacements(popupOverflow);
}
//#endregion
//#region node_modules/antd/es/select/style/dropdown.js
var genItemStyle = (token) => {
	const { optionHeight, optionFontSize, optionLineHeight, optionPadding } = token;
	return {
		position: "relative",
		display: "block",
		minHeight: optionHeight,
		padding: optionPadding,
		color: token.colorText,
		fontWeight: "normal",
		fontSize: optionFontSize,
		lineHeight: optionLineHeight,
		boxSizing: "border-box"
	};
};
var genSingleStyle$1 = (token) => {
	const { antCls, componentCls } = token;
	const selectItemCls = `${componentCls}-item`;
	const slideUpEnterActive = `&${antCls}-slide-up-enter${antCls}-slide-up-enter-active`;
	const slideUpAppearActive = `&${antCls}-slide-up-appear${antCls}-slide-up-appear-active`;
	const slideUpLeaveActive = `&${antCls}-slide-up-leave${antCls}-slide-up-leave-active`;
	const dropdownPlacementCls = `${componentCls}-dropdown-placement-`;
	const selectedItemCls = `${selectItemCls}-option-selected`;
	return [
		{ [`${componentCls}-dropdown`]: Object.assign(Object.assign({}, resetComponent(token)), {
			position: "absolute",
			top: -9999,
			zIndex: token.zIndexPopup,
			boxSizing: "border-box",
			padding: token.paddingXXS,
			overflow: "hidden",
			fontSize: token.fontSize,
			fontVariant: "initial",
			backgroundColor: token.colorBgElevated,
			borderRadius: token.borderRadiusLG,
			outline: "none",
			boxShadow: token.boxShadowSecondary,
			[`
          ${slideUpEnterActive}${dropdownPlacementCls}bottomLeft,
          ${slideUpAppearActive}${dropdownPlacementCls}bottomLeft
        `]: { animationName: slideUpIn },
			[`
          ${slideUpEnterActive}${dropdownPlacementCls}topLeft,
          ${slideUpAppearActive}${dropdownPlacementCls}topLeft,
          ${slideUpEnterActive}${dropdownPlacementCls}topRight,
          ${slideUpAppearActive}${dropdownPlacementCls}topRight
        `]: { animationName: slideDownIn },
			[`${slideUpLeaveActive}${dropdownPlacementCls}bottomLeft`]: { animationName: slideUpOut },
			[`
          ${slideUpLeaveActive}${dropdownPlacementCls}topLeft,
          ${slideUpLeaveActive}${dropdownPlacementCls}topRight
        `]: { animationName: slideDownOut },
			"&-hidden": { display: "none" },
			[selectItemCls]: Object.assign(Object.assign({}, genItemStyle(token)), {
				cursor: "pointer",
				transition: `background ${token.motionDurationSlow} ease`,
				borderRadius: token.borderRadiusSM,
				"&-group": {
					color: token.colorTextDescription,
					fontSize: token.fontSizeSM,
					cursor: "default"
				},
				"&-option": {
					display: "flex",
					"&-content": Object.assign({ flex: "auto" }, textEllipsis),
					"&-state": {
						flex: "none",
						display: "flex",
						alignItems: "center"
					},
					[`&-active:not(${selectItemCls}-option-disabled)`]: { backgroundColor: token.optionActiveBg },
					[`&-selected:not(${selectItemCls}-option-disabled)`]: {
						color: token.optionSelectedColor,
						fontWeight: token.optionSelectedFontWeight,
						backgroundColor: token.optionSelectedBg,
						[`${selectItemCls}-option-state`]: { color: token.colorPrimary }
					},
					"&-disabled": {
						[`&${selectItemCls}-option-selected`]: { backgroundColor: token.colorBgContainerDisabled },
						color: token.colorTextDisabled,
						cursor: "not-allowed"
					},
					"&-grouped": { paddingInlineStart: token.calc(token.controlPaddingHorizontal).mul(2).equal() }
				},
				"&-empty": Object.assign(Object.assign({}, genItemStyle(token)), { color: token.colorTextDisabled })
			}),
			[`${selectedItemCls}:has(+ ${selectedItemCls})`]: {
				borderEndStartRadius: 0,
				borderEndEndRadius: 0,
				[`& + ${selectedItemCls}`]: {
					borderStartStartRadius: 0,
					borderStartEndRadius: 0
				}
			},
			"&-rtl": { direction: "rtl" }
		}) },
		initSlideMotion(token, "slide-up"),
		initSlideMotion(token, "slide-down"),
		initMoveMotion(token, "move-up"),
		initMoveMotion(token, "move-down")
	];
};
//#endregion
//#region node_modules/antd/es/select/style/multiple.js
/**
* Get multiple selector needed style. The calculation:
*
* ContainerPadding = BasePadding - ItemMargin
*
* Border:                    ╔═══════════════════════════╗                 ┬
* ContainerPadding:          ║                           ║                 │
*                            ╟───────────────────────────╢     ┬           │
* Item Margin:               ║                           ║     │           │
*                            ║             ┌──────────┐  ║     │           │
* Item(multipleItemHeight):  ║ BasePadding │   Item   │  ║  Overflow  Container(ControlHeight)
*                            ║             └──────────┘  ║     │           │
* Item Margin:               ║                           ║     │           │
*                            ╟───────────────────────────╢     ┴           │
* ContainerPadding:          ║                           ║                 │
* Border:                    ╚═══════════════════════════╝                 ┴
*/
var getMultipleSelectorUnit = (token) => {
	const { multipleSelectItemHeight, paddingXXS, lineWidth, INTERNAL_FIXED_ITEM_MARGIN } = token;
	const basePadding = token.max(token.calc(paddingXXS).sub(lineWidth).equal(), 0);
	return {
		basePadding,
		containerPadding: token.max(token.calc(basePadding).sub(INTERNAL_FIXED_ITEM_MARGIN).equal(), 0),
		itemHeight: unit(multipleSelectItemHeight),
		itemLineHeight: unit(token.calc(multipleSelectItemHeight).sub(token.calc(token.lineWidth).mul(2)).equal())
	};
};
var getSelectItemStyle = (token) => {
	const { multipleSelectItemHeight, selectHeight, lineWidth } = token;
	return token.calc(selectHeight).sub(multipleSelectItemHeight).div(2).sub(lineWidth).equal();
};
/**
* Get the `rc-overflow` needed style.
* It's a share style which means not affected by `size`.
*/
var genOverflowStyle = (token) => {
	const { componentCls, iconCls, borderRadiusSM, motionDurationSlow, paddingXS, multipleItemColorDisabled, multipleItemBorderColorDisabled, colorIcon, colorIconHover, INTERNAL_FIXED_ITEM_MARGIN } = token;
	return { 
	/**
	* Do not merge `height` & `line-height` under style with `selection` & `search`, since chrome
	* may update to redesign with its align logic.
	*/
[`${componentCls}-selection-overflow`]: {
		position: "relative",
		display: "flex",
		flex: "auto",
		flexWrap: "wrap",
		maxWidth: "100%",
		"&-item": {
			flex: "none",
			alignSelf: "center",
			maxWidth: "calc(100% - 4px)",
			display: "inline-flex"
		},
		[`${componentCls}-selection-item`]: {
			display: "flex",
			alignSelf: "center",
			flex: "none",
			boxSizing: "border-box",
			maxWidth: "100%",
			marginBlock: INTERNAL_FIXED_ITEM_MARGIN,
			borderRadius: borderRadiusSM,
			cursor: "default",
			transition: `font-size ${motionDurationSlow}, line-height ${motionDurationSlow}, height ${motionDurationSlow}`,
			marginInlineEnd: token.calc(INTERNAL_FIXED_ITEM_MARGIN).mul(2).equal(),
			paddingInlineStart: paddingXS,
			paddingInlineEnd: token.calc(paddingXS).div(2).equal(),
			[`${componentCls}-disabled&`]: {
				color: multipleItemColorDisabled,
				borderColor: multipleItemBorderColorDisabled,
				cursor: "not-allowed"
			},
			"&-content": {
				display: "inline-block",
				marginInlineEnd: token.calc(paddingXS).div(2).equal(),
				overflow: "hidden",
				whiteSpace: "pre",
				textOverflow: "ellipsis"
			},
			"&-remove": Object.assign(Object.assign({}, resetIcon()), {
				display: "inline-flex",
				alignItems: "center",
				color: colorIcon,
				fontWeight: "bold",
				fontSize: 10,
				lineHeight: "inherit",
				cursor: "pointer",
				[`> ${iconCls}`]: { verticalAlign: "-0.2em" },
				"&:hover": { color: colorIconHover }
			})
		}
	} };
};
var genSelectionStyle = (token, suffix) => {
	const { componentCls, INTERNAL_FIXED_ITEM_MARGIN } = token;
	const selectOverflowPrefixCls = `${componentCls}-selection-overflow`;
	const selectItemHeight = token.multipleSelectItemHeight;
	const selectItemDist = getSelectItemStyle(token);
	const suffixCls = suffix ? `${componentCls}-${suffix}` : "";
	const multipleSelectorUnit = getMultipleSelectorUnit(token);
	return { [`${componentCls}-multiple${suffixCls}`]: Object.assign(Object.assign({}, genOverflowStyle(token)), {
		[`${componentCls}-selector`]: {
			display: "flex",
			alignItems: "center",
			width: "100%",
			height: "100%",
			paddingInline: multipleSelectorUnit.basePadding,
			paddingBlock: multipleSelectorUnit.containerPadding,
			borderRadius: token.borderRadius,
			[`${componentCls}-disabled&`]: {
				background: token.multipleSelectorBgDisabled,
				cursor: "not-allowed"
			},
			"&:after": {
				display: "inline-block",
				width: 0,
				margin: `${unit(INTERNAL_FIXED_ITEM_MARGIN)} 0`,
				lineHeight: unit(selectItemHeight),
				visibility: "hidden",
				content: "\"\\a0\""
			}
		},
		[`${componentCls}-selection-item`]: {
			height: multipleSelectorUnit.itemHeight,
			lineHeight: unit(multipleSelectorUnit.itemLineHeight)
		},
		[`${componentCls}-selection-wrap`]: {
			alignSelf: "flex-start",
			"&:after": {
				lineHeight: unit(selectItemHeight),
				marginBlock: INTERNAL_FIXED_ITEM_MARGIN
			}
		},
		[`${componentCls}-prefix`]: { marginInlineStart: token.calc(token.inputPaddingHorizontalBase).sub(multipleSelectorUnit.basePadding).equal() },
		[`${selectOverflowPrefixCls}-item + ${selectOverflowPrefixCls}-item,
        ${componentCls}-prefix + ${componentCls}-selection-wrap
      `]: {
			[`${componentCls}-selection-search`]: { marginInlineStart: 0 },
			[`${componentCls}-selection-placeholder`]: { insetInlineStart: 0 }
		},
		[`${selectOverflowPrefixCls}-item-suffix`]: {
			minHeight: multipleSelectorUnit.itemHeight,
			marginBlock: INTERNAL_FIXED_ITEM_MARGIN
		},
		[`${componentCls}-selection-search`]: {
			display: "inline-flex",
			position: "relative",
			maxWidth: "100%",
			marginInlineStart: token.calc(token.inputPaddingHorizontalBase).sub(selectItemDist).equal(),
			[`
          &-input,
          &-mirror
        `]: {
				height: selectItemHeight,
				fontFamily: token.fontFamily,
				lineHeight: unit(selectItemHeight),
				transition: `all ${token.motionDurationSlow}`
			},
			"&-input": {
				width: "100%",
				minWidth: 4.1
			},
			"&-mirror": {
				position: "absolute",
				top: 0,
				insetInlineStart: 0,
				insetInlineEnd: "auto",
				zIndex: 999,
				whiteSpace: "pre",
				visibility: "hidden"
			}
		},
		[`${componentCls}-selection-placeholder`]: {
			position: "absolute",
			top: "50%",
			insetInlineStart: token.calc(token.inputPaddingHorizontalBase).sub(multipleSelectorUnit.basePadding).equal(),
			insetInlineEnd: token.inputPaddingHorizontalBase,
			transform: "translateY(-50%)",
			transition: `all ${token.motionDurationSlow}`
		}
	}) };
};
function genSizeStyle$1(token, suffix) {
	const { componentCls } = token;
	const rawStyle = { [`${componentCls}-multiple${suffix ? `${componentCls}-${suffix}` : ""}`]: {
		fontSize: token.fontSize,
		[`${componentCls}-selector`]: { [`${componentCls}-show-search&`]: { cursor: "text" } },
		[`
        &${componentCls}-show-arrow ${componentCls}-selector,
        &${componentCls}-allow-clear ${componentCls}-selector
      `]: { paddingInlineEnd: token.calc(token.fontSizeIcon).add(token.controlPaddingHorizontal).equal() }
	} };
	return [genSelectionStyle(token, suffix), rawStyle];
}
var genMultipleStyle = (token) => {
	const { componentCls } = token;
	const smallToken = merge(token, {
		selectHeight: token.controlHeightSM,
		multipleSelectItemHeight: token.multipleItemHeightSM,
		borderRadius: token.borderRadiusSM,
		borderRadiusSM: token.borderRadiusXS
	});
	const largeToken = merge(token, {
		fontSize: token.fontSizeLG,
		selectHeight: token.controlHeightLG,
		multipleSelectItemHeight: token.multipleItemHeightLG,
		borderRadius: token.borderRadiusLG,
		borderRadiusSM: token.borderRadius
	});
	return [
		genSizeStyle$1(token),
		genSizeStyle$1(smallToken, "sm"),
		{ [`${componentCls}-multiple${componentCls}-sm`]: {
			[`${componentCls}-selection-placeholder`]: { insetInline: token.calc(token.controlPaddingHorizontalSM).sub(token.lineWidth).equal() },
			[`${componentCls}-selection-search`]: { marginInlineStart: 2 }
		} },
		genSizeStyle$1(largeToken, "lg")
	];
};
//#endregion
//#region node_modules/antd/es/select/style/single.js
function genSizeStyle(token, suffix) {
	const { componentCls, inputPaddingHorizontalBase, borderRadius } = token;
	const selectHeightWithoutBorder = token.calc(token.controlHeight).sub(token.calc(token.lineWidth).mul(2)).equal();
	return { [`${componentCls}-single${suffix ? `${componentCls}-${suffix}` : ""}`]: {
		fontSize: token.fontSize,
		height: token.controlHeight,
		[`${componentCls}-selector`]: Object.assign(Object.assign({}, resetComponent(token, true)), {
			display: "flex",
			borderRadius,
			flex: "1 1 auto",
			[`${componentCls}-selection-wrap:after`]: { lineHeight: unit(selectHeightWithoutBorder) },
			[`${componentCls}-selection-search`]: {
				position: "absolute",
				inset: 0,
				width: "100%",
				"&-input": {
					width: "100%",
					WebkitAppearance: "textfield"
				}
			},
			[`
          ${componentCls}-selection-item,
          ${componentCls}-selection-placeholder
        `]: {
				display: "block",
				padding: 0,
				lineHeight: unit(selectHeightWithoutBorder),
				transition: `all ${token.motionDurationSlow}, visibility 0s`,
				alignSelf: "center"
			},
			[`${componentCls}-selection-placeholder`]: {
				transition: "none",
				pointerEvents: "none"
			},
			[[
				"&:after",
				`${componentCls}-selection-item:empty:after`,
				`${componentCls}-selection-placeholder:empty:after`
			].join(",")]: {
				display: "inline-block",
				width: 0,
				visibility: "hidden",
				content: "\"\\a0\""
			}
		}),
		[`
        &${componentCls}-show-arrow ${componentCls}-selection-item,
        &${componentCls}-show-arrow ${componentCls}-selection-search,
        &${componentCls}-show-arrow ${componentCls}-selection-placeholder
      `]: { paddingInlineEnd: token.showArrowPaddingInlineEnd },
		[`&${componentCls}-open ${componentCls}-selection-item`]: { color: token.colorTextPlaceholder },
		[`&:not(${componentCls}-customize-input)`]: { [`${componentCls}-selector`]: {
			width: "100%",
			height: "100%",
			alignItems: "center",
			padding: `0 ${unit(inputPaddingHorizontalBase)}`,
			[`${componentCls}-selection-search-input`]: {
				height: selectHeightWithoutBorder,
				fontSize: token.fontSize
			},
			"&:after": { lineHeight: unit(selectHeightWithoutBorder) }
		} },
		[`&${componentCls}-customize-input`]: { [`${componentCls}-selector`]: {
			"&:after": { display: "none" },
			[`${componentCls}-selection-search`]: {
				position: "static",
				width: "100%"
			},
			[`${componentCls}-selection-placeholder`]: {
				position: "absolute",
				insetInlineStart: 0,
				insetInlineEnd: 0,
				padding: `0 ${unit(inputPaddingHorizontalBase)}`,
				"&:after": { display: "none" }
			}
		} }
	} };
}
function genSingleStyle(token) {
	const { componentCls } = token;
	const inputPaddingHorizontalSM = token.calc(token.controlPaddingHorizontalSM).sub(token.lineWidth).equal();
	return [
		genSizeStyle(token),
		genSizeStyle(merge(token, {
			controlHeight: token.controlHeightSM,
			borderRadius: token.borderRadiusSM
		}), "sm"),
		{ [`${componentCls}-single${componentCls}-sm`]: { [`&:not(${componentCls}-customize-input)`]: {
			[`${componentCls}-selector`]: { padding: `0 ${unit(inputPaddingHorizontalSM)}` },
			[`&${componentCls}-show-arrow ${componentCls}-selection-search`]: { insetInlineEnd: token.calc(inputPaddingHorizontalSM).add(token.calc(token.fontSize).mul(1.5)).equal() },
			[`
            &${componentCls}-show-arrow ${componentCls}-selection-item,
            &${componentCls}-show-arrow ${componentCls}-selection-placeholder
          `]: { paddingInlineEnd: token.calc(token.fontSize).mul(1.5).equal() }
		} } },
		genSizeStyle(merge(token, {
			controlHeight: token.singleItemHeightLG,
			fontSize: token.fontSizeLG,
			borderRadius: token.borderRadiusLG
		}), "lg")
	];
}
//#endregion
//#region node_modules/antd/es/select/style/token.js
var prepareComponentToken = (token) => {
	const { fontSize, lineHeight, lineWidth, controlHeight, controlHeightSM, controlHeightLG, paddingXXS, controlPaddingHorizontal, zIndexPopupBase, colorText, fontWeightStrong, controlItemBgActive, controlItemBgHover, colorBgContainer, colorFillSecondary, colorBgContainerDisabled, colorTextDisabled, colorPrimaryHover, colorPrimary, controlOutline } = token;
	const dblPaddingXXS = paddingXXS * 2;
	const dblLineWidth = lineWidth * 2;
	const multipleItemHeight = Math.min(controlHeight - dblPaddingXXS, controlHeight - dblLineWidth);
	const multipleItemHeightSM = Math.min(controlHeightSM - dblPaddingXXS, controlHeightSM - dblLineWidth);
	const multipleItemHeightLG = Math.min(controlHeightLG - dblPaddingXXS, controlHeightLG - dblLineWidth);
	return {
		INTERNAL_FIXED_ITEM_MARGIN: Math.floor(paddingXXS / 2),
		zIndexPopup: zIndexPopupBase + 50,
		optionSelectedColor: colorText,
		optionSelectedFontWeight: fontWeightStrong,
		optionSelectedBg: controlItemBgActive,
		optionActiveBg: controlItemBgHover,
		optionPadding: `${(controlHeight - fontSize * lineHeight) / 2}px ${controlPaddingHorizontal}px`,
		optionFontSize: fontSize,
		optionLineHeight: lineHeight,
		optionHeight: controlHeight,
		selectorBg: colorBgContainer,
		clearBg: colorBgContainer,
		singleItemHeightLG: controlHeightLG,
		multipleItemBg: colorFillSecondary,
		multipleItemBorderColor: "transparent",
		multipleItemHeight,
		multipleItemHeightSM,
		multipleItemHeightLG,
		multipleSelectorBgDisabled: colorBgContainerDisabled,
		multipleItemColorDisabled: colorTextDisabled,
		multipleItemBorderColorDisabled: "transparent",
		showArrowPaddingInlineEnd: Math.ceil(token.fontSize * 1.25),
		hoverBorderColor: colorPrimaryHover,
		activeBorderColor: colorPrimary,
		activeOutlineColor: controlOutline,
		selectAffixPadding: paddingXXS
	};
};
//#endregion
//#region node_modules/antd/es/select/style/variants.js
var genBaseOutlinedStyle = (token, options) => {
	const { componentCls, antCls, controlOutlineWidth } = token;
	return {
		[`&:not(${componentCls}-customize-input) ${componentCls}-selector`]: {
			border: `${unit(token.lineWidth)} ${token.lineType} ${options.borderColor}`,
			background: token.selectorBg
		},
		[`&:not(${componentCls}-disabled):not(${componentCls}-customize-input):not(${antCls}-pagination-size-changer)`]: {
			[`&:hover ${componentCls}-selector`]: { borderColor: options.hoverBorderHover },
			[`${componentCls}-focused& ${componentCls}-selector`]: {
				borderColor: options.activeBorderColor,
				boxShadow: `0 0 0 ${unit(controlOutlineWidth)} ${options.activeOutlineColor}`,
				outline: 0
			},
			[`${componentCls}-prefix`]: { color: options.color }
		}
	};
};
var genOutlinedStatusStyle = (token, options) => ({ [`&${token.componentCls}-status-${options.status}`]: Object.assign({}, genBaseOutlinedStyle(token, options)) });
var genOutlinedStyle = (token) => ({ "&-outlined": Object.assign(Object.assign(Object.assign(Object.assign({}, genBaseOutlinedStyle(token, {
	borderColor: token.colorBorder,
	hoverBorderHover: token.hoverBorderColor,
	activeBorderColor: token.activeBorderColor,
	activeOutlineColor: token.activeOutlineColor,
	color: token.colorText
})), genOutlinedStatusStyle(token, {
	status: "error",
	borderColor: token.colorError,
	hoverBorderHover: token.colorErrorHover,
	activeBorderColor: token.colorError,
	activeOutlineColor: token.colorErrorOutline,
	color: token.colorError
})), genOutlinedStatusStyle(token, {
	status: "warning",
	borderColor: token.colorWarning,
	hoverBorderHover: token.colorWarningHover,
	activeBorderColor: token.colorWarning,
	activeOutlineColor: token.colorWarningOutline,
	color: token.colorWarning
})), {
	[`&${token.componentCls}-disabled`]: { [`&:not(${token.componentCls}-customize-input) ${token.componentCls}-selector`]: {
		background: token.colorBgContainerDisabled,
		color: token.colorTextDisabled
	} },
	[`&${token.componentCls}-multiple ${token.componentCls}-selection-item`]: {
		background: token.multipleItemBg,
		border: `${unit(token.lineWidth)} ${token.lineType} ${token.multipleItemBorderColor}`
	}
}) });
var genBaseFilledStyle = (token, options) => {
	const { componentCls, antCls } = token;
	return {
		[`&:not(${componentCls}-customize-input) ${componentCls}-selector`]: {
			background: options.bg,
			border: `${unit(token.lineWidth)} ${token.lineType} transparent`,
			color: options.color
		},
		[`&:not(${componentCls}-disabled):not(${componentCls}-customize-input):not(${antCls}-pagination-size-changer)`]: {
			[`&:hover ${componentCls}-selector`]: { background: options.hoverBg },
			[`${componentCls}-focused& ${componentCls}-selector`]: {
				background: token.selectorBg,
				borderColor: options.activeBorderColor,
				outline: 0
			}
		}
	};
};
var genFilledStatusStyle = (token, options) => ({ [`&${token.componentCls}-status-${options.status}`]: Object.assign({}, genBaseFilledStyle(token, options)) });
var genFilledStyle = (token) => ({ "&-filled": Object.assign(Object.assign(Object.assign(Object.assign({}, genBaseFilledStyle(token, {
	bg: token.colorFillTertiary,
	hoverBg: token.colorFillSecondary,
	activeBorderColor: token.activeBorderColor,
	color: token.colorText
})), genFilledStatusStyle(token, {
	status: "error",
	bg: token.colorErrorBg,
	hoverBg: token.colorErrorBgHover,
	activeBorderColor: token.colorError,
	color: token.colorError
})), genFilledStatusStyle(token, {
	status: "warning",
	bg: token.colorWarningBg,
	hoverBg: token.colorWarningBgHover,
	activeBorderColor: token.colorWarning,
	color: token.colorWarning
})), {
	[`&${token.componentCls}-disabled`]: { [`&:not(${token.componentCls}-customize-input) ${token.componentCls}-selector`]: {
		borderColor: token.colorBorder,
		background: token.colorBgContainerDisabled,
		color: token.colorTextDisabled
	} },
	[`&${token.componentCls}-multiple ${token.componentCls}-selection-item`]: {
		background: token.colorBgContainer,
		border: `${unit(token.lineWidth)} ${token.lineType} ${token.colorSplit}`
	}
}) });
var genBorderlessStyle = (token) => ({ "&-borderless": {
	[`${token.componentCls}-selector`]: {
		background: "transparent",
		border: `${unit(token.lineWidth)} ${token.lineType} transparent`
	},
	[`&${token.componentCls}-disabled`]: { [`&:not(${token.componentCls}-customize-input) ${token.componentCls}-selector`]: { color: token.colorTextDisabled } },
	[`&${token.componentCls}-multiple ${token.componentCls}-selection-item`]: {
		background: token.multipleItemBg,
		border: `${unit(token.lineWidth)} ${token.lineType} ${token.multipleItemBorderColor}`
	},
	[`&${token.componentCls}-status-error`]: { [`${token.componentCls}-prefix, ${token.componentCls}-selection-item`]: { color: token.colorError } },
	[`&${token.componentCls}-status-warning`]: { [`${token.componentCls}-prefix, ${token.componentCls}-selection-item`]: { color: token.colorWarning } }
} });
var genBaseUnderlinedStyle = (token, options) => {
	const { componentCls, antCls } = token;
	return {
		[`&:not(${componentCls}-customize-input) ${componentCls}-selector`]: {
			borderWidth: `0 0 ${unit(token.lineWidth)} 0`,
			borderStyle: `none none ${token.lineType} none`,
			borderColor: options.borderColor,
			background: token.selectorBg,
			borderRadius: 0
		},
		[`&:not(${componentCls}-disabled):not(${componentCls}-customize-input):not(${antCls}-pagination-size-changer)`]: {
			[`&:hover ${componentCls}-selector`]: { borderColor: options.hoverBorderHover },
			[`${componentCls}-focused& ${componentCls}-selector`]: {
				borderColor: options.activeBorderColor,
				outline: 0
			},
			[`${componentCls}-prefix`]: { color: options.color }
		}
	};
};
var genUnderlinedStatusStyle = (token, options) => ({ [`&${token.componentCls}-status-${options.status}`]: Object.assign({}, genBaseUnderlinedStyle(token, options)) });
var genUnderlinedStyle = (token) => ({ "&-underlined": Object.assign(Object.assign(Object.assign(Object.assign({}, genBaseUnderlinedStyle(token, {
	borderColor: token.colorBorder,
	hoverBorderHover: token.hoverBorderColor,
	activeBorderColor: token.activeBorderColor,
	activeOutlineColor: token.activeOutlineColor,
	color: token.colorText
})), genUnderlinedStatusStyle(token, {
	status: "error",
	borderColor: token.colorError,
	hoverBorderHover: token.colorErrorHover,
	activeBorderColor: token.colorError,
	activeOutlineColor: token.colorErrorOutline,
	color: token.colorError
})), genUnderlinedStatusStyle(token, {
	status: "warning",
	borderColor: token.colorWarning,
	hoverBorderHover: token.colorWarningHover,
	activeBorderColor: token.colorWarning,
	activeOutlineColor: token.colorWarningOutline,
	color: token.colorWarning
})), {
	[`&${token.componentCls}-disabled`]: { [`&:not(${token.componentCls}-customize-input) ${token.componentCls}-selector`]: { color: token.colorTextDisabled } },
	[`&${token.componentCls}-multiple ${token.componentCls}-selection-item`]: {
		background: token.multipleItemBg,
		border: `${unit(token.lineWidth)} ${token.lineType} ${token.multipleItemBorderColor}`
	}
}) });
var genVariantsStyle = (token) => ({ [token.componentCls]: Object.assign(Object.assign(Object.assign(Object.assign({}, genOutlinedStyle(token)), genFilledStyle(token)), genBorderlessStyle(token)), genUnderlinedStyle(token)) });
//#endregion
//#region node_modules/antd/es/select/style/index.js
var genSelectorStyle = (token) => {
	const { componentCls } = token;
	return {
		position: "relative",
		transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
		input: { cursor: "pointer" },
		[`${componentCls}-show-search&`]: {
			cursor: "text",
			input: {
				cursor: "auto",
				color: "inherit",
				height: "100%"
			}
		},
		[`${componentCls}-disabled&`]: {
			cursor: "not-allowed",
			input: { cursor: "not-allowed" }
		}
	};
};
var getSearchInputWithoutBorderStyle = (token) => {
	const { componentCls } = token;
	return { [`${componentCls}-selection-search-input`]: {
		margin: 0,
		padding: 0,
		background: "transparent",
		border: "none",
		outline: "none",
		appearance: "none",
		fontFamily: "inherit",
		"&::-webkit-search-cancel-button": {
			display: "none",
			appearance: "none"
		}
	} };
};
var genBaseStyle = (token) => {
	const { antCls, componentCls, inputPaddingHorizontalBase, iconCls } = token;
	const hoverShowClearStyle = { [`${componentCls}-clear`]: {
		opacity: 1,
		background: token.colorBgBase,
		borderRadius: "50%"
	} };
	return {
		[componentCls]: Object.assign(Object.assign({}, resetComponent(token)), {
			position: "relative",
			display: "inline-flex",
			cursor: "pointer",
			[`&:not(${componentCls}-customize-input) ${componentCls}-selector`]: Object.assign(Object.assign({}, genSelectorStyle(token)), getSearchInputWithoutBorderStyle(token)),
			[`${componentCls}-selection-item`]: Object.assign(Object.assign({
				flex: 1,
				fontWeight: "normal",
				position: "relative",
				userSelect: "none"
			}, textEllipsis), { [`> ${antCls}-typography`]: { display: "inline" } }),
			[`${componentCls}-selection-placeholder`]: Object.assign(Object.assign({}, textEllipsis), {
				flex: 1,
				color: token.colorTextPlaceholder,
				pointerEvents: "none"
			}),
			[`${componentCls}-arrow`]: Object.assign(Object.assign({}, resetIcon()), {
				position: "absolute",
				top: "50%",
				insetInlineStart: "auto",
				insetInlineEnd: inputPaddingHorizontalBase,
				height: token.fontSizeIcon,
				marginTop: token.calc(token.fontSizeIcon).mul(-1).div(2).equal(),
				color: token.colorTextQuaternary,
				fontSize: token.fontSizeIcon,
				lineHeight: 1,
				textAlign: "center",
				pointerEvents: "none",
				display: "flex",
				alignItems: "center",
				transition: `opacity ${token.motionDurationSlow} ease`,
				[iconCls]: {
					verticalAlign: "top",
					transition: `transform ${token.motionDurationSlow}`,
					"> svg": { verticalAlign: "top" },
					[`&:not(${componentCls}-suffix)`]: { pointerEvents: "auto" }
				},
				[`${componentCls}-disabled &`]: { cursor: "not-allowed" },
				"> *:not(:last-child)": { marginInlineEnd: 8 }
			}),
			[`${componentCls}-selection-wrap`]: {
				display: "flex",
				width: "100%",
				position: "relative",
				minWidth: 0,
				"&:after": {
					content: "\"\\a0\"",
					width: 0,
					overflow: "hidden"
				}
			},
			[`${componentCls}-prefix`]: {
				flex: "none",
				marginInlineEnd: token.selectAffixPadding
			},
			[`${componentCls}-clear`]: {
				position: "absolute",
				top: "50%",
				insetInlineStart: "auto",
				insetInlineEnd: inputPaddingHorizontalBase,
				zIndex: 1,
				display: "inline-block",
				width: token.fontSizeIcon,
				height: token.fontSizeIcon,
				marginTop: token.calc(token.fontSizeIcon).mul(-1).div(2).equal(),
				color: token.colorTextQuaternary,
				fontSize: token.fontSizeIcon,
				fontStyle: "normal",
				lineHeight: 1,
				textAlign: "center",
				textTransform: "none",
				cursor: "pointer",
				opacity: 0,
				transition: `color ${token.motionDurationMid} ease, opacity ${token.motionDurationSlow} ease`,
				textRendering: "auto",
				transform: "translateZ(0)",
				"&:before": { display: "block" },
				"&:hover": { color: token.colorIcon }
			},
			"@media(hover:none)": hoverShowClearStyle,
			"&:hover": hoverShowClearStyle
		}),
		[`${componentCls}-status`]: { "&-error, &-warning, &-success, &-validating": { [`&${componentCls}-has-feedback`]: { [`${componentCls}-clear`]: { insetInlineEnd: token.calc(inputPaddingHorizontalBase).add(token.fontSize).add(token.paddingXS).equal() } } } }
	};
};
var genSelectStyle = (token) => {
	const { componentCls } = token;
	return [
		{ [componentCls]: { [`&${componentCls}-in-form-item`]: { width: "100%" } } },
		genBaseStyle(token),
		genSingleStyle(token),
		genMultipleStyle(token),
		genSingleStyle$1(token),
		{ [`${componentCls}-rtl`]: { direction: "rtl" } },
		genCompactItemStyle(token, {
			borderElCls: `${componentCls}-selector`,
			focusElCls: `${componentCls}-focused`
		})
	];
};
var style_default = genStyleHooks("Select", (token, { rootPrefixCls }) => {
	const selectToken = merge(token, {
		rootPrefixCls,
		inputPaddingHorizontalBase: token.calc(token.paddingSM).sub(1).equal(),
		multipleSelectItemHeight: token.multipleItemHeight,
		selectHeight: token.controlHeight
	});
	return [genSelectStyle(selectToken), genVariantsStyle(selectToken)];
}, prepareComponentToken, { unitless: {
	optionLineHeight: true,
	optionSelectedFontWeight: true
} });
//#endregion
//#region node_modules/@ant-design/icons-svg/es/asn/CheckOutlined.js
var CheckOutlined = {
	"icon": {
		"tag": "svg",
		"attrs": {
			"viewBox": "64 64 896 896",
			"focusable": "false"
		},
		"children": [{
			"tag": "path",
			"attrs": { "d": "M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z" }
		}]
	},
	"name": "check",
	"theme": "outlined"
};
//#endregion
//#region node_modules/@ant-design/icons/es/icons/CheckOutlined.js
init_extends();
/**![check](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjYWNhY2EiIHZpZXdCb3g9IjY0IDY0IDg5NiA4OTYiIGZvY3VzYWJsZT0iZmFsc2UiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkxMiAxOTBoLTY5LjljLTkuOCAwLTE5LjEgNC41LTI1LjEgMTIuMkw0MDQuNyA3MjQuNSAyMDcgNDc0YTMyIDMyIDAgMDAtMjUuMS0xMi4ySDExMmMtNi43IDAtMTAuNCA3LjctNi4zIDEyLjlsMjczLjkgMzQ3YzEyLjggMTYuMiAzNy40IDE2LjIgNTAuMyAwbDQ4OC40LTYxOC45YzQuMS01LjEuNC0xMi44LTYuMy0xMi44eiIgLz48L3N2Zz4=) */
var RefIcon$2 = /*#__PURE__*/ import_react.forwardRef(function CheckOutlined$1(props, ref) {
	return /*#__PURE__*/ import_react.createElement(Icon, _extends({}, props, {
		ref,
		icon: CheckOutlined
	}));
});
RefIcon$2.displayName = "CheckOutlined";
//#endregion
//#region node_modules/@ant-design/icons-svg/es/asn/DownOutlined.js
var DownOutlined = {
	"icon": {
		"tag": "svg",
		"attrs": {
			"viewBox": "64 64 896 896",
			"focusable": "false"
		},
		"children": [{
			"tag": "path",
			"attrs": { "d": "M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z" }
		}]
	},
	"name": "down",
	"theme": "outlined"
};
//#endregion
//#region node_modules/@ant-design/icons/es/icons/DownOutlined.js
init_extends();
/**![down](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjYWNhY2EiIHZpZXdCb3g9IjY0IDY0IDg5NiA4OTYiIGZvY3VzYWJsZT0iZmFsc2UiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTg4NCAyNTZoLTc1Yy01LjEgMC05LjkgMi41LTEyLjkgNi42TDUxMiA2NTQuMiAyMjcuOSAyNjIuNmMtMy00LjEtNy44LTYuNi0xMi45LTYuNmgtNzVjLTYuNSAwLTEwLjMgNy40LTYuNSAxMi43bDM1Mi42IDQ4Ni4xYzEyLjggMTcuNiAzOSAxNy42IDUxLjcgMGwzNTIuNi00ODYuMWMzLjktNS4zLjEtMTIuNy02LjQtMTIuN3oiIC8+PC9zdmc+) */
var RefIcon$1 = /*#__PURE__*/ import_react.forwardRef(function DownOutlined$1(props, ref) {
	return /*#__PURE__*/ import_react.createElement(Icon, _extends({}, props, {
		ref,
		icon: DownOutlined
	}));
});
RefIcon$1.displayName = "DownOutlined";
//#endregion
//#region node_modules/@ant-design/icons-svg/es/asn/SearchOutlined.js
var SearchOutlined = {
	"icon": {
		"tag": "svg",
		"attrs": {
			"viewBox": "64 64 896 896",
			"focusable": "false"
		},
		"children": [{
			"tag": "path",
			"attrs": { "d": "M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z" }
		}]
	},
	"name": "search",
	"theme": "outlined"
};
//#endregion
//#region node_modules/@ant-design/icons/es/icons/SearchOutlined.js
init_extends();
/**![search](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjYWNhY2EiIHZpZXdCb3g9IjY0IDY0IDg5NiA4OTYiIGZvY3VzYWJsZT0iZmFsc2UiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkwOS42IDg1NC41TDY0OS45IDU5NC44QzY5MC4yIDU0Mi43IDcxMiA0NzkgNzEyIDQxMmMwLTgwLjItMzEuMy0xNTUuNC04Ny45LTIxMi4xLTU2LjYtNTYuNy0xMzItODcuOS0yMTIuMS04Ny45cy0xNTUuNSAzMS4zLTIxMi4xIDg3LjlDMTQzLjIgMjU2LjUgMTEyIDMzMS44IDExMiA0MTJjMCA4MC4xIDMxLjMgMTU1LjUgODcuOSAyMTIuMUMyNTYuNSA2ODAuOCAzMzEuOCA3MTIgNDEyIDcxMmM2NyAwIDEzMC42LTIxLjggMTgyLjctNjJsMjU5LjcgMjU5LjZhOC4yIDguMiAwIDAwMTEuNiAwbDQzLjYtNDMuNWE4LjIgOC4yIDAgMDAwLTExLjZ6TTU3MC40IDU3MC40QzUyOCA2MTIuNyA0NzEuOCA2MzYgNDEyIDYzNnMtMTE2LTIzLjMtMTU4LjQtNjUuNkMyMTEuMyA1MjggMTg4IDQ3MS44IDE4OCA0MTJzMjMuMy0xMTYuMSA2NS42LTE1OC40QzI5NiAyMTEuMyAzNTIuMiAxODggNDEyIDE4OHMxMTYuMSAyMy4yIDE1OC40IDY1LjZTNjM2IDM1Mi4yIDYzNiA0MTJzLTIzLjMgMTE2LjEtNjUuNiAxNTguNHoiIC8+PC9zdmc+) */
var RefIcon = /*#__PURE__*/ import_react.forwardRef(function SearchOutlined$1(props, ref) {
	return /*#__PURE__*/ import_react.createElement(Icon, _extends({}, props, {
		ref,
		icon: SearchOutlined
	}));
});
RefIcon.displayName = "SearchOutlined";
//#endregion
//#region node_modules/antd/es/select/useIcons.js
function useIcons({ suffixIcon, clearIcon, menuItemSelectedIcon, removeIcon, loading, multiple, hasFeedback, prefixCls, showSuffixIcon, feedbackIcon, showArrow, componentName }) {
	devUseWarning(componentName).deprecated(!clearIcon, "clearIcon", "allowClear={{ clearIcon: React.ReactNode }}");
	const mergedClearIcon = clearIcon !== null && clearIcon !== void 0 ? clearIcon : /*#__PURE__*/ import_react.createElement(RefIcon$4, null);
	const getSuffixIconNode = (arrowIcon) => {
		if (suffixIcon === null && !hasFeedback && !showArrow) return null;
		return /*#__PURE__*/ import_react.createElement(import_react.Fragment, null, showSuffixIcon !== false && arrowIcon, hasFeedback && feedbackIcon);
	};
	let mergedSuffixIcon = null;
	if (suffixIcon !== void 0) mergedSuffixIcon = getSuffixIconNode(suffixIcon);
	else if (loading) mergedSuffixIcon = getSuffixIconNode(/*#__PURE__*/ import_react.createElement(RefIcon$3, { spin: true }));
	else {
		const iconCls = `${prefixCls}-suffix`;
		mergedSuffixIcon = ({ open, showSearch }) => {
			if (open && showSearch) return getSuffixIconNode(/*#__PURE__*/ import_react.createElement(RefIcon, { className: iconCls }));
			return getSuffixIconNode(/*#__PURE__*/ import_react.createElement(RefIcon$1, { className: iconCls }));
		};
	}
	let mergedItemIcon = null;
	if (menuItemSelectedIcon !== void 0) mergedItemIcon = menuItemSelectedIcon;
	else if (multiple) mergedItemIcon = /*#__PURE__*/ import_react.createElement(RefIcon$2, null);
	else mergedItemIcon = null;
	let mergedRemoveIcon = null;
	if (removeIcon !== void 0) mergedRemoveIcon = removeIcon;
	else mergedRemoveIcon = /*#__PURE__*/ import_react.createElement(RefIcon$5, null);
	return {
		clearIcon: mergedClearIcon,
		suffixIcon: mergedSuffixIcon,
		itemIcon: mergedItemIcon,
		removeIcon: mergedRemoveIcon
	};
}
//#endregion
//#region node_modules/antd/es/select/usePopupRender.js
function usePopupRender(renderFn) {
	return import_react.useMemo(() => {
		if (!renderFn) return;
		return (...args) => /*#__PURE__*/ import_react.createElement(ContextIsolator, { space: true }, renderFn.apply(void 0, args));
	}, [renderFn]);
}
//#endregion
//#region node_modules/antd/es/select/useShowArrow.js
/**
* Since Select, TreeSelect, Cascader is same Select like component.
* We just use same hook to handle this logic.
*
* If `suffixIcon` is not equal to `null`, always show it.
*/
function useShowArrow(suffixIcon, showArrow) {
	return showArrow !== void 0 ? showArrow : suffixIcon !== null;
}
//#endregion
//#region node_modules/antd/es/select/index.js
var __rest = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var SECRET_COMBOBOX_MODE_DO_NOT_USE = "SECRET_COMBOBOX_MODE_DO_NOT_USE";
var InternalSelect = (props, ref) => {
	var _a, _b, _c, _d, _e;
	const { prefixCls: customizePrefixCls, bordered, className, rootClassName, getPopupContainer, popupClassName, dropdownClassName, listHeight = 256, placement, listItemHeight: customListItemHeight, size: customizeSize, disabled: customDisabled, notFoundContent, status: customStatus, builtinPlacements, dropdownMatchSelectWidth, popupMatchSelectWidth, direction: propDirection, style, allowClear, variant: customizeVariant, dropdownStyle, transitionName, tagRender, maxCount, prefix, dropdownRender, popupRender, onDropdownVisibleChange, onOpenChange, styles, classNames } = props, rest = __rest(props, [
		"prefixCls",
		"bordered",
		"className",
		"rootClassName",
		"getPopupContainer",
		"popupClassName",
		"dropdownClassName",
		"listHeight",
		"placement",
		"listItemHeight",
		"size",
		"disabled",
		"notFoundContent",
		"status",
		"builtinPlacements",
		"dropdownMatchSelectWidth",
		"popupMatchSelectWidth",
		"direction",
		"style",
		"allowClear",
		"variant",
		"dropdownStyle",
		"transitionName",
		"tagRender",
		"maxCount",
		"prefix",
		"dropdownRender",
		"popupRender",
		"onDropdownVisibleChange",
		"onOpenChange",
		"styles",
		"classNames"
	]);
	const { getPopupContainer: getContextPopupContainer, getPrefixCls, renderEmpty, direction: contextDirection, virtual, popupMatchSelectWidth: contextPopupMatchSelectWidth, popupOverflow } = import_react.useContext(ConfigContext);
	const { showSearch, style: contextStyle, styles: contextStyles, className: contextClassName, classNames: contextClassNames } = useComponentConfig("select");
	const [, token] = useToken();
	const listItemHeight = customListItemHeight !== null && customListItemHeight !== void 0 ? customListItemHeight : token === null || token === void 0 ? void 0 : token.controlHeight;
	const prefixCls = getPrefixCls("select", customizePrefixCls);
	const rootPrefixCls = getPrefixCls();
	const direction = propDirection !== null && propDirection !== void 0 ? propDirection : contextDirection;
	const { compactSize, compactItemClassnames } = useCompactItemContext(prefixCls, direction);
	const [variant, enableVariantCls] = useVariant("select", customizeVariant, bordered);
	const rootCls = useCSSVarCls(prefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default(prefixCls, rootCls);
	const mode = import_react.useMemo(() => {
		const { mode: m } = props;
		if (m === "combobox") return;
		if (m === SECRET_COMBOBOX_MODE_DO_NOT_USE) return "combobox";
		return m;
	}, [props.mode]);
	const isMultiple = mode === "multiple" || mode === "tags";
	const showSuffixIcon = useShowArrow(props.suffixIcon, props.showArrow);
	const mergedPopupMatchSelectWidth = (_a = popupMatchSelectWidth !== null && popupMatchSelectWidth !== void 0 ? popupMatchSelectWidth : dropdownMatchSelectWidth) !== null && _a !== void 0 ? _a : contextPopupMatchSelectWidth;
	const mergedPopupStyle = ((_b = styles === null || styles === void 0 ? void 0 : styles.popup) === null || _b === void 0 ? void 0 : _b.root) || ((_c = contextStyles.popup) === null || _c === void 0 ? void 0 : _c.root) || dropdownStyle;
	const mergedPopupRender = usePopupRender(popupRender || dropdownRender);
	const mergedOnOpenChange = onOpenChange || onDropdownVisibleChange;
	const { status: contextStatus, hasFeedback, isFormItemInput, feedbackIcon } = import_react.useContext(FormItemInputContext);
	const mergedStatus = getMergedStatus(contextStatus, customStatus);
	let mergedNotFound;
	if (notFoundContent !== void 0) mergedNotFound = notFoundContent;
	else if (mode === "combobox") mergedNotFound = null;
	else mergedNotFound = (renderEmpty === null || renderEmpty === void 0 ? void 0 : renderEmpty("Select")) || /*#__PURE__*/ import_react.createElement(DefaultRenderEmpty, { componentName: "Select" });
	const { suffixIcon, itemIcon, removeIcon, clearIcon } = useIcons(Object.assign(Object.assign({}, rest), {
		multiple: isMultiple,
		hasFeedback,
		feedbackIcon,
		showSuffixIcon,
		prefixCls,
		componentName: "Select"
	}));
	const mergedAllowClear = allowClear === true ? { clearIcon } : allowClear;
	const selectProps = omit(rest, ["suffixIcon", "itemIcon"]);
	const mergedPopupClassName = (0, import_classnames.default)(((_d = classNames === null || classNames === void 0 ? void 0 : classNames.popup) === null || _d === void 0 ? void 0 : _d.root) || ((_e = contextClassNames === null || contextClassNames === void 0 ? void 0 : contextClassNames.popup) === null || _e === void 0 ? void 0 : _e.root) || popupClassName || dropdownClassName, { [`${prefixCls}-dropdown-${direction}`]: direction === "rtl" }, rootClassName, contextClassNames.root, classNames === null || classNames === void 0 ? void 0 : classNames.root, cssVarCls, rootCls, hashId);
	const mergedSize = useSize((ctx) => {
		var _a;
		return (_a = customizeSize !== null && customizeSize !== void 0 ? customizeSize : compactSize) !== null && _a !== void 0 ? _a : ctx;
	});
	const disabled = import_react.useContext(DisabledContext);
	const mergedDisabled = customDisabled !== null && customDisabled !== void 0 ? customDisabled : disabled;
	const mergedClassName = (0, import_classnames.default)({
		[`${prefixCls}-lg`]: mergedSize === "large",
		[`${prefixCls}-sm`]: mergedSize === "small",
		[`${prefixCls}-rtl`]: direction === "rtl",
		[`${prefixCls}-${variant}`]: enableVariantCls,
		[`${prefixCls}-in-form-item`]: isFormItemInput
	}, getStatusClassNames(prefixCls, mergedStatus, hasFeedback), compactItemClassnames, contextClassName, className, contextClassNames.root, classNames === null || classNames === void 0 ? void 0 : classNames.root, rootClassName, cssVarCls, rootCls, hashId);
	const memoPlacement = import_react.useMemo(() => {
		if (placement !== void 0) return placement;
		return direction === "rtl" ? "bottomRight" : "bottomLeft";
	}, [placement, direction]);
	{
		const warning = devUseWarning("Select");
		Object.entries({
			dropdownMatchSelectWidth: "popupMatchSelectWidth",
			dropdownStyle: "styles.popup.root",
			dropdownClassName: "classNames.popup.root",
			popupClassName: "classNames.popup.root",
			dropdownRender: "popupRender",
			onDropdownVisibleChange: "onOpenChange",
			bordered: "variant"
		}).forEach(([oldProp, newProp]) => {
			warning.deprecated(!(oldProp in props), oldProp, newProp);
		});
		warning(!("showArrow" in props), "deprecated", "`showArrow` is deprecated which will be removed in next major version. It will be a default behavior, you can hide it by setting `suffixIcon` to null.");
		warning(!(typeof maxCount !== "undefined" && !isMultiple), "usage", "`maxCount` only works with mode `multiple` or `tags`");
	}
	const [zIndex] = useZIndex("SelectLike", mergedPopupStyle === null || mergedPopupStyle === void 0 ? void 0 : mergedPopupStyle.zIndex);
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement(es_default, Object.assign({
		ref,
		virtual,
		showSearch
	}, selectProps, {
		style: Object.assign(Object.assign(Object.assign(Object.assign({}, contextStyles.root), styles === null || styles === void 0 ? void 0 : styles.root), contextStyle), style),
		dropdownMatchSelectWidth: mergedPopupMatchSelectWidth,
		transitionName: getTransitionName(rootPrefixCls, "slide-up", transitionName),
		builtinPlacements: mergedBuiltinPlacements(builtinPlacements, popupOverflow),
		listHeight,
		listItemHeight,
		mode,
		prefixCls,
		placement: memoPlacement,
		direction,
		prefix,
		suffixIcon,
		menuItemSelectedIcon: itemIcon,
		removeIcon,
		allowClear: mergedAllowClear,
		notFoundContent: mergedNotFound,
		className: mergedClassName,
		getPopupContainer: getPopupContainer || getContextPopupContainer,
		dropdownClassName: mergedPopupClassName,
		disabled: mergedDisabled,
		dropdownStyle: Object.assign(Object.assign({}, mergedPopupStyle), { zIndex }),
		maxCount: isMultiple ? maxCount : void 0,
		tagRender: isMultiple ? tagRender : void 0,
		dropdownRender: mergedPopupRender,
		onDropdownVisibleChange: mergedOnOpenChange
	})));
};
InternalSelect.displayName = "Select";
var Select = /*#__PURE__*/ import_react.forwardRef(InternalSelect);
/* istanbul ignore next */
var PurePanel = genPurePanel(Select, "dropdownAlign");
Select.SECRET_COMBOBOX_MODE_DO_NOT_USE = SECRET_COMBOBOX_MODE_DO_NOT_USE;
Select.Option = Option$1;
Select.OptGroup = OptGroup;
Select._InternalPanelDoNotUseOrYouWillBeFired = PurePanel;
Select.displayName = "Select";
var orderType_module_default = {
	orderTypePanel: "orderTypePanel___PkYes",
	orderTypeContent: "orderTypeContent___fp1z2",
	orderTypeTitle: "orderTypeTitle___RrElR",
	orderTypeBtnList: "orderTypeBtnList___JrfF7",
	card: "card___06Eu-",
	text: "text___2pQ--",
	bgImg: "bgImg___Cb5yN"
};
var ChoosePickUpTime_module_default = {
	containerBox: "containerBox___hKx09",
	closeIcon: "closeIcon___rctUq",
	title: "title___5gBxG",
	itemBox: "itemBox___ujYk9",
	dayPicker: "dayPicker___JByvk",
	timePicker: "timePicker___ytjqF",
	pickerOption: "pickerOption___JJR7C",
	btnBox: "btnBox___0kC4F",
	btn: "btn___llASZ",
	btnConfirm: "btnConfirm___1tLDT"
};
//#endregion
//#region source-snapshot/src/component/ChoosePickUpTime/index.jsx
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min());
var import_jsx_runtime = require_jsx_runtime();
var { Option } = Select;
var ChoosePickUpTime = (props) => {
	const { t, isShowModal, handleContinue, handleCancel } = props;
	const [recentDaysList, setRecentDaysList] = (0, import_react.useState)([]);
	const [timeList, setTimeList] = (0, import_react.useState)([]);
	const [hourInfo, setHourInfo] = (0, import_react.useState)([]);
	const [selectedTime, setSelectedTime] = (0, import_react.useState)(null);
	const [selectedDay, setSelectedDay] = (0, import_react.useState)(null);
	const isMountedRef = (0, import_react.useRef)(true);
	const isVertical = getDeviceOrientation() === "vertical";
	(0, import_react.useEffect)(() => {
		initBsHour();
		return () => {
			isMountedRef.current = false;
		};
	}, []);
	const updateRecentDaysList = () => {
		setRecentDaysList([
			{
				value: (0, import_dayjs_min.default)().format("MM/DD/YYYY"),
				label: t("today")
			},
			{
				value: (0, import_dayjs_min.default)().add(1, "days").format("MM/DD/YYYY"),
				label: t("tomorrow")
			},
			{
				value: (0, import_dayjs_min.default)().add(2, "days").format("MM/DD/YYYY"),
				label: (0, import_dayjs_min.default)().add(2, "days").format("MM/DD/YYYY")
			},
			{
				value: (0, import_dayjs_min.default)().add(3, "days").format("MM/DD/YYYY"),
				label: (0, import_dayjs_min.default)().add(3, "days").format("MM/DD/YYYY")
			},
			{
				value: (0, import_dayjs_min.default)().add(4, "days").format("MM/DD/YYYY"),
				label: (0, import_dayjs_min.default)().add(4, "days").format("MM/DD/YYYY")
			},
			{
				value: (0, import_dayjs_min.default)().add(5, "days").format("MM/DD/YYYY"),
				label: (0, import_dayjs_min.default)().add(5, "days").format("MM/DD/YYYY")
			},
			{
				value: (0, import_dayjs_min.default)().add(6, "days").format("MM/DD/YYYY"),
				label: (0, import_dayjs_min.default)().add(6, "days").format("MM/DD/YYYY")
			}
		]);
	};
	(0, import_react.useEffect)(() => {
		updateRecentDaysList();
	}, [t]);
	const handleDayChange = (v) => {
		setSelectedDay(v);
		setSelectedTime(null);
	};
	const handleTimeChange = (v) => {
		setSelectedTime(v);
	};
	const handleConfirm = () => {
		let pickupTimeTip = "\n" + t(`pickupTimeTip`, { value: `${selectedDay} ${selectedTime}` });
		handleContinue(pickupTimeTip);
	};
	const handleCancelClick = () => {
		setSelectedTime(null);
		setSelectedDay(null);
		handleCancel();
	};
	const getTimeList = (day) => {
		const timeList = [];
		const mostEarly = hourInfo?.reduce((min, obj) => {
			return obj.from < min ? obj.from : min;
		}, hourInfo[0].from).split(":");
		const mostEarlyFormat = (0, import_dayjs_min.default)((/* @__PURE__ */ new Date()).setHours(Number(mostEarly[0]), Number(mostEarly[1]), 0, 0));
		const mostLate = hourInfo?.reduce((max, obj) => {
			return obj.to > max ? obj.to : max;
		}, hourInfo[0].to).split(":");
		const mostLateFormat = (0, import_dayjs_min.default)((/* @__PURE__ */ new Date()).setHours(Number(mostLate[0]), Number(mostLate[1]), 0, 0));
		let start;
		if ((0, import_dayjs_min.default)(day).isSame((0, import_dayjs_min.default)(), "day")) start = (0, import_dayjs_min.default)().isBefore(mostEarlyFormat) ? mostEarlyFormat : (0, import_dayjs_min.default)();
		else start = mostEarlyFormat;
		const end = mostLateFormat;
		let hour = start.hour();
		let minute = 0;
		if (start.minute() <= 30 && start.minute() > 0) minute = 30;
		else {
			hour = hour + 1;
			minute = 0;
		}
		let current = (0, import_dayjs_min.default)((/* @__PURE__ */ new Date()).setHours(hour, minute, 0, 0));
		while (current <= end) {
			let label;
			if (current.hour() > 12 && current.hour() < 24) label = `${current.hour() - 12}:${String(current.minute()).padStart(2, "0")} PM`;
			else if (current.hour() === 12) label = `12:${String(current.minute()).padStart(2, "0")} PM`;
			else if (current.hour() === 24) label = `12:${String(current.minute()).padStart(2, "0")} AM`;
			else label = `${current.hour()}:${String(current.minute()).padStart(2, "0")} AM`;
			timeList.push({
				value: label,
				label
			});
			current = current.add(30, "minute");
		}
		setTimeList(timeList);
	};
	(0, import_react.useEffect)(() => {
		if (selectedDay) getTimeList(selectedDay);
	}, [selectedDay]);
	const initBsHour = async () => {
		try {
			const res = await getRestaurantHour();
			if (isMountedRef.current && res?.data?.msg === "success") {
				const { data } = res.data;
				const { hours } = data;
				const newHours = getBsTime(hours);
				setHourInfo(newHours);
			}
		} catch (error) {
			if (isMountedRef.current) console.error("获取营业时间失败:", error);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		visible: isShowModal,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: ChoosePickUpTime_module_default.containerBox,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: close_default,
					alt: "close",
					className: ChoosePickUpTime_module_default.closeIcon,
					onClick: handleCancelClick
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: ChoosePickUpTime_module_default.title,
					children: t("choosePickUpTime")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: ChoosePickUpTime_module_default.itemBox,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
						placeholder: t("selectDate"),
						size: "large",
						className: ChoosePickUpTime_module_default.dayPicker,
						value: selectedDay,
						listHeight: isVertical ? 560 : 400,
						getPopupContainer: (node) => node.parentNode,
						onChange: (v) => handleDayChange(v),
						children: recentDaysList.map((each) => {
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Option, {
								value: each.value,
								className: ChoosePickUpTime_module_default.pickerOption,
								children: each.label
							}, each.value);
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
						placeholder: t("selectTime"),
						size: "large",
						className: ChoosePickUpTime_module_default.timePicker,
						value: selectedTime,
						listHeight: isVertical ? 560 : 400,
						disabled: !selectedDay,
						getPopupContainer: (node) => node.parentNode,
						onChange: (v) => handleTimeChange(v),
						children: timeList.map((each) => {
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Option, {
								value: each.value,
								className: ChoosePickUpTime_module_default.pickerOption,
								children: each.label
							}, each.value);
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: ChoosePickUpTime_module_default.btnBox,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ChoosePickUpTime_module_default.btn,
						onClick: handleCancelClick,
						children: t("cancel")
					}), selectedDay && selectedTime && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `${ChoosePickUpTime_module_default.btn} ${ChoosePickUpTime_module_default.btnConfirm}`,
						onClick: handleConfirm,
						children: t("confirm")
					})]
				})
			]
		}),
		onClose: handleCancelClick
	});
};
var ChoosePickUpTime_default = withTranslation()(ChoosePickUpTime);
//#endregion
//#region source-snapshot/src/assets/images/DINE_IN.png
var DINE_IN_default = "" + new URL("DINE_IN-DdAOwwJY.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/assets/images/TO_GO.png
var TO_GO_default = "" + new URL("TO_GO-DgqUOQKP.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/assets/images/PICK_UP.png
var PICK_UP_default = "" + new URL("PICK_UP-CJysKB6P.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/container/orderType/index.js
var OrderType = class extends import_react.Component {
	state = {
		showModal: false,
		showPickUpTimeModal: false,
		pickupTimeTip: null
	};
	selectOrderType = (orderType) => {
		const { currentOrder, resetCurrentOrder, changePickupTime } = this.props;
		window.selectedOrderType = orderType;
		if (currentOrder?.orderType !== orderType) {
			resetCurrentOrder();
			changePickupTime(this.state.pickupTimeTip);
			this.props.changeOrderType(orderType);
		}
		this.props.history.push("/orderPage");
	};
	componentDidMount() {
		this.props.clearTogoOption();
		this.props.clearCurrentCategory();
		this.props.setCateyPageDomTop(0);
		this.props.setorderPageDomTop(0);
		window.selectedOrderType = "";
		this.props.setShowBanner(true);
	}
	componentWillUnmount() {}
	handlePickUp = (value) => {
		this.setState({ pickupTimeTip: value }, () => {
			this.selectOrderType("PICK_UP");
		});
	};
	pickUpCancel = () => {
		this.setState({ showPickUpTimeModal: false });
	};
	render() {
		const { t, systemConfig } = this.props;
		const { showPickUpTimeModal } = this.state;
		let welContent = "";
		const orderTypeList = systemConfig?.CHOOSE_ORDER_TYPE?.value?.split(",") || [];
		if (orderTypeList?.length) welContent = t("order_type_welcome");
		const orderTypeConfig = [
			{
				value: "0",
				type: "DINE_IN",
				bgImg: DINE_IN_default,
				translationKey: "order_type_0",
				onClick: () => this.selectOrderType("DINE_IN")
			},
			{
				value: "1",
				type: "TO_GO",
				bgImg: TO_GO_default,
				translationKey: "order_type_1",
				onClick: () => this.selectOrderType("TO_GO")
			},
			{
				value: "2",
				type: "PICK_UP",
				bgImg: PICK_UP_default,
				translationKey: "order_type_2",
				onClick: () => this.setState({ showPickUpTimeModal: true })
			}
		];
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: orderType_module_default.orderTypePanel,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: orderType_module_default.orderTypeContent,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: orderType_module_default.orderTypeTitle,
					children: [
						" ",
						welContent,
						" "
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: orderType_module_default.orderTypeBtnList,
					children: orderTypeConfig.map((config) => {
						if (!orderTypeList?.includes(config.value)) return null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: orderType_module_default.card,
							onClick: (event) => {
								event.stopPropagation();
								if (orderTypeList.includes(config.value)) config.onClick();
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: orderType_module_default.bgImg,
								src: config.bgImg
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: orderType_module_default.text,
								children: t(config.translationKey)
							})]
						}, config.value);
					})
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChoosePickUpTime_default, {
			isShowModal: showPickUpTimeModal,
			handleContinue: this.handlePickUp,
			handleCancel: this.pickUpCancel
		})] });
	}
};
function mapStateToProps(state) {
	return {
		selfConfig: state.selfConfig,
		systemConfig: state.systemConfig,
		menuGroup: state.menuGroup,
		currentOrder: state.currentOrder
	};
}
var orderType_default = withRouter(connect(mapStateToProps, {
	clearCurrentCategory,
	changeOrderType,
	resetCurrentOrder,
	changePickupTime,
	setCateyPageDomTop,
	setorderPageDomTop,
	clearTogoOption,
	setSelectedBrand,
	setShowBanner
})(withTranslation()(OrderType)));
//#endregion
export { orderType_default as default };
