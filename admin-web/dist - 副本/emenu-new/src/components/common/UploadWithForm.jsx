import { useState } from 'react'
import { message, Upload } from 'antd'
import ImgFallback from '@/components/common/ImgFallback'
import { serverUrl } from '@/utils/env_var'
import styles from './UploadWithForm.module.less'
import { fetchCompanyProfile } from '@/services/system'
import { postConfigUploadImg } from '@/services/setting'
import { useTranslation } from 'react-i18next'

const UploadImgWithForm = (props) => {
  const {
    value,
    onChange,
    children = null,
    config = {},
    sizeMBLimit = 1,
  } = props
  const { t } = useTranslation()
  const [tempImgId, setTempImgId] = useState(null)

  const beforeUploadImg = (file) => {
    const validPicType = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif']
    const { type, size } = file
    const isValidType = validPicType.includes(type)
    if (!isValidType) {
      message.info(t('labels.img-limit-format-tip'))
      return false
    }
    const isLtMB = size / 1024 / 1024 <= sizeMBLimit
    if (!isLtMB) {
      message.info(t('labels.img-limit-size-tip', { value: sizeMBLimit }))
      return false
    }
    return isValidType && isLtMB
  }

  const handleChangeImg = async (info) => {
    if (info.file.status === 'done') {
      const res = await fetchCompanyProfile()
      if (res?.company) {
        const images = res?.company?.images
        const currentImg = images.find((each) => each.name === tempImgId)
        onChange(currentImg?.url)
      }
      message.info(t('labels.upload-success'))
    }
    if (info.file.status === 'error') {
      message.info(t('labels.upload-error'))
    }
  }

  const customRequest = async (option) => {
    let f = new FormData()
    f.set('file', option.file)
    const uid = option.file.uid
    try {
      const res = await postConfigUploadImg(uid, f)
      if (res?.data === 'Image has been successfully uploaded') {
        setTempImgId(uid)
        option.onSuccess()
        return
      }
      option.onError()
    } catch (e) {
      console.log(e)
      option.onError()
    }
  }

  return (
    <Upload
      name="avatar"
      listType="picture-card"
      className="avatar-uploader"
      showUploadList={false}
      beforeUpload={beforeUploadImg}
      onChange={handleChangeImg}
      customRequest={customRequest}
      {...config}
    >
      {children || (
        <ImgFallback
          src={serverUrl + `${value}`}
          className={styles.uploadImg}
          alt="tag img"
        />
      )}
    </Upload>
  )
}

const UploadVideoWithForm = (props) => {
  const {
    value,
    onChange,
    children = null,
    config = {},
    sizeMBLimit = 1,
    onLoading = null,
    onLoadEnd = null,
  } = props
  const { t } = useTranslation()
  const [fileList, setFileList] = useState(value || [])

  const beforeUploadVideo = (file) => {
    const validVideoType = [
      'video/mp4',
      'video/avi',
      'video/x-matroska',
      'video/quicktime',
      'video/x-ms-wmv',
    ]
    const { type, size } = file
    const isValidType = validVideoType.includes(type)
    if (!isValidType) {
      message.info(t('labels.video-limit-format-tip'))
      return false
    }
    const isLtMB = size / 1024 / 1024 <= sizeMBLimit
    if (!isLtMB) {
      message.info(t('labels.video-limit-size-tip', { value: sizeMBLimit }))
      return false
    }
    return isValidType && isLtMB
  }

  const handleChangeVideo = async (info) => {
    if (info.file.status === 'removed') {
      onChange([])
      setFileList([])
    }
    if (info.file.status === 'error') {
      message.info(t('labels.upload-error'))
    }
  }

  const customRequest = async (option) => {
    onLoading?.()
    let f = new FormData()
    f.set('file', option.file)
    const uid = option.file.uid
    try {
      const res = await postConfigUploadImg(uid, f)
      if (res?.data === 'Image has been successfully uploaded') {
        const res = await fetchCompanyProfile()
        if (res?.company) {
          const images = res?.company?.images
          const currentImg = images.find((each) => each.name === uid)
          setFileList((prev) => {
            if (Array.isArray(prev)) {
              const list = [...prev, currentImg]
              onChange(list)
              return list
            } else {
              const list = []
              onChange([])
              return list
            }
          })
          option.onSuccess()
          onLoadEnd?.()
          message.info(t('labels.upload-success'))
          return
        }
      }
      option.onError()
    } catch (e) {
      console.log(e)
      option.onError()
    }
    onLoadEnd?.()
  }

  return (
    <Upload
      name="avatar"
      listType="picture-card"
      className="avatar-uploader"
      showUploadList={{ showRemoveIcon: true, showPreviewIcon: false }}
      beforeUpload={beforeUploadVideo}
      onChange={handleChangeVideo}
      customRequest={customRequest}
      fileList={fileList}
      onRemove={() => {}}
      {...config}
    >
      {children}
    </Upload>
  )
}

const UploadWithForm = (props) => {
  const { isVideo, ...restProps } = props
  if (isVideo) {
    return <UploadVideoWithForm {...restProps} />
  } else {
    return <UploadImgWithForm {...restProps} />
  }
}

export default UploadWithForm
