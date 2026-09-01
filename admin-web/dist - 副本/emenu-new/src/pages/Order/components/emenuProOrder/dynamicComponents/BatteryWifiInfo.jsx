import React from 'react'
import BatteryWifi from '@/components/BatteryWifi'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'

const BatteryWifiInfo = ({ config }) => {
  const { style } = config
  const themeStyles = useEmenuProThemeAdapter(style, {
    include: ['top', 'left', 'zIndex'],
  })

  return (
    <div style={{ ...themeStyles, position: 'absolute' }}>
      <BatteryWifi />
    </div>
  )
}

export default React.memo(BatteryWifiInfo)
