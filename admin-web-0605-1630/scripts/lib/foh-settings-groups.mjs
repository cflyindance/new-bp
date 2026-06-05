/**
 * 前厅管理中心 · 设置二级导航（方案 D-紧凑，12 组）
 * 供 apply-foh-settings-mapping.mjs、generate-foh-settings-design-doc.mjs、settings-intra-group-sort 共用
 */

export const FOH_SETTINGS_GROUP_ORDER = [
  "foh-tables",
  "foh-cashier-start",
  "foh-order-buttons-core",
  "foh-order-toolbar-extra",
  "foh-order-cart-combo",
  "foh-menu-find-pay",
  "foh-guest-menu-body",
  "foh-guest-menu-shell",
  "foh-guest-order-entry",
  "foh-guest-order-guard",
  "foh-guest-kitchen-dining",
  "foh-tableside-experience",
];

export const FOH_SETTINGS_GROUP_TITLES = {
  "foh-tables": "桌台与餐位",
  "foh-cashier-start": "登录开单与送厨",
  "foh-order-buttons-core": "点单按钮显隐·主流程",
  "foh-order-toolbar-extra": "点单工具栏与其他按钮",
  "foh-order-cart-combo": "购物车与套餐",
  "foh-menu-find-pay": "菜单找单与结账",
  "foh-guest-menu-body": "顾客菜单结构",
  "foh-guest-menu-shell": "点餐首页与语言",
  "foh-guest-order-entry": "用餐方式与下单登记",
  "foh-guest-order-guard": "下单授权与间隔",
  "foh-guest-kitchen-dining": "送厨与火锅自助餐",
  "foh-tableside-experience": "桌边服务与体验",
};

/** 旧 groupKey → 新 groupKey（设置滑层书签重定向） */
export const FOH_SETTINGS_LEGACY_GROUP_REDIRECT = {
  "tables-floor": "foh-tables",
  "pos-shell-landing": "foh-cashier-start",
  "pos-order-init": "foh-cashier-start",
  "pos-kitchen-send": "foh-cashier-start",
  "pos-button-visibility": "foh-order-buttons-core",
  "pos-order-toolbar": "foh-order-toolbar-extra",
  "pos-order-cart": "foh-order-cart-combo",
  "pos-combo-ordering": "foh-order-cart-combo",
  "pos-find-order-list": "foh-menu-find-pay",
  "pos-checkout-entry": "foh-menu-find-pay",
  "pos-menu-ui": "foh-menu-find-pay",
  "guest-menu-structure": "foh-guest-menu-body",
  "guest-menu-cart": "foh-guest-menu-body",
  "guest-menu-global": "foh-guest-menu-shell",
  "guest-facing-locale": "foh-guest-menu-shell",
  "guest-order-type": "foh-guest-order-entry",
  "guest-pre-order-flow": "foh-guest-order-entry",
  "guest-order-auth": "foh-guest-order-guard",
  "guest-order-throttle": "foh-guest-order-guard",
  "guest-channel-kitchen-send": "foh-guest-kitchen-dining",
  "guest-scenario-dining": "foh-guest-kitchen-dining",
  "tableside-service-call": "foh-tableside-experience",
  "guest-notes-fees": "foh-tableside-experience",
  "wait-time": "foh-tableside-experience",
  "guest-menu-scenarios": "foh-guest-menu-body",
};

function range(a, b) {
  const out = [];
  for (let i = a; i < b; i++) out.push(i);
  return out;
}

/** @type {Record<string, number[]>} */
export const FOH_SETTINGS_ASSIGN_MAP = {
  "foh-tables": [107, 619, 643, 644, 592, 169, 534, 642, 351, 347],
  "foh-cashier-start": [165, 346, 111, 625, 621, 113, 114, 120, 123, 125, 345],
  "foh-order-buttons-core": [...range(193, 196), ...range(197, 211)],
  "foh-order-toolbar-extra": [...range(211, 216), 196, 110, 483, 484, 485, 486],
  "foh-order-cart-combo": [132, 133, 135, 137, 121, 122, 178, 222, 223, 138, 139, 145],
  "foh-menu-find-pay": [118, 148, 176, 177, 348, 350, ...range(216, 221), 151, 152, 153, 251, 248, 221],
  "foh-guest-menu-body": [515, 516, 517, 518, 519, 520, 524, 525, 526, 528, 616, 617, 618],
  "foh-guest-menu-shell": [532, 599, 601, 602, 604, 606, 607, 608, 611, 509, 600, 645, 652, 653],
  "foh-guest-order-entry": [487, 488, 489, 490, 491, 503, 94, 98, 623, 622, 504, 505, 506, 507, 510, 569, 620, 626, 627, 349],
  "foh-guest-order-guard": [646, 595, 596, 594, 527, 597, 598, 588, 589, 590, 591],
  "foh-guest-kitchen-dining": [581, 502, 91, 567, 443, 571, 572, 574, 575, 573, 570, 577, 578, 579, 580],
  "foh-tableside-experience": [629, 641, 640, 333, 521, 522, 523, 535, 536, 537, 538, 539, 540],
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
