import { getCurrentItemLanguage, getDishItemLanguage } from './busTools';
import cloneDeep from 'lodash/cloneDeep';

const resolveKioskMenu = (originMenu, comboMenu, language) => {
  const comboMenuIds = comboMenu.map(each => each.saleItemId);
  const validMenu = originMenu.filter(each => each.name !== 'Metadata Item Group').map((g) => {
    return {
      ...g,
      _id: 'group_' + g.id,
      name:
        getCurrentItemLanguage(g.fieldDisplayNameGroups, language) || g.name,
      selectable: false,
      children: g.menuCategories?.map((c) => {
        return {
          ...c,
          _id: 'category_' + c.id,
          name:
            getCurrentItemLanguage(c.fieldDisplayNameGroups, language) ||
            c.name,
          selectable: false,
          children: c.saleItems?.filter(each =>
            !(
              comboMenuIds.includes(each.id) &&
              each.itemPrices?.length > 0 &&
              each.itemPrices.every(item => item.type.toUpperCase() === 'ALL')
            )
          ).map((d) => {
            return {
              ...d,
              _id: 'dish_' + d.id,
              name:
                getDishItemLanguage(d.fieldDisplayNameGroups, language) ||
                d.name,
            };
          }),
        };
      }),
    };
  });
  return deepFilter(validMenu);
};

const deepFilter = (list, deep = 1) => {
  // 使用filter 过滤当前层的数组
  return list?.filter((item) => {
    item.children = deepFilter(item.children, deep + 1);
    if (deep === 1 || deep === 2) return item?.children?.length > 0;
    return true;
  });
};

const handleGetBrandMenu = (menuGroup, dishIds, deep = 1) => {
  return cloneDeep(menuGroup).filter((item) => {
    if (item.menuCategories) {
      item.menuCategories = handleGetBrandMenu(
        item.menuCategories,
        dishIds,
        deep + 1
      );
    }
    if (item.saleItems) {
      item.saleItems = handleGetBrandMenu(item.saleItems, dishIds, deep + 1);
    }
    if (deep === 1) {
      return item.menuCategories?.length > 0;
    }
    if (deep === 2) {
      return item?.saleItems?.length > 0;
    }
    const id = item.isFreeItem ? item.oId : item.id;
    return dishIds.includes(id);
  });
};

export default { resolveKioskMenu, handleGetBrandMenu };
