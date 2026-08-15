import { Button, Card, InputNumber, Typography } from 'antd'
import { Box } from '@material-ui/core'
import { filterMenuById } from '@/utils/filterMenu'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useTranslation } from 'react-i18next'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'

const newItem = {
  time: 0,
  type: 'minutes',
  dishes: [],
}

const configId = 2

const DelaySendDish = (props) => {
  const { t } = useTranslation()
  const { treeData } = props
  const { Text } = Typography
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()
  const allDelaySendDish = getGlobalConfig(configId) || []

  const addDelaySendDish = () => {
    changeGlobalConfig(configId, [...allDelaySendDish, newItem])
  }

  const removeDelaySendDish = (idx) => {
    const afterFiltered = allDelaySendDish.filter((_, index) => index !== idx)
    changeGlobalConfig(configId, afterFiltered)
  }

  const onChange = (idx, value, key) => {
    const afterChangeDelay = allDelaySendDish.map((each, i) => {
      return i === idx
        ? {
            ...each,
            [key]: value,
          }
        : each
    })
    changeGlobalConfig(configId, afterChangeDelay)
  }

  return (
    <Card
      title={t('SystemSetting.sendDelayItem')}
      extra={
        <Button type="link" size="small" onClick={addDelaySendDish}>
          {t('SystemSetting.add')}
        </Button>
      }
    >
      {allDelaySendDish?.map((each, idx) => (
        <Card
          key={idx}
          type="inner"
          title={
            <Box display="flex" alignItems="center">
              <Text>{t('SystemSetting.delayTime')}：</Text>
              <InputNumber
                onChange={(value) => onChange(idx, value ?? 0, 'time')}
                addonAfter={t('SystemSetting.delayTime_addonAfter')}
                value={each.time}
                size="small"
                min={0}
                max={200}
                precision={0}
                style={{
                  width: 120,
                  marginRight: 12,
                }}
              />
              {each.time === 0 && (
                <Text type="warning"> {t('SystemSetting.setZero')}</Text>
              )}
            </Box>
          }
          extra={
            <Button
              type="link"
              size="small"
              onClick={() => removeDelaySendDish(idx)}
            >
              {t('SystemSetting.delete')}
            </Button>
          }
          style={{
            marginBottom: 24,
          }}
        >
          <TreeSelectDish
            onChange={(value) => onChange(idx, value, 'dishes')}
            treeData={filterMenuById(treeData, allDelaySendDish, idx, 'dishes')}
            value={each.dishes}
          />
        </Card>
      ))}
    </Card>
  )
}

export default DelaySendDish
