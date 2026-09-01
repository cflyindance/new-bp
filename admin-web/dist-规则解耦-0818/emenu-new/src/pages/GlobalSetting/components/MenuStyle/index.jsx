import styles from './index.module.less'
import { useTranslation } from 'react-i18next'
import useSystemConfig from '@/hooks/useSystemConfig'
import { Card, CardContent } from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import { InputNumber, Switch } from 'antd'

const MenuStyle = (props) => {
  const { data } = props
  const { t } = useTranslation()
  const { changeGlobalConfig, getFinalConfigById } = useSystemConfig()

  const setNewData = (id, newData) => {
    const preData = getFinalConfigById(id)
    const finalNewData = {
      ...preData,
      ...newData,
    }
    changeGlobalConfig(id, finalNewData)
  }

  return (
    <div className={styles.menuStyleWrapper}>
      <div className={styles.innerContent}>
        {data.map((each) => {
          const { key, id } = each
          let cardContent = null
          if (id === 53) {
            cardContent = (
              <InputNumber
                addonAfter={<span>px</span>}
                value={getFinalConfigById(id)?.[key] || 16}
                onChange={(val) => {
                  setNewData(id, {
                    menuTitleFontSize: val,
                  })
                }}
                min={12}
                step={1}
              />
            )
          }
          return (
            <div className={styles.settingItem} key={key}>
              <Card elevation={0}>
                <CardHead
                  title={t(`SettingOrderLimit.limit_${key}_title`)}
                  subheader={t(`SettingOrderLimit.limit_${key}_subtitle`)}
                  action={
                    <Switch
                      checked={getFinalConfigById(id)?.open}
                      onChange={(checked) => {
                        setNewData(id, {
                          open: checked,
                        })
                      }}
                    />
                  }
                />
                <CardContent hidden={!getFinalConfigById(id)?.open}>
                  {cardContent}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MenuStyle
