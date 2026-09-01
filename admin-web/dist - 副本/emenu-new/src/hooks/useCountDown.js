import { useState, useEffect, useCallback, useRef } from 'react'

const useCountDown = (seconds) => {
  const [remainingTime, setRemainingTime] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef(null)

  // 格式化时间为 mm:ss
  const formatTime = useCallback((totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return null
    const mm = Math.floor(totalSeconds / 60)
    const ss = totalSeconds % 60
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
  }, [])

  // 执行倒计时逻辑
  const runCountdown = useCallback(
    (currentSeconds) => {
      if (currentSeconds <= 0) {
        setRemainingTime(null)
        setIsRunning(false)
        return
      }

      setRemainingTime(formatTime(currentSeconds))
      setIsRunning(true)

      timerRef.current = setInterval(() => {
        currentSeconds -= 1
        setRemainingTime(formatTime(currentSeconds))

        if (currentSeconds <= 0) {
          clearInterval(timerRef.current)
          setIsRunning(false)
        }
      }, 1000)
    },
    [formatTime]
  )

  useEffect(() => {
    // 清理之前的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (!seconds || seconds <= 0) {
      setRemainingTime(null)
      setIsRunning(false)
      return
    }

    // 立即执行一次
    runCountdown(seconds)

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [seconds, runCountdown])

  return {
    remainingTime,
    isRunning,
  }
}

export default useCountDown
