import { Box } from '@material-ui/core'
import styles from './CombinationDishConfig.module.less'
import { Trans, useTranslation } from 'react-i18next'
import { Card, CardContent } from '@material-ui/core'
import { Button, InputNumber } from 'antd'
import { filterMenuById } from '@/utils/filterMenu'

import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import { combinationDish } from '@/constants/systemConfig'

const CombinationDishConfig = ({ valueObj, handleConfigChange, treeData }) => {
  const { t } = useTranslation()

  const combinationDishOptions = valueObj?.combinationDish || []

  const addCombinationDish = () => {
    handleConfigChange(
      combinationDish.key,
      [...combinationDishOptions, { dishA: [], dishB: [] }],
      'combinationDish'
    )
  }

  const removeCombinationDish = (index) => () => {
    const newCombinationDishOptions = combinationDishOptions.filter(
      (_, i) => i !== index
    )
    handleConfigChange(
      combinationDish.key,
      newCombinationDishOptions,
      'combinationDish'
    )
  }

  const onCombinationDishChange = (index, key) => (value) => {
    handleConfigChange(
      combinationDish.key,
      combinationDishOptions.map((item, i) => {
        if (i === index) {
          return { ...item, [key]: value }
        }
        return item
      }),
      'combinationDish'
    )
  }

  return (
    <Box className={styles.combinationDishConfig}>
      <Box className={styles.options}>
        {combinationDishOptions.map((item, index) => {
          return (
            <Box className={styles.optionItem} key={index}>
              <Card variant="outlined" className={styles.optionItemCard}>
                <CardContent className={styles.optionItemLeft}>
                  <Box>{t('SystemSetting.combination_order_dishes')}</Box>
                  <Box>
                    <TreeSelectDish
                      value={item.dishA}
                      treeData={filterMenuById(
                        treeData,
                        combinationDishOptions,
                        index,
                        'dishA'
                      )}
                      onChange={onCombinationDishChange(index, 'dishA')}
                    />
                  </Box>
                  <Box>
                    <Trans
                      t={t}
                      i18nKey="SystemSetting.combination_order_include_dishes"
                      components={[
                        <InputNumber
                          value={item.dishBCount}
                          size="small"
                          onChange={onCombinationDishChange(
                            index,
                            'dishBCount'
                          )}
                          key="inputNumber"
                        />,
                      ]}
                    />
                  </Box>
                  <Box>
                    <TreeSelectDish
                      value={item.dishB}
                      treeData={filterMenuById(
                        treeData,
                        [{ dishes: item.dishA }],
                        -1,
                        'dishes'
                      )}
                      onChange={onCombinationDishChange(index, 'dishB')}
                    />
                  </Box>
                </CardContent>
              </Card>
              <Box className={styles.optionItemAction}>
                <Button
                  type="link"
                  size="small"
                  className={
                    combinationDishOptions.length > 1 ? '' : styles.btnHidden
                  }
                  onClick={removeCombinationDish(index)}
                >
                  {t('SystemSetting.delete')}
                </Button>
                <Button
                  type="link"
                  size="small"
                  className={
                    index === combinationDishOptions.length - 1
                      ? ''
                      : styles.btnHidden
                  }
                  onClick={addCombinationDish}
                >
                  {t('SystemSetting.add')}
                </Button>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default CombinationDishConfig
