import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, message, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import CheckIcon from '@material-ui/icons/Check'
import CloseIcon from '@material-ui/icons/Close'
import EditIcon from '@material-ui/icons/Edit'
import styles from './SingleSetting.module.less'

const { Option } = Select

const SingleSetting = (props) => {
  const { t } = useTranslation()
  const editRef = useRef()
  const {
    contentList,
    setNewContent,
    settingType,
    removeBrandMenuSetting,
    editBrandMenuSetting,
    alias,
    changeTitleAlias,
    changeMark,
    getTypeMark,
  } = props
  const inputRef = useRef(null)
  const [inputStatue, setInputStatus] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editTitle, setEditTitle] = useState(null)
  const [titleValue, setTitleValue] = useState(null)

  useEffect(() => {
    if (editRef?.current) {
      editRef?.current?.input?.focus()
    }
  }, [editRef?.current])

  const handleInputBlur = () => {
    const newContent = inputRef?.current?.input?.value
    if (newContent && contentList.find((each) => each === newContent))
      return message.warn(t('SystemSetting.duplicate'))
    setInputStatus(false)
    if (newContent) {
      setNewContent([...contentList, newContent], settingType, newContent)
    }
  }

  const handleRemoveItem = (name) => {
    removeBrandMenuSetting(
      settingType,
      name,
      contentList.filter((each) => {
        return each !== name
      })
    )
    editItem && setEditItem(null)
  }

  const handleSetItem = (each) => {
    setEditItem(each)
  }

  const handleEditItem = () => {
    const newVal = editRef?.current?.input?.value
    editBrandMenuSetting(settingType, editItem, newVal)
    setEditItem(null)
  }

  const title = useMemo(() => {
    return alias[settingType] || t(`SystemSetting.${settingType}`)
  }, [settingType, alias, t])

  const handleSetEditTitle = () => {
    setEditTitle(settingType)
    setTitleValue(alias[settingType])
  }

  const changeTitleValue = (e) => {
    setTitleValue(e.target.value)
  }

  const handleCancelEditTitle = () => {
    setTitleValue(null)
    setEditTitle(null)
  }

  const handleConfirmEditTitle = () => {
    changeTitleAlias(settingType, titleValue)
    setEditTitle(null)
    setTitleValue(null)
  }

  return (
    <div className={styles.singleSetting}>
      {editTitle && editTitle === settingType ? (
        <div className={styles.titleInput}>
          <Input
            autoFocus
            placeholder={title}
            value={titleValue}
            onChange={changeTitleValue}
          />
          <Button type="link" onClick={handleConfirmEditTitle}>
            {t('ChooseLicense.confirm')}
          </Button>
          <Button type="link" onClick={handleCancelEditTitle}>
            {t('AdminSetting.btn_cancel')}
          </Button>
        </div>
      ) : (
        <div className={styles.title}>
          <span>{title}</span>
          <EditIcon className={styles.edit} onClick={handleSetEditTitle} />
        </div>
      )}

      {contentList.map((each) => (
        <div className={styles.item} key={each}>
          {editItem === each ? (
            <Input autoFocus ref={editRef} defaultValue={editItem} />
          ) : (
            <span>{each}</span>
          )}
          <div className={styles.operateBtns}>
            <Button
              onClick={
                editItem === each ? handleEditItem : () => handleSetItem(each)
              }
              type="link"
            >
              {t(
                `${
                  editItem === each
                    ? 'ChooseLicense.confirm'
                    : 'SystemSetting.edit'
                }`
              )}
            </Button>
            <Button onClick={() => handleRemoveItem(each)} type="link">
              {t('SystemSetting.delete')}
            </Button>
            {settingType === 'age' ? (
              <Select
                value={getTypeMark(each)}
                allowClear
                style={{ width: 100 }}
                placeholder={t('SystemSetting.mark')}
                onChange={(v) => changeMark(v, each)}
              >
                {['child'].map((mark) => {
                  return (
                    <Option key={mark} value={mark}>
                      {t(`SystemSetting.option_${mark}`)}
                    </Option>
                  )
                })}
              </Select>
            ) : null}
          </div>
        </div>
      ))}
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

export default SingleSetting
