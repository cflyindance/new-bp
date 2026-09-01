export const ReadyState = {
  UNINSTANTIATED: -1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}

export const StatusMap = {
  [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  [ReadyState.CONNECTING]: 'Connecting',
  [ReadyState.OPEN]: 'Open',
  [ReadyState.CLOSING]: 'Closing',
  [ReadyState.CLOSED]: 'Closed',
}

export const HeartbeatTypes = {
  NORMAL: {
    heartbeatType: 'S',
    heartbeatInterval: 1000 * 10,
  },
  IN_LOCK: {
    heartbeatType: 'F',
    heartbeatInterval: 5000,
  },
}

export const TIMOUT = 20 * 1000

export const errorMessage = {
  ERR_NETWORK: 'Network Error! Please check your network and POS!',
  ECONNABORTED:
    'Timeout! Please check your network and POS, then try again later',
}

// companyChargeChange - 公司详情,营业时间相关
// itemSizeChange - 菜品大小份
// menuChange - 菜单
export const NEW_MESSAGE_TYPE = [
  'companyChargeChange',
  'itemSizeChange',
  'menuChange',
]
