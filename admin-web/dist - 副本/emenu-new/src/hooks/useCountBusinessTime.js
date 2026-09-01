import { useCreation } from 'ahooks'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { getBsTime } from '@/utils/getBsTime'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useGlobalState } from '@/hooks/useGlobalState'
import { getStorageValue } from '@/utils/storage'
import { getRestaurantHour } from '@/services/menus'
dayjs.extend(utc)
dayjs.extend(timezone)

const useCountBusinessTime = () => {
  const { getFinalConfigById } = useSystemConfig()
  const [menus] = useGlobalState('All_Menus')
  const [hourInfo, setHourInfo] = useState([])
  const [timer, setTimer] = useState(null)
  const [isShowAlert, setIsShowAlert] = useState(false)
  const [isMultiple, setIsMultiple] = useState(false)
  const [alertIsChecked, setAlertIsChecked] = useGlobalState(
    'alertIsChecked',
    false
  )
  const [groupCloseList, setGroupCloseList] = useState([])
  const [allDiffMin, setAllDiffMin] = useState(0)
  const tableInfo = getStorageValue('emenu_table') || {}
  const {
    currentArea: { id: areaId } = { id: 0 },
    currentTable: { id: tableId } = { id: 0 },
  } = tableInfo

  // 切单（桌子or区域改变）以后提示营业时间最新消息
  useEffect(() => {
    // 获取营业时间列表
    const initBsHour = async () => {
      const res = await getRestaurantHour()
      if (res?.hours?.length) {
        const newHours = getBsTime(res.hours)
        setHourInfo(newHours)
      }
    }
    initBsHour()
    setAlertIsChecked(false)
    return () => {
      timer && clearInterval(timer)
    }
  }, [areaId, tableId])

  //组别营业时间列表
  const updateBSList = useCreation(() => {
    const menuHourList = []
    menus?.forEach((menu) => {
      hourInfo?.forEach((hour) => {
        // 查找对应组ID的营业时间 还需确保今天（星期X）在营业日设定中
        if (
          menu.restaurantHourIds?.includes(hour.id) &&
          hour.bsDay.includes(dayjs().format('ddd').toUpperCase())
        ) {
          menuHourList.push({ name: menu.name, to: hour.to })
        }
      })
    })
    //防止监听不到updateBSList变化
    return [...menuHourList]
  }, [menus, hourInfo])

  useEffect(() => {
    if (!updateBSList?.length || alertIsChecked) {
      clearInterval(timer)
      return
    }
    startCount()
  }, [updateBSList])

  // 计算是否展示
  const countShowAlert = (arr) => {
    const isOpenAlert = getFinalConfigById(47)?.open
    // 提前 runTimeWillEnd分钟 提示
    const alertTime = getFinalConfigById(47)?.runTimeWillEnd
    if (!isOpenAlert) return false
    let showList = arr?.filter(
      (item) => item?.diffMin <= alertTime && item?.diffMin > 0
    )
    if (showList?.length === menus?.length) {
      // 若所有的组的营业结束时间都是一样的，isMultiple置为false
      setIsMultiple(true)
      setAllDiffMin(showList[0].diffMin)
    }
    setGroupCloseList(showList)
    setIsShowAlert(showList?.length > 0 && !alertIsChecked)
  }

  const startCount = () => {
    let today = new Date()
    const timerFn = () => {
      // 统一时区
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      // 各个组别距离营业结束的剩余时间
      let newList = updateBSList?.map((item) => {
        const hour = Number(item.to.split(':')[0])
        const min = Number(item.to.split(':')[1])
        const diffMin =
          dayjs(today.setHours(hour, min, 0, 0))
            ?.tz(tz)
            ?.diff(dayjs().tz(tz), 'minutes') || 0
        return { ...item, diffMin }
      })
      countShowAlert(newList)
    }
    timerFn()
    timer && clearInterval(timer)
    const currentTimer = setInterval(timerFn, 60 * 1000)
    setTimer(currentTimer)
  }

  const closeAlert = () => {
    setAlertIsChecked(true)
    setIsShowAlert(false)
    timer && clearInterval(timer)
  }

  return {
    isShowAlert,
    groupCloseList,
    allDiffMin,
    isMultiple,
    closeAlert,
  }
}

export default useCountBusinessTime
