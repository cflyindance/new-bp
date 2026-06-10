/**
 * 支付中心 · 设置二级导航（方案 A：基础 4 组 + 小费 + 食客结账 + Batch）
 * 供 apply-payment-settings-mapping.mjs、build-module-settings-catalog.mjs、settings-intra-group-sort 共用
 */

/** 侧栏顺序：通道 → 方式 → 卡付 → 税务 → 小费 → 食客结账 → Batch */
export const PAYMENT_SETTINGS_GROUP_ORDER = [
  "payment-gateway",
  "payment-methods",
  "card-fees",
  "tax-rules",
  "tip-policy",
  "cds-checkout-ux",
  "batch-settlement",
];

export const PAYMENT_SETTINGS_GROUP_TITLES = {
  "payment-gateway": "支付通道",
  "payment-methods": "支付方式",
  "card-fees": "卡付规则与加价",
  "tax-rules": "税务计算",
  "tip-policy": "小费",
  "cds-checkout-ux": "食客结账界面",
  "batch-settlement": "卡交易 Batch 结算",
};

/** 支付设置侧栏分段（labelKey 由 i18n 解析） */
export const PAYMENT_SETTINGS_GROUP_NAV_SECTIONS = [
  {
    labelKey: "moduleSettings.paymentNav.foundation",
    groupKeys: ["payment-gateway", "payment-methods", "card-fees", "tax-rules"],
  },
  {
    labelKey: "moduleSettings.paymentNav.checkout",
    groupKeys: ["tip-policy", "cds-checkout-ux"],
  },
  {
    labelKey: "moduleSettings.paymentNav.settlement",
    groupKeys: ["batch-settlement"],
  },
];

/** 旧 groupKey → 新 groupKey（支付中心内合并） */
export const PAYMENT_SETTINGS_LEGACY_GROUP_REDIRECT = {
  "checkout-tip-card-order": "cds-checkout-ux",
};

/** 迁出支付中心后的 seq 书签（transactions/settings → 目标路径前缀） */
export const PAYMENT_SETTINGS_MOVED_SEQ_PATH = {
  159: "/orders/settings/order-void-refund",
  290: "/print-templates/settings/order-receipt",
};

/** @type {Record<string, number[]>} */
export const PAYMENT_SETTINGS_ASSIGN_MAP = {
  "payment-gateway": [229],
  "payment-methods": [234],
  "card-fees": [454, 305, 242, 82, 172, 243, 180],
  "tax-rules": [445, 143, 142, 144, 160],
  "tip-policy": [293, 294, 253, 232, 231, 244, 237, 266, 295, 296],
  "cds-checkout-ux": [463, 493, 9, 464, 465, 669],
  "batch-settlement": [238, 239, 240, 236, 230, 235],
};

/** @returns {Map<number, { groupTitle: string, groupKey: string }>} */
export function buildPaymentAssignMap() {
  const paymentAssign = new Map();
  for (const [key, seqs] of Object.entries(PAYMENT_SETTINGS_ASSIGN_MAP)) {
    for (const seq of seqs) {
      paymentAssign.set(seq, {
        groupTitle: PAYMENT_SETTINGS_GROUP_TITLES[key],
        groupKey: key,
      });
    }
  }
  return paymentAssign;
}
