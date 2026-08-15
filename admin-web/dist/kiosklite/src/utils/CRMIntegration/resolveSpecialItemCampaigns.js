import { cloneDeep } from 'lodash';
import { ORDER_TYPE } from '@/constants/order';
import store from '@/reducers/store';

export const resolveSpecialItemCampaigns = ({
  rules,
  itemResources,
  orderType,
}) => {
  return rules
    .map((rule) => {
      const redeemPoint = rule?.redeemRule?.parameters?.point;
      const template = rule.couponTemplate;
      const { ruleId } = rule;
      const rewardType = rule.type === 'reward' ? 'loyalty' : 'voucher';
      const newRedeemRule = {
        strategy: 'setPrice',
        parameters: {
          points: redeemPoint,
        },
      };

      const {
        ruleExpression: { benefits, options },
      } = template;
      // 聚合商品数据, 有size的菜需要合并成一个, 并根据orderType过滤
      const specialItemData = makeUpSpecialItems({
        benefits,
        itemResources,
        orderType,
        options,
      });
      if (!specialItemData?.length) {
        return null;
      }
      return {
        ...rule,
        _id: ruleId,
        campaignId: ruleId,
        rewardType,
        rewardRule: {
          redeemRule: newRedeemRule,
          rewardType,
        },
        redeemRule: newRedeemRule,
        itemPoints: redeemPoint,
        isSatisfyMinSpend: true,
        couponItemList: specialItemData,
      };
    })
    .filter(Boolean);
};

export const makeUpSpecialItems = ({
  benefits,
  itemResources,
  orderType,
  options,
}) => {
  const { quantityLimit } = options;
  const { merchantProfile } = store.getState();
  const allBenefitItems = cloneDeep(benefits).reduce((pre, cur) => {
    const { actions, condition, _id } = cur;
    const {
      params: { price: specialPrice }, // 特殊菜价
    } = actions[0];
    const { itemId, sizeList, price, productLine, merchantId } =
      condition.itemFilter.value[0];

    if (productLine !== 'KIOSK' || merchantId !== merchantProfile?.merchantId) {
      return pre;
    }
    const isAlreadyExist = pre.findIndex((e) => e.itemId === itemId);
    // id重复,有多规格 -> 聚合size
    if (isAlreadyExist !== -1) {
      pre[isAlreadyExist].sizeList.push(...cloneDeep(sizeList));
      return pre;
    }
    const benefitItemData = {
      itemId,
      // specialPrice,
      price,
      sizeList,
      _id,
      quantityLimit,
    };
    return pre.concat(benefitItemData);
  }, []);

  return allBenefitItems.reduce((pre, cur) => {
    const { itemId, specialPrice, _id, price, sizeList, quantityLimit } = cur;
    const sameItem = itemResources.find((i) => i.id === itemId);
    if (!sameItem) return pre;
    const dishData = {
      ...sameItem,
      specialPrice,
      _id,
      displayPrice: price,
      quantityLimit: quantityLimit || 9999,
    };
    if (!sizeList?.length) return pre.concat(dishData);
    const newItemPrices = dishData.itemPrices?.filter((i) => {
      return (
        sizeList?.map((s) => s.sizeId).includes(i.sizeId) &&
        (orderType
          ? i.type === ORDER_TYPE[orderType] || i.type === ORDER_TYPE['ALL']
          : true)
      );
    });
    if (!newItemPrices?.length) return pre;
    return pre.concat({
      ...dishData,
      itemPrices: newItemPrices,
    });
  }, []);
};
