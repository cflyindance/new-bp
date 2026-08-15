import globalRAFManager from '@/utils/globalRAFManager'
import dayjs from 'dayjs'
import { useState, useEffect, useMemo, useRef } from 'react'

const useRafCountDown = (interval, throttle) => {
  const [remainingTime, setRemainingTime] = useState(null)
  const throttleRef = useRef(0)

  useEffect(() => {
    if (interval && typeof interval === 'object') {
      const startTime = interval.startTime
      const durationMax = interval.durationMax
      const timeLeft = durationMax - dayjs().diff(startTime, 'seconds')
      if (timeLeft > 0) {
        const minutes = Math.floor(timeLeft / 60)
        const seconds = Math.floor(timeLeft % 60)
        setRemainingTime({
          minutes,
          seconds,
        })
        throttle && (throttleRef.current = performance.now())
        const removeTask = globalRAFManager.addTask(() => {
          if (throttle) {
            if (performance.now() - throttleRef.current < throttle) {
              return
            }
            throttleRef.current = performance.now()
          }
          const timeLeft = durationMax - dayjs().diff(startTime, 'seconds')
          if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / 60)
            const seconds = Math.floor(timeLeft % 60)
            setRemainingTime({
              minutes,
              seconds,
            })
          } else {
            removeTask()
            setRemainingTime(null)
          }
        })

        return () => {
          removeTask()
          setRemainingTime(null)
        }
      }
    }
    setRemainingTime(null)
  }, [interval])

  const remainingTimeStr = useMemo(() => {
    if (!remainingTime) return ''
    return `${remainingTime.minutes.toString().padStart(2, '0')}:${remainingTime.seconds.toString().padStart(2, '0')}`
  }, [remainingTime])

  return {
    remainingTime,
    remainingTimeStr,
  }
}

export default useRafCountDown
