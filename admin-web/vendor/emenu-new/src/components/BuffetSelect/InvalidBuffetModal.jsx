import { Dialog } from '@material-ui/core'
import { Button } from 'antd'
import styles from './InvalidBuffetModal.module.less'
import { useTranslation } from 'react-i18next'

const InvalidBuffetModal = (props) => {
  const { t } = useTranslation()
  const {
    open,
    invalidItem,
    isAllInvalid = false,
    onCancel,
    sendOrder,
    submitting,
  } = props

  const handleConfirmOrder = () => {
    if (submitting) return
    onCancel()
    sendOrder()
  }

  return (
    <Dialog open={open}>
      <div className={styles.invalidWrapper}>
        <header className={styles.headerTitle}>
          {t(`SystemSetting.${isAllInvalid ? 'allInvalid' : 'invalidBuffet'}`)}
        </header>
        <main className={styles.itemList}>
          {invalidItem.map((each) => {
            return <div key={each.itemName}>{each.itemName}</div>
          })}
        </main>
        <footer className={styles.btnFooter}>
          <Button onClick={onCancel}>{t('AdminSetting.btn_cancel')}</Button>
          {!isAllInvalid && (
            <Button
              disabled={submitting}
              type="primary"
              onClick={handleConfirmOrder}
            >
              {t('PickSize.btn_continue')}
            </Button>
          )}
        </footer>
      </div>
    </Dialog>
  )
}

export default InvalidBuffetModal
