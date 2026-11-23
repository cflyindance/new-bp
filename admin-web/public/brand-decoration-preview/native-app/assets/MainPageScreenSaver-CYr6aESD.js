import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { C as getMarginappFetchConfig, G as require_dayjs_min, r as getCookie, t as compare } from "./utils-Cdx9DbDR.js";
import { da as require_cloneDeep } from "./actions-BwRPwnFF.js";
import { o as fetchEffectiveScreen } from "./kioskConfigApi-68IKDHob.js";
import { t as getDeviceDirection } from "./getDeviceDirection-BKza3HeE.js";
import { t as selfConfigList } from "./selfConfig-DGGo01Xu.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as IMG_HOST } from "./getImageHost-CiGAQi_-.js";
import { t as waitingInfo_default } from "./waitingInfo-s8_Ks5BC.js";
//#region source-snapshot/src/assets/images/screen-v.png
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min());
var screen_v_default = "" + new URL("screen-v-BM3ker8s.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/assets/images/screen-h.png
var screen_h_default = "" + new URL("screen-h-BwcLyFqO.png", import.meta.url).href;
var mainPage_module_default = {
	brandStyle: "brandStyle___oVbZk",
	mainPageContainer: "mainPageContainer___ZGjQt",
	showDebug: "showDebug___CUjmT",
	horizontal: "horizontal___vnNVk",
	mainBg: "mainBg___GcWFm",
	mainBox: "mainBox___9tmFx",
	mainLogo: "mainLogo___9fXcN",
	logoBox: "logoBox___2CBSp",
	logo: "logo___1OfjH",
	mainLogo_1: "mainLogo_1___QWmnI",
	mainBtn: "mainBtn___o-Wg-",
	bottomText: "bottomText___H2OLL",
	vertical: "vertical___6KOXV",
	btnsBox: "btnsBox___tgVz6",
	btnCount_1: "btnCount_1___OIfrK",
	orderingBtn: "orderingBtn___jUzMM",
	waitLst: "waitLst___joqc3",
	btnCount_2: "btnCount_2___Xw8-r",
	togo: "togo___spBB9",
	languageBtn: "languageBtn___tHvAV",
	btnCount_3: "btnCount_3___u7ZC2",
	refreshText: "refreshText___7jI8-",
	mainName: "mainName___wLUYw",
	languageIcon: "languageIcon___UWuLC",
	errorlicense: "errorlicense___EjfVI",
	text: "text___OLO1y",
	licenseSelectBx: "licenseSelectBx___03Adr",
	licenseSelectionBx: "licenseSelectionBx___p4oeo",
	enterLicenseBox: "enterLicenseBox___FUVJ5",
	enterLicenseIcon: "enterLicenseIcon___5Te8b",
	licenseSelectBxInner: "licenseSelectBxInner___ukagY",
	enterLicense: "enterLicense___6DH2o",
	licenseInputBx: "licenseInputBx___U9-F8",
	licenseInput: "licenseInput___Q8c1I",
	licenseNext: "licenseNext___fnSxg",
	licenseListBx: "licenseListBx___IV0KH",
	selectLicenseBx: "selectLicenseBx___Xm2Hg",
	licenseNextBtn: "licenseNextBtn___3tkvp",
	actionBx: "actionBx___g0Dgz",
	cancelBtn: "cancelBtn___WuzP3",
	okBtn: "okBtn___YA7oj",
	popupConfirmBtn: "popupConfirmBtn___WA68r",
	screenSaver: "screenSaver___SYhfC",
	containerBox: "containerBox___7Y45L",
	itemBox: "itemBox___IGYuh",
	itemName: "itemName___f8M00",
	subItemName: "subItemName___SXjo2"
};
//#endregion
//#region source-snapshot/src/container/mainPage/components/mapEffectiveScreenLayout.js
/**
* 将配置中心「当前生效屏保」接口数据映射为 Kiosk 本地屏保结构（与 selfConfig id:35 一致）
* @see https://s.apifox.cn/087bfa37-200f-4ff8-8f56-b9a1f1a695b8/446768254e0.md
*/
var emptyOrientation = () => ({
	type: "image",
	imageList: [],
	videoList: []
});
var orientationHasContent = (o) => !!(o && Array.isArray(o.fileUrls) && o.fileUrls.some(Boolean));
var cloudLayoutHasContent = (layout) => {
	if (!layout) return false;
	return orientationHasContent(layout.horizontal) || orientationHasContent(layout.vertical);
};
var mapImageTransitionEffect = (effect) => {
	if (!effect || typeof effect !== "string") return "fade";
	return {
		SLIDE: "slide",
		FADE: "fade",
		ZOOM: "zoom",
		ROTATE: "rotate",
		BOUNCE: "bounce",
		FLIP: "flip"
	}[effect.toUpperCase()] || "fade";
};
var mapOrientation = (o) => {
	if (!orientationHasContent(o)) return emptyOrientation();
	const urls = o.fileUrls.filter(Boolean);
	if (String(o.mediaType || "").toUpperCase() === "VIDEO") {
		const videoList = urls.map((url) => ({ url }));
		return {
			type: "video",
			imageList: [],
			videoList,
			videoUrl: videoList[0]?.url
		};
	}
	return {
		type: "image",
		imageList: urls.map((url) => ({
			url,
			default: /^https?:\/\//i.test(url)
		})),
		videoList: []
	};
};
/**
* @param {object} layout ScreenSaverLayoutConfigResponse
* @returns {object|null} 与 margin id:35 value 同构；无有效素材时返回 null
*/
function mapCloudLayoutToScreenSaverValue(layout) {
	if (!cloudLayoutHasContent(layout)) return null;
	const delayTime = layout.stayTimeSeconds != null ? layout.stayTimeSeconds : 60;
	const swiperTime = layout.transitionSpeedSeconds != null ? layout.transitionSpeedSeconds : 3;
	return {
		status: true,
		showHomePage: true,
		delayTime,
		imageAnimation: mapImageTransitionEffect(layout.imageTransitionEffect),
		swiperTime,
		horizontalData: mapOrientation(layout.horizontal),
		verticalityData: mapOrientation(layout.vertical)
	};
}
//#endregion
//#region source-snapshot/src/utils/screenSaverConfig.js
/** 屏保 id:35 数据来源（与 margin 配置一致） */
var SCREENSAVER_DATA_SOURCE = {
	LOCAL: "local",
	CLOUD: "cloud"
};
function isOrientationMediaEmpty(orientationData) {
	if (!orientationData) return true;
	const imgs = orientationData.imageList || [];
	const vids = orientationData.videoList || [];
	const hasImg = imgs.some((i) => i?.url && String(i.url).trim());
	const hasVid = vids.some((v) => v?.url && String(v.url).trim());
	return !hasImg && !hasVid;
}
/** 横竖屏均未配置图片/视频素材 */
function bothOrientationsMediaEmpty(value) {
	return isOrientationMediaEmpty(value?.horizontalData) && isOrientationMediaEmpty(value?.verticalityData);
}
/**
* 未存过 dataSource 时：无横竖屏素材 → 云端，否则 → 本地
*/
function normalizeScreenSaverDataSource(screenData, changeDirectionData = false) {
	if (!screenData || typeof screenData !== "object") return screenData;
	const ds = screenData.dataSource;
	if (ds === SCREENSAVER_DATA_SOURCE.CLOUD) {
		if (changeDirectionData) return {
			...screenData,
			horizontalData: screenData.verticalityData,
			verticalityData: screenData.horizontalData
		};
		return screenData;
	}
	if (ds === SCREENSAVER_DATA_SOURCE.LOCAL) {
		if (changeDirectionData) return {
			...screenData,
			horizontalData: screenData.verticalityData,
			verticalityData: screenData.horizontalData
		};
		return screenData;
	}
	const migratedScreenData = changeDirectionData ? {
		...screenData,
		horizontalData: screenData.verticalityData,
		verticalityData: screenData.horizontalData
	} : { ...screenData };
	return {
		...migratedScreenData,
		dataSource: bothOrientationsMediaEmpty(migratedScreenData) ? SCREENSAVER_DATA_SOURCE.CLOUD : SCREENSAVER_DATA_SOURCE.LOCAL
	};
}
//#endregion
//#region source-snapshot/src/container/mainPage/components/screenSaverImageTransition.js
var ACTIVE_TRANSFORMS = {
	zoom: "scale(1)",
	rotate: "rotate(0deg)",
	bounce: "translateY(0)",
	flip: "scaleX(1)"
};
var INACTIVE_TRANSFORMS = {
	zoom: "scale(0.8)",
	rotate: "rotate(180deg)",
	bounce: "translateY(20px)",
	flip: "scaleX(-1)"
};
var getScreenSaverImageTransitionStyle = ({ effect, index, currentIndex, imageCount }) => {
	const isActive = currentIndex === index;
	if (effect === "slide") {
		const isPrevious = index === (imageCount > 1 ? (currentIndex - 1 + imageCount) % imageCount : -1);
		return {
			opacity: 1,
			transform: isActive ? "translateX(0)" : isPrevious ? "translateX(-100%)" : "translateX(100%)",
			zIndex: isActive || isPrevious ? 1 : 0
		};
	}
	return {
		opacity: isActive ? 1 : 0,
		transform: isActive ? ACTIVE_TRANSFORMS[effect] || "none" : INACTIVE_TRANSFORMS[effect] || "none",
		zIndex: isActive ? 1 : 0
	};
};
//#endregion
//#region source-snapshot/src/container/mainPage/components/screenSaverMediaWindow.js
var normalizeIndex = (index, count) => count > 0 ? ((Number(index) || 0) % count + count) % count : 0;
var getScreenSaverPreloadIndexes = (count, currentIndex) => {
	if (count <= 0) return [];
	const current = normalizeIndex(currentIndex, count);
	return [.../* @__PURE__ */ new Set([current, (current + 1) % count])];
};
var getScreenSaverRenderIndexes = (count, currentIndex) => {
	if (count <= 0) return [];
	const current = normalizeIndex(currentIndex, count);
	return [.../* @__PURE__ */ new Set([
		(current - 1 + count) % count,
		current,
		(current + 1) % count
	])];
};
var getNextAvailableScreenSaverIndex = ({ count, currentIndex, failedIndexes }) => {
	if (count <= 0) return null;
	const current = normalizeIndex(currentIndex, count);
	for (let offset = 1; offset <= count; offset += 1) {
		const candidate = (current + offset) % count;
		if (!failedIndexes?.has(candidate)) return candidate;
	}
	return null;
};
//#endregion
//#region source-snapshot/src/container/mainPage/components/MainPageScreenSaver.jsx
var import_jsx_runtime = require_jsx_runtime();
var SCREENSAVERSTATUS = {
	READING: -1,
	TIMING: 0,
	DISPLAY: 1
};
/** 云屏保 effective-layout 超过此时长未响应则改用本地 margin id:35 */
var EFFECTIVE_SCREEN_FETCH_TIMEOUT_MS = 1e3 * 10;
var PRELOAD_IMAGE_TIMEOUT_MS = 8e3;
var PRELOAD_VIDEO_TIMEOUT_MS = 8e3;
var syncStatusRef = (ref, status) => {
	ref.current = status;
};
var resolveImageSrc = (item) => {
	if (!item?.url) return "";
	if (item.default || /^https?:\/\//i.test(item.url)) return item.url;
	return `${IMG_HOST}/${item.url}`;
};
var resolveVideoSrc = (videoUrl) => {
	if (!videoUrl) return "";
	if (/^https?:\/\//i.test(videoUrl)) return videoUrl;
	return `${IMG_HOST}/${videoUrl}`;
};
var imagePreloadCache = /* @__PURE__ */ new Map();
var videoPreloadCache = /* @__PURE__ */ new Map();
var preloadImage = (src) => {
	if (imagePreloadCache.has(src)) return imagePreloadCache.get(src);
	const promise = new Promise((resolve) => {
		if (!src) {
			resolve({
				ok: false,
				src
			});
			return;
		}
		const img = new Image();
		const finish = (ok) => {
			clearTimeout(timer);
			img.onload = null;
			img.onerror = null;
			if (!ok) img.removeAttribute("src");
			resolve({
				ok,
				src
			});
		};
		const timer = setTimeout(() => finish(false), PRELOAD_IMAGE_TIMEOUT_MS);
		img.onload = () => finish(true);
		img.onerror = () => finish(false);
		img.src = src;
	});
	imagePreloadCache.set(src, promise);
	promise.then((result) => {
		if (!result.ok) imagePreloadCache.delete(src);
	});
	return promise;
};
var preloadVideo = (src) => {
	if (videoPreloadCache.has(src)) return videoPreloadCache.get(src);
	const promise = new Promise((resolve) => {
		if (!src) {
			resolve({
				ok: false,
				src
			});
			return;
		}
		const v = document.createElement("video");
		v.preload = "auto";
		v.muted = true;
		v.playsInline = true;
		let done = false;
		const finish = (ok) => {
			if (done) return;
			done = true;
			v.removeEventListener("canplaythrough", onReady);
			v.removeEventListener("loadeddata", onReady);
			v.removeEventListener("error", onError);
			v.removeAttribute("src");
			try {
				v.load();
			} catch (_) {}
			resolve({
				ok,
				src
			});
		};
		const timer = setTimeout(() => finish(false), PRELOAD_VIDEO_TIMEOUT_MS);
		const onReady = () => {
			clearTimeout(timer);
			finish(true);
		};
		const onError = () => {
			clearTimeout(timer);
			finish(false);
		};
		v.addEventListener("canplaythrough", onReady);
		v.addEventListener("loadeddata", onReady);
		v.addEventListener("error", onError);
		v.src = src;
		v.load();
	});
	videoPreloadCache.set(src, promise);
	promise.then((result) => {
		if (!result.ok) videoPreloadCache.delete(src);
	});
	return promise;
};
var createDefaultImageScreenSaverData = (sourceData) => {
	const next = (0, import_cloneDeep.default)(sourceData || {});
	const defaultImage = getDeviceDirection() === "vertical" ? screen_v_default : screen_h_default;
	next.data = {
		...next.data || {},
		type: "image",
		imageList: [{
			default: true,
			url: defaultImage
		}],
		videoList: [],
		videoUrl: ""
	};
	return next;
};
var ensureScreenSaverDataRenderable = async (sourceData) => {
	const next = (0, import_cloneDeep.default)(sourceData || {});
	const data = next?.data || {};
	if (data.type === "image") {
		if (!(Array.isArray(data.imageList) ? data.imageList : []).length) return createDefaultImageScreenSaverData(next);
		return next;
	}
	if (data.type === "video") {
		if (!(await preloadVideo(resolveVideoSrc(data.videoUrl || data.videoList?.[0]?.url))).ok) return createDefaultImageScreenSaverData(next);
		return next;
	}
	return createDefaultImageScreenSaverData(next);
};
/** 屏保展示前只预加载当前与下一份素材，避免一次性占用过多内存和解码资源 */
var preloadScreenSaverMedia = async (screenSaverData, currentIndex = 0) => {
	const data = screenSaverData?.data;
	if (!data) return;
	if (data.type === "image" && Array.isArray(data.imageList) && data.imageList.length > 0) {
		const indexes = getScreenSaverPreloadIndexes(data.imageList.length, currentIndex);
		return Promise.all(indexes.map(async (index) => ({
			index,
			...await preloadImage(resolveImageSrc(data.imageList[index]))
		})));
	}
	if (data.type === "video" && data.videoUrl && String(data.videoUrl).length > 0) await preloadVideo(resolveVideoSrc(data.videoUrl));
};
var MainPageScreenSaver = (0, import_react.forwardRef)(function MainPageScreenSaver({ merchantId, toggleKioskLicense, setShowScreensaver, onStartOrder, onSaveConfig, onMetaChange, onScreenSaverLoadStarted, onScreenSaverLoadSettled, bottomText }, ref) {
	const [screenSaverData, setScreenSaverData] = (0, import_react.useState)({});
	const [screenCurrentIndex, setScreenCurrentIndex] = (0, import_react.useState)(0);
	const [screenSaverStatus, setScreenSaverStatus] = (0, import_react.useState)(SCREENSAVERSTATUS.READING);
	const [vedioLoading, setVedioLoading] = (0, import_react.useState)(false);
	const screenSaverStatusRef = (0, import_react.useRef)(SCREENSAVERSTATUS.READING);
	const screenSaverDataRef = (0, import_react.useRef)({});
	const screenCurrentIndexRef = (0, import_react.useRef)(0);
	const screenSaverTimerRef = (0, import_react.useRef)(null);
	const screenImageintervalRef = (0, import_react.useRef)(null);
	const handScreenSaverRef = (0, import_react.useRef)(() => {});
	const loadLocalScreenSaverGenRef = (0, import_react.useRef)(0);
	const skipFirstMerchantEffectRef = (0, import_react.useRef)(true);
	const failedImageIndexesRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	(0, import_react.useEffect)(() => {
		screenSaverDataRef.current = screenSaverData;
	}, [screenSaverData]);
	(0, import_react.useEffect)(() => {
		screenCurrentIndexRef.current = screenCurrentIndex;
	}, [screenCurrentIndex]);
	(0, import_react.useEffect)(() => {
		onMetaChange?.({
			screenSaverData,
			screenSaverStatus
		});
	}, [
		screenSaverData,
		screenSaverStatus,
		onMetaChange
	]);
	const clearScreenTimers = (0, import_react.useCallback)(() => {
		if (screenSaverTimerRef.current !== null) {
			clearTimeout(screenSaverTimerRef.current);
			screenSaverTimerRef.current = null;
		}
		if (screenImageintervalRef.current !== null) {
			clearInterval(screenImageintervalRef.current);
			screenImageintervalRef.current = null;
		}
	}, []);
	const setupImageAutoSwitch = (0, import_react.useCallback)((nextData) => {
		if (screenImageintervalRef.current !== null) {
			clearInterval(screenImageintervalRef.current);
			screenImageintervalRef.current = null;
		}
		if ((nextData?.data?.imageList || []).length <= 1) return;
		const swiperTime = Number(nextData?.swiperTime) || 3;
		screenImageintervalRef.current = setInterval(() => {
			setScreenCurrentIndex((prev) => {
				const currentImageList = screenSaverDataRef.current?.data?.imageList || [];
				if (currentImageList.length === 0) return prev;
				const currentIndex = Math.max(0, Math.min(prev || 0, currentImageList.length - 1));
				return getNextAvailableScreenSaverIndex({
					count: currentImageList.length,
					currentIndex,
					failedIndexes: failedImageIndexesRef.current
				}) ?? prev;
			});
		}, swiperTime * 1e3);
	}, []);
	const handleImageFailure = (0, import_react.useCallback)((sourceData, index) => {
		if (sourceData !== screenSaverDataRef.current) return;
		const imageList = sourceData?.data?.imageList || [];
		const src = resolveImageSrc(imageList[index]);
		if (src === "" + new URL("screen-v-BM3ker8s.png", import.meta.url).href || src === "" + new URL("screen-h-BwcLyFqO.png", import.meta.url).href) return;
		failedImageIndexesRef.current.add(index);
		const currentIndex = screenCurrentIndexRef.current;
		if (!failedImageIndexesRef.current.has(currentIndex)) return;
		const nextIndex = getNextAvailableScreenSaverIndex({
			count: imageList.length,
			currentIndex,
			failedIndexes: failedImageIndexesRef.current
		});
		if (nextIndex !== null) {
			screenCurrentIndexRef.current = nextIndex;
			setScreenCurrentIndex(nextIndex);
			return;
		}
		const fallbackData = createDefaultImageScreenSaverData(sourceData);
		failedImageIndexesRef.current.clear();
		screenSaverDataRef.current = fallbackData;
		screenCurrentIndexRef.current = 0;
		setScreenSaverData(fallbackData);
		setScreenCurrentIndex(0);
		setupImageAutoSwitch(fallbackData);
	}, [setupImageAutoSwitch]);
	const dealScreenSaverData = (0, import_react.useCallback)(() => {
		const data = screenSaverDataRef.current;
		const status = screenSaverStatusRef.current;
		if (!Object.prototype.hasOwnProperty.call(data, "delayTime") || !Object.prototype.hasOwnProperty.call(data, "status") || !data.status || status === SCREENSAVERSTATUS.TIMING || status === SCREENSAVERSTATUS.DISPLAY) return;
		syncStatusRef(screenSaverStatusRef, SCREENSAVERSTATUS.TIMING);
		setScreenSaverStatus(SCREENSAVERSTATUS.TIMING);
		setVedioLoading(true);
		setShowScreensaver(false);
		if (screenSaverTimerRef.current !== null) {
			clearTimeout(screenSaverTimerRef.current);
			screenSaverTimerRef.current = null;
		}
		screenSaverTimerRef.current = setTimeout(() => {
			(async () => {
				const currentScreenSaverData = screenSaverDataRef.current;
				let displayScreenSaverData = currentScreenSaverData;
				try {
					displayScreenSaverData = await ensureScreenSaverDataRenderable(currentScreenSaverData);
				} catch (_) {
					displayScreenSaverData = createDefaultImageScreenSaverData(currentScreenSaverData);
				}
				screenSaverDataRef.current = displayScreenSaverData;
				setScreenSaverData(displayScreenSaverData);
				const imageList = displayScreenSaverData?.data?.imageList || [];
				const validIndex = imageList.length > 0 ? Math.max(0, Math.min(screenCurrentIndexRef.current || 0, imageList.length - 1)) : 0;
				syncStatusRef(screenSaverStatusRef, SCREENSAVERSTATUS.DISPLAY);
				setScreenSaverStatus(SCREENSAVERSTATUS.DISPLAY);
				setScreenCurrentIndex(validIndex);
				setShowScreensaver(true);
				if (imageList.length > 0) setupImageAutoSwitch(displayScreenSaverData);
			})();
		}, data.delayTime * 1e3);
	}, [setShowScreensaver, setupImageAutoSwitch]);
	const commitScreenSaverData = (0, import_react.useCallback)((raw) => {
		const nextScreenSaverData = (0, import_cloneDeep.default)(raw);
		const direction = getDeviceDirection();
		direction === "vertical" ? nextScreenSaverData.data = nextScreenSaverData.verticalityData : nextScreenSaverData.data = nextScreenSaverData.horizontalData;
		if (nextScreenSaverData.data.type === "image" && nextScreenSaverData.data.imageList.length === 0) if (direction === "vertical") nextScreenSaverData.data.imageList = [{
			default: true,
			url: screen_v_default
		}];
		else nextScreenSaverData.data.imageList = [{
			default: true,
			url: screen_h_default
		}];
		if (nextScreenSaverData.data.videoList && Array.isArray(nextScreenSaverData.data.videoList) && nextScreenSaverData.data.videoList.length > 0) nextScreenSaverData.data.videoUrl = nextScreenSaverData.data.videoList[0].url;
		if (nextScreenSaverData.data.type === "video" && !nextScreenSaverData.data.videoUrl) nextScreenSaverData.data = createDefaultImageScreenSaverData(nextScreenSaverData).data;
		delete nextScreenSaverData.horizontalData;
		delete nextScreenSaverData.verticalityData;
		const prevVideoUrl = screenSaverStatusRef.current === SCREENSAVERSTATUS.DISPLAY ? screenSaverDataRef.current?.data?.videoUrl : void 0;
		screenSaverDataRef.current = nextScreenSaverData;
		failedImageIndexesRef.current.clear();
		setScreenSaverData(nextScreenSaverData);
		setScreenCurrentIndex(0);
		if (!nextScreenSaverData.status) {
			clearScreenTimers();
			syncStatusRef(screenSaverStatusRef, SCREENSAVERSTATUS.READING);
			setScreenSaverStatus(SCREENSAVERSTATUS.READING);
			setShowScreensaver(false);
			return;
		}
		if (screenSaverStatusRef.current === SCREENSAVERSTATUS.DISPLAY) {
			const data = nextScreenSaverData?.data || {};
			if (data.type === "image") {
				setVedioLoading(false);
				setScreenCurrentIndex(0);
				setupImageAutoSwitch(nextScreenSaverData);
			} else {
				if (screenImageintervalRef.current !== null) {
					clearInterval(screenImageintervalRef.current);
					screenImageintervalRef.current = null;
				}
				const nextVideoUrl = data.videoUrl || "";
				const videoUrlChanged = resolveVideoSrc(prevVideoUrl || "") !== resolveVideoSrc(nextVideoUrl);
				setVedioLoading(videoUrlChanged);
			}
			return;
		}
		dealScreenSaverData();
	}, [
		dealScreenSaverData,
		clearScreenTimers,
		setShowScreensaver,
		setupImageAutoSwitch
	]);
	const loadLocalScreenSaver = (0, import_react.useCallback)((opts) => {
		if (!opts?.continuation) loadLocalScreenSaverGenRef.current += 1;
		const gen = loadLocalScreenSaverGenRef.current;
		const settled = () => {
			if (gen !== loadLocalScreenSaverGenRef.current) return;
			onScreenSaverLoadSettled?.();
		};
		getMarginappFetchConfig().then(async (res) => {
			if (!res.data.result.successful) {
				settled();
				return;
			}
			let obj = res.data.marginAppConfigTypes.find((l) => l.product == "KIOSKLITE");
			if (!obj || !obj.data) {
				settled();
				return;
			}
			let arr = JSON.parse(obj.data);
			if (!arr.configList) {
				settled();
				return;
			}
			let screenDataIndex = arr.configList.findIndex((item) => item.id === 35);
			if (screenDataIndex < 0) {
				let screen = selfConfigList.configList.find((c) => c.id == 35);
				arr.configList.push(screen);
				arr.configList.sort(compare("id"));
				onSaveConfig((0, import_cloneDeep.default)(arr));
				handScreenSaverRef.current({ continuation: true });
				return;
			}
			let nextScreenSaverData = normalizeScreenSaverDataSource((0, import_cloneDeep.default)(arr.configList[screenDataIndex].value), true);
			if (!nextScreenSaverData.status) {
				commitScreenSaverData(nextScreenSaverData);
				settled();
				return;
			}
			const notifyBootstrapStartedIfNeeded = () => {
				if (opts?.skipBootstrapLoading) return;
				if (!nextScreenSaverData.status) return;
				onScreenSaverLoadStarted?.();
			};
			if (nextScreenSaverData.dataSource === SCREENSAVER_DATA_SOURCE.LOCAL) {
				notifyBootstrapStartedIfNeeded();
				commitScreenSaverData(nextScreenSaverData);
				settled();
				return;
			}
			if (nextScreenSaverData.dataSource === SCREENSAVER_DATA_SOURCE.CLOUD && merchantId) {
				notifyBootstrapStartedIfNeeded();
				try {
					settled();
					const layout = (await Promise.race([fetchEffectiveScreen({
						merchantId: String(merchantId),
						channel: "KIOSK",
						atTime: (0, import_dayjs_min.default)().format("YYYY-MM-DD HH:mm:ss")
					}), new Promise((_, reject) => setTimeout(() => reject(/* @__PURE__ */ new Error("EFFECTIVE_SCREEN_TIMEOUT")), EFFECTIVE_SCREEN_FETCH_TIMEOUT_MS))]))?.data?.data;
					if (layout != null && cloudLayoutHasContent(layout)) {
						const mapped = mapCloudLayoutToScreenSaverValue(layout);
						if (mapped) {
							mapped.showHomePage = nextScreenSaverData.showHomePage !== void 0 ? nextScreenSaverData.showHomePage : true;
							mapped.status = nextScreenSaverData.status !== void 0 ? nextScreenSaverData.status : true;
							mapped.dataSource = nextScreenSaverData.dataSource !== void 0 ? nextScreenSaverData.dataSource : SCREENSAVER_DATA_SOURCE.CLOUD;
							commitScreenSaverData(mapped);
							return;
						}
					} else {
						commitScreenSaverData(nextScreenSaverData);
						settled();
					}
				} catch (_) {
					commitScreenSaverData(nextScreenSaverData);
					settled();
				}
			}
		}).catch(() => {
			settled();
		});
	}, [
		commitScreenSaverData,
		onSaveConfig,
		merchantId,
		onScreenSaverLoadStarted,
		onScreenSaverLoadSettled
	]);
	const handScreenSaver = (0, import_react.useCallback)((opts) => {
		loadLocalScreenSaver(opts);
	}, [loadLocalScreenSaver]);
	handScreenSaverRef.current = handScreenSaver;
	(0, import_react.useImperativeHandle)(ref, () => ({ reload: (reloadOpts = {}) => {
		const skip = reloadOpts.skipBootstrapLoading !== void 0 ? reloadOpts.skipBootstrapLoading : true;
		handScreenSaver({
			...reloadOpts,
			skipBootstrapLoading: skip
		});
	} }), [handScreenSaver]);
	(0, import_react.useEffect)(() => {
		if (skipFirstMerchantEffectRef.current) {
			skipFirstMerchantEffectRef.current = false;
			return;
		}
		handScreenSaverRef.current();
	}, [merchantId]);
	(0, import_react.useEffect)(() => {
		if (screenSaverStatus !== SCREENSAVERSTATUS.TIMING && screenSaverStatus !== SCREENSAVERSTATUS.DISPLAY) return;
		let cancelled = false;
		preloadScreenSaverMedia(screenSaverData, screenCurrentIndex).then((results) => {
			if (cancelled) return;
			results?.forEach(({ index, ok }) => {
				if (!ok) handleImageFailure(screenSaverData, index);
			});
		}).catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [
		screenSaverStatus,
		screenSaverData,
		screenCurrentIndex,
		handleImageFailure
	]);
	(0, import_react.useEffect)(() => {
		if (screenSaverStatus !== SCREENSAVERSTATUS.DISPLAY) return;
		if (screenSaverData?.data?.type !== "video") return;
		if (!vedioLoading) return;
		const timer = setTimeout(() => {
			setVedioLoading(false);
		}, PRELOAD_VIDEO_TIMEOUT_MS);
		return () => clearTimeout(timer);
	}, [
		vedioLoading,
		screenSaverStatus,
		screenSaverData
	]);
	const touchScreenAndSaverEnd = (0, import_react.useCallback)(() => {
		let video = document.getElementById("videoRef");
		if (!!video) {
			video.muted = true;
			video.src = "";
			video.pause();
			video.parentNode.removeChild(video);
		}
		if (!!screenImageintervalRef.current) {
			clearInterval(screenImageintervalRef.current);
			screenImageintervalRef.current = null;
		}
		syncStatusRef(screenSaverStatusRef, SCREENSAVERSTATUS.READING);
		setScreenSaverStatus(SCREENSAVERSTATUS.READING);
		setShowScreensaver(false);
	}, [setShowScreensaver]);
	const handleClick = (0, import_react.useCallback)(() => {
		const data = screenSaverDataRef.current;
		if (!toggleKioskLicense || !getCookie("kioskLicense")) {
			setShowScreensaver(false);
			return;
		}
		if (data.showHomePage || data.showHomePage === void 0) {
			syncStatusRef(screenSaverStatusRef, SCREENSAVERSTATUS.READING);
			setScreenSaverStatus(SCREENSAVERSTATUS.READING);
			dealScreenSaverData();
		} else onStartOrder();
		setShowScreensaver(false);
	}, [
		toggleKioskLicense,
		setShowScreensaver,
		dealScreenSaverData,
		onStartOrder
	]);
	(0, import_react.useEffect)(() => {
		window.addEventListener("click", handleClick);
		return () => {
			window.removeEventListener("click", handleClick);
			clearScreenTimers();
		};
	}, [handleClick, clearScreenTimers]);
	(0, import_react.useEffect)(() => {
		return () => {
			clearScreenTimers();
		};
	}, [clearScreenTimers]);
	if (screenSaverStatus !== SCREENSAVERSTATUS.DISPLAY) return null;
	const hasImages = screenSaverData.data?.type === "image" && screenSaverData.data?.imageList?.length > 0;
	const hasVideo = !!screenSaverData.data?.videoUrl && screenSaverData.data.videoUrl.length > 0;
	if (hasImages) {
		const imageList = screenSaverData.data.imageList;
		const renderIndexes = getScreenSaverRenderIndexes(imageList.length, screenCurrentIndex);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			onClick: touchScreenAndSaverEnd,
			className: `${mainPage_module_default.screenSaver}`,
			children: [
				renderIndexes.map((index) => {
					const item = imageList[index];
					const transitionStyle = getScreenSaverImageTransitionStyle({
						effect: screenSaverData.imageAnimation,
						index,
						currentIndex: screenCurrentIndex,
						imageCount: imageList.length
					});
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: resolveImageSrc(item),
						alt: `${index + 1}`,
						onError: () => handleImageFailure(screenSaverData, index),
						style: {
							position: "absolute",
							top: 0,
							left: 0,
							minWidth: "100vw",
							minHeight: "100vh",
							width: "100vw",
							height: "100vh",
							transition: "opacity 1s ease-in-out, transform 1s ease-in-out",
							...transitionStyle
						}
					}, index);
				}),
				bottomText,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(waitingInfo_default, { isFixed: true })
			]
		});
	}
	if (hasVideo) {
		const videoSrc = resolveVideoSrc(screenSaverData.data.videoUrl);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${mainPage_module_default.screenSaver}`,
			onClick: touchScreenAndSaverEnd,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("video", {
					id: "videoRef",
					loop: true,
					muted: true,
					autoPlay: true,
					playsInline: true,
					"webkit-playsinline": "true",
					preload: "auto",
					onLoadedData: () => {
						setVedioLoading(false);
					},
					onPlay: () => {
						setTimeout(() => {
							setVedioLoading(false);
						}, 100);
					},
					onError: () => {
						const fallbackData = createDefaultImageScreenSaverData(screenSaverDataRef.current);
						screenSaverDataRef.current = fallbackData;
						setScreenSaverData(fallbackData);
						setScreenCurrentIndex(0);
						setVedioLoading(false);
					},
					style: {
						height: "100vh",
						width: "100vw",
						zIndex: vedioLoading ? -1 : 1
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("source", {
						src: videoSrc,
						type: "video/mp4"
					}), "Your browser does not support the video tag."]
				}, videoSrc),
				bottomText,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(waitingInfo_default, { isFixed: true }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: vedioLoading })
			]
		});
	}
	return null;
});
//#endregion
export { SCREENSAVERSTATUS as n, mainPage_module_default as r, MainPageScreenSaver as t };
