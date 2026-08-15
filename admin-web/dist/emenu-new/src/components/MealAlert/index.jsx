import { Dialog } from '@material-ui/core'
import { Button } from 'antd'
import styles from './index.module.less'
import { useTranslation } from 'react-i18next'

const MealAlert = (props) => {
  const { open, onCancel, title, subTitle } = props
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={() => onCancel()}>
      <div className={styles.mealAlertWrapper}>
        <div className={styles.alertMsg}>{title}</div>
        <div className={styles.alertMsg}>{subTitle}</div>
        <Button type="primary" className={styles.confirmBtn} onClick={onCancel}>
          {t('ChooseLicense.confirm')}
        </Button>
      </div>
    </Dialog>
  )
}

export default MealAlert
