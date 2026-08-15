import { makeStyles } from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const useStyles = makeStyles(() => ({
  emptyOrderList: {
    height: '100%',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerMessage: {
    padding: '24px 72px',
    backgroundColor: '#fff',
    borderRadius: 8,
    color: '#000',
    fontSize: 16,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 8,
  },
  subTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  backButton: {
    color: '#fff',
    backgroundColor: '#96272F',
    borderRadius: 5,
    height: 51,
    width: '100%',
    textAlign: 'center',
    lineHeight: '51px',
    marginTop: 16,
  },
}))

const EmptyOrder = () => {
  const classes = useStyles()
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={classes.emptyOrderList}>
      <div className={classes.innerMessage}>
        <div className={classes.title}>{t('Order.no_dish')}</div>
        <div className={classes.subTitle}>{t('Order.check_menu_set')}：</div>
        <div>{t('Order.time_zone')}</div>
        <div>{t('Order.menu_exist')}</div>
        <div>{t('Order.menu_hide')}</div>
        <div>{t('Order.menu_time')}</div>
        <div className={classes.backButton} onClick={() => navigate('/')}>
          {t('Order.back_home')}
        </div>
      </div>
    </div>
  )
}

export default EmptyOrder
