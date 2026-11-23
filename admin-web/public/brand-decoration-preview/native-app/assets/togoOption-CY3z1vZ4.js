import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { X as TOGONAMELIST } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { Bt as setIsReorderFlag, Cr as judgeConfigToSoldout, G as payByCash, S as clearTogoOption, Sr as judgeCharge, W as payByCard, an as setSelfConfig, da as require_cloneDeep, gn as setTogoOption, lr as calcCardMinAmout, pt as saveOrderResult, qt as setLocator, wn as spliceOrderBySoldout } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { r as isTipEnabledForPayment } from "./tipPaymentMethods-DcvlIwUR.js";
import { n as CallerBoard_default, t as navigatePartySizeIfNeeded } from "./navigatePartySizeIfNeeded-BuTz0eO5.js";
import { t as soldoutModal_default } from "./soldoutModal-CCd1O5t5.js";
import { t as cardMinAmount_default } from "./cardMinAmount-DfJqO2k_.js";
import { t as runJudgeSMSAfterOperation } from "./runJudgeSMSAfterOperation-CBdP8zKG.js";
import { t as require_round } from "./round-CmfkCJn-.js";
import { t as cardPayTipModal_default } from "./cardPayTipModal-LshELHlv.js";
//#region source-snapshot/src/container/togoOption/togoOption.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var togoOption_module_default = {
	togoPanel: "togoPanel___FJ572",
	togoPanelInner: "togoPanelInner___GgWp5",
	togoPanelTitle: "togoPanelTitle___tSkY6",
	togoPanelBox: "togoPanelBox___PHT6v",
	togoItem: "togoItem___N0wr6",
	checkIcon: "checkIcon___Z-zmd",
	name: "name___-WAWB",
	togoItemActived: "togoItemActived___Z7y9M",
	btnBox: "btnBox___bs0YI",
	actived: "actived___WUiaU",
	noActived: "noActived___4D8mZ",
	never: "never___vAk1R"
};
//#endregion
//#region source-snapshot/src/container/togoOption/index.js
var import_round = /* @__PURE__ */ __toESM(require_round());
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_jsx_runtime = require_jsx_runtime();
var TogoOption = class extends import_react.Component {
	constructor() {
		super();
		this.state = {
			isHasSoldoutDish: false,
			dishMap: {},
			errorApiMsg: "",
			errorApiShow: false,
			isShowCardMinModal: false,
			currentAmount: 0,
			isHasOrderCharge: false,
			showCallBoard: false,
			loading: false
		};
		this.callBoardPromiseResolve = null;
	}
	backBtnHandler = () => {
		this.props.history.goBack();
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
	handleChoose = (e) => {
		const togoList = (0, import_cloneDeep.default)(this.props.togoList);
		let r = togoList.find((t) => t.id == e.id);
		if (r.select.id) r.select = {};
		else r.select = e.select;
		this.props.setTogoOption(togoList);
	};
	showCurrentChoosed = (id) => {
		if (this.props.togoList.find((t) => t.id == id).select?.id) return true;
		else return false;
	};
	isConfirm = () => {
		return this.props.togoList.some((t) => t.select.id);
	};
	handleSkip = async () => {
		this.props.clearTogoOption();
		await this.judgeSMSAfterOperation();
	};
	judgeSMSAfterOperation = async () => {
		const { selfConfig, systemConfig, setLocator, currentOrder } = this.props;
		let taleBoxSelect = selfConfig?.charge?.find((t) => {
			return t.id === 4;
		});
		const togoList = (0, import_cloneDeep.default)(native_store_default.getState().togoList);
		if (taleBoxSelect?.select?.id) {
			for (let i = 0; i < togoList.length; i++) if (togoList[i].id === 4) {
				togoList[i] = {
					id: taleBoxSelect?.id,
					name: togoList[i].name,
					select: taleBoxSelect?.select
				};
				break;
			}
			this.props.setTogoOption(togoList);
		}
		const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
		setLocator("");
		const locatorType = selfConfig?.configMap?.id_28;
		const togoShowNumCards = selfConfig?.configMap?.id_36;
		if (locatorType === 1 && (currentOrder.orderType !== "TO_GO" || currentOrder.orderType === "TO_GO" && togoShowNumCards)) await this.showCallBoard();
		if (judgeCharge()) if (paymentRouteResult.onlyCard) this.setState({ isHasOrderCharge: true });
		else this.togoProcess();
		else if (!isTipEnabledForPayment(selfConfig, "CREDIT_CARD") && calcCardMinAmout() && paymentRouteResult.onlyCard) this.judgeConfigToSoldout(() => {
			this.setState({
				isShowCardMinModal: true,
				currentAmount: calcCardMinAmout()
			});
		});
		else this.togoProcess();
	};
	togoProcess = async () => {
		const { systemConfig, selfConfig, store } = this.props;
		if (navigatePartySizeIfNeeded(this.props.history, selfConfig)) return;
		await runJudgeSMSAfterOperation({
			systemConfig,
			selfConfig,
			store,
			history: this.props.history,
			payByCard: this.props.payByCard,
			payByCash: this.props.payByCash,
			saveOrderResult: this.props.saveOrderResult,
			kioskConfigUserId: this.props.userId,
			judgeConfigToSoldout: this.judgeConfigToSoldout,
			judgeFillCardMinAmout: this.judgeFillCardMinAmout,
			setLoading: (loading) => this.setState({ loading }),
			onError: this.showApiModalTip
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
			this.togoProcess();
		}, 0);
	};
	handleCancelOrderCharge = () => {
		this.setState({ isHasOrderCharge: false });
	};
	handleConfirmOrderCharge = () => {
		const { selfConfig } = this.props;
		this.setState({ isHasOrderCharge: false });
		if (!isTipEnabledForPayment(selfConfig, "CREDIT_CARD") && calcCardMinAmout()) this.judgeConfigToSoldout(() => {
			this.setState({
				isShowCardMinModal: true,
				currentAmount: calcCardMinAmout()
			});
		});
		else this.togoProcess();
	};
	showCallBoard = () => {
		return new Promise((resolve) => {
			this.setState({ showCallBoard: true });
			this.callBoardPromiseResolve = resolve;
		});
	};
	closeCallBoard = (locatorVal) => {
		this.setState({ showCallBoard: false }, () => {
			if (!locatorVal) return;
			else if (this.callBoardPromiseResolve) this.callBoardPromiseResolve(true);
			if (this.callBoardPromiseResolve) this.callBoardPromiseResolve = null;
		});
	};
	componentDidMount() {
		const { isReorderFlag } = this.props;
		if (isReorderFlag) this.backBtnHandler();
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
	}
	render() {
		const { t, selfConfig, setLocator } = this.props;
		const { isHasSoldoutDish, dishMap, errorApiShow, errorApiMsg, isShowCardMinModal, currentAmount, isHasOrderCharge, showCallBoard } = this.state;
		const togoOptList = [];
		selfConfig?.charge?.forEach((t) => {
			if (t.id == 2 || t.id == 3) {
				if (t.select?.id) togoOptList.push(t);
			}
		});
		const isConfirm = this.isConfirm();
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: togoOption_module_default.togoPanel,
			style: { visibility: this.props.isReorderFlag ? "hidden" : "visible" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: togoOption_module_default.togoPanelInner,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: togoOption_module_default.togoPanelTitle,
						children: t("togo-option")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: togoOption_module_default.togoPanelBox,
						children: togoOptList.map((item) => {
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `${togoOption_module_default.togoItem} ${this.showCurrentChoosed(item.id) ? togoOption_module_default.togoItemActived : ""}`,
								onClick: () => {
									this.handleChoose(item);
								},
								children: [this.showCurrentChoosed(item.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
									type: "check",
									size: 7,
									className: togoOption_module_default.checkIcon
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: togoOption_module_default.name,
									children: t("togo-item", {
										rate: item.select.id == -1 ? t("free") : `$${(0, import_round.default)(item.select.rate, 2).toFixed(2)}`,
										name: t([TOGONAMELIST[item.id]])
									})
								})]
							}, item.id);
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: togoOption_module_default.btnBox,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: togoOption_module_default.never,
						onClick: this.handleSkip,
						children: t("skip")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: [isConfirm ? `${togoOption_module_default.actived} animate-btn` : togoOption_module_default.noActived].join(" "),
						onClick: () => {
							if (isConfirm) this.judgeSMSAfterOperation();
						},
						children: t("confirm")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
					visible: showCallBoard,
					html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallerBoard_default, {
						tableServiceType: "TO_GO",
						setLocator,
						onClose: this.closeCallBoard
					})
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
				isHasOrderCharge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(cardPayTipModal_default, {
					isHasOrderCharge,
					handleCancel: this.handleCancelOrderCharge,
					handleConfirm: this.handleConfirmOrderCharge
				}) : null,
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
		togoList: state.togoList,
		isReorderFlag: state.orderEdit.isReorderFlag,
		systemConfig: state.systemConfig,
		selfConfig: state.selfConfig,
		userId: state.sysCookie.kioskConfigUserId
	};
}
var togoOption_default = withRouter(connect(mapStateToProps, {
	setTogoOption,
	clearTogoOption,
	payByCard,
	payByCash,
	setIsReorderFlag,
	spliceOrderBySoldout,
	setSelfConfig,
	setLocator,
	saveOrderResult
})(withTranslation()(TogoOption)));
//#endregion
export { togoOption_default as default };
