import {
  CURRENT_CATEGORY,
  CURRENT_CATEGORY_LIST,
  SEARCH_KEY_WORD,
  TEMP_CURRENT_CATEGORY,
  SETKEYBOARDTOGGLE,
} from '../constants/actionTypes';

const initState = {
  currentCategory: {},
  currentCategoryList: [],
  searchKeyWord: '',
  keyboardToggle: false,
  tempCurrentCategory: {},
};

export function currentCategory(state = initState.currentCategory, action) {
  switch (action.type) {
    case CURRENT_CATEGORY:
      return action.currentCategory;
    default:
      return state;
  }
}

export function currentCategoryList(state = initState.currentCategoryList, action) {
  switch (action.type) {
    case CURRENT_CATEGORY_LIST:
      return filterCategoryWithOrderType(
        action.categoryAction.currentCategoryList,
        action.categoryAction.orderType,
      );
    default:
      return state;
  }
}

function filterCategoryWithOrderType(currentCategoryList, orderType) {
  const menuCategoryList = Object.assign([], currentCategoryList);
  if (orderType == '') return menuCategoryList;
  for (let i = menuCategoryList.length - 1; i >= 0; i--) {
    const cate = menuCategoryList[i];
    if (!cate.saleItems) {
      menuCategoryList.splice(i, 1);
      continue;
    }
    for (let j = cate.saleItems.length - 1; j >= 0; j--) {
      const item = cate.saleItems[j];
      if (!item.itemPrices) continue;
      for (let k = item.itemPrices.length - 1; k >= 0; k--) {
        const price = item.itemPrices[k];
        if (
          price.type != 'ALL' &&
          price.type.split('_').join('') != orderType.split('_').join('')
        ) {
          item.itemPrices.splice(k, 1);
        }
      }
      if (item.itemPrices.length == 0) {
        cate.saleItems.splice(j, 1);
      }
      if (item.itemType == 'COMBO_SALE_ITEM' && item.comboSections == undefined) {
        cate.saleItems.splice(j, 1);
      }
    }
    if (cate.saleItems.length == 0) {
      menuCategoryList.splice(i, 1);
    }
  }
  return menuCategoryList;
}

export function searchKeyWord(state = initState.searchKeyWord, action) {
  switch (action.type) {
    case SEARCH_KEY_WORD:
      return action.searchKeyWord;
    default:
      return state;
  }
}
export function tempCurrentCategory(state = initState.tempCurrentCategory, action) {
  switch (action.type) {
    case TEMP_CURRENT_CATEGORY:
      return action.tempCurrentCategory;
    default:
      return state;
  }
}

export function keyboardToggle(state = initState.keyboardToggle, action) {
  switch (action.type) {
    case SETKEYBOARDTOGGLE:
      return action.data;
    default:
      return state;
  }
}
