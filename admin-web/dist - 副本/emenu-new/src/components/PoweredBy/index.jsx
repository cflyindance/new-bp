import menusofuLogo from '@/assets/image/menusifu_240_240.png'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.common.white,
    fontSize: 24,
  },
  logo: {
    width: 32,
    height: 32,
    margin: '0 8px',
  },
  right_text: {
    fontWeight: 'bold',
  },
}))
const PoweredBy = () => {
  const classes = useStyles()

  return (
    <div className={classes.container}>
      <div>Powered by</div>
      <img src={menusofuLogo} className={classes.logo} />
      <div className={classes.right_text}>Menusifu</div>
    </div>
  )
}

export default PoweredBy
