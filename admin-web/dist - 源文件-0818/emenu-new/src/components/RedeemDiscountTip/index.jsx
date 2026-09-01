import { Dialog } from '@material-ui/core'
import React from 'react'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useTranslation } from 'react-i18next'
import styles from './index.module.less'
import CallerServerCheckout from '@/components/ShoppingCart/CallerServerCheckout'
import AdminLogin from '@/components/AdminLogin'
import { useSetState } from 'ahooks'
import { useFetchOrder } from '@/hooks/useFetchOrder'

const RedeemDiscountTip = (props) => {
  const { openShoppingCart } = props
  const { t } = useTranslation()
  const [redeemDiscountOpen] = useGlobalState('redeemDiscountOpen')
  const { runFetchOrder } = useFetchOrder()
  const [adminLogin, setAdminLogin] = useSetState({
    open: false,
    permission: '',
    next: () => {},
  })

  const handleOpenClear = () => {
    setAdminLogin({
      open: true,
      permission: 'tableClear',
      next: runFetchOrder,
    })
  }

  const closeAdminLogin = () =>
    setAdminLogin({ open: false, permission: '', next: () => {} })

  return (
    <>
      <Dialog
        open={redeemDiscountOpen}
        BackdropProps={
          openShoppingCart ? { style: { backgroundColor: 'transparent' } } : {}
        }
      >
        <div className={styles.kindTipWrapper}>
          <div className={styles.title}>{t('crm.warmTip')}:</div>
          <div className={styles.desc}>{t('crm.cantOrder')}</div>
          <div className={styles.clearTable} onClick={handleOpenClear}>
            {t('Landing.clear')}
          </div>
          <CallerServerCheckout />
        </div>
      </Dialog>
      <AdminLogin
        isOpen={adminLogin.open}
        handleClose={closeAdminLogin}
        next={adminLogin.next}
        permission={adminLogin.permission}
      />
    </>
  )
}

export default RedeemDiscountTip
