const getSKUInfo = (skuInfo, idx) => {
  return skuInfo.itemSku.split('-')[idx];
};

export const roundToPrecision = (number, decimals = 2) => {
  number = Math.round(number + 'e' + decimals);
  return Number(number + 'e' + -decimals);
};

export const resolveAvocadoLoyaltySku = (rules = [], itemResources) => {
  if (!rules?.length) return [];
  return rules
    .reduce((pre, cur) => {
      const { sku, redeemPoint, id, name } = cur;
      const skuInfos = sku
        ?.filter((sku) => getSKUInfo(sku, 1) === 'KIOSK')
        .map((kioskSku) => {
          const skuId = Number(getSKUInfo(kioskSku, 2));
          const kioskSkuInfo = itemResources.find((item) => item?.id === skuId);
          return {
            ...kioskSkuInfo,
            itemSku: kioskSku.itemSku,
            isAvocadoCampaignItem: true,
            adItemType: 'loyalty',
            rewardRule: {
              _id: id,
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
            itemMax: 1,
            itemPoints: redeemPoint,
          };
        });
      return pre.concat(skuInfos);
    }, [])
    ?.filter((dish) => dish.id); // 兼容品类模式下 当前品类不能兑换此菜品
};

export const resolveAvocadoItemVoucher = (rules = [], itemResources) => {
  if (!rules?.length) return [];
  const voucherItemWithRewardRule = rules.map((rule) => {
    const { extSkuMapping, id, name, voucherRules } = rule;
    const { option, value, amountCapped } = voucherRules;
    const kioskSkuInfos = extSkuMapping
      ?.filter((sku) => getSKUInfo(sku, 1) === 'KIOSK')
      .map((kioskSku) => {
        const skuId = Number(getSKUInfo(kioskSku, 2));
        const kioskSkuInfo = itemResources.find((item) => item?.id === skuId);
        const sku = {
          ...kioskSkuInfo,
          itemSku: kioskSku.itemSku,
          isAvocadoCampaignItem: true,
          adItemType: 'voucher',
          rewardRule: {
            _id: id,
            rewardType: 'voucher',
            name,
            redeemRule: {
              strategy: 'byFreeItem',
            },
            voucherRules,
          },
          itemMax: 1,
        };
        if (!voucherRules) return sku;
        let originalPrice = sku.price ?? 0;
        if (sku.itemPrices) {
          originalPrice = sku.itemPrices.sort((a, b) => a.price - b.price)?.[0]
            .price;
        }
        let discountPrice;
        if (option === 'dollarOff') {
          const afterDiscountPrice = roundToPrecision(originalPrice - value);
          discountPrice = afterDiscountPrice < 0 ? 0 : afterDiscountPrice;
        } else if (option === 'percentageOff') {
          // item 百分比折扣
          const discount = roundToPrecision((value / 100) * originalPrice);
          discountPrice = roundToPrecision(
            originalPrice - (discount > amountCapped ? amountCapped : discount)
          );
        } else {
          discountPrice = 0;
        }
        return { ...sku, originalPrice, price: discountPrice };
      })
      ?.filter((dish) => dish.id); // 兼容品类模式下 当前品类不能兑换此菜品
    return {
      ...rule,
      extSkuMapping: kioskSkuInfos,
    };
  });
  return voucherItemWithRewardRule.filter(
    (rule) => rule.extSkuMapping?.length > 0
  );
};
