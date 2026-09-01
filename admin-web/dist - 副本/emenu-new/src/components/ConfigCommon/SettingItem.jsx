import { useCreation } from 'ahooks'
import { Card, CardContent } from '@material-ui/core'
import { Card as AntCard, Checkbox } from 'antd'
import { CardHead } from '@/components/AdminSettings/CardHead'
import { InputNumber, Select, Switch, Radio, Button, Typography } from 'antd'
import { filterMenuById } from '@/utils/filterMenu'
import { Trans, useTranslation } from 'react-i18next'

import { ExpandMoreRounded } from '@material-ui/icons'
import {
  getLimitConfigMap,
  standardOrderSetting,
  inputOrderSetting,
  radioOrderSetting,
  // dishSelectOnceSetting,
  defaultVisContent,
  switchOrderSetting,
  dishSelectOrderSetting,
  extraOrderSetting,
} from '@/constants/limitConfig'
import styles from './SettingItem.module.less'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import useSystemConfig from '@/hooks/useSystemConfig'
import { Box } from '@material-ui/core'
import DishQuantityPerRoundConfig from './DishQuantityPerRoundConfig'
import MutexDishConfig from './MutexDishConfig'
import CombinationDishConfig from './CombinationDishConfig'

const { Group: RadioGroup } = Radio

const configId = 37

const newItem = {
  dishes: [],
}

const SettingItem = (props) => {
  const {
    typeName,
    valueObj,
    hidden = false,
    handleConfigChange,
    radioOptions = [],
    treeData,
    specialComboDishs,
    crmFreeItem,
  } = props
  const { t } = useTranslation()
  const limitConfigMap = getLimitConfigMap(t)

  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()

  const isDishQuantityPerRoundOpen = getGlobalConfig(57)?.open

  const value = useCreation(() => {
    return valueObj?.[typeName]
  }, [valueObj, typeName])

  const HeaderRight = useCreation(() => {
    if (defaultVisContent.includes(typeName)) return null
    if (radioOrderSetting.includes(typeName)) {
      return (
        <RadioGroup
          value={value}
          onChange={(e) =>
            handleConfigChange(typeName, e.target.value, typeName)
          }
        >
          {radioOptions.map((each, idx) => {
            return (
              <Radio key={idx} value={each.value}>
                {t(`radioOrderSetting.${typeName}_${each.value}`)}
              </Radio>
            )
          })}
        </RadioGroup>
      )
    }
    const switchChecked = valueObj?.open
    return (
      <Switch
        checked={switchChecked}
        onChange={(checked) => {
          if (typeName === 'dishIntervalMinutes') {
            handleConfigChange('intervalMinutes', false, 'open')
          } else if (typeName === 'intervalMinutes') {
            handleConfigChange('dishIntervalMinutes', false, 'open')
          }
          handleConfigChange(typeName, checked, 'open')
        }}
      />
    )
  }, [typeName, valueObj, handleConfigChange, t])

  const isHiddenContent = useCreation(() => {
    if (defaultVisContent.includes(typeName)) return false
    return (
      radioOrderSetting.includes(typeName) ||
      switchOrderSetting.includes(typeName)
    )
  }, [typeName])

  /*  以下相同锅底加收的相关方法*/
  const { Text } = Typography
  const allAddPotDish = getGlobalConfig(configId) || []

  const addDish = () => {
    changeGlobalConfig(configId, [...allAddPotDish, newItem])
  }

  const onChange = (idx, value, key) => {
    const afterChangeDelay = allAddPotDish.map((each, i) => {
      return i === idx
        ? {
            ...each,
            [key]: value,
          }
        : each
    })
    changeGlobalConfig(configId, afterChangeDelay)
  }
  const removeDish = (idx) => {
    const afterFiltered = allAddPotDish.filter((_, index) => index !== idx)
    changeGlobalConfig(configId, afterFiltered)
  }
  /*  以上相同锅底加收的相关方法*/

  const onChangeDishIntervalMinutesItem = (idx) => (value, key) => {
    const dishIntervalMinutes = valueObj?.dishIntervalMinutes
    const result = dishIntervalMinutes.map((each, i) => {
      return i === idx
        ? {
            ...each,
            [key]: value,
          }
        : each
    })
    handleConfigChange('dishIntervalMinutes', result, 'dishIntervalMinutes')
  }

  const onRemoveDishIntervalMinutesItem = (idx) => () => {
    const dishIntervalMinutes = valueObj?.dishIntervalMinutes
    const result = dishIntervalMinutes.filter((_, i) => i !== idx)
    handleConfigChange('dishIntervalMinutes', result, 'dishIntervalMinutes')
  }

  const onAddDishIntervalMinutesItem = () => {
    const dishIntervalMinutes = valueObj?.dishIntervalMinutes
    const result = [...dishIntervalMinutes, {}]
    handleConfigChange('dishIntervalMinutes', result, 'dishIntervalMinutes')
  }

  const renderDishIntervalMinutesItems = () => {
    const dishIntervalMinutes = valueObj.dishIntervalMinutes

    return (
      <Box>
        {dishIntervalMinutes?.map((item, index) => {
          return (
            <AntCard
              key={index}
              type="inner"
              title={
                <Box display="flex" alignItems="center">
                  <Text>
                    <Trans
                      t={t}
                      i18nKey="SystemSetting.dishIntervalMinutesLimit"
                      components={[
                        <Select
                          size="small"
                          options={limitConfigMap.specificDishType}
                          value={
                            item.specificDishType ||
                            limitConfigMap.specificDishType[0].value
                          }
                          onChange={(value) =>
                            onChangeDishIntervalMinutesItem(index)(
                              value,
                              'specificDishType'
                            )
                          }
                          dropdownMatchSelectWidth={false}
                          key="specificDishType"
                        />,
                      ]}
                    />
                    ：
                  </Text>
                  <InputNumber
                    onChange={(value) =>
                      onChangeDishIntervalMinutesItem(index)(
                        value ?? 0,
                        'minutes'
                      )
                    }
                    addonAfter={t(
                      `SystemSetting.dishIntervalMinutesLimit_unit`
                    )}
                    value={item.minutes}
                    size="small"
                    min={0}
                    max={200}
                    precision={0}
                    style={{
                      width: 120,
                      marginRight: 12,
                    }}
                  />
                </Box>
              }
              extra={
                <Box className={styles.dishIntervalMinutesLimitBtns}>
                  <Button
                    type="link"
                    size="small"
                    onClick={onRemoveDishIntervalMinutesItem(index)}
                    className={
                      dishIntervalMinutes.length > 1 ? '' : styles.btnHidden
                    }
                  >
                    {t('SystemSetting.delete')}
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    onClick={onAddDishIntervalMinutesItem}
                    className={
                      index === dishIntervalMinutes.length - 1
                        ? ''
                        : styles.btnHidden
                    }
                  >
                    {t('SystemSetting.add')}
                  </Button>
                </Box>
              }
              style={{
                marginBottom: 24,
              }}
            >
              <TreeSelectDish
                onChange={(value) =>
                  onChangeDishIntervalMinutesItem(index)(value, 'dishes')
                }
                treeData={filterMenuById(
                  treeData,
                  dishIntervalMinutes || [],
                  index,
                  'dishes'
                )}
                value={item.dishes}
              />
            </AntCard>
          )
        })}
      </Box>
    )
  }

  const cardContent = useCreation(() => {
    if (isHiddenContent) return null
    if (standardOrderSetting.includes(typeName)) {
      return (
        <Select
          size="large"
          suffixIcon={<ExpandMoreRounded />}
          placeholder={t('SettingOrderLimit.placeholder')}
          options={limitConfigMap[typeName]}
          className={styles.selector}
          value={value}
          onChange={(val) => handleConfigChange(typeName, val, typeName)}
        />
      )
    }
    if (inputOrderSetting.includes(typeName)) {
      const addonBeforeText = t(`inputSetting.${typeName}_addBefore`)
      const addonAfterText = t(`inputSetting.${typeName}_addonAfter`)
      return (
        <InputNumber
          value={value}
          onChange={(val) => handleConfigChange(typeName, val, typeName)}
          min={0}
          addonBefore={addonBeforeText && <span>{addonBeforeText}</span>}
          addonAfter={addonAfterText && <span>{addonAfterText}</span>}
          precision={0}
        />
      )
    }
    if (dishSelectOrderSetting.includes(typeName)) {
      return (
        <TreeSelectDish
          onChange={(newValue) =>
            handleConfigChange(typeName, newValue, typeName)
          }
          treeData={typeName === 'restrictRedeemItem' ? crmFreeItem : treeData}
          value={value}
        />
      )
    }
    if (typeName === 'dishQuantityPerRound') {
      return <DishQuantityPerRoundConfig {...props} />
    }
    if (typeName === 'dishIntervalMinutes') {
      return renderDishIntervalMinutesItems()
    }
    if (typeName === 'mutexDish') {
      return <MutexDishConfig {...props} />
    }
    if (typeName === 'combinationDish') {
      return <CombinationDishConfig {...props} />
    }
  }, [t, typeName, value, handleConfigChange, isHiddenContent, valueObj])

  const extraContent = useCreation(() => {
    if (isHiddenContent) return null
    if (typeName === 'restTimeAlert' && !valueObj?.disableOrderAfterAlert) {
      return null
    }
    const item = extraOrderSetting.find((each) => each.typeName === typeName)
    if (item) {
      const addonBeforeText = t(`inputSetting.${item.key}_addBefore`)
      const addonAfterText = t(`inputSetting.${item.key}_addonAfter`)
      return (
        <InputNumber
          value={valueObj?.[item.key] || 0}
          onChange={(val) => handleConfigChange(typeName, val, item.key)}
          min={0}
          addonBefore={addonBeforeText && <span>{addonBeforeText}</span>}
          addonAfter={addonAfterText && <span>{addonAfterText}</span>}
          precision={0}
        />
      )
    }
  }, [typeName, valueObj, handleConfigChange, isHiddenContent])

  const addLimitQuantityDish = (configId) => () => {
    const limitConfig = getGlobalConfig(configId) || []
    const newDishItem =
      configId === 18
        ? {
            copies: 1,
            dishes: [],
          }
        : {
            quantity: 1,
            dishes: [],
          }
    changeGlobalConfig(configId, [...limitConfig, newDishItem])
  }
  const removeLimitQuantityDish = (configId) => (idx) => {
    const limitConfig = getGlobalConfig(configId) || []
    const afterFiltered = limitConfig.filter((_, index) => index !== idx)
    changeGlobalConfig(configId, afterFiltered)
  }

  const onChangeDish = (configId) => (idx, value, key) => {
    const limitConfig = getGlobalConfig(configId) || []
    const afterChangeLimit = limitConfig.map((each, i) => {
      return i === idx
        ? {
            ...each,
            [key]: value,
          }
        : each
    })
    changeGlobalConfig(configId, afterChangeLimit)
  }

  const cardHeadTitle = useCreation(() => {
    if (typeName === 'showMealTime') {
      return (
        <>
          {t(`SettingOrderLimit.limit_${typeName}_title`)}
          <Checkbox
            checked={valueObj.inverted}
            className={styles.cardHeader_checkbox}
            onChange={(e) =>
              handleConfigChange('showMealTime', e.target.checked, 'inverted')
            }
          >
            {t('SystemSetting.showMealTime_inverted')}
          </Checkbox>
        </>
      )
    } else if (typeName === 'restTimeAlert') {
      return (
        <>
          {t(`SettingOrderLimit.limit_${typeName}_title`)}
          <Checkbox
            checked={valueObj.disableOrderAfterAlert}
            className={styles.cardHeader_checkbox}
            onChange={(e) =>
              handleConfigChange(
                'restTimeAlert',
                e.target.checked,
                'disableOrderAfterAlert'
              )
            }
          >
            {t('SystemSetting.disable_order_after_restTimeAlert')}
          </Checkbox>
        </>
      )
    } else if (typeName === 'intervalMinutes') {
      return (
        <>
          {t(`SettingOrderLimit.limit_${typeName}_title`)}
          <Checkbox
            checked={valueObj.allowAddToCart}
            className={styles.cardHeader_checkbox}
            onChange={(e) => {
              handleConfigChange(
                'intervalMinutes',
                e.target.checked,
                'allowAddToCart'
              )
            }}
          >
            {t('SystemSetting.allow_To_Add_Cart_during_interval')}
          </Checkbox>
        </>
      )
    } else if (typeName === 'quantity') {
      return (
        <>
          {t(`SettingOrderLimit.limit_${typeName}_title`)}
          {isDishQuantityPerRoundOpen && (
            <span className={styles.cardHeader_tip}>
              {' '}
              {t('SystemSetting.setting_conflict', {
                rule: t('SettingOrderLimit.limit_dishQuantityPerRound_title'),
              })}
            </span>
          )}
        </>
      )
    } else if (typeName === 'dishIntervalMinutes') {
      return (
        <>
          {t(`SettingOrderLimit.limit_${typeName}_title`)}
          <Checkbox
            checked={valueObj.allowAddToCart}
            className={styles.cardHeader_checkbox}
            onChange={(e) => {
              handleConfigChange(typeName, e.target.checked, 'allowAddToCart')
            }}
          >
            {t('SystemSetting.allow_To_Add_Cart_during_interval')}
          </Checkbox>
        </>
      )
    }
    return t(`SettingOrderLimit.limit_${typeName}_title`)
  }, [typeName, valueObj, handleConfigChange, isDishQuantityPerRoundOpen])

  return (
    <div key={typeName} className={styles.orderSettingItem}>
      {typeName === 'samePotDefaultAdded' ? (
        // 相同锅底加收的布局
        <AntCard
          title={t(`SettingOrderLimit.limit_${typeName}_title`)}
          extra={
            <Button type="link" size="small" onClick={addDish}>
              {t('SystemSetting.add')}
            </Button>
          }
        >
          {allAddPotDish?.map((each, idx) => (
            <AntCard
              key={idx}
              type="inner"
              title={
                <Box display="flex" alignItems="center">
                  <Text>{t('SettingOrderLimit.extraCharge')}：</Text>
                  <InputNumber
                    onChange={(value) => onChange(idx, value ?? 0, 'charge')}
                    addonBefore="$"
                    value={each.charge}
                    size="small"
                    min={0}
                    max={200}
                    precision={0}
                    style={{
                      width: 120,
                      marginRight: 12,
                    }}
                  />
                  {
                    each.charge === 0 && null
                    // <Text type="warning"> 设置为0为不加收</Text>
                  }
                </Box>
              }
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={() => removeDish(idx)}
                >
                  {t('SystemSetting.delete')}
                </Button>
              }
              style={{
                marginBottom: 24,
              }}
            >
              <TreeSelectDish
                isMultiple={false}
                onChange={(value) => onChange(idx, value, 'dishes')}
                treeData={filterMenuById(
                  specialComboDishs,
                  allAddPotDish,
                  idx,
                  'dishes'
                )}
                value={each.dishes}
              />
            </AntCard>
          ))}
        </AntCard>
      ) : typeName === 'limitRestrictOnce' ? (
        <Card elevation={0}>
          <CardHead
            title={
              <>
                {t(`SettingOrderLimit.limit_${typeName}_title`)}
                {isDishQuantityPerRoundOpen && (
                  <span className={styles.cardHeader_tip}>
                    {' '}
                    {t('SystemSetting.setting_conflict', {
                      rule: t(
                        'SettingOrderLimit.limit_dishQuantityPerRound_title'
                      ),
                    })}
                  </span>
                )}
              </>
            }
            subheader={t(`SettingOrderLimit.limit_${typeName}_subtitle`)}
            action={
              <Button
                type="link"
                size="small"
                onClick={addLimitQuantityDish(46)}
              >
                {t('SystemSetting.add')}
              </Button>
            }
          />

          {(getGlobalConfig(46) || []).map((each, idx) => {
            return (
              <AntCard
                key={idx}
                type="inner"
                title={
                  <Box display="flex" alignItems="center">
                    <Text>{t(`SystemSetting.limitRestrict_content`)}：</Text>
                    <InputNumber
                      onChange={(value) =>
                        onChangeDish(46)(idx, value ?? 0, 'quantity')
                      }
                      addonAfter={t('Order.pieces')}
                      value={each.quantity}
                      size="small"
                      min={0}
                      max={200}
                      precision={0}
                      style={{
                        width: 120,
                        marginRight: 12,
                      }}
                    />
                    {
                      each.charge === 0 && null
                      // <Text type="warning"> 设置为0为不加收</Text>
                    }
                  </Box>
                }
                extra={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => removeLimitQuantityDish(46)(idx)}
                  >
                    {t('SystemSetting.delete')}
                  </Button>
                }
                style={{
                  marginBottom: 24,
                }}
              >
                <TreeSelectDish
                  onChange={(value) => onChangeDish(46)(idx, value, 'dishes')}
                  treeData={filterMenuById(
                    treeData,
                    getGlobalConfig(46) || [],
                    idx,
                    'dishes'
                  )}
                  value={each.dishes}
                />
              </AntCard>
            )
          })}
        </Card>
      ) : typeName === 'dishQuantityLimit' ? (
        <Card elevation={0}>
          <CardHead
            title={
              <>
                {t(`SettingOrderLimit.limit_${typeName}_title`)}
                {isDishQuantityPerRoundOpen && (
                  <span className={styles.cardHeader_tip}>
                    {' '}
                    {t('SystemSetting.setting_conflict', {
                      rule: t(
                        'SettingOrderLimit.limit_dishQuantityPerRound_title'
                      ),
                    })}
                  </span>
                )}
              </>
            }
            subheader={t(`SettingOrderLimit.limit_${typeName}_subtitle`)}
            action={
              <Button
                type="link"
                size="small"
                onClick={addLimitQuantityDish(18)}
              >
                {t('SystemSetting.add')}
              </Button>
            }
          />

          {(getGlobalConfig(18) || []).map((each, idx) => {
            return (
              <AntCard
                key={idx}
                type="inner"
                title={
                  <Box display="flex" alignItems="center">
                    <Text>{t(`SystemSetting.eachTimeOrderQuantity`)}：</Text>
                    <InputNumber
                      onChange={(value) =>
                        onChangeDish(18)(idx, value ?? 0, 'copies')
                      }
                      addonAfter={t('Order.pieces')}
                      value={each.copies}
                      size="small"
                      min={0}
                      max={200}
                      precision={0}
                      style={{
                        width: 120,
                        marginRight: 12,
                      }}
                    />
                    {
                      each.charge === 0 && null
                      // <Text type="warning"> 设置为0为不加收</Text>
                    }
                  </Box>
                }
                extra={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => removeLimitQuantityDish(18)(idx)}
                  >
                    {t('SystemSetting.delete')}
                  </Button>
                }
                style={{
                  marginBottom: 24,
                }}
              >
                <TreeSelectDish
                  onChange={(value) => onChangeDish(18)(idx, value, 'dishes')}
                  treeData={filterMenuById(
                    treeData,
                    getGlobalConfig(18) || [],
                    idx,
                    'dishes'
                  )}
                  value={each.dishes}
                />
              </AntCard>
            )
          })}
        </Card>
      ) : (
        <Card elevation={0}>
          <CardHead
            title={cardHeadTitle}
            subheader={t(`SettingOrderLimit.limit_${typeName}_subtitle`)}
            action={HeaderRight}
          />
          <CardContent hidden={hidden || isHiddenContent}>
            {cardContent && <div>{cardContent}</div>}
            {extraContent && (
              <div className={styles.extraContent}>{extraContent}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SettingItem
