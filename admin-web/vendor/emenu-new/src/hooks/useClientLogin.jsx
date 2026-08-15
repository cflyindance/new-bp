import { useEffect, useState } from 'react'
import { clientLogin } from '@/services/system'
import { useRequest } from 'ahooks'
import { useSnackbar } from 'notistack'
import { clearAllStorage } from '@/utils/clearStorage'
import { useDispatch, useSelector } from 'react-redux'
import { effects } from '@/store/slices/systemConfig.slice'
import Toast from '@/components/Toast'
import { useGlobalState } from '@/hooks/useGlobalState'
import { sendPosLog } from '@/services/setting'

const useClientLogin = (authInfo, setAuthInfo, closeModal) => {
  const { enqueueSnackbar } = useSnackbar()
  const [loginInfo, setLoginInfo] = useState(null)
  const [, setBoundLicense] = useGlobalState('boundLicense')
  const dispatch = useDispatch()
  const { deviceBindInfo, configList } = useSelector(
    (state) => state.systemConfigSlice
  )

  const clientLoginRequest = (appInstanceName) => {
    const { sessionKey, secretKey, sessionExpireTime } = authInfo
    const now = Date.now()
    return clientLogin({
      appInstanceName,
      sessionKey: sessionExpireTime < now + 10000 ? void 0 : sessionKey,
      secretKey: sessionExpireTime < now + 10000 ? void 0 : secretKey,
    })
  }

  useEffect(() => {
    if (loginInfo) {
      // 无设备id -> pc端使用
      if (!window.deviceUuId) return handleSuccessLogin(loginInfo)
      if (Array.isArray(deviceBindInfo)) {
        if (!deviceBindInfo.length) return handleSuccessLogin(loginInfo)
        if (!configList.deviceConfig.length) return
        const licenseBindRes = handleCheckLicenseBindInfo()
        if (!licenseBindRes) return
        const deviceBindRes = handleCheckDeviceBindInfo()
        if (!deviceBindRes) return
        handleSuccessLogin(loginInfo)
      }
    }
  }, [loginInfo, deviceBindInfo, configList])

  // 已被绑定的license 不能被其他设备选择
  const handleCheckLicenseBindInfo = () => {
    const otherDeviceLicense = deviceBindInfo.filter(
      (device) =>
        device.value?.deviceId && device.value.deviceId !== window.deviceUuId
    )
    const otherDeviceLicenseNames = otherDeviceLicense?.map(
      (device) => device.value?.licenseName
    )
    // 有错误绑定信息 -> 存在设备列表
    if (otherDeviceLicenseNames.includes(loginInfo.instanceName)) {
      const occupiedDevice = configList.deviceConfig.filter((device) =>
        otherDeviceLicense
          ?.map((d) => d?.value.deviceId)
          ?.includes(device.deviceId)
      )?.[0]

      const deviceName = occupiedDevice?.deviceName || ''
      let deviceId = occupiedDevice?.deviceId || ''
      if (deviceId) {
        const start = deviceId.slice(0, 4)
        const end = deviceId.slice(-4)
        deviceId = `${start}****${end}`
      }
      let currentDeviceId = window.deviceUuId
      if (currentDeviceId) {
        const start = currentDeviceId.slice(0, 4)
        const end = currentDeviceId.slice(-4)
        currentDeviceId = `${start}****${end}`
      }
      Toast.error(
        <>
          <div>
            {`License "${loginInfo.instanceName}" is already bound to device "${deviceName}".`}
          </div>
          <div style={{ marginTop: '8px', fontSize: '16px' }}>
            Bound Device ID: {deviceId}
          </div>
          <div style={{ marginTop: '8px', fontSize: '16px' }}>
            Current Device ID: {currentDeviceId}
          </div>
        </>
      )
      return false
    }
    return true
  }

  // 检查当前设备绑定信息
  const handleCheckDeviceBindInfo = () => {
    const currentDeviceBindInfo = deviceBindInfo.find(
      (device) => device.value?.deviceId === window.deviceUuId
    )
    if (!currentDeviceBindInfo) return true
    const boundLicense = currentDeviceBindInfo.value.licenseName
    if (boundLicense && boundLicense !== loginInfo.instanceName) {
      setBoundLicense(currentDeviceBindInfo.value)
      Toast.error(
        `The current device has been bound with license: 【${boundLicense}】`
      )
      return false
    }
    return true
  }

  const handleSuccessLogin = (authInfo) => {
    if (window.deviceUuId) {
      sendPosLog(`device login`)
    }
    setAuthInfo(authInfo)
    // 关闭弹窗
    closeModal?.()
    // 清除信息
    setLoginInfo(null)
    setBoundLicense(null)
    // 刷新
    window.location.reload()
  }

  const onErrorCb = (errMsg) => {
    enqueueSnackbar(errMsg, {
      variant: 'error',
    })
    clearAllStorage()
    const timer = setTimeout(() => {
      window.location.reload()
      clearTimeout(timer)
    }, 1000)
  }

  const { run, loading } = useRequest(
    (appInstanceName) => clientLoginRequest(appInstanceName),
    {
      manual: true,
      onSuccess: (res, params) => {
        if (res?.result?.successful) {
          const LastLoginTime = Date.now()
          const currentLoginInfo = {
            ...authInfo,
            instanceName: params[0],
            secretKey: res?.secretKey,
            sessionKey: res?.sessionKey,
            LastLoginTime,
            sessionExpireTime:
              LastLoginTime +
              (res?.sessionKeyRemainingActiveTime ?? 24 * 3600000),
          }
          setLoginInfo(currentLoginInfo)
          dispatch(
            effects.fetchConfig({
              isOnlyCompareDevice: true,
              loginSessionKey: res?.sessionKey,
            })
          )
        } else {
          onErrorCb(
            `Login Error: api status: success, ${res?.result?.failureReason}`
          )
        }
      },
      onError: (e) => {
        onErrorCb(`Login Error: api status: failed, ${e?.message}`)
      },
    }
  )

  return {
    run,
    loading,
  }
}

export default useClientLogin
