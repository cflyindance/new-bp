import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Snackbar, makeStyles } from '@material-ui/core'
import { CheckCircleRounded, CloseRounded } from '@material-ui/icons'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    fontSize: 20,
    fontWeight: 500,
    lineHeight: 1.2,
    color: '#4F4F4F',
    backgroundColor: '#F4F4F5',
    borderLeftStyle: 'solid',
    borderLeftWidth: theme.spacing(1),
    borderLeftColor: theme.palette.success.main,
    borderRadius: theme.shape.borderRadius,
  },
  prefixIcon: {
    width: 30,
    height: 30,
    marginRight: theme.spacing(2),
    color: theme.palette.success.main,
  },
  suffixIcon: {
    marginLeft: theme.spacing(2),
    color: '#1C1B1F',
    cursor: 'pointer',
  },
}))

function OrderUpdatedToast({ open, onClose }) {
  const classes = useStyles()
  const { t } = useTranslation()

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      open={open}
      onClose={onClose}
      className={classes.root}
      autoHideDuration={3000}
      transitionDuration={{ enter: 0, exit: 0 }}
    >
      <Box display="flex" alignItems="center">
        <CheckCircleRounded className={classes.prefixIcon} />
        {t('OrderUpdatedToast.message')}
        <CloseRounded className={classes.suffixIcon} onClick={onClose} />
      </Box>
    </Snackbar>
  )
}

export default memo(OrderUpdatedToast)
