import { ORDER_TYPE } from '@/constants/order';
import { getTemplateAction } from '@/utils/CRMIntegration/getTemplateAction';
import store from '@/reducers/store';

export const resolveBundleDiscount = ({ rules, itemResources, orderType }) => {
  const { merchantProfile } = store.getState();
  return rules
    .map((rule) => {
      const redeemPoint = rule?.redeemRule?.parameters?.point;
      const template = rule.couponTemplate;
      const { ruleId } = rule;
      const rewardType = rule.type === 'reward' ? 'loyalty' : 'voucher';

      const benefitAction = getTemplateAction({ template });
      const {
        ruleExpression: { condition, benefits },
      } = template;
      const {
        itemFilter: { type, value },
      } = condition;
      const {
        params: { value: discountValue, quantity: discountNum },
      } = benefitAction;
      const {
        condition: { quantity },
      } = benefits[0];
      const newRedeemRule = {
        strategy: 'orderItemFixedPriceCoupon',
        parameters: {
          points: redeemPoint,
        },
        bundleDiscountRule: {
          orderQuantity: quantity,
          discountValue,
          discountNum,
        },
      };
      // 聚合商品数据, 并根据orderType过滤
      let bundleDiscountItems = type === 'all' ? itemResources : [];
      const skus = value?.filter(
        (each) =>
          each.productLine === 'KIOSK' &&
          each.merchantId === merchantProfile?.merchantId
      );
      if (type === 'include') {
        // 如果 skus 为空数组, 跳过当前项的处理
        if (!skus?.length) {
          return null;
        }
        bundleDiscountItems = itemResources.reduce((pre, cur) => {
          const { id, itemPrices } = cur;
          const sameItem = skus.find((each) => each.itemId === id);
          if (!sameItem) return pre;
          if (!itemPrices?.length) return pre.concat(cur);
          const newItemPrices = itemPrices?.filter((i) => {
            return (
              sameItem?.sizeList?.map((s) => s.sizeId).includes(i.sizeId) &&
              (orderType
                ? i.type === ORDER_TYPE[orderType] ||
                  i.type === ORDER_TYPE['ALL']
                : true)
            );
          });
          if (!newItemPrices.length) return pre;
          return pre.concat({
            ...cur,
            itemPrices: newItemPrices,
          });
        }, []);
      }
      if (type === 'exclude') {
        // 如果 skus 为空数组, 跳过当前项的处理
        if (!skus?.length) {
          return null;
        }
        bundleDiscountItems = itemResources.reduce((pre, cur) => {
          const { id, itemPrices } = cur;
          const sameItem = skus.find((each) => each.itemId === id);
          if (!sameItem) return pre.concat(cur);
          if (!itemPrices?.length) return pre;
          const newItemPrices = itemPrices?.filter((i) => {
            return (
              !sameItem.sizeList?.map((s) => s.sizeId).includes(i.sizeId) &&
              (orderType
                ? i.type === ORDER_TYPE[orderType] ||
                  i.type === ORDER_TYPE['ALL']
                : true)
            );
          });
          if (!newItemPrices.length) return pre;
          return pre.concat({
            ...sameItem,
            itemPrices: newItemPrices,
          });
        }, []);
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
        couponItemList: bundleDiscountItems,
      };
    })
    .filter(Boolean);
};
