import { createGlobalState } from 'react-hooks-global-state'

const initialState = {
  AuthInfo: {},
  // 全部menu
  Menu_Source: [],
  // 全部套餐菜
  Menu_Source_Combo_Section_List: [],
  // 暂存根据营业时间过滤后的menu
  Temp_Menus: [],
  // 根据营业时间过滤后的menu
  All_Menus: [],
  Active_Menu: [0, 0],
  selected: 0,
  ComboCart: [],
  Cart: [],
  TaxList: [],
  Orders: [],
  charge: {},
  isLifeCycleResume: false,
  ChargeList: [],
  TableOrders: [],
  isAdminSettingOpen: false,
  instructions: '',
  currentBuffetInfo: [],
  countTime: null,
  alertIsChecked: false,
  // 是否只有一层楼层
  isOnlyOneFloor: false,
  // 是否有火锅锅底
  isHasHotpot: false,
  // 会员信息
  memberInfo: {},
  // 店铺权益信息
  privilege: {},
  // "会员权益" 菜品
  privilegeItem: {},
  // 是否开启权益卡
  isOpenPrivilege: false,
  // crm 积分信息
  earningRule: {},
  // 登录会员 modal visible
  open: false,
  // crm 活动
  crmRewardRules: [],
  // 下单页输入密码弹窗
  orderAdminPermission: {
    open: false,
    permission: '',
    next: () => {},
  },
  // 选择的CRM 兑换折扣
  selectedDiscountRule: null,
  // 兑换折扣后 提示结单的弹窗
  redeemDiscountOpen: false,
  // 菜品规格多语言列表
  itemSizeLanguageList: [],
  // 全局调味指示列表
  modifierActionList: [],
  // 避免自动弹窗
  isAvoidAutoModal: false,
  // 是否需要检查菜品权限
  isNeedCheckDishAuth: true,
  // 会员登陆相关方法
  loginCrmFnObj: {
    onLoginSuccess: () => {},
    onCloseLoginModal: () => {},
  },
  // 当前设备绑定信息
  boundLicense: null,
  // 菜单分类模式下选择的分类
  selectedMenuClassify: null,
  // 剩余就餐时间
  restCountTime: null,
  // 下单的特殊菜单
  currentSpecialMenu: null,
  // 当前选择的特殊套餐
  selectedSpecialComboId: 0,
  // 下单的特殊品类数量
  notCountAsGuestNumber: undefined,
  // 加购动效队列
  addToCartQueue: [],
  // 海报
  poster: {
    open: false,
    posterBeforeOrder: false,
    next: () => {},
  },
  menuInit: false,
  isUpdatingPartySize: false,
  apiVersions: {
    menuVersion: undefined,
    // orderVersionInfo: {
    //   orderVersion: undefined,
    //   orderId: undefined,
    // },
  },
}

export const { useGlobalState, getGlobalState } =
  createGlobalState(initialState)
