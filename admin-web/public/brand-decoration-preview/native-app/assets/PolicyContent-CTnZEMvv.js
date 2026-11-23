import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
//#region source-snapshot/src/component/CRM/LoginCRM/components/PolicyContent.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var PolicyContent_module_default = {
	policyBox: "policyBox___drAQ2",
	policyContent: "policyContent___5HMwH",
	footerOperation: "footerOperation___sHaCC",
	policyBtn: "policyBtn___pxLZO"
};
//#endregion
//#region source-snapshot/src/component/CRM/LoginCRM/components/PolicyContent.js
var import_jsx_runtime = require_jsx_runtime();
var PolicyContent = class extends import_react.Component {
	state = { loading: true };
	handleCheckLoad = () => {
		this.setState({ loading: false });
	};
	componentDidMount() {
		window.addEventListener("popstate", this.handleLocationChange);
	}
	componentWillUnmount() {
		window.removeEventListener("popstate", this.handleLocationChange);
	}
	handleLocationChange = () => {
		if (window.location.hash === "#/") this.props.onClose();
	};
	render() {
		const { loading } = this.state;
		const { onClose, url, t } = this.props;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: PolicyContent_module_default.policyBox,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: PolicyContent_module_default.policyContent,
				style: { visibility: loading ? "hidden" : "visible" },
				onClick: (e) => e.stopPropagation(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
					onLoad: this.handleCheckLoad,
					style: {
						height: "60vh",
						width: "85rem"
					},
					src: url,
					frameBorder: "0"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: PolicyContent_module_default.footerOperation,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `${PolicyContent_module_default.policyBtn} animate-btn`,
						onClick: onClose,
						children: t("i-know")
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: loading })]
		});
	}
};
//#endregion
export { PolicyContent as t };
