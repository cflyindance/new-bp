import { Card, CardContent } from '@material-ui/core'
import { CardHead } from '@/components/AdminSettings/CardHead'
import { Checkbox, InputNumber, Switch } from 'antd'
import useSystemConfig from '@/hooks/useSystemConfig'
import { Trans, useTranslation } from 'react-i18next'

import styles from './LotterySetting.module.less'
import { CircularProgress } from '@material-ui/core'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { lottery, lotteryAnimation } from '@/constants/systemConfig'
import { useSetMenus } from '@/hooks/useSetMenus'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import UploadWithForm from '@/components/common/UploadWithForm'
import AddIcon from '@material-ui/icons/Add'

const LotterySetting = (props) => {
  const { data } = props
  const { t } = useTranslation()

  const { treeData } = useSetMenus()
  const menuItemList = useMemo(() => {
    return treeData.filter((group) => group.name !== 'ALL_YOU_CAN_EAT')
  }, [treeData])

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

  const [loading, setLoading] = useState({
    winVideo: false,
    loseVideo: false,
  })

  const handleConfigChange = (id, val) => {
    const configInfo = globalConfig?.find((each) => each.id === id)
    const oldValue = configInfo?.value
    const newValue = {
      ...oldValue,
      ...val,
    }
    changeGlobalConfig(id, newValue)
  }

  return (
    <div className={styles.lotterySettingWrapper}>
      {data.map((each) => {
        const { key, id } = each
        const valueObj = getConfigValue(key)
        return (
          <Fragment key={key}>
            <div className={styles.lotterySettingItem}>
              <Card elevation={0}>
                <CardHead
                  title={t(`SettingOrderLimit.limit_${key}_title`)}
                  subheader={t(`SettingOrderLimit.limit_${key}_subtitle`)}
                  action={
                    <Switch
                      checked={valueObj?.open}
                      onChange={(checked) => {
                        handleConfigChange(id, {
                          open: checked,
                        })
                      }}
                    />
                  }
                />
                {id === lottery.id && (
                  <CardContent
                    hidden={!valueObj.open}
                    className={styles.lotterySettingDetailContent}
                  >
                    <div>
                      <Trans
                        t={t}
                        i18nKey={`SystemSetting.lottery_thresholdCount`}
                        components={[
                          <InputNumber
                            min={0}
                            value={valueObj.thresholdCount}
                            onChange={(value) => {
                              handleConfigChange(id, {
                                thresholdCount: value,
                              })
                            }}
                            key="thresholdCount"
                          />,
                        ]}
                      />
                      <div className={styles.spaceSeparator}></div>
                      <Trans
                        t={t}
                        i18nKey={`SystemSetting.lottery_maxTimes`}
                        components={[
                          <InputNumber
                            min={0}
                            value={valueObj.maxTimes}
                            onChange={(value) => {
                              handleConfigChange(id, {
                                maxTimes: value,
                              })
                            }}
                            key="maxTimes"
                          />,
                        ]}
                      />
                    </div>
                    <div>
                      <Trans
                        t={t}
                        i18nKey={`SystemSetting.lottery_excludeDishIds`}
                        components={[
                          <TreeSelectDish
                            className={styles.treeSelectDish}
                            onChange={(value) =>
                              handleConfigChange(id, {
                                excludeDishIds: value,
                              })
                            }
                            treeData={menuItemList}
                            value={valueObj.excludeDishIds}
                            key="excludeDishIds"
                          />,
                        ]}
                      />
                    </div>
                    <div>
                      <Trans
                        t={t}
                        i18nKey={`SystemSetting.lottery_winProbability`}
                        components={[
                          <InputNumber
                            min={0}
                            max={100}
                            value={valueObj.winProbability}
                            onChange={(value) => {
                              handleConfigChange(id, {
                                winProbability: value,
                              })
                            }}
                            key="winProbability"
                          />,
                        ]}
                      />
                    </div>
                    <div>
                      <Trans
                        t={t}
                        i18nKey={`SystemSetting.lottery_rewardDishIds`}
                        components={[
                          <TreeSelectDish
                            className={styles.treeSelectDish}
                            onChange={(value) =>
                              handleConfigChange(id, {
                                rewardDishIds: value,
                              })
                            }
                            treeData={menuItemList}
                            value={valueObj.rewardDishIds}
                            key="rewardDishIds"
                          />,
                        ]}
                      />
                    </div>
                  </CardContent>
                )}
                {id === lotteryAnimation.id && (
                  <CardContent
                    hidden={!valueObj?.open}
                    className={styles.lotteryAnimationSettingDetailContent}
                  >
                    <div>
                      <Checkbox
                        checked={valueObj?.cropDisplay}
                        onChange={(e) =>
                          handleConfigChange(id, {
                            cropDisplay: e.target.checked,
                          })
                        }
                      >
                        {t('SystemSetting.lotteryAnimation_cropDisplay')}
                      </Checkbox>
                    </div>
                    <div className={styles.lotteryAnimationContent}>
                      <div>
                        <div className={styles.lotteryAnimationTitle}>
                          {t('SystemSetting.lotteryAnimation_winVideo')}
                        </div>
                        <UploadWithForm
                          onChange={(src) =>
                            handleConfigChange(id, { winVideo: src })
                          }
                          value={valueObj?.winVideo || []}
                          sizeMBLimit={5}
                          isVideo={true}
                          onLoading={() =>
                            setLoading((prev) => ({ ...prev, winVideo: true }))
                          }
                          onLoadEnd={() =>
                            setLoading((prev) => ({ ...prev, winVideo: false }))
                          }
                          config={{ disabled: loading.winVideo }}
                        >
                          {valueObj?.winVideo?.length > 0 ? null : (
                            <>
                              {loading.winVideo ? (
                                <CircularProgress />
                              ) : (
                                <AddIcon />
                              )}
                            </>
                          )}
                        </UploadWithForm>
                      </div>
                      <div>
                        <div className={styles.lotteryAnimationTitle}>
                          {t('SystemSetting.lotteryAnimation_loseVideo')}
                        </div>
                        <UploadWithForm
                          onChange={(src) =>
                            handleConfigChange(id, { loseVideo: src })
                          }
                          value={valueObj?.loseVideo || []}
                          sizeMBLimit={5}
                          isVideo={true}
                          onLoading={() =>
                            setLoading((prev) => ({ ...prev, loseVideo: true }))
                          }
                          onLoadEnd={() =>
                            setLoading((prev) => ({
                              ...prev,
                              loseVideo: false,
                            }))
                          }
                          config={{ disabled: loading.loseVideo }}
                        >
                          {valueObj?.loseVideo?.length > 0 ? null : (
                            <>
                              {loading.loseVideo ? (
                                <CircularProgress />
                              ) : (
                                <AddIcon />
                              )}
                            </>
                          )}
                        </UploadWithForm>
                      </div>
                    </div>
                    <div className={styles.lotteryAnimationVideoLimitContent}>
                      <div>{t('labels.video-limit-size')}</div>
                      <div>{t('labels.video-limit-format')}</div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

export default LotterySetting
