import { c as __exportAll, d as __toESM, o as __commonJSMin, t as toast_default } from "./toast-C8a1ReSo.js";
import { C as getMarginappFetchConfig, D as posFrontLog, H as EventBus, J as axios_default, K as serverURL, Y as getPosVersion, c as judgeSskeyIsActiveTime, et as langCodeMap, r as getCookie } from "./utils-Cdx9DbDR.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { n as axiosPost, t as axiosGet } from "./kioskConfigApi-68IKDHob.js";
import { n as resources_default, t as native_i18n_default } from "./native-i18n-Bya1piKW.js";
//#region source-snapshot/src/constants/actionTypes.js
var FETCH_LANGUAGE = "FETCH_LANGUAGE";
var FETCH_MENUGROUP = "FETCH_MENUGROUP";
var COMBO_MENU = "COMBO_MENU";
var STANDARD_CATE_DISH = "STANDARD_CATE_DISH";
var SET_ALL_MENU = "SET_ALL_MENU";
var FETCH_MERCHANT_PROFILE = "FETCH_MERCHANT_PROFILE";
var CURRENT_CATEGORY = "CURRENT_CATEGORY";
var CURRENT_CATEGORY_LIST = "CURRENT_CATEGORY_LIST";
var CURRENT_SALE_ITEMS = "CURRENT_SALE_ITEMS";
var CURRENT_ITEM = "CURRENT_ITEM";
var CURRENT_LANGUAGE = "CURRENT_LANGUAGE";
var CURRENT_COMBO = "CURRENT_COMBO";
var RESET_CURRENT_COMBO = "RESET_CURRENT_COMBO";
var INIT_ORDER_SEQUENCE = "INIT_ORDER_SEQUENCE";
var SET_ORDER_SEQUENCE = "SET_ORDER_SEQUENCE";
var REMOVE_ITEM_FROM_ORDER = "REMOVE_ITEM_FROM_ORDER";
var REMOVE_MEMBERSHIP_CARD = "REMOVE_MEMBERSHIP_CARD";
var EDIT_ORDER = "EDIT_ORDER";
var RESET_ITEM_LIST = "RESET_ITEM_LIST";
var ORDER_SEQUENCE = "ORDER_SEQUENCE";
var ADD_TO_SECTION = "ADD_TO_SECTION";
var CHANGE_DEFAULT_DISH = "CHANGE_DEFAULT_DISH";
var EDIT_DEFAULT_DISH = "EDIT_DEFAULT_DISH";
var ORDER_TYPE$1 = "ORDER_TYPE";
var REMOVE_FROM_SECTION = "REMOVE_FROM_SECTION";
var SAVE_ORDER_RESULT = "SAVE_ORDER_RESULT";
var RESET_ORDER = "RESET_ORDER";
var SET_ORDER_STATUS = "SET_ORDER_STATUS";
var SET_PAYMENT_ID = "SET_PAYMENT_ID";
var SET_PAYMENT_MEMBER_CARD_RECORD = "SET_PAYMENT_MEMBER_CARD_RECORD";
var SET_PAYMENT_MEMBER_POINTS_ESTIMATE = "SET_PAYMENT_MEMBER_POINTS_ESTIMATE";
var SET_ORDER_NOTES = "SET_ORDER_NOTES";
var SET_ORDER_CUSTOMER = "SET_ORDER_CUSTOMER";
var SET_PICKUP_TIME = "SET_PICKUP_TIME";
var EXPEND_FREELIST = "EXPEND_FREELIST";
var SET_ORIGINAL_ITEM_LIST = "SET_ORIGINAL_ITEM_LIST";
var SAVE_TIP_AMOUNT = "SAVE_TIP_AMOUNT";
var SET_ITEM_PRICE = "SET_ITEM_PRICE";
var ADD_COMBO_OPTION = "ADD_COMBO_OPTION";
var ADD_OPTION = "ADD_OPTION";
var ADD_COMBO_TO_ORDER = "ADD_COMBO_TO_ORDER";
var REMOVE_PROMOTION_DISCOUNT_ITEM = "REMOVE_PROMOTION_DISCOUNT_ITEM";
var RECOUNT_CURRENT_ORDER_LIST = "RECOUNT_CURRENT_ORDER_LIST";
var IS_ORDER_EDIT = "IS_ORDER_EDIT";
var DEFAULT_CURRENT_COMBO = "DEFAULT_CURRENT_COMBO";
var ADD_CAMPAIGN_ITEMS_TO_ORDER = "ADD_CAMPAIGN_ITEMS_TO_ORDER";
var REMOVE_REWARD_ITEM_FROM_ORDER = "REMOVE_REWARD_ITEM_FROM_ORDER";
var REMOVE_ITEM_REWARD_INFO = "REMOVE_ITEM_REWARD_INFO";
var REMOVE_LOCAL_PROMOTION_REWARD_INFO = "REMOVE_LOCAL_PROMOTION_REWARD_INFO";
var REMOVE_MANUAL_SELECT_REWARD_ITEM = "REMOVE_MANUAL_SELECT_REWARD_ITEM";
var SET_SYSTEM_CONFIG = "SET_SYSTEM_CONFIG";
var SET_TAX_INFO = "SET_TAX_INFO";
var MENU_ITEM_LIST = "MENU_ITEM_LIST";
var ITEM_SIZE_LIST = "ITEM_SIZE_LIST";
var SEARCH_KEY_WORD = "SEARCH_KEY_WORD";
var TEMP_ITEM_LIST = "TEMP_ITEM_LIST";
var TEMP_CURRENT_CATEGORY = "TEMP_CURRENT_CATEGORY";
var SAVE_PAYMENT_TYPE = "SAVE_PAYMENT_TYPE";
var APPEND_PAYMENT_TYPE_TRAIL = "APPEND_PAYMENT_TYPE_TRAIL";
var CLEAR_PAYMENT_TYPE_TRAIL = "CLEAR_PAYMENT_TYPE_TRAIL";
var MARK_POST_PAYMENT_ACTION = "MARK_POST_PAYMENT_ACTION";
var CLEAR_POST_PAYMENT_ACTIONS = "CLEAR_POST_PAYMENT_ACTIONS";
var SIDENAVINDEX = "SIDENAVINDEX";
var SIDENAVLISTINFO = "SIDENAVLISTINFO";
var REMOVEDIYCOMBO = "REMOVEDIYCOMBO";
var REMOVEDIYOPTCOMBO = "REMOVEDIYOPTCOMBO";
var CLEARDIYCOMBO = "CLEARDIYCOMBO";
var REPLACE_TO_ORDER = "REPLACE_TO_ORDER";
var REPLACEORREDUCEOLDCOMBO = "REPLACEORREDUCEOLDCOMBO";
var SETKEYBOARDTOGGLE = "SETKEYBOARDTOGGLE";
var SPLICE_ORDER = "SPLICE_ORDER";
var ADD_TO_SECTION_BYID = "ADD_TO_SECTION_BYID";
var REMOVE_ONE_OPTIONS = "REMOVE_ONE_OPTIONS";
var REMOVE_ONE_ITEMS = "REMOVE_ONE_ITEMS";
var SPLICE_ALL_ITEMS = "SPLICE_ALL_ITEMS";
var SPLICE_SINGLE_ITEMS = "SPLICE_SINGLE_ITEMS";
var SET_LANMODAL = "SET_LANMODAL";
var SET_LANMODALFN = "SET_LANMODALFN";
var SET_NETWORKTATUS = "SET_NETWORKTATUS";
var DELETEALLBYID = "DELETEALLBYID";
var SETEDITCOMBOQTY = "SETEDITCOMBOQTY";
var ALL_SET_SYSTEM_CONFIG = "ALL_SET_SYSTEM_CONFIG";
var SELF_CONFIG = "SELF_CONFIG";
var SPLICEORDERBYSOLDOUT = "SPLICEORDERBYSOLDOUT";
var SETISREORDERFLAG = "SETISREORDERFLAG";
var SETTABELSERVICETYPE = "SETTABELSERVICETYPE";
var SETKIOSKCONFIGUSERID = "SETKIOSKCONFIGUSERID";
var MOBY_DEVICE_LINK_STATUS = "MOBY_DEVICE_LINK_STATUS";
var MOBY_DEVICE_INFO = "MOBY_DEVICE_INFO";
var TRIPOS_PAY_READY = "TRIPOS_PAY_READY";
var TRIPOS_PAY_FINISH = "TRIPOS_PAY_FINISH";
var SYSTEM_LICENSE = "SYSTEM_LICENSE";
var SET_IMG = "SET_IMG";
var SET_LOGO = "SET_LOGO";
var SET_BANNER = "SET_BANNER";
var SET_SHOW_BANNER = "SET_SHOW_BANNER";
var SET_BANNERPRO = "SET_BANNERPRO";
var SET_SHOW_BANNERPRO = "SET_SHOW_BANNERPRO";
var SET_SHOW_LOGINGUIDEDIALOG = "SET_SHOW_LOGINGUIDEDIALOG";
var SET_SHOW_WAITING_TIME_MODAL = "SET_SHOW_WAITING_TIME_MODAL";
var SET_SCREENSAVER = "SET_SCREENSAVER";
var SET_TOGO_OPTION = "SET_TOGO_OPTION";
var CLEAR_TOGO_OPTION = "CLEAR_TOGO_OPTION";
var SETREQUIRECATEGORY = "SETREQUIRECATEGORY";
var SET_CARD_RESULT = "SET_CARD_RESULT";
var PP_WS = "PP_WS";
var ISMENUUPDATED = "ISMENUUPDATED";
var MAKINGCUPNUM = "MAKINGCUPNUM";
var SETCATEYPAGEDOMTOP = "SETCATEYPAGEDOMTOP";
var SETORDERPAGEDOMTOP = "SETORDERPAGEDOMTOP";
var MENULOAD = "MENULOAD";
var SELECTEDBRAND = "SELECTEDBRAND";
var BRANDMENU = "BRANDMENU";
var SAVESEARCHITEM = "SAVESEARCHITEM";
var SETVLISTSCROLLHEIGHT = "SETVLISTSCROLLHEIGHT";
var SETLOCATOR = "SETLOCATOR";
var SET_TABLE_ID = "SET_TABLE_ID";
var SET_NUM_OF_GUESTS = "SET_NUM_OF_GUESTS";
var IS_AUTHORIZATION_DISPLAY_NAME = "IS_AUTHORIZATION_DISPLAY_NAME";
var SET_CUSTOMER_NAME = "SET_CUSTOMER_NAME";
var CHANGE_CHECK_FOOTER_VISIBLE = "CHANGE_CHECK_FOOTER_VISIBLE";
var REMOVE_FREE_ITEM_IN_ORDER = "REMOVE_FREE_ITEM_IN_ORDER";
/**
* CRM 相关
* */
var IS_SHOW_LOGIN_BAR = "IS_SHOW_LOGIN_BAR";
var CRM_MEMBER_INFO = "CRM_MEMBER_INFO";
var CRM_PRIVILEGES = "CRM_PRIVILEGES";
var CRM_EARN_RULE = "CRM_EARN_RULE";
var IS_NEW_MEMBER = "IS_NEW_MEMBER";
var LOGIN_TYPE = "LOGIN_TYPE";
var SET_CRM_AUTH_CODE_VERIFIED = "SET_CRM_AUTH_CODE_VERIFIED";
var SET_CRM_AUTH_CODE_VERIFIED_PHONE = "SET_CRM_AUTH_CODE_VERIFIED_PHONE";
var CHANGE_FREE_ITEM = "CHANGE_FREE_ITEM";
var SET_TEMP_FREE_ITEM = "SET_TEMP_FREE_ITEM";
var SET_DISCOUNT = "SET_DISCOUNT";
var IGNORE_REWARD = "IGNORE_REWARD";
var CRM_REWARD_RULE = "CRM_REWARD_RULE";
var ONBOARD_GIFT_RULE = "ONBOARD_GIFT_RULE";
var FREE_ITEM_MENU_POSITION = "FREE_ITEM_MENU_POSITION";
var IS_MEMBER_ORDERED_BEFORE = "IS_MEMBER_ORDERED_BEFORE";
var SET_TEMP_CAMPAIGN = "SET_TEMP_CAMPAIGN";
var SET_PROMOTION = "SET_PROMOTION";
var SET_BUY_GIFTS = "SET_BUY_GIFTS";
var SET_SATISFY_RULES = "SET_SATISFY_RULES";
var SET_BUY_GIFTS_RULES = "SET_BUY_GIFTS_RULES";
var SET_EXCHANGE_PURCHASE_RULES = "SET_EXCHANGE_PURCHASE_RULES";
var SET_BUY_DISCOUNT_RULES = "SET_BUY_DISCOUNT_RULES";
var SET_ORDER_DISCOUNT = "SET_ORDER_DISCOUNT";
var SET_PROMO_CODE = "SET_PROMO_CODE";
var RECORD_KIOSK_DISCOUNT_PROMOTION = "RECORD_KIOSK_DISCOUNT_PROMOTION";
var SET_CLOUD_PROMOTION_LIST = "SET_CLOUD_PROMOTION_LIST";
var SET_CLOUD_PROMOTION_METAS = "SET_CLOUD_PROMOTION_METAS";
var CHANGE_CLOUD_PROMOTION_STATUS = "CHANGE_CLOUD_PROMOTION_STATUS";
var SET_ITEM_MATCH_CLOUD_PROMOTION = "SET_ITEM_MATCH_CLOUD_PROMOTION";
var SET_ITEM_VALID_PROMOTION = "SET_ITEM_VALID_PROMOTION";
var CHANGE_CRM_PROMOTION_CONTRARY_INFO = "CHANGE_CRM_PROMOTION_CONTRARY_INFO";
var SET_IS_PAUSE_AUTO_VALIDATE_PROMOTION = "SET_IS_PAUSE_AUTO_VALIDATE_PROMOTION";
/**
* 云Promotion
* */
var SET_CLOUD_PROMOTION = "SET_CLOUD_PROMOTION";
var RESET_PROMOTION = "RESET_PROMOTION";
var CHANGE_SKIP_PROMOTION_CALCULATION_STATUS = "CHANGE_SKIP_PROMOTION_CALCULATION_STATUS";
/**
* AD
* */
var SET_AD_OUTLET_INFO = "SET_AD_OUTLET_INFO";
var SET_MERCHANT_CAMPAIGN_LIST = "SET_MERCHANT_CAMPAIGN_LIST";
var SET_MEMBERSHIP = "SET_MEMBERSHIP";
var SET_LOYALTY = "SET_LOYALTY";
var SET_ITEM_VOUCHERS = "SET_ITEM_VOUCHERS";
var SET_DOLLAR_VALUE_VOUCHERS = "SET_DOLLAR_VALUE_VOUCHERS";
var SET_DOLLAR_PERCENTAGE_VOUCHERS = "SET_DOLLAR_PERCENTAGE_VOUCHERS";
var SET_COMMIT_ID = "SET_COMMIT_ID";
var SET_ORDER_REWARD_ID = "SET_ORDER_REWARD_ID";
var SET_THIRD_PARTY_COMMIT_ID = "SET_THIRD_PARTY_COMMIT_ID";
/**
* crm-integration
* */
var SET_CRM_INTEGRATION_REWARD = "SET_CRM_INTEGRATION_REWARD";
var SET_CRM_INTEGRATION_CUSTOMER_VOUCHERS = "SET_CRM_INTEGRATION_CUSTOMER_VOUCHERS";
var SET_SDK_META_DATA = "SET_SDK_META_DATA";
var SET_CRM_CUSTOMER_INFO = "SET_CRM_CUSTOMER_INFO";
var SET_NEED_COMMIT = "SET_NEED_COMMIT";
var CHANGE_REWARD_MODAL_VISIBLE = "CHANGE_REWARD_MODAL_VISIBLE";
var SET_AESERT_LIST_STATUS = "SET_AESERT_LIST_STATUS";
/**
* Poster pro
* */
var SET_POSTER_DATA = "SET_POSTER_DATA";
var SET_CURRENT_BLOCK = "SET_CURRENT_BLOCK";
var SET_CURRENT_PAGE = "SET_CURRENT_PAGE";
var CHANGE_POSTER_STATUS = "CHANGE_POSTER_STATUS";
var SET_KIOSK_MENU_TREE = "SET_KIOSK_MENU_TREE";
var SET_ECARD_SETTINGS = "SET_ECARD_SETTINGS";
var SET_ECARD_QUICK_AMOUNTS = "SET_ECARD_QUICK_AMOUNTS";
var SET_ECARD_CLOUD_GIFT_CARD_ITEM = "SET_ECARD_CLOUD_GIFT_CARD_ITEM";
var SET_SELECTED_ECARD = "SET_SELECTED_ECARD";
var SET_AVAILABLE_ECARDS = "SET_AVAILABLE_ECARDS";
var SET_ECARD_LAST_QUERY = "SET_ECARD_LAST_QUERY";
var SET_ECARD_LOADING = "SET_ECARD_LOADING";
var SET_GIFT_CARD_PAYMENT_INFO = "SET_GIFT_CARD_PAYMENT_INFO";
//#endregion
//#region node_modules/lodash/_listCacheClear.js
var require__listCacheClear = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Removes all key-value entries from the list cache.
	*
	* @private
	* @name clear
	* @memberOf ListCache
	*/
	function listCacheClear() {
		this.__data__ = [];
		this.size = 0;
	}
	module.exports = listCacheClear;
}));
//#endregion
//#region node_modules/lodash/eq.js
var require_eq = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Performs a
	* [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	* comparison between two values to determine if they are equivalent.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to compare.
	* @param {*} other The other value to compare.
	* @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	* @example
	*
	* var object = { 'a': 1 };
	* var other = { 'a': 1 };
	*
	* _.eq(object, object);
	* // => true
	*
	* _.eq(object, other);
	* // => false
	*
	* _.eq('a', 'a');
	* // => true
	*
	* _.eq('a', Object('a'));
	* // => false
	*
	* _.eq(NaN, NaN);
	* // => true
	*/
	function eq(value, other) {
		return value === other || value !== value && other !== other;
	}
	module.exports = eq;
}));
//#endregion
//#region node_modules/lodash/_assocIndexOf.js
var require__assocIndexOf = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var eq = require_eq();
	/**
	* Gets the index at which the `key` is found in `array` of key-value pairs.
	*
	* @private
	* @param {Array} array The array to inspect.
	* @param {*} key The key to search for.
	* @returns {number} Returns the index of the matched value, else `-1`.
	*/
	function assocIndexOf(array, key) {
		var length = array.length;
		while (length--) if (eq(array[length][0], key)) return length;
		return -1;
	}
	module.exports = assocIndexOf;
}));
//#endregion
//#region node_modules/lodash/_listCacheDelete.js
var require__listCacheDelete = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assocIndexOf = require__assocIndexOf();
	/** Built-in value references. */
	var splice = Array.prototype.splice;
	/**
	* Removes `key` and its value from the list cache.
	*
	* @private
	* @name delete
	* @memberOf ListCache
	* @param {string} key The key of the value to remove.
	* @returns {boolean} Returns `true` if the entry was removed, else `false`.
	*/
	function listCacheDelete(key) {
		var data = this.__data__, index = assocIndexOf(data, key);
		if (index < 0) return false;
		if (index == data.length - 1) data.pop();
		else splice.call(data, index, 1);
		--this.size;
		return true;
	}
	module.exports = listCacheDelete;
}));
//#endregion
//#region node_modules/lodash/_listCacheGet.js
var require__listCacheGet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assocIndexOf = require__assocIndexOf();
	/**
	* Gets the list cache value for `key`.
	*
	* @private
	* @name get
	* @memberOf ListCache
	* @param {string} key The key of the value to get.
	* @returns {*} Returns the entry value.
	*/
	function listCacheGet(key) {
		var data = this.__data__, index = assocIndexOf(data, key);
		return index < 0 ? void 0 : data[index][1];
	}
	module.exports = listCacheGet;
}));
//#endregion
//#region node_modules/lodash/_listCacheHas.js
var require__listCacheHas = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assocIndexOf = require__assocIndexOf();
	/**
	* Checks if a list cache value for `key` exists.
	*
	* @private
	* @name has
	* @memberOf ListCache
	* @param {string} key The key of the entry to check.
	* @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	*/
	function listCacheHas(key) {
		return assocIndexOf(this.__data__, key) > -1;
	}
	module.exports = listCacheHas;
}));
//#endregion
//#region node_modules/lodash/_listCacheSet.js
var require__listCacheSet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assocIndexOf = require__assocIndexOf();
	/**
	* Sets the list cache `key` to `value`.
	*
	* @private
	* @name set
	* @memberOf ListCache
	* @param {string} key The key of the value to set.
	* @param {*} value The value to set.
	* @returns {Object} Returns the list cache instance.
	*/
	function listCacheSet(key, value) {
		var data = this.__data__, index = assocIndexOf(data, key);
		if (index < 0) {
			++this.size;
			data.push([key, value]);
		} else data[index][1] = value;
		return this;
	}
	module.exports = listCacheSet;
}));
//#endregion
//#region node_modules/lodash/_ListCache.js
var require__ListCache = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var listCacheClear = require__listCacheClear();
	var listCacheDelete = require__listCacheDelete();
	var listCacheGet = require__listCacheGet();
	var listCacheHas = require__listCacheHas();
	var listCacheSet = require__listCacheSet();
	/**
	* Creates an list cache object.
	*
	* @private
	* @constructor
	* @param {Array} [entries] The key-value pairs to cache.
	*/
	function ListCache(entries) {
		var index = -1, length = entries == null ? 0 : entries.length;
		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype["delete"] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;
	module.exports = ListCache;
}));
//#endregion
//#region node_modules/lodash/_stackClear.js
var require__stackClear = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ListCache = require__ListCache();
	/**
	* Removes all key-value entries from the stack.
	*
	* @private
	* @name clear
	* @memberOf Stack
	*/
	function stackClear() {
		this.__data__ = new ListCache();
		this.size = 0;
	}
	module.exports = stackClear;
}));
//#endregion
//#region node_modules/lodash/_stackDelete.js
var require__stackDelete = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Removes `key` and its value from the stack.
	*
	* @private
	* @name delete
	* @memberOf Stack
	* @param {string} key The key of the value to remove.
	* @returns {boolean} Returns `true` if the entry was removed, else `false`.
	*/
	function stackDelete(key) {
		var data = this.__data__, result = data["delete"](key);
		this.size = data.size;
		return result;
	}
	module.exports = stackDelete;
}));
//#endregion
//#region node_modules/lodash/_stackGet.js
var require__stackGet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Gets the stack value for `key`.
	*
	* @private
	* @name get
	* @memberOf Stack
	* @param {string} key The key of the value to get.
	* @returns {*} Returns the entry value.
	*/
	function stackGet(key) {
		return this.__data__.get(key);
	}
	module.exports = stackGet;
}));
//#endregion
//#region node_modules/lodash/_stackHas.js
var require__stackHas = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Checks if a stack value for `key` exists.
	*
	* @private
	* @name has
	* @memberOf Stack
	* @param {string} key The key of the entry to check.
	* @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	*/
	function stackHas(key) {
		return this.__data__.has(key);
	}
	module.exports = stackHas;
}));
//#endregion
//#region node_modules/lodash/_freeGlobal.js
var require__freeGlobal = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = typeof global == "object" && global && global.Object === Object && global;
}));
//#endregion
//#region node_modules/lodash/_root.js
var require__root = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var freeGlobal = require__freeGlobal();
	/** Detect free variable `self`. */
	var freeSelf = typeof self == "object" && self && self.Object === Object && self;
	module.exports = freeGlobal || freeSelf || Function("return this")();
}));
//#endregion
//#region node_modules/lodash/_Symbol.js
var require__Symbol = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__root().Symbol;
}));
//#endregion
//#region node_modules/lodash/_getRawTag.js
var require__getRawTag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Symbol = require__Symbol();
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	/**
	* Used to resolve the
	* [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	* of values.
	*/
	var nativeObjectToString = objectProto.toString;
	/** Built-in value references. */
	var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
	/**
	* A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	*
	* @private
	* @param {*} value The value to query.
	* @returns {string} Returns the raw `toStringTag`.
	*/
	function getRawTag(value) {
		var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
		try {
			value[symToStringTag] = void 0;
			var unmasked = true;
		} catch (e) {}
		var result = nativeObjectToString.call(value);
		if (unmasked) if (isOwn) value[symToStringTag] = tag;
		else delete value[symToStringTag];
		return result;
	}
	module.exports = getRawTag;
}));
//#endregion
//#region node_modules/lodash/_objectToString.js
var require__objectToString = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Used to resolve the
	* [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	* of values.
	*/
	var nativeObjectToString = Object.prototype.toString;
	/**
	* Converts `value` to a string using `Object.prototype.toString`.
	*
	* @private
	* @param {*} value The value to convert.
	* @returns {string} Returns the converted string.
	*/
	function objectToString(value) {
		return nativeObjectToString.call(value);
	}
	module.exports = objectToString;
}));
//#endregion
//#region node_modules/lodash/_baseGetTag.js
var require__baseGetTag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Symbol = require__Symbol();
	var getRawTag = require__getRawTag();
	var objectToString = require__objectToString();
	/** `Object#toString` result references. */
	var nullTag = "[object Null]";
	var undefinedTag = "[object Undefined]";
	/** Built-in value references. */
	var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
	/**
	* The base implementation of `getTag` without fallbacks for buggy environments.
	*
	* @private
	* @param {*} value The value to query.
	* @returns {string} Returns the `toStringTag`.
	*/
	function baseGetTag(value) {
		if (value == null) return value === void 0 ? undefinedTag : nullTag;
		return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
	}
	module.exports = baseGetTag;
}));
//#endregion
//#region node_modules/lodash/isObject.js
var require_isObject = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Checks if `value` is the
	* [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	* of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	*
	* @static
	* @memberOf _
	* @since 0.1.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is an object, else `false`.
	* @example
	*
	* _.isObject({});
	* // => true
	*
	* _.isObject([1, 2, 3]);
	* // => true
	*
	* _.isObject(_.noop);
	* // => true
	*
	* _.isObject(null);
	* // => false
	*/
	function isObject(value) {
		var type = typeof value;
		return value != null && (type == "object" || type == "function");
	}
	module.exports = isObject;
}));
//#endregion
//#region node_modules/lodash/isFunction.js
var require_isFunction = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseGetTag = require__baseGetTag();
	var isObject = require_isObject();
	/** `Object#toString` result references. */
	var asyncTag = "[object AsyncFunction]";
	var funcTag = "[object Function]";
	var genTag = "[object GeneratorFunction]";
	var proxyTag = "[object Proxy]";
	/**
	* Checks if `value` is classified as a `Function` object.
	*
	* @static
	* @memberOf _
	* @since 0.1.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a function, else `false`.
	* @example
	*
	* _.isFunction(_);
	* // => true
	*
	* _.isFunction(/abc/);
	* // => false
	*/
	function isFunction(value) {
		if (!isObject(value)) return false;
		var tag = baseGetTag(value);
		return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}
	module.exports = isFunction;
}));
//#endregion
//#region node_modules/lodash/_coreJsData.js
var require__coreJsData = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__root()["__core-js_shared__"];
}));
//#endregion
//#region node_modules/lodash/_isMasked.js
var require__isMasked = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var coreJsData = require__coreJsData();
	/** Used to detect methods masquerading as native. */
	var maskSrcKey = function() {
		var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
		return uid ? "Symbol(src)_1." + uid : "";
	}();
	/**
	* Checks if `func` has its source masked.
	*
	* @private
	* @param {Function} func The function to check.
	* @returns {boolean} Returns `true` if `func` is masked, else `false`.
	*/
	function isMasked(func) {
		return !!maskSrcKey && maskSrcKey in func;
	}
	module.exports = isMasked;
}));
//#endregion
//#region node_modules/lodash/_toSource.js
var require__toSource = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** Used to resolve the decompiled source of functions. */
	var funcToString = Function.prototype.toString;
	/**
	* Converts `func` to its source code.
	*
	* @private
	* @param {Function} func The function to convert.
	* @returns {string} Returns the source code.
	*/
	function toSource(func) {
		if (func != null) {
			try {
				return funcToString.call(func);
			} catch (e) {}
			try {
				return func + "";
			} catch (e) {}
		}
		return "";
	}
	module.exports = toSource;
}));
//#endregion
//#region node_modules/lodash/_baseIsNative.js
var require__baseIsNative = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isFunction = require_isFunction();
	var isMasked = require__isMasked();
	var isObject = require_isObject();
	var toSource = require__toSource();
	/**
	* Used to match `RegExp`
	* [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	*/
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;
	/** Used for built-in method references. */
	var funcProto = Function.prototype;
	var objectProto = Object.prototype;
	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	/** Used to detect if a method is native. */
	var reIsNative = RegExp("^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
	/**
	* The base implementation of `_.isNative` without bad shim checks.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a native function,
	*  else `false`.
	*/
	function baseIsNative(value) {
		if (!isObject(value) || isMasked(value)) return false;
		return (isFunction(value) ? reIsNative : reIsHostCtor).test(toSource(value));
	}
	module.exports = baseIsNative;
}));
//#endregion
//#region node_modules/lodash/_getValue.js
var require__getValue = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Gets the value at `key` of `object`.
	*
	* @private
	* @param {Object} [object] The object to query.
	* @param {string} key The key of the property to get.
	* @returns {*} Returns the property value.
	*/
	function getValue(object, key) {
		return object == null ? void 0 : object[key];
	}
	module.exports = getValue;
}));
//#endregion
//#region node_modules/lodash/_getNative.js
var require__getNative = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseIsNative = require__baseIsNative();
	var getValue = require__getValue();
	/**
	* Gets the native function at `key` of `object`.
	*
	* @private
	* @param {Object} object The object to query.
	* @param {string} key The key of the method to get.
	* @returns {*} Returns the function if it's native, else `undefined`.
	*/
	function getNative(object, key) {
		var value = getValue(object, key);
		return baseIsNative(value) ? value : void 0;
	}
	module.exports = getNative;
}));
//#endregion
//#region node_modules/lodash/_Map.js
var require__Map = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__getNative()(require__root(), "Map");
}));
//#endregion
//#region node_modules/lodash/_nativeCreate.js
var require__nativeCreate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__getNative()(Object, "create");
}));
//#endregion
//#region node_modules/lodash/_hashClear.js
var require__hashClear = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var nativeCreate = require__nativeCreate();
	/**
	* Removes all key-value entries from the hash.
	*
	* @private
	* @name clear
	* @memberOf Hash
	*/
	function hashClear() {
		this.__data__ = nativeCreate ? nativeCreate(null) : {};
		this.size = 0;
	}
	module.exports = hashClear;
}));
//#endregion
//#region node_modules/lodash/_hashDelete.js
var require__hashDelete = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Removes `key` and its value from the hash.
	*
	* @private
	* @name delete
	* @memberOf Hash
	* @param {Object} hash The hash to modify.
	* @param {string} key The key of the value to remove.
	* @returns {boolean} Returns `true` if the entry was removed, else `false`.
	*/
	function hashDelete(key) {
		var result = this.has(key) && delete this.__data__[key];
		this.size -= result ? 1 : 0;
		return result;
	}
	module.exports = hashDelete;
}));
//#endregion
//#region node_modules/lodash/_hashGet.js
var require__hashGet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var nativeCreate = require__nativeCreate();
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = "__lodash_hash_undefined__";
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* Gets the hash value for `key`.
	*
	* @private
	* @name get
	* @memberOf Hash
	* @param {string} key The key of the value to get.
	* @returns {*} Returns the entry value.
	*/
	function hashGet(key) {
		var data = this.__data__;
		if (nativeCreate) {
			var result = data[key];
			return result === HASH_UNDEFINED ? void 0 : result;
		}
		return hasOwnProperty.call(data, key) ? data[key] : void 0;
	}
	module.exports = hashGet;
}));
//#endregion
//#region node_modules/lodash/_hashHas.js
var require__hashHas = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var nativeCreate = require__nativeCreate();
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* Checks if a hash value for `key` exists.
	*
	* @private
	* @name has
	* @memberOf Hash
	* @param {string} key The key of the entry to check.
	* @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	*/
	function hashHas(key) {
		var data = this.__data__;
		return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
	}
	module.exports = hashHas;
}));
//#endregion
//#region node_modules/lodash/_hashSet.js
var require__hashSet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var nativeCreate = require__nativeCreate();
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = "__lodash_hash_undefined__";
	/**
	* Sets the hash `key` to `value`.
	*
	* @private
	* @name set
	* @memberOf Hash
	* @param {string} key The key of the value to set.
	* @param {*} value The value to set.
	* @returns {Object} Returns the hash instance.
	*/
	function hashSet(key, value) {
		var data = this.__data__;
		this.size += this.has(key) ? 0 : 1;
		data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
		return this;
	}
	module.exports = hashSet;
}));
//#endregion
//#region node_modules/lodash/_Hash.js
var require__Hash = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var hashClear = require__hashClear();
	var hashDelete = require__hashDelete();
	var hashGet = require__hashGet();
	var hashHas = require__hashHas();
	var hashSet = require__hashSet();
	/**
	* Creates a hash object.
	*
	* @private
	* @constructor
	* @param {Array} [entries] The key-value pairs to cache.
	*/
	function Hash(entries) {
		var index = -1, length = entries == null ? 0 : entries.length;
		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}
	Hash.prototype.clear = hashClear;
	Hash.prototype["delete"] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;
	module.exports = Hash;
}));
//#endregion
//#region node_modules/lodash/_mapCacheClear.js
var require__mapCacheClear = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Hash = require__Hash();
	var ListCache = require__ListCache();
	var Map = require__Map();
	/**
	* Removes all key-value entries from the map.
	*
	* @private
	* @name clear
	* @memberOf MapCache
	*/
	function mapCacheClear() {
		this.size = 0;
		this.__data__ = {
			"hash": new Hash(),
			"map": new (Map || ListCache)(),
			"string": new Hash()
		};
	}
	module.exports = mapCacheClear;
}));
//#endregion
//#region node_modules/lodash/_isKeyable.js
var require__isKeyable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Checks if `value` is suitable for use as unique object key.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	*/
	function isKeyable(value) {
		var type = typeof value;
		return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
	}
	module.exports = isKeyable;
}));
//#endregion
//#region node_modules/lodash/_getMapData.js
var require__getMapData = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isKeyable = require__isKeyable();
	/**
	* Gets the data for `map`.
	*
	* @private
	* @param {Object} map The map to query.
	* @param {string} key The reference key.
	* @returns {*} Returns the map data.
	*/
	function getMapData(map, key) {
		var data = map.__data__;
		return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
	}
	module.exports = getMapData;
}));
//#endregion
//#region node_modules/lodash/_mapCacheDelete.js
var require__mapCacheDelete = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getMapData = require__getMapData();
	/**
	* Removes `key` and its value from the map.
	*
	* @private
	* @name delete
	* @memberOf MapCache
	* @param {string} key The key of the value to remove.
	* @returns {boolean} Returns `true` if the entry was removed, else `false`.
	*/
	function mapCacheDelete(key) {
		var result = getMapData(this, key)["delete"](key);
		this.size -= result ? 1 : 0;
		return result;
	}
	module.exports = mapCacheDelete;
}));
//#endregion
//#region node_modules/lodash/_mapCacheGet.js
var require__mapCacheGet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getMapData = require__getMapData();
	/**
	* Gets the map value for `key`.
	*
	* @private
	* @name get
	* @memberOf MapCache
	* @param {string} key The key of the value to get.
	* @returns {*} Returns the entry value.
	*/
	function mapCacheGet(key) {
		return getMapData(this, key).get(key);
	}
	module.exports = mapCacheGet;
}));
//#endregion
//#region node_modules/lodash/_mapCacheHas.js
var require__mapCacheHas = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getMapData = require__getMapData();
	/**
	* Checks if a map value for `key` exists.
	*
	* @private
	* @name has
	* @memberOf MapCache
	* @param {string} key The key of the entry to check.
	* @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	*/
	function mapCacheHas(key) {
		return getMapData(this, key).has(key);
	}
	module.exports = mapCacheHas;
}));
//#endregion
//#region node_modules/lodash/_mapCacheSet.js
var require__mapCacheSet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getMapData = require__getMapData();
	/**
	* Sets the map `key` to `value`.
	*
	* @private
	* @name set
	* @memberOf MapCache
	* @param {string} key The key of the value to set.
	* @param {*} value The value to set.
	* @returns {Object} Returns the map cache instance.
	*/
	function mapCacheSet(key, value) {
		var data = getMapData(this, key), size = data.size;
		data.set(key, value);
		this.size += data.size == size ? 0 : 1;
		return this;
	}
	module.exports = mapCacheSet;
}));
//#endregion
//#region node_modules/lodash/_MapCache.js
var require__MapCache = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var mapCacheClear = require__mapCacheClear();
	var mapCacheDelete = require__mapCacheDelete();
	var mapCacheGet = require__mapCacheGet();
	var mapCacheHas = require__mapCacheHas();
	var mapCacheSet = require__mapCacheSet();
	/**
	* Creates a map cache object to store key-value pairs.
	*
	* @private
	* @constructor
	* @param {Array} [entries] The key-value pairs to cache.
	*/
	function MapCache(entries) {
		var index = -1, length = entries == null ? 0 : entries.length;
		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype["delete"] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;
	module.exports = MapCache;
}));
//#endregion
//#region node_modules/lodash/_stackSet.js
var require__stackSet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ListCache = require__ListCache();
	var Map = require__Map();
	var MapCache = require__MapCache();
	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;
	/**
	* Sets the stack `key` to `value`.
	*
	* @private
	* @name set
	* @memberOf Stack
	* @param {string} key The key of the value to set.
	* @param {*} value The value to set.
	* @returns {Object} Returns the stack cache instance.
	*/
	function stackSet(key, value) {
		var data = this.__data__;
		if (data instanceof ListCache) {
			var pairs = data.__data__;
			if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
				pairs.push([key, value]);
				this.size = ++data.size;
				return this;
			}
			data = this.__data__ = new MapCache(pairs);
		}
		data.set(key, value);
		this.size = data.size;
		return this;
	}
	module.exports = stackSet;
}));
//#endregion
//#region node_modules/lodash/_Stack.js
var require__Stack = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ListCache = require__ListCache();
	var stackClear = require__stackClear();
	var stackDelete = require__stackDelete();
	var stackGet = require__stackGet();
	var stackHas = require__stackHas();
	var stackSet = require__stackSet();
	/**
	* Creates a stack cache object to store key-value pairs.
	*
	* @private
	* @constructor
	* @param {Array} [entries] The key-value pairs to cache.
	*/
	function Stack(entries) {
		var data = this.__data__ = new ListCache(entries);
		this.size = data.size;
	}
	Stack.prototype.clear = stackClear;
	Stack.prototype["delete"] = stackDelete;
	Stack.prototype.get = stackGet;
	Stack.prototype.has = stackHas;
	Stack.prototype.set = stackSet;
	module.exports = Stack;
}));
//#endregion
//#region node_modules/lodash/_arrayEach.js
var require__arrayEach = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* A specialized version of `_.forEach` for arrays without support for
	* iteratee shorthands.
	*
	* @private
	* @param {Array} [array] The array to iterate over.
	* @param {Function} iteratee The function invoked per iteration.
	* @returns {Array} Returns `array`.
	*/
	function arrayEach(array, iteratee) {
		var index = -1, length = array == null ? 0 : array.length;
		while (++index < length) if (iteratee(array[index], index, array) === false) break;
		return array;
	}
	module.exports = arrayEach;
}));
//#endregion
//#region node_modules/lodash/_defineProperty.js
var require__defineProperty = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getNative = require__getNative();
	module.exports = function() {
		try {
			var func = getNative(Object, "defineProperty");
			func({}, "", {});
			return func;
		} catch (e) {}
	}();
}));
//#endregion
//#region node_modules/lodash/_baseAssignValue.js
var require__baseAssignValue = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var defineProperty = require__defineProperty();
	/**
	* The base implementation of `assignValue` and `assignMergeValue` without
	* value checks.
	*
	* @private
	* @param {Object} object The object to modify.
	* @param {string} key The key of the property to assign.
	* @param {*} value The value to assign.
	*/
	function baseAssignValue(object, key, value) {
		if (key == "__proto__" && defineProperty) defineProperty(object, key, {
			"configurable": true,
			"enumerable": true,
			"value": value,
			"writable": true
		});
		else object[key] = value;
	}
	module.exports = baseAssignValue;
}));
//#endregion
//#region node_modules/lodash/_assignValue.js
var require__assignValue = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseAssignValue = require__baseAssignValue();
	var eq = require_eq();
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* Assigns `value` to `key` of `object` if the existing value is not equivalent
	* using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	* for equality comparisons.
	*
	* @private
	* @param {Object} object The object to modify.
	* @param {string} key The key of the property to assign.
	* @param {*} value The value to assign.
	*/
	function assignValue(object, key, value) {
		var objValue = object[key];
		if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === void 0 && !(key in object)) baseAssignValue(object, key, value);
	}
	module.exports = assignValue;
}));
//#endregion
//#region node_modules/lodash/_copyObject.js
var require__copyObject = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assignValue = require__assignValue();
	var baseAssignValue = require__baseAssignValue();
	/**
	* Copies properties of `source` to `object`.
	*
	* @private
	* @param {Object} source The object to copy properties from.
	* @param {Array} props The property identifiers to copy.
	* @param {Object} [object={}] The object to copy properties to.
	* @param {Function} [customizer] The function to customize copied values.
	* @returns {Object} Returns `object`.
	*/
	function copyObject(source, props, object, customizer) {
		var isNew = !object;
		object || (object = {});
		var index = -1, length = props.length;
		while (++index < length) {
			var key = props[index];
			var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
			if (newValue === void 0) newValue = source[key];
			if (isNew) baseAssignValue(object, key, newValue);
			else assignValue(object, key, newValue);
		}
		return object;
	}
	module.exports = copyObject;
}));
//#endregion
//#region node_modules/lodash/_baseTimes.js
var require__baseTimes = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* The base implementation of `_.times` without support for iteratee shorthands
	* or max array length checks.
	*
	* @private
	* @param {number} n The number of times to invoke `iteratee`.
	* @param {Function} iteratee The function invoked per iteration.
	* @returns {Array} Returns the array of results.
	*/
	function baseTimes(n, iteratee) {
		var index = -1, result = Array(n);
		while (++index < n) result[index] = iteratee(index);
		return result;
	}
	module.exports = baseTimes;
}));
//#endregion
//#region node_modules/lodash/isObjectLike.js
var require_isObjectLike = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Checks if `value` is object-like. A value is object-like if it's not `null`
	* and has a `typeof` result of "object".
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	* @example
	*
	* _.isObjectLike({});
	* // => true
	*
	* _.isObjectLike([1, 2, 3]);
	* // => true
	*
	* _.isObjectLike(_.noop);
	* // => false
	*
	* _.isObjectLike(null);
	* // => false
	*/
	function isObjectLike(value) {
		return value != null && typeof value == "object";
	}
	module.exports = isObjectLike;
}));
//#endregion
//#region node_modules/lodash/_baseIsArguments.js
var require__baseIsArguments = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseGetTag = require__baseGetTag();
	var isObjectLike = require_isObjectLike();
	/** `Object#toString` result references. */
	var argsTag = "[object Arguments]";
	/**
	* The base implementation of `_.isArguments`.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is an `arguments` object,
	*/
	function baseIsArguments(value) {
		return isObjectLike(value) && baseGetTag(value) == argsTag;
	}
	module.exports = baseIsArguments;
}));
//#endregion
//#region node_modules/lodash/isArguments.js
var require_isArguments = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseIsArguments = require__baseIsArguments();
	var isObjectLike = require_isObjectLike();
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	/** Built-in value references. */
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;
	module.exports = baseIsArguments(function() {
		return arguments;
	}()) ? baseIsArguments : function(value) {
		return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
	};
}));
//#endregion
//#region node_modules/lodash/isArray.js
var require_isArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = Array.isArray;
}));
//#endregion
//#region node_modules/lodash/stubFalse.js
var require_stubFalse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This method returns `false`.
	*
	* @static
	* @memberOf _
	* @since 4.13.0
	* @category Util
	* @returns {boolean} Returns `false`.
	* @example
	*
	* _.times(2, _.stubFalse);
	* // => [false, false]
	*/
	function stubFalse() {
		return false;
	}
	module.exports = stubFalse;
}));
//#endregion
//#region node_modules/lodash/isBuffer.js
var require_isBuffer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var root = require__root();
	var stubFalse = require_stubFalse();
	/** Detect free variable `exports`. */
	var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
	/** Built-in value references. */
	var Buffer = freeModule && freeModule.exports === freeExports ? root.Buffer : void 0;
	module.exports = (Buffer ? Buffer.isBuffer : void 0) || stubFalse;
}));
//#endregion
//#region node_modules/lodash/_isIndex.js
var require__isIndex = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;
	/**
	* Checks if `value` is a valid array-like index.
	*
	* @private
	* @param {*} value The value to check.
	* @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	* @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	*/
	function isIndex(value, length) {
		var type = typeof value;
		length = length == null ? MAX_SAFE_INTEGER : length;
		return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
	}
	module.exports = isIndex;
}));
//#endregion
//#region node_modules/lodash/isLength.js
var require_isLength = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	/**
	* Checks if `value` is a valid array-like length.
	*
	* **Note:** This method is loosely based on
	* [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	* @example
	*
	* _.isLength(3);
	* // => true
	*
	* _.isLength(Number.MIN_VALUE);
	* // => false
	*
	* _.isLength(Infinity);
	* // => false
	*
	* _.isLength('3');
	* // => false
	*/
	function isLength(value) {
		return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	module.exports = isLength;
}));
//#endregion
//#region node_modules/lodash/_baseIsTypedArray.js
var require__baseIsTypedArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseGetTag = require__baseGetTag();
	var isLength = require_isLength();
	var isObjectLike = require_isObjectLike();
	/** `Object#toString` result references. */
	var argsTag = "[object Arguments]";
	var arrayTag = "[object Array]";
	var boolTag = "[object Boolean]";
	var dateTag = "[object Date]";
	var errorTag = "[object Error]";
	var funcTag = "[object Function]";
	var mapTag = "[object Map]";
	var numberTag = "[object Number]";
	var objectTag = "[object Object]";
	var regexpTag = "[object RegExp]";
	var setTag = "[object Set]";
	var stringTag = "[object String]";
	var weakMapTag = "[object WeakMap]";
	var arrayBufferTag = "[object ArrayBuffer]";
	var dataViewTag = "[object DataView]";
	var float32Tag = "[object Float32Array]";
	var float64Tag = "[object Float64Array]";
	var int8Tag = "[object Int8Array]";
	var int16Tag = "[object Int16Array]";
	var int32Tag = "[object Int32Array]";
	var uint8Tag = "[object Uint8Array]";
	var uint8ClampedTag = "[object Uint8ClampedArray]";
	var uint16Tag = "[object Uint16Array]";
	var uint32Tag = "[object Uint32Array]";
	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
	/**
	* The base implementation of `_.isTypedArray` without Node.js optimizations.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	*/
	function baseIsTypedArray(value) {
		return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
	}
	module.exports = baseIsTypedArray;
}));
//#endregion
//#region node_modules/lodash/_baseUnary.js
var require__baseUnary = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* The base implementation of `_.unary` without support for storing metadata.
	*
	* @private
	* @param {Function} func The function to cap arguments for.
	* @returns {Function} Returns the new capped function.
	*/
	function baseUnary(func) {
		return function(value) {
			return func(value);
		};
	}
	module.exports = baseUnary;
}));
//#endregion
//#region node_modules/lodash/_nodeUtil.js
var require__nodeUtil = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var freeGlobal = require__freeGlobal();
	/** Detect free variable `exports`. */
	var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
	/** Detect free variable `process` from Node.js. */
	var freeProcess = freeModule && freeModule.exports === freeExports && freeGlobal.process;
	module.exports = function() {
		try {
			var types = freeModule && freeModule.require && freeModule.require("util").types;
			if (types) return types;
			return freeProcess && freeProcess.binding && freeProcess.binding("util");
		} catch (e) {}
	}();
}));
//#endregion
//#region node_modules/lodash/isTypedArray.js
var require_isTypedArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseIsTypedArray = require__baseIsTypedArray();
	var baseUnary = require__baseUnary();
	var nodeUtil = require__nodeUtil();
	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
	module.exports = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
}));
//#endregion
//#region node_modules/lodash/_arrayLikeKeys.js
var require__arrayLikeKeys = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseTimes = require__baseTimes();
	var isArguments = require_isArguments();
	var isArray = require_isArray();
	var isBuffer = require_isBuffer();
	var isIndex = require__isIndex();
	var isTypedArray = require_isTypedArray();
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* Creates an array of the enumerable property names of the array-like `value`.
	*
	* @private
	* @param {*} value The value to query.
	* @param {boolean} inherited Specify returning inherited property names.
	* @returns {Array} Returns the array of property names.
	*/
	function arrayLikeKeys(value, inherited) {
		var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
		for (var key in value) if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isBuff && (key == "offset" || key == "parent") || isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || isIndex(key, length)))) result.push(key);
		return result;
	}
	module.exports = arrayLikeKeys;
}));
//#endregion
//#region node_modules/lodash/_isPrototype.js
var require__isPrototype = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	/**
	* Checks if `value` is likely a prototype object.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	*/
	function isPrototype(value) {
		var Ctor = value && value.constructor;
		return value === (typeof Ctor == "function" && Ctor.prototype || objectProto);
	}
	module.exports = isPrototype;
}));
//#endregion
//#region node_modules/lodash/_overArg.js
var require__overArg = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Creates a unary function that invokes `func` with its argument transformed.
	*
	* @private
	* @param {Function} func The function to wrap.
	* @param {Function} transform The argument transform.
	* @returns {Function} Returns the new function.
	*/
	function overArg(func, transform) {
		return function(arg) {
			return func(transform(arg));
		};
	}
	module.exports = overArg;
}));
//#endregion
//#region node_modules/lodash/_nativeKeys.js
var require__nativeKeys = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__overArg()(Object.keys, Object);
}));
//#endregion
//#region node_modules/lodash/_baseKeys.js
var require__baseKeys = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isPrototype = require__isPrototype();
	var nativeKeys = require__nativeKeys();
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	*
	* @private
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of property names.
	*/
	function baseKeys(object) {
		if (!isPrototype(object)) return nativeKeys(object);
		var result = [];
		for (var key in Object(object)) if (hasOwnProperty.call(object, key) && key != "constructor") result.push(key);
		return result;
	}
	module.exports = baseKeys;
}));
//#endregion
//#region node_modules/lodash/isArrayLike.js
var require_isArrayLike = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isFunction = require_isFunction();
	var isLength = require_isLength();
	/**
	* Checks if `value` is array-like. A value is considered array-like if it's
	* not a function and has a `value.length` that's an integer greater than or
	* equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	* @example
	*
	* _.isArrayLike([1, 2, 3]);
	* // => true
	*
	* _.isArrayLike(document.body.children);
	* // => true
	*
	* _.isArrayLike('abc');
	* // => true
	*
	* _.isArrayLike(_.noop);
	* // => false
	*/
	function isArrayLike(value) {
		return value != null && isLength(value.length) && !isFunction(value);
	}
	module.exports = isArrayLike;
}));
//#endregion
//#region node_modules/lodash/keys.js
var require_keys = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var arrayLikeKeys = require__arrayLikeKeys();
	var baseKeys = require__baseKeys();
	var isArrayLike = require_isArrayLike();
	/**
	* Creates an array of the own enumerable property names of `object`.
	*
	* **Note:** Non-object values are coerced to objects. See the
	* [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	* for more details.
	*
	* @static
	* @since 0.1.0
	* @memberOf _
	* @category Object
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of property names.
	* @example
	*
	* function Foo() {
	*   this.a = 1;
	*   this.b = 2;
	* }
	*
	* Foo.prototype.c = 3;
	*
	* _.keys(new Foo);
	* // => ['a', 'b'] (iteration order is not guaranteed)
	*
	* _.keys('hi');
	* // => ['0', '1']
	*/
	function keys(object) {
		return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
	}
	module.exports = keys;
}));
//#endregion
//#region node_modules/lodash/_baseAssign.js
var require__baseAssign = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var copyObject = require__copyObject();
	var keys = require_keys();
	/**
	* The base implementation of `_.assign` without support for multiple sources
	* or `customizer` functions.
	*
	* @private
	* @param {Object} object The destination object.
	* @param {Object} source The source object.
	* @returns {Object} Returns `object`.
	*/
	function baseAssign(object, source) {
		return object && copyObject(source, keys(source), object);
	}
	module.exports = baseAssign;
}));
//#endregion
//#region node_modules/lodash/_nativeKeysIn.js
var require__nativeKeysIn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This function is like
	* [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	* except that it includes inherited enumerable properties.
	*
	* @private
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of property names.
	*/
	function nativeKeysIn(object) {
		var result = [];
		if (object != null) for (var key in Object(object)) result.push(key);
		return result;
	}
	module.exports = nativeKeysIn;
}));
//#endregion
//#region node_modules/lodash/_baseKeysIn.js
var require__baseKeysIn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isObject = require_isObject();
	var isPrototype = require__isPrototype();
	var nativeKeysIn = require__nativeKeysIn();
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
	*
	* @private
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of property names.
	*/
	function baseKeysIn(object) {
		if (!isObject(object)) return nativeKeysIn(object);
		var isProto = isPrototype(object), result = [];
		for (var key in object) if (!(key == "constructor" && (isProto || !hasOwnProperty.call(object, key)))) result.push(key);
		return result;
	}
	module.exports = baseKeysIn;
}));
//#endregion
//#region node_modules/lodash/keysIn.js
var require_keysIn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var arrayLikeKeys = require__arrayLikeKeys();
	var baseKeysIn = require__baseKeysIn();
	var isArrayLike = require_isArrayLike();
	/**
	* Creates an array of the own and inherited enumerable property names of `object`.
	*
	* **Note:** Non-object values are coerced to objects.
	*
	* @static
	* @memberOf _
	* @since 3.0.0
	* @category Object
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of property names.
	* @example
	*
	* function Foo() {
	*   this.a = 1;
	*   this.b = 2;
	* }
	*
	* Foo.prototype.c = 3;
	*
	* _.keysIn(new Foo);
	* // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	*/
	function keysIn(object) {
		return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
	}
	module.exports = keysIn;
}));
//#endregion
//#region node_modules/lodash/_baseAssignIn.js
var require__baseAssignIn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var copyObject = require__copyObject();
	var keysIn = require_keysIn();
	/**
	* The base implementation of `_.assignIn` without support for multiple sources
	* or `customizer` functions.
	*
	* @private
	* @param {Object} object The destination object.
	* @param {Object} source The source object.
	* @returns {Object} Returns `object`.
	*/
	function baseAssignIn(object, source) {
		return object && copyObject(source, keysIn(source), object);
	}
	module.exports = baseAssignIn;
}));
//#endregion
//#region node_modules/lodash/_cloneBuffer.js
var require__cloneBuffer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var root = require__root();
	/** Detect free variable `exports`. */
	var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
	/** Built-in value references. */
	var Buffer = freeModule && freeModule.exports === freeExports ? root.Buffer : void 0;
	var allocUnsafe = Buffer ? Buffer.allocUnsafe : void 0;
	/**
	* Creates a clone of  `buffer`.
	*
	* @private
	* @param {Buffer} buffer The buffer to clone.
	* @param {boolean} [isDeep] Specify a deep clone.
	* @returns {Buffer} Returns the cloned buffer.
	*/
	function cloneBuffer(buffer, isDeep) {
		if (isDeep) return buffer.slice();
		var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
		buffer.copy(result);
		return result;
	}
	module.exports = cloneBuffer;
}));
//#endregion
//#region node_modules/lodash/_copyArray.js
var require__copyArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Copies the values of `source` to `array`.
	*
	* @private
	* @param {Array} source The array to copy values from.
	* @param {Array} [array=[]] The array to copy values to.
	* @returns {Array} Returns `array`.
	*/
	function copyArray(source, array) {
		var index = -1, length = source.length;
		array || (array = Array(length));
		while (++index < length) array[index] = source[index];
		return array;
	}
	module.exports = copyArray;
}));
//#endregion
//#region node_modules/lodash/_arrayFilter.js
var require__arrayFilter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* A specialized version of `_.filter` for arrays without support for
	* iteratee shorthands.
	*
	* @private
	* @param {Array} [array] The array to iterate over.
	* @param {Function} predicate The function invoked per iteration.
	* @returns {Array} Returns the new filtered array.
	*/
	function arrayFilter(array, predicate) {
		var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
		while (++index < length) {
			var value = array[index];
			if (predicate(value, index, array)) result[resIndex++] = value;
		}
		return result;
	}
	module.exports = arrayFilter;
}));
//#endregion
//#region node_modules/lodash/stubArray.js
var require_stubArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This method returns a new empty array.
	*
	* @static
	* @memberOf _
	* @since 4.13.0
	* @category Util
	* @returns {Array} Returns the new empty array.
	* @example
	*
	* var arrays = _.times(2, _.stubArray);
	*
	* console.log(arrays);
	* // => [[], []]
	*
	* console.log(arrays[0] === arrays[1]);
	* // => false
	*/
	function stubArray() {
		return [];
	}
	module.exports = stubArray;
}));
//#endregion
//#region node_modules/lodash/_getSymbols.js
var require__getSymbols = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var arrayFilter = require__arrayFilter();
	var stubArray = require_stubArray();
	/** Built-in value references. */
	var propertyIsEnumerable = Object.prototype.propertyIsEnumerable;
	var nativeGetSymbols = Object.getOwnPropertySymbols;
	module.exports = !nativeGetSymbols ? stubArray : function(object) {
		if (object == null) return [];
		object = Object(object);
		return arrayFilter(nativeGetSymbols(object), function(symbol) {
			return propertyIsEnumerable.call(object, symbol);
		});
	};
}));
//#endregion
//#region node_modules/lodash/_copySymbols.js
var require__copySymbols = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var copyObject = require__copyObject();
	var getSymbols = require__getSymbols();
	/**
	* Copies own symbols of `source` to `object`.
	*
	* @private
	* @param {Object} source The object to copy symbols from.
	* @param {Object} [object={}] The object to copy symbols to.
	* @returns {Object} Returns `object`.
	*/
	function copySymbols(source, object) {
		return copyObject(source, getSymbols(source), object);
	}
	module.exports = copySymbols;
}));
//#endregion
//#region node_modules/lodash/_arrayPush.js
var require__arrayPush = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Appends the elements of `values` to `array`.
	*
	* @private
	* @param {Array} array The array to modify.
	* @param {Array} values The values to append.
	* @returns {Array} Returns `array`.
	*/
	function arrayPush(array, values) {
		var index = -1, length = values.length, offset = array.length;
		while (++index < length) array[offset + index] = values[index];
		return array;
	}
	module.exports = arrayPush;
}));
//#endregion
//#region node_modules/lodash/_getPrototype.js
var require__getPrototype = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__overArg()(Object.getPrototypeOf, Object);
}));
//#endregion
//#region node_modules/lodash/_getSymbolsIn.js
var require__getSymbolsIn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var arrayPush = require__arrayPush();
	var getPrototype = require__getPrototype();
	var getSymbols = require__getSymbols();
	var stubArray = require_stubArray();
	module.exports = !Object.getOwnPropertySymbols ? stubArray : function(object) {
		var result = [];
		while (object) {
			arrayPush(result, getSymbols(object));
			object = getPrototype(object);
		}
		return result;
	};
}));
//#endregion
//#region node_modules/lodash/_copySymbolsIn.js
var require__copySymbolsIn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var copyObject = require__copyObject();
	var getSymbolsIn = require__getSymbolsIn();
	/**
	* Copies own and inherited symbols of `source` to `object`.
	*
	* @private
	* @param {Object} source The object to copy symbols from.
	* @param {Object} [object={}] The object to copy symbols to.
	* @returns {Object} Returns `object`.
	*/
	function copySymbolsIn(source, object) {
		return copyObject(source, getSymbolsIn(source), object);
	}
	module.exports = copySymbolsIn;
}));
//#endregion
//#region node_modules/lodash/_baseGetAllKeys.js
var require__baseGetAllKeys = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var arrayPush = require__arrayPush();
	var isArray = require_isArray();
	/**
	* The base implementation of `getAllKeys` and `getAllKeysIn` which uses
	* `keysFunc` and `symbolsFunc` to get the enumerable property names and
	* symbols of `object`.
	*
	* @private
	* @param {Object} object The object to query.
	* @param {Function} keysFunc The function to get the keys of `object`.
	* @param {Function} symbolsFunc The function to get the symbols of `object`.
	* @returns {Array} Returns the array of property names and symbols.
	*/
	function baseGetAllKeys(object, keysFunc, symbolsFunc) {
		var result = keysFunc(object);
		return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
	}
	module.exports = baseGetAllKeys;
}));
//#endregion
//#region node_modules/lodash/_getAllKeys.js
var require__getAllKeys = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseGetAllKeys = require__baseGetAllKeys();
	var getSymbols = require__getSymbols();
	var keys = require_keys();
	/**
	* Creates an array of own enumerable property names and symbols of `object`.
	*
	* @private
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of property names and symbols.
	*/
	function getAllKeys(object) {
		return baseGetAllKeys(object, keys, getSymbols);
	}
	module.exports = getAllKeys;
}));
//#endregion
//#region node_modules/lodash/_getAllKeysIn.js
var require__getAllKeysIn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseGetAllKeys = require__baseGetAllKeys();
	var getSymbolsIn = require__getSymbolsIn();
	var keysIn = require_keysIn();
	/**
	* Creates an array of own and inherited enumerable property names and
	* symbols of `object`.
	*
	* @private
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of property names and symbols.
	*/
	function getAllKeysIn(object) {
		return baseGetAllKeys(object, keysIn, getSymbolsIn);
	}
	module.exports = getAllKeysIn;
}));
//#endregion
//#region node_modules/lodash/_DataView.js
var require__DataView = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__getNative()(require__root(), "DataView");
}));
//#endregion
//#region node_modules/lodash/_Promise.js
var require__Promise = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__getNative()(require__root(), "Promise");
}));
//#endregion
//#region node_modules/lodash/_Set.js
var require__Set = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__getNative()(require__root(), "Set");
}));
//#endregion
//#region node_modules/lodash/_WeakMap.js
var require__WeakMap = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__getNative()(require__root(), "WeakMap");
}));
//#endregion
//#region node_modules/lodash/_getTag.js
var require__getTag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var DataView = require__DataView();
	var Map = require__Map();
	var Promise = require__Promise();
	var Set = require__Set();
	var WeakMap = require__WeakMap();
	var baseGetTag = require__baseGetTag();
	var toSource = require__toSource();
	/** `Object#toString` result references. */
	var mapTag = "[object Map]";
	var objectTag = "[object Object]";
	var promiseTag = "[object Promise]";
	var setTag = "[object Set]";
	var weakMapTag = "[object WeakMap]";
	var dataViewTag = "[object DataView]";
	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString = toSource(DataView);
	var mapCtorString = toSource(Map);
	var promiseCtorString = toSource(Promise);
	var setCtorString = toSource(Set);
	var weakMapCtorString = toSource(WeakMap);
	/**
	* Gets the `toStringTag` of `value`.
	*
	* @private
	* @param {*} value The value to query.
	* @returns {string} Returns the `toStringTag`.
	*/
	var getTag = baseGetTag;
	if (DataView && getTag(new DataView(/* @__PURE__ */ new ArrayBuffer(1))) != dataViewTag || Map && getTag(new Map()) != mapTag || Promise && getTag(Promise.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) getTag = function(value) {
		var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
		if (ctorString) switch (ctorString) {
			case dataViewCtorString: return dataViewTag;
			case mapCtorString: return mapTag;
			case promiseCtorString: return promiseTag;
			case setCtorString: return setTag;
			case weakMapCtorString: return weakMapTag;
		}
		return result;
	};
	module.exports = getTag;
}));
//#endregion
//#region node_modules/lodash/_initCloneArray.js
var require__initCloneArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* Initializes an array clone.
	*
	* @private
	* @param {Array} array The array to clone.
	* @returns {Array} Returns the initialized clone.
	*/
	function initCloneArray(array) {
		var length = array.length, result = new array.constructor(length);
		if (length && typeof array[0] == "string" && hasOwnProperty.call(array, "index")) {
			result.index = array.index;
			result.input = array.input;
		}
		return result;
	}
	module.exports = initCloneArray;
}));
//#endregion
//#region node_modules/lodash/_Uint8Array.js
var require__Uint8Array = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require__root().Uint8Array;
}));
//#endregion
//#region node_modules/lodash/_cloneArrayBuffer.js
var require__cloneArrayBuffer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Uint8Array = require__Uint8Array();
	/**
	* Creates a clone of `arrayBuffer`.
	*
	* @private
	* @param {ArrayBuffer} arrayBuffer The array buffer to clone.
	* @returns {ArrayBuffer} Returns the cloned array buffer.
	*/
	function cloneArrayBuffer(arrayBuffer) {
		var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
		new Uint8Array(result).set(new Uint8Array(arrayBuffer));
		return result;
	}
	module.exports = cloneArrayBuffer;
}));
//#endregion
//#region node_modules/lodash/_cloneDataView.js
var require__cloneDataView = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var cloneArrayBuffer = require__cloneArrayBuffer();
	/**
	* Creates a clone of `dataView`.
	*
	* @private
	* @param {Object} dataView The data view to clone.
	* @param {boolean} [isDeep] Specify a deep clone.
	* @returns {Object} Returns the cloned data view.
	*/
	function cloneDataView(dataView, isDeep) {
		var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
		return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
	}
	module.exports = cloneDataView;
}));
//#endregion
//#region node_modules/lodash/_cloneRegExp.js
var require__cloneRegExp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** Used to match `RegExp` flags from their coerced string values. */
	var reFlags = /\w*$/;
	/**
	* Creates a clone of `regexp`.
	*
	* @private
	* @param {Object} regexp The regexp to clone.
	* @returns {Object} Returns the cloned regexp.
	*/
	function cloneRegExp(regexp) {
		var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
		result.lastIndex = regexp.lastIndex;
		return result;
	}
	module.exports = cloneRegExp;
}));
//#endregion
//#region node_modules/lodash/_cloneSymbol.js
var require__cloneSymbol = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Symbol = require__Symbol();
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : void 0;
	var symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
	/**
	* Creates a clone of the `symbol` object.
	*
	* @private
	* @param {Object} symbol The symbol object to clone.
	* @returns {Object} Returns the cloned symbol object.
	*/
	function cloneSymbol(symbol) {
		return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
	}
	module.exports = cloneSymbol;
}));
//#endregion
//#region node_modules/lodash/_cloneTypedArray.js
var require__cloneTypedArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var cloneArrayBuffer = require__cloneArrayBuffer();
	/**
	* Creates a clone of `typedArray`.
	*
	* @private
	* @param {Object} typedArray The typed array to clone.
	* @param {boolean} [isDeep] Specify a deep clone.
	* @returns {Object} Returns the cloned typed array.
	*/
	function cloneTypedArray(typedArray, isDeep) {
		var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
		return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
	}
	module.exports = cloneTypedArray;
}));
//#endregion
//#region node_modules/lodash/_initCloneByTag.js
var require__initCloneByTag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var cloneArrayBuffer = require__cloneArrayBuffer();
	var cloneDataView = require__cloneDataView();
	var cloneRegExp = require__cloneRegExp();
	var cloneSymbol = require__cloneSymbol();
	var cloneTypedArray = require__cloneTypedArray();
	/** `Object#toString` result references. */
	var boolTag = "[object Boolean]";
	var dateTag = "[object Date]";
	var mapTag = "[object Map]";
	var numberTag = "[object Number]";
	var regexpTag = "[object RegExp]";
	var setTag = "[object Set]";
	var stringTag = "[object String]";
	var symbolTag = "[object Symbol]";
	var arrayBufferTag = "[object ArrayBuffer]";
	var dataViewTag = "[object DataView]";
	var float32Tag = "[object Float32Array]";
	var float64Tag = "[object Float64Array]";
	var int8Tag = "[object Int8Array]";
	var int16Tag = "[object Int16Array]";
	var int32Tag = "[object Int32Array]";
	var uint8Tag = "[object Uint8Array]";
	var uint8ClampedTag = "[object Uint8ClampedArray]";
	var uint16Tag = "[object Uint16Array]";
	var uint32Tag = "[object Uint32Array]";
	/**
	* Initializes an object clone based on its `toStringTag`.
	*
	* **Note:** This function only supports cloning values with tags of
	* `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
	*
	* @private
	* @param {Object} object The object to clone.
	* @param {string} tag The `toStringTag` of the object to clone.
	* @param {boolean} [isDeep] Specify a deep clone.
	* @returns {Object} Returns the initialized clone.
	*/
	function initCloneByTag(object, tag, isDeep) {
		var Ctor = object.constructor;
		switch (tag) {
			case arrayBufferTag: return cloneArrayBuffer(object);
			case boolTag:
			case dateTag: return new Ctor(+object);
			case dataViewTag: return cloneDataView(object, isDeep);
			case float32Tag:
			case float64Tag:
			case int8Tag:
			case int16Tag:
			case int32Tag:
			case uint8Tag:
			case uint8ClampedTag:
			case uint16Tag:
			case uint32Tag: return cloneTypedArray(object, isDeep);
			case mapTag: return new Ctor();
			case numberTag:
			case stringTag: return new Ctor(object);
			case regexpTag: return cloneRegExp(object);
			case setTag: return new Ctor();
			case symbolTag: return cloneSymbol(object);
		}
	}
	module.exports = initCloneByTag;
}));
//#endregion
//#region node_modules/lodash/_baseCreate.js
var require__baseCreate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isObject = require_isObject();
	/** Built-in value references. */
	var objectCreate = Object.create;
	module.exports = function() {
		function object() {}
		return function(proto) {
			if (!isObject(proto)) return {};
			if (objectCreate) return objectCreate(proto);
			object.prototype = proto;
			var result = new object();
			object.prototype = void 0;
			return result;
		};
	}();
}));
//#endregion
//#region node_modules/lodash/_initCloneObject.js
var require__initCloneObject = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseCreate = require__baseCreate();
	var getPrototype = require__getPrototype();
	var isPrototype = require__isPrototype();
	/**
	* Initializes an object clone.
	*
	* @private
	* @param {Object} object The object to clone.
	* @returns {Object} Returns the initialized clone.
	*/
	function initCloneObject(object) {
		return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
	}
	module.exports = initCloneObject;
}));
//#endregion
//#region node_modules/lodash/_baseIsMap.js
var require__baseIsMap = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getTag = require__getTag();
	var isObjectLike = require_isObjectLike();
	/** `Object#toString` result references. */
	var mapTag = "[object Map]";
	/**
	* The base implementation of `_.isMap` without Node.js optimizations.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a map, else `false`.
	*/
	function baseIsMap(value) {
		return isObjectLike(value) && getTag(value) == mapTag;
	}
	module.exports = baseIsMap;
}));
//#endregion
//#region node_modules/lodash/isMap.js
var require_isMap = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseIsMap = require__baseIsMap();
	var baseUnary = require__baseUnary();
	var nodeUtil = require__nodeUtil();
	var nodeIsMap = nodeUtil && nodeUtil.isMap;
	module.exports = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;
}));
//#endregion
//#region node_modules/lodash/_baseIsSet.js
var require__baseIsSet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getTag = require__getTag();
	var isObjectLike = require_isObjectLike();
	/** `Object#toString` result references. */
	var setTag = "[object Set]";
	/**
	* The base implementation of `_.isSet` without Node.js optimizations.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a set, else `false`.
	*/
	function baseIsSet(value) {
		return isObjectLike(value) && getTag(value) == setTag;
	}
	module.exports = baseIsSet;
}));
//#endregion
//#region node_modules/lodash/isSet.js
var require_isSet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseIsSet = require__baseIsSet();
	var baseUnary = require__baseUnary();
	var nodeUtil = require__nodeUtil();
	var nodeIsSet = nodeUtil && nodeUtil.isSet;
	module.exports = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;
}));
//#endregion
//#region node_modules/lodash/_baseClone.js
var require__baseClone = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Stack = require__Stack();
	var arrayEach = require__arrayEach();
	var assignValue = require__assignValue();
	var baseAssign = require__baseAssign();
	var baseAssignIn = require__baseAssignIn();
	var cloneBuffer = require__cloneBuffer();
	var copyArray = require__copyArray();
	var copySymbols = require__copySymbols();
	var copySymbolsIn = require__copySymbolsIn();
	var getAllKeys = require__getAllKeys();
	var getAllKeysIn = require__getAllKeysIn();
	var getTag = require__getTag();
	var initCloneArray = require__initCloneArray();
	var initCloneByTag = require__initCloneByTag();
	var initCloneObject = require__initCloneObject();
	var isArray = require_isArray();
	var isBuffer = require_isBuffer();
	var isMap = require_isMap();
	var isObject = require_isObject();
	var isSet = require_isSet();
	var keys = require_keys();
	var keysIn = require_keysIn();
	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG = 1;
	var CLONE_FLAT_FLAG = 2;
	var CLONE_SYMBOLS_FLAG = 4;
	/** `Object#toString` result references. */
	var argsTag = "[object Arguments]";
	var arrayTag = "[object Array]";
	var boolTag = "[object Boolean]";
	var dateTag = "[object Date]";
	var errorTag = "[object Error]";
	var funcTag = "[object Function]";
	var genTag = "[object GeneratorFunction]";
	var mapTag = "[object Map]";
	var numberTag = "[object Number]";
	var objectTag = "[object Object]";
	var regexpTag = "[object RegExp]";
	var setTag = "[object Set]";
	var stringTag = "[object String]";
	var symbolTag = "[object Symbol]";
	var weakMapTag = "[object WeakMap]";
	var arrayBufferTag = "[object ArrayBuffer]";
	var dataViewTag = "[object DataView]";
	var float32Tag = "[object Float32Array]";
	var float64Tag = "[object Float64Array]";
	var int8Tag = "[object Int8Array]";
	var int16Tag = "[object Int16Array]";
	var int32Tag = "[object Int32Array]";
	var uint8Tag = "[object Uint8Array]";
	var uint8ClampedTag = "[object Uint8ClampedArray]";
	var uint16Tag = "[object Uint16Array]";
	var uint32Tag = "[object Uint32Array]";
	/** Used to identify `toStringTag` values supported by `_.clone`. */
	var cloneableTags = {};
	cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
	cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;
	/**
	* The base implementation of `_.clone` and `_.cloneDeep` which tracks
	* traversed objects.
	*
	* @private
	* @param {*} value The value to clone.
	* @param {boolean} bitmask The bitmask flags.
	*  1 - Deep clone
	*  2 - Flatten inherited properties
	*  4 - Clone symbols
	* @param {Function} [customizer] The function to customize cloning.
	* @param {string} [key] The key of `value`.
	* @param {Object} [object] The parent object of `value`.
	* @param {Object} [stack] Tracks traversed objects and their clone counterparts.
	* @returns {*} Returns the cloned value.
	*/
	function baseClone(value, bitmask, customizer, key, object, stack) {
		var result, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
		if (customizer) result = object ? customizer(value, key, object, stack) : customizer(value);
		if (result !== void 0) return result;
		if (!isObject(value)) return value;
		var isArr = isArray(value);
		if (isArr) {
			result = initCloneArray(value);
			if (!isDeep) return copyArray(value, result);
		} else {
			var tag = getTag(value), isFunc = tag == funcTag || tag == genTag;
			if (isBuffer(value)) return cloneBuffer(value, isDeep);
			if (tag == objectTag || tag == argsTag || isFunc && !object) {
				result = isFlat || isFunc ? {} : initCloneObject(value);
				if (!isDeep) return isFlat ? copySymbolsIn(value, baseAssignIn(result, value)) : copySymbols(value, baseAssign(result, value));
			} else {
				if (!cloneableTags[tag]) return object ? value : {};
				result = initCloneByTag(value, tag, isDeep);
			}
		}
		stack || (stack = new Stack());
		var stacked = stack.get(value);
		if (stacked) return stacked;
		stack.set(value, result);
		if (isSet(value)) value.forEach(function(subValue) {
			result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
		});
		else if (isMap(value)) value.forEach(function(subValue, key) {
			result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
		});
		var props = isArr ? void 0 : (isFull ? isFlat ? getAllKeysIn : getAllKeys : isFlat ? keysIn : keys)(value);
		arrayEach(props || value, function(subValue, key) {
			if (props) {
				key = subValue;
				subValue = value[key];
			}
			assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
		});
		return result;
	}
	module.exports = baseClone;
}));
//#endregion
//#region node_modules/lodash/cloneDeep.js
var require_cloneDeep = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseClone = require__baseClone();
	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG = 1;
	var CLONE_SYMBOLS_FLAG = 4;
	/**
	* This method is like `_.clone` except that it recursively clones `value`.
	*
	* @static
	* @memberOf _
	* @since 1.0.0
	* @category Lang
	* @param {*} value The value to recursively clone.
	* @returns {*} Returns the deep cloned value.
	* @see _.clone
	* @example
	*
	* var objects = [{ 'a': 1 }, { 'b': 2 }];
	*
	* var deep = _.cloneDeep(objects);
	* console.log(deep[0] === objects[0]);
	* // => false
	*/
	function cloneDeep(value) {
		return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
	}
	module.exports = cloneDeep;
}));
//#endregion
//#region source-snapshot/src/utils/memberPurchase.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var isMembershipCard = (item) => item?.isMembershipCard === true || item?.properties?.some((property) => property.name === "BENEFIT_CARD" && property.value === true) === true;
var getOrderItemCategory = (categories, item) => categories?.find((category) => category.id == (item.oCategoryId || item.categoryId)) || (isMembershipCard(item) ? item.membershipCategory : void 0);
var findMembershipProduct = (menus = []) => {
	for (const menu of menus) for (const group of menu.menuGroups || []) for (const category of group.menuCategories || []) {
		const product = category.saleItems?.find(isMembershipCard);
		if (product) return {
			product,
			category
		};
	}
	return null;
};
var buildMembershipCard = ({ product, category, privilege, userId }) => {
	const price = privilege?.paymentOptions?.[0]?.price;
	if (!product?.id || !isMembershipCard(product) || !privilege?._id || !userId) throw new Error("Membership card configuration is unavailable");
	if (price != null && (!Number.isFinite(price) || price < 0)) throw new Error("Membership card price is invalid");
	const { saleItems, ...pricingCategory } = category || {};
	const expiration = privilege.paymentOptions?.[0]?.expiration;
	return {
		...(0, import_cloneDeep.default)(product),
		isMembershipCard: true,
		membershipUserId: userId,
		privilegeId: privilege._id,
		...expiration == null ? {} : { expiration: (0, import_cloneDeep.default)(expiration) },
		membershipCategory: (0, import_cloneDeep.default)(pricingCategory),
		categoryId: category?.id ?? product.categoryId,
		price: price ?? 0,
		benefitPrice: void 0,
		itemPrices: [],
		sectionDetail: [],
		quantity: 1,
		hiddenItem: true,
		sendToKitchenRequired: false
	};
};
var hasPendingMembershipCard = (state) => state.crm?.isHasBenefit === true && !!state.crm?.memberCRMInfo?.userId && state.currentOrder?.itemList?.some((item) => isMembershipCard(item) && item.quantity === 1 && !!item.id && !!item.privilegeId && Number.isFinite(item.price) && item.price >= 0 && item.membershipUserId === state.crm.memberCRMInfo.userId) === true;
//#endregion
//#region source-snapshot/src/utils/menuStock.js
var hasStockDataMap = (data) => data && Object.keys(data).length > 0;
var stockIndexes = /* @__PURE__ */ new WeakMap();
var getStockItemId = (item) => item?.oId ?? item?.id;
var getAliases = (item) => [...new Set([item?.oId, item?.id].filter((id) => id != null).map((id) => `local:${id}`)), ...item?.cloudId != null ? [`cloud:${item.cloudId}`] : []];
/** 一个菜单版本只建立一次别名索引；传统、云端和兑换菜共享库存实体。 */
function getMenuStockIndex(menuItemList) {
	if (!menuItemList || typeof menuItemList !== "object") return null;
	if (stockIndexes.has(menuItemList)) return stockIndexes.get(menuItemList);
	const aliases = /* @__PURE__ */ new Map();
	const seen = /* @__PURE__ */ new Set();
	const root = (entity) => {
		if (entity.parent) entity.parent = root(entity.parent);
		return entity.parent || entity;
	};
	const visit = (item) => {
		if (!item || seen.has(item)) return;
		seen.add(item);
		const keys = getAliases(item);
		let entity;
		for (const key of keys) {
			const existing = aliases.get(key);
			if (!existing) continue;
			const other = root(existing);
			if (!entity) entity = other;
			else if (entity !== other) {
				other.parent = entity;
				if (!entity.stockItem || entity.stockItem.isFreeItem && !other.stockItem?.isFreeItem) entity.stockItem = other.stockItem || entity.stockItem;
			}
		}
		entity ||= { key: keys.find((key) => key.startsWith("cloud:")) || keys[0] };
		if (item.stockNum !== void 0 && (!entity.stockItem || entity.stockItem.isFreeItem && !item.isFreeItem)) entity.stockItem = item;
		entity.item ||= item;
		for (const key of keys) aliases.set(key, entity);
		for (const option of Object.values(item.options || {})) for (const child of Object.values(option?.subOptions || {})) visit(child);
	};
	Object.values(menuItemList).forEach(visit);
	const index = { find(item) {
		for (const key of getAliases(item)) {
			const entity = aliases.get(key);
			if (entity) return root(entity);
		}
	} };
	stockIndexes.set(menuItemList, index);
	return index;
}
function getStockItemKey(item, menuItemList) {
	return getMenuStockIndex(menuItemList)?.find(item)?.key || (item?.cloudId != null ? `cloud:${item.cloudId}` : getAliases(item)[0]);
}
function isSameStockItem(item, target, menuItemList) {
	if (!item || !target) return false;
	const index = getMenuStockIndex(menuItemList);
	const left = index?.find(item);
	const right = index?.find(target);
	if (left && right) return left === right;
	const targetAliases = getAliases(target);
	return getAliases(item).some((alias) => targetAliases.includes(alias));
}
function getIndexedStockItem(item, menuItemList) {
	const entity = getMenuStockIndex(menuItemList)?.find(item);
	return entity ? entity.stockItem || entity.item : void 0;
}
/**
* 从菜单接口响应中解析 menuGroups
*/
function getMenuGroupsFromMenuResponse(data) {
	const payload = data?.data ?? data;
	return (payload?.menus?.find((menu) => menu?.active === true) || payload?.KioskMenus?.find((menu) => menu?.active === true))?.menuGroups || [];
}
/**
* 获取菜单中所有售罄菜品的 id 和 name
*/
function getOutOfStockItems(menuGroups) {
	return (menuGroups || []).flatMap((group) => group?.menuCategories || []).flatMap((category) => category?.saleItems || []).filter((item) => item?.outOfStock).map(({ id, name }) => ({
		id,
		name
	}));
}
function getItemsWithStockNum(menuGroups) {
	return (menuGroups || []).flatMap((group) => group?.menuCategories || []).flatMap((category) => category?.saleItems || []).filter((item) => item?.stockNum !== void 0).map(({ id, oId, cloudId, name, stockNum }) => ({
		id: id ?? oId ?? cloudId,
		name,
		stockNum
	}));
}
/**
* 从含 stockNum 的菜单结构中构建 saleItemId -> stockNum 映射
*/
function buildStockNumMap(menuGroups) {
	const stockNumMap = {};
	if (!Array.isArray(menuGroups)) return stockNumMap;
	for (const group of menuGroups) for (const category of group.menuCategories || []) for (const item of category.saleItems || []) if (getAliases(item).length) {
		let stockData = {
			id: item.id,
			oId: item.oId,
			cloudId: item.cloudId,
			stockNum: item.stockNum
		};
		let optionStockData = void 0;
		for (const option of item.options || []) {
			let subOptionStockData = void 0;
			for (const subOption of option?.subOptions || []) if (option?.id != null && subOption?.id != null) subOptionStockData = {
				...subOptionStockData,
				[subOption.id]: {
					id: subOption.id,
					oId: subOption.oId,
					cloudId: subOption.cloudId,
					stockNum: subOption.stockNum
				}
			};
			if (subOptionStockData !== void 0) optionStockData = {
				...optionStockData,
				[option.id]: { subOptions: subOptionStockData }
			};
		}
		if (optionStockData !== void 0) stockData = {
			...stockData,
			options: optionStockData
		};
		if (stockData !== void 0) stockNumMap[item.id ?? getStockItemKey(item)] = stockData;
	}
	return stockNumMap;
}
function applyStockNumToSaleItems(saleItems, stockNumMap) {
	if (!Array.isArray(saleItems) || !stockNumMap) return saleItems;
	const updatedItems = saleItems.map((item) => {
		const stockData = getIndexedStockItem(item, stockNumMap);
		if (!stockData) return item;
		const optionSource = stockNumMap[getStockItemId(item)] || stockData;
		let options = item.options;
		if (item.options?.length && hasStockDataMap(optionSource.options)) {
			const nextOptions = item.options.map((option) => {
				const optionStockData = optionSource.options[option.id];
				if (!option.subOptions?.length || !optionStockData?.subOptions) return option;
				const subOptions = option.subOptions.map((child) => {
					const latest = optionStockData.subOptions[child.id];
					return latest && child.stockNum !== latest.stockNum ? {
						...child,
						stockNum: latest.stockNum
					} : child;
				});
				return subOptions.some((child, index) => child !== option.subOptions[index]) ? {
					...option,
					subOptions
				} : option;
			});
			if (nextOptions.some((option, index) => option !== item.options[index])) options = nextOptions;
		}
		const cloudId = stockData.cloudId ?? item.cloudId;
		return item.stockNum === stockData.stockNum && item.cloudId === cloudId && options === item.options ? item : {
			...item,
			stockNum: stockData.stockNum,
			cloudId,
			...options ? { options } : {}
		};
	});
	return updatedItems.some((item, index) => item !== saleItems[index]) ? updatedItems : saleItems;
}
/**
* 将 stockNum 合并进菜单组中的每个 saleItem
*/
function applyStockNumToMenuGroups(menuGroups, stockNumMap) {
	if (!Array.isArray(menuGroups) || !stockNumMap) return menuGroups;
	const groups = menuGroups.map((group) => {
		const categories = (group.menuCategories || []).map((category) => {
			const originalItems = category.saleItems || [];
			const saleItems = applyStockNumToSaleItems(originalItems, stockNumMap);
			return saleItems === originalItems ? category : {
				...category,
				saleItems
			};
		});
		return categories.some((category, index) => category !== group.menuCategories[index]) ? {
			...group,
			menuCategories: categories
		} : group;
	});
	return groups.some((group, index) => group !== menuGroups[index]) ? groups : menuGroups;
}
//#endregion
//#region source-snapshot/src/utils/layoutMetrics.js
var getLayoutScale = () => {
	const scale = Number(document.documentElement.getAttribute("data-layout-scale"));
	return scale > 0 && Number.isFinite(scale) ? scale : 1;
};
var getLayoutWidth = (cssWidth = window.innerWidth) => Math.max(0, Number(cssWidth) || 0) * getLayoutScale();
var getCardColumnCount = (cssWidth) => Math.max(1, Math.min(7, Math.floor(getLayoutWidth(cssWidth) / 300)));
var getCardColumnStyle = ({ count, widthRate }, index = 0) => ({
	flex: `0 0 ${widthRate}%`,
	maxWidth: `${widthRate}%`,
	minWidth: 0,
	marginRight: count > 1 && (index + 1) % count !== 0 ? `${Math.max(0, 100 - count * widthRate) / (count - 1)}%` : 0
});
var observeLayoutSize = (element, onChange) => {
	if (!element) return () => {};
	let previous = "";
	const measure = () => {
		const width = element.clientWidth;
		const signature = `${width}:${element.clientHeight}:${window.innerHeight}:${getLayoutScale()}`;
		if (width > 0 && signature !== previous) {
			previous = signature;
			onChange(width);
		}
	};
	const observer = window.ResizeObserver ? new window.ResizeObserver(measure) : null;
	observer?.observe(element);
	const timer = observer ? null : window.setInterval(measure, 250);
	window.addEventListener("resize", measure);
	window.addEventListener("orientationchange", measure);
	measure();
	return () => {
		observer?.disconnect();
		if (timer !== null) window.clearInterval(timer);
		window.removeEventListener("resize", measure);
		window.removeEventListener("orientationchange", measure);
	};
};
//#endregion
//#region source-snapshot/src/utils/formatNumberRounding/index.js
var precision = 2;
function floatNumberRounding(num) {
	var tempNum = parseFloat(num).toFixed(6);
	return Number(Math.round(tempNum + "e2") + "e-2").toFixed(precision);
}
//#endregion
//#region node_modules/big.js/big.mjs
/************************************** EDITABLE DEFAULTS *****************************************/
var DP = 20;
var RM = 1;
var MAX_DP = 1e6;
var MAX_POWER = 1e6;
var NE = -7;
var PE = 21;
var STRICT = false;
var NAME = "[big.js] ";
var INVALID = NAME + "Invalid ";
var INVALID_DP = INVALID + "decimal places";
var INVALID_RM = INVALID + "rounding mode";
var DIV_BY_ZERO = NAME + "Division by zero";
var P = {};
var UNDEFINED = void 0;
var NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
function _Big_() {
	function Big(n) {
		var x = this;
		if (!(x instanceof Big)) return n === UNDEFINED ? _Big_() : new Big(n);
		if (n instanceof Big) {
			x.s = n.s;
			x.e = n.e;
			x.c = n.c.slice();
		} else {
			if (typeof n !== "string") {
				if (Big.strict === true && typeof n !== "bigint") throw TypeError(INVALID + "value");
				n = n === 0 && 1 / n < 0 ? "-0" : String(n);
			}
			parse(x, n);
		}
		x.constructor = Big;
	}
	Big.prototype = P;
	Big.DP = DP;
	Big.RM = RM;
	Big.NE = NE;
	Big.PE = PE;
	Big.strict = STRICT;
	Big.roundDown = 0;
	Big.roundHalfUp = 1;
	Big.roundHalfEven = 2;
	Big.roundUp = 3;
	return Big;
}
function parse(x, n) {
	var e, i, nl;
	if (!NUMERIC.test(n)) throw Error(INVALID + "number");
	x.s = n.charAt(0) == "-" ? (n = n.slice(1), -1) : 1;
	if ((e = n.indexOf(".")) > -1) n = n.replace(".", "");
	if ((i = n.search(/e/i)) > 0) {
		if (e < 0) e = i;
		e += +n.slice(i + 1);
		n = n.substring(0, i);
	} else if (e < 0) e = n.length;
	nl = n.length;
	for (i = 0; i < nl && n.charAt(i) == "0";) ++i;
	if (i == nl) x.c = [x.e = 0];
	else {
		for (; nl > 0 && n.charAt(--nl) == "0";);
		x.e = e - i - 1;
		x.c = [];
		for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
	}
	return x;
}
function round(x, sd, rm, more) {
	var xc = x.c;
	if (rm === UNDEFINED) rm = x.constructor.RM;
	if (rm !== 0 && rm !== 1 && rm !== 2 && rm !== 3) throw Error(INVALID_RM);
	if (sd < 1) {
		more = rm === 3 && (more || !!xc[0]) || sd === 0 && (rm === 1 && xc[0] >= 5 || rm === 2 && (xc[0] > 5 || xc[0] === 5 && (more || xc[1] !== UNDEFINED)));
		xc.length = 1;
		if (more) {
			x.e = x.e - sd + 1;
			xc[0] = 1;
		} else xc[0] = x.e = 0;
	} else if (sd < xc.length) {
		more = rm === 1 && xc[sd] >= 5 || rm === 2 && (xc[sd] > 5 || xc[sd] === 5 && (more || xc[sd + 1] !== UNDEFINED || xc[sd - 1] & 1)) || rm === 3 && (more || !!xc[0]);
		xc.length = sd;
		if (more) for (; ++xc[--sd] > 9;) {
			xc[sd] = 0;
			if (sd === 0) {
				++x.e;
				xc.unshift(1);
				break;
			}
		}
		for (sd = xc.length; !xc[--sd];) xc.pop();
	}
	return x;
}
function stringify(x, doExponential, isNonzero) {
	var e = x.e, s = x.c.join(""), n = s.length;
	if (doExponential) s = s.charAt(0) + (n > 1 ? "." + s.slice(1) : "") + (e < 0 ? "e" : "e+") + e;
	else if (e < 0) {
		for (; ++e;) s = "0" + s;
		s = "0." + s;
	} else if (e > 0) {
		if (++e > n) for (e -= n; e--;) s += "0";
		else if (e < n) s = s.slice(0, e) + "." + s.slice(e);
	} else if (n > 1) s = s.charAt(0) + "." + s.slice(1);
	return x.s < 0 && isNonzero ? "-" + s : s;
}
P.abs = function() {
	var x = new this.constructor(this);
	x.s = 1;
	return x;
};
P.cmp = function(y) {
	var isneg, x = this, xc = x.c, yc = (y = new x.constructor(y)).c, i = x.s, j = y.s, k = x.e, l = y.e;
	if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;
	if (i != j) return i;
	isneg = i < 0;
	if (k != l) return k > l ^ isneg ? 1 : -1;
	j = (k = xc.length) < (l = yc.length) ? k : l;
	for (i = -1; ++i < j;) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
	return k == l ? 0 : k > l ^ isneg ? 1 : -1;
};
P.div = function(y) {
	var x = this, Big = x.constructor, a = x.c, b = (y = new Big(y)).c, k = x.s == y.s ? 1 : -1, dp = Big.DP;
	if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);
	if (!b[0]) throw Error(DIV_BY_ZERO);
	if (!a[0]) {
		y.s = k;
		y.c = [y.e = 0];
		return y;
	}
	var bl, bt, n, cmp, ri, bz = b.slice(), ai = bl = b.length, al = a.length, r = a.slice(0, bl), rl = r.length, q = y, qc = q.c = [], qi = 0, p = dp + (q.e = x.e - y.e) + 1;
	q.s = k;
	k = p < 0 ? 0 : p;
	bz.unshift(0);
	for (; rl++ < bl;) r.push(0);
	do {
		for (n = 0; n < 10; n++) {
			if (bl != (rl = r.length)) cmp = bl > rl ? 1 : -1;
			else for (ri = -1, cmp = 0; ++ri < bl;) if (b[ri] != r[ri]) {
				cmp = b[ri] > r[ri] ? 1 : -1;
				break;
			}
			if (cmp < 0) {
				for (bt = rl == bl ? b : bz; rl;) {
					if (r[--rl] < bt[rl]) {
						ri = rl;
						for (; ri && !r[--ri];) r[ri] = 9;
						--r[ri];
						r[rl] += 10;
					}
					r[rl] -= bt[rl];
				}
				for (; !r[0];) r.shift();
			} else break;
		}
		qc[qi++] = cmp ? n : ++n;
		if (r[0] && cmp) r[rl] = a[ai] || 0;
		else r = [a[ai]];
	} while ((ai++ < al || r[0] !== UNDEFINED) && k--);
	if (!qc[0] && qi != 1) {
		qc.shift();
		q.e--;
		p--;
	}
	if (qi > p) round(q, p, Big.RM, r[0] !== UNDEFINED);
	return q;
};
P.eq = function(y) {
	return this.cmp(y) === 0;
};
P.gt = function(y) {
	return this.cmp(y) > 0;
};
P.gte = function(y) {
	return this.cmp(y) > -1;
};
P.lt = function(y) {
	return this.cmp(y) < 0;
};
P.lte = function(y) {
	return this.cmp(y) < 1;
};
P.minus = P.sub = function(y) {
	var i, j, t, xlty, x = this, Big = x.constructor, a = x.s, b = (y = new Big(y)).s;
	if (a != b) {
		y.s = -b;
		return x.plus(y);
	}
	var xc = x.c.slice(), xe = x.e, yc = y.c, ye = y.e;
	if (!xc[0] || !yc[0]) {
		if (yc[0]) y.s = -b;
		else if (xc[0]) y = new Big(x);
		else y.s = 1;
		return y;
	}
	if (a = xe - ye) {
		if (xlty = a < 0) {
			a = -a;
			t = xc;
		} else {
			ye = xe;
			t = yc;
		}
		t.reverse();
		for (b = a; b--;) t.push(0);
		t.reverse();
	} else {
		j = ((xlty = xc.length < yc.length) ? xc : yc).length;
		for (a = b = 0; b < j; b++) if (xc[b] != yc[b]) {
			xlty = xc[b] < yc[b];
			break;
		}
	}
	if (xlty) {
		t = xc;
		xc = yc;
		yc = t;
		y.s = -y.s;
	}
	if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;
	for (b = i; j > a;) {
		if (xc[--j] < yc[j]) {
			for (i = j; i && !xc[--i];) xc[i] = 9;
			--xc[i];
			xc[j] += 10;
		}
		xc[j] -= yc[j];
	}
	for (; xc[--b] === 0;) xc.pop();
	for (; xc[0] === 0;) {
		xc.shift();
		--ye;
	}
	if (!xc[0]) {
		y.s = 1;
		xc = [ye = 0];
	}
	y.c = xc;
	y.e = ye;
	return y;
};
P.mod = function(y) {
	var ygtx, x = this, Big = x.constructor, a = x.s, b = (y = new Big(y)).s;
	if (!y.c[0]) throw Error(DIV_BY_ZERO);
	x.s = y.s = 1;
	ygtx = y.cmp(x) == 1;
	x.s = a;
	y.s = b;
	if (ygtx) return new Big(x);
	a = Big.DP;
	b = Big.RM;
	Big.DP = Big.RM = 0;
	x = x.div(y);
	Big.DP = a;
	Big.RM = b;
	return this.minus(x.times(y));
};
P.neg = function() {
	var x = new this.constructor(this);
	x.s = -x.s;
	return x;
};
P.plus = P.add = function(y) {
	var e, k, t, x = this, Big = x.constructor;
	y = new Big(y);
	if (x.s != y.s) {
		y.s = -y.s;
		return x.minus(y);
	}
	var xe = x.e, xc = x.c, ye = y.e, yc = y.c;
	if (!xc[0] || !yc[0]) {
		if (!yc[0]) if (xc[0]) y = new Big(x);
		else y.s = x.s;
		return y;
	}
	xc = xc.slice();
	if (e = xe - ye) {
		if (e > 0) {
			ye = xe;
			t = yc;
		} else {
			e = -e;
			t = xc;
		}
		t.reverse();
		for (; e--;) t.push(0);
		t.reverse();
	}
	if (xc.length - yc.length < 0) {
		t = yc;
		yc = xc;
		xc = t;
	}
	e = yc.length;
	for (k = 0; e; xc[e] %= 10) k = (xc[--e] = xc[e] + yc[e] + k) / 10 | 0;
	if (k) {
		xc.unshift(k);
		++ye;
	}
	for (e = xc.length; xc[--e] === 0;) xc.pop();
	y.c = xc;
	y.e = ye;
	return y;
};
P.pow = function(n) {
	var x = this, one = new x.constructor("1"), y = one, isneg = n < 0;
	if (n !== ~~n || n < -1e6 || n > MAX_POWER) throw Error(INVALID + "exponent");
	if (isneg) n = -n;
	for (;;) {
		if (n & 1) y = y.times(x);
		n >>= 1;
		if (!n) break;
		x = x.times(x);
	}
	return isneg ? one.div(y) : y;
};
P.prec = function(sd, rm) {
	if (sd !== ~~sd || sd < 1 || sd > MAX_DP) throw Error(INVALID + "precision");
	return round(new this.constructor(this), sd, rm);
};
P.round = function(dp, rm) {
	if (dp === UNDEFINED) dp = 0;
	else if (dp !== ~~dp || dp < -1e6 || dp > MAX_DP) throw Error(INVALID_DP);
	return round(new this.constructor(this), dp + this.e + 1, rm);
};
P.sqrt = function() {
	var r, c, t, x = this, Big = x.constructor, s = x.s, e = x.e, half = new Big("0.5");
	if (!x.c[0]) return new Big(x);
	if (s < 0) throw Error(NAME + "No square root");
	s = Math.sqrt(+stringify(x, true, true));
	if (s === 0 || s === Infinity) {
		c = x.c.join("");
		if (!(c.length + e & 1)) c += "0";
		s = Math.sqrt(c);
		e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
		r = new Big((s == Infinity ? "5e" : (s = s.toExponential()).slice(0, s.indexOf("e") + 1)) + e);
	} else r = new Big(s + "");
	e = r.e + (Big.DP += 4);
	do {
		t = r;
		r = half.times(t.plus(x.div(t)));
	} while (t.c.slice(0, e).join("") !== r.c.slice(0, e).join(""));
	return round(r, (Big.DP -= 4) + r.e + 1, Big.RM);
};
P.times = P.mul = function(y) {
	var c, x = this, Big = x.constructor, xc = x.c, yc = (y = new Big(y)).c, a = xc.length, b = yc.length, i = x.e, j = y.e;
	y.s = x.s == y.s ? 1 : -1;
	if (!xc[0] || !yc[0]) {
		y.c = [y.e = 0];
		return y;
	}
	y.e = i + j;
	if (a < b) {
		c = xc;
		xc = yc;
		yc = c;
		j = a;
		a = b;
		b = j;
	}
	for (c = new Array(j = a + b); j--;) c[j] = 0;
	for (i = b; i--;) {
		b = 0;
		for (j = a + i; j > i;) {
			b = c[j] + yc[i] * xc[j - i - 1] + b;
			c[j--] = b % 10;
			b = b / 10 | 0;
		}
		c[j] = b;
	}
	if (b) ++y.e;
	else c.shift();
	for (i = c.length; !c[--i];) c.pop();
	y.c = c;
	return y;
};
P.toExponential = function(dp, rm) {
	var x = this, n = x.c[0];
	if (dp !== UNDEFINED) {
		if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);
		x = round(new x.constructor(x), ++dp, rm);
		for (; x.c.length < dp;) x.c.push(0);
	}
	return stringify(x, true, !!n);
};
P.toFixed = function(dp, rm) {
	var x = this, n = x.c[0];
	if (dp !== UNDEFINED) {
		if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);
		x = round(new x.constructor(x), dp + x.e + 1, rm);
		for (dp = dp + x.e + 1; x.c.length < dp;) x.c.push(0);
	}
	return stringify(x, false, !!n);
};
P[Symbol.for("nodejs.util.inspect.custom")] = P.toJSON = P.toString = function() {
	var x = this, Big = x.constructor;
	return stringify(x, x.e <= Big.NE || x.e >= Big.PE, !!x.c[0]);
};
P.toNumber = function() {
	var n = +stringify(this, true, true);
	if (this.constructor.strict === true && !this.eq(n.toString())) throw Error(NAME + "Imprecise conversion");
	return n;
};
P.toPrecision = function(sd, rm) {
	var x = this, Big = x.constructor, n = x.c[0];
	if (sd !== UNDEFINED) {
		if (sd !== ~~sd || sd < 1 || sd > MAX_DP) throw Error(INVALID + "precision");
		x = round(new Big(x), sd, rm);
		for (; x.c.length < sd;) x.c.push(0);
	}
	return stringify(x, sd <= x.e || x.e <= Big.NE || x.e >= Big.PE, !!n);
};
P.valueOf = function() {
	var x = this, Big = x.constructor;
	if (Big.strict === true) throw Error(NAME + "valueOf disallowed");
	return stringify(x, x.e <= Big.NE || x.e >= Big.PE, true);
};
var Big = _Big_();
//#endregion
//#region source-snapshot/src/utils/priceCalculator/index.js
var getItemPrice = function(item) {
	let subTotal = Big(0);
	if (item.price) subTotal = subTotal.plus(Big(item.price));
	const sectionDetail = item.sectionDetail || item.selectedOptionList;
	if (sectionDetail && sectionDetail.length) sectionDetail.forEach((sct) => {
		if (sct.id == -1) subTotal = subTotal.plus(Big(sct.sizeInfo?.price || 0));
		if (sct.id == -2 || sct.id == -3) sct.options.length && sct.options.forEach((opt) => {
			subTotal = subTotal.plus(Big(opt.isFreeItem ? 0 : opt.price).times(opt.quantity));
		});
		if (sct.id > 0) sct.items.forEach((it) => {
			subTotal = subTotal.plus(Big(getItemPrice(it)).times(it.quantity));
		});
	});
	return Number(subTotal.toFixed(2) || 0);
};
//#endregion
//#region source-snapshot/src/utils/orderPricing/itemPricingBase.js
/**
* DP 开启时 itemPriceDetail 含 itemSubtotalDP，整单/税/加收等计价以之为基数；否则为基础菜价 itemSubtotal。
*/
function getItemPricingSubtotal(itemPriceDetail) {
	if (!itemPriceDetail) return 0;
	if (itemPriceDetail.itemSubtotalDP != null) return itemPriceDetail.itemSubtotalDP;
	return itemPriceDetail.itemSubtotal;
}
//#endregion
//#region source-snapshot/src/utils/orderPricing/discountChargeCalculator.js
var getOrderDiscountEligibleSubtotal = (itemInfoList) => itemInfoList.reduce((total, item) => {
	if (item.isSkipDiscount) return total;
	const detail = item.itemPriceDetail;
	return total + getItemPricingSubtotal(detail) - detail.itemDiscount + detail.itemCharge;
}, 0);
var DiscountChargeCalculator = class {
	itemDiscountChargeCalculator(itemInfo, orderInfo) {
		var itemSubtotal = 0;
		var itemCharge = 0;
		var itemDiscount = itemInfo.discount || 0;
		var itemOptionsPrice = 0;
		var isPromotion = itemInfo.isApplicablePromotion;
		var itemPromotion = 0;
		var itemDiscountInfo = itemInfo.discountObj;
		var itemChargeInfo = itemInfo.chargeObj;
		for (var i in itemInfo.options) {
			var itemSuboptPrice = 0;
			var optInfo = itemInfo.options[i];
			for (var j in optInfo.subOptions) {
				var subOptInfo = optInfo.subOptions[j];
				itemSuboptPrice += subOptInfo.optionPrice * subOptInfo.quantity;
			}
			itemOptionsPrice += (optInfo.optionPrice + itemSuboptPrice) * optInfo.quantity;
		}
		itemSubtotal += (itemInfo.itemPrice + itemOptionsPrice) * itemInfo.quantity;
		var itemSubtotalDP;
		if (orderInfo && typeof orderInfo.DPRate === "number" && !Number.isNaN(orderInfo.DPRate) && itemInfo.isCRMIntegrationFreeItem !== true) itemSubtotalDP = (itemInfo.itemPrice + itemOptionsPrice) * (1 + orderInfo.DPRate) * itemInfo.quantity;
		var pricingBase = itemSubtotalDP !== void 0 ? itemSubtotalDP : itemSubtotal;
		for (var i in itemDiscountInfo) {
			var discountInfo = itemDiscountInfo[i];
			if (!!discountInfo?.discountIsPer) itemDiscount += pricingBase * discountInfo.discountRate * itemInfo.quantity;
			else itemDiscount += discountInfo.discount * itemInfo.quantity;
		}
		for (var i in itemChargeInfo) {
			var chargeInfo = itemChargeInfo[i];
			if (chargeInfo?.chargeIsPer) itemCharge += pricingBase * chargeInfo.chargeRate * itemInfo.quantity;
			else itemCharge += chargeInfo.charge * itemInfo.quantity;
		}
		if (!!isPromotion) itemPromotion += pricingBase - itemDiscount + itemCharge;
		itemInfo.itemPriceDetail = {
			itemSubtotal,
			itemDiscount,
			itemCharge,
			itemPromotion,
			...itemSubtotalDP !== void 0 ? { itemSubtotalDP } : {}
		};
	}
	addOrderDiscountInfo2Item(orderInfo, itemInfo, orderSubtotal, orderTotalDiscount) {
		var orderDiscountObj = orderInfo.discountObj;
		var priceDetail = itemInfo.itemPriceDetail;
		var itemTotalPrice = getItemPricingSubtotal(priceDetail) - priceDetail.itemDiscount + priceDetail.itemCharge;
		var orderDiscount = 0;
		for (var i in orderDiscountObj) if (!!orderDiscountObj[i].discountIsPer) {
			if (!itemInfo.isSkipDiscount) orderDiscount += itemTotalPrice * orderDiscountObj[i].discountRate;
		} else if (!itemInfo.isSkipDiscount) {
			if (orderSubtotal > 0) orderDiscount += itemTotalPrice / orderSubtotal * orderDiscountObj[i].discount;
		}
		priceDetail.orderDiscount = orderDiscount;
		orderTotalDiscount += orderDiscount;
		return orderTotalDiscount;
	}
	addOrderChargeInfo2Item(orderInfo, itemInfo, orderSubtotal, orderTotalCharge) {
		var orderChargeObj = orderInfo.chargeObj;
		var priceDetail = itemInfo.itemPriceDetail;
		var itemTotalPrice = getItemPricingSubtotal(priceDetail) - priceDetail.itemDiscount + priceDetail.itemCharge;
		var orderCharge = 0;
		for (var i in orderChargeObj) if (!!orderChargeObj[i].chargeIsPer) orderCharge += itemTotalPrice * orderChargeObj[i].chargeRate;
		else if (orderSubtotal > 0) orderCharge += itemTotalPrice / orderSubtotal * orderChargeObj[i].charge;
		priceDetail.orderCharge = orderCharge;
		orderTotalCharge += orderCharge;
		return orderTotalCharge;
	}
	orderDiscountChargeCalculator(orderInfo, orderSubtotal) {
		var orderDiscountObj = orderInfo.discountObj;
		var orderChargeObj = orderInfo.chargeObj;
		var orderDiscount = 0;
		var orderCharge = 0;
		for (var i in orderDiscountObj) {
			var discountInfo = orderDiscountObj[i];
			if (!!discountInfo.discountIsPer) orderDiscount += orderSubtotal * discountInfo.discountRate;
			else orderDiscount += discountInfo.discount;
		}
		for (var i in orderChargeObj) {
			var chargeInfo = orderChargeObj[i];
			if (!!chargeInfo.chargeIsPer) orderCharge += orderSubtotal * chargeInfo.chargeRate;
			else orderCharge += chargeInfo.charge;
		}
		return {
			orderDiscount,
			orderCharge
		};
	}
};
//#endregion
//#region source-snapshot/src/utils/orderPricing/orderPricing.js
var OrderPricing = class {
	constructor(discountChargeCalculator, taxCalculator, chargeDetail, togoTaxDetail) {
		this.discountChargeCalculator = discountChargeCalculator;
		this.taxCalculator = taxCalculator;
		this.chargeDetail = chargeDetail;
		this.togoTaxDetail = togoTaxDetail;
	}
	floatNumberRounding(num, precision) {
		var tempNum = parseFloat(num).toFixed(precision + 4);
		return Number(Math.round(tempNum + "e" + precision) + "e-" + precision);
	}
	orderDetailPrice(orderInfo) {
		var itemInfoList = this.getItemInfoListFromOrderInfo(orderInfo);
		var result = this._computeOrderDetailPrice(orderInfo, itemInfoList);
		if (orderInfo?.DPRate && typeof orderInfo.DPRate === "number" && !Number.isNaN(orderInfo.DPRate)) result.orderDetailAfterDp = this._computeOrderDetailPrice(orderInfo, itemInfoList);
		return result;
	}
	_computeOrderDetailPrice(orderInfo, itemInfoList) {
		var orderSubtotalPromotion = this.getOrderSubtotalPromotionDetail(orderInfo, itemInfoList);
		var orderTaxDiscountChargeDetail = this.getOrderTaxDiscountChargeDetail(orderInfo, itemInfoList, orderSubtotalPromotion.orderSubtotal);
		let chargeTotal = this.chargeDetail ? this.chargeDetail.getChargeDetail(itemInfoList) : 0;
		let togoTotal = this.togoTaxDetail ? this.togoTaxDetail.getTogoTotal(itemInfoList) : 0;
		var orderTotalTips = this.floatNumberRounding(orderInfo.totalTips, 2);
		var orderTaxDetail = orderTaxDiscountChargeDetail.orderTaxDetail;
		var orderTaxTotal = 0;
		for (var i in orderTaxDetail) {
			orderTaxDetail[i].taxAmount = this.floatNumberRounding(orderTaxDetail[i].taxAmount, 2);
			orderTaxTotal += orderTaxDetail[i].taxAmount;
		}
		orderTaxTotal = this.floatNumberRounding(orderTaxTotal, 2);
		var orderOriginalTotal = orderSubtotalPromotion.orderSubtotal + orderTaxDiscountChargeDetail.orderCharge + orderTotalTips + orderTaxTotal - orderTaxDiscountChargeDetail.orderDiscount;
		orderOriginalTotal = this.floatNumberRounding(orderOriginalTotal, 2);
		var rounding;
		if (orderInfo.roundingStrategy == "NEAREST_5_CENTS") rounding = this.floatNumberRounding(orderOriginalTotal * 1e4 % 500 / 1e4, 2);
		else if (orderInfo.roundingStrategy == "NEAREST_10_CENTS") rounding = this.floatNumberRounding(orderOriginalTotal * 1e4 % 1e3 / 1e4, 2);
		else rounding = 0;
		var orderTotal = this.floatNumberRounding(orderOriginalTotal - rounding, 2);
		return {
			orderSubtotal: orderSubtotalPromotion.orderSubtotal,
			orderPromotion: orderSubtotalPromotion.orderPromotion,
			orderDiscount: orderTaxDiscountChargeDetail.orderDiscount,
			orderCharge: orderTaxDiscountChargeDetail.orderCharge,
			orderTotalTips,
			orderTaxDetail,
			orderTaxTotal,
			orderOriginalTotal,
			rounding,
			orderTotal,
			chargeTotal,
			togoTotal
		};
	}
	getItemInfoListFromOrderInfo(orderInfo) {
		var itemInfoList = [];
		for (var i in orderInfo.itemInfoList) itemInfoList.push(orderInfo.itemInfoList[i]);
		if (orderInfo.parentOrder != void 0 && orderInfo.parentOrder.itemInfoList != void 0) {
			var suborderNum = orderInfo.parentOrder.suborderNum;
			for (var j in orderInfo.parentOrder.itemInfoList) {
				var thisItemInfo = orderInfo.parentOrder.itemInfoList[j];
				thisItemInfo.quantity = this.floatNumberRounding(thisItemInfo.quantity / suborderNum, 4);
				itemInfoList.push(thisItemInfo);
			}
		}
		return itemInfoList;
	}
	getOrderSubtotalPromotionDetail(orderInfo, itemInfoList) {
		var orderSubtotal = 0;
		var orderPromotion = 0;
		for (var i in itemInfoList) {
			var thisItemInfo = itemInfoList[i];
			this.discountChargeCalculator.itemDiscountChargeCalculator(thisItemInfo, orderInfo);
			var itemPriceDetail = thisItemInfo.itemPriceDetail;
			orderSubtotal += this.floatNumberRounding(getItemPricingSubtotal(itemPriceDetail) + itemPriceDetail.itemCharge - itemPriceDetail.itemDiscount, 2);
			orderPromotion += this.floatNumberRounding(itemPriceDetail.itemPromotion, 2);
		}
		return {
			orderSubtotal: this.floatNumberRounding(orderSubtotal, 2),
			orderPromotion: this.floatNumberRounding(orderPromotion, 2)
		};
	}
	getOrderTaxDiscountChargeDetail(orderInfo, itemInfoList, orderSubtotal) {
		let chargeDetailMap = {};
		var orderTaxDetail = {};
		var orderDiscount = orderInfo.discount || 0;
		var orderCharge = 0;
		const discountEligibleSubtotal = getOrderDiscountEligibleSubtotal(itemInfoList);
		if (!!orderInfo.isTaxExempt) for (var i in itemInfoList) {
			orderDiscount = this.discountChargeCalculator.addOrderDiscountInfo2Item(orderInfo, itemInfoList[i], discountEligibleSubtotal, orderDiscount);
			orderCharge = this.discountChargeCalculator.addOrderChargeInfo2Item(orderInfo, itemInfoList[i], orderSubtotal, orderCharge);
		}
		else {
			for (var i in itemInfoList) {
				orderDiscount = this.discountChargeCalculator.addOrderDiscountInfo2Item(orderInfo, itemInfoList[i], discountEligibleSubtotal, orderDiscount);
				orderCharge = this.discountChargeCalculator.addOrderChargeInfo2Item(orderInfo, itemInfoList[i], orderSubtotal, orderCharge);
				this.taxCalculator.itemSalesTaxCalculation(itemInfoList[i]);
				orderTaxDetail = this.taxCalculator.orderTaxDetailAccumulation(itemInfoList[i], orderTaxDetail);
				if (this.chargeDetail && this.chargeDetail.getIsCalcChargeTax()) chargeDetailMap = this.chargeDetail.chargeTaxDetailAccumulation(itemInfoList[i], chargeDetailMap, itemInfoList);
			}
			orderTaxDetail = this.taxCalculator.orderSalesTaxCalculation(orderInfo, orderTaxDetail);
			if (JSON.stringify(chargeDetailMap) !== "{}") {
				for (let key in orderTaxDetail) for (let c in chargeDetailMap) if (key === c) {
					let t = orderTaxDetail[key].taxAmount + chargeDetailMap[key].subChargeTax;
					orderTaxDetail[key].taxAmount = t;
					break;
				}
			}
			if (this.togoTaxDetail && this.togoTaxDetail.getIsCalcTogoTax()) {
				let togoDetailMap = this.togoTaxDetail.togoTaxDetailAccumulation(itemInfoList);
				for (let key in orderTaxDetail) for (let c in togoDetailMap) if (key === c) {
					let t = orderTaxDetail[key].taxAmount + togoDetailMap[key].togoTax;
					orderTaxDetail[key].taxAmount = t;
					break;
				}
			}
		}
		return {
			orderDiscount: this.floatNumberRounding(orderDiscount, 2),
			orderCharge: this.floatNumberRounding(orderCharge, 2),
			orderTaxDetail
		};
	}
};
//#endregion
//#region source-snapshot/src/utils/orderPricing/salesTaxCalculator.js
var SalesTaxCalculator = class {
	floatNumberRounding(num, precision) {
		var tempNum = parseFloat(num).toFixed(precision + 4);
		return Number(Math.round(tempNum + "e" + precision) + "e-" + precision);
	}
	initObjBasicPriceInfo(thisObj) {
		thisObj.subTotal = 0;
		thisObj.itemDiscount = 0;
		thisObj.itemCharge = 0;
		thisObj.orderDiscount = 0;
		thisObj.orderCharge = 0;
		return thisObj;
	}
	accumulateObjBasicPriceInfo(thisObj, priceInfo) {
		thisObj.itemDiscount += priceInfo.itemDiscount;
		thisObj.itemCharge += priceInfo.itemCharge;
		thisObj.orderDiscount += priceInfo.orderDiscount;
		thisObj.orderCharge += priceInfo.orderCharge;
		return thisObj;
	}
	itemSalesTaxDetailCalculation(itemInfo, itemTaxDetail, itemTaxObj) {
		var taxId = itemTaxObj.taxId;
		itemTaxDetail[taxId] = {};
		itemTaxDetail[taxId].subTotal = getItemPricingSubtotal(itemInfo.itemPriceDetail);
		itemTaxDetail[taxId].itemDiscount = itemInfo.itemPriceDetail.itemDiscount;
		itemTaxDetail[taxId].itemCharge = itemInfo.itemPriceDetail.itemCharge;
		itemTaxDetail[taxId].orderDiscount = itemInfo.itemPriceDetail.orderDiscount;
		itemTaxDetail[taxId].orderCharge = itemInfo.itemPriceDetail.orderCharge;
		itemTaxDetail[taxId].taxRate = itemTaxObj.taxRate;
		itemTaxDetail[taxId].taxName = itemTaxObj.taxName;
		itemTaxDetail[taxId].isSkipDiscount = itemInfo.isSkipDiscount;
		itemTaxDetail[taxId].takeoutTaxFree = itemTaxObj.extraInfo.takeoutTaxFree;
		return itemTaxDetail;
	}
	itemSalesTaxCalculation(itemInfo) {
		var itemTaxDetail = {};
		var itemTaxObj = itemInfo.taxObj;
		for (var i in itemTaxObj) this.itemSalesTaxDetailCalculation(itemInfo, itemTaxDetail, itemTaxObj[i]);
		itemInfo.itemPriceDetail.itemTaxDetail = itemTaxDetail;
	}
	orderTaxDetailCalculation(orderTaxDetail, itemTaxDetailInfo) {
		if (orderTaxDetail == void 0) {
			orderTaxDetail = {};
			orderTaxDetail = this.initObjBasicPriceInfo(orderTaxDetail);
			orderTaxDetail.taxRate = itemTaxDetailInfo.taxRate;
			orderTaxDetail.taxName = itemTaxDetailInfo.taxName;
			orderTaxDetail.takeoutTaxFree = itemTaxDetailInfo.takeoutTaxFree;
		}
		if (!itemTaxDetailInfo.takeoutTaxFree) {
			this.accumulateObjBasicPriceInfo(orderTaxDetail, itemTaxDetailInfo);
			orderTaxDetail.subTotal += itemTaxDetailInfo.subTotal;
			orderTaxDetail.takeoutTaxFree = false;
		}
		return orderTaxDetail;
	}
	orderTaxDetailAccumulation(itemInfo, orderTaxDetail) {
		var itemTaxDetail = itemInfo.itemPriceDetail.itemTaxDetail;
		for (var i in itemTaxDetail) orderTaxDetail[i] = this.orderTaxDetailCalculation(orderTaxDetail[i], itemTaxDetail[i]);
		return orderTaxDetail;
	}
	discountCharge4OrderTaxCalculation(orderTaxDetail, isTaxWithDiscount, isTaxWithCharge) {
		if (!!isTaxWithDiscount) var discount = orderTaxDetail.itemDiscount + orderTaxDetail.orderDiscount;
		else var discount = 0;
		if (!!isTaxWithCharge) var charge = orderTaxDetail.itemCharge + orderTaxDetail.orderCharge;
		else var charge = 0;
		return {
			discount,
			charge
		};
	}
	orderSalesTaxCalculation(orderInfo, orderTaxDetail) {
		var newOrderTaxDetail = {};
		var isTaxWithDiscount = orderInfo.isTaxWithDiscount;
		var isTaxWithCharge = orderInfo.isTaxWithCharge;
		for (var i in orderTaxDetail) {
			var taxRate = orderTaxDetail[i].taxRate;
			var taxName = orderTaxDetail[i].taxName;
			var takeoutTaxFree = orderTaxDetail[i].takeoutTaxFree;
			var discountChargeInfo = this.discountCharge4OrderTaxCalculation(orderTaxDetail[i], isTaxWithDiscount, isTaxWithCharge);
			newOrderTaxDetail[i] = {};
			newOrderTaxDetail[i].taxName = taxName;
			newOrderTaxDetail[i].taxRate = taxRate;
			if (takeoutTaxFree) newOrderTaxDetail[i].taxAmount = 0;
			else {
				var baseAmount = this.floatNumberRounding(orderTaxDetail[i].subTotal - discountChargeInfo.discount + discountChargeInfo.charge, 2);
				newOrderTaxDetail[i].taxAmount = baseAmount * taxRate;
			}
		}
		return newOrderTaxDetail;
	}
};
//#endregion
//#region source-snapshot/src/utils/orderPricing/CanadaOntarioTaxCalculator.js
var CanadaOntarioTaxCalculator = class extends SalesTaxCalculator {
	constructor() {
		super();
	}
	itemSalesExtraTaxInfoCalculation(itemTaxDetail, itemTaxObj) {
		var taxId = itemTaxObj.taxId;
		itemTaxDetail[taxId].isTaxIncrease = itemTaxObj.extraInfo.isTaxIncrease;
		itemTaxDetail[taxId].priceThreshold = itemTaxObj.extraInfo.priceThreshold;
		itemTaxDetail[taxId].taxIncreaseRate = itemTaxObj.extraInfo.taxIncreaseRate;
	}
	itemSalesTaxCalculation(itemInfo) {
		var itemTaxDetail = {};
		var itemTaxObj = itemInfo.taxObj;
		for (var i in itemTaxObj) {
			itemTaxDetail = super.itemSalesTaxDetailCalculation(itemInfo, itemTaxDetail, itemTaxObj[i]);
			this.itemSalesExtraTaxInfoCalculation(itemTaxDetail, itemTaxObj[i]);
		}
		itemInfo.itemPriceDetail.itemTaxDetail = itemTaxDetail;
	}
	orderExtraTaxInfoCalculation(orderTaxDetail, itemTaxDetailInfo) {
		orderTaxDetail.isTaxIncrease = itemTaxDetailInfo.isTaxIncrease;
		orderTaxDetail.taxIncreaseRate = itemTaxDetailInfo.taxIncreaseRate;
		orderTaxDetail.priceThreshold = itemTaxDetailInfo.priceThreshold;
	}
	orderTaxDetailAccumulation(itemInfo, orderTaxDetail) {
		if (orderTaxDetail.taxDetail == void 0) orderTaxDetail.taxDetail = {};
		if (orderTaxDetail.taxListByCategory == void 0) orderTaxDetail.taxListByCategory = {};
		var taxDetail = orderTaxDetail.taxDetail;
		var taxListByCategory = orderTaxDetail.taxListByCategory;
		var itemTaxDetail = itemInfo.itemPriceDetail.itemTaxDetail;
		var taxIdList = [];
		for (var i in itemTaxDetail) {
			taxIdList.push(i);
			taxDetail[i] = super.orderTaxDetailCalculation(taxDetail[i], itemTaxDetail[i]);
			this.orderExtraTaxInfoCalculation(taxDetail[i], itemTaxDetail[i]);
		}
		if (!!itemInfo.extraInfo.isQuantityRule) {
			var cid = itemInfo.extraInfo.categoryId;
			if (taxListByCategory[cid] == void 0) {
				taxListByCategory[cid] = {};
				taxListByCategory[cid] = super.initObjBasicPriceInfo(taxListByCategory[cid]);
				taxListByCategory[cid].quantity = 0;
				taxListByCategory[cid].taxId = taxIdList;
				taxListByCategory[cid].quantityThreshold = itemInfo.extraInfo.quantityThreshold;
			}
			taxListByCategory[cid] = super.accumulateObjBasicPriceInfo(taxListByCategory[cid], itemInfo.itemPriceDetail);
			taxListByCategory[cid].subTotal += getItemPricingSubtotal(itemInfo.itemPriceDetail);
			taxListByCategory[cid].quantity += itemInfo.quantity;
		}
		return orderTaxDetail;
	}
	orderSalesTaxCalculation(orderInfo, orderTaxDetail) {
		var newOrderTaxDetail = {};
		var taxDetail = orderTaxDetail.taxDetail;
		var taxListByCategory = orderTaxDetail.taxListByCategory;
		var isTaxWithDiscount = orderInfo.isTaxWithDiscount;
		var isTaxWithCharge = orderInfo.isTaxWithCharge;
		for (var i in taxListByCategory) if (taxListByCategory[i].quantity > taxListByCategory[i].quantityThreshold) {
			var taxIdList = taxListByCategory[i].taxId;
			for (var j in taxIdList) {
				taxDetail[taxIdList[j]].subTotal -= taxListByCategory[i].subTotal;
				taxDetail[taxIdList[j]].itemDiscount -= taxListByCategory[i].itemDiscount;
				taxDetail[taxIdList[j]].itemCharge -= taxListByCategory[i].itemCharge;
				taxDetail[taxIdList[j]].orderDiscount -= taxListByCategory[i].orderDiscount;
				taxDetail[taxIdList[j]].orderCharge -= taxListByCategory[i].orderCharge;
			}
		}
		for (var i in taxDetail) {
			var taxRate = taxDetail[i].taxRate;
			var takeoutTaxFree = taxDetail[i].takeoutTaxFree;
			var discountChargeInfo = super.discountCharge4OrderTaxCalculation(taxDetail[i], isTaxWithDiscount, isTaxWithCharge);
			newOrderTaxDetail[i] = {};
			newOrderTaxDetail[i].taxName = taxDetail[i].taxName;
			if (takeoutTaxFree) newOrderTaxDetail[i].taxAmount = 0;
			else {
				var total = taxDetail[i].subTotal - discountChargeInfo.discount + discountChargeInfo.charge;
				if (taxDetail[i].isTaxIncrease && total > taxDetail[i].priceThreshold) taxRate += taxDetail[i].taxIncreaseRate;
				newOrderTaxDetail[i].taxAmount = total * taxRate;
			}
		}
		return newOrderTaxDetail;
	}
};
//#endregion
//#region source-snapshot/src/utils/orderPricing/wholeOrderCharge.js
/**
* 整单加收的税（是否算税，systemConfig.IS_CHARGE_TAX.booleanValue）
*
* 计算规则：A菜(税：0.1, 0.2)
*          B菜(税：0.2, 0.3)
*
* 类型一：当 ratetype == 2 是百分比例 (charge = subTotal * chargeRate)
* A菜的加收：chargeA = subTotalA * chargeRate
* B菜的加收：chargeB = subTotalB * chargeRate
*
* A菜的加收税：chargeA * 0.1 + chargeA * 0.2
* B菜的加收税：chargeB * 0.2 + chargeB * 0.3
*
*
* 类型二：当 ratetype == 1 是固定金额，（tip：菜的税计算规则类似togo加收税的规则）
* A和B菜的加收：固定金额
*
* 先计算每个菜占比：
* rateA：subTotalA / (subTotalA + subTotalB)
* rateB：subTotalB / (subTotalA + subTotalB)
*
* A菜的加收税：50 * rateA * 0.1 + 50 * rateA * 0.2
* B菜的加收税：50 * rateB * 0.2 + 50 * rateB * 0.3
*
*/
var WholeOrderCharge = class {
	constructor(ratetype, rate, isCalcChargeTax, noNeedChargeAmount) {
		this.ratetype = ratetype;
		if (ratetype == 1) this.rate = rate;
		else if (this.ratetype == 2) this.rate = Big(rate).div(100).toNumber();
		this.isCalcChargeTax = isCalcChargeTax;
		this.noNeedChargeAmount = noNeedChargeAmount;
	}
	getIsCalcChargeTax() {
		return this.isCalcChargeTax;
	}
	getChargeableTotal(itemInfoList) {
		const total = this.getTotal(itemInfoList);
		const noNeedChargeAmount = Number(this.noNeedChargeAmount || 0);
		return Math.max(Big(total).minus(noNeedChargeAmount).toNumber(), 0);
	}
	getTotal(itemInfoList) {
		let total = 0;
		if (itemInfoList?.length) itemInfoList.forEach((item) => {
			total = Big(total).plus(getItemPricingSubtotal(item.itemPriceDetail)).toNumber();
		});
		return total;
	}
	getChargeDetail(itemInfoList) {
		if (this.ratetype == 1) return this.rate;
		else if (this.ratetype == 2) return Big(this.getChargeableTotal(itemInfoList)).times(this.rate).toNumber();
	}
	chargeTaxDetailAccumulation(itemInfo, orderTaxDetail, itemInfoList) {
		let itemTaxDetail = itemInfo.itemPriceDetail.itemTaxDetail;
		if (this.ratetype == 1) {
			let total = this.getTotal(itemInfoList);
			for (let i in itemTaxDetail) {
				let subChargeTax = Big(itemTaxDetail[i].subTotal).div(total).times(itemTaxDetail[i].taxRate).times(this.rate).toNumber();
				if (orderTaxDetail[i]) orderTaxDetail[i] = { subChargeTax: Big(orderTaxDetail[i].subChargeTax).plus(subChargeTax).toNumber() };
				else orderTaxDetail[i] = { subChargeTax };
			}
			return orderTaxDetail;
		} else if (this.ratetype == 2) {
			let total = this.getTotal(itemInfoList);
			let chargeableTotal = this.getChargeableTotal(itemInfoList);
			let chargeableRatio = total > 0 ? Big(chargeableTotal).div(total).toNumber() : 0;
			for (let i in itemTaxDetail) {
				let subChargeTax = Big(Big(itemTaxDetail[i].subTotal).times(chargeableRatio).times(this.rate).toNumber()).times(itemTaxDetail[i].taxRate).toNumber();
				if (orderTaxDetail[i]) orderTaxDetail[i] = { subChargeTax: Big(orderTaxDetail[i].subChargeTax).plus(subChargeTax).toNumber() };
				else orderTaxDetail[i] = { subChargeTax };
			}
			return orderTaxDetail;
		}
	}
};
//#endregion
//#region node_modules/uuid/dist/esm-browser/rng.js
var getRandomValues;
var rnds8 = /* @__PURE__ */ new Uint8Array(16);
function rng() {
	if (!getRandomValues) {
		getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
		if (!getRandomValues) throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
	}
	return getRandomValues(rnds8);
}
//#endregion
//#region node_modules/uuid/dist/esm-browser/stringify.js
/**
* Convert array of 16 byte values to UUID string format of the form:
* XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
*/
var byteToHex = [];
for (let i = 0; i < 256; ++i) byteToHex.push((i + 256).toString(16).slice(1));
function unsafeStringify(arr, offset = 0) {
	return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}
var native_default = { randomUUID: typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto) };
//#endregion
//#region node_modules/uuid/dist/esm-browser/v4.js
function v4(options, buf, offset) {
	if (native_default.randomUUID && !buf && !options) return native_default.randomUUID();
	options = options || {};
	const rnds = options.random || (options.rng || rng)();
	rnds[6] = rnds[6] & 15 | 64;
	rnds[8] = rnds[8] & 63 | 128;
	if (buf) {
		offset = offset || 0;
		for (let i = 0; i < 16; ++i) buf[offset + i] = rnds[i];
		return buf;
	}
	return unsafeStringify(rnds);
}
//#endregion
//#region source-snapshot/src/constants/promotion.js
var GIFT_PROMOTION_TYPE = ["amountGiftItem", "orderItemGiftItem"];
var ITEM_SELECTION_PROMOTION_TYPES = [...GIFT_PROMOTION_TYPE, "orderItemFixedPrice"];
var RECOMMEND_SUCCESS_TYPE = [
	"REACHED_SELECT_ITEMS",
	"REACHED_RECOMMEND",
	"NONE"
];
var GIFT_PROMOTION_INVALID_TYPE = ["AMOUNT_TO_DISCOUNT", "QUANTITY_TO_DISCOUNT"];
//#endregion
//#region source-snapshot/src/constants/order.js
var ORDER_TYPE = {
	DINE_IN: "DINE_IN",
	ALL: "ALL",
	TO_GO: "TOGO",
	PICK_UP: "PICKUP"
};
//#endregion
//#region source-snapshot/src/utils/promotionItemFilter.js
var sameId = (left, right) => left != null && right != null && String(left) === String(right);
var getIdKey = (id) => id == null ? null : String(id);
var scopePromotionItemFilter = (filter, { merchantId, productLine = "KIOSK" } = {}) => {
	if (!filter || filter.source === "itemCenter") return filter;
	const value = [];
	const itemIndexes = /* @__PURE__ */ new Map();
	const categoryIndexes = /* @__PURE__ */ new Map();
	(filter.value || []).filter((entry) => entry.productLine === productLine && sameId(entry.merchantId, merchantId)).forEach((entry) => {
		const byItem = entry.itemId != null;
		const indexes = byItem ? itemIndexes : categoryIndexes;
		const key = getIdKey(byItem ? entry.itemId : entry.categoryId);
		const index = key === null ? void 0 : indexes.get(key);
		if (index === void 0) {
			if (key !== null) indexes.set(key, value.length);
			value.push(entry);
			return;
		}
		const previous = value[index];
		value[index] = {
			...previous,
			sizeList: !previous.sizeList?.length || !entry.sizeList?.length ? [] : [...previous.sizeList, ...entry.sizeList.filter((size) => !previous.sizeList.some((other) => sameId(other.sizeId, size.sizeId)))]
		};
	});
	return {
		...filter,
		value
	};
};
var normalizePromotionRule = (rule, context) => {
	const expression = rule?.ruleExpression;
	if (!expression) return rule;
	const scopeCondition = (condition) => condition?.itemFilter ? {
		...condition,
		itemFilter: scopePromotionItemFilter(condition.itemFilter, context)
	} : condition;
	return {
		...rule,
		ruleExpression: {
			...expression,
			condition: scopeCondition(expression.condition),
			benefits: expression.benefits?.map((benefit) => ({
				...benefit,
				condition: scopeCondition(benefit.condition),
				actions: benefit.actions?.map((action) => scopeCondition(action))
			}))
		}
	};
};
var isPromotionItemMatched = (item, entry) => {
	if (entry.itemId != null) return sameId(item.itemId ?? item.id, entry.itemId);
	return sameId(item.oCategoryId ?? item.categoryId, entry.categoryId);
};
var createPromotionItemFilterIndex = (filter) => {
	const items = /* @__PURE__ */ new Map();
	const categories = /* @__PURE__ */ new Map();
	(filter?.value || []).forEach((entry, position) => {
		const byItem = entry.itemId != null;
		const key = getIdKey(byItem ? entry.itemId : entry.categoryId);
		if (key === null) return;
		const index = byItem ? items : categories;
		let match = index.get(key);
		if (!match) {
			match = {
				entries: [],
				position
			};
			index.set(key, match);
		}
		match.entries.push(entry);
	});
	return {
		items,
		categories
	};
};
var getIndexedPromotionMatches = (item, index) => [index.items.size ? index.items.get(getIdKey(item.itemId ?? item.id)) : void 0, index.categories.size ? index.categories.get(getIdKey(item.oCategoryId ?? item.categoryId)) : void 0];
var matchesItemCenter = (item, filter, price, filterIndex) => {
	const info = item.itemCenter;
	if (!info) return false;
	const categoryMatched = (filter.categorySelections || []).some((entry) => sameId(entry.primaryCategoryId, info.primaryCategoryId) && (entry.secondaryCategoryId == null || sameId(entry.secondaryCategoryId, info.secondaryCategoryId))) || (filter.categoryIds || []).some((id) => sameId(id, info.primaryCategoryId) || sameId(id, info.secondaryCategoryId));
	const specIds = price ? (info.specList || []).filter((spec) => sameId(spec.localSizeId, price.sizeId)).map((spec) => spec.specOptionId) : info.specOptionIds || [];
	return categoryMatched || (filterIndex.items.get(getIdKey(info.itemId))?.entries || []).some((entry) => sameId(entry.itemId, info.itemId) && (!entry.sizeList?.length || entry.sizeList.some((size) => size.specOptionId == null || specIds.some((id) => sameId(id, size.specOptionId)))));
};
var filterScopedPromotionItems = (items, filter, context, filterIndex = createPromotionItemFilterIndex(filter)) => {
	const type = filter?.type || "all";
	const orderType = ORDER_TYPE[context.orderType] || context.orderType;
	const hasLocalEntries = filter?.source !== "itemCenter" && (filterIndex.items.size > 0 || filterIndex.categories.size > 0);
	return items.reduce((result, item) => {
		if (!item) return result;
		let prices = item.itemPrices;
		if (!context.selectedSizeOnly && Array.isArray(prices) && !prices.length) return result;
		if (!context.selectedSizeOnly && prices?.length && orderType) {
			const preferred = prices.filter((price) => price.type === orderType);
			prices = preferred.length ? preferred : prices.filter((price) => price.type === ORDER_TYPE.ALL);
			if (!prices.length) return result;
		}
		let entries = [];
		if (hasLocalEntries) {
			const [byItem, byCategory] = getIndexedPromotionMatches(item, filterIndex);
			entries = (byItem?.entries || []).concat(byCategory?.entries || []);
		}
		const accepts = (price) => {
			if (filter?.source === "itemCenter" && type === "all") return item.itemCenter?.itemId != null;
			const matched = filter?.source === "itemCenter" ? matchesItemCenter(item, filter, price, filterIndex) : entries.some((entry) => !entry.sizeList?.length || (price ? entry.sizeList.some((size) => sameId(size.sizeId, price.sizeId)) : !!context.selectedSizeOnly));
			return type === "all" || (type === "exclude" ? !matched : matched);
		};
		if (context.selectedSizeOnly) {
			if (accepts(item.sectionDetail?.find((section) => section.id === -1)?.sizeInfo || (item.sizeId != null ? { sizeId: item.sizeId } : void 0))) result.push(item);
			return result;
		}
		if (prices?.length) {
			const itemPrices = prices.filter(accepts);
			if (itemPrices.length) result.push({
				...item,
				itemPrices
			});
		} else {
			const size = item.sectionDetail?.find((section) => section.id === -1)?.sizeInfo;
			if (accepts(size || (item.sizeId != null ? { sizeId: item.sizeId } : void 0))) result.push(item);
		}
		return result;
	}, []);
};
var filterPromotionItems = (items = [], itemFilter, context = {}) => filterScopedPromotionItems(items, scopePromotionItemFilter(itemFilter, context), context);
var mergePromotionItemPools = (pools, { useLowestSpecialPrice = false } = {}) => {
	const result = [];
	const itemIndexes = /* @__PURE__ */ new Map();
	pools.flat().forEach((item) => {
		const id = item.id ?? item.itemId;
		const key = id == null ? null : String(id);
		const index = key === null ? void 0 : itemIndexes.get(key);
		if (index === void 0) {
			if (key !== null) itemIndexes.set(key, result.length);
			result.push(item);
			return;
		}
		const existing = result[index];
		if (useLowestSpecialPrice && Number.isFinite(existing.specialPrice) && Number.isFinite(item.specialPrice)) result[index] = {
			...existing,
			specialPrice: Math.min(existing.specialPrice, item.specialPrice)
		};
		if (existing.itemPrices?.length && item.itemPrices?.length) result[index] = {
			...result[index],
			itemPrices: [...existing.itemPrices, ...item.itemPrices.filter((price) => !existing.itemPrices.some((other) => sameId(other.sizeId, price.sizeId) && other.type === price.type))]
		};
	});
	return result;
};
var getPromotionBenefitItems = (rule, items, context, reward = false) => {
	const { condition, benefits = [] } = rule.ruleExpression || {};
	const thresholdItems = filterPromotionItems(items, condition?.itemFilter, context);
	if (!benefits.length) return thresholdItems;
	return mergePromotionItemPools(benefits.map((benefit) => {
		if (rule.type === "orderItemFixedPrice" || rule.type === "orderItemFixedPriceCoupon") return thresholdItems.length ? filterPromotionItems(items, benefit.condition?.itemFilter, context) : [];
		const triggerItems = filterPromotionItems(thresholdItems, benefit.condition?.itemFilter, context);
		if (!triggerItems.length) return [];
		if (rule.type === "amountGiftItem" || rule.type === "orderItemGiftItem" || rule.type === "giftItemCoupon") {
			const rewardItems = filterPromotionItems(items, benefit.actions?.[0]?.itemFilter, context);
			return rewardItems.length ? reward ? rewardItems : triggerItems : [];
		}
		return triggerItems;
	}));
};
var getAvailablePromotionRules = (rules = [], items, context) => rules.map((rule) => normalizePromotionRule(rule, context)).map((rule) => {
	const benefits = rule.ruleExpression?.benefits;
	if (!benefits?.length) return getPromotionBenefitItems(rule, items, context).length ? rule : null;
	const availableIndexes = benefits.map((benefit, index) => getPromotionBenefitItems({
		...rule,
		ruleExpression: {
			...rule.ruleExpression,
			benefits: [benefit]
		}
	}, items, context).length ? index : -1).filter((index) => index !== -1);
	if (!availableIndexes.length) return null;
	return {
		...rule,
		...rule.activityRule?.length === benefits.length ? { activityRule: availableIndexes.map((index) => rule.activityRule[index]) } : {},
		ruleExpression: {
			...rule.ruleExpression,
			benefits: availableIndexes.map((index) => benefits[index])
		}
	};
}).filter(Boolean);
var getSpecialPriceItems = ({ benefits = [], itemResources, options = {}, ...context }) => mergePromotionItemPools(benefits.map((benefit) => {
	const filter = scopePromotionItemFilter(benefit.condition?.itemFilter, context);
	const filterIndex = createPromotionItemFilterIndex(filter);
	return filterScopedPromotionItems(itemResources, filter, context, filterIndex).map((item) => {
		const [byItem, byCategory] = getIndexedPromotionMatches(item, filterIndex);
		const entry = (!byItem ? byCategory : !byCategory || byItem.position < byCategory.position ? byItem : byCategory)?.entries[0];
		return {
			...item,
			specialPrice: benefit.actions?.[0]?.params?.price,
			displayPrice: entry?.price,
			_id: benefit._id,
			quantityLimit: options.quantityLimit || 9999
		};
	});
}), { useLowestSpecialPrice: true });
//#endregion
//#region source-snapshot/src/utils/memberPrice.js
var hasBenefit$1 = (node) => Number.isFinite(node?.benefitPrice);
var hasQuantity = (node) => Number(node.quantity ?? 1) > 0;
var isMemberPriceProtected = (item) => item.isFreeItem || item.isCRMFreeItem || item.isFreeItemVoucher || item.isGiftItem || item.promotionItem || item.isPromotionItem || item.isSpecialItem || item.isCRMIntegrationSpecialItem || item.isCRMIntegrationBundleDiscountItem || item.isCRMIntegrationDiscountItem || item.campaignRewardItem || item.isLocalExchangePurchaseItem;
var getSelectedOptionPrices = (option) => {
	const price = option.isFreeItem ? 0 : option.price;
	const parent = option.itemOption;
	if (!parent || parent.id == option.id) return {
		price,
		parentPrice: price,
		subPrice: void 0
	};
	const parentPrice = option.isFreeItem ? 0 : parent.price ?? 0;
	return {
		price,
		parentPrice,
		subPrice: Big(price).minus(parentPrice).toNumber()
	};
};
var resolveOption = (option) => {
	if (option.isFreeItem || !hasQuantity(option)) return false;
	const parent = option.itemOption;
	if (!parent || parent.id == option.id) {
		if (!hasBenefit$1(option)) return false;
		option.price = option.benefitPrice;
		return true;
	}
	const sub = parent.subOptions?.find((node) => node.id == option.id);
	let price = Big(option.price);
	const parentBenefit = hasBenefit$1(parent);
	const subBenefit = hasBenefit$1(sub);
	if (parentBenefit) {
		price = price.plus(Big(parent.benefitPrice).minus(parent.price ?? 0));
		option.itemOption = {
			...parent,
			price: parent.benefitPrice
		};
	}
	if (subBenefit) {
		price = price.plus(Big(sub.benefitPrice).minus(sub.price ?? 0));
		option.itemOption = {
			...option.itemOption,
			subOptions: parent.subOptions.map((node) => node.id == option.id ? {
				...node,
				price: node.benefitPrice
			} : node)
		};
	}
	option.price = price.toNumber();
	return parentBenefit || subBenefit;
};
var resolveItem = (item) => {
	if (!hasQuantity(item) || isMembershipCard(item) || isMemberPriceProtected(item)) return false;
	const detail = item.sectionDetail || item.selectedOptionList || [];
	const hasSize = detail.some((section) => section.id == -1);
	let benefit = false;
	if (!hasSize && !item.isComboBaseFree && hasBenefit$1(item)) {
		item.price = item.benefitPrice;
		benefit = true;
	}
	detail.forEach((section) => {
		if (section.id == -1 && !item.isComboBaseFree && hasBenefit$1(section.sizeInfo)) {
			section.sizeInfo.price = section.sizeInfo.benefitPrice;
			benefit = true;
		}
		if (section.id == -2 || section.id == -3) section.options?.forEach((option) => {
			benefit = resolveOption(option) || benefit;
		});
		if (section.id > 0) section.items?.forEach((child) => {
			benefit = resolveItem(child) || benefit;
		});
	});
	return benefit;
};
var resolveItemMemberPrices = (original) => {
	const item = (0, import_cloneDeep.default)(original);
	return {
		item,
		hasBenefitPrice: resolveItem(item)
	};
};
var getItemActualPrices = (item) => {
	const member = resolveItemMemberPrices(item);
	return {
		realPrice: getItemPrice(item),
		realBenefitPrice: getItemPrice(member.item),
		hasBenefitPrice: member.hasBenefitPrice
	};
};
var getOrderMemberPrices = (itemList = []) => {
	let original = Big(0);
	let member = Big(0);
	let hasBenefitPrice = false;
	itemList.forEach((item) => {
		if (!hasQuantity(item)) return;
		const prices = getItemActualPrices(item);
		original = original.plus(Big(prices.realPrice).times(item.quantity ?? 1));
		member = member.plus(Big(prices.realBenefitPrice).times(item.quantity ?? 1));
		hasBenefitPrice ||= prices.hasBenefitPrice;
	});
	return {
		realPrice: Number(original.toFixed(2)),
		realBenefitPrice: Number(member.toFixed(2)),
		hasBenefitPrice
	};
};
var hasActiveMemberPrivilege = (crm, now = Date.now()) => {
	const member = crm?.memberCRMInfo;
	return crm?.isHasBenefit === true && !!(member?.id || member?.userId) && Array.isArray(member.privileges) && member.privileges.some((privilege) => {
		if (privilege?.status !== "ACTIVE") return false;
		const expiry = privilege.expireTime;
		if (expiry == null) return true;
		if (typeof expiry === "string" && expiry.trim() === "") return false;
		return (typeof expiry === "number" || typeof expiry === "string") && Number.isFinite(Number(expiry)) && Number(expiry) >= now;
	});
};
//#endregion
//#region node_modules/nanoid/url-alphabet/index.js
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
//#endregion
//#region node_modules/nanoid/index.browser.js
var nanoid = (size = 21) => {
	let id = "";
	let bytes = crypto.getRandomValues(new Uint8Array(size |= 0));
	while (size--) id += urlAlphabet[bytes[size] & 63];
	return id;
};
//#endregion
//#region node_modules/lodash/_baseFindIndex.js
var require__baseFindIndex = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* The base implementation of `_.findIndex` and `_.findLastIndex` without
	* support for iteratee shorthands.
	*
	* @private
	* @param {Array} array The array to inspect.
	* @param {Function} predicate The function invoked per iteration.
	* @param {number} fromIndex The index to search from.
	* @param {boolean} [fromRight] Specify iterating from right to left.
	* @returns {number} Returns the index of the matched value, else `-1`.
	*/
	function baseFindIndex(array, predicate, fromIndex, fromRight) {
		var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
		while (fromRight ? index-- : ++index < length) if (predicate(array[index], index, array)) return index;
		return -1;
	}
	module.exports = baseFindIndex;
}));
//#endregion
//#region node_modules/lodash/_setCacheAdd.js
var require__setCacheAdd = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = "__lodash_hash_undefined__";
	/**
	* Adds `value` to the array cache.
	*
	* @private
	* @name add
	* @memberOf SetCache
	* @alias push
	* @param {*} value The value to cache.
	* @returns {Object} Returns the cache instance.
	*/
	function setCacheAdd(value) {
		this.__data__.set(value, HASH_UNDEFINED);
		return this;
	}
	module.exports = setCacheAdd;
}));
//#endregion
//#region node_modules/lodash/_setCacheHas.js
var require__setCacheHas = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Checks if `value` is in the array cache.
	*
	* @private
	* @name has
	* @memberOf SetCache
	* @param {*} value The value to search for.
	* @returns {number} Returns `true` if `value` is found, else `false`.
	*/
	function setCacheHas(value) {
		return this.__data__.has(value);
	}
	module.exports = setCacheHas;
}));
//#endregion
//#region node_modules/lodash/_SetCache.js
var require__SetCache = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var MapCache = require__MapCache();
	var setCacheAdd = require__setCacheAdd();
	var setCacheHas = require__setCacheHas();
	/**
	*
	* Creates an array cache object to store unique values.
	*
	* @private
	* @constructor
	* @param {Array} [values] The values to cache.
	*/
	function SetCache(values) {
		var index = -1, length = values == null ? 0 : values.length;
		this.__data__ = new MapCache();
		while (++index < length) this.add(values[index]);
	}
	SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
	SetCache.prototype.has = setCacheHas;
	module.exports = SetCache;
}));
//#endregion
//#region node_modules/lodash/_arraySome.js
var require__arraySome = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* A specialized version of `_.some` for arrays without support for iteratee
	* shorthands.
	*
	* @private
	* @param {Array} [array] The array to iterate over.
	* @param {Function} predicate The function invoked per iteration.
	* @returns {boolean} Returns `true` if any element passes the predicate check,
	*  else `false`.
	*/
	function arraySome(array, predicate) {
		var index = -1, length = array == null ? 0 : array.length;
		while (++index < length) if (predicate(array[index], index, array)) return true;
		return false;
	}
	module.exports = arraySome;
}));
//#endregion
//#region node_modules/lodash/_cacheHas.js
var require__cacheHas = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Checks if a `cache` value for `key` exists.
	*
	* @private
	* @param {Object} cache The cache to query.
	* @param {string} key The key of the entry to check.
	* @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	*/
	function cacheHas(cache, key) {
		return cache.has(key);
	}
	module.exports = cacheHas;
}));
//#endregion
//#region node_modules/lodash/_equalArrays.js
var require__equalArrays = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SetCache = require__SetCache();
	var arraySome = require__arraySome();
	var cacheHas = require__cacheHas();
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;
	var COMPARE_UNORDERED_FLAG = 2;
	/**
	* A specialized version of `baseIsEqualDeep` for arrays with support for
	* partial deep comparisons.
	*
	* @private
	* @param {Array} array The array to compare.
	* @param {Array} other The other array to compare.
	* @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	* @param {Function} customizer The function to customize comparisons.
	* @param {Function} equalFunc The function to determine equivalents of values.
	* @param {Object} stack Tracks traversed `array` and `other` objects.
	* @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	*/
	function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
		var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
		if (arrLength != othLength && !(isPartial && othLength > arrLength)) return false;
		var arrStacked = stack.get(array);
		var othStacked = stack.get(other);
		if (arrStacked && othStacked) return arrStacked == other && othStacked == array;
		var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
		stack.set(array, other);
		stack.set(other, array);
		while (++index < arrLength) {
			var arrValue = array[index], othValue = other[index];
			if (customizer) var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
			if (compared !== void 0) {
				if (compared) continue;
				result = false;
				break;
			}
			if (seen) {
				if (!arraySome(other, function(othValue, othIndex) {
					if (!cacheHas(seen, othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) return seen.push(othIndex);
				})) {
					result = false;
					break;
				}
			} else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
				result = false;
				break;
			}
		}
		stack["delete"](array);
		stack["delete"](other);
		return result;
	}
	module.exports = equalArrays;
}));
//#endregion
//#region node_modules/lodash/_mapToArray.js
var require__mapToArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Converts `map` to its key-value pairs.
	*
	* @private
	* @param {Object} map The map to convert.
	* @returns {Array} Returns the key-value pairs.
	*/
	function mapToArray(map) {
		var index = -1, result = Array(map.size);
		map.forEach(function(value, key) {
			result[++index] = [key, value];
		});
		return result;
	}
	module.exports = mapToArray;
}));
//#endregion
//#region node_modules/lodash/_setToArray.js
var require__setToArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Converts `set` to an array of its values.
	*
	* @private
	* @param {Object} set The set to convert.
	* @returns {Array} Returns the values.
	*/
	function setToArray(set) {
		var index = -1, result = Array(set.size);
		set.forEach(function(value) {
			result[++index] = value;
		});
		return result;
	}
	module.exports = setToArray;
}));
//#endregion
//#region node_modules/lodash/_equalByTag.js
var require__equalByTag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Symbol = require__Symbol();
	var Uint8Array = require__Uint8Array();
	var eq = require_eq();
	var equalArrays = require__equalArrays();
	var mapToArray = require__mapToArray();
	var setToArray = require__setToArray();
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;
	var COMPARE_UNORDERED_FLAG = 2;
	/** `Object#toString` result references. */
	var boolTag = "[object Boolean]";
	var dateTag = "[object Date]";
	var errorTag = "[object Error]";
	var mapTag = "[object Map]";
	var numberTag = "[object Number]";
	var regexpTag = "[object RegExp]";
	var setTag = "[object Set]";
	var stringTag = "[object String]";
	var symbolTag = "[object Symbol]";
	var arrayBufferTag = "[object ArrayBuffer]";
	var dataViewTag = "[object DataView]";
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : void 0;
	var symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
	/**
	* A specialized version of `baseIsEqualDeep` for comparing objects of
	* the same `toStringTag`.
	*
	* **Note:** This function only supports comparing values with tags of
	* `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	*
	* @private
	* @param {Object} object The object to compare.
	* @param {Object} other The other object to compare.
	* @param {string} tag The `toStringTag` of the objects to compare.
	* @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	* @param {Function} customizer The function to customize comparisons.
	* @param {Function} equalFunc The function to determine equivalents of values.
	* @param {Object} stack Tracks traversed `object` and `other` objects.
	* @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	*/
	function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
		switch (tag) {
			case dataViewTag:
				if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) return false;
				object = object.buffer;
				other = other.buffer;
			case arrayBufferTag:
				if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) return false;
				return true;
			case boolTag:
			case dateTag:
			case numberTag: return eq(+object, +other);
			case errorTag: return object.name == other.name && object.message == other.message;
			case regexpTag:
			case stringTag: return object == other + "";
			case mapTag: var convert = mapToArray;
			case setTag:
				var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
				convert || (convert = setToArray);
				if (object.size != other.size && !isPartial) return false;
				var stacked = stack.get(object);
				if (stacked) return stacked == other;
				bitmask |= COMPARE_UNORDERED_FLAG;
				stack.set(object, other);
				var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
				stack["delete"](object);
				return result;
			case symbolTag: if (symbolValueOf) return symbolValueOf.call(object) == symbolValueOf.call(other);
		}
		return false;
	}
	module.exports = equalByTag;
}));
//#endregion
//#region node_modules/lodash/_equalObjects.js
var require__equalObjects = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getAllKeys = require__getAllKeys();
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* A specialized version of `baseIsEqualDeep` for objects with support for
	* partial deep comparisons.
	*
	* @private
	* @param {Object} object The object to compare.
	* @param {Object} other The other object to compare.
	* @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	* @param {Function} customizer The function to customize comparisons.
	* @param {Function} equalFunc The function to determine equivalents of values.
	* @param {Object} stack Tracks traversed `object` and `other` objects.
	* @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	*/
	function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
		var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length;
		if (objLength != getAllKeys(other).length && !isPartial) return false;
		var index = objLength;
		while (index--) {
			var key = objProps[index];
			if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) return false;
		}
		var objStacked = stack.get(object);
		var othStacked = stack.get(other);
		if (objStacked && othStacked) return objStacked == other && othStacked == object;
		var result = true;
		stack.set(object, other);
		stack.set(other, object);
		var skipCtor = isPartial;
		while (++index < objLength) {
			key = objProps[index];
			var objValue = object[key], othValue = other[key];
			if (customizer) var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
			if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
				result = false;
				break;
			}
			skipCtor || (skipCtor = key == "constructor");
		}
		if (result && !skipCtor) {
			var objCtor = object.constructor, othCtor = other.constructor;
			if (objCtor != othCtor && "constructor" in object && "constructor" in other && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) result = false;
		}
		stack["delete"](object);
		stack["delete"](other);
		return result;
	}
	module.exports = equalObjects;
}));
//#endregion
//#region node_modules/lodash/_baseIsEqualDeep.js
var require__baseIsEqualDeep = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Stack = require__Stack();
	var equalArrays = require__equalArrays();
	var equalByTag = require__equalByTag();
	var equalObjects = require__equalObjects();
	var getTag = require__getTag();
	var isArray = require_isArray();
	var isBuffer = require_isBuffer();
	var isTypedArray = require_isTypedArray();
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;
	/** `Object#toString` result references. */
	var argsTag = "[object Arguments]";
	var arrayTag = "[object Array]";
	var objectTag = "[object Object]";
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	* A specialized version of `baseIsEqual` for arrays and objects which performs
	* deep comparisons and tracks traversed objects enabling objects with circular
	* references to be compared.
	*
	* @private
	* @param {Object} object The object to compare.
	* @param {Object} other The other object to compare.
	* @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	* @param {Function} customizer The function to customize comparisons.
	* @param {Function} equalFunc The function to determine equivalents of values.
	* @param {Object} [stack] Tracks traversed `object` and `other` objects.
	* @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	*/
	function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
		var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
		objTag = objTag == argsTag ? objectTag : objTag;
		othTag = othTag == argsTag ? objectTag : othTag;
		var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
		if (isSameTag && isBuffer(object)) {
			if (!isBuffer(other)) return false;
			objIsArr = true;
			objIsObj = false;
		}
		if (isSameTag && !objIsObj) {
			stack || (stack = new Stack());
			return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
		}
		if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
			var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
			if (objIsWrapped || othIsWrapped) {
				var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
				stack || (stack = new Stack());
				return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
			}
		}
		if (!isSameTag) return false;
		stack || (stack = new Stack());
		return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
	}
	module.exports = baseIsEqualDeep;
}));
//#endregion
//#region node_modules/lodash/_baseIsEqual.js
var require__baseIsEqual = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseIsEqualDeep = require__baseIsEqualDeep();
	var isObjectLike = require_isObjectLike();
	/**
	* The base implementation of `_.isEqual` which supports partial comparisons
	* and tracks traversed objects.
	*
	* @private
	* @param {*} value The value to compare.
	* @param {*} other The other value to compare.
	* @param {boolean} bitmask The bitmask flags.
	*  1 - Unordered comparison
	*  2 - Partial comparison
	* @param {Function} [customizer] The function to customize comparisons.
	* @param {Object} [stack] Tracks traversed `value` and `other` objects.
	* @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	*/
	function baseIsEqual(value, other, bitmask, customizer, stack) {
		if (value === other) return true;
		if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) return value !== value && other !== other;
		return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
	}
	module.exports = baseIsEqual;
}));
//#endregion
//#region node_modules/lodash/_baseIsMatch.js
var require__baseIsMatch = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Stack = require__Stack();
	var baseIsEqual = require__baseIsEqual();
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;
	var COMPARE_UNORDERED_FLAG = 2;
	/**
	* The base implementation of `_.isMatch` without support for iteratee shorthands.
	*
	* @private
	* @param {Object} object The object to inspect.
	* @param {Object} source The object of property values to match.
	* @param {Array} matchData The property names, values, and compare flags to match.
	* @param {Function} [customizer] The function to customize comparisons.
	* @returns {boolean} Returns `true` if `object` is a match, else `false`.
	*/
	function baseIsMatch(object, source, matchData, customizer) {
		var index = matchData.length, length = index, noCustomizer = !customizer;
		if (object == null) return !length;
		object = Object(object);
		while (index--) {
			var data = matchData[index];
			if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) return false;
		}
		while (++index < length) {
			data = matchData[index];
			var key = data[0], objValue = object[key], srcValue = data[1];
			if (noCustomizer && data[2]) {
				if (objValue === void 0 && !(key in object)) return false;
			} else {
				var stack = new Stack();
				if (customizer) var result = customizer(objValue, srcValue, key, object, source, stack);
				if (!(result === void 0 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result)) return false;
			}
		}
		return true;
	}
	module.exports = baseIsMatch;
}));
//#endregion
//#region node_modules/lodash/_isStrictComparable.js
var require__isStrictComparable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isObject = require_isObject();
	/**
	* Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` if suitable for strict
	*  equality comparisons, else `false`.
	*/
	function isStrictComparable(value) {
		return value === value && !isObject(value);
	}
	module.exports = isStrictComparable;
}));
//#endregion
//#region node_modules/lodash/_getMatchData.js
var require__getMatchData = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isStrictComparable = require__isStrictComparable();
	var keys = require_keys();
	/**
	* Gets the property names, values, and compare flags of `object`.
	*
	* @private
	* @param {Object} object The object to query.
	* @returns {Array} Returns the match data of `object`.
	*/
	function getMatchData(object) {
		var result = keys(object), length = result.length;
		while (length--) {
			var key = result[length], value = object[key];
			result[length] = [
				key,
				value,
				isStrictComparable(value)
			];
		}
		return result;
	}
	module.exports = getMatchData;
}));
//#endregion
//#region node_modules/lodash/_matchesStrictComparable.js
var require__matchesStrictComparable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* A specialized version of `matchesProperty` for source values suitable
	* for strict equality comparisons, i.e. `===`.
	*
	* @private
	* @param {string} key The key of the property to get.
	* @param {*} srcValue The value to match.
	* @returns {Function} Returns the new spec function.
	*/
	function matchesStrictComparable(key, srcValue) {
		return function(object) {
			if (object == null) return false;
			return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
		};
	}
	module.exports = matchesStrictComparable;
}));
//#endregion
//#region node_modules/lodash/_baseMatches.js
var require__baseMatches = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseIsMatch = require__baseIsMatch();
	var getMatchData = require__getMatchData();
	var matchesStrictComparable = require__matchesStrictComparable();
	/**
	* The base implementation of `_.matches` which doesn't clone `source`.
	*
	* @private
	* @param {Object} source The object of property values to match.
	* @returns {Function} Returns the new spec function.
	*/
	function baseMatches(source) {
		var matchData = getMatchData(source);
		if (matchData.length == 1 && matchData[0][2]) return matchesStrictComparable(matchData[0][0], matchData[0][1]);
		return function(object) {
			return object === source || baseIsMatch(object, source, matchData);
		};
	}
	module.exports = baseMatches;
}));
//#endregion
//#region node_modules/lodash/isSymbol.js
var require_isSymbol = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseGetTag = require__baseGetTag();
	var isObjectLike = require_isObjectLike();
	/** `Object#toString` result references. */
	var symbolTag = "[object Symbol]";
	/**
	* Checks if `value` is classified as a `Symbol` primitive or object.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	* @example
	*
	* _.isSymbol(Symbol.iterator);
	* // => true
	*
	* _.isSymbol('abc');
	* // => false
	*/
	function isSymbol(value) {
		return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
	}
	module.exports = isSymbol;
}));
//#endregion
//#region node_modules/lodash/_isKey.js
var require__isKey = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isArray = require_isArray();
	var isSymbol = require_isSymbol();
	/** Used to match property names within property paths. */
	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
	var reIsPlainProp = /^\w*$/;
	/**
	* Checks if `value` is a property name and not a property path.
	*
	* @private
	* @param {*} value The value to check.
	* @param {Object} [object] The object to query keys on.
	* @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	*/
	function isKey(value, object) {
		if (isArray(value)) return false;
		var type = typeof value;
		if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) return true;
		return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
	}
	module.exports = isKey;
}));
//#endregion
//#region node_modules/lodash/memoize.js
var require_memoize = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var MapCache = require__MapCache();
	/** Error message constants. */
	var FUNC_ERROR_TEXT = "Expected a function";
	/**
	* Creates a function that memoizes the result of `func`. If `resolver` is
	* provided, it determines the cache key for storing the result based on the
	* arguments provided to the memoized function. By default, the first argument
	* provided to the memoized function is used as the map cache key. The `func`
	* is invoked with the `this` binding of the memoized function.
	*
	* **Note:** The cache is exposed as the `cache` property on the memoized
	* function. Its creation may be customized by replacing the `_.memoize.Cache`
	* constructor with one whose instances implement the
	* [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	* method interface of `clear`, `delete`, `get`, `has`, and `set`.
	*
	* @static
	* @memberOf _
	* @since 0.1.0
	* @category Function
	* @param {Function} func The function to have its output memoized.
	* @param {Function} [resolver] The function to resolve the cache key.
	* @returns {Function} Returns the new memoized function.
	* @example
	*
	* var object = { 'a': 1, 'b': 2 };
	* var other = { 'c': 3, 'd': 4 };
	*
	* var values = _.memoize(_.values);
	* values(object);
	* // => [1, 2]
	*
	* values(other);
	* // => [3, 4]
	*
	* object.a = 2;
	* values(object);
	* // => [1, 2]
	*
	* // Modify the result cache.
	* values.cache.set(object, ['a', 'b']);
	* values(object);
	* // => ['a', 'b']
	*
	* // Replace `_.memoize.Cache`.
	* _.memoize.Cache = WeakMap;
	*/
	function memoize(func, resolver) {
		if (typeof func != "function" || resolver != null && typeof resolver != "function") throw new TypeError(FUNC_ERROR_TEXT);
		var memoized = function() {
			var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
			if (cache.has(key)) return cache.get(key);
			var result = func.apply(this, args);
			memoized.cache = cache.set(key, result) || cache;
			return result;
		};
		memoized.cache = new (memoize.Cache || MapCache)();
		return memoized;
	}
	memoize.Cache = MapCache;
	module.exports = memoize;
}));
//#endregion
//#region node_modules/lodash/_memoizeCapped.js
var require__memoizeCapped = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var memoize = require_memoize();
	/** Used as the maximum memoize cache size. */
	var MAX_MEMOIZE_SIZE = 500;
	/**
	* A specialized version of `_.memoize` which clears the memoized function's
	* cache when it exceeds `MAX_MEMOIZE_SIZE`.
	*
	* @private
	* @param {Function} func The function to have its output memoized.
	* @returns {Function} Returns the new memoized function.
	*/
	function memoizeCapped(func) {
		var result = memoize(func, function(key) {
			if (cache.size === MAX_MEMOIZE_SIZE) cache.clear();
			return key;
		});
		var cache = result.cache;
		return result;
	}
	module.exports = memoizeCapped;
}));
//#endregion
//#region node_modules/lodash/_stringToPath.js
var require__stringToPath = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var memoizeCapped = require__memoizeCapped();
	/** Used to match property names within property paths. */
	var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
	/** Used to match backslashes in property paths. */
	var reEscapeChar = /\\(\\)?/g;
	module.exports = memoizeCapped(function(string) {
		var result = [];
		if (string.charCodeAt(0) === 46) result.push("");
		string.replace(rePropName, function(match, number, quote, subString) {
			result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
		});
		return result;
	});
}));
//#endregion
//#region node_modules/lodash/_arrayMap.js
var require__arrayMap = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* A specialized version of `_.map` for arrays without support for iteratee
	* shorthands.
	*
	* @private
	* @param {Array} [array] The array to iterate over.
	* @param {Function} iteratee The function invoked per iteration.
	* @returns {Array} Returns the new mapped array.
	*/
	function arrayMap(array, iteratee) {
		var index = -1, length = array == null ? 0 : array.length, result = Array(length);
		while (++index < length) result[index] = iteratee(array[index], index, array);
		return result;
	}
	module.exports = arrayMap;
}));
//#endregion
//#region node_modules/lodash/_baseToString.js
var require__baseToString = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Symbol = require__Symbol();
	var arrayMap = require__arrayMap();
	var isArray = require_isArray();
	var isSymbol = require_isSymbol();
	/** Used as references for various `Number` constants. */
	var INFINITY = Infinity;
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : void 0;
	var symbolToString = symbolProto ? symbolProto.toString : void 0;
	/**
	* The base implementation of `_.toString` which doesn't convert nullish
	* values to empty strings.
	*
	* @private
	* @param {*} value The value to process.
	* @returns {string} Returns the string.
	*/
	function baseToString(value) {
		if (typeof value == "string") return value;
		if (isArray(value)) return arrayMap(value, baseToString) + "";
		if (isSymbol(value)) return symbolToString ? symbolToString.call(value) : "";
		var result = value + "";
		return result == "0" && 1 / value == -INFINITY ? "-0" : result;
	}
	module.exports = baseToString;
}));
//#endregion
//#region node_modules/lodash/toString.js
var require_toString = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseToString = require__baseToString();
	/**
	* Converts `value` to a string. An empty string is returned for `null`
	* and `undefined` values. The sign of `-0` is preserved.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to convert.
	* @returns {string} Returns the converted string.
	* @example
	*
	* _.toString(null);
	* // => ''
	*
	* _.toString(-0);
	* // => '-0'
	*
	* _.toString([1, 2, 3]);
	* // => '1,2,3'
	*/
	function toString(value) {
		return value == null ? "" : baseToString(value);
	}
	module.exports = toString;
}));
//#endregion
//#region node_modules/lodash/_castPath.js
var require__castPath = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isArray = require_isArray();
	var isKey = require__isKey();
	var stringToPath = require__stringToPath();
	var toString = require_toString();
	/**
	* Casts `value` to a path array if it's not one.
	*
	* @private
	* @param {*} value The value to inspect.
	* @param {Object} [object] The object to query keys on.
	* @returns {Array} Returns the cast property path array.
	*/
	function castPath(value, object) {
		if (isArray(value)) return value;
		return isKey(value, object) ? [value] : stringToPath(toString(value));
	}
	module.exports = castPath;
}));
//#endregion
//#region node_modules/lodash/_toKey.js
var require__toKey = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isSymbol = require_isSymbol();
	/** Used as references for various `Number` constants. */
	var INFINITY = Infinity;
	/**
	* Converts `value` to a string key if it's not a string or symbol.
	*
	* @private
	* @param {*} value The value to inspect.
	* @returns {string|symbol} Returns the key.
	*/
	function toKey(value) {
		if (typeof value == "string" || isSymbol(value)) return value;
		var result = value + "";
		return result == "0" && 1 / value == -INFINITY ? "-0" : result;
	}
	module.exports = toKey;
}));
//#endregion
//#region node_modules/lodash/_baseGet.js
var require__baseGet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var castPath = require__castPath();
	var toKey = require__toKey();
	/**
	* The base implementation of `_.get` without support for default values.
	*
	* @private
	* @param {Object} object The object to query.
	* @param {Array|string} path The path of the property to get.
	* @returns {*} Returns the resolved value.
	*/
	function baseGet(object, path) {
		path = castPath(path, object);
		var index = 0, length = path.length;
		while (object != null && index < length) object = object[toKey(path[index++])];
		return index && index == length ? object : void 0;
	}
	module.exports = baseGet;
}));
//#endregion
//#region node_modules/lodash/get.js
var require_get = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseGet = require__baseGet();
	/**
	* Gets the value at `path` of `object`. If the resolved value is
	* `undefined`, the `defaultValue` is returned in its place.
	*
	* @static
	* @memberOf _
	* @since 3.7.0
	* @category Object
	* @param {Object} object The object to query.
	* @param {Array|string} path The path of the property to get.
	* @param {*} [defaultValue] The value returned for `undefined` resolved values.
	* @returns {*} Returns the resolved value.
	* @example
	*
	* var object = { 'a': [{ 'b': { 'c': 3 } }] };
	*
	* _.get(object, 'a[0].b.c');
	* // => 3
	*
	* _.get(object, ['a', '0', 'b', 'c']);
	* // => 3
	*
	* _.get(object, 'a.b.c', 'default');
	* // => 'default'
	*/
	function get(object, path, defaultValue) {
		var result = object == null ? void 0 : baseGet(object, path);
		return result === void 0 ? defaultValue : result;
	}
	module.exports = get;
}));
//#endregion
//#region node_modules/lodash/_baseHasIn.js
var require__baseHasIn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* The base implementation of `_.hasIn` without support for deep paths.
	*
	* @private
	* @param {Object} [object] The object to query.
	* @param {Array|string} key The key to check.
	* @returns {boolean} Returns `true` if `key` exists, else `false`.
	*/
	function baseHasIn(object, key) {
		return object != null && key in Object(object);
	}
	module.exports = baseHasIn;
}));
//#endregion
//#region node_modules/lodash/_hasPath.js
var require__hasPath = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var castPath = require__castPath();
	var isArguments = require_isArguments();
	var isArray = require_isArray();
	var isIndex = require__isIndex();
	var isLength = require_isLength();
	var toKey = require__toKey();
	/**
	* Checks if `path` exists on `object`.
	*
	* @private
	* @param {Object} object The object to query.
	* @param {Array|string} path The path to check.
	* @param {Function} hasFunc The function to check properties.
	* @returns {boolean} Returns `true` if `path` exists, else `false`.
	*/
	function hasPath(object, path, hasFunc) {
		path = castPath(path, object);
		var index = -1, length = path.length, result = false;
		while (++index < length) {
			var key = toKey(path[index]);
			if (!(result = object != null && hasFunc(object, key))) break;
			object = object[key];
		}
		if (result || ++index != length) return result;
		length = object == null ? 0 : object.length;
		return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
	}
	module.exports = hasPath;
}));
//#endregion
//#region node_modules/lodash/hasIn.js
var require_hasIn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseHasIn = require__baseHasIn();
	var hasPath = require__hasPath();
	/**
	* Checks if `path` is a direct or inherited property of `object`.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Object
	* @param {Object} object The object to query.
	* @param {Array|string} path The path to check.
	* @returns {boolean} Returns `true` if `path` exists, else `false`.
	* @example
	*
	* var object = _.create({ 'a': _.create({ 'b': 2 }) });
	*
	* _.hasIn(object, 'a');
	* // => true
	*
	* _.hasIn(object, 'a.b');
	* // => true
	*
	* _.hasIn(object, ['a', 'b']);
	* // => true
	*
	* _.hasIn(object, 'b');
	* // => false
	*/
	function hasIn(object, path) {
		return object != null && hasPath(object, path, baseHasIn);
	}
	module.exports = hasIn;
}));
//#endregion
//#region node_modules/lodash/_baseMatchesProperty.js
var require__baseMatchesProperty = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseIsEqual = require__baseIsEqual();
	var get = require_get();
	var hasIn = require_hasIn();
	var isKey = require__isKey();
	var isStrictComparable = require__isStrictComparable();
	var matchesStrictComparable = require__matchesStrictComparable();
	var toKey = require__toKey();
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;
	var COMPARE_UNORDERED_FLAG = 2;
	/**
	* The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
	*
	* @private
	* @param {string} path The path of the property to get.
	* @param {*} srcValue The value to match.
	* @returns {Function} Returns the new spec function.
	*/
	function baseMatchesProperty(path, srcValue) {
		if (isKey(path) && isStrictComparable(srcValue)) return matchesStrictComparable(toKey(path), srcValue);
		return function(object) {
			var objValue = get(object, path);
			return objValue === void 0 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
		};
	}
	module.exports = baseMatchesProperty;
}));
//#endregion
//#region node_modules/lodash/identity.js
var require_identity = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This method returns the first argument it receives.
	*
	* @static
	* @since 0.1.0
	* @memberOf _
	* @category Util
	* @param {*} value Any value.
	* @returns {*} Returns `value`.
	* @example
	*
	* var object = { 'a': 1 };
	*
	* console.log(_.identity(object) === object);
	* // => true
	*/
	function identity(value) {
		return value;
	}
	module.exports = identity;
}));
//#endregion
//#region node_modules/lodash/_baseProperty.js
var require__baseProperty = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* The base implementation of `_.property` without support for deep paths.
	*
	* @private
	* @param {string} key The key of the property to get.
	* @returns {Function} Returns the new accessor function.
	*/
	function baseProperty(key) {
		return function(object) {
			return object == null ? void 0 : object[key];
		};
	}
	module.exports = baseProperty;
}));
//#endregion
//#region node_modules/lodash/_basePropertyDeep.js
var require__basePropertyDeep = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseGet = require__baseGet();
	/**
	* A specialized version of `baseProperty` which supports deep paths.
	*
	* @private
	* @param {Array|string} path The path of the property to get.
	* @returns {Function} Returns the new accessor function.
	*/
	function basePropertyDeep(path) {
		return function(object) {
			return baseGet(object, path);
		};
	}
	module.exports = basePropertyDeep;
}));
//#endregion
//#region node_modules/lodash/property.js
var require_property = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseProperty = require__baseProperty();
	var basePropertyDeep = require__basePropertyDeep();
	var isKey = require__isKey();
	var toKey = require__toKey();
	/**
	* Creates a function that returns the value at `path` of a given object.
	*
	* @static
	* @memberOf _
	* @since 2.4.0
	* @category Util
	* @param {Array|string} path The path of the property to get.
	* @returns {Function} Returns the new accessor function.
	* @example
	*
	* var objects = [
	*   { 'a': { 'b': 2 } },
	*   { 'a': { 'b': 1 } }
	* ];
	*
	* _.map(objects, _.property('a.b'));
	* // => [2, 1]
	*
	* _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
	* // => [1, 2]
	*/
	function property(path) {
		return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
	}
	module.exports = property;
}));
//#endregion
//#region node_modules/lodash/_baseIteratee.js
var require__baseIteratee = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseMatches = require__baseMatches();
	var baseMatchesProperty = require__baseMatchesProperty();
	var identity = require_identity();
	var isArray = require_isArray();
	var property = require_property();
	/**
	* The base implementation of `_.iteratee`.
	*
	* @private
	* @param {*} [value=_.identity] The value to convert to an iteratee.
	* @returns {Function} Returns the iteratee.
	*/
	function baseIteratee(value) {
		if (typeof value == "function") return value;
		if (value == null) return identity;
		if (typeof value == "object") return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
		return property(value);
	}
	module.exports = baseIteratee;
}));
//#endregion
//#region node_modules/lodash/_trimmedEndIndex.js
var require__trimmedEndIndex = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** Used to match a single whitespace character. */
	var reWhitespace = /\s/;
	/**
	* Used by `_.trim` and `_.trimEnd` to get the index of the last non-whitespace
	* character of `string`.
	*
	* @private
	* @param {string} string The string to inspect.
	* @returns {number} Returns the index of the last non-whitespace character.
	*/
	function trimmedEndIndex(string) {
		var index = string.length;
		while (index-- && reWhitespace.test(string.charAt(index)));
		return index;
	}
	module.exports = trimmedEndIndex;
}));
//#endregion
//#region node_modules/lodash/_baseTrim.js
var require__baseTrim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var trimmedEndIndex = require__trimmedEndIndex();
	/** Used to match leading whitespace. */
	var reTrimStart = /^\s+/;
	/**
	* The base implementation of `_.trim`.
	*
	* @private
	* @param {string} string The string to trim.
	* @returns {string} Returns the trimmed string.
	*/
	function baseTrim(string) {
		return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
	}
	module.exports = baseTrim;
}));
//#endregion
//#region node_modules/lodash/toNumber.js
var require_toNumber = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseTrim = require__baseTrim();
	var isObject = require_isObject();
	var isSymbol = require_isSymbol();
	/** Used as references for various `Number` constants. */
	var NAN = NaN;
	/** Used to detect bad signed hexadecimal string values. */
	var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
	/** Used to detect binary string values. */
	var reIsBinary = /^0b[01]+$/i;
	/** Used to detect octal string values. */
	var reIsOctal = /^0o[0-7]+$/i;
	/** Built-in method references without a dependency on `root`. */
	var freeParseInt = parseInt;
	/**
	* Converts `value` to a number.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to process.
	* @returns {number} Returns the number.
	* @example
	*
	* _.toNumber(3.2);
	* // => 3.2
	*
	* _.toNumber(Number.MIN_VALUE);
	* // => 5e-324
	*
	* _.toNumber(Infinity);
	* // => Infinity
	*
	* _.toNumber('3.2');
	* // => 3.2
	*/
	function toNumber(value) {
		if (typeof value == "number") return value;
		if (isSymbol(value)) return NAN;
		if (isObject(value)) {
			var other = typeof value.valueOf == "function" ? value.valueOf() : value;
			value = isObject(other) ? other + "" : other;
		}
		if (typeof value != "string") return value === 0 ? value : +value;
		value = baseTrim(value);
		var isBinary = reIsBinary.test(value);
		return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
	}
	module.exports = toNumber;
}));
//#endregion
//#region node_modules/lodash/toFinite.js
var require_toFinite = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var toNumber = require_toNumber();
	/** Used as references for various `Number` constants. */
	var INFINITY = Infinity;
	var MAX_INTEGER = 17976931348623157e292;
	/**
	* Converts `value` to a finite number.
	*
	* @static
	* @memberOf _
	* @since 4.12.0
	* @category Lang
	* @param {*} value The value to convert.
	* @returns {number} Returns the converted number.
	* @example
	*
	* _.toFinite(3.2);
	* // => 3.2
	*
	* _.toFinite(Number.MIN_VALUE);
	* // => 5e-324
	*
	* _.toFinite(Infinity);
	* // => 1.7976931348623157e+308
	*
	* _.toFinite('3.2');
	* // => 3.2
	*/
	function toFinite(value) {
		if (!value) return value === 0 ? value : 0;
		value = toNumber(value);
		if (value === INFINITY || value === -INFINITY) return (value < 0 ? -1 : 1) * MAX_INTEGER;
		return value === value ? value : 0;
	}
	module.exports = toFinite;
}));
//#endregion
//#region node_modules/lodash/toInteger.js
var require_toInteger = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var toFinite = require_toFinite();
	/**
	* Converts `value` to an integer.
	*
	* **Note:** This method is loosely based on
	* [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to convert.
	* @returns {number} Returns the converted integer.
	* @example
	*
	* _.toInteger(3.2);
	* // => 3
	*
	* _.toInteger(Number.MIN_VALUE);
	* // => 0
	*
	* _.toInteger(Infinity);
	* // => 1.7976931348623157e+308
	*
	* _.toInteger('3.2');
	* // => 3
	*/
	function toInteger(value) {
		var result = toFinite(value), remainder = result % 1;
		return result === result ? remainder ? result - remainder : result : 0;
	}
	module.exports = toInteger;
}));
//#endregion
//#region node_modules/lodash/findLastIndex.js
var require_findLastIndex = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseFindIndex = require__baseFindIndex();
	var baseIteratee = require__baseIteratee();
	var toInteger = require_toInteger();
	var nativeMax = Math.max;
	var nativeMin = Math.min;
	/**
	* This method is like `_.findIndex` except that it iterates over elements
	* of `collection` from right to left.
	*
	* @static
	* @memberOf _
	* @since 2.0.0
	* @category Array
	* @param {Array} array The array to inspect.
	* @param {Function} [predicate=_.identity] The function invoked per iteration.
	* @param {number} [fromIndex=array.length-1] The index to search from.
	* @returns {number} Returns the index of the found element, else `-1`.
	* @example
	*
	* var users = [
	*   { 'user': 'barney',  'active': true },
	*   { 'user': 'fred',    'active': false },
	*   { 'user': 'pebbles', 'active': false }
	* ];
	*
	* _.findLastIndex(users, function(o) { return o.user == 'pebbles'; });
	* // => 2
	*
	* // The `_.matches` iteratee shorthand.
	* _.findLastIndex(users, { 'user': 'barney', 'active': true });
	* // => 0
	*
	* // The `_.matchesProperty` iteratee shorthand.
	* _.findLastIndex(users, ['active', false]);
	* // => 2
	*
	* // The `_.property` iteratee shorthand.
	* _.findLastIndex(users, 'active');
	* // => 0
	*/
	function findLastIndex(array, predicate, fromIndex) {
		var length = array == null ? 0 : array.length;
		if (!length) return -1;
		var index = length - 1;
		if (fromIndex !== void 0) {
			index = toInteger(fromIndex);
			index = fromIndex < 0 ? nativeMax(length + index, 0) : nativeMin(index, length - 1);
		}
		return baseFindIndex(array, baseIteratee(predicate, 3), index, true);
	}
	module.exports = findLastIndex;
}));
//#endregion
//#region source-snapshot/src/utils/getItemInitialDisplayPrices.js
var amount = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
var count = (value) => Math.max(Math.floor(amount(value)), 0);
var hasBenefit = (node) => typeof node?.benefitPrice === "number" && Number.isFinite(node.benefitPrice);
var entry = (price = 0, benefit = false) => ({
	price: Big(price),
	benefit
});
var plus = (a, b) => entry(a.price.plus(b.price), a.benefit || b.benefit);
var minimum = (values) => values.reduce((best, value) => !best || value.price.lt(best.price) || value.price.eq(best.price) && value.benefit && !best.benefit ? value : best, null);
var nodePrice = (node, member, override) => {
	const original = amount(node?.price);
	const benefit = member && hasBenefit(node);
	return entry(benefit ? node.benefitPrice : override ?? original, benefit);
};
var sizeNodes = (item, orderType) => {
	const prices = item.itemPrices || [];
	const matching = prices.filter((p) => p.type === ORDER_TYPE[orderType]);
	return matching.length ? matching : prices.filter((p) => p.type === ORDER_TYPE.ALL);
};
var basePrice = (item, member, orderType, override) => {
	const sizes = sizeNodes(item, orderType);
	const defaultSize = item.defaultItemSizeId != null ? sizes.find((p) => p.sizeId === item.defaultItemSizeId) : void 0;
	return minimum((defaultSize ? [defaultSize] : sizes.length ? sizes : [item]).map((p) => nodePrice(p, member, override)));
};
var optionsFor = (item, categories) => {
	const categoryId = item.categoryId ?? item.oCategoryId;
	let category = categories.find((c) => categoryId != null && String(c.id) === String(categoryId));
	if (category?.isFreeItemCategory) category = categories.find((c) => c.id === item.oCategoryId);
	const options = /* @__PURE__ */ new Map();
	[
		...item.options || [],
		...item.categoryOptions || [],
		...category?.options || []
	].forEach((option) => options.set(option.id, option));
	return [...options.values()];
};
var sectionItem = (id, categories) => {
	for (const category of categories) {
		const item = category.saleItems?.find((sale) => sale.id == id);
		if (item) return {
			...item,
			categoryOptions: [...item.categoryOptions || [], ...category.options || []]
		};
	}
};
var optionValues = (option, member) => option.subOptions?.length ? option.subOptions.map((sub) => {
	const original = Big(sub.addPrice ?? Big(amount(sub.price)).plus(amount(option.price)));
	const parent = nodePrice(option, member);
	const child = nodePrice(sub, member);
	return entry(original.plus(parent.price.minus(amount(option.price))).plus(child.price.minus(amount(sub.price))), parent.benefit || child.benefit);
}) : [nodePrice(option, member)];
var detailPrice = (options, member) => options.reduce((total, option) => {
	const paid = Math.max(count(option.min) - count(option.freeQuantity), 0);
	if (!paid) return total;
	const lowest = minimum(optionValues(option, member));
	return plus(total, entry(lowest.price.times(paid), lowest.benefit));
}, entry());
var potential = (item, options, member, orderType) => sizeNodes(item, orderType).length > 1 || options.some((option) => !nodePrice(option, member).price.eq(0) || optionValues(option, member).some((value) => !value.price.eq(0)));
var sectionPrice = (candidates, required, free, repeated) => {
	if (!required) return entry();
	if (!candidates.length || !repeated && candidates.length < required) return null;
	if (repeated) {
		const freeMin = minimum(candidates.map((c) => c.free));
		const paidMin = minimum(candidates.map((c) => c.paid));
		return plus(entry(freeMin.price.times(free), free > 0 && freeMin.benefit), entry(paidMin.price.times(required - free), required > free && paidMin.benefit));
	}
	let states = /* @__PURE__ */ new Map([["0,0", entry()]]);
	candidates.forEach((candidate) => {
		const next = new Map(states);
		states.forEach((value, key) => {
			const [selected, usedFree] = key.split(",").map(Number);
			if (selected >= required) return;
			const put = (f, cost) => {
				const nextKey = `${selected + 1},${f}`;
				next.set(nextKey, minimum([next.get(nextKey), plus(value, cost)].filter(Boolean)));
			};
			if (usedFree < free) put(usedFree + 1, candidate.free);
			if (selected - usedFree < required - free) put(usedFree, candidate.paid);
		});
		states = next;
	});
	return states.get(`${required},${free}`) || null;
};
function getItemInitialDisplayPrices({ itemInfo, currentOrder, currentCategoryList = [] }) {
	const orderType = currentOrder?.orderType;
	const options = optionsFor(itemInfo, currentCategoryList);
	const calculate = (member) => {
		let result = plus(basePrice(itemInfo, member, orderType), detailPrice(options, member));
		let icon = potential(itemInfo, options, member, orderType);
		if (["FLEXIBLE", "FIXED_SELECTION"].includes(itemInfo.comboType)) for (const section of itemInfo.comboSections || []) {
			const required = [
				"RANGE",
				"EQUALS_TO",
				"MIN_NUM_LIMIT"
			].includes(section.itemSelectionRule) ? count(section.minNumOfSelectionAllowed) : 0;
			const free = Math.min(required, section.priceRule === "FIXED_PRICE" ? required : section.priceRule === "FIXED_UNTIL_MAX" ? count(section.maxNumOfSelectionAllowed) : count(section.freeQuantity));
			const byId = /* @__PURE__ */ new Map();
			for (const sale of section.comboSectionSaleItems || []) {
				const child = sectionItem(sale.saleItemId, currentCategoryList);
				if (!child) continue;
				if (child.itemPrices?.length && !sizeNodes(child, orderType).length) continue;
				const childOptions = optionsFor(child, currentCategoryList);
				const detail = detailPrice(childOptions, member);
				const base = basePrice(child, member, orderType, sale.addPrice);
				const candidate = {
					free: detail,
					paid: plus(base, detail)
				};
				const existing = byId.get(sale.saleItemId);
				byId.set(sale.saleItemId, existing ? {
					free: minimum([existing.free, candidate.free]),
					paid: minimum([existing.paid, candidate.paid])
				} : candidate);
				if (section.priceRule !== "FIXED_PRICE") icon ||= !base.price.eq(0) || potential(child, childOptions, member, orderType);
				else icon ||= potential(child, childOptions, member, orderType);
			}
			const value = sectionPrice([...byId.values()], required, free, section.allowRepeatedItems !== false);
			if (!value) return null;
			result = plus(result, value);
		}
		return {
			...result,
			icon
		};
	};
	const original = calculate(false);
	const member = calculate(true);
	if (!original || !member) return null;
	return {
		price: original.price.toNumber(),
		isShowIcon: original.icon,
		benefitPrice: member.benefit ? member.price.toNumber() : void 0,
		benefitIsShowIcon: member.benefit && member.icon
	};
}
//#endregion
//#region source-snapshot/src/utils/getItemDisplayPrice.js
var import_findLastIndex = /* @__PURE__ */ __toESM(require_findLastIndex());
var createItemLookup = (categoryList) => {
	const index = /* @__PURE__ */ new Map();
	let hasUnusualId = false;
	const getKey = (id) => {
		const numberId = Number(id);
		return Number.isNaN(numberId) ? id : numberId;
	};
	categoryList.forEach((category) => {
		(category.saleItems || []).forEach((item) => {
			if (typeof item.id !== "string" && typeof item.id !== "number") {
				hasUnusualId = true;
				return;
			}
			const key = getKey(item.id);
			if (!index.has(key)) index.set(key, []);
			index.get(key).push({
				item,
				category
			});
		});
	});
	return (id) => {
		if (hasUnusualId || typeof id !== "string" && typeof id !== "number") return getComboItemDetailInfo(id, categoryList);
		const entry = index.get(getKey(id))?.find(({ item }) => item.id == id);
		return entry && {
			...entry.item,
			categoryOptions: entry.category.options || []
		};
	};
};
var getOrderItemPrices = (itemPrices, orderType) => {
	const priceType = {
		DINE_IN: "DINE_IN",
		TO_GO: "TOGO",
		PICK_UP: "PICKUP"
	}[orderType];
	if (!itemPrices || !priceType) return itemPrices;
	const matchingPrices = itemPrices.filter((item) => item.type === priceType);
	return matchingPrices.length ? matchingPrices : itemPrices.filter((item) => item.type === "ALL");
};
var hasOptionPrice = (itemInfo) => {
	const optionHasPrice = (option) => Number(option?.price || 0) !== 0 || option?.subOptions?.some((subOption) => Number(subOption.addPrice ?? Number(subOption.price || 0) + Number(option.price || 0)) !== 0);
	let isOpt = false;
	let isCateyOpt = false;
	let isSizeOpt = false;
	if (itemInfo?.options?.length) isOpt = itemInfo.options.some(optionHasPrice);
	if (itemInfo?.categoryOptions?.length) isCateyOpt = itemInfo.categoryOptions.some(optionHasPrice);
	if (itemInfo?.itemPrices?.length > 1) isSizeOpt = true;
	return isOpt || isCateyOpt || isSizeOpt;
};
var getItemDisplayPrice = ({ itemInfo, isComboType, currentOrder, currentCategoryList = [], sideNavList, sideNavId, currentOrderCombo, useInitialPrice = false, isInFreeItem = false, isPromotionItem = false, isSpecialItem = false }) => {
	if (useInitialPrice && !isComboType && !isInFreeItem && !isPromotionItem && !isSpecialItem && !itemInfo.isFreeItem && !itemInfo.isPromotionItem && !itemInfo.isSpecialItem) {
		const initialPrices = getItemInitialDisplayPrices({
			itemInfo,
			currentOrder,
			currentCategoryList
		});
		if (initialPrices) return initialPrices;
	}
	const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
	const priceRule = sectionInfo?.priceRule;
	const orderItem = currentOrderCombo?.find((item) => item.id === sideNavId)?.items;
	const orderItemQty = orderItem?.length ?? 0;
	const currentOrderItemQty = orderItem?.filter((item) => item.id === itemInfo.id)?.length ?? 0;
	let isShowIcon = hasOptionPrice(itemInfo);
	let price = 0;
	let benefitPrice = itemInfo.benefitPrice;
	if (itemInfo.itemPrices?.length) {
		const defaultItem = itemInfo.defaultItemSizeId != null ? itemInfo.itemPrices.find((priceItem) => priceItem.sizeId === itemInfo.defaultItemSizeId) : void 0;
		const displayItemPrices = defaultItem ? [defaultItem] : itemInfo.itemPrices;
		const minObj = displayItemPrices.reduce((lowest, item) => item.price < lowest.price ? item : lowest);
		if (isComboType) {
			const memberPrice = (item) => Number.isFinite(item.benefitPrice) ? item.benefitPrice : item.price;
			const memberItem = displayItemPrices.reduce((lowest, item) => memberPrice(item) < memberPrice(lowest) || memberPrice(item) === memberPrice(lowest) && Number.isFinite(item.benefitPrice) ? item : lowest);
			benefitPrice = Number.isFinite(memberItem.benefitPrice) ? memberItem.benefitPrice : void 0;
		}
		price = minObj.price;
		isShowIcon = itemInfo.itemPrices.length > 1 || isShowIcon;
	} else price = itemInfo.price;
	if (isComboType) {
		let isFreeComboPosition = false;
		if (priceRule === "FIXED_PRICE") {
			price = 0;
			isShowIcon = hasOptionPrice(itemInfo);
		} else if (priceRule === "FIXED_UNTIL_MAX") {
			if (orderItemQty <= sectionInfo?.maxNumOfSelectionAllowed) {
				price = 0;
				isShowIcon = false;
			} else if (currentOrderItemQty === 0) isShowIcon = true;
			else if (currentOrderItemQty === 1) {
				isShowIcon = orderItem.findIndex((each) => each.id === itemInfo.id) + 1 > sectionInfo?.maxNumOfSelectionAllowed;
				price = isShowIcon ? price : 0;
			} else {
				isShowIcon = (0, import_findLastIndex.default)(orderItem, (each) => each.id === itemInfo.id) + 1 > sectionInfo?.maxNumOfSelectionAllowed;
				price = isShowIcon ? price : 0;
			}
			isFreeComboPosition = !isShowIcon;
		} else if (priceRule === "ADJUSTABLE_PRICE") {
			if (!itemInfo.itemPrices?.length) isShowIcon = hasOptionPrice(itemInfo);
		} else if (sectionInfo?.freeQuantity > 0) {
			if (orderItemQty <= sectionInfo?.freeQuantity) {
				price = 0;
				isShowIcon = false;
			} else if (currentOrderItemQty === 0) isShowIcon = true;
			else if (currentOrderItemQty === 1) {
				isShowIcon = orderItem.findIndex((each) => each.id === itemInfo.id) + 1 > sectionInfo?.freeQuantity;
				price = isShowIcon ? price : 0;
			} else {
				isShowIcon = (0, import_findLastIndex.default)(orderItem, (each) => each.id === itemInfo.id) + 1 > sectionInfo?.freeQuantity;
				price = isShowIcon ? price : 0;
			}
			isFreeComboPosition = !isShowIcon;
		}
		if (itemInfo.itemPrices?.length && isFreeComboPosition) benefitPrice = void 0;
	} else {
		let optionTotalPrice = Big(0);
		let hasPotentialAdjustablePrice = false;
		if ((itemInfo?.comboType === "FIXED_SELECTION" || itemInfo?.comboType === "FLEXIBLE") && itemInfo.comboSections && itemInfo.comboSections.length) {
			let findItem;
			itemInfo.comboSections.forEach((cs) => {
				if (cs.priceRule == "ADJUSTABLE_PRICE") {
					const requestNum = [
						"RANGE",
						"EQUALS_TO",
						"MIN_NUM_LIMIT"
					].includes(cs?.itemSelectionRule) ? cs?.minNumOfSelectionAllowed : 0;
					let orderType = currentOrder.orderType;
					if (cs.comboSectionSaleItems) {
						let allMinPrices = [];
						cs.comboSectionSaleItems.forEach((csItem) => {
							if (!findItem) findItem = createItemLookup(currentCategoryList);
							const sourceItem = findItem(csItem.saleItemId);
							const sItem = sourceItem && {
								...sourceItem,
								itemPrices: getOrderItemPrices(sourceItem.itemPrices, orderType)
							};
							if (sItem) if (sItem && sItem.itemPrices && sItem.itemPrices.length) {
								let minObj = sItem.itemPrices[0];
								sItem.itemPrices.forEach((p) => {
									if (p.price < minObj.price) minObj = p;
								});
								allMinPrices.push(minObj);
								hasPotentialAdjustablePrice = hasPotentialAdjustablePrice || Number(minObj.price || 0) > 0 || hasOptionPrice(sItem);
							} else {
								const itemPrice = Number(sItem.price || 0);
								allMinPrices.push({ price: itemPrice });
								hasPotentialAdjustablePrice = hasPotentialAdjustablePrice || itemPrice > 0 || hasOptionPrice(sItem);
							}
						});
						if (allMinPrices.length > 0) {
							let minObj = allMinPrices[0];
							allMinPrices.forEach((p) => {
								if (p.price < minObj.price) minObj = p;
							});
							optionTotalPrice = optionTotalPrice.plus(minObj.price * requestNum);
						}
					}
				}
			});
			isShowIcon = hasPotentialAdjustablePrice || optionTotalPrice.gt(0) || isShowIcon;
			price = optionTotalPrice.plus(price).toNumber();
		}
	}
	return {
		price,
		isShowIcon,
		...isComboType && {
			benefitPrice: priceRule === "FIXED_PRICE" ? void 0 : benefitPrice,
			benefitIsShowIcon: priceRule !== "FIXED_PRICE" && Boolean(itemInfo.itemPrices?.length) && Number.isFinite(benefitPrice) && isShowIcon
		}
	};
};
//#endregion
//#region source-snapshot/src/utils/localExchangePurchase.js
var getNormalOrderItems = (itemList = []) => itemList.filter((item) => !item?.isLocalExchangePurchaseItem);
var getExchangePurchaseDiscountablePrice = (item, rule) => {
	const unitPrice = Big(getItemPrice(item) || 0);
	const sectionDetail = item.sectionDetail || [];
	if (!sectionDetail.length) return unitPrice;
	const selectedSections = rule.activityRule?.giftsDishes || [];
	const excludedSectionIds = new Set((item.comboSections || []).filter((section) => !selectedSections.includes(`${item.id}${section.id}`)).map((section) => section.id));
	const excludedPrice = sectionDetail.reduce((total, section) => {
		if (section.id === -2 || section.id === -3) return (section.options || []).reduce((price, option) => price.plus(Big(option.price).times(option.quantity)), total);
		if (excludedSectionIds.has(section.id)) return (section.items || []).reduce((price, child) => price.plus(Big(getItemPrice(child)).times(child.quantity)), total);
		return total;
	}, Big(0));
	return unitPrice.minus(excludedPrice);
};
var getRequiredOptionMinimumPrice = (item, categoryList = []) => {
	const categoryId = item.categoryId ?? item.oCategoryId;
	const categoryOptions = categoryList.find((category) => categoryId != null && String(category.id) === String(categoryId))?.options || [];
	const optionMap = /* @__PURE__ */ new Map();
	[...item.options || [], ...categoryOptions].forEach((option) => {
		optionMap.set(option.id, option);
	});
	return [...optionMap.values()].reduce((total, option) => {
		const requiredQuantity = Math.max(Number(option.min || 0), 0);
		const paidQuantity = Math.max(requiredQuantity - Number(option.freeQuantity || 0), 0);
		if (!paidQuantity) return total;
		const prices = option.subOptions?.length ? option.subOptions.map((subOption) => Number(subOption.addPrice ?? Number(subOption.price || 0) + Number(option.price || 0))) : [Number(option.price || 0)];
		const minimumPrice = prices.length ? Math.min(...prices) : 0;
		return total.plus(Big(minimumPrice).times(paidQuantity));
	}, Big(0));
};
var getExchangePurchaseDisplayPrices = ({ item, selectedItem, rule, currentOrder, categoryList = [] }) => {
	const displayPrice = (itemInfo) => getItemDisplayPrice({
		itemInfo,
		isComboType: false,
		currentOrder,
		currentCategoryList: categoryList
	}).price || 0;
	const originalPrice = selectedItem ? Big(getItemPrice({
		...selectedItem,
		quantity: 1
	}) || 0) : Big(displayPrice(item)).plus(getRequiredOptionMinimumPrice(item, categoryList));
	const selectedSections = rule.activityRule?.giftsDishes || [];
	const discountableDisplayItem = item.comboSections?.length ? {
		...item,
		comboSections: item.comboSections.filter((section) => selectedSections.includes(`${item.id}${section.id}`))
	} : item;
	const discountedItem = applyExchangePurchaseDiscount(selectedItem ? {
		...selectedItem,
		quantity: 1
	} : {
		price: rule.activityRule?.discountType === "rateDiscount" ? displayPrice(discountableDisplayItem) : originalPrice.toNumber(),
		quantity: 1
	}, rule);
	return {
		originalPrice: originalPrice.toFixed(2),
		discountedPrice: Big(originalPrice).minus(discountedItem.discount || 0).toFixed(2)
	};
};
var getPromotionModalDisplayPrice = ({ isPromotionItem, isExchangePurchase, totalPrice }) => isPromotionItem && !isExchangePurchase ? "0.00" : totalPrice;
var isItemRuleSatisfied = (rule, itemList) => {
	const { buyDishes = [], buyNumber, buyType } = rule.activityRule || {};
	const requiredQuantity = Number(buyNumber);
	if (!buyDishes.length || !requiredQuantity) return false;
	const quantities = getNormalOrderItems(itemList).reduce((result, item) => {
		if (!buyDishes.includes(item.id)) return result;
		result[item.id] = (result[item.id] || 0) + Number(item.quantity || 0);
		return result;
	}, {});
	if (buyType === "identical") return Object.values(quantities).some((quantity) => quantity >= requiredQuantity);
	return Object.values(quantities).reduce((total, quantity) => total + quantity, 0) >= requiredQuantity;
};
var getSatisfiedBuyGiftRules = (rules = [], itemList = []) => rules.filter((rule) => isItemRuleSatisfied(rule, itemList));
var getSatisfiedExchangePurchaseRules = (rules = [], itemList = [], orderAmount = 0) => rules.filter((rule) => {
	const activityRule = rule.activityRule || {};
	if (activityRule.conditionType === "orderAmount") return Number(orderAmount) >= Number(activityRule.satisfyPrice);
	if (activityRule.conditionType === "itemQuantity") return isItemRuleSatisfied(rule, itemList);
	return false;
});
var applyExchangePurchaseDiscount = (item, rule) => {
	const { discountType, discountNumber } = rule.activityRule || {};
	const quantity = Number(item.quantity || 1);
	const unitPrice = Big(getItemPrice(item) || 0);
	const totalPrice = Number(unitPrice.times(quantity).toFixed(2));
	const configuredDiscount = Number(discountNumber || 0);
	const rawDiscount = discountType === "fixDiscount" ? Big(configuredDiscount).times(quantity) : Big(getExchangePurchaseDiscountablePrice(item, rule).times(Big(configuredDiscount).div(100)).toFixed(2)).times(quantity);
	const discount = Number((rawDiscount.gt(totalPrice) ? Big(totalPrice) : rawDiscount).toFixed(2));
	const discountRate = discountType === "rateDiscount" ? configuredDiscount : totalPrice > 0 ? Number(Big(discount).div(totalPrice).times(100).toFixed(4)) : 0;
	return {
		...item,
		totalPrice,
		isLocalExchangePurchaseItem: true,
		exchangePurchaseRuleId: rule.id,
		exchangePurchaseRule: rule,
		discountID: -1,
		discountRateType: 1,
		discountName: "promotion discount",
		discountRate,
		discount
	};
};
var getExchangePurchaseUnitDiscount = (item) => {
	const quantity = Number(item.quantity || 1);
	return Number(Big(item.discount || 0).div(quantity).toFixed(2));
};
var getExchangePurchaseDiscountedUnitPrice = (item) => {
	return Big(getItemPrice(item) || 0).minus(getExchangePurchaseUnitDiscount(item)).toFixed(2);
};
var reapplyExchangePurchaseDiscount = (item) => {
	if (!item?.isLocalExchangePurchaseItem || !item.exchangePurchaseRule) return item;
	return applyExchangePurchaseDiscount(item, item.exchangePurchaseRule);
};
//#endregion
//#region source-snapshot/src/utils/handleResolveList.js
var sortById = (beforeSortList) => {
	const groups = [];
	const groupById = /* @__PURE__ */ new Map();
	beforeSortList.forEach((item) => {
		const { id } = item;
		let group = Number.isNaN(id) ? void 0 : groupById.get(id);
		if (!group) {
			group = [];
			groups.push(group);
			if (!Number.isNaN(id)) groupById.set(id, group);
		}
		group.push(item);
	});
	return groups.map((items) => {
		const noDiscount = items.filter((item) => !item.discount).sort((a, b) => b.totalPrice - a.totalPrice);
		const discount = items.filter((item) => item.discount).sort((a, b) => b.realPrice - a.realPrice);
		return [...noDiscount, ...discount];
	}).flat();
};
var countOptionPrice = (itemInfo) => {
	return itemInfo.sectionDetail.filter((section) => section.id === -2 || section.id === -3).reduce((pre, cur) => {
		const { options } = cur;
		const singleOptionPrice = options.reduce((acc, nex) => {
			const { price, quantity } = nex;
			const itemPrice = Big(price).times(quantity);
			return Big(acc).plus(itemPrice);
		}, 0);
		return Big(pre).plus(singleOptionPrice);
	}, 0);
};
var BUY_DISCOUNT_PRIORITY = {
	HIGHEST: "highest",
	LOWEST: "lowest"
};
var getSecondHalfInfo = (buyDiscountRule, id, priority = BUY_DISCOUNT_PRIORITY.HIGHEST) => {
	const rules = buyDiscountRule.filter((info) => info.activityRule.buyDishes.includes(id));
	if (rules.length < 2) return rules[0];
	const direction = priority === BUY_DISCOUNT_PRIORITY.LOWEST ? 1 : -1;
	return rules.map((rule, index) => ({
		rule,
		index
	})).sort((a, b) => {
		return (Number(a.rule.activityRule.giftsDiscount) - Number(b.rule.activityRule.giftsDiscount)) * direction || a.index - b.index;
	})[0].rule;
};
var getNoDiscountSubDish = (item) => {
	const { comboSections, sectionDetail, secondHalfInfo, id } = item;
	if (comboSections?.length > 0 && sectionDetail?.length > 0 && secondHalfInfo) {
		const { activityRule: { buyDishes } } = secondHalfInfo;
		return sectionDetail.filter((section) => comboSections.filter((subDish) => !buyDishes.includes(`${id}${subDish.id}`))?.map((subDishGroup) => subDishGroup.id)?.includes(section.id));
	}
	return [];
};
var countNoDiscountSubDish = (item) => {
	const noDiscountSubDish = getNoDiscountSubDish(item);
	if (noDiscountSubDish?.length > 0) return noDiscountSubDish.reduce((pre, cur) => {
		const curPrice = cur.items?.reduce((price, item) => {
			const itemPrice = Big(getItemPrice(item)).times(item.quantity);
			return Big(price).plus(itemPrice);
		}, 0);
		return Big(pre).plus(curPrice);
	}, 0);
	return Big(0);
};
var countRealPrice = (item) => {
	return item.sectionDetail.length > 0 ? Number(Big(item.totalPrice).minus(countOptionPrice(item)).minus(countNoDiscountSubDish(item).toFixed(2))) : item.totalPrice;
};
var sortItemsByRealPrice = (items, getRealPrice) => {
	return items.map((each) => {
		return {
			...each,
			realPrice: getRealPrice(each)
		};
	}).sort((a, b) => {
		if (a.realPrice === b.realPrice) return a.totalPrice - b.totalPrice;
		return a.realPrice - b.realPrice;
	});
};
var applyPromotionDiscount = (item, secondHalfInfo, getRealPrice) => {
	item.discountRate = secondHalfInfo.activityRule.giftsDiscount;
	item.discountID = -1;
	item.discountRateType = 1;
	item.discountName = "promotion discount";
	const actualRate = Big(item.discountRate).div(100).toNumber();
	const realPrice = getRealPrice(item);
	item.realPrice = realPrice;
	item.discount = Number(Big(realPrice).times(actualRate).toFixed(2));
	item.isHasNoDiscountSubDish = getNoDiscountSubDish(item)?.length > 0;
};
var handleResolveList = (itemList, buyDiscountRule, isSkipPromotionCalculation = false, buyDiscountPriority = BUY_DISCOUNT_PRIORITY.HIGHEST) => {
	const unitPrices = [];
	const cloneItemList = (0, import_cloneDeep.default)(itemList).map((each, index) => {
		delete each.discountRate;
		delete each.discount;
		delete each.tempId;
		delete each.discountID;
		delete each.discountRateType;
		delete each.isHasNoDiscountSubDish;
		const unitPrice = getItemPrice(each);
		unitPrices[index] = unitPrice;
		each.totalPrice = Number(Big(unitPrice).times(each.quantity).toFixed(2));
		return each;
	});
	if (isSkipPromotionCalculation) return cloneItemList.filter((item) => !item.isLocalExchangePurchaseItem).map((item, sequence) => ({
		...item,
		sequence
	}));
	const realPrices = /* @__PURE__ */ new WeakMap();
	const getRealPrice = (item) => {
		if (!realPrices.has(item)) realPrices.set(item, countRealPrice(item));
		return realPrices.get(item);
	};
	const promotionQuantities = /* @__PURE__ */ new Map();
	const getPromotionQuantity = (rule) => {
		if (!promotionQuantities.has(rule)) promotionQuantities.set(rule, cloneItemList.filter((item) => rule.activityRule.buyDishes.includes(item.id)).reduce((total, item) => total + item.quantity, 0));
		return promotionQuantities.get(rule);
	};
	const newItemList = cloneItemList.reduce((pre, cur, index) => {
		const secondHalfInfo = getSecondHalfInfo(buyDiscountRule, cur.id, buyDiscountPriority);
		const orderOnlyOneBuyDiscount = secondHalfInfo?.activityRule?.giftsDiscountRule === "1" && getPromotionQuantity(secondHalfInfo) >= secondHalfInfo?.activityRule?.buyNumber;
		if (secondHalfInfo && secondHalfInfo?.activityRule?.giftsDiscountRule !== "1" && cur.quantity > 1) {
			for (let i = 0; i < cur.quantity; i++) pre.push({
				...cur,
				quantity: 1,
				totalPrice: unitPrices[index],
				secondHalfInfo,
				tempId: nanoid()
			});
			return pre;
		}
		if (secondHalfInfo && secondHalfInfo?.activityRule?.giftsDiscountRule === "1" && orderOnlyOneBuyDiscount) {
			for (let i = 0; i < cur.quantity; i++) pre.push({
				...cur,
				quantity: 1,
				totalPrice: unitPrices[index],
				secondHalfInfo,
				tempId: nanoid()
			});
			return pre;
		}
		pre.push({
			...cur,
			totalPrice: cur.totalPrice,
			secondHalfInfo,
			tempId: nanoid()
		});
		return pre;
	}, []);
	return sortById(newItemList.map((item) => {
		const { secondHalfInfo } = item;
		if (!secondHalfInfo) return item;
		if (secondHalfInfo?.activityRule?.giftsDiscountRule === "1") {
			const sameSecondHalfItems = newItemList.filter((each) => each.secondHalfInfo?.id === secondHalfInfo.id && (secondHalfInfo.activityRule.buyType === "identical" ? each.id === item.id : each.secondHalfInfo?.activityRule?.buyType === "random"));
			if (sameSecondHalfItems.length >= secondHalfInfo.activityRule.buyNumber) {
				const [lowestPriceDiscountItem] = sortItemsByRealPrice(sameSecondHalfItems, getRealPrice);
				if (item.tempId === lowestPriceDiscountItem.tempId) applyPromotionDiscount(item, secondHalfInfo, getRealPrice);
			}
		} else {
			let checkDiscountItems = [];
			if (secondHalfInfo.activityRule.buyType === "identical") checkDiscountItems = newItemList.filter((each) => each.id === item.id);
			else checkDiscountItems = newItemList.filter((each) => each.secondHalfInfo?.id === secondHalfInfo.id && each.secondHalfInfo?.activityRule?.buyType === "random");
			const sortItemsByPrice = sortItemsByRealPrice(checkDiscountItems, getRealPrice);
			const needDiscountQuantity = Math.floor(sortItemsByPrice.length / Number(secondHalfInfo.activityRule.buyNumber));
			for (let i = 0; i < needDiscountQuantity; i++) if (sortItemsByPrice[i].tempId === item.tempId) applyPromotionDiscount(item, secondHalfInfo, getRealPrice);
		}
		return item;
	}).map(reapplyExchangePurchaseDiscount)).map((each, i) => {
		return {
			...each,
			sequence: i
		};
	});
};
//#endregion
//#region source-snapshot/src/utils/checkCRMType.js
var checkCRMType = (allSysConfig) => {
	const { CRM_SERVICE_ENABLED, POS_CRM_SERVICE_ENABLED, CRM_INTEGRATION_SERVICE_ENABLED } = allSysConfig;
	let crm = 0;
	if ((POS_CRM_SERVICE_ENABLED || CRM_SERVICE_ENABLED) === "true") crm = 1;
	if (CRM_INTEGRATION_SERVICE_ENABLED === "true") crm = 2;
	return crm;
};
//#endregion
//#region source-snapshot/src/utils/getRewardDiscountByRules.js
var getRewardDiscountByRules = ({ itemList, rules }) => {
	const t = native_i18n_default.t;
	const discountRuleSet = ["byPercentageOff", "byFixedAmount"];
	const itemListWithPrice = itemList.map((item) => {
		return {
			...item,
			itemTotalPrice: Number(floatNumberRounding(Big(getItemPrice(item)).toFixed(2)))
		};
	});
	let actualDiscount = 0;
	return rules.filter((each) => discountRuleSet.includes(each.redeemRule.strategy)).map((rule) => {
		const { redeemRule } = rule;
		const { strategy, eligibility, parameters } = redeemRule;
		const { items } = eligibility.object;
		const inValidItemIds = items.map((item) => item.itemId);
		const totalDiscountPrice = itemListWithPrice.filter((orderItem) => !inValidItemIds.includes(orderItem.id)).reduce((pre, cur) => {
			return Big(pre).plus(Big(cur.itemTotalPrice || 0).times(Big(cur.quantity || 0)).toFixed(2));
		}, 0);
		if (strategy === "byPercentageOff") {
			const { discount, maxDiscount } = parameters;
			const discountRate = Number(Big(discount).div(100).toFixed(2));
			const discountNum = Number(Big(totalDiscountPrice).times(discountRate).toFixed(2));
			if (maxDiscount) actualDiscount = discountNum > maxDiscount ? maxDiscount : discountNum;
			else actualDiscount = discountNum;
		}
		if (strategy === "byFixedAmount") {
			const { discount } = parameters;
			actualDiscount = Number(totalDiscountPrice) > discount ? discount : Number(totalDiscountPrice);
		}
		const points = parameters.points;
		const value = strategy === "byFixedAmount" ? `$${parameters.discount}` : `${parameters.discount}% OFF`;
		return {
			...rule,
			actualDiscount,
			rewardRule: rule,
			itemPoints: points,
			crmIntegrationRule: { isValid: true },
			name: t("crm_discount_name", {
				points,
				value
			})
		};
	}).sort((a, b) => a.redeemRule.parameters.points - b.redeemRule.parameters.points);
};
//#endregion
//#region source-snapshot/src/utils/memberCheckout.js
var canUseMemberPrice = (state) => checkCRMType(state.allSysConfig || {}) === 1 && state.avocado?.outletInfo?.enabled !== 1 && !!state.crm?.memberCRMInfo?.userId && (hasActiveMemberPrivilege(state.crm) || hasPendingMembershipCard(state));
var getMemberPricingContext = (state) => JSON.stringify([
	checkCRMType(state.allSysConfig || {}),
	state.avocado?.outletInfo?.enabled,
	state.crm?.memberCRMInfo?.userId,
	state.crm?.memberCRMInfo?.id,
	canUseMemberPrice(state),
	state.crm?.isHasBenefit,
	state.crm?.memberCRMInfo?.privileges?.map((privilege) => [
		privilege?._id,
		privilege?.id,
		privilege?.status,
		privilege?.expireTime
	]),
	state.currentOrder?.itemList?.filter(isMembershipCard).map((card) => [
		card.id,
		card.privilegeId,
		card.membershipUserId,
		card.quantity,
		card.price
	]),
	state.currentOrder?.orderType,
	state.currentOrder?.paymentType
]);
var getMemberActivityItemsContext = (state, items = state.currentOrder.itemList) => {
	const memberPrice = canUseMemberPrice(state);
	return JSON.stringify(items.map((original) => {
		const item = memberPrice ? resolveItemMemberPrices(original).item : original;
		const size = item.sectionDetail?.find((section) => section.id === -1)?.sizeInfo;
		return [
			item.id,
			item.oCategoryId || item.categoryId,
			item.quantity,
			size?.sizeId,
			size?.price ?? item.price ?? 0,
			getItemPrice(item),
			item.manualSelectRewardDiscount
		];
	}).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
};
var submittedActivityContexts = /* @__PURE__ */ new WeakMap();
var rememberMemberActivityOrder = (orderData, state) => {
	submittedActivityContexts.set(orderData, {
		pricing: getMemberPricingContext(state),
		items: getMemberActivityItemsContext(state),
		promotionId: state.promotion?.itemValidPromotion?.find((rule) => rule.isSelected)?.promotion?.id
	});
};
var copyMemberActivityOrderContext = (source, target) => {
	const context = submittedActivityContexts.get(source);
	if (context) submittedActivityContexts.set(target, context);
	return target;
};
var hasStaleMemberActivity = (state, orderData) => {
	const selected = state.promotion?.itemValidPromotion?.find((rule) => rule.isSelected);
	const submitted = orderData && submittedActivityContexts.get(orderData);
	if (!selected && submitted?.promotionId == null) return false;
	const context = getMemberPricingContext(state);
	const itemsContext = getMemberActivityItemsContext(state);
	if (submitted && (submitted.pricing !== context || submitted.items !== itemsContext || submitted.promotionId !== selected?.promotion?.id)) return true;
	if (!selected) return false;
	if (selected.validateInfo?.result?.result?.discounts?.some((discount) => discount.amount > 0) && !state.currentOrder.itemList.some((item) => item.promotionRewardItem && item.itemDiscountInfo?.some((discount) => discount.id === selected.promotion.id))) return true;
	return state.currentOrder.itemList.some((item) => item.promotionRewardItem && (item.memberPricingContext != null && item.memberPricingContext !== context || item.memberPricingItemsContext != null && item.memberPricingItemsContext !== itemsContext));
};
var getMemberActivityState = (state, { useMemberPrice = true, itemList: sourceItems = state.currentOrder.itemList } = {}) => {
	const memberPrice = useMemberPrice && canUseMemberPrice(state);
	const context = getMemberPricingContext(state);
	const itemsContext = getMemberActivityItemsContext(state, sourceItems);
	let changed = sourceItems !== state.currentOrder.itemList;
	const itemList = sourceItems.map((original) => {
		let item = original;
		if (item.promotionRewardItem && (item.memberPricingContext != null && item.memberPricingContext !== context || item.memberPricingItemsContext != null && item.memberPricingItemsContext !== itemsContext)) item = {
			...item,
			promotionRewardItem: void 0,
			actualDiscount: void 0,
			itemDiscountInfo: void 0,
			orderDiscountInfo: void 0,
			promotionRewardInfo: void 0,
			memberPricingContext: void 0,
			memberPricingItemsContext: void 0
		};
		if (memberPrice) item = resolveItemMemberPrices(item).item;
		changed ||= item !== original;
		return item;
	});
	let crm = state.crm;
	const selected = crm?.selectedDiscount;
	if (checkCRMType(state.allSysConfig || {}) === 1 && state.avocado?.outletInfo?.enabled !== 1 && ["byPercentageOff", "byFixedAmount"].includes(selected?.redeemRule?.strategy)) {
		const recalculated = getRewardDiscountByRules({
			itemList,
			rules: [selected]
		})[0];
		if (selected.actualDiscount !== recalculated.actualDiscount) crm = {
			...crm,
			selectedDiscount: recalculated
		};
	}
	if (!changed && crm === state.crm) return state;
	return {
		...state,
		crm,
		currentOrder: {
			...state.currentOrder,
			itemList
		}
	};
};
var getMemberCheckoutState = (state, { useMemberPrice = true } = {}) => {
	const activityState = getMemberActivityState(state, { useMemberPrice });
	if (!useMemberPrice || !canUseMemberPrice(state)) return activityState;
	return {
		...activityState,
		currentOrder: {
			...activityState.currentOrder,
			itemList: handleResolveList(activityState.currentOrder.itemList, state.promotion?.buyDiscountRule || [], state.promotion?.isSkipPromotionCalculation)
		}
	};
};
//#endregion
//#region source-snapshot/src/utils/CRMIntegration/marketSDK.js
var ChargeType = {
	SERVICE_FEE: "serviceFee",
	DELIVERY_FEE: "deliveryFee",
	OTHER: "other",
	DEFAULT: "other"
};
var getOrderData = async () => {
	const state = native_store_default?.getState();
	return {
		state,
		order: await generateSubmitOrderObj(state, { activityPricing: true }),
		orderInfo: await getOrderInfoObj(state, { activityPricing: true })
	};
};
var buildDiscountList = (state) => {
	const discountList = [];
	if (Object.keys(state?.crm?.selectedDiscount).length > 0) discountList.push({
		name: state.crm.selectedDiscount.displayName,
		id: state.crm.selectedDiscount._id,
		amount: state.crm.selectedDiscount.actualDiscount,
		type: state.crm.selectedDiscount.type,
		extraInfo: { enableBenefit: true }
	});
	return discountList;
};
var buildChargeList = (state, order) => {
	return state.togoList.map((item) => {
		if (Object.keys(item.select).length > 0) {
			const chargeItem = order?.orderCharges?.find((e) => e.chargeName === item.name.replace(" ", "-"));
			return {
				type: ChargeType[item?.select?.type],
				amount: chargeItem?.charge,
				name: item?.name
			};
		}
	}).filter((item) => item !== void 0);
};
var resolveDishList = ({ data, merchantId, productLine, state }) => {
	const memberPrice = state && canUseMemberPrice(state);
	return (memberPrice ? getMemberActivityState(state, { itemList: data }).currentOrder.itemList : data).map((item) => {
		const info = {
			itemName: item.name,
			id: item.uniqueItemTempId,
			itemId: item.id,
			merchantId,
			productLine,
			categoryId: (item.oCategoryId || item.categoryId)?.toString() || null,
			quantity: item.quantity,
			itemPrice: memberPrice ? item.sectionDetail?.find((o) => o.id === -1)?.sizeInfo?.price ?? item.price ?? 0 : item.price || item.sectionDetail?.find((o) => o.id === -1)?.sizeInfo?.price || 0,
			itemTotalPrice: memberPrice ? getItemPrice(item) : Number(Big(item.totalPrice ?? item.totalAmount).div(item.quantity).toFixed(2)),
			sizeId: item.sectionDetail?.find((o) => o.id === -1)?.sizeInfo?.sizeId,
			discounts: []
		};
		if (item.manualSelectRewardDiscount) info.discounts = item.manualSelectRewardDiscount;
		return info;
	});
};
var buildOrderItemList = ({ orderItems, productLine, state, discountList, chargeList, extraItems, allItems }) => {
	if (Array.isArray(allItems)) return resolveDishList({
		data: allItems,
		merchantId: state.merchantProfile?.merchantId,
		productLine,
		state
	});
	const extraItemsData = extraItems?.length > 0 ? resolveDishList({
		data: extraItems,
		merchantId: state.merchantProfile?.merchantId,
		productLine,
		state
	}) : [];
	return orderItems?.filter((e) => {
		const { isCRMIntegrationFreeItem, isCrmRewardItem } = e;
		return !isCRMIntegrationFreeItem && !isCrmRewardItem;
	}).map((item, index) => {
		const discounts = item.manualSelectRewardDiscount || discountList.map((each) => {
			return {
				...each,
				extraInfo: { enableBenefit: true }
			};
		}) || [];
		return {
			/** 商品名称 */
			itemName: item.displayName,
			/** 唯一ID */
			id: item.uniqueItemTempId || v4(),
			/** 商品ID */
			itemId: item.saleItemId,
			/** 商户ID */
			merchantId: state.merchantProfile?.merchantId,
			/** 产品线 */
			productLine,
			/** 分类ID */
			categoryId: (item.oCategoryId || item.categoryId)?.toString() || null,
			/** 分类名称 */
			categoryName: item.categoryName || null,
			/** 商品数量 */
			quantity: item.quantity,
			/** 尺寸ID */
			sizeId: item.crmIntegrationSizeId || null,
			/** 尺寸名称 */
			sizeName: item.size || null,
			/** 是否为奖励商品 */
			isReward: item.rewardItem,
			/** 商品单价(不包含组合和调味) */
			itemPrice: item.price,
			/** 商品总价(包含组合和调味) */
			itemTotalPrice: Number(Big(item.totalAmount ?? item.price).div(item.quantity).toFixed(2)),
			/** 折扣列表 */
			discounts,
			/** 加收费用列表 */
			charges: chargeList
		};
	}).concat(extraItemsData);
};
var calculateTotalAmount = (orderInfo, order) => {
	const subTotal = orderInfo?.orderSubtotal;
	const totalTax = orderInfo?.orderTaxTotal;
	const charge = orderInfo?.chargeTotal;
	const togoTotal = orderInfo?.togoTotal;
	const rewardDiscount = order?.rewardDiscount || 0;
	const orderDiscount = orderInfo?.orderDiscount;
	return Big(subTotal).plus(totalTax).plus(charge).plus(togoTotal).minus(rewardDiscount).minus(orderDiscount).toFixed(2);
};
var formatOrderStructure = async ({ extraItems, allItems }) => {
	const { state, order, orderInfo } = await getOrderData();
	if (!order?.order) return {};
	const { order: { productLine, type, orderItems } } = order;
	const discountList = await buildDiscountList(state);
	const chargeList = await buildChargeList(state, order);
	const orderItemList = await buildOrderItemList({
		orderItems,
		productLine,
		state,
		discountList,
		chargeList,
		extraItems,
		allItems
	});
	calculateTotalAmount(orderInfo, order);
	const isItemHasDiscountList = orderItemList.find((e) => e.discounts?.length > 0);
	const data = {
		orderType: type,
		paymentType: state?.currentOrder?.paymentType || void 0,
		discounts: [],
		merchantId: state.merchantProfile?.merchantId,
		orderItems: orderItemList,
		orderTime: (/* @__PURE__ */ new Date()).toISOString(),
		channel: null,
		charges: chargeList,
		productLine,
		member: { memberId: state?.crm?.memberCRMInfo?.id || state?.crm?.memberCRMInfo?.userId },
		memberScope: "ALL"
	};
	if (isItemHasDiscountList) data.discounts = isItemHasDiscountList.discounts;
	return data;
};
var MarketSDK = class {
	constructor() {
		this.api = null;
		this.isCreatingApi = false;
	}
	async createApi() {
		if (this.api || this.isCreatingApi) return;
		this.isCreatingApi = true;
		const { state } = await getOrderData();
		const globalMarketApi = window.marketAPI || window.MarketSDK;
		this.api = globalMarketApi({
			environment: "dev",
			cache: {
				ttl: 600,
				prefix: "promo",
				maxSize: 5e3
			},
			monitor: { enabled: false },
			business: {
				type: "KIOSK",
				merchantId: state.merchantProfile?.merchantId
			}
		});
		this.isCreatingApi = false;
	}
	async getCouponPlugin({ coupons, metas, extraItems, allItems }) {
		const formattedOrder = await formatOrderStructure({
			extraItems,
			allItems
		});
		const scopedCoupons = coupons.map((coupon) => ({
			...coupon,
			couponTemplate: normalizePromotionRule(coupon.couponTemplate, { merchantId: formattedOrder.merchantId })
		}));
		if (!this.api) await this.mount();
		const couponService = this.api?.getCouponPlugin();
		return {
			MarketGetOrderCoupons: async () => {
				return {
					...await couponService?.getOrderCoupons(formattedOrder, scopedCoupons, metas),
					formattedOrder
				};
			},
			MarketValidateCoupons: async () => {
				return await couponService?.validateCoupons(formattedOrder, scopedCoupons, metas);
			}
		};
	}
	async getPromotionPlugin() {
		if (!this.api) await this.mount();
		const promotionService = this.api?.getPromotionPlugin();
		return {
			GetItemMatchedCampaign: async ({ orderItemList, promotionList, orderType, appointItemFlag, merchantId }) => {
				return await promotionService?.matchItemPromotion({
					orderItemList,
					promotionList,
					productLine: "KIOSK",
					channel: null,
					orderType,
					appointItemFlag,
					merchantId
				});
			},
			GetItemValidateStatus: async ({ rules, metas, allItems }) => {
				const formattedOrder = await formatOrderStructure({ allItems });
				return await promotionService?.getOrderRules(formattedOrder, rules, metas);
			},
			AddOnItem: async ({ promotionResult, itemList, promotionList, appointPromotionId, allItems }) => {
				const order = await formatOrderStructure({ allItems });
				if (promotionList.find((each) => each.type === "amountGiftItem" || each.type === "orderItemGiftItem")) delete order.discounts;
				return (await promotionService?.recommendOrderPromotion({
					order,
					promotionResult,
					itemList,
					promotionList,
					appointPromotionId,
					needPromotionCodes: true
				}))?.filter((e) => {
					const { recommendType, promotion, orderItemList } = e;
					if (recommendType === "NONE") return true;
					const { type } = promotion;
					if (!GIFT_PROMOTION_TYPE.includes(type)) return true;
					if (RECOMMEND_SUCCESS_TYPE.includes(recommendType)) return true;
					if (GIFT_PROMOTION_INVALID_TYPE.includes(recommendType)) {
						const orderItemInfo = order?.orderItems?.map((i) => ({
							itemId: i.itemId,
							sizeId: i.sizeId
						}));
						return orderItemList.filter((e) => {
							const { itemId, itemSizeIds } = e;
							if (!itemSizeIds?.length) return orderItemInfo.find((i) => i.itemId === Number(itemId));
							return orderItemInfo.find((i) => i.itemId === Number(itemId) && itemSizeIds.includes(String(i.sizeId)));
						})?.length > 0;
					}
				});
			}
		};
	}
	async mount() {
		if (this.api) return;
		await this.createApi();
		await this.api?.init();
	}
	async unMount() {
		if (!this.api) return;
		await this.api?.destroy();
		this.api = null;
	}
};
var crmIntegrationSDK = new MarketSDK();
//#endregion
//#region source-snapshot/src/utils/PromotionCenterIntegration/checkCloudPromotion.js
var makeUpItemList = (itemList, merchantId) => {
	const memberPrice = canUseMemberPrice(native_store_default.getState());
	const priceFor = (node) => memberPrice && Number.isFinite(node.benefitPrice) ? node.benefitPrice : node.price;
	return itemList.map((each) => {
		const candidatePrice = isMembershipCard(each) ? (node) => node.price : priceFor;
		let itemPrice = candidatePrice(each);
		let itemSizeIds = null;
		if (each.itemPrices?.length) {
			itemPrice = each.itemPrices.map(candidatePrice).sort((a, b) => a - b)[0];
			itemSizeIds = each.itemPrices.map((size) => String(size.sizeId));
		}
		return {
			itemId: String(each.id),
			itemPrice,
			itemSizeIds,
			categoryId: (each.oCategoryId || each.categoryId)?.toString() || null,
			itemCenter: each.itemCenter,
			productLine: "KIOSK",
			merchantId
		};
	});
};
var getPromotionContext = (overrides = {}) => {
	const { merchantProfile, currentOrder } = native_store_default.getState();
	return {
		merchantId: merchantProfile?.merchantId,
		orderType: currentOrder?.orderType,
		...overrides
	};
};
var getPromotionResources = () => Object.values(native_store_default.getState().menuItemList || {}).filter((item) => item?.id != null && !item.isFreeItem && !item.ruleExpression);
var getPromotionMenuSignature = (menuItemList) => JSON.stringify(Object.values(menuItemList || {}).map((item) => item?.id != null && !item.isFreeItem && !item.ruleExpression ? [
	item.id,
	item.itemId,
	item.categoryId,
	item.oCategoryId,
	item.itemPrices,
	item.sizeId,
	item.sectionDetail?.find((section) => section.id === -1)?.sizeInfo,
	item.itemCenter
] : null));
var getAvailableRulesForCurrentMenu = (rules, resources, context, availabilityCache) => {
	const menuItemList = native_store_default.getState().menuItemList;
	const menuSignature = getPromotionMenuSignature(menuItemList);
	const rulesSignature = JSON.stringify(rules);
	const cached = availabilityCache.find((entry) => entry.menuItemList === menuItemList && entry.menuSignature === menuSignature && entry.merchantId === context.merchantId && entry.orderType === context.orderType && (entry.rules === rules && entry.rulesSignature === rulesSignature || entry.availableRules === rules && entry.availableSignature === rulesSignature));
	if (cached) return cached.availableRules;
	const availableRules = getAvailablePromotionRules(rules, resources, context);
	availabilityCache.push({
		menuItemList,
		menuSignature,
		merchantId: context.merchantId,
		orderType: context.orderType,
		rules,
		rulesSignature,
		availableRules,
		availableSignature: JSON.stringify(availableRules)
	});
	return availableRules;
};
var filterPromotionThresholdItems = (items, itemFilter, context) => filterPromotionItems(items, itemFilter, {
	...context,
	selectedSizeOnly: true
});
var isItemMatchedPromotionFilter = isPromotionItemMatched;
var checkItemPromotionStatus = async ({ promotionList, allItems, merchantId }) => {
	try {
		const { orderItems, orderType } = await formatOrderStructure({ allItems });
		const resources = getPromotionResources();
		const context = getPromotionContext({
			merchantId,
			orderType
		});
		const availableRules = getAvailablePromotionRules(promotionList, resources, context);
		if (!availableRules.length) return /* @__PURE__ */ new Map();
		const res = await (await crmIntegrationSDK.getPromotionPlugin()).GetItemMatchedCampaign({
			orderItemList: orderItems,
			promotionList: availableRules,
			orderType,
			appointItemFlag: true,
			merchantId
		});
		if (res instanceof Map) {
			const matches = new Map(res);
			const matchedRuleIds = new Set([...res.values()].flat().map((rule) => String(rule.promotionId)));
			for (const rule of availableRules) {
				if (matchedRuleIds.has(String(rule.id))) continue;
				const selectedItems = filterPromotionItems(orderItems, {
					type: "include",
					value: getPromotionBenefitItems(rule, resources, context).map((item) => ({
						itemId: item.id,
						merchantId: context.merchantId,
						productLine: "KIOSK",
						sizeList: item.itemPrices?.map((price) => ({ sizeId: price.sizeId }))
					}))
				}, {
					...context,
					selectedSizeOnly: true
				});
				if (!selectedItems.length) continue;
				const itemId = selectedItems[0].itemId;
				const key = [...matches.keys()].find((key) => String(key) === String(itemId)) ?? itemId;
				matches.set(key, [...matches.get(key) || [], {
					promotionId: rule.id,
					promotionType: rule.type,
					promotionName: rule.promotionName,
					promotionChineseTag: rule.promotionChineseTag,
					promotionEnglishTag: rule.promotionEnglishTag
				}]);
			}
			return matches;
		}
	} catch (e) {
		throw new Error(e.message);
	}
};
var getPromotionValidInfo = async ({ rules, metas, allItems, availabilityCache = [] }) => {
	try {
		const availableRules = getAvailableRulesForCurrentMenu(rules, getPromotionResources(), getPromotionContext(), availabilityCache);
		if (!availableRules.length) return { data: [] };
		return await (await crmIntegrationSDK.getPromotionPlugin()).GetItemValidateStatus({
			rules: availableRules,
			metas,
			allItems
		});
	} catch (e) {
		throw new Error(e.message);
	}
};
var filterValidPromotionCenterList = async ({ promotionCenterList, promotionCenterMetas, allItems = [] }) => {
	if (!promotionCenterMetas || !promotionCenterList?.length) return [];
	const availabilityCache = [];
	const validPromotionList = (await getPromotionValidInfo({
		rules: promotionCenterList,
		metas: promotionCenterMetas,
		allItems,
		availabilityCache
	}))?.data?.filter((cur) => {
		const excludedKeys = [
			"dayOfMonth",
			"dayOfWeek",
			"effectiveTime",
			"timeOfDay",
			"orderType"
		];
		return !cur.invalidReason.length || !cur.invalidReason?.find((item) => excludedKeys.includes(item.key));
	}).map((item) => item?.result?.nodeId) || [];
	return getAvailableRulesForCurrentMenu(promotionCenterList, getPromotionResources(), getPromotionContext(), availabilityCache).filter((item) => validPromotionList.includes(item.id) && !item.promotionCodes?.length);
};
var checkIsItemPromotionValid = async ({ rules, promotionCenterMetas, allItems }) => {
	try {
		const availabilityCache = [];
		const availableRules = getAvailableRulesForCurrentMenu(rules, getPromotionResources(), getPromotionContext(), availabilityCache);
		if (!availableRules.length) return [];
		return await handleAddOnItem({
			promotionResult: (await getPromotionValidInfo({
				rules: availableRules,
				metas: promotionCenterMetas,
				allItems,
				availabilityCache
			}))?.data,
			promotionList: availableRules,
			allItems,
			availabilityCache
		});
	} catch (e) {
		throw new Error(e.message);
	}
};
var handleAddOnItem = async ({ promotionResult, promotionList, appointPromotionId, allItems, availabilityCache = [] }) => {
	try {
		const context = getPromotionContext();
		const resources = filterPromotionItems(getPromotionResources(), void 0, context);
		const availableRules = getAvailableRulesForCurrentMenu(promotionList, resources, context, availabilityCache);
		if (!availableRules.length) return [];
		const itemList = makeUpItemList(resources, context.merchantId);
		const res = await (await crmIntegrationSDK.getPromotionPlugin()).AddOnItem({
			promotionResult,
			itemList,
			promotionList: availableRules,
			appointPromotionId,
			allItems
		});
		if (res?.length > 0) return res.filter((rule) => rule.promotion && availableRules.some((promotion) => promotion.id === rule.promotion.id)).map((rule) => {
			const { id } = rule.promotion;
			const validateInfo = promotionResult.find((each) => each.result.nodeId === id);
			return {
				...rule,
				validateInfo
			};
		});
	} catch (e) {
		throw new Error(e.message);
	}
};
var makeUpPromotionAddOnItem = ({ promotionRule, itemResources, orderType }) => filterPromotionItems(itemResources, promotionRule.promotion.ruleExpression?.condition?.itemFilter, getPromotionContext({ orderType })).map((item) => ({
	...item,
	promotionRule
}));
var makeUpSpecialPromotionAddOnItem = (params) => getSpecialPriceItems({
	...params,
	...getPromotionContext({ orderType: params.orderType })
});
var checkIsRuleValid = (validateInfo) => {
	const { isValid, result: { result: { discounts } } } = validateInfo;
	return isValid && discounts?.length > 0;
};
var checkIsRuleDiscountInvalid = (rule) => {
	const { validateInfo: { result: { result: { discounts } } }, promotion: { type } } = rule;
	if (GIFT_PROMOTION_TYPE.includes(type)) return !discounts?.every((e) => typeof e.amount === "number" && e.extraInfo.isUserSelected);
	return discounts?.every((e) => e.amount === 0);
};
var checkIsFixedPriceSelectItems = ({ promotion, recommendType }) => promotion.type === "orderItemFixedPrice" && recommendType === "REACHED_SELECT_ITEMS";
var checkIsGiftPromotionValid = ({ promotion, recommendType }) => {
	const { type } = promotion;
	return GIFT_PROMOTION_TYPE.includes(type) && RECOMMEND_SUCCESS_TYPE.includes(recommendType);
};
var getGiftPromotionRewardItems = ({ itemResources, orderItemList, orderType }) => {
	const context = getPromotionContext({ orderType });
	return filterPromotionItems(itemResources, {
		type: "include",
		value: (orderItemList || []).map((item) => ({
			itemId: item.itemId,
			merchantId: item.merchantId ?? context.merchantId,
			productLine: item.productLine ?? "KIOSK",
			sizeList: (item.itemSizeIds || []).map((sizeId) => ({ sizeId }))
		}))
	}, context);
};
//#endregion
//#region source-snapshot/src/utils/orderPricing/togoCharge.js
/**
* togo加收的税（是否算税，systemConfig.IS_CHARGE_TAX.booleanValue）
*
* togo：50
*
* 计算规则：A菜(税：0.1, 0.2)
*          B菜(税：0.2, 0.3)
*
* 先计算每个菜占比：
* rateA：subTotalA / (subTotalA + subTotalB)
* rateB：subTotalB / (subTotalA + subTotalB)
*
* A菜的togo加收税：50 * rateA * 0.1 + 50 * rateA * 0.2
* B菜的togo加收税：50 * rateB * 0.2 + 50 * rateB * 0.3
*
*/
var TogoCharge = class {
	constructor(togoList, isCalcTogoTax, itemCount) {
		this.togoList = togoList;
		this.isCalcTogoTax = isCalcTogoTax;
		this.itemCount = itemCount;
	}
	getIsCalcTogoTax() {
		return this.isCalcTogoTax;
	}
	getTogoTotal() {
		let togoCharge = 0;
		if (this.togoList?.length) this.togoList.forEach((item) => {
			if (item.select.id) if (item.id === 4) togoCharge = Big(togoCharge).plus(item.select.rate * this.itemCount).toNumber();
			else togoCharge = Big(togoCharge).plus(item.select.rate).toNumber();
		});
		return togoCharge;
	}
	getTotal(itemInfoList) {
		let total = 0;
		if (itemInfoList?.length) itemInfoList.forEach((item) => {
			total = Big(total).plus(getItemPricingSubtotal(item.itemPriceDetail)).toNumber();
		});
		return total;
	}
	togoTaxDetailAccumulation(itemInfo) {
		let togoTaxMap = {};
		let total = this.getTotal(itemInfo);
		let chargeTotal = this.getTogoTotal();
		let subtotals = itemInfo.map((item) => getItemPricingSubtotal(item.itemPriceDetail));
		if (total === 0) {
			subtotals = itemInfo.map((item) => {
				if (item.originItemPrice == null) return 0;
				const optionsPrice = (item.options || []).reduce((sum, option) => {
					const subOptionsPrice = (option.subOptions || []).reduce((subSum, subOption) => Big(subSum).plus(Big(subOption.optionPrice).times(subOption.quantity)).toNumber(), 0);
					return Big(sum).plus(Big(option.optionPrice).plus(subOptionsPrice).times(option.quantity)).toNumber();
				}, 0);
				return Big(item.originItemPrice).plus(optionsPrice).times(item.quantity).toNumber();
			});
			total = subtotals.reduce((sum, subtotal) => Big(sum).plus(subtotal).toNumber(), 0);
			if (total === 0) {
				subtotals = itemInfo.map(() => 1);
				total = itemInfo.length;
			}
		}
		for (let i = 0; i < itemInfo.length; i++) {
			let item = itemInfo[i];
			let togoRate = Big(subtotals[i]).div(total).toNumber();
			let taxList = item.itemPriceDetail.itemTaxDetail;
			for (let key in taxList) {
				let togoTax = Big(chargeTotal).times(togoRate).times(taxList[key].taxRate).toNumber();
				if (togoTaxMap[key]) togoTaxMap[key] = { togoTax: Big(togoTaxMap[key].togoTax).plus(togoTax).toNumber() };
				else togoTaxMap[key] = { togoTax };
			}
		}
		return togoTaxMap;
	}
};
//#endregion
//#region source-snapshot/src/utils/checkCRMStatus.js
var checkCRMStatus = (allSysConfig) => {
	const { CRM_SERVICE_ENABLED, CRM_INTEGRATION_SERVICE_ENABLED } = allSysConfig;
	return (!CRM_SERVICE_ENABLED || CRM_SERVICE_ENABLED === "false") && (!CRM_INTEGRATION_SERVICE_ENABLED || CRM_INTEGRATION_SERVICE_ENABLED === "false");
};
//#endregion
//#region node_modules/lodash/isNumber.js
var require_isNumber = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var baseGetTag = require__baseGetTag();
	var isObjectLike = require_isObjectLike();
	/** `Object#toString` result references. */
	var numberTag = "[object Number]";
	/**
	* Checks if `value` is classified as a `Number` primitive or object.
	*
	* **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
	* classified as numbers, use the `_.isFinite` method.
	*
	* @static
	* @memberOf _
	* @since 0.1.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a number, else `false`.
	* @example
	*
	* _.isNumber(3);
	* // => true
	*
	* _.isNumber(Number.MIN_VALUE);
	* // => true
	*
	* _.isNumber(Infinity);
	* // => true
	*
	* _.isNumber('3');
	* // => false
	*/
	function isNumber(value) {
		return typeof value == "number" || isObjectLike(value) && baseGetTag(value) == numberTag;
	}
	module.exports = isNumber;
}));
//#endregion
//#region source-snapshot/src/utils/CRMIntegration/crmPromotionContrary.js
var isHasCRMCampaignFn = ({ itemList, selectedFreeItem, selectedDiscount }) => {
	const freeItemInOrder = itemList.find((item) => item.isFreeItem) || {};
	if (itemList.length > 0 && Object.keys(freeItemInOrder)?.length > 0) return freeItemInOrder;
	if (selectedFreeItem?.length > 0) return selectedFreeItem[0];
	const rewardItemInOrder = itemList.filter((each) => each.isCRMIntegrationBundleDiscountItem || each.isCRMIntegrationSpecialItem);
	if (rewardItemInOrder?.length > 0) return rewardItemInOrder?.[0];
	if (Object.keys(selectedDiscount).length > 0) return selectedDiscount;
	return false;
};
var isHasPromotionFn = ({ promotion, itemList }) => {
	const { buyGifts, itemValidPromotion } = promotion;
	if (buyGifts?.length > 0) return buyGifts?.[0];
	const exchangePurchaseItem = itemList?.find((item) => item.isLocalExchangePurchaseItem);
	if (exchangePurchaseItem) return exchangePurchaseItem;
	const promotionDiscountItem = itemList?.find((item) => item.discountID === -1 && item.discountName === "promotion discount");
	if (promotionDiscountItem) return promotionDiscountItem;
	if (window.kioskLocalDiscountPromotion?.actualDiscount > 0) return window.kioskLocalDiscountPromotion;
	const validSelectedPromotion = itemValidPromotion?.find((e) => e.isSelected);
	if (validSelectedPromotion) return validSelectedPromotion;
	return false;
};
//#endregion
//#region source-snapshot/src/utils/getCurrentPaymentType.js
var isGiftCardWithCreditCardOrder = (paymentTypeTrail = []) => {
	const paymentTypes = new Set(paymentTypeTrail);
	return paymentTypes.has("GIFT_CARD") && paymentTypes.has("CREDIT_CARD");
};
var getCurrentPaymentType = (paymentType, paymentTypeTrail = []) => {
	const isGiftCardType = paymentTypeTrail.length === 1 && paymentTypeTrail[0] === "GIFT_CARD";
	if (paymentType === "CREDIT_CARD") return "CREDIT_CARD";
	if (paymentType === "CASH" || isGiftCardType) return "CASH";
	return null;
};
//#endregion
//#region source-snapshot/src/utils/safeBig.js
function safeBig(value, fallback = 0) {
	try {
		return Big(value ?? fallback);
	} catch (error) {
		return Big(fallback);
	}
}
//#endregion
//#region source-snapshot/src/utils/rewardDiscountCalculator.js
function countActualPrice(price, rewardDiscountRate, isNeedDiscount) {
	const originPrice = Number(price ?? 0);
	if (!Number.isFinite(originPrice)) return 0;
	if (!isNeedDiscount) return originPrice;
	const discountRate = Number(rewardDiscountRate);
	if (!Number.isFinite(discountRate)) return originPrice;
	return Number(Big(originPrice).times(Big(discountRate)).toFixed(8)) || 0;
}
function reCountDiscountRate(orderItems, notEligibleId, actualDiscount, onInvalid) {
	const safeOrderItems = Array.isArray(orderItems) ? orderItems : [];
	const safeNotEligibleId = Array.isArray(notEligibleId) ? notEligibleId : [];
	const safeActualDiscount = Number(actualDiscount ?? 0);
	const eligiblePrice = safeOrderItems.filter((orderItem) => orderItem && !safeNotEligibleId.includes(orderItem.id)).reduce((pre, cur) => {
		const itemPrice = Number(cur.orderItemPrice ?? 0);
		const quantity = Number(cur.quantity ?? 0);
		if (!Number.isFinite(itemPrice) || !Number.isFinite(quantity)) return pre;
		return Big(pre).plus(Big(itemPrice).times(quantity).toFixed(2));
	}, 0);
	if (Big(eligiblePrice).eq(0)) {
		if (typeof onInvalid === "function") onInvalid();
		return 1;
	}
	return Number(Big(1).minus(Big(Number.isFinite(safeActualDiscount) ? safeActualDiscount : 0).div(Big(eligiblePrice))).toFixed(12));
}
//#endregion
//#region source-snapshot/src/api/submitOrderObj.js
var import_isNumber = /* @__PURE__ */ __toESM(require_isNumber());
var { t } = native_i18n_default;
var itemList = [];
var getTakeoutTaxFree = (item, category, currentOrderType) => {
	return (item?.takeoutTaxFree ?? category?.takeoutTaxFree ?? false) && (currentOrderType === "TO_GO" || currentOrderType === "PICK_UP");
};
function generateSubmitOrderObj(state, options = {}) {
	const sourceState = state;
	const pricingState = options.activityPricing ? getMemberActivityState(state, options) : getMemberCheckoutState(state, options);
	const isMemberCheckout = options.useMemberPrice !== false && canUseMemberPrice(state);
	state = pricingState;
	if (!state.currentOrder.orderType && !window.selectedOrderType && !["#/", "#/orderType"].includes(window.location.hash)) {
		toast_default.info("No Order Type, Please refresh kiosk and try again ");
		return;
	}
	const currentOrderType = state.currentOrder.orderType || window.selectedOrderType;
	let obj = {};
	let order = {};
	let orderRewardDiscountList = [];
	itemList = (0, import_cloneDeep.default)(state.currentOrder.itemList);
	const needCommit = state.avocado.needCommit;
	if (state.avocado.outletInfo?.enabled === 1) {
		const extraInfo = {
			discountType: "giftItemCoupon",
			enableBenefit: true,
			templateId: state.crm.tempCampaign?.[0]?.couponTemplate?.id
		};
		let freeItem = null;
		if (itemList?.length > 0) {
			const freeItemInOrder = itemList.find((item) => item.isFreeItem);
			if (freeItemInOrder) {
				freeItem = {
					...(0, import_cloneDeep.default)(freeItemInOrder),
					id: freeItemInOrder.oId,
					categoryId: freeItemInOrder.oCategoryId
				};
				delete freeItem.oId;
				itemList = itemList.filter((each) => each.id !== freeItemInOrder.id);
			}
		}
		if (state.crm.selectedFreeItem.length > 0) freeItem = (0, import_cloneDeep.default)(state.crm.selectedFreeItem[0]);
		if (freeItem) {
			if (freeItem.isFreeItem && !freeItem.oId) delete freeItem.isFreeItem;
			const { freeItemOriginPrice } = freeItem;
			freeItem.price = freeItemOriginPrice;
			let totalPrice = Big(getItemPrice({
				...freeItem,
				price: freeItem.itemPrices?.length ? 0 : freeItemOriginPrice
			})).times(freeItem.quantity).toNumber();
			const isComplexItem = totalPrice > freeItemOriginPrice;
			freeItem.totalPrice = totalPrice;
			freeItem.totalAmount = isComplexItem ? totalPrice : freeItemOriginPrice;
			freeItem.isCRMIntegrationFreeItem = true;
			const { crmIntegrationRule: { coupon }, couponTemplate: { templateName } } = freeItem;
			const { ruleId, type } = coupon;
			const discountInfo = {
				name: templateName,
				id: ruleId,
				amount: isComplexItem ? totalPrice : freeItemOriginPrice,
				type,
				isReward: true,
				commited: needCommit,
				extraInfo
			};
			freeItem.discountList = [discountInfo];
			orderRewardDiscountList = [discountInfo];
			delete freeItem.rewardRule;
			delete freeItem.itemPoints;
			delete freeItem.isFreeItem;
			delete freeItem.oId;
			itemList.push(freeItem);
		}
	} else {
		if (state.crm.selectedFreeItem.length > 0) {
			const freeItem = (0, import_cloneDeep.default)(state.crm.selectedFreeItem[0]);
			freeItem.isCRMFreeItem = true;
			if (freeItem.isFreeItem && !freeItem.oId) delete freeItem.isFreeItem;
			itemList.push(freeItem);
		}
		if (itemList?.length > 0) itemList = itemList.map((each) => {
			return each.isFreeItem ? {
				...each,
				isCRMFreeItem: true
			} : each;
		});
	}
	if (state?.promotion?.buyGifts?.length) {
		const giftItems = state.promotion.buyGifts[0]?.items.map((each) => {
			if (each?.promotionInfo?.promotionType === "WholeOrderGift") {
				const { promotionInfo, price } = each;
				return {
					...each,
					promotionItem: true,
					promotionInfo: JSON.stringify(promotionInfo),
					price,
					isCloudPromotion: true,
					quantity: 1
				};
			}
			let promotionInfo = {
				promotionName: each.name,
				promotionId: each.ruleId,
				promotionType: state?.promotion?.buyGiftRule[0]?.activityType
			};
			return {
				...each,
				isGiftItem: true,
				promotionInfo: JSON.stringify(promotionInfo),
				quantity: Number(each.quantity || 1)
			};
		});
		order.promotionInfo = JSON.stringify(giftItems[0].promotionInfo);
		itemList.push(...giftItems);
	}
	const orderPriceDetail = getOrderInfoFromPricingState(state);
	const orderPriceDetailAfterDp = orderPriceDetail?.orderDetailAfterDp;
	const isDpEnabled = !!orderPriceDetailAfterDp;
	const dpMultiplier = isDpEnabled ? Number(Big(1).plus(Big(state.allSysConfig?.CREDIT_CHARGE_RATE || 0).div(100))) : 1;
	const toRoundedNumber = (val) => Number(floatNumberRounding(val ?? 0));
	const toDpAmount = (val) => {
		if (val === void 0 || val === null || val === "") return val;
		return toRoundedNumber(Big(val).times(dpMultiplier).toNumber());
	};
	if (isDpEnabled) Object.keys(orderPriceDetail.orderTaxDetail || {}).forEach((taxId) => {
		const taxInfo = orderPriceDetail.orderTaxDetail[taxId];
		const dpTaxInfo = orderPriceDetailAfterDp.orderTaxDetail?.[taxId];
		if (taxInfo) taxInfo.taxAmountAfterDp = dpTaxInfo ? dpTaxInfo.taxAmount : 0;
	});
	const baseWholeOrderCharge = toRoundedNumber(orderPriceDetail?.chargeTotal);
	const wholeOrderChargeAfterDp = isDpEnabled ? toRoundedNumber(orderPriceDetailAfterDp?.chargeTotal) : null;
	order.customer = state.currentOrder.customer;
	order.customerName = state.currentOrder.customerName;
	if (Number(getPosVersion(localStorage.getItem("posVersion"))) >= 1803012e4) {
		if (state.currentOrder.locator) order.locatorNumber = ` Pager NO. ${state.currentOrder.locator}`;
	} else if (state.currentOrder.locator && !order.customer.firstName.includes("Pager NO.")) order.customer.firstName = `${order.customer.firstName} Pager NO. ${state.currentOrder.locator}`;
	order.totalPrice = orderPriceDetail.orderSubtotal;
	order.totalTax = orderPriceDetail.orderTaxTotal;
	order.totalTips = orderPriceDetail.orderTotalTips;
	if (isDpEnabled) {
		order.totalPriceAfterDp = orderPriceDetailAfterDp.orderSubtotal;
		order.totalTaxAfterDp = orderPriceDetailAfterDp.orderTaxTotal;
		order.totalTipsAfterDp = orderPriceDetailAfterDp.orderTotalTips;
	}
	order.chargeTotal = baseWholeOrderCharge;
	if (isDpEnabled) order.chargeTotalAfterDp = wholeOrderChargeAfterDp;
	order.togoTotal = parseFloat(floatNumberRounding(orderPriceDetail.togoTotal));
	if (orderPriceDetail.orderDiscount) {
		order.discount = orderPriceDetail.orderDiscount;
		order.discountID = -1;
		order.discountRateType = 1;
		order.discountName = "promotion discount";
		if (isDpEnabled) order.discountAfterDp = orderPriceDetailAfterDp.orderDiscount;
	}
	order.userPassword = "56854b3d95d5d154e1fbca66";
	order.creatTime = +/* @__PURE__ */ new Date();
	order.status = "ORDERED";
	order.notes = state.currentOrder?.notes || "";
	order.pickupTime = state.currentOrder?.pickupTime || "";
	if (order.pickupTime && currentOrderType === "PICK_UP") order.notes += order.pickupTime;
	let orderItems = [];
	const isSelectDiscount = Object.keys(state.crm.selectedDiscount)?.length > 0;
	let isStillValid = false;
	const isPromotionSelect = state.promotion.itemValidPromotion?.find((e) => e.isSelected);
	if (isPromotionSelect) isStillValid = checkIsRuleValid(isPromotionSelect.validateInfo);
	const itemSizeListForSubmit = Array.isArray(state.itemSizeList) ? state.itemSizeList : [];
	const getItemSizeListNameBySizeId = (sizeId) => {
		return itemSizeListForSubmit.find((s) => s.id == sizeId)?.name ?? "";
	};
	const appendMemberOption = (options, opt, isFreeItem) => {
		const prices = getSelectedOptionPrices(opt);
		const quantity = opt.quantity ?? 1;
		const price = isFreeItem ? 0 : prices.price;
		if (prices.subPrice === void 0) {
			options.push({
				optionId: opt.id,
				optionName: opt.name,
				optionType: "ITEM",
				quantity,
				price,
				...isDpEnabled ? { priceAfterDp: toDpAmount(price) } : {}
			});
			return;
		}
		let parent = options.find((option) => option.optionId === opt.itemOption.id);
		if (!parent) {
			parent = {
				optionId: opt.itemOption.id,
				optionName: opt.itemOption.name,
				optionType: "ITEM",
				quantity: 1,
				price: 0,
				subOptions: []
			};
			options.push(parent);
		}
		parent.price = Big(parent.price).plus(Big(isFreeItem ? 0 : prices.parentPrice).times(quantity)).toNumber();
		if (isDpEnabled) parent.priceAfterDp = toDpAmount(parent.price);
		const subPrice = isFreeItem ? 0 : prices.subPrice;
		parent.subOptions.push({
			subOptionId: opt.id,
			subOptionName: opt.name,
			optionType: "ITEM",
			quantity,
			price: subPrice,
			...isDpEnabled ? { priceAfterDp: toDpAmount(subPrice) } : {}
		});
	};
	itemList.forEach((item, i) => {
		const useMemberDetails = isMemberCheckout && !isMemberPriceProtected(item) && !item.isCRMIntegrationFreeItem;
		const isCrmRewardItem = item.isCRMFreeItem === true;
		const isCRMIntegrationFreeItem = item.isCRMIntegrationFreeItem === true;
		const isDiscountItem = item.rewardRule?.voucherRules;
		const isBundleRewardItem = item.isCRMIntegrationBundleDiscountItem && item.hasOwnProperty("actualDiscount");
		const isSpecialItem = item.isCRMIntegrationSpecialItem;
		const isCRMIntegrationDiscountItem = item.isCRMIntegrationDiscountItem && isSelectDiscount;
		const isPromotionCenterRewardItem = item.promotionRewardItem && isStillValid;
		const isPromotionRewardItem = item.isGiftItem;
		const isFreeItem = isCrmRewardItem || isPromotionRewardItem;
		let tempItem = {};
		if (isCrmRewardItem) tempItem.isCrmRewardItem = isCrmRewardItem;
		tempItem.manualSelectRewardDiscount = item.manualSelectRewardDiscount;
		let price = 0;
		if (item.itemPrices?.length) {
			const sizePrice = item?.sectionDetail?.find((sct) => sct.id === -1)?.sizeInfo?.price;
			if (sizePrice == null) {
				let minObj = item.itemPrices[0];
				if (Object.hasOwnProperty.call(item, "defaultItemSizeId") && item.defaultItemSizeId !== null && item.defaultItemSizeId !== void 0) {
					const defaultItem = item.itemPrices.find((priceItem) => priceItem.sizeId === item.defaultItemSizeId);
					if (defaultItem) minObj = defaultItem;
					else item.itemPrices.forEach((p) => {
						if (p.price < minObj.price) minObj = p;
					});
				} else item.itemPrices.forEach((p) => {
					if (p.price < minObj.price) minObj = p;
				});
				price = minObj.price;
			} else price = sizePrice;
		} else price = item.price;
		if (isFreeItem) price = 0;
		if (isDiscountItem) price = item.price;
		tempItem.price = price;
		let totalAmount = Big(getItemPrice(item)).times(item.quantity).toNumber();
		if (isFreeItem) totalAmount = 0;
		if (isDiscountItem) totalAmount = price;
		if (isCRMIntegrationFreeItem) {
			const { totalPrice, price } = item;
			totalAmount = totalPrice > price ? totalPrice : price;
			tempItem.isCRMIntegrationFreeItem = isCRMIntegrationFreeItem;
		}
		if (isCRMIntegrationFreeItem) tempItem.discountList = JSON.stringify(item.discountList);
		if (isBundleRewardItem || isSpecialItem || isCRMIntegrationDiscountItem || isPromotionCenterRewardItem) {
			const { itemDiscountInfo, orderDiscountInfo } = item;
			tempItem.discountList = JSON.stringify(itemDiscountInfo);
			orderRewardDiscountList = orderDiscountInfo;
		}
		tempItem.categoryId = item.categoryId;
		tempItem.totalAmount = totalAmount;
		tempItem.rewardItem = isCrmRewardItem || !!isDiscountItem;
		tempItem.saleItemId = item.isFreeItem ? item.oId : item.id;
		tempItem.displayName = item.name;
		tempItem.quantity = item.quantity;
		if (isMembershipCard(item)) {
			tempItem.privilegeId = item.privilegeId;
			if (item.expiration != null) tempItem.expiration = JSON.stringify(item.expiration);
			tempItem.hiddenItem = true;
			tempItem.sendToKitchenRequired = false;
		}
		tempItem.uniqueItemTempId = item.uniqueItemTempId;
		tempItem.originalSalePrice = isFreeItem ? 0 : tempItem.price;
		if (item.promotionItem) {
			tempItem.promotionItem = item.promotionItem;
			tempItem.promotionInfo = item.promotionInfo;
			tempItem.itemId = item.id;
			tempItem.itemPrice = item.price;
		}
		if (item.itemType == "COMBO_SALE_ITEM") {
			tempItem.comboOrderDetails = {};
			tempItem.comboOrderDetails.comboSections = [];
			tempItem.comboOrderItemId = isFreeItem ? item.oId : item.id;
			tempItem.comboDisplayName = item.name;
		}
		let options = [];
		if (item.sectionDetail) item.sectionDetail.forEach((sct) => {
			if (sct.id == -2 || sct.id == -3) sct.options.forEach((opt) => {
				if (useMemberDetails) {
					appendMemberOption(options, opt, isFreeItem);
					return;
				}
				let tempOption = {};
				tempOption.optionType = "ITEM";
				tempOption.quantity = 1;
				tempOption.price = opt.isFreeItem || isFreeItem ? 0 : void 0;
				if (isDpEnabled) {
					const optBase = opt.isFreeItem || isFreeItem ? 0 : opt.price;
					tempOption.priceAfterDp = isCRMIntegrationFreeItem ? toRoundedNumber(optBase) : toDpAmount(optBase);
				}
				if (opt.itemOption) {
					tempOption.subOptionId = opt.id;
					tempOption.subOptionName = opt.name;
					let itemOption = options.find((option) => option.optionId === opt.itemOption.id);
					if (itemOption) itemOption.subOptions.push(tempOption);
					else {
						let itemOption = {
							optionId: opt.itemOption.id,
							optionName: opt.itemOption.name,
							optionType: "ITEM",
							quantity: 1,
							subOptions: [tempOption]
						};
						options.push(itemOption);
					}
				} else {
					tempOption.optionId = opt.id;
					tempOption.optionName = opt.name;
					options.push(tempOption);
				}
			});
			if (sct.id == -1) {
				tempItem.type = sct.sizeInfo.type;
				tempItem.size = getItemSizeListNameBySizeId(sct.sizeInfo?.sizeId);
				tempItem.sizeId = sct.sizeInfo.id;
				tempItem.crmIntegrationSizeId = sct.sizeInfo.sizeId;
				let sizePrice = sct.sizeInfo.price;
				if (isFreeItem) sizePrice = 0;
				if (isDiscountItem) sizePrice = price;
				tempItem.price = sizePrice;
			}
			if (sct.id > 0) {
				const comboSections = tempItem.comboOrderDetails.comboSections;
				const sctName = getItemFromCategoryList(item.id, state.currentCategoryList).comboSections.filter((combo) => combo.id == sct.id)[0].name;
				const tempSection = {
					id: sct.id,
					name: sctName
				};
				let orderItems = [];
				sct.items.forEach((item) => {
					let subItem = {
						saleItemId: item.id,
						displayName: item.name,
						quantity: useMemberDetails ? Big(item.quantity).times(tempItem.quantity).toNumber() : tempItem.quantity || item.quantity,
						price: isFreeItem ? 0 : item.price,
						originalSalePrice: isFreeItem ? 0 : item.price,
						printerIds: item.printerIds,
						categoryId: tempSection.id,
						categoryName: tempSection.sctName
					};
					let subItemOptions = [];
					if (item.selectedOptionList?.length > 0) item.selectedOptionList.forEach((subSct) => {
						if (subSct.id == -1) {
							subItem.price = isFreeItem ? 0 : subSct.sizeInfo?.price ?? 0;
							subItem.size = getItemSizeListNameBySizeId(subSct.sizeInfo?.sizeId);
							subItem.sizeId = subSct.sizeInfo?.sizeId;
							if (subSct.sizeInfo?.originalSaleItem) {
								const originalSaleItem = subSct.sizeInfo.originalSaleItem;
								subItem.saleItemId = originalSaleItem.id;
								subItem.displayName = originalSaleItem.name;
								subItem.categoryId = originalSaleItem.categoryId;
								subItem.categoryName = originalSaleItem.categoryName;
							}
						}
						if (subSct.id == -2 || subSct.id == -3) subSct.options.forEach((opt) => {
							if (useMemberDetails && !isMemberPriceProtected(item)) {
								appendMemberOption(subItemOptions, opt, isFreeItem);
								return;
							}
							let tempOption = {};
							tempOption.optionType = "ITEM";
							tempOption.quantity = 1;
							tempOption.price = opt.isFreeItem || isFreeItem ? 0 : opt.price;
							if (isDpEnabled) tempOption.priceAfterDp = isCRMIntegrationFreeItem ? toRoundedNumber(tempOption.price) : toDpAmount(tempOption.price);
							if (opt.itemOption) {
								tempOption.subOptionId = opt.id;
								tempOption.subOptionName = opt.name;
								let itemOption = subItemOptions.find((option) => option.optionId === opt.itemOption.id);
								if (itemOption) itemOption.subOptions.push(tempOption);
								else {
									let itemOption = {
										optionId: opt.itemOption.id,
										optionName: opt.itemOption.name,
										optionType: "ITEM",
										quantity: 1,
										subOptions: [tempOption]
									};
									subItemOptions.push(itemOption);
								}
							} else {
								tempOption.optionId = opt.id;
								tempOption.optionName = opt.name;
								subItemOptions.push(tempOption);
							}
						});
					});
					if (item.remark.optionName) subItemOptions.push({ ...item.remark });
					subItem.options = subItemOptions;
					if (useMemberDetails && isDpEnabled) subItem.priceAfterDp = toDpAmount(subItem.price);
					orderItems.push(subItem);
				});
				tempSection.orderItems = orderItems;
				comboSections.push(tempSection);
			}
		});
		tempItem.options = options;
		if (item.remark.optionName) tempItem.options = [...tempItem.options, item.remark];
		tempItem.printerIds = item.printerIds;
		tempItem.taxIds = item.taxIds;
		tempItem.status = "ORDERED";
		const takeoutTaxFree = getTakeoutTaxFree(item, getOrderItemCategory(state.currentCategoryList, item), currentOrderType);
		tempItem.taxExempt = takeoutTaxFree;
		tempItem.takeoutTaxFree = takeoutTaxFree;
		if (item.discountID) {
			tempItem.discountID = item.discountID;
			tempItem.discountName = `${item.discountName}\n`;
			tempItem.discountRate = item.discountRate;
			tempItem.discountRateType = item.discountRateType;
			tempItem.discount = item.isLocalExchangePurchaseItem ? getExchangePurchaseUnitDiscount(item) : item.discount;
			delete tempItem.totalAmount;
			if (isDpEnabled) {
				if (!isCRMIntegrationFreeItem) tempItem.discount = toDpAmount(tempItem.discount ?? 0);
				tempItem.discountAfterDp = tempItem.discount;
			}
			if (item.isHasNoDiscountSubDish) {
				tempItem.discountID = -1;
				tempItem.discountRateType = 1;
			}
		}
		if (isDpEnabled) if (isCRMIntegrationFreeItem) {
			tempItem.priceAfterDp = toRoundedNumber(tempItem.price ?? 0);
			tempItem.totalAmount = toRoundedNumber(totalAmount ?? 0) - (tempItem.discount ?? 0);
		} else {
			tempItem.priceAfterDp = toDpAmount(tempItem.price ?? 0);
			tempItem.totalAmount = toDpAmount(totalAmount ?? 0) - (tempItem.discount ?? 0);
		}
		tempItem.type = tempItem.type || ORDER_TYPE[currentOrderType];
		orderItems.push(tempItem);
	});
	order.orderItems = orderItems;
	order.orderTax = state.taxList.map((tax) => {
		const taxAmount = orderPriceDetail.orderTaxDetail[tax.id] ? orderPriceDetail.orderTaxDetail[tax.id].taxAmount : 0;
		const taxAmountAfterDp = isDpEnabled ? orderPriceDetailAfterDp.orderTaxDetail[tax.id] ? orderPriceDetailAfterDp.orderTaxDetail[tax.id].taxAmount : 0 : void 0;
		return {
			taxId: tax.id,
			taxAmount,
			...isDpEnabled ? { taxAmountAfterDp } : {}
		};
	});
	order.productLine = "KIOSK";
	order.printReceipt = true;
	order.printReceiptMerchantCopy = true;
	order.printReceiptNumberOfCopies = true;
	order.fetchOrder = true;
	order.fetchPayments = true;
	order.updateOrderDetials = true;
	order.userAuth = { sessionKey: getCookie("sessionKey") };
	const guests = state.currentOrder?.numOfGuests;
	order.numOfGuests = guests != null && Number(guests) > 0 ? Number(guests) : 1;
	let allCharge = 0;
	let allChargeName = [];
	let allOrderCharge = [];
	if (state.currentOrder.paymentType == "CREDIT_CARD") {
		const { selfConfig } = state;
		selfConfig.charge.map((item) => {
			if (item.id === 1 && item.select?.id && state.allSysConfig?.CREDIT_CHARGE_ENABLE !== "true" && state.allSysConfig?.CREDIT_CHARGE_ENABLE !== true) {
				allCharge = Big(allCharge).plus(parseFloat(floatNumberRounding(orderPriceDetail.chargeTotal))).toNumber();
				allChargeName.push(item.select.name);
				allOrderCharge.push({
					charge: parseFloat(floatNumberRounding(allCharge)),
					chargeName: item.select.name,
					...isDpEnabled ? { chargeAfterDp: wholeOrderChargeAfterDp } : {}
				});
			}
		});
	}
	if (currentOrderType === "TO_GO" || currentOrderType === "PICK_UP") {
		order.taxExempt = state.systemConfig["IS_EXEMPT_TAX_ON_TAKEOUT_ORDER"].booleanValue;
		let togoNotesList = [];
		let notesMultiLanguage = {};
		Object.keys(resources_default).forEach((lanItem) => {
			if (order.notes) notesMultiLanguage[lanItem] = order.notes;
			else notesMultiLanguage[lanItem] = "";
		});
		if (currentOrderType === "TO_GO") order.type = "TOGO";
		else if (currentOrderType === "PICK_UP") order.type = "PICKUP";
		allCharge = Big(allCharge).plus(parseFloat(floatNumberRounding(orderPriceDetail.togoTotal))).toNumber();
		if (state.selfConfig?.charge?.length) {
			let r2 = state.selfConfig.charge.find((c) => c.id == 2);
			let r3 = state.selfConfig.charge.find((c) => c.id == 3);
			let r4 = state.selfConfig.charge.find((c) => c.id == 4);
			if (r2?.select?.id) {
				let res2 = state.togoList.find((item) => item.id == 2);
				if (res2.select?.id) {
					togoNotesList.push(t("need-" + res2.name));
					Object.keys(notesMultiLanguage).forEach((lanItem) => {
						if (notesMultiLanguage[lanItem].length > 0) notesMultiLanguage[lanItem] = notesMultiLanguage[lanItem] + ", " + resources_default[lanItem].translation["need-" + res2.name];
						else notesMultiLanguage[lanItem] = resources_default[lanItem].translation["need-" + res2.name];
					});
					allChargeName.push(res2.name);
					allOrderCharge.push({
						charge: res2.select.rate,
						chargeName: res2.name
					});
				} else {
					togoNotesList.push(t("no-need-" + res2.name));
					Object.keys(notesMultiLanguage).forEach((lanItem) => {
						if (notesMultiLanguage[lanItem].length > 0) notesMultiLanguage[lanItem] = notesMultiLanguage[lanItem] + ", " + resources_default[lanItem].translation["no-need-" + res2.name];
						else notesMultiLanguage[lanItem] = resources_default[lanItem].translation["no-need-" + res2.name];
					});
				}
			}
			if (r3?.select?.id) {
				let res3 = state.togoList.find((item) => item.id == 3);
				if (res3.select?.id) {
					togoNotesList.push(t("need-" + res3.name));
					Object.keys(notesMultiLanguage).forEach((lanItem) => {
						if (notesMultiLanguage[lanItem].length > 0) notesMultiLanguage[lanItem] = notesMultiLanguage[lanItem] + ", " + resources_default[lanItem].translation["need-" + res3.name];
						else notesMultiLanguage[lanItem] = resources_default[lanItem].translation["need-" + res3.name];
					});
					allChargeName.push(res3.name);
					allOrderCharge.push({
						charge: res3.select.rate,
						chargeName: res3.name
					});
				} else {
					togoNotesList.push(t("no-need-" + res3.name));
					Object.keys(notesMultiLanguage).forEach((lanItem) => {
						if (notesMultiLanguage[lanItem].length > 0) notesMultiLanguage[lanItem] = notesMultiLanguage[lanItem] + ", " + resources_default[lanItem].translation["no-need-" + res3.name];
						else notesMultiLanguage[lanItem] = resources_default[lanItem].translation["no-need-" + res3.name];
					});
				}
			}
			if (r4?.select?.id) {
				let res4 = state.togoList.find((item) => item.id == 4);
				togoNotesList.push(t("need-" + res4.name.replace(" ", "-")));
				Object.keys(notesMultiLanguage).forEach((lanItem) => {
					if (notesMultiLanguage[lanItem].length > 0) notesMultiLanguage[lanItem] = notesMultiLanguage[lanItem] + ", " + resources_default[lanItem].translation["need-" + res4.name.replace(" ", "-")];
					else notesMultiLanguage[lanItem] = resources_default[lanItem].translation["need-" + res4.name.replace(" ", "-")];
				});
				allChargeName.push(res4.name.replace(" ", "-"));
				allOrderCharge.push({
					charge: res4.select?.rate * getItemCount(itemList),
					chargeName: res4.name.replace(" ", "-")
				});
			}
		}
		if (order.notes) order.notes = [order.notes, ...togoNotesList].join(", ");
		else order.notes = togoNotesList.join(", ");
		order.notesMultiLanguage = notesMultiLanguage;
	} else if (currentOrderType === "DINE_IN") if (state.currentOrder.tabelServiceType == "KIOSK_PICKUP") order.type = "KIOSK_PICKUP";
	else order.type = "DINE_IN";
	order.charge = allCharge;
	if (isDpEnabled) order.chargeAfterDp = Number(Big(order.charge).minus(baseWholeOrderCharge).plus(wholeOrderChargeAfterDp || 0).toFixed(2));
	order.chargeName = allChargeName.join("+");
	order.orderCharges = allOrderCharge.map((each) => {
		return {
			...each,
			taxed: state.systemConfig["IS_CHARGE_TAX"]?.booleanValue
		};
	});
	const { allSysConfig, crm: { earningRule: { expiration }, memberCRMInfo, selectedDiscount }, avocado: { orderRewardId, outletInfo, crmCustomerInfo } } = state;
	const isCRMDisabled = checkCRMStatus(allSysConfig);
	if (outletInfo?.enabled !== 1) {
		const freeItem = itemList.find((_) => _.isCRMFreeItem === true);
		if (freeItem) {
			const item = freeItem;
			const { rewardRule, itemPoints } = item;
			const { rewardType } = rewardRule;
			const orderRewards = {
				rewardId: rewardRule._id,
				rewardName: rewardRule.name,
				strategy: rewardRule.redeemRule.strategy,
				point: itemPoints || 0,
				itemId: item.isFreeItem ? item.oId : item.id,
				id: orderRewardId
			};
			if (["voucher", "loyalty"].includes(rewardType)) orderRewards.rewardType = rewardType;
			order.orderRewards = [orderRewards];
		}
		if (Object.keys(selectedDiscount)?.length > 0) {
			const { rewardType } = selectedDiscount;
			const orderRewards = {
				rewardId: selectedDiscount._id,
				rewardName: selectedDiscount.name,
				strategy: selectedDiscount.redeemRule.strategy,
				point: selectedDiscount.redeemRule.parameters.points || 0,
				discountRate: selectedDiscount.redeemRule.parameters.discount,
				discount: selectedDiscount.actualDiscount,
				id: orderRewardId
			};
			if (["voucher", "loyalty"].includes(rewardType)) orderRewards.rewardType = rewardType;
			if (selectedDiscount.redeemRule.strategy === "byPercentageOff" && selectedDiscount.redeemRule.parameters.maxDiscount) orderRewards.maxDiscount = selectedDiscount.redeemRule.parameters.maxDiscount;
			const rewardDiscount = selectedDiscount.actualDiscount;
			order.orderRewards = [orderRewards];
			order.rewardDiscount = rewardDiscount;
			if (isDpEnabled) {
				orderRewards.discountAfterDp = toDpAmount(orderRewards.discount ?? 0);
				order.rewardDiscount = selectedDiscount.redeemRule.strategy === "byPercentageOff" ? toDpAmount(rewardDiscount) : rewardDiscount;
				order.rewardDiscountAfterDp = order.rewardDiscount;
			}
		}
		if (memberCRMInfo.userId) order.crmMemberId = memberCRMInfo.userId;
	} else {
		order.crmCustomerInfo = JSON.stringify(crmCustomerInfo);
		order.crmMemberId = crmCustomerInfo?.id;
		order.needCommit = needCommit ? "1" : "0";
	}
	if (isDpEnabled && order.orderRewards?.length) order.orderRewards = order.orderRewards.map((reward) => ({
		...reward,
		discountAfterDp: toDpAmount(reward.discount ?? 0)
	}));
	if (!isCRMDisabled && memberCRMInfo.userId && outletInfo?.enabled !== 1) {
		order.point = handleCalculatePoint(state, order);
		order.expiration = JSON.stringify(expiration);
	}
	const tableId = state.currentOrder.tableId;
	if ((0, import_isNumber.default)(tableId)) order.tableId = tableId;
	order.kioskOrderServerName = getCookie("kioskLicense") || "kiosklite";
	if (state.currentOrder?.paymentType == "CREDIT_CARD" && allSysConfig?.CREDIT_CHARGE_ENABLE === "true") order.priceType = "CREDIT_PRICE";
	if (orderRewardDiscountList?.length) {
		order.discountList = JSON.stringify(orderRewardDiscountList);
		order.needCommit = needCommit ? "1" : "0";
	}
	const itemPromotionAmount = orderRewardDiscountList?.reduce((pre, cur) => {
		if (cur.type !== "promotion" || !cur.extraInfo.isItemDetailDiscount) return pre;
		return pre + cur.amount;
	}, 0);
	const itemPromotionAmountAfterDp = isDpEnabled ? toDpAmount(itemPromotionAmount || 0) : 0;
	if (itemPromotionAmount > 0) {
		order.totalPrice = Number(Big(order.totalPrice - itemPromotionAmount).toFixed(2));
		if (isDpEnabled) order.totalPriceAfterDp = Number(Big(order.totalPriceAfterDp).minus(itemPromotionAmountAfterDp || 0).toFixed(2));
	}
	obj.order = order;
	if (!options.activityPricing) rememberMemberActivityOrder(obj, sourceState);
	return obj;
}
function getOrderInfoObj(state, options) {
	return getOrderInfoFromPricingState(options?.activityPricing ? getMemberActivityState(state, options) : getMemberCheckoutState(state, options));
}
function getOrderInfoFromPricingState(state) {
	const { crm: { selectedDiscount, selectedFreeItem, isMemberOrderedBefore }, promotion: { orderDiscount, isSkipPromotionCalculation, promotionCode }, avocado, menuItemList, currentOrder } = state;
	const { outletInfo } = avocado;
	const currentOrderListWithoutFreeItem = state.currentOrder.itemList.filter((item) => !item.isFreeItem);
	const isHasRewardDiscount = Object.keys(selectedDiscount)?.length > 0;
	const isCountTaxAfterDiscount = state.systemConfig["IS_DISCOUNT_VOID_TAX"]?.booleanValue;
	const isNeedPriceDiscount = isHasRewardDiscount && isCountTaxAfterDiscount;
	const isDpEnabled = state.currentOrder?.paymentType == "CREDIT_CARD" && (state.allSysConfig?.CREDIT_CHARGE_ENABLE === "true" || state.allSysConfig?.CREDIT_CHARGE_ENABLE === true);
	const dpMultiplier = isDpEnabled ? Number(Big(1).plus(Big(state.allSysConfig?.CREDIT_CHARGE_RATE || 0).div(100))) : 1;
	const toDpAmount = (val) => {
		if (val === void 0 || val === null || val === "") return val;
		return Number(floatNumberRounding(Big(val).times(dpMultiplier).toNumber()));
	};
	let notEligibleId = [];
	if (isHasRewardDiscount) if (avocado.outletInfo?.enabled === 1) {
		const { couponTemplate } = selectedDiscount;
		const { type, value } = couponTemplate?.ruleExpression?.condition?.itemFilter;
		if (type === "all") notEligibleId = [];
		else if (type === "exclude") notEligibleId = value.map((each) => each.itemId);
		else {
			const allItemsId = Object.keys(menuItemList).map((each) => Number(each));
			const includeItemId = value.map((each) => each.itemId);
			notEligibleId = allItemsId.filter((each) => !includeItemId.includes(each));
		}
	} else notEligibleId = selectedDiscount.redeemRule?.eligibility?.object?.items?.map((item) => item.itemId) || [];
	let rewardDiscountRate = null;
	if (isNeedPriceDiscount) {
		const orderItems = [];
		currentOrderListWithoutFreeItem.forEach((item) => {
			orderItems.push({
				...item,
				orderItemPrice: getItemPrice(item)
			});
		});
		if (orderItems?.length > 0) {
			const { actualDiscount } = selectedDiscount;
			if (selectedDiscount.redeemRule.strategy === "byPercentageOff") rewardDiscountRate = reCountDiscountRate(orderItems, notEligibleId, actualDiscount, () => toast_default.info(t("current-amount-error")));
			if (selectedDiscount.redeemRule.strategy === "byFixedAmount") rewardDiscountRate = reCountDiscountRate(isDpEnabled ? orderItems.map((orderItem) => ({
				...orderItem,
				orderItemPrice: toDpAmount(orderItem.orderItemPrice)
			})) : orderItems, notEligibleId, actualDiscount, () => toast_default.info(t("current-amount-error")));
		}
	}
	let order = {};
	order.totalTips = currentOrder?.paymentType === "CASH" ? Number(currentOrder?.tipAmount) || 0 : 0;
	order.roundingStrategy = state.systemConfig["ORDER_TOTAL_ROUNDING_STRATEGY"]?.value;
	order.isTaxWithDiscount = state.systemConfig["IS_DISCOUNT_VOID_TAX"]?.booleanValue;
	order.isTaxWithCharge = state.systemConfig["IS_CHARGE_TAX"]?.booleanValue;
	const currentOrderType = state.currentOrder.orderType || window.selectedOrderType;
	if (currentOrderType === "DINE_IN") order.isTaxExempt = false;
	else order.isTaxExempt = state.systemConfig["IS_EXEMPT_TAX_ON_TAKEOUT_ORDER"]?.booleanValue;
	order.itemInfoList = [];
	const list = [...currentOrderListWithoutFreeItem];
	const freeItem = state.currentOrder?.itemList?.find((e) => e.isFreeItem) || selectedFreeItem?.[0];
	const isBeforeDiscountCountTaxForFreeItem = outletInfo?.enabled === 1 && !isCountTaxAfterDiscount && freeItem;
	if (isBeforeDiscountCountTaxForFreeItem) list.push({
		...freeItem,
		isCRMIntegrationFreeItem: true,
		price: freeItem.itemPrices?.length ? 0 : freeItem.freeItemOriginPrice
	});
	list.forEach((item) => {
		let tempItem = {};
		tempItem.id = item.id;
		const isSkipFreeItemPrice = item.isCRMIntegrationFreeItem && isCountTaxAfterDiscount;
		(state.currentCategoryList.some((cate) => cate.id == item.categoryId) ? state.currentCategoryList : [...state.currentCategoryList, ...isMembershipCard(item) && item.membershipCategory ? [item.membershipCategory] : []]).forEach((cate) => {
			if (cate.id == item.categoryId) {
				tempItem.isApplicablePromotion = cate.applicableToTriggerPromotion;
				tempItem.isSkipDiscount = !cate.applicableToOrderDiscount;
				tempItem.taxObj = [];
				state.taxList.forEach((tax) => {
					if (item.taxIds && item.taxIds.includes(tax.id)) {
						let tempTax = {};
						tempTax.taxId = tax.id;
						tempTax.taxRate = tax.rate;
						tempTax.taxName = tax.name;
						tempTax.extraInfo = {
							isTaxIncrease: tax.taxIncreaseRate > 0,
							priceThreshold: tax.priceLimit,
							taxIncreaseRate: tax.taxIncreaseRate,
							takeoutTaxFree: getTakeoutTaxFree(item, cate, currentOrderType)
						};
						tempItem.taxObj.push(tempTax);
					}
					if (cate.taxIds && cate.taxIds.includes(tax.id)) {
						let tempTax = {};
						tempTax.taxId = tax.id;
						tempTax.taxRate = tax.rate;
						tempTax.taxName = tax.name;
						tempTax.extraInfo = {
							isTaxIncrease: tax.taxIncreaseRate > 0,
							priceThreshold: tax.priceLimit,
							taxIncreaseRate: tax.taxIncreaseRate,
							takeoutTaxFree: getTakeoutTaxFree(item, cate, currentOrderType)
						};
						tempItem.taxObj.push(tempTax);
					}
				});
				tempItem.extraInfo = {
					categroyId: cate.id,
					isQuantityRule: cate.qtyQualifyingForZeroRated > 0,
					quantityThreshold: cate.qtyQualifyingForZeroRated
				};
			}
		});
		if (item.isCRMIntegrationFreeItem) tempItem.isCRMIntegrationFreeItem = true;
		tempItem.itemPrice = isSkipFreeItemPrice ? 0 : item.price || 0;
		tempItem.quantity = item.quantity;
		tempItem.options = [];
		if (item.sectionDetail) item.sectionDetail.forEach((sct) => {
			if (sct.id == -2 || sct.id == -3) sct.options.forEach((opt) => {
				tempItem.options.push({
					optionPrice: opt.isFreeItem || isSkipFreeItemPrice ? 0 : opt.price,
					quantity: opt.quantity
				});
			});
			if (sct.id == -1) tempItem.itemPrice = isSkipFreeItemPrice ? 0 : sct.sizeInfo.price;
		});
		if (item.itemType == "COMBO_SALE_ITEM") {
			tempItem.itemPrice = isSkipFreeItemPrice ? 0 : getItemPrice(item);
			tempItem.options = [];
		}
		if (item.discountID) {
			tempItem.discountID = item.discountID;
			tempItem.discountName = item.discountName;
			tempItem.discountRate = item.discountRate;
			tempItem.discountRateType = item.discountRateType;
			tempItem.discount = Number(item.discount);
			if (isDpEnabled && item.isCRMIntegrationFreeItem !== true) tempItem.discount = toDpAmount(tempItem.discount ?? 0);
			if (item.isHasNoDiscountSubDish) {
				tempItem.discountID = -1;
				tempItem.discountRateType = 1;
			}
		}
		if (isCountTaxAfterDiscount && (item.promotionRewardItem || item.campaignRewardItem)) {
			tempItem.originItemPrice = tempItem.itemPrice;
			tempItem.itemPrice = Number(Big(tempItem.itemPrice).minus(Big(item.actualDiscount).div(tempItem.quantity)));
		}
		order.itemInfoList.push(tempItem);
	});
	let taxCalculator = new SalesTaxCalculator();
	if (state.systemConfig.COUNTRY_STATES_PROVINCE_TERRITORY?.value == "ONTARIO") taxCalculator = new CanadaOntarioTaxCalculator();
	let chargeDetail = null;
	order.chargeObj = {};
	const currentPaymentType = getCurrentPaymentType(state.currentOrder?.paymentType, state.currentOrder?.paymentTypeTrail || []);
	const isGiftCardAndCreditCardMixed = isGiftCardWithCreditCardOrder(state.currentOrder?.paymentTypeTrail || []);
	if (currentPaymentType === "CREDIT_CARD") {
		if (state.selfConfig?.charge?.length && state.allSysConfig?.CREDIT_CHARGE_ENABLE !== "true" && state.allSysConfig?.CREDIT_CHARGE_ENABLE !== true) {
			let noNeedChargeAmount = 0;
			if (state.giftCardPaymentInfo?.paidTotal) noNeedChargeAmount = state.giftCardPaymentInfo?.paidTotal;
			let r = state.selfConfig.charge.find((c) => c.id === 1);
			if (r?.select?.id) chargeDetail = new WholeOrderCharge(r.select.ratetype, r.select.rate, state.systemConfig.IS_CHARGE_TAX.booleanValue, noNeedChargeAmount);
		}
		if (state.allSysConfig?.CREDIT_CHARGE_ENABLE === "true" && !isGiftCardAndCreditCardMixed) order.DPRate = Number(Big(state.allSysConfig?.CREDIT_CHARGE_RATE).div(100));
	}
	let togoTaxDetail = null;
	if (currentOrderType === "TO_GO" || currentOrderType === "PICK_UP") {
		if (state.togoList.some((item) => item?.select?.id)) togoTaxDetail = new TogoCharge(state.togoList, state.systemConfig.IS_CHARGE_TAX.booleanValue, getItemCount(itemList));
	}
	const orderPricing = new OrderPricing(new DiscountChargeCalculator(), taxCalculator, chargeDetail, togoTaxDetail);
	let promotionDiscountInfo = void 0;
	const isHasCrmCampaign = isHasCRMCampaignFn({
		itemList: currentOrder.itemList,
		selectedFreeItem,
		selectedDiscount
	});
	if (orderDiscount.length > 0 && !isSkipPromotionCalculation && !isHasCrmCampaign) {
		const itemPrices = currentOrderListWithoutFreeItem.filter((item) => {
			return getOrderItemCategory(state.currentCategoryList, item)?.applicableToTriggerPromotion;
		}).reduce((pre, cur) => {
			return Big(pre).plus(Big(getItemPrice(cur) || 0).times(cur.quantity));
		}, 0);
		const totalItemPrices = Number(itemPrices.toFixed(2));
		const overStandardDiscounts = orderDiscount.filter((discountInfo) => totalItemPrices >= Number(discountInfo?.activityRule?.satisfyPrice) && discountInfo?.activityRule?.usePromotionCode !== "1");
		const findBestDiscount = (promotions, totalItemPrices) => {
			const satisfyDiscount = promotions.map((each) => {
				const { activityRule: { discountNumber, discountType, isFirstOrderDiscount } } = each;
				const actualDiscount = discountType === "fixDiscount" ? Number(discountNumber) : Number(Big(totalItemPrices).times(Big(discountNumber).div(100)).toFixed(2));
				return {
					...each,
					activityRule: {
						...each.activityRule,
						isFirstOrderDiscount: isFirstOrderDiscount || "0"
					},
					actualDiscount
				};
			}).sort((a, b) => b.actualDiscount - a.actualDiscount);
			if (!isMemberOrderedBefore) return satisfyDiscount[0];
			return satisfyDiscount.find((each) => each.activityRule.isFirstOrderDiscount === "0");
		};
		if (promotionCode) {
			const selectedPromotion = orderDiscount.find((item) => item?.activityRule?.promotionCode === promotionCode);
			const { activityRule: { discountNumber, discountType, satisfyPrice, isFirstOrderDiscount } } = selectedPromotion;
			const actualDiscount = discountType === "fixDiscount" ? Number(discountNumber) : Number(Big(totalItemPrices).times(Big(discountNumber).div(100)).toFixed(2));
			if (totalItemPrices >= Number(satisfyPrice)) {
				if (isFirstOrderDiscount === "1" && !isMemberOrderedBefore || isFirstOrderDiscount === "0") promotionDiscountInfo = {
					...selectedPromotion,
					actualDiscount
				};
			}
		} else promotionDiscountInfo = findBestDiscount(overStandardDiscounts, totalItemPrices);
		if (promotionDiscountInfo) {
			const { activityRule: { discountNumber, discountType } } = promotionDiscountInfo;
			const discountIsPer = discountType === "rateDiscount";
			order.discountObj = { promotionDiscount: {
				discountIsPer,
				discountRate: discountIsPer ? Number(Big(discountNumber).div(100).toFixed(2)) : null,
				discount: discountIsPer ? null : Number(Big(discountNumber).toFixed(2))
			} };
			window.kioskLocalDiscountPromotion = promotionDiscountInfo;
		} else window.kioskLocalDiscountPromotion = null;
	} else window.kioskLocalDiscountPromotion = null;
	const orderPrice = orderPricing.orderDetailPrice(order);
	if (promotionDiscountInfo) orderPrice.promotionDiscountInfo = promotionDiscountInfo;
	if (isNeedPriceDiscount) {
		const discountOrder = (0, import_cloneDeep.default)(order);
		discountOrder.itemInfoList = discountOrder.itemInfoList.map((orderItem) => {
			let isNeedDiscount = !notEligibleId.includes(orderItem.id);
			if (orderItem.options?.length > 0) {
				const newOptions = orderItem.options.map((opts) => {
					return {
						...opts,
						optionPrice: countActualPrice(opts.optionPrice, rewardDiscountRate, isNeedDiscount)
					};
				});
				return {
					...orderItem,
					options: newOptions,
					itemPrice: countActualPrice(orderItem.itemPrice, rewardDiscountRate, isNeedDiscount)
				};
			}
			return {
				...orderItem,
				itemPrice: countActualPrice(orderItem.itemPrice, rewardDiscountRate, isNeedDiscount)
			};
		});
		const discountOrderPrice = orderPricing.orderDetailPrice(discountOrder);
		return {
			...orderPrice,
			orderTaxTotal: discountOrderPrice.orderTaxTotal,
			orderTaxDetail: discountOrderPrice.orderTaxDetail,
			orderSubtotal: orderPrice.orderSubtotal - orderPrice.orderCharge + discountOrderPrice.orderCharge,
			orderCharge: discountOrderPrice.orderCharge
		};
	}
	if (isBeforeDiscountCountTaxForFreeItem) {
		const itemPrice = getItemPrice({
			...freeItem,
			price: freeItem.itemPrices?.length ? 0 : freeItem.freeItemOriginPrice
		});
		const subtract = (val) => Number(Big(val).minus(itemPrice).toFixed(2));
		return {
			...orderPrice,
			orderOriginalTotal: subtract(orderPrice.orderOriginalTotal),
			orderSubtotal: subtract(orderPrice.orderSubtotal),
			orderTotal: subtract(orderPrice.orderTotal)
		};
	}
	const isHasRewardItem = list.find((e) => e.promotionRewardItem || e.campaignRewardItem);
	if (isCountTaxAfterDiscount && isHasRewardItem) {
		const orderOriginPrice = order.itemInfoList?.reduce((pre, cur) => {
			const optionsPrice = cur?.options?.reduce((preOption, curOption) => {
				return Big(preOption).plus(Big(curOption.optionPrice || 0).times(curOption.quantity || 1));
			}, 0) || 0;
			const itemOriginPrice = Big(cur.originItemPrice ?? cur.itemPrice ?? 0).plus(optionsPrice);
			return Big(pre).plus(itemOriginPrice.times(cur.quantity || 1));
		}, 0);
		const discountVal = Number(Big(orderOriginPrice).minus(orderPrice.orderSubtotal));
		const addPrice = (val) => Number(Big(val).plus(discountVal).toFixed(2));
		return {
			...orderPrice,
			orderOriginalTotal: addPrice(orderPrice.orderOriginalTotal),
			orderSubtotal: addPrice(orderPrice.orderSubtotal),
			orderTotal: addPrice(orderPrice.orderTotal)
		};
	}
	return orderPrice;
}
function getItemFromCategoryList(id, categoryList) {
	let targetItem = null;
	categoryList.forEach((cate) => {
		if (cate.saleItems) cate.saleItems.forEach((item) => {
			if (item.id == id) targetItem = item;
		});
	});
	return targetItem;
}
function handleCalculatePoint(state, order) {
	const { crm: { earningRule } } = state;
	const { type, orderItems, charge, totalTax, totalPrice, totalTips, rewardDiscount, discount } = order;
	const pointOrderInfo = {
		orderType: type,
		orderItems,
		price: {
			subTotal: totalPrice,
			total: Big(totalPrice).plus(totalTax).plus(totalTips).plus(charge).toNumber(),
			charge,
			taxTotal: totalTax,
			tips: totalTips,
			discount: parseFloat(Big(rewardDiscount ?? 0).plus(discount ?? 0).toFixed(2)) ?? 0,
			round: 0
		}
	};
	const cal = window.PointCalculator.Calculator;
	return new cal({
		description: "earning point calc",
		version: "1.0.0",
		createAt: "2023-06-01",
		updateAt: "2023-06-01",
		tasks: [{
			description: "earning calc",
			name: "earningTask"
		}]
	}).doEarningCalc(pointOrderInfo, earningRule);
}
function getItemCount(itemList) {
	return itemList.reduce((pre, cur) => {
		return pre + cur.quantity;
	}, 0);
}
async function countAmount(state, payByCash, payByCard) {
	const { currentOrder, currentOrder: { paymentType, paymentTypeTrail } } = state;
	const currentPaymentType = getCurrentPaymentType(paymentType, paymentTypeTrail);
	const calculateOrderAmount = (orderInfo, orderData, tipAmount = 0) => {
		const subTotal = orderInfo?.orderSubtotal;
		const totalTax = orderInfo?.orderTaxTotal;
		const charge = orderInfo?.chargeTotal;
		const togoTotal = orderInfo?.togoTotal;
		const orderDiscount = orderInfo?.orderDiscount;
		let rewardDiscount = orderData?.rewardDiscount || 0;
		if (orderData?.discountList) {
			const orderRewardDiscountList = JSON.parse(orderData?.discountList);
			if (orderRewardDiscountList?.length > 0) {
				const discountInfo = orderRewardDiscountList[0];
				if (discountInfo?.type === "promotion") rewardDiscount = discountInfo?.amount;
				else if (!discountInfo?.isReward) rewardDiscount = discountInfo?.amount;
			}
		}
		return {
			subTotal,
			totalTax,
			charge,
			togoTotal,
			rewardDiscount,
			orderDiscount,
			tipAmount
		};
	};
	await payByCash();
	const updatedState_CASH = native_store_default.getState();
	const orderInfo_CASH = getOrderInfoObj(updatedState_CASH);
	const orderData_CASH = generateSubmitOrderObj(updatedState_CASH)?.order;
	const cashAmounts = calculateOrderAmount(orderInfo_CASH, orderData_CASH, currentOrder?.tipAmount);
	const cashPaymentTotal = safeBig(cashAmounts?.subTotal).plus(safeBig(cashAmounts?.totalTax)).plus(safeBig(cashAmounts?.togoTotal)).plus(safeBig(cashAmounts?.tipAmount)).minus(safeBig(cashAmounts?.rewardDiscount)).minus(safeBig(cashAmounts?.orderDiscount)).toFixed(2);
	await payByCard();
	const updatedState = native_store_default.getState();
	const orderInfo = getOrderInfoObj(updatedState);
	const orderData = generateSubmitOrderObj(updatedState)?.order;
	const creditAmounts = calculateOrderAmount(orderInfo, orderData, currentOrder?.tipAmount);
	const creditPaymentTotal = safeBig(creditAmounts?.subTotal).plus(safeBig(creditAmounts?.totalTax)).plus(safeBig(creditAmounts?.charge)).plus(safeBig(creditAmounts?.togoTotal)).plus(safeBig(creditAmounts?.tipAmount)).minus(safeBig(creditAmounts?.rewardDiscount)).minus(safeBig(creditAmounts?.orderDiscount)).toFixed(2);
	if (currentPaymentType === "CASH") await payByCash();
	else if (currentPaymentType === "CREDIT_CARD") await payByCard();
	await new Promise((resolve) => setTimeout(resolve, 0));
	return {
		...currentPaymentType === "CASH" ? cashAmounts : creditAmounts,
		cashPaymentTotal,
		creditPaymentTotal,
		totalAmount: currentPaymentType === "CASH" ? cashPaymentTotal : creditPaymentTotal
	};
}
//#endregion
//#region source-snapshot/src/utils/getJudgeOrderDishItem.js
var getJudgeOrderDishItem = () => {
	const { crm: { selectedFreeItem }, currentOrder: { itemList } } = native_store_default.getState();
	const items = [...itemList];
	if (selectedFreeItem?.length > 0) items.push(...selectedFreeItem);
	return items;
};
//#endregion
//#region source-snapshot/src/utils/refreshOrderStockBeforeSubmit.js
var refreshOrderStockBeforeSubmit = async ({ refreshStock, getOrderItems, judgeOrder, onRefreshError }) => {
	try {
		await refreshStock();
	} catch (error) {
		onRefreshError?.(error);
		return {
			status: "refresh_failed",
			error
		};
	}
	return {
		status: "validated",
		dishMap: judgeOrder(getOrderItems())
	};
};
//#endregion
//#region source-snapshot/src/api/menu.js
var KPOS_WEBAPP_MENU_PATH = "webapp/menu/menu";
/**
* kpos/webapp/menu/menu 通用请求，通过 params 传入不同查询参数
* @example fetchKposWebappMenu({ product: 'KIOSK', showStock: true })
* @example fetchKposWebappMenu({ product: 'ALL' })
*/
function fetchKposWebappMenu(params = {}) {
	return axiosGet(serverURL + KPOS_WEBAPP_MENU_PATH, { params });
}
/** 带库存数量的 Kiosk 菜单 */
function fetchKioskMenuWithStock() {
	return fetchKposWebappMenu({
		product: "KIOSK",
		showStock: true
	});
}
//#endregion
//#region source-snapshot/src/utils/syncMenuStockNum.js
var requestVersions = /* @__PURE__ */ new WeakMap();
var buildMenuItemList = (menus) => {
	const menuItemList = {};
	for (const group of menus || []) for (const category of group.menuCategories || []) for (const item of category.saleItems || []) {
		menuItemList[item.id] = item;
		if (item.oId != null) menuItemList[item.oId] = item;
	}
	getMenuStockIndex(menuItemList);
	return menuItemList;
};
var stringifyStockEntries = (entries) => JSON.stringify(entries, (key, value) => key === "stockNum" && typeof value === "number" && !Number.isFinite(value) ? String(value) : value);
var logSnapshot = (entries, phase) => {
	const prefix = `${phase} menu items with stock quantity: `;
	let batch = [];
	for (const entry of entries) {
		if (batch.length && stringifyStockEntries([...batch, entry]).length > 1200) {
			posFrontLog(prefix + stringifyStockEntries(batch));
			batch = [];
		}
		batch.push(entry);
	}
	if (batch.length || !entries.length) posFrontLog(prefix + stringifyStockEntries(batch));
};
async function syncMenuStockNum$1(dispatch, getState, { onlyIfChanged = false, source = "menu-refresh" } = {}) {
	const versions = requestVersions.get(getState) || {
		requested: 0,
		applied: 0
	};
	requestVersions.set(getState, versions);
	const version = ++versions.requested;
	const res = await fetchKioskMenuWithStock();
	const payload = res?.data?.data ?? res?.data;
	const menus = payload?.menus ?? payload?.KioskMenus;
	if (!Array.isArray(menus) || !menus.some((menu) => menu.active === true && Array.isArray(menu.menuGroups))) throw new Error("Invalid stock snapshot");
	if (version < versions.applied) return getState().menuGroup;
	const stockMenuGroups = getMenuGroupsFromMenuResponse(res.data);
	const entries = getItemsWithStockNum(stockMenuGroups);
	const snapshot = stringifyStockEntries(entries.map(({ id, stockNum }) => ({
		id,
		stockNum
	})).sort((left, right) => String(left.id).localeCompare(String(right.id))));
	if (source === "before-submit") logSnapshot(entries, "Before submit");
	else if (versions.snapshot === void 0) logSnapshot(entries, "Initial");
	else if (versions.snapshot !== snapshot) logSnapshot(entries, "Updated");
	versions.snapshot = snapshot;
	const stockNumMap = buildStockNumMap(stockMenuGroups);
	const { menuGroup, currentSaleItems, currentItem } = getState();
	const updatedMenuGroup = applyStockNumToMenuGroups(menuGroup, stockNumMap);
	const changed = updatedMenuGroup !== menuGroup;
	versions.applied = version;
	if (onlyIfChanged && !changed) return menuGroup;
	dispatch({
		type: MENU_ITEM_LIST,
		menuItemList: buildMenuItemList(updatedMenuGroup)
	});
	dispatch({
		type: FETCH_MENUGROUP,
		menuGroup: updatedMenuGroup
	});
	if (currentSaleItems?.length) dispatch({
		type: CURRENT_SALE_ITEMS,
		currentSaleItems: applyStockNumToSaleItems(currentSaleItems, stockNumMap)
	});
	if (currentItem && getIndexedStockItem(currentItem, stockNumMap)) dispatch({
		type: CURRENT_ITEM,
		currentItem: applyStockNumToSaleItems([currentItem], stockNumMap)[0]
	});
	return updatedMenuGroup;
}
//#endregion
//#region source-snapshot/src/utils/itemIsSoldOut.js
var MENU_OUT_OF_STOCK_MIN_POS_VERSION = 18030160400;
var isSameId = (a, b) => a != null && b != null && String(a) === String(b);
var shouldUseMenuOutOfStock = () => Number(getPosVersion(localStorage.getItem("posVersion"))) >= MENU_OUT_OF_STOCK_MIN_POS_VERSION;
var isInKioskSoldOutList = (item, kioskSoldOutList = []) => (kioskSoldOutList || []).some((soldoutId) => isSameId(soldoutId, item?.id) || isSameId(soldoutId, item?.oId) || isSameId(soldoutId, item?.cloudId));
var checkBaseDishSoldOut = (item, { kioskSoldOutList }) => {
	if (shouldUseMenuOutOfStock()) return !!item?.outOfStock;
	return isInKioskSoldOutList(item, kioskSoldOutList);
};
var checkBaseSubOptionSoldOut = (currentItem, option, subOption, { kioskSoldOutList } = {}) => {
	const currentOption = currentItem?.options?.find((opt) => isSameId(opt?.id, option?.id) || isSameId(opt?.id, subOption?.itemOptionId) || isSameId(opt?.id, subOption?.id));
	if (!currentOption) return shouldUseMenuOutOfStock() ? !!subOption?.outOfStock : isInKioskSoldOutList(subOption, kioskSoldOutList);
	const resolvedSubOption = currentOption?.subOptions?.find((sub) => isSameId(sub?.id, subOption?.id)) ?? subOption;
	if (!shouldUseMenuOutOfStock()) return isInKioskSoldOutList(resolvedSubOption, kioskSoldOutList);
	if ((!currentOption?.subOptions?.length || isSameId(currentOption?.id, subOption?.id)) && currentOption?.outOfStock) return true;
	return !!resolvedSubOption?.outOfStock;
};
var checkBaseSubOptionUnavailable = (currentItem, option, subOption) => {
	const currentOption = currentItem?.options?.find((opt) => isSameId(opt?.id, option?.id) || isSameId(opt?.id, subOption?.itemOptionId) || isSameId(opt?.id, subOption?.itemOption?.id));
	if (!currentOption) return subOption?.enabled === false;
	if (!currentOption?.subOptions?.length) return false;
	return (currentOption.subOptions.find((sub) => isSameId(sub?.id, subOption?.id)) ?? subOption)?.enabled === false;
};
var getCurrentSubOption = (currentItem, option, subOption) => {
	const currentOption = currentItem?.options?.find((opt) => isSameId(opt?.id, option?.id) || isSameId(opt?.id, subOption?.itemOptionId) || isSameId(opt?.id, subOption?.itemOption?.id));
	if (!currentOption?.subOptions?.length) return subOption;
	return currentOption.subOptions.find((sub) => isSameId(sub?.id, subOption?.id)) || subOption;
};
var getSubOptionAvailableQty = (currentItem, option, subOption) => {
	const currentSubOption = getCurrentSubOption(currentItem, option, subOption);
	const addLimit = currentSubOption?.addLimit ?? 0;
	const stockNum = Number(currentSubOption?.stockNum);
	const hasStockLimit = Number.isFinite(stockNum);
	if (addLimit > 0 && hasStockLimit) return Math.min(addLimit, Math.max(stockNum, 0));
	if (addLimit > 0) return addLimit;
	if (hasStockLimit) return Math.max(stockNum, 0);
	return Number.MAX_SAFE_INTEGER;
};
var getComboSectionItemAvailableQty = (currentChildItem, comboSectionSaleItem, allowRepeatedItems) => {
	const stockNum = Number(currentChildItem?.stockNum);
	const hasStockLimit = Number.isFinite(stockNum);
	const availableStock = hasStockLimit ? Math.max(stockNum, 0) : void 0;
	if (!allowRepeatedItems) return hasStockLimit ? Math.min(availableStock, 1) : 1;
	const addLimit = comboSectionSaleItem?.addLimit ?? 0;
	if (addLimit > 0 && hasStockLimit) return Math.min(addLimit, availableStock);
	if (addLimit > 0) return addLimit;
	if (hasStockLimit) return availableStock;
	return Number.MAX_SAFE_INTEGER;
};
var getOrderItemId = (item) => {
	if (!item) return;
	if (item?.isFreeItem && item?.oId != null) return item.oId;
	return item?.id;
};
var resolveCurrentItem = (item, menuItemList = {}) => {
	if (!item) return item;
	const direct = menuItemList[item?.id];
	if (direct) return direct;
	if (item?.cloudId) {
		const byCloudId = Object.values(menuItemList).find((menuItem) => menuItem?.cloudId === item.cloudId);
		if (byCloudId) return byCloudId;
	}
	return item;
};
var buildSoldOutDetail = ({ soldoutItem, soldoutType, parentItem }) => {
	const soldoutItemId = getOrderItemId(soldoutItem) ?? soldoutItem?.id;
	const parentItemId = getOrderItemId(parentItem) ?? parentItem?.id;
	return {
		id: soldoutItemId,
		cloudId: soldoutItem?.cloudId,
		name: soldoutItem?.name,
		fieldDisplayNameGroups: soldoutItem?.fieldDisplayNameGroups,
		soldoutType,
		parentId: parentItemId,
		parentName: parentItem?.name,
		parentFieldDisplayNameGroups: parentItem?.fieldDisplayNameGroups,
		soldoutDisplayKey: soldoutType === "item" ? `item_${soldoutItemId}` : `${soldoutType}_${parentItemId ?? ""}_${soldoutItemId}`
	};
};
var findOptionInfoBySubOptionId = (optionMap, subOptionId) => {
	for (const option of Object.values(optionMap)) if (option?.subOptions?.some((subOption) => isSameId(subOption?.id, subOptionId))) return option;
};
var collectOrderSoldOutDetailsInternal = (orderItem, config = {}, parentItem) => {
	const menuItemList = config?.menuItemList ?? native_store_default.getState().menuItemList;
	const kioskSoldOutList = config?.kioskSoldOutList ?? native_store_default.getState().selfConfig?.soldOut;
	const itemId = getOrderItemId(orderItem);
	if (itemId == null) return [];
	const currentItem = resolveCurrentItem({
		...orderItem,
		id: itemId
	}, menuItemList);
	if (checkBaseDishSoldOut(currentItem, { kioskSoldOutList })) return [buildSoldOutDetail({
		soldoutItem: currentItem,
		soldoutType: parentItem ? "subItem" : "item",
		parentItem
	})];
	const details = [];
	const optionMap = {};
	for (const option of currentItem?.options || []) optionMap[option?.id] = option;
	const optionSectionList = orderItem?.selectedOptionList?.length ? orderItem.selectedOptionList : orderItem?.sectionDetail;
	for (const section of optionSectionList || []) {
		if (section?.id !== -2) continue;
		for (const subOption of section?.options || []) {
			const optionInfo = subOption?.itemOption || optionMap[subOption?.itemOptionId] || optionMap[subOption?.itemOption?.id] || findOptionInfoBySubOptionId(optionMap, subOption?.id);
			if (checkBaseSubOptionSoldOut(currentItem, optionInfo, subOption, { kioskSoldOutList }) || checkBaseSubOptionUnavailable(currentItem, optionInfo, subOption)) details.push(buildSoldOutDetail({
				soldoutItem: subOption,
				soldoutType: "option",
				parentItem: orderItem
			}));
		}
	}
	for (const section of orderItem?.sectionDetail || []) {
		if (section?.id <= 0) continue;
		for (const subItem of section?.items || []) details.push(...collectOrderSoldOutDetailsInternal(subItem, config, orderItem));
	}
	return details;
};
var checkSoldOut = (item, config) => {
	const kioskSoldOutList = config?.kioskSoldOutList ?? native_store_default.getState().selfConfig?.soldOut;
	const menuItemList = config?.menuItemList ?? native_store_default.getState().menuItemList;
	const fromOrder = config?.fromOrder ?? false;
	const currentItem = resolveCurrentItem(item, menuItemList);
	let finalSoldOut = checkBaseDishSoldOut(currentItem, { kioskSoldOutList });
	if (finalSoldOut) return true;
	if (fromOrder) {
		const findOptionInfoBySubOptionId = (subOptionId) => {
			for (const option of currentItem?.options || []) if (option?.subOptions?.some((sub) => isSameId(sub?.id, subOptionId))) return option;
		};
		for (let i = 0; i < item?.sectionDetail?.length; i++) {
			const sectionDetailItem = item.sectionDetail[i];
			if (sectionDetailItem?.id === -2) for (let j = 0; j < sectionDetailItem?.options?.length; j++) {
				const subOption = sectionDetailItem.options[j];
				const option = subOption?.itemOption || findOptionInfoBySubOptionId(subOption?.id);
				if (checkBaseSubOptionSoldOut(currentItem, option, subOption, { kioskSoldOutList }) || checkBaseSubOptionUnavailable(currentItem, option, subOption)) return true;
			}
			if (sectionDetailItem?.id > 0) for (let j = 0; j < sectionDetailItem?.items?.length; j++) {
				const dishItem = sectionDetailItem.items[j];
				if (checkSoldOut(dishItem, config)) return true;
			}
		}
		return false;
	} else {
		for (let i = 0; i < item?.comboSections?.length; i++) {
			const comboSection = item.comboSections[i];
			const sectionItems = comboSection?.comboSectionSaleItems?.length ? comboSection.comboSectionSaleItems : comboSection?.saleItems || [];
			const min = comboSection?.minNumOfSelectionAllowed ?? 0;
			let maxAvailableQty = 0;
			let hasUnlimitedQty = false;
			const soldOutChildIdSet = /* @__PURE__ */ new Set();
			for (let j = 0; j < sectionItems.length; j++) {
				const comboSectionSaleItem = sectionItems[j];
				const childItemId = comboSectionSaleItem?.saleItemId ?? comboSectionSaleItem?.id;
				const currentChildItem = menuItemList[childItemId] ?? {
					...comboSectionSaleItem,
					id: childItemId
				};
				if (checkSoldOut(currentChildItem, {
					...config,
					kioskSoldOutList
				})) {
					soldOutChildIdSet.add(childItemId);
					continue;
				}
				const availableQty = getComboSectionItemAvailableQty(currentChildItem, comboSectionSaleItem, comboSection?.allowRepeatedItems);
				if (availableQty === Number.MAX_SAFE_INTEGER) {
					hasUnlimitedQty = true;
					break;
				}
				maxAvailableQty += availableQty;
			}
			if (sectionItems.some((sectionItem) => {
				if (!sectionItem?.preSelected) return false;
				const sectionItemId = sectionItem?.saleItemId ?? sectionItem?.id;
				return soldOutChildIdSet.has(sectionItemId);
			})) {
				finalSoldOut = true;
				break;
			}
			if (min <= 0) continue;
			const max = comboSection?.maxNumOfSelectionAllowed;
			const sectionMaxQty = comboSection?.priceRule === "FIXED_UNTIL_MAX" || max == void 0 ? Number.MAX_SAFE_INTEGER : max;
			if ((hasUnlimitedQty ? Number.MAX_SAFE_INTEGER : Math.min(maxAvailableQty, sectionMaxQty)) < min) {
				finalSoldOut = true;
				break;
			}
		}
		if (finalSoldOut) return true;
		const optionList = currentItem?.options || item?.options || [];
		for (let i = 0; i < optionList.length; i++) {
			const option = optionList[i];
			const subOptions = option?.subOptions || [];
			const min = option?.min ?? 0;
			if (min <= 0) continue;
			let maxAvailableQty = 0;
			let hasUnlimitedQty = false;
			for (let j = 0; j < subOptions.length; j++) {
				const subOption = subOptions[j];
				if (checkBaseSubOptionSoldOut(currentItem, option, subOption, { kioskSoldOutList }) || checkBaseSubOptionUnavailable(currentItem, option, subOption)) continue;
				const availableQty = getSubOptionAvailableQty(currentItem, option, subOption);
				if (availableQty === Number.MAX_SAFE_INTEGER) {
					hasUnlimitedQty = true;
					break;
				}
				maxAvailableQty += availableQty;
			}
			const max = option?.max;
			const optionMaxQty = max == void 0 ? Number.MAX_SAFE_INTEGER : max;
			if ((hasUnlimitedQty ? Number.MAX_SAFE_INTEGER : Math.min(maxAvailableQty, optionMaxQty)) < min) {
				finalSoldOut = true;
				break;
			}
		}
		if (finalSoldOut) return true;
		return false;
	}
};
var checkUnavailable = (item, config = {}) => {
	const kioskSoldOutList = config?.kioskSoldOutList ?? native_store_default.getState().selfConfig?.soldOut;
	const menuItemList = config?.menuItemList ?? native_store_default.getState().menuItemList;
	const fromOrder = config?.fromOrder ?? false;
	const currentItem = resolveCurrentItem(item, menuItemList);
	if (fromOrder) {
		const findCurrentOptionBySubOptionId = (subOptionId) => {
			for (const option of currentItem?.options || []) if (option?.subOptions?.some((sub) => isSameId(sub?.id, subOptionId))) return option;
		};
		for (let i = 0; i < item?.sectionDetail?.length; i++) {
			const sectionDetailItem = item.sectionDetail[i];
			if (sectionDetailItem?.id === -2) for (let j = 0; j < sectionDetailItem?.options?.length; j++) {
				const subOption = sectionDetailItem.options[j];
				if (checkBaseSubOptionUnavailable(currentItem, subOption?.itemOption || findCurrentOptionBySubOptionId(subOption?.id), subOption)) return true;
			}
			if (sectionDetailItem?.id > 0) for (let j = 0; j < sectionDetailItem?.items?.length; j++) {
				const dishItem = sectionDetailItem.items[j];
				if (checkUnavailable(dishItem, config)) return true;
			}
		}
		return false;
	}
	for (let i = 0; i < currentItem?.comboSections?.length; i++) {
		const comboSection = currentItem.comboSections[i];
		const sectionItems = comboSection?.comboSectionSaleItems?.length ? comboSection.comboSectionSaleItems : comboSection?.saleItems || [];
		const min = comboSection?.minNumOfSelectionAllowed ?? 0;
		let maxAvailableQty = 0;
		let hasUnlimitedQty = false;
		let hasUnavailable = false;
		const unavailableChildIdSet = /* @__PURE__ */ new Set();
		for (let j = 0; j < sectionItems.length; j++) {
			const comboSectionSaleItem = sectionItems[j];
			const childItemId = comboSectionSaleItem?.saleItemId ?? comboSectionSaleItem?.id;
			const currentChildItem = menuItemList[childItemId] ?? {
				...comboSectionSaleItem,
				id: childItemId
			};
			const childUnavailable = checkUnavailable(currentChildItem, config);
			const childSoldOut = !!comboSectionSaleItem?.outOfStock || (kioskSoldOutList || []).some((soldoutId) => String(soldoutId) === String(childItemId)) || checkSoldOut(currentChildItem, config);
			if (childUnavailable || childSoldOut) {
				if (childUnavailable) {
					hasUnavailable = true;
					unavailableChildIdSet.add(childItemId);
				}
				continue;
			}
			const availableQty = getComboSectionItemAvailableQty(currentChildItem, comboSectionSaleItem, comboSection?.allowRepeatedItems);
			if (availableQty === Number.MAX_SAFE_INTEGER) {
				hasUnlimitedQty = true;
				break;
			}
			maxAvailableQty += availableQty;
		}
		if (sectionItems.some((sectionItem) => {
			if (!sectionItem?.preSelected) return false;
			const sectionItemId = sectionItem?.saleItemId ?? sectionItem?.id;
			return unavailableChildIdSet.has(sectionItemId);
		})) return true;
		if (min <= 0) continue;
		const max = comboSection?.maxNumOfSelectionAllowed;
		const sectionMaxQty = comboSection?.priceRule === "FIXED_UNTIL_MAX" || max == void 0 ? Number.MAX_SAFE_INTEGER : max;
		const sectionAvailableMaxQty = hasUnlimitedQty ? Number.MAX_SAFE_INTEGER : Math.min(maxAvailableQty, sectionMaxQty);
		if (hasUnavailable && sectionAvailableMaxQty < min) return true;
	}
	const optionList = currentItem?.options || item?.options || [];
	for (let i = 0; i < optionList.length; i++) {
		const option = optionList[i];
		const subOptions = option?.subOptions || [];
		const min = option?.min ?? 0;
		if (min <= 0) continue;
		let maxAvailableQty = 0;
		let hasUnlimitedQty = false;
		let hasUnavailable = false;
		for (let j = 0; j < subOptions.length; j++) {
			const subOption = subOptions[j];
			const subUnavailable = checkBaseSubOptionUnavailable(currentItem, option, subOption);
			const subSoldOut = checkBaseSubOptionSoldOut(currentItem, option, subOption);
			if (subUnavailable || subSoldOut) {
				if (subUnavailable) hasUnavailable = true;
				continue;
			}
			const availableQty = getSubOptionAvailableQty(currentItem, option, subOption);
			if (availableQty === Number.MAX_SAFE_INTEGER) {
				hasUnlimitedQty = true;
				break;
			}
			maxAvailableQty += availableQty;
		}
		const max = option?.max;
		const optionMaxQty = max == void 0 ? Number.MAX_SAFE_INTEGER : max;
		const optionAvailableMaxQty = hasUnlimitedQty ? Number.MAX_SAFE_INTEGER : Math.min(maxAvailableQty, optionMaxQty);
		if (hasUnavailable && optionAvailableMaxQty < min) return true;
	}
	return false;
};
var itemIsSoldOut = (item, options) => {
	if (!item) return false;
	const itemId = getOrderItemId(item);
	return checkSoldOut({
		...item,
		id: itemId
	}, options);
};
var getOrderSoldOutDetails = (orderItem, options = {}) => {
	if (!orderItem) return [];
	const itemId = getOrderItemId(orderItem);
	if (itemId == null) return [];
	const details = collectOrderSoldOutDetailsInternal(orderItem, options);
	if (details.length) return details;
	if (!checkSoldOut({
		...orderItem,
		id: itemId
	}, {
		...options,
		fromOrder: true
	})) return [];
	return [buildSoldOutDetail({
		soldoutItem: orderItem,
		soldoutType: "item"
	})];
};
var itemIsSubOptionSoldOut = (item, option, subOption, config) => {
	if (!item || !option || !subOption) return false;
	const menuItemList = config?.menuItemList ?? native_store_default.getState().menuItemList;
	const itemId = getOrderItemId(item);
	return checkBaseSubOptionSoldOut(resolveCurrentItem({
		...item,
		id: itemId
	}, menuItemList), option, subOption, { kioskSoldOutList: config?.kioskSoldOutList ?? native_store_default.getState().selfConfig?.soldOut });
};
var itemIsSubOptionUnavailable = (item, option, subOption, config) => {
	if (!item || !option || !subOption) return false;
	const menuItemList = config?.menuItemList ?? native_store_default.getState().menuItemList;
	const itemId = getOrderItemId(item);
	return checkBaseSubOptionUnavailable(resolveCurrentItem({
		...item,
		id: itemId
	}, menuItemList), option, subOption);
};
var itemIsUnavailable = (item, options) => {
	if (!item) return false;
	const itemId = getOrderItemId(item);
	return checkUnavailable({
		...item,
		id: itemId
	}, options);
};
var getItemStoppedStatus = (item, options) => {
	if (itemIsUnavailable(item, options)) return "unavailable";
	if (itemIsSoldOut(item, options)) return "soldOut";
	return null;
};
//#endregion
//#region source-snapshot/src/utils/validateItemStock.js
var matchesStock = (item, stockItemId, stockCloudId, menuItemList) => isSameStockItem(item, {
	id: stockItemId,
	cloudId: stockCloudId
}, menuItemList);
function getItemStockNum(itemInfo, menuItemList) {
	if (!itemInfo) return;
	const stockItem = getIndexedStockItem(itemInfo, menuItemList);
	return stockItem ? stockItem.stockNum : itemInfo.stockNum;
}
var isInvalidStockNum = (stockNum) => stockNum !== void 0 && !Number.isFinite(Number(stockNum));
var getStockNumDisplayValue = (stockNum) => isInvalidStockNum(stockNum) ? "-" : stockNum;
function hasInvalidStockData(itemInfo, menuItemList) {
	if (Array.isArray(itemInfo)) return itemInfo.some((item) => hasInvalidStockData(item, menuItemList));
	if (!itemInfo) return false;
	if (isInvalidStockNum(getItemStockNum(itemInfo, menuItemList))) return true;
	return (itemInfo.selectedOptionList?.length ? itemInfo.selectedOptionList : itemInfo.sectionDetail || []).some((section) => {
		if (section.id === -2 || section.id === -3) return (section.options || []).some((item) => hasInvalidStockData(item, menuItemList));
		return section.id > 0 && (section.items || []).some((item) => hasInvalidStockData(item, menuItemList));
	});
}
function getCartItemQtyByStockId(itemList, stockItemId, stockCloudId, excludeSequence, menuItemList) {
	if (!Array.isArray(itemList) || stockItemId == null && stockCloudId == null) return 0;
	return itemList.reduce((sum, item) => {
		if (excludeSequence != null && item.sequence === excludeSequence) return sum;
		const parentQty = item.quantity || 1;
		let optionQty = 0;
		for (const section of item.sectionDetail || []) {
			if (section.id !== -2) continue;
			for (const option of section.options || []) if (matchesStock(option, stockItemId, stockCloudId, menuItemList)) optionQty += (option.quantity || 1) * parentQty;
		}
		if (matchesStock(item, stockItemId, stockCloudId, menuItemList)) return sum + (item.quantity || 0) + optionQty;
		return sum + optionQty;
	}, 0);
}
/** 购物车中套餐子菜数量（按底层菜品 id 汇总，含套餐份数） */
function getComboSubItemQtyInCart(itemList, stockItemId, stockCloudId, menuItemList) {
	if (!Array.isArray(itemList) || stockItemId == null && stockCloudId == null) return 0;
	let qty = 0;
	for (const orderItem of itemList) {
		if (orderItem.itemType === "SALE_ITEM") continue;
		const parentQty = orderItem.quantity || 1;
		const sectionDetail = orderItem.sectionDetail;
		if (!sectionDetail?.length) continue;
		let subCountInOneCombo = 0;
		for (const section of sectionDetail) {
			if (section.id <= 0) continue;
			for (const subItem of section.items || []) {
				const subItemQty = subItem.quantity || 1;
				if (matchesStock(subItem, stockItemId, stockCloudId, menuItemList)) subCountInOneCombo += subItemQty;
				const optionSectionList = subItem.selectedOptionList?.length ? subItem.selectedOptionList : subItem.sectionDetail;
				for (const optionSection of optionSectionList || []) {
					if (optionSection.id !== -2) continue;
					for (const option of optionSection.options || []) if (matchesStock(option, stockItemId, stockCloudId, menuItemList)) subCountInOneCombo += (option.quantity || 1) * subItemQty;
				}
			}
		}
		qty += subCountInOneCombo * parentQty;
	}
	return qty;
}
/** 当前正在组装的套餐内子菜数量 */
function getComboBuildingQtyByStockId(currentOrderCombo, stockItemId, stockCloudId, excludeSectionId, menuItemList) {
	if (!Array.isArray(currentOrderCombo) || stockItemId == null && stockCloudId == null) return 0;
	let qty = 0;
	for (const section of currentOrderCombo) {
		if (section.id <= 0) continue;
		if (excludeSectionId != null && section.id === excludeSectionId) continue;
		for (const subItem of section.items || []) {
			const subItemQty = subItem.quantity || 1;
			if (matchesStock(subItem, stockItemId, stockCloudId, menuItemList)) qty += subItemQty;
			const optionSectionList = subItem.selectedOptionList?.length ? subItem.selectedOptionList : subItem.sectionDetail;
			for (const optionSection of optionSectionList || []) {
				if (optionSection.id !== -2) continue;
				for (const option of optionSection.options || []) if (matchesStock(option, stockItemId, stockCloudId, menuItemList)) qty += (option.quantity || 1) * subItemQty;
			}
		}
	}
	return qty;
}
function groupComboSubItemsByStockId(itemsToAdd, menuItemList) {
	const groups = {};
	const append = (item, count) => {
		const key = getStockItemKey(item, menuItemList);
		if (key == null) return;
		if (!groups[key]) groups[key] = {
			itemInfo: item,
			count: 0
		};
		groups[key].count += count;
	};
	for (const item of itemsToAdd || []) {
		if (!item) continue;
		const itemQty = item.quantity || 1;
		append(item, itemQty);
		const sections = item.selectedOptionList?.length ? item.selectedOptionList : item.sectionDetail;
		for (const section of sections || []) {
			if (section.id !== -2) continue;
			for (const option of section.options || []) append(option, (option.quantity || 1) * itemQty);
		}
	}
	return Object.values(groups);
}
/** 兑换中心 / RewardBanner 待落袋的赠菜（selectedFreeItem、tempCampaign） */
function getRewardPendingItems(crm, menuItemList, itemList = []) {
	const items = [];
	const seen = /* @__PURE__ */ new Set();
	const appendItem = (item) => {
		if (!item) return;
		const stockItemId = getStockItemId(item);
		const stockCloudId = item.cloudId;
		if (stockItemId == null && stockCloudId == null) return;
		if (isRewardItemInCart(item, itemList, menuItemList)) return;
		const key = `${getStockItemKey(item, menuItemList)}:${item.rewardRule?._id ?? item.ruleId ?? item.id ?? ""}:${item._id ?? ""}`;
		if (seen.has(key)) return;
		seen.add(key);
		items.push(item);
	};
	(crm?.selectedFreeItem || []).forEach(appendItem);
	const tempCampaign = crm?.tempCampaign;
	if (Array.isArray(tempCampaign)) tempCampaign.forEach(appendItem);
	else appendItem(tempCampaign);
	return items;
}
/** 赠菜/活动菜是否已写入购物车，避免与 selectedFreeItem 重复计数 */
function isRewardItemInCart(item, itemList, menuItemList) {
	if (!Array.isArray(itemList)) return false;
	const stockItemId = getStockItemId(item);
	const stockCloudId = item.cloudId;
	return itemList.some((cartItem) => matchesStock(cartItem, stockItemId, stockCloudId, menuItemList) && (item.oId == null || cartItem.oId == null || String(item.id) === String(cartItem.id)) && (!(item.rewardRule?._id && cartItem.rewardRule?._id) || item.rewardRule._id === cartItem.rewardRule._id) && (cartItem.isFreeItem || cartItem.campaignRewardItem || cartItem.isCRMIntegrationSpecialItem || cartItem.isCRMIntegrationBundleDiscountItem));
}
/** ItemsDrawer 凑单抽屉内待确认加购占用数量（跳过已在购物车中的项） */
function getDrawerPendingQtyByStockId(drawerPendingItems, stockItemId, stockCloudId, menuItemList) {
	if (!Array.isArray(drawerPendingItems) || stockItemId == null && stockCloudId == null) return 0;
	let qty = 0;
	for (const item of drawerPendingItems) {
		if (item?.isFromCurrentOrderItemList) continue;
		if (item.itemType === "SALE_ITEM" || !item.sectionDetail?.length) {
			if (matchesStock(item, stockItemId, stockCloudId, menuItemList)) qty += item.quantity || 1;
			const parentQty = item.quantity || 1;
			for (const section of item.sectionDetail || []) {
				if (section.id !== -2) continue;
				for (const option of section.options || []) if (matchesStock(option, stockItemId, stockCloudId, menuItemList)) qty += (option.quantity || 1) * parentQty;
			}
			continue;
		}
		const parentQty = item.quantity || 1;
		for (const section of item.sectionDetail) {
			if (section.id <= 0) continue;
			for (const subItem of section.items || []) {
				const subItemQty = subItem.quantity || 1;
				if (matchesStock(subItem, stockItemId, stockCloudId, menuItemList)) qty += subItemQty * parentQty;
				const optionSectionList = subItem.selectedOptionList?.length ? subItem.selectedOptionList : subItem.sectionDetail;
				for (const optionSection of optionSectionList || []) {
					if (optionSection.id !== -2) continue;
					for (const option of optionSection.options || []) if (matchesStock(option, stockItemId, stockCloudId, menuItemList)) qty += (option.quantity || 1) * subItemQty * parentQty;
				}
			}
		}
	}
	return qty;
}
/** 兑换中心待确认的赠菜占用数量 */
function getRewardPendingQtyByStockId(crm, stockItemId, stockCloudId, itemList, menuItemList) {
	if (stockItemId == null && stockCloudId == null) return 0;
	return getRewardPendingItems(crm, menuItemList, itemList).reduce((sum, item) => {
		if (!matchesStock(item, stockItemId, stockCloudId, menuItemList)) return sum;
		return sum + (item.quantity || 1);
	}, 0);
}
/** 已选买赠商品独立于购物车保存；重选规则、编辑原行或已有镜像时不重复占用。 */
function getPromotionGiftQtyByStockId({ promotion, itemList = [], stockItemId, stockCloudId, menuItemList, excludeSequence, excludePromotionRuleId }) {
	return getDrawerPendingQtyByStockId((promotion?.buyGifts || []).filter((rule) => rule.ruleId !== excludePromotionRuleId || excludePromotionRuleId == null).flatMap((rule) => (rule.items || []).filter((gift) => {
		if (excludeSequence != null && gift.sequence === excludeSequence && !itemList.some((item) => item.sequence === excludeSequence && !item.promotionItem)) return false;
		return !itemList.some((item) => item.promotionItem && gift.sequence != null && item.sequence === gift.sequence && item.ruleId === (gift.ruleId ?? rule.ruleId) && isSameStockItem(item, gift, menuItemList));
	})), stockItemId, stockCloudId, menuItemList);
}
function getOccupiedQtyByStockId({ itemList = [], currentOrderCombo = [], crm, promotion, stockItemId, stockCloudId, menuItemList, excludeSequence, excludePromotionRuleId, excludeSectionId, excludeRewardPending = false, drawerPendingItems }) {
	const cartQty = getCartItemQtyByStockId(itemList, stockItemId, stockCloudId, excludeSequence, menuItemList);
	const comboCartQty = getComboSubItemQtyInCart(itemList, stockItemId, stockCloudId, menuItemList);
	const buildingQty = getComboBuildingQtyByStockId(currentOrderCombo, stockItemId, stockCloudId, excludeSectionId, menuItemList);
	const rewardPendingQty = excludeRewardPending ? 0 : getRewardPendingQtyByStockId(crm, stockItemId, stockCloudId, itemList, menuItemList);
	const drawerPendingQty = drawerPendingItems ? getDrawerPendingQtyByStockId(drawerPendingItems, stockItemId, stockCloudId, menuItemList) : 0;
	const promotionQty = getPromotionGiftQtyByStockId({
		promotion,
		itemList,
		stockItemId,
		stockCloudId,
		menuItemList,
		excludeSequence,
		excludePromotionRuleId
	});
	return cartQty + comboCartQty + buildingQty + rewardPendingQty + drawerPendingQty + promotionQty;
}
/**
* 获取某菜品当前可展示的剩余库存（总库存 - 已占用数量）
* 说明：这里的已占用数量与库存校验口径保持一致，包含购物车、套餐子菜、待确认赠菜等占用
*/
function getRemainingStockNum({ itemInfo, itemList = [], menuItemList, currentOrderCombo = [], crm, promotion, excludeSequence, excludePromotionRuleId, excludeSectionId, excludeRewardPending = false, drawerPendingItems }) {
	const stockNum = getItemStockNum(itemInfo, menuItemList);
	if (stockNum === void 0) return;
	if (isInvalidStockNum(stockNum)) return NaN;
	const stockItemId = getStockItemId(itemInfo);
	const stockCloudId = itemInfo?.cloudId;
	const occupiedQty = getOccupiedQtyByStockId({
		itemList,
		currentOrderCombo,
		crm,
		promotion,
		stockItemId,
		stockCloudId,
		menuItemList,
		excludeSequence,
		excludePromotionRuleId,
		excludeSectionId,
		excludeRewardPending,
		drawerPendingItems
	});
	return Math.max(stockNum - occupiedQty, 0);
}
/**
* 套餐子菜加购前校验（购物车 + 当前套餐内已选 + 即将加购）
*/
function canAddComboSubItems({ itemsToAdd, itemList = [], currentOrderCombo = [], menuItemList, crm, promotion, excludeSectionId, drawerPendingItems }) {
	const groups = groupComboSubItemsByStockId(itemsToAdd, menuItemList);
	for (const { itemInfo, count } of groups) {
		const stockNum = getItemStockNum(itemInfo, menuItemList);
		if (stockNum === void 0) continue;
		const stockItemId = getStockItemId(itemInfo);
		const stockCloudId = itemInfo.cloudId;
		const totalQty = getOccupiedQtyByStockId({
			itemList,
			currentOrderCombo,
			crm,
			promotion,
			excludeSectionId,
			stockItemId,
			stockCloudId,
			menuItemList,
			drawerPendingItems
		}) + count;
		if (isInvalidStockNum(stockNum) || !(totalQty <= stockNum)) return false;
	}
	return true;
}
/** 套餐提交进购物车时校验子菜库存（含套餐份数） */
function validateComboSubmitStock(comboInfo, state, { drawerPendingItems, excludePromotionRuleId, excludeSequence } = {}) {
	const { itemList } = state.currentOrder || {};
	const { menuItemList } = state;
	const parentQty = comboInfo?.quantity || 1;
	const itemsToAdd = (comboInfo?.sectionDetail || []).filter((section) => section.id > 0).flatMap((section) => (section.items || []).map((item) => ({
		...item,
		quantity: (item.quantity || 1) * parentQty
	})));
	for (const { itemInfo, count } of groupComboSubItemsByStockId(itemsToAdd, menuItemList)) {
		const stockNum = getItemStockNum(itemInfo, menuItemList);
		if (stockNum === void 0) continue;
		const stockItemId = getStockItemId(itemInfo);
		const stockCloudId = itemInfo.cloudId;
		const occupiedQty = getOccupiedQtyByStockId({
			itemList,
			currentOrderCombo: [],
			crm: state.crm,
			promotion: state.promotion,
			excludePromotionRuleId,
			excludeSequence,
			stockItemId,
			stockCloudId,
			menuItemList,
			drawerPendingItems
		});
		if (isInvalidStockNum(stockNum) || !(occupiedQty + count <= stockNum)) return false;
	}
	return true;
}
function isStockSufficient({ itemInfo, addQty = 1, itemList = [], menuItemList, excludeSequence, currentOrderCombo, crm, promotion, excludePromotionRuleId, excludeRewardPending = false, drawerPendingItems }) {
	const stockNum = getItemStockNum(itemInfo, menuItemList);
	if (stockNum !== void 0) {
		const stockItemId = getStockItemId(itemInfo);
		const stockCloudId = itemInfo.cloudId;
		const occupiedQty = getOccupiedQtyByStockId({
			itemList,
			currentOrderCombo,
			crm,
			promotion,
			excludePromotionRuleId,
			stockItemId,
			stockCloudId,
			menuItemList,
			excludeSequence,
			excludeRewardPending,
			drawerPendingItems
		});
		if (isInvalidStockNum(stockNum) || !(occupiedQty + addQty <= stockNum)) return false;
	}
	const optionAddMap = {};
	for (const section of itemInfo?.sectionDetail || []) {
		if (section.id !== -2) continue;
		for (const option of section.options || []) {
			const optionStockItemId = getStockItemId(option);
			const optionStockCloudId = option.cloudId;
			if (optionStockItemId == null && optionStockCloudId == null) continue;
			const optionKey = getStockItemKey(option, menuItemList);
			if (!optionAddMap[optionKey]) optionAddMap[optionKey] = {
				itemInfo: option,
				count: 0
			};
			optionAddMap[optionKey].count += (option.quantity || 1) * addQty;
		}
	}
	for (const { itemInfo: optionItem, count } of Object.values(optionAddMap)) {
		const optionStockNum = getItemStockNum(optionItem, menuItemList);
		if (optionStockNum === void 0) continue;
		const optionStockItemId = getStockItemId(optionItem);
		const optionStockCloudId = optionItem.cloudId;
		const optionOccupiedQty = getOccupiedQtyByStockId({
			itemList,
			currentOrderCombo,
			crm,
			promotion,
			excludePromotionRuleId,
			stockItemId: optionStockItemId,
			stockCloudId: optionStockCloudId,
			menuItemList,
			excludeSequence,
			excludeRewardPending,
			drawerPendingItems
		});
		if (isInvalidStockNum(optionStockNum) || !(optionOccupiedQty + count <= optionStockNum)) return false;
	}
	return true;
}
/** 校验某菜品在购物车中的总数量是否不超过库存 */
function isTotalQtyWithinStock({ itemInfo, totalQty, menuItemList, itemList = [], currentOrderCombo = [], crm, promotion, excludeSequence, excludePromotionRuleId, drawerPendingItems }) {
	const stockNum = getItemStockNum(itemInfo, menuItemList);
	if (stockNum === void 0) return true;
	if (isInvalidStockNum(stockNum)) return false;
	const stockItemId = getStockItemId(itemInfo);
	const stockCloudId = itemInfo.cloudId;
	const rewardPendingQty = getRewardPendingQtyByStockId(crm, stockItemId, stockCloudId, itemList, menuItemList);
	const comboCartQty = getComboSubItemQtyInCart(itemList, stockItemId, stockCloudId, menuItemList);
	const buildingQty = getComboBuildingQtyByStockId(currentOrderCombo, stockItemId, stockCloudId, void 0, menuItemList);
	const drawerPendingQty = drawerPendingItems ? getDrawerPendingQtyByStockId(drawerPendingItems, stockItemId, stockCloudId, menuItemList) : 0;
	const promotionQty = getPromotionGiftQtyByStockId({
		promotion,
		itemList,
		stockItemId,
		stockCloudId,
		menuItemList,
		excludeSequence,
		excludePromotionRuleId
	});
	return comboCartQty + buildingQty + rewardPendingQty + drawerPendingQty + promotionQty + totalQty <= stockNum;
}
function showInsufficientStockToast(position, itemInfo, menuItemList) {
	const messageKey = hasInvalidStockData(itemInfo, menuItemList) ? "stock-data-error" : "insufficient-stock";
	toast_default.info(native_i18n_default.t(messageKey), position);
}
//#endregion
//#region source-snapshot/src/utils/getMenuDisplayName.js
var getSingleItemLanguageName = (nameDict, lang = "en") => {
	if (nameDict && nameDict.length) {
		for (let nameGroup of nameDict) if (nameGroup.fieldName == "name") {
			for (let displayName of nameGroup.fieldDisplayNames) if (displayName.languageCode == langCodeMap[lang]) return displayName.name;
		}
	}
	return "";
};
/**
* 根据菜单名称双语展示配置，拼接菜单接口中的多语言名称
*/
var getMenuDisplayName = (nameDict, currentLang, menuNameConfig) => {
	if (!menuNameConfig?.status) return getSingleItemLanguageName(nameDict, currentLang);
	const displayLangs = menuNameConfig.displayLangs || [];
	if (!displayLangs.length) return getSingleItemLanguageName(nameDict, currentLang);
	if (displayLangs.length === 1) return getSingleItemLanguageName(nameDict, displayLangs[0]);
	const primary = menuNameConfig.primaryLang && displayLangs.includes(menuNameConfig.primaryLang) ? menuNameConfig.primaryLang : displayLangs[0];
	const secondary = displayLangs.find((lang) => lang !== primary);
	const primaryName = getSingleItemLanguageName(nameDict, primary);
	const secondaryName = secondary ? getSingleItemLanguageName(nameDict, secondary) : "";
	if (primaryName && secondaryName) return `${primaryName} / ${secondaryName}`;
	return primaryName || secondaryName || getSingleItemLanguageName(nameDict, currentLang);
};
//#endregion
//#region source-snapshot/src/utils/busTools.js
var getMissingRequiredCategories = (requireCategory, itemList) => {
	const selectedCategoryIds = new Set((itemList || []).filter((item) => item.quantity > 0).map((item) => String(item.categoryId)));
	return (requireCategory || []).filter((category) => !selectedCategoryIds.has(String(category.id)));
};
var judgeHasDetailInfo = (itemInfo, isCombo = false) => {
	let isHas = true;
	const state = native_store_default?.getState();
	const currentCategory = state.currentCategoryList?.find((cate) => cate.saleItems?.find((item) => item.id === itemInfo.id));
	const isShowRemark = state.selfConfig?.configMap?.id_3;
	if (isCombo) {
		const isSubDishRemark = state.selfConfig?.configMap?.id_30;
		if (itemInfo.itemPrices?.length > 1 || itemInfo.options || itemInfo.description || isShowRemark && isSubDishRemark || itemInfo.categoryOptions?.length) isHas = true;
		else isHas = false;
		return isHas;
	} else {
		if (itemInfo.itemPrices?.length > 1 || itemInfo.options || itemInfo.description || isShowRemark || currentCategory?.options?.length || itemInfo.comboType === "FIXED_SELECTION" && itemInfo.comboSections?.length) isHas = true;
		else isHas = false;
		return isHas;
	}
};
var getCurrentItemLanguage = (nameDict, lang = "en") => {
	return getSingleItemLanguageName(nameDict, lang);
};
var getDishItemLanguage = (nameDict, lang = "en") => {
	const menuNameConfig = native_store_default?.getState()?.selfConfig?.configMap?.id_66;
	if (menuNameConfig?.status) return getMenuDisplayName(nameDict, lang, menuNameConfig);
	return getSingleItemLanguageName(nameDict, lang);
};
var getItemOptionName = (nameDict, language = "en") => {
	if (!nameDict || !Array.isArray(nameDict)) return "";
	for (let nameGroup of nameDict) if (nameGroup.fieldName == "name" && nameGroup.fieldDisplayNames) {
		for (let displayName of nameGroup.fieldDisplayNames) if (displayName.languageCode == langCodeMap[language]) return displayName.name;
	}
	return "";
};
var getItemSizeName = (sizeId, defaultName, itemSizeList = [], language = "en") => {
	if (!itemSizeList || !Array.isArray(itemSizeList)) return defaultName || "";
	for (let itemSize of itemSizeList) if (itemSize.id == sizeId) return getItemOptionName(itemSize.fieldDisplayNameGroups, language) || itemSize?.name || defaultName || "";
	return defaultName || "";
};
var lineBreakTransfer = (str) => {
	if (typeof str !== "string") return str;
	return str.replace(/\\n/g, "\n");
};
var getOneUncompletedSection = (sideNavList, currentOrderCombo) => {
	const isSectionCompleted = {};
	if (sideNavList?.length && currentOrderCombo?.length) sideNavList.forEach((sct) => {
		let min = sct.minNumOfSelectionAllowed;
		let max = sct.maxNumOfSelectionAllowed;
		let priceRule = sct.priceRule;
		if (sct.id > 0) {
			let n = 0;
			currentOrderCombo.find((c) => c.id == sct.id)?.items.forEach((r) => {
				n += r.quantity;
			});
			if (min == void 0) if (priceRule == "FIXED_UNTIL_MAX") isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: true
			};
			else if (n < max) isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: true
			};
			else isSectionCompleted[sct.id] = {
				isContinueChoose: false,
				isCompleted: true
			};
			else if (max == void 0) if (n < min) isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: false
			};
			else isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: true
			};
			else if (min == max) if (sct.itemSelectionRule == "RANGE" && sct.priceRule == "FIXED_UNTIL_MAX") if (n < min) isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: false
			};
			else isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: true
			};
			else if (n == min) isSectionCompleted[sct.id] = {
				isContinueChoose: false,
				isCompleted: true
			};
			else isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: false
			};
			else if (priceRule == "FIXED_UNTIL_MAX") if (n < min) isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: false
			};
			else if (n < max) isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: true
			};
			else isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: true
			};
			else if (n < min) isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: false
			};
			else if (n < max) isSectionCompleted[sct.id] = {
				isContinueChoose: true,
				isCompleted: true
			};
			else isSectionCompleted[sct.id] = {
				isContinueChoose: false,
				isCompleted: true
			};
		} else if (sct.id === -99 || sct.id === -98) isSectionCompleted[sct.id] = {
			isContinueChoose: true,
			isCompleted: true
		};
	});
	return isSectionCompleted;
};
var judegStepIsHasMustDish = (sideNavList, currentOrderCombo) => {
	currentOrderCombo?.find((s) => s.id == -1);
	let obj = {};
	sideNavList?.forEach((sct, sctIdx) => {
		let isHas = false;
		if (sct.id > 0) {
			isHas = true;
			obj[sct.id] = isHas;
		}
	});
	return obj;
};
var countRangeHandler = (side, t, { isInFreeItem, isPromotionItem } = {}) => {
	if (side.id < 0) {
		if (side.id == -3 && side.numOfItemOptionAllowed) return { [side.id]: "(" + t("selectionRuleMax", { rplc: side.numOfItemOptionAllowed }) + ")" };
	} else {
		const min = side.minNumOfSelectionAllowed;
		const max = side.maxNumOfSelectionAllowed;
		const freeQuantity = side.freeQuantity;
		let range = "";
		if (min == void 0) if (side.priceRule == "FIXED_UNTIL_MAX") range = t("selectionRuleMaxfixUntilMax", { rplc: max });
		else range = t("selectionRuleMax", { rplc: max });
		else if (max == void 0) range = t("selectionRuleMin", { rplc: min });
		else if (min == max) if (side.itemSelectionRule == "RANGE" && side.priceRule == "FIXED_UNTIL_MAX") range = t("selectionRuleRangeEqual", { rplc: max });
		else range = t("selectionRuleEqual", { rplc: max });
		else if (side.priceRule == "FIXED_UNTIL_MAX") range = t("selectionRuleRangefixUntilMax", {
			rplc1: min,
			rplc2: max
		});
		else if (min !== 0 || max !== 9999) {
			range = t("selectionRuleRange", {
				rplc1: min,
				rplc2: max
			});
			if (freeQuantity > 0 && !isInFreeItem && !isPromotionItem) range = `${range}, ${t("selectionRuleRangeFree", { rplc: freeQuantity })}`;
		}
		return { [side.id]: range ? "(" + range + ")" : "" };
	}
};
var allRangHandler = (sideNavList, t, { isInFreeItem, isPromotionItem } = {}) => {
	let rangMap = {};
	sideNavList?.forEach((side) => {
		Object.assign(rangMap, countRangeHandler(side, t, {
			isInFreeItem,
			isPromotionItem
		}));
	});
	return rangMap;
};
/** 合并类目 options 到菜品（与 getCurrentItem 逻辑一致，用于凑单/活动等入口） */
var attachCategoryOptionsToItem = (item, categoryList) => {
	if (!item?.categoryId || !categoryList?.length) return item;
	const category = categoryList.find((c) => c.id === item.categoryId);
	if (!category) return item;
	let categoryOptions;
	if (category.isFreeItemCategory) categoryOptions = categoryList.find((_) => _.id === item.oCategoryId)?.options;
	else categoryOptions = category.options;
	if (!categoryOptions?.length) return item;
	return {
		...item,
		categoryOptions
	};
};
var getComboItemDetailInfo = (itemId, currentCategoryList) => {
	for (let category of currentCategoryList) {
		let ctgOpts = category.options || [];
		let saleItems = category.saleItems;
		if (saleItems && saleItems.length) {
			for (let i = 0; i < saleItems.length; i++) if (saleItems[i].id == itemId) {
				let tempItem = Object.assign({}, saleItems[i]);
				tempItem.categoryOptions = ctgOpts;
				return tempItem;
			}
		}
	}
};
/** 从 sideNavList 安全获取套餐 section 配置 */
var getComboSectionInfo = (sideNavList, sideNavId) => {
	if (!sideNavList?.length || sideNavId == null) return;
	return sideNavList.find((item) => item?.id == sideNavId);
};
var judegIsComboStatusAndIsPreSelected = (itemInfo, sideNavList, sideNavId, currentOrderCombo) => {
	let isPreSelected = false;
	if (sideNavId === -98 || sideNavId === -99) return false;
	if (currentOrderCombo.length) {
		const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
		if (sectionInfo && itemInfo.id && sectionInfo.priceRule !== "ITEM_CENTER") {
			let r = sectionInfo.comboSectionSaleItems?.find((c) => c.saleItemId == itemInfo.id);
			if (r?.preSelected) isPreSelected = r.preSelected;
		}
	}
	return !!isPreSelected;
};
var judegOrderDishIsHasSoldout = (orderList, soldoutList) => {
	const { crm = {}, promotion: { buyGifts = [] } = {}, menuItemList = {} } = native_store_default.getState();
	const rewardPendingItems = getRewardPendingItems(crm, menuItemList, orderList);
	const promotionGiftItemList = buyGifts.flatMap((promotionGift) => promotionGift?.items || []);
	const mergedOrderList = [
		...orderList || [],
		...rewardPendingItems,
		...promotionGiftItemList
	].filter((item) => item && (item.id != null || item.oId != null));
	const uniqueOrderListMap = /* @__PURE__ */ new Map();
	const getOrderCheckKey = (item) => {
		if (item?.sequence != null) return `seq_${item.sequence}`;
		return `id_${item?.id ?? ""}_oid_${item?.oId ?? ""}_cloud_${item?.cloudId ?? ""}_free_${item?.isFreeItem ? 1 : 0}_promotion_${item?.promotionItem ? 1 : 0}_rule_${item?.ruleId ?? ""}`;
	};
	mergedOrderList.forEach((item) => {
		const key = getOrderCheckKey(item);
		if (!uniqueOrderListMap.has(key)) uniqueOrderListMap.set(key, item);
	});
	const uniqueOrderList = Array.from(uniqueOrderListMap.values());
	let allSoldIds = [];
	const soldoutOrderKeySet = /* @__PURE__ */ new Set();
	const soldoutDetailList = [];
	uniqueOrderList.forEach((item) => {
		const soldoutDetail = getOrderSoldOutDetails(item, {
			kioskSoldOutList: soldoutList,
			fromOrder: true
		});
		if (soldoutDetail.length > 0 || itemIsSoldOut(item, {
			kioskSoldOutList: soldoutList,
			fromOrder: true
		})) {
			soldoutOrderKeySet.add(getOrderCheckKey(item));
			soldoutDetailList.push(...soldoutDetail);
		}
	});
	const stockUsageMap = /* @__PURE__ */ new Map();
	const addStockUsage = ({ rootOrderKey, stockItem, qty, soldoutType, parentItem }) => {
		if (!stockItem || qty <= 0) return;
		const stockNum = Number(getItemStockNum(stockItem, menuItemList));
		if (!Number.isFinite(stockNum)) return;
		const stockKey = getStockItemKey(stockItem, menuItemList);
		if (!stockKey) return;
		const detailId = (stockItem?.isFreeItem ? stockItem?.oId : stockItem?.id) ?? stockItem?.id;
		const parentId = (parentItem?.isFreeItem ? parentItem?.oId : parentItem?.id) ?? parentItem?.id;
		const existed = stockUsageMap.get(stockKey) || {
			stockNum,
			totalQty: 0,
			orderQtyMap: /* @__PURE__ */ new Map(),
			detailList: []
		};
		existed.totalQty += qty;
		existed.stockNum = Number.isFinite(existed.stockNum) ? Math.min(existed.stockNum, stockNum) : stockNum;
		existed.orderQtyMap.set(rootOrderKey, (existed.orderQtyMap.get(rootOrderKey) || 0) + qty);
		existed.detailList.push({
			id: detailId,
			cloudId: stockItem?.cloudId,
			name: stockItem?.name,
			fieldDisplayNameGroups: stockItem?.fieldDisplayNameGroups,
			soldoutType,
			parentId,
			parentName: parentItem?.name,
			parentFieldDisplayNameGroups: parentItem?.fieldDisplayNameGroups,
			soldoutDisplayKey: soldoutType === "item" ? `item_${stockItem?.cloudId ?? detailId}` : `${soldoutType}_${parentId ?? ""}_${stockItem?.cloudId ?? detailId}`,
			orderKey: rootOrderKey
		});
		stockUsageMap.set(stockKey, existed);
	};
	const collectStockUsage = (rootOrderItem, currentOrderItem, parentItem, parentQty = 1) => {
		if (!currentOrderItem) return;
		const currentItemQty = (currentOrderItem?.quantity || 1) * parentQty;
		const rootOrderKey = getOrderCheckKey(rootOrderItem);
		const stockItemId = currentOrderItem?.isFreeItem ? currentOrderItem?.oId : currentOrderItem?.id;
		const currentStockItem = stockItemId != null ? {
			...currentOrderItem,
			id: stockItemId
		} : currentOrderItem;
		addStockUsage({
			rootOrderKey,
			stockItem: currentStockItem,
			qty: currentItemQty,
			soldoutType: parentItem ? "subItem" : "item",
			parentItem
		});
		const optionSectionList = currentOrderItem?.selectedOptionList?.length ? currentOrderItem.selectedOptionList : currentOrderItem?.sectionDetail;
		for (const section of optionSectionList || []) {
			if (section?.id !== -2) continue;
			for (const option of section?.options || []) addStockUsage({
				rootOrderKey,
				stockItem: option,
				qty: (option?.quantity || 1) * currentItemQty,
				soldoutType: "option",
				parentItem: currentOrderItem
			});
		}
		for (const section of currentOrderItem?.sectionDetail || []) {
			if (section?.id <= 0) continue;
			for (const subItem of section?.items || []) collectStockUsage(rootOrderItem, subItem, currentOrderItem, currentItemQty);
		}
	};
	uniqueOrderList.forEach((item) => {
		collectStockUsage(item, item);
	});
	const shortageList = [];
	stockUsageMap.forEach((usage, stockKey) => {
		if (usage.totalQty > usage.stockNum) shortageList.push({
			stockKey,
			overflow: usage.totalQty - usage.stockNum,
			...usage
		});
	});
	if (shortageList.length) {
		const insufficientOrderKeySet = /* @__PURE__ */ new Set();
		shortageList.forEach((entry) => {
			entry.orderQtyMap.forEach((orderQty, orderKey) => {
				if (orderQty > 0) insufficientOrderKeySet.add(orderKey);
			});
		});
		insufficientOrderKeySet.forEach((key) => soldoutOrderKeySet.add(key));
		shortageList.forEach((entry) => {
			const finalDetail = entry.detailList.find((detailItem) => insufficientOrderKeySet.has(detailItem?.orderKey)) || entry.detailList[0];
			if (finalDetail) {
				const { orderKey, ...rest } = finalDetail;
				soldoutDetailList.push(rest);
			}
		});
	}
	const saleList = [];
	const slodoutList = [];
	uniqueOrderList.forEach((item) => {
		if (soldoutOrderKeySet.has(getOrderCheckKey(item))) slodoutList.push(item);
		else saleList.push(item);
	});
	const soldoutKeyMap = /* @__PURE__ */ new Map();
	slodoutList.forEach((item) => {
		const hasSequence = item?.sequence != null;
		const key = hasSequence ? `seq_${item.sequence}` : `id_${item?.id}`;
		if (!soldoutKeyMap.has(key)) soldoutKeyMap.set(key, {
			id: item?.id,
			sequence: hasSequence ? item.sequence : void 0
		});
	});
	allSoldIds = Array.from(soldoutKeyMap.values());
	return {
		saleList,
		slodoutList,
		allSoldIds,
		soldoutDetailList
	};
};
var calcColNum = (availableWidth) => getCardColumnCount(availableWidth);
var judgeCharge = () => {
	const chargeList = (native_store_default?.getState()).selfConfig?.charge;
	if (chargeList?.length) if (chargeList.find((c) => c.id === 1).select.id) return true;
	else return false;
	else return false;
};
var judgeNeedPayOtherCharge = () => {
	const state = native_store_default?.getState();
	const chargeList = state.selfConfig?.charge;
	if (chargeList?.length) {
		if (chargeList.find((c) => c.id == 2)?.select?.id) {
			const res2 = state.togoList?.find((item) => item.id == 2);
			if (res2?.select?.id && res2.select.rate > 0) return true;
		}
		if (chargeList.find((c) => c.id == 3)?.select?.id) {
			const res3 = state.togoList?.find((item) => item.id == 3);
			if (res3?.select?.id && res3.select.rate > 0) return true;
		}
		if (chargeList.find((c) => c.id == 4)?.select?.id) {
			const res4 = state.togoList?.find((item) => item.id == 4);
			if (res4?.select?.id && res4.select.rate > 0) return true;
		}
	}
	return false;
};
var calcCardMinAmout = (tip = 0) => {
	const state = native_store_default?.getState();
	const { selfConfig } = state;
	const minCardAmount = selfConfig?.configMap?.id_21;
	const orderInfo = getOrderInfoObj(state);
	const subTotal = orderInfo.orderSubtotal;
	const totalTax = orderInfo.orderTaxTotal;
	const charge = orderInfo.chargeTotal;
	const togoTotal = orderInfo.togoTotal;
	const orderDiscount = orderInfo.orderDiscount;
	const currentAmount = parseFloat(Big(subTotal).plus(totalTax).plus(charge).plus(togoTotal).plus(tip).minus(orderDiscount).toFixed(2));
	if (minCardAmount && minCardAmount > currentAmount) return currentAmount;
	else return false;
};
/**
* 统一的查询配置项、判断订单内是否含售罄菜的方法
* @param {Function} fn - 成功回调函数
* @param {Object} options - 配置选项
* @param {Function} options.setSelfConfig - Redux action，用于设置selfConfig
* @param {Function} options.setState - 组件setState方法
* @param {Function} options.showApiModalTip - 显示API错误提示的方法
* @param {Function} [options.reorder] - 重新点单的方法（可选）
* @param {Function} [options.onSoldoutDetected] - 当检测到售罄菜时的额外回调（可选）
* @param {Function} [options.onError] - 错误处理回调（可选）
*/
var judgeConfigToSoldout = (fn, options = {}) => {
	const { setSelfConfig, setState, showApiModalTip, reorder, onSoldoutDetected, onError } = options;
	const checkLatestStock = async () => {
		const stockCheckResult = await refreshOrderStockBeforeSubmit({
			refreshStock: () => syncMenuStockNum$1(native_store_default.dispatch, native_store_default.getState, { source: "before-submit" }),
			getOrderItems: () => (0, import_cloneDeep.default)(getJudgeOrderDishItem()),
			judgeOrder: judegOrderDishIsHasSoldout,
			onRefreshError: (error) => {
				console.log("refresh stock before submit failed, continue saveOrder", error);
				fn();
			}
		});
		if (stockCheckResult.status === "refresh_failed") return;
		const { dishMap } = stockCheckResult;
		setState({ dishMap });
		if (dishMap.slodoutList?.length) {
			if (onSoldoutDetected) onSoldoutDetected();
			setState({ isHasSoldoutDish: true });
		} else if (dishMap.saleList?.length) fn();
		else if (reorder) reorder(true);
		else fn();
	};
	judgeSskeyIsActiveTime().then(() => {
		getMarginappFetchConfig().then((res) => {
			if (res.data.result.successful) if (res.data.marginAppConfigTypes.length) {
				let selfConfig = (0, import_cloneDeep.default)(native_store_default.getState().selfConfig);
				let obj = res.data.marginAppConfigTypes.find((p) => p.product == "KIOSKLITE");
				selfConfig.soldOut = JSON.parse(obj.data).soldOut;
				setSelfConfig(selfConfig);
				checkLatestStock();
			} else checkLatestStock();
			else if (onError) onError(res.data?.result?.failureReason);
			else showApiModalTip(res.data?.result?.failureReason);
		}).catch((err) => {
			showApiModalTip(err?.message);
		});
	}).catch((err) => {
		showApiModalTip(err?.message);
	});
};
//#endregion
//#region source-snapshot/src/utils/sortComboItemSections.js
/**
* 自选套餐 comboSections / comboSectionSaleItems 排序，与 getCurrentItem 主菜单逻辑一致
*/
function sortComboItemSections(item) {
	if (!item || item.itemType !== "COMBO_SALE_ITEM" || !item.comboSections?.length) return item;
	const tempItem = Object.assign({}, item);
	tempItem.comboSections = [...item.comboSections].sort((section1, section2) => section1.sectionSequence - section2.sectionSequence).map((section) => {
		if (!section.comboSectionSaleItems) return section;
		return {
			...section,
			comboSectionSaleItems: [...section.comboSectionSaleItems].sort((item1, item2) => item1.displayPriority - item2.displayPriority)
		};
	});
	return tempItem;
}
//#endregion
//#region source-snapshot/src/actions/crm_action.js
var crm_action_exports = /* @__PURE__ */ __exportAll({
	changeBarVisible: () => changeBarVisible,
	changeFreeItem: () => changeFreeItem,
	changeIgnoreReward: () => changeIgnoreReward,
	changeLoginType: () => changeLoginType,
	changeSelectedDiscount: () => changeSelectedDiscount,
	setCRMAuthCodeVerified: () => setCRMAuthCodeVerified,
	setCRMAuthCodeVerifiedPhone: () => setCRMAuthCodeVerifiedPhone,
	setCRMMemberInfo: () => setCRMMemberInfo,
	setEarnRule: () => setEarnRule,
	setFreeItemMenuPosition: () => setFreeItemMenuPosition,
	setIsMemberOrderedBefore: () => setIsMemberOrderedBefore,
	setMemberStatus: () => setMemberStatus,
	setOnboardGiftRule: () => setOnboardGiftRule,
	setPrivileges: () => setPrivileges,
	setRewardRule: () => setRewardRule,
	setTempCampaign: () => setTempCampaign,
	setTempFreeItem: () => setTempFreeItem
});
/**
* CRM 相关
* */
var changeBarVisible = (data) => ({
	type: IS_SHOW_LOGIN_BAR,
	data
});
var setCRMMemberInfo = (data) => ({
	type: CRM_MEMBER_INFO,
	data
});
var setPrivileges = (data) => ({
	type: CRM_PRIVILEGES,
	data: Array.isArray(data) ? data : []
});
var setEarnRule = (data) => ({
	type: CRM_EARN_RULE,
	data
});
var setMemberStatus = (data) => ({
	type: IS_NEW_MEMBER,
	data
});
var changeLoginType = (data) => ({
	type: LOGIN_TYPE,
	data
});
var setCRMAuthCodeVerified = (data) => ({
	type: SET_CRM_AUTH_CODE_VERIFIED,
	data
});
var setCRMAuthCodeVerifiedPhone = (data) => ({
	type: SET_CRM_AUTH_CODE_VERIFIED_PHONE,
	data
});
var changeFreeItem = (data) => ({
	type: CHANGE_FREE_ITEM,
	data
});
var setTempFreeItem = (data) => ({
	type: SET_TEMP_FREE_ITEM,
	data
});
var changeSelectedDiscount = (data) => ({
	type: SET_DISCOUNT,
	data
});
var changeIgnoreReward = (data) => ({
	type: IGNORE_REWARD,
	data
});
var setRewardRule = (rewardRule) => {
	return (dispatch) => {
		dispatch({
			type: CRM_REWARD_RULE,
			data: rewardRule
		});
	};
};
var setOnboardGiftRule = (data) => ({
	type: ONBOARD_GIFT_RULE,
	data
});
var setFreeItemMenuPosition = (data) => ({
	type: FREE_ITEM_MENU_POSITION,
	data
});
var setIsMemberOrderedBefore = (data) => ({
	type: IS_MEMBER_ORDERED_BEFORE,
	data
});
var setTempCampaign = (data) => ({
	type: SET_TEMP_CAMPAIGN,
	data
});
//#endregion
//#region source-snapshot/src/utils/filterMenuGroupByLicense.js
var filterMenuGroupByLicense = (menuGroup, licenseList) => {
	const currentKioskLicense = getCookie("kioskLicense");
	const kioskLicensesIds = licenseList.map((each) => each.id);
	const currentLicenseId = licenseList.find((license) => `${license.displayname}` === currentKioskLicense)?.id;
	return menuGroup.filter((each) => {
		let actualLicense = each.appInstanceIds || [];
		const vpnLicense = actualLicense.filter((licenseId) => !kioskLicensesIds.includes(licenseId))?.[0];
		if (vpnLicense) {
			console.log("vpnLicense", vpnLicense);
			actualLicense = actualLicense.filter((each) => each !== vpnLicense);
		}
		if (!actualLicense?.length) return true;
		return actualLicense.includes(currentLicenseId);
	});
};
//#endregion
//#region source-snapshot/src/utils/getRewardItemByRules.js
var getRewardItemByRules = ({ rules, allItems }) => {
	return rules.filter((each) => each?.redeemRule?.strategy === "byFreeItem").map((each) => {
		const itemPoints = each?.redeemRule?.parameters?.points;
		const rewardType = each?.redeemRule?.parameters?.freeItemPool?.type;
		const ruleItems = each?.redeemRule?.parameters?.freeItemPool?.objects?.items?.filter((ruleItem) => ruleItem?.orderType === "KIOSK");
		const ruleItemsIds = ruleItems.map((item) => item?.itemId);
		const ruleItemSizeIds = ruleItems.map((item) => item?.sizeId);
		const itemWithPoint = allItems.map((item) => ({
			...item,
			itemPoints,
			rewardRule: each,
			crmIntegrationRule: { isValid: true },
			redeemRule: each.redeemRule
		}));
		if (rewardType === "ALL") return {
			...each,
			items: itemWithPoint
		};
		if (rewardType === "SELECTED") return {
			...each,
			items: itemWithPoint.filter((each) => ruleItemsIds.includes(each.id)).map((dish) => {
				return {
					...dish,
					itemPrices: dish.itemPrices?.filter((size) => ruleItemSizeIds.includes(size.id))
				};
			})
		};
		if (rewardType === "NOTSELECTED") return {
			...each,
			items: itemWithPoint.filter((each) => {
				if (each.itemPrices?.length > 0) {
					each.itemPrices = each.itemPrices?.filter((size) => !ruleItemSizeIds.includes(size.id));
					return each.itemPrices.length > 0;
				}
				return !ruleItemsIds.includes(each.id);
			})
		};
	});
};
//#endregion
//#region source-snapshot/src/utils/CRMIntegration/getTemplateAction.js
var getTemplateAction = ({ template }) => {
	const benefits = template.ruleExpression && template.ruleExpression.benefits;
	return benefits && benefits[benefits.length - 1] && benefits[benefits.length - 1].actions && benefits[benefits.length - 1].actions[benefits[benefits.length - 1].actions.length - 1];
};
var isCampaignInTypes = ({ template, types }) => {
	return types.includes(template.type);
};
//#endregion
//#region source-snapshot/src/utils/CRMIntegration/getCampaignViaType.js
/**
* 根据type返回对应的活动
* @param campaigns 营销活动
* @param types, 数组 营销活动类型 运费券(deliveryFee) 赠品券(addItem) 满折(percentage) 满减(minus) 特价商品(setPrice)
* @param source, 活动来源。 reward 积分活动， voucher券活动
* @returns 根据类型过滤出的活动
*/
var getCampaignViaType = ({ campaigns, types, source, itemResources, orderType, merchantId }) => {
	const filteredCampaigns = campaigns.filter((campaign) => {
		const template = campaign.couponTemplate;
		if (campaign.type !== source) return false;
		return template.productLine.includes("KIOSK") && isCampaignInTypes({
			template,
			types
		});
	});
	if (!itemResources) return filteredCampaigns;
	return filteredCampaigns.flatMap((campaign) => getAvailablePromotionRules([campaign.couponTemplate], itemResources, {
		orderType,
		merchantId
	}).map((couponTemplate) => ({
		...campaign,
		couponTemplate
	})));
};
//#endregion
//#region source-snapshot/src/utils/CRMIntegration/resolveItemCampaign.js
var makeUpRewardFreeItemData = ({ data, rule }) => {
	const { ruleId, name } = rule;
	const redeemPoint = rule?.redeemRule?.parameters?.point;
	return data.map((kioskSkuInfo) => {
		let originalPrice = kioskSkuInfo.price ?? 0;
		if (kioskSkuInfo.itemPrices?.length > 0) originalPrice = kioskSkuInfo.itemPrices.sort((a, b) => a.price - b.price)?.[0].price;
		return {
			...kioskSkuInfo,
			...rule,
			adItemType: "loyalty",
			rewardRule: {
				_id: ruleId,
				name,
				rewardType: "loyalty",
				redeemRule: {
					strategy: "byFreeItem",
					parameters: { points: redeemPoint }
				}
			},
			price: 0,
			originalPrice,
			freeItemOriginPrice: originalPrice,
			itemMax: 1,
			itemPoints: redeemPoint,
			description: kioskSkuInfo.description,
			crmDescription: rule.description
		};
	});
};
var resolveRewardItemCampaign = ({ rules = [], itemResources, orderType }) => {
	if (!rules?.length) return [];
	const { merchantProfile } = native_store_default.getState();
	return rules.reduce((pre, cur) => {
		const template = cur.couponTemplate;
		if (!template) return pre;
		const benefits = template.ruleExpression && template.ruleExpression.benefits;
		const rewardFreeItemData = makeUpRewardFreeItemData({
			data: filterPromotionItems(itemResources, (benefits && benefits[benefits.length - 1] && benefits[benefits.length - 1].actions && benefits[benefits.length - 1].actions[benefits[benefits.length - 1].actions.length - 1]).itemFilter, {
				merchantId: merchantProfile?.merchantId,
				orderType
			}),
			rule: cur
		});
		return pre.concat(rewardFreeItemData);
	}, []);
};
var makeUpVoucherFreeItemData = ({ data, rule, voucherRules }) => {
	const { ruleId, name } = rule;
	return data.map((kioskSkuInfo) => {
		let originalPrice = kioskSkuInfo.price ?? 0;
		if (kioskSkuInfo.itemPrices?.length > 0) originalPrice = kioskSkuInfo.itemPrices?.sort((a, b) => a.price - b.price)?.[0].price;
		return {
			...kioskSkuInfo,
			...rule,
			name: kioskSkuInfo.name,
			fieldDisplayNameGroups: kioskSkuInfo.fieldDisplayNameGroups,
			adItemType: "voucher",
			rewardRule: {
				_id: ruleId,
				name,
				rewardType: "voucher",
				redeemRule: { strategy: "byFreeItem" },
				voucherRules
			},
			price: 0,
			freeItemOriginPrice: originalPrice,
			itemMax: 1,
			originalPrice,
			discountPrice: 0,
			description: kioskSkuInfo.description,
			crmDescription: rule.description
		};
	});
};
var resolveVoucherItemCampaign = ({ rules = [], itemResources, orderType }) => {
	if (!rules?.length) return [];
	const { merchantProfile } = native_store_default.getState();
	return rules.reduce((pre, cur) => {
		const template = cur.couponTemplate;
		if (!template) return pre;
		const { ruleId } = cur;
		const benefits = template.ruleExpression && template.ruleExpression.benefits;
		const action = benefits && benefits[benefits.length - 1] && benefits[benefits.length - 1].actions && benefits[benefits.length - 1].actions[benefits[benefits.length - 1].actions.length - 1];
		const condition = template?.ruleExpression?.condition;
		const quantity = action.params.quantity;
		const voucherRules = {
			option: "itemOff",
			minSpend: condition.totalAmount,
			quantity
		};
		const voucherFreeItemData = makeUpVoucherFreeItemData({
			data: filterPromotionItems(itemResources, action.itemFilter, {
				merchantId: merchantProfile?.merchantId,
				orderType
			}),
			rule: cur,
			voucherRules
		});
		if (!voucherFreeItemData.length) return pre;
		return pre.concat({
			...cur,
			id: cur.id || ruleId,
			_id: ruleId,
			campaignId: ruleId,
			rewardType: "voucher",
			rewardRule: {
				_id: ruleId,
				name: cur.name,
				rewardType: "voucher",
				redeemRule: { strategy: "byFreeItem" },
				voucherRules
			},
			redeemRule: { strategy: "byFreeItem" },
			extSkuMapping: voucherFreeItemData,
			couponItemList: voucherFreeItemData,
			voucherRules,
			isFreeItemVoucher: true
		});
	}, []);
};
//#endregion
//#region source-snapshot/src/utils/createFreeItemMenu.js
var createFreeItemMenu = ({ menuGroup, crmRewardCampaign, isCRMIntegration, orderType }) => {
	const t = native_i18n_default.t;
	const menuId = "membership-point-redeem-menu";
	const categoryId = "membership-point-redeem-category";
	if (crmRewardCampaign?.length > 0 && menuGroup.length > 0) {
		let freeItemList = [];
		const itemResources = menuGroup.flatMap((group) => group.menuCategories).flatMap((category) => category?.saleItems).filter(Boolean);
		if (isCRMIntegration) freeItemList = resolveRewardItemCampaign({
			rules: getCampaignViaType({
				campaigns: crmRewardCampaign,
				types: ["giftItemCoupon"],
				source: "reward"
			}),
			itemResources,
			orderType
		});
		else freeItemList = getRewardItemByRules({
			rules: crmRewardCampaign,
			allItems: itemResources
		});
		const freeSaleItemList = isCRMIntegration ? freeItemList.map((each) => {
			return {
				...each,
				id: `${each.ruleId}_${each.id}`,
				oId: each.id,
				oCategoryId: each.categoryId,
				isFreeItem: true,
				categoryId
			};
		}) : freeItemList.reduce((pv, cv) => {
			const ruleId = cv._id;
			cv.items.forEach((e) => {
				pv.push({
					...e,
					id: ruleId + "_" + e.id,
					oId: e.id,
					categoryId,
					oCategoryId: e.categoryId,
					isFreeItem: true
				});
			});
			return pv;
		}, []).sort((a, b) => a.itemPoints - b.itemPoints);
		return {
			id: menuId,
			fieldDisplayNameGroups: [{
				fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
					name: t(menuId, { lng: key }),
					fieldName: "name",
					languageCode: langCodeMap[key]
				})),
				fieldName: "name"
			}, {
				fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
					name: t(menuId, { lng: key }),
					fieldName: "shortName",
					languageCode: langCodeMap[key]
				})),
				fieldName: "shortName"
			}],
			menuCategories: [{
				id: categoryId,
				groupId: menuId,
				fieldDisplayNameGroups: [
					{
						fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
							name: t(categoryId, { lng: key }),
							fieldName: "name",
							languageCode: langCodeMap[key]
						})),
						fieldName: "name"
					},
					{
						fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
							name: t(categoryId, { lng: key }),
							fieldName: "posName",
							languageCode: langCodeMap[key]
						})),
						fieldName: "posName"
					},
					{
						fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
							name: t(categoryId, { lng: key }),
							fieldName: "shortName",
							languageCode: langCodeMap[key]
						})),
						fieldName: "shortName"
					}
				],
				saleItems: freeSaleItemList,
				hiddenCategory: false,
				isFreeItemCategory: true
			}],
			isFreeItemMenu: true
		};
	}
	return null;
};
//#endregion
//#region source-snapshot/src/utils/createPromotionDealsList.js
var createPromotionDealsList = async ({ promotion, allSysConfig }) => {
	const { cloudPromotion, orderDiscount, buyGiftRule, buyDiscountRule, exchangePurchaseRule, promotionCenterList, promotionCenterMetas } = promotion;
	const isCRMEnable = !checkCRMStatus(allSysConfig);
	const menuId = "promotion-deals-list";
	const t = native_i18n_default.t;
	const filteredList = await filterValidPromotionCenterList({
		promotionCenterList,
		promotionCenterMetas,
		allItems: []
	});
	const promotionList = [
		...cloudPromotion || [],
		...orderDiscount?.filter((each) => (each?.activityRule?.isFirstOrderDiscount === "1" && isCRMEnable || each?.activityRule?.isFirstOrderDiscount !== "1") && each?.activityRule?.usePromotionCode !== "1") || [],
		...buyGiftRule || [],
		...buyDiscountRule || [],
		...exchangePurchaseRule || [],
		...filteredList || []
	];
	if (!promotionList.length) return {};
	return {
		id: menuId,
		fieldDisplayNameGroups: [{
			fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
				name: t(menuId, { lng: key }),
				fieldName: "name",
				languageCode: langCodeMap[key]
			})),
			fieldName: "name"
		}],
		menuCategories: [{
			id: menuId,
			groupId: menuId,
			fieldDisplayNameGroups: [{
				fieldDisplayNames: Object.keys(langCodeMap).map((key) => ({
					name: t(menuId, { lng: key }),
					fieldName: "name",
					languageCode: langCodeMap[key]
				})),
				fieldName: "name"
			}],
			saleItems: promotionList,
			hiddenCategory: false
		}]
	};
};
//#endregion
//#region source-snapshot/src/api/eCard.js
function axiosXML(obj) {
	return axios_default({
		method: "post",
		url: obj.url,
		data: obj.data,
		timeout: 3500,
		headers: { "Content-Type": "text/xml; charset=\"utf-8\"" }
	});
}
async function getECardSettings() {
	return (await axiosGet("/kpos/api/ecard/settings", { headers: { Authorization: "UvDU853J9L351BThAC" } })).data;
}
function searchECardCards(params) {
	return axiosGet("/kpos/api/ecard/cards/all/search", {
		params,
		headers: { Authorization: "UvDU853J9L351BThAC" }
	});
}
function fetchAllMenu() {
	return fetchKposWebappMenu({ product: "ALL" });
}
function saveGiftCardOrderBySoap(params) {
	const { totalPrice, saleItemId, quantity, price, actionType, cardType, to, toType, expirationTime, sessionKey } = params;
	return axiosXML({
		url: serverURL + "ws/kposService",
		data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:SaveOrderType><app:order><app:type>CLOUD_GIFT_CARD</app:type><app:totalPrice>${totalPrice}</app:totalPrice><app:userPassword>56854b3d95d5d154e1fbca66</app:userPassword><app:orderItems><app:saleItemId>${saleItemId}</app:saleItemId><app:quantity>${quantity}</app:quantity><app:price>${price}</app:price><app:eCard><app:actionType>${actionType}</app:actionType><app:cardType>${cardType}</app:cardType><app:to>${to}</app:to><app:toType>${toType}</app:toType><app:expirationTime>${expirationTime}</app:expirationTime></app:eCard></app:orderItems></app:order><app:userAuth><app:sessionKey>${sessionKey}</app:sessionKey></app:userAuth></app:SaveOrderType></soapenv:Body></soapenv:Envelope>`
	});
}
function removeGiftCard(data) {
	const { checksum, createTime, orderId, totalPrice, discountRate, discountRateType, discount, saleItemId, itemId, sessionKey } = data;
	return axiosXML({
		url: serverURL + "ws/kposService",
		data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:SaveOrderType><app:order><app:userPassword>56854b3d95d5d154e1fbca66</app:userPassword><app:point>0</app:point><app:needCommit>2</app:needCommit><app:checksum>${checksum}</app:checksum><app:createTime>${createTime}</app:createTime><app:callerId>false</app:callerId><app:crmMemberId></app:crmMemberId><app:crmCustomerInfo>{}</app:crmCustomerInfo><app:id>${orderId}</app:id><app:status>CANCELED</app:status><app:forceRecoveryStock>true</app:forceRecoveryStock><app:discountList>[]</app:discountList><app:exemptAutoCharges></app:exemptAutoCharges><app:taxExempt>false</app:taxExempt><app:numOfGuests>0</app:numOfGuests><app:totalPrice>${totalPrice}</app:totalPrice><app:totalTips>0</app:totalTips><app:totalTax>0.00</app:totalTax><app:roundingAmount>0</app:roundingAmount><app:printTicketWhenVoid>true</app:printTicketWhenVoid><app:discountName></app:discountName><app:discountID>-1</app:discountID><app:discountRate>${discountRate}</app:discountRate><app:discountRateType>${discountRateType}</app:discountRateType><app:chargeName></app:chargeName><app:chargeID>-1</app:chargeID><app:discount>${discount}</app:discount><app:charge>0</app:charge><app:rewardDiscount>0</app:rewardDiscount><app:loyaltyDiscount>false</app:loyaltyDiscount><app:orderItems><app:saleItemId>${saleItemId}</app:saleItemId><app:id>${itemId}</app:id><app:seatId>0</app:seatId><app:quantity>1</app:quantity><app:originalSalePrice>${totalPrice}</app:originalSalePrice><app:originDualPrice>${totalPrice}</app:originDualPrice><app:price>${totalPrice}</app:price><app:status>ORDERED</app:status><app:taxExempt>false</app:taxExempt><app:useBenefitPrice>false</app:useBenefitPrice><app:discountList>[]</app:discountList><app:rewardItem>false</app:rewardItem><app:isGiftItem>false</app:isGiftItem><app:discount>0</app:discount><app:discountRate>0</app:discountRate><app:discountRateType>0</app:discountRateType><app:charge>0</app:charge><app:chargeTaxed>false</app:chargeTaxed><app:chargeRateType>0</app:chargeRateType><app:chargeRate>0</app:chargeRate><app:taxSnapshot>true</app:taxSnapshot></app:orderItems><app:productLine>KIOSK</app:productLine></app:order><app:fetchPayments>true</app:fetchPayments><app:userAuth><app:sessionKey>${sessionKey}</app:sessionKey></app:userAuth></app:SaveOrderType></soapenv:Body></soapenv:Envelope>`
	});
}
function printECardInfo(eCardData) {
	return axiosPost(serverURL + "webapp/print/printReceipt", eCardData);
}
//#endregion
//#region source-snapshot/src/constants/constantUnit.js
var STANDARD_TOP = 8.8;
var ITEM_HEIGHT = 18.2;
var PHONE_NUMBER = "PHONE_NUMBER";
var CARD_NUMBER = "CARD_NUMBER";
var EMAIL = "EMAIL";
//#endregion
//#region source-snapshot/src/utils/menuSearchIndex.js
var createMenuSearchIndex = ({ categoryList = [], language, numberRequire, getItemLanguage }) => {
	const index = [];
	categoryList.forEach((category) => {
		(category?.saleItems || []).forEach((item) => {
			let itemName = getItemLanguage(item?.fieldDisplayNameGroups, language) || item?.name;
			if (numberRequire) itemName = `${item?.itemNumber}.${itemName} `;
			index.push({
				item,
				searchText: itemName?.toString()?.toUpperCase() || ""
			});
		});
	});
	return index;
};
var searchMenuIndex = (index, keyword) => index.filter((entry) => entry.searchText.includes(keyword)).map((entry) => entry.item);
//#endregion
//#region source-snapshot/src/actions/index.js
var actions_exports = /* @__PURE__ */ __exportAll({
	addCampaignItemsToOrder: () => addCampaignItemsToOrder,
	addCombo2Order: () => addCombo2Order,
	addComboOption: () => addComboOption,
	addItem2ComboSection: () => addItem2ComboSection,
	addOption: () => addOption,
	addToComboSectionById: () => addToComboSectionById,
	appendPaymentTypeTrail: () => appendPaymentTypeTrail,
	changeCheckFooterVisible: () => changeCheckFooterVisible,
	changeDefaultDish: () => changeDefaultDish,
	changeOrderType: () => changeOrderType,
	changePickupTime: () => changePickupTime,
	changeSkipPromotionCalculationStatus: () => changeSkipPromotionCalculationStatus,
	clearCurrentCategory: () => clearCurrentCategory,
	clearCurrentItem: () => clearCurrentItem,
	clearECardState: () => clearECardState,
	clearFootItemComboSection: () => clearFootItemComboSection,
	clearPayType: () => clearPayType,
	clearPaymentTypeTrail: () => clearPaymentTypeTrail,
	clearPostPaymentActions: () => clearPostPaymentActions,
	clearSearchKeyWord: () => clearSearchKeyWord,
	clearTogoOption: () => clearTogoOption,
	crm: () => crm_action_exports,
	currentCategoryList: () => currentCategoryList,
	customer: () => customer,
	deleteAllById: () => deleteAllById,
	dispatchCurrentCategoryList: () => dispatchCurrentCategoryList,
	editDefaultDish: () => editDefaultDish,
	editOrderItemAction: () => editOrderItemAction,
	fetchAvailableECards: () => fetchAvailableECards,
	fetchCloudGiftCardItem: () => fetchCloudGiftCardItem,
	getCurrentCategory: () => getCurrentCategory,
	getCurrentItem: () => getCurrentItem,
	getMenuItemList: () => getMenuItemList,
	initCompanyParams: () => initCompanyParams,
	initConfigParams: () => initConfigParams,
	initCurrentOrderCombo: () => initCurrentOrderCombo,
	initEditOrderMode: () => initEditOrderMode,
	initMenuGroup2: () => initMenuGroup2,
	initMenuGroupList: () => initMenuGroupList,
	initParams: () => initParams,
	initSystemStore: () => initSystemStore,
	markPostPaymentAction: () => markPostPaymentAction,
	notes: () => notes,
	payByCard: () => payByCard,
	payByCash: () => payByCash,
	payByGiftCard: () => payByGiftCard,
	recalculatePromotion: () => recalculatePromotion,
	recordKioskDiscountPromotion: () => recordKioskDiscountPromotion,
	recountCurrentOrderList: () => recountCurrentOrderList,
	refreshMenuStockNumIfChanged: () => refreshMenuStockNumIfChanged,
	removeFootItemComboSection: () => removeFootItemComboSection,
	removeFootOptComboSection: () => removeFootOptComboSection,
	removeFreeItemInOrder: () => removeFreeItemInOrder,
	removeItemFromComboSection: () => removeItemFromComboSection,
	removeItemFromOrder: () => removeItemFromOrder,
	removeItemRewardInfoFromOrder: () => removeItemRewardInfoFromOrder,
	removeItemsOneOption: () => removeItemsOneOption,
	removeLocalPromotionRewardInfo: () => removeLocalPromotionRewardInfo,
	removeManualSelectRewardItemFromOrder: () => removeManualSelectRewardItemFromOrder,
	removeOneOption: () => removeOneOption,
	removeRewardItemFromList: () => removeRewardItemFromList,
	removeSearchItem: () => removeSearchItem,
	replaceComboOrder: () => replaceComboOrder,
	replaceItemOrder: () => replaceItemOrder,
	resetCurrentOrder: () => resetCurrentOrder,
	resetCurrentOrderCombo: () => resetCurrentOrderCombo,
	saveOrderResult: () => saveOrderResult,
	savePaymentId: () => savePaymentId,
	saveTipAmount: () => saveTipAmount,
	searchItemHandler: () => searchItemHandler,
	setActivityCurrentItem: () => setActivityCurrentItem,
	setAllMenu: () => setAllMenu,
	setAuthorizationDisplayName: () => setAuthorizationDisplayName,
	setAvailableECards: () => setAvailableECards,
	setBanner: () => setBanner,
	setBannerPro: () => setBannerPro,
	setBrandMenu: () => setBrandMenu,
	setCardPaidResult: () => setCardPaidResult,
	setCateDish: () => setCateDish,
	setCateyPageDomTop: () => setCateyPageDomTop,
	setConnectWs: () => setConnectWs,
	setCustomerName: () => setCustomerName,
	setECardCloudGiftCardItem: () => setECardCloudGiftCardItem,
	setECardLastQuery: () => setECardLastQuery,
	setECardLoading: () => setECardLoading,
	setECardQuickAmounts: () => setECardQuickAmounts,
	setECardSettings: () => setECardSettings,
	setEditComboQty: () => setEditComboQty,
	setEditOrderMode: () => setEditOrderMode,
	setExpandFreeList: () => setExpandFreeList,
	setGiftCardPaymentInfo: () => setGiftCardPaymentInfo,
	setImg: () => setImg,
	setIsMenuUpdated: () => setIsMenuUpdated,
	setIsReorderFlag: () => setIsReorderFlag,
	setItemPrice: () => setItemPrice,
	setKioskConfigUserId: () => setKioskConfigUserId,
	setLanModal: () => setLanModal,
	setLanModalFn: () => setLanModalFn,
	setLang: () => setLang,
	setLicenseList: () => setLicenseList,
	setLocator: () => setLocator,
	setLogo: () => setLogo,
	setMakingCupNum: () => setMakingCupNum,
	setMobyDeviceInfo: () => setMobyDeviceInfo,
	setMobyDeviceLinkStatus: () => setMobyDeviceLinkStatus,
	setNetWorkStatus: () => setNetWorkStatus,
	setNumOfGuests: () => setNumOfGuests,
	setOrderStatus: () => setOrderStatus,
	setOriginalItemList: () => setOriginalItemList,
	setPaymentMemberCardRecord: () => setPaymentMemberCardRecord,
	setSelectedBrand: () => setSelectedBrand,
	setSelectedECard: () => setSelectedECard,
	setSelfConfig: () => setSelfConfig,
	setSequenceNumber: () => setSequenceNumber,
	setShowBanner: () => setShowBanner,
	setShowBannerPro: () => setShowBannerPro,
	setShowLoginGuideDialog: () => setShowLoginGuideDialog,
	setShowScreensaver: () => setShowScreensaver,
	setShowWaitingTimeModal: () => setShowWaitingTimeModal,
	setSideNavIndex: () => setSideNavIndex,
	setSideNavList: () => setSideNavList,
	setTabelServiceType: () => setTabelServiceType,
	setTableId: () => setTableId,
	setTogoOption: () => setTogoOption,
	setTriposPayFinish: () => setTriposPayFinish,
	setTriposPayReady: () => setTriposPayReady,
	setUpdateMenuLoad: () => setUpdateMenuLoad,
	setVListScroll: () => setVListScroll,
	setkeyboardToggle: () => setkeyboardToggle,
	setorderPageDomTop: () => setorderPageDomTop,
	spliceAllComboItems: () => spliceAllComboItems,
	spliceOrderBySoldout: () => spliceOrderBySoldout,
	spliceOrderItemAction: () => spliceOrderItemAction,
	spliceSingleComboItems: () => spliceSingleComboItems,
	syncMenuStockNum: () => syncMenuStockNum,
	updatePromotionDealsInMenuGroup: () => updatePromotionDealsInMenuGroup
});
var menuSearchIndexCache = {
	source: null,
	isOpenBrand: null,
	language: null,
	numberRequire: null,
	index: []
};
var getCachedMenuSearchIndex = ({ source, isOpenBrand, language, numberRequire }) => {
	if (menuSearchIndexCache.source === source && menuSearchIndexCache.isOpenBrand === isOpenBrand && menuSearchIndexCache.language === language && menuSearchIndexCache.numberRequire === numberRequire) return menuSearchIndexCache.index;
	const index = createMenuSearchIndex({
		categoryList: isOpenBrand ? (source || []).flatMap((group) => group?.menuCategories || []) : source || [],
		language,
		numberRequire,
		getItemLanguage: getCurrentItemLanguage
	});
	menuSearchIndexCache = {
		source,
		isOpenBrand,
		language,
		numberRequire,
		index
	};
	return index;
};
function setLang(lan = "") {
	return (dispatch) => {
		dispatch({
			type: CURRENT_LANGUAGE,
			currentLanguage: lan
		});
	};
}
function getMenuItemList(dispatch, menus) {
	let menuItemList = {};
	for (let menuGroup of menus) if (menuGroup.menuCategories != void 0) {
		for (let category of menuGroup.menuCategories) if (category.saleItems != void 0) for (let item of category.saleItems) {
			menuItemList[item.id] = item;
			if (item.oId) menuItemList[item.oId] = item;
		}
	}
	dispatch({
		type: MENU_ITEM_LIST,
		menuItemList
	});
}
/**
* 拉取带 stockNum 的菜单并合并到 Redux 中的菜品数据
*/
async function syncMenuStockNum(dispatch, getState, source = "menu-init") {
	try {
		return await syncMenuStockNum$1(dispatch, getState, { source });
	} catch (error) {
		console.log("syncMenuStockNum failed", error);
	}
}
function refreshMenuStockNumIfChanged() {
	return async (dispatch, getState) => {
		try {
			return await syncMenuStockNum$1(dispatch, getState, {
				onlyIfChanged: true,
				source: "start-order"
			});
		} catch (error) {
			console.log("refreshMenuStockNumIfChanged failed", error);
		}
	};
}
/**
* 处理菜单组：过滤、添加免费菜品菜单、添加促销活动
* @param {Object} menuGroupList - 菜单组列表
* @param {Function} dispatch - Redux dispatch 函数
* @param {Function} getState - Redux getState 函数
* @returns {Array} 处理后的菜单组
*/
async function processMenuGroup(menuGroupList, dispatch, getState, stockSource) {
	let menuGroup = null;
	if (!!menuGroupList.KioskMenus[0]) menuGroup = menuGroupList.KioskMenus[0].menuGroups;
	const licenseList = getState().sysCookie.systemLicense;
	if (licenseList?.length > 0) menuGroup = filterMenuGroupByLicense(menuGroup, licenseList);
	const allSysConfig = getState().allSysConfig;
	const CRMStore = getState().crm;
	const rewardRule = CRMStore.rewardRule;
	const freeItemMenuPosition = CRMStore.freeItemMenuPosition;
	const crmIntegrationReward = getState().avocado;
	const orderType = getState().currentOrder.orderType;
	const { outletInfo, rewards } = crmIntegrationReward;
	const isCRMIntegration = outletInfo?.enabled === 1;
	const crmRewardCampaign = isCRMIntegration ? rewards : rewardRule;
	if (menuGroup?.length > 0) {
		if (crmRewardCampaign?.length > 0) {
			const freeItemMenu = createFreeItemMenu({
				menuGroup,
				crmRewardCampaign,
				isCRMIntegration,
				orderType
			});
			if (freeItemMenu && freeItemMenuPosition !== null) {
				if (freeItemMenuPosition === 0) menuGroup = [freeItemMenu, ...menuGroup.filter((_) => !_.isFreeItemMenu)];
				else if (freeItemMenuPosition === 1) menuGroup = [...menuGroup.filter((_) => !_.isFreeItemMenu), freeItemMenu];
			}
		}
		const promotion = getState().promotion;
		const merchantInfo = getState().merchantProfile;
		const isShowPromotionDealsCard = getState().selfConfig?.configMap?.id_67 !== false;
		if (merchantInfo?.merchantId && isShowPromotionDealsCard) {
			const promotionDeals = await createPromotionDealsList({
				promotion,
				allSysConfig
			});
			if (promotionDeals && Object.keys(promotionDeals).length > 0) menuGroup = [promotionDeals, ...menuGroup];
		}
	}
	getMenuItemList(dispatch, menuGroup);
	dispatch({
		type: FETCH_MENUGROUP,
		menuGroup
	});
	await syncMenuStockNum(dispatch, getState, stockSource);
	dispatchCurrentCategoryList(dispatch, getState);
	return getState().menuGroup;
}
function initParams(merchantProf, menuGroupList) {
	return async (dispatch, getState) => {
		if (merchantProf) dispatch({
			type: FETCH_MERCHANT_PROFILE,
			merchantProfile: merchantProf.company
		});
		const menuGroup = await processMenuGroup(menuGroupList, dispatch, getState);
		dispatch({
			type: COMBO_MENU,
			comboMenu: menuGroupList.KioskMenus[0]?.comboSectionSaleItemDTOList || []
		});
		dispatch({
			type: CURRENT_CATEGORY,
			currentCategory: {}
		});
		dispatch({
			type: CURRENT_SALE_ITEMS,
			currentSaleItems: []
		});
		dispatch({
			type: SETREQUIRECATEGORY,
			data: menuGroup
		});
	};
}
function initConfigParams(sysConfig, taxInfo, itemSizeList, allSysConfigList) {
	return (dispatch) => {
		if (sysConfig) dispatch({
			type: SET_SYSTEM_CONFIG,
			sysConfig
		});
		if (taxInfo?.companyTaxList) dispatch({
			type: SET_TAX_INFO,
			taxInfo: taxInfo.companyTaxList
		});
		if (itemSizeList?.itemSizeList) dispatch({
			type: ITEM_SIZE_LIST,
			itemSizeList: itemSizeList.itemSizeList
		});
		if (allSysConfigList?.systemConfiguration) dispatch({
			type: ALL_SET_SYSTEM_CONFIG,
			allSysConfig: allSysConfigList.systemConfiguration
		});
	};
}
function initCompanyParams(merchantProf) {
	return (dispatch) => {
		dispatch({
			type: FETCH_MERCHANT_PROFILE,
			merchantProfile: merchantProf.company
		});
	};
}
function initMenuGroupList(menuGroupList) {
	return async (dispatch, getState) => {
		const menuGroup = await processMenuGroup(menuGroupList, dispatch, getState);
		dispatch({
			type: COMBO_MENU,
			comboMenu: menuGroupList.KioskMenus[0]?.comboSectionSaleItemDTOList || []
		});
		dispatch({
			type: CURRENT_CATEGORY,
			currentCategory: {}
		});
		dispatch({
			type: CURRENT_SALE_ITEMS,
			currentSaleItems: []
		});
		dispatch({
			type: SETREQUIRECATEGORY,
			data: menuGroup
		});
		dispatch({
			type: MENULOAD,
			data: false
		});
	};
}
function initMenuGroup2(menuGroupList, stockSource = "menu-update") {
	return async (dispatch, getState) => {
		const menuGroup = await processMenuGroup(menuGroupList, dispatch, getState, stockSource);
		dispatch({
			type: COMBO_MENU,
			comboMenu: menuGroupList.KioskMenus[0]?.comboSectionSaleItemDTOList || []
		});
		dispatch({
			type: SETREQUIRECATEGORY,
			data: menuGroup
		});
		dispatch({
			type: MENULOAD,
			data: false
		});
		EventBus.emit("menu_group_updated");
		return menuGroup;
	};
}
function currentCategoryList() {
	return (dispatch, getState) => dispatchCurrentCategoryList(dispatch, getState);
}
function dispatchCurrentCategoryList(dispatch, getState) {
	const menuGroup = getState().menuGroup;
	let menuCategoryList = [];
	for (let group of menuGroup) if (group.menuCategories) menuCategoryList = menuCategoryList.concat(group.menuCategories);
	const orderType = getState().currentOrder.orderType;
	dispatch({
		type: CURRENT_CATEGORY_LIST,
		categoryAction: {
			currentCategoryList: menuCategoryList,
			orderType
		}
	});
}
function updatePromotionDealsInMenuGroup() {
	return async (dispatch, getState) => {
		const state = getState();
		if (!(state.selfConfig?.configMap?.id_67 !== false)) return;
		const promotion = state.promotion;
		const merchantInfo = state.merchantProfile;
		const allSysConfig = state.allSysConfig;
		const localPromotionConfig = state.selfConfig?.configMap?.id_52;
		const menuGroup = state.menuGroup?.filter((group) => group.id !== "promotion-deals-list");
		if (merchantInfo?.merchantId && promotion.promotionCenterMetas && promotion.promotionCenterList?.length || localPromotionConfig) {
			const promotionDeals = await createPromotionDealsList({
				promotion,
				allSysConfig
			});
			let updatedMenuGroup = [...menuGroup];
			if (promotionDeals && Object.keys(promotionDeals).length > 0) updatedMenuGroup = [promotionDeals, ...menuGroup];
			getMenuItemList(dispatch, updatedMenuGroup);
			dispatch({
				type: FETCH_MENUGROUP,
				menuGroup: updatedMenuGroup
			});
			dispatchCurrentCategoryList(dispatch, getState);
		}
	};
}
function removeItemFromOrder(itemId) {
	return (dispatch, getState) => {
		const { buyDiscountRule, isSkipPromotionCalculation } = getState().promotion;
		dispatch({
			type: REMOVE_ITEM_FROM_ORDER,
			itemId,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
	};
}
function initCurrentOrderCombo(currentItem, currentCategory) {
	return (dispatch, getState) => {
		const orderType = getState().currentOrder.orderType;
		const currentCategoryList = getState().currentCategoryList;
		const selfConfig = getState().selfConfig;
		const menuItemList = getState().menuItemList;
		const kioskSoldOutList = getState().selfConfig?.soldOut;
		dispatch({
			type: CURRENT_COMBO,
			comboInfo: {
				currentItem,
				currentCategory,
				orderType,
				currentCategoryList,
				selfConfig,
				menuItemList,
				kioskSoldOutList
			}
		});
	};
}
function resetCurrentOrderCombo() {
	return (dispatch) => {
		dispatch({ type: RESET_CURRENT_COMBO });
	};
}
function addItem2ComboSection(sectionId, item) {
	return (dispatch, getState) => {
		const state = getState();
		const itemsToAdd = Array.isArray(item) ? item : [item];
		if (!canAddComboSubItems({
			itemsToAdd,
			itemList: state.currentOrder.itemList,
			currentOrderCombo: state.currentOrderCombo,
			menuItemList: state.menuItemList,
			crm: state.crm,
			promotion: state.promotion
		})) {
			showInsufficientStockToast(void 0, itemsToAdd, state.menuItemList);
			return false;
		}
		dispatch({
			type: ADD_TO_SECTION,
			itemInfo: {
				sectionId,
				item: itemsToAdd
			}
		});
		return true;
	};
}
function editDefaultDish(sideNavId, newDishInfo) {
	return (dispatch, getState) => {
		const state = getState();
		const itemsToAdd = Array.isArray(newDishInfo) ? newDishInfo : [newDishInfo];
		if (!canAddComboSubItems({
			itemsToAdd,
			itemList: state.currentOrder.itemList,
			currentOrderCombo: state.currentOrderCombo,
			menuItemList: state.menuItemList,
			crm: state.crm,
			promotion: state.promotion,
			excludeSectionId: sideNavId
		})) {
			showInsufficientStockToast(void 0, itemsToAdd, state.menuItemList);
			return false;
		}
		dispatch({
			type: EDIT_DEFAULT_DISH,
			itemInfo: {
				sideNavId,
				newDishInfo: itemsToAdd
			}
		});
		return true;
	};
}
function changeDefaultDish(sideNavId, itemId) {
	return (dispatch) => {
		dispatch({
			type: CHANGE_DEFAULT_DISH,
			itemInfo: {
				sideNavId,
				itemId
			}
		});
	};
}
function removeItemFromComboSection(sectionId, itemId, isPreSelected) {
	return (dispatch) => {
		dispatch({
			type: REMOVE_FROM_SECTION,
			itemInfo: {
				sectionId,
				itemId,
				isPreSelected
			}
		});
	};
}
function setItemPrice(sizeInfo) {
	return (dispatch) => {
		dispatch({
			type: SET_ITEM_PRICE,
			sizeInfo
		});
	};
}
function addComboOption(option) {
	return (dispatch) => {
		dispatch({
			type: ADD_COMBO_OPTION,
			option
		});
	};
}
function addOption(sectionId, option) {
	return (dispatch) => {
		dispatch({
			type: ADD_OPTION,
			optionInfo: {
				sectionId,
				option
			}
		});
	};
}
function addCombo2Order(comboInfo) {
	return (dispatch, getState) => {
		const state = getState();
		if (isMembershipCard(comboInfo) && (state.currentOrder.itemList.some(isMembershipCard) || comboInfo.quantity !== 1 || comboInfo.membershipUserId !== state.crm.memberCRMInfo?.userId || !comboInfo.privilegeId)) return false;
		if (comboInfo.itemType !== "SALE_ITEM" && comboInfo.sectionDetail?.length && !validateComboSubmitStock(comboInfo, state)) {
			showInsufficientStockToast(void 0, comboInfo, state.menuItemList);
			return false;
		}
		if (!isStockSufficient({
			itemInfo: comboInfo,
			addQty: comboInfo.quantity || 1,
			itemList: state.currentOrder.itemList,
			menuItemList: state.menuItemList,
			currentOrderCombo: state.currentOrderCombo,
			crm: state.crm,
			promotion: state.promotion
		})) {
			showInsufficientStockToast(void 0, comboInfo, state.menuItemList);
			return false;
		}
		const orderSequence = state.orderSequence;
		const { buyDiscountRule, isSkipPromotionCalculation } = state.promotion;
		comboInfo.sequence = orderSequence;
		if (!comboInfo.remark || !comboInfo.remark.optionName) comboInfo.remark = {
			optionName: "",
			optionType: "NOTE",
			quantity: 1,
			price: 0
		};
		dispatch({
			type: ADD_COMBO_TO_ORDER,
			comboInfo,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
		const getSecondHalfInfo = (id) => {
			return buyDiscountRule.find((info) => info.activityRule.buyDishes.includes(id));
		};
		dispatch({
			type: ORDER_SEQUENCE,
			increaseInterval: getSecondHalfInfo(comboInfo.id) && comboInfo.quantity > 1 ? comboInfo.quantity : 1
		});
		return true;
	};
}
function resetCurrentOrder() {
	return (dispatch) => {
		dispatch({ type: RESET_ITEM_LIST });
		dispatch({
			type: SET_ORDER_STATUS,
			status: ""
		});
		dispatch({
			type: SET_PAYMENT_ID,
			paymentId: ""
		});
		dispatch({
			type: SET_ORDER_NOTES,
			notes: ""
		});
		dispatch({
			type: SAVE_ORDER_RESULT,
			result: {}
		});
		dispatch({
			type: ORDER_TYPE$1,
			orderType: ""
		});
		dispatch({
			type: SET_ORDER_CUSTOMER,
			customer: {
				firstName: "",
				phone: [{}]
			}
		});
		dispatch({
			type: SAVE_TIP_AMOUNT,
			tipAmount: 0
		});
		dispatch({
			type: SETTABELSERVICETYPE,
			data: ""
		});
		dispatch({
			type: SET_PICKUP_TIME,
			pickupTime: ""
		});
		dispatch({
			type: IS_AUTHORIZATION_DISPLAY_NAME,
			data: false
		});
		dispatch({
			type: SET_CUSTOMER_NAME,
			data: ""
		});
		dispatch(setSelectedECard(null));
		dispatch(setAvailableECards([]));
		dispatch(setECardLastQuery(null));
		dispatch(setECardLoading(false));
	};
}
function saveOrderResult(res) {
	return (dispatch) => {
		dispatch({
			type: SAVE_ORDER_RESULT,
			result: res
		});
	};
}
function savePaymentId(id) {
	return (dispatch) => {
		dispatch({
			type: SET_PAYMENT_ID,
			paymentId: id
		});
	};
}
function setPaymentMemberCardRecord(record) {
	return {
		type: SET_PAYMENT_MEMBER_CARD_RECORD,
		record
	};
}
function notes(notes) {
	return (dispatch) => {
		dispatch({
			type: SET_ORDER_NOTES,
			notes
		});
	};
}
function customer(customer) {
	return (dispatch) => {
		dispatch({
			type: SET_ORDER_CUSTOMER,
			customer
		});
	};
}
function setAuthorizationDisplayName(isAuthorization) {
	return (dispatch) => {
		dispatch({
			type: IS_AUTHORIZATION_DISPLAY_NAME,
			data: isAuthorization
		});
	};
}
function setCustomerName(customerName) {
	return (dispatch) => {
		dispatch({
			type: SET_CUSTOMER_NAME,
			data: customerName
		});
	};
}
function setOrderStatus(status) {
	return (dispatch) => {
		dispatch({
			type: SET_ORDER_STATUS,
			status
		});
	};
}
function setOriginalItemList(itemList) {
	return (dispatch) => {
		dispatch({
			type: SET_ORIGINAL_ITEM_LIST,
			itemList
		});
	};
}
function saveTipAmount(tipAmount) {
	return (dispatch) => {
		dispatch({
			type: SAVE_TIP_AMOUNT,
			tipAmount
		});
	};
}
function getCurrentCategory(categoryId, type) {
	return (dispatch, getState) => {
		const isOpenBrand = getState().selfConfig?.configMap?.id_26;
		const categoryList = getState().currentCategoryList;
		for (let category of categoryList) if (category.id == categoryId) {
			const brandSaleItem = (getState().brandSetting.brandMenu.reduce((pre, cur) => {
				return pre.concat(cur.menuCategories);
			}, [])?.find((each) => each.id === categoryId))?.saleItems;
			dispatch({
				type: CURRENT_CATEGORY,
				currentCategory: category
			});
			dispatch({
				type: TEMP_CURRENT_CATEGORY,
				tempCurrentCategory: category
			});
			dispatch({
				type: TEMP_ITEM_LIST,
				tempItemList: getState().currentCategory.saleItems || []
			});
			if (type === "clickCategoryNav") {}
			if (!isOpenBrand) dispatch({
				type: CURRENT_SALE_ITEMS,
				currentSaleItems: getState().searchKeyWord === "" ? getState().currentCategory.saleItems || [] : getState().currentSaleItems
			});
			else dispatch({
				type: CURRENT_SALE_ITEMS,
				currentSaleItems: brandSaleItem || []
			});
		}
	};
}
function clearCurrentCategory() {
	return (dispatch, getState) => {
		dispatch({
			type: CURRENT_CATEGORY,
			currentCategory: {}
		});
	};
}
function getCurrentItem(itemId) {
	return (dispatch, getState) => {
		const saleItemList = getState().currentSaleItems;
		const currentCategory = getState().currentCategory;
		const qtyQualifyingForZeroRated = getState().currentCategory.qtyQualifyingForZeroRated;
		for (let item of saleItemList) if (item.id == itemId) {
			let tempItem = sortComboItemSections(Object.assign({}, item));
			if (currentCategory?.isFreeItemCategory) {
				const category = getState().currentCategoryList.find((_) => _.id === tempItem.oCategoryId);
				if (category && category.options && category.options.length > 0) tempItem.categoryOptions = category.options;
			} else if (currentCategory.options && currentCategory.options.length > 0) tempItem.categoryOptions = currentCategory.options;
			if (qtyQualifyingForZeroRated && qtyQualifyingForZeroRated.length > 0) tempItem.qtyQualifyingForZeroRated = qtyQualifyingForZeroRated;
			dispatch({
				type: CURRENT_ITEM,
				currentItem: tempItem
			});
			break;
		}
	};
}
var setActivityCurrentItem = (data) => (dispatch, getState) => {
	dispatch({
		type: CURRENT_ITEM,
		currentItem: sortComboItemSections(attachCategoryOptionsToItem(data, getState().currentCategoryList))
	});
};
function clearCurrentItem() {
	return (dispatch) => {
		dispatch({
			type: CURRENT_ITEM,
			currentItem: {}
		});
	};
}
function clearSearchKeyWord() {
	return (dispatch, getState) => {
		dispatch({
			type: SEARCH_KEY_WORD,
			searchKeyWord: ""
		});
	};
}
function removeSearchItem() {
	return (dispatch, getState) => {
		dispatch({
			type: SAVESEARCHITEM,
			searchItem: []
		});
	};
}
function searchItemHandler(event) {
	const iptVal = event.toString().toUpperCase();
	return (dispatch, getState) => {
		if (iptVal === "") {
			dispatch({
				type: CURRENT_CATEGORY,
				currentCategory: getState().tempCurrentCategory
			});
			dispatch({
				type: CURRENT_SALE_ITEMS,
				currentSaleItems: getState().tempItemList
			});
			dispatch({
				type: SAVESEARCHITEM,
				searchItem: []
			});
		} else {
			const isOpenBrand = getState().selfConfig?.configMap?.id_26;
			const numberRequire = getState().selfConfig?.configMap?.id_16;
			const tempSaleItems = searchMenuIndex(getCachedMenuSearchIndex({
				source: isOpenBrand ? getState().brandSetting.brandMenu : getState().currentCategoryList,
				isOpenBrand,
				language: native_i18n_default.language,
				numberRequire
			}), iptVal);
			dispatch({
				type: CURRENT_SALE_ITEMS,
				currentSaleItems: tempSaleItems
			});
			dispatch({
				type: SAVESEARCHITEM,
				searchItem: tempSaleItems
			});
		}
		dispatch({
			type: SEARCH_KEY_WORD,
			searchKeyWord: iptVal
		});
	};
}
var setExpandFreeList = (data) => ({
	type: EXPEND_FREELIST,
	data
});
var clearPayType = () => ({
	type: SAVE_PAYMENT_TYPE,
	paymentType: ""
});
var appendPaymentTypeTrail = (paymentType) => ({
	type: APPEND_PAYMENT_TYPE_TRAIL,
	paymentType
});
var clearPaymentTypeTrail = () => ({ type: CLEAR_PAYMENT_TYPE_TRAIL });
var markPostPaymentAction = (actionName) => ({
	type: MARK_POST_PAYMENT_ACTION,
	actionName
});
var clearPostPaymentActions = () => ({ type: CLEAR_POST_PAYMENT_ACTIONS });
function payByCash() {
	return (dispatch) => {
		return new Promise((resolve) => {
			dispatch({
				type: SAVE_PAYMENT_TYPE,
				paymentType: "CASH"
			});
			setTimeout(() => resolve(), 0);
		});
	};
}
function payByCard() {
	return (dispatch) => {
		return new Promise((resolve) => {
			dispatch({
				type: SAVE_PAYMENT_TYPE,
				paymentType: "CREDIT_CARD"
			});
			setTimeout(() => resolve(), 0);
		});
	};
}
function payByGiftCard() {
	return (dispatch) => {
		dispatch({
			type: SAVE_PAYMENT_TYPE,
			paymentType: "GIFT_CARD"
		});
		dispatch(appendPaymentTypeTrail("GIFT_CARD"));
	};
}
function initSystemStore() {
	return (dispatch, getState) => {
		dispatch({
			type: RESET_ORDER,
			itemList: []
		});
		dispatch({
			type: CURRENT_CATEGORY,
			currentCategory: {}
		});
		dispatch({
			type: CURRENT_SALE_ITEMS,
			currentSaleItems: []
		});
		dispatch({
			type: INIT_ORDER_SEQUENCE,
			initSequence: 0
		});
		dispatch({
			type: CLEAR_TOGO_OPTION,
			itemList: []
		});
		dispatch({
			type: SETLOCATOR,
			data: ""
		});
	};
}
function changeOrderType(orderType) {
	return (dispatch, getState) => {
		dispatch({
			type: ORDER_TYPE$1,
			orderType
		});
		dispatchCurrentCategoryList(dispatch, getState);
	};
}
function changePickupTime(pickupTime) {
	return (dispatch) => {
		dispatch({
			type: SET_PICKUP_TIME,
			pickupTime
		});
	};
}
function setEditOrderMode(itemInfo) {
	return (dispatch) => {
		dispatch({
			type: CURRENT_ITEM,
			currentItem: itemInfo
		});
		dispatch({
			type: DEFAULT_CURRENT_COMBO,
			sectionDetail: itemInfo.sectionDetail
		});
		dispatch({
			type: IS_ORDER_EDIT,
			isOrderEdit: true
		});
	};
}
function initEditOrderMode() {
	return (dispatch) => {
		dispatch({
			type: IS_ORDER_EDIT,
			isOrderEdit: false
		});
	};
}
function deleteAllById(data) {
	return (dispatch, getState) => {
		const { buyDiscountRule, isSkipPromotionCalculation } = getState().promotion;
		dispatch({
			type: DELETEALLBYID,
			data,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
	};
}
var setkeyboardToggle = (data) => ({
	type: SETKEYBOARDTOGGLE,
	data
});
var setSideNavIndex = (data) => ({
	type: SIDENAVINDEX,
	data
});
var setSideNavList = (data) => ({
	type: SIDENAVLISTINFO,
	data
});
var removeFootItemComboSection = (data) => ({
	type: REMOVEDIYCOMBO,
	data
});
var removeFootOptComboSection = (data) => ({
	type: REMOVEDIYOPTCOMBO,
	data
});
var clearFootItemComboSection = (data) => ({
	type: CLEARDIYCOMBO,
	data
});
function replaceItemOrder(tempItem, sequence) {
	return (dispatch, getState) => {
		const state = getState();
		if (!isStockSufficient({
			itemInfo: tempItem,
			addQty: tempItem.quantity || 1,
			itemList: state.currentOrder.itemList,
			menuItemList: state.menuItemList,
			excludeSequence: sequence,
			currentOrderCombo: state.currentOrderCombo,
			crm: state.crm,
			promotion: state.promotion
		})) {
			showInsufficientStockToast(void 0, tempItem, state.menuItemList);
			return false;
		}
		const orderSequence = state.orderSequence;
		const { buyDiscountRule, isSkipPromotionCalculation } = state.promotion;
		tempItem.sequence = orderSequence;
		if (!tempItem.remark || !tempItem.remark.optionName) tempItem.remark = {
			optionName: "",
			optionType: "NOTE",
			quantity: 1,
			price: 0
		};
		dispatch({
			type: REPLACE_TO_ORDER,
			data: {
				tempItem,
				sequence
			},
			buyDiscountRule,
			isSkipPromotionCalculation
		});
		dispatch({
			type: ORDER_SEQUENCE,
			increaseInterval: 1
		});
	};
}
function replaceComboOrder(comboObj, sequence) {
	return (dispatch, getState) => {
		const orderSequence = getState().orderSequence;
		const { buyDiscountRule, isSkipPromotionCalculation } = getState().promotion;
		comboObj.sequence = orderSequence;
		if (!comboObj.remark || !comboObj.remark.optionName) comboObj.remark = {
			optionName: "",
			optionType: "NOTE",
			quantity: 1,
			price: 0
		};
		dispatch({
			type: REPLACEORREDUCEOLDCOMBO,
			data: {
				comboObjInfo: comboObj,
				comboIdx: sequence
			},
			buyDiscountRule,
			isSkipPromotionCalculation
		});
		dispatch({
			type: ORDER_SEQUENCE,
			increaseInterval: 1
		});
	};
}
var setLanModal = (data) => ({
	type: SET_LANMODAL,
	data
});
var setNetWorkStatus = (data) => ({
	type: SET_NETWORKTATUS,
	data
});
var setLanModalFn = (data) => ({
	type: SET_LANMODALFN,
	data
});
var editOrderItemAction = (data) => {
	return (dispatch, getState) => {
		const state = getState();
		if (state.currentOrder.itemList.some((item) => item.sequence === data.deleteSequence && isMembershipCard(item))) return false;
		if (!data.isSub) {
			const item = state.currentOrder.itemList.find((orderItem) => orderItem.sequence === data.deleteSequence);
			if (item && !isStockSufficient({
				itemInfo: item,
				addQty: 1,
				itemList: state.currentOrder.itemList,
				menuItemList: state.menuItemList,
				currentOrderCombo: state.currentOrderCombo,
				crm: state.crm,
				promotion: state.promotion
			})) {
				showInsufficientStockToast(void 0, item, state.menuItemList);
				return false;
			}
		}
		const { buyDiscountRule, isSkipPromotionCalculation } = state.promotion;
		dispatch({
			type: EDIT_ORDER,
			data,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
		return true;
	};
};
function spliceOrderItemAction(data) {
	return (dispatch, getState) => {
		const state = getState();
		const { cloneItemList } = data;
		if (cloneItemList?.length) {
			const totalQty = cloneItemList.reduce((sum, item) => sum + (item.quantity || 0), 0);
			if (!isTotalQtyWithinStock({
				itemInfo: cloneItemList[0],
				totalQty,
				menuItemList: state.menuItemList,
				itemList: state.currentOrder.itemList,
				currentOrderCombo: state.currentOrderCombo,
				crm: state.crm,
				promotion: state.promotion
			})) {
				showInsufficientStockToast(void 0, cloneItemList[0], state.menuItemList);
				return false;
			}
		}
		const { buyDiscountRule, isSkipPromotionCalculation } = state.promotion;
		dispatch({
			type: SPLICE_ORDER,
			data,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
		return true;
	};
}
var addToComboSectionById = (data) => ({
	type: ADD_TO_SECTION_BYID,
	data
});
var removeOneOption = (data) => ({
	type: REMOVE_ONE_OPTIONS,
	data
});
var removeItemsOneOption = (data) => ({
	type: REMOVE_ONE_ITEMS,
	data
});
var spliceAllComboItems = (data) => ({
	type: SPLICE_ALL_ITEMS,
	data
});
var spliceSingleComboItems = (data) => ({
	type: SPLICE_SINGLE_ITEMS,
	data
});
var setEditComboQty = (data) => ({
	type: SETEDITCOMBOQTY,
	data
});
var setSelfConfig = (data) => ({
	type: SELF_CONFIG,
	data
});
function spliceOrderBySoldout(soldoutIds) {
	return (dispatch, getState) => {
		const state = getState();
		const { buyDiscountRule, buyGifts = [], isSkipPromotionCalculation } = state.promotion;
		const currentOrderItems = state.currentOrder?.itemList || [];
		const selectedFreeItem = state.crm?.selectedFreeItem || [];
		const tempCampaign = state.crm?.tempCampaign;
		const tempCampaignList = Array.isArray(tempCampaign) ? tempCampaign : tempCampaign ? [tempCampaign] : [];
		const soldoutItems = (soldoutIds || []).map((entry) => typeof entry === "object" ? entry : {
			id: entry,
			sequence: void 0
		});
		const isMatchedWithSoldout = (item) => soldoutItems.some((soldout) => {
			if (soldout?.sequence != null && item?.sequence != null) return String(item.sequence) === String(soldout.sequence) && String(item.id) === String(soldout.id);
			const soldoutId = soldout?.id;
			return soldoutId != null && String(item?.id) === String(soldoutId) || soldoutId != null && String(item?.oId) === String(soldoutId) || soldout?.cloudId && item?.cloudId === soldout.cloudId;
		});
		dispatch({
			type: SPLICEORDERBYSOLDOUT,
			data: soldoutIds,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
		const hasRemovedFreeInOrder = currentOrderItems.some((item) => item?.isFreeItem && isMatchedWithSoldout(item));
		const hasRemovedSelectedFree = selectedFreeItem.some(isMatchedWithSoldout);
		const hasRemovedTempCampaign = tempCampaignList.some(isMatchedWithSoldout);
		if (hasRemovedFreeInOrder || hasRemovedSelectedFree || hasRemovedTempCampaign) {
			dispatch(changeFreeItem([]));
			dispatch(setTempCampaign(null));
		}
		const nextBuyGifts = buyGifts.map((giftRule) => ({
			...giftRule,
			items: (giftRule?.items || []).filter((item) => !isMatchedWithSoldout(item))
		})).filter((giftRule) => giftRule.items.length > 0);
		if (nextBuyGifts.length !== buyGifts.length || nextBuyGifts.some((giftRule, index) => giftRule.items.length !== buyGifts[index]?.items?.length)) dispatch({
			type: SET_BUY_GIFTS,
			data: nextBuyGifts
		});
	};
}
function addCampaignItemsToOrder(items) {
	return (dispatch, getState) => {
		const { buyDiscountRule, isSkipPromotionCalculation } = getState().promotion;
		dispatch({
			type: ADD_CAMPAIGN_ITEMS_TO_ORDER,
			data: items,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
	};
}
function removeRewardItemFromList(campaignId) {
	return (dispatch, getState) => {
		const { buyDiscountRule, isSkipPromotionCalculation } = getState().promotion;
		dispatch({
			type: REMOVE_REWARD_ITEM_FROM_ORDER,
			campaignId,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
	};
}
function removeItemRewardInfoFromOrder() {
	return (dispatch, getState) => {
		const { buyDiscountRule, isSkipPromotionCalculation } = getState().promotion;
		dispatch({
			type: REMOVE_ITEM_REWARD_INFO,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
	};
}
function removeLocalPromotionRewardInfo() {
	return (dispatch, getState) => {
		const { buyDiscountRule, isSkipPromotionCalculation } = getState().promotion;
		dispatch({
			type: REMOVE_LOCAL_PROMOTION_REWARD_INFO,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
	};
}
var removeManualSelectRewardItemFromOrder = () => ({ type: REMOVE_MANUAL_SELECT_REWARD_ITEM });
var setIsReorderFlag = (data) => ({
	type: SETISREORDERFLAG,
	data
});
var setTabelServiceType = (data) => ({
	type: SETTABELSERVICETYPE,
	data
});
var setKioskConfigUserId = (data) => ({
	type: SETKIOSKCONFIGUSERID,
	data
});
var setMobyDeviceLinkStatus = (data) => ({
	type: MOBY_DEVICE_LINK_STATUS,
	data
});
var setMobyDeviceInfo = (data) => ({
	type: MOBY_DEVICE_INFO,
	data
});
var setTriposPayReady = (data) => ({
	type: TRIPOS_PAY_READY,
	data
});
var setTriposPayFinish = (data) => ({
	type: TRIPOS_PAY_FINISH,
	data
});
var setImg = (data) => ({
	type: SET_IMG,
	data
});
var setLogo = (data) => ({
	type: SET_LOGO,
	data
});
var setBanner = (data) => ({
	type: SET_BANNER,
	data
});
var setShowBanner = (data) => ({
	type: SET_SHOW_BANNER,
	data
});
var setBannerPro = (data) => ({
	type: SET_BANNERPRO,
	data
});
var setShowBannerPro = (data) => ({
	type: SET_SHOW_BANNERPRO,
	data
});
var setShowWaitingTimeModal = (data) => ({
	type: SET_SHOW_WAITING_TIME_MODAL,
	data
});
var setShowLoginGuideDialog = (data) => ({
	type: SET_SHOW_LOGINGUIDEDIALOG,
	data
});
var setShowScreensaver = (data) => ({
	type: SET_SCREENSAVER,
	data
});
var setTogoOption = (data) => ({
	type: SET_TOGO_OPTION,
	data
});
var clearTogoOption = () => ({ type: CLEAR_TOGO_OPTION });
var setCardPaidResult = (data) => ({
	type: SET_CARD_RESULT,
	data
});
var setGiftCardPaymentInfo = (data) => ({
	type: SET_GIFT_CARD_PAYMENT_INFO,
	data
});
var setConnectWs = (data) => ({
	type: PP_WS,
	data
});
var setIsMenuUpdated = (data) => ({
	type: ISMENUUPDATED,
	data
});
var setMakingCupNum = (data) => ({
	type: MAKINGCUPNUM,
	data
});
var setCateyPageDomTop = (data) => ({
	type: SETCATEYPAGEDOMTOP,
	data
});
var setorderPageDomTop = (data) => ({
	type: SETORDERPAGEDOMTOP,
	data
});
var setUpdateMenuLoad = (data) => ({
	type: MENULOAD,
	data
});
var setSelectedBrand = (data) => ({
	type: SELECTEDBRAND,
	data
});
var setBrandMenu = (data) => ({
	type: BRANDMENU,
	data
});
var setVListScroll = (data) => ({
	type: SETVLISTSCROLLHEIGHT,
	data
});
var changeSkipPromotionCalculationStatus = (data) => ({
	type: CHANGE_SKIP_PROMOTION_CALCULATION_STATUS,
	data
});
var recalculatePromotion = () => {
	return (dispatch, getState) => {
		dispatch({
			type: SET_BUY_GIFTS,
			data: []
		});
		const { buyDiscountRule, isSkipPromotionCalculation } = getState().promotion;
		dispatch({
			type: RECOUNT_CURRENT_ORDER_LIST,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
	};
};
var recountCurrentOrderList = () => {
	return (dispatch, getState) => {
		const { buyDiscountRule, isSkipPromotionCalculation } = getState().promotion;
		dispatch({
			type: RECOUNT_CURRENT_ORDER_LIST,
			buyDiscountRule,
			isSkipPromotionCalculation
		});
	};
};
var setCateDish = (data) => ({
	type: STANDARD_CATE_DISH,
	data
});
var setAllMenu = (data) => ({
	type: SET_ALL_MENU,
	data
});
var setLocator = (data) => ({
	type: SETLOCATOR,
	data
});
var setSequenceNumber = (data) => ({
	type: SET_ORDER_SEQUENCE,
	data
});
var setLicenseList = (data) => ({
	type: SYSTEM_LICENSE,
	data
});
var setTableId = (data) => ({
	type: SET_TABLE_ID,
	data
});
var setNumOfGuests = (numOfGuests) => ({
	type: SET_NUM_OF_GUESTS,
	numOfGuests
});
var removeFreeItemInOrder = (data) => ({
	type: REMOVE_FREE_ITEM_IN_ORDER,
	data
});
var changeCheckFooterVisible = (data) => ({
	type: CHANGE_CHECK_FOOTER_VISIBLE,
	data
});
var recordKioskDiscountPromotion = (data) => ({
	type: RECORD_KIOSK_DISCOUNT_PROMOTION,
	data
});
var setECardSettings = (data) => ({
	type: SET_ECARD_SETTINGS,
	data
});
var setECardQuickAmounts = (data) => ({
	type: SET_ECARD_QUICK_AMOUNTS,
	data
});
var setECardCloudGiftCardItem = (data) => ({
	type: SET_ECARD_CLOUD_GIFT_CARD_ITEM,
	data
});
var setSelectedECard = (data) => ({
	type: SET_SELECTED_ECARD,
	data
});
var fetchCloudGiftCardItem = () => async (dispatch) => {
	try {
		const cloudGiftCardItem = (await fetchAllMenu())?.data?.menus?.flatMap((menu) => menu?.menuGroups || [])?.find((group) => group?.name === "Cloud Gift Card")?.menuCategories?.[0]?.saleItems?.[0] || null;
		dispatch(setECardCloudGiftCardItem(cloudGiftCardItem));
		return {
			success: true,
			data: cloudGiftCardItem
		};
	} catch (error) {
		dispatch(setECardCloudGiftCardItem(null));
		return {
			success: false,
			error
		};
	}
};
var setAvailableECards = (data) => ({
	type: SET_AVAILABLE_ECARDS,
	data
});
var setECardLastQuery = (data) => ({
	type: SET_ECARD_LAST_QUERY,
	data
});
var setECardLoading = (data) => ({
	type: SET_ECARD_LOADING,
	data
});
var clearECardState = () => (dispatch) => {
	dispatch(setSelectedECard(null));
	dispatch(setAvailableECards([]));
	dispatch(setECardLastQuery(null));
	dispatch(setECardLoading(false));
};
var buildECardQueryParams = ({ cardSearchType, phoneNum, cardNum, emailAddress }) => {
	if (cardSearchType === "CARD_NUMBER") return { cardNumber: cardNum };
	if (cardSearchType === "PHONE_NUMBER") return { to: (phoneNum || "").replace(/[()\s-]/g, "") };
	if (cardSearchType === "EMAIL") return { to: emailAddress };
	return {};
};
var fetchAvailableECards = (queryInfo, options = {}) => async (dispatch) => {
	const { excludeCardNumber, preserveLastQuery = true } = options;
	const exactCardNumber = queryInfo?.cardSearchType === "CARD_NUMBER" ? String(queryInfo?.cardNum || "").trim() : "";
	if (preserveLastQuery) dispatch(setECardLastQuery(queryInfo));
	dispatch(setECardLoading(true));
	try {
		const availableCards = ((await searchECardCards(buildECardQueryParams(queryInfo)))?.data?.data || []).filter((card) => (Number(card?.balance) || 0) > 0 && (!exactCardNumber || String(card?.cardNumber || "").trim() === exactCardNumber) && (!excludeCardNumber || card?.cardNumber !== excludeCardNumber));
		dispatch(setAvailableECards(availableCards));
		return {
			success: true,
			cards: availableCards
		};
	} catch (error) {
		const errorMsg = error.response?.data?.message || error.message || "Query failed";
		dispatch(setAvailableECards([]));
		return {
			success: false,
			errorMsg
		};
	} finally {
		dispatch(setECardLoading(false));
	}
};
//#endregion
export { removeFreeItemInOrder as $, CRM_REWARD_RULE as $a, TRIPOS_PAY_READY as $c, floatNumberRounding as $i, setCRMMemberInfo as $n, RESET_ITEM_LIST as $o, checkIsItemPromotionValid as $r, SET_ITEM_MATCH_CLOUD_PROMOTION as $s, setNumOfGuests as $t, fetchCloudGiftCardItem as A, ADD_COMBO_TO_ORDER as Aa, SET_SELECTED_ECARD as Ac, require__baseIteratee as Ai, EMAIL as An, MOBY_DEVICE_LINK_STATUS as Ao, getOccupiedQtyByStockId as Ar, SET_CLOUD_PROMOTION_LIST as As, setECardLastQuery as At, initParams as B, CHANGE_DEFAULT_DISH as Ba, SET_THIRD_PARTY_COMMIT_ID as Bc, getOrderMemberPrices as Bi, resolveVoucherItemCampaign as Bn, REMOVE_FROM_SECTION as Bo, itemIsSubOptionSoldOut as Br, SET_CUSTOMER_NAME as Bs, setIsReorderFlag as Bt, currentCategoryList as C, require__defineProperty as Ca, SET_PICKUP_TIME as Cc, getExchangePurchaseDisplayPrices as Ci, spliceAllComboItems as Cn, ITEM_SIZE_LIST as Co, judgeConfigToSoldout as Cr, SET_BANNER as Cs, setBrandMenu as Ct, editDefaultDish as D, require__root as Da, SET_SATISFY_RULES as Dc, getItemDisplayPrice as Di, syncMenuStockNum as Dn, MENULOAD as Do, getSingleItemLanguageName as Dr, SET_BUY_GIFTS_RULES as Ds, setConnectWs as Dt, dispatchCurrentCategoryList as E, require__Symbol as Ea, SET_PROMO_CODE as Ec, getSatisfiedExchangePurchaseRules as Ei, spliceSingleComboItems as En, MARK_POST_PAYMENT_ACTION as Eo, lineBreakTransfer as Er, SET_BUY_GIFTS as Es, setCateyPageDomTop as Et, initConfigParams as F, APPEND_PAYMENT_TYPE_TRAIL as Fa, SET_SYSTEM_CONFIG as Fc, require__castPath as Fi, printECardInfo as Fn, RECORD_KIOSK_DISCOUNT_PROMOTION as Fo, isTotalQtyWithinStock as Fr, SET_CRM_CUSTOMER_INFO as Fs, setEditOrderMode as Ft, payByCash as G, CLEARDIYCOMBO as Ga, SPLICE_ALL_ITEMS as Gc, scopePromotionItemFilter as Gi, filterMenuGroupByLicense as Gn, REMOVE_MEMBERSHIP_CARD as Go, getOrderInfoObj as Gr, SET_ECARD_LAST_QUERY as Gs, setLang as Gt, markPostPaymentAction as H, CHANGE_POSTER_STATUS as Ha, SIDENAVINDEX as Hc, filterPromotionItems as Hi, getTemplateAction as Hn, REMOVE_ITEM_REWARD_INFO as Ho, itemIsUnavailable as Hr, SET_DOLLAR_PERCENTAGE_VOUCHERS as Hs, setKioskConfigUserId as Ht, initCurrentOrderCombo as I, BRANDMENU as Ia, SET_TABLE_ID as Ic, require_toString as Ii, removeGiftCard as In, RECOUNT_CURRENT_ORDER_LIST as Io, showInsufficientStockToast as Ir, SET_CRM_INTEGRATION_CUSTOMER_VOUCHERS as Is, setExpandFreeList as It, recordKioskDiscountPromotion as J, CLEAR_TOGO_OPTION as Ja, STANDARD_CATE_DISH as Jc, ITEM_SELECTION_PROMOTION_TYPES as Ji, changeLoginType as Jn, REMOVE_PROMOTION_DISCOUNT_ITEM as Jo, isHasCRMCampaignFn as Jr, SET_ECARD_SETTINGS as Js, setLogo as Jt, payByGiftCard as K, CLEAR_PAYMENT_TYPE_TRAIL as Ka, SPLICE_ORDER as Kc, ORDER_TYPE as Ki, changeFreeItem as Kn, REMOVE_ONE_ITEMS as Ko, safeBig as Kr, SET_ECARD_LOADING as Ks, setLicenseList as Kt, initEditOrderMode as L, CHANGE_CHECK_FOOTER_VISIBLE as La, SET_TAX_INFO as Lc, require__arrayMap as Li, saveGiftCardOrderBySoap as Ln, REMOVEDIYCOMBO as Lo, validateComboSubmitStock as Lr, SET_CRM_INTEGRATION_REWARD as Ls, setGiftCardPaymentInfo as Lt, getCurrentItem as M, ADD_TO_SECTION as Ma, SET_SHOW_BANNERPRO as Mc, require_get as Mi, PHONE_NUMBER as Mn, ORDER_SEQUENCE as Mo, getStockNumDisplayValue as Mr, SET_COMMIT_ID as Ms, setECardQuickAmounts as Mt, getMenuItemList as N, ADD_TO_SECTION_BYID as Na, SET_SHOW_LOGINGUIDEDIALOG as Nc, require__baseGet as Ni, STANDARD_TOP as Nn, ORDER_TYPE$1 as No, isInvalidStockNum as Nr, SET_CRM_AUTH_CODE_VERIFIED as Ns, setECardSettings as Nt, editOrderItemAction as O, ADD_CAMPAIGN_ITEMS_TO_ORDER as Oa, SET_SCREENSAVER as Oc, require_toInteger as Oi, updatePromotionDealsInMenuGroup as On, MENU_ITEM_LIST as Oo, getCartItemQtyByStockId as Or, SET_CARD_RESULT as Os, setCustomerName as Ot, initCompanyParams as P, ALL_SET_SYSTEM_CONFIG as Pa, SET_SHOW_WAITING_TIME_MODAL as Pc, require__toKey as Pi, getECardSettings as Pn, PP_WS as Po, isStockSufficient as Pr, SET_CRM_AUTH_CODE_VERIFIED_PHONE as Ps, setEditComboQty as Pt, removeFootOptComboSection as Q, CRM_PRIVILEGES as Qa, TRIPOS_PAY_FINISH as Qc, Big as Qi, setCRMAuthCodeVerifiedPhone as Qn, RESET_CURRENT_COMBO as Qo, checkIsGiftPromotionValid as Qr, SET_IS_PAUSE_AUTO_VALIDATE_PROMOTION as Qs, setNetWorkStatus as Qt, initMenuGroup2 as R, CHANGE_CLOUD_PROMOTION_STATUS as Ra, SET_TEMP_CAMPAIGN as Rc, require__baseIsEqual as Ri, searchECardCards as Rn, REMOVEDIYOPTCOMBO as Ro, getItemStoppedStatus as Rr, SET_CURRENT_BLOCK as Rs, setImg as Rt, clearTogoOption as S, require__baseAssignValue as Sa, SET_PAYMENT_MEMBER_POINTS_ESTIMATE as Sc, getExchangePurchaseDiscountedUnitPrice as Si, setorderPageDomTop as Sn, IS_SHOW_LOGIN_BAR as So, judgeCharge as Sr, SET_AVAILABLE_ECARDS as Ss, setBannerPro as St, deleteAllById as T, require__baseGetTag as Ta, SET_PROMOTION as Tc, getSatisfiedBuyGiftRules as Ti, spliceOrderItemAction as Tn, MAKINGCUPNUM as To, judgeNeedPayOtherCharge as Tr, SET_BUY_DISCOUNT_RULES as Ts, setCateDish as Tt, notes as U, CHANGE_REWARD_MODAL_VISIBLE as Ua, SIDENAVLISTINFO as Uc, getPromotionBenefitItems as Ui, isCampaignInTypes as Un, REMOVE_LOCAL_PROMOTION_REWARD_INFO as Uo, countAmount as Ur, SET_DOLLAR_VALUE_VOUCHERS as Us, setLanModal as Ut, initSystemStore as V, CHANGE_FREE_ITEM as Va, SET_TOGO_OPTION as Vc, hasActiveMemberPrivilege as Vi, getCampaignViaType as Vn, REMOVE_ITEM_FROM_ORDER as Vo, itemIsSubOptionUnavailable as Vr, SET_DISCOUNT as Vs, setItemPrice as Vt, payByCard as W, CHANGE_SKIP_PROMOTION_CALCULATION_STATUS as Wa, SPLICEORDERBYSOLDOUT as Wc, getSpecialPriceItems as Wi, getRewardItemByRules as Wn, REMOVE_MANUAL_SELECT_REWARD_ITEM as Wo, generateSubmitOrderObj as Wr, SET_ECARD_CLOUD_GIFT_CARD_ITEM as Ws, setLanModalFn as Wt, refreshMenuStockNumIfChanged as X, CRM_EARN_RULE as Xa, TEMP_CURRENT_CATEGORY as Xc, v4 as Xi, crm_action_exports as Xn, REPLACEORREDUCEOLDCOMBO as Xo, checkCRMStatus as Xr, SET_GIFT_CARD_PAYMENT_INFO as Xs, setMobyDeviceInfo as Xt, recountCurrentOrderList as Y, COMBO_MENU as Ya, SYSTEM_LICENSE as Yc, RECOMMEND_SUCCESS_TYPE as Yi, changeSelectedDiscount as Yn, REMOVE_REWARD_ITEM_FROM_ORDER as Yo, isHasPromotionFn as Yr, SET_EXCHANGE_PURCHASE_RULES as Ys, setMakingCupNum as Yt, removeFootItemComboSection as Z, CRM_MEMBER_INFO as Za, TEMP_ITEM_LIST as Zc, getItemPrice as Zi, setCRMAuthCodeVerified as Zn, REPLACE_TO_ORDER as Zo, checkIsFixedPriceSelectItems as Zr, SET_IMG as Zs, setMobyDeviceLinkStatus as Zt, clearFootItemComboSection as _, require_isArrayLike as _a, SET_ORDER_SEQUENCE as _c, rememberMemberActivityOrder as _i, setTriposPayFinish as _n, ISMENUUPDATED as _o, getMissingRequiredCategories as _r, SETTABELSERVICETYPE as _s, setActivityCurrentItem as _t, addItem2ComboSection as a, getStockItemId as aa, SET_LANMODALFN as ac, getGiftPromotionRewardItems as ai, setSelfConfig as an, CURRENT_SALE_ITEMS as ao, setPrivileges as ar, SAVE_TIP_AMOUNT as as, removeManualSelectRewardItemFromOrder as at, clearPostPaymentActions as b, require_isObjectLike as ba, SET_PAYMENT_ID as bc, handleResolveList as bi, setVListScroll as bn, IS_NEW_MEMBER as bo, judegOrderDishIsHasSoldout as br, SET_AESERT_LIST_STATUS as bs, setAvailableECards as bt, appendPaymentTypeTrail as c, findMembershipProduct as ca, SET_MEMBERSHIP as cc, makeUpSpecialPromotionAddOnItem as ci, setShowBannerPro as cn, EDIT_DEFAULT_DISH as co, attachCategoryOptionsToItem as cr, SELF_CONFIG as cs, removeSearchItem as ct, changeOrderType as d, require_cloneDeep as da, SET_NETWORKTATUS as dc, copyMemberActivityOrderContext as di, setShowWaitingTimeModal as dn, FETCH_LANGUAGE as do, getComboItemDetailInfo as dr, SETISREORDERFLAG as ds, resetCurrentOrder as dt, getCardColumnCount as ea, SET_ITEM_PRICE as ec, checkIsRuleDiscountInvalid as ei, setOrderStatus as en, CURRENT_CATEGORY as eo, setEarnRule as er, RESET_ORDER as es, removeItemFromComboSection as et, changePickupTime as f, require__baseClone as fa, SET_NUM_OF_GUESTS as fc, getMemberActivityItemsContext as fi, setSideNavIndex as fn, FETCH_MENUGROUP as fo, getComboSectionInfo as fr, SETKEYBOARDTOGGLE as fs, resetCurrentOrderCombo as ft, clearECardState as g, require_keys as ga, SET_ORDER_REWARD_ID as gc, hasStaleMemberActivity as gi, setTogoOption as gn, INIT_ORDER_SEQUENCE as go, getItemSizeName as gr, SETREQUIRECATEGORY as gs, searchItemHandler as gt, clearCurrentItem as h, require__arrayPush as ha, SET_ORDER_NOTES as hc, getMemberPricingContext as hi, setTableId as hn, IGNORE_REWARD as ho, getItemOptionName as hr, SETORDERPAGEDOMTOP as hs, saveTipAmount as ht, addComboOption as i, getOutOfStockItems as ia, SET_LANMODAL as ic, filterValidPromotionCenterList as ii, setSelectedECard as in, CURRENT_LANGUAGE as io, setOnboardGiftRule as ir, SAVE_PAYMENT_TYPE as is, removeLocalPromotionRewardInfo as it, getCurrentCategory as j, ADD_OPTION as ja, SET_SHOW_BANNER as jc, require_identity as ji, ITEM_HEIGHT as jn, ONBOARD_GIFT_RULE as jo, getRemainingStockNum as jr, SET_CLOUD_PROMOTION_METAS as js, setECardLoading as jt, fetchAvailableECards as k, ADD_COMBO_OPTION as ka, SET_SDK_META_DATA as kc, require_toNumber as ki, CARD_NUMBER as kn, MOBY_DEVICE_INFO as ko, getItemStockNum as kr, SET_CLOUD_PROMOTION as ks, setECardCloudGiftCardItem as kt, changeCheckFooterVisible as l, getOrderItemCategory as la, SET_MERCHANT_CAMPAIGN_LIST as lc, crmIntegrationSDK as li, setShowLoginGuideDialog as ln, EDIT_ORDER as lo, calcCardMinAmout as lr, SETCATEYPAGEDOMTOP as ls, replaceComboOrder as lt, clearCurrentCategory as m, require__getPrototype as ma, SET_ORDER_DISCOUNT as mc, getMemberCheckoutState as mi, setTabelServiceType as mn, FREE_ITEM_MENU_POSITION as mo, getDishItemLanguage as mr, SETLOCATOR as ms, savePaymentId as mt, addCampaignItemsToOrder as n, getLayoutScale as na, SET_ITEM_VOUCHERS as nc, checkItemPromotionStatus as ni, setPaymentMemberCardRecord as nn, CURRENT_COMBO as no, setIsMemberOrderedBefore as nr, SAVESEARCHITEM as ns, removeItemRewardInfoFromOrder as nt, addOption as o, isSameStockItem as oa, SET_LOGO as oc, isItemMatchedPromotionFilter as oi, setSequenceNumber as on, DEFAULT_CURRENT_COMBO as oo, setTempCampaign as or, SEARCH_KEY_WORD as os, removeOneOption as ot, changeSkipPromotionCalculationStatus as p, require__getAllKeysIn as pa, SET_ORDER_CUSTOMER as pc, getMemberActivityState as pi, setSideNavList as pn, FETCH_MERCHANT_PROFILE as po, getCurrentItemLanguage as pr, SETKIOSKCONFIGUSERID as ps, saveOrderResult as pt, recalculatePromotion as q, CLEAR_POST_PAYMENT_ACTIONS as qa, SPLICE_SINGLE_ITEMS as qc, GIFT_PROMOTION_TYPE as qi, changeIgnoreReward as qn, REMOVE_ONE_OPTIONS as qo, isGiftCardWithCreditCardOrder as qr, SET_ECARD_QUICK_AMOUNTS as qs, setLocator as qt, addCombo2Order as r, observeLayoutSize as ra, SET_KIOSK_MENU_TREE as rc, filterPromotionThresholdItems as ri, setSelectedBrand as rn, CURRENT_ITEM as ro, setMemberStatus as rr, SAVE_ORDER_RESULT as rs, removeItemsOneOption as rt, addToComboSectionById as s, buildMembershipCard as sa, SET_LOYALTY as sc, makeUpPromotionAddOnItem as si, setShowBanner as sn, DELETEALLBYID as so, allRangHandler as sr, SELECTEDBRAND as ss, removeRewardItemFromList as st, actions_exports as t, getCardColumnStyle as ta, SET_ITEM_VALID_PROMOTION as tc, checkIsRuleValid as ti, setOriginalItemList as tn, CURRENT_CATEGORY_LIST as to, setFreeItemMenuPosition as tr, RESET_PROMOTION as ts, removeItemFromOrder as tt, changeDefaultDish as u, isMembershipCard as ua, SET_NEED_COMMIT as uc, canUseMemberPrice as ui, setShowScreensaver as un, EXPEND_FREELIST as uo, calcColNum as ur, SETEDITCOMBOQTY as us, replaceItemOrder as ut, clearPayType as v, require_isArray as va, SET_ORDER_STATUS as vc, getRewardDiscountByRules as vi, setTriposPayReady as vn, IS_AUTHORIZATION_DISPLAY_NAME as vo, getOneUncompletedSection as vr, SETVLISTSCROLLHEIGHT as vs, setAllMenu as vt, customer as w, require_isObject as wa, SET_POSTER_DATA as wc, getPromotionModalDisplayPrice as wi, spliceOrderBySoldout as wn, LOGIN_TYPE as wo, judgeHasDetailInfo as wr, SET_BANNERPRO as ws, setCardPaidResult as wt, clearSearchKeyWord as x, require__copyObject as xa, SET_PAYMENT_MEMBER_CARD_RECORD as xc, applyExchangePurchaseDiscount as xi, setkeyboardToggle as xn, IS_ORDER_EDIT as xo, judegStepIsHasMustDish as xr, SET_ALL_MENU as xs, setBanner as xt, clearPaymentTypeTrail as y, require_isArguments as ya, SET_ORIGINAL_ITEM_LIST as yc, checkCRMType as yi, setUpdateMenuLoad as yn, IS_MEMBER_ORDERED_BEFORE as yo, judegIsComboStatusAndIsPreSelected as yr, SET_AD_OUTLET_INFO as ys, setAuthorizationDisplayName as yt, initMenuGroupList as z, CHANGE_CRM_PROMOTION_CONTRARY_INFO as za, SET_TEMP_FREE_ITEM as zc, getItemActualPrices as zi, resolveRewardItemCampaign as zn, REMOVE_FREE_ITEM_IN_ORDER as zo, itemIsSoldOut as zr, SET_CURRENT_PAGE as zs, setIsMenuUpdated as zt };
