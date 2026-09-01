import { useGlobalState } from '@/hooks/useGlobalState'
import { useMemo } from 'react'

const useCheckOrderBenefit = () => {
  const [orders] = useGlobalState('Orders')
  const [cart] = useGlobalState('Cart')

  // 检查购物车/订单是否已下过兑换菜
  const isCartRedeem = useMemo(() => {
    return cart?.find((dish) => dish.rewardRule)
  }, [cart])

  // 检查订单是否已下过兑换菜
  const isOrderRedeem = useMemo(() => {
    if (orders?.[0]?.cart?.length > 0) {
      return orders[0].cart.find(
        (dish) => dish.rewardItem && dish.hasOwnProperty('rewardRule') // 被取消兑换菜rewardItem也为true
      )
    }
    return false
  }, [orders])

  return {
    isCartRedeem,
    isOrderRedeem,
  }
}

export default useCheckOrderBenefit
