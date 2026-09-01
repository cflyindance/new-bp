/**
 * TipOut · 销售额/Tip Claim · 按支付方式分摊营业额类型金额
 *
 * S_order = R × (P_sel / P_all)；P 为含小费实付。
 * 未配置 selectedMethods：返回 R。
 * 计算引擎：对通过其它条件的订单调用本函数得到 S_order 再求和。
 */
(function (root) {
  var PAYMENT_METHOD_OPTIONS = [
    { value: "cash", labelZh: "现金", labelEn: "Cash" },
    { value: "credit_card", labelZh: "信用卡", labelEn: "Credit Card" },
    { value: "gift_card", labelZh: "礼品卡", labelEn: "Gift Card" },
    { value: "member_card", labelZh: "会员卡", labelEn: "Member Card" },
    { value: "alipay", labelZh: "ALIPAY", labelEn: "ALIPAY" },
    { value: "wechatpay", labelZh: "WECHATPAY", labelEn: "WECHATPAY" },
    { value: "doordash_d_pay", labelZh: "DOORDASH_D-PAY（自定义）", labelEn: "DOORDASH_D-PAY (Custom)" },
    { value: "uber_eats_d_pay", labelZh: "UBER_EATS_D-PAY（自定义）", labelEn: "UBER_EATS_D-PAY (Custom)" },
    { value: "coupon", labelZh: "券抵扣", labelEn: "Coupon" },
    { value: "points", labelZh: "积分抵扣", labelEn: "Points" },
  ];
  var KNOWN = {
    cash: 1,
    credit_card: 1,
    gift_card: 1,
    member_card: 1,
    alipay: 1,
    wechatpay: 1,
    doordash_d_pay: 1,
    uber_eats_d_pay: 1,
    coupon: 1,
    points: 1,
    // 兼容旧版落库值
    custom: 1,
    other: 1,
  };

  function num(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function roundMoney(x) {
    var n = Number(x);
    if (isNaN(n)) return 0;
    return Math.round(n * 100) / 100;
  }

  function isPaymentMethodValue(v) {
    return !!KNOWN[v];
  }

  function normalizeSelectedMethods(arr) {
    if (!Array.isArray(arr)) return [];
    var seen = {};
    var out = [];
    arr.forEach(function (v) {
      if (!KNOWN[v] || seen[v]) return;
      seen[v] = 1;
      out.push(v);
    });
    return out;
  }

  function sumTendersByMethods(tenders, methods) {
    var list = tenders || [];
    var filter = methods == null ? null : normalizeSelectedMethods(methods);
    var useFilter = filter && filter.length > 0;
    var sum = 0;
    list.forEach(function (t) {
      t = t || {};
      if (useFilter && filter.indexOf(t.method) < 0) return;
      sum += num(t.amount);
    });
    return sum;
  }

  /**
   * @param {{ revenueAmount: number, tenders?: Array<{method:string,amount:number}>, selectedMethods?: string[]|null }} input
   */
  function apportionRevenueByPaymentMethods(input) {
    input = input || {};
    var R = num(input.revenueAmount);
    var selected = normalizeSelectedMethods(input.selectedMethods);
    if (!selected.length) return roundMoney(R);

    var tenders = input.tenders || [];
    if (!tenders.length) return 0;

    var P_all = sumTendersByMethods(tenders, null);
    if (P_all <= 0) return 0;

    var P_sel = sumTendersByMethods(tenders, selected);
    if (P_sel <= 0) return 0;

    return roundMoney((R * P_sel) / P_all);
  }

  function formatPaymentMethodsLabelZh(methods) {
    var sel = normalizeSelectedMethods(methods);
    if (!sel.length) return "";
    var map = { other: "其他", custom: "自定义支付方式" };
    PAYMENT_METHOD_OPTIONS.forEach(function (o) {
      map[o.value] = o.labelZh;
    });
    return sel
      .map(function (v) {
        return map[v] || v;
      })
      .join("、");
  }

  var api = {
    PAYMENT_METHOD_OPTIONS: PAYMENT_METHOD_OPTIONS,
    isPaymentMethodValue: isPaymentMethodValue,
    normalizeSelectedMethods: normalizeSelectedMethods,
    roundMoney: roundMoney,
    sumTendersByMethods: sumTendersByMethods,
    apportionRevenueByPaymentMethods: apportionRevenueByPaymentMethods,
    formatPaymentMethodsLabelZh: formatPaymentMethodsLabelZh,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TipOutPaymentMethodApportion = api;
})(typeof window !== "undefined" ? window : globalThis);
