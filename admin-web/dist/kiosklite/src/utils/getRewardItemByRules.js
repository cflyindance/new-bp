const getRewardItemByRules = ({ rules, allItems }) => {
  const freeItemRule = rules.filter(
    (each) => each?.redeemRule?.strategy === 'byFreeItem'
  );
  const rewardItems = freeItemRule.map((each) => {
    const itemPoints = each?.redeemRule?.parameters?.points;
    const rewardType = each?.redeemRule?.parameters?.freeItemPool?.type;
    const ruleItems =
      each?.redeemRule?.parameters?.freeItemPool?.objects?.items?.filter(
        (ruleItem) => ruleItem?.orderType === 'KIOSK'
      );
    const ruleItemsIds = ruleItems.map((item) => item?.itemId);
    const ruleItemSizeIds = ruleItems.map((item) => item?.sizeId);
    const itemWithPoint = allItems.map((item) => ({
      ...item,
      itemPoints,
      rewardRule: each,
      // 自研活动默认可参与
      crmIntegrationRule: {
        isValid: true,
      },
      redeemRule: each.redeemRule,
    }));
    if (rewardType === 'ALL') {
      return {
        ...each,
        items: itemWithPoint,
      };
    }
    if (rewardType === 'SELECTED') {
      return {
        ...each,
        items: itemWithPoint
          .filter((each) => ruleItemsIds.includes(each.id))
          .map((dish) => {
            return {
              ...dish,
              itemPrices: dish.itemPrices?.filter((size) =>
                ruleItemSizeIds.includes(size.id)
              ),
            };
          }),
      };
    }
    // 排除商品
    if (rewardType === 'NOTSELECTED') {
      return {
        ...each,
        items: itemWithPoint.filter((each) => {
          if (each.itemPrices?.length > 0) {
            each.itemPrices = each.itemPrices?.filter(
              (size) => !ruleItemSizeIds.includes(size.id)
            );
            return each.itemPrices.length > 0;
          }
          return !ruleItemsIds.includes(each.id);
        }),
      };
    }
  });
  return rewardItems;
};

export default getRewardItemByRules;
