import { Card } from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import { Button, Space, Switch } from 'antd'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useTranslation } from 'react-i18next'
import styles from './PemiumMember.module.less'
import { Fragment, useCallback, useMemo } from 'react'
import {
  memberRedemptionCenter,
  pemiumMemberPoster,
} from '@/constants/systemConfig'
import UploadWithForm from '@/components/common/UploadWithForm'
import ImgFallback from '@/components/common/ImgFallback'
import { serverUrl } from '@/utils/env_var'
import defaultPemiumMemberPoster from '@/assets/image/pemium_poster.png'
import defaultMemberRedemptionCenterIcon from '@/assets/image/member_redemption_center_default.png'

const posterSizeMBLimit = 4
const memberRedemptionCenterIconSizeMBLimit = 5

const PemiumMember = (props) => {
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
    <div className={styles.pemiumMemberWrapper}>
      {data.map((each) => {
        const { key, id } = each
        const valueObj = getConfigValue(key)
        const pemiumMemberPosterSrc = valueObj?.pemiumMemberPoster?.[0]
        const memberRedemptionCenterIconSrc =
          valueObj?.memberRedemptionCenterIcon?.[0]
        return (
          <Fragment key={key}>
            <div className={styles.pemiumMemberSettingItem}>
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
            {id === pemiumMemberPoster.id && valueObj?.open && (
              <>
                <Space size={8}>
                  <UploadWithForm
                    onChange={(src) =>
                      changeGlobalConfig(id, {
                        ...valueObj,
                        pemiumMemberPoster: [src],
                      })
                    }
                    value={pemiumMemberPosterSrc}
                    config={{
                      listType: 'text',
                    }}
                    sizeMBLimit={posterSizeMBLimit}
                  >
                    <Button type="primary">
                      {t(
                        pemiumMemberPosterSrc
                          ? 'SystemSetting.edit_poster'
                          : 'SystemSetting.add_poster'
                      )}
                    </Button>
                  </UploadWithForm>
                  <Button
                    onClick={() =>
                      changeGlobalConfig(id, {
                        ...valueObj,
                        pemiumMemberPoster: [],
                      })
                    }
                  >
                    {t('SystemSetting.delete_poster')}
                  </Button>
                </Space>
                <div className={styles.descText}>
                  <div>{t('labels.aspect-ratio', { value: '375*450px' })}</div>
                  <div>{t('labels.img-limit-format')}</div>
                  <div>
                    {t('labels.img-limit-size', { value: posterSizeMBLimit })}
                  </div>
                </div>
                <div className={styles.posterImageWrapper}>
                  <ImgFallback
                    src={
                      pemiumMemberPosterSrc
                        ? serverUrl + pemiumMemberPosterSrc
                        : defaultPemiumMemberPoster
                    }
                    className={styles.posterImage}
                    alt="poster"
                  />
                </div>
              </>
            )}
            {id === memberRedemptionCenter.id && valueObj?.open && (
              <>
                <Space size={8}>
                  <UploadWithForm
                    onChange={(src) =>
                      changeGlobalConfig(id, {
                        ...valueObj,
                        memberRedemptionCenterIcon: [src],
                      })
                    }
                    value={memberRedemptionCenterIconSrc}
                    config={{
                      listType: 'text',
                    }}
                    sizeMBLimit={memberRedemptionCenterIconSizeMBLimit}
                  >
                    <Button type="primary">
                      {t(
                        memberRedemptionCenterIconSrc
                          ? 'MemberRedemptionCenter.editIcon'
                          : 'MemberRedemptionCenter.addIcon'
                      )}
                    </Button>
                  </UploadWithForm>
                  <Button
                    onClick={() =>
                      changeGlobalConfig(id, {
                        ...valueObj,
                        memberRedemptionCenterIcon: [],
                      })
                    }
                  >
                    {t('MemberRedemptionCenter.deleteIcon')}
                  </Button>
                </Space>
                <div className={styles.descText}>
                  <div>
                    {t('MemberRedemptionCenter.iconAspectRatioRequirement')}
                  </div>
                  <div>{t('MemberRedemptionCenter.iconFormatRequirement')}</div>
                  <div>
                    {t('MemberRedemptionCenter.iconSizeRequirement', {
                      value: memberRedemptionCenterIconSizeMBLimit,
                    })}
                  </div>
                </div>
                <div className={styles.memberRedemptionCenterIconWrapper}>
                  {memberRedemptionCenterIconSrc ? (
                    <ImgFallback
                      src={serverUrl + memberRedemptionCenterIconSrc}
                      className={styles.memberRedemptionCenterIcon}
                      alt={t('MemberRedemptionCenter.title')}
                    />
                  ) : (
                    <ImgFallback
                      src={defaultMemberRedemptionCenterIcon}
                      alt={t('MemberRedemptionCenter.title')}
                      className={styles.memberRedemptionCenterDefaultIcon}
                    />
                  )}
                </div>
              </>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

export default PemiumMember
