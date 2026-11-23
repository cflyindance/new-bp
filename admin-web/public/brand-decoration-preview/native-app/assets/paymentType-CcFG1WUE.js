import { d as __toESM, i as require_react, n as require_jsx_runtime, o as __commonJSMin, t as toast_default } from "./toast-C8a1ReSo.js";
import { D as posFrontLog, F as send2Kitchen, N as saveOrder, O as printCall, R as sendPayment, a as getDeviceOrientation, c as judgeSskeyIsActiveTime, m as subscribeDeviceOrientation, r as getCookie, s as isOpenVtkeyboadrd } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { An as EMAIL, Bt as setIsReorderFlag, Cr as judgeConfigToSoldout, G as payByCash, H as markPostPaymentAction, K as payByGiftCard, Kn as changeFreeItem, Lt as setGiftCardPaymentInfo, Mn as PHONE_NUMBER, Qi as Big, Tr as judgeNeedPayOtherCharge, Ur as countAmount, W as payByCard, Wr as generateSubmitOrderObj, Yn as changeSelectedDiscount, an as setSelfConfig, c as appendPaymentTypeTrail, da as require_cloneDeep, di as copyMemberActivityOrderContext, en as setOrderStatus, g as clearECardState, k as fetchAvailableECards, kn as CARD_NUMBER, lr as calcCardMinAmout, mt as savePaymentId, pt as saveOrderResult, v as clearPayType, wn as spliceOrderBySoldout, wt as setCardPaidResult } from "./actions-BwRPwnFF.js";
import { F as promiseFinally } from "./kioskConfigApi-68IKDHob.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { l as setNeedCommit, n as orderLockProcedure, r as orderUnlock, t as orderLock } from "./orderLock-9vtPVs0P.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { t as SendAuthCode_default } from "./SendAuthCode-JDiMt820.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { t as getChooseTableStatus } from "./chooseTable-BNJLkJ45.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { o as useCloseModalOnHomePage } from "./hooks-DiifsOH5.js";
import { t as ComboHeader_default } from "./ComboHeader-DCNVP6mw.js";
import { t as LandscapeKeyboardManager } from "./landscapeKeyboardManager-BXsgiuB_.js";
import { o as isValidUSPhone, s as normalizePhoneDigits, t as formatUSPhoneInput } from "./phoneNumber-CPrZu7TP.js";
import { t as PhoneNumberEntryLayout } from "./PhoneNumberEntryLayout-DWDXd7Tb.js";
import { n as require_interopRequireWildcard, r as require_interopRequireDefault, t as require_createSvgIcon } from "./createSvgIcon-DxdaFuGn.js";
import { a as sendError2MsgCenter, n as processZeroAmountOrder, r as savePosStatus, s as sendNewOrderMessage, t as calculateTotalAmount } from "./processZeroAmountOrder-bzVRsrOO.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { a as shouldCollectTipAfterPayment, n as hasOnlyCashTipPaymentMethod, o as shouldCollectTipBeforePayment, r as isTipEnabledForPayment, s as shouldCollectTipBeforePaymentMethod, t as getTipProcedureValue } from "./tipPaymentMethods-DcvlIwUR.js";
import { t as CallModal } from "./callModal-DiGxH1ne.js";
import { t as require_lib } from "./lib-DuJXMpO6.js";
import { t as getOrderDetail } from "./getOrderDetail-DnTt-Usi.js";
import { t as buildGiftCardPaymentRecord } from "./tipPaymentRequest-DtrN4zH5.js";
import { t as soldoutModal_default } from "./soldoutModal-CCd1O5t5.js";
import { t as cardMinAmount_default } from "./cardMinAmount-DfJqO2k_.js";
import { t as LoadingText } from "./loadingText-DXRQ4Fu1.js";
import { t as judgeOnlyHaveFreeItem } from "./judgeOnlyHaveFreeItem-Bgp5tyri.js";
import { t as preserveOrderItemIds } from "./preserveOrderItemIds-B9N-X-X0.js";
import { t as cardPayTipModal_default } from "./cardPayTipModal-LshELHlv.js";
//#region source-snapshot/src/container/paymentType/paymentType.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var paymentType_module_default = {
	paymentTypePanelOuter: "paymentTypePanelOuter___uiqmW",
	paymentTypePanelInner: "paymentTypePanelInner___R7YNE",
	paymentMethod: "paymentMethod___8b2eu",
	payTwoBox: "payTwoBox___6aNz4",
	paymentType: "paymentType___ixjpM",
	payInfo: "payInfo___qhog1",
	payImg: "payImg___JKq7a",
	hasCharge: "hasCharge___jVLPw",
	payText: "payText___k1kKm",
	subtotal: "subtotal___1IcpQ",
	saveAmount: "saveAmount___Lr9at",
	cashPayment: "cashPayment___PZP6J",
	creditPayment: "creditPayment___LGFUg",
	giftCardPayment: "giftCardPayment___VIN5D",
	giftCardIllustration: "giftCardIllustration___P4aOs",
	giftCardSvg: "giftCardSvg___ITN-R",
	giftCardText: "giftCardText___4DxpW",
	errorModal: "errorModal___R-Kb9",
	noPaymentType: "noPaymentType___hc7qJ"
};
//#endregion
//#region source-snapshot/src/assets/images/icon-credit.png
var icon_credit_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQBAMAAABykSv/AAAAGFBMVEUAAAB6rf8dKTvg7P96q/9smd+30/96rv+NCIrGAAAACHRSTlMAsujoQ7nPjufyTjMAAAJJSURBVHja7NpBalRBFEDRBASnFoZk7g6kIWMDgitwAZINGMj+MY3pdI8a/HFw+3HODi5V7w9+vSsAAAAAAAAAAAAAAAAAAAAAeK/vF+vq1I91wZ6PHQ/roj2POI+Tkg/r4n2bcLH2boYcyN8juV4DfHoJeVoD3A25Wfu79XGN8HvGiLwMyYSP797NjFlf625OyBpCSI2QGiE1QmqE1AipEVIjpEZIjZAaITVzQr4MIaRGSI2QGiE1QmqE1AipEVIjpEZIjZAaITVCaoTUCKkRUiOkRkiNkBohNUJqhNQIqRFSMyfk5xBzdhrXEEJqhNQIqRFSI6RGSI2QGiE1QmqE1AipEVIjpEZIjZAaITVCaoTUCKkRUiOkRkiNkBohNUJqhNQIqRFSI6RGSI2QGiE1QmqE1AipEfJ/3T7u/tH9r3WiEnK72+C0JBJy6NheEgnZbbTeNEI+bw35ug4aIbvN1kEi5Hgg248kEfK4PeR+vUqE7N5hvSqE3G7POH6BCyGbR+R0SAohm0fkdEiErMasv027ECFChJwnRIiQ84QIEXKeECFCzhMiRMh5QgaHjPlBNyZkzE/sMc8KYx565jy9jXkMHfM8PWdhYMwKx5ylmjFrTnMWzzaZGvK0RribE/KwRri5ul4j/GmnjlEQBoMgjH6FYJtAwOv8heB1LHJ/xM7eKst7Nxh2Z7bu+wjvbvsIqxltf9SMkmw147dWNWGAj5pxklVfr/3izhqR5KgRSc5+3J6XtQIAAAAAAAAAAAAAAAAAAACA/3wAmi+ZN+XJ2OUAAAAASUVORK5CYII=";
//#endregion
//#region source-snapshot/src/assets/images/icon-cash.png
var icon_cash_default = "data:image/png;base64,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";
var cashPayConfirmModal_module_default = {
	tipBox: "tipBox___IIwBw",
	title: "title___0r8Z-",
	tipBtn: "tipBtn___m5zCV",
	confirmCash: "confirmCash___JfKSl",
	confirmCard: "confirmCard___po70Q"
};
//#endregion
//#region source-snapshot/src/component/cashPayConfirmModal/index.js
var import_jsx_runtime = require_jsx_runtime();
var CashPayConfirmModal = ({ visible, onClose, onConfirmCash, onConfirmCard, t }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		visible,
		onClose,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cashPayConfirmModal_module_default.tipBox,
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cashPayConfirmModal_module_default.title,
				children: t("cash-pay-confirm-dialog-message")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cashPayConfirmModal_module_default.tipBtn,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `${cashPayConfirmModal_module_default.confirmCash} linear-animate-btn`,
					onClick: onConfirmCash,
					children: t("cash")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `${cashPayConfirmModal_module_default.confirmCard} linear-animate-btn`,
					onClick: onConfirmCard,
					children: t("credit-card-payment")
				})]
			})]
		})
	});
};
var cashPayConfirmModal_default = withTranslation()(CashPayConfirmModal);
//#endregion
//#region source-snapshot/src/component/GiftCardPayment/CardPaymentWrapper.module.scss
var import_lib = /* @__PURE__ */ __toESM(require_lib());
var CardPaymentWrapper_module_default = { cardPaymentWrapper: "cardPaymentWrapper___11gm4" };
//#endregion
//#region source-snapshot/src/component/GiftCardPayment/QueryGiftCard.module.scss
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var QueryGiftCard_module_default = {
	loginWrapper: "loginWrapper___rBLf-",
	loginModal: "loginModal___ekgBB",
	queryTitle: "queryTitle___-IeFx",
	queryInput: "queryInput___yHb90",
	queryMethodWrapper: "queryMethodWrapper___kraMO",
	queryMethodItem: "queryMethodItem___TBFCz",
	queryMethodIcon: "queryMethodIcon___-d0-q",
	queryMethodText: "queryMethodText___lLTBb",
	queryMethodDivider: "queryMethodDivider___LeO-2",
	backToPartialPay: "backToPartialPay___pTwHj",
	queryButton: "queryButton___cNl1v",
	enableQueryButton: "enableQueryButton___x6L-P",
	disableQueryButton: "disableQueryButton___Gi-29"
};
//#endregion
//#region node_modules/@material-ui/icons/MailOutline.js
var require_MailOutline = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _interopRequireWildcard = require_interopRequireWildcard();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	exports.default = (0, _interopRequireDefault(require_createSvgIcon()).default)(/*#__PURE__*/ React.createElement("path", { d: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" }), "MailOutline");
}));
//#endregion
//#region node_modules/@material-ui/icons/CreditCard.js
var require_CreditCard = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _interopRequireWildcard = require_interopRequireWildcard();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	exports.default = (0, _interopRequireDefault(require_createSvgIcon()).default)(/*#__PURE__*/ React.createElement("path", { d: "M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" }), "CreditCard");
}));
//#endregion
//#region node_modules/@material-ui/icons/PhoneIphone.js
var require_PhoneIphone = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _interopRequireWildcard = require_interopRequireWildcard();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	exports.default = (0, _interopRequireDefault(require_createSvgIcon()).default)(/*#__PURE__*/ React.createElement("path", { d: "M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z" }), "PhoneIphone");
}));
//#endregion
//#region source-snapshot/src/component/GiftCardPayment/QueryGiftCard.js
var import_MailOutline = /* @__PURE__ */ __toESM(require_MailOutline());
var import_CreditCard = /* @__PURE__ */ __toESM(require_CreditCard());
var import_PhoneIphone = /* @__PURE__ */ __toESM(require_PhoneIphone());
var QueryGiftCard = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.phoneInputRef = null;
		this.queryInputRef = null;
		this.keyboardManager = null;
		this.timer = null;
	}
	state = {
		cardSearchType: PHONE_NUMBER,
		phoneNum: "",
		cardNum: "",
		emailAddress: "",
		isPhoneValid: false,
		isEmailValid: false,
		isCardValid: false,
		isPrivacyConfirm: false,
		keyboardToggle: false,
		step: 1,
		orientation: getDeviceOrientation()
	};
	componentDidMount() {
		const privacyConfirm = this.props.selfConfig?.configMap?.id_49;
		this.setState({ isPrivacyConfirm: privacyConfirm });
		const { currentOrder, ecardLastQuery } = this.props;
		const savedPhoneNum = currentOrder?.customer?.phone?.[0]?.number;
		if (ecardLastQuery) this.setState({
			cardSearchType: ecardLastQuery.cardSearchType || "PHONE_NUMBER",
			phoneNum: ecardLastQuery.phoneNum || "",
			cardNum: ecardLastQuery.cardNum || "",
			emailAddress: ecardLastQuery.emailAddress || "",
			isPhoneValid: ecardLastQuery.cardSearchType === "PHONE_NUMBER" && isValidUSPhone(ecardLastQuery.phoneNum),
			isEmailValid: ecardLastQuery.cardSearchType === "EMAIL" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ecardLastQuery.emailAddress || ""),
			isCardValid: ecardLastQuery.cardSearchType === "CARD_NUMBER" && !!ecardLastQuery.cardNum
		});
		else if (savedPhoneNum) {
			const formattedPhone = formatUSPhoneInput(savedPhoneNum);
			this.setState({
				phoneNum: formattedPhone,
				isPhoneValid: isValidUSPhone(formattedPhone)
			});
		}
		this.unsubscribeOrientation = subscribeDeviceOrientation(this.handleDeviceOrientation);
		this.updateKeyboardManager(this.state.orientation);
	}
	updateKeyboardManager = (orientation) => {
		if (orientation !== "vertical" && !this.keyboardManager) {
			this.keyboardManager = new LandscapeKeyboardManager(() => this.phoneInputRef);
			this.keyboardManager.setup();
		} else if (orientation === "vertical" && this.keyboardManager) {
			this.keyboardManager.cleanup();
			this.keyboardManager = null;
		}
	};
	handleDeviceOrientation = (orientation) => {
		this.setState({ orientation });
		this.updateKeyboardManager(orientation);
	};
	componentWillUnmount() {
		this.unsubscribeOrientation?.();
		if (this.keyboardManager) this.keyboardManager.cleanup();
		clearTimeout(this.timer);
	}
	keyboardChange = (nextFormattedValue) => {
		this.setState({
			phoneNum: nextFormattedValue,
			isPhoneValid: isValidUSPhone(nextFormattedValue)
		});
	};
	validateEmail = (email) => {
		const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
		this.setState({ isEmailValid: isValid });
		return isValid;
	};
	emailChange = (event) => {
		const emailAddress = event.target.value;
		this.setState({ emailAddress });
		this.validateEmail(emailAddress);
	};
	validateCard = (cardNum) => {
		const isValid = cardNum.length > 0;
		this.setState({ isCardValid: isValid });
		return isValid;
	};
	cardChange = (event) => {
		const trimmedCardNum = event.target.value.slice(0, 20);
		this.setState({ cardNum: trimmedCardNum });
		this.validateCard(trimmedCardNum);
	};
	changePrivacyConfirm = (value) => {
		this.setState({ isPrivacyConfirm: value });
	};
	queryGiftCard = async () => {
		const { cardSearchType, phoneNum, cardNum, emailAddress } = this.state;
		const { fetchAvailableECards, t } = this.props;
		const result = await fetchAvailableECards({
			cardSearchType,
			phoneNum,
			cardNum,
			emailAddress
		});
		if (!result.success) {
			toast_default.info(result.errorMsg || t("query_failed"), "top");
			return;
		}
		if (!result.cards || result.cards.length === 0) {
			this.setState({ step: 1 });
			toast_default.info(t("no_available_gift_cards"), "top");
		}
	};
	onConfirm = async () => {
		this.hideKeyboard();
		const { cardSearchType, phoneNum } = this.state;
		const { crm } = this.props;
		const currentPhone = normalizePhoneDigits(phoneNum);
		const isCurrentPhoneVerified = crm?.isCRMAuthCodeVerified && crm?.crmAuthCodeVerifiedPhone === currentPhone;
		if (cardSearchType === "PHONE_NUMBER" && !isCurrentPhoneVerified) {
			this.setState({ step: 2 });
			return;
		}
		await this.queryGiftCard();
	};
	handleKeyUp = async (e) => {
		if (e.keyCode === 13) await this.onConfirm();
	};
	showKeyboard = () => {
		this.setState({ keyboardToggle: true });
	};
	hideKeyboard = () => {
		this.setState({ keyboardToggle: false });
	};
	handleSetQueryType = (type) => {
		this.setState({
			cardSearchType: type,
			phoneNum: "",
			cardNum: "",
			emailAddress: "",
			isPhoneValid: false,
			isEmailValid: false,
			isCardValid: false
		}, () => {
			if (type === "EMAIL" || type === "CARD_NUMBER") requestAnimationFrame(() => {
				this.queryInputRef?.focus();
			});
		});
	};
	handleVerifySuccess = async () => {
		await this.queryGiftCard();
	};
	getIsQueryDisabled = () => {
		const { cardSearchType, isPrivacyConfirm, isPhoneValid, isEmailValid, isCardValid } = this.state;
		if (cardSearchType === "PHONE_NUMBER") return !isPrivacyConfirm || !isPhoneValid;
		if (cardSearchType === "EMAIL") return !isEmailValid;
		if (cardSearchType === "CARD_NUMBER") return !isCardValid;
		return true;
	};
	backToPrevStep = () => {};
	renderQueryMethodOptions = () => {
		const { t } = this.props;
		const { cardSearchType } = this.state;
		return [
			{
				type: PHONE_NUMBER,
				label: t("query_by_phone_number"),
				icon: import_PhoneIphone.default
			},
			{
				type: EMAIL,
				label: t("query_by_email"),
				icon: import_MailOutline.default
			},
			{
				type: CARD_NUMBER,
				label: t("query_by_card_number"),
				icon: import_CreditCard.default
			}
		].filter((item) => item.type !== cardSearchType).map((item, index) => {
			const QueryIcon = item.icon;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [index > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: QueryGiftCard_module_default.queryMethodDivider,
				children: "|"
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: QueryGiftCard_module_default.queryMethodItem,
				onClick: () => this.handleSetQueryType(item.type),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryIcon, { className: QueryGiftCard_module_default.queryMethodIcon }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: QueryGiftCard_module_default.queryMethodText,
					children: item.label
				})]
			})] }, item.type);
		});
	};
	render() {
		const { phoneNum, cardNum, isPrivacyConfirm, keyboardToggle, cardSearchType, emailAddress, step, orientation } = this.state;
		const isVertical = orientation === "vertical";
		const { t, onClose, ecardLoading, showBackToPartialPay, onBackToPartialPay } = this.props;
		const titleKey = cardSearchType === "EMAIL" ? "gift_card_email_title" : cardSearchType === "CARD_NUMBER" ? "gift_card_card_number_title" : "ecardPhone";
		const isQueryDisabled = this.getIsQueryDisabled();
		const queryAction = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: (0, import_classnames.default)(QueryGiftCard_module_default.queryButton, isQueryDisabled ? QueryGiftCard_module_default.disableQueryButton : QueryGiftCard_module_default.enableQueryButton, !isQueryDisabled && "linear-animate-btn"),
			onClick: isQueryDisabled ? void 0 : this.onConfirm,
			disabled: isQueryDisabled,
			children: t("gift_card_query_button")
		});
		if (step === 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendAuthCode_default, {
			goBackStep: this.backToPrevStep,
			phoneNum,
			onVerifySuccess: this.handleVerifySuccess,
			onClose,
			t,
			tempMemberInfo: null,
			isShowHeader: false
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: QueryGiftCard_module_default.loginWrapper,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: QueryGiftCard_module_default.loginModal,
					children: cardSearchType === "PHONE_NUMBER" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneNumberEntryLayout, {
						title: t(titleKey),
						value: phoneNum,
						placeholder: t("inputPhone"),
						inputRef: (el) => this.phoneInputRef = el,
						isVertical,
						onPhoneChange: this.keyboardChange,
						onKeyUp: this.handleKeyUp,
						onFocus: () => {
							if (!isVertical && !isOpenVtkeyboadrd()) {
								if (this.keyboardManager) {
									this.keyboardManager.forceCheck();
									setTimeout(() => {
										this.keyboardManager.handleKeyboardChange();
									}, 300);
								}
							} else if (isOpenVtkeyboadrd() && !isVertical) this.showKeyboard();
						},
						onBlur: () => {
							if (!isVertical && !isOpenVtkeyboadrd()) setTimeout(() => {
								if (this.keyboardManager) this.keyboardManager.handleKeyboardClose();
							}, 300);
						},
						onClick: () => {
							if (isOpenVtkeyboadrd() && !isVertical) this.showKeyboard();
						},
						afterField: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: QueryGiftCard_module_default.queryMethodWrapper,
							children: this.renderQueryMethodOptions()
						}),
						isPrivacyConfirm,
						changePrivacyConfirm: this.changePrivacyConfirm,
						actions: queryAction
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: QueryGiftCard_module_default.queryTitle,
							children: t(titleKey)
						}),
						cardSearchType === "EMAIL" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: (el) => this.queryInputRef = el,
							name: "emailAddress",
							value: emailAddress,
							autoFocus: false,
							className: QueryGiftCard_module_default.queryInput,
							type: "email",
							placeholder: t("input_email"),
							onChange: this.emailChange,
							onKeyUp: this.handleKeyUp
						}),
						cardSearchType === "CARD_NUMBER" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: (el) => this.queryInputRef = el,
							name: "cardNum",
							value: cardNum,
							autoFocus: false,
							className: QueryGiftCard_module_default.queryInput,
							type: "text",
							placeholder: t("input_card_number"),
							onChange: this.cardChange,
							onKeyUp: this.handleKeyUp
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: QueryGiftCard_module_default.queryMethodWrapper,
							children: this.renderQueryMethodOptions()
						}),
						queryAction
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: ecardLoading }),
				keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
					keyboardValue: phoneNum,
					handlePressEnter: this.onConfirm,
					changeInput: (value) => this.keyboardChange(value),
					closeKeyboard: () => this.hideKeyboard(),
					VKOuterStyle: { zIndex: 9999 }
				}) : null
			]
		});
	}
};
function mapStateToProps$3(state) {
	return {
		currentOrder: state.currentOrder,
		systemConfig: state.systemConfig,
		selfConfig: state.selfConfig,
		crm: state.crm,
		ecardLastQuery: state.ecard?.lastQuery,
		ecardLoading: state.ecard?.loading
	};
}
var QueryGiftCard_default = withTranslation()(connect(mapStateToProps$3, { fetchAvailableECards })(QueryGiftCard));
var CardList_module_default = {
	cardListContainer: "cardListContainer___AGgxx",
	content: "content___H9jrv",
	title: "title___bU3Di",
	summaryCard: "summaryCard___xdTfC",
	summaryBlock: "summaryBlock___sA6AD",
	summaryLabel: "summaryLabel___WaJy-",
	summaryValue: "summaryValue___49eNV",
	cardList: "cardList___dsH4G",
	detailsList: "detailsList___Hk-HS",
	cardItem: "cardItem___jFQ-1",
	cardArtwork: "cardArtwork___VETPP",
	artVariantOne: "artVariantOne___F15eR",
	artVariantTwo: "artVariantTwo___SmU78",
	artVariantThree: "artVariantThree___UKnNd",
	artVariantFour: "artVariantFour___sLtKm",
	cardMain: "cardMain___feJjG",
	cardNumber: "cardNumber___X1gCw",
	balanceRow: "balanceRow___tUjys",
	balanceLabel: "balanceLabel___QGenj",
	balanceValue: "balanceValue___WYfRu",
	expiryTag: "expiryTag___D1LkI",
	actionButton: "actionButton___B8JYu",
	redeemButton: "redeemButton___qQm75",
	emptyState: "emptyState___v2tx0"
};
//#endregion
//#region source-snapshot/src/assets/images/gift-card-image.png
var gift_card_image_default = "" + new URL("gift-card-image-CfI6Qnco.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/component/GiftCardPayment/CardList.js
var getAvailableCards = (cards) => (cards || []).filter((card) => (Number(card?.balance) || 0) > 0);
var formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;
var formatDate = (dateString) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return String(dateString);
	return date.toISOString().slice(0, 10);
};
var maskCardNumber = (cardNumber) => {
	const digits = String(cardNumber || "").replace(/\s+/g, "");
	if (digits?.length <= 4) return "xxxx";
	return `${digits.slice(0, -4)}xxxx`.replace(/(.{4})/g, "$1 ").trim();
};
var CardList = ({ cards, onSelectCard, t, cardSearchType }) => {
	const availableCards = getAvailableCards(cards);
	const totalBalance = availableCards.reduce((sum, card) => sum + (Number(card?.balance) || 0), 0);
	const isCardNumberQuery = cardSearchType === CARD_NUMBER;
	const titleKey = isCardNumberQuery ? "gift_card_details_title" : "gift_card_list_title";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: CardList_module_default.cardListContainer,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: CardList_module_default.content,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: CardList_module_default.title,
				children: t(titleKey)
			}), availableCards.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: CardList_module_default.emptyState,
				children: t("no_available_gift_cards")
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [!isCardNumberQuery ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: CardList_module_default.summaryCard,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: CardList_module_default.summaryBlock,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: CardList_module_default.summaryLabel,
						children: t("gift_card_total_balance")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: CardList_module_default.summaryValue,
						children: formatMoney(totalBalance)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: CardList_module_default.summaryBlock,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: CardList_module_default.summaryLabel,
						children: t("gift_card_total_cards")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: CardList_module_default.summaryValue,
						children: availableCards.length
					})]
				})]
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `${CardList_module_default.cardList} ${isCardNumberQuery ? CardList_module_default.detailsList : ""}`,
				children: availableCards.map((card, index) => {
					const expiresAt = formatDate(card?.giftCardExpiration);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: CardList_module_default.cardItem,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: CardList_module_default.cardArtwork,
								src: gift_card_image_default,
								alt: "gift card image"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: CardList_module_default.cardMain,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: CardList_module_default.cardNumber,
										children: maskCardNumber(card?.cardNumber)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: CardList_module_default.balanceRow,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: CardList_module_default.balanceLabel,
											children: t("gift_card_balance_label")
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: CardList_module_default.balanceValue,
											children: formatMoney(card?.balance)
										})]
									}),
									expiresAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: CardList_module_default.expiryTag,
										children: t("gift_card_expires_label", { date: expiresAt })
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `${CardList_module_default.actionButton} ${CardList_module_default.redeemButton} linear-animate-btn`,
								onClick: () => onSelectCard && onSelectCard(card),
								children: t("gift_card_redeem")
							})
						]
					}, card?.cardNumber || index);
				})
			})] })]
		})
	});
};
var CardList_default = withTranslation()(CardList);
var CardPartPayInfo_module_default = {
	cardPartPayInfo: "cardPartPayInfo___MQcTx",
	content: "content___j1EHZ",
	title: "title___nTvnL",
	amountPanel: "amountPanel___sVBIQ",
	amountRow: "amountRow___-6eaP",
	amountLabel: "amountLabel___8oUS3",
	amountValue: "amountValue___WaVX7",
	amountLabelStrong: "amountLabelStrong___wZ8H-",
	amountValueStrong: "amountValueStrong___6X3WH",
	divider: "divider___2kKy6",
	helperText: "helperText___ZcqKC",
	actionList: "actionList___tH-Zv",
	actionCard: "actionCard___-Bhsr",
	iconWrapper: "iconWrapper___7ffzk",
	actionIcon: "actionIcon___-iSvb",
	creditIcon: "creditIcon___Zngvt",
	cashIcon: "cashIcon___4Mib6",
	giftCardIcon: "giftCardIcon___qlYhy",
	actionLabel: "actionLabel___Sn-R-"
};
//#endregion
//#region source-snapshot/src/component/GiftCardPayment/CardPartPayInfo.js
var toCurrency = (amount) => {
	return `$${(Number(amount) || 0).toFixed(2)}`;
};
var CardPartPayInfo = (props) => {
	const { giftCardPaymentInfo, onPayByCard, onPayByCash, onPayByOtherGiftCard, paymentRouteResult, t } = props;
	const { canPayByCard, canPayByCash, canPayByEcard } = paymentRouteResult || {};
	const isGiftCardError = giftCardPaymentInfo?.isGiftCardError;
	const paidAmount = Number(giftCardPaymentInfo?.paidTotal) || Number(giftCardPaymentInfo?.paymentObj?.paymentRecord?.paidAmount) || 0;
	const totalAmount = Number(giftCardPaymentInfo?.totalAmount) || 0;
	const unpaidAmount = Number(giftCardPaymentInfo?.remainingAmount) || Math.max(Big(totalAmount).minus(paidAmount).toNumber(), 0);
	const actionList = [
		{
			key: "card",
			label: t("credit_debit_card"),
			icon: icon_credit_default,
			onClick: onPayByCard,
			iconClassName: CardPartPayInfo_module_default.creditIcon,
			visible: canPayByCard
		},
		{
			key: "cash",
			label: t("cash"),
			icon: icon_cash_default,
			onClick: onPayByCash,
			iconClassName: CardPartPayInfo_module_default.cashIcon,
			visible: canPayByCash
		},
		{
			key: "gift-card",
			label: t("ecard"),
			icon: gift_card_image_default,
			onClick: onPayByOtherGiftCard,
			iconClassName: CardPartPayInfo_module_default.giftCardIcon,
			visible: canPayByEcard && !isGiftCardError
		}
	].filter((action) => action.visible);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: CardPartPayInfo_module_default.cardPartPayInfo,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: CardPartPayInfo_module_default.content,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: CardPartPayInfo_module_default.title,
					children: t(isGiftCardError ? "gift_card_abnormal" : "gift_card_insufficient_balance")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: CardPartPayInfo_module_default.helperText,
					children: t("choose_other_payment_method")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: CardPartPayInfo_module_default.actionList,
					children: actionList.map((action) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `${CardPartPayInfo_module_default.actionCard} linear-animate-btn`,
						onClick: () => action.onClick?.(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: CardPartPayInfo_module_default.iconWrapper,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: action.icon,
								alt: "",
								className: `${CardPartPayInfo_module_default.actionIcon} ${action.iconClassName}`
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: CardPartPayInfo_module_default.actionLabel,
							children: action.label
						})]
					}, action.key))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: CardPartPayInfo_module_default.amountPanel,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: CardPartPayInfo_module_default.amountRow,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: CardPartPayInfo_module_default.amountLabel,
								children: t("paid")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: CardPartPayInfo_module_default.amountValue,
								children: toCurrency(paidAmount)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: CardPartPayInfo_module_default.divider }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: CardPartPayInfo_module_default.amountRow,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `${CardPartPayInfo_module_default.amountLabel} ${CardPartPayInfo_module_default.amountLabelStrong}`,
								children: t("unpaid")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `${CardPartPayInfo_module_default.amountValue} ${CardPartPayInfo_module_default.amountValueStrong}`,
								children: toCurrency(unpaidAmount)
							})]
						})
					]
				})
			]
		})
	});
};
var mapStateToProps$2 = (state) => ({ paymentRouteResult: handlePaymentTypeRoute(state.systemConfig, state.selfConfig) });
var CardPartPayInfo_default = withTranslation()(connect(mapStateToProps$2)(CardPartPayInfo));
//#endregion
//#region source-snapshot/src/component/GiftCardPayment/CardPaymentWrapper.js
var CardPaymentWrapper = (props) => {
	const { onClose, handleSelectGiftCard, giftCardPaymentInfo, showGiftCardPartialPayInfo, giftCardFlowMode, giftCardQueryFromPartialPay, onPayByCard, onPayByCash, onPayByOtherGiftCard, onContinuePayByGiftCard, onBackToPartialPay, availableCards, cardSearchType } = props;
	const isShowingCardList = availableCards.length > 0 && !(showGiftCardPartialPayInfo && giftCardPaymentInfo);
	const shouldBackToPartialPay = giftCardQueryFromPartialPay || isShowingCardList && !!giftCardPaymentInfo;
	const handleGoBack = () => {
		if (shouldBackToPartialPay) {
			onBackToPartialPay?.();
			return;
		}
		onClose?.();
	};
	const renderContent = () => {
		if (showGiftCardPartialPayInfo && giftCardPaymentInfo) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardPartPayInfo_default, {
			giftCardPaymentInfo,
			onPayByCard,
			onPayByCash,
			onPayByOtherGiftCard
		});
		if (availableCards.length > 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardList_default, {
			cards: availableCards,
			onSelectCard: giftCardFlowMode === "partial_continue" ? onContinuePayByGiftCard : handleSelectGiftCard,
			cardSearchType
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryGiftCard_default, {
			onClose,
			showBackToPartialPay: giftCardQueryFromPartialPay,
			onBackToPartialPay
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: CardPaymentWrapper_module_default.cardPaymentWrapper,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboHeader_default, {
			handleGoBack,
			hideBackButton: showGiftCardPartialPayInfo && !!giftCardPaymentInfo
		}), renderContent()]
	});
};
var mapStateToProps$1 = (state) => ({
	availableCards: state.ecard?.availableCards || [],
	cardSearchType: state.ecard?.lastQuery?.cardSearchType || ""
});
var CardPaymentWrapper_default = connect(mapStateToProps$1, null)(CardPaymentWrapper);
//#endregion
//#region source-snapshot/src/component/GiftCardPayment/index.js
var GiftCardPayment = (props) => {
	const { visible, onClose, handleSelectGiftCard, giftCardPaymentInfo, showGiftCardPartialPayInfo, giftCardFlowMode, giftCardQueryFromPartialPay, onPayByCard, onPayByCash, onPayByOtherGiftCard, onContinuePayByGiftCard, onBackToPartialPay, loading, errorApiShow, errorApiMsg } = props;
	useCloseModalOnHomePage(onClose);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			visible,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardPaymentWrapper_default, {
				handleSelectGiftCard,
				onClose,
				giftCardPaymentInfo,
				showGiftCardPartialPayInfo,
				giftCardFlowMode,
				onPayByCard,
				onPayByCash,
				onPayByOtherGiftCard,
				onContinuePayByGiftCard,
				giftCardQueryFromPartialPay,
				onBackToPartialPay
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: loading }),
		errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
			variant: "filled",
			severity: "error",
			children: errorApiMsg
		}) : null
	] });
};
//#endregion
//#region source-snapshot/src/assets/images/gift_Card_payment.png
var gift_Card_payment_default = "data:image/png;base64,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";
//#endregion
//#region source-snapshot/src/assets/images/counter-zh.png
var counter_zh_default = "" + new URL("counter-zh-bGwJ0El_.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/assets/images/counter-en.png
var counter_en_default = "" + new URL("counter-en-DsAj8GAA.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/utils/giftCardMode.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var getGiftCardPaymentCardType = (card) => card?.local === true ? "GIFT_CARD" : "CLOUD_GIFT_CARD";
//#endregion
//#region source-snapshot/src/container/paymentType/index.js
var PaymentType = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			loading: false,
			pageLoading: true,
			canPayByCard: null,
			canPayByCash: null,
			onlyHaveFreeItem: false,
			needPayForCharge: false,
			isHasSoldoutDish: false,
			dishMap: {},
			errorApiMsg: "",
			errorApiShow: false,
			giftCardErrorApiMsg: "",
			giftCardErrorApiShow: false,
			isHasOrderCharge: false,
			callLoading: false,
			callLoadObj: {},
			saveOrderId: "",
			isShowCardMinModal: false,
			currentAmount: 0,
			totalAmount: 0,
			cardSubtotal: 0,
			cashSubtotal: 0,
			cashSave: 0,
			giftCardLoading: false,
			giftCardVisible: false,
			giftCardPaymentInfo: null,
			showGiftCardPartialPayInfo: false,
			giftCardFlowMode: "initial",
			giftCardPaidTotal: 0,
			giftCardPaymentHistory: [],
			giftCardQueryFromPartialPay: false,
			showCashPayConfirmModal: false
		};
		this.timer = null;
		this.giftCardTimer = null;
		this.soldoutErrorRedirectTimer = null;
	}
	resetGiftCardFlowState = () => {
		const { clearECardState } = this.props;
		clearTimeout(this.giftCardTimer);
		clearECardState();
		this.setState({
			giftCardLoading: false,
			giftCardVisible: false,
			giftCardPaymentInfo: null,
			showGiftCardPartialPayInfo: false,
			giftCardFlowMode: "initial",
			giftCardPaidTotal: 0,
			giftCardPaymentHistory: [],
			giftCardQueryFromPartialPay: false,
			giftCardErrorApiMsg: "",
			giftCardErrorApiShow: false
		});
	};
	backBtnHandler = () => {
		this.props.history.goBack();
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
	handlePrint = () => {
		this.setState({
			callLoading: true,
			callLoadObj: { msgDone: "ing" }
		});
		judgeSskeyIsActiveTime().then(() => this.handlePrintCall());
	};
	handleSkip = () => {
		const shouldShowGiftCardTip = this.props.currentOrder?.paymentType === "GIFT_CARD" && shouldCollectTipAfterPayment(this.props.selfConfig, "GIFT_CARD");
		this.setState({
			callLoading: false,
			callLoadObj: {}
		}, () => {
			this.props.history.push(shouldShowGiftCardTip ? "/afterCreditCardPay" : "/orderFinish");
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
	savePosStatus = async (orderId, userId, checksum) => {
		await savePosStatus(orderId, userId, checksum);
	};
	calculateTotalAmount = () => {
		return calculateTotalAmount(this.props.store);
	};
	processZeroAmountOrder = async () => {
		const { store, payByCash, saveOrderResult, currentOrder: { saveOrderResult: { userId, checksum }, orderType, tabelServiceType }, selfConfig, userId: kioskConfigUserId } = this.props;
		if (await processZeroAmountOrder({
			store,
			payByCash,
			saveOrderResult,
			userId,
			checksum,
			kioskConfigUserId,
			onError: (errMsg) => {
				this.setState({ loading: false });
				this.showApiModalTip(errMsg);
				this.jumpRrrorPage(errMsg);
			},
			onPrintCall: (orderId) => {
				this.setState({ saveOrderId: orderId }, () => {
					this.handlePrint();
				});
			}
		})) {
			const locatorType = selfConfig?.configList?.find((config) => config.id === 28)?.value;
			if (!(orderType == "DINE_IN" && tabelServiceType == "DINE_IN" && locatorType === 0)) this.handleSkip();
		}
		this.setState({ loading: false });
	};
	/** Dual price：与 countCardCharge 共用 countAmount，保证展示与提单金额一致 */
	fetchDualPricePaymentTotals = () => {
		const { store, payByCash, payByCard } = this.props;
		return countAmount(store, payByCash, payByCard);
	};
	attachDualPriceToSubmitOrder = async (orderData) => {
		const { allSysConfig } = this.props;
		if (allSysConfig?.CREDIT_CHARGE_ENABLE !== "true") return orderData;
		const { cashPaymentTotal, creditPaymentTotal } = await this.fetchDualPricePaymentTotals();
		return copyMemberActivityOrderContext(orderData, {
			...orderData,
			order: {
				...orderData.order,
				cashPaymentTotal,
				creditPaymentTotal
			}
		});
	};
	/**
	* 提交订单（现金支付流程）
	* 包含：saveOrder -> 锁单 -> savePosStatus（如需要）-> send2Kitchen -> 打印叫号单
	*/
	submitOrder = async () => {
		const { store, saveOrderResult } = this.props;
		let orderData = generateSubmitOrderObj(store);
		orderData = await this.attachDualPriceToSubmitOrder(orderData);
		try {
			const res = await saveOrder(orderData);
			if (res.data.result.successful) {
				const orderId = res.data.order.id;
				const orderNumber = res.data.order.orderNumber;
				const phoneNumber = res.data.order.customer?.phone?.[0]?.number;
				saveOrderResult(res.data.order);
				const { currentOrder: { orderType, tabelServiceType, tableId, saveOrderResult: { userId, checksum } }, selfConfig, userId: kioskConfigUserId } = this.props;
				const lockParm = {
					targetId: res.data.order?.id,
					kioskConfigUserId
				};
				const onErrCb = (apiRes) => {
					const failureReason = apiRes?.data?.msg || "Lock Error";
					this.setState({ loading: false });
					this.showApiModalTip(failureReason);
					this.jumpRrrorPage(failureReason);
				};
				if (!await orderLockProcedure(lockParm, onErrCb)) return;
				if (this.state.onlyHaveFreeItem && !this.state.needPayForCharge) await this.savePosStatus(orderId, userId, checksum);
				if (tableId) getChooseTableStatus(true);
				let arr = selfConfig?.configMap?.id_20 || [];
				if (arr.includes(2) || this.state.onlyHaveFreeItem && arr.includes(0)) await this.handleSendKitchen(orderId);
				this.setState({ loading: false });
				const locatorType = selfConfig?.configMap?.id_28;
				if (orderType == "DINE_IN" && tabelServiceType == "DINE_IN" && locatorType === 0) this.setState({ saveOrderId: orderId }, () => {
					this.handlePrint();
				});
				else this.handleSkip();
				this.sendNewOrderMessageOnce(orderId, orderNumber, phoneNumber);
			} else {
				const failureReason = res.data?.result?.failureReason;
				this.setState({ loading: false });
				this.showApiModalTip(failureReason);
				this.jumpRrrorPage(failureReason);
			}
		} catch (err) {
			const failureReason = err?.message || String(err);
			this.setState({ loading: false });
			this.showApiModalTip(failureReason);
			this.jumpRrrorPage(failureReason);
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
			if ((await sendNewOrderMessage(orderId, orderNumber, phoneNumber))?.data?.result?.successful) markPostPaymentAction("newOrderMessageSent");
		} finally {
			this.isSendingNewOrderMessage = false;
		}
	};
	handlePayByGiftCard = async (card) => {
		this.setState({ giftCardLoading: true });
		const { setNeedCommit, currentOrder, userId, setOrderStatus, payByGiftCard } = this.props;
		setNeedCommit(true);
		setOrderStatus("in saving order");
		payByGiftCard();
		let orderData = generateSubmitOrderObj(native_store_default.getState());
		try {
			const res = await saveOrder(orderData);
			if (res.data.result.successful) {
				if (currentOrder.tableId) getChooseTableStatus(true);
				let orderId = null;
				let checksum = null;
				let orderNumber = null;
				let phoneNumber = null;
				let tipAmount = parseFloat(currentOrder.tipAmount) || 0;
				let crmIntegrationDiscount = 0;
				if (orderData?.order?.discountList) {
					const crmIntegrationDiscountList = JSON.parse(orderData.order.discountList);
					if (crmIntegrationDiscountList?.length > 0) {
						const discountInfo = crmIntegrationDiscountList[0];
						if (discountInfo.type === "promotion" && !discountInfo?.extraInfo?.isItemDetailDiscount) crmIntegrationDiscount = discountInfo.amount;
						else if (!discountInfo.isReward && !discountInfo?.extraInfo?.isItemDetailDiscount) crmIntegrationDiscount = discountInfo.amount;
					}
				}
				const totalAmount = Big(orderData?.order?.totalPrice).plus(orderData?.order?.totalTax).plus(tipAmount).plus(orderData?.order?.togoTotal).minus(orderData?.order?.rewardDiscount ?? 0).minus(orderData?.order?.discount ?? 0).minus(crmIntegrationDiscount).toNumber();
				orderId = res.data.order.id;
				checksum = res.data.order.checksum;
				orderNumber = res.data.order.orderNumber;
				phoneNumber = res.data.order.customer?.phone?.[0]?.number;
				this.props.saveOrderResult(res.data.order);
				const { balance } = card;
				let paymentObj = {
					fromProduct: "KIOSK",
					paymentRecord: buildGiftCardPaymentRecord({
						orderId,
						checksum,
						amount: balance >= totalAmount ? totalAmount : balance,
						cardType: getGiftCardPaymentCardType(card),
						cardNumber: card.cardNumber,
						tipAmount
					}),
					printPaymentReceipt: false,
					merchantCopyOnly: false,
					userAuth: { sessionKey: getCookie("sessionKey") }
				};
				const lockParm = {
					targetId: res?.data?.order?.id || currentOrder?.saveOrderResult?.id,
					userId
				};
				const onErrCb = (apiRes) => {
					this.showGiftCardApiModalTip(apiRes?.data?.msg || "Lock Error");
				};
				if (!await orderLock(lockParm, onErrCb)) return;
				setOrderStatus("in payment");
				await this.giftCardPayment({
					paymentObj,
					orderId,
					orderNumber,
					phoneNumber,
					totalAmount,
					giftCardBalance: balance
				});
			} else {
				const failureReason = res.data?.result?.failureReason;
				this.setState({ giftCardLoading: false });
				this.showApiModalTip(failureReason);
				this.jumpRrrorPage(failureReason);
			}
		} catch (e) {
			console.error("礼品卡支付失败:", e);
			const failureReason = e?.message || String(e);
			this.setState({ giftCardLoading: false });
			this.showApiModalTip(failureReason);
			this.jumpRrrorPage(failureReason);
		}
	};
	giftCardPayment = async ({ paymentObj, orderId, orderNumber, phoneNumber, totalAmount, giftCardBalance }) => {
		const { t, selfConfig, currentOrder, userId, savePaymentId, setCardPaidResult, setGiftCardPaymentInfo } = this.props;
		posFrontLog(`Kiosk Start SendPayment[PaymentType]
      cardNumber: ${paymentObj?.paymentRecord?.cardNumber}; 
      OrderId: ${orderId}; 
      orderNumber: ${orderNumber ?? ""}; 
      TotalAmount: ${paymentObj?.paymentRecord?.amount}`);
		promiseFinally(sendPayment(paymentObj).then(async (resp) => {
			if (resp.data.result.successful) {
				posFrontLog(`Kiosk SendPayment Success[PaymentType]
            orderStatus: ${resp?.data?.orderStatus} ;
            PaymentId: ${resp.data.id} ;
            sendPayment: ${selfConfig?.configMap?.id_20} ;
            insufficientBalanceResponse-Balance: ${resp?.data?.insufficientBalanceResponse?.balance} ;`);
				savePaymentId(resp.data.id);
				this.sendNewOrderMessageOnce(orderId, orderNumber, phoneNumber);
				const currentPaidAmount = paymentObj?.paymentRecord?.amount || 0;
				let arr = selfConfig?.configMap?.id_20 || [];
				if (resp.data.orderStatus === "PAID") {
					const availableTipBalance = Math.max(Big(Number(giftCardBalance) || 0).minus(currentPaidAmount).toNumber(), 0);
					setGiftCardPaymentInfo({ availableTipBalance });
					if (arr.includes(0)) await this.handleSendKitchen(orderId);
					setCardPaidResult({});
					this.resetGiftCardFlowState();
				} else if (resp.data.orderStatus === "PARTIALLY_PAID") {
					const { giftCardPaidTotal, giftCardPaymentHistory } = this.state;
					const newPaidTotal = Big(giftCardPaidTotal).plus(currentPaidAmount).toNumber();
					const remainingAmount = Math.max(Big(totalAmount).minus(newPaidTotal).toNumber(), 0);
					const newPaymentRecord = {
						cardNumber: paymentObj?.paymentRecord?.cardNumber,
						amount: currentPaidAmount,
						orderStatus: resp.data.orderStatus,
						paymentId: resp.data.id,
						paidAt: (/* @__PURE__ */ new Date()).toISOString()
					};
					judgeSskeyIsActiveTime().then(() => getOrderDetail({
						orderId,
						setCardPaidResult: this.props.setCardPaidResult
					}));
					if (arr.includes(1)) await this.handleSendKitchen(orderId);
					const giftCardPaymentInfo = {
						paymentObj,
						paymentResultInfo: resp.data,
						totalAmount,
						paidTotal: newPaidTotal,
						remainingAmount
					};
					setGiftCardPaymentInfo(giftCardPaymentInfo);
					this.setState({
						showGiftCardPartialPayInfo: true,
						giftCardPaidTotal: newPaidTotal,
						giftCardPaymentHistory: [...giftCardPaymentHistory, newPaymentRecord],
						giftCardPaymentInfo
					});
					return;
				}
				const { orderType, tabelServiceType } = currentOrder;
				const locatorType = selfConfig?.configMap?.id_28;
				if (orderType === "DINE_IN" && tabelServiceType === "DINE_IN" && locatorType === 0) {
					this.setState({ saveOrderId: orderId }, async () => {
						await this.handlePrint();
					});
					return;
				}
				this.handleSkip();
			} else {
				const { giftCardPaidTotal } = this.state;
				const remainingAmount = Math.max(Big(totalAmount).minus(giftCardPaidTotal).toNumber(), 0);
				const giftCardPaymentInfo = {
					paymentObj,
					paymentResultInfo: resp.data,
					totalAmount,
					paidTotal: giftCardPaidTotal,
					remainingAmount,
					isGiftCardError: true
				};
				setGiftCardPaymentInfo(giftCardPaymentInfo);
				this.setState({
					giftCardPaymentInfo,
					showGiftCardPartialPayInfo: true
				});
			}
		}).catch((err) => {
			this.showGiftCardApiModalTip(t("gift-card-unusable"));
		}), async () => {
			const lockParam = {
				targetId: orderId,
				userId
			};
			const onErrCb = (apiRes) => {
				this.showGiftCardApiModalTip(apiRes?.data?.msg || "Lock Error");
			};
			if (!await orderUnlock(lockParam, onErrCb)) return;
			this.setState({ giftCardLoading: false });
		});
	};
	judgeConfigToSoldout = (fn) => {
		judgeConfigToSoldout(fn, {
			setSelfConfig: this.props.setSelfConfig,
			setState: this.setState.bind(this),
			showApiModalTip: this.showApiModalTip,
			reorder: this.reorder,
			onError: (failureReason) => {
				this.setState({ loading: false }, () => {
					this.showApiModalTip(failureReason);
					clearTimeout(this.soldoutErrorRedirectTimer);
					this.soldoutErrorRedirectTimer = setTimeout(() => {
						this.props.history.push("/");
						clearTimeout(this.soldoutErrorRedirectTimer);
						this.soldoutErrorRedirectTimer = null;
					}, 3e3);
				});
			}
		});
	};
	/**
	* 跳转到错误页面
	*/
	jumpRrrorPage = (failureReason = "") => {
		setTimeout(() => {
			posFrontLog(`Kiosk Payment Error: 【004】${failureReason}`);
			this.props.history.push({
				pathname: "/connectionError",
				search: import_lib.default.stringify({
					pay: 1,
					code: "004"
				}),
				state: { failureReason }
			});
		}, 2e3);
	};
	/**
	* 接口报错提示
	*/
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
	showGiftCardApiModalTip = (errMsg) => {
		this.setState({
			giftCardErrorApiMsg: errMsg,
			giftCardErrorApiShow: true
		});
		clearTimeout(this.giftCardTimer);
		this.giftCardTimer = setTimeout(() => {
			this.setState({
				giftCardErrorApiMsg: "",
				giftCardErrorApiShow: false
			});
		}, 2e3);
	};
	/**
	* 取消订单加收弹框
	*/
	handleCancel = () => {
		this.setState({ isHasOrderCharge: false });
	};
	handleOpenGiftCard = () => {
		this.judgeConfigToSoldout(() => {
			if (shouldCollectTipBeforePayment(this.props.selfConfig, "GIFT_CARD")) {
				this.props.payByGiftCard();
				this.props.history.push("/tippingPanel");
				return;
			}
			this.setState({ giftCardVisible: true });
		});
	};
	handlePayByOtherGiftCard = async () => {
		const { giftCardPaymentInfo } = this.state;
		const { fetchAvailableECards, ecardLastQuery } = this.props;
		this.setState({ giftCardLoading: true });
		const usedCardNumber = giftCardPaymentInfo?.paymentObj?.paymentRecord?.cardNumber;
		if (ecardLastQuery) {
			const result = await fetchAvailableECards(ecardLastQuery, {
				excludeCardNumber: usedCardNumber,
				preserveLastQuery: true
			});
			this.setState({ giftCardLoading: false });
			if (result.success) {
				const hasCards = result.cards && result.cards.length > 0;
				this.setState({
					showGiftCardPartialPayInfo: false,
					giftCardFlowMode: "partial_continue",
					giftCardQueryFromPartialPay: !hasCards
				});
				if (!hasCards) this.showGiftCardApiModalTip(this.props.t("no_available_gift_cards"));
			} else this.showGiftCardApiModalTip(result.errorMsg || this.props.t("query_failed") || "Query failed");
		} else {
			this.setState({ giftCardLoading: false });
			this.showGiftCardApiModalTip(this.props.t("query_failed") || "Query failed");
		}
	};
	handleBackToCardPartPayInfo = () => {
		this.setState({
			showGiftCardPartialPayInfo: true,
			giftCardQueryFromPartialPay: false
		});
	};
	handleContinuePayByCard = async () => {
		const { giftCardPaymentInfo } = this.state;
		const { appendPaymentTypeTrail, clearECardState, payByCard, store, currentOrder, allSysConfig, saveOrderResult } = this.props;
		appendPaymentTypeTrail("CREDIT_CARD");
		payByCard();
		if (!giftCardPaymentInfo) {
			toast_default.info("Payment context not found");
			return;
		}
		this.setState({ giftCardLoading: true });
		const orderId = giftCardPaymentInfo.paymentObj?.paymentRecord?.orderId;
		try {
			await judgeSskeyIsActiveTime();
			const orderInfo = await getOrderDetail({
				orderId,
				setCardPaidResult: this.props.setCardPaidResult
			});
			let orderData = generateSubmitOrderObj(this.props.store);
			let cloneOrderData = copyMemberActivityOrderContext(orderData, (0, import_cloneDeep.default)(orderData));
			if (orderInfo.checksum && currentOrder.saveOrderResult.id) {
				const order = cloneOrderData.order;
				order.id = currentOrder.saveOrderResult.id;
				order.checksum = orderInfo.checksum;
				preserveOrderItemIds(order.orderItems, currentOrder.saveOrderResult.orderItems);
			}
			if (allSysConfig?.CREDIT_CHARGE_ENABLE === "true") {
				const { cashPaymentTotal, creditPaymentTotal } = await countAmount(store, payByCash, payByCard);
				cloneOrderData = copyMemberActivityOrderContext(cloneOrderData, {
					...cloneOrderData,
					order: {
						...cloneOrderData.order,
						cashPaymentTotal,
						creditPaymentTotal
					}
				});
			}
			saveOrderResult((await saveOrder(cloneOrderData)).data.order);
			clearECardState();
			this.setState({
				giftCardVisible: false,
				showGiftCardPartialPayInfo: false,
				giftCardQueryFromPartialPay: false,
				giftCardLoading: false
			});
			this.props.history.push("/cardPayment");
		} catch (e) {
			console.error("信用卡补款跳转异常:", e);
			this.setState({ giftCardLoading: false });
			this.showGiftCardApiModalTip(e?.message || "Error");
		}
	};
	handleContinuePayByCash = async () => {
		const { giftCardPaymentInfo } = this.state;
		const { currentOrder, selfConfig, appendPaymentTypeTrail, payByCash } = this.props;
		payByCash();
		appendPaymentTypeTrail("CASH");
		if (!giftCardPaymentInfo) {
			toast_default.info("Payment context not found");
			return;
		}
		this.setState({ giftCardLoading: true });
		const orderId = giftCardPaymentInfo.paymentObj?.paymentRecord?.orderId;
		const orderNumber = currentOrder?.saveOrderResult?.orderNumber;
		const phoneNumber = currentOrder?.saveOrderResult?.customer?.phone?.[0]?.number;
		try {
			await judgeSskeyIsActiveTime();
			await getOrderDetail({
				orderId,
				setCardPaidResult: this.props.setCardPaidResult
			});
			if (currentOrder?.tableId) getChooseTableStatus(true);
			if ((selfConfig?.configMap?.id_20 || []).includes(2)) await this.handleSendKitchen(orderId);
			this.setState({ giftCardLoading: false });
			const { orderType, tabelServiceType } = currentOrder;
			const locatorType = selfConfig?.configMap?.id_28;
			if (orderType === "DINE_IN" && tabelServiceType === "DINE_IN" && locatorType === 0) this.setState({ saveOrderId: orderId }, () => {
				this.handlePrint();
			});
			else this.handleSkip();
			this.sendNewOrderMessageOnce(orderId, orderNumber, phoneNumber);
		} catch (e) {
			console.error("现金补款流程异常:", e);
			this.setState({ giftCardLoading: false });
			this.showGiftCardApiModalTip(e?.message || "Error");
		}
	};
	handleContinuePayByGiftCard = async (card) => {
		this.setState({ giftCardLoading: true });
		const { giftCardPaymentInfo, giftCardPaidTotal } = this.state;
		const { userId, setOrderStatus, currentOrder, payByGiftCard } = this.props;
		if (!giftCardPaymentInfo) {
			toast_default.info("Payment context not found");
			return;
		}
		const { paymentObj, totalAmount } = giftCardPaymentInfo;
		const remainingAmount = Math.max(Big(totalAmount).minus(giftCardPaidTotal).toNumber(), 0);
		if (remainingAmount <= 0) {
			this.showGiftCardApiModalTip("No remaining amount to pay");
			return;
		}
		payByGiftCard();
		const orderId = paymentObj?.paymentRecord?.orderId;
		const orderNumber = currentOrder?.saveOrderResult?.orderNumber;
		const phoneNumber = currentOrder?.saveOrderResult?.customer?.phone?.[0]?.number;
		const { balance } = card;
		const paymentAmount = Math.min(remainingAmount, balance);
		await judgeSskeyIsActiveTime();
		const checksum = (await getOrderDetail({
			orderId,
			setCardPaidResult: this.props.setCardPaidResult
		}))?.checksum || currentOrder?.saveOrderResult?.checksum || paymentObj?.paymentRecord?.checksum;
		const newPaymentObj = {
			fromProduct: "KIOSK",
			paymentRecord: {
				orderId,
				type: "GIFT_CARD",
				amount: paymentAmount,
				paidAmount: paymentAmount,
				cardType: getGiftCardPaymentCardType(card),
				cardNumber: card.cardNumber,
				checksum,
				multiplePayments: false
			},
			printPaymentReceipt: false,
			merchantCopyOnly: false,
			userAuth: { sessionKey: getCookie("sessionKey") }
		};
		try {
			const lockParam = {
				targetId: orderId,
				userId
			};
			const onErrCb = (apiRes) => {
				this.showGiftCardApiModalTip(apiRes?.data?.msg || "Lock Error");
			};
			if (!await orderLock(lockParam, onErrCb)) return;
			setOrderStatus("in payment");
			await this.giftCardPayment({
				paymentObj: newPaymentObj,
				orderId,
				orderNumber,
				phoneNumber,
				totalAmount,
				giftCardBalance: balance
			});
		} catch (e) {
			console.error("继续礼品卡支付失败:", e);
			this.setState({ giftCardLoading: false });
		}
	};
	/**
	* 获取支付方式显示配置
	*/
	getPaymentDisplayConfig = () => {
		const { t, allSysConfig, i18n } = this.props;
		const { canPayByCash, canPayByCard } = this.state;
		let cardText = t("credit_debit_card");
		let cashText = t("cash");
		const isOpenDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === "true";
		if (isOpenDualPrice) {
			cardText = t("only_credit_debit_card");
			cashText = t("cash_payment");
		}
		const isChinese = i18n?.language?.includes("zh");
		return {
			cardText,
			cashText,
			cashIconSrc: isOpenDualPrice ? icon_cash_default : isChinese ? counter_zh_default : counter_en_default,
			showNoPaymentMessage: !canPayByCash && !canPayByCard
		};
	};
	/**
	* 处理整单加收（信用卡支付）
	*/
	handleWholeCharge = () => {
		this.handleChoosePayByCard();
	};
	/**
	* 选择信用卡支付
	* 流程：判断小费配置 -> 判断售罄 -> 判断最低消费 -> 跳转支付页面
	*/
	handleChoosePayByCard = async () => {
		this.setState({ isHasOrderCharge: false });
		this.props.payByCard();
		const { selfConfig } = this.props;
		if (shouldCollectTipBeforePayment(selfConfig, "CREDIT_CARD")) {
			this.props.history.push("/tippingPanel");
			return;
		}
		this.judgeConfigToSoldout(this.judgeFillCardMinAmout);
	};
	/**
	* 判断是否满足刷卡最低消费金额
	*/
	judgeFillCardMinAmout = () => {
		if (calcCardMinAmout()) this.setState({
			isShowCardMinModal: true,
			currentAmount: calcCardMinAmout()
		});
		else this.props.history.push("/cardPayment");
	};
	/**
	* 刷卡不足最小金额后，返回并继续点单
	*/
	handleContinueOrder = () => {
		this.setState({ isShowCardMinModal: false });
		this.reorder(true);
	};
	/**
	* 刷卡不足最小金额后，关闭弹框
	*/
	handleCloseMin = () => {
		this.setState({ isShowCardMinModal: false });
	};
	/**
	* 是否展示柜台支付确认对话框（开通 DP 且配置开启）
	*/
	shouldShowCashPayConfirmDialog = () => {
		const { allSysConfig, selfConfig } = this.props;
		return allSysConfig?.CREDIT_CHARGE_ENABLE === "true" && selfConfig?.configMap?.id_68 === true;
	};
	handleCloseCashPayConfirmModal = () => {
		this.setState({ showCashPayConfirmModal: false });
	};
	/**
	* 点击现金支付方式（可能先弹出确认对话框）
	*/
	handleCashPaymentClick = () => {
		if (this.shouldShowCashPayConfirmDialog()) {
			this.setState({ showCashPayConfirmModal: true });
			return;
		}
		this.handleChoosePayByCash();
	};
	handleConfirmCashPayFromModal = () => {
		this.setState({ showCashPayConfirmModal: false }, () => {
			this.handleChoosePayByCash();
		});
	};
	handleConfirmCardPayFromModal = () => {
		this.setState({ showCashPayConfirmModal: false }, () => {
			this.handleWholeCharge();
		});
	};
	/**
	* 选择现金支付
	* 流程：判断售罄 -> judgeSskeyIsActiveTime -> submitOrder
	*/
	handleChoosePayByCash = () => {
		this.props.payByCash();
		if (isTipEnabledForPayment(this.props.selfConfig, "CASH") && (hasOnlyCashTipPaymentMethod(this.props.selfConfig?.configList) || getTipProcedureValue(this.props.selfConfig) !== 2)) {
			this.props.history.push("/tippingPanel");
			return;
		}
		this.setState({ loading: true });
		this.judgeConfigToSoldout(() => {
			judgeSskeyIsActiveTime().then(() => this.submitOrder());
		});
	};
	/**
	* 返回orderPage，重新点单
	*/
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
	/**
	* 仍然下单（售罄菜品处理后的继续下单）
	*/
	continueReorder = () => {
		if (this?.state?.dishMap?.allSoldIds?.length) this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
		this.setState({ isHasSoldoutDish: false });
		setTimeout(() => {
			const { paymentType } = this.props.currentOrder;
			if (paymentType == "CASH") this.handleCashPaymentClick();
			else if (paymentType == "CREDIT_CARD") this.handleChoosePayByCard();
			else if (paymentType == "GIFT_CARD") this.handleOpenGiftCard();
		}, 0);
	};
	async componentDidMount() {
		const { systemConfig, isReorderFlag, selfConfig } = this.props;
		const tipRouteQuery = import_lib.default.parse(this.props.location?.search, { ignoreQueryPrefix: true });
		const tipCompleted = tipRouteQuery.tipCompleted === "true";
		const tipBeforePaymentMethodCompleted = tipRouteQuery.tipBeforePaymentMethodCompleted === "true";
		const cashTipCompleted = tipCompleted && !tipBeforePaymentMethodCompleted && this.props.currentOrder?.paymentType === "CASH";
		const giftCardTipCompleted = tipCompleted && !tipBeforePaymentMethodCompleted && this.props.currentOrder?.paymentType === "GIFT_CARD";
		if (isReorderFlag) {
			this.backBtnHandler();
			this.setState({ pageLoading: false });
			return;
		}
		if (systemConfig?.KIOSK_PAYMENT_TYPE?.value) {
			const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
			const onlyHaveFreeItem = judgeOnlyHaveFreeItem();
			const needPayForCharge = judgeNeedPayOtherCharge();
			const totalAmount = calculateTotalAmount(this.props.store);
			this.setState({
				canPayByCard: paymentRouteResult.canPayByCard,
				canPayByCash: paymentRouteResult.canPayByCash,
				canPayByEcard: paymentRouteResult.canPayByEcard,
				onlyHaveFreeItem,
				needPayForCharge,
				totalAmount
			});
			if (!tipCompleted && totalAmount > 0 && !(onlyHaveFreeItem && !needPayForCharge) && shouldCollectTipBeforePaymentMethod(selfConfig, systemConfig.KIOSK_PAYMENT_TYPE.value)) {
				if (paymentRouteResult.onlyCash) this.props.payByCash();
				this.props.history.replace("/tippingPanel?tipReturnTo=paymentType");
				return;
			}
			if (cashTipCompleted || paymentRouteResult.onlyCash || onlyHaveFreeItem && !needPayForCharge || totalAmount === 0) {
				this.setState({ loading: true });
				if (totalAmount === 0) await this.processZeroAmountOrder();
				else {
					this.props.payByCash();
					if (paymentRouteResult.onlyCash && isTipEnabledForPayment(selfConfig, "CASH") && !tipCompleted) this.props.history.replace("/tippingPanel");
					else judgeSskeyIsActiveTime().then(() => this.submitOrder());
				}
				return;
			}
		}
		await this.countCardCharge();
		this.setState({
			pageLoading: false,
			giftCardVisible: giftCardTipCompleted
		});
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
		clearTimeout(this.giftCardTimer);
		clearTimeout(this.soldoutErrorRedirectTimer);
	}
	/**
	* 计算信用卡和现金支付的金额差异（用于dual price）
	*/
	countCardCharge = async () => {
		const { allSysConfig, clearPayType } = this.props;
		if (allSysConfig?.CREDIT_CHARGE_ENABLE === "true") {
			const { cashPaymentTotal, creditPaymentTotal } = await this.fetchDualPricePaymentTotals();
			const cashSave = Big(creditPaymentTotal).minus(cashPaymentTotal).toFixed(2);
			await this.setState({
				cashSave,
				cardSubtotal: creditPaymentTotal,
				cashSubtotal: cashPaymentTotal
			});
		} else await this.setState({
			cashSave: 0,
			cardSubtotal: 0,
			cashSubtotal: 0
		});
		await clearPayType();
	};
	render() {
		const { t, systemConfig, selfConfig } = this.props;
		const { isHasOrderCharge, loading, pageLoading, dishMap, isHasSoldoutDish, errorApiShow, errorApiMsg, giftCardLoading, giftCardErrorApiShow, giftCardErrorApiMsg, callLoading, callLoadObj, isShowCardMinModal, currentAmount, onlyHaveFreeItem, needPayForCharge, canPayByCash, canPayByCard, cashSave, cardSubtotal, cashSubtotal, giftCardVisible, canPayByEcard, giftCardPaymentInfo, showGiftCardPartialPayInfo, giftCardFlowMode, giftCardQueryFromPartialPay, showCashPayConfirmModal } = this.state;
		const { cardText, cashText, cashIconSrc, showNoPaymentMessage } = this.getPaymentDisplayConfig();
		const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: paymentType_module_default.paymentTypePanelOuter,
			style: { visibility: this.props.isReorderFlag || paymentRouteResult.shouldSkipPaymentType ? "hidden" : "visible" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: paymentType_module_default.paymentTypePanelInner,
					style: { visibility: onlyHaveFreeItem && !needPayForCharge || paymentRouteResult.shouldSkipPaymentType ? "hidden" : "visible" },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: paymentType_module_default.paymentMethod,
							children: t("payment_type")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: paymentType_module_default.payTwoBox,
							children: [
								canPayByCard ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `${paymentType_module_default.paymentType} ${paymentType_module_default.creditPayment}`,
									onClick: this.handleWholeCharge,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: icon_credit_default,
										className: `${paymentType_module_default.payImg} ${cashSave > 0 && paymentType_module_default.hasCharge}`
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: paymentType_module_default.payInfo,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `${paymentType_module_default.payText}`,
											children: cardText
										}), cashSave > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: paymentType_module_default.subtotal,
											children: [
												t("subtotal"),
												": $",
												Big(cardSubtotal).toFixed(2)
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: paymentType_module_default.saveAmount,
											children: [
												t("save_amount"),
												": $",
												Big(cashSave).toFixed(2)
											]
										})] })]
									})]
								}) : null,
								canPayByCash ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `${paymentType_module_default.paymentType} ${paymentType_module_default.cashPayment}`,
									onClick: this.handleCashPaymentClick,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: cashIconSrc,
										className: `${paymentType_module_default.payImg} ${cashSave > 0 && paymentType_module_default.hasCharge}`
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: paymentType_module_default.payInfo,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `${paymentType_module_default.payText}`,
											children: cashText
										}), cashSave > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: paymentType_module_default.subtotal,
											children: [
												t("subtotal"),
												": $",
												Big(cashSubtotal).toFixed(2)
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: paymentType_module_default.saveAmount,
											children: [
												t("save_amount"),
												": $",
												Big(cashSave).toFixed(2)
											]
										})] })]
									})]
								}) : null,
								canPayByEcard ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `${paymentType_module_default.paymentType} ${paymentType_module_default.cashPayment}`,
									onClick: this.handleOpenGiftCard,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: gift_Card_payment_default,
										className: `${paymentType_module_default.payImg} ${cashSave > 0 && paymentType_module_default.hasCharge}`
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: paymentType_module_default.payInfo,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `${paymentType_module_default.payText}`,
											children: t("ecard")
										}), cashSave > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: paymentType_module_default.subtotal,
											children: [
												t("subtotal"),
												": $",
												Big(cashSubtotal).toFixed(2)
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: paymentType_module_default.saveAmount,
											children: [
												t("save_amount"),
												": $",
												Big(cashSave).toFixed(2)
											]
										})] })]
									})]
								}) : null
							]
						}),
						showNoPaymentMessage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: paymentType_module_default.noPaymentType,
							children: t("no_payment_method")
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GiftCardPayment, {
					giftCardPaymentInfo,
					visible: giftCardVisible,
					showGiftCardPartialPayInfo,
					giftCardFlowMode,
					giftCardQueryFromPartialPay,
					onPayByCard: this.handleContinuePayByCard,
					onPayByCash: this.handleContinuePayByCash,
					onPayByOtherGiftCard: this.handlePayByOtherGiftCard,
					onContinuePayByGiftCard: this.handleContinuePayByGiftCard,
					onBackToPartialPay: this.handleBackToCardPartPayInfo,
					onClose: this.resetGiftCardFlowState,
					handleSelectGiftCard: this.handlePayByGiftCard,
					loading: giftCardLoading,
					errorApiShow: giftCardErrorApiShow,
					errorApiMsg: giftCardErrorApiMsg
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: pageLoading }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingText, {
					visible: loading,
					textKey: 2
				}),
				callLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallModal, {
					callLoading,
					loadObj: callLoadObj
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
				isHasOrderCharge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(cardPayTipModal_default, {
					isHasOrderCharge,
					handleCancel: this.handleCancel,
					handleConfirm: this.handleChoosePayByCard
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(cashPayConfirmModal_default, {
					visible: showCashPayConfirmModal,
					onClose: this.handleCloseCashPayConfirmModal,
					onConfirmCash: this.handleConfirmCashPayFromModal,
					onConfirmCard: this.handleConfirmCardPayFromModal
				}),
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
		selfConfig: state.selfConfig,
		currentOrder: state.currentOrder,
		systemConfig: state.systemConfig,
		isReorderFlag: state.orderEdit.isReorderFlag,
		crm: state.crm,
		avocado: state.avocado,
		allSysConfig: state.allSysConfig,
		userId: state.sysCookie.kioskConfigUserId,
		ecardLastQuery: state.ecard?.lastQuery
	};
}
var paymentType_default = withRouter(connect(mapStateToProps, {
	payByCard,
	payByCash,
	payByGiftCard,
	appendPaymentTypeTrail,
	markPostPaymentAction,
	clearPayType,
	saveOrderResult,
	spliceOrderBySoldout,
	setIsReorderFlag,
	setSelfConfig,
	changeSelectedDiscount,
	changeFreeItem,
	setNeedCommit,
	setOrderStatus,
	savePaymentId,
	setCardPaidResult,
	setGiftCardPaymentInfo,
	clearECardState,
	fetchAvailableECards
})(withTranslation()(PaymentType)));
//#endregion
export { paymentType_default as default };
