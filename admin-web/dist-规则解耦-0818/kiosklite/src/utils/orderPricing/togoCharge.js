/**
 * togo加收的税（是否算税，systemConfig.IS_CHARGE_TAX.booleanValue）
 *
 * togo：50
 *
 * 计算规则：A菜(税：0.1, 0.2)
 *          B菜(税：0.2, 0.3)
 *
 * 先计算每个菜占比：
 * rateA：subTotalA / (subTotalA + subTotalB)
 * rateB：subTotalB / (subTotalA + subTotalB)
 *
 * A菜的togo加收税：50 * rateA * 0.1 + 50 * rateA * 0.2
 * B菜的togo加收税：50 * rateB * 0.2 + 50 * rateB * 0.3
 *
 */
import { getItemPricingSubtotal } from './itemPricingBase';

import Big from 'big.js';

export default class TogoCharge {
  constructor(togoList, isCalcTogoTax, itemCount) {
    this.togoList = togoList;
    this.isCalcTogoTax = isCalcTogoTax;
    this.itemCount = itemCount;
  }

  getIsCalcTogoTax() {
    return this.isCalcTogoTax;
  }

  // 计算charge整单加收的总金额
  getTogoTotal() {
    let togoCharge = 0;
    if (this.togoList?.length) {
      this.togoList.forEach((item) => {
        if (item.select.id) {
          if (item.id === 4) {
            togoCharge = Big(togoCharge)
              .plus(item.select.rate * this.itemCount)
              .toNumber();
          } else {
            togoCharge = Big(togoCharge).plus(item.select.rate).toNumber();
          }
        }
      });
    }
    return togoCharge;
  }

  // 计算所有菜的金额
  getTotal(itemInfoList) {
    let total = 0;
    if (itemInfoList?.length) {
      itemInfoList.forEach((item) => {
        total = Big(total).plus(getItemPricingSubtotal(item.itemPriceDetail)).toNumber();
      });
    }
    return total;
  }

  // 计算不同类下，不同税组合后，charge的税
  togoTaxDetailAccumulation(itemInfo) {
    let togoTaxMap = {};
    let total = this.getTotal(itemInfo);
    let chargeTotal = this.getTogoTotal();

    for (let i = 0; i < itemInfo.length; i++) {
      let item = itemInfo[i];
      let togoRate = parseFloat(
        Big(getItemPricingSubtotal(item.itemPriceDetail)).div(total)
      );

      let taxList = item.itemPriceDetail.itemTaxDetail;

      for (let key in taxList) {
        let togoTax = Big(chargeTotal)
          .times(togoRate)
          .times(taxList[key].taxRate)
          .toNumber();
        if (togoTaxMap[key]) {
          togoTaxMap[key] = {
            togoTax: Big(togoTaxMap[key].togoTax).plus(togoTax).toNumber(),
          };
        } else {
          togoTaxMap[key] = {
            togoTax,
          };
        }
      }
    }

    return togoTaxMap;
  }
}
