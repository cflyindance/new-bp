import { postConfigUploadImg } from '@/services/setting'
import { fetchCompanyProfile } from '@/services/system'
import { serverUrl } from '@/utils/env_var'
import { CircularProgress } from '@material-ui/core'
import { message, Upload } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './UploadFile.module.less'

const uploadType = {
  multiple: 1,
  image: 2,
  video: 3,
}

const validType = {
  image: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'],
  video: [
    'video/mp4',
    'video/avi',
    'video/x-matroska',
    'video/quicktime',
    'video/x-ms-wmv',
  ],
}

const UploadFile = (props) => {
  const {
    value,
    onChange,
    children = null,
    maxSizeMB = Infinity,
    maxFileCount = Infinity,
    fileType = uploadType.multiple,
    ...restProps
  } = props
  const { t } = useTranslation()
  const [fileList, setFileList] = useState(
    value?.map((item) => ({
      ...item,
      uid: item.name,
    })) || []
  )
  const [loading, setLoading] = useState(false)

  const beforeUpload = (file) => {
    const { type, size } = file
    if (fileType === uploadType.image) {
      const validTypes = [...validType.image]
      if (!validTypes.includes(type)) {
        message.info(t('labels.img-limit-format-tip'))
        return false
      }
      const sizeMB = size / 1024 / 1024
      if (!(sizeMB <= maxSizeMB)) {
        message.info(t('labels.img-limit-size-tip', { value: maxSizeMB }))
        return false
      }
    } else if (fileType === uploadType.video) {
      const validTypes = [...validType.video]
      if (!validTypes.includes(type)) {
        message.info(t('labels.video-limit-format-tip'))
        return false
      }
      const sizeMB = size / 1024 / 1024
      if (!(sizeMB <= maxSizeMB)) {
        message.info(t('labels.video-limit-size-tip', { value: maxSizeMB }))
        return false
      }
    } else if (fileType === uploadType.multiple) {
      const validTypes = [...validType.image, ...validType.video]
      if (!validTypes.includes(type)) {
        message.info(t('labels.limit-format-tip-img/video'))
        return false
      }
    }
    const sizeMB = size / 1024 / 1024
    if (!(sizeMB <= maxSizeMB)) {
      message.info(t('labels.limit-size-tip-img/video', { value: maxSizeMB }))
      return false
    }
    return true
  }

  const handleChangeVideo = async (info) => {
    if (info.file.status === 'removed') {
      setFileList([...info.fileList])
    }
    if (info.file.status === 'error') {
      message.info(t('labels.upload-error'))
    }
  }

  const customRequest = async (option) => {
    setLoading(true)
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
              const list = [...prev, { ...currentImg, uid: currentImg.name }]
              return list
            } else {
              return []
            }
          })
          option.onSuccess()
          setLoading(false)
          message.info(t('labels.upload-success'))
          return
        }
      }
      option.onError()
    } catch (e) {
      console.log(e)
      option.onError()
    }
    setLoading(false)
  }

  useEffect(() => {
    onChange(
      fileList.map((item) => ({
        url: item.url,
        name: item.name,
      }))
    )
  }, [fileList])

  return (
    <Upload
      name="avatar"
      listType="picture-card"
      className="avatar-uploader"
      showUploadList={{ showRemoveIcon: true, showPreviewIcon: false }}
      beforeUpload={beforeUpload}
      onChange={handleChangeVideo}
      customRequest={customRequest}
      fileList={fileList}
      onRemove={() => {}}
      {...restProps}
      itemRender={(originNode, file, fileList, actions) => {
        const url = serverUrl + file.url
        const name = file.name
        const isImage =
          url.includes('.png') ||
          url.includes('.jpg') ||
          url.includes('.jpeg') ||
          url.includes('.gif')
        const isVideo =
          url.includes('.mp4') ||
          url.includes('.mov') ||
          url.includes('.avi') ||
          url.includes('.mkv') ||
          url.includes('.wmv')
        return (
          <div
            key={name}
            className="ant-upload-list-item ant-upload-list-item-undefined ant-upload-list-item-list-type-picture-card"
          >
            <div className="ant-upload-list-item-info">
              <span className="ant-upload-span">
                <a
                  className="ant-upload-list-item-thumbnail"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {isImage && (
                    <img
                      src={url}
                      alt={name}
                      className="ant-upload-list-item-image"
                    />
                  )}
                  {isVideo && (
                    <video
                      src={url}
                      className={styles.uploadListItemVideo}
                      loop
                      muted
                      playsInline
                      autoPlay
                    />
                  )}
                </a>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ant-upload-list-item-name"
                  title={name}
                  href={url}
                >
                  {name}
                </a>
              </span>
            </div>
            <span className="ant-upload-list-item-actions">
              <button
                type="button"
                onClick={() => actions.remove()}
                className="ant-btn ant-btn-text ant-btn-sm ant-btn-icon-only ant-upload-list-item-card-actions-btn"
              >
                <span
                  role="img"
                  aria-label="delete"
                  tabIndex="-1"
                  className="anticon anticon-delete"
                >
                  <svg
                    viewBox="64 64 896 896"
                    focusable="false"
                    data-icon="delete"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path>
                  </svg>
                </span>
              </button>
            </span>
          </div>
        )
      }}
    >
      {loading ? (
        <CircularProgress />
      ) : fileList.length < maxFileCount ? (
        children
      ) : null}
    </Upload>
  )
}

export default UploadFile
