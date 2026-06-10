/**
 * 系统设置 v2.0 方案 A：四 Tab 二级导航分组与组内排序。
 * 供 apply-system-settings-mapping.mjs、build-module-settings-catalog.mjs、settings-intra-group-sort 共用。
 */

/** /settings/locale-display · 区域与显示 */
export const LOCALE_DISPLAY_GROUP_ORDER = ["locale-language", "date-time-format"];

/** /settings/data-backup · 数据与备份 */
export const DATA_BACKUP_GROUP_ORDER = ["data-backup", "data-retention"];

/** /settings/connections · 连接与服务 */
export const CONNECTIONS_GROUP_ORDER = [
  "online-order-channel",
  "hr-scheduling-connect",
  "member-stored-value",
  "payment-acquiring",
  "reporting-export",
];

/** /settings/advanced · 高级与诊断 */
export const ADVANCED_GROUP_ORDER = ["runtime-monitoring", "debug-modes", "platform-services"];

export const ADVANCED_GROUP_NAV_SECTIONS = [
  { labelKey: "moduleSettings.systemNav.monitoring", groupKeys: ["runtime-monitoring"] },
  { labelKey: "moduleSettings.systemNav.debug", groupKeys: ["debug-modes"] },
  { labelKey: "moduleSettings.systemNav.platform", groupKeys: ["platform-services"] },
];

/** seq → catalog 挂载路由（系统设置四 Tab） */
export const SYSTEM_SETTINGS_CATALOG_PATH_BY_SEQ = {
  /** 区域与显示 */
  109: "/settings/locale-display",
  168: "/settings/locale-display",
  /** 数据与备份 */
  422: "/settings/data-backup",
  423: "/settings/data-backup",
  /** 连接与服务（原平台业务中心 / 集成与 API） */
  78: "/settings/connections",
  79: "/settings/connections",
  80: "/settings/connections",
  81: "/settings/connections",
  93: "/settings/connections",
  95: "/settings/connections",
  96: "/settings/connections",
  97: "/settings/connections",
  99: "/settings/connections",
  100: "/settings/connections",
  101: "/settings/connections",
  102: "/settings/connections",
  103: "/settings/connections",
  104: "/settings/connections",
  105: "/settings/connections",
  106: "/settings/connections",
  343: "/settings/connections",
  457: "/settings/connections",
  458: "/settings/connections",
  459: "/settings/connections",
  460: "/settings/connections",
  /** 高级与诊断 */
  187: "/settings/advanced",
  188: "/settings/advanced",
  189: "/settings/advanced",
  190: "/settings/advanced",
  191: "/settings/advanced",
  192: "/settings/advanced",
  344: "/settings/advanced",
};

/** CSV groupTitle / groupKey（apply-system-settings-mapping.mjs） */
export const SYSTEM_SETTINGS_ASSIGN_MAP = {
  "locale-language": [109],
  "date-time-format": [168],
  "data-backup": [423],
  "data-retention": [422],
  "online-order-channel": [93, 95, 96, 97, 99, 100, 101, 102, 103, 104, 105, 106],
  "hr-scheduling-connect": [78, 79, 80, 81, 458],
  "member-stored-value": [457],
  "payment-acquiring": [459, 460],
  "reporting-export": [343],
  "runtime-monitoring": [344],
  "debug-modes": [188, 189],
  "platform-services": [187, 190, 191, 192],
};

export const SYSTEM_SETTINGS_GROUP_TITLES = {
  "locale-language": "语言",
  "date-time-format": "日期与时间",
  "data-backup": "数据备份",
  "data-retention": "数据保留与清理",
  "online-order-channel": "线上订餐通道",
  "hr-scheduling-connect": "人力与排班",
  "member-stored-value": "会员与储值",
  "payment-acquiring": "支付与终端",
  "reporting-export": "报表数据导出",
  "runtime-monitoring": "运行监控",
  "debug-modes": "调试模式",
  "platform-services": "平台服务",
};

/** 迁出系统设置：前厅 · 菜单模式 */
export const FOH_MENU_MODE_MIGRATION = {
  seq: 174,
  groupTitle: "菜单查找与时段",
  groupKey: "foh-pos-menu-scope",
};

/** 迁出系统设置：外卖/来取 · 地址与地图 */
export const DELIVERY_MAP_ADDRESS_MIGRATION = {
  seqs: [182, 183],
  groupTitle: "外送地址与地图",
  groupKey: "map-address-services",
};
