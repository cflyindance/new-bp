/**
 * TipOut · 销售额取值条件 · 订单小费状态判定
 *
 * 计算引擎汇总销售额 S 时：对每笔候选订单调用
 * matchOrderTipStatus(order, salesConditions.orderTipStatus)
 *
 * 含小费：卡小费或现金小费 > 0；加收服务费（Service Charge）不计为小费。
 * 未配置 / 空值：不过滤（向后兼容）。
 */
(function (root) {
  function num(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function hasPaidTip(order) {
    order = order || {};
    return num(order.cardTip) > 0 || num(order.cashTip) > 0;
  }

  /**
   * @param {object} order
   * @param {string|null|undefined} status - 'has_tip' | 'no_tip' | 空
   * @returns {boolean} 订单是否通过小费状态条件
   */
  function matchOrderTipStatus(order, status) {
    if (status == null || status === "") return true;
    if (status === "has_tip") return hasPaidTip(order);
    if (status === "no_tip") return !hasPaidTip(order);
    return true;
  }

  function filterOrdersByTipStatus(orders, status) {
    orders = orders || [];
    return orders.filter(function (o) {
      return matchOrderTipStatus(o, status);
    });
  }

  var api = {
    hasPaidTip: hasPaidTip,
    matchOrderTipStatus: matchOrderTipStatus,
    filterOrdersByTipStatus: filterOrdersByTipStatus,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TipOutOrderTipStatus = api;
})(typeof window !== "undefined" ? window : globalThis);
