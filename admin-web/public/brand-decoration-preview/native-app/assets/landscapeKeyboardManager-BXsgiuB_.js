import { a as getDeviceOrientation } from "./utils-Cdx9DbDR.js";
//#region source-snapshot/src/utils/landscapeKeyboardManager.js
/**
* 横屏模式下处理原生键盘弹出的工具类
* 可以在类组件中使用
*/
var LandscapeKeyboardManager = class {
	constructor(inputRef) {
		this.inputRef = inputRef;
		this.originalBodyHeight = null;
		this.originalBodyOverflow = null;
		this.visualViewportHandler = null;
		this.resizeHandler = null;
		this.orientationHandler = null;
	}
	getIsVertical() {
		return getDeviceOrientation() === "vertical";
	}
	restoreBodyStyle() {
		document.body.style.height = this.originalBodyHeight || "";
		document.body.style.overflow = this.originalBodyOverflow || "";
	}
	handleKeyboardOpen(viewportHeight) {
		document.body.style.height = `${viewportHeight}px`;
		document.body.style.overflow = "hidden";
		setTimeout(() => {
			let inputElement = null;
			if (typeof this.inputRef === "function") inputElement = this.inputRef();
			else if (this.inputRef?.current) inputElement = this.inputRef.current;
			else inputElement = this.inputRef;
			if (inputElement) inputElement.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "nearest"
			});
		}, 100);
	}
	handleKeyboardClose() {
		this.restoreBodyStyle();
	}
	handleKeyboardChange() {
		if (this.getIsVertical()) return;
		const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
		if (window.innerHeight - viewportHeight > 150) this.handleKeyboardOpen(viewportHeight);
		else this.handleKeyboardClose();
	}
	forceCheck() {
		setTimeout(() => {
			this.handleKeyboardChange();
		}, 100);
	}
	setup() {
		this.originalBodyHeight = document.body.style.height;
		this.originalBodyOverflow = document.body.style.overflow;
		if (window.visualViewport) {
			this.visualViewportHandler = () => {
				this.handleKeyboardChange();
			};
			window.visualViewport.addEventListener("resize", this.visualViewportHandler);
			window.visualViewport.addEventListener("scroll", this.visualViewportHandler);
		}
		this.resizeHandler = () => {
			if (this.getIsVertical()) this.cleanup();
			else this.handleKeyboardChange();
		};
		window.addEventListener("resize", this.resizeHandler);
		setTimeout(() => {
			this.handleKeyboardChange();
		}, 100);
		if (window.orientation !== void 0 && !this.orientationHandler) {
			this.orientationHandler = () => {
				setTimeout(() => {
					if (this.getIsVertical()) this.cleanup();
					else if (!this.resizeHandler && !this.visualViewportHandler) this.setup();
					else this.handleKeyboardChange();
				}, 100);
			};
			window.addEventListener("orientationchange", this.orientationHandler);
		}
	}
	cleanup() {
		if (window.visualViewport && this.visualViewportHandler) {
			window.visualViewport.removeEventListener("resize", this.visualViewportHandler);
			window.visualViewport.removeEventListener("scroll", this.visualViewportHandler);
			this.visualViewportHandler = null;
		}
		if (this.resizeHandler) {
			window.removeEventListener("resize", this.resizeHandler);
			this.resizeHandler = null;
		}
		if (this.orientationHandler) {
			window.removeEventListener("orientationchange", this.orientationHandler);
			this.orientationHandler = null;
		}
		this.restoreBodyStyle();
	}
};
//#endregion
export { LandscapeKeyboardManager as t };
