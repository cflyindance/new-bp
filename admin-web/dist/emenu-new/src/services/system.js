import request from '@/utils/request'

export function listAppInstances() {
  return request({
    url: '/appInstance/list',
    method: 'get',
    params: {
      ipAddress: window.location.hostname,
      type: 'EMENU',
    },
  })
}

export function clientLogin({ appInstanceName, sessionKey, secretKey }) {
  return request({
    url: '/license/clientInstanceLogin',
    method: 'post',
    data: {
      appInstanceType: 'EMENU',
      appInstanceName,
      sessionKey,
      secretKey,
      // requestNewKey: false,
    },
  })
}

export function listPrivileges({ passcode, sessionKey }) {
  return request({
    url: '/staff/privilege/list',
    method: 'get',
    // data: {},
    params: {
      passcode,
      'userAuth.userPasscode': passcode,
      'userAuth.sessionKey': sessionKey,
    },
  })
}

export function saveMessage(message) {
  return request({
    url: '/system/message/save',
    method: 'post',
    data: {
      message,
    },
  })
}

export function getMessages(params) {
  return request({
    url: '/system/message/list',
    method: 'get',
    params: params,
  })
}

export function listSystemConfiguration() {
  return request({
    url: '/system/configuration/list',
    method: 'get',
  })
}

export function fetchCompanyProfile(returnOriginal = false) {
  return request({
    url: '/company/profile/fetch',
    method: 'get',
    returnOriginal,
  })
}

export function listStaff() {
  return request({
    url: '/staff/member/list',
    method: 'get',
  })
}

// 测试计价代码
// export function listDiscount() {
//   return request({
//     url: '/discount/list',
//     method: 'get',
//   })
// }
//
// export function listCharge() {
//   return request({
//     url: '/charge/list',
//     method: 'get',
//   })
// }
//
// export function listGlobalOption() {
//   return request({
//     url: '/modifier/action/list',
//     method: 'get',
//   })
// }

export function listTaxes() {
  return request({
    url: '/tax/list',
    method: 'get',
  })
}

export function sendCdsMsg(orderId) {
  return request({
    url: '/cds/record/save',
    method: 'post',
    data: {
      customerDisplayRecord: {
        refId: orderId,
        type: 'ORDER',
      },
      action: 'CALL',
      requestSource: 'EMENU_CALL_SERVER',
    },
  })
}

// 获取POS系统时间
export function getSystemTime() {
  return request({
    url: `${
      import.meta.env.DEV
        ? `${import.meta.env.VITE_SERVER_URL}webapp`
        : '/kpos/webapp'
    }/server/systemtime`,
    method: 'get',
  })
}
