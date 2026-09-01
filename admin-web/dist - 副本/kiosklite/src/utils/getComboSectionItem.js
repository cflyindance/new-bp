import cloneDeep from 'lodash/cloneDeep';
import { getComboItemDetailInfo } from './busTools';
import { ORDER_TYPE } from '@/constants/order';
import { getCachedImagePath } from '@/utils/imagePathCache';

const dishHasThumbSource = (d) =>
  !!(d.thumbPath || getCachedImagePath(d.id));

const getComboSectionItem = (
  sectionList,
  currentCategoryList,
  currentOrder
) => {
  let comboAllChildDish = [];
  sectionList.forEach((s) => {
    if (s.id > 0 && s?.comboSectionSaleItems?.length) {
      let childDishItem = [];
      let list = s.comboSectionSaleItems;
      // 自选套餐，根据dineIn ,togo过滤菜
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        let temp = cloneDeep(
          getComboItemDetailInfo(item.saleItemId, currentCategoryList)
        );
        if (temp) {
          temp.sideNavId = s?.id;
          if (!temp.itemPrices?.length) {
            childDishItem.push({...temp, price: item.addPrice ?? temp.price});
          } else {
            const currentOrderTypePriceList = temp.itemPrices.filter(
              (f) => f.type === ORDER_TYPE[currentOrder.orderType]
            );
            const allOrderTypePriceList = temp.itemPrices.filter(
              (f) => f.type === ORDER_TYPE['ALL']
            );
            const itemPriceList = currentOrderTypePriceList.length
              ? currentOrderTypePriceList
              : allOrderTypePriceList;
            if (itemPriceList?.length > 0) {
              if (s.mergeDisplay) {
                const itemPriceListWithPrice = itemPriceList.map((priceItem) => ({
                  ...priceItem,
                  price: item.addPrice ?? priceItem.price,
                  originalSaleItem: temp,
                  originalComboSectionSaleItem: item,
                }));
                const sameNameItemIdx = childDishItem.findIndex(d => d.name === temp.name);
                if (sameNameItemIdx > -1) {
                  childDishItem[sameNameItemIdx].itemPrices.push(...itemPriceListWithPrice);
                } else {
                  childDishItem.push({ ...temp, itemPrices: itemPriceListWithPrice });
                }
              } else {
                const itemPriceListWithPrice = itemPriceList.map((priceItem) => ({
                  ...priceItem,
                  price: item.addPrice ?? priceItem.price
                }));
                childDishItem.push({ ...temp, itemPrices: itemPriceListWithPrice });
              }
            }
          }
          // if (temp.itemPrices) {
          //   // 是否堂吃
          //   if (currentOrder.orderType == 'DINE_IN') {
          //     let dineInList = temp.itemPrices.filter(
          //       (f) => f.type == 'DINE_IN'
          //     );
          //     if (dineInList.length) {
          //       temp.itemPrices = cloneDeep(dineInList);
          //       childDishItem.push(temp);
          //       continue;
          //     } else {
          //       let AllList = temp.itemPrices.filter((f) => f.type == 'ALL');
          //       if (AllList.length) {
          //         temp.itemPrices = cloneDeep(AllList);
          //         childDishItem.push(temp);
          //         continue;
          //       } else {
          //         delete temp.itemPrices;
          //         temp.price = temp.price ? temp.price : 0;
          //         childDishItem.push(temp);
          //         continue;
          //       }
          //     }
          //   } else if (currentOrder.orderType == 'TO_GO') {
          //     // 是否打包
          //     let togoList = temp.itemPrices.filter((f) => f.type == 'TOGO');
          //     if (togoList.length) {
          //       temp.itemPrices = cloneDeep(togoList);
          //       childDishItem.push(temp);
          //       continue;
          //     } else {
          //       let AllList = temp.itemPrices.filter((f) => f.type == 'ALL');
          //       if (AllList.length) {
          //         temp.itemPrices = cloneDeep(AllList);
          //         childDishItem.push(temp);
          //         continue;
          //       } else {
          //         delete temp.itemPrices;
          //         temp.price = temp.price ? temp.price : 0;
          //         childDishItem.push(temp);
          //         continue;
          //       }
          //     }
          //   } else if (currentOrder.orderType == 'PICK_UP') {
          //     // 预约点单
          //     let pickUpList = temp.itemPrices.filter(
          //       (f) => f.type == 'PICKUP'
          //     );
          //     if (pickUpList.length) {
          //       temp.itemPrices = cloneDeep(pickUpList);
          //       childDishItem.push(temp);
          //       continue;
          //     } else {
          //       let AllList = temp.itemPrices.filter((f) => f.type == 'ALL');
          //       if (AllList.length) {
          //         temp.itemPrices = cloneDeep(AllList);
          //         childDishItem.push(temp);
          //         continue;
          //       } else {
          //         delete temp.itemPrices;
          //         temp.price = temp.price ? temp.price : 0;
          //         childDishItem.push(temp);
          //         continue;
          //       }
          //     }
          //   }
          // } else {
          //   childDishItem.push(temp);
          // }
        }
      }

      const hasThumbPath = childDishItem.some(dishHasThumbSource);

      const isRequestSubDish = s?.itemSelectionRule
        ? s.itemSelectionRule !== 'MAX_NUM_LIMIT'
        : false;

      comboAllChildDish.push({
        sideNameMap: {
          id: s?.id,
          name: s?.name,
          fieldDisplayNameGroups: s?.fieldDisplayNameGroups,
        },
        hasThumbPath,
        sideDishList: childDishItem,
        discountAllowed: s.discountAllowed,
        isRequestSubDish,
      });
    }

    // 处理 Sides/Drinks (-99, -98) - 使用 saleItems 而非 comboSectionSaleItems
    else if ((s.id === -99 || s.id === -98) && s?.saleItems?.length) {
      let childDishItem = [];
      let list = s.saleItems;

      for (let i = 0; i < list.length; i++) {
        let temp = cloneDeep(list[i]);
        temp.sideNavId = s.id;

        if (!temp.itemPrices?.length) {
          childDishItem.push(temp);
        } else {
          const currentOrderTypePriceList = temp.itemPrices.filter(
            (f) => f.type === ORDER_TYPE[currentOrder.orderType]
          );
          const allOrderTypePriceList = temp.itemPrices.filter(
            (f) => f.type === ORDER_TYPE['ALL']
          );
          const itemPriceList = currentOrderTypePriceList.length
            ? currentOrderTypePriceList
            : allOrderTypePriceList;
          if (itemPriceList?.length > 0) {
            childDishItem.push({ ...temp, itemPrices: itemPriceList });
          }
        }
      }

      const hasThumbPath = childDishItem.some(dishHasThumbSource);

      comboAllChildDish.push({
        sideNameMap: {
          id: s?.id,
          name: s?.name,
          fieldDisplayNameGroups: s?.fieldDisplayNameGroups,
        },
        hasThumbPath,
        sideDishList: childDishItem,
        discountAllowed: s.discountAllowed ?? false,
        isRequestSubDish: false, // Sides/Drinks 非必选
      });
    }
  });
  return comboAllChildDish;
};

export default getComboSectionItem;
