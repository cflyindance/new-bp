/**
 * 打印中心 · 设置二级导航（方案：出纸与引擎 + 按票种 4 组）
 * 供 apply-print-settings-mapping.mjs、build-module-settings-catalog.mjs、settings-intra-group-sort 共用
 */

/** 侧栏顺序：引擎 → 订单收据 → 签购单 → 打包单 → 取餐号 */
export const PRINT_SETTINGS_GROUP_ORDER = [
  "print-engine-device",
  "order-receipt",
  "payment-signature-slip",
  "packing-slip",
  "pickup-number-slip",
];

export const PRINT_SETTINGS_GROUP_TITLES = {
  "print-engine-device": "出纸与设备",
  "order-receipt": "订单收据",
  "payment-signature-slip": "支付签购单",
  "packing-slip": "打包单",
  "pickup-number-slip": "取餐号小票",
};

/** 打印设置侧栏分段（labelKey 由 i18n 解析） */
export const PRINT_SETTINGS_GROUP_NAV_SECTIONS = [
  {
    labelKey: "moduleSettings.printNav.engine",
    groupKeys: ["print-engine-device"],
  },
  {
    labelKey: "moduleSettings.printNav.tickets",
    groupKeys: [
      "order-receipt",
      "payment-signature-slip",
      "packing-slip",
      "pickup-number-slip",
    ],
  },
];

/** 旧 groupKey → 新 groupKey（打印中心内合并/重命名） */
export const PRINT_SETTINGS_LEGACY_GROUP_REDIRECT = {
  "print-foundation-devices": "print-engine-device",
  "order-receipt-trigger": "order-receipt",
  "receipt-print-execution": "order-receipt",
  "receipt-line-content": "order-receipt",
  "receipt-layout-format": "order-receipt",
  "payment-receipt-flow": "payment-signature-slip",
  "packing-slip-print": "packing-slip",
  "ticket-number-slip": "pickup-number-slip",
};

/** 组内变更后 seq 书签（旧路径前缀 → 新路径前缀，不含 /s{seq}） */
export const PRINT_SETTINGS_MOVED_SEQ_PATH = {
  281: "/print-templates/settings/order-receipt",
};

/** 迁出打印中心后、从打印中心指向它处的 seq（供支付中心等引用） */
export const PRINT_SETTINGS_EXTERNAL_SEQ_PATH = {
  290: "/print-templates/settings/order-receipt",
};

/** 各组内展示顺序 */
export const PRINT_SETTINGS_INTRA_GROUP_SEQ = {
  "print-engine-device": [167, 256, 259, 265, 269],
  "order-receipt": [
    654, 500, 262, 273, 283, 289, 286, 282, 275, 274, 278, 276, 285, 284, 277, 264, 279, 280,
    290, 281,
  ],
  "payment-signature-slip": [246, 261, 250, 247, 272, 94],
  "packing-slip": [34, 297, 303],
  "pickup-number-slip": [291, 292],
};
