import { d as __toESM, i as require_react, n as require_jsx_runtime, o as __commonJSMin, t as toast_default } from "./toast-C8a1ReSo.js";
import { D as posFrontLog, F as send2Kitchen, H as EventBus, N as saveOrder, O as printCall, R as sendPayment, X as TOGONAMELIST, c as judgeSskeyIsActiveTime, r as getCookie } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { Bt as setIsReorderFlag, G as payByCash, Gr as getOrderInfoObj, H as markPostPaymentAction, Kn as changeFreeItem, On as updatePromotionDealsInMenuGroup, Qi as Big, Ur as countAmount, W as payByCard, Wr as generateSubmitOrderObj, Yn as changeSelectedDiscount, _n as setTriposPayFinish, di as copyMemberActivityOrderContext, en as setOrderStatus, mt as savePaymentId, nn as setPaymentMemberCardRecord, nt as removeItemRewardInfoFromOrder, pt as saveOrderResult, q as recalculatePromotion, qr as isGiftCardWithCreditCardOrder, vn as setTriposPayReady, wt as setCardPaidResult } from "./actions-BwRPwnFF.js";
import { F as promiseFinally } from "./kioskConfigApi-68IKDHob.js";
import { t as native_i18n_default } from "./native-i18n-Bya1piKW.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { l as setNeedCommit, r as orderUnlock, t as orderLock } from "./orderLock-9vtPVs0P.js";
import { t as getDeviceDirection } from "./getDeviceDirection-BKza3HeE.js";
import { t as XMLObjTree } from "./ObjectTree-D9iCBoZ6.js";
import { t as getChooseTableStatus } from "./chooseTable-BNJLkJ45.js";
import { t as process_default } from "./process-Cqmrsqte.js";
import { t as LottiePlayer } from "./LottiePlayer-CG-ciSfh.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { s as setCloudPromotionList, u as setItemValidPromotion } from "./promotion-BUTvAW3c.js";
import { n as require_interopRequireWildcard, r as require_interopRequireDefault, t as require_createSvgIcon } from "./createSvgIcon-DxdaFuGn.js";
import { a as sendError2MsgCenter, s as sendNewOrderMessage } from "./processZeroAmountOrder-bzVRsrOO.js";
import { r as isTipEnabledForPayment } from "./tipPaymentMethods-DcvlIwUR.js";
import { t as CallModal } from "./callModal-DiGxH1ne.js";
import { t as goToPaymentMemberOrFinish } from "./paymentMemberNavigation-B5bHxJaq.js";
import { t as require_lib } from "./lib-DuJXMpO6.js";
import { t as getOrderDetail } from "./getOrderDetail-DnTt-Usi.js";
import { i as getRemainingPaymentTipAmount } from "./tipPaymentRequest-DtrN4zH5.js";
import { i as resolveConnectionErrorUi, n as connectionError_module_default, o as normalizeTriposFailureCode, r as KNOWN_CONNECTION_ERROR_CODES, t as warming_red_default } from "./warming_red-aH97Y3MT.js";
//#region source-snapshot/src/container/cardPayment/cardPayment.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var cardPayment_module_default = {
	cardPaymentPage: "cardPaymentPage___7v3mc",
	cardPaymentInfo: "cardPaymentInfo___Xr7hT",
	cardPaymentTips: "cardPaymentTips___oSNv5",
	cardPaymentTipsMain: "cardPaymentTipsMain___quGCE",
	noCardWarning: "noCardWarning___XMugR",
	noCardShake: "noCardShake___6lz3F",
	noCardWarningIcon: "noCardWarningIcon___ImBB-",
	cardPaymentSubTips: "cardPaymentSubTips___s08jH",
	triposCancelButton: "triposCancelButton___SZr17",
	cardPaymentInfoBox: "cardPaymentInfoBox___fT2aJ",
	swipeImageBx: "swipeImageBx___Ivp0O",
	paymentDetail: "paymentDetail___aVc6N",
	payBox: "payBox___t9Q3h",
	dividerArrow: "dividerArrow___svDKD",
	arrowUpIcon: "arrowUpIcon___VqEpQ",
	jineBox: "jineBox___kINFC",
	jine: "jine___HZfOV",
	discount: "discount___mYKgQ",
	taxInfo: "taxInfo___42601"
};
//#endregion
//#region source-snapshot/src/utils/handlePromotionLimitError.js
/**
* 处理促销达到上限错误，执行重新下单流程
* @param {Object} history - React Router history 对象
*/
var handlePromotionLimitError = (history) => {
	if (!history) {
		window.location.hash = "/";
		return;
	}
	toast_default.info(native_i18n_default.t("promotion-reward-limited"));
	const state = native_store_default.getState();
	const itemValidPromotion = state?.promotion?.itemValidPromotion;
	const promotionCenterList = state?.promotion?.promotionCenterList;
	const selectedPromotion = itemValidPromotion?.find((e) => e.isSelected);
	native_store_default.dispatch(setItemValidPromotion(null));
	native_store_default.dispatch(removeItemRewardInfoFromOrder());
	native_store_default.dispatch(recalculatePromotion());
	if (selectedPromotion?.promotion?.id && promotionCenterList) {
		const selectedPromotionId = selectedPromotion.promotion.id;
		const updatedPromotionCenterList = promotionCenterList.filter((item) => item.id !== selectedPromotionId);
		native_store_default.dispatch(setCloudPromotionList(updatedPromotionCenterList));
		native_store_default.dispatch(updatePromotionDealsInMenuGroup());
	}
	native_store_default.dispatch(setIsReorderFlag(true));
	setTimeout(() => {
		history.goBack();
	}, 0);
};
/**
* 检查 saveOrder 响应中的错误，如果是促销达到上限错误则处理
* @param {Object} res - saveOrder 的响应对象
* @param {Object} history - React Router history 对象
* @returns {boolean} 如果是促销达到上限错误并已处理，返回 true；否则返回 false
*/
var checkAndHandlePromotionLimitError = (res, history) => {
	if (res?.data?.result?.failureReason === "PROMOTION_HAS_REACHED_LIMIT") {
		handlePromotionLimitError(history);
		return true;
	}
	return false;
};
//#endregion
//#region source-snapshot/src/utils/getTriposTransactionResultCode.js
/**
* 调用壳子 getTransactionResultCode，获取 Tripos 交易结果码（body 内值）。
* @param {string|number} amount 当前订单金额（元）
* @returns {Promise<string>} 归一化后的 triposFailureCode，如 "05"
*/
async function getTriposTransactionResultCode(amount) {
	if (amount == null || amount === "") return "";
	if (!window.AppJSBridge || typeof window.AppJSBridge.call !== "function") throw new Error("AppJSBridge 未初始化");
	const result = await window.AppJSBridge.call("getTransactionResultCode", { amount: String(amount) });
	return normalizeTriposFailureCode(result != null && typeof result === "object" && Object.prototype.hasOwnProperty.call(result, "body") ? result.body : result);
}
//#endregion
//#region source-snapshot/src/utils/paymentAttempt.js
var activePaymentOrderId = null;
var normalizeOrderId = (orderId) => orderId == null || orderId === "" ? null : String(orderId);
var beginPaymentAttempt = (orderId) => {
	if (activePaymentOrderId !== null) return false;
	activePaymentOrderId = normalizeOrderId(orderId);
	return activePaymentOrderId !== null;
};
var bindPaymentAttemptOrderId = (orderId) => {
	if (activePaymentOrderId === null) return false;
	activePaymentOrderId = normalizeOrderId(orderId);
	return activePaymentOrderId !== null;
};
var finishPaymentAttempt = (orderId) => {
	const normalizedOrderId = normalizeOrderId(orderId);
	if (normalizedOrderId !== null && activePaymentOrderId !== normalizedOrderId) return false;
	activePaymentOrderId = null;
	return true;
};
//#endregion
//#region source-snapshot/src/assets/lottie/payment_operation.json?url&no-inline
var payment_operation_default = "" + new URL("payment_operation-DWKAXkHs.json", import.meta.url).href;
var TransactionTips_module_default = {
	tipWrap: "tipWrap___3q4md",
	title: "title___grSiq",
	imageWrap: "imageWrap___kcm1G",
	triposCancelButton: "triposCancelButton___17Tjz"
};
var error_default = {
	nm: "newScene",
	h: 100,
	w: 100,
	meta: { "g": "SVG to Lottie v0.15.1-0.6.0" },
	layers: [{
		"ty": 4,
		"nm": "",
		"sr": 1,
		"st": 0,
		"op": 170,
		"ip": 0,
		"hasMask": false,
		"ao": 0,
		"ks": {
			"a": {
				"a": 0,
				"k": [0, 0]
			},
			"s": {
				"a": 0,
				"k": [100, 100]
			},
			"sk": {
				"a": 0,
				"k": 0
			},
			"p": {
				"a": 0,
				"k": [0, 0]
			},
			"r": {
				"a": 0,
				"k": 0
			},
			"sa": {
				"a": 0,
				"k": 0
			},
			"o": {
				"a": 0,
				"k": 100
			}
		},
		"ef": [],
		"shapes": [
			{
				"ty": "gr",
				"nm": "",
				"it": [
					{
						"ty": "sh",
						"nm": "",
						"d": 1,
						"ks": {
							"a": 0,
							"k": {
								"c": false,
								"i": [[0, 0], [0, 0]],
								"o": [[0, 0], [0, 0]],
								"v": [[42.8, 42.8], [57.2, 57.2]]
							}
						}
					},
					{
						"ty": "st",
						"nm": "",
						"lc": 2,
						"lj": 2,
						"ml": 4,
						"o": {
							"a": 0,
							"k": 100
						},
						"w": {
							"a": 0,
							"k": 3
						},
						"c": {
							"a": 0,
							"k": [
								1,
								1,
								1
							]
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [0, 0],
								"t": 33.5
							}, {
								"s": [100, 100],
								"t": 110
							}]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [50, 50],
								"t": 33.5
							}, {
								"s": [0, 0],
								"t": 110
							}]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [0],
								"t": 33.5
							}, {
								"s": [100],
								"t": 110
							}]
						}
					}
				]
			},
			{
				"ty": "gr",
				"nm": "",
				"it": [
					{
						"ty": "sh",
						"nm": "",
						"d": 1,
						"ks": {
							"a": 0,
							"k": {
								"c": false,
								"i": [[0, 0], [0, 0]],
								"o": [[0, 0], [0, 0]],
								"v": [[57.2, 42.8], [42.8, 57.2]]
							}
						}
					},
					{
						"ty": "st",
						"nm": "",
						"lc": 2,
						"lj": 2,
						"ml": 4,
						"o": {
							"a": 0,
							"k": 100
						},
						"w": {
							"a": 0,
							"k": 3
						},
						"c": {
							"a": 0,
							"k": [
								1,
								1,
								1
							]
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [0, 0],
								"t": 29
							}, {
								"s": [100, 100],
								"t": 87.5
							}]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [50, 50],
								"t": 29
							}, {
								"s": [0, 0],
								"t": 87.5
							}]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [0],
								"t": 29
							}, {
								"s": [100],
								"t": 87.5
							}]
						}
					}
				]
			},
			{
				"ty": "gr",
				"nm": "",
				"it": [
					{
						"ty": "el",
						"nm": "",
						"d": 1,
						"p": {
							"a": 0,
							"k": [50, 50]
						},
						"s": {
							"a": 0,
							"k": [56, 56]
						}
					},
					{
						"ty": "fl",
						"nm": "",
						"c": {
							"a": 0,
							"k": [
								.937,
								.267,
								.267
							]
						},
						"r": 1,
						"o": {
							"a": 0,
							"k": 100
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [0, 0],
								"t": 24.5
							}, {
								"s": [100, 100],
								"t": 65
							}]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [50, 50],
								"t": 24.5
							}, {
								"s": [0, 0],
								"t": 65
							}]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [0],
								"t": 24.5
							}, {
								"s": [100],
								"t": 65
							}]
						}
					}
				]
			},
			{
				"ty": "gr",
				"nm": "",
				"it": [
					{
						"ty": "el",
						"nm": "",
						"d": 1,
						"p": {
							"a": 0,
							"k": [50, 50]
						},
						"s": {
							"a": 0,
							"k": [80, 80]
						}
					},
					{
						"ty": "fl",
						"nm": "",
						"c": {
							"a": 0,
							"k": [
								.996,
								.792,
								.792
							]
						},
						"r": 1,
						"o": {
							"a": 0,
							"k": 100
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [0, 0],
								"t": 20
							}, {
								"s": [100, 100],
								"t": 42.5
							}]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [50, 50],
								"t": 20
							}, {
								"s": [0, 0],
								"t": 42.5
							}]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 1,
							"k": [{
								"o": {
									"x": .34,
									"y": 1.55
								},
								"i": {
									"x": .65,
									"y": 1
								},
								"s": [0],
								"t": 20
							}, {
								"s": [50],
								"t": 42.5
							}]
						}
					}
				]
			}
		],
		"ind": 1
	}],
	v: "5.7.0",
	fr: 60,
	op: 170,
	ip: 0,
	assets: []
};
//#endregion
//#region source-snapshot/src/container/cardPayment/components/TransactionTips.js
var import_jsx_runtime = require_jsx_runtime();
var TransactionTips = (props) => {
	const { t } = useTranslation();
	const { isShowModal, onCancelPay, tipsText, tipsType, showTriposCancelButton } = props;
	const status = {
		payCancel: error_default,
		payPreparing: process_default,
		payReading: process_default
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		visible: isShowModal,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: TransactionTips_module_default.tipWrap,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: TransactionTips_module_default.title,
					children: tipsText
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: TransactionTips_module_default.imageWrap,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LottiePlayer, { animationData: status[tipsType] })
				}),
				getCookie("serviceTarget") === "INGENICO" && showTriposCancelButton && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: TransactionTips_module_default.triposCancelButton,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: onCancelPay,
						children: t("payment_cancel")
					})
				})
			]
		})
	});
};
//#endregion
//#region source-snapshot/src/container/cardPayment/components/TriposCardInputPrompt.js
function TriposCardInputPrompt({ mode, t, onContinue }) {
	const ui = resolveConnectionErrorUi("005", "", t, "", mode);
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
				children: ui.opsText
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: connectionError_module_default.failureDescription,
				children: ui.mainText
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: connectionError_module_default.btnBoxs,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `${connectionError_module_default.topBtn} ${connectionError_module_default.topBtnSingle}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: connectionError_module_default.tryAgainBtn,
						role: "button",
						tabIndex: 0,
						onClick: onContinue,
						onKeyDown: (event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								onContinue();
							}
						},
						children: ui.tryAgainText
					})
				})
			})
		]
	});
}
//#endregion
//#region source-snapshot/src/utils/navigateToConnectionError.js
var triposInteractionHandler = null;
function registerTriposInteractionHandler(handler) {
	triposInteractionHandler = handler;
	return () => {
		if (triposInteractionHandler === handler) triposInteractionHandler = null;
	};
}
//#endregion
//#region node_modules/@material-ui/icons/ArrowDropUp.js
var require_ArrowDropUp = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _interopRequireWildcard = require_interopRequireWildcard();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	exports.default = (0, _interopRequireDefault(require_createSvgIcon()).default)(/*#__PURE__*/ React.createElement("path", { d: "M7 14l5-5 5 5z" }), "ArrowDropUp");
}));
//#endregion
//#region node_modules/@material-ui/icons/ArrowDropDown.js
var require_ArrowDropDown = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _interopRequireWildcard = require_interopRequireWildcard();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	exports.default = (0, _interopRequireDefault(require_createSvgIcon()).default)(/*#__PURE__*/ React.createElement("path", { d: "M7 10l5 5 5-5z" }), "ArrowDropDown");
}));
//#endregion
//#region source-snapshot/src/utils/resolveMobyCardInfoError.js
var import_ArrowDropUp = /* @__PURE__ */ __toESM(require_ArrowDropUp());
var import_ArrowDropDown = /* @__PURE__ */ __toESM(require_ArrowDropDown());
/** MSCardReaderErrorCode → i18n key */
var MS_CARD_READER_ERROR_I18N_KEYS = {
	4001: "moby_card_reader_err_4001",
	4002: "moby_card_reader_err_4002",
	4003: "moby_card_reader_err_4003",
	4004: "moby_card_reader_err_4004",
	4005: "moby_card_reader_err_4005",
	4006: "moby_card_reader_err_4006",
	4007: "moby_card_reader_err_4007",
	4008: "moby_card_reader_err_4008",
	4009: "moby_card_reader_err_4009",
	4010: "moby_card_reader_err_4010",
	4011: "moby_card_reader_err_4011",
	4012: "moby_card_reader_err_4012",
	4013: "moby_card_reader_err_4013",
	4014: "moby_card_reader_err_4014",
	4015: "moby_card_reader_err_4015",
	4016: "moby_card_reader_err_4016"
};
/** code 不为 1 时视为失败 */
function isMobyCardInfoError(data) {
	if (data == null) return true;
	return Number(data.code) !== 1;
}
/**
* @param {{ message?: string, body?: { errorCode?: number|string } }} data
* @param {import('i18next').TFunction} t
*/
function resolveMobyCardInfoFailureReason(data, t) {
	const rawErrorCode = data?.body?.errorCode;
	if (rawErrorCode !== void 0 && rawErrorCode !== null && rawErrorCode !== "") {
		const i18nKey = MS_CARD_READER_ERROR_I18N_KEYS[Number(rawErrorCode)];
		if (i18nKey) return t(i18nKey);
	}
	switch (String(data?.message ?? "").trim().toLowerCase()) {
		case "cardreader lost": return t("moby_card_err_card_reader_lost");
		case "contactlessfailed": return t("moby_card_err_contactless_failed");
		case "cancel": return t("moby_card_err_cancel");
		case "user input timed out": return t("moby_card_err_user_input_timed_out");
		case "the battery level of the card is low": return t("moby_card_err_battery_low");
		default: return t("connect-error");
	}
}
/** cardState 8/9/10 错误文案 */
function resolveRuaCardStateFailureReason(cardStateCode, t) {
	switch (Number(cardStateCode)) {
		case 8: return t("rua_card_state_err_8");
		case 9: return t("moby_card_err_contactless_failed");
		case 10: return t("rua_card_state_err_10");
		default: return t("connect-error");
	}
}
/**
* rua 读卡进度文案：code 8/9/10 优先使用已有 i18n，其余优先壳子 message
* @param {string} type
* @param {number} code
* @param {string} message
* @param {import('i18next').TFunction} t
*/
function resolveRuaPaymentProgressText(type, code, message, t) {
	if (type === "cardState") {
		const numericCode = Number(code);
		if (numericCode === 8 || numericCode === 9 || numericCode === 10) return resolveRuaCardStateFailureReason(numericCode, t);
	}
	const raw = String(message ?? "").trim();
	if (raw) return raw;
	return "";
}
//#endregion
//#region source-snapshot/src/constants/ruaPaymentProgress.js
/** cardState code */
var RUA_CARD_STATE = {
	UNKNOWN: 0,
	READY_FOR_INSERT: 1,
	WAITING_FOR_CARD: 2,
	MAGSTRIPE_SWIPED: 3,
	CONTACTLESS_TAPPED: 4,
	ICC_INSERTED: 5,
	CARD_REMOVED: 6,
	READING: 7,
	READ_FAILED: 8,
	TAP_FAILED: 9,
	MULTIPLE_CARDS: 10,
	TRANSACTION_CANCELLED: 11,
	CARD_EXPIRED: 12,
	DEVICE_BUSY: 13
};
var RUA_PAYMENT_PROGRESS_EVENT = "rua_payment_progress";
//#endregion
//#region source-snapshot/src/utils/ruaPaymentProgress.js
var ruaPaymentActive = false;
/** 异常 posFrontLog 去重 key，支付结束 reset 时清空 */
var loggedAbnormalKeys = /* @__PURE__ */ new Set();
RUA_CARD_STATE.READY_FOR_INSERT, RUA_CARD_STATE.WAITING_FOR_CARD;
RUA_CARD_STATE.MAGSTRIPE_SWIPED, RUA_CARD_STATE.CONTACTLESS_TAPPED, RUA_CARD_STATE.ICC_INSERTED, RUA_CARD_STATE.READING;
function setRuaPaymentActive(active) {
	ruaPaymentActive = !!active;
	if (!ruaPaymentActive) resetRuaPaymentProgress();
}
function resetRuaPaymentProgress() {
	loggedAbnormalKeys.clear();
}
//#endregion
//#region source-snapshot/src/utils/cardPaymentPreparation.js
var preparedCardOrder = null;
var takePreparedCardOrder = (savedOrder) => {
	const prepared = preparedCardOrder;
	preparedCardOrder = null;
	const order = prepared?.response?.data?.order;
	return order && order.id === savedOrder?.id && order.checksum === savedOrder?.checksum ? prepared : null;
};
//#endregion
//#region source-snapshot/src/container/cardPayment/index.js
var import_lib = /* @__PURE__ */ __toESM(require_lib());
var PAY_AGAIN = "PAY_AGAIN";
var TRIPOSCOUNTDOWN = 10;
var NONINGENICOCOUNTDOWN = 2;
var CardPayment = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			errorApiMsg: "",
			errorApiShow: false,
			callLoading: false,
			callLoadObj: {},
			tipsLoading: true,
			loadingText: "",
			tipsType: "",
			countdown: TRIPOSCOUNTDOWN,
			showTriposCancelButton: false,
			nonIngenicoCountdown: NONINGENICOCOUNTDOWN,
			isCancellingPayment: false,
			triposCardInputMode: "",
			triposRequestStarted: false,
			waitingForTriposResult: false,
			showWakingTips: false,
			showRuaProgressTips: false,
			showNoCardWarning: false,
			orderId: null,
			isAmountDetailVisible: false,
			_prevTriposPayReadyForTips: !!(props.sysCookie && props.sysCookie.triposPayReady)
		};
		this.timer = null;
		this.countdownTimer = null;
		this.nonIngenicoTimer = null;
		this.wakingTipsTimer = null;
		this.noCardCheckTimer = null;
		this._paymentErrorHandled = false;
	}
	/**
	* triposPayReady 从 false→true 时若只在 componentDidUpdate 里 setState，
	* 会先渲染一帧 isShowModal=false（TransactionTips 闪断）。在此与 props 同步阶段
	* 立刻打开 showWakingTips 并更新文案，保证弹窗连续、只换字。
	*/
	static getDerivedStateFromProps(nextProps, prevState) {
		const ready = !!(nextProps.sysCookie && nextProps.sysCookie.triposPayReady);
		if (prevState.isCancellingPayment || prevState.waitingForTriposResult) return ready === prevState._prevTriposPayReadyForTips ? null : { _prevTriposPayReadyForTips: ready };
		if (getCookie("serviceTarget") !== "INGENICO") {
			if (ready === prevState._prevTriposPayReadyForTips) return null;
			return { _prevTriposPayReadyForTips: ready };
		}
		const wasReady = !!prevState._prevTriposPayReadyForTips;
		if (ready && !wasReady) return {
			_prevTriposPayReadyForTips: true,
			loadingText: nextProps.t("payment_device_waking"),
			showTriposCancelButton: false,
			showWakingTips: true
		};
		if (ready !== wasReady) return { _prevTriposPayReadyForTips: ready };
		return null;
	}
	parseLicenseXml = (data) => {
		let findAppInstances = data;
		let start = findAppInstances?.indexOf("<soap:Body>");
		let end = findAppInstances?.indexOf("</soap:Body>");
		findAppInstances = findAppInstances?.substring(start + 11, end);
		return (new XMLObjTree()?.parseXML(findAppInstances))?.fetchorderresponsetype?.order;
	};
	isGiftCardPartialPayScenario = () => {
		const { currentOrder, cardPaidResult } = this.props;
		return !!(currentOrder?.saveOrderResult?.id && currentOrder?.paymentTypeTrail?.includes("GIFT_CARD") && cardPaidResult?.status === "PARTIALLY_PAID");
	};
	saveOrderHandler = async (orderData) => {
		const { currentOrder, allSysConfig, setOrderStatus, store, payByCash, payByCard } = this.props;
		if (currentOrder.orderStatus == "in payment" && currentOrder.savePaymentId == "") return new Promise((resolve, reject) => {
			resolve(PAY_AGAIN);
		});
		else {
			setOrderStatus("in saving order");
			let newOrderData = copyMemberActivityOrderContext(orderData, { ...orderData });
			if (allSysConfig?.CREDIT_CHARGE_ENABLE === "true") {
				const { cashPaymentTotal, creditPaymentTotal } = await countAmount(store, payByCash, payByCard);
				newOrderData = copyMemberActivityOrderContext(newOrderData, {
					...newOrderData,
					order: {
						...newOrderData.order,
						cashPaymentTotal,
						creditPaymentTotal
					}
				});
			}
			return saveOrder(newOrderData);
		}
	};
	afterPayment = () => {
		const { selfConfig, currentOrder } = this.props;
		const isShowSign = selfConfig?.configList?.find((each) => each.id === 23)?.value;
		if (currentOrder?.paymentTypeTrail?.includes("GIFT_CARD") || this.isBuyGiftCard()) {
			if (isShowSign) this.props.history.push("/signature");
			else this.goToPaymentMemberOrFinish();
			return;
		}
		const tipProcedure = selfConfig?.configList?.find((each) => each.id === 24)?.value;
		const isShowTip = isTipEnabledForPayment(selfConfig, "CREDIT_CARD");
		if (tipProcedure === 1) {
			if (!isShowSign && !isShowTip) {
				this.goToPaymentMemberOrFinish();
				return;
			}
			this.props.history.push("/afterCreditCardPay");
			return;
		}
		if (isShowSign) this.props.history.push("/signature");
		else this.goToPaymentMemberOrFinish();
	};
	goToPaymentMemberOrFinish = () => goToPaymentMemberOrFinish({
		history: this.props.history,
		allSysConfig: this.props.allSysConfig,
		crm: this.props.crm,
		currentOrder: {
			...this.props.currentOrder,
			paymentMemberCardRecord: this.paymentMemberCardRecord || this.props.currentOrder?.paymentMemberCardRecord
		}
	});
	handleSetCall = (status) => {
		this.setState({
			callLoading: true,
			callLoadObj: {
				msgDone: status,
				handlePrint: this.handlePrint,
				handleSkip: this.afterPayment
			}
		});
	};
	handlePrintCall = async (orderId) => {
		if (native_store_default.getState().currentOrder?.postPaymentActions?.callTicketPrinted) {
			this.setState({
				callLoading: false,
				callLoadObj: {}
			});
			this.afterPayment();
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
					this.setState({
						callLoading: false,
						callLoadObj: {}
					});
					this.afterPayment();
				} else {
					this.handleSetCall("fail");
					sendError2MsgCenter(orderId, "printCall failed");
					posFrontLog(`${orderId} printCall failed`);
				}
			} catch {
				this.handleSetCall("fail");
				sendError2MsgCenter(orderId, "printCall failed");
				posFrontLog(`${orderId} printCall failed`);
			}
		} else this.afterPayment();
	};
	handlePrint = (orderId) => {
		this.setState({
			callLoading: true,
			callLoadObj: { msgDone: "ing" }
		});
		judgeSskeyIsActiveTime().then(() => this.handlePrintCall(orderId));
	};
	showErrorAndJump = (msg, code = "000", orderId) => {
		this.showApiModalTip(msg);
		this.jumpRrrorPage({
			failureReason: msg,
			code,
			pay: 0,
			orderId
		});
	};
	/** failureReasonCode 不在已知列表时，调用壳子获取 Tripos 交易结果码 */
	jumpPaymentFailurePage = async ({ failureReason, code, pay = 0, amount, orderId }) => {
		const normalizedCode = String(code ?? "001").trim();
		let triposFailureCode = "";
		if (!KNOWN_CONNECTION_ERROR_CODES.has(normalizedCode)) try {
			triposFailureCode = await getTriposTransactionResultCode(amount);
			if (triposFailureCode) posFrontLog(`Tripos failure code: ${triposFailureCode}`);
		} catch (err) {
			posFrontLog(`getTransactionResultCode error: ${err?.message || err}`);
		}
		this.jumpRrrorPage({
			failureReason,
			code: normalizedCode,
			pay,
			triposFailureCode,
			orderId
		});
	};
	/** INGENICO：根据设备 body（或缓存的 mobyDeviceInfo）校验后写入 SN 并支付；directExpress 为 true 时走 rua 支付 */
	payIngenicoWithDeviceBody = async (deviceBody, paymentCtx) => {
		const { t } = this.props;
		const { paymentObj, orderId, orderNumber, phoneNumber } = paymentCtx;
		const connected = deviceBody?.connected || deviceBody?.status?.connection?.state;
		const serialNumber = deviceBody?.serialNumber || deviceBody?.cardReader?.serialNumber;
		if (!connected || (serialNumber?.length ?? 0) < 1) {
			this.showErrorAndJump(t("card_reader_device_not_connected"), "003", orderId);
			return;
		}
		paymentObj.transactionDetail.serialNumber = serialNumber;
		this._isTriposPayment = deviceBody?.directExpress !== true;
		if (deviceBody?.directExpress === true) {
			setRuaPaymentActive(true);
			resetRuaPaymentProgress();
			this.props.setTriposPayReady(false);
			this.props.setTriposPayFinish(false);
			try {
				if (typeof window.loadCreditCardInfoByIngenico !== "function") throw new Error("loadCreditCardInfoByIngenico 不可用");
				const payAmount = String(paymentObj?.transactionDetail?.amount ?? paymentObj?.paymentRecord?.amount);
				const mobyCardInfoResult = await window.loadCreditCardInfoByIngenico(payAmount);
				if (isMobyCardInfoError(mobyCardInfoResult)) {
					const failureReason = resolveMobyCardInfoFailureReason(mobyCardInfoResult, t);
					posFrontLog(`loadCreditCardInfoByIngenico失败: ${JSON.stringify(mobyCardInfoResult)}`);
					this.jumpRrrorPage({
						code: "000",
						failureReason,
						pay: 0,
						orderId
					});
					return;
				}
				const mobyCardInfo = {
					Serial: serialNumber,
					EMVStartTransaction: mobyCardInfoResult?.body?.data
				};
				paymentObj.transactionDetail.mobyCardInfo = JSON.stringify(mobyCardInfo);
			} catch (err) {
				posFrontLog(`获取mobyCardInfo(loadCreditCardInfoByIngenico)出错: ${err?.message || err}`);
				this.jumpRrrorPage({
					code: "000",
					failureReason: t("connect-error"),
					pay: 0,
					orderId
				});
				return;
			} finally {
				setRuaPaymentActive(false);
			}
		}
		await this.fetchPayment({
			paymentObj,
			orderId,
			orderNumber,
			phoneNumber
		});
	};
	/**
	* INGENICO：先 getIngenicoDeviceSNAndDeviceInfo，成功则按设备 body 支付；
	* directExpress 为 true 时走 rua 支付并附带 mobyCardInfo；
	* 失败则打日志并调用 loadPaymentInfo；仍然失败则以缓存的 mobyDeviceInfo
	*/
	runIngenicoPaymentWithDeviceFetch = (paymentCtx, mobyDeviceInfoFallback) => {
		const tryIngenicoDeviceInfo = async () => {
			try {
				return await getIngenicoDeviceSNAndDeviceInfo();
			} catch (err) {
				posFrontLog(`获取设备信息getIngenicoDeviceSNAndDeviceInfo出错: ${err}`);
				if (typeof window.loadPaymentInfo === "function") try {
					return await window.loadPaymentInfo();
				} catch (err2) {
					posFrontLog(`获取设备信息loadPaymentInfo出错: ${err2.message}`);
					throw err2;
				}
				throw err;
			}
		};
		tryIngenicoDeviceInfo().then((info) => this.payIngenicoWithDeviceBody(info.body, paymentCtx)).catch(() => this.payIngenicoWithDeviceBody(mobyDeviceInfoFallback, paymentCtx));
	};
	fetchPayment = async ({ paymentObj, orderId, orderNumber, phoneNumber }) => {
		const { selfConfig, currentOrder, userId } = this.props;
		this._paymentErrorHandled = false;
		if (this._isTriposPayment) {
			this._triposRequestStarted = true;
			this._triposRequestSettled = false;
			this.setState({ triposRequestStarted: true });
			this._removeTriposInteractionHandler?.();
			this._removeTriposInteractionHandler = registerTriposInteractionHandler(this.handleTriposInteraction);
		}
		posFrontLog(`Kiosk Start SendPayment[CardPayment]
      ServiceTarget: ${paymentObj?.transactionDetail?.serviceTarget}; 
      OrderId: ${orderId ?? ""}; 
      orderNumber: ${orderNumber ?? ""}; 
      TotalAmount: ${paymentObj?.paymentRecord?.amount}`);
		const paymentAmount = paymentObj?.paymentRecord?.amount ?? paymentObj?.transactionDetail?.amount;
		promiseFinally(sendPayment(paymentObj).then(async (resp) => {
			if (this._isTriposPayment) {
				this._triposRequestSettled = true;
				if (typeof resp?.data?.result?.successful !== "boolean") throw new Error("The payment interface returned invalid data.");
				this.setState({ triposCardInputMode: "" });
			}
			if (resp?.data?.result?.successful) {
				posFrontLog(`Kiosk SendPayment Success[CardPayment]
            orderStatus: ${resp?.data?.orderStatus} ; 
            PaymentId: ${resp?.data?.id} ; 
            sendPayment: ${selfConfig?.configMap?.id_20} ;
            insufficientBalanceResponse-Balance: ${resp?.data?.insufficientBalanceResponse?.balance} ;`);
				this.props.savePaymentId(resp.data.id);
				this.paymentMemberCardRecord = {
					orderId: Number(orderId),
					paymentRecordId: Number(resp.data.id),
					orderStatus: resp.data.orderStatus,
					isFullCreditPayment: resp.data.orderStatus === "PAID" && !(currentOrder.paymentTypeTrail || []).some((type) => type !== "CREDIT_CARD") && currentOrder.paymentMemberCardRecord?.orderStatus !== "PARTIALLY_PAID" && !(Number(this.props.cardPaidResult?.unpaidInfo?.paid) > 0)
				};
				this.props.setPaymentMemberCardRecord(this.paymentMemberCardRecord);
				let arr = selfConfig?.configMap?.id_20 || [];
				if (resp.data.orderStatus === "PAID") {
					if (arr.includes(0)) await this.handleSendKitchen(orderId);
					this.props.setCardPaidResult({});
				} else if (resp.data.orderStatus === "PARTIALLY_PAID") {
					judgeSskeyIsActiveTime().then(() => getOrderDetail({
						orderId,
						setCardPaidResult: this.props.setCardPaidResult
					}));
					if (arr.includes(1)) await this.handleSendKitchen(orderId);
				}
				this.sendNewOrderMessageOnce(orderId, orderNumber, phoneNumber);
				const { orderType, tabelServiceType } = currentOrder;
				const locatorType = selfConfig?.configMap?.id_28;
				if (orderType === "DINE_IN" && tabelServiceType === "DINE_IN" && locatorType === 0) {
					await this.handlePrint(orderId);
					return;
				}
				await this.afterPayment();
			} else {
				const failureReasonCode = resp.data?.result?.failureReasonCode;
				const failureReason = resp.data?.result?.failureReason || "The payment interface returned an exception.";
				if (failureReasonCode === 101023 || !this._isTriposPayment && this.state.isCancellingPayment) this.jumpRrrorPage({
					code: this._isTriposPayment ? "101023" : "002",
					failureReason: failureReasonCode === 101023 ? resp.data?.result?.failureReason ?? "Transaction cancelled" : "Transaction cancelled",
					pay: 0,
					orderId
				});
				else {
					this.showApiModalTip(failureReason);
					await this.jumpPaymentFailurePage({
						failureReason,
						code: failureReasonCode ?? "001",
						pay: 0,
						amount: paymentAmount,
						orderId
					});
				}
			}
		}).catch(async (err) => {
			if (this._paymentErrorHandled) return;
			if (this._isTriposPayment) {
				this._triposRequestSettled = true;
				this.setState({
					triposCardInputMode: "",
					waitingForTriposResult: false
				});
				posFrontLog(`Tripos payment request failed: OrderId=${orderId}; ${err?.message || err}`);
				this.showErrorAndJump(this.props.t("connect-error"), "000", orderId);
				return;
			}
			if (err?.message?.type == "cancel" || !this._isTriposPayment && this.state.isCancellingPayment) {
				const failureReason = err?.message?.type == "cancel" ? err?.message || "Transaction cancelled" : "Transaction cancelled";
				if (err?.message?.type == "cancel") toast_default.info(failureReason);
				this.jumpRrrorPage({
					code: "002",
					failureReason,
					pay: 0,
					orderId
				});
			} else {
				const failureReason = err?.message || "Payment failed";
				this.showApiModalTip(failureReason);
				await this.jumpPaymentFailurePage({
					failureReason,
					code: "000",
					pay: 0,
					amount: paymentAmount,
					orderId
				});
			}
		}), () => {
			const lockParm = {
				targetId: orderId,
				userId
			};
			const onErrCb = (apiRes) => {
				this.showErrorAndJump(apiRes?.data?.msg || "Lock Error", "000", orderId);
			};
			const lockData = orderUnlock(lockParm, onErrCb);
			finishPaymentAttempt(orderId);
			if (!lockData) return;
		});
	};
	handleGiftCardCreditCardPayment = async () => {
		const { currentOrder, userId } = this.props;
		if (this.state.orderId) return;
		const orderId = currentOrder.saveOrderResult.id;
		const orderNumber = currentOrder.saveOrderResult.orderNumber;
		const phoneNumber = currentOrder.saveOrderResult.customer?.phone?.[0]?.number;
		const orderDetail = await getOrderDetail({
			orderId,
			setCardPaidResult: this.props.setCardPaidResult
		});
		const checksum = orderDetail?.checksum || currentOrder.saveOrderResult.checksum;
		const unpaidAmount = parseFloat(orderDetail?.unpaidInfo?.unpaid) || 0;
		const tipAmount = getRemainingPaymentTipAmount({
			selectedTipAmount: currentOrder.tipAmount,
			orderDetail
		});
		if (unpaidAmount <= 0) {
			this.afterPayment();
			return;
		}
		this.setState({ orderId });
		let paymentObj = {
			fromProduct: "KIOSK",
			paymentRecord: {
				type: "CREDIT_CARD",
				amount: unpaidAmount,
				paidAmount: unpaidAmount,
				cardType: "UNKNOWN",
				orderId,
				checksum,
				multiplePayments: false,
				isOnlinePayment: true,
				tipAdded: true
			},
			printPaymentReceipt: false,
			merchantCopyOnly: false,
			transactionDetail: {
				actionType: "SALE",
				amount: unpaidAmount,
				serviceTarget: getCookie("serviceTarget") || "PAX",
				forceDuplicate: true,
				tipAmount
			},
			userAuth: { sessionKey: getCookie("sessionKey") }
		};
		const lockParm = {
			targetId: orderId,
			userId
		};
		const onErrCb = (apiRes) => {
			this.showErrorAndJump(apiRes?.data?.msg || "Lock Error");
		};
		if (!await orderLock(lockParm, onErrCb)) return;
		this.props.setOrderStatus("in payment");
		if (getCookie("serviceTarget") === "INGENICO") {
			const { sysCookie: { mobyDeviceInfo } = {} } = this.props;
			this.runIngenicoPaymentWithDeviceFetch({
				paymentObj,
				orderId,
				orderNumber,
				phoneNumber
			}, mobyDeviceInfo);
		} else await this.fetchPayment({
			paymentObj,
			orderId,
			orderNumber,
			phoneNumber
		});
	};
	isBuyGiftCard = () => {
		const { cardPaidResult, currentOrder } = this.props;
		return cardPaidResult.type === "CLOUD_GIFT_CARD" || currentOrder.saveOrderResult.type === "CLOUD_GIFT_CARD";
	};
	handleBuyGiftCardViaCreditCard = async () => {
		const { userId, cardPaidResult, currentOrder } = this.props;
		if (this.state.orderId) return;
		const { ordernumber: orderNumber, id: orderId, checksum } = cardPaidResult;
		const { allSysConfig } = this.props;
		const { totalPrice, discount, creditPaymentTotal } = currentOrder.saveOrderResult;
		const unpaidAmount = allSysConfig?.CREDIT_CHARGE_ENABLE === "true" && creditPaymentTotal != null && creditPaymentTotal !== "" ? Number(creditPaymentTotal) : Big(totalPrice).minus(discount).toNumber();
		this.setState({ orderId });
		let paymentObj = {
			fromProduct: "KIOSK",
			paymentRecord: {
				orderId,
				type: "CREDIT_CARD",
				amount: unpaidAmount,
				paidAmount: unpaidAmount,
				multiplePayments: false,
				cardType: "UNKNOWN",
				checksum
			},
			printPaymentReceipt: false,
			merchantCopyOnly: false,
			transactionDetail: {
				actionType: "SALE",
				amount: unpaidAmount,
				serviceTarget: getCookie("serviceTarget") || "PAX",
				forceDuplicate: true
			},
			userAuth: { sessionKey: getCookie("sessionKey") }
		};
		const lockParm = {
			targetId: orderId,
			userId
		};
		const onErrCb = (apiRes) => {
			this.showErrorAndJump(apiRes?.data?.msg || "Lock Error");
		};
		if (!await orderLock(lockParm, onErrCb)) return;
		this.props.setOrderStatus("in payment");
		if (getCookie("serviceTarget") === "INGENICO") {
			const { sysCookie: { mobyDeviceInfo } = {} } = this.props;
			this.runIngenicoPaymentWithDeviceFetch({
				paymentObj,
				orderId,
				orderNumber
			}, mobyDeviceInfo);
		} else await this.fetchPayment({
			paymentObj,
			orderId,
			orderNumber
		});
	};
	handleSubmitCardPay = async () => {
		if (this.isBuyGiftCard()) {
			await this.handleBuyGiftCardViaCreditCard();
			return;
		}
		if (this.isGiftCardPartialPayScenario()) {
			await this.handleGiftCardCreditCardPayment();
			return;
		}
		const { setNeedCommit, sysCookie: { mobyDeviceInfo } } = this.props;
		if (this.state.orderId) return;
		if (!beginPaymentAttempt("creating-order")) return;
		setNeedCommit(true);
		let orderData;
		const preparedOrder = takePreparedCardOrder(this.props.currentOrder.saveOrderResult);
		try {
			orderData = preparedOrder?.orderData || await generateSubmitOrderObj(this.props.store);
		} catch (err) {
			finishPaymentAttempt();
			this.showErrorAndJump(err?.message || "Order Create Error", "004");
			return;
		}
		(preparedOrder ? Promise.resolve(preparedOrder.response) : this.saveOrderHandler(orderData)).then(async (res) => {
			const { currentOrder } = this.props;
			if (res.data?.result?.successful) {
				if (currentOrder.tableId) getChooseTableStatus(true);
			}
			if (res == PAY_AGAIN || res.data.result.successful) {
				let orderId = null;
				let checksum = null;
				let orderNumber = null;
				let phoneNumber = null;
				let tipAmount = parseFloat(currentOrder.tipAmount);
				let crmIntegrationDiscount = 0;
				if (orderData?.order?.discountList) {
					const crmIntegrationDiscountList = JSON.parse(orderData.order.discountList);
					if (crmIntegrationDiscountList?.length > 0) {
						const discountInfo = crmIntegrationDiscountList[0];
						if (discountInfo.type === "promotion" && !discountInfo?.extraInfo?.isItemDetailDiscount) crmIntegrationDiscount = discountInfo.amount;
						else if (!discountInfo.isReward && !discountInfo?.extraInfo?.isItemDetailDiscount) crmIntegrationDiscount = discountInfo.amount;
					}
				}
				const totalAmount = Big(orderData?.order?.totalPrice).plus(orderData?.order?.totalTax).plus(tipAmount).plus(orderData?.order?.chargeTotal).plus(orderData?.order?.togoTotal).minus(orderData?.order?.rewardDiscount ?? 0).minus(orderData?.order?.discount ?? 0).minus(crmIntegrationDiscount).toNumber();
				if (res == PAY_AGAIN) {
					orderId = currentOrder.saveOrderResult.id;
					checksum = currentOrder.saveOrderResult.checksum;
					orderNumber = currentOrder.saveOrderResult.orderNumber;
					phoneNumber = currentOrder.saveOrderResult.customer?.phone?.[0]?.number;
					this.setState({ orderId: currentOrder.saveOrderResult.id });
				} else {
					orderId = res.data.order.id;
					checksum = res.data.order.checksum;
					orderNumber = res.data.order.orderNumber;
					phoneNumber = res.data.order.customer?.phone?.[0]?.number;
					this.props.saveOrderResult(res.data.order);
					this.setState({ orderId: res.data.order.id });
				}
				bindPaymentAttemptOrderId(orderId);
				let paymentObj = {
					fromProduct: "KIOSK",
					paymentRecord: {
						type: "CREDIT_CARD",
						amount: totalAmount,
						paidAmount: totalAmount,
						cardType: "UNKNOWN",
						orderId,
						checksum,
						multiplePayments: false,
						isOnlinePayment: true,
						tipAdded: true
					},
					printPaymentReceipt: false,
					merchantCopyOnly: false,
					transactionDetail: {
						actionType: "SALE",
						amount: totalAmount,
						serviceTarget: getCookie("serviceTarget") || "PAX",
						forceDuplicate: true,
						tipAmount
					},
					userAuth: { sessionKey: getCookie("sessionKey") }
				};
				const lockParm = {
					targetId: res?.data?.order?.id || this.props?.currentOrder?.saveOrderResult?.id,
					userId: this.props?.userId
				};
				const onErrCb = (apiRes) => {
					this.showErrorAndJump(apiRes?.data?.msg || "Lock Error", "000");
				};
				if (!await orderLock(lockParm, onErrCb)) return;
				this.props.setOrderStatus("in payment");
				if (getCookie("serviceTarget") === "INGENICO") this.runIngenicoPaymentWithDeviceFetch({
					paymentObj,
					orderId,
					orderNumber,
					phoneNumber
				}, mobyDeviceInfo);
				else await this.fetchPayment({
					paymentObj,
					orderId,
					orderNumber,
					phoneNumber
				});
			} else {
				finishPaymentAttempt();
				if (checkAndHandlePromotionLimitError(res, this.props.history)) return;
				this.showErrorAndJump(res.data?.result?.failureReason || res.data?.result?.exception || "Order Create Error", res.data?.result?.failureReasonCode ?? "004");
			}
		}).catch((err) => {
			finishPaymentAttempt();
			this.showErrorAndJump(err?.message || "Order Create Error", "004");
		});
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
			if (!(await send2Kitchen(send2KitchenObj)).data.result.successful && orderId) {
				sendError2MsgCenter(orderId, "Send to kitchen failed");
				posFrontLog(`${orderId} Send to kitchen failed`);
			} else markPostPaymentAction("kitchenSent");
		} catch {
			if (orderId) {
				sendError2MsgCenter(orderId, "Send to kitchen failed");
				posFrontLog(`${orderId} Send to kitchen failed`);
			}
		}
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
	jumpRrrorPage = (payload) => {
		if (this._isTriposPayment && this._triposRequestStarted && !this._triposRequestSettled) return;
		if (this._paymentErrorHandled) return;
		this._paymentErrorHandled = true;
		const resolved = typeof payload === "string" ? {
			code: "000",
			failureReason: payload,
			pay: 0,
			triposFailureCode: "",
			orderId: this.state.orderId ?? ""
		} : {
			code: payload?.code ?? "000",
			failureReason: payload?.failureReason ?? "",
			pay: payload?.pay ?? 0,
			triposFailureCode: payload?.triposFailureCode ?? "",
			orderId: payload?.orderId ?? this.state.orderId ?? ""
		};
		const logTripos = resolved.triposFailureCode ? ` tripos=${resolved.triposFailureCode}` : "";
		finishPaymentAttempt(resolved.orderId || void 0);
		posFrontLog(`Kiosk Payment Error: 【${resolved.code}】${resolved.failureReason}${logTripos}`);
		this.errorNavigationTimer = setTimeout(() => {
			this.props.history.push({
				pathname: "/connectionError",
				search: import_lib.default.stringify({
					pay: resolved.pay,
					code: resolved.code,
					...resolved.orderId ? { orderId: resolved.orderId } : {},
					...resolved.triposFailureCode ? { triposFailureCode: resolved.triposFailureCode } : {}
				}),
				state: {
					failureReason: resolved.failureReason,
					orderSnapshot: String(this.props.currentOrder?.saveOrderResult?.id ?? "") === String(resolved.orderId ?? "") ? this.props.currentOrder.saveOrderResult : void 0,
					...resolved.triposFailureCode ? { triposFailureCode: resolved.triposFailureCode } : {}
				}
			});
		}, 2e3);
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
	formatterTaxList = (obj) => {
		let list = [];
		for (let k in obj) list.push(`${obj[k].taxName}: $${this.formatterFixed(obj[k].taxAmount)}`);
		return list;
	};
	toggleAmountDetail = () => {
		this.setState((prevState) => ({ isAmountDetailVisible: !prevState.isAmountDetailVisible }));
	};
	formatterFixed = (money) => {
		return parseFloat(money).toFixed(2);
	};
	cancelTriposPayment = () => {
		if (this._isTriposPayment !== false && !this._triposRequestStarted) return;
		if (this._cancelRequested || this._triposRequestSettled) return;
		this._cancelRequested = true;
		this.stopCountdown();
		clearTimeout(this.wakingTipsTimer);
		clearTimeout(this.noCardCheckTimer);
		this.setState({
			triposCardInputMode: "",
			waitingForTriposResult: true,
			loadingText: this.props.t("payment_cancel_ing"),
			tipsType: "payCancel",
			showTriposCancelButton: false,
			isCancellingPayment: true,
			showRuaProgressTips: false
		});
		if (window.isAndroidShell && window.isAndroidShell() || window.isIosShell && window.isIosShell()) Promise.resolve().then(() => abortIngenicoTransaction()).then((info) => {
			if (this._isTriposPayment) return;
			this.jumpRrrorPage({
				code: "002",
				failureReason: "Transaction cancelled",
				pay: 0
			});
		}).catch((err) => {
			if (this._isTriposPayment) {
				posFrontLog(`Tripos cancel request failed: ${err?.message || err}`);
				return;
			}
			this.jumpRrrorPage({
				code: "002",
				failureReason: "Transaction cancelled",
				pay: 0
			});
		});
	};
	waitForTriposPaymentResult = () => {
		this.stopCountdown();
		clearTimeout(this.wakingTipsTimer);
		clearTimeout(this.noCardCheckTimer);
		this.setState({
			triposCardInputMode: "",
			waitingForTriposResult: true,
			showTriposCancelButton: false,
			showWakingTips: true,
			loadingText: this.props.t(this._cancelRequested ? "payment_cancel_ing" : "payment_tripos_reading"),
			tipsType: this._cancelRequested ? "payCancel" : "payReading"
		});
	};
	handleTriposInteraction = ({ code, triposCardInputMode }) => {
		posFrontLog(`Tripos device event: code=${code}; requestPending=${!this._triposRequestSettled}`);
		if (this._triposRequestSettled || this._cancelRequested) return;
		if (code === "005" && triposCardInputMode) {
			this.stopCountdown();
			clearTimeout(this.wakingTipsTimer);
			clearTimeout(this.noCardCheckTimer);
			this.setState({
				triposCardInputMode,
				waitingForTriposResult: false,
				showWakingTips: false,
				showNoCardWarning: false
			});
			this.props.setTriposPayFinish(false);
		} else this.waitForTriposPaymentResult();
	};
	continueTriposPayment = () => {
		this.setState({ triposCardInputMode: "" });
	};
	startCountdown = () => {
		this.setState({
			countdown: TRIPOSCOUNTDOWN,
			showTriposCancelButton: false
		});
		this.countdownTimer = setInterval(() => {
			this.setState((prevState) => {
				const newCountdown = prevState.countdown - 1;
				if (newCountdown <= 0) {
					clearInterval(this.countdownTimer);
					return {
						countdown: 0,
						showTriposCancelButton: true
					};
				}
				return { countdown: newCountdown };
			});
		}, 1e3);
	};
	stopCountdown = () => {
		if (this.countdownTimer) {
			clearInterval(this.countdownTimer);
			this.countdownTimer = null;
		}
	};
	startNonIngenicoCountdown = () => {
		this.setState({ nonIngenicoCountdown: NONINGENICOCOUNTDOWN });
		this.nonIngenicoTimer = setInterval(() => {
			this.setState((prevState) => {
				const newCountdown = prevState.nonIngenicoCountdown - 1;
				if (newCountdown <= 0) {
					clearInterval(this.nonIngenicoTimer);
					this.setState({ tipsLoading: false });
					return { nonIngenicoCountdown: 0 };
				}
				return { nonIngenicoCountdown: newCountdown };
			});
		}, 1e3);
	};
	stopNonIngenicoCountdown = () => {
		if (this.nonIngenicoTimer) {
			clearInterval(this.nonIngenicoTimer);
			this.nonIngenicoTimer = null;
		}
	};
	componentDidMount() {
		this.setState({
			loadingText: this.props.t("payment_preparing"),
			tipsType: "payPreparing"
		});
		if (getCookie("serviceTarget") === "INGENICO") this.startCountdown();
		else this.startNonIngenicoCountdown();
		judgeSskeyIsActiveTime().then(() => this.handleSubmitCardPay());
		EventBus.on(RUA_PAYMENT_PROGRESS_EVENT, this.handleRuaPaymentProgress);
	}
	handleRuaPaymentProgress = ({ type, code, message }) => {
		const progressText = resolveRuaPaymentProgressText(type, code, message, this.props.t);
		if (!progressText) return;
		this.setState({
			loadingText: progressText,
			tipsType: "payPreparing",
			showRuaProgressTips: true
		});
	};
	componentDidUpdate(prevProps) {
		if (this.state.isCancellingPayment || this.state.waitingForTriposResult) return;
		const { sysCookie: { triposPayFinish, triposPayReady } } = this.props;
		const { sysCookie: { triposPayFinish: prevTriposPayFinish, triposPayReady: prevTriposPayReady } } = prevProps;
		if (getCookie("serviceTarget") === "INGENICO" && triposPayReady && !prevTriposPayReady) {
			this.stopCountdown();
			if (this.wakingTipsTimer) {
				clearTimeout(this.wakingTipsTimer);
				this.wakingTipsTimer = null;
			}
			this.wakingTipsTimer = setTimeout(() => {
				this.setState({ showWakingTips: false });
				this.wakingTipsTimer = null;
				if (getCookie("serviceTarget") === "INGENICO") this.noCardCheckTimer = setTimeout(() => {
					if (!this.props.sysCookie.triposPayFinish) this.setState({ showNoCardWarning: true });
					this.noCardCheckTimer = null;
				}, 3e4);
			}, 1e3);
		}
		if (getCookie("serviceTarget") === "INGENICO" && triposPayFinish && !prevTriposPayFinish) {
			if (this.noCardCheckTimer) {
				clearTimeout(this.noCardCheckTimer);
				this.noCardCheckTimer = null;
			}
			this.setState({
				showNoCardWarning: false,
				showRuaProgressTips: false
			});
			setTimeout(() => {
				if (this._cancelRequested) return;
				this.setState({
					loadingText: this.props.t("payment_tripos_reading"),
					tipsType: "payReading",
					showTriposCancelButton: false
				});
			}, 0);
		}
	}
	componentWillUnmount() {
		this._removeTriposInteractionHandler?.();
		clearTimeout(this.errorNavigationTimer);
		clearTimeout(this.timer);
		if (this.wakingTipsTimer) {
			clearTimeout(this.wakingTipsTimer);
			this.wakingTipsTimer = null;
		}
		if (this.noCardCheckTimer) {
			clearTimeout(this.noCardCheckTimer);
			this.noCardCheckTimer = null;
		}
		this.stopCountdown();
		this.stopNonIngenicoCountdown();
		setRuaPaymentActive(false);
		EventBus.off(RUA_PAYMENT_PROGRESS_EVENT, this.handleRuaPaymentProgress);
		this.props.setTriposPayReady(false);
		this.props.setTriposPayFinish(false);
		this.setState({ orderId: null });
	}
	render() {
		if (this.state.triposCardInputMode) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriposCardInputPrompt, {
			mode: this.state.triposCardInputMode,
			t: this.props.t,
			onContinue: this.continueTriposPayment
		});
		const { t, selfConfig, togoList, currentOrder, store: { crm: { selectedFreeItem }, promotion }, sysCookie: { triposPayFinish, triposPayReady }, cardPaidResult, allSysConfig } = this.props;
		const isBuyGiftCardOrder = this.isBuyGiftCard();
		const { totalPrice, discount, creditPaymentTotal } = currentOrder.saveOrderResult;
		const { errorApiShow, errorApiMsg, callLoading, callLoadObj, tipsLoading, loadingText, tipsType, showTriposCancelButton, isCancellingPayment, showWakingTips, showRuaProgressTips, showNoCardWarning, isAmountDetailVisible } = this.state;
		const orderInfo = getOrderInfoObj(this.props.store);
		let subTotal = orderInfo?.orderSubtotal;
		if (isBuyGiftCardOrder) subTotal = totalPrice;
		let totalTax = orderInfo?.orderTaxTotal;
		let taxInfoList = this.formatterTaxList(orderInfo?.orderTaxDetail);
		let tipAmount = currentOrder.tipAmount;
		let charge = orderInfo?.chargeTotal;
		let togoTotal = orderInfo?.togoTotal;
		const orderData = generateSubmitOrderObj(this.props.store)?.order;
		let rewardDiscount = orderData?.rewardDiscount || 0;
		if (orderData?.discountList) {
			const crmIntegrationDiscountList = JSON.parse(orderData.discountList);
			if (crmIntegrationDiscountList?.length > 0) {
				const discountInfo = crmIntegrationDiscountList[0];
				if (discountInfo.type === "promotion") rewardDiscount = discountInfo.amount;
				else if (!discountInfo.isReward) rewardDiscount = discountInfo.amount;
			}
		}
		let orderDiscount = orderInfo?.orderDiscount;
		let buyGiftCardDiscount = 0;
		if (isBuyGiftCardOrder) {
			buyGiftCardDiscount = discount || 0;
			charge = 0;
		}
		let paid = 0;
		if (isGiftCardWithCreditCardOrder(currentOrder?.paymentTypeTrail || []) && currentOrder.saveOrderResult.id) paid = cardPaidResult?.unpaidInfo?.paid;
		let totalAmount = isBuyGiftCardOrder && allSysConfig?.CREDIT_CHARGE_ENABLE === "true" && creditPaymentTotal != null && creditPaymentTotal !== "" ? Number(creditPaymentTotal).toFixed(2) : Big(subTotal).plus(totalTax).plus(charge).plus(togoTotal).plus(tipAmount).minus(rewardDiscount).minus(orderDiscount).minus(buyGiftCardDiscount).minus(paid || 0).toFixed(2);
		const count = [
			...currentOrder.itemList,
			...selectedFreeItem,
			...promotion?.buyGifts?.[0]?.items || []
		].reduce((total, item) => total + (item.quantity || 1), 0);
		const direction = getDeviceDirection();
		const displayTotalAmount = totalAmount;
		const isTipAfterPayment = selfConfig?.configList?.find((each) => each.id === 24)?.value === 1;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cardPayment_module_default.cardPaymentPage,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cardPayment_module_default.cardPaymentInfo,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cardPayment_module_default.cardPaymentTips,
							children: [
								getCookie("serviceTarget") === "INGENICO" && showNoCardWarning && !triposPayFinish && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cardPayment_module_default.noCardWarning,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: "" + new URL("warming_red-BQj5BTPb.png", import.meta.url).href,
										alt: "",
										className: cardPayment_module_default.noCardWarningIcon
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("payment_no_card_detected") })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: showNoCardWarning ? cardPayment_module_default.cardPaymentTipsMain : void 0,
									children: t("payment_tips")
								}),
								getCookie("serviceTarget") === "INGENICO" && (this._isTriposPayment === false || this.state.triposRequestStarted) && !triposPayFinish && direction !== "vertical" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cardPayment_module_default.triposCancelButton,
									onClick: () => {
										this.cancelTriposPayment();
									},
									children: t("payment_cancel")
								}),
								getCookie("serviceTarget") !== "INGENICO" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cardPayment_module_default.cardPaymentSubTips,
									children: t("payment_tips2")
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cardPayment_module_default.cardPaymentInfoBox,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: cardPayment_module_default.swipeImageBx,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LottiePlayer, { path: payment_operation_default })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cardPayment_module_default.paymentDetail,
								children: [
									isAmountDetailVisible && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: cardPayment_module_default.jineBox,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: cardPayment_module_default.jine,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("subtotal") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", this.formatterFixed(Big(subTotal))] })]
											}),
											currentOrder.orderType == "TO_GO" || currentOrder.orderType == "PICK_UP" ? togoList.map((item, idx) => {
												if (item.select?.id) if (item.select.id == -1) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: cardPayment_module_default.jine,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t([TOGONAMELIST[item.id]]) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("free") })]
												}, item.id + "_" + idx);
												else return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: cardPayment_module_default.jine,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t([TOGONAMELIST[item.id]]) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", this.formatterFixed(item.id !== 4 ? item.select.rate : item.select.rate * count)] })]
												}, item.id + "_" + idx);
											}) : null,
											selfConfig?.charge?.length > 0 && charge > 0 && selfConfig.charge.map((item) => {
												if (item.id === 1 && item.select?.id) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: cardPayment_module_default.jine,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.select.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", this.formatterFixed(charge)] })]
												}, item.id);
											}),
											!isTipAfterPayment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: cardPayment_module_default.jine,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("Tips") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", this.formatterFixed(tipAmount)] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: cardPayment_module_default.jine,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("taxTotal") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["$", this.formatterFixed(totalTax)] })]
											}),
											taxInfoList.length > 1 && taxInfoList.map((item, idx) => {
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: `${cardPayment_module_default.jine} ${cardPayment_module_default.taxInfo}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.split(":")[0] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.split(":")[1] })]
												}, idx);
											}),
											rewardDiscount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `${cardPayment_module_default.jine} ${cardPayment_module_default.discount}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("redeemDiscount") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["-$", this.formatterFixed(rewardDiscount)] })]
											}),
											(orderDiscount > 0 || buyGiftCardDiscount > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `${cardPayment_module_default.jine} ${cardPayment_module_default.discount}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("orderDis") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["-$", this.formatterFixed(orderDiscount || buyGiftCardDiscount)] })]
											}),
											paid > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `${cardPayment_module_default.jine} ${cardPayment_module_default.discount}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("paid") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["-$", this.formatterFixed(paid)] })]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cardPayment_module_default.dividerArrow,
										onClick: this.toggleAmountDetail,
										children: isAmountDetailVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ArrowDropDown.default, { className: cardPayment_module_default.arrowUpIcon }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_ArrowDropUp.default, { className: cardPayment_module_default.arrowUpIcon })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: cardPayment_module_default.payBox,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: cardPayment_module_default.totalTitle,
											children: t("allTotal")
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: cardPayment_module_default.total,
											children: ["$", displayTotalAmount]
										})]
									})
								]
							})]
						}),
						getCookie("serviceTarget") === "INGENICO" && (this._isTriposPayment === false || this.state.triposRequestStarted) && !triposPayFinish && direction === "vertical" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cardPayment_module_default.triposCancelButton,
							onClick: () => {
								this.cancelTriposPayment();
							},
							children: t("payment_cancel")
						})
					]
				}),
				callLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallModal, {
					callLoading,
					loadObj: callLoadObj
				}) : null,
				errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
					variant: "filled",
					severity: "error",
					children: errorApiMsg
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransactionTips, {
					isShowModal: getCookie("serviceTarget") === "INGENICO" && (!triposPayReady || triposPayFinish || isCancellingPayment || showWakingTips || showRuaProgressTips) || getCookie("serviceTarget") !== "INGENICO" && tipsLoading,
					tipsText: loadingText,
					tipsType,
					showTriposCancelButton: showTriposCancelButton && (this._isTriposPayment === false || this.state.triposRequestStarted),
					onCancelPay: this.cancelTriposPayment
				})
			]
		});
	}
};
function mapStateToProps(state) {
	return {
		store: state,
		togoList: state.togoList,
		selfConfig: state.selfConfig,
		currentOrder: state.currentOrder,
		systemConfig: state.systemConfig,
		crm: state.crm,
		avocado: state.avocado,
		allSysConfig: state.allSysConfig,
		sysCookie: state.sysCookie,
		userId: state.sysCookie.kioskConfigUserId,
		cardPaidResult: state.cardPaidResult
	};
}
var cardPayment_default = withRouter(connect(mapStateToProps, {
	saveOrderResult,
	setOrderStatus,
	savePaymentId,
	setPaymentMemberCardRecord,
	setCardPaidResult,
	changeSelectedDiscount,
	changeFreeItem,
	setNeedCommit,
	setTriposPayReady,
	setTriposPayFinish,
	payByCard,
	payByCash,
	markPostPaymentAction
})(withTranslation()(CardPayment)));
//#endregion
export { cardPayment_default as default };
