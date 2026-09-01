import { getItemPricingSubtotal } from './itemPricingBase';

export default class DiscountChargeCalculator {
  itemDiscountChargeCalculator(itemInfo, orderInfo) {
    var itemSubtotal = 0;
    var itemCharge = 0;
    var itemDiscount = itemInfo.discount || 0;
    var itemOptionsPrice = 0;
    var isPromotion = itemInfo.isApplicablePromotion;
    var itemPromotion = 0;
    var itemDiscountInfo = itemInfo.discountObj;
    var itemChargeInfo = itemInfo.chargeObj;

    // item subtotal
    for (var i in itemInfo.options) {
      var itemSuboptPrice = 0;
      var optInfo = itemInfo.options[i];
      for (var j in optInfo.subOptions) {
        var subOptInfo = optInfo.subOptions[j];
        itemSuboptPrice += subOptInfo.optionPrice * subOptInfo.quantity;
      }
      itemOptionsPrice +=
        (optInfo.optionPrice + itemSuboptPrice) * optInfo.quantity;
    }

    itemSubtotal += (itemInfo.itemPrice + itemOptionsPrice) * itemInfo.quantity;

    var itemSubtotalDP;
    if (
      orderInfo &&
      typeof orderInfo.DPRate === 'number' &&
      !Number.isNaN(orderInfo.DPRate) &&
      itemInfo.isCRMIntegrationFreeItem !== true
    ) {
      itemSubtotalDP =
        (itemInfo.itemPrice + itemOptionsPrice) *
        (1 + orderInfo.DPRate) *
        itemInfo.quantity;
    }

    var pricingBase =
      itemSubtotalDP !== undefined ? itemSubtotalDP : itemSubtotal;

    // item discount
    for (var i in itemDiscountInfo) {
      var discountInfo = itemDiscountInfo[i];
      if (!!discountInfo?.discountIsPer) {
        itemDiscount +=
          pricingBase * discountInfo.discountRate * itemInfo.quantity;
      } else {
        itemDiscount += discountInfo.discount * itemInfo.quantity;
      }
    }

    // item charge
    for (var i in itemChargeInfo) {
      var chargeInfo = itemChargeInfo[i];
      if (chargeInfo?.chargeIsPer) {
        itemCharge += pricingBase * chargeInfo.chargeRate * itemInfo.quantity;
      } else {
        itemCharge += chargeInfo.charge * itemInfo.quantity;
      }
    }

    // item promotion
    if (!!isPromotion) {
      itemPromotion += pricingBase - itemDiscount + itemCharge;
    }

    itemInfo.itemPriceDetail = {
      itemSubtotal: itemSubtotal,
      itemDiscount: itemDiscount,
      itemCharge: itemCharge,
      itemPromotion: itemPromotion,
      ...(itemSubtotalDP !== undefined ? { itemSubtotalDP: itemSubtotalDP } : {}),
    };
  }

  addOrderDiscountInfo2Item(
    orderInfo,
    itemInfo,
    orderSubtotal,
    orderTotalDiscount
  ) {
    var orderDiscountObj = orderInfo.discountObj;
    var priceDetail = itemInfo.itemPriceDetail;
    var itemTotalPrice =
      getItemPricingSubtotal(priceDetail) -
      priceDetail.itemDiscount +
      priceDetail.itemCharge;
    var orderDiscount = 0;
    for (var i in orderDiscountObj) {
      if (!!orderDiscountObj[i].discountIsPer) {
        if (!itemInfo.isSkipDiscount) {
          orderDiscount += itemTotalPrice * orderDiscountObj[i].discountRate;
        }
      } else {
        if (orderSubtotal > 0) {
          orderDiscount +=
            (itemTotalPrice / orderSubtotal) * orderDiscountObj[i].discount;
        }
      }
    }

    priceDetail.orderDiscount = orderDiscount;
    orderTotalDiscount += orderDiscount;
    return orderTotalDiscount;
  }

  addOrderChargeInfo2Item(
    orderInfo,
    itemInfo,
    orderSubtotal,
    orderTotalCharge
  ) {
    var orderChargeObj = orderInfo.chargeObj;
    var priceDetail = itemInfo.itemPriceDetail;
    var itemTotalPrice =
      getItemPricingSubtotal(priceDetail) -
      priceDetail.itemDiscount +
      priceDetail.itemCharge;
    var orderCharge = 0;
    for (var i in orderChargeObj) {
      if (!!orderChargeObj[i].chargeIsPer) {
        orderCharge += itemTotalPrice * orderChargeObj[i].chargeRate;
      } else {
        if (orderSubtotal > 0) {
          orderCharge +=
            (itemTotalPrice / orderSubtotal) * orderChargeObj[i].charge;
        }
      }
    }
    priceDetail.orderCharge = orderCharge;
    orderTotalCharge += orderCharge;
    return orderTotalCharge;
  }

  orderDiscountChargeCalculator(orderInfo, orderSubtotal) {
    var orderDiscountObj = orderInfo.discountObj;
    var orderChargeObj = orderInfo.chargeObj;
    var orderDiscount = 0;
    var orderCharge = 0;

    // calculate order discount
    for (var i in orderDiscountObj) {
      var discountInfo = orderDiscountObj[i];
      if (!!discountInfo.discountIsPer) {
        orderDiscount += orderSubtotal * discountInfo.discountRate;
      } else {
        orderDiscount += discountInfo.discount;
      }
    }

    // calculate order charge
    for (var i in orderChargeObj) {
      var chargeInfo = orderChargeObj[i];
      if (!!chargeInfo.chargeIsPer) {
        orderCharge += orderSubtotal * chargeInfo.chargeRate;
      } else {
        orderCharge += chargeInfo.charge;
      }
    }

    return {
      orderDiscount: orderDiscount,
      orderCharge: orderCharge,
    };
  }
}
