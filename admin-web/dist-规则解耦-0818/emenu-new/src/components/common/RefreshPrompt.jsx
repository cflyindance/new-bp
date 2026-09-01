import { Box, Dialog, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import StyledButton from './StyledButton'

const useStyles = makeStyles((theme) => ({
  main: {
    maxWidth: 450,
    padding: theme.spacing(3),
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.2,
    marginBottom: theme.spacing(2),
  },
  content: {
    marginBottom: theme.spacing(3),
    fontSize: 18,
    lineHeight: 1.2,
  },
  btn: {
    minHeight: 48,
    fontSize: 18,
    fontWeight: 600,
    '&:first-child': {
      marginRight: theme.spacing(2),
    },
  },
}))

function RefreshPrompt({ open, handleClose, closeSetting }) {
  const classes = useStyles()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleRefresh = () => {
    // window.location.reload()
    handleClose()
    closeSetting()
    navigate('/', { replace: true })
  }
  return (
    <Dialog open={open}>
      <Paper className={classes.main}>
        <Box className={classes.title}>{t('RefreshPrompt.title')}</Box>
        <Box className={classes.content}>{t('RefreshPrompt.content')}</Box>
        <Box display="flex">
          <StyledButton
            variant="outlined"
            // color="primary"
            className={classes.btn}
            onClick={handleClose}
          >
            {t('RefreshPrompt.cancel')}
          </StyledButton>
          <StyledButton
            type="submit"
            variant="contained"
            color="primary"
            className={classes.btn}
            onClick={handleRefresh}
          >
            {t('RefreshPrompt.submit')}
          </StyledButton>
        </Box>
      </Paper>
    </Dialog>
  )
}

export default memo(RefreshPrompt)
