import { Form, Input, Select } from 'antd'
import { labelsType, layout } from '@/constants/systemConfig'
import UploadWithForm from '@/components/common/UploadWithForm'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import TreeSelectDish from '@/components/ConfigCommon/TreeSelectDish'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useMount } from 'ahooks'

const { Item } = Form
const { Option } = Select

const AddLabelForm = (props) => {
  const { form, value } = props
  const { t } = useTranslation()

  const type = Form.useWatch('type', form)

  const { treeData: allMenuTree, runGetMenus } = useSetMenus()

  useMount(() => {
    runGetMenus()
  })

  const treeData = useMemo(() => {
    return allMenuTree.filter((group) => group.name !== 'ALL_YOU_CAN_EAT')
  }, [allMenuTree])

  return (
    <Form
      {...layout}
      initialValues={value}
      form={form}
      labelWrap
      name="labelsSetting"
    >
      <Item
        label={t('labels.name')}
        name="name"
        rules={[{ required: true, message: `${t('labels.nameTip')}` }]}
      >
        <Input />
      </Item>
      <Item
        label={t('labels.type')}
        name="type"
        rules={[{ required: true, message: `${t('labels.typeTip')}` }]}
      >
        <Select>
          {labelsType.map((each) => {
            return (
              <Option key={each} value={each}>
                {t(`labels.${each}`)}
              </Option>
            )
          })}
        </Select>
      </Item>
      {type === 'picture' && (
        <Item
          label={t('labels.picture')}
          name="picture"
          rules={[{ required: true, message: `${t('labels.pictureTip')}` }]}
        >
          <UploadWithForm />
        </Item>
      )}
      <Item
        label={t('labels.dishIds')}
        name="dishIds"
        rules={[{ required: true, message: `${t('labels.dishTip')}` }]}
      >
        <TreeSelectDish treeData={treeData} showSearch listHeight={300} />
      </Item>
    </Form>
  )
}

export default AddLabelForm
