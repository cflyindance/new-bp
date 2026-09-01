import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useCreation } from 'ahooks'
import useSendMessage from './useSendMessage'
import { getStorageValue } from '@/utils/storage'
dayjs.extend(utc)
dayjs.extend(timezone)

const useCountOrderDuration = () => {
  const { getFinalConfigById } = useSystemConfig()
  const [, setCountTime] = useGlobalState('countTime')
  const [, setRestCountTime] = useGlobalState('restCountTime')
  const [isShowAlert, setIsShowAlert] = useState(false)
  const [isShowLastOrderAlert, setIsShowLastOrderAlert] = useState(false)
  const [lastOrderRemainingMinutes, setLastOrderRemainingMinutes] =
    useState(null)
  const [leftMealTime, setLeftMealTime] = useState(null)
  const durationInfo = getFinalConfigById(5)
  const isOpenDuration = useMemo(() => {
    return durationInfo?.open
  }, [durationInfo])
  const durationTime = useMemo(() => {
    return durationInfo?.duration
  }, [durationInfo])
  const alertInfo = getFinalConfigById(14)
  const isOpenAlert = useMemo(() => {
    return alertInfo?.open
  }, [alertInfo])
  const alertTime = useMemo(() => {
    return alertInfo?.restTimeAlert
  }, [alertInfo])
  // 实际最后提示时间
  const actualAlertTime = useMemo(() => {
    const lastAlertTime =
      (alertInfo?.beforeAlertTime || 0) + (alertInfo?.restTimeAlert || 0)
    return lastAlertTime >= durationTime ? durationTime : lastAlertTime
  }, [alertInfo, durationTime])
  const isNeedLastAlert = useMemo(() => {
    return alertInfo?.disableOrderAfterAlert && alertInfo?.beforeAlertTime > 0
  }, [alertInfo])

  const timer = useRef(null)
  const hasShowAlertRef = useRef(false)
  const hasShowLastOrderAlert = useRef(false)

  const { run: runSaveMessage } = useSendMessage({
    onBeforeSend: () => {},
    onAfterSend: () => {},
  })
  const [orders] = useGlobalState('Orders')

  const createTime = useCreation(() => {
    return orders?.[0]?.time
  }, [orders])

  const sendMessage = useCallback(
    (countTime) => {
      const tableInfo = getStorageValue('emenu_table', {})
      const { currentTable } = tableInfo
      if (orders?.[0]?.id) {
        runSaveMessage({
          type: 'mealDurationReminder',
          title: 'Meal Duration Reminder',
          content: `${currentTable?.name || 'None'}|${countTime || 0}`,
          iconType: 'WAITER',
          tableId: currentTable?.id,
        })
      }
    },
    [runSaveMessage, orders]
  )

  useEffect(() => {
    hasShowAlertRef.current = false
  }, [createTime, isOpenDuration, durationTime, isOpenAlert, alertTime])

  useEffect(() => {
    hasShowLastOrderAlert.current = false
  }, [
    createTime,
    isOpenDuration,
    durationTime,
    isOpenAlert,
    alertTime,
    isNeedLastAlert,
    actualAlertTime,
  ])

  const countShowAlert = useCallback(
    (countTime, restCountTime) => {
      if (!isOpenAlert) return false
      if (restCountTime <= alertTime && !hasShowAlertRef.current) {
        if (restCountTime > 0) {
          sendMessage(countTime)
          setIsShowAlert(true)
        }
        hasShowAlertRef.current = true
      }
    },
    [isOpenAlert, alertTime, sendMessage]
  )

  // 最后一次下单提示
  const countShowLastOrderAlert = useCallback(
    (restCountTime) => {
      if (!isOpenAlert || !isNeedLastAlert) return false
      if (
        restCountTime <= actualAlertTime &&
        restCountTime > alertTime &&
        !hasShowLastOrderAlert.current
      ) {
        setIsShowLastOrderAlert(true)
        hasShowLastOrderAlert.current = true
        return
      }
      // 达到用餐时长提示时，关闭最后一次下单提示
      if (restCountTime <= alertTime && isShowLastOrderAlert) {
        setIsShowLastOrderAlert(false)
      }
    },
    [
      isOpenAlert,
      isNeedLastAlert,
      actualAlertTime,
      alertTime,
      isShowLastOrderAlert,
    ]
  )

  // 关闭最后一次下单提示后 重置数据
  useEffect(() => {
    if (isShowLastOrderAlert) {
      hasShowLastOrderAlert.current = false
      setLastOrderRemainingMinutes(null)
    }
  }, [isShowLastOrderAlert])

  const startCount = useCallback(() => {
    const timerFn = () => {
      // 统一时区
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      // 已用餐时间
      const diffMin =
        dayjs().tz(tz)?.diff(dayjs(createTime).tz(tz), 'minutes') || 0
      setCountTime(diffMin)
      if (isOpenDuration) {
        // 剩余用餐时间
        const leftMealTime = durationTime - diffMin
        setLeftMealTime(leftMealTime)
        setRestCountTime(leftMealTime < 0 ? 0 : leftMealTime)
        const lastOrderRemainingMinutes = leftMealTime - alertTime
        setLastOrderRemainingMinutes(
          lastOrderRemainingMinutes < 0 ? 0 : lastOrderRemainingMinutes
        )
        countShowAlert(diffMin, leftMealTime)
        countShowLastOrderAlert(leftMealTime)
      } else {
        setLeftMealTime(null)
        setRestCountTime(null)
        setIsShowAlert(false)
        setLastOrderRemainingMinutes(null)
        setIsShowLastOrderAlert(false)
      }
    }
    timerFn()
    if (timer.current) {
      clearInterval(timer.current)
    }
    timer.current = setInterval(timerFn, 1 * 1000)
  }, [isOpenDuration, durationTime, countShowAlert, countShowLastOrderAlert])

  useEffect(() => {
    if (!createTime) {
      clearInterval(timer.current)
      timer.current = null
      setCountTime(null)
      setRestCountTime(null)
      setIsShowAlert(false)
      setIsShowLastOrderAlert(false)
      return
    }
    startCount()
  }, [createTime, startCount, sendMessage])

  return {
    isShowAlert,
    leftMealTime,
    closeAlert: () => setIsShowAlert(false),
    isShowLastOrderAlert,
    closeLastOrderAlert: () => setIsShowLastOrderAlert(false),
    lastOrderRemainingMinutes,
  }
}

export default useCountOrderDuration
