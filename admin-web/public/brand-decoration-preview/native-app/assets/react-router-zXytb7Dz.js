import { d as __toESM, i as require_react, o as __commonJSMin } from "./toast-C8a1ReSo.js";
import { a as require_hoist_non_react_statics_cjs, c as init_objectWithoutPropertiesLoose, l as _extends, o as require_react_is, s as _objectWithoutPropertiesLoose, u as init_extends } from "./es-CFYDnMm2.js";
import { a as init_inheritsLoose, i as _inheritsLoose, n as warning, r as require_prop_types, t as init_tiny_warning_esm } from "./tiny-warning.esm-Cf7nlwXj.js";
//#region node_modules/resolve-pathname/esm/resolve-pathname.js
var import_react = /* @__PURE__ */ __toESM(require_react());
init_extends();
init_inheritsLoose();
var import_prop_types = /* @__PURE__ */ __toESM(require_prop_types());
function isAbsolute(pathname) {
	return pathname.charAt(0) === "/";
}
function spliceOne(list, index) {
	for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1) list[i] = list[k];
	list.pop();
}
function resolvePathname(to, from) {
	if (from === void 0) from = "";
	var toParts = to && to.split("/") || [];
	var fromParts = from && from.split("/") || [];
	var isToAbs = to && isAbsolute(to);
	var isFromAbs = from && isAbsolute(from);
	var mustEndAbs = isToAbs || isFromAbs;
	if (to && isAbsolute(to)) fromParts = toParts;
	else if (toParts.length) {
		fromParts.pop();
		fromParts = fromParts.concat(toParts);
	}
	if (!fromParts.length) return "/";
	var hasTrailingSlash;
	if (fromParts.length) {
		var last = fromParts[fromParts.length - 1];
		hasTrailingSlash = last === "." || last === ".." || last === "";
	} else hasTrailingSlash = false;
	var up = 0;
	for (var i = fromParts.length; i >= 0; i--) {
		var part = fromParts[i];
		if (part === ".") spliceOne(fromParts, i);
		else if (part === "..") {
			spliceOne(fromParts, i);
			up++;
		} else if (up) {
			spliceOne(fromParts, i);
			up--;
		}
	}
	if (!mustEndAbs) for (; up--;) fromParts.unshift("..");
	if (mustEndAbs && fromParts[0] !== "" && (!fromParts[0] || !isAbsolute(fromParts[0]))) fromParts.unshift("");
	var result = fromParts.join("/");
	if (hasTrailingSlash && result.substr(-1) !== "/") result += "/";
	return result;
}
//#endregion
//#region node_modules/value-equal/esm/value-equal.js
function valueOf(obj) {
	return obj.valueOf ? obj.valueOf() : Object.prototype.valueOf.call(obj);
}
function valueEqual(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every(function(item, index) {
		return valueEqual(item, b[index]);
	});
	if (typeof a === "object" || typeof b === "object") {
		var aValue = valueOf(a);
		var bValue = valueOf(b);
		if (aValue !== a || bValue !== b) return valueEqual(aValue, bValue);
		return Object.keys(Object.assign({}, a, b)).every(function(key) {
			return valueEqual(a[key], b[key]);
		});
	}
	return false;
}
//#endregion
//#region node_modules/tiny-invariant/dist/esm/tiny-invariant.js
init_tiny_warning_esm();
var prefix = "Invariant failed";
function invariant(condition, message) {
	if (condition) return;
	var provided = typeof message === "function" ? message() : message;
	var value = provided ? "".concat(prefix, ": ").concat(provided) : prefix;
	throw new Error(value);
}
//#endregion
//#region node_modules/history/esm/history.js
function parsePath(path) {
	var pathname = path || "/";
	var search = "";
	var hash = "";
	var hashIndex = pathname.indexOf("#");
	if (hashIndex !== -1) {
		hash = pathname.substr(hashIndex);
		pathname = pathname.substr(0, hashIndex);
	}
	var searchIndex = pathname.indexOf("?");
	if (searchIndex !== -1) {
		search = pathname.substr(searchIndex);
		pathname = pathname.substr(0, searchIndex);
	}
	return {
		pathname,
		search: search === "?" ? "" : search,
		hash: hash === "#" ? "" : hash
	};
}
function createPath(location) {
	var pathname = location.pathname, search = location.search, hash = location.hash;
	var path = pathname || "/";
	if (search && search !== "?") path += search.charAt(0) === "?" ? search : "?" + search;
	if (hash && hash !== "#") path += hash.charAt(0) === "#" ? hash : "#" + hash;
	return path;
}
function createLocation(path, state, key, currentLocation) {
	var location;
	if (typeof path === "string") {
		location = parsePath(path);
		location.state = state;
	} else {
		location = _extends({}, path);
		if (location.pathname === void 0) location.pathname = "";
		if (location.search) {
			if (location.search.charAt(0) !== "?") location.search = "?" + location.search;
		} else location.search = "";
		if (location.hash) {
			if (location.hash.charAt(0) !== "#") location.hash = "#" + location.hash;
		} else location.hash = "";
		if (state !== void 0 && location.state === void 0) location.state = state;
	}
	try {
		location.pathname = decodeURI(location.pathname);
	} catch (e) {
		if (e instanceof URIError) throw new URIError("Pathname \"" + location.pathname + "\" could not be decoded. This is likely caused by an invalid percent-encoding.");
		else throw e;
	}
	if (key) location.key = key;
	if (currentLocation) {
		if (!location.pathname) location.pathname = currentLocation.pathname;
		else if (location.pathname.charAt(0) !== "/") location.pathname = resolvePathname(location.pathname, currentLocation.pathname);
	} else if (!location.pathname) location.pathname = "/";
	return location;
}
function locationsAreEqual(a, b) {
	return a.pathname === b.pathname && a.search === b.search && a.hash === b.hash && a.key === b.key && valueEqual(a.state, b.state);
}
function createTransitionManager() {
	var prompt = null;
	function setPrompt(nextPrompt) {
		warning(prompt == null, "A history supports only one prompt at a time");
		prompt = nextPrompt;
		return function() {
			if (prompt === nextPrompt) prompt = null;
		};
	}
	function confirmTransitionTo(location, action, getUserConfirmation, callback) {
		if (prompt != null) {
			var result = typeof prompt === "function" ? prompt(location, action) : prompt;
			if (typeof result === "string") if (typeof getUserConfirmation === "function") getUserConfirmation(result, callback);
			else {
				warning(false, "A history needs a getUserConfirmation function in order to use a prompt message");
				callback(true);
			}
			else callback(result !== false);
		} else callback(true);
	}
	var listeners = [];
	function appendListener(fn) {
		var isActive = true;
		function listener() {
			if (isActive) fn.apply(void 0, arguments);
		}
		listeners.push(listener);
		return function() {
			isActive = false;
			listeners = listeners.filter(function(item) {
				return item !== listener;
			});
		};
	}
	function notifyListeners() {
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
		listeners.forEach(function(listener) {
			return listener.apply(void 0, args);
		});
	}
	return {
		setPrompt,
		confirmTransitionTo,
		appendListener,
		notifyListeners
	};
}
typeof window !== "undefined" && window.document && window.document.createElement;
function clamp(n, lowerBound, upperBound) {
	return Math.min(Math.max(n, lowerBound), upperBound);
}
/**
* Creates a history object that stores locations in memory.
*/
function createMemoryHistory(props) {
	if (props === void 0) props = {};
	var _props = props, getUserConfirmation = _props.getUserConfirmation, _props$initialEntries = _props.initialEntries, initialEntries = _props$initialEntries === void 0 ? ["/"] : _props$initialEntries, _props$initialIndex = _props.initialIndex, initialIndex = _props$initialIndex === void 0 ? 0 : _props$initialIndex, _props$keyLength = _props.keyLength, keyLength = _props$keyLength === void 0 ? 6 : _props$keyLength;
	var transitionManager = createTransitionManager();
	function setState(nextState) {
		_extends(history, nextState);
		history.length = history.entries.length;
		transitionManager.notifyListeners(history.location, history.action);
	}
	function createKey() {
		return Math.random().toString(36).substr(2, keyLength);
	}
	var index = clamp(initialIndex, 0, initialEntries.length - 1);
	var entries = initialEntries.map(function(entry) {
		return typeof entry === "string" ? createLocation(entry, void 0, createKey()) : createLocation(entry, void 0, entry.key || createKey());
	});
	var createHref = createPath;
	function push(path, state) {
		warning(!(typeof path === "object" && path.state !== void 0 && state !== void 0), "You should avoid providing a 2nd state argument to push when the 1st argument is a location-like object that already has state; it is ignored");
		var action = "PUSH";
		var location = createLocation(path, state, createKey(), history.location);
		transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function(ok) {
			if (!ok) return;
			var nextIndex = history.index + 1;
			var nextEntries = history.entries.slice(0);
			if (nextEntries.length > nextIndex) nextEntries.splice(nextIndex, nextEntries.length - nextIndex, location);
			else nextEntries.push(location);
			setState({
				action,
				location,
				index: nextIndex,
				entries: nextEntries
			});
		});
	}
	function replace(path, state) {
		warning(!(typeof path === "object" && path.state !== void 0 && state !== void 0), "You should avoid providing a 2nd state argument to replace when the 1st argument is a location-like object that already has state; it is ignored");
		var action = "REPLACE";
		var location = createLocation(path, state, createKey(), history.location);
		transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function(ok) {
			if (!ok) return;
			history.entries[history.index] = location;
			setState({
				action,
				location
			});
		});
	}
	function go(n) {
		var nextIndex = clamp(history.index + n, 0, history.entries.length - 1);
		var action = "POP";
		var location = history.entries[nextIndex];
		transitionManager.confirmTransitionTo(location, action, getUserConfirmation, function(ok) {
			if (ok) setState({
				action,
				location,
				index: nextIndex
			});
			else setState();
		});
	}
	function goBack() {
		go(-1);
	}
	function goForward() {
		go(1);
	}
	function canGo(n) {
		var nextIndex = history.index + n;
		return nextIndex >= 0 && nextIndex < history.entries.length;
	}
	function block(prompt) {
		if (prompt === void 0) prompt = false;
		return transitionManager.setPrompt(prompt);
	}
	function listen(listener) {
		return transitionManager.appendListener(listener);
	}
	var history = {
		length: entries.length,
		action: "POP",
		location: entries[index],
		index,
		entries,
		createHref,
		push,
		replace,
		go,
		goBack,
		goForward,
		canGo,
		block,
		listen
	};
	return history;
}
//#endregion
//#region node_modules/isarray/index.js
var require_isarray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = Array.isArray || function(arr) {
		return Object.prototype.toString.call(arr) == "[object Array]";
	};
}));
//#endregion
//#region node_modules/path-to-regexp/index.js
var require_path_to_regexp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isarray = require_isarray();
	/**
	* Expose `pathToRegexp`.
	*/
	module.exports = pathToRegexp;
	module.exports.parse = parse;
	module.exports.compile = compile;
	module.exports.tokensToFunction = tokensToFunction;
	module.exports.tokensToRegExp = tokensToRegExp;
	/**
	* The main path matching regexp utility.
	*
	* @type {RegExp}
	*/
	var PATH_REGEXP = new RegExp(["(\\\\.)", "([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))"].join("|"), "g");
	/**
	* Parse a string for the raw tokens.
	*
	* @param  {string}  str
	* @param  {Object=} options
	* @return {!Array}
	*/
	function parse(str, options) {
		var tokens = [];
		var key = 0;
		var index = 0;
		var path = "";
		var defaultDelimiter = options && options.delimiter || "/";
		var res;
		while ((res = PATH_REGEXP.exec(str)) != null) {
			var m = res[0];
			var escaped = res[1];
			var offset = res.index;
			path += str.slice(index, offset);
			index = offset + m.length;
			if (escaped) {
				path += escaped[1];
				continue;
			}
			var next = str[index];
			var prefix = res[2];
			var name = res[3];
			var capture = res[4];
			var group = res[5];
			var modifier = res[6];
			var asterisk = res[7];
			if (path) {
				tokens.push(path);
				path = "";
			}
			var partial = prefix != null && next != null && next !== prefix;
			var repeat = modifier === "+" || modifier === "*";
			var optional = modifier === "?" || modifier === "*";
			var delimiter = prefix || defaultDelimiter;
			var pattern = capture || group;
			var prevText = prefix || (typeof tokens[tokens.length - 1] === "string" ? tokens[tokens.length - 1] : "");
			tokens.push({
				name: name || key++,
				prefix: prefix || "",
				delimiter,
				optional,
				repeat,
				partial,
				asterisk: !!asterisk,
				pattern: pattern ? escapeGroup(pattern) : asterisk ? ".*" : restrictBacktrack(delimiter, prevText)
			});
		}
		if (index < str.length) path += str.substr(index);
		if (path) tokens.push(path);
		return tokens;
	}
	function restrictBacktrack(delimiter, prevText) {
		if (!prevText || prevText.indexOf(delimiter) > -1) return "[^" + escapeString(delimiter) + "]+?";
		return escapeString(prevText) + "|(?:(?!" + escapeString(prevText) + ")[^" + escapeString(delimiter) + "])+?";
	}
	/**
	* Compile a string to a template function for the path.
	*
	* @param  {string}             str
	* @param  {Object=}            options
	* @return {!function(Object=, Object=)}
	*/
	function compile(str, options) {
		return tokensToFunction(parse(str, options), options);
	}
	/**
	* Prettier encoding of URI path segments.
	*
	* @param  {string}
	* @return {string}
	*/
	function encodeURIComponentPretty(str) {
		return encodeURI(str).replace(/[\/?#]/g, function(c) {
			return "%" + c.charCodeAt(0).toString(16).toUpperCase();
		});
	}
	/**
	* Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
	*
	* @param  {string}
	* @return {string}
	*/
	function encodeAsterisk(str) {
		return encodeURI(str).replace(/[?#]/g, function(c) {
			return "%" + c.charCodeAt(0).toString(16).toUpperCase();
		});
	}
	/**
	* Expose a method for transforming tokens into the path function.
	*/
	function tokensToFunction(tokens, options) {
		var matches = new Array(tokens.length);
		for (var i = 0; i < tokens.length; i++) if (typeof tokens[i] === "object") matches[i] = new RegExp("^(?:" + tokens[i].pattern + ")$", flags(options));
		return function(obj, opts) {
			var path = "";
			var data = obj || {};
			var encode = (opts || {}).pretty ? encodeURIComponentPretty : encodeURIComponent;
			for (var i = 0; i < tokens.length; i++) {
				var token = tokens[i];
				if (typeof token === "string") {
					path += token;
					continue;
				}
				var value = data[token.name];
				var segment;
				if (value == null) if (token.optional) {
					if (token.partial) path += token.prefix;
					continue;
				} else throw new TypeError("Expected \"" + token.name + "\" to be defined");
				if (isarray(value)) {
					if (!token.repeat) throw new TypeError("Expected \"" + token.name + "\" to not repeat, but received `" + JSON.stringify(value) + "`");
					if (value.length === 0) if (token.optional) continue;
					else throw new TypeError("Expected \"" + token.name + "\" to not be empty");
					for (var j = 0; j < value.length; j++) {
						segment = encode(value[j]);
						if (!matches[i].test(segment)) throw new TypeError("Expected all \"" + token.name + "\" to match \"" + token.pattern + "\", but received `" + JSON.stringify(segment) + "`");
						path += (j === 0 ? token.prefix : token.delimiter) + segment;
					}
					continue;
				}
				segment = token.asterisk ? encodeAsterisk(value) : encode(value);
				if (!matches[i].test(segment)) throw new TypeError("Expected \"" + token.name + "\" to match \"" + token.pattern + "\", but received \"" + segment + "\"");
				path += token.prefix + segment;
			}
			return path;
		};
	}
	/**
	* Escape a regular expression string.
	*
	* @param  {string} str
	* @return {string}
	*/
	function escapeString(str) {
		return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, "\\$1");
	}
	/**
	* Escape the capturing group by escaping special characters and meaning.
	*
	* @param  {string} group
	* @return {string}
	*/
	function escapeGroup(group) {
		return group.replace(/([=!:$\/()])/g, "\\$1");
	}
	/**
	* Attach the keys as a property of the regexp.
	*
	* @param  {!RegExp} re
	* @param  {Array}   keys
	* @return {!RegExp}
	*/
	function attachKeys(re, keys) {
		re.keys = keys;
		return re;
	}
	/**
	* Get the flags for a regexp from the options.
	*
	* @param  {Object} options
	* @return {string}
	*/
	function flags(options) {
		return options && options.sensitive ? "" : "i";
	}
	/**
	* Pull out keys from a regexp.
	*
	* @param  {!RegExp} path
	* @param  {!Array}  keys
	* @return {!RegExp}
	*/
	function regexpToRegexp(path, keys) {
		var groups = path.source.match(/\((?!\?)/g);
		if (groups) for (var i = 0; i < groups.length; i++) keys.push({
			name: i,
			prefix: null,
			delimiter: null,
			optional: false,
			repeat: false,
			partial: false,
			asterisk: false,
			pattern: null
		});
		return attachKeys(path, keys);
	}
	/**
	* Transform an array into a regexp.
	*
	* @param  {!Array}  path
	* @param  {Array}   keys
	* @param  {!Object} options
	* @return {!RegExp}
	*/
	function arrayToRegexp(path, keys, options) {
		var parts = [];
		for (var i = 0; i < path.length; i++) parts.push(pathToRegexp(path[i], keys, options).source);
		return attachKeys(new RegExp("(?:" + parts.join("|") + ")", flags(options)), keys);
	}
	/**
	* Create a path regexp from string input.
	*
	* @param  {string}  path
	* @param  {!Array}  keys
	* @param  {!Object} options
	* @return {!RegExp}
	*/
	function stringToRegexp(path, keys, options) {
		return tokensToRegExp(parse(path, options), keys, options);
	}
	/**
	* Expose a function for taking tokens and returning a RegExp.
	*
	* @param  {!Array}          tokens
	* @param  {(Array|Object)=} keys
	* @param  {Object=}         options
	* @return {!RegExp}
	*/
	function tokensToRegExp(tokens, keys, options) {
		if (!isarray(keys)) {
			options = keys || options;
			keys = [];
		}
		options = options || {};
		var strict = options.strict;
		var end = options.end !== false;
		var route = "";
		for (var i = 0; i < tokens.length; i++) {
			var token = tokens[i];
			if (typeof token === "string") route += escapeString(token);
			else {
				var prefix = escapeString(token.prefix);
				var capture = "(?:" + token.pattern + ")";
				keys.push(token);
				if (token.repeat) capture += "(?:" + prefix + capture + ")*";
				if (token.optional) if (!token.partial) capture = "(?:" + prefix + "(" + capture + "))?";
				else capture = prefix + "(" + capture + ")?";
				else capture = prefix + "(" + capture + ")";
				route += capture;
			}
		}
		var delimiter = escapeString(options.delimiter || "/");
		var endsWithDelimiter = route.slice(-delimiter.length) === delimiter;
		if (!strict) route = (endsWithDelimiter ? route.slice(0, -delimiter.length) : route) + "(?:" + delimiter + "(?=$))?";
		if (end) route += "$";
		else route += strict && endsWithDelimiter ? "" : "(?=" + delimiter + "|$)";
		return attachKeys(new RegExp("^" + route, flags(options)), keys);
	}
	/**
	* Normalize the given path string, returning a regular expression.
	*
	* An empty array can be passed in for the keys, which will hold the
	* placeholder key descriptions. For example, using `/user/:id`, `keys` will
	* contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
	*
	* @param  {(string|RegExp|Array)} path
	* @param  {(Array|Object)=}       keys
	* @param  {Object=}               options
	* @return {!RegExp}
	*/
	function pathToRegexp(path, keys, options) {
		if (!isarray(keys)) {
			options = keys || options;
			keys = [];
		}
		options = options || {};
		if (path instanceof RegExp) return regexpToRegexp(path, keys);
		if (isarray(path)) return arrayToRegexp(path, keys, options);
		return stringToRegexp(path, keys, options);
	}
}));
//#endregion
//#region node_modules/react-router/esm/react-router.js
init_tiny_warning_esm();
init_extends();
var import_path_to_regexp = /* @__PURE__ */ __toESM(require_path_to_regexp());
var import_react_is = require_react_is();
init_objectWithoutPropertiesLoose();
var import_hoist_non_react_statics_cjs = /* @__PURE__ */ __toESM(require_hoist_non_react_statics_cjs());
var MAX_SIGNED_31_BIT_INT = 1073741823;
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
function getUniqueId() {
	var key = "__global_unique_id__";
	return commonjsGlobal[key] = (commonjsGlobal[key] || 0) + 1;
}
function objectIs(x, y) {
	if (x === y) return x !== 0 || 1 / x === 1 / y;
	else return x !== x && y !== y;
}
function createEventEmitter(value) {
	var handlers = [];
	return {
		on: function on(handler) {
			handlers.push(handler);
		},
		off: function off(handler) {
			handlers = handlers.filter(function(h) {
				return h !== handler;
			});
		},
		get: function get() {
			return value;
		},
		set: function set(newValue, changedBits) {
			value = newValue;
			handlers.forEach(function(handler) {
				return handler(value, changedBits);
			});
		}
	};
}
function onlyChild(children) {
	return Array.isArray(children) ? children[0] : children;
}
function createReactContext(defaultValue, calculateChangedBits) {
	var _Provider$childContex, _Consumer$contextType;
	var contextProp = "__create-react-context-" + getUniqueId() + "__";
	var Provider = /*#__PURE__*/ function(_React$Component) {
		_inheritsLoose(Provider, _React$Component);
		function Provider() {
			var _this;
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			_this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;
			_this.emitter = createEventEmitter(_this.props.value);
			return _this;
		}
		var _proto = Provider.prototype;
		_proto.getChildContext = function getChildContext() {
			var _ref;
			return _ref = {}, _ref[contextProp] = this.emitter, _ref;
		};
		_proto.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
			if (this.props.value !== nextProps.value) {
				var oldValue = this.props.value;
				var newValue = nextProps.value;
				var changedBits;
				if (objectIs(oldValue, newValue)) changedBits = 0;
				else {
					changedBits = typeof calculateChangedBits === "function" ? calculateChangedBits(oldValue, newValue) : MAX_SIGNED_31_BIT_INT;
					warning((changedBits & MAX_SIGNED_31_BIT_INT) === changedBits, "calculateChangedBits: Expected the return value to be a 31-bit integer. Instead received: " + changedBits);
					changedBits |= 0;
					if (changedBits !== 0) this.emitter.set(nextProps.value, changedBits);
				}
			}
		};
		_proto.render = function render() {
			return this.props.children;
		};
		return Provider;
	}(import_react.Component);
	Provider.childContextTypes = (_Provider$childContex = {}, _Provider$childContex[contextProp] = import_prop_types.default.object.isRequired, _Provider$childContex);
	var Consumer = /*#__PURE__*/ function(_React$Component2) {
		_inheritsLoose(Consumer, _React$Component2);
		function Consumer() {
			var _this2;
			for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) args[_key2] = arguments[_key2];
			_this2 = _React$Component2.call.apply(_React$Component2, [this].concat(args)) || this;
			_this2.observedBits = void 0;
			_this2.state = { value: _this2.getValue() };
			_this2.onUpdate = function(newValue, changedBits) {
				if (((_this2.observedBits | 0) & changedBits) !== 0) _this2.setState({ value: _this2.getValue() });
			};
			return _this2;
		}
		var _proto2 = Consumer.prototype;
		_proto2.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
			var observedBits = nextProps.observedBits;
			this.observedBits = observedBits === void 0 || observedBits === null ? MAX_SIGNED_31_BIT_INT : observedBits;
		};
		_proto2.componentDidMount = function componentDidMount() {
			if (this.context[contextProp]) this.context[contextProp].on(this.onUpdate);
			var observedBits = this.props.observedBits;
			this.observedBits = observedBits === void 0 || observedBits === null ? MAX_SIGNED_31_BIT_INT : observedBits;
		};
		_proto2.componentWillUnmount = function componentWillUnmount() {
			if (this.context[contextProp]) this.context[contextProp].off(this.onUpdate);
		};
		_proto2.getValue = function getValue() {
			if (this.context[contextProp]) return this.context[contextProp].get();
			else return defaultValue;
		};
		_proto2.render = function render() {
			return onlyChild(this.props.children)(this.state.value);
		};
		return Consumer;
	}(import_react.Component);
	Consumer.contextTypes = (_Consumer$contextType = {}, _Consumer$contextType[contextProp] = import_prop_types.default.object, _Consumer$contextType);
	return {
		Provider,
		Consumer
	};
}
var createContext = import_react.createContext || createReactContext;
var createNamedContext = function createNamedContext(name) {
	var context = createContext();
	context.displayName = name;
	return context;
};
var historyContext = /*#__PURE__*/ createNamedContext("Router-History");
var context = /*#__PURE__*/ createNamedContext("Router");
/**
* The public API for putting history on context.
*/
var Router = /*#__PURE__*/ function(_React$Component) {
	_inheritsLoose(Router, _React$Component);
	Router.computeRootMatch = function computeRootMatch(pathname) {
		return {
			path: "/",
			url: "/",
			params: {},
			isExact: pathname === "/"
		};
	};
	function Router(props) {
		var _this = _React$Component.call(this, props) || this;
		_this.state = { location: props.history.location };
		_this._isMounted = false;
		_this._pendingLocation = null;
		if (!props.staticContext) _this.unlisten = props.history.listen(function(location) {
			_this._pendingLocation = location;
		});
		return _this;
	}
	var _proto = Router.prototype;
	_proto.componentDidMount = function componentDidMount() {
		var _this2 = this;
		this._isMounted = true;
		if (this.unlisten) this.unlisten();
		if (!this.props.staticContext) this.unlisten = this.props.history.listen(function(location) {
			if (_this2._isMounted) _this2.setState({ location });
		});
		if (this._pendingLocation) this.setState({ location: this._pendingLocation });
	};
	_proto.componentWillUnmount = function componentWillUnmount() {
		if (this.unlisten) {
			this.unlisten();
			this._isMounted = false;
			this._pendingLocation = null;
		}
	};
	_proto.render = function render() {
		return /*#__PURE__*/ import_react.createElement(context.Provider, { value: {
			history: this.props.history,
			location: this.state.location,
			match: Router.computeRootMatch(this.state.location.pathname),
			staticContext: this.props.staticContext
		} }, /*#__PURE__*/ import_react.createElement(historyContext.Provider, {
			children: this.props.children || null,
			value: this.props.history
		}));
	};
	return Router;
}(import_react.Component);
Router.propTypes = {
	children: import_prop_types.default.node,
	history: import_prop_types.default.object.isRequired,
	staticContext: import_prop_types.default.object
};
Router.prototype.componentDidUpdate = function(prevProps) {
	warning(prevProps.history === this.props.history, "You cannot change <Router history>");
};
/**
* The public API for a <Router> that stores location in memory.
*/
var MemoryRouter = /*#__PURE__*/ function(_React$Component) {
	_inheritsLoose(MemoryRouter, _React$Component);
	function MemoryRouter() {
		var _this;
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
		_this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;
		_this.history = createMemoryHistory(_this.props);
		return _this;
	}
	var _proto = MemoryRouter.prototype;
	_proto.render = function render() {
		return /*#__PURE__*/ import_react.createElement(Router, {
			history: this.history,
			children: this.props.children
		});
	};
	return MemoryRouter;
}(import_react.Component);
MemoryRouter.propTypes = {
	initialEntries: import_prop_types.default.array,
	initialIndex: import_prop_types.default.number,
	getUserConfirmation: import_prop_types.default.func,
	keyLength: import_prop_types.default.number,
	children: import_prop_types.default.node
};
MemoryRouter.prototype.componentDidMount = function() {
	warning(!this.props.history, "<MemoryRouter> ignores the history prop. To use a custom history, use `import { Router }` instead of `import { MemoryRouter as Router }`.");
};
var Lifecycle = /*#__PURE__*/ function(_React$Component) {
	_inheritsLoose(Lifecycle, _React$Component);
	function Lifecycle() {
		return _React$Component.apply(this, arguments) || this;
	}
	var _proto = Lifecycle.prototype;
	_proto.componentDidMount = function componentDidMount() {
		if (this.props.onMount) this.props.onMount.call(this, this);
	};
	_proto.componentDidUpdate = function componentDidUpdate(prevProps) {
		if (this.props.onUpdate) this.props.onUpdate.call(this, this, prevProps);
	};
	_proto.componentWillUnmount = function componentWillUnmount() {
		if (this.props.onUnmount) this.props.onUnmount.call(this, this);
	};
	_proto.render = function render() {
		return null;
	};
	return Lifecycle;
}(import_react.Component);
/**
* The public API for prompting the user before navigating away from a screen.
*/
function Prompt(_ref) {
	var message = _ref.message, _ref$when = _ref.when, when = _ref$when === void 0 ? true : _ref$when;
	return /*#__PURE__*/ import_react.createElement(context.Consumer, null, function(context) {
		!context && invariant(false, "You should not use <Prompt> outside a <Router>");
		if (!when || context.staticContext) return null;
		var method = context.history.block;
		return /*#__PURE__*/ import_react.createElement(Lifecycle, {
			onMount: function onMount(self) {
				self.release = method(message);
			},
			onUpdate: function onUpdate(self, prevProps) {
				if (prevProps.message !== message) {
					self.release();
					self.release = method(message);
				}
			},
			onUnmount: function onUnmount(self) {
				self.release();
			},
			message
		});
	});
}
var messageType = import_prop_types.default.oneOfType([import_prop_types.default.func, import_prop_types.default.string]);
Prompt.propTypes = {
	when: import_prop_types.default.bool,
	message: messageType.isRequired
};
var cache = {};
var cacheLimit = 1e4;
var cacheCount = 0;
function compilePath(path) {
	if (cache[path]) return cache[path];
	var generator = import_path_to_regexp.default.compile(path);
	if (cacheCount < cacheLimit) {
		cache[path] = generator;
		cacheCount++;
	}
	return generator;
}
/**
* Public API for generating a URL pathname from a path and parameters.
*/
function generatePath(path, params) {
	if (path === void 0) path = "/";
	if (params === void 0) params = {};
	return path === "/" ? path : compilePath(path)(params, { pretty: true });
}
/**
* The public API for navigating programmatically with a component.
*/
function Redirect(_ref) {
	var computedMatch = _ref.computedMatch, to = _ref.to, _ref$push = _ref.push, push = _ref$push === void 0 ? false : _ref$push;
	return /*#__PURE__*/ import_react.createElement(context.Consumer, null, function(context) {
		!context && invariant(false, "You should not use <Redirect> outside a <Router>");
		var history = context.history, staticContext = context.staticContext;
		var method = push ? history.push : history.replace;
		var location = createLocation(computedMatch ? typeof to === "string" ? generatePath(to, computedMatch.params) : _extends({}, to, { pathname: generatePath(to.pathname, computedMatch.params) }) : to);
		if (staticContext) {
			method(location);
			return null;
		}
		return /*#__PURE__*/ import_react.createElement(Lifecycle, {
			onMount: function onMount() {
				method(location);
			},
			onUpdate: function onUpdate(self, prevProps) {
				var prevLocation = createLocation(prevProps.to);
				if (!locationsAreEqual(prevLocation, _extends({}, location, { key: prevLocation.key }))) method(location);
			},
			to
		});
	});
}
Redirect.propTypes = {
	push: import_prop_types.default.bool,
	from: import_prop_types.default.string,
	to: import_prop_types.default.oneOfType([import_prop_types.default.string, import_prop_types.default.object]).isRequired
};
var cache$1 = {};
var cacheLimit$1 = 1e4;
var cacheCount$1 = 0;
function compilePath$1(path, options) {
	var cacheKey = "" + options.end + options.strict + options.sensitive;
	var pathCache = cache$1[cacheKey] || (cache$1[cacheKey] = {});
	if (pathCache[path]) return pathCache[path];
	var keys = [];
	var result = {
		regexp: (0, import_path_to_regexp.default)(path, keys, options),
		keys
	};
	if (cacheCount$1 < cacheLimit$1) {
		pathCache[path] = result;
		cacheCount$1++;
	}
	return result;
}
/**
* Public API for matching a URL pathname to a path.
*/
function matchPath(pathname, options) {
	if (options === void 0) options = {};
	if (typeof options === "string" || Array.isArray(options)) options = { path: options };
	var _options = options, path = _options.path, _options$exact = _options.exact, exact = _options$exact === void 0 ? false : _options$exact, _options$strict = _options.strict, strict = _options$strict === void 0 ? false : _options$strict, _options$sensitive = _options.sensitive, sensitive = _options$sensitive === void 0 ? false : _options$sensitive;
	return [].concat(path).reduce(function(matched, path) {
		if (!path && path !== "") return null;
		if (matched) return matched;
		var _compilePath = compilePath$1(path, {
			end: exact,
			strict,
			sensitive
		}), regexp = _compilePath.regexp, keys = _compilePath.keys;
		var match = regexp.exec(pathname);
		if (!match) return null;
		var url = match[0], values = match.slice(1);
		var isExact = pathname === url;
		if (exact && !isExact) return null;
		return {
			path,
			url: path === "/" && url === "" ? "/" : url,
			isExact,
			params: keys.reduce(function(memo, key, index) {
				memo[key.name] = values[index];
				return memo;
			}, {})
		};
	}, null);
}
function isEmptyChildren(children) {
	return import_react.Children.count(children) === 0;
}
function evalChildrenDev(children, props, path) {
	var value = children(props);
	warning(value !== void 0, "You returned `undefined` from the `children` function of " + ("<Route" + (path ? " path=\"" + path + "\"" : "") + ">, but you ") + "should have returned a React element or `null`");
	return value || null;
}
/**
* The public API for matching a single path and rendering.
*/
var Route = /*#__PURE__*/ function(_React$Component) {
	_inheritsLoose(Route, _React$Component);
	function Route() {
		return _React$Component.apply(this, arguments) || this;
	}
	var _proto = Route.prototype;
	_proto.render = function render() {
		var _this = this;
		return /*#__PURE__*/ import_react.createElement(context.Consumer, null, function(context$1) {
			!context$1 && invariant(false, "You should not use <Route> outside a <Router>");
			var location = _this.props.location || context$1.location;
			var props = _extends({}, context$1, {
				location,
				match: _this.props.computedMatch ? _this.props.computedMatch : _this.props.path ? matchPath(location.pathname, _this.props) : context$1.match
			});
			var _this$props = _this.props, children = _this$props.children, component = _this$props.component, render = _this$props.render;
			if (Array.isArray(children) && isEmptyChildren(children)) children = null;
			return /*#__PURE__*/ import_react.createElement(context.Provider, { value: props }, props.match ? children ? typeof children === "function" ? evalChildrenDev(children, props, _this.props.path) : children : component ? /*#__PURE__*/ import_react.createElement(component, props) : render ? render(props) : null : typeof children === "function" ? evalChildrenDev(children, props, _this.props.path) : null);
		});
	};
	return Route;
}(import_react.Component);
Route.propTypes = {
	children: import_prop_types.default.oneOfType([import_prop_types.default.func, import_prop_types.default.node]),
	component: function component(props, propName) {
		if (props[propName] && !(0, import_react_is.isValidElementType)(props[propName])) return /* @__PURE__ */ new Error("Invalid prop 'component' supplied to 'Route': the prop is not a valid React component");
	},
	exact: import_prop_types.default.bool,
	location: import_prop_types.default.object,
	path: import_prop_types.default.oneOfType([import_prop_types.default.string, import_prop_types.default.arrayOf(import_prop_types.default.string)]),
	render: import_prop_types.default.func,
	sensitive: import_prop_types.default.bool,
	strict: import_prop_types.default.bool
};
Route.prototype.componentDidMount = function() {
	warning(!(this.props.children && !isEmptyChildren(this.props.children) && this.props.component), "You should not use <Route component> and <Route children> in the same route; <Route component> will be ignored");
	warning(!(this.props.children && !isEmptyChildren(this.props.children) && this.props.render), "You should not use <Route render> and <Route children> in the same route; <Route render> will be ignored");
	warning(!(this.props.component && this.props.render), "You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored");
};
Route.prototype.componentDidUpdate = function(prevProps) {
	warning(!(this.props.location && !prevProps.location), "<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no \"location\" prop and then provided one on a subsequent render.");
	warning(!(!this.props.location && prevProps.location), "<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a \"location\" prop initially but omitted it on a subsequent render.");
};
function addLeadingSlash(path) {
	return path.charAt(0) === "/" ? path : "/" + path;
}
function addBasename(basename, location) {
	if (!basename) return location;
	return _extends({}, location, { pathname: addLeadingSlash(basename) + location.pathname });
}
function stripBasename(basename, location) {
	if (!basename) return location;
	var base = addLeadingSlash(basename);
	if (location.pathname.indexOf(base) !== 0) return location;
	return _extends({}, location, { pathname: location.pathname.substr(base.length) });
}
function createURL(location) {
	return typeof location === "string" ? location : createPath(location);
}
function staticHandler(methodName) {
	return function() {
		invariant(false, "You cannot %s with <StaticRouter>", methodName);
	};
}
function noop() {}
/**
* The public top-level API for a "static" <Router>, so-called because it
* can't actually change the current location. Instead, it just records
* location changes in a context object. Useful mainly in testing and
* server-rendering scenarios.
*/
var StaticRouter = /*#__PURE__*/ function(_React$Component) {
	_inheritsLoose(StaticRouter, _React$Component);
	function StaticRouter() {
		var _this;
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
		_this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;
		_this.handlePush = function(location) {
			return _this.navigateTo(location, "PUSH");
		};
		_this.handleReplace = function(location) {
			return _this.navigateTo(location, "REPLACE");
		};
		_this.handleListen = function() {
			return noop;
		};
		_this.handleBlock = function() {
			return noop;
		};
		return _this;
	}
	var _proto = StaticRouter.prototype;
	_proto.navigateTo = function navigateTo(location, action) {
		var _this$props = this.props, _this$props$basename = _this$props.basename, basename = _this$props$basename === void 0 ? "" : _this$props$basename, _this$props$context = _this$props.context, context = _this$props$context === void 0 ? {} : _this$props$context;
		context.action = action;
		context.location = addBasename(basename, createLocation(location));
		context.url = createURL(context.location);
	};
	_proto.render = function render() {
		var _this$props2 = this.props, _this$props2$basename = _this$props2.basename, basename = _this$props2$basename === void 0 ? "" : _this$props2$basename, _this$props2$context = _this$props2.context, context = _this$props2$context === void 0 ? {} : _this$props2$context, _this$props2$location = _this$props2.location, location = _this$props2$location === void 0 ? "/" : _this$props2$location, rest = _objectWithoutPropertiesLoose(_this$props2, [
			"basename",
			"context",
			"location"
		]);
		var history = {
			createHref: function createHref(path) {
				return addLeadingSlash(basename + createURL(path));
			},
			action: "POP",
			location: stripBasename(basename, createLocation(location)),
			push: this.handlePush,
			replace: this.handleReplace,
			go: staticHandler("go"),
			goBack: staticHandler("goBack"),
			goForward: staticHandler("goForward"),
			listen: this.handleListen,
			block: this.handleBlock
		};
		return /*#__PURE__*/ import_react.createElement(Router, _extends({}, rest, {
			history,
			staticContext: context
		}));
	};
	return StaticRouter;
}(import_react.Component);
StaticRouter.propTypes = {
	basename: import_prop_types.default.string,
	context: import_prop_types.default.object,
	location: import_prop_types.default.oneOfType([import_prop_types.default.string, import_prop_types.default.object])
};
StaticRouter.prototype.componentDidMount = function() {
	warning(!this.props.history, "<StaticRouter> ignores the history prop. To use a custom history, use `import { Router }` instead of `import { StaticRouter as Router }`.");
};
/**
* The public API for rendering the first <Route> that matches.
*/
var Switch = /*#__PURE__*/ function(_React$Component) {
	_inheritsLoose(Switch, _React$Component);
	function Switch() {
		return _React$Component.apply(this, arguments) || this;
	}
	var _proto = Switch.prototype;
	_proto.render = function render() {
		var _this = this;
		return /*#__PURE__*/ import_react.createElement(context.Consumer, null, function(context) {
			!context && invariant(false, "You should not use <Switch> outside a <Router>");
			var location = _this.props.location || context.location;
			var element, match;
			import_react.Children.forEach(_this.props.children, function(child) {
				if (match == null && /*#__PURE__*/ import_react.isValidElement(child)) {
					element = child;
					var path = child.props.path || child.props.from;
					match = path ? matchPath(location.pathname, _extends({}, child.props, { path })) : context.match;
				}
			});
			return match ? /*#__PURE__*/ import_react.cloneElement(element, {
				location,
				computedMatch: match
			}) : null;
		});
	};
	return Switch;
}(import_react.Component);
Switch.propTypes = {
	children: import_prop_types.default.node,
	location: import_prop_types.default.object
};
Switch.prototype.componentDidUpdate = function(prevProps) {
	warning(!(this.props.location && !prevProps.location), "<Switch> elements should not change from uncontrolled to controlled (or vice versa). You initially used no \"location\" prop and then provided one on a subsequent render.");
	warning(!(!this.props.location && prevProps.location), "<Switch> elements should not change from controlled to uncontrolled (or vice versa). You provided a \"location\" prop initially but omitted it on a subsequent render.");
};
/**
* A public higher-order component to access the imperative API
*/
function withRouter(Component) {
	var displayName = "withRouter(" + (Component.displayName || Component.name) + ")";
	var C = function C(props) {
		var wrappedComponentRef = props.wrappedComponentRef, remainingProps = _objectWithoutPropertiesLoose(props, ["wrappedComponentRef"]);
		return /*#__PURE__*/ import_react.createElement(context.Consumer, null, function(context) {
			!context && invariant(false, "You should not use <" + displayName + " /> outside a <Router>");
			return /*#__PURE__*/ import_react.createElement(Component, _extends({}, remainingProps, context, { ref: wrappedComponentRef }));
		});
	};
	C.displayName = displayName;
	C.WrappedComponent = Component;
	C.propTypes = { wrappedComponentRef: import_prop_types.default.oneOfType([
		import_prop_types.default.string,
		import_prop_types.default.func,
		import_prop_types.default.object
	]) };
	return (0, import_hoist_non_react_statics_cjs.default)(C, Component);
}
import_react.useContext;
if (typeof window !== "undefined") {
	var global$1 = window;
	var key = "__react_router_build__";
	var buildNames = {
		cjs: "CommonJS",
		esm: "ES modules",
		umd: "UMD"
	};
	if (global$1[key] && global$1[key] !== "esm") {
		var initialBuildName = buildNames[global$1[key]];
		var secondaryBuildName = buildNames["esm"];
		throw new Error("You are loading the " + secondaryBuildName + " build of React Router " + ("on a page that is already running the " + initialBuildName + " ") + "build, so things won't work right.");
	}
	global$1[key] = "esm";
}
//#endregion
export { withRouter as n, MemoryRouter as t };
