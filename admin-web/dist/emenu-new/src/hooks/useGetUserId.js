import { getStorageValue } from '@/utils/storage'
import useSystemConfig from '@/hooks/useSystemConfig'
import filterTableBySchedule from '@/utils/filterTableBySchedule'

const useGetUserId = () => {
  const { getFinalConfigById } = useSystemConfig()
  const isScheduleOpen = getFinalConfigById(30)?.open
  const scheduleSetting = getFinalConfigById(30)?.scheduleSetting

  // [] -> 未开启排班， [empty,empty] -> 当前桌当前时间无排班, [1,2,3] 这种 > 1代表有交叉排班
  const getStaffByTimeAndTable = () => {
    if (!isScheduleOpen) return []
    const currentTableId = getStorageValue('emenu_table')?.currentTable?.id
    // 根据时间和当前桌子过滤
    const staffFilterByTimeAndTable = scheduleSetting
      ?.filter(
        (schedule) =>
          schedule.selectedArea.includes(currentTableId) &&
          filterTableBySchedule(schedule)
      )
      ?.map((table) => table.selectedStaff)
      ?.flat()
    // 当前桌当前时间无排班
    if (!staffFilterByTimeAndTable?.length) return new Array(2)
    // 去重
    return [...new Set(staffFilterByTimeAndTable)]
  }

  const getUserId = () => {
    const passwordStaff = getStorageValue('emenu_user')?.userId
    // 未开启，以输入密码为准
    if (!isScheduleOpen) return passwordStaff
    // 当前时间当前桌子配置的服务员
    const staffFilterByTimeAndTable = getStaffByTimeAndTable()
    // 当前时间当前桌子为1人排班
    if (staffFilterByTimeAndTable?.length === 1)
      return staffFilterByTimeAndTable[0]
    // 未配置服务员/当前时间当前桌子交叉排班, 以输入密码为准
    return passwordStaff
  }

  return {
    getStaffByTimeAndTable,
    getUserId,
  }
}

export default useGetUserId
