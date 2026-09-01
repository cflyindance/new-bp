import { Box, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import ShoppingCartOutlinedIcon from '@material-ui/icons/ShoppingCartOutlined'
import { useTranslation } from 'react-i18next'

const useStyles = makeStyles((theme) => ({
  emptyIcon: {
    padding: theme.spacing(3),
    fontSize: 120,
    borderWidth: 4,
    borderStyle: 'solid',
    borderColor: theme.palette.secondary.main,
    borderRadius: '50%',
  },
}))

function EmptyCart() {
  const classes = useStyles()
  const { t } = useTranslation()
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="cemter"
      height="100%"
    >
      <Box textAlign="center" marginBottom={2} marginTop={-7}>
        <ShoppingCartOutlinedIcon
          fontSize="large"
          color="secondary"
          className={classes.emptyIcon}
        />
      </Box>
      <Typography variant="h5" color="textPrimary">
        <Box fontWeight={700} textAlign="center" marginBottom={2}>
          {t('ShoppingCart.empty_title')}
        </Box>
      </Typography>
      <Typography variant="body2" align="center" color="textSecondary">
        {t('ShoppingCart.empty_desc')}
      </Typography>
    </Box>
  )
}

export default EmptyCart
