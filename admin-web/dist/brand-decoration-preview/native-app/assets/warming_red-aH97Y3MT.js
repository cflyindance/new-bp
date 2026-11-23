import { d as __toESM } from "./toast-C8a1ReSo.js";
import { t as require_lib } from "./lib-DuJXMpO6.js";
//#region source-snapshot/src/container/connectionError/triposFailureCodeConfig.js
var import_lib = /* @__PURE__ */ __toESM(require_lib());
/** Tripos 壳子 getTransactionResultCode 返回码 → 错误页 UI 配置（文案见 i18n tripos_fail_*） */
var TRIPOS_FAILURE_UI = {
	"01": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"02": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"03": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"04": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"05": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"06": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_retry",
		showPayCash: true
	},
	"07": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"12": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_retry",
		showPayCash: true
	},
	"13": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_retry",
		showPayCash: true
	},
	"14": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"15": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"30": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_retry",
		showPayCash: true
	},
	"41": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"43": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"51": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"54": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"57": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"58": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"59": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"61": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"62": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"63": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"65": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"91": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_change_card",
		showPayCash: true
	},
	"92": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_retry",
		showPayCash: true
	},
	"96": {
		showTryAgain: true,
		tryAgainKey: "conn_err_btn_retry",
		showPayCash: true
	}
};
function getTriposFailureI18nKeys(code) {
	const normalized = normalizeTriposFailureCode(code);
	if (!normalized) return null;
	return {
		titleKey: `tripos_fail_${normalized}_title`,
		mainKey: `tripos_fail_${normalized}_main`
	};
}
function normalizeTriposFailureCode(raw) {
	if (raw == null || raw === "") return "";
	const s = String(raw).trim();
	if (!s) return "";
	return s.padStart(2, "0");
}
function isKnownTriposFailureCode(code) {
	const normalized = normalizeTriposFailureCode(code);
	return normalized !== "" && Object.prototype.hasOwnProperty.call(TRIPOS_FAILURE_UI, normalized);
}
/**
* 解析 connectionError 路由参数（search + state）
* @param {import('react-router').Location} location
*/
function parseConnectionErrorRoute(location) {
	const q = import_lib.default.parse(location.search, { ignoreQueryPrefix: true });
	const code = String(q.code ?? "000").trim();
	const pay = q.pay;
	const failureReasonFromState = location.state && Object.prototype.hasOwnProperty.call(location.state, "failureReason") ? location.state.failureReason : void 0;
	const failureReason = failureReasonFromState != null && failureReasonFromState !== "" ? String(failureReasonFromState) : q.failureReason ? String(q.failureReason) : "";
	const triposFailureCodeFromState = location.state && Object.prototype.hasOwnProperty.call(location.state, "triposFailureCode") ? location.state.triposFailureCode : void 0;
	return {
		code,
		pay,
		failureReason,
		triposFailureCode: triposFailureCodeFromState != null && triposFailureCodeFromState !== "" ? String(triposFailureCodeFromState).trim() : q.triposFailureCode ? String(q.triposFailureCode).trim() : "",
		triposCardInputMode: q.triposCardInputMode ? String(q.triposCardInputMode).trim() : "",
		orderId: q.orderId ? String(q.orderId).trim() : ""
	};
}
//#endregion
//#region source-snapshot/src/constants/triposCardInputMode.js
var TRIPOS_CARD_INPUT_MODE = {
	INSERT_SWIPE_TAP_CARD: "InsertSwipeTapCard",
	INSERT_SWIPE_CARD: "InsertSwipeCard",
	SWIPE_TAP_CARD: "SwipeTapCard",
	SWIPE_CARD: "SwipeCard"
};
TRIPOS_CARD_INPUT_MODE.INSERT_SWIPE_TAP_CARD, TRIPOS_CARD_INPUT_MODE.INSERT_SWIPE_CARD, TRIPOS_CARD_INPUT_MODE.SWIPE_TAP_CARD, TRIPOS_CARD_INPUT_MODE.SWIPE_CARD;
//#endregion
//#region source-snapshot/src/container/connectionError/errorCodeConfig.js
/** Payment gateway 返回 Express 离线时的 failureReason 关键字 */
var EXPRESS_OFFLINE_FAILURE_KEYWORD = "Express is offline";
function isExpressOfflineFailure(failureReason) {
	return (failureReason == null ? "" : String(failureReason)).includes(EXPRESS_OFFLINE_FAILURE_KEYWORD);
}
function resolveExpressOfflineFailureUi(t) {
	return {
		mode: "custom",
		opsText: t("conn_err_express_offline_title"),
		mainText: t("conn_err_express_offline_main"),
		subText: "",
		showSub: false,
		showTryAgain: false,
		tryAgainText: "",
		forceShowPayCash: true
	};
}
/** 已知业务错误码（非列表内按默认页展示） */
var KNOWN_CONNECTION_ERROR_CODES = /* @__PURE__ */ new Set([
	"001",
	"002",
	"003",
	"004",
	"005",
	"101020",
	"101021",
	"101032",
	"101023",
	"101024",
	"101027",
	"101028",
	"101029",
	"101030",
	"101031",
	"101999",
	"101198",
	"101197",
	"101036"
]);
function resolveTriposFailureUi(triposCodeRaw, t) {
	const triposCode = normalizeTriposFailureCode(triposCodeRaw);
	const cfg = TRIPOS_FAILURE_UI[triposCode];
	const i18nKeys = getTriposFailureI18nKeys(triposCode);
	if (!cfg || !i18nKeys) return null;
	return {
		mode: "custom",
		opsText: t(i18nKeys.titleKey),
		mainText: t(i18nKeys.mainKey),
		subText: "",
		showSub: false,
		showTryAgain: cfg.showTryAgain,
		tryAgainText: cfg.showTryAgain ? t(cfg.tryAgainKey) : "",
		forceShowPayCash: cfg.showPayCash
	};
}
/**
* @param {string} codeRaw
* @param {string} failureReason 接口 failureReason
* @param {import('i18next').TFunction} t
* @param {string} [triposFailureCode] Tripos getTransactionResultCode 返回码
* @returns {{
*   mode: 'default' | 'custom',
*   opsText: string,
*   mainText: string,
*   subText: string,
*   showSub: boolean,
*   showTryAgain: boolean,
*   tryAgainText: string,
*   forceShowPayCash: boolean,
* }}
*/
function resolveConnectionErrorUi(codeRaw, failureReason, t, triposFailureCode = "", triposCardInputMode = "") {
	const code = String(codeRaw || "000").trim();
	const reason = failureReason == null ? "" : String(failureReason);
	if (isExpressOfflineFailure(reason)) return resolveExpressOfflineFailureUi(t);
	if (isKnownTriposFailureCode(triposFailureCode)) {
		const triposUi = resolveTriposFailureUi(triposFailureCode, t);
		if (triposUi) return triposUi;
	}
	if (code === "000" || !KNOWN_CONNECTION_ERROR_CODES.has(code)) return {
		mode: "default",
		opsText: t("ops"),
		mainText: reason || t("connect-error"),
		subText: reason ? "" : t("please-retry"),
		showSub: true,
		showTryAgain: true,
		tryAgainText: t("try_again"),
		forceShowPayCash: false
	};
	switch (code) {
		case "005": {
			const mainTextKey = {
				[TRIPOS_CARD_INPUT_MODE.INSERT_SWIPE_CARD]: "conn_err_005_insert_swipe_main",
				[TRIPOS_CARD_INPUT_MODE.SWIPE_TAP_CARD]: "conn_err_005_swipe_tap_main",
				[TRIPOS_CARD_INPUT_MODE.SWIPE_CARD]: "conn_err_005_swipe_main"
			}[triposCardInputMode];
			return {
				mode: "custom",
				opsText: t("conn_err_005_title"),
				mainText: mainTextKey ? t(mainTextKey) : t("connect-error"),
				subText: "",
				showSub: false,
				showTryAgain: true,
				tryAgainText: t("conn_err_btn_retry"),
				forceShowPayCash: false
			};
		}
		case "101020": return {
			mode: "custom",
			opsText: t("conn_err_101020_title"),
			mainText: t("conn_err_101020_main"),
			subText: t("conn_err_101020_sub"),
			showSub: true,
			showTryAgain: true,
			tryAgainText: t("conn_err_btn_change_card"),
			forceShowPayCash: false
		};
		case "101021": return {
			mode: "custom",
			opsText: t("conn_err_101021_title"),
			mainText: t("conn_err_101021_main"),
			subText: t("conn_err_101021_sub"),
			showSub: true,
			showTryAgain: true,
			tryAgainText: t("conn_err_btn_change_card"),
			forceShowPayCash: false
		};
		case "101032": return {
			mode: "custom",
			opsText: t("conn_err_101032_title"),
			mainText: t("conn_err_101032_main"),
			subText: t("conn_err_101032_sub"),
			showSub: true,
			showTryAgain: false,
			tryAgainText: "",
			forceShowPayCash: true
		};
		case "101023":
		case "002": return {
			mode: "custom",
			opsText: t("conn_err_101023_title"),
			mainText: t("conn_err_101023_main"),
			subText: "",
			showSub: false,
			showTryAgain: true,
			tryAgainText: t("conn_err_btn_retry"),
			forceShowPayCash: false
		};
		case "101024": return {
			mode: "custom",
			opsText: t("conn_err_101024_title"),
			mainText: t("conn_err_101024_main"),
			subText: "",
			showSub: false,
			showTryAgain: true,
			tryAgainText: t("conn_err_btn_retry"),
			forceShowPayCash: false
		};
		case "101027":
		case "101028": return {
			mode: "custom",
			opsText: t("conn_err_101028_title"),
			mainText: t("conn_err_101028_main"),
			subText: "",
			showSub: false,
			showTryAgain: true,
			tryAgainText: t("conn_err_btn_change_card"),
			forceShowPayCash: false
		};
		case "101029": return {
			mode: "custom",
			opsText: t("conn_err_101029_title"),
			mainText: t("conn_err_101029_main"),
			subText: t("conn_err_101029_sub"),
			showSub: true,
			showTryAgain: false,
			tryAgainText: "",
			forceShowPayCash: true
		};
		case "101030": return {
			mode: "custom",
			opsText: t("conn_err_101030_title"),
			mainText: t("conn_err_101030_main"),
			subText: t("conn_err_101030_sub"),
			showSub: true,
			showTryAgain: false,
			tryAgainText: "",
			forceShowPayCash: true
		};
		case "101031": return {
			mode: "custom",
			opsText: t("conn_err_101031_title"),
			mainText: t("conn_err_101031_main"),
			subText: t("conn_err_101031_sub"),
			showSub: true,
			showTryAgain: false,
			tryAgainText: "",
			forceShowPayCash: true
		};
		case "101999": return {
			mode: "custom",
			opsText: t("conn_err_101999_title"),
			mainText: t("conn_err_101999_main"),
			subText: t("conn_err_101999_sub"),
			showSub: true,
			showTryAgain: true,
			tryAgainText: t("conn_err_btn_retry"),
			forceShowPayCash: true
		};
		case "101198": return {
			mode: "custom",
			opsText: t("conn_err_101198_title"),
			mainText: t("conn_err_101198_main"),
			subText: t("conn_err_101198_sub"),
			showSub: true,
			showTryAgain: true,
			tryAgainText: t("conn_err_btn_retry"),
			forceShowPayCash: false
		};
		case "003":
		case "101197": return {
			mode: "custom",
			opsText: t("conn_err_101197_title"),
			mainText: t("conn_err_101197_main"),
			subText: "",
			showSub: false,
			showTryAgain: true,
			tryAgainText: t("conn_err_btn_retry"),
			forceShowPayCash: true
		};
		case "101036": return {
			mode: "custom",
			opsText: t("conn_err_101036_title"),
			mainText: t("conn_err_101036_main"),
			subText: "",
			showSub: false,
			showTryAgain: true,
			tryAgainText: t("conn_err_btn_retry"),
			forceShowPayCash: true
		};
		case "004": return {
			mode: "custom",
			opsText: t("order-create-fail"),
			mainText: reason.trim() === "Insufficient inventory" ? t("order-contains-sold-out-items") : t("order-create-sub-fail"),
			subText: "",
			showSub: false,
			showTryAgain: false,
			tryAgainText: "",
			forceShowPayCash: false
		};
		default: return {
			mode: "default",
			opsText: t("ops"),
			mainText: t("connect-error"),
			subText: t("please-retry"),
			showSub: true,
			showTryAgain: true,
			tryAgainText: t("try_again"),
			forceShowPayCash: false
		};
	}
}
var connectionError_module_default = {
	cardPaymentFailurePage: "cardPaymentFailurePage___SlshL",
	failureImg: "failureImg___3cRLS",
	ops: "ops___gr6Fv",
	failureDescription: "failureDescription___nCpLq",
	breakLine: "breakLine___PVREX",
	btnBoxs: "btnBoxs___SCP-b",
	topBtn: "topBtn___1cvZz",
	topBtnSingle: "topBtnSingle___dZLQ8",
	failureActionBtn: "failureActionBtn___5p-2o",
	tryAgainBtn: "tryAgainBtn___n5542",
	bottomBtn: "bottomBtn___Ca5CN"
};
//#endregion
//#region source-snapshot/src/assets/images/warming_red.png
var warming_red_default = "" + new URL("warming_red-BQj5BTPb.png", import.meta.url).href;
//#endregion
export { parseConnectionErrorRoute as a, resolveConnectionErrorUi as i, connectionError_module_default as n, normalizeTriposFailureCode as o, KNOWN_CONNECTION_ERROR_CODES as r, warming_red_default as t };
