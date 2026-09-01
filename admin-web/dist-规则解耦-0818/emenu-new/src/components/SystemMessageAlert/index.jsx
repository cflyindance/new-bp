import { Dialog } from '@material-ui/core'
import { Button } from 'antd'
import styles from './index.module.less'
import { useTranslation } from 'react-i18next'

const SystemMessageAlert = (props) => {
  const { open, onClose, messageList = [] } = props
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onClose}>
      <div className={styles.alertWrapper}>
        <div className={styles.alertTitle}>{t('systemMessageAlert.title')}</div>
        <div className={styles.alertMsg}>
          {messageList.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </div>
        <Button type="primary" className={styles.confirmBtn} onClick={onClose}>
          {t('systemMessageAlert.confirm')}
        </Button>
      </div>
    </Dialog>
  )
}

export default SystemMessageAlert
