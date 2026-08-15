import { Card, CardContent } from '@material-ui/core'
import { InputNumber, Select, Button, Typography } from 'antd'
import { filterMenuById } from '@/utils/filterMenu'
import { Trans, useTranslation } from 'react-i18next'

import {
  getLimitConfigMap,
  perTypes,
  specificDishTypes,
  specificDishUnits,
} from '@/constants/limitConfig'
import styles from './DishQuantityPerRoundConfig.module.less'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import { Box } from '@material-ui/core'
import React from 'react'

const DishQuantityPerRoundConfig = ({
  valueObj,
  handleConfigChange,
  treeData,
}) => {
  const { t } = useTranslation()
  const limitConfigMap = getLimitConfigMap(t)

  const { Title } = Typography

  const dishQuantityPerRound = valueObj.dishQuantityPerRound
  const length = dishQuantityPerRound?.length

  const addDishQuantityPerRoundOption = () => {
    const dishQuantityPerRound = [...valueObj.dishQuantityPerRound]
    const length = dishQuantityPerRound.length
    const lastSecondItem = dishQuantityPerRound[length - 2]
    const lastItem = dishQuantityPerRound[length - 1]

    const newAfter = lastSecondItem.before
      ? lastSecondItem.before + 1
      : undefined
    const newItems = [
      { after: newAfter, specificDishLimit: [{}] },
      { ...lastItem, after: undefined },
    ]

    dishQuantityPerRound.splice(length - 1, 1, ...newItems)

    handleConfigChange(
      'dishQuantityPerRound',
      dishQuantityPerRound,
      'dishQuantityPerRound'
    )
  }

  const onDishQuantityPerRoundBeforeChange = (index) => (value) => {
    const dishQuantityPerRound = valueObj.dishQuantityPerRound.map(
      (item, i) => {
        if (i < index) return item
        if (i === index) return { ...item, before: value }
        if (i === index + 1)
          return {
            ...item,
            before: undefined,
            after: value ? value + 1 : undefined,
          }
        return { ...item, before: undefined, after: undefined }
      }
    )

    handleConfigChange(
      'dishQuantityPerRound',
      dishQuantityPerRound,
      'dishQuantityPerRound'
    )
  }

  const renderLimitComponent = (item, index) => {
    if (index === 0) {
      return (
        <Trans
          t={t}
          i18nKey="SystemSetting.dishQuantityPerRoundOptionBefore"
          components={[
            <InputNumber
              min={1}
              value={item.before}
              onChange={onDishQuantityPerRoundBeforeChange(index)}
              key="inputNumber"
            />,
          ]}
        />
      )
    }

    if (index + 1 === length) {
      return (
        <Trans
          t={t}
          i18nKey="SystemSetting.dishQuantityPerRoundOptionAfter"
          components={[
            <InputNumber value={item.after} disabled key="inputNumber" />,
          ]}
        />
      )
    }

    return (
      <Trans
        t={t}
        i18nKey="SystemSetting.dishQuantityPerRoundOptionBetween"
        components={[
          <InputNumber value={item.after} disabled key="inputNumber_before" />,
          <InputNumber
            min={item.after}
            value={item.before}
            onChange={onDishQuantityPerRoundBeforeChange(index)}
            key="inputNumber_after"
          />,
        ]}
      />
    )
  }

  const onDishQuantityPerRoundChange = (index, key) => (value) => {
    const dishQuantityPerRound = valueObj.dishQuantityPerRound.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    )
    handleConfigChange(
      'dishQuantityPerRound',
      dishQuantityPerRound,
      'dishQuantityPerRound'
    )
  }

  const addSpecificDishLimit = (dishQuantityLimitIndex) => () => {
    const dishQuantityPerRound = valueObj.dishQuantityPerRound
    const newDishQuantityPerRound = dishQuantityPerRound.map((item, i) => {
      if (i === dishQuantityLimitIndex)
        return {
          ...item,
          specificDishLimit: [
            ...(item.specificDishLimit || []),
            {
              perType: item.perType ?? perTypes.perRound,
            },
          ],
        }
      return item
    })
    handleConfigChange(
      'dishQuantityPerRound',
      newDishQuantityPerRound,
      'dishQuantityPerRound'
    )
  }

  const addSpecificTypeDishLimit =
    (dishQuantityLimitIndex, optionIndex) => () => {
      const dishQuantityPerRound = valueObj.dishQuantityPerRound
      const newDishQuantityPerRound = dishQuantityPerRound.map((item, i) => {
        if (i === dishQuantityLimitIndex) {
          const newSpecificDishLimit = item.specificDishLimit.map(
            (each, _i) => {
              if (_i === optionIndex) {
                return {
                  ...each,
                  specificTypeDishLimit: [
                    ...(each.specificTypeDishLimit || []),
                    {},
                  ],
                }
              }
              return each
            }
          )
          return { ...item, specificDishLimit: newSpecificDishLimit }
        }
        return item
      })
      handleConfigChange(
        'dishQuantityPerRound',
        newDishQuantityPerRound,
        'dishQuantityPerRound'
      )
    }

  const addSpecificPieceSameDishLimit =
    (dishQuantityLimitIndex, optionIndex) => () => {
      const dishQuantityPerRound = valueObj.dishQuantityPerRound
      const newDishQuantityPerRound = dishQuantityPerRound.map((item, i) => {
        if (i === dishQuantityLimitIndex) {
          const newSpecificDishLimit = item.specificDishLimit.map(
            (each, _i) => {
              if (_i === optionIndex) {
                return {
                  ...each,
                  specificPieceSameDishLimit: [
                    ...(each.specificPieceSameDishLimit || []),
                    {},
                  ],
                }
              }
              return each
            }
          )
          return { ...item, specificDishLimit: newSpecificDishLimit }
        }
        return item
      })
      handleConfigChange(
        'dishQuantityPerRound',
        newDishQuantityPerRound,
        'dishQuantityPerRound'
      )
    }

  const removeSpecificDishLimit =
    (dishQuantityLimitIndex, optionIndex) => () => {
      const dishQuantityPerRound = valueObj.dishQuantityPerRound
      const newDishQuantityPerRound = dishQuantityPerRound.map((item, i) => {
        if (i === dishQuantityLimitIndex) {
          const newSpecificDishLimit = item.specificDishLimit.filter(
            (_, _i) => _i !== optionIndex
          )
          return { ...item, specificDishLimit: newSpecificDishLimit }
        }
        return item
      })
      handleConfigChange(
        'dishQuantityPerRound',
        newDishQuantityPerRound,
        'dishQuantityPerRound'
      )
    }

  const removeSpecificTypeDishLimit =
    (dishQuantityLimitIndex, optionIndex, typeOptionIndex) => () => {
      const dishQuantityPerRound = valueObj.dishQuantityPerRound
      const newDishQuantityPerRound = dishQuantityPerRound.map((item, i) => {
        if (i === dishQuantityLimitIndex) {
          const newSpecificDishLimit = item.specificDishLimit.map(
            (each, _i) => {
              if (_i === optionIndex) {
                const newSpecificTypeDishLimit =
                  each.specificTypeDishLimit.filter(
                    (_, _i) => _i !== typeOptionIndex
                  )
                return {
                  ...each,
                  specificTypeDishLimit: newSpecificTypeDishLimit,
                }
              }
              return each
            }
          )
          return { ...item, specificDishLimit: newSpecificDishLimit }
        }
        return item
      })
      handleConfigChange(
        'dishQuantityPerRound',
        newDishQuantityPerRound,
        'dishQuantityPerRound'
      )
    }

  const removeSpecificPieceSameDishLimit =
    (dishQuantityLimitIndex, optionIndex, pieceOptionIndex) => () => {
      const dishQuantityPerRound = valueObj.dishQuantityPerRound
      const newDishQuantityPerRound = dishQuantityPerRound.map((item, i) => {
        if (i === dishQuantityLimitIndex) {
          const newSpecificDishLimit = item.specificDishLimit.map(
            (each, _i) => {
              if (_i === optionIndex) {
                const newSpecificPieceSameDishLimit =
                  each.specificPieceSameDishLimit.filter(
                    (_, _i) => _i !== pieceOptionIndex
                  )
                return {
                  ...each,
                  specificPieceSameDishLimit: newSpecificPieceSameDishLimit,
                }
              }
              return each
            }
          )
          return { ...item, specificDishLimit: newSpecificDishLimit }
        }
        return item
      })
      handleConfigChange(
        'dishQuantityPerRound',
        newDishQuantityPerRound,
        'dishQuantityPerRound'
      )
    }

  const onSpecificDishLimitChange =
    (dishQuantityLimitIndex, optionIndex, key) => (value) => {
      const dishQuantityPerRound = valueObj.dishQuantityPerRound
      const newDishQuantityPerRound = dishQuantityPerRound.map((item, i) => {
        if (i === dishQuantityLimitIndex) {
          const newSpecificDishLimit = item.specificDishLimit.map(
            (each, _i) => {
              if (_i === optionIndex) {
                let obj = { ...each, [key]: value }
                if (key === 'specificDishType') {
                  if (value === specificDishTypes.specificDish) {
                    obj.unit = specificDishUnits.pieces
                  } else if (
                    value === specificDishTypes.specificDishCollection
                  ) {
                    if (!obj.specificTypeDishLimit) {
                      obj.specificTypeDishLimit = [{}]
                    }
                    if (!obj.specificPieceSameDishLimit) {
                      obj.specificPieceSameDishLimit = [{}]
                    }
                  }
                }
                if (
                  key === 'dishes' &&
                  obj.specificDishType ===
                    specificDishTypes.specificDishCollection
                ) {
                  obj.specificTypeDishLimit = obj.specificTypeDishLimit?.map(
                    (item) => {
                      return {
                        ...item,
                        dishes: item.dishes?.filter((dishId) =>
                          value.includes(dishId)
                        ),
                      }
                    }
                  )
                  obj.specificPieceSameDishLimit =
                    obj.specificPieceSameDishLimit?.map((item) => {
                      return {
                        ...item,
                        dishes: item.dishes?.filter((dishId) =>
                          value.includes(dishId)
                        ),
                      }
                    })
                }
                return obj
              }
              return each
            }
          )
          return { ...item, specificDishLimit: newSpecificDishLimit }
        }
        return item
      })
      handleConfigChange(
        'dishQuantityPerRound',
        newDishQuantityPerRound,
        'dishQuantityPerRound'
      )
    }

  const onSpecificTypeDishLimitChange =
    (dishQuantityLimitIndex, optionIndex, typeOptionIndex, key) => (value) => {
      const dishQuantityPerRound = valueObj.dishQuantityPerRound
      const newDishQuantityPerRound = dishQuantityPerRound.map((item0, i0) => {
        if (i0 === dishQuantityLimitIndex) {
          const newSpecificDishLimit = item0.specificDishLimit.map(
            (item1, i1) => {
              if (i1 === optionIndex) {
                const specificTypeDishLimit = item1.specificTypeDishLimit.map(
                  (item2, i2) => {
                    if (i2 === typeOptionIndex) {
                      return { ...item2, [key]: value }
                    }
                    return item2
                  }
                )
                return {
                  ...item1,
                  specificTypeDishLimit: specificTypeDishLimit,
                }
              }
              return item1
            }
          )
          return { ...item0, specificDishLimit: newSpecificDishLimit }
        }
        return item0
      })
      handleConfigChange(
        'dishQuantityPerRound',
        newDishQuantityPerRound,
        'dishQuantityPerRound'
      )
    }

  const onSpecificPieceSameDishLimitChange =
    (dishQuantityLimitIndex, optionIndex, pieceOptionIndex, key) => (value) => {
      const dishQuantityPerRound = valueObj.dishQuantityPerRound
      const newDishQuantityPerRound = dishQuantityPerRound.map((item0, i0) => {
        if (i0 === dishQuantityLimitIndex) {
          const newSpecificDishLimit = item0.specificDishLimit.map(
            (item1, i1) => {
              if (i1 === optionIndex) {
                const specificPieceSameDishLimit =
                  item1.specificPieceSameDishLimit.map((item2, i2) => {
                    if (i2 === pieceOptionIndex) {
                      return { ...item2, [key]: value }
                    }
                    return item2
                  })
                return {
                  ...item1,
                  specificPieceSameDishLimit: specificPieceSameDishLimit,
                }
              }
              return item1
            }
          )
          return { ...item0, specificDishLimit: newSpecificDishLimit }
        }
        return item0
      })
      handleConfigChange(
        'dishQuantityPerRound',
        newDishQuantityPerRound,
        'dishQuantityPerRound'
      )
    }

  const removeDishQuantityPerRoundOption = (index) => () => {
    const dishQuantityPerRound = valueObj.dishQuantityPerRound
    const prevItem = dishQuantityPerRound[index - 1]
    const after = prevItem.before ? prevItem.before + 1 : undefined

    const newDishQuantityPerRound = dishQuantityPerRound.map((item, i) => {
      if (i <= index) return item

      return {
        ...item,
        before: undefined,
        after: i === index + 1 ? after : undefined,
      }
    })

    newDishQuantityPerRound.splice(index, 1)
    handleConfigChange(
      'dishQuantityPerRound',
      newDishQuantityPerRound,
      'dishQuantityPerRound'
    )
  }

  const renderSpecificDishQuantityPerRoundOptions = (
    options,
    dishQuantityLimitIndex,
    perType
  ) => {
    if (!(options?.length >= 1)) {
      // 兼容老数据没有指定菜品限制的情况
      addSpecificDishLimit(dishQuantityLimitIndex)()
      return null
    }

    const specificDishTypeOptions = limitConfigMap.specificDishType
    const specificDishUnitOptions = limitConfigMap.specificDishUnit

    return (
      <Box>
        {options.map((item, index) => {
          // 兼容老数据
          const currentPerType = item.perType ?? perType

          if (typeof item.perType === 'undefined') {
            onSpecificDishLimitChange(
              dishQuantityLimitIndex,
              index,
              'perType'
            )(perType)
          }
          if (typeof item.specificDishType === 'undefined') {
            onSpecificDishLimitChange(
              dishQuantityLimitIndex,
              index,
              'specificDishType'
            )(specificDishTypeOptions[0].value)
          }
          if (typeof item.unit === 'undefined') {
            onSpecificDishLimitChange(
              dishQuantityLimitIndex,
              index,
              'unit'
            )(specificDishUnitOptions[0].value)
          }

          if (
            item.specificDishType === specificDishTypes.specificDishCollection
          ) {
            if (!item.specificTypeDishLimit) {
              addSpecificTypeDishLimit(dishQuantityLimitIndex, index)()
            }
            if (!item.specificPieceSameDishLimit) {
              addSpecificPieceSameDishLimit(dishQuantityLimitIndex, index)()
            }
          }

          return (
            <React.Fragment key={index}>
              <Box className={styles.specificDishLimit}>
                <Box>
                  <Trans
                    t={t}
                    i18nKey="SystemSetting.dishQuantityPerRoundSpecificDishLimit"
                    components={[
                      <Select
                        dropdownMatchSelectWidth={false}
                        options={perTypeOptions}
                        value={currentPerType}
                        onChange={onSpecificDishLimitChange(
                          dishQuantityLimitIndex,
                          index,
                          'perType'
                        )}
                        key="perType"
                      />,
                      <Select
                        dropdownMatchSelectWidth={false}
                        options={specificDishTypeOptions}
                        value={item.specificDishType}
                        onChange={onSpecificDishLimitChange(
                          dishQuantityLimitIndex,
                          index,
                          'specificDishType'
                        )}
                        key="specificDishType"
                      />,
                      <TreeSelectDish
                        className={styles.specificDishLimitTreeSelect}
                        dropdownStyle={{
                          minWidth: 600,
                        }}
                        maxTagCount="responsive"
                        value={item.dishes}
                        treeData={filterMenuById(
                          treeData,
                          options,
                          index,
                          'dishes'
                        )}
                        onChange={onSpecificDishLimitChange(
                          dishQuantityLimitIndex,
                          index,
                          'dishes'
                        )}
                        key="treeSelectDish"
                      />,
                      <InputNumber
                        value={item.quantity}
                        min={0}
                        onChange={onSpecificDishLimitChange(
                          dishQuantityLimitIndex,
                          index,
                          'quantity'
                        )}
                        key="inputNumber"
                      />,
                      <Select
                        dropdownMatchSelectWidth={false}
                        options={specificDishUnitOptions}
                        value={item.unit}
                        disabled={
                          item.specificDishType !==
                          specificDishTypes.specificDishCollection
                        }
                        onChange={onSpecificDishLimitChange(
                          dishQuantityLimitIndex,
                          index,
                          'unit'
                        )}
                        key="unit"
                      />,
                    ]}
                  />
                </Box>
                <Box className={styles.specificDishLimitBtns}>
                  <Button
                    type="link"
                    size="small"
                    className={options.length > 1 ? '' : styles.btnHidden}
                    onClick={removeSpecificDishLimit(
                      dishQuantityLimitIndex,
                      index
                    )}
                  >
                    {t('SystemSetting.delete')}
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    onClick={addSpecificDishLimit(dishQuantityLimitIndex)}
                    className={
                      options.length - 1 === index ? '' : styles.btnHidden
                    }
                  >
                    {t('SystemSetting.add')}
                  </Button>
                </Box>
              </Box>
              {item.specificDishType ===
                specificDishTypes.specificDishCollection &&
                item.unit === specificDishUnits.types && (
                  <Box className={styles.specificTypeDishLimitBox}>
                    {item.specificTypeDishLimit?.map((_item, _index) => {
                      const _treeData = treeData.reduce((preV, curV) => {
                        const r = curV.children.reduce((preV, curV) => {
                          const r = curV.children.reduce((preV, curV) => {
                            if (item.dishes?.includes(curV.value)) {
                              preV.push(curV)
                            }
                            return preV
                          }, [])
                          if (r.length > 0) {
                            preV.push({
                              ...curV,
                              children: r,
                            })
                          }
                          return preV
                        }, [])
                        if (r.length > 0) {
                          preV.push({
                            ...curV,
                            children: r,
                          })
                        }
                        return preV
                      }, [])
                      return (
                        <Box
                          className={styles.specificTypeDishLimit}
                          key={_index}
                        >
                          <Box>
                            <Trans
                              t={t}
                              i18nKey="SystemSetting.dishQuantityPerRoundSpecificTypeDishLimit"
                              components={[
                                <TreeSelectDish
                                  className={
                                    styles.specificTypeDishLimitTreeSelect
                                  }
                                  dropdownStyle={{
                                    minWidth: 600,
                                  }}
                                  maxTagCount="responsive"
                                  value={_item.dishes}
                                  treeData={filterMenuById(
                                    _treeData,
                                    item.specificTypeDishLimit,
                                    _index,
                                    'dishes'
                                  )}
                                  onChange={onSpecificTypeDishLimitChange(
                                    dishQuantityLimitIndex,
                                    index,
                                    _index,
                                    'dishes'
                                  )}
                                  key="treeSelectDish"
                                />,
                                <InputNumber
                                  min={0}
                                  value={_item.quantity}
                                  onChange={onSpecificTypeDishLimitChange(
                                    dishQuantityLimitIndex,
                                    index,
                                    _index,
                                    'quantity'
                                  )}
                                  key="inputNumber"
                                />,
                              ]}
                            />
                          </Box>
                          <Box className={styles.specificTypeDishLimitBtns}>
                            <Button
                              type="link"
                              size="small"
                              className={
                                item.specificTypeDishLimit.length > 1
                                  ? ''
                                  : styles.btnHidden
                              }
                              onClick={removeSpecificTypeDishLimit(
                                dishQuantityLimitIndex,
                                index,
                                _index
                              )}
                            >
                              {t('SystemSetting.delete')}
                            </Button>
                            <Button
                              type="link"
                              size="small"
                              onClick={addSpecificTypeDishLimit(
                                dishQuantityLimitIndex,
                                index
                              )}
                              className={
                                item.specificTypeDishLimit.length - 1 === _index
                                  ? ''
                                  : styles.btnHidden
                              }
                            >
                              {t('SystemSetting.add')}
                            </Button>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )}
              {item.specificDishType ===
                specificDishTypes.specificDishCollection &&
                item.unit === specificDishUnits.pieces && (
                  <Box className={styles.specificPieceSameDishLimitBox}>
                    {item.specificPieceSameDishLimit?.map((_item, _index) => {
                      const _treeData = treeData.reduce((preV, curV) => {
                        const r = curV.children.reduce((preV, curV) => {
                          const r = curV.children.reduce((preV, curV) => {
                            if (item.dishes?.includes(curV.value)) {
                              preV.push(curV)
                            }
                            return preV
                          }, [])
                          if (r.length > 0) {
                            preV.push({
                              ...curV,
                              children: r,
                            })
                          }
                          return preV
                        }, [])
                        if (r.length > 0) {
                          preV.push({
                            ...curV,
                            children: r,
                          })
                        }
                        return preV
                      }, [])
                      return (
                        <Box
                          className={styles.specificPieceSameDishLimit}
                          key={_index}
                        >
                          <Box>
                            <Trans
                              t={t}
                              i18nKey="SystemSetting.dishQuantityPerRoundSpecificPieceSameDishLimit"
                              components={[
                                <TreeSelectDish
                                  className={
                                    styles.specificPieceSameDishLimitTreeSelect
                                  }
                                  dropdownStyle={{
                                    minWidth: 600,
                                  }}
                                  maxTagCount="responsive"
                                  value={_item.dishes}
                                  treeData={filterMenuById(
                                    _treeData,
                                    item.specificPieceSameDishLimit,
                                    _index,
                                    'dishes'
                                  )}
                                  onChange={onSpecificPieceSameDishLimitChange(
                                    dishQuantityLimitIndex,
                                    index,
                                    _index,
                                    'dishes'
                                  )}
                                  key="treeSelectDish"
                                />,
                                <InputNumber
                                  min={0}
                                  value={_item.quantity}
                                  onChange={onSpecificPieceSameDishLimitChange(
                                    dishQuantityLimitIndex,
                                    index,
                                    _index,
                                    'quantity'
                                  )}
                                  key="inputNumber"
                                />,
                              ]}
                            />
                          </Box>
                          <Box
                            className={styles.specificPieceSameDishLimitBtns}
                          >
                            <Button
                              type="link"
                              size="small"
                              className={
                                item.specificPieceSameDishLimit.length > 1
                                  ? ''
                                  : styles.btnHidden
                              }
                              onClick={removeSpecificPieceSameDishLimit(
                                dishQuantityLimitIndex,
                                index,
                                _index
                              )}
                            >
                              {t('SystemSetting.delete')}
                            </Button>
                            <Button
                              type="link"
                              size="small"
                              onClick={addSpecificPieceSameDishLimit(
                                dishQuantityLimitIndex,
                                index
                              )}
                              className={
                                item.specificPieceSameDishLimit.length - 1 ===
                                _index
                                  ? ''
                                  : styles.btnHidden
                              }
                            >
                              {t('SystemSetting.add')}
                            </Button>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )}
            </React.Fragment>
          )
        })}
      </Box>
    )
  }

  if (!(length >= 2)) {
    handleConfigChange(
      'dishQuantityPerRound',
      [{ specificDishLimit: [{}] }, { specificDishLimit: [{}] }],
      'dishQuantityPerRound'
    )
    return null
  }

  const perTypeOptions = limitConfigMap.perType

  return (
    <Box className={styles.dishQuantityPerRoundOption}>
      <Box className={styles.title}>
        <Title level={5}>
          {t('SystemSetting.dishQuantityPerRoundOptionTitle')}
        </Title>
        <Button
          type="link"
          size="small"
          onClick={addDishQuantityPerRoundOption}
        >
          {t('SystemSetting.add')}
        </Button>
      </Box>
      <Box className={styles.options}>
        {dishQuantityPerRound.map((item, index) => {
          dishQuantityPerRound
          const currentPerType = item.perType ?? perTypeOptions[0].value

          if (typeof item.perType === 'undefined') {
            onDishQuantityPerRoundChange(
              index,
              'perType'
            )(perTypeOptions[0].value)
          }

          return (
            <Box className={styles.optionItem} key={index}>
              <Card variant="outlined" className={styles.optionItemCard}>
                <CardContent className={styles.optionItemLeft}>
                  <Box>{renderLimitComponent(item, index)}</Box>
                  <Box className={styles.totalDishLimit}>
                    <Box>
                      <Trans
                        t={t}
                        i18nKey="SystemSetting.dishQuantityPerRoundLimit"
                        components={[
                          <Select
                            options={perTypeOptions}
                            dropdownMatchSelectWidth={false}
                            value={item.perType}
                            onChange={onDishQuantityPerRoundChange(
                              index,
                              'perType'
                            )}
                            key="perType"
                          />,
                          <InputNumber
                            value={item.minCount}
                            min={0}
                            onChange={onDishQuantityPerRoundChange(
                              index,
                              'minCount'
                            )}
                            key="inputNumber_minCount"
                          />,
                          <InputNumber
                            value={item.maxCount}
                            min={0}
                            onChange={onDishQuantityPerRoundChange(
                              index,
                              'maxCount'
                            )}
                            key="inputNumber_maxCount"
                          />,
                        ]}
                      />
                    </Box>
                    <Box>
                      {item.perType === perTypes.perPerson_perRound && (
                        <Trans
                          t={t}
                          i18nKey="SystemSetting.dishQuantityPerRoundLimitExtra"
                          components={[
                            <InputNumber
                              value={item.minCountPerRound}
                              min={0}
                              onChange={onDishQuantityPerRoundChange(
                                index,
                                'minCountPerRound'
                              )}
                              key="inputNumber_minCountPerRound"
                            />,
                            <InputNumber
                              value={item.maxCountPerRound}
                              min={0}
                              onChange={onDishQuantityPerRoundChange(
                                index,
                                'maxCountPerRound'
                              )}
                              key="inputNumber_maxCountPerRound"
                            />,
                          ]}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box className={styles.optionItemLeftBottom}>
                    {renderSpecificDishQuantityPerRoundOptions(
                      item.specificDishLimit,
                      index,
                      currentPerType
                    )}
                  </Box>
                </CardContent>
              </Card>
              <Box className={styles.optionItemAction}>
                {index !== 0 && index + 1 !== length && (
                  <Button
                    type="link"
                    size="small"
                    onClick={removeDishQuantityPerRoundOption(index)}
                  >
                    {t('SystemSetting.delete')}
                  </Button>
                )}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default DishQuantityPerRoundConfig
