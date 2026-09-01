import { ORDER_TYPE } from '@/constants/order';
import store from '@/reducers/store';

const makeUpRewardFreeItemData = ({ data, rule }) => {
  const { ruleId, name } = rule;
  const redeemPoint = rule?.redeemRule?.parameters?.point;
  return data.map((kioskSkuInfo) => {
    let originalPrice = kioskSkuInfo.price ?? 0;
    if (kioskSkuInfo.itemPrices?.length > 0) {
      originalPrice = kioskSkuInfo.itemPrices.sort(
        (a, b) => a.price - b.price
      )?.[0].price;
    }
    return {
      ...kioskSkuInfo,
      ...rule,
      adItemType: 'loyalty',
      rewardRule: {
        _id: ruleId,
        name,
        rewardType: 'loyalty',
        redeemRule: {
          strategy: 'byFreeItem',
          parameters: {
            points: redeemPoint,
          },
        },
      },
      price: 0,
      originalPrice,
      freeItemOriginPrice: originalPrice,
      itemMax: 1,
      itemPoints: redeemPoint,
      description: kioskSkuInfo.description,
      crmDescription: rule.description,
    };
  });
};

export const resolveRewardItemCampaign = ({
  rules = [],
  itemResources,
  orderType,
}) => {
  if (!rules?.length) return [];
  const { merchantProfile } = store.getState();
  return rules.reduce((pre, cur) => {
    const template = cur.couponTemplate;
    if (!template) return pre;
    const benefits =
      template.ruleExpression && template.ruleExpression.benefits;
    const action =
      benefits &&
      benefits[benefits.length - 1] &&
      benefits[benefits.length - 1].actions &&
      benefits[benefits.length - 1].actions[
        benefits[benefits.length - 1].actions.length - 1
      ];
    const skus = action.itemFilter.value?.filter(
      (each) =>
        each.productLine === 'KIOSK' &&
        each.merchantId === merchantProfile?.merchantId
    );
    const rewardType = action.itemFilter.type;
    let skuInfos = rewardType === 'all' ? itemResources : [];
    if (rewardType === 'include') {
      skuInfos = itemResources.reduce((pre, cur) => {
        const { id } = cur;
        const sameItem = skus.find((each) => each.itemId === id);
        if (!sameItem) return pre;
        if (!cur.itemPrices?.length) return pre.concat(cur);
        const newItemPrices = cur.itemPrices?.filter((i) => {
          return (
            sameItem.sizeList?.map((s) => s.sizeId).includes(i.sizeId) &&
            (orderType
              ? i.type === ORDER_TYPE[orderType] || i.type === ORDER_TYPE['ALL']
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
    if (rewardType === 'exclude') {
      skuInfos = itemResources.reduce((pre, cur) => {
        const { id } = cur;
        const sameItem = skus.find((each) => each.itemId === id);
        if (!sameItem) return pre.concat(cur);
        // 如果是排除菜，要判断是不是有size的菜
        if (!cur.itemPrices?.length) return pre;
        const newItemPrices = cur.itemPrices?.filter((i) => {
          return (
            !sameItem.sizeList?.map((s) => s.sizeId).includes(i.sizeId) &&
            (orderType
              ? i.type === ORDER_TYPE[orderType] || i.type === ORDER_TYPE['ALL']
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
    const rewardFreeItemData = makeUpRewardFreeItemData({
      data: skuInfos,
      rule: cur,
    });
    return pre.concat(rewardFreeItemData);
  }, []);
};

const makeUpVoucherFreeItemData = ({ data, rule, voucherRules }) => {
  const { ruleId, name } = rule;
  return data.map((kioskSkuInfo) => {
    let originalPrice = kioskSkuInfo.price ?? 0;
    if (kioskSkuInfo.itemPrices?.length > 0) {
      originalPrice = kioskSkuInfo.itemPrices?.sort(
        (a, b) => a.price - b.price
      )?.[0].price;
    }
    return {
      ...kioskSkuInfo,
      ...rule,
      adItemType: 'voucher',
      rewardRule: {
        _id: ruleId,
        name,
        rewardType: 'voucher',
        redeemRule: {
          strategy: 'byFreeItem',
        },
        voucherRules,
      },
      price: 0,
      freeItemOriginPrice: originalPrice,
      itemMax: 1,
      originalPrice,
      discountPrice: 0,
      description: kioskSkuInfo.description,
      crmDescription: rule.description,
    };
  });
};

export const resolveVoucherItemCampaign = ({
  rules = [],
  itemResources,
  orderType,
}) => {
  if (!rules?.length) return [];
  const { merchantProfile } = store.getState();
  return rules.reduce((pre, cur) => {
    const template = cur.couponTemplate;
    if (!template) return pre;
    const benefits =
      template.ruleExpression && template.ruleExpression.benefits;
    const action =
      benefits &&
      benefits[benefits.length - 1] &&
      benefits[benefits.length - 1].actions &&
      benefits[benefits.length - 1].actions[
        benefits[benefits.length - 1].actions.length - 1
      ];
    const condition = template?.ruleExpression?.condition;
    const quantity = action.params.quantity;
    const minSpend = condition.totalAmount;

    const voucherRules = {
      option: 'itemOff',
      minSpend,
      quantity,
    };
    const skus = action.itemFilter.value?.filter(
      (each) =>
        each.productLine === 'KIOSK' &&
        each.merchantId === merchantProfile?.merchantId
    );
    const rewardType = action.itemFilter.type;
    let skuInfos = rewardType === 'all' ? itemResources : [];
    if (rewardType === 'include') {
      skuInfos = itemResources.reduce((pre, cur) => {
        const { id } = cur;
        const sameItem = skus.find((each) => each.itemId === id);
        if (!sameItem) return pre;
        if (!cur.itemPrices?.length) return pre.concat(cur);
        const newItemPrices = cur.itemPrices?.filter((i) => {
          return (
            sameItem.sizeList?.map((s) => s.sizeId).includes(i.sizeId) &&
            (orderType
              ? i.type === ORDER_TYPE[orderType] || i.type === ORDER_TYPE['ALL']
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
    if (rewardType === 'exclude') {
      skuInfos = itemResources.reduce((pre, cur) => {
        const { id } = cur;
        const sameItem = skus.find((each) => each.itemId === id);
        if (!sameItem) return pre.concat(cur);
        // 如果是排除菜，要判断是不是有size的菜
        if (!cur.itemPrices?.length) return pre;
        const newItemPrices = cur.itemPrices?.filter((i) => {
          return (
            !sameItem.sizeList?.map((s) => s.sizeId).includes(i.sizeId) &&
            (orderType
              ? i.type === ORDER_TYPE[orderType] || i.type === ORDER_TYPE['ALL']
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
    const voucherFreeItemData = makeUpVoucherFreeItemData({
      data: skuInfos,
      rule: cur,
      voucherRules,
    });
    return pre.concat({
      ...cur,
      extSkuMapping: voucherFreeItemData,
      voucherRules,
    });
  }, []);
};
