import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { d as on, u as off } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
//#region source-snapshot/src/container/waitList/waitList.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var waitList_module_default = {
	container: "container___v7FRx",
	content: "content___Nqdac"
};
var index_module_default = { back: "back___bGiVv" };
//#endregion
//#region source-snapshot/src/component/backIcon/index.js
var import_jsx_runtime = require_jsx_runtime();
var BackIcon = (props) => {
	const { clickHandler, userStyle } = props;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: index_module_default.back,
		style: userStyle,
		onClick: () => {
			clickHandler();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
			type: "fenxiang",
			size: "5",
			color: userStyle?.color || "#666"
		})
	});
};
//#endregion
//#region source-snapshot/src/container/waitList/index.js
var WaitList = class extends import_react.Component {
	constructor() {
		super();
		this.state = {
			isShowBackIcon: true,
			errorApiMsg: "",
			errorApiShow: false,
			manualRefresh: true
		};
		this.iframeRef = import_react.createRef();
		this.timer = null;
		this.t = null;
	}
	backBtnHandler = () => {
		this.props.history.goBack();
	};
	showApiModalTip = (errMsg) => {
		this.setState({
			manualRefresh: false,
			errorApiMsg: errMsg,
			errorApiShow: true
		});
		this.timer = setTimeout(() => {
			this.setState({
				errorApiMsg: "",
				errorApiShow: false
			});
		}, 2e3);
	};
	iframeOnload = () => {
		clearTimeout(this.t);
		this.setState({ manualRefresh: false });
	};
	getMsgData = (event) => {
		if (event.data.type == "waitListComplete") this.setState({ isShowBackIcon: false });
		else if (event.data.type == "waitListClose") this.props.history.push("/");
	};
	componentDidMount() {
		on(window, "message", this.getMsgData);
		if (this.iframeRef.current) on(this.iframeRef.current, "load", this.iframeOnload);
		this.t = setTimeout(() => {
			if (this.state.manualRefresh) this.showApiModalTip("Wait List system loading failed");
		}, 15 * 1e3);
	}
	componentWillUnmount() {
		off(window, "message", this.getMsgData);
		off(this.iframeRef.current, "load", this.iframeOnload);
		clearTimeout(this.t);
		clearTimeout(this.timer);
	}
	render() {
		const { merchantId } = this.props;
		const { isShowBackIcon, manualRefresh, errorApiShow, errorApiMsg } = this.state;
		const iframeSrc = `https://epager.menusifucloud.com/${merchantId}/front/partySize?mode=kiosk`;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: waitList_module_default.container,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: waitList_module_default.content,
					children: merchantId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
						ref: this.iframeRef,
						src: iframeSrc,
						frameBorder: "0",
						width: "100%",
						height: "100%",
						scrolling: "auto"
					}) : null
				}),
				isShowBackIcon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackIcon, { clickHandler: this.backBtnHandler }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: manualRefresh }),
				errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
					variant: "filled",
					severity: "error",
					children: errorApiMsg
				}) : null
			]
		});
	}
};
function mapStateToProps(state) {
	return { merchantId: state.merchantProfile?.merchantId };
}
var waitList_default = withRouter(connect(mapStateToProps)(WaitList));
//#endregion
export { waitList_default as default };
