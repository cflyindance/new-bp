import { u as useToken } from "./style-DWrLyeCr.js";
//#region node_modules/antd/es/config-provider/hooks/useCSSVarCls.js
/**
* This hook is only for cssVar to add root className for components.
* If root ClassName is needed, this hook could be refactored with `-root`
* @param prefixCls
*/
var useCSSVarCls = (prefixCls) => {
	const [, , , , cssVar] = useToken();
	return cssVar ? `${prefixCls}-css-var` : "";
};
//#endregion
//#region node_modules/rc-util/es/Dom/isVisible.js
var isVisible_default = (function(element) {
	if (!element) return false;
	if (element instanceof Element) {
		if (element.offsetParent) return true;
		if (element.getBBox) {
			var _getBBox = element.getBBox(), width = _getBBox.width, height = _getBBox.height;
			if (width || height) return true;
		}
		if (element.getBoundingClientRect) {
			var _element$getBoundingC = element.getBoundingClientRect(), _width = _element$getBoundingC.width, _height = _element$getBoundingC.height;
			if (_width || _height) return true;
		}
	}
	return false;
});
//#endregion
export { useCSSVarCls as n, isVisible_default as t };
