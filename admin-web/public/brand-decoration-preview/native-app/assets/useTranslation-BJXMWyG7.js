import { d as __toESM, i as require_react } from "./toast-C8a1ReSo.js";
import { r as getDefaults, t as getI18n } from "./i18nInstance-DFZX1Hui.js";
//#region node_modules/react-i18next/dist/es/utils.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var warn = (i18n, code, msg, rest) => {
	const args = [msg, {
		code,
		...rest || {}
	}];
	if (i18n?.services?.logger?.forward) return i18n.services.logger.forward(args, "warn", "react-i18next::", true);
	if (isString(args[0])) args[0] = `react-i18next:: ${args[0]}`;
	if (i18n?.services?.logger?.warn) i18n.services.logger.warn(...args);
	else if (console?.warn) console.warn(...args);
};
var alreadyWarned = {};
var warnOnce = (i18n, code, msg, rest) => {
	if (isString(msg) && alreadyWarned[msg]) return;
	if (isString(msg)) alreadyWarned[msg] = /* @__PURE__ */ new Date();
	warn(i18n, code, msg, rest);
};
var loadedClb = (i18n, cb) => () => {
	if (i18n.isInitialized) cb();
	else {
		const initialized = () => {
			setTimeout(() => {
				i18n.off("initialized", initialized);
			}, 0);
			cb();
		};
		i18n.on("initialized", initialized);
	}
};
var loadNamespaces = (i18n, ns, cb) => {
	i18n.loadNamespaces(ns, loadedClb(i18n, cb));
};
var loadLanguages = (i18n, lng, ns, cb) => {
	if (isString(ns)) ns = [ns];
	if (i18n.options.preload && i18n.options.preload.indexOf(lng) > -1) return loadNamespaces(i18n, ns, cb);
	ns.forEach((n) => {
		if (i18n.options.ns.indexOf(n) < 0) i18n.options.ns.push(n);
	});
	i18n.loadLanguages(lng, loadedClb(i18n, cb));
};
var hasLoadedNamespace = (ns, i18n, options = {}) => {
	if (!i18n.languages || !i18n.languages.length) {
		warnOnce(i18n, "NO_LANGUAGES", "i18n.languages were undefined or empty", { languages: i18n.languages });
		return true;
	}
	return i18n.hasLoadedNamespace(ns, {
		lng: options.lng,
		precheck: (i18nInstance, loadNotPending) => {
			if (options.bindI18n && options.bindI18n.indexOf("languageChanging") > -1 && i18nInstance.services.backendConnector.backend && i18nInstance.isLanguageChangingTo && !loadNotPending(i18nInstance.isLanguageChangingTo, ns)) return false;
		}
	});
};
var getDisplayName = (Component) => Component.displayName || Component.name || (isString(Component) && Component.length > 0 ? Component : "Unknown");
var isString = (obj) => typeof obj === "string";
var isObject = (obj) => typeof obj === "object" && obj !== null;
//#endregion
//#region node_modules/react-i18next/dist/es/context.js
var I18nContext = (0, import_react.createContext)();
var ReportNamespaces = class {
	constructor() {
		this.usedNamespaces = {};
	}
	addUsedNamespaces(namespaces) {
		namespaces.forEach((ns) => {
			if (!this.usedNamespaces[ns]) this.usedNamespaces[ns] = true;
		});
	}
	getUsedNamespaces() {
		return Object.keys(this.usedNamespaces);
	}
};
//#endregion
//#region node_modules/react-i18next/dist/es/useTranslation.js
var usePrevious = (value, ignore) => {
	const ref = (0, import_react.useRef)();
	(0, import_react.useEffect)(() => {
		ref.current = ignore ? ref.current : value;
	}, [value, ignore]);
	return ref.current;
};
var alwaysNewT = (i18n, language, namespace, keyPrefix) => i18n.getFixedT(language, namespace, keyPrefix);
var useMemoizedT = (i18n, language, namespace, keyPrefix) => (0, import_react.useCallback)(alwaysNewT(i18n, language, namespace, keyPrefix), [
	i18n,
	language,
	namespace,
	keyPrefix
]);
var useTranslation = (ns, props = {}) => {
	const { i18n: i18nFromProps } = props;
	const { i18n: i18nFromContext, defaultNS: defaultNSFromContext } = (0, import_react.useContext)(I18nContext) || {};
	const i18n = i18nFromProps || i18nFromContext || getI18n();
	if (i18n && !i18n.reportNamespaces) i18n.reportNamespaces = new ReportNamespaces();
	if (!i18n) {
		warnOnce(i18n, "NO_I18NEXT_INSTANCE", "useTranslation: You will need to pass in an i18next instance by using initReactI18next");
		const notReadyT = (k, optsOrDefaultValue) => {
			if (isString(optsOrDefaultValue)) return optsOrDefaultValue;
			if (isObject(optsOrDefaultValue) && isString(optsOrDefaultValue.defaultValue)) return optsOrDefaultValue.defaultValue;
			return Array.isArray(k) ? k[k.length - 1] : k;
		};
		const retNotReady = [
			notReadyT,
			{},
			false
		];
		retNotReady.t = notReadyT;
		retNotReady.i18n = {};
		retNotReady.ready = false;
		return retNotReady;
	}
	if (i18n.options.react?.wait) warnOnce(i18n, "DEPRECATED_OPTION", "useTranslation: It seems you are still using the old wait option, you may migrate to the new useSuspense behaviour.");
	const i18nOptions = {
		...getDefaults(),
		...i18n.options.react,
		...props
	};
	const { useSuspense, keyPrefix } = i18nOptions;
	let namespaces = ns || defaultNSFromContext || i18n.options?.defaultNS;
	namespaces = isString(namespaces) ? [namespaces] : namespaces || ["translation"];
	i18n.reportNamespaces.addUsedNamespaces?.(namespaces);
	const ready = (i18n.isInitialized || i18n.initializedStoreOnce) && namespaces.every((n) => hasLoadedNamespace(n, i18n, i18nOptions));
	const memoGetT = useMemoizedT(i18n, props.lng || null, i18nOptions.nsMode === "fallback" ? namespaces : namespaces[0], keyPrefix);
	const getT = () => memoGetT;
	const getNewT = () => alwaysNewT(i18n, props.lng || null, i18nOptions.nsMode === "fallback" ? namespaces : namespaces[0], keyPrefix);
	const [t, setT] = (0, import_react.useState)(getT);
	let joinedNS = namespaces.join();
	if (props.lng) joinedNS = `${props.lng}${joinedNS}`;
	const previousJoinedNS = usePrevious(joinedNS);
	const isMounted = (0, import_react.useRef)(true);
	(0, import_react.useEffect)(() => {
		const { bindI18n, bindI18nStore } = i18nOptions;
		isMounted.current = true;
		if (!ready && !useSuspense) if (props.lng) loadLanguages(i18n, props.lng, namespaces, () => {
			if (isMounted.current) setT(getNewT);
		});
		else loadNamespaces(i18n, namespaces, () => {
			if (isMounted.current) setT(getNewT);
		});
		if (ready && previousJoinedNS && previousJoinedNS !== joinedNS && isMounted.current) setT(getNewT);
		const boundReset = () => {
			if (isMounted.current) setT(getNewT);
		};
		if (bindI18n) i18n?.on(bindI18n, boundReset);
		if (bindI18nStore) i18n?.store.on(bindI18nStore, boundReset);
		return () => {
			isMounted.current = false;
			if (i18n && bindI18n) bindI18n?.split(" ").forEach((e) => i18n.off(e, boundReset));
			if (bindI18nStore && i18n) bindI18nStore.split(" ").forEach((e) => i18n.store.off(e, boundReset));
		};
	}, [i18n, joinedNS]);
	(0, import_react.useEffect)(() => {
		if (isMounted.current && ready) setT(getT);
	}, [
		i18n,
		keyPrefix,
		ready
	]);
	const ret = [
		t,
		i18n,
		ready
	];
	ret.t = t;
	ret.i18n = i18n;
	ret.ready = ready;
	if (ready) return ret;
	if (!ready && !useSuspense) return ret;
	throw new Promise((resolve) => {
		if (props.lng) loadLanguages(i18n, props.lng, namespaces, () => resolve());
		else loadNamespaces(i18n, namespaces, () => resolve());
	});
};
//#endregion
export { isString as a, isObject as i, I18nContext as n, warn as o, getDisplayName as r, warnOnce as s, useTranslation as t };
