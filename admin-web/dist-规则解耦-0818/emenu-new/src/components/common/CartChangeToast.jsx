import {
  Box,
  Dialog,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core'
import { alpha, makeStyles } from '@material-ui/core/styles'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { serverUrl } from '@/utils/env_var'
import { FeedbackErrorIcon } from './SvgIcons'
import ImgFallback from './ImgFallback'

const useStyles = makeStyles((theme) => ({
  feedback: {
    padding: theme.spacing(3),
    width: 405,
    // opacity: 0.8,
    // backgroundColor: 'rgba(0, 0, 0, 0.8)',
    background:
      'linear-gradient(90deg, rgba(57, 9, 6, 0.7) 0%, rgba(1, 0, 0, 0.7) 50%, rgba(0, 0, 0, 0.7) 100%)',
  },
  feedbackError: {
    color: theme.palette.error.main,
  },
  feedbackIcon: {
    marginTop: 4,
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
    color: alpha(theme.palette.common.white, 0.8),
  },
  feedbackTip: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 1.2,
    color: alpha(theme.palette.common.white, 0.5),
  },
  feedbackBtn: {
    padding: theme.spacing(1.3),
    fontSize: 18,
    // boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
  },
  list: {
    margin: theme.spacing(2, 0),
  },
  listItem: {
    marginBottom: theme.spacing(2),
    padding: 0,
  },
  listIcon: {
    width: 36,
    height: 36,
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadius * 0.5,
  },
  listText: {
    margin: theme.spacing(0, 0, 0, 2),
    // display: 'flex',
    // flexFlow: 'column wrap',
    // justifyContent: 'space-between',
  },
  listTextPrimary: {
    fontWeight: 500,
    fontSize: 14,
    display: 'box',
    overflow: 'hidden',
    lineClamp: 2,
    boxOrient: 'vertical',
    color: alpha(theme.palette.common.white, 0.8),
  },
  listTextSecondary: {
    marginTop: 2,
    fontWeight: 400,
    fontSize: 12,
    color: theme.palette.error.main,
  },
}))

function CartChangeToast({ open, data, onClose }) {
  const classes = useStyles()
  const { t } = useTranslation()

  const handleClose = () => {
    onClose(data)
  }
  return (
    <Dialog
      open={open}
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Paper className={classes.feedback}>
        <Box display="flex" className={classes.feedbackError}>
          <FeedbackErrorIcon className={classes.feedbackIcon} />
          <Box marginLeft={2}>
            <Typography variant="h5" className={classes.feedbackTitle}>
              {t('CartChangeToast.title')}
            </Typography>
            <Typography variant="body1" className={classes.feedbackMessage}>
              {t('CartChangeToast.message')}
            </Typography>
            <Typography variant="body2" className={classes.feedbackTip}>
              {t('CartChangeToast.tip')}
            </Typography>
            <List className={classes.list}>
              {data?.map((e) => (
                <ListItem key={e.id} className={classes.listItem}>
                  <ImgFallback
                    src={serverUrl + e.pic}
                    className={classes.listIcon}
                    itemName={e.name}
                  />
                  <ListItemText
                    classes={{
                      root: classes.listText,
                      primary: classes.listTextPrimary,
                      secondary: classes.listTextSecondary,
                    }}
                    primary={e.name}
                    secondary={t(`CartChangeToast.${e.changedKeys?.[0]}`)}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          className={classes.feedbackBtn}
          onClick={handleClose}
        >
          {t('CartChangeToast.button')}
        </Button>
      </Paper>
    </Dialog>
  )
}

export default memo(CartChangeToast)
