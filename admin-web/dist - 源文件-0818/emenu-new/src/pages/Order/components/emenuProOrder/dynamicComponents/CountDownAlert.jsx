import useSystemConfig from '@/hooks/useSystemConfig'
import React, { useMemo } from 'react'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useTranslation } from 'react-i18next'
import { makeStyles } from '@material-ui/core'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import { serverUrl } from '@/utils/env_var'

const CLOCKPNG = `${import.meta.env.BASE_URL}assets/clock.png`

const useStyles = makeStyles(() => ({
  root: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
  },
  clockIcon: {
    width: 15,
    height: 15,
    margin: '0px 4px 0px 0px',
  },
}))

const CountDownAlert = ({ config }) => {
  const { style, props } = config
  const themeStyles = useEmenuProThemeAdapter(style, {
    exclude: ['width', 'height'],
  })
  const classes = useStyles()
  const imgUrl = useMemo(() => {
    const defaultImg = props.defaultImg
    if (defaultImg) {
      const defaultImgArray = defaultImg.split('/')
      const imageName = defaultImgArray[defaultImgArray.length - 1]
      return `${serverUrl}emenuPro/images/${imageName}`
    }
    return CLOCKPNG
  }, [props.defaultImg])

  const { t } = useTranslation()

  const { getFinalConfigById } = useSystemConfig()
  const isShowMealTime = getFinalConfigById(16)?.open
  const isShowMealTimeInverted = getFinalConfigById(16)?.inverted

  const [countTime] = useGlobalState('countTime')
  const [restCountTime] = useGlobalState('restCountTime')

  const orderTimeStr = useMemo(() => {
    if (!isShowMealTime) return ''
    const time = isShowMealTimeInverted ? restCountTime : countTime
    if (typeof time !== 'number') {
      return ''
    }
    return t(
      isShowMealTimeInverted
        ? 'TopBar.order_rest_time'
        : 'TopBar.order_duration_time',
      { minutes: time }
    )
  }, [countTime, restCountTime, isShowMealTimeInverted, t, isShowMealTime])

  if (!orderTimeStr) return null

  return (
    <div className={classes.root} style={themeStyles}>
      <img src={imgUrl} alt="icon" className={classes.clockIcon} />
      {orderTimeStr}
    </div>
  )
}

export default React.memo(CountDownAlert)
