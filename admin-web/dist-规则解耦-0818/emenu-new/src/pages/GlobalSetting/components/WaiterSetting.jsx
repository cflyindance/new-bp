import { Card } from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import { Switch } from 'antd'
import styles from './UserSetting.module.less'
import { useCallback, useMemo } from 'react'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useTranslation } from 'react-i18next'

const UserSetting = (props) => {
  const { data } = props
  const { t } = useTranslation()
  const { changeGlobalConfig, configList } = useSystemConfig()

  const globalConfig = useMemo(() => {
    return configList?.globalConfig
  }, [configList])

  const getConfigValue = useCallback(
    (typeName) => {
      return globalConfig?.find((each) => each.key === typeName)?.value
    },
    [globalConfig]
  )

  return (
    <div className={styles.userSettingWrapper}>
      {data.map((each) => {
        const { key, id } = each
        return (
          <div className={styles.userSettingItem} key={key}>
            <Card elevation={0}>
              <CardHead
                title={t(`SettingOrderLimit.limit_${key}_title`)}
                subheader={t(`SettingOrderLimit.limit_${key}_subtitle`)}
                action={
                  <Switch
                    checked={getConfigValue(key)?.open}
                    onChange={(checked) => {
                      changeGlobalConfig(id, {
                        open: checked,
                      })
                    }}
                  />
                }
              />
            </Card>
          </div>
        )
      })}
    </div>
  )
}

export default UserSetting
