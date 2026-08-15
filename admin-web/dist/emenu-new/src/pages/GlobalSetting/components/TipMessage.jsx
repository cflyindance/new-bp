import { Form, Input, Typography, Space } from 'antd'
import useSystemConfig from '@/hooks/useSystemConfig'
import styles from './TipMessage.module.less'
import { useTranslation } from 'react-i18next'

const { Item } = Form
const { TextArea } = Input

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 12 },
}

const { Title } = Typography

const configId = 4

const TipMessage = () => {
  const { t } = useTranslation()
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()
  const tipMessageConfig = getGlobalConfig(configId)

  const changeContent = (newVal, key) => {
    changeGlobalConfig(configId, {
      ...tipMessageConfig,
      [key]: newVal,
    })
  }

  return (
    <div className={styles.tipMessageWrapper}>
      <Form {...formItemLayout}>
        <Space direction="vertical" size={24}>
          <div>
            <Title level={3}>{t('SystemSetting.orderInstruction')}</Title>
            <Item label={t('SystemSetting.title')}>
              <Input
                showCount
                maxLength={20}
                value={tipMessageConfig?.orderTipTitle}
                onChange={(e) => changeContent(e.target.value, 'orderTipTitle')}
              />
            </Item>
            <Item label={t('SystemSetting.content')}>
              <TextArea
                showCount
                rows={5}
                maxLength={200}
                value={tipMessageConfig?.orderTipContent}
                onChange={(e) =>
                  changeContent(e.target.value, 'orderTipContent')
                }
              />
            </Item>
          </div>
          <div>
            <Title level={3}>{t('SystemSetting.hotPotInstruction')}</Title>
            <Item label={`${t('SystemSetting.title')}1`}>
              <Input
                showCount
                maxLength={20}
                value={tipMessageConfig?.hotPotFirstTitle}
                onChange={(e) =>
                  changeContent(e.target.value, 'hotPotFirstTitle')
                }
              />
            </Item>
            <Item label={`${t('SystemSetting.content')}1`}>
              <TextArea
                showCount
                rows={5}
                maxLength={200}
                value={tipMessageConfig?.hotPotFirstContent}
                onChange={(e) =>
                  changeContent(e.target.value, 'hotPotFirstContent')
                }
              />
            </Item>
            <Item label={`${t('SystemSetting.title')}2`}>
              <Input
                showCount
                maxLength={20}
                value={tipMessageConfig?.hotPotSecondTitle}
                onChange={(e) =>
                  changeContent(e.target.value, 'hotPotSecondTitle')
                }
              />
            </Item>
            <Item label={`${t('SystemSetting.content')}2`}>
              <TextArea
                showCount
                rows={5}
                maxLength={200}
                value={tipMessageConfig?.hotPotSecondContent}
                onChange={(e) =>
                  changeContent(e.target.value, 'hotPotSecondContent')
                }
              />
            </Item>
          </div>
        </Space>
      </Form>
    </div>
  )
}

export default TipMessage
