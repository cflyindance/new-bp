import { useGlobalState } from '@/hooks/useGlobalState'
import useCheckMemberStatus from '@/hooks/useCheckMemberStatus'
import styles from './CartBenefit.module.less'
import { Suspense, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import LoginContent from '@/components/CRMLogin/LoginContent'
import { Dialog } from '@material-ui/core'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { roundToPrecision } from '@/utils/number'
import { useTranslation } from 'react-i18next'
import { useBoolean } from 'ahooks'
import useSendMemberOrder from '@/hooks/useSendMemberOrder'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import FeedbackToast from '@/components/common/FeedbackToast'
import useSystemConfig from '@/hooks/useSystemConfig'

const CartBenefit = () => {
  const [open, setOpen] = useState(false)
  const [memberInfo] = useGlobalState('memberInfo')
  const [privilege] = useGlobalState('privilege')
  const [privilegeItem] = useGlobalState('privilegeItem')
  const { isMemberLogin, isVIPMember, isHasBenefit } =
    useCheckMemberStatus(memberInfo)
  const [cart, setCart] = useGlobalState('Cart')
  const [orders] = useGlobalState('Orders')
  const [isOpenPrivilege] = useGlobalState('isOpenPrivilege')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const [
    openFeedback,
    { setTrue: setOpenFeedback, setFalse: setCloseFeedback },
  ] = useBoolean()
  const [submitting, { setTrue: startSubmitting, setFalse: endSubmitting }] =
    useBoolean()
  const { memberLoginSubmit, error, data } = useSendMemberOrder({
    onClose: () => handleClose(),
    setCloseFeedback,
    endSubmitting,
  })
  const { t } = useTranslation()
  const benefitMemberPrice = useMemo(() => {
    if (orders?.[0]) {
      return orders?.[0]?.totalBenefitPrice
    }
  }, [orders])

  const isIncludeMemberItem = useMemo(() => {
    if (orders?.[0]) {
      return orders?.[0]?.isIncludeMemberItem
    }
  }, [orders])

  const totalPrice = useMemo(() => {
    if (orders?.[0]) {
      return roundToPrecision(orders?.[0]?.totalPrice)
    }
  }, [orders])

  const benefitPrice = useMemo(() => {
    return privilege?.paymentOptions?.[0]?.price
  }, [privilege])

  const benefitMemberDiscount = useMemo(() => {
    if (orders?.[0]) {
      return roundToPrecision(totalPrice - orders?.[0]?.totalBenefitPrice)
    }
  }, [orders])

  const periodTime = useMemo(() => {
    const expiration = privilege?.paymentOptions?.[0]?.expiration
    if (expiration) {
      const { enabled, quantity, unit } = expiration
      if (!enabled) return t('crm.noTime')
      return quantity <= 1
        ? t(`crm.${unit?.toLowerCase()}`)
        : `${quantity}${t(`crm.${unit?.toLowerCase()}`)}`
    }
    return null
  }, [privilege, t])

  const handleClose = (event, reason) => {
    if (reason === 'backdropClick') return
    setOpen(false)
  }

  const handleAddBenefitToCart = () => {
    const dish = {
      ...privilegeItem,
      count: 1,
      key: nanoid(),
      price: benefitPrice,
      taxExempt: false,
      privilegeId: privilege._id,
      taxSnapshot: true,
      expiration: JSON.stringify(privilege?.paymentOptions?.[0]?.expiration),
    }
    const newCart = [...cart, dish]
    setCart(newCart)
    setStoragedCart(newCart)
  }

  const { getFinalConfigById } = useSystemConfig()
  const showPremiumMemberLogin = getFinalConfigById(67)?.showPremiumMemberLogin

  const renderBar = () => {
    if (!isMemberLogin) {
      if (!showPremiumMemberLogin) {
        return null
      }
      return (
        <div className={styles.cartBenefitWrapper}>
          <div className={styles.leftBox}>
            <div className={styles.memberPrice}>
              {t('crm.memberPrice')}： $
              {isIncludeMemberItem || benefitMemberDiscount > 0
                ? benefitMemberPrice?.toFixed(2)
                : totalPrice?.toFixed(2)}
            </div>
            {(isIncludeMemberItem || benefitMemberDiscount > 0) && (
              <div className={styles.discount}>
                {t('crm.discount')} ${benefitMemberDiscount?.toFixed(2)}
              </div>
            )}
          </div>
          <div className={styles.rightBtn} onClick={() => setOpen(true)}>
            {t('crm.login')}
          </div>
        </div>
      )
    }
    if (!isVIPMember)
      return (
        <div className={styles.loggedWrapper}>
          <div className={styles.desc}>{t('crm.upgrade')}</div>
          <div className={styles.joinBtn} onClick={handleAddBenefitToCart}>
            {t('crm.join')}(${benefitPrice}/{periodTime})
          </div>
        </div>
      )
  }

  return (
    <>
      {isHasBenefit || !isOpenPrivilege ? null : (
        <>
          {renderBar()}
          <Dialog open={open} onClose={handleClose}>
            <LoginContent
              onClose={handleClose}
              memberLoginSubmit={memberLoginSubmit}
              setOpenFeedback={setOpenFeedback}
              startSubmitting={startSubmitting}
            />
          </Dialog>
        </>
      )}
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <FeedbackToast
          open={openFeedback}
          loading={submitting}
          error={error}
          data={data}
          onClose={setCloseFeedback}
        />
      </Suspense>
    </>
  )
}

export default CartBenefit
