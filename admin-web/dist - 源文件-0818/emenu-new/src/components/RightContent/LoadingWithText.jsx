import { Backdrop, CircularProgress, makeStyles } from '@material-ui/core'
import { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
    background: '#000',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipInfo: {
    fontSize: '1.25rem',
    marginBottom: '24px',
  },
}))

function LoadingOverlay({ loading, onClick, setLoading }) {
  const classes = useStyles()
  const { t } = useTranslation()
  const [delayLoading, setDelayLoading] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (loading) {
      setDelayLoading(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setDelayLoading(false)
        clearTimeout(timerRef.current)
      }, 1500)
    }
    return () => {
      setDelayLoading(false)
      clearTimeout(timerRef.current)
    }
  }, [loading])

  useEffect(() => {
    if (!delayLoading) {
      setLoading(false)
    }
  }, [delayLoading, setLoading])

  return (
    <Backdrop
      className={classes.backdrop}
      open={delayLoading}
      onClick={onClick}
    >
      <div className={classes.content}>
        <div className={classes.tipInfo}>{t('Order.update')}</div>
        <CircularProgress />
      </div>
    </Backdrop>
  )
}

export default memo(LoadingOverlay)
