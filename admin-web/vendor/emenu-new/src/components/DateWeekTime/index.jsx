import { useMemo, useState } from 'react'
import { TimePicker } from 'antd'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import styles from './index.module.less'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

const timeFormat = 'HH:mm'
dayjs.extend(customParseFormat)

const DateWeekTime = (props) => {
  // 手动控制显示隐藏 解决在部分机器上未确定就关闭timePicker
  const [startTimeOpen, setStartTimeOpen] = useState(false)
  const [endTimeOpen, setEndTimeOpen] = useState(false)
  const { onChange, value } = props
  const { t } = useTranslation()

  const selectedStartTime = useMemo(() => {
    return value.startTime ? dayjs(value.startTime, timeFormat) : null
  }, [value])

  const selectedEndTime = useMemo(() => {
    return value.endTime ? dayjs(value.endTime, timeFormat) : null
  }, [value])

  const selectedWeekDay = useMemo(() => {
    return value.weekDay || []
  }, [value])

  const handleChange = (key, newValue) => {
    onChange({
      ...value,
      [key]: newValue,
    })
  }

  const handleEditWeekDay = (key, day) => {
    const isSelected = selectedWeekDay.find((each) => each === day)
    const newValue = !isSelected
      ? [...selectedWeekDay, day]
      : selectedWeekDay.filter((each) => each !== day)
    handleChange(key, newValue)
  }

  const handleChangeTime = (key, time) => {
    const afterFormatTime = dayjs(time).format(timeFormat)
    handleChange(key, time ? afterFormatTime : null)
    startTimeOpen && setStartTimeOpen(false)
    endTimeOpen && setEndTimeOpen(false)
  }

  return (
    <div className={styles.dateWeekTimeWrapper}>
      <div className={styles.timeRow}>
        <div className={styles.timeLabel}>{t('crm.weeks')}</div>
        <div className={styles.weekSet}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => {
            return (
              <div
                onClick={() => handleEditWeekDay('weekDay', day)}
                className={classNames(
                  styles.weekDay,
                  selectedWeekDay.includes(day) && styles.work
                )}
                key={day}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>
      <div className={styles.timeRow}>
        <div className={styles.timeLabel}>{t('schedule.time')}</div>
        <div className={styles.weekSet}>
          <TimePicker
            onFocus={() => {
              setStartTimeOpen(true)
              setEndTimeOpen(false)
            }}
            open={startTimeOpen}
            format={timeFormat}
            value={selectedStartTime}
            onChange={(startTime) => handleChangeTime('startTime', startTime)}
          />
          <span className={styles.divider}>—</span>
          <TimePicker
            onFocus={() => {
              setEndTimeOpen(true)
              setStartTimeOpen(false)
            }}
            open={endTimeOpen}
            format={timeFormat}
            value={selectedEndTime}
            onChange={(endTime) => handleChangeTime('endTime', endTime)}
          />
        </div>
      </div>
    </div>
  )
}

export default DateWeekTime
