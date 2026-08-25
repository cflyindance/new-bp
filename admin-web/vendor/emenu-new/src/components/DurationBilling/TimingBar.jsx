import React, { useEffect, useState } from 'react'
import { Button, makeStyles } from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import { formatDurationBillingElapsed } from '@/utils/durationBilling'

const useStyles = makeStyles(() => ({
  bar: {
    position: 'fixed',
    zIndex: 4,
    top: 84,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    minWidth: 300,
    maxWidth: 'calc(100vw - 48px)',
    padding: '12px 22px',
    borderRadius: 12,
    color: '#fff',
    background: 'rgba(15, 23, 48, 0.94)',
    border: '1px solid rgba(227, 193, 138, 0.6)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.24)',
  },
  metric: {
    display: 'flex',
    gap: 8,
    whiteSpace: 'nowrap',
  },
  value: {
    color: '#E3C18A',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  endButton: {
    minWidth: 92,
    marginLeft: 'auto',
    color: '#fff',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
}))

export default function TimingBar({ session, onEnd }) {
  const classes = useStyles()
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className={classes.bar} role="status" aria-live="polite">
      <span className={classes.metric}>
        {t('DurationBilling.elapsed')}
        <span className={classes.value}>
          {formatDurationBillingElapsed(session?.startedAt, now)}
        </span>
      </span>
      {onEnd && (
        <Button
          className={classes.endButton}
          variant="outlined"
          size="small"
          onClick={onEnd}
        >
          {t('DurationBilling.endTiming')}
        </Button>
      )}
    </div>
  )
}
