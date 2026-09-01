import {
  Modal,
  makeStyles,
  Box,
  Typography,
  Paper,
  Button,
} from '@material-ui/core'
import { FeedbackErrorIcon } from '../common/SvgIcons'
import { useTranslation } from 'react-i18next'
import React, { lazy, useCallback, useMemo } from 'react'
import { saveMessage } from '@/services/system'
import { getStorageValue } from '@/utils/storage'
import { useBoolean, useRequest } from 'ahooks'

const FeedbackToast = lazy(() => import('../common/FeedbackToast'))

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  errorWrapper: {
    padding: theme.spacing(3),
    maxWidth: 900,
    background:
      'linear-gradient(90deg, rgba(57, 9, 6, 0.7) 0%, rgba(42, 42, 42, 0.7) 50%, rgba(34, 34, 34, 0.7) 100%)',
    color: theme.palette.error.main,
  },
  errorIcon: {
    fontSize: 30,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: -0.4,
    color: 'inherit',
  },
  errorMessage: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 1.2,
    color: theme.palette.common.white,
  },
  operateRow: {
    marginTop: 128,
  },
  enterBtn: {
    width: 150,
    height: 53,
    fontSize: 18,
    // fontWeight: 600,
    borderRadius: theme.shape.borderRadius * 0.5,
  },
}))

const BuffetViewOnlyModal = (props) => {
  const { open, onClose } = props
  const classes = useStyles()
  const { t } = useTranslation()
  const tableInfo = getStorageValue('emenu_table', {})
  const { currentTable } = tableInfo
  const orderId = useMemo(() => tableInfo?.currentOrder?.id, [tableInfo])

  const [
    openFeedback,
    { setTrue: setOpenFeedback, setFalse: setCloseFeedback },
  ] = useBoolean()

  const sendMessage = useCallback(
    () =>
      saveMessage({
        title: 'Call for Waiter',
        content: currentTable?.name ?? 'None',
        order: { id: orderId },
        iconType: 'WAITER',
        sender: 'EMENU',
        topicName: 'EMENU',
        tableId: currentTable?.id,
      }),
    [currentTable, orderId]
  )

  const { loading, data, mutate, error, run } = useRequest(sendMessage, {
    manual: true,
    onBefore: () => {
      setOpenFeedback()
    },
    onSuccess: () => {
      mutate({
        status: 'warn',
        message: 'Your server will be here in a minute.',
      })
    },
    onFinally: () => {
      onClose?.()
      const t = setTimeout(() => {
        setCloseFeedback()
        clearTimeout(t)
      }, 3000)
    },
  })

  const handleSendMessage = () => {
    run()
  }

  return (
    <>
      <Modal
        open={open}
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 1)',
          },
        }}
      >
        <Box className={classes.root}>
          <Paper className={classes.errorWrapper}>
            <Box display="flex" alignItems="center">
              <FeedbackErrorIcon className={classes.errorIcon} />
              <Box marginLeft={2}>
                <Typography variant="h5" className={classes.errorTitle}>
                  {t('AdminLogin.permission_notInBuffet')}
                </Typography>
                <Typography variant="body1" className={classes.errorMessage}>
                  {t('AdminLogin.permission_errorMsg')}
                </Typography>
              </Box>
            </Box>
          </Paper>
          <Box
            display="flex"
            justifyContent="space-around"
            className={classes.operateRow}
          >
            <Button
              variant="contained"
              color="primary"
              className={classes.enterBtn}
              onClick={onClose}
            >
              {t('AdminSetting.btn_cancel')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              className={classes.enterBtn}
              onClick={handleSendMessage}
            >
              {t('SystemSetting.callServer')}
            </Button>
          </Box>
        </Box>
      </Modal>
      <FeedbackToast
        open={openFeedback}
        loading={loading}
        error={error}
        data={data}
      />
    </>
  )
}

export default BuffetViewOnlyModal
