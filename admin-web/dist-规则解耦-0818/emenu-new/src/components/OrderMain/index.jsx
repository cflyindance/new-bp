import { Container, Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  OrderMain: {
    paddingRight: 0,
    paddingBottom: theme.spacing(3),
    overflowX: 'hidden',
    '&::-webkit-scrollbar': {
      width: 5,
      height: 5,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey.A200,
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.primary.main,
    },
  },
}))

function OrderMain({ children }) {
  const classes = useStyles()

  return (
    <Container maxWidth={false} className={classes.OrderMain}>
      <Grid container spacing={3}>
        {children}
      </Grid>
    </Container>
  )
}

export default OrderMain
