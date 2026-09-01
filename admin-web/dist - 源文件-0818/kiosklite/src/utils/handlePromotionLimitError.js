import store from '@/reducers/store';
import {
  setIsReorderFlag,
  removeItemRewardInfoFromOrder,
  recalculatePromotion,
  updatePromotionDealsInMenuGroup,
} from '@/actions';
import {
  setItemValidPromotion,
  setCloudPromotionList,
} from '@/actions/promotion';
import Toast from '@/component/toast';
import i18n from '@/assets/i18n/i18n';

/**
 * 处理促销达到上限错误，执行重新下单流程
 * @param {Object} history - React Router history 对象
 */
export const handlePromotionLimitError = (history) => {
  // 如果没有 history 对象，直接跳转到首页
  if (!history) {
    window.location.hash = '/';
    return;
  }

  // 上限提示
  Toast.info(i18n.t('promotion-reward-limited'), 2000);
  // 在清空 itemValidPromotion 之前，过滤上限的促销活动，不展示
  const state = store.getState();
  const itemValidPromotion = state?.promotion?.itemValidPromotion;
  const promotionCenterList = state?.promotion?.promotionCenterList;

  // 找到当前选中上限了的促销项
  const selectedPromotion = itemValidPromotion?.find((e) => e.isSelected);

  // 留存limit错误的活动id后，先删除命中的信息，再删除菜的参与促销标记，最后更新列表，顺序不可动
  store.dispatch(setItemValidPromotion(null));
  store.dispatch(removeItemRewardInfoFromOrder());
  store.dispatch(recalculatePromotion());

  if (selectedPromotion?.promotion?.id && promotionCenterList) {
    const selectedPromotionId = selectedPromotion.promotion.id;

    // 过滤promotionCenterList里 id 等于选中促销 id 的项
    const updatedPromotionCenterList = promotionCenterList.filter(
      (item) => item.id !== selectedPromotionId
    );

    // 保存更新后的 promotionCenterList
    store.dispatch(setCloudPromotionList(updatedPromotionCenterList));
    store.dispatch(updatePromotionDealsInMenuGroup());
  }

  store.dispatch(setIsReorderFlag(true));

  // 延迟执行跳转
  setTimeout(() => {
    history.goBack();
  }, 0);
};

/**
 * 检查 saveOrder 响应中的错误，如果是促销达到上限错误则处理
 * @param {Object} res - saveOrder 的响应对象
 * @param {Object} history - React Router history 对象
 * @returns {boolean} 如果是促销达到上限错误并已处理，返回 true；否则返回 false
 */
export const checkAndHandlePromotionLimitError = (res, history) => {
  const failureReason = res?.data?.result?.failureReason;
  if (failureReason === 'PROMOTION_HAS_REACHED_LIMIT') {
    handlePromotionLimitError(history);
    return true;
  }
  return false;
};
