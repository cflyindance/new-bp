import store from '@/reducers/store';
import findLastIndex from 'lodash/findLastIndex';
import Big from 'big.js';
import cloneDeep from 'lodash/cloneDeep';
import { getComboItemDetailInfo, getComboSectionInfo } from '@/utils/busTools';

// option是否有价格项
const hasOptionPrice = (itemInfo) => {
  let isOpt = false;
  let isCateyOpt = false;
  let isSizeOpt = false;
  if (itemInfo?.options?.length) {
    isOpt = itemInfo.options.some((opt) => opt.price);
  }
  if (itemInfo?.categoryOptions?.length) {
    isCateyOpt = itemInfo.categoryOptions.some((cateyOpt) => cateyOpt.price);
  }
  if (itemInfo?.itemPrices?.length > 1) {
    isSizeOpt = true;
  }
  return isOpt || isCateyOpt || isSizeOpt;
};

const getItemDisplayPrice = ({ itemInfo, isComboType, currentOrder, currentCategoryList, sideNavList, sideNavId, currentOrderCombo }) => {
  // 获取价格规则
  const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
  const priceRule = sectionInfo?.priceRule;
  const orderItem = currentOrderCombo?.find(
    (item) => item.id === sideNavId
  )?.items;
  const orderItemQty = orderItem?.length ?? 0;
  const currentOrderItemQty =
    orderItem?.filter((item) => item.id === itemInfo.id)?.length ?? 0;
  // 套餐子菜的价格是否显示
  let isShowIcon = false;
  // 列表上显示的菜价
  let price = 0;
  if (itemInfo.itemPrices?.length) {
    let minObj = itemInfo.itemPrices[0];
    if (
      Object.hasOwnProperty.call(itemInfo, 'defaultItemSizeId') &&
      itemInfo.defaultItemSizeId !== null &&
      itemInfo.defaultItemSizeId !== undefined
    ) {
      const defaultItem = itemInfo.itemPrices.find(
        (priceItem) => priceItem.sizeId === itemInfo.defaultItemSizeId
      );
      if (defaultItem) {
        minObj = defaultItem; // 如果找到了，返回该对象
      } else {
        // 没找到对应的默认值的话，还是显示最小的价格
        itemInfo.itemPrices.forEach((p) => {
          if (p.price < minObj.price) {
            minObj = p;
          }
        });
      }
    } else {
      itemInfo.itemPrices.forEach((p) => {
        if (p.price < minObj.price) {
          minObj = p;
        }
      });
    }
    price = minObj.price;
    isShowIcon = !(itemInfo.itemPrices?.length === 1);
  } else {
    price = itemInfo.price;
  }

  // 如果当前菜，是做为自选套餐内部子菜的，则价格需要根据计算规则显示
  if (isComboType) {
    if (priceRule === 'FIXED_PRICE') {
      price = 0;
      isShowIcon = hasOptionPrice(itemInfo);
    } else if (priceRule === 'FIXED_UNTIL_MAX') {
      // 未达到最大值
      if (orderItemQty <= sectionInfo?.maxNumOfSelectionAllowed) {
        price = 0;
        isShowIcon = false;
      } else {
        if (currentOrderItemQty === 0) {
          // 达到最大值且当前菜没有被选择过，展示价格
          isShowIcon = true;
        } else if (currentOrderItemQty === 1) {
          const itemIdx =
            orderItem.findIndex((each) => each.id === itemInfo.id) + 1;
          // 当前子菜只选择了一个，根据第几个加入判断是否展示价格
          isShowIcon = itemIdx > sectionInfo?.maxNumOfSelectionAllowed;
          price = isShowIcon ? price : 0;
        } else {
          const itemLastIdx =
            findLastIndex(orderItem, (each) => each.id === itemInfo.id) + 1;
          // 一个子菜选择多次情况下，根据最后一个判断是否展示
          isShowIcon = itemLastIdx > sectionInfo?.maxNumOfSelectionAllowed;
          price = isShowIcon ? price : 0;
        }
      }
    } else if (priceRule === 'ADJUSTABLE_PRICE') {
      if (!itemInfo.itemPrices?.length) {
        isShowIcon = hasOptionPrice(itemInfo);
      }
    } else if (sectionInfo?.freeQuantity > 0) {
      // 未达到最大值
      if (orderItemQty <= sectionInfo?.freeQuantity) {
        price = 0;
        isShowIcon = false;
      } else {
        if (currentOrderItemQty === 0) {
          // 达到最大值且当前菜没有被选择过，展示价格
          isShowIcon = true;
        } else if (currentOrderItemQty === 1) {
          const itemIdx =
            orderItem.findIndex((each) => each.id === itemInfo.id) + 1;
          // 当前子菜只选择了一个，根据第几个加入判断是否展示价格
          isShowIcon = itemIdx > sectionInfo?.freeQuantity;
          price = isShowIcon ? price : 0;
        } else {
          const itemLastIdx =
            findLastIndex(orderItem, (each) => each.id === itemInfo.id) + 1;
          // 一个子菜选择多次情况下，根据最后一个判断是否展示
          isShowIcon = itemLastIdx > sectionInfo?.freeQuantity;
          price = isShowIcon ? price : 0;
        }
      }
    }
  } else {
    // 非套餐子菜，正常显示菜价
    let optionTotalPrice = Big(0);
    // 如果是固定套餐，额外加上固定菜的价格
    // 如果当前是固定套餐的选项（需加上ADJUSTABLE_PRICE的价格）
    // 自选套餐 有ADJUSTABLE_PRICE的选项 要取该项最小价格（规格菜的规格价格（取最小） 、普通菜的价格）*必选数量
    if (
      (itemInfo?.comboType === 'FIXED_SELECTION' ||
        itemInfo?.comboType === 'FLEXIBLE') &&
      itemInfo.comboSections &&
      itemInfo.comboSections.length
    ) {
      itemInfo.comboSections.forEach((cs) => {
        if (cs.priceRule == 'ADJUSTABLE_PRICE') {
          // 当子菜选择类型为RANGE 、EQUALS_TO 、MIN_NUM_LIMIT时，代表改选项为必选，minNumOfSelectionAllowed是最少选择数量
          const requestNum = ['RANGE', 'EQUALS_TO', 'MIN_NUM_LIMIT']?.includes(
            cs?.itemSelectionRule
          )
            ? cs?.minNumOfSelectionAllowed
            : 0;

          let orderType = currentOrder.orderType;
          if (cs.comboSectionSaleItems) {
            // 收集每一项的所有最小规格价格 或自身价格
            let allMinPrices = [];
            cs.comboSectionSaleItems.forEach((csItem) => {
              const sItem = cloneDeep(
                getComboItemDetailInfo(csItem.saleItemId, currentCategoryList)
              );
              if (sItem) {
                // 取对应订单类型的规格价格 若无 取All规格
                if (sItem.itemPrices) {
                  // 是否堂吃
                  if (orderType == 'DINE_IN') {
                    let dineInList = sItem.itemPrices.filter(
                      (f) => f.type == 'DINE_IN'
                    );
                    if (dineInList.length) {
                      sItem.itemPrices = cloneDeep(dineInList);
                    } else {
                      let AllList = sItem.itemPrices.filter(
                        (f) => f.type == 'ALL'
                      );
                      if (AllList.length) {
                        sItem.itemPrices = cloneDeep(AllList);
                      } else {
                        delete sItem.itemPrices;
                        sItem.price = sItem.price ? sItem.price : 0;
                      }
                    }
                  } else if (orderType == 'TO_GO') {
                    // 是否打包
                    let togoList = sItem.itemPrices.filter(
                      (f) => f.type == 'TOGO'
                    );
                    if (togoList.length) {
                      sItem.itemPrices = cloneDeep(togoList);
                    } else {
                      let AllList = sItem.itemPrices.filter(
                        (f) => f.type == 'ALL'
                      );
                      if (AllList.length) {
                        sItem.itemPrices = cloneDeep(AllList);
                      } else {
                        delete sItem.itemPrices;
                        sItem.price = sItem.price ? sItem.price : 0;
                      }
                    }
                  } else if (orderType == 'PICK_UP') {
                    // 预约点单
                    let pickUpList = sItem.itemPrices.filter(
                      (f) => f.type == 'PICKUP'
                    );
                    if (pickUpList.length) {
                      sItem.itemPrices = cloneDeep(pickUpList);
                    } else {
                      let AllList = sItem.itemPrices.filter(
                        (f) => f.type == 'ALL'
                      );
                      if (AllList.length) {
                        sItem.itemPrices = cloneDeep(AllList);
                      } else {
                        delete sItem.itemPrices;
                        sItem.price = sItem.price ? sItem.price : 0;
                      }
                    }
                  }
                }
                // 有size 的 itemPrice选项，取默认值
                if (sItem && sItem.itemPrices && sItem.itemPrices.length) {
                  // 取默认最小
                  let minObj = sItem.itemPrices[0];
                  sItem.itemPrices.forEach((p) => {
                    if (p.price < minObj.price) {
                      minObj = p;
                    }
                  });
                  allMinPrices.push(minObj);
                } else {
                  allMinPrices.push({ price: sItem.price || 0 });
                }
              }
            });
            // 在同选项所有最小价格中找到最小的那个
            if (allMinPrices.length > 0) {
              let minObj = allMinPrices[0];
              allMinPrices.forEach((p) => {
                if (p.price < minObj.price) {
                  minObj = p;
                }
              });

              optionTotalPrice = optionTotalPrice.plus(
                minObj.price * requestNum
              );
            }
          }
        }
      });
      isShowIcon = optionTotalPrice.gt(0) || isShowIcon;
      // 加上本身的size价格
      price = optionTotalPrice.plus(price).toNumber();
    }
  }

  return { price, isShowIcon };
};

export default getItemDisplayPrice;
