import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { F as send2Kitchen, N as saveOrder, O as printCall, c as judgeSskeyIsActiveTime, r as getCookie } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { G as payByCash, H as markPostPaymentAction, Qi as Big, Ur as countAmount, W as payByCard, Wr as generateSubmitOrderObj, di as copyMemberActivityOrderContext, pt as saveOrderResult } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { n as orderLockProcedure } from "./orderLock-9vtPVs0P.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { t as getChooseTableStatus } from "./chooseTable-BNJLkJ45.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { a as sendError2MsgCenter } from "./processZeroAmountOrder-bzVRsrOO.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { t as CallModal } from "./callModal-DiGxH1ne.js";
import { t as LoadingText } from "./loadingText-DXRQ4Fu1.js";
//#region source-snapshot/src/component/cardMinAmount/cardMinAmount.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var cardMinAmount_module_default = {
	containerBox: "containerBox___aP8PI",
	title: "title___lPNr0",
	icon: "icon___2Q2Tj",
	itemBox: "itemBox___YM8XR",
	itemName: "itemName___ajevw",
	subItemName: "subItemName___2MJr3",
	btnBox: "btnBox___7dou7",
	cash: "cash___HW1s3",
	continueOrder: "continueOrder___T4Kdj",
	orderNoCash: "orderNoCash___-Kz6x"
};
//#endregion
//#region source-snapshot/src/component/cardMinAmount/index.js
var import_jsx_runtime = require_jsx_runtime();
var CardMinAmount = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			errorApiMsg: "",
			errorApiShow: false,
			loading: false,
			callLoadObj: {},
			saveOrderId: ""
		};
		this.timer = null;
	}
	handlePrint = () => {
		this.setState({
			callLoading: true,
			callLoadObj: { msgDone: "ing" }
		});
		judgeSskeyIsActiveTime().then(() => this.handlePrintCall());
	};
	handleSkip = () => {
		this.setState({
			callLoading: false,
			callLoadObj: {}
		}, () => {
			this.props.history.push("/orderFinish");
		});
	};
	handleSetCall = (status) => {
		this.setState({
			callLoading: true,
			callLoadObj: {
				msgDone: status,
				handlePrint: this.handlePrint,
				handleSkip: this.handleSkip
			}
		});
	};
	handlePrintCall = async () => {
		let orderId = this.state.saveOrderId;
		if (native_store_default.getState().currentOrder?.postPaymentActions?.callTicketPrinted) {
			this.handleSkip();
			return;
		}
		if (orderId) {
			const printCallObj = {
				orderId,
				userAuth: { sessionKey: getCookie("sessionKey") }
			};
			try {
				if ((await printCall(printCallObj)).data.result.successful) {
					this.props.markPostPaymentAction("callTicketPrinted");
					this.handleSkip();
				} else {
					this.handleSetCall("fail");
					sendError2MsgCenter(orderId, "printCall failed");
				}
			} catch {
				this.handleSetCall("fail");
				sendError2MsgCenter(orderId, "printCall failed");
			}
		}
	};
	handleChoosePayByCash = () => {
		this.props.payByCash();
		this.setState({ loading: true });
		judgeSskeyIsActiveTime().then(() => this.submitOrder());
	};
	submitOrder = async () => {
		const { allSysConfig, store, payByCash, payByCard, saveOrderResult } = this.props;
		let orderData = generateSubmitOrderObj(store);
		if (allSysConfig?.CREDIT_CHARGE_ENABLE === "true") {
			const { cashPaymentTotal, creditPaymentTotal } = await countAmount(store, payByCash, payByCard);
			orderData = copyMemberActivityOrderContext(orderData, {
				...orderData,
				order: {
					...orderData.order,
					cashPaymentTotal,
					creditPaymentTotal
				}
			});
		}
		try {
			const res = await saveOrder(orderData);
			if (res.data.result.successful) {
				const orderId = res.data.order.id;
				this.setState({ loading: false });
				saveOrderResult(res.data.order);
				const { currentOrder: { orderType, tabelServiceType, tableId }, selfConfig, userId } = this.props;
				const lockParm = {
					targetId: res.data.order?.id,
					userId
				};
				const onErrCb = (apiRes) => {
					this.setState({ loading: false });
					this.showApiModalTip(apiRes?.data?.msg || "Lock Error");
				};
				if (!await orderLockProcedure(lockParm, onErrCb)) return;
				if (tableId) getChooseTableStatus();
				if ((selfConfig?.configMap?.id_20 || []).includes(2)) {
					const send2KitchenObj = {
						orderId,
						userAuth: { sessionKey: getCookie("sessionKey") },
						resend: false
					};
					try {
						if (!(await send2Kitchen(send2KitchenObj)).data.result.successful && orderId) sendError2MsgCenter(orderId, "Send to kitchen failed");
					} catch {
						if (orderId) sendError2MsgCenter(orderId, "Send to kitchen failed");
					}
				}
				const locatorType = selfConfig?.configMap?.id_28;
				if (orderType == "DINE_IN" && tabelServiceType == "DINE_IN" && locatorType === 0) this.setState({ saveOrderId: orderId }, () => {
					this.handlePrint();
				});
				else this.handleSkip();
			} else {
				this.setState({ loading: false });
				this.showApiModalTip(res.data?.result?.failureReason);
			}
		} catch (err) {
			this.setState({ loading: false });
			this.showApiModalTip(err?.message);
		}
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
	render() {
		const { t, selfConfig, errorApiShow, errorApiMsg, systemConfig, isShowCardMinModal, currentAmount, handleContinueOrder, handleCloseMin } = this.props;
		const { loading, callLoading, callLoadObj } = this.state;
		const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
		const minCardAmount = selfConfig?.configMap?.id_21;
		const diff = Big(minCardAmount).minus(currentAmount).toFixed(2);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: isShowCardMinModal,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cardMinAmount_module_default.containerBox,
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cardMinAmount_module_default.itemIcon,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
								type: "svg_warn",
								size: 8
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cardMinAmount_module_default.itemBox,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cardMinAmount_module_default.itemName,
									children: t("card-min-title")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cardMinAmount_module_default.subItemName,
									children: t("card-min-amount", { rplc: `$${minCardAmount}` })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cardMinAmount_module_default.subItemName,
									children: t("card-min-current-amount", { rplc: `$${currentAmount}` })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cardMinAmount_module_default.subItemName,
									children: t("card-min-diff", { rplc: `$${diff}` })
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cardMinAmount_module_default.btnBox,
							children: [paymentRouteResult.canPayByCash && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cardMinAmount_module_default.cash,
								onClick: this.handleChoosePayByCash,
								children: t("card-min-by-cash")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: [
									"linear-animate-btn",
									cardMinAmount_module_default.continueOrder,
									!paymentRouteResult.canPayByCash && cardMinAmount_module_default.orderNoCash
								].join(" "),
								onClick: handleContinueOrder,
								children: t("card-min-continue")
							})]
						})
					]
				}),
				onClose: handleCloseMin
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingText, {
				visible: loading,
				textKey: 2
			}),
			callLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallModal, {
				callLoading,
				loadObj: callLoadObj
			}) : null,
			errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
				variant: "filled",
				severity: "error",
				children: errorApiMsg
			}) : null
		] });
	}
};
function mapStateToProps(state) {
	return {
		store: state,
		systemConfig: state.systemConfig,
		currentOrder: state.currentOrder,
		selfConfig: state.selfConfig,
		allSysConfig: state.allSysConfig,
		userId: state.sysCookie.kioskConfigUserId
	};
}
var cardMinAmount_default = withRouter(connect(mapStateToProps, {
	saveOrderResult,
	payByCard,
	payByCash,
	markPostPaymentAction
})(withTranslation()(CardMinAmount)));
//#endregion
export { cardMinAmount_default as t };
