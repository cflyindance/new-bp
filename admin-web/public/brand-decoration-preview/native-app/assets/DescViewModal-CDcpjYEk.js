import { i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
require_react();
var index_module_default = {
	descModalWrapper: "descModalWrapper___3oKI4",
	header: "header___v9RRQ",
	text: "text___ugQKP",
	content: "content___93eEu"
};
//#endregion
//#region source-snapshot/src/component/DescViewModal/index.js
var import_jsx_runtime = require_jsx_runtime();
var DescViewModal = ({ visible, description, onClose, title, t }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		isMountOnBody: true,
		visible,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index_module_default.descModalWrapper,
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: index_module_default.header,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: index_module_default.text,
					children: title || t("cate-description")
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: index_module_default.content,
				children: description
			})]
		}),
		onClose
	});
};
var DescViewModal_default = withTranslation()(DescViewModal);
//#endregion
export { DescViewModal_default as t };
