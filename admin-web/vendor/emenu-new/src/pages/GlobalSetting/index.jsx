import { useMemo, useState } from 'react'
import { SYSTEM_SETTING_CATEGORY } from '@/constants/systemConfig'
import ConfigWrapper from '@/components/ConfigCommon'
import SettingCategory from './components/SettingCategory'
import SettingContent from './components/SettingContent'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { effects, actions } from '@/store/slices/systemConfig.slice'
import message from '@/components/Message'
import useFetchSystemConfig from '@/hooks/useFetchSystemConfig'
import { useTranslation, Trans } from 'react-i18next'
import useSetGlobalConfigItem from '@/hooks/useSystemConfig'
import findDifferentIds from '@/utils/findDifferentIds'
import { Modal } from 'antd'
import styles from './index.module.less'

const SystemSetting = () => {
  const [changeItemIds, setChangeItemIds] = useState([])
  const [visible, setVisible] = useState(false)
  const { t } = useTranslation()
  const [selectedCate, setSelectedCate] = useState(SYSTEM_SETTING_CATEGORY[0])
  const dispatch = useDispatch()
  const navigate = useNavigate()
  useFetchSystemConfig()
  const { configList, tempGlobalConfig, getGlobalConfig } =
    useSetGlobalConfigItem()

  const handleBack = () => navigate('/setting')

  const handleSave = () => {
    const displayDishNote = configList?.globalConfig?.find(
      (config) => config.id === 28
    )

    const scheduleSetting = configList?.globalConfig?.find(
      (config) => config.id === 30
    )
    if (displayDishNote?.value?.open) {
      if (!displayDishNote?.value?.displayDishNote?.length) {
        return message.warn(t('displaySetting.selectDisplayNoteItem'))
      }
    }
    if (scheduleSetting?.value?.open) {
      if (!scheduleSetting?.value?.scheduleSetting?.length) {
        return message.warn(t('schedule.no_empty_setting'))
      }
    }
    const deviceItemIds = [5, 6, 7, 9, 10, 63]
    const differentIds = findDifferentIds(
      configList?.globalConfig,
      tempGlobalConfig
    )
    // 修改了可以同步到设备设置的配置
    if (differentIds?.[0] && deviceItemIds.includes(differentIds[0])) {
      const changeItemIds = deviceItemIds.filter((id) =>
        differentIds.includes(id)
      )
      setChangeItemIds(changeItemIds)
      setVisible(true)
      return
    }
    const res = dispatch(effects.setConfig(null, true))
    res && message.success(t('SystemSetting.saveSuccess'))
  }

  const items = useMemo(() => {
    const configItems = changeItemIds?.map((each) => {
      const name = tempGlobalConfig.find(
        (globalConfig) => globalConfig.id === each
      )?.key
      return `[${t(name)}]`
    })
    return configItems?.join('、')
  }, [changeItemIds, tempGlobalConfig])

  const handleCancelSave = () => {
    setChangeItemIds([])
    setVisible(false)
  }

  const handleSaveSetting = () => {
    // 将 全局配置同步到设备配置中
    const syncGlobalConfig = configList?.globalConfig.filter((config) =>
      changeItemIds.includes(config.id)
    )
    let deviceConfig = configList?.deviceConfig
    if (deviceConfig?.length && syncGlobalConfig?.length) {
      deviceConfig = deviceConfig.map((deviceConfig) => {
        const { configInfo } = deviceConfig
        const newConfigInfo = configInfo.map((config) => {
          const syncItem = syncGlobalConfig.find(
            (syncInfo) => syncInfo.id === config.id
          )
          if (syncItem) return syncItem
          return config
        })
        return {
          ...deviceConfig,
          configInfo: newConfigInfo,
        }
      })
      dispatch(actions.saveAllDeviceConfig(deviceConfig))
    }
    const newConfigList = {
      globalConfig: configList?.globalConfig,
      deviceConfig: deviceConfig,
    }
    const res = dispatch(effects.setConfig(newConfigList, false))
    res && message.success(t('SystemSetting.saveSuccess'))
    handleCancelSave()
  }

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
    <>
      <ConfigWrapper
        handleBack={handleBack}
        handleSave={handleSave}
        title="SystemSetting.header"
        footerTip={footerTip}
        leftContent={
          <SettingCategory
            selectedCate={selectedCate}
            setSelectedCate={setSelectedCate}
          />
        }
        rightContent={<SettingContent selectedCate={selectedCate} />}
      />
      <Modal
        open={visible}
        onCancel={handleCancelSave}
        onOk={handleSaveSetting}
        width={500}
      >
        <div className={styles.modalSaveWrapper}>
          <Trans
            i18nKey="SystemSetting.modalTipMessage"
            values={{ items }}
            components={{ strong: <strong /> }}
          />
        </div>
      </Modal>
    </>
  )
}

export default SystemSetting
