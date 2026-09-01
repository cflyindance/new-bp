import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'antd/es/button'
import message from '@/components/Message'
import {
  TARGET_PATH_HINT,
  detectFolderSyncCapability,
  ensureTargetDirectoryHandle,
  pickSourceDirectoryHandle,
  syncImageFolderToTarget,
} from '@/utils/localImageFolderSync'
import styles from './index.module.less'

const LocalImageFolderSync = () => {
  const { t } = useTranslation()
  const capability = useMemo(() => detectFolderSyncCapability(), [])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const onReauth = async () => {
    if (capability !== 'ok') return
    setLoading(true)
    try {
      const { cancelled } = await ensureTargetDirectoryHandle({ forcePick: true })
      if (cancelled) return
      message.success(t('SystemSetting.local_image_reauth_done'))
    } catch (e) {
      message.warn(e?.message || t('SystemSetting.local_image_reauth_needed'))
    } finally {
      setLoading(false)
    }
  }

  const onSync = async () => {
    if (capability === 'insecure_context') {
      message.warn(t('SystemSetting.local_image_insecure'))
      return
    }
    if (capability === 'unsupported') {
      message.warn(t('SystemSetting.local_image_unsupported'))
      return
    }

    setLoading(true)
    try {
      const target = await ensureTargetDirectoryHandle()
      if (target.cancelled || !target.handle) return

      const source = await pickSourceDirectoryHandle()
      if (source.cancelled || !source.handle) return

      const summary = await syncImageFolderToTarget({
        sourceHandle: source.handle,
        targetHandle: target.handle,
      })

      if (summary.blockedReason === 'has_subdir') {
        message.warn(t('SystemSetting.local_image_need_flat'))
        return
      }
      if (summary.blockedReason === 'no_images') {
        message.warn(t('SystemSetting.local_image_no_images'))
        return
      }
      if (summary.blockedReason === 'case_conflict') {
        message.warn(t('SystemSetting.local_image_case_conflict'))
        return
      }

      setResult(summary)
      message.success(t('SystemSetting.local_image_sync_done'))
    } catch (e) {
      message.warn(e?.message || t('SystemSetting.local_image_reauth_needed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap} data-local-image-folder-sync>
      <div className={styles.title}>{t('SystemSetting.local_image_title')}</div>
      <div className={styles.hint}>
        {t('SystemSetting.local_image_hint')}
        <div className={styles.path}>{TARGET_PATH_HINT}</div>
      </div>
      <div className={styles.actions}>
        <Button
          type="primary"
          loading={loading}
          disabled={loading}
          onClick={onSync}
        >
          {t('SystemSetting.local_image_sync_button')}
        </Button>
        <Button
          type="text"
          disabled={loading || capability !== 'ok'}
          onClick={onReauth}
        >
          {t('SystemSetting.local_image_reauth')}
        </Button>
      </div>
      {result ? (
        <div className={styles.result}>
          {t('SystemSetting.local_image_result', {
            added: result.added,
            skipped: result.skipped,
            ignored: result.ignoredNonImages,
            failed: result.failed?.length || 0,
          })}
          {result.failed?.length ? (
            <ul>
              {result.failed.map((f) => (
                <li key={f.name}>
                  {f.name}: {f.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default LocalImageFolderSync
