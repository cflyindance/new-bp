import { Button, Dialog } from '@material-ui/core'
import styles from './FailDialog.module.less'
import { useTranslation } from 'react-i18next'

const FailDialog = (props) => {
  const { open, onClose, haveNextLottery } = props
  const { t } = useTranslation()

  return (
    <Dialog open={open}>
      <div className={styles.failDialog}>
        <div className={styles.title}>{t('lottery.failDalog.title')}</div>
        <div className={styles.actions}>
          {haveNextLottery ? (
            <Button onClick={onClose} variant="contained" color="primary">
              {t('lottery.failDalog.actionAgainBtn')}
            </Button>
          ) : (
            <Button onClick={onClose} variant="contained" color="default">
              {t('lottery.failDalog.quitBtn')}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}

export default FailDialog
