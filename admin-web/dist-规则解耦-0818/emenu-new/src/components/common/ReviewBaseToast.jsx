import {
  Box,
  Dialog,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core'
import { alpha, makeStyles } from '@material-ui/core/styles'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { serverUrl } from '@/utils/env_var'
import { ReviewOrderIcon } from './SvgIcons'
import ImgFallback from './ImgFallback'
import StyledButton from './StyledButton'
import CloseIcon from '@material-ui/icons/Close'
import useTranslateOptions from '@/hooks/useTranslateOptions'

const useStyles = makeStyles((theme) => ({
  feedback: {
    padding: theme.spacing(3),
    width: 405,
    backgroundColor: 'rgba(12, 12, 12, 0.8)',
  },
  feedbackError: {
    color: theme.palette.secondary.main,
    justifyContent: 'space-between',
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
  feedbackSubtitle: {
    fontWeight: 700,
    marginTop: 4,
    fontSize: 14,
    lineHeight: 1.2,
    textAlign: 'left',
    color: alpha(theme.palette.common.white, 0.5),
  },
  closeIcon: {
    color: '#fff',
  },
  feedbackMessage: {
    marginTop: theme.spacing(3),
    fontSize: 14,
    fontWeight: 700,
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
    height: 52,
    fontSize: 18,
    fontWeight: 600,
    '&:first-child': {
      marginRight: theme.spacing(2),
    },
  },
  list: {
    margin: theme.spacing(1, 0),
  },
  listItem: {
    marginBottom: theme.spacing(2),
    padding: 0,
  },
  listIcon: {
    flex: '0 0 36px',
    width: 36,
    height: 36,
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadius * 0.5,
  },
  listText: {
    margin: theme.spacing(0, 0, 0, 2),
    wordBreak: 'break-word',
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
    color: alpha(theme.palette.common.white, 0.6),
  },
}))

function ReviewBaseToast(props) {
  const {
    open,
    data,
    onClose,
    samePotDefaultAddedMoney,
    samePotInfo,
    onSubmit,
    isAutoOrderHotPot,
    openReviseModal,
  } = props
  const classes = useStyles()
  const { t } = useTranslation()
  const combo = data?.[0]?.combo
  const { renderItemOption } = useTranslateOptions()

  const handleReviseSoup = () => {
    onClose()
    openReviseModal()
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
          <ReviewOrderIcon className={classes.feedbackIcon} />
          <Box marginLeft={2}>
            <Typography variant="h5" className={classes.feedbackTitle}>
              {t('ReviewBaseToast.title')}
            </Typography>
            {samePotDefaultAddedMoney > 0 && (
              <Typography variant="h5" className={classes.feedbackSubtitle}>
                {t('ReviewBaseToast.subTitle', {
                  item: t(samePotInfo.dishId, {
                    defaultValue: samePotInfo.dishId,
                    ns: 'dish',
                  }),
                  num: samePotInfo?.num,
                  price: '$' + samePotDefaultAddedMoney,
                })}
              </Typography>
            )}
            <Typography variant="h5" className={classes.feedbackMessage}>
              {t(combo?.id, { defaultValue: combo?.name, ns: 'dish' })}
            </Typography>
            <List className={classes.list}>
              {data?.map((e) => {
                return (
                  <ListItem key={e.key} className={classes.listItem}>
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
                      primary={t(e.id, { defaultValue: e.name, ns: 'dish' })}
                      secondary={renderItemOption(e)?.join()}
                    />
                  </ListItem>
                )
              })}
            </List>
          </Box>
          <CloseIcon className={classes.closeIcon} onClick={onClose} />
        </Box>
        <Box display="flex">
          <StyledButton
            variant="contained"
            className={classes.feedbackBtn}
            onClick={handleReviseSoup}
          >
            {t('OrderBase.editBase')}
          </StyledButton>
          <StyledButton
            type="submit"
            variant="contained"
            color="primary"
            className={classes.feedbackBtn}
            onClick={onSubmit}
          >
            {t(
              isAutoOrderHotPot
                ? 'ReviewBaseToast.btn_continue'
                : 'ReviewBaseToast.btn_sendCart'
            )}
          </StyledButton>
        </Box>
      </Paper>
    </Dialog>
  )
}

export default memo(ReviewBaseToast)
