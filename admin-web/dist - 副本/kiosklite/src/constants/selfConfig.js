// kiosk-config默认配置
export const selfConfigList = {
  charge: [],
  configList: [
    {
      id: 1,
      value: true,
      key: 'enter-name',
    },
    {
      id: 2,
      value: true,
      key: 'order-special-instructions',
    },
    {
      id: 3,
      value: false,
      key: 'dish-special-instructions',
    },
    {
      id: 4,
      value: [],
      key: 'meal-delivery-service-mode',
    },
    {
      id: 5,
      value: true,
      key: 'tipping-mode',
    },
    {
      id: 6,
      value: true,
      key: 'choose-languge-mode',
    },
    {
      id: 7,
      value: 2,
      key: 'signature-print-mode',
    },
    {
      id: 8,
      value: 0,
      key: 'print-mode',
    },
    {
      id: 9,
      value: 1,
      key: 'sms-mode',
    },
    {
      id: 10,
      value: ['en', 'zh_cn'],
      key: 'languageChoose',
    },
    {
      id: 11,
      value: 'en',
      key: 'default-language',
    },
    {
      id: 12,
      value: false,
      key: 'phone-required',
    },
    {
      id: 13,
      value: false,
      key: 'wait-list-mode',
    },
    {
      id: 14,
      value: [2, [15, 20, 25]],
      key: 'tip-collect-method',
    },
    {
      id: 15,
      value: false,
      key: 'name-required',
    },
    {
      id: 16,
      value: true,
      key: 'menu-number',
    },
    {
      id: 17,
      value: false,
      key: 'display-group-name',
    },
    {
      id: 18,
      value: true,
      key: 'menu-image-proportional-display',
    },
    {
      id: 19,
      value: false,
      key: 'display-combo-navbar',
    },
    {
      id: 20,
      value: [0],
      key: 'send-kitchen-order-type',
    },
    {
      id: 21,
      value: 0,
      key: 'credit-card-min-amount',
    },
    {
      id: 22,
      value: true,
      key: 'Expand-the-first-group-by-default',
    },
    {
      id: 23,
      value: true,
      key: 'display-signature',
    },
    {
      id: 24,
      value: 0,
      key: 'tip-procedure',
      Authorization: false,
    },
    {
      id: 25,
      value: true,
      key: 'show-order-type-page',
    },
    {
      id: 26,
      value: false,
      key: 'brand-setting',
      settingValue: {},
    },
    {
      id: 27,
      value: true,
      key: 'no-tip-selection',
    },
    {
      id: 28,
      value: 0,
      key: 'callBoard-method',
    },
    {
      id: 29,
      value: true,
      key: 'show-send-dish-method',
    },
    {
      id: 30,
      value: true,
      key: 'sub-dish-instructions',
    },
    {
      id: 31,
      value: false,
      key: 'brand-home-page',
    },
    {
      id: 32,
      value: true,
      key: 'lazy-load-mode',
    },
    {
      id: 33,
      value: 0,
      key: 'menu-display-position',
    },
    {
      id: 34,
      value: [],
      key: 'licenes-device-info', //使用licenes硬件的设备信息
    },
    {
      id: 35,
      value: {
        //设置默认的屏保数据
        status: true, //是否开启屏保
        dataSource: 'cloud', // local | cloud，无素材时默认云端
        showHomePage: true, //是否展示首页
        delayTime: 60, //进入屏保的时间
        imageAnimation: 'fade', //图片动画效果
        swiperTime: 3, //图片轮播时间
        horizontalData: {
          //竖屏数据
          type: 'image', //图片（image）or视频(video)
          imageList: [], //图片列表
          videoList: [], //视频列表
        },
        verticalityData: {
          //横屏数据
          type: 'image', //图片（image）or视频(video)
          imageList: [], //图片列表
          videoList: [], //视频列表
        },
      },
      key: 'screen-saver', //屏保数据
    },
    {
      id: 36,
      value: true,
      key: 'togo-show-num-cards', //打包时候是否展示号码牌的配置，默认为开启
    },
    {
      id: 37,
      value: true,
      key: 'login-crm-need-auth',
    },
    //菜单标签
    {
      id: 38,
      value: [],
      key: 'menu-label',
    },
    {
      id: 39,
      value: false,
      key: 'show-choose-table-page',
    },
    {
      id: 40,
      value: {
        status: false,
        delayTime: 0,
      },
      key: 'auto-clear-table',
    },
    {
      id: 41,
      value: [],
      key: 'table-in-use-by-lisense',
    },
    {
      id: 42,
      value: true,
      key: 'menu-promotionlist-show',
    },
    {
      id: 43,
      value: 0,
      key: 'menu-promotionlist-position',
    },
    {
      id: 44,
      value: {
        status: false,
        overTimeClose: 30,
        overTimeShowModal: '',
      },
      key: 'show-waiting-time',
    },
    {
      id: 45,
      value: {
        dialog: {
          //是否开启引导广告对话框
          status: true,
          horizontalImg: '',
          verticalImg: '',
        },
        banner: {
          //是否开启引导广告
          status: true,
          horizontalImg: '',
          verticalImg: '',
        },
      },
      key: 'login-guide',
    },
    {
      id: 46,
      value: true,
      key: 'order-checkable-only-reward',
    },
    {
      id: 47,
      value: {
        status: false,
        overNumber: 10,
        overTimeMinutes: 10,
        rangeSubMinutes: 2,
        rangeAddMinutes: 2,
      },
      key: 'show-waiting-time-range',
    },
    {
      id: 48,
      value: true,
      key: 'show-points-info',
    },
    {
      id: 49,
      value: false,
      key: 'policy-default-status',
    },
    {
      id: 50,
      value: true,
      key: 'menusifu-footer-logo',
    },
    {
      id: 51,
      value: true,
      key: 'zero-price',
    },
    {
      id: 52,
      value: true,
      key: 'local-promotion-status',
    },
    {
      id: 53,
      value: true,
      key: 'local-inventory-status',
      init: false,
    },
    {
      id: 54,
      value: true,
      key: 'local-label-status',
      init: false,
    },
    {
      id: 55,
      value: true,
      key: 'tip-price-detail',
    },
    {
      id: 56,
      value: ['count', 'time'],
      key: 'waiting-time-show-type',
    },
    {
      id: 57,
      value: {
        type: 'default', // 'default' 或 'multiple'
        fontsizeMultiple: 1,
      },
      key: 'font-size',
    },
    {
      id: 58,
      value: {
        type: 'default', // 'default' 或 'custom'
        customColor: '#000000b3', // 自定义背景色，默认000000b3
      },
      key: 'font-background-color',
    },
    {
      id: 59,
      value: {
        type: 'default', // 'default' 或 'custom'
        customColor: '#FFFFFF', // 自定义颜色，默认白色
      },
      key: 'font-color',
    },
    {
      id: 60,
      value: true,
      key: 'partial-payment-auto-print-receipt',
    },
    {
      id: 61,
      value: {
        status: false,
        dishIds: [],
      },
      key: 'simple-dish-detail-display',
    },
    {
      id: 62,
      value: false,
      key: 'show-party-size-selection',
    },
    {
      id: 63,
      value: false,
      key: 'party-size-required',
    },
    {
      id: 64,
      value: 0,
      key: 'promotion-center-activity-name',
    },
    {
      id: 65,
      value: ['en', 'zh_cn'],
      key: 'home-language-btn-display',
    },
    {
      id: 66,
      value: {
        status: false,
        displayLangs: [],
        primaryLang: '',
      },
      key: 'menu-name-bilingual-display',
    },
    {
      id: 67,
      value: true,
      key: 'show-promotion-deals-card',
    },
    {
      id: 68,
      value: false,
      key: 'cash-pay-confirm-dialog',
    },
    {
      id: 69,
      value: {
        status: false,
        horizontalImg: '',
        verticalImg: '',
      },
      key: 'number-plate-page-image',
    },
    {
      id: 70,
      value: ['0', '1'],
      key: 'kiosk-payment-types',
    },
  ],
  soldOut: [],
  brandManage: [],
  promotion: [],
  promotionEnableType: '',
};

export const activityTypes = [
  {
    label: '买A赠B',
    value: 'buyGifts',
  },
  {
    label: 'M件N折',
    value: 'buyDiscount',
  },
  {
    label: '满减折扣',
    value: 'orderDiscount',
  },
  {
    label: '加价换购',
    value: 'exchangePurchase',
  },
];

export const promotionItem = {
  activityType: null, // 活动类型
  activityTitle: {
    zh: '',
    en: '',
  },
  activityTag: {
    zh: '',
    en: '',
  },
  id: null,
  enable: true,
  effectiveType: 'single', // 生效类型 single-单个, multi-多个
  timeInfo: {
    startDate: null,
    endDate: null,
    weekDay: [],
    startTime: null,
    endTime: null,
  },
  activityRule: undefined,
};

export const buyGiftItem = {
  buyType: 'random',
  buyNumber: null,
  buyDishes: [],
  giftsType: 'random',
  giftsNumber: null,
  giftsDishes: [],
  giftsDishesType: 'manual',
};

export const buyDiscountItem = {
  buyType: 'identical',
  buyNumber: null,
  buyDishes: [],
  giftsDiscount: null,
  giftsDiscountRule: '0',
};

export const orderDiscountItem = {
  satisfyPrice: null,
  discountType: null,
  discountNumber: null,
  isFirstOrderDiscount: '0',
  usePromotionCode: '0',
  promotionCodeName: null,
  promotionCode: null,
};

export const exchangePurchaseItem = {
  conditionType: 'orderAmount',
  satisfyPrice: null,
  buyType: 'random',
  buyNumber: null,
  buyDishes: [],
  giftsDishesType: 'manual',
  giftsType: 'random',
  giftsNumber: null,
  giftsDishes: [],
  discountType: 'fixDiscount',
  discountNumber: null,
};

export const choiceType = [
  {
    label: '任意',
    value: 'random',
  },
  {
    label: '相同',
    value: 'identical',
  },
];

export const wayOfGiving = [
  {
    label: '手动',
    value: 'manual',
  },
];

export const discountTypes = ['fixDiscount', 'rateDiscount'];

export const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};
