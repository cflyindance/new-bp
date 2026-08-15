import { Box, Dialog, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import StyledButton from '../common/StyledButton'
import useSystemConfig from '@/hooks/useSystemConfig'

const useStyles = makeStyles((theme) => ({
  root: {
    width: 380,
    padding: theme.spacing(3, 4),
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 600,
    fontSize: 22,
    lineHeight: 1.2,
    // color: '#333',
    display: 'box',
    lineClamp: 3,
    boxOrient: 'vertical',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
  content: {
    height: 293,
    overflowX: 'hidden',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: 4,
      height: 4,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey.A100,
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey.A200,
    },
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  btn: {
    // width: 144,
    height: 48,
    fontSize: 18,
    fontWeight: 600,
  },
  attentionContent: {
    margin: '24px 0',
    height: '250px',
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    wordBreak: 'break-word',
    fontSize: 16,
  },
}))

function PolicyToast({ open, onSubmit }) {
  const classes = useStyles()
  const { t } = useTranslation()

  const { getFinalConfigById } = useSystemConfig()

  const tipMessage = getFinalConfigById(4)

  return (
    <Dialog
      open={open}
      classes={{ paper: classes.root }}
      BackdropProps={{ invisible: true }}
    >
      <Box>
        <Typography variant="h5" className={classes.title}>
          {tipMessage?.orderTipTitle}
        </Typography>
        <div className={classes.attentionContent}>
          {tipMessage?.orderTipContent}
        </div>
      </Box>
      <Box className={classes.actions}>
        <StyledButton
          type="submit"
          variant="contained"
          color="primary"
          className={classes.btn}
          onClick={onSubmit}
        >
          {t('Landing.policy_btn_enter')}
        </StyledButton>
      </Box>
    </Dialog>
  )
}

export default memo(PolicyToast)
