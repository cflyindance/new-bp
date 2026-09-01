import {
  Card,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CardContent,
} from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import { InputNumber, Switch } from 'antd'
import { useBoolean, useMount } from 'ahooks'
import styles from './UserSetting.module.less'
import { useCallback, useMemo, useState } from 'react'
import useSystemConfig from '@/hooks/useSystemConfig'
// import { useTranslation } from 'react-i18next'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation, Trans } from 'react-i18next'
import {
  authBeforeOrder,
  callServerTimeInterval,
  customDishOrderMessages,
  restrictNewOrder,
  switchTableBeforeStartOrder,
} from '@/constants/systemConfig'
import CustomDishOrderMessagesConfig from '@/components/ConfigCommon/CustomDishOrderMessagesConfig'
import { useSetMenus } from '@/hooks/useSetMenus'

const useStyles = makeStyles((theme) => ({
  paper: {
    width: 500,
    // height: 200,
    backgroundColor: '#F4F4F5',
  },
  title: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // paddingTop: theme.spacing(4),
    '& > .MuiTypography-root': {
      display: 'flex',
      alignItems: 'center',
      lineHeight: 1.2,
      letterSpacing: -0.4,
    },
  },
  optionNote: {
    width: '100%',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(2, 3, 3),
  },
  cancel: {
    width: 100,
    borderRadius: 20,
    height: 44,
    fontWeight: 500,
    fontSize: 20,
    lineHeight: 1.2,
    background: '#fff',
    border: '1px solid #96272F',
    color: '#96272F',
  },
}))

const UserSetting = (props) => {
  const classes = useStyles({ type: 'cart' })
  const { data } = props
  const { t } = useTranslation()
  const { changeGlobalConfig, configList, getGlobalConfig } = useSystemConfig()
  const [open, { setTrue, setFalse }] = useBoolean()
  // const { getFinalConfigById } = useSystemConfig()
  // const isNeedLoginCRM = getFinalConfigById(34)?.open
  // const isCrmNeedAuthLogin = getFinalConfigById(40)?.open
  const [settingItemName, setSettingItemName] = useState('')
  const { treeData, runGetMenus } = useSetMenus()
  useMount(() => {
    runGetMenus()
  })

  const globalConfig = useMemo(() => {
    return configList?.globalConfig
  }, [configList])

  const getConfigValue = useCallback(
    (typeName) => {
      return globalConfig?.find((each) => each.key === typeName)?.value
    },
    [globalConfig]
  )

  const getCardContent = useCallback(
    (key, id) => {
      const config = getGlobalConfig(id)
      if (!config) {
        return null
      }
      if (id === callServerTimeInterval.id) {
        const addonBeforeText = t(`inputSetting.${key}_addBefore`)
        const addonAfterText = t(`inputSetting.${key}_addonAfter`)
        return (
          <CardContent hidden={!config.open}>
            <InputNumber
              value={config[key] || 0}
              onChange={(val) =>
                changeGlobalConfig(id, { ...config, [key]: val })
              }
              min={0}
              addonBefore={addonBeforeText && <span>{addonBeforeText}</span>}
              addonAfter={addonAfterText && <span>{addonAfterText}</span>}
              precision={0}
            />
          </CardContent>
        )
      }
      if (id === customDishOrderMessages.id) {
        return (
          <CardContent hidden={!config.open}>
            <CustomDishOrderMessagesConfig
              valueObj={config}
              handleConfigChange={changeGlobalConfig}
              treeData={treeData}
            />
          </CardContent>
        )
      }
      if (id === authBeforeOrder.id) {
        return (
          <CardContent
            hidden={!config.open}
            className={styles.authBeforeOrderContent}
          >
            <Box className={styles.authBeforeOrderItem}>
              <Box>{t('SystemSetting.authBeforeOrder_categoryMode')}</Box>
              <Switch
                checked={config.categoryMode ?? true}
                onChange={(v) =>
                  changeGlobalConfig(id, { ...config, categoryMode: v })
                }
              />
            </Box>
            <Box className={styles.authBeforeOrderItem}>
              <Box>{t('SystemSetting.authBeforeOrder_menuClassifyMode')}</Box>
              <Switch
                checked={config.menuClassifyMode ?? true}
                onChange={(v) =>
                  changeGlobalConfig(id, { ...config, menuClassifyMode: v })
                }
              />
            </Box>
            <Box className={styles.authBeforeOrderItem}>
              <Box>{t('SystemSetting.authBeforeOrder_defaultMode')}</Box>
              <Switch
                checked={config.defaultMode ?? true}
                onChange={(v) =>
                  changeGlobalConfig(id, { ...config, defaultMode: v })
                }
              />
            </Box>
          </CardContent>
        )
      }
      return null
    },
    [getGlobalConfig]
  )

  const isSwitchTableBeforeStartOrderOpen = getGlobalConfig(
    switchTableBeforeStartOrder.id
  )?.open

  return (
    <div className={styles.userSettingWrapper}>
      {data.map((each) => {
        const { key, id } = each
        return (
          <div className={styles.userSettingItem} key={key}>
            <Card elevation={0}>
              <CardHead
                title={
                  <>
                    {t(`SettingOrderLimit.limit_${key}_title`)}
                    {id === restrictNewOrder.id &&
                      isSwitchTableBeforeStartOrderOpen && (
                        <span className={styles.cardHeader_tip}>
                          {' '}
                          {t('SystemSetting.setting_conflict', {
                            rule: t(
                              'SettingOrderLimit.limit_switchTableBeforeStartOrder_title'
                            ),
                          })}
                        </span>
                      )}
                  </>
                }
                subheader={t(`SettingOrderLimit.limit_${key}_subtitle`)}
                action={
                  <Switch
                    checked={getConfigValue(key)?.open}
                    onChange={(checked) => {
                      if (
                        id === 34 &&
                        getConfigValue('isCrmNeedAuthLogin')?.open
                      ) {
                        setSettingItemName(
                          t(`SettingOrderLimit.limit_isCrmNeedAuthLogin_title`)
                        )
                        setTrue()
                      } else if (
                        id === 40 &&
                        getConfigValue('isNeedLoginCRM')?.open
                      ) {
                        setSettingItemName(
                          t(`SettingOrderLimit.limit_isNeedLoginCRM_title`)
                        )
                        setTrue()
                      } else {
                        const config = getConfigValue(key)
                        changeGlobalConfig(id, {
                          ...config,
                          open: checked,
                        })
                      }
                    }}
                  />
                }
              />
              {getCardContent(key, id)}
            </Card>
          </div>
        )
      })}
      <Dialog
        classes={{
          paper: classes.paper,
        }}
        onClose={() => {
          setFalse()
        }}
        open={open}
      >
        <DialogTitle className={classes.title}>
          <Box component="strong" marginLeft={1}>
            {t('SystemSetting.switch_topic_title')}
          </Box>
        </DialogTitle>
        <DialogContent className={classes.optionNote}>
          <Trans
            i18nKey="SystemSetting.switch_topic_content"
            values={{ settingItemName }}
            components={{ strong: <strong /> }}
          />
        </DialogContent>
        <DialogActions className={classes.actions}>
          <Button
            variant="contained"
            size="large"
            className={classes.cancel}
            onClick={() => {
              setFalse()
            }}
          >
            {t('SystemSetting.switch_topic_btn')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default UserSetting
