import { ALL_SET_SYSTEM_CONFIG } from '../constants/actionTypes'

const initState = {
  allSysConfig: [],
}

export default function allSysConfig(state = initState.allSysConfig, action) {
  switch (action.type) {
    case ALL_SET_SYSTEM_CONFIG:
      const sysObj = {}
      if (action.allSysConfig?.length) {
        action.allSysConfig.forEach((item) => {
          sysObj[item.name] = item.value === undefined || item.value === null ? '' : item.value
        })
      }
      return sysObj
    default:
      return state
  }
}

/**
 * 字段说明
 *
 * "RECEIPT_PRINT"（"true": 打印收据小票，"false": 不打印）
 * "value": "true"
 *
 * "TIPS_SUGGESTIONS_CALCULATION"（含'0'则代表税前算小费，含'1'代表税前折扣算）
 * "value": "1"
 *
 */
