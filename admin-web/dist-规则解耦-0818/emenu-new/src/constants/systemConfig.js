// import { getDefaultBrandSetting } from '@/utils/brandMenuCount'
// step 1 定义新配置
export const restrictDish = {
  id: 1,
  key: 'restrictDish',
  value: [],
}

export const delaySendDish = {
  id: 2,
  key: 'delaySendDish',
  value: [],
}

export const limitRestrict = {
  id: 3,
  key: 'limitRestrict',
  value: [],
}

export const tipMessage = {
  id: 4,
  key: 'tipMessage',
  value: {
    orderTipTitle: '',
    orderTipContent: '',
    hotPotFirstTitle: '',
    hotPotSecondTitle: '',
    hotPotFirstContent: '',
    hotPotSecondContent: '',
  },
}

export const duration = {
  id: 5,
  key: 'duration',
  value: {
    open: false,
    duration: null,
  },
}

export const times = {
  id: 6,
  key: 'times',
  value: {
    open: false,
    times: null,
  },
}

export const quantity = {
  id: 7,
  key: 'quantity',
  value: {
    open: false,
    quantity: null,
  },
}

export const restrictNewOrder = {
  id: 8,
  key: 'restrictNewOrder',
  value: {
    open: false,
  },
}

export const displayMenu = {
  id: 9,
  key: 'displayMenu',
  value: [],
}

export const displayMode = {
  id: 10,
  key: 'displayMode',
  value: {
    open: false,
  },
}

export const guestNum = {
  id: 11,
  key: 'guestSelection',
  value: {
    open: true,
  },
}

export const sendOrderInterval = {
  id: 12,
  key: 'intervalMinutes',
  value: {
    open: false,
    intervalMinutes: null,
    type: 'minutes',
    allowAddToCart: false,
  },
}

export const DEFAULT_AGE = [] //['成人', '儿童']
export const DEFAULT_CATEGORY = []
// [
// '午餐烧烤',
//     '午餐火锅',
//     '午餐双拼',
//     '晚餐烧烤',
//     '晚餐火锅',
//     '晚餐双拼',
// ]

export const categoryMode = {
  id: 13,
  key: 'categoryMode',
  value: {
    open: false,
    typeSetting: {
      age: DEFAULT_AGE,
      type: DEFAULT_CATEGORY,
    },
    brandMeuSetting: [], //getDefaultBrandSetting(DEFAULT_AGE, DEFAULT_CATEGORY),
    brandBusinessTime: [],
    categoryModeName: '自助餐', // 开启菜单分类后, 可以修改品类的提示名
    alias: {
      age: null,
      type: null,
    },
  },
}

export const restTimeAlert = {
  id: 14,
  key: 'restTimeAlert',
  value: {
    open: false,
    restTimeAlert: 15,
    disableOrderAfterAlert: false,
    beforeAlertTime: 5,
  },
}

export const allowReviseSize = {
  id: 15,
  key: 'allowReviseSize',
  value: {
    open: true,
  },
}

export const showMealTime = {
  id: 16,
  key: 'showMealTime',
  value: {
    open: false,
    inverted: false,
  },
}

export const sendKitchenMethod = {
  id: 17,
  key: 'sendKitchenMethod',
  value: {
    sendKitchenMethod: 'auto',
  },
}

export const dishQuantityLimit = {
  id: 18,
  key: 'dishQuantityLimit',
  value: [],
}

export const noMultipleOrder = {
  id: 19,
  key: 'noMultipleOrder',
  value: {
    open: true,
  },
}

export const isRequirePot = {
  id: 20,
  key: 'isRequirePot',
  value: {
    open: false,
  },
}

export const hotPotOrderMethod = {
  id: 21,
  key: 'hotPotOrderMethod',
  value: {
    hotPotOrderMethod: 'auto',
  },
}

export const isLazyLoading = {
  id: 23,
  key: 'isLazyLoading',
  value: {
    open: true,
  },
}

export const defaultOrderDish = {
  id: 22,
  key: 'defaultOrderDish',
  value: {
    open: false,
    defaultOrderDish: [],
  },
}

export const isShowGroupMenu = {
  id: 24,
  key: 'isShowGroupMenu',
  value: {
    open: true,
  },
}

export const isShowCategoryMenu = {
  id: 25,
  key: 'isShowCategoryMenu',
  value: {
    open: true,
  },
}

export const dishDisplay = {
  id: 26,
  key: 'dishDisplay',
  value: {
    type: 'mix', // large, small, mix
    smallDishList: [],
    largeDishList: [],
  },
}

export const showDishDetail = {
  id: 27,
  key: 'showDishDetail',
  value: {
    open: false,
    showDishDetail: [],
  },
}

export const displayDishNote = {
  id: 28,
  key: 'displayDishNote',
  value: {
    open: false,
    displayDishNote: [],
  },
}

export const callServerCheckout = {
  id: 29,
  key: 'callServerCheckout',
  value: {
    open: false,
  },
}

export const scheduleSetting = {
  id: 30,
  key: 'scheduleSetting',
  value: {
    open: false,
    scheduleSetting: [],
  },
}

export const labelsSetting = {
  id: 31,
  key: 'labelsSetting',
  value: {
    labelsSetting: [],
  },
}

export const displayOrderNote = {
  id: 32,
  key: 'displayOrderNote',
  value: {
    open: true,
  },
}

export const restrictRedeemItem = {
  id: 33,
  key: 'restrictRedeemItem',
  value: {
    open: false,
    restrictRedeemItem: [],
  },
}

export const isNeedLoginCRM = {
  id: 34,
  key: 'isNeedLoginCRM',
  value: {
    open: false,
  },
}

export const isNeedAuthCode = {
  id: 35,
  key: 'isNeedAuthCode',
  value: {
    open: true,
  },
}

export const isOpenSpecialDishPermission = {
  // 开启后，点特殊菜，要到购物车才会需要服务员输入密码
  id: 36,
  key: 'isOpenSpecialDishPermission',
  value: {
    open: true,
  },
}

export const samePotDefaultAdded = {
  //同一锅型，相同锅底超过一半默认加
  id: 37,
  key: 'samePotDefaultAdded',
  value: [],
}

export const newOrderNotification = {
  id: 38,
  key: 'newOrderNotification',
  value: {
    open: true,
  },
}

export const editOrderNotification = {
  id: 39,
  key: 'editOrderNotification',
  value: {
    open: true,
  },
}

export const isCrmNeedAuthLogin = {
  id: 40,
  key: 'isCrmNeedAuthLogin',
  value: {
    open: false,
  },
}

export const callServerAddWater = {
  id: 41,
  key: 'callServerAddWater',
  value: {
    open: false,
  },
}

export const callServerSendTableware = {
  id: 42,
  key: 'callServerSendTableware',
  value: {
    open: false,
  },
}

export const callServerSendTissue = {
  id: 43,
  key: 'callServerSendTissue',
  value: {
    open: false,
  },
}
export const limitRestrictEveryone = {
  id: 44,
  key: 'limitRestrictEveryone',
  value: [],
}

export const isClearTable = {
  id: 45,
  key: 'isClearTable',
  value: {
    open: true,
  },
}

// 营业时间即将结束提示 默认20min
export const runTimeWillEnd = {
  id: 47,
  key: 'runTimeWillEnd',
  value: {
    open: false,
    runTimeWillEnd: 20,
  },
}

export const limitRestrictOnce = {
  id: 46,
  key: 'limitRestrictOnce',
  value: [],
}

// 优先级比36低
export const isSpecialDishServePermission = {
  id: 49,
  key: 'isSpecialDishServePermission',
  value: {
    open: false,
  },
}

export const deviceBindingInfo = {
  id: 50,
  key: 'deviceBindingInfo',
  value: {},
}

export const callServerSwitch = {
  id: 51,
  key: 'callServerSwitch',
  value: {
    open: true,
  },
}

export const menuClassifyMode = {
  id: 52,
  key: 'menuClassifyMode',
  value: {
    open: false,
    menuClassifySetting: [], // { id, name, allowedOrderDish, viewDishType, viewOnlyViaDish, viewOnlyViaMenu, businessTime }[]
  },
}

export const menuTitleFontSize = {
  id: 53,
  key: 'menuTitleFontSize',
  value: {
    open: false,
    menuTitleFontSize: 16,
  },
}

export const isNeedPasswordAuth = {
  id: 54,
  key: 'isNeedPasswordAuth',
  value: {
    open: true,
  },
}

export const specialMenu = {
  id: 55,
  key: 'specialMenu',
  value: {
    open: false,
    specialMenu: [],
  },
}

export const posterAds = {
  id: 56,
  key: 'posterAds',
  value: {
    open: false,
    posterAds: [],
    displayButton: false,
    text: {
      zh: null,
      en: null,
    },
    posterBeforeOrder: false,
  },
}

export const dishQuantityPerRound = {
  id: 57,
  key: 'dishQuantityPerRound',
  value: {
    open: false,
    dishQuantityPerRound: [
      { specificDishLimit: [{}] },
      { specificDishLimit: [{}] },
    ],
  },
}

export const homepageVideo = {
  id: 58,
  key: 'homepageVideo',
  value: {
    open: false,
    homepageVideo: [],
    displayMode: 'fullscreen',
  },
}

export const isChildNotCountAsGuest = {
  id: 59,
  key: 'isChildNotCountAsGuest',
  value: {
    open: false,
  },
}

export const homepageSetting = {
  id: 60,
  key: 'homepageSetting',
  value: {
    hideStartButton: false,
    hidePoweredBy: false,
  },
}

export const callServerTimeInterval = {
  id: 61,
  key: 'callServerTimeInterval',
  value: {
    open: false,
    callServerTimeInterval: 20,
  },
}

export const callServerWithoutOrder = {
  id: 62,
  key: 'callServerWithoutOrder',
  value: {
    open: false,
  },
}

export const emenuProMode = {
  id: 63,
  key: 'emenuProMode',
  value: {
    open: false,
  },
}

export const confirmTableBeforeStartOrder = {
  id: 64,
  key: 'confirmTableBeforeStartOrder',
  value: {
    open: false,
  },
}

export const displayZeroPrice = {
  id: 65,
  key: 'displayZeroPrice',
  value: {
    open: true,
  },
}

export const displayDishCode = {
  id: 66,
  key: 'displayDishCode',
  value: {
    open: true,
  },
}

export const shopCartSetting = {
  id: 67,
  key: 'shopCartSetting',
  value: {
    showPremiumMemberLogin: true,
  },
}

export const callServerAddSoupBroth = {
  id: 68,
  key: 'callServerAddSoupBroth',
  value: {
    open: false,
  },
}

export const callServerChangeGrillTop = {
  id: 69,
  key: 'callServerChangeGrillTop',
  value: {
    open: false,
  },
}

export const callServerOrderDrinks = {
  id: 70,
  key: 'callServerOrderDrinks',
  value: {
    open: false,
  },
}

export const languages = {
  id: 71,
  key: 'languages',
  value: {
    languages: ['en', 'zh'],
    defaultLanguage: 'en',
  },
}

export const dishIntervalMinutes = {
  id: 72,
  key: 'dishIntervalMinutes',
  value: {
    open: false,
    dishIntervalMinutes: [{ dish: [] }],
    allowAddToCart: false,
  },
}

export const switchTableBeforeStartOrder = {
  id: 73,
  key: 'switchTableBeforeStartOrder',
  value: {
    open: false,
  },
}

export const showSendToKitchenStatus = {
  id: 74,
  key: 'showSendToKitchenStatus',
  value: {
    open: true,
  },
}

export const customDishOrderMessages = {
  id: 75,
  key: 'customDishOrderMessages',
  value: {
    open: false,
    customDishOrderMessages: [{}],
  },
}

export const mutexDish = {
  id: 76,
  key: 'mutexDish',
  value: {
    open: false,
    mutexDish: [{ dishA: [], dishB: [] }],
  },
}

export const combinationDish = {
  id: 77,
  key: 'combinationDish',
  value: {
    open: false,
    combinationDish: [{ dishA: [], dishB: [] }],
  },
}

export const hideSoldOutDish = {
  id: 78,
  key: 'hideSoldOutDish',
  value: {
    open: false,
  },
}

export const authBeforeOrder = {
  id: 79,
  key: 'authBeforeOrder',
  value: {
    open: false,
    menuClassifyMode: true,
    categoryMode: true,
    defaultMode: true,
  },
}

export const autoPrintReceipt = {
  id: 80,
  key: 'autoPrintReceipt',
  value: {
    open: false,
  },
}

export const limitRestrictSet = {
  id: 81,
  key: 'limitRestrictSet',
  value: [],
}

export const cartOrderPriceVisible = {
  id: 82,
  key: 'cartOrderPriceVisible',
  value: {
    open: true,
  },
}

export const showPotAfterOrder = {
  id: 83,
  key: 'showPotAfterOrder',
  value: {
    open: true,
  },
}

export const posterAdsAfterStartOrder = {
  id: 84,
  key: 'posterAdsAfterStartOrder',
  value: {
    open: false,
    posterAds: [],
  },
}

export const canChangeCategroyBeforeOrder = {
  id: 85,
  key: 'canChangeCategroyBeforeOrder',
  value: {
    open: false,
  },
}

export const pemiumMemberPoster = {
  id: 86,
  key: 'pemiumMemberPoster',
  value: {
    open: false,
    pemiumMemberPoster: [],
  },
}

export const pemiumMemberInfo = {
  id: 87,
  key: 'pemiumMemberInfo',
  value: {
    open: false,
  },
}

export const lottery = {
  id: 88,
  key: 'lottery',
  value: {
    open: false,
    thresholdCount: null,
    maxTimes: null,
    excludeDishIds: [],
    winProbability: null,
    rewardDishIds: [],
  },
}

export const submitBuffetFirst = {
  id: 89,
  key: 'submitBuffetFirst',
  value: {
    open: true,
  },
}

export const lotteryAnimation = {
  id: 90,
  key: 'lotteryAnimation',
  value: {
    open: false,
    cropDisplay: false,
    winVideo: [],
    loseVideo: [],
  },
}

export const canBypassOrderRestrictions = {
  id: 91,
  key: 'canBypassOrderRestrictions',
  value: {
    open: false,
  },
}

export const cdsMessageEnabled = {
  id: 92,
  key: 'cdsMessageEnabled',
  value: {
    open: false,
  },
}

export const memberRedemptionCenter = {
  id: 93,
  key: 'memberRedemptionCenter',
  value: {
    open: true,
    memberRedemptionCenterIcon: [],
  },
}

// G了... 不再是临时需求了...
export const dishSetQuantityLimit = {
  id: 9999,
  key: 'dishSetQuantityLimit',
  value: [],
}

// step 2 加入到全局配置中
export const ALL_CONFIG_ITEM = [
  restrictDish,
  delaySendDish,
  limitRestrict,
  tipMessage,
  duration,
  times,
  quantity,
  restrictNewOrder,
  displayMenu,
  displayMode,

  guestNum,
  sendOrderInterval,
  categoryMode,
  restTimeAlert,
  runTimeWillEnd,
  allowReviseSize,
  showMealTime,
  sendKitchenMethod,
  dishQuantityLimit,
  noMultipleOrder,
  isRequirePot,
  showPotAfterOrder,

  hotPotOrderMethod,
  isLazyLoading,
  defaultOrderDish,
  isShowGroupMenu,
  isShowCategoryMenu,
  dishDisplay,
  showDishDetail,
  displayDishNote,
  callServerCheckout,
  callServerAddWater,

  callServerSendTableware,
  callServerSendTissue,
  scheduleSetting,
  labelsSetting,
  displayOrderNote,
  restrictRedeemItem,
  isNeedLoginCRM,
  isNeedAuthCode,
  isOpenSpecialDishPermission,
  samePotDefaultAdded,

  newOrderNotification,
  editOrderNotification,
  isCrmNeedAuthLogin,
  isClearTable,
  limitRestrictEveryone,
  limitRestrictOnce,
  isSpecialDishServePermission,
  dishSetQuantityLimit,
  limitRestrictSet,
  deviceBindingInfo,
  callServerSwitch,
  menuClassifyMode,
  menuTitleFontSize,
  isNeedPasswordAuth,
  specialMenu,
  posterAds,
  dishQuantityPerRound,
  isChildNotCountAsGuest,
  homepageVideo,
  callServerTimeInterval,
  callServerWithoutOrder,
  homepageSetting,
  emenuProMode,
  confirmTableBeforeStartOrder,

  displayZeroPrice,
  displayDishCode,

  shopCartSetting,
  callServerAddSoupBroth,
  callServerChangeGrillTop,
  callServerOrderDrinks,
  languages,

  dishIntervalMinutes,
  switchTableBeforeStartOrder,
  showSendToKitchenStatus,
  customDishOrderMessages,
  mutexDish,
  combinationDish,
  hideSoldOutDish,
  authBeforeOrder,
  autoPrintReceipt,
  cartOrderPriceVisible,
  posterAdsAfterStartOrder,
  canChangeCategroyBeforeOrder,
  pemiumMemberPoster,
  pemiumMemberInfo,
  lottery,
  lotteryAnimation,
  canBypassOrderRestrictions,
  submitBuffetFirst,
  cdsMessageEnabled,
  memberRedemptionCenter,
]

export const configList = {
  // 全局设置
  globalConfig: [], // ALL_CONFIG_ITEM
  // 设备设置, 优先级大于全局设置
  deviceConfig: [],
}

// 需要区分来源 global/device
export const DEVICE_DEFAULT_CONFIG = [5, 6, 7, 9, 10, 50, 63, 91]

export const SYSTEM_SETTING_CATEGORY = [
  'menuConfig',
  'tipMessage',
  'orderSetting',
  'menuSetting',
  // 'authConfig',
  // 'messageType',
  'userSetting',
  'schedule',
  'labels',
  'notification',
  'waiterSetting',
  'menuStyle',
  'authorization',
  'lottery',
  'posterAds',
  'pemiumMember',
  'homepageVideo',
  'languages',
  'receipt',
]

export const BRAND_SETTING_CATEGORY = [
  'typeSetting',
  'brandMenuSetting',
  'brandBusinessTime',
  'specialMenu',
]

export const MENU_CLASSIFY_SETTING = [
  'typeSetting',
  'menuClassifySetting',
  'menuBusinessTime',
]

export const DISPLAY_SETTING = [
  {
    id: displayMenu.id,
    key: 'displayMenu',
    isInDevice: true,
  },
  {
    id: displayMode.id,
    key: 'displayMode',
    isInDevice: true,
  },
  {
    id: categoryMode.id,
    key: 'categoryMode',
    isInDevice: false,
  },
  {
    id: menuClassifyMode.id,
    key: 'menuClassifyMode',
    isInDevice: false,
  },
  {
    id: isLazyLoading.id,
    key: 'isLazyLoading',
    isInDevice: false,
  },
  {
    id: emenuProMode.id,
    key: 'emenuProMode',
    isInDevice: true,
  },
  {
    id: isShowGroupMenu.id,
    key: 'isShowGroupMenu',
    isInDevice: false,
  },
  {
    id: isShowCategoryMenu.id,
    key: 'isShowCategoryMenu',
    isInDevice: false,
  },
  {
    id: dishDisplay.id,
    key: 'dishDisplay',
    isInDevice: false,
  },
  {
    id: showDishDetail.id,
    key: 'showDishDetail',
    isInDevice: false,
  },
  {
    id: displayDishNote.id,
    key: 'displayDishNote',
    isInDevice: false,
  },
  {
    id: displayOrderNote.id,
    key: 'displayOrderNote',
    isInDevice: false,
  },
  {
    id: homepageSetting.id,
    key: 'homepageSetting',
    isInDevice: false,
  },
  {
    id: displayZeroPrice.id,
    key: 'displayZeroPrice',
    isInDevice: false,
  },
  {
    id: displayDishCode.id,
    key: 'displayDishCode',
    isInDevice: false,
  },
  {
    id: shopCartSetting.id,
    key: 'shopCartSetting',
    isInDevice: false,
  },
  {
    id: showSendToKitchenStatus.id,
    key: 'showSendToKitchenStatus',
    isInDevice: false,
  },
  {
    id: cartOrderPriceVisible.id,
    key: 'cartOrderPriceVisible',
    isInDevice: false,
  },
  {
    id: hideSoldOutDish.id,
    key: 'hideSoldOutDish',
    isInDevice: false,
  },
]

export const userSettingMap = [
  {
    id: guestNum.id,
    key: guestNum.key,
  },
  {
    id: restrictNewOrder.id,
    key: restrictNewOrder.key,
  },
  {
    id: allowReviseSize.id,
    key: allowReviseSize.key,
  },
  {
    id: isNeedAuthCode.id,
    key: isNeedAuthCode.key,
  },
  {
    id: isNeedLoginCRM.id,
    key: isNeedLoginCRM.key,
  },
  {
    id: isCrmNeedAuthLogin.id,
    key: isCrmNeedAuthLogin.key,
  },
  {
    id: isChildNotCountAsGuest.id,
    key: isChildNotCountAsGuest.key,
  },
  {
    id: authBeforeOrder.id,
    key: authBeforeOrder.key,
  },
  {
    id: canChangeCategroyBeforeOrder.id,
    key: canChangeCategroyBeforeOrder.key,
  },
]

export const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 19 },
}

export const labelsType = ['text', 'picture']

export const notificationMap = [
  {
    id: callServerSwitch.id,
    key: callServerSwitch.key,
  },
  {
    id: callServerCheckout.id,
    key: callServerCheckout.key,
  },
  {
    id: callServerAddWater.id,
    key: callServerAddWater.key,
  },
  {
    id: callServerSendTableware.id,
    key: callServerSendTableware.key,
  },
  {
    id: callServerSendTissue.id,
    key: callServerSendTissue.key,
  },
  {
    id: callServerAddSoupBroth.id,
    key: callServerAddSoupBroth.key,
  },
  {
    id: callServerChangeGrillTop.id,
    key: callServerChangeGrillTop.key,
  },
  {
    id: callServerOrderDrinks.id,
    key: callServerOrderDrinks.key,
  },
  {
    id: customDishOrderMessages.id,
    key: customDishOrderMessages.key,
  },
  {
    id: newOrderNotification.id,
    key: newOrderNotification.key,
  },
  {
    id: editOrderNotification.id,
    key: editOrderNotification.key,
  },
  {
    id: callServerTimeInterval.id,
    key: callServerTimeInterval.key,
  },
  {
    id: callServerWithoutOrder.id,
    key: callServerWithoutOrder.key,
  },
  {
    id: cdsMessageEnabled.id,
    key: cdsMessageEnabled.key,
  },
]

export const emenuNotificationMap = [
  // {
  //   id: callServerCheckout.id,
  //   key: callServerCheckout.key,
  //   value: 'checkout',
  // },
  {
    id: callServerAddWater.id,
    key: callServerAddWater.key,
    value: 'addWater',
  },
  {
    id: callServerSendTableware.id,
    key: callServerSendTableware.key,
    value: 'tableware',
  },
  {
    id: callServerSendTissue.id,
    key: callServerSendTissue.key,
    value: 'napkin',
  },
  {
    id: callServerAddSoupBroth.id,
    key: callServerAddSoupBroth.key,
    value: 'addSoupBroth',
  },
  {
    id: callServerChangeGrillTop.id,
    key: callServerChangeGrillTop.key,
    value: 'changeGrillTop',
  },
  {
    id: callServerOrderDrinks.id,
    key: callServerOrderDrinks.key,
    value: 'orderDrinks',
  },
]

export const waiterSettingMap = [
  {
    id: isClearTable.id,
    key: isClearTable.key,
  },
  {
    id: confirmTableBeforeStartOrder.id,
    key: confirmTableBeforeStartOrder.key,
  },
  {
    id: switchTableBeforeStartOrder.id,
    key: switchTableBeforeStartOrder.key,
  },
]

export const limitRestrictMap = [
  {
    id: limitRestrict.id,
    key: limitRestrict.key,
  },
  {
    id: limitRestrictSet.id,
    key: limitRestrictSet.key,
  },
  {
    id: limitRestrictEveryone.id,
    key: limitRestrictEveryone.key,
  },
  {
    id: dishSetQuantityLimit.id,
    key: dishSetQuantityLimit.key,
  },
]

export const menuStyleMap = [
  {
    id: menuTitleFontSize.id,
    key: menuTitleFontSize.key,
  },
]

export const authSettingMap = [
  {
    id: isNeedPasswordAuth.id,
    key: isNeedPasswordAuth.key,
  },
]

export const deviceAuthorizationSettingMap = [
  {
    id: canBypassOrderRestrictions.id,
    key: canBypassOrderRestrictions.key,
  },
]

export const receiptSettingMap = [
  {
    id: autoPrintReceipt.id,
    key: autoPrintReceipt.key,
  },
]

export const pemiumMemberMap = [
  {
    id: pemiumMemberPoster.id,
    key: pemiumMemberPoster.key,
  },
  {
    id: memberRedemptionCenter.id,
    key: memberRedemptionCenter.key,
  },
  // {
  //   id: pemiumMemberInfo.id,
  //   key: pemiumMemberInfo.key,
  // },
]

export const lotteryMap = [
  {
    id: lottery.id,
    key: lottery.key,
  },
  {
    id: lotteryAnimation.id,
    key: lotteryAnimation.key,
  },
]
