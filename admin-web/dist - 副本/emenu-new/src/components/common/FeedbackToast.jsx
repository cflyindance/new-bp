import { Box, Dialog, Paper, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FeedbackErrorIcon,
  FeedbackSuccessIcon,
  FeedbackWarningIcon,
  LoadingIcon,
} from './SvgIcons'
import { InfoOutlined } from '@material-ui/icons'

const useStyles = makeStyles((theme) => ({
  feedback: {
    padding: theme.spacing(3),
    opacity: 0.8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  feedbackDefault: {
    color: theme.palette.common.white,
  },
  feedbackSuccess: {
    color: theme.palette.success.main,
  },
  feedbackError: {
    color: theme.palette.error.main,
  },
  feedbackWarning: {
    color: theme.palette.warning.main,
  },
  loading: {
    marginRight: theme.spacing(2),
    fontSize: 30,
    animation: '$circle 2s linear infinite',
  },
  feedbackIcon: {
    fontSize: 30,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
    color: 'inherit',
  },
  feedbackMessage: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 1.2,
    color: theme.palette.common.white,
  },
  infoIcon: {
    width: '4rem',
    height: '4rem',
    marginRight: '2rem',
    color: theme.palette.warning.main,
  },
  '@keyframes circle': {
    '0%': {
      transformOrigin: '50% 50%',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
}))

function FeedbackToast({ open, loading, error, data, onClose }) {
  const classes = useStyles()
  const { t } = useTranslation()
  if (!data?.status && !error) return <></>
  return (
    <Dialog
      open={open}
      onClose={loading ? null : onClose}
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Paper className={classes.feedback}>
        {loading ? (
          <Box
            display="flex"
            alignItems="center"
            className={classes.feedbackDefault}
          >
            <LoadingIcon className={classes.loading} />
            <Typography variant="h5" className={classes.feedbackTitle}>
              {t('FeedbackToast.loading')}
            </Typography>
          </Box>
        ) : error ? (
          <Box
            display="flex"
            alignItems="center"
            className={classes.feedbackError}
          >
            <FeedbackErrorIcon className={classes.feedbackIcon} />
            <Box marginLeft={2}>
              <Typography variant="h5" className={classes.feedbackTitle}>
                {t('FeedbackToast.error')}
              </Typography>
              <Typography variant="body1" className={classes.feedbackMessage}>
                {t('FeedbackToast.errorMessage')}
              </Typography>
              <Typography variant="body2" color="secondary">
                {error?.message}
              </Typography>
            </Box>
          </Box>
        ) : data?.status === 'ok' ? (
          <Box
            display="flex"
            alignItems="center"
            className={classes.feedbackSuccess}
          >
            <FeedbackSuccessIcon className={classes.feedbackIcon} />
            <Box marginLeft={2}>
              <Typography variant="h5" className={classes.feedbackTitle}>
                {t('FeedbackToast.success')}
              </Typography>
              <Typography variant="body1" className={classes.feedbackMessage}>
                {t('FeedbackToast.successMessage')}
                {/* {data?.message} */}
              </Typography>
            </Box>
          </Box>
        ) : data?.status === 'warn' ? (
          <Box
            display="flex"
            alignItems="center"
            className={classes.feedbackWarning}
          >
            <FeedbackWarningIcon className={classes.feedbackIcon} />
            <Box marginLeft={2}>
              <Typography variant="h5" className={classes.feedbackTitle}>
                {t('FeedbackToast.warning')}
              </Typography>
              <Typography variant="body1" className={classes.feedbackMessage}>
                {t('FeedbackToast.warningMessage')}
                {/* {data?.message} */}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            className={classes.feedbackDefault}
          >
            <InfoOutlined className={classes.infoIcon} />
            <Typography variant="body1" className={classes.feedbackMessage}>
              {data?.message}
            </Typography>
          </Box>
        )}
      </Paper>
    </Dialog>
  )
}

export default memo(FeedbackToast)
