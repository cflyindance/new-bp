import getAllSaleItems from './getAllSaleItems';
import filterFitOrderTypeFood from './filterFitOrderTypeFood';
import calcOrderTypeCount from './calcOrderTypeCount';

export const getValidCategoryList = (
  group,
  orderType,
  filterHiddenItem = true
) => {
  // 平铺菜品
  const allCategoryItem = getAllSaleItems(group, orderType, filterHiddenItem);
  // 过滤出可用菜品
  return allCategoryItem?.reduce((pre, cur) => {
    const itemWithOrderType = filterFitOrderTypeFood(
      cur?.saleItems || [],
      orderType
    );
    if (itemWithOrderType?.length) {
      return pre.concat({
        ...cur,
        saleItems: itemWithOrderType,
      });
    }
    return pre;
  }, []);
};

const getStandardCateDish = ({
  isOpenBrandSetting,
  brandMenu,
  menuGroup,
  orderType,
}) => {
  // 根据 orderType 过滤菜品
  const validCategoryList = getValidCategoryList(menuGroup, orderType);
  if (!isOpenBrandSetting) return validCategoryList;

  // 开启品类模式后菜品
  return brandMenu
    ?.map((each) => each.menuCategories)
    ?.flat()
    ?.map((cate) => {
      // 从准确的菜品中获取
      const currentCate = validCategoryList.find((each) => each.id === cate.id);
      if (cate?.saleItems?.length) {
        const currentItems = currentCate?.saleItems || [];
        const showItem = cate?.saleItems
          ?.map((item) => {
            return currentItems.find((ci) => ci.id === item.id);
          })
          ?.filter((item) => {
            return (
              item && (!item.hiddenItem || (item.hiddenItem && item.isFreeItem))
            );
          });
        const isHasSaleItem = calcOrderTypeCount(showItem || [], orderType) > 0;
        return {
          ...cate,
          saleItems: isHasSaleItem
            ? filterFitOrderTypeFood(showItem, orderType)
            : [],
        };
      }
      return cate;
    })
    ?.filter((each) => each.saleItems?.length > 0);
};

export default getStandardCateDish;
