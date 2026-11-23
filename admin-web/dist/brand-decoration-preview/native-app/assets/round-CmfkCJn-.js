import { o as __commonJSMin } from "./toast-C8a1ReSo.js";
import { Da as require__root, Ii as require_toString, Oi as require_toInteger, ki as require_toNumber } from "./actions-BwRPwnFF.js";
//#region node_modules/lodash/_createRound.js
var require__createRound = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var root = require__root();
	var toInteger = require_toInteger();
	var toNumber = require_toNumber();
	var toString = require_toString();
	var nativeIsFinite = root.isFinite;
	var nativeMin = Math.min;
	/**
	* Creates a function like `_.round`.
	*
	* @private
	* @param {string} methodName The name of the `Math` method to use when rounding.
	* @returns {Function} Returns the new round function.
	*/
	function createRound(methodName) {
		var func = Math[methodName];
		return function(number, precision) {
			number = toNumber(number);
			precision = precision == null ? 0 : nativeMin(toInteger(precision), 292);
			if (precision && nativeIsFinite(number)) {
				var pair = (toString(number) + "e").split("e");
				pair = (toString(func(pair[0] + "e" + (+pair[1] + precision))) + "e").split("e");
				return +(pair[0] + "e" + (+pair[1] - precision));
			}
			return func(number);
		};
	}
	module.exports = createRound;
}));
//#endregion
//#region node_modules/lodash/round.js
var require_round = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__createRound()("round");
}));
//#endregion
export { require_round as t };
