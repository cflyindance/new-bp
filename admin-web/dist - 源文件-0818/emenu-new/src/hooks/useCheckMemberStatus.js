import { useMemo } from 'react'
import { useGlobalState } from '@/hooks/useGlobalState'
import { getStorageValue } from '@/utils/storage'

const useCheckMemberStatus = (memberInfo) => {
  const [cart] = useGlobalState('Cart')
  const [privilegeItem] = useGlobalState('privilegeItem')
  const [isOpenPrivilege] = useGlobalState('isOpenPrivilege')
  const tableInfo = getStorageValue('emenu_table', {})
  const currentOrder = tableInfo?.currentOrder

  const isMemberLogin = useMemo(() => {
    return memberInfo && Object.keys(memberInfo).length > 0
  }, [memberInfo])

  const memberActivePrivilege = useMemo(() => {
    const currentTime = Date.now()
    return memberInfo?.privileges?.find(
      (each) =>
        each.status === 'ACTIVE' && currentTime <= (each.expireTime ?? Infinity)
    )
  }, [memberInfo])

  const isVIPMember = useMemo(() => {
    return !!memberActivePrivilege
  }, [memberActivePrivilege])

  const isHasBenefit = useMemo(() => {
    if (!isOpenPrivilege) return false
    const isOrderBenefit = currentOrder?.subOrders?.[0]?.orderItems.find(
      (dish) => dish.saleItemId === privilegeItem?.id && dish.quantity > 0
    )
    const isCartBenefit = cart.find(
      (dish) => dish.id === privilegeItem?.id && dish.count > 0
    )
    return isOrderBenefit || isCartBenefit || (isMemberLogin && isVIPMember)
  }, [isMemberLogin, isVIPMember, privilegeItem, currentOrder])

  return {
    isMemberLogin,
    isVIPMember,
    isHasBenefit,
    memberActivePrivilege,
  }
}

export default useCheckMemberStatus
