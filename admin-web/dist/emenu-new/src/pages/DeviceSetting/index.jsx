import { useEffect, useMemo, useState } from 'react'
import { Input } from 'antd'
import ConfigWrapper from '@/components/ConfigCommon'
import DeviceList from './components/DeviceList'
import DeviceContent from './components/DeviceContent'
import { useDispatch, useSelector } from 'react-redux'
import { effects } from '@/store/slices/systemConfig.slice'
import message from '@/components/Message'
import { useNavigate } from 'react-router-dom'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useMount } from 'ahooks'
import useFetchSystemConfig from '@/hooks/useFetchSystemConfig'
import styles from './index.module.less'
import { useTranslation } from 'react-i18next'
import { getTableName } from '@/utils'
import useSystemConfig from '@/hooks/useSystemConfig'

const { Search } = Input

const DeviceSetting = () => {
  const { t } = useTranslation()
  const { configList } = useSelector((state) => state.systemConfigSlice)
  const [selectedDevice, setSelectedDevice] = useState('')
  const [searchName, setSearchName] = useState(null)
  useFetchSystemConfig()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { runGetMenus } = useSetMenus()

  useMount(() => {
    runGetMenus()
  })

  const deviceList = useMemo(() => {
    return configList?.deviceConfig || []
  }, [configList])

  useEffect(() => {
    if (!selectedDevice) {
      setSelectedDevice(configList?.deviceConfig?.[0]?.deviceId)
    }
  }, [configList, selectedDevice])

  const searchList = useMemo(() => {
    if (!searchName) return deviceList
    return deviceList.filter(
      (each) =>
        each.deviceLicense.toLowerCase().includes(searchName.toLowerCase()) ||
        getTableName(each.tableName)
          .toLowerCase()
          .includes(searchName.toLowerCase())
    )
  }, [deviceList, searchName])

  const handleBack = () => navigate('/setting')

  const handleSave = () => {
    const res = dispatch(effects.setConfig())
    res && message.success(t('SystemSetting.saveSuccess'))
  }

  const handleSearchDevice = (value) => setSearchName(value)

  const { getGlobalConfig } = useSystemConfig()
  const isGlobalEmenuProMode = getGlobalConfig(63)?.open
  const footerTip = useMemo(() => {
    let emenuProModeTipVisible = false
    if (isGlobalEmenuProMode) {
      emenuProModeTipVisible = true
    } else {
      const hasEmenuProMode = configList?.deviceConfig?.some((device) => {
        const deviceConfig = device.configInfo
        const isEmenuProMode = deviceConfig.find((item) => item.id === 63)
          ?.value?.open
        return isEmenuProMode
      })
      emenuProModeTipVisible = hasEmenuProMode
    }
    return emenuProModeTipVisible ? t('SystemSetting.emenuProModeTip') : ''
  }, [isGlobalEmenuProMode, configList])

  return (
    <ConfigWrapper
      title="SystemSetting.deviceSetting"
      handleBack={handleBack}
      handleSave={handleSave}
      footerTip={footerTip}
      leftContent={
        <div className={styles.settingList}>
          <div className={styles.countDevice}>
            {t('SystemSetting.inUseDevice', { value: deviceList?.length })}
          </div>
          <div className={styles.search_box}>
            <Search
              onSearch={handleSearchDevice}
              placeholder="Please input table name or license Name"
            />
          </div>
          <DeviceList
            deviceList={searchList}
            selectedDevice={selectedDevice}
            setSelectedDevice={setSelectedDevice}
          />
        </div>
      }
      rightContent={
        <DeviceContent
          selectedDevice={selectedDevice}
          handleSave={handleSave}
          setSelectedDevice={setSelectedDevice}
        />
      }
      renderEmpty={
        !deviceList?.length && (
          <div className={styles.emptyBox}>
            {t('SystemSetting.noSettingTip')}
          </div>
        )
      }
    />
  )
}

export default DeviceSetting
