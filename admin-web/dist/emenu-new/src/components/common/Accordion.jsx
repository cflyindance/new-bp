import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

const MyAccordion = withStyles((theme) => ({
  root: {
    color: theme.palette.common.white,
    backgroundColor: 'transparent',
    boxShadow: 'none',
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&:before': {
      display: 'none',
    },
    '&$expanded': {
      marginTop: 0,
      marginBottom: theme.spacing(2),
    },
  },
  expanded: {},
}))(Accordion)

const MyAccordionSummary = withStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(1),
    minHeight: 41,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    '&$expanded': {
      minHeight: 41,
    },
  },
  content: {
    // fontSize: 18,
    fontWeight: 600,
    alignItems: 'center',
    textTransform: 'uppercase',
    margin: theme.spacing(1, 0),
    '&> .MuiSvgIcon-root': {
      fontSize: 20,
    },
    '&$expanded': {
      margin: theme.spacing(1, 0),
    },
  },
  expandIcon: {
    padding: 0,
    // width: 20,
    // height: 20,
    // fontSize: 20,
    color: theme.palette.common.white,
    backgroundColor: 'transparent',
  },
  expanded: {},
}))(AccordionSummary)

const MyAccordionDetails = withStyles((theme) => ({
  root: {
    padding: theme.spacing(0, 0, 0, 3),
    flexDirection: 'column',
  },
}))(AccordionDetails)

export {
  MyAccordion as Accordion,
  MyAccordionSummary as AccordionSummary,
  MyAccordionDetails as AccordionDetails,
}
