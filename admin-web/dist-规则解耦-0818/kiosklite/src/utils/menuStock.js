import { getStockItemId } from './validateItemStock';

const hasStockDataMap = (data) => data && Object.keys(data).length > 0;

/**
 * 从菜单接口响应中解析 menuGroups
 */
export function getMenuGroupsFromMenuResponse(data) {
  const payload = data?.data ?? data;
  const activeMenu =
    payload?.menus?.find((menu) => menu?.active === true) ||
    payload?.KioskMenus?.find((menu) => menu?.active === true);
  return activeMenu?.menuGroups || [];
}

/**
 * 获取菜单中所有售罄菜品的 id 和 name
 */
export function getOutOfStockItems(menuGroups) {
  return (menuGroups || [])
    .flatMap((group) => group?.menuCategories || [])
    .flatMap((category) => category?.saleItems || [])
    .filter((item) => item?.outOfStock)
    .map(({ id, name }) => ({ id, name }));
}

export function getItemsWithStockNum(menuGroups) {
  return (menuGroups || [])
    .flatMap((group) => group?.menuCategories || [])
    .flatMap((category) => category?.saleItems || [])
    .filter((item) => item?.stockNum !== undefined)
    .map(({ id, name, stockNum }) => ({ id, name, stockNum }));
}

/**
 * 从含 stockNum 的菜单结构中构建 saleItemId -> stockNum 映射
 */
export function buildStockNumMap(menuGroups) {
  const stockNumMap = {};
  if (!Array.isArray(menuGroups)) {
    return stockNumMap;
  }
  for (const group of menuGroups) {
    for (const category of group.menuCategories || []) {
      for (const item of category.saleItems || []) {
        if (item?.id != null) {
          let stockData = undefined;
          if (item.stockNum !== undefined) {
            stockData = { stockNum: item.stockNum };
          }
          let optionStockData = undefined;
          for (const option of item.options || []) {
            let subOptionStockData = undefined;
            for (const subOption of option?.subOptions || []) {
              if (option?.id != null && subOption?.id != null) {
                if (subOption.stockNum !== undefined) {
                  subOptionStockData = {
                    ...subOptionStockData,
                    [subOption.id]: { stockNum: subOption.stockNum },
                  };
                }
              }
            }
            if (subOptionStockData !== undefined) {
              optionStockData = {
                ...optionStockData,
                [option.id]: { subOptions: subOptionStockData },
              };
            }
          }
          if (optionStockData !== undefined) {
            stockData = { ...stockData, options: optionStockData };
          }
          if (stockData !== undefined) {
            stockNumMap[item.id] = stockData;
          }
        }
      }
    }
  }
  return stockNumMap;
}

export function applyStockNumToSaleItems(saleItems, stockNumMap) {
  if (!Array.isArray(saleItems) || !stockNumMap) {
    return saleItems;
  }
  return saleItems.map((item) => {
    const itemId = getStockItemId(item);
    const stockData = stockNumMap[itemId];
    if (stockData?.stockNum !== undefined) {
      item.stockNum = stockData.stockNum;
    }
    if (item.options?.length > 0 && hasStockDataMap(stockData?.options)) {
      item.options = item.options.map((option) => {
        const optionStockData = stockData.options[option.id];
        if (
          option.subOptions?.length > 0 &&
          hasStockDataMap(optionStockData?.subOptions)
        ) {
          option.subOptions = option.subOptions.map((subOption) => {
            const subOptionStockData = optionStockData.subOptions[subOption.id];
            if (subOptionStockData?.stockNum !== undefined) {
              subOption.stockNum = subOptionStockData.stockNum;
            }
            return subOption;
          });
        }
        return option;
      });
    }

    return item;
  });
}

/**
 * 将 stockNum 合并进菜单组中的每个 saleItem
 */
export function applyStockNumToMenuGroups(menuGroups, stockNumMap) {
  if (!Array.isArray(menuGroups) || !stockNumMap) {
    return menuGroups;
  }
  return menuGroups.map((group) => ({
    ...group,
    menuCategories: (group.menuCategories || []).map((category) => ({
      ...category,
      saleItems: applyStockNumToSaleItems(
        category.saleItems || [],
        stockNumMap
      ),
    })),
  }));
}
