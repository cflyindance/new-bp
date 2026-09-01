import styles from './index.module.less'
import { Switch } from 'antd'
import { Card } from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import { useTranslation } from 'react-i18next'
import useSystemConfig from '@/hooks/useSystemConfig'

const AuthorizationSetting = (props) => {
  const { data, getConfigById, onConfigChange } = props
  const { t } = useTranslation()
  const { changeGlobalConfig, getFinalConfigById } = useSystemConfig()
  const getConfig = getConfigById || getFinalConfigById

  const setNewData = (id, newData) => {
    const preData = getConfig(id)
    const finalNewData = {
      ...preData,
      ...newData,
    }
    if (onConfigChange) {
      onConfigChange(id, finalNewData)
      return
    }
    changeGlobalConfig(id, finalNewData)
  }

  return (
    <div className={styles.authSettingWrapper}>
      <div className={styles.innerContent}>
        {data.map((each) => {
          const { key, id } = each
          return (
            <div className={styles.settingItem} key={key}>
              <Card elevation={0}>
                <CardHead
                  title={t(`SettingOrderLimit.limit_${key}_title`)}
                  subheader={t(`SettingOrderLimit.limit_${key}_subtitle`)}
                  action={
                    <Switch
                      checked={getConfig(id)?.open}
                      onChange={(checked) => {
                        setNewData(id, {
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
    </div>
  )
}

export default AuthorizationSetting
