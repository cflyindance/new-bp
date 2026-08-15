import { createSlice } from '@reduxjs/toolkit'
import {
  getEmenuConfig,
  setEmenuConfig,
  sendPosLog,
  getEmenuProConfig,
} from '@/services/setting'
import {
  ALL_CONFIG_ITEM,
  configList,
  DEVICE_DEFAULT_CONFIG,
  displayMenu,
  displayMode,
  duration,
  emenuProMode,
  quantity,
  times,
} from '@/constants/systemConfig'
import { getStorageValue } from '@/utils/storage'
import { cloneDeep, isEqual } from 'lodash-es'
import { getI18n } from 'react-i18next'
import { errorMessage } from '@/constants/websocket'
import Toast from '@/components/Toast'
import getDeviceBindInfo from '@/utils/getDeviceBindInfo'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)

const i18n = getI18n()

export const systemConfigSlice = createSlice({
  name: 'systemConfigSlice',
  initialState: {
    configList: configList,
    tempGlobalConfig: [],
    deviceBindInfo: null, // typeof  null | Array 来判断是否有数据
    emenuProConfig: null,
  },
  reducers: {
    saveAllGlobalConfig(state, action) {
      state.configList.globalConfig = action.payload
    },
    saveAllDeviceConfig(state, action) {
      state.configList.deviceConfig = action.payload
    },

    setGlobalConfigItem(state, action) {
      const { id, newValue } = action.payload

      state.configList.globalConfig = state.configList.globalConfig.map(
        (each) => {
          if (each.id === id) {
            return {
              ...each,
              value: newValue,
            }
          }
          return each
        }
      )
    },
    setDeviceConfigItem(state, action) {
      const { idx, id, newValue } = action.payload
      state.configList.deviceConfig = state.configList.deviceConfig.map(
        (each, i) => {
          if (i === idx) {
            const { configInfo } = each
            const isInConfig = configInfo.find((each) => each.id === id)
            let newConfig = []
            if (isInConfig) {
              newConfig = configInfo.map((config) => {
                if (config.id === id) {
                  return {
                    ...config,
                    value: newValue,
                  }
                }
                return config
              })
            } else {
              if (DEVICE_DEFAULT_CONFIG.includes(id)) {
                const initExtraConfig = ALL_CONFIG_ITEM.find(
                  (each) => each.id === id
                )
                const finalExtraConfig = {
                  ...initExtraConfig,
                  value: newValue,
                }
                newConfig = [...configInfo, finalExtraConfig]
              }
            }
            return {
              ...each,
              configInfo: newConfig,
            }
          }
          return each
        }
      )
    },
    setTempGlobalConfig(state, action) {
      state.tempGlobalConfig = action.payload
    },
    setDeviceBindInfo(state, action) {
      state.deviceBindInfo = action.payload
    },
    setEmenuProConfig(state, action) {
      state.emenuProConfig = action.payload
    },
  },
})

export default systemConfigSlice.reducer
export const actions = systemConfigSlice.actions

const fetchConfig =
  ({
    isOnlyCompareDevice = false,
    loginSessionKey = null,
    isSettingInit = false,
  }) =>
  async (dispatch, getState) => {
    try {
      const sessionKey =
        loginSessionKey || getStorageValue('emenu_auth')?.sessionKey
      if (!sessionKey) return false
      const res = await getEmenuConfig(sessionKey)
      if (res.data?.result?.successful) {
        const allConfig = res.data.marginAppConfigTypes
        const emenuConfig = allConfig?.find((l) => l.product === 'EMENU')
        const configDataJson = emenuConfig?.data || '{}'
        if (configDataJson === '{}' && isSettingInit) {
          return configDataJson
        }
        const storedConfigList = getState().systemConfigSlice.configList
        const { deviceBindInfo } = getState().systemConfigSlice
        const tempConfigList = JSON.parse(configDataJson)
        const { globalConfig, deviceConfig } = storedConfigList
        const {
          globalConfig: tempGlobalConfig,
          deviceConfig: tempDeviceConfig,
        } = tempConfigList
        window.emenuGlobalConfig = globalConfig
        window.emenuDeviceConfig = deviceConfig
        dispatch(actions.setTempGlobalConfig(globalConfig || []))
        const bindInfo = getDeviceBindInfo(tempDeviceConfig) || []
        if (!isEqual(deviceBindInfo, bindInfo)) {
          dispatch(actions.setDeviceBindInfo(bindInfo))
        }
        if (!isEqual(deviceConfig, tempDeviceConfig)) {
          window.emenuDeviceConfig = tempDeviceConfig
          dispatch(actions.saveAllDeviceConfig(tempDeviceConfig || []))
        }
        if (isOnlyCompareDevice) return
        if (!isEqual(globalConfig, tempGlobalConfig)) {
          // 兼容新配置
          const finalGlobalConfig = [
            ...tempGlobalConfig,
            ...ALL_CONFIG_ITEM,
          ].reduce((pre, cur) => {
            if (!pre.length) return pre.concat(cur)
            const isExist = pre.find((each) => each.id === cur.id)
            if (isExist) return pre
            return pre.concat(cur)
          }, [])
          dispatch(actions.setTempGlobalConfig(finalGlobalConfig || []))
          window.emenuGlobalConfig = finalGlobalConfig
          dispatch(actions.saveAllGlobalConfig(finalGlobalConfig || []))
        }
      }
    } catch (e) {
      if (e?.code === 'ERR_NETWORK') {
        Toast.error(errorMessage[e?.code])
      }
    }
  }

const initConfig =
  ({ tableName, tableId }) =>
  async (dispatch) => {
    try {
      const sessionKey = getStorageValue('emenu_auth')?.sessionKey
      if (!sessionKey) return false
      const res = await getEmenuConfig(sessionKey)
      if (res.data?.result?.successful) {
        const allConfig = res.data.marginAppConfigTypes
        // 查找emenu配置
        const emenuConfig = allConfig?.find((l) => l.product === 'EMENU')
        const configDataJson = emenuConfig?.data || '{}'
        const tempConfigList = JSON.parse(configDataJson)
        const {
          deviceUuId,
          deviceName,
          webviewVersion,
          deviceType,
          version,
          appVersion,
          innerWidth,
          innerHeight,
          devicePixelRatio,
        } = window
        const timeZoneName = dayjs.tz.guess()
        const timeZoneUTCOffset = dayjs().tz(timeZoneName).format('Z')
        const defaultDeviceInfo = {
          deviceId: deviceUuId,
          deviceName,
          tableName,
          deviceLicense: getStorageValue('emenu_auth')?.instanceName,
          webviewVersion,
          systemVersion: `${deviceType}-${version}`,
          appVersion,
          tableId,
          innerWidth,
          innerHeight,
          devicePixelRatio,
          timeZoneName: timeZoneName,
          timeZoneUTCOffset: timeZoneUTCOffset,
        }
        let finalGlobalConfig = [...ALL_CONFIG_ITEM]
        let finalDeviceConfig = []
        const noEmenuConfig =
          !emenuConfig || !Object.keys(tempConfigList).length
        if (noEmenuConfig) {
          if (deviceUuId) {
            // 默认设备设置
            const newDeviceConfig = {
              ...defaultDeviceInfo,
              configInfo: [
                duration,
                times,
                quantity,
                displayMenu,
                displayMode,
                emenuProMode,
              ],
            }
            finalDeviceConfig = [newDeviceConfig]
          }
        } else {
          const {
            globalConfig: storedGlobalConfig,
            deviceConfig: storedDeviceConfig,
          } = tempConfigList
          // 全局设置
          finalGlobalConfig = [
            ...storedGlobalConfig,
            ...ALL_CONFIG_ITEM,
          ].reduce((pre, cur) => {
            // 处理全局配置可能有新加项的情况
            if (pre.length === 0) return pre.concat(cur)
            const isExist = pre.find((each) => each.id === cur.id)
            return !isExist ? pre.concat(cur) : pre
          }, [])
          // 设备设置
          finalDeviceConfig = [...storedDeviceConfig]
          if (deviceUuId) {
            const currentDeviceConfig = finalDeviceConfig.find(
              (each) => each.deviceId === deviceUuId
            )
            const defaultConfigInfo = finalGlobalConfig.filter((config) =>
              DEVICE_DEFAULT_CONFIG.includes(config.id)
            )
            // 当前设备无配置 - 同步需要的全局配置
            if (!currentDeviceConfig) {
              console.warn('no currentDeviceConfig')
              const getDeviceConfigFromGlobal = {
                ...defaultDeviceInfo,
                configInfo: defaultConfigInfo,
              }
              finalDeviceConfig.push(getDeviceConfigFromGlobal)
            } else {
              const currentConfigInfo = currentDeviceConfig.configInfo
              // 聚合当前设备设置及需要补充的默认设置
              const finalConfigInfo = [
                ...currentConfigInfo,
                ...defaultConfigInfo,
              ].reduce((pre, cur) => {
                // 处理设备设置可能有新加项的情况
                if (pre.length === 0) return pre.concat(cur)
                const isExist = pre.find((each) => each.id === cur.id)
                return !isExist ? pre.concat(cur) : pre
              }, [])
              finalDeviceConfig = finalDeviceConfig.map((each) => {
                return each.deviceId === deviceUuId
                  ? {
                      ...each,
                      ...defaultDeviceInfo,
                      configInfo: finalConfigInfo,
                    }
                  : each
              })
            }
          }
        }
        dispatch(actions.saveAllGlobalConfig(finalGlobalConfig))
        dispatch(actions.saveAllDeviceConfig(finalDeviceConfig))

        const newConfigList = {
          globalConfig: finalGlobalConfig,
          deviceConfig: finalDeviceConfig,
        }
        await dispatch(effects.setConfig(newConfigList))
        return
      }
      if (res.data?.result?.failureReason !== 'Invalid session key') {
        Toast.error(i18n.t('SystemSetting.fetchFailure'))
      }
    } catch (e) {
      Toast.error(e?.message || i18n.t('SystemSetting.fetchFailure'))
    }
  }

const setConfig =
  (configList, isGlobalSave = false) =>
  async (dispatch, getState) => {
    try {
      const sessionKey = getStorageValue('emenu_auth')?.sessionKey
      if (!sessionKey) return false
      if (isGlobalSave) {
        await dispatch(effects.fetchConfig({ isOnlyCompareDevice: true }))
      }
      const newConfig = cloneDeep(
        configList || getState().systemConfigSlice.configList
      )
      const invalidSetting =
        !newConfig ||
        !Object.keys(newConfig).length ||
        (!newConfig.globalConfig?.length && !newConfig.deviceConfig?.length)
      if (invalidSetting) {
        Toast.error(i18n.t('SystemSetting.updateFailed'))
        sendPosLog(`invalidSetting:${invalidSetting}, success:false`)
        return false
      }
      const newData = JSON.stringify(newConfig)
      const res = await setEmenuConfig(newData, sessionKey)
      sendPosLog(
        `invalidSetting:${invalidSetting}, success:${res.data?.result?.successful}`
      )
      if (res.data?.result?.successful) {
        await dispatch(effects.fetchConfig({ isOnlyCompareDevice: false }))
        return true
      }
      if (res.data?.result?.failureReason !== 'Invalid session key') {
        Toast.error(i18n.t('SystemSetting.fetchFailure'))
      }
      return false
    } catch (e) {
      Toast.error(e?.message || i18n.t('SystemSetting.saveFailure'))
      return false
    }
  }

const deleteDevice = (deviceInfo) => async (dispatch, getState) => {
  try {
    const sessionKey = getStorageValue('emenu_auth')?.sessionKey
    if (!sessionKey) return false

    const newConfig = cloneDeep(getState().systemConfigSlice.configList)
    const newDeviceList = newConfig.deviceConfig.filter(
      (item) => item.deviceId !== deviceInfo.deviceId
    )
    const newConfigList = {
      ...newConfig,
      deviceConfig: newDeviceList,
    }

    await dispatch(effects.setConfig(newConfigList))
  } catch (e) {
    Toast.error(e?.message || i18n.t('SystemSetting.saveFailure'))
    return false
  }
}

const fetchEmenuProConfig = () => async (dispatch, getState) => {
  try {
    const sessionKey = getStorageValue('emenu_auth')?.sessionKey
    if (!sessionKey) return false
    const res = await getEmenuProConfig(sessionKey)
    if (res.data?.result?.successful) {
      const allConfig = res.data.marginAppConfigTypes
      const emenuProConfig = allConfig?.find((l) => l.product === 'EMENUPRO')
      const configDataJson = emenuProConfig?.data || '{}'
      const configData = JSON.parse(configDataJson)
      if (!isEqual(configData, getState().systemConfigSlice.emenuProConfig)) {
        dispatch(actions.setEmenuProConfig(configData))
      }
    }
  } catch (e) {
    if (e?.code === 'ERR_NETWORK') {
      Toast.error(errorMessage[e?.code])
    }
  }
}

export const effects = {
  initConfig,
  setConfig,
  fetchConfig,
  deleteDevice,
  fetchEmenuProConfig,
}
