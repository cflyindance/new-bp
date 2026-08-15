import dayjs from 'dayjs'

const WEEK_DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const filterTableBySchedule = (schedule) => {
  const { weekDay, startTime, endTime } = schedule
  const day = WEEK_DAY[dayjs().day()]
  const today = dayjs().format('YYYY/MM/DD')
  // 当日在配置中
  if (weekDay.includes(day)) {
    return dayjs().isBetween(
      `${today} ${startTime}`,
      `${today} ${endTime}`,
      'minutes',
      '[]'
    )
  }
  return false
}

export default filterTableBySchedule
