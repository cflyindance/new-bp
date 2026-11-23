import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { d as useSelector, l as _extends, u as init_extends } from "./es-CFYDnMm2.js";
import { a as init_inheritsLoose, i as _inheritsLoose } from "./tiny-warning.esm-Cf7nlwXj.js";
import { t as native_i18n_default } from "./native-i18n-Bya1piKW.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { g as init_assertThisInitialized, h as _assertThisInitialized } from "./objectWithoutProperties-DDcNLcsK.js";
import { n as getPromotionCenterActivityRuleText, t as getPromotionActivityDisplayText } from "./getPromotionCenterDisplayText-Bfjuriuq.js";
import { c as isCommercialPromotionTagVisible, i as getIndexedItemPromotions, l as isDishTagHeightBearing, n as filterVisibleDishTags } from "./getItemCardProperties-CHuqwFqK.js";
import "./getImageHost-CiGAQi_-.js";
//#region node_modules/memoize-one/dist/memoize-one.esm.js
init_extends();
init_inheritsLoose();
init_assertThisInitialized();
var safeIsNaN = Number.isNaN || function ponyfill(value) {
	return typeof value === "number" && value !== value;
};
function isEqual(first, second) {
	if (first === second) return true;
	if (safeIsNaN(first) && safeIsNaN(second)) return true;
	return false;
}
function areInputsEqual(newInputs, lastInputs) {
	if (newInputs.length !== lastInputs.length) return false;
	for (var i = 0; i < newInputs.length; i++) if (!isEqual(newInputs[i], lastInputs[i])) return false;
	return true;
}
function memoizeOne(resultFn, isEqual) {
	if (isEqual === void 0) isEqual = areInputsEqual;
	var lastThis;
	var lastArgs = [];
	var lastResult;
	var calledOnce = false;
	function memoized() {
		var newArgs = [];
		for (var _i = 0; _i < arguments.length; _i++) newArgs[_i] = arguments[_i];
		if (calledOnce && lastThis === this && isEqual(newArgs, lastArgs)) return lastResult;
		lastResult = resultFn.apply(this, newArgs);
		calledOnce = true;
		lastThis = this;
		lastArgs = newArgs;
		return lastResult;
	}
	return memoized;
}
//#endregion
//#region node_modules/react-window/dist/index.esm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var now = typeof performance === "object" && typeof performance.now === "function" ? function() {
	return performance.now();
} : function() {
	return Date.now();
};
function cancelTimeout(timeoutID) {
	cancelAnimationFrame(timeoutID.id);
}
function requestTimeout(callback, delay) {
	var start = now();
	function tick() {
		if (now() - start >= delay) callback.call(null);
		else timeoutID.id = requestAnimationFrame(tick);
	}
	var timeoutID = { id: requestAnimationFrame(tick) };
	return timeoutID;
}
var size = -1;
function getScrollbarSize(recalculate) {
	if (recalculate === void 0) recalculate = false;
	if (size === -1 || recalculate) {
		var div = document.createElement("div");
		var style = div.style;
		style.width = "50px";
		style.height = "50px";
		style.overflow = "scroll";
		document.body.appendChild(div);
		size = div.offsetWidth - div.clientWidth;
		document.body.removeChild(div);
	}
	return size;
}
var cachedRTLResult = null;
function getRTLOffsetType(recalculate) {
	if (recalculate === void 0) recalculate = false;
	if (cachedRTLResult === null || recalculate) {
		var outerDiv = document.createElement("div");
		var outerStyle = outerDiv.style;
		outerStyle.width = "50px";
		outerStyle.height = "50px";
		outerStyle.overflow = "scroll";
		outerStyle.direction = "rtl";
		var innerDiv = document.createElement("div");
		var innerStyle = innerDiv.style;
		innerStyle.width = "100px";
		innerStyle.height = "100px";
		outerDiv.appendChild(innerDiv);
		document.body.appendChild(outerDiv);
		if (outerDiv.scrollLeft > 0) cachedRTLResult = "positive-descending";
		else {
			outerDiv.scrollLeft = 1;
			if (outerDiv.scrollLeft === 0) cachedRTLResult = "negative";
			else cachedRTLResult = "positive-ascending";
		}
		document.body.removeChild(outerDiv);
		return cachedRTLResult;
	}
	return cachedRTLResult;
}
if (typeof window !== "undefined" && typeof window.WeakSet !== "undefined") {}
var IS_SCROLLING_DEBOUNCE_INTERVAL$1 = 150;
var defaultItemKey$1 = function defaultItemKey(index, data) {
	return index;
};
var devWarningsDirection = null;
var devWarningsTagName$1 = null;
if (typeof window !== "undefined" && typeof window.WeakSet !== "undefined") {
	devWarningsDirection = /*#__PURE__*/ new WeakSet();
	devWarningsTagName$1 = /*#__PURE__*/ new WeakSet();
}
function createListComponent(_ref) {
	var _class;
	var getItemOffset = _ref.getItemOffset, getEstimatedTotalSize = _ref.getEstimatedTotalSize, getItemSize = _ref.getItemSize, getOffsetForIndexAndAlignment = _ref.getOffsetForIndexAndAlignment, getStartIndexForOffset = _ref.getStartIndexForOffset, getStopIndexForStartIndex = _ref.getStopIndexForStartIndex, initInstanceProps = _ref.initInstanceProps, shouldResetStyleCacheOnItemSizeChange = _ref.shouldResetStyleCacheOnItemSizeChange, validateProps = _ref.validateProps;
	return _class = /*#__PURE__*/ function(_PureComponent) {
		_inheritsLoose(List, _PureComponent);
		function List(props) {
			var _this = _PureComponent.call(this, props) || this;
			_this._instanceProps = initInstanceProps(_this.props, _assertThisInitialized(_this));
			_this._outerRef = void 0;
			_this._resetIsScrollingTimeoutId = null;
			_this.state = {
				instance: _assertThisInitialized(_this),
				isScrolling: false,
				scrollDirection: "forward",
				scrollOffset: typeof _this.props.initialScrollOffset === "number" ? _this.props.initialScrollOffset : 0,
				scrollUpdateWasRequested: false
			};
			_this._callOnItemsRendered = void 0;
			_this._callOnItemsRendered = memoizeOne(function(overscanStartIndex, overscanStopIndex, visibleStartIndex, visibleStopIndex) {
				return _this.props.onItemsRendered({
					overscanStartIndex,
					overscanStopIndex,
					visibleStartIndex,
					visibleStopIndex
				});
			});
			_this._callOnScroll = void 0;
			_this._callOnScroll = memoizeOne(function(scrollDirection, scrollOffset, scrollUpdateWasRequested) {
				return _this.props.onScroll({
					scrollDirection,
					scrollOffset,
					scrollUpdateWasRequested
				});
			});
			_this._getItemStyle = void 0;
			_this._getItemStyle = function(index) {
				var _this$props = _this.props, direction = _this$props.direction, itemSize = _this$props.itemSize, layout = _this$props.layout;
				var itemStyleCache = _this._getItemStyleCache(shouldResetStyleCacheOnItemSizeChange && itemSize, shouldResetStyleCacheOnItemSizeChange && layout, shouldResetStyleCacheOnItemSizeChange && direction);
				var style;
				if (itemStyleCache.hasOwnProperty(index)) style = itemStyleCache[index];
				else {
					var _offset = getItemOffset(_this.props, index, _this._instanceProps);
					var size = getItemSize(_this.props, index, _this._instanceProps);
					var isHorizontal = direction === "horizontal" || layout === "horizontal";
					var isRtl = direction === "rtl";
					var offsetHorizontal = isHorizontal ? _offset : 0;
					itemStyleCache[index] = style = {
						position: "absolute",
						left: isRtl ? void 0 : offsetHorizontal,
						right: isRtl ? offsetHorizontal : void 0,
						top: !isHorizontal ? _offset : 0,
						height: !isHorizontal ? size : "100%",
						width: isHorizontal ? size : "100%"
					};
				}
				return style;
			};
			_this._getItemStyleCache = void 0;
			_this._getItemStyleCache = memoizeOne(function(_, __, ___) {
				return {};
			});
			_this._onScrollHorizontal = function(event) {
				var _event$currentTarget = event.currentTarget, clientWidth = _event$currentTarget.clientWidth, scrollLeft = _event$currentTarget.scrollLeft, scrollWidth = _event$currentTarget.scrollWidth;
				_this.setState(function(prevState) {
					if (prevState.scrollOffset === scrollLeft) return null;
					var direction = _this.props.direction;
					var scrollOffset = scrollLeft;
					if (direction === "rtl") switch (getRTLOffsetType()) {
						case "negative":
							scrollOffset = -scrollLeft;
							break;
						case "positive-descending":
							scrollOffset = scrollWidth - clientWidth - scrollLeft;
							break;
					}
					scrollOffset = Math.max(0, Math.min(scrollOffset, scrollWidth - clientWidth));
					return {
						isScrolling: true,
						scrollDirection: prevState.scrollOffset < scrollOffset ? "forward" : "backward",
						scrollOffset,
						scrollUpdateWasRequested: false
					};
				}, _this._resetIsScrollingDebounced);
			};
			_this._onScrollVertical = function(event) {
				var _event$currentTarget2 = event.currentTarget, clientHeight = _event$currentTarget2.clientHeight, scrollHeight = _event$currentTarget2.scrollHeight, scrollTop = _event$currentTarget2.scrollTop;
				_this.setState(function(prevState) {
					if (prevState.scrollOffset === scrollTop) return null;
					var scrollOffset = Math.max(0, Math.min(scrollTop, scrollHeight - clientHeight));
					return {
						isScrolling: true,
						scrollDirection: prevState.scrollOffset < scrollOffset ? "forward" : "backward",
						scrollOffset,
						scrollUpdateWasRequested: false
					};
				}, _this._resetIsScrollingDebounced);
			};
			_this._outerRefSetter = function(ref) {
				var outerRef = _this.props.outerRef;
				_this._outerRef = ref;
				if (typeof outerRef === "function") outerRef(ref);
				else if (outerRef != null && typeof outerRef === "object" && outerRef.hasOwnProperty("current")) outerRef.current = ref;
			};
			_this._resetIsScrollingDebounced = function() {
				if (_this._resetIsScrollingTimeoutId !== null) cancelTimeout(_this._resetIsScrollingTimeoutId);
				_this._resetIsScrollingTimeoutId = requestTimeout(_this._resetIsScrolling, IS_SCROLLING_DEBOUNCE_INTERVAL$1);
			};
			_this._resetIsScrolling = function() {
				_this._resetIsScrollingTimeoutId = null;
				_this.setState({ isScrolling: false }, function() {
					_this._getItemStyleCache(-1, null);
				});
			};
			return _this;
		}
		List.getDerivedStateFromProps = function getDerivedStateFromProps(nextProps, prevState) {
			validateSharedProps$1(nextProps, prevState);
			validateProps(nextProps);
			return null;
		};
		var _proto = List.prototype;
		_proto.scrollTo = function scrollTo(scrollOffset) {
			scrollOffset = Math.max(0, scrollOffset);
			this.setState(function(prevState) {
				if (prevState.scrollOffset === scrollOffset) return null;
				return {
					scrollDirection: prevState.scrollOffset < scrollOffset ? "forward" : "backward",
					scrollOffset,
					scrollUpdateWasRequested: true
				};
			}, this._resetIsScrollingDebounced);
		};
		_proto.scrollToItem = function scrollToItem(index, align) {
			if (align === void 0) align = "auto";
			var _this$props2 = this.props, itemCount = _this$props2.itemCount, layout = _this$props2.layout;
			var scrollOffset = this.state.scrollOffset;
			index = Math.max(0, Math.min(index, itemCount - 1));
			var scrollbarSize = 0;
			if (this._outerRef) {
				var outerRef = this._outerRef;
				if (layout === "vertical") scrollbarSize = outerRef.scrollWidth > outerRef.clientWidth ? getScrollbarSize() : 0;
				else scrollbarSize = outerRef.scrollHeight > outerRef.clientHeight ? getScrollbarSize() : 0;
			}
			this.scrollTo(getOffsetForIndexAndAlignment(this.props, index, align, scrollOffset, this._instanceProps, scrollbarSize));
		};
		_proto.componentDidMount = function componentDidMount() {
			var _this$props3 = this.props, direction = _this$props3.direction, initialScrollOffset = _this$props3.initialScrollOffset, layout = _this$props3.layout;
			if (typeof initialScrollOffset === "number" && this._outerRef != null) {
				var outerRef = this._outerRef;
				if (direction === "horizontal" || layout === "horizontal") outerRef.scrollLeft = initialScrollOffset;
				else outerRef.scrollTop = initialScrollOffset;
			}
			this._callPropsCallbacks();
		};
		_proto.componentDidUpdate = function componentDidUpdate() {
			var _this$props4 = this.props, direction = _this$props4.direction, layout = _this$props4.layout;
			var _this$state = this.state, scrollOffset = _this$state.scrollOffset;
			if (_this$state.scrollUpdateWasRequested && this._outerRef != null) {
				var outerRef = this._outerRef;
				if (direction === "horizontal" || layout === "horizontal") if (direction === "rtl") switch (getRTLOffsetType()) {
					case "negative":
						outerRef.scrollLeft = -scrollOffset;
						break;
					case "positive-ascending":
						outerRef.scrollLeft = scrollOffset;
						break;
					default:
						var clientWidth = outerRef.clientWidth;
						outerRef.scrollLeft = outerRef.scrollWidth - clientWidth - scrollOffset;
						break;
				}
				else outerRef.scrollLeft = scrollOffset;
				else outerRef.scrollTop = scrollOffset;
			}
			this._callPropsCallbacks();
		};
		_proto.componentWillUnmount = function componentWillUnmount() {
			if (this._resetIsScrollingTimeoutId !== null) cancelTimeout(this._resetIsScrollingTimeoutId);
		};
		_proto.render = function render() {
			var _this$props5 = this.props, children = _this$props5.children, className = _this$props5.className, direction = _this$props5.direction, height = _this$props5.height, innerRef = _this$props5.innerRef, innerElementType = _this$props5.innerElementType, innerTagName = _this$props5.innerTagName, itemCount = _this$props5.itemCount, itemData = _this$props5.itemData, _this$props5$itemKey = _this$props5.itemKey, itemKey = _this$props5$itemKey === void 0 ? defaultItemKey$1 : _this$props5$itemKey, layout = _this$props5.layout, outerElementType = _this$props5.outerElementType, outerTagName = _this$props5.outerTagName, style = _this$props5.style, useIsScrolling = _this$props5.useIsScrolling, width = _this$props5.width;
			var isScrolling = this.state.isScrolling;
			var isHorizontal = direction === "horizontal" || layout === "horizontal";
			var onScroll = isHorizontal ? this._onScrollHorizontal : this._onScrollVertical;
			var _this$_getRangeToRend = this._getRangeToRender(), startIndex = _this$_getRangeToRend[0], stopIndex = _this$_getRangeToRend[1];
			var items = [];
			if (itemCount > 0) for (var _index = startIndex; _index <= stopIndex; _index++) items.push((0, import_react.createElement)(children, {
				data: itemData,
				key: itemKey(_index, itemData),
				index: _index,
				isScrolling: useIsScrolling ? isScrolling : void 0,
				style: this._getItemStyle(_index)
			}));
			var estimatedTotalSize = getEstimatedTotalSize(this.props, this._instanceProps);
			return (0, import_react.createElement)(outerElementType || outerTagName || "div", {
				className,
				onScroll,
				ref: this._outerRefSetter,
				style: _extends({
					position: "relative",
					height,
					width,
					overflow: "auto",
					WebkitOverflowScrolling: "touch",
					willChange: "transform",
					direction
				}, style)
			}, (0, import_react.createElement)(innerElementType || innerTagName || "div", {
				children: items,
				ref: innerRef,
				style: {
					height: isHorizontal ? "100%" : estimatedTotalSize,
					pointerEvents: isScrolling ? "none" : void 0,
					width: isHorizontal ? estimatedTotalSize : "100%"
				}
			}));
		};
		_proto._callPropsCallbacks = function _callPropsCallbacks() {
			if (typeof this.props.onItemsRendered === "function") {
				if (this.props.itemCount > 0) {
					var _this$_getRangeToRend2 = this._getRangeToRender(), _overscanStartIndex = _this$_getRangeToRend2[0], _overscanStopIndex = _this$_getRangeToRend2[1], _visibleStartIndex = _this$_getRangeToRend2[2], _visibleStopIndex = _this$_getRangeToRend2[3];
					this._callOnItemsRendered(_overscanStartIndex, _overscanStopIndex, _visibleStartIndex, _visibleStopIndex);
				}
			}
			if (typeof this.props.onScroll === "function") {
				var _this$state2 = this.state, _scrollDirection = _this$state2.scrollDirection, _scrollOffset = _this$state2.scrollOffset, _scrollUpdateWasRequested = _this$state2.scrollUpdateWasRequested;
				this._callOnScroll(_scrollDirection, _scrollOffset, _scrollUpdateWasRequested);
			}
		};
		_proto._getRangeToRender = function _getRangeToRender() {
			var _this$props6 = this.props, itemCount = _this$props6.itemCount, overscanCount = _this$props6.overscanCount;
			var _this$state3 = this.state, isScrolling = _this$state3.isScrolling, scrollDirection = _this$state3.scrollDirection, scrollOffset = _this$state3.scrollOffset;
			if (itemCount === 0) return [
				0,
				0,
				0,
				0
			];
			var startIndex = getStartIndexForOffset(this.props, scrollOffset, this._instanceProps);
			var stopIndex = getStopIndexForStartIndex(this.props, startIndex, scrollOffset, this._instanceProps);
			var overscanBackward = !isScrolling || scrollDirection === "backward" ? Math.max(1, overscanCount) : 1;
			var overscanForward = !isScrolling || scrollDirection === "forward" ? Math.max(1, overscanCount) : 1;
			return [
				Math.max(0, startIndex - overscanBackward),
				Math.max(0, Math.min(itemCount - 1, stopIndex + overscanForward)),
				startIndex,
				stopIndex
			];
		};
		return List;
	}(import_react.PureComponent), _class.defaultProps = {
		direction: "ltr",
		itemData: void 0,
		layout: "vertical",
		overscanCount: 2,
		useIsScrolling: false
	}, _class;
}
var validateSharedProps$1 = function validateSharedProps(_ref2, _ref3) {
	var children = _ref2.children, direction = _ref2.direction, height = _ref2.height, layout = _ref2.layout, innerTagName = _ref2.innerTagName, outerTagName = _ref2.outerTagName, width = _ref2.width;
	var instance = _ref3.instance;
	if (innerTagName != null || outerTagName != null) {
		if (devWarningsTagName$1 && !devWarningsTagName$1.has(instance)) {
			devWarningsTagName$1.add(instance);
			console.warn("The innerTagName and outerTagName props have been deprecated. Please use the innerElementType and outerElementType props instead.");
		}
	}
	var isHorizontal = direction === "horizontal" || layout === "horizontal";
	switch (direction) {
		case "horizontal":
		case "vertical":
			if (devWarningsDirection && !devWarningsDirection.has(instance)) {
				devWarningsDirection.add(instance);
				console.warn("The direction prop should be either \"ltr\" (default) or \"rtl\". Please use the layout prop to specify \"vertical\" (default) or \"horizontal\" orientation.");
			}
			break;
		case "ltr":
		case "rtl": break;
		default: throw Error("An invalid \"direction\" prop has been specified. Value should be either \"ltr\" or \"rtl\". " + ("\"" + direction + "\" was specified."));
	}
	switch (layout) {
		case "horizontal":
		case "vertical": break;
		default: throw Error("An invalid \"layout\" prop has been specified. Value should be either \"horizontal\" or \"vertical\". " + ("\"" + layout + "\" was specified."));
	}
	if (children == null) throw Error("An invalid \"children\" prop has been specified. Value should be a React component. " + ("\"" + (children === null ? "null" : typeof children) + "\" was specified."));
	if (isHorizontal && typeof width !== "number") throw Error("An invalid \"width\" prop has been specified. Horizontal lists must specify a number for width. " + ("\"" + (width === null ? "null" : typeof width) + "\" was specified."));
	else if (!isHorizontal && typeof height !== "number") throw Error("An invalid \"height\" prop has been specified. Vertical lists must specify a number for height. " + ("\"" + (height === null ? "null" : typeof height) + "\" was specified."));
};
var DEFAULT_ESTIMATED_ITEM_SIZE$1 = 50;
var getItemMetadata$1 = function getItemMetadata(props, index, instanceProps) {
	var itemSize = props.itemSize;
	var itemMetadataMap = instanceProps.itemMetadataMap, lastMeasuredIndex = instanceProps.lastMeasuredIndex;
	if (index > lastMeasuredIndex) {
		var offset = 0;
		if (lastMeasuredIndex >= 0) {
			var itemMetadata = itemMetadataMap[lastMeasuredIndex];
			offset = itemMetadata.offset + itemMetadata.size;
		}
		for (var i = lastMeasuredIndex + 1; i <= index; i++) {
			var size = itemSize(i);
			itemMetadataMap[i] = {
				offset,
				size
			};
			offset += size;
		}
		instanceProps.lastMeasuredIndex = index;
	}
	return itemMetadataMap[index];
};
var findNearestItem$1 = function findNearestItem(props, instanceProps, offset) {
	var itemMetadataMap = instanceProps.itemMetadataMap, lastMeasuredIndex = instanceProps.lastMeasuredIndex;
	if ((lastMeasuredIndex > 0 ? itemMetadataMap[lastMeasuredIndex].offset : 0) >= offset) return findNearestItemBinarySearch$1(props, instanceProps, lastMeasuredIndex, 0, offset);
	else return findNearestItemExponentialSearch$1(props, instanceProps, Math.max(0, lastMeasuredIndex), offset);
};
var findNearestItemBinarySearch$1 = function findNearestItemBinarySearch(props, instanceProps, high, low, offset) {
	while (low <= high) {
		var middle = low + Math.floor((high - low) / 2);
		var currentOffset = getItemMetadata$1(props, middle, instanceProps).offset;
		if (currentOffset === offset) return middle;
		else if (currentOffset < offset) low = middle + 1;
		else if (currentOffset > offset) high = middle - 1;
	}
	if (low > 0) return low - 1;
	else return 0;
};
var findNearestItemExponentialSearch$1 = function findNearestItemExponentialSearch(props, instanceProps, index, offset) {
	var itemCount = props.itemCount;
	var interval = 1;
	while (index < itemCount && getItemMetadata$1(props, index, instanceProps).offset < offset) {
		index += interval;
		interval *= 2;
	}
	return findNearestItemBinarySearch$1(props, instanceProps, Math.min(index, itemCount - 1), Math.floor(index / 2), offset);
};
var getEstimatedTotalSize = function getEstimatedTotalSize(_ref2, _ref3) {
	var itemCount = _ref2.itemCount;
	var itemMetadataMap = _ref3.itemMetadataMap, estimatedItemSize = _ref3.estimatedItemSize, lastMeasuredIndex = _ref3.lastMeasuredIndex;
	var totalSizeOfMeasuredItems = 0;
	if (lastMeasuredIndex >= itemCount) lastMeasuredIndex = itemCount - 1;
	if (lastMeasuredIndex >= 0) {
		var itemMetadata = itemMetadataMap[lastMeasuredIndex];
		totalSizeOfMeasuredItems = itemMetadata.offset + itemMetadata.size;
	}
	var totalSizeOfUnmeasuredItems = (itemCount - lastMeasuredIndex - 1) * estimatedItemSize;
	return totalSizeOfMeasuredItems + totalSizeOfUnmeasuredItems;
};
var VariableSizeList = /*#__PURE__*/ createListComponent({
	getItemOffset: function getItemOffset(props, index, instanceProps) {
		return getItemMetadata$1(props, index, instanceProps).offset;
	},
	getItemSize: function getItemSize(props, index, instanceProps) {
		return instanceProps.itemMetadataMap[index].size;
	},
	getEstimatedTotalSize,
	getOffsetForIndexAndAlignment: function getOffsetForIndexAndAlignment(props, index, align, scrollOffset, instanceProps, scrollbarSize) {
		var direction = props.direction, height = props.height, layout = props.layout, width = props.width;
		var size = direction === "horizontal" || layout === "horizontal" ? width : height;
		var itemMetadata = getItemMetadata$1(props, index, instanceProps);
		var estimatedTotalSize = getEstimatedTotalSize(props, instanceProps);
		var maxOffset = Math.max(0, Math.min(estimatedTotalSize - size, itemMetadata.offset));
		var minOffset = Math.max(0, itemMetadata.offset - size + itemMetadata.size + scrollbarSize);
		if (align === "smart") if (scrollOffset >= minOffset - size && scrollOffset <= maxOffset + size) align = "auto";
		else align = "center";
		switch (align) {
			case "start": return maxOffset;
			case "end": return minOffset;
			case "center": return Math.round(minOffset + (maxOffset - minOffset) / 2);
			default: if (scrollOffset >= minOffset && scrollOffset <= maxOffset) return scrollOffset;
			else if (scrollOffset < minOffset) return minOffset;
			else return maxOffset;
		}
	},
	getStartIndexForOffset: function getStartIndexForOffset(props, offset, instanceProps) {
		return findNearestItem$1(props, instanceProps, offset);
	},
	getStopIndexForStartIndex: function getStopIndexForStartIndex(props, startIndex, scrollOffset, instanceProps) {
		var direction = props.direction, height = props.height, itemCount = props.itemCount, layout = props.layout, width = props.width;
		var size = direction === "horizontal" || layout === "horizontal" ? width : height;
		var itemMetadata = getItemMetadata$1(props, startIndex, instanceProps);
		var maxOffset = scrollOffset + size;
		var offset = itemMetadata.offset + itemMetadata.size;
		var stopIndex = startIndex;
		while (stopIndex < itemCount - 1 && offset < maxOffset) {
			stopIndex++;
			offset += getItemMetadata$1(props, stopIndex, instanceProps).size;
		}
		return stopIndex;
	},
	initInstanceProps: function initInstanceProps(props, instance) {
		var instanceProps = {
			itemMetadataMap: {},
			estimatedItemSize: props.estimatedItemSize || DEFAULT_ESTIMATED_ITEM_SIZE$1,
			lastMeasuredIndex: -1
		};
		instance.resetAfterIndex = function(index, shouldForceUpdate) {
			if (shouldForceUpdate === void 0) shouldForceUpdate = true;
			instanceProps.lastMeasuredIndex = Math.min(instanceProps.lastMeasuredIndex, index - 1);
			instance._getItemStyleCache(-1);
			if (shouldForceUpdate) instance.forceUpdate();
		};
		return instanceProps;
	},
	shouldResetStyleCacheOnItemSizeChange: false,
	validateProps: function validateProps(_ref5) {
		var itemSize = _ref5.itemSize;
		if (typeof itemSize !== "function") throw Error("An invalid \"itemSize\" prop has been specified. Value should be a function. " + ("\"" + (itemSize === null ? "null" : typeof itemSize) + "\" was specified."));
	}
});
var textTag_module_default = { textTag: "textTag___HcxVH" };
//#endregion
//#region source-snapshot/src/component/DishTag/textTag.js
var import_jsx_runtime = require_jsx_runtime();
var TextTag = (props) => {
	const { tagInfo, textTagStyle } = props;
	const { t } = useTranslation();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: textTag_module_default.textTag,
		style: {
			backgroundColor: tagInfo.labelBgColor,
			color: tagInfo.labelTextColor,
			...textTagStyle
		},
		children: t(tagInfo.name)
	});
};
//#endregion
//#region source-snapshot/src/assets/images/recommend.png
var recommend_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAANlBMVEUAAAD3gAz6ggz3gAj5ggz6gQz6gQv4gAv3gAzvgBD5gQv5gQz5gA35gAv4gAv5gQz6gAv5gQzhc212AAAAEXRSTlMAgL8gr49vYEAQ3+9Qn3DPMEsaom4AAACfSURBVDjLzdPJDsMwCEVRbDwPafn/n+2EEqlyyts1d30WCARdqc2HjLgoz3w1Xe3yKpqQ5RNbsCiMKPQoDBYcCqcFk8JkwaCwgCNKdHtjsX1usqjxF6u5y7KmgIP3mcjLaeM4ryOS87JuBITOhncUEghvKJwoTCgsKKwgbATCicKEwoFCBmEnEAYUOtKSAfn4qJ9woz2O4f0zqyLT33sAzMYwMIcwijsAAAAASUVORK5CYII=";
//#endregion
//#region source-snapshot/src/assets/images/spicy.png
var spicy_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAAkFBMVEUAAADnIxDmJBDnIxDnIxDnIBAApUYAp0nfIBAApkoAp0nnJBDnJBDnJBDkJRAAp0gApkrmIxAAn0MAn0AAn0sAnkIAnkEApEXlJBDnJBAAnkLoJBAAp0kAp0oZmUQAp0oAnUIAnkDnJBAAp0oEnkPYLBStRR4dl0M5hjtzZS2QVSZlbjFlbjCCXSm7PRvKNBfj9moIAAAAInRSTlMA3++fXyBA3xDvv7+AQDAggFAwIBDvv4+Ab9/Px5+PYGBfKaa41gAAAO9JREFUOMu90MlygzAQBNABSexgsB0v2TNIbM7y/38XyjFwSjMnd5Vur1ozQ/fNbiuED3YncnsrhFtrSZQPe5DBo32XwcOjdOlgdd0yiev4OVyBQRLWt4QbdJRgf4xjiaS3kl6mzgTBseX1qtrx4Tmz3jafddfUXQsrDfcDu/aLbfcDV1c8MHPf8OXytCn/dxGzG+G342ZQBJLzFOcqBDXP8QnltEAFoVpgDmE6O49gvBlqDKWFy3Uyku3iRcIRNXZaOKGZCn0jm9AvsMumf4Uuxf+a9PbtGddV/h87oftF5pxeldIrZy7ySuvC0P3yC3UNI++gtJ8rAAAAAElFTkSuQmCC";
var imgTag_module_default = { imgTag: "imgTag___Rjvbt" };
//#endregion
//#region source-snapshot/src/component/DishTag/imgTag.js
var imgMap = {
	SPICY: spicy_default,
	RECOMMENDED: recommend_default
};
var ImgTag = (props) => {
	const { tagInfo, imgTagStyle } = props;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		className: imgTag_module_default.imgTag,
		style: { ...imgTagStyle },
		src: tagInfo?.labelImg?.length ? `${tagInfo.labelImg[0]?.url}` : imgMap[tagInfo.name],
		alt: tagInfo.name
	}) });
};
var index_module_default$1 = {
	tagWrapper: "tagWrapper___xdpdJ",
	"new": "new___bEKZR",
	newText: "newText___uGSFJ"
};
//#endregion
//#region source-snapshot/src/component/DishTag/index.js
var imgTag = ["SPICY", "RECOMMENDED"];
var newTag = ["NEW"];
var DishTag = (props) => {
	const { tagsInfo: tagsInfoOrigin, isItemCard = true, textTagStyle, imgTagStyle, style } = props;
	const tagsInfo = (0, import_react.useMemo)(() => {
		return filterVisibleDishTags(tagsInfoOrigin);
	}, [tagsInfoOrigin]);
	const imgTags = (0, import_react.useMemo)(() => {
		if (!tagsInfo?.length) return [];
		return tagsInfo.filter((tag) => isDishTagHeightBearing(tag) && (imgTag.includes(tag.name) || tag?.labelType === "img"))?.sort((a, b) => b.name.length - a.name.length);
	}, [tagsInfo]);
	const spacialNewTag = (0, import_react.useMemo)(() => {
		if (!tagsInfo?.length) return [];
		return tagsInfo.filter((tag) => newTag.includes(tag.name) || tag.type === 2);
	}, [tagsInfo]);
	const textTags = (0, import_react.useMemo)(() => {
		if (!tagsInfo?.length) return [];
		const excludeNames = /* @__PURE__ */ new Set([...imgTags.map((tag) => tag.name), ...spacialNewTag.map((tag) => tag.name)]);
		return tagsInfo.filter((tag) => {
			return !excludeNames.has(tag.name);
		});
	}, [
		tagsInfo,
		imgTags,
		spacialNewTag
	]);
	if (!imgTags?.length && !spacialNewTag?.length && !textTags?.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: index_module_default$1.tagWrapper,
		style: { ...style },
		children: [
			imgTags.map((each, idx) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImgTag, {
					tagInfo: each,
					imgTagStyle
				}, idx);
			}),
			spacialNewTag.map((each, idx) => {
				return isItemCard ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: index_module_default$1.new,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: index_module_default$1.newText,
						children: each.name
					})
				}, idx) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextTag, {
					tagInfo: each,
					textTagStyle
				}, idx);
			}),
			textTags.map((each, idx) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextTag, {
					tagInfo: each,
					textTagStyle
				}, idx);
			})
		]
	});
};
var index_module_default = {
	promotionTagsWrap: "promotionTagsWrap___DBvxn",
	placeholderBlock: "placeholderBlock___WQR2W",
	totalPromotionBlock: "totalPromotionBlock___kB-v-",
	promotionTagItem: "promotionTagItem___tQXwq"
};
//#endregion
//#region source-snapshot/src/utils/formatOrdinals.js
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var formatOrdinals = (n) => {
	try {
		const pr = new Intl.PluralRules("en-US", { type: "ordinal" });
		const suffixes = /* @__PURE__ */ new Map([
			["one", "st"],
			["two", "nd"],
			["few", "rd"],
			["other", "th"]
		]);
		const rule = pr.select(n);
		return `${n}${suffixes.get(rule)}`;
	} catch (e) {
		return `${n}`;
	}
};
//#endregion
//#region source-snapshot/src/component/PromotionTagsWrap/index.js
/**
* 促销标签组件
* @param {Object} itemInfo - 商品信息对象，需要包含 id 属性
* @param {Object} promotion - 促销数据对象，包含 buyDiscountRule, buyGiftRule, exchangePurchaseRule, itemMatchCloudPromotion
* @param {boolean} isComboType - 是否是套餐类型，如果是套餐则不显示促销标签
* @param {Array<string>} tags - 促销标签文本数组（可选，如果提供则直接使用，否则根据 itemInfo 和 promotion 计算）
* @param {string} className - 自定义样式类名
*/
var PromotionTagsWrap = ({ itemInfo, promotion, promotionIndex, isComboType = false, tags, className, onHeightChange }) => {
	const { t } = useTranslation();
	const selfConfig = useSelector((state) => state.selfConfig);
	const [showTotalPromotion, setShowTotalPromotion] = (0, import_react.useState)(false);
	const promotionWrapRef = (0, import_react.useRef)(null);
	const indexedPromotions = (0, import_react.useMemo)(() => getIndexedItemPromotions(promotionIndex, itemInfo?.id), [promotionIndex, itemInfo?.id]);
	(0, import_react.useEffect)(() => {
		const handleClickOutside = (event) => {
			if (!showTotalPromotion || !promotionWrapRef.current) return;
			const target = event.touches?.[0]?.target || event.target;
			if (!promotionWrapRef.current.contains(target)) setShowTotalPromotion(false);
		};
		if (showTotalPromotion) document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, [showTotalPromotion]);
	const discountList = (0, import_react.useMemo)(() => {
		if (!promotion?.buyDiscountRule || !itemInfo) return [];
		const discountInfo = indexedPromotions ? indexedPromotions.buyDiscountRule : promotion.buyDiscountRule.find((info) => info?.activityRule?.buyDishes?.includes(itemInfo.id));
		if (!discountInfo) return [];
		const { activityRule: { giftsDiscount, buyNumber, giftsDiscountRule, buyType } } = discountInfo;
		const isIdenticalBuyType = buyType === "identical";
		const isEachItemQty = Number(buyNumber) === 1;
		const buyNumberStr = native_i18n_default.language === "en" ? formatOrdinals(buyNumber + "") : buyNumber + "";
		return [getPromotionActivityDisplayText({
			defaultText: giftsDiscountRule !== "1" ? isEachItemQty ? t("secondDiscountEach", { value: giftsDiscount }) : t(isIdenticalBuyType ? "secondDiscountIdentical" : "secondDiscount", {
				value: giftsDiscount,
				quantity: buyNumberStr
			}) : t(isIdenticalBuyType ? "overDiscountIdentical" : "overDiscount", {
				value: giftsDiscount,
				quantity: buyNumber
			}),
			activityName: discountInfo.activityName,
			activityLabel: discountInfo.activityLabel,
			selfConfig
		})];
	}, [
		promotion?.buyDiscountRule,
		indexedPromotions,
		itemInfo,
		t,
		selfConfig
	]);
	const enabledBuyGifts = (0, import_react.useMemo)(() => {
		if (!promotion?.buyGiftRule || !itemInfo) return [];
		return (indexedPromotions ? indexedPromotions.buyGiftRules : promotion.buyGiftRule?.filter((each) => each?.activityRule?.buyDishes?.includes(itemInfo.id)))?.map((giftInfo) => getPromotionActivityDisplayText({
			defaultText: t("buy-x-give-n", {
				buyNumber: giftInfo.activityRule.buyNumber,
				giftsNumber: giftInfo.activityRule.giftsNumber
			}),
			activityName: giftInfo.activityName,
			activityLabel: giftInfo.activityLabel,
			selfConfig
		}));
	}, [
		promotion?.buyGiftRule,
		indexedPromotions,
		itemInfo,
		t,
		selfConfig
	]);
	const exchangePurchaseList = (0, import_react.useMemo)(() => {
		if (!promotion?.exchangePurchaseRule || !itemInfo) return [];
		const exchangePurchase = indexedPromotions ? indexedPromotions.exchangePurchaseRule : promotion.exchangePurchaseRule.find((rule) => rule?.activityRule?.conditionType === "itemQuantity" && rule?.activityRule?.buyDishes?.includes(itemInfo.id));
		return exchangePurchase ? [getPromotionActivityDisplayText({
			defaultText: t("exchangeItemDealTitle"),
			activityName: exchangePurchase.activityName,
			activityLabel: exchangePurchase.activityLabel,
			selfConfig
		})] : [];
	}, [
		promotion?.exchangePurchaseRule,
		indexedPromotions,
		itemInfo,
		t,
		selfConfig
	]);
	const commercialPromotion = (0, import_react.useMemo)(() => {
		if (!promotion?.itemMatchCloudPromotion || !itemInfo) return [];
		return (indexedPromotions ? indexedPromotions.commercialPromotions : promotion.itemMatchCloudPromotion?.[itemInfo.id] || []).filter(isCommercialPromotionTagVisible).map((each) => {
			const { activityLabel, activityRule, promotionName, promotionType, promotionChineseTag, promotionEnglishTag } = each;
			return getPromotionCenterActivityRuleText({
				t,
				activityRule,
				type: promotionType,
				promotionName,
				activityLabel,
				promotionChineseTag,
				promotionEnglishTag,
				selfConfig,
				promoCenterHitActivity: { promotion: {
					activityRule,
					activityLabel,
					type: promotionType
				} }
			});
		});
	}, [
		promotion?.itemMatchCloudPromotion,
		indexedPromotions,
		itemInfo,
		t,
		selfConfig
	]);
	const combinePromotion = (0, import_react.useMemo)(() => {
		if (tags && Array.isArray(tags)) return tags;
		return [
			...discountList,
			...enabledBuyGifts,
			...exchangePurchaseList,
			...commercialPromotion
		];
	}, [
		tags,
		discountList,
		enabledBuyGifts,
		exchangePurchaseList,
		commercialPromotion
	]);
	const reportHeight = (0, import_react.useCallback)(() => {
		if (!onHeightChange) return;
		const element = promotionWrapRef.current;
		if (!element) {
			onHeightChange(0);
			return;
		}
		const computedStyle = window.getComputedStyle?.(element);
		const marginTop = Number.parseFloat(computedStyle?.marginTop) || 0;
		const marginBottom = Number.parseFloat(computedStyle?.marginBottom) || 0;
		onHeightChange(element.getBoundingClientRect().height + marginTop + marginBottom);
	}, [onHeightChange]);
	(0, import_react.useLayoutEffect)(() => {
		reportHeight();
		const element = promotionWrapRef.current;
		if (!element) return void 0;
		if (window.ResizeObserver) {
			let frameId;
			const scheduleReportHeight = () => {
				window.cancelAnimationFrame(frameId);
				frameId = window.requestAnimationFrame(reportHeight);
			};
			const resizeObserver = new window.ResizeObserver(scheduleReportHeight);
			resizeObserver.observe(element);
			return () => {
				window.cancelAnimationFrame(frameId);
				resizeObserver.disconnect();
			};
		}
		window.addEventListener("resize", reportHeight);
		return () => window.removeEventListener("resize", reportHeight);
	}, [
		reportHeight,
		combinePromotion,
		showTotalPromotion
	]);
	if (isComboType) return null;
	if (!combinePromotion || !combinePromotion.length) return null;
	const showMoreIcon = combinePromotion.length > 1;
	const firstTag = combinePromotion[0];
	const toggleTotalPromotion = (e, active) => {
		e.stopPropagation();
		setShowTotalPromotion(active);
	};
	const handleContainerClick = (e) => {
		if (!showTotalPromotion) return;
		e.stopPropagation();
	};
	const renderPromotionTag = (promotionInfoText) => {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: index_module_default.promotionTagItem,
			children: promotionInfoText
		}, promotionInfoText);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: promotionWrapRef,
		className: (0, import_classnames.default)(index_module_default.promotionTagsWrap, { [index_module_default.showTotalPromotion]: showTotalPromotion }, className),
		onClick: handleContainerClick,
		children: [!showTotalPromotion && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [renderPromotionTag(firstTag), showMoreIcon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABCCAMAAADUivDaAAAAVFBMVEUAAADTDCbUDCbPECDVDCfUDCbUDCfTDCfTDCjPEDDTDCfUDCf75+rslaHeQlfXGTPZJz/ph5Xoeon2zNLlbHzjXnDxsLn52t7gUGT0vsXfUGPcNkwlmlvhAAAAC3RSTlMAkM8Q4KCPQCAQ0A00nUYAAADZSURBVFjD7dfLDoIwEIXhablqO0JLC6jv/55SBuLCRQmTGE3m352FH1DZAKlGleZEumqBKmpzurpYBW0Y6WTUhlUN0BpmDVRcQoHmEiUYdkIIIYQQQvwI0Tt0j310ATF2+7ohuj5PzJNd8hs3pDFshrepW5a42zX6VaQRyKMxZglL0bWQBtJjWOobxGjX6NQCjUhHe/RB6FqeRvd5nNPz2J/6PvWIGLp9zA59/zdvpxBCCCGEEFmi5AoaFJeooOESLXBvQwHAhfvZnwzFuIcCqLa6mhOVqoGlF9yTurMExMABAAAAAElFTkSuQmCC",
			alt: "morePromotion",
			onClick: (e) => toggleTotalPromotion(e, true)
		})] }), showTotalPromotion && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index_module_default.placeholderBlock,
			children: [combinePromotion.map((each) => {
				return renderPromotionTag(each);
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABCCAMAAADUivDaAAAAYFBMVEUAAADUDCbPECDTDCfUDCbUDCfTDCfTDCjUDCfTDCXPEDDVDSf75+rUDCf2y9HoeYnqh5T2zNLXGTPZKEDZJz/0vsb52d7jXnD52t7xsLnlbHzcNUzvoq3tlaHgUGTeQ1iWYD6oAAAADHRSTlMAzxCQoI9AIOCQEN9Ns3/lAAABNklEQVRYw+3Wy26DMBCF4THX0HLwBcwlNM37v2VrHIRad+GON23Ev8OLT8KDNJCral7BSBQ1+bIS7MpsEwSMXFpGdgKEM0oMXcusG1AS1YATuIZBRQWmNiGJhgRsCrHgQkCbFHASJ3EST0HIOZWQuCcSCsA1ibBwyQRC99hSbGLu8eiNS7xjz1geIXHUaw6h4DLdPTBiCbvfwrjCtc5RRDgM6Xeva4ohwmFcH7vXP0QQwTDW/aW8IX9DSLiO/44btm7xxD6MYMBLLKFN+ElKr+oo4hjGlya4+jmKUD/f/wqXiieG8fvxOMQT47ANI6jz51HX2Sk1hoI//79L4CRO4iT+AnHBkiJYCMohU4gJBVUwmi9ooCbK0Wu20CMnohcBTJYDLNJAZOSMHOzyjHx1IcDo0lT02QfJas+oXf//FQAAAABJRU5ErkJggg==",
				alt: "placeholder"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: index_module_default.totalPromotionBlock,
			children: [combinePromotion.map((each) => {
				return renderPromotionTag(each);
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABCCAMAAADUivDaAAAAYFBMVEUAAADUDCbPECDTDCfUDCbUDCfTDCfTDCjUDCfTDCXPEDDVDSf75+rUDCf2y9HoeYnqh5T2zNLXGTPZKEDZJz/0vsb52d7jXnD52t7xsLnlbHzcNUzvoq3tlaHgUGTeQ1iWYD6oAAAADHRSTlMAzxCQoI9AIOCQEN9Ns3/lAAABNklEQVRYw+3Wy26DMBCF4THX0HLwBcwlNM37v2VrHIRad+GON23Ev8OLT8KDNJCral7BSBQ1+bIS7MpsEwSMXFpGdgKEM0oMXcusG1AS1YATuIZBRQWmNiGJhgRsCrHgQkCbFHASJ3EST0HIOZWQuCcSCsA1ibBwyQRC99hSbGLu8eiNS7xjz1geIXHUaw6h4DLdPTBiCbvfwrjCtc5RRDgM6Xeva4ohwmFcH7vXP0QQwTDW/aW8IX9DSLiO/44btm7xxD6MYMBLLKFN+ElKr+oo4hjGlya4+jmKUD/f/wqXiieG8fvxOMQT47ANI6jz51HX2Sk1hoI//79L4CRO4iT+AnHBkiJYCMohU4gJBVUwmi9ooCbK0Wu20CMnohcBTJYDLNJAZOSMHOzyjHx1IcDo0lT02QfJas+oXf//FQAAAABJRU5ErkJggg==",
				alt: "restractPromotion",
				onClick: (e) => toggleTotalPromotion(e, false)
			})]
		})] })]
	});
};
//#endregion
export { VariableSizeList as i, formatOrdinals as n, DishTag as r, PromotionTagsWrap as t };
