import crmIntegrationSDK, {
  formatOrderStructure,
} from '@/utils/CRMIntegration/marketSDK';
import store from '@/reducers/store';
import cloneDeep from 'lodash/cloneDeep';
import { ORDER_TYPE } from '@/constants/order';
import {
  GIFT_PROMOTION_TYPE,
  RECOMMEND_SUCCESS_TYPE,
} from '@/constants/promotion';

const makeUpItemList = (itemList) => {
  return itemList.map((each) => {
    let itemPrice = each.price;
    let itemSizeIds = null;
    if (each.itemPrices?.length) {
      itemPrice = each.itemPrices?.sort((a, b) => a.price - b.price)?.[0]
        ?.price;
      itemSizeIds = each.itemPrices.map((size) => String(size.sizeId));
    }
    return {
      itemId: String(each.id),
      itemPrice,
      itemSizeIds,
    };
  });
};

// 给菜打标签, 只和主菜有关，只给赠品打
export const checkIsItemHasPromotion = async ({
  itemList,
  promotionList,
  orderType,
  appointItemFlag,
  merchantId,
}) => {
  try {
    const orderItemList = makeUpItemList(itemList);
    const promotionPlugin = await crmIntegrationSDK.getPromotionPlugin();
    const res = await promotionPlugin.GetItemMatchedCampaign({
      orderItemList,
      promotionList,
      orderType,
      appointItemFlag,
      merchantId,
    });
    if (res instanceof Map) {
      return res;
    }
  } catch (e) {
    throw new Error(e.message);
  }
};

// 检查当前加购菜品可用的促销
export const checkItemPromotionStatus = async ({
  promotionList, // 促销列表
  allItems,
  merchantId,
}) => {
  try {
    const formattedOrder = await formatOrderStructure({ allItems });
    const { orderItems, orderType } = formattedOrder;
    const promotionPlugin = await crmIntegrationSDK.getPromotionPlugin();
    const res = await promotionPlugin.GetItemMatchedCampaign({
      orderItemList: orderItems,
      promotionList,
      orderType,
      appointItemFlag: true,
      merchantId,
    });
    if (res instanceof Map) {
      return res;
    }
  } catch (e) {
    throw new Error(e.message);
  }
};

// 获取促销折扣或者不可用信息
export const getPromotionValidInfo = async ({ rules, metas, allItems }) => {
  try {
    const promotionPlugin = await crmIntegrationSDK.getPromotionPlugin();
    return await promotionPlugin.GetItemValidateStatus({
      rules,
      metas,
      allItems,
    });
  } catch (e) {
    throw new Error(e.message);
  }
};

// 过滤促销中心列表，返回有效时间且无促销码的促销列表
export const filterValidPromotionCenterList = async ({
  promotionCenterList,
  promotionCenterMetas,
  allItems = [],
}) => {
  // 等待promotionCenterMetas准备好
  if (!promotionCenterMetas || !promotionCenterList?.length) {
    return [];
  }

  const promotionValidInfo = await getPromotionValidInfo({
    rules: promotionCenterList,
    metas: promotionCenterMetas,
    allItems,
  });

  // 过滤出在活动时间内、订单类型正确、生效的活动
  const validPromotionList =
    promotionValidInfo?.data
      ?.filter((cur) => {
        const excludedKeys = [
          'dayOfMonth',
          'dayOfWeek',
          'effectiveTime',
          'timeOfDay',
          'orderType',
        ];
        return (
          !cur.invalidReason.length ||
          !cur.invalidReason?.find((item) => excludedKeys.includes(item.key))
        );
      })
      .map((item) => item?.result?.nodeId) || [];

  // 当前商户信息
  const { merchantProfile } = store.getState();
  const merchantId = merchantProfile?.merchantId;

  // 获取促销的 itemFilter type
  const getItemFilterType = (item) => {
    const isGiftOrFixedPrice =
      item?.type === 'orderItemGiftItem' ||
      item?.type === 'orderItemFixedPrice';

    const filterType = isGiftOrFixedPrice
      ? item?.ruleExpression?.benefits?.[0]?.condition?.itemFilter?.type
      : item?.ruleExpression?.condition?.itemFilter?.type;

    return filterType === 'all' || !filterType ? 'all' : 'part';
  };

  // 获取促销的 itemFilter value
  const getItemFilterValue = (item) => {
    if (item?.type === 'orderItemGiftItem') {
      // 买赠
      return item?.ruleExpression?.benefits?.[0]?.condition?.itemFilter?.value;
    } else if (item?.type === 'orderItemFixedPrice') {
      //特价优惠
      return item?.ruleExpression?.benefits.flatMap(
        (benefit) => benefit.condition.itemFilter?.value || []
      );
    }
    return item?.ruleExpression?.condition?.itemFilter?.value;
  };

  // 检查促销是否生效且不是促销码活动
  const isPromotionValid = (item) => {
    return (
      validPromotionList.includes(item?.id) && !item?.promotionCodes?.length
    );
  };

  // 过滤符合 KIOSK 和商户条件的商品列表
  const filterValidItems = (valueList) => {
    return (
      valueList?.filter(
        (each) => each.productLine === 'KIOSK' && each.merchantId === merchantId
      ) || []
    );
  };

  // 最终可以展示的有效活动
  const filteredList = promotionCenterList.filter((item) => {
    if (!isPromotionValid(item)) {
      return false;
    }

    const itemFilterType = getItemFilterType(item);

    // 如果是全商品类型，直接返回
    if (itemFilterType === 'all') {
      return true;
    }

    // 如果是部分商品类型，需要检查是否有符合条件的商品
    const itemFilterValue = getItemFilterValue(item);
    const validItemList = filterValidItems(itemFilterValue);

    return validItemList.length > 0;
  });

  return filteredList;
};

// 获取购物车促销最终状态以及凑单信息
export const checkIsItemPromotionValid = async ({
  rules,
  promotionCenterMetas,
  allItems,
}) => {
  try {
    const res = await getPromotionValidInfo({
      rules,
      metas: promotionCenterMetas,
      allItems,
    });
    return await handleAddOnItem({
      promotionResult: res?.data,
      promotionList: rules,
      allItems,
    });
  } catch (e) {
    throw new Error(e.message);
  }
};

// 凑单/推荐
export const handleAddOnItem = async ({
  promotionResult,
  promotionList,
  appointPromotionId,
  allItems,
}) => {
  try {
    const { menuItemList } = store.getState();
    const itemList = makeUpItemList(
      Object.values(menuItemList).filter((_) => !_.isFreeItem)
    );
    const promotionPlugin = await crmIntegrationSDK.getPromotionPlugin();
    const res = await promotionPlugin.AddOnItem({
      promotionResult,
      itemList,
      promotionList,
      appointPromotionId,
      allItems,
    });
    if (res?.length > 0) {
      return res.map((rule) => {
        const { id } = rule.promotion;
        const validateInfo = promotionResult.find(
          (each) => each.result.nodeId === id
        );
        return {
          ...rule,
          validateInfo,
        };
      });
    }
  } catch (e) {
    throw new Error(e.message);
  }
};

export const makeUpPromotionAddOnItem = ({
  promotionRule,
  itemResources,
  orderType,
}) => {
  const rule = promotionRule.promotion;
  const {
    ruleExpression: { condition, benefits },
  } = rule;
  const {
    itemFilter: { type, value },
  } = condition;
  let promotionAddOnItem = [];
  const { merchantProfile } = store.getState();
  const skus = value?.filter(
    (each) =>
      each.productLine === 'KIOSK' &&
      each.merchantId === merchantProfile?.merchantId
  );
  if (type === 'include') {
    promotionAddOnItem = !skus?.length
      ? []
      : skus.reduce((pre, cur) => {
          const { itemId, sizeList } = cur;
          const sameItem = itemResources.find((each) => each.id === itemId);
          if (!sameItem) return pre;
          if (!sizeList?.length)
            return pre.concat({ ...sameItem, promotionRule });
          const newItemPrices = sameItem.itemPrices?.filter((i) => {
            return (
              sizeList?.map((s) => s.sizeId).includes(i.sizeId) &&
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
            promotionRule,
          });
        }, []);
  }
  if (type === 'exclude') {
    promotionAddOnItem = itemResources.reduce((pre, cur) => {
      const { id, itemPrices } = cur;
      const sameItem = skus?.find((each) => each.itemId === id);
      if (!sameItem) return pre.concat({ ...cur, promotionRule });
      if (!itemPrices?.length) return pre;
      const newItemPrices = itemPrices?.filter((i) => {
        return (
          !sameItem.sizeList?.map((s) => s.sizeId).includes(i.sizeId) &&
          (orderType
            ? i.type === ORDER_TYPE[orderType] || i.type === ORDER_TYPE['ALL']
            : true)
        );
      });
      if (!newItemPrices.length) return pre;
      return pre.concat({
        ...sameItem,
        itemPrices: newItemPrices,
        promotionRule,
      });
    }, []);
  }

  return promotionAddOnItem;
};

export const makeUpSpecialPromotionAddOnItem = ({
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
      //specialPrice,
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

export const checkIsRuleValid = (validateInfo) => {
  const {
    isValid,
    result: {
      result: { discounts },
    },
  } = validateInfo;
  return isValid && discounts?.length > 0;
};

export const checkIsRuleDiscountInvalid = (rule) => {
  const {
    validateInfo: {
      result: {
        result: { discounts },
      },
    },
    promotion: { type },
  } = rule;
  // 买赠 满赠，赠0元菜也被允许。 且只有手动选才被计算，sdk自动给的赠菜不被计算
  if (GIFT_PROMOTION_TYPE.includes(type)) {
    return !discounts?.every(
      (e) => typeof e.amount === 'number' && e.extraInfo.isUserSelected
    );
  }
  return discounts?.every((e) => e.amount === 0);
};

export const checkIsGiftPromotionValid = ({ promotion, recommendType }) => {
  const { type } = promotion;
  return (
    GIFT_PROMOTION_TYPE.includes(type) &&
    RECOMMEND_SUCCESS_TYPE.includes(recommendType)
  );
};

export const getGiftPromotionRewardItems = ({
  itemResources,
  orderItemList,
  orderType,
}) => {
  const allPromotionItems = orderItemList?.reduce((pre, cur) => {
    const { itemId, itemSizeIds } = cur;
    const isAlreadyExist = pre.findIndex((e) => e.itemId === itemId);
    // id重复,有多规格 -> 聚合size
    if (isAlreadyExist !== -1) {
      const existingItem = pre[isAlreadyExist];
      // 处理 itemSizeIds 为 null 的情况
      if (itemSizeIds && Array.isArray(itemSizeIds) && itemSizeIds.length > 0) {
        // 如果已存在的项 itemSizeIds 为 null，初始化为数组
        if (!existingItem.itemSizeIds || !Array.isArray(existingItem.itemSizeIds)) {
          existingItem.itemSizeIds = [];
        }
        // 添加新的 itemSizeIds，并去重
        const newSizeIds = itemSizeIds.map(id => String(id));
        const existingSizeIds = existingItem.itemSizeIds.map(id => String(id));
        const uniqueSizeIds = [...new Set([...existingSizeIds, ...newSizeIds])];
        existingItem.itemSizeIds = uniqueSizeIds;
      }
      return pre;
    }
    return pre.concat(cur)
  }, []);

  return allPromotionItems?.reduce((pre, rewardItem) => {
    const { itemId, itemSizeIds } = rewardItem;

    const sameItemFromRewardList = itemResources.find(
      (e) => e.id === Number(itemId)
    );
    if (!sameItemFromRewardList) return pre;
    if (!itemSizeIds?.length) return pre.concat({ ...sameItemFromRewardList });
    const newItemPrices = sameItemFromRewardList?.itemPrices?.filter((i) => {
      return (
        (itemSizeIds.includes(String(i.sizeId)) ||
          itemSizeIds.includes(Number(i.sizeId))) &&
        (orderType
          ? i.type === ORDER_TYPE[orderType] || i.type === ORDER_TYPE['ALL']
          : true)
      );
    });
    if (!newItemPrices?.length) return pre;
    return pre.concat({
      ...sameItemFromRewardList,
      itemPrices: newItemPrices,
    });
  }, []);
};

// 给菜加上整单折扣信息
// export const makeUpItemPromotionInfo = ({ sdkItemInfo, promotionList }) => {
//   const manualCountPromotion = promotionList.filter(
//     (each) => each.type === 'totalAmountQuantityDiscount'
//   );
//   const { itemId, itemPromotion = [] } = sdkItemInfo;
//   const res = { [itemId]: itemPromotion };
//   manualCountPromotion.forEach((promotionItem) => {
//     const {
//       id,
//       promotionName,
//       ruleExpression: { condition },
//       type,
//     } = promotionItem;
//     if (type === 'totalAmountQuantityDiscount') {
//       const {
//         itemFilter: { type: itemRuleType, value },
//       } = condition;
//       const promotionInfo = {
//         promotionId: id,
//         promotionName,
//         promotionType: type,
//       };
//       const isSameItem = value.find((each) => each.itemId === Number(itemId));
//       if (
//         itemRuleType === 'all' ||
//         (itemRuleType === 'include' && isSameItem) ||
//         (itemRuleType !== 'include' && !isSameItem)
//       ) {
//         res[itemId].push(promotionInfo);
//       }
//     }
//   });
//   return res;
// };
