import { d as __toESM, i as require_react, o as __commonJSMin } from "./toast-C8a1ReSo.js";
import { i as keysFromSelector } from "./native-i18n-Bya1piKW.js";
import { a as isString, i as isObject, n as I18nContext, o as warn, s as warnOnce } from "./useTranslation-BJXMWyG7.js";
import { r as getDefaults, t as getI18n } from "./i18nInstance-DFZX1Hui.js";
//#region node_modules/void-elements/index.js
var require_void_elements = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This file automatically generated from `pre-publish.js`.
	* Do not manually edit.
	*/
	module.exports = {
		"area": true,
		"base": true,
		"br": true,
		"col": true,
		"embed": true,
		"hr": true,
		"img": true,
		"input": true,
		"link": true,
		"meta": true,
		"param": true,
		"source": true,
		"track": true,
		"wbr": true
	};
}));
//#endregion
//#region node_modules/html-parse-stringify/dist/html-parse-stringify.module.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_void_elements = /* @__PURE__ */ __toESM(require_void_elements());
var t = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;
function n(n) {
	var r = {
		type: "tag",
		name: "",
		voidElement: !1,
		attrs: {},
		children: []
	}, i = n.match(/<\/?([^\s]+?)[/\s>]/);
	if (i && (r.name = i[1], (import_void_elements.default[i[1]] || "/" === n.charAt(n.length - 2)) && (r.voidElement = !0), r.name.startsWith("!--"))) {
		var s = n.indexOf("-->");
		return {
			type: "comment",
			comment: -1 !== s ? n.slice(4, s) : ""
		};
	}
	for (var a = new RegExp(t), c = null; null !== (c = a.exec(n));) if (c[0].trim()) if (c[1]) {
		var o = c[1].trim(), l = [o, ""];
		o.indexOf("=") > -1 && (l = o.split("=")), r.attrs[l[0]] = l[1], a.lastIndex--;
	} else c[2] && (r.attrs[c[2]] = c[3].trim().substring(1, c[3].length - 1));
	return r;
}
var r = /<[a-zA-Z0-9\-\!\/](?:"[^"]*"|'[^']*'|[^'">])*>/g;
var i = /^\s*$/;
var s = Object.create(null);
function a(e, t) {
	switch (t.type) {
		case "text": return e + t.content;
		case "tag": return e += "<" + t.name + (t.attrs ? function(e) {
			var t = [];
			for (var n in e) t.push(n + "=\"" + e[n] + "\"");
			return t.length ? " " + t.join(" ") : "";
		}(t.attrs) : "") + (t.voidElement ? "/>" : ">"), t.voidElement ? e : e + t.children.reduce(a, "") + "</" + t.name + ">";
		case "comment": return e + "<!--" + t.comment + "-->";
	}
}
var c = {
	parse: function(e, t) {
		t || (t = {}), t.components || (t.components = s);
		var a, c = [], o = [], l = -1, m = !1;
		if (0 !== e.indexOf("<")) {
			var u = e.indexOf("<");
			c.push({
				type: "text",
				content: -1 === u ? e : e.substring(0, u)
			});
		}
		return e.replace(r, function(r, s) {
			if (m) {
				if (r !== "</" + a.name + ">") return;
				m = !1;
			}
			var u, f = "/" !== r.charAt(1), h = r.startsWith("<!--"), p = s + r.length, d = e.charAt(p);
			if (h) {
				var v = n(r);
				return l < 0 ? (c.push(v), c) : ((u = o[l]).children.push(v), c);
			}
			if (f && (l++, "tag" === (a = n(r)).type && t.components[a.name] && (a.type = "component", m = !0), a.voidElement || m || !d || "<" === d || a.children.push({
				type: "text",
				content: e.slice(p, e.indexOf("<", p))
			}), 0 === l && c.push(a), (u = o[l - 1]) && u.children.push(a), o[l] = a), (!f || a.voidElement) && (l > -1 && (a.voidElement || a.name === r.slice(2, -1)) && (l--, a = -1 === l ? c : o[l]), !m && "<" !== d && d)) {
				u = -1 === l ? c : o[l].children;
				var x = e.indexOf("<", p), g = e.slice(p, -1 === x ? void 0 : x);
				i.test(g) && (g = " "), (x > -1 && l + u.length >= 0 || " " !== g) && u.push({
					type: "text",
					content: g
				});
			}
		}), c;
	},
	stringify: function(e) {
		return e.reduce(function(e, t) {
			return e + a("", t);
		}, "");
	}
};
//#endregion
//#region node_modules/react-i18next/dist/es/TransWithoutContext.js
var hasChildren = (node, checkLength) => {
	if (!node) return false;
	const base = node.props?.children ?? node.children;
	if (checkLength) return base.length > 0;
	return !!base;
};
var getChildren = (node) => {
	if (!node) return [];
	const children = node.props?.children ?? node.children;
	return node.props?.i18nIsDynamicList ? getAsArray(children) : children;
};
var hasValidReactChildren = (children) => Array.isArray(children) && children.every(import_react.isValidElement);
var getAsArray = (data) => Array.isArray(data) ? data : [data];
var mergeProps = (source, target) => {
	const newTarget = { ...target };
	newTarget.props = Object.assign(source.props, target.props);
	return newTarget;
};
var nodesToString = (children, i18nOptions, i18n, i18nKey) => {
	if (!children) return "";
	let stringNode = "";
	const childrenArray = getAsArray(children);
	const keepArray = i18nOptions?.transSupportBasicHtmlNodes ? i18nOptions.transKeepBasicHtmlNodesFor ?? [] : [];
	childrenArray.forEach((child, childIndex) => {
		if (isString(child)) {
			stringNode += `${child}`;
			return;
		}
		if ((0, import_react.isValidElement)(child)) {
			const { props, type } = child;
			const childPropsCount = Object.keys(props).length;
			const shouldKeepChild = keepArray.indexOf(type) > -1;
			const childChildren = props.children;
			if (!childChildren && shouldKeepChild && !childPropsCount) {
				stringNode += `<${type}/>`;
				return;
			}
			if (!childChildren && (!shouldKeepChild || childPropsCount) || props.i18nIsDynamicList) {
				stringNode += `<${childIndex}></${childIndex}>`;
				return;
			}
			if (shouldKeepChild && childPropsCount === 1 && isString(childChildren)) {
				stringNode += `<${type}>${childChildren}</${type}>`;
				return;
			}
			const content = nodesToString(childChildren, i18nOptions, i18n, i18nKey);
			stringNode += `<${childIndex}>${content}</${childIndex}>`;
			return;
		}
		if (child === null) {
			warn(i18n, "TRANS_NULL_VALUE", `Passed in a null value as child`, { i18nKey });
			return;
		}
		if (isObject(child)) {
			const { format, ...clone } = child;
			const keys = Object.keys(clone);
			if (keys.length === 1) {
				const value = format ? `${keys[0]}, ${format}` : keys[0];
				stringNode += `{{${value}}}`;
				return;
			}
			warn(i18n, "TRANS_INVALID_OBJ", `Invalid child - Object should only have keys {{ value, format }} (format is optional).`, {
				i18nKey,
				child
			});
			return;
		}
		warn(i18n, "TRANS_INVALID_VAR", `Passed in a variable like {number} - pass variables for interpolation as full objects like {{number}}.`, {
			i18nKey,
			child
		});
	});
	return stringNode;
};
var renderNodes = (children, knownComponentsMap, targetString, i18n, i18nOptions, combinedTOpts, shouldUnescape) => {
	if (targetString === "") return [];
	const keepArray = i18nOptions.transKeepBasicHtmlNodesFor || [];
	const emptyChildrenButNeedsHandling = targetString && new RegExp(keepArray.map((keep) => `<${keep}`).join("|")).test(targetString);
	if (!children && !knownComponentsMap && !emptyChildrenButNeedsHandling && !shouldUnescape) return [targetString];
	const data = knownComponentsMap ?? {};
	const getData = (childs) => {
		getAsArray(childs).forEach((child) => {
			if (isString(child)) return;
			if (hasChildren(child)) getData(getChildren(child));
			else if (isObject(child) && !(0, import_react.isValidElement)(child)) Object.assign(data, child);
		});
	};
	getData(children);
	const ast = c.parse(`<0>${targetString}</0>`);
	const opts = {
		...data,
		...combinedTOpts
	};
	const renderInner = (child, node, rootReactNode) => {
		const childs = getChildren(child);
		const mappedChildren = mapAST(childs, node.children, rootReactNode);
		return hasValidReactChildren(childs) && mappedChildren.length === 0 || child.props?.i18nIsDynamicList ? childs : mappedChildren;
	};
	const pushTranslatedJSX = (child, inner, mem, i, isVoid) => {
		if (child.dummy) {
			child.children = inner;
			mem.push((0, import_react.cloneElement)(child, { key: i }, isVoid ? void 0 : inner));
		} else mem.push(...import_react.Children.map([child], (c) => {
			const props = { ...c.props };
			delete props.i18nIsDynamicList;
			return (0, import_react.createElement)(c.type, {
				...props,
				key: i,
				ref: c.props.ref ?? c.ref
			}, isVoid ? null : inner);
		}));
	};
	const mapAST = (reactNode, astNode, rootReactNode) => {
		const reactNodes = getAsArray(reactNode);
		return getAsArray(astNode).reduce((mem, node, i) => {
			const translationContent = node.children?.[0]?.content && i18n.services.interpolator.interpolate(node.children[0].content, opts, i18n.language);
			if (node.type === "tag") {
				let tmp = reactNodes[parseInt(node.name, 10)];
				if (!tmp && knownComponentsMap) tmp = knownComponentsMap[node.name];
				if (rootReactNode.length === 1 && !tmp) tmp = rootReactNode[0][node.name];
				if (!tmp) tmp = {};
				const child = Object.keys(node.attrs).length !== 0 ? mergeProps({ props: node.attrs }, tmp) : tmp;
				const isElement = (0, import_react.isValidElement)(child);
				const isValidTranslationWithChildren = isElement && hasChildren(node, true) && !node.voidElement;
				const isEmptyTransWithHTML = emptyChildrenButNeedsHandling && isObject(child) && child.dummy && !isElement;
				const isKnownComponent = isObject(knownComponentsMap) && Object.hasOwnProperty.call(knownComponentsMap, node.name);
				if (isString(child)) {
					const value = i18n.services.interpolator.interpolate(child, opts, i18n.language);
					mem.push(value);
				} else if (hasChildren(child) || isValidTranslationWithChildren) {
					const inner = renderInner(child, node, rootReactNode);
					pushTranslatedJSX(child, inner, mem, i);
				} else if (isEmptyTransWithHTML) {
					const inner = mapAST(reactNodes, node.children, rootReactNode);
					pushTranslatedJSX(child, inner, mem, i);
				} else if (Number.isNaN(parseFloat(node.name))) if (isKnownComponent) {
					const inner = renderInner(child, node, rootReactNode);
					pushTranslatedJSX(child, inner, mem, i, node.voidElement);
				} else if (i18nOptions.transSupportBasicHtmlNodes && keepArray.indexOf(node.name) > -1) if (node.voidElement) mem.push((0, import_react.createElement)(node.name, { key: `${node.name}-${i}` }));
				else {
					const inner = mapAST(reactNodes, node.children, rootReactNode);
					mem.push((0, import_react.createElement)(node.name, { key: `${node.name}-${i}` }, inner));
				}
				else if (node.voidElement) mem.push(`<${node.name} />`);
				else {
					const inner = mapAST(reactNodes, node.children, rootReactNode);
					mem.push(`<${node.name}>${inner}</${node.name}>`);
				}
				else if (isObject(child) && !isElement) {
					const content = node.children[0] ? translationContent : null;
					if (content) mem.push(content);
				} else pushTranslatedJSX(child, translationContent, mem, i, node.children.length !== 1 || !translationContent);
			} else if (node.type === "text") {
				const wrapTextNodes = i18nOptions.transWrapTextNodes;
				const content = shouldUnescape ? i18nOptions.unescape(i18n.services.interpolator.interpolate(node.content, opts, i18n.language)) : i18n.services.interpolator.interpolate(node.content, opts, i18n.language);
				if (wrapTextNodes) mem.push((0, import_react.createElement)(wrapTextNodes, { key: `${node.name}-${i}` }, content));
				else mem.push(content);
			}
			return mem;
		}, []);
	};
	return getChildren(mapAST([{
		dummy: true,
		children: children || []
	}], ast, getAsArray(children || []))[0]);
};
var fixComponentProps = (component, index, translation) => {
	const componentKey = component.key || index;
	const comp = (0, import_react.cloneElement)(component, { key: componentKey });
	if (!comp.props || !comp.props.children || translation.indexOf(`${index}/>`) < 0 && translation.indexOf(`${index} />`) < 0) return comp;
	function Componentized() {
		return (0, import_react.createElement)(import_react.Fragment, null, comp);
	}
	return (0, import_react.createElement)(Componentized, { key: componentKey });
};
var generateArrayComponents = (components, translation) => components.map((c, index) => fixComponentProps(c, index, translation));
var generateObjectComponents = (components, translation) => {
	const componentMap = {};
	Object.keys(components).forEach((c) => {
		Object.assign(componentMap, { [c]: fixComponentProps(components[c], c, translation) });
	});
	return componentMap;
};
var generateComponents = (components, translation, i18n, i18nKey) => {
	if (!components) return null;
	if (Array.isArray(components)) return generateArrayComponents(components, translation);
	if (isObject(components)) return generateObjectComponents(components, translation);
	warnOnce(i18n, "TRANS_INVALID_COMPONENTS", `<Trans /> "components" prop expects an object or array`, { i18nKey });
	return null;
};
var isComponentsMap = (object) => {
	if (!isObject(object)) return false;
	if (Array.isArray(object)) return false;
	return Object.keys(object).reduce((acc, key) => acc && Number.isNaN(Number.parseFloat(key)), true);
};
function Trans$1({ children, count, parent, i18nKey, context, tOptions = {}, values, defaults, components, ns, i18n: i18nFromProps, t: tFromProps, shouldUnescape, ...additionalProps }) {
	const i18n = i18nFromProps || getI18n();
	if (!i18n) {
		warnOnce(i18n, "NO_I18NEXT_INSTANCE", `Trans: You need to pass in an i18next instance using i18nextReactModule`, { i18nKey });
		return children;
	}
	const t = tFromProps || i18n.t.bind(i18n) || ((k) => k);
	const reactI18nextOptions = {
		...getDefaults(),
		...i18n.options?.react
	};
	let namespaces = ns || t.ns || i18n.options?.defaultNS;
	namespaces = isString(namespaces) ? [namespaces] : namespaces || ["translation"];
	const nodeAsString = nodesToString(children, reactI18nextOptions, i18n, i18nKey);
	const defaultValue = defaults || nodeAsString || reactI18nextOptions.transEmptyNodeValue || (typeof i18nKey === "function" ? keysFromSelector(i18nKey) : i18nKey);
	const { hashTransKey } = reactI18nextOptions;
	const key = i18nKey || (hashTransKey ? hashTransKey(nodeAsString || defaultValue) : nodeAsString || defaultValue);
	if (i18n.options?.interpolation?.defaultVariables) values = values && Object.keys(values).length > 0 ? {
		...values,
		...i18n.options.interpolation.defaultVariables
	} : { ...i18n.options.interpolation.defaultVariables };
	const interpolationOverride = values || count !== void 0 && !i18n.options?.interpolation?.alwaysFormat || !children ? tOptions.interpolation : { interpolation: {
		...tOptions.interpolation,
		prefix: "#$?",
		suffix: "?$#"
	} };
	const combinedTOpts = {
		...tOptions,
		context: context || tOptions.context,
		count,
		...values,
		...interpolationOverride,
		defaultValue,
		ns: namespaces
	};
	const translation = key ? t(key, combinedTOpts) : defaultValue;
	const generatedComponents = generateComponents(components, translation, i18n, i18nKey);
	let indexedChildren = generatedComponents || children;
	let componentsMap = null;
	if (isComponentsMap(generatedComponents)) {
		componentsMap = generatedComponents;
		indexedChildren = children;
	}
	const content = renderNodes(indexedChildren, componentsMap, translation, i18n, reactI18nextOptions, combinedTOpts, shouldUnescape);
	const useAsParent = parent ?? reactI18nextOptions.defaultTransParent;
	return useAsParent ? (0, import_react.createElement)(useAsParent, additionalProps, content) : content;
}
//#endregion
//#region node_modules/react-i18next/dist/es/Trans.js
function Trans({ children, count, parent, i18nKey, context, tOptions = {}, values, defaults, components, ns, i18n: i18nFromProps, t: tFromProps, shouldUnescape, ...additionalProps }) {
	const { i18n: i18nFromContext, defaultNS: defaultNSFromContext } = (0, import_react.useContext)(I18nContext) || {};
	const i18n = i18nFromProps || i18nFromContext || getI18n();
	const t = tFromProps || i18n?.t.bind(i18n);
	return Trans$1({
		children,
		count,
		parent,
		i18nKey,
		context,
		tOptions,
		values,
		defaults,
		components,
		ns: ns || t?.ns || defaultNSFromContext || i18n?.options?.defaultNS,
		i18n,
		t: tFromProps,
		shouldUnescape,
		...additionalProps
	});
}
//#endregion
export { Trans as t };
