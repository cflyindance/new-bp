/**
 * 整单加收的税（是否算税，systemConfig.IS_CHARGE_TAX.booleanValue）
 *
 * 计算规则：A菜(税：0.1, 0.2)
 *          B菜(税：0.2, 0.3)
 *
 * 类型一：当 ratetype == 2 是百分比例 (charge = subTotal * chargeRate)
 * A菜的加收：chargeA = subTotalA * chargeRate
 * B菜的加收：chargeB = subTotalB * chargeRate
 *
 * A菜的加收税：chargeA * 0.1 + chargeA * 0.2
 * B菜的加收税：chargeB * 0.2 + chargeB * 0.3
 *
 *
 * 类型二：当 ratetype == 1 是固定金额，（tip：菜的税计算规则类似togo加收税的规则）
 * A和B菜的加收：固定金额
 *
 * 先计算每个菜占比：
 * rateA：subTotalA / (subTotalA + subTotalB)
 * rateB：subTotalB / (subTotalA + subTotalB)
 *
 * A菜的加收税：50 * rateA * 0.1 + 50 * rateA * 0.2
 * B菜的加收税：50 * rateB * 0.2 + 50 * rateB * 0.3
 *
 */
import { getItemPricingSubtotal } from './itemPricingBase';

import Big from 'big.js';

export default class WholeOrderCharge {
  constructor(ratetype, rate, isCalcChargeTax, noNeedChargeAmount) {
    // ratetype: 1-固定金额，2-百分比例
    this.ratetype = ratetype;
    if (ratetype == 1) {
      this.rate = rate;
    } else if (this.ratetype == 2) {
      this.rate = Big(rate).div(100).toNumber();
    }
    this.isCalcChargeTax = isCalcChargeTax;
    this.noNeedChargeAmount = noNeedChargeAmount;
  }

  getIsCalcChargeTax() {
    return this.isCalcChargeTax;
  }

  getChargeableTotal(itemInfoList) {
    const total = this.getTotal(itemInfoList);
    const noNeedChargeAmount = Number(this.noNeedChargeAmount || 0);
    return Math.max(Big(total).minus(noNeedChargeAmount).toNumber(), 0);
  }

  // 计算所有菜的金额
  getTotal(itemInfoList) {
    let total = 0;
    if (itemInfoList?.length) {
      itemInfoList.forEach((item) => {
        total = Big(total)
          .plus(getItemPricingSubtotal(item.itemPriceDetail))
          .toNumber();
      });
    }
    return total;
  }

  // 计算charge整单加收的总金额
  getChargeDetail(itemInfoList) {
    if (this.ratetype == 1) {
      return this.rate;
    } else if (this.ratetype == 2) {
      return Big(this.getChargeableTotal(itemInfoList))
        .times(this.rate)
        .toNumber();
    }
  }

  // 计算不同类下，不同税组合后，charge的税
  chargeTaxDetailAccumulation(itemInfo, orderTaxDetail, itemInfoList) {
    let itemTaxDetail = itemInfo.itemPriceDetail.itemTaxDetail;
    if (this.ratetype == 1) {
      let total = this.getTotal(itemInfoList);
      for (let i in itemTaxDetail) {
        let subChargeTax = Big(itemTaxDetail[i].subTotal)
          .div(total)
          .times(itemTaxDetail[i].taxRate)
          .times(this.rate)
          .toNumber();

        if (orderTaxDetail[i]) {
          orderTaxDetail[i] = {
            subChargeTax: Big(orderTaxDetail[i].subChargeTax)
              .plus(subChargeTax)
              .toNumber(),
          };
        } else {
          orderTaxDetail[i] = {
            subChargeTax,
          };
        }
      }

      return orderTaxDetail;
    } else if (this.ratetype == 2) {
      let total = this.getTotal(itemInfoList);
      let chargeableTotal = this.getChargeableTotal(itemInfoList);
      let chargeableRatio =
        total > 0 ? Big(chargeableTotal).div(total).toNumber() : 0;
      for (let i in itemTaxDetail) {
        let subCharge = Big(itemTaxDetail[i].subTotal)
          .times(chargeableRatio)
          .times(this.rate)
          .toNumber();
        let subChargeTax = Big(subCharge)
          .times(itemTaxDetail[i].taxRate)
          .toNumber();

        if (orderTaxDetail[i]) {
          orderTaxDetail[i] = {
            subChargeTax: Big(orderTaxDetail[i].subChargeTax)
              .plus(subChargeTax)
              .toNumber(),
          };
        } else {
          orderTaxDetail[i] = {
            subChargeTax,
          };
        }
      }

      return orderTaxDetail;
    }
  }
}
