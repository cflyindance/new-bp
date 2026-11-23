//#region node_modules/resize-observer-polyfill/dist/ResizeObserver.es.js
/**
* A collection of shims that provide minimal functionality of the ES6 collections.
*
* These implementations are not meant to be used outside of the ResizeObserver
* modules as they cover only a limited range of use cases.
*/
var MapShim = (function() {
	if (typeof Map !== "undefined") return Map;
	/**
	* Returns index in provided array that matches the specified key.
	*
	* @param {Array<Array>} arr
	* @param {*} key
	* @returns {number}
	*/
	function getIndex(arr, key) {
		var result = -1;
		arr.some(function(entry, index) {
			if (entry[0] === key) {
				result = index;
				return true;
			}
			return false;
		});
		return result;
	}
	return function() {
		function class_1() {
			this.__entries__ = [];
		}
		Object.defineProperty(class_1.prototype, "size", {
			/**
			* @returns {boolean}
			*/
			get: function() {
				return this.__entries__.length;
			},
			enumerable: true,
			configurable: true
		});
		/**
		* @param {*} key
		* @returns {*}
		*/
		class_1.prototype.get = function(key) {
			var index = getIndex(this.__entries__, key);
			var entry = this.__entries__[index];
			return entry && entry[1];
		};
		/**
		* @param {*} key
		* @param {*} value
		* @returns {void}
		*/
		class_1.prototype.set = function(key, value) {
			var index = getIndex(this.__entries__, key);
			if (~index) this.__entries__[index][1] = value;
			else this.__entries__.push([key, value]);
		};
		/**
		* @param {*} key
		* @returns {void}
		*/
		class_1.prototype.delete = function(key) {
			var entries = this.__entries__;
			var index = getIndex(entries, key);
			if (~index) entries.splice(index, 1);
		};
		/**
		* @param {*} key
		* @returns {void}
		*/
		class_1.prototype.has = function(key) {
			return !!~getIndex(this.__entries__, key);
		};
		/**
		* @returns {void}
		*/
		class_1.prototype.clear = function() {
			this.__entries__.splice(0);
		};
		/**
		* @param {Function} callback
		* @param {*} [ctx=null]
		* @returns {void}
		*/
		class_1.prototype.forEach = function(callback, ctx) {
			if (ctx === void 0) ctx = null;
			for (var _i = 0, _a = this.__entries__; _i < _a.length; _i++) {
				var entry = _a[_i];
				callback.call(ctx, entry[1], entry[0]);
			}
		};
		return class_1;
	}();
})();
/**
* Detects whether window and document objects are available in current environment.
*/
var isBrowser = typeof window !== "undefined" && typeof document !== "undefined" && window.document === document;
var global$1 = (function() {
	if (typeof global !== "undefined" && global.Math === Math) return global;
	if (typeof self !== "undefined" && self.Math === Math) return self;
	if (typeof window !== "undefined" && window.Math === Math) return window;
	return Function("return this")();
})();
/**
* A shim for the requestAnimationFrame which falls back to the setTimeout if
* first one is not supported.
*
* @returns {number} Requests' identifier.
*/
var requestAnimationFrame$1 = (function() {
	if (typeof requestAnimationFrame === "function") return requestAnimationFrame.bind(global$1);
	return function(callback) {
		return setTimeout(function() {
			return callback(Date.now());
		}, 1e3 / 60);
	};
})();
var trailingTimeout = 2;
/**
* Creates a wrapper function which ensures that provided callback will be
* invoked only once during the specified delay period.
*
* @param {Function} callback - Function to be invoked after the delay period.
* @param {number} delay - Delay after which to invoke callback.
* @returns {Function}
*/
function throttle(callback, delay) {
	var leadingCall = false, trailingCall = false, lastCallTime = 0;
	/**
	* Invokes the original callback function and schedules new invocation if
	* the "proxy" was called during current request.
	*
	* @returns {void}
	*/
	function resolvePending() {
		if (leadingCall) {
			leadingCall = false;
			callback();
		}
		if (trailingCall) proxy();
	}
	/**
	* Callback invoked after the specified delay. It will further postpone
	* invocation of the original function delegating it to the
	* requestAnimationFrame.
	*
	* @returns {void}
	*/
	function timeoutCallback() {
		requestAnimationFrame$1(resolvePending);
	}
	/**
	* Schedules invocation of the original function.
	*
	* @returns {void}
	*/
	function proxy() {
		var timeStamp = Date.now();
		if (leadingCall) {
			if (timeStamp - lastCallTime < trailingTimeout) return;
			trailingCall = true;
		} else {
			leadingCall = true;
			trailingCall = false;
			setTimeout(timeoutCallback, delay);
		}
		lastCallTime = timeStamp;
	}
	return proxy;
}
var REFRESH_DELAY = 20;
var transitionKeys = [
	"top",
	"right",
	"bottom",
	"left",
	"width",
	"height",
	"size",
	"weight"
];
var mutationObserverSupported = typeof MutationObserver !== "undefined";
/**
* Singleton controller class which handles updates of ResizeObserver instances.
*/
var ResizeObserverController = function() {
	/**
	* Creates a new instance of ResizeObserverController.
	*
	* @private
	*/
	function ResizeObserverController() {
		/**
		* Indicates whether DOM listeners have been added.
		*
		* @private {boolean}
		*/
		this.connected_ = false;
		/**
		* Tells that controller has subscribed for Mutation Events.
		*
		* @private {boolean}
		*/
		this.mutationEventsAdded_ = false;
		/**
		* Keeps reference to the instance of MutationObserver.
		*
		* @private {MutationObserver}
		*/
		this.mutationsObserver_ = null;
		/**
		* A list of connected observers.
		*
		* @private {Array<ResizeObserverSPI>}
		*/
		this.observers_ = [];
		this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
		this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
	}
	/**
	* Adds observer to observers list.
	*
	* @param {ResizeObserverSPI} observer - Observer to be added.
	* @returns {void}
	*/
	ResizeObserverController.prototype.addObserver = function(observer) {
		if (!~this.observers_.indexOf(observer)) this.observers_.push(observer);
		if (!this.connected_) this.connect_();
	};
	/**
	* Removes observer from observers list.
	*
	* @param {ResizeObserverSPI} observer - Observer to be removed.
	* @returns {void}
	*/
	ResizeObserverController.prototype.removeObserver = function(observer) {
		var observers = this.observers_;
		var index = observers.indexOf(observer);
		if (~index) observers.splice(index, 1);
		if (!observers.length && this.connected_) this.disconnect_();
	};
	/**
	* Invokes the update of observers. It will continue running updates insofar
	* it detects changes.
	*
	* @returns {void}
	*/
	ResizeObserverController.prototype.refresh = function() {
		if (this.updateObservers_()) this.refresh();
	};
	/**
	* Updates every observer from observers list and notifies them of queued
	* entries.
	*
	* @private
	* @returns {boolean} Returns "true" if any observer has detected changes in
	*      dimensions of it's elements.
	*/
	ResizeObserverController.prototype.updateObservers_ = function() {
		var activeObservers = this.observers_.filter(function(observer) {
			return observer.gatherActive(), observer.hasActive();
		});
		activeObservers.forEach(function(observer) {
			return observer.broadcastActive();
		});
		return activeObservers.length > 0;
	};
	/**
	* Initializes DOM listeners.
	*
	* @private
	* @returns {void}
	*/
	ResizeObserverController.prototype.connect_ = function() {
		if (!isBrowser || this.connected_) return;
		document.addEventListener("transitionend", this.onTransitionEnd_);
		window.addEventListener("resize", this.refresh);
		if (mutationObserverSupported) {
			this.mutationsObserver_ = new MutationObserver(this.refresh);
			this.mutationsObserver_.observe(document, {
				attributes: true,
				childList: true,
				characterData: true,
				subtree: true
			});
		} else {
			document.addEventListener("DOMSubtreeModified", this.refresh);
			this.mutationEventsAdded_ = true;
		}
		this.connected_ = true;
	};
	/**
	* Removes DOM listeners.
	*
	* @private
	* @returns {void}
	*/
	ResizeObserverController.prototype.disconnect_ = function() {
		if (!isBrowser || !this.connected_) return;
		document.removeEventListener("transitionend", this.onTransitionEnd_);
		window.removeEventListener("resize", this.refresh);
		if (this.mutationsObserver_) this.mutationsObserver_.disconnect();
		if (this.mutationEventsAdded_) document.removeEventListener("DOMSubtreeModified", this.refresh);
		this.mutationsObserver_ = null;
		this.mutationEventsAdded_ = false;
		this.connected_ = false;
	};
	/**
	* "Transitionend" event handler.
	*
	* @private
	* @param {TransitionEvent} event
	* @returns {void}
	*/
	ResizeObserverController.prototype.onTransitionEnd_ = function(_a) {
		var _b = _a.propertyName, propertyName = _b === void 0 ? "" : _b;
		if (transitionKeys.some(function(key) {
			return !!~propertyName.indexOf(key);
		})) this.refresh();
	};
	/**
	* Returns instance of the ResizeObserverController.
	*
	* @returns {ResizeObserverController}
	*/
	ResizeObserverController.getInstance = function() {
		if (!this.instance_) this.instance_ = new ResizeObserverController();
		return this.instance_;
	};
	/**
	* Holds reference to the controller's instance.
	*
	* @private {ResizeObserverController}
	*/
	ResizeObserverController.instance_ = null;
	return ResizeObserverController;
}();
/**
* Defines non-writable/enumerable properties of the provided target object.
*
* @param {Object} target - Object for which to define properties.
* @param {Object} props - Properties to be defined.
* @returns {Object} Target object.
*/
var defineConfigurable = (function(target, props) {
	for (var _i = 0, _a = Object.keys(props); _i < _a.length; _i++) {
		var key = _a[_i];
		Object.defineProperty(target, key, {
			value: props[key],
			enumerable: false,
			writable: false,
			configurable: true
		});
	}
	return target;
});
/**
* Returns the global object associated with provided element.
*
* @param {Object} target
* @returns {Object}
*/
var getWindowOf = (function(target) {
	return target && target.ownerDocument && target.ownerDocument.defaultView || global$1;
});
var emptyRect = createRectInit(0, 0, 0, 0);
/**
* Converts provided string to a number.
*
* @param {number|string} value
* @returns {number}
*/
function toFloat(value) {
	return parseFloat(value) || 0;
}
/**
* Extracts borders size from provided styles.
*
* @param {CSSStyleDeclaration} styles
* @param {...string} positions - Borders positions (top, right, ...)
* @returns {number}
*/
function getBordersSize(styles) {
	var positions = [];
	for (var _i = 1; _i < arguments.length; _i++) positions[_i - 1] = arguments[_i];
	return positions.reduce(function(size, position) {
		var value = styles["border-" + position + "-width"];
		return size + toFloat(value);
	}, 0);
}
/**
* Extracts paddings sizes from provided styles.
*
* @param {CSSStyleDeclaration} styles
* @returns {Object} Paddings box.
*/
function getPaddings(styles) {
	var positions = [
		"top",
		"right",
		"bottom",
		"left"
	];
	var paddings = {};
	for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
		var position = positions_1[_i];
		var value = styles["padding-" + position];
		paddings[position] = toFloat(value);
	}
	return paddings;
}
/**
* Calculates content rectangle of provided SVG element.
*
* @param {SVGGraphicsElement} target - Element content rectangle of which needs
*      to be calculated.
* @returns {DOMRectInit}
*/
function getSVGContentRect(target) {
	var bbox = target.getBBox();
	return createRectInit(0, 0, bbox.width, bbox.height);
}
/**
* Calculates content rectangle of provided HTMLElement.
*
* @param {HTMLElement} target - Element for which to calculate the content rectangle.
* @returns {DOMRectInit}
*/
function getHTMLElementContentRect(target) {
	var clientWidth = target.clientWidth, clientHeight = target.clientHeight;
	if (!clientWidth && !clientHeight) return emptyRect;
	var styles = getWindowOf(target).getComputedStyle(target);
	var paddings = getPaddings(styles);
	var horizPad = paddings.left + paddings.right;
	var vertPad = paddings.top + paddings.bottom;
	var width = toFloat(styles.width), height = toFloat(styles.height);
	if (styles.boxSizing === "border-box") {
		if (Math.round(width + horizPad) !== clientWidth) width -= getBordersSize(styles, "left", "right") + horizPad;
		if (Math.round(height + vertPad) !== clientHeight) height -= getBordersSize(styles, "top", "bottom") + vertPad;
	}
	if (!isDocumentElement(target)) {
		var vertScrollbar = Math.round(width + horizPad) - clientWidth;
		var horizScrollbar = Math.round(height + vertPad) - clientHeight;
		if (Math.abs(vertScrollbar) !== 1) width -= vertScrollbar;
		if (Math.abs(horizScrollbar) !== 1) height -= horizScrollbar;
	}
	return createRectInit(paddings.left, paddings.top, width, height);
}
/**
* Checks whether provided element is an instance of the SVGGraphicsElement.
*
* @param {Element} target - Element to be checked.
* @returns {boolean}
*/
var isSVGGraphicsElement = (function() {
	if (typeof SVGGraphicsElement !== "undefined") return function(target) {
		return target instanceof getWindowOf(target).SVGGraphicsElement;
	};
	return function(target) {
		return target instanceof getWindowOf(target).SVGElement && typeof target.getBBox === "function";
	};
})();
/**
* Checks whether provided element is a document element (<html>).
*
* @param {Element} target - Element to be checked.
* @returns {boolean}
*/
function isDocumentElement(target) {
	return target === getWindowOf(target).document.documentElement;
}
/**
* Calculates an appropriate content rectangle for provided html or svg element.
*
* @param {Element} target - Element content rectangle of which needs to be calculated.
* @returns {DOMRectInit}
*/
function getContentRect(target) {
	if (!isBrowser) return emptyRect;
	if (isSVGGraphicsElement(target)) return getSVGContentRect(target);
	return getHTMLElementContentRect(target);
}
/**
* Creates rectangle with an interface of the DOMRectReadOnly.
* Spec: https://drafts.fxtf.org/geometry/#domrectreadonly
*
* @param {DOMRectInit} rectInit - Object with rectangle's x/y coordinates and dimensions.
* @returns {DOMRectReadOnly}
*/
function createReadOnlyRect(_a) {
	var x = _a.x, y = _a.y, width = _a.width, height = _a.height;
	var rect = Object.create((typeof DOMRectReadOnly !== "undefined" ? DOMRectReadOnly : Object).prototype);
	defineConfigurable(rect, {
		x,
		y,
		width,
		height,
		top: y,
		right: x + width,
		bottom: height + y,
		left: x
	});
	return rect;
}
/**
* Creates DOMRectInit object based on the provided dimensions and the x/y coordinates.
* Spec: https://drafts.fxtf.org/geometry/#dictdef-domrectinit
*
* @param {number} x - X coordinate.
* @param {number} y - Y coordinate.
* @param {number} width - Rectangle's width.
* @param {number} height - Rectangle's height.
* @returns {DOMRectInit}
*/
function createRectInit(x, y, width, height) {
	return {
		x,
		y,
		width,
		height
	};
}
/**
* Class that is responsible for computations of the content rectangle of
* provided DOM element and for keeping track of it's changes.
*/
var ResizeObservation = function() {
	/**
	* Creates an instance of ResizeObservation.
	*
	* @param {Element} target - Element to be observed.
	*/
	function ResizeObservation(target) {
		/**
		* Broadcasted width of content rectangle.
		*
		* @type {number}
		*/
		this.broadcastWidth = 0;
		/**
		* Broadcasted height of content rectangle.
		*
		* @type {number}
		*/
		this.broadcastHeight = 0;
		/**
		* Reference to the last observed content rectangle.
		*
		* @private {DOMRectInit}
		*/
		this.contentRect_ = createRectInit(0, 0, 0, 0);
		this.target = target;
	}
	/**
	* Updates content rectangle and tells whether it's width or height properties
	* have changed since the last broadcast.
	*
	* @returns {boolean}
	*/
	ResizeObservation.prototype.isActive = function() {
		var rect = getContentRect(this.target);
		this.contentRect_ = rect;
		return rect.width !== this.broadcastWidth || rect.height !== this.broadcastHeight;
	};
	/**
	* Updates 'broadcastWidth' and 'broadcastHeight' properties with a data
	* from the corresponding properties of the last observed content rectangle.
	*
	* @returns {DOMRectInit} Last observed content rectangle.
	*/
	ResizeObservation.prototype.broadcastRect = function() {
		var rect = this.contentRect_;
		this.broadcastWidth = rect.width;
		this.broadcastHeight = rect.height;
		return rect;
	};
	return ResizeObservation;
}();
var ResizeObserverEntry = function() {
	/**
	* Creates an instance of ResizeObserverEntry.
	*
	* @param {Element} target - Element that is being observed.
	* @param {DOMRectInit} rectInit - Data of the element's content rectangle.
	*/
	function ResizeObserverEntry(target, rectInit) {
		var contentRect = createReadOnlyRect(rectInit);
		defineConfigurable(this, {
			target,
			contentRect
		});
	}
	return ResizeObserverEntry;
}();
var ResizeObserverSPI = function() {
	/**
	* Creates a new instance of ResizeObserver.
	*
	* @param {ResizeObserverCallback} callback - Callback function that is invoked
	*      when one of the observed elements changes it's content dimensions.
	* @param {ResizeObserverController} controller - Controller instance which
	*      is responsible for the updates of observer.
	* @param {ResizeObserver} callbackCtx - Reference to the public
	*      ResizeObserver instance which will be passed to callback function.
	*/
	function ResizeObserverSPI(callback, controller, callbackCtx) {
		/**
		* Collection of resize observations that have detected changes in dimensions
		* of elements.
		*
		* @private {Array<ResizeObservation>}
		*/
		this.activeObservations_ = [];
		/**
		* Registry of the ResizeObservation instances.
		*
		* @private {Map<Element, ResizeObservation>}
		*/
		this.observations_ = new MapShim();
		if (typeof callback !== "function") throw new TypeError("The callback provided as parameter 1 is not a function.");
		this.callback_ = callback;
		this.controller_ = controller;
		this.callbackCtx_ = callbackCtx;
	}
	/**
	* Starts observing provided element.
	*
	* @param {Element} target - Element to be observed.
	* @returns {void}
	*/
	ResizeObserverSPI.prototype.observe = function(target) {
		if (!arguments.length) throw new TypeError("1 argument required, but only 0 present.");
		if (typeof Element === "undefined" || !(Element instanceof Object)) return;
		if (!(target instanceof getWindowOf(target).Element)) throw new TypeError("parameter 1 is not of type \"Element\".");
		var observations = this.observations_;
		if (observations.has(target)) return;
		observations.set(target, new ResizeObservation(target));
		this.controller_.addObserver(this);
		this.controller_.refresh();
	};
	/**
	* Stops observing provided element.
	*
	* @param {Element} target - Element to stop observing.
	* @returns {void}
	*/
	ResizeObserverSPI.prototype.unobserve = function(target) {
		if (!arguments.length) throw new TypeError("1 argument required, but only 0 present.");
		if (typeof Element === "undefined" || !(Element instanceof Object)) return;
		if (!(target instanceof getWindowOf(target).Element)) throw new TypeError("parameter 1 is not of type \"Element\".");
		var observations = this.observations_;
		if (!observations.has(target)) return;
		observations.delete(target);
		if (!observations.size) this.controller_.removeObserver(this);
	};
	/**
	* Stops observing all elements.
	*
	* @returns {void}
	*/
	ResizeObserverSPI.prototype.disconnect = function() {
		this.clearActive();
		this.observations_.clear();
		this.controller_.removeObserver(this);
	};
	/**
	* Collects observation instances the associated element of which has changed
	* it's content rectangle.
	*
	* @returns {void}
	*/
	ResizeObserverSPI.prototype.gatherActive = function() {
		var _this = this;
		this.clearActive();
		this.observations_.forEach(function(observation) {
			if (observation.isActive()) _this.activeObservations_.push(observation);
		});
	};
	/**
	* Invokes initial callback function with a list of ResizeObserverEntry
	* instances collected from active resize observations.
	*
	* @returns {void}
	*/
	ResizeObserverSPI.prototype.broadcastActive = function() {
		if (!this.hasActive()) return;
		var ctx = this.callbackCtx_;
		var entries = this.activeObservations_.map(function(observation) {
			return new ResizeObserverEntry(observation.target, observation.broadcastRect());
		});
		this.callback_.call(ctx, entries, ctx);
		this.clearActive();
	};
	/**
	* Clears the collection of active observations.
	*
	* @returns {void}
	*/
	ResizeObserverSPI.prototype.clearActive = function() {
		this.activeObservations_.splice(0);
	};
	/**
	* Tells whether observer has active observations.
	*
	* @returns {boolean}
	*/
	ResizeObserverSPI.prototype.hasActive = function() {
		return this.activeObservations_.length > 0;
	};
	return ResizeObserverSPI;
}();
var observers = typeof WeakMap !== "undefined" ? /* @__PURE__ */ new WeakMap() : new MapShim();
/**
* ResizeObserver API. Encapsulates the ResizeObserver SPI implementation
* exposing only those methods and properties that are defined in the spec.
*/
var ResizeObserver = function() {
	/**
	* Creates a new instance of ResizeObserver.
	*
	* @param {ResizeObserverCallback} callback - Callback that is invoked when
	*      dimensions of the observed elements change.
	*/
	function ResizeObserver(callback) {
		if (!(this instanceof ResizeObserver)) throw new TypeError("Cannot call a class as a function.");
		if (!arguments.length) throw new TypeError("1 argument required, but only 0 present.");
		var observer = new ResizeObserverSPI(callback, ResizeObserverController.getInstance(), this);
		observers.set(this, observer);
	}
	return ResizeObserver;
}();
[
	"observe",
	"unobserve",
	"disconnect"
].forEach(function(method) {
	ResizeObserver.prototype[method] = function() {
		var _a;
		return (_a = observers.get(this))[method].apply(_a, arguments);
	};
});
var index = (function() {
	if (typeof global$1.ResizeObserver !== "undefined") return global$1.ResizeObserver;
	return ResizeObserver;
})();
//#endregion
export { index as t };
