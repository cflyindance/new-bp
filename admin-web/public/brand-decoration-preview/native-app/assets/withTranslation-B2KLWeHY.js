import { d as __toESM, i as require_react } from "./toast-C8a1ReSo.js";
import { r as getDisplayName, t as useTranslation } from "./useTranslation-BJXMWyG7.js";
//#region node_modules/react-i18next/dist/es/withTranslation.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var withTranslation = (ns, options = {}) => function Extend(WrappedComponent) {
	function I18nextWithTranslation({ forwardedRef, ...rest }) {
		const [t, i18n, ready] = useTranslation(ns, {
			...rest,
			keyPrefix: options.keyPrefix
		});
		const passDownProps = {
			...rest,
			t,
			i18n,
			tReady: ready
		};
		if (options.withRef && forwardedRef) passDownProps.ref = forwardedRef;
		else if (!options.withRef && forwardedRef) passDownProps.forwardedRef = forwardedRef;
		return (0, import_react.createElement)(WrappedComponent, passDownProps);
	}
	I18nextWithTranslation.displayName = `withI18nextTranslation(${getDisplayName(WrappedComponent)})`;
	I18nextWithTranslation.WrappedComponent = WrappedComponent;
	const forwardRef = (props, ref) => (0, import_react.createElement)(I18nextWithTranslation, Object.assign({}, props, { forwardedRef: ref }));
	return options.withRef ? (0, import_react.forwardRef)(forwardRef) : I18nextWithTranslation;
};
//#endregion
export { withTranslation as t };
