import styles from './DeviceList.module.less'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { getTableName } from '@/utils'

const DeviceList = (props) => {
  const { t } = useTranslation()
  const { selectedDevice, setSelectedDevice, deviceList } = props

  const getScreenResolution = (deviceInfo) => {
    if (deviceInfo) {
      const { innerWidth, innerHeight, devicePixelRatio } = deviceInfo
      if (innerWidth && innerHeight && devicePixelRatio) {
        const width = Math.round((innerWidth * devicePixelRatio) / 10) * 10
        const height = Math.round((innerHeight * devicePixelRatio) / 10) * 10
        return `${width}x${height}`
      }
    }
    return ''
  }

  return (
    <div className={styles.listWrapper}>
      {deviceList?.map((each) => {
        const table = getTableName(each.tableName)
        const screenResolution = getScreenResolution(each)
        return (
          <div
            className={classNames(
              styles.deviceItem,
              selectedDevice === each.deviceId && styles.currentDevice
            )}
            key={each.deviceId}
            onClick={() => setSelectedDevice(each.deviceId)}
          >
            <div>
              {t('SystemSetting.deviceTable')}: {table || '--'}
            </div>
            <div>License: {each.deviceLicense || '--'}</div>
            <div>
              {t('SystemSetting.deviceName')}: {each.deviceName || '--'}
            </div>
            <div>
              {t('SystemSetting.screen_resolution')}: {screenResolution || '--'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DeviceList
