import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, makeStyles, Typography } from '@material-ui/core'
import { CardHead } from './CardHead'
import { ExpandMoreRounded } from '@material-ui/icons'
import { Select, Switch } from 'antd'
import message from '@/components/Message'
import { isEqual } from 'lodash-es'
import { useTranslation } from 'react-i18next'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useDispatch } from 'react-redux'
import { effects } from '@/store/slices/systemConfig.slice'
import useSystemConfig from '@/hooks/useSystemConfig'
import { META_ITEM_GROUP } from '@/constants'

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
  const { changeDeviceConfig, getDeviceConfig, deviceInfo } = useSystemConfig()
  const showMenus = useMemo(() => {
    return getDeviceConfig(9)
  }, [deviceInfo])

  const deviceDisplayMode = useMemo(() => {
    return getDeviceConfig(10)?.open
  }, [deviceInfo])

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
    () => isMenuSame && displayMode === deviceDisplayMode,
    [selected, original, displayMode, deviceDisplayMode]
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
  }

  const handleSave = async () => {
    const { deviceUuId } = window
    changeDeviceConfig(deviceUuId, 9, selected)
    changeDeviceConfig(deviceUuId, 10, { open: displayMode })
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
