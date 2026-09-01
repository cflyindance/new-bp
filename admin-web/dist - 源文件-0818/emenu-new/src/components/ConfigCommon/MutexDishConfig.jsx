import { Box } from '@material-ui/core'
import styles from './MutexDishConfig.module.less'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@material-ui/core'
import { Button } from 'antd'
import { filterMenuById } from '@/utils/filterMenu'

import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import { mutexDish } from '@/constants/systemConfig'
import { useMemo } from 'react'

const MutexDishConfig = ({ valueObj, handleConfigChange, treeData }) => {
  const { t } = useTranslation()

  const mutexDishOptions = valueObj?.mutexDish || []
  const treeDataMutexDishOptions = useMemo(() => {
    return mutexDishOptions.reduce((acc, item) => {
      acc.push({
        dishes: [...item.dishA],
      })
      acc.push({
        dishes: [...item.dishB],
      })
      return acc
    }, [])
  }, [mutexDishOptions])

  const addMutexDish = () => {
    handleConfigChange(
      mutexDish.key,
      [...mutexDishOptions, { dishA: [], dishB: [] }],
      'mutexDish'
    )
  }

  const removeMutexDish = (index) => () => {
    const newMutexDishOptions = mutexDishOptions.filter((_, i) => i !== index)
    handleConfigChange(mutexDish.key, newMutexDishOptions, 'mutexDish')
  }

  const onMutexDishChange = (index, key) => (value) => {
    handleConfigChange(
      mutexDish.key,
      mutexDishOptions.map((item, i) => {
        if (i === index) {
          return { ...item, [key]: value }
        }
        return item
      }),
      'mutexDish'
    )
  }

  return (
    <Box className={styles.mutexDishConfig}>
      <Box className={styles.options}>
        {mutexDishOptions.map((item, index) => {
          return (
            <Box className={styles.optionItem} key={index}>
              <Card variant="outlined" className={styles.optionItemCard}>
                <CardContent className={styles.optionItemLeft}>
                  <Box>
                    <TreeSelectDish
                      value={item.dishA}
                      treeData={filterMenuById(
                        treeData,
                        treeDataMutexDishOptions,
                        index * 2,
                        'dishes'
                      )}
                      onChange={onMutexDishChange(index, 'dishA')}
                    />
                  </Box>
                  <Box>{t('SystemSetting.mutex')}</Box>
                  <Box>
                    <TreeSelectDish
                      value={item.dishB}
                      treeData={filterMenuById(
                        treeData,
                        treeDataMutexDishOptions,
                        index * 2 + 1,
                        'dishes'
                      )}
                      onChange={onMutexDishChange(index, 'dishB')}
                    />
                  </Box>
                </CardContent>
              </Card>
              <Box className={styles.optionItemAction}>
                <Button
                  type="link"
                  size="small"
                  className={
                    mutexDishOptions.length > 1 ? '' : styles.btnHidden
                  }
                  onClick={removeMutexDish(index)}
                >
                  {t('SystemSetting.delete')}
                </Button>
                <Button
                  type="link"
                  size="small"
                  className={
                    index === mutexDishOptions.length - 1
                      ? ''
                      : styles.btnHidden
                  }
                  onClick={addMutexDish}
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

export default MutexDishConfig
