import { a as getDeviceOrientation } from "./utils-Cdx9DbDR.js";
import { ea as getCardColumnCount } from "./actions-BwRPwnFF.js";
//#region source-snapshot/src/utils/handleCountRowNum.js
var handleCountRowNum = ({ selfConfig, availableWidth, isTopMenu } = {}) => {
	const currentDeviceId = localStorage.getItem("deviceId");
	const currentDeviceInfo = selfConfig?.configList?.find((config) => config.id === 34)?.value?.find((device) => device.deviceId === currentDeviceId);
	const configuredCount = Number(currentDeviceInfo?.menuDisplay);
	let count;
	if (Number.isInteger(configuredCount) && configuredCount > 0) count = configuredCount;
	else if (typeof isTopMenu === "boolean" && /Android|Adr/i.test(window.navigator.userAgent)) count = getDeviceOrientation() === "horizontal" ? isTopMenu ? 5 : 4 : isTopMenu ? 3 : 2;
	else count = getCardColumnCount(availableWidth);
	return {
		count,
		widthRate: count === 1 ? 100 : Math.floor(100 / count) - 1
	};
};
//#endregion
export { handleCountRowNum as t };
