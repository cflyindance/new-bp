import { d as __toESM, i as require_react, n as require_jsx_runtime, o as __commonJSMin, t as toast_default } from "./toast-C8a1ReSo.js";
import { H as EventBus, d as on, u as off } from "./utils-Cdx9DbDR.js";
import { d as useSelector, l as _extends, r as connect, t as useDispatch, u as init_extends } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { Di as getItemDisplayPrice, Ir as showInsufficientStockToast, Jr as isHasCRMCampaignFn, Lr as validateComboSubmitStock, M as getCurrentItem, Mr as getStockNumDisplayValue, Pr as isStockSufficient, Qi as Big, Rr as getItemStoppedStatus, Xi as v4, Yr as isHasPromotionFn, Zi as getItemPrice, _t as setActivityCurrentItem, cr as attachCategoryOptionsToItem, da as require_cloneDeep, gr as getItemSizeName, j as getCurrentCategory, jr as getRemainingStockNum, mr as getDishItemLanguage, pr as getCurrentItemLanguage, qi as GIFT_PROMOTION_TYPE, ra as observeLayoutSize, ri as filterPromotionThresholdItems, ta as getCardColumnStyle, wr as judgeHasDetailInfo } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { b as init_defineProperty, i as init_slicedToArray, n as init_objectWithoutProperties, r as _slicedToArray, t as _objectWithoutProperties, y as _defineProperty } from "./objectWithoutProperties-DDcNLcsK.js";
import { $ as warningOnce, A as unit, J as useComposeRef, L as canUseDom, O as useLayoutEffect$1, W as composeRef, X as _objectSpread2, _ as useComponentConfig, m as ConfigContext, p as useEvent, r as genFocusStyle } from "./style-DWrLyeCr.js";
import { i as omit } from "./context-LOicZ8vw.js";
import { i as localeValues, o as devUseWarning, t as es_default$1 } from "./es-CH_mXwwY.js";
import { a as useZIndex, c as pickAttrs, d as Keyframe, i as getTransitionName, l as RefIcon, n as es_default$2, o as zIndexContext, s as KeyCode, t as ContextIsolator, u as useLocale } from "./ContextIsolator-Dvyg17xX.js";
import { n as genStyleHooks, r as merge } from "./genStyleUtils-Bvib8P-r.js";
import { o as useCloseModalOnHomePage } from "./hooks-DiifsOH5.js";
import { t as changeCrmPromotionContraryInfo } from "./promotion-BUTvAW3c.js";
import { n as getPromotionCenterActivityRuleText } from "./getPromotionCenterDisplayText-Bfjuriuq.js";
import { i as VariableSizeList, r as DishTag, t as PromotionTagsWrap } from "./PromotionTagsWrap-CjrBw9bq.js";
import { a as getItemCardProperties, d as remToPx } from "./getItemCardProperties-CHuqwFqK.js";
import { n as imgCard_default } from "./star-C6iOuR53.js";
import { a as Counter, c as require_Remove, l as require_Add, u as Fab_default } from "./DescModal-Q1_miAgO.js";
import { t as orderDetailModal_default } from "./orderDetailModal-CXMeGrAX.js";
import { n as require_interopRequireWildcard, r as require_interopRequireDefault, t as require_createSvgIcon } from "./createSvgIcon-DxdaFuGn.js";
import { t as comboPanel_default } from "./comboPanel-D4O1jWqz.js";
import { t as handleCountRowNum } from "./handleCountRowNum-B73-PziM.js";
//#region node_modules/antd/es/_util/extendsObject.js
var import_react = /* @__PURE__ */ __toESM(require_react());
init_extends();
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
init_defineProperty();
init_slicedToArray();
init_objectWithoutProperties();
function mergeProps(...items) {
	const ret = {};
	items.forEach((item) => {
		if (item) Object.keys(item).forEach((key) => {
			if (item[key] !== void 0) ret[key] = item[key];
		});
	});
	return ret;
}
//#endregion
//#region node_modules/antd/es/_util/hooks/useClosable.js
function pickClosable(context) {
	if (!context) return;
	const { closable, closeIcon } = context;
	return {
		closable,
		closeIcon
	};
}
/** Convert `closable` and `closeIcon` to config object */
function useClosableConfig(closableCollection) {
	const { closable, closeIcon } = closableCollection || {};
	return import_react.useMemo(() => {
		if (!closable && (closable === false || closeIcon === false || closeIcon === null)) return false;
		if (closable === void 0 && closeIcon === void 0) return null;
		let closableConfig = { closeIcon: typeof closeIcon !== "boolean" && closeIcon !== null ? closeIcon : void 0 };
		if (closable && typeof closable === "object") closableConfig = Object.assign(Object.assign({}, closableConfig), closable);
		return closableConfig;
	}, [closable, closeIcon]);
}
/** Use same object to support `useMemo` optimization */
var EmptyFallbackCloseCollection = {};
function useClosable(propCloseCollection, contextCloseCollection, fallbackCloseCollection = EmptyFallbackCloseCollection) {
	const propCloseConfig = useClosableConfig(propCloseCollection);
	const contextCloseConfig = useClosableConfig(contextCloseCollection);
	const [contextLocale] = useLocale("global", localeValues.global);
	const closeBtnIsDisabled = typeof propCloseConfig !== "boolean" ? !!(propCloseConfig === null || propCloseConfig === void 0 ? void 0 : propCloseConfig.disabled) : false;
	const mergedFallbackCloseCollection = import_react.useMemo(() => Object.assign({ closeIcon: /*#__PURE__*/ import_react.createElement(RefIcon, null) }, fallbackCloseCollection), [fallbackCloseCollection]);
	const mergedClosableConfig = import_react.useMemo(() => {
		if (propCloseConfig === false) return false;
		if (propCloseConfig) return mergeProps(mergedFallbackCloseCollection, contextCloseConfig, propCloseConfig);
		if (contextCloseConfig === false) return false;
		if (contextCloseConfig) return mergeProps(mergedFallbackCloseCollection, contextCloseConfig);
		return !mergedFallbackCloseCollection.closable ? false : mergedFallbackCloseCollection;
	}, [
		propCloseConfig,
		contextCloseConfig,
		mergedFallbackCloseCollection
	]);
	return import_react.useMemo(() => {
		var _a, _b;
		if (mergedClosableConfig === false) return [
			false,
			null,
			closeBtnIsDisabled,
			{}
		];
		const { closeIconRender } = mergedFallbackCloseCollection;
		const { closeIcon } = mergedClosableConfig;
		let mergedCloseIcon = closeIcon;
		const ariaOrDataProps = pickAttrs(mergedClosableConfig, true);
		if (mergedCloseIcon !== null && mergedCloseIcon !== void 0) {
			if (closeIconRender) mergedCloseIcon = closeIconRender(closeIcon);
			mergedCloseIcon = /*#__PURE__*/ import_react.isValidElement(mergedCloseIcon) ? /*#__PURE__*/ import_react.cloneElement(mergedCloseIcon, Object.assign(Object.assign(Object.assign({}, mergedCloseIcon.props), { "aria-label": (_b = (_a = mergedCloseIcon.props) === null || _a === void 0 ? void 0 : _a["aria-label"]) !== null && _b !== void 0 ? _b : contextLocale.close }), ariaOrDataProps)) : /*#__PURE__*/ import_react.createElement("span", Object.assign({ "aria-label": contextLocale.close }, ariaOrDataProps), mergedCloseIcon);
		}
		return [
			true,
			mergedCloseIcon,
			closeBtnIsDisabled,
			ariaOrDataProps
		];
	}, [
		closeBtnIsDisabled,
		contextLocale.close,
		mergedClosableConfig,
		mergedFallbackCloseCollection
	]);
}
//#endregion
//#region node_modules/antd/es/skeleton/Element.js
var Element = (props) => {
	const { prefixCls, className, style, size, shape } = props;
	const sizeCls = (0, import_classnames.default)({
		[`${prefixCls}-lg`]: size === "large",
		[`${prefixCls}-sm`]: size === "small"
	});
	const shapeCls = (0, import_classnames.default)({
		[`${prefixCls}-circle`]: shape === "circle",
		[`${prefixCls}-square`]: shape === "square",
		[`${prefixCls}-round`]: shape === "round"
	});
	const sizeStyle = import_react.useMemo(() => typeof size === "number" ? {
		width: size,
		height: size,
		lineHeight: `${size}px`
	} : {}, [size]);
	return /*#__PURE__*/ import_react.createElement("span", {
		className: (0, import_classnames.default)(prefixCls, sizeCls, shapeCls, className),
		style: Object.assign(Object.assign({}, sizeStyle), style)
	});
};
//#endregion
//#region node_modules/antd/es/skeleton/style/index.js
var skeletonClsLoading = new Keyframe(`ant-skeleton-loading`, {
	"0%": { backgroundPosition: "100% 50%" },
	"100%": { backgroundPosition: "0 50%" }
});
var genSkeletonElementCommonSize = (size) => ({
	height: size,
	lineHeight: unit(size)
});
var genSkeletonElementAvatarSize = (size) => Object.assign({ width: size }, genSkeletonElementCommonSize(size));
var genSkeletonColor = (token) => ({
	background: token.skeletonLoadingBackground,
	backgroundSize: "400% 100%",
	animationName: skeletonClsLoading,
	animationDuration: token.skeletonLoadingMotionDuration,
	animationTimingFunction: "ease",
	animationIterationCount: "infinite"
});
var genSkeletonElementInputSize = (size, calc) => Object.assign({
	width: calc(size).mul(5).equal(),
	minWidth: calc(size).mul(5).equal()
}, genSkeletonElementCommonSize(size));
var genSkeletonElementAvatar = (token) => {
	const { skeletonAvatarCls, gradientFromColor, controlHeight, controlHeightLG, controlHeightSM } = token;
	return {
		[skeletonAvatarCls]: Object.assign({
			display: "inline-block",
			verticalAlign: "top",
			background: gradientFromColor
		}, genSkeletonElementAvatarSize(controlHeight)),
		[`${skeletonAvatarCls}${skeletonAvatarCls}-circle`]: { borderRadius: "50%" },
		[`${skeletonAvatarCls}${skeletonAvatarCls}-lg`]: Object.assign({}, genSkeletonElementAvatarSize(controlHeightLG)),
		[`${skeletonAvatarCls}${skeletonAvatarCls}-sm`]: Object.assign({}, genSkeletonElementAvatarSize(controlHeightSM))
	};
};
var genSkeletonElementInput = (token) => {
	const { controlHeight, borderRadiusSM, skeletonInputCls, controlHeightLG, controlHeightSM, gradientFromColor, calc } = token;
	return {
		[skeletonInputCls]: Object.assign({
			display: "inline-block",
			verticalAlign: "top",
			background: gradientFromColor,
			borderRadius: borderRadiusSM
		}, genSkeletonElementInputSize(controlHeight, calc)),
		[`${skeletonInputCls}-lg`]: Object.assign({}, genSkeletonElementInputSize(controlHeightLG, calc)),
		[`${skeletonInputCls}-sm`]: Object.assign({}, genSkeletonElementInputSize(controlHeightSM, calc))
	};
};
var genSkeletonElementImageSize = (size) => Object.assign({ width: size }, genSkeletonElementCommonSize(size));
var genSkeletonElementImage = (token) => {
	const { skeletonImageCls, imageSizeBase, gradientFromColor, borderRadiusSM, calc } = token;
	return {
		[skeletonImageCls]: Object.assign(Object.assign({
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			verticalAlign: "middle",
			background: gradientFromColor,
			borderRadius: borderRadiusSM
		}, genSkeletonElementImageSize(calc(imageSizeBase).mul(2).equal())), {
			[`${skeletonImageCls}-path`]: { fill: "#bfbfbf" },
			[`${skeletonImageCls}-svg`]: Object.assign(Object.assign({}, genSkeletonElementImageSize(imageSizeBase)), {
				maxWidth: calc(imageSizeBase).mul(4).equal(),
				maxHeight: calc(imageSizeBase).mul(4).equal()
			}),
			[`${skeletonImageCls}-svg${skeletonImageCls}-svg-circle`]: { borderRadius: "50%" }
		}),
		[`${skeletonImageCls}${skeletonImageCls}-circle`]: { borderRadius: "50%" }
	};
};
var genSkeletonElementButtonShape = (token, size, buttonCls) => {
	const { skeletonButtonCls } = token;
	return {
		[`${buttonCls}${skeletonButtonCls}-circle`]: {
			width: size,
			minWidth: size,
			borderRadius: "50%"
		},
		[`${buttonCls}${skeletonButtonCls}-round`]: { borderRadius: size }
	};
};
var genSkeletonElementButtonSize = (size, calc) => Object.assign({
	width: calc(size).mul(2).equal(),
	minWidth: calc(size).mul(2).equal()
}, genSkeletonElementCommonSize(size));
var genSkeletonElementButton = (token) => {
	const { borderRadiusSM, skeletonButtonCls, controlHeight, controlHeightLG, controlHeightSM, gradientFromColor, calc } = token;
	return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ [skeletonButtonCls]: Object.assign({
		display: "inline-block",
		verticalAlign: "top",
		background: gradientFromColor,
		borderRadius: borderRadiusSM,
		width: calc(controlHeight).mul(2).equal(),
		minWidth: calc(controlHeight).mul(2).equal()
	}, genSkeletonElementButtonSize(controlHeight, calc)) }, genSkeletonElementButtonShape(token, controlHeight, skeletonButtonCls)), { [`${skeletonButtonCls}-lg`]: Object.assign({}, genSkeletonElementButtonSize(controlHeightLG, calc)) }), genSkeletonElementButtonShape(token, controlHeightLG, `${skeletonButtonCls}-lg`)), { [`${skeletonButtonCls}-sm`]: Object.assign({}, genSkeletonElementButtonSize(controlHeightSM, calc)) }), genSkeletonElementButtonShape(token, controlHeightSM, `${skeletonButtonCls}-sm`));
};
var genBaseStyle = (token) => {
	const { componentCls, skeletonAvatarCls, skeletonTitleCls, skeletonParagraphCls, skeletonButtonCls, skeletonInputCls, skeletonImageCls, controlHeight, controlHeightLG, controlHeightSM, gradientFromColor, padding, marginSM, borderRadius, titleHeight, blockRadius, paragraphLiHeight, controlHeightXS, paragraphMarginTop } = token;
	return {
		[componentCls]: {
			display: "table",
			width: "100%",
			[`${componentCls}-header`]: {
				display: "table-cell",
				paddingInlineEnd: padding,
				verticalAlign: "top",
				[skeletonAvatarCls]: Object.assign({
					display: "inline-block",
					verticalAlign: "top",
					background: gradientFromColor
				}, genSkeletonElementAvatarSize(controlHeight)),
				[`${skeletonAvatarCls}-circle`]: { borderRadius: "50%" },
				[`${skeletonAvatarCls}-lg`]: Object.assign({}, genSkeletonElementAvatarSize(controlHeightLG)),
				[`${skeletonAvatarCls}-sm`]: Object.assign({}, genSkeletonElementAvatarSize(controlHeightSM))
			},
			[`${componentCls}-content`]: {
				display: "table-cell",
				width: "100%",
				verticalAlign: "top",
				[skeletonTitleCls]: {
					width: "100%",
					height: titleHeight,
					background: gradientFromColor,
					borderRadius: blockRadius,
					[`+ ${skeletonParagraphCls}`]: { marginBlockStart: controlHeightSM }
				},
				[skeletonParagraphCls]: {
					padding: 0,
					"> li": {
						width: "100%",
						height: paragraphLiHeight,
						listStyle: "none",
						background: gradientFromColor,
						borderRadius: blockRadius,
						"+ li": { marginBlockStart: controlHeightXS }
					}
				},
				[`${skeletonParagraphCls}> li:last-child:not(:first-child):not(:nth-child(2))`]: { width: "61%" }
			},
			[`&-round ${componentCls}-content`]: { [`${skeletonTitleCls}, ${skeletonParagraphCls} > li`]: { borderRadius } }
		},
		[`${componentCls}-with-avatar ${componentCls}-content`]: { [skeletonTitleCls]: {
			marginBlockStart: marginSM,
			[`+ ${skeletonParagraphCls}`]: { marginBlockStart: paragraphMarginTop }
		} },
		[`${componentCls}${componentCls}-element`]: Object.assign(Object.assign(Object.assign(Object.assign({
			display: "inline-block",
			width: "auto"
		}, genSkeletonElementButton(token)), genSkeletonElementAvatar(token)), genSkeletonElementInput(token)), genSkeletonElementImage(token)),
		[`${componentCls}${componentCls}-block`]: {
			width: "100%",
			[skeletonButtonCls]: { width: "100%" },
			[skeletonInputCls]: { width: "100%" }
		},
		[`${componentCls}${componentCls}-active`]: { [`
        ${skeletonTitleCls},
        ${skeletonParagraphCls} > li,
        ${skeletonAvatarCls},
        ${skeletonButtonCls},
        ${skeletonInputCls},
        ${skeletonImageCls}
      `]: Object.assign({}, genSkeletonColor(token)) }
	};
};
var prepareComponentToken$1 = (token) => {
	const { colorFillContent, colorFill } = token;
	const gradientFromColor = colorFillContent;
	const gradientToColor = colorFill;
	return {
		color: gradientFromColor,
		colorGradientEnd: gradientToColor,
		gradientFromColor,
		gradientToColor,
		titleHeight: token.controlHeight / 2,
		blockRadius: token.borderRadiusSM,
		paragraphMarginTop: token.marginLG + token.marginXXS,
		paragraphLiHeight: token.controlHeight / 2
	};
};
var style_default$1 = genStyleHooks("Skeleton", (token) => {
	const { componentCls, calc } = token;
	return genBaseStyle(merge(token, {
		skeletonAvatarCls: `${componentCls}-avatar`,
		skeletonTitleCls: `${componentCls}-title`,
		skeletonParagraphCls: `${componentCls}-paragraph`,
		skeletonButtonCls: `${componentCls}-button`,
		skeletonInputCls: `${componentCls}-input`,
		skeletonImageCls: `${componentCls}-image`,
		imageSizeBase: calc(token.controlHeight).mul(1.5).equal(),
		borderRadius: 100,
		skeletonLoadingBackground: `linear-gradient(90deg, ${token.gradientFromColor} 25%, ${token.gradientToColor} 37%, ${token.gradientFromColor} 63%)`,
		skeletonLoadingMotionDuration: "1.4s"
	}));
}, prepareComponentToken$1, { deprecatedTokens: [["color", "gradientFromColor"], ["colorGradientEnd", "gradientToColor"]] });
//#endregion
//#region node_modules/antd/es/skeleton/Avatar.js
var SkeletonAvatar = (props) => {
	const { prefixCls: customizePrefixCls, className, rootClassName, active, shape = "circle", size = "default" } = props;
	const { getPrefixCls } = import_react.useContext(ConfigContext);
	const prefixCls = getPrefixCls("skeleton", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default$1(prefixCls);
	const otherProps = omit(props, ["prefixCls", "className"]);
	const cls = (0, import_classnames.default)(prefixCls, `${prefixCls}-element`, { [`${prefixCls}-active`]: active }, className, rootClassName, hashId, cssVarCls);
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement("div", { className: cls }, /*#__PURE__*/ import_react.createElement(Element, Object.assign({
		prefixCls: `${prefixCls}-avatar`,
		shape,
		size
	}, otherProps))));
};
//#endregion
//#region node_modules/antd/es/skeleton/Button.js
var SkeletonButton = (props) => {
	const { prefixCls: customizePrefixCls, className, rootClassName, active, block = false, size = "default" } = props;
	const { getPrefixCls } = import_react.useContext(ConfigContext);
	const prefixCls = getPrefixCls("skeleton", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default$1(prefixCls);
	const otherProps = omit(props, ["prefixCls"]);
	const cls = (0, import_classnames.default)(prefixCls, `${prefixCls}-element`, {
		[`${prefixCls}-active`]: active,
		[`${prefixCls}-block`]: block
	}, className, rootClassName, hashId, cssVarCls);
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement("div", { className: cls }, /*#__PURE__*/ import_react.createElement(Element, Object.assign({
		prefixCls: `${prefixCls}-button`,
		size
	}, otherProps))));
};
//#endregion
//#region node_modules/antd/es/skeleton/Image.js
var path = "M365.714286 329.142857q0 45.714286-32.036571 77.677714t-77.677714 32.036571-77.677714-32.036571-32.036571-77.677714 32.036571-77.677714 77.677714-32.036571 77.677714 32.036571 32.036571 77.677714zM950.857143 548.571429l0 256-804.571429 0 0-109.714286 182.857143-182.857143 91.428571 91.428571 292.571429-292.571429zM1005.714286 146.285714l-914.285714 0q-7.460571 0-12.873143 5.412571t-5.412571 12.873143l0 694.857143q0 7.460571 5.412571 12.873143t12.873143 5.412571l914.285714 0q7.460571 0 12.873143-5.412571t5.412571-12.873143l0-694.857143q0-7.460571-5.412571-12.873143t-12.873143-5.412571zM1097.142857 164.571429l0 694.857143q0 37.741714-26.843429 64.585143t-64.585143 26.843429l-914.285714 0q-37.741714 0-64.585143-26.843429t-26.843429-64.585143l0-694.857143q0-37.741714 26.843429-64.585143t64.585143-26.843429l914.285714 0q37.741714 0 64.585143 26.843429t26.843429 64.585143z";
var SkeletonImage = (props) => {
	const { prefixCls: customizePrefixCls, className, rootClassName, style, active } = props;
	const { getPrefixCls } = import_react.useContext(ConfigContext);
	const prefixCls = getPrefixCls("skeleton", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default$1(prefixCls);
	const cls = (0, import_classnames.default)(prefixCls, `${prefixCls}-element`, { [`${prefixCls}-active`]: active }, className, rootClassName, hashId, cssVarCls);
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement("div", { className: cls }, /*#__PURE__*/ import_react.createElement("div", {
		className: (0, import_classnames.default)(`${prefixCls}-image`, className),
		style
	}, /*#__PURE__*/ import_react.createElement("svg", {
		viewBox: "0 0 1098 1024",
		xmlns: "http://www.w3.org/2000/svg",
		className: `${prefixCls}-image-svg`
	}, /*#__PURE__*/ import_react.createElement("title", null, "Image placeholder"), /*#__PURE__*/ import_react.createElement("path", {
		d: path,
		className: `${prefixCls}-image-path`
	})))));
};
//#endregion
//#region node_modules/antd/es/skeleton/Input.js
var SkeletonInput = (props) => {
	const { prefixCls: customizePrefixCls, className, rootClassName, active, block, size = "default" } = props;
	const { getPrefixCls } = import_react.useContext(ConfigContext);
	const prefixCls = getPrefixCls("skeleton", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default$1(prefixCls);
	const otherProps = omit(props, ["prefixCls"]);
	const cls = (0, import_classnames.default)(prefixCls, `${prefixCls}-element`, {
		[`${prefixCls}-active`]: active,
		[`${prefixCls}-block`]: block
	}, className, rootClassName, hashId, cssVarCls);
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement("div", { className: cls }, /*#__PURE__*/ import_react.createElement(Element, Object.assign({
		prefixCls: `${prefixCls}-input`,
		size
	}, otherProps))));
};
//#endregion
//#region node_modules/antd/es/skeleton/Node.js
var SkeletonNode = (props) => {
	const { prefixCls: customizePrefixCls, className, rootClassName, style, active, children } = props;
	const { getPrefixCls } = import_react.useContext(ConfigContext);
	const prefixCls = getPrefixCls("skeleton", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default$1(prefixCls);
	const cls = (0, import_classnames.default)(prefixCls, `${prefixCls}-element`, { [`${prefixCls}-active`]: active }, hashId, className, rootClassName, cssVarCls);
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement("div", { className: cls }, /*#__PURE__*/ import_react.createElement("div", {
		className: (0, import_classnames.default)(`${prefixCls}-image`, className),
		style
	}, children)));
};
//#endregion
//#region node_modules/antd/es/skeleton/Paragraph.js
var getWidth = (index, props) => {
	const { width, rows = 2 } = props;
	if (Array.isArray(width)) return width[index];
	if (rows - 1 === index) return width;
};
var Paragraph = (props) => {
	const { prefixCls, className, style, rows = 0 } = props;
	const rowList = Array.from({ length: rows }).map((_, index) => /*#__PURE__*/ import_react.createElement("li", {
		key: index,
		style: { width: getWidth(index, props) }
	}));
	return /*#__PURE__*/ import_react.createElement("ul", {
		className: (0, import_classnames.default)(prefixCls, className),
		style
	}, rowList);
};
//#endregion
//#region node_modules/antd/es/skeleton/Title.js
var Title = ({ prefixCls, className, width, style }) => /*#__PURE__*/ import_react.createElement("h3", {
	className: (0, import_classnames.default)(prefixCls, className),
	style: Object.assign({ width }, style)
});
//#endregion
//#region node_modules/antd/es/skeleton/Skeleton.js
function getComponentProps(prop) {
	if (prop && typeof prop === "object") return prop;
	return {};
}
function getAvatarBasicProps(hasTitle, hasParagraph) {
	if (hasTitle && !hasParagraph) return {
		size: "large",
		shape: "square"
	};
	return {
		size: "large",
		shape: "circle"
	};
}
function getTitleBasicProps(hasAvatar, hasParagraph) {
	if (!hasAvatar && hasParagraph) return { width: "38%" };
	if (hasAvatar && hasParagraph) return { width: "50%" };
	return {};
}
function getParagraphBasicProps(hasAvatar, hasTitle) {
	const basicProps = {};
	if (!hasAvatar || !hasTitle) basicProps.width = "61%";
	if (!hasAvatar && hasTitle) basicProps.rows = 3;
	else basicProps.rows = 2;
	return basicProps;
}
var Skeleton = (props) => {
	const { prefixCls: customizePrefixCls, loading, className, rootClassName, style, children, avatar = false, title = true, paragraph = true, active, round } = props;
	const { getPrefixCls, direction, className: contextClassName, style: contextStyle } = useComponentConfig("skeleton");
	const prefixCls = getPrefixCls("skeleton", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default$1(prefixCls);
	if (loading || !("loading" in props)) {
		const hasAvatar = !!avatar;
		const hasTitle = !!title;
		const hasParagraph = !!paragraph;
		let avatarNode;
		if (hasAvatar) {
			const avatarProps = Object.assign(Object.assign({ prefixCls: `${prefixCls}-avatar` }, getAvatarBasicProps(hasTitle, hasParagraph)), getComponentProps(avatar));
			avatarNode = /*#__PURE__*/ import_react.createElement("div", { className: `${prefixCls}-header` }, /*#__PURE__*/ import_react.createElement(Element, Object.assign({}, avatarProps)));
		}
		let contentNode;
		if (hasTitle || hasParagraph) {
			let $title;
			if (hasTitle) {
				const titleProps = Object.assign(Object.assign({ prefixCls: `${prefixCls}-title` }, getTitleBasicProps(hasAvatar, hasParagraph)), getComponentProps(title));
				$title = /*#__PURE__*/ import_react.createElement(Title, Object.assign({}, titleProps));
			}
			let paragraphNode;
			if (hasParagraph) {
				const paragraphProps = Object.assign(Object.assign({ prefixCls: `${prefixCls}-paragraph` }, getParagraphBasicProps(hasAvatar, hasTitle)), getComponentProps(paragraph));
				paragraphNode = /*#__PURE__*/ import_react.createElement(Paragraph, Object.assign({}, paragraphProps));
			}
			contentNode = /*#__PURE__*/ import_react.createElement("div", { className: `${prefixCls}-content` }, $title, paragraphNode);
		}
		const cls = (0, import_classnames.default)(prefixCls, {
			[`${prefixCls}-with-avatar`]: hasAvatar,
			[`${prefixCls}-active`]: active,
			[`${prefixCls}-rtl`]: direction === "rtl",
			[`${prefixCls}-round`]: round
		}, contextClassName, className, rootClassName, hashId, cssVarCls);
		return wrapCSSVar(/*#__PURE__*/ import_react.createElement("div", {
			className: cls,
			style: Object.assign(Object.assign({}, contextStyle), style)
		}, avatarNode, contentNode));
	}
	return children !== null && children !== void 0 ? children : null;
};
Skeleton.Button = SkeletonButton;
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Input = SkeletonInput;
Skeleton.Image = SkeletonImage;
Skeleton.Node = SkeletonNode;
Skeleton.displayName = "Skeleton";
//#endregion
//#region node_modules/antd/es/skeleton/index.js
var skeleton_default = Skeleton;
//#endregion
//#region node_modules/antd/es/watermark/context.js
function voidFunc() {}
var WatermarkContext = /*#__PURE__*/ import_react.createContext({
	add: voidFunc,
	remove: voidFunc
});
function usePanelRef(panelSelector) {
	const watermark = import_react.useContext(WatermarkContext);
	const panelEleRef = import_react.useRef(null);
	return useEvent((ele) => {
		if (ele) {
			const innerContentEle = panelSelector ? ele.querySelector(panelSelector) : ele;
			watermark.add(innerContentEle);
			panelEleRef.current = innerContentEle;
		} else watermark.remove(panelEleRef.current);
	});
}
//#endregion
//#region node_modules/rc-drawer/es/context.js
var DrawerContext = /*#__PURE__*/ import_react.createContext(null);
var RefContext = /*#__PURE__*/ import_react.createContext({});
//#endregion
//#region node_modules/rc-drawer/es/DrawerPanel.js
var _excluded = [
	"prefixCls",
	"className",
	"containerRef"
];
var DrawerPanel$1 = function DrawerPanel(props) {
	var prefixCls = props.prefixCls, className = props.className, containerRef = props.containerRef, restProps = _objectWithoutProperties(props, _excluded);
	var panelRef = import_react.useContext(RefContext).panel;
	var mergedRef = useComposeRef(panelRef, containerRef);
	return /*#__PURE__*/ import_react.createElement("div", _extends({
		className: (0, import_classnames.default)("".concat(prefixCls, "-content"), className),
		role: "dialog",
		ref: mergedRef
	}, pickAttrs(props, { aria: true }), { "aria-modal": "true" }, restProps));
};
DrawerPanel$1.displayName = "DrawerPanel";
//#endregion
//#region node_modules/rc-drawer/es/util.js
function parseWidthHeight(value) {
	if (typeof value === "string" && String(Number(value)) === value) {
		warningOnce(false, "Invalid value type of `width` or `height` which should be number type instead.");
		return Number(value);
	}
	return value;
}
function warnCheck(props) {
	warningOnce(!("wrapperClassName" in props), "'wrapperClassName' is removed. Please use 'rootClassName' instead.");
	warningOnce(canUseDom() || !props.open, "Drawer with 'open' in SSR is not work since no place to createPortal. Please move to 'useEffect' instead.");
}
//#endregion
//#region node_modules/rc-drawer/es/DrawerPopup.js
init_extends();
var sentinelStyle = {
	width: 0,
	height: 0,
	overflow: "hidden",
	outline: "none",
	position: "absolute"
};
function DrawerPopup(props, ref) {
	var _ref, _pushConfig$distance, _pushConfig;
	var prefixCls = props.prefixCls, open = props.open, placement = props.placement, inline = props.inline, push = props.push, forceRender = props.forceRender, autoFocus = props.autoFocus, keyboard = props.keyboard, drawerClassNames = props.classNames, rootClassName = props.rootClassName, rootStyle = props.rootStyle, zIndex = props.zIndex, className = props.className, id = props.id, style = props.style, motion = props.motion, width = props.width, height = props.height, children = props.children, mask = props.mask, maskClosable = props.maskClosable, maskMotion = props.maskMotion, maskClassName = props.maskClassName, maskStyle = props.maskStyle, afterOpenChange = props.afterOpenChange, onClose = props.onClose, onMouseEnter = props.onMouseEnter, onMouseOver = props.onMouseOver, onMouseLeave = props.onMouseLeave, onClick = props.onClick, onKeyDown = props.onKeyDown, onKeyUp = props.onKeyUp, styles = props.styles, drawerRender = props.drawerRender;
	var panelRef = import_react.useRef();
	var sentinelStartRef = import_react.useRef();
	var sentinelEndRef = import_react.useRef();
	import_react.useImperativeHandle(ref, function() {
		return panelRef.current;
	});
	var onPanelKeyDown = function onPanelKeyDown(event) {
		var keyCode = event.keyCode, shiftKey = event.shiftKey;
		switch (keyCode) {
			case KeyCode.TAB:
				if (keyCode === KeyCode.TAB) {
					if (!shiftKey && document.activeElement === sentinelEndRef.current) {
						var _sentinelStartRef$cur;
						(_sentinelStartRef$cur = sentinelStartRef.current) === null || _sentinelStartRef$cur === void 0 || _sentinelStartRef$cur.focus({ preventScroll: true });
					} else if (shiftKey && document.activeElement === sentinelStartRef.current) {
						var _sentinelEndRef$curre;
						(_sentinelEndRef$curre = sentinelEndRef.current) === null || _sentinelEndRef$curre === void 0 || _sentinelEndRef$curre.focus({ preventScroll: true });
					}
				}
				break;
			case KeyCode.ESC:
				if (onClose && keyboard) {
					event.stopPropagation();
					onClose(event);
				}
				break;
		}
	};
	import_react.useEffect(function() {
		if (open && autoFocus) {
			var _panelRef$current;
			(_panelRef$current = panelRef.current) === null || _panelRef$current === void 0 || _panelRef$current.focus({ preventScroll: true });
		}
	}, [open]);
	var _React$useState2 = _slicedToArray(import_react.useState(false), 2), pushed = _React$useState2[0], setPushed = _React$useState2[1];
	var parentContext = import_react.useContext(DrawerContext);
	var pushConfig;
	if (typeof push === "boolean") pushConfig = push ? {} : { distance: 0 };
	else pushConfig = push || {};
	var pushDistance = (_ref = (_pushConfig$distance = (_pushConfig = pushConfig) === null || _pushConfig === void 0 ? void 0 : _pushConfig.distance) !== null && _pushConfig$distance !== void 0 ? _pushConfig$distance : parentContext === null || parentContext === void 0 ? void 0 : parentContext.pushDistance) !== null && _ref !== void 0 ? _ref : 180;
	var mergedContext = import_react.useMemo(function() {
		return {
			pushDistance,
			push: function push() {
				setPushed(true);
			},
			pull: function pull() {
				setPushed(false);
			}
		};
	}, [pushDistance]);
	import_react.useEffect(function() {
		if (open) {
			var _parentContext$push;
			parentContext === null || parentContext === void 0 || (_parentContext$push = parentContext.push) === null || _parentContext$push === void 0 || _parentContext$push.call(parentContext);
		} else {
			var _parentContext$pull;
			parentContext === null || parentContext === void 0 || (_parentContext$pull = parentContext.pull) === null || _parentContext$pull === void 0 || _parentContext$pull.call(parentContext);
		}
	}, [open]);
	import_react.useEffect(function() {
		return function() {
			var _parentContext$pull2;
			parentContext === null || parentContext === void 0 || (_parentContext$pull2 = parentContext.pull) === null || _parentContext$pull2 === void 0 || _parentContext$pull2.call(parentContext);
		};
	}, []);
	var maskNode = /*#__PURE__*/ import_react.createElement(es_default$1, _extends({ key: "mask" }, maskMotion, { visible: mask && open }), function(_ref2, maskRef) {
		var motionMaskClassName = _ref2.className, motionMaskStyle = _ref2.style;
		return /*#__PURE__*/ import_react.createElement("div", {
			className: (0, import_classnames.default)("".concat(prefixCls, "-mask"), motionMaskClassName, drawerClassNames === null || drawerClassNames === void 0 ? void 0 : drawerClassNames.mask, maskClassName),
			style: _objectSpread2(_objectSpread2(_objectSpread2({}, motionMaskStyle), maskStyle), styles === null || styles === void 0 ? void 0 : styles.mask),
			onClick: maskClosable && open ? onClose : void 0,
			ref: maskRef
		});
	});
	var motionProps = typeof motion === "function" ? motion(placement) : motion;
	var wrapperStyle = {};
	if (pushed && pushDistance) switch (placement) {
		case "top":
			wrapperStyle.transform = "translateY(".concat(pushDistance, "px)");
			break;
		case "bottom":
			wrapperStyle.transform = "translateY(".concat(-pushDistance, "px)");
			break;
		case "left":
			wrapperStyle.transform = "translateX(".concat(pushDistance, "px)");
			break;
		default:
			wrapperStyle.transform = "translateX(".concat(-pushDistance, "px)");
			break;
	}
	if (placement === "left" || placement === "right") wrapperStyle.width = parseWidthHeight(width);
	else wrapperStyle.height = parseWidthHeight(height);
	var eventHandlers = {
		onMouseEnter,
		onMouseOver,
		onMouseLeave,
		onClick,
		onKeyDown,
		onKeyUp
	};
	var panelNode = /*#__PURE__*/ import_react.createElement(es_default$1, _extends({ key: "panel" }, motionProps, {
		visible: open,
		forceRender,
		onVisibleChanged: function onVisibleChanged(nextVisible) {
			afterOpenChange === null || afterOpenChange === void 0 || afterOpenChange(nextVisible);
		},
		removeOnLeave: false,
		leavedClassName: "".concat(prefixCls, "-content-wrapper-hidden")
	}), function(_ref3, motionRef) {
		var motionClassName = _ref3.className, motionStyle = _ref3.style;
		var content = /*#__PURE__*/ import_react.createElement(DrawerPanel$1, _extends({
			id,
			containerRef: motionRef,
			prefixCls,
			className: (0, import_classnames.default)(className, drawerClassNames === null || drawerClassNames === void 0 ? void 0 : drawerClassNames.content),
			style: _objectSpread2(_objectSpread2({}, style), styles === null || styles === void 0 ? void 0 : styles.content)
		}, pickAttrs(props, { aria: true }), eventHandlers), children);
		return /*#__PURE__*/ import_react.createElement("div", _extends({
			className: (0, import_classnames.default)("".concat(prefixCls, "-content-wrapper"), drawerClassNames === null || drawerClassNames === void 0 ? void 0 : drawerClassNames.wrapper, motionClassName),
			style: _objectSpread2(_objectSpread2(_objectSpread2({}, wrapperStyle), motionStyle), styles === null || styles === void 0 ? void 0 : styles.wrapper)
		}, pickAttrs(props, { data: true })), drawerRender ? drawerRender(content) : content);
	});
	var containerStyle = _objectSpread2({}, rootStyle);
	if (zIndex) containerStyle.zIndex = zIndex;
	return /*#__PURE__*/ import_react.createElement(DrawerContext.Provider, { value: mergedContext }, /*#__PURE__*/ import_react.createElement("div", {
		className: (0, import_classnames.default)(prefixCls, "".concat(prefixCls, "-").concat(placement), rootClassName, _defineProperty(_defineProperty({}, "".concat(prefixCls, "-open"), open), "".concat(prefixCls, "-inline"), inline)),
		style: containerStyle,
		tabIndex: -1,
		ref: panelRef,
		onKeyDown: onPanelKeyDown
	}, maskNode, /*#__PURE__*/ import_react.createElement("div", {
		tabIndex: 0,
		ref: sentinelStartRef,
		style: sentinelStyle,
		"aria-hidden": "true",
		"data-sentinel": "start"
	}), panelNode, /*#__PURE__*/ import_react.createElement("div", {
		tabIndex: 0,
		ref: sentinelEndRef,
		style: sentinelStyle,
		"aria-hidden": "true",
		"data-sentinel": "end"
	})));
}
var RefDrawerPopup = /*#__PURE__*/ import_react.forwardRef(DrawerPopup);
RefDrawerPopup.displayName = "DrawerPopup";
//#endregion
//#region node_modules/rc-drawer/es/Drawer.js
init_slicedToArray();
var Drawer$1 = function Drawer(props) {
	var _props$open = props.open, open = _props$open === void 0 ? false : _props$open, _props$prefixCls = props.prefixCls, prefixCls = _props$prefixCls === void 0 ? "rc-drawer" : _props$prefixCls, _props$placement = props.placement, placement = _props$placement === void 0 ? "right" : _props$placement, _props$autoFocus = props.autoFocus, autoFocus = _props$autoFocus === void 0 ? true : _props$autoFocus, _props$keyboard = props.keyboard, keyboard = _props$keyboard === void 0 ? true : _props$keyboard, _props$width = props.width, width = _props$width === void 0 ? 378 : _props$width, _props$mask = props.mask, mask = _props$mask === void 0 ? true : _props$mask, _props$maskClosable = props.maskClosable, maskClosable = _props$maskClosable === void 0 ? true : _props$maskClosable, getContainer = props.getContainer, forceRender = props.forceRender, afterOpenChange = props.afterOpenChange, destroyOnClose = props.destroyOnClose, onMouseEnter = props.onMouseEnter, onMouseOver = props.onMouseOver, onMouseLeave = props.onMouseLeave, onClick = props.onClick, onKeyDown = props.onKeyDown, onKeyUp = props.onKeyUp, panelRef = props.panelRef;
	var _React$useState2 = _slicedToArray(import_react.useState(false), 2), animatedVisible = _React$useState2[0], setAnimatedVisible = _React$useState2[1];
	warnCheck(props);
	var _React$useState4 = _slicedToArray(import_react.useState(false), 2), mounted = _React$useState4[0], setMounted = _React$useState4[1];
	useLayoutEffect$1(function() {
		setMounted(true);
	}, []);
	var mergedOpen = mounted ? open : false;
	var popupRef = import_react.useRef();
	var lastActiveRef = import_react.useRef();
	useLayoutEffect$1(function() {
		if (mergedOpen) lastActiveRef.current = document.activeElement;
	}, [mergedOpen]);
	var internalAfterOpenChange = function internalAfterOpenChange(nextVisible) {
		var _popupRef$current;
		setAnimatedVisible(nextVisible);
		afterOpenChange === null || afterOpenChange === void 0 || afterOpenChange(nextVisible);
		if (!nextVisible && lastActiveRef.current && !((_popupRef$current = popupRef.current) !== null && _popupRef$current !== void 0 && _popupRef$current.contains(lastActiveRef.current))) {
			var _lastActiveRef$curren;
			(_lastActiveRef$curren = lastActiveRef.current) === null || _lastActiveRef$curren === void 0 || _lastActiveRef$curren.focus({ preventScroll: true });
		}
	};
	var refContext = import_react.useMemo(function() {
		return { panel: panelRef };
	}, [panelRef]);
	if (!forceRender && !animatedVisible && !mergedOpen && destroyOnClose) return null;
	var eventHandlers = {
		onMouseEnter,
		onMouseOver,
		onMouseLeave,
		onClick,
		onKeyDown,
		onKeyUp
	};
	var drawerPopupProps = _objectSpread2(_objectSpread2({}, props), {}, {
		open: mergedOpen,
		prefixCls,
		placement,
		autoFocus,
		keyboard,
		width,
		mask,
		maskClosable,
		inline: getContainer === false,
		afterOpenChange: internalAfterOpenChange,
		ref: popupRef
	}, eventHandlers);
	return /*#__PURE__*/ import_react.createElement(RefContext.Provider, { value: refContext }, /*#__PURE__*/ import_react.createElement(es_default$2, {
		open: mergedOpen || forceRender || animatedVisible,
		autoDestroy: false,
		getContainer,
		autoLock: mask && (mergedOpen || animatedVisible)
	}, /*#__PURE__*/ import_react.createElement(RefDrawerPopup, drawerPopupProps)));
};
Drawer$1.displayName = "Drawer";
//#endregion
//#region node_modules/rc-drawer/es/index.js
var es_default = Drawer$1;
//#endregion
//#region node_modules/antd/es/drawer/DrawerPanel.js
var DrawerPanel = (props) => {
	var _a, _b;
	const { prefixCls, title, footer, extra, loading, onClose, headerStyle, bodyStyle, footerStyle, children, classNames: drawerClassNames, styles: drawerStyles } = props;
	const drawerContext = useComponentConfig("drawer");
	const customCloseIconRender = import_react.useCallback((icon) => /*#__PURE__*/ import_react.createElement("button", {
		type: "button",
		onClick: onClose,
		className: `${prefixCls}-close`
	}, icon), [onClose]);
	const [mergedClosable, mergedCloseIcon] = useClosable(pickClosable(props), pickClosable(drawerContext), {
		closable: true,
		closeIconRender: customCloseIconRender
	});
	const headerNode = import_react.useMemo(() => {
		var _a, _b;
		if (!title && !mergedClosable) return null;
		return /*#__PURE__*/ import_react.createElement("div", {
			style: Object.assign(Object.assign(Object.assign({}, (_a = drawerContext.styles) === null || _a === void 0 ? void 0 : _a.header), headerStyle), drawerStyles === null || drawerStyles === void 0 ? void 0 : drawerStyles.header),
			className: (0, import_classnames.default)(`${prefixCls}-header`, { [`${prefixCls}-header-close-only`]: mergedClosable && !title && !extra }, (_b = drawerContext.classNames) === null || _b === void 0 ? void 0 : _b.header, drawerClassNames === null || drawerClassNames === void 0 ? void 0 : drawerClassNames.header)
		}, /*#__PURE__*/ import_react.createElement("div", { className: `${prefixCls}-header-title` }, mergedCloseIcon, title && /*#__PURE__*/ import_react.createElement("div", { className: `${prefixCls}-title` }, title)), extra && /*#__PURE__*/ import_react.createElement("div", { className: `${prefixCls}-extra` }, extra));
	}, [
		mergedClosable,
		mergedCloseIcon,
		extra,
		headerStyle,
		prefixCls,
		title
	]);
	const footerNode = import_react.useMemo(() => {
		var _a, _b;
		if (!footer) return null;
		const footerClassName = `${prefixCls}-footer`;
		return /*#__PURE__*/ import_react.createElement("div", {
			className: (0, import_classnames.default)(footerClassName, (_a = drawerContext.classNames) === null || _a === void 0 ? void 0 : _a.footer, drawerClassNames === null || drawerClassNames === void 0 ? void 0 : drawerClassNames.footer),
			style: Object.assign(Object.assign(Object.assign({}, (_b = drawerContext.styles) === null || _b === void 0 ? void 0 : _b.footer), footerStyle), drawerStyles === null || drawerStyles === void 0 ? void 0 : drawerStyles.footer)
		}, footer);
	}, [
		footer,
		footerStyle,
		prefixCls
	]);
	return /*#__PURE__*/ import_react.createElement(import_react.Fragment, null, headerNode, /*#__PURE__*/ import_react.createElement("div", {
		className: (0, import_classnames.default)(`${prefixCls}-body`, drawerClassNames === null || drawerClassNames === void 0 ? void 0 : drawerClassNames.body, (_a = drawerContext.classNames) === null || _a === void 0 ? void 0 : _a.body),
		style: Object.assign(Object.assign(Object.assign({}, (_b = drawerContext.styles) === null || _b === void 0 ? void 0 : _b.body), bodyStyle), drawerStyles === null || drawerStyles === void 0 ? void 0 : drawerStyles.body)
	}, loading ? /*#__PURE__*/ import_react.createElement(skeleton_default, {
		active: true,
		title: false,
		paragraph: { rows: 5 },
		className: `${prefixCls}-body-skeleton`
	}) : children), footerNode);
};
//#endregion
//#region node_modules/antd/es/drawer/style/motion.js
var getMoveTranslate = (direction) => {
	const value = "100%";
	return {
		left: `translateX(-${value})`,
		right: `translateX(${value})`,
		top: `translateY(-${value})`,
		bottom: `translateY(${value})`
	}[direction];
};
var getEnterLeaveStyle = (startStyle, endStyle) => ({
	"&-enter, &-appear": Object.assign(Object.assign({}, startStyle), { "&-active": endStyle }),
	"&-leave": Object.assign(Object.assign({}, endStyle), { "&-active": startStyle })
});
var getFadeStyle = (from, duration) => Object.assign({ "&-enter, &-appear, &-leave": {
	"&-start": { transition: "none" },
	"&-active": { transition: `all ${duration}` }
} }, getEnterLeaveStyle({ opacity: from }, { opacity: 1 }));
var getPanelMotionStyles = (direction, duration) => [getFadeStyle(.7, duration), getEnterLeaveStyle({ transform: getMoveTranslate(direction) }, { transform: "none" })];
var genMotionStyle = (token) => {
	const { componentCls, motionDurationSlow } = token;
	return { [componentCls]: {
		[`${componentCls}-mask-motion`]: getFadeStyle(0, motionDurationSlow),
		[`${componentCls}-panel-motion`]: [
			"left",
			"right",
			"top",
			"bottom"
		].reduce((obj, direction) => Object.assign(Object.assign({}, obj), { [`&-${direction}`]: getPanelMotionStyles(direction, motionDurationSlow) }), {})
	} };
};
//#endregion
//#region node_modules/antd/es/drawer/style/index.js
var genDrawerStyle = (token) => {
	const { borderRadiusSM, componentCls, zIndexPopup, colorBgMask, colorBgElevated, motionDurationSlow, motionDurationMid, paddingXS, padding, paddingLG, fontSizeLG, lineHeightLG, lineWidth, lineType, colorSplit, marginXS, colorIcon, colorIconHover, colorBgTextHover, colorBgTextActive, colorText, fontWeightStrong, footerPaddingBlock, footerPaddingInline, calc } = token;
	const wrapperCls = `${componentCls}-content-wrapper`;
	return { [componentCls]: {
		position: "fixed",
		inset: 0,
		zIndex: zIndexPopup,
		pointerEvents: "none",
		color: colorText,
		"&-pure": {
			position: "relative",
			background: colorBgElevated,
			display: "flex",
			flexDirection: "column",
			[`&${componentCls}-left`]: { boxShadow: token.boxShadowDrawerLeft },
			[`&${componentCls}-right`]: { boxShadow: token.boxShadowDrawerRight },
			[`&${componentCls}-top`]: { boxShadow: token.boxShadowDrawerUp },
			[`&${componentCls}-bottom`]: { boxShadow: token.boxShadowDrawerDown }
		},
		"&-inline": { position: "absolute" },
		[`${componentCls}-mask`]: {
			position: "absolute",
			inset: 0,
			zIndex: zIndexPopup,
			background: colorBgMask,
			pointerEvents: "auto"
		},
		[wrapperCls]: {
			position: "absolute",
			zIndex: zIndexPopup,
			maxWidth: "100vw",
			transition: `all ${motionDurationSlow}`,
			"&-hidden": { display: "none" }
		},
		[`&-left > ${wrapperCls}`]: {
			top: 0,
			bottom: 0,
			left: {
				_skip_check_: true,
				value: 0
			},
			boxShadow: token.boxShadowDrawerLeft
		},
		[`&-right > ${wrapperCls}`]: {
			top: 0,
			right: {
				_skip_check_: true,
				value: 0
			},
			bottom: 0,
			boxShadow: token.boxShadowDrawerRight
		},
		[`&-top > ${wrapperCls}`]: {
			top: 0,
			insetInline: 0,
			boxShadow: token.boxShadowDrawerUp
		},
		[`&-bottom > ${wrapperCls}`]: {
			bottom: 0,
			insetInline: 0,
			boxShadow: token.boxShadowDrawerDown
		},
		[`${componentCls}-content`]: {
			display: "flex",
			flexDirection: "column",
			width: "100%",
			height: "100%",
			overflow: "auto",
			background: colorBgElevated,
			pointerEvents: "auto"
		},
		[`${componentCls}-header`]: {
			display: "flex",
			flex: 0,
			alignItems: "center",
			padding: `${unit(padding)} ${unit(paddingLG)}`,
			fontSize: fontSizeLG,
			lineHeight: lineHeightLG,
			borderBottom: `${unit(lineWidth)} ${lineType} ${colorSplit}`,
			"&-title": {
				display: "flex",
				flex: 1,
				alignItems: "center",
				minWidth: 0,
				minHeight: 0
			}
		},
		[`${componentCls}-extra`]: { flex: "none" },
		[`${componentCls}-close`]: Object.assign({
			display: "inline-flex",
			width: calc(fontSizeLG).add(paddingXS).equal(),
			height: calc(fontSizeLG).add(paddingXS).equal(),
			borderRadius: borderRadiusSM,
			justifyContent: "center",
			alignItems: "center",
			marginInlineEnd: marginXS,
			color: colorIcon,
			fontWeight: fontWeightStrong,
			fontSize: fontSizeLG,
			fontStyle: "normal",
			lineHeight: 1,
			textAlign: "center",
			textTransform: "none",
			textDecoration: "none",
			background: "transparent",
			border: 0,
			cursor: "pointer",
			transition: `all ${motionDurationMid}`,
			textRendering: "auto",
			"&:hover": {
				color: colorIconHover,
				backgroundColor: colorBgTextHover,
				textDecoration: "none"
			},
			"&:active": { backgroundColor: colorBgTextActive }
		}, genFocusStyle(token)),
		[`${componentCls}-title`]: {
			flex: 1,
			margin: 0,
			fontWeight: token.fontWeightStrong,
			fontSize: fontSizeLG,
			lineHeight: lineHeightLG
		},
		[`${componentCls}-body`]: {
			flex: 1,
			minWidth: 0,
			minHeight: 0,
			padding: paddingLG,
			overflow: "auto",
			[`${componentCls}-body-skeleton`]: {
				width: "100%",
				height: "100%",
				display: "flex",
				justifyContent: "center"
			}
		},
		[`${componentCls}-footer`]: {
			flexShrink: 0,
			padding: `${unit(footerPaddingBlock)} ${unit(footerPaddingInline)}`,
			borderTop: `${unit(lineWidth)} ${lineType} ${colorSplit}`
		},
		"&-rtl": { direction: "rtl" }
	} };
};
var prepareComponentToken = (token) => ({
	zIndexPopup: token.zIndexPopupBase,
	footerPaddingBlock: token.paddingXS,
	footerPaddingInline: token.padding
});
var style_default = genStyleHooks("Drawer", (token) => {
	const drawerToken = merge(token, {});
	return [genDrawerStyle(drawerToken), genMotionStyle(drawerToken)];
}, prepareComponentToken);
//#endregion
//#region node_modules/antd/es/drawer/index.js
var __rest = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var defaultPushState = { distance: 180 };
var Drawer = (props) => {
	var _a;
	const { rootClassName, width, height, size = "default", mask = true, push = defaultPushState, open, afterOpenChange, onClose, prefixCls: customizePrefixCls, getContainer: customizeGetContainer, panelRef = null, style, className, visible, afterVisibleChange, maskStyle, drawerStyle, contentWrapperStyle, destroyOnClose, destroyOnHidden } = props, rest = __rest(props, [
		"rootClassName",
		"width",
		"height",
		"size",
		"mask",
		"push",
		"open",
		"afterOpenChange",
		"onClose",
		"prefixCls",
		"getContainer",
		"panelRef",
		"style",
		"className",
		"visible",
		"afterVisibleChange",
		"maskStyle",
		"drawerStyle",
		"contentWrapperStyle",
		"destroyOnClose",
		"destroyOnHidden"
	]);
	const { getPopupContainer, getPrefixCls, direction, className: contextClassName, style: contextStyle, classNames: contextClassNames, styles: contextStyles } = useComponentConfig("drawer");
	const prefixCls = getPrefixCls("drawer", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default(prefixCls);
	const getContainer = customizeGetContainer === void 0 && getPopupContainer ? () => getPopupContainer(document.body) : customizeGetContainer;
	const drawerClassName = (0, import_classnames.default)({
		"no-mask": !mask,
		[`${prefixCls}-rtl`]: direction === "rtl"
	}, rootClassName, hashId, cssVarCls);
	{
		const warning = devUseWarning("Drawer");
		[
			["visible", "open"],
			["afterVisibleChange", "afterOpenChange"],
			["headerStyle", "styles.header"],
			["bodyStyle", "styles.body"],
			["footerStyle", "styles.footer"],
			["contentWrapperStyle", "styles.wrapper"],
			["maskStyle", "styles.mask"],
			["drawerStyle", "styles.content"],
			["destroyInactivePanel", "destroyOnHidden"]
		].forEach(([deprecatedName, newName]) => {
			warning.deprecated(!(deprecatedName in props), deprecatedName, newName);
		});
		if (getContainer !== void 0 && ((_a = props.style) === null || _a === void 0 ? void 0 : _a.position) === "absolute") warning(false, "breaking", "`style` is replaced by `rootStyle` in v5. Please check that `position: absolute` is necessary.");
	}
	const mergedWidth = import_react.useMemo(() => width !== null && width !== void 0 ? width : size === "large" ? 736 : 378, [width, size]);
	const mergedHeight = import_react.useMemo(() => height !== null && height !== void 0 ? height : size === "large" ? 736 : 378, [height, size]);
	const maskMotion = {
		motionName: getTransitionName(prefixCls, "mask-motion"),
		motionAppear: true,
		motionEnter: true,
		motionLeave: true,
		motionDeadline: 500
	};
	const panelMotion = (motionPlacement) => ({
		motionName: getTransitionName(prefixCls, `panel-motion-${motionPlacement}`),
		motionAppear: true,
		motionEnter: true,
		motionLeave: true,
		motionDeadline: 500
	});
	const mergedPanelRef = composeRef(panelRef, usePanelRef());
	const [zIndex, contextZIndex] = useZIndex("Drawer", rest.zIndex);
	const { classNames: propClassNames = {}, styles: propStyles = {} } = rest;
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement(ContextIsolator, {
		form: true,
		space: true
	}, /*#__PURE__*/ import_react.createElement(zIndexContext.Provider, { value: contextZIndex }, /*#__PURE__*/ import_react.createElement(es_default, Object.assign({
		prefixCls,
		onClose,
		maskMotion,
		motion: panelMotion
	}, rest, {
		classNames: {
			mask: (0, import_classnames.default)(propClassNames.mask, contextClassNames.mask),
			content: (0, import_classnames.default)(propClassNames.content, contextClassNames.content),
			wrapper: (0, import_classnames.default)(propClassNames.wrapper, contextClassNames.wrapper)
		},
		styles: {
			mask: Object.assign(Object.assign(Object.assign({}, propStyles.mask), maskStyle), contextStyles.mask),
			content: Object.assign(Object.assign(Object.assign({}, propStyles.content), drawerStyle), contextStyles.content),
			wrapper: Object.assign(Object.assign(Object.assign({}, propStyles.wrapper), contentWrapperStyle), contextStyles.wrapper)
		},
		open: open !== null && open !== void 0 ? open : visible,
		mask,
		push,
		width: mergedWidth,
		height: mergedHeight,
		style: Object.assign(Object.assign({}, contextStyle), style),
		className: (0, import_classnames.default)(contextClassName, className),
		rootClassName: drawerClassName,
		getContainer,
		afterOpenChange: afterOpenChange !== null && afterOpenChange !== void 0 ? afterOpenChange : afterVisibleChange,
		panelRef: mergedPanelRef,
		zIndex,
		destroyOnClose: destroyOnHidden !== null && destroyOnHidden !== void 0 ? destroyOnHidden : destroyOnClose
	}), /*#__PURE__*/ import_react.createElement(DrawerPanel, Object.assign({ prefixCls }, rest, { onClose }))))));
};
/** @private Internal Component. Do not use in your production. */
var PurePanel = (props) => {
	const { prefixCls: customizePrefixCls, style, className, placement = "right" } = props, restProps = __rest(props, [
		"prefixCls",
		"style",
		"className",
		"placement"
	]);
	const { getPrefixCls } = import_react.useContext(ConfigContext);
	const prefixCls = getPrefixCls("drawer", customizePrefixCls);
	const [wrapCSSVar, hashId, cssVarCls] = style_default(prefixCls);
	const cls = (0, import_classnames.default)(prefixCls, `${prefixCls}-pure`, `${prefixCls}-${placement}`, hashId, cssVarCls, className);
	return wrapCSSVar(/*#__PURE__*/ import_react.createElement("div", {
		className: cls,
		style
	}, /*#__PURE__*/ import_react.createElement(DrawerPanel, Object.assign({ prefixCls }, restProps))));
};
Drawer._InternalPanelDoNotUseOrYouWillBeFired = PurePanel;
Drawer.displayName = "Drawer";
var ItemsDrawer_module_default = {
	minSpend: "minSpend___Am-if",
	specialItemContent: "specialItemContent___N6moT",
	contentList: "contentList___YzoV0",
	specialItem: "specialItem___25DSe",
	soldout: "soldout___-IDIw",
	itemImage: "itemImage___zDSds",
	counter: "counter___Ud0gD",
	stockNum: "stockNum___8PEpg",
	specialItemInfo: "specialItemInfo___OYsIT",
	itemName: "itemName___HekTW",
	itemPrice: "itemPrice___xkzah",
	haveTagPrice: "haveTagPrice___ebn8y",
	specialPrice: "specialPrice___bpuhO",
	confirmBtn: "confirmBtn___6YyRQ",
	footerBtns: "footerBtns___pWkyx",
	skipBtn: "skipBtn___BeQmx"
};
//#endregion
//#region source-snapshot/src/component/RewardCenter/ItemDeleteDrawer.module.scss
var import_ArrowBackIos = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _interopRequireWildcard = require_interopRequireWildcard();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	exports.default = (0, _interopRequireDefault(require_createSvgIcon()).default)(/*#__PURE__*/ React.createElement("path", { d: "M11.67 3.87L9.9 2.1 0 12l9.9 9.9 1.77-1.77L3.54 12z" }), "ArrowBackIos");
})))());
var ItemDeleteDrawer_module_default = {
	deleteContainer: "deleteContainer___31fco",
	deleteBox: "deleteBox___t2c4F",
	deleteList: "deleteList___tC4o6",
	itemBox: "itemBox___aGGT-",
	itemLeft: "itemLeft___KoQXY",
	opt: "opt___07x71",
	price: "price___YCvtQ",
	note: "note___BtEey",
	sizePrice: "sizePrice___0WBUe",
	comboDeleteList: "comboDeleteList___6GgSd",
	calcBox: "calcBox___LV0bs",
	sidenavBox: "sidenavBox___-Dh1X",
	sidenavTitle: "sidenavTitle___1cp2-",
	comboItemBox: "comboItemBox___DhnL1",
	muiDiyIcon: "muiDiyIcon___VOR3r",
	btnDis: "btnDis___--I0g",
	btnEn: "btnEn___KjOFA",
	qty: "qty___11dgB",
	deleteBottom: "deleteBottom___Wi9RZ",
	cartIcon: "cartIcon___V4Ofg",
	cart: "cart___dcE64",
	count: "count___guFCV",
	addCart: "addCart___kegc1",
	itemName: "itemName___yBNw0"
};
//#endregion
//#region source-snapshot/src/component/deleteDishModal/deleteDishModal.module.scss
var import_Add = /* @__PURE__ */ __toESM(require_Add());
var import_Remove = /* @__PURE__ */ __toESM(require_Remove());
var deleteDishModal_module_default = {
	containerBox: "containerBox___oApox",
	itemBox: "itemBox___-5ME3",
	itemName: "itemName___UgUQB",
	subItemName: "subItemName___d6Kdp",
	btnBox: "btnBox___ugZll"
};
//#endregion
//#region source-snapshot/src/component/deleteDishModal/index.js
var import_jsx_runtime = require_jsx_runtime();
var DeleteDishModal = class extends import_react.Component {
	render() {
		const { t, i18n: { language }, isShowModal, lastReuqireItem, requireCategory, handleContinue, handleCancel } = this.props;
		let subTitle = "";
		if (lastReuqireItem?.categoryId) {
			let itemName = "";
			let r = requireCategory.find((item) => item.id == lastReuqireItem.categoryId);
			if (r) itemName = getDishItemLanguage(r.fieldDisplayNameGroups, language) || r.name;
			subTitle = itemName + t("delete-sub-require-category");
		} else subTitle = t("delete-sub");
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			visible: isShowModal,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: deleteDishModal_module_default.containerBox,
				onClick: (e) => e.stopPropagation(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: deleteDishModal_module_default.itemBox,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: deleteDishModal_module_default.itemName,
						children: t("delete-dish")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: deleteDishModal_module_default.subItemName,
						children: subTitle
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: deleteDishModal_module_default.btnBox,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						onClick: handleCancel,
						children: t("think-again")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						onClick: handleContinue,
						className: "linear-animate-btn",
						children: t("delete")
					})]
				})]
			}),
			onClose: handleCancel
		});
	}
};
function mapStateToProps$2(state) {
	return { requireCategory: state.requireCategory };
}
var deleteDishModal_default = connect(mapStateToProps$2)(withTranslation()(DeleteDishModal));
//#endregion
//#region source-snapshot/src/assets/images/cart-bag.png
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var cart_bag_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMMAAADWCAMAAABbusawAAAASFBMVEX/tgAAAAD/tgD/uQD/twD/twD/tQD/tQD/tQD/uQD/tQD/tgD/tgD/twD/twD/uQD/tgD/tgD/tgD/tgD/tQD/tgD/uQD/tgBI5dDmAAAAGHRSTlOyAOgWm8u5WUIsb4Wn4L8LkdlOemQ3IdRfAnH2AAAFSklEQVR42tzY0XKrIBSF4UXAiELUGDXv/6bn7kz3jGhxKc3O/wB2vprAamH0xxuWsQ3uWEN4jYvh4g19HUHmvDVEhEEIWEVtiDiDdTgpZw0RYZgjTis2Jj/e4HFq+QjeYCNOLS4mL97QO5yc601WvGHC6dUmJ95gcUHWZMQbWlzQZDKiDT2uKPYmI9Yw438fcL7mGuRH6TM+TMcMAy5pMBmxhgjR0NhDNQ6iaDJiDdyhmD6iTUakwULkzOEc8cvgDAtEwRxuIA4mztBwhvQB501GnGGGqDWHmyAaTUacYSSPdf5JvKEmBqfME2+UM0zEp1jWEJccZ2ghmk1m/CnNG8Jpfwr3xCXHGQaIFnO8SFxyhIG8XWWO+HVQBsgM0Yv4alEGYm1SFzVp4A8T/qphDfxc4i+5TzXM1LPSht5uN95FL0s030XRpvu9oa8DdqpuogpMNxk2Ct7+yjBGoKjhsW2QOf8LQw38reF+4J+yyCfgeRN1yIh+2LhjWFDe8M59qcu2IWS/ft5Q5RrCpsHSH2He8MZu/ZZhpI9D3vDEbn7L0P6F4X4TPbDbtGUIxE8taGh5A7qMt3/FW31tGYYSBv6EGLYM7oKT5IKT2m0ZiBOd6Jn9uM8z5D/Opg2WWAdFDQtp4OcS//Wa04amjIE/5jxp4Ccff8mNaYM/ZgBKX3JTwsBMvtKXXJs21J9h6LBXSBumMpOPPyNc2tAWnUvp+4YxvAhD2UsubQiFJh//QJs0DIXmEv9il6TBEYayl9ycNBBfQdIgw26eNPBzib9wxpTBEobCF/WUYSB+ImHocscG2NkKlL/kAmng5xJ/0rmUwesxxJRhLDb5+H+5pgw1cauWvuRswjApMiwJQ0sstNKX3CwN2dO7qt7P5+NBTI3Ucf14PN9VVXXYzScMAXnd7133/wdyVe+q6rqM27JOGAboaUoYHPTUJgxQVPgCg1s3WCgqfoEB64YGmrJfYFhWDR6amlcNIzTlVw01NFWvGiZoalo1tNBUu2p4QVNh1RCgKScMGqc3EIVB4/QGIAwaZysA+wWG5adB5WwF5i8w+J8GlbMVqL/AMP00qJzecmxA5fSWYwMqp7ccG1A5veXYgMrpLccGVE5vOTagcnrLsQGV01uODeic3v+6uQNUB2EgAKLzsfBtERS1vf9R2yYmWegJZvcGg8i+gAbm34YF2QRs4KQ3nD8NK7YJ2MBJbyI2cLIVbgkaAjZw0htYEzQMbOCkN/BK0DCwgZTeERtI6R2xgZTecVEjpTexQUrviA2k9I7YQErviA2k9I7YQErviA2kbAVeCRo6NrCyFeYEDR0bWNkKjwQNR2+w0hu23mCld8AGVnoHbGCld8AGVnoHbGCld7g3Fiu9w6JGS+/QoKX3wAZatsIjQUPDBlq2wpagoWEDLVthSdDQsIGW3gMbaOk9sIGW3mNR46U37FeDl94dG3jp3bGBl94dG3jp3bGBl94dG3jZCmRoqNjAy1ZgStBQsYGYrTAnaKjYQEzvhg3E9G7YQExvOBI0VGwgpnfDBmJ6N2wgpnfDBmJ6N2wgpnfDBma2wpygYb8anninYAMzvS9sYGYrHAkaCjYw0/vCBmZ6A6XBzFZgTdDwxQZmel/YQE3vig3U9K7YQE3vig3U9K7YQM1WOBI0fLGBmt4VG6jpXbGBmq3AlKXBTO+KDdz0LtjAzVbYEzScnwY3vQs2cNO7YAM3vQs2cNO7YAM3vQs2cLMVmHI0uOkN3HM06N/p1b/jtgTnh+LWVf0gbtOnwXdlKHFm/TdY/Ov/4Vj2eDeF8VC9nNNfmTdZl0SOjGaxdQAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/component/RewardCenter/ItemDeleteDrawer.js
var defaultMax = 99;
var ItemDeleteDrawer = class extends import_react.Component {
	constructor() {
		super();
		this.state = {
			isShowMore: false,
			isScroll: false,
			deleteLoading: false,
			maxNum: defaultMax,
			deleteSequence: -1,
			cloneItemList: []
		};
	}
	orderDetailWriter = (item) => {
		const { i18n: { language } } = this.props;
		let price = null;
		let options = null;
		let cateOptions = null;
		let stack = [];
		if (item.sectionDetail) item.sectionDetail.forEach((sct) => {
			if (sct.id == -1) price = sct;
			if (sct.id == -2) options = sct;
			if (sct.id == -3) cateOptions = sct;
		});
		if (price) {
			let size = getItemSizeName(price.sizeInfo.sizeId, price.sizeInfo.size, this.props.itemSizeList, language);
			stack.push(size + "($" + price.sizeInfo.price + ") ");
		}
		if (options) {
			const optMap = this.getOptionMap(options.options);
			Object.keys(optMap).forEach((id, i) => {
				let str = optMap[id].name + (" ($" + optMap[id].price + ")") + (" x" + optMap[id].quantity) + (i < Object.keys(optMap).length - 1 ? ", " : "");
				stack.push(str);
			});
		}
		if (cateOptions) {
			const optMap = this.getOptionMap(cateOptions.options);
			Object.keys(optMap).forEach((id, i) => {
				let str = optMap[id].name + (" ($" + optMap[id].price + ")") + (" x" + optMap[id].quantity) + (Object.keys(optMap).length > 0 && i < Object.keys(optMap).length - 1 ? ", " : "");
				stack.push(str);
			});
		}
		if (item.sectionDetail) item.sectionDetail.forEach((sct) => {
			let itemsArr = [];
			if (sct.id > 0 && sct.items.length > 0) {
				sct.items.map((item) => {
					let str = "";
					if (!item.itemPrices) str = (getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name) + " ($" + item.price + ") x" + item.quantity;
					let optArr = [];
					if (item.selectedOptionList) item.selectedOptionList.forEach((list) => {
						if (list.id == -1) {
							let name = getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name;
							let size = getItemSizeName(list.sizeInfo.sizeId, list.sizeInfo.size, this.props.itemSizeList, language);
							optArr.push(`${name}(${size}) ($${list.sizeInfo.price})(x${item.quantity})`);
						} else {
							const subOptMap = this.getOptionMap(list.options);
							Object.keys(subOptMap).map((id) => {
								optArr.push(subOptMap[id].name + (" ($" + subOptMap[id].price + ")") + (" x" + subOptMap[id].quantity));
							});
						}
					});
					if (optArr.length > 0) {
						str += optArr.join(",");
						itemsArr.push(str);
					} else itemsArr.push(str);
				});
				stack.push(itemsArr);
			}
		});
		return stack.join("");
	};
	getOptionMap(options) {
		const { i18n: { language } } = this.props;
		const map = {};
		options.forEach((opt) => {
			let nameStr = opt?.fieldDisplayNameGroups?.length && getCurrentItemLanguage(opt.fieldDisplayNameGroups, language) || opt.name;
			if (map[opt.id]) map[opt.id].quantity++;
			else map[opt.id] = {
				id: opt.id,
				name: nameStr,
				quantity: 1,
				price: opt.price
			};
		});
		return map;
	}
	showCollectOptions = (list) => {
		const { i18n: { language } } = this.props;
		let sizeArr = [];
		let optionArr = [];
		if (list && list.length) list.forEach((item) => {
			if (item.sizeInfo) {
				let size = getItemSizeName(item.sizeInfo.sizeId, item.sizeInfo.size, this.props.itemSizeList, language);
				sizeArr.push(`${size}($${item.sizeInfo.price})`);
			}
			if (item.options && item.options.length) {
				let t = item.options.reduce((pre, cur) => {
					let nameStr = cur?.fieldDisplayNameGroups?.length && getCurrentItemLanguage(cur.fieldDisplayNameGroups, language) || cur.name;
					if (cur.id in pre) pre[cur.id].count++;
					else pre[cur.id] = {
						count: 1,
						name: nameStr,
						price: cur.price
					};
					return pre;
				}, {});
				let tArr = [];
				for (let g in t) tArr.push(t[g]);
				tArr.forEach((tItem) => {
					optionArr.push(`${tItem.name}($${tItem.price})x${tItem.count}`);
				});
			}
		});
		return [...sizeArr, ...optionArr].join(", ");
	};
	showCategoryOptions = (optionsList) => {
		const { i18n: { language } } = this.props;
		let optionArr = [];
		if (optionsList && optionsList.length) {
			let t = optionsList.reduce((pre, cur) => {
				let nameStr = cur?.fieldDisplayNameGroups?.length && getCurrentItemLanguage(cur.fieldDisplayNameGroups, language) || cur.name;
				if (cur.id in pre) pre[cur.id].count++;
				else pre[cur.id] = {
					count: 1,
					name: nameStr,
					price: cur.price
				};
				return pre;
			}, {});
			let tArr = [];
			for (let g in t) tArr.push(t[g]);
			tArr.forEach((tItem) => {
				optionArr.push(`${tItem.name}($${tItem.price})x${tItem.count}`);
			});
		}
		return optionArr.join(", ");
	};
	handleContinue = () => {
		const { t } = this.props;
		let cloneItemList = this.state.cloneItemList;
		let idx = cloneItemList.findIndex((c) => c.sequence == this.state.deleteSequence);
		if (idx > -1) cloneItemList.splice(idx, 1);
		this.setState({ cloneItemList });
		this.handleCancel();
	};
	handleCancel = () => {
		this.setState({ deleteLoading: false });
	};
	handleAddSubNum = (item, isSub = false) => {
		const { t } = this.props;
		let cloneItemList = this.state.cloneItemList;
		if (isSub) if (item.quantity - 1 < 1) this.setState({
			deleteLoading: true,
			deleteSequence: item.sequence
		});
		else {
			item.quantity -= 1;
			let idx = cloneItemList.findIndex((c) => c.sequence == item.sequence);
			if (idx > -1) {
				let cloneItem = (0, import_cloneDeep.default)(cloneItemList[idx]);
				cloneItem.quantity = item.quantity;
				cloneItemList.splice(idx, 1, cloneItem);
			}
			this.setState({ cloneItemList });
		}
		else {
			let newNum = item.quantity + 1;
			if (newNum <= this.state.maxNum) {
				item.quantity += 1;
				let idx = cloneItemList.findIndex((c) => c.sequence == item.sequence);
				if (idx > -1) {
					let cloneItem = (0, import_cloneDeep.default)(cloneItemList[idx]);
					cloneItem.quantity = item.quantity;
					cloneItemList.splice(idx, 1, cloneItem);
				}
				this.setState({ cloneItemList });
				if (newNum == this.state.maxNum) toast_default.info(t("max-up", { rplc: defaultMax }));
			}
		}
	};
	handleConfirm = () => {
		let cloneItemList = this.state.cloneItemList;
		let id = cloneItemList[0].id;
		this.props.handleConfirm(id, cloneItemList);
		this.props.handleCloseDeleteModal();
	};
	handleScroll = () => {
		if (!this.state.isScroll) this.setState({ isScroll: true }, () => {
			off(this.scrollDom, "scroll", this.handleScroll);
		});
	};
	componentDidMount() {
		const cloneItemList = (0, import_cloneDeep.default)(this.props.itemList.filter((o) => o.id == this.props.itemInfo.id));
		this.setState({ cloneItemList });
		if (this.scrollDom) on(this.scrollDom, "scroll", this.handleScroll);
	}
	componentDidUpdate() {
		if (!this.state.cloneItemList.length) {
			this.props.handleConfirm(this.props.itemInfo.id, []);
			this.props.handleCloseDeleteModal();
			return;
		}
		if (!this.state.isScroll) {
			let bool = !!(this.scrollDom.scrollHeight > this.scrollDom.offsetHeight);
			if (bool != this.state.isShowMore) this.setState({ isShowMore: bool });
		}
	}
	componentWillUnmount() {
		off(this.scrollDom, "scroll", this.handleScroll);
	}
	render() {
		let bottomTotalPrice = 0;
		let itemNum = 0;
		const { cloneItemList, maxNum, deleteLoading, isScroll, isShowMore } = this.state;
		const { t, i18n: { language }, itemInfo, handleCloseDeleteModal } = this.props;
		let deleteList = [];
		const title = getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name;
		const showFoodList = (0, import_cloneDeep.default)(cloneItemList);
		if (showFoodList.length) if (itemInfo.itemType == "SALE_ITEM" || itemInfo?.comboType == "FIXED_SELECTION") deleteList = showFoodList.map((item, idx) => {
			const isHasDiscount = Number(item.discount || 0) > 0;
			itemNum += item.quantity;
			let itemTotalPrice = Big(getItemPrice(item)).minus(item.discount || 0).toFixed(2);
			bottomTotalPrice = Big(bottomTotalPrice).plus(Big(itemTotalPrice).times(item.quantity)).toFixed(2);
			const isAddDisabled = item.quantity >= maxNum || isHasDiscount;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: ItemDeleteDrawer_module_default.itemBox,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ItemDeleteDrawer_module_default.itemName,
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ItemDeleteDrawer_module_default.itemLeft,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: ItemDeleteDrawer_module_default.opt,
								dangerouslySetInnerHTML: { __html: this.orderDetailWriter(item) }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: ItemDeleteDrawer_module_default.price,
								children: ["$", itemTotalPrice]
							}),
							item?.remark?.optionName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: ItemDeleteDrawer_module_default.note,
								children: item.remark.optionName
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ItemDeleteDrawer_module_default.calcBox,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
								"aria-label": "Remove",
								className: ItemDeleteDrawer_module_default.btnEn,
								onClick: () => {
									this.handleAddSubNum(item, true);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: ItemDeleteDrawer_module_default.muiDiyIcon })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: ItemDeleteDrawer_module_default.qty,
								children: item.quantity
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
								disabled: isAddDisabled,
								"aria-label": "Add",
								className: isAddDisabled ? ItemDeleteDrawer_module_default.btnDis : `${ItemDeleteDrawer_module_default.btnEn} animate-btn`,
								onClick: () => {
									this.handleAddSubNum(item);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: ItemDeleteDrawer_module_default.muiDiyIcon })
							})
						]
					})
				]
			}, item.id + "_" + idx);
		});
		else {
			showFoodList.forEach((clone) => {
				const OptList = clone.sectionDetail.find((c) => c.id == -2);
				const cateOptList = clone.sectionDetail.find((c) => c.id == -3);
				if (cateOptList) if (OptList) {
					let idx = clone.sectionDetail.findIndex((c) => c.id == -3);
					OptList.options.push(...cateOptList.options);
					clone.sectionDetail.splice(idx, 1);
				} else cateOptList.id = -2;
			});
			deleteList = showFoodList.map((item, index) => {
				let comboList = [];
				itemNum += item.quantity;
				let itemTotalPrice = Big(getItemPrice(item)).toFixed(2);
				bottomTotalPrice = Big(bottomTotalPrice).plus(Big(itemTotalPrice).times(item.quantity)).toFixed(2);
				if (item.sectionDetail && item.sectionDetail.length) comboList = item.sectionDetail.map((sct, idx) => {
					if (sct.id == -1) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ItemDeleteDrawer_module_default.sizePrice,
						children: [
							getItemSizeName(sct.sizeInfo.sizeId, sct.sizeInfo.size, this.props.itemSizeList, this.props.i18n.language),
							"($",
							sct.sizeInfo.price,
							")"
						]
					}, sct.id + "_" + idx);
					else if (sct.id == -2 && sct.options?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ItemDeleteDrawer_module_default.sidenavBox,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: ItemDeleteDrawer_module_default.sidenavTitle,
							children: [t("item_option"), ":"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ItemDeleteDrawer_module_default.comboItemBox,
							children: this.showCategoryOptions(sct.options)
						})]
					}, sct.id + "_" + idx);
					else if (sct.id > 0) {
						let sideNavName = "";
						const sideNav = item.comboSections.find((com) => com.id == sct.id);
						if (sideNav) sideNavName = sideNav?.fieldDisplayNameGroups?.length && getCurrentItemLanguage(sideNav.fieldDisplayNameGroups, language) || sideNav.name;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: ItemDeleteDrawer_module_default.sidenavBox,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: ItemDeleteDrawer_module_default.sidenavTitle,
								children: [sideNavName, ":"]
							}), sct.items.map((combo, sId) => {
								const comboName = combo?.fieldDisplayNameGroups?.length && getDishItemLanguage(combo.fieldDisplayNameGroups, language) || combo.name;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: ItemDeleteDrawer_module_default.comboBox,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: ItemDeleteDrawer_module_default.itemLeft,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: ItemDeleteDrawer_module_default.comboItemBox,
											children: [
												comboName,
												combo.selectedOptionList?.length ? ": " + this.showCollectOptions(combo.selectedOptionList) : null,
												combo.remark && combo.remark.optionName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: ItemDeleteDrawer_module_default.note,
													children: combo.remark.optionName
												})
											]
										}, combo.id + "_" + sId)
									})
								}, combo.id + "_" + sId);
							})]
						}, sct.id + "_" + idx);
					}
				});
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: ItemDeleteDrawer_module_default.comboDeleteList,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ItemDeleteDrawer_module_default.itemName,
							children: title
						}),
						comboList,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: ItemDeleteDrawer_module_default.price,
							children: ["$", itemTotalPrice]
						}),
						item?.remark?.optionName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ItemDeleteDrawer_module_default.note,
							children: item.remark.optionName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: ItemDeleteDrawer_module_default.calcBox,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									"aria-label": "Remove",
									className: ItemDeleteDrawer_module_default.btnEn,
									onClick: () => {
										this.handleAddSubNum(item, true);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Remove.default, { className: ItemDeleteDrawer_module_default.muiDiyIcon })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: ItemDeleteDrawer_module_default.qty,
									children: item.quantity
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fab_default, {
									disabled: item.quantity >= maxNum,
									"aria-label": "Add",
									className: item.quantity < maxNum ? `${ItemDeleteDrawer_module_default.btnEn} animate-btn` : ItemDeleteDrawer_module_default.btnDis,
									onClick: () => {
										this.handleAddSubNum(item);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_Add.default, { className: ItemDeleteDrawer_module_default.muiDiyIcon })
								})
							]
						})
					]
				}, item.id + "_" + index);
			});
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			isMountOnBody: true,
			visible: true,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: ItemDeleteDrawer_module_default.deleteContainer,
				onClick: handleCloseDeleteModal,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: ItemDeleteDrawer_module_default.deleteBox,
					onClick: (e) => e.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ItemDeleteDrawer_module_default.deleteList,
						ref: (el) => this.scrollDom = el,
						children: deleteList
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ItemDeleteDrawer_module_default.deleteBottom,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: ItemDeleteDrawer_module_default.cartIcon,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: cart_bag_default,
								className: `${ItemDeleteDrawer_module_default.cart}`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
								className: ItemDeleteDrawer_module_default.count,
								children: itemNum
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `${ItemDeleteDrawer_module_default.addCart} linear-animate-btn`,
							onClick: this.handleConfirm,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("confirm") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: ItemDeleteDrawer_module_default.price,
								children: ["$", bottomTotalPrice]
							})]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(deleteDishModal_default, {
					isShowModal: deleteLoading,
					handleContinue: this.handleContinue,
					handleCancel: this.handleCancel
				})]
			})
		});
	}
};
function mapStateToProps$1(state) {
	return { itemSizeList: state.itemSizeList };
}
var ItemDeleteDrawer_default = connect(mapStateToProps$1, {})(withTranslation()(ItemDeleteDrawer));
//#endregion
//#region source-snapshot/src/component/RewardCenter/ItemsDrawer.js
var MemoDishTag = (0, import_react.memo)(DishTag);
var ItemContext = (0, import_react.createContext)({
	tempValue: null,
	leftMax: 0,
	isCRMIntegrationItem: void 0,
	isPromotionItem: void 0,
	activityInfo: {},
	handleRemoveItem: () => {},
	handleClickItem: () => {},
	drawerType: null,
	getItemDisplayOriginalPrice: () => {}
});
var ItemsDrawer = (props) => {
	const { open, displayName, activityInfo, itemList, onClose, max = 9999, value, promotionBaseItems, onItemChange, handleConfirm, onSkip, selfConfig, i18n: { language, t }, getCurrentCategory, getCurrentItem, sideNavList, sideNavId, currentOrder, merchantProfile, currentCategoryList, currentOrderCombo, drawerType, beforeSelectItemCheck, isPromotionSelection = false, isExchangePurchase = false, showHiddenItems = false, menuItemList, setActivityCurrentItem, crm, promotion, excludePromotionRuleId } = props;
	useCloseModalOnHomePage(onClose);
	const orderDetailModal = (0, import_react.useRef)(null);
	const [orderPanelShow, setOrderPanelShow] = (0, import_react.useState)(false);
	const [comboPanelVisible, setComboPanelVisible] = (0, import_react.useState)(false);
	const [tempItemInfo, setTempItemInfo] = (0, import_react.useState)(null);
	const [tempValue, setTempValue] = (0, import_react.useState)(null);
	const addItemSourceRef = (0, import_react.useRef)(null);
	const syncedItemList = (0, import_react.useMemo)(() => {
		const displayItems = Array.isArray(itemList) ? itemList.filter((item) => showHiddenItems || !item?.hiddenItem) : [];
		if (!displayItems.length || !menuItemList) return displayItems;
		return displayItems.map((item) => {
			const latestItem = menuItemList[item?.isFreeItem ? item?.oId : item?.id];
			if (latestItem) return {
				...item,
				outOfStock: latestItem.outOfStock
			};
			return item;
		});
	}, [
		itemList,
		menuItemList,
		showHiddenItems
	]);
	const openOrderDetailModal = (ref) => {
		orderDetailModal.current = ref;
	};
	(0, import_react.useEffect)(() => {
		if (open && value?.length) setTempValue(value);
	}, [value, open]);
	(0, import_react.useEffect)(() => {
		if (!open) setTempValue(null);
	}, [open]);
	const selectedItemsInDrawer = (0, import_react.useMemo)(() => {
		return tempValue?.filter((each) => syncedItemList.find((i) => i.id === each.id)) || [];
	}, [tempValue, syncedItemList]);
	const currentQty = (0, import_react.useMemo)(() => {
		return selectedItemsInDrawer.reduce((pre, cur) => {
			return pre + cur.quantity;
		}, 0);
	}, [selectedItemsInDrawer]);
	const leftMax = (0, import_react.useMemo)(() => {
		return max - (currentQty || 0);
	}, [max, currentQty]);
	const handleAddNewItem = (itemInfo) => {
		const isFromHandleClickItem = addItemSourceRef.current === "handleClickItem";
		const stockState = {
			currentOrder,
			crm,
			promotion,
			menuItemList,
			currentOrderCombo
		};
		const stockContext = {
			itemList: currentOrder?.itemList,
			menuItemList,
			currentOrderCombo,
			crm,
			promotion,
			excludePromotionRuleId,
			drawerPendingItems: tempValue
		};
		if (itemInfo?.sectionDetail?.some((section) => section.id > 0 && section.items?.length) ? !validateComboSubmitStock(itemInfo, stockState, {
			drawerPendingItems: tempValue,
			excludePromotionRuleId
		}) : !isStockSufficient({
			itemInfo,
			addQty: itemInfo?.quantity || 1,
			...stockContext
		})) {
			showInsufficientStockToast(void 0, itemInfo, menuItemList);
			addItemSourceRef.current = null;
			return;
		}
		const totalChosenNum = currentQty + itemInfo?.quantity;
		if (isPromotionItem && activityInfo?.type === "orderItemFixedPrice" && (isFromHandleClickItem ? currentQty === quantityLimit : totalChosenNum > quantityLimit)) toast_default.info(t("quantity_limit_condition", { value: quantityLimit }));
		const newItem = {
			...itemInfo,
			uniqueItemTempId: v4()
		};
		if (onItemChange) {
			if (!onItemChange(newItem, {
				tempValue: tempValue || [],
				currentQty,
				leftMax
			})) return;
		}
		setTempValue([...tempValue || [], {
			...newItem,
			totalAmount: getItemPrice(newItem) * newItem?.quantity
		}]);
		addItemSourceRef.current = null;
	};
	const handleClickItem = (itemInfo) => {
		if (beforeSelectItemCheck && !beforeSelectItemCheck(itemInfo)) return;
		if (isCRMIntegrationItem || isPromotionItem && activityInfo?.type !== "orderItemFixedPrice") {
			if (leftMax <= 0) return toast_default.info(t("upper-limit"));
		}
		if ((itemInfo.itemType === "SALE_ITEM" ? judgeHasDetailInfo(itemInfo) : true) && onItemChange) {
			if (!onItemChange(itemInfo, {
				tempValue: tempValue || [],
				currentQty,
				leftMax,
				beforeConfigure: true
			})) return;
		}
		const itemData = {
			...itemInfo,
			remark: {
				optionName: "",
				optionType: "NOTE",
				quantity: 1,
				price: 0
			}
		};
		if (itemInfo.itemType === "SALE_ITEM") {
			if (judgeHasDetailInfo(itemInfo)) {
				setTempItemInfo(itemData);
				setOrderPanelShow(true);
				return;
			}
			const clonedItem = {
				...itemData,
				quantity: 1
			};
			if (clonedItem.itemPrices?.length === 1) {
				clonedItem.sectionDetail = [{
					id: -1,
					sizeInfo: Object.assign({}, clonedItem.itemPrices[0])
				}];
				clonedItem.price = 0;
			} else clonedItem.sectionDetail = [];
			addItemSourceRef.current = "handleClickItem";
			handleAddNewItem(clonedItem);
			return;
		}
		if (itemInfo.comboType === "FIXED_SELECTION") {
			setTempItemInfo(itemData);
			setOrderPanelShow(true);
			return;
		}
		const comboItemData = attachCategoryOptionsToItem(itemData.categoryId != null ? itemData : {
			...itemData,
			categoryId: currentCategoryList?.find((category) => category.saleItems?.some((saleItem) => saleItem.id === itemData.id))?.id
		}, currentCategoryList);
		setTempItemInfo(comboItemData);
		setActivityCurrentItem(comboItemData);
		setComboPanelVisible(true);
	};
	const getItemDisplayOriginalPrice = ({ itemInfo }) => {
		return getItemDisplayPrice({
			itemInfo,
			isComboType: false,
			currentOrder,
			currentCategoryList,
			sideNavList,
			sideNavId,
			currentOrderCombo
		});
	};
	const [deleteDrawerVisible, setDeleteDrawerVisible] = (0, import_react.useState)(false);
	const [deleteItemInfo, setDeleteItemInfo] = (0, import_react.useState)(null);
	const handleRemoveItem = (itemInfo) => {
		if (!tempValue?.length) return;
		const quantity = tempValue.reduce((pre, cur) => {
			return cur.id === itemInfo.id ? pre + cur.quantity : pre;
		}, 0);
		if (itemInfo.itemType === "SALE_ITEM") {
			if (judgeHasDetailInfo(itemInfo) && quantity > 1) {
				setDeleteItemInfo(itemInfo);
				setDeleteDrawerVisible(true);
				return;
			}
			const idx = tempValue.findIndex((item) => item.id === itemInfo.id);
			if (idx !== -1) {
				if (tempValue[idx].quantity > 1) {
					setTempValue(tempValue.map((e, i) => {
						if (i === idx) return {
							...e,
							quantity: e.quantity - 1
						};
						return e;
					}));
					return;
				}
				setTempValue(tempValue.filter((_, i) => i !== idx));
			}
			return;
		}
		if (quantity <= 1) setTempValue(tempValue.filter((item) => item.id !== itemInfo.id));
		else {
			setDeleteItemInfo(itemInfo);
			setDeleteDrawerVisible(true);
		}
	};
	const handleRemoveComboItem = (id, itemList) => {
		const newItemList = tempValue.filter((item) => item.id !== id);
		setTempValue(newItemList.concat(itemList));
	};
	const handleClickConfirm = async () => {
		if (!tempValue?.length) return toast_default.info(t("category-tip-single"));
		if (!await handleConfirm(tempValue)) return;
		onClose();
	};
	const [contentListWrapper, setContentListWrapper] = (0, import_react.useState)(null);
	const [wrapperSize, setWrapperSize] = (0, import_react.useState)({
		width: 0,
		height: 0
	});
	const listRef = (0, import_react.useRef)(null);
	const scrollOffsetRef = (0, import_react.useRef)(0);
	const previousLayoutRef = (0, import_react.useRef)(null);
	(0, import_react.useLayoutEffect)(() => {
		if (!open || !contentListWrapper) return;
		return observeLayoutSize(contentListWrapper, (width) => {
			setWrapperSize({
				width,
				height: contentListWrapper.clientHeight
			});
		});
	}, [open, contentListWrapper]);
	const availableWidth = Math.max(0, wrapperSize.width - remToPx(9.72));
	const colNum = (0, import_react.useMemo)(() => handleCountRowNum({
		selfConfig,
		availableWidth
	}), [selfConfig, availableWidth]);
	const rowHeight = remToPx(50);
	const virtualDataList = (0, import_react.useMemo)(() => {
		if (!syncedItemList?.length) return [];
		return syncedItemList.reduce((preV, curV, index) => {
			const chunkIndex = Math.floor(index / colNum.count);
			if (!preV[chunkIndex]) preV[chunkIndex] = [];
			preV[chunkIndex].push(curV);
			return preV;
		}, []).concat({
			id: "emptyBox",
			groupId: "emptyBox",
			type: "emptyBox"
		});
	}, [syncedItemList, colNum]);
	const count = (0, import_react.useMemo)(() => {
		return virtualDataList?.length || 0;
	}, [virtualDataList]);
	(0, import_react.useLayoutEffect)(() => {
		if (!open) {
			previousLayoutRef.current = null;
			scrollOffsetRef.current = 0;
			return;
		}
		const previous = previousLayoutRef.current;
		const offset = scrollOffsetRef.current;
		const firstItemIndex = previous ? Math.floor(offset / previous.rowHeight) * previous.count : 0;
		const nextOffset = previous ? Math.floor(firstItemIndex / colNum.count) * rowHeight + Math.min(offset % previous.rowHeight, rowHeight - 1) : 0;
		previousLayoutRef.current = {
			count: colNum.count,
			rowHeight
		};
		listRef.current?.resetAfterIndex(0);
		listRef.current?.scrollTo(Math.max(0, Math.min(nextOffset, count * rowHeight - wrapperSize.height)));
	}, [
		open,
		colNum.count,
		rowHeight,
		count,
		wrapperSize.height
	]);
	const rowRender = (0, import_react.useCallback)(({ index: rowIndex, style }) => {
		const cate = virtualDataList[rowIndex];
		if (!cate) return null;
		if (cate.type === "emptyBox") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			index: rowIndex,
			style
		}, rowIndex);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			index: rowIndex,
			style,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: ItemsDrawer_module_default.contentList,
				children: cate.map((each, idx) => {
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
						itemInfo: each,
						cardStyle: getCardColumnStyle(colNum, idx)
					}, idx);
				})
			})
		}, rowIndex);
	}, [
		language,
		selfConfig,
		virtualDataList,
		colNum
	]);
	const totalNum = (0, import_react.useMemo)(() => {
		return selectedItemsInDrawer.reduce((pre, cur) => {
			return pre + (cur.quantity || 0);
		}, 0);
	}, [selectedItemsInDrawer]);
	const isCRMIntegrationItem = (0, import_react.useMemo)(() => {
		return activityInfo?.couponTemplateId;
	}, [activityInfo]);
	const isADSpecialPriceVoucher = !!isCRMIntegrationItem && activityInfo?.rewardType === "voucher" && activityInfo?.rewardRule?.redeemRule?.strategy === "setPrice" && !activityInfo?.isFreeItemVoucher;
	const isPromotionItem = (0, import_react.useMemo)(() => {
		return !!activityInfo?.activityRule;
	}, [activityInfo]);
	const minSpend = (0, import_react.useMemo)(() => {
		if (isCRMIntegrationItem) return activityInfo?.couponTemplate?.ruleExpression?.condition?.totalAmount;
		if (isPromotionItem) return activityInfo?.activityRule[0]?.totalAmount || activityInfo?.activityRule[0]?.satisfyPrice;
	}, [
		isCRMIntegrationItem,
		activityInfo,
		isPromotionItem
	]);
	const quantityLimit = (0, import_react.useMemo)(() => {
		if (isCRMIntegrationItem) return max;
		if (isPromotionItem) {
			const isFixedPrice = activityInfo?.type === "orderItemFixedPrice";
			return drawerType === "reward" ? isFixedPrice ? max : leftMax : 9999;
		}
	}, [
		isCRMIntegrationItem,
		max,
		isPromotionItem,
		activityInfo,
		drawerType,
		leftMax
	]);
	const totalPrice = (0, import_react.useMemo)(() => {
		let itemsToCalculate = selectedItemsInDrawer;
		if (isADSpecialPriceVoucher || activityInfo?.type === "orderItemFixedPrice") itemsToCalculate = filterPromotionThresholdItems(isADSpecialPriceVoucher ? tempValue || value || [] : [...promotionBaseItems || [], ...tempValue || []], (isADSpecialPriceVoucher ? activityInfo.couponTemplate?.ruleExpression?.condition : activityInfo.ruleExpression?.condition)?.itemFilter, { merchantId: merchantProfile?.merchantId });
		return itemsToCalculate.reduce((pre, cur) => {
			return pre + (getItemPrice({
				...cur,
				price: cur?.itemPrices?.length ? 0 : cur.price
			}) || 0) * cur?.quantity;
		}, 0);
	}, [
		tempValue,
		value,
		selectedItemsInDrawer,
		activityInfo,
		isADSpecialPriceVoucher,
		promotionBaseItems,
		merchantProfile?.merchantId
	]);
	const modalMax = (0, import_react.useMemo)(() => {
		return isCRMIntegrationItem ? 1 : activityInfo?.type === "orderItemFixedPrice" ? 9999 : leftMax;
	}, [
		isCRMIntegrationItem,
		activityInfo,
		leftMax
	]);
	const showMinSpend = (0, import_react.useMemo)(() => {
		return minSpend && totalPrice < minSpend && (isADSpecialPriceVoucher || !isCRMIntegrationItem && (drawerType !== "reward" || activityInfo?.type === "orderItemFixedPrice"));
	}, [
		isCRMIntegrationItem,
		isADSpecialPriceVoucher,
		minSpend,
		activityInfo,
		drawerType,
		totalPrice
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer, {
			onClose,
			closeIcon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ArrowBackIos.default, { style: {
				fontSize: 32,
				color: "#000"
			} }),
			title: displayName,
			placement: "bottom",
			open,
			rootStyle: { zIndex: 9999 },
			rootClassName: "special_items_drawer",
			maskClosable: false,
			children: [showMinSpend && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: ItemsDrawer_module_default.minSpend,
				children: t("how_money_get_condition", { value: `$${(minSpend - totalPrice).toFixed(2)}` })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: ItemsDrawer_module_default.specialItemContent,
				ref: setContentListWrapper,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemContext.Provider, {
					value: {
						tempValue,
						leftMax,
						isCRMIntegrationItem,
						isPromotionItem,
						activityInfo,
						handleRemoveItem,
						handleClickItem,
						drawerType,
						excludePromotionRuleId,
						getItemDisplayOriginalPrice
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VariableSizeList, {
						ref: listRef,
						width: "100%",
						height: wrapperSize.height,
						itemSize: () => rowHeight,
						estimatedItemSize: rowHeight,
						onScroll: ({ scrollOffset }) => {
							scrollOffsetRef.current = scrollOffset;
						},
						itemCount: count,
						overscanCount: 1,
						children: rowRender
					})
				}), onSkip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: ItemsDrawer_module_default.footerBtns,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
						className: ItemsDrawer_module_default.skipBtn,
						onClick: onSkip,
						children: t("skip")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
						className: ItemsDrawer_module_default.confirmBtn,
						onClick: handleClickConfirm,
						children: t("confirm_Items", { value: totalNum ?? 0 })
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
					className: ItemsDrawer_module_default.confirmBtn,
					onClick: handleClickConfirm,
					children: t("confirm_Items", { value: totalNum ?? 0 })
				})]
			})]
		}),
		orderPanelShow && tempItemInfo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(orderDetailModal_default, {
			isMountOnBody: true,
			excludePromotionRuleId,
			isSpecialItem: true,
			isPromotionItem: isPromotionSelection,
			isExchangePurchase,
			onAddFreeItem: handleAddNewItem,
			max: modalMax,
			orderPanelShow,
			itemInfo: tempItemInfo,
			onRef: openOrderDetailModal,
			onCloseModal: () => {
				setOrderPanelShow(false);
				setTempItemInfo(null);
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			isMountOnBody: true,
			visible: comboPanelVisible,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboPanel_default, {
				isSpecialItem: true,
				isPromotionItem: isPromotionSelection,
				isExchangePurchase,
				onAddFreeItem: handleAddNewItem,
				max: modalMax,
				itemInfo: tempItemInfo,
				itemPoints: tempItemInfo?.itemPoints || 0,
				itemVoucherPrice: tempItemInfo?.price || 0,
				onCloseModal: () => {
					setComboPanelVisible(false);
					setTempItemInfo(null);
				}
			})
		}),
		deleteDrawerVisible && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemDeleteDrawer_default, {
			itemInfo: deleteItemInfo,
			itemList: tempValue,
			handleCloseDeleteModal: () => setDeleteDrawerVisible(false),
			handleConfirm: handleRemoveComboItem
		})
	] });
};
var Item = connect(mapStateToProps, {
	getCurrentCategory,
	getCurrentItem
})(withTranslation()(({ t, itemInfo, cardStyle, selfConfig, currentOrder, currentOrderCombo, menuItemList, crm, promotion, i18n: { language } }) => {
	const { tempValue, leftMax, isCRMIntegrationItem, handleRemoveItem, handleClickItem, isPromotionItem, activityInfo, excludePromotionRuleId, drawerType, getItemDisplayOriginalPrice } = (0, import_react.useContext)(ItemContext);
	const renderPromotionTags = () => {
		const promotionType = itemInfo?.promotionRule?.promotion?.type;
		const activityRule = itemInfo?.promotionRule?.promotion?.activityRule;
		if (!promotionType || !activityRule.length || GIFT_PROMOTION_TYPE.includes(promotionType)) return null;
		const promotionRule = itemInfo?.promotionRule;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromotionTagsWrap, {
			tags: [getPromotionCenterActivityRuleText({
				t,
				activityRule,
				type: promotionType,
				promotionName: promotionRule?.promotion?.promotionName,
				selfConfig,
				promoCenterHitActivity: promotionRule
			})],
			className: "singleWrap"
		});
	};
	const tags = getItemCardProperties({
		itemInfo,
		selfConfig,
		matchOriginalId: false
	});
	const itemName = getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) || itemInfo.name;
	const isFreeItemVoucher = activityInfo?.isFreeItemVoucher === true;
	const originalPriceInfo = getItemDisplayOriginalPrice({ itemInfo: isFreeItemVoucher ? {
		...itemInfo,
		price: itemInfo.originalPrice ?? itemInfo.freeItemOriginPrice ?? 0
	} : itemInfo });
	const isShowPricePlus = originalPriceInfo.isShowIcon;
	const displaySpecialPrice = isFreeItemVoucher ? 0 : itemInfo.specialPrice;
	const isHasSpecialPrice = typeof displaySpecialPrice === "number";
	let specialPrice = null;
	if (isHasSpecialPrice) {
		specialPrice = Number(displaySpecialPrice).toFixed(2);
		if (isShowPricePlus) specialPrice += "+";
	}
	let originalPrice = Number(itemInfo.exchangePurchaseOriginalPrice ?? originalPriceInfo.price ?? 0).toFixed(2);
	if (isShowPricePlus) originalPrice += "+";
	const quantity = tempValue?.reduce((pre, cur) => {
		return cur.id === itemInfo.id ? pre + cur.quantity : pre;
	}, 0);
	const stoppedStatus = getItemStoppedStatus(itemInfo);
	const isSoldout = Boolean(stoppedStatus);
	const stockNum = selfConfig?.configMap?.id_74 !== false ? getRemainingStockNum({
		itemInfo,
		itemList: currentOrder?.itemList,
		menuItemList,
		currentOrderCombo,
		crm,
		promotion,
		excludePromotionRuleId,
		drawerPendingItems: tempValue
	}) : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: ItemsDrawer_module_default.specialItem,
		style: cardStyle,
		onClick: () => {
			if (isSoldout) return;
			handleClickItem(itemInfo);
		},
		children: [
			isSoldout && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: ItemsDrawer_module_default.soldout,
				children: stoppedStatus === "unavailable" ? t("item-unavailable") : t("sold-out")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: ItemsDrawer_module_default.itemImage,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
						selfConfig,
						itemInfo
					}),
					" ",
					selfConfig?.configMap?.id_74 !== false && stockNum !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ItemsDrawer_module_default.stockNum,
						children: t("item-stock-num", { stockNum: getStockNumDisplayValue(stockNum) })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ItemsDrawer_module_default.counter,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Counter, {
							quantity,
							handleReduce: () => handleRemoveItem(itemInfo),
							handleAdd: () => handleClickItem(itemInfo),
							max: isCRMIntegrationItem || isPromotionItem && activityInfo?.type !== "orderItemFixedPrice" ? leftMax + quantity : 9999
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: ItemsDrawer_module_default.specialItemInfo,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ItemsDrawer_module_default.itemName,
						children: itemName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoDishTag, {
						tagsInfo: tags,
						isItemCard: false
					}),
					renderPromotionTags(),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `${ItemsDrawer_module_default.itemPrice} ${tags.length > 0 ? ItemsDrawer_module_default.haveTagPrice : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: ItemsDrawer_module_default.originalPrice,
							style: isHasSpecialPrice ? { textDecoration: "line-through" } : null,
							children: ["$", originalPrice]
						}), isHasSpecialPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: ItemsDrawer_module_default.specialPrice,
							children: ["$", specialPrice]
						})]
					})
				]
			})
		]
	});
}));
function mapStateToProps(state) {
	return {
		crm: state.crm,
		promotion: state.promotion,
		selfConfig: state.selfConfig,
		sideNavList: state.sideNav.sideNavList,
		currentOrder: state.currentOrder,
		merchantProfile: state.merchantProfile,
		currentOrderCombo: state.currentOrderCombo,
		currentCategoryList: state.currentCategoryList,
		sideNavId: state.sideNav.sideNavId,
		menuItemList: state.menuItemList
	};
}
var ItemsDrawer_default = connect(mapStateToProps, {
	getCurrentCategory,
	getCurrentItem,
	setActivityCurrentItem
})(withTranslation()(ItemsDrawer));
//#endregion
//#region source-snapshot/src/hooks/useCrmPromotionContrary.js
var useCrmPromotionContrary = ({ onKeepCampaign } = {}) => {
	const currentOrder = useSelector((state) => state.currentOrder);
	const crm = useSelector((state) => state.crm);
	const promotion = useSelector((state) => state.promotion);
	const dispatch = useDispatch();
	const keepCampaignEvent = (0, import_react.useMemo)(() => `keep_crm_campaign_${v4()}`, []);
	(0, import_react.useEffect)(() => {
		if (!onKeepCampaign) return;
		EventBus.on(keepCampaignEvent, onKeepCampaign);
		return () => EventBus.off(keepCampaignEvent);
	}, [keepCampaignEvent, onKeepCampaign]);
	const itemList = (0, import_react.useMemo)(() => {
		return currentOrder.itemList || [];
	}, [currentOrder]);
	const handleCheckIsHasPromotion = () => {
		const promotionReward = isHasPromotionFn({
			promotion,
			itemList
		});
		if (promotionReward) {
			dispatch(changeCrmPromotionContraryInfo({
				visible: true,
				type: "promotion",
				content: promotionReward
			}));
			return true;
		}
		return false;
	};
	const handleCheckIsHasCampaign = () => {
		const { selectedFreeItem, selectedDiscount } = crm;
		const crmCampaignItem = isHasCRMCampaignFn({
			itemList,
			selectedFreeItem,
			selectedDiscount
		});
		if (crmCampaignItem) {
			dispatch(changeCrmPromotionContraryInfo({
				visible: true,
				type: "crm",
				content: crmCampaignItem,
				...onKeepCampaign ? { keepCampaignEvent } : {}
			}));
			return true;
		}
		return false;
	};
	return {
		handleCheckIsHasCampaign,
		handleCheckIsHasPromotion
	};
};
//#endregion
export { ItemDeleteDrawer_module_default as a, deleteDishModal_default as i, ItemsDrawer_default as n, cart_bag_default as r, useCrmPromotionContrary as t };
