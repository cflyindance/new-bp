import {
  CURRENT_SALE_ITEMS,
  CURRENT_ITEM,
  MENU_ITEM_LIST,
  ITEM_SIZE_LIST,
  TEMP_ITEM_LIST,
  SAVESEARCHITEM,
} from '../constants/actionTypes';

const initState = {
  currentSaleItems: [],
  currentItem: {},
  menuItemList: {},
  itemSizeList: [],
  tempItemList: [],
  searchItem: [],
};

export function currentSaleItems(state = initState.currentSaleItems, action) {
  switch (action.type) {
    case CURRENT_SALE_ITEMS:
      return action.currentSaleItems;
    default:
      return state;
  }
}
export function currentItem(state = initState.currentItem, action) {
  switch (action.type) {
    case CURRENT_ITEM:
      return action.currentItem;
    default:
      return state;
  }
}
export function menuItemList(state = initState.menuItemList, action) {
  switch (action.type) {
    case MENU_ITEM_LIST:
      return action.menuItemList;
    default:
      return state;
  }
}
export function itemSizeList(state = initState.itemSizeList, action) {
  switch (action.type) {
    case ITEM_SIZE_LIST:
      return action.itemSizeList;
    default:
      return state;
  }
}
export function tempItemList(state = initState.tempItemList, action) {
  switch (action.type) {
    case TEMP_ITEM_LIST:
      return action.tempItemList;
    default:
      return state;
  }
}

export function searchItem(state = initState.searchItem, action) {
  switch (action.type) {
    case SAVESEARCHITEM:
      return action.searchItem;
    default:
      return state;
  }
}
