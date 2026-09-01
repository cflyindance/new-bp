import { getCookie } from '@/utils';
import { useState } from 'react';
import { saveGiftCardOrderBySoap } from '@/api/eCard';
import { saveOrder } from '@/api';
import { XMLObjTree } from '@/utils/ObjectTree';
import { parseSaveGiftCardOrderSoapResponse } from '@/utils/structureOrderInfoKey';
import Big from 'big.js';
import { getOrderInfo } from '@/api/apiPos';
import floatNumberRounding from '@/utils/formatNumberRounding';
import store from '@/reducers/store';

const attachDualPriceToGiftCardOrder = (order, allSysConfig) => {
  if (
    allSysConfig?.CREDIT_CHARGE_ENABLE !== 'true' &&
    allSysConfig?.CREDIT_CHARGE_ENABLE !== true
  ) {
    return order;
  }
  const rate = Number(allSysConfig?.CREDIT_CHARGE_RATE || 0);
  const dpMultiplier = Number(Big(1).plus(Big(rate).div(100)));
  const toRoundedNumber = (val) => Number(floatNumberRounding(val ?? 0));
  const toDpAmount = (val) => {
    if (val === undefined || val === null || val === '') {
      return val;
    }
    return toRoundedNumber(Big(val).times(dpMultiplier).toNumber());
  };

  // 礼品卡仅能用信用卡支付：现金基价从order取
  const cashSubtotalFromItems = (order.orderItems || []).reduce((sum, item) => {
    const qty = Number(item.quantity || 1);
    const linePrice = Number(item.price ?? 0);
    const lineTotal = Number(
      item.totalAmount != null
        ? item.totalAmount
        : Big(linePrice).times(qty).toNumber()
    );
    const lineDiscount = Number(item.discount || 0);
    return Number(Big(sum).plus(lineTotal).minus(lineDiscount).toFixed(2));
  }, 0);
  const cashTaxFromLines =
    Array.isArray(order.orderTax) && order.orderTax.length
      ? order.orderTax.reduce(
          (sum, t) =>
            Number(
              Big(sum)
                .plus(Number(t.taxAmount || 0))
                .toFixed(2)
            ),
          0
        )
      : 0;
  // 无分项税时退回 totalTax 作现金税基；菜价小计仍只用 orderItems
  const cashTaxBase = cashTaxFromLines || Number(order.totalTax || 0);
  const cashDiscountBase = Number(order.discount || 0);
  const cashRewardDiscount = Number(order.rewardDiscount || 0);
  const cashTips = Number(order.totalTips || 0);
  const cashCharge = Number(order.chargeTotal ?? order.charge ?? 0);
  const cashTogo = Number(order.togoTotal || 0);

  // 以下均为 DP（信用卡）侧金额，由现金基价经费率换算得到
  const totalPrice = toDpAmount(cashSubtotalFromItems);
  const totalTax = toDpAmount(cashTaxBase);
  const discount = cashDiscountBase ? toDpAmount(cashDiscountBase) : 0;
  const rewardDiscount = cashRewardDiscount
    ? toDpAmount(cashRewardDiscount)
    : 0;
  const totalTips = cashTips ? toDpAmount(cashTips) : 0;
  const chargeTotal = cashCharge ? toDpAmount(cashCharge) : 0;
  const togoTotal = cashTogo ? toDpAmount(cashTogo) : 0;

  const totalPriceAfterDp = totalPrice;
  const totalTaxAfterDp = totalTax;
  const discountAfterDp = discount || 0;
  const rewardDiscountAfterDp = rewardDiscount || 0;
  const totalTipsAfterDp = totalTips || 0;
  const chargeTotalAfterDp = chargeTotal || 0;

  const cashPaymentTotal = Number(
    Big(cashSubtotalFromItems)
      .plus(cashTaxBase)
      .plus(cashTogo)
      .minus(cashRewardDiscount)
      .minus(cashDiscountBase)
      .toFixed(2)
  );
  const creditPaymentTotal = Number(
    Big(totalPrice || 0)
      .plus(totalTax || 0)
      .plus(chargeTotal || 0)
      .plus(togoTotal || 0)
      .plus(totalTips || 0)
      .minus(rewardDiscount || 0)
      .minus(discount || 0)
      .toFixed(2)
  );

  const orderItems = Array.isArray(order.orderItems)
    ? order.orderItems.map((item) => {
        const qty = Number(item.quantity || 1);
        const linePrice = Number(item.price ?? 0);
        const lineTotal = Number(
          item.totalAmount != null
            ? item.totalAmount
            : Big(linePrice).times(qty).toNumber()
        );
        const lineDiscount = Number(item.discount || 0);
        const priceAfterDp = toDpAmount(linePrice);
        let next = { ...item, priceAfterDp };
        if (lineDiscount) {
          const discountDp = toDpAmount(lineDiscount);
          next = {
            ...next,
            discount: discountDp,
            discountAfterDp: discountDp,
            totalAmount: Number(
              Big(toDpAmount(lineTotal)).minus(discountDp).toFixed(2)
            ),
          };
        } else {
          next.totalAmount = toDpAmount(lineTotal);
        }
        return next;
      })
    : order.orderItems;

  const nextOrder = {
    ...order,
    totalPrice,
    totalTax,
    discount,
    rewardDiscount,
    totalTips,
    togoTotal,
    priceType: 'CREDIT_PRICE',
    cashPaymentTotal,
    creditPaymentTotal,
    totalPriceAfterDp,
    totalTaxAfterDp,
    totalTipsAfterDp,
    orderItems,
  };
  if (cashDiscountBase) {
    nextOrder.discountAfterDp = discountAfterDp;
  }
  if (cashRewardDiscount) {
    nextOrder.rewardDiscountAfterDp = rewardDiscountAfterDp;
  }
  if (cashCharge) {
    nextOrder.chargeTotal = chargeTotal;
    nextOrder.chargeTotalAfterDp = chargeTotalAfterDp;
    nextOrder.charge = chargeTotal;
  }
  if (Array.isArray(order.orderTax) && order.orderTax.length) {
    nextOrder.orderTax = order.orderTax.map((t) => ({
      ...t,
      taxAmountAfterDp: toDpAmount(t.taxAmount || 0),
    }));
  }
  return nextOrder;
};

const SOAP_BODY_START = '<soap:Body>';
const SOAP_BODY_END = '</soap:Body>';
const CHECK_GIFT_CARD_ERROR = 'Check gift card number failed';

const parseSoapOrder = (data, responseType) => {
  let soapResponse = data;
  const start = soapResponse?.indexOf(SOAP_BODY_START);
  const end = soapResponse?.indexOf(SOAP_BODY_END);

  soapResponse = soapResponse?.substring(start + 11, end);
  const objTree = new XMLObjTree();
  const instanceList = objTree?.parseXML(soapResponse);
  return instanceList?.[responseType]?.order;
};

const fetchOrderXMLInfo = (data) => {
  return parseSoapOrder(data, 'fetchorderresponsetype');
};

const getXMLOrderInfo = (data) => {
  return parseSoapOrder(data, 'saveorderresponsetype');
};

const buildRegistrationOrder = ({
  receivedAmount,
  cloudGiftCardItem,
  phone,
}) => {
  return {
    totalPrice: receivedAmount,
    saleItemId: cloudGiftCardItem.id,
    quantity: 1,
    price: receivedAmount,
    actionType: 'registration',
    cardType: 'virtual',
    to: phone.replace(/\D/g, ''),
    toType: 'phone',
    expirationTime: '2099-12-31',
    sessionKey: getCookie('sessionKey'),
  };
};

const useBuyGiftCard = (props) => {
  const { setCardPaidResult, saveOrderResult } = props;
  const [loading, setLoading] = useState(false);

  const changeGiftCardOrderPrice = async ({
    orderInfo,
    quickAmount,
    onCreateSuccess,
  }) => {
    try {
      const { bonusAmount, saveAmount, discountValue } = quickAmount;
      const isSaveType = (saveAmount || 0) > 0;
      const isBonusType = (bonusAmount || 0) > 0;
      const { allSysConfig } = store.getState();
      const isDualPrice =
        allSysConfig?.CREDIT_CHARGE_ENABLE === 'true' ||
        allSysConfig?.CREDIT_CHARGE_ENABLE === true;
      if (isSaveType || isBonusType || isDualPrice) {
        const discountInfo = {
          discountID: -1,
          discountRateType: isSaveType ? 2 : 1, // saveAmount 省钱为百分比 赠金为固定
          discount: isSaveType ? saveAmount : bonusAmount,
          discountRate: discountValue,
        };
        let orderForSave = {
          ...orderInfo,
          ...discountInfo,
          userAuth: {
            sessionKey: getCookie('sessionKey'),
          },
        };
        let dualTotals = null;
        if (isDualPrice) {
          orderForSave = attachDualPriceToGiftCardOrder(
            orderForSave,
            allSysConfig
          );
          dualTotals = {
            cashPaymentTotal: orderForSave.cashPaymentTotal,
            creditPaymentTotal: orderForSave.creditPaymentTotal,
          };
        }
        const unpaidInfo = {
          paid: 0,
          unpaid: isDualPrice
            ? Number(dualTotals.creditPaymentTotal)
            : Number(
                Big(orderForSave.totalPrice || 0)
                  .minus(orderForSave.discount || 0)
                  .toFixed(2)
              ),
        };
        const saveOrderData = {
          order: {
            ...orderForSave,
            unpaidInfo,
          },
        };

        const res = await saveOrder(saveOrderData);
        if (!res?.data?.result?.successful) {
          throw new Error(CHECK_GIFT_CARD_ERROR);
        }

        const orderResultData = res.data.order;
        if (dualTotals) {
          orderResultData.cashPaymentTotal = dualTotals.cashPaymentTotal;
          orderResultData.creditPaymentTotal = dualTotals.creditPaymentTotal;
        }
        orderResultData.unpaidInfo = unpaidInfo;

        const orderId = orderResultData.id;
        const fetchOrderRes = await getOrderInfo(orderId);
        const cardPaidResultData = fetchOrderRes.data
          ? fetchOrderXMLInfo(fetchOrderRes.data) || {}
          : {};
        if (JSON.stringify(cardPaidResultData) === '{}') {
          throw new Error(CHECK_GIFT_CARD_ERROR);
        }

        cardPaidResultData.unpaidInfo = unpaidInfo;
        setCardPaidResult(cardPaidResultData);
        saveOrderResult(orderResultData);
        onCreateSuccess();
      }
    } catch (e) {
      throw new Error(CHECK_GIFT_CARD_ERROR);
    }
  };

  const createGiftCardOrder = async ({
    quickAmount,
    cloudGiftCardItem,
    phone,
    onCreateSuccess,
  }) => {
    try {
      setLoading(true);
      const { receivedAmount, bonusAmount, saveAmount } = quickAmount;
      const orderData = buildRegistrationOrder({
        receivedAmount,
        cloudGiftCardItem,
        phone,
      });
      const saveOrderRes = await saveGiftCardOrderBySoap(orderData);
      // warn: 这个xml方法返回的数据都是小写的 只能存 setCardPaidResult
      let orderInfo = saveOrderRes.data
        ? getXMLOrderInfo(saveOrderRes.data) || {}
        : {};
      if (JSON.stringify(orderInfo) !== '{}') {
        const unpaidInfo = { paid: 0, unpaid: orderInfo.totalprice };
        const cardPaidResultOrderData = {
          ...orderInfo,
          unpaidInfo,
        };
        // 把全部小写的key转换为接口真实返回
        const orderResultOrderData = parseSaveGiftCardOrderSoapResponse(
          saveOrderRes.data
        ).order;
        orderResultOrderData.unpaidInfo = unpaidInfo;
        // 判断是否需要二次存单以改价（开了 DP 也要二次存单）
        const { allSysConfig } = store.getState();
        const isDualPriceEnabled =
          allSysConfig?.CREDIT_CHARGE_ENABLE === 'true' ||
          allSysConfig?.CREDIT_CHARGE_ENABLE === true;
        const isNeedChangePayPrice =
          Number(bonusAmount || 0) > 0 ||
          Number(saveAmount || 0) > 0 ||
          isDualPriceEnabled;
        if (!isNeedChangePayPrice) {
          setCardPaidResult(cardPaidResultOrderData);
          saveOrderResult(orderResultOrderData);
          return onCreateSuccess();
        }
        // 有bonus或者save的卡, 需要改价存单, 再继续
        await changeGiftCardOrderPrice({
          orderInfo: orderResultOrderData,
          quickAmount,
          onCreateSuccess,
        });
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createGiftCardOrder,
    loading,
  };
};

export default useBuyGiftCard;
