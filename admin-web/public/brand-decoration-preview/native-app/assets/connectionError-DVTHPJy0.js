import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { D as posFrontLog, F as send2Kitchen, N as saveOrder, O as printCall, c as judgeSskeyIsActiveTime, r as getCookie } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { G as payByCash, H as markPostPaymentAction, In as removeGiftCard, Ur as countAmount, W as payByCard, Wr as generateSubmitOrderObj, da as require_cloneDeep, di as copyMemberActivityOrderContext, mt as savePaymentId, pt as saveOrderResult, wt as setCardPaidResult } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { n as orderLockProcedure } from "./orderLock-9vtPVs0P.js";
import { a as getOrderInfo } from "./apiPos-BvOUwi7i.js";
import { t as XMLObjTree } from "./ObjectTree-D9iCBoZ6.js";
import { t as getChooseTableStatus } from "./chooseTable-BNJLkJ45.js";
import { t as canCancelPosOrder } from "./paymentCountdown-ORlaBDrV.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { a as sendError2MsgCenter, s as sendNewOrderMessage } from "./processZeroAmountOrder-bzVRsrOO.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { r as isTipEnabledForPayment } from "./tipPaymentMethods-DcvlIwUR.js";
import { t as CallModal } from "./callModal-DiGxH1ne.js";
import { t as getOrderDetail } from "./getOrderDetail-DnTt-Usi.js";
import { a as parseConnectionErrorRoute, i as resolveConnectionErrorUi, n as connectionError_module_default, t as warming_red_default } from "./warming_red-aH97Y3MT.js";
import { t as LoadingText } from "./loadingText-DXRQ4Fu1.js";
import { t as preserveOrderItemIds } from "./preserveOrderItemIds-B9N-X-X0.js";
//#region source-snapshot/src/container/connectionError/index.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_jsx_runtime = require_jsx_runtime();
var TEXTKEY = 2;
var ConnectionError = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			loading: false,
			errorApiMsg: "",
			errorApiShow: false,
			callLoading: false,
			callLoadObj: {},
			saveOrderId: "",
			textKey: TEXTKEY,
			showLoading: false
		};
		this.timer = null;
		this.getOrderDetailPromise = null;
		this.isSendingNewOrderMessage = false;
	}
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
		});
		this.props.history.push("./orderFinish");
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
	parseLicenseXml = (data) => {
		let findAppInstances = data;
		let start = findAppInstances?.indexOf("<soap:Body>");
		let end = findAppInstances?.indexOf("</soap:Body>");
		findAppInstances = findAppInstances?.substring(start + 11, end);
		return new XMLObjTree().parseXML(findAppInstances)?.fetchorderresponsetype?.order;
	};
	handleGetOrderInfo = async (orderId) => {
		const res = await getOrderInfo(orderId);
		return res.data ? this.parseLicenseXml(res.data) || {} : {};
	};
	getPaymentOrderId = () => {
		const { orderId } = parseConnectionErrorRoute(this.props.location);
		return orderId || native_store_default.getState().currentOrder?.saveOrderResult?.id;
	};
	getPaymentOrderSnapshot = (orderId) => {
		const currentSnapshot = native_store_default.getState().currentOrder?.saveOrderResult;
		if (String(currentSnapshot?.id ?? "") === String(orderId ?? "")) return currentSnapshot;
		const routeSnapshot = this.props.location?.state?.orderSnapshot;
		return String(routeSnapshot?.id ?? "") === String(orderId ?? "") ? routeSnapshot : null;
	};
	syncOrderChecksum = (orderDetail) => {
		if (orderDetail?.checksum) {
			const currentOrder = native_store_default.getState().currentOrder;
			if (String(currentOrder?.saveOrderResult?.id ?? "") === String(orderDetail?.id ?? this.getPaymentOrderId() ?? "")) this.props.saveOrderResult({
				...currentOrder.saveOrderResult,
				checksum: orderDetail.checksum
			});
		}
		return orderDetail;
	};
	submitOrder = async () => {
		const { allSysConfig, store: state, payByCash, payByCard, saveOrderResult } = this.props;
		const orderData = await generateSubmitOrderObj(state);
		try {
			let cloneOrderData = copyMemberActivityOrderContext(orderData, (0, import_cloneDeep.default)(orderData));
			const currentOrder = native_store_default.getState().currentOrder;
			if (currentOrder.saveOrderResult.checksum && currentOrder.saveOrderResult.id) {
				const order = cloneOrderData.order;
				order.id = currentOrder.saveOrderResult.id;
				order.checksum = currentOrder.saveOrderResult.checksum;
				preserveOrderItemIds(order.orderItems, currentOrder.saveOrderResult.orderItems);
			}
			if (allSysConfig?.CREDIT_CHARGE_ENABLE === "true") {
				const { cashPaymentTotal, creditPaymentTotal } = await countAmount(state, payByCash, payByCard);
				cloneOrderData = copyMemberActivityOrderContext(cloneOrderData, {
					...cloneOrderData,
					order: {
						...cloneOrderData.order,
						cashPaymentTotal,
						creditPaymentTotal
					}
				});
			}
			const res = await saveOrder(cloneOrderData);
			if (res.data.result.successful) {
				if (!(currentOrder.saveOrderResult.checksum && currentOrder.saveOrderResult.id)) {
					if (currentOrder.tableId) getChooseTableStatus(true);
				}
				const orderId = res.data.order.id;
				await saveOrderResult(res.data.order);
				const orderDetail = await getOrderDetail({
					orderId,
					setCardPaidResult: this.props.setCardPaidResult
				});
				this.syncOrderChecksum(orderDetail);
				const latestState = native_store_default.getState();
				const { orderType, tabelServiceType } = latestState.currentOrder;
				const selfConfig = latestState.selfConfig;
				if ((selfConfig?.configMap?.id_20 || []).includes(2)) await this.handleSendKitchen(orderId);
				const locatorType = selfConfig?.configMap?.id_28;
				if (orderType == "DINE_IN" && tabelServiceType == "DINE_IN" && locatorType === 0) {
					this.setState({ saveOrderId: res.data?.order?.id });
					setTimeout(() => {
						this.handlePrint();
					}, 0);
				} else this.handleSkip();
			} else {
				this.showApiModalTip(res.data?.result?.failureReason);
				this.setState({
					loading: false,
					showLoading: false
				});
				return;
			}
		} catch (err) {
			this.showApiModalTip(err?.message);
			this.setState({
				loading: false,
				showLoading: false
			});
			return;
		}
	};
	handleSendKitchen = async (orderId) => {
		const { currentOrder, markPostPaymentAction } = this.props;
		if (currentOrder?.postPaymentActions?.kitchenSent) return;
		const send2KitchenObj = {
			orderId,
			userAuth: { sessionKey: getCookie("sessionKey") },
			resend: false
		};
		try {
			if (!(await send2Kitchen(send2KitchenObj)).data.result.successful && orderId) sendError2MsgCenter(orderId, "Send to kitchen failed");
			else markPostPaymentAction("kitchenSent");
		} catch {
			if (orderId) sendError2MsgCenter(orderId, "Send to kitchen failed");
		}
	};
	handleCancelOrder = () => {
		native_store_default.getState().currentOrder;
		this.setState({ showLoading: true });
		judgeSskeyIsActiveTime().then(async () => {
			if (this.getOrderDetailPromise) try {
				await this.getOrderDetailPromise;
			} catch (error) {
				console.error("getOrderDetail failed:", error);
			}
			const { userId } = this.props;
			native_store_default.getState().currentOrder;
			const paymentOrderId = this.getPaymentOrderId();
			const data = {
				targetId: paymentOrderId,
				userId
			};
			const goHome = (reason, extra = "") => {
				this.setState({ showLoading: false });
				this.props.history.push("/");
			};
			if (!data?.targetId) {
				goHome("noTargetId");
				return;
			}
			const onErrCb = (apiRes) => {
				this.setState({ showLoading: false });
				this.showApiModalTip(apiRes?.data?.msg || "Lock Error");
			};
			if (!await orderLockProcedure(data, onErrCb)) return;
			let orderInfo = null;
			if (paymentOrderId) {
				orderInfo = await this.handleGetOrderInfo(paymentOrderId);
				this.syncOrderChecksum(orderInfo);
				const latestSaveOrderResult = this.getPaymentOrderSnapshot(paymentOrderId);
				if (canCancelPosOrder(orderInfo?.status) && latestSaveOrderResult) {
					const cancelOrderObj = { order: {
						...latestSaveOrderResult,
						checksum: orderInfo?.checksum || latestSaveOrderResult.checksum,
						needCommit: "2",
						discountList: "[]"
					} };
					cancelOrderObj.order.status = "CANCELED";
					if (cancelOrderObj.order.type === "CLOUD_GIFT_CARD") {
						const cancelOrder = cancelOrderObj.order;
						await removeGiftCard({
							checksum: cancelOrder.checksum,
							createTime: cancelOrder.createTime,
							orderId: cancelOrder.id,
							totalPrice: cancelOrder.totalPrice,
							discountRate: cancelOrder.discountRate,
							discountRateType: cancelOrder.discountRateType,
							discount: cancelOrder.discount,
							saleItemId: cancelOrder.orderItems?.[0].saleItemId,
							itemId: cancelOrder.orderItems?.[0].id,
							sessionKey: getCookie("sessionKey")
						});
					} else {
						if (cancelOrderObj.order?.orderItems?.length) cancelOrderObj.order.orderItems.map((item) => {
							item.status = "CANCELED";
						});
						await saveOrder(cancelOrderObj);
					}
				}
			}
			goHome("cancelFlowDone", `posOrderStatus=${orderInfo?.status || ""}`);
		}).catch((reason) => {
			console.log("reason", reason);
			this.setState({ showLoading: false });
		});
	};
	sendNewOrderMessageOnce = async (orderId, orderNumber, phoneNumber) => {
		const { currentOrder, markPostPaymentAction } = this.props;
		if (currentOrder?.postPaymentActions?.newOrderMessageSent || this.isSendingNewOrderMessage) return;
		this.isSendingNewOrderMessage = true;
		try {
			if ((await sendNewOrderMessage(orderId, orderNumber, phoneNumber))?.data?.result?.successful !== false) markPostPaymentAction("newOrderMessageSent");
		} finally {
			this.isSendingNewOrderMessage = false;
		}
	};
	runPostPaymentForRecoveredPayment = async (orderId, paidOrderInfo) => {
		const { selfConfig, setCardPaidResult } = this.props;
		const currentOrder = native_store_default.getState().currentOrder;
		if ((selfConfig?.configMap?.id_20 || []).includes(0) && this.needsPostPaymentRecovery(paidOrderInfo)) await this.handleSendKitchen(orderId);
		setCardPaidResult({});
		const orderNumber = currentOrder.saveOrderResult?.orderNumber ?? paidOrderInfo?.ordernumber;
		const paidOrderPhone = paidOrderInfo?.customer?.phone;
		const phoneNumber = currentOrder.saveOrderResult?.customer?.phone?.[0]?.number ?? (Array.isArray(paidOrderPhone) ? paidOrderPhone[0]?.number : paidOrderPhone?.number);
		await this.sendNewOrderMessageOnce(orderId, orderNumber, phoneNumber);
		const { orderType, tabelServiceType } = currentOrder;
		const locatorType = selfConfig?.configMap?.id_28;
		if (orderType === "DINE_IN" && tabelServiceType === "DINE_IN" && locatorType === 0) {
			this.setState({ saveOrderId: orderId });
			await judgeSskeyIsActiveTime();
			await this.handlePostPaymentPrint(orderId);
			return;
		}
		this.afterPayment();
	};
	handlePostPaymentPrint = async (orderId) => {
		if (native_store_default.getState().currentOrder?.postPaymentActions?.callTicketPrinted) {
			this.setState({
				callLoading: false,
				callLoadObj: {}
			});
			this.afterPayment();
			return;
		}
		this.setState({
			callLoading: true,
			callLoadObj: { msgDone: "ing" }
		});
		const printCallObj = {
			orderId,
			userAuth: { sessionKey: getCookie("sessionKey") }
		};
		try {
			if ((await printCall(printCallObj)).data.result.successful) {
				this.props.markPostPaymentAction("callTicketPrinted");
				this.setState({
					callLoading: false,
					callLoadObj: {}
				});
				this.afterPayment();
			} else {
				this.handleSetCallForAfterPayment("fail", orderId);
				sendError2MsgCenter(orderId, "printCall failed");
			}
		} catch {
			this.handleSetCallForAfterPayment("fail", orderId);
			sendError2MsgCenter(orderId, "printCall failed");
		}
	};
	handleSetCallForAfterPayment = (status, orderId) => {
		this.setState({
			callLoading: true,
			callLoadObj: {
				msgDone: status,
				handlePrint: () => this.handlePostPaymentPrint(orderId),
				handleSkip: this.afterPayment
			}
		});
	};
	afterPayment = () => {
		const { selfConfig } = this.props;
		const tipProcedure = selfConfig?.configList?.find((each) => each.id === 24)?.value;
		const isShowSign = selfConfig?.configList?.find((each) => each.id === 23)?.value;
		const isShowTip = isTipEnabledForPayment(selfConfig, "CREDIT_CARD");
		if (tipProcedure === 1) {
			if (!isShowSign && !isShowTip) {
				this.handleSkip();
				return;
			}
			this.props.history.push("/afterCreditCardPay");
			return;
		}
		isShowSign ? this.props.history.push("/signature") : this.handleSkip();
	};
	ifHadFinishePayment = async (orderId) => {
		this.setState({ loading: true });
		await new Promise((resolve) => setTimeout(resolve, 1500));
		const orderInfo = await this.handleGetOrderInfo(orderId);
		this.setState({ loading: false });
		if (orderInfo?.status === "PAID") return orderInfo;
		return null;
	};
	needsPostPaymentRecovery = (orderInfo) => {
		const sendToKitchenCount = orderInfo?.sendtokitchencount;
		return sendToKitchenCount === 0 || sendToKitchenCount === "0";
	};
	handleTryAgain = async () => {
		this.setState({ showLoading: true });
		try {
			const { userId } = this.props;
			native_store_default.getState().currentOrder;
			const paymentOrderId = this.getPaymentOrderId();
			if (paymentOrderId) {
				const orderId = paymentOrderId;
				const paidOrderInfo = await this.ifHadFinishePayment(orderId);
				if (paidOrderInfo) {
					const payments = paidOrderInfo?.payments;
					const paymentId = Array.isArray(payments) ? payments[0]?.id : payments?.id;
					if (paymentId) this.props.savePaymentId(paymentId);
					await this.runPostPaymentForRecoveredPayment(orderId, paidOrderInfo);
					this.setState({ showLoading: false });
					return;
				}
				const data = {
					targetId: orderId,
					userId
				};
				const onErrCb = (apiRes) => {
					this.setState({
						loading: false,
						showLoading: false
					});
					this.showApiModalTip(apiRes.data?.msg || "Lock Error");
				};
				if (!await orderLockProcedure(data, onErrCb)) {
					this.setState({ showLoading: false });
					return;
				}
				const { pay } = parseConnectionErrorRoute(this.props.location);
				if (pay === "0" || pay === 0) {
					await this.props.payByCard();
					this.setState({ showLoading: false });
					this.props.history.push("./cardPayment");
				} else if (pay === "1" || pay === 1) {
					await this.props.payByCash();
					judgeSskeyIsActiveTime().then(() => this.submitOrder());
				} else {
					toast_default.info("Invalid order, Please order again ");
					this.props.history.push("/");
				}
			} else {
				toast_default.info("Invalid order, Please order again ");
				this.props.history.push("/");
			}
		} catch (error) {
			this.setState({ showLoading: false });
		}
	};
	handlePayByCash = async () => {
		const { code, pay, failureReason, triposFailureCode } = parseConnectionErrorRoute(this.props.location);
		posFrontLog(`Kiosk Pay At Counter Clicked: ${JSON.stringify({
			source: "connectionError",
			orderId: this.getPaymentOrderId() || "",
			code,
			pay,
			failureReason,
			triposFailureCode,
			isTimeout: /timeout/i.test(failureReason)
		})}`).catch(() => {});
		this.setState({ showLoading: true });
		try {
			const { userId } = this.props;
			const currentOrder = native_store_default.getState().currentOrder;
			if (currentOrder?.saveOrderResult?.id) {
				const orderId = currentOrder.saveOrderResult.id;
				if (await this.ifHadFinishePayment(orderId)) {
					this.afterPayment();
					this.setState({ showLoading: false });
					return;
				}
				const data = {
					targetId: orderId,
					userId
				};
				const onErrCb = (apiRes) => {
					this.setState({
						loading: false,
						showLoading: false
					});
					this.showApiModalTip(apiRes.data.msg || "Lock Error");
				};
				if (!await orderLockProcedure(data, onErrCb)) {
					this.setState({ showLoading: false });
					return;
				}
				await this.props.payByCash();
				await this.submitOrder();
			} else {
				toast_default.info("Invalid order, Please order again ");
				this.props.history.push("/");
			}
		} catch (error) {
			this.setState({ showLoading: false });
			this.showApiModalTip(error?.message);
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
	componentDidMount() {
		const paymentOrderId = this.getPaymentOrderId();
		if (paymentOrderId) this.getOrderDetailPromise = getOrderDetail({
			orderId: paymentOrderId,
			setCardPaidResult: this.props.setCardPaidResult
		}).then((orderDetail) => this.syncOrderChecksum(orderDetail));
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
	}
	isBuyGiftCardOrder = () => {
		const { currentOrder, cardPaidResult } = this.props;
		return currentOrder?.saveOrderResult?.type === "CLOUD_GIFT_CARD" || cardPaidResult?.type === "CLOUD_GIFT_CARD";
	};
	render() {
		let { t, systemConfig, currentOrder, selfConfig } = this.props;
		const { loading, errorApiShow, errorApiMsg, callLoading, callLoadObj, textKey, showLoading } = this.state;
		const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
		const isGiftCardCreditCardPay = currentOrder.paymentTypeTrail?.includes("GIFT_CARD") && currentOrder.paymentTypeTrail?.includes("CREDIT_CARD");
		const isShowPayCash = currentOrder.paymentType == "CREDIT_CARD" && paymentRouteResult.canPayByCash && !this.isBuyGiftCardOrder() || isGiftCardCreditCardPay;
		const { code, failureReason, triposFailureCode, triposCardInputMode } = parseConnectionErrorRoute(this.props.location);
		const errUi = resolveConnectionErrorUi(code, failureReason, t, triposFailureCode, triposCardInputMode);
		const showPayCashButton = isShowPayCash;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: connectionError_module_default.cardPaymentFailurePage,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: warming_red_default,
					className: connectionError_module_default.failureImg,
					alt: ""
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: connectionError_module_default.ops,
					children: errUi.opsText
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: connectionError_module_default.failureDescription,
					children: [errUi.mainText, errUi.showSub ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: connectionError_module_default.breakLine }), errUi.subText] }) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: connectionError_module_default.btnBoxs,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `${connectionError_module_default.topBtn} ${!errUi.showTryAgain ? connectionError_module_default.topBtnSingle : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: connectionError_module_default.failureActionBtn,
							onClick: this.handleCancelOrder,
							children: t("cancel_order")
						}), errUi.showTryAgain ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: connectionError_module_default.tryAgainBtn,
							onClick: this.handleTryAgain,
							children: errUi.tryAgainText
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `${connectionError_module_default.bottomBtn} animate-btn`,
						onClick: this.handlePayByCash,
						style: { display: showPayCashButton ? "block" : "none" },
						children: t("payment-at-counter")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingText, {
					visible: loading,
					textKey
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: showLoading }),
				callLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallModal, {
					callLoading,
					loadObj: callLoadObj
				}) : null,
				errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
					variant: "filled",
					severity: "error",
					children: errorApiMsg
				}) : null
			]
		});
	}
};
function mapStateToProps(state) {
	return {
		store: state,
		currentOrder: state.currentOrder,
		systemConfig: state.systemConfig,
		selfConfig: state.selfConfig,
		userId: state.sysCookie.kioskConfigUserId,
		allSysConfig: state.allSysConfig,
		cardPaidResult: state.cardPaidResult
	};
}
var connectionError_default = withRouter(connect(mapStateToProps, {
	saveOrderResult,
	payByCard,
	payByCash,
	setCardPaidResult,
	markPostPaymentAction,
	savePaymentId
})(withTranslation()(ConnectionError)));
//#endregion
export { connectionError_default as default };
