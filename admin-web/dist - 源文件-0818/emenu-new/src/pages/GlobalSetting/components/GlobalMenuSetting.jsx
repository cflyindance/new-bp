import MenuSetting from '@/components/ConfigCommon/MenuSetting'
import { useMemo } from 'react'
import useSetGlobalConfigItem from '@/hooks/useSystemConfig'

const GlobalMenuSetting = () => {
  const { changeGlobalConfig, configList, getGlobalConfig } =
    useSetGlobalConfigItem()

  const displayMenu = useMemo(() => {
    return getGlobalConfig(9)
  }, [configList])

  const handleChangeMenu = (menu) => {
    changeGlobalConfig(9, menu)
  }

  const handleSwitchChange = (id, newValue, key = 'open') => {
    const oldVal = getGlobalConfig(id)
    changeGlobalConfig(id, { ...oldVal, [key]: newValue })
  }

  const handleChangeWholeValue = (id, newValue) => {
    const oldVal = getGlobalConfig(id)
    changeGlobalConfig(id, { ...oldVal, ...newValue })
  }

  return (
    <MenuSetting
      displayMenu={displayMenu}
      handleChangeMenu={handleChangeMenu}
      handleSwitchChange={handleSwitchChange}
      getItemConfig={getGlobalConfig}
      type="global"
      handleChangeWholeValue={handleChangeWholeValue}
    />
  )
}

export default GlobalMenuSetting
