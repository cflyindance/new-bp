import cloneDeep from 'lodash/cloneDeep';
import {
  CURRENT_COMBO,
  ADD_TO_SECTION,
  REMOVE_FROM_SECTION,
  SET_ITEM_PRICE,
  ADD_COMBO_OPTION,
  ADD_OPTION,
  RESET_CURRENT_COMBO,
  DEFAULT_CURRENT_COMBO,
  REMOVEDIYCOMBO,
  REMOVEDIYOPTCOMBO,
  CLEARDIYCOMBO,
  ADD_TO_SECTION_BYID,
  REMOVE_ONE_OPTIONS,
  REMOVE_ONE_ITEMS,
  SPLICE_ALL_ITEMS,
  SPLICE_SINGLE_ITEMS,
  CHANGE_DEFAULT_DISH,
  EDIT_DEFAULT_DISH,
} from '../constants/actionTypes';
import { compare } from '../utils';
import { getComboItemDetailInfo, getComboSectionInfo } from '../utils/busTools';
import itemIsSoldOut from '@/utils/itemIsSoldOut';

const initState = {
  currentOrderCombo: [],
};

const ITEM_PRICE_ID = -1;
const OPTION_ID = -2;
const CATEGORY_OPTION_ID = -3;

export function currentOrderCombo(state = initState.currentOrderCombo, action) {
  switch (action.type) {
    case CURRENT_COMBO:
      return initComboSection(Object.assign([], state), action.comboInfo);
    case ADD_TO_SECTION:
      return addItemToComboSection(Object.assign([], state), action.itemInfo);
    case ADD_TO_SECTION_BYID:
      let arr = Object.assign([], state);
      action.data.forEach((d) => {
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].id == d.id) {
            arr[i] = d;
            break;
          }
        }
      });
      return arr;
    case REMOVE_FROM_SECTION:
      return removeItemFromComboSection(
        Object.assign([], state),
        action.itemInfo
      );
    case REMOVEDIYCOMBO:
      return removeFootItemComboSection(Object.assign([], state), action.data);
    case REMOVEDIYOPTCOMBO:
      return removeFootOptComboSection(Object.assign([], state), action.data);
    case CLEARDIYCOMBO:
      return clearFootItemComboSection(Object.assign([], state), action.data);
    case SET_ITEM_PRICE:
      return setItemPrice(Object.assign([], state), action.sizeInfo);
    case ADD_COMBO_OPTION:
      return addComboOption(Object.assign([], state), action.option);
    case ADD_OPTION:
      return addOption(Object.assign([], state), action.optionInfo);
    case REMOVE_ONE_OPTIONS:
      return removeOneOption(Object.assign([], state), action.data);
    case REMOVE_ONE_ITEMS:
      return removeOneItems(Object.assign([], state), action.data);
    case SPLICE_ALL_ITEMS:
      return spliceComboAllItems(Object.assign([], state), action.data);
    case SPLICE_SINGLE_ITEMS:
      return spliceComboSingleItems(Object.assign([], state), action.data);
    case RESET_CURRENT_COMBO:
      return [];
    case DEFAULT_CURRENT_COMBO:
      return action.sectionDetail;
    case CHANGE_DEFAULT_DISH:
      return resetDefaultStatus(Object.assign([], state), action.itemInfo);
    case EDIT_DEFAULT_DISH:
      return editSystemDefaultDish(Object.assign([], state), action.itemInfo);
    default:
      return state;
  }
}

function initComboSection(comboInfo, optionInfo) {
  const orderType = optionInfo.orderType;
  const currentItem = optionInfo.currentItem;
  const { currentCategoryList, selfConfig, menuItemList, kioskSoldOutList } = optionInfo;
  const soldOutOptions = { menuItemList, kioskSoldOutList };
  const { defaultItemSizeId } = currentItem;
  let newCombo = [];
  let itemPrices = cloneDeep(currentItem.itemPrices);
  const currentCategory = optionInfo.currentCategory;
  let categoryOptions = null;
  if (currentCategory?.isFreeItemCategory) {
    const category = currentCategoryList.find(
      (_) => _.id === currentItem.oCategoryId
    );
    categoryOptions = category && category?.options;
  } else {
    categoryOptions = currentCategory?.options;
  }

  const itemOptions = currentItem?.options;
  let defaultSizeInfo = null;

  if (itemPrices && itemPrices.length) {
    if (orderType == 'DINE_IN') {
      let dineInList = itemPrices.filter((f) => f.type == 'DINE_IN');
      if (dineInList.length) {
        itemPrices = cloneDeep(dineInList);
      } else {
        let AllList = itemPrices.filter((f) => f.type == 'ALL');
        if (AllList.length) {
          itemPrices = cloneDeep(AllList);
        }
      }
    } else if (orderType == 'TO_GO') {
      // 是否打包
      let togoList = itemPrices.filter((f) => f.type == 'TOGO');
      if (togoList.length) {
        itemPrices = cloneDeep(togoList);
      } else {
        let AllList = itemPrices.filter((f) => f.type == 'ALL');
        if (AllList.length) {
          itemPrices = cloneDeep(AllList);
        }
      }
    } else if (orderType == 'PICK_UP') {
      // 预约点单
      let pickUpList = itemPrices.filter((f) => f.type == 'PICKUP');
      if (pickUpList.length) {
        itemPrices = cloneDeep(pickUpList);
      } else {
        let AllList = itemPrices.filter((f) => f.type == 'ALL');
        if (AllList.length) {
          itemPrices = cloneDeep(AllList);
        }
      }
    }
  }

  // 自选套餐，如果有itemPrices，默认添加上itemPrices最小值
  if (itemPrices && itemPrices.length) {
    if (defaultItemSizeId) {
      const sizeDefault = itemPrices.find(
        (each) => each.sizeId === defaultItemSizeId
      );
      if (sizeDefault) defaultSizeInfo = sizeDefault;
    }
    if (!defaultItemSizeId || !defaultSizeInfo) {
      // 默认不选
      defaultSizeInfo = {};
      // // 取默认最小
      // let minObj = itemPrices[0];
      // itemPrices.forEach((p) => {
      //   if (p.price < minObj.price) {
      //     minObj = p;
      //   }
      // });
      // defaultSizeInfo = Object.assign({}, minObj);
    }
    let tempPriceSection = {
      id: ITEM_PRICE_ID,
      sizeInfo: defaultSizeInfo,
    };
    newCombo.push(tempPriceSection);
  }
  // combo sections
  if (currentItem.comboSections != undefined) {
    for (let section of currentItem.comboSections) {
      let tempSectionInfo = {};
      const { priceRule } = section;
      // 预选菜功能
      const subDishItem = section.comboSectionSaleItems.map((each) => {
        return {
          ...each,
          ...getComboItemDetailInfo(each.saleItemId, currentCategoryList),
        };
      });
      const preSelectedItem = section.priceRule == "ITEM_CENTER" ? [] : subDishItem
        .filter((each) => each.preSelected)
        .map((dish) => {
          const isHasDetailPrice = dish.itemPrices?.length > 0;
          // const isHasOptions = dish.options?.length > 0;
          const selectedOptionList = [];
          if (isHasDetailPrice) {
            const filterPriceByType = dish.itemPrices.filter(
              (price) =>
                price.type ===
                (orderType === 'DINE_IN'
                  ? orderType
                  : orderType.replace('_', ''))
            );
            // 优先取defaultItemSizeId， 没有取第一个
            const defaultSize = filterPriceByType.find(
              (itemPrice) => itemPrice.sizeId === dish.defaultItemSizeId
            );
            selectedOptionList.push({
              id: -1,
              sizeInfo: defaultSize || filterPriceByType[0],
            });
          }
          // 不默认加option
          // if (isHasOptions) {
          //   const defaultOption = {
          //     ...dish.options[0],
          //     quantity: 1,
          //   };
          //   selectedOptionList.push({
          //     id: -2,
          //     options: [defaultOption],
          //   });
          // }
          // 售罄菜取消预选选中状态
          return {
            ...dish,
            quantity: itemIsSoldOut(dish, soldOutOptions)
              ? 0
              : 1,
            remark: {
              optionName: '',
              optionType: 'NOTE',
              quantity: itemIsSoldOut(dish, soldOutOptions)
                ? 0
                : 1,
              price: priceRule === 'FIXED_PRICE' ? 0 : dish?.price,
            },
            price: priceRule === 'FIXED_PRICE' ? 0 : dish?.price, //FIXED_PRICE计价方式 不计费
            sideNavId: section.id,
            selectedOptionList,
            isDefaultSelect: true, // 标识符：是否由系统默认选择项
          };
        });
      tempSectionInfo.id = section.id;
      tempSectionInfo.items = preSelectedItem || []; //
      newCombo.push(tempSectionInfo);
    }
  }

  // item options
  if (itemOptions != undefined && itemOptions.length > 0) {
    let tempItemOptions = {};
    tempItemOptions.id = OPTION_ID;
    tempItemOptions.options = [];
    newCombo.push(tempItemOptions);
  }

  // category options
  if (categoryOptions != undefined && categoryOptions.length > 0) {
    let tempCategoryOptions = {};
    tempCategoryOptions.id = CATEGORY_OPTION_ID;
    tempCategoryOptions.options = [];
    newCombo.push(tempCategoryOptions);
  }
  return newCombo;
}

function addItemToComboSection(comboInfo, itemInfo) {
  for (let section of comboInfo) {
    if (section.id == itemInfo.sectionId) {
      section.items.push(...itemInfo.item);
      break;
    }
  }
  return comboInfo;
}

function removeItemFromComboSection(comboInfo, itemInfo) {
  const { isPreSelected } = itemInfo;
  for (let section of comboInfo) {
    if (section.id == itemInfo.sectionId) {
      if (section.id == OPTION_ID || section.id == CATEGORY_OPTION_ID) {
        const sectionOptions = section.options;
        if (itemInfo.itemId == undefined) {
          sectionOptions.splice(0, 1);
        } else {
          for (let i = 0; i < sectionOptions.length; i++) {
            if (sectionOptions[i].id == itemInfo.itemId) {
              if (sectionOptions[i].quantity > 1) {
                sectionOptions[i].quantity -= 1;
              } else {
                sectionOptions.splice(i, 1);
              }
              break;
            }
          }
        }
      } else {
        const sectionItems = section.items;
        if (itemInfo.itemId == undefined) {
          sectionItems.splice(0, 1);
        } else {
          for (let i = 0; i < sectionItems.length; i++) {
            if (sectionItems[i].id == itemInfo.itemId) {
              let sectionList = [];
              sectionItems.forEach((section, idx) => {
                if (section.id === itemInfo.itemId) {
                  sectionList.push(idx);
                }
              });
              sectionItems.splice(
                isPreSelected && sectionList.length > 1 ? sectionList[1] : i,
                1
              );
              break;
            }
          }
        }
      }
    }
  }
  return comboInfo;
}

function removeFootItemComboSection(comboInfo, data) {
  const { sectionId, idx, sideNavList } = data;
  // 当前规则
  const sideNavInfo = getComboSectionInfo(sideNavList, sectionId);
  const priceRule = sideNavInfo?.priceRule;
  const freeQuantity = sideNavInfo?.freeQuantity;
  const max = sideNavInfo?.maxNumOfSelectionAllowed;

  if (comboInfo && comboInfo.length) {
    for (let section of comboInfo) {
      if (section.id == sectionId) {
        if (section.items && section.items.length) {
          section.items.splice(idx, 1);
          break;
        }
      }
    }
    // 计价规则是FIXED_UNTIL_MAX，price置为0
    if (priceRule == 'FIXED_UNTIL_MAX') {
      let result = comboInfo.find((c) => c.id == sectionId);
      if (result) {
        for (let k = 0; k < result.items.length; k++) {
          let food = result.items[k];
          if (k < max) {
            let isHasObj = food.selectedOptionList.find(
              (f) => f.id == ITEM_PRICE_ID
            );
            // 有size
            if (isHasObj) {
              isHasObj.sizeInfo.price = 0;
            } else {
              // 无size
              food.price = 0;
            }
          } else {
            break;
          }
        }
      }
    }
    if (freeQuantity > 0) {
      let result = comboInfo.find((c) => c.id == sectionId);
      if (result) {
        for (let k = 0; k < result.items.length; k++) {
          let food = result.items[k];
          if (k < freeQuantity) {
            let isHasObj = food.selectedOptionList.find(
              (f) => f.id == ITEM_PRICE_ID
            );
            // 有size
            if (isHasObj) {
              isHasObj.sizeInfo.price = 0;
            } else {
              // 无size
              food.price = 0;
            }
          } else {
            break;
          }
        }
      }
    }
  }
  return comboInfo;
}

function removeFootOptComboSection(comboInfo, data) {
  const { sectionId, p } = data;
  let sequence = p.sequence;
  if (comboInfo && comboInfo.length) {
    for (let section of comboInfo) {
      if (section.id == sectionId) {
        if (section.options && section.options.length) {
          let idx = section.options.findIndex((s) => s.sequence == sequence);
          if (idx >= 0) {
            section.options.splice(idx, 1);
          }
          break;
        }
      }
    }
  }
  return comboInfo;
}

function clearFootItemComboSection(comboInfo, data) {
  const { id } = data;
  if (comboInfo?.length) {
    if (id > 0) {
      let itemObj = comboInfo.find((c) => c.id == id);
      if (itemObj) {
        itemObj.items.splice(0, itemObj.items.length);
      }
    } else {
      // id：-2，-3
      let optObj = comboInfo.find((c) => c.id == id);
      if (optObj) {
        optObj.options.splice(0, optObj.options.length);
      }
    }
  }

  return comboInfo;
}

function setItemPrice(comboInfo, itemPrice) {
  for (let section of comboInfo) {
    if (section.id == ITEM_PRICE_ID) {
      section.sizeInfo = Object.assign({}, itemPrice);
    }
  }
  return comboInfo;
}

function addComboOption(comboInfo, option) {
  for (let section of comboInfo) {
    if (section.id == CATEGORY_OPTION_ID || section.id == OPTION_ID) {
      let tempOption = Object.assign({}, option);
      tempOption.quantity = 1;
      section.options.push(tempOption);
    }
  }
  return comboInfo;
}

function addOption(comboInfo, optionInfo) {
  let sectionId = optionInfo.sectionId;
  for (let section of comboInfo) {
    if (section.id == sectionId) {
      let thisOption = Object.assign({}, optionInfo.option);
      section.options.push(thisOption);
      section.options.sort(compare('id'));
      break;
    }
  }
  return comboInfo;
}

function removeOneOption(comboInfo, data) {
  const { sideNavId, id } = data;
  let realRes = comboInfo.find((c) => c.id == sideNavId);
  if (realRes) {
    for (let i = 0; i < realRes.options.length; i++) {
      if (realRes.options[i].id == id) {
        realRes.options.splice(i, 1);
        break;
      }
    }
  }

  return comboInfo;
}

function removeOneItems(comboInfo, data) {
  const { sideNavId, id } = data;
  let realRes = comboInfo.find((c) => c.id == sideNavId);
  if (realRes) {
    for (let i = 0; i < realRes.items.length; i++) {
      if (realRes.items[i].id == id) {
        realRes.items.splice(i, 1);
        break;
      }
    }
  }

  return comboInfo;
}

function spliceComboAllItems(comboInfo, data) {
  const { sideNavId, cloneItemList } = data;
  let realRes = comboInfo.find((c) => c.id == sideNavId);
  if (realRes) {
    if (sideNavId == CATEGORY_OPTION_ID) {
      realRes.options = cloneItemList;
    } else {
      realRes.items = cloneItemList;
    }
  }

  return comboInfo;
}

function spliceComboSingleItems(comboInfo, data) {
  const { sideNavId, cloneItemList, id } = data;
  const tempStateList = comboInfo.find((c) => c.id == sideNavId).items;

  for (let i = 0; i < tempStateList.length; i++) {
    // 先把等于id的菜删除
    if (id == tempStateList[i].id) {
      tempStateList.splice(i, 1);
      i--;
    }
  }

  for (let k = 0; k < cloneItemList.length; k++) {
    if (cloneItemList[k].quantity > 1) {
      for (let j = 0; j < cloneItemList[k].quantity; j++) {
        let obj = cloneDeep(cloneItemList[k]);
        obj.quantity = 1;
        tempStateList.push(obj);
      }
    } else {
      tempStateList.push(cloneItemList[k]);
    }
  }

  return comboInfo;
}

function resetDefaultStatus(comboInfo, data) {
  const newComboInfo = comboInfo.map((each) => {
    if (each.id === data.sideNavId) {
      const newItems = each.items.map((item) => {
        return item.id === data.itemId
          ? {
              ...item,
              isDefaultSelect: false,
            }
          : item;
      });
      return {
        id: each.id,
        items: newItems,
      };
    }
    return each;
  });
  return newComboInfo;
}

function editSystemDefaultDish(comboInfo, data) {
  const newComboInfo = comboInfo.map((each) => {
    if (each.id === data.sideNavId) {
      const newItems = each.items.map((item) => {
        return item.id === data.newDishInfo[0].id ? data.newDishInfo[0] : item;
      });
      return {
        id: each.id,
        items: newItems,
      };
    }
    return each;
  });
  return newComboInfo;
}
