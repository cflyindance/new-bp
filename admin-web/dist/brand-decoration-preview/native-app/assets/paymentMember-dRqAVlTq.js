import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { H as EventBus, h as completePaymentMember, j as queryPaymentMember } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { nn as setPaymentMemberCardRecord } from "./actions-BwRPwnFF.js";
import { t as Trans } from "./Trans-BKMH8GOf.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as maskPhoneNumber } from "./maskPhoneNumber-Cwwie3jl.js";
import { t as PolicyContent } from "./PolicyContent-CTnZEMvv.js";
import { t as numPad_default } from "./numPad-f96Tw6Sn.js";
import { t as crmIntegration } from "./crm-integration-DyFhn08j.js";
import { n as getOrderPhoneDigits, o as isValidUSPhone, r as getUSPhoneDigits, s as normalizePhoneDigits, t as formatUSPhoneInput } from "./phoneNumber-CPrZu7TP.js";
import { i as shouldEnterPaymentMember, n as isAdMemberEnabled, r as isFullCreditPayment } from "./paymentMemberNavigation-B5bHxJaq.js";
import { i as loadPaymentMemberEarnedPoints, n as getPaymentMemberCouponCount, r as getPaymentMemberDisplayData } from "./displayData-DtueOqhs.js";
//#region source-snapshot/src/container/paymentMember/flow.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var getStrongCandidates = (query) => (query?.results || []).filter((item) => item?.customer != null);
function getPaymentMemberScene(query, hasPointRule, orderPhone) {
	if (orderPhone) return hasPointRule ? "phonePoints" : "phoneNoPoints";
	const candidates = getStrongCandidates(query);
	if (query?.results?.some((item) => item?.matchLevel === "fallback")) return "phone";
	if (query?.resultType === "UNIQUE_STRONG" && candidates.length === 1) return "strong";
	if (query?.resultType === "MULTIPLE_STRONG" && candidates.length > 1) return "multiple";
	if (query?.resultType === "NO_STRONG") {
		if (query?.isPrimaryCardPayment !== true) return "skip";
		return hasPointRule ? "phonePoints" : "phoneNoPoints";
	}
	return "skip";
}
//#endregion
//#region source-snapshot/src/assets/images/paymentMember/gift.png
var gift_default = "" + new URL("gift-x35ZsM1a.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/assets/images/paymentMember/member.png
var member_default = "" + new URL("member-B1FhyGC9.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/assets/images/paymentMember/vip.png
var vip_default = "" + new URL("vip-npk5zO0l.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/assets/images/paymentMember/success.png
var success_default = "" + new URL("success-C5apE2p2.png", import.meta.url).href;
var index_module_default = {
	page: "page___SAdz3",
	topBar: "topBar___Oh-fh",
	layout: "layout___PhysA",
	intro: "intro___avnDW",
	accent: "accent___gNALy",
	historicalPoints: "historicalPoints___CR9B7",
	pointsPending: "pointsPending___-QkZz",
	pointsFadeIn: "pointsFadeIn___aLQbA",
	illustration: "illustration___igKQD",
	congratulations: "congratulations___B6YCR",
	panel: "panel___jgv03",
	panelHeading: "panelHeading___0jkoB",
	textButton: "textButton___kss7F",
	candidateList: "candidateList___0aLVI",
	candidate: "candidate___QkIiv",
	accountCard: "accountCard___EM2gO",
	radio: "radio___3n1YE",
	selected: "selected___ZCkSc",
	primaryButton: "primaryButton___4Uuok",
	secondaryButton: "secondaryButton___Xilnw",
	uniquePage: "uniquePage___qCdft",
	uniquePanel: "uniquePanel___sSqVn",
	buttonRow: "buttonRow___aateX",
	phonePage: "phonePage___Dji59",
	phonePanel: "phonePanel___fuZS8",
	phoneField: "phoneField___ejhSV",
	consent: "consent___HDn0x",
	policyLink: "policyLink___AOpv3",
	assetsPanel: "assetsPanel___Bhp-p",
	reward: "reward___6xGsR",
	memberHeader: "memberHeader___U7Ff5",
	memberBadge: "memberBadge___qiHjk",
	notMine: "notMine___44m4-",
	assetCounts: "assetCounts___4ydtQ",
	progress: "progress___77ELu",
	pointProgress: "pointProgress___FPDj9",
	pointTiers: "pointTiers___-tDs-",
	rewardCard: "rewardCard___yqRjM",
	rewardIcon: "rewardIcon___opamf",
	rewardContent: "rewardContent___6RXc0",
	rewardName: "rewardName___6cgn-",
	rewardCaption: "rewardCaption___F1EGD",
	rewardTag: "rewardTag___eGsMb",
	rewardCondition: "rewardCondition___UzhoX"
};
//#endregion
//#region source-snapshot/src/container/paymentMember/index.js
var import_jsx_runtime = require_jsx_runtime();
var PHONE_KEYS = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	0
];
var GOT_IT_COUNTDOWN_SECONDS = 10;
function PaymentMember({ history, currentOrder, allSysConfig, crm, avocado, menuGroup, comboMenu, merchantProfile, selfConfig, loadPaymentMemberEarnedPoints, setPaymentMemberCardRecord, t }) {
	const record = currentOrder?.paymentMemberCardRecord;
	const orderId = Number(currentOrder?.saveOrderResult?.id);
	const [query, setQuery] = (0, import_react.useState)(null);
	const [scene, setScene] = (0, import_react.useState)("loading");
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [phone, setPhone] = (0, import_react.useState)("");
	const [returnScene, setReturnScene] = (0, import_react.useState)(null);
	const [working, setWorking] = (0, import_react.useState)(false);
	const [seconds, setSeconds] = (0, import_react.useState)(GOT_IT_COUNTDOWN_SECONDS);
	const [pendingMember, setPendingMember] = (0, import_react.useState)(null);
	const [policyContentUrl, setPolicyContentUrl] = (0, import_react.useState)("");
	const actionStarted = (0, import_react.useRef)(false);
	const leavingForHome = (0, import_react.useRef)(false);
	const mounted = (0, import_react.useRef)(true);
	const orderPhone = getOrderPhoneDigits(currentOrder);
	const orderMemberId = currentOrder?.saveOrderResult?.crmMemberId;
	const estimate = currentOrder?.paymentMemberPointsEstimate;
	const candidates = (0, import_react.useMemo)(() => getStrongCandidates(query), [query]);
	const selectedCustomer = candidates.find((item) => item.customer?.customerId === selectedId)?.customer;
	const couponCount = (0, import_react.useMemo)(() => scene === "gotIt" ? getPaymentMemberCouponCount(pendingMember?.source === "card" ? pendingMember.vouchers : avocado?.vouchers, {
		menuGroup,
		comboMenu,
		orderType: currentOrder?.orderType,
		merchantId: merchantProfile?.merchantId
	}) : null, [
		scene,
		pendingMember,
		avocado?.vouchers,
		menuGroup,
		comboMenu,
		currentOrder?.orderType,
		merchantProfile?.merchantId
	]);
	const display = getPaymentMemberDisplayData({
		query,
		customer: selectedCustomer,
		order: currentOrder?.saveOrderResult,
		member: pendingMember,
		rewards: avocado?.rewards,
		couponCount,
		estimatedPoints: estimate?.orderId === String(orderId) ? estimate.points : null
	});
	const hasPointData = display.earnedPoints != null;
	const finish = (0, import_react.useCallback)(() => {
		if (!leavingForHome.current) history.replace("/orderFinish");
	}, [history]);
	const completeWithoutMember = (0, import_react.useCallback)(() => {
		if (actionStarted.current) return false;
		actionStarted.current = true;
		if (!orderMemberId && isFullCreditPayment(currentOrder)) completePaymentMember({ orderId }).catch(() => {});
		return true;
	}, [
		orderId,
		orderMemberId,
		currentOrder
	]);
	const skip = (0, import_react.useCallback)(() => {
		if (completeWithoutMember()) finish();
	}, [completeWithoutMember, finish]);
	const submitMember = (0, import_react.useCallback)(async (customerId, forceBindMember = false, skipIfAlreadyBound = false, memberPhone = "") => {
		if (!customerId || actionStarted.current) return;
		actionStarted.current = true;
		setWorking(true);
		try {
			if (!skipIfAlreadyBound || String(orderMemberId || "") !== String(customerId)) await completePaymentMember({
				orderId,
				paymentRecordId: record.paymentRecordId,
				customerId: String(customerId),
				...forceBindMember ? { forceBindMember: true } : {}
			});
			if (mounted.current) setPaymentMemberCardRecord({
				...record,
				boundCustomerId: String(customerId),
				boundPhone: getUSPhoneDigits(memberPhone)
			});
		} catch (error) {
			if (mounted.current) toast_default.info(t("payment-member-bind-failed"), "top");
		} finally {
			if (mounted.current) {
				setWorking(false);
				finish();
			}
		}
	}, [
		finish,
		orderId,
		orderMemberId,
		record,
		setPaymentMemberCardRecord,
		t
	]);
	const submitPendingMember = (0, import_react.useCallback)(() => submitMember(pendingMember?.userId || pendingMember?.id, pendingMember?.source === "login", false, pendingMember?.phone), [pendingMember, submitMember]);
	(0, import_react.useEffect)(() => {
		EventBus.on("payment_member_back_home", () => {
			leavingForHome.current = true;
			if (scene === "gotIt") submitPendingMember();
			else completeWithoutMember();
		});
		return () => EventBus.off("payment_member_back_home");
	}, [
		scene,
		submitPendingMember,
		completeWithoutMember
	]);
	(0, import_react.useEffect)(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!isAdMemberEnabled(allSysConfig) || !shouldEnterPaymentMember(record?.guideSettings) || !isFullCreditPayment(currentOrder) || orderPhone) return;
		loadPaymentMemberEarnedPoints();
	}, [orderId, record?.paymentRecordId]);
	(0, import_react.useEffect)(() => {
		if (!isAdMemberEnabled(allSysConfig) || !shouldEnterPaymentMember(record?.guideSettings) || !isFullCreditPayment(currentOrder) || orderPhone) {
			finish();
			return;
		}
		if (isValidUSPhone(orderPhone)) {
			setPhone(orderPhone);
			setScene(getPaymentMemberScene(null, hasPointData, orderPhone));
			return;
		}
		let active = true;
		const load = async () => {
			try {
				const result = await queryPaymentMember({
					orderId,
					paymentRecordId: record.paymentRecordId
				});
				if (!active) return;
				setQuery(result);
				const nextScene = getPaymentMemberScene(result, hasPointData, isValidUSPhone(orderPhone) ? orderPhone : null);
				if (nextScene === "skip") {
					skip();
					return;
				}
				const strong = getStrongCandidates(result);
				if (strong.length > 0) setSelectedId(strong[0].customer.customerId);
				if (nextScene === "strong") {
					let memberPhone = getUSPhoneDigits(strong[0].customer.phone);
					if (memberPhone.length !== 10) {
						memberPhone = "";
						try {
							const infoResult = await crmIntegration.getCustomerInfo(strong[0].customer.customerId);
							const detailPhone = infoResult?.data?.success ? getUSPhoneDigits(infoResult.data.data?.phone) : "";
							if (detailPhone.length === 10) memberPhone = detailPhone;
						} catch (error) {}
					}
					if (!active) return;
					await submitMember(strong[0].customer.customerId, false, true, memberPhone);
					return;
				}
				setPhone(isValidUSPhone(orderPhone) ? orderPhone : "");
				setScene(nextScene);
			} catch (error) {
				if (active) skip();
			}
		};
		load();
		return () => {
			active = false;
		};
	}, [orderId, record?.paymentRecordId]);
	(0, import_react.useEffect)(() => {
		if (scene !== "gotIt" || working) return void 0;
		const timer = window.setTimeout(() => {
			if (seconds <= 1) {
				setSeconds(0);
				submitPendingMember();
			} else setSeconds(seconds - 1);
		}, 1e3);
		return () => window.clearTimeout(timer);
	}, [
		scene,
		seconds,
		working,
		submitPendingMember
	]);
	const openPhone = () => {
		setReturnScene(scene);
		setPhone(scene === "gotIt" ? "" : orderPhone);
		setScene("phone");
	};
	const openLogin = (loginPhone) => {
		if (!isValidUSPhone(loginPhone) || actionStarted.current) return;
		setScene("auth");
		EventBus.emit("open_login_modal", {
			initialPhone: getUSPhoneDigits(loginPhone),
			onCancel: () => {
				if (mounted.current) setScene(scene);
			},
			onSuccess: (member) => {
				if (!mounted.current) return;
				if (!(member?.userId || member?.id)) {
					toast_default.info(t("payment-member-bind-failed"), "top");
					setScene(scene);
					return;
				}
				const memberPhone = getUSPhoneDigits(member.phone);
				setPendingMember({
					...member,
					phone: memberPhone.length === 10 ? memberPhone : getUSPhoneDigits(loginPhone),
					source: "login"
				});
				setSeconds(GOT_IT_COUNTDOWN_SECONDS);
				setScene("gotIt");
			}
		});
	};
	const confirm = async () => {
		if (working || actionStarted.current) return;
		if (scene === "unique") {
			openLogin(orderPhone);
			return;
		}
		if (!selectedId) return;
		setWorking(true);
		try {
			const [infoResult, assetsResult] = await Promise.allSettled([crmIntegration.getCustomerInfo(selectedId), crmIntegration.getCustomerAssets(selectedId)]);
			if (!mounted.current) return;
			const info = infoResult.status === "fulfilled" && infoResult.value?.data?.success ? infoResult.value.data.data : null;
			const assets = assetsResult.status === "fulfilled" && assetsResult.value?.data?.success ? assetsResult.value.data.data : null;
			setPendingMember({
				...selectedCustomer,
				...info,
				id: selectedId,
				userId: selectedId,
				source: "card",
				pointBalance: assets?.loyaltyAccount?.pointBalance ?? selectedCustomer?.point ?? null,
				vouchers: assets ? assets.vouchers || [] : null
			});
			setSeconds(GOT_IT_COUNTDOWN_SECONDS);
			setScene("gotIt");
		} catch (error) {
			if (mounted.current) toast_default.info(t("payment-member-bind-failed"), "top");
		} finally {
			if (mounted.current) setWorking(false);
		}
	};
	const register = () => openLogin(phone);
	const openPolicy = (event) => {
		event.preventDefault();
		setPolicyContentUrl(event.currentTarget.href);
	};
	const onPhoneKey = (next) => setPhone(normalizePhoneDigits(next));
	const isPhoneScene = scene === "phone" || scene === "phoneNoPoints" || scene === "phonePoints";
	const showPointsTitle = hasPointData && (scene === "phonePoints" || scene === "unique" || scene === "multiple");
	const pointsTitleClassName = (showPointsTitle || scene === "gotIt") && hasPointData && Number(currentOrder?.saveOrderResult?.point) === 0 ? [index_module_default.pointsFadeIn, (estimate?.orderId !== String(orderId) || estimate.status === "pending") && index_module_default.pointsPending].filter(Boolean).join(" ") : void 0;
	const descriptionKey = scene === "multiple" ? "payment-member-select-account-description" : (scene === "phonePoints" || scene === "phoneNoPoints" || scene === "unique") && isValidUSPhone(orderPhone) ? "payment-member-confirm-account-description" : scene === "phonePoints" && hasPointData ? "payment-member-description" : "payment-member-phone-description";
	const illustration = scene === "phonePoints" ? gift_default : scene === "phone" || scene === "phoneNoPoints" ? vip_default : scene === "multiple" ? member_default : scene === "gotIt" ? success_default : null;
	const earnedPoints = display.earnedPoints;
	const pointsParts = t("payment-member-points-available", { points: earnedPoints }).split(String(earnedPoints));
	const earnedParts = t("payment-member-earned", { points: earnedPoints }).split(String(earnedPoints));
	const redeemParts = t("payment-member-points-to-redeem", { points: display.pointsToRedeem }).split(String(display.pointsToRedeem));
	const goBackFromPhone = () => {
		if (returnScene) {
			if (returnScene === "gotIt") setSeconds(GOT_IT_COUNTDOWN_SECONDS);
			setScene(returnScene);
		} else skip();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: `${index_module_default.page} ${isPhoneScene ? index_module_default.phonePage : ""} ${scene === "unique" ? index_module_default.uniquePage : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", { className: index_module_default.topBar }),
			scene === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: true }) : null,
			scene !== "loading" && scene !== "auth" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: index_module_default.layout,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: index_module_default.intro,
					children: [
						scene === "gotIt" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: index_module_default.congratulations,
							children: t("payment-member-congratulations")
						}),
						(scene !== "gotIt" || earnedPoints != null) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: pointsTitleClassName,
							children: showPointsTitle && earnedPoints != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								pointsParts[0],
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: index_module_default.accent,
									children: earnedPoints
								}),
								pointsParts[1]
							] }) : scene === "gotIt" && earnedPoints != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								earnedParts[0],
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: index_module_default.accent,
									children: earnedPoints
								}),
								earnedParts[1]
							] }) : t("payment-member-link-title")
						}),
						selfConfig?.configMap?.id_72 === true && (showPointsTitle || scene === "gotIt") && display.historicalPoints > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: index_module_default.historicalPoints,
							children: t("payment-member-historical-points", { points: display.historicalPoints })
						}),
						scene !== "gotIt" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t(descriptionKey) }),
						illustration && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							className: index_module_default.illustration,
							src: illustration,
							alt: ""
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: `${index_module_default.panel} ${isPhoneScene ? index_module_default.phonePanel : ""} ${scene === "unique" ? index_module_default.uniquePanel : ""} ${scene === "gotIt" ? index_module_default.assetsPanel : ""}`,
					children: [
						scene === "multiple" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: index_module_default.panelHeading,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: t("payment-member-possible-matches") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: index_module_default.textButton,
									disabled: working,
									onClick: openPhone,
									children: t("payment-member-none-of-these")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: index_module_default.candidateList,
								children: candidates.map(({ customer }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									disabled: working,
									className: `${index_module_default.candidate} ${selectedId === customer.customerId ? index_module_default.selected : ""}`,
									onClick: () => setSelectedId(customer.customerId),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: index_module_default.radio }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: customer.display?.maskedPhone || customer.display?.maskedEmail || t("payment-member-account") })]
								}, customer.customerId))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: index_module_default.primaryButton,
								disabled: !selectedId || working,
								onClick: confirm,
								children: t("payment-member-confirm")
							})
						] }),
						scene === "unique" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: t("payment-member-is-this-you") }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: index_module_default.accountCard,
								children: orderPhone && maskPhoneNumber(orderPhone) || t("payment-member-account")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: index_module_default.buttonRow,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: index_module_default.secondaryButton,
									onClick: openPhone,
									children: t("payment-member-not-me")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: index_module_default.primaryButton,
									disabled: working,
									onClick: confirm,
									children: t("payment-member-yes-confirm")
								})]
							})
						] }),
						isPhoneScene && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: index_module_default.phoneField,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "tel",
									inputMode: "none",
									value: formatUSPhoneInput(phone),
									placeholder: t("payment-member-phone-placeholder"),
									onChange: (event) => onPhoneKey(event.target.value),
									"aria-label": t("payment-member-enter-phone")
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(numPad_default, {
								keys: PHONE_KEYS,
								propValue: phone,
								keyPress: onPhoneKey,
								className: "numPadWide numPadLandscape"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: index_module_default.buttonRow,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: index_module_default.secondaryButton,
									onClick: scene === "phone" ? goBackFromPhone : skip,
									children: scene === "phone" && returnScene ? t("payment-member-back") : t("payment-member-no-thanks")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: index_module_default.primaryButton,
									disabled: !isValidUSPhone(phone),
									onClick: register,
									children: t("payment-member-sign-up-login")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: index_module_default.consent,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trans, {
									t,
									i18nKey: "payment-member-consent",
									components: {
										privacy: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											className: index_module_default.policyLink,
											href: "https://order.mealkeyway.com/dashboard/release/index#/privacypolicy",
											onClick: openPolicy
										}),
										terms: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											className: index_module_default.policyLink,
											href: "https://order.mealkeyway.com/dashboard/release/index#/servicesagreement",
											onClick: openPolicy
										})
									}
								})
							})
						] }),
						scene === "gotIt" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: index_module_default.memberHeader,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: index_module_default.memberBadge,
										children: "✦"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: pendingMember?.memberLevelName || t("payment-member-account") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: pendingMember?.phone && maskPhoneNumber(getUSPhoneDigits(pendingMember.phone)) || pendingMember?.display?.maskedPhone || pendingMember?.display?.maskedEmail })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: working,
										className: index_module_default.notMine,
										onClick: openPhone,
										children: t("payment-member-not-mine")
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: index_module_default.assetCounts,
								children: [display.pointBalance != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: t("payment-member-points-label") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: display.pointBalance })] }), display.couponCount != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: t("payment-member-coupons-label") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: display.couponCount })] })]
							}),
							display.progressPercent != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: index_module_default.pointProgress,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: index_module_default.progress,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${display.progressPercent}%` } })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: index_module_default.pointTiers,
									children: [0, ...display.pointTiers].map((points, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: { left: `${index / display.pointTiers.length * 100}%` },
										children: points
									}, points))
								})]
							}),
							display.pointsToRedeem != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: index_module_default.reward,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
									redeemParts[0],
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: index_module_default.accent,
										children: display.pointsToRedeem
									}),
									redeemParts[1]
								] }), display.reward && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: index_module_default.rewardCard,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: index_module_default.rewardIcon,
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
											viewBox: "0 0 48 48",
											fill: "none",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
													d: "M9 24 38 17l6 23-29 7z",
													fill: "#c0d6ff"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
													d: "M6 20 38 12l3 10-32 8z",
													fill: "#aac7fb"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
													d: "m22 16 7-2 8 29-7 2z",
													fill: "#ffb600"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
													d: "M20 17C8 15 12 4 20 10c3 2 5 7 5 7M25 16c2-14 16-12 10-4-3 4-10 4-10 4",
													stroke: "#ffb600",
													strokeWidth: "4",
													strokeLinecap: "round"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
													d: "M12 6c-4-5-10 0-6 4l6 5 6-5c4-4-2-9-6-4",
													fill: "#ff7895"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
													d: "m41 5 1 3 3 1-3 1-1 3-1-3-3-1 3-1zM7 33l1 3 3 1-3 1-1 3-1-3-3-1 3-1z",
													fill: "#ffb600"
												})
											]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: index_module_default.rewardContent,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
											className: index_module_default.rewardName,
											title: display.rewardTitle,
											children: display.rewardTitle
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: index_module_default.rewardCaption,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: index_module_default.rewardTag,
												children: t("gift")
											}), display.rewardMinSpend != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: index_module_default.rewardCondition,
												children: display.rewardMinSpend === 0 ? t("payment-member-no-order-limit") : t("payment-member-order-minimum", { amount: display.rewardMinSpend.toFixed(2) })
											})]
										})]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: working,
								className: index_module_default.primaryButton,
								onClick: submitPendingMember,
								children: t("payment-member-got-it", { seconds })
							})
						] })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				visible: Boolean(policyContentUrl),
				isMountOnBody: true,
				html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolicyContent, {
					url: policyContentUrl,
					t,
					onClose: () => setPolicyContentUrl("")
				}),
				onClose: () => setPolicyContentUrl("")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: working })
		]
	});
}
var mapStateToProps = (state) => ({
	currentOrder: state.currentOrder,
	allSysConfig: state.allSysConfig,
	crm: state.crm,
	avocado: state.avocado,
	menuGroup: state.menuGroup,
	comboMenu: state.comboMenu,
	merchantProfile: state.merchantProfile,
	selfConfig: state.selfConfig
});
var paymentMember_default = connect(mapStateToProps, {
	loadPaymentMemberEarnedPoints,
	setPaymentMemberCardRecord
})(withTranslation()(PaymentMember));
//#endregion
export { paymentMember_default as default };
