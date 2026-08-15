import styles from './index.module.less'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CircularProgress } from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import { Radio, Space, Switch } from 'antd'
import UploadWithForm from '@/components/common/UploadWithForm'
import AddIcon from '@material-ui/icons/Add'

const HomepageVideoSetting = () => {
  const { t } = useTranslation()
  const { changeGlobalConfig, getFinalConfigById } = useSystemConfig()

  const valueObj = getFinalConfigById(58)

  const videoList = useMemo(() => valueObj?.homepageVideo || [])

  const handleConfigChange = (_, val, key) => {
    const finalNewData = {
      ...valueObj,
      [key]: val,
    }
    changeGlobalConfig(58, finalNewData)
  }

  const [loading, setLoading] = useState(false)

  return (
    <div className={styles.homepageVideoSettingWrapper}>
      <div className={styles.innerContent}>
        <div className={styles.settingItem}>
          <Card elevation={0}>
            <CardHead
              title={t(`SettingOrderLimit.limit_homepageVideo_title`)}
              subheader={t(`SettingOrderLimit.limit_homepageVideo_subtitle`)}
              action={
                <Switch
                  checked={valueObj?.open}
                  onChange={(checked) => {
                    handleConfigChange(null, checked, 'open')
                  }}
                />
              }
            />
          </Card>
        </div>
        {valueObj?.open ? (
          <Space size="small" direction="vertical">
            <div>
              <Radio.Group
                onChange={(e) =>
                  handleConfigChange(null, e.target.value, 'displayMode')
                }
                value={valueObj?.displayMode}
              >
                {['fullscreen', 'contain'].map((_) => (
                  <Radio key={_} value={_}>
                    {t(`radioOrderSetting.homepageVideo_display_${_}`)}
                  </Radio>
                ))}
              </Radio.Group>
            </div>
            <UploadWithForm
              onChange={(src) => handleConfigChange(null, src, 'homepageVideo')}
              value={videoList}
              sizeMBLimit={5}
              isVideo={true}
              onLoading={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              config={{ disabled: loading }}
            >
              {videoList.length > 0 ? null : (
                <>{loading ? <CircularProgress /> : <AddIcon />}</>
              )}
            </UploadWithForm>
            <div>
              <div>{t('labels.video-limit-measure')}</div>
              <div>{t('labels.video-limit-size')}</div>
              <div>{t('labels.video-limit-format')}</div>
            </div>
          </Space>
        ) : null}
      </div>
    </div>
  )
}

export default HomepageVideoSetting
