import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import { compare } from '@/utils';
import { combineReducers } from 'redux';
import {
  ADD_CAMPAIGN_ITEMS_TO_ORDER,
  ADD_COMBO_TO_ORDER,
  CHANGE_CHECK_FOOTER_VISIBLE,
  DELETEALLBYID,
  EDIT_ORDER,
  IS_AUTHORIZATION_DISPLAY_NAME,
  ORDER_TYPE,
  RECOUNT_CURRENT_ORDER_LIST,
  REMOVE_FREE_ITEM_IN_ORDER,
  REMOVE_ITEM_FROM_ORDER,
  REMOVE_ITEM_REWARD_INFO,
  REMOVE_LOCAL_PROMOTION_REWARD_INFO,
  REMOVE_MANUAL_SELECT_REWARD_ITEM,
  REMOVE_PROMOTION_DISCOUNT_ITEM,
  REMOVE_REWARD_ITEM_FROM_ORDER,
  REPLACE_TO_ORDER,
  REPLACEORREDUCEOLDCOMBO,
  RESET_ITEM_LIST,
  RESET_ORDER,
  SAVE_ORDER_RESULT,
  SAVE_PAYMENT_TYPE,
  APPEND_PAYMENT_TYPE_TRAIL,
  CLEAR_PAYMENT_TYPE_TRAIL,
  MARK_POST_PAYMENT_ACTION,
  CLEAR_POST_PAYMENT_ACTIONS,
  SAVE_TIP_AMOUNT,
  SAVE_TIP_FLOW_STATE,
  SET_CUSTOMER_NAME,
  SET_ORDER_CUSTOMER,
  SET_ORDER_NOTES,
  SET_ORDER_STATUS,
  SET_ORIGINAL_ITEM_LIST,
  SET_PAYMENT_ID,
  SET_PICKUP_TIME,
  SET_TABLE_ID,
  SET_NUM_OF_GUESTS,
  SETLOCATOR,
  SETTABELSERVICETYPE,
  SPLICE_ORDER,
  SPLICEORDERBYSOLDOUT,
} from '@/constants/actionTypes';
import { handleResolveList } from '@/utils/handleResolveList';

const initState = {
  orderType: '',
  itemList: [],
  saveOrderResult: {},
  orderStatus: '',
  paymentId: '',
  originalItemList: [],
  tipAmount: 0,
  tipFlowState: {
    completedBeforePaymentMethod: false,
    selection: null,
  },
  paymentType: '',
  paymentTypeTrail: [],
  postPaymentActions: {
    kitchenSent: false,
    newOrderMessageSent: false,
    callTicketPrinted: false,
    signatureSubmitted: false,
    paymentReceiptPrinted: false,
    tipApplied: false,
  },
  notes: '',
  pickupTime: '',
  customer: {
    firstName: '',
    phone: [{}],
  },
  tabelServiceType: '',
  locator: '',
  tableId: null,
  isAuthorizationDisplayName: false,
  IS_AUTHORIZATION_DISPLAY_NAME,
  // 兼容kds customerName
  customerName: '',
  // 是否展示orderPage和orderReview的footer
  isShowCheckFooter: true,
  numOfGuests: null,
};

function itemList(state = initState.itemList, action) {
  switch (action.type) {
    // 加入购物车
    case ADD_COMBO_TO_ORDER:
      // 购物车添加菜单，相同则合并菜品，不同则追加
      return compareItemList(
        action.comboInfo,
        action.buyDiscountRule,
        state,
        action.isSkipPromotionCalculation
      );
    // 点击菜减号, 弹窗中 删除所有菜
    case DELETEALLBYID:
      const foodList = [...state];
      const { foodId } = action.data;
      for (let g = 0; g < foodList.length; g++) {
        if (foodList[g].id == foodId) {
          foodList.splice(g, 1);
          g--;
        }
      }
      return handleResolveList(
        foodList,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    // 点击菜的减号 弹窗 删除部分菜
    case SPLICE_ORDER:
      const tempStateList = [...state];
      const { id, cloneItemList } = action.data;
      // 克隆数组的sequence集合
      const cloneSequenceList = cloneItemList.map((c) => c.sequence);
      for (let i = 0; i < tempStateList.length; i++) {
        // 先删除，克隆数组里面不包含的菜品
        if (
          id == tempStateList[i].id &&
          !cloneSequenceList.includes(tempStateList[i].sequence)
        ) {
          tempStateList.splice(i, 1);
          i--;
        }
      }
      // 当id和sequence相同，则替换掉
      for (let k = 0; k < cloneItemList.length; k++) {
        let idx = tempStateList.findIndex((t) => {
          return id == t.id && t.sequence == cloneItemList[k].sequence;
        });
        if (idx > -1) {
          tempStateList.splice(idx, 1, cloneItemList[k]);
          continue;
        }
      }
      return handleResolveList(
        tempStateList,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    // orderReview 页上加减
    case EDIT_ORDER:
      // 删除（或添加+、-）属性不同的，但是同种类型的菜品
      let temp = {};
      let tempIndex = -1;
      const tempState = [...state];
      const { deleteSequence, isSub } = action.data;
      for (let i = 0; i < tempState.length; i++) {
        if (tempState[i].sequence == deleteSequence) {
          temp = tempState[i];
          tempIndex = i;
          break;
        }
      }
      if (temp) {
        if (isSub) {
          if (temp.quantity > 1) {
            temp.quantity--;
          } else {
            // 删除当前
            tempState.splice(tempIndex, 1);
          }
        } else {
          temp.quantity++;
        }
      }
      return handleResolveList(
        tempState,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    case RESET_ORDER:
      return [];
    // orderPage 减号 删除只有一个的菜品
    case REMOVE_ITEM_FROM_ORDER:
      const itemId = action.itemId;
      const itemList = Object.assign([], state);
      for (let i = itemList.length - 1; i >= 0; i--) {
        const item = itemList[i];
        if (item.id == itemId) {
          if (item.quantity > 1) item.quantity--;
          else itemList.splice(i, 1);
          break;
        }
      }
      return handleResolveList(
        itemList,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    case RESET_ITEM_LIST:
      return [];
    case REMOVE_FREE_ITEM_IN_ORDER:
      const { freeItemId } = action.data;
      return state.filter(
        (each) =>
          !(
            each.id === freeItemId &&
            (each.isFreeItem || each.isCRMFreeItem)
          )
      );
    // OrderDetailModal 菜品弹窗的确认修改
    case REPLACE_TO_ORDER:
      const list = Object.assign([], state);
      const { tempItem, sequence } = action.data;
      // 获取所在的下标
      let idx = list.findIndex((f) => f.sequence == sequence);
      if (idx > -1) {
        // 直接替换
        list.splice(idx, 1, tempItem);
      }
      return handleResolveList(
        list,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    // combo panel 菜品处理
    case REPLACEORREDUCEOLDCOMBO:
      const oldCombo = Object.assign([], state);
      const { comboObjInfo, comboIdx } = action.data;
      // 获取所在的下标
      let comIdx = oldCombo.findIndex((f) => f.sequence == comboIdx);
      if (comIdx > -1) {
        // 直接替换
        oldCombo.splice(comIdx, 1, comboObjInfo);
      }
      return handleResolveList(
        oldCombo,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    case SPLICEORDERBYSOLDOUT:
      const orderList = cloneDeep(Object.assign([], state));
      // 售罄项（sequence 优先，id 兜底）；兼容历史仅传 id 数组
      const soldoutItems = (action.data || []).map((entry) =>
        typeof entry === 'object'
          ? entry
          : {
              id: entry,
              sequence: undefined,
            }
      );
      for (let j = 0; j < orderList.length; j++) {
        const shouldRemove = soldoutItems.some((soldout) => {
          if (soldout?.sequence != null) {
            return (
              String(orderList[j]?.sequence) === String(soldout.sequence) &&
              String(orderList[j]?.id) === String(soldout.id)
            );
          }
          return String(orderList[j]?.id) === String(soldout?.id);
        });
        if (shouldRemove) {
          orderList.splice(j, 1);
          j--;
        }
      }
      return handleResolveList(
        orderList,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    case REMOVE_PROMOTION_DISCOUNT_ITEM:
      return removePromotionDiscountItem(cloneDeep(state));
    case ADD_CAMPAIGN_ITEMS_TO_ORDER:
      // 传递全量itemList
      const newItemList = cloneDeep(action.data);
      return handleResolveList(
        newItemList,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    case REMOVE_REWARD_ITEM_FROM_ORDER:
      const normalItems = removeRewardItemFromOrder([...state]);
      return handleResolveList(
        normalItems,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    case RECOUNT_CURRENT_ORDER_LIST:
      const currentOrderList = cloneDeep(Object.assign([], state));
      return handleResolveList(
        currentOrderList,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    case REMOVE_ITEM_REWARD_INFO:
      const itemListWithoutReward = removeRewardItemInfo([...state]);
      return handleResolveList(
        itemListWithoutReward,
        action.buyDiscountRule,
        action.isSkipPromotionCalculation
      );
    case REMOVE_LOCAL_PROMOTION_REWARD_INFO:
      return removeLocalPromotion([...state]);
    case REMOVE_MANUAL_SELECT_REWARD_ITEM:
      return removeManualSelectRewardItem([...state]);
    default:
      return state;
  }
}

// 移除奖励菜品的奖励信息
const removeRewardItemInfo = (allItems) => {
  return allItems
    .filter((e) => !e.manualSelectRewardDiscount)
    .map((each) => {
      const isRewardItem = each.promotionRewardItem;
      return !isRewardItem
        ? each
        : {
            ...each,
            actualDiscount: undefined,
            orderDiscountInfo: undefined,
            itemDiscountInfo: undefined,
            promotionRewardItem: undefined,
            //manualSelectRewardDiscount: undefined,
            // campaignRewardItem: undefined,
            // isCRMIntegrationSpecialItem: undefined,
            // isCRMIntegrationBundleDiscountItem: undefined,
          };
    });
};

// 删除手动选赠菜
const removeManualSelectRewardItem = (allItems) => {
  return allItems.filter((e) => !e.manualSelectRewardDiscount);
};

// 移除奖励菜品
const removeRewardItemFromOrder = (allItems) => {
  return allItems.filter((each) => !each.campaignRewardItem);
};

// 删除promotion买折菜
const removePromotionDiscountItem = (itemList) => {
  const kioskPromotionDiscountItem = itemList.find(
    (each) =>
      each.discountID === -1 && each.discountName === 'promotion discount'
  );
  return itemList.filter(
    (item) => item.sequence !== kioskPromotionDiscountItem?.sequence
  );
};

// 本地促销相关内容删除
const removeLocalPromotion = (itemList) => {
  const itemWithoutLocalRewardInfo = itemList.map((each) => {
    delete each.discountRate;
    delete each.discount;
    delete each.tempId;
    delete each.discountID;
    delete each.discountRateType;
    delete each.secondHalfInfo;
    return each;
  });
  return itemWithoutLocalRewardInfo;
};

// 对比是否购物车有相同的菜品
const compareItemList = (
  newItem,
  buyDiscountRule,
  allList,
  isSkipPromotionCalculation
) => {
  // 用于对比菜品
  const cloneNewItem = cloneDeep(newItem);
  delete cloneNewItem.sequence;
  delete cloneNewItem.quantity;
  // 如果是自选套餐，先将子菜sectionDetail排序，方便比对
  if (
    cloneNewItem.itemType !== 'SALE_ITEM' &&
    cloneNewItem?.comboType !== 'FIXED_SELECTION'
  ) {
    if (cloneNewItem.sectionDetail?.length) {
      cloneNewItem.sectionDetail.forEach((n) => {
        if (n.id > 0 && n.items?.length) {
          n.items.sort(compare('id_sizeId'));
        }
      });
    }
  }

  const cloneAllList = cloneDeep(allList);
  cloneAllList.forEach((l) => {
    delete l.sequence;
    delete l.quantity;
    // 如果是自选套餐，先将子菜sectionDetail排序，方便比对
    if (l.itemType !== 'SALE_ITEM' && l?.comboType !== 'FIXED_SELECTION') {
      if (l.sectionDetail?.length) {
        l.sectionDetail.forEach((n) => {
          if (n.id > 0 && n.items?.length) {
            n.items.sort(compare('id_sizeId'));
          }
        });
      }
    }
  });

  if (cloneAllList.length) {
    for (let i = 0; i < cloneAllList.length; i++) {
      if (cloneNewItem.id == cloneAllList[i].id) {
        // 每次添加菜，一个个对比，看是否存在一样的菜品
        const omitItem = omit(cloneAllList[i], [
          'quantity',
          'sequence',
          'totalPrice',
          'tempId',
          'secondHalfInfo',
        ]);
        let isSame = isEqual(cloneNewItem, omitItem);
        if (isSame) {
          allList[i].quantity += newItem.quantity;
          break;
        } else {
          if (i == cloneAllList.length - 1) {
            allList.push(newItem);
          }
        }
      } else {
        if (i == cloneAllList.length - 1) {
          allList.push(newItem);
        }
      }
    }
  } else {
    allList.push(newItem);
  }

  const finalList = handleResolveList(
    allList,
    buyDiscountRule,
    isSkipPromotionCalculation
  );

  return [...finalList];
};

function saveOrderResult(state = initState.saveOrderResult, action) {
  switch (action.type) {
    case SAVE_ORDER_RESULT:
      return action.result;
    case RESET_ORDER:
      return {};
    default:
      return state;
  }
}

function notes(state = initState.notes, action) {
  switch (action.type) {
    case SET_ORDER_NOTES:
      return action.notes;
    case RESET_ORDER:
      return '';
    default:
      return state;
  }
}

function pickupTime(state = initState.pickupTime, action) {
  switch (action.type) {
    case SET_PICKUP_TIME:
      return action.pickupTime;
    default:
      return state;
  }
}

function customer(state = initState.customer, action) {
  switch (action.type) {
    case SET_ORDER_CUSTOMER:
      return action.customer;
    case RESET_ORDER:
      return {
        firstName: '',
        phone: [{}],
      };
    default:
      return state;
  }
}

function savePaymentId(state = initState.paymentId, action) {
  switch (action.type) {
    case SET_PAYMENT_ID:
      return action.paymentId;
    case RESET_ORDER:
      return '';
    default:
      return state;
  }
}

function removeZeroQtyItems(itemList) {
  for (let i = itemList.length - 1; i >= 0; i--) {
    if (itemList[i].quantity == 0) {
      itemList.splice(i, 1);
    }
  }
  return itemList;
}

function orderType(state = initState.orderType, action) {
  switch (action.type) {
    case ORDER_TYPE:
      return action.orderType;
    case RESET_ORDER:
      return '';
    default:
      return state;
  }
}

function orderStatus(state = initState.orderStatus, action) {
  switch (action.type) {
    case SET_ORDER_STATUS:
      return action.status;
    case RESET_ORDER:
      return '';
    default:
      return state;
  }
}

function originalItemList(state = initState.originalItemList, action) {
  switch (action.type) {
    case SET_ORIGINAL_ITEM_LIST:
      return action.itemList;
    default:
      return state;
  }
}

function tipAmount(state = initState.tipAmount, action) {
  switch (action.type) {
    case SAVE_TIP_AMOUNT:
      return action.tipAmount;
    case RESET_ORDER:
      return 0;
    default:
      return state;
  }
}

function tipFlowState(state = initState.tipFlowState, action) {
  switch (action.type) {
    case SAVE_TIP_FLOW_STATE:
      return {
        ...state,
        ...action.tipFlowState,
      };
    case RESET_ORDER:
      return initState.tipFlowState;
    default:
      return state;
  }
}

function paymentType(state = initState.paymentType, action) {
  switch (action.type) {
    case SAVE_PAYMENT_TYPE:
      return action.paymentType;
    case RESET_ORDER:
      return '';
    default:
      return state;
  }
}

function paymentTypeTrail(state = initState.paymentTypeTrail, action) {
  switch (action.type) {
    case APPEND_PAYMENT_TYPE_TRAIL:
      if (!action.paymentType) return state;
      if (state.includes(action.paymentType)) return state;
      return [...state, action.paymentType].slice(0, 2);
    case CLEAR_PAYMENT_TYPE_TRAIL:
    case RESET_ORDER:
      return [];
    default:
      return state;
  }
}

function postPaymentActions(state = initState.postPaymentActions, action) {
  switch (action.type) {
    case MARK_POST_PAYMENT_ACTION:
      if (!action.actionName) return state;
      return {
        ...state,
        [action.actionName]: true,
      };
    case CLEAR_POST_PAYMENT_ACTIONS:
    case RESET_ORDER:
      return initState.postPaymentActions;
    default:
      return state;
  }
}

function tabelServiceType(state = initState.tabelServiceType, action) {
  switch (action.type) {
    case SETTABELSERVICETYPE:
      return action.data;
    default:
      return state;
  }
}

function locator(state = initState.locator, action) {
  switch (action.type) {
    case SETLOCATOR:
      return action.data;
    default:
      return state;
  }
}

function tableId(state = initState.tableId, action) {
  switch (action.type) {
    case SET_TABLE_ID:
      return action.data;
    default:
      return state;
  }
}

function numOfGuests(state = initState.numOfGuests, action) {
  switch (action.type) {
    case SET_NUM_OF_GUESTS:
      return action.numOfGuests;
    case RESET_ORDER:
      return null;
    default:
      return state;
  }
}

function isAuthorizationDisplayName(
  state = initState.isAuthorizationDisplayName,
  action
) {
  switch (action.type) {
    case IS_AUTHORIZATION_DISPLAY_NAME:
      return action.data;
    default:
      return state;
  }
}

function customerName(state = initState.customerName, action) {
  switch (action.type) {
    case SET_CUSTOMER_NAME:
      return action.data;
    default:
      return state;
  }
}

function isShowCheckFooter(state = initState.isShowCheckFooter, action) {
  switch (action.type) {
    case CHANGE_CHECK_FOOTER_VISIBLE:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  itemList,
  orderType,
  saveOrderResult,
  orderStatus,
  savePaymentId,
  notes,
  pickupTime,
  customer,
  originalItemList,
  tipAmount,
  tipFlowState,
  paymentType,
  paymentTypeTrail,
  postPaymentActions,
  tabelServiceType,
  locator,
  tableId,
  numOfGuests,
  isAuthorizationDisplayName,
  customerName,
  isShowCheckFooter,
});
