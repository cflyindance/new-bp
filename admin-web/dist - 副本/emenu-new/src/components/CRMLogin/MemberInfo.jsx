import { useMemo } from 'react'
import styles from './MemberInfo.module.less'
import { IconButton } from '@material-ui/core'
import { Person } from '@material-ui/icons'
import { useGlobalState } from '@/hooks/useGlobalState'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import useCheckMemberStatus from '@/hooks/useCheckMemberStatus'
import { formatUSPhoneNumber } from '@/utils/formatPhone'
import Toast from '@/components/Toast'

const NormalMemberInfo = (props) => {
  const { t } = useTranslation()
  const { logout } = props
  const [memberInfo] = useGlobalState('memberInfo')
  const { isVIPMember, memberActivePrivilege } =
    useCheckMemberStatus(memberInfo)

  const expiration = useMemo(() => {
    const expireTime = memberActivePrivilege?.expireTime
    if (expireTime) {
      return dayjs(expireTime).format('YYYY/MM/DD')
    }
    return t('crm.permanent')
  }, [memberInfo, t])

  return (
    <div className={styles.member}>
      <div className={styles.memberType}>
        <IconButton style={{ backgroundColor: '#96272f', marginTop: 8 }}>
          <Person style={{ color: '#fff' }} />
        </IconButton>
        <div className={styles.memberNo}>
          <div>{isVIPMember ? t('crm.vip') : t('crm.regular')}：</div>
          <div>
            {memberInfo?.phone &&
              formatUSPhoneNumber(
                memberInfo?.phone?.replace(/\+/g, '').slice(-10)
              )}
          </div>
          {isVIPMember && (
            <div>
              {t('crm.valid')}： {expiration}
            </div>
          )}
          <div>
            {t('crm.availablePoints')}： {memberInfo?.pointBalance || 0}
          </div>
        </div>
      </div>
      <div className={styles.logoutBtn} onClick={logout}>
        {t('crm.logout')}
      </div>
    </div>
  )
}

const MemberInfo = (props) => {
  const { t } = useTranslation()
  const { memberLogoutSubmit, setOpenFeedback, startSubmitting } = props
  const [orders] = useGlobalState('Orders')

  const canLogout = useMemo(() => {
    const orderRedeem = orders?.some((order) =>
      order?.cart?.some((dish) => {
        const rewardDiscounts = Array.isArray(dish?.discountList)
          ? dish.discountList.filter((discount) => discount?.isReward)
          : []
        return (
          (dish?.rewardItem &&
            Object.hasOwnProperty.call(dish, 'rewardRule')) ||
          dish?.crmIntegrationPointItem ||
          dish?.crmIntegrationPointItemKey ||
          dish?.crmIntegrationVoucherItem ||
          dish?.crmIntegrationVoucherItemKey ||
          rewardDiscounts.length > 0
        )
      })
    )
    return !orderRedeem
  }, [orders])

  const logout = async () => {
    // 已下单的兑换菜不能直接退出
    if (!canLogout) return Toast.error(t('crm.removeRedeem'))
    const beforeLogout = () => {
      setOpenFeedback()
      startSubmitting()
    }
    await memberLogoutSubmit({ beforeLogout })
  }

  return (
    <div className={styles.infoWrapper}>
      <NormalMemberInfo logout={logout} />
    </div>
  )
}

export default MemberInfo
