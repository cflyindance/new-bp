import { d as __toESM, i as require_react } from "./toast-C8a1ReSo.js";
import { l as _extends, u as init_extends } from "./es-CFYDnMm2.js";
import { r as require_prop_types } from "./tiny-warning.esm-Cf7nlwXj.js";
import { n as init_objectWithoutProperties, t as _objectWithoutProperties } from "./objectWithoutProperties-DDcNLcsK.js";
import { _ as clsx, c as init_withStyles, d as darken, f as init_colorManipulator, h as chainPropTypes, i as createSvgIcon, l as withStyles, m as init_esm, n as init_utils, o as capitalize, p as lighten, s as init_capitalize, t as ButtonBase_default, u as alpha, v as init_clsx_m } from "./ButtonBase-CpioktX3.js";
//#region node_modules/@material-ui/core/esm/Paper/Paper.js
init_objectWithoutProperties();
init_extends();
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_prop_types = /* @__PURE__ */ __toESM(require_prop_types());
init_clsx_m();
init_esm();
init_withStyles();
var styles$2 = function styles(theme) {
	var elevations = {};
	theme.shadows.forEach(function(shadow, index) {
		elevations["elevation".concat(index)] = { boxShadow: shadow };
	});
	return _extends({
		root: {
			backgroundColor: theme.palette.background.paper,
			color: theme.palette.text.primary,
			transition: theme.transitions.create("box-shadow")
		},
		rounded: { borderRadius: theme.shape.borderRadius },
		outlined: { border: "1px solid ".concat(theme.palette.divider) }
	}, elevations);
};
var Paper = /*#__PURE__*/ import_react.forwardRef(function Paper(props, ref) {
	var classes = props.classes, className = props.className, _props$component = props.component, Component = _props$component === void 0 ? "div" : _props$component, _props$square = props.square, square = _props$square === void 0 ? false : _props$square, _props$elevation = props.elevation, elevation = _props$elevation === void 0 ? 1 : _props$elevation, _props$variant = props.variant, variant = _props$variant === void 0 ? "elevation" : _props$variant, other = _objectWithoutProperties(props, [
		"classes",
		"className",
		"component",
		"square",
		"elevation",
		"variant"
	]);
	return /*#__PURE__*/ import_react.createElement(Component, _extends({
		className: clsx(classes.root, className, variant === "outlined" ? classes.outlined : classes["elevation".concat(elevation)], !square && classes.rounded),
		ref
	}, other));
});
Paper.propTypes = {
	/**
	* The content of the component.
	*/
	children: import_prop_types.default.node,
	/**
	* Override or extend the styles applied to the component.
	* See [CSS API](#css) below for more details.
	*/
	classes: import_prop_types.default.object,
	/**
	* @ignore
	*/
	className: import_prop_types.default.string,
	/**
	* The component used for the root node.
	* Either a string to use a HTML element or a component.
	*/
	component: import_prop_types.default.elementType,
	/**
	* Shadow depth, corresponds to `dp` in the spec.
	* It accepts values between 0 and 24 inclusive.
	*/
	elevation: chainPropTypes(import_prop_types.default.number, function(props) {
		var classes = props.classes, elevation = props.elevation;
		if (classes === void 0) return null;
		if (elevation != null && classes["elevation".concat(elevation)] === void 0) return new Error("Material-UI: This elevation `".concat(elevation, "` is not implemented."));
		return null;
	}),
	/**
	* If `true`, rounded corners are disabled.
	*/
	square: import_prop_types.default.bool,
	/**
	* The variant to use.
	*/
	variant: import_prop_types.default.oneOf(["elevation", "outlined"])
};
var Paper_default = withStyles(styles$2, { name: "MuiPaper" })(Paper);
//#endregion
//#region node_modules/@material-ui/lab/esm/internal/svg-icons/SuccessOutlined.js
init_colorManipulator();
init_capitalize();
init_utils();
/**
* @ignore - internal component.
*/
var SuccessOutlined_default = createSvgIcon(/*#__PURE__*/ import_react.createElement("path", { d: "M20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.76,4 13.5,4.11 14.2, 4.31L15.77,2.74C14.61,2.26 13.34,2 12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0, 0 22,12M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z" }), "SuccessOutlined");
//#endregion
//#region node_modules/@material-ui/lab/esm/internal/svg-icons/ReportProblemOutlined.js
init_utils();
/**
* @ignore - internal component.
*/
var ReportProblemOutlined_default = createSvgIcon(/*#__PURE__*/ import_react.createElement("path", { d: "M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" }), "ReportProblemOutlined");
//#endregion
//#region node_modules/@material-ui/lab/esm/internal/svg-icons/ErrorOutline.js
init_utils();
/**
* @ignore - internal component.
*/
var ErrorOutline_default = createSvgIcon(/*#__PURE__*/ import_react.createElement("path", { d: "M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" }), "ErrorOutline");
//#endregion
//#region node_modules/@material-ui/lab/esm/internal/svg-icons/InfoOutlined.js
init_utils();
/**
* @ignore - internal component.
*/
var InfoOutlined_default = createSvgIcon(/*#__PURE__*/ import_react.createElement("path", { d: "M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20, 12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10, 10 0 0,0 12,2M11,17H13V11H11V17Z" }), "InfoOutlined");
//#endregion
//#region node_modules/@material-ui/lab/esm/internal/svg-icons/Close.js
init_utils();
/**
* @ignore - internal component.
*/
var Close_default = createSvgIcon(/*#__PURE__*/ import_react.createElement("path", { d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" }), "Close");
//#endregion
//#region node_modules/@material-ui/core/esm/IconButton/IconButton.js
init_extends();
init_objectWithoutProperties();
init_clsx_m();
init_esm();
init_withStyles();
var styles$1 = function styles(theme) {
	return {
		root: {
			textAlign: "center",
			flex: "0 0 auto",
			fontSize: theme.typography.pxToRem(24),
			padding: 12,
			borderRadius: "50%",
			overflow: "visible",
			color: theme.palette.action.active,
			transition: theme.transitions.create("background-color", { duration: theme.transitions.duration.shortest }),
			"&:hover": {
				backgroundColor: alpha(theme.palette.action.active, theme.palette.action.hoverOpacity),
				"@media (hover: none)": { backgroundColor: "transparent" }
			},
			"&$disabled": {
				backgroundColor: "transparent",
				color: theme.palette.action.disabled
			}
		},
		edgeStart: {
			marginLeft: -12,
			"$sizeSmall&": { marginLeft: -3 }
		},
		edgeEnd: {
			marginRight: -12,
			"$sizeSmall&": { marginRight: -3 }
		},
		colorInherit: { color: "inherit" },
		colorPrimary: {
			color: theme.palette.primary.main,
			"&:hover": {
				backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity),
				"@media (hover: none)": { backgroundColor: "transparent" }
			}
		},
		colorSecondary: {
			color: theme.palette.secondary.main,
			"&:hover": {
				backgroundColor: alpha(theme.palette.secondary.main, theme.palette.action.hoverOpacity),
				"@media (hover: none)": { backgroundColor: "transparent" }
			}
		},
		disabled: {},
		sizeSmall: {
			padding: 3,
			fontSize: theme.typography.pxToRem(18)
		},
		label: {
			width: "100%",
			display: "flex",
			alignItems: "inherit",
			justifyContent: "inherit"
		}
	};
};
/**
* Refer to the [Icons](/components/icons/) section of the documentation
* regarding the available icon options.
*/
var IconButton = /*#__PURE__*/ import_react.forwardRef(function IconButton(props, ref) {
	var _props$edge = props.edge, edge = _props$edge === void 0 ? false : _props$edge, children = props.children, classes = props.classes, className = props.className, _props$color = props.color, color = _props$color === void 0 ? "default" : _props$color, _props$disabled = props.disabled, disabled = _props$disabled === void 0 ? false : _props$disabled, _props$disableFocusRi = props.disableFocusRipple, disableFocusRipple = _props$disableFocusRi === void 0 ? false : _props$disableFocusRi, _props$size = props.size, size = _props$size === void 0 ? "medium" : _props$size, other = _objectWithoutProperties(props, [
		"edge",
		"children",
		"classes",
		"className",
		"color",
		"disabled",
		"disableFocusRipple",
		"size"
	]);
	return /*#__PURE__*/ import_react.createElement(ButtonBase_default, _extends({
		className: clsx(classes.root, className, color !== "default" && classes["color".concat(capitalize(color))], disabled && classes.disabled, size === "small" && classes["size".concat(capitalize(size))], {
			"start": classes.edgeStart,
			"end": classes.edgeEnd
		}[edge]),
		centerRipple: true,
		focusRipple: !disableFocusRipple,
		disabled,
		ref
	}, other), /*#__PURE__*/ import_react.createElement("span", { className: classes.label }, children));
});
IconButton.propTypes = {
	/**
	* The icon element.
	*/
	children: chainPropTypes(import_prop_types.default.node, function(props) {
		if (import_react.Children.toArray(props.children).some(function(child) {
			return /*#__PURE__*/ import_react.isValidElement(child) && child.props.onClick;
		})) return new Error([
			"Material-UI: You are providing an onClick event listener to a child of a button element.",
			"Firefox will never trigger the event.",
			"You should move the onClick listener to the parent button element.",
			"https://github.com/mui-org/material-ui/issues/13957"
		].join("\n"));
		return null;
	}),
	/**
	* Override or extend the styles applied to the component.
	* See [CSS API](#css) below for more details.
	*/
	classes: import_prop_types.default.object.isRequired,
	/**
	* @ignore
	*/
	className: import_prop_types.default.string,
	/**
	* The color of the component. It supports those theme colors that make sense for this component.
	*/
	color: import_prop_types.default.oneOf([
		"default",
		"inherit",
		"primary",
		"secondary"
	]),
	/**
	* If `true`, the button will be disabled.
	*/
	disabled: import_prop_types.default.bool,
	/**
	* If `true`, the  keyboard focus ripple will be disabled.
	*/
	disableFocusRipple: import_prop_types.default.bool,
	/**
	* If `true`, the ripple effect will be disabled.
	*/
	disableRipple: import_prop_types.default.bool,
	/**
	* If given, uses a negative margin to counteract the padding on one
	* side (this is often helpful for aligning the left or right
	* side of the icon with content above or below, without ruining the border
	* size and shape).
	*/
	edge: import_prop_types.default.oneOf([
		"start",
		"end",
		false
	]),
	/**
	* The size of the button.
	* `small` is equivalent to the dense button styling.
	*/
	size: import_prop_types.default.oneOf(["small", "medium"])
};
var IconButton_default = withStyles(styles$1, { name: "MuiIconButton" })(IconButton);
//#endregion
//#region node_modules/@material-ui/lab/esm/Alert/Alert.js
init_objectWithoutProperties();
init_extends();
init_clsx_m();
init_withStyles(), init_colorManipulator();
init_utils();
var styles = function styles(theme) {
	var getColor = theme.palette.type === "light" ? darken : lighten;
	var getBackgroundColor = theme.palette.type === "light" ? lighten : darken;
	return {
		root: _extends({}, theme.typography.body2, {
			borderRadius: theme.shape.borderRadius,
			backgroundColor: "transparent",
			display: "flex",
			padding: "6px 16px"
		}),
		standardSuccess: {
			color: getColor(theme.palette.success.main, .6),
			backgroundColor: getBackgroundColor(theme.palette.success.main, .9),
			"& $icon": { color: theme.palette.success.main }
		},
		standardInfo: {
			color: getColor(theme.palette.info.main, .6),
			backgroundColor: getBackgroundColor(theme.palette.info.main, .9),
			"& $icon": { color: theme.palette.info.main }
		},
		standardWarning: {
			color: getColor(theme.palette.warning.main, .6),
			backgroundColor: getBackgroundColor(theme.palette.warning.main, .9),
			"& $icon": { color: theme.palette.warning.main }
		},
		standardError: {
			color: getColor(theme.palette.error.main, .6),
			backgroundColor: getBackgroundColor(theme.palette.error.main, .9),
			"& $icon": { color: theme.palette.error.main }
		},
		outlinedSuccess: {
			color: getColor(theme.palette.success.main, .6),
			border: "1px solid ".concat(theme.palette.success.main),
			"& $icon": { color: theme.palette.success.main }
		},
		outlinedInfo: {
			color: getColor(theme.palette.info.main, .6),
			border: "1px solid ".concat(theme.palette.info.main),
			"& $icon": { color: theme.palette.info.main }
		},
		outlinedWarning: {
			color: getColor(theme.palette.warning.main, .6),
			border: "1px solid ".concat(theme.palette.warning.main),
			"& $icon": { color: theme.palette.warning.main }
		},
		outlinedError: {
			color: getColor(theme.palette.error.main, .6),
			border: "1px solid ".concat(theme.palette.error.main),
			"& $icon": { color: theme.palette.error.main }
		},
		filledSuccess: {
			color: "#fff",
			fontWeight: theme.typography.fontWeightMedium,
			backgroundColor: theme.palette.success.main
		},
		filledInfo: {
			color: "#fff",
			fontWeight: theme.typography.fontWeightMedium,
			backgroundColor: theme.palette.info.main
		},
		filledWarning: {
			color: "#fff",
			fontWeight: theme.typography.fontWeightMedium,
			backgroundColor: theme.palette.warning.main
		},
		filledError: {
			color: "#fff",
			fontWeight: theme.typography.fontWeightMedium,
			backgroundColor: theme.palette.error.main
		},
		icon: {
			marginRight: 12,
			padding: "7px 0",
			display: "flex",
			fontSize: 22,
			opacity: .9
		},
		message: { padding: "8px 0" },
		action: {
			display: "flex",
			alignItems: "center",
			marginLeft: "auto",
			paddingLeft: 16,
			marginRight: -8
		}
	};
};
var defaultIconMapping = {
	success: /*#__PURE__*/ import_react.createElement(SuccessOutlined_default, { fontSize: "inherit" }),
	warning: /*#__PURE__*/ import_react.createElement(ReportProblemOutlined_default, { fontSize: "inherit" }),
	error: /*#__PURE__*/ import_react.createElement(ErrorOutline_default, { fontSize: "inherit" }),
	info: /*#__PURE__*/ import_react.createElement(InfoOutlined_default, { fontSize: "inherit" })
};
var _ref = /*#__PURE__*/ import_react.createElement(Close_default, { fontSize: "small" });
var Alert = /*#__PURE__*/ import_react.forwardRef(function Alert(props, ref) {
	var action = props.action, children = props.children, classes = props.classes, className = props.className, _props$closeText = props.closeText, closeText = _props$closeText === void 0 ? "Close" : _props$closeText, color = props.color, icon = props.icon, _props$iconMapping = props.iconMapping, iconMapping = _props$iconMapping === void 0 ? defaultIconMapping : _props$iconMapping, onClose = props.onClose, _props$role = props.role, role = _props$role === void 0 ? "alert" : _props$role, _props$severity = props.severity, severity = _props$severity === void 0 ? "success" : _props$severity, _props$variant = props.variant, variant = _props$variant === void 0 ? "standard" : _props$variant, other = _objectWithoutProperties(props, [
		"action",
		"children",
		"classes",
		"className",
		"closeText",
		"color",
		"icon",
		"iconMapping",
		"onClose",
		"role",
		"severity",
		"variant"
	]);
	return /*#__PURE__*/ import_react.createElement(Paper_default, _extends({
		role,
		square: true,
		elevation: 0,
		className: clsx(classes.root, classes["".concat(variant).concat(capitalize(color || severity))], className),
		ref
	}, other), icon !== false ? /*#__PURE__*/ import_react.createElement("div", { className: classes.icon }, icon || iconMapping[severity] || defaultIconMapping[severity]) : null, /*#__PURE__*/ import_react.createElement("div", { className: classes.message }, children), action != null ? /*#__PURE__*/ import_react.createElement("div", { className: classes.action }, action) : null, action == null && onClose ? /*#__PURE__*/ import_react.createElement("div", { className: classes.action }, /*#__PURE__*/ import_react.createElement(IconButton_default, {
		size: "small",
		"aria-label": closeText,
		title: closeText,
		color: "inherit",
		onClick: onClose
	}, _ref)) : null);
});
Alert.propTypes = {
	/**
	* The action to display. It renders after the message, at the end of the alert.
	*/
	action: import_prop_types.default.node,
	/**
	* The content of the component.
	*/
	children: import_prop_types.default.node,
	/**
	* Override or extend the styles applied to the component.
	* See [CSS API](#css) below for more details.
	*/
	classes: import_prop_types.default.object,
	/**
	* @ignore
	*/
	className: import_prop_types.default.string,
	/**
	* Override the default label for the *close popup* icon button.
	*
	* For localization purposes, you can use the provided [translations](/guides/localization/).
	*/
	closeText: import_prop_types.default.string,
	/**
	* The main color for the alert. Unless provided, the value is taken from the `severity` prop.
	*/
	color: import_prop_types.default.oneOf([
		"error",
		"info",
		"success",
		"warning"
	]),
	/**
	* Override the icon displayed before the children.
	* Unless provided, the icon is mapped to the value of the `severity` prop.
	*/
	icon: import_prop_types.default.node,
	/**
	* The component maps the `severity` prop to a range of different icons,
	* for instance success to `<SuccessOutlined>`.
	* If you wish to change this mapping, you can provide your own.
	* Alternatively, you can use the `icon` prop to override the icon displayed.
	*/
	iconMapping: import_prop_types.default.shape({
		error: import_prop_types.default.node,
		info: import_prop_types.default.node,
		success: import_prop_types.default.node,
		warning: import_prop_types.default.node
	}),
	/**
	* Callback fired when the component requests to be closed.
	* When provided and no `action` prop is set, a close icon button is displayed that triggers the callback when clicked.
	*
	* @param {object} event The event source of the callback.
	*/
	onClose: import_prop_types.default.func,
	/**
	* The ARIA role attribute of the element.
	*/
	role: import_prop_types.default.string,
	/**
	* The severity of the alert. This defines the color and icon used.
	*/
	severity: import_prop_types.default.oneOf([
		"error",
		"info",
		"success",
		"warning"
	]),
	/**
	* The variant to use.
	*/
	variant: import_prop_types.default.oneOf([
		"filled",
		"outlined",
		"standard"
	])
};
var Alert_default = withStyles(styles, { name: "MuiAlert" })(Alert);
//#endregion
export { Alert_default as t };
