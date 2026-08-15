import { useGlobalState } from '@/hooks/useGlobalState'
import { useSetMenus } from '@/hooks/useSetMenus'
import useSystemConfig from '@/hooks/useSystemConfig'
import { Button, CircularProgress, Dialog } from '@material-ui/core'
import { useBoolean } from 'ahooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './index.module.less'
import { useTranslation } from 'react-i18next'
import Lottie from 'lottie-react'
import FailDialog from './FailDialog'
import SuccessDialog from './SuccessDialog'
import { useLocalStorageState } from 'bhooks'
import { isEqual } from 'lodash-es'
import { serverUrl } from '@/utils/env_var'

const Lottery = (props) => {
  const {
    rewardDishIds,
    thresholdCount,
    winProbability,
    excludeDishIds,
    maxTimes,
  } = props
  const { getFinalConfigById } = useSystemConfig()
  const lotteryAnimationConfig = getFinalConfigById(90)
  const { t } = useTranslation()
  const [orders] = useGlobalState('Orders')
  const [
    lotteryVideoDialogVisible,
    { setTrue: openLotteryVideoDialog, setFalse: closeLotteryVideoDialog },
  ] = useBoolean()

  const [
    lotteryDialogVisible,
    { setTrue: openLotteryDialog, setFalse: closeLotteryDialog },
  ] = useBoolean()
  const [isPlaying, setIsPlaying] = useState(true)
  const [lottieLoading, setLottieLoading] = useState(true)
  const [winVideoLoading, setWinVideoLoading] = useState(false)
  const [loseVideoLoading, setLoseVideoLoading] = useState(false)
  const [giftBoxAni, setGiftBoxAni] = useState(null)
  const [lotteryResult, setLotteryResult] = useState([])

  useEffect(() => {
    if (!lotteryDialogVisible) {
      setIsPlaying(true)
      setLotteryResult([])
    }
  }, [lotteryDialogVisible])

  useEffect(() => {
    if (!lotteryDialogVisible || giftBoxAni) return
    let isMounted = true
    setLottieLoading(true)
    import('./giftBox.json').then((module) => {
      if (!isMounted) return
      setGiftBoxAni(module?.default || module)
    })
    return () => {
      isMounted = false
    }
  }, [lotteryDialogVisible, giftBoxAni])

  const [storagedLottery, setStoragedLottery] = useLocalStorageState(
    'emenu_lottery',
    { defaultValue: { count: 0 }, listenStorageChange: true }
  )
  const lotteryCount = useMemo(() => storagedLottery.count, [storagedLottery])
  const { allMenuItem } = useSetMenus()

  const [rewardDishList, setRewardDishList] = useState([])
  useEffect(() => {
    setRewardDishList((prev) => {
      const newRewardDishList =
        rewardDishIds
          ?.map((each) => {
            return allMenuItem.find((menu) => menu.id === each)
          })
          .filter(Boolean) || []
      if (isEqual(newRewardDishList, prev)) {
        return prev
      }
      return newRewardDishList
    })
  }, [allMenuItem, rewardDishIds])

  const [currentBuffetInfo] = useGlobalState('currentBuffetInfo', [])

  const pureCartItems = useMemo(
    () =>
      orders?.[0]?.cart?.filter((each) => {
        return !(
          each.discountReason === 'Lottery Discount' ||
          currentBuffetInfo.some((item) => item.buffetId === each.id)
        )
      }) || [],
    [orders, currentBuffetInfo]
  )

  const historyLotteryCount = useMemo(
    () => orders?.[0]?.lotteryCount || 0,
    [orders]
  )

  useEffect(() => {
    if (rewardDishList.length > 0 && thresholdCount && winProbability) {
      const joinLotteryItems = pureCartItems.filter((each) => {
        return !excludeDishIds?.includes(each.id)
      })
      const count = joinLotteryItems.reduce((pre, cur) => pre + cur.count, 0)
      const haveLotteryCount = historyLotteryCount + lotteryCount
      const canlotteryCountByCart =
        Math.floor(count / thresholdCount) - haveLotteryCount
      const canlotteryCountByConfig = (maxTimes || Infinity) - haveLotteryCount
      const canlotteryCount = Math.min(
        canlotteryCountByCart,
        canlotteryCountByConfig
      )
      if (canlotteryCount > 0) {
        setLotteryResult((prev) => {
          const newLotteryResult = [...prev]
          const count = canlotteryCount - newLotteryResult.length
          if (count > 0) {
            for (let i = 0; i < count; i++) {
              newLotteryResult.push(Math.random() < winProbability / 100)
            }
          } else {
            newLotteryResult.splice(0, -count)
          }
          return newLotteryResult
        })
        openLotteryDialog()
      } else {
        closeLotteryDialog()
      }
    }
  }, [
    thresholdCount,
    winProbability,
    excludeDishIds,
    maxTimes,
    rewardDishList,
    pureCartItems,
    lotteryCount,
    historyLotteryCount,
    excludeDishIds,
    maxTimes,
  ])

  const lottieRef = useRef(null)
  const onLottieComplete = useCallback(() => {
    closeLotteryVideoDialog()
    setLotteryResult((prev) => {
      const newResult = [...prev]
      const result = newResult.shift()
      if (result) {
        openSuccessDialog()
      } else {
        openFailDialog()
      }
      return newResult
    })
    setIsPlaying(false)
  }, [])

  const onLottieLoad = useCallback(() => {
    setIsPlaying(false)
    setLottieLoading(false)
  }, [])

  const { winLotteryVideoSrc, loseLotteryVideoSrc, lotteryVideoObjectFit } =
    useMemo(() => {
      const lotteryVideoEnabled = lotteryAnimationConfig?.open
      if (!lotteryVideoEnabled) {
        return {}
      }
      const winVideoItem = lotteryAnimationConfig?.winVideo?.[0]
      const loseVideoItem = lotteryAnimationConfig?.loseVideo?.[0]
      const winRawUrl = winVideoItem ? `${serverUrl}${winVideoItem?.url}` : ''
      const loseRawUrl = loseVideoItem
        ? `${serverUrl}${loseVideoItem?.url}`
        : ''
      return {
        winLotteryVideoSrc: winRawUrl,
        loseLotteryVideoSrc: loseRawUrl,
        lotteryVideoObjectFit: lotteryAnimationConfig?.cropDisplay
          ? 'cover'
          : 'contain',
      }
    }, [lotteryAnimationConfig])

  const lotteryVideoSrc = useMemo(() => {
    const currentLotteryResult = lotteryResult?.[0]
    if (currentLotteryResult === undefined) return ''
    return currentLotteryResult ? winLotteryVideoSrc : loseLotteryVideoSrc
  }, [lotteryResult, winLotteryVideoSrc, loseLotteryVideoSrc])

  const winVideoRef = useRef(null)
  const loseVideoRef = useRef(null)

  const onClickPlayBtn = useCallback(() => {
    if (lotteryVideoSrc) {
      openLotteryVideoDialog()
      if (lotteryResult[0]) {
        winVideoRef.current?.play()
      } else {
        loseVideoRef.current?.play()
      }
      return
    }
    if (lottieRef.current) {
      setIsPlaying(true)
      lottieRef.current.setSpeed(0.75)
      lottieRef.current.goToAndPlay(0)
    }
  }, [lotteryVideoSrc, lotteryResult])

  const haveNextLottery = useMemo(
    () => lotteryResult.length > 0,
    [lotteryResult.length]
  )

  const onAbandonLottery = useCallback(() => {
    closeLotteryDialog()
    const nextLotteryLength = lotteryResult.length
    if (nextLotteryLength > 0) {
      setStoragedLottery((prev) => ({
        ...prev,
        count: prev.count + nextLotteryLength,
      }))
    }
  }, [lotteryResult.length])

  const [
    failDialogVisible,
    { setTrue: openFailDialog, setFalse: closeFailDialog },
  ] = useBoolean(false)
  useEffect(() => {
    if (failDialogVisible) {
      setStoragedLottery((prev) => ({ ...prev, count: prev.count + 1 }))
    }
  }, [failDialogVisible])

  const onFailDialogClose = useCallback(() => {
    closeFailDialog()
    if (!haveNextLottery) {
      closeLotteryDialog()
    }
  }, [haveNextLottery])

  const [
    successDialogVisible,
    { setTrue: openSuccessDialog, setFalse: closeSuccessDialog },
  ] = useBoolean()
  const onSuccessDialogClose = useCallback(() => {
    closeSuccessDialog()
    setStoragedLottery((prev) => ({ ...prev, count: prev.count + 1 }))
    if (!haveNextLottery) {
      closeLotteryDialog()
    }
  }, [haveNextLottery])

  return (
    <>
      <Dialog open={lotteryDialogVisible}>
        <div className={styles.lotteryDialog}>
          <div className={styles.title}>
            {t('lottery.activityDialog.title')}
          </div>
          <div className={styles.subTitle}>
            {t('lottery.activityDialog.subTitle', {
              count: lotteryResult.length,
            })}
          </div>
          <div className={styles.lottieContainer}>
            {giftBoxAni && (
              <Lottie
                animationData={giftBoxAni}
                autoplay={false}
                lottieRef={lottieRef}
                loop={false}
                className={styles.lottie}
                onComplete={onLottieComplete}
                onDOMLoaded={onLottieLoad}
              />
            )}
            {(lottieLoading ||
              winVideoLoading ||
              loseVideoLoading ||
              !giftBoxAni) && (
              <div className={styles.lottieLoading}>
                <CircularProgress
                  classes={{ colorPrimary: styles.circularProgress }}
                />
              </div>
            )}
          </div>
          <div className={styles.actions}>
            <Button
              onClick={onAbandonLottery}
              variant="contained"
              color="default"
            >
              {lotteryResult.length === 0
                ? t('lottery.activityDialog.quitBtn')
                : t('lottery.activityDialog.abandonBtn')}
            </Button>
            <Button
              disabled={
                lotteryResult.length === 0 ||
                isPlaying ||
                lottieLoading ||
                winVideoLoading ||
                loseVideoLoading
              }
              onClick={onClickPlayBtn}
              variant="contained"
              color="primary"
            >
              {t('lottery.activityDialog.actionBtn')}
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={lotteryVideoDialogVisible}
        fullScreen
        disableEscapeKeyDown
        onClose={closeLotteryVideoDialog}
        classes={{ root: styles.lotteryVideoDialog }}
        keepMounted
      >
        {winLotteryVideoSrc ? (
          <video
            key={winLotteryVideoSrc}
            src={winLotteryVideoSrc}
            ref={winVideoRef}
            className={styles.lotteryVideo}
            preload="auto"
            playsInline
            style={{
              ...(lotteryResult[0]
                ? { display: 'block' }
                : { display: 'none' }),
              objectFit: lotteryVideoObjectFit,
            }}
            onLoadStart={() => setWinVideoLoading(true)}
            onLoadedData={() => setWinVideoLoading(false)}
            onError={() => setWinVideoLoading(false)}
            onEnded={onLottieComplete}
          />
        ) : null}
        {loseLotteryVideoSrc ? (
          <video
            key={loseLotteryVideoSrc}
            src={loseLotteryVideoSrc}
            ref={loseVideoRef}
            className={styles.lotteryVideo}
            preload="auto"
            playsInline
            style={{
              ...(lotteryResult[0]
                ? { display: 'none' }
                : { display: 'block' }),
              objectFit: lotteryVideoObjectFit,
            }}
            onLoadStart={() => setLoseVideoLoading(true)}
            onLoadedData={() => setLoseVideoLoading(false)}
            onError={() => setLoseVideoLoading(false)}
            onEnded={onLottieComplete}
          />
        ) : null}
      </Dialog>
      <FailDialog
        open={failDialogVisible}
        onClose={onFailDialogClose}
        haveNextLottery={haveNextLottery}
      />
      <SuccessDialog
        open={successDialogVisible}
        onClose={onSuccessDialogClose}
        rewardDishList={rewardDishList}
      />
    </>
  )
}

export default Lottery
