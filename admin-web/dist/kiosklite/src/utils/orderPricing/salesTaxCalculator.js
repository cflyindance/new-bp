import { getItemPricingSubtotal } from './itemPricingBase';

export default class SalesTaxCalculator {
  floatNumberRounding(num, precision) {
    var tempNum = parseFloat(num).toFixed(precision + 4);
    return Number(Math.round(tempNum + 'e' + precision) + 'e-' + precision);
  }

  initObjBasicPriceInfo(thisObj) {
    thisObj.subTotal = 0;
    thisObj.itemDiscount = 0;
    thisObj.itemCharge = 0;
    thisObj.orderDiscount = 0;
    thisObj.orderCharge = 0;
    return thisObj;
  }

  accumulateObjBasicPriceInfo(thisObj, priceInfo) {
    thisObj.itemDiscount += priceInfo.itemDiscount;
    thisObj.itemCharge += priceInfo.itemCharge;
    thisObj.orderDiscount += priceInfo.orderDiscount;
    thisObj.orderCharge += priceInfo.orderCharge;
    return thisObj;
  }
  itemSalesTaxDetailCalculation(itemInfo, itemTaxDetail, itemTaxObj) {
    var taxId = itemTaxObj.taxId;
    itemTaxDetail[taxId] = {};
    itemTaxDetail[taxId].subTotal = getItemPricingSubtotal(
      itemInfo.itemPriceDetail
    );
    itemTaxDetail[taxId].itemDiscount = itemInfo.itemPriceDetail.itemDiscount;
    itemTaxDetail[taxId].itemCharge = itemInfo.itemPriceDetail.itemCharge;
    itemTaxDetail[taxId].orderDiscount = itemInfo.itemPriceDetail.orderDiscount;
    itemTaxDetail[taxId].orderCharge = itemInfo.itemPriceDetail.orderCharge;
    itemTaxDetail[taxId].taxRate = itemTaxObj.taxRate;
    itemTaxDetail[taxId].taxName = itemTaxObj.taxName;
    itemTaxDetail[taxId].isSkipDiscount = itemInfo.isSkipDiscount;
    itemTaxDetail[taxId].takeoutTaxFree = itemTaxObj.extraInfo.takeoutTaxFree;
    return itemTaxDetail;
  }

  itemSalesTaxCalculation(itemInfo) {
    var itemTaxDetail = {};
    var itemTaxObj = itemInfo.taxObj;
    for (var i in itemTaxObj) {
      this.itemSalesTaxDetailCalculation(
        itemInfo,
        itemTaxDetail,
        itemTaxObj[i]
      );
    }
    itemInfo.itemPriceDetail.itemTaxDetail = itemTaxDetail;
  }

  orderTaxDetailCalculation(orderTaxDetail, itemTaxDetailInfo) {
    if (orderTaxDetail == undefined) {
      orderTaxDetail = {};
      orderTaxDetail = this.initObjBasicPriceInfo(orderTaxDetail);
      orderTaxDetail.taxRate = itemTaxDetailInfo.taxRate;
      orderTaxDetail.taxName = itemTaxDetailInfo.taxName;
      orderTaxDetail.takeoutTaxFree = itemTaxDetailInfo.takeoutTaxFree;
    }
    // 如果当前 item 的 takeoutTaxFree 为 true，则不累加该 item 的税费相关金额
    if (!itemTaxDetailInfo.takeoutTaxFree) {
      this.accumulateObjBasicPriceInfo(orderTaxDetail, itemTaxDetailInfo);
      orderTaxDetail.subTotal += itemTaxDetailInfo.subTotal;
      // 如果有一个 item 的 takeoutTaxFree 为 false，则整个 taxId 的 takeoutTaxFree 为 false
      orderTaxDetail.takeoutTaxFree = false;
    }
    // 如果所有 item 的 takeoutTaxFree 都为 true，则 orderTaxDetail.takeoutTaxFree 保持为 true
    return orderTaxDetail;
  }

  orderTaxDetailAccumulation(itemInfo, orderTaxDetail) {
    var itemTaxDetail = itemInfo.itemPriceDetail.itemTaxDetail;
    for (var i in itemTaxDetail) {
      orderTaxDetail[i] = this.orderTaxDetailCalculation(
        orderTaxDetail[i],
        itemTaxDetail[i]
      );
    }
    return orderTaxDetail;
  }

  discountCharge4OrderTaxCalculation(
    orderTaxDetail,
    isTaxWithDiscount,
    isTaxWithCharge
  ) {
    if (!!isTaxWithDiscount) {
      var discount = orderTaxDetail.itemDiscount + orderTaxDetail.orderDiscount;
    } else {
      var discount = 0;
    }
    if (!!isTaxWithCharge) {
      var charge = orderTaxDetail.itemCharge + orderTaxDetail.orderCharge
    } else {
      var charge = 0
    }
    return {
      discount: discount,
      charge: charge,
    };
  }

  orderSalesTaxCalculation(orderInfo, orderTaxDetail) {
    var newOrderTaxDetail = {};
    var isTaxWithDiscount = orderInfo.isTaxWithDiscount;
    var isTaxWithCharge = orderInfo.isTaxWithCharge;

    for (var i in orderTaxDetail) {
      var taxRate = orderTaxDetail[i].taxRate;
      var taxName = orderTaxDetail[i].taxName;
      var takeoutTaxFree = orderTaxDetail[i].takeoutTaxFree;
      var discountChargeInfo = this.discountCharge4OrderTaxCalculation(
        orderTaxDetail[i],
        isTaxWithDiscount,
        isTaxWithCharge
      );
      newOrderTaxDetail[i] = {};
      newOrderTaxDetail[i].taxName = taxName;
      newOrderTaxDetail[i].taxRate = taxRate;
      // 当 takeoutTaxFree 为 true 时，税费为 0
      if (takeoutTaxFree) {
        newOrderTaxDetail[i].taxAmount = 0;
      } else {
        var baseAmount = this.floatNumberRounding(
          orderTaxDetail[i].subTotal -
            discountChargeInfo.discount +
            discountChargeInfo.charge,
          2
        );
        newOrderTaxDetail[i].taxAmount = baseAmount * taxRate;
      }
    }
    return newOrderTaxDetail;
  }
}
