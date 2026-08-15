import { useCallback } from 'react'
import { useRequest } from 'ahooks'
import { useGlobalState } from '@/hooks/useGlobalState'
import { listTaxes } from '@/services/system'
import {
  dealTimeAlert,
  generateOrder,
  getChargeList,
  saveOrder,
} from '@/services/orders'
import useCheckMemberStatus from '@/hooks/useCheckMemberStatus'
import useGetUserId from '@/hooks/useGetUserId'
import useSystemConfig from './useSystemConfig'

const useSendCrmIntegrationDiscountOrder = (props = {}) => {
  const { beforeSubmit, afterSubmit } = props
  const [memberInfo] = useGlobalState('memberInfo')
  const { isHasBenefit } = useCheckMemberStatus(memberInfo)
  const [earningRule] = useGlobalState('earningRule')
  const [orders] = useGlobalState('Orders')
  const [menuClassify] = useGlobalState('selectedMenuClassify')
  const [currentSpecialMenu] = useGlobalState('currentSpecialMenu')
  const [currentBuffetInfo] = useGlobalState('currentBuffetInfo')
  const [notCountAsGuestNumber] = useGlobalState('notCountAsGuestNumber')
  const { getUserId } = useGetUserId()
  const { getFinalConfigById } = useSystemConfig()
  const isOpenDuration = getFinalConfigById(5)?.open
  const durationTime = getFinalConfigById(5)?.duration
  const isOpenAlert = getFinalConfigById(14)?.open
  const alertTime = getFinalConfigById(14)?.restTimeAlert
  const specialMenuInfo = getFinalConfigById(55)

  const doSubmit = async () => {
    beforeSubmit?.()
    await runTaxesAsync()
  }

  const { runAsync: runTaxesAsync } = useRequest(listTaxes, {
    manual: true,
    onSuccess: (res) => {
      const taxes = res.taxes ?? []
      const timeAlert = dealTimeAlert(
        { isOpenAlert, alertTime },
        { isOpenDuration, durationTime }
      )

      let buffetItemIdList = null
      if (currentBuffetInfo?.length > 0) {
        buffetItemIdList = []
        currentBuffetInfo.forEach((each) => {
          buffetItemIdList.push(
            ...(each.orderDishes || []),
            ...(each.viewOnlyDishIds || [])
          )
        })
        specialMenuInfo?.open &&
          specialMenuInfo?.specialMenu?.forEach((cur) => {
            if (currentSpecialMenu?.includes(cur.id)) {
              buffetItemIdList.push(...(cur.dishes || []))
            }
          })
      }

      run({
        cart: [],
        totalPrice: 0,
        taxes,
        crmMemberId: memberInfo?.userId,
        isHasBenefit,
        totalBenefitPrice: 0,
        earningRule,
        ...timeAlert,
        buffetItemIdList,
      })
    },
    onError: () => {
      afterSubmit?.()
    },
  })

  const submitOrder = useCallback(
    async (data) => {
      const res = await getChargeList()
      const orderData = {
        order: {
          ...data,
          chargeInfo: res.charge,
          menuClassify,
          currentSpecialMenu,
          notCountAsGuestNumber,
        },
        prevOrder: orders?.[0],
        userId: getUserId(),
      }
      const order = generateOrder(orderData)
      return saveOrder({ order })
    },
    [currentSpecialMenu, getUserId, menuClassify, notCountAsGuestNumber, orders]
  )

  const { data, mutate, run, error, loading } = useRequest(submitOrder, {
    manual: true,
    onSuccess: async (result) => {
      mutate({ status: 'ok', data: result })
    },
    onFinally: () => {
      const timer = setTimeout(() => {
        afterSubmit?.()
        clearTimeout(timer)
      }, 3000)
    },
  })

  return {
    doSubmit,
    data,
    error,
    loading,
  }
}

export default useSendCrmIntegrationDiscountOrder
