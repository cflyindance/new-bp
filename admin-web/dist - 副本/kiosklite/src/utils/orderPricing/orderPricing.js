/*

1.  Classes

OrderPricing               |Calculates order price detail and returns price object
DiscountChargeCalculator   |Calculates order discount and charge detail and each item�s as well
SalesTaxCalculator         |Calculates general tax detail
CanadaOntarioTaxCalculator |Calculates Canada Ontario tax detail

2. Input & Output

#######Input########

orderInfo = {
    totalTips: float,
    roundingStrategy: string,
    isTaxWithDiscount : boolean, // tax calculation including discount
    isTaxWithCharge: boolean, // tax calculation including charge
    isTaxExempt: boolean,
    discountObj:[
        {
            discount: float,
            discountIsPer: boolean, // is discount percentage
            discountRate: float // use discountRate to calculate discount when discount is percentage
        }
    ],
    chargeObj:[
        {
            charge: float,
            chargeIsPer: boolean,
            chargeRate: float
        }
    ],
    itemInfoList:[
        {
            isApplicablePromotion: boolean, // is item applicable promotion
            isSkipDiscount: boolean, //does item skip whole order percentage discount
            itemPrice: float,
            quantity: float,
            taxObj:[
                {
                    taxId: string,
                    taxRate: float,
                    taxName: string,
                    extraInfo: { // used for calculating Canada Ontoria tax temporarily
                        isTaxIncrease: boolean,
                        priceThreshold: float,
                        taxIncreaseRate: float
                    }
                }
            ],
            discountObj:[
                {
                    discount: float,
                    discountIsPer: boolean,
                    discountRate: float
                }
            ],
            chargeObj:[
                {
                    charge: float,
                    chargeIsPer: boolean,
                    chargeRate: float
                }
            ],
            options:[
                {
                    optionPrice: float,
                    quantity: float,
                    subOptions:[
                        {
                            optionPrice: float,
                            quantity: float
                        }
                    ]
                }
            ],
            extraInfo:{ // used for calculating Canada Ontoria tax temporarily
                categoryId: string,
                isQuantityRule: boolean, // true if quantityThreshold > 0
                quantityThreshold: float
            }
        }
    ],
    parentOrder:{
        suborderNum: integer, // to divide shared dish quantity
        itemInfoList:[ // the same as suborder itemInfoList
            {
                isApplicablePromotion: boolean,
                isSkipDiscount: boolean,
                itemPrice: float,
                quantity: float,
                taxObj:[],
                discountObj:[],
                chargeObj:[],
                options:[],
                extraInfo:{
                    categoryId: string,
                    isQuantityRule: boolean,
                    quantityThreshold: float
                }
            }
        ]
    }
};

########Output########

 orderPriceDetail = {
    orderSubtotal: float,
    orderTotalTips: float,
    orderDiscount: float,
    orderCharge: float,
    orderPromotion: float,
    orderOriginalSubtotal: float,
    rounding: float,
    orderTotal: float,
    orderTotalTax: float,
    orderTaxDetail:{
        taxId:{
            taxAmount: float
        }
    }
};
*/

import cloneDeep from 'lodash/cloneDeep';
import { getItemPricingSubtotal } from './itemPricingBase';

export default class OrderPricing {
  constructor(
    discountChargeCalculator,
    taxCalculator,
    chargeDetail,
    togoTaxDetail
  ) {
    this.discountChargeCalculator = discountChargeCalculator;
    this.taxCalculator = taxCalculator;
    this.chargeDetail = chargeDetail;
    this.togoTaxDetail = togoTaxDetail;
  }

  /*
   * Rounding float number to any decimal places
   *
   * @Param num: float number
   * @Param precision: decimal places
   *
   * */

  floatNumberRounding(num, precision) {
    var tempNum = parseFloat(num).toFixed(precision + 4);
    return Number(Math.round(tempNum + 'e' + precision) + 'e-' + precision);
  }

  orderDetailPrice(orderInfo) {
    var itemInfoList = this.getItemInfoListFromOrderInfo(orderInfo);
    var result = this._computeOrderDetailPrice(orderInfo, itemInfoList);

    if (
      orderInfo?.DPRate &&
      typeof orderInfo.DPRate === 'number' &&
      !Number.isNaN(orderInfo.DPRate)
    ) {
      result.orderDetailAfterDp = this._computeOrderDetailPrice(
        orderInfo,
        itemInfoList
      );
    }

    return result;
  }

  _computeOrderDetailPrice(orderInfo, itemInfoList) {
    var orderSubtotalPromotion = this.getOrderSubtotalPromotionDetail(
      orderInfo,
      itemInfoList
    );

    var orderTaxDiscountChargeDetail = this.getOrderTaxDiscountChargeDetail(
      orderInfo,
      itemInfoList,
      orderSubtotalPromotion.orderSubtotal
    );

    let chargeTotal = this.chargeDetail
      ? this.chargeDetail.getChargeDetail(itemInfoList)
      : 0;

    let togoTotal = this.togoTaxDetail
      ? this.togoTaxDetail.getTogoTotal(itemInfoList)
      : 0;

    var orderTotalTips = this.floatNumberRounding(orderInfo.totalTips, 2);
    var orderTaxDetail = orderTaxDiscountChargeDetail.orderTaxDetail;
    var orderTaxTotal = 0;

    for (var i in orderTaxDetail) {
      orderTaxDetail[i].taxAmount = this.floatNumberRounding(
        orderTaxDetail[i].taxAmount,
        2
      );
      orderTaxTotal += orderTaxDetail[i].taxAmount;
    }

    orderTaxTotal = this.floatNumberRounding(orderTaxTotal, 2);

    var orderOriginalTotal =
      orderSubtotalPromotion.orderSubtotal +
      orderTaxDiscountChargeDetail.orderCharge +
      orderTotalTips +
      orderTaxTotal -
      orderTaxDiscountChargeDetail.orderDiscount;
    orderOriginalTotal = this.floatNumberRounding(orderOriginalTotal, 2);

    var rounding;
    if (orderInfo.roundingStrategy == 'NEAREST_5_CENTS') {
      rounding = this.floatNumberRounding(
        ((orderOriginalTotal * 10000) % 500) / 10000,
        2
      );
    } else if (orderInfo.roundingStrategy == 'NEAREST_10_CENTS') {
      rounding = this.floatNumberRounding(
        ((orderOriginalTotal * 10000) % 1000) / 10000,
        2
      );
    } else {
      rounding = 0;
    }
    var orderTotal = this.floatNumberRounding(orderOriginalTotal - rounding, 2);

    return {
      orderSubtotal: orderSubtotalPromotion.orderSubtotal,
      orderPromotion: orderSubtotalPromotion.orderPromotion,
      orderDiscount: orderTaxDiscountChargeDetail.orderDiscount,
      orderCharge: orderTaxDiscountChargeDetail.orderCharge,
      orderTotalTips: orderTotalTips,
      orderTaxDetail: orderTaxDetail,
      orderTaxTotal: orderTaxTotal,
      orderOriginalTotal: orderOriginalTotal,
      rounding: rounding,
      orderTotal: orderTotal,
      chargeTotal,
      togoTotal,
    };
  }

  /*
        Rearranges parent order information and push all item info to
        new item list in order to calculate item price consistently.
    */
  getItemInfoListFromOrderInfo(orderInfo) {
    var itemInfoList = [];
    for (var i in orderInfo.itemInfoList) {
      itemInfoList.push(orderInfo.itemInfoList[i]);
    }

    if (
      orderInfo.parentOrder != undefined &&
      orderInfo.parentOrder.itemInfoList != undefined
    ) {
      var suborderNum = orderInfo.parentOrder.suborderNum;
      for (var j in orderInfo.parentOrder.itemInfoList) {
        var thisItemInfo = orderInfo.parentOrder.itemInfoList[j];
        thisItemInfo.quantity = this.floatNumberRounding(
          thisItemInfo.quantity / suborderNum,
          4
        );
        itemInfoList.push(thisItemInfo);
      }
    }

    return itemInfoList;
  }

  getOrderSubtotalPromotionDetail(orderInfo, itemInfoList) {
    var orderSubtotal = 0;
    var orderPromotion = 0;
    for (var i in itemInfoList) {
      var thisItemInfo = itemInfoList[i];
      this.discountChargeCalculator.itemDiscountChargeCalculator(
        thisItemInfo,
        orderInfo
      );
      var itemPriceDetail = thisItemInfo.itemPriceDetail;
      orderSubtotal += this.floatNumberRounding(
        getItemPricingSubtotal(itemPriceDetail) +
          itemPriceDetail.itemCharge -
          itemPriceDetail.itemDiscount,
        2
      );
      orderPromotion += this.floatNumberRounding(
        itemPriceDetail.itemPromotion,
        2
      );
    }

    return {
      orderSubtotal: this.floatNumberRounding(orderSubtotal, 2),
      orderPromotion: this.floatNumberRounding(orderPromotion, 2),
    };
  }

  getOrderTaxDiscountChargeDetail(orderInfo, itemInfoList, orderSubtotal) {
    let chargeDetailMap = {};
    var orderTaxDetail = {};
    var orderDiscount = orderInfo.discount || 0;
    var orderCharge = 0;
    if (!!orderInfo.isTaxExempt) {
      for (var i in itemInfoList) {
        orderDiscount = this.discountChargeCalculator.addOrderDiscountInfo2Item(
          orderInfo,
          itemInfoList[i],
          orderSubtotal,
          orderDiscount
        );
        orderCharge = this.discountChargeCalculator.addOrderChargeInfo2Item(
          orderInfo,
          itemInfoList[i],
          orderSubtotal,
          orderCharge
        );
      }
    } else {
      for (var i in itemInfoList) {
        orderDiscount = this.discountChargeCalculator.addOrderDiscountInfo2Item(
          orderInfo,
          itemInfoList[i],
          orderSubtotal,
          orderDiscount
        );
        orderCharge = this.discountChargeCalculator.addOrderChargeInfo2Item(
          orderInfo,
          itemInfoList[i],
          orderSubtotal,
          orderCharge
        );

        this.taxCalculator.itemSalesTaxCalculation(itemInfoList[i]);
        orderTaxDetail = this.taxCalculator.orderTaxDetailAccumulation(
          itemInfoList[i],
          orderTaxDetail
        );

        if (this.chargeDetail && this.chargeDetail.getIsCalcChargeTax()) {
          chargeDetailMap = this.chargeDetail.chargeTaxDetailAccumulation(
            itemInfoList[i],
            chargeDetailMap,
            itemInfoList
          );
        }
      }
      orderTaxDetail = this.taxCalculator.orderSalesTaxCalculation(
        orderInfo,
        orderTaxDetail
      );

      if (JSON.stringify(chargeDetailMap) !== '{}') {
        // 遍历orderTaxDetail，将chargeTax，加入到原先的orderTaxDetail中
        for (let key in orderTaxDetail) {
          for (let c in chargeDetailMap) {
            if (key === c) {
              let t =
                orderTaxDetail[key].taxAmount +
                chargeDetailMap[key].subChargeTax;
              orderTaxDetail[key].taxAmount = t;
              break;
            }
          }
        }
      }

      // 计算togo的税
      if (this.togoTaxDetail && this.togoTaxDetail.getIsCalcTogoTax()) {
        let togoDetailMap =
          this.togoTaxDetail.togoTaxDetailAccumulation(itemInfoList);
        for (let key in orderTaxDetail) {
          for (let c in togoDetailMap) {
            if (key === c) {
              let t =
                orderTaxDetail[key].taxAmount + togoDetailMap[key].togoTax;
              orderTaxDetail[key].taxAmount = t;
              break;
            }
          }
        }
      }
    }

    return {
      orderDiscount: this.floatNumberRounding(orderDiscount, 2),
      orderCharge: this.floatNumberRounding(orderCharge, 2),
      orderTaxDetail: orderTaxDetail,
    };
  }
}
