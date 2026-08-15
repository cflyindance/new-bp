import ArrowBackIosNewIcon from '@material-ui/icons/ArrowBackIos'
import styles from './FooterOperation.module.less'
import { setStorageValue } from '@/utils/storage'
import { useUnmount } from 'ahooks'
import { useTranslation } from 'react-i18next'

const FooterOperation = (props) => {
  const { t } = useTranslation()
  const { handleSave, handleBack, tip } = props

  const handleSaveConfig = () => {
    // for dev
    if (process.env.NODE_ENV === 'development') handleSave?.()
    window.parent.postMessage({ type: 'getSessionKey' }, '*')
    window.addEventListener('message', handleBeforeSave)
  }

  const handleBeforeSave = async (event) => {
    if (event.data.type === 'sessionKey') {
      const newSessionKey = event.data.data
      setStorageValue('emenu_auth', {
        sessionKey: newSessionKey,
      })
      await handleSave?.()
      window.removeEventListener('message', handleBeforeSave)
    }
  }

  useUnmount(() => {
    window.removeEventListener('message', handleBeforeSave)
  })

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.backBtn} onClick={() => handleBack?.()}>
        <span className={styles.backIcon}>
          <ArrowBackIosNewIcon />
        </span>
        <span className={styles.backText}>Back</span>
      </div>
      <div className={styles.right}>
        {tip ? <div className={styles.tip}>{tip}</div> : null}
        <div className={styles.saveBtn} onClick={() => handleSaveConfig()}>
          {t('Order.add_instructions_save')}
        </div>
      </div>
    </footer>
  )
}

export default FooterOperation
