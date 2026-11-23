import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { t as getDeviceDirection } from "./getDeviceDirection-BKza3HeE.js";
import { t as process_default } from "./process-Cqmrsqte.js";
import { t as LottiePlayer } from "./LottiePlayer-CG-ciSfh.js";
//#region source-snapshot/src/component/rotateLoading/index.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var RotateLoading = () => {
	const [direction, setDirection] = (0, import_react.useState)(getDeviceDirection());
	(0, import_react.useEffect)(() => {
		const handleResize = () => {
			setDirection(getDeviceDirection());
		};
		window.addEventListener("resize", handleResize);
		window.addEventListener("orientationchange", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("orientationchange", handleResize);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LottiePlayer, {
		animationData: process_default,
		width: direction === "vertical" ? "50%" : "30%",
		speed: .5
	});
};
//#endregion
export { RotateLoading as t };
