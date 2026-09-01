import { CardHeader, withStyles } from '@material-ui/core'

export const CardHead = withStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  title: {
    fontWeight: 600,
    fontSize: 18,
    lineHeight: 1.2,
  },
  subheader: {
    marginTop: theme.spacing(1),
    fontSize: 16,
    lineHeight: 1.2,
  },
  action: {
    margin: 0,
  },
}))(CardHeader)
