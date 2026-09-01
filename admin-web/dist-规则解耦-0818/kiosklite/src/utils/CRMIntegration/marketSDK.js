import store from '@/reducers/store';
import { generateSubmitOrderObj, getOrderInfoObj } from '@/api/submitOrderObj';
import { v4 as uuidv4 } from 'uuid';
import {
  GIFT_PROMOTION_INVALID_TYPE,
  GIFT_PROMOTION_TYPE,
  RECOMMEND_SUCCESS_TYPE,
} from '@/constants/promotion';

import Big from 'big.js';

// 费用类型
const ChargeType = {
  SERVICE_FEE: 'serviceFee', // 服务费
  DELIVERY_FEE: 'deliveryFee', // 送餐费
  OTHER: 'other', // 其他费用
  DEFAULT: 'other', // 其他费用
};

// 折扣类型
const DiscountType = {
  COUPON: 'voucher', // 优惠券折扣
  REWARDS: 'reward', // 奖励折扣
  OTHER: 'other', // 其他折扣
};

// 订单数据和订单价格信息
const getOrderData = async () => {
  const state = store?.getState();
  const order = await generateSubmitOrderObj(state);
  const orderInfo = await getOrderInfoObj(state);
  return { state, order, orderInfo };
};

// 折扣列表（目前只要求积分兑换和券兑换）
const buildDiscountList = (state) => {
  const discountList = [];

  if (Object.keys(state?.crm?.selectedDiscount).length > 0) {
    discountList.push({
      name: state.crm.selectedDiscount.displayName, // 折扣名称
      id: state.crm.selectedDiscount._id, // 折扣ID
      amount: state.crm.selectedDiscount.actualDiscount, // 折扣金额（以元为单位，保留两位小数）
      type: state.crm.selectedDiscount.type, // 折扣类型
      extraInfo: {
        enableBenefit: true,
      },
    });
  }

  return discountList;
};

// 加收费用列表
const buildChargeList = (state, order) => {
  return state.togoList
    .map((item) => {
      if (Object.keys(item.select).length > 0) {
        const chargeItem = order?.orderCharges?.find(
          (e) => e.chargeName === item.name.replace(' ', '-')
        );
        return {
          type: ChargeType[item?.select?.type],
          amount: chargeItem?.charge,
          name: item?.name,
        };
      }
    })
    .filter((item) => item !== undefined);
};

export const resolveDishList = ({ data, merchantId, productLine }) => {
  return data.map((item, i) => {
    const info = {
      itemName: item.name,
      id: item.uniqueItemTempId,
      itemId: item.id,
      merchantId,
      productLine,
      categoryId: item.categoryId?.toString() || null,
      quantity: item.quantity,
      itemPrice:
        item.price ||
        item.sectionDetail?.find((o) => o.id === -1)?.sizeInfo?.price ||
        0,
      itemTotalPrice: Number(
        Big(item.totalPrice ?? item.totalAmount)
          .div(item.quantity)
          .toFixed(2)
      ),
      sizeId: item.sectionDetail?.find((o) => o.id === -1)?.sizeInfo?.sizeId,
      discounts: [],
    };
    // 手动选赠菜 需要增加discountList信息
    if (item.manualSelectRewardDiscount) {
      info.discounts = item.manualSelectRewardDiscount;
    }
    return info;
  });
};

// 订单商品列表
const buildOrderItemList = ({
  orderItems,
  productLine,
  state,
  discountList,
  chargeList,
  extraItems,
  allItems,
}) => {
  // 全部菜品
  if (allItems?.length > 0) {
    return resolveDishList({
      data: allItems,
      merchantId: state.merchantProfile?.merchantId,
      productLine,
    });
  }
  // 额外菜品
  const extraItemsData =
    extraItems?.length > 0
      ? resolveDishList({
          data: extraItems,
          merchantId: state.merchantProfile?.merchantId,
          productLine,
        })
      : [];
  return orderItems
    ?.filter((e) => {
      // 直接加入order list中的兑换菜要过滤掉
      const { isCRMIntegrationFreeItem, isCrmRewardItem } = e;
      return !isCRMIntegrationFreeItem && !isCrmRewardItem;
    })
    .map((item, index) => {
      const discounts =
        item.manualSelectRewardDiscount ||
        discountList.map((each) => {
          return {
            ...each,
            extraInfo: {
              enableBenefit: true,
            },
          };
        }) ||
        [];
      const info = {
        /** 商品名称 */
        itemName: item.displayName,
        /** 唯一ID */
        id: item.uniqueItemTempId || uuidv4(),
        /** 商品ID */
        itemId: item.saleItemId,
        /** 商户ID */
        merchantId: state.merchantProfile?.merchantId,
        /** 产品线 */
        productLine: productLine,
        /** 分类ID */
        categoryId: item.categoryId?.toString() || null,
        /** 分类名称 */
        categoryName: item.categoryName || null,
        /** 商品数量 */
        quantity: item.quantity,
        /** 尺寸ID */
        sizeId: item.crmIntegrationSizeId || null,
        /** 尺寸名称 */
        sizeName: item.size || null,
        /** 是否为奖励商品 */
        isReward: item.rewardItem,
        /** 商品单价(不包含组合和调味) */
        itemPrice: item.price,
        /** 商品总价(包含组合和调味) */
        itemTotalPrice: Number(
          Big(item.totalAmount ?? item.price)
            .div(item.quantity)
            .toFixed(2)
        ),
        /** 折扣列表 */
        discounts,
        /** 加收费用列表 */
        charges: chargeList,
      };
      return info;
    })
    .concat(extraItemsData);
};

// 计算订单总金额
const calculateTotalAmount = (orderInfo, order) => {
  const subTotal = orderInfo?.orderSubtotal;
  const totalTax = orderInfo?.orderTaxTotal;
  const charge = orderInfo?.chargeTotal;
  const togoTotal = orderInfo?.togoTotal;
  const rewardDiscount = order?.rewardDiscount || 0;
  const orderDiscount = orderInfo?.orderDiscount;

  return Big(subTotal)
    .plus(totalTax)
    .plus(charge)
    .plus(togoTotal)
    .minus(rewardDiscount)
    .minus(orderDiscount)
    .toFixed(2);
};

// 订单数据转为sdk所需格式
export const formatOrderStructure = async ({ extraItems, allItems }) => {
  const { state, order, orderInfo } = await getOrderData();
  if (!order?.order) return {};
  const {
    order: { productLine, type, orderItems },
  } = order;

  const discountList = await buildDiscountList(state);
  const chargeList = await buildChargeList(state, order);
  const orderItemList = await buildOrderItemList({
    orderItems,
    productLine,
    state,
    discountList,
    chargeList,
    extraItems,
    allItems,
  });

  const totalAmount = calculateTotalAmount(orderInfo, order);

  const isItemHasDiscountList = orderItemList.find(
    (e) => e.discounts?.length > 0
  );
  const data = {
    //totalAmount: totalAmount, // 订单总金额
    orderType: type, // 订单类型
    paymentType: state?.currentOrder?.paymentType || undefined, // 支付方式
    discounts: [], //discountList, // 折扣列表
    merchantId: state.merchantProfile?.merchantId, // 商户ID
    orderItems: orderItemList, // 订单商品列表
    orderTime: new Date().toISOString(), // 下单时间
    channel: null, // 订单渠道
    charges: chargeList, // 加收费用列表
    productLine: productLine, // 产品线
    member: {
      memberId:
        state?.crm?.memberCRMInfo?.id || state?.crm?.memberCRMInfo?.userId,
    }, // 会员信息
    memberScope: 'ALL', // 会员范围
  };

  if (isItemHasDiscountList) {
    data.discounts = isItemHasDiscountList.discounts;
  }

  return data;
};

class MarketSDK {
  constructor() {
    this.api = null;
    this.isCreatingApi = false; // 解决getCouponPlugin和getPromotionPlugin同时执行时导致存在两个api的问题
  }

  async createApi() {
    if (this.api || this.isCreatingApi) return;
    this.isCreatingApi = true;
    const { state } = await getOrderData();
    const globalMarketApi = window.marketAPI || window.MarketSDK;
    this.api = globalMarketApi({
      environment: 'dev',
      cache: {
        ttl: 600,
        prefix: 'promo',
        maxSize: 5000,
      },
      monitor: {
        enabled: false,
      },
      business: {
        type: 'KIOSK',
        merchantId: state.merchantProfile?.merchantId,
      },
    });
    this.isCreatingApi = false;
  }

  async getCouponPlugin({ coupons, metas, extraItems, allItems }) {
    const formattedOrder = await formatOrderStructure({ extraItems, allItems });
    if (!this.api) {
      await this.mount();
    }
    const couponService = this.api?.getCouponPlugin();
    return {
      // 获取订单适用的优惠券
      MarketGetOrderCoupons: async () => {
        const res = await couponService?.getOrderCoupons(
          formattedOrder,
          coupons,
          metas
        );
        return { ...res, formattedOrder };
      },
      // 验证优惠券
      MarketValidateCoupons: async () => {
        return await couponService?.validateCoupons(
          formattedOrder,
          coupons,
          metas
        );
      },
    };
  }

  async getPromotionPlugin() {
    if (!this.api) {
      await this.mount();
    }
    const promotionService = this.api?.getPromotionPlugin();
    return {
      // 获取商品匹配的活动
      GetItemMatchedCampaign: async ({
        orderItemList,
        promotionList,
        orderType,
        appointItemFlag,
        merchantId,
      }) => {
        return await promotionService?.matchItemPromotion({
          orderItemList,
          promotionList,
          productLine: 'KIOSK',
          channel: null,
          orderType,
          appointItemFlag,
          merchantId,
        });
      },
      // 获取促销最终折扣或者不可用原因
      GetItemValidateStatus: async ({ rules, metas, allItems }) => {
        const formattedOrder = await formatOrderStructure({ allItems });
        return await promotionService?.getOrderRules(
          formattedOrder,
          rules,
          metas
        );
      },
      // 凑单+推荐
      AddOnItem: async ({
        promotionResult,
        itemList,
        promotionList,
        appointPromotionId,
        allItems,
      }) => {
        const order = await formatOrderStructure({ allItems });
        // 满赠、买赠需要单独处理 否则一旦选定sdk将不再校验其他促销
        const isHasAmountGiftItem = promotionList.find(
          (each) =>
            each.type === 'amountGiftItem' || each.type === 'orderItemGiftItem'
        );
        if (isHasAmountGiftItem) {
          delete order.discounts;
        }
        const res = await promotionService?.recommendOrderPromotion({
          order,
          promotionResult,
          itemList,
          promotionList,
          appointPromotionId,
          needPromotionCodes: true,
        });

        // 买赠，满赠会被固定加入到校验流程中，所以需要单独处理过滤下
        return res?.filter((e) => {
          const { recommendType, promotion, orderItemList } = e;
          if (recommendType === 'NONE') return true;
          const { type } = promotion;
          // 非买赠，满赠无需校验
          if (!GIFT_PROMOTION_TYPE.includes(type)) return true;
          // 买赠满赠可用
          if (RECOMMEND_SUCCESS_TYPE.includes(recommendType)) return true;
          // 再买X元, X件
          if (GIFT_PROMOTION_INVALID_TYPE.includes(recommendType)) {
            const orderItemInfo = order?.orderItems?.map((i) => ({
              itemId: i.itemId,
              sizeId: i.sizeId,
            }));
            // 当前订单中是否有参与满减 满赠的菜品
            const inPromotionConfigItem = orderItemList.filter((e) => {
              const { itemId, itemSizeIds } = e;
              if (!itemSizeIds?.length)
                return orderItemInfo.find((i) => i.itemId === Number(itemId));
              return orderItemInfo.find(
                (i) =>
                  i.itemId === Number(itemId) &&
                  itemSizeIds.includes(String(i.sizeId))
              );
            });
            return inPromotionConfigItem?.length > 0;
          }
        });
      },
    };
  }

  async mount() {
    if (this.api) return;
    await this.createApi();
    await this.api?.init();
  }

  async unMount() {
    if (!this.api) return;
    await this.api?.destroy();
    this.api = null;
  }
}

const crmIntegrationSDK = new MarketSDK();

export default crmIntegrationSDK;
