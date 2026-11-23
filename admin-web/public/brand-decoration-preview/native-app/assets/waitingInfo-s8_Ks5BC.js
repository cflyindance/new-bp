import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { C as getMarginappFetchConfig, b as fetchSystemConfig } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { F as initConfigParams, an as setSelfConfig } from "./actions-BwRPwnFF.js";
import { t as Trans } from "./Trans-BKMH8GOf.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
//#region source-snapshot/src/container/orderPage/waitingInfo/waitingInfo.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var waitingInfo_module_default = {
	waitingBoxFixed: "waitingBoxFixed___O4Jc0",
	text: "text___A-5UO",
	cupCount: "cupCount___rEvBB",
	waitingBoxLine: "waitingBoxLine___c9A7x"
};
//#endregion
//#region source-snapshot/src/container/orderPage/waitingInfo/index.js
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_OVER_TIME_CLOSE = 30;
var DEFAULT_OVER_NUMBER = 10;
var DEFAULT_OVER_TIME_MINUTES = 10;
var DEFAULT_RANGE_SUB_MINUTES = 2;
var DEFAULT_RANGE_ADD_MINUTES = 2;
var WaitingInfo = (0, import_react.forwardRef)(({ t, selfConfig, systemConfig, makingCupNum, waitingBoxStyle, countTextStyle, minutesTextStyle, isFixed = false, outputNormalText = false, innerRef }, ref) => {
	const actualRef = innerRef || ref;
	const waitingBoxRef = (0, import_react.useRef)(null);
	const waitingTimeSetting = (0, import_react.useMemo)(() => selfConfig?.configList?.find((e) => e.id === 44)?.value || {}, [selfConfig]);
	const waitingTimeRangeSetting = (0, import_react.useMemo)(() => selfConfig?.configList?.find((e) => e.id === 47)?.value || {}, [selfConfig]);
	const waitingTimeShowType = (0, import_react.useMemo)(() => selfConfig?.configList?.find((e) => e.id === 56)?.value || ["count", "time"], [selfConfig]);
	const waitingTimeFontSize = (0, import_react.useMemo)(() => selfConfig?.configList?.find((e) => e.id === 57)?.value, [selfConfig]);
	const waitingTimeBgColor = (0, import_react.useMemo)(() => selfConfig?.configList?.find((e) => e.id === 58)?.value, [selfConfig]);
	const waitingTimeFontColor = (0, import_react.useMemo)(() => selfConfig?.configList?.find((e) => e.id === 59)?.value, [selfConfig]);
	const { status: waitingFlag = false, overTimeClose = DEFAULT_OVER_TIME_CLOSE } = waitingTimeSetting;
	const { status: waitingRangeFlag = false, overNumber = DEFAULT_OVER_NUMBER, overTimeMinutes = DEFAULT_OVER_TIME_MINUTES, rangeSubMinutes = DEFAULT_RANGE_SUB_MINUTES, rangeAddMinutes = DEFAULT_RANGE_ADD_MINUTES } = waitingTimeRangeSetting;
	const cupSettings = (0, import_react.useMemo)(() => ({
		underCups: systemConfig?.PREPARING_TIME_UNDER_CUPS?.intValue || 0,
		underCupsSecond: systemConfig?.PREPARING_TIME_UNDER_CUPS_SECONDS?.intValue || 0,
		upperCups: systemConfig?.PREPARING_TIME_UPPER_CUPS?.intValue || 0,
		upperCupsSecond: systemConfig?.PREPARING_TIME_UPPER_CUPS_SECONDS?.intValue || 0,
		additionalTime: systemConfig?.PREPARING_TIME_ADDITIONAL_TIME?.intValue || 0,
		count: (makingCupNum !== null ? makingCupNum : systemConfig?.PREPARING_ITEM_COUNT?.doubleValue) || 0
	}), [systemConfig, makingCupNum]);
	const waitingTimeTotal = (0, import_react.useMemo)(() => {
		const { count, underCups, underCupsSecond, upperCups, upperCupsSecond, additionalTime } = cupSettings;
		let basicTime = underCupsSecond + additionalTime;
		if (count <= underCups) return basicTime;
		const extraCups = count - underCups;
		return basicTime + Math.ceil(extraCups / upperCups) * upperCupsSecond;
	}, [cupSettings]);
	const shouldShow = (0, import_react.useMemo)(() => {
		const waitingMinutes = Math.ceil(waitingTimeTotal / 60);
		return cupSettings.count > 0 && waitingFlag && waitingMinutes <= overTimeClose;
	}, [
		cupSettings.count,
		waitingFlag,
		overTimeClose,
		waitingTimeTotal
	]);
	(0, import_react.useImperativeHandle)(actualRef, () => ({
		shouldShow,
		waitingTimeTotal
	}));
	(0, import_react.useEffect)(() => {
		const fetchRequiredData = async () => {
			try {
				if (!selfConfig?.configList?.length) {
					const res = await getMarginappFetchConfig();
					if (res.data.result.successful) {
						if (res.data.marginAppConfigTypes.length) {
							let obj = res.data.marginAppConfigTypes.find((p) => p.product == "KIOSKLITE");
							setSelfConfig(JSON.parse(obj.data));
						}
					}
				}
				if (!Object.keys(systemConfig).length) {
					const res = await fetchSystemConfig();
					if (res?.data) initConfigParams(res.data);
				}
			} catch (error) {
				console.error("Error fetching configurations:", error);
			}
		};
		fetchRequiredData();
	}, [selfConfig, systemConfig]);
	const showTimeContent = (0, import_react.useMemo)(() => {
		if (waitingRangeFlag && (cupSettings.count > overNumber || waitingTimeTotal > overTimeMinutes * 60)) return `${Math.floor(waitingTimeTotal / 60 - rangeSubMinutes)}-${Math.ceil(waitingTimeTotal / 60 + rangeAddMinutes)}`;
		else return `${Math.ceil(waitingTimeTotal / 60)}`;
	}, [
		cupSettings.count,
		waitingTimeTotal,
		waitingRangeFlag,
		rangeSubMinutes,
		rangeAddMinutes
	]);
	const showCount = waitingTimeShowType.includes("count");
	const showTime = waitingTimeShowType.includes("time");
	(0, import_react.useEffect)(() => {
		if (!isFixed || !waitingBoxRef.current) return;
		const container = waitingBoxRef.current;
		const { type, fontsizeMultiple = 1 } = waitingTimeFontSize || { type: "default" };
		if (type === "multiple") {
			container.querySelectorAll("span, div").forEach((element) => {
				const savedInlineStyle = element.style.fontSize;
				element.style.fontSize = "";
				const computedStyle = window.getComputedStyle(element);
				const baseFontSize = parseFloat(computedStyle.fontSize);
				if (baseFontSize && !isNaN(baseFontSize)) {
					const newFontSize = baseFontSize * fontsizeMultiple;
					element.style.fontSize = `${newFontSize}px`;
				} else if (savedInlineStyle) element.style.fontSize = savedInlineStyle;
			});
			const savedContainerStyle = container.style.fontSize;
			container.style.fontSize = "";
			const containerComputedStyle = window.getComputedStyle(container);
			const baseContainerFontSize = parseFloat(containerComputedStyle.fontSize);
			if (baseContainerFontSize && !isNaN(baseContainerFontSize)) {
				const newContainerFontSize = baseContainerFontSize * fontsizeMultiple;
				container.style.fontSize = `${newContainerFontSize}px`;
			} else if (savedContainerStyle) container.style.fontSize = savedContainerStyle;
		} else if (type === "default") {
			container.querySelectorAll("span, div").forEach((element) => {
				element.style.fontSize = "";
			});
			container.style.fontSize = "";
		}
	}, [
		waitingTimeFontSize?.type,
		waitingTimeFontSize?.fontsizeMultiple,
		isFixed,
		showCount,
		showTime,
		cupSettings.count,
		showTimeContent
	]);
	(0, import_react.useEffect)(() => {
		if (!isFixed || !waitingBoxRef.current) return;
		const container = waitingBoxRef.current;
		const { type, customColor } = waitingTimeBgColor || { type: "default" };
		if (type === "custom" && customColor) container.style.backgroundColor = customColor;
		else if (type === "default") container.style.backgroundColor = "";
	}, [
		waitingTimeBgColor?.type,
		waitingTimeBgColor?.customColor,
		isFixed
	]);
	(0, import_react.useEffect)(() => {
		if (!isFixed || !waitingBoxRef.current) return;
		const container = waitingBoxRef.current;
		const { type, customColor } = waitingTimeFontColor || { type: "default" };
		if (type === "custom" && customColor) {
			container.querySelectorAll("span, div").forEach((element) => {
				element.style.color = customColor;
			});
			container.style.color = customColor;
		} else if (type === "default") {
			container.querySelectorAll("span, div").forEach((element) => {
				element.style.color = "";
			});
			container.style.color = "";
		}
	}, [
		waitingTimeFontColor?.type,
		waitingTimeFontColor?.customColor,
		isFixed,
		showCount,
		showTime,
		cupSettings.count,
		showTimeContent
	]);
	if (!shouldShow) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: waitingBoxRef,
		className: isFixed ? waitingInfo_module_default.waitingBoxFixed : waitingInfo_module_default.waitingBoxLine,
		style: waitingBoxStyle,
		children: [showCount && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trans, {
			t,
			i18nKey: "waiting-time-count",
			values: { count: cupSettings.count },
			components: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: countTextStyle,
				className: !outputNormalText && `${waitingInfo_module_default.cupCount} ${waitingInfo_module_default.text}`
			})]
		}), showTime && (isFixed || outputNormalText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ", " }))] }), showTime && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trans, {
			t,
			i18nKey: "waiting-time-minutes",
			values: { time: showTimeContent },
			components: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: minutesTextStyle,
				className: !outputNormalText && waitingInfo_module_default.text
			})]
		})]
	});
});
function mapStateToProps(state) {
	return {
		selfConfig: state.selfConfig,
		systemConfig: state.systemConfig,
		makingCupNum: state.socket.makingCupNum
	};
}
var WaitingInfoWithTranslation = withTranslation()(WaitingInfo);
var WaitingInfoWithConnect = connect(mapStateToProps, {
	setSelfConfig,
	initConfigParams
})(WaitingInfoWithTranslation);
var waitingInfo_default = import_react.forwardRef((props, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WaitingInfoWithConnect, {
		...props,
		innerRef: ref
	});
});
//#endregion
export { waitingInfo_default as t };
