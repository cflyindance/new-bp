import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { r as getCookie, tt as systemLanguage } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
//#region source-snapshot/src/component/LangSwitch/langSwitch.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var langSwitch_module_default = {
	LangSwitchContainer: "LangSwitchContainer___-gH7u",
	LangSwitchItem: "LangSwitchItem___aXq1b",
	LangSwitchItemActive: "LangSwitchItemActive___DsbIK"
};
//#endregion
//#region source-snapshot/src/component/LangSwitch/index.jsx
var import_jsx_runtime = require_jsx_runtime();
var LangSwitch = (props) => {
	const { t, selfConfig, i18n, i18n: { language } } = props;
	const [langList, setLangList] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const availableLangs = systemLanguage.filter((lang) => selfConfig?.configMap?.id_10?.includes(lang.code));
		setLangList(availableLangs);
	}, [selfConfig, language]);
	const handleToggle = (code) => {
		i18n.changeLanguage(code);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: langSwitch_module_default.LangSwitchContainer,
		children: langList.map((lan) => {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `${langSwitch_module_default.LangSwitchItem} ${language === lan.code ? langSwitch_module_default.LangSwitchItemActive : ""}`,
				onClick: () => {
					handleToggle(lan.code);
				},
				children: lan.abbr
			}, lan.code);
		})
	});
};
function mapStateToProps$3(state) {
	return { selfConfig: state.selfConfig };
}
var LangSwitch_default = connect(mapStateToProps$3)(withTranslation()(LangSwitch));
var NetworkStatus_module_default = {
	kioskNetworkStatus: "kioskNetworkStatus___4wvmr",
	speed: "speed___PwPtG",
	netImg: "netImg___c-m8V",
	localTime: "localTime___fiZPt"
};
//#endregion
//#region source-snapshot/src/assets/images/net_best.png
var net_best_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAAxBAMAAACR0hLzAAAALVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADBoCg+AAAAD3RSTlMATEIeJhMJOQQvFz4qDjSq7nPlAAABc0lEQVQ4y2JABq02r5UEBZXqDkcwYAfNkwThYOcyLAo4zAVRQHECugrWQkE0ILcAVUWLoiAGEDJAV4FfDStQBX41bIWCOIAkzM1GSILa5eVFSFxliIo+uICmKVgXW/AjuNAJsADMIeJmCNddhtktBNJ0CcpRaUD2I5sTVFgXyIEaUgqXRXWhENDDEJYqVAJTzQUGLogt2OLVESwVwMABskgcI87gHhECMgyBtAP25MEClBKB0AiH9Bq7uFhFIJwD1Z0yuQEtUe1cAbPKxhTV3HBEbM7CajGHkyBq5GCCRUAJ/GrS0RPCNHQVzIoY6Qkl7YJDBwMAJoqmZCOmEnE0JbBEZRwauuQR1CZspgi5QTg3FbGZYghSEYDieGH0GEPNNizY4tZc6RgyN3NTKcOAA7YEAgpYJwETVAA+FVyK0AjEDS7CIhA3OAhRIkKZkkCIEjEwB3feQosdzGwMtQefMVBD8BoDNgS/MaBkQwBkWTDQBAAACe1SMlIA5h0AAAAASUVORK5CYII=";
//#endregion
//#region source-snapshot/src/assets/images/net_better.png
var net_better_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAAxCAMAAABUIv/yAAAAM1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACjBUbJAAAAEXRSTlMAGEwFEyYMCApFQBwQLzghK+wuNxsAAAE3SURBVEjH5ZTZjsMgDEUxNmtY+v9fO5VaNWUJOPAwGs15SyIdbrwgLkGrA8EbCtqiuIcJ0IOC4ZoswQBieJBgSjBDhQYmZqzY0yDcxCzUoiVg1RHoQ284YUJvJiziV1K0AVr0oBrUH0/sjBBWjlbfgrpvqULgdCegpA1yKtgarN5owUTX587+ZDaa54ycMe6G0d+P2GvFkdWT3A1pyqNRB9sIjujlFz42x6AZX3eUnGyJINigcvICdzAdcCpWNTbJCdHOHIeTUxxMHJIFDSWeJ0lDiSzwMR/0BFQq7Y6bxKmigDp6bpL8CUGdgn00kzarV4o8+irVtMfJ+YcRF5joXSLx37F2U0DRv4ZuvZbgiqVbQtdLt8KjlKjfk1ApMWIJVQXZtiixjNpytLu/a3FZbGLgQPFn+AHdfAt1NOq6PAAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/assets/images/net_good.png
var net_good_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAAxBAMAAACR0hLzAAAAJ1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADdEvm1AAAADXRSTlMAGUwLFQcSDyZBLyseZ4nKxAAAAT1JREFUOMuEkl0LgjAUhg+E3r847W8oZl5LRbcLo/vIvBas/1/o5nE7A5+bwXjY3vNBa6K6awDVj5rC7D5YuAalIxxeQoie8Mi09wkkKveMDSdqsOWYHJK9NQow577vwJxmI+ZuVDTRsjVMFzZItkrX2r8V/blhJiGHA2Yu/MibSDjmmYjlsKONklCAwig0JSWJyaCMy7WIySXzmfIoyrKs9DpOPrkjL5W/UHVFDg8sfClIAXc4kjuw4cTwGGR9PkqLIIJUNNJDttwu1W/GoaGwBCWCaQoiIsIdsZliiOJAZpAaYSw+MkDjYmRpEZSAYHdMZRhwwGxAQAHbSiWlWQn4VLBMUgICTQc8SoqUwEANj5JNECUalClJgihRxqOEA6KkAZ+XmqD24DMGagheY8CGEDLmAKE4MjzKQBMAALV6RfIzMl5eAAAAAElFTkSuQmCC";
//#endregion
//#region source-snapshot/src/assets/images/net_bare.png
var net_bare_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAAxBAMAAACR0hLzAAAAFVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAASAQCkAAAAB3RSTlMAGAwUBQkRHdMeNwAAASlJREFUOMvFlEFOwzAQRUdRwt51yToN6QEiIGs3FNahIPbg0vsfgbSMM7Xz7SIhxNtElp7/2ONR6Jy8tq1SuqsNYQqrJrpXZNwoj/tZUt6qgHLwjUzN0UPSEEeqRB0xMKU780oJt4eDPb/Xt3El3WjMKbUXq/LKlA1N9O/uOMdNG14s/D65Tt4REYfsKeCFY0ZdZOwYKrgKYMUKyf3hu2l2K4JknD9+l7JxV9drI8fh3f1HOFTdMO1oyONBGv9JFL+APA5sA3JwlUi7i9g8Cc9qxjJQwODpQHFDtd5ud5YVmMKNejqtStAUbabDH51r8GIVXApvmqu4Wnv6d3JzSbBj+5JS0fIDxtmAB8SDt/iB8rtCmfxUkpWkDo7hkGQMh6RjKrrA40B/whdW9zsKOGbUfAAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/assets/images/net_none.png
var net_none_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAAA3CAMAAACPZWyoAAAASFBMVEUAAADnUFjlTVffT1DlTlblTVfjTFjkUFrlTVfkTVjkTFfjTFfmTVfmTVfmTVfkSljkTFfnTlbiTVblTFbkSlXmTFfmTVflTVfrb2USAAAAF3RSTlMAIN8Qz+9AMJ9ggJBwv69gv19QzzC/j+CruiIAAAGSSURBVEjHzdbbdoMgEAVQBwsYwbvJ+f8/rW1qlUzGILRdnadg4pawOIPFTxW5xlGeoACoLMMBuUaFbMMj37jmG+XbrxlE5rNmSjKoVdjV1LhxPmtcwEq1AyUbWzUDZRtARaKhYg005qlgGoAbIkJ8CjcAghH3d0YNnDXUsJ9CC0AwTNfVru318USMAgRjKzu6SfyRZ99IeaELU/zH9Tq8puvDzFHFDXoAyle5pVoFdxTFGAJSbuWZLMu0DXqK7R+k9kSxjrSP7UHBCqplYPX9oz3Xx6y6P5i+B215kFt5RXq7imYBQqFrwQyGGLl1GKef7nW5UfDUi5mLQiiIHDMiEK+BY0MNr4/XVwZuR0INxBgTyQRvHFo/MxqZ0MGDXUfC2TDJxHUXWiPu09FZmbB6S33quW/VlvpUg3zlDD8r//U7zB8Zc9d145xumEp/3VWRaMRH7nba4Ge6kYz43NcJ6+FDYkhY0zKMLSXlZWdoy/ZHGW9sQmj4Is7YBGbURaSxCtwYiriiHrqnx4W+LkK1jt4B8TxjO8o1eGAAAAAASUVORK5CYII=";
//#endregion
//#region source-snapshot/src/component/NetworkStatus/index.jsx
var formatLocalTime = (date) => [
	date.getHours(),
	date.getMinutes(),
	date.getSeconds()
].map((value) => `0${value}`.slice(-2)).join(":");
var NetworkStatus = (props) => {
	const { sysCookie: { networkStatus } } = props;
	const [isShow, setIsShow] = (0, import_react.useState)(true);
	const [netImgUrl, setNetImgUrl] = (0, import_react.useState)(net_none_default);
	const [localTime, setLocalTime] = (0, import_react.useState)(() => formatLocalTime(/* @__PURE__ */ new Date()));
	(0, import_react.useEffect)(() => {
		if (window.self !== window.top) setIsShow(false);
	}, []);
	(0, import_react.useEffect)(() => {
		const { rtt } = networkStatus;
		let src;
		if (rtt < 0) src = net_none_default;
		else if (rtt >= 0 && rtt <= 50) src = net_best_default;
		else if (rtt >= 51 && rtt <= 150) src = net_better_default;
		else if (rtt >= 151 && rtt <= 300) src = net_good_default;
		else if (rtt > 300) src = net_bare_default;
		else src = net_none_default;
		setNetImgUrl(() => src);
	}, [networkStatus]);
	(0, import_react.useEffect)(() => {
		const timer = setInterval(() => {
			setLocalTime(formatLocalTime(/* @__PURE__ */ new Date()));
		}, 1e3);
		return () => clearInterval(timer);
	}, []);
	return isShow && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: NetworkStatus_module_default.kioskNetworkStatus,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			className: NetworkStatus_module_default.netImg,
			src: netImgUrl,
			alt: "system network status"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
			className: NetworkStatus_module_default.localTime,
			children: localTime
		})]
	});
};
function mapStateToProps$2(state) {
	return { sysCookie: state.sysCookie };
}
var NetworkStatus_default = connect(mapStateToProps$2)(NetworkStatus);
var MobyStatus_module_default = {
	kioskMobyStatus: "kioskMobyStatus___Yu7Mw",
	linkImg: "linkImg___lMn2x"
};
//#endregion
//#region source-snapshot/src/assets/images/mobyOff.png
var mobyOff_default = "data:image/png;base64,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";
//#endregion
//#region source-snapshot/src/assets/images/mobyOn.png
var mobyOn_default = "data:image/png;base64,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";
//#endregion
//#region source-snapshot/src/component/MobyStatus/index.jsx
var MobyStatus = (props) => {
	const { sysCookie: { mobyDeviceLinkStatus } } = props;
	const [isShow, setIsShow] = (0, import_react.useState)(false);
	const [linkImgUrl, setNetImgUrl] = (0, import_react.useState)(mobyOff_default);
	(0, import_react.useEffect)(() => {
		if (getCookie("serviceTarget") === "INGENICO" && window.self === window.top) if (mobyDeviceLinkStatus === null || mobyDeviceLinkStatus === -1) setIsShow(false);
		else if (mobyDeviceLinkStatus === 1) {
			setNetImgUrl(mobyOn_default);
			setIsShow(true);
		} else if (mobyDeviceLinkStatus === 0) {
			setNetImgUrl(mobyOff_default);
			setIsShow(true);
		} else setIsShow(false);
		else setIsShow(false);
	}, [mobyDeviceLinkStatus, getCookie("serviceTarget")]);
	return isShow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		id: MobyStatus_module_default.kioskMobyStatus,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			className: MobyStatus_module_default.linkImg,
			src: linkImgUrl,
			alt: "moby status"
		})
	});
};
function mapStateToProps$1(state) {
	return { sysCookie: state.sysCookie };
}
var MobyStatus_default = connect(mapStateToProps$1)(MobyStatus);
var MobyBattery_module_default = {
	kioskMobyBattery: "kioskMobyBattery___qfcPP",
	linkImg: "linkImg___gRXRM",
	batteryTxt: "batteryTxt___cj3cf"
};
//#endregion
//#region source-snapshot/src/assets/images/battery1.png
var battery1_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAHlBMVEUAAAAAAAAAAACBJB7yQjUAAAAAAAAAAAAAAABaGBK5CtFiAAAACnRSTlNMADB5YBMNQztWGqMrdgAAAFFJREFUKM9jEASCdAYgKAOxwFwFEJeJGG5qaGgDmBsaGibIkM6ABMoYCpC5HAyEALsSFBQwwG0A2zfKHY5cThcomADhGkMBA0HQgJqukpC5bQCMDiP9CJ2pNQAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/assets/images/battery5.png
var battery5_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAIVBMVEUAAAAAAAAAAAAAAAD1QjeBJB4AAACiLSSMJh5BEg/0QzaX+97nAAAACnRSTlNMADAQn3k/j29duFn4tgAAAFdJREFUKM9jEAQCAwYgSAaxwFwFEJeJGK6xsXECmAtkCDKYMSCBZIYEZC4bAyHApgQFCQxwG8D2jXKHBZfDBQoawFz2VVBQAOZyhkLBBELpBD1dGaGkOgBdrCiG6wV7JwAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/assets/images/battery10.png
var battery10_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAIVBMVEUAAAAAAAAAAAAAAACBJB7yQjUAAACiLSRBEg9gGhP0QzYrHYTjAAAACnRSTlNMADAQeWA/j11QhnXdFgAAAFhJREFUKM9jEAQCAwYgSAaxwFwFEJeJGK6xsXECmAtkCDKYMSCBZIYEZC4bAyHApgQFCQxwG8D2jXKHCJczFAomgLnsq6CggAguhwsUNBBKJ+jpyggl1QEA7K8ywPoIXbkAAAAASUVORK5CYII=";
//#endregion
//#region source-snapshot/src/assets/images/battery20.png
var battery20_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAIVBMVEUAAAAAAAAAAACBJB6iLSQAAAAAAAAAAAAAAABQFxL0QzZhMlkyAAAACnRSTlNMADB5jxMNQztjqwJGAgAAAFNJREFUKM9jEASCdAYgKAOxwFwFEJeJGG5qaGgDmBsaGibIkM6ABMoYCpC5HAyEALsSFBQwwG0A2zfKHTguyyoocKAxl9MYChgIggbUdJWEzG0DAAMsRFTGkahOAAAAAElFTkSuQmCC";
//#endregion
//#region source-snapshot/src/assets/images/battery30.png
var battery30_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAIVBMVEUAAAAAAAAAAACregAAAAD/tQCHYQAAAACTZwBCLgD/tgCEd85YAAAACnRSTlNMADCPEJ95P29dkoqT4AAAAFhJREFUKM9jEAQCBwYgKAGxwFwFEJeJGK6Li0sBmAtkCDK4MyCBEoYCZC47AyHArgQFBQxwG8D2jXIp43KEQkEDmMu8CgoMBhOXMw0KJhBKJ+jpygkl1QEA/B1WAA7Pl0gAAAAASUVORK5CYII=";
//#endregion
//#region source-snapshot/src/assets/images/battery40.png
var battery40_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAJFBMVEUAAAAAAAAAAACregCHYQD/swAIBQAAAAAAAABbQAAvIAD/tgDdAkzlAAAAC3RSTlNMADCPeUA/Ew1ZV2i7g9gAAABYSURBVCjPYxAEggYGIMgAscBcBRCXiRhue3l5AphbXl4hyNDGgAQyGBKQuWwMhACbEhQkMMBtANs3ygUGTigUTABzmXdDgcFw4XK6QMECQukEPV01oaQ6AL46cX2uUi+JAAAAAElFTkSuQmCC";
//#endregion
//#region source-snapshot/src/assets/images/battery50.png
var battery50_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAJ1BMVEUAAAAAAAAAAACrewCreQCHYQD/swAAAAAAAAAAAAAPCgBNNgD/tgALXrSbAAAADHRSTlNMADCPj3lAE0INOlnOz34NAAAAWklEQVQoz2MQBIIZDEDQCWKBuQogLhMx3Onl5QvA3PLySkEGoDEI0MnQgMzlYiAEOJSgoIEBbgPYvmHK5UqDgg1gLvMZKHAYkVzuUCjYQDChLEBJNQyzkLkrATEjjpwNErjOAAAAAElFTkSuQmCC";
//#endregion
//#region source-snapshot/src/assets/images/battery60.png
var battery60_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAFVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAASAQCkAAAAB3RSTlNMADAmET4KTkOGFQAAAEtJREFUKM9jEAQCBwYgCAGxwFwFEJeJGK6Li0sAmAtkCDK4MiCBEIYAZC4rAyHAqgQFAQxwG8D2DR0uqzEUBDCMAloB9HSVhMwNAwDuVBJsSIwVSgAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/assets/images/battery70.png
var battery70_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAD1BMVEUAAAAAAAAAAAAAAAAAAABPDueNAAAABXRSTlNMADAQP4enaQUAAABFSURBVCjPYxAEAgMGIHAGscBcBRCXiRiusbGxA5gLZAgymDAgAWcGB2QuCwMhwKIEBQ4McBvA9g0YdxQMSoCWroxQUh0AqJINUmpdHTsAAAAASUVORK5CYII=";
//#endregion
//#region source-snapshot/src/assets/images/battery80.png
var battery80_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABnRSTlNMADAQQTer7k0cAAAASUlEQVQoz2MQBAIDBiBwBrHAXAUQl4kYrrGxcQCIywpkCDKYMCABZwYHZC4LAyHAogQFDgxwG8D2kcRFN2oUDDsQgJquTJG5wQBXGwuKtYo9wgAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/assets/images/battery90.png
var battery90_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAFVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAASAQCkAAAAB3RSTlNMADAmET4KTkOGFQAAAEpJREFUKM9jEAQCBwYgCAGxwFwFEJeJGK6Li0sAmAtkCDK4MiCBEIYAZC4rAyHAqgQFAQxwG6D2YXJZjaEggGEUjDCAlq6SkLlhAAP+C8hvtHZBAAAAAElFTkSuQmCC";
//#endregion
//#region source-snapshot/src/assets/images/battery100.png
var battery100_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAG1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUUeIgAAAACXRSTlNMABNGMCYfOg415lvHAAAAR0lEQVQoz2MQBIJmBiCwALHAXAcQl4UYroSSUgGYq6SkKMggasCAAIEMAQxIgJXBAJnLzDAKRgFxAD3lJCBz2RjEChA89kQALusHpISOyEUAAAAASUVORK5CYII=";
//#endregion
//#region source-snapshot/src/assets/images/batteryNull.png
var batteryNull_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAwBAMAAADwTQfqAAAAIVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt0UjBAAAAC3RSTlNMADETJkc4HgtBBPvJf6sAAAC+SURBVCjPtdKxC4JAFMfxh+mJ44+Ewsn8C4rbmmxqdYhodMldEFpzcHdsdevP7Lykd4+WCPwu8vHQd8oRTB2ZHjBZpiO9X/jUurTUeg+KC+IOlJOTT4XLgGbufGxK1mkA1p/9RC1g3E+8wNZNrLG8qhrxtFHAPBciKSw9JL25OSC1VLdmvLQjuUHQB8R/QewoBHJWsBOLC7FIG158D707iiCGBlXFQ7/ysqyUc7b/UvGrZkt8SSTPVUirnqXqFyB3HGCTrntTAAAAAElFTkSuQmCC";
//#endregion
//#region source-snapshot/src/component/MobyBattery/index.jsx
var MobyBattery = (props) => {
	const { sysCookie: { mobyDeviceInfo, mobyDeviceLinkStatus } } = props;
	const batteryLevel = mobyDeviceInfo?.batteryLevel ?? mobyDeviceInfo?.status?.battery?.level ?? null;
	const [isShow, setIsShow] = (0, import_react.useState)(false);
	const [linkImgUrl, setNetImgUrl] = (0, import_react.useState)(batteryNull_default);
	const batteryLevelMap = {
		4: battery1_default,
		9: battery5_default,
		19: battery10_default,
		29: battery20_default,
		39: battery30_default,
		49: battery40_default,
		59: battery50_default,
		69: battery60_default,
		79: battery70_default,
		89: battery80_default,
		99: battery90_default,
		100: battery100_default
	};
	(0, import_react.useEffect)(() => {
		if (getCookie("serviceTarget") === "INGENICO" && window.self === window.top && mobyDeviceLinkStatus === 1) {
			setIsShow(true);
			if (batteryLevel === null) {
				setNetImgUrl(batteryNull_default);
				return;
			}
			const levelForIcon = batteryLevel === 0 ? 4 : batteryLevel;
			for (const threshold of Object.keys(batteryLevelMap).map(Number).sort((a, b) => a - b)) if (levelForIcon <= threshold) {
				setNetImgUrl(batteryLevelMap[threshold]);
				break;
			}
		} else setIsShow(false);
	}, [
		batteryLevel,
		mobyDeviceLinkStatus,
		getCookie("serviceTarget")
	]);
	return isShow && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: MobyBattery_module_default.kioskMobyBattery,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			className: MobyBattery_module_default.linkImg,
			src: linkImgUrl,
			alt: "moby battery"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: MobyBattery_module_default.batteryTxt,
			children: [batteryLevel !== null ? batteryLevel : "--", "%"]
		})]
	});
};
function mapStateToProps(state) {
	return { sysCookie: state.sysCookie };
}
var MobyBattery_default = connect(mapStateToProps)(MobyBattery);
//#endregion
export { LangSwitch_default as i, MobyStatus_default as n, NetworkStatus_default as r, MobyBattery_default as t };
