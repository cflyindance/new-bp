import React, { lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dialog, Typography } from '@material-ui/core'
import { NotificationsNoneRounded } from '@material-ui/icons'
import { useBoolean, useRequest } from 'ahooks'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { getStorageValue } from '@/utils/storage'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import useSendMessage from '@/hooks/useSendMessage'
import useSystemConfig from '@/hooks/useSystemConfig'
import { emenuNotificationMap } from '@/constants/systemConfig'
import { LoadingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getMessages } from '@/services/system'

const useStyles = makeStyles((theme) => ({
  serverBtn: {
    borderRadius: '20px',
    backgroundColor: '#fff',
    '&:hover': {
      backgroundColor: '#fff !important',
    },
  },
  serverBtnLoading: {
    position: 'absolute',
  },
  form: {
    padding: 20,
    width: 368,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.common.white,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 1.2,
    letterSpacing: -0.6,
  },
  optionBtnBox: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'column',
    paddingTop: 20,
  },
  optionBtnList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxHeight: 'calc(100vh - 300px)',
    overflowY: 'auto',
    '& > button:first-child': {
      marginTop: 0,
    },
    '&::-webkit-scrollbar': {
      width: 4,
      height: 4,
      borderRadius: 10,
      backgroundColor: '#aaaaaa',
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: 10,
      backgroundColor: '#96272f',
    },
  },
  optionBtn: {
    width: 304,
    height: 40,
    border: '1px solid #E0E0E0',
    color: '#000000',
    borderRadius: 5,
    fontSize: 18,
    fontWeight: 'normal',
    marginTop: 20,
  },
  cancelBtn: {
    width: 304,
    height: 56,
    border: '1px solid #E0E0E0',
    color: '#ffffff',
    background: '#96272F',
    borderRadius: 10,
    fontSize: 18,
    fontWeight: 'normal',
    marginTop: 20,
  },
  statusTip: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 16,
    height: 44,
    lineHeight: '44px',
    margin: '20px auto 0',
    width: 304,
  },
  statusTipLeft: {
    color: '#ffffff',
    textAlign: 'center',
    width: 75,
    flexShrink: 0,
  },
  statusTipRight: {
    textAlign: 'center',
    width: '100%',
  },
  statusTipLeft_pending: {
    background: '#96272F',
  },
  statusTipRight_pending: {
    background: 'rgba(150, 39, 47, 0.2)',
    color: '#96272F',
  },
  statusTipLeft_resolved: {
    background: '#279668',
  },
  statusTipRight_resolved: {
    background: 'rgba(39, 150, 104, 0.2)',
    color: '#004629',
  },
  calledTip: {
    fontSize: 16,
    color: '#96272F',
    right: 12,
    position: 'absolute',
  },
}))

const FeedbackToast = lazy(() => import('../common/FeedbackToast'))

const ServerButton = (props) => {
  const classes = useStyles()
  const { getFinalConfigById } = useSystemConfig()
  const [
    openFeedback,
    { setTrue: setOpenFeedback, setFalse: setCloseFeedback },
  ] = useBoolean()
  const {
    run: runSaveMessage,
    loading,
    data,
    error,
  } = useSendMessage({
    onBeforeSend: setOpenFeedback,
    onAfterSend: setCloseFeedback,
  })
  const isOpenCallServer = getFinalConfigById(51)?.open
  const callServerTimeIntervalConfig = getFinalConfigById(61)
  const isOpenCallServerTimeInterval = callServerTimeIntervalConfig?.open
  const isOpenCallServerWithoutOrder = getFinalConfigById(62)?.open

  const userInfo = getStorageValue('emenu_user')
  const tableInfo = getStorageValue('emenu_table', {})
  const { currentTable, currentOrder } = tableInfo

  const [lastCallServerMessage, setLastCallServerMessage] = useState(null)
  const fetchSystemMessage = () => {
    const now = dayjs()
    const toStr = now.format('YYYY-MM-DD HH:mm:ss')
    const timeInterval =
      (callServerTimeIntervalConfig?.open &&
        callServerTimeIntervalConfig.callServerTimeInterval) ||
      0
    const fromStr = now
      .subtract(timeInterval, 'minute')
      .format('YYYY-MM-DD HH:mm:ss')
    return getMessages({
      userId: userInfo.userId,
      from: fromStr,
      to: toStr,
      topicId: 8,
      tableId: currentTable?.id,
    })
  }

  const enabledEmenuNotificationMap = useMemo(
    () => emenuNotificationMap.filter((_) => getFinalConfigById(_.id)?.open),
    [getFinalConfigById]
  )
  const enabledEmenuNotificationTypes = useMemo(() => {
    const list = enabledEmenuNotificationMap.map((_) => _.value)
    list.push('') // 其他服务
    return list
  }, [enabledEmenuNotificationMap])
  const {
    runAsync: runPollingFetchSystemMessage,
    cancel: cancelPollingFetchSystemMessage,
  } = useRequest(fetchSystemMessage, {
    manual: true,
    pollingInterval: 5 * 1000,
    pollingWhenHidden: false,
    onSuccess: (res) => {
      const messageList = res?.message || []
      for (let i = messageList.length - 1; i >= 0; i--) {
        const item = messageList[i]
        const { title, content, order, tableId } = item
        if (title === 'Call for Waiter' && content) {
          const type = content.split('|')[1]
          if (enabledEmenuNotificationTypes.includes(type)) {
            if (currentOrder?.id) {
              if (currentOrder?.id === order?.id) {
                setLastCallServerMessage({
                  ...item,
                  contentType: type,
                })
                return
              }
            } else if (currentTable?.id && !order?.id) {
              if (currentTable?.id === tableId) {
                setLastCallServerMessage({
                  ...item,
                  contentType: type,
                })
                return
              }
            }
          }
        }
      }
      setLastCallServerMessage(null)
    },
  })

  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const optionOpen =
    getFinalConfigById(29)?.open ||
    getFinalConfigById(41)?.open ||
    getFinalConfigById(42)?.open ||
    getFinalConfigById(43)?.open ||
    getFinalConfigById(68)?.open ||
    getFinalConfigById(69)?.open ||
    getFinalConfigById(70)?.open

  const [btnLoading, { setTrue: showBtnLoading, setFalse: hideBtnLoading }] =
    useBoolean()

  const handleOpen = async () => {
    if (isOpenCallServerTimeInterval) {
      showBtnLoading()
      try {
        await runPollingFetchSystemMessage()
      } catch (e) {
        console.log(e)
      }
      hideBtnLoading()
    }
    optionOpen || isOpenCallServerTimeInterval
      ? setOpen(true)
      : handleSendMessage('callServer')
  }

  useEffect(() => {
    if (!open) {
      cancelPollingFetchSystemMessage()
    }
  }, [open])

  const handleSendMessage = (messageType) => {
    runSaveMessage({
      type: messageType,
      title: 'Call for Waiter',
      content: `${currentTable?.name || 'None'}|${messageType === 'callServer' ? '' : messageType}`,
      iconType: 'WAITER',
      tableId: currentTable?.id,
    })
    setOpen(false)
  }

  const [nextCallTime, setNextCallTime] = useState(null)
  const timeCounterRef = useRef()
  useEffect(() => {
    if (open && lastCallServerMessage?.createdOn) {
      const now = dayjs()
      const last = dayjs(lastCallServerMessage?.createdOn)
      let timeCounter = Math.floor(
        ((callServerTimeIntervalConfig?.callServerTimeInterval || 0) *
          60 *
          1000 -
          (now.valueOf() - last.valueOf())) /
          1000
      )
      const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return { minutes, seconds: (seconds < 10 ? '0' : '') + seconds }
      }
      if (timeCounter > 0) {
        setNextCallTime(formatTime(timeCounter))
        timeCounterRef.current = setInterval(() => {
          timeCounter = timeCounter - 1
          if (timeCounter <= 0) {
            setNextCallTime(null)
            clearInterval(timeCounterRef.current)
            return
          }
          setNextCallTime(formatTime(timeCounter))
        }, 1000)
      }
    }

    return () => {
      setNextCallTime(null)
      clearInterval(timeCounterRef.current)
    }
  }, [
    open,
    lastCallServerMessage?.createdOn,
    callServerTimeIntervalConfig?.callServerTimeInterval,
  ])

  const serverBtnVisible = useMemo(() => {
    if (isOpenCallServer) {
      if (isOpenCallServerWithoutOrder) {
        if (currentTable?.id) {
          return true
        }
      } else {
        if (currentOrder?.id) {
          return true
        }
      }
    }
    return false
  }, [
    isOpenCallServer,
    isOpenCallServerWithoutOrder,
    currentTable,
    currentOrder,
  ])

  if (!serverBtnVisible) return null

  return (
    <>
      {props.renderButton ? (
        props.renderButton({ onClick: handleOpen, isLoading: btnLoading })
      ) : (
        <Button
          onClick={handleOpen}
          variant="outlined"
          className={classes.serverBtn}
          disabled={btnLoading}
        >
          <NotificationsNoneRounded />
          <span>{t('SystemSetting.callServer')}</span>
          {btnLoading && (
            <LoadingOutlined className={classes.serverBtnLoading} />
          )}
        </Button>
      )}
      <LoadingOverlay loading={loading} />
      <FeedbackToast
        open={openFeedback}
        loading={loading}
        error={error}
        data={data}
      />
      <Dialog open={open}>
        <form className={classes.form}>
          <Typography variant="h4" className={classes.title}>
            {t('SystemSetting.callServerTitle')}
          </Typography>
          {nextCallTime && lastCallServerMessage ? (
            <div className={classes.statusTip}>
              {lastCallServerMessage.status === 'NEW' ? (
                <>
                  <div
                    className={`${classes.statusTipLeft} ${classes.statusTipLeft_pending}`}
                  >
                    {t('SystemSetting.callServerStatus_pending')}
                  </div>
                  <div
                    className={`${classes.statusTipRight} ${classes.statusTipRight_pending}`}
                  >
                    {t('SystemSetting.callServerIntervalTimeTip', nextCallTime)}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`${classes.statusTipLeft} ${classes.statusTipLeft_resolved}`}
                  >
                    {t('SystemSetting.callServerStatus_resolved')}
                  </div>
                  <div
                    className={`${classes.statusTipRight} ${classes.statusTipRight_resolved}`}
                  >
                    {t('SystemSetting.callServerIntervalTimeTip', nextCallTime)}
                  </div>
                </>
              )}
            </div>
          ) : null}
          <div className={classes.optionBtnBox}>
            <div className={classes.optionBtnList}>
              {enabledEmenuNotificationMap.map((each) => {
                // if (each.id === callServerCheckout.id && !orderId) {
                //   return null
                // }
                return (
                  <Button
                    key={each.key}
                    variant="outlined"
                    className={classes.optionBtn}
                    disabled={!!nextCallTime}
                    onClick={() => {
                      handleSendMessage(each.value)
                    }}
                  >
                    {t(`SystemSetting.${each.key}_option`)}
                    {nextCallTime &&
                    lastCallServerMessage?.contentType === each.value ? (
                      <span className={classes.calledTip}>
                        {t('SystemSetting.callServerOptionStatus_called')}
                      </span>
                    ) : null}
                  </Button>
                )
              })}
              <Button
                variant="outlined"
                className={classes.optionBtn}
                disabled={!!nextCallTime}
                onClick={() => {
                  handleSendMessage('callServer')
                }}
              >
                {t('SystemSetting.otherServe')}
                {nextCallTime && lastCallServerMessage?.contentType === '' ? (
                  <span className={classes.calledTip}>
                    {t('SystemSetting.callServerOptionStatus_called')}
                  </span>
                ) : null}
              </Button>
            </div>
            <Button
              variant="outlined"
              className={classes.cancelBtn}
              onClick={() => {
                setOpen(false)
              }}
            >
              {t('PickSize.btn_cancel')}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}

export default ServerButton
