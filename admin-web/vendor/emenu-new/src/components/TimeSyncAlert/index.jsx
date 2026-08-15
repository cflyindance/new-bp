import { Dialog, IconButton } from '@material-ui/core'
import { Trans, useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import styles from './index.module.less'
import LanguageChange from '../LanguageChange'
import TRANSLATE from '@/assets/image/translate.png'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const TimeSyncAlert = (props) => {
  const { t } = useTranslation()
  const {
    localTime: originalLocalTime,
    localTimeZoneOffset,
    localTimeZoneName,
    serverTime: originalServerTime,
    serverTimeOffset,
    serverIp,
  } = props

  const [localTime, setLocalTime] = useState('')
  const [serverTime, setServerTime] = useState('')

  useEffect(() => {
    const baseLocalTime = dayjs(originalLocalTime)
    const baseServerTime = dayjs(originalServerTime)

    const updateCurrentTime = () => {
      const elapsedSeconds = dayjs().diff(baseLocalTime, 'second')
      setLocalTime(
        baseLocalTime
          .add(elapsedSeconds, 'second')
          .format('YYYY-MM-DD HH:mm:ss')
      )
      setServerTime(
        baseServerTime
          .add(elapsedSeconds, 'second')
          .format('YYYY-MM-DD HH:mm:ss')
      )
    }

    updateCurrentTime()
    const timer = setInterval(updateCurrentTime, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [originalLocalTime, originalServerTime])

  return (
    <Dialog open={true}>
      <div className={styles.alertWrapper}>
        <LanguageChange
          renderButton={({ onClick }) => {
            return (
              <IconButton onClick={onClick} className={styles.alertLanguage}>
                <img
                  style={{
                    width: 24,
                    height: 24,
                  }}
                  src={TRANSLATE}
                  alt="language"
                />
              </IconButton>
            )
          }}
        />
        <div className={styles.alertTitle}>{t('timeSyncAlert.title')}</div>
        <div className={styles.alertMsg}>
          <Trans
            i18nKey="timeSyncAlert.steps"
            values={{
              localTimeZone: `${localTimeZoneOffset} (${localTimeZoneName})`,
              localTime: localTime,
              serverIp: serverIp,
              serverTimeZone: serverTimeOffset,
              serverTime: serverTime,
            }}
          />
        </div>
      </div>
    </Dialog>
  )
}

export default TimeSyncAlert
