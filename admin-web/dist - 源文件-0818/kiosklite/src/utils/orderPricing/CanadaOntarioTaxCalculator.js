import SalesTaxCalculator from './salesTaxCalculator';
import { getItemPricingSubtotal } from './itemPricingBase';

export default class CanadaOntarioTaxCalculator extends SalesTaxCalculator {
  constructor() {
    super();
  }

  itemSalesExtraTaxInfoCalculation(itemTaxDetail, itemTaxObj) {
    var taxId = itemTaxObj.taxId;
    itemTaxDetail[taxId].isTaxIncrease = itemTaxObj.extraInfo.isTaxIncrease;
    itemTaxDetail[taxId].priceThreshold = itemTaxObj.extraInfo.priceThreshold;
    itemTaxDetail[taxId].taxIncreaseRate = itemTaxObj.extraInfo.taxIncreaseRate;
  }

  itemSalesTaxCalculation(itemInfo) {
    var itemTaxDetail = {};
    var itemTaxObj = itemInfo.taxObj;
    for (var i in itemTaxObj) {
      itemTaxDetail = super.itemSalesTaxDetailCalculation(itemInfo, itemTaxDetail, itemTaxObj[i]);
      this.itemSalesExtraTaxInfoCalculation(itemTaxDetail, itemTaxObj[i]);
    }
    itemInfo.itemPriceDetail.itemTaxDetail = itemTaxDetail;
  }

  orderExtraTaxInfoCalculation(orderTaxDetail, itemTaxDetailInfo) {
    orderTaxDetail.isTaxIncrease = itemTaxDetailInfo.isTaxIncrease;
    orderTaxDetail.taxIncreaseRate = itemTaxDetailInfo.taxIncreaseRate;
    orderTaxDetail.priceThreshold = itemTaxDetailInfo.priceThreshold;
  }

  orderTaxDetailAccumulation(itemInfo, orderTaxDetail) {
    /*
     *@Param
     *   taxDetail: inculdes order subtotal, item discount
     *       sum,item charge sum, order discount sum order
     *       charge sum and tax rate as well.
     *
     *    taxListByCategory: includes subtotal, item discount sum,
     *        item charge sum, order discount sum, orde charge sum
     *        and quantity sum as well with the same category id.
     *
     * */

    if (orderTaxDetail.taxDetail == undefined) {
      orderTaxDetail.taxDetail = {};
    }
    if (orderTaxDetail.taxListByCategory == undefined) {
      orderTaxDetail.taxListByCategory = {};
    }
    var taxDetail = orderTaxDetail.taxDetail;
    var taxListByCategory = orderTaxDetail.taxListByCategory;

    var itemTaxDetail = itemInfo.itemPriceDetail.itemTaxDetail;
    var taxIdList = [];

    for (var i in itemTaxDetail) {
      taxIdList.push(i);
      taxDetail[i] = super.orderTaxDetailCalculation(taxDetail[i], itemTaxDetail[i]);
      this.orderExtraTaxInfoCalculation(taxDetail[i], itemTaxDetail[i]);
    }

    if (!!itemInfo.extraInfo.isQuantityRule) {
      var cid = itemInfo.extraInfo.categoryId;
      if (taxListByCategory[cid] == undefined) {
        taxListByCategory[cid] = {};
        taxListByCategory[cid] = super.initObjBasicPriceInfo(taxListByCategory[cid]);
        taxListByCategory[cid].quantity = 0;
        taxListByCategory[cid].taxId = taxIdList;
        taxListByCategory[cid].quantityThreshold = itemInfo.extraInfo.quantityThreshold;
      }
      taxListByCategory[cid] = super.accumulateObjBasicPriceInfo(
        taxListByCategory[cid],
        itemInfo.itemPriceDetail,
      );
      taxListByCategory[cid].subTotal += getItemPricingSubtotal(
        itemInfo.itemPriceDetail
      );
      taxListByCategory[cid].quantity += itemInfo.quantity;
    }

    return orderTaxDetail;
  }

  orderSalesTaxCalculation(orderInfo, orderTaxDetail) {
    var newOrderTaxDetail = {};
    var taxDetail = orderTaxDetail.taxDetail;
    var taxListByCategory = orderTaxDetail.taxListByCategory;
    var isTaxWithDiscount = orderInfo.isTaxWithDiscount;
    var isTaxWithCharge = orderInfo.isTaxWithCharge;

    for (var i in taxListByCategory) {
      if (taxListByCategory[i].quantity > taxListByCategory[i].quantityThreshold) {
        var taxIdList = taxListByCategory[i].taxId;
        for (var j in taxIdList) {
          taxDetail[taxIdList[j]].subTotal -= taxListByCategory[i].subTotal;
          taxDetail[taxIdList[j]].itemDiscount -= taxListByCategory[i].itemDiscount;
          taxDetail[taxIdList[j]].itemCharge -= taxListByCategory[i].itemCharge;
          taxDetail[taxIdList[j]].orderDiscount -= taxListByCategory[i].orderDiscount;
          taxDetail[taxIdList[j]].orderCharge -= taxListByCategory[i].orderCharge;
        }
      }
    }

    for (var i in taxDetail) {
      var taxRate = taxDetail[i].taxRate;
      var takeoutTaxFree = taxDetail[i].takeoutTaxFree;
      var discountChargeInfo = super.discountCharge4OrderTaxCalculation(
        taxDetail[i],
        isTaxWithDiscount,
        isTaxWithCharge,
      );
      newOrderTaxDetail[i] = {};
      newOrderTaxDetail[i].taxName = taxDetail[i].taxName;
      // 当 takeoutTaxFree 为 true 时，税费为 0
      if (takeoutTaxFree) {
        newOrderTaxDetail[i].taxAmount = 0;
      } else {
        var total = taxDetail[i].subTotal - discountChargeInfo.discount + discountChargeInfo.charge;
        if (taxDetail[i].isTaxIncrease && total > taxDetail[i].priceThreshold) {
          taxRate += taxDetail[i].taxIncreaseRate;
        }
        newOrderTaxDetail[i].taxAmount = total * taxRate;
      }
    }
    return newOrderTaxDetail;
  }
}
