import { actions } from '@/store/slices/systemConfig.slice'
import { useDispatch, useSelector } from 'react-redux'
import { useMemo, useCallback } from 'react'
import { canBypassOrderRestrictions } from '@/constants/systemConfig'
import { bypassOrderRestrictionConfigIds } from '@/constants/limitConfig'

const useSystemConfig = (selectedDeviceId = window.deviceUuId || null) => {
  const dispatch = useDispatch()
  const { configList, tempGlobalConfig } = useSelector(
    (state) => state.systemConfigSlice
  )

  // 缓存设备信息
  const deviceInfo = useMemo(() => {
    if (!selectedDeviceId || !configList?.deviceConfig) return {}

    return (
      configList.deviceConfig.find(
        (each) => each.deviceId === selectedDeviceId
      ) || {}
    )
  }, [configList?.deviceConfig, selectedDeviceId])

  // 缓存设备配置信息
  const deviceConfigInfo = useMemo(() => {
    return deviceInfo?.configInfo || []
  }, [deviceInfo?.configInfo])

  // 缓存全局配置信息
  const globalConfigInfo = useMemo(() => {
    return configList?.globalConfig || []
  }, [configList?.globalConfig])

  // 使用 useCallback 优化函数
  const changeDeviceConfig = useCallback(
    (deviceId, configId, newValue) => {
      if (!deviceId || !configId) return

      const idx = configList?.deviceConfig?.findIndex(
        (each) => each.deviceId === deviceId
      )

      if (idx === -1) return

      dispatch(
        actions.setDeviceConfigItem({
          idx,
          id: configId,
          newValue,
        })
      )
    },
    [configList?.deviceConfig]
  )

  const changeGlobalConfig = useCallback((configId, newValue) => {
    if (!configId) return

    dispatch(
      actions.setGlobalConfigItem({
        id: configId,
        newValue,
      })
    )
  }, [])

  const getDeviceConfig = useCallback(
    (id) => {
      if (!id) return undefined
      return deviceConfigInfo.find((each) => each.id === id)?.value
    },
    [deviceConfigInfo]
  )

  const getGlobalConfig = useCallback(
    (id) => {
      if (!id) return undefined
      return globalConfigInfo.find((each) => each.id === id)?.value
    },
    [globalConfigInfo]
  )

  const getFinalConfigById = useCallback(
    (configId) => {
      if (!configId) return undefined

      const isBypassOrderRestrictionsEnabled =
        selectedDeviceId &&
        configId !== canBypassOrderRestrictions.id &&
        getDeviceConfig(canBypassOrderRestrictions.id)?.open
      const isOrderRestrictionConfig =
        bypassOrderRestrictionConfigIds.includes(configId)
      const shouldBypass =
        isBypassOrderRestrictionsEnabled && isOrderRestrictionConfig

      const currentDeviceConfig = getDeviceConfig(configId)

      if (selectedDeviceId && currentDeviceConfig) {
        // 设备展示菜单设置
        if (Array.isArray(currentDeviceConfig)) {
          if (shouldBypass) return []
          return currentDeviceConfig
        }
        // 设备其他设置
        if (
          Object.prototype.toString.call(currentDeviceConfig) ===
            '[object Object]' &&
          Object.keys(currentDeviceConfig).length > 0
        ) {
          if (shouldBypass) return { ...currentDeviceConfig, open: false }
          return currentDeviceConfig
        }
      }

      const currentGlobalConfig = getGlobalConfig(configId)
      if (shouldBypass) {
        if (Array.isArray(currentGlobalConfig)) return []
        if (
          Object.prototype.toString.call(currentGlobalConfig) ===
            '[object Object]' &&
          currentGlobalConfig
        ) {
          return { ...currentGlobalConfig, open: false }
        }
      }
      return currentGlobalConfig
    },
    [selectedDeviceId, getDeviceConfig, getGlobalConfig]
  )

  return {
    configList,
    getFinalConfigById,
    getGlobalConfig,
    getDeviceConfig,
    changeDeviceConfig,
    changeGlobalConfig,
    deviceInfo,
    tempGlobalConfig,
  }
}

export default useSystemConfig
