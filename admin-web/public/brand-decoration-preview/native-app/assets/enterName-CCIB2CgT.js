import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { D as posFrontLog, M as saveCustomerInfo, U as hasNonWhitespace, W as removeEmoji, a as getDeviceOrientation, s as isOpenVtkeyboadrd } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { Bt as setIsReorderFlag, Cr as judgeConfigToSoldout, G as payByCash, Ot as setCustomerName, Tr as judgeNeedPayOtherCharge, W as payByCard, Xr as checkCRMStatus, an as setSelfConfig, da as require_cloneDeep, lr as calcCardMinAmout, pt as saveOrderResult, w as customer, wn as spliceOrderBySoldout, yt as setAuthorizationDisplayName } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { t as LandscapeKeyboardManager } from "./landscapeKeyboardManager-BXsgiuB_.js";
import { n as processZeroAmountOrder, t as calculateTotalAmount } from "./processZeroAmountOrder-bzVRsrOO.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { o as shouldCollectTipBeforePayment, r as isTipEnabledForPayment } from "./tipPaymentMethods-DcvlIwUR.js";
import { t as soldoutModal_default } from "./soldoutModal-CCd1O5t5.js";
import { t as cardMinAmount_default } from "./cardMinAmount-DfJqO2k_.js";
import { t as judgeOnlyHaveFreeItem } from "./judgeOnlyHaveFreeItem-Bgp5tyri.js";
//#region source-snapshot/src/container/enterName/enterName.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var enterName_module_default = {
	enterNamePage: "enterNamePage___M6X0Z",
	enterNamePageBox: "enterNamePageBox___KSOSF",
	enterNameTitle: "enterNameTitle___havey",
	enterNameInput: "enterNameInput___WMKny",
	enterNoName: "enterNoName___yHg3x",
	searchIpt: "searchIpt___598h-",
	never: "never___vP-xG",
	authorizationBox: "authorizationBox___A2DFu",
	actived: "actived___2sYDw",
	noActived: "noActived___O-Ayi",
	confirmCusTip: "confirmCusTip___OnT-S",
	containerBox: "containerBox___KjB6A",
	itemBox: "itemBox___KVjYV",
	itemName: "itemName___vz5ar",
	subItemName: "subItemName___goOVP",
	btnBox: "btnBox___GmjDA"
};
//#endregion
//#region source-snapshot/src/container/enterName/index.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_jsx_runtime = require_jsx_runtime();
var EnterName = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			maxLen: 50,
			keyboardToggle: false,
			enterNameStr: "",
			isHasSoldoutDish: false,
			dishMap: {},
			errorLoading: false,
			errorApiMsg: "",
			errorApiShow: false,
			isShowCardMinModal: false,
			currentAmount: 0,
			isHasName: false,
			loading: false
		};
		this.timer = null;
		this.nameInputRef = null;
		this.keyboardManager = null;
		this.isSubmittingName = false;
		this.isSkipping = false;
		this.failedAction = null;
	}
	handleCancel = () => {
		this.failedAction = null;
		this.setState({ errorLoading: false });
	};
	handleRetry = () => {
		if (this.failedAction === "skip") {
			this.handleSkip();
			return;
		}
		this.handleConfirmName();
	};
	handleResetEmpty = () => {
		this.setState({ enterNameStr: "" });
	};
	backBtnHandler = () => {
		this.props.history.goBack();
		this.hideKeyboard();
	};
	keyboardChange = (event) => {
		let value = removeEmoji(event.target.value);
		if (value.length > this.state.maxLen) {
			value = value.substr(0, this.state.maxLen);
			event.target.value = value;
		}
		this.setState({ enterNameStr: value });
	};
	handleKeyDown = (e) => {
		if (e.keyCode === 13) this.handleConfirmName();
	};
	onChange = (input) => {
		if (input.length > this.state.maxLen) return;
		else this.setState({ enterNameStr: input });
	};
	saveEnterName = async (nameStr) => {
		const currentCustomer = this.props.currentOrder.customer;
		const currentPhone = currentCustomer?.phone?.[0];
		const phonenum = currentPhone?.number || "";
		try {
			const customerInfo = {
				id: "",
				firstName: "",
				phone: [{
					id: "",
					number: phonenum
				}]
			};
			this.props.customer(customerInfo);
			const response = await saveCustomerInfo(phonenum, nameStr);
			const result = response?.data?.result;
			const savedCustomer = response?.data?.customer;
			if (result?.successful) {
				if (!savedCustomer?.id || !savedCustomer?.phone?.[0]) posFrontLog("[EnterName] saveCustomerInfo returned an incomplete customer");
				const customerInfo = {
					id: savedCustomer?.id || currentCustomer?.id || "",
					firstName: nameStr,
					phone: [{
						id: savedCustomer?.phone?.[0]?.id || currentPhone?.id || "",
						number: phonenum
					}]
				};
				this.props.customer(customerInfo);
				await this.handleNevermind();
				return true;
			} else {
				this.failedAction = "confirm";
				posFrontLog(`[EnterName] saveCustomerInfo failed: ${result?.failureReason || "unknown reason"}`);
				this.setState({ errorLoading: true });
				return false;
			}
		} catch (error) {
			this.failedAction = "confirm";
			posFrontLog(`[EnterName] save or route failed: ${error?.message || String(error)}`);
			this.setState({ errorLoading: true });
			return false;
		}
	};
	handleConfirmName = async () => {
		if (this.isSubmittingName) return false;
		const nameStr = this.state.enterNameStr;
		if (!hasNonWhitespace(nameStr)) return false;
		this.isSubmittingName = true;
		this.props.setCustomerName(nameStr);
		try {
			return await this.saveEnterName(nameStr);
		} finally {
			this.isSubmittingName = false;
		}
	};
	handleSkip = async () => {
		if (this.isSkipping) return false;
		this.isSkipping = true;
		try {
			await this.handleNevermind();
			this.failedAction = null;
			return true;
		} catch (error) {
			this.failedAction = "skip";
			posFrontLog(`[EnterName] skip route failed: ${error?.message || String(error)}`);
			this.setState({ errorLoading: true });
			return false;
		} finally {
			this.isSkipping = false;
		}
	};
	handleNevermind = async () => {
		const { systemConfig, selfConfig, store, payByCash, saveOrderResult } = this.props;
		const onlyHaveFreeItem = judgeOnlyHaveFreeItem();
		const needPayForCharge = judgeNeedPayOtherCharge();
		const totalAmount = calculateTotalAmount(store);
		if (onlyHaveFreeItem && !needPayForCharge || totalAmount === 0) {
			if (totalAmount === 0) {
				const { userId: kioskConfigUserId } = this.props;
				this.setState({ loading: true });
				const result = await processZeroAmountOrder({
					store,
					payByCash,
					saveOrderResult,
					userId: null,
					checksum: null,
					kioskConfigUserId,
					onError: (errMsg) => {
						this.setState({ loading: false });
						this.showApiModalTip(errMsg);
					}
				});
				this.setState({ loading: false });
				if (result) this.props.history.push("/orderFinish");
				return;
			}
			this.judgeConfigToSoldout(() => {
				this.props.history.push("/paymentType");
			});
		} else this.judgeConfigToSoldout(() => {
			const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
			if (paymentRouteResult.shouldSkipPaymentType) {
				if (paymentRouteResult.canPayByCard) {
					this.props.payByCard();
					if (isTipEnabledForPayment(selfConfig, "CREDIT_CARD")) if (shouldCollectTipBeforePayment(selfConfig, "CREDIT_CARD")) this.props.history.push("/tippingPanel");
					else this.judgeConfigToSoldout(this.judgeFillCardMinAmout);
					else this.judgeConfigToSoldout(this.judgeFillCardMinAmout);
				} else if (paymentRouteResult.canPayByCash) this.props.history.push("/paymentType");
			} else this.props.history.push("/paymentType");
		});
	};
	judgeFillCardMinAmout = () => {
		if (calcCardMinAmout()) this.setState({
			isShowCardMinModal: true,
			currentAmount: calcCardMinAmout()
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
	judgeConfigToSoldout = (fn) => {
		judgeConfigToSoldout(fn, {
			setSelfConfig: this.props.setSelfConfig,
			setState: this.setState.bind(this),
			showApiModalTip: this.showApiModalTip,
			reorder: this.reorder
		});
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
	showKeyboard = () => {
		this.setState({ keyboardToggle: true });
	};
	hideKeyboard = () => {
		this.setState({ keyboardToggle: false });
	};
	handlePressEnter = () => {
		this.handleConfirmName();
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
			if (hasNonWhitespace(this.state.enterNameStr)) this.handleConfirmName();
			else this.handleNevermind();
		}, 0);
	};
	componentDidMount() {
		const { isReorderFlag } = this.props;
		if (isReorderFlag) this.backBtnHandler();
		this.handleGetDefaultName();
		if (getDeviceOrientation() !== "vertical") {
			this.keyboardManager = new LandscapeKeyboardManager(() => this.nameInputRef);
			this.keyboardManager.setup();
		}
	}
	componentDidUpdate(prevProps, prevState, snapshot) {
		if (prevProps.currentOrder.isAuthorizationDisplayName !== this.props.currentOrder.isAuthorizationDisplayName) this.handleGetDefaultName();
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
		if (this.keyboardManager) this.keyboardManager.cleanup();
	}
	handleGetDefaultName = () => {
		const { crm: { memberCRMInfo }, allSysConfig, currentOrder: { isAuthorizationDisplayName, customer: { firstName: inputName } } } = this.props;
		const isCRMDisabled = checkCRMStatus(allSysConfig);
		let defaultName = "";
		const { firstName, lastName } = memberCRMInfo;
		if (firstName || lastName) defaultName = `${firstName || ""} ${lastName || ""}`.replace(/^\s+|\s+$/g, "");
		const name = inputName || (isCRMDisabled ? "" : defaultName);
		this.setState({
			isHasName: !!name,
			enterNameStr: isAuthorizationDisplayName ? name : ""
		});
	};
	handleAuthorizeName = () => {
		this.props.setAuthorizationDisplayName(true);
	};
	render() {
		const { t, currentOrder, selfConfig } = this.props;
		const { errorLoading, enterNameStr, keyboardToggle, isHasSoldoutDish, dishMap, errorApiShow, errorApiMsg, isShowCardMinModal, currentAmount, isHasName } = this.state;
		const { isAuthorizationDisplayName } = currentOrder;
		const isValidName = hasNonWhitespace(enterNameStr);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: enterName_module_default.enterNamePage,
			style: { visibility: this.props.isReorderFlag ? "hidden" : "visible" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: enterName_module_default.enterNamePageBox,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: enterName_module_default.enterNameTitle,
							children: t("enter-your-name")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: [enterName_module_default.enterNameInput, !enterNameStr && enterName_module_default.enterNoName].join(" "),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: (el) => this.nameInputRef = el,
								autoFocus: false,
								maxLength: 50,
								className: enterName_module_default.searchIpt,
								onFocus: () => {
									window.scroll(0, 0);
									if (!(getDeviceOrientation() === "vertical") && !isOpenVtkeyboadrd()) setTimeout(() => {
										if (this.keyboardManager) this.keyboardManager.handleKeyboardChange();
									}, 300);
									else if (isOpenVtkeyboadrd()) this.showKeyboard();
								},
								onBlur: () => {
									window.scroll(0, 0);
									if (!(getDeviceOrientation() === "vertical") && !isOpenVtkeyboadrd()) setTimeout(() => {
										if (this.keyboardManager) this.keyboardManager.handleKeyboardClose();
									}, 300);
								},
								placeholder: t("your-name"),
								onClick: (event) => {
									event.stopPropagation();
									if (isOpenVtkeyboadrd()) this.showKeyboard();
								},
								value: enterNameStr,
								onChange: this.keyboardChange,
								onKeyDown: this.handleKeyDown
							})
						}),
						selfConfig?.configMap?.id_15 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: enterName_module_default.never,
							onClick: (event) => {
								event.stopPropagation();
								this.hideKeyboard();
								const resetname = (0, import_cloneDeep.default)(currentOrder.customer);
								resetname.firstName = "";
								this.props.customer(resetname);
								this.props.setCustomerName("");
								this.setState({ enterNameStr: "" }, () => {
									this.handleSkip();
								});
							},
							children: t("skip")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: [enterName_module_default.confirmCusTip, isValidName ? `${enterName_module_default.actived} linear-animate-btn` : enterName_module_default.noActived].join(" "),
							onClick: (event) => {
								event.stopPropagation();
								this.hideKeyboard();
								if (isValidName) this.handleConfirmName();
							},
							children: t("confirm")
						})
					]
				}),
				keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
					keyboardValue: enterNameStr,
					handlePressEnter: this.handlePressEnter,
					changeInput: this.onChange,
					closeKeyboard: this.hideKeyboard
				}) : null,
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
					visible: errorLoading,
					html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: enterName_module_default.containerBox,
						onClick: (e) => e.stopPropagation(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: enterName_module_default.itemBox,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: enterName_module_default.itemName,
								children: t("order-create-fail")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: enterName_module_default.subItemName,
								children: t("order-create-sub-fail")
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: enterName_module_default.btnBox,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								onClick: this.handleCancel,
								children: t("cancel-order")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								onClick: this.handleRetry,
								className: "linear-animate-btn",
								children: t("order-retry")
							})]
						})]
					}),
					onClose: this.handleCancel
				}),
				errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
					variant: "filled",
					severity: "error",
					children: errorApiMsg
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: this.state.loading })
			]
		});
	}
};
function mapStateToProps(state) {
	return {
		store: state,
		currentOrder: state.currentOrder,
		isReorderFlag: state.orderEdit.isReorderFlag,
		systemConfig: state.systemConfig,
		selfConfig: state.selfConfig,
		crm: state.crm,
		allSysConfig: state.allSysConfig,
		userId: state.sysCookie.kioskConfigUserId
	};
}
var enterName_default = withRouter(connect(mapStateToProps, {
	payByCard,
	payByCash,
	spliceOrderBySoldout,
	setIsReorderFlag,
	customer,
	setSelfConfig,
	setAuthorizationDisplayName,
	setCustomerName,
	saveOrderResult
})(withTranslation()(EnterName)));
//#endregion
export { enterName_default as default };
