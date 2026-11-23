import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { Bt as setIsReorderFlag, Cr as judgeConfigToSoldout, G as payByCash, W as payByCard, an as setSelfConfig, lr as calcCardMinAmout, mn as setTabelServiceType, pt as saveOrderResult, qt as setLocator, wn as spliceOrderBySoldout } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { n as CallerBoard_default, t as navigatePartySizeIfNeeded } from "./navigatePartySizeIfNeeded-BuTz0eO5.js";
import { t as soldoutModal_default } from "./soldoutModal-CCd1O5t5.js";
import { t as cardMinAmount_default } from "./cardMinAmount-DfJqO2k_.js";
import { t as runJudgeSMSAfterOperation } from "./runJudgeSMSAfterOperation-CBdP8zKG.js";
//#region source-snapshot/src/container/tableService/tabelService.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var tabelService_module_default = {
	serviceTypePanelOuter: "serviceTypePanelOuter___yyycy",
	serviceTypePanelInner: "serviceTypePanelInner___Wjywj",
	serviceTypeMethod: "serviceTypeMethod___3bdgp",
	serviceTwoBox: "serviceTwoBox___ivwxT",
	serviceType: "serviceType___2Mqyy",
	title: "title___FeLjk",
	serviceType1: "serviceType1___pRbUZ",
	serviceType2: "serviceType2___I2POa",
	errorModal: "errorModal___Z9JnY",
	noserviceType: "noserviceType___7BPyR",
	itemBox: "itemBox___XGKme",
	itemName: "itemName___npb5j",
	subItemName: "subItemName___FT2qZ"
};
//#endregion
//#region source-snapshot/src/container/tableService/index.js
var import_jsx_runtime = require_jsx_runtime();
var TabelService = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			isHasSoldoutDish: false,
			dishMap: {},
			errorApiMsg: "",
			errorApiShow: false,
			isShowCardMinModal: false,
			currentAmount: 0,
			loading: false,
			showCallBoard: false,
			locatorVal: null,
			tableServiceType: "",
			isShowDesc: false
		};
		this.timer = null;
		this.callBoardPromiseResolve = null;
	}
	backBtnHandler = () => {
		this.props.history.goBack();
	};
	handleSelectOrderType = async (tableServiceType, isShowDesc) => {
		const { selfConfig, setTabelServiceType } = this.props;
		setTabelServiceType(tableServiceType);
		this.setState({
			tableServiceType,
			isShowDesc
		});
		if (selfConfig?.configMap?.id_39 && isShowDesc) {
			this.props.history.push("./chooseTable");
			this.setState({ locatorVal: false });
			return Promise.resolve(false);
		}
		if (selfConfig?.configMap?.id_28 === 1) {
			this.setState({ showCallBoard: true });
			return new Promise((resolve) => {
				this.callBoardPromiseResolve = resolve;
			});
		}
		this.setState({ locatorVal: true });
		return Promise.resolve(true);
	};
	handleChoose = async () => {
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
			this.handleChoose();
		}, 0);
	};
	closeCallBoard = (locatorVal) => {
		this.setState({
			showCallBoard: false,
			locatorVal
		}, () => {
			if (this.callBoardPromiseResolve) {
				this.callBoardPromiseResolve(true);
				this.callBoardPromiseResolve = null;
			}
		});
	};
	onServiceBoxClick = async (isShowDesc) => {
		const { setLocator } = this.props;
		setLocator("");
		if (!await this.handleSelectOrderType("DINE_IN", isShowDesc) || !this.state.locatorVal) return;
		this.handleChoose();
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
		const { isHasSoldoutDish, dishMap, errorApiShow, errorApiMsg, isShowCardMinModal, currentAmount, showCallBoard, isShowDesc, tableServiceType } = this.state;
		let serviceTitle = t("table-service-title");
		let isHasArr = selfConfig?.configMap?.id_4 || [];
		if (isHasArr.length !== 2) {
			if (isHasArr[0] == 0) serviceTitle = t("pick-up-only");
			else if (isHasArr[0] == 1) serviceTitle = t("table-service-only");
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: tabelService_module_default.serviceTypePanelOuter,
			style: { visibility: this.props.isReorderFlag ? "hidden" : "visible" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: tabelService_module_default.serviceTypePanelInner,
					onClick: (event) => {
						event.stopPropagation();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: tabelService_module_default.serviceTypeMethod,
						children: serviceTitle
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: tabelService_module_default.serviceTwoBox,
						children: [isHasArr.includes(0) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `${tabelService_module_default.serviceType} ${tabelService_module_default.serviceType1}`,
							onClick: () => {
								this.onServiceBoxClick(false);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: tabelService_module_default.title,
								children: t("pick-up")
							})]
						}) : null, isHasArr.includes(1) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `${tabelService_module_default.serviceType} ${tabelService_module_default.serviceType2}`,
							onClick: () => {
								this.onServiceBoxClick(true);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: tabelService_module_default.title,
								children: t("table-service")
							})]
						}) : null]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
					visible: showCallBoard,
					html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallerBoard_default, {
						tableServiceType,
						setLocator,
						isShowDesc,
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
		selfConfig: state.selfConfig,
		systemConfig: state.systemConfig,
		isReorderFlag: state.orderEdit.isReorderFlag,
		userId: state.sysCookie.kioskConfigUserId
	};
}
var tableService_default = withRouter(connect(mapStateToProps, {
	payByCard,
	payByCash,
	spliceOrderBySoldout,
	setIsReorderFlag,
	setTabelServiceType,
	setSelfConfig,
	setLocator,
	saveOrderResult
})(withTranslation()(TabelService)));
//#endregion
export { tableService_default as default };
