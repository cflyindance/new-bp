import { d as __toESM, i as require_react, n as require_jsx_runtime, r as require_react_dom } from "./toast-C8a1ReSo.js";
import { l as _extends, u as init_extends } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { S as init_typeof, b as init_defineProperty, i as init_slicedToArray, l as _toConsumableArray, n as init_objectWithoutProperties, r as _slicedToArray, t as _objectWithoutProperties, u as init_toConsumableArray, x as _typeof, y as _defineProperty } from "./objectWithoutProperties-DDcNLcsK.js";
import { A as unit, K as getNodeRef, W as composeRef, X as _objectSpread2, d as useMergedState, m as ConfigContext, n as genFocusOutline, o as resetComponent, p as useEvent, q as supportRef, u as useToken } from "./style-DWrLyeCr.js";
import { a as _asyncToGenerator, i as omit, o as _regeneratorRuntime, t as FormItemInputContext } from "./context-LOicZ8vw.js";
import { o as devUseWarning, p as wrapperRaf, s as warning, t as es_default } from "./es-CH_mXwwY.js";
import { r as DisabledContext } from "./config-provider-20CUitiF.js";
import { n as genStyleHooks, r as merge, t as genComponentStyleHook } from "./genStyleUtils-Bvib8P-r.js";
import { n as useCSSVarCls, t as isVisible_default } from "./isVisible-BkT4ROa_.js";
import "./AntdWrapper-cwb818Wp.js";
import { t as PolicyContent } from "./PolicyContent-CTnZEMvv.js";
//#region node_modules/antd/es/_util/reactNode.js
init_extends();
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
init_defineProperty();
init_slicedToArray();
init_objectWithoutProperties();
var import_react = /* @__PURE__ */ __toESM(require_react());
var replaceElement = (element, replacement, props) => {
	if (!/*#__PURE__*/ import_react.isValidElement(element)) return replacement;
	return /*#__PURE__*/ import_react.cloneElement(element, typeof props === "function" ? props(element.props || {}) : props);
};
function cloneElement$1(element, props) {
	return replaceElement(element, element, props);
}
//#endregion
//#region node_modules/rc-util/es/React/render.js
init_typeof();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var fullClone = _objectSpread2({}, import_react_dom);
var version = fullClone.version;
var reactRender = fullClone.render;
var unmountComponentAtNode = fullClone.unmountComponentAtNode;
var createRoot;
try {
	if (Number((version || "").split(".")[0]) >= 18) createRoot = fullClone.createRoot;
} catch (e) {}
function toggleWarning(skip) {
	var __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = fullClone.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
	if (__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED && _typeof(__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) === "object") __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.usingClientEntryPoint = skip;
}
var MARK = "__rc_react_root__";
function modernRender(node, container) {
	toggleWarning(true);
	var root = container[MARK] || createRoot(container);
	toggleWarning(false);
	root.render(node);
	container[MARK] = root;
}
function legacyRender(node, container) {
	reactRender === null || reactRender === void 0 || reactRender(node, container);
}
function render(node, container) {
	if (createRoot) {
		modernRender(node, container);
		return;
	}
	legacyRender(node, container);
}
function modernUnmount(_x) {
	return _modernUnmount.apply(this, arguments);
}
function _modernUnmount() {
	_modernUnmount = _asyncToGenerator(/*#__PURE__*/ _regeneratorRuntime().mark(function _callee(container) {
		return _regeneratorRuntime().wrap(function _callee$(_context) {
			while (1) switch (_context.prev = _context.next) {
				case 0: return _context.abrupt("return", Promise.resolve().then(function() {
					var _container$MARK;
					(_container$MARK = container[MARK]) === null || _container$MARK === void 0 || _container$MARK.unmount();
					delete container[MARK];
				}));
				case 1:
				case "end": return _context.stop();
			}
		}, _callee);
	}));
	return _modernUnmount.apply(this, arguments);
}
function legacyUnmount(container) {
	unmountComponentAtNode(container);
}
function unmount(_x2) {
	return _unmount.apply(this, arguments);
}
function _unmount() {
	_unmount = _asyncToGenerator(/*#__PURE__*/ _regeneratorRuntime().mark(function _callee2(container) {
		return _regeneratorRuntime().wrap(function _callee2$(_context2) {
			while (1) switch (_context2.prev = _context2.next) {
				case 0:
					if (!(createRoot !== void 0)) {
						_context2.next = 2;
						break;
					}
					return _context2.abrupt("return", modernUnmount(container));
				case 2: legacyUnmount(container);
				case 3:
				case "end": return _context2.stop();
			}
		}, _callee2);
	}));
	return _unmount.apply(this, arguments);
}
//#endregion
//#region node_modules/antd/es/config-provider/UnstableContext.js
var defaultReactRender = (node, container) => {
	{
		const majorVersion = Number.parseInt(import_react.version.split(".")[0], 10);
		const fullKeys = Object.keys(import_react_dom);
		warning(majorVersion < 19 || fullKeys.includes("createRoot"), "compatible", "antd v5 support React is 16 ~ 18. see https://u.ant.design/v5-for-19 for compatible.");
	}
	render(node, container);
	return () => {
		return unmount(container);
	};
};
var unstableRender = defaultReactRender;
/**
* @deprecated Set React render function for compatible usage.
* This is internal usage only compatible with React 19.
* And will be removed in next major version.
*/
function unstableSetRender(render) {
	if (render) unstableRender = render;
	return unstableRender;
}
//#endregion
//#region node_modules/antd/es/_util/wave/style.js
var genWaveStyle = (token) => {
	const { componentCls, colorPrimary } = token;
	return { [componentCls]: {
		position: "absolute",
		background: "transparent",
		pointerEvents: "none",
		boxSizing: "border-box",
		color: `var(--wave-color, ${colorPrimary})`,
		boxShadow: `0 0 0 0 currentcolor`,
		opacity: .2,
		"&.wave-motion-appear": {
			transition: [`box-shadow 0.4s ${token.motionEaseOutCirc}`, `opacity 2s ${token.motionEaseOutCirc}`].join(","),
			"&-active": {
				boxShadow: `0 0 0 6px currentcolor`,
				opacity: 0
			},
			"&.wave-quick": { transition: [`box-shadow ${token.motionDurationSlow} ${token.motionEaseInOut}`, `opacity ${token.motionDurationSlow} ${token.motionEaseInOut}`].join(",") }
		}
	} };
};
var style_default$1 = genComponentStyleHook("Wave", genWaveStyle);
//#endregion
//#region node_modules/antd/es/_util/wave/interface.js
var TARGET_CLS = `ant-wave-target`;
//#endregion
//#region node_modules/antd/es/_util/wave/util.js
function isValidWaveColor(color) {
	return color && color !== "#fff" && color !== "#ffffff" && color !== "rgb(255, 255, 255)" && color !== "rgba(255, 255, 255, 1)" && !/rgba\((?:\d*, ){3}0\)/.test(color) && color !== "transparent" && color !== "canvastext";
}
function getTargetWaveColor(node) {
	var _a;
	const { borderTopColor, borderColor, backgroundColor } = getComputedStyle(node);
	return (_a = [
		borderTopColor,
		borderColor,
		backgroundColor
	].find(isValidWaveColor)) !== null && _a !== void 0 ? _a : null;
}
//#endregion
//#region node_modules/antd/es/_util/wave/WaveEffect.js
function validateNum(value) {
	return Number.isNaN(value) ? 0 : value;
}
var WaveEffect = (props) => {
	const { className, target, component, registerUnmount } = props;
	const divRef = import_react.useRef(null);
	const unmountRef = import_react.useRef(null);
	import_react.useEffect(() => {
		unmountRef.current = registerUnmount();
	}, []);
	const [color, setWaveColor] = import_react.useState(null);
	const [borderRadius, setBorderRadius] = import_react.useState([]);
	const [left, setLeft] = import_react.useState(0);
	const [top, setTop] = import_react.useState(0);
	const [width, setWidth] = import_react.useState(0);
	const [height, setHeight] = import_react.useState(0);
	const [enabled, setEnabled] = import_react.useState(false);
	const waveStyle = {
		left,
		top,
		width,
		height,
		borderRadius: borderRadius.map((radius) => `${radius}px`).join(" ")
	};
	if (color) waveStyle["--wave-color"] = color;
	function syncPos() {
		const nodeStyle = getComputedStyle(target);
		setWaveColor(getTargetWaveColor(target));
		const isStatic = nodeStyle.position === "static";
		const { borderLeftWidth, borderTopWidth } = nodeStyle;
		setLeft(isStatic ? target.offsetLeft : validateNum(-Number.parseFloat(borderLeftWidth)));
		setTop(isStatic ? target.offsetTop : validateNum(-Number.parseFloat(borderTopWidth)));
		setWidth(target.offsetWidth);
		setHeight(target.offsetHeight);
		const { borderTopLeftRadius, borderTopRightRadius, borderBottomLeftRadius, borderBottomRightRadius } = nodeStyle;
		setBorderRadius([
			borderTopLeftRadius,
			borderTopRightRadius,
			borderBottomRightRadius,
			borderBottomLeftRadius
		].map((radius) => validateNum(Number.parseFloat(radius))));
	}
	import_react.useEffect(() => {
		if (target) {
			const id = wrapperRaf(() => {
				syncPos();
				setEnabled(true);
			});
			let resizeObserver;
			if (typeof ResizeObserver !== "undefined") {
				resizeObserver = new ResizeObserver(syncPos);
				resizeObserver.observe(target);
			}
			return () => {
				wrapperRaf.cancel(id);
				resizeObserver === null || resizeObserver === void 0 || resizeObserver.disconnect();
			};
		}
	}, [target]);
	if (!enabled) return null;
	const isSmallComponent = (component === "Checkbox" || component === "Radio") && (target === null || target === void 0 ? void 0 : target.classList.contains(TARGET_CLS));
	return /*#__PURE__*/ import_react.createElement(es_default, {
		visible: true,
		motionAppear: true,
		motionName: "wave-motion",
		motionDeadline: 5e3,
		onAppearEnd: (_, event) => {
			var _a, _b;
			if (event.deadline || event.propertyName === "opacity") {
				const holder = (_a = divRef.current) === null || _a === void 0 ? void 0 : _a.parentElement;
				(_b = unmountRef.current) === null || _b === void 0 || _b.call(unmountRef).then(() => {
					holder === null || holder === void 0 || holder.remove();
				});
			}
			return false;
		}
	}, ({ className: motionClassName }, ref) => /*#__PURE__*/ import_react.createElement("div", {
		ref: composeRef(divRef, ref),
		className: (0, import_classnames.default)(className, motionClassName, { "wave-quick": isSmallComponent }),
		style: waveStyle
	}));
};
var showWaveEffect = (target, info) => {
	var _a;
	const { component } = info;
	if (component === "Checkbox" && !((_a = target.querySelector("input")) === null || _a === void 0 ? void 0 : _a.checked)) return;
	const holder = document.createElement("div");
	holder.style.position = "absolute";
	holder.style.left = "0px";
	holder.style.top = "0px";
	target === null || target === void 0 || target.insertBefore(holder, target === null || target === void 0 ? void 0 : target.firstChild);
	const reactRender = unstableSetRender();
	let unmountCallback = null;
	function registerUnmount() {
		return unmountCallback;
	}
	unmountCallback = reactRender(/*#__PURE__*/ import_react.createElement(WaveEffect, Object.assign({}, info, {
		target,
		registerUnmount
	})), holder);
};
//#endregion
//#region node_modules/antd/es/_util/wave/useWave.js
var useWave = (nodeRef, className, component) => {
	const { wave } = import_react.useContext(ConfigContext);
	const [, token, hashId] = useToken();
	const showWave = useEvent((event) => {
		const node = nodeRef.current;
		if ((wave === null || wave === void 0 ? void 0 : wave.disabled) || !node) return;
		const targetNode = node.querySelector(`.${TARGET_CLS}`) || node;
		const { showEffect } = wave || {};
		(showEffect || showWaveEffect)(targetNode, {
			className,
			token,
			component,
			event,
			hashId
		});
	});
	const rafId = import_react.useRef(null);
	const showDebounceWave = (event) => {
		wrapperRaf.cancel(rafId.current);
		rafId.current = wrapperRaf(() => {
			showWave(event);
		});
	};
	return showDebounceWave;
};
//#endregion
//#region node_modules/antd/es/_util/wave/index.js
var Wave = (props) => {
	const { children, disabled, component } = props;
	const { getPrefixCls } = (0, import_react.useContext)(ConfigContext);
	const containerRef = (0, import_react.useRef)(null);
	const prefixCls = getPrefixCls("wave");
	const [, hashId] = style_default$1(prefixCls);
	const showWave = useWave(containerRef, (0, import_classnames.default)(prefixCls, hashId), component);
	import_react.useEffect(() => {
		const node = containerRef.current;
		if (!node || node.nodeType !== window.Node.ELEMENT_NODE || disabled) return;
		const onClick = (e) => {
			if (!isVisible_default(e.target) || !node.getAttribute || node.getAttribute("disabled") || node.disabled || node.className.includes("disabled") && !node.className.includes("disabled:") || node.getAttribute("aria-disabled") === "true" || node.className.includes("-leave")) return;
			showWave(e);
		};
		node.addEventListener("click", onClick, true);
		return () => {
			node.removeEventListener("click", onClick, true);
		};
	}, [disabled]);
	if (!/*#__PURE__*/ import_react.isValidElement(children)) return children !== null && children !== void 0 ? children : null;
	return cloneElement$1(children, { ref: supportRef(children) ? composeRef(getNodeRef(children), containerRef) : containerRef });
};
Wave.displayName = "Wave";
//#endregion
//#region node_modules/rc-checkbox/es/index.js
var _excluded = [
	"prefixCls",
	"className",
	"style",
	"checked",
	"disabled",
	"defaultChecked",
	"type",
	"title",
	"onChange"
];
var Checkbox$2 = /*#__PURE__*/ (0, import_react.forwardRef)(function(props, ref) {
	var _props$prefixCls = props.prefixCls, prefixCls = _props$prefixCls === void 0 ? "rc-checkbox" : _props$prefixCls, className = props.className, style = props.style, checked = props.checked, disabled = props.disabled, _props$defaultChecked = props.defaultChecked, defaultChecked = _props$defaultChecked === void 0 ? false : _props$defaultChecked, _props$type = props.type, type = _props$type === void 0 ? "checkbox" : _props$type, title = props.title, onChange = props.onChange, inputProps = _objectWithoutProperties(props, _excluded);
	var inputRef = (0, import_react.useRef)(null);
	var holderRef = (0, import_react.useRef)(null);
	var _useMergedState2 = _slicedToArray(useMergedState(defaultChecked, { value: checked }), 2), rawValue = _useMergedState2[0], setRawValue = _useMergedState2[1];
	(0, import_react.useImperativeHandle)(ref, function() {
		return {
			focus: function focus(options) {
				var _inputRef$current;
				(_inputRef$current = inputRef.current) === null || _inputRef$current === void 0 || _inputRef$current.focus(options);
			},
			blur: function blur() {
				var _inputRef$current2;
				(_inputRef$current2 = inputRef.current) === null || _inputRef$current2 === void 0 || _inputRef$current2.blur();
			},
			input: inputRef.current,
			nativeElement: holderRef.current
		};
	});
	var classString = (0, import_classnames.default)(prefixCls, className, _defineProperty(_defineProperty({}, "".concat(prefixCls, "-checked"), rawValue), "".concat(prefixCls, "-disabled"), disabled));
	return /*#__PURE__*/ import_react.createElement("span", {
		className: classString,
		title,
		style,
		ref: holderRef
	}, /*#__PURE__*/ import_react.createElement("input", _extends({}, inputProps, {
		className: "".concat(prefixCls, "-input"),
		ref: inputRef,
		onChange: function handleChange(e) {
			if (disabled) return;
			if (!("checked" in props)) setRawValue(e.target.checked);
			onChange === null || onChange === void 0 || onChange({
				target: _objectSpread2(_objectSpread2({}, props), {}, {
					type,
					checked: e.target.checked
				}),
				stopPropagation: function stopPropagation() {
					e.stopPropagation();
				},
				preventDefault: function preventDefault() {
					e.preventDefault();
				},
				nativeEvent: e.nativeEvent
			});
		},
		disabled,
		checked: !!rawValue,
		type
	})), /*#__PURE__*/ import_react.createElement("span", { className: "".concat(prefixCls, "-inner") }));
});
//#endregion
//#region node_modules/antd/es/checkbox/useBubbleLock.js
/**
* When click on the label,
* the event will be stopped to prevent the label from being clicked twice.
* label click -> input click -> label click again
*/
function useBubbleLock(onOriginInputClick) {
	const labelClickLockRef = import_react.useRef(null);
	const clearLock = () => {
		wrapperRaf.cancel(labelClickLockRef.current);
		labelClickLockRef.current = null;
	};
	const onLabelClick = () => {
		clearLock();
		labelClickLockRef.current = wrapperRaf(() => {
			labelClickLockRef.current = null;
		});
	};
	const onInputClick = (e) => {
		if (labelClickLockRef.current) {
			e.stopPropagation();
			clearLock();
		}
		onOriginInputClick === null || onOriginInputClick === void 0 || onOriginInputClick(e);
	};
	return [onLabelClick, onInputClick];
}
//#endregion
//#region node_modules/antd/es/checkbox/style/index.js
var genCheckboxStyle = (token) => {
	const { checkboxCls } = token;
	const wrapperCls = `${checkboxCls}-wrapper`;
	return [
		{
			[`${checkboxCls}-group`]: Object.assign(Object.assign({}, resetComponent(token)), {
				display: "inline-flex",
				flexWrap: "wrap",
				columnGap: token.marginXS,
				[`> ${token.antCls}-row`]: { flex: 1 }
			}),
			[wrapperCls]: Object.assign(Object.assign({}, resetComponent(token)), {
				display: "inline-flex",
				alignItems: "baseline",
				cursor: "pointer",
				"&:after": {
					display: "inline-block",
					width: 0,
					overflow: "hidden",
					content: "'\\a0'"
				},
				[`& + ${wrapperCls}`]: { marginInlineStart: 0 },
				[`&${wrapperCls}-in-form-item`]: { "input[type=\"checkbox\"]": {
					width: 14,
					height: 14
				} }
			}),
			[checkboxCls]: Object.assign(Object.assign({}, resetComponent(token)), {
				position: "relative",
				whiteSpace: "nowrap",
				lineHeight: 1,
				cursor: "pointer",
				borderRadius: token.borderRadiusSM,
				alignSelf: "center",
				[`${checkboxCls}-input`]: {
					position: "absolute",
					inset: 0,
					zIndex: 1,
					cursor: "pointer",
					opacity: 0,
					margin: 0,
					[`&:focus-visible + ${checkboxCls}-inner`]: genFocusOutline(token)
				},
				[`${checkboxCls}-inner`]: {
					boxSizing: "border-box",
					display: "block",
					width: token.checkboxSize,
					height: token.checkboxSize,
					direction: "ltr",
					backgroundColor: token.colorBgContainer,
					border: `${unit(token.lineWidth)} ${token.lineType} ${token.colorBorder}`,
					borderRadius: token.borderRadiusSM,
					borderCollapse: "separate",
					transition: `all ${token.motionDurationSlow}`,
					"&:after": {
						boxSizing: "border-box",
						position: "absolute",
						top: "50%",
						insetInlineStart: "25%",
						display: "table",
						width: token.calc(token.checkboxSize).div(14).mul(5).equal(),
						height: token.calc(token.checkboxSize).div(14).mul(8).equal(),
						border: `${unit(token.lineWidthBold)} solid ${token.colorWhite}`,
						borderTop: 0,
						borderInlineStart: 0,
						transform: "rotate(45deg) scale(0) translate(-50%,-50%)",
						opacity: 0,
						content: "\"\"",
						transition: `all ${token.motionDurationFast} ${token.motionEaseInBack}, opacity ${token.motionDurationFast}`
					}
				},
				"& + span": {
					paddingInlineStart: token.paddingXS,
					paddingInlineEnd: token.paddingXS
				}
			})
		},
		{
			[`
        ${wrapperCls}:not(${wrapperCls}-disabled),
        ${checkboxCls}:not(${checkboxCls}-disabled)
      `]: { [`&:hover ${checkboxCls}-inner`]: { borderColor: token.colorPrimary } },
			[`${wrapperCls}:not(${wrapperCls}-disabled)`]: {
				[`&:hover ${checkboxCls}-checked:not(${checkboxCls}-disabled) ${checkboxCls}-inner`]: {
					backgroundColor: token.colorPrimaryHover,
					borderColor: "transparent"
				},
				[`&:hover ${checkboxCls}-checked:not(${checkboxCls}-disabled):after`]: { borderColor: token.colorPrimaryHover }
			}
		},
		{
			[`${checkboxCls}-checked`]: { [`${checkboxCls}-inner`]: {
				backgroundColor: token.colorPrimary,
				borderColor: token.colorPrimary,
				"&:after": {
					opacity: 1,
					transform: "rotate(45deg) scale(1) translate(-50%,-50%)",
					transition: `all ${token.motionDurationMid} ${token.motionEaseOutBack} ${token.motionDurationFast}`
				}
			} },
			[`
        ${wrapperCls}-checked:not(${wrapperCls}-disabled),
        ${checkboxCls}-checked:not(${checkboxCls}-disabled)
      `]: { [`&:hover ${checkboxCls}-inner`]: {
				backgroundColor: token.colorPrimaryHover,
				borderColor: "transparent"
			} }
		},
		{ [checkboxCls]: { "&-indeterminate": { "&": {
			[`${checkboxCls}-inner`]: {
				backgroundColor: `${token.colorBgContainer}`,
				borderColor: `${token.colorBorder}`,
				"&:after": {
					top: "50%",
					insetInlineStart: "50%",
					width: token.calc(token.fontSizeLG).div(2).equal(),
					height: token.calc(token.fontSizeLG).div(2).equal(),
					backgroundColor: token.colorPrimary,
					border: 0,
					transform: "translate(-50%, -50%) scale(1)",
					opacity: 1,
					content: "\"\""
				}
			},
			[`&:hover ${checkboxCls}-inner`]: {
				backgroundColor: `${token.colorBgContainer}`,
				borderColor: `${token.colorPrimary}`
			}
		} } } },
		{
			[`${wrapperCls}-disabled`]: { cursor: "not-allowed" },
			[`${checkboxCls}-disabled`]: {
				[`&, ${checkboxCls}-input`]: {
					cursor: "not-allowed",
					pointerEvents: "none"
				},
				[`${checkboxCls}-inner`]: {
					background: token.colorBgContainerDisabled,
					borderColor: token.colorBorder,
					"&:after": { borderColor: token.colorTextDisabled }
				},
				"&:after": { display: "none" },
				"& + span": { color: token.colorTextDisabled },
				[`&${checkboxCls}-indeterminate ${checkboxCls}-inner::after`]: { background: token.colorTextDisabled }
			}
		}
	];
};
function getStyle(prefixCls, token) {
	return genCheckboxStyle(merge(token, {
		checkboxCls: `.${prefixCls}`,
		checkboxSize: token.controlInteractiveSize
	}));
}
var style_default = genStyleHooks("Checkbox", (token, { prefixCls }) => [getStyle(prefixCls, token)]);
//#endregion
//#region node_modules/antd/es/checkbox/GroupContext.js
var GroupContext = /*#__PURE__*/ import_react.createContext(null);
//#endregion
//#region node_modules/antd/es/checkbox/Checkbox.js
var __rest$1 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var InternalCheckbox = (props, ref) => {
	var _a;
	const { prefixCls: customizePrefixCls, className, rootClassName, children, indeterminate = false, style, onMouseEnter, onMouseLeave, skipGroup = false, disabled } = props, restProps = __rest$1(props, [
		"prefixCls",
		"className",
		"rootClassName",
		"children",
		"indeterminate",
		"style",
		"onMouseEnter",
		"onMouseLeave",
		"skipGroup",
		"disabled"
	]);
	const { getPrefixCls, direction, checkbox } = import_react.useContext(ConfigContext);
	const checkboxGroup = import_react.useContext(GroupContext);
	const { isFormItemInput } = import_react.useContext(FormItemInputContext);
	const contextDisabled = import_react.useContext(DisabledContext);
	const mergedDisabled = (_a = (checkboxGroup === null || checkboxGroup === void 0 ? void 0 : checkboxGroup.disabled) || disabled) !== null && _a !== void 0 ? _a : contextDisabled;
	const prevValue = import_react.useRef(restProps.value);
	const checkboxRef = import_react.useRef(null);
	const mergedRef = composeRef(ref, checkboxRef);
	devUseWarning("Checkbox")("checked" in restProps || !!checkboxGroup || !("value" in restProps), "usage", "`value` is not a valid prop, do you mean `checked`?");
	import_react.useEffect(() => {
		checkboxGroup === null || checkboxGroup === void 0 || checkboxGroup.registerValue(restProps.value);
	}, []);
	import_react.useEffect(() => {
		if (skipGroup) return;
		if (restProps.value !== prevValue.current) {
			checkboxGroup === null || checkboxGroup === void 0 || checkboxGroup.cancelValue(prevValue.current);
			checkboxGroup === null || checkboxGroup === void 0 || checkboxGroup.registerValue(restProps.value);
			prevValue.current = restProps.value;
		}
		return () => checkboxGroup === null || checkboxGroup === void 0 ? void 0 : checkboxGroup.cancelValue(restProps.value);
	}, [restProps.value]);
	import_react.useEffect(() => {
		var _a;
		if ((_a = checkboxRef.current) === null || _a === void 0 ? void 0 : _a.input) checkboxRef.current.input.indeterminate = indeterminate;
	}, [indeterminate]);
	const prefixCls = getPrefixCls("checkbox", customizePrefixCls);
	const rootCls = useCSSVarCls(prefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default(prefixCls, rootCls);
	const checkboxProps = Object.assign({}, restProps);
	if (checkboxGroup && !skipGroup) {
		checkboxProps.onChange = (...args) => {
			if (restProps.onChange) restProps.onChange.apply(restProps, args);
			if (checkboxGroup.toggleOption) checkboxGroup.toggleOption({
				label: children,
				value: restProps.value
			});
		};
		checkboxProps.name = checkboxGroup.name;
		checkboxProps.checked = checkboxGroup.value.includes(restProps.value);
	}
	const classString = (0, import_classnames.default)(`${prefixCls}-wrapper`, {
		[`${prefixCls}-rtl`]: direction === "rtl",
		[`${prefixCls}-wrapper-checked`]: checkboxProps.checked,
		[`${prefixCls}-wrapper-disabled`]: mergedDisabled,
		[`${prefixCls}-wrapper-in-form-item`]: isFormItemInput
	}, checkbox === null || checkbox === void 0 ? void 0 : checkbox.className, className, rootClassName, cssVarCls, rootCls, hashId);
	const checkboxClass = (0, import_classnames.default)({ [`${prefixCls}-indeterminate`]: indeterminate }, TARGET_CLS, hashId);
	const [onLabelClick, onInputClick] = useBubbleLock(checkboxProps.onClick);
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement(Wave, {
		component: "Checkbox",
		disabled: mergedDisabled
	}, /*#__PURE__*/ import_react.createElement("label", {
		className: classString,
		style: Object.assign(Object.assign({}, checkbox === null || checkbox === void 0 ? void 0 : checkbox.style), style),
		onMouseEnter,
		onMouseLeave,
		onClick: onLabelClick
	}, /*#__PURE__*/ import_react.createElement(Checkbox$2, Object.assign({}, checkboxProps, {
		onClick: onInputClick,
		prefixCls,
		className: checkboxClass,
		disabled: mergedDisabled,
		ref: mergedRef
	})), children !== void 0 && children !== null && /*#__PURE__*/ import_react.createElement("span", { className: `${prefixCls}-label` }, children))));
};
var Checkbox$1 = /*#__PURE__*/ import_react.forwardRef(InternalCheckbox);
Checkbox$1.displayName = "Checkbox";
//#endregion
//#region node_modules/antd/es/checkbox/Group.js
init_toConsumableArray();
var __rest = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var CheckboxGroup = /*#__PURE__*/ import_react.forwardRef((props, ref) => {
	const { defaultValue, children, options = [], prefixCls: customizePrefixCls, className, rootClassName, style, onChange } = props, restProps = __rest(props, [
		"defaultValue",
		"children",
		"options",
		"prefixCls",
		"className",
		"rootClassName",
		"style",
		"onChange"
	]);
	const { getPrefixCls, direction } = import_react.useContext(ConfigContext);
	const [value, setValue] = import_react.useState(restProps.value || defaultValue || []);
	const [registeredValues, setRegisteredValues] = import_react.useState([]);
	import_react.useEffect(() => {
		if ("value" in restProps) setValue(restProps.value || []);
	}, [restProps.value]);
	const memoizedOptions = import_react.useMemo(() => options.map((option) => {
		if (typeof option === "string" || typeof option === "number") return {
			label: option,
			value: option
		};
		return option;
	}), [options]);
	const cancelValue = (val) => {
		setRegisteredValues((prevValues) => prevValues.filter((v) => v !== val));
	};
	const registerValue = (val) => {
		setRegisteredValues((prevValues) => [].concat(_toConsumableArray(prevValues), [val]));
	};
	const toggleOption = (option) => {
		const optionIndex = value.indexOf(option.value);
		const newValue = _toConsumableArray(value);
		if (optionIndex === -1) newValue.push(option.value);
		else newValue.splice(optionIndex, 1);
		if (!("value" in restProps)) setValue(newValue);
		onChange === null || onChange === void 0 || onChange(newValue.filter((val) => registeredValues.includes(val)).sort((a, b) => {
			return memoizedOptions.findIndex((opt) => opt.value === a) - memoizedOptions.findIndex((opt) => opt.value === b);
		}));
	};
	const prefixCls = getPrefixCls("checkbox", customizePrefixCls);
	const groupPrefixCls = `${prefixCls}-group`;
	const rootCls = useCSSVarCls(prefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default(prefixCls, rootCls);
	const domProps = omit(restProps, ["value", "disabled"]);
	const childrenNode = options.length ? memoizedOptions.map((option) => /*#__PURE__*/ import_react.createElement(Checkbox$1, {
		prefixCls,
		key: option.value.toString(),
		disabled: "disabled" in option ? option.disabled : restProps.disabled,
		value: option.value,
		checked: value.includes(option.value),
		onChange: option.onChange,
		className: (0, import_classnames.default)(`${groupPrefixCls}-item`, option.className),
		style: option.style,
		title: option.title,
		id: option.id,
		required: option.required
	}, option.label)) : children;
	const memoizedContext = import_react.useMemo(() => ({
		toggleOption,
		value,
		disabled: restProps.disabled,
		name: restProps.name,
		registerValue,
		cancelValue
	}), [
		toggleOption,
		value,
		restProps.disabled,
		restProps.name,
		registerValue,
		cancelValue
	]);
	const classString = (0, import_classnames.default)(groupPrefixCls, { [`${groupPrefixCls}-rtl`]: direction === "rtl" }, className, rootClassName, cssVarCls, rootCls, hashId);
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement("div", Object.assign({
		className: classString,
		style
	}, domProps, { ref }), /*#__PURE__*/ import_react.createElement(GroupContext.Provider, { value: memoizedContext }, childrenNode)));
});
//#endregion
//#region node_modules/antd/es/checkbox/index.js
var Checkbox = Checkbox$1;
Checkbox.Group = CheckboxGroup;
Checkbox.__ANT_CHECKBOX = true;
Checkbox.displayName = "Checkbox";
var Policy_module_default = {
	policy: "policy___aSL5F",
	checkbox: "checkbox___k7ZHc",
	policyText: "policyText___lND1s",
	likeLink: "likeLink___vgBIO"
};
//#endregion
//#region source-snapshot/src/component/Modal/index.js
var import_jsx_runtime = require_jsx_runtime();
document.body;
import_react.Component;
//#endregion
//#region source-snapshot/src/component/CRM/LoginCRM/components/Policy.js
var Policy = (props) => {
	const { t } = useTranslation();
	const { isPrivacyConfirm, changePrivacyConfirm } = props;
	const [policyContentVisible, setPolicyContentVisible] = (0, import_react.useState)(false);
	const [policyContentUrl, setPolicyContentUrl] = (0, import_react.useState)("");
	const openPolicyTab = async (url) => {
		setPolicyContentUrl(url);
		setPolicyContentVisible(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: Policy_module_default.policy,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
				rootClassName: Policy_module_default.checkbox,
				checked: isPrivacyConfirm,
				onClick: () => changePrivacyConfirm(!isPrivacyConfirm)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: Policy_module_default.policyText,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [" ", t("termOfPolicy0")] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: Policy_module_default.likeLink,
						onClick: () => openPolicyTab("https://order.mealkeyway.com/dashboard/release/index#/servicesagreement"),
						children: t("termOfPolicy1")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [" ", t("termOfPolicy2")] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: Policy_module_default.likeLink,
						onClick: () => openPolicyTab("https://order.mealkeyway.com/dashboard/release/index#/privacypolicy"),
						children: t("termOfPolicy3")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: policyContentVisible,
				isMountOnBody: true,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolicyContent, {
					url: policyContentUrl,
					t,
					onClose: () => setPolicyContentVisible(false)
				}),
				onClose: () => setPolicyContentVisible(false)
			})
		]
	});
};
//#endregion
//#region source-snapshot/src/assets/images/jingleBell.png
var jingleBell_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAB2CAMAAAAJIsb2AAAAsVBMVEX/tgAAAADyvTO/1///tQD/tgD/qgD/tQD/tgD/tgD/twD/tQD/tgD/tQD/uAD5uRf9twb/tgD/twDnwl7/tgD/tgD/twD/uAC/1v/0vC7/tQH2vCjhxXb3uiK/1f//tQD/tQDbyI34uRy/1/+/1///tgD/tQD8tw6/1f//tgC/1v+/2P+/1f+/1f/UzKfOz8O/1f/RzbXG0+DswEjlxGrzvDDD1e//tgC/2P//tQDL0tYCLeMIAAAAO3RSTlO/AO+/77MMGKePXzB3y1PTxYNr40ebJDtg6cLj3d0w5t/X17OnVNnLDNSPdEUb0ctUzsXp4M7CpJtTShcfACQAAAN6SURBVGjevNhJiuswFEDRW1DqbRMbN5BJMgpkBZ+//43VpAKRJXfxU92Z0ODw9Gbi6w86jhhjorM8EpwClOuTGzFkHHhlQ3QjhzS8579KIBNxTQHEKGaN8kjFPCeOGNKCNNKT5qWRlrRWGnGk2RLI9VL/dimBjD3323fU7f78p8UQ3TgFj++0O0MXjiJ5AQDqDFIDWG/OIdorXt0S48Zv1QbDLiI/yhMS5igSLFGPZCNv2eYjxDPvHj/WlajKHEa0IyqZ5TEzwJqDiLHkutxfY9SkqXEb2TaAa/18POsrkFUOIHrgWKmyjVR8mjV7Ec/nDTsRw5m6fYjlVGEP0nAuuwMxlpP5baTjbEpvIYbz+S3kP0iPkiIWgfw60iORWkdaRApriEEmt4b0yKT0CuIQql9BkMotIwGplF5EOsQKi8iAWN0SopHLLiEBwfQC4hFsWkBaBOsWEItgLo9oJFN5JCDamEUaROuzSIdoXRZxiOayiEI0lUM0wpkMMiLclEEmhGsyiEe4KoNUCDdkEIdwKoMopNMJohEvJMiIeE2CTIjXJYhHvDZBWsSzCeKQT88RhXxhhmgK1MyQQIGqGdJQoGGGtBRIzZCBEo0RoilSEyETRaoipKNIKkIGyjS+IYYDXQ4vhSOfBJefVs1tN0EgCMOzGE6LyYqlYRHcRIFoVDz1kKbv/2C1oTE2qzsTh++Smy8zPxnI7qh54f1SloqminsJeTrOVOndUijyjARqt5RnQdHIq2SMN6qvwtJMSJMFSGebK8+CWkzyJ5H0Vtksseh7SeijDhcKLwXwRCaemxU4iQIB6JdkViASLP2pgBAQ5h5GiTUMSM3iNSwGfiF4KeCjhbBLiUDiry/OHFxkEETgoiRJCvf4AhG6op95NCaP42j7sZJFyNDCUY8UMrh+T/L0iUjwCRa3wb//rjBLfbBZEiV28n5vsA8629gfRBKN28R53ZTL9NV/WhKl0zYJaBfMQZLLaRpHVMnbRzqWWR4GTy1ifJ8Ph9N+sVhUVfX+ckN14fJ4vz8dzp+jkeZse5gRjR1HsiZKOo5EbEiORrAkmiTZ4hJ+vwwq4ffrSzAlhvJucSViS0iELVk3iKPu+BJh8GbxJeLodOiB1uE07uBLxLF+5DgOuNjX3U+/McOuKGpbU+v10Auw3a5BFbgEx+hN3Qs2WyPo/ABJpUJA9IoZpwAAAABJRU5ErkJggg==";
//#endregion
export { Policy as n, jingleBell_default as t };
