import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { a as getDeviceOrientation, m as subscribeDeviceOrientation, s as isOpenVtkeyboadrd } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { o as useCloseModalOnHomePage } from "./hooks-DiifsOH5.js";
import { t as ComboHeader_default } from "./ComboHeader-DCNVP6mw.js";
import { t as LandscapeKeyboardManager } from "./landscapeKeyboardManager-BXsgiuB_.js";
import { t as IMG_HOST } from "./getImageHost-CiGAQi_-.js";
//#region source-snapshot/src/component/CallerBoard/index.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var index_module_default = {
	callerWrapper: "callerWrapper___zZUHF",
	title: "title___5BywU",
	contentWrapper: "contentWrapper___YCjPa",
	inputWrapper: "inputWrapper___S8PwJ",
	content: "content___2PM7v",
	showPhone: "showPhone___u13E0",
	confirmBtn: "confirmBtn___ag7sH",
	disableConfirm: "disableConfirm___FJI2d",
	horizontalWithImage: "horizontalWithImage___NV-Np",
	formWrapper: "formWrapper___Q1eAC",
	numberPlateImage: "numberPlateImage___mJjac",
	verticalWithImage: "verticalWithImage___e3XNf"
};
//#endregion
//#region source-snapshot/src/component/CallerBoard/index.js
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var import_jsx_runtime = require_jsx_runtime();
var CallerBoard = (props) => {
	const { onClose, setLocator, isShowDesc, selfConfig } = props;
	const [locatorVal, setLocatorVal] = (0, import_react.useState)("");
	const [keyboardToggle, setKeyboardToggle] = (0, import_react.useState)(false);
	const [orientation, setOrientation] = (0, import_react.useState)(getDeviceOrientation());
	const locatorInputRef = (0, import_react.useRef)(null);
	const keyboardManagerRef = (0, import_react.useRef)(null);
	useCloseModalOnHomePage(onClose);
	const { t } = useTranslation();
	(0, import_react.useEffect)(() => {
		if (getDeviceOrientation() !== "vertical") {
			keyboardManagerRef.current = new LandscapeKeyboardManager(() => locatorInputRef.current);
			keyboardManagerRef.current.setup();
		}
		return () => {
			keyboardManagerRef.current?.cleanup();
		};
	}, []);
	(0, import_react.useEffect)(() => subscribeDeviceOrientation(setOrientation), []);
	const numberPlateImageConfig = selfConfig?.configMap?.id_69 || {};
	const numberPlateImage = numberPlateImageConfig.status ? numberPlateImageConfig[`${orientation}Img`] : "";
	const showNumberPlateImage = Boolean(numberPlateImage);
	const changeLocator = (event, isVKboard = false) => {
		let value = isVKboard ? event : event.target.value;
		if (!/^\d*$/.test(value)) return;
		if (value?.length > 2) return;
		setLocatorVal(value);
	};
	const showKeyboard = () => {
		setKeyboardToggle(true);
	};
	const hideKeyboard = () => {
		setKeyboardToggle(false);
	};
	const handleConfirm = () => {
		if (!locatorVal) return;
		setLocator(locatorVal);
		onClose?.(locatorVal);
	};
	const handleKeyUp = (e) => {
		if (e.keyCode === 13) handleConfirm();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: index_module_default.callerWrapper,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboHeader_default, { handleGoBack: () => {
				setLocator("");
				onClose?.();
			} }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: (0, import_classnames.default)(index_module_default.pageContent, {
					[index_module_default.horizontalWithImage]: showNumberPlateImage && orientation === "horizontal",
					[index_module_default.verticalWithImage]: showNumberPlateImage && orientation === "vertical"
				}),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: index_module_default.formWrapper,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: index_module_default.title,
							children: t("callBoard-title")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: index_module_default.contentWrapper,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: index_module_default.content,
								children: t("callBoard-desc")
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: index_module_default.inputWrapper,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: locatorInputRef,
								placeholder: t("callBoard-input"),
								value: locatorVal,
								className: index_module_default.showPhone,
								onChange: changeLocator,
								onFocus: () => {
									if (!(getDeviceOrientation() === "vertical") && !isOpenVtkeyboadrd()) setTimeout(() => {
										keyboardManagerRef.current?.handleKeyboardChange();
									}, 300);
								},
								onBlur: () => {
									if (!(getDeviceOrientation() === "vertical") && !isOpenVtkeyboadrd()) setTimeout(() => {
										keyboardManagerRef.current?.handleKeyboardClose();
									}, 300);
								},
								onClick: () => {
									if (isOpenVtkeyboadrd()) showKeyboard();
								},
								type: "number",
								onKeyUp: handleKeyUp
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							onClick: handleConfirm,
							className: (0, import_classnames.default)(index_module_default.confirmBtn, !locatorVal ? index_module_default.disableConfirm : "animate-btn"),
							children: t("confirm")
						}),
						showNumberPlateImage && orientation === "vertical" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							className: index_module_default.numberPlateImage,
							src: `${IMG_HOST}/${numberPlateImage}`,
							alt: ""
						})
					]
				}), showNumberPlateImage && orientation === "horizontal" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					className: index_module_default.numberPlateImage,
					src: `${IMG_HOST}/${numberPlateImage}`,
					alt: ""
				})]
			}),
			keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
				keyboardType: "number",
				keyboardValue: locatorVal,
				handlePressEnter: handleConfirm,
				changeInput: (v) => changeLocator(v, true),
				closeKeyboard: () => hideKeyboard(),
				VKOuterStyle: { zIndex: 9999 }
			}) : null
		]
	});
};
var mapStateToProps = (state) => ({ selfConfig: state.selfConfig });
var CallerBoard_default = connect(mapStateToProps)(CallerBoard);
//#endregion
//#region source-snapshot/src/utils/navigatePartySizeIfNeeded.js
/**
* 购物车后续流程：若开启就餐人数选择，则先进入人数选择页
* @returns {boolean} 是否已跳转
*/
function navigatePartySizeIfNeeded(history, selfConfig) {
	if (selfConfig?.configMap?.id_62) {
		history.push("./partySizeSelection");
		return true;
	}
	return false;
}
//#endregion
export { CallerBoard_default as n, navigatePartySizeIfNeeded as t };
