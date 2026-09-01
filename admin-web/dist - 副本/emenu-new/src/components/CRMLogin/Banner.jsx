import { useMemo } from 'react'
import styles from './Banner.module.less'
import { Person } from '@material-ui/icons'
import useIsMemberLogin from '@/hooks/useIsMemberLogin'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useTranslation } from 'react-i18next'

const CRMBanner = () => {
  const { isHideBar } = useIsMemberLogin()
  const { t } = useTranslation()
  const [, setOpen] = useGlobalState('open')
  const [crmRewardRules] = useGlobalState('crmRewardRules')

  const isHasFreeItem = useMemo(() => {
    if (crmRewardRules.length > 0) {
      const freeItemRule = crmRewardRules.filter(
        (each) => each.redeemRule.strategy === 'byFreeItem'
      )
      return freeItemRule.length > 0
    }
    return false
  }, [crmRewardRules])

  if (isHideBar) return null
  return (
    <div className={styles.bannerWrapper} onClick={() => setOpen(true)}>
      <div className={styles.innerWrapper}>
        <div>
          {t('crm.loginMsg', {
            freeItem: isHasFreeItem ? `，${t('crm.freeItem')}` : '',
          })}
        </div>
        <Person />
      </div>
    </div>
  )
}

export default CRMBanner
