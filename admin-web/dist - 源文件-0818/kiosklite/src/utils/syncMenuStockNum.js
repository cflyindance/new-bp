import * as types from '@/constants/actionTypes';
import { fetchKioskMenuWithStock } from '@/api/menu';
import isEqual from 'lodash/isEqual';
import {
  applyStockNumToMenuGroups,
  applyStockNumToSaleItems,
  buildStockNumMap,
  getMenuGroupsFromMenuResponse,
} from '@/utils/menuStock';

const hasStockDataMap = (data) => data && Object.keys(data).length > 0;

const hasStockNumChanged = (currentStockNumMap, latestStockNumMap) =>
  Object.keys(latestStockNumMap).some(
    (itemId) =>
      !isEqual(currentStockNumMap[itemId], latestStockNumMap[itemId])
  );

const buildMenuItemList = (menus) => {
  const menuItemList = {};
  for (const menuGroup of menus || []) {
    for (const category of menuGroup.menuCategories || []) {
      for (const item of category.saleItems || []) {
        menuItemList[item.id] = item;
        if (item.oId) {
          menuItemList[item.oId] = item;
        }
      }
    }
  }
  return menuItemList;
};

export default async function syncMenuStockNum(
  dispatch,
  getState,
  { onlyIfChanged = false } = {}
) {
  const res = await fetchKioskMenuWithStock();
  const stockMenuGroups = getMenuGroupsFromMenuResponse(res?.data);
  const stockNumMap = buildStockNumMap(stockMenuGroups);
  const { menuGroup, currentSaleItems, currentItem } = getState();
  if (
    onlyIfChanged &&
    !hasStockNumChanged(buildStockNumMap(menuGroup), stockNumMap)
  ) {
    return menuGroup;
  }

  const updatedMenuGroup = applyStockNumToMenuGroups(menuGroup, stockNumMap);

  dispatch({
    type: types.MENU_ITEM_LIST,
    menuItemList: buildMenuItemList(updatedMenuGroup),
  });
  dispatch({ type: types.FETCH_MENUGROUP, menuGroup: updatedMenuGroup });

  if (currentSaleItems?.length) {
    dispatch({
      type: types.CURRENT_SALE_ITEMS,
      currentSaleItems: applyStockNumToSaleItems(currentSaleItems, stockNumMap),
    });
  }

  const currentItemId =
    currentItem?.oId != null ? currentItem.oId : currentItem?.id;
  if (currentItemId != null && stockNumMap[currentItemId] !== undefined) {
    let changed = false;
    const newCurrentItem = { ...currentItem };
    const stockData = stockNumMap[currentItemId];

    if (stockData?.stockNum !== undefined) {
      newCurrentItem.stockNum = stockData.stockNum;
      changed = true;
    }

    if (
      newCurrentItem.options?.length > 0 &&
      hasStockDataMap(stockData?.options)
    ) {
      newCurrentItem.options = newCurrentItem.options.map((option) => {
        const optionStockData = stockData.options[option.id];
        if (
          option.subOptions?.length > 0 &&
          hasStockDataMap(optionStockData?.subOptions)
        ) {
          option.subOptions = option.subOptions.map((subOption) => {
            const subOptionStockData = optionStockData.subOptions[subOption.id];
            if (subOptionStockData?.stockNum !== undefined) {
              subOption.stockNum = subOptionStockData.stockNum;
              changed = true;
            }
            return subOption;
          });
        }
        return option;
      });
    }
    if (changed) {
      dispatch({ type: types.CURRENT_ITEM, currentItem: newCurrentItem });
    }
  }

  return updatedMenuGroup;
}
