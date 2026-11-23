import { Ki as ORDER_TYPE } from "./actions-BwRPwnFF.js";
//#region source-snapshot/src/utils/calcOrderTypeCount.js
var calcOrderTypeCount = (list, orderType) => {
	let n = 0;
	for (let i = 0; i < list.length; i++) {
		let temp = list[i];
		if (temp?.itemPrices) {
			if (orderType === "DINE_IN") {
				if (temp.itemPrices.filter((f) => f.type === "DINE_IN").length) {
					n++;
					continue;
				} else if (temp.itemPrices.filter((f) => f.type === "ALL").length) {
					n++;
					continue;
				}
			} else if (orderType === "TO_GO") {
				if (temp.itemPrices.filter((f) => f.type === "TOGO").length) {
					n++;
					continue;
				} else if (temp.itemPrices.filter((f) => f.type === "ALL").length) {
					n++;
					continue;
				}
			} else if (orderType === "PICK_UP") {
				if (temp.itemPrices.filter((f) => f.type === "PICKUP").length) {
					n++;
					continue;
				} else if (temp.itemPrices.filter((f) => f.type === "ALL").length) {
					n++;
					continue;
				}
			}
		} else n++;
	}
	return n;
};
//#endregion
//#region source-snapshot/src/utils/getAllSaleItems.js
var getAllSaleItems = (menuGroup, orderType, filterHiddenItem = true) => {
	return menuGroup?.reduce((pre, cur) => {
		if (cur?.menuCategories) {
			cur?.menuCategories.forEach((cate) => {
				let showItem = [];
				if (filterHiddenItem) showItem = cate?.saleItems?.filter((item) => {
					return !item.hiddenItem || item.hiddenItem && item.isFreeItem;
				});
				else showItem = cate?.saleItems;
				if (calcOrderTypeCount(showItem || [], orderType) > 0) pre.push({
					...cate,
					saleItems: showItem
				});
			});
			return pre;
		}
		return pre;
	}, []);
};
//#endregion
//#region source-snapshot/src/utils/filterFitOrderTypeFood.js
var filterFitOrderTypeFood = (list, orderType) => {
	return list?.reduce((pre, cur) => {
		if (!cur?.itemPrices) return pre.concat(cur);
		const currentOrderTypePriceList = cur.itemPrices.filter((f) => f.type === ORDER_TYPE[orderType]);
		const allOrderTypePriceList = cur.itemPrices.filter((f) => f.type === ORDER_TYPE["ALL"]);
		const itemPriceList = currentOrderTypePriceList.length ? currentOrderTypePriceList : allOrderTypePriceList;
		if (!itemPriceList?.length) return pre;
		return pre.concat({
			...cur,
			itemPrices: itemPriceList
		});
	}, []);
};
//#endregion
//#region source-snapshot/src/utils/getStandardCateDish.js
var getValidCategoryList = (group, orderType, filterHiddenItem = true) => {
	return getAllSaleItems(group, orderType, filterHiddenItem)?.reduce((pre, cur) => {
		const itemWithOrderType = filterFitOrderTypeFood(cur?.saleItems || [], orderType);
		if (itemWithOrderType?.length) return pre.concat({
			...cur,
			saleItems: itemWithOrderType
		});
		return pre;
	}, []);
};
var getStandardCateDish = ({ isOpenBrandSetting, brandMenu, menuGroup, orderType }) => {
	const validCategoryList = getValidCategoryList(menuGroup, orderType);
	if (!isOpenBrandSetting) return validCategoryList;
	return brandMenu?.map((each) => each.menuCategories)?.flat()?.map((cate) => {
		const currentCate = validCategoryList.find((each) => each.id === cate.id);
		if (cate?.saleItems?.length) {
			const currentItems = currentCate?.saleItems || [];
			const showItem = cate?.saleItems?.map((item) => {
				return currentItems.find((ci) => ci.id === item.id);
			})?.filter((item) => {
				return item && (!item.hiddenItem || item.hiddenItem && item.isFreeItem);
			});
			const isHasSaleItem = calcOrderTypeCount(showItem || [], orderType) > 0;
			return {
				...cate,
				saleItems: isHasSaleItem ? filterFitOrderTypeFood(showItem, orderType) : []
			};
		}
		return cate;
	})?.filter((each) => each.saleItems?.length > 0);
};
//#endregion
export { getValidCategoryList as n, calcOrderTypeCount as r, getStandardCateDish as t };
