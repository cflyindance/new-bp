export const isHasCRMCampaignFn = ({
  itemList,
  selectedFreeItem,
  selectedDiscount,
}) => {
  // 从积分活动菜单添加的赠品
  const freeItemInOrder = itemList.find((item) => item.isFreeItem) || {};
  if (itemList.length > 0 && Object.keys(freeItemInOrder)?.length > 0)
    return freeItemInOrder;
  // 活动页面选择的赠品
  if (selectedFreeItem?.length > 0) return selectedFreeItem[0];
  // 活动页面选择的特价优惠, m件n折商品
  const rewardItemInOrder = itemList.filter(
    (each) =>
      each.isCRMIntegrationBundleDiscountItem ||
      each.isCRMIntegrationSpecialItem
  );
  if (rewardItemInOrder?.length > 0) return rewardItemInOrder?.[0];
  // 活动页面选择的赠券
  if (Object.keys(selectedDiscount).length > 0) return selectedDiscount;
  return false;
};

export const isHasPromotionFn = ({ promotion, itemList }) => {
  const {
    cloudPromotion,
    promotionList,
    promotionCenterList,
    buyGifts,
    itemValidPromotion,
  } = promotion;

  if (
    !cloudPromotion?.length &&
    !promotionList?.length &&
    !promotionCenterList?.length
  )
    return false;
  // kiosk本地----买赠
  if (buyGifts?.length > 0) return buyGifts?.[0];
  // kiosk本地----买折, 第X件N折
  const promotionDiscountItem = itemList?.find(
    (item) =>
      item.discountID === -1 && item.discountName === 'promotion discount'
  );
  if (promotionDiscountItem) return promotionDiscountItem;
  // kiosk本地----整单折扣
  if (window.kioskLocalDiscountPromotion?.actualDiscount > 0)
    return window.kioskLocalDiscountPromotion;
  // 促销中心的活动
  const validSelectedPromotion = itemValidPromotion?.find((e) => e.isSelected);
  if (validSelectedPromotion) return validSelectedPromotion;
  // 当前订单未参加任何promotion
  return false;
};
