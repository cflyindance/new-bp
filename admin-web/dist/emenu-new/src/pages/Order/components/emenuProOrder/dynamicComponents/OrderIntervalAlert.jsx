import React, { useMemo } from 'react'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useTranslation } from 'react-i18next'
import { makeStyles } from '@material-ui/core'
import useCheckDishBeforeOrder from '@/hooks/useCheckDishBeforeOrder'
import { useEmenuProThemeAdapter } from '../components/EmenuProTheme'
import useCountDown from '@/hooks/useCountDown'
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

const OrderIntervalAlert = ({ config }) => {
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

  const [orders] = useGlobalState('Orders')
  const { needOrderIntervalPermission } = useCheckDishBeforeOrder()
  const intervalPermission = needOrderIntervalPermission(orders)
  const intervalSeconds = useMemo(() => {
    return intervalPermission.leftMin
  }, [intervalPermission])
  const { remainingTime } = useCountDown(intervalSeconds)

  if (!remainingTime) return null

  return (
    <div className={classes.root} style={themeStyles}>
      <img src={imgUrl} alt="icon" className={classes.clockIcon} />
      {t('ShoppingCart.order_again', { value: remainingTime })}
    </div>
  )
}

export default React.memo(OrderIntervalAlert)
