import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { p as solveScrollElem } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { $t as setNumOfGuests, Bt as setIsReorderFlag, Cr as judgeConfigToSoldout, G as payByCash, W as payByCard, an as setSelfConfig, lr as calcCardMinAmout, pt as saveOrderResult, wn as spliceOrderBySoldout } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { t as numPad_default } from "./numPad-f96Tw6Sn.js";
import { t as soldoutModal_default } from "./soldoutModal-CCd1O5t5.js";
import { t as cardMinAmount_default } from "./cardMinAmount-DfJqO2k_.js";
import { t as runJudgeSMSAfterOperation } from "./runJudgeSMSAfterOperation-CBdP8zKG.js";
//#region source-snapshot/src/container/partySizeSelection/partySizeSelection.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var partySizeSelection_module_default = {
	partySizePage: "partySizePage___vNRTf",
	partySizePageBox: "partySizePageBox___LaF7Y",
	partySizeTitle: "partySizeTitle___L1vQH",
	actionRow: "actionRow___I9Swv",
	never: "never___ElcYN",
	btnConfirm: "btnConfirm___buD-5",
	btnNoConfirm: "btnNoConfirm___1Nxw-",
	numPadWrap: "numPadWrap___jkqCr"
};
//#endregion
//#region source-snapshot/src/container/partySizeSelection/index.js
var import_jsx_runtime = require_jsx_runtime();
var PARTY_SIZE_KEYS = [
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9"
];
function PartySizeSelection(props) {
	const { t, history, selfConfig, systemConfig, store, isReorderFlag, payByCard: payByCardAction, payByCash: payByCashAction, saveOrderResult: saveOrderResultAction, setNumOfGuests: setNumOfGuestsAction, setSelfConfig: setSelfConfigAction, spliceOrderBySoldout: spliceOrderBySoldoutAction, setIsReorderFlag: setIsReorderFlagAction, userId: kioskConfigUserId } = props;
	const [partySize, setPartySize] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [errorApiMsg, setErrorApiMsg] = (0, import_react.useState)("");
	const [errorApiShow, setErrorApiShow] = (0, import_react.useState)(false);
	const [isHasSoldoutDish, setIsHasSoldoutDish] = (0, import_react.useState)(false);
	const [dishMap, setDishMap] = (0, import_react.useState)({});
	const [isShowCardMinModal, setIsShowCardMinModal] = (0, import_react.useState)(false);
	const [currentAmount, setCurrentAmount] = (0, import_react.useState)(0);
	const timerRef = (0, import_react.useRef)(null);
	const isRequired = !!selfConfig?.configMap?.id_63;
	const canConfirm = partySize.length > 0;
	const showApiModalTip = (0, import_react.useCallback)((errMsg) => {
		setErrorApiMsg(errMsg);
		setErrorApiShow(true);
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			setErrorApiShow(false);
			setErrorApiMsg("");
		}, 2e3);
	}, []);
	const judgeConfigToSoldout$1 = (0, import_react.useCallback)((fn) => {
		judgeConfigToSoldout(fn, {
			setSelfConfig: setSelfConfigAction,
			setState: (partial) => {
				if (partial.isHasSoldoutDish !== void 0) setIsHasSoldoutDish(partial.isHasSoldoutDish);
				if (partial.dishMap !== void 0) setDishMap(partial.dishMap);
			},
			showApiModalTip,
			reorder: () => {
				if (dishMap?.allSoldIds?.length) spliceOrderBySoldoutAction(dishMap.allSoldIds);
				setIsHasSoldoutDish(false);
				setIsReorderFlagAction(true);
				history.goBack();
			},
			onSoldoutDetected: () => solveScrollElem(true)
		});
	}, [
		dishMap,
		history,
		setIsReorderFlagAction,
		setSelfConfigAction,
		showApiModalTip,
		spliceOrderBySoldoutAction
	]);
	const judgeFillCardMinAmout = (0, import_react.useCallback)(() => {
		const minAmount = calcCardMinAmout();
		if (minAmount) {
			setIsShowCardMinModal(true);
			setCurrentAmount(minAmount);
		} else history.push("/cardPayment");
	}, [history]);
	const continueFlow = (0, import_react.useCallback)(async () => {
		await runJudgeSMSAfterOperation({
			systemConfig,
			selfConfig,
			store,
			history,
			payByCard: payByCardAction,
			payByCash: payByCashAction,
			saveOrderResult: saveOrderResultAction,
			kioskConfigUserId,
			judgeConfigToSoldout: judgeConfigToSoldout$1,
			judgeFillCardMinAmout,
			setLoading,
			onError: showApiModalTip
		});
	}, [
		history,
		judgeConfigToSoldout$1,
		judgeFillCardMinAmout,
		kioskConfigUserId,
		payByCardAction,
		payByCashAction,
		saveOrderResultAction,
		selfConfig,
		showApiModalTip,
		store,
		systemConfig
	]);
	(0, import_react.useEffect)(() => {
		if (isReorderFlag) history.goBack();
	}, [history, isReorderFlag]);
	(0, import_react.useEffect)(() => {
		return () => clearTimeout(timerRef.current);
	}, []);
	const handleNumPadPress = (key) => {
		setPartySize(String(key));
	};
	const handleSkip = async () => {
		setNumOfGuestsAction(null);
		await continueFlow();
	};
	const handleConfirm = async () => {
		if (!canConfirm) {
			toast_default.info(t("party-size-select-tip"), "top");
			return;
		}
		const guests = parseInt(partySize, 10);
		if (!partySize || Number.isNaN(guests) || guests < 1) {
			toast_default.info(t("party-size-select-tip"), "top");
			return;
		}
		setNumOfGuestsAction(guests);
		await continueFlow();
	};
	const reorder = () => {
		if (dishMap?.allSoldIds?.length) spliceOrderBySoldoutAction(dishMap.allSoldIds);
		setIsHasSoldoutDish(false);
		setIsReorderFlagAction(true);
		history.goBack();
	};
	const continueReorder = () => {
		if (dishMap?.allSoldIds?.length) spliceOrderBySoldoutAction(dishMap.allSoldIds);
		setIsHasSoldoutDish(false);
		if (partySize) handleConfirm();
		else handleSkip();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: partySizeSelection_module_default.partySizePage,
		style: { visibility: isReorderFlag ? "hidden" : "visible" },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: partySizeSelection_module_default.partySizePageBox,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: partySizeSelection_module_default.partySizeTitle,
						children: t("select-party-size")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: partySizeSelection_module_default.numPadWrap,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(numPad_default, {
							keys: PARTY_SIZE_KEYS,
							mode: "direct",
							selectedKey: partySize,
							showDelete: false,
							keyPress: handleNumPadPress
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: partySizeSelection_module_default.actionRow,
						children: [!isRequired && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: partySizeSelection_module_default.never,
							onClick: handleSkip,
							children: t("skip")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: [partySizeSelection_module_default.btnConfirm, canConfirm ? `linear-animate-btn` : partySizeSelection_module_default.btnNoConfirm].join(" "),
							onClick: handleConfirm,
							children: t("confirm")
						})]
					})
				]
			}),
			isHasSoldoutDish ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(soldoutModal_default, {
				isHasSoldoutDish,
				dishMap,
				reorder,
				continueReorder
			}) : null,
			isShowCardMinModal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(cardMinAmount_default, {
				isShowCardMinModal,
				currentAmount,
				handleContinueOrder: () => {
					setIsShowCardMinModal(false);
					reorder();
				},
				handleCloseMin: () => setIsShowCardMinModal(false)
			}) : null,
			errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
				variant: "filled",
				severity: "error",
				children: errorApiMsg
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: loading })
		]
	});
}
function mapStateToProps(state) {
	return {
		store: state,
		systemConfig: state.systemConfig,
		selfConfig: state.selfConfig,
		isReorderFlag: state.orderEdit.isReorderFlag,
		userId: state.sysCookie.kioskConfigUserId
	};
}
var partySizeSelection_default = withRouter(connect(mapStateToProps, {
	payByCard,
	payByCash,
	spliceOrderBySoldout,
	setIsReorderFlag,
	setNumOfGuests,
	setSelfConfig,
	saveOrderResult
})(withTranslation()(PartySizeSelection)));
//#endregion
export { partySizeSelection_default as default };
