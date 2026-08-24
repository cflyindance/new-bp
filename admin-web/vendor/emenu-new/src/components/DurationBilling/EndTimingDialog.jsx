import React, { useMemo } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles,
} from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import {
  calcDurationBillingFee,
  formatDurationBillingElapsed,
} from '@/utils/durationBilling'

const useStyles = makeStyles((theme) => ({
  paper: {
    width: 480,
    maxWidth: 'calc(100vw - 40px)',
    borderRadius: 16,
  },
  title: {
    padding: '24px 28px 12px',
    fontSize: 24,
    fontWeight: 700,
  },
  content: {
    padding: '12px 28px 20px',
  },
  tableName: {
    marginBottom: 18,
    color: theme.palette.text.secondary,
    fontSize: 16,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #ECECEC',
    fontSize: 17,
  },
  finalRow: {
    borderBottom: 0,
  },
  value: {
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  actions: {
    padding: '8px 28px 24px',
  },
  button: {
    minWidth: 128,
    height: 48,
    borderRadius: 8,
    fontSize: 16,
  },
}))

export default function EndTimingDialog({
  open,
  tableName,
  session,
  endedAt,
  orderSubtotal,
  onCancel,
  onConfirm,
}) {
  const classes = useStyles()
  const { t } = useTranslation()
  const timingFee = useMemo(
    () =>
      calcDurationBillingFee(
        session?.ruleSnapshot,
        session?.startedAt,
        endedAt
      ),
    [session, endedAt]
  )

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      classes={{ paper: classes.paper }}
      aria-labelledby="duration-billing-end-title"
    >
      <DialogTitle id="duration-billing-end-title" className={classes.title}>
        {t('DurationBilling.endConfirmTitle')}
      </DialogTitle>
      <DialogContent className={classes.content}>
        <div className={classes.tableName}>{tableName}</div>
        <div className={classes.row}>
          <span>{t('DurationBilling.elapsed')}</span>
          <span className={classes.value}>
            {formatDurationBillingElapsed(session?.startedAt, endedAt)}
          </span>
        </div>
        <div className={classes.row}>
          <span>{t('DurationBilling.timingFee')}</span>
          <span className={classes.value}>¥{Number(timingFee ?? 0).toFixed(2)}</span>
        </div>
        <div className={`${classes.row} ${classes.finalRow}`}>
          <span>{t('DurationBilling.orderSubtotal')}</span>
          <span className={classes.value}>
            ¥{Number(orderSubtotal ?? 0).toFixed(2)}
          </span>
        </div>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button className={classes.button} onClick={onCancel}>
          {t('DurationBilling.cancel')}
        </Button>
        <Button
          className={classes.button}
          variant="contained"
          color="primary"
          onClick={onConfirm}
        >
          {t('DurationBilling.confirmAndAuthorize')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

