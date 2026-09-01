import {
  FETCH_MENUGROUP,
  EXPEND_FREELIST,
  COMBO_MENU,
} from '../constants/actionTypes';

const initState = {
  menuGroup: [],
  freeListIsExpanded: false,
  comboMenu: [],
};

export function menuGroup(state = initState.menuGroup, action) {
  switch (action.type) {
    case FETCH_MENUGROUP:
      const originMenuGroup = action.menuGroup;
      // 解决global option group 没有menuCategories导致无法下单问题
      const hasCategoryGroup = originMenuGroup.filter(
        (each) => each.menuCategories?.length > 0
      );
      return hasCategoryGroup;
    default:
      return state;
  }
}

export function freeListIsExpanded(
  state = initState.freeListIsExpanded,
  action
) {
  switch (action.type) {
    case EXPEND_FREELIST:
      return action.data;
    default:
      return state;
  }
}

// 商品中心 在combo里面的子菜的列表
export function comboMenu(state = initState.comboMenu, action) {
  switch (action.type) {
    case COMBO_MENU:
      return action.comboMenu;
    default:
      return state;
  }
}
