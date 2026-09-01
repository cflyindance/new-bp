// 为 crm 集成折扣活动统一生成订单菜品列表，避免多处重复代码
export const mapCRMDiscountItems = ({
  orderItems = [],
  orderDiscountInfo,
  items = [],
}) => {
  if (!Array.isArray(items)) return [];

  return items.map((each) => {
    const rewardItem = orderItems.find(
      (orderItem) => orderItem.id === each.uniqueItemTempId
    );
    if (!rewardItem) return each;

    const crmCampaignRewardInfo = {
      orderDiscountInfo,
      itemDiscountInfo: rewardItem.discounts,
      isCRMIntegrationDiscountItem: true,
    };

    return {
      ...each,
      ...crmCampaignRewardInfo,
      crmCampaignRewardInfo: {
        ...crmCampaignRewardInfo,
        uniqueItemTempId: each.uniqueItemTempId,
      },
    };
  });
};
