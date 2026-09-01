import {
  Box,
  makeStyles,
  Button,
  Dialog,
  Typography,
  Card,
  CircularProgress,
} from '@material-ui/core'
import { AddRounded, AttachMoneyRounded } from '@material-ui/icons'
import { createRef, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getStorageValue } from '@/utils/storage'
import { sortOrders } from '@/services/orders'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useFetchOrder } from '@/hooks/useFetchOrder'

const useStyles = makeStyles((theme) => ({
  modalWrapper: {
    width: 500,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.2,
    color: '#333',
    padding: '16px',
  },
  ordersList: {
    maxHeight: 405,
    paddingRight: theme.spacing(1.5),
    overflowY: 'auto',
    scrollBehavior: 'smooth',
    // 自定义scroll bar 安卓pad下性能极差
    // '&::-webkit-scrollbar': {
    //   width: 4,
    //   height: 4,
    //   borderRadius: theme.shape.borderRadius,
    //   backgroundColor: theme.palette.grey.A200,
    // },
    // '&::-webkit-scrollbar-thumb': {
    //   borderRadius: theme.shape.borderRadius,
    //   backgroundColor: theme.palette.primary.light,
    // },
  },
  orderCard: {
    borderRadius: 5,
    // border: '2px solid #E0E0E0',
    borderWidth: 2,
    margin: theme.spacing(0, 0, 2, 2),
  },
  disableCard: {
    background: '#F4F4F5',
    opacity: 0.5,
  },
  orderCardActive: {
    borderColor: theme.palette.primary.main,
  },
  orderCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#F4F4F5',
  },
  orderCardAction: {
    opacity: 1,
    backgroundColor: theme.palette.common.white,
    '&:hover $orderCardFocus': {
      // opacity: 0.1,
      '@media (hover: none)': {
        // opacity: 0.1,
      },
    },
  },
  childOrder: {
    marginLeft: 48,
  },
  orderCardFocus: {},
  staff: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
    color: '#333',
  },
  staffDivider: {
    width: 8,
    height: 2,
    backgroundColor: '#BDBDBD',
    margin: theme.spacing('auto', 1),
  },
  price: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
    color: '#333',
  },
  time: {
    lineHeight: 1.2,
  },
  product: {
    lineHeight: 1.2,
    color: '#2196F3',
    textAlign: 'right',
  },
  split: {
    lineHeight: 1.2,
    color: '#FD9834',
    textAlign: 'right',
  },
  btn: {
    height: 51,
    fontSize: 18,
    fontWeight: 600,
    borderRadius: 5,
    boxShadow: 'none',
    '&:first-child': {
      marginRight: theme.spacing(2),
    },
  },
  btnOutlined: {
    '&$btnOutlined': {
      border: '2px solid #E0E0E0',
    },
  },
  btnPrimary: {
    // boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
    '&$btnDisabled': {
      color: theme.palette.common.white,
      backgroundColor: theme.palette.primary.main,
    },
  },
  btnDisabled: {
    opacity: 0.5,
  },
  operationRow: {
    padding: '16px',
  },
  operationBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
  },
}))

function ChooseOrderDialog(props) {
  const { open, currentOrder, orders, onClose, onEnter } = props
  const classes = useStyles()
  const { t } = useTranslation()
  const [active, setActive] = useState({})
  const staffs = getStorageValue('emenu_staff')
  const { getFinalConfigById } = useSystemConfig()
  const { isInvalidOrder } = useFetchOrder()

  const noMultipleOrder = getFinalConfigById(19)

  const refs = useMemo(
    () =>
      orders.reduce((acc, order) => {
        acc[order.id] = createRef()
        return acc
      }, {}),
    [orders]
  )

  useEffect(() => {
    const currentOrderInList = orders?.find((e) => e.id === currentOrder?.id)
    if (open && currentOrderInList?.id > 0) {
      setActive(currentOrderInList)
    } else {
      setActive({})
    }
    return () => {
      setActive({})
    }
  }, [open, orders, currentOrder])

  const ordersList = sortOrders(orders).map((e) => {
    if (e.isInOtherTable) {
      return null
    }
    const notEmenu = e.productLine !== 'EMENU'
    const isParent = e.isParentOrder
    const subOrder = e.parentOrderId > 0
    const invalidOrder = isInvalidOrder(e)
    const disabled = notEmenu || invalidOrder
    const parentOrderId = e.parentOrderId
    // safari 时间格式兼容
    const createTime = e.createTime.replaceAll('-', '/')

    const staffByUserId = staffs?.find((s) => s.user.id === e.serverId)?.name
    const staffById = staffs?.find((s) => s.id === e.serverId)?.name
    return (
      <Card
        ref={refs[e.id]}
        key={e.id}
        variant="outlined"
        className={`${classes.orderCard} ${
          active.id === e.id ? classes.orderCardActive : ''
        } ${parentOrderId && !e.isParentOrderInOtherTable ? classes.childOrder : ''}`}
      >
        <div
          className={`${disabled ? classes.disableCard : ''}`}
          // disabled={disabled}
          // disableTouchRipple
          // classes={{
          //   root: disabled
          //     ? classes.orderCardDisabled
          //     : classes.orderCardAction,
          //   focusHighlight: classes.orderCardFocus,
          // }}
          onClick={() => {
            if (disabled) return
            setActive(e.id === active.id ? {} : e)
          }}
        >
          <Box paddingX={3} paddingY={2}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body1" className={classes.staff}>
                # {e.orderNumber}
                <span className={classes.staffDivider}></span>
                {staffByUserId || staffById || e.serverId}
              </Typography>
              <Typography variant="subtitle1" className={classes.price}>
                <AttachMoneyRounded fontSize="small" />
                {e.totalPrice.toFixed(2)}
              </Typography>
            </Box>
            <Box
              marginTop={1}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" className={classes.time}>
                {t('AdminSetting.order_start_time')}
                {new Date(createTime).toLocaleTimeString()}
              </Typography>
              {notEmenu ? (
                <Typography variant="subtitle2" className={classes.product}>
                  {t('AdminSetting.order_type', { type: e.productLine })}
                </Typography>
              ) : isParent ? (
                <Typography variant="subtitle2" className={classes.split}>
                  {t('AdminSetting.split_order')}
                </Typography>
              ) : subOrder ? (
                <Typography variant="subtitle2" className={classes.split}>
                  {t('AdminSetting.split_sub')}
                </Typography>
              ) : invalidOrder ? (
                <Typography variant="subtitle2" className={classes.product}>
                  {t(`AdminSetting.order_status_${e.status.toLowerCase()}`)}
                </Typography>
              ) : null}
            </Box>
          </Box>
        </div>
      </Card>
    )
  })

  const [loading, setLoading] = useState(false)
  const onClickEnter = async () => {
    setLoading(true)
    try {
      await onEnter(active)
    } catch (error) {
      console.log(error)
    }
    setLoading(false)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionProps={{
        onEnter: () => {
          refs[currentOrder?.id]?.current?.scrollIntoView()
        },
      }}
    >
      <div className={classes.modalWrapper}>
        <Typography variant="h6" className={classes.title}>
          {t('AdminSetting.select_order_title')}
        </Typography>
        <div className={classes.ordersList}>{ordersList}</div>
        <div className={classes.operationRow}>
          {!noMultipleOrder?.open && (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              classes={{
                root: classes.btn,
                containedPrimary: classes.btnPrimary,
                disabled: classes.btnDisabled,
              }}
              disabled={active.id > 0}
              onClick={onEnter.bind(this, {})}
              startIcon={<AddRounded />}
            >
              {t('AdminSetting.btn_new_order')}
            </Button>
          )}

          <div className={classes.operationBtn}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              classes={{
                root: classes.btn,
                outlinedPrimary: classes.btnOutlined,
              }}
              onClick={onClose}
            >
              {t('AdminSetting.btn_cancel')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              classes={{
                root: classes.btn,
                containedPrimary: classes.btnPrimary,
                disabled: classes.btnDisabled,
              }}
              disabled={!active.id || loading}
              onClick={onClickEnter}
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> : null
              }
            >
              {t('AdminLogin.btn_enter')}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export default ChooseOrderDialog
