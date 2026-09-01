import { useMemo } from 'react'
import { Space, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import MenuSetting from '@/components/ConfigCommon/MenuSetting'
import OrderSetting from '@/components/ConfigCommon/OrderSetting'
import useSystemConfig from '@/hooks/useSystemConfig'
import { allOrderSetting } from '@/constants/limitConfig'
import { deviceAuthorizationSettingMap } from '@/constants/systemConfig'
import styles from './DeviceContent.module.less'
import { useBoolean } from 'ahooks'
import { getTableName } from '@/utils'
import DELETESVG from '@/assets/image/delete.svg'
import { useDispatch } from 'react-redux'
import { effects } from '@/store/slices/systemConfig.slice'
import BindingSetting from '@/pages/DeviceSetting/components/BindingSetting'
import AuthorizationSetting from '@/pages/GlobalSetting/components/AuthorizationSetting'

const useStyles = makeStyles((theme) => ({
  addNoteBtn: ({ type }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    height: 51,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: '19px',
    letterSpacing: -0.4,
    borderRadius: 0,
    backgroundColor: type === 'cart' ? '#F9F9FA' : 'none',
  }),
  paper: {
    width: 500,
    height: 250,
    backgroundColor: '#F4F4F5',
  },
  title: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing(4),
    '& > .MuiTypography-root': {
      display: 'flex',
      alignItems: 'center',
      lineHeight: 1.2,
      letterSpacing: -0.4,
    },
  },
  optionNote: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: theme.spacing(2, 3, 3),
  },
  submit: {
    borderRadius: 0,
    width: 180,
    height: 44,
    fontWeight: 500,
    fontSize: 20,
    lineHeight: 1.2,
    background: '#96272F',
  },
  cancel: {
    borderRadius: 0,
    width: 180,
    height: 44,
    fontWeight: 500,
    fontSize: 20,
    lineHeight: 1.2,
    background: '#fff',
    border: '1px solid #96272F',
    color: '#96272F',
  },
}))

const { Title } = Typography

const DeviceContent = (props) => {
  const classes = useStyles({ type: 'cart' })
  const { t } = useTranslation()
  const { selectedDevice, handleSave, setSelectedDevice } = props
  const dispatch = useDispatch()
  const { changeDeviceConfig, getDeviceConfig, deviceInfo, configList } =
    useSystemConfig(selectedDevice)
  const [open, { setTrue, setFalse }] = useBoolean()

  const showMenus = useMemo(() => {
    return getDeviceConfig(9)
  }, [deviceInfo])

  const handleChangeMenu = (newValue) => {
    changeDeviceConfig(selectedDevice, 9, newValue)
  }

  const handleChangeDeviceConfig = (configId, newValue) => {
    changeDeviceConfig(selectedDevice, configId, newValue)
  }

  const handleSwitchChange = (id, newValue) => {
    const oldVal = getDeviceConfig(id)
    handleChangeDeviceConfig(id, { ...oldVal, open: newValue })
  }

  const handlerDelete = () => {
    setTrue()
  }

  const handleClose = () => {
    setFalse()
  }

  const handleSubmit = async () => {
    setFalse()
    await dispatch(effects.deleteDevice(deviceInfo))
    setSelectedDevice('')
  }

  const screenResolution = useMemo(() => {
    if (deviceInfo) {
      const { innerWidth, innerHeight, devicePixelRatio } = deviceInfo
      if (innerWidth && innerHeight && devicePixelRatio) {
        const width = Math.round((innerWidth * devicePixelRatio) / 10) * 10
        const height = Math.round((innerHeight * devicePixelRatio) / 10) * 10
        return `${width}x${height}`
      }
    }
    return ''
  }, [deviceInfo])

  const deviceDetailItems = useMemo(() => {
    const items = [
      {
        label: t('SystemSetting.deviceTable'),
        value: getTableName(deviceInfo?.tableName),
      },
      {
        label: 'License',
        value: deviceInfo?.deviceLicense,
      },
      {
        label: t('SystemSetting.webviewVersion'),
        value: deviceInfo?.webviewVersion,
      },
      {
        label: t('SystemSetting.systemVersion'),
        value: deviceInfo?.systemVersion,
      },
      {
        label: t('SystemSetting.appVersion'),
        value: deviceInfo?.appVersion,
      },
      {
        label: t('SystemSetting.screen_resolution'),
        value: screenResolution,
      },
      {
        label: t('SystemSetting.timeZone'),
        value:
          deviceInfo?.timeZoneName && deviceInfo?.timeZoneUTCOffset
            ? `${deviceInfo?.timeZoneUTCOffset} (${deviceInfo?.timeZoneName})`
            : '',
      },
    ]

    return items
  }, [deviceInfo, screenResolution, t])

  return (
    <>
      <header className={styles.deviceHeader}>
        <div className={styles.deviceHeaderInfo}>
          <div className={styles.headerItem}>
            {t('SystemSetting.deviceName')}： {deviceInfo?.deviceName}
          </div>
          <div className={styles.headerItem}>
            {t('SystemSetting.deviceId')}： {deviceInfo?.deviceId}
          </div>
        </div>
        <img
          className={styles.headerItemDelete}
          onClick={handlerDelete}
          src={DELETESVG}
        />
      </header>
      <main className={styles.deviceConfig}>
        <Space direction="vertical" size={24}>
          <div className={styles.deviceConfigItem}>
            <Title level={3}>设备信息</Title>
            <div className={styles.deviceInfoGrid}>
              {deviceDetailItems.map((item) => (
                <div className={styles.deviceInfoItem} key={item.label}>
                  <span className={styles.deviceInfoLabel}>{item.label}：</span>
                  <span>{item.value || '--'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.deviceConfigItem}>
            <Title level={3}>{t('AdminSetting.setting_device_binding')}</Title>
            <BindingSetting
              deviceInfo={deviceInfo}
              getDeviceConfig={getDeviceConfig}
              handleChangeDeviceConfig={handleChangeDeviceConfig}
              handleSave={handleSave}
              deviceConfig={configList?.deviceConfig}
            />
          </div>
          <div className={styles.deviceConfigItem}>
            <Title level={3}>{t('AdminSetting.setting_menu_display')}</Title>
            <MenuSetting
              displayMenu={showMenus}
              handleChangeMenu={handleChangeMenu}
              handleSwitchChange={handleSwitchChange}
              getItemConfig={getDeviceConfig}
              type="device"
            />
          </div>
          <div className={styles.deviceConfigItem}>
            <Title level={3}>{t('AdminSetting.setting_order_limit')}</Title>
            <OrderSetting
              limitConfig={deviceInfo?.configInfo}
              handleSetConfig={handleChangeDeviceConfig}
              orderSList={allOrderSetting.filter((each) =>
                ['duration', 'times', 'quantity'].includes(each)
              )}
            />
          </div>
          <div className={styles.deviceConfigItem}>
            <Title level={3}>{t('SystemSetting.authorization')}</Title>
            <AuthorizationSetting
              data={deviceAuthorizationSettingMap}
              getConfigById={getDeviceConfig}
              onConfigChange={handleChangeDeviceConfig}
            />
          </div>
        </Space>
      </main>
      <Dialog
        classes={{
          paper: classes.paper,
        }}
        onClose={handleClose}
        open={open}
      >
        <DialogTitle className={classes.title}>
          <Box component="strong" marginLeft={1}>
            {t('SystemSetting.delete_device_title')}
          </Box>
        </DialogTitle>
        <DialogContent className={classes.optionNote}>
          {t('SystemSetting.delete_device_content')}
        </DialogContent>
        <DialogActions className={classes.actions}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            className={classes.submit}
            onClick={handleSubmit}
          >
            {t('SystemSetting.delete_device_submit')}
          </Button>
          <Button
            variant="contained"
            size="large"
            className={classes.cancel}
            onClick={handleClose}
          >
            {t('SystemSetting.delete_device_cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DeviceContent
