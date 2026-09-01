import { SET_SYSTEM_CONFIG } from '../constants/actionTypes'

const initState = {
  sysConfig: [],
}

export default function systemConfig(state = initState.sysConfig, action) {
  switch (action.type) {
    case SET_SYSTEM_CONFIG:
      return action.sysConfig
    default:
      return state
  }
}

/**
 * 字段说明
 *
 * "CASH_DISCOUNT_RATE"
 * "value": "",
 *
 * "IS_CHARGE_TAX"（加收费用要算税（整单加收，餐具，打包带））
 * "booleanValue": true,
 *
 * "CHOOSE_ORDER_TYPE"（订单类型（0：DineIn，1：ToGo，2：Pickup））
 * "value": "0,1,2",
 *
 * "ORDER_TOTAL_ROUNDING_STRATEGY"
 * "value": "NO_ROUNDING",
 *
 * "KIOSK_COMBO_MODE"（已废弃）
 * "booleanValue": false,
 *
 * "COUNTRY_STATES_PROVINCE_TERRITORY"
 * "value": "USA",
 *
 * "KIOSK_PAYMENT_TYPE"（支付方式（0：card，1：cash，2：ecard））
 * "value": "1,0",
 *
 * "KIOSK_SEND_MESSAGE"（开通SMS（控制phoneInput页面））
 * "booleanValue": true,
 *
 * "TIPS_SUGGESTIONS_PERCENTAGE"
 * "value": "15|18|20",
 *
 * "IS_DISCOUNT_VOID_TAX"
 * "booleanValue": true,
 *
 * "CASH_DISCOUNT_SETTING"
 * "booleanValue": false,
 *
 * "IS_EXEMPT_TAX_ON_TAKEOUT_ORDER"（togo下，是否全部免税（整单加收，餐具，打包带全免税））
 * "booleanValue": false,
 *
 */
