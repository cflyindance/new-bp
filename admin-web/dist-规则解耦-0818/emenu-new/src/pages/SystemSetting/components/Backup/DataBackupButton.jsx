import { getEmenuConfig } from '@/services/setting'
import { getStorageValue } from '@/utils/storage'
import message from '@/components/Message'
import Button from 'antd/es/button'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const DataBackupButton = () => {
  const { t } = useTranslation()

  const [loading, setLoading] = useState(false)

  const onDataBackup = async () => {
    setLoading(true)
    try {
      const sessionKey = getStorageValue('emenu_auth')?.sessionKey
      if (!sessionKey) throw new Error()
      const res = await getEmenuConfig(sessionKey)
      if (res.data?.result?.successful) {
        const allConfig = res.data.marginAppConfigTypes
        const emenuConfig = allConfig?.find((l) => l.product === 'EMENU')
        const configDataJson = emenuConfig?.data || '{}'
        const formatedConfigDataJson = JSON.stringify(
          JSON.parse(configDataJson),
          null,
          2
        )
        const blob = new Blob([formatedConfigDataJson], {
          type: 'text/plain;charset=utf-8',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `emenu_config_${dayjs().format('YYYY-MM-DD HH:mm:ss')}.json`
        a.click()
        message.success(t('SystemSetting.data_backup_success'))
      } else if (res.data?.result?.failureReason !== 'Invalid session key') {
        throw new Error()
      }
    } catch (e) {
      message.warn(e?.message || t('SystemSetting.data_backup_fail'))
    }
    setLoading(false)
  }

  return (
    <Button type="text" onClick={onDataBackup} loading={loading}>
      {t('SystemSetting.data_backup')}
    </Button>
  )
}

export default DataBackupButton
