import Big from 'big.js';
import { getItemPrice } from '@/utils/priceCalculator';
import getItemDisplayPrice from '@/utils/getItemDisplayPrice';

const getNormalOrderItems = (itemList = []) =>
  itemList.filter((item) => !item?.isLocalExchangePurchaseItem);

export const isPromotionItemConfigurable = (item, hasDetailInfo) =>
  Boolean(
    hasDetailInfo ||
      (item?.itemType &&
        item.itemType !== 'SALE_ITEM' &&
        item.comboType !== 'FIXED_SELECTION')
  );

const getRequiredOptionMinimumPrice = (item, categoryList = []) => {
  const categoryId = item.categoryId ?? item.oCategoryId;
  const categoryOptions =
    categoryList.find(
      (category) =>
        categoryId != null && String(category.id) === String(categoryId)
    )?.options || [];
  const optionMap = new Map();

  [...(item.options || []), ...categoryOptions].forEach((option) => {
    optionMap.set(option.id, option);
  });

  return [...optionMap.values()].reduce((total, option) => {
    const requiredQuantity = Math.max(Number(option.min || 0), 0);
    const paidQuantity = Math.max(
      requiredQuantity - Number(option.freeQuantity || 0),
      0
    );
    if (!paidQuantity) return total;

    const prices = option.subOptions?.length
      ? option.subOptions.map((subOption) =>
          Number(
            subOption.addPrice ??
              Number(subOption.price || 0) + Number(option.price || 0)
          )
        )
      : [Number(option.price || 0)];
    const minimumPrice = prices.length ? Math.min(...prices) : 0;

    return total.plus(Big(minimumPrice).times(paidQuantity));
  }, Big(0));
};

export const getExchangePurchaseDisplayPrices = ({
  item,
  selectedItem,
  rule,
  currentOrder,
  categoryList = [],
}) => {
  const originalPrice = selectedItem
    ? Big(getItemPrice({ ...selectedItem, quantity: 1 }) || 0)
    : Big(
        getItemDisplayPrice({
          itemInfo: item,
          isComboType: false,
          currentOrder,
          currentCategoryList: categoryList,
        }).price || 0
      ).plus(getRequiredOptionMinimumPrice(item, categoryList));
  const discountedItem = applyExchangePurchaseDiscount(
    { price: originalPrice.toNumber(), quantity: 1 },
    rule
  );

  return {
    originalPrice: originalPrice.toFixed(2),
    discountedPrice: Big(originalPrice)
      .minus(discountedItem.discount || 0)
      .toFixed(2),
  };
};

export const replacePromotionItemVariants = (
  promotions,
  ruleId,
  itemId,
  variants
) =>
  promotions
    .map((promotion) => {
      if (promotion.ruleId !== ruleId) return promotion;
      const otherItems = promotion.items.filter((item) => item.id !== itemId);
      const items = [...otherItems, ...variants];
      return items.length ? { ...promotion, items } : null;
    })
    .filter(Boolean);

export const getPromotionModalDisplayPrice = ({
  isPromotionItem,
  isExchangePurchase,
  totalPrice,
}) => (isPromotionItem && !isExchangePurchase ? '0.00' : totalPrice);

const isItemRuleSatisfied = (rule, itemList) => {
  const { buyDishes = [], buyNumber, buyType } = rule.activityRule || {};
  const requiredQuantity = Number(buyNumber);
  if (!buyDishes.length || !requiredQuantity) return false;

  const quantities = getNormalOrderItems(itemList).reduce((result, item) => {
    if (!buyDishes.includes(item.id)) return result;
    result[item.id] = (result[item.id] || 0) + Number(item.quantity || 0);
    return result;
  }, {});

  if (buyType === 'identical') {
    return Object.values(quantities).some(
      (quantity) => quantity >= requiredQuantity
    );
  }

  return (
    Object.values(quantities).reduce(
      (total, quantity) => total + quantity,
      0
    ) >= requiredQuantity
  );
};

export const getSatisfiedExchangePurchaseRules = (
  rules = [],
  itemList = [],
  orderAmount = 0
) =>
  rules.filter((rule) => {
    const activityRule = rule.activityRule || {};
    if (activityRule.conditionType === 'orderAmount') {
      return Number(orderAmount) >= Number(activityRule.satisfyPrice);
    }
    if (activityRule.conditionType === 'itemQuantity') {
      return isItemRuleSatisfied(rule, itemList);
    }
    return false;
  });

export const applyExchangePurchaseDiscount = (item, rule) => {
  const { discountType, discountNumber } = rule.activityRule || {};
  const quantity = Number(item.quantity || 1);
  const unitPrice = Big(getItemPrice(item) || 0);
  const totalPrice = Number(unitPrice.times(quantity).toFixed(2));
  const configuredDiscount = Number(discountNumber || 0);
  const rawDiscount =
    discountType === 'fixDiscount'
      ? Big(configuredDiscount).times(quantity)
      : Big(unitPrice.times(Big(configuredDiscount).div(100)).toFixed(2)).times(
          quantity
        );
  const discount = Number(
    (rawDiscount.gt(totalPrice) ? Big(totalPrice) : rawDiscount).toFixed(2)
  );
  const discountRate =
    discountType === 'rateDiscount'
      ? configuredDiscount
      : totalPrice > 0
        ? Number(Big(discount).div(totalPrice).times(100).toFixed(4))
        : 0;

  return {
    ...item,
    totalPrice,
    isLocalExchangePurchaseItem: true,
    exchangePurchaseRuleId: rule.id,
    exchangePurchaseRule: rule,
    discountID: -1,
    discountRateType: 1,
    discountName: 'promotion discount',
    discountRate,
    discount,
  };
};

export const getExchangePurchaseUnitDiscount = (item) => {
  const quantity = Number(item.quantity || 1);
  return Number(
    Big(item.discount || 0)
      .div(quantity)
      .toFixed(2)
  );
};

export const getExchangePurchaseDiscountedUnitPrice = (item) => {
  return Big(getItemPrice(item) || 0)
    .minus(getExchangePurchaseUnitDiscount(item))
    .toFixed(2);
};

export const reapplyExchangePurchaseDiscount = (item) => {
  if (!item?.isLocalExchangePurchaseItem || !item.exchangePurchaseRule) {
    return item;
  }
  return applyExchangePurchaseDiscount(item, item.exchangePurchaseRule);
};
