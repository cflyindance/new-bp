/**
 * 前厅管理中心 · 设置二级导航（方案 E：员工端 11 组 + 食客端 11 组，共 22 组）
 * 供 apply-foh-settings-mapping.mjs、generate-foh-settings-design-doc.mjs、settings-intra-group-sort 共用
 */

/** 侧栏顺序：员工端动线（登录→开台→点单页→找单结账→清桌）→ 食客端动线（类型→登记→须知→语言→菜单→场景→桌边） */
export const FOH_SETTINGS_GROUP_ORDER = [
  "foh-pos-shell",
  "foh-table-start-flow",
  "foh-pos-menu-scope",
  "foh-pos-menu-ui-layout",
  "foh-pos-order-cart",
  "foh-pos-combo-ordering",
  "foh-pos-buttons",
  "foh-kitchen-send-timing",
  "foh-pos-find-order-list",
  "foh-pos-checkout-entry",
  "foh-table-clear-ops",
  "foh-guest-order-type",
  "foh-guest-registration",
  "foh-guest-pre-order",
  "foh-guest-facing-locale",
  "foh-guest-menu-home",
  "foh-guest-menu-body",
  "foh-guest-kitchen-send",
  "foh-guest-hotpot",
  "foh-guest-duration-scenarios",
  "foh-tableside-service",
  "foh-wait-time-display",
];

/** 食客端分段起点（侧栏「员工端 / 食客端」分隔） */
export const FOH_SETTINGS_GUEST_SECTION_START_KEY = "foh-guest-order-type";

/** @typedef {{ labelKey: string, groupKeys: string[] }} FohSettingsGroupNavSection */

/** 前厅设置侧栏分段（labelKey 由 i18n 解析） */
export const FOH_SETTINGS_GROUP_NAV_SECTIONS = (() => {
  const splitIdx = FOH_SETTINGS_GROUP_ORDER.indexOf(FOH_SETTINGS_GUEST_SECTION_START_KEY);
  if (splitIdx < 1) return [];
  return [
    {
      labelKey: "moduleSettings.fohNav.staff",
      groupKeys: FOH_SETTINGS_GROUP_ORDER.slice(0, splitIdx),
    },
    {
      labelKey: "moduleSettings.fohNav.guest",
      groupKeys: FOH_SETTINGS_GROUP_ORDER.slice(splitIdx),
    },
  ];
})();

export const FOH_SETTINGS_GROUP_TITLES = {
  "foh-table-start-flow": "选桌与开台流程",
  "foh-table-clear-ops": "清桌与换企台",
  "foh-pos-shell": "登录与主界面",
  "foh-pos-menu-scope": "菜单查找与时段",
  "foh-pos-menu-ui-layout": "菜单区界面布局",
  "foh-pos-order-cart": "订单行与客户信息",
  "foh-pos-combo-ordering": "套餐与自定义点单",
  "foh-pos-buttons": "点单页按钮显隐与排序",
  "foh-kitchen-send-timing": "送厨时机",
  "foh-pos-find-order-list": "POS 找单列表",
  "foh-pos-checkout-entry": "POS 结账入口",
  "foh-guest-order-type": "订单类型与取餐",
  "foh-guest-registration": "食客登记与会员",
  "foh-guest-pre-order": "点单前须知与授权",
  "foh-guest-menu-home": "点餐首页与入口",
  "foh-guest-menu-body": "菜单展示与购物车",
  "foh-guest-facing-locale": "食客端语言",
  "foh-guest-kitchen-send": "食客端送厨",
  "foh-guest-hotpot": "火锅点餐",
  "foh-guest-duration-scenarios": "用餐时长与自助餐",
  "foh-tableside-service": "桌边服务",
  "foh-wait-time-display": "预计等待时长展示",
};

/** 旧 groupKey → 新 groupKey（设置滑层书签重定向） */
export const FOH_SETTINGS_LEGACY_GROUP_REDIRECT = {
  "foh-tables-start": "foh-table-start-flow",
  "tables-floor": "foh-table-start-flow",
  "pos-shell-landing": "foh-pos-shell",
  "pos-order-init": "foh-table-start-flow",
  "table-clear-ops": "foh-table-clear-ops",
  "pos-kitchen-send": "foh-kitchen-send-timing",
  "pos-button-visibility": "foh-pos-buttons",
  "pos-order-toolbar": "foh-pos-buttons",
  "foh-order-cart-combo": "foh-pos-order-cart",
  "pos-order-cart": "foh-pos-order-cart",
  "pos-combo-ordering": "foh-pos-combo-ordering",
  "foh-find-order-checkout": "foh-pos-find-order-list",
  "pos-find-order-list": "foh-pos-find-order-list",
  "pos-checkout-entry": "foh-pos-checkout-entry",
  "foh-pos-menu-layout": "foh-pos-menu-scope",
  "pos-menu-ui": "foh-pos-menu-scope",
  "pos-menu-ui-layout": "foh-pos-menu-ui-layout",
  "guest-menu-structure": "foh-guest-menu-body",
  "guest-menu-cart": "foh-guest-menu-body",
  "guest-menu-global": "foh-guest-menu-home",
  "guest-facing-locale": "foh-guest-facing-locale",
  "foh-guest-menu-shell": "foh-guest-menu-home",
  "foh-guest-order-entry": "foh-guest-order-type",
  "guest-order-type": "foh-guest-order-type",
  "guest-pre-order-flow": "foh-guest-pre-order",
  "guest-registration": "foh-guest-registration",
  "guest-order-auth": "foh-guest-menu-body",
  "guest-order-throttle": "foh-guest-menu-body",
  "foh-guest-scenario-dining": "foh-guest-kitchen-send",
  "guest-channel-kitchen-send": "foh-guest-kitchen-send",
  "guest-scenario-dining": "foh-guest-kitchen-send",
  "guest-hotpot": "foh-guest-hotpot",
  "guest-duration-scenarios": "foh-guest-duration-scenarios",
  "tableside-service-call": "foh-tableside-service",
  "guest-notes-fees": "foh-tableside-service",
  "wait-time": "foh-wait-time-display",
  "guest-menu-scenarios": "foh-guest-menu-body",
  /** v2.0 十二组 → v3.0 十四组 */
  "foh-tables": "foh-table-start-flow",
  "foh-cashier-start": "foh-pos-shell",
  "foh-order-buttons-core": "foh-pos-buttons",
  "foh-order-toolbar-extra": "foh-pos-buttons",
  "foh-menu-find-pay": "foh-pos-menu-scope",
  "foh-guest-kitchen-dining": "foh-guest-kitchen-send",
  "foh-tableside-experience": "foh-tableside-service",
};

function range(a, b) {
  const out = [];
  for (let i = a; i < b; i++) out.push(i);
  return out;
}

/** @type {Record<string, number[]>} */
export const FOH_SETTINGS_ASSIGN_MAP = {
  "foh-table-start-flow": [107, 619, 111, 625, 621, 643, 644, 592],
  "foh-table-clear-ops": [169, 534, 642, 351, 347],
  "foh-pos-shell": [165, 346],
  "foh-pos-menu-scope": [118, 148, 176, 177, 348],
  "foh-pos-menu-ui-layout": [216, 217, 218, 220, 219, 350],
  "foh-pos-order-cart": [132, 133, 135, 137, 178, 121, 122, 222, 223],
  "foh-pos-combo-ordering": [138, 139, 145],
  "foh-pos-buttons": [...range(193, 196), ...range(197, 211), ...range(211, 216), 196, 110, 483, 484, 485, 486],
  "foh-kitchen-send-timing": [125, 113, 123, 114, 120, 345, 141],
  "foh-pos-find-order-list": [153, 151, 152, 251],
  "foh-pos-checkout-entry": [248, 221],
  "foh-guest-order-type": [487, 488, 489, 490, 491, 503],
  "foh-guest-registration": [623, 622, 504, 505, 506, 507, 510],
  "foh-guest-pre-order": [569, 620, 626, 627],
  "foh-guest-menu-home": [599, 604, 601, 602, 600, 611, 532],
  "foh-guest-menu-body": [606, 607, 608, 645, 509, 525, 526, 515, 516, 517, 518, 519, 520, 524, 528, 616, 617, 618],
  "foh-guest-facing-locale": [652, 653],
  "foh-guest-kitchen-send": [581, 502, 91, 567],
  "foh-guest-hotpot": [570, 572, 574, 573, 575],
  "foh-guest-duration-scenarios": [443, 571, 577, 578, 579, 580],
  "foh-tableside-service": [629, 641, 640, 333, 521, 522, 523],
  "foh-wait-time-display": [673, 535, 536, 537, 538, 539, 540],
};

/** @returns {Map<number, { groupTitle: string, groupKey: string }>} */
export function buildFohAssignMap() {
  const fohAssign = new Map();
  for (const [key, seqs] of Object.entries(FOH_SETTINGS_ASSIGN_MAP)) {
    for (const seq of seqs) {
      fohAssign.set(seq, {
        groupTitle: FOH_SETTINGS_GROUP_TITLES[key],
        groupKey: key,
      });
    }
  }
  return fohAssign;
}
