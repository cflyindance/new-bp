/**
 * 前厅管理中心 · 设置二级导航（方案 E：员工端 11 组 + 食客端 11 组，共 22 组）
 * 供 apply-foh-settings-mapping.mjs、generate-foh-settings-design-doc.mjs、settings-intra-group-sort 共用
 */

/** 侧栏顺序：员工端完整一单 → 食客端完整旅程 */
export const FOH_SETTINGS_GROUP_ORDER = [
  "foh-pos-shell",
  "foh-table-start-flow",
  "foh-pos-menu-scope",
  "foh-pos-order-cart",
  "foh-pos-combo-ordering",
  "foh-pos-buttons",
  "foh-pos-order-toolbar",
  "foh-kitchen-send-timing",
  "foh-pos-find-order-list",
  "foh-pos-order-alerts",
  "foh-table-clear-ops",
  "foh-guest-order-type",
  "foh-guest-registration",
  "foh-guest-pre-order",
  "foh-guest-facing-locale",
  "foh-guest-menu-home",
  "foh-guest-menu-body",
  "foh-guest-hotpot",
  "foh-guest-duration-scenarios",
  "foh-tableside-service",
  "foh-guest-order-notes",
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
  "foh-table-clear-ops": "清桌与换服务员（企台）",
  "foh-pos-shell": "登录与终端主界面",
  "foh-pos-menu-scope": "POS 菜单与界面",
  "foh-pos-order-cart": "点单内容与客户信息",
  "foh-pos-combo-ordering": "套餐与自定义点单",
  "foh-pos-buttons": "点单页按钮显隐",
  "foh-pos-order-toolbar": "点单页工具栏",
  "foh-kitchen-send-timing": "送厨规则与权限",
  "foh-pos-find-order-list": "找单与结账入口",
  "foh-pos-order-alerts": "消息类型提醒",
  "foh-guest-order-type": "订单类型、取餐与送厨",
  "foh-guest-registration": "食客登记与会员",
  "foh-guest-pre-order": "点单前限制与授权",
  "foh-guest-menu-home": "点餐首页与入口",
  "foh-guest-menu-body": "菜单与购物车展示",
  "foh-guest-facing-locale": "食客端语言",
  "foh-guest-hotpot": "火锅点餐",
  "foh-guest-duration-scenarios": "计时与自助餐规则",
  "foh-tableside-service": "桌边呼叫",
  "foh-guest-order-notes": "点单备注",
  "foh-wait-time-display": "等待时长计算与展示",
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
  "pos-order-toolbar": "foh-pos-order-toolbar",
  "foh-order-cart-combo": "foh-pos-order-cart",
  "pos-order-cart": "foh-pos-order-cart",
  "pos-combo-ordering": "foh-pos-combo-ordering",
  "foh-find-order-checkout": "foh-pos-find-order-list",
  "pos-find-order-list": "foh-pos-find-order-list",
  "foh-pos-checkout-entry": "foh-pos-find-order-list",
  "pos-checkout-entry": "foh-pos-find-order-list",
  "foh-pos-menu-layout": "foh-pos-menu-scope",
  "pos-menu-ui": "foh-pos-menu-scope",
  "foh-pos-menu-ui-layout": "foh-pos-menu-scope",
  "pos-menu-ui-layout": "foh-pos-menu-scope",
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
  "foh-guest-kitchen-send": "foh-guest-order-type",
  "foh-guest-scenario-dining": "foh-guest-order-type",
  "guest-channel-kitchen-send": "foh-guest-order-type",
  "guest-scenario-dining": "foh-guest-order-type",
  "guest-hotpot": "foh-guest-hotpot",
  "guest-duration-scenarios": "foh-guest-duration-scenarios",
  "tableside-service-call": "foh-tableside-service",
  "guest-notes-fees": "foh-guest-order-notes",
  "wait-time": "foh-wait-time-display",
  "guest-menu-scenarios": "foh-guest-menu-body",
  /** v2.0 十二组 → v3.0 十四组 */
  "foh-tables": "foh-table-start-flow",
  "foh-cashier-start": "foh-pos-shell",
  "foh-order-buttons-core": "foh-pos-buttons",
  "foh-pos-order-extras": "foh-pos-order-toolbar",
  "foh-order-toolbar-extra": "foh-pos-order-toolbar",
  "foh-menu-find-pay": "foh-pos-menu-scope",
  "foh-guest-kitchen-dining": "foh-guest-order-type",
  "foh-tableside-experience": "foh-tableside-service",
  /** 消息中心 v1.3：POS 员工端通知迁前厅 */
  "foh-pos-notification-control": "foh-pos-order-alerts",
  "notification-basics": "foh-pos-order-alerts",
  "staff-order-alerts": "foh-pos-order-alerts",
  "order-pickup-messages": "foh-pos-order-alerts",
  "combo-ordering": "foh-pos-combo-ordering",
  "service-call-alerts": "foh-tableside-service",
  "account-security-auth": "foh-pos-shell",
  "order-init-scenario": "foh-table-start-flow",
  "ui-operation-preferences": "foh-pos-shell",
  "role-employee-permissions": "foh-pos-shell",
  "split-merge-edit": "foh-pos-order-cart",
};

function range(a, b) {
  const out = [];
  for (let i = a; i < b; i++) out.push(i);
  return out;
}

/** @type {Record<string, number[]>} */
export const FOH_SETTINGS_ASSIGN_MAP = {
  "foh-pos-shell": [75, 166, 175, 165, 346],
  "foh-table-start-flow": [107, 619, 111, 625, 621, 643, 592],
  "foh-pos-menu-scope": [118, 174, 148, 348, 216, 217, 218, 220, 219, 350],
  "foh-pos-order-cart": [132, 133, 135, 137, 178, 121, 122, 222, 223, 349, 141],
  "foh-pos-combo-ordering": [138, 139, 145],
  "foh-pos-buttons": [...range(193, 196), ...range(197, 211), ...range(211, 216)],
  "foh-pos-order-toolbar": [483, 484, 485, 486, 196],
  "foh-kitchen-send-timing": [125, 113, 123, 114, 120, 345],
  "foh-pos-find-order-list": [153, 151, 152, 251, 248, 221],
  "foh-pos-order-alerts": [331, 332, 638, 639, 637, 110],
  "foh-table-clear-ops": [534, 642, 351, 347],
  "foh-guest-order-type": [487, 488, 489, 490, 491, 503, 581, 502],
  "foh-guest-registration": [623, 622, 504, 505, 506, 507, 510],
  "foh-guest-pre-order": [620, 626, 627],
  "foh-guest-facing-locale": [652, 653],
  "foh-guest-menu-home": [599, 604, 601, 602, 600, 611, 532],
  "foh-guest-menu-body": [516, 518, 606, 517, 520, 608, 515, 528, 618, 616, 524, 607, 519, 645, 509, 525, 526, 617],
  "foh-guest-hotpot": [572, 574, 573, 575],
  "foh-guest-duration-scenarios": [571, 674, 577, 578, 579, 580],
  "foh-tableside-service": [641, 640, 333],
  "foh-guest-order-notes": [521, 522, 523],
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
