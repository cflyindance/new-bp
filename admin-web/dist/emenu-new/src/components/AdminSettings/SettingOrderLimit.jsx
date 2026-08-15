import { memo, useEffect, useMemo } from 'react'
import { Box, Button, Card, CardContent, makeStyles } from '@material-ui/core'
import { CardHead } from './CardHead'
import { ExpandMoreRounded } from '@material-ui/icons'
import { Select, Switch } from 'antd'
import { useTranslation } from 'react-i18next'
import { isEqual } from 'lodash-es'
import { useSetState } from 'ahooks'
import { getLimitConfigMap } from '@/constants/limitConfig'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useDispatch } from 'react-redux'
import { effects } from '@/store/slices/systemConfig.slice'
import { useNavigate } from 'react-router-dom'

const useStyles = makeStyles((theme) => ({
  main: {
    gridArea: 'main',
    overflowY: 'auto',
    backgroundColor: '#EDEFF2',
  },
  footer: {
    gridArea: 'footer',
    textAlign: 'right',
    padding: theme.spacing(3, 5),
  },
  card: {
    marginBottom: theme.spacing(3),
    overflow: 'visible',
  },
  content: {
    display: 'flex',
    padding: theme.spacing(0, 3),
  },
  selector: {
    width: 200,
    fontSize: 16,
  },
  btnClear: {
    marginRight: theme.spacing(3),
  },
  btnCommon: {
    flex: 1,
    height: 51,
    fontWeight: 600,
    borderRadius: 5,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
    '&:not(:first-child)': {
      marginLeft: theme.spacing(2),
    },
  },
}))

function SettingOrderLimit({ handleClose }) {
  const classes = useStyles()
  const { t } = useTranslation()
  const {
    duration: durationOptions,
    times: timesOptions,
    quantity: quantityOptions,
  } = getLimitConfigMap(t)
  const dispatch = useDispatch()
  const { changeDeviceConfig, getDeviceConfig, deviceInfo } = useSystemConfig()
  const navigate = useNavigate()

  const originalDuration = useMemo(() => getDeviceConfig(5), [deviceInfo])
  const originalTimes = useMemo(() => getDeviceConfig(6), [deviceInfo])
  const originalQuantity = useMemo(() => getDeviceConfig(7), [deviceInfo])

  const [duration, setDuration] = useSetState({})
  const [times, setTimes] = useSetState({})
  const [quantity, setQuantity] = useSetState({})

  useEffect(() => {
    if (originalDuration) {
      setDuration(originalDuration)
    }
  }, [originalDuration])

  useEffect(() => {
    if (originalTimes) {
      setTimes(originalTimes)
    }
  }, [originalTimes])

  useEffect(() => {
    if (originalQuantity) {
      setQuantity(originalQuantity)
    }
  }, [originalQuantity])

  const notChanged = useMemo(
    () =>
      isEqual(duration, originalDuration) &&
      isEqual(times, originalTimes) &&
      isEqual(quantity, originalQuantity),
    [
      duration,
      originalDuration,
      times,
      originalTimes,
      quantity,
      originalQuantity,
    ]
  )

  const handleReset = () => {
    setDuration(originalDuration)
    setTimes(originalTimes)
    setQuantity(originalQuantity)
  }

  const handleSave = async () => {
    const { deviceUuId } = window
    changeDeviceConfig(deviceUuId, 5, duration)
    changeDeviceConfig(deviceUuId, 6, times)
    changeDeviceConfig(deviceUuId, 7, quantity)
    await dispatch(effects.setConfig())
    handleClose?.()
    navigate('/')
  }

  const limitCard = (classes, t, typeName, limit, setLimit, options) => (
    <Card className={classes.card} elevation={0}>
      <CardHead
        title={t(`SettingOrderLimit.limit_${typeName}_title`)}
        subheader={t(`SettingOrderLimit.limit_${typeName}_subtitle`)}
        action={
          <Switch
            checked={limit.open}
            onChange={(v) => {
              const updateInfo = { open: v }
              if (typeName === 'times' && !v) {
                updateInfo.times = originalTimes.times
              }
              setLimit({ ...limit, ...updateInfo })
            }}
          />
        }
      />
      <CardContent className={classes.content} hidden={!limit.open}>
        <Select
          size="large"
          suffixIcon={<ExpandMoreRounded />}
          className={classes.selector}
          getPopupContainer={(node) => node.parentNode}
          placeholder={t('SettingOrderLimit.placeholder')}
          options={options}
          value={limit[typeName]}
          onChange={(v) => setLimit({ ...limit, [typeName]: v })}
        />
      </CardContent>
    </Card>
  )

  return (
    <>
      <Box component="main" className={classes.main}>
        <Box padding={4}>
          {limitCard(
            classes,
            t,
            'duration',
            duration,
            setDuration,
            durationOptions
          )}
          {limitCard(classes, t, 'times', times, setTimes, timesOptions)}
          {limitCard(
            classes,
            t,
            'quantity',
            quantity,
            setQuantity,
            quantityOptions
          )}
        </Box>
      </Box>
      <Box component="footer" className={classes.footer}>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          className={`${classes.btnCommon} ${classes.btnClear}`}
          disabled={notChanged}
          onClick={handleReset}
        >
          {t('AdminSetting.btn_discard')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="large"
          className={classes.btnCommon}
          disabled={notChanged}
          onClick={handleSave}
        >
          {t('AdminSetting.btn_save')}
        </Button>
      </Box>
    </>
  )
}

export default memo(SettingOrderLimit)
