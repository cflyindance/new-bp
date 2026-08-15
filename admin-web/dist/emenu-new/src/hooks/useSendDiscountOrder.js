import { useCallback, useMemo } from 'react'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useRequest } from 'ahooks'
import { listTaxes } from '@/services/system'
import useCheckMemberStatus from '@/hooks/useCheckMemberStatus'
import {
  generateOrder,
  saveOrder,
  getChargeList,
  dealTimeAlert,
} from '@/services/orders'
import useGetUserId from '@/hooks/useGetUserId'
import useSystemConfig from './useSystemConfig'

const useSendDiscountOrder = (props) => {
  const { beforeSubmit, afterSubmit } = props
  // 选择的折扣规则
  const [selectedDiscountRule, setSelectedDiscountRule] = useGlobalState(
    'selectedDiscountRule'
  )
  const [memberInfo] = useGlobalState('memberInfo')
  const { isHasBenefit } = useCheckMemberStatus(memberInfo)
  const [earningRule] = useGlobalState('earningRule')
  const [orders] = useGlobalState('Orders')
  const [menuClassify] = useGlobalState('selectedMenuClassify')
  const [currentSpecialMenu] = useGlobalState('currentSpecialMenu')
  const [currentBuffetInfo] = useGlobalState('currentBuffetInfo')
  const { getUserId } = useGetUserId()
  const [notCountAsGuestNumber] = useGlobalState('notCountAsGuestNumber')
  const { getFinalConfigById } = useSystemConfig()
  const isOpenDuration = getFinalConfigById(5)?.open
  const durationTime = getFinalConfigById(5)?.duration
  const isOpenAlert = getFinalConfigById(14)?.open
  const alertTime = getFinalConfigById(14)?.restTimeAlert
  const specialMenuInfo = getFinalConfigById(55)
  const discountOrderReward = useMemo(() => {
    if (!selectedDiscountRule) return null
    const orderRewardInfo = {
      rewardId: selectedDiscountRule._id,
      rewardName: selectedDiscountRule.name,
      strategy: selectedDiscountRule.redeemRule.strategy,
      point: selectedDiscountRule.redeemRule.parameters.points || 0,
      discountRate: selectedDiscountRule.redeemRule.parameters.discount,
      discount: selectedDiscountRule.actualDiscount,
      rewardType: selectedDiscountRule.rewardType,
      notEligibleId:
        selectedDiscountRule.redeemRule?.eligibility?.object?.items?.map(
          (item) => item.itemId
        ) || [],
    }
    if (
      selectedDiscountRule.redeemRule.strategy === 'byPercentageOff' &&
      selectedDiscountRule.redeemRule.parameters.maxDiscount
    ) {
      orderRewardInfo.maxDiscount =
        selectedDiscountRule.redeemRule.parameters.maxDiscount
    }
    const rewardDiscount = selectedDiscountRule.actualDiscount
    return {
      ...orderRewardInfo,
      rewardDiscount,
    }
  }, [selectedDiscountRule])

  const doSubmit = async () => {
    beforeSubmit()
    await runAsync()
  }

  const { runAsync } = useRequest(listTaxes, {
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

      // 提交订单
      run({
        cart: [],
        totalPrice: 0,
        taxes,
        crmMemberId: memberInfo?.userId,
        isHasBenefit,
        totalBenefitPrice: 0,
        earningRule,
        discountOrderReward,
        ...timeAlert,
        buffetItemIdList,
      })
    },
    onError: () => {
      afterSubmit()
    },
  })

  // 提交订单
  const submitOrder = useCallback(
    async (data) => {
      const { discountOrderReward, ...rest } = data
      const res = await getChargeList()
      const orderData = {
        order: {
          ...rest,
          chargeInfo: res.charge,
          menuClassify,
          currentSpecialMenu,
          notCountAsGuestNumber,
        },
        prevOrder: orders?.[0],
        userId: getUserId(),
        discountOrderReward,
      }
      const order = generateOrder(orderData)
      return saveOrder({ order })
    },
    [orders, menuClassify, currentSpecialMenu, notCountAsGuestNumber]
  )

  const { data, mutate, run, error, loading } = useRequest(submitOrder, {
    manual: true,
    onSuccess: async () => {
      mutate({ status: 'ok', data })
      setSelectedDiscountRule(null)
    },
    onFinally: () => {
      const t = setTimeout(() => {
        afterSubmit()
        clearTimeout(t)
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

export default useSendDiscountOrder
