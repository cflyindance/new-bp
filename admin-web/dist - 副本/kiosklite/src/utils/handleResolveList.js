import cloneDeep from 'lodash/cloneDeep';
import { getItemPrice } from '@/utils/priceCalculator';
import { nanoid } from 'nanoid';
import Big from 'big.js';
import { reapplyExchangePurchaseDiscount } from '@/utils/localExchangePurchase';

// 折扣菜 - 配置在promotion rule中的菜

export const sortById = (beforeSortList) => {
  // 根据id聚合, 排序
  return beforeSortList
    .reduce((pre, cur) => {
      if (!pre.length) return [...pre, [cur]];
      const isExistId = pre.findIndex((each) => each[0].id === cur.id);
      if (isExistId !== -1) {
        pre[isExistId].push(cur);
        return pre;
      }
      return [...pre, [cur]];
    }, [])
    ?.map((items) => {
      const noDiscount = items
        .filter((item) => !item.discount)
        .sort((a, b) => b.totalPrice - a.totalPrice);
      const discount = items
        .filter((item) => item.discount)
        .sort((a, b) => b.realPrice - a.realPrice);
      return [...noDiscount, ...discount];
    })
    .flat();
};

// 计算option价格
const countOptionPrice = (itemInfo) => {
  const allOptions = itemInfo.sectionDetail.filter(
    (section) => section.id === -2 || section.id === -3
  );
  return allOptions.reduce((pre, cur) => {
    const { options } = cur;
    const singleOptionPrice = options.reduce((acc, nex) => {
      const { price, quantity } = nex;
      const itemPrice = Big(price).times(quantity);
      return Big(acc).plus(itemPrice);
    }, 0);
    return Big(pre).plus(singleOptionPrice);
  }, 0);
};

// 当前菜是否在第X件N折中
const getSecondHalfInfo = (buyDiscountRule, id) => {
  return buyDiscountRule.find((info) =>
    info.activityRule.buyDishes.includes(id)
  );
};

// 不参与折扣的子菜
const getNoDiscountSubDish = (item) => {
  const { comboSections, sectionDetail, secondHalfInfo, id } = item;
  if (
    comboSections?.length > 0 &&
    sectionDetail?.length > 0 &&
    secondHalfInfo
  ) {
    const {
      activityRule: { buyDishes },
    } = secondHalfInfo;
    return sectionDetail.filter((section) =>
      comboSections
        .filter((subDish) => !buyDishes.includes(`${id}${subDish.id}`))
        ?.map((subDishGroup) => subDishGroup.id)
        ?.includes(section.id)
    );
  }
  return [];
};

// 不参与折扣的子菜价
const countNoDiscountSubDish = (item) => {
  const noDiscountSubDish = getNoDiscountSubDish(item);
  if (noDiscountSubDish?.length > 0) {
    return noDiscountSubDish.reduce((pre, cur) => {
      const curPrice = cur.items?.reduce((price, item) => {
        const itemPrice = Big(getItemPrice(item)).times(item.quantity);
        return Big(price).plus(itemPrice);
      }, 0);
      return Big(pre).plus(curPrice);
    }, 0);
  }

  return Big(0);
};

// 实际需要折扣价 = 菜总价 - 菜option价 - 不参与折扣的子菜价
const countRealPrice = (item) => {
  return item.sectionDetail.length > 0
    ? Number(
        Big(item.totalPrice)
          .minus(countOptionPrice(item))
          .minus(countNoDiscountSubDish(item).toFixed(2))
      )
    : item.totalPrice;
};

const sortItemsByRealPrice = (items) => {
  return items
    .map((each) => {
      return {
        ...each,
        realPrice: countRealPrice(each),
      };
    })
    .sort((a, b) => {
      if (a.realPrice === b.realPrice) {
        return a.totalPrice - b.totalPrice;
      }
      return a.realPrice - b.realPrice;
    });
};

const applyPromotionDiscount = (item, secondHalfInfo) => {
  item.discountRate = secondHalfInfo.activityRule.giftsDiscount;
  item.discountID = -1;
  item.discountRateType = 1;
  item.discountName = 'promotion discount';
  const actualRate = Big(item.discountRate).div(100).toNumber();
  const realPrice = countRealPrice(item);
  item.realPrice = realPrice;
  item.discount = Number(Big(realPrice).times(actualRate).toFixed(2));
  // 对于combo菜，是否有combo菜不参与折扣, 用于判断是否是自定义折扣
  item.isHasNoDiscountSubDish = getNoDiscountSubDish(item)?.length > 0;
};

export const handleResolveList = (
  itemList,
  buyDiscountRule,
  isSkipPromotionCalculation = false
) => {
  const cloneItemList = cloneDeep(itemList).map((each) => {
    // 删除之前的折扣信息
    delete each.discountRate;
    delete each.discount;
    delete each.tempId;
    delete each.discountID;
    delete each.discountRateType;
    // 重新计算 totalPrice，确保 quantity 变化时 totalPrice 也会更新
    each.totalPrice = Number(
      Big(getItemPrice(each)).times(each.quantity).toFixed(2)
    );
    return each;
  });
  // 跳过promotion计算
  if (isSkipPromotionCalculation) {
    return cloneItemList.filter((item) => !item.isLocalExchangePurchaseItem);
  }

  // 复制 数量大于1 且 符合第X件Y折(giftsDiscountRule=0：每满x件Y折的情况；giftsDiscountRule=1：满x件只有一件打Y折)
  const newItemList = cloneItemList.reduce((pre, cur) => {
    const secondHalfInfo = getSecondHalfInfo(buyDiscountRule, cur.id);
    const orderOnlyOneBuyDiscount =
      cloneItemList
        .filter((item) =>
          secondHalfInfo?.activityRule?.buyDishes.includes(item.id)
        )
        .reduce((pre, cur) => pre + cur.quantity, 0) >=
      secondHalfInfo?.activityRule?.buyNumber;

    if (
      secondHalfInfo &&
      secondHalfInfo?.activityRule?.giftsDiscountRule !== '1' &&
      cur.quantity > 1
    ) {
      for (let i = 0; i < cur.quantity; i++) {
        pre.push({
          ...cur,
          quantity: 1,
          totalPrice: getItemPrice(cur),
          secondHalfInfo,
          tempId: nanoid(),
        });
      }
      return pre;
    }

    if (
      secondHalfInfo &&
      secondHalfInfo?.activityRule?.giftsDiscountRule === '1' &&
      orderOnlyOneBuyDiscount
    ) {
      for (let i = 0; i < cur.quantity; i++) {
        pre.push({
          ...cur,
          quantity: 1,
          totalPrice: getItemPrice(cur),
          secondHalfInfo,
          tempId: nanoid(),
        });
      }
      return pre;
    }

    return pre.concat({
      ...cur,
      totalPrice: Number(Big(getItemPrice(cur)).times(cur.quantity).toFixed(2)),
      secondHalfInfo,
      tempId: nanoid(),
    });
  }, []);

  // 根据主菜id找到相同菜品, 排序找到需要折扣的菜
  const itemWithDiscount = newItemList.map((item) => {
    const { secondHalfInfo } = item;
    if (!secondHalfInfo) return item;
    let checkDiscountItems = [];
    // 相同菜折扣
    if (secondHalfInfo.activityRule.buyType === 'identical') {
      checkDiscountItems = newItemList.filter((each) => each.id === item.id);
    } else {
      // 任意菜折扣只在同一个活动内聚合，避免不同 random 活动互相影响。
      checkDiscountItems = newItemList.filter(
        (each) =>
          each.secondHalfInfo?.id === secondHalfInfo.id &&
          each.secondHalfInfo?.activityRule?.buyType === 'random'
      );
    }
    const sortItemsByPrice = sortItemsByRealPrice(checkDiscountItems);

    if (secondHalfInfo?.activityRule?.giftsDiscountRule === '1') {
      // 满 X 件只有一件打折时，也要按活动类型区分候选范围。
      const sameSecondHalfItems = newItemList.filter(
        (each) =>
          each.secondHalfInfo?.id === secondHalfInfo.id &&
          (secondHalfInfo.activityRule.buyType === 'identical'
            ? each.id === item.id
            : each.secondHalfInfo?.activityRule?.buyType === 'random')
      );

      if (sameSecondHalfItems.length >= secondHalfInfo.activityRule.buyNumber) {
        // 找到当前候选范围内最小额的产品
        const [lowestPriceDiscountItem] =
          sortItemsByRealPrice(sameSecondHalfItems);

        if (item.tempId === lowestPriceDiscountItem.tempId) {
          applyPromotionDiscount(item, secondHalfInfo);
        }
      }
    } else {
      const needDiscountQuantity = Math.floor(
        sortItemsByPrice.length / Number(secondHalfInfo.activityRule.buyNumber)
      );

      for (let i = 0; i < needDiscountQuantity; i++) {
        if (sortItemsByPrice[i].tempId === item.tempId) {
          applyPromotionDiscount(item, secondHalfInfo);
        }
      }
    }
    return item;
  });

  const afterSortList = sortById(
    itemWithDiscount.map(reapplyExchangePurchaseDiscount)
  );

  return afterSortList.map((each, i) => {
    return {
      ...each,
      sequence: i,
    };
  });
};
