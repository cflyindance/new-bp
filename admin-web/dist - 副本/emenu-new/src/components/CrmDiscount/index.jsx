import ARROW_RIGHT from '@/assets/image/arrow-right.png'
import styles from './index.module.less'
import { useGlobalState } from '@/hooks/useGlobalState'
import { Suspense, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useIsMemberLogin from '@/hooks/useIsMemberLogin'
import { Dialog } from '@material-ui/core'
import { CloseRounded as CloseIcon } from '@material-ui/icons'
import getRewardDiscountByRules from '@/utils/getRewardDiscountByRules'
import POINTS from '@/assets/image/points.png'
import classNames from 'classnames'
import useSendDiscountOrder from '@/hooks/useSendDiscountOrder'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import FeedbackToast from '@/components/common/FeedbackToast'
import { useBoolean } from 'ahooks'
import { useFetchOrder } from '@/hooks/useFetchOrder'

const CrmDiscount = (props) => {
  const { orders } = props
  const { t } = useTranslation()
  const [descOpen, setDescOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [crmRewardRules] = useGlobalState('crmRewardRules')
  const [memberInfo] = useGlobalState('memberInfo')
  const [selectedDiscountRule, setSelectedDiscountRule] = useGlobalState(
    'selectedDiscountRule'
  )
  const [, setOpen] = useGlobalState('open')
  const { isLogin } = useIsMemberLogin()
  const { runFetchOrder } = useFetchOrder()
  const onClose = () => {
    setStep(0)
    setDescOpen(false)
    setSelectedDiscountRule(null)
  }
  const beforeSubmit = () => {
    setOpenFeedback()
    startSubmitting()
  }
  const afterSubmit = async () => {
    setCloseFeedback()
    endSubmitting()
    await runFetchOrder()
    onClose()
  }
  const { doSubmit, data, error, loading } = useSendDiscountOrder({
    beforeSubmit,
    afterSubmit,
  })
  const [
    openFeedback,
    { setTrue: setOpenFeedback, setFalse: setCloseFeedback },
  ] = useBoolean()
  const [submitting, { setTrue: startSubmitting, setFalse: endSubmitting }] =
    useBoolean()

  const items = useMemo(() => {
    return orders?.[0]?.cart
  }, [orders])

  const discountRule = useMemo(() => {
    const discountRuleSet = ['byPercentageOff', 'byFixedAmount']
    return crmRewardRules?.filter((each) =>
      discountRuleSet.includes(each.redeemRule.strategy)
    )
  }, [crmRewardRules])

  const sortedDiscountRules = useMemo(() => {
    return getRewardDiscountByRules(items, discountRule, orders?.[0])
  }, [items, discountRule, orders])

  const hasDiscountRule = useMemo(() => {
    return sortedDiscountRules?.length > 0
  }, [sortedDiscountRules])

  const pointCampaign = useMemo(() => {
    return sortedDiscountRules.filter(
      (rule) => rule.redeemRule?.parameters?.points > 0
    )
  }, [sortedDiscountRules])

  const handleClickBar = () => {
    if (isLogin) return setDescOpen(true)
    setOpen(true)
  }

  const handleClose = (event, reason) => {
    if (reason === 'backdropClick') return
    onClose()
  }

  const handleShowDiscountList = () => {
    setStep(1)
  }

  const handleSetDiscount = (rule) => {
    if (memberInfo.pointBalance < rule.redeemRule.parameters.points) return
    setSelectedDiscountRule(
      rule._id === selectedDiscountRule?._id ? null : rule
    )
  }

  const handleConfirm = () => {
    if (!selectedDiscountRule || loading) return
    doSubmit()
  }

  return hasDiscountRule ? (
    <>
      <div className={styles.crmDiscountWrapper} onClick={handleClickBar}>
        <div className={styles.text}>{t('crm.discountBar')}</div>
        <img className={styles.sign} src={ARROW_RIGHT} alt="arrow_right" />
      </div>
      <Dialog open={descOpen} onClose={handleClose}>
        <div className={styles.contentWrapper}>
          <div className={styles.closeBtn} onClick={onClose}>
            <CloseIcon />
          </div>
          {step === 0 && (
            <div className={styles.descWrapper}>
              <div className={styles.descHeader}>
                {t('crm.redeemInstruction')}
              </div>
              <p className={styles.descText}>{t('crm.instruction_1')}</p>
              <p className={styles.descText}>{t('crm.instruction_2')}</p>
              <p className={styles.descText}>{t('crm.instruction_3')}</p>
              <p className={styles.descText}>{t('crm.instruction_4')}</p>
              <div className={styles.iKnowBtn} onClick={handleShowDiscountList}>
                {t('Landing.policy_btn_enter')}
              </div>
            </div>
          )}
          {step === 1 && (
            <div className={styles.discountList}>
              <div className={styles.descHeader}>{t('crm.discountBar')}</div>
              <div className={styles.descArea}>
                <div className={styles.title}>
                  {t('crm.redeemInstruction')}:
                </div>
                <div>
                  {t('crm.instruction_1')}
                  {t('crm.instruction_2')}
                  {t('crm.instruction_3')}
                  {t('crm.instruction_4')}
                </div>
              </div>
              <div className={styles.list}>
                {pointCampaign?.length > 0
                  ? pointCampaign?.map((each) => {
                      const {
                        _id,
                        redeemRule: {
                          parameters: { points, discount, maxDiscount },
                          strategy,
                        },
                      } = each
                      return (
                        <div
                          key={_id}
                          className={classNames(
                            styles.item,
                            memberInfo.pointBalance < points &&
                              styles.disabledItem
                          )}
                          onClick={() => handleSetDiscount(each)}
                        >
                          <div className={styles.points}>
                            <img src={POINTS} alt="points" />
                            <span className={styles.pointText}>{points}</span>
                          </div>
                          <div>
                            {strategy === 'byPercentageOff'
                              ? `${discount}% off ${
                                  maxDiscount
                                    ? `(${t('crm.upTo')} $${maxDiscount})`
                                    : ''
                                }`
                              : `$${discount} off`}
                          </div>
                          <div
                            className={classNames(
                              styles.round,
                              selectedDiscountRule?._id === _id &&
                                styles.selected
                            )}
                          />
                        </div>
                      )
                    })
                  : null}
              </div>
              <div className={styles.actualDiscount}>
                <span>{t('crm.discount')}:</span>
                <span>
                  -${selectedDiscountRule?.actualDiscount.toFixed(2) ?? '0.00'}
                </span>
              </div>
              <div
                className={classNames(
                  styles.iKnowBtn,
                  (!selectedDiscountRule || loading) && styles.disabled
                )}
                onClick={handleConfirm}
              >
                {t('ChooseLicense.confirm')}
              </div>
            </div>
          )}
        </div>
      </Dialog>
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
  ) : null
}

export default CrmDiscount
