import { d as __toESM, i as require_react, n as require_jsx_runtime, o as __commonJSMin, t as toast_default } from "./toast-C8a1ReSo.js";
import { C as getMarginappFetchConfig, a as getDeviceOrientation, r as getCookie, t as compare } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { Bt as setIsReorderFlag, Cr as judgeConfigToSoldout, G as payByCash, W as payByCard, an as setSelfConfig, da as require_cloneDeep, hn as setTableId, lr as calcCardMinAmout, mn as setTabelServiceType, pt as saveOrderResult, qt as setLocator, wn as spliceOrderBySoldout } from "./actions-BwRPwnFF.js";
import { C as getTableInfoById, O as postMarginappConfig, S as getTableAreaList } from "./kioskConfigApi-68IKDHob.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as getChooseTableStatus } from "./chooseTable-BNJLkJ45.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { n as require_interopRequireWildcard, r as require_interopRequireDefault, t as require_createSvgIcon } from "./createSvgIcon-DxdaFuGn.js";
import { n as CallerBoard_default, t as navigatePartySizeIfNeeded } from "./navigatePartySizeIfNeeded-BuTz0eO5.js";
import { t as soldoutModal_default } from "./soldoutModal-CCd1O5t5.js";
import { t as cardMinAmount_default } from "./cardMinAmount-DfJqO2k_.js";
import { t as runJudgeSMSAfterOperation } from "./runJudgeSMSAfterOperation-CBdP8zKG.js";
//#region source-snapshot/src/container/chooseTable/chooseTable.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var chooseTable_module_default = {
	chooseTable: "chooseTable___gd1S-",
	chooseTableContent: "chooseTableContent___kiu2j",
	chooseTableTitle: "chooseTableTitle___Q8nVb",
	tableBox: "tableBox___A3KCM",
	tableBoxVertical: "tableBoxVertical___qMczI",
	tableContent: "tableContent___LG51a",
	tableContentVertical: "tableContentVertical___sEueG",
	tableTabs: "tableTabs___uYSGC",
	tableTabsVertical: "tableTabsVertical___Jw9WC",
	tableTab: "tableTab___6TtV1",
	tableTabVertical: "tableTabVertical___HTv4J",
	tableTabSelected: "tableTabSelected___oiFhn",
	tableTabAreaName: "tableTabAreaName___QFUmC",
	tableLayout: "tableLayout___eT-VR",
	table: "table___CuEQe",
	tableTitle: "tableTitle___dwQuS",
	tableInUse: "tableInUse___wwy7y",
	tableInUseTip: "tableInUseTip___Bov-Z",
	footer: "footer___ohzDu",
	skipBtn: "skipBtn___eqrsV"
};
//#endregion
//#region node_modules/@material-ui/icons/PeopleAlt.js
var require_PeopleAlt = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _interopRequireWildcard = require_interopRequireWildcard();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	exports.default = (0, _interopRequireDefault(require_createSvgIcon()).default)(/*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("path", {
		fillRule: "evenodd",
		d: "M16.67 13.13C18.04 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87z"
	}), /*#__PURE__*/ React.createElement("circle", {
		cx: "9",
		cy: "8",
		r: "4",
		fillRule: "evenodd"
	}), /*#__PURE__*/ React.createElement("path", {
		fillRule: "evenodd",
		d: "M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.47 0-.91.1-1.33.24C14.5 5.27 15 6.58 15 8s-.5 2.73-1.33 3.76c.42.14.86.24 1.33.24zM9 13c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"
	})), "PeopleAlt");
}));
//#endregion
//#region source-snapshot/src/container/chooseTable/index.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_PeopleAlt = /* @__PURE__ */ __toESM(require_PeopleAlt());
var import_jsx_runtime = require_jsx_runtime();
var ChooseTable = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			tabIndex: 0,
			tableLayout: {
				width: 0,
				height: 0
			},
			areaList: [],
			kioskTableInUseList: [],
			dishMap: {},
			errorApiMsg: "",
			errorApiShow: false,
			isHasSoldoutDish: false,
			isShowCardMinModal: false,
			currentAmount: 0,
			loadingCount: 0,
			loading: false,
			showCallBoard: false,
			afterCallBoardClearTale: null
		};
		this.tableLayoutRef = import_react.createRef();
		this.tableTimer = void 0;
		this.errorTipTimer = void 0;
	}
	showApiModalTip = (errMsg) => {
		this.setState({
			errorApiMsg: errMsg,
			errorApiShow: true
		});
		this.errorTipTimer = setTimeout(() => {
			this.setState({
				errorApiMsg: "",
				errorApiShow: false
			});
		}, 2e3);
	};
	handleTabChange = (tabIndex) => (e) => {
		e.currentTarget.scrollIntoView({
			behavior: "smooth",
			inline: "center",
			block: "end"
		});
		this.setState({ tabIndex });
	};
	handleChooseTable = (tableId) => async () => {
		const { t, setTableId } = this.props;
		this.setState({ loadingCount: this.state.loadingCount + 1 });
		try {
			const [tableInfoRes, kioskConfigRes] = await Promise.all([getTableInfoById(tableId), getMarginappFetchConfig()]);
			if (tableInfoRes.data?.code === 0) {
				const tableOrders = tableInfoRes.data.data?.table?.orders;
				if (tableOrders.length > 0) {
					toast_default.info(t("table-in-use"), "top");
					const areaList = this.state.areaList;
					const tableList = areaList.find((_) => _.id === this.state.tabIndex);
					if (tableList?.tables) {
						const table = tableList.tables.find((_) => _.id === tableId);
						table.orders = tableOrders;
					}
					this.setState({
						areaList,
						loadingCount: this.state.loadingCount - 1
					});
					return;
				}
			} else throw new Error(tableInfoRes.data?.msg);
			if (kioskConfigRes.data?.result?.successful) {
				let obj = (kioskConfigRes.data.marginAppConfigTypes || []).find((l) => l.product == "KIOSKLITE");
				if (obj && obj.data) {
					let arr = JSON.parse(obj.data);
					if (arr.configList) {
						const kioskLicense = getCookie("kioskLicense");
						const inUseConfig = {
							lisense: kioskLicense,
							id: tableId
						};
						const kioskTableInUseConfig = arr.configList.find((e) => e.id === 41);
						if (kioskTableInUseConfig) {
							const kioskTableInUseFiltered = (kioskTableInUseConfig.value || []).filter((_) => _.lisense !== kioskLicense);
							if (kioskTableInUseFiltered.find((_) => _.id === tableId)) {
								toast_default.info(t("table-in-use"), "top");
								this.setState({
									kioskTableInUseList: kioskTableInUseFiltered,
									loadingCount: this.state.loadingCount - 1
								});
								return;
							}
							kioskTableInUseFiltered.push(inUseConfig);
							kioskTableInUseConfig.value = kioskTableInUseFiltered;
						} else {
							arr.configList.push({
								id: 41,
								value: [inUseConfig],
								key: "table-in-use-by-lisense"
							});
							arr.configList.sort(compare("id"));
						}
						if ((await postMarginappConfig(JSON.stringify((0, import_cloneDeep.default)(arr)), getCookie("sessionKey"))).data?.result?.successful) {
							this.setState({ tableId });
							setTableId(tableId);
						} else throw new Error(kioskConfigRes.data?.result?.failureReason);
					}
				}
			} else throw new Error(kioskConfigRes.data?.result?.failureReason);
		} catch (e) {
			this.showApiModalTip(e?.message);
			this.setState({ loadingCount: this.state.loadingCount - 1 });
			return;
		}
		this.setState({ loadingCount: this.state.loadingCount - 1 });
		this.afterChooseTable(true);
	};
	afterChooseTable = async (clearTale) => {
		const { selfConfig, setLocator, setTabelServiceType } = this.props;
		setLocator("");
		setTabelServiceType("DINE_IN");
		if (selfConfig?.configList?.find((config) => config.id === 28)?.value === 1) {
			this.setState({
				showCallBoard: true,
				afterCallBoardClearTale: clearTale
			});
			return;
		}
		await this.judgeSMSAfterOperation();
	};
	clearTimers = () => {
		if (this.tableTimer) {
			clearInterval(this.tableTimer);
			this.tableTimer = void 0;
		}
		if (this.errorTipTimer) {
			clearTimeout(this.errorTipTimer);
			this.errorTipTimer = void 0;
		}
	};
	initTableData = () => {
		this.props.setTableId(null);
		this.getTableAreaListFromPos(true);
		this.getKioskTableInUseList(true);
		if (this.tableTimer) clearInterval(this.tableTimer);
		this.tableTimer = setInterval(() => {
			this.getTableAreaListFromPos();
			this.getKioskTableInUseList();
		}, 1e3 * 60 * 5);
	};
	getTableAreaListFromPos = async (init) => {
		init && this.setState({ loadingCount: this.state.loadingCount + 1 });
		try {
			const res = await getTableAreaList();
			if (res.data?.msg === "success") {
				const areaList = res.data.data?.areas || [];
				this.setState({ areaList });
				if (init && areaList.length > 0) {
					this.getTableLayoutRect();
					this.setState({ tabIndex: areaList[0].id });
				}
			}
		} catch (e) {}
		init && this.setState({ loadingCount: this.state.loadingCount - 1 });
	};
	getKioskTableInUseList = async (init) => {
		init && this.setState({ loadingCount: this.state.loadingCount + 1 });
		try {
			const res = await getChooseTableStatus(init);
			if (res) this.setState({ kioskTableInUseList: res });
		} catch (e) {}
		init && this.setState({ loadingCount: this.state.loadingCount - 1 });
	};
	getTableLayoutRect = () => {
		const dom = this.tableLayoutRef.current;
		if (dom) this.setState({ tableLayout: {
			height: dom.clientHeight,
			width: dom.clientWidth
		} });
	};
	handleClickBack = async () => {
		this.props.setTableId(null);
		getChooseTableStatus(true);
		this.props.history.goBack();
	};
	judgeSMSAfterOperation = async () => {
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
			this.handleClickBack();
		}, 0);
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
	continueReorder = () => {
		if (this?.state?.dishMap?.allSoldIds?.length) this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
		this.setState({ isHasSoldoutDish: false });
		setTimeout(async () => {
			await this.judgeSMSAfterOperation();
		}, 0);
	};
	closeCallBoard = (locatorVal) => {
		this.setState({ showCallBoard: false }, async () => {
			if (!locatorVal) {
				if (this.state.afterCallBoardClearTale) {
					this.initTableData();
					this.setState({ afterCallBoardClearTale: null });
				}
				return;
			} else await this.judgeSMSAfterOperation();
		});
	};
	handleSkip = () => {
		this.afterChooseTable();
	};
	componentDidMount() {
		if (this.props.isReorderFlag) {
			this.handleClickBack();
			return;
		}
		this.initTableData();
	}
	componentWillUnmount() {
		this.clearTimers();
	}
	render() {
		const { t } = this.props;
		const { isHasSoldoutDish, dishMap, errorApiShow, errorApiMsg, isShowCardMinModal, currentAmount, loadingCount, tabIndex, areaList, tableLayout, kioskTableInUseList, showCallBoard } = this.state;
		const isVertical = getDeviceOrientation() === "vertical";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: chooseTable_module_default.chooseTable,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: chooseTable_module_default.chooseTableContent,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: chooseTable_module_default.chooseTableTitle,
							children: t("choose-table-title")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `${chooseTable_module_default.tableBox} ${isVertical ? chooseTable_module_default.tableBoxVertical : ""}`,
							children: areaList.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `${chooseTable_module_default.tableContent} ${isVertical ? chooseTable_module_default.tableContentVertical : ""}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `${chooseTable_module_default.tableTabs} ${isVertical ? chooseTable_module_default.tableTabsVertical : ""}`,
									children: areaList.map((area) => {
										const guestNumber = area.tables.reduce((tpv, tcv) => {
											return tpv + tcv.orders.reduce((opv, ocv) => {
												return opv + ocv.numOfGuests;
											}, 0);
										}, 0);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `${chooseTable_module_default.tableTab} ${isVertical ? chooseTable_module_default.tableTabVertical : ""} ${tabIndex === area.id ? chooseTable_module_default.tableTabSelected : ""}`,
											onClick: this.handleTabChange(area.id),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: chooseTable_module_default.tableTabAreaName,
												children: [
													area.name || "",
													"(",
													guestNumber,
													")"
												]
											})
										}, area.id);
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									ref: this.tableLayoutRef,
									className: chooseTable_module_default.tableLayout,
									children: areaList.map((area) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: { display: tabIndex === area.id ? "block" : "none" },
										children: area.tables.map((table) => {
											const tableWidth = Math.max(isVertical ? 100 : 120, tableLayout.width * (isVertical ? table.height : table.width));
											const tableHeight = Math.max(isVertical ? 120 : 100, tableLayout.height * (isVertical ? table.width : table.height));
											const left = isVertical ? tableLayout.width * (1 - table.y) - tableWidth : tableLayout.width * table.x;
											const top = tableLayout.height * (isVertical ? table.x : table.y);
											const borderRadius = table.shape === "ROUND" ? `${tableLayout.width * table.width / 2}px` : "0.8rem";
											const inUse = table.orders.length > 0 || kioskTableInUseList.find((e) => e.id === table.id);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `${chooseTable_module_default.table} ${inUse ? chooseTable_module_default.tableInUse : ""}`,
												style: {
													width: `${tableWidth}px`,
													height: `${tableHeight}px`,
													left: `${left}px`,
													top: `${top}px`,
													borderRadius
												},
												onClick: inUse ? void 0 : this.handleChooseTable(table.id),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: chooseTable_module_default.tableTitle,
													children: table.name
												}), inUse && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: chooseTable_module_default.tableInUseTip,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_PeopleAlt.default, { fontSize: "inherit" })
												})]
											}, table.id);
										})
									}, area.id))
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: chooseTable_module_default.footer,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: chooseTable_module_default.skipBtn,
								onClick: this.handleSkip,
								children: t("skip")
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: showCallBoard,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallerBoard_default, {
					tableServiceType: "DINE_IN",
					setLocator,
					isShowDesc: true,
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: loadingCount > 0 || this.state.loading })
		] });
	}
};
function mapStateToProps(state) {
	return {
		store: state,
		crm: state.crm,
		selfConfig: state.selfConfig,
		systemConfig: state.systemConfig,
		currentOrder: state.currentOrder,
		isReorderFlag: state.orderEdit.isReorderFlag,
		userId: state.sysCookie.kioskConfigUserId
	};
}
var chooseTable_default = withRouter(connect(mapStateToProps, {
	setLocator,
	setTableId,
	payByCard,
	payByCash,
	spliceOrderBySoldout,
	setIsReorderFlag,
	saveOrderResult,
	setTabelServiceType,
	setSelfConfig
})(withTranslation()(ChooseTable)));
//#endregion
export { chooseTable_default as default };
