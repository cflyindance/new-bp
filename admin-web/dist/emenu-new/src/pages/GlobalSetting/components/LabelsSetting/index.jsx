import { useMemo, useState } from 'react'
import styles from './index.module.less'
import { Button, Form, Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import { useBoolean } from 'ahooks'
import useSetGlobalConfigItem from '@/hooks/useSystemConfig'
import AddLabelForm from './AddLabelForm'
import { nanoid } from 'nanoid'
import ImgFallback from '@/components/common/ImgFallback'
import { serverUrl } from '@/utils/env_var'

const initialValue = {
  name: null,
  type: null,
  picture: null,
  dishIds: [],
  id: null,
}

const LabelsSetting = () => {
  const { t } = useTranslation()
  const [labelsSetting, { setTrue, setFalse }] = useBoolean()
  const { getGlobalConfig, changeGlobalConfig } = useSetGlobalConfigItem()
  const [form] = Form.useForm()
  const [value, setValue] = useState(initialValue)
  const oldVal = getGlobalConfig(31)

  const dataList = useMemo(() => {
    return oldVal?.labelsSetting || []
  }, [oldVal])

  const handleAddLabels = () => {
    setTrue()
  }

  const handleEditTag = (item) => {
    setValue(item)
    form.setFieldsValue(item)
    setTrue()
  }

  const handleCloseLabelsModal = () => {
    setFalse()
  }

  const handleRemoveTag = (item) => {
    const { id } = item
    const newDataList = dataList.filter((each) => each.id !== id)
    changeGlobalConfig(31, {
      ...oldVal,
      labelsSetting: newDataList,
    })
  }

  const handleSaveLabels = async () => {
    try {
      const res = await form.validateFields()
      if (value.id) {
        const newData = dataList?.map((each) => {
          if (each.id === value?.id) {
            return { ...res, id: value.id }
          }
          return each
        })
        changeGlobalConfig(31, { ...oldVal, labelsSetting: newData })
      } else {
        // 新增
        changeGlobalConfig(31, {
          ...oldVal,
          labelsSetting: [...dataList, { ...res, id: nanoid() }],
        })
      }
      handleCloseLabelsModal()
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <>
      <div className={styles.labelSetting}>
        <div className={styles.operationRow}>
          <Button
            type="primary"
            className={styles.add}
            onClick={handleAddLabels}
          >
            {t('labels.add')}
          </Button>
        </div>
        <div className={styles.listWrapper}>
          {dataList.map((each) => {
            return (
              <div className={styles.labelItem} key={each.id}>
                <div className={styles.basicRow}>
                  <div className={styles.namePic}>
                    <span>{each.name}</span>
                    {each.type === 'picture' && (
                      <ImgFallback
                        src={serverUrl + `${each.picture}`}
                        className={styles.imgIcon}
                        alt="tag img"
                      />
                    )}
                  </div>
                  <div>
                    <Button type="link" onClick={() => handleEditTag(each)}>
                      {t('schedule.edit')}
                    </Button>
                    <Button type="link" onClick={() => handleRemoveTag(each)}>
                      {t('SystemSetting.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <Modal
        open={labelsSetting}
        onCancel={handleCloseLabelsModal}
        onOk={handleSaveLabels}
        width={700}
        afterClose={() => {
          setValue(initialValue)
          form.setFieldsValue(initialValue)
        }}
      >
        <div className={styles.formWrapper}>
          <AddLabelForm form={form} value={value} />
        </div>
      </Modal>
    </>
  )
}

export default LabelsSetting
