import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { D as posFrontLog, a as getDeviceOrientation, m as subscribeDeviceOrientation, s as isOpenVtkeyboadrd } from "./utils-Cdx9DbDR.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { d as getCRMMemberInfo, i as createCRMMember, k as searchCRMMember, r as checkIsFirstOrder, y as getOnboardGiftRule } from "./kioskConfigApi-68IKDHob.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { n as LoginModal_module_default, t as SendAuthCode_default } from "./SendAuthCode-JDiMt820.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { n as PhoneBlacklistDialog, t as syncLandscapeKeyboardManager } from "./syncLandscapeKeyboardManager-LlkmTrOt.js";
import { t as crmIntegration } from "./crm-integration-DyFhn08j.js";
import { a as isPhoneBlacklisted, i as isCRMPhoneVerified, o as isValidUSPhone, s as normalizePhoneDigits } from "./phoneNumber-CPrZu7TP.js";
import { t as PhoneNumberEntryLayout } from "./PhoneNumberEntryLayout-DWDXd7Tb.js";
//#region source-snapshot/src/component/CRM/LoginCRM/components/LoginModal.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var import_jsx_runtime = require_jsx_runtime();
var LoginModal = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.phoneInputRef = null;
		this.keyboardManager = null;
		this.unsubscribeOrientation = null;
	}
	state = {
		phoneNum: this.props.initialPhone || "",
		isPhoneValid: isValidUSPhone(this.props.initialPhone),
		isPrivacyConfirm: false,
		step: 0,
		loading: false,
		errorApiShow: false,
		errorApiMsg: "",
		showPhoneBlacklist: false,
		tempMemberInfo: null,
		keyboardToggle: false,
		deviceOrientation: getDeviceOrientation()
	};
	handleOrientationChange = (orientation) => {
		if (orientation === this.state.deviceOrientation) return;
		this.setState({ deviceOrientation: orientation }, () => {
			syncLandscapeKeyboardManager(this, () => this.phoneInputRef);
		});
	};
	componentDidMount() {
		window.addEventListener("popstate", this.handleLocationChange);
		crmIntegration.getValidToken();
		const privacyConfirm = this.props.selfConfig?.configMap?.id_49;
		this.setState({ isPrivacyConfirm: this.props.autoSubmitPhone ? true : privacyConfirm }, () => {
			if (this.props.autoSubmitPhone) this.onConfirmPhone();
		});
		syncLandscapeKeyboardManager(this, () => this.phoneInputRef);
		this.unsubscribeOrientation = subscribeDeviceOrientation(this.handleOrientationChange);
	}
	componentWillUnmount() {
		window.removeEventListener("popstate", this.handleLocationChange);
		if (this.unsubscribeOrientation) this.unsubscribeOrientation();
		if (this.keyboardManager) this.keyboardManager.cleanup();
	}
	handleLocationChange = () => {
		if (window.location.hash === "#/") this.props.onClose();
	};
	keyboardChange = (nextFormattedValue) => {
		this.setState({
			phoneNum: nextFormattedValue,
			isPhoneValid: isValidUSPhone(nextFormattedValue)
		});
	};
	changePrivacyConfirm = (v) => {
		this.setState({ isPrivacyConfirm: v });
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
	getADMemberInfo = async () => {
		try {
			this.setState({ loading: true });
			const { setMemberStatus } = this.props;
			const { phoneNum } = this.state;
			const data = {
				areaCode: 1,
				phone: normalizePhoneDigits(phoneNum)
			};
			const res = this.props.customerId ? await crmIntegration.getCustomerInfo(this.props.customerId) : await crmIntegration.searchCustomers(data);
			if (res.data?.success) {
				const customers = this.props.customerId ? [res.data.data].filter(Boolean) : res.data.data;
				if (customers?.length > 0) {
					setMemberStatus(false);
					const customerInfo = customers[0];
					this.props.setCRMCustomerInfo(customerInfo);
					const customerId = customerInfo?.id;
					const memberInfo = {
						...customerInfo,
						userId: customerId
					};
					if (customerId) {
						const { pointBalance } = await this.getCustomerAssets(customerId);
						memberInfo.pointBalance = pointBalance;
						return memberInfo;
					}
				} else {
					setMemberStatus(true);
					return {};
				}
			}
			this.showApiModalTip(res?.data?.message || "failed to get member info");
			return false;
		} catch (e) {
			this.showApiModalTip(e.response?.data?.message || e.message || "Network Error");
			return false;
		} finally {
			this.setState({ loading: false });
		}
	};
	checkIsMemberOrderedBefore = async () => {
		const { phoneNum } = this.state;
		const noCountryCodeNumber = normalizePhoneDigits(phoneNum);
		try {
			const res = await checkIsFirstOrder(noCountryCodeNumber);
			const isMemberOrdered = res?.data?.data === null ? true : res?.data?.data;
			this.props.setIsMemberOrderedBefore(isMemberOrdered);
		} catch (e) {
			console.log("checkIsFirstOrder接口调用失败:", e);
			this.props.setIsMemberOrderedBefore(true);
		}
	};
	onConfirmPhone = async () => {
		const { isPhoneValid, isPrivacyConfirm } = this.state;
		const { isNeedAuthCode, crmType, t } = this.props;
		if (!isPhoneValid) return;
		if (!isPrivacyConfirm) return toast_default.info(t("confirm-policy"), "top");
		if (this.rejectBlacklistedPhone(this.state.phoneNum)) return;
		const res = await [this.checkIsMemberExist, this.getADMemberInfo][crmType - 1]();
		if (!res) return;
		if (Object.keys(res).length === 0 && this.props.selfConfig?.configMap?.id_71 === true) {
			this.rejectNewMember();
			return;
		}
		if (res && Object.keys(res).length > 0) this.setState({ tempMemberInfo: res });
		if (!isNeedAuthCode || isCRMPhoneVerified(this.props.crm, this.state.phoneNum)) {
			const { phoneNum } = this.state;
			await this.onVerifySuccess(normalizePhoneDigits(phoneNum), res);
			return;
		}
		this.setState({ step: 1 });
		this.hideKeyboard();
	};
	checkIsMemberExist = async () => {
		try {
			this.setState({ loading: true });
			const { setMemberStatus } = this.props;
			const { phoneNum } = this.state;
			const res = await searchCRMMember({
				pageNo: 1,
				pageSize: 15,
				searchField: "phone",
				searchKey: normalizePhoneDigits(phoneNum)
			});
			if (res.status === 200 && res.data.code === 0) {
				if (res.data.data?.total > 0) {
					setMemberStatus(false);
					return res.data.data?.data?.[0];
				}
				setMemberStatus(true);
				return {};
			}
			this.showApiModalTip(res.data?.msg);
			return false;
		} catch (e) {
			this.showApiModalTip(e.response?.data?.message || e.message || "Network Error");
			return false;
		} finally {
			this.setState({ loading: false });
		}
	};
	backToPrevStep = () => {
		if (this.state.showPhoneBlacklist) return;
		if (this.loginCompleted) return;
		if (this.props.autoSubmitPhone) {
			this.props.onClose();
			return;
		}
		this.setState({ step: 0 });
	};
	rejectNewMember = () => {
		this.setState({
			loading: false,
			step: 0,
			tempMemberInfo: null
		});
		this.props.setMemberStatus(false);
		toast_default.info(this.props.t("member-login-only-unregistered"), "top");
		if (this.props.autoSubmitPhone) this.props.onClose();
	};
	onVerifySuccess = async (phone, tempMemberInfoParam = null) => {
		if (this.rejectBlacklistedPhone(phone)) return;
		this.setState({ loading: true });
		const tempMemberInfo = tempMemberInfoParam || this.state.tempMemberInfo;
		const { setCRMMemberInfo, changeLoginType, onClose, crmType } = this.props;
		if (tempMemberInfo && Object.keys(tempMemberInfo)?.length > 0) {
			setCRMMemberInfo(tempMemberInfo);
			changeLoginType("active");
			await this.checkIsMemberOrderedBefore();
			this.setState({ loading: false });
			this.loginCompleted = true;
			onClose?.({
				memberCRMInfo: tempMemberInfo,
				isNewMember: false
			});
			posFrontLog(`login  -not NewMember-  id: ${tempMemberInfo?.id} --- userId: ${tempMemberInfo?.userId} ---  
         phone: ${tempMemberInfo?.phone} ---  pointBalance: ${tempMemberInfo?.pointBalance}`);
			return;
		}
		if (this.props.selfConfig?.configMap?.id_71 === true) {
			this.rejectNewMember();
			return;
		}
		const createRes = await [this.createCRM, this.createADMember][crmType - 1](phone);
		if (!createRes) {
			this.setState({ loading: false });
			return;
		}
		const { userId } = createRes;
		if (!await [this.fetchCRMMemberInfo, this.fetchMemberInfoViaId][crmType - 1](userId)) {
			this.setState({ loading: false });
			return;
		}
		await this.checkIsMemberOrderedBefore();
		this.setState({ loading: false });
	};
	getCustomerAssets = async (customerId) => {
		try {
			const assetsRes = await crmIntegration.getCustomerAssets(customerId);
			if (assetsRes.data?.success) {
				await this.props.setCustomerVouchers(assetsRes?.data?.data?.vouchers || []);
				return {
					pointBalance: assetsRes?.data?.data?.loyaltyAccount?.pointBalance ?? null,
					giftVoucher: assetsRes?.data?.data?.vouchers || []
				};
			}
			this.props.setCustomerVouchers(null);
			return {
				pointBalance: null,
				giftVoucher: []
			};
		} catch (e) {
			throw new Error(e);
		}
	};
	createADMember = async (phone) => {
		try {
			const data = {
				areaCode: 1,
				phone,
				channelCode: "KIOSK"
			};
			const res = await crmIntegration.createNewCustomer(data);
			if (res.data?.success) return { userId: res.data.data };
			this.showApiModalTip(res.data.errorMessage || "failed to create new member");
			return false;
		} catch (e) {
			this.showApiModalTip(e.response?.data?.errorMessage || e.message || "Network Error");
			return false;
		}
	};
	createCRM = async (phone) => {
		try {
			const res = await createCRMMember({
				firstname: "",
				lastname: "",
				phone,
				email: ""
			});
			if (res.status === 200 && res.data.code === 0) return res.data.data;
			this.showApiModalTip(res.data?.msg);
			return false;
		} catch (e) {
			this.showApiModalTip(e.response?.data?.msg || e.message || "Network Error");
			return false;
		}
	};
	fetchMemberInfoViaId = async (userId) => {
		try {
			const { setCRMMemberInfo, changeLoginType, onClose, setCRMCustomerInfo } = this.props;
			const customerRes = await crmIntegration.getCustomerInfo(userId);
			if (customerRes.data?.success) {
				const customerInfo = customerRes?.data?.data;
				setCRMCustomerInfo(customerInfo);
				const customerId = customerInfo?.id;
				const memberInfo = {
					...customerInfo,
					userId: customerId
				};
				if (customerId) {
					const { pointBalance, giftVoucher } = await this.getCustomerAssets(customerId);
					memberInfo.pointBalance = pointBalance;
					setCRMMemberInfo(memberInfo);
					changeLoginType("active");
					const onboardGiftRule = await this.fetchOnboardGiftRule(memberInfo);
					this.props.setOnboardGiftRule(onboardGiftRule);
					this.loginCompleted = true;
					onClose?.({
						memberCRMInfo: memberInfo,
						isNewMember: true,
						onboardGiftRule,
						giftVoucher
					});
					posFrontLog(`login  -AD -  id: ${memberInfo?.id} --- userId: ${memberInfo?.userId} ---  
             phone: ${memberInfo?.phone} --- pointBalance: ${memberInfo?.pointBalance}`);
					return true;
				}
			}
			this.showApiModalTip(customerRes.data?.message || "failed to fetch member via id");
			return false;
		} catch (e) {
			this.showApiModalTip(e.response?.data?.message || e.message || "Network Error");
			return false;
		}
	};
	fetchCRMMemberInfo = async (userId) => {
		try {
			const { setCRMMemberInfo, changeLoginType, onClose } = this.props;
			const res = await getCRMMemberInfo(userId);
			if (res.status === 200 && res.data.code === 0) {
				setCRMMemberInfo(res.data.data);
				changeLoginType("active");
				const onboardGiftRule = await this.fetchOnboardGiftRule(res.data.data);
				onClose?.({
					isNewMember: true,
					onboardGiftRule
				});
				posFrontLog(`login -CRM -  id: ${res.data.data?.id} --- userId: ${res.data.data?.userId} ---  
           phone: ${res.data.data?.phone} --- pointBalance: ${res.data.data?.pointBalance}`);
				return true;
			}
			this.showApiModalTip(res.data?.msg);
			return false;
		} catch (e) {
			this.showApiModalTip(e.response?.data?.message || e.message || "Network Error");
			return false;
		}
	};
	fetchOnboardGiftRule = async (memberCRMInfo) => {
		try {
			const res = await getOnboardGiftRule();
			if (res.status === 200 && res.data.code === 0) {
				this.props.setOnboardGiftRule(res.data.data);
				return res.data.data;
			}
		} catch (e) {}
		let onboardGift = {
			onboardGift: memberCRMInfo.pointBalance > 0,
			data: [{ giftContent: { number: memberCRMInfo.pointBalance } }]
		};
		this.props.setOnboardGiftRule(onboardGift);
		return onboardGift;
	};
	handleKeyUp = async (e) => {
		if (e.keyCode === 13) await this.onConfirmPhone();
	};
	rejectBlacklistedPhone = (phone) => {
		if (!isPhoneBlacklisted(phone, this.props.selfConfig)) return false;
		this.setState({
			showPhoneBlacklist: true,
			loading: false,
			keyboardToggle: false,
			step: 0,
			tempMemberInfo: null
		});
		return true;
	};
	closePhoneBlacklist = () => {
		this.setState({ showPhoneBlacklist: false });
		if (this.props.autoSubmitPhone) this.props.onClose();
	};
	showKeyboard = () => {
		this.setState({ keyboardToggle: true });
	};
	hideKeyboard = () => {
		this.setState({ keyboardToggle: false });
	};
	render() {
		const { phoneNum, isPhoneValid, isPrivacyConfirm, step, loading, errorApiShow, errorApiMsg, keyboardToggle } = this.state;
		const { t, onClose } = this.props;
		const isVertical = this.state.deviceOrientation === "vertical";
		const actions = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: LoginModal_module_default.never,
			onClick: onClose,
			children: t("cancel")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: (0, import_classnames.default)(LoginModal_module_default.confirmBtn, !isPhoneValid || !isPrivacyConfirm ? LoginModal_module_default.disableConfirm : "linear-animate-btn"),
			onClick: this.onConfirmPhone,
			children: t("confirm")
		})] });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: LoginModal_module_default.loginWrapper,
			children: [
				step === 0 && !this.props.autoSubmitPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: LoginModal_module_default.loginModal,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneNumberEntryLayout, {
						title: t("phoneLogin"),
						titleIcon: null,
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
						isPrivacyConfirm,
						changePrivacyConfirm: this.changePrivacyConfirm,
						actions
					})
				}),
				step === 0 && this.props.autoSubmitPhone && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: LoginModal_module_default.never,
					onClick: onClose,
					children: t("cancel")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
					visible: step === 1,
					html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendAuthCode_default, {
						t,
						goBackStep: this.backToPrevStep,
						phoneNum,
						onVerifySuccess: this.onVerifySuccess,
						tempMemberInfo: this.state.tempMemberInfo
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: loading }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneBlacklistDialog, {
					visible: this.state.showPhoneBlacklist,
					onConfirm: this.closePhoneBlacklist,
					t
				}),
				errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
					variant: "filled",
					severity: "error",
					children: errorApiMsg
				}) : null,
				keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
					keyboardValue: phoneNum,
					handlePressEnter: this.onConfirmPhone,
					changeInput: (v) => this.keyboardChange(v),
					closeKeyboard: () => this.hideKeyboard(),
					VKOuterStyle: { zIndex: 9999 }
				}) : null
			]
		});
	}
};
//#endregion
export { LoginModal as default };
