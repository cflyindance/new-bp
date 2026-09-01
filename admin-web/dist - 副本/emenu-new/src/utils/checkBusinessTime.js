import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
dayjs.extend(isBetween)

const WEEK_DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const checkBusinessTime = ({
  hourInfo,
  businessTime,
  systemTime = dayjs().format('YYYY-MM-DD hh:mm:ss'),
}) => {
  const currentTime = dayjs(systemTime)
  const day = WEEK_DAY[currentTime.day()]
  const currentBrandBsTime = hourInfo.filter((each) =>
    businessTime.map((time) => time.id).includes(each.id)
  )
  const currentDate = currentTime.format('YYYY/MM/DD')

  return currentBrandBsTime.find((each) => {
    if (!each.bsDay.includes(day)) {
      return false
    }

    let startTime = dayjs(`${currentDate} ${each.from}`)
    let endTime = dayjs(`${currentDate} ${each.to}`)

    if (endTime.isBefore(startTime, 'minute')) {
      if (currentTime.isBefore(startTime, 'minute')) {
        startTime = startTime.subtract(1, 'day')
      } else {
        endTime = endTime.add(1, 'day')
      }
    }
    return currentTime.isBetween(startTime, endTime, 'minute', '[]')
  })
}

export default checkBusinessTime
