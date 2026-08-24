import React, { useEffect, useState } from 'react'
import { Button, Dialog, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import { RUNTIME_ENV_OPTIONS } from '@/utils/runtimeEnv'

const useStyles = makeStyles((theme) => ({
  paper: {
    width: 420,
    // emenu-real-screen-exception: this dialog is portaled to document.body.
    maxWidth: 'calc(100vw - 48px)',
    padding: '24px 24px 28px',
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
    textAlign: 'center',
  },
  options: {
    display: 'flex',
    marginTop: 24,
  },
  optionBtn: {
    flex: 1,
    height: 56,
    fontSize: 18,
    fontWeight: 700,
    borderRadius: 6,
    '& + &': {
      marginLeft: 12,
    },
  },
  optionBtn_active: {
    color: theme.palette.common.white,
    background: theme.palette.primary.main,
    '&:hover': {
      background: theme.palette.primary.main,
    },
  },
  actions: {
    display: 'flex',
    marginTop: 28,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    fontSize: 18,
    fontWeight: 600,
    borderRadius: 6,
    '& + &': {
      marginLeft: 16,
    },
  },
}))

export default function EnvironmentDialog({
  open,
  value,
  onCancel,
  onConfirm,
}) {
  const classes = useStyles()
  const { t } = useTranslation()
  const [selectedEnv, setSelectedEnv] = useState(value)

  useEffect(() => {
    if (open) {
      setSelectedEnv(value)
    }
  }, [open, value])

  return (
    <Dialog open={open}>
      <Paper className={classes.paper}>
        <div className={classes.title}>{t('runtimeEnvironment.title')}</div>
        <div className={classes.options}>
          {RUNTIME_ENV_OPTIONS.map((env) => (
            <Button
              key={env}
              variant={selectedEnv === env ? 'contained' : 'outlined'}
              className={`${classes.optionBtn} ${
                selectedEnv === env ? classes.optionBtn_active : ''
              }`}
              onClick={() => setSelectedEnv(env)}
            >
              {env}
            </Button>
          ))}
        </div>
        <div className={classes.actions}>
          <Button
            variant="outlined"
            className={classes.actionBtn}
            onClick={onCancel}
          >
            {t('runtimeEnvironment.cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            className={classes.actionBtn}
            onClick={() => onConfirm(selectedEnv)}
          >
            {t('runtimeEnvironment.confirm')}
          </Button>
        </div>
      </Paper>
    </Dialog>
  )
}
