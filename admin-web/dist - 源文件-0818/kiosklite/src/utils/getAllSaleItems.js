import calcOrderTypeCount from './calcOrderTypeCount';

const getAllSaleItems = (menuGroup, orderType, filterHiddenItem = true) => {
  // cloneDeep(menuGroup)
  return menuGroup?.reduce((pre, cur) => {
    if (cur?.menuCategories) {
      cur?.menuCategories.forEach((cate) => {
        let showItem = [];
        if (filterHiddenItem) {
          // 需要过滤隐藏菜品
          showItem = cate?.saleItems?.filter((item) => {
            return !item.hiddenItem || (item.hiddenItem && item.isFreeItem);
          });
        } else {
          // 不需要过滤隐藏菜品
          showItem = cate?.saleItems;
        }
        // 当前orderType下菜品数量
        const isHasSaleItem = calcOrderTypeCount(showItem || [], orderType) > 0;
        if (isHasSaleItem) {
          pre.push({
            ...cate,
            saleItems: showItem,
          });
        }
      });
      return pre;
    }
    return pre;
  }, []);
};

export default getAllSaleItems;
