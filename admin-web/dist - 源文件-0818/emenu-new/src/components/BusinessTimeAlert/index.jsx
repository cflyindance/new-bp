import { Dialog } from '@material-ui/core'
import { Button } from 'antd'
import styles from './index.module.less'
// import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const BusinessTimeAlert = (props) => {
  const { open, onCancel, groupCloseList, isMultiple, allDiffMin } = props
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={() => onCancel()}>
      <div className={styles.BusinessTimeAlertWrapper}>
        <div className={styles.alertTitle}>
          {t('SystemSetting.groupRunWillEnd')}
        </div>
        {isMultiple ? (
          <div className={styles.alertMsg}>
            {t('SystemSetting.groupRunWillEndLeft', {
              groupName: '',
              value: allDiffMin || 0,
            })}
          </div>
        ) : (
          groupCloseList.map((item, idx) => (
            <div className={styles.alertMsg} key={idx}>
              {t('SystemSetting.groupRunWillEndLeft', {
                groupName: `【${item.name}】`,
                value: item.diffMin || 0,
              })}
            </div>
          ))
        )}
        <div className={styles.alertMsg}>
          {t('SystemSetting.groupRunWillEndQuick')}
        </div>
        <Button type="primary" className={styles.confirmBtn} onClick={onCancel}>
          {t('ChooseLicense.confirm')}
        </Button>
      </div>
    </Dialog>
  )
}

export default BusinessTimeAlert
