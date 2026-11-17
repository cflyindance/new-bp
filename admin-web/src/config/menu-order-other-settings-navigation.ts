/** Existing settings sections shared by the merchant sidebar and permission categories. */
export const MENU_ORDER_OTHER_SETTINGS_PATH = "/operations/queue-call/menu-order-limits/other";
type SettingMeta = { seq: number; title: string; sceneDesc: string };

const INTERVAL_SETTINGS: SettingMeta[] = [
  {
    seq: 588,
    title: "订单下单时间间隔",
    sceneDesc:
      "按产线（POS、PayPad、POS GO、eMenu、SDI）分别配置两次订单提交的最小时间间隔（秒）；小于间隔时需服务员授权。",
  },
  {
    seq: 589,
    title: "间隔时间内允许加购（订单）",
    sceneDesc:
      "各产线可分别选择允许加购或不允许加购；允许时直接加购，不设置授权次数或数量阈值。",
  },
  {
    seq: 590,
    title: "菜品下单时间间隔",
    sceneDesc:
      "新增规则后，按产线选择适用商品并配置最小下单时间间隔（分钟）；小于间隔时需服务员授权。",
  },
  {
    seq: 591,
    title: "间隔时间内允许加购（菜品）",
    sceneDesc:
      "各产线可分别选择允许加购或不允许加购；允许时直接加入购物车，不设置授权次数或数量阈值。",
  },
];

const AUTH_SETTINGS: SettingMeta[] = [
  {
    seq: 646,
    title: "命中规则后的授权方式",
    sceneDesc:
      "各产线分别启用，设置逐条或合并授权，以及仅本次操作或已授权规则本单内有效。",
  },
  {
    seq: 595,
    title: "允许可看不可点的菜添加至购物车",
    sceneDesc:
      "在所选产线（POS、PayPad、POS GO、eMenu、SDI）设置是否允许可看不可点的菜添加至购物车，关闭时需密码授权。",
  },
  {
    seq: 596,
    title: "可看不可点的菜弹出服务员授权",
    sceneDesc:
      "在所选产线（POS、PayPad、POS GO、eMenu、SDI）设置可看不可点的菜是否弹出服务员授权。",
  },
];

const POINTS_SETTINGS: SettingMeta[] = [
  {
    seq: 594,
    title: "需要权限下单的积分菜",
    sceneDesc: "勾选产线后，食客兑换积分菜须服务员输入密码授权。",
  },
  {
    seq: 527,
    title: "订单仅有积分商品可以兑换",
    sceneDesc: "勾选产线允许订单仅含积分商品时直接下单兑换。",
  },
];

type SettingsSection = { key: string; title: string; desc: string; settings: SettingMeta[] };

export const MENU_ORDER_OTHER_SETTINGS_SECTIONS: SettingsSection[] = [
  {
    key: "interval",
    title: "下单时间间隔",
    desc: "配置订单级与菜品级提交间隔，以及间隔内是否允许加购及授权触发条件。",
    settings: INTERVAL_SETTINGS,
  },
  {
    key: "auth",
    title: "命中后授权",
    desc: "配置限制命中后的统一授权方式，以及「可看不可点」菜品在购物车中的行为。",
    settings: AUTH_SETTINGS,
  },
  {
    key: "points",
    title: "积分菜限制",
    desc: "配置积分菜兑换授权与纯积分订单是否允许直接下单。",
    settings: POINTS_SETTINGS,
  },
];

