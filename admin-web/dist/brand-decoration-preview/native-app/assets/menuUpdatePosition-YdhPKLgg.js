import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { d as remToPx, r as getHeightBearingItemCardProperties, s as getVisiblePromotionTagCount } from "./getItemCardProperties-CHuqwFqK.js";
import { t as handleCountRowNum } from "./handleCountRowNum-B73-PziM.js";
//#region source-snapshot/src/utils/getVirtualListData.js
/**
* 获取虚拟列表数据
* @param {Object} params - 参数对象
* @param {Array} params.allCateList - 所有分类列表，包含分类信息和商品数据
* @param {boolean} [params.isTopMenu=false] - 是否是顶部菜单布局
* @param {Object} params.selfConfig - 系统配置对象，包含菜单配置信息
* @param {boolean} [params.isExpand=false] - 是否展开，用于控制积分兑换分类的展开/收起状态
* @param {number} [params.freeItemMenuPosition=0] - 免费商品菜单位置，用于判断是否显示展开按钮
* @returns {Array} 返回处理后的虚拟列表数据，包含分类标题、描述、商品列表和空盒子等元素
*/
var getVirtualListData = ({ allCateList, isTopMenu = false, selfConfig, isExpand = false, freeItemMenuPosition = 0, listPromotion, promotionIndex, availableWidth }) => {
	const promotionState = listPromotion ?? native_store_default?.getState()?.promotion ?? {};
	const colNum = handleCountRowNum({
		selfConfig,
		availableWidth,
		isTopMenu
	});
	const colNumCount = colNum.count;
	const promotionListHeight = remToPx(29);
	const cateTextHeight = remToPx(12.7);
	const cateDescHeight = remToPx(11);
	const estimatedCardHeight = remToPx(39);
	const rowSpacing = remToPx(4.8);
	const propertyTagHeight = remToPx(10);
	const expendButtonHeight = remToPx(10);
	const promotionTagHeight = remToPx(6);
	const extraHeight = remToPx(40);
	const maxRowsForMembership = 2;
	return allCateList.reduce((pre, cur) => {
		const { hiddenCategory, id, name, saleItems: originalSaleItems, description, ...rest } = cur;
		if (hiddenCategory) return pre;
		const saleItems = cur.id === "promotion-deals-list" ? originalSaleItems : originalSaleItems.filter((item) => !item.hiddenItem || item.isFreeItem);
		const saleItemsNumber = saleItems.length;
		const isMembershipCategory = id === "membership-point-redeem-category";
		const isPromotionDealsList = id === "promotion-deals-list";
		if (saleItemsNumber > 0) {
			const cateArr = [];
			if (isPromotionDealsList) {
				cateArr.push({
					id,
					type: "promotionDealList",
					height: promotionListHeight,
					saleItems,
					...rest
				});
				return pre.concat(cateArr);
			}
			cateArr.push({
				id,
				name,
				type: "cateText",
				height: cateTextHeight,
				...rest
			});
			if (description && description !== "undefined") cateArr.push({
				id,
				name,
				type: "cateDesc",
				description,
				height: cateDescHeight,
				...rest
			});
			let smallArrNum = 0;
			if (isMembershipCategory && saleItemsNumber > maxRowsForMembership * colNumCount && !isExpand && freeItemMenuPosition === 0) smallArrNum = maxRowsForMembership;
			else smallArrNum = saleItemsNumber / colNumCount;
			const ceilNum = Math.ceil(smallArrNum);
			const getListObj = (items) => ({
				id,
				name,
				type: "cateList",
				colNum,
				...rest,
				saleItems: items
			});
			const itemList = saleItems.reduce((pre, cur) => {
				if (!pre.length) {
					const listObj = getListObj([cur]);
					pre.push(listObj);
					return pre;
				}
				const currentListObj = pre[pre.length - 1];
				if (currentListObj.saleItems.length < colNumCount) {
					currentListObj.saleItems.push(cur);
					return pre;
				}
				if (pre.length >= ceilNum) return pre;
				const listObj = getListObj([cur]);
				pre.push(listObj);
				return pre;
			}, []).map((listItem) => {
				const propertyFlags = listItem.saleItems.map((itemInfo) => getHeightBearingItemCardProperties({
					itemInfo,
					selfConfig
				}).length > 0);
				listItem.hasProperty = propertyFlags.some(Boolean);
				listItem.rowSpacing = rowSpacing;
				const promotionTagCounts = listItem.saleItems.map((saleItem) => getVisiblePromotionTagCount({
					itemId: saleItem.id,
					promotion: promotionState,
					promotionIndex
				}));
				listItem.cardEstimatedHeights = promotionTagCounts.map((count, index) => estimatedCardHeight + (propertyFlags[index] ? propertyTagHeight : 0) + (count > 0 ? promotionTagHeight : 0));
				listItem.promotionTagCount = Math.max(0, ...promotionTagCounts);
				listItem.hasPromotion = listItem.promotionTagCount > 0;
				listItem.height = listItem.rowSpacing + Math.max(0, ...listItem.cardEstimatedHeights);
				return listItem;
			});
			cateArr.push(...itemList);
			if (isMembershipCategory && saleItemsNumber > maxRowsForMembership * colNumCount && !isExpand && freeItemMenuPosition === 0) cateArr.push({
				id,
				type: "expendButton",
				height: expendButtonHeight,
				...rest
			});
			return pre.concat(cateArr);
		}
		return pre;
	}, []).concat({
		id: "emptyBox",
		groupId: "emptyBox",
		type: "emptyBox",
		height: extraHeight
	});
};
//#endregion
//#region source-snapshot/src/utils/menuUpdatePosition.js
var normalizeId = (value) => `${value ?? ""}`;
var menuContainsCategory = (menuGroup, categoryId) => {
	if (categoryId === void 0 || categoryId === null) return false;
	const normalizedCategoryId = normalizeId(categoryId);
	return (menuGroup || []).some((group) => (group?.menuCategories || []).some((category) => normalizeId(category?.id) === normalizedCategoryId));
};
var preserveGroupOpenState = ({ menuGroup, previousOpenGroups, currentGroupId }) => {
	const normalizedCurrentGroupId = normalizeId(currentGroupId);
	return (menuGroup || []).reduce((result, group) => {
		const groupId = group?.id;
		result[groupId] = Object.prototype.hasOwnProperty.call(previousOpenGroups || {}, groupId) ? Boolean(previousOpenGroups[groupId]) : normalizeId(groupId) === normalizedCurrentGroupId;
		return result;
	}, {});
};
var getVirtualRowKeys = (rows) => {
	const occurrences = {};
	return (rows || []).map((row) => {
		const baseKey = `${row?.type || "row"}:${normalizeId(row?.id)}`;
		const occurrence = occurrences[baseKey] || 0;
		occurrences[baseKey] = occurrence + 1;
		return `${baseKey}:${occurrence}`;
	});
};
var getRowAtOffset = (rows, keys, scrollOffset) => {
	let top = 0;
	for (let index = 0; index < rows.length; index++) {
		const height = Number(rows[index]?.height) || 0;
		if (scrollOffset < top + height || index === rows.length - 1) return {
			key: keys[index],
			row: rows[index],
			offsetWithinRow: Math.max(0, scrollOffset - top)
		};
		top += height;
	}
	return null;
};
var getAnchoredScrollOffset = ({ previousRows, nextRows, scrollOffset }) => {
	if (!previousRows?.length || !nextRows?.length) return scrollOffset;
	const normalizedScrollOffset = Math.max(Number(scrollOffset) || 0, 0);
	const previousKeys = getVirtualRowKeys(previousRows);
	const nextKeys = getVirtualRowKeys(nextRows);
	const anchor = getRowAtOffset(previousRows, previousKeys, normalizedScrollOffset);
	const firstItem = anchor?.row?.saleItems?.[0];
	const itemAnchorIndex = firstItem ? nextRows.findIndex((row) => row.type === anchor.row.type && normalizeId(row.id) === normalizeId(anchor.row.id) && row.saleItems?.some((item) => normalizeId(item.id) === normalizeId(firstItem.id))) : -1;
	const nextAnchorIndex = itemAnchorIndex >= 0 ? itemAnchorIndex : nextKeys.indexOf(anchor?.key);
	if (nextAnchorIndex < 0) return normalizedScrollOffset;
	const nextAnchorTop = nextRows.slice(0, nextAnchorIndex).reduce((total, row) => total + (Number(row?.height) || 0), 0);
	const nextAnchorHeight = Number(nextRows[nextAnchorIndex]?.height) || 0;
	return nextAnchorTop + Math.min(anchor.offsetWithinRow, Math.max(nextAnchorHeight - 1, 0));
};
//#endregion
export { getVirtualListData as a, preserveGroupOpenState as i, getVirtualRowKeys as n, menuContainsCategory as r, getAnchoredScrollOffset as t };
