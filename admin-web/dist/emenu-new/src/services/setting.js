import request from '@/utils/request'
import { getStorageValue } from '@/utils/storage'
import dayjs from 'dayjs'

export function postConfigUploadImg(type, data) {
  return request({
    url: `${
      import.meta.env.DEV
        ? `${import.meta.env.VITE_SERVER_URL}webapp`
        : '/kpos/webapp'
    }/file/image/upload/kiosk/${type}`,
    method: 'post',
    data,
  })
}

export function getEmenuConfig(sessionKey) {
  const data = {
    product: 'EMENU',
  }
  if (sessionKey) {
    data.userAuth = {
      sessionKey,
    }
  }
  return request({
    url: `${
      import.meta.env.DEV
        ? `${import.meta.env.VITE_SERVER_URL}webapp`
        : '/kpos/webapp'
    }/marginapp/fetchConfig`,
    method: 'post',
    data,
  })
}

export function getEmenuProConfig(sessionKey) {
  const data = {
    product: 'EMENUPRO',
  }
  if (sessionKey) {
    data.userAuth = {
      sessionKey,
    }
  }
  return request({
    url: `${
      import.meta.env.DEV
        ? `${import.meta.env.VITE_SERVER_URL}webapp`
        : '/kpos/webapp'
    }/marginapp/fetchConfig`,
    method: 'post',
    data,
  })
}

export function setEmenuConfig(data = '{}', sessionKey) {
  return request({
    url: `${
      import.meta.env.DEV
        ? `${import.meta.env.VITE_SERVER_URL}webapp`
        : '/kpos/webapp'
    }/marginapp/config`,
    method: 'post',
    data: {
      marginAppConfigType: {
        product: 'EMENU',
        data,
      },
      userAuth: {
        sessionKey,
      },
    },
  })
}

export function sendPosLog(logInfo) {
  const authInfo = getStorageValue('emenu_auth')
  const { instanceName, sessionKey } = authInfo || {}
  const { deviceUuId, deviceName } = window
  const platform =
    navigator.userAgent.indexOf('Android') > -1
      ? 'android'
      : /(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)
        ? 'ios'
        : 'web'
  const logMsg = `Emenu App log at 【${dayjs().format('YYYY-MM-DD HH:mm:ss')}】: instanceName:${instanceName}, sessionKey:${sessionKey}, deviceName:${deviceName}, deviceUuId:${deviceUuId}, platform:${platform}, ${logInfo} at ${new Date()}`
  return request({
    url: `${
      import.meta.env.DEV
        ? `${import.meta.env.VITE_SERVER_URL}webapp`
        : '/kpos/webapp'
    }/posfrontlog?logMsg=${logMsg}`,
    method: 'get',
  })
}
