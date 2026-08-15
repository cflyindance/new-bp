import React, { lazy } from 'react'
import { Box, Button } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { useBoolean } from 'ahooks'
import useSystemConfig from '@/hooks/useSystemConfig'
import useSendMessage from '@/hooks/useSendMessage'
import { getStorageValue } from '@/utils/storage'

const FeedbackToast = lazy(() => import('../common/FeedbackToast'))

const useStyles = makeStyles(() => ({
  submitBtn: {
    height: 56,
    fontSize: 20,
    lineHeight: 1.2,
  },
}))

const CallerServerCheckout = () => {
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

  return (
    <>
      {isCallServerCheckout ? (
        <Box>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            className={classes.submitBtn}
            onClick={handleSendMessage}
          >
            {t('SettingOrderLimit.limit_callServerCheckout_title')}
          </Button>
          <LoadingOverlay loading={loading} />
          <FeedbackToast
            open={openFeedback}
            loading={loading}
            error={error}
            data={data}
          />
        </Box>
      ) : null}
    </>
  )
}

export default CallerServerCheckout
