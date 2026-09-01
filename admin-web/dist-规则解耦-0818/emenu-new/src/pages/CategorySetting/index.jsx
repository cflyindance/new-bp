import { useMemo, useState } from 'react'
import ConfigWrapper from '@/components/ConfigCommon'
import { useNavigate } from 'react-router-dom'
import { BRAND_SETTING_CATEGORY } from '@/constants/systemConfig'
import LeftSetting from './components/LeftSetting'
import RightContent from './components/RightContent'
import useFetchSystemConfig from '@/hooks/useFetchSystemConfig'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { effects } from '@/store/slices/systemConfig.slice'
import useSystemConfig from '@/hooks/useSystemConfig'
import message from '@/components/Message'

const CategorySetting = () => {
  const { t } = useTranslation()
  const [selectedCate, setSelectedCate] = useState(BRAND_SETTING_CATEGORY[0])
  const navigate = useNavigate()
  useFetchSystemConfig()
  const dispatch = useDispatch()

  const handleBack = () => navigate('/setting')

  const handleSave = () => {
    const res = dispatch(effects.setConfig())
    if (res) {
      message.success(t('SystemSetting.saveSuccess'))
    }
  }

  const { getGlobalConfig, configList } = useSystemConfig()
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
      title="SystemSetting.categorySetting"
      handleBack={handleBack}
      handleSave={handleSave}
      footerTip={footerTip}
      leftContent={
        <LeftSetting
          selectedCate={selectedCate}
          setSelectedCate={setSelectedCate}
        />
      }
      rightContent={<RightContent selectedCate={selectedCate} />}
    />
  )
}

export default CategorySetting
