import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
//#region source-snapshot/src/component/numPad/numPad.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var numPad_module_default = {
	keysWrapper: "keysWrapper___8GcXD",
	btnWrapper: "btnWrapper___Nxk5Q",
	btnNum: "btnNum___LEO8G",
	times: "times___hojeb",
	btnSelected: "btnSelected___ws4a7",
	zeroBtn: "zeroBtn___TrMVL",
	delBtn: "delBtn___TCs1u"
};
//#endregion
//#region source-snapshot/src/assets/images/numDelete.png
var numDelete_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJUAAABWCAMAAADxACRnAAAAUVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8gICDf39+goKBfX1+AgIBwcHC/v7/v7+9gYGD86cjJAAAAEHRSTlMA3yCA718Qz6C/QJAwcLBPcnTa+wAAAmJJREFUaN7V2+FyojAYheFgAYFu7QGpdvf+L3Snv850bD3hO5im7xU8o04+SULaWN8NTYtH1I7PUwrVPwmRWdMFUFODRzcctqJeUKBmI+sJWfmsClHAuAE1oFgvuaZ+RLnaXNQRJXvNQh0aFO1UIyrrK/zToHQaNekhU17V4QeqZu38VJUo7Ila3hfo3lZTNWxDnefzolHzrFn+lAFRM1l3UGQFVIfjZhRZd1Ga5S/oRJElUJK1I4osgdKs76ZMG0CRJVCSZU4ZoiSLKM3aZcq8z7NgEcXehMpd0JezYBEV+KwEymAJlFY9gzksAwUxZRxWHAXx2GCxwiiIKeOxoiiIBd1kBVEQKJcVQ0FMGZsVQkF8UjbrGkGBqiNEIVYIhcDsUywfRVUDL7JsFFUT3MiyUQhMP80yUVSN8CPLRCH0s9IsC0UVrG5ZDoqqFrt2uVEtyM7/BvXTDIdPfsafPYFyWKHTEI2yWFT1LeyIclnG/3WBMlhUHVp4EeWzjHM2gXJY6kHQRf0NscRDs4tal3OElQTLRAEhVhIsFxVjJcEyUUGW2LoyUVGW2ObzUGGWOHizUHGW2D52UAYrCZaBMlhJsAyUwdrltGSVKLLYNVPF+hiLKM26QKj8U7hVocgiSqvcveRVocjSKLgHqWQRJVhEaZXPIkqwiNIqn0WUYCkU9rzMsBJ1l3WBp0qvm2b1P2S0XGGouLFcvvouFH1U4T0nADVevxIqzuqytTVe68OpvnuZADrF4awuV1Ph1Vqg++03fiu9Hf31rP5xVJGbo6c+8obCY13jlGJ1w/5L6s3bHP8BdhWeTBTtN/0AAAAASUVORK5CYII=";
//#endregion
//#region source-snapshot/src/component/numPad/index.js
var import_jsx_runtime = require_jsx_runtime();
var NumPad = (props) => {
	const { keys, propValue, maxLength = 10, mode = "concat", keyPress, showDelete = true, selectedKey, className = "" } = props;
	const [inputValue, setInputValue] = (0, import_react.useState)(propValue || "");
	const isFirstRender = (0, import_react.useRef)(true);
	(0, import_react.useEffect)(() => {
		if (propValue !== void 0) setInputValue(propValue);
	}, [propValue]);
	const buttonClickHandler = (key) => {
		if (mode === "direct") {
			keyPress(key);
			return;
		}
		setInputValue((prevValue) => {
			const newValue = prevValue + key;
			if (newValue.length > maxLength) return prevValue;
			return newValue;
		});
	};
	const deleteButtonhandler = () => {
		if (mode === "direct") {
			keyPress("delete");
			return;
		}
		setInputValue((prevValue) => {
			if (prevValue.length > 0) return prevValue.slice(0, -1);
			return prevValue;
		});
	};
	(0, import_react.useEffect)(() => {
		if (mode === "concat") {
			if (isFirstRender.current) {
				isFirstRender.current = false;
				return;
			}
			keyPress(inputValue);
		}
	}, [inputValue, mode]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `${numPad_module_default.keysWrapper} ${className}`,
		children: [keys.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: [
				numPad_module_default.btnWrapper,
				key === 0 || key === "0" ? numPad_module_default.zeroBtn : "",
				selectedKey != null && String(selectedKey) === String(key) ? numPad_module_default.btnSelected : ""
			].filter(Boolean).join(" "),
			onClick: () => buttonClickHandler(key),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: numPad_module_default.btnNum,
				children: key
			})
		}, key)), showDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `${numPad_module_default.btnWrapper} ${numPad_module_default.delBtn}`,
			onClick: deleteButtonhandler,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: numDelete_default,
				className: numPad_module_default.times,
				alt: ""
			})
		}) : null]
	}) });
};
var numPad_default = withTranslation()(NumPad);
//#endregion
export { numPad_default as t };
