import { d as __toESM, i as require_react, n as require_jsx_runtime, o as __commonJSMin } from "./toast-C8a1ReSo.js";
import { c as judgeSskeyIsActiveTime, k as printOrder, r as getCookie, z as sendSignature } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { r as require_prop_types } from "./tiny-warning.esm-Cf7nlwXj.js";
import { H as markPostPaymentAction } from "./actions-BwRPwnFF.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as index } from "./ResizeObserver.es-BEMNHY3K.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as Alert_default } from "./Alert-DyodYoNQ.js";
import { a as sendError2MsgCenter } from "./processZeroAmountOrder-bzVRsrOO.js";
import { t as CallModal } from "./callModal-DiGxH1ne.js";
import { t as menusifuLoading } from "./menusifuLoading-BlNMP81R.js";
import { t as goToPaymentMemberOrFinish } from "./paymentMemberNavigation-B5bHxJaq.js";
//#region node_modules/lazy-brush/lib/Point.js
var require_Point$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
	}
	exports.default = function Point(x, y) {
		_classCallCheck(this, Point);
		this.x = x;
		this.y = y;
	};
}));
//#endregion
//#region node_modules/lazy-brush/lib/LazyPoint.js
var require_LazyPoint = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var _createClass = function() {
		function defineProperties(target, props) {
			for (var i = 0; i < props.length; i++) {
				var descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || false;
				descriptor.configurable = true;
				if ("value" in descriptor) descriptor.writable = true;
				Object.defineProperty(target, descriptor.key, descriptor);
			}
		}
		return function(Constructor, protoProps, staticProps) {
			if (protoProps) defineProperties(Constructor.prototype, protoProps);
			if (staticProps) defineProperties(Constructor, staticProps);
			return Constructor;
		};
	}();
	var _Point3 = _interopRequireDefault(require_Point$1());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
	}
	function _possibleConstructorReturn(self, call) {
		if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}
	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: {
			value: subClass,
			enumerable: false,
			writable: true,
			configurable: true
		} });
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}
	exports.default = function(_Point) {
		_inherits(LazyPoint, _Point);
		function LazyPoint() {
			_classCallCheck(this, LazyPoint);
			return _possibleConstructorReturn(this, (LazyPoint.__proto__ || Object.getPrototypeOf(LazyPoint)).apply(this, arguments));
		}
		_createClass(LazyPoint, [
			{
				key: "update",
				/**
				* Update the x and y values
				*
				* @param {Point} point
				*/
				value: function update(point) {
					this.x = point.x;
					this.y = point.y;
				}
			},
			{
				key: "moveByAngle",
				value: function moveByAngle(angle, distance) {
					var angleRotated = angle + Math.PI / 2;
					this.x = this.x + Math.sin(angleRotated) * distance, this.y = this.y - Math.cos(angleRotated) * distance;
				}
			},
			{
				key: "equalsTo",
				value: function equalsTo(point) {
					return this.x === point.x && this.y === point.y;
				}
			},
			{
				key: "getDifferenceTo",
				value: function getDifferenceTo(point) {
					return new _Point3.default(this.x - point.x, this.y - point.y);
				}
			},
			{
				key: "getDistanceTo",
				value: function getDistanceTo(point) {
					var diff = this.getDifferenceTo(point);
					return Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));
				}
			},
			{
				key: "getAngleTo",
				value: function getAngleTo(point) {
					var diff = this.getDifferenceTo(point);
					return Math.atan2(diff.y, diff.x);
				}
			},
			{
				key: "toObject",
				value: function toObject() {
					return {
						x: this.x,
						y: this.y
					};
				}
			}
		]);
		return LazyPoint;
	}(_Point3.default);
}));
//#endregion
//#region node_modules/lazy-brush/lib/LazyBrush.js
var require_LazyBrush = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var _createClass = function() {
		function defineProperties(target, props) {
			for (var i = 0; i < props.length; i++) {
				var descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || false;
				descriptor.configurable = true;
				if ("value" in descriptor) descriptor.writable = true;
				Object.defineProperty(target, descriptor.key, descriptor);
			}
		}
		return function(Constructor, protoProps, staticProps) {
			if (protoProps) defineProperties(Constructor.prototype, protoProps);
			if (staticProps) defineProperties(Constructor, staticProps);
			return Constructor;
		};
	}();
	var _LazyPoint2 = _interopRequireDefault(require_LazyPoint());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
	}
	var RADIUS_DEFAULT = 30;
	exports.default = function() {
		/**
		* constructor
		*
		* @param {object} settings
		* @param {number} settings.radius The radius for the lazy area
		* @param {boolean} settings.enabled
		*/
		function LazyBrush() {
			var _ref = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, _ref$radius = _ref.radius, radius = _ref$radius === void 0 ? RADIUS_DEFAULT : _ref$radius, _ref$enabled = _ref.enabled, enabled = _ref$enabled === void 0 ? true : _ref$enabled, _ref$initialPoint = _ref.initialPoint, initialPoint = _ref$initialPoint === void 0 ? {
				x: 0,
				y: 0
			} : _ref$initialPoint;
			_classCallCheck(this, LazyBrush);
			this.radius = radius;
			this._isEnabled = enabled;
			this.pointer = new _LazyPoint2.default(initialPoint.x, initialPoint.y);
			this.brush = new _LazyPoint2.default(initialPoint.x, initialPoint.y);
			this.angle = 0;
			this.distance = 0;
			this._hasMoved = false;
		}
		/**
		* Enable lazy brush calculations.
		*
		*/
		_createClass(LazyBrush, [
			{
				key: "enable",
				value: function enable() {
					this._isEnabled = true;
				}
			},
			{
				key: "disable",
				value: function disable() {
					this._isEnabled = false;
				}
			},
			{
				key: "isEnabled",
				value: function isEnabled() {
					return this._isEnabled;
				}
			},
			{
				key: "setRadius",
				value: function setRadius(radius) {
					this.radius = radius;
				}
			},
			{
				key: "getRadius",
				value: function getRadius() {
					return this.radius;
				}
			},
			{
				key: "getBrushCoordinates",
				value: function getBrushCoordinates() {
					return this.brush.toObject();
				}
			},
			{
				key: "getPointerCoordinates",
				value: function getPointerCoordinates() {
					return this.pointer.toObject();
				}
			},
			{
				key: "getBrush",
				value: function getBrush() {
					return this.brush;
				}
			},
			{
				key: "getPointer",
				value: function getPointer() {
					return this.pointer;
				}
			},
			{
				key: "getAngle",
				value: function getAngle() {
					return this.angle;
				}
			},
			{
				key: "getDistance",
				value: function getDistance() {
					return this.distance;
				}
			},
			{
				key: "brushHasMoved",
				value: function brushHasMoved() {
					return this._hasMoved;
				}
			},
			{
				key: "update",
				value: function update(newPointerPoint) {
					var _ref2$both = (arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}).both, both = _ref2$both === void 0 ? false : _ref2$both;
					this._hasMoved = false;
					if (this.pointer.equalsTo(newPointerPoint) && !both) return false;
					this.pointer.update(newPointerPoint);
					if (both) {
						this._hasMoved = true;
						this.brush.update(newPointerPoint);
						return true;
					}
					if (this._isEnabled) {
						this.distance = this.pointer.getDistanceTo(this.brush);
						this.angle = this.pointer.getAngleTo(this.brush);
						if (this.distance > this.radius) {
							this.brush.moveByAngle(this.angle, this.distance - this.radius);
							this._hasMoved = true;
						}
					} else {
						this.distance = 0;
						this.angle = 0;
						this.brush.update(newPointerPoint);
						this._hasMoved = true;
					}
					return true;
				}
			}
		]);
		return LazyBrush;
	}();
}));
//#endregion
//#region node_modules/lazy-brush/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.LazyPoint = exports.Point = exports.LazyBrush = void 0;
	var _LazyBrush2 = _interopRequireDefault(require_LazyBrush());
	var _Point2 = _interopRequireDefault(require_Point$1());
	var _LazyPoint2 = _interopRequireDefault(require_LazyPoint());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	exports.LazyBrush = _LazyBrush2.default;
	exports.Point = _Point2.default;
	exports.LazyPoint = _LazyPoint2.default;
}));
//#endregion
//#region node_modules/catenary-curve/lib/Point.js
var require_Point = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var _createClass = function() {
		function defineProperties(target, props) {
			for (var i = 0; i < props.length; i++) {
				var descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || false;
				descriptor.configurable = true;
				if ("value" in descriptor) descriptor.writable = true;
				Object.defineProperty(target, descriptor.key, descriptor);
			}
		}
		return function(Constructor, protoProps, staticProps) {
			if (protoProps) defineProperties(Constructor.prototype, protoProps);
			if (staticProps) defineProperties(Constructor, staticProps);
			return Constructor;
		};
	}();
	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
	}
	exports.default = function() {
		/**
		*
		* @param {number} x
		* @param {number} y
		*/
		function Point(x, y) {
			_classCallCheck(this, Point);
			this.x = x;
			this.y = y;
		}
		/**
		* Update the x and y values
		*
		* @param {Point} point
		*/
		_createClass(Point, [
			{
				key: "update",
				value: function update(point) {
					this.x = point.x;
					this.y = point.y;
				}
			},
			{
				key: "getDifferenceTo",
				value: function getDifferenceTo(point) {
					return new Point(this.x - point.x, this.y - point.y);
				}
			},
			{
				key: "getDistanceTo",
				value: function getDistanceTo(point) {
					var diff = this.getDifferenceTo(point);
					return Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));
				}
			}
		]);
		return Point;
	}();
}));
//#endregion
//#region node_modules/catenary-curve/lib/Catenary.js
var require_Catenary = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var _createClass = function() {
		function defineProperties(target, props) {
			for (var i = 0; i < props.length; i++) {
				var descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || false;
				descriptor.configurable = true;
				if ("value" in descriptor) descriptor.writable = true;
				Object.defineProperty(target, descriptor.key, descriptor);
			}
		}
		return function(Constructor, protoProps, staticProps) {
			if (protoProps) defineProperties(Constructor.prototype, protoProps);
			if (staticProps) defineProperties(Constructor, staticProps);
			return Constructor;
		};
	}();
	var _Point2 = _interopRequireDefault(require_Point());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
	}
	var EPSILON = 1e-6;
	exports.default = function() {
		/**
		* constructor
		*
		* @param {Object} settings
		* @param {Number} settings.segments Number of segments of the chain.
		* @param {Number} settings.iterationLimit Maximum amount iterations for getting catenary parameters.
		*/
		function Catenary() {
			var _ref = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, _ref$segments = _ref.segments, segments = _ref$segments === void 0 ? 50 : _ref$segments, _ref$iterationLimit = _ref.iterationLimit, iterationLimit = _ref$iterationLimit === void 0 ? 100 : _ref$iterationLimit;
			_classCallCheck(this, Catenary);
			this.p1 = new _Point2.default();
			this.p2 = new _Point2.default();
			this.segments = segments;
			this.iterationLimit = iterationLimit;
		}
		/**
		* Draws a catenary given two coordinates, a length and a context.
		* 
		* @param {CanvasRenderingContext2D} context The canvas context to draw the catenary on to.
		* @param {Point} p1 First point
		* @param {Point} p2 Second point
		* @param {Number} chainLength The length of the catenary
		*/
		_createClass(Catenary, [
			{
				key: "drawToCanvas",
				value: function drawToCanvas(context, point1, point2, chainLength) {
					this.p1.update(point1);
					this.p2.update(point2);
					var isFlipped = this.p1.x > this.p2.x;
					var p1 = isFlipped ? this.p2 : this.p1;
					var p2 = isFlipped ? this.p1 : this.p2;
					var distance = p1.getDistanceTo(p2);
					var curveData = [];
					var isStraight = true;
					if (distance < chainLength) if (p2.x - p1.x > .01) {
						var h = p2.x - p1.x;
						var v = p2.y - p1.y;
						var a = -this.getCatenaryParameter(h, v, chainLength, this.iterationLimit);
						var x = (a * Math.log((chainLength + v) / (chainLength - v)) - h) * .5;
						var y = a * Math.cosh(x / a);
						var offsetX = p1.x - x;
						var offsetY = p1.y - y;
						curveData = this.getCurve(a, p1, p2, offsetX, offsetY, this.segments);
						isStraight = false;
					} else {
						var mx = (p1.x + p2.x) * .5;
						var my = (p1.y + p2.y + chainLength) * .5;
						curveData = [
							[p1.x, p1.y],
							[mx, my],
							[p2.x, p2.y]
						];
					}
					else curveData = [[p1.x, p1.y], [p2.x, p2.y]];
					if (isStraight) this.drawLine(curveData, context);
					else this.drawCurve(curveData, context);
					return curveData;
				}
			},
			{
				key: "getCatenaryParameter",
				value: function getCatenaryParameter(h, v, length, limit) {
					var m = Math.sqrt(length * length - v * v) / h;
					var x = Math.acosh(m) + 1;
					var prevx = -1;
					var count = 0;
					while (Math.abs(x - prevx) > EPSILON && count < limit) {
						prevx = x;
						x = x - (Math.sinh(x) - m * x) / (Math.cosh(x) - m);
						count++;
					}
					return h / (2 * x);
				}
			},
			{
				key: "getCurve",
				value: function getCurve(a, p1, p2, offsetX, offsetY, segments) {
					var data = [p1.x, a * Math.cosh((p1.x - offsetX) / a) + offsetY];
					var d = p2.x - p1.x;
					var length = segments - 1;
					for (var i = 0; i < length; i++) {
						var x = p1.x + d * (i + .5) / length;
						var y = a * Math.cosh((x - offsetX) / a) + offsetY;
						data.push(x, y);
					}
					data.push(p2.x, a * Math.cosh((p2.x - offsetX) / a) + offsetY);
					return data;
				}
			},
			{
				key: "drawLine",
				value: function drawLine(data, context) {
					context.moveTo(data[0][0], data[0][1]);
					context.lineTo(data[1][0], data[1][1]);
				}
			},
			{
				key: "drawCurve",
				value: function drawCurve(data, context) {
					var length = data.length * .5 - 1;
					var ox = data[2];
					var oy = data[3];
					var temp = [];
					context.moveTo(data[0], data[1]);
					for (var i = 2; i < length; i++) {
						var x = data[i * 2];
						var y = data[i * 2 + 1];
						var mx = (x + ox) * .5;
						var my = (y + oy) * .5;
						temp.push([
							ox,
							oy,
							mx,
							my
						]);
						context.quadraticCurveTo(ox, oy, mx, my);
						ox = x;
						oy = y;
					}
					length = data.length;
					context.quadraticCurveTo(data[length - 4], data[length - 3], data[length - 2], data[length - 1]);
					return temp;
				}
			}
		]);
		return Catenary;
	}();
}));
//#endregion
//#region node_modules/catenary-curve/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Point = exports.Catenary = void 0;
	var _Catenary2 = _interopRequireDefault(require_Catenary());
	var _Point2 = _interopRequireDefault(require_Point());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	exports.Catenary = _Catenary2.default;
	exports.Point = _Point2.default;
}));
//#endregion
//#region node_modules/react-canvas-draw/es/coordinateSystem.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_prop_types = /* @__PURE__ */ __toESM(require_prop_types());
var import_lib = require_lib$1();
var import_lib$1 = require_lib();
function _extends$1() {
	_extends$1 = Object.assign || function(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
		}
		return target;
	};
	return _extends$1.apply(this, arguments);
}
function _defineProperties(target, props) {
	for (var i = 0; i < props.length; i++) {
		var descriptor = props[i];
		descriptor.enumerable = descriptor.enumerable || false;
		descriptor.configurable = true;
		if ("value" in descriptor) descriptor.writable = true;
		Object.defineProperty(target, descriptor.key, descriptor);
	}
}
function _createClass(Constructor, protoProps, staticProps) {
	if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	if (staticProps) _defineProperties(Constructor, staticProps);
	return Constructor;
}
function _defineProperty$2(obj, key, value) {
	if (key in obj) Object.defineProperty(obj, key, {
		value,
		enumerable: true,
		configurable: true,
		writable: true
	});
	else obj[key] = value;
	return obj;
}
/**
* @type {ViewPoint}
*/
var NULL_VIEW_POINT = Object.freeze({
	x: 0,
	y: 0,
	untransformedX: 0,
	untransformedY: 0
});
/**
* @type {CanvasBounds}
*/
var NULL_BOUNDS = Object.freeze({
	canvasWidth: 0,
	canvasHeight: 0,
	left: 0,
	top: 0,
	right: 0,
	bottom: 0,
	viewMin: NULL_VIEW_POINT,
	viewMax: NULL_VIEW_POINT
});
/**
* The identity matrix (a transform that results in view coordinates that are
* identical to relative client coordinates).
* @type {Matrix}
*/
var IDENTITY = Object.freeze({
	a: 1,
	b: 0,
	c: 0,
	d: 1,
	e: 0,
	f: 0
});
/**
* Facilitates calculation and manipulation of a zoom-and-pannable view within a
* canvas.
*/
var CoordinateSystem = /*#__PURE__*/ function() {
	/**
	* @typedef Extents
	* @property {number} min the minimal value in the range
	* @property {number} max the maximal value in the range
	*/
	/**
	* @typedef Size
	* @property {number} width the span of the element's horizontal axis
	* @property {number} height the span of the element's vertical axis
	*/
	/**
	* @param {Object} parameters the initialization parameters for this instance.
	* @param {Extents} parameters.scaleExtents the minimum and maximum allowable scale factor.
	* @param {Sizee} parameters.documentSize the width and height of the document, in client space.
	*/
	function CoordinateSystem(_ref) {
		var _this = this;
		var scaleExtents = _ref.scaleExtents, documentSize = _ref.documentSize;
		_defineProperty$2(this, "_scaleExtents", void 0);
		_defineProperty$2(this, "_documentSize", void 0);
		_defineProperty$2(this, "_canvas", null);
		_defineProperty$2(this, "_view", {
			scale: 1,
			x: 0,
			y: 0
		});
		_defineProperty$2(this, "_viewChangeListeners", /* @__PURE__ */ new Set());
		_defineProperty$2(this, "setScale", function(scale) {
			_this.setView({ scale });
		});
		_defineProperty$2(this, "clampView", function(_ref2) {
			var scale = _ref2.scale, x = _ref2.x, y = _ref2.y;
			var _this$scaleExtents = _this.scaleExtents, min = _this$scaleExtents.min, max = _this$scaleExtents.max;
			var _this$documentSize = _this.documentSize, width = _this$documentSize.width, height = _this$documentSize.height;
			var _ref3 = _this.canvasRect || NULL_BOUNDS, left = _ref3.left, top = _ref3.top, right = _ref3.right, bottom = _ref3.bottom;
			var canvasWidth = right - left;
			var canvasHeight = bottom - top;
			var maxx = canvasWidth / 2;
			var minx = -(width * _this._view.scale - canvasWidth / 2);
			var maxy = canvasHeight / 2;
			var miny = -(height * _this._view.scale - canvasHeight / 2);
			return {
				scale: Math.min(Math.max(scale, min), max),
				x: Math.min(Math.max(x, minx), maxx),
				y: Math.min(Math.max(y, miny), maxy)
			};
		});
		_defineProperty$2(this, "resetView", function() {
			_this.setView({
				scale: 1,
				x: 0,
				y: 0
			});
		});
		_defineProperty$2(this, "setView", function(view) {
			var newView = _this.clampView(_extends$1({}, _this._view, view || {}));
			var _this$_view = _this._view, scale = _this$_view.scale, x = _this$_view.x, y = _this$_view.y;
			if (newView.scale !== scale || newView.x !== x || newView.y !== y) {
				_this._view = newView;
				_this._viewChangeListeners.forEach(function(listener) {
					return listener && listener(newView);
				});
			}
			return _extends$1({}, _this._view);
		});
		_defineProperty$2(this, "scaleAtClientPoint", function(deltaScale, clientPoint) {
			var viewPt = _this.clientPointToViewPoint(clientPoint);
			var newView = _this.clampView(_extends$1({}, _this._view, { scale: _this._view.scale + deltaScale }));
			var clientPtPostScale = _this.viewPointToClientPoint(viewPt, newView);
			newView.x = _this._view.x - (clientPtPostScale.clientX - clientPoint.clientX);
			newView.y = _this._view.y - (clientPtPostScale.clientY - clientPoint.clientY);
			return _this.setView(newView);
		});
		_defineProperty$2(this, "clientPointToViewPoint", function(_ref4, view) {
			var clientX = _ref4.clientX, clientY = _ref4.clientY;
			if (view === void 0) view = _this._view;
			var _ref5 = _this.canvasRect || NULL_BOUNDS, left = _ref5.left, top = _ref5.top;
			var relativeClientX = clientX - left;
			var relativeClientY = clientY - top;
			return {
				x: (relativeClientX - view.x) / view.scale,
				y: (relativeClientY - view.y) / view.scale,
				relativeClientX,
				relativeClientY
			};
		});
		_defineProperty$2(this, "viewPointToClientPoint", function(_ref6, view) {
			var x = _ref6.x, y = _ref6.y;
			if (view === void 0) view = _this._view;
			var _ref7 = _this.canvasRect || NULL_BOUNDS, left = _ref7.left, top = _ref7.top;
			var relativeX = x * view.scale + view.x;
			var relativeY = y * view.scale + view.y;
			var clientX = relativeX + left;
			var clientY = relativeY + top;
			return {
				clientX,
				clientY,
				relativeX,
				relativeY,
				x: clientX,
				y: clientY
			};
		});
		_defineProperty$2(this, "attachViewChangeListener", function(listener) {
			_this._viewChangeListeners.add(listener);
		});
		this._scaleExtents = scaleExtents;
		this._documentSize = documentSize;
	}
	/**
	* @type {Extents}
	*/
	_createClass(CoordinateSystem, [
		{
			key: "canvas",
			/**
			* @returns {Canvas} the canvas currently associated with this instance.
			*/
			get: function get() {
				return this._canvas;
			},
			set: function set(canvas) {
				this._canvas = canvas;
				this.setView();
			}
		},
		{
			key: "scale",
			get: function get() {
				return this._view.scale;
			}
		},
		{
			key: "x",
			/**
			* @returns {number} the horizontal component of the current pan offset
			*/
			get: function get() {
				return this._view.x;
			},
			set: function set(x) {
				this.setView({ x });
			}
		},
		{
			key: "y",
			get: function get() {
				return this._view.y;
			},
			set: function set(y) {
				this.setView({ y });
			}
		},
		{
			key: "view",
			get: function get() {
				return _extends$1({}, this._view);
			}
		},
		{
			key: "scaleExtents",
			get: function get() {
				return _extends$1({}, this._scaleExtents);
			},
			set: function set(_ref8) {
				var min = _ref8.min, max = _ref8.max;
				this._scaleExtents = {
					min,
					max
				};
				this.setView();
			}
		},
		{
			key: "documentSize",
			get: function get() {
				return _extends$1({}, this._documentSize);
			},
			set: function set(_ref9) {
				var width = _ref9.width, height = _ref9.height;
				this._documentSize = {
					width,
					height
				};
				this.setView();
			}
		},
		{
			key: "transformMatrix",
			get: function get() {
				return {
					a: this._view.scale,
					b: 0,
					c: 0,
					d: this._view.scale,
					e: this._view.x,
					f: this._view.y
				};
			}
		},
		{
			key: "canvasBounds",
			get: function get() {
				if (this._canvas) {
					var _this$_canvas$getBoun = this._canvas.getBoundingClientRect(), left = _this$_canvas$getBoun.left, top = _this$_canvas$getBoun.top, right = _this$_canvas$getBoun.right, bottom = _this$_canvas$getBoun.bottom;
					return {
						viewMin: this.clientPointToViewPoint({
							clientX: left,
							clientY: top
						}),
						viewMax: this.clientPointToViewPoint({
							clientX: right,
							clientY: bottom
						}),
						left,
						top,
						right,
						bottom,
						canvasWidth: this._canvas.width,
						canvasHeight: this._canvas.height
					};
				} else return;
			}
		},
		{
			key: "canvasRect",
			get: function get() {
				if (this.canvas) return this.canvas.getBoundingClientRect();
				else return;
			}
		}
	]);
	return CoordinateSystem;
}();
//#endregion
//#region node_modules/react-canvas-draw/es/drawImage.js
/** 
* Original from: https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas
* Original By Ken Fyrstenberg Nilsen
* 
* Note: img must be fully loaded or have correct width & height set.
*/
function drawImageProp(_temp) {
	var _ref = _temp === void 0 ? {} : _temp, ctx = _ref.ctx, img = _ref.img, x = _ref.x, y = _ref.y, w = _ref.w, h = _ref.h, offsetX = _ref.offsetX, offsetY = _ref.offsetY;
	if (typeof x !== "number") x = 0;
	if (typeof y !== "number") y = 0;
	if (typeof w !== "number") w = ctx.canvas.width;
	if (typeof h !== "number") h = ctx.canvas.height;
	if (typeof offsetX !== "number") offsetX = .5;
	if (typeof offsetY !== "number") offsetY = .5;
	if (offsetX < 0) offsetX = 0;
	if (offsetY < 0) offsetY = 0;
	if (offsetX > 1) offsetX = 1;
	if (offsetY > 1) offsetY = 1;
	var iw = img.width, ih = img.height, r = Math.min(w / iw, h / ih), nw = iw * r, nh = ih * r, cx, cy, cw, ch, ar = 1;
	if (nw < w) ar = w / nw;
	if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
	nw *= ar;
	nh *= ar;
	cw = iw / (nw / w);
	ch = ih / (nh / h);
	cx = (iw - cw) * offsetX;
	cy = (ih - ch) * offsetY;
	if (cx < 0) cx = 0;
	if (cy < 0) cy = 0;
	if (cw > iw) cw = iw;
	if (ch > ih) ch = ih;
	ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}
//#endregion
//#region node_modules/react-canvas-draw/es/interactionStateMachine.js
var _this = void 0;
function _defineProperty$1(obj, key, value) {
	if (key in obj) Object.defineProperty(obj, key, {
		value,
		enumerable: true,
		configurable: true,
		writable: true
	});
	else obj[key] = value;
	return obj;
}
var TOUCH_SLOP = 10;
var PINCH_TIMEOUT_MS = 250;
var SUPPRESS_SCROLL = function SUPPRESS_SCROLL(e) {
	e.preventDefault();
	return _this;
};
/**
* The default state for the interaction state machine. Supports zoom and
* initiating pan and drawing actions.
*/
var DefaultState = function DefaultState() {
	var _this2 = this;
	_defineProperty$1(this, "handleMouseWheel", function(e, canvasDraw) {
		var _canvasDraw$props = canvasDraw.props, disabled = _canvasDraw$props.disabled, enablePanAndZoom = _canvasDraw$props.enablePanAndZoom, mouseZoomFactor = _canvasDraw$props.mouseZoomFactor;
		if (disabled) return new DisabledState();
		else if (enablePanAndZoom && e.ctrlKey) {
			e.preventDefault();
			canvasDraw.coordSystem.scaleAtClientPoint(mouseZoomFactor * e.deltaY, clientPointFromEvent(e));
		}
		return _this2;
	});
	_defineProperty$1(this, "handleDrawStart", function(e, canvasDraw) {
		if (canvasDraw.props.disabled) return new DisabledState();
		else if (e.ctrlKey && canvasDraw.props.enablePanAndZoom) return new PanState().handleDrawStart(e, canvasDraw);
		else return new WaitForPinchState().handleDrawStart(e, canvasDraw);
	});
	_defineProperty$1(this, "handleDrawMove", function(e, canvasDraw) {
		if (canvasDraw.props.disabled) return new DisabledState();
		else {
			var _viewPointFromEvent = viewPointFromEvent(canvasDraw.coordSystem, e), x = _viewPointFromEvent.x, y = _viewPointFromEvent.y;
			canvasDraw.lazy.update({
				x,
				y
			});
			return _this2;
		}
	});
	_defineProperty$1(this, "handleDrawEnd", function(e, canvasDraw) {
		return canvasDraw.props.disabled ? new DisabledState() : _this2;
	});
};
/**
* This state is used as long as the disabled prop is active. It ignores all
* events and doesn't prevent default actions. The disabled state can only be
* triggered from the default state (i.e., while no action is actively being
* performed).
*/
var DisabledState = function DisabledState() {
	var _this3 = this;
	_defineProperty$1(this, "handleMouseWheel", function(e, canvasDraw) {
		if (canvasDraw.props.disabled) return _this3;
		else return new DefaultState().handleMouseWheel(e, canvasDraw);
	});
	_defineProperty$1(this, "handleDrawStart", function(e, canvasDraw) {
		if (canvasDraw.props.disabled) return _this3;
		else return new DefaultState().handleDrawStart(e, canvasDraw);
	});
	_defineProperty$1(this, "handleDrawMove", function(e, canvasDraw) {
		if (canvasDraw.props.disabled) return _this3;
		else return new DefaultState().handleDrawMove(e, canvasDraw);
	});
	_defineProperty$1(this, "handleDrawEnd", function(e, canvasDraw) {
		if (canvasDraw.props.disabled) return _this3;
		else return new DefaultState().handleDrawEnd(e, canvasDraw);
	});
};
/**
* This state is active as long as the user is panning the image. This state is
* retained until the pan ceases.
*/
var PanState = function PanState() {
	var _this4 = this;
	_defineProperty$1(this, "handleMouseWheel", SUPPRESS_SCROLL.bind(this));
	_defineProperty$1(this, "handleDrawStart", function(e, canvasDraw) {
		e.preventDefault();
		_this4.dragStart = clientPointFromEvent(e);
		_this4.panStart = {
			x: canvasDraw.coordSystem.x,
			y: canvasDraw.coordSystem.y
		};
		return _this4;
	});
	_defineProperty$1(this, "handleDrawMove", function(e, canvasDraw) {
		e.preventDefault();
		var _clientPointFromEvent = clientPointFromEvent(e), clientX = _clientPointFromEvent.clientX, clientY = _clientPointFromEvent.clientY;
		var dx = clientX - _this4.dragStart.clientX;
		var dy = clientY - _this4.dragStart.clientY;
		canvasDraw.coordSystem.setView({
			x: _this4.panStart.x + dx,
			y: _this4.panStart.y + dy
		});
		return _this4;
	});
	_defineProperty$1(this, "handleDrawEnd", function() {
		return new DefaultState();
	});
};
/**
* This state is active when the user has initiated the drawing action but has
* not yet created any lines. We use this state to try and detect a second touch
* event to initiate a pinch-zoom action. We'll give up on that if enough time
* or movement happens without a second touch.
*/
var WaitForPinchState = function WaitForPinchState() {
	var _this5 = this;
	_defineProperty$1(this, "handleMouseWheel", SUPPRESS_SCROLL.bind(this));
	_defineProperty$1(this, "handleDrawStart", function(e, canvasDraw) {
		var enablePanAndZoom = canvasDraw.props.enablePanAndZoom;
		e.preventDefault();
		if (!e.touches || !e.touches.length || !enablePanAndZoom) return new DrawingState().handleDrawStart(e, canvasDraw);
		if (enablePanAndZoom && e.touches && e.touches.length >= 2) return new ScaleOrPanState().handleDrawStart(e, canvasDraw);
		return _this5.handleDrawMove(e, canvasDraw);
	});
	_defineProperty$1(this, "handleDrawMove", function(e, canvasDraw) {
		e.preventDefault();
		if (e.touches && e.touches.length >= 2) return new ScaleOrPanState().handleDrawStart(e, canvasDraw);
		var clientPt = clientPointFromEvent(e);
		_this5.deferredPoints.push(clientPt);
		if ((/* @__PURE__ */ new Date()).valueOf() - _this5.startTimestamp < PINCH_TIMEOUT_MS) {
			if (_this5.startClientPoint === null) _this5.startClientPoint = clientPt;
			if (Math.abs(clientPt.clientX - _this5.startClientPoint.clientX) + Math.abs(clientPt.clientY - _this5.startClientPoint.clientY) < TOUCH_SLOP) return _this5;
		}
		return _this5.issueDeferredPoints(canvasDraw);
	});
	_defineProperty$1(this, "handleDrawEnd", function(e, canvasDraw) {
		return _this5.issueDeferredPoints(canvasDraw).handleDrawEnd(e, canvasDraw);
	});
	_defineProperty$1(this, "issueDeferredPoints", function(canvasDraw) {
		var nextState = new DrawingState();
		for (var i = 0; i < _this5.deferredPoints.length; i++) {
			var deferredPt = _this5.deferredPoints[i];
			var syntheticEvt = new SyntheticEvent(deferredPt);
			nextState = (i === 0 ? nextState.handleDrawStart : nextState.handleDrawMove)(syntheticEvt, canvasDraw);
		}
		return nextState;
	});
	this.startClientPoint = null;
	this.startTimestamp = (/* @__PURE__ */ new Date()).valueOf();
	this.deferredPoints = [];
};
/**
* This state is active when the user has added at least two touch points but we
* don't yet know if they intend to pan or zoom.
*/
var ScaleOrPanState = function ScaleOrPanState() {
	var _this6 = this;
	_defineProperty$1(this, "handleMouseWheel", SUPPRESS_SCROLL.bind(this));
	_defineProperty$1(this, "handleDrawStart", function(e, canvasDraw) {
		e.preventDefault();
		if (!e.touches || e.touches.length < 2) return new DefaultState();
		_this6.start = _this6.getTouchMetrics(e);
		_this6.panStart = {
			x: canvasDraw.coordSystem.x,
			y: canvasDraw.coordSystem.y
		};
		_this6.scaleStart = canvasDraw.coordSystem.scale;
		return _this6;
	});
	_defineProperty$1(this, "handleDrawMove", function(e, canvasDraw) {
		e.preventDefault();
		if (!e.touches || e.touches.length < 2) return new DefaultState();
		var _this6$recentMetrics = _this6.recentMetrics = _this6.getTouchMetrics(e), centroid = _this6$recentMetrics.centroid, distance = _this6$recentMetrics.distance;
		if (Math.abs(distance - _this6.start.distance) >= TOUCH_SLOP) return new TouchScaleState(_this6).handleDrawMove(e, canvasDraw);
		var dx = centroid.clientX - _this6.start.centroid.clientX;
		var dy = centroid.clientY - _this6.start.centroid.clientY;
		if (Math.abs(dx) + Math.abs(dy) >= TOUCH_SLOP) return new TouchPanState(_this6).handleDrawMove(e, canvasDraw);
		return _this6;
	});
	_defineProperty$1(this, "handleDrawEnd", function() {
		return new DefaultState();
	});
	_defineProperty$1(this, "getTouchMetrics", function(e) {
		var _clientPointFromEvent2 = clientPointFromEvent(e.touches[0]), t1x = _clientPointFromEvent2.clientX, t1y = _clientPointFromEvent2.clientY;
		var _clientPointFromEvent3 = clientPointFromEvent(e.touches[1]), t2x = _clientPointFromEvent3.clientX, t2y = _clientPointFromEvent3.clientY;
		var dx = t2x - t1x;
		var dy = t2y - t1y;
		return {
			t1: {
				clientX: t1x,
				clientY: t1y
			},
			t2: {
				clientX: t2x,
				clientY: t2y
			},
			distance: Math.sqrt(dx * dx + dy * dy),
			centroid: {
				clientX: (t1x + t2x) / 2,
				clientY: (t1y + t2y) / 2
			}
		};
	});
};
/**
* The user is actively using touch gestures to pan the image.
*/
var TouchPanState = function TouchPanState(scaleOrPanState) {
	var _this7 = this;
	_defineProperty$1(this, "handleMouseWheel", SUPPRESS_SCROLL.bind(this));
	_defineProperty$1(this, "handleDrawStart", function() {
		return _this7;
	});
	_defineProperty$1(this, "handleDrawMove", function(e, canvasDraw) {
		e.preventDefault();
		if (!e.touches || e.touches.length < 2) return new DefaultState();
		var ref = _this7.scaleOrPanState, _ref$recentMetrics = ref.recentMetrics = ref.getTouchMetrics(e), centroid = _ref$recentMetrics.centroid;
		_ref$recentMetrics.distance;
		var dx = centroid.clientX - ref.start.centroid.clientX;
		var dy = centroid.clientY - ref.start.centroid.clientY;
		canvasDraw.setView({
			x: ref.panStart.x + dx,
			y: ref.panStart.y + dy
		});
		return _this7;
	});
	_defineProperty$1(this, "handleDrawEnd", function() {
		return new DefaultState();
	});
	this.scaleOrPanState = scaleOrPanState;
};
/**
* The user is actively using touch gestures to scale the drawing.
*/
var TouchScaleState = function TouchScaleState(scaleOrPanState) {
	var _this8 = this;
	_defineProperty$1(this, "handleMouseWheel", SUPPRESS_SCROLL.bind(this));
	_defineProperty$1(this, "handleDrawStart", function() {
		return _this8;
	});
	_defineProperty$1(this, "handleDrawMove", function(e, canvasDraw) {
		e.preventDefault();
		if (!e.touches || e.touches.length < 2) return new DefaultState();
		var ref = _this8.scaleOrPanState;
		var _ref$recentMetrics2 = ref.recentMetrics = ref.getTouchMetrics(e), centroid = _ref$recentMetrics2.centroid, distance = _ref$recentMetrics2.distance;
		var dScale = ref.scaleStart * (distance / ref.start.distance) - canvasDraw.coordSystem.scale;
		canvasDraw.coordSystem.scaleAtClientPoint(dScale, centroid);
		return _this8;
	});
	_defineProperty$1(this, "handleDrawEnd", function() {
		return new DefaultState();
	});
	this.scaleOrPanState = scaleOrPanState;
};
/**
* This state is active when the user is drawing.
*/
var DrawingState = function DrawingState() {
	var _this9 = this;
	_defineProperty$1(this, "handleMouseWheel", SUPPRESS_SCROLL.bind(this));
	_defineProperty$1(this, "handleDrawStart", function(e, canvasDraw) {
		e.preventDefault();
		if (e.touches && e.touches.length) {
			var _viewPointFromEvent2 = viewPointFromEvent(canvasDraw.coordSystem, e), x = _viewPointFromEvent2.x, y = _viewPointFromEvent2.y;
			canvasDraw.lazy.update({
				x,
				y
			}, { both: true });
		}
		return _this9.handleDrawMove(e, canvasDraw);
	});
	_defineProperty$1(this, "handleDrawMove", function(e, canvasDraw) {
		e.preventDefault();
		var _viewPointFromEvent3 = viewPointFromEvent(canvasDraw.coordSystem, e), x = _viewPointFromEvent3.x, y = _viewPointFromEvent3.y;
		canvasDraw.lazy.update({
			x,
			y
		});
		var isDisabled = !canvasDraw.lazy.isEnabled();
		if (!_this9.isDrawing || isDisabled) {
			canvasDraw.points.push(canvasDraw.clampPointToDocument(canvasDraw.lazy.brush.toObject()));
			_this9.isDrawing = true;
		}
		canvasDraw.points.push(canvasDraw.clampPointToDocument(canvasDraw.lazy.brush.toObject()));
		canvasDraw.drawPoints({
			points: canvasDraw.points,
			brushColor: canvasDraw.props.brushColor,
			brushRadius: canvasDraw.props.brushRadius
		});
		return _this9;
	});
	_defineProperty$1(this, "handleDrawEnd", function(e, canvasDraw) {
		e.preventDefault();
		_this9.handleDrawMove(e, canvasDraw);
		canvasDraw.saveLine();
		return new DefaultState();
	});
	this.isDrawing = false;
};
var SyntheticEvent = function SyntheticEvent(_ref) {
	var clientX = _ref.clientX, clientY = _ref.clientY;
	_defineProperty$1(this, "preventDefault", function() {});
	this.clientX = clientX;
	this.clientY = clientY;
	this.touches = [{
		clientX,
		clientY
	}];
};
function clientPointFromEvent(e) {
	var clientX = e.clientX;
	var clientY = e.clientY;
	if (e.changedTouches && e.changedTouches.length > 0) {
		clientX = e.changedTouches[0].clientX;
		clientY = e.changedTouches[0].clientY;
	}
	return {
		clientX,
		clientY
	};
}
function viewPointFromEvent(coordSystem, e) {
	return coordSystem.clientPointToViewPoint(clientPointFromEvent(e));
}
//#endregion
//#region node_modules/react-canvas-draw/es/makePassiveEventOption.js
var passiveSupported = false;
try {
	var options = { get passive() {
		passiveSupported = true;
		return false;
	} };
	window.addEventListener("test", options, options);
	window.removeEventListener("test", options, options);
} catch (e) {
	passiveSupported = false;
}
function makePassiveEventOption(passive) {
	return passiveSupported ? { passive } : passive;
}
//#endregion
//#region node_modules/react-canvas-draw/es/index.js
function _createForOfIteratorHelperLoose(o, allowArrayLike) {
	var it;
	if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
		if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
			if (it) o = it;
			var i = 0;
			return function() {
				if (i >= o.length) return { done: true };
				return {
					done: false,
					value: o[i++]
				};
			};
		}
		throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	it = o[Symbol.iterator]();
	return it.next.bind(it);
}
function _unsupportedIterableToArray(o, minLen) {
	if (!o) return;
	if (typeof o === "string") return _arrayLikeToArray(o, minLen);
	var n = Object.prototype.toString.call(o).slice(8, -1);
	if (n === "Object" && o.constructor) n = o.constructor.name;
	if (n === "Map" || n === "Set") return Array.from(o);
	if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
	if (len == null || len > arr.length) len = arr.length;
	for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
	return arr2;
}
function _extends() {
	_extends = Object.assign || function(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
		}
		return target;
	};
	return _extends.apply(this, arguments);
}
function _assertThisInitialized(self) {
	if (self === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	return self;
}
function _inheritsLoose(subClass, superClass) {
	subClass.prototype = Object.create(superClass.prototype);
	subClass.prototype.constructor = subClass;
	subClass.__proto__ = superClass;
}
function _defineProperty(obj, key, value) {
	if (key in obj) Object.defineProperty(obj, key, {
		value,
		enumerable: true,
		configurable: true,
		writable: true
	});
	else obj[key] = value;
	return obj;
}
function midPointBtw(p1, p2) {
	return {
		x: p1.x + (p2.x - p1.x) / 2,
		y: p1.y + (p2.y - p1.y) / 2
	};
}
var canvasStyle = {
	display: "block",
	position: "absolute"
};
var canvasTypes = [
	"grid",
	"drawing",
	"temp",
	"interface"
];
var dimensionsPropTypes = import_prop_types.default.oneOfType([import_prop_types.default.number, import_prop_types.default.string]);
var boundsProp = import_prop_types.default.shape({
	min: import_prop_types.default.number.isRequired,
	max: import_prop_types.default.number.isRequired
});
var CanvasDraw = /*#__PURE__*/ function(_PureComponent) {
	_inheritsLoose(CanvasDraw, _PureComponent);
	function CanvasDraw(props) {
		var _this = _PureComponent.call(this, props) || this;
		_defineProperty(_assertThisInitialized(_this), "undo", function() {
			var lines = [];
			if (_this.lines.length) lines = _this.lines.slice(0, -1);
			else if (_this.erasedLines.length) lines = _this.erasedLines.pop();
			_this.clearExceptErasedLines();
			_this.simulateDrawingLines({
				lines,
				immediate: true
			});
			_this.triggerOnChange();
		});
		_defineProperty(_assertThisInitialized(_this), "eraseAll", function() {
			_this.erasedLines.push([].concat(_this.lines));
			_this.clearExceptErasedLines();
			_this.triggerOnChange();
		});
		_defineProperty(_assertThisInitialized(_this), "clear", function() {
			_this.erasedLines = [];
			_this.clearExceptErasedLines();
			_this.resetView();
		});
		_defineProperty(_assertThisInitialized(_this), "resetView", function() {
			return _this.coordSystem.resetView();
		});
		_defineProperty(_assertThisInitialized(_this), "setView", function(view) {
			return _this.coordSystem.setView(view);
		});
		_defineProperty(_assertThisInitialized(_this), "getSaveData", function() {
			return JSON.stringify({
				lines: _this.lines,
				width: _this.props.canvasWidth,
				height: _this.props.canvasHeight
			});
		});
		_defineProperty(_assertThisInitialized(_this), "getDataURL", function(fileType, useBgImage, backgroundColour) {
			var canvasToExport = _this.canvas.drawing;
			var context = canvasToExport.getContext("2d");
			var width = canvasToExport.width;
			var height = canvasToExport.height;
			var storedImageData = context.getImageData(0, 0, width, height);
			var compositeOperation = context.globalCompositeOperation;
			context.globalCompositeOperation = "destination-over";
			if (useBgImage) {
				if (!_this.props.imgSrc) return "Background image source not set";
				_this.drawImage();
			} else if (backgroundColour != null) {
				context.fillStyle = backgroundColour;
				context.fillRect(0, 0, width, height);
			}
			if (!fileType) fileType = "png";
			var imageData = canvasToExport.toDataURL("image/" + fileType);
			context.clearRect(0, 0, width, height);
			context.putImageData(storedImageData, 0, 0);
			context.globalCompositeOperation = compositeOperation;
			return imageData;
		});
		_defineProperty(_assertThisInitialized(_this), "loadSaveData", function(saveData, immediate) {
			if (immediate === void 0) immediate = _this.props.immediateLoading;
			if (typeof saveData !== "string") throw new Error("saveData needs to be of type string!");
			var _JSON$parse = JSON.parse(saveData), lines = _JSON$parse.lines, width = _JSON$parse.width, height = _JSON$parse.height;
			if (!lines || typeof lines.push !== "function") throw new Error("saveData.lines needs to be an array!");
			_this.clear();
			if (width === _this.props.canvasWidth && height === _this.props.canvasHeight) _this.simulateDrawingLines({
				lines,
				immediate
			});
			else {
				var scaleX = _this.props.canvasWidth / width;
				var scaleY = _this.props.canvasHeight / height;
				var scaleAvg = (scaleX + scaleY) / 2;
				_this.simulateDrawingLines({
					lines: lines.map(function(line) {
						return _extends({}, line, {
							points: line.points.map(function(p) {
								return {
									x: p.x * scaleX,
									y: p.y * scaleY
								};
							}),
							brushRadius: line.brushRadius * scaleAvg
						});
					}),
					immediate
				});
			}
		});
		_defineProperty(_assertThisInitialized(_this), "componentWillUnmount", function() {
			_this.canvasObserver.unobserve(_this.canvasContainer);
			_this.canvas["interface"] && _this.canvas["interface"].removeEventListener("wheel", _this.handleWheel);
		});
		_defineProperty(_assertThisInitialized(_this), "handleWheel", function(e) {
			_this.interactionSM = _this.interactionSM.handleMouseWheel(e, _assertThisInitialized(_this));
		});
		_defineProperty(_assertThisInitialized(_this), "handleDrawStart", function(e) {
			_this.interactionSM = _this.interactionSM.handleDrawStart(e, _assertThisInitialized(_this));
			_this.mouseHasMoved = true;
		});
		_defineProperty(_assertThisInitialized(_this), "handleDrawMove", function(e) {
			_this.interactionSM = _this.interactionSM.handleDrawMove(e, _assertThisInitialized(_this));
			_this.mouseHasMoved = true;
		});
		_defineProperty(_assertThisInitialized(_this), "handleDrawEnd", function(e) {
			_this.interactionSM = _this.interactionSM.handleDrawEnd(e, _assertThisInitialized(_this));
			_this.mouseHasMoved = true;
		});
		_defineProperty(_assertThisInitialized(_this), "applyView", function() {
			if (!_this.ctx.drawing) return;
			canvasTypes.map(function(name) {
				return _this.ctx[name];
			}).forEach(function(ctx) {
				_this.clearWindow(ctx);
				var m = _this.coordSystem.transformMatrix;
				ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
			});
			if (!_this.deferRedrawOnViewChange) {
				_this.drawGrid(_this.ctx.grid);
				_this.redrawImage();
				_this.loop({ once: true });
				var lines = _this.lines;
				_this.lines = [];
				_this.simulateDrawingLines({
					lines,
					immediate: true
				});
			}
		});
		_defineProperty(_assertThisInitialized(_this), "handleCanvasResize", function(entries) {
			var saveData = _this.getSaveData();
			_this.deferRedrawOnViewChange = true;
			try {
				for (var _iterator = _createForOfIteratorHelperLoose(entries), _step; !(_step = _iterator()).done;) {
					var _entry$contentRect = _step.value.contentRect, width = _entry$contentRect.width, height = _entry$contentRect.height;
					_this.setCanvasSize(_this.canvas["interface"], width, height);
					_this.setCanvasSize(_this.canvas.drawing, width, height);
					_this.setCanvasSize(_this.canvas.temp, width, height);
					_this.setCanvasSize(_this.canvas.grid, width, height);
					_this.coordSystem.documentSize = {
						width,
						height
					};
					_this.drawGrid(_this.ctx.grid);
					_this.drawImage();
					_this.loop({ once: true });
				}
				_this.loadSaveData(saveData, true);
			} finally {
				_this.deferRedrawOnViewChange = false;
			}
		});
		_defineProperty(_assertThisInitialized(_this), "clampPointToDocument", function(point) {
			if (_this.props.clampLinesToDocument) return {
				x: Math.max(Math.min(point.x, _this.props.canvasWidth), 0),
				y: Math.max(Math.min(point.y, _this.props.canvasHeight), 0)
			};
			else return point;
		});
		_defineProperty(_assertThisInitialized(_this), "redrawImage", function() {
			_this.image && _this.image.complete && drawImageProp({
				ctx: _this.ctx.grid,
				img: _this.image
			});
		});
		_defineProperty(_assertThisInitialized(_this), "simulateDrawingLines", function(_ref) {
			var lines = _ref.lines, immediate = _ref.immediate;
			var curTime = 0;
			var timeoutGap = immediate ? 0 : _this.props.loadTimeOffset;
			lines.forEach(function(line) {
				var points = line.points, brushColor = line.brushColor, brushRadius = line.brushRadius;
				if (immediate) {
					_this.drawPoints({
						points,
						brushColor,
						brushRadius
					});
					_this.points = points;
					_this.saveLine({
						brushColor,
						brushRadius
					});
					return;
				}
				var _loop = function _loop(i) {
					curTime += timeoutGap;
					window.setTimeout(function() {
						_this.drawPoints({
							points: points.slice(0, i + 1),
							brushColor,
							brushRadius
						});
					}, curTime);
				};
				for (var i = 1; i < points.length; i++) _loop(i);
				curTime += timeoutGap;
				window.setTimeout(function() {
					_this.points = points;
					_this.saveLine({
						brushColor,
						brushRadius
					});
				}, curTime);
			});
		});
		_defineProperty(_assertThisInitialized(_this), "setCanvasSize", function(canvas, width, height) {
			canvas.width = width;
			canvas.height = height;
			canvas.style.width = width;
			canvas.style.height = height;
		});
		_defineProperty(_assertThisInitialized(_this), "drawPoints", function(_ref2) {
			var points = _ref2.points, brushColor = _ref2.brushColor, brushRadius = _ref2.brushRadius;
			_this.ctx.temp.lineJoin = "round";
			_this.ctx.temp.lineCap = "round";
			_this.ctx.temp.strokeStyle = brushColor;
			_this.clearWindow(_this.ctx.temp);
			_this.ctx.temp.lineWidth = brushRadius * 2;
			var p1 = points[0];
			var p2 = points[1];
			_this.ctx.temp.moveTo(p2.x, p2.y);
			_this.ctx.temp.beginPath();
			for (var i = 1, len = points.length; i < len; i++) {
				var midPoint = midPointBtw(p1, p2);
				_this.ctx.temp.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
				p1 = points[i];
				p2 = points[i + 1];
			}
			_this.ctx.temp.lineTo(p1.x, p1.y);
			_this.ctx.temp.stroke();
		});
		_defineProperty(_assertThisInitialized(_this), "saveLine", function(_temp) {
			var _ref3 = _temp === void 0 ? {} : _temp, brushColor = _ref3.brushColor, brushRadius = _ref3.brushRadius;
			if (_this.points.length < 2) return;
			_this.lines.push({
				points: [].concat(_this.points),
				brushColor: brushColor || _this.props.brushColor,
				brushRadius: brushRadius || _this.props.brushRadius
			});
			_this.points.length = 0;
			_this.inClientSpace([_this.ctx.drawing, _this.ctx.temp], function() {
				_this.ctx.drawing.drawImage(_this.canvas.temp, 0, 0, _this.canvas.drawing.width, _this.canvas.drawing.height);
			});
			_this.clearWindow(_this.ctx.temp);
			_this.triggerOnChange();
		});
		_defineProperty(_assertThisInitialized(_this), "triggerOnChange", function() {
			_this.props.onChange && _this.props.onChange(_assertThisInitialized(_this));
		});
		_defineProperty(_assertThisInitialized(_this), "clearWindow", function(ctx) {
			_this.inClientSpace([ctx], function() {
				return ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			});
		});
		_defineProperty(_assertThisInitialized(_this), "clearExceptErasedLines", function() {
			_this.lines = [];
			_this.valuesChanged = true;
			_this.clearWindow(_this.ctx.drawing);
			_this.clearWindow(_this.ctx.temp);
		});
		_defineProperty(_assertThisInitialized(_this), "loop", function(_temp2) {
			var _ref4$once = (_temp2 === void 0 ? {} : _temp2).once, once = _ref4$once === void 0 ? false : _ref4$once;
			if (_this.mouseHasMoved || _this.valuesChanged) {
				var pointer = _this.lazy.getPointerCoordinates();
				var brush = _this.lazy.getBrushCoordinates();
				_this.drawInterface(_this.ctx["interface"], pointer, brush);
				_this.mouseHasMoved = false;
				_this.valuesChanged = false;
			}
			if (!once) window.requestAnimationFrame(function() {
				_this.loop();
			});
		});
		_defineProperty(_assertThisInitialized(_this), "inClientSpace", function(ctxs, action) {
			ctxs.forEach(function(ctx) {
				ctx.save();
				ctx.setTransform(IDENTITY.a, IDENTITY.b, IDENTITY.c, IDENTITY.d, IDENTITY.e, IDENTITY.f);
			});
			try {
				action();
			} finally {
				ctxs.forEach(function(ctx) {
					return ctx.restore();
				});
			}
		});
		_defineProperty(_assertThisInitialized(_this), "drawImage", function() {
			if (!_this.props.imgSrc) return;
			_this.image = new Image();
			_this.image.crossOrigin = "anonymous";
			_this.image.onload = _this.redrawImage;
			_this.image.src = _this.props.imgSrc;
		});
		_defineProperty(_assertThisInitialized(_this), "drawGrid", function(ctx) {
			if (_this.props.hideGrid) return;
			_this.clearWindow(ctx);
			var gridSize = 25;
			var _this$coordSystem$can = _this.coordSystem.canvasBounds, viewMin = _this$coordSystem$can.viewMin, viewMax = _this$coordSystem$can.viewMax;
			var minx = Math.floor(viewMin.x / gridSize - 1) * gridSize;
			var miny = Math.floor(viewMin.y / gridSize - 1) * gridSize;
			var maxx = viewMax.x + gridSize;
			var maxy = viewMax.y + gridSize;
			ctx.beginPath();
			ctx.setLineDash([5, 1]);
			ctx.setLineDash([]);
			ctx.strokeStyle = _this.props.gridColor;
			ctx.lineWidth = _this.props.gridLineWidth;
			if (!_this.props.hideGridX) {
				var countX = minx;
				var gridSizeX = _this.props.gridSizeX;
				while (countX < maxx) {
					countX += gridSizeX;
					ctx.moveTo(countX, miny);
					ctx.lineTo(countX, maxy);
				}
				ctx.stroke();
			}
			if (!_this.props.hideGridY) {
				var countY = miny;
				var gridSizeY = _this.props.gridSizeY;
				while (countY < maxy) {
					countY += gridSizeY;
					ctx.moveTo(minx, countY);
					ctx.lineTo(maxx, countY);
				}
				ctx.stroke();
			}
		});
		_defineProperty(_assertThisInitialized(_this), "drawInterface", function(ctx, pointer, brush) {
			if (_this.props.hideInterface) return;
			_this.clearWindow(ctx);
			ctx.beginPath();
			ctx.fillStyle = _this.props.brushColor;
			ctx.arc(brush.x, brush.y, _this.props.brushRadius, 0, Math.PI * 2, true);
			ctx.fill();
			ctx.beginPath();
			ctx.fillStyle = _this.props.catenaryColor;
			ctx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2, true);
			ctx.fill();
			if (_this.lazy.isEnabled()) {
				ctx.beginPath();
				ctx.lineWidth = 2;
				ctx.lineCap = "round";
				ctx.setLineDash([2, 4]);
				ctx.strokeStyle = _this.props.catenaryColor;
				_this.catenary.drawToCanvas(_this.ctx["interface"], brush, pointer, _this.chainLength);
				ctx.stroke();
			}
			ctx.beginPath();
			ctx.fillStyle = _this.props.catenaryColor;
			ctx.arc(brush.x, brush.y, 2, 0, Math.PI * 2, true);
			ctx.fill();
		});
		_this.canvas = {};
		_this.ctx = {};
		_this.catenary = new import_lib$1.Catenary();
		_this.points = [];
		_this.lines = [];
		_this.erasedLines = [];
		_this.mouseHasMoved = true;
		_this.valuesChanged = true;
		_this.isDrawing = false;
		_this.isPressing = false;
		_this.deferRedrawOnViewChange = false;
		_this.interactionSM = new DefaultState();
		_this.coordSystem = new CoordinateSystem({
			scaleExtents: props.zoomExtents,
			documentSize: {
				width: props.canvasWidth,
				height: props.canvasHeight
			}
		});
		_this.coordSystem.attachViewChangeListener(_this.applyView.bind(_assertThisInitialized(_this)));
		return _this;
	}
	var _proto = CanvasDraw.prototype;
	_proto.componentDidMount = function componentDidMount() {
		var _this2 = this;
		this.lazy = new import_lib.LazyBrush({
			radius: this.props.lazyRadius * window.devicePixelRatio,
			enabled: true,
			initialPoint: {
				x: window.innerWidth / 2,
				y: window.innerHeight / 2
			}
		});
		this.chainLength = this.props.lazyRadius * window.devicePixelRatio;
		this.canvasObserver = new index(function(entries, observer) {
			return _this2.handleCanvasResize(entries, observer);
		});
		this.canvasObserver.observe(this.canvasContainer);
		this.drawImage();
		this.loop();
		window.setTimeout(function() {
			var initX = window.innerWidth / 2;
			var initY = window.innerHeight / 2;
			_this2.lazy.update({
				x: initX - _this2.chainLength / 4,
				y: initY
			}, { both: true });
			_this2.lazy.update({
				x: initX + _this2.chainLength / 4,
				y: initY
			}, { both: false });
			_this2.mouseHasMoved = true;
			_this2.valuesChanged = true;
			_this2.clearExceptErasedLines();
			if (_this2.props.saveData) _this2.loadSaveData(_this2.props.saveData);
		}, 100);
		this.canvas["interface"] && this.canvas["interface"].addEventListener("wheel", this.handleWheel, makePassiveEventOption());
	};
	_proto.componentDidUpdate = function componentDidUpdate(prevProps) {
		if (prevProps.lazyRadius !== this.props.lazyRadius) {
			this.chainLength = this.props.lazyRadius * window.devicePixelRatio;
			this.lazy.setRadius(this.props.lazyRadius * window.devicePixelRatio);
		}
		if (prevProps.saveData !== this.props.saveData) this.loadSaveData(this.props.saveData);
		if (JSON.stringify(prevProps) !== JSON.stringify(this.props)) this.valuesChanged = true;
		this.coordSystem.scaleExtents = this.props.zoomExtents;
		if (!this.props.enablePanAndZoom) this.coordSystem.resetView();
		if (prevProps.imgSrc !== this.props.imgSrc) this.drawImage();
	};
	_proto.render = function render() {
		var _this3 = this;
		return /*#__PURE__*/ import_react.createElement("div", {
			className: this.props.className,
			style: _extends({
				display: "block",
				background: this.props.backgroundColor,
				touchAction: "none",
				width: this.props.canvasWidth,
				height: this.props.canvasHeight
			}, this.props.style),
			ref: function ref(container) {
				if (container) _this3.canvasContainer = container;
			}
		}, canvasTypes.map(function(name) {
			var isInterface = name === "interface";
			return /*#__PURE__*/ import_react.createElement("canvas", {
				key: name,
				ref: function ref(canvas) {
					if (canvas) {
						_this3.canvas[name] = canvas;
						_this3.ctx[name] = canvas.getContext("2d");
						if (isInterface) _this3.coordSystem.canvas = canvas;
					}
				},
				style: _extends({}, canvasStyle),
				onMouseDown: isInterface ? _this3.handleDrawStart : void 0,
				onMouseMove: isInterface ? _this3.handleDrawMove : void 0,
				onMouseUp: isInterface ? _this3.handleDrawEnd : void 0,
				onMouseOut: isInterface ? _this3.handleDrawEnd : void 0,
				onTouchStart: isInterface ? _this3.handleDrawStart : void 0,
				onTouchMove: isInterface ? _this3.handleDrawMove : void 0,
				onTouchEnd: isInterface ? _this3.handleDrawEnd : void 0,
				onTouchCancel: isInterface ? _this3.handleDrawEnd : void 0
			});
		}));
	};
	return CanvasDraw;
}(import_react.PureComponent);
_defineProperty(CanvasDraw, "defaultProps", {
	onChange: null,
	loadTimeOffset: 5,
	lazyRadius: 12,
	brushRadius: 10,
	brushColor: "#444",
	catenaryColor: "#0a0302",
	gridColor: "rgba(150,150,150,0.17)",
	backgroundColor: "#FFF",
	hideGrid: false,
	canvasWidth: 400,
	canvasHeight: 400,
	disabled: false,
	imgSrc: "",
	saveData: "",
	immediateLoading: false,
	hideInterface: false,
	gridSizeX: 25,
	gridSizeY: 25,
	gridLineWidth: .5,
	hideGridX: false,
	hideGridY: false,
	enablePanAndZoom: false,
	mouseZoomFactor: .01,
	zoomExtents: {
		min: .33,
		max: 3
	},
	clampLinesToDocument: false
});
CanvasDraw.propTypes = {
	onChange: import_prop_types.default.func,
	loadTimeOffset: import_prop_types.default.number,
	lazyRadius: import_prop_types.default.number,
	brushRadius: import_prop_types.default.number,
	brushColor: import_prop_types.default.string,
	catenaryColor: import_prop_types.default.string,
	gridColor: import_prop_types.default.string,
	backgroundColor: import_prop_types.default.string,
	hideGrid: import_prop_types.default.bool,
	canvasWidth: dimensionsPropTypes,
	canvasHeight: dimensionsPropTypes,
	disabled: import_prop_types.default.bool,
	imgSrc: import_prop_types.default.string,
	saveData: import_prop_types.default.string,
	immediateLoading: import_prop_types.default.bool,
	hideInterface: import_prop_types.default.bool,
	gridSizeX: import_prop_types.default.number,
	gridSizeY: import_prop_types.default.number,
	gridLineWidth: import_prop_types.default.number,
	hideGridX: import_prop_types.default.bool,
	hideGridY: import_prop_types.default.bool,
	enablePanAndZoom: import_prop_types.default.bool,
	mouseZoomFactor: import_prop_types.default.number,
	zoomExtents: boundsProp,
	clampLinesToDocument: import_prop_types.default.bool
};
var signature_module_default = {
	orderSignature: "orderSignature___mhVF-",
	signatureContainer: "signatureContainer___Csxs-",
	header: "header___XWCPD",
	menuName: "menuName___5GlCO",
	signatureDraw: "signatureDraw___-n28-",
	footBtnBox: "footBtnBox___Pmc5u",
	backBtn: "backBtn___si-yA",
	editBtn: "editBtn___Uwo6j",
	actived: "actived___sqXbo",
	noActived: "noActived___Jthee"
};
var signatureModal_module_default = {
	loadBox: "loadBox___-c23G",
	orderBox: "orderBox___wzkJh",
	msg: "msg___ZDjHa",
	orderBottom: "orderBottom___0kLno",
	itemBox: "itemBox___gcpz7",
	itemName: "itemName___ViB59",
	subItemName: "subItemName___Y-Hmq"
};
//#endregion
//#region source-snapshot/src/component/signatureModal/index.js
var import_jsx_runtime = require_jsx_runtime();
var DELAY = 600;
var SignatureModal = (props) => {
	const { t } = useTranslation();
	const { loadObj: { msgDone, handlePrint, handleSkip }, signaLoading } = props;
	const [show, setShow] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let timer;
		if (signaLoading) timer = setTimeout(() => {
			setShow(true);
		}, DELAY);
		else {
			clearTimeout(timer);
			setShow(false);
		}
		return () => clearTimeout(timer);
	}, [signaLoading]);
	if (!show) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		visible: show,
		html: msgDone == "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: signatureModal_module_default.loadBox,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: signatureModal_module_default.orderBox,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: signatureModal_module_default.msg,
					children: t("signature-receipt")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: signatureModal_module_default.orderBottom,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: handleSkip,
						children: t("skip")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: handlePrint,
						className: "linear-animate-btn",
						children: t("signature-print")
					})]
				})]
			})
		}) : msgDone == "fail" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: signatureModal_module_default.loadBox,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: signatureModal_module_default.orderBox,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: signatureModal_module_default.msg,
					children: t("signature-receipt-fail")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: signatureModal_module_default.orderBottom,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: handleSkip,
						children: t("skip")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: handlePrint,
						className: "linear-animate-btn",
						children: t("signature-print-again")
					})]
				})]
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: signatureModal_module_default.loadBox,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(menusifuLoading, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: signatureModal_module_default.itemBox,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: signatureModal_module_default.itemName,
					children: t("print-msg-loading-title")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: signatureModal_module_default.subItemName,
					children: t("wait")
				})]
			})]
		})
	});
};
//#endregion
//#region source-snapshot/src/container/signature/index.js
var Signature = class extends import_react.Component {
	constructor(props) {
		super(props);
		const isIosStandalonePage = props.isStandalonePage && window.isIosShell && window.isIosShell();
		this.state = {
			signatureWidth: isIosStandalonePage ? 1600 : 800,
			signatureHeight: isIosStandalonePage ? 800 : 400,
			loading: false,
			disabled: true,
			errorApiMsg: "",
			errorApiShow: false,
			signaLoading: false,
			signaLoadObj: {},
			callLoading: false,
			callLoadObj: {},
			saveOrderId: ""
		};
		this.signatureDraw = import_react.createRef();
		this.saveableCanvas = import_react.createRef();
		this.timer = null;
		this.lastConfirmTriggerAt = 0;
	}
	showApiModalTip = (errMsg) => {
		this.setState({
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
	clearDraw = () => {
		if (!this.state.disabled) {
			this.saveableCanvas.clear();
			this.setState({
				disabled: true,
				loading: false
			});
		}
	};
	handleSetSignature = (status) => {
		this.setState({
			signaLoading: true,
			signaLoadObj: {
				msgDone: status,
				handlePrint: this.handlePrintSignature,
				handleSkip: this.handleSkipSignature
			}
		});
	};
	handlePrintSignature = () => {
		this.setState({
			signaLoading: true,
			signaLoadObj: { msgDone: "ing" }
		});
		judgeSskeyIsActiveTime().then(() => this.handlePrintOrder());
	};
	handleSkipSignature = () => {
		this.setState({
			signaLoading: false,
			signaLoadObj: {}
		});
		goToPaymentMemberOrFinish({
			history: this.props.history,
			allSysConfig: this.props.allSysConfig,
			crm: this.props.crm,
			currentOrder: this.props.currentOrder
		});
	};
	handlePrintOrder = () => {
		if (this.props.currentOrder?.postPaymentActions?.paymentReceiptPrinted) {
			this.handleSkipSignature();
			return;
		}
		printOrder({
			paymentReceiptType: "CUSTOMER_COPY",
			paymentId: this.props.currentOrder.savePaymentId,
			userAuth: { sessionKey: getCookie("sessionKey") }
		}).then((printRes) => {
			if (printRes.data.result?.successful) {
				this.props.markPostPaymentAction("paymentReceiptPrinted");
				this.handleSkipSignature();
			} else {
				this.handleSetSignature("fail");
				if (this.props.currentOrder.saveOrderResult?.id) sendError2MsgCenter(this.props.currentOrder.saveOrderResult.id, "Printing failed");
			}
		}).catch(() => {
			this.handleSetSignature("fail");
			if (this.props.currentOrder.saveOrderResult?.id) sendError2MsgCenter(this.props.currentOrder.saveOrderResult.id, "Printing failed");
		});
	};
	judgePrintOrderByConfig = () => {
		const { selfConfig } = this.props;
		const value = selfConfig?.configMap?.id_7;
		if (value === 0) judgeSskeyIsActiveTime().then(() => this.handlePrintOrder());
		else if (value === 1) this.handleSetSignature("open");
		else if (value === 2) this.handleSkipSignature();
		else this.handleSkipSignature();
	};
	saverDraw = async () => {
		if (!this.state.disabled) {
			this.setState({
				disabled: true,
				loading: true
			});
			if (this.props.handlePayTip) {
				if (!await this.props.handlePayTip?.(true)) {
					this.setState({
						disabled: false,
						loading: false
					});
					return;
				}
			}
			if (this.props.currentOrder?.postPaymentActions?.signatureSubmitted) {
				this.setState({
					disabled: false,
					loading: false
				});
				this.judgePrintOrderByConfig();
				return;
			}
			try {
				let pic = this.saveableCanvas.canvas.drawing.toDataURL("image/png", 1);
				const res = await sendSignature({
					paymentId: this.props.currentOrder.savePaymentId,
					signature: pic
				});
				if (res.data.resultType.successful) {
					this.props.markPostPaymentAction("signatureSubmitted");
					this.judgePrintOrderByConfig();
				} else this.showApiModalTip(res.data?.resultType?.failureReason);
			} catch (err) {
				this.showApiModalTip(err?.message);
			} finally {
				this.setState({
					disabled: false,
					loading: false
				});
			}
		}
	};
	handleConfirmTrigger = async () => {
		const now = Date.now();
		if (now - this.lastConfirmTriggerAt < 1e3) return;
		this.lastConfirmTriggerAt = now;
		await this.saverDraw();
	};
	componentWillUnmount() {
		clearTimeout(this.timer);
	}
	render() {
		const { t, showTitle = true, agreement = "top", customContentStyle = {}, customContainerStyle = {}, signHeight = 0 } = this.props;
		const { errorApiShow, errorApiMsg, loading, signaLoading, signaLoadObj, callLoading, callLoadObj } = this.state;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: customContainerStyle || {},
			className: signature_module_default.orderSignature,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: signature_module_default.signatureContainer,
					children: [
						showTitle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: signature_module_default.header,
							children: [t("sign-title"), " "]
						}),
						agreement === "top" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: signature_module_default.menuName,
							children: t("sigAgreement")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: customContentStyle || {},
							className: signature_module_default.signatureDrawBx,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: signature_module_default.signatureDraw,
								ref: this.signatureDraw,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CanvasDraw, {
									ref: (canvasDraw) => this.saveableCanvas = canvasDraw,
									canvasWidth: this.state.signatureWidth,
									canvasHeight: signHeight || this.state.signatureHeight,
									brushRadius: 4,
									lazyRadius: 0,
									hideGrid: false,
									hideInterface: true,
									onChange: () => {
										this.setState({ disabled: false });
									}
								})
							})
						}),
						agreement === "bottom" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: { margin: "2rem 0 0" },
							className: signature_module_default.menuName,
							children: t("sigAgreement")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: signature_module_default.footBtnBox,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `${signature_module_default.backBtn} ${this.state.disabled ? signature_module_default.noActived : ""}`,
								onClick: this.clearDraw,
								children: t("clear")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: [signature_module_default.editBtn, this.state.disabled ? signature_module_default.noActived : `${signature_module_default.actived} linear-animate-btn`].join(" "),
								onPointerUp: this.handleConfirmTrigger,
								onClick: this.handleConfirmTrigger,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("confirm") })
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: loading }),
				signaLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignatureModal, {
					signaLoading,
					loadObj: signaLoadObj
				}) : null,
				callLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallModal, {
					callLoading,
					loadObj: callLoadObj
				}) : null,
				errorApiShow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert_default, {
					variant: "filled",
					severity: "error",
					children: errorApiMsg
				}) : null
			]
		});
	}
};
var mapStateToProps = (state) => ({
	selfConfig: state.selfConfig,
	currentOrder: state.currentOrder,
	allSysConfig: state.allSysConfig,
	crm: state.crm
});
var signature_default = connect(mapStateToProps, { markPostPaymentAction })(withTranslation()(Signature));
//#endregion
export { signature_default as t };
