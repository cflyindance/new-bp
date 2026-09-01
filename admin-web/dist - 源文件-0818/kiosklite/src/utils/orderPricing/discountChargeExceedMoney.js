/**
 * 逾额即打折（订单中参与折扣的类，类中的菜满折满减活动）
 * 1、对订单的类的享有固定折扣：即活动期间单个订单中参与折扣的【类】可享受满减
 * 2、对订单的类的享有百分比折扣：即活动期间单个订单中参与折扣的【类】可享受几折优惠
 *
 * 类型不同（1：固定金额，2：百分比），计算多税的算法不同
 */

import store from '../../reducers/store'
import { getItemPricingSubtotal } from './itemPricingBase'

import Big from 'big.js';

export default class DiscountChargeExceedMoney {
  constructor(isCalcExceedMoneyTax) {
    this.disType = 0 // 折扣类型（1：固定金额，2：百分比）
    this.allPromotion = 0 // 折扣菜的总金额
    this.promotionRate = 0 // 折扣比例（只有折扣类型是百分比才有）
    this.isCalcExceedMoneyTax = isCalcExceedMoneyTax // 是否折扣前后算税
  }

  getIsCalcExceedMoneyTax() {
    return this.isCalcExceedMoneyTax
  }

  // 计算所有菜的金额
  getTotal(itemInfoList) {
    let total = 0
    if (itemInfoList?.length) {
      itemInfoList.forEach((item) => {
        total = Big(total).plus(getItemPricingSubtotal(item.itemPriceDetail)).toNumber()
      })
    }
    return total
  }

  // 计算符合逾额折扣后的折扣信息
  getOrderDiscountExceedMoney(orderSubtotalPromotion) {
    let detail = {}
    const state = store.getState()
    const discountRule = state.discount.currentDiscountMap

    if (discountRule && JSON.stringify(discountRule) !== '{}') {
      const orderPromotion = orderSubtotalPromotion.orderPromotion
      if (orderPromotion >= discountRule.thresholdprice) {
        let discount = 0
        let discountID = ''
        this.disType = discountRule.ratetype
        // 1：固定金额，2：比例
        if (discountRule.ratetype == 1) {
          discountID = discountRule.discountcashid
          discount = discountRule.rate
        } else if (discountRule.ratetype == 2) {
          this.promotionRate = discountRule.rate
          discountID = discountRule.discountpercentageid
          discount = parseFloat(Big(discountRule.rate).div(100).times(orderPromotion).toFixed(2))
        }
        detail = {
          discountName: discountRule.ratename,
          discountID,
          discount,
        }
      }
    }

    this.allPromotion = detail?.discount || 0
    return detail
  }

  // 计算折扣的税
  exceedMoneyTaxDetailAccumulation(itemInfo) {
    let taxMap = {}
    let subTotal = this.getTotal(itemInfo)

    // 固定金额算多税
    if (this.disType == 1) {
      for (let i = 0; i < itemInfo.length; i++) {
        let item = itemInfo[i]
        let disRate = parseFloat(Big(getItemPricingSubtotal(item.itemPriceDetail)).div(subTotal))
        let taxList = item.itemPriceDetail.itemTaxDetail
        for (let key in taxList) {
          // console.log(`${this.allPromotion}*(${item.itemPriceDetail.itemSubtotal}/${subTotal})*${taxList[key].taxRate}`)
          let tax = Big(this.allPromotion).times(disRate).times(taxList[key].taxRate).toNumber()
          if (taxMap[key]) {
            taxMap[key] = {
              tax: Big(taxMap[key].tax).plus(tax).toNumber(),
            }
          } else {
            taxMap[key] = {
              tax,
            }
          }
        }
      }
    } else if (this.disType == 2) {
      for (let i = 0; i < itemInfo.length; i++) {
        let item = itemInfo[i]
        let taxList = item.itemPriceDetail.itemTaxDetail

        for (let key in taxList) {
          // 跳过不折扣的菜价
          if (taxList[key].isSkipDiscount) {
            continue
          } else {
            let tax = Big(taxList[key].subTotal)
              .times(Big(this.promotionRate).div(100))
              .times(taxList[key].taxRate)
              .toNumber()
            if (taxMap[key]) {
              taxMap[key] = {
                tax: Big(taxMap[key].tax).plus(tax).toNumber(),
              }
            } else {
              taxMap[key] = {
                tax,
              }
            }
          }
        }
      }
    }

    return taxMap
  }
}
