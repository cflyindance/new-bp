import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { fetchCompanyProfile } from '@/services/system'
import { sendPosLog } from '@/services/setting'

dayjs.extend(utc)
dayjs.extend(timezone)

const syncTime = async () => {
  const localTime = dayjs()
  const localTimeZoneName = dayjs.tz.guess()

  try {
    const { data, headers } = await fetchCompanyProfile(true)
    const serverTimeZoneOffsetStr =
      data.code === 0 && data.data?.company?.timeZoneOffset
    const serverTimeZoneOffset = Number(serverTimeZoneOffsetStr)
    const serverTimeFromHeader = headers['date']
    if (!Number.isNaN(serverTimeZoneOffset) && serverTimeFromHeader) {
      const serverTimeUTC0 = dayjs.utc(serverTimeFromHeader)
      const serverTimeAfterTZ = serverTimeUTC0
        .tz(localTimeZoneName)
        .format('YYYY-MM-DD HH:mm:ss')
      const serverTimeAfterOffset = serverTimeUTC0
        .add(serverTimeZoneOffset, 'ms')
        .format('YYYY-MM-DD HH:mm:ss')

      const localTimeZoneOffsetStr = `UTC${localTime.format('Z')}`
      const localTimeStr = localTime.format('YYYY-MM-DD HH:mm:ss')
      const localTimeZoneNameStr = localTimeZoneName
      const serverTimeZoneOffsetStr = `UTC${dayjs()
        .utcOffset(serverTimeZoneOffset / (60 * 1000))
        .format('Z')}`
      const serverTimeStr = serverTimeAfterOffset
      const serverIp = window.location.hostname

      if (serverTimeAfterTZ !== serverTimeAfterOffset) {
        // 比较时区是否一致
        sendPosLog(
          `EMenu time sync error (timeZone) - serverTime:${serverTimeStr}, serverTimeOffset:${serverTimeZoneOffsetStr}, localTime:${localTimeStr}, localTimeZoneOffset:${localTimeZoneOffsetStr}, localTimeZoneName:${localTimeZoneNameStr}`
        )
        return {
          isTimeSync: false,
          serverIp,
          localTime: localTimeStr,
          localTimeZoneOffset: localTimeZoneOffsetStr,
          localTimeZoneName: localTimeZoneNameStr,
          serverTime: serverTimeStr,
          serverTimeOffset: serverTimeZoneOffsetStr,
        }
      }

      const timeDiff = dayjs(serverTimeAfterOffset).diff(localTime, 'm')
      if (timeDiff >= 5 || timeDiff <= -5) {
        // 比较时间差，如果差值大于5分钟，则认为时间不同步
        sendPosLog(
          `EMenu time sync error (timeDiff) - serverTime:${serverTimeStr}, serverTimeOffset:${serverTimeZoneOffsetStr}, localTime:${localTimeStr}, localTimeZoneOffset:${localTimeZoneOffsetStr}, localTimeZoneName:${localTimeZoneNameStr}`
        )
        return {
          isTimeSync: false,
          serverIp,
          localTime: localTimeStr,
          localTimeZoneOffset: localTimeZoneOffsetStr,
          localTimeZoneName: localTimeZoneNameStr,
          serverTime: serverTimeStr,
          serverTimeOffset: serverTimeZoneOffsetStr,
        }
      }
    }
  } catch {
    console.log('syncTime error')
  }
  return {
    isTimeSync: true,
  }
}

export default syncTime
