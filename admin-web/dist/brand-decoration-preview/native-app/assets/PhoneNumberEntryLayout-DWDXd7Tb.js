import { i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { o as isIpadEnv } from "./utils-Cdx9DbDR.js";
import { n as Policy, t as jingleBell_default } from "./jingleBell-vXwHPSmZ.js";
import { t as numPad_default } from "./numPad-f96Tw6Sn.js";
import { s as normalizePhoneDigits, t as formatUSPhoneInput } from "./phoneNumber-CPrZu7TP.js";
require_react();
var PhoneNumberField_module_default = {
	numPad: "numPad___2XtXh",
	numPadSpacing: "numPadSpacing___78czR",
	inputWithCountryCode: "inputWithCountryCode___2OikB",
	countryCode: "countryCode___gXgcn",
	showPhone: "showPhone___HQ8g5",
	displayPhone: "displayPhone___WG6lp"
};
//#endregion
//#region source-snapshot/src/component/PhoneNumberField/index.js
var import_jsx_runtime = require_jsx_runtime();
var PHONE_KEYS = [
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"0"
];
var PhoneNumberField = ({ value, placeholder, inputRef, isVertical, countryCode = "+1", onChange, onKeyDown, onKeyUp, onFocus, onBlur, onClick }) => {
	const digits = normalizePhoneDigits(value);
	const formattedValue = formatUSPhoneInput(value);
	const displayValue = formattedValue || placeholder;
	const showCustomNumPad = isVertical && !isIpadEnv();
	const emitChange = (nextValue) => {
		const nextFormatted = formatUSPhoneInput(nextValue);
		onChange?.(nextFormatted, normalizePhoneDigits(nextFormatted));
	};
	const handleInputChange = (event) => {
		emitChange(event.target.value);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: PhoneNumberField_module_default.numPad,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: countryCode ? PhoneNumberField_module_default.inputWithCountryCode : void 0,
			children: [countryCode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: PhoneNumberField_module_default.countryCode,
				children: countryCode
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				maxLength: 14,
				value: formattedValue,
				autoFocus: false,
				className: PhoneNumberField_module_default.showPhone,
				type: "tel",
				placeholder,
				onChange: handleInputChange,
				onKeyDown,
				onKeyUp,
				onFocus,
				onBlur,
				onClick,
				style: { opacity: showCustomNumPad ? 0 : 1 }
			})]
		}), showCustomNumPad ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `${PhoneNumberField_module_default.showPhone} ${PhoneNumberField_module_default.displayPhone}`,
			children: displayValue
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: PhoneNumberField_module_default.numPadSpacing,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(numPad_default, {
				keys: PHONE_KEYS,
				propValue: digits,
				maxLength: 10,
				keyPress: (nextValue) => emitChange(nextValue)
			})
		})] }) : null]
	});
};
var PhoneNumberEntryLayout_module_default = {
	entryLayout: "entryLayout___SZCMR",
	titleWrapper: "titleWrapper___lkqWv",
	titleIcon: "titleIcon___eR1RI",
	title: "title___3sx3O",
	fieldWrapper: "fieldWrapper___HLaqP",
	afterField: "afterField___cy1Ji",
	policyWrapper: "policyWrapper___aXVAO",
	actions: "actions___Q-3jO"
};
//#endregion
//#region source-snapshot/src/component/PhoneNumberEntryLayout/index.js
var PhoneNumberEntryLayout = ({ title, titleIcon = jingleBell_default, value, placeholder, inputRef, isVertical, onPhoneChange, onKeyDown, onKeyUp, onFocus, onBlur, onClick, showPolicy = true, isPrivacyConfirm, changePrivacyConfirm, afterField, actions, className = "" }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: `${PhoneNumberEntryLayout_module_default.entryLayout} ${className}`.trim(),
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: PhoneNumberEntryLayout_module_default.titleWrapper,
			children: [titleIcon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				className: PhoneNumberEntryLayout_module_default.titleIcon,
				src: titleIcon,
				alt: ""
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: PhoneNumberEntryLayout_module_default.title,
				children: title
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: PhoneNumberEntryLayout_module_default.fieldWrapper,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneNumberField, {
				value,
				placeholder,
				inputRef,
				isVertical,
				onChange: onPhoneChange,
				onKeyDown,
				onKeyUp,
				onFocus,
				onBlur,
				onClick
			})
		}),
		afterField ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: PhoneNumberEntryLayout_module_default.afterField,
			children: afterField
		}) : null,
		showPolicy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: PhoneNumberEntryLayout_module_default.policyWrapper,
			"data-testid": "phone-entry-policy",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Policy, {
				isPrivacyConfirm,
				changePrivacyConfirm
			})
		}) : null,
		actions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: PhoneNumberEntryLayout_module_default.actions,
			children: actions
		}) : null
	]
});
//#endregion
export { PhoneNumberEntryLayout as t };
