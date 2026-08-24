import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, makeStyles, Typography } from '@material-ui/core'
import { CardHead } from './CardHead'
import { ExpandMoreRounded } from '@material-ui/icons'
import { Select, Slider, Switch } from 'antd'
import message from '@/components/Message'
import { isEqual } from 'lodash-es'
import { useTranslation } from 'react-i18next'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useDispatch } from 'react-redux'
import { effects } from '@/store/slices/systemConfig.slice'
import useSystemConfig from '@/hooks/useSystemConfig'
import { META_ITEM_GROUP } from '@/constants'
import {
  DEFAULT_EMENU_DISPLAY_CONFIG,
  EMENU_DISPLAY_CONFIG_ID,
  normalizeEmenuDisplayConfig,
} from '@/utils/emenuViewportLayout'

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
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#333',
    margin: theme.spacing(3, 0),
  },
  displayCard: {
    marginBottom: theme.spacing(2),
  },
  displayFields: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: theme.spacing(2, 3),
    padding: theme.spacing(2, 3, 3),
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
    },
  },
  fieldLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#333',
    fontSize: 14,
  },
  selector: {
    width: '100%',
    '&> .ant-select-selector': {
      padding: theme.spacing(1, 2),
    },
  },
  option: {
    padding: theme.spacing(2, 3),
    fontSize: 16,
  },
  btnClear: {
    // backgroundColor: '#fff',
    // border: '2px solid #e0e0e0',
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

function SettingMenuDisplay({ handleClose }) {
  const classes = useStyles()
  const dispatch = useDispatch()
  const { menuSource } = useSetMenus()
  const [selected, setSelected] = useState([])
  const [displayMode, setDisplayMode] = useState(false)
  const [displayConfig, setDisplayConfig] = useState(
    DEFAULT_EMENU_DISPLAY_CONFIG
  )
  const {
    changeDeviceConfig,
    changeGlobalConfig,
    getDeviceConfig,
    getGlobalConfig,
    deviceInfo,
  } = useSystemConfig()
  const showMenus = useMemo(() => {
    return getDeviceConfig(9)
  }, [deviceInfo])

  const deviceDisplayMode = useMemo(() => {
    return getDeviceConfig(10)?.open
  }, [deviceInfo])

  const storedDisplayConfig = useMemo(
    () => normalizeEmenuDisplayConfig(getGlobalConfig(EMENU_DISPLAY_CONFIG_ID)),
    [getGlobalConfig]
  )

  const { t } = useTranslation(['translation', 'group'])
  const navigate = useNavigate()

  const original = useMemo(
    () => menuSource?.filter((g) => !g.hidden)?.map((g) => g.id),
    [menuSource]
  )

  useEffect(() => {
    if (showMenus?.length === 0) {
      setSelected(original)
      return
    }
    setSelected(showMenus)
  }, [original, showMenus])

  useEffect(() => {
    setDisplayMode(deviceDisplayMode)
  }, [deviceDisplayMode])

  useEffect(() => {
    setDisplayConfig(storedDisplayConfig)
  }, [storedDisplayConfig])

  const options = useMemo(
    () => [
      {
        label: t('SettingMenuDisplay.all'),
        value: 'all',
        className: classes.option,
      },
      ...(menuSource
        ?.filter(
          (each) =>
            each.name !== 'ALL_YOU_CAN_EAT' && each.name !== META_ITEM_GROUP
        )
        ?.map((g) => ({
          label: t(g.id, { ns: 'group' }),
          value: g.id,
          className: classes.option,
        })) || []),
    ],
    [menuSource, classes, t]
  )

  const isMenuSame = useMemo(() => {
    if (showMenus?.length === 0) {
      return isEqual(selected, original)
    }
    return isEqual(selected, showMenus)
  }, [selected, original, showMenus])

  const notChanged = useMemo(
    () =>
      isMenuSame &&
      displayMode === deviceDisplayMode &&
      isEqual(displayConfig, storedDisplayConfig),
    [
      selected,
      original,
      displayMode,
      deviceDisplayMode,
      displayConfig,
      storedDisplayConfig,
    ]
  )

  const handleChange = (val) => {
    const newMenus = val?.includes('all')
      ? menuSource
          ?.filter(
            (each) =>
              each.name !== 'ALL_YOU_CAN_EAT' && each.name !== META_ITEM_GROUP
          )
          ?.map((g) => g.id)
      : val
    if (newMenus?.length === 0) {
      return message.warn('至少展示一个菜单组')
    }
    setSelected(newMenus)
  }

  const handleReset = () => {
    setSelected(showMenus?.length === 0 ? original : showMenus)
    setDisplayMode(deviceDisplayMode)
    setDisplayConfig(storedDisplayConfig)
  }

  const handleSave = async () => {
    const { deviceUuId } = window
    changeDeviceConfig(deviceUuId, 9, selected)
    changeDeviceConfig(deviceUuId, 10, { open: displayMode })
    changeGlobalConfig(EMENU_DISPLAY_CONFIG_ID, displayConfig)
    const res = await dispatch(effects.setConfig())
    if (res) {
      handleClose()
      navigate('/')
    }
  }

  return (
    <>
      <Box component="main" className={classes.main}>
        <Box padding={4} paddingTop={0} minHeight={450}>
          <Typography variant="h6" className={classes.title}>
            {t('SettingMenuDisplay.title')}
          </Typography>
          <Select
            mode="multiple"
            size="large"
            // defaultOpen
            showArrow
            showSearch={false}
            listHeight={300}
            className={classes.selector}
            suffixIcon={<ExpandMoreRounded />}
            dropdownStyle={{ padding: 0 }}
            getPopupContainer={(node) => node.parentNode}
            placeholder={t('SettingMenuDisplay.placeholder')}
            options={options}
            value={selected}
            onChange={handleChange}
          />

          <Typography variant="h6" className={classes.title}>
            {t('SettingMenuDisplay.display_heading')}
          </Typography>
          <Card className={classes.card} elevation={0}>
            <CardHead
              title={t(`SettingMenuDisplay.display_title`)}
              action={
                <Switch checked={displayMode} onChange={setDisplayMode} />
              }
            />
          </Card>

          <Typography variant="h6" className={classes.title}>
            {t('SettingMenuDisplay.guest_display_heading')}
          </Typography>
          <Card className={classes.displayCard} elevation={0}>
            <CardHead
              title={t('SettingMenuDisplay.guest_display_title')}
              subheader={t('SettingMenuDisplay.guest_display_subtitle')}
              action={
                <Switch
                  checked={displayConfig.allowGuestResize}
                  onChange={(checked) =>
                    setDisplayConfig((current) => ({
                      ...current,
                      allowGuestResize: checked,
                    }))
                  }
                />
              }
            />
            <Box className={classes.displayFields}>
              <Box>
                <Typography className={classes.fieldLabel}>
                  <span>{t('SettingMenuDisplay.default_scale')}</span>
                  <span>{Math.round(displayConfig.scale * 100)}%</span>
                </Typography>
                <Slider
                  min={75}
                  max={140}
                  step={5}
                  value={Math.round(displayConfig.scale * 100)}
                  onChange={(value) =>
                    setDisplayConfig((current) => ({
                      ...current,
                      scale: value / 100,
                    }))
                  }
                />
              </Box>
              <Box>
                <Typography className={classes.fieldLabel}>
                  <span>{t('SettingMenuDisplay.default_width')}</span>
                  <span>{Math.round(displayConfig.widthRatio * 100)}%</span>
                </Typography>
                <Slider
                  min={60}
                  max={100}
                  step={5}
                  value={Math.round(displayConfig.widthRatio * 100)}
                  onChange={(value) =>
                    setDisplayConfig((current) => ({
                      ...current,
                      widthRatio: value / 100,
                    }))
                  }
                />
              </Box>
              <Box>
                <Typography className={classes.fieldLabel}>
                  <span>{t('SettingMenuDisplay.default_height')}</span>
                  <span>{Math.round(displayConfig.heightRatio * 100)}%</span>
                </Typography>
                <Slider
                  min={55}
                  max={100}
                  step={5}
                  value={Math.round(displayConfig.heightRatio * 100)}
                  onChange={(value) =>
                    setDisplayConfig((current) => ({
                      ...current,
                      heightRatio: value / 100,
                    }))
                  }
                />
              </Box>
              <Box>
                <Typography className={classes.fieldLabel}>
                  {t('SettingMenuDisplay.density')}
                </Typography>
                <Select
                  className={classes.selector}
                  value={displayConfig.density}
                  onChange={(density) =>
                    setDisplayConfig((current) => ({ ...current, density }))
                  }
                  options={['compact', 'standard', 'comfortable'].map(
                    (value) => ({
                      value,
                      label: t(`SettingMenuDisplay.density_${value}`),
                    })
                  )}
                />
              </Box>
            </Box>
            <CardHead
              title={t('SettingMenuDisplay.pinch_zoom')}
              action={
                <Switch
                  disabled={!displayConfig.allowGuestResize}
                  checked={displayConfig.allowPinchZoom}
                  onChange={(checked) =>
                    setDisplayConfig((current) => ({
                      ...current,
                      allowPinchZoom: checked,
                    }))
                  }
                />
              }
            />
            <CardHead
              title={t('SettingMenuDisplay.drag_resize')}
              action={
                <Switch
                  disabled={!displayConfig.allowGuestResize}
                  checked={displayConfig.allowDragResize}
                  onChange={(checked) =>
                    setDisplayConfig((current) => ({
                      ...current,
                      allowDragResize: checked,
                    }))
                  }
                />
              }
            />
          </Card>
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

export default memo(SettingMenuDisplay)
