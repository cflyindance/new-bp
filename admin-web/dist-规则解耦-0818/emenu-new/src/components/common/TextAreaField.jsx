import { TextField } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

const styles = (theme) => ({
  /* Styles applied to the root element. */
  root: {
    borderRadius: 15,
    backgroundColor: theme.palette.common.white,
    '& $notchedOutline': {
      borderWidth: 0,
    },
    // '&:hover $notchedOutline': {
    //   borderWidth: 0,
    // },
    '&$focused $notchedOutline': {
      borderWidth: 3 / 2,
      borderColor: '#828282',
    },
  },
  /* Styles applied to the root element if the component is focused. */
  focused: {},
  /* Styles applied to the root element if `disabled={true}`. */
  disabled: {},
  /* Styles applied to the root element if `error={true}`. */
  error: {},
  /* Styles applied to the `NotchedOutline` element. */
  notchedOutline: {},
})

function TextAreaField(props) {
  const { classes, ...other } = props
  return <TextField InputProps={{ classes }} {...other} />
}

export default withStyles(styles)(TextAreaField)
