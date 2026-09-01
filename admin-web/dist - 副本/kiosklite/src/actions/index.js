import * as types from '../constants/actionTypes';
import {
  attachCategoryOptionsToItem,
  getCurrentItemLanguage,
} from '@/utils/busTools';
import sortComboItemSections from '@/utils/sortComboItemSections';
import i18n from '../assets/i18n/i18n';
import * as crm from './crm_action';
import filterMenuGroupByLicense from '@/utils/filterMenuGroupByLicense';
import { createFreeItemMenu } from '@/utils/createFreeItemMenu';
import { createPromotionDealsList } from '@/utils/createPromotionDealsList';
import { EventBus } from '@/utils/EventBus';
import { REMOVE_MANUAL_SELECT_REWARD_ITEM } from '../constants/actionTypes';
import { fetchAllMenu, searchECardCards } from '@/api/eCard';
import syncMenuStockNumFromSnapshot from '@/utils/syncMenuStockNum';
import {
  canAddComboSubItems,
  isStockSufficient,
  isTotalQtyWithinStock,
  showInsufficientStockToast,
  validateComboSubmitStock,
} from '@/utils/validateItemStock';
import { CARD_NUMBER, EMAIL, PHONE_NUMBER } from '@/constants/constantUnit';

const hasStockDataMap = (data) => data && Object.keys(data).length > 0;

export function setLang(lan = '') {
  return (dispatch) => {
    dispatch({
      type: types.CURRENT_LANGUAGE,
      currentLanguage: lan,
    });
  };
}

export function getMenuItemList(dispatch, menus) {
  let menuItemList = {};
  for (let menuGroup of menus) {
    if (menuGroup.menuCategories != undefined) {
      for (let category of menuGroup.menuCategories) {
        if (category.saleItems != undefined) {
          for (let item of category.saleItems) {
            menuItemList[item.id] = item;
            if (item.oId) {
              menuItemList[item.oId] = item;
            }
          }
        }
      }
    }
  }

  dispatch({
    type: types.MENU_ITEM_LIST,
    menuItemList: menuItemList,
  });
}

/**
 * 拉取带 stockNum 的菜单并合并到 Redux 中的菜品数据
 */
export async function syncMenuStockNum(dispatch, getState) {
  try {
    return await syncMenuStockNumFromSnapshot(dispatch, getState);
  } catch (error) {
    console.log('syncMenuStockNum failed', error);
  }
}

export function refreshMenuStockNumIfChanged() {
  return async (dispatch, getState) => {
    try {
      return await syncMenuStockNumFromSnapshot(dispatch, getState, {
        onlyIfChanged: true,
      });
    } catch (error) {
      console.log('refreshMenuStockNumIfChanged failed', error);
    }
  };
}

/**
 * 处理菜单组：过滤、添加免费菜品菜单、添加促销活动
 * @param {Object} menuGroupList - 菜单组列表
 * @param {Function} dispatch - Redux dispatch 函数
 * @param {Function} getState - Redux getState 函数
 * @returns {Array} 处理后的菜单组
 */
async function processMenuGroup(menuGroupList, dispatch, getState) {
  let menuGroup = null;
  // 剔除组中没有类，或者类中没有菜
  if (!!menuGroupList.KioskMenus[0]) {
    menuGroup = menuGroupList.KioskMenus[0].menuGroups;
  }
  const licenseList = getState().sysCookie.systemLicense;
  if (licenseList?.length > 0) {
    menuGroup = filterMenuGroupByLicense(menuGroup, licenseList);
  }
  const allSysConfig = getState().allSysConfig;
  const CRMStore = getState().crm;
  const rewardRule = CRMStore.rewardRule;
  const freeItemMenuPosition = CRMStore.freeItemMenuPosition;
  const crmIntegrationReward = getState().avocado;
  const orderType = getState().currentOrder.orderType;
  const { outletInfo, rewards } = crmIntegrationReward;
  const isCRMIntegration = outletInfo?.enabled === 1;
  const crmRewardCampaign = isCRMIntegration ? rewards : rewardRule;
  if (menuGroup?.length > 0) {
    if (crmRewardCampaign?.length > 0) {
      const freeItemMenu = createFreeItemMenu({
        menuGroup,
        crmRewardCampaign,
        isCRMIntegration,
        orderType,
      });
      if (freeItemMenu && freeItemMenuPosition !== null) {
        if (freeItemMenuPosition === 0) {
          // 积分菜在头部展示
          menuGroup = [
            freeItemMenu,
            ...menuGroup.filter((_) => !_.isFreeItemMenu),
          ];
        } else if (freeItemMenuPosition === 1) {
          menuGroup = [
            ...menuGroup.filter((_) => !_.isFreeItemMenu),
            freeItemMenu,
          ];
        }
      }
    }
    const promotion = getState().promotion;
    const merchantInfo = getState().merchantProfile;
    // warning - 初始化时因为异步原因导致不一定能获取到mid 所以无mid时不进行促销校验
    // 去下单时 也会调用这个action 此时一定是有mid的
    const isShowPromotionDealsCard =
      getState().selfConfig?.configMap?.id_67 !== false;
    if (merchantInfo?.merchantId && isShowPromotionDealsCard) {
      const promotionDeals = await createPromotionDealsList({
        promotion,
        allSysConfig,
      });
      // 只有当 promotionDeals 不是空对象时才添加到菜单组
      if (promotionDeals && Object.keys(promotionDeals).length > 0) {
        menuGroup = [promotionDeals, ...menuGroup];
      }
    }
  }
  getMenuItemList(dispatch, menuGroup);
  dispatch({
    type: types.FETCH_MENUGROUP,
    menuGroup: menuGroup,
  });
  await syncMenuStockNum(dispatch, getState);
  dispatchCurrentCategoryList(dispatch, getState);
  return getState().menuGroup;
}

// 初始化
export function initParams(merchantProf, menuGroupList) {
  return async (dispatch, getState) => {
    if (merchantProf) {
      dispatch({
        type: types.FETCH_MERCHANT_PROFILE,
        merchantProfile: merchantProf.company,
      });
    }
    const menuGroup = await processMenuGroup(menuGroupList, dispatch, getState);

    // 商品中心 在combo里面的子菜的列表
    const comboMenu =
      menuGroupList.KioskMenus[0]?.comboSectionSaleItemDTOList || [];
    dispatch({
      type: types.COMBO_MENU,
      comboMenu: comboMenu,
    });
    dispatch({
      type: types.CURRENT_CATEGORY,
      currentCategory: {},
    });
    dispatch({
      type: types.CURRENT_SALE_ITEMS,
      currentSaleItems: [],
    });
    // 过滤必选类
    dispatch({
      type: types.SETREQUIRECATEGORY,
      data: menuGroup,
    });
  };
}

export function initConfigParams(
  sysConfig,
  taxInfo,
  itemSizeList,
  allSysConfigList
) {
  return (dispatch) => {
    if (sysConfig) {
      dispatch({
        type: types.SET_SYSTEM_CONFIG,
        sysConfig: sysConfig,
      });
    }
    if (taxInfo?.companyTaxList) {
      dispatch({
        type: types.SET_TAX_INFO,
        taxInfo: taxInfo.companyTaxList,
      });
    }
    if (itemSizeList?.itemSizeList) {
      dispatch({
        type: types.ITEM_SIZE_LIST,
        itemSizeList: itemSizeList.itemSizeList,
      });
    }
    if (allSysConfigList?.systemConfiguration) {
      dispatch({
        type: types.ALL_SET_SYSTEM_CONFIG,
        allSysConfig: allSysConfigList.systemConfiguration,
      });
    }
  };
}

export function initCompanyParams(merchantProf) {
  return (dispatch) => {
    dispatch({
      type: types.FETCH_MERCHANT_PROFILE,
      merchantProfile: merchantProf.company,
    });
  };
}

export function initMenuGroupList(menuGroupList) {
  return async (dispatch, getState) => {
    const menuGroup = await processMenuGroup(menuGroupList, dispatch, getState);

    // 商品中心 在combo里面的子菜的列表
    const comboMenu =
      menuGroupList.KioskMenus[0]?.comboSectionSaleItemDTOList || [];
    dispatch({
      type: types.COMBO_MENU,
      comboMenu: comboMenu,
    });
    dispatch({
      type: types.CURRENT_CATEGORY,
      currentCategory: {},
    });
    dispatch({
      type: types.CURRENT_SALE_ITEMS,
      currentSaleItems: [],
    });

    // 过滤必选类
    dispatch({
      type: types.SETREQUIRECATEGORY,
      data: menuGroup,
    });

    dispatch({
      type: types.MENULOAD,
      data: false,
    });
  };
}

export function initMenuGroup2(menuGroupList) {
  return async (dispatch, getState) => {
    const menuGroup = await processMenuGroup(menuGroupList, dispatch, getState);

    // 商品中心 在combo里面的子菜的列表
    const comboMenu =
      menuGroupList.KioskMenus[0]?.comboSectionSaleItemDTOList || [];
    dispatch({
      type: types.COMBO_MENU,
      comboMenu: comboMenu,
    });
    // 过滤必选类
    dispatch({
      type: types.SETREQUIRECATEGORY,
      data: menuGroup,
    });
    dispatch({
      type: types.MENULOAD,
      data: false,
    });

    // 通知CategoryList组件强制更新allMenu
    EventBus.emit('menu_group_updated');
    return menuGroup;
  };
}

export function currentCategoryList() {
  return (dispatch, getState) =>
    dispatchCurrentCategoryList(dispatch, getState);
}

export function dispatchCurrentCategoryList(dispatch, getState) {
  const menuGroup = JSON.parse(JSON.stringify(getState().menuGroup));
  let menuCategoryList = [];
  for (let group of menuGroup) {
    if (group.menuCategories) {
      menuCategoryList = menuCategoryList.concat(group.menuCategories);
    }
  }
  const orderType = getState().currentOrder.orderType;
  dispatch({
    type: types.CURRENT_CATEGORY_LIST,
    categoryAction: {
      currentCategoryList: menuCategoryList,
      orderType: orderType,
    },
  });
}

//更新菜单组中的促销分类
export function updatePromotionDealsInMenuGroup() {
  return async (dispatch, getState) => {
    const state = getState();
    const isShowPromotionDealsCard =
      state.selfConfig?.configMap?.id_67 !== false;

    if (!isShowPromotionDealsCard) {
      return;
    }

    const promotion = state.promotion;
    const merchantInfo = state.merchantProfile;
    const allSysConfig = state.allSysConfig;
    const localPromotionConfig = state.selfConfig?.configMap?.id_52;
    const menuGroup = JSON.parse(JSON.stringify(state.menuGroup))?.filter(
      (group) => group.id !== 'promotion-deals-list'
    );

    // 重新更新促销菜单
    if (
      (merchantInfo?.merchantId &&
        promotion.promotionCenterMetas &&
        promotion.promotionCenterList?.length) ||
      localPromotionConfig
    ) {
      const promotionDeals = await createPromotionDealsList({
        promotion,
        allSysConfig,
      });

      let updatedMenuGroup = [...menuGroup];

      if (promotionDeals && Object.keys(promotionDeals).length > 0) {
        updatedMenuGroup = [promotionDeals, ...menuGroup];
      }

      getMenuItemList(dispatch, updatedMenuGroup);
      dispatch({
        type: types.FETCH_MENUGROUP,
        menuGroup: updatedMenuGroup,
      });
      // 更新分类列表
      dispatchCurrentCategoryList(dispatch, getState);
    }
  };
}

export function removeItemFromOrder(itemId) {
  return (dispatch, getState) => {
    const { buyDiscountRule, isSkipPromotionCalculation } =
      getState().promotion;
    dispatch({
      type: types.REMOVE_ITEM_FROM_ORDER,
      itemId: itemId,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
  };
}

export function initCurrentOrderCombo(currentItem, currentCategory) {
  return (dispatch, getState) => {
    const orderType = getState().currentOrder.orderType;
    const currentCategoryList = getState().currentCategoryList;
    const selfConfig = getState().selfConfig;
    const menuItemList = getState().menuItemList;
    const kioskSoldOutList = getState().selfConfig?.soldOut;
    dispatch({
      type: types.CURRENT_COMBO,
      comboInfo: {
        currentItem: currentItem,
        currentCategory: currentCategory,
        orderType,
        currentCategoryList,
        selfConfig,
        menuItemList,
        kioskSoldOutList,
      },
    });
  };
}

export function resetCurrentOrderCombo() {
  return (dispatch) => {
    dispatch({
      type: types.RESET_CURRENT_COMBO,
    });
  };
}

export function addItem2ComboSection(sectionId, item) {
  return (dispatch, getState) => {
    const state = getState();
    const itemsToAdd = Array.isArray(item) ? item : [item];
    if (
      !canAddComboSubItems({
        itemsToAdd,
        itemList: state.currentOrder.itemList,
        currentOrderCombo: state.currentOrderCombo,
        menuItemList: state.menuItemList,
        crm: state.crm,
      })
    ) {
      showInsufficientStockToast();
      return false;
    }
    dispatch({
      type: types.ADD_TO_SECTION,
      itemInfo: {
        sectionId: sectionId,
        item: itemsToAdd,
      },
    });
    return true;
  };
}

export function editDefaultDish(sideNavId, newDishInfo) {
  return (dispatch, getState) => {
    const state = getState();
    const itemsToAdd = Array.isArray(newDishInfo) ? newDishInfo : [newDishInfo];
    if (
      !canAddComboSubItems({
        itemsToAdd,
        itemList: state.currentOrder.itemList,
        currentOrderCombo: state.currentOrderCombo,
        menuItemList: state.menuItemList,
        crm: state.crm,
        excludeSectionId: sideNavId,
      })
    ) {
      showInsufficientStockToast();
      return false;
    }
    dispatch({
      type: types.EDIT_DEFAULT_DISH,
      itemInfo: {
        sideNavId,
        newDishInfo: itemsToAdd,
      },
    });
    return true;
  };
}

export function changeDefaultDish(sideNavId, itemId) {
  return (dispatch) => {
    dispatch({
      type: types.CHANGE_DEFAULT_DISH,
      itemInfo: {
        sideNavId,
        itemId,
      },
    });
  };
}

export function removeItemFromComboSection(sectionId, itemId, isPreSelected) {
  return (dispatch) => {
    dispatch({
      type: types.REMOVE_FROM_SECTION,
      itemInfo: {
        sectionId: sectionId,
        itemId: itemId,
        isPreSelected: isPreSelected,
      },
    });
  };
}

export function setItemPrice(sizeInfo) {
  return (dispatch) => {
    dispatch({
      type: types.SET_ITEM_PRICE,
      sizeInfo: sizeInfo,
    });
  };
}

export function addComboOption(option) {
  return (dispatch) => {
    dispatch({
      type: types.ADD_COMBO_OPTION,
      option: option,
    });
  };
}

export function addOption(sectionId, option) {
  return (dispatch) => {
    dispatch({
      type: types.ADD_OPTION,
      optionInfo: {
        sectionId: sectionId,
        option: option,
      },
    });
  };
}

export function addCombo2Order(comboInfo) {
  return (dispatch, getState) => {
    const state = getState();
    if (
      comboInfo.itemType !== 'SALE_ITEM' &&
      comboInfo.sectionDetail?.length &&
      !validateComboSubmitStock(comboInfo, state)
    ) {
      showInsufficientStockToast();
      return false;
    }
    if (
      !isStockSufficient({
        itemInfo: comboInfo,
        addQty: comboInfo.quantity || 1,
        itemList: state.currentOrder.itemList,
        menuItemList: state.menuItemList,
        currentOrderCombo: state.currentOrderCombo,
        crm: state.crm,
      })
    ) {
      showInsufficientStockToast();
      return false;
    }
    const orderSequence = state.orderSequence;
    const { buyDiscountRule, isSkipPromotionCalculation } = state.promotion;
    comboInfo.sequence = orderSequence;
    if (!comboInfo.remark || !comboInfo.remark.optionName) {
      comboInfo.remark = {
        optionName: '',
        optionType: 'NOTE',
        quantity: 1,
        price: 0,
      };
    }
    dispatch({
      type: types.ADD_COMBO_TO_ORDER,
      comboInfo: comboInfo,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
    const getSecondHalfInfo = (id) => {
      return buyDiscountRule.find((info) =>
        info.activityRule.buyDishes.includes(id)
      );
    };
    const secondHalfInfo = getSecondHalfInfo(comboInfo.id);
    dispatch({
      type: types.ORDER_SEQUENCE,
      increaseInterval:
        secondHalfInfo && comboInfo.quantity > 1 ? comboInfo.quantity : 1,
    });
    return true;
  };
}

export function resetCurrentOrder() {
  return (dispatch) => {
    dispatch({
      type: types.RESET_ITEM_LIST,
    });
    dispatch({
      type: types.SET_ORDER_STATUS,
      status: '',
    });
    dispatch({
      type: types.SET_PAYMENT_ID,
      paymentId: '',
    });
    dispatch({
      type: types.SET_ORDER_NOTES,
      notes: '',
    });
    dispatch({
      type: types.SAVE_ORDER_RESULT,
      result: {},
    });
    dispatch({
      type: types.ORDER_TYPE,
      orderType: '',
    });
    dispatch({
      type: types.SET_ORDER_CUSTOMER,
      customer: {
        firstName: '',
        phone: [{}],
      },
    });
    dispatch({
      type: types.SAVE_TIP_AMOUNT,
      tipAmount: 0,
    });
    dispatch({
      type: types.SETTABELSERVICETYPE,
      data: '',
    });
    dispatch({
      type: types.SET_PICKUP_TIME,
      pickupTime: '',
    });
    dispatch({
      type: types.IS_AUTHORIZATION_DISPLAY_NAME,
      data: false,
    });
    dispatch({
      type: types.SET_CUSTOMER_NAME,
      data: '',
    });
    dispatch(setSelectedECard(null));
    dispatch(setAvailableECards([]));
    dispatch(setECardLastQuery(null));
    dispatch(setECardLoading(false));
  };
}

export function saveOrderResult(res) {
  return (dispatch) => {
    dispatch({
      type: types.SAVE_ORDER_RESULT,
      result: res,
    });
  };
}

export function savePaymentId(id) {
  return (dispatch) => {
    dispatch({
      type: types.SET_PAYMENT_ID,
      paymentId: id,
    });
  };
}

export function notes(notes) {
  return (dispatch) => {
    dispatch({
      type: types.SET_ORDER_NOTES,
      notes,
    });
  };
}

export function customer(customer) {
  return (dispatch) => {
    dispatch({
      type: types.SET_ORDER_CUSTOMER,
      customer,
    });
  };
}

export function setAuthorizationDisplayName(isAuthorization) {
  return (dispatch) => {
    dispatch({
      type: types.IS_AUTHORIZATION_DISPLAY_NAME,
      data: isAuthorization,
    });
  };
}

export function setCustomerName(customerName) {
  return (dispatch) => {
    dispatch({
      type: types.SET_CUSTOMER_NAME,
      data: customerName,
    });
  };
}

export function setOrderStatus(status) {
  return (dispatch) => {
    dispatch({
      type: types.SET_ORDER_STATUS,
      status: status,
    });
  };
}

export function setOriginalItemList(itemList) {
  return (dispatch) => {
    dispatch({
      type: types.SET_ORIGINAL_ITEM_LIST,
      itemList: itemList,
    });
  };
}

export function saveTipAmount(tipAmount) {
  return (dispatch) => {
    dispatch({
      type: types.SAVE_TIP_AMOUNT,
      tipAmount: tipAmount,
    });
  };
}

export function saveTipFlowState(tipFlowState) {
  return (dispatch) => {
    dispatch({
      type: types.SAVE_TIP_FLOW_STATE,
      tipFlowState,
    });
  };
}

// 2.switch
export function getCurrentCategory(categoryId, type) {
  return (dispatch, getState) => {
    const isOpenBrand = getState().selfConfig?.configMap?.id_26;
    const categoryList = getState().currentCategoryList;
    for (let category of categoryList) {
      if (category.id == categoryId) {
        const menus = getState().brandSetting.brandMenu;
        const brandSaleCategory = menus
          .reduce((pre, cur) => {
            return pre.concat(cur.menuCategories);
          }, [])
          ?.find((each) => each.id === categoryId);
        const brandSaleItem = brandSaleCategory?.saleItems;

        dispatch({
          type: types.CURRENT_CATEGORY,
          currentCategory: category,
          // currentCategory: !isOpenBrand ? category : brandSaleCategory,
        });
        dispatch({
          type: types.TEMP_CURRENT_CATEGORY,
          tempCurrentCategory: category,
          // tempCurrentCategory: !isOpenBrand ? category : brandSaleCategory,
        });
        dispatch({
          type: types.TEMP_ITEM_LIST,
          tempItemList: getState().currentCategory.saleItems || [],
          // tempItemList: !isOpenBrand ? getState().currentCategory.saleItems || [] : brandSaleItem,
        });
        if (type === 'clickCategoryNav') {
          // dispatch({
          //   type: types.SEARCH_KEY_WORD,
          //   searchKeyWord: '',
          // });
        }
        if (!isOpenBrand) {
          dispatch({
            type: types.CURRENT_SALE_ITEMS,
            currentSaleItems:
              getState().searchKeyWord === ''
                ? getState().currentCategory.saleItems || []
                : getState().currentSaleItems,
          });
        } else {
          dispatch({
            type: types.CURRENT_SALE_ITEMS,
            currentSaleItems: brandSaleItem || [],
          });
        }
      }
    }
  };
}

export function clearCurrentCategory() {
  return (dispatch, getState) => {
    dispatch({
      type: types.CURRENT_CATEGORY,
      currentCategory: {},
    });
  };
}

export function getCurrentItem(itemId) {
  return (dispatch, getState) => {
    const saleItemList = getState().currentSaleItems;
    const currentCategory = getState().currentCategory;
    // const currentCategoryOptions = getState().currentCategory.options;
    const qtyQualifyingForZeroRated =
      getState().currentCategory.qtyQualifyingForZeroRated;
    for (let item of saleItemList) {
      if (item.id == itemId) {
        let tempItem = sortComboItemSections(Object.assign({}, item));

        if (currentCategory?.isFreeItemCategory) {
          const categoryList = getState().currentCategoryList;
          const category = categoryList.find(
            (_) => _.id === tempItem.oCategoryId
          );
          if (category && category.options && category.options.length > 0) {
            tempItem.categoryOptions = category.options;
          }
        } else if (
          currentCategory.options &&
          currentCategory.options.length > 0
        ) {
          tempItem.categoryOptions = currentCategory.options;
        }

        if (qtyQualifyingForZeroRated && qtyQualifyingForZeroRated.length > 0) {
          tempItem.qtyQualifyingForZeroRated = qtyQualifyingForZeroRated;
        }

        dispatch({
          type: types.CURRENT_ITEM,
          currentItem: tempItem,
        });
        break;
      }
    }
  };
}

export const setActivityCurrentItem = (data) => (dispatch, getState) => {
  const itemWithOptions = attachCategoryOptionsToItem(
    data,
    getState().currentCategoryList
  );
  dispatch({
    type: types.CURRENT_ITEM,
    currentItem: sortComboItemSections(itemWithOptions),
  });
};

export function clearCurrentItem() {
  return (dispatch) => {
    dispatch({
      type: types.CURRENT_ITEM,
      currentItem: {},
    });
  };
}
export function clearSearchKeyWord() {
  return (dispatch, getState) => {
    dispatch({
      type: types.SEARCH_KEY_WORD,
      searchKeyWord: '',
    });
  };
}

export function removeSearchItem() {
  return (dispatch, getState) => {
    dispatch({
      type: types.SAVESEARCHITEM,
      searchItem: [],
    });
  };
}

// 1. search
export function searchItemHandler(event) {
  const iptVal = event.toString().toUpperCase();
  return (dispatch, getState) => {
    dispatch({
      type: types.SEARCH_KEY_WORD,
      searchKeyWord: iptVal,
    });
    if (iptVal === '') {
      dispatch({
        type: types.CURRENT_CATEGORY,
        currentCategory: getState().tempCurrentCategory,
      });
      dispatch({
        type: types.CURRENT_SALE_ITEMS,
        currentSaleItems: getState().tempItemList,
      });
      dispatch({
        type: types.SAVESEARCHITEM,
        searchItem: [],
      });
    } else {
      const isOpenBrand = getState().selfConfig?.configMap?.id_26;
      const menus = getState().brandSetting.brandMenu;
      const brandCategory = menus.reduce((pre, cur) => {
        return pre.concat(cur.menuCategories);
      }, []);
      const numberRequire = getState().selfConfig?.configMap?.id_16;
      const tempSaleItems = [];
      const categoryList = isOpenBrand
        ? brandCategory
        : getState().currentCategoryList;
      for (let i = 0; i < categoryList.length; i++) {
        let categoryItems = categoryList[i].saleItems;
        if (categoryItems && categoryItems.length) {
          for (let j = 0; j < categoryItems.length; j++) {
            let itemName =
              getCurrentItemLanguage(
                categoryItems[j].fieldDisplayNameGroups,
                i18n.language
              ) || categoryItems[j].name;
            if (numberRequire) {
              itemName = `${categoryItems[j].itemNumber}.${itemName} `;
            }
            if (itemName?.toString()?.toUpperCase()?.indexOf(iptVal) > -1) {
              tempSaleItems.push(categoryList[i].saleItems[j]);
            }
          }
        } else {
          continue;
        }
      }
      dispatch({
        type: types.CURRENT_SALE_ITEMS,
        currentSaleItems: tempSaleItems,
      });
      dispatch({
        type: types.SAVESEARCHITEM,
        searchItem: tempSaleItems,
      });
    }
  };
}

// 设置会员商品列表展开状态
export const setExpandFreeList = (data) => ({
  type: types.EXPEND_FREELIST,
  data,
});

export const clearPayType = () => ({
  type: types.SAVE_PAYMENT_TYPE,
  paymentType: '',
});

export const appendPaymentTypeTrail = (paymentType) => ({
  type: types.APPEND_PAYMENT_TYPE_TRAIL,
  paymentType,
});

export const clearPaymentTypeTrail = () => ({
  type: types.CLEAR_PAYMENT_TYPE_TRAIL,
});

export const markPostPaymentAction = (actionName) => ({
  type: types.MARK_POST_PAYMENT_ACTION,
  actionName,
});

export const clearPostPaymentActions = () => ({
  type: types.CLEAR_POST_PAYMENT_ACTIONS,
});

export function payByCash() {
  return (dispatch) => {
    return new Promise((resolve) => {
      dispatch({
        type: types.SAVE_PAYMENT_TYPE,
        paymentType: 'CASH',
      });
      // 使用 setTimeout 确保状态更新完成
      setTimeout(() => resolve(), 0);
    });
  };
}

export function payByCard() {
  return (dispatch) => {
    return new Promise((resolve) => {
      dispatch({
        type: types.SAVE_PAYMENT_TYPE,
        paymentType: 'CREDIT_CARD',
      });
      // 使用 setTimeout 确保状态更新完成
      setTimeout(() => resolve(), 0);
    });
  };
}

export function payByGiftCard() {
  return (dispatch) => {
    dispatch({
      type: types.SAVE_PAYMENT_TYPE,
      paymentType: 'GIFT_CARD',
    });
    dispatch(appendPaymentTypeTrail('GIFT_CARD'));
  };
}

export function initSystemStore() {
  return (dispatch, getState) => {
    dispatch({
      type: types.RESET_ORDER,
      itemList: [],
    });
    dispatch({
      type: types.CURRENT_CATEGORY,
      currentCategory: {},
    });
    dispatch({
      type: types.CURRENT_SALE_ITEMS,
      currentSaleItems: [],
    });
    dispatch({
      type: types.INIT_ORDER_SEQUENCE,
      initSequence: 0,
    });
    dispatch({
      type: types.CLEAR_TOGO_OPTION,
      itemList: [],
    });
    dispatch({
      type: types.SETLOCATOR,
      data: '',
    });
  };
}

export function changeOrderType(orderType) {
  return (dispatch, getState) => {
    dispatch({
      type: types.ORDER_TYPE,
      orderType: orderType,
    });
    dispatchCurrentCategoryList(dispatch, getState);
  };
}

export function changePickupTime(pickupTime) {
  return (dispatch) => {
    dispatch({
      type: types.SET_PICKUP_TIME,
      pickupTime,
    });
  };
}

export function setEditOrderMode(itemInfo) {
  return (dispatch) => {
    dispatch({
      type: types.CURRENT_ITEM,
      currentItem: itemInfo,
    });
    dispatch({
      type: types.DEFAULT_CURRENT_COMBO,
      sectionDetail: itemInfo.sectionDetail,
    });
    dispatch({
      type: types.IS_ORDER_EDIT,
      isOrderEdit: true,
    });
  };
}
export function initEditOrderMode() {
  return (dispatch) => {
    dispatch({
      type: types.IS_ORDER_EDIT,
      isOrderEdit: false,
    });
  };
}

// 多属性删除，直接删除id下面，所有的菜
export function deleteAllById(data) {
  return (dispatch, getState) => {
    const { buyDiscountRule, isSkipPromotionCalculation } =
      getState().promotion;
    dispatch({
      type: types.DELETEALLBYID,
      data,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
  };
}

export const setkeyboardToggle = (data) => ({
  type: types.SETKEYBOARDTOGGLE,
  data,
});

// 自选套餐左侧栏下标信息
export const setSideNavIndex = (data) => ({ type: types.SIDENAVINDEX, data });

// 自选套餐左侧栏列表信息
export const setSideNavList = (data) => ({ type: types.SIDENAVLISTINFO, data });

// 删除自选套餐里面的小项菜的Items
export const removeFootItemComboSection = (data) => ({
  type: types.REMOVEDIYCOMBO,
  data,
});

// 删除自选套餐里面的小项里的options
export const removeFootOptComboSection = (data) => ({
  type: types.REMOVEDIYOPTCOMBO,
  data,
});

// 清空每一项下的菜下的所有Items
export const clearFootItemComboSection = (data) => ({
  type: types.CLEARDIYCOMBO,
  data,
});

// 非自选套餐，直接替换选中的菜品
export function replaceItemOrder(tempItem, sequence) {
  return (dispatch, getState) => {
    const state = getState();
    if (
      !isStockSufficient({
        itemInfo: tempItem,
        addQty: tempItem.quantity || 1,
        itemList: state.currentOrder.itemList,
        menuItemList: state.menuItemList,
        excludeSequence: sequence,
        currentOrderCombo: state.currentOrderCombo,
        crm: state.crm,
      })
    ) {
      showInsufficientStockToast();
      return false;
    }
    const orderSequence = state.orderSequence;
    const { buyDiscountRule, isSkipPromotionCalculation } = state.promotion;
    tempItem.sequence = orderSequence;
    if (!tempItem.remark || !tempItem.remark.optionName) {
      tempItem.remark = {
        optionName: '',
        optionType: 'NOTE',
        quantity: 1,
        price: 0,
      };
    }
    dispatch({
      type: types.REPLACE_TO_ORDER,
      data: {
        tempItem,
        sequence,
      },
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
    dispatch({
      type: types.ORDER_SEQUENCE,
      increaseInterval: 1,
    });
  };
}

// 自选套餐，全部替换原套餐
export function replaceComboOrder(comboObj, sequence) {
  return (dispatch, getState) => {
    const orderSequence = getState().orderSequence;
    const { buyDiscountRule, isSkipPromotionCalculation } =
      getState().promotion;
    comboObj.sequence = orderSequence;
    if (!comboObj.remark || !comboObj.remark.optionName) {
      comboObj.remark = {
        optionName: '',
        optionType: 'NOTE',
        quantity: 1,
        price: 0,
      };
    }
    dispatch({
      type: types.REPLACEORREDUCEOLDCOMBO,
      data: {
        comboObjInfo: comboObj,
        comboIdx: sequence,
      },
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
    dispatch({
      type: types.ORDER_SEQUENCE,
      increaseInterval: 1,
    });
  };
}

// 语言弹框开关
export const setLanModal = (data) => ({ type: types.SET_LANMODAL, data });

// 网络状态
export const setNetWorkStatus = (data) => ({
  type: types.SET_NETWORKTATUS,
  data,
});

// 语言弹框事件
export const setLanModalFn = (data) => ({ type: types.SET_LANMODALFN, data });

export const editOrderItemAction = (data) => {
  return (dispatch, getState) => {
    const state = getState();
    if (!data.isSub) {
      const item = state.currentOrder.itemList.find(
        (orderItem) => orderItem.sequence === data.deleteSequence
      );
      if (
        item &&
        !isStockSufficient({
          itemInfo: item,
          addQty: 1,
          itemList: state.currentOrder.itemList,
          menuItemList: state.menuItemList,
          currentOrderCombo: state.currentOrderCombo,
          crm: state.crm,
        })
      ) {
        showInsufficientStockToast();
        return false;
      }
    }
    const { buyDiscountRule, isSkipPromotionCalculation } = state.promotion;
    dispatch({
      type: types.EDIT_ORDER,
      data,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
    return true;
  };
};

// 多属性的菜品替换原先存储的数据
export function spliceOrderItemAction(data) {
  return (dispatch, getState) => {
    const state = getState();
    const { cloneItemList } = data;
    if (cloneItemList?.length) {
      const totalQty = cloneItemList.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      if (
        !isTotalQtyWithinStock({
          itemInfo: cloneItemList[0],
          totalQty,
          menuItemList: state.menuItemList,
          itemList: state.currentOrder.itemList,
          currentOrderCombo: state.currentOrderCombo,
          crm: state.crm,
        })
      ) {
        showInsufficientStockToast();
        return false;
      }
    }
    const { buyDiscountRule, isSkipPromotionCalculation } = state.promotion;
    dispatch({
      type: types.SPLICE_ORDER,
      data,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
    return true;
  };
}

// combo(size: itemPrices)根据id添加到currentOrderCombo数组中
export const addToComboSectionById = (data) => ({
  type: types.ADD_TO_SECTION_BYID,
  data,
});

// combo(-2, -3：options)逐个删除
export const removeOneOption = (data) => ({
  type: types.REMOVE_ONE_OPTIONS,
  data,
});

// combo(id > 0：单菜)逐个删除
export const removeItemsOneOption = (data) => ({
  type: types.REMOVE_ONE_ITEMS,
  data,
});

// combo(id > 0 缩略图)全部替换items
export const spliceAllComboItems = (data) => ({
  type: types.SPLICE_ALL_ITEMS,
  data,
});

// combo(id > 0：单菜) 多属性的菜品替换原先存储的数据
export const spliceSingleComboItems = (data) => ({
  type: types.SPLICE_SINGLE_ITEMS,
  data,
});

// 购物车，自选套餐编辑，存要编辑菜的数量
export const setEditComboQty = (data) => ({
  type: types.SETEDITCOMBOQTY,
  data,
});

// 配置项值
export const setSelfConfig = (data) => ({ type: types.SELF_CONFIG, data });

// 剔除订单中里面的售罄菜
export function spliceOrderBySoldout(soldoutIds) {
  return (dispatch, getState) => {
    const state = getState();
    const {
      buyDiscountRule,
      buyGifts = [],
      isSkipPromotionCalculation,
    } = state.promotion;
    const currentOrderItems = state.currentOrder?.itemList || [];
    const selectedFreeItem = state.crm?.selectedFreeItem || [];
    const tempCampaign = state.crm?.tempCampaign;
    const tempCampaignList = Array.isArray(tempCampaign)
      ? tempCampaign
      : tempCampaign
        ? [tempCampaign]
        : [];

    const soldoutItems = (soldoutIds || []).map((entry) =>
      typeof entry === 'object'
        ? entry
        : {
            id: entry,
            sequence: undefined,
          }
    );

    const isMatchedWithSoldout = (item) =>
      soldoutItems.some((soldout) => {
        if (soldout?.sequence != null && item?.sequence != null) {
          return (
            String(item.sequence) === String(soldout.sequence) &&
            String(item.id) === String(soldout.id)
          );
        }
        const soldoutId = soldout?.id;
        return (
          (soldoutId != null && String(item?.id) === String(soldoutId)) ||
          (soldoutId != null && String(item?.oId) === String(soldoutId)) ||
          (soldout?.cloudId && item?.cloudId === soldout.cloudId)
        );
      });

    dispatch({
      type: types.SPLICEORDERBYSOLDOUT,
      data: soldoutIds,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });

    // 若售罄剔除涉及赠菜/活动菜，同步清理 CRM 选中态，避免后续出现「只能兑换一个商品」。
    const hasRemovedFreeInOrder = currentOrderItems.some(
      (item) => item?.isFreeItem && isMatchedWithSoldout(item)
    );
    const hasRemovedSelectedFree = selectedFreeItem.some(isMatchedWithSoldout);
    const hasRemovedTempCampaign = tempCampaignList.some(isMatchedWithSoldout);

    if (
      hasRemovedFreeInOrder ||
      hasRemovedSelectedFree ||
      hasRemovedTempCampaign
    ) {
      dispatch(crm.changeFreeItem([]));
      dispatch(crm.setTempCampaign(null));
    }

    const nextBuyGifts = buyGifts
      .map((giftRule) => ({
        ...giftRule,
        items: (giftRule?.items || []).filter(
          (item) => !isMatchedWithSoldout(item)
        ),
      }))
      .filter((giftRule) => giftRule.items.length > 0);
    if (
      nextBuyGifts.length !== buyGifts.length ||
      nextBuyGifts.some(
        (giftRule, index) =>
          giftRule.items.length !== buyGifts[index]?.items?.length
      )
    ) {
      dispatch({ type: types.SET_BUY_GIFTS, data: nextBuyGifts });
    }
  };
}
export function addCampaignItemsToOrder(items) {
  return (dispatch, getState) => {
    const { buyDiscountRule, isSkipPromotionCalculation } =
      getState().promotion;
    dispatch({
      type: types.ADD_CAMPAIGN_ITEMS_TO_ORDER,
      data: items,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
  };
}
export function removeRewardItemFromList() {
  return (dispatch, getState) => {
    const { buyDiscountRule, isSkipPromotionCalculation } =
      getState().promotion;
    dispatch({
      type: types.REMOVE_REWARD_ITEM_FROM_ORDER,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
  };
}

export function removeItemRewardInfoFromOrder() {
  return (dispatch, getState) => {
    const { buyDiscountRule, isSkipPromotionCalculation } =
      getState().promotion;
    dispatch({
      type: types.REMOVE_ITEM_REWARD_INFO,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
  };
}

export function removeLocalPromotionRewardInfo() {
  return (dispatch, getState) => {
    const { buyDiscountRule, isSkipPromotionCalculation } =
      getState().promotion;
    dispatch({
      type: types.REMOVE_LOCAL_PROMOTION_REWARD_INFO,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
  };
}

export const removeManualSelectRewardItemFromOrder = () => ({
  type: types.REMOVE_MANUAL_SELECT_REWARD_ITEM,
});

// 设置当前是否为，重新下单状态
export const setIsReorderFlag = (data) => ({
  type: types.SETISREORDERFLAG,
  data,
});

// 设置当前送餐类型
export const setTabelServiceType = (data) => ({
  type: types.SETTABELSERVICETYPE,
  data,
});

// 设置kioskConfigUserId
export const setKioskConfigUserId = (data) => ({
  type: types.SETKIOSKCONFIGUSERID,
  data,
});

// 设置moby设备连接状态
export const setMobyDeviceLinkStatus = (data) => ({
  type: types.MOBY_DEVICE_LINK_STATUS,
  data,
});

// 设置moby设备信息
export const setMobyDeviceInfo = (data) => ({
  type: types.MOBY_DEVICE_INFO,
  data,
});

// 设置tripos支付准备好状态
export const setTriposPayReady = (data) => ({
  type: types.TRIPOS_PAY_READY,
  data,
});

// 设置tripos刷卡动作完成状态
export const setTriposPayFinish = (data) => ({
  type: types.TRIPOS_PAY_FINISH,
  data,
});

// 设置封面图
export const setImg = (data) => ({ type: types.SET_IMG, data });

// 设置Logo
export const setLogo = (data) => ({ type: types.SET_LOGO, data });

// 设置Banner
export const setBanner = (data) => ({ type: types.SET_BANNER, data });

// 设置Banner展示状态
export const setShowBanner = (data) => ({ type: types.SET_SHOW_BANNER, data });

// 设置bannerPro 配置值
export const setBannerPro = (data) => ({ type: types.SET_BANNERPRO, data });

// 设置BannerPro展示状态
export const setShowBannerPro = (data) => ({
  type: types.SET_SHOW_BANNERPRO,
  data,
});

// 设置等待时间弹窗展示状态
export const setShowWaitingTimeModal = (data) => ({
  type: types.SET_SHOW_WAITING_TIME_MODAL,
  data,
});

// 设置登陆引导展示状态
export const setShowLoginGuideDialog = (data) => ({
  type: types.SET_SHOW_LOGINGUIDEDIALOG,
  data,
});

// 设置screensaver展示状态
export const setShowScreensaver = (data) => ({
  type: types.SET_SCREENSAVER,
  data,
});

// 设置togo的加收项
export const setTogoOption = (data) => ({ type: types.SET_TOGO_OPTION, data });

// 清空togo的加收项
export const clearTogoOption = () => ({ type: types.CLEAR_TOGO_OPTION });

// 保存刷卡后的返回结果
export const setCardPaidResult = (data) => ({
  type: types.SET_CARD_RESULT,
  data,
});

export const setGiftCardPaymentInfo = (data) => ({
  type: types.SET_GIFT_CARD_PAYMENT_INFO,
  data,
});

// 设置ws是否连接状态
export const setConnectWs = (data) => ({ type: types.PP_WS, data });

// 设置是否更新菜单标识
export const setIsMenuUpdated = (data) => ({ type: types.ISMENUUPDATED, data });

// 当前店铺制作杯数
export const setMakingCupNum = (data) => ({ type: types.MAKINGCUPNUM, data });

// 记录category组类，滚动高度
export const setCateyPageDomTop = (data) => ({
  type: types.SETCATEYPAGEDOMTOP,
  data,
});

// 记录orderPage页面，滚动高度
export const setorderPageDomTop = (data) => ({
  type: types.SETORDERPAGEDOMTOP,
  data,
});

// 设置menu组更新loading
export const setUpdateMenuLoad = (data) => ({ type: types.MENULOAD, data });

// 设置选择的品牌
export const setSelectedBrand = (data) => ({ type: types.SELECTEDBRAND, data });

// 设置品牌过滤后的menu
export const setBrandMenu = (data) => ({ type: types.BRANDMENU, data });

// 记录vList滚动高度
export const setVListScroll = (data) => ({
  type: types.SETVLISTSCROLLHEIGHT,
  data,
});

// 设置promotion计算状态
export const changeSkipPromotionCalculationStatus = (data) => ({
  type: types.CHANGE_SKIP_PROMOTION_CALCULATION_STATUS,
  data,
});

// 重新计算原订单信息 - 用于promotion/crm 互斥后重新计算订单信息
export const recalculatePromotion = () => {
  return (dispatch, getState) => {
    // 整单折扣通过 isSkipPromotionCalculation 字段来判断
    // 删除赠菜
    dispatch({ type: types.SET_BUY_GIFTS, data: [] });
    // 对于买折菜，不能删除 只能重新计算价格，避免买1件就有折扣时
    const { buyDiscountRule, isSkipPromotionCalculation } =
      getState().promotion;
    // 重新计算整个下单菜品数据,主要用于买折和会员活动互斥
    dispatch({
      type: types.RECOUNT_CURRENT_ORDER_LIST,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
  };
};

export const recountCurrentOrderList = () => {
  return (dispatch, getState) => {
    const { buyDiscountRule, isSkipPromotionCalculation } =
      getState().promotion;
    // 重新计算整个下单菜品数据,主要用于买折和会员活动互斥
    dispatch({
      type: types.RECOUNT_CURRENT_ORDER_LIST,
      buyDiscountRule,
      isSkipPromotionCalculation,
    });
  };
};

export { crm };

export const setCateDish = (data) => ({ type: types.STANDARD_CATE_DISH, data });
export const setAllMenu = (data) => ({ type: types.SET_ALL_MENU, data });

export const setLocator = (data) => ({ type: types.SETLOCATOR, data });

// 折扣列表
export const setSequenceNumber = (data) => ({
  type: types.SET_ORDER_SEQUENCE,
  data,
});

// 记录license list
export const setLicenseList = (data) => ({ type: types.SYSTEM_LICENSE, data });

export const setTableId = (data) => ({ type: types.SET_TABLE_ID, data });

export const setNumOfGuests = (numOfGuests) => ({
  type: types.SET_NUM_OF_GUESTS,
  numOfGuests,
});

export const removeFreeItemInOrder = (data) => ({
  type: types.REMOVE_FREE_ITEM_IN_ORDER,
  data,
});

export const changeCheckFooterVisible = (data) => ({
  type: types.CHANGE_CHECK_FOOTER_VISIBLE,
  data,
});

export const recordKioskDiscountPromotion = (data) => ({
  type: types.RECORD_KIOSK_DISCOUNT_PROMOTION,
  data,
});

// 设置eCard配置
export const setECardSettings = (data) => ({
  type: types.SET_ECARD_SETTINGS,
  data,
});

// 设置选中的礼品卡
export const setECardQuickAmounts = (data) => ({
  type: types.SET_ECARD_QUICK_AMOUNTS,
  data,
});

export const setECardCloudGiftCardItem = (data) => ({
  type: types.SET_ECARD_CLOUD_GIFT_CARD_ITEM,
  data,
});

export const setSelectedECard = (data) => ({
  type: types.SET_SELECTED_ECARD,
  data,
});

export const fetchCloudGiftCardItem = () => async (dispatch) => {
  try {
    const response = await fetchAllMenu();
    const cloudGiftCardItem =
      response?.data?.menus
        ?.flatMap((menu) => menu?.menuGroups || [])
        ?.find((group) => group?.name === 'Cloud Gift Card')
        ?.menuCategories?.[0]?.saleItems?.[0] || null;

    dispatch(setECardCloudGiftCardItem(cloudGiftCardItem));
    return {
      success: true,
      data: cloudGiftCardItem,
    };
  } catch (error) {
    dispatch(setECardCloudGiftCardItem(null));
    return {
      success: false,
      error,
    };
  }
};

export const setAvailableECards = (data) => ({
  type: types.SET_AVAILABLE_ECARDS,
  data,
});

export const setECardLastQuery = (data) => ({
  type: types.SET_ECARD_LAST_QUERY,
  data,
});

export const setECardLoading = (data) => ({
  type: types.SET_ECARD_LOADING,
  data,
});

export const clearECardState = () => (dispatch) => {
  dispatch(setSelectedECard(null));
  dispatch(setAvailableECards([]));
  dispatch(setECardLastQuery(null));
  dispatch(setECardLoading(false));
};

const buildECardQueryParams = ({
  cardSearchType,
  phoneNum,
  cardNum,
  emailAddress,
}) => {
  if (cardSearchType === CARD_NUMBER) {
    return { cardNumber: cardNum };
  }
  if (cardSearchType === PHONE_NUMBER) {
    const cleanPhoneNum = (phoneNum || '').replace(/[()\s-]/g, '');
    return { to: `+1${cleanPhoneNum}` };
  }
  if (cardSearchType === EMAIL) {
    return { to: emailAddress };
  }
  return {};
};

export const fetchAvailableECards =
  (queryInfo, options = {}) =>
  async (dispatch) => {
    const { excludeCardNumber, preserveLastQuery = true } = options;
    const exactCardNumber =
      queryInfo?.cardSearchType === CARD_NUMBER
        ? String(queryInfo?.cardNum || '').trim()
        : '';

    if (preserveLastQuery) {
      dispatch(setECardLastQuery(queryInfo));
    }

    dispatch(setECardLoading(true));

    try {
      const params = buildECardQueryParams(queryInfo);
      const response = await searchECardCards(params);
      const availableCards = (response?.data?.data || []).filter(
        (card) =>
          (Number(card?.balance) || 0) > 0 &&
          (!exactCardNumber ||
            String(card?.cardNumber || '').trim() === exactCardNumber) &&
          (!excludeCardNumber || card?.cardNumber !== excludeCardNumber)
      );

      dispatch(setAvailableECards(availableCards));
      return {
        success: true,
        cards: availableCards,
      };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || 'Query failed';
      dispatch(setAvailableECards([]));
      return {
        success: false,
        errorMsg,
      };
    } finally {
      dispatch(setECardLoading(false));
    }
  };
