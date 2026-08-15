import { Backdrop, CircularProgress, makeStyles } from '@material-ui/core'
import { memo } from 'react'

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
    flexDirection: 'column',
  },
  circularProgress: {
    color: '#96272F',
  },
}))

function LoadingOverlay({ loading, onClick, children, className }) {
  const classes = useStyles()
  return (
    <Backdrop
      className={`${classes.backdrop} ${className || ''}`}
      open={loading}
      onClick={onClick}
    >
      <CircularProgress classes={{ colorPrimary: classes.circularProgress }} />
      {children}
    </Backdrop>
  )
}

export default memo(LoadingOverlay)
