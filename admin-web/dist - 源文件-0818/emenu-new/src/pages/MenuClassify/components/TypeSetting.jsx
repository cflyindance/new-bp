import useSystemConfig from '@/hooks/useSystemConfig'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './TypeSetting.module.less'
import { Button, Input } from 'antd'
import CheckIcon from '@material-ui/icons/Check'
import CloseIcon from '@material-ui/icons/Close'
import { nanoid } from 'nanoid'
import message from '@/components/Message'

const configId = 52

const TypeSetting = () => {
  const { t } = useTranslation()
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()
  const menuClassifySetting = getGlobalConfig(52)
  const [editItem, setEditItem] = useState(null)
  const [inputStatue, setInputStatus] = useState(false)
  const inputRef = useRef(null)
  const editRef = useRef()

  const allMenuClassify = useMemo(() => {
    return menuClassifySetting?.menuClassifySetting || []
  }, [menuClassifySetting])

  const handleSetItem = (each) => {
    setEditItem(each)
  }

  const saveMenuClassify = (newMenuClassify) => {
    const newVal = {
      ...menuClassifySetting,
      menuClassifySetting: newMenuClassify,
    }
    changeGlobalConfig(configId, newVal)
  }

  const handleEditItem = () => {
    const newVal = editRef?.current?.input?.value
    if (!newVal) return message.warn(t('SystemSetting.noText'))
    const { id } = editItem
    const newMenuClassify = allMenuClassify.map((each) => {
      return each.id === id ? { ...each, name: newVal } : each
    })
    saveMenuClassify(newMenuClassify)
    setEditItem(null)
  }

  const handleRemoveItem = (item) => {
    const { id } = item
    const newMenuClassify = allMenuClassify.filter((each) => each.id !== id)
    saveMenuClassify(newMenuClassify)
    editItem && setEditItem(null)
  }

  const handleInputBlur = () => {
    const newContent = inputRef?.current?.input?.value
    if (allMenuClassify.find((each) => each.name === newContent))
      return message.warn(t('SystemSetting.duplicate'))
    // 保存新菜单分类
    const newMenuClassify = [
      ...allMenuClassify,
      { name: newContent, id: nanoid() },
    ]
    saveMenuClassify(newMenuClassify)
    setInputStatus(false)
  }

  return (
    <div className={styles.typeSettingWrapper}>
      <div className={styles.typeSettingTitle}>
        {t('SystemSetting.menuClassifyName')}
      </div>
      <div className={styles.typeSettingList}>
        {allMenuClassify?.map((each) => {
          return (
            <div key={each.id} className={styles.typeSettingItem}>
              {editItem?.id === each?.id ? (
                <Input autoFocus ref={editRef} defaultValue={editItem.name} />
              ) : (
                <span>{each.name}</span>
              )}
              <div className={styles.operateBtns}>
                <Button
                  onClick={
                    editItem?.id === each?.id
                      ? handleEditItem
                      : () => handleSetItem(each)
                  }
                  type="link"
                >
                  {t(
                    `${
                      editItem?.id === each?.id
                        ? 'ChooseLicense.confirm'
                        : 'SystemSetting.edit'
                    }`
                  )}
                </Button>
                <Button onClick={() => handleRemoveItem(each)} type="link">
                  {t('SystemSetting.delete')}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      {inputStatue && (
        <div className={styles.inputRow}>
          <Input ref={inputRef} />
          <CheckIcon
            onClick={() => {
              const newContent = inputRef?.current?.input?.value
              if (!newContent) return message.warn(t('SystemSetting.noText'))
              handleInputBlur()
            }}
          />
          <CloseIcon onClick={() => setInputStatus(false)} />
        </div>
      )}
      <Button
        disabled={inputStatue || editItem}
        className={styles.saveBtn}
        onClick={() => setInputStatus(true)}
      >
        {t('SystemSetting.add')}
      </Button>
    </div>
  )
}

export default TypeSetting
