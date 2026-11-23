const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./toast-BDZwxMgs.js","./toast-C8a1ReSo.js","./toast-oEOJ74Oh.css","./native-i18n-CDR8oTIV.js","./native-i18n-Bya1piKW.js","./i18nInstance-DFZX1Hui.js","./native-store-Cv9rukmV.js","./native-store-B_9Z_F59.js","./memberCheckout-BKXbAyEx.js","./actions-BwRPwnFF.js","./kioskConfigApi-68IKDHob.js"])))=>i.map(i=>d[i]);
import { d as __toESM, o as __commonJSMin } from "./toast-C8a1ReSo.js";
//#region node_modules/axios/lib/helpers/bind.js
var require_bind = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function bind(fn, thisArg) {
		return function wrap() {
			var args = new Array(arguments.length);
			for (var i = 0; i < args.length; i++) args[i] = arguments[i];
			return fn.apply(thisArg, args);
		};
	};
}));
//#endregion
//#region node_modules/is-buffer/index.js
var require_is_buffer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/*!
	* Determine if an object is a Buffer
	*
	* @author   Feross Aboukhadijeh <https://feross.org>
	* @license  MIT
	*/
	module.exports = function isBuffer(obj) {
		return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
	};
}));
//#endregion
//#region node_modules/axios/lib/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var bind = require_bind();
	var isBuffer = require_is_buffer();
	var toString = Object.prototype.toString;
	/**
	* Determine if a value is an Array
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is an Array, otherwise false
	*/
	function isArray(val) {
		return toString.call(val) === "[object Array]";
	}
	/**
	* Determine if a value is an ArrayBuffer
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is an ArrayBuffer, otherwise false
	*/
	function isArrayBuffer(val) {
		return toString.call(val) === "[object ArrayBuffer]";
	}
	/**
	* Determine if a value is a FormData
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is an FormData, otherwise false
	*/
	function isFormData(val) {
		return typeof FormData !== "undefined" && val instanceof FormData;
	}
	/**
	* Determine if a value is a view on an ArrayBuffer
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
	*/
	function isArrayBufferView(val) {
		var result;
		if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) result = ArrayBuffer.isView(val);
		else result = val && val.buffer && val.buffer instanceof ArrayBuffer;
		return result;
	}
	/**
	* Determine if a value is a String
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is a String, otherwise false
	*/
	function isString(val) {
		return typeof val === "string";
	}
	/**
	* Determine if a value is a Number
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is a Number, otherwise false
	*/
	function isNumber(val) {
		return typeof val === "number";
	}
	/**
	* Determine if a value is undefined
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if the value is undefined, otherwise false
	*/
	function isUndefined(val) {
		return typeof val === "undefined";
	}
	/**
	* Determine if a value is an Object
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is an Object, otherwise false
	*/
	function isObject(val) {
		return val !== null && typeof val === "object";
	}
	/**
	* Determine if a value is a Date
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is a Date, otherwise false
	*/
	function isDate(val) {
		return toString.call(val) === "[object Date]";
	}
	/**
	* Determine if a value is a File
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is a File, otherwise false
	*/
	function isFile(val) {
		return toString.call(val) === "[object File]";
	}
	/**
	* Determine if a value is a Blob
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is a Blob, otherwise false
	*/
	function isBlob(val) {
		return toString.call(val) === "[object Blob]";
	}
	/**
	* Determine if a value is a Function
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is a Function, otherwise false
	*/
	function isFunction(val) {
		return toString.call(val) === "[object Function]";
	}
	/**
	* Determine if a value is a Stream
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is a Stream, otherwise false
	*/
	function isStream(val) {
		return isObject(val) && isFunction(val.pipe);
	}
	/**
	* Determine if a value is a URLSearchParams object
	*
	* @param {Object} val The value to test
	* @returns {boolean} True if value is a URLSearchParams object, otherwise false
	*/
	function isURLSearchParams(val) {
		return typeof URLSearchParams !== "undefined" && val instanceof URLSearchParams;
	}
	/**
	* Trim excess whitespace off the beginning and end of a string
	*
	* @param {String} str The String to trim
	* @returns {String} The String freed of excess whitespace
	*/
	function trim(str) {
		return str.replace(/^\s*/, "").replace(/\s*$/, "");
	}
	/**
	* Determine if we're running in a standard browser environment
	*
	* This allows axios to run in a web worker, and react-native.
	* Both environments support XMLHttpRequest, but not fully standard globals.
	*
	* web workers:
	*  typeof window -> undefined
	*  typeof document -> undefined
	*
	* react-native:
	*  navigator.product -> 'ReactNative'
	*/
	function isStandardBrowserEnv() {
		if (typeof navigator !== "undefined" && navigator.product === "ReactNative") return false;
		return typeof window !== "undefined" && typeof document !== "undefined";
	}
	/**
	* Iterate over an Array or an Object invoking a function for each item.
	*
	* If `obj` is an Array callback will be called passing
	* the value, index, and complete array for each item.
	*
	* If 'obj' is an Object callback will be called passing
	* the value, key, and complete object for each property.
	*
	* @param {Object|Array} obj The object to iterate
	* @param {Function} fn The callback to invoke for each item
	*/
	function forEach(obj, fn) {
		if (obj === null || typeof obj === "undefined") return;
		if (typeof obj !== "object") obj = [obj];
		if (isArray(obj)) for (var i = 0, l = obj.length; i < l; i++) fn.call(null, obj[i], i, obj);
		else for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) fn.call(null, obj[key], key, obj);
	}
	/**
	* Accepts varargs expecting each argument to be an object, then
	* immutably merges the properties of each object and returns result.
	*
	* When multiple objects contain the same key the later object in
	* the arguments list will take precedence.
	*
	* Example:
	*
	* ```js
	* var result = merge({foo: 123}, {foo: 456});
	* console.log(result.foo); // outputs 456
	* ```
	*
	* @param {Object} obj1 Object to merge
	* @returns {Object} Result of all merge properties
	*/
	function merge() {
		var result = {};
		function assignValue(val, key) {
			if (typeof result[key] === "object" && typeof val === "object") result[key] = merge(result[key], val);
			else result[key] = val;
		}
		for (var i = 0, l = arguments.length; i < l; i++) forEach(arguments[i], assignValue);
		return result;
	}
	/**
	* Extends object a by mutably adding to it the properties of object b.
	*
	* @param {Object} a The object to be extended
	* @param {Object} b The object to copy properties from
	* @param {Object} thisArg The object to bind function to
	* @return {Object} The resulting value of object a
	*/
	function extend(a, b, thisArg) {
		forEach(b, function assignValue(val, key) {
			if (thisArg && typeof val === "function") a[key] = bind(val, thisArg);
			else a[key] = val;
		});
		return a;
	}
	module.exports = {
		isArray,
		isArrayBuffer,
		isBuffer,
		isFormData,
		isArrayBufferView,
		isString,
		isNumber,
		isObject,
		isUndefined,
		isDate,
		isFile,
		isBlob,
		isFunction,
		isStream,
		isURLSearchParams,
		isStandardBrowserEnv,
		forEach,
		merge,
		extend,
		trim
	};
}));
//#endregion
//#region node_modules/axios/lib/helpers/normalizeHeaderName.js
var require_normalizeHeaderName = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	module.exports = function normalizeHeaderName(headers, normalizedName) {
		utils.forEach(headers, function processHeader(value, name) {
			if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
				headers[normalizedName] = value;
				delete headers[name];
			}
		});
	};
}));
//#endregion
//#region node_modules/axios/lib/core/enhanceError.js
var require_enhanceError = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Update an Error with the specified config, error code, and response.
	*
	* @param {Error} error The error to update.
	* @param {Object} config The config.
	* @param {string} [code] The error code (for example, 'ECONNABORTED').
	* @param {Object} [request] The request.
	* @param {Object} [response] The response.
	* @returns {Error} The error.
	*/
	module.exports = function enhanceError(error, config, code, request, response) {
		error.config = config;
		if (code) error.code = code;
		error.request = request;
		error.response = response;
		return error;
	};
}));
//#endregion
//#region node_modules/axios/lib/core/createError.js
var require_createError = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var enhanceError = require_enhanceError();
	/**
	* Create an Error with the specified message, config, error code, request and response.
	*
	* @param {string} message The error message.
	* @param {Object} config The config.
	* @param {string} [code] The error code (for example, 'ECONNABORTED').
	* @param {Object} [request] The request.
	* @param {Object} [response] The response.
	* @returns {Error} The created error.
	*/
	module.exports = function createError(message, config, code, request, response) {
		return enhanceError(new Error(message), config, code, request, response);
	};
}));
//#endregion
//#region node_modules/axios/lib/core/settle.js
var require_settle = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var createError = require_createError();
	/**
	* Resolve or reject a Promise based on response status.
	*
	* @param {Function} resolve A function that resolves the promise.
	* @param {Function} reject A function that rejects the promise.
	* @param {object} response The response.
	*/
	module.exports = function settle(resolve, reject, response) {
		var validateStatus = response.config.validateStatus;
		if (!response.status || !validateStatus || validateStatus(response.status)) resolve(response);
		else reject(createError("Request failed with status code " + response.status, response.config, null, response.request, response));
	};
}));
//#endregion
//#region node_modules/axios/lib/helpers/buildURL.js
var require_buildURL = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	function encode(val) {
		return encodeURIComponent(val).replace(/%40/gi, "@").replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
	}
	/**
	* Build a URL by appending params to the end
	*
	* @param {string} url The base of the url (e.g., http://www.google.com)
	* @param {object} [params] The params to be appended
	* @returns {string} The formatted url
	*/
	module.exports = function buildURL(url, params, paramsSerializer) {
		if (!params) return url;
		var serializedParams;
		if (paramsSerializer) serializedParams = paramsSerializer(params);
		else if (utils.isURLSearchParams(params)) serializedParams = params.toString();
		else {
			var parts = [];
			utils.forEach(params, function serialize(val, key) {
				if (val === null || typeof val === "undefined") return;
				if (utils.isArray(val)) key = key + "[]";
				else val = [val];
				utils.forEach(val, function parseValue(v) {
					if (utils.isDate(v)) v = v.toISOString();
					else if (utils.isObject(v)) v = JSON.stringify(v);
					parts.push(encode(key) + "=" + encode(v));
				});
			});
			serializedParams = parts.join("&");
		}
		if (serializedParams) url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
		return url;
	};
}));
//#endregion
//#region node_modules/axios/lib/helpers/parseHeaders.js
var require_parseHeaders = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var ignoreDuplicateOf = [
		"age",
		"authorization",
		"content-length",
		"content-type",
		"etag",
		"expires",
		"from",
		"host",
		"if-modified-since",
		"if-unmodified-since",
		"last-modified",
		"location",
		"max-forwards",
		"proxy-authorization",
		"referer",
		"retry-after",
		"user-agent"
	];
	/**
	* Parse headers into an object
	*
	* ```
	* Date: Wed, 27 Aug 2014 08:58:49 GMT
	* Content-Type: application/json
	* Connection: keep-alive
	* Transfer-Encoding: chunked
	* ```
	*
	* @param {String} headers Headers needing to be parsed
	* @returns {Object} Headers parsed into an object
	*/
	module.exports = function parseHeaders(headers) {
		var parsed = {};
		var key;
		var val;
		var i;
		if (!headers) return parsed;
		utils.forEach(headers.split("\n"), function parser(line) {
			i = line.indexOf(":");
			key = utils.trim(line.substr(0, i)).toLowerCase();
			val = utils.trim(line.substr(i + 1));
			if (key) {
				if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) return;
				if (key === "set-cookie") parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
				else parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
			}
		});
		return parsed;
	};
}));
//#endregion
//#region node_modules/axios/lib/helpers/isURLSameOrigin.js
var require_isURLSameOrigin = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	module.exports = utils.isStandardBrowserEnv() ? (function standardBrowserEnv() {
		var msie = /(msie|trident)/i.test(navigator.userAgent);
		var urlParsingNode = document.createElement("a");
		var originURL;
		/**
		* Parse a URL to discover it's components
		*
		* @param {String} url The URL to be parsed
		* @returns {Object}
		*/
		function resolveURL(url) {
			var href = url;
			if (msie) {
				urlParsingNode.setAttribute("href", href);
				href = urlParsingNode.href;
			}
			urlParsingNode.setAttribute("href", href);
			return {
				href: urlParsingNode.href,
				protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, "") : "",
				host: urlParsingNode.host,
				search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, "") : "",
				hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, "") : "",
				hostname: urlParsingNode.hostname,
				port: urlParsingNode.port,
				pathname: urlParsingNode.pathname.charAt(0) === "/" ? urlParsingNode.pathname : "/" + urlParsingNode.pathname
			};
		}
		originURL = resolveURL(window.location.href);
		/**
		* Determine if a URL shares the same origin as the current location
		*
		* @param {String} requestURL The URL to test
		* @returns {boolean} True if URL shares the same origin, otherwise false
		*/
		return function isURLSameOrigin(requestURL) {
			var parsed = utils.isString(requestURL) ? resolveURL(requestURL) : requestURL;
			return parsed.protocol === originURL.protocol && parsed.host === originURL.host;
		};
	})() : (function nonStandardBrowserEnv() {
		return function isURLSameOrigin() {
			return true;
		};
	})();
}));
//#endregion
//#region node_modules/axios/lib/helpers/cookies.js
var require_cookies = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	module.exports = utils.isStandardBrowserEnv() ? (function standardBrowserEnv() {
		return {
			write: function write(name, value, expires, path, domain, secure) {
				var cookie = [];
				cookie.push(name + "=" + encodeURIComponent(value));
				if (utils.isNumber(expires)) cookie.push("expires=" + new Date(expires).toGMTString());
				if (utils.isString(path)) cookie.push("path=" + path);
				if (utils.isString(domain)) cookie.push("domain=" + domain);
				if (secure === true) cookie.push("secure");
				document.cookie = cookie.join("; ");
			},
			read: function read(name) {
				var match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
				return match ? decodeURIComponent(match[3]) : null;
			},
			remove: function remove(name) {
				this.write(name, "", Date.now() - 864e5);
			}
		};
	})() : (function nonStandardBrowserEnv() {
		return {
			write: function write() {},
			read: function read() {
				return null;
			},
			remove: function remove() {}
		};
	})();
}));
//#endregion
//#region node_modules/axios/lib/adapters/xhr.js
var require_xhr = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var settle = require_settle();
	var buildURL = require_buildURL();
	var parseHeaders = require_parseHeaders();
	var isURLSameOrigin = require_isURLSameOrigin();
	var createError = require_createError();
	module.exports = function xhrAdapter(config) {
		return new Promise(function dispatchXhrRequest(resolve, reject) {
			var requestData = config.data;
			var requestHeaders = config.headers;
			if (utils.isFormData(requestData)) delete requestHeaders["Content-Type"];
			var request = new XMLHttpRequest();
			if (config.auth) {
				var username = config.auth.username || "";
				var password = config.auth.password || "";
				requestHeaders.Authorization = "Basic " + btoa(username + ":" + password);
			}
			request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);
			request.timeout = config.timeout;
			request.onreadystatechange = function handleLoad() {
				if (!request || request.readyState !== 4) return;
				if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) return;
				var responseHeaders = "getAllResponseHeaders" in request ? parseHeaders(request.getAllResponseHeaders()) : null;
				settle(resolve, reject, {
					data: !config.responseType || config.responseType === "text" ? request.responseText : request.response,
					status: request.status,
					statusText: request.statusText,
					headers: responseHeaders,
					config,
					request
				});
				request = null;
			};
			request.onerror = function handleError() {
				reject(createError("Network Error", config, null, request));
				request = null;
			};
			request.ontimeout = function handleTimeout() {
				reject(createError("timeout of " + config.timeout + "ms exceeded", config, "ECONNABORTED", request));
				request = null;
			};
			if (utils.isStandardBrowserEnv()) {
				var cookies = require_cookies();
				var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ? cookies.read(config.xsrfCookieName) : void 0;
				if (xsrfValue) requestHeaders[config.xsrfHeaderName] = xsrfValue;
			}
			if ("setRequestHeader" in request) utils.forEach(requestHeaders, function setRequestHeader(val, key) {
				if (typeof requestData === "undefined" && key.toLowerCase() === "content-type") delete requestHeaders[key];
				else request.setRequestHeader(key, val);
			});
			if (config.withCredentials) request.withCredentials = true;
			if (config.responseType) try {
				request.responseType = config.responseType;
			} catch (e) {
				if (config.responseType !== "json") throw e;
			}
			if (typeof config.onDownloadProgress === "function") request.addEventListener("progress", config.onDownloadProgress);
			if (typeof config.onUploadProgress === "function" && request.upload) request.upload.addEventListener("progress", config.onUploadProgress);
			if (config.cancelToken) config.cancelToken.promise.then(function onCanceled(cancel) {
				if (!request) return;
				request.abort();
				reject(cancel);
				request = null;
			});
			if (requestData === void 0) requestData = null;
			request.send(requestData);
		});
	};
}));
//#endregion
//#region node_modules/axios/lib/defaults.js
var require_defaults = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var normalizeHeaderName = require_normalizeHeaderName();
	var DEFAULT_CONTENT_TYPE = { "Content-Type": "application/x-www-form-urlencoded" };
	function setContentTypeIfUnset(headers, value) {
		if (!utils.isUndefined(headers) && utils.isUndefined(headers["Content-Type"])) headers["Content-Type"] = value;
	}
	function getDefaultAdapter() {
		var adapter;
		if (typeof XMLHttpRequest !== "undefined") adapter = require_xhr();
		else if (typeof process !== "undefined") adapter = require_xhr();
		return adapter;
	}
	var defaults = {
		adapter: getDefaultAdapter(),
		transformRequest: [function transformRequest(data, headers) {
			normalizeHeaderName(headers, "Content-Type");
			if (utils.isFormData(data) || utils.isArrayBuffer(data) || utils.isBuffer(data) || utils.isStream(data) || utils.isFile(data) || utils.isBlob(data)) return data;
			if (utils.isArrayBufferView(data)) return data.buffer;
			if (utils.isURLSearchParams(data)) {
				setContentTypeIfUnset(headers, "application/x-www-form-urlencoded;charset=utf-8");
				return data.toString();
			}
			if (utils.isObject(data)) {
				setContentTypeIfUnset(headers, "application/json;charset=utf-8");
				return JSON.stringify(data);
			}
			return data;
		}],
		transformResponse: [function transformResponse(data) {
			if (typeof data === "string") try {
				data = JSON.parse(data);
			} catch (e) {}
			return data;
		}],
		/**
		* A timeout in milliseconds to abort a request. If set to 0 (default) a
		* timeout is not created.
		*/
		timeout: 0,
		xsrfCookieName: "XSRF-TOKEN",
		xsrfHeaderName: "X-XSRF-TOKEN",
		maxContentLength: -1,
		validateStatus: function validateStatus(status) {
			return status >= 200 && status < 300;
		}
	};
	defaults.headers = { common: { "Accept": "application/json, text/plain, */*" } };
	utils.forEach([
		"delete",
		"get",
		"head"
	], function forEachMethodNoData(method) {
		defaults.headers[method] = {};
	});
	utils.forEach([
		"post",
		"put",
		"patch"
	], function forEachMethodWithData(method) {
		defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
	});
	module.exports = defaults;
}));
//#endregion
//#region node_modules/axios/lib/core/InterceptorManager.js
var require_InterceptorManager = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	function InterceptorManager() {
		this.handlers = [];
	}
	/**
	* Add a new interceptor to the stack
	*
	* @param {Function} fulfilled The function to handle `then` for a `Promise`
	* @param {Function} rejected The function to handle `reject` for a `Promise`
	*
	* @return {Number} An ID used to remove interceptor later
	*/
	InterceptorManager.prototype.use = function use(fulfilled, rejected) {
		this.handlers.push({
			fulfilled,
			rejected
		});
		return this.handlers.length - 1;
	};
	/**
	* Remove an interceptor from the stack
	*
	* @param {Number} id The ID that was returned by `use`
	*/
	InterceptorManager.prototype.eject = function eject(id) {
		if (this.handlers[id]) this.handlers[id] = null;
	};
	/**
	* Iterate over all the registered interceptors
	*
	* This method is particularly useful for skipping over any
	* interceptors that may have become `null` calling `eject`.
	*
	* @param {Function} fn The function to call for each interceptor
	*/
	InterceptorManager.prototype.forEach = function forEach(fn) {
		utils.forEach(this.handlers, function forEachHandler(h) {
			if (h !== null) fn(h);
		});
	};
	module.exports = InterceptorManager;
}));
//#endregion
//#region node_modules/axios/lib/core/transformData.js
var require_transformData = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	/**
	* Transform the data for a request or a response
	*
	* @param {Object|String} data The data to be transformed
	* @param {Array} headers The headers for the request or response
	* @param {Array|Function} fns A single function or Array of functions
	* @returns {*} The resulting transformed data
	*/
	module.exports = function transformData(data, headers, fns) {
		utils.forEach(fns, function transform(fn) {
			data = fn(data, headers);
		});
		return data;
	};
}));
//#endregion
//#region node_modules/axios/lib/cancel/isCancel.js
var require_isCancel = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function isCancel(value) {
		return !!(value && value.__CANCEL__);
	};
}));
//#endregion
//#region node_modules/axios/lib/helpers/isAbsoluteURL.js
var require_isAbsoluteURL = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Determines whether the specified URL is absolute
	*
	* @param {string} url The URL to test
	* @returns {boolean} True if the specified URL is absolute, otherwise false
	*/
	module.exports = function isAbsoluteURL(url) {
		return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
	};
}));
//#endregion
//#region node_modules/axios/lib/helpers/combineURLs.js
var require_combineURLs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Creates a new URL by combining the specified URLs
	*
	* @param {string} baseURL The base URL
	* @param {string} relativeURL The relative URL
	* @returns {string} The combined URL
	*/
	module.exports = function combineURLs(baseURL, relativeURL) {
		return relativeURL ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
	};
}));
//#endregion
//#region node_modules/axios/lib/core/dispatchRequest.js
var require_dispatchRequest = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var transformData = require_transformData();
	var isCancel = require_isCancel();
	var defaults = require_defaults();
	var isAbsoluteURL = require_isAbsoluteURL();
	var combineURLs = require_combineURLs();
	/**
	* Throws a `Cancel` if cancellation has been requested.
	*/
	function throwIfCancellationRequested(config) {
		if (config.cancelToken) config.cancelToken.throwIfRequested();
	}
	/**
	* Dispatch a request to the server using the configured adapter.
	*
	* @param {object} config The config that is to be used for the request
	* @returns {Promise} The Promise to be fulfilled
	*/
	module.exports = function dispatchRequest(config) {
		throwIfCancellationRequested(config);
		if (config.baseURL && !isAbsoluteURL(config.url)) config.url = combineURLs(config.baseURL, config.url);
		config.headers = config.headers || {};
		config.data = transformData(config.data, config.headers, config.transformRequest);
		config.headers = utils.merge(config.headers.common || {}, config.headers[config.method] || {}, config.headers || {});
		utils.forEach([
			"delete",
			"get",
			"head",
			"post",
			"put",
			"patch",
			"common"
		], function cleanHeaderConfig(method) {
			delete config.headers[method];
		});
		return (config.adapter || defaults.adapter)(config).then(function onAdapterResolution(response) {
			throwIfCancellationRequested(config);
			response.data = transformData(response.data, response.headers, config.transformResponse);
			return response;
		}, function onAdapterRejection(reason) {
			if (!isCancel(reason)) {
				throwIfCancellationRequested(config);
				if (reason && reason.response) reason.response.data = transformData(reason.response.data, reason.response.headers, config.transformResponse);
			}
			return Promise.reject(reason);
		});
	};
}));
//#endregion
//#region node_modules/axios/lib/core/Axios.js
var require_Axios = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var defaults = require_defaults();
	var utils = require_utils();
	var InterceptorManager = require_InterceptorManager();
	var dispatchRequest = require_dispatchRequest();
	/**
	* Create a new instance of Axios
	*
	* @param {Object} instanceConfig The default config for the instance
	*/
	function Axios(instanceConfig) {
		this.defaults = instanceConfig;
		this.interceptors = {
			request: new InterceptorManager(),
			response: new InterceptorManager()
		};
	}
	/**
	* Dispatch a request
	*
	* @param {Object} config The config specific for this request (merged with this.defaults)
	*/
	Axios.prototype.request = function request(config) {
		if (typeof config === "string") config = utils.merge({ url: arguments[0] }, arguments[1]);
		config = utils.merge(defaults, { method: "get" }, this.defaults, config);
		config.method = config.method.toLowerCase();
		var chain = [dispatchRequest, void 0];
		var promise = Promise.resolve(config);
		this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
			chain.unshift(interceptor.fulfilled, interceptor.rejected);
		});
		this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
			chain.push(interceptor.fulfilled, interceptor.rejected);
		});
		while (chain.length) promise = promise.then(chain.shift(), chain.shift());
		return promise;
	};
	utils.forEach([
		"delete",
		"get",
		"head",
		"options"
	], function forEachMethodNoData(method) {
		Axios.prototype[method] = function(url, config) {
			return this.request(utils.merge(config || {}, {
				method,
				url
			}));
		};
	});
	utils.forEach([
		"post",
		"put",
		"patch"
	], function forEachMethodWithData(method) {
		Axios.prototype[method] = function(url, data, config) {
			return this.request(utils.merge(config || {}, {
				method,
				url,
				data
			}));
		};
	});
	module.exports = Axios;
}));
//#endregion
//#region node_modules/axios/lib/cancel/Cancel.js
var require_Cancel = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* A `Cancel` is an object that is thrown when an operation is canceled.
	*
	* @class
	* @param {string=} message The message.
	*/
	function Cancel(message) {
		this.message = message;
	}
	Cancel.prototype.toString = function toString() {
		return "Cancel" + (this.message ? ": " + this.message : "");
	};
	Cancel.prototype.__CANCEL__ = true;
	module.exports = Cancel;
}));
//#endregion
//#region node_modules/axios/lib/cancel/CancelToken.js
var require_CancelToken = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Cancel = require_Cancel();
	/**
	* A `CancelToken` is an object that can be used to request cancellation of an operation.
	*
	* @class
	* @param {Function} executor The executor function.
	*/
	function CancelToken(executor) {
		if (typeof executor !== "function") throw new TypeError("executor must be a function.");
		var resolvePromise;
		this.promise = new Promise(function promiseExecutor(resolve) {
			resolvePromise = resolve;
		});
		var token = this;
		executor(function cancel(message) {
			if (token.reason) return;
			token.reason = new Cancel(message);
			resolvePromise(token.reason);
		});
	}
	/**
	* Throws a `Cancel` if cancellation has been requested.
	*/
	CancelToken.prototype.throwIfRequested = function throwIfRequested() {
		if (this.reason) throw this.reason;
	};
	/**
	* Returns an object that contains a new `CancelToken` and a function that, when called,
	* cancels the `CancelToken`.
	*/
	CancelToken.source = function source() {
		var cancel;
		return {
			token: new CancelToken(function executor(c) {
				cancel = c;
			}),
			cancel
		};
	};
	module.exports = CancelToken;
}));
//#endregion
//#region node_modules/axios/lib/helpers/spread.js
var require_spread = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Syntactic sugar for invoking a function and expanding an array for arguments.
	*
	* Common use case would be to use `Function.prototype.apply`.
	*
	*  ```js
	*  function f(x, y, z) {}
	*  var args = [1, 2, 3];
	*  f.apply(null, args);
	*  ```
	*
	* With `spread` this example can be re-written.
	*
	*  ```js
	*  spread(function(x, y, z) {})([1, 2, 3]);
	*  ```
	*
	* @param {Function} callback
	* @returns {Function}
	*/
	module.exports = function spread(callback) {
		return function wrap(arr) {
			return callback.apply(null, arr);
		};
	};
}));
//#endregion
//#region node_modules/axios/lib/axios.js
var require_axios$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var bind = require_bind();
	var Axios = require_Axios();
	var defaults = require_defaults();
	/**
	* Create an instance of Axios
	*
	* @param {Object} defaultConfig The default config for the instance
	* @return {Axios} A new instance of Axios
	*/
	function createInstance(defaultConfig) {
		var context = new Axios(defaultConfig);
		var instance = bind(Axios.prototype.request, context);
		utils.extend(instance, Axios.prototype, context);
		utils.extend(instance, context);
		return instance;
	}
	var axios = createInstance(defaults);
	axios.Axios = Axios;
	axios.create = function create(instanceConfig) {
		return createInstance(utils.merge(defaults, instanceConfig));
	};
	axios.Cancel = require_Cancel();
	axios.CancelToken = require_CancelToken();
	axios.isCancel = require_isCancel();
	axios.all = function all(promises) {
		return Promise.all(promises);
	};
	axios.spread = require_spread();
	module.exports = axios;
	module.exports.default = axios;
}));
//#endregion
//#region node_modules/axios/index.js
var require_axios = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_axios$1();
}));
//#endregion
//#region source-snapshot/src/constants/ConfigSettingRoute.js
var ConfigSettingRoute = [
	"configApp",
	"serviceSetting",
	"inventorySetting",
	"allChargeSetting",
	"brandSetting",
	"promotion",
	"deviceSetting",
	"screenSaver",
	"menuLabel",
	"posterPro",
	"loginGuide"
];
/** 从 hash / pathname 解析路由名，如 #/configApp、/configApp → configApp */
function normalizeConfigSettingRouteName(pathOrHash = "") {
	return String(pathOrHash).split("?")[0].trim().replace(/^#/, "").replace(/^\//, "");
}
/** 判断是否为配置页路由；不传参时读取当前 window.location.hash */
function isConfigSettingRoute(pathOrHash) {
	const source = pathOrHash ?? (typeof window !== "undefined" ? window.location.hash : "");
	return ConfigSettingRoute.includes(normalizeConfigSettingRouteName(source));
}
//#endregion
//#region source-snapshot/src/constants/mockData.js
var systemLanguage = [
	{
		name: "English",
		code: "en",
		abbr: "EN"
	},
	{
		name: "中文简体",
		code: "zh_cn",
		abbr: "中"
	},
	{
		name: "中文繁体",
		code: "zh_tc",
		abbr: "繁"
	},
	{
		name: "Français",
		code: "french",
		abbr: "FR"
	},
	{
		name: "日本語",
		code: "jan",
		abbr: "JP"
	},
	{
		name: "한국어",
		code: "korean",
		abbr: "KR"
	},
	{
		name: "Русский",
		code: "russian",
		abbr: "RU"
	},
	{
		name: "Español",
		code: "spanish",
		abbr: "SP"
	},
	{
		name: "ภาษาไทย",
		code: "thai",
		abbr: "TH"
	},
	{
		name: "ViệtName",
		code: "vietnamese",
		abbr: "VI"
	}
];
var langCodeMap = {
	en: "en",
	zh_cn: "zh-cn",
	zh_tc: "zh-Hant",
	french: "French",
	jan: "jp",
	korean: "ko",
	russian: "ru",
	spanish: "es",
	thai: "th",
	vietnamese: "vi"
};
var homeHash = ["#/", "#/index"];
var configPages = () => isConfigSettingRoute();
/** 根据当前是否在配置页，返回对应首页路由（HashRouter path） */
var getKioskHomePath = () => configPages() ? "/configApp" : "/";
/** 根据当前是否在配置页，返回对应首页 hash */
var getKioskHomeHash = () => configPages() ? "#/configApp" : "#/";
var TOGONAMELIST = {
	2: "utensil",
	3: "bag",
	4: "takeout-box"
};
//#endregion
//#region node_modules/js-cookie/dist/js.cookie.mjs
/*! js-cookie v3.0.5 | MIT */
function assign(target) {
	for (var i = 1; i < arguments.length; i++) {
		var source = arguments[i];
		for (var key in source) target[key] = source[key];
	}
	return target;
}
var defaultConverter = {
	read: function(value) {
		if (value[0] === "\"") value = value.slice(1, -1);
		return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
	},
	write: function(value) {
		return encodeURIComponent(value).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g, decodeURIComponent);
	}
};
function init(converter, defaultAttributes) {
	function set(name, value, attributes) {
		if (typeof document === "undefined") return;
		attributes = assign({}, defaultAttributes, attributes);
		if (typeof attributes.expires === "number") attributes.expires = new Date(Date.now() + attributes.expires * 864e5);
		if (attributes.expires) attributes.expires = attributes.expires.toUTCString();
		name = encodeURIComponent(name).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
		var stringifiedAttributes = "";
		for (var attributeName in attributes) {
			if (!attributes[attributeName]) continue;
			stringifiedAttributes += "; " + attributeName;
			if (attributes[attributeName] === true) continue;
			stringifiedAttributes += "=" + attributes[attributeName].split(";")[0];
		}
		return document.cookie = name + "=" + converter.write(value, name) + stringifiedAttributes;
	}
	function get(name) {
		if (typeof document === "undefined" || arguments.length && !name) return;
		var cookies = document.cookie ? document.cookie.split("; ") : [];
		var jar = {};
		for (var i = 0; i < cookies.length; i++) {
			var parts = cookies[i].split("=");
			var value = parts.slice(1).join("=");
			try {
				var found = decodeURIComponent(parts[0]);
				jar[found] = converter.read(value, found);
				if (name === found) break;
			} catch (e) {}
		}
		return name ? jar[name] : jar;
	}
	return Object.create({
		set,
		get,
		remove: function(name, attributes) {
			set(name, "", assign({}, attributes, { expires: -1 }));
		},
		withAttributes: function(attributes) {
			return init(this.converter, assign({}, this.attributes, attributes));
		},
		withConverter: function(converter) {
			return init(assign({}, this.converter, converter), this.attributes);
		}
	}, {
		attributes: { value: Object.freeze(defaultAttributes) },
		converter: { value: Object.freeze(converter) }
	});
}
var api = init(defaultConverter, { path: "/" });
//#endregion
//#region source-snapshot/src/utils/getPosVersion.js
function isValidJSON(str) {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
}
var getPosVersion = (posVersion) => {
	if (posVersion) {
		let posArr = (isValidJSON(posVersion) ? JSON.parse(posVersion) : posVersion).split(".");
		posArr = posArr.slice(0, -1);
		posArr = posArr.map((part) => part.replace(/-fast-\d+$/, ""));
		for (let i = 4; i < posArr.length; i++) {
			const num = parseInt(posArr[i], 10);
			if (!isNaN(num) && num < 10) posArr[i] = String(num).padStart(2, "0");
		}
		while (posArr.length < 7) posArr.push("00");
		return Number(posArr.join(""));
	}
	return 0;
};
//#endregion
//#region source-snapshot/src/utils/axios.js
var import_axios = /* @__PURE__ */ __toESM(require_axios());
import_axios.default.interceptors.request.use(function(config) {
	const posVersion = localStorage.getItem("posVersion");
	const posVersionNum = getPosVersion(posVersion);
	if (posVersion && posVersionNum >= 1803012e4 && !config?.url.includes("cloud.menusifu") && !config?.url.includes(":22081") && !config?.url.includes("fetchCompanyProfile")) config.headers["posVersion"] = JSON.parse(posVersion);
	return config;
}, function(error) {
	return Promise.reject(error);
});
import_axios.default.interceptors.response.use(function(response) {
	return response;
}, function(error) {
	return Promise.reject(error);
});
var axios_default = import_axios.default;
//#endregion
//#region source-snapshot/src/utils/getLocalSearch.js
function getLocalSearch(href) {
	let searchJson = {};
	if (href.indexOf("?") > -1) {
		let search = href.split("?")[1];
		if (search && search.length) search.split("&").map((s) => {
			let sArr = s.split("=");
			searchJson[sArr[0]] = sArr[1];
		});
	} else searchJson = {};
	return searchJson;
}
//#endregion
//#region source-snapshot/src/api/config.js
var location = window.location;
var url = getLocalSearch(window.location.href);
location.hostname;
location.port;
var clientPort = url.port || "52222";
var baseURL = {
	backUrl: "/kpos/webapp/payment/upload/signature",
	returnUrl: "http://" + (url.ip || "127.0.0.1") + ":" + clientPort + "/device/dualscreen/main"
};
//#endregion
//#region source-snapshot/src/constants/serverURL.js
var serverURL$1 = window.location.origin + "/kpos/";
//#endregion
//#region source-snapshot/src/api/ip.js
var setCookie$1 = (name, value) => {
	api.set(name, value, { expires: 30 * 365 });
};
function captureServerIP(url) {
	const i = url.indexOf("kiosklite");
	if (i > -1) return url.substring(0, i);
	else {
		const hashIndex = url.indexOf("#/");
		return hashIndex > -1 ? url.substring(0, hashIndex) : url;
	}
}
setCookie$1("kioskServerIP", captureServerIP(document.location.href));
var serverURL = serverURL$1;
//#endregion
//#region node_modules/dayjs/dayjs.min.js
var require_dayjs_min = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(t, e) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).dayjs = e();
	})(exports, (function() {
		"use strict";
		var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = {
			name: "en",
			weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
			months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
			ordinal: function(t) {
				var e = [
					"th",
					"st",
					"nd",
					"rd"
				], n = t % 100;
				return "[" + t + (e[(n - 20) % 10] || e[n] || e[0]) + "]";
			}
		}, m = function(t, e, n) {
			var r = String(t);
			return !r || r.length >= e ? t : "" + Array(e + 1 - r.length).join(n) + t;
		}, v = {
			s: m,
			z: function(t) {
				var e = -t.utcOffset(), n = Math.abs(e), r = Math.floor(n / 60), i = n % 60;
				return (e <= 0 ? "+" : "-") + m(r, 2, "0") + ":" + m(i, 2, "0");
			},
			m: function t(e, n) {
				if (e.date() < n.date()) return -t(n, e);
				var r = 12 * (n.year() - e.year()) + (n.month() - e.month()), i = e.clone().add(r, c), s = n - i < 0, u = e.clone().add(r + (s ? -1 : 1), c);
				return +(-(r + (n - i) / (s ? i - u : u - i)) || 0);
			},
			a: function(t) {
				return t < 0 ? Math.ceil(t) || 0 : Math.floor(t);
			},
			p: function(t) {
				return {
					M: c,
					y: h,
					w: o,
					d: a,
					D: d,
					h: u,
					m: s,
					s: i,
					ms: r,
					Q: f
				}[t] || String(t || "").toLowerCase().replace(/s$/, "");
			},
			u: function(t) {
				return void 0 === t;
			}
		}, g = "en", D = {};
		D[g] = M;
		var p = "$isDayjsObject", S = function(t) {
			return t instanceof _ || !(!t || !t[p]);
		}, w = function t(e, n, r) {
			var i;
			if (!e) return g;
			if ("string" == typeof e) {
				var s = e.toLowerCase();
				D[s] && (i = s), n && (D[s] = n, i = s);
				var u = e.split("-");
				if (!i && u.length > 1) return t(u[0]);
			} else {
				var a = e.name;
				D[a] = e, i = a;
			}
			return !r && i && (g = i), i || !r && g;
		}, O = function(t, e) {
			if (S(t)) return t.clone();
			var n = "object" == typeof e ? e : {};
			return n.date = t, n.args = arguments, new _(n);
		}, b = v;
		b.l = w, b.i = S, b.w = function(t, e) {
			return O(t, {
				locale: e.$L,
				utc: e.$u,
				x: e.$x,
				$offset: e.$offset
			});
		};
		var _ = function() {
			function M(t) {
				this.$L = w(t.locale, null, !0), this.parse(t), this.$x = this.$x || t.x || {}, this[p] = !0;
			}
			var m = M.prototype;
			return m.parse = function(t) {
				this.$d = function(t) {
					var e = t.date, n = t.utc;
					if (null === e) return /* @__PURE__ */ new Date(NaN);
					if (b.u(e)) return /* @__PURE__ */ new Date();
					if (e instanceof Date) return new Date(e);
					if ("string" == typeof e && !/Z$/i.test(e)) {
						var r = e.match($);
						if (r) {
							var i = r[2] - 1 || 0, s = (r[7] || "0").substring(0, 3);
							return n ? new Date(Date.UTC(r[1], i, r[3] || 1, r[4] || 0, r[5] || 0, r[6] || 0, s)) : new Date(r[1], i, r[3] || 1, r[4] || 0, r[5] || 0, r[6] || 0, s);
						}
					}
					return new Date(e);
				}(t), this.init();
			}, m.init = function() {
				var t = this.$d;
				this.$y = t.getFullYear(), this.$M = t.getMonth(), this.$D = t.getDate(), this.$W = t.getDay(), this.$H = t.getHours(), this.$m = t.getMinutes(), this.$s = t.getSeconds(), this.$ms = t.getMilliseconds();
			}, m.$utils = function() {
				return b;
			}, m.isValid = function() {
				return !(this.$d.toString() === l);
			}, m.isSame = function(t, e) {
				var n = O(t);
				return this.startOf(e) <= n && n <= this.endOf(e);
			}, m.isAfter = function(t, e) {
				return O(t) < this.startOf(e);
			}, m.isBefore = function(t, e) {
				return this.endOf(e) < O(t);
			}, m.$g = function(t, e, n) {
				return b.u(t) ? this[e] : this.set(n, t);
			}, m.unix = function() {
				return Math.floor(this.valueOf() / 1e3);
			}, m.valueOf = function() {
				return this.$d.getTime();
			}, m.startOf = function(t, e) {
				var n = this, r = !!b.u(e) || e, f = b.p(t), l = function(t, e) {
					var i = b.w(n.$u ? Date.UTC(n.$y, e, t) : new Date(n.$y, e, t), n);
					return r ? i : i.endOf(a);
				}, $ = function(t, e) {
					return b.w(n.toDate()[t].apply(n.toDate("s"), (r ? [
						0,
						0,
						0,
						0
					] : [
						23,
						59,
						59,
						999
					]).slice(e)), n);
				}, y = this.$W, M = this.$M, m = this.$D, v = "set" + (this.$u ? "UTC" : "");
				switch (f) {
					case h: return r ? l(1, 0) : l(31, 11);
					case c: return r ? l(1, M) : l(0, M + 1);
					case o:
						var g = this.$locale().weekStart || 0, D = (y < g ? y + 7 : y) - g;
						return l(r ? m - D : m + (6 - D), M);
					case a:
					case d: return $(v + "Hours", 0);
					case u: return $(v + "Minutes", 1);
					case s: return $(v + "Seconds", 2);
					case i: return $(v + "Milliseconds", 3);
					default: return this.clone();
				}
			}, m.endOf = function(t) {
				return this.startOf(t, !1);
			}, m.$set = function(t, e) {
				var n, o = b.p(t), f = "set" + (this.$u ? "UTC" : ""), l = (n = {}, n[a] = f + "Date", n[d] = f + "Date", n[c] = f + "Month", n[h] = f + "FullYear", n[u] = f + "Hours", n[s] = f + "Minutes", n[i] = f + "Seconds", n[r] = f + "Milliseconds", n)[o], $ = o === a ? this.$D + (e - this.$W) : e;
				if (o === c || o === h) {
					var y = this.clone().set(d, 1);
					y.$d[l]($), y.init(), this.$d = y.set(d, Math.min(this.$D, y.daysInMonth())).$d;
				} else l && this.$d[l]($);
				return this.init(), this;
			}, m.set = function(t, e) {
				return this.clone().$set(t, e);
			}, m.get = function(t) {
				return this[b.p(t)]();
			}, m.add = function(r, f) {
				var d, l = this;
				r = Number(r);
				var $ = b.p(f), y = function(t) {
					var e = O(l);
					return b.w(e.date(e.date() + Math.round(t * r)), l);
				};
				if ($ === c) return this.set(c, this.$M + r);
				if ($ === h) return this.set(h, this.$y + r);
				if ($ === a) return y(1);
				if ($ === o) return y(7);
				var M = (d = {}, d[s] = e, d[u] = n, d[i] = t, d)[$] || 1, m = this.$d.getTime() + r * M;
				return b.w(m, this);
			}, m.subtract = function(t, e) {
				return this.add(-1 * t, e);
			}, m.format = function(t) {
				var e = this, n = this.$locale();
				if (!this.isValid()) return n.invalidDate || l;
				var r = t || "YYYY-MM-DDTHH:mm:ssZ", i = b.z(this), s = this.$H, u = this.$m, a = this.$M, o = n.weekdays, c = n.months, f = n.meridiem, h = function(t, n, i, s) {
					return t && (t[n] || t(e, r)) || i[n].slice(0, s);
				}, d = function(t) {
					return b.s(s % 12 || 12, t, "0");
				}, $ = f || function(t, e, n) {
					var r = t < 12 ? "AM" : "PM";
					return n ? r.toLowerCase() : r;
				};
				return r.replace(y, (function(t, r) {
					return r || function(t) {
						switch (t) {
							case "YY": return String(e.$y).slice(-2);
							case "YYYY": return b.s(e.$y, 4, "0");
							case "M": return a + 1;
							case "MM": return b.s(a + 1, 2, "0");
							case "MMM": return h(n.monthsShort, a, c, 3);
							case "MMMM": return h(c, a);
							case "D": return e.$D;
							case "DD": return b.s(e.$D, 2, "0");
							case "d": return String(e.$W);
							case "dd": return h(n.weekdaysMin, e.$W, o, 2);
							case "ddd": return h(n.weekdaysShort, e.$W, o, 3);
							case "dddd": return o[e.$W];
							case "H": return String(s);
							case "HH": return b.s(s, 2, "0");
							case "h": return d(1);
							case "hh": return d(2);
							case "a": return $(s, u, !0);
							case "A": return $(s, u, !1);
							case "m": return String(u);
							case "mm": return b.s(u, 2, "0");
							case "s": return String(e.$s);
							case "ss": return b.s(e.$s, 2, "0");
							case "SSS": return b.s(e.$ms, 3, "0");
							case "Z": return i;
						}
						return null;
					}(t) || i.replace(":", "");
				}));
			}, m.utcOffset = function() {
				return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
			}, m.diff = function(r, d, l) {
				var $, y = this, M = b.p(d), m = O(r), v = (m.utcOffset() - this.utcOffset()) * e, g = this - m, D = function() {
					return b.m(y, m);
				};
				switch (M) {
					case h:
						$ = D() / 12;
						break;
					case c:
						$ = D();
						break;
					case f:
						$ = D() / 3;
						break;
					case o:
						$ = (g - v) / 6048e5;
						break;
					case a:
						$ = (g - v) / 864e5;
						break;
					case u:
						$ = g / n;
						break;
					case s:
						$ = g / e;
						break;
					case i:
						$ = g / t;
						break;
					default: $ = g;
				}
				return l ? $ : b.a($);
			}, m.daysInMonth = function() {
				return this.endOf(c).$D;
			}, m.$locale = function() {
				return D[this.$L];
			}, m.locale = function(t, e) {
				if (!t) return this.$L;
				var n = this.clone(), r = w(t, e, !0);
				return r && (n.$L = r), n;
			}, m.clone = function() {
				return b.w(this.$d, this);
			}, m.toDate = function() {
				return new Date(this.valueOf());
			}, m.toJSON = function() {
				return this.isValid() ? this.toISOString() : null;
			}, m.toISOString = function() {
				return this.$d.toISOString();
			}, m.toString = function() {
				return this.$d.toUTCString();
			}, M;
		}(), k = _.prototype;
		return O.prototype = k, [
			["$ms", r],
			["$s", i],
			["$m", s],
			["$H", u],
			["$W", a],
			["$M", c],
			["$y", h],
			["$D", d]
		].forEach((function(t) {
			k[t[1]] = function(e) {
				return this.$g(e, t[0], t[1]);
			};
		})), O.extend = function(t, e) {
			return t.$i || (t(e, _, O), t.$i = !0), O;
		}, O.locale = w, O.isDayjs = S, O.unix = function(t) {
			return O(1e3 * t);
		}, O.en = D[g], O.Ls = D, O.p = {}, O;
	}));
}));
//#endregion
//#region node_modules/emoji-regex/index.mjs
var emoji_regex_default = () => {
	return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};
//#endregion
//#region source-snapshot/src/utils/sanitizeInput.js
function removeEmoji(value = "") {
	return String(value).replace(emoji_regex_default(), "");
}
function hasNonWhitespace(value = "") {
	return String(value).trim().length > 0;
}
//#endregion
//#region source-snapshot/src/utils/posConnectionActivity.js
var scope = "";
var scopeRevision = 0;
var successRevision = 0;
var failureCount = 0;
function getPosConnectionSnapshot() {
	const nextScope = JSON.stringify([
		serverURL,
		api.get("kioskServerIP") || "",
		api.get("kioskLicense") || "",
		api.get("sessionKey") || ""
	]);
	if (scope !== nextScope) {
		scope = nextScope;
		scopeRevision += 1;
		successRevision = 0;
		failureCount = 0;
	}
	return {
		scope,
		scopeRevision,
		successRevision,
		failureCount
	};
}
//#endregion
//#region source-snapshot/src/utils/EventBus/index.js
var _EventBus = class {
	constructor() {
		this._events = {};
	}
	on(event, fn) {
		if (typeof fn !== "function") throw new Error("_EventsBus.on callback not function!");
		this._events[event] = fn;
	}
	emit(event, ...args) {
		const cb = this._events[event];
		if (cb) cb(...args);
	}
	off(event) {
		if (Array.isArray(event)) {
			for (let i = 0, len = event.length; i < len; i++) this.off(event[i]);
			return;
		}
		if (this._events[event]) delete this._events[event];
	}
};
var EventBus = new _EventBus();
//#endregion
//#region \0vite/preload-helper.js
var scriptRel = "modulepreload";
var assetsURL = function(dep, importerUrl) {
	return new URL(dep, importerUrl).href;
};
var seen = {};
var __vitePreload = function preload(baseModule, deps, importerUrl) {
	let promise = Promise.resolve();
	if (deps && deps.length > 0) {
		const links = document.getElementsByTagName("link");
		const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
		const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
		function allSettled(promises) {
			return Promise.all(promises.map((p) => Promise.resolve(p).then((value) => ({
				status: "fulfilled",
				value
			}), (reason) => ({
				status: "rejected",
				reason
			}))));
		}
		function importMetaResolve(specifier) {
			if (import.meta.resolve) return import.meta.resolve(specifier);
			return new URL(
				specifier,
				/** #__KEEP__ */
				import.meta.url
			).href;
		}
		promise = allSettled(deps.map((dep) => {
			dep = assetsURL(dep, importerUrl);
			dep = importMetaResolve(dep);
			if (dep in seen) return;
			seen[dep] = true;
			const isCss = dep.endsWith(".css");
			for (let i = links.length - 1; i >= 0; i--) {
				const link = links[i];
				if (link.href === dep && (!isCss || link.rel === "stylesheet")) return;
			}
			const link = document.createElement("link");
			link.rel = isCss ? "stylesheet" : scriptRel;
			if (!isCss) link.as = "script";
			link.crossOrigin = "";
			link.href = dep;
			if (cspNonce) link.setAttribute("nonce", cspNonce);
			document.head.appendChild(link);
			if (isCss) return new Promise((res, rej) => {
				link.addEventListener("load", res);
				link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
			});
		}));
	}
	function handlePreloadError(err) {
		const e = new Event("vite:preloadError", { cancelable: true });
		e.payload = err;
		window.dispatchEvent(e);
		if (!e.defaultPrevented) throw err;
	}
	return promise.then((res) => {
		for (const item of res || []) {
			if (item.status !== "rejected") continue;
			handlePreloadError(item.reason);
		}
		return baseModule().catch(handlePreloadError);
	});
};
//#endregion
//#region source-snapshot/src/utils/notifyPosConnectionAfterSessionRenewal.js
/**
* sessionKey 在 judgeSskeyIsActiveTime 等处续期后，App 的 isAvailable 仍可能为 false
* （checkPosConnection 仅每 5s 轮询）。通过此处立即探测 POS 并通知 App 更新状态。
*/
var setPosAvailable = null;
function restoreKioskPosAvailability(snapshot = getPosConnectionSnapshot()) {
	if (typeof setPosAvailable !== "function" || snapshot.scopeRevision !== getPosConnectionSnapshot().scopeRevision) return false;
	setPosAvailable();
	EventBus.emit("posConnectionRestored");
	return true;
}
/** 与 HashRouter 下 `Route exact path="/"` 一致：仅 `#/` 或空 hash 视为首页 */
function isKioskHomeRoute() {
	const pathname = ((window.location.hash || "").replace(/^#/, "").split("?")[0] || "").trim();
	return pathname === "" || pathname === "/";
}
/** 配置页首页 `#/configApp` */
function isConfigAppHomeRoute() {
	return ((window.location.hash || "").replace(/^#/, "").split("?")[0] || "").trim() === "/configApp";
}
async function notifyPosConnectionAfterSessionRenewal() {
	const snapshot = getPosConnectionSnapshot();
	if (!restoreKioskPosAvailability(snapshot)) return;
	try {
		const { scopeRevision } = snapshot;
		const { getMarginappFetchConfig } = await __vitePreload(async () => {
			const { getMarginappFetchConfig } = await import("./api-CryvyTZg.js");
			return { getMarginappFetchConfig };
		}, [], import.meta.url);
		const res = await getMarginappFetchConfig({ timeout: 2e3 });
		if (scopeRevision !== getPosConnectionSnapshot().scopeRevision) return;
		if (res?.data?.result?.successful) {
			const isHomeRoute = isKioskHomeRoute();
			const isConfigHomeRoute = isConfigAppHomeRoute();
			if (isHomeRoute || isConfigHomeRoute) window.location.reload();
			else {
				const [{ default: Toast }, { default: i18n }] = await Promise.all([__vitePreload(() => import("./toast-BDZwxMgs.js"), __vite__mapDeps([0,1,2]), import.meta.url), __vitePreload(() => import("./native-i18n-CDR8oTIV.js"), __vite__mapDeps([3,4,5]), import.meta.url)]);
				Toast.info(i18n.t("session-key-expired-reload-hint"), () => {
					window.location.hash = getKioskHomeHash();
					window.location.reload();
				});
			}
		}
	} catch (e) {}
}
//#endregion
//#region source-snapshot/src/api/index.js
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min());
var CancelToken = axios_default.CancelToken;
var source = CancelToken.source();
function fetchItemSizeList() {
	return axiosGet(serverURL + "webapp/itemSizes");
}
function fetchMenuGroup() {
	let menuURL = serverURL + "webapp/kiosk/v1/kioskMenus?product=KIOSK";
	return new Promise(async (resolve, reject) => {
		try {
			const res = await axiosGet(menuURL);
			if (res?.status === 200) {
				const menuGroups = res.data.KioskMenus[0]?.menuGroups?.filter((each) => each?.restaurantHourIds?.length > 0 && each?.name !== "Global Option Group" || each?.name === "Metadata Item Group");
				resolve({ data: { KioskMenus: [{
					...res.data.KioskMenus[0],
					menuGroups
				}] } });
			} else reject(res);
		} catch (e) {
			reject(e);
		}
	});
}
function fetchSessionKey(licence) {
	const sessionKeyURL = serverURL + "webapp/license/clientInstanceLogin";
	let secretKey = "";
	if (window.isAndroidShell && window.isAndroidShell() || window.isIosShell && window.isIosShell()) secretKey = getCookie("AndroidSecret") || getCookie("secretKey");
	else secretKey = getCookie("secretKey");
	return axiosPost(sessionKeyURL, {
		appInstanceName: licence || getCookie("kioskLicense"),
		appInstanceType: "KIOSK",
		secretKey
	});
}
function fetchSystemConfig() {
	return axiosGet(serverURL + "webapp/kioskSystem/kioskSystemConfigurations");
}
function fetchTaxInfo() {
	return axiosGet(serverURL + "webapp/payment/companyTaxs");
}
function fetchCompanyProfile(config = {}) {
	return axiosGet(serverURL + "webapp/store/fetchCompanyProfile", config);
}
async function saveOrder(orderData) {
	const [{ default: store }, { hasStaleMemberActivity }, { default: i18n }] = await Promise.all([
		__vitePreload(() => import("./native-store-Cv9rukmV.js"), __vite__mapDeps([6,7]), import.meta.url),
		__vitePreload(() => import("./memberCheckout-BKXbAyEx.js"), __vite__mapDeps([8,9,1,2,7,10,4,5]), import.meta.url),
		__vitePreload(() => import("./native-i18n-CDR8oTIV.js"), __vite__mapDeps([3,4,5]), import.meta.url)
	]);
	if (hasStaleMemberActivity(store.getState(), orderData)) throw new Error(i18n.t("notValidPromotion"));
	const saveOrderURL = serverURL + "webapp/order/saveOrder";
	posFrontLog(`saveOrder -----status: ${orderData?.order?.status} -----id: ${orderData?.order?.id} -----  locationPage: ${window?.location?.hash}}`);
	if (orderData?.order?.customer?.phone.length > 0) orderData.order.phoneNumber = orderData.order.customer.phone[0].number;
	return axiosPost(saveOrderURL, {
		...orderData,
		userAuth: orderData?.order?.userAuth
	});
}
function sendPayment(paymentData) {
	const paymentURL = serverURL + "webapp/payment/savePaymentRecord";
	return new Promise((resolve, reject) => {
		axios_default.post(paymentURL, paymentData, {
			timeout: 130 * 1e3,
			cancelToken: source.token
		}).then((res) => {
			resolve(res);
		}).catch((err) => {
			source = CancelToken.source();
			reject(err);
		});
	});
}
function sendErrorMsg(msg) {
	return axiosPost(serverURL + "webapp/message/saveMessage", msg);
}
function send2Kitchen(msg) {
	return axiosPost(serverURL + "webapp/kitchen/printItemToKitchen", msg);
}
function printUnpaidReceipt(payByCashData) {
	return axiosPost(serverURL + "webapp/print/printReceipt", payByCashData);
}
function sendMsgReceipt(msgReceiptData) {
	return axiosPost(serverURL + "webapp/messageSender/textMessage", msgReceiptData);
}
function axiosPost(URL, payload = null, config = {}) {
	return new Promise((resolve, reject) => {
		axios_default.post(URL, payload, config).then((res) => {
			resolve(res);
		}).catch((err) => {
			reject(err);
		});
	});
}
function axiosGet(URL, config = {}) {
	return new Promise((resolve, reject) => {
		axios_default.get(URL, config).then((res) => {
			resolve(res);
		}).catch((err) => {
			reject(err);
		});
	});
}
var paymentMemberDataOrThrow = (response) => {
	const body = response?.data;
	if (body?.code !== 0) throw new Error(body?.msg || "Payment member request failed");
	return body.data;
};
function getPaymentMemberSettings() {
	return axiosGet(`${serverURL}api/payment-member/settings`).then(paymentMemberDataOrThrow);
}
function queryPaymentMember({ orderId, paymentRecordId }) {
	return axiosPost(`${serverURL}api/payment-member/query`, {
		orderId,
		paymentRecordId
	}).then(paymentMemberDataOrThrow);
}
function completePaymentMember(payload) {
	return axiosPost(`${serverURL}api/payment-member/complete`, payload).then(paymentMemberDataOrThrow);
}
function getSecretKey(obj) {
	return axiosPost("http://localhost:22081/kpos/webapp/license/getsecretkey", obj);
}
function saveSecretKey(obj) {
	return axiosPost("http://localhost:22081/kpos/webapp/license/savesecretkey", obj);
}
function saveCustomerInfo(number, firstName) {
	return axiosPost(serverURL + "webapp/kioskCustomer/saveCustomerInfo", { customer: {
		firstName: removeEmoji(firstName),
		phone: [{
			number,
			primaryUse: true
		}]
	} });
}
function printOrder(params) {
	const printUrl = serverURL + "webapp/print/printPaymentReceipt";
	return new Promise((resolve, reject) => {
		axios_default.post(printUrl, params, { timeout: 12e3 }).then((res) => {
			resolve(res);
		}).catch((err) => {
			reject(err);
		});
	});
}
function sendSignature(msg) {
	return axiosPost(baseURL.backUrl, msg);
}
function printCall(data) {
	return axiosPost(serverURL + "webapp/print/printCall", data);
}
function fetchSystemConfigAllList(config = {}, posVersion = "") {
	return new Promise(async (resolve, reject) => {
		let name = "RECEIPT_PRINT,TIPS_SUGGESTIONS_CALCULATION,PRINTING_DEBUG_MODE,CREDIT_CHARGE_ENABLE,CREDIT_CHARGE_RATE,NEW_CLOUD_GIFT_CARD_ENABLED,KIOSK_CRM_SERVICE_ENABLED";
		const posVersionNum = posVersion || Number(getPosVersion(localStorage.getItem("posVersion")));
		if (posVersionNum < 1803014e4) name += ",CRM_SERVICE_ENABLED";
		if (posVersionNum >= 1803014e4) name += ",POS_CRM_SERVICE_ENABLED";
		if (posVersionNum >= 1803016e4) name += ",CRM_INTEGRATION_SERVICE_ENABLED";
		let result = await axiosGet(serverURL + "webapp/system/listSystemConfigurations?name=" + name, config);
		result.data.systemConfiguration = updateSystemConfiguration(result.data.systemConfiguration);
		resolve(result);
	});
}
var CRM_ALIAS_NAMES = ["POS_CRM_SERVICE_ENABLED", "KIOSK_CRM_SERVICE_ENABLED"];
function hasCrmConfigValue(config) {
	if (!config) return false;
	const { value } = config;
	return value !== void 0 && value !== null && value !== "";
}
function updateSystemConfiguration(configs) {
	if (!configs?.length) return configs;
	const kioskCrm = configs.find((item) => item.name === "KIOSK_CRM_SERVICE_ENABLED");
	const posCrm = configs.find((item) => item.name === "POS_CRM_SERVICE_ENABLED");
	let selectedCrm = null;
	if (hasCrmConfigValue(kioskCrm)) selectedCrm = kioskCrm;
	else if (posCrm) selectedCrm = posCrm;
	if (!selectedCrm) return configs;
	const crmNames = [...CRM_ALIAS_NAMES, "CRM_SERVICE_ENABLED"];
	const filtered = configs.filter((item) => !crmNames.includes(item.name));
	filtered.push({
		...selectedCrm,
		name: "CRM_SERVICE_ENABLED"
	});
	return filtered;
}
function getMarginappFetchConfig(config = {}) {
	const snapshot = getPosConnectionSnapshot();
	return axiosPost(serverURL + "webapp/marginapp/fetchConfig", {
		product: "KIOSKLITE",
		userAuth: { sessionKey: getCookie("sessionKey") }
	}, config).then((res) => {
		if (res?.data?.result?.successful) restoreKioskPosAvailability(snapshot);
		return res;
	});
}
function getVersion() {
	return new Promise((resolve, reject) => {
		axios_default.get(`./version.json?t=${+/* @__PURE__ */ new Date()}`).then((res) => {
			resolve(res);
		}).catch((err) => {
			reject(err);
		});
	});
}
function posFrontLog(logMsg) {
	return axiosGet(`${serverURL}webapp/posfrontlog?logMsg=${encodeURIComponent(`[KIOSK-V${getCookie("kioskVersion")}-'${getCookie("kioskLicense")}'] 【${(0, import_dayjs_min.default)().format("YYYY-MM-DD HH:mm:ss")}】 ${logMsg}`)}`);
}
//#endregion
//#region node_modules/toggle-selection/index.js
var require_toggle_selection = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function() {
		var selection = document.getSelection();
		if (!selection.rangeCount) return function() {};
		var active = document.activeElement;
		var ranges = [];
		for (var i = 0; i < selection.rangeCount; i++) ranges.push(selection.getRangeAt(i));
		switch (active.tagName.toUpperCase()) {
			case "INPUT":
			case "TEXTAREA":
				active.blur();
				break;
			default:
				active = null;
				break;
		}
		selection.removeAllRanges();
		return function() {
			selection.type === "Caret" && selection.removeAllRanges();
			if (!selection.rangeCount) ranges.forEach(function(range) {
				selection.addRange(range);
			});
			active && active.focus();
		};
	};
}));
(/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var deselectCurrent = require_toggle_selection();
	var clipboardToIE11Formatting = {
		"text/plain": "Text",
		"text/html": "Url",
		"default": "Text"
	};
	var defaultMessage = "Copy to clipboard: #{key}, Enter";
	function format(message) {
		var copyKey = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
		return message.replace(/#{\s*key\s*}/g, copyKey);
	}
	function copy(text, options) {
		var debug, message, reselectPrevious, range, selection, mark, success = false;
		if (!options) options = {};
		debug = options.debug || false;
		try {
			reselectPrevious = deselectCurrent();
			range = document.createRange();
			selection = document.getSelection();
			mark = document.createElement("span");
			mark.textContent = text;
			mark.ariaHidden = "true";
			mark.style.all = "unset";
			mark.style.position = "fixed";
			mark.style.top = 0;
			mark.style.clip = "rect(0, 0, 0, 0)";
			mark.style.whiteSpace = "pre";
			mark.style.webkitUserSelect = "text";
			mark.style.MozUserSelect = "text";
			mark.style.msUserSelect = "text";
			mark.style.userSelect = "text";
			mark.addEventListener("copy", function(e) {
				e.stopPropagation();
				if (options.format) {
					e.preventDefault();
					if (typeof e.clipboardData === "undefined") {
						debug && console.warn("unable to use e.clipboardData");
						debug && console.warn("trying IE specific stuff");
						window.clipboardData.clearData();
						var format = clipboardToIE11Formatting[options.format] || clipboardToIE11Formatting["default"];
						window.clipboardData.setData(format, text);
					} else {
						e.clipboardData.clearData();
						e.clipboardData.setData(options.format, text);
					}
				}
				if (options.onCopy) {
					e.preventDefault();
					options.onCopy(e.clipboardData);
				}
			});
			document.body.appendChild(mark);
			range.selectNodeContents(mark);
			selection.addRange(range);
			if (!document.execCommand("copy")) throw new Error("copy command was unsuccessful");
			success = true;
		} catch (err) {
			debug && console.error("unable to copy using execCommand: ", err);
			debug && console.warn("trying IE specific stuff");
			try {
				window.clipboardData.setData(options.format || "text", text);
				options.onCopy && options.onCopy(window.clipboardData);
				success = true;
			} catch (err) {
				debug && console.error("unable to copy using clipboardData: ", err);
				debug && console.error("falling back to prompt");
				message = format("message" in options ? options.message : defaultMessage);
				window.prompt(message, text);
			}
		} finally {
			if (selection) if (typeof selection.removeRange == "function") selection.removeRange(range);
			else selection.removeAllRanges();
			if (mark) document.body.removeChild(mark);
			reselectPrevious();
		}
		return success;
	}
	module.exports = copy;
})))();
//#endregion
//#region source-snapshot/src/utils/index.js
var getCookie = (name) => {
	return api.get(name) || "";
};
var setCookie = (name, value) => {
	api.set(name, value, { expires: 30 * 365 });
};
var judgeSskeyIsActiveTime = async ({ minimumRemainingTime = 0, notifyAfterRenewal = true } = {}) => {
	const now = +/* @__PURE__ */ new Date();
	const clientInstanceLoginTime = +getCookie("kioskclientInstanceTime");
	const remainingActiveTime = +getCookie("kioskSskeyActiveTime") - (now - clientInstanceLoginTime);
	if (remainingActiveTime > 0 && remainingActiveTime >= minimumRemainingTime) return false;
	const res = await fetchSessionKey();
	if (!res?.data?.result?.successful) throw new Error(res?.data?.result?.failureReason || "Session key refresh failed");
	setCookie("kioskclientInstanceTime", +/* @__PURE__ */ new Date());
	setCookie("kioskSskeyActiveTime", res.data.sessionKeyRemainingActiveTime || 23 * 3600 * 1e3);
	if (window.isAndroidShell && window.isAndroidShell() || window.isIosShell && window.isIosShell()) setCookie("AndroidSecret", res.data.secretKey);
	else setCookie("secretKey", res.data.secretKey);
	posFrontLog(`clientInstanceLogin_expire_sessionKey=${getCookie("sessionKey")}`);
	setCookie("sessionKey", res.data.sessionKey);
	posFrontLog(`clientInstanceLogin_new_sessionKey=${res.data.sessionKey}`);
	if (notifyAfterRenewal) notifyPosConnectionAfterSessionRenewal();
	return true;
};
var on = (function() {
	if (document.addEventListener) return function(element, event, handler) {
		if (element && event && handler) element.addEventListener(event, handler, false);
	};
	else return function(element, event, handler) {
		if (element && event && handler) element.attachEvent("on" + event, handler);
	};
})();
var off = (function() {
	if (document.removeEventListener) return function(element, event, handler) {
		if (element && event) element.removeEventListener(event, handler, false);
	};
	else return function(element, event, handler) {
		if (element && event) element.detachEvent("on" + event, handler);
	};
})();
var isOpenVtkeyboadrd = () => {
	let openFlag = true;
	if (!window.isAndroidShell) openFlag = true;
	else if (window.isAndroidShell) {
		let u = window.navigator.userAgent;
		let isAndroid = u.indexOf("Android") > -1;
		let isIos = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
		if (!window.isAndroidShell()) if (isAndroid) openFlag = false;
		else if (isIos) openFlag = false;
		else openFlag = true;
		else openFlag = false;
	}
	return openFlag;
};
var isIpadEnv = () => {
	return !!window.navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
};
var compare = (property) => {
	return function(a, b) {
		var value1 = a[property];
		var value2 = b[property];
		if (value1 && value2) return value1 - value2;
	};
};
function normalizeConfigList(configList) {
	if (!Array.isArray(configList)) return configList;
	const seen = /* @__PURE__ */ new Set();
	return configList.filter((item) => {
		if (!item?.id) return false;
		const id = String(item.id);
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	});
}
var solveScrollElem = (flag) => {
	if (isIpadEnv()) {
		const hash = window.location.hash;
		if (hash.indexOf("orderPage") > -1) {
			const itemListDom = document.getElementById("itemListContainerId");
			if (itemListDom) itemListDom.style.overflowY = flag ? "hidden" : "auto";
			const categoryListDom = document.getElementById("categoryListId");
			if (categoryListDom) categoryListDom.style.overflowY = flag ? "hidden" : "scroll";
		} else if (hash.indexOf("orderReview") > -1) {
			const orderReviewDom = document.getElementById("orderReviewId");
			if (orderReviewDom) orderReviewDom.style.overflowY = flag ? "hidden" : "auto";
		} else if (hash.indexOf("comboPanel") > -1) {
			const sideNavDom = document.getElementById("sideNavId");
			if (sideNavDom) sideNavDom.style.overflowY = flag ? "hidden" : "auto";
			const fullComboPanelDom = document.getElementById("fullComboPanelId");
			if (fullComboPanelDom) fullComboPanelDom.style.overflowY = flag ? "hidden" : "auto";
		}
	}
};
var getOrientationFromType = () => {
	const type = window.screen?.orientation?.type;
	if (!type) return null;
	if (type.includes("landscape")) return "horizontal";
	if (type.includes("portrait")) return "vertical";
	return null;
};
var getOrientationFromViewport = () => {
	const width = window.innerWidth || document.documentElement?.clientWidth || 0;
	const height = window.innerHeight || document.documentElement?.clientHeight || 0;
	if (width && height) return width >= height ? "horizontal" : "vertical";
	return window.screen.width >= window.screen.height ? "horizontal" : "vertical";
};
var getDeviceOrientation = () => {
	const fromType = getOrientationFromType();
	if (fromType) return fromType;
	return getOrientationFromViewport();
};
var subscribeDeviceOrientation = (callback) => {
	let frameId = null;
	const handler = () => {
		if (frameId) cancelAnimationFrame(frameId);
		frameId = requestAnimationFrame(() => {
			frameId = null;
			callback(getDeviceOrientation());
		});
	};
	window.addEventListener("orientationchange", handler);
	window.addEventListener("resize", handler);
	return () => {
		if (frameId) cancelAnimationFrame(frameId);
		window.removeEventListener("orientationchange", handler);
		window.removeEventListener("resize", handler);
	};
};
var getCssValue = (value) => {
	if (!value) return 0;
	if (typeof value === "number") return value;
	return Number(value.replace(/\D+/g, " "));
};
var formatPhoneNumber = (phone) => {
	if (!phone) return "";
	let cleaned = phone.replace(/^\+1/, "");
	if (cleaned.length !== 10) return phone;
	return `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)} -${cleaned.slice(6, 10)}`;
};
//#endregion
export { homeHash as $, printUnpaidReceipt as A, source as B, getMarginappFetchConfig as C, posFrontLog as D, getVersion as E, send2Kitchen as F, require_dayjs_min as G, EventBus as H, sendErrorMsg as I, axios_default as J, serverURL as K, sendMsgReceipt as L, saveCustomerInfo as M, saveOrder as N, printCall as O, saveSecretKey as P, getKioskHomePath as Q, sendPayment as R, fetchTaxInfo as S, getSecretKey as T, hasNonWhitespace as U, __vitePreload as V, removeEmoji as W, TOGONAMELIST as X, getPosVersion as Y, configPages as Z, fetchItemSizeList as _, getDeviceOrientation as a, fetchSystemConfig as b, judgeSskeyIsActiveTime as c, on as d, langCodeMap as et, setCookie as f, fetchCompanyProfile as g, completePaymentMember as h, getCssValue as i, queryPaymentMember as j, printOrder as k, normalizeConfigList as l, subscribeDeviceOrientation as m, formatPhoneNumber as n, require_axios as nt, isIpadEnv as o, solveScrollElem as p, serverURL$1 as q, getCookie as r, isOpenVtkeyboadrd as s, compare as t, systemLanguage as tt, off as u, fetchMenuGroup as v, getPaymentMemberSettings as w, fetchSystemConfigAllList as x, fetchSessionKey as y, sendSignature as z };
