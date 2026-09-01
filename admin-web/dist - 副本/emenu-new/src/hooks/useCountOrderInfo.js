import { useGlobalState } from '@/hooks/useGlobalState'
import { useMemo } from 'react'
import { roundToPrecision } from '@/utils/number'

const useCountOrderInfo = () => {
  const [orders] = useGlobalState('Orders')
  const [cart] = useGlobalState('Cart')
  const totalPrice = useMemo(
    () =>
      roundToPrecision(
        cart.reduce(
          (acc, cur) => acc + (cur.realPrice ?? cur.price) * cur.count,
          0
        )
      ),
    [cart]
  )

  const subtotal = useMemo(
    () =>
      roundToPrecision(orders.reduce((acc, cur) => acc + cur.totalPrice, 0)),
    [orders]
  )

  // 购物车+订单中菜品总价
  const cartOrderPrice = useMemo(() => {
    return roundToPrecision((subtotal ?? 0) + (totalPrice ?? 0))
  }, [subtotal, totalPrice])

  //税的价格
  const tax = useMemo(
    () =>
      roundToPrecision(
        orders.reduce((acc, cur) => acc + roundToPrecision(cur.totalTax), 0)
      ),
    [orders]
  )

  const charge = useMemo(
    () =>
      roundToPrecision(
        orders.reduce((acc, cur) => acc + roundToPrecision(cur.charge), 0)
      ),
    [orders]
  )

  const orderDiscount = useMemo(() => {
    return (
      roundToPrecision(
        orders.reduce((acc, cur) => {
          const allDiscounts = cur.orderDiscounts?.reduce(
            (pre, curDiscount) => {
              return pre + Number(curDiscount.discount || 0)
            },
            0
          )
          const crmIntegrationOrderDiscounts = Array.isArray(cur.discountList)
            ? cur.discountList.reduce((pre, discount) => {
                return pre + Number(discount?.amount || 0)
              }, 0)
            : 0
          return (
            acc +
            Number(cur.rewardDiscount || 0) +
            Number(allDiscounts || 0) +
            crmIntegrationOrderDiscounts
          )
        }, 0)
      ) || 0
    )
  }, [orders])

  const total = useMemo(
    () => roundToPrecision(subtotal + tax + charge - (orderDiscount ?? 0)),
    [subtotal, tax, orderDiscount, charge]
  )

  return {
    subtotal,
    tax,
    charge,
    orderDiscount,
    total,
    cartOrderPrice,
  }
}

export default useCountOrderInfo
