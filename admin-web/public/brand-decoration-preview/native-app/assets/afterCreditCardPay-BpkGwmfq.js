import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { D as posFrontLog, R as sendPayment, a as getDeviceOrientation, c as judgeSskeyIsActiveTime, r as getCookie, s as isOpenVtkeyboadrd } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { Bt as setIsReorderFlag, Gr as getOrderInfoObj, H as markPostPaymentAction, Kr as safeBig, Wr as generateSubmitOrderObj, an as setSelfConfig, ht as saveTipAmount, mt as savePaymentId, wn as spliceOrderBySoldout, wt as setCardPaidResult } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { a as getOrderInfo } from "./apiPos-BvOUwi7i.js";
import { t as XMLObjTree } from "./ObjectTree-D9iCBoZ6.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { t as LandscapeKeyboardManager } from "./landscapeKeyboardManager-BXsgiuB_.js";
import { a as shouldCollectTipAfterPayment } from "./tipPaymentMethods-DcvlIwUR.js";
import { i as TipBtn_default, n as getTipBasePrice, r as getTipConfig, t as calcTipAmount } from "./calcTipAmount-CM-HD12_.js";
import { t as signature_default } from "./signature-BxMW7vIb.js";
import { t as goToPaymentMemberOrFinish } from "./paymentMemberNavigation-B5bHxJaq.js";
import { t as require_lib } from "./lib-DuJXMpO6.js";
import { t as getOrderDetail } from "./getOrderDetail-DnTt-Usi.js";
import { n as buildPostPaymentTipRequest, r as getGiftCardCoveredTipAmount } from "./tipPaymentRequest-DtrN4zH5.js";
//#region source-snapshot/src/container/afterCreditCardPay/index.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var index_module_default = {
	afterPayContainer: "afterPayContainer___X5PnM",
	afterAllPayContainer: "afterAllPayContainer___8haUU",
	title: "title___9qbN5",
	panelSubTitle: "panelSubTitle___mDBbs",
	content: "content___vwTKL",
	tipItems: "tipItems___bliho",
	basicTip: "basicTip___tfEEW",
	middleTip: "middleTip___yUwR-",
	largeTip: "largeTip___bcmaE",
	btnContainer: "btnContainer___fgLqu",
	configTip: "configTip___Ivf6Y",
	editBtn: "editBtn___QlYxq",
	actived: "actived___h-hw6",
	noActived: "noActived___RzhvM",
	containerBox: "containerBox___VS5t3",
	itemBox: "itemBox___RnP9C",
	itemName: "itemName___3BDlg",
	inputCustomTipBox: "inputCustomTipBox___Q4l2k",
	unit: "unit___r6Hwq",
	customInput: "customInput___ZI0By",
	btnBox: "btnBox___oJ8Tn"
};
//#endregion
//#region source-snapshot/src/container/afterCreditCardPay/index.js
var import_lib = /* @__PURE__ */ __toESM(require_lib());
var import_jsx_runtime = require_jsx_runtime();
var AfterCreditCardPay = class extends import_react.Component {
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
			errorApiMsg: "",
			errorApiShow: false,
			loading: false,
			keyboardToggle: false
		};
		this.timer = null;
		this.customTipInputRef = null;
		this.keyboardManager = null;
	}
	componentDidMount() {
		if (getDeviceOrientation() !== "vertical") {
			this.keyboardManager = new LandscapeKeyboardManager(() => this.customTipInputRef);
			this.keyboardManager.setup();
		}
	}
	componentWillUnmount() {
		if (this.timer) clearTimeout(this.timer);
		if (this.keyboardManager) this.keyboardManager.cleanup();
	}
	jumpRrrorPage = (payload) => {
		const resolved = typeof payload === "string" ? {
			code: "000",
			failureReason: payload,
			pay: 0
		} : {
			code: payload?.code ?? "000",
			failureReason: payload?.failureReason ?? "",
			pay: payload?.pay ?? 0
		};
		setTimeout(() => {
			this.props.history.push({
				pathname: "/connectionError",
				search: import_lib.default.stringify({
					pay: resolved.pay,
					code: resolved.code
				}),
				state: { failureReason: resolved.failureReason }
			});
		}, 2e3);
	};
	getTipContext = () => {
		const { store, allSysConfig, selfConfig } = this.props;
		const { defaultTipList } = this.state;
		const totalPrice = getTipBasePrice(getOrderInfoObj(store), allSysConfig);
		const { tipType, tipIptList } = getTipConfig(selfConfig, defaultTipList);
		return {
			totalPrice,
			tipType,
			tipIptList
		};
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
	handleConfirm = () => {
		const val = this.state.customNumber;
		const numVal = Number(val);
		if (!val || Number.isNaN(numVal) || numVal < 0 || numVal > 1e3) return false;
		this.setState({
			customTip: true,
			tipValue: safeBig(numVal).toFixed(2)
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
	parseLicenseXml = (data) => {
		let findAppInstances = data;
		let start = findAppInstances?.indexOf("<soap:Body>");
		let end = findAppInstances?.indexOf("</soap:Body>");
		findAppInstances = findAppInstances?.substring(start + 11, end);
		return (new XMLObjTree()?.parseXML(findAppInstances))?.fetchorderresponsetype?.order;
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
	getOrderInfo = async (orderId) => {
		try {
			const res = await getOrderInfo(orderId);
			return (res.data ? this.parseLicenseXml(res.data) || {} : {}).checksum;
		} catch (e) {
			this.showApiModalTip(e.message);
			this.setState({ loading: false });
		}
	};
	judgeCardPartiallyPaid = () => {
		const { cardPaidResult, currentOrder } = this.props;
		return !!(currentOrder.paymentType === "CREDIT_CARD" && cardPaidResult?.id && cardPaidResult?.status === "PARTIALLY_PAID");
	};
	handlePayTip = async (isNeedSign) => {
		const isCreditPartPay = this.judgeCardPartiallyPaid();
		const { currentOrder, t, cardPaidResult } = this.props;
		if (currentOrder?.postPaymentActions?.tipApplied) {
			if (isNeedSign) return true;
			this.goToPaymentMemberOrFinish();
			return true;
		}
		const orderData = generateSubmitOrderObj(this.props.store);
		const selectedTipAmount = this.calculateTipAmount();
		if (selectedTipAmount === null) {
			toast_default.info(t("please-select-tip"), "top");
			return false;
		}
		const tipAmount = currentOrder.paymentType === "GIFT_CARD" ? getGiftCardCoveredTipAmount({
			selectedTipAmount,
			availableBalance: this.props.giftCardPaymentInfo?.availableTipBalance
		}) : selectedTipAmount;
		const orderId = currentOrder.saveOrderResult.id;
		if (!isNeedSign) this.setState({ loading: true });
		const checksum = await this.getOrderInfo(orderId);
		if (!checksum) {
			this.jumpRrrorPage();
			return false;
		}
		let crmIntegrationDiscount = 0;
		if (orderData?.order?.discountList) {
			const crmIntegrationDiscountList = JSON.parse(orderData.order.discountList);
			if (crmIntegrationDiscountList?.length > 0) {
				const discountInfo = crmIntegrationDiscountList[0];
				if (discountInfo.type === "promotion" && !discountInfo?.extraInfo?.isItemDetailDiscount) crmIntegrationDiscount = discountInfo.amount;
				else if (!discountInfo.isReward && !discountInfo?.extraInfo?.isItemDetailDiscount) crmIntegrationDiscount = discountInfo.amount;
			}
		}
		const totalAmount = safeBig(orderData?.order?.totalPrice).plus(safeBig(orderData?.order?.totalTax)).plus(safeBig(tipAmount)).plus(safeBig(orderData?.order?.chargeTotal)).plus(safeBig(orderData?.order?.togoTotal)).minus(safeBig(orderData?.order?.rewardDiscount)).minus(safeBig(orderData?.order?.discount)).minus(safeBig(crmIntegrationDiscount)).toNumber();
		let paidAmount = 0;
		let amount = 0;
		if (isCreditPartPay) {
			paidAmount = safeBig(cardPaidResult?.unpaidInfo?.paid).plus(safeBig(tipAmount)).toNumber();
			amount = safeBig(cardPaidResult?.unpaidInfo?.paid).plus(safeBig(tipAmount)).toNumber();
		} else {
			paidAmount = totalAmount;
			amount = totalAmount;
		}
		const paymentObj = buildPostPaymentTipRequest({
			paymentType: currentOrder.paymentType,
			checksum,
			amount,
			paidAmount,
			paymentId: currentOrder.savePaymentId,
			tipAmount,
			sessionKey: getCookie("sessionKey")
		});
		try {
			const res = await sendPayment(paymentObj);
			posFrontLog(`Kiosk Start SendPayment [AfterCreditCardPay]
            tipAmount: ${tipAmount}; 
            TotalAmount: ${totalAmount}`);
			this.props.saveTipAmount(tipAmount);
			this.setState({ loading: false });
			if (res.data.result.successful) {
				this.props.markPostPaymentAction("tipApplied");
				this.props.savePaymentId(res.data.id);
				posFrontLog(`Kiosk SendPayment Success [AfterCreditCardPay]
                    orderStatus: ${res?.data?.orderStatus} ; 
                    PaymentId: ${res?.data?.id} ; 
                    insufficientBalanceResponse-Balance: ${res?.data?.insufficientBalanceResponse?.balance} ;`);
				if (res.data.orderStatus === "PARTIALLY_PAID") {
					await judgeSskeyIsActiveTime();
					await getOrderDetail({
						orderId,
						setCardPaidResult: this.props.setCardPaidResult
					});
				}
				if (isNeedSign) return true;
				else this.goToPaymentMemberOrFinish();
			} else {
				this.showApiModalTip(res.data?.result?.failureReason);
				this.jumpRrrorPage({
					code: res.data?.result?.code ?? "000",
					failureReason: res.data?.result?.failureReason ?? "",
					pay: 0
				});
			}
		} catch (err) {
			this.props.saveTipAmount(0);
			this.showApiModalTip(err?.message);
			this.jumpRrrorPage({
				code: "000",
				failureReason: err?.message ?? "",
				pay: 0
			});
			this.setState({ loading: false });
		}
	};
	goToPaymentMemberOrFinish = () => goToPaymentMemberOrFinish({
		history: this.props.history,
		allSysConfig: this.props.allSysConfig,
		crm: this.props.crm,
		currentOrder: this.props.currentOrder
	});
	renderTitle = (isShowSign, isShowTip) => {
		const { t } = this.props;
		if (isShowSign && isShowTip) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: index_module_default.title,
			children: t("tip-sign")
		});
		if (isShowSign) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index_module_default.title,
			children: [t("sign-title"), " "]
		});
		if (isShowTip) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: index_module_default.title,
			children: t("choose_tip_description")
		});
	};
	showKeyboard = () => {
		this.setState({ keyboardToggle: true });
	};
	hideKeyboard = () => {
		this.setState({ keyboardToggle: false });
	};
	render() {
		const { t, selfConfig, currentOrder } = this.props;
		const { tipValue, customTip, customNumber, inputCustomTip, errorApiMsg, errorApiShow, loading, keyboardToggle } = this.state;
		const { totalPrice, tipType, tipIptList } = this.getTipContext();
		const isShowSign = currentOrder?.paymentType === "CREDIT_CARD" && selfConfig?.configMap?.id_23;
		const isShowTip = shouldCollectTipAfterPayment(selfConfig, currentOrder?.paymentType);
		const isShowNoTip = selfConfig?.configMap?.id_27;
		const isVertical = getDeviceOrientation() === "vertical";
		const configTipDom = tipIptList.map((val, idx) => {
			let tipVal = safeBig(totalPrice).times(safeBig(val)).div(100).toFixed(2);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: index_module_default.basicTip,
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
		let tipPart;
		if (!isShowTip) tipPart = null;
		if (isShowSign && isShowTip) tipPart = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: index_module_default.content,
			style: { width: isVertical ? "105rem" : "120rem" },
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: index_module_default.tipItems,
				children: [
					configTipDom,
					isShowNoTip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: index_module_default.basicTip,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TipBtn_default, {
							id: "noTip",
							text: t("no-tip"),
							selected: tipValue === 0 && !customTip,
							tipToggler: this.handleChooseNone
						}, "none")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `${index_module_default.basicTip} ${isShowNoTip ? index_module_default.middleTip : isVertical ? "" : index_module_default.largeTip}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TipBtn_default, {
							id: "customTip",
							text: customTip && tipValue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["$", tipValue] }) }) : t("custom"),
							selected: tipValue != null && customTip,
							tipToggler: this.showCustomTipInput
						}, "custom")
					})
				]
			})
		});
		else if (isShowTip && !isShowSign) tipPart = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: index_module_default.btnContainer,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: index_module_default.configTip,
				children: [
					configTipDom,
					isShowNoTip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: index_module_default.basicTip,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TipBtn_default, {
							id: "noTip",
							text: t("no-tip"),
							selected: tipValue === 0 && !customTip,
							tipToggler: this.handleChooseNone
						}, "none")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `${index_module_default.basicTip} ${isShowNoTip ? index_module_default.middleTip : isVertical ? "" : index_module_default.largeTip}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TipBtn_default, {
							id: "customTip",
							text: customTip && tipValue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["$", tipValue] }) }) : t("custom"),
							selected: tipValue != null && customTip,
							tipToggler: this.showCustomTipInput
						}, "custom")
					})
				]
			})
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `${index_module_default.afterPayContainer} ${isShowSign && isShowTip ? index_module_default.afterAllPayContainer : ""}`,
				children: [
					this.renderTitle(isShowSign, isShowTip),
					tipPart,
					isShowSign && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(signature_default, {
						showTitle: false,
						agreement: "bottom",
						customContainerStyle: { width: "100%" },
						handlePayTip: isShowTip && this.handlePayTip,
						signHeight: 300,
						history: this.props.history
					}),
					!isShowSign && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: () => this.handlePayTip(false),
						className: [index_module_default.editBtn, this.state.tipValue === null ? index_module_default.noActived : `${index_module_default.actived} linear-animate-btn`].join(" "),
						children: t("confirm")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: inputCustomTip,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: index_module_default.containerBox,
					onClick: (e) => e.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: index_module_default.itemBox,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: index_module_default.itemName,
							children: t("custom-tip")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: index_module_default.inputCustomTipBox,
							children: [customNumber && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: index_module_default.unit,
								children: "$"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: (el) => this.customTipInputRef = el,
								max: 1e3,
								min: 0,
								value: customNumber,
								autoFocus: true,
								className: index_module_default.customInput,
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
						className: index_module_default.btnBox,
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: loading }),
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
		] });
	}
};
function mapStateToProps(state) {
	return {
		store: state,
		currentOrder: state.currentOrder,
		selfConfig: state.selfConfig,
		allSysConfig: state.allSysConfig,
		crm: state.crm,
		cardPaidResult: state.cardPaidResult,
		giftCardPaymentInfo: state.giftCardPaymentInfo
	};
}
var afterCreditCardPay_default = connect(mapStateToProps, {
	saveTipAmount,
	spliceOrderBySoldout,
	setIsReorderFlag,
	setSelfConfig,
	savePaymentId,
	setCardPaidResult,
	markPostPaymentAction
})(withTranslation()(AfterCreditCardPay));
//#endregion
export { afterCreditCardPay_default as default };
