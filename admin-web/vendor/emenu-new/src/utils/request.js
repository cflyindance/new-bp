import axios, { isAxiosError } from 'axios'
import Toast from '@/components/Toast'
import { getStorageValue, setStorageValue } from '@/utils/storage'
import { TIMOUT, errorMessage } from '@/constants/websocket'
import { clearAllStorage } from '@/utils/clearStorage'
import getPosVersion from '@/utils/getPosVersion'
import { sendPosLog } from '@/services/setting'
import { fetchCompanyProfile } from '@/services/system'
import * as rax from 'retry-axios'

const service = axios.create({
  baseURL: '/kpos/api',
  timeout: TIMOUT,
})
service.defaults.raxConfig = {
  retry: 0,
  retryDelay: 0,
  httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'POST'],
  statusCodesToRetry: [
    [100, 199],
    [400, 499],
    [500, 599],
  ],
}

rax.attach(service)

service.interceptors.request.use(
  (config) => {
    config.requestStartTime = performance.now()
    const posVersion = localStorage.getItem('posVersion')
    const posVersionNum = getPosVersion(posVersion)
    if (posVersionNum >= 1803012 && !config?.url.includes('cloud.menusifu')) {
      config.headers['posVersion'] = JSON.parse(posVersion)
    }
    if (!config?.url.includes('/kpos/webapp')) {
      config.headers['Authorization'] = 'UvDU853J9L351BThAC'
    } else {
      config.baseURL = '/'
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// flag - 避免多次刷新session key
let isRefreshing = false
service.interceptors.response.use(
  (response) => {
    if (
      response.config?.raxConfig?.retry > 0 &&
      response.config.raxConfig.currentRetryAttempt > 0
    ) {
      response.retryResponseCount =
        response.retryResponseCount === undefined
          ? 0
          : response.retryResponseCount + 1
      if (
        response.retryResponseCount >=
        response.config.raxConfig.currentRetryAttempt
      ) {
        delete response.retryResponseCount
      } else {
        return response
      }
    }

    const res = response.data || {}
    let isConfigInvalid = false
    if (
      response.config?.url.includes('posfrontlog') ||
      response.config?.url.includes('cloud.')
    ) {
      return { data: res }
    }
    if (response.config?.url.includes('/kpos/webapp')) {
      if (
        res.result?.successful ||
        res.menus ||
        res.itemSizeList ||
        res.systemtime || // 获取系统时间
        res === 'Image has been successfully uploaded' // 上传图片的返回
      )
        return { data: res }
      if (res?.result.failureReason === 'Invalid session key') {
        isConfigInvalid = true
      } else {
        return Promise.reject({ ...res, message: res?.result.failureReason })
      }
    }

    // if (
    //   response.request.responseURL.includes('couponTemplate/querySdkMetas') ||
    //   response.request.responseURL.includes('/crmToken/getToken')
    // ) {
    //   console.log('response---------------', res)
    // }

    // crm 继承接口兼容
    if (res.success) {
      return { data: res }
    }

    // session key 失效后静默刷新
    if (
      res.code === 2 ||
      res.msg === 'Invalid session key' ||
      isConfigInvalid
    ) {
      const config = response.config
      isConfigInvalid = false
      if (!isRefreshing) {
        isRefreshing = true
        return refreshSessionKey()
          .then((refreshRes) => {
            if (!refreshRes?.result?.successful) {
              Toast.error(
                refreshRes?.result?.failureReason ||
                  'Failed to refresh session key.'
              )
              clearAllStorage()
              throw new Error('Failed to refresh session key.')
            }
            const oldAuthInfo = getStorageValue('emenu_auth')
            const sessionKey = refreshRes?.sessionKey
            const newAuthInfo = {
              ...oldAuthInfo,
              secretKey: refreshRes?.secretKey,
              sessionKey,
              LastLoginTime: Date.now(),
              sessionExpireTime:
                Date.now() +
                (res?.sessionKeyRemainingActiveTime ?? 24 * 3600000),
            }
            setStorageValue('emenu_auth', newAuthInfo)
            // todo 后续针对不同类型的接口处理新参数
            config.params = {
              ...config.params,
              'userAuth.sessionKey': sessionKey,
            }
            if (config?.url.includes('/kpos/webapp')) {
              const parseData = JSON.parse(config.data)
              const newConfigData = {
                ...parseData,
                userAuth: {
                  sessionKey,
                },
              }
              config.params = null
              config.data = JSON.stringify(newConfigData)
            }
            isRefreshing = false
            return service(config)
          })
          .catch(() => {
            isRefreshing = false
            return Promise.reject({ ...res, message: res?.msg })
          })
      }
    }
    if (
      response.config?.url?.includes('/order/save') &&
      !res?.data?.order?.id
    ) {
      if (
        res?.msg ===
        'The current version is inconsistent with the host. Please  clear cache.'
      ) {
        if (!response.config._retry) {
          return refreshPosVersion().then(() => {
            return service({ ...response.config, _retry: true })
          })
        }
      }
      return Promise.reject({ ...res, message: res?.msg })
    }
    if (res.code !== 0) {
      return Promise.reject({ ...res, message: res?.msg })
    }
    if (response.config.returnOriginal) {
      return response
    }
    return res.data
  },
  (error) => {
    if (
      isAxiosError(error) &&
      error.config?.raxConfig?.retry > 0 &&
      error.config.raxConfig.currentRetryAttempt > 0
    ) {
      error.retryResponseCount =
        error.retryResponseCount === undefined
          ? 0
          : error.retryResponseCount + 1
      if (
        error.retryResponseCount >= error.config.raxConfig.currentRetryAttempt
      ) {
        delete error.retryResponseCount
      } else {
        return Promise.reject(error)
      }
    }

    if (error.config?.params?.link === 'connect') {
      return Promise.resolve({ result: 'false' })
    }
    const msg = errorMessage[error?.code]
    if (
      msg &&
      window.webviewConfig.active &&
      error.config?.requestStartTime > window.webviewConfig.resumeTime + 1000
    ) {
      Toast.error(msg)
    }
    return Promise.reject(error)
  }
)

const refreshSessionKey = () => {
  // 刷新session key前先断链ws
  if (window.globalWs) {
    window.globalWs?.close(4444, 'disconnect')
  }
  const authInfo = getStorageValue('emenu_auth')
  const { instanceName } = authInfo
  sendPosLog(`Emenu automatically refresh session key`)
  return service({
    url: '/license/clientInstanceLogin',
    method: 'post',
    data: {
      appInstanceType: 'EMENU',
      appInstanceName: instanceName,
      // sessionKey: sessionExpireTime < now + 10000 ? void 0 : sessionKey,
      // secretKey: sessionExpireTime < now + 10000 ? void 0 : secretKey,
      // requestNewKey: false,
    },
  }).then((loginRes) => loginRes)
}

const refreshPosVersion = async () => {
  try {
    const res = await fetchCompanyProfile()
    if (res?.company?.appInfo?.version) {
      setStorageValue('posVersion', res?.company?.appInfo?.version)
    }
  } catch {
    console.error('Failed to refresh pos version')
  }
}

export default service
