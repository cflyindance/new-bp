import React, { lazy, useState } from 'react'
import { Box, Button } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { useBoolean } from 'ahooks'
import useSystemConfig from '@/hooks/useSystemConfig'
import useSendMessage from '@/hooks/useSendMessage'
import { getStorageValue } from '@/utils/storage'
import Toast from '@/components/Toast'
import useDurationBilling from '@/hooks/useDurationBilling'
import EndTimingDialog from '@/components/DurationBilling/EndTimingDialog'
import AdminLogin from '@/components/AdminLogin'
import { useFetchOrder } from '@/hooks/useFetchOrder'

const FeedbackToast = lazy(() => import('../common/FeedbackToast'))

const useStyles = makeStyles(() => ({
  submitBtn: {
    height: 56,
    fontSize: 20,
    lineHeight: 1.2,
  },
  actionRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
}))

const CallerServerCheckout = ({ orderSubtotal = 0 }) => {
  const classes = useStyles()
  const { t } = useTranslation()
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

  const handleSendMessage = () => {
    const tableInfo = getStorageValue('emenu_table', {})
    const { currentTable } = tableInfo
    runSaveMessage({
      type: 'checkout',
      title: 'Call for Waiter',
      content: `${currentTable?.name || 'None'}|checkout`,
      iconType: 'WAITER',
      tableId: currentTable?.id,
    })
  }

  const { getFinalConfigById } = useSystemConfig()
  const isCallServerCheckout = getFinalConfigById(29)?.open
  const { durationBilling, status, endTiming } = useDurationBilling()
  const { runFetchOrder } = useFetchOrder()
  const [endTimingOpen, setEndTimingOpen] = useState(false)
  const [endTimingAt, setEndTimingAt] = useState(null)
  const [authorizationOpen, setAuthorizationOpen] = useState(false)
  const [ending, setEnding] = useState(false)
  const isTiming = status === 'timing'
  const tableInfo = getStorageValue('emenu_table', {})
  const tableName = tableInfo?.currentTable?.name || ''

  const handleOpenEndTiming = () => {
    setEndTimingAt(Date.now())
    setEndTimingOpen(true)
  }

  const handleConfirmEndTiming = () => {
    setEndTimingOpen(false)
    setAuthorizationOpen(true)
  }

  const handleAuthorizedEndTiming = async (staff) => {
    setAuthorizationOpen(false)
    setEnding(true)
    try {
      const ended = await endTiming(staff?.userId, endTimingAt)
      if (!ended) {
        Toast.error(t('DurationBilling.endFailed'))
        return
      }
      await runFetchOrder()
      setEndTimingAt(null)
      Toast.success(t('DurationBilling.endSuccess'))
    } catch {
      Toast.error(t('DurationBilling.endFailed'))
    } finally {
      setEnding(false)
    }
  }

  const callButton = isCallServerCheckout ? (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      className={classes.submitBtn}
      onClick={handleSendMessage}
    >
      {t('SettingOrderLimit.limit_callServerCheckout_title')}
    </Button>
  ) : null

  const endButton = isTiming ? (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      className={classes.submitBtn}
      onClick={handleOpenEndTiming}
    >
      {t('DurationBilling.endTiming')}
    </Button>
  ) : null

  return (
    <>
      {callButton || endButton ? (
        <Box className={isCallServerCheckout && isTiming ? classes.actionRow : undefined}>
          {callButton}
          {endButton}
          <LoadingOverlay loading={loading} />
          <FeedbackToast
            open={openFeedback}
            loading={loading}
            error={error}
            data={data}
          />
        </Box>
      ) : null}
      <EndTimingDialog
        open={endTimingOpen}
        tableName={tableName}
        session={durationBilling}
        endedAt={endTimingAt}
        orderSubtotal={orderSubtotal}
        onCancel={() => {
          setEndTimingOpen(false)
          setEndTimingAt(null)
        }}
        onConfirm={handleConfirmEndTiming}
      />
      <AdminLogin
        isOpen={authorizationOpen}
        handleClose={() => setAuthorizationOpen(false)}
        permission="durationBillingEnd"
        next={handleAuthorizedEndTiming}
      />
      <LoadingOverlay loading={ending} />
    </>
  )
}

export default CallerServerCheckout
