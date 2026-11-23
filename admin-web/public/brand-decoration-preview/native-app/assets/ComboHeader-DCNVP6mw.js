import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { p as solveScrollElem, tt as systemLanguage } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { Ut as setLanModal, mr as getDishItemLanguage } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import "./arrow-right-BJDuAGvX.js";
import { t as backHomeModal_default } from "./backHomeModal-p8XgRZSA.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { i as LangSwitch_default, n as MobyStatus_default, r as NetworkStatus_default, t as MobyBattery_default } from "./MobyBattery-HWZsMM4L.js";
//#region source-snapshot/src/container/comboPanel/ComboHeader/index.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var index_module_default = {
	logoBox: "logoBox___vs4kp",
	navigateLeft: "navigateLeft___KP-xI",
	comboItemsTitle: "comboItemsTitle___La4YQ",
	backPrePage: "backPrePage___ysViH",
	navigateRight: "navigateRight___AR-PX",
	langIcon: "langIcon___UqcZM"
};
//#endregion
//#region source-snapshot/src/container/comboPanel/ComboHeader/index.js
var import_jsx_runtime = require_jsx_runtime();
var ComboHeader = class extends import_react.Component {
	state = {
		loading: false,
		isOpenLanSwitch: false,
		isOpenMulLanSelect: false
	};
	setLoading = (e) => {
		solveScrollElem(e);
		this.setState({ loading: e });
	};
	handleLang = (flag) => {
		this.props.setLanModal(flag);
	};
	handleContinue = () => {
		this.props.history.push("/");
	};
	handleCancel = () => {
		this.setLoading(false);
	};
	judegIsShowLangSwitch = () => {
		const { selfConfig } = this.props;
		if (selfConfig?.configMap?.id_10?.length === 2) this.setState({
			isOpenLanSwitch: true,
			isOpenMulLanSelect: false
		});
		else this.setState({
			isOpenLanSwitch: false,
			isOpenMulLanSelect: true
		});
	};
	componentDidMount() {
		this.judegIsShowLangSwitch();
	}
	backConfirm = () => {
		this.props.history.goBack();
	};
	render() {
		const { i18n: { language }, currentItem, handleGoBack = null, comboScrollY, hideBackButton = false } = this.props;
		const { loading, isOpenLanSwitch, isOpenMulLanSelect } = this.state;
		const langTxt = systemLanguage.find((item) => item.code == language)?.abbr;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.default.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index_module_default.logoBox,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: index_module_default.navigateLeft,
				children: [!hideBackButton && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAiBAMAAACthOSOAAAAIVBMVEUAAABmZmZnZ2dmZmZmZmZoaGhmZmZlZWVmZmZoaGhmZmYY28rNAAAACnRSTlMAgD7p7B7UnGsgTYS1SAAAAD5JREFUGNNjYAhlgAGOVQIwJsuqhTAm2yq4MJMVQlh5QIQLYMJeqxahMBEKENoQhtFaEBFQiODDDFSGSBgDADjFMD2IrCmkAAAAAElFTkSuQmCC",
					className: index_module_default.backPrePage,
					onClick: () => {
						handleGoBack ? handleGoBack() : this.backConfirm();
					}
				}), comboScrollY > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: index_module_default.comboItemsTitle,
					children: getDishItemLanguage(currentItem.fieldDisplayNameGroups, language) || currentItem.name
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: index_module_default.navigateRight,
				children: [
					isOpenLanSwitch && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LangSwitch_default, {}),
					isOpenMulLanSelect && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: index_module_default.langIcon,
						onClick: () => {
							this.handleLang(true);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
							className: index_module_default.languageIcon,
							type: "language",
							size: 3.4,
							color: "#000"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: langTxt })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkStatus_default, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobyStatus_default, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobyBattery_default, {})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(backHomeModal_default, {
			isShowModal: loading,
			handleContinue: this.handleContinue,
			handleCancel: this.handleCancel
		})] });
	}
};
function mapStateToProps(state) {
	return {
		currentItem: state.currentItem,
		selfConfig: state.selfConfig
	};
}
var ComboHeader_default = withRouter(connect(mapStateToProps, { setLanModal })(withTranslation()(ComboHeader)));
//#endregion
export { ComboHeader_default as t };
