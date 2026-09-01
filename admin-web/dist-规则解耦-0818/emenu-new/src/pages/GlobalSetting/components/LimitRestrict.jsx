import { Button, Card, InputNumber, Space, Typography } from 'antd'
import { Box } from '@material-ui/core'
import { filterMenuById } from '@/utils/filterMenu'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useTranslation } from 'react-i18next'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import { limitRestrictMap } from '@/constants/systemConfig'

const newItem = {
  quantity: 1,
  dishes: [],
}

// const configId = 3

const LimitRestrict = (props) => {
  const { t } = useTranslation()
  const { treeData } = props
  const { Text } = Typography
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()

  const addLimitQuantityDish = (params) => {
    const limitConfig = getGlobalConfig(params.id) || []
    changeGlobalConfig(params.id, [...limitConfig, newItem])
  }

  const removeLimitQuantityDish = (params, idx) => {
    const limitConfig = getGlobalConfig(params.id) || []
    const afterFiltered = limitConfig.filter((_, index) => index !== idx)
    changeGlobalConfig(params.id, afterFiltered)
  }

  const onChange = (idx, value, key, params) => {
    const limitConfig = getGlobalConfig(params.id) || []
    const afterChangeLimit = limitConfig.map((each, i) => {
      return i === idx
        ? {
            ...each,
            [key]: value,
          }
        : each
    })
    changeGlobalConfig(params.id, afterChangeLimit)
  }

  return (
    <Space direction="vertical" style={{ display: 'flex' }} size={32}>
      {limitRestrictMap?.map((each) => (
        <Card
          title={t(`SystemSetting.${each.key}_title`)}
          key={each.id}
          extra={
            <Button
              type="link"
              size="small"
              onClick={() => {
                addLimitQuantityDish(each)
              }}
            >
              {t('SystemSetting.add')}
            </Button>
          }
        >
          {(getGlobalConfig(each.id) || []).map((item, idx) => {
            return (
              <Card
                key={each.id}
                type="inner"
                title={
                  <Box display="flex" alignItems="center">
                    <Text> {t(`SystemSetting.${each.key}_content`)}：</Text>
                    <InputNumber
                      onChange={(value) =>
                        onChange(idx, value ?? 1, 'quantity', each)
                      }
                      addonAfter={t('Order.pieces')}
                      value={item.quantity}
                      size="small"
                      min={1}
                      precision={0}
                      max={200}
                      style={{
                        width: 120,
                        marginRight: 12,
                      }}
                    />
                  </Box>
                }
                extra={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => removeLimitQuantityDish(each, idx)}
                  >
                    {t('SystemSetting.delete')}
                  </Button>
                }
                style={{
                  marginBottom: 24,
                }}
              >
                <TreeSelectDish
                  onChange={(value) => onChange(idx, value, 'dishes', each)}
                  treeData={filterMenuById(
                    treeData,
                    getGlobalConfig(each.id) || [],
                    idx,
                    'dishes'
                  )}
                  value={item.dishes}
                />
              </Card>
            )
          })}
        </Card>
      ))}
    </Space>
  )
}

export default LimitRestrict
