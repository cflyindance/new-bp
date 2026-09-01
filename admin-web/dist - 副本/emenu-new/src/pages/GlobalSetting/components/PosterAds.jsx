import { useMemo } from 'react'
import { Button, Space, Switch, Input } from 'antd'
import styles from './PosterAds.module.less'
import SettingItem from '@/components/ConfigCommon/SettingItem'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useTranslation } from 'react-i18next'
import UploadWithForm from '@/components/common/UploadWithForm'
import ImgFallback from '@/components/common/ImgFallback'
import { serverUrl } from '@/utils/env_var'
import { Card, CardContent } from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import UploadFile from '@/components/common/UploadFile'
import AddIcon from '@material-ui/icons/Add'

const sizeMBLimit = 4

const PosterAds = () => {
  const { changeGlobalConfig, getFinalConfigById, configList } =
    useSystemConfig()
  const { t } = useTranslation()

  const valueObj = getFinalConfigById(56)
  const valueObjAfterStartOrder = getFinalConfigById(84)

  const imgSrc = useMemo(() => {
    return valueObj?.posterAds?.[0]
  }, [valueObj])

  const limitConfig = useMemo(() => {
    return configList?.globalConfig
  }, [configList])

  const handleConfigChange = (typeName, val, key) => {
    const configId = limitConfig?.find((each) => each.key === typeName)?.id
    const oldValue = limitConfig?.find((each) => each.id === configId)?.value
    const newValue = {
      ...oldValue,
      [key]: val,
    }
    changeGlobalConfig(configId, newValue)
  }

  return (
    <div className={styles.posterWrapper}>
      <SettingItem
        typeName="posterAds"
        valueObj={valueObj}
        handleConfigChange={handleConfigChange}
        hidden
      />
      {valueObj?.open ? (
        <div>
          <div className={styles.settingItem}>
            <Card elevation={0}>
              <CardHead
                title={t(`SettingOrderLimit.limit_displayPosterButton_title`)}
                subheader={t(
                  `SettingOrderLimit.limit_displayPosterButton_subtitle`
                )}
                action={
                  <Switch
                    checked={valueObj?.displayButton}
                    onChange={(checked) =>
                      handleConfigChange('posterAds', checked, 'displayButton')
                    }
                  />
                }
              />
              <CardContent hidden={!valueObj?.displayButton}>
                <Space size={8}>
                  <Input
                    value={valueObj?.text?.zh}
                    addonBefore={<span>中文</span>}
                    onChange={(e) =>
                      handleConfigChange(
                        'posterAds',
                        { ...valueObj?.text, zh: e.target.value },
                        'text'
                      )
                    }
                  />
                  <Input
                    value={valueObj?.text?.en}
                    addonBefore={<span>En</span>}
                    onChange={(e) =>
                      handleConfigChange(
                        'posterAds',
                        { ...valueObj?.text, en: e.target.value },
                        'text'
                      )
                    }
                  />
                </Space>
              </CardContent>
            </Card>
          </div>
          <div className={styles.settingItem}>
            <Card elevation={0}>
              <CardHead
                title={t(`SettingOrderLimit.limit_posterBeforeOrder_title`)}
                subheader={t(
                  `SettingOrderLimit.limit_posterBeforeOrder_subtitle`
                )}
                action={
                  <Switch
                    checked={valueObj?.posterBeforeOrder}
                    onChange={(checked) =>
                      handleConfigChange(
                        'posterAds',
                        checked,
                        'posterBeforeOrder'
                      )
                    }
                  />
                }
              />
            </Card>
          </div>
          <Space size={8}>
            <UploadWithForm
              onChange={(src) =>
                handleConfigChange('posterAds', [src], 'posterAds')
              }
              value={imgSrc}
              config={{
                listType: 'text',
              }}
              sizeMBLimit={sizeMBLimit}
            >
              <Button type="primary">
                {t(
                  imgSrc
                    ? 'SystemSetting.edit_poster'
                    : 'SystemSetting.add_poster'
                )}
              </Button>
            </UploadWithForm>
            <Button
              onClick={() => handleConfigChange('posterAds', [], 'posterAds')}
            >
              {t('SystemSetting.delete_poster')}
            </Button>
          </Space>
          <div className={styles.descText}>
            <div>{t('labels.aspect-ratio', { value: '16 / 9' })}</div>
            <div>{t('labels.img-limit-format')}</div>
            <div>{t('labels.img-limit-size', { value: sizeMBLimit })}</div>
          </div>
          <div className={styles.posterImageWrapper}>
            <ImgFallback
              src={serverUrl + `${imgSrc}`}
              className={styles.posterImage}
              alt="poster"
            />
          </div>
        </div>
      ) : null}
      <SettingItem
        typeName="posterAdsAfterStartOrder"
        valueObj={valueObjAfterStartOrder}
        handleConfigChange={handleConfigChange}
        hidden
      />
      {valueObjAfterStartOrder?.open ? (
        <>
          <Space size={8}>
            <UploadFile
              onChange={(src) =>
                handleConfigChange('posterAdsAfterStartOrder', src, 'posterAds')
              }
              value={valueObjAfterStartOrder?.posterAds}
              maxSizeMB={sizeMBLimit}
            >
              <AddIcon />
            </UploadFile>
          </Space>
          <div className={styles.descText}>
            <div>{t('labels.aspect-ratio-img/video', { value: '16 / 9' })}</div>
            <div>{t('labels.img-limit-format')}</div>
            <div>{t('labels.video-limit-format')}</div>
            <div>
              {t('labels.limit-size-img/video', { value: sizeMBLimit })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default PosterAds
