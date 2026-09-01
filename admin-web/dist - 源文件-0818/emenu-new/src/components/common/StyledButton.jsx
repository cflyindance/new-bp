import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { memo } from 'react'

const StyledButton = withStyles((theme) => ({
  root: {
    padding: 0,
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderRadius: 5,
    // '&.MuiButton-outlined': {
    //   borderWidth: 2,
    // },
  },
  outlined: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    '&:hover': {
      borderWidth: 2,
    },
  },
  outlinedPrimary: {
    borderColor: theme.palette.primary.main,
  },
}))(Button)

export default memo(StyledButton)
