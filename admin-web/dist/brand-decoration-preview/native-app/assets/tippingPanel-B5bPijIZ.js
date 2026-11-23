import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { a as getDeviceOrientation, s as isOpenVtkeyboadrd } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { Bt as setIsReorderFlag, Cr as judgeConfigToSoldout, Gr as getOrderInfoObj, Qi as Big, an as setSelfConfig, ht as saveTipAmount, lr as calcCardMinAmout, wn as spliceOrderBySoldout } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { t as LandscapeKeyboardManager } from "./landscapeKeyboardManager-BXsgiuB_.js";
import { i as TipBtn_default, n as getTipBasePrice, r as getTipConfig, t as calcTipAmount } from "./calcTipAmount-CM-HD12_.js";
import { t as require_lib } from "./lib-DuJXMpO6.js";
import { t as soldoutModal_default } from "./soldoutModal-CCd1O5t5.js";
import { t as cardMinAmount_default } from "./cardMinAmount-DfJqO2k_.js";
//#region source-snapshot/src/container/tippingPanel/tippingPanel.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var tippingPanel_module_default = {
	panelContainer: "panelContainer___dH-0O",
	panelTitle: "panelTitle___4z5or",
	panelSubTitle: "panelSubTitle___9Lu1x",
	btnContainer: "btnContainer___DUq-u",
	configTip: "configTip___9ymgk",
	basicTip: "basicTip___PrLOZ",
	middleTip: "middleTip___GlWme",
	largeTip: "largeTip___cpKNn",
	confirmBtnContainer: "confirmBtnContainer___i5mLL",
	actived: "actived___K1Khf",
	noActived: "noActived___DAJDi",
	containerBox: "containerBox___POGSG",
	itemBox: "itemBox___CAyEs",
	itemName: "itemName___ajr0h",
	inputCustomTipBox: "inputCustomTipBox___vLhes",
	unit: "unit___tvLbS",
	customInput: "customInput___COAIH",
	btnBox: "btnBox___OW14C",
	numPadContainer: "numPadContainer___uY9mI",
	numBox: "numBox___L-cQ8"
};
//#endregion
//#region source-snapshot/src/container/tippingPanel/index.js
var import_lib = /* @__PURE__ */ __toESM(require_lib());
var import_jsx_runtime = require_jsx_runtime();
var TippingPanel = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			defaultTipList: [
				15,
				20,
				25
			],
			savetip: "",
			tipValue: null,
			customTip: false,
			customNumber: "",
			inputCustomTip: false,
			isHasSoldoutDish: false,
			dishMap: {},
			errorApiMsg: "",
			errorApiShow: false,
			isShowCardMinModal: false,
			currentAmount: 0,
			keyboardToggle: false
		};
		this.timer = null;
		this.customTipInputRef = null;
		this.keyboardManager = null;
	}
	tipToggler = (val) => {
		this.setState({ tipValue: val });
	};
	showCustomTipInput = () => {
		if (this.state.customTip) this.setState({
			inputCustomTip: true,
			customNumber: this.state.tipValue || ""
		});
		else this.setState({
			tipValue: null,
			customNumber: "",
			inputCustomTip: true
		});
	};
	hideCustomTipInput = () => {
		this.setState({ inputCustomTip: false });
		this.hideKeyboard();
	};
	getTipContext = () => {
		const { store, allSysConfig, selfConfig } = this.props;
		const { defaultTipList } = this.state;
		const orderInfo = getOrderInfoObj(store);
		const totalPrice = getTipBasePrice(orderInfo, allSysConfig);
		const { tipType, tipIptList } = getTipConfig(selfConfig, defaultTipList);
		return {
			orderInfo,
			totalPrice,
			tipType,
			tipIptList
		};
	};
	restoreTipSelectionFromRoute = () => {
		const tipRouteQuery = import_lib.default.parse(this.props.location?.search, { ignoreQueryPrefix: true });
		const selectedTipValue = tipRouteQuery.tipValue;
		const numericTipValue = Number(selectedTipValue);
		if (tipRouteQuery.tipReturnTo !== "paymentType" || selectedTipValue === void 0 || !Number.isFinite(numericTipValue) || numericTipValue < 0) return;
		const customTip = tipRouteQuery.customTip === "true";
		const tipValue = customTip ? Big(numericTipValue).toFixed(2) : numericTipValue;
		this.setState({
			tipValue,
			customTip,
			customNumber: customTip ? tipValue : ""
		});
	};
	calculateTipAmount = () => {
		const { tipValue, customTip } = this.state;
		const { totalPrice, tipType } = this.getTipContext();
		return calcTipAmount({
			tipValue,
			customTip,
			tipType,
			totalPrice
		});
	};
	handleConfirm = () => {
		const val = this.state.customNumber;
		const numVal = Number(val);
		if (!val || Number.isNaN(numVal) || numVal < 0 || numVal > 1e3) return false;
		this.setState({
			customTip: true,
			tipValue: Big(numVal).toFixed(2)
		});
		this.hideCustomTipInput();
	};
	handleCustomChange = (event, isVKboard = false) => {
		let value = isVKboard ? event : event.target.value;
		if (!/^\d*\.?\d*$/.test(value)) return;
		if (value && Number(value) > 1e3) return;
		this.setState({ customNumber: value });
	};
	handleKeyUp = async (e) => {
		if (e.keyCode === 13) this.handleConfirm();
	};
	handleChooseNone = () => {
		this.setState({
			customTip: false,
			tipValue: 0
		});
	};
	backBtnHandler = () => {
		this.props.history.goBack();
	};
	handleConfirmPay = () => {
		const tipAmount = this.calculateTipAmount();
		if (tipAmount === null) return false;
		this.setState({ savetip: tipAmount }, () => {
			this.props.saveTipAmount(tipAmount);
			this.judgeConfigToSoldout(this.continuePayment);
		});
	};
	continuePayment = () => {
		const tipRouteQuery = import_lib.default.parse(this.props.location?.search, { ignoreQueryPrefix: true });
		if (tipRouteQuery.tipReturnTo === "paymentType") {
			const tipSelectionQuery = import_lib.default.stringify({
				...tipRouteQuery,
				tipValue: this.state.tipValue,
				customTip: this.state.customTip
			}, { addQueryPrefix: true });
			this.props.history.replace(`/tippingPanel${tipSelectionQuery}`);
			this.props.history.push("/paymentType?tipCompleted=true&tipBeforePaymentMethodCompleted=true");
			return;
		}
		if (["CASH", "GIFT_CARD"].includes(this.props.currentOrder?.paymentType)) {
			this.props.history.replace("/paymentType?tipCompleted=true");
			return;
		}
		this.judgeFillCardMinAmout();
	};
	judgeConfigToSoldout = (fn) => {
		judgeConfigToSoldout(fn, {
			setSelfConfig: this.props.setSelfConfig,
			setState: this.setState.bind(this),
			showApiModalTip: this.showApiModalTip,
			reorder: this.reorder
		});
	};
	judgeFillCardMinAmout = () => {
		const { savetip } = this.state;
		if (calcCardMinAmout(savetip)) this.setState({
			isShowCardMinModal: true,
			currentAmount: calcCardMinAmout(savetip)
		});
		else this.props.history.push("/cardPayment");
	};
	handleContinueOrder = () => {
		this.setState({ isShowCardMinModal: false });
		this.reorder(true);
	};
	handleCloseMin = () => {
		this.setState({ isShowCardMinModal: false });
	};
	reorder = (immediateBack = false) => {
		if (!immediateBack) {
			if (this?.state?.dishMap?.allSoldIds?.length) this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
		}
		this.setState({ isHasSoldoutDish: false });
		this.props.setIsReorderFlag(true);
		setTimeout(() => {
			this.backBtnHandler();
		}, 0);
	};
	continueReorder = () => {
		if (this?.state?.dishMap?.allSoldIds?.length) this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
		this.setState({ isHasSoldoutDish: false });
		setTimeout(() => {
			this.handleConfirmPay();
		}, 0);
	};
	showApiModalTip = (errMsg) => {
		this.setState({
			errorApiMsg: errMsg,
			errorApiShow: true
		});
		this.timer = setTimeout(() => {
			this.setState({
				errorApiMsg: "",
				errorApiShow: false
			});
		}, 2e3);
	};
	componentDidMount() {
		this.restoreTipSelectionFromRoute();
		if (getDeviceOrientation() !== "vertical") {
			this.keyboardManager = new LandscapeKeyboardManager(() => this.customTipInputRef);
			this.keyboardManager.setup();
		}
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
		if (this.keyboardManager) this.keyboardManager.cleanup();
	}
	showKeyboard = () => {
		this.setState({ keyboardToggle: true });
	};
	hideKeyboard = () => {
		this.setState({ keyboardToggle: false });
	};
	render() {
		const { t, selfConfig } = this.props;
		const { tipValue, customTip, customNumber, inputCustomTip, isHasSoldoutDish, dishMap, errorApiShow, errorApiMsg, isShowCardMinModal, currentAmount, keyboardToggle } = this.state;
		const { totalPrice, tipType, tipIptList } = this.getTipContext();
		const isShowNoTip = selfConfig?.configMap?.id_27;
		const configTipDom = tipIptList.map((val, idx) => {
			let tipVal = Big(totalPrice).times(val).div(100).toFixed(2);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: tippingPanel_module_default.basicTip,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TipBtn_default, {
					text: tipType == 1 ? `$${val.toFixed(2)}` : `$${tipVal}`,
					ratio: tipType == 1 ? "" : val,
					selected: tipValue == val && !customTip,
					tipToggler: () => {
						this.setState({ customTip: false }, () => {
							this.tipToggler(val);
						});
					}
				}, val + "_" + idx)
			});
		});
		const isVertical = getDeviceOrientation() === "vertical";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: tippingPanel_module_default.panelContainer,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: tippingPanel_module_default.panelTitle,
					children: t("choose_tip_description")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: tippingPanel_module_default.btnContainer,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: tippingPanel_module_default.configTip,
						children: [
							configTipDom,
							isShowNoTip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: tippingPanel_module_default.basicTip,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TipBtn_default, {
									id: "noTip",
									text: t("no-tip"),
									selected: tipValue === 0 && !customTip,
									tipToggler: this.handleChooseNone
								}, "none")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `${tippingPanel_module_default.basicTip} ${isShowNoTip ? tippingPanel_module_default.middleTip : isVertical ? "" : tippingPanel_module_default.largeTip}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TipBtn_default, {
									id: "customTip",
									text: customTip && tipValue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["$", tipValue] }) }) : t("custom"),
									selected: tipValue != null && customTip,
									tipToggler: this.showCustomTipInput
								}, "custom")
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: [tippingPanel_module_default.confirmBtnContainer, tipValue === null ? tippingPanel_module_default.noActived : `${tippingPanel_module_default.actived} linear-animate-btn`].join(" "),
						onClick: () => this.handleConfirmPay(),
						children: t("confirm")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
					visible: inputCustomTip,
					html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: tippingPanel_module_default.containerBox,
						onClick: (e) => e.stopPropagation(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: tippingPanel_module_default.itemBox,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: tippingPanel_module_default.itemName,
								children: t("custom-tip")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: tippingPanel_module_default.inputCustomTipBox,
								children: [customNumber && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: tippingPanel_module_default.unit,
									children: "$"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: (el) => this.customTipInputRef = el,
									max: 1e3,
									min: 0,
									value: customNumber,
									autoFocus: true,
									className: tippingPanel_module_default.customInput,
									type: "number",
									onChange: this.handleCustomChange,
									onKeyUp: this.handleKeyUp,
									onFocus: () => {
										if (!(getDeviceOrientation() === "vertical") && !isOpenVtkeyboadrd()) setTimeout(() => {
											if (this.keyboardManager) this.keyboardManager.handleKeyboardChange();
										}, 300);
										else if (isOpenVtkeyboadrd()) this.showKeyboard();
									},
									onBlur: () => {
										if (!(getDeviceOrientation() === "vertical") && !isOpenVtkeyboadrd()) setTimeout(() => {
											if (this.keyboardManager) this.keyboardManager.handleKeyboardClose();
										}, 300);
									},
									onClick: () => {
										if (isOpenVtkeyboadrd()) this.showKeyboard();
									}
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: tippingPanel_module_default.btnBox,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								onClick: this.hideCustomTipInput,
								children: t("cancel")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								onClick: this.handleConfirm,
								className: "linear-animate-btn",
								children: t("confirm")
							})]
						})]
					}),
					onClose: this.hideCustomTipInput
				}),
				isHasSoldoutDish ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(soldoutModal_default, {
					isHasSoldoutDish,
					dishMap,
					reorder: this.reorder,
					continueReorder: this.continueReorder
				}) : null,
				isShowCardMinModal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(cardMinAmount_default, {
					isShowCardMinModal,
					currentAmount,
					handleContinueOrder: this.handleContinueOrder,
					handleCloseMin: this.handleCloseMin
				}) : null,
				errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
					variant: "filled",
					severity: "error",
					children: errorApiMsg
				}) : null,
				keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
					keyboardType: "number",
					keyboardValue: customNumber,
					handlePressEnter: this.handleConfirm,
					changeInput: (v) => this.handleCustomChange(v, true),
					closeKeyboard: () => this.hideKeyboard(),
					VKOuterStyle: { zIndex: 9999 }
				}) : null
			]
		});
	}
};
function mapStateToProps(state) {
	return {
		store: state,
		currentOrder: state.currentOrder,
		selfConfig: state.selfConfig,
		allSysConfig: state.allSysConfig
	};
}
var tippingPanel_default = connect(mapStateToProps, {
	saveTipAmount,
	spliceOrderBySoldout,
	setIsReorderFlag,
	setSelfConfig
})(withTranslation()(TippingPanel));
//#endregion
export { tippingPanel_default as default };
