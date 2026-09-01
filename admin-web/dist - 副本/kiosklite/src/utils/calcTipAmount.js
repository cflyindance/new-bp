import Big from 'big.js';

const DEFAULT_TIP_LIST = [15, 20, 25];

/**
 * 小费百分比计算的基数（税前/税后、扣除订单折扣）
 */
export function getTipBasePrice(orderInfo, allSysConfig) {
  let totalPrice = orderInfo.orderSubtotal;
  const totalTax = orderInfo.orderTaxTotal;
  const isTaxBefore = !!(
    allSysConfig?.TIPS_SUGGESTIONS_CALCULATION?.indexOf('0') > -1
  );
  if (!isTaxBefore) {
    totalPrice = parseFloat(Big(totalPrice).plus(totalTax).toFixed(2));
  }
  if (orderInfo?.orderDiscount) {
    totalPrice = parseFloat(
      Big(totalPrice).minus(orderInfo.orderDiscount).toFixed(2)
    );
  }
  return totalPrice;
}

/**
 * 小费配置：收取方式（1 固定 / 2 百分比）及选项列表
 */
export function getTipConfig(selfConfig, defaultTipList = DEFAULT_TIP_LIST) {
  let tipType = null;
  let tipIptList = [...defaultTipList];
  if (selfConfig?.configMap?.id_14) {
    tipType = selfConfig.configMap.id_14[0];
    tipIptList = [...selfConfig.configMap.id_14[1]];
    tipIptList.sort((a, b) => a - b);
  }
  return { tipType, tipIptList };
}

/**
 * 计算小费金额
 * 自定义小费始终按固定金额处理，不受 id_14 收取方式（固定/百分比）影响
 */
export function calcTipAmount({ tipValue, customTip, tipType, totalPrice }) {
  if (tipValue === null || tipValue === undefined) {
    return null;
  }
  if (customTip) {
    return Big(tipValue || 0).toFixed(2);
  }
  if (tipType == 1) {
    return Big(tipValue || 0).toFixed(2);
  }
  return Big(totalPrice || 0)
    .div(100)
    .times(tipValue || 0)
    .toFixed(2);
}

export default calcTipAmount;
