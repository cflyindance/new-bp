import { d as __toESM, i as require_react, n as require_jsx_runtime, o as __commonJSMin } from "./toast-C8a1ReSo.js";
import { $ as homeHash, G as require_dayjs_min } from "./utils-Cdx9DbDR.js";
import { da as require_cloneDeep, mr as getDishItemLanguage, pr as getCurrentItemLanguage } from "./actions-BwRPwnFF.js";
import { x as getRestaurantHour } from "./kioskConfigApi-68IKDHob.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { A as unit, O as useLayoutEffect, m as ConfigContext, u as useToken } from "./style-DWrLyeCr.js";
import { n as genStyleHooks, r as merge } from "./genStyleUtils-Bvib8P-r.js";
import { t as backHomeModal_default } from "./backHomeModal-p8XgRZSA.js";
import { t as IMG_HOST } from "./getImageHost-CiGAQi_-.js";
import { t as getBsTime } from "./getBsTime-BcqvbwVB.js";
//#region node_modules/antd/es/grid/style/index.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var genGridRowStyle = (token) => {
	const { componentCls } = token;
	return { [componentCls]: {
		display: "flex",
		flexFlow: "row wrap",
		minWidth: 0,
		"&::before, &::after": { display: "flex" },
		"&-no-wrap": { flexWrap: "nowrap" },
		"&-start": { justifyContent: "flex-start" },
		"&-center": { justifyContent: "center" },
		"&-end": { justifyContent: "flex-end" },
		"&-space-between": { justifyContent: "space-between" },
		"&-space-around": { justifyContent: "space-around" },
		"&-space-evenly": { justifyContent: "space-evenly" },
		"&-top": { alignItems: "flex-start" },
		"&-middle": { alignItems: "center" },
		"&-bottom": { alignItems: "flex-end" }
	} };
};
var genGridColStyle = (token) => {
	const { componentCls } = token;
	return { [componentCls]: {
		position: "relative",
		maxWidth: "100%",
		minHeight: 1
	} };
};
var genLoopGridColumnsStyle = (token, sizeCls) => {
	const { prefixCls, componentCls, gridColumns } = token;
	const gridColumnsStyle = {};
	for (let i = gridColumns; i >= 0; i--) if (i === 0) {
		gridColumnsStyle[`${componentCls}${sizeCls}-${i}`] = { display: "none" };
		gridColumnsStyle[`${componentCls}-push-${i}`] = { insetInlineStart: "auto" };
		gridColumnsStyle[`${componentCls}-pull-${i}`] = { insetInlineEnd: "auto" };
		gridColumnsStyle[`${componentCls}${sizeCls}-push-${i}`] = { insetInlineStart: "auto" };
		gridColumnsStyle[`${componentCls}${sizeCls}-pull-${i}`] = { insetInlineEnd: "auto" };
		gridColumnsStyle[`${componentCls}${sizeCls}-offset-${i}`] = { marginInlineStart: 0 };
		gridColumnsStyle[`${componentCls}${sizeCls}-order-${i}`] = { order: 0 };
	} else {
		gridColumnsStyle[`${componentCls}${sizeCls}-${i}`] = [{
			["--ant-display"]: "block",
			display: "block"
		}, {
			display: "var(--ant-display)",
			flex: `0 0 ${i / gridColumns * 100}%`,
			maxWidth: `${i / gridColumns * 100}%`
		}];
		gridColumnsStyle[`${componentCls}${sizeCls}-push-${i}`] = { insetInlineStart: `${i / gridColumns * 100}%` };
		gridColumnsStyle[`${componentCls}${sizeCls}-pull-${i}`] = { insetInlineEnd: `${i / gridColumns * 100}%` };
		gridColumnsStyle[`${componentCls}${sizeCls}-offset-${i}`] = { marginInlineStart: `${i / gridColumns * 100}%` };
		gridColumnsStyle[`${componentCls}${sizeCls}-order-${i}`] = { order: i };
	}
	gridColumnsStyle[`${componentCls}${sizeCls}-flex`] = { flex: `var(--${prefixCls}${sizeCls}-flex)` };
	return gridColumnsStyle;
};
var genGridStyle = (token, sizeCls) => genLoopGridColumnsStyle(token, sizeCls);
var genGridMediaStyle = (token, screenSize, sizeCls) => ({ [`@media (min-width: ${unit(screenSize)})`]: Object.assign({}, genGridStyle(token, sizeCls)) });
var prepareRowComponentToken = () => ({});
var prepareColComponentToken = () => ({});
var useRowStyle = genStyleHooks("Grid", genGridRowStyle, prepareRowComponentToken);
var getMediaSize = (token) => {
	return {
		xs: token.screenXSMin,
		sm: token.screenSMMin,
		md: token.screenMDMin,
		lg: token.screenLGMin,
		xl: token.screenXLMin,
		xxl: token.screenXXLMin
	};
};
var useColStyle = genStyleHooks("Grid", (token) => {
	const gridToken = merge(token, { gridColumns: 24 });
	const gridMediaSizesMap = getMediaSize(gridToken);
	delete gridMediaSizesMap.xs;
	return [
		genGridColStyle(gridToken),
		genGridStyle(gridToken, ""),
		genGridStyle(gridToken, "-xs"),
		Object.keys(gridMediaSizesMap).map((key) => genGridMediaStyle(gridToken, gridMediaSizesMap[key], `-${key}`)).reduce((pre, cur) => Object.assign(Object.assign({}, pre), cur), {})
	];
}, prepareColComponentToken);
//#endregion
//#region node_modules/antd/es/_util/mediaQueryUtil.js
var addMediaQueryListener = (mql, handler) => {
	if (typeof (mql === null || mql === void 0 ? void 0 : mql.addEventListener) !== "undefined") mql.addEventListener("change", handler);
	else if (typeof (mql === null || mql === void 0 ? void 0 : mql.addListener) !== "undefined") mql.addListener(handler);
};
var removeMediaQueryListener = (mql, handler) => {
	if (typeof (mql === null || mql === void 0 ? void 0 : mql.removeEventListener) !== "undefined") mql.removeEventListener("change", handler);
	else if (typeof (mql === null || mql === void 0 ? void 0 : mql.removeListener) !== "undefined") mql.removeListener(handler);
};
//#endregion
//#region node_modules/antd/es/_util/responsiveObserver.js
var responsiveArray = [
	"xxl",
	"xl",
	"lg",
	"md",
	"sm",
	"xs"
];
var getResponsiveMap = (token) => ({
	xs: `(max-width: ${token.screenXSMax}px)`,
	sm: `(min-width: ${token.screenSM}px)`,
	md: `(min-width: ${token.screenMD}px)`,
	lg: `(min-width: ${token.screenLG}px)`,
	xl: `(min-width: ${token.screenXL}px)`,
	xxl: `(min-width: ${token.screenXXL}px)`
});
/**
* Ensures that the breakpoints token are valid, in good order
* For each breakpoint : screenMin <= screen <= screenMax and screenMax <= nextScreenMin
*/
var validateBreakpoints = (token) => {
	const indexableToken = token;
	const revBreakpoints = [].concat(responsiveArray).reverse();
	revBreakpoints.forEach((breakpoint, i) => {
		const breakpointUpper = breakpoint.toUpperCase();
		const screenMin = `screen${breakpointUpper}Min`;
		const screen = `screen${breakpointUpper}`;
		if (!(indexableToken[screenMin] <= indexableToken[screen])) throw new Error(`${screenMin}<=${screen} fails : !(${indexableToken[screenMin]}<=${indexableToken[screen]})`);
		if (i < revBreakpoints.length - 1) {
			const screenMax = `screen${breakpointUpper}Max`;
			if (!(indexableToken[screen] <= indexableToken[screenMax])) throw new Error(`${screen}<=${screenMax} fails : !(${indexableToken[screen]}<=${indexableToken[screenMax]})`);
			const nextScreenMin = `screen${revBreakpoints[i + 1].toUpperCase()}Min`;
			if (!(indexableToken[screenMax] <= indexableToken[nextScreenMin])) throw new Error(`${screenMax}<=${nextScreenMin} fails : !(${indexableToken[screenMax]}<=${indexableToken[nextScreenMin]})`);
		}
	});
	return token;
};
var useResponsiveObserver = () => {
	const [, token] = useToken();
	const responsiveMap = getResponsiveMap(validateBreakpoints(token));
	return import_react.useMemo(() => {
		const subscribers = /* @__PURE__ */ new Map();
		let subUid = -1;
		let screens = {};
		return {
			responsiveMap,
			matchHandlers: {},
			dispatch(pointMap) {
				screens = pointMap;
				subscribers.forEach((func) => func(screens));
				return subscribers.size >= 1;
			},
			subscribe(func) {
				if (!subscribers.size) this.register();
				subUid += 1;
				subscribers.set(subUid, func);
				func(screens);
				return subUid;
			},
			unsubscribe(paramToken) {
				subscribers.delete(paramToken);
				if (!subscribers.size) this.unregister();
			},
			register() {
				Object.entries(responsiveMap).forEach(([screen, mediaQuery]) => {
					const listener = ({ matches }) => {
						this.dispatch(Object.assign(Object.assign({}, screens), { [screen]: matches }));
					};
					const mql = window.matchMedia(mediaQuery);
					addMediaQueryListener(mql, listener);
					this.matchHandlers[mediaQuery] = {
						mql,
						listener
					};
					listener(mql);
				});
			},
			unregister() {
				Object.values(responsiveMap).forEach((mediaQuery) => {
					const handler = this.matchHandlers[mediaQuery];
					removeMediaQueryListener(handler === null || handler === void 0 ? void 0 : handler.mql, handler === null || handler === void 0 ? void 0 : handler.listener);
				});
				subscribers.clear();
			}
		};
	}, [token]);
};
//#endregion
//#region node_modules/antd/es/_util/hooks/useForceUpdate.js
function useForceUpdate() {
	const [, forceUpdate] = import_react.useReducer((x) => x + 1, 0);
	return forceUpdate;
}
//#endregion
//#region node_modules/antd/es/grid/hooks/useBreakpoint.js
function useBreakpoint(refreshOnChange = true, defaultScreens = {}) {
	const screensRef = (0, import_react.useRef)(defaultScreens);
	const forceUpdate = useForceUpdate();
	const responsiveObserver = useResponsiveObserver();
	useLayoutEffect(() => {
		const token = responsiveObserver.subscribe((supportScreens) => {
			screensRef.current = supportScreens;
			if (refreshOnChange) forceUpdate();
		});
		return () => responsiveObserver.unsubscribe(token);
	}, []);
	return screensRef.current;
}
//#endregion
//#region node_modules/antd/es/grid/RowContext.js
var RowContext = /*#__PURE__*/ (0, import_react.createContext)({});
//#endregion
//#region node_modules/antd/es/grid/col.js
var __rest$1 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
function parseFlex(flex) {
	if (typeof flex === "number") return `${flex} ${flex} auto`;
	if (/^\d+(\.\d+)?(px|em|rem|%)$/.test(flex)) return `0 0 ${flex}`;
	return flex;
}
var sizes = [
	"xs",
	"sm",
	"md",
	"lg",
	"xl",
	"xxl"
];
var Col = /*#__PURE__*/ import_react.forwardRef((props, ref) => {
	const { getPrefixCls, direction } = import_react.useContext(ConfigContext);
	const { gutter, wrap } = import_react.useContext(RowContext);
	const { prefixCls: customizePrefixCls, span, order, offset, push, pull, className, children, flex, style } = props, others = __rest$1(props, [
		"prefixCls",
		"span",
		"order",
		"offset",
		"push",
		"pull",
		"className",
		"children",
		"flex",
		"style"
	]);
	const prefixCls = getPrefixCls("col", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = useColStyle(prefixCls);
	const sizeStyle = {};
	let sizeClassObj = {};
	sizes.forEach((size) => {
		let sizeProps = {};
		const propSize = props[size];
		if (typeof propSize === "number") sizeProps.span = propSize;
		else if (typeof propSize === "object") sizeProps = propSize || {};
		delete others[size];
		sizeClassObj = Object.assign(Object.assign({}, sizeClassObj), {
			[`${prefixCls}-${size}-${sizeProps.span}`]: sizeProps.span !== void 0,
			[`${prefixCls}-${size}-order-${sizeProps.order}`]: sizeProps.order || sizeProps.order === 0,
			[`${prefixCls}-${size}-offset-${sizeProps.offset}`]: sizeProps.offset || sizeProps.offset === 0,
			[`${prefixCls}-${size}-push-${sizeProps.push}`]: sizeProps.push || sizeProps.push === 0,
			[`${prefixCls}-${size}-pull-${sizeProps.pull}`]: sizeProps.pull || sizeProps.pull === 0,
			[`${prefixCls}-rtl`]: direction === "rtl"
		});
		if (sizeProps.flex) {
			sizeClassObj[`${prefixCls}-${size}-flex`] = true;
			sizeStyle[`--${prefixCls}-${size}-flex`] = parseFlex(sizeProps.flex);
		}
	});
	const classes = (0, import_classnames.default)(prefixCls, {
		[`${prefixCls}-${span}`]: span !== void 0,
		[`${prefixCls}-order-${order}`]: order,
		[`${prefixCls}-offset-${offset}`]: offset,
		[`${prefixCls}-push-${push}`]: push,
		[`${prefixCls}-pull-${pull}`]: pull
	}, className, sizeClassObj, hashId, cssVarCls);
	const mergedStyle = {};
	if (gutter && gutter[0] > 0) {
		const horizontalGutter = gutter[0] / 2;
		mergedStyle.paddingLeft = horizontalGutter;
		mergedStyle.paddingRight = horizontalGutter;
	}
	if (flex) {
		mergedStyle.flex = parseFlex(flex);
		if (wrap === false && !mergedStyle.minWidth) mergedStyle.minWidth = 0;
	}
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement("div", Object.assign({}, others, {
		style: Object.assign(Object.assign(Object.assign({}, mergedStyle), style), sizeStyle),
		className: classes,
		ref
	}), children));
});
Col.displayName = "Col";
//#endregion
//#region node_modules/antd/es/grid/hooks/useGutter.js
function useGutter(gutter, screens) {
	const results = [void 0, void 0];
	const normalizedGutter = Array.isArray(gutter) ? gutter : [gutter, void 0];
	const mergedScreens = screens || {
		xs: true,
		sm: true,
		md: true,
		lg: true,
		xl: true,
		xxl: true
	};
	normalizedGutter.forEach((g, index) => {
		if (typeof g === "object" && g !== null) for (let i = 0; i < responsiveArray.length; i++) {
			const breakpoint = responsiveArray[i];
			if (mergedScreens[breakpoint] && g[breakpoint] !== void 0) {
				results[index] = g[breakpoint];
				break;
			}
		}
		else results[index] = g;
	});
	return results;
}
//#endregion
//#region node_modules/antd/es/grid/row.js
var __rest = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
function useMergedPropByScreen(oriProp, screen) {
	const [prop, setProp] = import_react.useState(typeof oriProp === "string" ? oriProp : "");
	const calcMergedAlignOrJustify = () => {
		if (typeof oriProp === "string") setProp(oriProp);
		if (typeof oriProp !== "object") return;
		for (let i = 0; i < responsiveArray.length; i++) {
			const breakpoint = responsiveArray[i];
			if (!screen || !screen[breakpoint]) continue;
			const curVal = oriProp[breakpoint];
			if (curVal !== void 0) {
				setProp(curVal);
				return;
			}
		}
	};
	import_react.useEffect(() => {
		calcMergedAlignOrJustify();
	}, [JSON.stringify(oriProp), screen]);
	return prop;
}
var Row = /*#__PURE__*/ import_react.forwardRef((props, ref) => {
	const { prefixCls: customizePrefixCls, justify, align, className, style, children, gutter = 0, wrap } = props, others = __rest(props, [
		"prefixCls",
		"justify",
		"align",
		"className",
		"style",
		"children",
		"gutter",
		"wrap"
	]);
	const { getPrefixCls, direction } = import_react.useContext(ConfigContext);
	const screens = useBreakpoint(true, null);
	const mergedAlign = useMergedPropByScreen(align, screens);
	const mergedJustify = useMergedPropByScreen(justify, screens);
	const prefixCls = getPrefixCls("row", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = useRowStyle(prefixCls);
	const gutters = useGutter(gutter, screens);
	const classes = (0, import_classnames.default)(prefixCls, {
		[`${prefixCls}-no-wrap`]: wrap === false,
		[`${prefixCls}-${mergedJustify}`]: mergedJustify,
		[`${prefixCls}-${mergedAlign}`]: mergedAlign,
		[`${prefixCls}-rtl`]: direction === "rtl"
	}, className, hashId, cssVarCls);
	const rowStyle = {};
	const horizontalGutter = gutters[0] != null && gutters[0] > 0 ? gutters[0] / -2 : void 0;
	if (horizontalGutter) {
		rowStyle.marginLeft = horizontalGutter;
		rowStyle.marginRight = horizontalGutter;
	}
	const [gutterH, gutterV] = gutters;
	rowStyle.rowGap = gutterV;
	const rowContext = import_react.useMemo(() => ({
		gutter: [gutterH, gutterV],
		wrap
	}), [
		gutterH,
		gutterV,
		wrap
	]);
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement(RowContext.Provider, { value: rowContext }, /*#__PURE__*/ import_react.createElement("div", Object.assign({}, others, {
		className: classes,
		style: Object.assign(Object.assign({}, rowStyle), style),
		ref
	}), children)));
});
Row.displayName = "Row";
//#endregion
//#region node_modules/antd/es/col/index.js
var col_default = Col;
//#endregion
//#region node_modules/antd/es/row/index.js
var row_default = Row;
var BrandList_module_default = {
	brandList: "brandList___ZzGCt",
	cancel: "cancel___ztOP5"
};
//#endregion
//#region node_modules/dayjs/plugin/isBetween.js
var require_isBetween = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(e, i) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = i() : "function" == typeof define && define.amd ? define(i) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_isBetween = i();
	})(exports, (function() {
		"use strict";
		return function(e, i, t) {
			i.prototype.isBetween = function(e, i, s, f) {
				var n = t(e), o = t(i), r = "(" === (f = f || "()")[0], u = ")" === f[1];
				return (r ? this.isAfter(n, s) : !this.isBefore(n, s)) && (u ? this.isBefore(o, s) : !this.isAfter(o, s)) || (r ? this.isBefore(n, s) : !this.isAfter(n, s)) && (u ? this.isAfter(o, s) : !this.isBefore(o, s));
			};
		};
	}));
}));
//#endregion
//#region source-snapshot/src/component/Modal/ModalHeader.js
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min());
var import_isBetween = /* @__PURE__ */ __toESM(require_isBetween());
var import_jsx_runtime = require_jsx_runtime();
var BrandListContent_module_default = {
	mainWrapper: "mainWrapper___vTWYR",
	mainRow: "mainRow___DCMWW",
	brandItem: "brandItem___Cxbln",
	imageWrapper: "imageWrapper___pyWeh",
	brandImage: "brandImage___-hMFO",
	noDishIds: "noDishIds___EXTgx",
	brandName: "brandName___w8vuN",
	noBrand: "noBrand___oyFFO",
	showNoBrand: "showNoBrand___qgwdY",
	noBrandImg: "noBrandImg___58YVT",
	noBrandText: "noBrandText___3WrPS"
};
//#endregion
//#region source-snapshot/src/assets/images/sushi.jpg
var sushi_default = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwkHBgoJCAkLCwoMDxkQDw4ODx4WFxIZJCAmJSMgIyIoLTkwKCo2KyIjMkQyNjs9QEBAJjBGS0U+Sjk/QD3/2wBDAQsLCw8NDx0QEB09KSMpPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT3/wgARCABkAKADAREAAhEBAxEB/8QAGgABAAMBAQEAAAAAAAAAAAAAAAECAwQFB//EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAPpAAAAAAAAAAAAAALFgDMAAAAAAAHsmRJc4jkAAAAAAAPVMCxqc5xAAAAAAAHqmhzlCpxgAAAAAAHsmZmaHOcQAAAAAABuaAHMVAAAAAJJKgkgkEFiCSCAADc1JKgzNzE2JMC5BsVOYyABuXNCpUoaGpmSWKGhUxNDjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//8QANxAAAgEDAQMICAUFAAAAAAAAAQIDAAQRMRIhURATIkBBcYGRBRQVMDI0krEgI0JSYSRQU8HR/9oACAEBAAE/AOuKjv8AArN3VzMn+J/prmZf2SfTRhkA+B/p6jGqQQ4GAoqed0ClANg/q1oC4AyHRv4IxUUwkJUgq41Br0hGqyIw1bOeoT9N0i7D0m7hWy95Ic5SJTpUU3M3DRvJlewsauAObEyarvB/ivSJBEZHA9Qk6N1E3EFamDmIiIgNXMw2sBMmGJHn3VGGSwYNq5wo769IDAiXgOoOgmiwdDgg0JZId0ylgNGUfepHhmkD7Dsy9gXWkiZ5BJNgY+FeFektYx39Qiu5Il2VOQONe0ZuCeRr2jNwTyNe0ZeC+Rp3Z22nOT7oAnTJJ5CCutBHcdFWPIAScLQUkkKOTZIGhFAEg6nkVHcdFGNYOnbWw/7GpVL6AmipXXI/DY/Np4/Y1eRq68+mhOGqZBLdwqdCg/3U144lKxkKqnGKuMS2yT4AfOy1WPzaeP2NWRCyTsdBUlvi85saMcjuq+KmFMaBiPLdVqFigUPrMahgzeGNtBrTXUzSlYAQq6ALSGRryNpgQd2q441KbsSPsZ2OzSoS/qX9Pjbz0uNTySuQsucr4fhsfm08fsagmCTOj70Y4INXDiG+iPYE/wC1LZvJIzxFSj785qcrFAkAIZgctVj82nj9jUPw3XdUcqm2E/61XY8a2DLaQLxcg+Zqa8ZJSiIhVdwJp3CzRXOiuMNRtpVlLwMCraENUmfW7cHUDfU1vcvI5RuiTu6VRW0xVXjI38G0q9P5cauQZB8XuAT7gE8oJ/tn/8QAFBEBAAAAAAAAAAAAAAAAAAAAgP/aAAgBAgEBPwACf//EABQRAQAAAAAAAAAAAAAAAAAAAID/2gAIAQMBAT8AAn//2Q==";
//#endregion
//#region source-snapshot/src/assets/images/no_brand.png
var no_brand_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJIAAACEBAMAAACJ2m87AAAAJ1BMVEUAAACVJi6WJy+XKDCWJi6WJy+XJi+VJi+WJDKWJy+VJi+VJi+WJy9chK2RAAAADHRSTlMAgL8gX9+fnxJ37zxGsIvaAAAAl0lEQVRo3u3WKw6EMBRG4Ztx42a2MBmFBINEsAAMu8CDZwesiIekiyIpCddREpqUwDny5s8nm4rxUS8iSEhIAaTSR4UQERER0S3KfZRd9e+LhIR0VPr66CNE9Mzeta05L72MbUJCQkJCCiz9nP113G3HaJVGnYlxNqhU7cyQkJACSImzVKV2O8bGNuvski8dEhISEtJhaQEV3V8d6iVH3AAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/utils/detectLanguageChange.js
/**
* 检测文本中的语言变化并在语言切换处添加换行符
* @param {string} text - 需要处理的文本
* @returns {string} - 处理后的文本，在语言变化处添加了换行符
*/
var detectLanguageChange = (text) => {
	if (!text || typeof text !== "string") return text || "";
	const isChinese = (char) => {
		return /[\u4e00-\u9fff]/.test(char);
	};
	const isEnglish = (char) => {
		return /[a-zA-Z0-9\s\-_.,!?@#$%^&*()+=<>[\]{}|\\:";'~`]/.test(char);
	};
	let result = "";
	let currentLanguage = null;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		let charLanguage = null;
		if (isChinese(char)) charLanguage = "chinese";
		else if (isEnglish(char)) charLanguage = "english";
		if (charLanguage && currentLanguage && charLanguage !== currentLanguage) result += "\n";
		result += char;
		if (charLanguage) currentLanguage = charLanguage;
	}
	return result;
};
//#endregion
//#region source-snapshot/src/utils/handleBrandDisplayCol.js
var handleBrandDisplayCol = (selfConfig) => {
	const currentDeviceId = localStorage.getItem("deviceId");
	const brandDisplay = (selfConfig?.configList?.find((config) => config.id === 34)?.value?.find((device) => device.deviceId === currentDeviceId))?.brandDisplay;
	if (brandDisplay && [
		1,
		2,
		3
	].includes(brandDisplay)) return {
		useDefault: false,
		colSpan: Math.floor(24 / brandDisplay)
	};
	return { useDefault: true };
};
//#endregion
//#region source-snapshot/src/container/mainPage/components/BrandListContent.js
import_dayjs_min.default.extend(import_isBetween.default);
var WEEK_DAY = [
	"SUN",
	"MON",
	"TUE",
	"WED",
	"THU",
	"FRI",
	"SAT"
];
var BrandListContent = class extends import_react.Component {
	componentDidMount() {
		this.initBsHour();
	}
	state = {
		hourInfo: [],
		showModal: false
	};
	initBsHour = async () => {
		const res = await getRestaurantHour();
		if (res?.data?.msg === "success") {
			const { data } = res.data;
			const { hours } = data;
			const newHours = getBsTime(hours);
			this.setState({ hourInfo: newHours });
		}
	};
	checkIsInBsTime = (brandItem) => {
		const { bsTime = [] } = brandItem;
		const { hourInfo } = this.state;
		const day = WEEK_DAY[(0, import_dayjs_min.default)().day()];
		return hourInfo.filter((each) => bsTime.map((time) => time.id).includes(each.id)).find((each) => {
			if (each.bsDay.includes(day)) {
				const today = (0, import_dayjs_min.default)().format("YYYY/MM/DD");
				const tomorrow = (0, import_dayjs_min.default)().add(1, "day").format("YYYY/MM/DD");
				const { from, to } = each;
				const isOverFrom = Number(from.replaceAll(":", "")) >= Number(to.replaceAll(":", ""));
				return (0, import_dayjs_min.default)().isBetween(`${today} ${each.from}`, `${isOverFrom ? tomorrow : today} ${each.to}`, "minutes", "[)");
			}
			return false;
		});
	};
	renderBrandStatus = (brandItem) => {
		const { t, menuGroup } = this.props;
		const allSaleItems = [];
		menuGroup.forEach((g) => {
			g.menuCategories.forEach((c) => {
				if (c?.saleItems) allSaleItems.push(...c.saleItems);
			});
		});
		const isHasItem = allSaleItems.map((each) => each.id).filter((each) => brandItem?.dishIds?.includes(each));
		if (!brandItem.dishIds?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: BrandListContent_module_default.noDishIds,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("wait-config") })
		});
		if (!this.checkIsInBsTime(brandItem)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: BrandListContent_module_default.noDishIds,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("not-in-time") })
		});
		if (!isHasItem?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: BrandListContent_module_default.noDishIds,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("menu-not-in-time") })
		});
		return null;
	};
	handleSelectBrand = (brand) => {
		const { onSelectEffect } = this.props;
		if (!this.renderBrandStatus(brand)) onSelectEffect?.(brand);
	};
	render() {
		const { t, brandManage, selfConfig } = this.props;
		const colConfig = handleBrandDisplayCol(selfConfig);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: BrandListContent_module_default.mainWrapper,
			children: brandManage?.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(row_default, {
				className: BrandListContent_module_default.mainRow,
				gutter: 32,
				children: brandManage.map((each) => {
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(col_default, {
						className: BrandListContent_module_default.brandItem,
						...colConfig.useDefault ? {
							xs: 12,
							lg: 8,
							xl: 6
						} : { span: colConfig.colSpan },
						onClick: () => this.handleSelectBrand(each),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: BrandListContent_module_default.imageWrapper,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: BrandListContent_module_default.brandImage,
								src: each.imgSrc ? `${IMG_HOST}/${each.imgSrc}` : sushi_default,
								alt: "brand image",
								onError: (e) => {
									e.target.onerror = null;
									e.target.src = sushi_default;
								}
							}), this.renderBrandStatus(each)]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: BrandListContent_module_default.brandName,
							children: detectLanguageChange(each.name).split("\n").map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: line }, index))
						})]
					}, each.id);
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: BrandListContent_module_default.noBrand,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: BrandListContent_module_default.showNoBrand,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: BrandListContent_module_default.noBrandImg,
						src: no_brand_default,
						alt: "no brand"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: BrandListContent_module_default.noBrandText,
						children: t("no-config-data")
					})]
				})
			})
		});
	}
};
var BrandListContent_default = withTranslation()(BrandListContent);
//#endregion
//#region source-snapshot/src/container/mainPage/components/BrandList.js
import_dayjs_min.default.extend(import_isBetween.default);
var BrandList = class extends import_react.Component {
	state = {
		hourInfo: [],
		showModal: false
	};
	handleCloseBrandList = () => {
		const { onClose, GoBack } = this.props;
		onClose?.(false);
		if (!homeHash.includes(window.location.hash)) GoBack?.();
	};
	handleGoBack = () => {
		const { currentOrder } = this.props;
		if (!currentOrder?.itemList?.length) {
			this.handleCloseBrandList();
			return;
		}
		this.setState({ showModal: true });
	};
	handleContinue = () => {
		this.setState({ showModal: false });
		this.handleCloseBrandList();
	};
	handleCancel = () => {
		this.setState({ showModal: false });
	};
	render() {
		const { onClose, menuGroup, brandManage, t, showHomePage, selfConfig } = this.props;
		const { showModal } = this.state;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: BrandList_module_default.brandList,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandListContent_default, {
				menuGroup,
				brandManage,
				selfConfig,
				onSelectEffect: onClose
			}), (showHomePage || !homeHash.includes(window.location.hash)) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: BrandList_module_default.cancel,
				onClick: () => {
					onClose(false);
				},
				children: t("cancel")
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(backHomeModal_default, {
			isShowModal: showModal,
			handleContinue: this.handleContinue,
			handleCancel: this.handleCancel
		})] });
	}
};
var BrandList_default = withTranslation()(BrandList);
//#endregion
//#region source-snapshot/src/utils/getKioskMenu.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var resolveKioskMenu = (originMenu, comboMenu, language) => {
	const comboMenuIds = comboMenu.map((each) => each.saleItemId);
	return deepFilter(originMenu.filter((each) => each.name !== "Metadata Item Group").map((g) => {
		return {
			...g,
			_id: "group_" + g.id,
			name: getCurrentItemLanguage(g.fieldDisplayNameGroups, language) || g.name,
			selectable: false,
			children: g.menuCategories?.map((c) => {
				return {
					...c,
					_id: "category_" + c.id,
					name: getCurrentItemLanguage(c.fieldDisplayNameGroups, language) || c.name,
					selectable: false,
					children: c.saleItems?.filter((each) => !(comboMenuIds.includes(each.id) && each.itemPrices?.length > 0 && each.itemPrices.every((item) => item.type.toUpperCase() === "ALL"))).map((d) => {
						return {
							...d,
							_id: "dish_" + d.id,
							name: getDishItemLanguage(d.fieldDisplayNameGroups, language) || d.name
						};
					})
				};
			})
		};
	}));
};
var deepFilter = (list, deep = 1) => {
	return list?.filter((item) => {
		item.children = deepFilter(item.children, deep + 1);
		if (deep === 1 || deep === 2) return item?.children?.length > 0;
		return true;
	});
};
var handleGetBrandMenu = (menuGroup, dishIds, deep = 1) => {
	return (0, import_cloneDeep.default)(menuGroup).filter((item) => {
		if (item.menuCategories) item.menuCategories = handleGetBrandMenu(item.menuCategories, dishIds, deep + 1);
		if (item.saleItems) item.saleItems = handleGetBrandMenu(item.saleItems, dishIds, deep + 1);
		if (deep === 1) return item.menuCategories?.length > 0;
		if (deep === 2) return item?.saleItems?.length > 0;
		const id = item.isFreeItem ? item.oId : item.id;
		return dishIds.includes(id);
	});
};
var getKioskMenu_default = {
	resolveKioskMenu,
	handleGetBrandMenu
};
//#endregion
//#region source-snapshot/src/utils/bannerProAssets.js
var posterImagePromises = /* @__PURE__ */ new Map();
function getBannerProImageSrc(item, { serverIP = "", isDevelopment = true } = {}) {
	if (!item) return "";
	const basePath = isDevelopment ? "" : "kiosklite";
	const path = item.props?.imgUrl ? item.props.imgUrl : item.props?.defaultImg ? `${basePath}${item.props.defaultImg}` : "";
	return path ? `${serverIP}${path}` : "";
}
function getPosterPrimaryItem(children = []) {
	return children.find((item) => item?.component === "Page") || null;
}
function getUniquePosterImageUrls(children = [], imageSourceOptions) {
	return Array.from(new Set(children.map((item) => getBannerProImageSrc(item, imageSourceOptions)).filter(Boolean)));
}
function preloadPosterImage(url, { priority = "auto" } = {}) {
	if (!url) return Promise.resolve({
		status: "skipped",
		url
	});
	const cachedPromise = posterImagePromises.get(url);
	if (cachedPromise) return cachedPromise;
	const promise = new Promise((resolve) => {
		const image = new Image();
		if ("fetchPriority" in image) image.fetchPriority = priority;
		image.decoding = "async";
		image.onload = () => {
			posterImagePromises.delete(url);
			resolve({
				status: "loaded",
				url
			});
		};
		image.onerror = () => {
			posterImagePromises.delete(url);
			resolve({
				status: "error",
				url
			});
		};
		image.src = url;
	});
	posterImagePromises.set(url, promise);
	return promise;
}
function preloadPosterImagesWithConcurrency(urls, { concurrency = 2, priority = "low", onSettled, shouldContinue = () => true } = {}) {
	const queue = Array.from(new Set((urls || []).filter(Boolean)));
	if (!queue.length) return Promise.resolve([]);
	const results = new Array(queue.length);
	const limit = Math.max(1, Math.min(concurrency, queue.length));
	return new Promise((resolve) => {
		let nextIndex = 0;
		let completed = 0;
		const startNext = () => {
			if (!shouldContinue()) {
				resolve(results.filter(Boolean));
				return;
			}
			while (nextIndex < queue.length && nextIndex - completed < limit) {
				const index = nextIndex++;
				preloadPosterImage(queue[index], { priority }).then((result) => {
					results[index] = result;
					completed += 1;
					onSettled?.(result);
					if (completed === queue.length || !shouldContinue()) {
						resolve(results);
						return;
					}
					startNext();
				});
			}
		};
		startNext();
	});
}
function preloadPosterPrimaryImage(bannerPro, imageSourceOptions) {
	return preloadPosterImage(getBannerProImageSrc(getPosterPrimaryItem(bannerPro?.posterData?.[0]?.children || []), imageSourceOptions), { priority: "high" });
}
//#endregion
export { preloadPosterPrimaryImage as a, BrandListContent_default as c, preloadPosterImagesWithConcurrency as i, getPosterPrimaryItem as n, getKioskMenu_default as o, getUniquePosterImageUrls as r, BrandList_default as s, getBannerProImageSrc as t };
