import { Box } from '@material-ui/core'
import styles from './CustomDishOrderMessagesConfig.module.less'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@material-ui/core'
import { Button, Input } from 'antd'
import { filterMenuById } from '@/utils/filterMenu'

import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import { customDishOrderMessages } from '@/constants/systemConfig'

const CustomDishOrderMessagesConfig = ({
  valueObj,
  handleConfigChange,
  treeData,
}) => {
  const { t } = useTranslation()

  const customDishOrderMessagesOptions = valueObj?.customDishOrderMessages || []

  const addCustomDishOrderMessage = () => {
    handleConfigChange(customDishOrderMessages.id, {
      ...valueObj,
      customDishOrderMessages: [...customDishOrderMessagesOptions, {}],
    })
  }

  const removeCustomDishOrderMessage = (index) => () => {
    handleConfigChange(customDishOrderMessages.id, {
      ...valueObj,
      customDishOrderMessages: customDishOrderMessagesOptions.filter(
        (_, i) => i !== index
      ),
    })
  }

  const onCustomDishOrderMessageChange = (index, key) => (value) => {
    handleConfigChange(customDishOrderMessages.id, {
      ...valueObj,
      customDishOrderMessages: customDishOrderMessagesOptions.map((item, i) => {
        if (i === index) {
          return { ...item, [key]: value }
        }
        return item
      }),
    })
  }

  return (
    <Box className={styles.customDishOrderMessagesConfig}>
      <Box className={styles.options}>
        {customDishOrderMessagesOptions.map((item, index) => {
          return (
            <Box className={styles.optionItem} key={index}>
              <Card variant="outlined" className={styles.optionItemCard}>
                <CardContent className={styles.optionItemLeft}>
                  <Box>
                    {t('SystemSetting.customDishOrderMessages_message')}
                  </Box>
                  <Box>
                    <Input
                      value={item.message || ''}
                      onChange={(e) =>
                        onCustomDishOrderMessageChange(
                          index,
                          'message'
                        )(e.target.value)
                      }
                    />
                  </Box>
                  <Box>{t('SystemSetting.customDishOrderMessages_dish')}</Box>
                  <Box>
                    <TreeSelectDish
                      value={item.dishes}
                      treeData={filterMenuById(
                        treeData,
                        customDishOrderMessagesOptions,
                        index,
                        'dishes'
                      )}
                      onChange={onCustomDishOrderMessageChange(index, 'dishes')}
                    />
                  </Box>
                </CardContent>
              </Card>
              <Box className={styles.optionItemAction}>
                <Button
                  type="link"
                  size="small"
                  className={
                    customDishOrderMessagesOptions.length > 1
                      ? ''
                      : styles.btnHidden
                  }
                  onClick={removeCustomDishOrderMessage(index)}
                >
                  {t('SystemSetting.delete')}
                </Button>
                <Button
                  type="link"
                  size="small"
                  className={
                    index === customDishOrderMessagesOptions.length - 1
                      ? ''
                      : styles.btnHidden
                  }
                  onClick={addCustomDishOrderMessage}
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

export default CustomDishOrderMessagesConfig
