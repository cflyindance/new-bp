import { useCallback, useEffect, useMemo, useState } from 'react'
import { makeStyles } from '@material-ui/core'
import { sendPosLog } from '@/services/setting'

const WIFI_NONE_IMG = `${import.meta.env.BASE_URL}assets/wifi_none.png`
const WIFI_0_50_IMG = `${import.meta.env.BASE_URL}assets/wifi_0_50.png`
const WIFI_50_150_IMG = `${import.meta.env.BASE_URL}assets/wifi_50_150.png`
const WIFI_150_300_IMG = `${import.meta.env.BASE_URL}assets/wifi_150_300.png`
const WIFI_300_IMG = `${import.meta.env.BASE_URL}assets/wifi_300.png`
const BATTERY_0_1_IMG = `${import.meta.env.BASE_URL}assets/battery_0_1.png`
const BATTERY_1_5_IMG = `${import.meta.env.BASE_URL}assets/battery_1_5.png`
const BATTERY_5_10_IMG = `${import.meta.env.BASE_URL}assets/battery_5_10.png`
const BATTERY_10_20_IMG = `${import.meta.env.BASE_URL}assets/battery_10_20.png`
const BATTERY_20_30_IMG = `${import.meta.env.BASE_URL}assets/battery_20_30.png`
const BATTERY_30_40_IMG = `${import.meta.env.BASE_URL}assets/battery_30_40.png`
const BATTERY_40_50_IMG = `${import.meta.env.BASE_URL}assets/battery_40_50.png`
const BATTERY_50_60_IMG = `${import.meta.env.BASE_URL}assets/battery_50_60.png`
const BATTERY_60_70_IMG = `${import.meta.env.BASE_URL}assets/battery_60_70.png`
const BATTERY_70_80_IMG = `${import.meta.env.BASE_URL}assets/battery_70_80.png`
const BATTERY_80_90_IMG = `${import.meta.env.BASE_URL}assets/battery_80_90.png`
const BATTERY_90_100_IMG = `${import.meta.env.BASE_URL}assets/battery_90_100.png`
const BATTERY_100_IMG = `${import.meta.env.BASE_URL}assets/battery_100.png`
const BATTERY_NONE_IMG = `${import.meta.env.BASE_URL}assets/battery_none.png`

let networkInfo = undefined
// 网络状态标记：true 表示当前网络异常
let isNetworkPoor = false

window.androidWebkit = Object.assign(window.androidWebkit || {}, {
  handleCheckNetworkSpeed: (info) => {
    networkInfo = info
    const isPoor =
      typeof info?.rtt === 'number' && (info.rtt >= 300 || info.rtt < 0)

    if (isPoor && !isNetworkPoor) {
      // 首次从正常变为异常，发送日志
      sendPosLog(`network connection is unstable, Rtt: ${info.rtt}`)
      isNetworkPoor = true
    } else if (!isPoor && isNetworkPoor) {
      // 网络恢复正常，重置状态
      isNetworkPoor = false
      sendPosLog(`network connection restored, Rtt: ${info.rtt}`)
    }
    // 异常持续期间，不发送日志

    window.dispatchEvent(new CustomEvent('networkInfo', { detail: info }))
  },
})

let batteryInfo = undefined
if (window.WebViewJavascriptBridge) {
  // 电池信息, 主动请求
  window.WebViewJavascriptBridge.callHandler(
    'getBatteryState',
    {},
    function (res) {
      if (res.code > 0 && res.message === 'Success') {
        batteryInfo = res.body
        window.dispatchEvent(
          new CustomEvent('batteryInfo', { detail: res.body })
        )
      }
    }
  )

  // 电池信息, 壳子推送
  window.WebViewJavascriptBridge.registerHandler(
    'batteryStateChanged',
    function (res) {
      batteryInfo = res
      window.dispatchEvent(new CustomEvent('batteryInfo', { detail: res }))
    }
  )
}

const useStyles = makeStyles(() => ({
  container: {
    height: 40,
    borderRadius: 50,
    border: '1px solid #ffffff',
    fontSize: 12,
    lineHeight: '14px',
    padding: '4px 8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    color: '#ffffff',
  },
  wifi: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wifi_img: {
    width: 14,
    height: 14,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
  },
  wifi_text: {
    width: 44,
    textAlign: 'right',
  },
  battery: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  battery_img: {
    width: 14,
    height: 14,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
  },
  battery_text: {
    width: 44,
    textAlign: 'right',
  },
}))

const BatteryWifi = () => {
  const classes = useStyles()

  const [networkRtt, setNetworkRtt] = useState(networkInfo?.rtt)
  const [batteryLevel, setBatteryLevel] = useState(batteryInfo?.level)

  const onNetworkSpeed = useCallback((e) => {
    setNetworkRtt(e.detail?.rtt)
  }, [])

  const onBatteryState = useCallback((e) => {
    setBatteryLevel(e.detail?.level)
  }, [])

  useEffect(() => {
    window.addEventListener('networkInfo', onNetworkSpeed)

    return () => {
      window.removeEventListener('networkInfo', onNetworkSpeed)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('batteryInfo', onBatteryState)

    return () => {
      window.removeEventListener('batteryInfo', onBatteryState)
    }
  }, [])

  const wifiImg = useMemo(() => {
    if (networkRtt >= 0 && networkRtt < 50) {
      return WIFI_0_50_IMG
    } else if (networkRtt >= 50 && networkRtt < 150) {
      return WIFI_50_150_IMG
    } else if (networkRtt >= 150 && networkRtt < 300) {
      return WIFI_150_300_IMG
    } else if (networkRtt >= 300) {
      return WIFI_300_IMG
    } else {
      if (typeof networkRtt === 'number') {
        return WIFI_NONE_IMG
      }
      return WIFI_0_50_IMG
    }
  }, [networkRtt])

  const rttText = useMemo(() => {
    if (typeof networkRtt === 'number') {
      if (networkRtt > 999 || networkRtt < 0) {
        return '999+'
      }
      return networkRtt
    }
    return '--'
  }, [networkRtt])

  const batteryImg = useMemo(() => {
    if (batteryLevel >= 0 && batteryLevel < 1) {
      return BATTERY_0_1_IMG
    } else if (batteryLevel >= 1 && batteryLevel < 5) {
      return BATTERY_1_5_IMG
    } else if (batteryLevel >= 5 && batteryLevel < 10) {
      return BATTERY_5_10_IMG
    } else if (batteryLevel >= 10 && batteryLevel < 20) {
      return BATTERY_10_20_IMG
    } else if (batteryLevel >= 20 && batteryLevel < 30) {
      return BATTERY_20_30_IMG
    } else if (batteryLevel >= 30 && batteryLevel < 40) {
      return BATTERY_30_40_IMG
    } else if (batteryLevel >= 40 && batteryLevel < 50) {
      return BATTERY_40_50_IMG
    } else if (batteryLevel >= 50 && batteryLevel < 60) {
      return BATTERY_50_60_IMG
    } else if (batteryLevel >= 60 && batteryLevel < 70) {
      return BATTERY_60_70_IMG
    } else if (batteryLevel >= 70 && batteryLevel < 80) {
      return BATTERY_70_80_IMG
    } else if (batteryLevel >= 80 && batteryLevel < 90) {
      return BATTERY_80_90_IMG
    } else if (batteryLevel >= 90 && batteryLevel < 100) {
      return BATTERY_90_100_IMG
    } else if (batteryLevel === 100) {
      return BATTERY_100_IMG
    }
    return BATTERY_NONE_IMG
  }, [batteryLevel])

  const batteryLevelText = useMemo(() => {
    if (typeof batteryLevel === 'number') {
      return batteryLevel
    }
    return '--'
  }, [batteryLevel])

  return (
    <div className={classes.container}>
      <div className={classes.battery}>
        <div
          className={classes.battery_img}
          style={{ backgroundImage: `url(${batteryImg})` }}
        />
        <span className={classes.battery_text}>{batteryLevelText}%</span>
      </div>
      <div className={classes.wifi}>
        <div
          className={classes.wifi_img}
          style={{ backgroundImage: `url(${wifiImg})` }}
        />
        <span className={classes.wifi_text}>{rttText}ms</span>
      </div>
    </div>
  )
}

export default BatteryWifi
