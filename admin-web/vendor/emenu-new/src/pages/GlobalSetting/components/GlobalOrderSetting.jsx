import { useMemo } from 'react'
import OrderSetting from '@/components/ConfigCommon/OrderSetting'
import useSystemConfig from '@/hooks/useSystemConfig'
import { allOrderSetting } from '@/constants/limitConfig'

const GlobalOrderSetting = () => {
  const { changeGlobalConfig, configList } = useSystemConfig()

  const limitConfig = useMemo(() => {
    return configList?.globalConfig
  }, [configList])

  return (
    <OrderSetting
      limitConfig={limitConfig}
      handleSetConfig={changeGlobalConfig}
      orderSList={allOrderSetting}
    />
  )
}

export default GlobalOrderSetting
