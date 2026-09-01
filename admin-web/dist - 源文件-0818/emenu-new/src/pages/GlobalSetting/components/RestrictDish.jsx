import { Card, Space } from 'antd'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useTranslation } from 'react-i18next'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'

const configId = 1

const RestrictDish = (props) => {
  const { t } = useTranslation()
  const { treeData } = props
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()

  const restrictDish = getGlobalConfig(configId)
  const isBrandOpen = getGlobalConfig(13)?.open
  const isMenuClassifyOpen = getGlobalConfig(52)?.open

  return (
    <Space direction="vertical" style={{ display: 'flex' }} size={32}>
      <Card title={t('SystemSetting.orderLimitItem')}>
        <TreeSelectDish
          onChange={(newValue) => changeGlobalConfig(configId, newValue)}
          treeData={treeData}
          value={restrictDish}
          disabled={isBrandOpen || isMenuClassifyOpen}
        />
      </Card>
    </Space>
  )
}

export default RestrictDish
