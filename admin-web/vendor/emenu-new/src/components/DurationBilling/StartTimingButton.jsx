import React from 'react'
import { Button, Paper, makeStyles } from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import { formatDurationBillingRule } from '@/utils/durationBilling'

const useStyles = makeStyles((theme) => ({
  card: {
    width: 420,
    maxWidth: 'calc(100vw - 48px)',
    marginBottom: 28,
    padding: '22px 26px 24px',
    borderRadius: 18,
    color: theme.palette.common.white,
    background: 'rgba(15, 23, 48, 0.9)',
    border: '1px solid rgba(227, 193, 138, 0.55)',
  },
  table: {
    fontSize: 24,
    fontWeight: 700,
  },
  rule: {
    marginTop: 8,
    color: '#E3C18A',
    fontSize: 16,
    lineHeight: 1.5,
  },
  button: {
    width: '100%',
    height: 58,
    marginTop: 18,
    borderRadius: 10,
    fontSize: 20,
    fontWeight: 700,
  },
}))

export default function StartTimingButton({ tableName, ruleSnapshot, onStart }) {
  const classes = useStyles()
  const { t } = useTranslation()
  return (
    <Paper className={classes.card} elevation={6}>
      <div className={classes.table}>{tableName}</div>
      <div className={classes.rule}>
        {ruleSnapshot?.name} · {formatDurationBillingRule(ruleSnapshot)}
      </div>
      <Button
        className={classes.button}
        variant="contained"
        color="primary"
        onClick={(event) => {
          event.stopPropagation()
          onStart()
        }}
      >
        {t('DurationBilling.startTiming')}
      </Button>
    </Paper>
  )
}
