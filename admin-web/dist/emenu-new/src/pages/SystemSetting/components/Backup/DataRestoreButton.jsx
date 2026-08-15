import { useTranslation } from 'react-i18next'
import Button from 'antd/es/button'
import { Dialog } from '@material-ui/core'
import { useBoolean } from 'ahooks'
import SuperAdminLogin from '@/components/AdminLogin/SuperAdminLogin'
import { useRef, useState } from 'react'
import { effects } from '@/store/slices/systemConfig.slice'
import { useDispatch } from 'react-redux'
import message from '@/components/Message'

const DataRestoreButton = () => {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const [fileChooserLoading, setFileChooserLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  const [
    authModalVisible,
    { setTrue: openAuthModal, setFalse: closeAuthModal },
  ] = useBoolean(false)
  const [fileUploadEnabled, setFileUploadEnabled] = useState(false)
  const fileUploadRef = useRef(null)

  const onBeforeDataRestore = () => {
    openAuthModal()
  }

  const onDataRestore = async () => {
    setFileChooserLoading(true)
    setTimeout(() => {
      setFileChooserLoading(false)
    }, 1000)
    setFileUploadEnabled(true)
    fileUploadRef.current.click()
  }

  const onFileUpload = async (e) => {
    setFileChooserLoading(false)

    const file = e.target.files[0]
    if (file.type !== 'application/json') {
      message.warn(t('SystemSetting.data_restore_fail_json'))
      return
    }

    setLoading(true)
    try {
      const jsonString = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve(e.target.result)
        }
        reader.onerror = () => {
          reject()
        }
        reader.readAsText(file)
      })
      const config = JSON.parse(jsonString)
      const res = await dispatch(effects.setConfig(config))
      if (res) {
        message.success(t('SystemSetting.data_restore_success'))
      } else {
        throw new Error()
      }
    } catch {
      message.error(t('SystemSetting.data_restore_fail'))
    }
    setFileUploadEnabled(false)
    setLoading(false)
    fileUploadRef.current.value = ''
  }

  return (
    <>
      <Button
        type="text"
        onClick={onBeforeDataRestore}
        loading={loading || fileChooserLoading}
      >
        {t('SystemSetting.data_restore')}
      </Button>
      <Dialog open={authModalVisible} onClose={closeAuthModal}>
        <SuperAdminLogin
          visible={authModalVisible}
          onClose={closeAuthModal}
          onSuccess={onDataRestore}
        />
      </Dialog>
      <input
        type="file"
        accept=".json"
        disabled={!fileUploadEnabled}
        onChange={onFileUpload}
        ref={fileUploadRef}
        style={{ display: 'none' }}
      />
    </>
  )
}

export default DataRestoreButton
