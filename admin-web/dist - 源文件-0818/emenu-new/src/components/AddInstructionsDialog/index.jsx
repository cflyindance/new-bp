import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import {
  CloseRounded as CloseIcon,
  ArrowForwardIosRounded as ArrowForwardIcon,
} from '@material-ui/icons'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBoolean } from 'ahooks'
import TextAreaField from '../common/TextAreaField'
import KeyBoardInstance from '@/utils/KeyBoardBounce'

const useStyles = makeStyles((theme) => ({
  addNoteBtn: ({ type }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    height: 51,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: '19px',
    letterSpacing: -0.4,
    borderRadius: 0,
    backgroundColor: type === 'cart' ? '#F9F9FA' : 'none',
  }),
  paper: {
    width: 500,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
  },
  title: {
    paddingTop: theme.spacing(4),
    '& > .MuiTypography-root': {
      display: 'flex',
      alignItems: 'center',
      // fontWeight: 700,
      // fontSize: 20,
      lineHeight: 1.2,
      letterSpacing: -0.4,
    },
  },
  closeIcon: {
    '& > .MuiSvgIcon-root': {
      fontSize: 32,
    },
  },
  actions: {
    justifyContent: 'center',
    padding: theme.spacing(2, 3, 3),
  },
  submit: {
    width: 280,
    height: 44,
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.2,
  },
}))

export default function AddInstructionsDialog({ type, content, onChange }) {
  const classes = useStyles({ type })
  const textRef = useRef(null)
  const { t } = useTranslation()
  const [open, { setTrue, setFalse }] = useBoolean()
  const [instructions, setInstructions] = useState(content)

  const handleClose = (event, reason) => {
    if (reason !== 'backdropClick') {
      setFalse()
    }
  }
  const handleChangeNote = (e) => {
    setInstructions(e.target.value)
  }

  const handleSubmit = () => {
    onChange(instructions)
    setFalse()
  }

  return (
    <>
      <Button
        fullWidth
        className={classes.addNoteBtn}
        endIcon={<ArrowForwardIcon />}
        onClick={setTrue}
      >
        <Box
          component="span"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
        >
          {content || t('Order.add_instructions_btn')}
        </Box>
      </Button>
      <Dialog
        classes={{
          paper: classes.paper,
        }}
        onClose={handleClose}
        open={open}
      >
        <DialogTitle className={classes.title}>
          <ButtonBase className={classes.closeIcon} onClick={handleClose}>
            <CloseIcon />
          </ButtonBase>
          <Box component="strong" marginLeft={1}>
            {t('Order.add_instructions_title')}
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextAreaField
            inputRef={textRef}
            fullWidth
            multiline
            minRows={4}
            maxRows={4}
            inputProps={{
              maxLength: 150,
            }}
            variant="outlined"
            className={classes.optionNote}
            placeholder={t('Order.add_instructions_placeholder')}
            value={instructions}
            onChange={handleChangeNote}
            onFocus={() => {
              KeyBoardInstance.checkIfNeedBounce(textRef.current)
            }}
            onBlur={() => {
              KeyBoardInstance.removeBoxFromBody()
            }}
          />
        </DialogContent>
        <DialogActions className={classes.actions}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            className={classes.submit}
            onClick={handleSubmit}
          >
            {t('Order.add_instructions_save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
