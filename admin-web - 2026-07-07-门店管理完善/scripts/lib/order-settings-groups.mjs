/**
 * 订单中心 · 设置二级导航（方案 A：订单规则 3 组 + 金额规则 3 组）
 * 供 apply-order-settings-mapping.mjs、build-module-settings-catalog.mjs、settings-intra-group-sort 共用
 */

/** 侧栏顺序：基础 → 改单分合 → 删单 → 折扣 → 附加费 → 取整 */
export const ORDER_SETTINGS_GROUP_ORDER = [
  "order-basics",
  "order-edit-split-merge",
  "order-void-refund",
  "order-discount",
  "order-surcharge-fees",
  "order-settlement-rounding",
];

export const ORDER_SETTINGS_GROUP_TITLES = {
  "order-basics": "订单基础",
  "order-edit-split-merge": "改单与分合单",
  "order-void-refund": "删单与退款",
  "order-discount": "折扣",
  "order-surcharge-fees": "附加费与服务费",
  "order-settlement-rounding": "结算取整",
};

/** 金额规则分段起点（侧栏「订单规则 / 金额规则」分隔） */
export const ORDER_SETTINGS_PRICING_SECTION_START_KEY = "order-discount";

/** @typedef {{ labelKey: string, groupKeys: string[] }} OrderSettingsGroupNavSection */

/** 订单设置侧栏分段（labelKey 由 i18n 解析） */
export const ORDER_SETTINGS_GROUP_NAV_SECTIONS = (() => {
  const splitIdx = ORDER_SETTINGS_GROUP_ORDER.indexOf(ORDER_SETTINGS_PRICING_SECTION_START_KEY);
  if (splitIdx < 1) return [];
  return [
    {
      labelKey: "moduleSettings.orderNav.rules",
      groupKeys: ORDER_SETTINGS_GROUP_ORDER.slice(0, splitIdx),
    },
    {
      labelKey: "moduleSettings.orderNav.pricing",
      groupKeys: ORDER_SETTINGS_GROUP_ORDER.slice(splitIdx),
    },
  ];
})();

/** 旧 groupKey → 新 groupKey（设置滑层书签重定向） */
export const ORDER_SETTINGS_LEGACY_GROUP_REDIRECT = {
  "order-init-scenario": "order-basics",
  "order-numbering": "order-basics",
  "split-merge-edit": "order-edit-split-merge",
  "order-surcharge": "order-surcharge-fees",
  "order-settlement": "order-settlement-rounding",
  "order-void": "order-void-refund",
};

/** 迁出订单中心后仍可能存在的旧书签（group/seq → 新 settings 路径前缀） */
export const ORDER_SETTINGS_MOVED_SEQ_PATH = {
  141: "/operations/queue-call/settings/foh-kitchen-send-timing",
  150: "/promotions/settings/promo-strategy",
  155: "/operations/kitchen-kds/settings/kitchen-void-notify",
};

/** @type {Record<string, number[]>} */
export const ORDER_SETTINGS_ASSIGN_MAP = {
  "order-basics": [126, 127, 128, 129, 130, 131],
  "order-edit-split-merge": [115, 116, 117, 119, 124, 140],
  "order-void-refund": [156, 157, 158, 159],
  "order-discount": [446, 162, 163, 164],
  "order-surcharge-fees": [447, 149, 161],
  "order-settlement-rounding": [147],
};

/** @returns {Map<number, { groupTitle: string, groupKey: string }>} */
export function buildOrderAssignMap() {
  const orderAssign = new Map();
  for (const [key, seqs] of Object.entries(ORDER_SETTINGS_ASSIGN_MAP)) {
    for (const seq of seqs) {
      orderAssign.set(seq, {
        groupTitle: ORDER_SETTINGS_GROUP_TITLES[key],
        groupKey: key,
      });
    }
  }
  return orderAssign;
}
